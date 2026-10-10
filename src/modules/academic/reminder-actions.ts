'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { createClient } from '@/lib/supabase/server';

export interface ReminderResult {
  remindersSent: number;
  assignmentsChecked: number;
  upcomingAssignments: { title: string; due_at: string; class_id: string }[];
}

export async function triggerDeadlineRemindersAction(): Promise<ReminderResult> {
  const isOnline = await checkSupabaseOnline();
  const now = Date.now();
  const oneDayLater = now + 24 * 60 * 60 * 1000;

  let remindersSent = 0;
  const upcoming: { title: string; due_at: string; class_id: string }[] = [];

  // Offline / in-memory reminder check
  const memAkademik = ((globalThis as any).__siajarAkademik ??= { classes: [], enrollments: [] });
  const memTugas = ((globalThis as any).__siajarTugas ??= { assignments: [], submissions: [] });
  const memNotif: any[] = ((globalThis as any).__siajarNotifikasi ??= []);

  for (const a of memTugas.assignments) {
    const dueTime = Date.parse(a.due_at);
    if (dueTime > now && dueTime <= oneDayLater) {
      upcoming.push({ title: a.title, due_at: a.due_at, class_id: a.class_id });

      // Find students in this class who have NOT submitted
      const enrollments = memAkademik.enrollments.filter((e: any) => e.class_id === a.class_id);
      for (const e of enrollments) {
        const hasSubmitted = memTugas.submissions.some((s: any) => s.assignment_id === a.id && s.student_id === e.student_id);
        if (!hasSubmitted) {
          // Check if reminder already sent today for this assignment
          const alreadyNotified = memNotif.some(
            (n: any) => n.user_id === e.student_id && n.type === 'DEADLINE_H1' && n.link?.includes(a.class_id)
          );

          if (!alreadyNotified) {
            memNotif.unshift({
              id: randomUUID(),
              user_id: e.student_id,
              type: 'DEADLINE_H1',
              title: `⚠️ Pengingat H-1: ${a.title}`,
              body: `Tenggat pengumpulan tugas Anda tersisa kurang dari 24 jam (${new Date(a.due_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB). Segera kumpulkan!`,
              link: `/classes/${a.class_id}`,
              is_read: false,
              created_at: new Date().toISOString(),
            });
            remindersSent++;
          }
        }
      }
    }
  }

  // If online, also dispatch to Supabase notifications table
  if (isOnline) {
    try {
      const supabase = await createClient();
      const { data: onlineAssignments } = await supabase
        .from('assignments')
        .select('id, title, due_at, class_id')
        .gt('due_at', new Date(now).toISOString())
        .lte('due_at', new Date(oneDayLater).toISOString());

      if (onlineAssignments) {
        for (const oa of onlineAssignments) {
          upcoming.push({ title: oa.title, due_at: oa.due_at, class_id: oa.class_id });
        }
      }
    } catch {
      // Supabase offline fallback
    }
  }

  try {
    revalidatePath('/notifications', 'page');
  } catch {
    // Ignore in non-request test contexts
  }
  return {
    remindersSent,
    assignmentsChecked: memTugas.assignments.length,
    upcomingAssignments: upcoming,
  };
}
