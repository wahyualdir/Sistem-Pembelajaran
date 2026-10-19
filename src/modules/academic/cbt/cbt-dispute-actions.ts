'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { recordSystemAuditLog } from '@/lib/audit';
import { isDemoMode, isFeatureFlagActive } from '@/lib/config/features';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { quizStore, type ExamDispute } from '../quiz-store';
import { QUIZ_VIEW_ROLES } from './cbt-shared';

// Grade Dispute: Submit Dispute by Student
export async function submitExamDisputeAction(attemptId: string, reason: string): Promise<ActionResponse<ExamDispute>> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'STUDENT') {
    return { ok: false, error: 'Hanya mahasiswa peserta ujian yang dapat mengajukan keberatan nilai.' };
  }

  const dbDisputesReady = isFeatureFlagActive('FF_PERSISTENCE_DISPUTES') && (await checkSupabaseOnline());
  if (!isDemoMode() && !dbDisputesReady) {
    return { ok: false, error: 'Penyimpanan keberatan nilai ke database permanen sedang dalam penyiapan Fase 3.' };
  }

  const attempt = quizStore.attempts.find((a) => a.id === attemptId);
  if (!attempt && isDemoMode()) return { ok: false, error: 'Pengerjaan tidak ditemukan.' };

  const dispute: ExamDispute = {
    id: randomUUID(),
    attempt_id: attemptId,
    exam_id: attempt?.quiz_id ?? '00000000-0000-0000-0000-000000000000',
    student_id: user.user.id,
    student_name: user.profile?.full_name ?? 'Mahasiswa',
    reason: reason.trim(),
    status: 'PENDING',
    submitted_at: new Date().toISOString(),
  };

  if (dbDisputesReady) {
    const supabase = await createClient();
    const { error } = await supabase.from('exam_disputes').insert({
      id: dispute.id,
      attempt_id: dispute.attempt_id,
      exam_id: dispute.exam_id,
      student_id: dispute.student_id,
      student_name: dispute.student_name,
      reason: dispute.reason,
      status: dispute.status,
      submitted_at: dispute.submitted_at,
    });
    if (error) return { ok: false, error: error.message };
  }

  quizStore.disputes.push(dispute);
  if (attempt) attempt.dispute = dispute;

  revalidatePath('/classes/[id]', 'page');
  return { ok: true, data: dispute };
}

// Grade Dispute: Resolve by Lecturer
export async function resolveExamDisputeAction(input: {
  dispute_id: string;
  status: 'APPROVED' | 'REJECTED';
  lecturer_note?: string;
  score_adjustment?: number;
}): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'LECTURER') {
    return { ok: false, error: 'Hanya dosen pengampu yang berwenang menyelesaikan keberatan nilai.' };
  }

  const dbDisputesReady = isFeatureFlagActive('FF_PERSISTENCE_DISPUTES') && (await checkSupabaseOnline());
  if (!isDemoMode() && !dbDisputesReady) {
    return { ok: false, error: 'Penyelesaian keberatan nilai ke database permanen sedang dalam penyiapan Fase 3.' };
  }

  const dispute = quizStore.disputes.find((d) => d.id === input.dispute_id);
  if (!dispute && isDemoMode()) return { ok: false, error: 'Keberatan nilai tidak ditemukan.' };

  const note = (input.lecturer_note || '').trim();
  if (note.length < 3) {
    return { ok: false, error: 'Catatan/alasan tanggapan wajib diisi minimal 3 karakter.' };
  }

  const resolvedAt = new Date().toISOString();
  if (dbDisputesReady) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('exam_disputes')
      .update({
        status: input.status,
        lecturer_feedback: note,
        adjusted_points: input.score_adjustment ?? null,
        resolved_at: resolvedAt,
        updated_at: resolvedAt,
      })
      .eq('id', input.dispute_id);
    if (error) return { ok: false, error: error.message };
  }

  let oldScore: number | undefined;
  let newScore: number | undefined;

  if (dispute) {
    dispute.status = input.status;
    dispute.lecturer_note = note;
    dispute.score_adjustment = input.score_adjustment;
    dispute.resolved_at = resolvedAt;

    if (input.status === 'APPROVED' && input.score_adjustment) {
      const attempt = quizStore.attempts.find((a) => a.id === dispute.attempt_id);
      if (attempt) {
        oldScore = attempt.score;
        attempt.score = Math.min(attempt.max_score, Math.max(0, attempt.score + input.score_adjustment));
        newScore = attempt.score;
      }
    }
  }

  // Audit Log
  await recordSystemAuditLog({
    actorId: user.user.id,
    actorName: user.profile?.full_name ?? 'Dosen',
    actorRole: 'LECTURER',
    action: `EXAM_DISPUTE_${input.status}`,
    entityType: 'ExamDispute',
    entityId: dispute?.id ?? input.dispute_id,
    description: `Tanggapan Sengketa Nilai Mahasiswa (${input.status}): ${dispute?.student_name ?? 'Mahasiswa'}. Catatan: ${note}`,
    valueBefore: oldScore !== undefined ? String(oldScore) : null,
    valueAfter: newScore !== undefined ? String(newScore) : null,
    metadata: {
      attempt_id: dispute?.attempt_id,
      score_adjustment: input.score_adjustment,
    },
  });

  revalidatePath('/classes/[id]', 'page');
  revalidatePath('/analytics', 'page');
  return { ok: true };
}

// Grade Dispute: List Disputes for Lecturer / Student
export async function listExamDisputesAction(): Promise<ExamDispute[]> {
  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_VIEW_ROLES.includes(user.activeRole ?? '')) return [];
  if (user.activeRole === 'STUDENT') {
    return (quizStore.disputes || []).filter((d) => d.student_id === user.user.id);
  }
  return quizStore.disputes || [];
}
