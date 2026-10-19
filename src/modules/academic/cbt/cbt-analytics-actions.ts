'use server';

import { randomUUID } from 'crypto';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { assertClassOwner, ClassAccessError } from '@/lib/auth/class-access';
import { quizStore, getQuizStore, type QuizQuestion } from '../quiz-store';
import { QUIZ_AUTHOR_ROLES, QUIZ_STAFF_ROLES, sanitizeQuestionForRole } from './cbt-shared';

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
