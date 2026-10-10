import { test, expect } from '@playwright/test';

test.describe('SIAJAR Fase 1: E2E Auth, Roles & Workspace Tests', () => {
  test('Halaman login menampilkan elemen esensial dengan tenang dan tanpa angka placeholder', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('SIAJAR');
    await expect(page.locator('input#identifier')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Validasi login gagal menampilkan pesan generik', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#identifier', '2024999');
    await page.fill('input#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    const alert = page.locator('#login-error-alert');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/Identifier atau password salah/i);
  });

  test('Skenario D6: 5 kali gagal login berturut-turut memicu penguncian akun (lockout 15 menit)', async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto('/login');
    const testNIM = '2024999';
    for (let i = 0; i < 5; i++) {
      await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 15000 });
      await page.fill('input#identifier', testNIM);
      await page.fill('input#password', 'SalahSandi99!');
      await page.click('button[type="submit"]');
      await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 15000 });
      await page.waitForTimeout(300);
    }

    const alert = page.locator('#login-error-alert');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/terkunci/i);
  });

  test('Halaman Lupa Password dapat dibuka dan mengirim instruksi', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Lupa password?');
    await expect(page).toHaveURL(/.*reset-password/);
    await page.fill('input[type="text"]', '2024001');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Instruksi Pemulihan Dikirim')).toBeVisible();
  });

  test('Login Mahasiswa dengan NIM 2024001 langsung diarahkan ke /student (Single-role)', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('input#identifier', '2024001');
    await page.fill('input#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/student', { timeout: 15000 });
    expect(page.url()).toContain('/student');
    await expect(page.locator('h1')).toContainText('Ruang Pembelajaran Mahasiswa');
  });

  test('Login Dosen dengan NIDN 0012345678 langsung diarahkan ke /lecturer', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#identifier', '0012345678');
    await page.fill('input#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/lecturer', { timeout: 15000 });
    expect(page.url()).toContain('/lecturer');
    await expect(page.locator('h1')).toContainText('Ruang Pengampu Dosen');
  });

  test('Login Multi-role Mahasiswa + Asisten Dosen (2024002) diarahkan ke halaman pilih workspace', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('input#identifier', '2024002');
    await page.fill('input#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/workspace', { timeout: 15000 });
    expect(page.url()).toContain('/workspace');
    await expect(page.locator('h1')).toContainText('Pilih Ruang Kerja');
    await expect(page.locator('text=Ruang Mahasiswa')).toBeVisible();
    await expect(page.locator('text=Ruang Asisten Dosen')).toBeVisible();

    // Pilih Ruang Mahasiswa
    const studentForm = page.locator('form').filter({ hasText: /masuk/i }).first();
    await studentForm.locator('button[type="submit"]').click();
    await page.waitForURL('**/student', { timeout: 15000 });
    expect(page.url()).toContain('/student');
  });

  test('Login Pengguna Baru dengan must_change_password diarahkan ke /must-change-password', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('input#identifier', '2024099');
    await page.fill('input#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/must-change-password', { timeout: 15000 });
    expect(page.url()).toContain('/must-change-password');
    await expect(page.locator('h1')).toContainText('Perbarui Kata Sandi Anda');
  });

  test('Halaman Perangkat & Sesi (/devices) menampilkan indikator Perangkat Ini dan aksi cabut sesi', async ({
    page,
  }) => {
    // Login terlebih dahulu sebagai mahasiswa
    await page.goto('/login');
    await page.fill('input#identifier', '2024001');
    await page.fill('input#password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student', { timeout: 15000 });

    // Buka halaman devices
    await page.goto('/devices');
    await expect(page.locator('h1')).toContainText('Perangkat & Sesi');
    await expect(page.locator('text=Perangkat Ini')).toBeVisible();
    await expect(page.locator('text=Tindakan Darurat: Aktivitas Mencurigakan')).toBeVisible();
  });
});
