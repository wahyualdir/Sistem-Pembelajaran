import type { QuizQuestion, QuizItem } from '../quiz-store';

export const QUIZ_VIEW_ROLES = [
  'STUDENT',
  'LECTURER',
  'TEACHING_ASSISTANT',
  'PROGRAM_COORDINATOR',
  'ACADEMIC_STAFF',
  'SUPER_ADMIN',
];

export const QUIZ_STAFF_ROLES = [
  'LECTURER',
  'TEACHING_ASSISTANT',
  'PROGRAM_COORDINATOR',
  'ACADEMIC_STAFF',
  'SUPER_ADMIN',
];

export const QUIZ_AUTHOR_ROLES = ['LECTURER', 'SUPER_ADMIN'];

export const STUDENT_VIOLATION_TYPES: Set<string> = new Set([
  'TAB_SWITCH',
  'WINDOW_BLUR',
  'EXIT_FULLSCREEN',
  'COPY',
  'PASTE',
  'CONTEXT_MENU',
  'NETWORK_DISCONNECT',
  'IP_CHANGE',
]);

export function isStudentViolationEvent(eventType: string): boolean {
  return STUDENT_VIOLATION_TYPES.has(eventType);
}

/**
 * A3: Sanitasi soal agar mahasiswa (STUDENT) tidak pernah menerima kunci jawaban,
 * rubrik/kunci esai, penjelasan jawaban, maupun test case tersembunyi.
 */
export function sanitizeQuestionForRole(question: QuizQuestion, role?: string | null): QuizQuestion {
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

export function sanitizeQuizForRole(quiz: QuizItem, role?: string | null): QuizItem {
  if (role !== 'STUDENT') {
    return quiz;
  }
  return {
    ...quiz,
    questions: (quiz.questions ?? []).map((q) => sanitizeQuestionForRole(q, role)),
  };
}
