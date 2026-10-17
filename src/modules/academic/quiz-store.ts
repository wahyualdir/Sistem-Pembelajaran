// In-memory store dan tipe data untuk kuis, ujian, dan bank soal SIAJAR LMS
// Berkas ini TIDAK memiliki directive 'use server' sehingga aman diimpor oleh server actions, route handlers, dan unit tests.

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
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

export interface QuizStoreType {
  quizzes: QuizItem[];
  attempts: QuizAttempt[];
  events: ExamEvent[];
  liveStatus: Record<string, Record<string, ExamStudentLiveStatus>>;
  questionBank: QuizQuestion[];
  disputes: ExamDispute[];
}

export const quizStore: QuizStoreType = ((globalThis as any).__siajarKuis ??= {
  quizzes: [],
  attempts: [],
  events: [],
  liveStatus: {},
  questionBank: [],
  disputes: [],
});

quizStore.quizzes ??= [];
quizStore.attempts ??= [];
quizStore.events ??= [];
quizStore.liveStatus ??= {};
quizStore.questionBank ??= [];
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
    max_violations: 3,
    shuffle_questions: true,
    shuffle_options: true,
    require_fullscreen: true,
    block_copy_paste: true,
    require_attendance: true,
    passcode: 'UIR2026',
    kkm: 70,
    result_display: 'AFTER_CLOSED',
    status: 'ACTIVE',
    attempts_allowed: 1,
  });
}

export function getQuizStore(): QuizStoreType {
  return quizStore;
}
