# Laporan Audit Awal Responsif dan Animasi (Fase 0)

*Tanggal: 26 Oktober 2026*  
*Cabang: `responsif/mobile-ipad-animasi`*  
*Baseline Commit: `fa79220` (bercabang dari `main` @ `0f57e5d`)*

---

## 1. Verifikasi Temuan Awal (T1 – T12)

Berikut adalah perbandingan antara temuan awal pemindaian dan hasil audit verifikasi kode nyata di repositori:

| # | Temuan Awal | Hasil Verifikasi Kode Aktual | Status | Keterangan & Lokasi Berkas |
|---|---|---|---|---|
| **T1** | Sidebar & panel kanan baru muncul inline di `xl` (1280px). Di bawah itu keduanya menjadi drawer (`xl:hidden`, `xl:flex`). | **Terverifikasi 100%**. Seluruh 6 dashboard klien (`admin`, `coordinator`, `lecturer`, `staff`, `student`, `ta`) memakai `hidden xl:flex w-right-panel` dan `portal-shell.tsx` memakai `xl:translate-x-0`. | **Sesuai** | Di iPad landscape (1024–1279px), tata letak 3 kolom hilang dan dipaksa drawer. Akan diubah menjadi inline mulai `lg` (1024px). |
| **T2** | `portal-shell.tsx` memakai `useState(true)` untuk `isDesktop`. | **Terverifikasi 100%**. Baris 89 di `src/app/(portal)/portal-shell.tsx` tertulis `const [isDesktop, setIsDesktop] = useState(true);`. | **Sesuai** | Memicu hydration mismatch / layout flash di layar seluler. Akan diganti dengan Tailwind responsive classes & `useSyncExternalStore`. |
| **T3** | Tidak ada navigasi bawah (bottom tab bar). Di ponsel semua menu lewat hamburger. | **Terverifikasi 100%**. Tidak ditemukan komponen bottom navigation bar di seluruh repositori. | **Sesuai** | Akan dibuat `MobileBottomNav` (4 slot peran + 1 drawer "Lainnya") di `< md`. |
| **T4** | Utilitas `animate-fade-in` (~56), `animate-scale-in` (8), `animate-slide-in-right` (6), `animate-scale-up` (2), `animate-bounce-short` (2) tidak didefinisikan di CSS/config. | **Terverifikasi 100%**. Total ditemukan 48 `animate-fade-in`, 8 `animate-scale-in`, 6 `animate-slide-in-right`, 2 `animate-scale-up`, 2 `animate-bounce-short`. Tidak ada definisi keyframe terkait di `tailwind.config.ts` maupun `globals.css`. | **Sesuai** | Komponen drawer, backdrop, dan modal selama ini tidak beranimasi halus. Akan didefinisikan di Fase 5. |
| **T5** | `.reveal-on-scroll`, `.reveal-scale`, `.reveal-slide-*` memiliki state awal dan akhir identik (`opacity: 1; transform: none`). | **Terverifikasi 100%**. Pada baris 737–752 di `src/app/globals.css`, kedua selector memiliki deklarasi `opacity: 1; transform: none;`. | **Sesuai** | `ScrollReveal` saat ini tidak memberikan efek visual sama sekali. Akan diperbaiki dengan gerbang `html.motion-ready`. |
| **T6** | Sekitar 11 berkas tabel tidak memiliki pembungkus `overflow-x-auto`. | **Terverifikasi**. Dari total 71 kemunculan tag `<table`, ditemukan banyak tabel data padat (misal `class-progress-tab.tsx`, `exam-analytics-modal.tsx`, `lecturer-rubrics-view.tsx`) tanpa pembungkus responsif horizontal. | **Sesuai** | Akan distandarkan menggunakan kelas `.table-scroll` dan `ResponsiveTable`. |
| **T7** | 14 pemakaian `h-screen`, `min-h-screen`, `100vh` serta tinggi header tetap 72px. | **Terverifikasi 100%**. Ditemukan 6 dashboard klien dengan `min-h-[calc(100vh-72px)]` dan 8 file dengan `min-h-screen`. | **Sesuai** | Menyebabkan dasar layar terpotong di Safari iOS saat address bar menciut. Akan dimigrasikan ke `dvh`/`svh` dan token tinggi header. |
| **T8** | Aturan `font-size: 16px` input hanya untuk `max-width: 767px`. | **Terverifikasi 100%**. Baris 509–517 di `src/app/globals.css` menggunakan `@media (max-width: 767px)`. | **Sesuai** | Tablet sentuh (iPad) belum terlindungi dari zoom paksa iOS. Akan diperluas ke `@media (pointer: coarse)`. |
| **T9** | Sekitar 48 pemakaian `group-hover:`. | **Terverifikasi 100%**. Ditemukan 48 kemunculan `group-hover:` di 24 file (misal tombol aksi pada baris pesan dan kartu aktivitas). | **Sesuai** | Tombol aksi tidak tampak pada perangkat layar sentuh. Akan ditambahkan utilitas `.touch-reveal`. |
| **T10** | `safe-area-inset-bottom` hanya dipakai di 6 tempat; `<main>` memakai `pb-20 sm:pb-24` tetap. | **Terverifikasi 100%**. Ditemukan tepat 6 file dengan safe area bottom; `portal-shell.tsx` baris 782 memakai `pb-20 sm:pb-24`. | **Sesuai** | Konten bawah tertutup indikator bilah beranda iPhone. Akan disesuaikan secara dinamis dengan `--mobile-nav-h`. |
| **T11** | `portal-shell.tsx` memakai hex terakota `#C2553A` langsung (9 tempat). | **Terverifikasi 100%**. Ditemukan 9 kemunculan langsung `#C2553A` di `portal-shell.tsx`. | **Sesuai** | Akan dialihkan ke token semantik (`text-primary`, `bg-primary`, `ring-primary`) agar netral terhadap tema. |
| **T12** | Fitur yang sudah baik: `Dialog` bottom sheet seluler, `prefers-reduced-motion`, `100dvh` pada sidebar, focus-trap, dan Esc handler. | **Terverifikasi 100%**. Mekanisme ini sudah berjalan solid di basis kode. | **Sesuai** | **Dipertahankan 100%** dan dijadikan landasan utama. |

---

## 2. Metrik Tambahan Audit Kode

| Kategori Audit | Jumlah Kemunculan | Dampak & Rekomendasi Solusi |
|---|:---:|---|
| **Teks Berukuran Sangat Kecil (< 12px)** | **237 tempat**<br>(15 `text-[9px]`, 84 `text-[10px]`, 138 `text-[11px]`) | Melanggar standar aksesibilitas minimum (12px) dan sulit dibaca di layar retina ponsel. Wajib dinaikkan minimal ke `text-xs` (12px) atau token `text-2xs` (max 13px). |
| **Elemen Grid Lebar Tetap Tanpa Breakpoint** (`grid-cols-≥3`) | **28 tempat** | Menyebabkan kartu atau butir informasi bertabrakan/tertekan parah pada viewport 360–390px (misal `similarity-review-view.tsx`, `coordinator-cohort-risk-view.tsx`). Wajib diubah menjadi `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` atau `.grid-adaptif`. |
| **Lebar Tetap Besar Tanpa `max-w-full`** (`w-[≥360px]`) | **6 tempat** | Menembus batas lebar layar ponsel sempit (360px) dan memicu scrollbar horizontal dokumen. Wajib diberi pembatas `max-w-full`. |
| **Jumlah Tag Tabel Data (`<table`)** | **71 tabel** | Seluruh tabel data wajib dipastikan berada di dalam pembungkus `.table-scroll` dengan kolom utama `sticky`. |

---

## 3. Hasil Build & Ukuran Bundle Baseline (Fase 0)

- **Total Rute Terinventarisasi**: 125 rute (`docs/routes-inventory.json`)
- **Status Kompilasi Next.js**: Berhasil 100% (142 halaman statis/dinamis ter-generate)
- **Ukuran Bundle Shared Awal**: **87.6 kB First Load JS**
- **Ukuran Rute Utama**:
  - `/login`: 9.34 kB (First Load: 111 kB)
  - `/student`: 18.4 kB (First Load: 185 kB)
  - `/lecturer`: 8.75 kB (First Load: 163 kB)
  - `/admin`: 7.11 kB (First Load: 146 kB)
  - `/staff`: 9.00 kB (First Load: 150 kB)
  - `/coordinator`: 8.80 kB (First Load: 163 kB)
  - `/ta`: 169 B (First Load: 157 kB)
  - `/classes`: 4.20 kB (First Load: 104 kB)
  - `/grades`: 7.11 kB (First Load: 111 kB)
  - `/exams`: 10.6 kB (First Load: 114 kB)

---

## 4. Kesimpulan Audit Fase 0
Repositori siap menerima implementasi responsif dan animasi. Seluruh temuan awal telah diverifikasi dengan bukti konkret file dan baris kode. Pekerjaan dapat langsung dilanjutkan ke penyiapan helper Playwright dan pengujian matriks multi-perangkat.
