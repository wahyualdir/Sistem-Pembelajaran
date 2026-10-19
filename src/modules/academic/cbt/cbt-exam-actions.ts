'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { createNotification } from '@/modules/academic/actions';
import { isDemoMode, isFeatureFlagActive } from '@/lib/config/features';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { assertClassOwner, ClassAccessError } from '@/lib/auth/class-access';
import {
  quizStore,
  getQuizStore,
  type QuizQuestion,
  type QuizItem,
  type QuizAttempt,
} from '../quiz-store';
import {
  QUIZ_AUTHOR_ROLES,
  QUIZ_VIEW_ROLES,
  QUIZ_STAFF_ROLES,
  sanitizeQuizForRole,
} from './cbt-shared';
import { executeLiveCodeAction, evaluateEssayWithAiAction } from './cbt-grading-actions';

const createQuizSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().trim().min(3, 'Judul kuis minimal 3 karakter.').max(150),
  description: z.string().trim().max(2000).optional(),
  exam_type: z.enum(['KUIS', 'UTS', 'UAS', 'LATIHAN', 'REMEDIAL']).default('KUIS'),
  duration_minutes: z.coerce.number().int().min(5).max(300),
  due_at: z.string().datetime({ offset: true }),
  release_at: z.string().datetime({ offset: true }).optional().nullable(),
  proctoring_level: z.enum(['OFF', 'LIGHT', 'STANDARD', 'STRICT']).default('STANDARD'),
  max_violations: z.coerce.number().int().min(1).max(20).default(5),
  shuffle_questions: z.boolean().default(false),
  shuffle_options: z.boolean().default(false),
  require_fullscreen: z.boolean().default(true),
  block_copy_paste: z.boolean().default(true),
  require_attendance: z.boolean().default(false),
  passcode: z.string().trim().max(50).optional(),
  kkm: z.coerce.number().min(0).max(100).default(70),
  result_display: z.enum(['IMMEDIATE', 'AFTER_CLOSED', 'MANUAL']).default('IMMEDIATE'),
  questions: z.array(
    z.object({
      question_text: z.string().trim().min(3),
      question_type: z.enum([
        'MULTIPLE_CHOICE',
        'TRUE_FALSE',
        'SHORT_ANSWER',
        'MATCHING',
        'ORDERING',
        'ESSAY',
        'LIVE_CODING',
        'FILE_UPLOAD',
      ]),
      options: z.array(z.string().trim()).optional(),
      correct_answer_index: z.coerce.number().int().optional(),
      correct_answer_indices: z.array(z.coerce.number().int()).optional(),
      correct_boolean: z.boolean().optional(),
      correct_text: z.string().optional(),
      matching_pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
      ordering_items: z.array(z.string()).optional(),
      rubric: z.string().optional(),
      starter_code: z.string().optional(),
      programming_language: z.enum(['javascript', 'python', 'typescript', 'sql']).optional(),
      test_cases: z.array(z.object({ input: z.string(), expected_output: z.string(), is_hidden: z.boolean().optional() })).optional(),
      topic_tag: z.string().optional(),
      cpl_tag: z.string().optional(),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
      points: z.coerce.number().int().min(1).max(100),
      explanation: z.string().optional(),
    })
  ).min(1, 'Ujian/kuis harus memiliki minimal 1 soal.'),
});

// Create Quiz / Exam
export async function createQuizAction(input: unknown): Promise<ActionResponse<QuizItem>> {
  const rawQuestions = Array.isArray((input as any)?.questions) ? (input as any).questions : [];
  const hasUnapprovedAiDraft = rawQuestions.some(
    (q: any) =>
      q?.ai_draft_status === 'DRAFT' ||
      (q?.is_ai_generated === true && q?.ai_draft_status !== 'APPROVED')
  );
  if (hasUnapprovedAiDraft) {
    return {
      ok: false,
      error:
        'FORBIDDEN: Soal draf AI berstatus DRAFT tidak dapat dimasukkan ke ujian aktif sebelum ditinjau dan disetujui Dosen Pengampu.',
    };
  }

  const p = createQuizSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };

  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_AUTHOR_ROLES.includes(user.activeRole ?? '')) {
    return { ok: false, error: 'Aksi ini hanya dapat dilakukan oleh Dosen Pengampu atau Super Admin.' };
  }

  try {
    await assertClassOwner(p.data.class_id);
  } catch (err) {
    if (err instanceof ClassAccessError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const questionsWithIds: QuizQuestion[] = p.data.questions.map((q) => ({
    id: randomUUID(),
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options,
    correct_answer_index: q.correct_answer_index,
    correct_answer_indices: q.correct_answer_indices,
    correct_boolean: q.correct_boolean,
    correct_text: q.correct_text,
    matching_pairs: q.matching_pairs,
    ordering_items: q.ordering_items,
    rubric: q.rubric,
    starter_code: q.starter_code,
    programming_language: q.programming_language,
    test_cases: q.test_cases,
    topic_tag: q.topic_tag,
    cpl_tag: q.cpl_tag,
    difficulty: q.difficulty,
    points: q.points,
    explanation: q.explanation,
  }));

  const totalPoints = questionsWithIds.reduce((sum, q) => sum + q.points, 0);

  const quiz: QuizItem = {
    id: randomUUID(),
    class_id: p.data.class_id,
    title: p.data.title,
    description: p.data.description,
    exam_type: p.data.exam_type,
    duration_minutes: p.data.duration_minutes,
    due_at: p.data.due_at,
    questions: questionsWithIds,
    total_points: totalPoints,
    is_published: true,
    release_at: p.data.release_at ?? null,
    created_at: new Date().toISOString(),
    proctoring_level: p.data.proctoring_level,
    max_violations: p.data.max_violations,
    shuffle_questions: p.data.shuffle_questions,
    shuffle_options: p.data.shuffle_options,
    require_fullscreen: p.data.require_fullscreen,
    block_copy_paste: p.data.block_copy_paste,
    require_attendance: p.data.require_attendance,
    passcode: p.data.passcode,
    kkm: p.data.kkm,
    result_display: p.data.result_display,
    status: 'ACTIVE',
    attempts_allowed: 1,
  };

  if (isFeatureFlagActive('FF_PERSISTENCE_QUIZ') && (await checkSupabaseOnline())) {
    const supabase = await createClient();
    const { error } = await supabase.from('quizzes').insert({
      id: quiz.id,
      class_id: quiz.class_id,
      title: quiz.title,
      description: quiz.description ?? '',
      exam_type: quiz.exam_type ?? 'KUIS',
      duration_minutes: quiz.duration_minutes,
      end_time: quiz.due_at,
      is_published: quiz.is_published,
      proctoring_level: quiz.proctoring_level ?? 'STANDARD',
      max_violations: quiz.max_violations ?? 5,
      shuffle_questions: quiz.shuffle_questions ?? false,
      shuffle_options: quiz.shuffle_options ?? false,
      require_fullscreen: quiz.require_fullscreen ?? true,
      block_copy_paste: quiz.block_copy_paste ?? true,
      require_attendance: quiz.require_attendance ?? false,
      passcode: quiz.passcode ?? null,
      kkm: quiz.kkm ?? 70,
      result_display: quiz.result_display ?? 'IMMEDIATE',
      status: quiz.status ?? 'ACTIVE',
      total_points: quiz.total_points,
      created_by: user.user.id,
    });
    if (error) return { ok: false, error: error.message };
  } else if (!isDemoMode()) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  const currentStore = getQuizStore();
  currentStore.quizzes.push(quiz);
  if (currentStore.quizzes !== quizStore.quizzes) {
    quizStore.quizzes = currentStore.quizzes;
  }

  // Send in-app notification to students
  await createNotification({
    user_id: 'ALL_STUDENTS',
    type: 'EXAM',
    title: `Ujian Baru Dibuka: ${quiz.title}`,
    body: `Dosen telah membuka sesi ${quiz.exam_type ?? 'Ujian'}. Durasi: ${quiz.duration_minutes} menit.`,
    class_id: quiz.class_id,
  }).catch(() => {});

  try {
    revalidatePath('/classes/[id]', 'page');
  } catch {
    // Ignore outside Next.js request context (e.g. unit tests)
  }
  return { ok: true, data: quiz };
}

// List Quizzes in Class
export async function listClassQuizzesAction(classId: string): Promise<QuizItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_VIEW_ROLES.includes(user.activeRole ?? '')) {
    return [];
  }

  const currentStore = getQuizStore();
  const isStudent = user.activeRole === 'STUDENT';
  const now = new Date();

  return (currentStore.quizzes || [])
    .filter((q) => q.class_id === classId && (!isStudent || !q.release_at || new Date(q.release_at) <= now))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((q) => sanitizeQuizForRole(q, user.activeRole));
}

// Get Single Quiz Detail
export async function getQuizDetailAction(quizId: string): Promise<QuizItem | null> {
  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_VIEW_ROLES.includes(user.activeRole ?? '')) {
    return null;
  }

  const currentStore = getQuizStore();
  const quiz = (currentStore.quizzes || []).find((q) => q.id === quizId) ?? null;
  if (!quiz) return null;
  if (user.activeRole === 'STUDENT' && quiz.release_at && new Date(quiz.release_at) > new Date()) {
    return null;
  }
  return sanitizeQuizForRole(quiz, user.activeRole);
}

// Get My Quiz Attempt
export async function getMyQuizAttemptAction(quizId: string): Promise<QuizAttempt | null> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole === 'SYSTEM_ADMIN') return null;
  return quizStore.attempts.find((a) => a.quiz_id === quizId && a.student_id === user.user.id) ?? null;
}

// List All Attempts for an Exam
export async function listQuizAttemptsAction(quizId: string): Promise<QuizAttempt[]> {
  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_STAFF_ROLES.includes(user.activeRole ?? '')) {
    return [];
  }

  return quizStore.attempts
    .filter((a) => a.quiz_id === quizId)
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

// Submit Quiz Attempt (Supports all 8 question types)
export async function submitQuizAttemptAction(
  quizId: string,
  answers: Record<string, any>,
  violationsCount: number = 0
): Promise<ActionResponse<QuizAttempt>> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'STUDENT') {
    return { ok: false, error: 'Hanya mahasiswa peserta ujian yang dapat mengirimkan jawaban.' };
  }

  // Guard A3c: Dilarang mengirim jawaban atau menyelesaikan ujian selama impersonasi aktif
  if (user.isImpersonating) {
    return {
      ok: false,
      error: 'IMPERSONATION_RESTRICTED: Dilarang mengirim jawaban atau menyelesaikan ujian selama sesi impersonasi aktif.',
    };
  }

  const quiz = quizStore.quizzes.find((q) => q.id === quizId);
  if (!quiz) return { ok: false, error: 'Kuis/Ujian tidak ditemukan.' };

  // Check existing attempt
  const existing = quizStore.attempts.find((a) => a.quiz_id === quizId && a.student_id === user.user.id);
  if (existing) {
    return { ok: false, error: 'Anda sudah mengumpulkan ujian/kuis ini.' };
  }

  let calculatedScore = 0;
  let hasPendingManualReview = false;
  const aiGradingDrafts: Record<string, { ai_score: number; feedback: string; verified_by_lecturer: boolean }> = {};

  for (const q of quiz.questions) {
    const studentAns = answers[q.id];

    if (q.question_type === 'MULTIPLE_CHOICE') {
      if (studentAns !== undefined && Number(studentAns) === q.correct_answer_index) {
        calculatedScore += q.points;
      }
    } else if (q.question_type === 'TRUE_FALSE') {
      const boolAns = typeof studentAns === 'boolean' ? studentAns : studentAns === 'true' || studentAns === true;
      if (boolAns === q.correct_boolean) {
        calculatedScore += q.points;
      }
    } else if (q.question_type === 'SHORT_ANSWER') {
      if (
        typeof studentAns === 'string' &&
        q.correct_text &&
        studentAns.trim().toLowerCase() === q.correct_text.trim().toLowerCase()
      ) {
        calculatedScore += q.points;
      }
    } else if (q.question_type === 'LIVE_CODING') {
      if (typeof studentAns === 'string' && q.test_cases && q.test_cases.length > 0) {
        const evalRes = await executeLiveCodeAction(q.programming_language || 'javascript', studentAns, q.test_cases);
        const earned = Math.round(evalRes.scoreRatio * q.points);
        calculatedScore += earned;
      }
    } else if (q.question_type === 'ESSAY') {
      hasPendingManualReview = true;
      if (typeof studentAns === 'string' && studentAns.trim().length > 0) {
        const aiDraft = await evaluateEssayWithAiAction(studentAns, q.rubric);
        const aiPoints = Math.round(aiDraft.ai_score_ratio * q.points);
        aiGradingDrafts[q.id] = {
          ai_score: aiPoints,
          feedback: aiDraft.feedback,
          verified_by_lecturer: false,
        };
        // Temporarily include AI draft in tentative score
        calculatedScore += aiPoints;
      }
    } else {
      // MATCHING, ORDERING, FILE_UPLOAD
      hasPendingManualReview = true;
    }
  }

  const attempt: QuizAttempt = {
    id: randomUUID(),
    quiz_id: quizId,
    student_id: user.user.id,
    student_name: user.profile?.full_name ?? 'Mahasiswa',
    answers,
    score: Math.min(quiz.total_points, calculatedScore),
    max_score: quiz.total_points,
    is_graded: !hasPendingManualReview,
    submitted_at: new Date().toISOString(),
    violations_count: violationsCount,
    ai_grading_drafts: aiGradingDrafts,
  };

  if (isFeatureFlagActive('FF_PERSISTENCE_QUIZ') && (await checkSupabaseOnline())) {
    const supabase = await createClient();
    const { error } = await supabase.from('exam_attempts').insert({
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      student_id: attempt.student_id,
      student_name: attempt.student_name,
      finished_at: attempt.submitted_at,
      total_score: attempt.score,
      max_score: attempt.max_score,
      is_graded: attempt.is_graded,
      violations_count: attempt.violations_count ?? 0,
      status: 'SUBMITTED',
      answers_json: attempt.answers,
      ai_grading_drafts: attempt.ai_grading_drafts ?? {},
    });
    if (error) return { ok: false, error: error.message };
  } else if (!isDemoMode()) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  quizStore.attempts.push(attempt);

  // Update Live Status to SUBMITTED
  const examLive = (quizStore.liveStatus[quizId] ??= {});
  if (examLive[user.user.id]) {
    examLive[user.user.id].status = 'SUBMITTED';
  }

  revalidatePath('/classes/[id]', 'page');
  return { ok: true, data: attempt };
}

export async function getAllQuizzesAction(): Promise<QuizItem[]> {
  const c = await getCurrentUserWithRoles();
  if (!c || c.isNewAccount || !QUIZ_VIEW_ROLES.includes(c.activeRole ?? '')) return [];
  return quizStore.quizzes
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((q) => sanitizeQuizForRole(q, c.activeRole));
}

export async function getAllAttemptsAction(): Promise<QuizAttempt[]> {
  const c = await getCurrentUserWithRoles();
  if (!c || c.isNewAccount || !QUIZ_VIEW_ROLES.includes(c.activeRole ?? '')) return [];
  if (c.activeRole === 'STUDENT') {
    return quizStore.attempts.filter((a) => a.student_id === c.user.id);
  }
  return quizStore.attempts;
}
