import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@/lib/supabase/status', () => ({
  checkSupabaseOnline: vi.fn().mockResolvedValue(true),
}));

import {
  buildInitialCollapsedGroups,
  getCollapsedGroupsStorageKey,
  loadCollapsedGroupsState,
} from '@/lib/config/collapsed-groups';
import { middleware } from '@/middleware';

describe('Navigation Stability & Impersonation Guards', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'super-admin-1',
          user_metadata: { active_role: 'SUPER_ADMIN' },
        },
      },
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  describe('loadCollapsedGroupsState', () => {
    const sampleGroups = [
      { id: 'utama', defaultCollapsed: false },
      { id: 'dukungan', defaultCollapsed: true },
      { id: 'arsip', defaultCollapsed: true },
    ];

    it('mengembalikan defaultCollapsed saat storage kosong atau null', () => {
      const emptyStorage = { getItem: () => null };
      expect(loadCollapsedGroupsState('STUDENT', sampleGroups, emptyStorage)).toEqual({
        dukungan: true,
        arsip: true,
      });
      expect(loadCollapsedGroupsState('STUDENT', sampleGroups, null)).toEqual({
        dukungan: true,
        arsip: true,
      });
    });

    it('mengabaikan payload JSON tidak valid, null, array, atau primitif tanpa melempar error', () => {
      const badPayloads = ['null', '[]', '123', '"text"', '{bad json', 'true'];
      for (const payload of badPayloads) {
        const storage = { getItem: () => payload };
        expect(loadCollapsedGroupsState('LECTURER', sampleGroups, storage)).toEqual(
          buildInitialCollapsedGroups(sampleGroups)
        );
      }
    });

    it('menangani storage.getItem yang melempar exception dengan aman', () => {
      const throwingStorage = {
        getItem: () => {
          throw new Error('SecurityError');
        },
      };
      expect(loadCollapsedGroupsState('LECTURER', sampleGroups, throwingStorage)).toEqual({
        dukungan: true,
        arsip: true,
      });
    });

    it('mempertahankan preferensi boolean tersimpan dan tetap menerapkan defaultCollapsed untuk grup baru', () => {
      const storage = {
        getItem: (key: string) => {
          expect(key).toBe(getCollapsedGroupsStorageKey('STUDENT'));
          return JSON.stringify({ dukungan: false, utama: true, corrupted: 'nope' });
        },
      };
      expect(loadCollapsedGroupsState('STUDENT', sampleGroups, storage)).toEqual({
        utama: true,
        dukungan: false,
        arsip: true,
      });
    });
  });

  describe('Sidebar & PortalShell memoization invariant', () => {
    it('memastikan getNavGroups selalu dimemoisasi agar tidak memicu render loop useEffect', () => {
      const root = process.cwd();
      const portalShell = fs.readFileSync(
        path.join(root, 'src', 'app', '(portal)', 'portal-shell.tsx'),
        'utf-8'
      );
      const sidebar = fs.readFileSync(
        path.join(root, 'src', 'components', 'shared', 'sidebar.tsx'),
        'utf-8'
      );

      expect(portalShell).toMatch(/const\s+navGroups\s*=\s*useMemo\(\s*\(\)\s*=>\s*getNavGroups\(/);
      expect(sidebar).toMatch(/const\s+groups\s*=\s*useMemo\(\s*\(\)\s*=>\s*getNavGroups\(/);
    });
  });

  describe('Middleware impersonation redirect bypass', () => {
    it('mengalihkan SUPER_ADMIN dari /student ke /admin jika tidak sedang impersonasi', async () => {
      const req = new NextRequest('http://localhost:3000/student', {
        headers: {
          cookie: 'sb-test-auth-token=mock; active_role=SUPER_ADMIN',
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/admin');
    });

    it('mengizinkan SUPER_ADMIN mengakses /student dan /grades saat cookie impersonation_token aktif', async () => {
      for (const pathTarget of ['/student', '/grades']) {
        const req = new NextRequest(`http://localhost:3000${pathTarget}`, {
          headers: {
            cookie:
              'sb-test-auth-token=mock; active_role=SUPER_ADMIN; impersonation_token=signed-token-value',
          },
        });
        const res = await middleware(req);
        expect(res.headers.get('location')).toBeNull();
        expect(res.status).toBe(200);
      }
    });

    it('tetap mendukung cookie legacy impersonating_from untuk kompatibilitas mundur', async () => {
      const req = new NextRequest('http://localhost:3000/student', {
        headers: {
          cookie: 'sb-test-auth-token=mock; active_role=SUPER_ADMIN; impersonating_from=super-admin-1',
        },
      });
      const res = await middleware(req);
      expect(res.headers.get('location')).toBeNull();
      expect(res.status).toBe(200);
    });

    it('tetap membatasi SYSTEM_ADMIN meskipun cookie impersonation_token ada', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'sys-admin-1',
            user_metadata: { active_role: 'SYSTEM_ADMIN' },
          },
        },
      });
      const req = new NextRequest('http://localhost:3000/student', {
        headers: {
          cookie:
            'sb-test-auth-token=mock; active_role=SYSTEM_ADMIN; impersonation_token=forged-token',
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/admin/system');
    });
  });
});
