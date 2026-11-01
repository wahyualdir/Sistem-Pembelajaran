import { test, expect, type Page } from '@playwright/test';
import { loginAsRole } from './helpers';
import fs from 'fs';
import path from 'path';

interface RoleConfig {
  roleName: string;
  roleCode: string;
  identifier: string;
  homeHref: string;
  workspaceRoleKeyword: string;
}

const DEMO_ROLES: RoleConfig[] = [
  {
    roleName: 'Mahasiswa',
    roleCode: 'STUDENT',
    identifier: '2024001',
    homeHref: '/student',
    workspaceRoleKeyword: 'Mahasiswa',
  },
  {
    roleName: 'Asisten Dosen',
    roleCode: 'TEACHING_ASSISTANT',
    identifier: 'ta@siajar.ac.id',
    homeHref: '/ta',
    workspaceRoleKeyword: 'Asisten',
  },
  {
    roleName: 'Dosen',
    roleCode: 'LECTURER',
    identifier: '0012345678',
    homeHref: '/lecturer',
    workspaceRoleKeyword: 'Dosen',
  },
  {
    roleName: 'Koordinator Prodi',
    roleCode: 'PROGRAM_COORDINATOR',
    identifier: '0087654321',
    homeHref: '/coordinator',
    workspaceRoleKeyword: 'Koordinator Prodi',
  },
  {
    roleName: 'Staf Akademik',
    roleCode: 'ACADEMIC_STAFF',
    identifier: '198501012010121001',
    homeHref: '/staff',
    workspaceRoleKeyword: 'Staf Akademik',
  },
  {
    roleName: 'Admin Sistem',
    roleCode: 'SYSTEM_ADMIN',
    identifier: 'sysadmin@siajar.ac.id',
    homeHref: '/admin/system',
    workspaceRoleKeyword: 'System Administrator',
  },
  {
    roleName: 'Super Admin',
    roleCode: 'SUPER_ADMIN',
    identifier: 'superadmin@siajar.ac.id',
    homeHref: '/admin',
    workspaceRoleKeyword: 'Super Administrator',
  },
];

interface NavRawEntry {
  role: string;
  href: string;
  finalPath: string;
  isExactMatch: boolean;
}

const rawReports: Record<string, NavRawEntry[]> = {};

async function expandAllSidebarGroups(page: Page) {
  const toggleButtons = page.locator('nav[aria-label="Navigasi Utama" i] button[aria-label^="Toggle grup"]');
  const count = await toggleButtons.count();
  for (let i = 0; i < count; i++) {
    const btn = toggleButtons.nth(i);
    try {
      const svgClass = (await btn.locator('svg').getAttribute('class')) || '';
      if (svgClass.includes('-rotate-90')) {
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ force: true, timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(50);
      }
    } catch {
      // Abaikan transisi
    }
  }
}

test.describe('E2E Navigasi Klik Sidebar Strict (Fase B Audit)', () => {
  test.afterAll(() => {
    try {
      const outputDir = path.resolve(process.cwd(), 'test-results');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const rawReportPath = path.join(outputDir, 'nav-raw.json');
      let merged: Record<string, NavRawEntry[]> = {};
      if (fs.existsSync(rawReportPath)) {
        try {
          merged = JSON.parse(fs.readFileSync(rawReportPath, 'utf-8'));
        } catch {}
      }
      for (const [k, v] of Object.entries(rawReports)) {
        if (v && v.length > 0) {
          merged[k] = v;
        }
      }
      fs.writeFileSync(
        rawReportPath,
        JSON.stringify(merged, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.error('Gagal menulis nav-raw.json:', e);
    }
  });

  for (const role of DEMO_ROLES) {
    test(`Strict Click: ${role.roleName} (${role.roleCode})`, async ({ page }) => {
      test.setTimeout(720000);

      const roleEntries: NavRawEntry[] = [];
      rawReports[role.roleCode] = roleEntries;

      // 1. Login sebagai peran
      const expectedUrlPattern = new RegExp(`(${role.homeHref.replace('/', '\\/')}|workspace|student|lecturer|coordinator|staff|admin)`);
      await loginAsRole(page, role.identifier, expectedUrlPattern);

      // Jika belum di beranda peran yang dituju
      if (!page.url().includes(role.homeHref)) {
        if (!page.url().includes('/workspace')) {
          await page.goto('/workspace?alasan=pilih');
          await page.waitForLoadState('domcontentloaded');
        }
        const formBtn = page.locator(`form:has(input[value="${role.roleCode}"]) button`);
        try {
          await formBtn.waitFor({ state: 'visible', timeout: 8000 });
          await formBtn.click();
        } catch {
          const card = page.locator('div.vt-window-inset', {
            has: page.locator(`h2:has-text("${role.workspaceRoleKeyword}")`),
          });
          if (await card.isVisible()) {
            await card.locator('button[type="submit"]').click();
          }
        }
        await page.waitForURL(new RegExp(role.homeHref.replace('/', '\\/')), { timeout: 60000 });
      }

      await expect(page).toHaveURL(new RegExp(role.homeHref.replace('/', '\\/')));

      // Buka semua accordion grup menu
      await expandAllSidebarGroups(page);

      // 2. Kumpulkan daftar href unik dari sidebar
      const navLinks = page.locator('nav[aria-label="Navigasi Utama" i] a[href]');
      const linkCount = await navLinks.count();
      const hrefList: string[] = [];

      for (let i = 0; i < linkCount; i++) {
        const href = await navLinks.nth(i).getAttribute('href');
        if (href && !hrefList.includes(href) && !href.startsWith('http')) {
          hrefList.push(href);
        }
      }

      // 3. Untuk setiap href, klik link sidebar tersebut
      for (const targetHref of hrefList) {
        const targetClean = targetHref.split('?')[0];
        const currentPath = new URL(page.url()).pathname;

        if (currentPath === targetClean) {
          roleEntries.push({
            role: role.roleCode,
            href: targetHref,
            finalPath: targetHref,
            isExactMatch: true,
          });
          continue;
        }

        await expandAllSidebarGroups(page);

        const link = page.locator(`nav[aria-label="Navigasi Utama" i] a[href="${targetHref}"]`).first();
        if (!(await link.isVisible())) {
          await expandAllSidebarGroups(page);
        }
        await link.scrollIntoViewIfNeeded().catch(() => {});
        await expect(link).toBeVisible({ timeout: 15000 });
        await link.scrollIntoViewIfNeeded().catch(() => {});

        // KLIK LINK
        await Promise.all([
          page.waitForURL((url) => {
            const p = url.pathname;
            return p === targetClean || p !== currentPath;
          }, { timeout: 45000 }).catch(() => {}),
          link.click(),
        ]);

        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await page.waitForTimeout(300);

        const afterUrl = new URL(page.url());
        const finalPath = afterUrl.pathname + (afterUrl.search || '');
        const finalClean = afterUrl.pathname;
        const isExactMatch = finalPath === targetHref || finalClean === targetClean;

        roleEntries.push({
          role: role.roleCode,
          href: targetHref,
          finalPath,
          isExactMatch,
        });
      }
    });
  }
});
