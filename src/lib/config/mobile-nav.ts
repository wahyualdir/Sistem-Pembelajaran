/**
 * Konfigurasi Navigasi Bawah Ponsel (Mobile Bottom Nav) SIAJAR.
 * Wajib mereferensikan id item yang SUDAH ADA di MENU_CONFIG (src/lib/config/menu-config.ts).
 * 4 slot utama per peran + 1 slot "Lainnya" (membuka drawer samping kiri).
 */

export const MOBILE_NAV_CONFIG: Record<string, string[]> = {
  STUDENT: ['mhs-beranda', 'mhs-kelas', 'mhs-kalender', 'mhs-nilai-saya'],
  TEACHING_ASSISTANT: ['ta-beranda', 'ta-kelas-asistensi', 'ta-koreksi', 'ta-kalender'],
  LECTURER: ['dsn-beranda', 'dsn-kelas', 'dsn-berita-acara', 'dsn-ujian-kuis'],
  PROGRAM_COORDINATOR: [
    'kaprodi-beranda',
    'kaprodi-perkuliahan',
    'kaprodi-persetujuan-nilai',
    'kaprodi-laporan',
  ],
  ACADEMIC_STAFF: [
    'staf-beranda',
    'staf-kelas-peserta',
    'staf-jadwal',
    'staf-pengumuman-acara',
  ],
  SYSTEM_ADMIN: [
    'sys-beranda',
    'sys-pemantauan',
    'sys-log-audit',
    'sys-pengaturan-sistem',
  ],
  SUPER_ADMIN: [
    'sa-beranda',
    'sa-akun-pengguna',
    'sys-pemantauan',
    'sys-log-audit',
  ],
};
