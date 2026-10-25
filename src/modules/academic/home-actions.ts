'use server';

import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { deterministicUuid } from '@/lib/akademik/deterministic-uuid';
import { listMyClassesAction } from './actions';
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

const CLASS_ID_WEB = 'c0000000-0000-0000-0000-000000000001';
const CLASS_ID_ALGO = 'c0000000-0000-0000-0000-000000000002';
const CLASS_ID_DB = 'c0000000-0000-0000-0000-000000000003';
const CLASS_ID_OS = deterministicUuid('kls-sti2543130-3a');
const CLASS_ID_AI = deterministicUuid('kls-sti2543129-3a');

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
        title: 'Selamat Datang di RuangKampus',
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

  // 1. Cek Ujian Aktif (Terhubung ke Kelas Pemrograman Web STI2544138)
  const openExams: Array<{ id: string; title: string; classTitle: string; dueAt?: string; hasAttempt?: boolean; href?: string }> = [
    {
      id: 'quiz-mid-2026',
      title: 'Kuis Evaluasi Tengah Semester Web Modern',
      classTitle: 'Pemrograman Web & Arsitektur Cloud (STI2544138)',
      dueAt: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      hasAttempt: false,
      href: '/exams',
    },
  ];

  // 2. Cek Sesi Presensi Aktif (Terhubung langsung ke Tab Presensi Kelas STI2544138)
  const openAttendance = {
    id: 'att-session-1',
    classTitle: 'Pemrograman Web & Arsitektur Cloud (STI2544138)',
    method: 'QR Dinamis & Lokasi GPS',
    closeTime: '11:15 WIB (25 menit lagi)',
    href: `/classes/${CLASS_ID_WEB}?tab=presensi`,
  };

  // 3. Cek Tugas < 24 jam (Terhubung langsung ke Tab Tugas masing-masing Kelas)
  const urgentAssignments = [
    {
      id: 'asg-01',
      title: 'Tugas 04: Implementasi RBAC Supabase',
      classTitle: 'Pemrograman Web & Arsitektur Cloud (STI2544138)',
      dueAt: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      href: `/classes/${CLASS_ID_WEB}?tab=tugas`,
    },
    {
      id: 'asg-02',
      title: 'Analisis Kompleksitas Tree & Graph Balancing',
      classTitle: 'Algoritma & Struktur Data Lanjut (STI2543131)',
      dueAt: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
      href: `/classes/${CLASS_ID_ALGO}?tab=tugas`,
    },
  ];

  // 4. Kelas akan mulai < 60 menit
  const upcomingClass = {
    id: CLASS_ID_WEB,
    title: 'Pemrograman Web & Arsitektur Cloud (STI2544138)',
    time: '08:45 - 11:15 WIB',
    room: '3C.2.05 - TEKNIK C',
    href: `/classes/${CLASS_ID_WEB}`,
  };

  const lastStudied = {
    title: 'Modul 07: Arsitektur App Router & Server Actions',
    classTitle: 'Pemrograman Web & Arsitektur Cloud',
    href: `/classes/${CLASS_ID_WEB}?tab=materi`,
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

  const rawItems: HomeDeadlineItem[] = [
    {
      id: 'd-1',
      type: 'QUIZ',
      title: 'Kuis Evaluasi Tengah Semester Web Modern',
      classTitle: 'Pemrograman Web & Arsitektur Cloud (STI2544138)',
      classId: CLASS_ID_WEB,
      dueAt: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      dueCountdown: '3 jam lagi',
      isUrgent: true,
      actionHref: '/exams',
    },
    {
      id: 'd-2',
      type: 'ASSIGNMENT',
      title: 'Tugas 04: Implementasi RBAC Supabase',
      classTitle: 'Pemrograman Web & Arsitektur Cloud (STI2544138)',
      classId: CLASS_ID_WEB,
      dueAt: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      dueCountdown: '5 jam lagi',
      isUrgent: true,
      actionHref: `/classes/${CLASS_ID_WEB}?tab=tugas`,
    },
    {
      id: 'd-3',
      type: 'ASSIGNMENT',
      title: 'Analisis Kompleksitas Tree & Graph Balancing',
      classTitle: 'Algoritma & Struktur Data Lanjut (STI2543131)',
      classId: CLASS_ID_ALGO,
      dueAt: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
      dueCountdown: '18 jam lagi',
      isUrgent: true,
      actionHref: `/classes/${CLASS_ID_ALGO}?tab=tugas`,
    },
    {
      id: 'd-4',
      type: 'ASSIGNMENT',
      title: 'Praktikum: Partisi & Sharding Basis Data Terdistribusi',
      classTitle: 'Basis Data Terdistribusi & Big Data (STI2541114)',
      classId: CLASS_ID_DB,
      dueAt: new Date(now.getTime() + 42 * 60 * 60 * 1000).toISOString(),
      dueCountdown: 'Besok, 23:59 WIB',
      isUrgent: false,
      actionHref: `/classes/${CLASS_ID_DB}?tab=tugas`,
    },
    {
      id: 'd-5',
      type: 'QUIZ',
      title: 'Kuis Evaluasi Manajemen Memori & Penjadwalan Proses',
      classTitle: 'Sistem Operasi (STI2543130)',
      classId: CLASS_ID_OS,
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
      classId: CLASS_ID_WEB,
      code: 'STI2544138',
      title: 'Pemrograman Web & Arsitektur Cloud',
      time: '08:45 - 11:15 WIB',
      room: '3C.2.05 - TEKNIK C',
      status: 'BERLANGSUNG',
      hasActiveAttendance: true,
      attendanceMethod: 'QR Dinamis & Lokasi GPS',
      lecturer: 'Dr. Budi Santoso, M.Kom.',
    },
    {
      id: 'sch-2',
      classId: CLASS_ID_ALGO,
      code: 'STI2543131',
      title: 'Algoritma & Struktur Data Lanjut',
      time: '10:30 - 13:00 WIB',
      room: 'Computer System LAB - TEKNIK C',
      status: 'AKAN_DATANG',
      hasActiveAttendance: false,
      lecturer: 'Dr. Budi Santoso, M.Kom.',
    },
    {
      id: 'sch-3',
      classId: CLASS_ID_DB,
      code: 'STI2541114',
      title: 'Basis Data Terdistribusi & Big Data',
      time: '13:00 - 15:30 WIB',
      room: 'Mobile Lab - TEKNIK D',
      status: 'AKAN_DATANG',
      hasActiveAttendance: false,
      lecturer: 'Dr. Budi Santoso, M.Kom.',
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

  const baseCurriculumClasses: ActiveClassItem[] = [
    {
      id: CLASS_ID_WEB,
      code: 'STI2544138',
      title: 'Pemrograman Web & Arsitektur Cloud',
      lecturer: 'Dr. Budi Santoso, M.Kom.',
      sks: 3,
      progressPercent: 78,
      colorScheme: 'emerald',
      category: 'Kelas Saya',
      schedule: 'Senin, 08:45 - 11:15 WIB',
      room: '3C.2.05 - TEKNIK C',
      attendance: '92% (Lolos Syarat UAS)',
      ratingCount: '1.8K',
      description:
        'Mata kuliah Pemrograman Web & Arsitektur Cloud berfokus pada arsitektur web modern, Next.js App Router, integrasi server actions, pengelolaan otentikasi peran (RBAC), serta optimasi performa dan keamanan basis data skala enterprise.',
      pendingTasksCount: 2,
      hasOpenExam: true,
    },
    {
      id: CLASS_ID_ALGO,
      code: 'STI2543131',
      title: 'Algoritma & Struktur Data Lanjut',
      lecturer: 'Dr. Budi Santoso, M.Kom.',
      sks: 3,
      progressPercent: 62,
      colorScheme: 'terracotta',
      category: 'Kelas Saya',
      schedule: 'Selasa, 10:30 - 13:00 WIB',
      room: 'Computer System LAB - TEKNIK C',
      attendance: '88% (Lolos Syarat UAS)',
      ratingCount: '1.2K',
      description:
        'Mempelajari struktur data pohon berimbang (AVL, Red-Black Tree), algoritma graf terpendek, pemrograman dinamis, analisis kompleksitas asimtotik, serta optimasi struktur memori untuk pemrosesan data berskala besar.',
      pendingTasksCount: 1,
      hasOpenExam: false,
    },
    {
      id: CLASS_ID_DB,
      code: 'STI2541114',
      title: 'Basis Data Terdistribusi & Big Data',
      lecturer: 'Dr. Budi Santoso, M.Kom.',
      sks: 3,
      progressPercent: 50,
      colorScheme: 'navy',
      category: 'Presensi',
      schedule: 'Rabu, 13:00 - 15:30 WIB',
      room: 'Mobile Lab - TEKNIK D',
      attendance: '85% (Lolos Syarat UAS)',
      ratingCount: '950',
      description:
        'Membahas pemodelan data relasional dan non-relasional terdistribusi, replikasi data multi-region, partisi tabel, ACID vs BASE theorem, serta strategi indeks performa tinggi pada volume data besar.',
      pendingTasksCount: 1,
      hasOpenExam: false,
    },
    {
      id: CLASS_ID_OS,
      code: 'STI2543130',
      title: 'Sistem Operasi',
      lecturer: 'Dr. Eng. Ir. Hendra Gunawan, S.Kom., M.T.',
      sks: 3,
      progressPercent: 70,
      colorScheme: 'dark',
      category: 'Ujian',
      schedule: 'Kamis, 08:00 - 10:30 WIB',
      room: '3C.2.08 - TEKNIK C',
      attendance: '90% (Lolos Syarat UAS)',
      ratingCount: '1.5K',
      description:
        'Prinsip arsitektur kernel sistem operasi, manajemen proses dan thread konkurensi, sinkronisasi semafor & deadlock, manajemen memori virtual paging, serta keamanan sistem berkas.',
      pendingTasksCount: 0,
      hasOpenExam: false,
    },
    {
      id: CLASS_ID_AI,
      code: 'STI2543129',
      title: 'Pengenalan Kecerdasan Buatan',
      lecturer: 'Siti Nurhaliza, M.Cs.',
      sks: 3,
      progressPercent: 45,
      colorScheme: 'yellow',
      category: 'Tugas & Kuis',
      schedule: 'Jumat, 13:30 - 16:00 WIB',
      room: 'AI & Robotics Lab - TEKNIK C',
      attendance: '95% (Lolos Syarat UAS)',
      ratingCount: '2.1K',
      description:
        'Mengeksplorasi konsep kecerdasan komputasional, algoritma pencarian heuristik, jaringan saraf tiruan (neural networks), evaluasi model klasifikasi, dan implementasi sistem cerdas berbasis pengetahuan.',
      pendingTasksCount: 1,
      hasOpenExam: false,
    },
  ];

  // Sinkronkan juga dengan kelas baru yang dibuat/diikuti user di listMyClassesAction
  try {
    const myClasses = await listMyClassesAction();
    if (myClasses && myClasses.length > 0) {
      const baseIds = new Set(baseCurriculumClasses.map((b) => b.id));
      const customAdded = myClasses
        .filter((mc) => !baseIds.has(mc.id))
        .slice(0, 3)
        .map((mc, idx): ActiveClassItem => ({
          id: mc.id,
          code: mc.course_code || `MK-${mc.section}`,
          title: mc.title,
          lecturer: mc.lecturer_name || 'Dosen Pengampu',
          sks: mc.sks || 3,
          progressPercent: 55 + (idx * 10) % 35,
          colorScheme: (['emerald', 'terracotta', 'navy', 'yellow', 'dark'] as const)[idx % 5],
          category: 'Kelas Saya',
          schedule: mc.schedule || 'Senin, 08:45 - 11:15 WIB',
          room: mc.room || '3C.2.05 - TEKNIK C',
          attendance: '90% (Lolos Syarat UAS)',
          ratingCount: '1.1K',
          description: `Kelas perkuliahan aktif ${mc.title} (${mc.section}) terintegrasi dengan silabus kurikulum Program Studi Teknik Informatika UIR.`,
          pendingTasksCount: 1,
          hasOpenExam: false,
        }));
      return [...baseCurriculumClasses, ...customAdded.slice(0, 1)];
    }
  } catch {
    // Fallback ke baseCurriculumClasses
  }

  return baseCurriculumClasses;
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
      time: '08:45 - 11:15 WIB',
      title: 'Kuliah: Pemrograman Web & Arsitektur Cloud (STI2544138)',
      type: 'KELAS',
      classTitle: 'Pemrograman Web & Arsitektur Cloud',
      href: `/classes/${CLASS_ID_WEB}`,
    },
    {
      id: 'ag-2',
      dateStr: formatJakartaDate(now, 'short'),
      dayName: 'Hari Ini',
      time: '11:30 WIB',
      title: 'Batas Kuis Tengah Semester Web (STI2544138)',
      type: 'UJIAN',
      classTitle: 'Pemrograman Web & Arsitektur Cloud',
      href: '/exams',
    },
    {
      id: 'ag-3',
      dateStr: formatJakartaDate(new Date(now.getTime() + 24 * 3600 * 1000), 'short'),
      dayName: 'Besok',
      time: '10:30 - 13:00 WIB',
      title: 'Kuliah: Algoritma & Struktur Data Lanjut (STI2543131)',
      type: 'KELAS',
      classTitle: 'Algoritma & Struktur Data Lanjut',
      href: `/classes/${CLASS_ID_ALGO}`,
    },
    {
      id: 'ag-4',
      dateStr: formatJakartaDate(new Date(now.getTime() + 24 * 3600 * 1000), 'short'),
      dayName: 'Besok',
      time: '23:59 WIB',
      title: 'Tenggat Tugas 04: RBAC Supabase (STI2544138)',
      type: 'TUGAS',
      classTitle: 'Pemrograman Web & Arsitektur Cloud',
      href: `/classes/${CLASS_ID_WEB}?tab=tugas`,
    },
    {
      id: 'ag-5',
      dateStr: formatJakartaDate(new Date(now.getTime() + 2 * 24 * 3600 * 1000), 'short'),
      dayName: 'Lusa',
      time: '13:00 - 15:30 WIB',
      title: 'Kuliah: Basis Data Terdistribusi & Big Data (STI2541114)',
      type: 'KELAS',
      classTitle: 'Basis Data Terdistribusi & Big Data',
      href: `/classes/${CLASS_ID_DB}`,
    },
  ];
}
