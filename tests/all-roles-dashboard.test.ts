import { describe, it, expect } from 'vitest';

describe('Redesain Modern Retro Portal Semua Role Actor (Mahasiswa, Dosen, Asisten, Staf, Kaprodi, Admin)', () => {
  describe('1. Komponen Kartu Identitas Akademik Retro (Academic Identity Passes)', () => {
    it('memastikan StudentAcademicStatusCard, LecturerIdentityCard, StaffIdentityCard, CoordinatorIdentityCard, AdminIdentityCard terdefinisi', async () => {
      const studentCard = await import('../src/components/home/student-academic-status-card');
      expect(studentCard.StudentAcademicStatusCard).toBeDefined();

      const lecturerCard = await import('../src/components/retro/lecturer-identity-card');
      expect(lecturerCard.LecturerIdentityCard).toBeDefined();

      const staffCard = await import('../src/components/retro/staff-identity-card');
      expect(staffCard.StaffIdentityCard).toBeDefined();

      const coordCard = await import('../src/components/retro/coordinator-identity-card');
      expect(coordCard.CoordinatorIdentityCard).toBeDefined();

      const adminCard = await import('../src/components/retro/admin-identity-card');
      expect(adminCard.AdminIdentityCard).toBeDefined();
    }, 25000);
  });

  describe('2. Komponen Panel Kanan Khusus Setiap Aktor (Right Panels)', () => {
    it('memastikan RightPanel Switcher, Dosen, TA, Staff, Coordinator, dan Admin terdefinisi', async () => {
      const rightPanelSwitcher = await import('../src/components/home/right-panel-switcher');
      expect(rightPanelSwitcher.RightPanelSwitcher).toBeDefined();

      const lecturerRight = await import('../src/components/home/lecturer-right-panel');
      expect(lecturerRight.LecturerRightPanel).toBeDefined();

      const taRight = await import('../src/components/home/ta-right-panel');
      expect(taRight.TaRightPanel).toBeDefined();

      const staffRight = await import('../src/components/home/staff-right-panel');
      expect(staffRight.StaffRightPanel).toBeDefined();

      const coordRight = await import('../src/components/home/coordinator-right-panel');
      expect(coordRight.CoordinatorRightPanel).toBeDefined();

      const adminRight = await import('../src/components/home/admin-right-panel');
      expect(adminRight.AdminRightPanel).toBeDefined();
    }, 25000);
  });

  describe('3. Komponen Dashboard Klien 2-Panel Setiap Aktor (Dashboard Clients)', () => {
    it('memastikan Student, Lecturer, TA, Staff, Coordinator, dan Admin Dashboard Client dapat diimpor tanpa crash', async () => {
      const studentClient = await import('../src/app/(portal)/student/student-dashboard-client');
      expect(studentClient.StudentDashboardClient).toBeDefined();

      const lecturerClient = await import('../src/app/(portal)/lecturer/lecturer-dashboard-client');
      expect(lecturerClient.LecturerDashboardClient).toBeDefined();

      const taClient = await import('../src/app/(portal)/ta/ta-dashboard-client');
      expect(taClient.TaDashboardClient).toBeDefined();

      const staffClient = await import('../src/app/(portal)/staff/staff-dashboard-client');
      expect(staffClient.StaffDashboardClient).toBeDefined();

      const coordClient = await import('../src/app/(portal)/coordinator/coordinator-dashboard-client');
      expect(coordClient.CoordinatorDashboardClient).toBeDefined();

      const adminClient = await import('../src/app/(portal)/admin/admin-dashboard-client');
      expect(adminClient.AdminDashboardClient).toBeDefined();
    }, 25000);
  });
});
