"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { NotifikasiService } from "./notifikasi-service";
import { PreferensiNotifikasiItem } from "./types";
import { prisma } from "@/lib/db";

export async function getNotifikasiAction() {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const notifikasi = await NotifikasiService.getNotifikasiPengguna(userId);
    return { success: true, data: notifikasi };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal memuat notifikasi",
      data: [],
    };
  }
}

export async function tandaiDibacaAction(notifikasiId: string) {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const item = await NotifikasiService.tandaiDibaca(notifikasiId, userId);
    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menandai notifikasi",
    };
  }
}

export async function tandaiSemuaDibacaAction() {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const res = await NotifikasiService.tandaiSemuaDibaca(userId);
    return { success: true, count: res.count };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menandai semua notifikasi",
    };
  }
}

export async function tundaNotifikasiAction(notifikasiId: string, menit: number) {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const item = await NotifikasiService.tundaNotifikasi(notifikasiId, userId, menit);
    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menunda notifikasi",
    };
  }
}

export async function getPreferensiAction() {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const pref = await NotifikasiService.getPreferensi(userId);
    return { success: true, data: pref };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengambil preferensi",
    };
  }
}

export async function simpanPreferensiAction(data: Partial<PreferensiNotifikasiItem>) {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const updated = await NotifikasiService.simpanPreferensi(userId, data);

    // Catat log audit aksi sensitif
    try {
      await prisma.logAudit.create({
        data: {
          penggunaId: session.userId,
          aksi: "UBAH_PREFERENSI_NOTIFIKASI",
          entitas: "PreferensiNotifikasi",
          entitasId: userId,
          nilaiBaru: JSON.stringify(data),
        },
      });
    } catch {
      // Database offline fallback
    }

    revalidatePath("/mahasiswa/preferensi-notifikasi");
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan preferensi",
    };
  }
}
