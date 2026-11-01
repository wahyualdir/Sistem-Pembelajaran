import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockCookiesMap: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => {
      const val = mockCookiesMap[name];
      return val !== undefined ? { name, value: val } : undefined;
    },
    getAll: () => {
      return Object.entries(mockCookiesMap).map(([name, value]) => ({ name, value }));
    },
    has: (name: string) => name in mockCookiesMap,
    set: vi.fn((name: string, value: string) => {
      mockCookiesMap[name] = value;
    }),
    delete: vi.fn((name: string) => {
      delete mockCookiesMap[name];
    }),
  }),
  headers: () => ({
    get: () => null,
  }),
}));

vi.mock('@/lib/supabase/status', () => ({
  checkSupabaseOnline: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

import { getCurrentUserResolution, getCurrentUserWithRoles } from '@/modules/identity/current-user';
import { loginAction } from '@/modules/identity/actions';

describe('FASE C AUDIT: Demo Production Gating Verification', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockCookiesMap = {};
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    mockCookiesMap = {};
  });

  it('1. Login dengan identifier akun demo (termasuk alias baru ta@ dan sysadmin@) DITOLAK di production tanpa ALLOW_DEMO_AUTH', async () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_AUTH;

    const testIdentifiers = [
      '2024001',
      'ta@siajar.ac.id',
      '0012345678',
      '0087654321',
      '198501012010121001',
      'sysadmin@siajar.ac.id',
      'superadmin@siajar.ac.id',
    ];

    for (const id of testIdentifiers) {
      const res = await loginAction({
        identifier: id,
        password: 'Password123!',
      });
      expect(res.ok, `Harus menolak login demo untuk ${id} di production`).toBe(false);
      expect(res.error).toBe('Identifier atau password salah.');
    }
  });

  it('2. Cookie demo_session dan siakad_session palsu DIABAIKAN di production tanpa ALLOW_DEMO_AUTH', async () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_AUTH;

    // Pasang cookie demo_session dan siakad_session palsu
    mockCookiesMap['demo_session'] = 'a0000003-0000-0000-0000-000000000003';
    mockCookiesMap['siakad_session'] = Buffer.from(JSON.stringify({
      userId: 'a0000003-0000-0000-0000-000000000003',
      email: 'ta@siajar.ac.id',
      role: 'DOSEN',
    })).toString('base64');
    mockCookiesMap['active_role'] = 'TEACHING_ASSISTANT';

    const resolution = await getCurrentUserResolution();
    expect(resolution.status).not.toBe('AUTHENTICATED');
    expect(resolution.context).toBeNull();

    const user = await getCurrentUserWithRoles();
    expect(user).toBeNull();
  });

  it('3. Fallback peran sintetis dan matchedDemo.roles TIDAK AKTIF di production tanpa ALLOW_DEMO_AUTH', async () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_AUTH;

    // Pasang cookie demo_session saja
    mockCookiesMap['demo_session'] = 'a0000001-0000-0000-0000-000000000001';

    const resolution = await getCurrentUserResolution();
    // Di production tanpa ALLOW_DEMO_AUTH, demoSessionId diabaikan -> pengguna UNAUTHENTICATED
    expect(resolution.context).toBeNull();
    expect(resolution.status).toBe('UNAUTHENTICATED');
    expect(resolution.rolesStatus).toBe('EMPTY');
  });

  it('4. Kegagalan Supabase (timeout/UNAVAILABLE) TIDAK PERNAH menghasilkan sesi terautentikasi di production', async () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_AUTH;

    // Tanpa sesi Supabase -> UNAUTHENTICATED
    const resolutionNoCookie = await getCurrentUserResolution();
    expect(resolutionNoCookie.status).toBe('UNAUTHENTICATED');
    expect(resolutionNoCookie.context).toBeNull();

    const user = await getCurrentUserWithRoles();
    expect(user).toBeNull();
  });

  it('5. Kontrol Flag: Saat ALLOW_DEMO_AUTH="true", login demo dan fallback demo session BERFUNGSI', async () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.ALLOW_DEMO_AUTH = 'true';
    process.env.DEMO_PASSWORD = 'Password123!';

    const res = await loginAction({
      identifier: '2024001',
      password: 'Password123!',
    });
    expect(res.ok).toBe(true);
    expect(res.redirectTo).toBe('/student');

    // Sesi demo terbaca saat flag aktif
    mockCookiesMap['demo_session'] = 'a0000001-0000-0000-0000-000000000001';
    mockCookiesMap['active_role'] = 'STUDENT';

    const resolution = await getCurrentUserResolution();
    expect(resolution.status).toBe('AUTHENTICATED');
    expect(resolution.context?.activeRole).toBe('STUDENT');
  });
});
