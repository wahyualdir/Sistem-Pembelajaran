import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import type { UserNotificationPreferences } from './types';

const defaultPreferences = (userId: string): UserNotificationPreferences => ({
  user_id: userId,
  phone_number: null,
  quiet_hours_start: '22:00',
  quiet_hours_end: '06:00',
  backup_email: null,
  channels: {
    in_app: true,
    email: true,
    whatsapp: false,
  },
  events: {
    assignment_due: true,
    exam_upcoming: true,
    attendance_open: true,
    announcement: true,
    grades: true,
    forum_and_early_warning: true,
  },
  updated_at: new Date().toISOString(),
});

function getInMemoryPrefs(): Record<string, UserNotificationPreferences> {
  return ((globalThis as any).__siajarNotifPrefs ??= {});
}

export async function getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences> {
  const online = await checkSupabaseOnline();

  if (online) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          user_id: userId,
          phone_number: data.phone_number ?? null,
          quiet_hours_start: data.quiet_hours_start ?? '22:00',
          quiet_hours_end: data.quiet_hours_end ?? '06:00',
          backup_email: data.backup_email ?? null,
          channels: {
            in_app: true, // in-app wajib aktif
            email: data.channels?.email ?? true,
            whatsapp: data.channels?.whatsapp ?? false,
          },
          events: {
            assignment_due: data.events?.assignment_due ?? true,
            exam_upcoming: data.events?.exam_upcoming ?? true,
            attendance_open: data.events?.attendance_open ?? true,
            announcement: data.events?.announcement ?? true,
            grades: data.events?.grades ?? true,
            forum_and_early_warning: data.events?.forum_and_early_warning ?? true,
          },
          updated_at: data.updated_at || new Date().toISOString(),
        };
      }
    } catch {
      // fallback
    }
  }

  const memStore = getInMemoryPrefs();
  if (!memStore[userId]) {
    memStore[userId] = defaultPreferences(userId);
  }
  return memStore[userId];
}

export async function updateUserNotificationPreferences(
  userId: string,
  updates: {
    phone_number?: string | null;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    backup_email?: string | null;
    channels?: Partial<UserNotificationPreferences['channels']>;
    events?: Partial<UserNotificationPreferences['events']>;
  }
): Promise<UserNotificationPreferences> {
  const current = await getUserNotificationPreferences(userId);

  const updated: UserNotificationPreferences = {
    user_id: userId,
    phone_number: updates.phone_number !== undefined ? updates.phone_number : (current.phone_number ?? null),
    quiet_hours_start: updates.quiet_hours_start !== undefined ? updates.quiet_hours_start : (current.quiet_hours_start ?? '22:00'),
    quiet_hours_end: updates.quiet_hours_end !== undefined ? updates.quiet_hours_end : (current.quiet_hours_end ?? '06:00'),
    backup_email: updates.backup_email !== undefined ? updates.backup_email : (current.backup_email ?? null),
    channels: {
      ...current.channels,
      ...updates.channels,
      in_app: true, // Wajib selalu aktif
    },
    events: {
      ...current.events,
      ...updates.events,
    },
    updated_at: new Date().toISOString(),
  };

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      await supabase.from('notification_preferences').upsert({
        user_id: userId,
        phone_number: updated.phone_number,
        quiet_hours_start: updated.quiet_hours_start,
        quiet_hours_end: updated.quiet_hours_end,
        backup_email: updated.backup_email,
        channels: updated.channels,
        events: updated.events,
        updated_at: updated.updated_at,
      });
    } catch {
      // fallback
    }
  }

  const memStore = getInMemoryPrefs();
  memStore[userId] = updated;

  return updated;
}
