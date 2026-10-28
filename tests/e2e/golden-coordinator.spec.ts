import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers';

test.describe('Perjalanan Emas Koordinator Prodi (Golden Journey PROGRAM_COORDINATOR)', () => {
  test('Kaprodi: masuk -> kurikulum -> mata kuliah -> monitoring mahasiswa -> laporan', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Masuk sebagai Kaprodi (Prof. Dewi Lestari)
    await loginAsRole(page, '0087654321', /\/(coordinator|workspace)/);

    if (page.url().includes('/workspace')) {
      await page.click('text=Prodi');
      await page.waitForURL(/\/coordinator/);
    }

    // 2. Beranda Kaprodi
    await expect(page).toHaveURL(/\/coordinator/);

    // 3. Buka Kurikulum & CPL Prodi
    await page.goto('/coordinator/curriculum');
    await expect(page).toHaveURL(/\/coordinator\/curriculum/);
    await expect(page.locator('h1')).toContainText(/Kurikulum & Pemetaan CPL/i);

    // 4. Buka Manajemen Mata Kuliah
    await page.goto('/coordinator/courses');
    await expect(page).toHaveURL(/\/coordinator\/courses/);
    await expect(page.locator('h1')).toContainText(/Mata Kuliah Program Studi/i);

    // 5. Buka Monitoring Mahasiswa Berisiko
    await page.goto('/coordinator/monitoring/at-risk');
    await expect(page).toHaveURL(/\/coordinator\/monitoring\/at-risk/);
    await expect(page.locator('h1')).toContainText(/Pemantauan Mahasiswa Berisiko/i);

    // 6. Buka Laporan Prodi
    await page.goto('/coordinator/reports');
    await expect(page).toHaveURL(/\/coordinator\/reports/);
    await expect(page.locator('body')).not.toContainText('404');
  });
});
