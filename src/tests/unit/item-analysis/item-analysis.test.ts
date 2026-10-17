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
  getExamItemAnalysisAction,
  getCoordinatorCplRecapAction,
  flagQuestionForRevisionAction,
  exportItemAnalysisCsvAction,
} from '@/modules/academic/item-analysis-actions';
import { quizStore } from '@/modules/academic/quiz-store';


describe('SIAJAR Fitur 4: Analitik Butir Soal, Penandaan Revisi & Rekap CPL Kaprodi', () => {
  const lecturerUser = {
    user: { id: 'lec-item-1', name: 'Dr. Budi Santoso' },
    roles: ['LECTURER'],
    activeRole: 'LECTURER',
  };
  const coordinatorUser = {
    user: { id: 'coord-item-1', name: 'Dr. Hendra (Kaprodi)' },
    roles: ['PROGRAM_COORDINATOR'],
    activeRole: 'PROGRAM_COORDINATOR',
  };
  const studentUser = {
    user: { id: 'std-item-1', name: 'Ahmad Mahasiswa' },
    roles: ['STUDENT'],
    activeRole: 'STUDENT',
  };

  beforeEach(() => {
    // Reset flags and audit logs
    (globalThis as any).__siajarQuestionRevisionFlags = new Map();
    auditLogs.length = 0;
  });

  describe('1. Perhitungan Indikator Psikometrik Butir Soal', () => {
    it('menghitung tingkat kesulitan (P), daya pembeda (D), dan pelabelan otomatis', async () => {
      mockCurrentUser = lecturerUser;

      const res = await getExamItemAnalysisAction();
      expect(res.ok).toBe(true);
      expect(res.data).toBeDefined();

      const questions = res.data!.questions;
      expect(questions.length).toBeGreaterThan(0);

      // Soal 1: Tingkat kesulitan tinggi (P > 0.85) -> "Terlalu mudah"
      const q1 = questions[0];
      expect(q1.difficultyIndex).toBeGreaterThanOrEqual(0.85);
      expect(q1.difficultyLabel).toBe('Terlalu mudah');
      expect(q1.discriminationLabel).toBe('Perlu ditinjau');

      // Soal 2: Tingkat kesulitan sedang (0.68) -> "Sedang", daya pembeda baik -> "Sangat Baik"
      const q2 = questions[1];
      expect(q2.difficultyLabel).toBe('Sedang');
      expect(q2.discriminationLabel).toBe('Sangat Baik');
      expect(q2.overallStatus).toBe('Diterima');

      // Soal dengan D negatif / sangat rendah diberi label "Perlu ditinjau"
      const needsReviewQ = questions.find((q) => q.discriminationIndex < 0.2 || q.overallStatus === 'Perlu ditinjau');
      expect(needsReviewQ).toBeDefined();
      expect(needsReviewQ?.overallStatus).toBe('Perlu ditinjau');
    });

    it('mengevaluasi sebaran distraktor/pengecoh dan rata-rata waktu pengerjaan', async () => {
      mockCurrentUser = lecturerUser;

      const res = await getExamItemAnalysisAction();
      const q = res.data!.questions[0];

      expect(q.distractors.length).toBe(4); // Opsi A, B, C, D
      expect(q.distractorEvaluation).toBeDefined();
      expect(q.avgTimeSeconds).toBeGreaterThan(0);

      // Satu dari opsi harus merupakan kunci jawaban (isKey: true)
      const keyOption = q.distractors.find((d) => d.isKey);
      expect(keyOption).toBeDefined();
    });
  });

  describe('2. Ketercapaian CPMK dan Rekapitulasi Lintas Kelas CPL Kaprodi', () => {
    it('menghasilkan rekapitulasi ketercapaian CPMK per kelas', async () => {
      mockCurrentUser = lecturerUser;

      const res = await getExamItemAnalysisAction();
      const cpmkList = res.data!.cpmkList;

      expect(cpmkList.length).toBeGreaterThan(0);
      expect(cpmkList[0].cpmk).toBeDefined();
      expect(cpmkList[0].averageScorePercent).toBeGreaterThan(0);
      expect(['TERCAPAI', 'BELUM_TERCAPAI']).toContain(cpmkList[0].status);
    });

    it('Kaprodi dapat melihat rekapitulasi CPL lintas kelas dan indeks mutu evaluasi', async () => {
      mockCurrentUser = coordinatorUser;

      const res = await getCoordinatorCplRecapAction();
      expect(res.ok).toBe(true);
      expect(res.cplList.length).toBeGreaterThanOrEqual(4);
      expect(res.qualityIndex.totalQuestions).toBeGreaterThan(0);
      expect(res.qualityIndex.acceptablePercentage).toBeGreaterThanOrEqual(80);

      const cpl01 = res.cplList.find((c) => c.cplCode === 'CPL-01');
      expect(cpl01).toBeDefined();
      expect(cpl01?.classesAssessed).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Dosen Menandai Butir Soal untuk Revisi & Peringatan Bank Soal', () => {
    it('dosen dapat menandai butir soal untuk direvisi dan mencatat ke audit trail', async () => {
      mockCurrentUser = lecturerUser;

      const targetQuiz = quizStore.quizzes[0];
      const targetQuestion = targetQuiz.questions[0];

      const flagRes = await flagQuestionForRevisionAction({
        questionId: targetQuestion.id,
        quizId: targetQuiz.id,
        note: 'Kunci jawaban opsi C ambigu dengan opsi A, perlu perbaikan deskripsi opsi sebelum digunakan di kuis berikutnya.',
      });

      expect(flagRes.ok).toBe(true);

      // Pertanyaan di target kuis telah ditandai
      expect(targetQuestion.needs_revision).toBe(true);
      expect(targetQuestion.revision_note).toContain('Kunci jawaban opsi C ambigu');

      // Audit trail mencatat penandaan revisi
      const audit = auditLogs.find((l) => l.action === 'exam.flag_question_revision');
      expect(audit).toBeDefined();
      expect(audit.actorRole).toBe('LECTURER');
      expect(audit.entityId).toBe(targetQuestion.id);
    });

    it('menolak mahasiswa untuk menandai butir soal revisi', async () => {
      mockCurrentUser = studentUser;

      const flagRes = await flagQuestionForRevisionAction({
        questionId: 'q-demo-1',
        note: 'Percobaan revisi ilegal oleh mahasiswa.',
      });

      expect(flagRes.ok).toBe(false);
      expect(flagRes.error).toContain('Akses ditolak');
    });
  });

  describe('4. Ekspor Analitik Butir Soal ke CSV (RFC 4180)', () => {
    it('menghasilkan file CSV dengan header lengkap dan escape karakter', async () => {
      mockCurrentUser = lecturerUser;

      const exportRes = await exportItemAnalysisCsvAction();
      expect(exportRes.ok).toBe(true);
      expect(exportRes.csvContent).toBeDefined();
      expect(exportRes.filename).toContain('.csv');

      const csv = exportRes.csvContent!;
      expect(csv).toContain('No Soal,Teks Soal,Tipe Soal,CPMK');
      expect(csv).toContain('Tingkat Kesulitan (P)');
      expect(csv).toContain('Daya Pembeda (D)');
      expect(csv).toContain('Status Evaluasi');
    });
  });
});
