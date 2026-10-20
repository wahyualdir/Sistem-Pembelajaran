import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listPendingReviewsAction } from '../src/modules/academic/actions';
import * as identityModule from '../src/modules/identity/actions';

describe('Redesain Modern Retro Portal Dosen & Asisten (Fase 1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Akses & Antrean Penilaian Dosen (listPendingReviewsAction)', () => {
    it('mengembalikan daftar tugas pending ketika aktor adalah LECTURER', async () => {
      vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue({
        user: { id: 'dosen-001', email: 'dosen1@siajar.ac.id' } as any,
        profile: { id: 'dosen-001', full_name: 'Dr. Dosen Pengampu, M.Kom.', email: 'dosen1@siajar.ac.id', status: 'ACTIVE', must_change_password: false },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
        isImpersonating: false,
        impersonatingFrom: null,
        isNewAccount: false,
      });

      const res = await listPendingReviewsAction();
      expect(res).toBeDefined();
      expect(typeof res.classes).toBe('number');
      expect(Array.isArray(res.items)).toBe(true);
    });

    it('mengembalikan antrean peninjauan ketika aktor adalah TEACHING_ASSISTANT', async () => {
      vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue({
        user: { id: 'ta-001', email: 'ta1@siajar.ac.id' } as any,
        profile: { id: 'ta-001', full_name: 'Asisten Dosen & Lab', email: 'ta1@siajar.ac.id', status: 'ACTIVE', must_change_password: false },
        roles: ['TEACHING_ASSISTANT'],
        activeRole: 'TEACHING_ASSISTANT',
        isImpersonating: false,
        impersonatingFrom: null,
        isNewAccount: false,
      });

      const res = await listPendingReviewsAction();
      expect(res).toBeDefined();
      expect(typeof res.classes).toBe('number');
      expect(Array.isArray(res.items)).toBe(true);
    });

    it('menolak pengembalian antrean jika aktor bukan LECTURER atau TEACHING_ASSISTANT', async () => {
      vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue({
        user: { id: 'mhs-001', email: 'mhs1@student.uir.ac.id' } as any,
        profile: { id: 'mhs-001', full_name: 'Mahasiswa Biasa', email: 'mhs1@student.uir.ac.id', status: 'ACTIVE', must_change_password: false },
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
        isImpersonating: false,
        impersonatingFrom: null,
        isNewAccount: false,
      });

      const res = await listPendingReviewsAction();
      expect(res.classes).toBe(0);
      expect(res.items).toEqual([]);
    });
  });

  describe('2. Struktur Komponen Beranda Dosen & Asisten', () => {
    it('memastikan LecturerDashboardClient dan TaDashboardClient dapat diimpor tanpa crash', async () => {
      const lecturerModule = await import('../src/app/(portal)/lecturer/lecturer-dashboard-client');
      expect(lecturerModule.LecturerDashboardClient).toBeDefined();

      const taModule = await import('../src/app/(portal)/ta/ta-dashboard-client');
      expect(taModule.TaDashboardClient).toBeDefined();
    }, 20000);

    it('memastikan panel kanan LecturerRightPanel dan TaRightPanel terdefinisi', async () => {
      const lecturerPanel = await import('../src/components/home/lecturer-right-panel');
      expect(lecturerPanel.LecturerRightPanel).toBeDefined();

      const taPanel = await import('../src/components/home/ta-right-panel');
      expect(taPanel.TaRightPanel).toBeDefined();
    }, 20000);

    it('memastikan LecturerIdentityCard (Kartu Dosen & BKD) terdefinisi dan dapat diimpor', async () => {
      const cardModule = await import('../src/components/retro/lecturer-identity-card');
      expect(cardModule.LecturerIdentityCard).toBeDefined();
    }, 20000);
  });
});
