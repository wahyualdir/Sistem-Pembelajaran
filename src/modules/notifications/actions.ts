'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import {
  getInAppNotifications,
  markInAppNotificationAsRead,
  markAllInAppNotificationsAsRead,
} from './channels/in-app';
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from './preferences';
import { runScheduledReminders } from './scheduler';
import { notify } from './service';
import type {
  NotificationRecord,
  UserNotificationPreferences,
  ScheduledReminderCheckResult,
  NotifyPayload,
  NotifyResult,
} from './types';

function safeRevalidate(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
  } catch {
    // Abaikan jika dipanggil di luar konteks request Next.js (seperti unit test)
  }
}

/**
 * Server Action: Mengambil daftar notifikasi pengguna saat ini
 * Mendukung filter 'all' atau 'unread'
 */
export async function listNotificationsAction(
  filter: 'all' | 'unread' = 'all'
): Promise<NotificationRecord[]> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) return [];

  return getInAppNotifications(userContext.user.id, filter);
}

/**
 * Server Action: Menghitung jumlah notifikasi yang belum dibaca
 */
export async function countUnreadNotificationsAction(): Promise<number> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) return 0;

  const unreadItems = await getInAppNotifications(userContext.user.id, 'unread');
  return unreadItems.length;
}

/**
 * Server Action: Menandai satu notifikasi sebagai telah dibaca
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResponse> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' };
  }

  const success = await markInAppNotificationAsRead(userContext.user.id, notificationId);
  if (!success) {
    return { ok: false, error: 'Notifikasi tidak ditemukan atau bukan milik Anda.' };
  }

  safeRevalidate('/notifications');
  safeRevalidate('/', 'layout');
  return { ok: true };
}

/**
 * Server Action: Menandai SEMUA notifikasi pengguna sebagai telah dibaca
 */
export async function markAllNotificationsReadAction(): Promise<ActionResponse<{ count: number }>> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' };
  }

  const count = await markAllInAppNotificationsAsRead(userContext.user.id);
  safeRevalidate('/notifications');
  safeRevalidate('/', 'layout');
  return { ok: true, data: { count } };
}

/**
 * Server Action: Mengambil preferensi notifikasi pengguna aktif
 */
export async function getNotificationPreferencesAction(): Promise<UserNotificationPreferences | null> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) return null;

  return getUserNotificationPreferences(userContext.user.id);
}

/**
 * Server Action: Menyimpan pembaruan preferensi notifikasi
 */
export async function saveNotificationPreferencesAction(updates: {
  channels?: Partial<UserNotificationPreferences['channels']>;
  events?: Partial<UserNotificationPreferences['events']>;
}): Promise<ActionResponse<UserNotificationPreferences>> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' };
  }

  try {
    const updated = await updateUserNotificationPreferences(userContext.user.id, updates);
    safeRevalidate('/notifications/preferences');
    safeRevalidate('/settings');
    return { ok: true, data: updated };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Gagal menyimpan preferensi notifikasi.',
    };
  }
}

/**
 * Server Action: Memicu pengecekan pengingat otomatis terjadwal
 * Hanya diizinkan untuk SUPER_ADMIN dan SYSTEM_ADMIN
 */
export async function triggerScheduledRemindersAction(): Promise<ActionResponse<ScheduledReminderCheckResult>> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' };
  }

  const role = userContext.activeRole;
  if (role !== 'SUPER_ADMIN' && role !== 'SYSTEM_ADMIN') {
    return {
      ok: false,
      error: 'FORBIDDEN: Hanya SUPER_ADMIN dan SYSTEM_ADMIN yang berwenang memicu pengingat terjadwal.',
    };
  }

  try {
    const summary = await runScheduledReminders();
    safeRevalidate('/notifications');
    safeRevalidate('/', 'layout');
    return { ok: true, data: summary };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Gagal menjalankan pemindaian pengingat otomatis.',
    };
  }
}

import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { NotifikasiService, type PreferensiNotifikasiItem } from './legacy-bridge';

/**
 * Server Action: Pengiriman notifikasi administratif (dibatasi khusus SUPER_ADMIN dengan validasi penerima).
 * Modul internal server wajib memanggil fungsi `notify()` dari `./service` secara langsung.
 */
export async function sendNotificationAction(payload: NotifyPayload): Promise<NotifyResult> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user || userContext.activeRole !== 'SUPER_ADMIN') {
    return {
      ok: false,
      dispatchedChannels: [],
      error: 'FORBIDDEN: Hanya SUPER_ADMIN yang berwenang mengirim notifikasi secara langsung.',
    };
  }

  const recipientId = typeof payload?.userId === 'string' ? payload.userId.trim() : '';
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  const body = typeof payload?.body === 'string' ? payload.body.trim() : '';

  if (!recipientId || recipientId.length < 3 || !title || !body) {
    return {
      ok: false,
      dispatchedChannels: [],
      error: 'INVALID_RECIPIENT: Penerima (userId), judul, dan isi pesan wajib valid.',
    };
  }

  const res = await notify({
    ...payload,
    userId: recipientId,
    title: title,
    body: body,
  });
  safeRevalidate('/notifications');
  safeRevalidate('/', 'layout');
  return res;
}

export async function getNotifikasiAction() {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const notifikasi = await NotifikasiService.getNotifikasiPengguna(userId);
    return { success: true, data: notifikasi };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal memuat notifikasi',
      data: [],
    };
  }
}

export async function tandaiDibacaAction(notifikasiId: string) {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const item = await NotifikasiService.tandaiDibaca(notifikasiId, userId);
    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menandai notifikasi',
    };
  }
}

export async function tandaiSemuaDibacaAction() {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const res = await NotifikasiService.tandaiSemuaDibaca(userId);
    return { success: true, count: res.count };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menandai semua notifikasi',
    };
  }
}

export async function tundaNotifikasiAction(notifikasiId: string, menit: number) {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const item = await NotifikasiService.tundaNotifikasi(notifikasiId, userId, menit);
    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menunda notifikasi',
    };
  }
}

export async function getPreferensiAction() {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const pref = await NotifikasiService.getPreferensi(userId);
    return { success: true, data: pref };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal mengambil preferensi',
    };
  }
}

export async function simpanPreferensiAction(data: Partial<PreferensiNotifikasiItem>) {
  try {
    const session = await requireAuth();
    const userId = session.subId || session.userId;
    const updated = await NotifikasiService.simpanPreferensi(userId, data);

    try {
      await prisma.logAudit.create({
        data: {
          penggunaId: session.userId,
          aksi: 'UBAH_PREFERENSI_NOTIFIKASI',
          entitas: 'PreferensiNotifikasi',
          entitasId: userId,
          nilaiBaru: JSON.stringify(data),
        },
      });
    } catch {
      // fallback
    }

    safeRevalidate('/mahasiswa/preferensi-notifikasi');
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menyimpan preferensi',
    };
  }
}
