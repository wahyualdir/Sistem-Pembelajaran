import { test, expect, type Page } from '@playwright/test';

// Vertical slice Bagian 13: kelas -> bergabung -> tugas -> pengumpulan -> nilai -> feedback.
// Berjalan pada mode demo (tanpa Supabase) maupun database yang sudah di-seed (akun demo, sandi Password123!).
const SHOTS = process.env.SHOTS_DIR;
const shot = async (p: Page, nama: string) => {
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nama}.png` });
};

async function masuk(page: Page, identifier: string, tujuan: RegExp) {
  await page.goto('/login');
  // Tombol aktif setelah halaman terhidrasi. Pada mode dev, muat pertama bisa bertabrakan dengan kompilasi ulang: muat ulang sekali.
  const tombolMasuk = page.getByRole('button', { name: 'Masuk', exact: true });
  try {
    await expect(tombolMasuk).toBeEnabled({ timeout: 20_000 });
  } catch {
    await page.reload();
    await expect(tombolMasuk).toBeEnabled({ timeout: 120_000 });
  }
  await page.getByLabel('NIM / NIDN / NIP / Email / Username').fill(identifier);
  await page.locator('#password').fill('Password123!');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.waitForURL(tujuan);
}

test('alur lengkap dari kelas sampai mahasiswa melihat nilai dan feedback', async ({ browser }) => {
  test.setTimeout(900_000);
  const stamp = Date.now().toString(36);
  const kd = stamp.toUpperCase(); // kode program dan mata kuliah dinormalkan ke huruf besar oleh server
  const judul = `Pemrograman Web ${stamp}`;
  const tugas = `Tugas ${stamp}`;
  const opsi = { viewport: { width: 1280, height: 800 } };
  const dosen = await (await browser.newContext(opsi)).newPage();
  const mhs = await (await browser.newContext(opsi)).newPage();
  const staf = await (await browser.newContext(opsi)).newPage();
  for (const p of [dosen, mhs, staf]) p.setDefaultTimeout(120_000);

  // Staf akademik menyiapkan master data
  const semester = `Semester ${stamp}`;
  await masuk(staf, '198501012010121001', /\/staff/);
  await staf.getByLabel('Kode program').fill(`P${kd}`);
  await staf.getByLabel('Nama program studi').fill('Teknik Informatika');
  await staf.getByRole('button', { name: 'Tambah program studi' }).click();
  await expect(staf.getByRole('status').filter({ hasText: 'Program studi ditambahkan' })).toBeVisible();
  await staf.getByLabel('Label semester').fill(semester);
  await staf.getByRole('button', { name: 'Tambah semester' }).click();
  await expect(staf.getByRole('status').filter({ hasText: 'Semester ditambahkan' })).toBeVisible();
  await staf.getByRole('combobox', { name: 'Program studi', exact: true }).selectOption({ label: `P${kd} Teknik Informatika` });
  await staf.getByLabel('Kode mata kuliah').fill(`C${kd}`);
  await staf.getByLabel('Nama mata kuliah').fill(judul);
  await staf.getByLabel('SKS').fill('3');
  await staf.getByRole('button', { name: 'Tambah mata kuliah' }).click();
  await expect(staf.getByRole('status').filter({ hasText: 'Mata kuliah ditambahkan' })).toBeVisible();
  await shot(staf, '00-master-data-staf');

  // Dosen membuat kelas dan tugas
  await masuk(dosen, '0012345678', /\/lecturer/);
  await shot(dosen, '01-beranda-dosen-kosong');
  await dosen.goto('/classes');
  await dosen.getByRole('combobox', { name: 'Daftar mata kuliah' }).selectOption({ label: `C${kd} ${judul}` });
  await dosen.getByRole('combobox', { name: 'Semester', exact: true }).selectOption({ label: semester });
  await expect(dosen.getByLabel('Mata kuliah', { exact: true })).toHaveValue(judul);
  await dosen.getByRole('button', { name: 'Buat kelas' }).click();
  const pesan = await dosen.getByRole('status').innerText();
  const kode = /kode kelas ([A-Z2-9]{8})/.exec(pesan)?.[1];
  expect(kode).toBeTruthy();
  await shot(dosen, '02-kelas-dibuat');

  await dosen.getByRole('link', { name: judul }).click();
  await dosen.waitForURL(/\/classes\/[0-9a-f-]{36}$/);
  const kelasUrl = dosen.url();
  await expect(dosen.getByText(`C${kd}, ${semester}`)).toBeVisible();
  await dosen.getByLabel('Judul tugas').fill(tugas);
  await dosen.getByLabel('Petunjuk (opsional)').fill('Buat halaman responsif.');
  await dosen.getByLabel('Tenggat').fill('2030-01-01T10:00');
  await dosen.getByLabel('Ditutup pada').fill('2030-01-02T10:00');
  await dosen.getByRole('button', { name: 'Terbitkan tugas' }).click();
  await expect(dosen.getByRole('heading', { name: tugas })).toBeVisible();
  await shot(dosen, '03-tugas-terbit-dosen');

  // Mahasiswa: kode salah ditolak, kode benar diterima, enrollment ganda ditolak
  await masuk(mhs, '2024001', /\/student/);
  await mhs.goto('/classes');
  await mhs.getByLabel('Kode kelas dari dosen').fill('AAAAAAAA');
  await mhs.getByRole('button', { name: 'Gabung' }).click();
  await expect(mhs.getByRole('alert').filter({ hasText: 'Kode kelas tidak ditemukan' })).toBeVisible();
  await mhs.getByLabel('Kode kelas dari dosen').fill(kode!);
  await mhs.getByRole('button', { name: 'Gabung' }).click();
  await expect(mhs.getByRole('status')).toContainText(`Berhasil bergabung ke ${judul}`);
  await mhs.getByLabel('Kode kelas dari dosen').fill(kode!);
  await mhs.getByRole('button', { name: 'Gabung' }).click();
  await expect(mhs.getByRole('alert').filter({ hasText: 'sudah terdaftar' })).toBeVisible();

  // Beranda mahasiswa menampilkan tugas; notifikasi tugas baru belum ada karena tugas terbit sebelum bergabung
  await mhs.goto('/student');
  await expect(mhs.getByText(tugas)).toBeVisible();
  await shot(mhs, '04-beranda-mahasiswa');
  await mhs.goto('/calendar');
  await expect(mhs.getByRole('link', { name: tugas })).toBeVisible();

  // Pengumpulan
  await mhs.goto(kelasUrl);
  await mhs.getByLabel('Jawaban').fill('Ini jawaban saya.');
  await mhs.getByRole('button', { name: 'Kumpulkan' }).click();
  await expect(mhs.getByText('Dikumpulkan pada')).toBeVisible();
  await expect(mhs.getByText('Menunggu penilaian dosen.')).toBeVisible();

  // Materi: dosen menerbitkan, mahasiswa membaca; dosen melihat daftar anggota
  await dosen.goto(kelasUrl);
  await dosen.getByLabel('Judul materi').fill(`Pertemuan 1 ${stamp}`);
  await dosen.getByLabel('Isi materi').fill('Pengantar HTML dan CSS.');
  await dosen.getByRole('button', { name: 'Terbitkan materi' }).click();
  await expect(dosen.getByRole('status').filter({ hasText: 'Materi diterbitkan' })).toBeVisible();
  await expect(dosen.getByText('Ahmad Mahasiswa')).toBeVisible();
  await mhs.goto(kelasUrl);
  await mhs.getByText(`Pertemuan 1 ${stamp}`).click();
  await expect(mhs.getByText('Pengantar HTML dan CSS.')).toBeVisible();
  await shot(mhs, '06b-materi-mahasiswa');

  // Pengumuman kelas
  await dosen.goto(kelasUrl);
  await dosen.getByLabel('Judul pengumuman').fill(`Info ${stamp}`);
  await dosen.getByLabel('Isi pengumuman').fill('Kuliah pertama diadakan Senin.');
  await dosen.getByRole('button', { name: 'Kirim pengumuman' }).click();
  await expect(dosen.getByRole('heading', { name: `Info ${stamp}` })).toBeVisible();
  await mhs.goto(kelasUrl);
  await expect(mhs.getByText('Kuliah pertama diadakan Senin.')).toBeVisible();

  // Diskusi kelas: mahasiswa bertanya, dosen membalas dan menyematkan
  await mhs.goto(kelasUrl);
  await mhs.getByLabel('Judul diskusi').fill(`Tanya ${stamp}`);
  await mhs.getByLabel('Isi diskusi').fill('Bagaimana cara mengumpulkan tugas?');
  await mhs.getByRole('button', { name: 'Mulai diskusi' }).click();
  await mhs.getByRole('link', { name: `Tanya ${stamp}` }).click();
  await mhs.waitForURL(/\/discussions\//);
  const diskusiUrl = mhs.url();
  await dosen.goto(diskusiUrl);
  await dosen.getByRole('textbox', { name: 'Balasan' }).fill('Gunakan kolom jawaban di bagian Tugas.');
  await dosen.getByRole('button', { name: 'Kirim balasan' }).click();
  await expect(dosen.getByText('Gunakan kolom jawaban di bagian Tugas.')).toBeVisible();
  await dosen.getByRole('button', { name: 'Sematkan', exact: true }).click();
  await expect(dosen.getByRole('button', { name: 'Lepas sematan' })).toBeVisible();
  await mhs.reload();
  await expect(mhs.getByText('Gunakan kolom jawaban di bagian Tugas.')).toBeVisible();
  await expect(mhs.getByText(/disematkan/)).toBeVisible();
  await shot(mhs, '06e-diskusi');

  // Delegasi asisten: dosen memberi izin review dan nilai draf; asisten tidak dapat memfinalisasi
  await dosen.goto(kelasUrl);
  await dosen.getByLabel('Email atau NIM asisten').fill('asdos@siajar.ac.id');
  await dosen.getByLabel('Memberi nilai draf').check();
  await dosen.getByRole('button', { name: 'Simpan asisten' }).click();
  await expect(dosen.getByText('Citra Asisten')).toBeVisible();
  const asdos = await (await browser.newContext(opsi)).newPage();
  asdos.setDefaultTimeout(120_000);
  await masuk(asdos, '2024002', /\/workspace/);
  await asdos.locator('form').filter({ has: asdos.locator('input[name="roleCode"][value="TEACHING_ASSISTANT"]') }).getByRole('button', { name: 'Masuk' }).click();
  await asdos.waitForURL(/\/ta/);
  const antrean = asdos.getByRole('link', { name: new RegExp(tugas) });
  await expect(antrean).toContainText('1 dari 1 pengumpulan belum final');
  await shot(asdos, '06c-beranda-asisten');
  await antrean.click();
  await asdos.getByLabel(/Nilai \(maks/).fill('70');
  await asdos.getByRole('button', { name: 'Simpan draf' }).click();
  await expect(asdos.getByRole('status').filter({ hasText: 'Draf nilai tersimpan' })).toBeVisible();
  await expect(asdos.getByRole('button', { name: 'Finalisasi' })).toBeHidden();
  await shot(asdos, '06d-tinjau-asisten');

  // Review: simpan draf lalu finalisasi
  await dosen.goto('/lecturer');
  await expect(dosen.getByRole('link', { name: new RegExp(tugas) })).toContainText('1 dari 1 pengumpulan belum final');
  await shot(dosen, '05-beranda-dosen-antrean');
  await dosen.getByRole('link', { name: new RegExp(tugas) }).click();
  await dosen.getByLabel(/Nilai \(maks/).fill('85');
  await dosen.getByLabel('Feedback untuk mahasiswa').fill('Bagus sekali.');
  await dosen.getByRole('button', { name: 'Simpan draf' }).click();
  await expect(dosen.getByRole('status')).toContainText('Draf nilai tersimpan');
  await mhs.goto(kelasUrl);
  await expect(mhs.getByText('Menunggu penilaian dosen.')).toBeVisible(); // draf tidak terlihat
  await dosen.getByRole('button', { name: 'Finalisasi' }).click();
  await shot(dosen, '06-konfirmasi-finalisasi');
  await dosen.getByRole('button', { name: 'Ya, finalisasi' }).click();
  await expect(dosen.getByText('Nilai final 85 dari 100')).toBeVisible();

  // Mahasiswa melihat nilai, feedback, dan notifikasi nilai terbit
  await mhs.reload();
  await expect(mhs.getByText('Nilai 85 dari 100')).toBeVisible();
  await expect(mhs.getByText('Bagus sekali.')).toBeVisible();
  await shot(mhs, '07-nilai-mahasiswa');

  // Perubahan nilai final: dosen mengajukan, koordinator menyetujui, mahasiswa melihat nilai baru
  await dosen.getByText('Ajukan perubahan nilai').click();
  await dosen.getByLabel('Nilai baru').fill('90');
  await dosen.getByLabel('Alasan perubahan').fill('Ada bagian jawaban yang belum dinilai.');
  await dosen.getByRole('button', { name: 'Ajukan', exact: true }).click();
  await expect(dosen.getByText('menunggu persetujuan koordinator prodi')).toBeVisible();
  const koord = await (await browser.newContext(opsi)).newPage();
  koord.setDefaultTimeout(120_000);
  await masuk(koord, '0087654321', /\/coordinator/);
  const usulan = koord.getByRole('listitem').filter({ hasText: tugas });
  await expect(usulan).toContainText('Nilai 85 menjadi 90');
  await shot(koord, '07b-persetujuan-koordinator');
  await usulan.getByLabel('Catatan keputusan').fill('Disetujui, revisi benar.');
  await usulan.getByRole('button', { name: 'Setujui' }).click();
  await expect(koord.getByText('Disetujui: nilai 85 menjadi 90')).toBeVisible();
  await mhs.reload();
  await expect(mhs.getByText('Nilai 90 dari 100')).toBeVisible();
  await mhs.goto('/notifications');
  await expect(mhs.getByText(`Nilai terbit: ${tugas}`)).toBeVisible();
  await expect(mhs.getByText(`Nilai diperbarui: ${tugas}`)).toBeVisible();
  await expect(mhs.getByText(`Materi baru: Pertemuan 1 ${stamp}`)).toBeVisible();
  await shot(mhs, '08-notifikasi');

  // Rekap nilai dosen dan ekspor CSV (tercatat di audit); mahasiswa tidak berhak
  await dosen.goto(`${kelasUrl}/gradebook`);
  await expect(dosen.getByRole('row').filter({ hasText: 'Ahmad Mahasiswa' })).toContainText('90');
  await shot(dosen, '09-rekap-nilai');
  const csv = await dosen.request.get(`${kelasUrl}/gradebook/export`);
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain('Ahmad Mahasiswa');
  expect((await mhs.request.get(`${kelasUrl}/gradebook/export`)).status()).toBe(404);

  // Otorisasi negatif: kelas asing dan halaman tinjau dosen menghasilkan 404 bagi mahasiswa
  const asing = await mhs.goto('/classes/00000000-0000-4000-8000-000000000000');
  expect(asing?.status()).toBe(404);
  const tinjau = await mhs.goto(`${kelasUrl}/assignments/00000000-0000-4000-8000-000000000000`);
  expect(tinjau?.status()).toBe(404);
});
