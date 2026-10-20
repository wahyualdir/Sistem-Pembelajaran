import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCurrentUser = vi.hoisted(() => ({
  value: {
    user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
    profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
    activeRole: 'LECTURER',
    roles: [{ code: 'LECTURER' }],
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

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    rpc: vi.fn(async () => ({ data: null, error: null })),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

import {
  setAssistantAction,
  getClassDetailAction,
  listClassMembersAction,
} from '@/modules/academic/actions';

describe('Manajemen Asisten Dosen & Asisten Lab (Dual Category & Delegation)', () => {
  const classId = 'c0000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    // Reset to lecturer
    mockCurrentUser.value = {
      user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
      isImpersonating: false,
    };
  });

  it('1. Dosen Pengampu dapat menugaskan Asisten Dosen secara langsung', async () => {
    const res = await setAssistantAction({
      class_id: classId,
      identifier: '2024002',
      permissions: ['submission.review', 'assignment.create'],
      assistant_type: 'ASISTEN_DOSEN',
    });
    expect(res.ok).toBe(true);

    const members = await listClassMembersAction(classId);
    expect(members.ok).toBe(true);
    const asdos = members.data?.assistants.find((a) => a.nim === '2024002' || a.name === 'Citra Asisten');
    expect(asdos).toBeDefined();
    expect(asdos?.assistant_type).toBe('ASISTEN_DOSEN');
  });

  it('2. Dosen Pengampu dapat menugaskan Asisten Lab secara langsung', async () => {
    const res = await setAssistantAction({
      class_id: classId,
      identifier: '2024002',
      permissions: ['submission.review'],
      assistant_type: 'ASISTEN_LAB',
    });
    expect(res.ok).toBe(true);

    const members = await listClassMembersAction(classId);
    expect(members.ok).toBe(true);
    const aslab = members.data?.assistants.find((a) => a.nim === '2024002');
    expect(aslab).toBeDefined();
    expect(aslab?.assistant_type).toBe('ASISTEN_LAB');
  });

  it('3. Staf Akademik (ACADEMIC_STAFF) berwenang menugaskan Asisten Lab', async () => {
    mockCurrentUser.value = {
      user: { id: 'staff-001', email: 'staf.akademik@siajar.test' },
      profile: { full_name: 'Staf Akademik BAA' },
      activeRole: 'ACADEMIC_STAFF',
      roles: [{ code: 'ACADEMIC_STAFF' }],
      isImpersonating: false,
    };

    const res = await setAssistantAction({
      class_id: classId,
      identifier: '2024002',
      permissions: ['submission.review', 'material.manage'],
      assistant_type: 'ASISTEN_LAB',
    });
    expect(res.ok).toBe(true);
  });

  it('4. Staf Akademik (ACADEMIC_STAFF) DITOLAK saat mencoba menugaskan Asisten Dosen', async () => {
    mockCurrentUser.value = {
      user: { id: 'staff-001', email: 'staf.akademik@siajar.test' },
      profile: { full_name: 'Staf Akademik BAA' },
      activeRole: 'ACADEMIC_STAFF',
      roles: [{ code: 'ACADEMIC_STAFF' }],
      isImpersonating: false,
    };

    const res = await setAssistantAction({
      class_id: classId,
      identifier: '2024002',
      permissions: ['submission.review'],
      assistant_type: 'ASISTEN_DOSEN',
    });
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Penugasan Asisten Dosen hanya dapat dilakukan langsung oleh Dosen Pengampu.');
  });

  it('5. Mahasiswa (STUDENT) ditolak untuk semua penugasan asisten', async () => {
    mockCurrentUser.value = {
      user: { id: 'mhs-1', email: 'ahmad@siajar.test' },
      profile: { full_name: 'Ahmad Mahasiswa' },
      activeRole: 'STUDENT',
      roles: [{ code: 'STUDENT' }],
      isImpersonating: false,
    };

    const res = await setAssistantAction({
      class_id: classId,
      identifier: '2024002',
      permissions: ['submission.review'],
      assistant_type: 'ASISTEN_LAB',
    });
    expect(res.ok).toBe(false);
  });

  it('6. getClassDetailAction mengembalikan rincian asisten lengkap dengan tipe asisten', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
      isImpersonating: false,
    };

    // Pastikan ada asisten lab
    await setAssistantAction({
      class_id: classId,
      identifier: '2024002',
      permissions: ['submission.review'],
      assistant_type: 'ASISTEN_LAB',
    });

    const detail = await getClassDetailAction(classId);
    expect(detail).not.toBeNull();
    expect(detail?.assistants).toBeDefined();
    expect(detail?.assistants?.length).toBeGreaterThan(0);
    const labItem = detail?.assistants?.find((a) => a.nim === '2024002');
    expect(labItem?.assistant_type).toBe('ASISTEN_LAB');
  });

  it('7. Pencabutan asisten dengan permissions kosong berhasil', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
      isImpersonating: false,
    };

    // Cabut penugasan
    const res = await setAssistantAction({
      class_id: classId,
      identifier: '2024002',
      permissions: [],
      assistant_type: 'ASISTEN_LAB',
    });
    expect(res.ok).toBe(true);

    const members = await listClassMembersAction(classId);
    expect(members.ok).toBe(true);
    const revoked = members.data?.assistants.find((a) => a.nim === '2024002');
    expect(revoked).toBeUndefined();
  });
});
