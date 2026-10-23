import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockCurrentUser: any = null;
let mockIsOnline = true;
let mockFromMap: Record<string, any> = {};

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

vi.mock('@/lib/supabase/status', () => ({
  checkSupabaseOnline: vi.fn(async () => mockIsOnline),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (mockFromMap[table]) {
        return mockFromMap[table];
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => resolve({ data: [], error: null })),
      };
    }),
  })),
}));

import { getSemesterWeaveAction } from '@/modules/academic/semester-weave-actions';

describe('Server Action: getSemesterWeaveAction', () => {
  const studentUser = {
    user: { id: 'std-1', email: 'mhs@student.uir.ac.id' },
    activeRole: 'STUDENT',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = studentUser;
    mockIsOnline = true;
    mockFromMap = {};
  });

  // (c) Pengguna bukan mahasiswa
  it('(c) Mengembalikan data kosong jika pengguna bukan mahasiswa (atau peran non-STUDENT)', async () => {
    mockCurrentUser = {
      user: { id: 'dosen-1', email: 'dosen@uir.ac.id' },
      activeRole: 'LECTURER',
    };

    const res = await getSemesterWeaveAction();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.rows).toEqual([]);
      expect(res.data.currentWeek).toBeNull();
    }
  });

  // (d) Mahasiswa tanpa kelas
  it('(d) Mengembalikan data kosong jujur jika mahasiswa tidak memiliki kelas aktif', async () => {
    mockFromMap['enrollments'] = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    };

    const res = await getSemesterWeaveAction();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.rows).toEqual([]);
      expect(res.data.currentWeek).toBeNull();
    }
  });

  // (b) Satu query galat
  it('(b) Menangani galat query basis data dengan pesan umum tanpa rincian teknis', async () => {
    mockFromMap['enrollments'] = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'relation enrollments does not exist', code: '42P01' },
          }),
        }),
      }),
    };

    const res = await getSemesterWeaveAction();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.pesan).toBe('Kain semester belum bisa dimuat. Coba muat ulang halaman.');
    }
  });

  // (a) Sukses
  it('(a) Berhasil memuat data kain semester untuk mahasiswa terdaftar dengan kelas aktif', async () => {
    // 1. Enrollments
    mockFromMap['enrollments'] = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                class_id: 'c-1',
                status: 'ACTIVE',
                classes: {
                  id: 'c-1',
                  title: 'Pemrograman Web Lanjut',
                  section: 'IF-3A',
                  status: 'ACTIVE',
                },
              },
            ],
            error: null,
          }),
        }),
      }),
    };

    // 2. Attendance Sessions
    mockFromMap['attendance_sessions'] = {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'sess-1',
              class_id: 'c-1',
              session_number: 1,
              title: 'Pengenalan Web Modern',
              session_date: '2026-09-07',
              is_open: false,
            },
            {
              id: 'sess-2',
              class_id: 'c-1',
              session_number: 2,
              title: 'Next.js App Router',
              session_date: '2026-09-14',
              is_open: false,
            },
          ],
          error: null,
        }),
      }),
    };

    // 3. Assignments
    mockFromMap['assignments'] = {
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'asg-1',
                class_id: 'c-1',
                title: 'Tugas 1: Komponen React',
                due_at: '2026-09-13T16:59:00Z',
                close_at: '2026-09-14T16:59:00Z',
                status: 'PUBLISHED',
              },
            ],
            error: null,
          }),
        }),
      }),
    };

    // 4. Attendance Records
    mockFromMap['attendance_records'] = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              {
                session_id: 'sess-1',
                status: 'HADIR',
                check_in_at: '2026-09-07T08:05:00Z',
              },
            ],
            error: null,
          }),
        }),
      }),
    };

    // 5. Submissions
    mockFromMap['submissions'] = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({
              data: [
                {
                  assignment_id: 'asg-1',
                  status: 'SUBMITTED',
                  submitted_at: '2026-09-12T10:00:00Z',
                  is_late: false,
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };

    const res = await getSemesterWeaveAction();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.rows).toHaveLength(1);
      expect(res.data.rows[0].classTitle).toBe('Pemrograman Web Lanjut');
      expect(res.data.rows[0].cells).toHaveLength(16);
      expect(res.data.semesterStart).toBe('2026-09-07');
    }
  });
});
