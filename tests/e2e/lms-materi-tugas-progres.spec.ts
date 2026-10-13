import { test, expect, type Page } from '@playwright/test';

async function masuk(page: Page, identifier: string, tujuan: RegExp) {
  await page.goto('/login');
  const tombolMasuk = page.locator('button[type="submit"]');
  try {
    await expect(tombolMasuk).toBeEnabled({ timeout: 20_000 });
  } catch {
    await page.reload();
    await expect(tombolMasuk).toBeEnabled({ timeout: 60_000 });
  }
  await page.getByLabel('NIM / NIDN / NIP / Email / Username').fill(identifier);
  await page.locator('#password').fill('Password123!');
  await tombolMasuk.click();
  await page.waitForURL(tujuan);
}

test('alur LMS terpadu: dosen unggah materi -> mahasiswa buka & tandai selesai -> kumpul tugas -> dosen nilai', async ({ browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now().toString(36);
  const judulMateri = `Materi E2E ${stamp}`;
  const opsi = { viewport: { width: 1280, height: 800 } };

  const dosen = await (await browser.newContext(opsi)).newPage();
  const mhs = await (await browser.newContext(opsi)).newPage();

  // 1. Dosen Masuk dan Mengunggah Materi Kuliah
  await masuk(dosen, '0012345678', /\/lecturer/);
  await dosen.goto('/dosen/materi-tugas');
  await expect(dosen.getByRole('heading', { name: /Materi Perkuliahan & Pengumpulan Tugas/i })).toBeVisible({ timeout: 20_000 });

  // Buka modal tambah materi
  await dosen.getByRole('button', { name: /Unggah Materi Baru/i }).click();
  await dosen.getByPlaceholder(/Modul 03/i).fill(judulMateri);
  // Gunakan mode tautan untuk kepastian deterministik tanpa file picker sistem
  await dosen.getByRole('button', { name: /Tautkan Link Eksternal/i }).click();
  await dosen.getByPlaceholder(/drive\.google\.com/i).fill('https://example.com/slide-materi.pdf');
  await dosen.getByRole('button', { name: /Publikasikan Materi/i }).click();

  // Verifikasi materi tampil di daftar materi dosen
  await expect(dosen.getByText(judulMateri)).toBeVisible({ timeout: 15_000 });

  // 2. Mahasiswa Masuk, Membuka Materi, dan Menandai Selesai
  await masuk(mhs, '2024001', /\/student/);
  await mhs.goto('/mahasiswa/tugas');
  await expect(mhs.getByRole('heading', { name: /Materi & Tugas Perkuliahan/i })).toBeVisible({ timeout: 20_000 });

  // Pindah ke tab Materi Kuliah
  const tabMateri = mhs.getByRole('button', { name: /Materi Kuliah/i });
  await expect(async () => {
    await tabMateri.click();
    await expect(mhs.getByText(judulMateri)).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  // Tandai materi selesai
  const tombolTandai = mhs.locator('button', { hasText: /Tandai Selesai/i }).first();
  await expect(tombolTandai).toBeVisible({ timeout: 15_000 });
  await tombolTandai.click();

  // Verifikasi badge Selesai muncul
  await expect(mhs.getByText(/Selesai/i).first()).toBeVisible({ timeout: 15_000 });

  // 3. Mahasiswa Mengumpulkan Tugas
  const tabTugasMhs = mhs.getByRole('button', { name: /Daftar Tugas/i });
  await expect(async () => {
    await tabTugasMhs.click();
    await expect(mhs.getByRole('button', { name: /Kumpulkan Jawaban|Kumpulkan Ulang/i }).first()).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  const tombolKumpul = mhs.getByRole('button', { name: /Kumpulkan Jawaban|Kumpulkan Ulang/i }).first();
  await tombolKumpul.click();
  await mhs.getByRole('button', { name: /Tempel Tautan/i }).click();
  await mhs.getByPlaceholder(/drive\.google\.com/i).fill('https://github.com/mahasiswa/tugas-repo');
  await mhs.getByRole('button', { name: /Kirim Jawaban/i }).click();
  await expect(mhs.getByText(/Terkumpul Tepat Waktu/i).first()).toBeVisible({ timeout: 15_000 });

  // 4. Dosen Melihat Tugas & Memberikan Nilai
  await dosen.goto('/dosen/materi-tugas');
  await expect(dosen.getByRole('heading', { name: /Materi Perkuliahan & Pengumpulan Tugas/i })).toBeVisible({ timeout: 20_000 });
  const tabTugas = dosen.getByRole('button', { name: /Tugas & Evaluasi/i });
  await expect(async () => {
    await tabTugas.click();
    await expect(dosen.getByRole('button', { name: /Buat Tugas Baru/i })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  const tombolPeriksa = dosen.locator('button', { hasText: /Lihat Pengumpulan/i }).first();
  await expect(tombolPeriksa).toBeVisible({ timeout: 15_000 });
  await tombolPeriksa.click();
  const tombolBeriNilai = dosen.locator('button', { hasText: /Beri Nilai|Ubah Nilai/i }).first();
  await expect(tombolBeriNilai).toBeVisible({ timeout: 15_000 });
  await tombolBeriNilai.click();
  const inputNilai = dosen.locator('input[type="number"]').first();
  await inputNilai.fill('95');
  await dosen.locator('textarea').first().fill('Kerja bagus, arsitektur modular.');
  await dosen.getByRole('button', { name: /Simpan Penilaian/i }).click();
  await expect(dosen.getByText('95').first()).toBeVisible({ timeout: 15_000 });

  // Tutup modal pengumpulan tugas agar tidak memblokir antarmuka
  const tombolTutup = dosen.getByRole('button', { name: 'Tutup' }).first();
  await tombolTutup.click();
  await expect(dosen.getByRole('dialog')).toBeHidden({ timeout: 10_000 });

  // 5. Dosen Membuka Tab Rekap Progres Mahasiswa
  const tabProgres = dosen.getByRole('button', { name: /Rekap Progres/i });
  await expect(async () => {
    await tabProgres.click();
    await expect(dosen.getByRole('button', { name: /Ekspor Rekap Progres/i })).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  // 6. Mahasiswa Melihat Nilai yang Sudah Diberikan
  await mhs.goto('/mahasiswa/tugas');
  await expect(mhs.getByText(/95 \/ 100/i).first()).toBeVisible({ timeout: 15_000 });

  await dosen.close();
  await mhs.close();
});
