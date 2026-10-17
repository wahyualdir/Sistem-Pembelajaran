import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock current active user
const mockCurrentUser = {
  user: { id: 'usr-coord-01' },
  profile: { full_name: 'Dr. Koordinator Prodi' },
  roles: [{ id: 'r1', roles: { code: 'PROGRAM_COORDINATOR' } }],
  activeRole: 'PROGRAM_COORDINATOR',
};

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

import {
  getActiveEvaluationPeriodAction,
  createEvaluationPeriodAction,
  toggleEvaluationPeriodStatusAction,
  submitStudentEvaluationAction,
  getLecturerEvaluationSummaryAction,
  getCoordinatorEvaluationReportAction,
  exportCoordinatorEvaluationCsvAction,
} from '@/modules/academic/evaluation-actions';

describe('Kuesioner Evaluasi Dosen oleh Mahasiswa (EDOM)', () => {
  const classId = 'c0000000-0000-0000-0000-000000000001';
  const lecturerId = 'lec-test-001';

  beforeEach(() => {
    // Reset global stores using exact store variable references
    const periods = (globalThis as any).__siajarEvalPeriods;
    if (periods && Array.isArray(periods)) periods.length = 0;

    const receipts = (globalThis as any).__siajarEvalReceipts;
    if (receipts && Array.isArray(receipts)) receipts.length = 0;

    const responses = (globalThis as any).__siajarEvalResponses;
    if (responses && Array.isArray(responses)) responses.length = 0;

    // Default role: PROGRAM_COORDINATOR
    mockCurrentUser.user.id = 'usr-coord-01';
    mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
  });

  describe('1. Siklus Hidup Periode Evaluasi', () => {
    it('dapat membuat dan mengaktifkan periode evaluasi baru', async () => {
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      const createRes = await createEvaluationPeriodAction({
        title: 'Evaluasi Semester Ganjil 2026/2027',
        semester: 'Ganjil 2026/2027',
        startDate: '2026-10-01',
        endDate: '2026-11-30',
        questions: [
          { id: 'q1', text: 'Kejelasan penyampaian materi perkuliahan', category: 'PEDAGOGIK' },
          { id: 'q2', text: 'Kesesuaian materi dengan silabus RPS', category: 'PROFESIONAL' },
          { id: 'q3', text: 'Komunikasi dan perlakuan adil kepada mahasiswa', category: 'SOSIAL' },
        ],
      });

      expect(createRes.ok).toBe(true);
      const activeRes = await getActiveEvaluationPeriodAction();
      expect(activeRes.ok).toBe(true);
      expect(activeRes.period).toBeDefined();
      expect(activeRes.period?.title).toContain('Ganjil 2026/2027');
      expect(activeRes.period?.status).toBe('OPEN');
    });

    it('dapat menutup periode evaluasi secara manual', async () => {
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      await createEvaluationPeriodAction({
        title: 'Evaluasi Penutupan',
        semester: 'Ganjil 2026',
        startDate: '2026-10-01',
        endDate: '2026-11-30',
        questions: [{ id: 'q1', text: 'Pertanyaan tes', category: 'PEDAGOGIK' }],
      });

      const activeRes = await getActiveEvaluationPeriodAction();
      expect(activeRes.period).toBeDefined();

      const toggleRes = await toggleEvaluationPeriodStatusAction(activeRes.period!.id, 'CLOSED');
      expect(toggleRes.ok).toBe(true);

      const periods = (globalThis as any).__siajarEvalPeriods;
      const periodAfter = periods.find((p: any) => p.id === activeRes.period!.id);
      expect(periodAfter.status).toBe('CLOSED');
    });
  });

  describe('2. Arsitektur Anonimitas Nyata (True Anonymity Decoupling)', () => {
    it('memisahkan bukti pengisian (Receipt) dengan rekaman evaluasi (Response) tanpa menyimpan studentId', async () => {
      // Buka periode
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      await createEvaluationPeriodAction({
        title: 'Evaluasi Anonimitas Test',
        semester: 'Ganjil 2026',
        startDate: '2026-10-01',
        endDate: '2026-11-30',
        questions: [
          { id: 'q1', text: 'Kejelasan materi kuliah', category: 'PEDAGOGIK' },
        ],
      });
      const activeRes = await getActiveEvaluationPeriodAction();

      // Submit sebagai mahasiswa
      const studentId = 'student-test-anon-01';
      mockCurrentUser.activeRole = 'STUDENT';
      mockCurrentUser.user.id = studentId;

      const submitRes = await submitStudentEvaluationAction({
        periodId: activeRes.period!.id,
        classId,
        className: 'Pemrograman Web Lanjut',
        lecturerId,
        lecturerName: 'Dr. Ardiansyah',
        scores: { q1: 5 },
        comment: 'Penjelasan materi sangat aplikatif dan mudah dimengerti.',
      });

      expect(submitRes.ok).toBe(true);

      const receipts = (globalThis as any).__siajarEvalReceipts;
      const responses = (globalThis as any).__siajarEvalResponses;

      // 1. Verifikasi Receipt: mencatat bahwa mahasiswa sudah mengisi agar tidak ganda
      const receipt = receipts.find((r: any) => r.studentId === studentId);
      expect(receipt).toBeDefined();
      expect(receipt.classId).toBe(classId);

      // 2. Verifikasi Response: TIDAK memiliki field studentId sama sekali demi privasi mutlak
      const response = responses.find((r: any) => r.comment === 'Penjelasan materi sangat aplikatif dan mudah dimengerti.');
      expect(response).toBeDefined();
      expect((response as any).studentId).toBeUndefined();
      expect((response as any).student_id).toBeUndefined();
    });

    it('mencegah pengisian berulang (ganda) oleh mahasiswa yang sama pada kelas dan periode yang sama', async () => {
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      await createEvaluationPeriodAction({
        title: 'Evaluasi Ganda Test',
        semester: 'Ganjil 2026',
        startDate: '2026-10-01',
        endDate: '2026-11-30',
        questions: [{ id: 'q1', text: 'Kejelasan', category: 'PEDAGOGIK' }],
      });
      const activeRes = await getActiveEvaluationPeriodAction();
      const studentId = 'student-test-anon-02';

      mockCurrentUser.activeRole = 'STUDENT';
      mockCurrentUser.user.id = studentId;

      const firstSubmit = await submitStudentEvaluationAction({
        periodId: activeRes.period!.id,
        classId,
        className: 'Basis Data',
        lecturerId,
        lecturerName: 'Dr. Ardiansyah',
        scores: { q1: 4 },
        comment: 'Pertama kali submit.',
      });
      expect(firstSubmit.ok).toBe(true);

      const secondSubmit = await submitStudentEvaluationAction({
        periodId: activeRes.period!.id,
        classId,
        className: 'Basis Data',
        lecturerId,
        lecturerName: 'Dr. Ardiansyah',
        scores: { q1: 5 },
        comment: 'Percobaan submit kedua yang harus diblokir.',
      });
      expect(secondSubmit.ok).toBe(false);
      expect(secondSubmit.error).toContain('sudah mengisi evaluasi');
    });
  });

  describe('3. Batas Responden (Threshold >= 5) & Hak Akses Dosen', () => {
    it('dosen tidak dapat melihat rekap komentar jika responden kurang dari 5 atau periode masih buka', async () => {
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      await createEvaluationPeriodAction({
        title: 'Evaluasi Batas Responden',
        semester: 'Ganjil 2026',
        startDate: '2026-10-01',
        endDate: '2026-11-30',
        questions: [{ id: 'q1', text: 'Kualitas', category: 'PEDAGOGIK' }],
      });
      const activeRes = await getActiveEvaluationPeriodAction();

      // Submit untuk 3 responden saja (< 5)
      mockCurrentUser.activeRole = 'STUDENT';
      for (let i = 1; i <= 3; i++) {
        mockCurrentUser.user.id = `student-th-${i}`;
        await submitStudentEvaluationAction({
          periodId: activeRes.period!.id,
          classId: 'class-sample-threshold',
          className: 'Kecerdasan Buatan',
          lecturerId: 'lecturer-threshold',
          lecturerName: 'Dosen Uji',
          scores: { q1: 4 },
          comment: `Feedback dari mahasiswa ${i}`,
        });
      }

      // Periode ditutup oleh Kaprodi
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      await toggleEvaluationPeriodStatusAction(activeRes.period!.id, 'CLOSED');

      // Dosen memeriksa hasil
      mockCurrentUser.activeRole = 'LECTURER';
      mockCurrentUser.user.id = 'lecturer-threshold';
      const summary = await getLecturerEvaluationSummaryAction('class-sample-threshold');
      expect(summary.hasMinimumRespondents).toBe(false);
      expect(summary.notice).toContain('minimal 5 responden');
    });

    it('dosen dapat melihat rekap dan komentar saat responden >= 5 dan periode telah ditutup', async () => {
      // Buat periode baru terbuka
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      const createRes = await createEvaluationPeriodAction({
        title: 'Evaluasi Responden Cukup',
        semester: 'Ganjil 2026',
        startDate: '2026-10-01',
        endDate: '2026-11-30',
        questions: [{ id: 'q1', text: 'Kualitas', category: 'PEDAGOGIK' }],
      });
      const periodId = createRes.period!.id;

      // Tambahkan 5 responden saat periode masih OPEN
      mockCurrentUser.activeRole = 'STUDENT';
      for (let i = 1; i <= 6; i++) {
        mockCurrentUser.user.id = `student-full-${i}`;
        await submitStudentEvaluationAction({
          periodId,
          classId: 'class-full-threshold',
          className: 'Kecerdasan Buatan',
          lecturerId: 'lecturer-full',
          lecturerName: 'Dosen Uji',
          scores: { q1: 5 },
          comment: `Feedback konstruktif dari mahasiswa ${i}`,
        });
      }

      // Periode ditutup oleh Kaprodi
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      await toggleEvaluationPeriodStatusAction(periodId, 'CLOSED');

      // Dosen memeriksa hasil
      mockCurrentUser.activeRole = 'LECTURER';
      mockCurrentUser.user.id = 'lecturer-full';
      const summary = await getLecturerEvaluationSummaryAction('class-full-threshold');
      expect(summary.hasMinimumRespondents).toBe(true);
      expect(summary.isPeriodClosed).toBe(true);
      expect(summary.respondentsCount).toBeGreaterThanOrEqual(5);
      expect(summary.averageScore).toBeGreaterThan(4.0);
    });
  });

  describe('4. Rekapitulasi Kaprodi & Ekspor CSV Akreditasi', () => {
    it('kaprodi dapat melihat rekapitulasi seluruh dosen dan mata kuliah', async () => {
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      const report = await getCoordinatorEvaluationReportAction();
      expect(report.ok).toBe(true);
      expect(report.period).toBeDefined();
      expect(report.lecturerRecap).toBeDefined();
    });

    it('dapat menghasilkan berkas ekspor CSV berformat RFC 4180 untuk laporan akreditasi', async () => {
      mockCurrentUser.activeRole = 'PROGRAM_COORDINATOR';
      const csvRes = await exportCoordinatorEvaluationCsvAction();

      expect(csvRes.ok).toBe(true);
      expect(csvRes.csvContent).toBeDefined();
      expect(csvRes.csvContent).toContain('Nama Dosen');
      expect(csvRes.csvContent).toContain('Mata Kuliah');
      expect(csvRes.csvContent).toContain('Jumlah Responden');
    });
  });
});
