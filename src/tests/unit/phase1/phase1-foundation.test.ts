import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPolicy,
  getAllPoliciesAction,
  updatePolicyAction,
  DEFAULT_INSTITUTION_POLICIES,
} from '@/lib/policies';
import { evaluasiKelayakanUjianAsync } from '@/lib/akademik/syarat-ujian-server';
import {
  scheduleNotification,
  processScheduledNotifications,
  getScheduledStore,
} from '@/modules/notifications/scheduled';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';
import { listClassQuizzesAction, getQuizDetailAction } from '@/modules/academic/quiz-actions';
import { getQuizStore } from '@/modules/academic/quiz-store';
import * as identityModule from '@/modules/identity/actions';
import * as auditModule from '@/lib/audit';

describe('SIAJAR Fase 1: Fondasi Bersama', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Kebijakan Institusi Terkonfigurasi (institution_policies & Lampiran A)', () => {
    it('membaca seluruh nilai bawaan Lampiran A melalui getPolicy<T>()', async () => {
      const minAtt = await getPolicy<number>('min_attendance_percent');
      expect(minAtt).toBe(75);

      const excuseMode = await getPolicy<string>('attendance_excused_mode');
      expect(excuseMode).toBe('exclude');

      const disputeDays = await getPolicy<number>('dispute_window_days');
      expect(disputeDays).toBe(7);

      const sickProof = await getPolicy<boolean>('sick_requires_attachment');
      expect(sickProof).toBe(true);

      const retentionDays = await getPolicy<number>('absence_proof_retention_days');
      expect(retentionDays).toBe(180);

      const journalDays = await getPolicy<number>('journal_deadline_days');
      expect(journalDays).toBe(3);

      const examGrace = await getPolicy<number>('exam_grace_seconds');
      expect(examGrace).toBe(20);

      const edomMin = await getPolicy<number>('evaluation_min_respondents');
      expect(edomMin).toBe(5);

      const allowedHosts = await getPolicy<string[]>('meeting_allowed_hosts');
      expect(Array.isArray(allowedHosts)).toBe(true);
      expect(allowedHosts).toContain('meet.google.com');
      expect(allowedHosts).toContain('zoom.us');

      const simThreshold = await getPolicy<number>('similarity_default_threshold');
      expect(simThreshold).toBe(0.60);

      const cpmkPass = await getPolicy<number>('cpmk_pass_threshold');
      expect(cpmkPass).toBe(60);
    });

    it('menolak pengubahan kebijakan oleh peran non-admin (STUDENT / LECTURER)', async () => {
      vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue({
        user: { id: 'std-test-1', name: 'Ahmad Mahasiswa' } as any,
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      } as any);

      const res = await updatePolicyAction('min_attendance_percent', 80);
      expect(res.ok).toBe(false);
      expect(res.error).toContain('Hanya Administrator');
    });

    it('mengizinkan pengubahan kebijakan oleh SUPER_ADMIN dan mencatat audit log', async () => {
      vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue({
        user: { id: 'admin-super-1', name: 'Super Admin SIAJAR' } as any,
        roles: ['SUPER_ADMIN'],
        activeRole: 'SUPER_ADMIN',
      } as any);

      const auditSpy = vi.spyOn(auditModule, 'recordSystemAuditLog').mockResolvedValue(true as any);

      const res = await updatePolicyAction('min_attendance_percent', 80);
      expect(res.ok).toBe(true);
      expect(res.data?.value).toBe(80);

      // Verifikasi audit log tercatat
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'institution_policy.update',
          entityType: 'institution_policies',
          entityId: 'min_attendance_percent',
          valueAfter: JSON.stringify(80),
        })
      );

      // Pastikan getPolicy mengembalikan nilai baru dari cache
      const updatedVal = await getPolicy<number>('min_attendance_percent');
      expect(updatedVal).toBe(80);
    });

    it('evaluasiKelayakanUjianAsync membaca ambang batas dari kebijakan institusi', async () => {
      // Kehadiran 78%: jika batas 75% -> layak. Jika batas diubah ke 80% -> tidak layak.
      vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue({
        user: { id: 'admin-super-1', name: 'Super Admin SIAJAR' } as any,
        roles: ['SUPER_ADMIN'],
        activeRole: 'SUPER_ADMIN',
      } as any);

      await updatePolicyAction('min_attendance_percent', 80);

      const hasil = await evaluasiKelayakanUjianAsync({
        krsStatus: 'DISETUJUI',
        uktStatus: 'LUNAS',
        persentaseKehadiran: 78,
      });

      expect(hasil.kehadiranTerpenuhi).toBe(false);
      expect(hasil.layak).toBe(false);
      expect(hasil.alasanTidakLayak[0]).toContain('kurang dari batas minimal (80%)');

      // Kembalikan ke 75%
      await updatePolicyAction('min_attendance_percent', 75);
      const hasilNormal = await evaluasiKelayakanUjianAsync({
        krsStatus: 'DISETUJUI',
        uktStatus: 'LUNAS',
        persentaseKehadiran: 78,
      });
      expect(hasilNormal.kehadiranTerpenuhi).toBe(true);
      expect(hasilNormal.layak).toBe(true);
    });
  });

  describe('2. Rilis Terjadwal (release_at)', () => {
    const classId = 'c0000000-0000-0000-0000-000000000001';

    it('menyembunyikan kuis dengan release_at di masa depan untuk peran STUDENT', async () => {
      const store = getQuizStore();
      const futureQuizId = 'quiz-future-test';

      // Hapus jika sudah ada
      store.quizzes = store.quizzes.filter((q) => q.id !== futureQuizId);

      store.quizzes.push({
        id: futureQuizId,
        class_id: classId,
        title: 'Kuis Bab 5 Terjadwal Masa Depan',
        duration_minutes: 30,
        due_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        release_at: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 hari ke depan
        questions: [],
        total_points: 50,
        is_published: true,
        created_at: new Date().toISOString(),
      });

      // 1. Dosen Pengampu melihat kuis
      vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue({
        user: { id: 'a0000002-0000-0000-0000-000000000002', name: 'Dr. Budi' } as any,
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      } as any);
      const lecturerList = await listClassQuizzesAction(classId);
      expect(lecturerList.some((q) => q.id === futureQuizId)).toBe(true);

      const lecturerDetail = await getQuizDetailAction(futureQuizId);
      expect(lecturerDetail).not.toBeNull();

      // 2. Mahasiswa TIDAK melihat kuis sebelum release_at
      vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue({
        user: { id: 'a0000001-0000-0000-0000-000000000001', name: 'Ahmad Mahasiswa' } as any,
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      } as any);
      const studentList = await listClassQuizzesAction(classId);
      expect(studentList.some((q) => q.id === futureQuizId)).toBe(false);

      const studentDetail = await getQuizDetailAction(futureQuizId);
      expect(studentDetail).toBeNull();
    });
  });

  describe('3. Notifikasi Terjadwal (scheduled_notifications)', () => {
    it('menjadwalkan notifikasi secara idempoten dengan dedupeKey', async () => {
      const dedupeKey = `test-dedupe-${Date.now()}`;
      const res1 = await scheduleNotification({
        userId: 'mhs-101',
        kind: 'TENGGAT_DIPERPANJANG',
        payload: {
          title: 'Tenggat Tugas Diperpanjang',
          body: 'Dosen memberikan perpanjangan waktu pengumpulan Tugas 1.',
        },
        dedupeKey,
      });

      expect(res1.ok).toBe(true);
      const firstId = res1.data?.id;

      // Pemanggilan kedua dengan dedupeKey sama harus idempoten (mengembalikan ID sama)
      const res2 = await scheduleNotification({
        userId: 'mhs-101',
        kind: 'TENGGAT_DIPERPANJANG',
        payload: {
          title: 'Tenggat Tugas Diperpanjang',
          body: 'Dosen memberikan perpanjangan waktu pengumpulan Tugas 1.',
        },
        dedupeKey,
      });

      expect(res2.ok).toBe(true);
      expect(res2.data?.id).toBe(firstId);
    });

    it('memproses notifikasi terjadwal yang jatuh tempo dan mengisi sent_at', async () => {
      const pastSendAt = new Date(Date.now() - 60000); // 1 menit yang lalu
      const notifRes = await scheduleNotification({
        userId: 'a0000001-0000-0000-0000-000000000001',
        kind: 'MATERI_TERBUKA',
        payload: {
          title: 'Modul Perkuliahan Terbuka',
          body: 'Modul Pertemuan ke-4 kini dapat diakses.',
        },
        sendAt: pastSendAt,
      });

      expect(notifRes.ok).toBe(true);

      const processRes = await processScheduledNotifications();
      expect(processRes.processedCount).toBeGreaterThanOrEqual(1);

      // Verifikasi sent_at terisi
      const store = getScheduledStore();
      const item = store.find((s) => s.id === notifRes.data?.id);
      expect(item?.sent_at).not.toBeNull();
    });
  });

  describe('4. Keamanan Endpoint Cron (Authorization: Bearer ${CRON_SECRET})', () => {
    it('menolak permintaan cron jika header Authorization tidak ada atau tidak valid (fail-closed)', () => {
      process.env.CRON_SECRET = 'secret_testing_siajar_2026';

      // 1. Tanpa header
      const reqTanpaHeader = new Request('http://localhost:3000/api/cron/scheduled-notifications');
      expect(isAuthorizedCronRequest(reqTanpaHeader)).toBe(false);

      // 2. Token salah
      const reqTokenSalah = new Request('http://localhost:3000/api/cron/scheduled-notifications', {
        headers: { authorization: 'Bearer token_salah_123' },
      });
      expect(isAuthorizedCronRequest(reqTokenSalah)).toBe(false);

      // 3. Format header tidak valid (bukan Bearer)
      const reqBukanBearer = new Request('http://localhost:3000/api/cron/scheduled-notifications', {
        headers: { authorization: 'Basic secret_testing_siajar_2026' },
      });
      expect(isAuthorizedCronRequest(reqBukanBearer)).toBe(false);

      // 4. CRON_SECRET tidak disetel di server
      delete process.env.CRON_SECRET;
      const reqValidTapiEnvKosong = new Request('http://localhost:3000/api/cron/scheduled-notifications', {
        headers: { authorization: 'Bearer secret_testing_siajar_2026' },
      });
      expect(isAuthorizedCronRequest(reqValidTapiEnvKosong)).toBe(false);
    });

    it('mengizinkan permintaan cron jika Authorization Bearer cocok dengan CRON_SECRET', () => {
      process.env.CRON_SECRET = 'super_secret_cron_key_uir_2026';

      const reqValid = new Request('http://localhost:3000/api/cron/scheduled-notifications', {
        headers: { authorization: 'Bearer super_secret_cron_key_uir_2026' },
      });

      expect(isAuthorizedCronRequest(reqValid)).toBe(true);
    });
  });
});
