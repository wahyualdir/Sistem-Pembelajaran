// Modul Notifikasi Terjadwal (scheduled_notifications)
// Mengacu pada Dokumen Instruksi Antigravity Versi 2 (Bagian 8.3 & Lampiran B)

import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { notify } from './service';
import type { ActionResponse } from '@/modules/identity/types';

export interface ScheduledNotificationRecord {
  id: string;
  user_id: string;
  kind: string;
  payload: {
    title: string;
    body: string;
    target_url?: string;
    class_id?: string;
    entity_type?: string;
    entity_id?: string;
  };
  send_at: string;
  sent_at: string | null;
  dedupe_key?: string | null;
  created_at: string;
}

// In-memory store untuk lingkungan pengujian atau fallback offline
const scheduledStore: ScheduledNotificationRecord[] =
  ((globalThis as any).__siajarScheduledNotifications ??= []);

/**
 * Menjadwalkan pengiriman notifikasi di masa mendatang secara idempoten.
 */
export async function scheduleNotification(input: {
  userId: string;
  kind: string;
  payload: {
    title: string;
    body: string;
    target_url?: string;
    class_id?: string;
    entity_type?: string;
    entity_id?: string;
  };
  sendAt?: Date | string;
  dedupeKey?: string;
}): Promise<ActionResponse<{ id: string }>> {
  const sendAtStr = input.sendAt
    ? typeof input.sendAt === 'string'
      ? input.sendAt
      : input.sendAt.toISOString()
    : new Date().toISOString();

  const id = randomUUID();
  const dedupeKey = input.dedupeKey || null;

  // Cek duplikasi di in-memory store
  if (dedupeKey) {
    const existing = scheduledStore.find((s) => s.dedupe_key === dedupeKey);
    if (existing) {
      return { ok: true, data: { id: existing.id } };
    }
  }

  const record: ScheduledNotificationRecord = {
    id,
    user_id: input.userId,
    kind: input.kind,
    payload: input.payload,
    send_at: sendAtStr,
    sent_at: null,
    dedupe_key: dedupeKey,
    created_at: new Date().toISOString(),
  };

  scheduledStore.push(record);

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      await supabase.from('scheduled_notifications').upsert(
        {
          id,
          user_id: input.userId,
          kind: input.kind,
          payload: input.payload,
          send_at: sendAtStr,
          sent_at: null,
          dedupe_key: dedupeKey,
        },
        { onConflict: 'dedupe_key' }
      );
    }
  } catch {
    // Tetap berhasil melalui fallback memory store
  }

  return { ok: true, data: { id } };
}

/**
 * Memproses seluruh notifikasi terjadwal yang jatuh tempo (send_at <= now() dan sent_at IS NULL).
 * Dijalankan secara periodik via cron endpoint /api/cron/scheduled-notifications.
 */
export async function processScheduledNotifications(): Promise<{
  processedCount: number;
  results: Array<{ id: string; success: boolean }>;
}> {
  const now = new Date();
  const nowIso = now.toISOString();
  const results: Array<{ id: string; success: boolean }> = [];

  // 1. Ambil dari memory store
  const pendingInMem = scheduledStore.filter(
    (s) => !s.sent_at && new Date(s.send_at).getTime() <= now.getTime()
  );

  for (const item of pendingInMem) {
    try {
      await notify({
        userId: item.user_id,
        type: item.kind,
        title: item.payload.title,
        body: item.payload.body,
        targetUrl: item.payload.target_url,
        classId: item.payload.class_id,
        entityType: item.payload.entity_type,
        entityId: item.payload.entity_id,
        dedupKey: item.dedupe_key || undefined,
      });

      item.sent_at = nowIso;
      results.push({ id: item.id, success: true });
    } catch {
      results.push({ id: item.id, success: false });
    }
  }

  // 2. Ambil dari database jika online
  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data: dbPending } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .lte('send_at', nowIso)
        .is('sent_at', null)
        .limit(100);

      if (dbPending && dbPending.length > 0) {
        for (const row of dbPending) {
          // Lewati jika sudah diproses di in-mem
          if (results.some((r) => r.id === row.id)) continue;

          try {
            const p = row.payload as any;
            await notify({
              userId: row.user_id,
              type: row.kind,
              title: p.title,
              body: p.body,
              targetUrl: p.target_url,
              classId: p.class_id,
              entityType: p.entity_type,
              entityId: p.entity_id,
              dedupKey: row.dedupe_key || undefined,
            });

            await supabase
              .from('scheduled_notifications')
              .update({ sent_at: nowIso })
              .eq('id', row.id);

            results.push({ id: row.id, success: true });
          } catch {
            results.push({ id: row.id, success: false });
          }
        }
      }
    }
  } catch {
    // Abaikan galat sinkronisasi database
  }

  return {
    processedCount: results.filter((r) => r.success).length,
    results,
  };
}

export function getScheduledStore(): ScheduledNotificationRecord[] {
  return scheduledStore;
}
