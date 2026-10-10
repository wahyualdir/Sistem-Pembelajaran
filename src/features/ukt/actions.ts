"use server";

import { revalidatePath } from "next/cache";
import { UktStore } from "./ukt-store";
import { requireRole } from "@/lib/auth/session";

export async function bayarUktAction(tagihanId: string, buktiPembayaran: string, catatan?: string) {
  await requireRole(["ADMIN"]);
  try {
    const updated = UktStore.bayarUkt(tagihanId, buktiPembayaran, catatan);
    revalidatePath("/admin/ukt");
    revalidatePath("/mahasiswa/ukt");
    revalidatePath("/mahasiswa/krs");
    return {
      success: true,
      message: `Tagihan mahasiswa ${updated.namaMahasiswa} berhasil ditandai LUNAS.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memproses pelunasan UKT.",
    };
  }
}

export async function beriDispensasiAction(tagihanId: string, alasan: string, batasWaktu: string) {
  await requireRole(["ADMIN"]);
  try {
    const updated = UktStore.beriDispensasi(tagihanId, alasan, batasWaktu);
    revalidatePath("/admin/ukt");
    revalidatePath("/mahasiswa/ukt");
    revalidatePath("/mahasiswa/krs");
    return {
      success: true,
      message: `Dispensasi untuk mahasiswa ${updated.namaMahasiswa} berhasil disetujui.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memberikan dispensasi.",
    };
  }
}
