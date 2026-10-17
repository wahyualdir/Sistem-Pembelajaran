import { describe, it, expect } from 'vitest';
import {
  calcLatePenalty,
  calcLateMinutes,
  getEffectiveDates,
  isSubmissionClosed,
  calcFinalAssignmentScore,
} from '@/lib/akademik/late-penalty';

describe('SIAJAR Fase 2.1: Aturan Keterlambatan dan Penalti Nilai', () => {
  describe('Kalkulasi Penalti Keterlambatan (calcLatePenalty)', () => {
    // 1. Kebijakan 'none' -> penalti selalu 0
    it('1. mengembalikan 0 jika kebijakan keterlambatan adalah none', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 120,
        latePolicy: 'none',
        latePenaltyValue: 10,
        latePenaltyCap: 100,
      });
      expect(penalty).toBe(0);
    });

    // 2. Pengumpulan tepat waktu (lateMinutes <= 0)
    it('2. mengembalikan 0 jika tugas dikumpulkan tepat waktu atau lebih awal', () => {
      expect(calcLatePenalty({ lateMinutes: 0, latePolicy: 'per_day', latePenaltyValue: 10, latePenaltyCap: 100 })).toBe(0);
      expect(calcLatePenalty({ lateMinutes: -30, latePolicy: 'per_hour', latePenaltyValue: 5, latePenaltyCap: 50 })).toBe(0);
    });

    // 3. Kebijakan 'flat' -> penalti satu kali flat
    it('3. menerapkan penalti flat satu kali jika terlambat', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 15,
        latePolicy: 'flat',
        latePenaltyValue: 15,
        latePenaltyCap: 100,
      });
      expect(penalty).toBe(15);
    });

    // 4. Kebijakan 'per_hour' -> tepat 1 jam (60 menit)
    it('4. menghitung penalti per_hour untuk tepat 60 menit (1 satuan)', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 60,
        latePolicy: 'per_hour',
        latePenaltyValue: 5,
        latePenaltyCap: 100,
      });
      expect(penalty).toBe(5);
    });

    // 5. Kebijakan 'per_hour' -> 61 menit dibulatkan ke atas jadi 2 jam
    it('5. menghitung penalti per_hour dengan pembulatan ke atas (ceil) untuk 61 menit (2 jam)', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 61,
        latePolicy: 'per_hour',
        latePenaltyValue: 5,
        latePenaltyCap: 100,
      });
      expect(penalty).toBe(10);
    });

    // 6. Kebijakan 'per_day' -> tepat 1 hari (1440 menit)
    it('6. menghitung penalti per_day untuk tepat 1440 menit (1 hari)', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 1440,
        latePolicy: 'per_day',
        latePenaltyValue: 10,
        latePenaltyCap: 100,
      });
      expect(penalty).toBe(10);
    });

    // 7. Kebijakan 'per_day' -> 1441 menit dibulatkan ke atas jadi 2 hari
    it('7. menghitung penalti per_day dengan pembulatan ke atas untuk 1441 menit (2 hari)', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 1441,
        latePolicy: 'per_day',
        latePenaltyValue: 10,
        latePenaltyCap: 100,
      });
      expect(penalty).toBe(20);
    });

    // 8. Batas penalti maksimal (latePenaltyCap)
    it('8. membatasi total penalti sesuai latePenaltyCap (misalnya maksimal 50%)', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 1440 * 10, // terlambat 10 hari = 100%
        latePolicy: 'per_day',
        latePenaltyValue: 10,
        latePenaltyCap: 50,
      });
      expect(penalty).toBe(50);
    });

    // 9. Penalti flat juga tunduk pada batas maksimal
    it('9. membatasi penalti flat bila melebihi batas maksimal cap', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 10,
        latePolicy: 'flat',
        latePenaltyValue: 60,
        latePenaltyCap: 40,
      });
      expect(penalty).toBe(40);
    });

    // 10. Nilai penalti 0 -> penalti 0
    it('10. mengembalikan 0 jika nilai penalti latePenaltyValue bernilai 0', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 500,
        latePolicy: 'per_day',
        latePenaltyValue: 0,
        latePenaltyCap: 100,
      });
      expect(penalty).toBe(0);
    });
  });

  describe('Kalkulasi Menit Keterlambatan dan Tanggal Efektif', () => {
    // 11. Pengumpulan tepat pada detik tenggat
    it('11. menganggap pengumpulan tepat pada detik tenggat sebagai tepat waktu (0 menit terlambat)', () => {
      const due = '2026-10-20T23:59:00.000Z';
      const submitted = '2026-10-20T23:59:00.000Z';
      expect(calcLateMinutes(submitted, due)).toBe(0);
    });

    // 12. Pengumpulan 1 detik setelah tenggat dibulatkan ke atas jadi 1 menit terlambat
    it('12. membulatkan selisih beberapa detik menjadi 1 menit terlambat (ceil)', () => {
      const due = '2026-10-20T23:59:00.000Z';
      const submitted = '2026-10-20T23:59:05.000Z'; // 5 detik setelah tenggat
      expect(calcLateMinutes(submitted, due)).toBe(1);
    });

    // 13. Perpanjangan tenggat menggantikan tenggat asli
    it('13. menggunakan tenggat perpanjangan jika ada (effectiveDueAt)', () => {
      const baseDue = '2026-10-20T23:59:00.000Z';
      const extensionDue = '2026-10-22T23:59:00.000Z';
      const { effectiveDueAt } = getEffectiveDates({
        dueAt: baseDue,
        extensionNewDueAt: extensionDue,
      });
      expect(effectiveDueAt.toISOString()).toBe(new Date(extensionDue).toISOString());

      // Pengumpulan di antara tenggat asli dan perpanjangan dianggap tepat waktu
      const subTime = '2026-10-21T10:00:00.000Z';
      expect(calcLateMinutes(subTime, effectiveDueAt)).toBe(0);
    });

    // 14. Penutupan keras efektif menolak pengumpulan setelah close_at
    it('14. mendeteksi penutupan keras (isSubmissionClosed)', () => {
      const close = new Date('2026-10-23T23:59:00.000Z');
      const beforeClose = new Date('2026-10-23T23:58:00.000Z');
      const afterClose = new Date('2026-10-24T00:01:00.000Z');

      expect(isSubmissionClosed(beforeClose, close)).toBe(false);
      expect(isSubmissionClosed(afterClose, close)).toBe(true);
    });
  });

  describe('Kalkulasi Skor Akhir (calcFinalAssignmentScore)', () => {
    // 15. Pemotongan penalti dari skor mentah
    it('15. menghitung skor akhir setelah pemotongan penalti', () => {
      // Skor mentah 80, penalti 20% -> 80 - 16 = 64
      expect(calcFinalAssignmentScore(80, 20, false)).toBe(64);

      // Skor mentah 95, penalti 10% -> 95 - 9.5 = 85.5
      expect(calcFinalAssignmentScore(95, 10, false)).toBe(85.5);
    });

    // 16. Pemutihan penalti oleh dosen (penaltyWaived = true)
    it('16. mengembalikan skor mentah utuh jika dosen memutihkan penalti (penaltyWaived = true)', () => {
      expect(calcFinalAssignmentScore(80, 30, true)).toBe(80);
    });

    // 17. Penalti 100% menghasilkan skor 0
    it('17. menghasilkan skor 0 bila penalti mencapai 100%', () => {
      expect(calcFinalAssignmentScore(85, 100, false)).toBe(0);
    });
  });
});
