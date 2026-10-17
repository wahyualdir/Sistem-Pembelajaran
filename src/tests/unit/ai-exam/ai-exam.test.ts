import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

let mockCurrentUser: {
  user: { id: string; name: string; email?: string };
  roles: string[];
  activeRole: string;
} | null = null;

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

const auditLogs: any[] = [];
vi.mock('@/lib/audit', () => ({
  recordSystemAuditLog: vi.fn(async (log: any) => {
    auditLogs.push(log);
    return { ok: true, id: 'audit-mock-id' };
  }),
}));

import {
  generateAiQuestionsDraftAction,
  approveAiQuestionsToBankAction,
  getLecturerAiQuotaStatusAction,
  type AiDraftQuestion,
} from '@/modules/academic/ai-quiz-generator';
import {
  createQuizAction,
  saveToQuestionBankAction,
  gradeEssayQuestionAction,
  listClassQuizzesAction,
  getQuizDetailAction,
} from '@/modules/academic/quiz-actions';
import { quizStore, getQuizStore } from '@/modules/academic/quiz-store';


describe('SIAJAR Fitur 2: Generator Draf Soal AI di Bank Soal & Keamanan Ujian', () => {
  const classId = 'c0000000-0000-0000-0000-000000000001';
  const lecturerUser = {
    user: { id: 'a0000002-0000-0000-0000-000000000002', name: 'Dr. Budi Santoso' },
    roles: ['LECTURER'],
    activeRole: 'LECTURER',
  };
  const otherLecturerUser = {
    user: { id: 'lec-outsider-99', name: 'Dosen Kelas Lain' },
    roles: ['LECTURER'],
    activeRole: 'LECTURER',
  };
  const studentUser = {
    user: { id: 'std-ai-1', name: 'Ahmad Mahasiswa' },
    roles: ['STUDENT'],
    activeRole: 'STUDENT',
  };
  const sysAdminUser = {
    user: { id: 'sys-admin-1', name: 'System Administrator' },
    roles: ['SYSTEM_ADMIN'],
    activeRole: 'SYSTEM_ADMIN',
  };

  beforeEach(() => {
    // Setup store asli aplikasi (__siajarAkademik)
    (globalThis as any).__siajarAkademik = {
      classes: [
        {
          id: classId,
          title: 'Pemrograman Web & Arsitektur Cloud',
          section: 'IF-3A',
          join_code: 'WEB2026A',
          status: 'OPEN',
          created_by: lecturerUser.user.id,
        },
      ],
      enrollments: [
        {
          class_id: classId,
          student_id: studentUser.user.id,
          student_name: studentUser.user.name,
          status: 'ACTIVE',
        },
      ],
    };

    // Reset rate limiter and audit logs
    if ((globalThis as any).__siajarAiExamRateLimit) {
      (globalThis as any).__siajarAiExamRateLimit.clear();
    }
    auditLogs.length = 0;
  });

  describe('1. Kontrol Akses & Pembatasan Role (RBAC & Aturan A2)', () => {
    it('mengizinkan role LECTURER pengampu kelas untuk menghasilkan draf soal AI', async () => {
      mockCurrentUser = lecturerUser;

      const res = await generateAiQuestionsDraftAction({
        classId,
        materialTitle: 'Arsitektur REST API & Middleware',
        materialContent: 'Prinsip RESTful mewajibkan statelessness. Header token Bearer JWT digunakan untuk autentikasi rute.',
        questionCount: 2,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        cpmkTarget: 'CPMK-02: Merancang arsitektur API web yang aman dan scalable',
      });

      expect(res.ok).toBe(true);
      expect(res.drafts?.length).toBe(2);
      expect(res.remainingDailyQuota).toBe(9); // Kuota awal 10 - 1 = 9
    });

    it('menolak LECTURER yang bukan pengampu kelas tersebut di generator AI, createQuizAction, saveToQuestionBankAction, dan gradeEssayQuestionAction', async () => {
      // Siapkan kuis dan attempt nyata di classId milik lecturerUser
      mockCurrentUser = lecturerUser;
      const validQuizRes = await createQuizAction({
        class_id: classId,
        title: 'Kuis Resmi Kelas IF-3A',
        duration_minutes: 45,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        questions: [
          {
            question_text: 'Jelaskan konsep idempotensi HTTP PUT vs POST.',
            question_type: 'ESSAY',
            rubric: 'Menjelaskan efek pemanggilan berulang PUT yang menghasilkan state akhir identik.',
            points: 100,
          },
        ],
      });
      expect(validQuizRes.ok).toBe(true);
      const createdQuizId = validQuizRes.data!.id;

      const store = getQuizStore();
      store.attempts.push({
        id: 'att-essay-class1',
        quiz_id: createdQuizId,
        student_id: studentUser.user.id,
        student_name: studentUser.user.name,
        score: 50,
        max_score: 100,
        is_graded: false,
        submitted_at: new Date().toISOString(),
        answers: {},
      });

      // Sekarang beralih ke otherLecturerUser (bukan pengampu classId)
      mockCurrentUser = otherLecturerUser;

      const res = await generateAiQuestionsDraftAction({
        classId,
        materialContent: 'Materi kuliah pemrograman dasar untuk pengujian akses.',
        questionCount: 2,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        cpmkTarget: 'CPMK-01',
      });
      expect(res.ok).toBe(false);
      expect(res.error).toContain('bukan Dosen Pengampu');

      const approveRes = await approveAiQuestionsToBankAction({
        classId,
        questions: [
          {
            question_text: 'Soal dari dosen luar kelas',
            question_type: 'MULTIPLE_CHOICE',
            difficulty: 'EASY',
            cpmk: 'CPMK-01',
            points: 10,
            options: ['A', 'B', 'C', 'D'],
            correct_answer_index: 0,
          },
        ],
      });
      expect(approveRes.ok).toBe(false);
      expect(approveRes.error).toContain('bukan Dosen Pengampu');

      const createQuizOther = await createQuizAction({
        class_id: classId,
        title: 'Kuis Ilegal Dosen Luar',
        duration_minutes: 30,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        questions: [
          {
            question_text: 'Soal injeksi ke kelas dosen lain',
            question_type: 'MULTIPLE_CHOICE',
            options: ['A', 'B', 'C', 'D'],
            correct_answer_index: 1,
            points: 100,
          },
        ],
      });
      expect(createQuizOther.ok).toBe(false);
      expect(createQuizOther.error).toContain('bukan Dosen Pengampu');

      const saveBankOther = await saveToQuestionBankAction({
        class_id: classId,
        question_text: 'Soal bank ilegal untuk kelas dosen lain',
        question_type: 'MULTIPLE_CHOICE',
        options: ['A', 'B', 'C', 'D'],
        correct_answer_index: 0,
        points: 10,
      });
      expect(saveBankOther.ok).toBe(false);
      expect(saveBankOther.error).toContain('bukan Dosen Pengampu');

      const gradeOther = await gradeEssayQuestionAction('att-essay-class1', 30, 'Nilai diubah dosen luar');
      expect(gradeOther.ok).toBe(false);
      expect(gradeOther.error).toContain('bukan Dosen Pengampu');
    });

    it('menolak akses STUDENT untuk menggunakan AI Generator', async () => {
      mockCurrentUser = studentUser;

      const res = await generateAiQuestionsDraftAction({
        classId,
        materialContent: 'Materi kuliah pemrograman dasar.',
        questionCount: 2,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        cpmkTarget: 'CPMK-01',
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain('hanya dapat digunakan oleh Dosen');
    });

    it('Aturan A2: menolak SYSTEM_ADMIN di generateAiQuestionsDraftAction, approveAiQuestionsToBankAction, createQuizAction, saveToQuestionBankAction, dan gradeEssayQuestionAction', async () => {
      // Siapkan attempt nyata agar penolakan gradeEssayQuestionAction bukan karena attempt tidak ditemukan
      const store = getQuizStore();
      store.attempts.push({
        id: 'att-sysadmin-target',
        quiz_id: store.quizzes[0]?.id || 'quiz-1',
        student_id: studentUser.user.id,
        student_name: studentUser.user.name,
        score: 40,
        max_score: 100,
        is_graded: false,
        submitted_at: new Date().toISOString(),
        answers: {},
      });

      mockCurrentUser = sysAdminUser;

      const genRes = await generateAiQuestionsDraftAction({
        classId,
        materialContent: 'Materi kuliah pengujian sistem.',
        questionCount: 2,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        cpmkTarget: 'CPMK-01',
      });
      expect(genRes.ok).toBe(false);

      const appRes = await approveAiQuestionsToBankAction({
        classId,
        questions: [
          {
            question_text: 'Soal dari sysadmin',
            question_type: 'MULTIPLE_CHOICE',
            difficulty: 'EASY',
            cpmk: 'CPMK-01',
            points: 10,
            options: ['A', 'B', 'C', 'D'],
            correct_answer_index: 0,
          },
        ],
      });
      expect(appRes.ok).toBe(false);

      const createRes = await createQuizAction({
        class_id: classId,
        title: 'Ujian oleh System Admin',
        duration_minutes: 60,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        questions: [
          {
            question_text: 'Soal ujian oleh System Admin',
            question_type: 'MULTIPLE_CHOICE',
            options: ['1', '2', '3', '4'],
            correct_answer_index: 0,
            points: 100,
          },
        ],
      });
      expect(createRes.ok).toBe(false);

      const bankRes = await saveToQuestionBankAction({
        question_text: 'Soal Bank oleh System Admin',
        question_type: 'MULTIPLE_CHOICE',
        options: ['A', 'B', 'C', 'D'],
        correct_answer_index: 2,
        points: 20,
      });
      expect(bankRes.ok).toBe(false);

      const gradeRes = await gradeEssayQuestionAction('att-sysadmin-target', 50, 'Bypass nilai oleh System Admin');
      expect(gradeRes.ok).toBe(false);
    });
  });

  describe('2. Struktur Soal DRAF: Pilihan Ganda & Esai dengan Rubrik', () => {
    it('soal pilihan ganda menghasilkan opsi, kunci jawaban, dan penjelasan singkat', async () => {
      mockCurrentUser = lecturerUser;

      const res = await generateAiQuestionsDraftAction({
        classId,
        materialTitle: 'Fondasi Database Relasional',
        materialContent: 'Normalisasi database relasional 1NF, 2NF, dan 3NF untuk mencegah redundansi data dan anomali update.',
        questionCount: 3,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'HARD',
        cpmkTarget: 'CPMK-03: Optimasi skema database relasional',
      });

      expect(res.ok).toBe(true);
      expect(res.drafts).toBeDefined();

      const q = res.drafts![0];
      expect(q.ai_draft_status).toBe('DRAFT');
      expect(q.is_ai_generated).toBe(true);
      expect(q.question_type).toBe('MULTIPLE_CHOICE');
      expect(q.options?.length).toBe(4);
      expect(typeof q.correct_answer_index).toBe('number');
      expect(q.explanation).toBeDefined();
      expect(q.cpmk).toBe('CPMK-03: Optimasi skema database relasional');
    });

    it('soal esai menghasilkan rubrik penilaian per kriteria dengan bobot', async () => {
      mockCurrentUser = lecturerUser;

      const res = await generateAiQuestionsDraftAction({
        classId,
        materialTitle: 'Cloud Native Microservices',
        materialContent: 'Desain decoupling services menggunakan message broker Apache Kafka dan idempotensi event processing.',
        questionCount: 2,
        questionType: 'ESSAY',
        difficulty: 'HARD',
        cpmkTarget: 'CPMK-04: Analisis arsitektur sistem berbasis message-driven',
      });

      expect(res.ok).toBe(true);
      expect(res.drafts).toBeDefined();

      const q = res.drafts![0];
      expect(q.question_type).toBe('ESSAY');
      expect(q.rubric_criteria).toBeDefined();
      expect(q.rubric_criteria?.length).toBeGreaterThanOrEqual(2);

      const totalWeight = q.rubric_criteria!.reduce((sum, c) => sum + c.weight, 0);
      expect(totalWeight).toBe(100);
    });
  });

  describe('3. Rate Limiting Harian per Dosen (Maksimal 10 Generasi/Hari)', () => {
    it('membatasi generasi soal maksimal 10 kali per dosen dalam satu hari', async () => {
      mockCurrentUser = lecturerUser;

      // Habiskan kuota 10 kali
      for (let i = 0; i < 10; i++) {
        const res = await generateAiQuestionsDraftAction({
          classId,
          materialContent: 'Materi pengulangan loop dan rekursi algoritma pemrograman.',
          questionCount: 1,
          questionType: 'MULTIPLE_CHOICE',
          difficulty: 'EASY',
          cpmkTarget: 'CPMK-01',
        });
        expect(res.ok).toBe(true);
      }

      // Generasi ke-11 harus ditolak
      const rejectedRes = await generateAiQuestionsDraftAction({
        classId,
        materialContent: 'Materi pengulangan loop dan rekursi algoritma pemrograman.',
        questionCount: 1,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        cpmkTarget: 'CPMK-01',
      });

      expect(rejectedRes.ok).toBe(false);
      expect(rejectedRes.error).toContain('Batas harian pembuatan draf soal AI');

      const quotaStatus = await getLecturerAiQuotaStatusAction();
      expect(quotaStatus.used).toBe(10);
      expect(quotaStatus.remaining).toBe(0);
    });
  });

  describe('4. Persetujuan Dosen (Review & Approve), Proteksi Draf AI, dan Sanitasi Kunci Jawaban Mahasiswa (Tahap D)', () => {
    it('draf AI berstatus DRAFT ditolak masuk ke ujian aktif maupun Bank Soal sebelum disetujui dosen pengampu', async () => {
      mockCurrentUser = lecturerUser;

      // Buat draf AI
      const genRes = await generateAiQuestionsDraftAction({
        classId,
        materialTitle: 'Testing Framework',
        materialContent: 'Pengujian unit dengan Jest dan Vitest menggunakan teknik mocking dan snapshot assertion.',
        questionCount: 2,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        cpmkTarget: 'CPMK-05: Verifikasi dan validasi perangkat lunak',
      });

      const drafts = genRes.drafts!;
      expect(drafts.length).toBe(2);
      expect(drafts[0].ai_draft_status).toBe('DRAFT');

      // Mencoba memasukkan soal berstatus DRAFT langsung ke createQuizAction harus DITOLAK
      const unapprovedQuizRes = await createQuizAction({
        class_id: classId,
        title: 'Ujian dengan Soal Draf Belum Disetujui',
        duration_minutes: 45,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        questions: [drafts[0]],
      });
      expect(unapprovedQuizRes.ok).toBe(false);
      expect(unapprovedQuizRes.error).toContain('DRAFT');

      // Mencoba memasukkan soal berstatus DRAFT langsung ke saveToQuestionBankAction harus DITOLAK
      const unapprovedBankRes = await saveToQuestionBankAction(drafts[0] as any);
      expect(unapprovedBankRes.ok).toBe(false);
      expect(unapprovedBankRes.error).toContain('DRAFT');

      // Dosen menyetujui soal lewat approveAiQuestionsToBankAction
      const approveRes = await approveAiQuestionsToBankAction({
        classId,
        questions: [
          {
            ...drafts[0],
            question_text: 'Teks soal yang telah disunting oleh dosen pengampu',
          },
        ],
      });

      expect(approveRes.ok).toBe(true);
      expect(approveRes.savedCount).toBe(1);

      // Soal berhasil masuk ke Bank Soal dengan status APPROVED
      const inserted = getQuizStore().questionBank[0];
      expect(inserted.is_ai_generated).toBe(true);
      expect(inserted.ai_draft_status).toBe('APPROVED');
      expect(inserted.approved_by).toBe('Dosen Pengampu');

      // Audit trail mencatat siapa yang menyetujui
      const auditEntry = auditLogs.find((l) => l.action === 'exam.approve_ai_questions');
      expect(auditEntry).toBeDefined();
      expect(auditEntry.actorRole).toBe('LECTURER');
    });

    it('mahasiswa (STUDENT) tidak pernah menerima kunci jawaban, rubrik esai, penjelasan, maupun hidden test case di respons kuis', async () => {
      mockCurrentUser = lecturerUser;
      const createRes = await createQuizAction({
        class_id: classId,
        title: 'UAS Komprehensif Keamanan Kunci Jawaban',
        duration_minutes: 90,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        questions: [
          {
            question_text: 'Soal PG Rahasia',
            question_type: 'MULTIPLE_CHOICE',
            options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
            correct_answer_index: 2,
            explanation: 'Penjelasan kunci jawaban Opsi C',
            points: 25,
          },
          {
            question_text: 'Soal Benar/Salah Rahasia',
            question_type: 'TRUE_FALSE',
            correct_boolean: true,
            points: 25,
          },
          {
            question_text: 'Soal Isian Singkat Rahasia',
            question_type: 'SHORT_ANSWER',
            correct_text: 'KunciIsianRahasia',
            points: 25,
          },
          {
            question_text: 'Soal Esai & Live Coding Rahasia',
            question_type: 'ESSAY',
            rubric: 'Rubrik kunci penilaian esai dosen',
            test_cases: [
              { input: '1', expected_output: '2', is_hidden: false },
              { input: '99', expected_output: '100', is_hidden: true },
            ],
            points: 25,
          },
        ],
      });
      expect(createRes.ok).toBe(true);
      const quizId = createRes.data!.id;

      // Dosen menerima kunci jawaban lengkap
      const lecturerView = await getQuizDetailAction(quizId);
      expect(lecturerView?.questions[0].correct_answer_index).toBe(2);
      expect(lecturerView?.questions[3].rubric).toBe('Rubrik kunci penilaian esai dosen');

      // Mahasiswa (STUDENT) mengambil daftar kuis dan detail kuis -> seluruh kunci wajib terhapus
      mockCurrentUser = studentUser;
      const studentList = await listClassQuizzesAction(classId);
      const studentQuizFromList = studentList.find((q) => q.id === quizId)!;
      expect(studentQuizFromList).toBeDefined();

      const studentDetail = await getQuizDetailAction(quizId);
      expect(studentDetail).not.toBeNull();

      for (const quizView of [studentQuizFromList, studentDetail!]) {
        for (const q of quizView.questions) {
          expect(q.correct_answer_index).toBeUndefined();
          expect(q.correct_answer_indices).toBeUndefined();
          expect(q.correct_boolean).toBeUndefined();
          expect(q.correct_text).toBeUndefined();
          expect(q.rubric).toBeUndefined();
          expect(q.rubric_criteria).toBeUndefined();
          expect(q.explanation).toBeUndefined();
          if (q.test_cases) {
            expect(q.test_cases.some((tc) => tc.is_hidden)).toBe(false);
          }
        }
      }
    });
  });
});
