import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockCurrentUser: {
  user: { id: string; name?: string; email?: string; user_metadata?: Record<string, any> };
  roles: string[];
  activeRole: string;
} | null = null;

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

import {
  notify,
  createInAppNotification,
  getInAppNotifications,
  markInAppNotificationAsRead,
  markAllInAppNotificationsAsRead,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  runScheduledReminders,
  defaultWhatsAppAdapter,
  sendEmailNotification,
  sendNotificationAction,
  triggerScheduledRemindersAction,
} from '@/modules/notifications';
import { createQuizAction } from '@/modules/academic/quiz-actions';
import { getQuizStore } from '@/lib/auth/class-access';
import { GET as getCronReminders } from '@/app/api/cron/reminders/route';
import { GET as getCronEarlyWarning } from '@/app/api/cron/early-warning/route';
import { NextRequest } from 'next/server';

describe('Sistem Notifikasi & Pengingat Otomatis SIAJAR', () => {
  const testUserId = 'test-user-0000-0000-000000000001';

  beforeEach(() => {
    (globalThis as any).__siajarNotif = [];
    (globalThis as any).__siajarNotifDedup = new Set<string>();
    (globalThis as any).__siajarNotifPrefs = {};
    vi.restoreAllMocks();
    mockCurrentUser = null;
  });

  describe('1. In-App Notifications & Read Status', () => {
    it('berhasil membuat notifikasi in-app dengan atribut lengkap', async () => {
      const record = await createInAppNotification({
        userId: testUserId,
        type: 'ASSIGNMENT_DUE',
        title: 'Tenggat Tugas Pemrograman Web',
        body: 'Kumpulkan sebelum jam 23:59 WIB.',
        targetUrl: '/classes/cls-123',
        classId: 'cls-123',
        dedupKey: 'dedup-test-1',
      });

      expect(record.id).toBeDefined();
      expect(record.user_id).toBe(testUserId);
      expect(record.title).toBe('Tenggat Tugas Pemrograman Web');
      expect(record.read_at).toBeNull();
      expect(record.target_url).toBe('/classes/cls-123');
      expect(record.dedup_key).toBe('dedup-test-1');
    });

    it('mendukung filter semua vs belum dibaca', async () => {
      await createInAppNotification({
        userId: testUserId,
        type: 'GENERAL',
        title: 'Notif 1',
        body: 'Isi 1',
      });
      const notif2 = await createInAppNotification({
        userId: testUserId,
        type: 'GENERAL',
        title: 'Notif 2',
        body: 'Isi 2',
      });

      await markInAppNotificationAsRead(testUserId, notif2.id);

      const allItems = await getInAppNotifications(testUserId, 'all');
      const unreadItems = await getInAppNotifications(testUserId, 'unread');

      expect(allItems.length).toBe(2);
      expect(unreadItems.length).toBe(1);
      expect(unreadItems[0].title).toBe('Notif 1');
    });

    it('menandai seluruh notifikasi sekaligus', async () => {
      await createInAppNotification({ userId: testUserId, type: 'A', title: 'T1', body: 'B1' });
      await createInAppNotification({ userId: testUserId, type: 'B', title: 'T2', body: 'B2' });

      const count = await markAllInAppNotificationsAsRead(testUserId);
      expect(count).toBe(2);

      const unreadRemaining = await getInAppNotifications(testUserId, 'unread');
      expect(unreadRemaining.length).toBe(0);
    });
  });

  describe('2. Deduplikasi Persisten Tanpa Kedaluwarsa (Tahap C1)', () => {
    it('mencegah pengiriman notifikasi ganda untuk dedupKey yang sama meski jeda waktu > 5 menit / berhari-hari', async () => {
      vi.useFakeTimers();
      try {
        const dedupKey = `${testUserId}:ASSIGNMENT_DUE:assn-999:H_1`;

        const firstSend = await notify({
          userId: testUserId,
          type: 'ASSIGNMENT_DUE',
          title: 'Pengingat Tugas H-1',
          body: 'Sisa waktu 24 jam.',
          dedupKey,
        });

        expect(firstSend.ok).toBe(true);
        expect(firstSend.skippedDueToDedup).toBe(false);
        const storedAfterFirst = await getInAppNotifications(testUserId, 'all');
        expect(storedAfterFirst[0]?.dedup_key).toBe(dedupKey);

        // Majukan waktu 6 jam (360 menit, jauh melewati 5 menit)
        vi.advanceTimersByTime(6 * 60 * 60 * 1000);

        const secondSend = await notify({
          userId: testUserId,
          type: 'ASSIGNMENT_DUE',
          title: 'Pengingat Tugas H-1 (Percobaan Ulang Setelah 6 Jam)',
          body: 'Sisa waktu 18 jam.',
          dedupKey,
        });

        expect(secondSend.ok).toBe(true);
        expect(secondSend.skippedDueToDedup).toBe(true);
        expect(secondSend.dispatchedChannels.length).toBe(0);

        // Bahkan jika Set dedup di-reset, pengecekan tetap membaca kolom dedup_key pada tabel/store notifikasi
        (globalThis as any).__siajarNotifDedup = new Set<string>();
        vi.advanceTimersByTime(24 * 60 * 60 * 1000);

        const thirdSend = await notify({
          userId: testUserId,
          type: 'ASSIGNMENT_DUE',
          title: 'Pengingat Tugas H-1 (Hari Berikutnya)',
          body: 'Percobaan ulang.',
          dedupKey,
        });

        expect(thirdSend.ok).toBe(true);
        expect(thirdSend.skippedDueToDedup).toBe(true);
        expect(thirdSend.dispatchedChannels.length).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('3. Multi-Channel, Nomor WhatsApp Profil & Preferensi Pengguna (Tahap C6 & D)', () => {
    it('in-app channel selalu aktif secara wajib', async () => {
      const prefs = await updateUserNotificationPreferences(testUserId, {
        channels: { in_app: false as any, email: false, whatsapp: false },
      });

      expect(prefs.channels.in_app).toBe(true);
    });

    it('menghormati preferensi penonaktifan kategori event termasuk grades dan forum_and_early_warning', async () => {
      await updateUserNotificationPreferences(testUserId, {
        events: {
          exam_upcoming: false,
          grades: false,
          forum_and_early_warning: false,
        },
      });

      const resExam = await notify({
        userId: testUserId,
        type: 'EXAM_UPCOMING',
        title: 'Jadwal UTS',
        body: 'Besok jam 08:00 WIB',
      });
      expect(resExam.ok).toBe(true);
      expect(resExam.dispatchedChannels.length).toBe(0);

      const resGrade = await notify({
        userId: testUserId,
        type: 'GRADE_PUBLISHED',
        title: 'Nilai Tugas 1 Terbit',
        body: 'Nilai Anda telah dipublikasikan.',
      });
      expect(resGrade.ok).toBe(true);
      expect(resGrade.dispatchedChannels.length).toBe(0);

      const resForum = await notify({
        userId: testUserId,
        type: 'FORUM_REPLY',
        title: 'Balasan Baru di Forum',
        body: 'Dosen membalas diskusi Anda.',
      });
      expect(resForum.ok).toBe(true);
      expect(resForum.dispatchedChannels.length).toBe(0);

      const resEw = await notify({
        userId: testUserId,
        type: 'EARLY_WARNING',
        title: 'Peringatan Akademik',
        body: 'Presensi Anda mendekati batas minimum.',
      });
      expect(resEw.ok).toBe(true);
      expect(resEw.dispatchedChannels.length).toBe(0);

      // Aktifkan kembali grades dan forum_and_early_warning
      await updateUserNotificationPreferences(testUserId, {
        events: {
          grades: true,
          forum_and_early_warning: true,
        },
      });

      const resGradeEnabled = await notify({
        userId: testUserId,
        type: 'GRADE_PUBLISHED',
        title: 'Nilai Tugas 2 Terbit',
        body: 'Nilai Anda telah dipublikasikan.',
      });
      expect(resGradeEnabled.dispatchedChannels).toContain('IN_APP');

      const resForumEnabled = await notify({
        userId: testUserId,
        type: 'FORUM_REPLY',
        title: 'Balasan Baru di Forum 2',
        body: 'Rekan kelas membalas diskusi Anda.',
      });
      expect(resForumEnabled.dispatchedChannels).toContain('IN_APP');
    });

    it('mengirim WhatsApp memakai nomor dari profil/preferensi pengguna, dan melewati tanpa error jika nomor tidak ada', async () => {
      const waSpy = vi.spyOn(defaultWhatsAppAdapter, 'sendMessage');

      // Kasus 1: Kanal WA aktif, tetapi nomor telepon tidak ada -> lewati kanal WA tanpa error
      await updateUserNotificationPreferences(testUserId, {
        channels: { in_app: true, email: false, whatsapp: true },
        phone_number: null,
      });

      const resNoPhone = await notify({
        userId: testUserId,
        type: 'ASSIGNMENT_NEW',
        title: 'Tugas Baru Tanpa Nomor WA',
        body: 'Silakan cek tugas di kelas.',
      });

      expect(resNoPhone.ok).toBe(true);
      expect(resNoPhone.dispatchedChannels).toContain('IN_APP');
      expect(resNoPhone.dispatchedChannels).not.toContain('WHATSAPP');
      expect(waSpy).not.toHaveBeenCalled();

      // Kasus 2: Pengguna memiliki nomor telepon di profil/preferensi -> terkirim ke nomor tersebut (bukan dummy 628000000000)
      await updateUserNotificationPreferences(testUserId, {
        channels: { in_app: true, email: false, whatsapp: true },
        phone_number: '6281298765432',
      });

      const resWithPhone = await notify({
        userId: testUserId,
        type: 'ASSIGNMENT_NEW',
        title: 'Tugas Baru Dengan Nomor WA',
        body: 'Silakan cek tugas di kelas.',
      });

      expect(resWithPhone.ok).toBe(true);
      expect(resWithPhone.dispatchedChannels).toContain('WHATSAPP');
      expect(waSpy).toHaveBeenCalledTimes(1);
      expect(waSpy.mock.calls[0][0]).toBe('6281298765432');
      expect(waSpy.mock.calls[0][0]).not.toBe('628000000000');
    });

    it('adapter WhatsApp berupa antarmuka dengan implementasi no-op aman', async () => {
      const res = await defaultWhatsAppAdapter.sendMessage('628123456789', 'Uji Pesan WA');
      expect(res.success).toBe(true);
      expect(res.simulated).toBe(true);
    });

    it('kanal email menangani fallback simulasi saat SMTP belum disetel tanpa crashing', async () => {
      const res = await sendEmailNotification({
        to: 'user@siajar.test',
        subject: 'Uji Email',
        bodyText: 'Pengujian kanal email',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('4. Automated Scheduler & Sinkronisasi Store Kuis (__siajarKuis) (Tahap C2)', () => {
    it('mengirim EXAM_UPCOMING untuk ujian yang dibuat lewat createQuizAction', async () => {
      const classId = 'c0000000-0000-0000-0000-000000000001';
      const lecturerId = 'a0000002-0000-0000-0000-000000000002';
      const studentId = 'a0000001-0000-0000-0000-000000000001';

      (globalThis as any).__siajarAkademik = {
        classes: [
          {
            id: classId,
            title: 'Pemrograman Web & Cloud',
            created_by: lecturerId,
            status: 'OPEN',
          },
        ],
        enrollments: [
          {
            class_id: classId,
            student_id: studentId,
            student_name: 'Ahmad Mahasiswa',
            status: 'ACTIVE',
          },
        ],
      };

      const quizStore = getQuizStore();
      quizStore.quizzes = [];
      quizStore.attempts = [];

      mockCurrentUser = {
        user: { id: lecturerId, name: 'Dr. Budi Santoso' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };

      const dueIn90Mins = new Date(Date.now() + 90 * 60 * 1000).toISOString();
      const createRes = await createQuizAction({
        class_id: classId,
        title: 'UTS Pemrograman Web Terjadwal',
        description: 'Ujian Tengah Semester berbasis CBT',
        exam_type: 'UTS',
        duration_minutes: 60,
        due_at: dueIn90Mins,
        questions: [
          {
            question_text: 'Apa protokol dasar komunikasi web?',
            question_type: 'MULTIPLE_CHOICE',
            options: ['HTTP', 'FTP', 'SMTP', 'SSH'],
            correct_answer_index: 0,
            points: 100,
          },
        ],
      });

      expect(createRes.ok).toBe(true);
      expect(quizStore.quizzes.some((q) => q.title === 'UTS Pemrograman Web Terjadwal')).toBe(true);

      const reminderResult = await runScheduledReminders();
      expect(reminderResult.errors).toEqual([]);
      expect(reminderResult.remindersDispatched).toBeGreaterThanOrEqual(1);

      const studentNotifs = await getInAppNotifications(studentId, 'all');
      const examUpcomingNotif = studentNotifs.find(
        (n) => n.type === 'EXAM_UPCOMING' && n.title.includes('UTS Pemrograman Web Terjadwal')
      );
      expect(examUpcomingNotif).toBeDefined();
      expect(examUpcomingNotif?.dedup_key).toContain(`${studentId}:EXAM_UPCOMING:${createRes.data?.id}`);

      const secondRun = await runScheduledReminders();
      expect(secondRun.skippedDuplicates).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Otorisasi Server Action & Proteksi Cron Endpoint (Tahap D)', () => {
    it('menolak sendNotificationAction dan triggerScheduledRemindersAction untuk tanpa sesi maupun STUDENT', async () => {
      // Tanpa sesi (null)
      mockCurrentUser = null;
      const anonSend = await sendNotificationAction({
        userId: testUserId,
        type: 'GENERAL',
        title: 'Injeksi Anonim',
        body: 'Pesan ilegal tanpa login',
      });
      expect(anonSend.ok).toBe(false);
      expect(anonSend.error).toContain('FORBIDDEN');

      const anonTrigger = await triggerScheduledRemindersAction();
      expect(anonTrigger.ok).toBe(false);

      // Role STUDENT
      mockCurrentUser = {
        user: { id: 'std-1', name: 'Mahasiswa Biasa' },
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      };
      const studentSend = await sendNotificationAction({
        userId: testUserId,
        type: 'GENERAL',
        title: 'Injeksi Mahasiswa',
        body: 'Pesan palsu dari mahasiswa ke pengguna lain',
      });
      expect(studentSend.ok).toBe(false);
      expect(studentSend.error).toContain('FORBIDDEN');

      const studentTrigger = await triggerScheduledRemindersAction();
      expect(studentTrigger.ok).toBe(false);
      expect(studentTrigger.error).toContain('FORBIDDEN');

      // Pastikan tidak ada notifikasi yang masuk ke target
      const targetNotifs = await getInAppNotifications(testUserId, 'all');
      expect(targetNotifs.length).toBe(0);
    });

    it('endpoint cron /api/cron/reminders dan /api/cron/early-warning menolak permintaan tanpa CRON_SECRET yang valid (fail-closed)', async () => {
      const prevSecret = process.env.CRON_SECRET;
      try {
        // 1. Jika CRON_SECRET belum diset di environment -> fail-closed (401)
        delete process.env.CRON_SECRET;
        const reqNoEnv = new NextRequest('http://localhost:3000/api/cron/reminders', {
          headers: { authorization: 'Bearer anything' },
        });
        const resNoEnv = await getCronReminders(reqNoEnv);
        expect(resNoEnv.status).toBe(401);

        // 2. Jika CRON_SECRET diset, tapi request tanpa header atau token salah -> 401
        process.env.CRON_SECRET = 'secret-test-cron-2026';

        const reqMissingHeader = new NextRequest('http://localhost:3000/api/cron/reminders');
        const resMissingHeader = await getCronReminders(reqMissingHeader);
        expect(resMissingHeader.status).toBe(401);

        const reqWrongToken = new NextRequest('http://localhost:3000/api/cron/early-warning', {
          headers: { authorization: 'Bearer wrong-token' },
        });
        const resWrongToken = await getCronEarlyWarning(reqWrongToken);
        expect(resWrongToken.status).toBe(401);

        // 3. Jika header Authorization: Bearer ${CRON_SECRET} tepat -> 200
        const reqValid = new NextRequest('http://localhost:3000/api/cron/reminders', {
          headers: { authorization: 'Bearer secret-test-cron-2026' },
        });
        const resValid = await getCronReminders(reqValid);
        expect(resValid.status).toBe(200);
      } finally {
        if (prevSecret === undefined) {
          delete process.env.CRON_SECRET;
        } else {
          process.env.CRON_SECRET = prevSecret;
        }
      }
    });
  });
});
