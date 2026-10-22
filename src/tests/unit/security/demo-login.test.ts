import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === 'x-forwarded-for') return '127.0.0.1';
      return null;
    }),
  })),
}));

vi.mock('@/lib/auth/supabase', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Auth offline'),
      }),
    },
  })),
}));

import { loginAction } from '@/modules/identity/actions';

describe('Uji Keamanan Login Demo & Kata Sandi Lingkungan (Task 3)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('menolak login demo jika ALLOW_DEMO_AUTH tidak diatur dan NODE_ENV=production', async () => {
    delete process.env.ALLOW_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'production';
    process.env.DEMO_PASSWORD = 'AnySecretPassword123!';

    // Mahasiswa demo UIR
    const resMhs = await loginAction({
      identifier: '243510001',
      password: 'AnySecretPassword123!',
    });
    expect(resMhs.ok).toBe(false);
    expect(resMhs.error).toContain('Identifier atau password salah');

    // Super Admin demo
    const resAdmin = await loginAction({
      identifier: '20120009',
      password: 'AnySecretPassword123!',
    });
    expect(resAdmin.ok).toBe(false);
    expect(resAdmin.error).toContain('Identifier atau password salah');
  });

  it('menolak login demo jika DEMO_PASSWORD dan SUPERADMIN_PASSWORD kosong / tidak diatur (meski di non-production)', async () => {
    delete process.env.DEMO_PASSWORD;
    delete process.env.SUPERADMIN_PASSWORD;
    delete process.env.ALLOW_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'development';

    // Mencoba sandi lama yang dulu di-hardcode: wahyu11, Password123!, password123, 123456, 12345
    const oldHardcodedPasswords = ['wahyu11', 'Password123!', 'password123', '123456', '12345'];

    for (const oldPass of oldHardcodedPasswords) {
      const res = await loginAction({
        identifier: '243510001',
        password: oldPass,
      });
      expect(res.ok, `Sandi lama "${oldPass}" harus ditolak saat DEMO_PASSWORD kosong`).toBe(false);
    }
  });

  it('menerima login demo hanya dengan nilai DEMO_PASSWORD atau SUPERADMIN_PASSWORD dari env pada mode non-production', async () => {
    (process.env as any).NODE_ENV = 'development';
    process.env.ALLOW_DEMO_AUTH = 'true';
    process.env.DEMO_PASSWORD = 'DemoSiajar2026Secure!';
    process.env.SUPERADMIN_PASSWORD = 'SuperAdminSecret2026!';

    // Mahasiswa demo lain (243510002) yang belum terkunci rate limiter
    const resMhs = await loginAction({
      identifier: '243510002',
      password: 'DemoSiajar2026Secure!',
    });
    expect(resMhs.ok).toBe(true);

    // Mahasiswa login dengan sandi salah
    const resMhsWrong = await loginAction({
      identifier: '243510003',
      password: 'WrongPassword!',
    });
    expect(resMhsWrong.ok).toBe(false);

    // Superadmin login dengan SUPERADMIN_PASSWORD env
    const resAdmin = await loginAction({
      identifier: '20120009',
      password: 'SuperAdminSecret2026!',
    });
    expect(resAdmin.ok).toBe(true);
  });
});
