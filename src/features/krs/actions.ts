"use server";

import { revalidatePath } from "next/cache";
import { KrsStore } from "./krs-store";
import { requireAuth, requireRole } from "@/lib/auth/session";

export async function tambahKelasAction(kelasId: string) {
  const session = await requireAuth();
  if (session.role !== "MAHASISWA" || !session.subId) {
    return { success: false, message: "Hanya mahasiswa yang dapat mengisi KRS." };
  }

  try {
    KrsStore.tambahKelasKeKrs(session.subId, kelasId);
    revalidatePath("/mahasiswa/krs");
    return { success: true, message: "Mata kuliah berhasil ditambahkan ke keranjang KRS." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menambahkan mata kuliah.",
    };
  }
}

export async function hapusKelasAction(kelasId: string) {
  const session = await requireAuth();
  if (session.role !== "MAHASISWA" || !session.subId) {
    return { success: false, message: "Hanya mahasiswa yang dapat mengubah KRS." };
  }

  try {
    KrsStore.hapusKelasDariKrs(session.subId, kelasId);
    revalidatePath("/mahasiswa/krs");
    return { success: true, message: "Mata kuliah dihapus dari KRS." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menghapus mata kuliah.",
    };
  }
}

export async function ajukanKrsAction() {
  const session = await requireAuth();
  if (session.role !== "MAHASISWA" || !session.subId) {
    return { success: false, message: "Hanya mahasiswa yang dapat mengajukan KRS." };
  }

  try {
    KrsStore.ajukanKrs(session.subId);
    revalidatePath("/mahasiswa/krs");
    revalidatePath("/dosen/perwalian");
    return { success: true, message: "KRS berhasil diajukan ke Dosen Wali." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengajukan KRS.",
    };
  }
}

export async function setujuiKrsAction(krsId: string, catatan?: string) {
  const session = await requireRole(["DOSEN", "ADMIN"]);
  try {
    const allKrs = KrsStore.getAllKrs();
    const krs = allKrs.find((k) => k.id === krsId);
    if (!krs) {
      return { success: false, message: "KRS tidak ditemukan." };
    }

    // Otorisasi: Dosen hanya dapat menyetujui KRS mahasiswa perwaliannya sendiri
    if (
      session.role === "DOSEN" &&
      session.subId &&
      krs.dosenWaliId &&
      krs.dosenWaliId !== session.subId
    ) {
      return {
        success: false,
        message:
          "Akses ditolak: Anda hanya berwenang menyetujui KRS mahasiswa bimbingan perwalian Anda sendiri.",
      };
    }

    KrsStore.setujuiKrs(krsId, catatan);
    revalidatePath("/dosen/perwalian");
    revalidatePath("/mahasiswa/krs");
    return { success: true, message: "KRS mahasiswa berhasil disetujui." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menyetujui KRS.",
    };
  }
}

export async function tolakKrsAction(krsId: string, catatan: string) {
  const session = await requireRole(["DOSEN", "ADMIN"]);
  try {
    const allKrs = KrsStore.getAllKrs();
    const krs = allKrs.find((k) => k.id === krsId);
    if (!krs) {
      return { success: false, message: "KRS tidak ditemukan." };
    }

    // Otorisasi: Dosen hanya dapat menolak KRS mahasiswa perwaliannya sendiri
    if (
      session.role === "DOSEN" &&
      session.subId &&
      krs.dosenWaliId &&
      krs.dosenWaliId !== session.subId
    ) {
      return {
        success: false,
        message:
          "Akses ditolak: Anda hanya berwenang menolak KRS mahasiswa bimbingan perwalian Anda sendiri.",
      };
    }

    KrsStore.tolakKrs(krsId, catatan);
    revalidatePath("/dosen/perwalian");
    revalidatePath("/mahasiswa/krs");
    return { success: true, message: "KRS mahasiswa ditolak dengan catatan." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menolak KRS.",
    };
  }
}
