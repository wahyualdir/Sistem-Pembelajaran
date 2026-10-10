import { NextResponse } from 'next/server';
import { triggerDeadlineRemindersAction } from '@/modules/academic/reminder-actions';

export async function GET() {
  try {
    const result = await triggerDeadlineRemindersAction();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
