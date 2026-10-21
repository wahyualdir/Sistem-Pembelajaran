# Data seed akademik, Prodi Teknik Informatika UIR, Ganjil 2026/2027

Semua nama orang adalah fiktif. Kemiripan dengan orang sungguhan hanya kebetulan. Berkas CSV memakai UTF-8 dengan BOM supaya terbuka benar di Excel.

## Isi berkas
- `kurikulum_2025.csv`: 63 baris. Seluruh mata kuliah Kurikulum 2025 (48 wajib dan 15 pilihan) dengan SKS teori dan praktik, prasyarat, kategori (MKWU, MKWK, MKPS), dan rumpun pilihan.
- `pemetaan_kode_jadwal_kurikulum.csv`: 38 baris. Kode di jadwal dipasangkan dengan kode kurikulum. Kedua kode tidak pernah sama, SKS-nya cocok semua.
- `jadwal_ganjil_2026_2027.csv`: 256 sesi kuliah (hari, jam, teori atau praktikum, ruang, dosen baru).
- `ruang.csv`: 14 ruang kelas dan laboratorium (kapasitas hanya perkiraan).
- `dosen_baru.csv`: 42 dosen pengganti dengan NIDN 10 digit (empat digit pertama = tahun masuk), Kaprodi, dan dosen wali.
- `mahasiswa.csv`: 120 mahasiswa (30 per angkatan 2023 sampai 2026) dengan NIM, rombel, dosen wali, dan penanda asdos.
- `krs_pendaftaran.csv`: 870 baris. Kelas yang diikuti tiap mahasiswa, termasuk satu mata kuliah pilihan untuk semester 5 dan 7.
- `asdos_penugasan.csv`: 56 penugasan oleh 16 asisten dosen (identitas = NIM) pada kelas praktikum.
- `staf_admin.csv`: 6 akun (3 staf akademik, 2 administrator sistem, 1 administrator utama) dengan NIP 8 digit.
- `bentrok_jadwal_sumber.csv`: 41 bentrok yang sudah ada di jadwal sumber (dosen, ruang, rombel).
- `bentrok_mahasiswa_terdaftar.csv`: 19 mahasiswa yang jadwal pribadinya bertabrakan.
- `PEMETAAN_RAHASIA_dosen_lama_ke_baru.csv`: rujukan nama lama ke nama baru, hanya untuk Anda. Jangan dimasukkan ke repo atau database.

## Aturan identitas
- NIM: angkatan 2 digit + `3510` + urut 3 digit, contoh `243510007`.
- NIDN: 10 digit, empat digit pertama adalah tahun masuk.
- NIP: 8 digit, empat digit pertama adalah tahun masuk.
- Asdos masuk dengan NIM mahasiswanya.
- Email hanyalah identitas teknis berdomain `.test` yang tidak bisa menerima surel: `{nim}@mhs.siajar.test`, `{nidn}@dosen.siajar.test`, `{nip}@staf.siajar.test`.
