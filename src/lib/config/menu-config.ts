import React from 'react';
import {
  GraduationCap,
  CalendarDays,
  Bell,
  Megaphone,
  Layers,
  CalendarCheck2,
  FileCheck2,
  Library,
  Sparkles,
  MessageCircle,
  CheckSquare,
  Trophy,
  Award,
  MessageSquare,
  ClipboardCheck,
  FilePlus2,
  ClipboardList,
  ShieldAlert,
  LayoutDashboard,
  NotebookPen,
  PlusCircle,
  FolderArchive,
  BarChart3,
  ListChecks,
  Table2,
  MessageSquareWarning,
  Users,
  Compass,
  BookOpen,
  Activity,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  UserCheck,
  Database,
  CalendarClock,
  FileText,
  Server,
  Globe,
  Lock,
  Sliders,
  ScrollText,
  Scale,
  Settings,
  LifeBuoy,
  Eye,
  Brain,
  HandHelping,
  BadgeCheck,
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
  unreadMessages?: number;
  taGradingCount?: number;
  lecturerReviewCount?: number;
  disputeCount?: number;
  pendingEvaluations?: number;
  coordinatorApprovalsCount?: number;
  requestCount?: number;
  flashcardsDue?: number;
  openHelpRequests?: number;
  contentPendingReview?: number;
}

export const BERANDA_CHIPS = [
  'Semua',
  'Kelas Saya',
  'Tugas dan Kuis',
  'Ujian',
  'Presensi',
  'Jadwal',
  'Nilai',
] as const;

export type BerandaChip = (typeof BERANDA_CHIPS)[number];

// Item Sistem yang digunakan bersama oleh SYSTEM_ADMIN dan SUPER_ADMIN (Sub-hub Sistem)
export const SYSTEM_ADMIN_SHARED_ITEMS: MenuItem[] = [
  { id: 'sys-pemantauan', label: 'Pemantauan', href: '/admin/system/monitoring', icon: Activity, roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'] },
  { id: 'sys-integrasi', label: 'Integrasi', href: '/admin/system/integrations', icon: Globe, roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'] },
  { id: 'sys-sesi-login', label: 'Sesi Login', href: '/admin/system/security', icon: Lock, roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'] },
  { id: 'sys-cadangan', label: 'Cadangan Data', href: '/admin/system/backup', icon: FolderArchive, roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'] },
  { id: 'sys-pengaturan-item', label: 'Pengaturan Sistem', href: '/admin/system/settings', icon: Sliders, roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'] },
  { id: 'sys-log-audit', label: 'Log Audit', href: '/admin/system/audit', icon: ScrollText, roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'] },
];

// 6.1 Mahasiswa (STUDENT) - 16 item
const STUDENT_GROUPS: MenuGroup[] = [
  {
    id: 'mhs-utama',
    title: '',
    roles: ['STUDENT'],
    items: [
      { id: 'mhs-beranda', label: 'Beranda', href: '/student', icon: GraduationCap, roles: ['STUDENT'] },
      { id: 'mhs-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['STUDENT'] },
      { id: 'mhs-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['STUDENT'] },
      { id: 'mhs-pengumuman', label: 'Pengumuman', href: '/announcements', icon: Megaphone, roles: ['STUDENT'] },
    ],
  },
  {
    id: 'mhs-belajar',
    title: 'Belajar',
    roles: ['STUDENT'],
    items: [
      { id: 'mhs-kelas', label: 'Kelas Saya', href: '/classes', icon: Layers, roles: ['STUDENT'] },
      { id: 'mhs-ujian', label: 'Ujian', href: '/exams', icon: FileCheck2, roles: ['STUDENT'] },
      { id: 'mhs-perpustakaan', label: 'Perpustakaan', href: '/library', icon: Library, roles: ['STUDENT'] },
      { id: 'mhs-tanya-ai', label: 'Tanya AI', href: '/ai-assistant', icon: Sparkles, roles: ['STUDENT'] },
      { id: 'mhs-pesan', label: 'Pesan', href: '/messages', icon: MessageCircle, roles: ['STUDENT'] },
      { id: 'mhs-flashcard', label: 'Flashcard', href: '/flashcards', icon: Brain, roles: ['STUDENT'] },
      { id: 'mhs-tukar-keahlian', label: 'Tukar Keahlian', href: '/skill-exchange', icon: HandHelping, roles: ['STUDENT'] },
    ],
  },
  {
    id: 'mhs-nilai',
    title: 'Nilai',
    roles: ['STUDENT'],
    items: [
      { id: 'mhs-nilai-saya', label: 'Nilai Saya', href: '/grades', icon: CheckSquare, roles: ['STUDENT'] },
      { id: 'mhs-pencapaian', label: 'Pencapaian', href: '/achievements', icon: Trophy, roles: ['STUDENT'] },
      { id: 'mhs-sertifikat', label: 'Sertifikat', href: '/certificates', icon: Award, roles: ['STUDENT'] },
    ],
  },
  {
    id: 'mhs-lainnya',
    title: 'Lainnya',
    roles: ['STUDENT'],
    items: [
      { id: 'mhs-komunitas', label: 'Komunitas', href: '/community', icon: MessageSquare, roles: ['STUDENT'] },
      { id: 'mhs-evaluasi-dosen', label: 'Evaluasi Dosen', href: '/evaluations', icon: ClipboardCheck, roles: ['STUDENT'] },
      { id: 'mhs-pengajuan', label: 'Pengajuan', href: '/requests', icon: FilePlus2, roles: ['STUDENT'] },
    ],
  },
];

// 6.2 Asisten Dosen (TEACHING_ASSISTANT) - 19 item
// Menu Asisten = menu Mahasiswa (6.1) ditambah satu grup di antara "Utama" dan "Belajar". Susun lewat komposisi. Beranda memakai rute /ta.
const TA_UTAMA_GROUP: MenuGroup = {
  id: 'ta-utama',
  title: '',
  roles: ['TEACHING_ASSISTANT'],
  items: [
    { id: 'ta-beranda', label: 'Beranda', href: '/ta', icon: GraduationCap, roles: ['TEACHING_ASSISTANT'] },
    { id: 'ta-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['TEACHING_ASSISTANT'] },
    { id: 'ta-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['TEACHING_ASSISTANT'] },
    { id: 'ta-pengumuman', label: 'Pengumuman', href: '/announcements', icon: Megaphone, roles: ['TEACHING_ASSISTANT'] },
  ],
};

const TA_ASISTENSI_GROUP: MenuGroup = {
  id: 'ta-asistensi',
  title: 'Asistensi',
  roles: ['TEACHING_ASSISTANT'],
  collapsible: true,
  defaultCollapsed: false,
  items: [
    { id: 'ta-kelas-asistensi', label: 'Kelas Asistensi', href: '/ta/classes', icon: Layers, roles: ['TEACHING_ASSISTANT'] },
    { id: 'ta-koreksi', label: 'Koreksi', href: '/ta/grading', icon: ClipboardList, roles: ['TEACHING_ASSISTANT'] },
    { id: 'ta-pantau-ujian', label: 'Pantau Ujian', href: '/ta/exam-monitor', icon: ShieldAlert, roles: ['TEACHING_ASSISTANT'] },
  ],
};

const TEACHING_ASSISTANT_GROUPS: MenuGroup[] = [
  TA_UTAMA_GROUP,
  TA_ASISTENSI_GROUP,
  ...STUDENT_GROUPS.slice(1).map((g) => ({
    ...g,
    roles: ['TEACHING_ASSISTANT'],
    items: g.items.map((i) => ({ ...i, roles: ['TEACHING_ASSISTANT'] })),
  })),
];

// 6.3 Dosen Pengampu (LECTURER) - 19 item
const LECTURER_GROUPS: MenuGroup[] = [
  {
    id: 'dsn-utama',
    title: '',
    roles: ['LECTURER'],
    items: [
      { id: 'dsn-beranda', label: 'Beranda', href: '/lecturer', icon: LayoutDashboard, roles: ['LECTURER'] },
      { id: 'dsn-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['LECTURER'] },
      { id: 'dsn-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['LECTURER'] },
      { id: 'dsn-pengumuman', label: 'Pengumuman', href: '/announcements', icon: Megaphone, roles: ['LECTURER'] },
    ],
  },
  {
    id: 'dsn-mengajar',
    title: 'Mengajar',
    roles: ['LECTURER'],
    items: [
      { id: 'dsn-kelas', label: 'Kelas Saya', href: '/classes', icon: Layers, roles: ['LECTURER'] },
      { id: 'dsn-berita-acara', label: 'Berita Acara', href: '/lecturer/journals', icon: NotebookPen, roles: ['LECTURER'] },
      { id: 'dsn-tinjau-konten', label: 'Tinjau Konten', href: '/lecturer/content-review', icon: BadgeCheck, roles: ['LECTURER'] },
      { id: 'dsn-perpustakaan', label: 'Perpustakaan', href: '/library', icon: Library, roles: ['LECTURER'] },
    ],
  },
  {
    id: 'dsn-ujian-nilai',
    title: 'Ujian dan Nilai',
    roles: ['LECTURER'],
    items: [
      { id: 'dsn-ujian-kuis', label: 'Ujian dan Kuis', href: '/exams', icon: PlusCircle, roles: ['LECTURER'] },
      { id: 'dsn-bank-soal', label: 'Bank Soal', href: '/exams/question-bank', icon: FolderArchive, roles: ['LECTURER'] },
      { id: 'dsn-periksa-jawaban', label: 'Periksa Jawaban', href: '/exams/review', icon: CheckSquare, roles: ['LECTURER'] },
      { id: 'dsn-analisis-soal', label: 'Analisis Soal', href: '/exams/analysis', icon: BarChart3, roles: ['LECTURER'] },
      { id: 'dsn-rubrik', label: 'Rubrik', href: '/lecturer/rubrics', icon: ListChecks, roles: ['LECTURER'] },
      { id: 'dsn-buku-nilai', label: 'Buku Nilai', href: '/analytics', icon: Table2, roles: ['LECTURER'] },
      { id: 'dsn-sanggahan', label: 'Sanggahan', href: '/lecturer/disputes', icon: MessageSquareWarning, roles: ['LECTURER'] },
    ],
  },
  {
    id: 'dsn-lainnya',
    title: 'Lainnya',
    roles: ['LECTURER'],
    items: [
      { id: 'dsn-pesan', label: 'Pesan', href: '/messages', icon: MessageCircle, roles: ['LECTURER'] },
      { id: 'dsn-mhs-bimbingan', label: 'Mahasiswa Bimbingan', href: '/lecturer/mentoring', icon: Users, roles: ['LECTURER'] },
      { id: 'dsn-hasil-evaluasi', label: 'Hasil Evaluasi', href: '/lecturer/evaluations', icon: ClipboardCheck, roles: ['LECTURER'] },
      { id: 'dsn-komunitas', label: 'Komunitas', href: '/community', icon: MessageSquare, roles: ['LECTURER'] },
    ],
  },
];

// 6.4 Koordinator Program Studi (PROGRAM_COORDINATOR) - 12 item
const PROGRAM_COORDINATOR_GROUPS: MenuGroup[] = [
  {
    id: 'kaprodi-utama',
    title: '',
    roles: ['PROGRAM_COORDINATOR'],
    items: [
      { id: 'kaprodi-beranda', label: 'Beranda', href: '/coordinator', icon: Compass, roles: ['PROGRAM_COORDINATOR'] },
      { id: 'kaprodi-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['PROGRAM_COORDINATOR'] },
      { id: 'kaprodi-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['PROGRAM_COORDINATOR'] },
      { id: 'kaprodi-pengumuman', label: 'Pengumuman', href: '/announcements', icon: Megaphone, roles: ['PROGRAM_COORDINATOR'] },
    ],
  },
  {
    id: 'kaprodi-prodi',
    title: 'Prodi',
    roles: ['PROGRAM_COORDINATOR'],
    items: [
      { id: 'kaprodi-kurikulum', label: 'Kurikulum', href: '/coordinator/curriculum', icon: BookOpen, roles: ['PROGRAM_COORDINATOR'] },
      { id: 'kaprodi-matkul', label: 'Mata Kuliah', href: '/coordinator/courses', icon: Layers, roles: ['PROGRAM_COORDINATOR'] },
      { id: 'kaprodi-penugasan', label: 'Penugasan Dosen', href: '/coordinator/assignments', icon: Users, roles: ['PROGRAM_COORDINATOR'] },
      { id: 'kaprodi-evaluasi-dosen', label: 'Evaluasi Dosen', href: '/coordinator/evaluations', icon: ClipboardCheck, roles: ['PROGRAM_COORDINATOR'] },
    ],
  },
  {
    id: 'kaprodi-pantauan',
    title: 'Pantauan',
    roles: ['PROGRAM_COORDINATOR'],
    items: [
      { id: 'kaprodi-perkuliahan', label: 'Perkuliahan', href: '/coordinator/monitoring', icon: Activity, roles: ['PROGRAM_COORDINATOR'] },
      { id: 'kaprodi-mhs-berisiko', label: 'Mahasiswa Berisiko', href: '/coordinator/monitoring/at-risk', icon: AlertCircle, roles: ['PROGRAM_COORDINATOR'] },
    ],
  },
  {
    id: 'kaprodi-persetujuan',
    title: 'Persetujuan',
    roles: ['PROGRAM_COORDINATOR'],
    items: [
      { id: 'kaprodi-persetujuan-nilai', label: 'Persetujuan Nilai', href: '/coordinator/approvals', icon: CheckCircle2, roles: ['PROGRAM_COORDINATOR'] },
      { id: 'kaprodi-laporan', label: 'Laporan', href: '/coordinator/reports', icon: FileSpreadsheet, roles: ['PROGRAM_COORDINATOR'] },
    ],
  },
];

// 6.5 Staf Akademik (ACADEMIC_STAFF) - 13 item
const ACADEMIC_STAFF_GROUPS: MenuGroup[] = [
  {
    id: 'staf-utama',
    title: '',
    roles: ['ACADEMIC_STAFF'],
    items: [
      { id: 'staf-beranda', label: 'Beranda', href: '/staff', icon: LayoutDashboard, roles: ['ACADEMIC_STAFF'] },
      { id: 'staf-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['ACADEMIC_STAFF'] },
      { id: 'staf-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['ACADEMIC_STAFF'] },
    ],
  },
  {
    id: 'staf-data-induk',
    title: 'Data Induk',
    roles: ['ACADEMIC_STAFF'],
    items: [
      { id: 'staf-mhs', label: 'Mahasiswa', href: '/staff/master/students', icon: Users, roles: ['ACADEMIC_STAFF'] },
      { id: 'staf-dosen', label: 'Dosen', href: '/staff/master/lecturers', icon: UserCheck, roles: ['ACADEMIC_STAFF'] },
      { id: 'staf-data-akademik', label: 'Data Akademik', href: '/staff/master', icon: Database, roles: ['ACADEMIC_STAFF'] },
    ],
  },
  {
    id: 'staf-akademik',
    title: 'Akademik',
    roles: ['ACADEMIC_STAFF'],
    items: [
      { id: 'staf-jadwal', label: 'Jadwal', href: '/staff/schedules', icon: CalendarClock, roles: ['ACADEMIC_STAFF'] },
      { id: 'staf-kelas-peserta', label: 'Kelas dan Peserta', href: '/staff/classes', icon: Layers, roles: ['ACADEMIC_STAFF'] },
      { id: 'staf-nilai-presensi', label: 'Nilai dan Presensi', href: '/staff/grades', icon: CheckSquare, roles: ['ACADEMIC_STAFF'] },
    ],
  },
  {
    id: 'staf-layanan',
    title: 'Layanan',
    roles: ['ACADEMIC_STAFF'],
    items: [
      { id: 'staf-pengajuan-masuk', label: 'Pengajuan Masuk', href: '/staff/services/verification', icon: FileText, roles: ['ACADEMIC_STAFF'] },
      { id: 'staf-pengumuman-acara', label: 'Pengumuman dan Acara', href: '/staff/announcements', icon: Megaphone, roles: ['ACADEMIC_STAFF'] },
      { id: 'staf-berkas-sertifikat', label: 'Berkas dan Sertifikat', href: '/staff/content', icon: BookOpen, roles: ['ACADEMIC_STAFF'] },
      { id: 'staf-moderasi', label: 'Moderasi', href: '/staff/moderation', icon: MessageSquare, roles: ['ACADEMIC_STAFF'] },
    ],
  },
];

// 6.6 System Administrator (SYSTEM_ADMIN) - 8 item
const SYSTEM_ADMIN_GROUPS: MenuGroup[] = [
  {
    id: 'sys-utama',
    title: '',
    roles: ['SYSTEM_ADMIN'],
    items: [
      { id: 'sys-beranda', label: 'Beranda', href: '/admin/system', icon: Server, roles: ['SYSTEM_ADMIN'] },
      { id: 'sys-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['SYSTEM_ADMIN'] },
    ],
  },
  {
    id: 'sys-server',
    title: 'Server',
    roles: ['SYSTEM_ADMIN'],
    items: [
      { id: 'sys-pemantauan', label: 'Pemantauan', href: '/admin/system/monitoring', icon: Activity, roles: ['SYSTEM_ADMIN'] },
      { id: 'sys-integrasi', label: 'Integrasi', href: '/admin/system/integrations', icon: Globe, roles: ['SYSTEM_ADMIN'] },
    ],
  },
  {
    id: 'sys-keamanan',
    title: 'Keamanan',
    roles: ['SYSTEM_ADMIN'],
    items: [
      { id: 'sys-sesi-login', label: 'Sesi Login', href: '/admin/system/security', icon: Lock, roles: ['SYSTEM_ADMIN'] },
      { id: 'sys-cadangan', label: 'Cadangan Data', href: '/admin/system/backup', icon: FolderArchive, roles: ['SYSTEM_ADMIN'] },
    ],
  },
  {
    id: 'sys-pengaturan',
    title: 'Pengaturan',
    roles: ['SYSTEM_ADMIN'],
    items: [
      { id: 'sys-pengaturan-sistem', label: 'Pengaturan Sistem', href: '/admin/system/settings', icon: Sliders, roles: ['SYSTEM_ADMIN'] },
      { id: 'sys-log-audit', label: 'Log Audit', href: '/admin/system/audit', icon: ScrollText, roles: ['SYSTEM_ADMIN'] },
    ],
  },
];

// 6.7 Super Administrator (SUPER_ADMIN) - 12 item
const SUPER_ADMIN_GROUPS: MenuGroup[] = [
  {
    id: 'sa-utama',
    title: '',
    roles: ['SUPER_ADMIN'],
    items: [
      { id: 'sa-beranda', label: 'Beranda', href: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN'] },
      { id: 'sa-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    id: 'sa-pengguna',
    title: 'Pengguna',
    roles: ['SUPER_ADMIN'],
    items: [
      { id: 'sa-akun-pengguna', label: 'Akun Pengguna', href: '/admin/users', icon: Users, roles: ['SUPER_ADMIN'] },
      { id: 'sa-peran-akses', label: 'Peran dan Akses', href: '/admin/roles', icon: ShieldAlert, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    id: 'sa-aturan-kampus',
    title: 'Aturan Kampus',
    roles: ['SUPER_ADMIN'],
    items: [
      { id: 'sa-aturan-akademik', label: 'Aturan Akademik', href: '/admin/policies', icon: Scale, roles: ['SUPER_ADMIN'] },
      { id: 'sa-pengumuman-kampus', label: 'Pengumuman Kampus', href: '/admin/announcements', icon: Megaphone, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    id: 'sa-sistem',
    title: 'Sistem',
    roles: ['SUPER_ADMIN'],
    collapsible: true,
    defaultCollapsed: true,
    items: SYSTEM_ADMIN_SHARED_ITEMS,
  },
];


/**
 * 6.8 Menu bersama semua peran (Grup Akun di paling bawah sidebar) - 3 item
 */
export const SHARED_SUPPORT_GROUP: MenuGroup = {
  id: 'shared-akun',
  title: 'Akun',
  roles: ['STUDENT', 'TEACHING_ASSISTANT', 'LECTURER', 'PROGRAM_COORDINATOR', 'PROGRAM_SECRETARY', 'LAB_HEAD', 'DEAN', 'ACADEMIC_STAFF', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  collapsible: true,
  defaultCollapsed: true,
  items: [
    { id: 'shared-pengaturan', label: 'Pengaturan', href: '/settings', icon: Settings, roles: ['STUDENT', 'TEACHING_ASSISTANT', 'LECTURER', 'PROGRAM_COORDINATOR', 'ACADEMIC_STAFF', 'SYSTEM_ADMIN', 'SUPER_ADMIN'] },
    { id: 'shared-bantuan', label: 'Bantuan', href: '/help', icon: LifeBuoy, roles: ['STUDENT', 'TEACHING_ASSISTANT', 'LECTURER', 'PROGRAM_COORDINATOR', 'ACADEMIC_STAFF', 'SYSTEM_ADMIN', 'SUPER_ADMIN'] },
    { id: 'shared-privasi', label: 'Privasi', href: '/transparency', icon: Eye, roles: ['STUDENT', 'TEACHING_ASSISTANT', 'LECTURER', 'PROGRAM_COORDINATOR', 'ACADEMIC_STAFF', 'SYSTEM_ADMIN', 'SUPER_ADMIN'] },
  ],
};

// 6.7a Sekretaris Prodi (PROGRAM_SECRETARY) - Kerangka Fase 1
const PROGRAM_SECRETARY_GROUPS: MenuGroup[] = [
  {
    id: 'sek-utama',
    title: '',
    roles: ['PROGRAM_SECRETARY'],
    items: [
      { id: 'sek-beranda', label: 'Beranda', href: '/secretary', icon: GraduationCap, roles: ['PROGRAM_SECRETARY'] },
      { id: 'sek-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['PROGRAM_SECRETARY'] },
      { id: 'sek-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['PROGRAM_SECRETARY'] },
      { id: 'sek-pengumuman', label: 'Pengumuman', href: '/announcements', icon: Megaphone, roles: ['PROGRAM_SECRETARY'] },
    ],
  },
  SHARED_SUPPORT_GROUP,
];

// 6.7b Kepala Laboratorium (LAB_HEAD) - Kerangka Fase 1
const LAB_HEAD_GROUPS: MenuGroup[] = [
  {
    id: 'lab-utama',
    title: '',
    roles: ['LAB_HEAD'],
    items: [
      { id: 'lab-beranda', label: 'Beranda', href: '/lab', icon: GraduationCap, roles: ['LAB_HEAD'] },
      { id: 'lab-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['LAB_HEAD'] },
      { id: 'lab-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['LAB_HEAD'] },
      { id: 'lab-pengumuman', label: 'Pengumuman', href: '/announcements', icon: Megaphone, roles: ['LAB_HEAD'] },
    ],
  },
  SHARED_SUPPORT_GROUP,
];

// 6.7c Dekan (DEAN) - Kerangka Fase 1
const DEAN_GROUPS: MenuGroup[] = [
  {
    id: 'dkn-utama',
    title: '',
    roles: ['DEAN'],
    items: [
      { id: 'dkn-beranda', label: 'Beranda', href: '/dean', icon: GraduationCap, roles: ['DEAN'] },
      { id: 'dkn-kalender', label: 'Kalender', href: '/calendar', icon: CalendarDays, roles: ['DEAN'] },
      { id: 'dkn-notifikasi', label: 'Notifikasi', href: '/notifications', icon: Bell, roles: ['DEAN'] },
      { id: 'dkn-pengumuman', label: 'Pengumuman', href: '/announcements', icon: Megaphone, roles: ['DEAN'] },
    ],
  },
  SHARED_SUPPORT_GROUP,
];

export const MENU_CONFIG: Record<string, MenuGroup[]> = {
  PROGRAM_SECRETARY: PROGRAM_SECRETARY_GROUPS,
  LAB_HEAD: LAB_HEAD_GROUPS,
  DEAN: DEAN_GROUPS,
  STUDENT: STUDENT_GROUPS,
  TEACHING_ASSISTANT: TEACHING_ASSISTANT_GROUPS,
  LECTURER: LECTURER_GROUPS,
  PROGRAM_COORDINATOR: PROGRAM_COORDINATOR_GROUPS,
  ACADEMIC_STAFF: ACADEMIC_STAFF_GROUPS,
  SYSTEM_ADMIN: SYSTEM_ADMIN_GROUPS,
  SUPER_ADMIN: SUPER_ADMIN_GROUPS,
};



/**
 * Normalisasi kode role dari berbagai format input
 */
export function normalizeRoleCode(role?: string | null): string {
  const r = (role || '').toUpperCase();
  if (r === 'SUPERADMIN' || r === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (r === 'ADMIN' || r === 'SYSTEM_ADMIN' || r === 'SYSADMIN') return 'SYSTEM_ADMIN';
  if (r === 'DOSEN' || r === 'LECTURER' || r === 'TEACHER') return 'LECTURER';
  if (r === 'KAPRODI' || r === 'PROGRAM_COORDINATOR' || r === 'COORDINATOR' || r === 'PRODI') return 'PROGRAM_COORDINATOR';
  if (r === 'SEKPRODI' || r === 'PROGRAM_SECRETARY' || r === 'SECRETARY') return 'PROGRAM_SECRETARY';
  if (r === 'KALAB' || r === 'LAB_HEAD' || r === 'LAB_CHIEF') return 'LAB_HEAD';
  if (r === 'DEKAN' || r === 'DEAN') return 'DEAN';
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
  _hasActiveExam: boolean = true
): MenuGroup[] {
  const norm = normalizeRoleCode(role);
  const groups = MENU_CONFIG[norm] || MENU_CONFIG.STUDENT;

  const badges: DynamicMenuBadges =
    typeof badgesOrUnread === 'number'
      ? { unreadCount: badgesOrUnread }
      : badgesOrUnread || {};

  // Clone dan sisipkan badge counter nyata (> 0)
  const mappedGroups = groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      // 1. Notifikasi badge
      if (item.href === '/notifications' && badges.unreadCount && badges.unreadCount > 0) {
        return { ...item, badge: badges.unreadCount };
      }
      // 2. Pesan badge
      if (item.href === '/messages' && badges.unreadMessages && badges.unreadMessages > 0) {
        return { ...item, badge: badges.unreadMessages };
      }
      // 3. Asisten: Koreksi tugas
      if (item.href === '/ta/grading' && badges.taGradingCount && badges.taGradingCount > 0) {
        return { ...item, badge: badges.taGradingCount };
      }
      // 4. Dosen: Periksa Jawaban
      if (item.href === '/exams/review' && badges.lecturerReviewCount && badges.lecturerReviewCount > 0) {
        return { ...item, badge: badges.lecturerReviewCount };
      }
      // 5. Dosen: Sanggahan
      if (item.href === '/lecturer/disputes' && badges.disputeCount && badges.disputeCount > 0) {
        return { ...item, badge: badges.disputeCount };
      }
      // 6. Mahasiswa: Evaluasi Dosen
      if (item.href === '/evaluations' && badges.pendingEvaluations && badges.pendingEvaluations > 0) {
        return { ...item, badge: badges.pendingEvaluations };
      }
      // 7. Prodi: Persetujuan Nilai
      if (item.href === '/coordinator/approvals' && badges.coordinatorApprovalsCount && badges.coordinatorApprovalsCount > 0) {
        return { ...item, badge: badges.coordinatorApprovalsCount };
      }
      // 8. Staf: Pengajuan Masuk
      if (item.href === '/staff/services/verification' && badges.requestCount && badges.requestCount > 0) {
        return { ...item, badge: badges.requestCount };
      }
      // 9. Mahasiswa / Asisten: Flashcard
      if (item.href === '/flashcards' && badges.flashcardsDue && badges.flashcardsDue > 0) {
        return { ...item, badge: badges.flashcardsDue };
      }
      // 10. Mahasiswa / Asisten: Tukar Keahlian
      if (item.href === '/skill-exchange' && badges.openHelpRequests && badges.openHelpRequests > 0) {
        return { ...item, badge: badges.openHelpRequests };
      }
      // 11. Dosen: Tinjau Konten
      if (item.href === '/lecturer/content-review' && badges.contentPendingReview && badges.contentPendingReview > 0) {
        return { ...item, badge: badges.contentPendingReview };
      }
      return item;
    }),
  }));

  return [...mappedGroups, SHARED_SUPPORT_GROUP];
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
 * Label nama tampilan untuk role
 */
export function getRoleDisplayName(role?: string | null): string {
  const norm = normalizeRoleCode(role);
  switch (norm) {
    case 'SUPER_ADMIN':
      return 'Super Administrator';
    case 'SYSTEM_ADMIN':
      return 'System Administrator';
    case 'LECTURER':
      return 'Dosen Pengampu';
    case 'PROGRAM_COORDINATOR':
      return 'Koordinator Program Studi';
    case 'ACADEMIC_STAFF':
      return 'Staf Akademik';
    case 'TEACHING_ASSISTANT':
      return 'Asisten Dosen';
    case 'STUDENT':
    default:
      return 'Mahasiswa';
  }
}

/**
 * Daftar pengalihan rute lama
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
  '/mahasiswa/surat': '/requests',
  '/mahasiswa/dashboard': '/student',
  '/mahasiswa/pengumuman': '/announcements',
  '/mahasiswa/preferensi-notifikasi': '/settings',
  '/mahasiswa/presensi': '/attendance',

  // Dosen Legacy
  '/dosen/dashboard': '/lecturer',
  '/dosen/kelas': '/classes',
  '/dosen/presensi': '/attendance',
  '/dosen/nilai': '/analytics',
  '/dosen/materi-tugas': '/classes',
  '/dosen/perwalian': '/lecturer/mentoring',
  '/dosen/laporan': '/analytics',

  // Admin Legacy
  '/admin/dashboard': '/admin',
  '/admin/master': '/admin/users',
  '/admin/pengumuman': '/admin/announcements',
  '/admin/kebijakan': '/admin/policies',
  '/admin/audit': '/admin/system/audit',
  '/admin/system/status': '/admin/system/monitoring',
  '/admin/ukt': '/admin',
  '/admin/surat': '/staff/services/verification',
  '/admin/kalender': '/calendar',
  '/admin/kurikulum': '/coordinator/curriculum',
  '/admin/jadwal': '/staff/schedules',
  '/admin/ujian': '/exams',
  '/admin/nilai': '/staff/grades',
  '/admin/notifications': '/notifications',
};

/**
 * Pemeriksaan apakah rute boleh diakses oleh peran aktif (RBAC di server)
 */
export function isRouteAllowedForRole(pathname: string, role?: string | null, isImpersonating?: boolean): boolean {
  const norm = normalizeRoleCode(role);

  // SYSTEM_ADMIN dilarang mengakses rute akademik dan portal non-admin
  if (norm === 'SYSTEM_ADMIN') {
    const isAcademic =
      pathname.startsWith('/attendance') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/grades') ||
      pathname.startsWith('/exams') ||
      pathname.startsWith('/classes') ||
      pathname.startsWith('/secretary') ||
      pathname.startsWith('/lab') ||
      pathname.startsWith('/dean') ||
      pathname.startsWith('/secretary') ||
      pathname.startsWith('/lab') ||
      pathname.startsWith('/dean') ||
      pathname.startsWith('/coordinator') ||
      pathname.startsWith('/student') ||
      pathname.startsWith('/lecturer') ||
      pathname.startsWith('/ta') ||
      pathname.startsWith('/staff') ||
      pathname.startsWith('/messages') ||
      pathname.startsWith('/achievements') ||
      pathname.startsWith('/evaluations') ||
      pathname.startsWith('/requests') ||
      pathname.startsWith('/flashcards') ||
      pathname.startsWith('/skill-exchange');
    if (isAcademic) return false;
    return true;
  }

  // SUPER_ADMIN dilarang merender rute akademik/role portals kecuali saat impersonate aktif
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
      pathname.startsWith('/staff') ||
      pathname.startsWith('/messages') ||
      pathname.startsWith('/achievements') ||
      pathname.startsWith('/evaluations') ||
      pathname.startsWith('/requests') ||
      pathname.startsWith('/flashcards') ||
      pathname.startsWith('/skill-exchange');
    if (isAcademicOrRolePortal) return false;
    return true;
  }

  if (norm === 'SUPER_ADMIN') return true;

  // Proteksi admin
  if (pathname.startsWith('/admin')) {
    return norm === 'SYSTEM_ADMIN' || norm === 'SUPER_ADMIN';
  }

  // Proteksi sekretaris prodi
  if (pathname.startsWith('/secretary')) {
    return norm === 'PROGRAM_SECRETARY';
  }

  // Proteksi kepala lab
  if (pathname.startsWith('/lab')) {
    return norm === 'LAB_HEAD';
  }

  // Proteksi dekan
  if (pathname.startsWith('/dean')) {
    return norm === 'DEAN';
  }

  // Proteksi kaprodi
  if (pathname.startsWith('/coordinator')) {
    return norm === 'PROGRAM_COORDINATOR';
  }

  // Proteksi staf akademik
  if (pathname.startsWith('/staff')) {
    return norm === 'ACADEMIC_STAFF';
  }

  // Proteksi tinjau konten (Dosen, Asisten berizin, Kaprodi)
  if (pathname.startsWith('/lecturer/content-review')) {
    return norm === 'LECTURER' || norm === 'TEACHING_ASSISTANT' || norm === 'PROGRAM_COORDINATOR' || norm === 'SUPER_ADMIN';
  }

  // Proteksi dosen
  if (pathname.startsWith('/lecturer')) {
    return norm === 'LECTURER' || norm === 'PROGRAM_COORDINATOR';
  }

  // Proteksi asisten
  if (pathname.startsWith('/ta')) {
    return norm === 'TEACHING_ASSISTANT';
  }

  // Proteksi flashcard dan tukar keahlian
  if (pathname.startsWith('/flashcards') || pathname.startsWith('/skill-exchange')) {
    return norm === 'STUDENT' || norm === 'TEACHING_ASSISTANT' || norm === 'LECTURER' || norm === 'PROGRAM_COORDINATOR' || norm === 'SUPER_ADMIN';
  }

  return true;
}

/**
 * Menentukan apakah item navigasi aktif untuk pathname saat ini.
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
  const nonPrefixPaths = ['/', '/admin', '/student', '/lecturer', '/coordinator', '/staff', '/ta', '/secretary', '/lab', '/dean'];
  if (nonPrefixPaths.includes(itemPath)) {
    return false;
  }

  // 2. Cek apakah currentPath adalah sub-path dari itemPath
  const isSubpath = currentPath.startsWith(`${itemPath}/`);
  if (!isSubpath) {
    return false;
  }

  // 3. Jika currentPath adalah subpath, pastikan tidak ada menu item lain yang lebih spesifik
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
