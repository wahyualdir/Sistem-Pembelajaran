import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockCurrentUser: {
  user: { id: string; email?: string; name?: string };
  profile?: { full_name?: string };
  roles: string[];
  activeRole: string;
} | null = null;

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [], error: null })) })),
    })),
  })),
}));

vi.mock('@/lib/audit', () => ({
  recordSystemAuditLog: vi.fn(async () => {}),
}));

import {
  updateSessionDeliveryModeAction,
  applyMeetingUrlToAllSessionsAction,
  getSessionOnlineDetailAction,
} from '@/modules/academic/online-meeting-actions';

import {
  recordMaterialOpenAction,
  toggleMaterialCompleteAction,
  getMaterialDetailDirectAction,
} from '@/modules/academic/material-progress-actions';

describe('Uji Server-Action dan Otorisasi: Tautan Kuliah Daring (10.3) & Akses Materi Terkunci (10.4)', () => {
  const classA = 'c0000000-0000-0000-0000-000000000001';
  const enrolledStudent = '00000000-0000-0000-0000-000000000007';
  const outsiderStudent = '00000000-0000-0000-0000-000000000088';
  const lecturerA = '00000000-0000-0000-0000-000000000004';

  beforeEach(() => {
    mockCurrentUser = null;
    (globalThis as any).__siajarAkademik = {
      classes: [{ id: classA, title: 'Rekayasa Perangkat Lunak', created_by: lecturerA }],
      enrollments: [{ class_id: classA, student_id: enrolledStudent, status: 'ACTIVE' }],
    };
  });

  describe('1. Fitur 10.3: Tautan Kuliah Daring & Rekaman', () => {
    it('menolak host URL di luar daftar putih resmi (whitelist) saat dosen mengatur sesi', async () => {
      mockCurrentUser = {
        user: { id: lecturerA, email: 'dosen@kampus.ac.id' },
        profile: { full_name: 'Dr. Dosen' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };

      const maliciousUrls = [
        'https://evil-phishing.com/meeting/123',
        'http://zoom.phishing-malware.org/room',
        'https://attacker-stealer.site/kuliah',
        'javascript:alert(1)',
      ];

      for (const url of maliciousUrls) {
        const res = await updateSessionDeliveryModeAction({
          sessionId: 'sesi-1',
          classId: classA,
          deliveryMode: 'daring',
          meetingUrl: url,
        });

        expect(res.ok).toBe(false);
        expect(res.error).toBeDefined();
        expect(res.error).toMatch(/belum diizinkan|tidak diizinkan|daftar putih|whitelist|protokol HTTPS/i);
      }
    });

    it('menolak URL di luar daftar putih saat menerapkan serentak ke semua sesi', async () => {
      mockCurrentUser = {
        user: { id: lecturerA, email: 'dosen@kampus.ac.id' },
        profile: { full_name: 'Dr. Dosen' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };

      const res = await applyMeetingUrlToAllSessionsAction(
        classA,
        'https://unapproved-service.external.net/meeting'
      );

      expect(res.ok).toBe(false);
      expect(res.count).toBe(0);
      expect(res.error).toMatch(/belum diizinkan|tidak diizinkan|daftar putih|whitelist/i);
    });

    it('menerima host URL yang valid dan ada di daftar putih (Google Meet, Zoom, Teams, dsb)', async () => {
      mockCurrentUser = {
        user: { id: lecturerA, email: 'dosen@kampus.ac.id' },
        profile: { full_name: 'Dr. Dosen' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };

      const validUrls = [
        'https://meet.google.com/abc-defg-hij',
        'https://zoom.us/j/1234567890?pwd=abc',
        'https://teams.microsoft.com/l/meetup-join/xyz',
      ];

      for (const url of validUrls) {
        const res = await updateSessionDeliveryModeAction({
          sessionId: 'sesi-1',
          classId: classA,
          deliveryMode: 'daring',
          meetingUrl: url,
        });

        expect(res.ok).toBe(true);
        expect(res.data?.meetingUrl).toBe(url);
      }
    });

    it('melindungi tautan kuliah daring dari non-anggota kelas (mahasiswa luar mendapat meetingUrl null)', async () => {
      // 1. Dosen simpan tautan daring
      mockCurrentUser = {
        user: { id: lecturerA, email: 'dosen@kampus.ac.id' },
        profile: { full_name: 'Dr. Dosen' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };

      await updateSessionDeliveryModeAction({
        sessionId: 'sesi-103',
        classId: classA,
        deliveryMode: 'daring',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        recordingUrl: 'https://drive.google.com/file/d/12345/view',
      });

      // 2. Mahasiswa luar (tidak terdaftar di kelas) mencoba membaca detail sesi daring
      mockCurrentUser = {
        user: { id: outsiderStudent, email: 'outsider@kampus.ac.id' },
        profile: { full_name: 'Mahasiswa Luar' },
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      };

      const outsiderDetail = await getSessionOnlineDetailAction('sesi-103', classA);
      expect(outsiderDetail.meetingUrl).toBeNull();
      expect(outsiderDetail.recordingUrl).toBeNull();
      expect(outsiderDetail.joinStatus.active).toBe(false);
      expect(outsiderDetail.joinStatus.reason).toContain('Akses ditolak: Anda bukan peserta terdaftar');

      // 3. Mahasiswa yang terdaftar sah dapat melihat tautan daring
      mockCurrentUser = {
        user: { id: enrolledStudent, email: 'mhs@kampus.ac.id' },
        profile: { full_name: 'Mahasiswa Resmi' },
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      };

      const enrolledDetail = await getSessionOnlineDetailAction('sesi-103', classA);
      expect(enrolledDetail.meetingUrl).toBe('https://meet.google.com/abc-defg-hij');
      expect(enrolledDetail.recordingUrl).toBe('https://drive.google.com/file/d/12345/view');
    });
  });

  describe('2. Fitur 10.4: Progres Materi & Pencegahan Akses Langsung Materi Terkunci', () => {
    it('menolak akses langsung (URL / query) ke materi yang terkunci bagi mahasiswa', async () => {
      mockCurrentUser = {
        user: { id: enrolledStudent, email: 'mhs@kampus.ac.id' },
        profile: { full_name: 'Mahasiswa Resmi' },
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      };

      // Materi Bab 2 mensyaratkan Bab 1 selesai
      const materialBab2 = {
        id: 'mat-bab-2',
        title: 'Bab 2: Desain Arsitektur Perangkat Lunak',
        body_md: '# Rincian Rahasia Materi Bab 2\nKonten penting kuliah...',
        unlock_after_material_id: 'mat-bab-1',
        require_completion: true,
        previous_title: 'Bab 1: Pendahuluan Rekayasa Perangkat Lunak',
      };

      // Mahasiswa belum menyelesaikan Bab 1 -> direct access ditolak
      const resLocked = await getMaterialDetailDirectAction('mat-bab-2', classA, materialBab2);
      expect(resLocked.ok).toBe(false);
      expect(resLocked.unlocked).toBe(false);
      expect(resLocked.material).toBeUndefined();
      expect(resLocked.lockMessage).toContain('Bab 1: Pendahuluan Rekayasa Perangkat Lunak');

      // Mahasiswa mencoba membuka recordOpen -> ditolak
      const openAttempt = await recordMaterialOpenAction(
        'mat-bab-2',
        classA,
        'mat-bab-1',
        true,
        'Bab 1: Pendahuluan'
      );
      expect(openAttempt.ok).toBe(false);
      expect(openAttempt.unlocked).toBe(false);

      // Setelah Bab 1 diselesaikan
      await toggleMaterialCompleteAction('mat-bab-1', true);

      // Sekarang akses Bab 2 menjadi terbuka
      const resUnlocked = await getMaterialDetailDirectAction('mat-bab-2', classA, materialBab2);
      expect(resUnlocked.ok).toBe(true);
      expect(resUnlocked.unlocked).toBe(true);
      expect(resUnlocked.material?.bodyMd).toContain('Rincian Rahasia Materi Bab 2');
    });

    it('memperbolehkan Dosen mengakses materi langsung tanpa terhalang prasyarat penyelesaian', async () => {
      mockCurrentUser = {
        user: { id: lecturerA, email: 'dosen@kampus.ac.id' },
        profile: { full_name: 'Dr. Dosen' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };

      const materialBab2 = {
        id: 'mat-bab-2',
        title: 'Bab 2: Desain Arsitektur Perangkat Lunak',
        body_md: '# Rincian Rahasia Materi Bab 2\nKonten penting kuliah...',
        unlock_after_material_id: 'mat-bab-1',
        require_completion: true,
        previous_title: 'Bab 1: Pendahuluan',
      };

      const res = await getMaterialDetailDirectAction('mat-bab-2', classA, materialBab2);
      expect(res.ok).toBe(true);
      expect(res.unlocked).toBe(true);
      expect(res.material?.bodyMd).toContain('Rincian Rahasia Materi Bab 2');
    });

    it('menolak pengguna yang belum terautentikasi (unauthenticated)', async () => {
      mockCurrentUser = null;

      const resMeeting = await updateSessionDeliveryModeAction({
        sessionId: 'sesi-1',
        classId: classA,
        deliveryMode: 'daring',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
      });
      expect(resMeeting.ok).toBe(false);
      expect(resMeeting.error).toContain('Silakan masuk');

      const resMaterial = await getMaterialDetailDirectAction('mat-1', classA);
      expect(resMaterial.ok).toBe(false);
      expect(resMaterial.error).toContain('Silakan masuk');
    });
  });
});
