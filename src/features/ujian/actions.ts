"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { UjianStore } from "./ujian-store";
import { requireRole } from "@/lib/auth/session";

const TambahJadwalUjianSchema = z.object({
  kelasId: z.string().min(1, "ID Kelas wajib diisi"),
  jenis: z.enum(["UTS", "UAS"]),
  tanggal: z.string().min(1, "Tanggal ujian wajib diisi"),
  jamMulai: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam mulai harus HH:mm"),
  jamSelesai: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam selesai harus HH:mm"),
  ruangId: z.string().min(1, "ID Ruang wajib diisi"),
});

export async function tambahJadwalUjianAction(data: z.infer<typeof TambahJadwalUjianSchema>) {
  await requireRole(["ADMIN"]);

  const parsed = TambahJadwalUjianSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    UjianStore.tambahJadwal(parsed.data);
    revalidatePath("/admin/ujian");
    revalidatePath("/mahasiswa/ujian");
    return { success: true, message: `Jadwal ${parsed.data.jenis} berhasil ditambahkan.` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal menambah jadwal ujian" };
  }
}
