# Panduan Data Seed Akademik SIAJAR (UIR Ganjil 2026/2027)

Dokumen ini menjelaskan tata cara eksekusi, variabel lingkungan, daftar akun contoh, ringkasan bentrok sumber, dan arsitektur data seed Program Studi Teknik Informatika, Universitas Islam Riau (Semester Ganjil 2026/2027).

---

## 1. Ringkasan Eksekusi & Keselamatan

Penyemaian data akademik dirancang dengan prinsip **Fail-Closed** dan **Zero Production Leak**:
- **Tidak menyimpan kata sandi di kode atau repositori**: Kata sandi dibaca secara runtime dari variabel lingkungan `SEED_PASSWORD` (minimal 12 karakter).
- **Guard lingkungan ketat**: Skrip berhenti jika `NODE_ENV=production`, `VERCEL_ENV=production`, atau `SEED_ENV` bukan `local`/`staging`.
- **Domain email aman**: Seluruh akun menggunakan domain uji terisolasi RFC 2606 (`@mhs.siajar.test`, `@dosen.siajar.test`, `@staf.siajar.test`). Tidak ada akun berdomain `@uir.ac.id` atau `@student.uir.ac.id`.
- **Cegah pencampuran data pengguna riil**: Memeriksa `auth.users` sebelum menulis. Jika ditemukan pengguna riil di luar domain `.test`, proses berhenti kecuali flag `SEED_ALLOW_EXISTING_USERS=true` diberikan.
- **Idempoten**: Menjalankan skrip berulang kali dengan `--apply` tidak akan menduplikasi akun, kelas, pendaftaran, atau slot jadwal.

---

## 2. Variabel Lingkungan (Environment Variables)

| Variabel | Wajib | Nilai Contoh | Penjelasan |
| :--- | :---: | :--- | :--- |
| `SEED_ENV` | **Ya** | `local` atau `staging` | Lingkungan target eksekusi (wajib tepat `local` atau `staging`). |
| `SEED_CONFIRM_PROJECT_REF` | **Ya** | `local` atau `[ref-project]` | Konfirmasi ref proyek Supabase yang cocok dengan host URL. |
| `SEED_PASSWORD` | **Ya** | `RahasiaSIAJAR2026!` | Kata sandi untuk seluruh 168 akun login (min. 12 karakter). |
| `NEXT_PUBLIC_SUPABASE_URL` | **Ya** | `http://127.0.0.1:54321` | Alamat API Supabase instance target. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Ya** | `eyJh...` | Kunci service role admin Supabase untuk provisi akun auth. |
| `SEED_ALLOW_EXISTING_USERS`| Tidak | `false` (default) | Izinkan penulisan meski terdapat akun non-`.test` di database. |
| `SEED_FORCE_PASSWORD_CHANGE`| Tidak | `false` (default) | Jika `true`, tandai pengguna harus ganti kata sandi saat login pertama. |
| `SEED_WITH_PERTEMUAN` | Tidak | `false` (default) | Jika `true`, hasilkan 16 pertemuan di `attendance_sessions`. |
| `TANGGAL_MULAI_KULIAH` | Tidak | `2026-08-31` | Tanggal patokan pertemuan ke-1 (Senin awal semester). |
| `SEED_DATASET` | Tidak | `uir-ti-2026` | Mengaktifkan dataset UIR pada lapisan store in-memory aplikasi. |

---

## 3. Perintah CLI (`npm run seed:akademik`)

CLI utama terletak di `scripts/seed-akademik/index.ts` dan dijalankan melalui npm script:

### A. Mode Kering (Dry-Run / Bawaan)
Memvalidasi format CSV, integritas skema Zod, referensi relasional antarberkas, dan menghitung ringkasan data tanpa menyentuh database:
```bash
npm run seed:akademik
```

### B. Mode Penulisan Sungguhan (`--apply`)
Mengeksekusi penyediaan 168 akun login, profil, identitas, peran, data prodi, semester, ruang, mata kuliah, kelas, slot jadwal, KRS, penugasan asisten, serta langsung memverifikasi hasilnya:
```bash
SEED_ENV=local SEED_CONFIRM_PROJECT_REF=local SEED_PASSWORD="RahasiaSIAJAR2026!" npm run seed:akademik -- --apply
```

### C. Mode Reset (`--reset`)
Menghapus seluruh akun seed berdomain `.test` beserta data turunannya (program studi 351 dan semester Ganjil 2026/2027):
```bash
SEED_ENV=local SEED_CONFIRM_PROJECT_REF=local SEED_PASSWORD="RahasiaSIAJAR2026!" npm run seed:akademik -- --reset
```

### D. Mode Verifikasi Database (`--verify`)
Menjalankan kueri pengujian verifikasi terhadap database aktif tanpa menulis ulang data:
```bash
SEED_ENV=local SEED_CONFIRM_PROJECT_REF=local SEED_PASSWORD="RahasiaSIAJAR2026!" npm run seed:akademik -- --verify
```

### E. Mode Generator Lapisan Legacy (`--generate-legacy`)
Menghasilkan ulang berkas TypeScript `src/lib/db/seed-data.uir-ti-2026.generated.ts` dari berkas CSV sumber:
```bash
npm run seed:akademik -- --generate-legacy
```

---

## 4. Daftar Akun Contoh (Login Demo)

Semua akun masuk menggunakan **NIM / NIDN / NIP** dan kata sandi yang disetel pada `SEED_PASSWORD`.

### A. Mahasiswa (NIM 9-Digit)
| NIM | Nama | Angkatan | Rombel | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `263510001` | Muhammad Farhan Pratama | 2026 | 1A | Mahasiswa Semester 1 (6 kelas inti paket) |
| `253510001` | Muhammad Rizky Ramadhan | 2025 | 3A | Mahasiswa Semester 3 (6 kelas inti paket) |
| `243510001` | Ahmad Dani Kurniawan | 2024 | 5A | Mahasiswa Semester 5 (6 kelas inti + 1 kelas pilihan) |
| `233510001` | Muhammad Aditya Pratama | 2023 | 7A | Mahasiswa Semester 7 + Asisten Dosen (4 kelas asistensi) |

### B. Asisten Dosen (NIM Mahasiswa yang Ditugaskan)
| NIM | Nama | Angkatan | Rombel | Kelas yang Dibantu |
| :--- | :--- | :---: | :---: | :--- |
| `233510001` | Muhammad Aditya Pratama | 2023 | 7A | Praktikum Algoritma & Pemrograman (1A, 1B), Basis Data I (3A, 3B) |
| `233510002` | Dwi Rahmawati Putri | 2023 | 7A | Praktikum Algoritma (1C), Basis Data I (3C), Struktur Data (3A, 3B) |
| `243510006` | Dimas Setiawan Putra | 2024 | 5B | Praktikum Sistem Operasi (3A, 3B), Rekayasa PL (5A) |

### C. Dosen (NIDN 10-Digit)
| NIDN | Nama Lengkap | Peran / Jabatan | Mata Kuliah / Perwalian |
| :--- | :--- | :--- | :--- |
| `2008000307` | Dr. Ir. Rahmawati Kartika Sari, M.Sc. | **Kaprodi** & Dosen (`D004`) | Struktur Data (Kelas 3A–3E) |
| `2011000318` | Dr. Ir. Dosen Wali 2023 A, M.Kom. | Dosen Pengampu & **Dosen Wali** (`D018`) | Dosen Wali 15 Mhs Angkatan 2023 |
| `2015000324` | Dr. Dosen Wali 2025 A, M.Kom. | Dosen Pengampu & **Dosen Wali** (`D024`) | Dosen Wali 15 Mhs Angkatan 2025 |
| `2004000302` | Dr. Ir. Pengganti Dekan Satu, M.T. | Pejabat Fakultas (`D002`) | Tidak memiliki jadwal mengajar |

### D. Staf dan Administrator (NIP 8-Digit)
| NIP | Nama Lengkap | Peran Sistem | Jabatan Akademik |
| :--- | :--- | :--- | :--- |
| `20120009` | Rahmat Hidayat, S.Kom. | `SUPER_ADMIN` + `SYSTEM_ADMIN` | Administrator Utama Sistem SIAJAR |
| `20160042` | Bambang Prasetyo, S.Kom. | `SYSTEM_ADMIN` | Administrator Infrastruktur IT |
| `20110017` | Siti Nurhaliza, A.Md. | `ACADEMIC_STAFF` | Staf Pelayanan Akademik & KRS |

---

## 5. Ringkasan Bentrok Jadwal Sumber

Sebagaimana diamanatkan dalam instruksi, **data bentrok dari jadwal asli tidak diubah diam-diam**, melainkan dipertahankan apa adanya untuk menguji mekanisme deteksi konflik:

1. **Bentrok Dosen (31 Kasus / 16 Dosen Terdampak)**:
   - 26 bentrok antara komponen Praktikum dan Teori (dosen bertindak sebagai penanggung jawab materi, pelaksanaan praktikum di laboratorium dibantu asisten dosen).
   - 3 bentrok antara dua sesi Praktikum di lab berbeda pada jam yang sama.
   - 2 bentrok antara dua sesi Teori.
2. **Bentrok Ruang (6 Kasus)**:
   - Tumpang tindih 15 menit antara blok 3 SKS (13:00–15:30) dengan sesi berikutnya yang dijadwalkan mulai pukul 15:15 pada ruang LAB 1, LAB 2, LAB 3, LAB 4, RT 201, dan RT 202.
3. **Bentrok Rombel (4 Kasus)**:
   - Rombel 5E, 5F, 5A (tumpang tindih 15 menit pada blok praktikum/teori).
   - Rombel 1D (tumpang tindih 50 menit pada hari Rabu antara Bahasa Inggris dan Dasar Pemrograman).
4. **Bentrok Jadwal Mahasiswa Terdaftar (19 Mahasiswa)**:
   - Terdampak oleh bentrok rombel sumber serta pemilihan kelas mata kuliah pilihan yang berhimpitan waktu dengan kelas inti rombel.

---

## 6. Asumsi yang Diterapkan & Status Konfirmasi

| No | Asumsi Teknis | Status | Catatan Implementasi |
| :---: | :--- | :---: | :--- |
| 1 | Tanggal mulai perkuliahan disetel ke `2026-08-31` (Senin). | *Belum Dikonfirmasi* | Digunakan sebagai dasar penghitungan tanggal sesi pertemuan opsional. |
| 2 | Kapasitas ruang disetel ke 40 (ruang teori) dan 30 (laboratorium). | *Belum Dikonfirmasi* | Menggunakan nilai `kapasitas_perkiraan` dari `ruang.csv`. |
| 3 | NIDN dan NIP fiktif mengikuti pola tahun masuk kampus. | *Belum Dikonfirmasi* | NIM 9 digit, NIDN 10 digit, NIP 8 digit. |
| 4 | Kode kurikulum sebagai kode utama `courses.code`, kode jadwal sebagai alias di `course_code_aliases`. | *Belum Dikonfirmasi* | Memastikan konsistensi kurikulum dengan tetap mendukung pencarian via kode jadwal. |
| 5 | Pejabat Fakultas (Wakil Dekan I) dimasukkan sebagai `D002` tanpa jadwal mengajar. | *Belum Dikonfirmasi* | Disediakan akun profilnya tanpa relasi mengajar aktif. |
