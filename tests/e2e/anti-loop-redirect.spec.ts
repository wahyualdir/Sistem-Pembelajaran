import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers';

test.describe('E2E Anti-Loop Redirect untuk Peran Tak Dikenal (Fase 4a)', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(90000);

  test('Mengubah active_role menjadi peran tak dikenal saat membuka /student harus stabil di /workspace tanpa loop (redirect hops <= 3)', async ({
    page,
    context,
  }) => {
    // 1. Login sebagai akun Mahasiswa
    await loginAsRole(page, '2024001', /\/(student|workspace)/);

    // 2. Ubah cookie active_role menjadi nilai tak dikenal ('UNKNOWN_ROLE')
    const baseURL = page.url();
    const urlObj = new URL(baseURL);
    await context.addCookies([
      {
        name: 'active_role',
        value: 'UNKNOWN_ROLE',
        domain: urlObj.hostname,
        path: '/',
      },
    ]);

    // 3. Buka portal /student
    const response = await page.goto('/student', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();

    // 4. Hitung jumlah redirect berantai
    let hopCount = 0;
    let req = response?.request() ?? null;
    while (req?.redirectedFrom()) {
      hopCount++;
      req = req.redirectedFrom();
    }

    // Jumlah redirect berantai tidak boleh lebih dari 3
    expect(hopCount, `Jumlah redirect berantai harus <= 3`).toBeLessThanOrEqual(3);

    // 5. Pastikan URL akhir stabil di /workspace dan status response 200
    const finalUrl = page.url();
    expect(finalUrl).toContain('/workspace');
    expect(response?.status()).toBe(200);

    // 6. Pastikan halaman /workspace merender konten valid tanpa error loop
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('Membuka portal dengan active_role kosong/tidak valid harus stabil tanpa ERR_TOO_MANY_REDIRECTS', async ({
    page,
    context,
  }) => {
    // 1. Login sebagai akun Dosen
    await loginAsRole(page, '0012345678', /\/(lecturer|workspace)/);

    // 2. Kosongkan cookie active_role
    const baseURL = page.url();
    const urlObj = new URL(baseURL);
    await context.addCookies([
      {
        name: 'active_role',
        value: '',
        domain: urlObj.hostname,
        path: '/',
      },
    ]);

    // 3. Buka portal /lecturer
    const response = await page.goto('/lecturer', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();

    // 4. Hitung redirect
    let hopCount = 0;
    let req = response?.request() ?? null;
    while (req?.redirectedFrom()) {
      hopCount++;
      req = req.redirectedFrom();
    }

    expect(hopCount).toBeLessThanOrEqual(3);
    expect(page.url()).toContain('/workspace');
    expect(response?.status()).toBe(200);
  });
});
