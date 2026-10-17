import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockCurrentUser: {
  user: { id: string; name?: string; email?: string };
  roles: string[];
  activeRole: string;
} | null = null;

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

import {
  evaluateStudentRisk,
  getRiskRank,
  getEarlyWarningPolicy,
  updateEarlyWarningPolicy,
  runDailyRiskEvaluation,
  getMentoringAdviseesRisk,
  getClassRiskSummaryAction,
  getStudentAcademicStatusAction,
  getMentoringRiskListAction,
  getCoordinatorCohortRiskAction,
  triggerDailyRiskCalculationAction,
  updateEarlyWarningPolicyAction,
  DEFAULT_EARLY_WARNING_POLICY,
  EarlyWarningPolicy,
} from '@/modules/early-warning';

describe('Sistem Peringatan Dini Mahasiswa Berisiko SIAJAR', () => {
  const class1 = 'c0000000-0000-0000-0000-000000000001';
  const class2 = 'c0000000-0000-0000-0000-000000000002';
  const lecturer1Id = 'a0000002-0000-0000-0000-000000000002';
  const lecturer2Id = 'lec-other-999';
  const student1Id = 'a0000001-0000-0000-0000-000000000001';
  const student2Id = 'a0000003-0000-0000-0000-000000000003';

  beforeEach(() => {
    // Reset shared state
    (globalThis as any).__siajarRiskEvaluations = new Map();
    (globalThis as any).__siajarNotif = [];
    (globalThis as any).__siajarNotifDedup = new Set();
    (globalThis as any).__siajarAkademik = {
      classes: [
        { id: class1, title: 'Pemrograman Web & Arsitektur Cloud', created_by: lecturer1Id, status: 'OPEN' },
        { id: class2, title: 'Algoritma & Struktur Data Lanjut', created_by: lecturer2Id, status: 'OPEN' },
      ],
      enrollments: [
        { class_id: class1, student_id: student1Id, student_name: 'Ahmad Mahasiswa', status: 'ACTIVE' },
        { class_id: class2, student_id: student2Id, student_name: 'Citra Asisten', status: 'ACTIVE' },
      ],
      advisees: [],
    };
  });

  describe('1. Perhitungan Indikator & Skor Risiko', () => {
    it('mengidentifikasi mahasiswa AMAN ketika semua metrik terpenuhi', () => {
      const evaluation = evaluateStudentRisk(
        {
          studentId: 'std-safe-1',
          studentName: 'Budi Santoso',
          studentNim: '2024001',
          angkatan: 2024,
          classId: 'cls-1',
          classTitle: 'Pemrograman Web',
          totalSessions: 10,
          attendedSessions: 10, // 100%
          assignments: [
            { id: 'a1', title: 'Tugas 1', due_at: new Date(Date.now() - 86400000 * 5).toISOString() },
            { id: 'a2', title: 'Tugas 2', due_at: new Date(Date.now() - 86400000 * 2).toISOString() },
          ],
          submissions: [
            { assignment_id: 'a1', is_late: false, score: 85 },
            { assignment_id: 'a2', is_late: false, score: 90 },
          ],
          materialsCount: 6,
          materialsCompleted: 6,
        },
        DEFAULT_EARLY_WARNING_POLICY
      );

      expect(evaluation.riskLevel).toBe('AMAN');
      expect(evaluation.score).toBeGreaterThanOrEqual(85);
      expect(evaluation.indicators.length).toBe(0);
      expect(evaluation.recommendations.length).toBeGreaterThan(0);
      expect(evaluation.recommendations[0]).toContain('Performa akademik Anda sangat baik');
    });

    it('mendeteksi RISIKO_TINGGI ketika presensi di bawah batas minimal (70% vs 75%)', () => {
      const evaluation = evaluateStudentRisk(
        {
          studentId: 'std-warn-1',
          studentName: 'Siti Rahma',
          studentNim: '2024002',
          angkatan: 2024,
          classId: 'cls-1',
          classTitle: 'Pemrograman Web',
          totalSessions: 10,
          attendedSessions: 7, // 70% < 75%
          assignments: [],
          submissions: [],
          materialsCount: 4,
          materialsCompleted: 4,
        },
        DEFAULT_EARLY_WARNING_POLICY
      );

      expect(evaluation.riskLevel).toBe('RISIKO_TINGGI');
      const attendanceInd = evaluation.indicators.find((i) => i.category === 'KEHADIRAN');
      expect(attendanceInd).toBeDefined();
      expect(attendanceInd?.reason).toContain('Kehadiran 70%, batas minimal kelayakan ujian 75%');
    });

    it('mendeteksi penurunan tren nilai yang signifikan antar tugas berturut-turut', () => {
      const evaluation = evaluateStudentRisk(
        {
          studentId: 'std-drop-1',
          studentName: 'Rian Pratama',
          studentNim: '2024003',
          angkatan: 2024,
          classId: 'cls-1',
          classTitle: 'Struktur Data',
          totalSessions: 10,
          attendedSessions: 10,
          assignments: [
            { id: 'a1', title: 'Tugas 1', due_at: new Date(Date.now() - 86400000 * 5).toISOString() },
            { id: 'a2', title: 'Tugas 2', due_at: new Date(Date.now() - 86400000 * 2).toISOString() },
          ],
          submissions: [
            { assignment_id: 'a1', is_late: false, score: 95 },
            { assignment_id: 'a2', is_late: false, score: 65 }, // Turun 30 poin (> 15)
          ],
          materialsCount: 5,
          materialsCompleted: 5,
        },
        DEFAULT_EARLY_WARNING_POLICY
      );

      expect(['PERHATIAN', 'RISIKO_TINGGI']).toContain(evaluation.riskLevel);
      const gradeInd = evaluation.indicators.find((i) => i.category === 'TREN_NILAI');
      expect(gradeInd).toBeDefined();
      expect(gradeInd?.reason).toContain('turun 30 poin');
    });

    it('mendeteksi tugas yang belum dikumpulkan setelah melewati batas tenggat', () => {
      const pastDue1 = new Date(Date.now() - 86400000 * 3).toISOString();
      const pastDue2 = new Date(Date.now() - 86400000 * 2).toISOString();
      const pastDue3 = new Date(Date.now() - 86400000 * 1).toISOString();

      const evaluation = evaluateStudentRisk(
        {
          studentId: 'std-miss-1',
          studentName: 'Dewi Lestari',
          studentNim: '2024004',
          angkatan: 2024,
          classId: 'cls-1',
          classTitle: 'Basis Data',
          totalSessions: 10,
          attendedSessions: 10,
          assignments: [
            { id: 'a1', title: 'Tugas 1', due_at: pastDue1 },
            { id: 'a2', title: 'Tugas 2', due_at: pastDue2 },
            { id: 'a3', title: 'Tugas 3', due_at: pastDue3 },
          ],
          submissions: [], // Belum mengumpulkan sama sekali (3 missing >= 3 high risk)
          materialsCount: 5,
          materialsCompleted: 5,
        },
        DEFAULT_EARLY_WARNING_POLICY
      );

      expect(evaluation.riskLevel).toBe('RISIKO_TINGGI');
      const assnInd = evaluation.indicators.find((i) => i.category === 'TUGAS');
      expect(assnInd).toBeDefined();
      expect(assnInd?.reason).toContain('3 tugas belum dikumpulkan');
    });
  });

  describe('2. Tingkat Risiko & Hierarki (Aman < Perhatian < Risiko Tinggi)', () => {
    it('memberikan urutan ranking yang benar', () => {
      expect(getRiskRank('AMAN')).toBe(1);
      expect(getRiskRank('PERHATIAN')).toBe(2);
      expect(getRiskRank('RISIKO_TINGGI')).toBe(3);
      expect(getRiskRank('RISIKO_TINGGI')).toBeGreaterThan(getRiskRank('PERHATIAN'));
      expect(getRiskRank('PERHATIAN')).toBeGreaterThan(getRiskRank('AMAN'));
    });
  });

  describe('3. Konfigurasi Kebijakan Dinamis oleh Super Admin', () => {
    it('dapat memperbarui kebijakan ambang batas secara fleksibel', async () => {
      const customPolicy: Partial<EarlyWarningPolicy> = {
        minAttendancePercent: 80,
        warningAttendancePercent: 85,
        maxMissingAssignmentsWarning: 2,
        maxMissingAssignmentsHighRisk: 4,
      };

      const updated = await updateEarlyWarningPolicy(customPolicy);
      expect(updated.minAttendancePercent).toBe(80);
      expect(updated.warningAttendancePercent).toBe(85);

      const retrieved = await getEarlyWarningPolicy();
      expect(retrieved.minAttendancePercent).toBe(80);
    });
  });

  describe('4. Batch Evaluasi Terjadwal Harian & Sumber Data Riil Store Aplikasi (Tahap C8)', () => {
    it('mengevaluasi hanya mahasiswa riil dari store aplikasi (tanpa data hardcode demo) dan mengirim notifikasi hanya saat eskalasi', async () => {
      // Siapkan data presensi riil di mana student1Id hadir 5 dari 8 sesi (62.5% < 75% -> RISIKO_TINGGI)
      (globalThis as any).__siajarPresensi = {
        sessions: Array.from({ length: 8 }, (_, idx) => ({
          id: `ses-real-${idx + 1}`,
          class_id: class1,
        })),
        records: Array.from({ length: 5 }, (_, idx) => ({
          session_id: `ses-real-${idx + 1}`,
          student_id: student1Id,
          status: 'HADIR',
        })),
      };
      (globalThis as any).__siajarTugas = { assignments: [], submissions: [] };

      const firstRun = await runDailyRiskEvaluation();
      // Hanya 2 pendaftaran riil di __siajarAkademik (student1Id di class1, student2Id di class2)
      expect(firstRun.evaluatedCount).toBe(2);
      expect(firstRun.escalatedCount).toBe(1); // student1Id naik dari AMAN ke RISIKO_TINGGI
      expect(firstRun.notificationsSent).toBeGreaterThanOrEqual(1);

      // Pastikan mahasiswa hardcode lama (a0000007-...) yang tidak ada di store riil TIDAK muncul
      mockCurrentUser = {
        user: { id: lecturer1Id, name: 'Dr. Budi Santoso' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };
      const class1Evals = await getClassRiskSummaryAction(class1);
      expect(class1Evals.length).toBe(1);
      expect(class1Evals[0].studentId).toBe(student1Id);
      expect(class1Evals[0].riskLevel).toBe('RISIKO_TINGGI');
      expect(class1Evals.some((e) => e.studentId === 'a0000007-0000-0000-0000-000000000007')).toBe(false);

      // Pada run kedua langsung setelahnya, tidak ada eskalasi baru (tidak ada notifikasi ganda)
      const secondRun = await runDailyRiskEvaluation();
      expect(secondRun.escalatedCount).toBe(0);
      expect(secondRun.notificationsSent).toBe(0);
    });
  });

  describe('5. Otorisasi Kelas & Kepemilikan Data (Tahap B3 & Tahap D)', () => {
    it('Dosen A ditolak untuk kelas Dosen B, serta SYSTEM_ADMIN dan STUDENT ditolak di getClassRiskSummaryAction', async () => {
      // Pastikan class1 dan class2 memiliki data nyata
      await runDailyRiskEvaluation();

      // Dosen 1 diizinkan melihat class1 (miliknya), tetapi ditolak melihat class2 (milik Dosen 2)
      mockCurrentUser = {
        user: { id: lecturer1Id, name: 'Dr. Budi Santoso' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };
      const ownRes = await getClassRiskSummaryAction(class1);
      expect(ownRes.length).toBe(1);
      expect(ownRes[0].studentId).toBe(student1Id);

      const forbiddenClass2 = await getClassRiskSummaryAction(class2);
      expect(forbiddenClass2).toEqual([]);

      // Dosen 2 diizinkan melihat class2 (miliknya), tetapi ditolak melihat class1 (milik Dosen 1)
      mockCurrentUser = {
        user: { id: lecturer2Id, name: 'Dosen Lain' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };
      const lec2OwnRes = await getClassRiskSummaryAction(class2);
      expect(lec2OwnRes.length).toBe(1);
      expect(lec2OwnRes[0].studentId).toBe(student2Id);

      const forbiddenClass1 = await getClassRiskSummaryAction(class1);
      expect(forbiddenClass1).toEqual([]);

      // SYSTEM_ADMIN ditolak
      mockCurrentUser = {
        user: { id: 'sysadmin-1', name: 'System Admin' },
        roles: ['SYSTEM_ADMIN'],
        activeRole: 'SYSTEM_ADMIN',
      };
      expect(await getClassRiskSummaryAction(class1)).toEqual([]);
      expect(await getMentoringRiskListAction()).toEqual([]);
      expect((await getCoordinatorCohortRiskAction()).totalAtRisk).toBe(0);
      expect(await getStudentAcademicStatusAction(student1Id)).toEqual([]);

      // STUDENT ditolak untuk getClassRiskSummaryAction, getMentoringRiskListAction, getCoordinatorCohortRiskAction, triggerDailyRiskCalculationAction, dan updateEarlyWarningPolicyAction
      mockCurrentUser = {
        user: { id: student1Id, name: 'Ahmad Mahasiswa' },
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      };
      expect(await getClassRiskSummaryAction(class1)).toEqual([]);
      expect(await getMentoringRiskListAction()).toEqual([]);
      expect((await getCoordinatorCohortRiskAction()).cohorts).toEqual([]);
      const studentTrigger = await triggerDailyRiskCalculationAction();
      expect(studentTrigger.ok).toBe(false);
      const studentPolicyUpdate = await updateEarlyWarningPolicyAction({ minAttendancePercent: 50 });
      expect(studentPolicyUpdate.ok).toBe(false);
    });

    it('getMentoringAdviseesRisk hanya mengembalikan mahasiswa bimbingan / kelas yang diampu dosen tersebut', async () => {
      // Dosen Wali 3 tidak mengampu kelas, tapi membimbing student2Id
      const advisor3Id = 'lec-advisor-3';
      (globalThis as any).__siajarAkademik.advisees = [
        { lecturer_id: advisor3Id, student_id: student2Id },
      ];

      const lec1List = await getMentoringAdviseesRisk(lecturer1Id);
      expect(lec1List.length).toBe(1);
      expect(lec1List.every((item) => item.classId === class1 && item.studentId === student1Id)).toBe(true);

      const advisor3List = await getMentoringAdviseesRisk(advisor3Id);
      expect(advisor3List.length).toBe(1);
      expect(advisor3List[0].studentId).toBe(student2Id);

      const outsiderLecList = await getMentoringAdviseesRisk('lec-unrelated-000');
      expect(outsiderLecList).toEqual([]);
    });

    it('mahasiswa tidak bisa melihat status risiko mahasiswa lain pada getStudentAcademicStatusAction', async () => {
      mockCurrentUser = {
        user: { id: student1Id, name: 'Ahmad Mahasiswa' },
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      };
      const forbiddenOtherStudent = await getStudentAcademicStatusAction(student2Id);
      expect(forbiddenOtherStudent).toEqual([]);

      const ownStatus = await getStudentAcademicStatusAction(student1Id);
      expect(ownStatus.length).toBe(1);
      expect(ownStatus[0].studentId).toBe(student1Id);

      // Dosen 1 bisa melihat student1Id (di kelasnya), tetapi tidak bisa melihat student2Id (di kelas Dosen 2)
      mockCurrentUser = {
        user: { id: lecturer1Id, name: 'Dr. Budi Santoso' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };
      const lec1ViewStudent1 = await getStudentAcademicStatusAction(student1Id);
      expect(lec1ViewStudent1.length).toBe(1);

      const lec1ViewStudent2 = await getStudentAcademicStatusAction(student2Id);
      expect(lec1ViewStudent2).toEqual([]);
    });
  });
});
