import { NextRequest, NextResponse } from 'next/server';
import { processScheduledNotifications } from '@/modules/notifications/scheduled';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const result = await processScheduledNotifications();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
