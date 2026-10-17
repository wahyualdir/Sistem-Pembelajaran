'use server';

import { randomBytes } from 'crypto';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';

// -------------------------------------------------------------
// In-Memory Persistent Store untuk Token Kalender Pribadi
// -------------------------------------------------------------
const userCalendarTokens: Map<string, string> =
  ((globalThis as any).__siajarCalendarTokens ??= new Map<string, string>());
const tokenToUserMap: Map<string, string> =
  ((globalThis as any).__siajarTokenToUserMap ??= new Map<string, string>());

export async function getPersonalCalendarTokenAction(): Promise<{
  ok: boolean;
  token?: string;
  feedUrl?: string;
  webcalUrl?: string;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan login terlebih dahulu.' };

  const userId = user.user.id;
  let token = userCalendarTokens.get(userId);

  if (!token) {
    token = randomBytes(24).toString('hex');
    userCalendarTokens.set(userId, token);
    tokenToUserMap.set(token, userId);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const feedUrl = `${baseUrl}/api/calendar/feed?token=${token}`;
  const webcalUrl = feedUrl.replace(/^https?:\/\//, 'webcal://');

  return { ok: true, token, feedUrl, webcalUrl };
}

export async function resetPersonalCalendarTokenAction(): Promise<{
  ok: boolean;
  newToken?: string;
  feedUrl?: string;
  webcalUrl?: string;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan login terlebih dahulu.' };

  const userId = user.user.id;
  const oldToken = userCalendarTokens.get(userId);
  if (oldToken) {
    tokenToUserMap.delete(oldToken);
  }

  const newToken = randomBytes(24).toString('hex');
  userCalendarTokens.set(userId, newToken);
  tokenToUserMap.set(newToken, userId);

  await recordSystemAuditLog({
    actorId: userId,
    actorName: user.profile?.full_name || (user.user as any).name || 'Pengguna',
    actorRole: user.activeRole,
    action: 'user.reset_calendar_token',
    entityType: 'calendar_tokens',
    entityId: userId,
    description: 'Pengguna melakukan reset token langganan iCalendar pribadi (.ics feed).',
    valueBefore: null,
    valueAfter: JSON.stringify({ tokenRotated: true }),
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const feedUrl = `${baseUrl}/api/calendar/feed?token=${newToken}`;
  const webcalUrl = feedUrl.replace(/^https?:\/\//, 'webcal://');

  return { ok: true, newToken, feedUrl, webcalUrl };
}

export async function getUserIdFromCalendarToken(token: string): Promise<string | null> {
  return tokenToUserMap.get(token) || null;
}

// -------------------------------------------------------------
// Format Tanggal ke Standar iCalendar UTC (YYYYMMDDTHHMMSSZ)
// -------------------------------------------------------------
function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generator File iCalendar (.ics RFC 5545)
 */
export async function generateIcsCalendarFeed(userId: string): Promise<string> {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SIAJAR//Universitas Islam Riau//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SIAJAR - Jadwal Perkuliahan & Evaluasi',
    'X-WR-TIMEZONE:Asia/Jakarta',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];

  const now = new Date();
  const dtStamp = toIcsDate(now);

  // 1. Tambahkan Jadwal Perkuliahan Mingguan
  const classSchedules = [
    {
      id: 'sched-1',
      title: 'Pemrograman Web & Arsitektur Cloud (IF-3A)',
      room: 'Lab Rekayasa Perangkat Lunak 2',
      lecturer: 'Dr. Budi Santoso, M.Kom.',
      dayOfWeek: 1, // Senin
      startHour: 8,
      startMin: 0,
      endHour: 10,
      endMin: 30,
    },
    {
      id: 'sched-2',
      title: 'Basis Data Terdistribusi (IF-3A)',
      room: 'Ruang Teori 304',
      lecturer: 'Ir. Ahmad Zarkasi, M.T.',
      dayOfWeek: 3, // Rabu
      startHour: 10,
      startMin: 0,
      endHour: 12,
      endMin: 0,
    },
    {
      id: 'sched-3',
      title: 'Kriptografi & Keamanan Informasi (IF-3A)',
      room: 'Lab Cyber Security',
      lecturer: 'Dr. Hendra Gunawan, S.Kom.',
      dayOfWeek: 5, // Jumat
      startHour: 8,
      startMin: 30,
      endHour: 10,
      endMin: 30,
    },
  ];

  classSchedules.forEach((s) => {
    // Set tanggal event ke minggu berjalan
    const eventStart = new Date(now);
    const currentDay = eventStart.getDay();
    const distance = (s.dayOfWeek + 7 - currentDay) % 7;
    eventStart.setDate(eventStart.getDate() + distance);
    eventStart.setHours(s.startHour, s.startMin, 0, 0);

    const eventEnd = new Date(eventStart);
    eventEnd.setHours(s.endHour, s.endMin, 0, 0);

    lines.push(
      'BEGIN:VEVENT',
      `UID:class-${s.id}-${userId}@siajar.ac.id`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${toIcsDate(eventStart)}`,
      `DTEND:${toIcsDate(eventEnd)}`,
      'RRULE:FREQ=WEEKLY;COUNT=16',
      `SUMMARY:[Kuliah] ${s.title}`,
      `DESCRIPTION:Dosen Pengampu: ${s.lecturer}\\nRuangan: ${s.room}\\nKehadiran minimal 75% untuk kelayakan UAS.`,
      `LOCATION:${s.room}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  // 2. Tambahkan Tenggat Tugas (Assignments Due)
  const assignments = [
    {
      id: 'asg-due-1',
      title: 'Tugas 1: Integrasi REST API & Reverse Proxy Nginx',
      course: 'Pemrograman Web Lanjut',
      dueDate: new Date(Date.now() + 86400000 * 2), // H+2
    },
    {
      id: 'asg-due-2',
      title: 'Tugas Proyek 2: Replikasi Master-Slave PostgreSQL',
      course: 'Basis Data Terdistribusi',
      dueDate: new Date(Date.now() + 86400000 * 5), // H+5
    },
  ];

  assignments.forEach((a) => {
    const end = new Date(a.dueDate);
    const start = new Date(end.getTime() - 3600000); // 1 jam durasi display

    lines.push(
      'BEGIN:VEVENT',
      `UID:asg-${a.id}-${userId}@siajar.ac.id`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:[Tenggat Tugas] ${a.title}`,
      `DESCRIPTION:Mata Kuliah: ${a.course}\\nKumpulkan sebelum pukul 23:59 WIB melalui portal SIAJAR.`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  // 3. Tambahkan Jadwal Ujian (Exams)
  const exams = [
    {
      id: 'exam-cal-1',
      title: 'Ujian Tengah Semester (UTS): Pemrograman Web & Cloud',
      date: new Date(Date.now() + 86400000 * 10), // H+10
      durationMinutes: 90,
      room: 'CBT Lab Komputer 1',
    },
  ];

  exams.forEach((ex) => {
    const start = new Date(ex.date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + ex.durationMinutes * 60000);

    lines.push(
      'BEGIN:VEVENT',
      `UID:exam-${ex.id}-${userId}@siajar.ac.id`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:[Ujian Resmi] ${ex.title}`,
      `DESCRIPTION:Lokasi: ${ex.room}\\nUjian CBT online dengan monitoring proctoring aktif. Bawa kartu mahasiswa dan login 15 menit sebelum ujian dimulai.`,
      `LOCATION:${ex.room}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
