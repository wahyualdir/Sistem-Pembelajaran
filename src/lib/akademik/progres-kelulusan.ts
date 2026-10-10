/**
 * Modul Akademik Murni: Perhitungan Progres Kelulusan Mahasiswa
 *
 * Sesuai arahan Fase 3:
 * - Menghitung SKS lulus vs total target kurikulum (standar S1: 144 SKS).
 * - Memisahkan kategori SKS Wajib (standar: 126 SKS) dan SKS Pilihan (standar: 18 SKS).
 * - Menghitung persentase kemajuan per kategori.
 * - Menghitung estimasi sisa semester menuju kelulusan berdasarkan beban rata-rata (hanya jika data tersedia).
 */

export interface MataKuliahSelesai {
  kodeMataKuliah: string;
  namaMataKuliah?: string;
  sks: number;
  jenis: "WAJIB" | "PILIHAN";
  lulus: boolean;
}

export interface TargetKurikulum {
  totalTargetSks: number;
  targetWajibSks: number;
  targetPilihanSks: number;
  rataRataSksPerSemester: number;
}

export const TARGET_KURIKULUM_DEFAULT: TargetKurikulum = {
  totalTargetSks: 144,
  targetWajibSks: 126,
  targetPilihanSks: 18,
  rataRataSksPerSemester: 20,
};

export interface HasilProgresKelulusan {
  totalSksLulus: number;
  totalTargetSks: number;
  persenTotal: number;

  sksWajibLulus: number;
  targetWajibSks: number;
  persenWajib: number;

  sksPilihanLulus: number;
  targetPilihanSks: number;
  persenPilihan: number;

  sisaSksTotal: number;
  sisaSksWajib: number;
  sisaSksPilihan: number;

  sksSedangDitempuh: number;
  perkiraanSemesterTersisa: number;
  statusKelayakanSkripsi: boolean;
}

/**
 * Menghitung rincian progres kelulusan mahasiswa
 */
export function hitungProgresKelulusan(
  daftarMataKuliah: MataKuliahSelesai[],
  sksSedangDitempuh: number = 0,
  target: TargetKurikulum = TARGET_KURIKULUM_DEFAULT
): HasilProgresKelulusan {
  let sksWajibLulus = 0;
  let sksPilihanLulus = 0;

  for (const mk of daftarMataKuliah) {
    if (mk.lulus) {
      if (mk.jenis === "PILIHAN") {
        sksPilihanLulus += mk.sks;
      } else {
        sksWajibLulus += mk.sks;
      }
    }
  }

  const totalSksLulus = sksWajibLulus + sksPilihanLulus;

  const persenTotal = Math.min(
    100,
    Math.round((totalSksLulus / target.totalTargetSks) * 100)
  );
  const persenWajib = Math.min(
    100,
    Math.round((sksWajibLulus / target.targetWajibSks) * 100)
  );
  const persenPilihan = Math.min(
    100,
    Math.round((sksPilihanLulus / target.targetPilihanSks) * 100)
  );

  const sisaSksTotal = Math.max(0, target.totalTargetSks - totalSksLulus);
  const sisaSksWajib = Math.max(0, target.targetWajibSks - sksWajibLulus);
  const sisaSksPilihan = Math.max(0, target.targetPilihanSks - sksPilihanLulus);

  // Perkiraan sisa semester setelah memperhitungkan semester berjalan
  const sisaSetelahSemesterIni = Math.max(0, sisaSksTotal - sksSedangDitempuh);
  const perkiraanSemesterTersisa =
    sisaSetelahSemesterIni === 0
      ? 0
      : Math.ceil(sisaSetelahSemesterIni / target.rataRataSksPerSemester);

  // Di perguruan tinggi, syarat proposal/skripsi umumnya minimal 100-110 SKS lulus
  const statusKelayakanSkripsi = totalSksLulus + sksSedangDitempuh >= 100;

  return {
    totalSksLulus,
    totalTargetSks: target.totalTargetSks,
    persenTotal,
    sksWajibLulus,
    targetWajibSks: target.targetWajibSks,
    persenWajib,
    sksPilihanLulus,
    targetPilihanSks: target.targetPilihanSks,
    persenPilihan,
    sisaSksTotal,
    sisaSksWajib,
    sisaSksPilihan,
    sksSedangDitempuh,
    perkiraanSemesterTersisa,
    statusKelayakanSkripsi,
  };
}
