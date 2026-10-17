import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';
import { getQuizStore } from '@/modules/academic/quiz-store';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const store = getQuizStore();
    let rotatedCount = 0;

    // Putar token ujian yang aktif bila disetel
    for (const quiz of store.quizzes) {
      if (quiz.status === 'ACTIVE' && quiz.passcode && (quiz as any).auto_rotate_token) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let newToken = '';
        for (let i = 0; i < 6; i++) {
          newToken += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        quiz.passcode = newToken;
        rotatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      rotatedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
