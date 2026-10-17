import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';
import { getPolicy } from '@/lib/policies';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const isAiEnabled = await getPolicy<boolean>('ai_reminders_enabled');
    if (!isAiEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Pengingat AI dinonaktifkan pada kebijakan institusi.',
        processedCount: 0,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedCount: 0,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
