// Pure schedule utilities for SIAJAR Realtime Schedule Detection & Countdowns

import type { ActiveClassItem } from './home-utils';

export interface JakartaTimeInfo {
  now: Date;
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  dayName: string; // 'Minggu', 'Senin', ...
  dateNum: number;
  monthName: string;
  year: number;
  hour: number;
  minute: number;
  second: number;
  totalMinutes: number; // hour * 60 + minute
  timeString: string; // '10:45:00 WIB'
  shortTimeString: string; // '10:45 WIB'
  fullDateString: string; // 'Senin, 19 Oktober 2026'
}

export function getJakartaTime(date: Date = new Date()): JakartaTimeInfo {
  const dtf = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const dayNameRaw = (partMap['weekday'] || 'Senin').trim();
  const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1);
  const hour = parseInt(partMap['hour'] || '0', 10);
  const minute = parseInt(partMap['minute'] || '0', 10);
  const second = parseInt(partMap['second'] || '0', 10);
  const dateNum = parseInt(partMap['day'] || '1', 10);
  const monthName = partMap['month'] || '';
  const year = parseInt(partMap['year'] || '2026', 10);

  const dayMap: Record<string, number> = {
    minggu: 0,
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
  };
  const dayOfWeek = dayMap[dayName.toLowerCase()] ?? date.getDay();
  const totalMinutes = hour * 60 + minute;

  const pad = (n: number) => String(n).padStart(2, '0');
  const shortTimeString = `${pad(hour)}:${pad(minute)} WIB`;
  const timeString = `${pad(hour)}:${pad(minute)}:${pad(second)} WIB`;
  const fullDateString = `${dayName}, ${dateNum} ${monthName} ${year}`;

  return {
    now: date,
    dayOfWeek,
    dayName,
    dateNum,
    monthName,
    year,
    hour,
    minute,
    second,
    totalMinutes,
    timeString,
    shortTimeString,
    fullDateString,
  };
}

export interface ParsedSchedule {
  dayName: string;
  dayOfWeek: number; // 0..6
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "10:30"
  startMinutes: number; // e.g. 480
  endMinutes: number; // e.g. 630
}

export function parseCourseSchedule(scheduleStr: string, currentDayOfWeek: number = 1): ParsedSchedule | null {
  if (!scheduleStr) return null;
  const match = scheduleStr.match(/^(?:Setiap\s+)?([A-Za-z\s]+),\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/i);
  if (!match) return null;

  const rawDay = match[1].trim().toLowerCase();
  const startHour = parseInt(match[2], 10);
  const startMinute = parseInt(match[3], 10);
  const endHour = parseInt(match[4], 10);
  const endMinute = parseInt(match[5], 10);

  const dayMap: Record<string, number> = {
    minggu: 0,
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
  };

  let dayOfWeek = 1;
  let dayName = 'Senin';

  if (rawDay === 'hari ini') {
    dayOfWeek = currentDayOfWeek;
    const revDayMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    dayName = revDayMap[currentDayOfWeek] || 'Hari Ini';
  } else if (rawDay in dayMap) {
    dayOfWeek = dayMap[rawDay];
    dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const startTime = `${pad(startHour)}:${pad(startMinute)}`;
  const endTime = `${pad(endHour)}:${pad(endMinute)}`;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return {
    dayName,
    dayOfWeek,
    startTime,
    endTime,
    startMinutes,
    endMinutes,
  };
}

export type CourseScheduleStatus =
  | 'SEDANG_BERLANGSUNG'
  | 'SEGERA_DIMULAI'
  | 'HARI_INI'
  | 'BESOK'
  | 'MENDATANG';

export interface CourseRealtimeInfo {
  status: CourseScheduleStatus;
  statusLabel: string;
  badgeClass: string;
  pulse: boolean;
  minutesUntilStart: number;
  remainingMinutes: number;
  countdownText: string;
  actionButtonText: string;
  actionButtonVariant: 'ongoing' | 'soon' | 'regular';
  parsed: ParsedSchedule | null;
}

export function getCourseRealtimeScheduleStatus(
  scheduleStr: string,
  now: Date = new Date()
): CourseRealtimeInfo {
  const jakarta = getJakartaTime(now);
  const parsed = parseCourseSchedule(scheduleStr, jakarta.dayOfWeek);

  if (!parsed) {
    return {
      status: 'MENDATANG',
      statusLabel: 'Jadwal Fleksibel',
      badgeClass: 'bg-gray-soft text-ink border-ink',
      pulse: false,
      minutesUntilStart: 99999,
      remainingMinutes: 0,
      countdownText: 'Waktu Fleksibel',
      actionButtonText: 'Masuk Ruang Kelas Virtual',
      actionButtonVariant: 'regular',
      parsed: null,
    };
  }

  // 1. Hari yang sama dengan hari ini di Jakarta
  if (parsed.dayOfWeek === jakarta.dayOfWeek) {
    // Sedang berlangsung sekarang
    if (jakarta.totalMinutes >= parsed.startMinutes && jakarta.totalMinutes < parsed.endMinutes) {
      const remainingMinutes = parsed.endMinutes - jakarta.totalMinutes;
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      const remText = hours > 0 ? `${hours}j ${mins}m lagi` : `${mins} menit lagi`;

      return {
        status: 'SEDANG_BERLANGSUNG',
        statusLabel: 'Sedang Berlangsung',
        badgeClass: 'bg-primary text-white border-ink shadow-xs',
        pulse: true,
        minutesUntilStart: 0,
        remainingMinutes,
        countdownText: `Tersisa ${remText}`,
        actionButtonText: 'Masuk Kelas / Presensi Aktif (Buka Sekarang)',
        actionButtonVariant: 'ongoing',
        parsed,
      };
    }

    // Akan dimulai hari ini
    if (jakarta.totalMinutes < parsed.startMinutes) {
      const diff = parsed.startMinutes - jakarta.totalMinutes;
      const isSoon = diff <= 60;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      const countdown = isSoon
        ? `Mulai dalam ${diff} menit`
        : hours > 0 && mins > 0
        ? `Mulai dlm ${hours}j ${mins}m (${parsed.startTime} WIB)`
        : `Mulai dlm ${hours} jam (${parsed.startTime} WIB)`;

      return {
        status: isSoon ? 'SEGERA_DIMULAI' : 'HARI_INI',
        statusLabel: isSoon ? 'Segera Dimulai' : 'Hari Ini',
        badgeClass: isSoon
          ? 'bg-amber-400 text-ink border-ink shadow-xs'
          : 'bg-ink text-white border-ink shadow-xs',
        pulse: isSoon,
        minutesUntilStart: diff,
        remainingMinutes: 0,
        countdownText: countdown,
        actionButtonText: isSoon
          ? `Siap Masuk Kelas (Mulai ${parsed.startTime} WIB)`
          : `Masuk Ruang Kelas (Pukul ${parsed.startTime} WIB)`,
        actionButtonVariant: isSoon ? 'soon' : 'regular',
        parsed,
      };
    }

    // Sudah selesai hari ini -> Next session is in 7 days
    const minutesUntilStart = 7 * 24 * 60 - jakarta.totalMinutes + parsed.startMinutes;
    return {
      status: 'MENDATANG',
      statusLabel: 'Minggu Depan',
      badgeClass: 'bg-gray-soft text-ink border-ink',
      pulse: false,
      minutesUntilStart,
      remainingMinutes: 0,
      countdownText: `${parsed.dayName} depan, ${parsed.startTime} WIB`,
      actionButtonText: 'Buka Silabus & Rekaman Kuliah',
      actionButtonVariant: 'regular',
      parsed,
    };
  }

  // 2. Berbeda hari
  const daysDiff = (parsed.dayOfWeek - jakarta.dayOfWeek + 7) % 7;
  const minutesUntilStart =
    (daysDiff - 1) * 24 * 60 + (24 * 60 - jakarta.totalMinutes) + parsed.startMinutes;

  if (daysDiff === 1) {
    const hours = Math.floor(minutesUntilStart / 60);
    return {
      status: 'BESOK',
      statusLabel: 'Besok',
      badgeClass: 'bg-surface text-ink border-ink',
      pulse: false,
      minutesUntilStart,
      remainingMinutes: 0,
      countdownText: `Besok, ${parsed.startTime} WIB (${hours}j lagi)`,
      actionButtonText: `Masuk Ruang Kelas (Besok, ${parsed.startTime} WIB)`,
      actionButtonVariant: 'regular',
      parsed,
    };
  }

  return {
    status: 'MENDATANG',
    statusLabel: `${parsed.dayName} Mendatang`,
    badgeClass: 'bg-gray-soft text-gray-dark border-ink/40',
    pulse: false,
    minutesUntilStart,
    remainingMinutes: 0,
    countdownText: `${parsed.dayName}, ${parsed.startTime} WIB (${daysDiff} hari lagi)`,
    actionButtonText: `Masuk Ruang Kelas (${parsed.dayName}, ${parsed.startTime} WIB)`,
    actionButtonVariant: 'regular',
    parsed,
  };
}

export function getNextUpcomingCourse(
  courses: ActiveClassItem[],
  now: Date = new Date()
): { course: ActiveClassItem; realtime: CourseRealtimeInfo } | null {
  if (!courses || courses.length === 0) return null;

  const evaluated = courses.map((c) => ({
    course: c,
    realtime: getCourseRealtimeScheduleStatus(c.schedule, now),
  }));

  // 1. If any class is ongoing, prioritize that
  const ongoing = evaluated.find((e) => e.realtime.status === 'SEDANG_BERLANGSUNG');
  if (ongoing) return ongoing;

  // 2. Otherwise sort by minutesUntilStart
  evaluated.sort((a, b) => a.realtime.minutesUntilStart - b.realtime.minutesUntilStart);
  return evaluated[0];
}
