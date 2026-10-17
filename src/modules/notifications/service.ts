import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { SYNTHETIC_DEMO_USERS } from '@/modules/identity/demo-users';
import {
  createInAppNotification,
  hasPersistentDedupKey,
  savePersistentDedupKey,
} from './channels/in-app';
import { sendEmailNotification } from './channels/email';
import { defaultWhatsAppAdapter } from './channels/whatsapp';
import { getUserNotificationPreferences } from './preferences';
import type {
  NotifyPayload,
  NotifyResult,
  NotificationChannel,
  NotificationRecord,
  UserNotificationPreferences,
} from './types';

function isEventAllowedByPreferences(
  type: string,
  events: {
    assignment_due: boolean;
    exam_upcoming: boolean;
    attendance_open: boolean;
    announcement: boolean;
    grades: boolean;
    forum_and_early_warning: boolean;
  }
): boolean {
  switch (type) {
    case 'ASSIGNMENT_DUE':
    case 'ASSIGNMENT_NEW':
      return events.assignment_due;
    case 'EXAM_UPCOMING':
      return events.exam_upcoming;
    case 'ATTENDANCE_OPEN':
      return events.attendance_open;
    case 'ANNOUNCEMENT_NEW':
      return events.announcement;
    case 'GRADE_PUBLISHED':
    case 'GRADE_CHANGE_DECIDED':
    case 'GRADE_CHANGE_EXECUTED':
      return events.grades;
    case 'FORUM_REPLY':
    case 'EARLY_WARNING':
      return events.forum_and_early_warning;
    default:
      return true; // Pengumuman umum & sistem selalu diizinkan
  }
}

/**
 * Mengambil nomor telepon/WhatsApp dari profil pengguna atau preferensi notifikasi.
 * Mengembalikan null jika pengguna belum memiliki nomor telepon di profilnya.
 */
export async function resolveUserPhoneNumber(
  userId: string,
  prefs?: UserNotificationPreferences,
  explicitPhone?: string | null
): Promise<string | null> {
  if (explicitPhone && explicitPhone.trim().length > 0) {
    return explicitPhone.trim();
  }

  if (prefs?.phone_number && prefs.phone_number.trim().length > 0) {
    return prefs.phone_number.trim();
  }

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .maybeSingle();
      if (data && typeof (data as any).phone === 'string' && (data as any).phone.trim().length > 0) {
        return (data as any).phone.trim();
      }
    } catch {
      // fallback ke store aplikasi
    }
  }

  const g = globalThis as any;
  const profileFromMem = g.__siajarUserProfiles?.[userId];
  if (profileFromMem) {
    const phone = profileFromMem.phone || profileFromMem.whatsapp || profileFromMem.phone_number;
    if (typeof phone === 'string' && phone.trim().length > 0) {
      return phone.trim();
    }
  }

  const matchedUser = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === userId);
  if (matchedUser) {
    const phone = (matchedUser as any).phone || (matchedUser as any).whatsapp_number;
    if (typeof phone === 'string' && phone.trim().length > 0) {
      return phone.trim();
    }
  }

  return null;
}

/**
 * Layanan Notifikasi Terpusat SIAJAR.
 * Mendukung pengiriman multi-kanal: In-App (wajib), Email (SMTP), dan WhatsApp (Adapter opsional).
 * Memiliki proteksi deduplikasi persisten (idempotensi tanpa batas kedaluwarsa 5 menit) untuk mencegah notifikasi kembar.
 */
export async function notify(payload: NotifyPayload): Promise<NotifyResult> {
  const dedupKey = payload.dedupKey || `${payload.userId}:${payload.type}:${payload.title}:${payload.body}`;

  // 1. Cek Deduplikasi Persisten (Pengingat dengan dedupKey yang sama tidak pernah dikirim dua kali)
  if (await hasPersistentDedupKey(dedupKey)) {
    return {
      ok: true,
      skippedDueToDedup: true,
      dispatchedChannels: [],
    };
  }

  // 2. Ambil Preferensi Notifikasi Pengguna
  const prefs = await getUserNotificationPreferences(payload.userId);

  // Jika jenis event dinonaktifkan oleh pengguna, lewati pengiriman
  if (!isEventAllowedByPreferences(payload.type, prefs.events)) {
    return {
      ok: true,
      skippedDueToDedup: false,
      dispatchedChannels: [],
    };
  }

  // 3. Tentukan Kanal yang Aktif
  const activeChannels: NotificationChannel[] = [];
  const requestedChannels = payload.channels;

  // In-app selalu wajib aktif
  if (!requestedChannels || requestedChannels.includes('IN_APP')) {
    activeChannels.push('IN_APP');
  }

  // Email aktif jika pengguna mengizinkan dan kanal diminta
  if (prefs.channels.email && (!requestedChannels || requestedChannels.includes('EMAIL'))) {
    activeChannels.push('EMAIL');
  }

  // WhatsApp aktif jika pengguna mengizinkan dan kanal diminta
  if (prefs.channels.whatsapp && (!requestedChannels || requestedChannels.includes('WHATSAPP'))) {
    activeChannels.push('WHATSAPP');
  }

  // 4. Eksekusi Pengiriman ke Seluruh Kanal Terpilih
  let record: NotificationRecord | undefined;
  const dispatchedChannels: NotificationChannel[] = [];

  try {
    // Kanal 1: In-App Notification (Wajib, juga mencatat dedup_key di DB/store)
    if (activeChannels.includes('IN_APP')) {
      record = await createInAppNotification({
        ...payload,
        dedupKey,
      });
      dispatchedChannels.push('IN_APP');
    }

    // Kanal 2: Email Notification via SMTP
    if (activeChannels.includes('EMAIL')) {
      const targetEmail =
        prefs.backup_email && prefs.backup_email.trim().length > 0
          ? prefs.backup_email.trim()
          : `${payload.userId}@siajar.ac.id`;
      await sendEmailNotification({
        to: targetEmail,
        subject: `[SIAJAR] ${payload.title}`,
        bodyText: payload.body,
      });
      dispatchedChannels.push('EMAIL');
    }

    // Kanal 3: WhatsApp Gateway via Adapter Opsional (Ambil nomor dari profil pengguna; jika tidak ada, lewati tanpa error)
    if (activeChannels.includes('WHATSAPP')) {
      const userPhone = await resolveUserPhoneNumber(payload.userId, prefs, payload.phoneNumber);
      if (userPhone) {
        const waRes = await defaultWhatsAppAdapter.sendMessage(
          userPhone,
          `[SIAJAR] *${payload.title}*\n${payload.body}`
        );
        if (waRes.success) {
          dispatchedChannels.push('WHATSAPP');
        }
      }
    }

    // Simpan key deduplikasi secara persisten
    savePersistentDedupKey(dedupKey);

    return {
      ok: true,
      notificationId: record?.id,
      dispatchedChannels,
      skippedDueToDedup: false,
    };
  } catch (err: any) {
    console.error('[NotificationService] Gagal memproses notifikasi:', err);
    return {
      ok: false,
      dispatchedChannels,
      error: err?.message || 'Gagal mengirim notifikasi terpusat',
    };
  }
}

/**
 * Helper untuk pengiriman notifikasi massal (misal: satu kelas atau seluruh mahasiswa bimbingan)
 */
export async function notifyBatch(payloads: NotifyPayload[]): Promise<NotifyResult[]> {
  const results: NotifyResult[] = [];
  for (const p of payloads) {
    const res = await notify(p);
    results.push(res);
  }
  return results;
}
