/**
 * Modul Rekap Semester (Semester Recap)
 * Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md Bagian 9.2
 * Format tenang, retro-brutalist, tanpa istilah "Wrapped", menghargai privasi dan capaian autentik mahasiswa.
 */

export interface StudentRawSemesterStats {
  studentName: string;
  semesterLabel: string;
  totalChaptersPassed: number;
  totalChaptersAvailable: number;
  topicsMastery: Array<{
    name: string;
    level: 'kuat' | 'cukup' | 'perlu_latihan' | 'belum_cukup_data';
  }>;
  flashcardsReviewedCount: number;
  podcastSecondsListened: number;
  peerHelpAcceptedCount: number;
  totalXp: number;
}

export interface SemesterRecapPayload {
  title: string;
  studentName: string;
  semesterLabel: string;
  completionRatePct: number;
  totalChaptersPassed: number;
  strongTopics: string[];
  growthTopics: string[];
  flashcardsReviewedCount: number;
  podcastMinutesListened: number;
  peerHelpAcceptedCount: number;
  totalXp: number;
  headlineSummary: string;
  learningHabitBadge: string;
}

/**
 * Fungsi murni untuk mengagregasi data capaian menjadi Rekap Semester terstruktur
 */
export function buildSemesterRecap(stats: StudentRawSemesterStats): SemesterRecapPayload {
  const completionRatePct =
    stats.totalChaptersAvailable > 0
      ? Math.round((stats.totalChaptersPassed / stats.totalChaptersAvailable) * 100)
      : 0;

  const strongTopics = stats.topicsMastery
    .filter((t) => t.level === 'kuat')
    .map((t) => t.name);

  const growthTopics = stats.topicsMastery
    .filter((t) => t.level === 'cukup' || t.level === 'perlu_latihan')
    .map((t) => t.name);

  const podcastMinutesListened = Math.round((stats.podcastSecondsListened || 0) / 60);

  // Penentuan lencana kebiasaan belajar autentik
  let learningHabitBadge = 'Penjelajah Mandiri';
  if (stats.peerHelpAcceptedCount >= 5) {
    learningHabitBadge = 'Rekan Kolaboratif';
  } else if (stats.flashcardsReviewedCount >= 50) {
    learningHabitBadge = 'Pengulas Konsisten';
  } else if (podcastMinutesListened >= 60) {
    learningHabitBadge = 'Pendengar Konseptual';
  }

  // Ringkasan singkat naratif
  const headlineSummary = `Anda telah menuntaskan ${stats.totalChaptersPassed} bab pulau belajar (${completionRatePct}%) dengan ${strongTopics.length} topik dikuasai secara mendalam sepanjang ${stats.semesterLabel}.`;

  return {
    title: `Rekap Pembelajaran ${stats.semesterLabel}`,
    studentName: stats.studentName,
    semesterLabel: stats.semesterLabel,
    completionRatePct,
    totalChaptersPassed: stats.totalChaptersPassed,
    strongTopics,
    growthTopics,
    flashcardsReviewedCount: stats.flashcardsReviewedCount,
    podcastMinutesListened,
    peerHelpAcceptedCount: stats.peerHelpAcceptedCount,
    totalXp: stats.totalXp,
    headlineSummary,
    learningHabitBadge,
  };
}

/**
 * Masking sel laporan Kaprodi/Superadmin sesuai ambang K-Anonymity (N >= 5)
 */
export function maskCellIfBelowThreshold<T>(
  studentCount: number,
  realValue: T,
  threshold: number = 5,
  maskValue: string = '< 5 (Privasi Terjaga)'
): T | string {
  if (studentCount < threshold) {
    return maskValue;
  }
  return realValue;
}
