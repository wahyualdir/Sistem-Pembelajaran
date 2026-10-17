import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock current active user
const mockCurrentUser = {
  user: { id: 'usr-cal-test-001' },
  profile: { full_name: 'Mahasiswa Kalender' },
  roles: [{ id: 'r1', roles: { code: 'STUDENT' } }],
  activeRole: 'STUDENT',
};

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

import {
  getPersonalCalendarTokenAction,
  resetPersonalCalendarTokenAction,
  getUserIdFromCalendarToken,
  generateIcsCalendarFeed,
} from '@/modules/academic/calendar-sync-actions';

describe('Sinkronisasi Kalender Personal (iCalendar RFC 5545 Feed)', () => {
  const userId = 'usr-cal-test-001';

  beforeEach(() => {
    // Reset tokens
    const tokens = (globalThis as any).__siajarCalendarTokens;
    if (tokens) {
      tokens.clear();
    }
    const tokenMap = (globalThis as any).__siajarTokenToUserMap;
    if (tokenMap) {
      tokenMap.clear();
    }
  });

  describe('1. Manajemen Token Rahasia Kalender', () => {
    it('menghasilkan token rahasia unik untuk pengguna', async () => {
      const res = await getPersonalCalendarTokenAction();
      expect(res.ok).toBe(true);
      expect(res.token).toBeDefined();
      expect(res.token!.length).toBeGreaterThanOrEqual(32);
      expect(res.feedUrl).toContain('/api/calendar/feed?token=');
      expect(res.webcalUrl).toContain('webcal://');

      const resolvedUser = await getUserIdFromCalendarToken(res.token!);
      expect(resolvedUser).toBe(userId);
    });

    it('dapat mereset token rahasia dan membatalkan token lama', async () => {
      const initial = await getPersonalCalendarTokenAction();
      const oldToken = initial.token!;

      const resetRes = await resetPersonalCalendarTokenAction();
      expect(resetRes.ok).toBe(true);
      expect(resetRes.newToken).toBeDefined();
      expect(resetRes.newToken).not.toBe(oldToken);

      // Token lama sudah tidak valid
      const oldLookup = await getUserIdFromCalendarToken(oldToken);
      expect(oldLookup).toBeNull();

      // Token baru valid
      const newLookup = await getUserIdFromCalendarToken(resetRes.newToken!);
      expect(newLookup).toBe(userId);
    });
  });

  describe('2. Pembuatan Feed Kalender Format RFC 5545 (.ics)', () => {
    it('menghasilkan feed .ics lengkap dengan VEVENT perkuliahan, tenggat tugas, dan jadwal ujian', async () => {
      const icsFeed = await generateIcsCalendarFeed(userId);

      expect(icsFeed).toContain('BEGIN:VCALENDAR');
      expect(icsFeed).toContain('VERSION:2.0');
      expect(icsFeed).toContain('PRODID:-//SIAJAR//Universitas Islam Riau//ID');
      expect(icsFeed).toContain('END:VCALENDAR');

      // Memiliki VEVENT
      expect(icsFeed).toContain('BEGIN:VEVENT');
      expect(icsFeed).toContain('SUMMARY:[Kuliah]');
      expect(icsFeed).toContain('SUMMARY:[Tenggat Tugas]');
      expect(icsFeed).toContain('SUMMARY:[Ujian Resmi]');

      // Mengandung aturan perulangan mingguan untuk perkuliahan (RRULE)
      expect(icsFeed).toContain('RRULE:FREQ=WEEKLY');
    });

    it('memastikan format tanggal menggunakan standar iCalendar YYYYMMDDTHHMMSS', async () => {
      const icsFeed = await generateIcsCalendarFeed(userId);
      expect(icsFeed).toMatch(/DTSTART:\d{8}T\d{6}/);
      expect(icsFeed).toMatch(/DTEND:\d{8}T\d{6}/);
    });
  });
});
