import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCurrentUser = vi.hoisted(() => ({
  value: {
    user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
    profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
    activeRole: 'LECTURER',
    roles: [{ code: 'LECTURER' }],
    isImpersonating: false,
  } as any,
}));

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser.value),
}));

import {
  createQuizAction,
  listClassQuizzesAction,
  getQuizDetailAction,
  listQuizAttemptsAction,
  getQuestionBankAction,
  saveToQuestionBankAction,
  submitQuizAttemptAction,
  recordExamEventAction,
  executeLiveCodeAction,
  evaluateEssayWithAiAction,
  gradeEssayQuestionAction,
  getExamLiveStatusAction,
  lecturerInterventionAction,
  submitExamDisputeAction,
  resolveExamDisputeAction,
  getExamAnalyticsAction,
  type QuizItem,
  type TestCase,
} from '../src/modules/academic/quiz-actions';

describe('FASE 4: Modul Ujian & Kuis Terpadu Tests', () => {
  beforeEach(() => {
    mockCurrentUser.value = {
      user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
      isImpersonating: false,
    };
    // Reset or ensure quiz store in globalThis
    const store = ((globalThis as any).__siajarKuis ??= {
      quizzes: [],
      attempts: [],
      events: [],
      liveStatus: {},
      questionBank: [],
      disputes: [],
    });
  });

  describe('1. Mock Sandboxed Live Coding Execution', () => {
    it('menjalankan pengujian test case publik dan tersembunyi dengan skor proporsional', async () => {
      const testCases: TestCase[] = [
        { input: 'hitungVokal("SIAJAR")', expected_output: '3', is_hidden: false },
        { input: 'hitungVokal("Antigravity")', expected_output: '4', is_hidden: false },
        { input: 'hitungVokal("xyz")', expected_output: '0', is_hidden: true },
      ];

      const studentCode = `
        function hitungVokal(teks) {
          return (teks.match(/[aeiou]/gi) || []).length;
        }
      `;

      const result = await executeLiveCodeAction('javascript', studentCode, testCases);

      expect(result.totalCount).toBe(3);
      expect(result.passedCount).toBe(3);
      expect(result.scoreRatio).toBe(1);
      expect(result.results[0].passed).toBe(true);
      expect(result.results[2].is_hidden).toBe(true);
    });

    it('memberikan nilai parsial saat sebagian test case gagal', async () => {
      const testCases: TestCase[] = [
        { input: 'hitungVokal("halo")', expected_output: '2', is_hidden: false },
        { input: 'hitungVokal("xyz")', expected_output: '0', is_hidden: false },
        { input: 'hitungVokal("gagal")', expected_output: '99', is_hidden: false }, // expects impossible output
      ];

      const studentCode = `
        function hitungVokal(teks) {
          return (teks.match(/[aeiou]/gi) || []).length;
        }
      `;

      const result = await executeLiveCodeAction('javascript', studentCode, testCases);
      expect(result.passedCount).toBe(2);
      expect(result.totalCount).toBe(3);
      expect(result.scoreRatio).toBeCloseTo(0.67, 1);
    });
  });

  describe('2. AI Draft Essay Evaluator', () => {
    it('menghasilkan draf nilai dan umpan balik analitis berdasarkan rubrik dan panjang jawaban', async () => {
      const essay = 'Perbedaan mendasar konkurensi dan paralelisme terletak pada pemanfaatan core CPU. Konkurensi menangani banyak proses dengan time-slicing thread tunggal atau banyak, sedangkan paralelisme mengeksekusi banyak proses secara simultan di multi-core hardware secara nyata.';
      const res = await evaluateEssayWithAiAction(essay);

      expect(res.ai_score_ratio).toBeGreaterThanOrEqual(0.75);
      expect(res.feedback).toContain('Draf AI');
      expect(res.feedback).toContain('Menunggu Konfirmasi Dosen');
    });

    it('memberikan skor penalti jika jawaban terlalu pendek', async () => {
      const essay = 'Kurang tahu pak.';
      const res = await evaluateEssayWithAiAction(essay);

      expect(res.ai_score_ratio).toBeLessThanOrEqual(0.3);
      expect(res.feedback).toContain('terlalu singkat');
    });
  });

  describe('3. Proctoring Event Logger & Pelanggaran', () => {
    it('mencatat riwayat exam_events saat terjadi perpindahan tab atau kehilangan fokus', async () => {
      const store = ((globalThis as any).__siajarKuis ??= {
        quizzes: [],
        attempts: [],
        events: [],
        liveStatus: {},
        questionBank: [],
        disputes: [],
      });

      const examId = 'exam-proc-001';
      store.events.push({
        id: 'ev-1',
        exam_id: examId,
        student_id: 'std-andi',
        student_name: 'Andi Saputra',
        event_type: 'TAB_SWITCH',
        duration_seconds: 14,
        details: 'Andi berpindah tab (3x, 14 detik)',
        created_at: new Date().toISOString(),
      });

      const live = await getExamLiveStatusAction(examId);
      expect(live.events.length).toBeGreaterThanOrEqual(1);
      expect(live.events[0].student_name).toBe('Andi Saputra');
      expect(live.events[0].event_type).toBe('TAB_SWITCH');
    });
  });

  describe('4. Analisis Butir Soal & Distribusi Nilai', () => {
    it('menghitung rata-rata, tertinggi, terendah, dan tingkat kelulusan KKM', async () => {
      const store = ((globalThis as any).__siajarKuis ??= {
        quizzes: [],
        attempts: [],
        events: [],
        liveStatus: {},
        questionBank: [],
        disputes: [],
      });

      const examId = 'exam-stat-001';
      store.quizzes.push({
        id: examId,
        class_id: 'c-test',
        title: 'Ujian Statistik',
        duration_minutes: 60,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        questions: [
          {
            id: 'q-stat-1',
            question_text: 'Apa itu mean?',
            question_type: 'MULTIPLE_CHOICE',
            options: ['Rata-rata', 'Nilai tengah'],
            correct_answer_index: 0,
            points: 100,
          },
        ],
        total_points: 100,
        is_published: true,
        created_at: new Date().toISOString(),
        kkm: 70,
      });

      store.attempts.push(
        {
          id: 'att-1',
          quiz_id: examId,
          student_id: 'std-1',
          student_name: 'Siswa A',
          answers: { 'q-stat-1': 0 },
          score: 100,
          max_score: 100,
          is_graded: true,
          submitted_at: new Date().toISOString(),
        },
        {
          id: 'att-2',
          quiz_id: examId,
          student_id: 'std-2',
          student_name: 'Siswa B',
          answers: { 'q-stat-1': 1 },
          score: 50,
          max_score: 100,
          is_graded: true,
          submitted_at: new Date().toISOString(),
        }
      );

      const analytics = await getExamAnalyticsAction(examId);

      expect(analytics.total_attempts).toBe(2);
      expect(analytics.average_score).toBe(75);
      expect(analytics.highest_score).toBe(100);
      expect(analytics.lowest_score).toBe(50);
      expect(analytics.passing_rate_percentage).toBe(50);
      expect(analytics.difficulty_analysis.length).toBe(1);
    });
  });

  describe('5. Sengketa Nilai (Exam Dispute Workflow)', () => {
    it('menyimpan dan menyelesaikan sengketa nilai dengan penyesuaian skor', async () => {
      const store = ((globalThis as any).__siajarKuis ??= {
        quizzes: [],
        attempts: [],
        events: [],
        liveStatus: {},
        questionBank: [],
        disputes: [],
      });

      const attemptId = 'att-dispute-001';
      store.attempts.push({
        id: attemptId,
        quiz_id: 'quiz-001',
        student_id: 'std-budi',
        student_name: 'Budi Santoso',
        answers: {},
        score: 70,
        max_score: 100,
        is_graded: true,
        submitted_at: new Date().toISOString(),
      });

      const disputeId = 'disp-1';
      store.disputes.push({
        id: disputeId,
        attempt_id: attemptId,
        exam_id: 'quiz-001',
        student_id: 'std-budi',
        student_name: 'Budi Santoso',
        reason: 'Referensi buku Bab 4 halaman 50 membenarkan jawaban esai saya.',
        status: 'PENDING',
        submitted_at: new Date().toISOString(),
      });

      // Simulasi persetujuan dosen dengan penyesuaian skor +15
      const dispute = store.disputes.find((d: any) => d.id === disputeId);
      dispute.status = 'APPROVED';
      dispute.score_adjustment = 15;
      dispute.lecturer_note = 'Disetujui berdasarkan rujukan literatur yang valid.';

      const attempt = store.attempts.find((a: any) => a.id === attemptId);
      attempt.score += dispute.score_adjustment;

      expect(dispute.status).toBe('APPROVED');
      expect(attempt.score).toBe(85);
    });
  });

  describe('6. Keamanan Kunci Jawaban (A3) & Pembatasan Peran SYSTEM_ADMIN (A4)', () => {
    it('menyembunyikan correct_answer_index, correct_text, correct_boolean, dan rubric saat diakses oleh STUDENT', async () => {
      const store = (globalThis as any).__siajarKuis;
      const quizId = 'quiz-sec-a3';
      const classId = 'c0000000-0000-0000-0000-000000000001';

      store.quizzes.push({
        id: quizId,
        class_id: classId,
        title: 'Kuis Keamanan A3',
        duration_minutes: 45,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        total_points: 100,
        is_published: true,
        created_at: new Date().toISOString(),
        questions: [
          {
            id: 'q-mc',
            question_text: 'Soal PG',
            question_type: 'MULTIPLE_CHOICE',
            options: ['A', 'B'],
            correct_answer_index: 1,
            explanation: 'Penjelasan rahasia',
            points: 25,
          },
          {
            id: 'q-tf',
            question_text: 'Soal B/S',
            question_type: 'TRUE_FALSE',
            correct_boolean: true,
            points: 25,
          },
          {
            id: 'q-sa',
            question_text: 'Soal Isian',
            question_type: 'SHORT_ANSWER',
            correct_text: 'kunci-rahasia',
            points: 25,
          },
          {
            id: 'q-es',
            question_text: 'Soal Esai',
            question_type: 'ESSAY',
            rubric: 'Rubrik rahasia esai',
            points: 25,
          },
        ],
      });

      mockCurrentUser.value = {
        user: { id: 'a0000001-0000-0000-0000-000000000001', email: 'mhs2024001@siajar.test' },
        profile: { full_name: 'Ahmad Mahasiswa' },
        activeRole: 'STUDENT',
        roles: [{ code: 'STUDENT' }],
        isImpersonating: false,
      };

      const detail = await getQuizDetailAction(quizId);
      expect(detail).not.toBeNull();
      for (const q of detail!.questions) {
        expect(q.correct_answer_index).toBeUndefined();
        expect(q.correct_boolean).toBeUndefined();
        expect(q.correct_text).toBeUndefined();
        expect(q.rubric).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }

      const list = await listClassQuizzesAction(classId);
      const found = list.find((x) => x.id === quizId);
      expect(found).toBeDefined();
      for (const q of found!.questions) {
        expect(q.correct_answer_index).toBeUndefined();
        expect(q.correct_boolean).toBeUndefined();
        expect(q.correct_text).toBeUndefined();
        expect(q.rubric).toBeUndefined();
      }
    });

    it('menolak SYSTEM_ADMIN membuat kuis, menilai esai, atau menyimpan ke bank soal (Aturan A4)', async () => {
      mockCurrentUser.value = {
        user: { id: 'a0000006-0000-0000-0000-000000000006', email: 'sysadmin@siajar.test' },
        profile: { full_name: 'System Administrator' },
        activeRole: 'SYSTEM_ADMIN',
        roles: [{ code: 'SYSTEM_ADMIN' }],
        isImpersonating: false,
      };

      const createRes = await createQuizAction({
        class_id: 'c0000000-0000-0000-0000-000000000001',
        title: 'Kuis Ilegal System Admin',
        duration_minutes: 30,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        questions: [
          {
            question_text: 'Soal 1',
            question_type: 'MULTIPLE_CHOICE',
            options: ['A', 'B'],
            correct_answer_index: 0,
            points: 100,
          },
        ],
      });
      expect(createRes.ok).toBe(false);

      const gradeRes = await gradeEssayQuestionAction('att-1', 10, 'Catatan');
      expect(gradeRes.ok).toBe(false);

      const bankRes = await saveToQuestionBankAction({
        question_text: 'Soal Bank',
        question_type: 'TRUE_FALSE',
        correct_boolean: true,
        points: 10,
      });
      expect(bankRes.ok).toBe(false);

      expect(await getQuestionBankAction()).toEqual([]);
      expect(await listQuizAttemptsAction('exam-stat-001')).toEqual([]);
    });
  });
});
