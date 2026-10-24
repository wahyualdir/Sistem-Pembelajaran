// Pure utilities & types for Beranda SIAJAR (Can be imported on client & server)

export type BannerPriority = 1 | 2 | 3 | 4 | 5;

export interface BannerConditionItem {
  id: string;
  priority: BannerPriority;
  category: 'EXAM' | 'ATTENDANCE' | 'ASSIGNMENT' | 'CLASS_UPCOMING' | 'IDLE';
  title: string;
  subtitle: string;
  timeRemaining?: string;
  buttonLabel: string;
  buttonHref: string;
  classId?: string;
  badge?: string;
}

export interface HomeBannerData {
  primary: BannerConditionItem;
  others: BannerConditionItem[];
  totalActive: number;
  serverTime: string;
}

export interface HomeDeadlineItem {
  id: string;
  type: 'ASSIGNMENT' | 'QUIZ';
  title: string;
  classTitle: string;
  classId: string;
  dueAt: string;
  dueCountdown: string;
  isUrgent: boolean; // < 24 hours
  actionHref: string;
}

export interface TodayScheduleItem {
  id: string;
  classId: string;
  title: string;
  code: string;
  time: string;
  room: string;
  status: 'SELESAI' | 'BERLANGSUNG' | 'AKAN_DATANG';
  hasActiveAttendance?: boolean;
  attendanceMethod?: string;
  lecturer: string;
}

export interface ActiveClassItem {
  id: string;
  code: string;
  title: string;
  lecturer: string;
  sks: number;
  progressPercent: number;
  colorScheme: 'emerald' | 'terracotta' | 'yellow' | 'navy' | 'dark';
  category: string;
  schedule: string;
  room: string;
  attendance: string;
  ratingCount: string;
  description: string;
  pendingTasksCount: number;
  hasOpenExam: boolean;
}

export interface HomeSummaryData {
  semesterStatus: string;
  semesterLabel: string;
  averageAttendance: string;
  attendanceQualified: boolean;
  ipk: string;
  studyStreakDays: number;
}

export interface AgendaItem {
  id: string;
  dateStr: string;
  dayName: string;
  time: string;
  title: string;
  type: 'KELAS' | 'TUGAS' | 'UJIAN' | 'EVENT';
  classTitle?: string;
  href: string;
}

const JAKARTA_TZ = 'Asia/Jakarta';

export function getJakartaDate(): Date {
  return new Date();
}

export function formatJakartaDate(date: Date | string, format: 'time' | 'short' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'time') {
    return d.toLocaleTimeString('id-ID', { timeZone: JAKARTA_TZ, hour: '2-digit', minute: '2-digit' }) + ' WIB';
  }
  if (format === 'short') {
    return d.toLocaleDateString('id-ID', { timeZone: JAKARTA_TZ, day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('id-ID', { timeZone: JAKARTA_TZ, day: 'numeric', month: 'long', year: 'numeric' });
}

export function calculateCountdown(targetDate: string | Date, now: Date = new Date()): {
  text: string;
  isUrgent: boolean;
  hoursDiff: number;
} {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { text: 'Sudah lewat', isUrgent: true, hoursDiff: 0 };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return { text: `${diffMins} menit lagi`, isUrgent: true, hoursDiff: diffHours };
  }
  if (diffHours < 24) {
    return { text: `${diffHours} jam lagi`, isUrgent: true, hoursDiff: diffHours };
  }
  if (diffDays === 1) {
    const timeStr = target.toLocaleTimeString('id-ID', { timeZone: JAKARTA_TZ, hour: '2-digit', minute: '2-digit' });
    return { text: `Besok, ${timeStr} WIB`, isUrgent: false, hoursDiff: diffHours };
  }
  return { text: `${diffDays} hari lagi`, isUrgent: false, hoursDiff: diffHours };
}

export function evaluateBannerConditions(params: {
  openExams: Array<{ id: string; title: string; classTitle: string; dueAt?: string; hasAttempt?: boolean; href?: string }>;
  openAttendance?: { id: string; classTitle: string; method: string; closeTime: string; href?: string } | null;
  urgentAssignments: Array<{ id: string; title: string; classTitle: string; dueAt: string; href?: string }>;
  upcomingClass?: { id: string; title: string; time: string; room: string; href?: string } | null;
  lastStudiedMaterial?: { title: string; classTitle: string; href: string } | null;
  now?: Date;
}): HomeBannerData {
  const now = params.now || new Date();
  const activeConditions: BannerConditionItem[] = [];

  // Prioritas 1: Ujian/kuis yang sedang dibuka dan belum selesai
  for (const exam of params.openExams) {
    const cd = exam.dueAt ? calculateCountdown(exam.dueAt, now).text : 'Hari ini';
    activeConditions.push({
      id: `banner-exam-${exam.id}`,
      priority: 1,
      category: 'EXAM',
      title: `Ujian Aktif: ${exam.title}`,
      subtitle: `${exam.classTitle} • Sisa waktu / batas: ${cd}`,
      timeRemaining: cd,
      buttonLabel: exam.hasAttempt ? 'Lanjutkan Ujian' : 'Mulai Ujian',
      buttonHref: exam.href || `/exams`,
      badge: 'PRIORITAS UTAMA',
    });
  }

  // Prioritas 2: Ada sesi presensi dibuka dan mahasiswa belum absen
  if (params.openAttendance) {
    activeConditions.push({
      id: `banner-att-${params.openAttendance.id}`,
      priority: 2,
      category: 'ATTENDANCE',
      title: `Presensi Terbuka: ${params.openAttendance.classTitle}`,
      subtitle: `Metode: ${params.openAttendance.method} • Batas: ${params.openAttendance.closeTime}`,
      buttonLabel: 'Absen Sekarang',
      buttonHref: params.openAttendance.href || `/classes`,
      badge: 'PRESENSI DIBUKA',
    });
  }

  // Prioritas 3: Ada tugas dengan tenggat kurang dari 24 jam dan belum dikumpulkan
  for (const asg of params.urgentAssignments) {
    const countdown = calculateCountdown(asg.dueAt, now);
    activeConditions.push({
      id: `banner-asg-${asg.id}`,
      priority: 3,
      category: 'ASSIGNMENT',
      title: `Tenggat Mendekat: ${asg.title}`,
      subtitle: `${asg.classTitle} • Hitung mundur: ${countdown.text}`,
      timeRemaining: countdown.text,
      buttonLabel: 'Kerjakan',
      buttonHref: asg.href || `/classes`,
      badge: '< 24 JAM',
    });
  }

  // Prioritas 4: Ada kelas yang akan mulai dalam 60 menit
  if (params.upcomingClass) {
    activeConditions.push({
      id: `banner-class-${params.upcomingClass.id}`,
      priority: 4,
      category: 'CLASS_UPCOMING',
      title: `Kelas Akan Datang: ${params.upcomingClass.title}`,
      subtitle: `${params.upcomingClass.time} • Ruang: ${params.upcomingClass.room}`,
      buttonLabel: 'Lihat Kelas',
      buttonHref: params.upcomingClass.href || `/classes`,
      badge: 'AKAN MULAI',
    });
  }

  // Urutkan berdasarkan prioritas terkecil (1 paling tinggi)
  activeConditions.sort((a, b) => a.priority - b.priority);

  // Jika tidak ada yang mendesak -> Prioritas 5
  if (activeConditions.length === 0) {
    const mat = params.lastStudiedMaterial || {
      title: 'Modul 07: REST API & Auth Supabase',
      classTitle: 'Pemrograman Web Lanjut',
      href: '/classes',
    };

    const idleItem: BannerConditionItem = {
      id: 'banner-idle',
      priority: 5,
      category: 'IDLE',
      title: 'Tidak ada yang mendesak hari ini',
      subtitle: `Lanjutkan membaca ${mat.title} (${mat.classTitle})`,
      buttonLabel: 'Lanjut Belajar',
      buttonHref: mat.href,
      badge: 'SANTAI',
    };

    return {
      primary: idleItem,
      others: [],
      totalActive: 0,
      serverTime: now.toISOString(),
    };
  }

  const primary = activeConditions[0];
  const others = activeConditions.slice(1);

  return {
    primary,
    others,
    totalActive: activeConditions.length,
    serverTime: now.toISOString(),
  };
}
