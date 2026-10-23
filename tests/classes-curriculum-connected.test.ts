import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCurrentUser = vi.hoisted(() => ({
  value: {
    user: { id: 'a0000001-0000-0000-0000-000000000001', email: 'mhs2024001@siajar.test' },
    profile: { full_name: 'Ahmad Mahasiswa' },
    activeRole: 'STUDENT',
    roles: [{ code: 'STUDENT' }],
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

vi.mock('@/lib/supabase/status', () => ({
  checkSupabaseOnline: vi.fn(async () => false),
}));

import {
  listMyClassesAction,
  listMasterDataAction,
  getClassDetailAction,
  createClassAction,
  DEMO_CLASS_ID,
} from '@/modules/academic/actions';

describe('Integrasi Kelas Saya dengan Data Kurikulum & Jadwal UIR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Mahasiswa melihat daftar kelas yang sudah terhubung dengan data mata kuliah resmi', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000001-0000-0000-0000-000000000001', email: 'mhs2024001@siajar.test' },
      profile: { full_name: 'Ahmad Mahasiswa' },
      activeRole: 'STUDENT',
      roles: [{ code: 'STUDENT' }],
    };

    const myClasses = await listMyClassesAction();
    expect(myClasses.length).toBeGreaterThanOrEqual(3);

    // Pastikan properti kurikulum terisi lengkap
    const webClass = myClasses.find((c) => c.course_code === 'STI2544138' || c.id === DEMO_CLASS_ID);
    expect(webClass).toBeDefined();
    expect(webClass?.course_code).toBe('STI2544138');
    expect(webClass?.course_title).toBe('Pemrograman Web');
    expect(webClass?.sks).toBe(3);
    expect(webClass?.lecturer_name).toBeDefined();
    expect(webClass?.meta).toContain('STI2544138');
  });

  it('2. Dosen pengampu melihat kelas-kelas kurikulum yang diampunya', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
    };

    const lecturerClasses = await listMyClassesAction();
    expect(lecturerClasses.length).toBeGreaterThanOrEqual(3);

    for (const cls of lecturerClasses) {
      expect(cls.course_code).toBeDefined();
      expect(cls.sks).toBeGreaterThanOrEqual(1);
      expect(cls.section).toBeDefined();
      expect(cls.lecturer_name).toBeDefined();
    }
  });

  it('3. Koordinator Prodi & Staf Akademik melihat seluruh kelas perkuliahan kurikulum', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000004-0000-0000-0000-000000000004', email: 'kaprodi@siajar.test' },
      profile: { full_name: 'Prof. Dewi Lestari, Ph.D.' },
      activeRole: 'PROGRAM_COORDINATOR',
      roles: [{ code: 'PROGRAM_COORDINATOR' }],
    };

    const allClasses = await listMyClassesAction();
    // Harus mencakup seluruh rombel kelas kurikulum yang ter-seed
    expect(allClasses.length).toBeGreaterThanOrEqual(100);
  });

  it('4. listMasterDataAction menyediakan seluruh 63 mata kuliah resmi Informatika UIR', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
    };

    const master = await listMasterDataAction();
    expect(master.programs.length).toBeGreaterThan(0);
    expect(master.semesters.length).toBeGreaterThan(0);
    expect(master.courses.length).toBe(63);

    const pweb = master.courses.find((c) => c.code === 'STI2544138');
    expect(pweb).toBeDefined();
    expect(pweb?.name).toBe('Pemrograman Web');
    expect(pweb?.credits).toBe(3);
  });

  it('5. Detail kelas menyediakan bahan ajar kurikulum dan tugas terintegrasi', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000001-0000-0000-0000-000000000001', email: 'mhs2024001@siajar.test' },
      profile: { full_name: 'Ahmad Mahasiswa' },
      activeRole: 'STUDENT',
      roles: [{ code: 'STUDENT' }],
    };

    const detail = await getClassDetailAction(DEMO_CLASS_ID);
    expect(detail).not.toBeNull();
    expect(detail?.cls.course_code).toBe('STI2544138');
    expect(detail?.materials.length).toBeGreaterThanOrEqual(1);
    expect(detail?.assignments.length).toBeGreaterThanOrEqual(1);
  });

  it('6. Dosen dapat membuat kelas baru dengan memilih mata kuliah dari kurikulum resmi', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
    };

    const master = await listMasterDataAction();
    const targetCourse = master.courses[0];

    const res = await createClassAction({
      title: targetCourse.name,
      section: '3Z',
      capacity: 35,
      course_id: targetCourse.id,
    });

    expect(res.ok).toBe(true);
    expect(res.data?.section).toBe('3Z');
    expect(res.data?.course_code).toBe(targetCourse.code);
  });
});
