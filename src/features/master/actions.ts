"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MasterStore } from "./master-store";
import { requireRole } from "@/lib/auth/session";

const mahasiswaSchema = z.object({
  nim: z.string().min(5, "NIM minimal 5 karakter"),
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  angkatan: z.coerce.number().min(2015).max(2030),
  prodiId: z.string().min(1, "Program Studi harus dipilih"),
  dosenWaliId: z.string().optional().nullable(),
});

export async function createMahasiswaAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const rawData = {
    nim: formData.get("nim"),
    nama: formData.get("nama"),
    email: formData.get("email"),
    angkatan: formData.get("angkatan"),
    prodiId: formData.get("prodiId"),
    dosenWaliId: formData.get("dosenWaliId") || null,
  };

  const parsed = mahasiswaSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message };
  }

  try {
    MasterStore.addMahasiswa(parsed.data);
    revalidatePath("/admin/master");
    return { success: true, message: "Data mahasiswa berhasil ditambahkan." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menambahkan mahasiswa.",
    };
  }
}

export async function toggleMahasiswaStatusAction(id: string) {
  await requireRole(["ADMIN"]);
  try {
    const updated = MasterStore.toggleMahasiswaStatus(id);
    revalidatePath("/admin/master");
    return {
      success: true,
      message: `Status mahasiswa diubah menjadi ${updated.status}.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengubah status.",
    };
  }
}

export async function assignDosenWaliAction(mahasiswaId: string, dosenId: string | null) {
  await requireRole(["ADMIN"]);
  try {
    MasterStore.assignDosenWali(mahasiswaId, dosenId);
    revalidatePath("/admin/master");
    return { success: true, message: "Dosen wali berhasil ditetapkan." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menetapkan dosen wali.",
    };
  }
}

const dosenSchema = z.object({
  nidn: z.string().min(5, "NIDN minimal 5 karakter"),
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  penandaWali: z.boolean().default(true),
  penandaKaprodi: z.boolean().default(false),
});

export async function createDosenAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const rawData = {
    nidn: formData.get("nidn"),
    nama: formData.get("nama"),
    email: formData.get("email"),
    penandaWali: formData.get("penandaWali") === "on",
    penandaKaprodi: formData.get("penandaKaprodi") === "on",
  };

  const parsed = dosenSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message };
  }

  try {
    MasterStore.addDosen(parsed.data);
    revalidatePath("/admin/master");
    return { success: true, message: "Data dosen berhasil ditambahkan." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menambahkan dosen.",
    };
  }
}

export async function toggleDosenStatusAction(id: string) {
  await requireRole(["ADMIN"]);
  try {
    const updated = MasterStore.toggleDosenStatus(id);
    revalidatePath("/admin/master");
    return {
      success: true,
      message: `Status aktif dosen diubah menjadi ${updated.statusAktif ? "Aktif" : "Nonaktif"}.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengubah status.",
    };
  }
}

export async function createMataKuliahAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const rawData = {
    kode: (formData.get("kode") as string || "").toUpperCase(),
    nama: formData.get("nama") as string,
    sks: Number(formData.get("sks")),
    jenis: (formData.get("jenis") as "WAJIB" | "PILIHAN") || "WAJIB",
    semesterPaket: Number(formData.get("semesterPaket")),
    prodiId: formData.get("prodiId") as string,
  };

  try {
    MasterStore.addMataKuliah(rawData);
    revalidatePath("/admin/kurikulum");
    return { success: true, message: "Mata kuliah berhasil ditambahkan ke kurikulum." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menambahkan mata kuliah.",
    };
  }
}

export async function addPrasyaratAction(mataKuliahId: string, prasyaratId: string, nilaiMinimal: string) {
  await requireRole(["ADMIN"]);
  try {
    MasterStore.addPrasyarat(mataKuliahId, prasyaratId, nilaiMinimal);
    revalidatePath("/admin/kurikulum");
    return { success: true, message: "Prasyarat mata kuliah berhasil ditambahkan." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menambahkan prasyarat.",
    };
  }
}

export async function deletePrasyaratAction(mataKuliahId: string, prasyaratId: string) {
  await requireRole(["ADMIN"]);
  try {
    MasterStore.deletePrasyarat(mataKuliahId, prasyaratId);
    revalidatePath("/admin/kurikulum");
    return { success: true, message: "Prasyarat berhasil dihapus." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menghapus prasyarat.",
    };
  }
}

export async function confirmImportMahasiswaAction(
  rows: { nim: string; nama: string; email: string; angkatan: number; prodiId: string }[]
) {
  await requireRole(["ADMIN"]);
  let count = 0;
  for (const r of rows) {
    try {
      MasterStore.addMahasiswa({
        nim: r.nim,
        nama: r.nama,
        email: r.email,
        angkatan: r.angkatan,
        prodiId: r.prodiId,
        dosenWaliId: null,
      });
      count++;
    } catch {
      // Lewati baris duplikat bila ada
    }
  }

  revalidatePath("/admin/master");
  return { success: true, message: `${count} mahasiswa berhasil diimpor ke sistem.` };
}

export async function confirmImportDosenAction(
  rows: { nidn: string; nama: string; email: string }[]
) {
  await requireRole(["ADMIN"]);
  let count = 0;
  for (const r of rows) {
    try {
      MasterStore.addDosen({
        nidn: r.nidn,
        nama: r.nama,
        email: r.email,
        penandaWali: true,
        penandaKaprodi: false,
      });
      count++;
    } catch {
      // Lewati duplikat
    }
  }

  revalidatePath("/admin/master");
  return { success: true, message: `${count} dosen berhasil diimpor ke sistem.` };
}
