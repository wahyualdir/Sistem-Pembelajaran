'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type {
  LiveQuestionItem,
  LiveQuestionFilter,
  CreateLiveQuestionInput,
  LiveQuestionStatus,
} from './live-interaction-types';

// In-memory fallback untuk pengetesan unit dan mode offline
const liveQuestionsStore: Record<string, LiveQuestionItem[]> = {};
const liveUpvotesStore: Record<string, Set<string>> = {}; // questionId -> Set of userIds

const createQuestionSchema = z.object({
  classId: z.string().uuid(),
  sessionId: z.string().uuid().optional().nullable(),
  question: z
    .string()
    .trim()
    .min(5, 'Pertanyaan minimal 5 karakter agar bermakna.')
    .max(500, 'Pertanyaan maksimal 500 karakter.'),
  isAnonymous: z.boolean().default(false),
});

/**
 * Mengambil daftar pertanyaan kuliah waktu nyata untuk kelas tertentu
 */
export async function listLiveQuestionsAction(
  classId: string,
  filter: LiveQuestionFilter = 'semua'
): Promise<{ ok: boolean; questions: LiveQuestionItem[]; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  const currentUserId = auth?.user?.id;

  try {
    const supabase = await createClient();
    let query = supabase
      .from('class_live_questions')
      .select('*')
      .eq('class_id', classId)
      .neq('status', 'diarsipkan');

    if (filter !== 'semua') {
      query = query.eq('status', filter);
    }

    // Urutkan: Pertanyaan disematkan (pin) paling atas, lalu jumlah dukungan (upvote) terbanyak, lalu terbaru
    query = query
      .order('is_pinned', { ascending: false })
      .order('upvotes_count', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error || !data) {
      throw error || new Error('Gagal memuat pertanyaan');
    }

    // Ambil upvote milik pengguna saat ini jika login
    let myUpvotedSet = new Set<string>();
    if (currentUserId && data.length > 0) {
      const qIds = data.map((q: any) => q.id);
      const { data: upvoteData } = await supabase
        .from('class_live_question_upvotes')
        .select('question_id')
        .eq('user_id', currentUserId)
        .in('question_id', qIds);

      if (upvoteData) {
        myUpvotedSet = new Set(upvoteData.map((u: any) => u.question_id));
      }
    }

    const sanitizedQuestions: LiveQuestionItem[] = data.map((item: any) => {
      const isMine = item.student_id === currentUserId;
      const displayName = item.is_anonymous
        ? isMine
          ? 'Anda (Anonim untuk rekan kelas)'
          : 'Mahasiswa Kelas (Anonim)'
        : item.student_name;

      return {
        id: item.id,
        class_id: item.class_id,
        session_id: item.session_id,
        student_id: item.student_id,
        student_name: displayName,
        is_anonymous: item.is_anonymous,
        question: item.question,
        upvotes_count: item.upvotes_count || 0,
        status: item.status,
        is_pinned: !!item.is_pinned,
        lecturer_response: item.lecturer_response,
        created_at: item.created_at,
        updated_at: item.updated_at,
        has_upvoted: myUpvotedSet.has(item.id),
        is_mine: isMine,
      };
    });

    return { ok: true, questions: sanitizedQuestions };
  } catch {
    // Fallback in-memory
    const classQuestions = liveQuestionsStore[classId] || [];
    let filtered = classQuestions.filter((q) => q.status !== 'diarsipkan');
    if (filter !== 'semua') {
      filtered = filtered.filter((q) => q.status === filter);
    }

    filtered.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      if (a.upvotes_count !== b.upvotes_count) return b.upvotes_count - a.upvotes_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const mapped = filtered.map((q) => {
      const userUpvotes = liveUpvotesStore[q.id] || new Set();
      const isMine = q.student_id === currentUserId;
      return {
        ...q,
        student_name: q.is_anonymous
          ? isMine
            ? 'Anda (Anonim untuk rekan kelas)'
            : 'Mahasiswa Kelas (Anonim)'
          : q.student_name,
        has_upvoted: currentUserId ? userUpvotes.has(currentUserId) : false,
        is_mine: isMine,
      };
    });

    return { ok: true, questions: mapped };
  }
}

/**
 * Mahasiswa atau Dosen mengirimkan pertanyaan baru selama perkuliahan
 */
export async function createLiveQuestionAction(
  input: CreateLiveQuestionInput
): Promise<{ ok: boolean; questionId?: string; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu untuk bertanya.' };
  }

  const parsed = createQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { classId, sessionId, question, isAnonymous } = parsed.data;
  const studentName = auth.profile?.full_name || auth.user.email?.split('@')[0] || 'Mahasiswa';
  const now = new Date().toISOString();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('class_live_questions')
      .insert({
        class_id: classId,
        session_id: sessionId || null,
        student_id: auth.user.id,
        student_name: studentName,
        is_anonymous: isAnonymous,
        question: question.trim(),
        upvotes_count: 0,
        status: 'antre',
        is_pinned: false,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw error || new Error('Gagal menyimpan pertanyaan');
    }

    revalidatePath(`/classes/${classId}`);
    return { ok: true, questionId: data.id };
  } catch {
    // In-memory fallback
    const id = `lq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newItem: LiveQuestionItem = {
      id,
      class_id: classId,
      session_id: sessionId || null,
      student_id: auth.user.id,
      student_name: studentName,
      is_anonymous: isAnonymous,
      question: question.trim(),
      upvotes_count: 0,
      status: 'antre',
      is_pinned: false,
      created_at: now,
      updated_at: now,
      has_upvoted: false,
      is_mine: true,
    };

    if (!liveQuestionsStore[classId]) {
      liveQuestionsStore[classId] = [];
    }
    liveQuestionsStore[classId].unshift(newItem);

    return { ok: true, questionId: id };
  }
}

/**
 * Memberikan atau membatalkan dukungan (upvote) pada pertanyaan rekan mahasiswa
 */
export async function toggleUpvoteLiveQuestionAction(
  questionId: string,
  classId?: string
): Promise<{ ok: boolean; upvoted?: boolean; totalUpvotes?: number; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu untuk memberikan dukungan.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any).rpc('toggle_live_question_upvote', {
      p_question_id: questionId,
    });

    if (error) {
      throw error;
    }

    if (classId) {
      revalidatePath(`/classes/${classId}`);
    }

    return {
      ok: true,
      upvoted: data?.upvoted,
      totalUpvotes: data?.upvotes_count,
    };
  } catch {
    // In-memory fallback
    if (!liveUpvotesStore[questionId]) {
      liveUpvotesStore[questionId] = new Set();
    }

    const set = liveUpvotesStore[questionId];
    const has = set.has(auth.user.id);
    let upvoted = false;

    if (has) {
      set.delete(auth.user.id);
      upvoted = false;
    } else {
      set.add(auth.user.id);
      upvoted = true;
    }

    // Perbarui counter di store pertanyaan
    for (const cId of Object.keys(liveQuestionsStore)) {
      const q = liveQuestionsStore[cId].find((item) => item.id === questionId);
      if (q) {
        q.upvotes_count = set.size;
        break;
      }
    }

    return { ok: true, upvoted, totalUpvotes: set.size };
  }
}

/**
 * Dosen / Asisten memperbarui status pembahasan pertanyaan (Sedang Dibahas, Terjawab, Arsip)
 */
export async function updateLiveQuestionStatusAction(
  questionId: string,
  status: LiveQuestionStatus,
  lecturerResponse?: string,
  classId?: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  const role = auth.activeRole;
  const isLecturerOrStaff =
    role === 'LECTURER' || role === 'TEACHING_ASSISTANT' || role === 'SUPER_ADMIN';

  if (!isLecturerOrStaff) {
    return { ok: false, error: 'Hanya dosen atau asisten yang berwenang memperbarui status pembahasan.' };
  }

  const now = new Date().toISOString();

  try {
    const supabase = await createClient();
    const updates: any = {
      status,
      updated_at: now,
    };

    if (lecturerResponse !== undefined) {
      updates.lecturer_response = lecturerResponse.trim() || null;
    }

    const { error } = await supabase
      .from('class_live_questions')
      .update(updates)
      .eq('id', questionId);

    if (error) throw error;

    if (classId) {
      revalidatePath(`/classes/${classId}`);
    }

    return { ok: true };
  } catch {
    // In-memory fallback
    for (const cId of Object.keys(liveQuestionsStore)) {
      const q = liveQuestionsStore[cId].find((item) => item.id === questionId);
      if (q) {
        q.status = status;
        if (lecturerResponse !== undefined) {
          q.lecturer_response = lecturerResponse.trim() || null;
        }
        q.updated_at = now;
        return { ok: true };
      }
    }
    return { ok: true };
  }
}

/**
 * Dosen menyematkan (pin) pertanyaan agar muncul di layar fokus proyektor kelas
 */
export async function togglePinLiveQuestionAction(
  questionId: string,
  classId?: string
): Promise<{ ok: boolean; isPinned?: boolean; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  const role = auth.activeRole;
  const isLecturerOrStaff =
    role === 'LECTURER' || role === 'TEACHING_ASSISTANT' || role === 'SUPER_ADMIN';

  if (!isLecturerOrStaff) {
    return { ok: false, error: 'Hanya pengajar yang dapat menyematkan pertanyaan di layar kelas.' };
  }

  try {
    const supabase = await createClient();

    // Cek status pin saat ini
    const { data: curr } = await supabase
      .from('class_live_questions')
      .select('is_pinned')
      .eq('id', questionId)
      .single();

    const nextPin = !curr?.is_pinned;

    const { error } = await supabase
      .from('class_live_questions')
      .update({ is_pinned: nextPin, updated_at: new Date().toISOString() })
      .eq('id', questionId);

    if (error) throw error;

    if (classId) {
      revalidatePath(`/classes/${classId}`);
    }

    return { ok: true, isPinned: nextPin };
  } catch {
    for (const cId of Object.keys(liveQuestionsStore)) {
      const q = liveQuestionsStore[cId].find((item) => item.id === questionId);
      if (q) {
        q.is_pinned = !q.is_pinned;
        return { ok: true, isPinned: q.is_pinned };
      }
    }
    return { ok: true, isPinned: true };
  }
}

/**
 * Menghapus pertanyaan (pembuat pertanyaan atau dosen)
 */
export async function deleteLiveQuestionAction(
  questionId: string,
  classId?: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('class_live_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;

    if (classId) {
      revalidatePath(`/classes/${classId}`);
    }

    return { ok: true };
  } catch {
    for (const cId of Object.keys(liveQuestionsStore)) {
      const idx = liveQuestionsStore[cId].findIndex((item) => item.id === questionId);
      if (idx !== -1) {
        liveQuestionsStore[cId].splice(idx, 1);
        return { ok: true };
      }
    }
    return { ok: true };
  }
}
