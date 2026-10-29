# SIAJAR — Sistem Informasi Ajar Terpadu

Implementasi dokumen perencanaan `docs/SIAJAR_Dokumen_Lengkap_v3.md` dan `docs/INSTRUKSI_MENU_BERFUNGSI.md` menggunakan Next.js 14 (App Router), TypeScript Strict, Supabase (PostgreSQL, Auth, Storage, RLS), Prisma ORM, dan Tailwind CSS dengan desain Window Brutalist Retro.

Satu ruang kerja akademik terpadu untuk pembelajaran, perkuliahan, evaluasi, dan tata kelola perguruan tinggi yang melayani 9 peran pengguna: **Mahasiswa**, **Asisten Dosen / Lab (TA)**, **Dosen Pengampu** (dengan tugas melekat **Dosen Wali**), **Koordinator Program Studi (Kaprodi)**, **Sekretaris Program Studi (Sekprodi)**, **Kepala Laboratorium (Kalab)**, **Staf Akademik**, **Administrator Sistem**, dan **Super Administrator**.

---

## 📌 Status Implementasi dan Verifikasi Menu

Seluruh **149 menu** pada 9 peran pengguna telah diaudit dan berstatus **BERFUNGSI (100%)** dengan integrasi database nyata, server actions, penegakan otorisasi di peladen, dan 0 tampilan tiruan (*zero dummy data*).

| Modul & Kapabilitas | Status | Keterangan |
| --- | --- | --- |
| Autentikasi, Multi-Role, Pilih Workspace & Sesi Perangkat | **Selesai** | Proteksi fail-closed, mitigasi timing-attack, pembersihan session cookie aman. |
| Master Data: Prodi, Kurikulum, Dosen, Mahasiswa, Ruang, Jadwal | **Selesai** | CRUD lengkap, validasi Zod, impor massal CSV 3-tahap transaksional. |
| Manajemen Kelas, Kode Gabung, Enrollment & Delegasi Asisten | **Selesai** | Pembatasan laju gabung kelas (Upstash Redis), izin delegasi asisten dosen terisolasi. |
| Modul Materi, Pengumuman, Tugas & Pengumpulan Berkas | **Selesai** | Penjadwalan terbit (*release_at*), pelacakan progres, perpanjangan tenggat, denda keterlambatan. |
| Format Markdown untuk Materi, Pengumuman & Tugas | **Selesai** | Komponen penampil Markdown terintegrasi dengan sanitasi keamanan XSS (blokir skema `javascript:`). |
| Penilaian, Rubrik Bertingkat, Rekap & Sanggah Nilai | **Selesai** | Buku nilai berbobot, konversi huruf mutu otomatis, alur sanggah 7 hari, persetujuan Kaprodi. |
| CBT, Bank Soal, Remedial & Evaluasi CPL/CPMK | **Selesai** | Autosave IndexedDB, token susulan, analisis butir soal, diagram radar CPL nyata. |
| Presensi Interaktif & Berita Acara Perkuliahan (BAP) | **Selesai** | Pertemuan 1–16, kode verifikasi, syarat UAS 75%, izin/sakit berbukti, ekspor Excel BAP. |
| Forum Diskusi Kelas, Polling & Komunitas Kampus | **Selesai** | Topik, balasan, pin, kunci, pelarangan pesan antarmahasiswa langsung demi privasi. |
| Layanan Pengajuan Surat Mahasiswa & Verifikasi Staf | **Selesai** | Nomor registrasi otomatis, generator dokumen PDF resmi (`@react-pdf/renderer`). |
| Asisten Akademik AI & Analisis Dini (Early Warning System) | **Selesai** | Deteksi mahasiswa berisiko multi-indikator, konsen AI, fail-safe saat kunci API kosong. |
| Log Audit, Pemantauan Sistem & Kebijakan Institusi | **Selesai** | Pencatatan aksi sensitif, masking data pribadi untuk System Admin, 21 kebijakan dinamis. |

---

## 🚀 Menjalankan Aplikasi

### 1. Mode Demo / Pengembangan Lokal (Offline-Safe)
Mode demo memungkinkan pengujian cepat tanpa koneksi Supabase langsung. Data interaksi tersimpan di adapter memori server lokal.

```bash
npm install
npx prisma generate
npm run dev   # Buka http://localhost:3000/login
```

> [!NOTE]
> **Kredensial Akun Demo (Hanya untuk Lokal/Offline):**
> Kata sandi bawaan seluruh akun demo adalah `Password123!`.
> - **Mahasiswa**: `2024001`
> - **Asisten Dosen**: `ta@siajar.ac.id` / `2024002`
> - **Dosen**: `0012345678`
> - **Koordinator Prodi**: `0087654321` / `kaprodi@siajar.test`
> - **Sekretaris Prodi**: `sekprodi` / `sekprodi@siajar.test` (NIDN: `0011223344`)
> - **Kepala Laboratorium**: `kalab` / `kalab@siajar.test` (NIDN: `0022334455`)
> - **Staf Akademik**: `198501012010121001` / `staf@siajar.test`
> - **Administrator Sistem**: `sysadmin@siajar.ac.id`
> - **Super Administrator**: `superadmin@siajar.ac.id`
>
> Di lingkungan produksi (`NODE_ENV=production`), seluruh autentikasi demo dan cookie `demo_session` **DITOLAK SECARA MUTLAK**.

### 2. Mode Penuh (Supabase Lokal)
```bash
# Inisialisasi dan jalankan kluster Supabase lokal
supabase init
supabase start
supabase db reset    # Menerapkan 29+ migrasi SQL dan seed data

# Siapkan variabel lingkungan
cp .env.example .env.local   # Sesuaikan kunci dari keluaran `supabase status`

# Jalankan server Next.js
npm run dev
```

---

## 🔒 Manajemen Akun Administratif Produksi

Di lingkungan produksi, akun Super Administrator dibuat atau diperbarui secara sah melalui skrip CLI administratif dengan penegakan kata sandi berkekuatan tinggi (minimal 14 karakter):

```bash
# Menjalankan skrip provisioning Super Admin
SUPERADMIN_EMAIL="admin.utama@institusi.ac.id" \
SUPERADMIN_PASSWORD="KataSandiSangatKuatDanPanjang14Karakter!" \
SUPERADMIN_NAME="Super Administrator Utama" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key-supabase>" \
NEXT_PUBLIC_SUPABASE_URL="https://proyek-anda.supabase.co" \
npx tsx scripts/create-superadmin.ts
```

---

## 🧪 Pengujian & Jaminan Kualitas Kode

Sebelum melakukan commit atau rilis, seluruh gerbang jaminan kualitas (*quality gates*) wajib dipenuhi:

```bash
# 1. Pengecekan komprehensif satu perintah (typecheck, lint, check:rls, check:snapshot, check:plan, audit:menu, test)
npm run cek

# 2. Verifikasi kepatuhan palet warna resmi kampus (0 unapproved hex)
npm run cek:hex

# 3. Audit integritas seluruh 122 menu navigasi (100% BERFUNGSI, 0 TIRUAN, 0 RUSAK)
npm run audit:menu

# 4. Pengujian kontrak menu dan keamanan sesi demo
npm test tests/menu-contract.test.ts tests/demo-session-security.test.ts

# 5. Uji kompilasi build produksi Next.js
npm run build

# 6. Pengujian End-to-End Playwright (Golden Journeys per Role)
npm run test:e2e
```

---

## 💾 Pencadangan dan Pemulihan Basis Data

- `scripts/backup-db.sh`: Membuat salinan cadangan (*dump*) terkompresi dari skema `public` PostgreSQL.
- `scripts/restore-test.sh`: Memulihkan cadangan ke basis data target pengujian (staging/lokal) dan memvalidasi integritas jumlah baris per tabel.

Panduan operasional pemulihan bencana, rotasi rahasia `CRON_SECRET`, dan manajemen autograder koding tersedia di [Panduan Operasional Sistem (Runbook)](file:///docs/RUNBOOK.md).

---

## ⚠️ Batasan yang Diketahui & Catatan Teknis

1. **Format Markdown Terintegrasi**: Konten materi, pengumuman, dan petunjuk tugas dirender menggunakan komponen `MarkdownViewer` yang dilengkapi pembersih keamanan XSS (memblokir tautan dengan skema berbahaya seperti `javascript:`).
2. **Pembatasan Laju (Rate Limiting)**: Pengamanan batas percobaan kode kelas (8 kode salah per 10 menit) dan percobaan login mendukung adapter Upstash Redis terdistribusi untuk arsitektur serverless, dengan fallback aman ke adapter in-memory pada lingkungan lokal.
3. **Penyimpanan Permanen**: Mode demo lokal menyimpan state interaksi di memori proses peladen (`globalThis.__siajar*`). Di lingkungan produksi, seluruh data tersimpan permanen di basis data Supabase dengan Row Level Security (RLS) aktif pada seluruh tabel.
4. **Arsip Dokumentasi Lama**: Dokumentasi lama SIAKAD telah diarsipkan secara terpisah di [`docs/arsip/README_SIAKAD_LEGACY.md`](file:///docs/arsip/README_SIAKAD_LEGACY.md).
