# SIAKAD - Sistem Informasi Akademik Berbasis Web (Dokumentasi Lama / Arsip)

> [!NOTE]
> Berkas ini merupakan arsip dokumentasi lama SIAKAD sebelum migrasi dan transformasi menyeluruh ke **SIAJAR (Sistem Informasi Ajar Terpadu)**. Disimpan untuk tujuan penelusuran historis.

---

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
   - Validasi bentrok 3 lapis: Bentrok Dosen, Bentrok Ruang, dan Bentrok Mahasiswa.
5. **F5. Kartu Rencana Studi (KRS) & Validasi SKS**
   - Batas maksimal SKS adaptif sesuai indeks prestasi semester (IPS) sebelumnya.
   - Validasi prasyarat kelulusan mata kuliah sebelum mengizinkan pengambilan KRS.
   - Alur persetujuan: Draf Mahasiswa $\rightarrow$ Diajukan $\rightarrow$ Disetujui/Ditolak Dosen Wali.
6. **F6. Penilaian Fleksibel, Komponen Bobot, & Koreksi Admin**
   - Dosen mengatur formula bobot: Kehadiran, Tugas, Kuis, UTS, UAS (total wajib 100%).
   - Konversi nilai akhir otomatis ke skala huruf mutu (A, A-, B+, ..., E).
   - Masa penguncian nilai setelah batas waktu semester.
   - Perubahan nilai pasca-finalisasi wajib melalui pengajuan perubahan nilai dengan persetujuan Koordinator Prodi.
7. **F7. Transkrip Nilai & Cetak PDF Resmi**
   - Perhitungan otomatis IPS dan IPK secara akurat.
   - Generator PDF (@react-pdf/renderer) untuk Kartu Hasil Studi (KHS) dan Transkrip Akademik Lengkap.
8. **F8. Presensi Mahasiswa & Monitoring Kehadiran**
   - Rekap persentase kehadiran per mahasiswa.
   - Peringatan dini jika kehadiran di bawah 75% (syarat mengikuti UAS).
9. **F9. Bimbingan Akademik Online (Dosen Wali)**
   - Riwayat konsultasi bimbingan akademik antara mahasiswa dan dosen wali.
10. **F10. Pembayaran UKT & Validasi Status Keuangan**
    - Sinkronisasi status tagihan UKT lunas/belum lunas.
    - Pembatasan pengisian KRS hanya untuk mahasiswa dengan UKT berstatus lunas atau dispensasi aktif.
11. **F11. Layanan Pengajuan Surat Mahasiswa**
    - Pengajuan surat aktif kuliah, cuti akademik, dan rekomendasi beasiswa.
    - Penerbitan surat resmi berformat PDF lengkap dengan penomoran otomatis.
12. **F12. Manajemen Ujian & Kartu Ujian**
    - Penjadwalan UTS & UAS per mata kuliah.
    - Pencetakan Kartu Ujian ber-barcode hanya bagi mahasiswa yang memenuhi syarat presensi dan keuangan.
13. **F13. Modul Pembelajaran & Penugasan Kuliah (LMS Ringan)**
    - Unggah materi kuliah (PDF, dokumen, video link).
    - Pengumpulan tugas mahasiswa berbatas waktu.
14. **F14. Pengumuman Terarah & Kalender Akademik**
    - Pengumuman berbasis segmentasi peran (seluruh kampus, dosen saja, mahasiswa saja).
    - Kalender kegiatan penting akademik (registrasi, perkuliahan, UTS, UAS, libur).
15. **F15. Dasbor Analitik & Laporan Eksekutif**
    - Grafik distribusi nilai per prodi dan mata kuliah (Recharts).
    - Statistik kelulusan tepat waktu, rata-rata IPK, dan tren penerimaan mahasiswa.

---

## 🛠️ Langkah Menjalankan Aplikasi

### 1. Prasyarat Sistem
- Node.js versi 18.17+ atau 20+
- Proyek Supabase aktif (URL & Kunci Anonim + Kunci Service Role)
- Akun Google Cloud Console (untuk OAuth 2.0 login Mahasiswa)

### 2. Pemasangan Dependensi
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Salin berkas `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Sinkronisasi Basis Data & Prisma
```bash
# Generate Prisma Client
npx prisma generate

# Migrasi Skema Basis Data ke Supabase
npx prisma db push

# Menjalankan Seed Data Awal
npx prisma db seed
```

### 5. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses sistem melalui browser pada `http://localhost:3000`.

---

## 🚀 Panduan Deployment ke Vercel

1. Push kode ke repositori Git (GitHub/GitLab).
2. Buat proyek baru di [Vercel](https://vercel.com).
3. Pilih framework preset: **Next.js**.
4. Masukkan seluruh konfigurasi variabel lingkungan produksi di dashboard Vercel:
   - `DATABASE_URL` (Connection string Pooling Supabase Port 6543)
   - `DIRECT_URL` (Connection string Direct Supabase Port 5432)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_EMAIL_DOMAIN` (contoh: `student.uir.ac.id`)
   - `NEXT_PUBLIC_APP_URL` (contoh: `https://siakad-anda.vercel.app`)
5. Pada *Build & Development Settings*, pastikan command build menjalankan `npx prisma generate && next build`.
6. Klik **Deploy**.
