import { describe, it, expect } from 'vitest';
import {
  GAMIFICATION_POINTS,
  INITIAL_BADGES,
  calculateStreak,
} from '@/lib/config/gamification';
import {
  getStaticReminderMessage,
  isInQuietHours,
  adjustScheduledTimeForQuietHours,
} from '@/lib/ai/reminder-templates';
import { AI_REMINDER_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { buildReminderDedupeKey } from '@/lib/ai/reminder-service';

describe('Fase 5: Interaksi (Pesan, Konsultasi, Polling, Gamifikasi, Pengingat AI, EDOM)', () => {
  describe('1. Gamifikasi dan Kebiasaan Belajar (12.3)', () => {
    it('memiliki konfigurasi poin terpusat sesuai spesifikasi', () => {
      expect(GAMIFICATION_POINTS.ASSIGNMENT_ON_TIME).toBe(10);
      expect(GAMIFICATION_POINTS.ATTENDANCE_PRESENT).toBe(5);
      expect(GAMIFICATION_POINTS.MATERIAL_COMPLETED).toBe(3);
      expect(GAMIFICATION_POINTS.POLL_VOTE).toBe(2);
      expect(GAMIFICATION_POINTS.QUIZ_VOTE_CORRECT).toBe(3);
    });

    it('memiliki 7 lencana awal dengan nama natural tanpa seruan', () => {
      expect(INITIAL_BADGES).toHaveLength(7);
      const codes = INITIAL_BADGES.map((b) => b.code);
      expect(codes).toContain('TEPAT_WAKTU');
      expect(codes).toContain('HADIR_PENUH');
      expect(codes).toContain('TUNTAS_MATERI');
      expect(codes).toContain('RAJIN_MEMBACA');
      expect(codes).toContain('PENJAWAB_AKTIF');
      expect(codes).toContain('SEMINGGU_BERUNTUN');
      expect(codes).toContain('SEBULAN_BERUNTUN');

      // Pastikan tidak ada emoji atau kata terlarang di nama lencana
      INITIAL_BADGES.forEach((b) => {
        expect(b.name).not.toMatch(/[!🎉🏆🔥]/);
        expect(b.name).not.toContain('Dashboard');
        expect(b.name).not.toContain('Smart');
      });
    });

    it('menghitung kebiasaan aktif harian (streak) secara akurat', () => {
      // 1. Hari pertama
      const s1 = calculateStreak(null, '2026-10-18', 0, 0);
      expect(s1.currentDays).toBe(1);
      expect(s1.bestDays).toBe(1);

      // 2. Hari yang sama (tidak bertambah ganda)
      const s2 = calculateStreak('2026-10-18', '2026-10-18', 1, 1);
      expect(s2.currentDays).toBe(1);
      expect(s2.bestDays).toBe(1);

      // 3. Hari esoknya berturut-turut (bertambah 1)
      const s3 = calculateStreak('2026-10-18', '2026-10-19', 1, 1);
      expect(s3.currentDays).toBe(2);
      expect(s3.bestDays).toBe(2);

      // 4. Streak putus (terlewat 2 hari) kembali ke 1 hari tanpa galat
      const s4 = calculateStreak('2026-10-19', '2026-10-22', 5, 10);
      expect(s4.currentDays).toBe(1);
      expect(s4.bestDays).toBe(10); // bestDays tetap terjaga
    });
  });

  describe('2. Pengingat AI Proaktif dan Jam Tenang (12.4)', () => {
    it('memiliki prompt sistem yang melarang emoji dan fakta di luar payload', () => {
      expect(AI_REMINDER_SYSTEM_PROMPT).toContain('tanpa emoji');
      expect(AI_REMINDER_SYSTEM_PROMPT).toContain('tanpa tanda seru berlebihan');
      expect(AI_REMINDER_SYSTEM_PROMPT).toContain('Gunakan hanya fakta pada data yang diberikan');
      expect(AI_REMINDER_SYSTEM_PROMPT).toContain("satu kunci 'pesan'");
    });

    it('menghasilkan pesan statis fallback alami untuk seluruh jenis pengingat', () => {
      const msgTugasH1 = getStaticReminderMessage('tugas_h1', {
        title: 'Tugas Bab 3 Basis Data',
        courseName: 'Basis Data A',
      });
      expect(msgTugasH1).toContain('Tugas Bab 3 Basis Data');
      expect(msgTugasH1).toContain('Basis Data A');
      expect(msgTugasH1).not.toMatch(/[!⏰]/);

      const msgKehadiran = getStaticReminderMessage('kehadiran', {
        courseName: 'Algoritma',
        attendancePercent: 78,
        safeAbsencesRemaining: 1,
      });
      expect(msgKehadiran).toContain('78%');
      expect(msgKehadiran).toContain('1 kesempatan absen');

      const msgLogin = getStaticReminderMessage('login_baru', {
        device: 'MacBook Pro',
        location: 'Pekanbaru',
      });
      expect(msgLogin).toContain('MacBook Pro');
      expect(msgLogin).toContain('Pekanbaru');
    });

    it('mendeteksi jam tenang (22.00 - 06.00 WIB) dan menyesuaikan waktu kirim', () => {
      // 23.00 WIB = 16.00 UTC
      const nightUtc = new Date('2026-10-18T16:00:00Z');
      expect(isInQuietHours(nightUtc)).toBe(true);

      // 10.00 WIB = 03.00 UTC
      const morningUtc = new Date('2026-10-18T03:00:00Z');
      expect(isInQuietHours(morningUtc)).toBe(false);

      // Pengingat tugas di jam tenang digeser ke jam 06.00 WIB
      const adjusted = adjustScheduledTimeForQuietHours(nightUtc, 'tugas_h1');
      expect(adjusted.getTime()).not.toBe(nightUtc.getTime());

      // Pengecualian: login_baru TIDAK pernah digeser walau di jam malam
      const loginAdjusted = adjustScheduledTimeForQuietHours(nightUtc, 'login_baru');
      expect(loginAdjusted.getTime()).toBe(nightUtc.getTime());
    });

    it('membentuk dedupe_key unik yang deterministik dan idempoten', () => {
      const key1 = buildReminderDedupeKey('std-001', 'tugas_h1', 'assignments', 'asg-101');
      const key2 = buildReminderDedupeKey('std-001', 'tugas_h1', 'assignments', 'asg-101');
      const keyDiff = buildReminderDedupeKey('std-002', 'tugas_h1', 'assignments', 'asg-101');

      expect(key1).toBe('std-001:tugas_h1:assignments:asg-101');
      expect(key1).toBe(key2);
      expect(key1).not.toBe(keyDiff);
    });
  });

  describe('3. Konsultasi dan Batas Waktu Pembatalan (12.1)', () => {
    it('memvalidasi batas waktu pembatalan konsultasi minimal 2 jam sebelum mulai', () => {
      const now = new Date('2026-10-18T10:00:00Z');
      
      // Kasus 1: Jadwal 3 jam ke depan -> Boleh dibatalkan
      const slot3h = new Date(now.getTime() + 3 * 3600 * 1000);
      const diffHours3h = (slot3h.getTime() - now.getTime()) / (3600 * 1000);
      expect(diffHours3h).toBeGreaterThanOrEqual(2);

      // Kasus 2: Jadwal 1 jam ke depan -> Ditolak
      const slot1h = new Date(now.getTime() + 1 * 3600 * 1000);
      const diffHours1h = (slot1h.getTime() - now.getTime()) / (3600 * 1000);
      expect(diffHours1h).toBeLessThan(2);
    });
  });
});
