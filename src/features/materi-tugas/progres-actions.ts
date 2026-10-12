"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { MateriTugasStore } from "./materi-tugas-store";

const CatatMateriDibukaSchema = z.object({
  materiId: z.string().min(1, "ID Materi wajib diisi"),
  kelasId: z.string().optional(),
});

export async function catatMateriDibukaAction(data: z.infer<typeof CatatMateriDibukaSchema>) {
  const session = await requireAuth();
  const mahasiswaId = session.subId || session.userId;

  const parsed = CatatMateriDibukaSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    const progres = MateriTugasStore.catatMateriDibuka(parsed.data.materiId, mahasiswaId);
    revalidatePath("/mahasiswa/tugas");
    revalidatePath("/student");
    return { success: true, progres };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal mencatat progres" };
  }
}

const ToggleMateriSelesaiSchema = z.object({
  materiId: z.string().min(1, "ID Materi wajib diisi"),
  selesai: z.boolean().optional(),
});

export async function toggleMateriSelesaiAction(data: z.infer<typeof ToggleMateriSelesaiSchema>) {
  const session = await requireAuth();
  if (session.role !== "MAHASISWA") {
    return { success: false, message: "Hanya mahasiswa yang dapat menandai progres belajar." };
  }
  const mahasiswaId = session.subId || session.userId;

  const parsed = ToggleMateriSelesaiSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    const progres = MateriTugasStore.toggleMateriSelesai(
      parsed.data.materiId,
      mahasiswaId,
      parsed.data.selesai
    );
    revalidatePath("/mahasiswa/tugas");
    revalidatePath("/student");
    revalidatePath("/dosen/materi-tugas");
    return {
      success: true,
      progres,
      message: progres.selesai
        ? "Materi berhasil ditandai selesai."
        : "Penanda selesai materi dibatalkan.",
    };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal mengubah progres" };
  }
}

export async function ambilProgresMahasiswaAction(kelasId?: string) {
  const session = await requireAuth();
  const mahasiswaId = session.subId || session.userId;

  try {
    const data = MateriTugasStore.getProgresMahasiswa(mahasiswaId, kelasId);
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal mengambil data progres" };
  }
}

export async function ambilRekapProgresDosenAction(kelasId: string) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat melihat rekap progres." };
  }

  try {
    const rekap = MateriTugasStore.getRekapProgresKelas(kelasId);
    return { success: true, rekap };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal mengambil rekap kelas" };
  }
}

export async function ambilMateriTerakhirDibukaAction() {
  const session = await requireAuth();
  const mahasiswaId = session.subId || session.userId;

  try {
    const result = MateriTugasStore.getMateriTerakhirDibuka(mahasiswaId);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal mengambil materi terakhir" };
  }
}
