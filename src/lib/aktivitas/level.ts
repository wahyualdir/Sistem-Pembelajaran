import { LevelAktivitas } from './tipe';
import { AMBANG_LEVEL_POIN } from './konfigurasi';

/**
 * Mengubah jumlah poin harian menjadi tingkat/level 0 - 4.
 *
 * Pemetaan:
 * - 0 poin       -> Level 0
 * - 1 - 2 poin   -> Level 1
 * - 3 - 5 poin   -> Level 2
 * - 6 - 9 poin   -> Level 3
 * - 10+ poin     -> Level 4
 */
export function poinKeLevel(poin: number): LevelAktivitas {
  if (!poin || poin <= 0) return 0;
  if (poin <= AMBANG_LEVEL_POIN.LEVEL_1_MAX) return 1;
  if (poin <= AMBANG_LEVEL_POIN.LEVEL_2_MAX) return 2;
  if (poin <= AMBANG_LEVEL_POIN.LEVEL_3_MAX) return 3;
  return 4;
}

/**
 * Kelas Tailwind CSS untuk masing-masing level sel heatmap.
 * Bebas dari hardcoded hex code untuk mematuhi skrip cek-hex.
 */
export const KELAS_WARNA_LEVEL: Record<LevelAktivitas, string> = {
  0: 'bg-gray-soft/40 border-gray-soft/80 dark:bg-surface/30 dark:border-white/10 hover:border-ink/30',
  1: 'bg-primary/25 border-primary/30 hover:border-primary/50',
  2: 'bg-primary/50 border-primary/50 hover:border-primary/70',
  3: 'bg-primary/75 border-primary/70 hover:border-primary/90',
  4: 'bg-primary border-primary-dark hover:brightness-110 shadow-xs',
};

/**
 * Deskripsi tingkat intensitas aktivitas untuk atribut aksesibilitas dan tooltip.
 */
export const DESKRIPSI_LEVEL: Record<LevelAktivitas, string> = {
  0: 'Tidak ada aktivitas',
  1: 'Aktivitas rendah (1-2 poin)',
  2: 'Aktivitas sedang (3-5 poin)',
  3: 'Aktivitas tinggi (6-9 poin)',
  4: 'Aktivitas sangat tinggi (10+ poin)',
};
