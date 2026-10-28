import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers';

test.describe('Perjalanan Emas Mahasiswa (Golden Journey STUDENT)', () => {
  test('Mahasiswa: masuk -> beranda -> kelas -> nilai -> ujian -> surat', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Masuk sebagai Mahasiswa
    await loginAsRole(page, '2024001', /\/(student|workspace)/);

    // Jika masuk ke workspace, klik peran Mahasiswa
    if (page.url().includes('/workspace')) {
      await page.click('text=Mahasiswa');
      await page.waitForURL(/\/student/);
    }

    // 2. Beranda Mahasiswa
    await expect(page.locator('h1')).toContainText(/Selamat Datang|Beranda|Mahasiswa/i);

    // 3. Buka Halaman Kelas
    await page.goto('/classes');
    await expect(page).toHaveURL(/\/classes/);
    await expect(page.locator('body')).not.toContainText('404');

    // 4. Buka Nilai Saya
    await page.goto('/grades');
    await expect(page).toHaveURL(/\/grades/);
    await expect(page.locator('h1')).toContainText(/Nilai Saya/i);

    // 5. Buka Ujian / Kuis
    await page.goto('/exams');
    await expect(page).toHaveURL(/\/exams/);
    await expect(page.locator('body')).not.toContainText('404');

    // 6. Ajukan Permohonan Surat / Layanan
    await page.goto('/requests');
    await expect(page).toHaveURL(/\/requests/);
    await expect(page.locator('h1')).toContainText(/Layanan Administrasi/i);
  });
});
