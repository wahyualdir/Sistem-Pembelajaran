import { NextRequest, NextResponse } from 'next/server';
import { triggerDeadlineRemindersAction } from '@/modules/notifications';

function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED: Missing or invalid CRON_SECRET.' },
      { status: 401 }
    );
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
