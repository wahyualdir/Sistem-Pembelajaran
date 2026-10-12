"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MateriTugasStore } from "./materi-tugas-store";
import { requireAuth } from "@/lib/auth/session";
import {
  uploadMateriKeStorage,
  uploadTugasKeStorage,
  hapusBerkasStorage,
  dapatkanSignedUrlStorage,
} from "@/lib/supabase/storage";
import { validasiBerkasServer } from "@/lib/akademik/konfigurasi-storage";
import { recordSystemAuditLog } from "@/lib/audit";

export type TambahMateriInput =
  | FormData
  | {
      kelasId: string;
      judul: string;
      deskripsi?: string;
      pathFile?: string;
      ukuranMb?: number;
    };

/**
 * Server Action: Mengunggah materi baru (Mendukung berkas fisik via FormData atau tautan link)
 */
export async function tambahMateriAction(input: TambahMateriInput) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat mengunggah materi." };
  }

  let kelasId = "";
  let judul = "";
  let deskripsi = "";
  let linkPath = "";
  let file: File | null = null;
  let ukuranMbFromObj = 1.0;

  if (input instanceof FormData) {
    kelasId = input.get("kelasId")?.toString() || "";
    judul = input.get("judul")?.toString() || "";
    deskripsi = input.get("deskripsi")?.toString() || "";
    linkPath = input.get("pathFile")?.toString()?.trim() || "";
    file = input.get("file") as File | null;
  } else {
    kelasId = input.kelasId || "";
    judul = input.judul || "";
    deskripsi = input.deskripsi || "";
    linkPath = input.pathFile?.trim() || "";
    ukuranMbFromObj = input.ukuranMb || 1.0;
  }

  if (!kelasId) {
    return { success: false, message: "ID Kelas wajib diisi." };
  }
  if (!judul || judul.trim().length < 3) {
    return { success: false, message: "Judul materi minimal 3 karakter." };
  }

  let finalPathFile = linkPath;
  let finalUkuranMb = ukuranMbFromObj;
  let uploadedStoragePath: string | null = null;

  // 1. Kasus unggah berkas fisik
  if (file && file.size > 0) {
    const validasi = validasiBerkasServer(
      { name: file.name, size: file.size, type: file.type },
      "materi"
    );
    if (!validasi.valid) {
      return { success: false, message: validasi.pesanError || "Berkas materi tidak valid." };
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await uploadMateriKeStorage(kelasId, {
        name: file.name,
        buffer,
        type: file.type,
      });

      if (!uploadRes.success || !uploadRes.path) {
        return { success: false, message: uploadRes.error || "Gagal mengunggah berkas ke penyimpanan cloud." };
      }

      uploadedStoragePath = uploadRes.path;
      finalPathFile = uploadRes.path;
      finalUkuranMb = Number((file.size / (1024 * 1024)).toFixed(1)) || 0.1;
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : "Kesalahan proses berkas" };
    }
  } else if (!finalPathFile || finalPathFile.length < 3) {
    return { success: false, message: "Pilih berkas materi untuk diunggah atau tempel tautan eksternal." };
  }

  // 2. Simpan ke database / store
  try {
    const materiBaru = MateriTugasStore.tambahMateri({
      kelasId,
      judul: judul.trim(),
      deskripsi: deskripsi.trim() || undefined,
      pathFile: finalPathFile,
      ukuranMb: finalUkuranMb,
      diunggahOleh: session.name || "Dosen Pengampu",
    });

    // Catat jejak audit
    await recordSystemAuditLog({
      actorId: session.userId,
      actorName: session.name || "Dosen",
      actorRole: session.role,
      action: "material.create",
      entityType: "materials",
      entityId: materiBaru.id,
      description: `Materi baru '${materiBaru.judul}' diunggah untuk kelas ${kelasId}`,
      scopeType: "CLASS",
      scopeId: kelasId,
    });

    revalidatePath("/dosen/materi-tugas");
    revalidatePath("/mahasiswa/tugas");
    revalidatePath("/student");
    return { success: true, message: "Materi perkuliahan berhasil dipublikasikan." };
  } catch (err) {
    // Rollback objek storage bila penyimpanan data gagal
    if (uploadedStoragePath) {
      await hapusBerkasStorage(uploadedStoragePath);
    }
    return { success: false, message: err instanceof Error ? err.message : "Gagal menyimpan data materi" };
  }
}

/**
 * Server Action: Menghapus materi perkuliahan dan membersihkan berkas storage terkait
 */
export async function hapusMateriAction(data: { materiId: string; kelasId: string }) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat menghapus materi." };
  }

  const existing = MateriTugasStore.getMateriById(data.materiId);
  if (!existing) {
    return { success: false, message: "Materi tidak ditemukan." };
  }

  try {
    // Bersihkan berkas fisik dari storage jika ada
    if (existing.pathFile && !existing.pathFile.startsWith("http")) {
      await hapusBerkasStorage(existing.pathFile);
    }

    MateriTugasStore.hapusMateri(data.materiId);

    // Catat log audit
    await recordSystemAuditLog({
      actorId: session.userId,
      actorName: session.name || "Dosen",
      actorRole: session.role,
      action: "material.delete",
      entityType: "materials",
      entityId: data.materiId,
      description: `Materi '${existing.judul}' dihapus dari kelas ${data.kelasId}`,
      scopeType: "CLASS",
      scopeId: data.kelasId,
    });

    revalidatePath("/dosen/materi-tugas");
    revalidatePath("/mahasiswa/tugas");
    revalidatePath("/student");
    return { success: true, message: "Materi berhasil dihapus." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal menghapus materi" };
  }
}

const TambahTugasSchema = z.object({
  kelasId: z.string().min(1, "ID Kelas wajib diisi"),
  judul: z.string().min(3, "Judul tugas minimal 3 karakter"),
  deskripsi: z.string().min(5, "Deskripsi tugas minimal 5 karakter"),
  tenggat: z.string().min(1, "Tenggat waktu wajib diisi"),
});

export async function tambahTugasAction(data: z.infer<typeof TambahTugasSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat membuat tugas." };
  }

  const parsed = TambahTugasSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    const tugasBaru = MateriTugasStore.tambahTugas({
      kelasId: parsed.data.kelasId,
      judul: parsed.data.judul,
      deskripsi: parsed.data.deskripsi,
      tenggat: parsed.data.tenggat,
    });

    await recordSystemAuditLog({
      actorId: session.userId,
      actorName: session.name || "Dosen",
      actorRole: session.role,
      action: "assignment.create",
      entityType: "assignments",
      entityId: tugasBaru.id,
      description: `Tugas baru '${tugasBaru.judul}' dibuat dengan tenggat ${tugasBaru.tenggat}`,
      scopeType: "CLASS",
      scopeId: parsed.data.kelasId,
    });

    revalidatePath("/dosen/materi-tugas");
    revalidatePath("/mahasiswa/tugas");
    revalidatePath("/student");
    return { success: true, message: "Tugas perkuliahan berhasil dibuat dengan tenggat waktu." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal membuat tugas" };
  }
}

export type KumpulkanTugasInput =
  | FormData
  | {
      tugasId: string;
      pathFile?: string;
    };

/**
 * Server Action: Mengumpulkan tugas mahasiswa (Mendukung berkas nyata atau link)
 */
export async function kumpulkanTugasAction(input: KumpulkanTugasInput) {
  const session = await requireAuth();
  if (session.role !== "MAHASISWA") {
    return { success: false, message: "Akses ditolak. Hanya mahasiswa yang dapat mengumpulkan tugas." };
  }

  const mahasiswaId = session.subId || session.userId;
  let tugasId = "";
  let linkPath = "";
  let file: File | null = null;

  if (input instanceof FormData) {
    tugasId = input.get("tugasId")?.toString() || "";
    linkPath = input.get("pathFile")?.toString()?.trim() || "";
    file = input.get("file") as File | null;
  } else {
    tugasId = input.tugasId || "";
    linkPath = input.pathFile?.trim() || "";
  }

  if (!tugasId) {
    return { success: false, message: "ID Tugas wajib diisi." };
  }

  const tugas = MateriTugasStore.getTugasById(tugasId);
  if (!tugas) {
    return { success: false, message: "Tugas tidak ditemukan." };
  }

  // Cek pengumpulan lama mahasiswa untuk tugas ini
  const oldKumpul = MateriTugasStore.getPengumpulanTugas(tugasId, mahasiswaId);

  let finalPathFile = linkPath;
  let uploadedStoragePath: string | null = null;

  // Kasus pengunggahan berkas nyata ke storage
  if (file && file.size > 0) {
    const validasi = validasiBerkasServer(
      { name: file.name, size: file.size, type: file.type },
      "tugas"
    );
    if (!validasi.valid) {
      return { success: false, message: validasi.pesanError || "Berkas tugas tidak valid." };
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await uploadTugasKeStorage(tugasId, mahasiswaId, {
        name: file.name,
        buffer,
        type: file.type,
      });

      if (!uploadRes.success || !uploadRes.path) {
        return { success: false, message: uploadRes.error || "Gagal mengunggah berkas tugas." };
      }

      uploadedStoragePath = uploadRes.path;
      finalPathFile = uploadRes.path;

      // Hapus berkas lama dari storage bila mahasiswa mengumpulkan ulang
      if (oldKumpul?.pathFile && !oldKumpul.pathFile.startsWith("http")) {
        await hapusBerkasStorage(oldKumpul.pathFile);
      }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : "Gagal memproses berkas tugas" };
    }
  } else if (!finalPathFile || finalPathFile.length < 3) {
    return { success: false, message: "Pilih berkas tugas untuk diunggah atau tempel tautan berkas." };
  }

  try {
    const kumpul = MateriTugasStore.kumpulkanTugas({
      tugasId,
      mahasiswaId,
      pathFile: finalPathFile,
    });

    await recordSystemAuditLog({
      actorId: session.userId,
      actorName: session.name || "Mahasiswa",
      actorRole: session.role,
      action: "submission.submit",
      entityType: "submissions",
      entityId: kumpul.id,
      description: `Pengumpulan tugas '${tugas.judul}' oleh ${session.name} (${kumpul.terlambat ? "Terlambat" : "Tepat Waktu"})`,
      scopeType: "CLASS",
      scopeId: tugas.kelasId,
    });

    revalidatePath("/mahasiswa/tugas");
    revalidatePath("/dosen/materi-tugas");
    revalidatePath("/student");
    const infoTerlambat = kumpul.terlambat ? " (Catatan: Terlambat dikumpulkan)" : "";
    return { success: true, message: `Tugas berhasil dikumpulkan${infoTerlambat}.` };
  } catch (err) {
    // Rollback objek storage jika gagal disimpan
    if (uploadedStoragePath) {
      await hapusBerkasStorage(uploadedStoragePath);
    }
    return { success: false, message: err instanceof Error ? err.message : "Gagal mengumpulkan tugas" };
  }
}

const BeriNilaiTugasSchema = z.object({
  pengumpulanId: z.string().min(1, "ID Pengumpulan wajib diisi"),
  nilai: z.number().min(0).max(100, "Nilai tugas harus antara 0 dan 100"),
  catatanDosen: z.string().min(3, "Catatan umpan balik minimal 3 karakter"),
});

export async function beriNilaiTugasAction(data: z.infer<typeof BeriNilaiTugasSchema>) {
  const session = await requireAuth();
  if (session.role !== "DOSEN" && session.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya dosen pengampu yang dapat menilai tugas." };
  }

  const parsed = BeriNilaiTugasSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message || "Input tidak valid" };
  }

  try {
    const kumpul = MateriTugasStore.beriNilaiTugas({
      pengumpulanId: parsed.data.pengumpulanId,
      nilai: parsed.data.nilai,
      catatanDosen: parsed.data.catatanDosen,
    });

    await recordSystemAuditLog({
      actorId: session.userId,
      actorName: session.name || "Dosen",
      actorRole: session.role,
      action: "submission.grade",
      entityType: "submissions",
      entityId: kumpul.id,
      description: `Pemberian nilai tugas ${parsed.data.nilai} untuk mahasiswa ${kumpul.namaMahasiswa}`,
    });

    revalidatePath("/dosen/materi-tugas");
    revalidatePath("/mahasiswa/tugas");
    return { success: true, message: "Nilai dan catatan evaluasi berhasil disimpan." };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Gagal memberikan nilai" };
  }
}

/**
 * Server Action: Menghasilkan signed URL berumur pendek untuk unduh / pratinjau berkas privat
 */
export async function dapatkanSignedUrlAction(data: { pathFile: string }) {
  await requireAuth();

  if (!data.pathFile) {
    return { success: false, message: "Path berkas tidak valid" };
  }

  const res = await dapatkanSignedUrlStorage(data.pathFile);
  if (!res.success || !res.signedUrl) {
    return { success: false, message: res.error || "Gagal membuat tautan unduh privat" };
  }

  return { success: true, signedUrl: res.signedUrl };
}
