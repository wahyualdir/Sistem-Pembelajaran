'use server';

import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  evaluateBannerConditions,
  formatJakartaDate,
  type BannerPriority,
  type BannerConditionItem,
  type HomeBannerData,
  type HomeDeadlineItem,
  type TodayScheduleItem,
  type ActiveClassItem,
  type HomeSummaryData,
  type AgendaItem,
} from './home-utils';

export type {
  BannerPriority,
  BannerConditionItem,
  HomeBannerData,
  HomeDeadlineItem,
  TodayScheduleItem,
  ActiveClassItem,
  HomeSummaryData,
  AgendaItem,
};

// ---------------------------------------------------------------------------
// 1. SERVER ACTION: getHomeBannerAction
// ---------------------------------------------------------------------------
export async function getHomeBannerAction(): Promise<HomeBannerData> {
  const userContext = await getCurrentUserWithRoles();
  const now = new Date();

  // Akun Baru: Tampilkan banner ucapan selamat datang bersih tanpa data dummy
  if (userContext?.isNewAccount) {
    return {
      primary: {
        id: 'banner-welcome',
        priority: 5,
        category: 'IDLE',
        title: 'Selamat Datang di SIAJAR',
        subtitle: `Halo, ${userContext.profile?.full_name || 'Mahasiswa'}! Akun baru Anda siap digunakan. Buka menu Kelas Saya untuk mulai mendaftar ke kelas perkuliahan dosen Anda.`,
        buttonLabel: 'Buka Kelas Saya',
        buttonHref: '/classes',
        badge: 'AKUN BARU',
      },
      others: [],
      totalActive: 0,
      serverTime: now.toISOString(),
    };
  }

  // 1. Cek Ujian Aktif
  const openExams: Array<{ id: string; title: string; classTitle: string; dueAt?: string; hasAttempt?: boolean }> = [
    {
      id: 'quiz-mid-2026',
      title: 'Kuis Evaluasi Tengah Semester Web Modern',
      classTitle: 'Pemrograman Web Lanjut (TI-301)',
      dueAt: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      hasAttempt: false,
    },
  ];

  // 2. Cek Sesi Presensi Aktif
  const openAttendance = {
    id: 'att-session-1',
    classTitle: 'Pemrograman Web Lanjut',
    method: 'QR Dinamis & Lokasi GPS',
    closeTime: '10:30 WIB (25 menit lagi)',
  };

  // 3. Cek Tugas < 24 jam
  const urgentAssignments = [
    {
      id: 'asg-01',
      title: 'Tugas 04: Implementasi RBAC Supabase',
      classTitle: 'Pemrograman Web Lanjut',
      dueAt: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'asg-02',
      title: 'Laporan Desain UML Sistem Akademik',
      classTitle: 'Rekayasa Perangkat Lunak',
      dueAt: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // 4. Kelas akan mulai < 60 menit
  const upcomingClass = {
    id: 'course-1',
    title: 'Pemrograman Web Lanjut',
    time: '08:00 - 10:30 WIB',
    room: 'Lab Komputer 2 (Hybrid)',
  };

  const lastStudied = {
    title: 'Modul 07: Arsitektur App Router & Server Actions',
    classTitle: 'Pemrograman Web Lanjut',
    href: '/classes',
  };

  return evaluateBannerConditions({
    openExams,
    openAttendance,
    urgentAssignments,
    upcomingClass,
    lastStudiedMaterial: lastStudied,
    now,
  });
}

// ---------------------------------------------------------------------------
// 2. SERVER ACTION: getHomeDeadlinesAction
// ---------------------------------------------------------------------------
export async function getHomeDeadlinesAction(): Promise<HomeDeadlineItem[]> {
  const userContext = await getCurrentUserWithRoles();
  if (userContext?.isNewAccount) {
    return [];
  }

  const now = new Date();

  const rawItems = [
    {
      id: 'd-1',
      type: 'QUIZ' as const,
      title: 'Kuis Evaluasi Tengah Semester Web Modern',
      classTitle: 'Pemrograman Web Lanjut',
      classId: 'course-1',
      dueAt: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      dueCountdown: '3 jam lagi',
      isUrgent: true,
      actionHref: '/exams',
    },
    {
      id: 'd-2',
      type: 'ASSIGNMENT' as const,
      title: 'Tugas 04: Implementasi RBAC Supabase',
      classTitle: 'Pemrograman Web Lanjut',
      classId: 'course-1',
      dueAt: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      dueCountdown: '5 jam lagi',
      isUrgent: true,
      actionHref: '/classes',
    },
    {
      id: 'd-3',
      type: 'ASSIGNMENT' as const,
      title: 'Laporan Desain UML Sistem Akademik',
      classTitle: 'Rekayasa Perangkat Lunak',
      classId: 'course-2',
      dueAt: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
      dueCountdown: '18 jam lagi',
      isUrgent: true,
      actionHref: '/classes',
    },
    {
      id: 'd-4',
      type: 'ASSIGNMENT' as const,
      title: 'Praktikum: Pipeline Model NLP Transformer',
      classTitle: 'Kecerdasan Buatan & ML',
      classId: 'course-3',
      dueAt: new Date(now.getTime() + 42 * 60 * 60 * 1000).toISOString(),
      dueCountdown: 'Besok, 23:59 WIB',
      isUrgent: false,
      actionHref: '/classes',
    },
    {
      id: 'd-5',
      type: 'QUIZ' as const,
      title: 'Kuis Evaluasi Replikasi Basis Data Multi-Region',
      classTitle: 'Basis Data Terdistribusi',
      classId: 'course-4',
      dueAt: new Date(now.getTime() + 70 * 60 * 60 * 1000).toISOString(),
      dueCountdown: '2 hari lagi',
      isUrgent: false,
      actionHref: '/exams',
    },
  ];

  return rawItems.slice(0, 5);
}

// ---------------------------------------------------------------------------
// 3. SERVER ACTION: getHomeTodayScheduleAction
// ---------------------------------------------------------------------------
export async function getHomeTodayScheduleAction(): Promise<TodayScheduleItem[]> {
  const userContext = await getCurrentUserWithRoles();
  if (userContext?.isNewAccount) {
    return [];
  }

  return [
    {
      id: 'sch-1',
      classId: 'course-1',
      code: 'TI-301',
      title: 'Pemrograman Web Lanjut',
      time: '08:00 - 10:30 WIB',
      room: 'Lab Komputer 2 (Hybrid)',
      status: 'BERLANGSUNG',
      hasActiveAttendance: true,
      attendanceMethod: 'QR Dinamis & Lokasi GPS',
      lecturer: 'Dr. Ardiansyah, S.T., M.Kom.',
    },
    {
      id: 'sch-2',
      classId: 'course-2',
      code: 'TI-302',
      title: 'Rekayasa Perangkat Lunak',
      time: '10:45 - 13:15 WIB',
      room: 'Ruang Teori 304',
      status: 'AKAN_DATANG',
      hasActiveAttendance: false,
      lecturer: 'Nurul Hidayati, M.Kom.',
    },
    {
      id: 'sch-3',
      classId: 'course-3',
      code: 'TI-401',
      title: 'Kecerdasan Buatan & Machine Learning',
      time: '13:30 - 16:00 WIB',
      room: 'Lab Riset AI Gedung C',
      status: 'AKAN_DATANG',
      hasActiveAttendance: false,
      lecturer: 'Hendra Gunawan, Ph.D.',
    },
  ];
}

// ---------------------------------------------------------------------------
// 4. SERVER ACTION: getHomeActiveClassesAction
// ---------------------------------------------------------------------------
export async function getHomeActiveClassesAction(): Promise<ActiveClassItem[]> {
  const userContext = await getCurrentUserWithRoles();
  if (userContext?.isNewAccount) {
    return [];
  }

  return [
    {
      id: 'course-1',
      code: 'TI-301',
      title: 'Pemrograman Web Lanjut',
      lecturer: 'Dr. Ardiansyah, S.T., M.Kom.',
      sks: 3,
      progressPercent: 78,
      colorScheme: 'emerald',
      category: 'Kelas Saya',
      schedule: 'Senin, 08:00 - 10:30 WIB',
      room: 'Lab Komputer 2 (Hybrid)',
      attendance: '92% (Lolos Syarat UAS)',
      ratingCount: '1.8K',
      description:
        'Mata kuliah Pemrograman Web Lanjut berfokus pada arsitektur web modern, Next.js App Router, integrasi server actions, pengelolaan otentikasi peran (RBAC), serta optimasi performa dan keamanan basis data skala enterprise.',
      pendingTasksCount: 2,
      hasOpenExam: true,
    },
    {
      id: 'course-2',
      code: 'TI-302',
      title: 'Rekayasa Perangkat Lunak',
      lecturer: 'Nurul Hidayati, M.Kom.',
      sks: 3,
      progressPercent: 62,
      colorScheme: 'terracotta',
      category: 'Kelas Saya',
      schedule: 'Selasa, 10:45 - 13:15 WIB',
      room: 'Ruang Teori 304',
      attendance: '88% (Lolos Syarat UAS)',
      ratingCount: '1.2K',
      description:
        'Mempelajari siklus hidup pengembangan perangkat lunak (SDLC), metode Agile Scrum, perancangan diagram UML sistematis, pengujian unit test terotomatisasi, serta pemeliharaan kode berbasis clean architecture.',
      pendingTasksCount: 1,
      hasOpenExam: false,
    },
    {
      id: 'course-3',
      code: 'TI-401',
      title: 'Kecerdasan Buatan & Machine Learning',
      lecturer: 'Hendra Gunawan, Ph.D.',
      sks: 3,
      progressPercent: 45,
      colorScheme: 'yellow',
      category: 'Tugas & Kuis',
      schedule: 'Rabu, 13:30 - 16:00 WIB',
      room: 'Lab Riset AI Gedung C',
      attendance: '95% (Lolos Syarat UAS)',
      ratingCount: '2.1K',
      description:
        'Mengeksplorasi konsep kecerdasan komputasional, algoritma pencarian heuristik, jaringan saraf tiruan (neural networks), computer vision, dan implementasi model transformer untuk pemrosesan bahasa alami (NLP).',
      pendingTasksCount: 1,
      hasOpenExam: false,
    },
    {
      id: 'course-4',
      code: 'TI-305',
      title: 'Basis Data Terdistribusi',
      lecturer: 'Fajar Ramadhan, M.Kom.',
      sks: 3,
      progressPercent: 50,
      colorScheme: 'navy',
      category: 'Presensi',
      schedule: 'Kamis, 08:00 - 10:30 WIB',
      room: 'Lab Basis Data 1',
      attendance: '85% (Lolos Syarat UAS)',
      ratingCount: '950',
      description:
        'Membahas pemodelan data relasional dan non-relasional terdistribusi, replikasi data multi-region, partisi tabel, ACID vs BASE theorem, serta strategi indeks performa tinggi pada volume data besar.',
      pendingTasksCount: 1,
      hasOpenExam: false,
    },
    {
      id: 'course-5',
      code: 'TI-408',
      title: 'Keamanan Siber & Kriptografi',
      lecturer: 'Rina Fitriani, M.Kom.',
      sks: 2,
      progressPercent: 85,
      colorScheme: 'dark',
      category: 'Ujian',
      schedule: 'Jumat, 08:30 - 10:10 WIB',
      room: 'Ruang Cyber Defense',
      attendance: '90% (Lolos Syarat UAS)',
      ratingCount: '1.5K',
      description:
        'Prinsip keamanan sistem informasi, kriptografi simetris & asimetris, enkripsi data in-transit, analisis kerentanan OWASP Top 10, penetration testing etis, dan penerapan protokol autentikasi multi-faktor.',
      pendingTasksCount: 0,
      hasOpenExam: false,
    },
  ];
}

// ---------------------------------------------------------------------------
// 5. SERVER ACTION: getHomeSummaryAction
// ---------------------------------------------------------------------------
export async function getHomeSummaryAction(): Promise<HomeSummaryData> {
  const userContext = await getCurrentUserWithRoles();
  if (userContext?.isNewAccount) {
    return {
      semesterStatus: 'Mahasiswa Baru',
      semesterLabel: 'Semester Ganjil 2026/2027',
      averageAttendance: '0%',
      attendanceQualified: false,
      ipk: '0.00',
      studyStreakDays: 0,
    };
  }

  return {
    semesterStatus: 'Aktif Berjalan',
    semesterLabel: 'Semester Ganjil 2026/2027',
    averageAttendance: '91%',
    attendanceQualified: true,
    ipk: '3.82',
    studyStreakDays: 12,
  };
}

// ---------------------------------------------------------------------------
// 6. SERVER ACTION: getHomeAgendaAction
// ---------------------------------------------------------------------------
export async function getHomeAgendaAction(): Promise<AgendaItem[]> {
  const userContext = await getCurrentUserWithRoles();
  if (userContext?.isNewAccount) {
    return [];
  }

  const now = new Date();

  return [
    {
      id: 'ag-1',
      dateStr: formatJakartaDate(now, 'short'),
      dayName: 'Hari Ini',
      time: '08:00 - 10:30 WIB',
      title: 'Kuliah: Pemrograman Web Lanjut (Hybrid)',
      type: 'KELAS',
      classTitle: 'Pemrograman Web Lanjut',
      href: '/classes',
    },
    {
      id: 'ag-2',
      dateStr: formatJakartaDate(now, 'short'),
      dayName: 'Hari Ini',
      time: '11:00 WIB',
      title: 'Batas Kuis Tengah Semester Web',
      type: 'UJIAN',
      classTitle: 'Pemrograman Web Lanjut',
      href: '/exams',
    },
    {
      id: 'ag-3',
      dateStr: formatJakartaDate(new Date(now.getTime() + 24 * 3600 * 1000), 'short'),
      dayName: 'Besok',
      time: '10:45 - 13:15 WIB',
      title: 'Kuliah: Rekayasa Perangkat Lunak',
      type: 'KELAS',
      classTitle: 'Rekayasa Perangkat Lunak',
      href: '/classes',
    },
    {
      id: 'ag-4',
      dateStr: formatJakartaDate(new Date(now.getTime() + 24 * 3600 * 1000), 'short'),
      dayName: 'Besok',
      time: '23:59 WIB',
      title: 'Tenggat Tugas 04: RBAC Supabase',
      type: 'TUGAS',
      classTitle: 'Pemrograman Web Lanjut',
      href: '/classes',
    },
    {
      id: 'ag-5',
      dateStr: formatJakartaDate(new Date(now.getTime() + 2 * 24 * 3600 * 1000), 'short'),
      dayName: 'Lusa',
      time: '13:30 - 16:00 WIB',
      title: 'Kuliah: Kecerdasan Buatan & ML',
      type: 'KELAS',
      classTitle: 'Kecerdasan Buatan & ML',
      href: '/classes',
    },
  ];
}
