export type RiskLevel = 'AMAN' | 'PERHATIAN' | 'RISIKO_TINGGI';

export type RiskCategory = 'KEHADIRAN' | 'TREN_NILAI' | 'TUGAS' | 'AKTIVITAS_BELAJAR';

export interface RiskIndicator {
  category: RiskCategory;
  severity: 'PERHATIAN' | 'RISIKO_TINGGI';
  label: string;
  reason: string;
  currentValue: number | string;
  threshold: number | string;
}

export interface StudentRiskEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  studentNim: string;
  classId: string;
  classTitle: string;
  angkatan: number;
  riskLevel: RiskLevel;
  previousRiskLevel?: RiskLevel;
  score: number; // 0-100 (100 = paling aman, 0 = risiko paling tinggi)
  indicators: RiskIndicator[];
  recommendations: string[];
  calculatedAt: string;
}

export interface EarlyWarningPolicy {
  minAttendancePercent: number; // Default: 75%
  warningAttendancePercent: number; // Default: 80% (ambang perhatian)
  maxMissingAssignmentsWarning: number; // Default: 1 (1 tugas belum submit = perhatian)
  maxMissingAssignmentsHighRisk: number; // Default: 3 (>= 3 tugas = risiko tinggi)
  gradeDropThresholdPoints: number; // Default: 15 (penurunan nilai >= 15 poin = perhatian)
  minMaterialProgressPercent: number; // Default: 50%
  updatedAt: string;
}

export interface CohortRiskSummary {
  angkatan: number;
  totalStudents: number;
  amanCount: number;
  perhatianCount: number;
  risikoTinggiCount: number;
  commonIssues: { issue: string; count: number }[];
}

export interface DailyRiskRunResult {
  evaluatedCount: number;
  escalatedCount: number;
  notificationsSent: number;
  skippedDuplicates: number;
  calculatedAt: string;
}
