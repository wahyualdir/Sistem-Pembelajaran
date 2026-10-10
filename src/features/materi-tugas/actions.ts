"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MateriTugasStore } from "./materi-tugas-store";
import { requireAuth } from "@/lib/auth/session";

const TambahMateriSchema = z.object({
  kelasId: z.string().min(1, "ID Kelas wajib diisi"),
  judul: z.string().min(3, "Judul materi minimal 3 karakter"),
  deskripsi: z.string().optional(),
  pathFile: z.string().min(3, "Tautan/berkas materi wajib diisi"),
  ukuranMb: z.number().min(0.1, "Ukuran file minimal 0.1 MB"),
});

export async function tambahMateriAction(data: z.infer<typeof TambahMateriSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat mengunggah materi." };
  }

  const parsed = TambahMateriSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    MateriTugasStore.tambahMateri({
      kelasId: parsed.data.kelasId,
      judul: parsed.data.judul,
      deskripsi: parsed.data.deskripsi,
      pathFile: parsed.data.pathFile,
      ukuranMb: parsed.data.ukuranMb,
      diunggahOleh: session.name || "Dosen Pengampu",
    });
    revalidatePath("/dosen/materi-tugas");
    revalidatePath("/mahasiswa/tugas");
    return { success: true, message: "Materi perkuliahan berhasil diunggah." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal mengunggah materi" };
  }
}

const TambahTugasSchema = z.object({
  kelasId: z.string().min(1, "ID Kelas wajib diisi"),
  judul: z.string().min(3, "Judul tugas minimal 3 karakter"),
  deskripsi: z.string().min(5, "Deskripsi tugas minimal 5 karakter"),
  tenggat: z.string().min(1, "Tenggat waktu wajib diisi"),
});

export async function tambahTugasAction(data: z.infer<typeof TambahTugasSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat membuat tugas." };
  }

  const parsed = TambahTugasSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    MateriTugasStore.tambahTugas({
      kelasId: parsed.data.kelasId,
      judul: parsed.data.judul,
      deskripsi: parsed.data.deskripsi,
      tenggat: parsed.data.tenggat,
    });
    revalidatePath("/dosen/materi-tugas");
    revalidatePath("/mahasiswa/tugas");
    return { success: true, message: "Tugas perkuliahan berhasil dibuat dengan tenggat waktu." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal membuat tugas" };
  }
}

const KumpulkanTugasSchema = z.object({
  tugasId: z.string().min(1, "ID Tugas wajib diisi"),
  pathFile: z.string().min(3, "Tautan atau nama berkas tugas wajib diisi"),
});

export async function kumpulkanTugasAction(data: z.infer<typeof KumpulkanTugasSchema>) {
  const session = await requireAuth();
  if (session.role !== "MAHASISWA" || !session.subId) {
    return { success: false, message: "Akses ditolak. Hanya mahasiswa yang dapat mengumpulkan tugas." };
  }

  const parsed = KumpulkanTugasSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    const kumpul = MateriTugasStore.kumpulkanTugas({
      tugasId: parsed.data.tugasId,
      mahasiswaId: session.subId,
      pathFile: parsed.data.pathFile,
    });
    revalidatePath("/mahasiswa/tugas");
    revalidatePath("/dosen/materi-tugas");
    const infoTerlambat = kumpul.terlambat ? " (Catatan: Terlambat dikumpulkan)" : "";
    return { success: true, message: `Tugas berhasil dikumpulkan${infoTerlambat}.` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal mengumpulkan tugas" };
  }
}

const BeriNilaiTugasSchema = z.object({
  pengumpulanId: z.string().min(1, "ID Pengumpulan wajib diisi"),
  nilai: z.number().min(0).max(100, "Nilai tugas harus antara 0 dan 100"),
  catatanDosen: z.string().min(3, "Catatan umpan balik minimal 3 karakter"),
});

export async function beriNilaiTugasAction(data: z.infer<typeof BeriNilaiTugasSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat menilai tugas." };
  }

  const parsed = BeriNilaiTugasSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    MateriTugasStore.beriNilaiTugas({
      pengumpulanId: parsed.data.pengumpulanId,
      nilai: parsed.data.nilai,
      catatanDosen: parsed.data.catatanDosen,
    });
    revalidatePath("/dosen/materi-tugas");
    revalidatePath("/mahasiswa/tugas");
    return { success: true, message: "Nilai dan catatan evaluasi tugas berhasil disimpan." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal menilai tugas" };
  }
}
