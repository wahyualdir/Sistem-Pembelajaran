import { revalidatePath } from 'next/cache';
import {
  getAcademicStore,
  getAssignmentStore,
  getAttendanceStore,
  getQuizStore,
} from '@/lib/auth/class-access';
import { notify } from './service';
import type { ScheduledReminderCheckResult } from './types';

export interface ReminderResult {
  remindersSent: number;
  assignmentsChecked: number;
  examsChecked?: number;
  attendanceSessionsChecked?: number;
  skippedDuplicates?: number;
  upcomingAssignments: { title: string; due_at: string; class_id: string }[];
}

/**
 * Scheduler Pengingat Otomatis (Job/Cron) SIAJAR
 *
 * Aturan Pengingat:
 * 1. Tenggat Tugas:
 *    - H-3 (3 hari sebelum tenggat)
 *    - H-1 (24 jam sebelum tenggat)
 *    - 3 jam sebelum tenggat (Mendesak)
 * 2. Ujian / Kuis:
 *    - H-1 (24 jam sebelum pelaksanaan)
 *    - 1 jam sebelum ujian dimulai
 * 3. Sesi Presensi:
 *    - Pemberitahuan seketika saat sesi presensi kuliah dibuka oleh dosen
 *
 * Proteksi Idempotensi Persisten:
 * Setiap pengingat memiliki kunci deduplikasi unik:
 * `${studentId}:${eventType}:${entityId}:${stage}`
 * Sehingga pengingat untuk jendela waktu yang sama tidak akan pernah terkirim ganda.
 */
export async function runScheduledReminders(): Promise<ScheduledReminderCheckResult> {
  const result: ScheduledReminderCheckResult = {
    assignmentsChecked: 0,
    examsChecked: 0,
    attendanceSessionsChecked: 0,
    remindersDispatched: 0,
    skippedDuplicates: 0,
    errors: [],
  };

  const now = Date.now();

  try {
    // -------------------------------------------------------------
    // 1. EVALUASI PENGINGAT TENGGAT TUGAS KULIAH (H-3, H-1, 3 Jam)
    // -------------------------------------------------------------
    const academicStore = getAcademicStore();
    const tugasStore = getAssignmentStore();
    const enrollments = academicStore.enrollments ?? [];
    const assignments = tugasStore.assignments ?? [];
    const submissions = tugasStore.submissions ?? [];

    for (const a of assignments) {
      result.assignmentsChecked++;
      const dueTime = Date.parse(a.due_at);
      if (isNaN(dueTime)) continue;

      const diffMs = dueTime - now;
      if (diffMs <= 0) continue; // Sudah lewat tenggat

      let stage: 'H_3' | 'H_1' | 'H_3_HOURS' | null = null;
      let stageTitle = '';
      let stageBody = '';

      if (diffMs <= 3 * 3600 * 1000) {
        // Kurang dari atau sama dengan 3 jam
        stage = 'H_3_HOURS';
        stageTitle = `[MENDESAK] 3 Jam Menuju Tenggat: ${a.title}`;
        stageBody = `Tenggat pengumpulan tugas "${a.title}" tersisa kurang dari 3 jam. Segera unggah tugas Anda sebelum sistem ditutup.`;
      } else if (diffMs <= 24 * 3600 * 1000) {
        // Kurang dari atau sama dengan 24 jam (H-1)
        stage = 'H_1';
        stageTitle = `[Pengingat H-1] Tenggat Tugas: ${a.title}`;
        stageBody = `Tugas "${a.title}" harus dikumpulkan besok (kurang dari 24 jam lagi). Pastikan berkas Anda telah siap.`;
      } else if (diffMs <= 72 * 3600 * 1000) {
        // Kurang dari atau sama dengan 72 jam (H-3)
        stage = 'H_3';
        stageTitle = `[Pengingat H-3] Tenggat Tugas: ${a.title}`;
        stageBody = `Tugas "${a.title}" memiliki tenggat waktu 3 hari lagi. Jangan tunda pengerjaan tugas Anda.`;
      }

      if (stage) {
        // Dapatkan mahasiswa kelas yang belum mengumpulkan tugas ini
        const classStudents = enrollments.filter(
          (e) => e.class_id === a.class_id && (e.status === undefined || e.status === 'ACTIVE')
        );
        const submittedStudentIds = new Set(
          submissions.filter((s) => s.assignment_id === a.id).map((s) => s.student_id)
        );

        for (const cs of classStudents) {
          if (submittedStudentIds.has(cs.student_id)) continue; // Lewati jika sudah submit

          const dedupKey = `${cs.student_id}:ASSIGNMENT_DUE:${a.id}:${stage}`;
          const res = await notify({
            userId: cs.student_id,
            type: 'ASSIGNMENT_DUE',
            title: stageTitle,
            body: stageBody,
            targetUrl: `/classes/${a.class_id}`,
            classId: a.class_id,
            entityType: 'assignments',
            entityId: a.id,
            dedupKey,
          });

          if (res.skippedDueToDedup) {
            result.skippedDuplicates++;
          } else if (res.ok) {
            result.remindersDispatched++;
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 2. EVALUASI PENGINGAT UJIAN / KUIS (H-1, 1 Jam)
    //    Membaca store kuis kanonis (__siajarKuis) lewat accessor getQuizStore()
    // -------------------------------------------------------------
    const quizStore = getQuizStore();
    const quizzes = quizStore.quizzes ?? [];

    for (const q of quizzes) {
      result.examsChecked++;
      const startTime = Date.parse(q.due_at || q.created_at);
      if (isNaN(startTime)) continue;

      const diffMs = startTime - now;
      if (diffMs <= 0) continue;

      let stage: 'H_1' | 'H_1_HOUR' | null = null;
      let stageTitle = '';
      let stageBody = '';

      if (diffMs <= 1 * 3600 * 1000) {
        // Kurang dari atau sama dengan 1 jam
        stage = 'H_1_HOUR';
        stageTitle = `[SIAP-SIAP] 1 Jam Menuju Ujian: ${q.title}`;
        stageBody = `Sesi evaluasi "${q.title}" akan dimulai dalam 1 jam. Silakan persiapkan perangkat dan cek kestabilan internet Anda.`;
      } else if (diffMs <= 24 * 3600 * 1000) {
        // Kurang dari atau sama dengan 24 jam (H-1)
        stage = 'H_1';
        stageTitle = `[Pengingat H-1] Ujian: ${q.title}`;
        stageBody = `Pelaksanaan "${q.title}" dijadwalkan besok. Pelajari materi ujian dan pastikan tidak ada jadwal bentrok.`;
      }

      if (stage) {
        const classStudents = enrollments.filter(
          (e) => e.class_id === q.class_id && (e.status === undefined || e.status === 'ACTIVE')
        );
        for (const cs of classStudents) {
          const dedupKey = `${cs.student_id}:EXAM_UPCOMING:${q.id}:${stage}`;
          const res = await notify({
            userId: cs.student_id,
            type: 'EXAM_UPCOMING',
            title: stageTitle,
            body: stageBody,
            targetUrl: `/exams`,
            classId: q.class_id,
            entityType: 'quizzes',
            entityId: q.id,
            dedupKey,
          });

          if (res.skippedDueToDedup) {
            result.skippedDuplicates++;
          } else if (res.ok) {
            result.remindersDispatched++;
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 3. EVALUASI PENGINGAT SESI PRESENSI TERBUKA
    // -------------------------------------------------------------
    const presensiStore = getAttendanceStore();
    const sessions = presensiStore.sessions ?? [];
    const attendanceRecords = presensiStore.records ?? [];

    for (const s of sessions) {
      result.attendanceSessionsChecked++;
      if (!s.is_open) continue; // Hanya yang sedang terbuka aktif

      const classStudents = enrollments.filter(
        (e) => e.class_id === s.class_id && (e.status === undefined || e.status === 'ACTIVE')
      );
      const attendedStudentIds = new Set(
        attendanceRecords.filter((r) => r.session_id === s.id).map((r) => r.student_id)
      );

      for (const cs of classStudents) {
        if (attendedStudentIds.has(cs.student_id)) continue; // Sudah hadir

        const dedupKey = `${cs.student_id}:ATTENDANCE_OPEN:${s.id}`;
        const res = await notify({
          userId: cs.student_id,
          type: 'ATTENDANCE_OPEN',
          title: `Sesi Presensi Dibuka: Pertemuan ke-${s.meeting_number}`,
          body: `Presensi kelas untuk pertemuan ke-${s.meeting_number} (${s.title || 'Kuliah'}) telah dibuka. Segera lakukan presensi sebelum sesi ditutup.`,
          targetUrl: `/attendance`,
          classId: s.class_id,
          entityType: 'attendance_sessions',
          entityId: s.id,
          dedupKey,
        });

        if (res.skippedDueToDedup) {
          result.skippedDuplicates++;
        } else if (res.ok) {
          result.remindersDispatched++;
        }
      }
    }
  } catch (err: any) {
    result.errors.push(err?.message || 'Terjadi galat saat menjalankan scheduler pengingat');
  }

  return result;
}

/**
 * Menjalankan pengingat tenggat terpadu dan mengembalikan daftar tugas mendatang (H-3 s.d. H-0).
 */
export async function triggerDeadlineRemindersAction(): Promise<ReminderResult> {
  const result = await runScheduledReminders();

  const tugasStore = getAssignmentStore();
  const now = Date.now();
  const threeDaysLater = now + 72 * 60 * 60 * 1000;

  const upcoming = (tugasStore.assignments ?? [])
    .filter((a: any) => {
      const due = Date.parse(a.due_at);
      return due > now && due <= threeDaysLater;
    })
    .map((a: any) => ({
      title: a.title,
      due_at: a.due_at,
      class_id: a.class_id,
    }));

  try {
    revalidatePath('/notifications', 'page');
    revalidatePath('/', 'layout');
  } catch {
    // Ignore in non-request test contexts
  }

  return {
    remindersSent: result.remindersDispatched,
    assignmentsChecked: result.assignmentsChecked,
    examsChecked: result.examsChecked,
    attendanceSessionsChecked: result.attendanceSessionsChecked,
    skippedDuplicates: result.skippedDuplicates,
    upcomingAssignments: upcoming,
  };
}
