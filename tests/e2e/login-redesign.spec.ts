import { test, expect } from '@playwright/test';

test.describe('Redesain Halaman Masuk RuangKampus (E2E Playwright)', () => {
  test('Alur galat kredensial salah: mengisi identitas dan kata sandi salah, galat muncul dengan role="alert"', async ({
    page,
  }) => {
    // 1. Kunjungi halaman login
    await page.goto('/login');

    // 2. Verifikasi elemen esensial tampil
    await expect(page.locator('h1')).toHaveText('Kelas, tugas, dan ujian di satu tempat.');
    const identifierInput = page.locator('input#identifier');
    const passwordInput = page.locator('input#password');
    const submitButton = page.locator('button[type="submit"]');

    await expect(identifierInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // 3. Isi identitas dan kata sandi yang salah
    await identifierInput.fill('243510001');
    await passwordInput.fill('SandiYangSalah123!');

    // 4. Klik tombol masuk
    await submitButton.click();

    // 5. Verifikasi galat muncul dengan role="alert" dan id="login-error-alert"
    const alertBox = page.locator('[role="alert"]#login-error-alert');
    await expect(alertBox).toBeVisible({ timeout: 10000 });
    await expect(alertBox).toContainText('NIM atau kata sandi salah.');
  });

  test('Tombol mata dapat mengganti tipe isian kata sandi dan aria-label', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input#password');
    const toggleButton = page.locator('button[aria-label="Tampilkan kata sandi"]');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleButton).toBeVisible();

    // Klik tombol untuk menampilkan kata sandi
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(page.locator('button[aria-label="Sembunyikan kata sandi"]')).toBeVisible();

    // Klik lagi untuk menyembunyikan kata sandi
    await page.locator('button[aria-label="Sembunyikan kata sandi"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(page.locator('button[aria-label="Tampilkan kata sandi"]')).toBeVisible();
  });
});
