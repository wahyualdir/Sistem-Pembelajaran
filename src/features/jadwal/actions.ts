"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { JadwalStore } from "./jadwal-store";
import { requireRole } from "@/lib/auth/session";

const createKelasSchema = z.object({
  kode: z.string().min(1, "Kode kelas wajib diisi"),
  mataKuliahId: z.string().min(1, "Mata kuliah wajib dipilih"),
  dosenId: z.string().min(1, "Dosen pengampu wajib dipilih"),
  kuota: z.coerce.number().min(5).max(100),
  hari: z.string().min(1, "Hari kuliah wajib dipilih"),
  jamMulai: z.string().regex(/^\d{2}:\d{2}$/, "Format jam mulai harus HH:mm"),
  jamSelesai: z.string().regex(/^\d{2}:\d{2}$/, "Format jam selesai harus HH:mm"),
  ruangId: z.string().min(1, "Ruang kelas wajib dipilih"),
});

export async function createKelasAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const rawData = {
    kode: formData.get("kode"),
    mataKuliahId: formData.get("mataKuliahId"),
    dosenId: formData.get("dosenId"),
    kuota: formData.get("kuota"),
    hari: formData.get("hari"),
    jamMulai: formData.get("jamMulai"),
    jamSelesai: formData.get("jamSelesai"),
    ruangId: formData.get("ruangId"),
  };

  const parsed = createKelasSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message };
  }

  try {
    JadwalStore.createKelas({
      kode: parsed.data.kode,
      mataKuliahId: parsed.data.mataKuliahId,
      dosenId: parsed.data.dosenId,
      kuota: parsed.data.kuota,
      jadwal: [
        {
          hari: parsed.data.hari,
          jamMulai: parsed.data.jamMulai,
          jamSelesai: parsed.data.jamSelesai,
          ruangId: parsed.data.ruangId,
        },
      ],
    });

    revalidatePath("/admin/jadwal");
    return { success: true, message: "Kelas dan jadwal perkuliahan berhasil dibuat." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menyusun jadwal kelas.",
    };
  }
}
