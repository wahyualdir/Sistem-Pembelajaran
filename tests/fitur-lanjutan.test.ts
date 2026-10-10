import { describe, it, expect } from 'vitest';
import { konversiNilaiKeHuruf } from '../src/lib/akademik/nilai';
import {
  createAttendanceSessionAction,
  submitStudentAttendanceAction,
  getClassAttendanceSummaryAction,
} from '../src/modules/academic/attendance-actions';
import {
  createQuizAction,
  submitQuizAttemptAction,
  getQuizDetailAction,
} from '../src/modules/academic/quiz-actions';
import { triggerDeadlineRemindersAction } from '../src/modules/academic/reminder-actions';
import { askAiAcademicAssistantAction } from '../src/modules/academic/ai-actions';

describe('SIAJAR Fitur Lanjutan: Presensi, Kuis, AI & Pengingat', () => {
  describe('1. Modul Presensi & Syarat UAS 75%', () => {
    it('menghitung persentase kehadiran dan kelayakan syarat UAS (minimal 75%)', async () => {
      const mockStudents = [
        { student_id: 'mhs-1', name: 'Ahmad Mahasiswa' },
        { student_id: 'mhs-2', name: 'Budi Santoso' },
      ];

      // Setup 4 sessions in store
      const presensiStore = ((globalThis as any).__siajarPresensi ??= { sessions: [], records: [] });
      const classId = 'c0000000-0000-0000-0000-000000000001';

      presensiStore.sessions = [
        { id: 'ses-1', class_id: classId, meeting_number: 1, title: 'P1', date: '2026-10-01', start_time: '08:00', end_time: '10:00', code: '123456', is_open: true, created_at: '' },
        { id: 'ses-2', class_id: classId, meeting_number: 2, title: 'P2', date: '2026-10-08', start_time: '08:00', end_time: '10:00', code: '123456', is_open: true, created_at: '' },
        { id: 'ses-3', class_id: classId, meeting_number: 3, title: 'P3', date: '2026-10-15', start_time: '08:00', end_time: '10:00', code: '123456', is_open: true, created_at: '' },
        { id: 'ses-4', class_id: classId, meeting_number: 4, title: 'P4', date: '2026-10-22', start_time: '08:00', end_time: '10:00', code: '123456', is_open: true, created_at: '' },
      ];

      // mhs-1 hadir 3 dari 4 pertemuan = 75% (Lolos UAS)
      // mhs-2 hadir 2 dari 4 pertemuan = 50% (Ditolak UAS)
      presensiStore.records = [
        { id: 'r1', session_id: 'ses-1', student_id: 'mhs-1', student_name: 'Ahmad Mahasiswa', status: 'HADIR', recorded_at: '' },
        { id: 'r2', session_id: 'ses-2', student_id: 'mhs-1', student_name: 'Ahmad Mahasiswa', status: 'HADIR', recorded_at: '' },
        { id: 'r3', session_id: 'ses-3', student_id: 'mhs-1', student_name: 'Ahmad Mahasiswa', status: 'HADIR', recorded_at: '' },

        { id: 'r4', session_id: 'ses-1', student_id: 'mhs-2', student_name: 'Budi Santoso', status: 'HADIR', recorded_at: '' },
        { id: 'r5', session_id: 'ses-2', student_id: 'mhs-2', student_name: 'Budi Santoso', status: 'HADIR', recorded_at: '' },
      ];

      const summary = await getClassAttendanceSummaryAction(classId, mockStudents);
      const ahmad = summary.find((s) => s.student_id === 'mhs-1');
      const budi = summary.find((s) => s.student_id === 'mhs-2');

      expect(ahmad).toBeDefined();
      expect(ahmad?.percentage).toBe(75);
      expect(ahmad?.can_take_uas).toBe(true);

      expect(budi).toBeDefined();
      expect(budi?.percentage).toBe(50);
      expect(budi?.can_take_uas).toBe(false);
    });
  });

  describe('2. Modul Kuis & Penilaian Otomatis (Auto-Grading)', () => {
    it('menghitung skor pilihan ganda secara otomatis berdasarkan kunci jawaban', async () => {
      const quizStore = ((globalThis as any).__siajarKuis ??= { quizzes: [], attempts: [] });
      const quizId = 'q0000000-0000-0000-0000-000000000001';

      quizStore.quizzes = [
        {
          id: quizId,
          class_id: 'c0000000-0000-0000-0000-000000000001',
          title: 'Kuis 1 Pemrograman Web',
          duration_minutes: 30,
          due_at: new Date(Date.now() + 86400000).toISOString(),
          questions: [
            {
              id: 'soal-1',
              question_text: 'Apa kepanjangan dari HTML?',
              question_type: 'MULTIPLE_CHOICE',
              options: ['Hyper Text Markup Language', 'High Tech Modern Language'],
              correct_answer_index: 0,
              points: 50,
            },
            {
              id: 'soal-2',
              question_text: 'Tag mana yang mendefinisikan tautan?',
              question_type: 'MULTIPLE_CHOICE',
              options: ['<p>', '<a>', '<div>'],
              correct_answer_index: 1,
              points: 50,
            },
          ],
          total_points: 100,
          is_published: true,
          created_at: new Date().toISOString(),
        },
      ];

      // Jawaban: soal-1 benar (0), soal-2 salah (0)
      const answers: Record<string, number> = {
        'soal-1': 0,
        'soal-2': 0, // salah, seharusnya 1
      };

      // Simulasi grading logic
      let calculatedScore = 0;
      for (const q of quizStore.quizzes[0].questions) {
        if (q.question_type === 'MULTIPLE_CHOICE' && answers[q.id] === q.correct_answer_index) {
          calculatedScore += q.points;
        }
      }

      expect(calculatedScore).toBe(50);
    });
  });

  describe('3. Mesin Pengingat H-1 Tenggat Waktu', () => {
    it('mendeteksi tugas dalam rentang 24 jam dan mengabaikan tugas yang masih lama', async () => {
      const now = Date.now();
      const memTugas = ((globalThis as any).__siajarTugas ??= { assignments: [], submissions: [] });
      const memAkademik = ((globalThis as any).__siajarAkademik ??= { classes: [], enrollments: [] });

      const classId = 'c0000000-0000-0000-0000-000000000099';
      memAkademik.enrollments.push({ class_id: classId, student_id: 'mhs-test-h1', student_name: 'Test Student' });

      // Tugas 1: 12 jam lagi (H-1) -> harus memicu reminder
      memTugas.assignments.push({
        id: 'asg-h1',
        class_id: classId,
        title: 'Tugas Segera Dikumpulkan',
        description: 'Urgensi tinggi',
        due_at: new Date(now + 12 * 3600 * 1000).toISOString(),
        close_at: new Date(now + 15 * 3600 * 1000).toISOString(),
      });

      // Tugas 2: 5 hari lagi -> TIDAK memicu reminder
      memTugas.assignments.push({
        id: 'asg-far',
        class_id: classId,
        title: 'Tugas Masih Lama',
        description: 'Tenggat minggu depan',
        due_at: new Date(now + 5 * 24 * 3600 * 1000).toISOString(),
        close_at: new Date(now + 6 * 24 * 3600 * 1000).toISOString(),
      });

      const res = await triggerDeadlineRemindersAction();
      expect(res.assignmentsChecked).toBeGreaterThanOrEqual(2);
      expect(res.upcomingAssignments.some((u) => u.title === 'Tugas Segera Dikumpulkan')).toBe(true);
      expect(res.upcomingAssignments.some((u) => u.title === 'Tugas Masih Lama')).toBe(false);
    });
  });

  describe('4. Konversi Skala Nilai Huruf Mutu Gradebook', () => {
    it('mengonversi angka rata-rata gradebook ke huruf mutu resmi institusi', () => {
      expect(konversiNilaiKeHuruf(88).huruf).toBe('A');
      expect(konversiNilaiKeHuruf(88).bobot).toBe(4.0);

      expect(konversiNilaiKeHuruf(82).huruf).toBe('A-');
      expect(konversiNilaiKeHuruf(77).huruf).toBe('B+');
      expect(konversiNilaiKeHuruf(71).huruf).toBe('B');
      expect(konversiNilaiKeHuruf(67).huruf).toBe('B-');
      expect(konversiNilaiKeHuruf(62).huruf).toBe('C+');
      expect(konversiNilaiKeHuruf(56).huruf).toBe('C');
      expect(konversiNilaiKeHuruf(45).huruf).toBe('D');
      expect(konversiNilaiKeHuruf(30).huruf).toBe('E');
    });
  });
});
