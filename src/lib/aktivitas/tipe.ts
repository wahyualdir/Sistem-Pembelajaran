/**
 * Tipe data untuk Fitur Grafik Kontribusi SIAJAR.
 */

export type JenisAktivitas =
  | 'kumpul_tugas'
  | 'hadir_presensi'
  | 'selesai_kuis'
  | 'topik_diskusi'
  | 'balas_diskusi'
  | 'terbit_materi'
  | 'terbit_pengumuman'
  | 'terbit_tugas'
  | 'buat_kuis'
  | 'review_pengumpulan'
  | 'finalisasi_nilai';

export type RoleSasaran = 'mahasiswa' | 'pengajar' | 'semua';

export type LevelAktivitas = 0 | 1 | 2 | 3 | 4;

export interface ItemAktivitasHarian {
  id?: string;
  userId: string;
  classId?: string | null;
  date: string; // Format 'YYYY-MM-DD'
  kind: JenisAktivitas;
  count: number;
  points: number;
}

export interface RingkasanHariAktivitas {
  date: string; // 'YYYY-MM-DD'
  totalPoints: number;
  totalCount: number;
  level: LevelAktivitas;
  details: Partial<Record<JenisAktivitas, { count: number; points: number }>>;
}

export interface SelGridKontribusi {
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: number; // 0 = Senin, ..., 6 = Minggu
  points: number;
  count: number;
  level: LevelAktivitas;
  isCurrentPeriod: boolean;
  details: Partial<Record<JenisAktivitas, { count: number; points: number }>>;
}

export interface KolomMingguGrid {
  weekIndex: number;
  days: (SelGridKontribusi | null)[]; // Array 7 elemen (indeks 0 = Senin, ..., 6 = Minggu)
}

export interface LabelBulanGrid {
  label: string;
  colIndex: number;
}

export interface StatistikAktivitas {
  totalAktivitas: number;
  totalPoin: number;
  hariAktif: number;
  rentangHari: number;
}

export interface HasilGridKontribusi {
  weeks: KolomMingguGrid[];
  months: LabelBulanGrid[];
  stats: StatistikAktivitas;
  startDate: string;
  endDate: string;
}
