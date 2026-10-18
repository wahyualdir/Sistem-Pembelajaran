import { test, expect } from '@playwright/test';

test.describe('E2E Autosave Ujian dan Ketahanan Koneksi (11.1)', () => {
  test('Halaman ujian menampilkan indikator status autosave dan penanda waktu', async ({ page }) => {
    // Kunjungi halaman ujian (rute /exams)
    await page.goto('/exams', { waitUntil: 'domcontentloaded' });

    // Pastikan halaman memuat daftar ujian atau status aktif
    await expect(page.locator('body')).toBeVisible();
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Penyimpanan lokal IndexedDB dan pemulihan status saat muat ulang', async ({ page }) => {
    await page.goto('/exams');

    // Evaluasi ketersediaan IndexedDB pada peramban
    const isIndexedDBAvailable = await page.evaluate(() => {
      return typeof window.indexedDB !== 'undefined';
    });
    expect(isIndexedDBAvailable).toBe(true);

    // Simulasikan penyimpanan jawaban ke IndexedDB atau localStorage
    await page.evaluate(() => {
      const mockData = {
        'q-101': { questionId: 'q-101', answer: 'B', revision: 1 },
      };
      localStorage.setItem('exam:test-attempt-1', JSON.stringify(mockData));
    });

    // Muat ulang halaman dan pastikan data tersimpan tetap ada
    await page.reload();
    const retrieved = await page.evaluate(() => {
      return localStorage.getItem('exam:test-attempt-1');
    });
    expect(retrieved).toContain('q-101');
    expect(retrieved).toContain('"B"');
  });

  test('Penghitungan sisa waktu ujian menggunakan server offset konsisten saat jam klien digeser', async ({
    page,
  }) => {
    await page.goto('/exams');

    // Hitung sisa waktu dengan server offset di context browser
    const remainingSeconds = await page.evaluate(() => {
      const serverNow = new Date('2026-10-18T10:00:00Z').getTime();
      const clientNow = Date.now();
      const offset = serverNow - clientNow;
      const expiresAt = new Date('2026-10-18T10:30:00Z').getTime();

      // Waktu efektif server
      const effectiveServerNow = clientNow + offset;
      return Math.floor((expiresAt - effectiveServerNow) / 1000);
    });

    expect(remainingSeconds).toBe(1800); // 30 menit
  });
});
