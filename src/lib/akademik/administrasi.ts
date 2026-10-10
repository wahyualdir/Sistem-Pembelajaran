/**
 * Modul Akademik: Administrasi, Kalender, dan Penomoran Surat
 * Dokumen Perencanaan Bab 2.2 Fitur 13 & 14:
 * - Periode kalender mengendalikan pembukaan KRS, UTS, UAS.
 * - Penomoran surat keterangan otomatis dan terstruktur.
 * - Pengumuman bertarget (semua, prodi, angkatan, kelas).
 */

/**
 * Cek apakah tanggal acuan berada dalam rentang periode kalender akademik
 */
export function isPeriodeAktif(
  mulai: Date | string,
  selesai: Date | string,
  tanggalAcuan: Date = new Date()
): boolean {
  const startDate = new Date(mulai);
  const endDate = new Date(selesai);

  // Jadikan batas akhir inklusif hingga akhir hari jika hanya berupa tanggal yyyy-mm-dd
  if (typeof selesai === "string" && selesai.length === 10) {
    endDate.setHours(23, 59, 59, 999);
  }

  const checkTime = tanggalAcuan.getTime();
  return checkTime >= startDate.getTime() && checkTime <= endDate.getTime();
}

/**
 * Pembuatan nomor surat resmi secara otomatis
 * Contoh: 042/FT-UIR/AK/AKTIF/2026
 */
export function generateNomorSurat(
  jenis: "AKTIF_KULIAH" | "CUTI_AKADEMIK" | "REKOMENDASI_BEASISWA" | string,
  nomorUrut: number,
  tahun: number = new Date().getFullYear()
): string {
  const urutStr = String(nomorUrut).padStart(3, "0");
  let kodeJenis = "AK";
  if (jenis === "AKTIF_KULIAH") kodeJenis = "SK-AKTIF";
  else if (jenis === "CUTI_AKADEMIK") kodeJenis = "SK-CUTI";
  else if (jenis === "REKOMENDASI_BEASISWA") kodeJenis = "SR-BEASISWA";

  return `${urutStr}/FT-UIR/${kodeJenis}/${tahun}`;
}

export interface PengumumanTargetRule {
  target: "SEMUA" | "PRODI" | "ANGKATAN" | "KELAS";
  targetId?: string | null;
}

export interface UserAcademicProfile {
  peran: "ADMIN" | "DOSEN" | "MAHASISWA";
  prodiId?: string;
  angkatan?: number;
  kelasIds?: string[];
}

/**
 * Cek apakah pengumuman relevan untuk profil pengguna tertentu
 */
export function isPengumumanRelevan(
  pengumuman: PengumumanTargetRule,
  user: UserAcademicProfile
): boolean {
  if (user.peran === "ADMIN") return true; // Admin melihat semua pengumuman
  if (pengumuman.target === "SEMUA") return true;

  if (pengumuman.target === "PRODI") {
    return user.prodiId === pengumuman.targetId;
  }

  if (pengumuman.target === "ANGKATAN") {
    return String(user.angkatan) === String(pengumuman.targetId);
  }

  if (pengumuman.target === "KELAS") {
    return !!(user.kelasIds && user.kelasIds.includes(pengumuman.targetId || ""));
  }

  return false;
}
