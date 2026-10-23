'use server';

import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { isDemoMode } from '@/lib/config/features';
import {
  buildSemesterWeave,
  type SemesterWeaveData,
  type RawClass,
  type RawSession,
  type RawRecord,
  type RawAssignment,
  type RawSubmission,
} from '@/lib/akademik/semester-weave';

export type SemesterWeaveActionResult =
  | { ok: true; data: SemesterWeaveData }
  | { ok: false; pesan: string };

const ERROR_MESSAGE_GENERAL = 'Kain semester belum bisa dimuat. Coba muat ulang halaman.';

/**
 * Server Action: Mengambil data kain semester mahasiswa terautentikasi.
 * Mengikuti Aturan Keras:
 * - Menggunakan klien createClient() yang tunduk pada RLS.
 * - Memfilter eksplisit student_id = user.id.
 * - Maksimal 5 query tanpa loop N+1.
 * - Bila offline atau non-student: mengembalikan data kosong jujur (atau demo fallback di development).
 */
export async function getSemesterWeaveAction(): Promise<SemesterWeaveActionResult> {
  try {
    // 1. Identifikasi pengguna dan peran
    const userContext = await getCurrentUserWithRoles();
    if (!userContext || !userContext.user || userContext.activeRole !== 'STUDENT') {
      return {
        ok: true,
        data: buildSemesterWeave({
          classes: [],
          sessions: [],
          records: [],
          assignments: [],
          submissions: [],
        }),
      };
    }

    const studentId = userContext.user.id;

    // 2. Periksa status Supabase
    const isOnline = await checkSupabaseOnline();
    const isDev = process.env.NODE_ENV === 'development';

    if (!isOnline) {
      if (isDev) {
        return {
          ok: true,
          data: getDemoSemesterWeave(studentId),
        };
      }
      return {
        ok: true,
        data: buildSemesterWeave({
          classes: [],
          sessions: [],
          records: [],
          assignments: [],
          submissions: [],
        }),
      };
    }

    const supabase = await createClient();

    // 3. Query 1: Ambil kelas aktif mahasiswa
    const { data: enrollmentRows, error: enrollError } = await supabase
      .from('enrollments')
      .select('class_id, status, classes(id, title, section, status, deleted_at)')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE');

    if (enrollError) {
      return { ok: false, pesan: ERROR_MESSAGE_GENERAL };
    }

    const activeClasses: RawClass[] = (enrollmentRows || [])
      .map((row: any) => row.classes)
      .filter((c: any) => c && c.status === 'ACTIVE' && !c.deleted_at);

    if (activeClasses.length === 0) {
      if (isDev) {
        return {
          ok: true,
          data: getDemoSemesterWeave(studentId),
        };
      }
      return {
        ok: true,
        data: buildSemesterWeave({
          classes: [],
          sessions: [],
          records: [],
          assignments: [],
          submissions: [],
        }),
      };
    }

    const classIds = activeClasses.map((c) => c.id);

    // 4. Query 2 & 3 (Paralel): attendance_sessions dan assignments
    const [sessionsRes, assignmentsRes] = await Promise.all([
      supabase
        .from('attendance_sessions')
        .select('id, class_id, session_number, session_date, is_open, title')
        .in('class_id', classIds),
      supabase
        .from('assignments')
        .select('id, class_id, title, due_at, close_at, status')
        .in('class_id', classIds)
        .in('status', ['PUBLISHED', 'CLOSED']),
    ]);

    if (sessionsRes.error || assignmentsRes.error) {
      return { ok: false, pesan: ERROR_MESSAGE_GENERAL };
    }

    const sessions = (sessionsRes.data || []) as RawSession[];
    const assignments = (assignmentsRes.data || []) as RawAssignment[];

    const sessionIds = sessions.map((s) => s.id);
    const assignmentIds = assignments.map((a) => a.id);

    // 5. Query 4 & 5 (Paralel): attendance_records dan submissions
    const [recordsRes, submissionsRes] = await Promise.all([
      sessionIds.length > 0
        ? supabase
            .from('attendance_records')
            .select('session_id, status, check_in_at')
            .eq('student_id', studentId)
            .in('session_id', sessionIds)
        : Promise.resolve({ data: [], error: null }),
      assignmentIds.length > 0
        ? supabase
            .from('submissions')
            .select('assignment_id, status, submitted_at, is_late')
            .eq('student_id', studentId)
            .in('assignment_id', assignmentIds)
            .neq('status', 'DRAFT')
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (recordsRes.error || submissionsRes.error) {
      return { ok: false, pesan: ERROR_MESSAGE_GENERAL };
    }

    const records = (recordsRes.data || []) as RawRecord[];
    const submissions = (submissionsRes.data || []) as RawSubmission[];

    // 6. Hitung kain semester dengan fungsi logika murni
    const weaveData = buildSemesterWeave({
      classes: activeClasses,
      sessions,
      records,
      assignments,
      submissions,
    });

    return { ok: true, data: weaveData };
  } catch {
    return { ok: false, pesan: ERROR_MESSAGE_GENERAL };
  }
}

/**
 * Data demonstrasi lokal saat pengujian di development tanpa database aktif.
 * Selaras dengan kelas-kelas aktif di beranda mahasiswa (getHomeActiveClassesAction).
 */
function getDemoSemesterWeave(studentId: string): SemesterWeaveData {
  const baseStart = '2026-09-07'; // Senin Pekan 1
  const classes: RawClass[] = [
    { id: 'course-1', title: 'Pemrograman Web Lanjut', section: 'IF-3A', status: 'ACTIVE' },
    { id: 'course-2', title: 'Rekayasa Perangkat Lunak', section: 'IF-3B', status: 'ACTIVE' },
    { id: 'course-3', title: 'Kecerdasan Buatan & ML', section: 'IF-4A', status: 'ACTIVE' },
    { id: 'course-4', title: 'Basis Data Terdistribusi', section: 'IF-3C', status: 'ACTIVE' },
  ];

  const sessions: RawSession[] = [];
  for (const c of classes) {
    for (let w = 1; w <= 16; w++) {
      const dayOffset = (w - 1) * 7;
      const d = new Date(new Date(baseStart).getTime() + dayOffset * 86400000);
      sessions.push({
        id: `sess-${c.id}-${w}`,
        class_id: c.id,
        session_number: w,
        title: `Pertemuan ke-${w}: Modul Teori & Praktikum ${c.title}`,
        session_date: d.toISOString().split('T')[0],
        is_open: w === 7,
      });
    }
  }

  const records: RawRecord[] = [];
  // Kelas 1: Hadir pekan 1..6
  for (let w = 1; w <= 6; w++) {
    records.push({
      session_id: `sess-course-1-${w}`,
      student_id: studentId,
      status: 'HADIR',
      check_in_at: `2026-09-${String(7 + (w - 1) * 7).padStart(2, '0')}T08:05:00Z`,
    });
  }

  // Kelas 2: Hadir 1, 2, 4, 6; Izin pekan 3; Alpa pekan 5
  records.push(
    { session_id: 'sess-course-2-1', student_id: studentId, status: 'HADIR', check_in_at: '2026-09-08T10:50:00Z' },
    { session_id: 'sess-course-2-2', student_id: studentId, status: 'HADIR', check_in_at: '2026-09-15T10:48:00Z' },
    { session_id: 'sess-course-2-3', student_id: studentId, status: 'IZIN' },
    { session_id: 'sess-course-2-4', student_id: studentId, status: 'HADIR', check_in_at: '2026-09-29T10:52:00Z' },
    { session_id: 'sess-course-2-5', student_id: studentId, status: 'ALPA' },
    { session_id: 'sess-course-2-6', student_id: studentId, status: 'HADIR', check_in_at: '2026-10-13T10:46:00Z' }
  );

  // Kelas 3: Hadir 1..6
  for (let w = 1; w <= 6; w++) {
    records.push({
      session_id: `sess-course-3-${w}`,
      student_id: studentId,
      status: w === 2 ? 'TERLAMBAT' : 'HADIR',
      check_in_at: '2026-09-09T13:35:00Z',
    });
  }

  // Kelas 4: Hadir 1..4, 6; Sakit pekan 5
  records.push(
    { session_id: 'sess-course-4-1', student_id: studentId, status: 'HADIR', check_in_at: '2026-09-10T08:02:00Z' },
    { session_id: 'sess-course-4-2', student_id: studentId, status: 'HADIR', check_in_at: '2026-09-17T08:01:00Z' },
    { session_id: 'sess-course-4-3', student_id: studentId, status: 'HADIR', check_in_at: '2026-09-24T08:04:00Z' },
    { session_id: 'sess-course-4-4', student_id: studentId, status: 'HADIR', check_in_at: '2026-10-01T08:03:00Z' },
    { session_id: 'sess-course-4-5', student_id: studentId, status: 'SAKIT' },
    { session_id: 'sess-course-4-6', student_id: studentId, status: 'HADIR', check_in_at: '2026-10-15T08:05:00Z' }
  );

  const assignments: RawAssignment[] = [
    // Tugas Kelas 1 Pekan 2 (dikumpulkan)
    { id: 'asg-demo-1', class_id: 'course-1', title: 'Tugas 01: Arsitektur App Router & Server Actions', due_at: '2026-09-20T16:59:00Z', close_at: '2026-09-21T16:59:00Z', status: 'PUBLISHED' },
    // Tugas Kelas 1 Pekan 4 (belum dikumpulkan -> memicu SEBAGIAN di Pekan 4)
    { id: 'asg-demo-2', class_id: 'course-1', title: 'Tugas 02: Implementasi RBAC & Middleware', due_at: '2026-10-04T16:59:00Z', close_at: '2026-10-05T16:59:00Z', status: 'PUBLISHED' },
    // Tugas Kelas 2 Pekan 6 (dikumpulkan)
    { id: 'asg-demo-3', class_id: 'course-2', title: 'Laporan Desain UML & Class Diagram Sistem', due_at: '2026-10-18T16:59:00Z', close_at: '2026-10-19T16:59:00Z', status: 'PUBLISHED' },
    // Tugas Kelas 3 Pekan 7 (pekan berjalan, menunggu)
    { id: 'asg-demo-4', class_id: 'course-3', title: 'Tugas 03: Heuristic Search & Algoritma A*', due_at: '2026-10-25T16:59:00Z', close_at: '2026-10-26T16:59:00Z', status: 'PUBLISHED' },
  ];

  const submissions: RawSubmission[] = [
    { assignment_id: 'asg-demo-1', student_id: studentId, status: 'SUBMITTED', submitted_at: '2026-09-19T14:00:00Z', is_late: false },
    { assignment_id: 'asg-demo-3', student_id: studentId, status: 'SUBMITTED', submitted_at: '2026-10-18T11:20:00Z', is_late: false },
  ];

  return buildSemesterWeave(
    {
      classes,
      sessions,
      records,
      assignments,
      submissions,
    },
    new Date('2026-10-23T03:00:00Z') // Pekan 7
  );
}
