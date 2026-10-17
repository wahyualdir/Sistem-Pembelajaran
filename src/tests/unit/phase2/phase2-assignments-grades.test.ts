import { describe, it, expect } from 'vitest';
import {
  calcLatePenalty,
  calcLateMinutes,
  getEffectiveDates,
  isSubmissionClosed,
  calcFinalAssignmentScore,
} from '@/lib/akademik/late-penalty';

describe('SIAJAR Fase 2: Tugas, Rubrik, Kelompok, dan Sanggah Nilai', () => {
  describe('1. Aturan Keterlambatan dan Penalti', () => {
    it('menghitung penalti flat secara akurat', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 10,
        latePolicy: 'flat',
        latePenaltyValue: 15,
        latePenaltyCap: 100,
      });
      expect(penalty).toBe(15);
    });

    it('menghormati latePenaltyCap (tidak boleh melebihi batas cap)', () => {
      const penalty = calcLatePenalty({
        lateMinutes: 60 * 24 * 10, // 10 hari
        latePolicy: 'per_day',
        latePenaltyValue: 20, // 20% per hari -> 200%
        latePenaltyCap: 50, // dibatasi 50%
      });
      expect(penalty).toBe(50);
    });

    it('menghitung skor akhir dengan penalti keterlambatan', () => {
      const finalScore = calcFinalAssignmentScore(90, 20, false);
      expect(finalScore).toBe(72); // 90 - (90 * 20%) = 72
    });

    it('mengembalikan rawScore penuh jika penalti dimaafkan (waived)', () => {
      const finalScore = calcFinalAssignmentScore(90, 20, true);
      expect(finalScore).toBe(90);
    });

    it('memperhitungkan perpanjangan tenggat (extensions) untuk tanggal efektif', () => {
      const baseDue = '2026-10-20T12:00:00Z';
      const baseClose = '2026-10-22T12:00:00Z';
      const extDue = '2026-10-25T12:00:00Z';
      const extClose = '2026-10-26T12:00:00Z';

      const dates = getEffectiveDates({
        dueAt: baseDue,
        closeAt: baseClose,
        extensionNewDueAt: extDue,
        extensionNewCloseAt: extClose,
      });

      expect(dates.effectiveDueAt.toISOString()).toBe(new Date(extDue).toISOString());
      expect(dates.effectiveCloseAt?.toISOString()).toBe(new Date(extClose).toISOString());
    });

    it('menolak pengumpulan jika telah melewati batas hard close date', () => {
      const now = new Date();
      const pastClose = new Date(Date.now() - 3600 * 1000);
      const futureClose = new Date(Date.now() + 3600 * 1000);

      expect(isSubmissionClosed(now, pastClose)).toBe(true);
      expect(isSubmissionClosed(now, futureClose)).toBe(false);
    });
  });

  describe('2. Aturan Tugas Kelompok dan Penyesuaian Anggota', () => {
    it('memvalidasi kode join kelompok 6 karakter alfanumerik', () => {
      const isValidCode = (code: string) => /^[A-Z0-9]{6}$/.test(code.toUpperCase());

      expect(isValidCode('ABC123')).toBe(true);
      expect(isValidCode('k7x9p2')).toBe(true);
      expect(isValidCode('abc')).toBe(false);
      expect(isValidCode('ABCDEF1')).toBe(false);
      expect(isValidCode('AB-123')).toBe(false);
    });

    it('menghitung nilai individu berdasarkan faktor penyesuaian kontribusi (peer contribution)', () => {
      const groupScore = 80;
      const calcAdjustedScore = (score: number, factor: number) => {
        const clampedFactor = Math.min(1.5, Math.max(0.5, factor));
        return Math.round(Math.min(100, score * clampedFactor) * 100) / 100;
      };

      // Kontribusi rata-rata (1.0)
      expect(calcAdjustedScore(groupScore, 1.0)).toBe(80);
      // Kontribusi tinggi (1.2)
      expect(calcAdjustedScore(groupScore, 1.2)).toBe(96);
      // Kontribusi sangat tinggi (1.5 cap)
      expect(calcAdjustedScore(groupScore, 1.5)).toBe(100); // 80 * 1.5 = 120 -> clamped to 100
      // Kontribusi rendah (0.75)
      expect(calcAdjustedScore(groupScore, 0.75)).toBe(60);
      // Kontribusi di bawah minimum (dibatasi min 0.5)
      expect(calcAdjustedScore(groupScore, 0.2)).toBe(40); // 80 * 0.5 = 40
    });

    it('memastikan ukuran kelompok memenuhi batas kapasitas minSize dan maxSize', () => {
      const minSize = 3;
      const maxSize = 5;

      const validateGroupSize = (currentCount: number) => {
        return {
          canAddMember: currentCount < maxSize,
          meetsMinSize: currentCount >= minSize,
        };
      };

      expect(validateGroupSize(2)).toEqual({ canAddMember: true, meetsMinSize: false });
      expect(validateGroupSize(4)).toEqual({ canAddMember: true, meetsMinSize: true });
      expect(validateGroupSize(5)).toEqual({ canAddMember: false, meetsMinSize: true });
    });
  });

  describe('3. Rubrik Penilaian', () => {
    it('menghitung skor total dari kriteria rubrik berbasis bobot persentase', () => {
      interface CriterionScore {
        criterionTitle: string;
        weightPercent: number; // e.g. 40%
        selectedLevelScore: number; // e.g. 90
      }

      const calculateRubricScore = (criteria: CriterionScore[]) => {
        const totalWeight = criteria.reduce((sum, c) => sum + c.weightPercent, 0);
        if (totalWeight <= 0) return 0;
        const weightedSum = criteria.reduce(
          (sum, c) => sum + (c.selectedLevelScore * c.weightPercent) / 100,
          0
        );
        return Math.round(weightedSum * 100) / 100;
      };

      const criteria: CriterionScore[] = [
        { criterionTitle: 'Analisis & Logika', weightPercent: 40, selectedLevelScore: 85 },
        { criterionTitle: 'Kerapian Kode', weightPercent: 30, selectedLevelScore: 90 },
        { criterionTitle: 'Dokumentasi', weightPercent: 30, selectedLevelScore: 80 },
      ];

      // (85*0.4) + (90*0.3) + (80*0.3) = 34 + 27 + 24 = 85
      expect(calculateRubricScore(criteria)).toBe(85);
    });

    it('memvalidasi total bobot kriteria harus 100%', () => {
      const validateCriteriaWeights = (weights: number[]) => {
        const total = weights.reduce((acc, w) => acc + w, 0);
        return Math.abs(total - 100) < 0.001;
      };

      expect(validateCriteriaWeights([40, 30, 30])).toBe(true);
      expect(validateCriteriaWeights([50, 50])).toBe(true);
      expect(validateCriteriaWeights([40, 30])).toBe(false);
      expect(validateCriteriaWeights([50, 60])).toBe(false);
    });
  });

  describe('4. Sanggah Nilai (Grade Disputes)', () => {
    it('memvalidasi jendela 7 hari kalender sejak nilai terbit', () => {
      const isWithinDisputeWindow = (gradedAtIso: string, now = new Date()) => {
        const gradedTime = new Date(gradedAtIso).getTime();
        const windowMs = 7 * 24 * 60 * 60 * 1000;
        return now.getTime() - gradedTime <= windowMs;
      };

      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString();
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();

      expect(isWithinDisputeWindow(sixDaysAgo)).toBe(true);
      expect(isWithinDisputeWindow(eightDaysAgo)).toBe(false);
    });

    it('membatasi maksimal 3 sanggahan aktif per mahasiswa per kelas', () => {
      const checkDisputeQuota = (activeDisputeCount: number) => {
        const MAX_ACTIVE = 3;
        return {
          allowed: activeDisputeCount < MAX_ACTIVE,
          remaining: Math.max(0, MAX_ACTIVE - activeDisputeCount),
        };
      };

      expect(checkDisputeQuota(0)).toEqual({ allowed: true, remaining: 3 });
      expect(checkDisputeQuota(2)).toEqual({ allowed: true, remaining: 1 });
      expect(checkDisputeQuota(3)).toEqual({ allowed: false, remaining: 0 });
      expect(checkDisputeQuota(4)).toEqual({ allowed: false, remaining: 0 });
    });

    it('memastikan status transisi sanggah nilai valid', () => {
      type DisputeStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';

      const canWithdraw = (status: DisputeStatus) => {
        return status === 'submitted' || status === 'under_review';
      };

      expect(canWithdraw('submitted')).toBe(true);
      expect(canWithdraw('under_review')).toBe(true);
      expect(canWithdraw('accepted')).toBe(false);
      expect(canWithdraw('rejected')).toBe(false);
      expect(canWithdraw('withdrawn')).toBe(false);
    });
  });
});
