/**
 * Modul Akademik: Evaluasi Kelayakan Ujian dan Presensi
 * Dokumen Perencanaan Bab 2.3, Bab 6.5 & Bab 6.6:
 * - Minimal 75% kehadiran untuk boleh mengikuti UAS.
 * - Kartu Ujian hanya terbit bila:
 *   1. KRS disetujui (status === "DISETUJUI")
 *   2. Tagihan semester berjalan lunas atau berdispensasi (status === "LUNAS" || status === "DISPENSASI")
 *   3. Kehadiran presensi memenuhi batas (>= 75%)
 * - Bila belum terpenuhi, sebutkan syarat mana yang belum terpenuhi.
 * - Pengumpulan tugas: jika waktuKumpul > tenggat, tandai terlambat.
 */

export interface SyaratUjianInput {
  krsStatus: "DRAF" | "DIAJUKAN" | "DISETUJUI" | "DITOLAK";
  uktStatus: "BELUM" | "LUNAS" | "DISPENSASI";
  persentaseKehadiran: number;
  batasMinimalKehadiran?: number; // bawaan 75%
}

export interface HasilEvaluasiUjian {
  layak: boolean;
  alasanTidakLayak: string[];
  krsTerpenuhi: boolean;
  uktTerpenuhi: boolean;
  kehadiranTerpenuhi: boolean;
}

/**
 * Hitung persentase kehadiran mahasiswa
 * @param hadir Jumlah pertemuan hadir
 * @param total Jumlah total pertemuan yang telah dilaksanakan
 */
export function hitungPersentaseKehadiran(hadir: number, total: number): number {
  if (total <= 0) return 100.0; // Jika belum ada pertemuan, dianggap 100%
  const persentase = (hadir / total) * 100;
  return Math.round(persentase * 100) / 100;
}

/**
 * Evaluasi kelayakan kartu ujian mahasiswa
 */
export function evaluasiKelayakanUjian(
  input: SyaratUjianInput
): HasilEvaluasiUjian {
  const batas = input.batasMinimalKehadiran ?? 75.0;
  const alasan: string[] = [];

  const krsTerpenuhi = input.krsStatus === "DISETUJUI";
  if (!krsTerpenuhi) {
    alasan.push(
      input.krsStatus === "DIAJUKAN"
        ? "KRS Anda masih menunggu persetujuan Dosen Wali."
        : "KRS semester ini belum disetujui oleh Dosen Wali."
    );
  }

  const uktTerpenuhi = input.uktStatus === "LUNAS" || input.uktStatus === "DISPENSASI";
  if (!uktTerpenuhi) {
    alasan.push("Tagihan UKT semester berjalan belum lunas. Silakan lakukan pembayaran atau ajukan dispensasi.");
  }

  const kehadiranTerpenuhi = input.persentaseKehadiran >= batas;
  if (!kehadiranTerpenuhi) {
    alasan.push(
      `Kehadiran kuliah Anda (${input.persentaseKehadiran}%) kurang dari batas minimal (${batas}%).`
    );
  }

  const layak = krsTerpenuhi && uktTerpenuhi && kehadiranTerpenuhi;

  return {
    layak,
    alasanTidakLayak: alasan,
    krsTerpenuhi,
    uktTerpenuhi,
    kehadiranTerpenuhi,
  };
}

/**
 * Deteksi keterlambatan pengumpulan tugas kuliah
 */
export function cekKeterlambatanTugas(waktuKumpul: Date, tenggat: Date): boolean {
  return waktuKumpul.getTime() > tenggat.getTime();
}

