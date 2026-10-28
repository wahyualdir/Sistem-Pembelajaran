import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers';

test.describe('Perjalanan Emas Dosen (Golden Journey LECTURER)', () => {
  test('Dosen: masuk -> beranda -> kelas -> presensi -> mentoring -> bank soal', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Masuk sebagai Dosen
    await loginAsRole(page, '0012345678', /\/(lecturer|workspace)/);

    if (page.url().includes('/workspace')) {
      await page.click('text=Dosen Pengampu');
      await page.waitForURL(/\/lecturer/);
    }

    // 2. Beranda Dosen
    await expect(page.locator('body')).not.toContainText('404');

    // 3. Buka Daftar Kelas Dosen
    await page.goto('/classes');
    await expect(page).toHaveURL(/\/classes/);

    // 4. Buka Presensi Perkuliahan
    await page.goto('/attendance');
    await expect(page).toHaveURL(/\/attendance/);
    await expect(page.locator('h1')).toContainText(/Presensi/i);

    // 5. Buka Mahasiswa Bimbingan Akademik
    await page.goto('/lecturer/mentoring');
    await expect(page).toHaveURL(/\/lecturer\/mentoring/);
    await expect(page.locator('body')).not.toContainText('404');

    // 6. Buka Bank Soal Ujian
    await page.goto('/exams/question-bank');
    await expect(page).toHaveURL(/\/exams\/question-bank/);
    await expect(page.locator('h1')).toContainText(/Bank Soal/i);
  });
});
