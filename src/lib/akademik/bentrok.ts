/**
 * Algoritma Deteksi Bentrok Jadwal Kuliah (Bab 6.2 Dokumen Perencanaan SIAKAD)
 *
 * "Dua jadwal dianggap bentrok bila jatuh pada hari yang sama dan rentang jamnya beririsan.
 * Karena jam selesai bersifat eksklusif, jadwal yang berakhir pukul 09.40 dan jadwal lain yang
 * mulai 09.40 tidak bentrok."
 */

export interface RentangJadwal {
  hari: string;
  jamMulai: string; // format "HH:mm" misal "08:00"
  jamSelesai: string; // format "HH:mm" misal "09:40"
  label?: string; // informasi nama matkul/kelas/ruang untuk deskripsi bentrok
}

/**
 * Mengonversi string waktu "HH:mm" ke menit sejak awal hari (00:00)
 */
export function waktuKeMenit(waktu: string): number {
  const [jam, menit] = waktu.split(":").map(Number);
  return (jam || 0) * 60 + (menit || 0);
}

/**
 * Memeriksa apakah jadwal a dan jadwal b tumpang tindih (bentrok)
 * Syarat: hari sama, dan rentang jam saling beririsan dengan titik batas eksklusif.
 */
export function adaBentrok(a: RentangJadwal, b: RentangJadwal): boolean {
  if (a.hari.trim().toLowerCase() !== b.hari.trim().toLowerCase()) {
    return false;
  }

  const aMulai = waktuKeMenit(a.jamMulai);
  const aSelesai = waktuKeMenit(a.jamSelesai);
  const bMulai = waktuKeMenit(b.jamMulai);
  const bSelesai = waktuKeMenit(b.jamSelesai);

  // Karena jam selesai bersifat eksklusif:
  // aMulai < bSelesai && bMulai < aSelesai
  return aMulai < bSelesai && bMulai < aSelesai;
}

/**
 * Mencari semua jadwal yang bertabrakan dengan jadwal baru
 */
export function cariBentrok(
  jadwalBaru: RentangJadwal,
  jadwalYangAda: RentangJadwal[]
): RentangJadwal[] {
  const hasil: RentangJadwal[] = [];
  for (const j of jadwalYangAda) {
    if (adaBentrok(jadwalBaru, j)) {
      hasil.push(j);
    }
  }
  return hasil;
}
