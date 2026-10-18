'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  sanitizeSkillExchangeContent,
  isSkillExchangeBlackedOut,
  type ActiveAssessmentItem,
} from '@/lib/akademik/skill-exchange';

export interface SkillRequestItem {
  id: string;
  class_id: string;
  class_title: string;
  chapter_id: string;
  chapter_title: string;
  topic_id?: string | null;
  topic_name?: string | null;
  student_id: string;
  student_name: string;
  title: string;
  description: string;
  status: 'terbuka' | 'terjawab' | 'ditutup';
  created_at: string;
  response_count: number;
  responses?: SkillResponseItem[];
}

export interface SkillResponseItem {
  id: string;
  request_id: string;
  responder_id: string;
  responder_name: string;
  content: string;
  is_accepted: boolean;
  created_at: string;
}

/**
 * Memeriksa apakah kelas sedang mengalami blackout penilaian (UTS, UAS, kuis bernilai aktif)
 */
export async function checkClassBlackoutAction(classId: string): Promise<{
  isBlocked: boolean;
  activeExamTitle?: string;
  reason?: string;
}> {
  const supabase = await createClient();

  // Ambil kuis bernilai yang sedang terbuka
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, is_active, due_at')
    .eq('class_id', classId)
    .eq('is_active', true);

  const assessments: ActiveAssessmentItem[] = (quizzes || []).map((q: any) => ({
    id: q.id,
    title: q.title,
    isOpen: q.is_active,
    isGraded: true,
    closesAt: q.due_at,
  }));

  return isSkillExchangeBlackedOut(assessments, new Date());
}

/**
 * Mengambil daftar permohonan bantuan Tukar Keahlian pada suatu kelas
 */
export async function listSkillRequestsAction(
  classId: string,
  filter?: 'all' | 'terbuka' | 'terjawab'
): Promise<SkillRequestItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  const supabase = await createClient();

  let query = supabase
    .from('skill_requests')
    .select(`
      id,
      class_id,
      chapter_id,
      topic_id,
      student_id,
      title,
      description,
      status,
      created_at,
      profiles!skill_requests_student_id_fkey (full_name),
      classes!inner (title),
      class_chapters!inner (title),
      chapter_topics (name),
      skill_responses (
        id,
        request_id,
        responder_id,
        content,
        is_accepted,
        created_at,
        profiles!skill_responses_responder_id_fkey (full_name)
      )
    `)
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (filter && filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((r: any) => ({
    id: r.id,
    class_id: r.class_id,
    class_title: r.classes?.title || 'Kelas',
    chapter_id: r.chapter_id,
    chapter_title: r.class_chapters?.title || 'Bab',
    topic_id: r.topic_id,
    topic_name: r.chapter_topics?.name || null,
    student_id: r.student_id,
    student_name: r.profiles?.full_name || 'Mahasiswa',
    title: r.title,
    description: r.description,
    status: r.status,
    created_at: r.created_at,
    response_count: (r.skill_responses || []).length,
    responses: (r.skill_responses || []).map((resp: any) => ({
      id: resp.id,
      request_id: resp.request_id,
      responder_id: resp.responder_id,
      responder_name: resp.profiles?.full_name || 'Rekan Mahasiswa',
      content: resp.content,
      is_accepted: resp.is_accepted,
      created_at: resp.created_at,
    })),
  }));
}

/**
 * Membuat permohonan bantuan baru
 */
export async function createSkillRequestAction(payload: {
  classId: string;
  chapterId: string;
  topicId?: string;
  title: string;
  description: string;
}): Promise<{ ok: boolean; message?: string; requestId?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  // 1. Cek blackout ujian aktif
  const blackout = await checkClassBlackoutAction(payload.classId);
  if (blackout.isBlocked) {
    return { ok: false, message: blackout.reason };
  }

  // 2. Sanitasi konten (larangan URL & link luar)
  const titleSan = sanitizeSkillExchangeContent(payload.title);
  if (!titleSan.isValid) {
    return { ok: false, message: `Judul tidak valid: ${titleSan.error}` };
  }

  const descSan = sanitizeSkillExchangeContent(payload.description);
  if (!descSan.isValid) {
    return { ok: false, message: `Deskripsi tidak valid: ${descSan.error}` };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('skill_requests')
    .insert({
      class_id: payload.classId,
      chapter_id: payload.chapterId,
      topic_id: payload.topicId || null,
      student_id: user.user.id,
      title: titleSan.sanitized,
      description: descSan.sanitized,
      status: 'terbuka',
    })
    .select('id')
    .single();

  if (error) return { ok: false, message: error.message };

  revalidatePath('/skill-exchange');
  return { ok: true, requestId: data.id };
}

/**
 * Mengirimkan jawaban bantuan rekan
 */
export async function respondToSkillRequestAction(payload: {
  requestId: string;
  classId: string;
  content: string;
}): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  // 1. Cek blackout ujian aktif
  const blackout = await checkClassBlackoutAction(payload.classId);
  if (blackout.isBlocked) {
    return { ok: false, message: blackout.reason };
  }

  // 2. Sanitasi konten
  const sanitized = sanitizeSkillExchangeContent(payload.content);
  if (!sanitized.isValid) {
    return { ok: false, message: sanitized.error };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('skill_responses').insert({
    request_id: payload.requestId,
    responder_id: user.user.id,
    content: sanitized.sanitized,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath('/skill-exchange');
  return { ok: true };
}

/**
 * Pemohon menerima jawaban yang membantu (Memberikan XP kepada rekan pembantu)
 */
export async function acceptSkillResponseAction(
  responseId: string
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();

  const { error } = await supabase.rpc('accept_skill_response', {
    p_response_id: responseId,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath('/skill-exchange');
  return { ok: true };
}

/**
 * Melaporkan konten jawaban atau pertanyaan yang melanggar integritas
 */
export async function reportSkillContentAction(payload: {
  requestId?: string;
  responseId?: string;
  reason: string;
}): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();

  const { error } = await supabase.from('skill_reports').insert({
    request_id: payload.requestId || null,
    response_id: payload.responseId || null,
    reporter_id: user.user.id,
    reason: payload.reason.trim(),
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
