"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SuratStore, JenisSurat } from "./surat-store";
import { requireAuth, requireRole } from "@/lib/auth/session";

const AjukanSuratSchema = z.object({
  jenis: z.enum(["AKTIF_KULIAH", "CUTI_AKADEMIK", "REKOMENDASI_BEASISWA"]),
  keterangan: z.string().min(5, "Alasan / keperluan pengajuan surat minimal 5 karakter"),
});

export async function ajukanSuratAction(data: z.infer<typeof AjukanSuratSchema>) {
  const session = await requireAuth();
  if (session.role !== "MAHASISWA" || !session.subId) {
    return { success: false, message: "Hanya mahasiswa aktif yang dapat mengajukan surat keterangan." };
  }

  const parsed = AjukanSuratSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    SuratStore.ajukanSurat(session.subId, parsed.data.jenis as JenisSurat, parsed.data.keterangan);
    revalidatePath("/mahasiswa/surat");
    revalidatePath("/admin/surat");
    return { success: true, message: "Pengajuan surat berhasil dikirim dan menunggu verifikasi admin." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal mengajukan surat" };
  }
}

const ProsesSuratSchema = z.object({
  suratId: z.string().min(1, "ID Surat wajib diisi"),
  aksi: z.enum(["SETUJUI", "TOLAK"]),
  alasanTolak: z.string().optional(),
});

export async function prosesSuratAction(data: z.infer<typeof ProsesSuratSchema>) {
  const session = await requireRole(["ADMIN"]);

  const parsed = ProsesSuratSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  if (parsed.data.aksi === "TOLAK" && (!parsed.data.alasanTolak || parsed.data.alasanTolak.trim().length < 5)) {
    return { success: false, message: "Alasan penolakan wajib diisi minimal 5 karakter." };
  }

  try {
    const hasil = SuratStore.prosesSurat({
      suratId: parsed.data.suratId,
      aksi: parsed.data.aksi,
      adminNama: session.name || session.email,
      alasanTolak: parsed.data.alasanTolak,
    });

    revalidatePath("/admin/surat");
    revalidatePath("/mahasiswa/surat");

    if (parsed.data.aksi === "SETUJUI") {
      return {
        success: true,
        message: `Surat disetujui. Nomor resmi terbit: ${hasil.nomorSurat}`,
      };
    } else {
      return { success: true, message: "Pengajuan surat telah ditolak dengan catatan." };
    }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal memproses surat" };
  }
}
