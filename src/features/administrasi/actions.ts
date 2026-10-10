"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AdministrasiStore, TargetPengumuman, JenisKegiatanKalender } from "./administrasi-store";
import { requireAuth, requireRole } from "@/lib/auth/session";

const TambahPengumumanSchema = z.object({
  judul: z.string().min(5, "Judul pengumuman minimal 5 karakter"),
  isi: z.string().min(10, "Isi pengumuman minimal 10 karakter"),
  target: z.enum(["SEMUA", "PRODI", "ANGKATAN", "KELAS"]),
  targetId: z.string().optional(),
  targetNama: z.string().optional(),
});

export async function tambahPengumumanAction(data: z.infer<typeof TambahPengumumanSchema>) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "DOSEN") {
    return { success: false, message: "Akses ditolak. Hanya admin dan dosen yang dapat membuat pengumuman." };
  }

  const parsed = TambahPengumumanSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    AdministrasiStore.tambahPengumuman({
      judul: parsed.data.judul,
      isi: parsed.data.isi,
      target: parsed.data.target as TargetPengumuman,
      targetId: parsed.data.targetId || null,
      targetNama: parsed.data.targetNama || undefined,
      penulisId: session.userId,
      namaPenulis: session.name || session.email,
    });

    revalidatePath("/admin/pengumuman");
    revalidatePath("/mahasiswa/pengumuman");
    revalidatePath("/mahasiswa/dashboard");
    return { success: true, message: "Pengumuman berhasil diterbitkan." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal menerbitkan pengumuman" };
  }
}

export async function tandaiPengumumanDibacaAction(pengumumanId: string) {
  const session = await requireAuth();
  try {
    AdministrasiStore.tandaiDibaca(pengumumanId, session.userId);
    revalidatePath("/mahasiswa/pengumuman");
    return { success: true };
  } catch {
    return { success: false };
  }
}

const TambahKalenderSchema = z.object({
  jenis: z.enum(["KRS", "UTS", "UAS", "LIBUR", "BAYAR_UKT"]),
  keterangan: z.string().min(5, "Keterangan kegiatan minimal 5 karakter"),
  mulai: z.string().min(1, "Tanggal mulai wajib diisi"),
  selesai: z.string().min(1, "Tanggal selesai wajib diisi"),
});

export async function tambahKalenderAction(data: z.infer<typeof TambahKalenderSchema>) {
  await requireRole(["ADMIN"]);

  const parsed = TambahKalenderSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    AdministrasiStore.tambahKalender(parsed.data as {
      jenis: JenisKegiatanKalender;
      keterangan: string;
      mulai: string;
      selesai: string;
    });

    revalidatePath("/admin/kalender");
    revalidatePath("/mahasiswa/krs");
    return { success: true, message: "Agenda kegiatan kalender akademik berhasil ditambahkan." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal menambah kalender" };
  }
}
