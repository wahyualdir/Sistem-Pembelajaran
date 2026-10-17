import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse();
  }

  try {
    // Berkas staging impor dihapus setelah 24 jam
    const cutoffDate = new Date(Date.now() - 24 * 3600000).toISOString();
    let purgedCount = 0;

    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data: objects } = await supabase.storage
        .from('import-staging')
        .list('', { limit: 100 });

      if (objects && objects.length > 0) {
        const oldFiles = (objects as any[])
          .filter((o) => o.created_at && o.created_at < cutoffDate)
          .map((o) => o.name);

        if (oldFiles.length > 0) {
          await supabase.storage.from('import-staging').remove(oldFiles);
          purgedCount = oldFiles.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      purgedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
