import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';
import { getPolicy } from '@/lib/policies';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const isAutoArchiveEnabled = await getPolicy<boolean>('auto_archive_enabled');
    const archiveAfterDays = await getPolicy<number>('class_archive_after_days');

    if (!isAutoArchiveEnabled) {
      return NextResponse.json({
        success: true,
        archivedCount: 0,
        message: 'Pengarsipan otomatis dinonaktifkan pada kebijakan institusi.',
      });
    }

    let archivedCount = 0;
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const cutoffDate = new Date(Date.now() - archiveAfterDays * 86400000).toISOString();
      const { data } = await supabase
        .from('classes')
        .update({ status: 'ARCHIVED' } as any)
        .eq('status', 'CLOSED')
        .lt('updated_at', cutoffDate)
        .select('id');

      archivedCount = data?.length || 0;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      archivedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
