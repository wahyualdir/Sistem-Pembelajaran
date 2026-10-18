import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';
import { getPolicy } from '@/lib/policies';
import { createClient } from '@/lib/supabase/server';
import { generateReminderMessage, buildReminderDedupeKey } from '@/lib/ai/reminder-service';
import { notify } from '@/modules/notifications';

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

    const supabase = await createClient();
    const now = new Date();
    const h1Window = new Date(now.getTime() + 24 * 3600 * 1000);
    const h3hWindow = new Date(now.getTime() + 3 * 3600 * 1000);

    let processedCount = 0;

    // 1. Ambil tugas yang mendekati tenggat (H-1 dan 3 jam)
    const { data: upcomingAssignments } = await supabase
      .from('assignments')
      .select('id, title, class_id, due_at, classes(title)')
      .gt('due_at', now.toISOString())
      .lte('due_at', h1Window.toISOString());

    if (upcomingAssignments && upcomingAssignments.length > 0) {
      for (const a of upcomingAssignments) {
        // Ambil mahasiswa yang terdaftar di kelas
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', a.class_id);

        if (!enrollments) continue;

        for (const e of enrollments) {
          // Cek apakah mahasiswa sudah mengumpulkan
          const { data: sub } = await supabase
            .from('submissions')
            .select('id')
            .eq('assignment_id', a.id)
            .eq('student_id', e.student_id)
            .maybeSingle();

          if (sub) continue; // Sudah mengumpulkan

          const due = new Date(a.due_at);
          const hoursLeft = (due.getTime() - now.getTime()) / (3600 * 1000);
          const kind = hoursLeft <= 3.5 ? 'tugas_3jam' : 'tugas_h1';

          const dedupeKey = buildReminderDedupeKey(e.student_id, kind, 'assignments', a.id);

          // Cek apakah sudah pernah dibuat
          const { data: existing } = await supabase
            .from('ai_reminders')
            .select('id')
            .eq('dedupe_key', dedupeKey)
            .maybeSingle();

          if (existing) continue;

          const className = (a as any).classes?.title || 'Kelas Perkuliahan';
          const { message, scheduledFor } = await generateReminderMessage(
            e.student_id,
            kind,
            {
              title: a.title,
              courseName: className,
              timeRemaining: `${Math.round(hoursLeft)} jam`,
            },
            now
          );

          await (supabase.from('ai_reminders') as any).insert({
            student_id: e.student_id,
            kind,
            ref_type: 'assignments',
            ref_id: a.id,
            payload: { title: a.title, courseName: className },
            message,
            status: 'terkirim',
            scheduled_for: scheduledFor.toISOString(),
            sent_at: now.toISOString(),
            dedupe_key: dedupeKey,
          });

          await notify({
            userId: e.student_id,
            type: 'GENERAL',
            title: `Pengingat Tugas: ${a.title}`,
            body: message,
            targetUrl: `/classes/${a.class_id}`,
            dedupKey: dedupeKey,
          });

          processedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
