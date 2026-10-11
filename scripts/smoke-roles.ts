/**
 * SIAJAR - Automated Permanent Role Smoke Test Script (scripts/smoke-roles.ts)
 * 
 * Memeriksa:
 * 1. Role x Route x Tab Matrix (Status HTTP 200 + Teks Penanda Unik Tab)
 * 2. Uji Negatif A2 (Admin Minimum Access: SYSTEM_ADMIN & SUPER_ADMIN)
 * 3. Uji Negatif A4 (Subroute Redirects Kaprodi)
 * 4. Uji Negatif A5 (Server Actions Authorization: Mahasiswa, Dosen, Kaprodi, Staf)
 */

interface TestCase {
  name: string;
  role: string;
  userId: string;
  path: string;
  expectedStatus: number;
  expectedRedirect?: string;
  uniqueMarker?: string;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Daftar pengguna demo resmi
const USERS = {
  STUDENT: { id: 'a0000001-0000-0000-0000-000000000001', role: 'STUDENT' },
  LECTURER: { id: 'a0000002-0000-0000-0000-000000000002', role: 'LECTURER' },
  TA: { id: 'a0000003-0000-0000-0000-000000000003', role: 'TEACHING_ASSISTANT' },
  COORDINATOR: { id: 'a0000004-0000-0000-0000-000000000004', role: 'PROGRAM_COORDINATOR' },
  STAFF: { id: 'a0000005-0000-0000-0000-000000000005', role: 'ACADEMIC_STAFF' },
  SYSTEM_ADMIN: { id: 'a0000006-0000-0000-0000-000000000006', role: 'SYSTEM_ADMIN' },
  SUPER_ADMIN: { id: 'a0000010-0000-0000-0000-000000000010', role: 'SUPER_ADMIN' },
};

const TEST_CASES: TestCase[] = [
  // --- 1. MAHASISWA (STUDENT) ---
  {
    name: '[Mahasiswa] Portal Home',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/student',
    expectedStatus: 200,
    uniqueMarker: 'Ruang Pembelajaran Mahasiswa',
  },
  {
    name: '[Mahasiswa] Nilai Tab Nilai Perkuliahan',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/grades?tab=nilai',
    expectedStatus: 200,
    uniqueMarker: 'Rincian Komponen Nilai',
  },
  {
    name: '[Mahasiswa] Nilai Tab Riwayat Ujian',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/grades?tab=riwayat',
    expectedStatus: 200,
    uniqueMarker: 'Riwayat Pengerjaan Ujian',
  },
  {
    name: '[Mahasiswa] Nilai Tab Progres CPL',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/grades?tab=progres',
    expectedStatus: 200,
    uniqueMarker: 'Target Capaian SKS Kelulusan',
  },
  {
    name: '[Mahasiswa] Presensi Tab Riwayat',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/attendance?tab=riwayat',
    expectedStatus: 200,
    uniqueMarker: 'Riwayat Presensi Masuk',
  },
  {
    name: '[Mahasiswa] Presensi Tab Pengajuan Izin',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/attendance?tab=izin',
    expectedStatus: 200,
    uniqueMarker: 'Daftar Permohonan Izin',
  },

  // --- 2. DOSEN (LECTURER) ---
  {
    name: '[Dosen] Portal Home',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/lecturer',
    expectedStatus: 200,
    uniqueMarker: 'Ruang Pengampu Dosen',
  },
  {
    name: '[Dosen] Analitik Tab Butir Soal',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/analytics?tab=butir-soal',
    expectedStatus: 200,
    uniqueMarker: 'Item Analysis',
  },
  {
    name: '[Dosen] Analitik Tab Rekap Nilai',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/analytics?tab=rekap-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Buku Nilai',
  },
  {
    name: '[Dosen] Analitik Tab Keberatan Nilai',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/analytics?tab=keberatan-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Kotak Masuk Keberatan Nilai Mahasiswa',
  },
  {
    name: '[Dosen] Analitik Tab Perubahan Nilai',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/analytics?tab=perubahan-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Pengajuan Perubahan Nilai Final',
  },
  {
    name: '[Dosen] Ujian Tab Log Pelanggaran (Terpisah)',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/exams?tab=pelanggaran',
    expectedStatus: 200,
    uniqueMarker: 'Log Pelanggaran Mahasiswa (Proctoring Telemetry)',
  },
  {
    name: '[Dosen] Ujian Tab Log Intervensi Pengawas (Terpisah)',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/exams?tab=pelanggaran',
    expectedStatus: 200,
    uniqueMarker: 'Log Audit',
  },

  // --- 3. KAPRODI (PROGRAM_COORDINATOR) ---
  {
    name: '[Kaprodi] Portal Home',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator',
    expectedStatus: 200,
    uniqueMarker: 'kaprodi_persetujuan_nilai.portal',
  },
  {
    name: '[Kaprodi] Penugasan Tab Dosen Pengampu',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/assignments?tab=dosen-pengampu',
    expectedStatus: 200,
    uniqueMarker: 'Distribusi Beban Kerja Dosen',
  },
  {
    name: '[Kaprodi] Penugasan Tab Kelas Prodi',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/assignments?tab=kelas-prodi',
    expectedStatus: 200,
    uniqueMarker: 'Daftar Rombongan Belajar Kelas Aktif Program Studi',
  },
  {
    name: '[Kaprodi] Monitoring Tab Ujian',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/monitoring?tab=ujian',
    expectedStatus: 200,
    uniqueMarker: 'Supervisi Ujian Semester Sedang Berlangsung',
  },
  {
    name: '[Kaprodi] Persetujuan Tab Perubahan Nilai',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/approvals?tab=perubahan-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Permohonan Koreksi / Revisi Nilai Akhir Perkuliahan',
  },
  {
    name: '[Kaprodi] Laporan Tab Capaian CPL',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/reports?tab=capaian-cpl',
    expectedStatus: 200,
    uniqueMarker: 'Ketercapaian Capaian Pembelajaran Lulusan (CPL Kurikulum OBE)',
  },

  // --- 4. STAF AKADEMIK (ACADEMIC_STAFF - FASE 2D) ---
  {
    name: '[Staf] Portal Home / Master Data',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff',
    expectedStatus: 200,
    uniqueMarker: 'Master Data Akademik Kampus',
  },
  {
    name: '[Staf] Master Tab Program Studi',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/master?tab=program-studi',
    expectedStatus: 200,
    uniqueMarker: 'Direktori Program Studi',
  },
  {
    name: '[Staf] Master Tab Mata Kuliah',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/master?tab=mata-kuliah',
    expectedStatus: 200,
    uniqueMarker: 'Katalog Mata Kuliah',
  },
  {
    name: '[Staf] Master Tab Tahun Ajaran',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/master?tab=tahun-ajaran',
    expectedStatus: 200,
    uniqueMarker: 'Periode Tahun Ajaran',
  },
  {
    name: '[Staf] Master Tab Ruang & Titik Lokasi',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/master?tab=ruang-dan-titik-lokasi',
    expectedStatus: 200,
    uniqueMarker: 'Master Ruang Kuliah',
  },
  {
    name: '[Staf] Jadwal Tab Jadwal Kuliah',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/schedules?tab=jadwal-kuliah',
    expectedStatus: 200,
    uniqueMarker: 'Distribusi Waktu Perkuliahan',
  },
  {
    name: '[Staf] Jadwal Tab Jadwal Ujian',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/schedules?tab=jadwal-ujian',
    expectedStatus: 200,
    uniqueMarker: 'Penjadwalan Ujian Tengah',
  },
  {
    name: '[Staf] Jadwal Tab Penggunaan Ruang',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/schedules?tab=penggunaan-ruang',
    expectedStatus: 200,
    uniqueMarker: 'Monitoring Okupansi',
  },
  {
    name: '[Staf] Kelas Tab Enroll Peserta',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/classes?tab=enroll-peserta',
    expectedStatus: 200,
    uniqueMarker: 'Pendaftaran Peserta ke Rombongan Belajar',
  },
  {
    name: '[Staf] Kelas Tab Impor CSV',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/classes?tab=impor-csv',
    expectedStatus: 200,
    uniqueMarker: 'Impor Data Peserta',
  },
  {
    name: '[Staf] Kelas Tab Pindah Kelas',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/classes?tab=pindah-kelas',
    expectedStatus: 200,
    uniqueMarker: 'Mutasi Pindah Kelas',
  },
  {
    name: '[Staf] Nilai Tab Rekap Nilai',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/grades?tab=rekap-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Rekapitulasi Nilai Akhir',
  },
  {
    name: '[Staf] Nilai Tab Rekap Presensi',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/grades?tab=rekap-presensi',
    expectedStatus: 200,
    uniqueMarker: 'Rekapitulasi Presensi Kuliah',
  },
  {
    name: '[Staf] Nilai Tab Perubahan Nilai',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/grades?tab=perubahan-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Eksekusi Perubahan Nilai Mahasiswa',
  },
  {
    name: '[Staf] Nilai Tab Ekspor Laporan',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/grades?tab=ekspor-laporan',
    expectedStatus: 200,
    uniqueMarker: 'Ekspor Laporan Transaksional',
  },
  {
    name: '[Staf] Pengumuman Tab Pengumuman Kampus',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/announcements?tab=pengumuman-kampus',
    expectedStatus: 200,
    uniqueMarker: 'Siaran Berita',
  },
  {
    name: '[Staf] Pengumuman Tab Event & Webinar',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/announcements?tab=event-dan-webinar',
    expectedStatus: 200,
    uniqueMarker: 'Manajemen Agenda Event',
  },
  {
    name: '[Staf] Konten Tab Koleksi Pustaka',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/content?tab=koleksi-pustaka',
    expectedStatus: 200,
    uniqueMarker: 'Katalog Pustaka Digital',
  },
  {
    name: '[Staf] Konten Tab Template Sertifikat & Badge',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/content?tab=template-sertifikat-dan-badge',
    expectedStatus: 200,
    uniqueMarker: 'Template Sertifikat Digital',
  },
  {
    name: '[Staf] Moderasi Tab Laporan Konten',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/moderation?tab=laporan-konten',
    expectedStatus: 200,
    uniqueMarker: 'Kotak Masuk Laporan Konten',
  },
  {
    name: '[Staf] Moderasi Tab Grup Belajar',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/moderation?tab=grup-belajar',
    expectedStatus: 200,
    uniqueMarker: 'Supervisi Grup Belajar',
  },
  {
    name: '[Staf] Moderasi Tab Program Mentoring',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/moderation?tab=program-mentoring',
    expectedStatus: 200,
    uniqueMarker: 'Program Pendampingan Akademik',
  },
  {
    name: '[Staf] Standalone Data Master Mahasiswa',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/master/students',
    expectedStatus: 200,
    uniqueMarker: 'Data Master Mahasiswa',
  },
  {
    name: '[Staf] Standalone Data Master Dosen',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/master/lecturers',
    expectedStatus: 200,
    uniqueMarker: 'Data Master Dosen',
  },
  {
    name: '[Staf] Standalone Layanan Verifikasi Berkas',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/services/verification',
    expectedStatus: 200,
    uniqueMarker: 'Layanan Verifikasi Berkas Mahasiswa',
  },

  // --- 5. SUBROUTE REDIRECT TESTS KAPRODI & STAF (A4 & 2D) ---
  {
    name: '[Redirect A4] /coordinator/evaluations -> Evaluasi Dosen Tab',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/evaluations',
    expectedStatus: 307,
    expectedRedirect: '/coordinator/reports?tab=evaluasi-dosen',
  },
  {
    name: '[Redirect A4] /coordinator/cpl -> Capaian CPL Tab',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/cpl',
    expectedStatus: 307,
    expectedRedirect: '/coordinator/reports?tab=capaian-cpl',
  },
  {
    name: '[Redirect A4] /coordinator/classes -> Kelas Prodi Tab',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/classes',
    expectedStatus: 307,
    expectedRedirect: '/coordinator/assignments?tab=kelas-prodi',
  },
  {
    name: '[Redirect A4] /coordinator/approvals/classes -> Kelas Baru Tab',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/approvals/classes',
    expectedStatus: 307,
    expectedRedirect: '/coordinator/approvals?tab=kelas-baru',
  },
  {
    name: '[Redirect 2D] /staff/master/departments -> Program Studi Tab',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/master/departments',
    expectedStatus: 307,
    expectedRedirect: '/staff/master?tab=program-studi',
  },
  {
    name: '[Redirect 2D] /staff/master/courses -> Mata Kuliah Tab',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/master/courses',
    expectedStatus: 307,
    expectedRedirect: '/staff/master?tab=mata-kuliah',
  },
  {
    name: '[Redirect 2D] /staff/schedules/classes -> Jadwal Kuliah Tab',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/schedules/classes',
    expectedStatus: 307,
    expectedRedirect: '/staff/schedules?tab=jadwal-kuliah',
  },
  {
    name: '[Redirect 2D] /staff/classes/enroll -> Enroll Peserta Tab',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/classes/enroll',
    expectedStatus: 307,
    expectedRedirect: '/staff/classes?tab=enroll-peserta',
  },
  {
    name: '[Redirect 2D] /staff/grades/recap -> Rekap Nilai Tab',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/grades/recap',
    expectedStatus: 307,
    expectedRedirect: '/staff/grades?tab=rekap-nilai',
  },
  {
    name: '[Redirect 2D] /staff/grades/change-requests -> Perubahan Nilai Tab',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/staff/grades/change-requests',
    expectedStatus: 307,
    expectedRedirect: '/staff/grades?tab=perubahan-nilai',
  },

  // --- 6. UJI NEGATIF ADMIN & CROSS-ROLE ACCESS (A2 & 2D) ---
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /attendance (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/attendance',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /analytics (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/analytics',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /grades (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/grades',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /exams (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/exams',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /coordinator (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/coordinator',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif 2D] SYSTEM_ADMIN dilarang ke /staff (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/staff',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SUPER_ADMIN dilarang ke /attendance (Redirect /admin)',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/attendance',
    expectedStatus: 307,
    expectedRedirect: '/admin',
  },
  {
    name: '[Uji Negatif A2] SUPER_ADMIN dilarang ke /coordinator (Redirect /admin)',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/coordinator',
    expectedStatus: 307,
    expectedRedirect: '/admin',
  },
  {
    name: '[Uji Negatif 2D] SUPER_ADMIN dilarang ke /staff (Redirect /admin)',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/staff',
    expectedStatus: 307,
    expectedRedirect: '/admin',
  },
  {
    name: '[Uji Negatif 2D] Mahasiswa dilarang ke /staff (Redirect /student)',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/staff',
    expectedStatus: 307,
    expectedRedirect: '/student',
  },
  {
    name: '[Uji Negatif 2D] Dosen dilarang ke /staff (Redirect /lecturer)',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/staff',
    expectedStatus: 307,
    expectedRedirect: '/lecturer',
  },

  // --- 7. FASE 2E: SYSTEM ADMINISTRATOR (8 HUBS + SUBTABS) ---
  {
    name: '[SysAdmin 2E] Dashboard Sistem',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system',
    expectedStatus: 200,
    uniqueMarker: 'Pusat Kendali Administrator Sistem',
  },
  {
    name: '[SysAdmin 2E] Monitoring Tab Status Server',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/monitoring?tab=status-server',
    expectedStatus: 200,
    uniqueMarker: 'Klaster Basis Data PostgreSQL',
  },
  {
    name: '[SysAdmin 2E] Monitoring Tab Realtime WS',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/monitoring?tab=realtime-websocket',
    expectedStatus: 200,
    uniqueMarker: 'Kanal Siaran Realtime Ujian & Presensi',
  },
  {
    name: '[SysAdmin 2E] Monitoring Tab Antrean Sandbox',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/monitoring?tab=antrean-sandbox',
    expectedStatus: 200,
    uniqueMarker: 'Pekerja Eksekusi Sandbox Kode Terisolasi',
  },
  {
    name: '[SysAdmin 2E] Monitoring Tab Log Error',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/monitoring?tab=log-error',
    expectedStatus: 200,
    uniqueMarker: 'Log Pengecualian & Catatan Kesalahan Sistem',
  },
  {
    name: '[SysAdmin 2E] Integrasi Tab Zoom & Meet',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/integrations?tab=zoom-meet',
    expectedStatus: 200,
    uniqueMarker: 'Konfigurasi Video Conference (Zoom / Google Meet)',
  },
  {
    name: '[SysAdmin 2E] Integrasi Tab Google Maps GPS',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/integrations?tab=google-maps',
    expectedStatus: 200,
    uniqueMarker: 'Integrasi Google Maps Platform API',
  },
  {
    name: '[SysAdmin 2E] Integrasi Tab Sandbox Kode',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/integrations?tab=sandbox-kode',
    expectedStatus: 200,
    uniqueMarker: 'Konfigurasi Judge0 Sandbox Compiler API',
  },
  {
    name: '[SysAdmin 2E] Integrasi Tab Gateway Email & WA',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/integrations?tab=gateway-email-wa',
    expectedStatus: 200,
    uniqueMarker: 'WhatsApp Business & SMTP Mailer Gateway',
  },
  {
    name: '[SysAdmin 2E] Integrasi Tab SSO Kampus',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/integrations?tab=sso',
    expectedStatus: 200,
    uniqueMarker: 'Integrasi Single Sign-On (SSO SAML / OAuth)',
  },
  {
    name: '[SysAdmin 2E] Integrasi Tab API Key & Webhook',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/integrations?tab=api-key',
    expectedStatus: 200,
    uniqueMarker: 'Manajemen Kunci API Eksternal & Webhook',
  },
  {
    name: '[SysAdmin 2E] Keamanan Tab Sesi Aktif',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/security?tab=sesi-aktif',
    expectedStatus: 200,
    uniqueMarker: 'Daftar Sesi Pengguna Aktif di Perangkat',
  },
  {
    name: '[SysAdmin 2E] Keamanan Tab Login Mencurigakan',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/security?tab=login-mencurigakan',
    expectedStatus: 200,
    uniqueMarker: 'Deteksi Anomali Login & Percobaan Brute-Force',
  },
  {
    name: '[SysAdmin 2E] Keamanan Tab Rate Limit',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/security?tab=rate-limit',
    expectedStatus: 200,
    uniqueMarker: 'Konfigurasi Batas Laju Pemanggilan API (Rate Limiting)',
  },
  {
    name: '[SysAdmin 2E] Backup & Restore Hub',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/backup',
    expectedStatus: 200,
    uniqueMarker: 'Cadangan Basis Data & Pemulihan (Backup & Restore)',
  },
  {
    name: '[SysAdmin 2E] Pengaturan Tab Branding',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/settings?tab=platform-branding',
    expectedStatus: 200,
    uniqueMarker: 'Identitas Institusi Pendidikan Tinggi',
  },
  {
    name: '[SysAdmin 2E] Pengaturan Tab Mesin AI',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/settings?tab=pengaturan-ai',
    expectedStatus: 200,
    uniqueMarker: 'Parameter Model Asisten AI SIAJAR',
  },
  {
    name: '[SysAdmin 2E] Pengaturan Tab Penyimpanan File',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/settings?tab=penyimpanan-file',
    expectedStatus: 200,
    uniqueMarker: 'Penyimpanan Berkas (Supabase Storage)',
  },
  {
    name: '[SysAdmin 2E] Log Audit Sistem Read-Only',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/audit',
    expectedStatus: 200,
    uniqueMarker: 'Log Audit Sistem (Read-Only)',
  },

  // --- 8. FASE 2E: SUPER ADMINISTRATOR (6 HUBS + SUBTABS) ---
  {
    name: '[SuperAdmin 2E] Dashboard Universitas',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin',
    expectedStatus: 200,
    uniqueMarker: 'Audit & Keamanan Portal SIAJAR',
  },
  {
    name: '[SuperAdmin 2E] Kelola Pengguna & Impersonate',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/users',
    expectedStatus: 200,
    uniqueMarker: 'Kelola Pengguna & Penyamaran Sesi (Impersonate)',
  },
  {
    name: '[SuperAdmin 2E] Role & Permission Matrix',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/roles',
    expectedStatus: 200,
    uniqueMarker: 'Role & Permission Matrix (7 Peran SIAJAR)',
  },
  {
    name: '[SuperAdmin 2E] Kebijakan Tab Akademik',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/policies?tab=akademik',
    expectedStatus: 200,
    uniqueMarker: 'Aturan Kelayakan Akademik Baku',
  },
  {
    name: '[SuperAdmin 2E] Kebijakan Tab Ujian & Pengawasan',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/policies?tab=ujian-pengawasan',
    expectedStatus: 200,
    uniqueMarker: 'Regulasi Proctoring & Sanksi Otomatis',
  },
  {
    name: '[SuperAdmin 2E] Kebijakan Tab Privasi & Retensi',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/policies?tab=privasi-retensi',
    expectedStatus: 200,
    uniqueMarker: 'Kebijakan Retensi Data Sensitif (UU PDP)',
  },
  {
    name: '[SuperAdmin 2E] Pengumuman Global',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/announcements',
    expectedStatus: 200,
    uniqueMarker: 'Pengumuman Global Universitas',
  },

  // --- 9. FASE 2E: ADMIN LEGACY REDIRECT TESTS ---
  {
    name: '[Redirect 2E] /admin/master -> Kelola Pengguna',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/master',
    expectedStatus: 307,
    expectedRedirect: '/admin/users',
  },
  {
    name: '[Redirect 2E] /admin/pengumuman -> Pengumuman Global',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/pengumuman',
    expectedStatus: 307,
    expectedRedirect: '/admin/announcements',
  },
  {
    name: '[Redirect 2E] /admin/kebijakan -> Kebijakan Universitas',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/kebijakan',
    expectedStatus: 307,
    expectedRedirect: '/admin/policies',
  },
  {
    name: '[Redirect 2E] /admin/audit -> Log Audit Sistem',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/admin/audit',
    expectedStatus: 307,
    expectedRedirect: '/admin/system/audit',
  },
  {
    name: '[Redirect 2E] /admin/system/status -> Monitoring Sistem',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin/system/status',
    expectedStatus: 307,
    expectedRedirect: '/admin/system/monitoring',
  },

  // --- 10. FASE 2E: UJI NEGATIF NON-ADMIN KE /admin & /admin/system ---
  {
    name: '[Uji Negatif 2E] Mahasiswa dilarang ke /admin (Redirect /student)',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/admin',
    expectedStatus: 307,
    expectedRedirect: '/student',
  },
  {
    name: '[Uji Negatif 2E] Dosen dilarang ke /admin (Redirect /lecturer)',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/admin',
    expectedStatus: 307,
    expectedRedirect: '/lecturer',
  },
  {
    name: '[Uji Negatif 2E] Staf dilarang ke /admin (Redirect /staff)',
    role: USERS.STAFF.role,
    userId: USERS.STAFF.id,
    path: '/admin',
    expectedStatus: 307,
    expectedRedirect: '/staff',
  },
  {
    name: '[Uji Negatif 2E] Kaprodi dilarang ke /admin (Redirect /coordinator)',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/admin',
    expectedStatus: 307,
    expectedRedirect: '/coordinator',
  },
  {
    name: '[Uji Negatif 2E] SYSTEM_ADMIN dilarang ke /admin (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/admin',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
];

async function runTest(test: TestCase): Promise<{ success: boolean; message: string }> {
  try {
    const cookieHeader = `demo_session=${test.userId}; active_role=${test.role};`;
    const res = await fetch(`${BASE_URL}${test.path}`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
      redirect: 'manual',
    });

    const status = res.status;

    // Uji redirect
    if (test.expectedStatus === 307 || test.expectedStatus === 302) {
      const location = res.headers.get('location') || '';
      const locationMatch = location.includes(test.expectedRedirect || '');
      if (status === test.expectedStatus && locationMatch) {
        return { success: true, message: `OK (Redirect ${status} -> ${location})` };
      }
      return {
        success: false,
        message: `FAIL: Diharapkan ${test.expectedStatus} -> ${test.expectedRedirect}, didapat ${status} -> ${location}`,
      };
    }

    // Uji 200 + unique marker
    if (status !== test.expectedStatus) {
      return { success: false, message: `FAIL: Diharapkan HTTP ${test.expectedStatus}, didapat ${status}` };
    }

    const html = await res.text();
    const markerEscaped = test.uniqueMarker ? test.uniqueMarker.replace(/&/g, '&amp;') : '';
    const hasMarker = !test.uniqueMarker || html.includes(test.uniqueMarker) || html.includes(markerEscaped);

    if (!hasMarker) {
      return {
        success: false,
        message: `FAIL: Status 200 tapi penanda unik "${test.uniqueMarker}" tidak ditemukan pada konten respons!`,
      };
    }

    return { success: true, message: `OK (HTTP 200 + Verified Marker "${test.uniqueMarker}")` };
  } catch (err: any) {
    return { success: false, message: `ERROR: ${err.message}` };
  }
}

async function runNegativeActionTests() {
  console.log('------------------------------------------------------------------------------------------------------------------------');
  console.log('  UJI NEGATIF SERVER ACTION (A6): NEGATIVE TEST + POSITIVE CONTROL PAIRS & REJECTION REASONS                            ');
  console.log('------------------------------------------------------------------------------------------------------------------------');
  try {
    const res = await fetch(`${BASE_URL}/api/smoke-actions`, { method: 'GET' });
    if (!res.ok) {
      console.log(`\x1b[31m[FAIL]\x1b[0m Gagal mengakses /api/smoke-actions: HTTP ${res.status}`);
      return false;
    }
    const data = await res.json();
    console.log(`Total Pasangan Uji: ${data.total} | Pasangan Lolos: ${data.passed} | Gagal: ${data.failed}\n`);
    
    for (const p of data.results) {
      const isPassed = p.overallStatus === 'PASS';
      const badge = isPassed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
      console.log(`${badge} [${p.id}] ${p.actionName}: ${p.scenario}`);
      // Negative test output
      const negPassed = p.negativeTest.status === 'PASS';
      const negStatus = negPassed ? '\x1b[32mDITOLAK_SERVER (OK)\x1b[0m' : '\x1b[31mLOLOS_UNAUTHORIZED (FAIL)\x1b[0m';
      console.log(`   ├─ [-] NEGATIF : Role '${p.negativeTest.testedRole}' -> ${p.actionName}`);
      console.log(`   │      Hasil    : ${negStatus}`);
      console.log(`   │      Alasan   : "${p.negativeTest.rejectionReason || 'N/A'}"`);
      // Positive control output
      const posPassed = p.positiveControl.status === 'PASS';
      const posStatus = posPassed ? '\x1b[32mBERHASIL_SERVER (OK)\x1b[0m' : `\x1b[31mGAGAL_SERVER (FAIL: ${p.positiveControl.detail})\x1b[0m`;
      console.log(`   └─ [+] KONTROL : Role '${p.positiveControl.authorizedRole}' -> ${p.actionName}`);
      console.log(`          Hasil    : ${posStatus}`);
      console.log('');
    }
    return data.failed === 0;
  } catch (err: any) {
    console.log(`\x1b[31m[FAIL]\x1b[0m Error memanggil /api/smoke-actions: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('===============================================================');
  console.log('  SIAJAR - PERMANENT ROLE & ROUTE SMOKE TESTS (Fase 2C & 2D)   ');
  console.log('===============================================================');
  console.log(`Target: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    const result = await runTest(tc);
    const badge = result.success ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${badge} ${tc.name}`);
    console.log(`       Path: ${tc.path}`);
    console.log(`       Detail: ${result.message}\n`);

    if (result.success) passed++;
    else failed++;
  }

  console.log('---------------------------------------------------------------');
  console.log(`Total Route Tests: ${TEST_CASES.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('===============================================================\n');

  const actionsPassed = await runNegativeActionTests();

  if (failed > 0 || !actionsPassed) {
    process.exit(1);
  } else {
    console.log('\x1b[32m[ALL SMOKE TESTS & NEGATIVE SECURITY CHECKS PASSED SUCCESSFULLY]\x1b[0m\n');
  }
}

main();
