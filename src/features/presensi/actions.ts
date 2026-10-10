"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PresensiStore, StatusKehadiran } from "./presensi-store";
import { requireAuth } from "@/lib/auth/session";

const TambahPertemuanSchema = z.object({
  kelasId: z.string().min(1, "ID Kelas wajib diisi"),
  nomor: z.number().min(1).max(16, "Nomor pertemuan maksimal 16"),
  tanggal: z.string().min(1, "Tanggal pertemuan wajib diisi"),
  materiSingkat: z.string().min(3, "Materi singkat minimal 3 karakter"),
});

export async function tambahPertemuanAction(data: z.infer<typeof TambahPertemuanSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat membuka pertemuan." };
  }

  const parsed = TambahPertemuanSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    PresensiStore.tambahPertemuan(
      parsed.data.kelasId,
      parsed.data.nomor,
      parsed.data.tanggal,
      parsed.data.materiSingkat
    );
    revalidatePath("/dosen/presensi");
    revalidatePath("/mahasiswa/presensi");
    return { success: true, message: `Pertemuan ke-${parsed.data.nomor} berhasil dibuka.` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal menambah pertemuan" };
  }
}

const SimpanPresensiSchema = z.object({
  pertemuanId: z.string().min(1, "ID Pertemuan wajib diisi"),
  records: z.array(
    z.object({
      mahasiswaId: z.string().min(1),
      nim: z.string().min(1),
      nama: z.string().min(1),
      status: z.enum(["HADIR", "IZIN", "SAKIT", "ALPA"]),
      catatan: z.string().optional(),
    })
  ),
});

export async function simpanPresensiAction(data: z.infer<typeof SimpanPresensiSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat mengisi presensi." };
  }

  const parsed = SimpanPresensiSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Data presensi tidak valid" };
  }

  try {
    PresensiStore.simpanPresensi(parsed.data.pertemuanId, parsed.data.records);
    revalidatePath("/dosen/presensi");
    revalidatePath("/mahasiswa/presensi");
    revalidatePath("/mahasiswa/ujian");
    return { success: true, message: "Presensi mahasiswa berhasil disimpan." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal menyimpan presensi" };
  }
}
