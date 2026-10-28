import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers';

test.describe('Perjalanan Emas Asisten Dosen (Golden Journey TEACHING_ASSISTANT)', () => {
  test('Asisten: masuk -> beranda -> kelas asistensi -> materi praktikum -> presensi', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Masuk sebagai Asisten Dosen (Citra Asisten)
    await loginAsRole(page, '2024002', /\/(ta|workspace)/);

    if (page.url().includes('/workspace')) {
      await page.click('text=Asisten');
      await page.waitForURL(/\/ta/);
    }

    // 2. Beranda Asisten
    await expect(page).toHaveURL(/\/ta/);
    await expect(page.locator('body')).not.toContainText('404');

    // 3. Buka Kelas Asistensi
    await page.goto('/ta/classes');
    await expect(page).toHaveURL(/\/ta\/classes/);
    await expect(page.locator('h1')).toContainText(/Kelas Asistensi/i);

    // 4. Buka Materi Praktikum
    await page.goto('/ta/materials');
    await expect(page).toHaveURL(/\/ta\/materials/);
    await expect(page.locator('body')).not.toContainText('404');

    // 5. Buka Presensi Praktikum
    await page.goto('/ta/attendance');
    await expect(page).toHaveURL(/\/ta\/attendance/);
    await expect(page.locator('body')).not.toContainText('404');
  });
});
