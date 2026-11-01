import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockCookiesMap: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => {
      const val = mockCookiesMap[name];
      return val !== undefined ? { name, value: val } : undefined;
    },
    getAll: () => Object.entries(mockCookiesMap).map(([name, value]) => ({ name, value })),
    has: (name: string) => name in mockCookiesMap,
    set: vi.fn((name: string, value: string) => {
      mockCookiesMap[name] = value;
    }),
    delete: vi.fn((name: string) => {
      delete mockCookiesMap[name];
    }),
  }),
  headers: () => ({
    get: (key: string) => (key === 'x-forwarded-for' ? '127.0.0.1' : null),
  }),
}));

const mockSignInWithPassword = vi.fn();

vi.mock('@/lib/supabase/status', () => ({
  checkSupabaseOnline: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
  createServerSupabase: vi.fn().mockImplementation(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                user_id: 'a0000007-0000-0000-0000-000000000007',
                value: 'superadmin',
                type: 'USERNAME',
                profiles: {
                  id: 'a0000007-0000-0000-0000-000000000007',
                  email: 'superadmin@siajar.ac.id',
                  status: 'ACTIVE',
                  locked_until: null,
                  must_change_password: false,
                },
              },
              error: null,
            }),
          })),
        })),
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

import { loginAction } from '@/modules/identity/actions';

describe('FASE 1: Isolasi SUPERADMIN_PASSWORD dan Jalur Produksi', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockCookiesMap = {};
    mockSignInWithPassword.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    mockCookiesMap = {};
  });

  it('1. Di production tanpa ALLOW_DEMO_AUTH, sandi login TIDAK diverifikasi terhadap SUPERADMIN_PASSWORD env, dan kegagalan Supabase Auth menolak login (fail-closed)', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_AUTH;
    process.env.SUPERADMIN_PASSWORD = 'EnvSuperSecretValue2026!';

    // Supabase Auth menolak karena password salah di database Supabase
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid login credentials'),
    });

    const res = await loginAction({
      identifier: 'superadmin',
      password: 'EnvSuperSecretValue2026!',
    });

    // Wajib ditolak secara fail-closed
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Identifier atau password salah.');

    // Verifikasi: satu-satunya pemanggilan autentikasi adalah ke Supabase Auth dengan sandi input pengguna
    expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'superadmin@siajar.ac.id',
      password: 'EnvSuperSecretValue2026!',
    });
  });

  it('2. Kasus kontrol: Saat ALLOW_DEMO_AUTH="true", mode demo aktif dan menerima SUPERADMIN_PASSWORD env saat Supabase offline/gagal', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    process.env.ALLOW_DEMO_AUTH = 'true';
    process.env.SUPERADMIN_PASSWORD = 'EnvSuperSecretValue2026!';

    // Supabase Auth gagal
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid login credentials'),
    });

    const res = await loginAction({
      identifier: 'superadmin',
      password: 'EnvSuperSecretValue2026!',
      role: 'SUPER_ADMIN',
    });

    // Pada mode demo dengan izin eksplisit, fallback demo aktif
    expect(res.ok).toBe(true);
    expect(res.redirectTo).toBe('/admin');
  });
});
