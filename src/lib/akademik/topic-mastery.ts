/**
 * Perhitungan Kekuatan Topik (Topic Mastery)
 * Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md Bagian 7.2
 */

export type TopicMasteryLevel = 'belum_cukup_data' | 'perlu_latihan' | 'cukup' | 'kuat';

export interface TopicAttemptStats {
  attemptsCount: number;
  totalAnswered: number;
  totalCorrect: number;
}

/**
 * Fungsi murni untuk menghitung level kekuatan topik mahasiswa.
 * Mengambil rekap dari maksimal 3 percobaan terakhir:
 * - attemptsCount < 2 atau totalAnswered < 6 -> 'belum_cukup_data'
 * - ratio (correct / answered) >= 0.80 -> 'kuat'
 * - ratio (correct / answered) >= 0.60 -> 'cukup'
 * - di bawahnya -> 'perlu_latihan'
 */
export function computeTopicLevel(stats: TopicAttemptStats): TopicMasteryLevel {
  const { attemptsCount, totalAnswered, totalCorrect } = stats;

  if (attemptsCount < 2 || totalAnswered < 6) {
    return 'belum_cukup_data';
  }

  if (totalAnswered <= 0) {
    return 'belum_cukup_data';
  }

  // Jaga agar totalCorrect tidak melebihi totalAnswered
  const validCorrect = Math.max(0, Math.min(totalCorrect, totalAnswered));
  const ratio = validCorrect / totalAnswered;

  if (ratio >= 0.8) {
    return 'kuat';
  }
  if (ratio >= 0.6) {
    return 'cukup';
  }
  return 'perlu_latihan';
}

/**
 * Label ramah pengguna dalam Bahasa Indonesia untuk antarmuka.
 */
export function getTopicMasteryLabel(level: TopicMasteryLevel): string {
  switch (level) {
    case 'kuat':
      return 'Kuat';
    case 'cukup':
      return 'Cukup';
    case 'perlu_latihan':
      return 'Perlu Latihan';
    case 'belum_cukup_data':
    default:
      return 'Belum Cukup Data';
  }
}
