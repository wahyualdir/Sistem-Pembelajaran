import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers';

test.describe('Perjalanan Emas Administrator (Golden Journey SYSTEM_ADMIN & SUPER_ADMIN)', () => {
  test('Admin: masuk -> beranda admin -> audit log -> pengaturan sistem -> integrasi', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Masuk sebagai System Administrator
    await loginAsRole(page, 'sysadmin', /\/(admin\/system|workspace)/);

    if (page.url().includes('/workspace')) {
      await page.click('text=System Administrator');
      await page.waitForURL(/\/admin\/system/);
    }

    // 2. Beranda System Admin
    await expect(page).toHaveURL(/\/admin\/system/);

    // 3. Buka Audit Log
    await page.goto('/admin/audit');
    await expect(page).toHaveURL(/\/admin\/audit/);
    await expect(page.locator('body')).not.toContainText('404');

    // 4. Buka Pengaturan Sistem
    await page.goto('/admin/system/settings');
    await expect(page).toHaveURL(/\/admin\/system\/settings/);
    await expect(page.locator('body')).not.toContainText('404');

    // 5. Buka Integrasi Sistem
    await page.goto('/admin/system/integrations');
    await expect(page).toHaveURL(/\/admin\/system\/integrations/);
    await expect(page.locator('body')).not.toContainText('404');

    // 6. Buka Pemantauan Server
    await page.goto('/admin/system/monitoring');
    await expect(page).toHaveURL(/\/admin\/system\/monitoring/);
    await expect(page.locator('body')).not.toContainText('404');
  });
});
