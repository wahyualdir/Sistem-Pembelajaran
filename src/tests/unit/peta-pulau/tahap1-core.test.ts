import { describe, it, expect } from 'vitest';
import {
  computeTopicLevel,
  getTopicMasteryLabel,
  type TopicAttemptStats,
} from '@/lib/akademik/topic-mastery';
import {
  buildDailyPriorities,
  getWibDateString,
  type DailyPrioritiesInput,
  type PriorityAssignment,
  type PriorityChapter,
  type PriorityExam,
} from '@/lib/akademik/daily-priorities';
import {
  computeChapterState,
  type ChapterInfo,
  type StudentProgressInfo,
} from '@/lib/akademik/chapter-state';

describe('Tahap 1: Inti Belajar — Unit Tests', () => {
  describe('1. Kekuatan Topik (computeTopicLevel) - Minimal 10 Kasus', () => {
    it('Kasus 1: Jumlah percobaan kurang dari 2 menghasilkan belum_cukup_data', () => {
      const stats: TopicAttemptStats = { attemptsCount: 1, totalAnswered: 10, totalCorrect: 10 };
      expect(computeTopicLevel(stats)).toBe('belum_cukup_data');
    });

    it('Kasus 2: Jumlah soal terjawab kurang dari 6 menghasilkan belum_cukup_data', () => {
      const stats: TopicAttemptStats = { attemptsCount: 2, totalAnswered: 5, totalCorrect: 5 };
      expect(computeTopicLevel(stats)).toBe('belum_cukup_data');
    });

    it('Kasus 3: Tepat 2 percobaan dan 6 soal terjawab dengan 5 benar (rasio ~0.833) -> kuat', () => {
      const stats: TopicAttemptStats = { attemptsCount: 2, totalAnswered: 6, totalCorrect: 5 };
      expect(computeTopicLevel(stats)).toBe('kuat');
    });

    it('Kasus 4: Tepat batas 0.80 (8 dari 10 benar) -> kuat', () => {
      const stats: TopicAttemptStats = { attemptsCount: 3, totalAnswered: 10, totalCorrect: 8 };
      expect(computeTopicLevel(stats)).toBe('kuat');
    });

    it('Kasus 5: Tepat di bawah 0.80 misal 0.79 (79 dari 100 benar) -> cukup', () => {
      const stats: TopicAttemptStats = { attemptsCount: 3, totalAnswered: 100, totalCorrect: 79 };
      expect(computeTopicLevel(stats)).toBe('cukup');
    });

    it('Kasus 6: Tepat batas 0.60 (6 dari 10 benar) -> cukup', () => {
      const stats: TopicAttemptStats = { attemptsCount: 2, totalAnswered: 10, totalCorrect: 6 };
      expect(computeTopicLevel(stats)).toBe('cukup');
    });

    it('Kasus 7: Tepat di bawah 0.60 misal 0.59 (59 dari 100 benar) -> perlu_latihan', () => {
      const stats: TopicAttemptStats = { attemptsCount: 2, totalAnswered: 100, totalCorrect: 59 };
      expect(computeTopicLevel(stats)).toBe('perlu_latihan');
    });

    it('Kasus 8: 0 benar dari 10 soal -> perlu_latihan', () => {
      const stats: TopicAttemptStats = { attemptsCount: 2, totalAnswered: 10, totalCorrect: 0 };
      expect(computeTopicLevel(stats)).toBe('perlu_latihan');
    });

    it('Kasus 9: totalAnswered bernilai 0 menghasilkan belum_cukup_data', () => {
      const stats: TopicAttemptStats = { attemptsCount: 3, totalAnswered: 0, totalCorrect: 0 };
      expect(computeTopicLevel(stats)).toBe('belum_cukup_data');
    });

    it('Kasus 10: correct melebihi answered tetap dibatasi dan menghasilkan kuat', () => {
      const stats: TopicAttemptStats = { attemptsCount: 2, totalAnswered: 8, totalCorrect: 12 };
      expect(computeTopicLevel(stats)).toBe('kuat');
    });

    it('Kasus 11: Label ramah pengguna dalam Bahasa Indonesia sesuai spesifikasi', () => {
      expect(getTopicMasteryLabel('kuat')).toBe('Kuat');
      expect(getTopicMasteryLabel('cukup')).toBe('Cukup');
      expect(getTopicMasteryLabel('perlu_latihan')).toBe('Perlu Latihan');
      expect(getTopicMasteryLabel('belum_cukup_data')).toBe('Belum Cukup Data');
    });
  });

  describe('2. Prioritas Hari Ini (buildDailyPriorities) - Minimal 15 Fixture', () => {
    const fixedNow = new Date('2026-10-20T10:00:00+07:00'); // Pukul 10.00 WIB

    it('Fixture 1: Menghasilkan daftar kosong bila tidak ada aktivitas mendesak', () => {
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [],
        chapters: [],
        cardsDueCount: 0,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result).toHaveLength(0);
    });

    it('Fixture 2: Ujian berbobot hari ini mendapat skor tertinggi 120', () => {
      const exam: PriorityExam = {
        id: 'ex-1',
        classId: 'c-1',
        className: 'Basis Data',
        title: 'UTS Teori Basis Data',
        isOpenToday: true,
        isWeighted: true,
      };
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [exam],
        chapters: [],
        cardsDueCount: 0,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(120);
      expect(result[0].key).toBe('ujian:ex-1');
    });

    it('Fixture 3: Ujian tidak berbobot atau tidak dibuka hari ini tidak mendapat skor 120', () => {
      const exam: PriorityExam = {
        id: 'ex-2',
        classId: 'c-1',
        className: 'Basis Data',
        title: 'Kuis Latihan',
        isOpenToday: false,
        isWeighted: false,
      };
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [exam],
        chapters: [],
        cardsDueCount: 0,
      };
      expect(buildDailyPriorities(input, fixedNow)).toHaveLength(0);
    });

    it('Fixture 4: Tugas belum dikumpulkan dalam 24 jam mendapat skor 100 + 10 = 110', () => {
      const ass: PriorityAssignment = {
        id: 'ass-1',
        classId: 'c-1',
        className: 'Pemrograman Web',
        title: 'Tugas CRUD API',
        effectiveDueDate: new Date('2026-10-20T22:00:00+07:00'), // 12 jam lagi
        hasSubmission: false,
        isOverdue: false,
        canSubmitLate: false,
      };
      const input: DailyPrioritiesInput = {
        assignments: [ass],
        exams: [],
        chapters: [],
        cardsDueCount: 0,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(110);
      expect(result[0].reason).toContain('Tenggat waktu dalam');
    });

    it('Fixture 5: Tugas dalam 24-48 jam mendapat skor 80 + 10 = 90', () => {
      const ass: PriorityAssignment = {
        id: 'ass-2',
        classId: 'c-1',
        className: 'Pemrograman Web',
        title: 'Tugas CSS Tailwind',
        effectiveDueDate: new Date('2026-10-21T18:00:00+07:00'), // 32 jam lagi
        hasSubmission: false,
        isOverdue: false,
        canSubmitLate: false,
      };
      const input: DailyPrioritiesInput = {
        assignments: [ass],
        exams: [],
        chapters: [],
        cardsDueCount: 0,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(90);
      expect(result[0].reason).toBe('Tenggat waktu besok.');
    });

    it('Fixture 6: Tugas dalam 48-72 jam mendapat skor 60 + 10 = 70', () => {
      const ass: PriorityAssignment = {
        id: 'ass-3',
        classId: 'c-1',
        className: 'Jaringan Komputer',
        title: 'Praktikum Subnetting',
        effectiveDueDate: new Date('2026-10-22T18:00:00+07:00'), // 56 jam lagi
        hasSubmission: false,
        isOverdue: false,
        canSubmitLate: false,
      };
      const input: DailyPrioritiesInput = {
        assignments: [ass],
        exams: [],
        chapters: [],
        cardsDueCount: 0,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(70);
    });

    it('Fixture 7: Tugas lewat tenggat yang masih bisa dikumpulkan mendapat skor 90', () => {
      const ass: PriorityAssignment = {
        id: 'ass-late',
        classId: 'c-1',
        className: 'Algoritma',
        title: 'Tugas Binary Search',
        effectiveDueDate: new Date('2026-10-19T23:59:00+07:00'), // Kemarin
        hasSubmission: false,
        isOverdue: true,
        canSubmitLate: true,
      };
      const input: DailyPrioritiesInput = {
        assignments: [ass],
        exams: [],
        chapters: [],
        cardsDueCount: 0,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(90);
      expect(result[0].reason).toContain('Penalti berjalan');
    });

    it('Fixture 8: Tugas lewat 7 hari tidak muncul dalam daftar prioritas', () => {
      const ass: PriorityAssignment = {
        id: 'ass-far',
        classId: 'c-1',
        className: 'Etika Profesi',
        title: 'Makalah Akhir',
        effectiveDueDate: new Date('2026-11-15T23:59:00+07:00'), // > 7 hari
        hasSubmission: false,
        isOverdue: false,
        canSubmitLate: false,
      };
      const input: DailyPrioritiesInput = {
        assignments: [ass],
        exams: [],
        chapters: [],
        cardsDueCount: 0,
      };
      expect(buildDailyPriorities(input, fixedNow)).toHaveLength(0);
    });

    it('Fixture 9: Target bab lewat tenggat dan belum selesai mendapat skor 70', () => {
      const chap: PriorityChapter = {
        id: 'ch-overdue',
        classId: 'c-1',
        className: 'Kecerdasan Buatan',
        title: 'Bab 2: Search Tree',
        isCompleted: false,
        isUnlocked: true,
        targetDate: new Date('2026-10-18T00:00:00+07:00'), // 2 hari lalu
        passScore: 70,
        attemptsCount: 0,
        hasStarted: false,
      };
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [],
        chapters: [chap],
        cardsDueCount: 0,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(70);
      expect(result[0].reason).toBe('Target tanggal bab sudah lewat.');
    });

    it('Fixture 10: Kartu jatuh tempo 30 kartu mendapat skor 65 dengan estimasi waktu 10 menit', () => {
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [],
        chapters: [],
        cardsDueCount: 30, // 30 x 20 detik = 600 detik = 10 menit
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(65);
      expect(result[0].title).toBe('Ulas 30 kartu (sekitar 10 menit)');
    });

    it('Fixture 11: Kartu jatuh tempo antara 10-29 kartu mendapat skor 55', () => {
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [],
        chapters: [],
        cardsDueCount: 15,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(55);
    });

    it('Fixture 12: Kartu jatuh tempo antara 1-9 kartu mendapat skor 45', () => {
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [],
        chapters: [],
        cardsDueCount: 4,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(45);
    });

    it('Fixture 13: Kuis bab pernah dicoba tetapi belum lulus mendapat skor 50', () => {
      const chap: PriorityChapter = {
        id: 'ch-quiz',
        classId: 'c-1',
        className: 'Sistem Operasi',
        title: 'Bab 3: Sinkronisasi Proses',
        isCompleted: false,
        isUnlocked: true,
        bestScore: 62,
        passScore: 70,
        attemptsCount: 2,
        hasStarted: true,
      };
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [],
        chapters: [chap],
        cardsDueCount: 0,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(50);
      expect(result[0].reason).toBe('Skor terbaik 62, perlu 70.');
    });

    it('Fixture 14: Lanjutkan pulau terbuka yang belum dimulai mendapat skor 40', () => {
      const chap: PriorityChapter = {
        id: 'ch-new',
        classId: 'c-1',
        className: 'Sistem Operasi',
        title: 'Bab 4: Deadlock',
        isCompleted: false,
        isUnlocked: true,
        passScore: 70,
        attemptsCount: 0,
        hasStarted: false,
      };
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [],
        chapters: [chap],
        cardsDueCount: 0,
      };
      const result = buildDailyPriorities(input, fixedNow);
      expect(result[0].score).toBe(40);
      expect(result[0].reason).toBe('Pulau terbuka belum dimulai.');
    });

    it('Fixture 15: Butir disembunyikan mahasiswa hari ini difilter keluar', () => {
      const exam: PriorityExam = {
        id: 'ex-hidden',
        classId: 'c-1',
        className: 'Kriptografi',
        title: 'Ujian RSA',
        isOpenToday: true,
        isWeighted: true,
      };
      const input: DailyPrioritiesInput = {
        assignments: [],
        exams: [exam],
        chapters: [],
        cardsDueCount: 0,
        dismissedItemKeys: ['ujian:ex-hidden'],
      };
      expect(buildDailyPriorities(input, fixedNow)).toHaveLength(0);
    });

    it('Fixture 16: Hasil dipotong tepat maksimal 5 butir dengan urutan skor menurun dan tie-break tenggat', () => {
      const input: DailyPrioritiesInput = {
        assignments: [
          {
            id: 'ass-a',
            classId: 'c-1',
            className: 'A-Class',
            title: 'Tugas A',
            effectiveDueDate: new Date('2026-10-20T12:00:00+07:00'),
            hasSubmission: false,
            isOverdue: false,
            canSubmitLate: false,
          },
          {
            id: 'ass-b',
            classId: 'c-2',
            className: 'B-Class',
            title: 'Tugas B',
            effectiveDueDate: new Date('2026-10-20T14:00:00+07:00'),
            hasSubmission: false,
            isOverdue: false,
            canSubmitLate: false,
          },
        ],
        exams: [
          {
            id: 'ex-1',
            classId: 'c-1',
            className: 'Class 1',
            title: 'Exam 1',
            isOpenToday: true,
            isWeighted: true,
          },
        ],
        chapters: [
          {
            id: 'ch-1',
            classId: 'c-1',
            className: 'Class 1',
            title: 'Chap 1',
            isCompleted: false,
            isUnlocked: true,
            targetDate: new Date('2026-10-18T00:00:00+07:00'),
            passScore: 70,
            attemptsCount: 0,
            hasStarted: false,
          },
          {
            id: 'ch-2',
            classId: 'c-2',
            className: 'Class 2',
            title: 'Chap 2',
            isCompleted: false,
            isUnlocked: true,
            attemptsCount: 1,
            bestScore: 50,
            passScore: 70,
            hasStarted: true,
          },
          {
            id: 'ch-3',
            classId: 'c-3',
            className: 'Class 3',
            title: 'Chap 3',
            isCompleted: false,
            isUnlocked: true,
            attemptsCount: 0,
            passScore: 70,
            hasStarted: false,
          },
        ],
        cardsDueCount: 20,
      };

      const result = buildDailyPriorities(input, fixedNow);
      expect(result).toHaveLength(5); // Maksimal 5
      // Urutan skor: Exam (120) -> Tugas A (110) -> Tugas B (110) -> Chap 1 (70) -> Cards (55)
      expect(result[0].score).toBe(120);
      expect(result[1].score).toBe(110);
      expect(result[1].key).toBe('tugas:ass-a'); // Karena dueDate jam 12 lebih awal dari jam 14
      expect(result[2].score).toBe(110);
      expect(result[2].key).toBe('tugas:ass-b');
      expect(result[3].score).toBe(70);
      expect(result[4].score).toBe(55);
    });

    it('Fixture 17: Validasi format tanggal zona WIB', () => {
      const utcDate = new Date('2026-10-19T20:00:00Z'); // 20.00 UTC = 03.00 WIB tanggal 20 Oktober
      expect(getWibDateString(utcDate)).toBe('2026-10-20');
    });
  });

  describe('3. Penentuan Status Bab (chapter_state) - Minimal 12 Skenario', () => {
    const chapters: ChapterInfo[] = [
      {
        id: 'ch-1',
        classId: 'c-101',
        position: 1,
        title: 'Bab 1: Pengantar Basis Data',
        isOptional: false,
        completionRule: 'kuis',
      },
      {
        id: 'ch-2',
        classId: 'c-101',
        position: 2,
        title: 'Bab 2: Desain Relasional (Opsional)',
        isOptional: true,
        completionRule: 'kuis',
      },
      {
        id: 'ch-3',
        classId: 'c-101',
        position: 3,
        title: 'Bab 3: Normalisasi Tingkat Lanjut',
        isOptional: false,
        completionRule: 'kuis',
      },
      {
        id: 'ch-4',
        classId: 'c-101',
        position: 4,
        title: 'Bab 4: Arsitektur Transaksi ACID',
        isOptional: false,
        completionRule: 'materi',
      },
      {
        id: 'ch-archived',
        classId: 'c-101',
        position: 5,
        title: 'Bab Arsip Lampau',
        isOptional: false,
        completionRule: 'kuis',
        archivedAt: '2026-09-01T00:00:00Z',
      },
    ];

    it('Skenario 1: Bab pertama di kelas selalu berstatus terbuka meskipun belum ada progres', () => {
      const state = computeChapterState('ch-1', chapters, {});
      expect(state).toBe('terbuka');
    });

    it('Skenario 2: Bab 3 terkunci jika Bab 1 wajib sebelumnya belum selesai', () => {
      const state = computeChapterState('ch-3', chapters, {});
      expect(state).toBe('terkunci');
    });

    it('Skenario 3: Bab 1 menjadi selesai ketika kuis dinyatakan lulus (passedAt ada)', () => {
      const progress: Record<string, StudentProgressInfo> = {
        'ch-1': { passedAt: '2026-10-15T10:00:00Z', bestScore: 85 },
      };
      const state = computeChapterState('ch-1', chapters, progress);
      expect(state).toBe('selesai');
    });

    it('Skenario 4: Bab 2 (opsional) terbuka setelah Bab 1 selesai', () => {
      const progress: Record<string, StudentProgressInfo> = {
        'ch-1': { passedAt: '2026-10-15T10:00:00Z', bestScore: 85 },
      };
      const state = computeChapterState('ch-2', chapters, progress);
      expect(state).toBe('terbuka');
    });

    it('Skenario 5: Bab 3 (wajib) langsung terbuka setelah Bab 1 selesai, tanpa terhalang Bab 2 (opsional)', () => {
      const progress: Record<string, StudentProgressInfo> = {
        'ch-1': { passedAt: '2026-10-15T10:00:00Z', bestScore: 85 },
        // ch-2 opsional dan belum dikerjakan sama sekali
      };
      const state = computeChapterState('ch-3', chapters, progress);
      expect(state).toBe('terbuka');
    });

    it('Skenario 6: Bab 4 (aturan materi) terkunci jika Bab 3 (wajib) belum selesai', () => {
      const progress: Record<string, StudentProgressInfo> = {
        'ch-1': { passedAt: '2026-10-15T10:00:00Z', bestScore: 85 },
      };
      const state = computeChapterState('ch-4', chapters, progress);
      expect(state).toBe('terkunci');
    });

    it('Skenario 7: Bab 4 terbuka setelah Bab 3 dinyatakan lulus kuis', () => {
      const progress: Record<string, StudentProgressInfo> = {
        'ch-1': { passedAt: '2026-10-15T10:00:00Z', bestScore: 85 },
        'ch-3': { passedAt: '2026-10-16T12:00:00Z', bestScore: 90 },
      };
      const state = computeChapterState('ch-4', chapters, progress);
      expect(state).toBe('terbuka');
    });

    it('Skenario 8: Bab 4 menjadi selesai ketika seluruh materi dibaca (materialsDoneAt terisi)', () => {
      const progress: Record<string, StudentProgressInfo> = {
        'ch-1': { passedAt: '2026-10-15T10:00:00Z' },
        'ch-3': { passedAt: '2026-10-16T12:00:00Z' },
        'ch-4': { materialsDoneAt: '2026-10-17T09:00:00Z' },
      };
      const state = computeChapterState('ch-4', chapters, progress);
      expect(state).toBe('selesai');
    });

    it('Skenario 9: Bab yang diarsipkan selalu mengembalikan status terkunci', () => {
      const state = computeChapterState('ch-archived', chapters, {});
      expect(state).toBe('terkunci');
    });

    it('Skenario 10: Override manual dosen membuka pulau meskipun prasyarat linear belum terpenuhi', () => {
      // Mahasiswa belum mengerjakan bab apa pun, tetapi dosen memberikan override pada Bab 4
      const state = computeChapterState('ch-4', chapters, {}, ['ch-4']);
      expect(state).toBe('terbuka');
    });

    it('Skenario 11: Bab id yang tidak terdaftar di kelas mengembalikan terkunci', () => {
      const state = computeChapterState('ch-nonexistent', chapters, {});
      expect(state).toBe('terkunci');
    });

    it('Skenario 12: Penambahan bab baru di tengah tidak membatalkan status selesai pada bab yang sudah lulus', () => {
      const updatedChapters: ChapterInfo[] = [
        ...chapters.slice(0, 2),
        {
          id: 'ch-inserted',
          classId: 'c-101',
          position: 2.5,
          title: 'Bab Sisipan Baru',
          isOptional: false,
          completionRule: 'kuis',
        },
        ...chapters.slice(2),
      ];

      const progress: Record<string, StudentProgressInfo> = {
        'ch-1': { passedAt: '2026-10-15T10:00:00Z' },
        'ch-3': { passedAt: '2026-10-16T12:00:00Z' }, // Bab 3 sudah lulus sebelum bab sisipan ada
      };

      // Status Bab 3 tetap selesai
      expect(computeChapterState('ch-3', updatedChapters, progress)).toBe('selesai');
      // Bab sisipan baru berstatus terbuka karena Bab 1 sudah selesai
      expect(computeChapterState('ch-inserted', updatedChapters, progress)).toBe('terbuka');
    });

    it('Skenario 13: Bila bab pertama diarsipkan, bab aktif berikutnya otomatis menjadi bab pertama dan terbuka', () => {
      const modifiedChapters: ChapterInfo[] = chapters.map((c) =>
        c.id === 'ch-1' ? { ...c, archivedAt: '2026-10-18T00:00:00Z' } : c
      );
      // Bab 2 sekarang adalah bab pertama aktif
      const state = computeChapterState('ch-2', modifiedChapters, {});
      expect(state).toBe('terbuka');
    });

    it('Skenario 14: Mahasiswa dengan nilai di bawah ambang (belum lulus) tetap berstatus terbuka untuk mencoba ulang', () => {
      const progress: Record<string, StudentProgressInfo> = {
        'ch-1': { bestScore: 50 }, // belum passedAt
      };
      const state = computeChapterState('ch-1', chapters, progress);
      expect(state).toBe('terbuka');
    });
  });
});
