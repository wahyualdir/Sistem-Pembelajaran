import { test, expect, type Page } from '@playwright/test';
import { loginAsRole } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

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

/**
 * Tabel Pengalihan Disengaja (INTENDED_REDIRECTS)
 * Setiap entri wajib disertai alasan berbasis kode aplikasi.
 */
const INTENDED_REDIRECTS: Record<string, Record<string, { target: string | RegExp; reason: string }>> = {
  LECTURER: {
    '/grades': {
      target: '/analytics?tab=rekap-nilai',
      reason: 'Dosen mengakses /grades diarahkan ke tab rekap-nilai di analitik (src/app/(portal)/grades/page.tsx:20)',
    },
  },
  PROGRAM_COORDINATOR: {
    '/grades': {
      target: '/coordinator/reports',
      reason: 'Kaprodi mengakses /grades diarahkan ke laporan koordinator (src/app/(portal)/grades/page.tsx:23)',
    },
  },
  ACADEMIC_STAFF: {
    '/grades': {
      target: '/staff',
      reason: 'Staf akademik mengakses /grades diarahkan ke portal staf (src/app/(portal)/grades/page.tsx:26)',
    },
  },
};

interface NavReportEntry {
  href: string;
  finalPath: string;
  status: 'OK' | 'REDIRECT-SENGAJA' | 'TERPENTAL-KE-BERANDA (BUG)';
  reason?: string;
}

const allReports: Record<string, NavReportEntry[]> = {};

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
      // Abaikan jika tombol sedang bertransisi
    }
  }
}

test.describe('E2E Navigasi Klik Sidebar Seluruh Peran (Fase 1b)', () => {
  test.afterAll(() => {
    try {
      const outputDir = path.resolve(process.cwd(), 'test-results');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const reportPath = path.join(outputDir, 'nav-report.json');
      let mergedReports = { ...allReports };
      if (fs.existsSync(reportPath)) {
        try {
          const prev = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
          mergedReports = { ...prev, ...allReports };
        } catch {}
      }
      fs.writeFileSync(
        reportPath,
        JSON.stringify(mergedReports, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.error('Gagal menulis nav-report.json:', e);
    }
  });

  for (const role of DEMO_ROLES) {
    test(`Navigasi Klik Sidebar: ${role.roleName} (${role.roleCode})`, async ({ page }) => {
      test.setTimeout(720000);

      const roleReports: NavReportEntry[] = [];
      allReports[role.roleCode] = roleReports;

      // 1. Login sebagai peran
      const expectedUrlPattern = new RegExp(`(${role.homeHref.replace('/', '\\/')}|workspace|student|lecturer|coordinator|staff|admin)`);
      await loginAsRole(page, role.identifier, expectedUrlPattern);

      // Jika belum di beranda peran yang dituju (misal multi-role mendarat di /student atau /workspace)
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

      // Buka semua accordion grup menu agar semua link ada di DOM
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

      expect(hrefList.length, `Menu sidebar untuk peran ${role.roleCode} tidak boleh kosong`).toBeGreaterThan(0);

      // 3. Untuk setiap href, kembali ke beranda lalu klik link sidebar tersebut
      const bugList: string[] = [];

      for (const targetHref of hrefList) {
        // Kembali ke beranda peran terlebih dahulu
        const currentUrlObj = new URL(page.url());
        if (currentUrlObj.pathname !== role.homeHref) {
          const homeLink = page.locator(`nav[aria-label="Navigasi Utama" i] a[href="${role.homeHref}"]`).first();
          if (await homeLink.isVisible().catch(() => false)) {
            await homeLink.click();
            await page.waitForURL((url) => url.pathname === role.homeHref, { timeout: 10000 }).catch(async () => {
              await page.goto(role.homeHref, { waitUntil: 'domcontentloaded' });
            });
          } else {
            await page.goto(role.homeHref, { waitUntil: 'domcontentloaded' });
          }
          await page.waitForLoadState('domcontentloaded').catch(() => {});
        }

        await expandAllSidebarGroups(page);

        // Cari link sidebar yang sesuai
        const link = page.locator(`nav[aria-label="Navigasi Utama" i] a[href="${targetHref}"]`).first();
        if (!(await link.isVisible())) {
          await expandAllSidebarGroups(page);
        }
        await link.scrollIntoViewIfNeeded().catch(() => {});
        await expect(link).toBeVisible({ timeout: 15000 });
        await link.scrollIntoViewIfNeeded().catch(() => {});

        // KLIK LINK (bukan page.goto)
        await Promise.all([
          page.waitForURL((url) => {
            const p = url.pathname;
            return p !== role.homeHref || targetHref === role.homeHref;
          }, { timeout: 30000 }).catch(() => {}),
          link.click(),
        ]);

        // Tunggu transisi navigasi selesai
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await page.waitForTimeout(500);

        const afterUrl = new URL(page.url());
        const finalPath = afterUrl.pathname + (afterUrl.search || '');
        const targetClean = targetHref.split('?')[0];
        const finalClean = afterUrl.pathname;

        // 4. Klasifikasi
        const intended = INTENDED_REDIRECTS[role.roleCode]?.[targetHref];
        let status: NavReportEntry['status'] = 'OK';
        let reason: string | undefined = undefined;

        if (finalPath === targetHref || finalClean === targetClean) {
          status = 'OK';
        } else if (
          intended &&
          (typeof intended.target === 'string'
            ? finalPath === intended.target || finalClean === intended.target
            : intended.target.test(finalPath))
        ) {
          status = 'REDIRECT-SENGAJA';
          reason = intended.reason;
        } else if (
          (finalClean === role.homeHref && targetClean !== role.homeHref) ||
          finalClean === '/login' ||
          finalClean === '/workspace'
        ) {
          status = 'TERPENTAL-KE-BERANDA (BUG)';
          reason = `Target ${targetHref} terpental ke ${finalPath}`;
          bugList.push(`${targetHref} -> ${finalPath}`);
        } else {
          // Navigasi pindah ke halaman lain tanpa terpental ke beranda
          status = 'OK';
          reason = `Dialihkan ke ${finalPath}`;
        }

        roleReports.push({
          href: targetHref,
          finalPath,
          status,
          reason,
        });
      }

      // 5. Verifikasi: tidak boleh ada BUG navigasi
      expect(
        bugList,
        `Ditemukan ${bugList.length} menu terpental ke beranda pada peran ${role.roleCode}: ${bugList.join(', ')}`
      ).toEqual([]);
    });
  }
});
