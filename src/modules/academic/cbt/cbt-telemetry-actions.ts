'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { recordSystemAuditLog } from '@/lib/audit';
import { isDemoMode, isFeatureFlagActive } from '@/lib/config/features';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import {
  quizStore,
  type ExamEventType,
  type ExamEvent,
  type ExamStudentLiveStatus,
} from '../quiz-store';
import { isStudentViolationEvent, QUIZ_STAFF_ROLES } from './cbt-shared';

// Record Exam Event (Proctoring log)
export async function recordExamEventAction(input: {
  exam_id: string;
  attempt_id?: string;
  event_type: ExamEventType;
  duration_seconds?: number;
  details?: string;
}): Promise<ActionResponse<ExamEvent>> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'STUDENT') {
    return { ok: false, error: 'Silakan masuk sebagai mahasiswa peserta ujian terlebih dahulu.' };
  }

  // Hanya jenis event pelanggaran mahasiswa yang dapat dicatat lewat aksi ini
  if (!isStudentViolationEvent(input.event_type)) {
    return { ok: false, error: 'Jenis event bukan pelanggaran mahasiswa.' };
  }

  const event: ExamEvent = {
    id: randomUUID(),
    exam_id: input.exam_id,
    attempt_id: input.attempt_id,
    student_id: user.user.id,
    student_name: user.profile?.full_name ?? 'Mahasiswa',
    event_type: input.event_type,
    duration_seconds: input.duration_seconds,
    details: input.details,
    created_at: new Date().toISOString(),
  };

  if (isFeatureFlagActive('FF_PERSISTENCE_QUIZ') && (await checkSupabaseOnline())) {
    const supabase = await createClient();
    await supabase.from('exam_telemetry_events').insert({
      id: event.id,
      exam_id: event.exam_id,
      attempt_id: event.attempt_id ?? null,
      student_id: event.student_id,
      student_name: event.student_name,
      event_type: event.event_type,
      duration_seconds: event.duration_seconds ?? 0,
      details: event.details ?? null,
      client_timestamp: event.created_at,
    });
  }

  quizStore.events.push(event);

  // Update live status violation counter (HANYA untuk pelanggaran mahasiswa)
  const examLive = (quizStore.liveStatus[input.exam_id] ??= {});
  const studentLive = (examLive[user.user.id] ??= {
    student_id: user.user.id,
    student_name: user.profile?.full_name ?? 'Mahasiswa',
    status: 'IN_PROGRESS',
    progress_percent: 0,
    answered_count: 0,
    total_questions: 1,
    time_left_seconds: 3600,
    violations_count: 0,
  });

  studentLive.violations_count += 1;
  studentLive.last_event = event;

  // Check if strict violation limit exceeded
  const exam = quizStore.quizzes.find((q) => q.id === input.exam_id);
  if (exam && exam.proctoring_level === 'STRICT' && exam.max_violations) {
    if (studentLive.violations_count >= exam.max_violations) {
      studentLive.status = 'TERMINATED';
    }
  }

  return { ok: true, data: event };
}

// Panel Live: Get Realtime Status of Students
export async function getExamLiveStatusAction(examId: string): Promise<{
  students: ExamStudentLiveStatus[];
  events: ExamEvent[];
  stats: { total: number; in_progress: number; submitted: number; terminated: number; total_violations: number };
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_STAFF_ROLES.includes(user.activeRole ?? '')) {
    return {
      students: [],
      events: [],
      stats: { total: 0, in_progress: 0, submitted: 0, terminated: 0, total_violations: 0 },
    };
  }

  const studentsMap = quizStore.liveStatus[examId] ?? {};
  const students = Object.values(studentsMap);
  const events = quizStore.events
    .filter((e) => e.exam_id === examId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 50);

  const stats = {
    total: students.length,
    in_progress: students.filter((s) => s.status === 'IN_PROGRESS').length,
    submitted: students.filter((s) => s.status === 'SUBMITTED').length,
    terminated: students.filter((s) => s.status === 'TERMINATED').length,
    total_violations: students.reduce((sum, s) => sum + s.violations_count, 0),
  };

  return { students, events, stats };
}

// Panel Live: Lecturer Interventions
export async function lecturerInterventionAction(input: {
  exam_id: string;
  student_id: string;
  action_type: 'WARN' | 'ADD_TIME' | 'PAUSE' | 'RESUME' | 'TERMINATE' | 'RESET';
  reason?: string;
  value?: string | number;
}): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'LECTURER') {
    return { ok: false, error: 'Hanya dosen pengampu yang berwenang melakukan intervensi ujian.' };
  }

  // Alasan wajib diisi (minimal 3 karakter)
  const reasonText = (input.reason || String(input.value || '')).trim();
  if (!reasonText || reasonText.length < 3) {
    return { ok: false, error: 'Alasan intervensi ujian wajib diisi (minimal 3 karakter).' };
  }

  const dbQuizReady = isFeatureFlagActive('FF_PERSISTENCE_QUIZ') && (await checkSupabaseOnline());

  // Pengecekan server: di luar mode demo, tolak jika database telemetri belum aktif
  if (!isDemoMode() && !dbQuizReady) {
    return { ok: false, error: 'Penyimpanan telemetri intervensi ujian ke database permanen sedang dalam penyiapan Fase 3.' };
  }

  const examLive = quizStore.liveStatus[input.exam_id];
  if (!examLive || !examLive[input.student_id]) {
    return { ok: false, error: 'Status mahasiswa tidak aktif dalam sesi ini.' };
  }

  const st = examLive[input.student_id];
  let valBefore: string = '';
  let valAfter: string = '';

  if (input.action_type === 'WARN') {
    valBefore = st.warning_message || 'Tidak ada peringatan aktif';
    valAfter = String(input.value || reasonText);
    st.warning_message = valAfter;
  } else if (input.action_type === 'ADD_TIME') {
    const mins = Number(input.value || 5);
    valBefore = `${Math.round(st.time_left_seconds / 60)} menit tersisa`;
    st.extra_minutes = (st.extra_minutes || 0) + mins;
    st.time_left_seconds += mins * 60;
    valAfter = `${Math.round(st.time_left_seconds / 60)} menit tersisa (+${mins} menit)`;
  } else if (input.action_type === 'PAUSE') {
    valBefore = st.status;
    st.status = 'PAUSED';
    valAfter = 'PAUSED';
  } else if (input.action_type === 'RESUME') {
    valBefore = st.status;
    st.status = 'IN_PROGRESS';
    valAfter = 'IN_PROGRESS';
  } else if (input.action_type === 'TERMINATE') {
    valBefore = st.status;
    st.status = 'TERMINATED';
    valAfter = 'TERMINATED (Didiskualifikasi)';
  } else if (input.action_type === 'RESET') {
    valBefore = `${st.status}, pelanggaran: ${st.violations_count}`;
    st.status = 'NOT_STARTED';
    st.violations_count = 0;
    quizStore.attempts = quizStore.attempts.filter((a) => !(a.quiz_id === input.exam_id && a.student_id === input.student_id));
    valAfter = 'NOT_STARTED (Reset pengerjaan)';
  }

  // Catat event tersendiri LECTURER_INTERVENTION (TIDAK memakai event pelanggaran mahasiswa dan TIDAK menambah hitungan pelanggaran mahasiswa)
  const interventionEvent: ExamEvent = {
    id: randomUUID(),
    exam_id: input.exam_id,
    student_id: input.student_id,
    student_name: st.student_name,
    event_type: 'LECTURER_INTERVENTION',
    intervention_subtype: input.action_type,
    actor_id: user.user.id,
    actor_name: user.profile?.full_name ?? 'Dosen',
    actor_role: user.activeRole ?? 'LECTURER',
    reason: reasonText,
    value_before: valBefore,
    value_after: valAfter,
    details: `Intervensi Dosen (${user.profile?.full_name ?? 'Dosen'}): ${input.action_type}. Alasan: ${reasonText}`,
    created_at: new Date().toISOString(),
  };

  if (dbQuizReady) {
    const supabase = await createClient();
    await supabase.from('exam_proctor_interventions').insert({
      id: interventionEvent.id,
      exam_id: interventionEvent.exam_id,
      student_id: interventionEvent.student_id,
      student_name: interventionEvent.student_name,
      proctor_user_id: user.user.id,
      actor_name: interventionEvent.actor_name,
      action_type: input.action_type,
      reason: reasonText,
      value_before: valBefore,
      value_after: valAfter,
    });
  }

  quizStore.events.push(interventionEvent);

  // Catat ke Audit Log sistem (in-memory dan Supabase jika online)
  await recordSystemAuditLog({
    actorId: user.user.id,
    actorName: user.profile?.full_name ?? 'Dosen',
    actorRole: user.activeRole ?? 'LECTURER',
    action: `EXAM_INTERVENTION_${input.action_type}`,
    entityType: 'ExamStudentLiveStatus',
    entityId: `${input.exam_id}:${input.student_id}`,
    description: `Intervensi Pengawas Ujian (${input.action_type}) untuk ${st.student_name}. Alasan: ${reasonText}`,
    valueBefore: valBefore,
    valueAfter: valAfter,
    metadata: {
      exam_id: input.exam_id,
      student_id: input.student_id,
      action_type: input.action_type,
    },
  });

  revalidatePath('/classes/[id]', 'page');
  return { ok: true };
}
