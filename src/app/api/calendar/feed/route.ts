import { NextRequest, NextResponse } from 'next/server';
import {
  getUserIdFromCalendarToken,
  generateIcsCalendarFeed,
} from '@/modules/academic/calendar-sync-actions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Token langganan kalender wajib disertakan.', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const userId = await getUserIdFromCalendarToken(token);
  if (!userId) {
    return new NextResponse('Token kalender tidak sah atau sudah di-reset.', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const icsData = await generateIcsCalendarFeed(userId);

  return new NextResponse(icsData, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="siajar-calendar.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
