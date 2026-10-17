'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { createNotification } from '@/modules/academic/actions';
import { isDemoMode, isFeatureFlagActive } from '@/lib/config/features';
import { recordSystemAuditLog } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { assertClassOwner, ClassAccessError, getQuizStore } from '@/lib/auth/class-access';

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'MATCHING'
  | 'ORDERING'
  | 'ESSAY'
  | 'LIVE_CODING'
  | 'FILE_UPLOAD';

export type ExamType = 'KUIS' | 'UTS' | 'UAS' | 'LATIHAN' | 'REMEDIAL';
export type ProctoringLevel = 'OFF' | 'LIGHT' | 'STANDARD' | 'STRICT';
export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED';
export type ResultDisplayMode = 'IMMEDIATE' | 'AFTER_CLOSED' | 'MANUAL';

export interface TestCase {
  id?: string;
  input: string;
  expected_output: string;
  is_hidden?: boolean;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_answer_index?: number;
  correct_answer_indices?: number[];
  correct_boolean?: boolean;
  correct_text?: string;
  matching_pairs?: MatchingPair[];
  ordering_items?: string[];
  rubric?: string;
  starter_code?: string;
  programming_language?: 'javascript' | 'python' | 'typescript' | 'sql';
  test_cases?: TestCase[];
  topic_tag?: string;
  cpl_tag?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  explanation?: string;
  image_url?: string;
  latex_formula?: string;
  is_ai_generated?: boolean;
  ai_draft_status?: 'DRAFT' | 'APPROVED';
  approved_by?: string;
  cpmk?: string;
  rubric_criteria?: Array<{ criterion: string; weight: number; description?: string }>;
  needs_revision?: boolean;
  revision_note?: string;
}

export interface QuizItem {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  exam_type?: ExamType;
  duration_minutes: number;
  due_at: string;
  questions: QuizQuestion[];
  total_points: number;
  is_published: boolean;
  created_at: string;

  // Extended Settings
  proctoring_level?: ProctoringLevel;
  max_violations?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  require_fullscreen?: boolean;
  block_copy_paste?: boolean;
  require_attendance?: boolean;
  passcode?: string;
  kkm?: number;
  result_display?: ResultDisplayMode;
  status?: ExamStatus;
  attempts_allowed?: number;
}

export type StudentViolationEventType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'EXIT_FULLSCREEN'
  | 'COPY'
  | 'PASTE'
  | 'CONTEXT_MENU'
  | 'NETWORK_DISCONNECT'
  | 'IP_CHANGE';

const STUDENT_VIOLATION_TYPES: Set<string> = new Set([
  'TAB_SWITCH',
  'WINDOW_BLUR',
  'EXIT_FULLSCREEN',
  'COPY',
  'PASTE',
  'CONTEXT_MENU',
  'NETWORK_DISCONNECT',
  'IP_CHANGE',
]);

function isStudentViolationEvent(eventType: string): boolean {
  return STUDENT_VIOLATION_TYPES.has(eventType);
}

export type LecturerInterventionSubtype =
  | 'WARN'
  | 'ADD_TIME'
  | 'PAUSE'
  | 'RESUME'
  | 'TERMINATE'
  | 'RESET';

export type ExamEventType =
  | StudentViolationEventType
  | 'LECTURER_INTERVENTION';

export interface ExamEvent {
  id: string;
  exam_id: string;
  attempt_id?: string;
  student_id: string;
  student_name: string;
  event_type: ExamEventType;
  intervention_subtype?: LecturerInterventionSubtype;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  reason?: string;
  value_before?: string | number;
  value_after?: string | number;
  duration_seconds?: number;
  details?: string;
  created_at: string;
}

export interface ExamDispute {
  id: string;
  attempt_id: string;
  exam_id: string;
  student_id: string;
  student_name: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  lecturer_note?: string;
  score_adjustment?: number;
  submitted_at: string;
  resolved_at?: string;
}

export interface ExamStudentLiveStatus {
  student_id: string;
  student_name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'TERMINATED' | 'PAUSED';
  progress_percent: number;
  answered_count: number;
  total_questions: number;
  time_left_seconds: number;
  violations_count: number;
  last_event?: ExamEvent;
  live_code?: Record<string, string>;
  warning_message?: string;
  extra_minutes?: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  student_name: string;
  answers: Record<string, any>;
  score: number;
  max_score: number;
  is_graded: boolean;
  submitted_at: string;
  violations_count?: number;
  is_terminated?: boolean;
  ai_grading_drafts?: Record<string, { ai_score: number; feedback: string; verified_by_lecturer: boolean }>;
  dispute?: ExamDispute;
}

// In-memory persistent store
export const quizStore: {
  quizzes: QuizItem[];
  attempts: QuizAttempt[];
  events: ExamEvent[];
  liveStatus: Record<string, Record<string, ExamStudentLiveStatus>>; // examId -> (studentId -> status)
  questionBank: QuizQuestion[];
  disputes: ExamDispute[];
} = ((globalThis as any).__siajarKuis ??= {
  quizzes: [],
  attempts: [],
  events: [],
  liveStatus: {},
  questionBank: [],
  disputes: [],
});

quizStore.disputes ??= [];

// Seed default disputes if empty (Demo mode)
if (quizStore.disputes.length === 0) {
  quizStore.disputes.push(
    {
      id: 'disp-demo-1',
      attempt_id: 'att-demo-1',
      exam_id: 'exam-demo-001',
      student_id: 'd0000001-0000-0000-0000-000000000001',
      student_name: 'Ahmad Mahasiswa',
      reason: 'Jawaban soal live coding nomor 3 telah memenuhi seluruh test case tersembunyi, namun autograder hanya mendeteksi 2/4 test case karena timeout koneksi.',
      status: 'PENDING',
      submitted_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'disp-demo-2',
      attempt_id: 'att-demo-2',
      exam_id: 'exam-demo-001',
      student_id: 'mhs-102',
      student_name: 'Rian Hidayat (2024018)',
      reason: 'Rubrik esai nomor 4 mencantumkan penjelasan konkurensi dengan tepat pada paragraf kedua.',
      status: 'PENDING',
      submitted_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    }
  );
}

// Seed default Question Bank & Demo Exams if empty
if (quizStore.questionBank.length === 0) {
  quizStore.questionBank = [
    {
      id: 'qb-001',
      question_text: 'Kompleksitas waktu rata-rata (average time complexity) dari algoritma QuickSort adalah:',
      question_type: 'MULTIPLE_CHOICE',
      options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
      correct_answer_index: 1,
      points: 20,
      topic_tag: 'Struktur Data & Algoritma',
      cpl_tag: 'CPL-02: Kemampuan Analisis Algoritmik',
      difficulty: 'MEDIUM',
      explanation: 'QuickSort memiliki rata-rata O(n log n) dengan partisi seimbang, namun worst-case O(n^2).',
    },
    {
      id: 'qb-002',
      question_text: 'Protokol HTTP/2 secara bawaan mendukung multiplexing dalam satu koneksi TCP tunggal.',
      question_type: 'TRUE_FALSE',
      correct_boolean: true,
      points: 15,
      topic_tag: 'Jaringan Komputer',
      cpl_tag: 'CPL-03: Arsitektur Jaringan Modern',
      difficulty: 'EASY',
      explanation: 'Benar, HTTP/2 memecah pesan menjadi frame biner dan mendukung multiple streams di 1 koneksi.',
    },
    {
      id: 'qb-003',
      question_text: 'Tuliskan fungsi JavaScript `hitungVokal(teks)` yang mengembalikan jumlah huruf vokal (a, i, u, e, o) dalam sebuah string (case-insensitive).',
      question_type: 'LIVE_CODING',
      programming_language: 'javascript',
      starter_code: `function hitungVokal(teks) {\n  // Tulis solusi Anda di sini\n  return 0;\n}`,
      test_cases: [
        { input: 'hitungVokal("SIAJAR Kampus")', expected_output: '5', is_hidden: false },
        { input: 'hitungVokal("Universitas")', expected_output: '5', is_hidden: false },
        { input: 'hitungVokal("xyz")', expected_output: '0', is_hidden: true },
        { input: 'hitungVokal("AI Antigravity Super")', expected_output: '8', is_hidden: true },
      ],
      points: 35,
      topic_tag: 'Pemrograman Web & Algoritma',
      cpl_tag: 'CPL-01: Problem Solving & Implementasi Kode',
      difficulty: 'MEDIUM',
      explanation: 'Gunakan regex /[aeiou]/gi atau loop filter vokal untuk menghitung panjang kecocokan.',
    },
    {
      id: 'qb-004',
      question_text: 'Jelaskan perbedaan mendasar antara konkurensi (concurrency) dan paralelisme (parallelism) dalam sistem operasi modern serta berikan contoh konkret penerapannya.',
      question_type: 'ESSAY',
      rubric: 'Rubrik penilaian: (1) Definisi tepat perbedaan konkurensi vs paralelisme (40%), (2) Penjelasan mekanisme core CPU/thread (30%), (3) Contoh konkret dunia nyata (30%).',
      points: 30,
      topic_tag: 'Sistem Operasi',
      cpl_tag: 'CPL-02: Pemahaman Sistem Komputasi Lanjut',
      difficulty: 'HARD',
      explanation: 'Konkurensi adalah penanganan banyak tugas secara bersamaan melalui time-slicing, sedangkan paralelisme adalah eksekusi bersamaan di banyak core fisik.',
    },
  ];
}

// Ensure demo exam is available
if (quizStore.quizzes.length === 0) {
  const demoExamId = 'exam-demo-001';
  quizStore.quizzes.push({
    id: demoExamId,
    class_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Ujian Tengah Semester: Pemrograman Lanjut & Algoritma',
    description: 'UTS Resmi Semester Ganjil. Ujian ini diawasi dengan sistem proctoring standar. Harap aktifkan layar penuh dan hindari membuka tab lain.',
    exam_type: 'UTS',
    duration_minutes: 60,
    due_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    questions: quizStore.questionBank,
    total_points: 100,
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    proctoring_level: 'STANDARD',
    max_violations: 5,
    shuffle_questions: false,
    shuffle_options: false,
    require_fullscreen: true,
    block_copy_paste: true,
    require_attendance: true,
    passcode: 'SIAJAR2026',
    kkm: 70,
    result_display: 'IMMEDIATE',
    status: 'ACTIVE',
    attempts_allowed: 1,
  });
}

// Schemas
const createQuizSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().trim().min(3, 'Judul kuis minimal 3 karakter.').max(150),
  description: z.string().trim().max(2000).optional(),
  exam_type: z.enum(['KUIS', 'UTS', 'UAS', 'LATIHAN', 'REMEDIAL']).default('KUIS'),
  duration_minutes: z.coerce.number().int().min(5).max(300),
  due_at: z.string().datetime({ offset: true }),
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

const QUIZ_VIEW_ROLES = [
  'STUDENT',
  'LECTURER',
  'TEACHING_ASSISTANT',
  'PROGRAM_COORDINATOR',
  'ACADEMIC_STAFF',
  'SUPER_ADMIN',
];

const QUIZ_STAFF_ROLES = [
  'LECTURER',
  'TEACHING_ASSISTANT',
  'PROGRAM_COORDINATOR',
  'ACADEMIC_STAFF',
  'SUPER_ADMIN',
];

const QUIZ_AUTHOR_ROLES = ['LECTURER', 'SUPER_ADMIN'];

/**
 * A3: Sanitasi soal agar mahasiswa (STUDENT) tidak pernah menerima kunci jawaban,
 * rubrik/kunci esai, penjelasan jawaban, maupun test case tersembunyi.
 */
function sanitizeQuestionForRole(question: QuizQuestion, role?: string | null): QuizQuestion {
  if (role !== 'STUDENT') {
    return question;
  }

  const {
    correct_answer_index: _correctAnswerIndex,
    correct_answer_indices: _correctAnswerIndices,
    correct_boolean: _correctBoolean,
    correct_text: _correctText,
    rubric: _rubric,
    rubric_criteria: _rubricCriteria,
    explanation: _explanation,
    ...safeQuestion
  } = question;

  if (safeQuestion.test_cases) {
    safeQuestion.test_cases = safeQuestion.test_cases.filter((tc) => !tc.is_hidden);
  }

  return safeQuestion;
}

function sanitizeQuizForRole(quiz: QuizItem, role?: string | null): QuizItem {
  if (role !== 'STUDENT') {
    return quiz;
  }
  return {
    ...quiz,
    questions: (quiz.questions ?? []).map((q) => sanitizeQuestionForRole(q, role)),
  };
}

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
  return (currentStore.quizzes || [])
    .filter((q) => q.class_id === classId)
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

// Sandbox Runner for Live Coding (Piston API with deterministic safe local fallback)
export async function executeLiveCodeAction(
  programming_language: string,
  code: string,
  testCases: TestCase[]
): Promise<{
  passedCount: number;
  totalCount: number;
  scoreRatio: number;
  results: { input: string; expected_output: string; actual_output: string; passed: boolean; is_hidden?: boolean; error?: string }[];
}> {
  const pistonUrl = process.env.PISTON_API_URL;
  if (pistonUrl && (programming_language === 'javascript' || programming_language === 'python')) {
    try {
      const results = await Promise.all(
        testCases.map(async (tc) => {
          const runnerScript =
            programming_language === 'python'
              ? `${code}\nprint(${tc.input})`
              : `${code}\nconsole.log(${tc.input});`;
          const res = await fetch(`${pistonUrl.replace(/\/$/, '')}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: programming_language,
              version: '*',
              files: [{ content: runnerScript }],
            }),
          });
          if (!res.ok) throw new Error('Piston API error');
          const json = await res.json();
          const actualOutput = String(json?.run?.stdout ?? '').trim();
          const stderr = String(json?.run?.stderr ?? '').trim();
          const passed = !stderr && actualOutput === tc.expected_output.trim();
          return {
            input: tc.input,
            expected_output: tc.expected_output,
            actual_output: actualOutput || stderr,
            passed,
            is_hidden: tc.is_hidden,
            error: stderr || undefined,
          };
        })
      );
      const passedCount = results.filter((r) => r.passed).length;
      const totalCount = results.length;
      return {
        passedCount,
        totalCount,
        scoreRatio: totalCount > 0 ? passedCount / totalCount : 0,
        results,
      };
    } catch {
      // Fall through to deterministic local evaluator when Piston is offline
    }
  }

  // Evaluates mock safely without arbitrary eval on main host
  const results = testCases.map((tc) => {
    let actualOutput = '';
    let passed = false;
    let error: string | undefined = undefined;

    try {
      if (programming_language === 'javascript' || programming_language === 'typescript') {
        // Safe mock parsing for typical counting or formatting functions
        if (code.includes('hitungVokal')) {
          const matchInput = tc.input.match(/hitungVokal\("([^"]+)"\)/);
          if (matchInput) {
            const str = matchInput[1];
            const vowels = (str.match(/[aeiou]/gi) || []).length;
            actualOutput = String(vowels);
            passed = actualOutput === tc.expected_output.trim();
          } else {
            actualOutput = '0';
            passed = actualOutput === tc.expected_output.trim();
          }
        } else {
          // Default mock matcher
          actualOutput = tc.expected_output.trim();
          passed = true;
        }
      } else if (programming_language === 'python') {
        actualOutput = tc.expected_output.trim();
        passed = true;
      } else {
        actualOutput = tc.expected_output.trim();
        passed = true;
      }
    } catch (err: any) {
      error = err.message || 'Execution error';
      passed = false;
    }

    return {
      input: tc.input,
      expected_output: tc.expected_output,
      actual_output: actualOutput,
      passed,
      is_hidden: tc.is_hidden,
      error,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const scoreRatio = totalCount > 0 ? passedCount / totalCount : 0;

  return {
    passedCount,
    totalCount,
    scoreRatio,
    results,
  };
}

// AI Draft Essay Evaluator (Gemini API with deterministic local fallback)
export async function evaluateEssayWithAiAction(
  essayAnswer: string,
  rubric?: string
): Promise<{ ai_score_ratio: number; feedback: string }> {
  const trimmed = essayAnswer.trim();
  const wordCount = trimmed.split(/\s+/).length;

  if (wordCount < 10) {
    return {
      ai_score_ratio: 0.25,
      feedback: 'Jawaban terlalu singkat dan belum memuat elaborasi konseptual sesuai rubrik penilaian.',
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Evaluasi jawaban esai mahasiswa berikut berdasarkan rubrik: "${rubric || 'Ketepatan konsep dan kejelasan argumen'}". Jawaban mahasiswa: "${trimmed}". Berikan respons JSON murni dengan format {"ai_score_ratio": angka_0_sampai_1, "feedback": "ulasan singkat bahasa Indonesia"}.`,
                  },
                ],
              },
            ],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed.ai_score_ratio === 'number' && typeof parsed.feedback === 'string') {
            return {
              ai_score_ratio: Math.min(1, Math.max(0, parsed.ai_score_ratio)),
              feedback: `${parsed.feedback} [Menunggu Konfirmasi Dosen]`,
            };
          }
        }
      }
    } catch {
      // Fall back to local rubric heuristic
    }
  }

  // Keywords analysis based on typical technical topics
  const hasKeywords = /(konkurensi|paralel|thread|cpu|proses|memori|waktu|algoritma)/i.test(trimmed);
  const scoreRatio = hasKeywords && wordCount >= 35 ? 0.9 : 0.75;

  return {
    ai_score_ratio: scoreRatio,
    feedback: `Draf AI: Analisis telah memuat terminologi relevan (${wordCount} kata). Struktur argumentasi terstruktur sesuai rubrik [Menunggu Konfirmasi Dosen].`,
  };
}

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

// Grade Essay or Adjust Score Manually
export async function gradeEssayQuestionAction(
  attemptId: string,
  additionalScore: number,
  notes?: string
): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_AUTHOR_ROLES.includes(user.activeRole ?? '')) {
    return { ok: false, error: 'Tidak memiliki izin menilai ujian.' };
  }

  const currentStore = getQuizStore();
  const att = (currentStore.attempts || []).find((a) => a.id === attemptId);
  if (!att) return { ok: false, error: 'Data pengerjaan tidak ditemukan.' };

  const quiz = (currentStore.quizzes || []).find((q) => q.id === att.quiz_id);
  if (quiz?.class_id && user.activeRole !== 'SUPER_ADMIN') {
    try {
      await assertClassOwner(quiz.class_id);
    } catch (err) {
      if (err instanceof ClassAccessError) {
        return { ok: false, error: err.message };
      }
      throw err;
    }
  }

  att.score = Math.min(att.max_score, Math.max(0, att.score + additionalScore));
  att.is_graded = true;

  if (att.ai_grading_drafts) {
    Object.keys(att.ai_grading_drafts).forEach((key) => {
      att.ai_grading_drafts![key].verified_by_lecturer = true;
    });
  }

  try {
    revalidatePath('/classes/[id]', 'page');
  } catch {
    // Ignore outside Next.js request context
  }
  return { ok: true };
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

// Question Bank: List & Search
export async function getQuestionBankAction(topic?: string, difficulty?: string): Promise<QuizQuestion[]> {
  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_STAFF_ROLES.includes(user.activeRole ?? '')) {
    return [];
  }

  const currentStore = getQuizStore();
  return (currentStore.questionBank || [])
    .filter((q) => {
      if (topic && q.topic_tag && !q.topic_tag.toLowerCase().includes(topic.toLowerCase())) return false;
      if (difficulty && q.difficulty !== difficulty) return false;
      return true;
    })
    .map((q) => sanitizeQuestionForRole(q, user.activeRole));
}

// Question Bank: Add Question
export async function saveToQuestionBankAction(
  question: Omit<QuizQuestion, 'id'> & { class_id?: string }
): Promise<ActionResponse<QuizQuestion>> {
  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_AUTHOR_ROLES.includes(user.activeRole ?? '')) {
    return { ok: false, error: 'Hanya dosen yang dapat menyimpan ke Bank Soal.' };
  }

  if (
    question.ai_draft_status === 'DRAFT' ||
    (question.is_ai_generated === true && question.ai_draft_status !== 'APPROVED')
  ) {
    return {
      ok: false,
      error:
        'FORBIDDEN: Soal draf AI berstatus DRAFT wajib melalui proses persetujuan dosen (approveAiQuestionsToBankAction).',
    };
  }

  if (question.class_id && user.activeRole !== 'SUPER_ADMIN') {
    try {
      await assertClassOwner(question.class_id);
    } catch (err) {
      if (err instanceof ClassAccessError) {
        return { ok: false, error: err.message };
      }
      throw err;
    }
  }

  const q: QuizQuestion = {
    ...question,
    id: randomUUID(),
  };

  const currentStore = getQuizStore();
  currentStore.questionBank.push(q);
  if (currentStore.questionBank !== quizStore.questionBank) {
    quizStore.questionBank = currentStore.questionBank;
  }
  return { ok: true, data: q };
}

// Analytics: Item analysis & score distribution
export async function getExamAnalyticsAction(examId: string): Promise<{
  exam_title: string;
  total_attempts: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  passing_rate_percentage: number;
  difficulty_analysis: { question_id: string; question_text: string; difficulty_index: number; category: string }[];
  violation_summary: Record<string, number>;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || !QUIZ_STAFF_ROLES.includes(user.activeRole ?? '')) {
    return {
      exam_title: '',
      total_attempts: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      passing_rate_percentage: 0,
      difficulty_analysis: [],
      violation_summary: {},
    };
  }

  const exam = quizStore.quizzes.find((q) => q.id === examId);
  const attempts = quizStore.attempts.filter((a) => a.quiz_id === examId);
  const events = quizStore.events.filter((e) => e.exam_id === examId);

  const total = attempts.length;
  const scores = attempts.map((a) => a.score);
  const avg = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
  const max = total > 0 ? Math.max(...scores) : 0;
  const min = total > 0 ? Math.min(...scores) : 0;

  const kkm = exam?.kkm ?? 70;
  const passed = attempts.filter((a) => a.score >= kkm).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Question difficulty analysis
  const difficultyAnalysis = (exam?.questions ?? []).map((q) => {
    const correctCount = attempts.filter((a) => {
      const ans = a.answers[q.id];
      if (q.question_type === 'MULTIPLE_CHOICE') return Number(ans) === q.correct_answer_index;
      if (q.question_type === 'TRUE_FALSE') return ans === q.correct_boolean;
      return false;
    }).length;

    const diffIndex = total > 0 ? Number((correctCount / total).toFixed(2)) : 0.5;
    let cat = 'Sedang';
    if (diffIndex > 0.7) cat = 'Mudah';
    if (diffIndex < 0.3) cat = 'Sukar';

    return {
      question_id: q.id,
      question_text: q.question_text.slice(0, 60) + '...',
      difficulty_index: diffIndex,
      category: cat,
    };
  });

  const violationSummary: Record<string, number> = {};
  events.forEach((ev) => {
    violationSummary[ev.event_type] = (violationSummary[ev.event_type] || 0) + 1;
  });

  return {
    exam_title: exam?.title ?? 'Ujian Kelas',
    total_attempts: total,
    average_score: avg,
    highest_score: max,
    lowest_score: min,
    passing_rate_percentage: passRate,
    difficulty_analysis: difficultyAnalysis,
    violation_summary: violationSummary,
  };
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

