import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers';

test.describe('Perjalanan Emas Staf Akademik (Golden Journey ACADEMIC_STAFF)', () => {
  test('Staf: masuk -> beranda -> master mahasiswa -> master dosen -> jadwal -> verifikasi', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Masuk sebagai Staf Akademik (Eko)
    await loginAsRole(page, '198501012010121001', /\/(staff|workspace)/);

    if (page.url().includes('/workspace')) {
      await page.click('text=Staf Akademik');
      await page.waitForURL(/\/staff/);
    }

    // 2. Beranda Staf
    await expect(page).toHaveURL(/\/staff/);

    // 3. Buka Master Mahasiswa
    await page.goto('/staff/master/students');
    await expect(page).toHaveURL(/\/staff\/master\/students/);
    await expect(page.locator('h1')).toContainText(/Master Mahasiswa/i);

    // 4. Buka Master Dosen
    await page.goto('/staff/master/lecturers');
    await expect(page).toHaveURL(/\/staff\/master\/lecturers/);
    await expect(page.locator('h1')).toContainText(/Master Tenaga Pengajar/i);

    // 5. Buka Penjadwalan Kuliah
    await page.goto('/staff/schedules');
    await expect(page).toHaveURL(/\/staff\/schedules/);
    await expect(page.locator('body')).not.toContainText('404');

    // 6. Buka Verifikasi Pengajuan Mahasiswa
    await page.goto('/staff/services/verification');
    await expect(page).toHaveURL(/\/staff\/services\/verification/);
    await expect(page.locator('h1')).toContainText(/Verifikasi Permohonan Dokumen/i);
  });
});
