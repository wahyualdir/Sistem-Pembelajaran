import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCookieStore = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => {
      const val = mockCookieStore.get(name);
      return val ? { name, value: val } : undefined;
    }),
    getAll: vi.fn(() =>
      Array.from(mockCookieStore.entries()).map(([name, value]) => ({ name, value }))
    ),
    set: vi.fn((name: string, value: string) => mockCookieStore.set(name, value)),
    delete: vi.fn((name: string) => mockCookieStore.delete(name)),
    has: vi.fn((name: string) => mockCookieStore.has(name)),
  })),
}));

let mockIsOnline = false;
vi.mock('@/lib/supabase/status', () => ({
  checkSupabaseOnline: vi.fn(async () => mockIsOnline),
}));

let mockUserResult: any = null;
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => mockUserResult),
    },
  })),
}));

let mockProfilesRes: any = { data: null, error: null };
let mockUserRolesRes: any = { data: [], error: null };

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => mockProfilesRes),
            })),
          })),
        };
      }
      if (table === 'user_roles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(async () => mockUserRolesRes),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: [], error: null })),
        })),
      };
    }),
  },
}));

import { getCurrentUserResolution } from '@/modules/identity/current-user';

describe('getCurrentUserResolution (Fase 2.2: Stop Silent Fallback STUDENT)', () => {
  beforeEach(() => {
    mockCookieStore.clear();
    mockIsOnline = false;
    mockUserResult = null;
    mockProfilesRes = { data: null, error: null };
    mockUserRolesRes = { data: [], error: null };
    // Clear in-memory profile cache
    if ((globalThis as any).__siajarUserProfileCache) {
      (globalThis as any).__siajarUserProfileCache.clear();
    }
  });

  it('1. Skenario cookie valid: role cookie cocok dengan daftar peran database', async () => {
    mockIsOnline = true;
    mockCookieStore.set('sb-access-token', 'token-123');
    mockCookieStore.set('active_role', 'LECTURER');
    mockUserResult = { data: { user: { id: 'usr-123', email: 'dosen@kampus.ac.id' } }, error: null };
    mockProfilesRes = {
      data: { id: 'usr-123', full_name: 'Dr. Dosen', email: 'dosen@kampus.ac.id' },
      error: null,
    };
    mockUserRolesRes = {
      data: [
        {
          id: 'ur-1',
          role_id: 'LECTURER',
          roles: { code: 'LECTURER', name: 'Dosen' },
        },
      ],
      error: null,
    };

    const res = await getCurrentUserResolution();
    expect(res.status).toBe('AUTHENTICATED');
    expect(res.rolesStatus).toBe('OK');
    expect(res.roleCookieMismatch).toBe(false);
    expect(res.context?.activeRole).toBe('LECTURER');
  });

  it('2. Skenario cookie tidak valid / mismatch: role cookie tidak ada di DB, fallback ke peran pertama dan roleCookieMismatch bernilai true', async () => {
    mockIsOnline = true;
    mockCookieStore.set('sb-access-token', 'token-123');
    mockCookieStore.set('active_role', 'SUPER_ADMIN'); // cookie usang / palsu
    mockUserResult = { data: { user: { id: 'usr-dosen', email: 'dosen@kampus.ac.id' } }, error: null };
    mockProfilesRes = {
      data: { id: 'usr-dosen', full_name: 'Dosen Asli', email: 'dosen@kampus.ac.id' },
      error: null,
    };
    mockUserRolesRes = {
      data: [
        {
          id: 'ur-2',
          role_id: 'LECTURER',
          roles: { code: 'LECTURER', name: 'Dosen' },
        },
      ],
      error: null,
    };

    const res = await getCurrentUserResolution();
    expect(res.status).toBe('AUTHENTICATED');
    expect(res.rolesStatus).toBe('OK');
    expect(res.roleCookieMismatch).toBe(true);
    expect(res.context?.activeRole).toBe('LECTURER');
  });

  it('3. Skenario peran kosong: query user_roles sukses tetapi pengguna belum memiliki peran -> activeRole bukan STUDENT', async () => {
    mockIsOnline = true;
    mockCookieStore.set('sb-access-token', 'token-123');
    mockCookieStore.set('active_role', 'STUDENT');
    mockUserResult = { data: { user: { id: 'usr-baru', email: 'baru@kampus.ac.id' } }, error: null };
    mockProfilesRes = {
      data: { id: 'usr-baru', full_name: 'User Baru', email: 'baru@kampus.ac.id' },
      error: null,
    };
    mockUserRolesRes = { data: [], error: null };

    const res = await getCurrentUserResolution();
    expect(res.status).toBe('AUTHENTICATED');
    expect(res.rolesStatus).toBe('EMPTY');
    expect(res.roleCookieMismatch).toBe(false);
    // CRITICAL: activeRole BUKAN 'STUDENT'
    expect(res.context?.activeRole).toBe('');
  });

  it('4. Skenario query DB error: query user_roles mengalami kegagalan -> rolesStatus ERROR dan activeRole bukan STUDENT', async () => {
    mockIsOnline = true;
    mockCookieStore.set('sb-access-token', 'token-123');
    mockUserResult = { data: { user: { id: 'usr-err', email: 'error@kampus.ac.id' } }, error: null };
    mockProfilesRes = { data: null, error: null };
    mockUserRolesRes = { data: null, error: new Error('Postgres connection timeout') };

    const res = await getCurrentUserResolution();
    expect(res.status).toBe('AUTHENTICATED');
    expect(res.rolesStatus).toBe('ERROR');
    expect(res.roleCookieMismatch).toBe(false);
    expect(res.context?.activeRole).toBe('');
  });

  it('5. Skenario layanan offline: cookie Supabase ada tetapi basis data tidak dapat dihubungi -> status UNAVAILABLE', async () => {
    mockIsOnline = false;
    mockCookieStore.set('sb-access-token', 'token-123');

    const res = await getCurrentUserResolution();
    expect(res.status).toBe('UNAVAILABLE');
    expect(res.rolesStatus).toBe('ERROR');
    expect(res.context).toBeNull();
  });
});
