import { describe, it, expect } from 'vitest';

export type ActivityEventKind =
  | 'materi_dibuka'
  | 'podcast_diputar'
  | 'podcast_selesai'
  | 'kartu_direview'
  | 'kuis_selesai'
  | 'pulau_selesai'
  | 'tugas_dikumpulkan'
  | 'bantuan_diminta'
  | 'bantuan_diberikan'
  | 'bantuan_terbantu';

export const ACTIVITY_ALLOWED_META_KEYS: Record<ActivityEventKind, string[]> = {
  materi_dibuka: [],
  podcast_diputar: [],
  podcast_selesai: [],
  kartu_direview: ['jumlah', 'ingat', 'ragu', 'lupa'],
  kuis_selesai: ['skor', 'lulus', 'durasi_detik'],
  pulau_selesai: [],
  tugas_dikumpulkan: ['tepat_waktu'],
  bantuan_diminta: [],
  bantuan_diberikan: [],
  bantuan_terbantu: [],
};

export function sanitizeActivityMeta(
  kind: string,
  rawMeta?: Record<string, unknown>
): Record<string, unknown> {
  const allowedKeys = ACTIVITY_ALLOWED_META_KEYS[kind as ActivityEventKind];
  if (!allowedKeys) {
    throw new Error(`Jenis aktivitas tidak sah: ${kind}`);
  }
  if (!rawMeta || typeof rawMeta !== 'object') {
    return {};
  }
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(rawMeta)) {
    if (allowedKeys.includes(key)) {
      clean[key] = val;
    }
  }
  return clean;
}

export interface Chapter {
  id: string;
  class_id: string;
  position: number;
  title: string;
  is_optional: boolean;
  completion_rule: 'kuis' | 'materi';
  archived_at?: Date | null;
}

export interface ChapterProgress {
  student_id: string;
  chapter_id: string;
  passed_at?: Date | null;
  materials_done_at?: Date | null;
}

export interface ChapterUnlockOverride {
  chapter_id: string;
  student_id: string;
}

export function computeChapterState(
  studentId: string,
  chapterId: string,
  allChapters: Chapter[],
  progressList: ChapterProgress[],
  overrides: ChapterUnlockOverride[]
): 'selesai' | 'terbuka' | 'terkunci' {
  const target = allChapters.find((c) => c.id === chapterId);
  if (!target || target.archived_at) {
    return 'terkunci';
  }

  const prog = progressList.find(
    (p) => p.student_id === studentId && p.chapter_id === chapterId
  );

  // 1. Selesai
  if (target.completion_rule === 'kuis' && prog?.passed_at) {
    return 'selesai';
  }
  if (target.completion_rule === 'materi' && prog?.materials_done_at) {
    return 'selesai';
  }

  // 2. Override manual dosen
  const hasOverride = overrides.some(
    (o) => o.student_id === studentId && o.chapter_id === chapterId
  );
  if (hasOverride) {
    return 'terbuka';
  }

  // 3. Bab pertama yang aktif
  const previousActive = allChapters
    .filter((c) => c.class_id === target.class_id && !c.archived_at && c.position < target.position)
    .sort((a, b) => a.position - b.position);

  if (previousActive.length === 0) {
    return 'terbuka';
  }

  // 4. Prasyarat Linear: semua bab wajib sebelumnya harus selesai
  for (const prev of previousActive) {
    if (!prev.is_optional) {
      const prevState = computeChapterState(
        studentId,
        prev.id,
        allChapters,
        progressList,
        overrides
      );
      if (prevState !== 'selesai') {
        return 'terkunci';
      }
    }
  }

  return 'terbuka';
}

export function isFeatureEnabled(
  classId: string,
  feature: 'peta_pulau' | 'flashcard' | 'podcast' | 'tukar_keahlian' | 'rekap_semester',
  globalPolicies: Record<string, boolean>,
  classFlags: Record<string, Record<string, boolean>>
): boolean {
  const globalKey = `feature_${feature}_enabled`;
  if (globalPolicies[globalKey] === false) {
    return false;
  }

  // Ketergantungan: flashcard, podcast, tukar_keahlian butuh peta_pulau aktif
  if (['flashcard', 'podcast', 'tukar_keahlian'].includes(feature)) {
    if (!isFeatureEnabled(classId, 'peta_pulau', globalPolicies, classFlags)) {
      return false;
    }
  }

  return classFlags[classId]?.[feature] ?? false;
}

describe('Peta Pulau Fase P0: Fondasi, Bab, dan Log Aktivitas', () => {
  describe('1. Sanitasi Log Aktivitas & Daftar Putih (Lampiran D)', () => {
    it('membuang kunci metadata di luar daftar putih', () => {
      const sanitized = sanitizeActivityMeta('kartu_direview', {
        jumlah: 15,
        ingat: 10,
        ragu: 3,
        lupa: 2,
        unauthorized_key: 'payload_rahasia',
        user_tracking: 'location_xyz',
      });

      expect(sanitized).toEqual({
        jumlah: 15,
        ingat: 10,
        ragu: 3,
        lupa: 2,
      });
      expect(sanitized).not.toHaveProperty('unauthorized_key');
      expect(sanitized).not.toHaveProperty('user_tracking');
    });

    it('menolak jenis aktivitas yang tidak ada dalam daftar putih resmi', () => {
      expect(() => {
        sanitizeActivityMeta('klik_iklan_palsu', { id: 123 });
      }).toThrow('Jenis aktivitas tidak sah: klik_iklan_palsu');
    });

    it('mengosongkan metadata untuk jenis kejadian tanpa meta', () => {
      const sanitized = sanitizeActivityMeta('materi_dibuka', {
        judul: 'Pengenalan Web',
        halaman: 4,
      });
      expect(sanitized).toEqual({});
    });
  });

  describe('2. Perhitungan Status Bab (computeChapterState) - 12 Skenario', () => {
    const chapters: Chapter[] = [
      { id: 'ch-1', class_id: 'c-1', position: 1, title: 'Bab 1', is_optional: false, completion_rule: 'kuis' },
      { id: 'ch-2', class_id: 'c-1', position: 2, title: 'Bab 2', is_optional: false, completion_rule: 'kuis' },
      { id: 'ch-3', class_id: 'c-1', position: 3, title: 'Bab 3 (Opsional)', is_optional: true, completion_rule: 'kuis' },
      { id: 'ch-4', class_id: 'c-1', position: 4, title: 'Bab 4', is_optional: false, completion_rule: 'materi' },
      { id: 'ch-archived', class_id: 'c-1', position: 0, title: 'Bab Usang', is_optional: false, completion_rule: 'kuis', archived_at: new Date() },
    ];

    it('Skenario 1: Bab pertama aktif selalu berstatus terbuka', () => {
      const state = computeChapterState('mhs-1', 'ch-1', chapters, [], []);
      expect(state).toBe('terbuka');
    });

    it('Skenario 2: Bab kedua terkunci bila bab pertama belum selesai', () => {
      const state = computeChapterState('mhs-1', 'ch-2', chapters, [], []);
      expect(state).toBe('terkunci');
    });

    it('Skenario 3: Bab pertama berstatus selesai bila kuis telah lulus', () => {
      const progress: ChapterProgress[] = [
        { student_id: 'mhs-1', chapter_id: 'ch-1', passed_at: new Date() },
      ];
      const state = computeChapterState('mhs-1', 'ch-1', chapters, progress, []);
      expect(state).toBe('selesai');
    });

    it('Skenario 4: Bab kedua terbuka setelah bab pertama lulus', () => {
      const progress: ChapterProgress[] = [
        { student_id: 'mhs-1', chapter_id: 'ch-1', passed_at: new Date() },
      ];
      const state = computeChapterState('mhs-1', 'ch-2', chapters, progress, []);
      expect(state).toBe('terbuka');
    });

    it('Skenario 5: Override dosen membuka bab yang seharusnya terkunci', () => {
      const overrides: ChapterUnlockOverride[] = [
        { student_id: 'mhs-1', chapter_id: 'ch-2' },
      ];
      const state = computeChapterState('mhs-1', 'ch-2', chapters, [], overrides);
      expect(state).toBe('terbuka');
    });

    it('Skenario 6: Bab opsional yang belum selesai tidak menghalangi bab berikutnya', () => {
      // Bab 1 selesai, Bab 2 selesai, Bab 3 (opsional) belum selesai -> Bab 4 harus terbuka
      const progress: ChapterProgress[] = [
        { student_id: 'mhs-1', chapter_id: 'ch-1', passed_at: new Date() },
        { student_id: 'mhs-1', chapter_id: 'ch-2', passed_at: new Date() },
      ];
      const state = computeChapterState('mhs-1', 'ch-4', chapters, progress, []);
      expect(state).toBe('terbuka');
    });

    it('Skenario 7: Bab dengan aturan materi selesai saat materials_done_at terisi', () => {
      const progress: ChapterProgress[] = [
        { student_id: 'mhs-1', chapter_id: 'ch-4', materials_done_at: new Date() },
      ];
      const state = computeChapterState('mhs-1', 'ch-4', chapters, progress, []);
      expect(state).toBe('selesai');
    });

    it('Skenario 8: Bab arsip selalu berstatus terkunci dan tidak tampil', () => {
      const state = computeChapterState('mhs-1', 'ch-archived', chapters, [], []);
      expect(state).toBe('terkunci');
    });

    it('Skenario 9: Bab tidak dikenal mengembalikan status terkunci', () => {
      const state = computeChapterState('mhs-1', 'ch-non-existent', chapters, [], []);
      expect(state).toBe('terkunci');
    });

    it('Skenario 10: Status selesai tidak pernah dicabut walaupun ada bab opsional di tengah', () => {
      const progress: ChapterProgress[] = [
        { student_id: 'mhs-1', chapter_id: 'ch-1', passed_at: new Date() },
      ];
      expect(computeChapterState('mhs-1', 'ch-1', chapters, progress, [])).toBe('selesai');
    });

    it('Skenario 11: Bab pertama diarsipkan tidak menghalangi bab berikutnya menjadi yang pertama terbuka', () => {
      const chaptersWithFirstArchived: Chapter[] = [
        { id: 'ch-old', class_id: 'c-2', position: 1, title: 'Bab Lama', is_optional: false, completion_rule: 'kuis', archived_at: new Date() },
        { id: 'ch-new', class_id: 'c-2', position: 2, title: 'Bab Baru', is_optional: false, completion_rule: 'kuis' },
      ];
      const state = computeChapterState('mhs-1', 'ch-new', chaptersWithFirstArchived, [], []);
      expect(state).toBe('terbuka');
    });

    it('Skenario 12: Semua bab opsional terbuka tanpa syarat kuis', () => {
      const allOptional: Chapter[] = [
        { id: 'op-1', class_id: 'c-3', position: 1, title: 'Op 1', is_optional: true, completion_rule: 'kuis' },
        { id: 'op-2', class_id: 'c-3', position: 2, title: 'Op 2', is_optional: true, completion_rule: 'kuis' },
      ];
      expect(computeChapterState('mhs-1', 'op-1', allOptional, [], [])).toBe('terbuka');
      expect(computeChapterState('mhs-1', 'op-2', allOptional, [], [])).toBe('terbuka');
    });
  });

  describe('3. Penanda Fitur Kelas & Dependensi (isFeatureEnabled)', () => {
    const globalPolicies = {
      feature_peta_pulau_enabled: true,
      feature_flashcard_enabled: true,
      feature_podcast_enabled: false, // Default mati
      feature_tukar_keahlian_enabled: true,
      feature_rekap_semester_enabled: true,
    };

    const classFlags = {
      'class-1': {
        peta_pulau: true,
        flashcard: true,
        podcast: true,
        tukar_keahlian: true,
        rekap_semester: true,
      },
      'class-2': {
        peta_pulau: false, // Peta pulau mati di kelas 2
        flashcard: true,
      },
    };

    it('mengembalikan true jika kebijakan global aktif dan kelas mengaktifkan fitur', () => {
      expect(isFeatureEnabled('class-1', 'peta_pulau', globalPolicies, classFlags)).toBe(true);
      expect(isFeatureEnabled('class-1', 'flashcard', globalPolicies, classFlags)).toBe(true);
    });

    it('mengembalikan false bila kebijakan global dimatikan oleh Super Admin (misal podcast)', () => {
      expect(isFeatureEnabled('class-1', 'podcast', globalPolicies, classFlags)).toBe(false);
    });

    it('mengembalikan false bila fitur ketergantungan (peta_pulau) mati di kelas', () => {
      expect(isFeatureEnabled('class-2', 'flashcard', globalPolicies, classFlags)).toBe(false);
    });

    it('bawaan mati untuk kelas yang belum mengatur penanda fitur', () => {
      expect(isFeatureEnabled('class-unknown', 'peta_pulau', globalPolicies, classFlags)).toBe(false);
    });
  });
});
