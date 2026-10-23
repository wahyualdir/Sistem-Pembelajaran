'use server';

import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
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
 * - Bila offline atau non-student: mengembalikan data kosong jujur tanpa error.
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

    // 2. Periksa status Supabase
    const isOnline = await checkSupabaseOnline();
    if (!isOnline) {
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
