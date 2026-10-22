import { JenisAktivitas } from './tipe';

/**
 * Bobot poin per jenis aktivitas sesuai spesifikasi SIAJAR.
 */
export const BOBOT_AKTIVITAS: Record<JenisAktivitas, number> = {
  kumpul_tugas: 3,
  hadir_presensi: 1,
  selesai_kuis: 3,
  topik_diskusi: 2,
  balas_diskusi: 1,
  terbit_materi: 3,
  terbit_pengumuman: 1,
  terbit_tugas: 3,
  buat_kuis: 3,
  review_pengumpulan: 1,
  finalisasi_nilai: 3,
};

/**
 * Batas poin harian maksimal per jenis aktivitas (per hari per kelas, atau per sesi pertemuan).
 * Nilai null berarti tidak ada batas (unlimited).
 */
export const BATAS_HARIAN_POIN: Record<JenisAktivitas, number | null> = {
  kumpul_tugas: null,
  hadir_presensi: 1, // 1 sesi presensi = 1 poin
  selesai_kuis: null,
  topik_diskusi: 6, // Maks 6 poin / hari / kelas (3 topik)
  balas_diskusi: 5, // Maks 5 poin / hari / kelas (5 balasan)
  terbit_materi: null,
  terbit_pengumuman: 3, // Maks 3 poin / hari / kelas (3 pengumuman)
  terbit_tugas: null,
  buat_kuis: null,
  review_pengumpulan: 10, // Maks 10 poin / hari / kelas (10 review)
  finalisasi_nilai: null,
};

/**
 * Label ramah pengguna Bahasa Indonesia untuk masing-masing aktivitas.
 */
export const LABEL_AKTIVITAS: Record<JenisAktivitas, string> = {
  kumpul_tugas: 'Pengumpulan Tugas Kuliah',
  hadir_presensi: 'Kehadiran Presensi Perkuliahan',
  selesai_kuis: 'Penyelesaian Kuis / Ujian CBT',
  topik_diskusi: 'Pembuatan Topik Diskusi Forum',
  balas_diskusi: 'Balasan Diskusi Forum',
  terbit_materi: 'Penerbitan Materi Pembelajaran',
  terbit_pengumuman: 'Penerbitan Pengumuman Kelas',
  terbit_tugas: 'Penerbitan Tugas Perkuliahan',
  buat_kuis: 'Pembuatan Kuis / Ujian CBT',
  review_pengumpulan: 'Penilaian Pengumpulan Tugas',
  finalisasi_nilai: 'Finalisasi Nilai Perkuliahan',
};

/**
 * Ambang batas poin untuk pemetaan Level Kontribusi (0 s.d. 4).
 * - Level 0: 0 poin
 * - Level 1: 1 - 2 poin
 * - Level 2: 3 - 5 poin
 * - Level 3: 6 - 9 poin
 * - Level 4: 10+ poin
 */
export const AMBANG_LEVEL_POIN = {
  LEVEL_1_MIN: 1,
  LEVEL_1_MAX: 2,
  LEVEL_2_MIN: 3,
  LEVEL_2_MAX: 5,
  LEVEL_3_MIN: 6,
  LEVEL_3_MAX: 9,
  LEVEL_4_MIN: 10,
} as const;

/**
 * Nama hari disingkat Bahasa Indonesia, dimulai dari Senin (indeks 0).
 */
export const NAMA_HARI_SENIN_PERTAMA = [
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
  'Min',
] as const;

/**
 * Nama bulan Bahasa Indonesia.
 */
export const NAMA_BULAN_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;
