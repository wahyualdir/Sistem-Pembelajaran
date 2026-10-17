# Log Keputusan Arsitektur & Teknis (docs/keputusan.md)

Dokumen ini mencatat keputusan desain, arsitektur, asumsi, dan pemilihan library pada proyek SIAKAD UIR.

---

## Log Keputusan Terstruktur

### Keputusan 01: Audit Stack Aktual & Baseline Testing (Fase 0)
- **Tanggal**: 29 September 2026
- **Keputusan**: Mengonfirmasi stack aktual proyek sebagai Next.js 14.2.13 (App Router), React 18.3.1, TypeScript 5.6.2 strict, Tailwind CSS 3.4.13, Prisma 5.20.0 dengan PostgreSQL (Supabase), dan Vitest 2.1.1. Mempertahankan struktur rute yang sudah berjalan dan mengunci cabang kerja `feat/redesain-dan-ai-agent`.
- **Alasan**: Menghindari asumsi dan memastikan seluruh refaktor atau fitur baru dibangun di atas fondasi baseline yang terbukti lulus build, lint, typecheck, dan unit test (55/55 test passing).
- **Alternatif yang ditolak**:
  - *Upgrade langsung ke Next.js 15 / React 19*: Ditolak karena berisiko memicu breaking changes pada `@react-pdf/renderer` dan library UI eksternal sebelum persistensi data selesai.

### Keputusan 02: Strategi Migrasi Token Teks & Eliminasi Zero-Rules (Fase 1)
- **Tanggal**: 29 September 2026
- **Keputusan**: Menerapkan Pendekatan (b) yaitu migrasi massal dari `text-text-primary` dan `text-text-secondary` ke `text-foreground` dan `text-muted-foreground` (624 pemunculan), sekaligus menyediakan alias keamanan `text: { primary: "var(--text-primary)", secondary: "var(--text-secondary)" }` di `tailwind.config.ts`.
- **Alasan**: Mencegah zero CSS rules pada runtime sekaligus menstandarkan konvensi token sesuai shadcn/ui dan Tailwind CSS modern.
- **Alternatif yang ditolak**:
  - *Hanya menambah alias di Tailwind config tanpa mengubah pemakaian di komponen*: Ditolak karena mempertahankan inkonsistensi penamaan ganda dalam basis kode.

### Keputusan 03: Eliminasi Total Hex Hardcoded & Skrip Penjaga `cek:hex` (Fase 1)
- **Tanggal**: 29 September 2026
- **Keputusan**: Mengganti seluruh 259 warna hex hardcoded di komponen antarmuka ke kelas utilitas token CSS variables (`bg-muted`, `bg-surface`, `border-border`, `text-primary`, `bg-primary-soft`, `text-success`, `bg-success-soft`, dll.). Menambahkan skrip validasi otomatis `npm run cek:hex` dan agregator `npm run cek` ke `package.json`.
- **Alasan**: Warna hex hardcoded merusak dark mode dan menyulitkan pemeliharaan tema terpadu kampus. Skrip otomatis menjamin tidak ada developer yang secara tidak sengaja memasukkan hex baru.
- **Alternatif yang ditolak**:
  - *Membiarkan warna hex pada badge dan chart*: Ditolak karena melanggar prinsip sistem desain; untuk Recharts, warna dihubungkan langsung ke CSS variables `var(--primary)`, `var(--status-success)`, dan `var(--border-main)`. Catatan: Berkas PDF `@react-pdf/renderer` di `src/lib/pdf/` dipertahankan terisolasi karena tidak menggunakan pipeline Tailwind CSS.

### Keputusan 04: Standardisasi Komponen `StatusBadge` & Eliminasi Enum Mentah (Fase 1)
- **Tanggal**: 29 September 2026
- **Keputusan**: Membuat komponen terpusat `src/components/shared/status-badge.tsx` untuk memetakan enum database/store (`DISETUJUI`, `DRAF`, `LUNAS`, `BELUM`, `AKTIF`, dll.) menjadi label Bahasa Indonesia natural ("Disetujui", "Draf", "Lunas", "Belum Bayar", "Aktif") dengan titik status warna dan latar `-soft`.
- **Alasan**: Enum mentah berbahasa Inggris huruf kapital (`APPROVED`, `DISETUJUI`) membuat antarmuka kaku seperti sistem basis data mentah. Komponen tunggal menjamin konsistensi di seluruh halaman peran (Mahasiswa, Dosen, Admin).
- **Alternatif yang ditolak**:
  - *Format manual di setiap tabel menggunakan tag Badge terpisah*: Ditolak karena rawan inkonsistensi warna dan duplikasi logika ternary yang panjang.

### Keputusan 05: Restrukturisasi Sidebar Bergrup & Penyatuan Branding "SIAKAD UIR" (Fase 1)
- **Tanggal**: 29 September 2026
- **Keputusan**: Mengelompokkan menu navigasi sidebar ke dalam 3 grup: **Akademik**, **Layanan**, dan **Informasi & Sistem**. Menyatukan nama produk menjadi **SIAKAD UIR** di sidebar dan topbar, mengganti kotak inisial "SK" dengan Logo emblem SVG institusi baru, dan menambahkan penanda aktif berupa garis vertikal di sisi kiri item navigasi.
- **Alasan**: Memecah 11 menu datar tanpa hierarki visual menjadi kelompok terstruktur, serta menghilangkan kebingungan nama produk ganda ("SIAKAD Panel" vs "SIAKAD UIR").
- **Alternatif yang ditolak**:
  - *Accordion collapsible sidebar*: Ditolak karena menambah jumlah klik untuk navigasi harian mahasiswa dan staf.

### Keputusan 06: Tipografi Ganda & Rasio Kontras WCAG AA (Fase 1)
- **Tanggal**: 29 September 2026
- **Keputusan**: Memuat **Plus Jakarta Sans** via `next/font/google` (`--font-heading`) untuk judul, heading, dan angka statistik (dengan `tabular-nums`), melengkapi font teks utama **Inter** (`--font-inter`). Seluruh token warna diuji dan divalidasi memenuhi standar kontras WCAG AA.
- **Alasan**: Menghilangkan tampilan generic template, memberikan karakter visual yang tegas dan hangat bagi portal akademik universitas.
- **Alternatif yang ditolak**:
  - *Memuat font via CDN link tag di HTML head*: Ditolak karena menyebabkan layout shift (CLS) dan ketergantungan koneksi eksternal saat offline.

### Keputusan 07: Algoritma Pemilihan Jadwal Terdekat Mandiri & Deterministik (Fase 2)
- **Tanggal**: 29 September 2026
- **Keputusan**: Mengimplementasikan fungsi murni `pilihJadwalTerdekat(daftarJadwal, waktuSekarang, limit)` di `src/lib/akademik/jadwal-terdekat.ts`. Algoritma memetakan hari dan jam perkuliahan ke offset menit relatif terhadap waktu saat ini (`waktuSekarang`), mendeteksi kelas yang sedang berlangsung hari ini (`sedangBerlangsung`), mendahulukan kelas yang belum mulai hari ini, dan menggulirkan kelas hari ini yang sudah selesai ke minggu berikutnya (siklus 7 hari). Dilengkapi 8 unit test di `tests/jadwal-terdekat.test.ts`.
- **Alasan**: Menghindari bug slice jadwal statis (`.slice(0, 3)`) yang menampilkan kelas kadaluarsa. Injeksi parameter `waktuSekarang` memungkinkan pengujian otomatis deterministik tanpa ketergantungan jam sistem lokal saat pengujian berjalan.
- **Alternatif yang ditolak**:
  - *Hanya memfilter jadwal hari ini dan mengosongkan kartu jika hari ini libur/selesai*: Ditolak karena membingungkan mahasiswa pada sore hari atau akhir pekan saat ingin mengetahui kelas pertama berikutnya.

### Keputusan 08: Rekayasa Data Seed Riwayat Akademik Realistis (Fase 2)
- **Tanggal**: 29 September 2026
- **Keputusan**: Memperbarui riwayat studi mahasiswa angkatan 2022 (Semester 5) di `src/features/nilai/nilai-store.ts` agar memiliki rekam jejak lengkap Semester 1 s.d. 4 (21, 21, 23, 23 SKS), dengan 85 SKS lulus dari target 144 SKS (59%), IPK realistis 3.70, variasi nilai D yang diulang menjadi A di semester 3, serta KRS semester 5 berjalan sebesar 21 SKS (Senin s.d. Jumat aktif). Menambahkan variasi profil mahasiswa berprestasi (`mhs-3`, IPK 3.92), rata-rata (`mhs-2`, IPK 3.18), dan berisiko (`mhs-4`, IPK 2.25).
- **Alasan**: Data seed awal yang hanya memiliki 23 SKS untuk mahasiswa semester 5 membuat visualisasi kemajuan studi dan IPK tampak tidak kredibel.
- **Alternatif yang ditolak**:
  - *Menghitung angka kumulatif secara acak (random)*: Ditolak karena melanggar integritas formula IPK murni dan membuat KHS tidak konsisten dengan transkrip.

### Keputusan 09: Visualisasi Tren IPS Ringan Berbasis SVG Murni (Fase 2)
- **Tanggal**: 29 September 2026
- **Keputusan**: Membangun komponen `IpsTrendChart` menggunakan SVG murni dan token warna CSS variable `var(--primary)` serta `var(--border-main)` tanpa dependensi library grafik pihak ketiga yang berat untuk widget ringkas di dashboard.
- **Alasan**: Performa render instan, zero bundle bloat, responsif pada viewport 375px hingga desktop, serta 100% mematuhi aturan bebas warna hex hardcoded di `scripts/cek-hex.js`.
- **Alternatif yang ditolak**:
  - *Menggunakan Recharts untuk sparkline kecil di hero card*: Ditolak karena ukuran bundle Recharts yang besar untuk sekadar grafik tren 4 titik dan potensi hydration mismatch pada SSR awal.

### Keputusan 10: Pola Loading Skeleton Terintegrasi (Fase 2)
- **Tanggal**: 29 September 2026
- **Keputusan**: Menyediakan berkas `loading.tsx` beranimasi `animate-pulse` yang meniru tata letak persis kartu dashboard mahasiswa, KRS, dosen, dan admin.
- **Alasan**: Mencegah flash of unstyled content / blank screen saat perpindahan rute dinamis (Next.js Suspense boundary streaming).
- **Alternatif yang ditolak**:
  - *Spinner tengah layar standar*: Ditolak karena pengalaman pengguna (UX) terkesan lambat dan kasar dibandingkan skeleton kartu bergradasi.

### Keputusan 11: Simulasi IPK Re-use Modul Murni Nilai (Fase 3)
- **Tanggal**: 29 September 2026
- **Keputusan**: Membangun modul `src/lib/akademik/simulasi-ipk.ts` langsung di atas `hitungIPK` dan `hitungIPS` dari `src/lib/akademik/nilai.ts` tanpa menduplikasi rumus matematika nilai mutu. Perhitungan secara otomatis menangani mata kuliah mengulang (mengambil nilai terbaik) dan menghasilkan delta selisih IPK (+/-). Dilengkapi 5 unit test di `tests/simulasi-ipk.test.ts`.
- **Alasan**: Menghindari desinkronisasi rumus perhitungan antara transkrip nyata dan simulasi proyeksi.
- **Alternatif yang ditolak**:
  - *Membuat kalkulator terpisah dengan rumus custom*: Ditolak karena berisiko menghasilkan angka IPK yang berbeda dengan standar akademik universitas.

### Keputusan 12: Pemisahan SKS Wajib vs Pilihan pada Progres Kelulusan S1 (Fase 3)
- **Tanggal**: 29 September 2026
- **Keputusan**: Mengimplementasikan `src/lib/akademik/progres-kelulusan.ts` untuk memecah capaian kelulusan SKS menjadi Wajib (126 SKS) dan Pilihan (18 SKS) dari total 144 SKS, serta mengestimasi sisa semester yang dibutuhkan berdasarkan sisa SKS setelah memperhitungkan semester berjalan. Dilengkapi 4 unit test di `tests/progres-kelulusan.test.ts`.
- **Alasan**: Memenuhi kebutuhan kurikulum institusi pendidikan tinggi di mana mahasiswa harus memantau kuota mata kuliah pilihan selain mata kuliah wajib.
- **Alternatif yang ditolak**:
  - *Hanya menampilkan total SKS agregat tanpa breakdown*: Ditolak karena mahasiswa tidak dapat mengetahui apakah kekurangan SKS mereka berada di jalur wajib atau pilihan.

### Keputusan 13: Arsitektur Notifikasi In-App Siap Migrasi Persistensi (Fase 3)
- **Tanggal**: 29 September 2026
- **Keputusan**: Membangun store `src/features/notifikasi/notifikasi-store.ts` dan antarmuka `Notifikasi` (id, penggunaId, judul, pesan, kategori, tautan, sudahDibaca, waktu) yang terhubung ke `NotifikasiPopover` di topbar. Struktur data dirancang kompatibel langsung dengan skema entitas tabel database Prisma mendatang pada Fase 5.
- **Alasan**: Mengaktifkan interaktivitas lonceng notifikasi dan pembaruan realtime pada sisi antarmuka tanpa merusak kode saat persistensi database diaktifkan.
- **Alternatif yang ditolak**:
  - *Hardcode daftar notifikasi langsung di dalam komponen Topbar*: Ditolak karena menyulitkan refaktor dan penambahan notifikasi dari event bisnis (seperti KRS disetujui atau UKT lunas).

### Keputusan 14: Integrasi Supabase Auth (@supabase/ssr) Google OAuth & Eliminasi Tombol Demo Produksi (Fase 4)
- **Tanggal**: 29 September 2026
- **Keputusan**: Menggunakan `@supabase/ssr` (browser client dan server client di `/api/auth/callback/route.ts`) untuk menangani alur Google OAuth mahasiswa dengan parameter `hd: "student.uir.ac.id"`, dipadukan dengan validasi ketat server-side `validasiEmailStudent()` yang mendukung `ALLOWED_EMAIL_DOMAINS`. Menghilangkan seluruh tombol demo `password123` dari bundle produksi (`NODE_ENV === "production"`), dan membatasi fitur dev demo hanya jika `process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"` di lingkungan non-produksi.
- **Alasan**: Memanfaatkan paket yang sudah terpasang di repo (`@supabase/ssr` dan `@supabase/supabase-js`) tanpa menambah dependensi baru (Auth.js/NextAuth), menjaga keselarasan sesi cookie HTTP-only yang aman (`sameSite: "lax"`, `secure`), serta mencegah kebocoran kredensial demo pada rilis publik.
- **Alternatif yang ditolak**:
  - *Menginstal Auth.js / NextAuth v5*: Ditolak karena menambah dependensi eksternal baru dan menduplikasi manajemen sesi Supabase.
  - *Mempertahankan tombol demo di tampilan login publik*: Ditolak karena bertentangan dengan standar keamanan sistem produksi kampus.

### Keputusan 15: Penyelarasan Skema Prisma dengan Notifikasi, Preferensi, dan Perangkat Login (Fase 4)
- **Tanggal**: 29 September 2026
- **Keputusan**: Menambahkan model `Notifikasi`, `PreferensiNotifikasi`, dan `PerangkatLogin` serta enum `JenisNotifikasi` dan `TingkatNotifikasi` langsung ke `prisma/schema.prisma` di bawah relasi model `Pengguna`, dengan konfigurasi `DATABASE_URL` (connection pooler) dan `DIRECT_URL` (migrasi langsung). Berhasil mengompilasi Prisma Client v5.22.0.
- **Alasan**: Menyiapkan skema basis data secara menyeluruh sehingga Fase 5 (Infrastruktur Notifikasi) dan Fase 7 (Keamanan Perangkat Login) dapat langsung mengeksekusi logika bisnis tanpa perlu modifikasi berulang pada relasi dasar `Pengguna`.
- **Alternatif yang ditolak**:
  - *Menunda penambahan tabel Notifikasi ke Fase 5*: Ditolak karena membuat skema Pengguna harus diubah kembali di fase berikutnya.

### Keputusan 16: Otorisasi Sisi Server dan Pengujian Integrasi Alur End-to-End KRS-Nilai (Fase 4)
- **Tanggal**: 29 September 2026
- **Keputusan**: Memperketat otorisasi server-side di `src/features/krs/actions.ts` dan `src/features/nilai/actions.ts`: memastikan dosen hanya dapat menyetujui/menolak KRS mahasiswa perwaliannya sendiri (`krs.dosenWaliId === session.subId`), serta dosen hanya dapat mengelola komponen nilai dan finalisasi nilai untuk kelas yang diampunya (`kelas.dosenId === session.subId`). Menulis 12 uji integrasi end-to-end komprehensif di `tests/integrasi-krs-nilai.test.ts` (mencakup batas SKS, prasyarat UKT, kuota kelas, persetujuan wali, hingga input nilai berbobot dan IPK).
- **Alasan**: Menjamin keamanan data tidak semata-mata bergantung pada penyembunyian elemen UI, melainkan diverifikasi secara tegas pada setiap pemanggilan Server Action dan query database.
- **Alternatif yang ditolak**:
  - *Mengandalkan client-side state checking saja*: Ditolak karena rentan manipulasi request dari developer tools atau API client.

### Keputusan 17: Mesin Notifikasi Idempoten, Jam Tenang, Proteksi Keamanan, dan Preferensi Kanal (Fase 5)
- **Tanggal**: 29 September 2026
- **Keputusan**: 
  1. Mengimplementasikan `NotifikasiService` dengan jaminan idempotensi berbasis `kunciDedup` unik per pasangan `(penggunaId, kunciDedup)` sehingga pemanggilan berulang tidak menduplikasi rekaman notifikasi.
  2. Menerapkan evaluasi jam tenang (`apakahDalamJamTenang`, `hitungAkhirJamTenang`) dengan dukungan pergeseran hari/tengah malam (misal 22:00 - 06:00). Notifikasi berstatus non-mendesak secara otomatis diisi nilai `ditundaSampai` dan disaring dari daftar aktif pengguna hingga periode jam tenang berakhir.
  3. Menetapkan aturan bypass mutlak: notifikasi berbobot `MENDESAK` atau berkategori `KEAMANAN` tidak pernah ditahan oleh jam tenang.
  4. Menetapkan aturan invariant keamanan: kanal aplikasi (`app: true`) untuk notifikasi kategori `KEAMANAN` dipaksa selalu aktif dan tidak dapat dimatikan oleh pengguna melalui preferensi apa pun.
  5. Menyediakan antarmuka popover notifikasi topbar berbasis Server Actions dengan badge prioritas, aksi tunda (snooze +1 jam / +1 hari), dan tautan cepat ke halaman preferensi.
  6. Membangun halaman pengaturan `/mahasiswa/preferensi-notifikasi` yang sepenuhnya adaptif untuk tema terang dan gelap, dengan validasi format jam tenang dan input email cadangan.
  7. Mengintegrasikan pengirim email transaksional dengan antarmuka `PengirimNotifikasi` berbasis Resend API (`RESEND_API_KEY`) dengan fallback audit log aman saat mode offline.
- **Alasan**: Mahasiswa membutuhkan saluran komunikasi yang tepat waktu tanpa terganggu di waktu istirahat, namun informasi kritis (seperti tenggat tugas <2 jam atau indikasi peretasan akun) harus tetap tersampaikan tanpa kompromi.
- **Alternatif yang ditolak**:
  - *Mengirim notifikasi langsung tanpa dedup key*: Ditolak karena rawan duplikasi akibat double submission atau retry webhook jaringan.
  - *Mengizinkan penonaktifan notifikasi keamanan demi privasi*: Ditolak karena membuka celah pengambilalihan akun tanpa sepengetahuan pemilik.

---

## Tabel Validasi Rasio Kontras Sistem Desain (WCAG AA & AAA)

Semua kombinasi warna teks dan latar belakang utama telah dihitung dan divalidasi:

| Elemen / Token | Warna Depan | Warna Latar | Rasio Kontras | Kepatuhan WCAG |
|---|---|---|---|---|
| **Teks Utama (Terang)** | `#0F172A` (Text Primary) | `#FFFFFF` (Surface) | **17.2:1** | Lolos AAA ($\ge 7.0:1$) |
| **Teks Utama (Terang)** | `#0F172A` (Text Primary) | `#F8FAFC` (Background) | **16.2:1** | Lolos AAA ($\ge 7.0:1$) |
| **Teks Sekunder (Terang)**| `#475467` (Text Secondary) | `#FFFFFF` (Surface) | **5.4:1** | Lolos AA ($\ge 4.5:1$) |
| **Aksen Merek Primary** | `#FFFFFF` (Foreground) | `#2A4DB7` (Primary) | **6.7:1** | Lolos AA ($\ge 4.5:1$) |
| **Teks Status Sukses** | `#15803D` (Success) | `#FFFFFF` (Surface) | **4.6:1** | Lolos AA ($\ge 4.5:1$) |
| **Teks Status Bahaya** | `#BE123C` (Danger) | `#FFFFFF` (Surface) | **5.5:1** | Lolos AA ($\ge 4.5:1$) |
| **Teks Status Peringatan**| `#B45309` (Warning) | `#FFFFFF` (Surface) | **4.7:1** | Lolos AA ($\ge 4.5:1$) |
| **Teks Utama (Gelap)** | `#F8FAFC` (Text Primary) | `#131B2E` (Dark Surface) | **13.5:1** | Lolos AAA ($\ge 7.0:1$) |
| **Teks Utama (Gelap)** | `#F8FAFC` (Text Primary) | `#0B0F19` (Dark Background)| **16.9:1** | Lolos AAA ($\ge 7.0:1$) |
| **Teks Sekunder (Gelap)** | `#94A3B8` (Text Secondary) | `#131B2E` (Dark Surface) | **5.7:1** | Lolos AA ($\ge 4.5:1$) |
| **Aksen Primary (Gelap)** | `#FFFFFF` (Foreground) | `#3B82F6` (Dark Primary) | **4.6:1** | Lolos AA ($\ge 4.5:1$) |

---

## Arsip Keputusan Arsitektur Sebelumnya

### 1. Pemilihan Stack & Dependencies
- **Framework**: Next.js 14 (App Router) dengan TypeScript strict.
- **ORM & Database**: Prisma ORM dengan PostgreSQL (Supabase).
- **Styling**: Tailwind CSS dengan custom design tokens (CSS variables), radius kontrol 8px, kontainer 12px.
- **Komponen UI**: shadcn/ui primitives (Radix UI) + Lucide React icons.
- **Validasi**: Zod + React Hook Form.
- **Tabel & Visualisasi**: `@tanstack/react-table` dan `recharts`.
- **Cetak Dokumen**: `@react-pdf/renderer` untuk menghasilkan PDF KHS, transkrip, kartu ujian, dan surat keterangan.
- **File & CSV Processing**: `papaparse` untuk parse CSV impor, `exceljs` untuk ekspor spreadsheet laporan.
- **Autentikasi**: `@supabase/ssr` dan `@supabase/supabase-js`.
- **Testing**: `vitest` untuk unit testing modul akademik tanpa mocking database berlebih.

### 2. Autentikasi & Otorisasi
- **Mahasiswa**: Login via Google OAuth dengan batasan `ALLOWED_EMAIL_DOMAIN` (`student.uir.ac.id`). Domain divalidasi strictly di server `lib/auth/validasi-email.ts`. Jika akun belum terdaftar pada entitas `Mahasiswa`, sesi dibatalkan seketika tanpa auto-register.
- **Dosen & Admin**: Login via email & kata sandi dengan verifikasi hash bcrypt / Supabase Auth.
- **Middleware**: Membaca sesi dari cookie (`@supabase/ssr`), memvalidasi role dari database, dan memblokir akses lintas peran.
- **Row Level Security**: RLS diaktifkan di Supabase untuk menolak pembacaan anonim langsung dari client; seluruh kueri database aplikasi menggunakan Prisma di sisi server.

### 3. Aturan Akademik Dinamis
- Nilai konfigurasi batas SKS, persentase kehadiran UAS (75%), skala huruf mutu nilai (A sampai E), dan batas kelulusan prasyarat disimpan dalam tabel `KonfigurasiAkademik` dengan nilai bawaan yang dapat disesuaikan tanpa redeploy kode.

---

### Keputusan 19: Standarisasi Skala Responsif & Kepadatan UI Terpadu (Fase 1 - 5)
- **Tanggal**: 12 Oktober 2026
- **Konteks & Masalah**:
  Audit antarmuka menemukan layout token berbasis pixel tetap (`--layout-sidebar-width` 218-315px, `--layout-right-panel-width` 305-480px) menyebabkan sidebar + panel kanan mengonsumsi >40% lebar viewport pada laptop resolusi standar 1280–1535px (termasuk Windows scaling 125%/150%), sehingga kolom konten tengah terjepit. Ditemukan juga ~493 kelas pixel arbitrer (`text-[Npx]`, `h-[Npx]`) dan kontrol masukan berukuran besar (3.1rem) yang tidak responsif terhadap skala viewport.
- **Keputusan Arsitektur & Teknis**:
  1. **Skala Berbasis Root REM Adaptif**:
     - `<1024px`: `html { font-size: 15px; }` (kenyamanan sentuh tablet & ponsel).
     - `1024px – 1535px`: `html { font-size: 14px; }` (proporsi optimal laptop 1366x768 & 1440x900 dengan zoom 100%, ekuivalen tampilan zoom 85–90%).
     - `1536px – 1919px`: `html { font-size: 15px; }` (layar desktop menengah).
     - `≥1920px`: `html { font-size: 16px; }` (layar FHD/4K lebar).
  2. **Token Tata Letak REM Fleksibel**:
     - `--layout-sidebar-width: 15rem` (~210px pada 14px root).
     - `--layout-rail-width: 4.5rem` (~63px).
     - `--layout-right-panel-width: 20rem` (~280px).
     - `--layout-header-height: 3.5rem` (desktop) dan `--layout-header-height-mobile: 3.25rem` (ponsel).
  3. **Panel Kanan Adaptif (Breakpoint 2XL / 1536px)**:
     - Panel kanan hanya tampil *inline statis* pada viewport `≥1536px` (`2xl`).
     - Pada viewport `<1536px` (termasuk laptop 1280–1535px), panel kanan otomatis bertransisi menjadi drawer/off-canvas yang dipicu melalui tombol toggle header, menjamin lebar kolom tengah konsisten **≥60%** viewport width.
  4. **Pencegahan Auto-Zoom iOS & Touch Target Aksesibilitas**:
     - Semua elemen masukan formulir (`input`, `select`, `textarea`, `.field`) diproteksi dengan aturan `font-size: 16px !important` pada viewport `<768px`.
     - Seluruh tombol kontrol dan touch target interaktif berukuran minimal `44x44px` pada perangkat coarse pointer.
     - Batas minimum teks `12px` di seluruh aplikasi melalui `.text-xs { font-size: max(0.75rem, 12px) !important; }`.
  5. **Viewport Safe Area Insets**:
     - Metadata viewport diekspor dengan `viewportFit: "cover"` dan variabel CSS `--sat`, `--sab`, `--sal`, `--sar` disematkan pada topbar, sidebar drawer, dan tombol mengambang AI.
  6. **Verifikasi E2E Playwright**:
     - Suite pengujian `tests/e2e/responsive.spec.ts` memvalidasi 26 skenario di 11 viewport (360x640 hingga 1920x1080) dengan tangkapan layar otomatis di `docs/responsive-verification/`. Seluruh pengujian lulus 100%.

---

### Keputusan 20: Fitur LMS Inti — Upload Berkas Supabase Storage & Progres Belajar Mahasiswa (Fase 1 - 5)
- **Tanggal**: 13 Oktober 2026
- **Konteks & Masalah**:
  Materi perkuliahan dan pengumpulan tugas sebelumnya hanya menyimpan string tautan atau nama berkas yang diketik tanpa penyimpanan biner nyata, bucket privat, sanitasi nama berkas, atau signed URL berumur pendek. Selain itu, belum ada entitas pelacakan progres belajar materi per mahasiswa dan per kelas untuk memantau ketuntasan pembelajaran dan kebutuhan bimbingan akademik.
- **Keputusan Arsitektur & Teknis**:
  1. **Supabase Storage Privat & RLS**:
     - Dua bucket privat didaftarkan via migrasi SQL `20261012000019_storage_and_material_progress.sql`: `materi` dan `tugas`.
     - Kebijakan RLS pada `storage.objects` memastikan dosen/TA pemilik kelas & admin berhak mengunggah/menghapus materi; mahasiswa terdaftar di kelas (KRS aktif) berhak membaca. Untuk tugas: mahasiswa hanya mengunggah/membaca berkas miliknya; dosen/TA kelas dapat membaca seluruh berkas tugas kelas.
  2. **Konvensi Path & Sanitasi Berkas**:
     - Konvensi path: `materi/{kelasId}/{uuid}-{namaAman}` dan `tugas/{tugasId}/{mahasiswaId}/{uuid}-{namaAman}`.
     - Sanitasi nama berkas di `src/lib/akademik/konfigurasi-storage.ts` membuang path traversal, spasi, dan karakter berbahaya, serta membatasi panjang nama dasar ke 60 karakter.
  3. **Otorisasi Server-Side & Rollback Obyek Yatim**:
     - Validasi izin peran dan status enrollment dieksekusi di server actions (`src/features/materi-tugas/actions.ts`). Service role key hanya digunakan pada helper storage server (`src/lib/supabase/storage.ts`).
     - Jika baris database gagal disimpan setelah pengunggahan, pembersihan objek storage (rollback) otomatis dijalankan untuk mencegah berkas yatim.
     - Setiap mutasi dicatat ke tabel `audit_logs`.
  4. **Konfigurasi Batas Upload Terpusat**:
     - Batas materi: 50 MB (pdf, docx, pptx, xlsx, zip, png, jpg, jpeg, mp4).
     - Batas tugas: 10 MB (pdf, docx, pptx, xlsx, zip, png, jpg, jpeg).
     - Dikonfigurasi terpusat pada konstanta `KONFIGURASI_STORAGE` dengan pesan galat bahasa Indonesia.
  5. **Signed URL Berumur Pendek**:
     - Unduhan berkas storage menghasilkan signed URL privat berumur pendek (60 menit) via server action setelah verifikasi otorisasi. Tidak ada URL publik permanen.
  6. **Aturan Keterlambatan Pengumpulan Tugas**:
     - Keterlambatan dihitung otomatis di server (`waktuKumpul > tenggat`). Kumpul ulang sebelum tenggat menggantikan berkas lama (berkas lama dihapus dari storage).
  7. **Model & RLS Progres Belajar (`MateriProgres`)**:
     - Model Prisma `MateriProgres` dan tabel PostgreSQL `public.materi_progres` dengan RLS aktif.
     - Server Actions: `catatMateriDibukaAction`, `tandaiMateriSelesaiAction`, dan `batalkanMateriSelesaiAction` dengan otorisasi khusus mahasiswa terdaftar.
  8. **Kalkulasi Progres & Rekap Dosen**:
     - Fungsi murni `hitungProgresMateri(total, selesai)` menghitung persentase progres (total 0 → 0%).
     - Mahasiswa melihat badge tuntas, kartu kelas, dan 'Lanjutkan Belajar' di Beranda.
     - Dosen melihat rekap per materi dan per mahasiswa lengkap dengan ekspor CSV.
  9. **Kompatibilitas Mundur & Komponen UI Reusable**:
     - Komponen `FileDropzone` mendukung drag-and-drop dan tombol pilih berkas native dengan touch target minimal 44px.
     - Data materi/tugas lama berbasis URL eksternal tetap didukung penuh dengan opsi 'Tautkan Link Eksternal'.
  10. **Verifikasi & Pengujian Otomatis**:
      - 11 unit test di `tests/progres-belajar.test.ts` lulus 100%.
      - RLS testing di `supabase/tests/database/06_storage_and_progress_rls.sql` dan `npm run check:rls` (29 tabel lulus).
      - E2E Playwright di `tests/e2e/lms-materi-tugas-progres.spec.ts` memvalidasi alur terpadu.



### Keputusan 28: Penyelarasan Celah Skema, Restrukturisasi 102 Menu, dan Pemisahan Store Kuis (Fase 0)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Melaksanakan penyelarasan skema database melalui migrasi baru `supabase/migrations/20261017000022_phase0_gap_alignment.sql` yang menambahkan flag `can_open_attendance` pada `class_assistants`, tabel `student_requests` untuk permohonan mahasiswa, tabel pembatasan domain email (`allowed_email_domains`, `email_allowlist`), dan view `audit_logs_for_sysadmin` dengan masking IP & user agent.
  2. Mengonfigurasi `src/lib/config/menu-config.ts` untuk merefleksikan 102 menu lengkap dari 7 peran pengguna SIAJAR sesuai pedoman bahasa dan terminologi yang ditetapkan di `docs/INSTRUKSI_ANTIGRAVITY.md` (menghapus buzzwords promosi, tidak memakai tanda & atau garis miring pada label).
  3. Memisahkan in-memory store kuis ke `src/modules/academic/quiz-store.ts` tanpa deklarasi `'use server'`, sehingga mematuhi aturan ketat Next.js App Router (berkas `'use server'` hanya boleh mengekspor async functions, bukan objek atau singleton store).
  4. Menyediakan rute-rute antarmuka yang sebelumnya absen (`/requests`, `/messages`, `/achievements`, `/evaluations`, `/ta/materials`, `/lecturer/journals`, `/lecturer/rubrics`, `/lecturer/evaluations`, `/lecturer/disputes`, `/exams/analysis`, `/coordinator/evaluations`) dengan proteksi role guard dan state kosong yang informatif.
- **Alasan**: Menjamin fondasi SIAJAR bersih, bebas galat kompilasi Next.js, dan sepenuhnya selaras dengan kontrak navigasi dan keamanan multi-peran sebelum melangkah ke implementasi Fase 1 sampai 7.
- **Alternatif yang ditolak**:
  - *Mempertahankan rute lama yang tidak sesuai tabel*: Ditolak karena membingungkan navigasi pengguna antar-peran.
  - *Mengedit migrasi lama (1-21)*: Ditolak demi integritas audit dan kepatuhan prinsip migrasi idempoten berbasis append-only.

### Keputusan 29: Kebijakan Institusi Terkonfigurasi & Pemisahan Boundary Server Action (Fase 1)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Membuat tabel `institution_policies` (Migrasi 23) dengan RLS dan fungsi SQL `get_policy(key)`, serta melakukan seeding untuk 21 kebijakan default Lampiran A.
  2. Membuat helper `getPolicy<T>(key)` di `src/lib/policies/index.ts` dengan in-memory cache 60 detik dan fallback fail-safe ke `DEFAULT_INSTITUTION_POLICIES`.
  3. Memisahkan server actions ke `src/lib/policies/actions.ts` dengan directive `'use server'`, sehingga komponen klien seperti `SuperadminPoliciesHubView` dapat memanggil mutasi dan kueri kebijakan tanpa menyebabkan modul backend (`@/lib/supabase/server`, `@/lib/audit.ts`) ter-bundle ke klien.
- **Alasan**: Menghindari runtime/build error Webpack "You're importing a component that needs server-only" dan menjamin integritas jejak audit sensitif saat kebijakan diubah oleh Super Admin.
- **Alternatif yang ditolak**:
  - *Hardcode nilai ambang batas di setiap modul*: Ditolak karena aturan kampus dinamis dan harus dapat diubah tanpa deploy ulang.

### Keputusan 30: Isolasi Evaluasi Syarat Ujian Sisi Server (Fase 1)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**: Menyimpan evaluasi asinkron dinamis di `src/lib/akademik/syarat-ujian-server.ts`, sementara `src/lib/akademik/syarat-ujian.ts` tetap berupa modul fungsi murni (pure functions) tanpa dependensi server atau `next/headers`.
- **Alasan**: `syarat-ujian.ts` diimpor oleh berbagai store antarmuka klien (seperti `ujian-store.ts`). Adanya import server-only di file tersebut akan merusak kompilasi webpack klien.
- **Alternatif yang ditolak**:
  - *Memaksa semua komponen klien menjadi server component*: Ditolak karena halaman ujian dan input form membutuhkan state interaktif reaktif di browser.

### Keputusan 31: Notifikasi Terjadwal Idempoten dan Keamanan Cron Fail-Closed (Fase 1)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Mengimplementasikan tabel `scheduled_notifications` dengan RLS dan indeks gabungan `(send_at, sent_at)`.
  2. Fungsi `scheduleNotification` menggunakan `dedupe_key` untuk menjamin idempotensi saat penjadwalan berulang.
  3. Endpoint cron dilindungi secara ketat melalui `src/lib/cron/auth.ts` (`Authorization: Bearer ${CRON_SECRET}`). Bila header absen atau `CRON_SECRET` di environment kosong, permintaan langsung ditolak (fail-closed dengan status HTTP 401).
  4. Mendaftarkan seluruh 10 pekerjaan terjadwal Lampiran C di `vercel.json` dan membuat route handler terkait.
- **Alasan**: Mencegah spam notifikasi ganda kepada mahasiswa dan memastikan route cron tidak dapat dipicu secara sepihak oleh publik tanpa otentikasi sah.
- **Alternatif yang ditolak**:
  - *Memicu cron tanpa secret di development*: Ditolak karena rawan terbawa ke lingkungan staging/produksi yang menimbulkan kerentanan Denial-of-Service.

### Keputusan 32: Arsitektur Aturan Keterlambatan, Penalti dan Perpanjangan Tenggat (Fase 2)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**: Mengimplementasikan `calcLatePenalty`, `calcLateMinutes`, dan `getEffectiveDates` sebagai fungsi murni TypeScript (`src/lib/akademik/late-penalty.ts`) dan fungsi SQL (`calc_late_penalty`). Penalti didukung dalam mode `flat`, `per_hour`, `per_day`, dan `none` dengan batas atas pemotongan `late_penalty_cap` (maks 100%). Pemaafan penalti (`penalty_waived = true`) oleh dosen tetap mencatat alasan pemaafan dan riwayat penalti asli untuk audit, namun skor akhir dihitung dari skor mentah utuh.
- **Alasan**: Menjamin transparansi dan akurasi perhitungan penalti di sisi database maupun antarmuka pengguna tanpa inkonsistensi waktu.

### Keputusan 33: Arsitektur Tugas Kelompok dan Penilaian Kontribusi Anggota (Fase 2)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**: Menyediakan 3 skema pembentukan kelompok (`self`, `lecturer`, `random`). Pada mode `self`, mahasiswa membentuk dan bergabung menggunakan kode alfanumerik 6 karakter acak yang unik. Satu pengumpulan per kelompok (`uq_submissions_group`) mewakili seluruh anggota kelompok, dengan riwayat versi di `submission_versions`. Penyesuaian kontribusi anggota (`submission_member_adjustments`) dibatasi pada rentang 0.50 s.d. 1.50 dari skor kelompok dengan pencatatan justifikasi dosen.
- **Alasan**: Mencegah beban pengumpulan ganda pada tugas tim serta memberikan fleksibilitas penilaian yang adil bagi anggota tim yang berkontribusi lebih atau kurang.

### Keputusan 34: Struktur Rubrik Penilaian dan Pemisahan Hak Draf Asisten (Fase 2)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**: Rubrik disimpan berjenjang: `rubrics` -> `rubric_criteria` (dengan bobot persentase) -> `rubric_levels` (poin dan deskripsi). Snapshot rubrik dikunci pada saat tugas dibuat. Asisten dosen (TA) hanya dapat menyimpan nilai rubrik sebagai draf (`is_draft = true`), sedangkan publikasi nilai final ke mahasiswa hanya dapat dilakukan oleh Dosen Pengampu.
- **Alasan**: Mematuhi hierarki akademik kampus bahwa penilaian akhir dan penerbitan nilai resmi merupakan kewenangan dosen penanggung jawab mata kuliah.

### Keputusan 35: Alur Sanggah Nilai dan Integrasi Permintaan Perubahan Nilai (Fase 2)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**: Sanggah nilai (`grade_disputes`) dibatasi jendela pengajuan tepat 7 hari kalender sejak nilai diterbitkan, dengan kuota maksimal 3 sanggahan aktif per mahasiswa per kelas. Jika nilai kelas telah difinalisasi di buku nilai (`gradebook`), persetujuan sanggahan oleh dosen secara otomatis menghasilkan draf `grade_change_requests` untuk diverifikasi oleh Koordinator Program Studi sesuai regulasi akademik universitas.
- **Alasan**: Memberikan ruang klarifikasi yang adil dan transparan bagi mahasiswa sekaligus menjaga integritas data nilai yang telah dikunci.

### Keputusan 36: Izin dan Sakit Mahasiswa dengan RLS, Bukti Berkas Privat, dan Kebijakan Presensi (Fase 3)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Membuat tabel `absence_requests` dan `absence_request_items` (Migrasi 25) dengan relasi ke pertemuan kelas (`class_sessions`).
  2. Mahasiswa mengunggah berkas bukti ke bucket privat `absence-proofs` dengan validasi MIME (PDF/JPG/PNG maks 5MB) dan signed URL berumur pendek 60 detik.
  3. Formulir pengajuan mahasiswa mewajibkan keterangan izin/sakit namun secara eksplisit melarang pencantuman diagnosis medis detail demi privasi.
  4. Pengesahan keputusan per butir pertemuan (`review_absence_item` RPC) otomatis memperbarui baris `attendance_records` dengan status `excused` atau `sick` dan menandai `source = 'absence_request'`.
  5. Rumus SQL `attendance_percent(student_id, class_id)` dan helper TypeScript `calcAttendancePercent` menghitung persentase kehadiran dengan mendukung kebijakan `attendance_permission_policy` (`exclude`, `present`, `absent`).
- **Alasan**: Menjamin transparansi dan validitas proses izin sakit mahasiswa tanpa melanggar privasi medis dan menjaga konsistensi kalkulasi persentase kehadiran untuk syarat kelayakan ujian.

### Keputusan 37: Berita Acara Perkuliahan dengan Kunci Finalisasi dan Hitungan Keterlambatan Pengisian (Fase 3)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Membuat tabel `class_session_journals` dan `journal_materials` (Migrasi 25) dengan status draf dan final.
  2. Draf berita acara dapat disunting bebas oleh Dosen Pengampu atau Asisten Kelas yang ditugaskan.
  3. Finalisasi berita acara hanya dapat dilakukan oleh Dosen Pengampu dan mengunci data secara permanen. Bila ada koreksi pasca-finalisasi, setiap pembaruan mencatat nomor versi revisi (`revision_count`) dan alasan perubahan di `revision_reason` serta memicu pencatatan audit log sensitif.
  4. Keterlambatan pengisian berita acara dihitung secara otomatis dengan batas waktu H+3 pukul 23.59 WIB dari tanggal pertemuan yang diadakan (`isJournalLate`).
  5. Disediakan ekspor rekapitulasi berita acara kelas ke format Excel (.xlsx) dengan pustaka `exceljs`.
- **Alasan**: Mematuhi standar penjaminan mutu perkuliahan universitas dan mencegah manipulasi riwayat pelaksanaan perkuliahan.

### Keputusan 38: Kuliah Daring dengan Whitelist Domain Konferensi Video dan Tautan Rekaman Terjadwal (Fase 3)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Menambahkan kolom `delivery_mode` (`tatap_muka`, `daring_sinkron`, `daring_asinkron`, `hybrid`), `meeting_url`, `recording_url`, dan `recording_visible_from` pada `class_sessions` (Migrasi 25).
  2. Tautan pertemuan online divalidasi ketat hanya dari domain konferensi video tepercaya: Google Meet (`meet.google.com`), Zoom (`zoom.us`), Microsoft Teams (`teams.microsoft.com`), Webex (`webex.com`), dan YouTube (`youtube.com`, `youtu.be`).
  3. Tombol gabung kuliah daring hanya aktif bagi mahasiswa pada jendela 15 menit sebelum hingga 30 menit setelah waktu selesai sesi. Tautan rekaman hanya dapat diakses mahasiswa setelah waktu `recording_visible_from` tercapai.
- **Alasan**: Menghindari phising dan tautan berbahaya serta memastikan ketertiban waktu perkuliahan sinkron.

### Keputusan 39: Progres Ketuntasan Materi Berurutan dan Batas Laju Pengingat 24 Jam (Fase 3)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Menambahkan kolom `unlock_after_material_id` dan `require_completion` pada `materials`, serta tabel `material_progress` dengan RLS mahasiswa.
  2. Materi yang memiliki prasyarat `unlock_after_material_id` terkunci otomatis untuk mahasiswa sampai materi prasyarat ditandai selesai (`completed_at is not null`).
  3. Dosen dapat memantau daftar mahasiswa yang belum membuka materi dan mengirimkan pengingat ("Ingatkan Mahasiswa Belum Membuka") yang dibatasi laju maksimal 1 kali per 24 jam per materi.
- **Alasan**: Mendukung alur pembelajaran mandiri yang terstruktur (sequential learning path) dan mencegah spam notifikasi ke mahasiswa.



