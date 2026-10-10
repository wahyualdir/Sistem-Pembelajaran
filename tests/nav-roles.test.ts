import { describe, it, expect } from 'vitest';
import {
  getNavGroups,
  getHomeHref,
  getRoleLabel,
  normalizeRole,
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
import { BERANDA_CHIPS, LEGACY_ROUTE_REDIRECTS } from '../src/lib/config/menu-config';

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
    expect(getHomeHref('SYSTEM_ADMIN')).toBe('/admin');
    expect(getHomeHref('ADMIN')).toBe('/admin');
    expect(getHomeHref('SUPER_ADMIN')).toBe('/admin');
  });

  it('memastikan role label akurat untuk seluruh 7 peran', () => {
    expect(getRoleLabel('STUDENT')).toBe('Mahasiswa');
    expect(getRoleLabel('LECTURER')).toBe('Dosen Pengampu');
    expect(getRoleLabel('PROGRAM_COORDINATOR')).toBe('Koordinator Prodi');
    expect(getRoleLabel('ACADEMIC_STAFF')).toBe('Staf Akademik');
    expect(getRoleLabel('TEACHING_ASSISTANT')).toBe('Asisten Dosen');
    expect(getRoleLabel('SYSTEM_ADMIN')).toBe('Administrator');
    expect(getRoleLabel('SUPER_ADMIN')).toBe('Super Administrator');
  });

  it('memastikan menu Mahasiswa 100% LMS baru dan BEBAS dari menu legacy', () => {
    const groups = getNavGroups('STUDENT');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    // Menu LMS Baru
    expect(allLabels).toContain('Beranda');
    expect(allLabels).toContain('Kalender');
    expect(allLabels).toContain('Kelas Saya');
    expect(allLabels).toContain('Ujian Aktif');
    expect(allLabels).toContain('Pustaka Digital');
    expect(allLabels).toContain('Tanya AI SIAJAR');
    expect(allLabels).toContain('Riwayat Ujian & Kuis');
    expect(allLabels).toContain('Nilai & Progres');
    expect(allLabels).toContain('Riwayat Presensi');
    expect(allLabels).toContain('Pengumuman');
    expect(allLabels).toContain('Profil');
    expect(allLabels).toContain('Perangkat & Sesi');
    expect(allLabels).toContain('Preferensi Notifikasi');

    // Menu Legacy Wajib TIDAK ADA
    expect(allLabels).not.toContain('KRS Online');
    expect(allLabels).not.toContain('Tagihan UKT');
    expect(allLabels).not.toContain('Pengajuan Surat');
    expect(allLabels).not.toContain('Simulasi IPK');
    expect(allLabels).not.toContain('KHS & Transkrip');
    expect(allLabels).not.toContain('Kartu & Jadwal Ujian');
    expect(allLabels).not.toContain('Dashboard Akademik');
    expect(allLabels).not.toContain('Presensi Kuliah');
    expect(allLabels).not.toContain('Bimbingan Dosen Wali');
  });

  it('memastikan menu Dosen memiliki Pengajaran, Ujian & Kuis, Presensi, Analitik, Bimbingan', () => {
    const groups = getNavGroups('LECTURER');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Dashboard Pengajar');
    expect(allLabels).toContain('Kelas Diampu');
    expect(allLabels).toContain('Konten & Materi');
    expect(allLabels).toContain('Tugas & Penilaian');
    expect(allLabels).toContain('Buat Ujian/Kuis');
    expect(allLabels).toContain('Panel Live');
    expect(allLabels).toContain('Bank Soal');
    expect(allLabels).toContain('Buka Sesi Presensi');
    expect(allLabels).toContain('Rekap Kehadiran');
    expect(allLabels).toContain('Analitik Kelas');
    expect(allLabels).toContain('Mahasiswa Bimbingan');

    // Bebas dari menu mahasiswa/legacy
    expect(allLabels).not.toContain('KRS Online');
    expect(allLabels).not.toContain('Simulasi IPK');
    expect(allLabels).not.toContain('Tagihan UKT');
  });

  it('memastikan menu Koordinator Prodi (Kaprodi) memiliki Manajemen Prodi, Monitoring, Persetujuan', () => {
    const groups = getNavGroups('PROGRAM_COORDINATOR');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Dashboard Prodi');
    expect(allLabels).toContain('Kurikulum & CPL');
    expect(allLabels).toContain('Mata Kuliah');
    expect(allLabels).toContain('Penugasan Dosen');
    expect(allLabels).toContain('Monitoring Kelas');
    expect(allLabels).toContain('Monitoring Dosen');
    expect(allLabels).toContain('Kelas Baru');
    expect(allLabels).toContain('Soal Ujian');
    expect(allLabels).toContain('Perubahan Nilai');
    expect(allLabels).toContain('Laporan Prodi');

    // Bebas dari menu legacy
    expect(allLabels).not.toContain('KRS Online');
    expect(allLabels).not.toContain('Tagihan UKT');
  });

  it('memastikan menu Staf Akademik memiliki Data Master, Penjadwalan, Pendaftaran, Nilai & Presensi', () => {
    const groups = getNavGroups('ACADEMIC_STAFF');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Dashboard');
    expect(allLabels).toContain('Mahasiswa');
    expect(allLabels).toContain('Dosen');
    expect(allLabels).toContain('Program Studi');
    expect(allLabels).toContain('Mata Kuliah');
    expect(allLabels).toContain('Jadwal Kuliah');
    expect(allLabels).toContain('Jadwal Ujian');
    expect(allLabels).toContain('Enroll Peserta');
    expect(allLabels).toContain('Impor CSV');
    expect(allLabels).toContain('Rekap Nilai');
    expect(allLabels).toContain('Rekap Presensi');

    // Bebas dari menu legacy
    expect(allLabels).not.toContain('KRS Online');
    expect(allLabels).not.toContain('Tagihan UKT');
  });

  it('memastikan menu Asisten Dosen memiliki kategori MODE ASISTEN', () => {
    const groups = getNavGroups('TEACHING_ASSISTANT');
    const groupTitles = groups.map((g) => g.title);
    expect(groupTitles).toContain('MODE ASISTEN');

    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));
    expect(allLabels).toContain('Kelas Diasistensi');
    expect(allLabels).toContain('Bantu Presensi');
    expect(allLabels).toContain('Koreksi Tugas');
    expect(allLabels).toContain('Jawab Forum');
    expect(allLabels).toContain('Materi Asisten');
    expect(allLabels).toContain('Pantau Ujian');
  });

  it('memastikan menu System Admin berfokus teknis tanpa akses konten kelas/nilai', () => {
    const groups = getNavGroups('SYSTEM_ADMIN');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Status Server');
    expect(allLabels).toContain('Antrean Sandbox Coding');
    expect(allLabels).toContain('Realtime/WebSocket');
    expect(allLabels).toContain('Zoom/Meet');
    expect(allLabels).toContain('Peta (Google Maps API)');
    expect(allLabels).toContain('Sandbox Kode');
    expect(allLabels).toContain('Sesi Aktif');
    expect(allLabels).toContain('Audit Log');

    // Tidak boleh memiliki menu nilai atau konten kelas
    expect(allLabels).not.toContain('Nilai & Progres');
    expect(allLabels).not.toContain('Input & Final Nilai');
  });

  it('memastikan menu Super Admin memiliki Pengguna & Akses, Kebijakan, dan Laporan Global', () => {
    const groups = getNavGroups('SUPER_ADMIN');
    const allLabels = groups.flatMap((g) => g.items.map((i) => i.label));

    expect(allLabels).toContain('Kelola Pengguna');
    expect(allLabels).toContain('Role & Permission');
    expect(allLabels).toContain('Impersonate');
    expect(allLabels).toContain('Kebijakan Akademik');
    expect(allLabels).toContain('Kebijakan Ujian & Pengawasan');
    expect(allLabels).toContain('Privasi & Retensi Data');
    expect(allLabels).toContain('Dashboard Universitas');
    expect(allLabels).toContain('Pengumuman Global');
  });

  it('memastikan chip Beranda hanya berisi kategori LMS baru', () => {
    expect(BERANDA_CHIPS).toEqual([
      'Semua',
      'Kelas Saya',
      'Tugas & Kuis',
      'Ujian',
      'Presensi',
      'Jadwal',
      'Nilai',
    ]);
    expect(BERANDA_CHIPS).not.toContain('KRS Online');
    expect(BERANDA_CHIPS).not.toContain('Transkrip');
    expect(BERANDA_CHIPS).not.toContain('Tagihan UKT');
  });

  it('memastikan rute legacy diarahkan (redirect) ke rute LMS yang sesuai', () => {
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/krs']).toBe('/calendar');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/jadwal']).toBe('/calendar');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/nilai']).toBe('/grades');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/simulasi-ipk']).toBe('/grades');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/ujian']).toBe('/exams');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/tugas']).toBe('/classes');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/ukt']).toBe('/student');
    expect(LEGACY_ROUTE_REDIRECTS['/mahasiswa/surat']).toBe('/student');
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
    const studentHrefs = studentGroups.flatMap((g) => g.items.map((i) => i.href));

    it('memastikan Ujian Aktif (/exams) TIDAK aktif saat membuka Riwayat Ujian (/exams/history)', () => {
      // Saat membuka /exams/history:
      const isUjianAktifActive = isNavItemActive('/exams', '/exams/history', studentHrefs);
      const isRiwayatActive = isNavItemActive('/exams/history', '/exams/history', studentHrefs);

      expect(isUjianAktifActive).toBe(false);
      expect(isRiwayatActive).toBe(true);
    });

    it('memastikan Ujian Aktif (/exams) aktif saat membuka halaman /exams atau pengerjaan ujian /exams/session/1', () => {
      expect(isNavItemActive('/exams', '/exams', studentHrefs)).toBe(true);
      expect(isNavItemActive('/exams/history', '/exams', studentHrefs)).toBe(false);

      // Sub-halaman pengerjaan ujian aktif
      expect(isNavItemActive('/exams', '/exams/session/1', studentHrefs)).toBe(true);
      expect(isNavItemActive('/exams/history', '/exams/session/1', studentHrefs)).toBe(false);
    });

    it('memastikan Riwayat Ujian (/exams/history) aktif saat membuka sub-detail riwayat', () => {
      expect(isNavItemActive('/exams/history', '/exams/history/detail/123', studentHrefs)).toBe(true);
      expect(isNavItemActive('/exams', '/exams/history/detail/123', studentHrefs)).toBe(false);
    });

    it('memastikan preferensi notifikasi tidak memicu aktifnya menu notifikasi utama', () => {
      expect(
        isNavItemActive('/notifications', '/notifications/preferences', studentHrefs)
      ).toBe(false);
      expect(
        isNavItemActive('/notifications/preferences', '/notifications/preferences', studentHrefs)
      ).toBe(true);
    });
  });
});
