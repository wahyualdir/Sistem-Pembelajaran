'use server';

import * as cbtExam from './cbt/cbt-exam-actions';
import * as cbtTelemetry from './cbt/cbt-telemetry-actions';
import * as cbtGrading from './cbt/cbt-grading-actions';
import * as cbtDispute from './cbt/cbt-dispute-actions';
import * as cbtAnalytics from './cbt/cbt-analytics-actions';

export type {
  QuestionType,
  ExamType,
  ProctoringLevel,
  ExamStatus,
  ResultDisplayMode,
  TestCase,
  MatchingPair,
  QuizQuestion,
  QuizItem,
  StudentViolationEventType,
  LecturerInterventionSubtype,
  ExamEventType,
  ExamEvent,
  ExamDispute,
  ExamStudentLiveStatus,
  QuizAttempt,
} from './quiz-store';

export async function createQuizAction(...args: Parameters<typeof cbtExam.createQuizAction>) {
  return cbtExam.createQuizAction(...args);
}

export async function listClassQuizzesAction(...args: Parameters<typeof cbtExam.listClassQuizzesAction>) {
  return cbtExam.listClassQuizzesAction(...args);
}

export async function getQuizDetailAction(...args: Parameters<typeof cbtExam.getQuizDetailAction>) {
  return cbtExam.getQuizDetailAction(...args);
}

export async function getMyQuizAttemptAction(...args: Parameters<typeof cbtExam.getMyQuizAttemptAction>) {
  return cbtExam.getMyQuizAttemptAction(...args);
}

export async function listQuizAttemptsAction(...args: Parameters<typeof cbtExam.listQuizAttemptsAction>) {
  return cbtExam.listQuizAttemptsAction(...args);
}

export async function submitQuizAttemptAction(...args: Parameters<typeof cbtExam.submitQuizAttemptAction>) {
  return cbtExam.submitQuizAttemptAction(...args);
}

export async function getAllQuizzesAction(...args: Parameters<typeof cbtExam.getAllQuizzesAction>) {
  return cbtExam.getAllQuizzesAction(...args);
}

export async function getAllAttemptsAction(...args: Parameters<typeof cbtExam.getAllAttemptsAction>) {
  return cbtExam.getAllAttemptsAction(...args);
}

export async function recordExamEventAction(...args: Parameters<typeof cbtTelemetry.recordExamEventAction>) {
  return cbtTelemetry.recordExamEventAction(...args);
}

export async function getExamLiveStatusAction(...args: Parameters<typeof cbtTelemetry.getExamLiveStatusAction>) {
  return cbtTelemetry.getExamLiveStatusAction(...args);
}

export async function lecturerInterventionAction(...args: Parameters<typeof cbtTelemetry.lecturerInterventionAction>) {
  return cbtTelemetry.lecturerInterventionAction(...args);
}

export async function executeLiveCodeAction(...args: Parameters<typeof cbtGrading.executeLiveCodeAction>) {
  return cbtGrading.executeLiveCodeAction(...args);
}

export async function evaluateEssayWithAiAction(...args: Parameters<typeof cbtGrading.evaluateEssayWithAiAction>) {
  return cbtGrading.evaluateEssayWithAiAction(...args);
}

export async function gradeEssayQuestionAction(...args: Parameters<typeof cbtGrading.gradeEssayQuestionAction>) {
  return cbtGrading.gradeEssayQuestionAction(...args);
}

export async function submitExamDisputeAction(...args: Parameters<typeof cbtDispute.submitExamDisputeAction>) {
  return cbtDispute.submitExamDisputeAction(...args);
}

export async function resolveExamDisputeAction(...args: Parameters<typeof cbtDispute.resolveExamDisputeAction>) {
  return cbtDispute.resolveExamDisputeAction(...args);
}

export async function listExamDisputesAction(...args: Parameters<typeof cbtDispute.listExamDisputesAction>) {
  return cbtDispute.listExamDisputesAction(...args);
}

export async function getQuestionBankAction(...args: Parameters<typeof cbtAnalytics.getQuestionBankAction>) {
  return cbtAnalytics.getQuestionBankAction(...args);
}

export async function saveToQuestionBankAction(...args: Parameters<typeof cbtAnalytics.saveToQuestionBankAction>) {
  return cbtAnalytics.saveToQuestionBankAction(...args);
}

export async function getExamAnalyticsAction(...args: Parameters<typeof cbtAnalytics.getExamAnalyticsAction>) {
  return cbtAnalytics.getExamAnalyticsAction(...args);
}
