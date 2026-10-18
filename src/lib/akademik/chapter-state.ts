/**
 * Algoritma Penentuan Status Bab / Pulau (chapter_state)
 * Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md Bagian 7.1
 * Menghasilkan salah satu status: 'selesai', 'terbuka', atau 'terkunci'.
 */

export type ChapterState = 'selesai' | 'terbuka' | 'terkunci';

export interface ChapterInfo {
  id: string;
  classId: string;
  position: number;
  title: string;
  isOptional: boolean;
  completionRule: 'kuis' | 'materi';
  archivedAt?: string | null;
}

export interface StudentProgressInfo {
  passedAt?: string | null;
  materialsDoneAt?: string | null;
  bestScore?: number;
}

/**
 * Menghitung status bab secara fungsional murni sesuai aturan bisnis SIAJAR:
 * - 'selesai': kuis lulus (passed_at ada) atau materi selesai (materials_done_at ada)
 * - 'terbuka': bab pertama aktif, ada override manual dosen, atau seluruh bab wajib sebelumnya selesai
 * - 'terkunci': selain kondisi di atas atau jika bab diarsipkan
 */
export function computeChapterState(
  targetChapterId: string,
  allClassChapters: ChapterInfo[],
  progressMap: Record<string, StudentProgressInfo>,
  overrides: string[] = []
): ChapterState {
  const target = allClassChapters.find((c) => c.id === targetChapterId);
  if (!target || target.archivedAt) {
    return 'terkunci';
  }

  const prog = progressMap[targetChapterId];

  // 1. Status Selesai: Mahasiswa yang sudah lulus tetap lulus permanen
  if (target.completionRule === 'kuis' && prog?.passedAt) {
    return 'selesai';
  }
  if (target.completionRule === 'materi' && prog?.materialsDoneAt) {
    return 'selesai';
  }

  // 2. Status Terbuka melalui override manual dosen
  if (overrides.includes(targetChapterId)) {
    return 'terbuka';
  }

  // 3. Bab aktif pertama di kelas selalu Terbuka
  const activeChapters = allClassChapters
    .filter((c) => !c.archivedAt && c.classId === target.classId)
    .sort((a, b) => a.position - b.position);

  if (activeChapters.length > 0 && activeChapters[0].id === target.id) {
    return 'terbuka';
  }

  // 4. Prasyarat linear: semua bab wajib (bukan opsional) dengan posisi lebih kecil harus sudah selesai
  const precedingMandatory = activeChapters.filter(
    (c) => c.position < target.position && !c.isOptional
  );

  const allPrecedingPassed = precedingMandatory.every((prev) => {
    const prevProg = progressMap[prev.id];
    if (prev.completionRule === 'kuis') return !!prevProg?.passedAt;
    if (prev.completionRule === 'materi') return !!prevProg?.materialsDoneAt;
    return false;
  });

  return allPrecedingPassed ? 'terbuka' : 'terkunci';
}
