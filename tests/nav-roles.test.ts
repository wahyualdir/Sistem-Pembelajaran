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
  SHARED_SUPPORT_GROUP,
} from '../src/lib/config/menu-config';

describe('Navigasi Multi-Actor & Role Differentiation Tests (LMS SIAJAR - 102 Menu)', () => {
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
    expect(getHomeHref('SUPER_ADMIN')).toBe('/admin');
  });

  it('memastikan role label akurat untuk seluruh 7 peran', () => {
    expect(getRoleLabel('STUDENT')).toBe('Mahasiswa');
    expect(getRoleLabel('LECTURER')).toBe('Dosen Pengampu');
    expect(getRoleLabel('PROGRAM_COORDINATOR')).toBe('Koordinator Program Studi');
    expect(getRoleLabel('ACADEMIC_STAFF')).toBe('Staf Akademik');
    expect(getRoleLabel('TEACHING_ASSISTANT')).toBe('Asisten Dosen');
    expect(getRoleLabel('SYSTEM_ADMIN')).toBe('System Administrator');
    expect(getRoleLabel('SUPER_ADMIN')).toBe('Super Administrator');
  });

  it('memastikan jumlah menu per peran dan total 102 butir menu sesuai spesifikasi', () => {
    const studentCount = MENU_CONFIG.STUDENT.reduce((acc, g) => acc + g.items.length, 0);
    const taCount = MENU_CONFIG.TEACHING_ASSISTANT.reduce((acc, g) => acc + g.items.length, 0);
    const lecturerCount = MENU_CONFIG.LECTURER.reduce((acc, g) => acc + g.items.length, 0);
    const coordinatorCount = MENU_CONFIG.PROGRAM_COORDINATOR.reduce((acc, g) => acc + g.items.length, 0);
    const staffCount = MENU_CONFIG.ACADEMIC_STAFF.reduce((acc, g) => acc + g.items.length, 0);
    const sysAdminCount = MENU_CONFIG.SYSTEM_ADMIN.reduce((acc, g) => acc + g.items.length, 0);
    const superAdminCount = MENU_CONFIG.SUPER_ADMIN.reduce((acc, g) => acc + g.items.length, 0);
    const sharedCount = SHARED_SUPPORT_GROUP.items.length;

    expect(studentCount).toBe(16);
    expect(taCount).toBe(19);
    expect(lecturerCount).toBe(19);
    expect(coordinatorCount).toBe(12);
    expect(staffCount).toBe(13);
    expect(sysAdminCount).toBe(8);
    expect(superAdminCount).toBe(12);
    expect(sharedCount).toBe(3);

    const totalMenu =
      studentCount +
      taCount +
      lecturerCount +
      coordinatorCount +
      staffCount +
      sysAdminCount +
      superAdminCount +
      sharedCount;

    expect(totalMenu).toBe(102);
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

  it('memastikan menu Mahasiswa (16 butir) sesuai spesifikasi final', () => {
    const groups = getNavGroups('STUDENT');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toEqual([
      'Beranda',
      'Kalender',
      'Notifikasi',
      'Pengumuman',
      'Kelas Saya',
      'Presensi',
      'Ujian',
      'Perpustakaan',
      'Tanya AI',
      'Pesan',
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

  it('memastikan menu Asisten Dosen (19 butir + 3 akun) memiliki grup Asistensi', () => {
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
    expect(allLabels).not.toContain('Antrean Koreksi');
    expect(allLabels).not.toContain('Kelas Diasistensi');
  });

  it('memastikan menu Dosen Pengampu (19 butir + 3 akun) sesuai spesifikasi final', () => {
    const groups = getNavGroups('LECTURER');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Beranda');
    expect(allLabels).toContain('Kelas Saya');
    expect(allLabels).toContain('Presensi');
    expect(allLabels).toContain('Berita Acara');
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
  });
});
