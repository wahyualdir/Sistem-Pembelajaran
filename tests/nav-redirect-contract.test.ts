import { describe, it, expect } from 'vitest';
import { MENU_CONFIG, getMenuGroupsForRole, normalizeRoleCode } from '@/lib/config/menu-config';
import { decideRoleRedirect } from '@/lib/auth/route-guard';

describe('Nav Redirect Contract Tests (Langkah 4 Middleware)', () => {
  describe('1. Seluruh link menu resmi setiap peran tidak boleh dialihkan oleh middleware', () => {
    const roles = Object.keys(MENU_CONFIG);

    for (const role of roles) {
      it(`semua menu untuk peran ${role} harus menghasilkan null (tidak dialihkan)`, () => {
        const groups = getMenuGroupsForRole(role);
        for (const group of groups) {
          for (const item of group.items) {
            const [pathname, search] = item.href.includes('?')
              ? item.href.split('?')
              : [item.href, ''];

            const redirectTarget = decideRoleRedirect({
              pathname,
              search: search ? `?${search}` : undefined,
              activeRole: role,
              isImpersonating: false,
            });

            expect(
              redirectTarget,
              `Menu '${item.label}' (${item.href}) untuk peran ${role} tidak boleh dialihkan ke ${redirectTarget}`
            ).toBeNull();
          }
        }
      });
    }
  });

  describe('2. Karakterisasi perilaku lama redirect', () => {
    it('SYSTEM_ADMIN mengakses /classes harus dialihkan ke /admin/system', () => {
      const target = decideRoleRedirect({
        pathname: '/classes',
        activeRole: 'SYSTEM_ADMIN',
        isImpersonating: false,
      });
      expect(target).toBe('/admin/system');
    });

    it('SUPER_ADMIN non-impersonasi mengakses /grades harus dialihkan ke /admin', () => {
      const target = decideRoleRedirect({
        pathname: '/grades',
        activeRole: 'SUPER_ADMIN',
        isImpersonating: false,
      });
      expect(target).toBe('/admin');
    });

    it('LECTURER mengakses portal /student harus dialihkan ke /lecturer', () => {
      const target = decideRoleRedirect({
        pathname: '/student',
        activeRole: 'LECTURER',
        isImpersonating: false,
      });
      expect(target).toBe('/lecturer');
    });

    it('STUDENT mengakses portal /lecturer harus dialihkan ke /student', () => {
      const target = decideRoleRedirect({
        pathname: '/lecturer',
        activeRole: 'STUDENT',
        isImpersonating: false,
      });
      expect(target).toBe('/student');
    });
  });

  describe('3. Kasus bug laten (H4 & normalisasi role)', () => {
    // H4: diperbaiki di Fase 2
    // Path /tasks bukan bagian dari /ta (Teaching Assistant), sehingga untuk peran non-TA tidak boleh terpental karena prefix /ta
    it('// H4: diperbaiki di Fase 2 - /tasks tidak boleh dianggap bagian dari prefix /ta', () => {
      const target = decideRoleRedirect({
        pathname: '/tasks',
        activeRole: 'STUDENT',
        isImpersonating: false,
      });
      // Harusnya null (diizinkan atau tidak dialihkan oleh portal prefix /ta),
      // namun logika lama startsWith('/ta') salah mencocokkan /tasks sebagai /ta dan mengalihkan ke /student
      expect(target).toBeNull();
    });

    // Normalisasi role di Fase 2
    // Peran 'superadmin' huruf kecil atau tanpa underscore harus selalu diperlakukan identik dengan 'SUPER_ADMIN'
    it('peran superadmin (variasi) harus diperlakukan sama dengan SUPER_ADMIN', () => {
      const target = decideRoleRedirect({
        pathname: '/grades',
        activeRole: 'superadmin',
        isImpersonating: false,
      });
      // Sebelum Fase 2, activeRole 'superadmin' huruf kecil tidak dikenali di ROLE_PORTAL_MAP / logic
      expect(target).toBe('/admin');
    });
  });
});
