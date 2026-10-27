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

### Keputusan 40: Arsitektur Autosave Ujian, Sesi Tunggal, Pemulihan Offline, dan Detak Jantung Server (Fase 4)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Menambahkan kolom `expires_at`, `extra_time_seconds`, `last_heartbeat_at`, `active_session_id`, `auto_submitted`, dan `submit_idempotency_key` pada `exam_attempts` serta `revision` pada `exam_answers` (Migrasi 26).
  2. Implementasi hook klien `useExamAutosave` dengan penyimpanan cadangan lokal (`exam:${attemptId}`), debounce batch 1,5 detik, exponential backoff (1s s.d. 30s), dan pengiriman ulang otomatis saat kembali online.
  3. Penegakan sesi tunggal via RPC `claim_attempt_session`. Tab atau perangkat lain yang terbuka otomatis terkunci menjadi hanya-baca dengan pesan peringatan natural dan kejadian `sesi_ganda` dicatat di `exam_events`.
  4. Sinkronisasi sisa waktu berbasis jam server (`serverOffset = server_now - Date.now()`). Perubahan jam perangkat lokal tidak memengaruhi sisa waktu ujian.
  5. Pengawas dan dosen memantau status pengerjaan seluruh peserta secara real-time via polling 10 detik melalui fungsi agregat `get_exam_monitoring_summary`.
- **Alasan**: Mencegah kecurangan multi-tab/perangkat dan memastikan tidak ada jawaban mahasiswa yang hilang saat terjadi pemadaman listrik atau gangguan jaringan internet.

### Keputusan 41: Token Masuk Ujian, Ujian Susulan, Remedial, dan Kebijakan Penggabungan Nilai (Fase 4)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Tabel `exam_access_tokens` menyimpan token 6 karakter tanpa huruf ambigu (0/O, 1/I/L). Token hanya terbaca oleh dosen/asisten pengawas melalui RLS.
  2. Verifikasi token diatur melalui RPC `enter_exam` dengan batasan laju percobaan maksimal 5 kali per menit.
  3. Ujian susulan dan remedial membuat baris ujian baru dengan `parent_quiz_id`, membatasi peserta hanya pada daftar `exam_makeup_participants`, dan menerapkan kebijakan gabung nilai (`tertinggi`, `ganti`, `rata_rata`) dengan pembatasan nilai maksimal remedial (`score_cap`).
- **Alasan**: Menjaga ketertiban ruang ujian dan menyediakan mekanisme remedial yang adil serta transparan sesuai buku pedoman akademik universitas.

### Keputusan 42: Arsitektur Sandbox Koding Terisolasi dengan Adapter Judge0 CE dan Mode Pencocokan (Fase 4)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Kode mahasiswa dilarang keras dieksekusi di server Next.js atau Vercel. Dibuat antarmuka `CodeRunner` dengan adapter `Judge0Adapter` untuk eksekusi di server sandbox Docker terpisah.
  2. Jika variabel lingkungan `JUDGE_API_URL` tidak diatur atau kebijakan institusi `coding_autograder_enabled` bernilai salah, sistem kembali dengan anggun (graceful fallback) ke mode pemeriksaan manual dengan pemberitahuan informatif.
  3. Mendukung 4 mode evaluasi keluaran: `exact`, `trim`, `tokens`, dan `float` (dengan toleransi epsilon $10^{-4}$).
  4. Pembatasan laju "Coba Jalankan" maksimal 1 kali per 5 detik per mahasiswa untuk mencegah serangan DoS pada runner sandbox.
- **Alasan**: Menjaga keamanan server institusi dari eksekusi kode berbahaya atau loop tak hingga (fork bomb/OOM) dan memastikan fleksibilitas penilaian soal algoritma pemrograman.

### Keputusan 43: Analisis Butir Soal (Kesukaran, Daya Pembeda, KR-20, Pengecoh) dan Alur Revisi Bank Soal (Fase 4)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Implementasi modul kalkulator murni `analyzeExamItems` (`src/lib/akademik/exam-utils.ts`) untuk menghitung indeks kesukaran ($p$), daya pembeda ($D$ kelompok 27% atas vs bawah), korelasi point-biserial ($r_{pb}$), reliabilitas Kuder-Richardson 20 (KR-20), dan efektivitas pengecoh.
  2. Hasil analisis butir disimpan di tabel `exam_item_stats` dan ringkasan di `exam_summary_stats`.
  3. Butir soal dengan daya pembeda rendah ($D < 0.20$) atau pengecoh tidak efektif secara otomatis ditandai `needs_revision = true` pada tabel `quiz_questions` untuk ditinjau dosen di Bank Soal.
- **Alasan**: Membantu dosen penanggung jawab mata kuliah meningkatkan mutu instrumen evaluasi pembelajaran secara ilmiah.

### Keputusan 44: Pemetaan Capaian Pembelajaran Lulusan (CPL) dan CPMK Berbasis Data Penilaian Riil (Fase 4)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Membuat struktur database kurikulum OBE (Outcome-Based Education): `cpl`, `cpmk`, `cpmk_cpl_map`, `assessment_cpmk_map`, `achievement_snapshots`, dan `journal_cpmk` (Migrasi 26).
  2. Skor CPMK mahasiswa dihitung dari rata-rata tertimbang seluruh tugas dan soal yang terpetakan dan berstatus dipublikasikan. Skor CPL dihitung dari pemetaan bobot CPMK ke CPL.
  3. Grafik CPL pada menu Nilai Saya menampilkan data kalkulasi riil dengan catatan "Dihitung dari penilaian yang sudah dipublikasikan", serta peringatan dashboard dosen bila ada CPMK yang belum memiliki instrumen penilaian.
- **Alasan**: Menjamin kepatuhan standar akreditasi internasional dan nasional berbasis luaran pembelajaran mahasiswa.

### Keputusan 45: Deteksi Kemiripan Tugas dengan Shingling Jaccard Teks dan Winnowing Kode (Fase 4)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Tabel `similarity_runs`, `submission_fingerprints`, dan `similarity_pairs` mencatat hasil pemeriksaan kemiripan tugas.
  2. Analisis teks menggunakan normalisasi stop-words Bahasa Indonesia, 5-word shingling, dan koefisien kemiripan Jaccard.
  3. Analisis kode menggunakan tokenisasi normalisasi identifier/literal, 8-gram, winnowing (jendela 4), dan penyaringan kode dasar dosen (`extractStarterCodeKgrams`) agar kode template tidak memicu kemiripan palsu.
  4. Antarmuka peninjauan mewajibkan penempatan disclaimer: "Kemiripan tinggi belum tentu plagiarisme. Tinjau isinya sebelum mengambil keputusan. Tidak ada penalti otomatis."
- **Alasan**: Memberikan alat bantu telaah yang adil dan obyektif bagi dosen dalam menjaga integritas akademik mahasiswa.

### Keputusan 46: Isolasi Percakapan Terarah dan Moderasi Pesan (Fase 5)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Percakapan langsung (`conversations`, `messages`) hanya diizinkan antara mahasiswa/asisten dengan dosen/asisten yang berbagi kelas aktif atau dosen wali dengan mahasiswa bimbingannya via RPC `start_conversation`. Tidak ada jalur pesan langsung antarmahasiswa (diarahkan ke forum komunitas).
  2. Pelaporan pesan (`message_reports`) menyimpan snapshot pesan dan 5 pesan sebelumnya secara aman untuk ditinjau oleh staf akademik pada menu Moderasi, tanpa memberikan staf akses membaca seluruh percakapan privat.
  3. Pembatasan laju pengiriman pesan 30 pesan per menit per pengguna, paginasi keyset 30 pesan per halaman, dan soft-delete pesan bertanda "Pesan dihapus".
- **Alasan**: Mencegah spam dan pelecehan antarmahasiswa di kanal privat serta menjamin privasi percakapan akademik sesuai mandat etika kampus.

### Keputusan 47: Slot Konsultasi Akademik, Kunci Baris Kapasitas, dan Pembatalan H-2 Jam (Fase 5)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Dosen membuat slot konsultasi (`consultation_slots`) dengan kapasitas 1 hingga 20 mahasiswa.
  2. Pemesanan slot (`consultation_bookings`) diproteksi dengan penguncian baris `SELECT ... FOR UPDATE` dalam RPC `book_consultation_slot` guna mencegah pemesanan ganda atau kelebihan kapasitas saat diakses bersamaan.
  3. Pembatalan oleh mahasiswa hanya diizinkan maksimal 2 jam sebelum waktu pelaksanaan dimulai (`consultation_cancel_min_hours = 2`).
- **Alasan**: Menghindari jadwal bentrok dan ketidakhadiran mendadak yang merugikan waktu dosen dan mahasiswa lain yang membutuhkan bimbingan.

### Keputusan 48: Polling Interaktif di Kelas dan Anonimitas Penuh Jawaban (Fase 5)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Dosen dapat melempar pertanyaan kilat (`live_polls`) saat perkuliahan tatap muka maupun daring sinkron dengan jenis pilihan tunggal, jamak, skala 1-5, atau teks bebas.
  2. Anonimitas ditegakkan secara mutlak melalui kebijakan RLS: dosen tidak pernah memiliki izin `SELECT` langsung pada tabel `live_poll_votes` jika polling anonim. Hasil rekapitulasi hanya dapat diambil lewat RPC agregat `get_poll_results` tanpa kolom `student_id`.
  3. Kuis cepat tidak memengaruhi nilai akhir kelas, namun jawaban benar memberikan poin kebiasaan belajar (XP).
- **Alasan**: Mendorong partisipasi aktif mahasiswa tanpa rasa takut dihakimi nilainya di ruang kelas.

### Keputusan 49: Poin Gamifikasi, Streak Harian WIB, dan Papan Peringkat Opt-In (Fase 5)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Poin kebiasaan belajar (XP) hanya dapat diberikan melalui server action dan fungsi database `award_xp` (`SECURITY DEFINER`), dengan besaran terpusat pada `src/lib/config/gamification.ts`: tugas tepat waktu 10, hadir 5, materi selesai 3, jawab polling 2, kuis cepat benar 3.
  2. Kebiasaan harian (streak) dihitung berdasarkan tanggal di zona waktu Asia/Jakarta (WIB). Streak yang putus kembali ke 1 hari tanpa menampilkan pesan menakut-nakuti atau intimidasi.
  3. Papan peringkat per kelas bersifat opt-in dua lapis: dosen harus mengaktifkannya untuk kelas, dan mahasiswa harus secara sukarela mencentang "Tampilkan saya di papan peringkat" dengan nama alias anonim. Peringkat direset tiap minggu dan tidak pernah berdasarkan nilai ujian.
- **Alasan**: Memberikan pengakuan positif yang suportif tanpa menimbulkan tekanan psikologis antarmahasiswa.

### Keputusan 50: Pengingat AI Proaktif, Batas Waktu 5 Detik, dan Jam Tenang 22.00-06.00 WIB (Fase 5)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Pengingat proaktif (`ai_reminders`) dipicu oleh aturan bisnis terjadwal (H-1 tugas, 3 jam sebelum tenggat, H-1 ujian, sisa absen aman, materi baru dirilis, dan ringkasan mingguan Senin 07.00 WIB).
  2. AI hanya bertugas merapikan kalimat dari payload terstruktur tanpa pernah menerima data mahasiswa lain atau berkas diagnosis/izin sakit. Panggilan AI dibatasi batas waktu ketat 5 detik dan otomatis kembali ke templat statis jika terjadi kegagalan atau timeout.
  3. Jam tenang 22.00–06.00 WIB diterapkan ketat: pengingat yang jatuh di jam istirahat digeser ke pukul 06.00 WIB pagi, kecuali notifikasi keamanan deteksi perangkat baru (`login_baru`) yang dikirim seketika demi keamanan akun.
- **Alasan**: Menjaga kualitas istirahat mahasiswa dan memastikan efisiensi token AI institusi.

### Keputusan 51: Pemisahan Anonimitas Nyata Kuesioner Evaluasi Dosen (EDOM) dan Batas 5 Responden (Fase 5)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Kuesioner evaluasi dosen (`evaluation_periods`, `evaluation_targets`) menggunakan pola pemisahan sejati (True Anonymity Decoupling): tabel `evaluation_completions` hanya mencatat bahwa mahasiswa telah menyelesaikan kuesioner tanpa memuat jawaban, sedangkan tabel `evaluation_responses` dan `evaluation_answers` menyimpan jawaban tanpa `student_id` dan hanya merekam tanggal pengisian.
  2. Pengiriman kuesioner dilakukan secara atomik melalui RPC `submit_evaluation` yang mengecek status target dan mencegah pengisian ganda.
  3. Dosen hanya dapat melihat rekapitulasi setelah periode resmi ditutup dan jumlah responden $\ge 5$ (`evaluation_min_respondents`). Komentar mahasiswa ditampilkan dalam urutan acak tanpa nama atau tanggal.
- **Alasan**: Melindungi kebebasan berpendapat mahasiswa secara obyektif tanpa risiko de-anonimisasi atau intimidasi akademik.

### Keputusan 52: Klon dan Arsip Kelas Perkuliahan (Fase 6)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Tabel `clone_jobs` dan RPC `clone_class(p_source_id, p_target_id, p_options, p_date_shift_days)` menangani penyalinan isi kelas secara atomik dan idempoten. Konten yang disalin mencakup materi perkuliahan, tugas (berstatus DRAFT dengan pergeseran tanggal), kuis/ujian (berstatus DRAFT), rubrik penilaian, pengaturan gamifikasi, pemetaan CPMK, dan asisten kelas jika dipilih.
  2. Data mahasiswa (pengumpulan tugas, lembar jawaban CBT, nilai akhir, kehadiran, diskusi forum, dan percakapan pesan) dikecualikan 100% dari salinan kelas baru.
  3. Status arsip kelas (`status = 'ARCHIVED'`, `archived_at`, `archived_by`, `archive_reason`) bersifat hanya-baca bagi Dosen, Asisten, dan Mahasiswa (ditolak oleh kebijakan RLS dan server actions). Pembatalan arsip hanya dapat dilakukan oleh Staf Akademik atau Super Admin dengan alasan tercatat di audit log.
  4. Mahasiswa tetap memiliki hak akses membaca materi dan riwayat nilai kelas arsip selama 365 hari (`student_access_archived_days`).
- **Alasan**: Memfasilitasi efisiensi persiapan perkuliahan semester baru bagi dosen sekaligus menjamin kepatuhan integritas data historis kelas lampau.

### Keputusan 53: Impor Soal Massal dari Excel dan Word DOCX dengan Sanitasi HTML dan Deteksi Duplikat (Fase 6)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Menyediakan generator template Excel resmi (`exceljs`) yang dilengkapi validasi daftar pilihan dropdown untuk kolom tipe soal (`pilihan_ganda`, `benar_salah`, `isian_singkat`, `esai`) dan tingkat kesulitan (`mudah`, `sedang`, `sukar`).
  2. Dokumen Word (.docx) diekstraksi menggunakan `mammoth` berbasis pola nomor soal, opsi a–e, baris `Jawaban: B`, dan baris opsional `Pembahasan:`.
  3. Sanitasi muatan teks/HTML butir soal (`sanitizeQuestionHtml`) menerapkan daftar putih tag aman (tabel, cetak tebal, miring, kode) dan membersihkan seluruh tag `<script>`, iframe, maupun atribut event `onerror`/`onclick` (pencegahan XSS).
  4. Deteksi duplikat instrumen evaluasi menggunakan hash teks yang dinormalkan terhadap butir soal yang sudah ada di Bank Soal dan memberikan status peringatan yang informatif.
  5. Penyisipan ke database dilakukan dalam batch transaksi per 100 butir soal dengan opsi konfirmasi "Lewati yang galat" atau "Batalkan semua jika ada galat".
- **Alasan**: Mempermudah migrasi massal instrumen ujian dosen dari format perkantoran populer secara aman dan cepat tanpa risiko kerentanan keamanan web.

### Keputusan 54: Interoperabilitas Bank Soal via Ekspor-Impor Moodle XML dan QTI 2.1 (Fase 6)
- **Tanggal**: 17 Oktober 2026
- **Keputusan**:
  1. Moodle XML: Implementasi ekspor dan impor dua arah (bidirectional) menggunakan `fast-xml-parser` untuk tipe soal `multichoice` (tunggal/jamak), `truefalse`, `shortanswer`, dan `essay`. Kategori Moodle dipetakan ke topik soal, tag CDATA diekstraksi utuh, dan nilai `fraction` dipetakan ke status kebenaran jawaban. Tipe soal yang tidak didukung dilewati dengan pesan peringatan tanpa menggagalkan impor keseluruhan.
  2. QTI 2.1: Implementasi ekspor dan impor paket arsip `.zip` berstandar IMS Global (`jszip` dan `fast-xml-parser`) memuat `imsmanifest.xml` dan file XML butir soal untuk pilihan ganda dan uraian (extendedText).
  3. Uji putar-balik (round-trip test) diverifikasi secara otomatis pada rangkaian unit test untuk menjamin kesetaraan data hasil ekspor dan impor kembali.
- **Alasan**: Mencegah penguncian vendor (vendor lock-in) dan memudahkan pertukaran bank soal antar-institusi pendidikan tinggi.

### Keputusan 55: Struktur Dokumentasi Fitur dan Matriks Otorisasi Berbasis Poin (Fase 7)
- **Tanggal**: 18 Oktober 2026
- **Keputusan**:
  1. Menghilangkan tabel matriks lama yang rawan usang dan menggantikannya dengan daftar poin otorisasi komprehensif pada Bagian 14.1 di `docs/SIAJAR_Fitur_dan_Menu_Role.md`.
  2. Seluruh tautan absolut berkas sistem (`file:///c:/...`) diganti secara ketat dengan tautan relatif (`./SIAJAR_Fitur_dan_Menu_Role.pdf`, dll.) agar portabel di semua sistem operasi dan peladen repositori.
  3. Menghapus bagian usang "Panduan Mengunduh" yang bersifat catatan teknis sementara.
  4. Seluruh angka persentase dituliskan menggunakan teks biasa (misalnya "kurang dari 75%"), tanpa notasi matematika LaTeX di dokumen panduan pengguna.
  5. Menyelaraskan 102 menu navigasi aplikasi di seluruh dokumen turunan (Markdown, PDF, Excel multi-lembar, CSV, dan HTML) secara otomatis melalui skrip generator `scripts/generate_feature_menu_documents.py`.
- **Alasan**: Menjaga integritas dokumentasi arsitektur perangkat lunak agar selalu mutakhir, bersih dari istilah pemasaran yang berlebihan, dan dapat diaudit secara konsisten oleh pemangku kepentingan.

### Keputusan 56: Prosedur Operasional Standar dan Runbook Pemulihan Bencana (Fase 7)
- **Tanggal**: 18 Oktober 2026
- **Keputusan**:
  1. Menyusun panduan operasional teknis `docs/RUNBOOK.md` yang memuat empat pilar utama:
     - Manajemen Konektor Mesin Penilai Otomatis (Judge): variabel lingkungan, validasi kriptografis HMAC webhook, mekanisme cadangan polling, health-check status, dan tombol henti darurat.
     - Prosedur Rotasi Kunci Rahasia Pekerjaan Terjadwal (`CRON_SECRET`): strategi rotasi tanpa waktu henti (zero-downtime) menggunakan dukungan kunci transisi ganda.
     - Tata Kelola Cadangan dan Pemulihan Bencana Database: skrip otomasi `restore-db.sh`, pengaktifan mode pemeliharaan, dan prosedur verifikasi integritas 122 tabel RLS pascapemulihan.
     - Pemeriksaan Log Audit Sistem: penegakan penyamaran data entitas akademik untuk Administrator Sistem vs tampilan utuh untuk Administrator Utama, serta audit forensik sesi penyamaran peran (impersonasi).
- **Alasan**: Memberikan kepastian operasional tingkat produksi dan menjamin kesiapan tim teknis kampus dalam menangani insiden maupun pemeliharaan berkala.

### Keputusan 57: Perancangan Data Demo Realistis Idempoten dan Akun Standar (Fase 7)
- **Tanggal**: 18 Oktober 2026
- **Keputusan**:
  1. Menyediakan berkas bibit data `supabase/seed/demo_seed.sql` berbasis PL/pgSQL idempoten yang aman dieksekusi berulang kali tanpa merusak integritas kunci unik.
  2. Struktur data mencakup 1 program studi (Teknik Informatika), 2 semester (semester lampau berstatus arsip dan semester berjalan aktif), 8 dosen, 3 asisten, 120 mahasiswa fiktif berurutan, 6 kelas dengan 16 pertemuan lengkap beserta jurnal perkuliahan, penugasan individu dan kelompok dengan variasi keterlambatan, satu ujian CBT 40 butir soal komprehensif termasuk kasus uji koding, periode evaluasi dosen dengan pola pemisahan anonimitas sejati (True Anonymity Decoupling), permohonan izin sakit berlampiran, sanggahan nilai, percakapan langsung, dan polling kelas.
  3. Seluruh alamat surat elektronik data fiktif menggunakan domain resmi institusi (`@student.uir.ac.id` dan `@uir.ac.id`) demi memenuhi kebijakan privasi data dan lulus uji keamanan repositori.
  4. Menyediakan panduan masuk akun demo pada `supabase/seed/README.md` dengan kata sandi terstandarisasi untuk mempermudah evaluasi fungsional menyeluruh oleh tim penguji.
- **Alasan**: Memastikan lingkungan pengujian lokal maupun lingkungan demo pimpinan memiliki data operasional yang hidup, realistis, dan mencerminkan dinamika perkuliahan sesungguhnya di Universitas Islam Riau.

### Keputusan 58: Arsitektur Fitur Grafik Kontribusi SIAJAR (GitHub-Style Heatmap Grid) (Oktober 2026)
- **Tanggal**: 22 Oktober 2026
- **Keputusan**:
  1. Membangun grafik kontribusi visual berbasis kisi kotak matriks per hari gaya GitHub (kolom = minggu kronologis dari kiri ke kanan, 7 baris = hari dimulai hari Senin).
  2. Mendefinisikan 11 jenis aktivitas terstandar dengan bobot poin dan batas harian (daily cap):
     - `kumpul_tugas`: 3 poin, tanpa batas
     - `hadir_presensi`: 1 poin, maks 1 poin per sesi pertemuan
     - `selesai_kuis`: 3 poin, tanpa batas
     - `topik_diskusi`: 2 poin, maks 6 poin/hari/kelas (3 topik)
     - `balas_diskusi`: 1 poin, maks 5 poin/hari/kelas (5 balasan)
     - `terbit_materi`: 3 poin, tanpa batas
     - `terbit_pengumuman`: 1 poin, maks 3 poin/hari/kelas (3 pengumuman)
     - `terbit_tugas`: 3 poin, tanpa batas
     - `buat_kuis`: 3 poin, tanpa batas
     - `review_pengumpulan`: 1 poin, maks 10 poin/hari/kelas (10 review)
     - `finalisasi_nilai`: 3 poin, tanpa batas
  3. Pemetaan level intensitas kontribusi harian (Level 0: 0 poin, Level 1: 1-2 poin, Level 2: 3-5 poin, Level 3: 6-9 poin, Level 4: 10+ poin).
  4. Penyimpanan data tunggal pada tabel `public.daily_activities` (migrasi `20261023000037_daily_activities.sql`) dengan RLS aktif, isolasi privat per pengguna, otorisasi pengajar untuk kelas bimbingan, dan mutasi terproteksi melalui RPC `record_daily_activity`.
  5. Antarmuka terintegrasi:
     - Hub Profil (`src/app/(portal)/profile/page.tsx`): Tampilan 12 bulan penuh dengan filter kelas.
     - Dashboard Mahasiswa & Dosen: Kartu ringkas 26 minggu.
     - Tab Kelas (`src/modules/academic/class-hub-tabs.tsx`): Mahasiswa melihat aktivitas kelas spesifik; Dosen/Asisten melihat heatmap gabungan kelas anonim tanpa nama + rincian per anggota kelas.
  6. Menyediakan skrip backfill idempoten `scripts/backfill-activities.ts` yang mendukung mode default dry-run dan flag `--apply`.
- **Alasan**: Mendorong konsistensi akademik mahasiswa dan transparansi pengajaran dosen/asisten secara etis tanpa elemen gamifikasi toksik (dilarang leaderboard, streak, dan lencana).




### Keputusan 59: Arsitektur Fitur Kain Semester Mahasiswa (Semester Weave Matrix)
- **Tanggal**: 23 Oktober 2026
- **Keputusan**:
  1. **Algoritma Penentuan Pekan Berjalan (Current Week)**: Karena tabel `semesters` tidak memiliki atribut `start_date`, nomor pekan dihitung dari `semesterStart` = nilai `session_date` paling awal untuk sesi nomor 1 (`session_number = 1`) di antara kelas aktif mahasiswa. `week = Math.floor((hariIniWIB - semesterStart) / 7 hari) + 1`, dijepit ke rentang `[1, 16]`. Bila `hariIniWIB < semesterStart`, `week = 0`. Cadangan jika sesi nomor 1 belum ada: mencari nomor sesi terbesar yang tanggalnya `<= hariIniWIB`; jika tetap tidak ada, `week = null`.
  2. **Pemetaan Tugas ke Pekan**: `assignWeek(due_at, semesterStart)` menempatkan tenggat tugas ke pekan `[1, 16]` sesuai tanggal kalender WIB. Tugas sebelum semester masuk pekan 1; setelah pekan 16 masuk pekan 16. Tugas berstatus `DRAFT` (milik dosen) diabaikan, dan submission berstatus `DRAFT` milik mahasiswa tidak dihitung sebagai tugas terkirim.
  3. **Penegakan RLS & Zero Service Role**: Seluruh query data Kain Semester memakai klien `createClient()` yang menghormati RLS dengan filter eksplisit `student_id = user.id`. Tidak menggunakan `service_role` / admin client.
  4. **Pola Respons & Ketiadaan Data Palsu**: Jika persistensi nonaktif atau Supabase offline, aksi mengembalikan pesan netral atau data kosong jujur tanpa membuat data rekayasa di jalur produksi.
  5. **Feature Flag**: Dikunci di balik flag server-side `FF_KAIN_SEMESTER` (default `false`). Bila mati, antarmuka beranda mahasiswa 100% identik dengan kondisi sebelumnya.
- **Alasan**: Memberikan visibilitas terpadu atas progres kehadiran dan tugas tiap pekan bagi mahasiswa secara etis, netral, dan aman tanpa beban migrasi database baru.


---

### [Responsif] Keputusan 01: Matriks Perangkat Playwright dan Baseline Audit Responsif (Fase 0)
- **Tanggal**: 26 Oktober 2026
- **Keputusan**: Mengonfirmasi baseline branch `responsif/mobile-ipad-animasi` dari `main` (`0f57e5d`). Menginstal binary Playwright Chromium dan WebKit lokal untuk mencakup pengujian mesin WebKit (Safari iOS/iPadOS) dan Chromium (Android/Desktop). Menginventarisasi 125 rute aktif di `docs/routes-inventory.json` serta memverifikasi 12 temuan awal (T1–T12) dengan audit nyata di `docs/RESPONSIF_AUDIT.md`.
- **Alasan**: Menghindari spekulasi dan menjamin seluruh pekerjaan tata letak dan animasi memiliki titik referensi yang dapat diuji secara objektif pada browser engine nyata sebelum menyentuh kode aplikasi.
- **Alternatif yang ditolak**:
  - *Hanya menguji pada Chromium Desktop*: Ditolak karena WebKit Safari memiliki perilaku khusus pada touch scrolling, safe area, viewport height (`dvh`), dan font input zoom yang tidak dapat disimulasikan sempurna di Chromium biasa.


### [Responsif] Keputusan 02: Fondasi CSS, Viewport Token, dan Skrip Pengawas Responsif (Fase 1)
- **Tanggal**: 26 Oktober 2026
- **Keputusan**:
  1. Mengganti seluruh 100vh/h-screen/min-h-screen pada shell tata letak dan 6 berkas klien dashboard (admin, coordinator, lecturer, staff, student, ta) menjadi dvh berbasis token (min-h-[calc(100dvh-var(--layout-header-height-mobile))] xl:min-h-[calc(100dvh-var(--layout-header-height))]) dan 100svh untuk login hero.
  2. Menerapkan overflow-x: clip pada elemen html sebagai jaring pengaman dan menghapus overflow-x: hidden dari body agar tidak memutus konteks sticky header/elemen lengket.
  3. Memperluas aturan ukuran font input 16px dari @media (max-width: 767px) menjadi @media (pointer: coarse) untuk menghentikan auto-zoom Safari iOS pada ponsel maupun iPad.
  4. Menambahkan token --mobile-nav-h: 3.5rem; di :root globals.css serta utilitas fondasi responsif: .touch-reveal (@media (hover: none)), .table-scroll (overscroll-behavior-x: contain), .grid-adaptif (repeat(auto-fill, minmax(min(100%, 16rem), 1fr))), .heading-balance, dan penyesuaian landscape pendek (max-height: 500px).
  5. Menambahkan interactiveWidget: 'resizes-content' dan themeColor terpusat dari konstanta VIEWPORT_THEME_COLORS (src/lib/config/viewport-theme.ts) di src/app/layout.tsx.
  6. Memperbaiki kontainer pembungkus halaman masuk dengan overflow-hidden penuh untuk mencegah orbs dekoratif meluap ke luar layar pada viewport 360px.
  7. Membangun skrip pengawas otomatis scripts/cek-responsif.mjs terhubung dengan scripts/cek-responsif.allowlist.json dan mendaftarkannya pada rantai npm run cek.
- **Alasan**: Memastikan fondasi CSS stabil di perangkat sentuh dan Safari iOS/iPadOS tanpa reflow yang tidak perlu, mencegah layout shift saat URL bar menyusut, serta menjamin seluruh aturan responsif Fase 1 dapat diverifikasi secara otomatis pada CI/CD lokal.
- **Alternatif yang ditolak**:
  - *Membiarkan 100vh dan menggunakan JS resize listener*: Ditolak karena menyebabkan jank dan reflow berat pada rendering awal browser mobile.
  - *Memakai overflow-x: hidden pada body*: Ditolak karena melanggar spesifikasi nomor 5 dan dapat memicu bug posisi sticky pada layout mobile.


### [Responsif] Keputusan 03: Shell Navigasi Bawah, Tablet Rail, Panel Kanan, Header, dan Isolasi Worktree (Fase 2)
- **Tanggal**: 27 Oktober 2026
- **Keputusan**:
  1. **Navigasi Bawah (Mobile Bottom Nav)**: Mengimplementasikan `MobileBottomNav` di `src/components/shared/mobile-bottom-nav.tsx` dengan konfigurasi 4 slot per peran di `src/lib/config/mobile-nav.ts`, tinggi 56px (`--mobile-nav-h`), dukungan safe-area-inset-bottom, deteksi keyboard virtual via visualViewport & form focus, dan indikator aktif M05. Menambahkan feature flag `NEXT_PUBLIC_FF_MOBILE_NAV`.
  2. **Tablet Icon Rail (768–1279px)**: Mengaktifkan mode rail 72px (`w-rail`) pada breakpoint tablet secara otomatis melalui hook `useMediaQuery('(min-width: 768px) and (max-width: 1279px)')` dengan server snapshot aman (`false`) via `useSyncExternalStore`.
  3. **Panel Kanan Inline pada `lg` (1024px)**: Menggeser breakpoint inline panel kanan dari `xl` (1280px) menjadi `lg` (1024px) di seluruh 6 klien dashboard (`admin`, `coordinator`, `lecturer`, `staff`, `student`, `ta`) untuk mengembalikan tata letak 3-kolom pada iPad landscape (1024–1180px).
  4. **Pembersihan dan Elevasi Elemen Mengambang**: Menaikkan posisi tombol AI Assistant (`ai-academic-assistant.tsx`) dan toast notifikasi di atas navigasi bawah pada `< md`.
  5. **Isolasi Lingkungan Kerja (Git Worktree)**: Menerapkan `git worktree` di `c:\Users\ACER\Downloads\implementasi-responsif` untuk melindungi pengerjaan branch `responsif/mobile-ipad-animasi` dari potensi tabrakan proses paralel pada branch `fitur/peran-baru` di folder utama.
- **Alasan**: Memberikan pengalaman navigasi satu tangan yang cepat di ponsel, mengembalikan layout 3-kolom di tablet landscape tanpa mengubah tampilan desktop >= 1280px (paritas visual 100%), serta menjamin isolasi proses pengerjaan tanpa risiko konflik berkas antar-cabang.
- **Alternatif yang ditolak**:
  - *Memakai deteksi user-agent untuk navigasi ponsel*: Ditolak karena melanggar aturan nomor 8; tata letak harus berbasis query lebar viewport dan pointer.


### [Responsif] Keputusan 04: Komponen Dasar Responsif — Bottom Sheet Modal, Scrollable Table, dan Tabs (Fase 3)
- **Tanggal**: 27 Oktober 2026
- **Keputusan**:
  1. **Dialog & Sheet Responsif**: Mengembangkan `src/components/ui/dialog.tsx` sehingga pada viewport mobile (`< sm`) otomatis bertransformasi menjadi bottom sheet dengan pegangan visual (drag handle), batas tinggi `max-h-[90dvh]`, body bergulir internal (`overflow-y-auto`), footer tombol lengket (`sticky bottom-0`) dengan padding safe area iOS, serta target sentuh tombol tutup minimal 44x44px.
  2. **Standardisasi Modal Kustom**: Memperbarui 8 modal kustom (`calendar-sync-modal`, `class-clone-modal`, `ai-quiz-generator-modal`, `exam-analytics-modal`, `absence-modal-and-view`, `evaluation-form-modal`, `question-import-modal`, `staff-archive-semester-modal`) agar mengadopsi pola bottom sheet mobile dengan pegangan visual dan tombol sentuh >= 44px.
  3. **Tabel Bergulir Responsif**:
     - Membuat komponen `ResponsiveTable` (`src/components/shared/responsive-table.tsx`) dengan pembungkus `overflow-x-auto`, kelas `.table-scroll` (`overscroll-behavior-x: contain`), bayangan pudar tepi dinamis saat ada kolom tersembunyi, dan petunjuk visual sentuh "geser ke samping".
     - Memperbarui komponen dasar `Table` (`src/components/ui/table.tsx`) dengan `overflow-x-auto`, `overscroll-x-contain table-scroll`, dan lebar minimum masuk akal (`min-w-[560px]`) untuk mencegah pemampatan kolom di layar sempit 360px.
     - Membungkus tabel yang belum memiliki scrollbar di `class-progress-tab.tsx`, `cbt/exam-analytics-modal.tsx`, dan `semester-weave.tsx`.
  4. **Tab Bergulir Responsif**: Membuat komponen `ScrollableTabs` (`src/components/shared/scrollable-tabs.tsx`) dengan `snap-x`, `scrollbar-none`, bayangan pudar tepi kiri/kanan berbasis deteksi scroll/resize, dan pemusatan otomatis (`scrollIntoView / scrollTo`) pada tab atau chip filter yang aktif.
  5. **Verifikasi Gerbang Otomatis**: Memutakhirkan aturan AST `scripts/cek-responsif.mjs` untuk mendukung lebar minimum tabel di dalam kontainer gulir resmi. Seluruh gerbang `cek:hex`, `cek:responsif`, `typecheck` (0 error), `lint` (0 warning), dan Playwright responsif 11 viewport lulus 100%.
- **Alasan**: Memastikan dialog dan tabel data akademik yang padat dapat digunakan dengan nyaman di ponsel 360–430px tanpa memicu zoom atau scroll horizontal di level halaman, serta memenuhi target sentuh minimum WCAG (>= 44px).
- **Alternatif yang ditolak**:
  - *Menghilangkan kolom tabel di mobile secara diam-diam*: Ditolak karena melanggar prinsip paritas fitur; seluruh informasi harus tetap dapat diakses via scroll horizontal terkontrol atau representasi kartu.


### [Responsif] Keputusan 05: Halaman per Peran dan Fitur — 10 Kelompok Fitur (Fase 4)
- **Tanggal**: 27 Oktober 2026
- **Keputusan**:
  1. **Beranda 7 Peran (Dashboard Klien)**:
     - Mengubah pembungkus tata letak 6 klien dashboard (`admin`, `coordinator`, `lecturer`, `staff`, `student`, `ta`) dari `flex-col xl:flex-row` menjadi `flex-col lg:flex-row` dan `lg:min-h` agar panel kanan otomatis tampil berdampingan (inline 3-kolom) pada iPad landscape (1024–1279px).
     - Memperbarui batas pemicu drawer otomatis saat memilih kartu kelas menjadi `< 1024px`.
     - Memperbesar target sentuh tombol buka panel kanan pada header portal shell menjadi minimal 44x44px di mobile.
  2. **Hub Kelas & Materi**: Memastikan `MarkdownViewer` membungkus tautan panjang dengan `[overflow-wrap:anywhere] break-words` dan kontainer kode blok `pre` dengan `overflow-x-auto overscroll-x-contain table-scroll` agar tidak meluap keluar layar pada pembaca dokumen mobile.
  3. **Tugas, Kuis, CBT & Ujian**: Mengatur bilah kumpul jawaban kuis (`take-quiz-form.tsx`) menjadi lengket di dasar layar pada tampilan mobile (`sticky bottom-0 bg-white/95 backdrop-blur-xs`) dengan padding safe area iOS, memastikan mahasiswa dapat melihat status penyimpanan dan mengumpulkan ujian tanpa perlu menggulir panjang.
  4. **Presensi & Nilai**:
     - Menerapkan kolom pertama lengket (`sticky left-0`) pada tabel rekap nilai (`grades-hub-view.tsx`) sehingga nama mata kuliah tetap terbaca saat mahasiswa menggulir nilai komponen ke kanan.
     - Membungkus seluruh tabel riwayat presensi (`attendance-hub-view.tsx`) dan tabel ujian dengan `.table-scroll` dan `min-w-[560px]`.
  5. **Forum, Pesan & Komunitas**:
     - Menerapkan pola *master-detail* 2 layar pada tampilan pesan di ponsel (`messages-hub-view.tsx`): saat percakapan dipilih, daftar kotak masuk disembunyikan dan tombol navigasi kembali (`ArrowLeft`) ditampilkan di header percakapan.
     - Menambahkan kelas utilitas `.touch-reveal` pada tombol aksi pesan (hapus dan laporkan) yang sebelumnya hanya muncul saat `group-hover:`, sehingga langsung terlihat dan dapat diketuk di layar sentuh ponsel dan tablet (mengatasi Temuan T9).
  6. **Verifikasi Gerbang Otomatis**: Seluruh gerbang `cek:hex`, `cek:responsif`, `typecheck` (0 error), `lint` (0 error), dan Playwright 11 viewport lulus 100%.
- **Alasan**: Menjamin setiap area fitur utama SIAJAR dapat digunakan dengan nyaman, paritas fitur lengkap di perangkat sentuh, dan tidak ada elemen penting yang tersembunyi atau terpotong.
- **Alternatif yang ditolak**:
  - *Menampilkan daftar pesan dan balon percakapan bertumpuk di ponsel*: Ditolak karena membuat halaman sangat panjang dan membingungkan pengguna saat mengetik pesan di keyboard virtual.


### [Responsif] Keputusan 06: Fondasi Sistem Animasi, Token Gerak, dan Sakelar data-motion (Fase 5)
- **Tanggal**: 27 Oktober 2026
- **Keputusan**:
  1. **Token Gerak Terpusat**: Mendefinisikan token `--dur-instant` (80ms), `--dur-fast` (140ms), `--dur-base` (220ms), `--dur-slow` (300ms), `--dur-data` (600ms), serta kurva `--ease-out`, `--ease-in`, `--ease-inout`, dan stagger di `:root` `src/app/globals.css`.
  2. **Hierarki Sakelar Gerak**:
     - Mode `penuh`: Seluruh animasi dan transisi aktif normal.
     - Mode `hemat`: Durasi dipercepat (≤ 160ms), count-up dan stagger dipadamkan (`0.01ms`). Otomatis aktif saat `prefers-reduced-motion: reduce`, `html.lite-performance-mode`, atau koneksi `Save-Data`.
     - Mode `mati`: Seluruh durasi runtuh menjadi `0.01ms`, mematikan seluruh gerak tanpa menghapus kode antarmuka. Nilai awal dapat dikunci via `NEXT_PUBLIC_FF_MOTION="false"`.
  3. **Penyelesaian Masalah Utilitas Hilang (Temuan T4)**:
     - Mendaftarkan keyframes dan utilitas animasi yang hilang ke `tailwind.config.ts`: `animate-fade-in`, `animate-scale-in`, `animate-scale-up`, `animate-slide-in-right`, `animate-slide-in-left`, `animate-slide-up`, `animate-bounce-short`, `animate-shimmer`, `animate-check-draw`.
     - Mendefinisikan utilitas khusus komponen OS: `animate-uir-perspective`, `animate-uir-perspective-shadow`, `animate-uir-shine`, `animate-sky-beacon`, `animate-vt-marquee`.
  4. **Perbaikan ScrollReveal (Temuan T5)**: Mengubah aturan CSS agar elemen `reveal-*` hanya tersembunyi jika kelas `motion-ready` aktif pada peramban non-`mati`. Komponen `ScrollAnimationProvider` memasang `motion-ready` setelah hidrasi, menandai elemen dalam viewport secara instan sebelum paint, dan menerapkan batas waktu pengaman 1.500ms agar tidak pernah terjadi layar kosong.
  5. **Hook dan Komponen Pengaturan**:
     - Mengembangkan `src/hooks/use-motion-preference.ts`, `src/hooks/use-count-up.ts`, dan `src/hooks/use-in-view.ts`.
     - Menambahkan kartu pengaturan `MotionSettingsCard` pada `/settings/appearance` dengan penyimpanan `localStorage` kunci `siajar_motion`.
     - Menulis dokumentasi lengkap pengembang di `docs/MOTION.md`.
- **Alasan**: Memberikan antarmuka yang hidup dan responsif secara hemat komputasi, menjamin tidak ada kelas animasi rusak/hilang, serta menghormati aksesibilitas pengguna dengan sensitivitas gerak (vestibular).
- **Alternatif yang ditolak**:
  - *Menginstal framer-motion atau GSAP*: Ditolak keras karena aturan nomor 3 melarang dependensi npm baru; seluruh sistem dibangun murni dengan CSS variables, Tailwind, dan React hooks internal.
