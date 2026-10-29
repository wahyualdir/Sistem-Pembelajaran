import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCurrentUser = vi.hoisted(() => ({
  value: {
    user: { id: 'a0000012-0000-0000-0000-000000000012', email: 'kalab@siajar.test' },
    profile: { full_name: 'Ir. Hendra Wijaya, M.T.' },
    activeRole: 'LAB_HEAD',
    roles: [{ code: 'LAB_HEAD' }, { code: 'LECTURER' }],
    isImpersonating: false,
  } as any,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/supabase/status', () => ({
  checkSupabaseOnline: vi.fn(async () => false),
}));

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser.value),
}));

vi.mock('@/lib/audit', () => ({
  recordSystemAuditLog: vi.fn(async () => {}),
}));

import { isRouteAllowedForRole, getMenuGroupsForRole } from '@/lib/config/menu-config';
import { setAssistantAction } from '@/modules/academic/actions';
import { getAcademicStore } from '@/lib/auth/class-access';

describe('Fase 4: Kepala Laboratorium (LAB_HEAD) & Reformasi Wewenang Asisten Lab', () => {
  const targetClassId = 'c0000000-0000-0000-0000-000000000001';
  const otherClassId = 'c0000000-0000-0000-0000-000000000099';
  const targetAssistantId = '2024002'; // Citra Asisten

  beforeEach(() => {
    vi.clearAllMocks();

    const mem = getAcademicStore();
    const existing = mem.classes.find((c) => c.id === targetClassId);
    if (!existing) {
      mem.classes.push({
        id: targetClassId,
        title: 'Pemrograman Berorientasi Objek',
        section: 'IF-3A (Praktikum)',
        join_code: 'PBO3A',
        status: 'ACTIVE',
        created_by: 'a0000002-0000-0000-0000-000000000002', // Dosen Budi
      });
    } else {
      existing.created_by = 'a0000002-0000-0000-0000-000000000002';
    }

    // Hubungkan class ke Lab RPL
    const g = globalThis as any;
    g.__siajarClassLaboratories = [
      { class_id: targetClassId, laboratory_id: 'lab-rpl-id' },
    ];
    g.__siajarUserLabMap = {
      'a0000012-0000-0000-0000-000000000012': 'lab-rpl-id',
    };

    // Default: Kepala Lab
    mockCurrentUser.value = {
      user: { id: 'a0000012-0000-0000-0000-000000000012', email: 'kalab@siajar.test' },
      profile: { full_name: 'Ir. Hendra Wijaya, M.T.' },
      activeRole: 'LAB_HEAD',
      roles: [{ code: 'LAB_HEAD' }, { code: 'LECTURER' }],
      isImpersonating: false,
    };
  });

  it('1. Seluruh 12 menu navigasi LAB_HEAD diizinkan oleh isRouteAllowedForRole', () => {
    const groups = getMenuGroupsForRole('LAB_HEAD');
    expect(groups.length).toBeGreaterThanOrEqual(2);

    const allItems = groups.flatMap((g) => g.items);
    expect(allItems.length).toBe(12);

    for (const item of allItems) {
      const allowed = isRouteAllowedForRole(item.href, 'LAB_HEAD');
      expect(allowed, `Rute ${item.href} harus diizinkan untuk LAB_HEAD`).toBe(true);
    }
  });

  it('2. LAB_HEAD ditolak dari rute Koordinator, Sekprodi, dan Admin', () => {
    expect(isRouteAllowedForRole('/coordinator', 'LAB_HEAD')).toBe(false);
    expect(isRouteAllowedForRole('/secretary', 'LAB_HEAD')).toBe(false);
    expect(isRouteAllowedForRole('/admin', 'LAB_HEAD')).toBe(false);
    expect(isRouteAllowedForRole('/admin/system/audit', 'LAB_HEAD')).toBe(false);
  });

  it('3. Peran lain (STUDENT, LECTURER, PROGRAM_SECRETARY) ditolak dari portal /lab/**', () => {
    expect(isRouteAllowedForRole('/lab', 'STUDENT')).toBe(false);
    expect(isRouteAllowedForRole('/lab/assistants', 'STUDENT')).toBe(false);
    expect(isRouteAllowedForRole('/lab', 'LECTURER')).toBe(false);
    expect(isRouteAllowedForRole('/lab/classes', 'LECTURER')).toBe(false);
    expect(isRouteAllowedForRole('/lab', 'PROGRAM_SECRETARY')).toBe(false);
  });

  it('4. Kepala Lab BERWENANG menugaskan ASISTEN_LAB pada kelas praktikum laboratoriumnya', async () => {
    const res = await setAssistantAction({
      class_id: targetClassId,
      identifier: targetAssistantId,
      permissions: ['submission.review', 'assignment.grade'],
      assistant_type: 'ASISTEN_LAB',
    });

    expect(res.ok).toBe(true);
  });

  it('5. Kepala Lab DITOLAK saat menugaskan ASISTEN_LAB pada kelas praktikum di luar laboratoriumnya', async () => {
    const res = await setAssistantAction({
      class_id: otherClassId,
      identifier: targetAssistantId,
      permissions: ['submission.review'],
      assistant_type: 'ASISTEN_LAB',
    });

    expect(res.ok).toBe(false);
  });

  it('6. REFORMASI WEWENANG: Staf Akademik & Super Admin DITOLAK saat menugaskan ASISTEN_LAB', async () => {
    // Sebagai ACADEMIC_STAFF
    mockCurrentUser.value = {
      user: { id: 'staff-01', email: 'staff@siajar.test' },
      profile: { full_name: 'Staf Akademik' },
      activeRole: 'ACADEMIC_STAFF',
      roles: [{ code: 'ACADEMIC_STAFF' }],
      isImpersonating: false,
    };

    const resStaff = await setAssistantAction({
      class_id: targetClassId,
      identifier: targetAssistantId,
      permissions: ['submission.review'],
      assistant_type: 'ASISTEN_LAB',
    });

    expect(resStaff.ok).toBe(false);
    expect(resStaff.error).toContain('hanya dapat ditugaskan oleh Dosen Pengampu atau Kepala Lab');

    // Sebagai SUPER_ADMIN
    mockCurrentUser.value = {
      user: { id: 'admin-01', email: 'admin@siajar.test' },
      profile: { full_name: 'Super Admin' },
      activeRole: 'SUPER_ADMIN',
      roles: [{ code: 'SUPER_ADMIN' }],
      isImpersonating: false,
    };

    const resAdmin = await setAssistantAction({
      class_id: targetClassId,
      identifier: targetAssistantId,
      permissions: ['submission.review'],
      assistant_type: 'ASISTEN_LAB',
    });

    expect(resAdmin.ok).toBe(false);
    expect(resAdmin.error).toContain('hanya dapat ditugaskan oleh Dosen Pengampu atau Kepala Lab');
  });

  it('7. Dosen Pengampu kelas tetap berwenang menugaskan ASISTEN_LAB dan ASISTEN_DOSEN', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
      isImpersonating: false,
    };

    const resLab = await setAssistantAction({
      class_id: targetClassId,
      identifier: targetAssistantId,
      permissions: ['submission.review'],
      assistant_type: 'ASISTEN_LAB',
    });
    expect(resLab.ok).toBe(true);

    const resDosen = await setAssistantAction({
      class_id: targetClassId,
      identifier: targetAssistantId,
      permissions: ['submission.review'],
      assistant_type: 'ASISTEN_DOSEN',
    });
    expect(resDosen.ok).toBe(true);
  });
});
