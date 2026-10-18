"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { validasiEmailStudent, validasiEmailKampusAsync } from "./validasi-email";
import { createSessionCookie, clearSessionCookie, findUserByEmail, Role } from "./session";

import { SEED_MAHASISWA, SEED_DOSEN } from "@/lib/db/seed-data";
import { prisma } from "@/lib/db";

const loginCredentialsSchema = z.object({
  email: z.string().email("Format alamat email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
});

export type ActionState = {
  success: boolean;
  message?: string;
  redirectTo?: string;
};

export async function loginWithCredentials(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");

  const validated = loginCredentialsSchema.safeParse({
    email: emailRaw,
    password: passwordRaw,
  });

  if (!validated.success) {
    return {
      success: false,
      message: validated.error.errors[0]?.message || "Input tidak valid.",
    };
  }

  const { email, password } = validated.data;
  const user = await findUserByEmail(email);

  if (!user) {
    return {
      success: false,
      message: "Email atau kata sandi tidak sesuai.",
    };
  }

  if (user.peran === "MAHASISWA") {
    return {
      success: false,
      message:
        "Mahasiswa wajib masuk menggunakan Google OAuth dengan akun email student kampus.",
    };
  }

  if (!user.aktif) {
    return {
      success: false,
      message: "Akun ini telah dinonaktifkan. Hubungi administrator sistem.",
    };
  }

  // Verifikasi kata sandi
  let isPasswordValid = false;
  if (user.passwordHash) {
    try {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } catch {
      isPasswordValid = false;
    }
  }

  // Fallback untuk kata sandi demo hanya pada lingkungan pengembangan jika flag aktif dan DEMO_PASSWORD disetel
  const demoPassword = process.env.DEMO_PASSWORD;
  if (
    !isPasswordValid &&
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true" &&
    Boolean(demoPassword && password === demoPassword)
  ) {
    isPasswordValid = true;
  }

  if (!isPasswordValid) {
    return {
      success: false,
      message: "Email atau kata sandi tidak sesuai.",
    };
  }

  // Cari nama tampilan
  let displayName = "Pengguna SIAKAD";
  let subId = undefined;

  if (user.peran === "ADMIN") {
    displayName = "Administrator Akademik";
  } else if (user.peran === "DOSEN") {
    const dsn = SEED_DOSEN.find((d) => d.email.toLowerCase() === email.toLowerCase());
    if (dsn) {
      displayName = dsn.nama;
      subId = dsn.id;
    }
  }

  // Buat sesi
  await createSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.peran as Role,
    name: displayName,
    subId,
  });

  // Catat audit login
  try {
    await prisma.logAudit.create({
      data: {
        penggunaId: user.id,
        aksi: "LOGIN_PASSWORD",
        entitas: "Pengguna",
        entitasId: user.id,
        nilaiBaru: `Login berhasil sebagai ${user.peran}`,
      },
    });
  } catch {
    // Database offline
  }

  const destination =
    user.peran === "ADMIN" ? "/admin/dashboard" : "/dosen/dashboard";

  return {
    success: true,
    message: "Login berhasil. Mengalihkan...",
    redirectTo: destination,
  };
}

const loginStudentSchema = z.object({
  email: z.string().email("Format alamat email tidak valid."),
});

export async function loginStudentGoogle(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const emailRaw = formData.get("email");

  const validated = loginStudentSchema.safeParse({ email: emailRaw });
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.errors[0]?.message || "Alamat email tidak valid.",
    };
  }

  const email = validated.data.email;

  // 1. Validasi domain email student dan allowlist di server
  const check = await validasiEmailKampusAsync({
    email,
    emailVerified: true,
  });


  if (!check.valid || !check.normalizedEmail) {
    return {
      success: false,
      message: check.pesanError || "Domain email student tidak valid.",
    };
  }

  // 2. Periksa apakah terdaftar di tabel Mahasiswa
  let mhs = null;
  try {
    mhs = await prisma.mahasiswa.findUnique({
      where: { email: check.normalizedEmail },
    });
  } catch {
    // Fallback ke seed
  }

  if (!mhs) {
    mhs =
      SEED_MAHASISWA.find(
        (m) => m.email.toLowerCase() === check.normalizedEmail
      ) || null;
  }

  // 3. Batasan Kritis: DILARANG membuat akun otomatis
  if (!mhs) {
    return {
      success: false,
      message: "Email ini belum terdaftar sebagai mahasiswa. Hubungi bagian akademik.",
    };
  }

  // Buat sesi mahasiswa
  await createSessionCookie({
    userId: `usr-${mhs.id}`,
    email: mhs.email,
    role: "MAHASISWA",
    name: mhs.nama,
    subId: mhs.id,
  });

  // Catat audit
  try {
    await prisma.logAudit.create({
      data: {
        aksi: "LOGIN_GOOGLE",
        entitas: "Mahasiswa",
        entitasId: mhs.id,
        nilaiBaru: `Login Google mahasiswa NIM ${mhs.nim}`,
      },
    });
  } catch {
    // Database offline
  }

  return {
    success: true,
    message: "Login berhasil.",
    redirectTo: "/mahasiswa/dashboard",
  };
}

export async function logoutAction() {
  await clearSessionCookie();
}
