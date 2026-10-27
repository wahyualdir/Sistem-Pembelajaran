import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

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
  })),
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === 'x-forwarded-for') return '127.0.0.1';
      return null;
    }),
  })),
}));

vi.mock('@/lib/supabase/status', () => ({
  checkSupabaseOnline: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Offline') }),
    },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          })),
        })),
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [] }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          single: vi.fn().mockResolvedValue({ data: null }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

import { loginAction, getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getSession } from '@/lib/auth/session';
import { GET as exportAcademicGet } from '@/app/api/export/laporan-akademik/route';
import { GET as pdfExamCardGet } from '@/app/api/pdf/kartu-ujian/route';
import { GET as cronRemindersGet } from '@/app/api/cron/reminders/route';

describe('Uji Keamanan Login Demo & Kata Sandi Lingkungan (Fase 1)', () => {
  const originalEnv = { ...process.env };

  const resetState = () => {
    process.env = { ...originalEnv };
    mockCookieStore.clear();
    (globalThis as any).ipAttempts?.clear();
    (globalThis as any).identifierAttempts?.clear();
  };

  beforeEach(() => {
    resetState();
  });

  afterEach(() => {
    resetState();
  });

  it('menolak login demo jika ALLOW_DEMO_AUTH tidak diatur dan NODE_ENV=production', async () => {
    delete process.env.ALLOW_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'production';
    process.env.DEMO_PASSWORD = 'AnySecretPassword123!';
    process.env.SUPERADMIN_PASSWORD = 'AnySecretPassword123!';

    // Mahasiswa demo UIR
    const resMhs = await loginAction({
      identifier: '243510001',
      password: 'AnySecretPassword123!',
    });
    expect(resMhs.ok).toBe(false);
    expect(resMhs.error).toContain('Identifier atau password salah');

    // Super Admin demo
    const resAdmin = await loginAction({
      identifier: 'superadmin',
      password: 'AnySecretPassword123!',
    });
    expect(resAdmin.ok).toBe(false);
    expect(resAdmin.error).toContain('Identifier atau password salah');
  });

  it('(a) menolak sandi wahyu11 dan Password123! saat env sandi kosong, termasuk untuk akun super admin', async () => {
    delete process.env.DEMO_PASSWORD;
    delete process.env.SUPERADMIN_PASSWORD;
    delete process.env.ALLOW_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'development';

    const testPasswords = ['wahyu11', 'Password123!', 'password123', '123456', '12345'];
    const testAccounts = ['243510001', 'superadmin', '20120009'];

    for (const account of testAccounts) {
      for (const pass of testPasswords) {
        // Clear rate limiter per attempt so we test the password check specifically
        (globalThis as any).identifierAttempts?.clear();
        (globalThis as any).ipAttempts?.clear();
        const res = await loginAction({
          identifier: account,
          password: pass,
        });
        expect(res.ok, `Sandi "${pass}" untuk akun "${account}" wajib ditolak`).toBe(false);
      }
    }
  });

  it('(b) di NODE_ENV=production tanpa ALLOW_DEMO_AUTH, cookie demo_session apa pun tidak menghasilkan sesi', async () => {
    delete process.env.ALLOW_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'production';

    const sampleDemoSessions = [
      'a0000010-0000-0000-0000-000000000010', // Super Admin synthetic UUID
      'u-staf-20120009',
      'u-mhs-1',
      'u-dsn-1',
    ];

    for (const demoId of sampleDemoSessions) {
      mockCookieStore.set('demo_session', demoId);
      mockCookieStore.set('active_role', 'SUPER_ADMIN');

      const userContext = await getCurrentUserWithRoles();
      expect(userContext, `demo_session ${demoId} tidak boleh menghasilkan userContext di production`).toBeNull();

      const session = await getSession();
      expect(session, `demo_session ${demoId} tidak boleh menghasilkan session di production`).toBeNull();
    }
  });

  it('(c) rute /api/* yang dilindungi menjawab 401 tanpa sesi', async () => {
    delete process.env.ALLOW_DEMO_AUTH;
    (process.env as any).NODE_ENV = 'production';
    mockCookieStore.clear();

    // 1. Ekspor laporan akademik tanpa sesi -> 401
    const reqExport = new NextRequest('http://localhost:3000/api/export/laporan-akademik');
    const resExport = await exportAcademicGet(reqExport);
    expect(resExport.status).toBe(401);

    // 2. Unduh PDF kartu ujian tanpa sesi -> 401
    const reqPdf = new NextRequest('http://localhost:3000/api/pdf/kartu-ujian?mhsId=mhs-1');
    const resPdf = await pdfExamCardGet(reqPdf);
    expect(resPdf.status).toBe(401);

    // 3. Cron trigger tanpa CRON_SECRET yang valid -> 401
    const reqCron = new NextRequest('http://localhost:3000/api/cron/reminders');
    const resCron = await cronRemindersGet(reqCron);
    expect(resCron.status).toBe(401);
  });

  it('menerima login demo hanya dengan nilai DEMO_PASSWORD atau SUPERADMIN_PASSWORD dari env pada mode non-production', async () => {
    (process.env as any).NODE_ENV = 'development';
    process.env.ALLOW_DEMO_AUTH = 'true';
    process.env.DEMO_PASSWORD = 'DemoSiajar2026Secure!';
    process.env.SUPERADMIN_PASSWORD = 'SuperAdminSecret2026!';

    // Mahasiswa demo (243510002)
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
      identifier: 'superadmin',
      password: 'SuperAdminSecret2026!',
    });
    expect(resAdmin.ok).toBe(true);
  });
});
