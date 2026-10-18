'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import {
  buildDailyPriorities,
  getWibDateString,
  type DailyPriorityItem,
  type PriorityAssignment,
  type PriorityExam,
  type PriorityChapter,
  type DailyPrioritiesInput,
} from '@/lib/akademik/daily-priorities';

export interface ClassChapterItem {
  id: string;
  class_id: string;
  position: number;
  title: string;
  summary?: string | null;
  is_optional: boolean;
  pass_score?: number | null;
  target_date?: string | null;
  completion_rule: 'kuis' | 'materi';
  archived_at?: string | null;
  topics?: Array<{ id: string; name: string; level?: string }>;
  materials_count?: number;
  has_quiz?: boolean;
}

export interface ClassMapItem {
  id: string;
  position: number;
  title: string;
  summary?: string | null;
  is_optional: boolean;
  pass_score: number;
  target_date?: string | null;
  completion_rule: 'kuis' | 'materi';
  status: 'selesai' | 'terbuka' | 'terkunci';
  materials_count: number;
  materials_completed: number;
  quiz?: {
    id: string;
    title: string;
    duration_minutes: number;
    best_score?: number | null;
    attempts: number;
    is_passed: boolean;
  } | null;
  topics: Array<{
    id: string;
    name: string;
    level: 'belum_cukup_data' | 'perlu_latihan' | 'cukup' | 'kuat';
  }>;
  has_podcast: boolean;
  flashcards_due: number;
}

export interface ChapterDistributionItem {
  chapter_id: string;
  position: number;
  title: string;
  is_optional: boolean;
  target_date?: string | null;
  total_students: number;
  selesai_count: number;
  terbuka_count: number;
  terkunci_count: number;
}

export interface HardestTopicItem {
  topic_id: string;
  topic_name: string;
  chapter_title: string;
  student_count: number;
  correct_ratio: number;
}

export interface LaggingStudentItem {
  student_id: string;
  student_name: string;
  chapter_id: string;
  chapter_title: string;
  days_late: number;
  best_score?: number | null;
}

/**
 * Mengambil peta pulau kelas untuk mahasiswa
 */
export async function getClassMapAction(classId: string): Promise<ClassMapItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_class_map', { p_class_id: classId });
  if (error || !data) {
    return [];
  }
  return data as ClassMapItem[];
}

/**
 * Mengambil daftar bab kelas untuk editor dosen
 */
export async function listClassChaptersAction(classId: string): Promise<ClassChapterItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  const supabase = await createClient();
  const { data: chapters, error } = await supabase
    .from('class_chapters')
    .select('*, chapter_topics(id, name)')
    .eq('class_id', classId)
    .is('archived_at', null)
    .order('position', { ascending: true });

  if (error || !chapters) return [];

  return chapters.map((c: any) => ({
    id: c.id,
    class_id: c.class_id,
    position: c.position,
    title: c.title,
    summary: c.summary,
    is_optional: c.is_optional,
    pass_score: c.pass_score,
    target_date: c.target_date,
    completion_rule: c.completion_rule,
    archived_at: c.archived_at,
    topics: (c.chapter_topics || []).map((t: any) => ({ id: t.id, name: t.name })),
  }));
}

/**
 * Membuat bab baru oleh dosen
 */
export async function createClassChapterAction(payload: {
  class_id: string;
  title: string;
  summary?: string;
  is_optional?: boolean;
  pass_score?: number;
  target_date?: string;
  completion_rule?: 'kuis' | 'materi';
}): Promise<{ ok: boolean; message?: string; chapterId?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum terautentikasi' };

  const supabase = await createClient();

  // Hitung posisi berikutnya
  const { data: existing } = await supabase
    .from('class_chapters')
    .select('position')
    .eq('class_id', payload.class_id)
    .order('position', { ascending: false })
    .limit(1);

  const nextPos = (existing?.[0]?.position || 0) + 1;

  const { data, error } = await supabase
    .from('class_chapters')
    .insert({
      class_id: payload.class_id,
      position: nextPos,
      title: payload.title.trim(),
      summary: payload.summary?.trim() || null,
      is_optional: payload.is_optional ?? false,
      pass_score: payload.pass_score || null,
      target_date: payload.target_date || null,
      completion_rule: payload.completion_rule || 'kuis',
    })
    .select('id')
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/classes/${payload.class_id}`);
  return { ok: true, chapterId: data.id };
}

/**
 * Menambahkan topik ke bab
 */
export async function addChapterTopicAction(
  chapterId: string,
  classId: string,
  topicName: string
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const { error } = await supabase.from('chapter_topics').insert({
    chapter_id: chapterId,
    name: topicName.trim(),
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/classes/${classId}`);
  return { ok: true };
}

/**
 * Menghapus topik dari bab
 */
export async function deleteChapterTopicAction(
  topicId: string,
  classId: string
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const { error } = await supabase.from('chapter_topics').delete().eq('id', topicId);

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/classes/${classId}`);
  return { ok: true };
}

/**
 * Mengubah urutan bab (Up / Down)
 */
export async function reorderChaptersAction(
  classId: string,
  chapterId: string,
  direction: 'up' | 'down'
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const { data: chapters } = await supabase
    .from('class_chapters')
    .select('id, position')
    .eq('class_id', classId)
    .is('archived_at', null)
    .order('position', { ascending: true });

  if (!chapters || chapters.length < 2) return { ok: true };

  const idx = chapters.findIndex((c: any) => c.id === chapterId);
  if (idx < 0) return { ok: false, message: 'Bab tidak ditemukan' };

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= chapters.length) return { ok: true };

  const current = chapters[idx];
  const swapWith = chapters[swapIdx];

  // Gunakan posisi sementara jika ada constraint
  await supabase
    .from('class_chapters')
    .update({ position: -999 })
    .eq('id', current.id);

  await supabase
    .from('class_chapters')
    .update({ position: current.position })
    .eq('id', swapWith.id);

  await supabase
    .from('class_chapters')
    .update({ position: swapWith.position })
    .eq('id', current.id);

  revalidatePath(`/classes/${classId}`);
  return { ok: true };
}

/**
 * Mengambil sebaran progres mahasiswa per bab
 */
export async function getClassChapterDistributionAction(
  classId: string
): Promise<ChapterDistributionItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_class_chapter_distribution', {
    p_class_id: classId,
  });

  if (error || !data) return [];
  return data as ChapterDistributionItem[];
}

/**
 * Mengambil daftar 5 topik tersulit kelas (ambang >= 5 mahasiswa)
 */
export async function getHardestTopicsAction(classId: string): Promise<HardestTopicItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_hardest_topics', {
    p_class_id: classId,
  });

  if (error || !data) return [];
  return data as HardestTopicItem[];
}

/**
 * Mengambil daftar mahasiswa yang tertinggal pada bab dengan target_date yang sudah lewat
 */
export async function getLaggingStudentsAction(classId: string): Promise<LaggingStudentItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: chapters } = await supabase
    .from('class_chapters')
    .select('id, title, target_date')
    .eq('class_id', classId)
    .lt('target_date', today)
    .is('archived_at', null)
    .order('position', { ascending: true });

  if (!chapters || chapters.length === 0) return [];

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, profiles(full_name)')
    .eq('class_id', classId)
    .eq('status', 'ACTIVE');

  if (!enrollments || enrollments.length === 0) return [];

  const chapterIds = chapters.map((c) => c.id);
  const { data: progress } = await supabase
    .from('chapter_progress')
    .select('student_id, chapter_id, is_completed, best_score')
    .in('chapter_id', chapterIds);

  const progressMap = new Map<string, { is_completed: boolean; best_score: number | null }>();
  for (const p of (progress || []) as any[]) {
    progressMap.set(`${p.student_id}:${p.chapter_id}`, {
      is_completed: p.is_completed,
      best_score: p.best_score,
    });
  }

  const lagging: LaggingStudentItem[] = [];
  const nowMs = Date.now();

  for (const m of enrollments as any[]) {
    for (const c of chapters) {
      const prog = progressMap.get(`${m.student_id}:${c.id}`);
      if (!prog || !prog.is_completed) {
        const targetMs = new Date(c.target_date!).getTime();
        const daysLate = Math.max(1, Math.floor((nowMs - targetMs) / (1000 * 60 * 60 * 24)));
        lagging.push({
          student_id: m.student_id,
          student_name: m.profiles?.full_name || 'Mahasiswa',
          chapter_id: c.id,
          chapter_title: c.title,
          days_late: daysLate,
          best_score: prog?.best_score ?? null,
        });
        break;
      }
    }
  }

  return lagging;
}

/**
 * Dosen membuka pulau bab secara manual untuk satu mahasiswa
 */
export async function grantChapterUnlockOverrideAction(
  chapterId: string,
  studentId: string,
  classId: string,
  reason: string
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('grant_chapter_unlock_override', {
    p_chapter_id: chapterId,
    p_student_id: studentId,
    p_reason: reason,
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/classes/${classId}`);
  return { ok: true };
}

/**
 * Dosen mengingatkan mahasiswa yang terlambat menyelesaikan bab (rate limited 24h)
 */
export async function remindLaggingStudentAction(
  classId: string,
  studentId: string,
  chapterId: string
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('remind_lagging_student', {
    p_class_id: classId,
    p_student_id: studentId,
    p_chapter_id: chapterId,
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Mengambil dan mengubah status penanda fitur kelas (class_feature_flags)
 */
export async function getClassFeatureFlagsAction(
  classId: string
): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('class_feature_flags')
    .select('feature, enabled')
    .eq('class_id', classId);

  const res: Record<string, boolean> = {
    peta_pulau: false,
    flashcard: false,
    podcast: false,
    tukar_keahlian: false,
    rekap_semester: false,
  };

  for (const item of data || []) {
    res[item.feature] = item.enabled;
  }
  return res;
}

export async function toggleClassFeatureFlagAction(
  classId: string,
  feature: 'peta_pulau' | 'flashcard' | 'podcast' | 'tukar_keahlian' | 'rekap_semester',
  enabled: boolean
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const { error } = await supabase.from('class_feature_flags').upsert(
    {
      class_id: classId,
      feature,
      enabled,
      updated_by: user.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'class_id,feature' }
  );

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/classes/${classId}`);
  return { ok: true };
}

/**
 * Menyelesaikan percobaan kuis bab secara idempoten
 */
export async function finishChapterQuizAttemptAction(
  attemptId: string
): Promise<{ ok: boolean; score?: number; isPassed?: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('finish_chapter_quiz_attempt', {
    p_attempt_id: attemptId,
  });

  if (error) return { ok: false, message: error.message };
  return {
    ok: true,
    score: data.score,
    isPassed: data.is_passed,
  };
}

/**
 * Mengambil maksimal 5 butir Prioritas Hari Ini untuk mahasiswa
 */
export async function getDailyPrioritiesAction(): Promise<DailyPriorityItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  const supabase = await createClient();
  const todayWib = getWibDateString();

  // 1. Ambil dismissals hari ini
  const { data: dismissals } = await supabase
    .from('daily_priority_dismissals')
    .select('item_key')
    .eq('student_id', user.user.id)
    .eq('day', todayWib);

  const dismissedItemKeys = (dismissals || []).map((d: any) => d.item_key);

  // 2. Ambil kelas aktif mahasiswa
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('class_id, classes(id, title)')
    .eq('student_id', user.user.id)
    .eq('status', 'ACTIVE');

  const enrolledClassIds = (enrollments || []).map((e: any) => e.class_id).filter(Boolean);
  const classTitleMap = new Map<string, string>();
  for (const e of (enrollments || []) as any[]) {
    if (e.classes?.id && e.classes?.title) {
      classTitleMap.set(e.classes.id, e.classes.title);
    }
  }

  // 3. Ambil deadlines
  let assignmentsList: PriorityAssignment[] = [];
  if (enrolledClassIds.length > 0) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, class_id, title, due_at, submissions(id)')
      .in('class_id', enrolledClassIds)
      .order('due_at', { ascending: true });

    const nowTime = Date.now();
    assignmentsList = (assignments || []).map((a: any) => {
      const dueTime = new Date(a.due_at).getTime();
      return {
        id: a.id,
        classId: a.class_id,
        className: classTitleMap.get(a.class_id) || 'Kelas',
        title: a.title,
        effectiveDueDate: new Date(a.due_at),
        hasSubmission: Array.isArray(a.submissions) && a.submissions.length > 0,
        isOverdue: nowTime > dueTime,
        canSubmitLate: true,
      };
    });
  }

  // 4. Bab terbuka yang belum selesai
  let chaptersList: PriorityChapter[] = [];
  if (enrolledClassIds.length > 0) {
    const { data: chapters } = await supabase
      .from('class_chapters')
      .select('id, class_id, title, position, pass_score, target_date')
      .in('class_id', enrolledClassIds)
      .is('archived_at', null)
      .order('position', { ascending: true });

    if (chapters && chapters.length > 0) {
      const chapterIds = chapters.map((c) => c.id);
      const { data: progress } = await supabase
        .from('chapter_progress')
        .select('chapter_id, is_completed, best_score, attempts')
        .eq('student_id', user.user.id)
        .in('chapter_id', chapterIds);

      const progressMap = new Map<string, any>();
      for (const p of progress || []) {
        progressMap.set(p.chapter_id, p);
      }

      chaptersList = chapters.map((c: any) => {
        const prog = progressMap.get(c.id);
        return {
          id: c.id,
          classId: c.class_id,
          className: classTitleMap.get(c.class_id) || 'Kelas',
          title: c.title,
          isCompleted: prog?.is_completed ?? false,
          isUnlocked: true,
          targetDate: c.target_date ? new Date(c.target_date) : undefined,
          bestScore: prog?.best_score ?? undefined,
          passScore: c.pass_score ?? 70,
          attemptsCount: prog?.attempts ?? 0,
          hasStarted: (prog?.attempts ?? 0) > 0,
        };
      });
    }
  }

  return buildDailyPriorities({
    assignments: assignmentsList,
    exams: [],
    chapters: chaptersList,
    cardsDueCount: 0,
    dismissedItemKeys,
  });
}

/**
 * Menyembunyikan butir prioritas harian untuk hari ini
 */
export async function dismissDailyPriorityAction(
  itemKey: string
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const todayWib = getWibDateString();

  const { error } = await supabase.from('daily_priority_dismissals').insert({
    student_id: user.user.id,
    item_key: itemKey,
    day: todayWib,
  });

  if (error && error.code !== '23505') {
    return { ok: false, message: error.message };
  }

  revalidatePath('/student');
  return { ok: true };
}
