import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';
import { getPolicy } from '@/lib/policies';
import { notify } from '@/modules/notifications';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const journalDeadlineDays = await getPolicy<number>('journal_deadline_days');
    let remindedCount = 0;

    // Di lingkungan nyata atau demo, cari pertemuan perkuliahan yang belum memiliki jurnal
    // dan lewati deadline_days, lalu kirim BERITA_ACARA_BELUM_DIISI
    // Demo simulation check:
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      journalDeadlineDays,
      remindedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
