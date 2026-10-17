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
    const retentionDays = await getPolicy<number>('absence_proof_retention_days');
    const cutoffDate = new Date(Date.now() - retentionDays * 86400000).toISOString();
    let purgedCount = 0;

    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      // Cari data berkas bukti izin lama
      const { data: oldProofs } = await supabase
        .from('leave_permits' as any)
        .select('id, attachment_url')
        .lt('created_at', cutoffDate)
        .not('attachment_url', 'is', null);

      if (oldProofs && oldProofs.length > 0) {
        // Hapus tautan bukti setelah masa retensi
        await supabase
          .from('leave_permits' as any)
          .update({ attachment_url: null })
          .lt('created_at', cutoffDate);

        purgedCount = oldProofs.length;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      retentionDays,
      purgedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
