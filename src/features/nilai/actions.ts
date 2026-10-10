"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { NilaiStore } from "./nilai-store";
import { requireAuth, requireRole } from "@/lib/auth/session";

const KomponenSchema = z.object({
  kelasId: z.string().min(1, "ID Kelas wajib diisi"),
  komponen: z
    .array(
      z.object({
        nama: z.string().min(1, "Nama komponen wajib diisi"),
        bobotPersen: z.number().min(1).max(100),
      })
    )
    .min(1, "Minimal harus ada 1 komponen nilai"),
});

export async function updateKomponenAction(data: z.infer<typeof KomponenSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen dan admin yang diizinkan." };
  }

  const parsed = KomponenSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  // Otorisasi: Dosen hanya dapat mengubah komponen kelas yang diampunya
  const kelas = NilaiStore.getKelasNilai(parsed.data.kelasId);
  if (session.role === "DOSEN" && session.subId && kelas && kelas.dosenId !== session.subId) {
    return { success: false, message: "Akses ditolak. Anda bukan dosen pengampu kelas ini." };
  }

  const hasil = NilaiStore.updateKomponen(parsed.data.kelasId, parsed.data.komponen);
  if (hasil.success) {
    revalidatePath("/dosen/nilai");
    revalidatePath(`/dosen/nilai/${parsed.data.kelasId}`);
  }
  return hasil;
}

const SimpanDrafSchema = z.object({
  kelasId: z.string().min(1, "ID Kelas wajib diisi"),
  nilaiData: z.array(
    z.object({
      krsDetailId: z.string().min(1),
      skorKomponen: z.record(z.string(), z.number().min(0).max(100)),
    })
  ),
});

export async function simpanDrafNilaiAction(data: z.infer<typeof SimpanDrafSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen dan admin yang diizinkan." };
  }

  const parsed = SimpanDrafSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Data nilai tidak valid" };
  }

  // Otorisasi: Dosen hanya dapat menyimpan nilai kelas yang diampunya
  const kelas = NilaiStore.getKelasNilai(parsed.data.kelasId);
  if (session.role === "DOSEN" && session.subId && kelas && kelas.dosenId !== session.subId) {
    return { success: false, message: "Akses ditolak. Anda bukan dosen pengampu kelas ini." };
  }

  const hasil = NilaiStore.simpanDraf(parsed.data.kelasId, parsed.data.nilaiData);
  if (hasil.success) {
    revalidatePath("/dosen/nilai");
    revalidatePath(`/dosen/nilai/${parsed.data.kelasId}`);
  }
  return hasil;
}

const FinalisasiSchema = z.object({
  kelasId: z.string().min(1, "ID Kelas wajib diisi"),
});

export async function finalisasiNilaiAction(data: z.infer<typeof FinalisasiSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat memfinalisasi nilai." };
  }

  const parsed = FinalisasiSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "Parameter tidak valid" };
  }

  // Otorisasi: Dosen hanya dapat memfinalisasi kelas yang diampunya
  const kelas = NilaiStore.getKelasNilai(parsed.data.kelasId);
  if (session.role === "DOSEN" && session.subId && kelas && kelas.dosenId !== session.subId) {
    return { success: false, message: "Akses ditolak. Anda bukan dosen pengampu kelas ini." };
  }

  const hasil = NilaiStore.finalisasiNilai(parsed.data.kelasId, session.email);
  if (hasil.success) {
    revalidatePath("/dosen/nilai");
    revalidatePath(`/dosen/nilai/${parsed.data.kelasId}`);
    revalidatePath("/admin/nilai");
    revalidatePath("/mahasiswa/nilai");
  }
  return hasil;
}

const KoreksiAdminSchema = z.object({
  kelasId: z.string().min(1, "ID Kelas wajib diisi"),
  krsDetailId: z.string().min(1, "ID KRS Detail wajib diisi"),
  skorKomponenBaru: z.record(z.string(), z.number().min(0).max(100)),
  alasan: z.string().min(5, "Alasan koreksi nilai wajib diisi minimal 5 karakter"),
});

export async function koreksiNilaiAdminAction(data: z.infer<typeof KoreksiAdminSchema>) {
  const session = await requireRole(["ADMIN"]);

  const parsed = KoreksiAdminSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  const hasil = NilaiStore.koreksiNilaiAdmin({
    kelasId: parsed.data.kelasId,
    krsDetailId: parsed.data.krsDetailId,
    skorKomponenBaru: parsed.data.skorKomponenBaru,
    alasan: parsed.data.alasan,
    adminId: session.userId,
    adminNama: session.email,
  });

  if (hasil.success) {
    revalidatePath("/admin/nilai");
    revalidatePath("/dosen/nilai");
    revalidatePath("/mahasiswa/nilai");
  }
  return hasil;
}
