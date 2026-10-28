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
    set: vi.fn(),
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

import { getCurrentUserWithRoles } from '@/modules/identity/current-user';
import { getCurrentUserWithRoles as getCurrentUserWithRolesFromActions } from '@/modules/identity/actions';
import { getSession } from '@/lib/auth/session';

describe('Demo Session Security Hardening in Production', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockCookiesMap = {};
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    mockCookiesMap = {};
  });

  it('menolak cookie demo_session ID superadmin tetap di production tanpa ALLOW_DEMO_AUTH', async () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_AUTH;

    // Coba cookie demo_session dengan ID superadmin
    mockCookiesMap['demo_session'] = 'a0000010-0000-0000-0000-000000000010';
    mockCookiesMap['active_role'] = 'SUPER_ADMIN';

    const userDirect = await getCurrentUserWithRoles();
    expect(userDirect).toBeNull();

    const userAction = await getCurrentUserWithRolesFromActions();
    expect(userAction).toBeNull();

    const session = await getSession();
    expect(session).toBeNull();
  });

  it('menolak cookie demo_session prefix u-staf-20120009 di production tanpa ALLOW_DEMO_AUTH', async () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_AUTH;

    mockCookiesMap['demo_session'] = 'u-staf-20120009';
    mockCookiesMap['active_role'] = 'SUPER_ADMIN';

    const userDirect = await getCurrentUserWithRoles();
    expect(userDirect).toBeNull();

    const session = await getSession();
    expect(session).toBeNull();
  });

  it('menolak cookie demo_session pengguna biasa di production tanpa ALLOW_DEMO_AUTH', async () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_AUTH;

    mockCookiesMap['demo_session'] = '243510001';
    mockCookiesMap['active_role'] = 'STUDENT';

    const userDirect = await getCurrentUserWithRoles();
    expect(userDirect).toBeNull();

    const session = await getSession();
    expect(session).toBeNull();
  });

  it('menerima cookie demo_session di production HANYA jika ALLOW_DEMO_AUTH === "true"', async () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.ALLOW_DEMO_AUTH = 'true';

    mockCookiesMap['demo_session'] = 'a0000010-0000-0000-0000-000000000010';
    mockCookiesMap['active_role'] = 'SUPER_ADMIN';

    const userDirect = await getCurrentUserWithRoles();
    expect(userDirect).not.toBeNull();
    expect(userDirect?.user.id).toBe('a0000010-0000-0000-0000-000000000010');

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('a0000010-0000-0000-0000-000000000010');
  });

  it('menerima cookie demo_session di non-production (development)', async () => {
    (process.env as any).NODE_ENV = 'development';
    delete process.env.ALLOW_DEMO_AUTH;

    mockCookiesMap['demo_session'] = 'a0000010-0000-0000-0000-000000000010';
    mockCookiesMap['active_role'] = 'SUPER_ADMIN';

    const userDirect = await getCurrentUserWithRoles();
    expect(userDirect).not.toBeNull();
    expect(userDirect?.user.id).toBe('a0000010-0000-0000-0000-000000000010');

    const session = await getSession();
    expect(session).not.toBeNull();
  });
});
