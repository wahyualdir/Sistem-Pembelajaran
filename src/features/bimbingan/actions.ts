"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BimbinganStore } from "./bimbingan-store";
import { requireAuth } from "@/lib/auth/session";

const AjukanBimbinganSchema = z.object({
  topik: z.string().min(5, "Topik bimbingan minimal 5 karakter"),
  catatanMahasiswa: z.string().min(10, "Keterangan/pertanyaan bimbingan minimal 10 karakter"),
});

export async function ajukanBimbinganAction(data: z.infer<typeof AjukanBimbinganSchema>) {
  const session = await requireAuth();
  if (session.role !== "MAHASISWA" || !session.subId) {
    return { success: false, message: "Hanya mahasiswa yang dapat mengajukan bimbingan." };
  }

  const parsed = AjukanBimbinganSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    BimbinganStore.ajukanBimbingan(session.subId, parsed.data.topik, parsed.data.catatanMahasiswa);
    revalidatePath("/mahasiswa/bimbingan");
    revalidatePath("/dosen/perwalian");
    return { success: true, message: "Permintaan bimbingan akademik berhasil dikirim ke Dosen Wali." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal mengajukan bimbingan" };
  }
}

const TanggapBimbinganSchema = z.object({
  bimbinganId: z.string().min(1, "ID Bimbingan wajib diisi"),
  catatanDosen: z.string().min(5, "Catatan/rekomendasi dosen minimal 5 karakter"),
});

export async function tanggapBimbinganAction(data: z.infer<typeof TanggapBimbinganSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN") {
    return { success: false, message: "Akses ditolak. Hanya Dosen Wali yang dapat memberikan arahan." };
  }

  const parsed = TanggapBimbinganSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    BimbinganStore.tanggapBimbingan(parsed.data.bimbinganId, parsed.data.catatanDosen);
    revalidatePath("/dosen/perwalian");
    revalidatePath("/mahasiswa/bimbingan");
    return { success: true, message: "Catatan bimbingan berhasil disimpan." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal menyimpan bimbingan" };
  }
}
