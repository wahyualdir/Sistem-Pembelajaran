import { describe, it, expect } from 'vitest';
import { getMenuGroupsForRole, normalizeRoleCode, getRoleHomeHref } from '@/lib/config/menu-config';
import { decideRoleRedirect } from '@/lib/auth/route-guard';

describe('Nav New Roles Contract Tests (PROGRAM_SECRETARY & LAB_HEAD)', () => {
  describe('1. Seluruh link menu resmi PROGRAM_SECRETARY dan LAB_HEAD tidak dialihkan oleh middleware', () => {
    const roles = ['PROGRAM_SECRETARY', 'LAB_HEAD'] as const;

    for (const role of roles) {
      it(`semua menu resmi peran ${role} harus menghasilkan null (diizinkan langsung)`, () => {
        const groups = getMenuGroupsForRole(role);
        expect(groups.length, `Menu groups untuk ${role} tidak boleh kosong`).toBeGreaterThan(0);

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

  describe('2. Normalisasi kode peran baru (case, whitespace, variasi)', () => {
    it('normalisasi PROGRAM_SECRETARY menangani huruf kecil, spasi, dan variasi kanonik', () => {
      const variants = [
        'PROGRAM_SECRETARY',
        'program_secretary',
        'Program_Secretary',
        'SEKPRODI',
        'sekprodi',
        'Sekprodi',
        'SECRETARY',
        'secretary',
        '  PROGRAM_SECRETARY  ',
        'program secretary',
      ];

      for (const v of variants) {
        expect(
          normalizeRoleCode(v),
          `Varian '${v}' harus dinormalisasi menjadi 'PROGRAM_SECRETARY'`
        ).toBe('PROGRAM_SECRETARY');
      }
    });

    it('normalisasi LAB_HEAD menangani huruf kecil, spasi, dan variasi kanonik', () => {
      const variants = [
        'LAB_HEAD',
        'lab_head',
        'Lab_Head',
        'KALAB',
        'kalab',
        'Kalab',
        'LAB_CHIEF',
        'lab_chief',
        '  LAB_HEAD  ',
        'lab head',
      ];

      for (const v of variants) {
        expect(
          normalizeRoleCode(v),
          `Varian '${v}' harus dinormalisasi menjadi 'LAB_HEAD'`
        ).toBe('LAB_HEAD');
      }
    });
  });

  describe('3. Penanganan peran tak dikenal (FOO) tidak boleh menghasilkan beranda mahasiswa', () => {
    it('kode peran tak dikenal FOO tidak boleh dinormalisasi menjadi STUDENT', () => {
      const normalized = normalizeRoleCode('FOO');
      expect(normalized).not.toBe('STUDENT');
    });

    it('getRoleHomeHref untuk peran tak dikenal FOO tidak boleh mengembalikan /student', () => {
      const home = getRoleHomeHref('FOO');
      expect(home).not.toBe('/student');
    });

    it('decideRoleRedirect untuk peran tak dikenal FOO tidak boleh mengasumsikan portal mahasiswa', () => {
      const redirect = decideRoleRedirect({
        pathname: '/student',
        activeRole: 'FOO',
        isImpersonating: false,
      });
      // Peran tak dikenal tidak boleh diizinkan di portal /student
      expect(redirect).not.toBeNull();
      expect(redirect).not.toBe('/student');
    });
  });
});
