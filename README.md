# SIAJAR — Sistem Informasi Ajar Terpadu

> [!CAUTION]
> **PERINGATAN PENTING DEPLOYMENT:**
> **JANGAN DEPLOY ke production sebelum Fase 2E selesai.**
> Sistem navigasi dan perampingan rute sedang dalam masa transisi restrukturisasi Hub Bertab (Fase 2A - 2E). Fitur-fitur untuk Staf, Koordinator Prodi, System Admin, dan Super Admin yang belum di-hub-kan sementara tidak terjangkau langsung dari menu navigasi ringkas sidebar sampai fase masing-masing selesai.

Implementasi dokumen perencanaan `docs/SIAJAR_Dokumen_Lengkap_v3.md` (Next.js 14, Supabase, RLS). Satu ruang kerja akademik untuk kelas, materi, pengumuman, tugas, penilaian, notifikasi, dan kalender, dengan role Mahasiswa, Dosen, Koordinator Prodi, dan Staf Akademik.

## Status terhadap rencana

| Bagian rencana | Status |
| --- | --- |
| Login, role, pilih workspace, perangkat dan sesi | Ada (bawaan proyek) |
| Master data minimal: program studi, semester, mata kuliah (Staf Akademik) | Selesai |
| Kelas dengan kode kelas, enrollment, daftar anggota | Selesai |
| Materi, pengumuman, tugas, pengumpulan jawaban teks | Selesai |
| Review, nilai draf dan final, riwayat nilai, perubahan nilai final dengan persetujuan koordinator | Selesai |
| Notifikasi in-app dan kalender tenggat | Selesai; dilengkapi pengingat H-1 otomatis |
| Rekap nilai kelas dan ekspor CSV (dosen), ekspor tercatat di audit | Selesai; dilengkapi gradebook berbobot dinamis & konversi huruf mutu |
| Audit log aksi sensitif | Selesai untuk modul di atas |
| Delegasi izin asisten dosen per kelas (review, nilai draf, materi, pengumuman, tugas); finalisasi tetap hanya dosen | Selesai |
| Diskusi kelas: topik, balasan, sematkan, kunci, dan sembunyikan balasan (dosen) | Selesai |
| Presensi interaktif (pertemuan 1-16, kode verifikasi, syarat UAS 75%) | Selesai |
| Kuis & Bank Soal (pilihan ganda, esai, auto-grading, timer pengerjaan) | Selesai |
| Format Markdown untuk materi dan pengumuman | Selesai |
| AI Academic Assistant (asisten akademik pintar terintegrasi) | Selesai |

## Menjalankan

**Mode demo (tanpa Supabase).** Data disimpan di memori server dan hilang saat server dimulai ulang.

```bash
npm install
npm run dev   # buka http://localhost:3000/login
```

Sandi semua akun demo: `Password123!`. Identifier: Mahasiswa `2024001`, Dosen `0012345678`, Koordinator `0087654321`, Staf Akademik `198501012010121001`.

**Mode penuh (Supabase lokal).**

```bash
supabase init        # sekali saja, membuat supabase/config.toml
supabase start
supabase db reset    # menerapkan migrasi dan seed
cp .env.example .env.local   # isi kunci dari `supabase status`
npm run dev
```

## Pengujian

```bash
npm run typecheck && npm run lint && npm run cek:hex && npm run check:rls && npm test
supabase test db      # pgTAP: RLS dan aturan bisnis
npx playwright test   # E2E, memakai mode demo
```

## Cadangan dan pemulihan

`scripts/backup-db.sh` membuat cadangan skema `public`; `scripts/restore-test.sh` memulihkannya ke basis data lain (staging atau lokal, bukan produksi) lalu membandingkan jumlah baris tiap tabel. Jadwalkan `backup-db.sh` bila memakai paket gratis Supabase (Bagian 15.4).

## Batasan yang diketahui

- Mode demo tidak memiliki data prodi, sehingga koordinator demo melihat semua pengajuan perubahan nilai. Pembatasan per prodi berlaku di database.
- Kelas tanpa mata kuliah belum memiliki koordinator yang berwenang menyetujui perubahan nilai.
- Izin asisten untuk menerbitkan materi, pengumuman, dan tugas sudah ditegakkan di database, tetapi antarmuka asisten baru mencakup peninjauan pengumpulan dan nilai draf.
- Materi, pengumuman, dan petunjuk tugas ditampilkan sebagai teks biasa, belum Markdown.
- Pembatas percobaan kode kelas (8 kode salah per 10 menit) dan pembatas login memakai memori per instance server; pada serverless gunakan Redis eksternal (Bagian 9.2).
- Ekspor CSV rekap nilai memuat nama mahasiswa tanpa NIM, dan sel yang diawali `=`, `+`, `-`, atau `@` diberi awalan petik untuk mencegah CSV injection.
- CSP penuh (`script-src` dengan nonce) belum diterapkan; header keamanan dasar aktif di `next.config.mjs`.
- Halaman di route group `(dashboard)` adalah sisa SIAKAD dan di luar cakupan MVP SIAJAR.

---

> Bagian di bawah ini adalah dokumentasi lama (SIAKAD) dan belum diperbarui.

# SIAKAD - Sistem Informasi Akademik Berbasis Web

Aplikasi Sistem Informasi Akademik (SIAKAD) modern siap pakai dan siap deploy ke Vercel. Dibangun dengan Next.js 14 (App Router), TypeScript Strict, Supabase (PostgreSQL + Auth + Storage), Prisma ORM, dan Tailwind CSS dengan sistem token desain terpadu.

---

## 📌 Ringkasan 15 Fitur Utama (F1 - F15)

1. **F1. Autentikasi & Otorisasi Ketat Berbasis Peran**
   - Mahasiswa masuk via **Google OAuth** khusus domain email student (`ALLOWED_EMAIL_DOMAIN`, contoh: `student.uir.ac.id`). Domain diverifikasi persis di server; akun tidak dibuat otomatis jika belum terdaftar pada data mahasiswa.
   - Administrator dan Dosen masuk via **Email dan Kata Sandi** terverifikasi.
   - Otorisasi hak akses 100% di sisi server; pencegahan akses lintas peran (misal mahasiswa mencoba rute `/admin` ditolak seketika).
2. **F2. Data Master Terpadu & Impor CSV**
   - CRUD Mahasiswa, Dosen, Program Studi, Mata Kuliah, Kelas, Ruang, dan Tahun Ajaran.
   - Soft-delete status aktif agar riwayat nilai dan kelulusan mahasiswa tetap terlindungi.
   - Penetapan Dosen Wali per mahasiswa.
   - Fitur Impor CSV 3-tahap (Unggah $\rightarrow$ Pratinjau validasi baris gagal dengan error detail $\rightarrow$ Konfirmasi simpan transaksional).
3. **F3. Kurikulum & Prasyarat Cerdas**
   - Manajemen kurikulum per program studi beserta semester paket dan jenis (wajib/pilihan).
   - Pengaturan mata kuliah prasyarat dengan ambang nilai minimal kelulusan.
   - Deteksi siklus ketergantungan melingkar (*circular prerequisite*) menggunakan algoritma penelusuran graf DFS (misal: A butuh B, B butuh A ditolak).
4. **F4. Jadwal Kuliah & Deteksi Bentrok**
   - Penyusunan jadwal per kelas, hari, rentang jam, ruang, dan dosen pengampu.
   - Algoritma `adaBentrok` dengan jam selesai eksklusif (kelas 08:00–09:40 tidak bentrok dengan 09:40–11:20).
   - Deteksi bentrok multi-dimensi: jadwal mengajar dosen, pemakaian ruangan, dan jadwal kuliah mahasiswa saat KRS.
5. **F5. KRS Online & Persetujuan Dosen Wali**
   - Pengisian hanya dibuka pada masa aktif Kalender Akademik.
   - Batas kuota SKS dihitung dinamis dari IPS semester sebelumnya (IPS $\ge 3.00 \rightarrow 24$ SKS; $2.50\text{--}2.99 \rightarrow 21$ SKS; $2.00\text{--}2.49 \rightarrow 18$ SKS; $< 2.00 \rightarrow 15$ SKS).
   - Validasi waktu nyata: prasyarat lulus, kapasitas ruang/kuota kelas, dan bentrok waktu.
   - Alur status: `DRAF` $\rightarrow$ `DIAJUKAN` $\rightarrow$ `DISETUJUI` / `DITOLAK` dengan catatan dari Dosen Wali.
6. **F6. Input & Finalisasi Nilai Berkomponen**
   - Dosen menyusun komponen penilaian kelas (Tugas, Kuis, UTS, UAS, Praktikum) dengan syarat total bobot tepat 100%.
   - Entri nilai per mahasiswa atau via berkas CSV, rentang angka valid 0 sampai 100.
   - Finalisasi nilai mengunci lembar nilai secara permanen (`TERKUNCI / FINAL`).
   - Koreksi nilai setelah finalisasi hanya dapat dilakukan oleh Admin dengan kewajiban mencatat alasan tertulis yang tersimpan permanen pada Log Audit.
7. **F7. KHS, Transkrip Kumulatif & Dokumen PDF Resmi**
   - Kartu Hasil Studi (KHS) per semester memuat IPS dan SKS semester berjalan.
   - Transkrip Nilai Kumulatif memuat IPK dan Total SKS Lulus.
   - Aturan nilai terbaik: mata kuliah yang diulang secara otomatis mengambil nilai mutu tertinggi dan SKS hanya dihitung satu kali.
   - Generator PDF resmi (`@react-pdf/renderer`) untuk cetak KHS dan Transkrip lengkap dengan kop institusi, tanggal cetak, dan nomor dokumen unik.
8. **F8. Presensi Perkuliahan & Ambang Syarat UAS**
   - Dosen membuka pertemuan kuliah 1 s/d 16 dan menandai status presensi (Hadir, Izin, Sakit, Alpa) dengan nilai bawaan Hadir.
   - Rekap persentase kehadiran dihitung otomatis per mata kuliah.
   - Peringatan dini di dashboard mahasiswa jika kehadiran $< 80\%$.
   - Ambang kehadiran minimal $\ge 75\%$ menjadi syarat mutlak mengikuti Ujian Akhir Semester (UAS).
9. **F9. Bimbingan Dosen Wali**
   - Media konsultasi akademik digital antara mahasiswa dan dosen pembimbing wali.
   - Riwayat bimbingan tersimpan rapi, terhubung dengan capaian IPS per semester dan status pengajuan KRS.
10. **F10. Materi Perkuliahan & Pengumpulan Tugas**
    - Dosen mengunggah modul bahan ajar kuliah.
    - Dosen membuat penugasan terstruktur dengan batas tenggat waktu.
    - Mahasiswa mengumpulkan tugas daring; keterlambatan pengumpulan (`waktuKumpul > tenggat`) ditandai otomatis oleh sistem.
    - Dosen memberikan skor evaluasi dan umpan balik tugas.
11. **F11. Jadwal & Kartu Ujian (UTS & UAS)**
    - Jadwal pelaksanaan ujian per kelas, waktu, dan ruangan.
    - Kartu Ujian Digital PDF hanya diterbitkan bila **3 syarat terpenuhi**:
      1. KRS berstatus `DISETUJUI`.
      2. Tagihan UKT berstatus `LUNAS` atau `DISPENSASI`.
      3. Kehadiran presensi perkuliahan $\ge 75\%$.
    - Jika ada syarat yang belum lengkap, sistem secara transparan memberikan notifikasi dan panduan perbaikan.
12. **F12. Pembayaran UKT & Dispensasi Keuangan**
    - Tagihan UKT diterbitkan oleh admin setiap awal semester.
    - Status tagihan `BELUM LUNAS` secara otomatis mengunci pengisian KRS mahasiswa.
    - Admin dapat memberikan status `DISPENSASI` dengan catatan alasan dan tenggat waktu perpanjangan untuk membuka akses KRS.
13. **F13. Pengumuman Akademik Bertarget & Kalender Akademik**
    - Publikasi pengumuman dengan target fleksibel: `SEMUA`, per `PRODI`, atau per `ANGKATAN`.
    - Penanda status telah dibaca (*read tracking*) per mahasiswa.
    - Kalender akademik dinamis pengendali gerbang jadwal pengisian KRS, ujian, dan masa perkuliahan.
14. **F14. Layanan Pengajuan Surat Keterangan Digital**
    - Mahasiswa mengajukan permohonan surat (Surat Keterangan Aktif Kuliah, Surat Cuti Akademik, Surat Rekomendasi).
    - Verifikasi oleh admin: `DIAJUKAN` $\rightarrow$ `DISETUJUI` / `DITOLAK`.
    - Saat disetujui, nomor registrasi resmi diterbitkan secara otomatis dan berkas PDF bertanda tangan digital dapat langsung diunduh mahasiswa.
15. **F15. Dashboard Analitik & Laporan Akademik Terpadu**
    - Dashboard Mahasiswa: IPK, SKS Lulus, Status KRS, Status UKT, Peringatan Presensi, dan Jadwal Kuliah Hari Ini.
    - Dashboard Dosen: Kelas diampu, antrean perwalian KRS, lembar nilai belum difinalisasi, dan Akses Laporan Kaprodi (`/dosen/laporan`).
    - Dashboard Administrator: Statistik operasional, Visualisasi Grafik Batang Recharts (Jumlah Mahasiswa per Prodi & Sebaran Rata-Rata IPK per Angkatan).
    - Ekspor Laporan Excel (`.xlsx` via `exceljs`) multi-sheet: *Mahasiswa & Prestasi* dan *Log Audit Sistem*.
    - Audit Trail Log (`/admin/audit`): Rekaman permanen waktu, pengguna, peran, aksi, nilai lama, dan nilai baru untuk setiap modifikasi data sensitif.

---

## 🎨 Standar Desain & Antarmuka (Bab VII)

Sistem dirancang mengutamakan ketenangan, kerapian, dan kejelasan alat kerja profesional:
- **Palet Warna Resmi**:
  - Latar Halaman: `#F6F7F9`
  - Permukaan Kartu & Dialog: `#FFFFFF`
  - Garis Tepi (Border): `#E4E7EC`
  - Teks Utama: `#101828`
  - Teks Sekunder: `#667085`
  - Biru Utama (Primary): `#2A4DB7` (Hover: `#233F96`)
  - Biru Tint: `#EEF2FC`
  - Sukses: `#157F4B`
  - Peringatan: `#B45309`
  - Bahaya: `#C0362C`
- **Aturan Visual**: Tanpa gradien warna, tanpa bayangan tebal di luar palet.
- **Radius**: Tepat 8px untuk kontrol (tombol, input) dan 12px untuk kontainer (kartu, dialog).
- **Tipografi**: Font *Inter* dengan skala ukuran terstandarisasi.
- **Responsif**: Nyaman digunakan dari layar ponsel pintar **lebar 360 px** hingga desktop layar lebar.

---

## 👥 Akun Demo Pengujian (Data Seed Bawaan)

Sistem telah dilengkapi dengan data seed realistis untuk simulasi langsung:

| Peran | Akun Login / Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@uir.ac.id` | `Admin123!` | Akses penuh seluruh master data, kalender, surat, koreksi nilai, audit log |
| **Dosen & Kaprodi** | `ardiansyah@dosen.uir.ac.id` | `Dosen123!` | Dr. Ardiansyah, S.T., M.Kom. (Dosen Wali & Kaprodi Teknik Informatika) |
| **Dosen Pengampu** | `dedi@dosen.uir.ac.id` | `Dosen123!` | Dedi Irawan, M.Kom. (Pengampu Basis Data & Sistem Operasi) |
| **Mahasiswa** | `223510001@student.uir.ac.id` | Masuk via Google OAuth | Wahyu Aldi Riyanto (NIM: 223510001, Teknik Informatika 2022) |
| **Mahasiswa** | `223510002@student.uir.ac.id` | Masuk via Google OAuth | Siti Nur Aisyah (NIM: 223510002, Teknik Informatika 2022) |

---

## ⚡ Panduan Instalasi Lokal (< 15 Menit)

### 1. Prasyarat Sistem
- **Node.js**: Versi 18.17.0 atau 20.x
- **NPM**: Versi 9.x atau lebih baru
- **Git**

### 2. Kloning Repositori & Instalasi Dependensi
```bash
# 1. Kloning repositori
git clone https://github.com/username/siakad.git
cd siakad

# 2. Instal seluruh pustaka dependensi
npm install
```

### 3. Konfigurasi Environment Variables
Salin berkas `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan nilai konfigurasi berikut:
```env
# Koneksi Basis Data PostgreSQL (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[REF].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[REF].supabase.com:5432/postgres"

# Kunci API Supabase Client & Auth
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_PUBLIC_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_SECRET]"

# Batasan Domain Email Mahasiswa Google OAuth
ALLOWED_EMAIL_DOMAIN="student.uir.ac.id"

# Alamat Dasar Aplikasi
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Sinkronisasi Skema Basis Data & Seed Data
```bash
# Generate Prisma Client
npx prisma generate

# (Opsional jika tersambung langsung ke Supabase PostgreSQL)
# npx prisma db push
# npx prisma db seed
```

### 5. Menjalankan Pengujian Otomatis (Unit Testing)
Proyek ini dilengkapi dengan 55 unit test otomatis untuk seluruh modul logika bisnis akademik murni:
```bash
npm run test
```
*Hasil yang diharapkan: 55 unit test lulus 100% tanpa galat.*

### 6. Menjalankan Server Pengembangan Lokal
```bash
npm run dev
```
Buka peramban Anda di `http://localhost:3000`.

---

## 🚀 Panduan Deployment ke Vercel, Supabase & Google Cloud

### Langkah 1: Persiapan Proyek Supabase
1. Masuk ke [supabase.com](https://supabase.com) dan buat proyek baru.
2. Buka menu **Project Settings $\rightarrow$ Database**:
   - Salin **Connection string (Transaction / Pooled)** sebagai `DATABASE_URL`.
   - Salin **Connection string (Direct / Session)** sebagai `DIRECT_URL`.
3. Buka menu **Project Settings $\rightarrow$ API**:
   - Salin **Project URL** sebagai `NEXT_PUBLIC_SUPABASE_URL`.
   - Salin **anon/public key** sebagai `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Salin **service_role key** sebagai `SUPABASE_SERVICE_ROLE_KEY`.
4. Buka menu **Storage**, buat bucket privat baru bernama `siakad-storage` untuk berkas materi, tugas, dan lampiran.
5. Jalankan migrasi dan seeding ke database Supabase:
   ```bash
   npx prisma db push
   ```

### Langkah 2: Persiapan Google OAuth di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com).
2. Konfigurasikan **OAuth Consent Screen** (User Type: External).
3. Buat **OAuth Client ID** dengan Application Type: *Web application*.
4. Pada kolom **Authorized redirect URIs**, masukkan alamat callback Supabase Auth:
   ```
   https://[REF-PROYEK-SUPABASE].supabase.co/auth/v1/callback
   ```
5. Buka dasbor **Supabase $\rightarrow$ Authentication $\rightarrow$ Providers $\rightarrow$ Google**:
   - Aktifkan provider Google.
   - Masukkan **Client ID** dan **Client Secret** dari Google Cloud Console.
6. Pada **Supabase $\rightarrow$ Authentication $\rightarrow$ URL Configuration**:
   - Masukkan *Site URL* produksi (misal: `https://siakad.vercel.app`).
   - Tambahkan URL redirect lokal dan produksi ke daftar *Redirect URLs*.

### Langkah 3: Deployment ke Vercel
1. Unggah repositori ke GitHub / GitLab.
2. Masuk ke dasbor [vercel.com](https://vercel.com) dan pilih **Add New $\rightarrow$ Project**.
3. Hubungkan repositori proyek SIAKAD.
4. Pada bagian **Environment Variables**, masukkan seluruh variabel yang ada pada `.env.example`:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_EMAIL_DOMAIN` (contoh: `student.uir.ac.id`)
   - `NEXT_PUBLIC_APP_URL` (contoh: `https://siakad-anda.vercel.app`)
5. Pada *Build & Development Settings*, pastikan command build menjalankan `npx prisma generate && next build` (sudah dikonfigurasi pada `package.json`).
6. Klik **Deploy**. Aplikasi akan selesai di-deploy dalam waktu kurang dari 2 menit.

---

## 🛡️ Pengujian Keamanan & Pengecekan Kualitas Kode

Sebelum dilakukan kompilasi atau deploy, selalu pastikan seluruh quality gates terpenuhi:

```bash
# 1. Pengecekan unit testing
npm run test

# 2. Pengecekan linter Next.js
npm run lint

# 3. Pengecekan tipe TypeScript strict (zero error, zero any)
npx tsc --noEmit

# 4. Uji kompilasi build produksi Next.js
npm run build
```

---

## 📂 Struktur Proyek
```
siakad/
├── prisma/
│   ├── schema.prisma             # Skema Prisma 28 Model Basis Data
│   └── seed.ts                   # Eksekutor Seed Data
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── (auth)/               # Rute Autentikasi (/login)
│   │   ├── (dashboard)/          # Dashboard per Peran (/admin, /dosen, /mahasiswa)
│   │   └── api/                  # Route Handlers (Unduhan PDF & Ekspor Excel)
│   ├── components/               # Komponen Antarmuka
│   │   ├── shared/               # Shell Dashboard, Sidebar Mobile Drawer, Topbar
│   │   └── ui/                   # Komponen Primitif (Button, Card, Dialog, Badge, dll)
│   ├── features/                 # Modular Domain Features
│   │   ├── administrasi/         # Pengumuman & Kalender Akademik
│   │   ├── bimbingan/            # Bimbingan Dosen Wali
│   │   ├── dashboard/            # Komponen Analitik Recharts
│   │   ├── jadwal/               # Jadwal Kuliah & Alokasi Ruang
│   │   ├── krs/                  # Pengisian & Validasi KRS
│   │   ├── master/               # Data Master & Impor CSV 3-Tahap
│   │   ├── materi-tugas/         # Modul Pembelajaran & Penugasan
│   │   ├── nilai/                # Penilaian, Komponen Bobot, & Koreksi Admin
│   │   ├── presensi/             # Absensi & Monitoring Kehadiran
│   │   ├── surat/                # Layanan Pengajuan Surat Digital
│   │   ├── ujian/                # Jadwal & Verifikasi Kartu Ujian
│   │   └── ukt/                  # Keuangan UKT & Dispensasi
│   └── lib/                      # Utilitas & Pustaka Murni
│       ├── akademik/             # Logika Bisnis Murni (IPS, IPK, Bentrok, Prasyarat, SKS)
│       ├── auth/                 # Sesi Cookie & Validasi Domain Email
│       ├── db/                   # Klien Prisma & Seed Data Realistis
│       └── pdf/                  # Templat PDF Dokumen Resmi (@react-pdf/renderer)
├── docs/
│   ├── keputusan.md              # Log Keputusan Arsitektur & Teknis
│   ├── prompt-siakad-antigravity.md # Brief Kerja
│   └── Dokumen-Perencanaan-SIAKAD.pdf # Dokumen Perencanaan Lengkap
├── .env.example                  # Template Environment Variables
└── README.md                     # Dokumentasi Lengkap Proyek
```

---
Dibuat dengan dedikasi untuk mendukung tata kelola administrasi akademik perguruan tinggi yang transparan, andal, dan berstandar mutu tinggi.
