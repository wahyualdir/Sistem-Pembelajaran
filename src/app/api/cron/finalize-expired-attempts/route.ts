import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';
import { getQuizStore } from '@/modules/academic/quiz-store';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const store = getQuizStore();
    const now = Date.now();
    let finalizedCount = 0;

    // Evaluasi attempt aktif yang melebihi durasi kuis
    for (const attempt of store.attempts) {
      if (!attempt.submitted_at) {
        const quiz = store.quizzes.find((q) => q.id === attempt.quiz_id);
        if (quiz) {
          const startTime = new Date(attempt.id).getTime() || now - 3600000;
          const allowedDurationMs = (quiz.duration_minutes + 1) * 60 * 1000;
          if (now - startTime > allowedDurationMs) {
            attempt.submitted_at = new Date().toISOString();
            attempt.is_graded = true;
            finalizedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      finalizedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
