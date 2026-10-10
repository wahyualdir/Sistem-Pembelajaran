/**
 * Modul Akademik Murni: Simulasi Proyeksi IPK & IPS Mahasiswa
 *
 * Sesuai arahan Fase 3:
 * - Dibangun di atas modul murni `lib/akademik/nilai` tanpa menduplikasi rumus.
 * - Menerima riwayat transkrip yang sudah ditempuh dan rencana mata kuliah semester berjalan.
 * - Menggunakan `hitungIPK` dan `hitungIPS` yang secara otomatis memperhitungkan
 *   mata kuliah yang diulang (memakai nilai terbaik/bobot mutu tertinggi).
 * - Menghitung proyeksi IPS semester berjalan, proyeksi IPK kumulatif baru,
 *   serta selisih delta IPK (+/-) terhadap IPK saat ini.
 */

import {
  NilaiTranskripItem,
  hitungIPK,
  hitungIPS,
  SKALA_NILAI_DEFAULT,
} from "./nilai";

export interface ItemSimulasiSemester {
  kodeMataKuliah: string;
  namaMataKuliah: string;
  sks: number;
  targetHuruf: string;
  targetBobot: number;
}

export interface HasilSimulasiIpk {
  ipkSaatIni: number;
  totalSksLulusSaatIni: number;
  totalSksDitempuhSaatIni: number;
  ipsProyeksi: number;
  ipkProyeksi: number;
  selisihIpk: number;
  totalSksLulusProyeksi: number;
  totalSksDitempuhProyeksi: number;
  sksBertambah: number;
}

/**
 * Konversi huruf target ke bobot mutu standar
 */
export function dapatkanBobotHuruf(huruf: string): number {
  const match = SKALA_NILAI_DEFAULT.find(
    (item) => item.huruf.toUpperCase() === huruf.trim().toUpperCase()
  );
  return match ? match.bobot : 0.0;
}

/**
 * Menghitung simulasi proyeksi IPS dan IPK mahasiswa
 */
export function hitungSimulasiIpk(
  transkripLalu: NilaiTranskripItem[],
  simulasiSemesterIni: ItemSimulasiSemester[]
): HasilSimulasiIpk {
  // 1. Hitung IPK saat ini (baseline tanpa simulasi)
  const baseline = hitungIPK(transkripLalu);

  // Jika tidak ada mata kuliah yang disimulasikan
  if (!simulasiSemesterIni || simulasiSemesterIni.length === 0) {
    return {
      ipkSaatIni: baseline.ipk,
      totalSksLulusSaatIni: baseline.totalSksLulus,
      totalSksDitempuhSaatIni: baseline.totalSksDitempuh,
      ipsProyeksi: 0.0,
      ipkProyeksi: baseline.ipk,
      selisihIpk: 0.0,
      totalSksLulusProyeksi: baseline.totalSksLulus,
      totalSksDitempuhProyeksi: baseline.totalSksDitempuh,
      sksBertambah: 0,
    };
  }

  // 2. Hitung proyeksi IPS semester berjalan
  const formatSemester: { sks: number; bobot: number }[] = simulasiSemesterIni.map((item) => ({
    sks: item.sks,
    bobot: item.targetBobot,
  }));
  const ipsProyeksi = hitungIPS(formatSemester);

  // 3. Gabungkan transkrip lalu dengan proyeksi nilai semester ini
  const gabunganTranskrip: NilaiTranskripItem[] = [
    ...transkripLalu,
    ...simulasiSemesterIni.map((item) => ({
      kodeMataKuliah: item.kodeMataKuliah,
      namaMataKuliah: item.namaMataKuliah,
      sks: item.sks,
      huruf: item.targetHuruf,
      bobot: item.targetBobot,
      semesterPaket: 99, // Menandakan semester proyeksi berjalan
      tahunAjaranKode: "Simulasi Berjalan",
    })),
  ];

  // 4. Hitung IPK kumulatif baru menggunakan hitungIPK murni
  // Ini secara otomatis menangani mata kuliah mengulang jika kode MK sama dengan semester lalu!
  const hasilKumulatif = hitungIPK(gabunganTranskrip);

  // 5. Hitung selisih / delta IPK
  const selisihIpk = Math.round((hasilKumulatif.ipk - baseline.ipk) * 100) / 100;
  const sksBertambah = hasilKumulatif.totalSksLulus - baseline.totalSksLulus;

  return {
    ipkSaatIni: baseline.ipk,
    totalSksLulusSaatIni: baseline.totalSksLulus,
    totalSksDitempuhSaatIni: baseline.totalSksDitempuh,
    ipsProyeksi,
    ipkProyeksi: hasilKumulatif.ipk,
    selisihIpk,
    totalSksLulusProyeksi: hasilKumulatif.totalSksLulus,
    totalSksDitempuhProyeksi: hasilKumulatif.totalSksDitempuh,
    sksBertambah,
  };
}
