import React from 'react';
import {
  GraduationCap,
  CalendarDays,
  Calendar,
  Bell,
  Layers,
  Award,
  BookOpen,
  FileText,
  CheckSquare,
  CheckCircle2,
  FolderArchive,
  MessageSquare,
  Users,
  UserCheck,
  User,
  Laptop,
  Settings,
  Sliders,
  HelpCircle,
  CalendarCheck2,
  ClipboardList,
  ShieldAlert,
  LayoutDashboard,
  PlusCircle,
  AlertCircle,
  Clock,
  Key,
  FileSpreadsheet,
  MapPin,
  Activity,
  Download,
  Compass,
  ArrowRight,
  Server,
  Code,
  Globe,
  ShieldCheck,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  permission?: string;
  badge?: number | string;
  isShortcut?: boolean;
}

export interface MenuGroup {
  id: string;
  title: string;
  roles: string[];
  items: MenuItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface DynamicMenuBadges {
  unreadCount?: number;
  taGradingCount?: number; // TODO(backend): query unreviewed submissions count across TA classes
  lecturerReviewCount?: number; // TODO(backend): query essay & coding pending review count
  coordinatorApprovalsCount?: number; // TODO(backend): query pending approval count for prodi
}

export const BERANDA_CHIPS = [
  'Semua',
  'Kelas Saya',
  'Tugas & Kuis',
  'Ujian',
  'Presensi',
  'Jadwal',
  'Nilai',
] as const;

export type BerandaChip = (typeof BERANDA_CHIPS)[number];

// Item Sistem yang digunakan ulang oleh SUPER_ADMIN dari SYSTEM_ADMIN (DRY principle)
export const SYSTEM_ADMIN_SHARED_ITEMS: MenuItem[] = [
  { id: 'sa-sys-monitoring', label: 'Monitoring Sistem', href: '/admin/system/status', icon: Activity, roles: ['SUPER_ADMIN'] },
  { id: 'sa-sys-integrasi', label: 'Integrasi', href: '/admin/integrations/meeting', icon: Globe, roles: ['SUPER_ADMIN'] },
  { id: 'sa-sys-keamanan', label: 'Keamanan', href: '/admin/security/sessions', icon: Laptop, roles: ['SUPER_ADMIN'] },
  { id: 'sa-sys-backup', label: 'Backup & Restore', href: '/admin/security/backup', icon: FolderArchive, roles: ['SUPER_ADMIN'] },
  { id: 'sa-sys-pengaturan', label: 'Pengaturan Platform', href: '/admin/settings/branding', icon: Sliders, roles: ['SUPER_ADMIN'] },
  { id: 'sa-sys-audit', label: 'Audit Log', href: '/admin/audit', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
];

// Konfigurasi Navigasi Lengkap SIAJAR LMS per Role (Perampingan Menu Bagian 2)
export const MENU_CONFIG: Record<string, MenuGroup[]> = {
  // 2.1 MAHASISWA (17 -> 11)
  STUDENT: [
    {
      id: 'mhs-utama',
      title: 'UTAMA',
      roles: ['STUDENT'],
      items: [
        { id: 'mhs-beranda', label: 'Beranda', href: '/student', icon: GraduationCap, roles: ['STUDENT'] },
        { id: 'mhs-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['STUDENT'] },
        { id: 'mhs-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['STUDENT'] },
      ],
    },
    {
      id: 'mhs-pembelajaran',
      title: 'PEMBELAJARAN',
      roles: ['STUDENT'],
      items: [
        { id: 'mhs-kelas', label: 'Kelas Saya', href: '/classes', icon: Layers, roles: ['STUDENT'] },
        { id: 'mhs-ujian-aktif', label: 'Ujian Aktif', href: '/exams', icon: Award, roles: ['STUDENT'], isShortcut: true },
        { id: 'mhs-pustaka', label: 'Pustaka Digital', href: '/library', icon: BookOpen, roles: ['STUDENT'] },
        { id: 'mhs-ai', label: 'Tanya AI SIAJAR', href: '/ai-assistant', icon: HelpCircle, roles: ['STUDENT'] },
      ],
    },
    {
      id: 'mhs-evaluasi',
      title: 'EVALUASI & PRESTASI',
      roles: ['STUDENT'],
      items: [
        { id: 'mhs-nilai', label: 'Nilai & Progres', href: '/grades', icon: CheckSquare, roles: ['STUDENT'] },
        { id: 'mhs-presensi', label: 'Presensi', href: '/attendance', icon: Clock, roles: ['STUDENT'] },
        { id: 'mhs-sertifikat', label: 'Sertifikat & Portofolio', href: '/certificates', icon: Award, roles: ['STUDENT'] },
      ],
    },
    {
      id: 'mhs-komunitas',
      title: 'KOMUNITAS',
      roles: ['STUDENT'],
      items: [
        { id: 'mhs-komunitas', label: 'Komunitas', href: '/community', icon: MessageSquare, roles: ['STUDENT'] },
      ],
    },
  ],

  // 2.2 ASISTEN (23 -> 14)
  TEACHING_ASSISTANT: [
    {
      id: 'ta-utama',
      title: 'UTAMA',
      roles: ['TEACHING_ASSISTANT'],
      items: [
        { id: 'ta-beranda', label: 'Beranda', href: '/student', icon: GraduationCap, roles: ['TEACHING_ASSISTANT'] },
        { id: 'ta-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['TEACHING_ASSISTANT'] },
        { id: 'ta-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['TEACHING_ASSISTANT'] },
      ],
    },
    {
      id: 'ta-mode-asisten',
      title: 'MODE ASISTEN',
      roles: ['TEACHING_ASSISTANT'],
      collapsible: true,
      defaultCollapsed: false,
      items: [
        { id: 'ta-kelas-asistensi', label: 'Kelas Diasistensi', href: '/ta/classes', icon: Layers, roles: ['TEACHING_ASSISTANT'] },
        { id: 'ta-koreksi-tugas', label: 'Antrean Koreksi', href: '/ta/grading', icon: ClipboardList, roles: ['TEACHING_ASSISTANT'] },
        { id: 'ta-pantau-ujian', label: 'Pantau Ujian', href: '/ta/exam-monitor', icon: ShieldAlert, roles: ['TEACHING_ASSISTANT'] },
      ],
    },
    {
      id: 'ta-pembelajaran',
      title: 'PEMBELAJARAN',
      roles: ['TEACHING_ASSISTANT'],
      items: [
        { id: 'ta-kelas-saya', label: 'Kelas Saya', href: '/classes', icon: Layers, roles: ['TEACHING_ASSISTANT'] },
        { id: 'ta-ujian-aktif', label: 'Ujian Aktif', href: '/exams', icon: Award, roles: ['TEACHING_ASSISTANT'], isShortcut: true },
        { id: 'ta-pustaka', label: 'Pustaka Digital', href: '/library', icon: BookOpen, roles: ['TEACHING_ASSISTANT'] },
        { id: 'ta-ai', label: 'Tanya AI SIAJAR', href: '/ai-assistant', icon: HelpCircle, roles: ['TEACHING_ASSISTANT'] },
      ],
    },
    {
      id: 'ta-evaluasi',
      title: 'EVALUASI & PRESTASI',
      roles: ['TEACHING_ASSISTANT'],
      items: [
        { id: 'ta-nilai', label: 'Nilai & Progres', href: '/grades', icon: CheckSquare, roles: ['TEACHING_ASSISTANT'] },
        { id: 'ta-presensi', label: 'Presensi', href: '/attendance', icon: Clock, roles: ['TEACHING_ASSISTANT'] },
        { id: 'ta-sertifikat', label: 'Sertifikat & Portofolio', href: '/certificates', icon: Award, roles: ['TEACHING_ASSISTANT'] },
      ],
    },
    {
      id: 'ta-komunitas',
      title: 'KOMUNITAS',
      roles: ['TEACHING_ASSISTANT'],
      items: [
        { id: 'ta-komunitas', label: 'Komunitas', href: '/community', icon: MessageSquare, roles: ['TEACHING_ASSISTANT'] },
      ],
    },
  ],

  // 2.3 DOSEN (24 -> 12)
  LECTURER: [
    {
      id: 'dsn-utama',
      title: 'UTAMA',
      roles: ['LECTURER'],
      items: [
        { id: 'dsn-dashboard', label: 'Dashboard Pengajar', href: '/lecturer', icon: LayoutDashboard, roles: ['LECTURER'] },
        { id: 'dsn-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['LECTURER'] },
        { id: 'dsn-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['LECTURER'] },
      ],
    },
    {
      id: 'dsn-pengajaran',
      title: 'PENGAJARAN',
      roles: ['LECTURER'],
      items: [
        { id: 'dsn-kelas', label: 'Kelas Diampu', href: '/classes', icon: Layers, roles: ['LECTURER'] },
        { id: 'dsn-pustaka', label: 'Pustaka Digital', href: '/library', icon: BookOpen, roles: ['LECTURER'] },
      ],
    },
    {
      id: 'dsn-ujian',
      title: 'UJIAN & KUIS',
      roles: ['LECTURER'],
      items: [
        { id: 'dsn-ujian-kuis', label: 'Ujian & Kuis', href: '/exams', icon: PlusCircle, roles: ['LECTURER'] },
        { id: 'dsn-bank-soal', label: 'Bank Soal', href: '/exams/question-bank', icon: FolderArchive, roles: ['LECTURER'] },
        { id: 'dsn-review', label: 'Review Essay & Coding', href: '/exams/review', icon: CheckSquare, roles: ['LECTURER'] },
      ],
    },
    {
      id: 'dsn-presensi',
      title: 'PRESENSI',
      roles: ['LECTURER'],
      items: [
        { id: 'dsn-presensi', label: 'Presensi', href: '/attendance', icon: FileSpreadsheet, roles: ['LECTURER'] },
      ],
    },
    {
      id: 'dsn-analitik',
      title: 'ANALITIK & NILAI',
      roles: ['LECTURER'],
      items: [
        { id: 'dsn-analitik-nilai', label: 'Analitik & Nilai', href: '/analytics', icon: Activity, roles: ['LECTURER'] },
      ],
    },
    {
      id: 'dsn-lainnya',
      title: 'LAINNYA',
      roles: ['LECTURER'],
      items: [
        { id: 'dsn-komunitas', label: 'Komunitas', href: '/community', icon: MessageSquare, roles: ['LECTURER'] },
        { id: 'dsn-mhs-bimbingan', label: 'Mahasiswa Bimbingan', href: '/lecturer/mentoring', icon: Users, roles: ['LECTURER'] },
      ],
    },
  ],

  // 2.4 PRODI (19 -> 10)
  PROGRAM_COORDINATOR: [
    {
      id: 'kaprodi-utama',
      title: 'UTAMA',
      roles: ['PROGRAM_COORDINATOR'],
      items: [
        { id: 'kaprodi-dashboard', label: 'Dashboard Prodi', href: '/coordinator', icon: Compass, roles: ['PROGRAM_COORDINATOR'] },
        { id: 'kaprodi-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['PROGRAM_COORDINATOR'] },
        { id: 'kaprodi-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['PROGRAM_COORDINATOR'] },
      ],
    },
    {
      id: 'kaprodi-manajemen',
      title: 'MANAJEMEN PRODI',
      roles: ['PROGRAM_COORDINATOR'],
      items: [
        { id: 'kaprodi-kurikulum', label: 'Kurikulum & CPL', href: '/coordinator/curriculum', icon: BookOpen, roles: ['PROGRAM_COORDINATOR'] },
        { id: 'kaprodi-matkul', label: 'Mata Kuliah', href: '/coordinator/courses', icon: Layers, roles: ['PROGRAM_COORDINATOR'] },
        { id: 'kaprodi-penugasan', label: 'Penugasan & Kelas', href: '/coordinator/assignments', icon: Users, roles: ['PROGRAM_COORDINATOR'] },
      ],
    },
    {
      id: 'kaprodi-monitoring',
      title: 'MONITORING',
      roles: ['PROGRAM_COORDINATOR'],
      items: [
        { id: 'kaprodi-monitoring', label: 'Monitoring', href: '/coordinator/monitoring', icon: Activity, roles: ['PROGRAM_COORDINATOR'] },
        { id: 'kaprodi-mhs-berisiko', label: 'Mahasiswa Berisiko', href: '/coordinator/monitoring/at-risk', icon: AlertCircle, roles: ['PROGRAM_COORDINATOR'] },
      ],
    },
    {
      id: 'kaprodi-persetujuan',
      title: 'PERSETUJUAN',
      roles: ['PROGRAM_COORDINATOR'],
      items: [
        { id: 'kaprodi-persetujuan', label: 'Persetujuan', href: '/coordinator/approvals', icon: CheckCircle2, roles: ['PROGRAM_COORDINATOR'] },
      ],
    },
    {
      id: 'kaprodi-laporan',
      title: 'LAPORAN & EVALUASI',
      roles: ['PROGRAM_COORDINATOR'],
      items: [
        { id: 'kaprodi-laporan', label: 'Laporan & Evaluasi', href: '/coordinator/reports', icon: FileSpreadsheet, roles: ['PROGRAM_COORDINATOR'] },
      ],
    },
  ],

  // 2.5 STAF AKADEMIK (21 -> 13)
  ACADEMIC_STAFF: [
    {
      id: 'staf-utama',
      title: 'UTAMA',
      roles: ['ACADEMIC_STAFF'],
      items: [
        { id: 'staf-dashboard', label: 'Dashboard', href: '/staff', icon: FileSpreadsheet, roles: ['ACADEMIC_STAFF'] },
        { id: 'staf-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['ACADEMIC_STAFF'] },
        { id: 'staf-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['ACADEMIC_STAFF'] },
      ],
    },
    {
      id: 'staf-master',
      title: 'DATA MASTER',
      roles: ['ACADEMIC_STAFF'],
      items: [
        { id: 'staf-mhs', label: 'Mahasiswa', href: '/staff/master/students', icon: Users, roles: ['ACADEMIC_STAFF'] },
        { id: 'staf-dosen', label: 'Dosen', href: '/staff/master/lecturers', icon: UserCheck, roles: ['ACADEMIC_STAFF'] },
        { id: 'staf-data-akademik', label: 'Data Akademik', href: '/staff/master/departments', icon: Compass, roles: ['ACADEMIC_STAFF'] },
      ],
    },
    {
      id: 'staf-penjadwalan',
      title: 'PENJADWALAN',
      roles: ['ACADEMIC_STAFF'],
      items: [
        { id: 'staf-jadwal', label: 'Jadwal', href: '/staff/schedules/classes', icon: CalendarDays, roles: ['ACADEMIC_STAFF'] },
      ],
    },
    {
      id: 'staf-kelas-peserta',
      title: 'KELAS & PESERTA',
      roles: ['ACADEMIC_STAFF'],
      items: [
        { id: 'staf-kelas-peserta', label: 'Kelas & Peserta', href: '/staff/classes/enroll', icon: Layers, roles: ['ACADEMIC_STAFF'] },
      ],
    },
    {
      id: 'staf-nilai-presensi',
      title: 'NILAI & PRESENSI',
      roles: ['ACADEMIC_STAFF'],
      items: [
        { id: 'staf-nilai-presensi', label: 'Nilai & Presensi', href: '/staff/grades/recap', icon: CheckSquare, roles: ['ACADEMIC_STAFF'] },
      ],
    },
    {
      id: 'staf-konten-layanan',
      title: 'KONTEN & LAYANAN',
      roles: ['ACADEMIC_STAFF'],
      items: [
        { id: 'staf-verif-berkas', label: 'Verifikasi Berkas', href: '/staff/services/verification', icon: FileText, roles: ['ACADEMIC_STAFF'] },
        { id: 'staf-pengumuman-event', label: 'Pengumuman & Event', href: '/announcements', icon: Bell, roles: ['ACADEMIC_STAFF'] },
        { id: 'staf-pustaka-sertifikat', label: 'Pustaka & Sertifikat', href: '/library', icon: BookOpen, roles: ['ACADEMIC_STAFF'] },
        { id: 'staf-moderasi-komunitas', label: 'Moderasi Komunitas', href: '/community/forum', icon: MessageSquare, roles: ['ACADEMIC_STAFF'] },
      ],
    },
  ],

  // 2.6 SYSTEM ADMINISTRATOR (18 -> 8)
  SYSTEM_ADMIN: [
    {
      id: 'sys-utama',
      title: 'UTAMA',
      roles: ['SYSTEM_ADMIN'],
      items: [
        { id: 'sys-dashboard', label: 'Dashboard Sistem', href: '/admin/system/status', icon: Server, roles: ['SYSTEM_ADMIN'] },
        { id: 'sys-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['SYSTEM_ADMIN'] },
      ],
    },
    {
      id: 'sys-mon-int',
      title: 'MONITORING & INTEGRASI',
      roles: ['SYSTEM_ADMIN'],
      items: [
        { id: 'sys-monitoring', label: 'Monitoring Sistem', href: '/admin/system/status', icon: Activity, roles: ['SYSTEM_ADMIN'] },
        { id: 'sys-integrasi', label: 'Integrasi', href: '/admin/integrations/meeting', icon: Globe, roles: ['SYSTEM_ADMIN'] },
      ],
    },
    {
      id: 'sys-keamanan',
      title: 'KEAMANAN',
      roles: ['SYSTEM_ADMIN'],
      items: [
        { id: 'sys-keamanan-item', label: 'Keamanan', href: '/admin/security/sessions', icon: Laptop, roles: ['SYSTEM_ADMIN'] },
        { id: 'sys-backup', label: 'Backup & Restore', href: '/admin/security/backup', icon: FolderArchive, roles: ['SYSTEM_ADMIN'] },
      ],
    },
    {
      id: 'sys-pengaturan',
      title: 'PENGATURAN',
      roles: ['SYSTEM_ADMIN'],
      items: [
        { id: 'sys-pengaturan-item', label: 'Pengaturan Platform', href: '/admin/settings/branding', icon: Sliders, roles: ['SYSTEM_ADMIN'] },
      ],
    },
    {
      id: 'sys-audit',
      title: 'AUDIT',
      roles: ['SYSTEM_ADMIN'],
      items: [
        { id: 'sys-audit-log', label: 'Audit Log', href: '/admin/audit', icon: ShieldCheck, roles: ['SYSTEM_ADMIN'] },
      ],
    },
  ],

  // 2.7 SUPER ADMIN (26 -> 6 terlihat + 1 grup SISTEM collapsed)
  SUPER_ADMIN: [
    {
      id: 'sa-utama',
      title: 'UTAMA',
      roles: ['SUPER_ADMIN'],
      items: [
        { id: 'sa-dashboard', label: 'Dashboard Universitas', href: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN'] },
        { id: 'sa-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['SUPER_ADMIN'] },
      ],
    },
    {
      id: 'sa-pengguna',
      title: 'PENGGUNA & AKSES',
      roles: ['SUPER_ADMIN'],
      items: [
        { id: 'sa-master', label: 'Kelola Pengguna', href: '/admin/master', icon: Users, roles: ['SUPER_ADMIN'] },
        { id: 'sa-roles', label: 'Role & Permission', href: '/admin/roles', icon: ShieldAlert, roles: ['SUPER_ADMIN'] },
      ],
    },
    {
      id: 'sa-kebijakan-global',
      title: 'KEBIJAKAN & GLOBAL',
      roles: ['SUPER_ADMIN'],
      items: [
        { id: 'sa-kebijakan', label: 'Kebijakan', href: '/admin/kebijakan', icon: BookOpen, roles: ['SUPER_ADMIN'] },
        { id: 'sa-pengumuman', label: 'Pengumuman Global', href: '/admin/pengumuman', icon: Bell, roles: ['SUPER_ADMIN'] },
      ],
    },
    {
      id: 'sa-sistem',
      title: 'SISTEM',
      roles: ['SUPER_ADMIN'],
      collapsible: true,
      defaultCollapsed: true,
      items: SYSTEM_ADMIN_SHARED_ITEMS,
    },
  ],
};

/**
 * Normalisasi kode role dari berbagai kemungkinan format input
 */
export function normalizeRoleCode(role?: string | null): string {
  const r = (role || '').toUpperCase();
  if (r === 'SUPERADMIN' || r === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (r === 'ADMIN' || r === 'SYSTEM_ADMIN' || r === 'SYSADMIN') return 'SYSTEM_ADMIN';
  if (r === 'DOSEN' || r === 'LECTURER' || r === 'TEACHER') return 'LECTURER';
  if (r === 'KAPRODI' || r === 'PROGRAM_COORDINATOR' || r === 'COORDINATOR' || r === 'PRODI') return 'PROGRAM_COORDINATOR';
  if (r === 'STAFF' || r === 'ACADEMIC_STAFF' || r === 'BAAK') return 'ACADEMIC_STAFF';
  if (r === 'TA' || r === 'ASDOS' || r === 'TEACHING_ASSISTANT' || r === 'ASISTEN') return 'TEACHING_ASSISTANT';
  return 'STUDENT';
}

/**
 * Mengambil grup navigasi untuk role yang aktif
 */
export function getMenuGroupsForRole(
  role?: string | null,
  badgesOrUnread: number | DynamicMenuBadges = 0,
  hasActiveExam: boolean = true
): MenuGroup[] {
  const norm = normalizeRoleCode(role);
  const groups = MENU_CONFIG[norm] || MENU_CONFIG.STUDENT;

  const badges: DynamicMenuBadges =
    typeof badgesOrUnread === 'number'
      ? { unreadCount: badgesOrUnread }
      : badgesOrUnread || {};

  // Clone dan sisipkan badge counter nyata (> 0)
  return groups.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => {
        // Pintasan Ujian Aktif: hanya tampil bila ada ujian aktif
        if (item.isShortcut && item.id.includes('ujian-aktif')) {
          return hasActiveExam;
        }
        return true;
      })
      .map((item) => {
        // 1. Notifikasi badge
        if (item.id.includes('notifikasi') && badges.unreadCount && badges.unreadCount > 0) {
          return { ...item, badge: badges.unreadCount };
        }
        // 2. Asisten: Antrean koreksi tugas
        if (item.id === 'ta-koreksi-tugas' && badges.taGradingCount && badges.taGradingCount > 0) {
          return { ...item, badge: badges.taGradingCount };
        }
        // 3. Dosen: Review Essay & Coding
        if (item.id === 'dsn-review' && badges.lecturerReviewCount && badges.lecturerReviewCount > 0) {
          return { ...item, badge: badges.lecturerReviewCount };
        }
        // 4. Prodi: Persetujuan
        if (item.id === 'kaprodi-persetujuan' && badges.coordinatorApprovalsCount && badges.coordinatorApprovalsCount > 0) {
          return { ...item, badge: badges.coordinatorApprovalsCount };
        }
        return item;
      }),
  }));
}

/**
 * Halaman default (home href) untuk masing-masing role
 */
export function getRoleHomeHref(role?: string | null): string {
  const norm = normalizeRoleCode(role);
  switch (norm) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'SYSTEM_ADMIN':
      return '/admin/system';
    case 'LECTURER':
      return '/lecturer';
    case 'PROGRAM_COORDINATOR':
      return '/coordinator';
    case 'ACADEMIC_STAFF':
      return '/staff';
    case 'TEACHING_ASSISTANT':
      return '/ta';
    case 'STUDENT':
    default:
      return '/student';
  }
}

/**
 * Label nama tampilan manusiawi seragam untuk role (Bagian 1 Prinsip Desain)
 */
export function getRoleDisplayName(role?: string | null): string {
  const norm = normalizeRoleCode(role);
  switch (norm) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'SYSTEM_ADMIN':
      return 'System Administrator';
    case 'LECTURER':
      return 'Dosen Pengampu';
    case 'PROGRAM_COORDINATOR':
      return 'Prodi';
    case 'ACADEMIC_STAFF':
      return 'Staf Akademik';
    case 'TEACHING_ASSISTANT':
      return 'Asisten';
    case 'STUDENT':
    default:
      return 'Mahasiswa';
  }
}

/**
 * Daftar semua rute legacy dan pengalihan LMS barunya
 */
export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  // Mahasiswa Legacy
  '/mahasiswa/krs': '/calendar',
  '/mahasiswa/jadwal': '/calendar',
  '/mahasiswa/nilai': '/grades',
  '/mahasiswa/simulasi-ipk': '/grades',
  '/mahasiswa/ujian': '/exams',
  '/mahasiswa/tugas': '/classes',
  '/mahasiswa/bimbingan': '/student',
  '/mahasiswa/ukt': '/student',
  '/mahasiswa/surat': '/student',
  '/mahasiswa/dashboard': '/student',
  '/mahasiswa/pengumuman': '/community?tab=pengumuman',
  '/mahasiswa/preferensi-notifikasi': '/notifications/preferences',
  '/mahasiswa/presensi': '/attendance',

  // Dosen Legacy
  '/dosen/dashboard': '/lecturer',
  '/dosen/kelas': '/classes',
  '/dosen/presensi': '/attendance',
  '/dosen/nilai': '/analytics?tab=rekap',
  '/dosen/materi-tugas': '/classes',
  '/dosen/perwalian': '/lecturer/mentoring',
  '/dosen/laporan': '/analytics',

  // Admin Legacy
  '/admin/dashboard': '/admin',
  '/admin/ukt': '/admin',
  '/admin/surat': '/admin',
  '/admin/kalender': '/calendar',
  '/admin/kurikulum': '/coordinator/curriculum',
  '/admin/jadwal': '/staff/schedules/classes',
  '/admin/ujian': '/exams',
  '/admin/nilai': '/staff/grades/recap',
  '/admin/notifications': '/notifications',
};

/**
 * Pemeriksaan apakah rute boleh diakses oleh peran aktif (RBAC di server)
 */
export function isRouteAllowedForRole(pathname: string, role?: string | null, isImpersonating?: boolean): boolean {
  const norm = normalizeRoleCode(role);

  // A2: SYSTEM_ADMIN dilarang mengakses rute akademik dan portal non-admin
  if (norm === 'SYSTEM_ADMIN') {
    const isAcademic =
      pathname.startsWith('/attendance') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/grades') ||
      pathname.startsWith('/exams') ||
      pathname.startsWith('/classes') ||
      pathname.startsWith('/coordinator') ||
      pathname.startsWith('/student') ||
      pathname.startsWith('/lecturer') ||
      pathname.startsWith('/ta') ||
      pathname.startsWith('/staff');
    if (isAcademic) return false;
    return true;
  }

  // A2: SUPER_ADMIN dilarang merender rute akademik/role portals kecuali saat impersonate aktif
  if (norm === 'SUPER_ADMIN' && !isImpersonating) {
    const isAcademicOrRolePortal =
      pathname.startsWith('/attendance') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/grades') ||
      pathname.startsWith('/exams') ||
      pathname.startsWith('/classes') ||
      pathname.startsWith('/coordinator') ||
      pathname.startsWith('/student') ||
      pathname.startsWith('/lecturer') ||
      pathname.startsWith('/ta') ||
      pathname.startsWith('/staff');
    if (isAcademicOrRolePortal) return false;
    return true;
  }

  if (norm === 'SUPER_ADMIN') return true;

  // Proteksi admin
  if (pathname.startsWith('/admin')) {
    return norm === 'SYSTEM_ADMIN' || norm === 'SUPER_ADMIN';
  }

  // Proteksi kaprodi
  if (pathname.startsWith('/coordinator')) {
    return norm === 'PROGRAM_COORDINATOR';
  }

  // Proteksi staf akademik
  if (pathname.startsWith('/staff')) {
    return norm === 'ACADEMIC_STAFF';
  }

  // Proteksi dosen
  if (pathname.startsWith('/lecturer')) {
    return norm === 'LECTURER' || norm === 'PROGRAM_COORDINATOR';
  }

  // Proteksi asisten
  if (pathname.startsWith('/ta')) {
    return norm === 'TEACHING_ASSISTANT';
  }

  return true;
}

/**
 * Menentukan apakah item navigasi aktif untuk pathname saat ini.
 * Memastikan HANYA TEPAT SATU item yang aktif di sidebar pada satu waktu.
 *
 * @param itemHref Href dari menu item saat ini
 * @param pathname Pathname aktif dari router (mis. /exams/history)
 * @param allHrefs Daftar seluruh href menu item yang ada di sidebar untuk perbandingan spesifisitas
 */
export function isNavItemActive(
  itemHref: string,
  pathname: string,
  allHrefs?: string[]
): boolean {
  const itemPath = itemHref.split('?')[0];
  const currentPath = pathname.split('?')[0];

  // 1. Exact match selalu aktif
  if (currentPath === itemPath) {
    return true;
  }

  // Jika ada item lain di sidebar yang exact match dengan currentPath,
  // maka item non-exact (prefix match) TIDAK BOLEH aktif sama sekali
  if (allHrefs && allHrefs.some((h) => h.split('?')[0] === currentPath)) {
    return false;
  }

  // Rute utama / root / dashboard tidak menggunakan prefix matching
  const nonPrefixPaths = ['/', '/admin', '/student', '/lecturer', '/coordinator', '/staff', '/ta'];
  if (nonPrefixPaths.includes(itemPath)) {
    return false;
  }

  // 2. Cek apakah currentPath adalah sub-path dari itemPath
  const isSubpath = currentPath.startsWith(`${itemPath}/`);
  if (!isSubpath) {
    return false;
  }

  // 3. Jika currentPath adalah subpath, pastikan tidak ada menu item lain yang lebih spesifik / tepat
  if (allHrefs && allHrefs.length > 0) {
    const hasMoreSpecificMatch = allHrefs.some((otherHref) => {
      const otherPath = otherHref.split('?')[0];
      if (otherPath === itemPath) return false;
      if (nonPrefixPaths.includes(otherPath)) return false;
      return (
        otherPath.startsWith(`${itemPath}/`) &&
        (currentPath === otherPath || currentPath.startsWith(`${otherPath}/`))
      );
    });

    if (hasMoreSpecificMatch) {
      return false;
    }
  }

  return true;
}

