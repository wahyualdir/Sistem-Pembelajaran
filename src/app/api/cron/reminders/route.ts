import { NextRequest, NextResponse } from 'next/server';
import { triggerDeadlineRemindersAction } from '@/modules/notifications';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const reminders = await triggerDeadlineRemindersAction();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      reminders,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
