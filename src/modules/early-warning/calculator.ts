import type {
  RiskLevel,
  RiskIndicator,
  StudentRiskEvaluation,
  EarlyWarningPolicy,
} from './types';

interface EvaluationContext {
  studentId: string;
  studentName: string;
  studentNim: string;
  angkatan: number;
  classId: string;
  classTitle: string;
  totalSessions: number;
  attendedSessions: number;
  assignments: Array<{ id: string; title: string; due_at: string }>;
  submissions: Array<{ assignment_id: string; is_late: boolean; score?: number | null }>;
  materialsCount: number;
  materialsCompleted: number;
}

export function evaluateStudentRisk(
  ctx: EvaluationContext,
  policy: EarlyWarningPolicy
): StudentRiskEvaluation {
  const indicators: RiskIndicator[] = [];
  const recommendations: string[] = [];
  const now = Date.now();

  let riskScore = 100; // Mulai dari 100 poin (Aman)

  // -------------------------------------------------------------
  // 1. INDIKATOR KEHADIRAN PERKULIAHAN
  // -------------------------------------------------------------
  const attPercent =
    ctx.totalSessions > 0
      ? Math.round((ctx.attendedSessions / ctx.totalSessions) * 100)
      : 100;

  if (ctx.totalSessions > 0) {
    if (attPercent < policy.minAttendancePercent) {
      riskScore -= 35;
      indicators.push({
        category: 'KEHADIRAN',
        severity: 'RISIKO_TINGGI',
        label: 'Kehadiran di Bawah Batas Syarat Ujian',
        reason: `Kehadiran ${attPercent}%, batas minimal kelayakan ujian ${policy.minAttendancePercent}%`,
        currentValue: `${attPercent}%`,
        threshold: `${policy.minAttendancePercent}%`,
      });
      recommendations.push(
        `Kehadiran Anda (${attPercent}%) berada di bawah syarat minimal ${policy.minAttendancePercent}%. Hadiri seluruh sesi tersisa agar tetap berhak mengikuti Ujian Akhir.`
      );
    } else if (attPercent <= policy.warningAttendancePercent) {
      riskScore -= 15;
      indicators.push({
        category: 'KEHADIRAN',
        severity: 'PERHATIAN',
        label: 'Kehadiran Mendekati Batas Kritis',
        reason: `Kehadiran ${attPercent}%, mendekati batas minimal ${policy.minAttendancePercent}%`,
        currentValue: `${attPercent}%`,
        threshold: `${policy.minAttendancePercent}%`,
      });
      recommendations.push(
        `Pertahankan presensi kehadiran pada sesi tatap muka berikutnya untuk menjaga margin kelayakan ujian.`
      );
    }
  }

  // -------------------------------------------------------------
  // 2. INDIKATOR TUGAS KULIAH (TERLAMBAT & BELUM DIKUMPULKAN)
  // -------------------------------------------------------------
  const pastAssignments = ctx.assignments.filter((a) => Date.parse(a.due_at) < now);
  const submittedAssnIds = new Set(ctx.submissions.map((s) => s.assignment_id));
  const missingAssignments = pastAssignments.filter((a) => !submittedAssnIds.has(a.id));
  const lateSubmissions = ctx.submissions.filter((s) => s.is_late);

  if (missingAssignments.length >= policy.maxMissingAssignmentsHighRisk) {
    riskScore -= 30;
    indicators.push({
      category: 'TUGAS',
      severity: 'RISIKO_TINGGI',
      label: 'Banyak Tugas Belum Dikumpulkan',
      reason: `${missingAssignments.length} tugas belum dikumpulkan (melebihi batas toleransi ${policy.maxMissingAssignmentsWarning})`,
      currentValue: missingAssignments.length,
      threshold: policy.maxMissingAssignmentsWarning,
    });
    recommendations.push(
      `Ada ${missingAssignments.length} tugas yang belum dikumpulkan. Segera selesaikan dan koordinasikan dengan dosen pengampu.`
    );
  } else if (
    missingAssignments.length >= policy.maxMissingAssignmentsWarning ||
    lateSubmissions.length >= 2
  ) {
    riskScore -= 15;
    const isMissing = missingAssignments.length >= policy.maxMissingAssignmentsWarning;
    indicators.push({
      category: 'TUGAS',
      severity: 'PERHATIAN',
      label: isMissing ? 'Tugas Tertunda' : 'Sering Mengumpulkan Terlambat',
      reason: isMissing
        ? `${missingAssignments.length} tugas belum dikumpulkan`
        : `${lateSubmissions.length} tugas dikumpulkan melewati tenggat`,
      currentValue: isMissing ? missingAssignments.length : lateSubmissions.length,
      threshold: policy.maxMissingAssignmentsWarning,
    });
    recommendations.push(
      `Periksa jadwal tenggat tugas kuliah dan kumpulkan sebelum waktu batas sistem ditutup.`
    );
  }

  // -------------------------------------------------------------
  // 3. INDIKATOR TREN NILAI (PENURUNAN NILAI)
  // -------------------------------------------------------------
  const gradedItems = ctx.submissions
    .filter((s) => typeof s.score === 'number' && s.score !== null)
    .map((s) => s.score as number);

  if (gradedItems.length >= 2) {
    const latestScore = gradedItems[gradedItems.length - 1];
    const previousAvg =
      gradedItems.slice(0, -1).reduce((acc, curr) => acc + curr, 0) / (gradedItems.length - 1);

    const diffDrop = Math.round(previousAvg - latestScore);
    if (diffDrop >= policy.gradeDropThresholdPoints) {
      riskScore -= 20;
      indicators.push({
        category: 'TREN_NILAI',
        severity: 'PERHATIAN',
        label: 'Tren Nilai Mengalami Penurunan',
        reason: `Nilai evaluasi terbaru (${latestScore}) turun ${diffDrop} poin dibanding rata-rata sebelumnya (${Math.round(previousAvg)})`,
        currentValue: latestScore,
        threshold: Math.round(previousAvg - policy.gradeDropThresholdPoints),
      });
      recommendations.push(
        `Terjadi penurunan nilai pada tugas/kuis terbaru. Tinjau kembali materi yang belum dikuasai atau diskusikan pada forum kelas.`
      );
    }
  }

  // -------------------------------------------------------------
  // 4. INDIKATOR AKTIVITAS BELAJAR (PROGRES MATERI)
  // -------------------------------------------------------------
  if (ctx.materialsCount > 0) {
    const matPercent = Math.round((ctx.materialsCompleted / ctx.materialsCount) * 100);
    if (matPercent < policy.minMaterialProgressPercent) {
      riskScore -= 10;
      indicators.push({
        category: 'AKTIVITAS_BELAJAR',
        severity: 'PERHATIAN',
        label: 'Aktivitas Membaca Materi Rendah',
        reason: `Progres materi baru ${matPercent}%, batas anjuran minimal ${policy.minMaterialProgressPercent}%`,
        currentValue: `${matPercent}%`,
        threshold: `${policy.minMaterialProgressPercent}%`,
      });
      recommendations.push(
        `Akses modul dan materi perkuliahan secara berkala untuk memperkuat pemahaman konsep.`
      );
    }
  }

  // -------------------------------------------------------------
  // PENENTUAN TINGKAT RISIKO AKHIR
  // -------------------------------------------------------------
  let riskLevel: RiskLevel = 'AMAN';

  const hasHighRisk = indicators.some((i) => i.severity === 'RISIKO_TINGGI');
  const warningCount = indicators.filter((i) => i.severity === 'PERHATIAN').length;

  if (hasHighRisk || warningCount >= 2 || riskScore < 60) {
    riskLevel = 'RISIKO_TINGGI';
  } else if (warningCount >= 1 || riskScore < 85) {
    riskLevel = 'PERHATIAN';
  } else {
    riskLevel = 'AMAN';
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Performa akademik Anda sangat baik. Pertahankan kedisiplinan kehadiran dan pengumpulan tugas!'
    );
  }

  return {
    id: `${ctx.studentId}:${ctx.classId}`,
    studentId: ctx.studentId,
    studentName: ctx.studentName,
    studentNim: ctx.studentNim,
    classId: ctx.classId,
    classTitle: ctx.classTitle,
    angkatan: ctx.angkatan,
    riskLevel,
    score: Math.max(0, Math.min(100, riskScore)),
    indicators,
    recommendations,
    calculatedAt: new Date().toISOString(),
  };
}
