import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCurrentUser = vi.hoisted(() => ({
  value: {
    user: { id: 'sec00001-0000-0000-0000-000000000011', email: 'sekprodi@siajar.test' },
    profile: { full_name: 'Sekretaris Prodi Informatika, S.Kom., M.T.' },
    activeRole: 'PROGRAM_SECRETARY',
    roles: [{ code: 'PROGRAM_SECRETARY' }],
    isImpersonating: false,
  } as any,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser.value),
}));

vi.mock('@/lib/audit', () => ({
  recordSystemAuditLog: vi.fn(async () => {}),
}));

import { isRouteAllowedForRole, getMenuGroupsForRole } from '@/lib/config/menu-config';
import { decideGradeChangeAction } from '@/modules/academic/actions';
import { assignAdvisorAction, revokeAdvisorAction, getAdviseesListAction } from '@/modules/academic/advisory-actions';
import { getCoordinatorCohortRiskAction, getAllAtRiskStudentsAction } from '@/modules/early-warning/actions';
import { DEFAULT_LECTURER_ID, DEFAULT_STUDENT_ID, DEFAULT_PRODI_ID } from '@/lib/auth/class-access';

describe('Fase 3: Sekretaris Prodi (PROGRAM_SECRETARY)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser.value = {
      user: { id: 'sec00001-0000-0000-0000-000000000011', email: 'sekprodi@siajar.test' },
      profile: { full_name: 'Sekretaris Prodi Informatika, S.Kom., M.T.' },
      activeRole: 'PROGRAM_SECRETARY',
      roles: [{ code: 'PROGRAM_SECRETARY' }],
      isImpersonating: false,
    };
  });

  it('1. Seluruh 13 menu navigasi PROGRAM_SECRETARY diizinkan oleh isRouteAllowedForRole', () => {
    const groups = getMenuGroupsForRole('PROGRAM_SECRETARY');
    expect(groups.length).toBeGreaterThanOrEqual(2);

    const allItems = groups.flatMap((g) => g.items);
    expect(allItems.length).toBe(13);

    for (const item of allItems) {
      const allowed = isRouteAllowedForRole(item.href, 'PROGRAM_SECRETARY');
      expect(allowed, `Rute ${item.href} harus diizinkan untuk PROGRAM_SECRETARY`).toBe(true);
    }
  });

  it('2. PROGRAM_SECRETARY ditolak dari rute Koordinator (/coordinator/**) dan Audit Log Admin (/admin/system/audit)', () => {
    expect(isRouteAllowedForRole('/coordinator', 'PROGRAM_SECRETARY')).toBe(false);
    expect(isRouteAllowedForRole('/coordinator/approvals', 'PROGRAM_SECRETARY')).toBe(false);
    expect(isRouteAllowedForRole('/coordinator/monitoring', 'PROGRAM_SECRETARY')).toBe(false);
    expect(isRouteAllowedForRole('/admin/system/audit', 'PROGRAM_SECRETARY')).toBe(false);
    expect(isRouteAllowedForRole('/admin', 'PROGRAM_SECRETARY')).toBe(false);
  });

  it('3. Peran lain (STUDENT, LECTURER, LAB_HEAD) ditolak dari portal /secretary/**', () => {
    expect(isRouteAllowedForRole('/secretary', 'STUDENT')).toBe(false);
    expect(isRouteAllowedForRole('/secretary/monitoring', 'STUDENT')).toBe(false);
    expect(isRouteAllowedForRole('/secretary', 'LECTURER')).toBe(false);
    expect(isRouteAllowedForRole('/secretary/advisory', 'LECTURER')).toBe(false);
    expect(isRouteAllowedForRole('/secretary', 'LAB_HEAD')).toBe(false);
  });

  it('4. PROGRAM_SECRETARY berwenang menetapkan dan mencabut Dosen Wali (Fase 2 & Fase 3)', async () => {
    const resAssign = await assignAdvisorAction({
      student_id: DEFAULT_STUDENT_ID,
      advisor_id: DEFAULT_LECTURER_ID,
      program_id: DEFAULT_PRODI_ID,
      angkatan: 2024,
    });
    expect(resAssign.ok).toBe(true);

    const advisees = await getAdviseesListAction();
    expect(advisees.length).toBeGreaterThan(0);

    const resRevoke = await revokeAdvisorAction({ student_id: DEFAULT_STUDENT_ID });
    expect(resRevoke.ok).toBe(true);
  });

  it('5. BATASAN TEGAS: Percobaan memutuskan perubahan nilai (decideGradeChangeAction) DITOLAK di tingkat server', async () => {
    const res = await decideGradeChangeAction({
      request_id: 'cr-fake-123',
      approve: true,
      note: 'Catatan persetujuan dari Sekprodi yang seharusnya ditolak server',
    });

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/FORBIDDEN|Dilarang|tidak memiliki wewenang|tidak tersedia untuk peran/i);
  });

  it('6. PROGRAM_SECRETARY berwenang memantau risiko mahasiswa dan rekapitulasi angkatan', async () => {
    const cohortRisk = await getCoordinatorCohortRiskAction();
    expect(cohortRisk).toBeDefined();
    expect(Array.isArray(cohortRisk.cohorts)).toBe(true);

    const atRiskStudents = await getAllAtRiskStudentsAction();
    expect(Array.isArray(atRiskStudents)).toBe(true);
  });
});
