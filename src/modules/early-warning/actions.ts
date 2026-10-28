'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { recordSystemAuditLog } from '@/lib/audit';
import {
  assertClassOwner,
  canViewStudent,
  ClassAccessError,
} from '@/lib/auth/class-access';
import {
  getEarlyWarningPolicy,
  updateEarlyWarningPolicy,
} from './policies';
import {
  runDailyRiskEvaluation,
  getStudentEvaluations,
  getClassRiskEvaluations,
  getMentoringAdviseesRisk,
  getCohortRiskSummaries,
} from './evaluator';
import type {
  EarlyWarningPolicy,
  StudentRiskEvaluation,
  DailyRiskRunResult,
} from './types';

function safeRevalidate(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
  } catch {
    // Abaikan di luar request Next.js (seperti unit test)
  }
}

/**
 * Server Action: Mengambil Status Akademik & Evaluasi Risiko Mahasiswa
 * Memakai canViewStudent: Mahasiswa hanya dirinya sendiri, Dosen hanya mahasiswa kelas/bimbingannya, Kaprodi prodinya. Tolak SYSTEM_ADMIN.
 */
export async function getStudentAcademicStatusAction(
  targetStudentId?: string
): Promise<StudentRiskEvaluation[]> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user || userContext.activeRole === 'SYSTEM_ADMIN') return [];

  const myId = userContext.user.id;
  const studentId = targetStudentId || myId;

  const allowed = await canViewStudent(userContext, studentId);
  if (!allowed) return [];

  return getStudentEvaluations(studentId);
}

/**
 * Server Action: Mengambil daftar mahasiswa berisiko untuk kelas tertentu
 * Memakai assertClassOwner: Hanya dosen pengampu kelas tersebut yang berwenang.
 */
export async function getClassRiskSummaryAction(
  classId: string
): Promise<StudentRiskEvaluation[]> {
  try {
    await assertClassOwner(classId);
  } catch (err) {
    if (err instanceof ClassAccessError) {
      return [];
    }
    return [];
  }

  return getClassRiskEvaluations(classId);
}

/**
 * Server Action: Mengambil daftar mahasiswa bimbingan Dosen Wali
 */
export async function getMentoringRiskListAction(): Promise<StudentRiskEvaluation[]> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user || userContext.activeRole === 'SYSTEM_ADMIN' || userContext.activeRole === 'STUDENT') return [];

  return getMentoringAdviseesRisk(userContext.user.id);
}

/**
 * Server Action: Mengambil rekapitulasi risiko mahasiswa per angkatan untuk Kaprodi
 * Tolak SYSTEM_ADMIN.
 */
export async function getCoordinatorCohortRiskAction(): Promise<{
  cohorts: Array<{
    angkatan: number;
    total: number;
    aman: number;
    perhatian: number;
    risikoTinggi: number;
  }>;
  totalAtRisk: number;
}> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user || userContext.activeRole === 'SYSTEM_ADMIN') {
    return { cohorts: [], totalAtRisk: 0 };
  }

  const role = userContext.activeRole;
  const isAuthorized =
    role === 'PROGRAM_COORDINATOR' ||
    role === 'ACADEMIC_STAFF' ||
    role === 'SUPER_ADMIN';

  if (!isAuthorized) {
    return { cohorts: [], totalAtRisk: 0 };
  }

  return getCohortRiskSummaries();
}

/**
 * Server Action: Mengambil konfigurasi ambang batas kebijakan saat ini
 */
export async function getEarlyWarningPolicyAction(): Promise<EarlyWarningPolicy> {
  return getEarlyWarningPolicy();
}

/**
 * Server Action: Memperbarui ambang batas kebijakan (HANYA SUPER_ADMIN)
 * Dicatat ke audit trail forensik sistem
 */
export async function updateEarlyWarningPolicyAction(
  updates: Partial<EarlyWarningPolicy>
): Promise<ActionResponse<EarlyWarningPolicy>> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' };
  }

  const role = userContext.activeRole;
  if (role !== 'SUPER_ADMIN' && role !== 'SUPERADMIN') {
    return {
      ok: false,
      error: 'Hanya Super Admin yang berwenang mengubah ambang batas kebijakan universitas.',
    };
  }

  try {
    const updated = await updateEarlyWarningPolicy(updates);

    // Rekam ke Log Audit
    await recordSystemAuditLog({
      actorId: userContext.user.id,
      actorName: 'Super Admin',
      actorRole: userContext.activeRole,
      action: 'policy.update_early_warning',
      entityType: 'system_settings',
      entityId: 'early_warning.policy',
      description: 'Memperbarui ambang batas kebijakan peringatan dini mahasiswa berisiko',
      valueBefore: null,
      valueAfter: JSON.stringify(updated),
    });

    safeRevalidate('/admin/policies');
    return { ok: true, data: updated };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Gagal memperbarui ambang batas kebijakan peringatan dini.',
    };
  }
}

/**
 * Server Action: Memicu eksekusi kalkulasi risiko harian (Batch Job / Scheduler)
 * Hanya diizinkan untuk SUPER_ADMIN dan SYSTEM_ADMIN
 */
export async function triggerDailyRiskCalculationAction(): Promise<ActionResponse<DailyRiskRunResult>> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' };
  }

  const role = userContext.activeRole;
  if (role !== 'SUPER_ADMIN' && role !== 'SYSTEM_ADMIN') {
    return {
      ok: false,
      error: 'FORBIDDEN: Hanya SUPER_ADMIN dan SYSTEM_ADMIN yang berwenang memicu kalkulasi risiko harian.',
    };
  }

  try {
    const result = await runDailyRiskEvaluation();
    safeRevalidate('/student');
    safeRevalidate('/coordinator');
    safeRevalidate('/lecturer/mentoring');
    safeRevalidate('/notifications');
    return { ok: true, data: result };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Gagal menjalankan evaluasi risiko harian.',
    };
  }
}


/**
 * Server Action: Mengambil seluruh daftar mahasiswa berisiko untuk halaman Kaprodi
 */
export async function getAllAtRiskStudentsAction(): Promise<StudentRiskEvaluation[]> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user || userContext.activeRole === 'SYSTEM_ADMIN') {
    return [];
  }

  const role = userContext.activeRole;
  const isAuthorized =
    role === 'PROGRAM_COORDINATOR' ||
    role === 'ACADEMIC_STAFF' ||
    role === 'SUPER_ADMIN';

  if (!isAuthorized) {
    return [];
  }

  const { getAllAtRiskEvaluations } = await import('./evaluator');
  return getAllAtRiskEvaluations();
}
