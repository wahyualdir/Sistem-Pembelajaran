'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

const createPollSchema = z.object({
  classId: z.string().uuid(),
  sessionId: z.string().uuid().optional().nullable(),
  question: z.string().trim().min(3, 'Pertanyaan minimal 3 karakter').max(500),
  kind: z.enum(['single', 'multiple', 'scale', 'text']),
  options: z.array(z.object({ id: z.string(), label: z.string() })).optional().nullable(),
  isAnonymous: z.boolean().default(true),
  isQuiz: z.boolean().default(false),
  correctOptionIds: z.array(z.string()).optional().nullable(),
});

export async function createLivePollAction(input: unknown) {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'TEACHING_ASSISTANT' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Hanya dosen pengampu atau asisten yang dapat membuat polling.' };
  }

  const parsed = createPollSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { classId, sessionId, question, kind, options, isAnonymous, isQuiz, correctOptionIds } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('live_polls')
    .insert({
      class_id: classId,
      session_id: sessionId || null,
      created_by: user.user.id,
      question,
      kind,
      options: options || null,
      is_anonymous: isAnonymous,
      is_quiz: isQuiz,
      correct_option_ids: correctOptionIds || null,
      status: 'draf',
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || 'Gagal membuat polling.' };
  }

  revalidatePath(`/classes/${classId}`);
  return { ok: true, pollId: data.id };
}

export async function openPollAction(pollId: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Akses ditolak.' };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('live_polls')
    .update({
      status: 'buka',
      opened_at: now,
    })
    .eq('id', pollId)
    .select('class_id')
    .single();

  if (error || !data) return { ok: false, error: 'Gagal membuka polling.' };

  revalidatePath(`/classes/${data.class_id}`);
  return { ok: true };
}

export async function closePollAction(pollId: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Akses ditolak.' };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('live_polls')
    .update({
      status: 'tutup',
      closed_at: now,
    })
    .eq('id', pollId)
    .select('class_id')
    .single();

  if (error || !data) return { ok: false, error: 'Gagal menutup polling.' };

  revalidatePath(`/classes/${data.class_id}`);
  return { ok: true };
}

export async function submitPollVoteAction(pollId: string, answer: any) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  const supabase = await createClient();

  const { data, error } = await (supabase as any).rpc('submit_poll_vote', {
    p_poll_id: pollId,
    p_answer: answer,
  });

  if (error) {
    return { ok: false, error: error.message || 'Gagal mengirim jawaban polling.' };
  }

  return { ok: true, data };
}

export async function getPollResultsAction(pollId: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  const supabase = await createClient();

  const { data, error } = await (supabase as any).rpc('get_poll_results', {
    p_poll_id: pollId,
  });

  if (error) {
    return { ok: false, error: error.message || 'Gagal mengambil hasil polling.' };
  }

  return { ok: true, results: data };
}

export async function listClassPollsAction(classId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('live_polls')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (error || !data) return { ok: true, polls: [] };

  return { ok: true, polls: data };
}
