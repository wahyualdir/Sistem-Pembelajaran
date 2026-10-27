import { describe, it, expect } from 'vitest';
import { MENU_CONFIG } from '@/lib/config/menu-config';
import { MOBILE_NAV_CONFIG } from '@/lib/config/mobile-nav';

describe('Konfigurasi Navigasi Bawah Ponsel (Mobile Bottom Nav)', () => {
  it('memiliki konfigurasi untuk seluruh 7 peran resmi SIAJAR', () => {
    const roles = [
      'STUDENT',
      'TEACHING_ASSISTANT',
      'LECTURER',
      'PROGRAM_COORDINATOR',
      'ACADEMIC_STAFF',
      'SYSTEM_ADMIN',
      'SUPER_ADMIN',
    ];

    for (const role of roles) {
      expect(MOBILE_NAV_CONFIG[role], `Role ${role} harus terdefinisi di MOBILE_NAV_CONFIG`).toBeDefined();
      expect(MOBILE_NAV_CONFIG[role].length, `Role ${role} harus memiliki tepat 4 slot utama`).toBe(4);
    }
  });

  it('seluruh id di MOBILE_NAV_CONFIG terdaftar nyata di MENU_CONFIG untuk peran tersebut', () => {
    for (const [role, itemIds] of Object.entries(MOBILE_NAV_CONFIG)) {
      const groups = MENU_CONFIG[role];
      expect(groups, `MENU_CONFIG untuk role ${role} harus ada`).toBeDefined();

      const allMenuItemIds = new Set<string>();
      for (const group of groups) {
        for (const item of group.items) {
          allMenuItemIds.add(item.id);
        }
      }

      for (const id of itemIds) {
        expect(
          allMenuItemIds.has(id),
          `Item ID "${id}" pada role "${role}" di MOBILE_NAV_CONFIG harus ada di MENU_CONFIG`
        ).toBe(true);
      }
    }
  });
});
