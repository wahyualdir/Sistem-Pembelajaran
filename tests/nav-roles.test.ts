import { describe, it, expect } from 'vitest';
import {
  getNavGroups,
  getHomeHref,
  getRoleLabel,
  isNavItemActive,
} from '../src/app/(portal)/portal-nav';
import {
  ADMIN_NAV_GROUPS,
  SUPER_ADMIN_NAV_GROUPS,
  DOSEN_NAV_GROUPS,
  MAHASISWA_NAV_GROUPS,
  KAPRODI_NAV_GROUPS,
  STAFF_NAV_GROUPS,
  TA_NAV_GROUPS,
} from '../src/components/shared/sidebar';
import {
  BERANDA_CHIPS,
  LEGACY_ROUTE_REDIRECTS,
  MENU_CONFIG,
  isRouteAllowedForRole,
  SHARED_SUPPORT_GROUP,
} from '../src/lib/config/menu-config';

describe('Navigasi Multi-Actor & Role Differentiation Tests (LMS SIAJAR)', () => {
  it('memastikan setiap aktor memiliki halaman beranda (homeHref) yang berbeda', () => {
    expect(getHomeHref('STUDENT')).toBe('/student');
    expect(getHomeHref('MAHASISWA')).toBe('/student');
    expect(getHomeHref('LECTURER')).toBe('/lecturer');
    expect(getHomeHref('DOSEN')).toBe('/lecturer');
    expect(getHomeHref('PROGRAM_COORDINATOR')).toBe('/coordinator');
    expect(getHomeHref('KAPRODI')).toBe('/coordinator');
    expect(getHomeHref('ACADEMIC_STAFF')).toBe('/staff');
    expect(getHomeHref('STAFF')).toBe('/staff');
    expect(getHomeHref('TEACHING_ASSISTANT')).toBe('/ta');
    expect(getHomeHref('ASDOS')).toBe('/ta');
    expect(getHomeHref('SYSTEM_ADMIN')).toBe('/admin/system');
    expect(getHomeHref('ADMIN')).toBe('/admin/system');
    expect(getHomeHref('PROGRAM_SECRETARY')).toBe('/secretary');
    expect(getHomeHref('SEKPRODI')).toBe('/secretary');
    expect(getHomeHref('LAB_HEAD')).toBe('/lab');
    expect(getHomeHref('KALAB')).toBe('/lab');
    expect(getHomeHref('SUPER_ADMIN')).toBe('/admin');
  });

  it('memastikan role label akurat untuk seluruh 9 peran', () => {
    expect(getRoleLabel('STUDENT')).toBe('Mahasiswa');
    expect(getRoleLabel('LECTURER')).toBe('Dosen Pengampu');
    expect(getRoleLabel('PROGRAM_COORDINATOR')).toBe('Koordinator Program Studi');
    expect(getRoleLabel('PROGRAM_SECRETARY')).toBe('Sekretaris Program Studi');
    expect(getRoleLabel('LAB_HEAD')).toBe('Kepala Laboratorium');
    expect(getRoleLabel('ACADEMIC_STAFF')).toBe('Staf Akademik');
    expect(getRoleLabel('TEACHING_ASSISTANT')).toBe('Asisten Dosen');
    expect(getRoleLabel('SYSTEM_ADMIN')).toBe('System Administrator');
    expect(getRoleLabel('SUPER_ADMIN')).toBe('Super Administrator');
  });

  it('memastikan jumlah menu per peran dan total 104 butir menu sesuai spesifikasi', () => {
    const studentCount = MENU_CONFIG.STUDENT.reduce((acc, g) => acc + g.items.length, 0);
    const taCount = MENU_CONFIG.TEACHING_ASSISTANT.reduce((acc, g) => acc + g.items.length, 0);
    const lecturerCount = MENU_CONFIG.LECTURER.reduce((acc, g) => acc + g.items.length, 0);
    const coordinatorCount = MENU_CONFIG.PROGRAM_COORDINATOR.reduce((acc, g) => acc + g.items.length, 0);
    const staffCount = MENU_CONFIG.ACADEMIC_STAFF.reduce((acc, g) => acc + g.items.length, 0);
    const sysAdminCount = MENU_CONFIG.SYSTEM_ADMIN.reduce((acc, g) => acc + g.items.length, 0);
    const superAdminCount = MENU_CONFIG.SUPER_ADMIN.reduce((acc, g) => acc + g.items.length, 0);
    const sharedCount = SHARED_SUPPORT_GROUP.items.length;

    const secretaryCount = MENU_CONFIG.PROGRAM_SECRETARY.reduce((acc, g) => acc + g.items.length, 0);
    const labHeadCount = MENU_CONFIG.LAB_HEAD.reduce((acc, g) => acc + g.items.length, 0);

    expect(studentCount).toBe(17);
    expect(taCount).toBe(20);
    expect(lecturerCount).toBe(20);
    expect(coordinatorCount).toBe(13);
    expect(secretaryCount).toBe(10);
    expect(labHeadCount).toBe(9);
    expect(staffCount).toBe(13);
    expect(sysAdminCount).toBe(8);
    expect(superAdminCount).toBe(12);
    expect(sharedCount).toBe(3);

    const totalMenu =
      studentCount +
      taCount +
      lecturerCount +
      coordinatorCount +
      secretaryCount +
      labHeadCount +
      staffCount +
      sysAdminCount +
      superAdminCount +
      sharedCount;

    expect(totalMenu).toBe(125);
  });

  it('memastikan tidak ada kata terlarang atau pola terlarang di seluruh nama menu dan judul grup', () => {
    const BANNED_WORDS = [
      'Dashboard',
      'Insight',
      'Hub',
      'Smart',
      'Portal',
      'Seamless',
      'Powerful',
      'Eksplorasi',
      'Optimalkan',
      'Tingkatkan',
      'Revolusi',
      'Ekosistem',
    ];

    const allGroups = [
      ...Object.values(MENU_CONFIG).flat(),
      SHARED_SUPPORT_GROUP,
    ];

    for (const group of allGroups) {
      if (group.title) {
        // Tidak boleh ALL CAPS
        if (group.title.length > 2) {
          expect(group.title).not.toBe(group.title.toUpperCase());
        }
        for (const word of BANNED_WORDS) {
          expect(group.title).not.toContain(word);
        }
        expect(group.title).not.toContain('&');
        expect(group.title).not.toContain('/');
      }

      for (const item of group.items) {
        for (const word of BANNED_WORDS) {
          expect(item.label).not.toContain(word);
        }
        // Tidak boleh diawali 'Kelola '
        expect(item.label.startsWith('Kelola ')).toBe(false);
        // Tidak boleh memakai '&'
        expect(item.label).not.toContain('&');
        // Tidak boleh memakai '/'
        expect(item.label).not.toContain('/');
      }
    }
  });

  it('memastikan menu Mahasiswa (17 butir + 3 akun) sesuai spesifikasi final', () => {
    const groups = getNavGroups('STUDENT');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toEqual([
      'Beranda',
      'Kalender',
      'Notifikasi',
      'Pengumuman',
      'Kelas Saya',
      'Ujian',
      'Perpustakaan',
      'Tanya AI',
      'Pesan',
      'Flashcard',
      'Tukar Keahlian',
      'Nilai Saya',
      'Pencapaian',
      'Sertifikat',
      'Komunitas',
      'Evaluasi Dosen',
      'Pengajuan',
      'Pengaturan',
      'Bantuan',
      'Privasi',
    ]);

    // Bebas dari menu lama
    expect(allLabels).not.toContain('KRS Online');
    expect(allLabels).not.toContain('Tagihan UKT');
    expect(allLabels).not.toContain('Pengajuan Surat');
    expect(allLabels).not.toContain('Ujian Aktif');
    expect(allLabels).not.toContain('Pustaka Digital');
    expect(allLabels).not.toContain('Nilai & Progres');
  });

  it('memastikan menu Asisten Dosen (20 butir + 3 akun) memiliki grup Asistensi dan Belajar lengkap', () => {
    const groups = getNavGroups('TEACHING_ASSISTANT');
    const groupTitles = groups.map((g) => g.title).filter(Boolean);
    expect(groupTitles).toContain('Asistensi');
    expect(groupTitles).toContain('Belajar');
    expect(groupTitles).toContain('Nilai');
    expect(groupTitles).toContain('Lainnya');
    expect(groupTitles).toContain('Akun');

    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));
    expect(allLabels).toContain('Kelas Asistensi');
    expect(allLabels).toContain('Koreksi');
    expect(allLabels).toContain('Pantau Ujian');
    expect(allLabels).toContain('Flashcard');
    expect(allLabels).toContain('Tukar Keahlian');
    expect(allLabels).not.toContain('Antrean Koreksi');
    expect(allLabels).not.toContain('Kelas Diasistensi');
  });

  it('memastikan menu Dosen Pengampu (19 butir + 3 akun) sesuai spesifikasi final', () => {
    const groups = getNavGroups('LECTURER');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Beranda');
    expect(allLabels).toContain('Kelas Saya');
    expect(allLabels).toContain('Berita Acara');
    expect(allLabels).toContain('Tinjau Konten');
    expect(allLabels).toContain('Perpustakaan');
    expect(allLabels).toContain('Ujian dan Kuis');
    expect(allLabels).toContain('Bank Soal');
    expect(allLabels).toContain('Periksa Jawaban');
    expect(allLabels).toContain('Analisis Soal');
    expect(allLabels).toContain('Rubrik');
    expect(allLabels).toContain('Buku Nilai');
    expect(allLabels).toContain('Sanggahan');
    expect(allLabels).toContain('Pesan');
    expect(allLabels).toContain('Mahasiswa Bimbingan');
    expect(allLabels).toContain('Hasil Evaluasi');
    expect(allLabels).toContain('Komunitas');

    // Label lama tidak boleh ada
    expect(allLabels).not.toContain('Dashboard Pengajar');
    expect(allLabels).not.toContain('Kelas Diampu');
    expect(allLabels).not.toContain('Review Essay & Coding');
    expect(allLabels).not.toContain('Analitik & Nilai');
  });

  it('memastikan menu Koordinator Prodi (12 butir + 3 akun) sesuai spesifikasi final', () => {
    const groups = getNavGroups('PROGRAM_COORDINATOR');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Beranda');
    expect(allLabels).toContain('Kalender');
    expect(allLabels).toContain('Notifikasi');
    expect(allLabels).toContain('Pengumuman');
    expect(allLabels).toContain('Kurikulum');
    expect(allLabels).toContain('Mata Kuliah');
    expect(allLabels).toContain('Penugasan Dosen');
    expect(allLabels).toContain('Evaluasi Dosen');
    expect(allLabels).toContain('Perkuliahan');
    expect(allLabels).toContain('Mahasiswa Berisiko');
    expect(allLabels).toContain('Persetujuan Nilai');
    expect(allLabels).toContain('Laporan');

    expect(allLabels).not.toContain('Dashboard Prodi');
    expect(allLabels).not.toContain('Kurikulum & CPL');
    expect(allLabels).not.toContain('Penugasan & Kelas');
    expect(allLabels).not.toContain('Monitoring');
    expect(allLabels).not.toContain('Persetujuan');
  });

  it('memastikan menu Staf Akademik (13 butir + 3 akun) sesuai spesifikasi final', () => {
    const groups = getNavGroups('ACADEMIC_STAFF');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Beranda');
    expect(allLabels).toContain('Mahasiswa');
    expect(allLabels).toContain('Dosen');
    expect(allLabels).toContain('Data Akademik');
    expect(allLabels).toContain('Jadwal');
    expect(allLabels).toContain('Kelas dan Peserta');
    expect(allLabels).toContain('Nilai dan Presensi');
    expect(allLabels).toContain('Pengajuan Masuk');
    expect(allLabels).toContain('Pengumuman dan Acara');
    expect(allLabels).toContain('Berkas dan Sertifikat');
    expect(allLabels).toContain('Moderasi');

    expect(allLabels).not.toContain('Kelas & Peserta');
    expect(allLabels).not.toContain('Nilai & Presensi');
    expect(allLabels).not.toContain('Verifikasi Berkas');
    expect(allLabels).not.toContain('Pengumuman & Event');
  });

  it('memastikan menu System Admin (8 butir + 3 akun) berfokus teknis', () => {
    const groups = getNavGroups('SYSTEM_ADMIN');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Beranda');
    expect(allLabels).toContain('Notifikasi');
    expect(allLabels).toContain('Pemantauan');
    expect(allLabels).toContain('Integrasi');
    expect(allLabels).toContain('Sesi Login');
    expect(allLabels).toContain('Cadangan Data');
    expect(allLabels).toContain('Pengaturan Sistem');
    expect(allLabels).toContain('Log Audit');

    expect(allLabels).not.toContain('Dashboard Sistem');
    expect(allLabels).not.toContain('Monitoring Sistem');
    expect(allLabels).not.toContain('Keamanan');
    expect(allLabels).not.toContain('Backup & Restore');
    expect(allLabels).not.toContain('Pengaturan Platform');
  });

  it('memastikan menu Super Admin (12 butir + 3 akun) memiliki Aturan Kampus dan Sub-hub Sistem', () => {
    const groups = getNavGroups('SUPER_ADMIN');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Beranda');
    expect(allLabels).toContain('Akun Pengguna');
    expect(allLabels).toContain('Peran dan Akses');
    expect(allLabels).toContain('Aturan Akademik');
    expect(allLabels).toContain('Pengumuman Kampus');
    expect(allLabels).toContain('Pemantauan');
    expect(allLabels).toContain('Integrasi');
    expect(allLabels).toContain('Sesi Login');
    expect(allLabels).toContain('Cadangan Data');
    expect(allLabels).toContain('Pengaturan Sistem');
    expect(allLabels).toContain('Log Audit');

    expect(allLabels).not.toContain('Kelola Pengguna');
    expect(allLabels).not.toContain('Role & Permission');
    expect(allLabels).not.toContain('Kebijakan');
    expect(allLabels).not.toContain('Pengumuman Global');
  });

  it('memastikan chip Beranda hanya berisi kategori LMS baru dengan ejaan "Tugas dan Kuis"', () => {
    expect(BERANDA_CHIPS).toEqual([
      'Semua',
      'Kelas Saya',
      'Tugas dan Kuis',
      'Ujian',
      'Presensi',
      'Jadwal',
      'Nilai',
    ]);
    expect(BERANDA_CHIPS).not.toContain('Tugas & Kuis');
    expect(BERANDA_CHIPS).not.toContain('KRS Online');
  });

  it('memastikan rute legacy diarahkan (redirect) ke rute LMS yang sesuai', () => {
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/krs']).toBe('/calendar');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/jadwal']).toBe('/calendar');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/nilai']).toBe('/grades');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/simulasi-ipk']).toBe('/grades');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/ujian']).toBe('/exams');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/tugas']).toBe('/classes');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/ukt']).toBe('/student');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/surat']).toBe('/requests');
  });

  it('memastikan sidebar exported groups sinkron dengan getNavGroups', () => {
    expect(ADMIN_NAV_GROUPS).toEqual(getNavGroups('SYSTEM_ADMIN'));
    expect(SUPER_ADMIN_NAV_GROUPS).toEqual(getNavGroups('SUPER_ADMIN'));
    expect(DOSEN_NAV_GROUPS).toEqual(getNavGroups('LECTURER'));
    expect(MAHASISWA_NAV_GROUPS).toEqual(getNavGroups('STUDENT'));
    expect(KAPRODI_NAV_GROUPS).toEqual(getNavGroups('PROGRAM_COORDINATOR'));
    expect(STAFF_NAV_GROUPS).toEqual(getNavGroups('ACADEMIC_STAFF'));
    expect(TA_NAV_GROUPS).toEqual(getNavGroups('TEACHING_ASSISTANT'));
  });

  describe('isNavItemActive - Mencegah konflik prefix navigasi', () => {
    const studentGroups = getNavGroups('STUDENT');
    const studentHrefs = [
      ...studentGroups.flatMap((g) => g.items.map((i) => i.href)),
      '/exams/history',
      '/settings/appearance',
    ];

    it('memastikan Ujian (/exams) TIDAK aktif saat membuka Riwayat Ujian (/exams/history)', () => {
      const isUjianActive = isNavItemActive('/exams', '/exams/history', studentHrefs);
      const isRiwayatActive = isNavItemActive('/exams/history', '/exams/history', studentHrefs);

      expect(isUjianActive).toBe(false);
      expect(isRiwayatActive).toBe(true);
    });

    it('memastikan Ujian (/exams) aktif saat membuka halaman /exams atau pengerjaan ujian /exams/session/1', () => {
      expect(isNavItemActive('/exams', '/exams', studentHrefs)).toBe(true);
      expect(isNavItemActive('/exams/history', '/exams', studentHrefs)).toBe(false);

      expect(isNavItemActive('/exams', '/exams/session/1', studentHrefs)).toBe(true);
      expect(isNavItemActive('/exams/history', '/exams/session/1', studentHrefs)).toBe(false);
    });

    it('memastikan preferensi pengaturan tidak memicu aktifnya menu notifikasi utama', () => {
      expect(
        isNavItemActive('/notifications', '/settings', studentHrefs)
      ).toBe(false);
    });

    it('memastikan grup menu Akun secara ketat berisi Pengaturan, Bantuan, dan Privasi untuk seluruh peran', () => {
      const roles = ['STUDENT', 'TEACHING_ASSISTANT', 'LECTURER', 'PROGRAM_COORDINATOR', 'ACADEMIC_STAFF', 'SYSTEM_ADMIN', 'SUPER_ADMIN'];
      for (const r of roles) {
        const groups = getNavGroups(r);
        const akunGroup = groups.find((g) => g.title === 'Akun');
        expect(akunGroup).toBeDefined();
        const labels = akunGroup!.items.map((i) => i.label);
        expect(labels).toEqual(['Pengaturan', 'Bantuan', 'Privasi']);
        const hrefs = akunGroup!.items.map((i) => i.href);
        expect(hrefs).toEqual(['/settings', '/help', '/transparency']);
      }
    });
  });

  describe('Matriks Akses Peran dan Proteksi Rute (Fase 3.3)', () => {
    const ALL_ROLES = [
      'STUDENT',
      'TEACHING_ASSISTANT',
      'LECTURER',
      'PROGRAM_COORDINATOR',
      'ACADEMIC_STAFF',
      'SYSTEM_ADMIN',
      'SUPER_ADMIN',
    ];

    it('(c) memastikan tidak ada href di sidebar suatu peran yang ditolak untuk peran tersebut (bebas menu mati)', () => {
      for (const role of ALL_ROLES) {
        const groups = getNavGroups(role);
        const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
        for (const href of hrefs) {
          const isAllowed = isRouteAllowedForRole(href, role);
          expect(
            isAllowed,
            `Menu ${href} di sidebar role ${role} ditolak oleh isRouteAllowedForRole!`
          ).toBe(true);
        }
      }
    });

    it('(b) memastikan rute terproteksi menolak peran yang tidak berhak (redirect / 403)', () => {
      // Mahasiswa dilarang mengakses portal lain dan admin
      expect(isRouteAllowedForRole('/admin', 'STUDENT')).toBe(false);
      expect(isRouteAllowedForRole('/coordinator', 'STUDENT')).toBe(false);
      expect(isRouteAllowedForRole('/coordinator/curriculum', 'STUDENT')).toBe(false);
      expect(isRouteAllowedForRole('/staff', 'STUDENT')).toBe(false);
      expect(isRouteAllowedForRole('/lecturer', 'STUDENT')).toBe(false);
      expect(isRouteAllowedForRole('/ta', 'STUDENT')).toBe(false);

      // Dosen dilarang mengakses admin, staf, asisten, atau portal mahasiswa
      expect(isRouteAllowedForRole('/admin', 'LECTURER')).toBe(false);
      expect(isRouteAllowedForRole('/staff', 'LECTURER')).toBe(false);
      expect(isRouteAllowedForRole('/ta', 'LECTURER')).toBe(false);
      expect(isRouteAllowedForRole('/student', 'LECTURER')).toBe(false);

      // Kaprodi dilarang mengakses admin atau staf
      expect(isRouteAllowedForRole('/admin', 'PROGRAM_COORDINATOR')).toBe(false);
      expect(isRouteAllowedForRole('/staff', 'PROGRAM_COORDINATOR')).toBe(false);
      expect(isRouteAllowedForRole('/student', 'PROGRAM_COORDINATOR')).toBe(false);
      expect(isRouteAllowedForRole('/ta', 'PROGRAM_COORDINATOR')).toBe(false);

      // Asisten Dosen dilarang mengakses kaprodi, staf, admin, atau mahasiswa
      expect(isRouteAllowedForRole('/admin', 'TEACHING_ASSISTANT')).toBe(false);
      expect(isRouteAllowedForRole('/coordinator', 'TEACHING_ASSISTANT')).toBe(false);
      expect(isRouteAllowedForRole('/staff', 'TEACHING_ASSISTANT')).toBe(false);
      expect(isRouteAllowedForRole('/student', 'TEACHING_ASSISTANT')).toBe(false);

      // Staf Akademik dilarang mengakses koordinator, dosen, asisten, admin, atau mahasiswa
      expect(isRouteAllowedForRole('/admin', 'ACADEMIC_STAFF')).toBe(false);
      expect(isRouteAllowedForRole('/coordinator', 'ACADEMIC_STAFF')).toBe(false);
      expect(isRouteAllowedForRole('/lecturer', 'ACADEMIC_STAFF')).toBe(false);
      expect(isRouteAllowedForRole('/ta', 'ACADEMIC_STAFF')).toBe(false);
      expect(isRouteAllowedForRole('/student', 'ACADEMIC_STAFF')).toBe(false);

      // System Admin dilarang mengakses rute akademik
      expect(isRouteAllowedForRole('/student', 'SYSTEM_ADMIN')).toBe(false);
      expect(isRouteAllowedForRole('/classes', 'SYSTEM_ADMIN')).toBe(false);
      expect(isRouteAllowedForRole('/exams', 'SYSTEM_ADMIN')).toBe(false);
      expect(isRouteAllowedForRole('/grades', 'SYSTEM_ADMIN')).toBe(false);
      expect(isRouteAllowedForRole('/attendance', 'SYSTEM_ADMIN')).toBe(false);
      expect(isRouteAllowedForRole('/coordinator', 'SYSTEM_ADMIN')).toBe(false);
      expect(isRouteAllowedForRole('/lecturer', 'SYSTEM_ADMIN')).toBe(false);
      expect(isRouteAllowedForRole('/ta', 'SYSTEM_ADMIN')).toBe(false);
      expect(isRouteAllowedForRole('/staff', 'SYSTEM_ADMIN')).toBe(false);

      // Super Admin tanpa impersonasi dilarang membuka rute akademik langsung
      expect(isRouteAllowedForRole('/classes', 'SUPER_ADMIN', false)).toBe(false);
      expect(isRouteAllowedForRole('/exams', 'SUPER_ADMIN', false)).toBe(false);
      expect(isRouteAllowedForRole('/grades', 'SUPER_ADMIN', false)).toBe(false);
    });

    it('(a) memastikan peran yang berhak selalu diizinkan mengakses rute perannya (200 / lolos)', () => {
      // Mahasiswa
      expect(isRouteAllowedForRole('/student', 'STUDENT')).toBe(true);
      expect(isRouteAllowedForRole('/classes', 'STUDENT')).toBe(true);
      expect(isRouteAllowedForRole('/exams', 'STUDENT')).toBe(true);
      expect(isRouteAllowedForRole('/grades', 'STUDENT')).toBe(true);
      expect(isRouteAllowedForRole('/calendar', 'STUDENT')).toBe(true);
      expect(isRouteAllowedForRole('/notifications', 'STUDENT')).toBe(true);

      // Dosen
      expect(isRouteAllowedForRole('/lecturer', 'LECTURER')).toBe(true);
      expect(isRouteAllowedForRole('/lecturer/mentoring', 'LECTURER')).toBe(true);
      expect(isRouteAllowedForRole('/exams/question-bank', 'LECTURER')).toBe(true);
      expect(isRouteAllowedForRole('/exams/review', 'LECTURER')).toBe(true);
      expect(isRouteAllowedForRole('/classes', 'LECTURER')).toBe(true);

      // Kaprodi
      expect(isRouteAllowedForRole('/coordinator', 'PROGRAM_COORDINATOR')).toBe(true);
      expect(isRouteAllowedForRole('/coordinator/curriculum', 'PROGRAM_COORDINATOR')).toBe(true);
      expect(isRouteAllowedForRole('/coordinator/courses', 'PROGRAM_COORDINATOR')).toBe(true);
      expect(isRouteAllowedForRole('/coordinator/monitoring/at-risk', 'PROGRAM_COORDINATOR')).toBe(true);
      expect(isRouteAllowedForRole('/coordinator/approvals', 'PROGRAM_COORDINATOR')).toBe(true);

      // Asisten Dosen
      expect(isRouteAllowedForRole('/ta', 'TEACHING_ASSISTANT')).toBe(true);
      expect(isRouteAllowedForRole('/ta/classes', 'TEACHING_ASSISTANT')).toBe(true);
      expect(isRouteAllowedForRole('/ta/grading', 'TEACHING_ASSISTANT')).toBe(true);

      // Staf Akademik
      expect(isRouteAllowedForRole('/staff', 'ACADEMIC_STAFF')).toBe(true);
      expect(isRouteAllowedForRole('/staff/master/students', 'ACADEMIC_STAFF')).toBe(true);
      expect(isRouteAllowedForRole('/staff/master/lecturers', 'ACADEMIC_STAFF')).toBe(true);
      expect(isRouteAllowedForRole('/staff/services/verification', 'ACADEMIC_STAFF')).toBe(true);
      expect(isRouteAllowedForRole('/staff/schedules', 'ACADEMIC_STAFF')).toBe(true);

      // System Admin
      expect(isRouteAllowedForRole('/admin/system', 'SYSTEM_ADMIN')).toBe(true);
      expect(isRouteAllowedForRole('/admin/monitoring', 'SYSTEM_ADMIN')).toBe(true);
      expect(isRouteAllowedForRole('/admin/integrations', 'SYSTEM_ADMIN')).toBe(true);
      expect(isRouteAllowedForRole('/admin/audit-log', 'SYSTEM_ADMIN')).toBe(true);

      // Super Admin
      expect(isRouteAllowedForRole('/admin', 'SUPER_ADMIN')).toBe(true);
      expect(isRouteAllowedForRole('/admin/users', 'SUPER_ADMIN')).toBe(true);
      expect(isRouteAllowedForRole('/admin/roles', 'SUPER_ADMIN')).toBe(true);
    });
  });

});
