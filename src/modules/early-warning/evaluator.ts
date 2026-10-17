import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { notify } from '@/modules/notifications/service';
import {
  getAcademicStore,
  getAssignmentStore,
  getAttendanceStore,
  getMaterialStore,
  getMaterialProgressStore,
} from '@/lib/auth/class-access';
import { getEarlyWarningPolicy } from './policies';
import { evaluateStudentRisk } from './calculator';
import type {
  EarlyWarningPolicy,
  RiskLevel,
  StudentRiskEvaluation,
  DailyRiskRunResult,
} from './types';

export function getRiskRank(level: RiskLevel): number {
  switch (level) {
    case 'RISIKO_TINGGI':
      return 3;
    case 'PERHATIAN':
      return 2;
    case 'AMAN':
    default:
      return 1;
  }
}

/**
 * Penyimpanan Riwayat Evaluasi Risiko di Store Aplikasi (__siajarRiskEvaluations).
 * Kunci Map: `${studentId}:${classId}`
 */
function getEvaluationCache(): Map<string, StudentRiskEvaluation> {
  return ((globalThis as any).__siajarRiskEvaluations ??= new Map<string, StudentRiskEvaluation>());
}

/**
 * Menghitung evaluasi risiko untuk satu pendaftaran mahasiswa berdasarkan data riil dari store aplikasi.
 */
function computeStudentClassEvaluationFromStore(
  cls: { id: string; title: string; created_by?: string; lecturer_id?: string },
  enr: {
    class_id: string;
    student_id: string;
    student_name?: string;
    student_nim?: string;
    angkatan?: number;
    status?: string;
  },
  policy: EarlyWarningPolicy
): StudentRiskEvaluation {
  const tugasMem = getAssignmentStore();
  const presensiMem = getAttendanceStore();
  const materiMem = getMaterialStore();
  const materiProgresMem = getMaterialProgressStore();

  const classSessions = (presensiMem.sessions || []).filter((s: any) => s.class_id === cls.id);
  const classAssignments = (tugasMem.assignments || []).filter((a: any) => a.class_id === cls.id);
  const classMaterials = (materiMem || []).filter((m: any) => m.class_id === cls.id);

  const attendedSessions = (presensiMem.records || []).filter(
    (r: any) =>
      classSessions.some((s: any) => s.id === r.session_id) &&
      r.student_id === enr.student_id &&
      (r.status === 'HADIR' || r.status === 'TERLAMBAT')
  ).length;

  const studentSubs = (tugasMem.submissions || []).filter(
    (s: any) => s.student_id === enr.student_id
  );

  const completedMaterials = (materiProgresMem || []).filter(
    (mp: any) =>
      (mp.mahasiswa_id === enr.student_id || mp.student_id === enr.student_id) &&
      (mp.selesai ?? mp.completed ?? true) &&
      classMaterials.some((m: any) => m.id === (mp.materi_id || mp.material_id))
  ).length;

  const inferredAngkatan =
    typeof enr.angkatan === 'number'
      ? enr.angkatan
      : enr.student_nim && /^20\d{2}/.test(enr.student_nim)
        ? parseInt(enr.student_nim.slice(0, 4), 10)
        : 2024;

  return evaluateStudentRisk(
    {
      studentId: enr.student_id,
      studentName: enr.student_name || 'Mahasiswa',
      studentNim: enr.student_nim || '-',
      angkatan: inferredAngkatan,
      classId: cls.id,
      classTitle: cls.title,
      totalSessions: classSessions.length,
      attendedSessions,
      assignments: classAssignments,
      submissions: studentSubs,
      materialsCount: classMaterials.length,
      materialsCompleted: completedMaterials,
    },
    policy
  );
}

/**
 * Menyinkronkan evaluasi risiko dari data riil store aplikasi (__siajarAkademik, __siajarTugas,
 * __siajarPresensi, __siajarMateri, __siajarMateriProgres) tanpa memicu pengiriman notifikasi.
 */
function syncEvaluationsFromRealStore(policy: EarlyWarningPolicy): Map<string, StudentRiskEvaluation> {
  const cache = getEvaluationCache();
  const academicMem = getAcademicStore();

  for (const cls of academicMem.classes || []) {
    const classEnrollments = (academicMem.enrollments || []).filter(
      (e: any) => e.class_id === cls.id && (!e.status || e.status === 'ACTIVE')
    );

    for (const enr of classEnrollments) {
      const key = `${enr.student_id}:${cls.id}`;
      const existing = cache.get(key);
      if (!existing) {
        const computed = computeStudentClassEvaluationFromStore(cls, enr, policy);
        computed.previousRiskLevel = 'AMAN';
        cache.set(key, computed);
      }
    }
  }

  return cache;
}

/**
 * Menjalankan kalkulasi risiko harian (Batch Job / Scheduler) dari data riil store/DB aplikasi.
 * Hanya mengirim notifikasi JIKA tingkat risiko seorang mahasiswa naik (escalated).
 */
export async function runDailyRiskEvaluation(): Promise<DailyRiskRunResult> {
  const policy = await getEarlyWarningPolicy();
  const cache = getEvaluationCache();
  const academicMem = getAcademicStore();

  let evaluatedCount = 0;
  let escalatedCount = 0;
  let notificationsSent = 0;
  let skippedDuplicates = 0;

  const nowIso = new Date().toISOString();
  const online = await checkSupabaseOnline();

  // Iterasi seluruh kelas dan pendaftaran mahasiswa riil dari store aplikasi
  for (const cls of academicMem.classes || []) {
    const classEnrollments = (academicMem.enrollments || []).filter(
      (e: any) => e.class_id === cls.id && (!e.status || e.status === 'ACTIVE')
    );

    for (const enr of classEnrollments) {
      evaluatedCount++;
      const key = `${enr.student_id}:${cls.id}`;
      const prevEval = cache.get(key);

      // Hitung risiko terkini dari data riil
      const newEval = computeStudentClassEvaluationFromStore(cls, enr, policy);

      const prevRank = prevEval ? getRiskRank(prevEval.riskLevel) : 1;
      const newRank = getRiskRank(newEval.riskLevel);

      newEval.previousRiskLevel = prevEval?.riskLevel || 'AMAN';
      cache.set(key, newEval);

      if (online) {
        try {
          const supabase = await createClient();
          await supabase.from('student_risk_evaluations').upsert(
            {
              student_id: enr.student_id,
              class_id: cls.id,
              risk_level: newEval.riskLevel,
              previous_risk_level: newEval.previousRiskLevel,
              score: newEval.score,
              indicators: newEval.indicators,
              recommendations: newEval.recommendations,
              evaluated_at: newEval.calculatedAt,
            },
            { onConflict: 'student_id,class_id' }
          );
        } catch {
          // fallback ke cache aplikasi
        }
      }

      // -----------------------------------------------------------------
      // ATURAN NOTIFIKASI: Kirim HANYA jika tingkat risiko naik (escalated)
      // -----------------------------------------------------------------
      if (newRank > prevRank && newRank > 1) {
        escalatedCount++;

        const riskLabel = newEval.riskLevel === 'RISIKO_TINGGI' ? 'Risiko Tinggi' : 'Perhatian';
        const primaryReason = newEval.indicators.map((i) => i.reason).join('; ');

        // 1. Notifikasi ke Mahasiswa
        const resStudent = await notify({
          userId: enr.student_id,
          type: 'EARLY_WARNING',
          title: `[Status Akademik] Peringatan: Tingkat ${riskLabel} di Kelas ${cls.title}`,
          body: `Sistem mencatat peringatan akademik: ${primaryReason}. Saran: ${newEval.recommendations[0]}`,
          targetUrl: '/student',
          classId: cls.id,
          dedupKey: `${enr.student_id}:EARLY_WARNING:${cls.id}:${newEval.riskLevel}`,
        });

        if (resStudent.skippedDueToDedup) {
          skippedDuplicates++;
        } else if (resStudent.ok) {
          notificationsSent++;
        }

        // 2. Notifikasi ke Dosen Pengampu Kelas
        const lecturerId = cls.created_by || cls.lecturer_id;
        if (lecturerId) {
          const resLecturer = await notify({
            userId: lecturerId,
            type: 'EARLY_WARNING',
            title: `[Monitoring Kelas] Mahasiswa ${newEval.studentName} Memerlukan ${riskLabel}`,
            body: `Mahasiswa ${newEval.studentName} (${newEval.studentNim}) di kelas ${cls.title} teridentifikasi: ${primaryReason}.`,
            targetUrl: `/classes/${cls.id}?tab=peserta`,
            classId: cls.id,
            dedupKey: `${lecturerId}:EARLY_WARNING_LECTURER:${cls.id}:${enr.student_id}:${newEval.riskLevel}`,
          });

          if (!resLecturer.skippedDueToDedup && resLecturer.ok) {
            notificationsSent++;
          }
        }
      }
    }
  }

  return {
    evaluatedCount,
    escalatedCount,
    notificationsSent,
    skippedDuplicates,
    calculatedAt: nowIso,
  };
}

/**
 * Mengambil evaluasi risiko untuk seorang mahasiswa dari data riil store/DB aplikasi
 */
export async function getStudentEvaluations(studentId: string): Promise<StudentRiskEvaluation[]> {
  const policy = await getEarlyWarningPolicy();
  const cache = syncEvaluationsFromRealStore(policy);
  const list: StudentRiskEvaluation[] = [];

  for (const evalItem of cache.values()) {
    if (evalItem.studentId === studentId) {
      list.push(evalItem);
    }
  }

  return list;
}

/**
 * Mengambil daftar mahasiswa berisiko pada suatu kelas dari data riil store/DB aplikasi
 */
export async function getClassRiskEvaluations(classId: string): Promise<StudentRiskEvaluation[]> {
  const policy = await getEarlyWarningPolicy();
  const cache = syncEvaluationsFromRealStore(policy);
  const list: StudentRiskEvaluation[] = [];

  for (const evalItem of cache.values()) {
    if (evalItem.classId === classId) {
      list.push(evalItem);
    }
  }

  return list.sort((a, b) => getRiskRank(b.riskLevel) - getRiskRank(a.riskLevel));
}

/**
 * Mengambil daftar mahasiswa bimbingan akademik / kelas yang diampu untuk Dosen Wali / Pengampu
 */
export async function getMentoringAdviseesRisk(lecturerId: string): Promise<StudentRiskEvaluation[]> {
  if (!lecturerId) return [];

  const policy = await getEarlyWarningPolicy();
  const cache = syncEvaluationsFromRealStore(policy);

  const store = getAcademicStore();
  const ownedClassIds = new Set(
    (store.classes || [])
      .filter((c) => c.created_by === lecturerId || c.lecturer_id === lecturerId)
      .map((c) => c.id)
  );
  const adviseeStudentIds = new Set(
    (store.advisees || [])
      .filter((a) => a.lecturer_id === lecturerId)
      .map((a) => a.student_id)
  );

  return Array.from(cache.values())
    .filter(
      (item) =>
        ownedClassIds.has(item.classId) || adviseeStudentIds.has(item.studentId)
    )
    .sort((a, b) => getRiskRank(b.riskLevel) - getRiskRank(a.riskLevel));
}

/**
 * Mengambil rekapitulasi risiko per angkatan untuk Kaprodi dari data riil store/DB aplikasi
 */
export async function getCohortRiskSummaries(): Promise<{
  cohorts: Array<{
    angkatan: number;
    total: number;
    aman: number;
    perhatian: number;
    risikoTinggi: number;
  }>;
  totalAtRisk: number;
}> {
  const policy = await getEarlyWarningPolicy();
  const cache = syncEvaluationsFromRealStore(policy);
  const cohortsMap = new Map<number, { total: number; aman: number; perhatian: number; risikoTinggi: number }>();

  // Default cohorts: 2024, 2025, 2026
  cohortsMap.set(2024, { total: 0, aman: 0, perhatian: 0, risikoTinggi: 0 });
  cohortsMap.set(2025, { total: 0, aman: 0, perhatian: 0, risikoTinggi: 0 });
  cohortsMap.set(2026, { total: 0, aman: 0, perhatian: 0, risikoTinggi: 0 });

  let totalAtRisk = 0;

  for (const item of cache.values()) {
    const angkatan = item.angkatan || 2024;
    const current = cohortsMap.get(angkatan) || { total: 0, aman: 0, perhatian: 0, risikoTinggi: 0 };

    current.total++;
    if (item.riskLevel === 'AMAN') {
      current.aman++;
    } else if (item.riskLevel === 'PERHATIAN') {
      current.perhatian++;
      totalAtRisk++;
    } else if (item.riskLevel === 'RISIKO_TINGGI') {
      current.risikoTinggi++;
      totalAtRisk++;
    }

    cohortsMap.set(angkatan, current);
  }

  const cohorts = Array.from(cohortsMap.entries())
    .map(([angkatan, data]) => ({ angkatan, ...data }))
    .sort((a, b) => a.angkatan - b.angkatan);

  return { cohorts, totalAtRisk };
}
