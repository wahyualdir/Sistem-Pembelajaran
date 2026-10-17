// Helper dan Kalkulasi Penalti Keterlambatan Tugas SIAJAR
// Mengacu pada Dokumen Instruksi Antigravity Versi 2 (Bagian 9.1)
// Fungsi ini bersifat murni (pure) dan identik secara matematis dengan fungsi SQL calc_late_penalty.

export type LatePolicyType = 'none' | 'per_day' | 'per_hour' | 'flat';

export interface LatePenaltyParams {
  lateMinutes: number;
  latePolicy: LatePolicyType;
  latePenaltyValue: number; // persen
  latePenaltyCap: number;   // persen maksimal (bawaan 100)
}

export interface EffectiveDueDateParams {
  dueAt: string | Date;
  closeAt?: string | Date | null;
  extensionNewDueAt?: string | Date | null;
  extensionNewCloseAt?: string | Date | null;
}

/**
 * Menghitung persentase penalti keterlambatan berdasarkan kebijakan tugas.
 * @returns Persentase penalti (0 s.d. latePenaltyCap)
 */
export function calcLatePenalty(params: LatePenaltyParams): number {
  const { lateMinutes, latePolicy, latePenaltyValue, latePenaltyCap = 100 } = params;

  if (lateMinutes <= 0 || latePolicy === 'none' || latePenaltyValue <= 0) {
    return 0;
  }

  let units = 0;
  if (latePolicy === 'per_day') {
    units = Math.ceil(lateMinutes / 1440);
  } else if (latePolicy === 'per_hour') {
    units = Math.ceil(lateMinutes / 60);
  } else if (latePolicy === 'flat') {
    units = 1;
  } else {
    return 0;
  }

  const rawPenalty = units * latePenaltyValue;
  return Math.min(Math.max(0, latePenaltyCap), Math.max(0, rawPenalty));
}

/**
 * Menghitung selisih menit keterlambatan terhadap tenggat efektif.
 * Dibulatkan ke atas (ceil). Jika tepat waktu atau lebih awal, menghasilkan 0.
 */
export function calcLateMinutes(submittedAt: string | Date, effectiveDueAt: string | Date): number {
  const subTime = new Date(submittedAt).getTime();
  const dueTime = new Date(effectiveDueAt).getTime();
  const diffMs = subTime - dueTime;

  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / (60 * 1000));
}

/**
 * Menghitung tenggat efektif dan batas penutupan efektif dengan memperhitungkan perpanjangan.
 */
export function getEffectiveDates(params: EffectiveDueDateParams): {
  effectiveDueAt: Date;
  effectiveCloseAt: Date | null;
} {
  const baseDue = new Date(params.dueAt);
  const effectiveDueAt = params.extensionNewDueAt ? new Date(params.extensionNewDueAt) : baseDue;

  let effectiveCloseAt: Date | null = null;
  if (params.extensionNewCloseAt) {
    effectiveCloseAt = new Date(params.extensionNewCloseAt);
  } else if (params.closeAt) {
    effectiveCloseAt = new Date(params.closeAt);
  }

  return { effectiveDueAt, effectiveCloseAt };
}

/**
 * Memeriksa apakah pengumpulan ditolak karena melewati batas penutupan keras (close_at efektif).
 */
export function isSubmissionClosed(submittedAt: string | Date, effectiveCloseAt: Date | null): boolean {
  if (!effectiveCloseAt) return false;
  return new Date(submittedAt).getTime() > effectiveCloseAt.getTime();
}

/**
 * Menghitung nilai akhir setelah pemotongan penalti keterlambatan.
 * Jika penaltyWaived = true, skor mentah diberikan utuh.
 */
export function calcFinalAssignmentScore(
  rawScore: number,
  penaltyPercent: number,
  penaltyWaived: boolean = false
): number {
  if (penaltyWaived || penaltyPercent <= 0) {
    return Math.round(rawScore * 100) / 100;
  }

  const deduction = rawScore * (penaltyPercent / 100);
  const finalScore = Math.max(0, rawScore - deduction);
  return Math.round(finalScore * 100) / 100;
}
