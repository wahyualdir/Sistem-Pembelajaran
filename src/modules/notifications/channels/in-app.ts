import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import type { NotificationRecord, NotifyPayload } from '../types';

/**
 * Akses penyimpanan in-memory cadangan (Mode Demo / Offline Development).
 * Berbagi referensi memori dengan globalThis.__siajarNotif agar terintegrasi
 * dengan aksi-aksi akademis yang sudah berjalan.
 */
function getPersistentDedupSet(store: any[]): Set<string> {
  const g = globalThis as any;
  // Jika array __siajarNotif baru saja di-reset ke [] oleh pengujian, sinkronkan set dedup pada instance array tersebut
  if (!(store as any).__dedupSetInitialized) {
    (store as any).__dedupSetInitialized = true;
    if (store.length === 0) {
      g.__siajarNotifDedup = new Set<string>();
    }
  }
  const set: Set<string> = (g.__siajarNotifDedup ??= new Set<string>());
  for (const item of store) {
    if (item?.dedup_key) {
      set.add(item.dedup_key);
    }
  }
  return set;
}

export function getInMemoryNotifications(): (NotificationRecord & { target_url?: string | null; dedup_key?: string | null })[] {
  const g = globalThis as any;
  const wasUndefined = g.__siajarNotif === undefined;
  const store = (g.__siajarNotif ??= []);
  if (wasUndefined && store.length === 0) {
    const studentId = 'a0000001-0000-0000-0000-000000000001';
    const adminId = 'a0000009-0000-0000-0000-000000000009';
    const classId = 'c0000000-0000-0000-0000-000000000001';

    const seedItems = [
      {
        id: 'notif-seed-001',
        type: 'ASSIGNMENT_DUE',
        title: '[Pengingat H-1] Tenggat Tugas: Analisis Pola Arsitektur Microservices',
        body: 'Tenggat pengumpulan tugas kuliah tersisa kurang dari 24 jam. Segera kumpulkan berkas sebelum batas waktu berakhir.',
        target_url: `/classes/${classId}`,
        class_id: classId,
        entity_type: 'assignments',
        entity_id: 'tgs-demo-001',
        dedup_key: 'seed:ASSIGNMENT_DUE:h1',
        read_at: null,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'notif-seed-002',
        type: 'EXAM_UPCOMING',
        title: '[SIAP-SIAP] 1 Jam Menuju Ujian: UTS Praktikum Backend & API',
        body: 'Pelaksanaan ujian online akan dimulai dalam 1 jam. Pastikan Anda telah berada di ruang ujian virtual dan koneksi internet stabil.',
        target_url: '/exams',
        class_id: classId,
        entity_type: 'quizzes',
        entity_id: 'quiz-demo-1',
        dedup_key: 'seed:EXAM:h1h',
        read_at: null,
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: 'notif-seed-003',
        type: 'ATTENDANCE_OPEN',
        title: 'Sesi Presensi Dibuka: Pertemuan ke-7 Rekayasa Perangkat Lunak',
        body: 'Dosen pengampu telah membuka presensi perkuliahan hari ini. Silakan scan QR code atau verifikasi lokasi sebelum sesi ditutup.',
        target_url: '/attendance',
        class_id: classId,
        entity_type: 'attendance',
        entity_id: 'att-sess-1',
        dedup_key: 'seed:ATTENDANCE:open',
        read_at: null,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'notif-seed-004',
        type: 'GRADE_PUBLISHED',
        title: 'Nilai Terbit: Kuis Evaluasi Algoritma Sorting',
        body: 'Nilai kuis mingguan Anda telah dinilai oleh dosen pengampu dan huruf mutu telah diperbarui.',
        target_url: `/classes/${classId}`,
        class_id: classId,
        entity_type: 'grades',
        entity_id: 'grd-001',
        dedup_key: 'seed:GRADE:pub',
        read_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'notif-seed-005',
        type: 'ANNOUNCEMENT_NEW',
        title: 'Pengumuman Resmi: Jadwal Libur Nasional & Kalender Revisi KRS',
        body: 'Biro Administrasi Akademik menerbitkan surat edaran terkait perpanjangan masa revisi KRS semester berjalan.',
        target_url: '/announcements',
        class_id: null,
        entity_type: 'announcements',
        entity_id: 'ann-001',
        dedup_key: 'seed:ANN:001',
        read_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    for (const item of seedItems) {
      store.push({
        ...item,
        id: randomUUID(),
        user_id: studentId,
        dedup_key: `${studentId}:${item.dedup_key}`,
      });
      store.push({
        ...item,
        id: randomUUID(),
        user_id: adminId,
        dedup_key: `${adminId}:${item.dedup_key}`,
      });
    }
  }
  getPersistentDedupSet(store);
  return store;
}

/**
 * Memeriksa secara persisten (tanpa kedaluwarsa 5 menit) apakah dedupKey sudah pernah dikirim.
 * Mengecek tabel `notifications.dedup_key` di Supabase (jika online) dan store aplikasi.
 */
export async function hasPersistentDedupKey(dedupKey: string): Promise<boolean> {
  if (!dedupKey) return false;

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('dedup_key', dedupKey)
        .limit(1)
        .maybeSingle();
      if (data?.id) return true;
    } catch {
      // fallback ke store aplikasi
    }
  }

  const store = getInMemoryNotifications();
  const dedupSet = getPersistentDedupSet(store);
  return dedupSet.has(dedupKey) || store.some((n) => n.dedup_key === dedupKey);
}

/**
 * Menyimpan dedupKey secara permanen ke store aplikasi (tanpa TTL).
 */
export function savePersistentDedupKey(dedupKey: string): void {
  if (!dedupKey) return;
  const store = getInMemoryNotifications();
  const dedupSet = getPersistentDedupSet(store);
  dedupSet.add(dedupKey);
}

export async function createInAppNotification(payload: NotifyPayload): Promise<NotificationRecord> {
  const online = await checkSupabaseOnline();
  const store = getInMemoryNotifications();
  const dedupSet = getPersistentDedupSet(store);

  if (payload.dedupKey) {
    const existing = store.find((n) => n.dedup_key === payload.dedupKey);
    if (existing) {
      dedupSet.add(payload.dedupKey);
      return existing;
    }
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  const record: NotificationRecord = {
    id,
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    target_url: payload.targetUrl || (payload.classId ? `/classes/${payload.classId}` : null),
    class_id: payload.classId || null,
    entity_type: payload.entityType || null,
    entity_id: payload.entityId || null,
    dedup_key: payload.dedupKey || null,
    read_at: null,
    created_at: createdAt,
  };

  if (online) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from('notifications').insert({
        id: record.id,
        user_id: record.user_id,
        type: record.type,
        title: record.title,
        body: record.body,
        target_url: record.target_url,
        class_id: record.class_id,
        entity_type: record.entity_type,
        entity_id: record.entity_id,
        dedup_key: record.dedup_key,
        created_at: record.created_at,
      });
      if (!error) {
        if (record.dedup_key) dedupSet.add(record.dedup_key);
        store.unshift(record);
        return record;
      }
    } catch (err) {
      console.warn('[InApp-Channel] Gagal simpan ke Supabase, fallback ke in-memory:', err);
    }
  }

  // Simpan ke in-memory store dan set dedup persisten
  if (record.dedup_key) {
    dedupSet.add(record.dedup_key);
  }
  store.unshift(record);
  return record;
}

export async function getInAppNotifications(userId: string, filter: 'all' | 'unread' = 'all'): Promise<NotificationRecord[]> {
  const online = await checkSupabaseOnline();

  if (online) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'unread') {
        query = query.is('read_at', null);
      }

      const { data } = await query;
      if (data) {
        return data.map((d: any) => ({
          id: d.id,
          user_id: d.user_id,
          type: d.type,
          title: d.title,
          body: d.body,
          target_url: d.target_url || (d.class_id ? `/classes/${d.class_id}` : null),
          class_id: d.class_id,
          entity_type: d.entity_type,
          entity_id: d.entity_id,
          dedup_key: d.dedup_key,
          read_at: d.read_at,
          created_at: d.created_at,
        }));
      }
    } catch {
      // fallback
    }
  }

  const store = getInMemoryNotifications();
  return store
    .filter((n) => n.user_id === userId && (filter === 'all' || !n.read_at))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function markInAppNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
  const online = await checkSupabaseOnline();
  const now = new Date().toISOString();

  if (online) {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('id', notificationId)
        .eq('user_id', userId);
      if (!error) return true;
    } catch {
      // fallback
    }
  }

  const store = getInMemoryNotifications();
  const item = store.find((n) => n.id === notificationId && n.user_id === userId);
  if (item) {
    item.read_at = now;
    return true;
  }
  return false;
}

export async function markAllInAppNotificationsAsRead(userId: string): Promise<number> {
  const online = await checkSupabaseOnline();
  const now = new Date().toISOString();

  if (online) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', userId)
        .is('read_at', null)
        .select('id');
      if (!error && data) return data.length;
    } catch {
      // fallback
    }
  }

  const store = getInMemoryNotifications();
  let count = 0;
  store
    .filter((n) => n.user_id === userId && !n.read_at)
    .forEach((n) => {
      n.read_at = now;
      count++;
    });
  return count;
}
