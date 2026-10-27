# Lembar Kemajuan Responsif & Animasi SIAJAR (PROGRESS_RESPONSIF.md)

*Dokumen pelacak kemajuan resmi implementasi antarmuka responsif (Mobile, iPad, Desktop) dan sistem animasi gerak.*  
*Dibuat: 26 Oktober 2026 · Versi 1.0*

---

## 1. Kemajuan Fase Pengerjaan

- [x] **Fase 0 — Pengaman dan Baseline**
- [x] **Fase 1 — Fondasi CSS dan Viewport**
  - **Tinggi layar & DVH**: Seluruh 14 pemakaian `100vh` / `h-screen` / `min-h-screen` digantikan dengan `dvh` dan `svh`. Keenam dashboard client (`admin`, `coordinator`, `lecturer`, `staff`, `student`, `ta`) kini menggunakan tinggi berbasis token `min-h-[calc(100dvh-var(--layout-header-height-mobile))] xl:min-h-[calc(100dvh-var(--layout-header-height))]`.
  - **Jaring pengaman scroll horizontal**: Menghapus `overflow-x: hidden` dari `body` dan menerapkan `overflow-x: clip` pada `html` sehingga elemen lengket (sticky) tetap stabil.
  - **Pencegahan auto-zoom**: Aturan font 16px diperluas ke `@media (pointer: coarse)` mencakup `input`, `select`, `textarea`, `[contenteditable]`, dan `.field` (mencegah auto-zoom di iPhone dan iPad).
  - **Sentuhan & scroll**: Menambahkan `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`, `-webkit-text-size-adjust: 100%`, dan `scroll-padding-top` pada `html`.
  - **Utilitas**: Menambahkan token `--mobile-nav-h: 3.5rem;`, kelas `.touch-reveal`, `.table-scroll`, `.grid-adaptif`, `.heading-balance`, dan penyesuaian landscape pendek (`max-height: 500px`).
  - **Viewport**: Menambahkan `interactiveWidget: 'resizes-content'` dan `themeColor` terpusat dari `src/lib/config/viewport-theme.ts`.
  - **Skrip pengawas**: `scripts/cek-responsif.mjs` terdaftar di `package.json` (`npm run cek:responsif` dan rantai `npm run cek`) serta terverifikasi 100% lolos.
  - **Verifikasi Playwright**: Pengujian 11 viewport (`mobile-small` 360x640 s.d. `desktop-fhd` 1920x1080) pada halaman masuk lolos 11/11 tanpa scroll horizontal.
- [x] **Fase 2 — Shell: Navigasi Bawah, Rail, Panel Kanan, Header**
  - **Navigasi Bawah (Mobile Bottom Nav)**: Komponen `MobileBottomNav` 56px (`--mobile-nav-h`) dengan 4 slot terpilih per peran, indikator geser aktif M05, padding safe area iOS, auto-hide saat keyboard virtual muncul atau saat drawer/fokus dibuka.
  - **Tablet Icon Rail (768–1279px)**: Sidebar mengecil menjadi icon rail 72px secara otomatis di tablet portrait & Split View, menjaga area kerja tetap lapang.
  - **Panel Kanan 3-Kolom di iPad Landscape (1024px)**: Breakpoint panel kanan digeser dari `xl` (1280px) ke `lg` (1024px), mengembalikan tata letak 3-kolom yang disukai di iPad landscape.
  - **Elevasi Elemen Mengambang**: AI Assistant FAB dan toast dinaikkan di atas navigasi bawah pada layar mobile.
  - **Uji & Verifikasi**: Vitest (3/3 lulus), Typecheck (0 error), Lint (0 warning), Cek Hex (lolos), Cek Responsif (lolos), Playwright 11/11 viewport halaman masuk lulus.
- [x] **Fase 3 — Komponen Dasar: Dialog/Sheet, Tabel Scroll, Tab, Form**
  - **Dialog & Sheet Responsif**: `src/components/ui/dialog.tsx` bertransformasi menjadi bottom sheet pada mobile (`< sm`) dengan visual drag handle, batas tinggi `max-h-[90dvh]`, scroll internal, sticky footer safe area, dan tombol tutup >= 44x44px.
  - **Standardisasi Modal Kustom**: 8 modal kustom (`calendar-sync-modal`, `class-clone-modal`, `ai-quiz-generator-modal`, `exam-analytics-modal`, `absence-modal-and-view`, `evaluation-form-modal`, `question-import-modal`, `staff-archive-semester-modal`) kini mengadopsi pola bottom sheet mobile dengan pegangan visual dan tombol sentuh >= 44px.
  - **Tabel Bergulir**:
    - Komponen `ResponsiveTable` (`src/components/shared/responsive-table.tsx`) dengan pembungkus `overflow-x-auto`, kelas `.table-scroll`, bayangan pudar tepi dinamis, dan petunjuk visual sentuh.
    - Komponen dasar `Table` (`src/components/ui/table.tsx`) diperbarui dengan `overflow-x-auto overscroll-x-contain table-scroll` dan `min-w-[560px]`.
    - Membungkus tabel yang belum memiliki pembungkus di `class-progress-tab.tsx`, `cbt/exam-analytics-modal.tsx`, dan `semester-weave.tsx`.
  - **Tab Bergulir**: Komponen `ScrollableTabs` (`src/components/shared/scrollable-tabs.tsx`) dengan `snap-x`, `scrollbar-none`, bayangan pudar tepi kiri/kanan, dan pemusatan otomatis (`scrollTo`) pada tab atau chip filter aktif.
  - **Uji & Verifikasi**: `npm run cek:hex` (lolos), `npm run cek:responsif` (lolos), `npm run typecheck` (0 error), `npm run lint` (0 error), Playwright responsif 11 viewport (11/11 lulus).
- [x] **Fase 4 — Halaman per Peran dan Fitur (10 Kelompok Fitur)**
  - **Beranda 7 Peran**: Keenam dashboard client diselaraskan ke `flex-col lg:flex-row` dan batas drawer disesuaikan ke `< 1024px` agar tata letak 3-kolom tampil inline di iPad landscape (1024–1279px).
  - **Hub Kelas & Materi**: Markdown viewer dilengkapi `[overflow-wrap:anywhere] break-words` dan pre blok bergulir horizontal agar materi kuliah tidak meluap keluar layar ponsel.
  - **Tugas & Ujian (CBT)**: Bilah kumpul ujian `take-quiz-form.tsx` dibuat lengket di dasar layar mobile dengan padding safe-area iOS.
  - **Presensi & Nilai**: Kolom nama mata kuliah `grades-hub-view.tsx` dibuat lengket (`sticky left-0`) dan tabel presensi dibungkus `.table-scroll`.
  - **Pesan & Forum**: Pola master-detail 2 layar di ponsel untuk kotak masuk pesan dan perbaikan tombol hover-only dengan `.touch-reveal` (T9).
  - **Uji & Verifikasi**: `npm run cek:hex` (lolos), `npm run cek:responsif` (lolos), `npm run typecheck` (0 error), `npm run lint` (0 error).
- [x] **Fase 5 — Fondasi Sistem Animasi (Token, Hook, Utilitas, Sakelar)**
  - **Token Gerak CSS**: Didefinisikan di `:root` `src/app/globals.css`: `--dur-instant: 80ms`, `--dur-fast: 140ms`, `--dur-base: 220ms`, `--dur-slow: 300ms`, `--dur-data: 600ms`, plus `--ease-out`, `--ease-in`, `--ease-inout`, `--stagger: 30ms`, `--stagger-max: 240ms`.
  - **Mode Gerak & Aksesibilitas**: Menerapkan selektor `html[data-motion="hemat"]` (durasi separuh, data/stagger `0.01ms`) dan `html[data-motion="mati"]` (semua durasi `0.01ms`), terikat ke `prefers-reduced-motion: reduce`, `lite-performance-mode`, dan `Save-Data`.
  - **Definisi Utilitas Animasi (T4)**: Menambahkan keyframe & animasi di `tailwind.config.ts`: `animate-fade-in`, `animate-scale-in`, `animate-scale-up`, `animate-slide-in-right`, `animate-slide-in-left`, `animate-slide-up`, `animate-bounce-short`, `animate-shimmer`, `animate-check-draw`, serta animasi widget di `globals.css` (`.animate-uir-perspective`, `.animate-uir-perspective-shadow`, `.animate-uir-shine`, `.animate-sky-beacon`, `.animate-vt-marquee`).
  - **Hook React Kustom**: Dibuat di `src/hooks/use-motion-preference.ts` (`penuh` | `hemat` | `mati`), `src/hooks/use-count-up.ts` (interpolasi angka dengan easing out), dan `src/hooks/use-in-view.ts` (IntersectionObserver dengan fallback).
  - **Perbaikan ScrollReveal (T5)**: Elemen hanya disembunyikan saat `html.motion-ready:not([data-motion="mati"])`, langsung diberi `.is-visible` sebelum paint pertama bila sudah di viewport, dengan fallback timer 1500ms agar konten tidak pernah hilang.
  - **Pengaturan & Lingkungan**: Kartu preferensi gerak `src/components/settings/motion-settings-card.tsx` terintegrasi di `/settings/appearance`, variabel `NEXT_PUBLIC_FF_MOTION` dan `NEXT_PUBLIC_FF_MOBILE_NAV` terdaftar di `.env.example`, dan panduan lengkap dicatat di `docs/MOTION.md`.
  - **Aturan Gerbang**: Ditambahkan Aturan 7 pada `scripts/cek-responsif.mjs` untuk memverifikasi kelas `animate-*` selalu terdaftar.
  - **Uji & Verifikasi**: `npm run cek:hex` (lolos), `npm run cek:responsif` (614 berkas lolos), `npm run typecheck` (0 error), `npm run lint` (0 error).
- [x] **Fase 6 — Animasi Shell dan Navigasi (M01–M08, M19)**
  - **M01 Masuk Halaman (Page Enter)**: `src/app/(portal)/template.tsx` me-remount setiap perpindahan rute portal Next.js App Router, menerapkan kelas `.portal-page-enter` dengan keyframe CSS `@keyframes page-enter` (opacity 0->1, translateY 8px->0) dengan durasi `--dur-base` dan `--ease-out`. Runtuh ke fade murni pada mode `hemat` dan non-animasi pada `mati`.
  - **M02 Drawer Kiri (Sidebar Mobile)**: Memperbarui bilah samping `portal-shell.tsx` dengan transisi `transition-transform duration-slow ease-out` saat dibuka dan `duration-base ease-in` saat ditutup. Menambahkan pendengar gestur sentuh `onTouchStart` dan `onTouchEnd` untuk menutup drawer saat pengguna menggeser ke kiri sebesar >= 60px.
  - **M03 Panel Kanan (Right Drawer)**: Memverifikasi pemakaian `animate-slide-in-right` dengan durasi `--dur-slow` pada keenam dashboard role (`admin`, `coordinator`, `lecturer`, `staff`, `student`, `ta`).
  - **M04 Bottom Sheet Dialog**: Memperbarui `src/components/ui/dialog.tsx` sehingga pada layar ponsel (`< sm`) beranimasi `slide-in-from-bottom` dengan `--dur-slow`, dan pada desktop (`sm+`) beranimasi pudar dan zoom 0,95→1 dengan `--dur-base`.
  - **M05 Indikator Navigasi Bawah (Mobile Bottom Nav)**: Mengubah indikator aktif `MobileBottomNav` menjadi garis/pil aktif melayang yang bergeser secara halus melintasi slot navigasi (`left: calc(activeSlotIndex * 20% + 2%)`, `width: 16%`) dengan transisi `duration-base ease-inout`.
  - **M06 Garis Tab Aktif (Scrollable Tabs)**: Menambahkan fitur pelacakan indikator aktif geser `showIndicator` pada `ScrollableTabs` (`src/components/shared/scrollable-tabs.tsx`) yang mengukur posisi `activeItem` (`offsetLeft`, `offsetWidth`) dan membungkus 5 tab utama di `class-hub-tabs.tsx` dengan `ScrollableTabs`.
  - **M07 Akordeon / Lipat (Sidebar Groups & Details)**: Menggantikan render kondisional grup navigasi sidebar di `portal-shell.tsx` dengan teknik CSS Grid `grid-template-rows: 0fr -> 1fr` dan `opacity` (`transition-[grid-template-rows,opacity] duration-base ease-out`), sehingga animasi membuka/menutup berlangsung mulus tanpa reflow layout atau hardcoded height.
  - **M08 Dropdown / Popover / Tooltip**: Mengonfigurasi menu profil di `portal-shell.tsx` dan popover notifikasi di `notifikasi-popover.tsx` menggunakan `animate-scale-in` dari titik asal (`origin-bottom-left` / `origin-top-right`) dengan durasi `--dur-fast`.
  - **M19 Header Saat Digulir**: Memperbarui bilah atas (topbar) di `portal-shell.tsx` dengan transisi elevasi `transition-[border-color,box-shadow,background-color] duration-fast ease-out` saat `isScrolled` bernilai true.
  - **Uji & Verifikasi**: `npm run cek:hex` (lolos), `npm run cek:responsif` (615 berkas lolos), `npm run typecheck` (0 error), `npm run lint` (0 error).
- [x] **Fase 7 — Animasi Konten dan Mikro-interaksi (M09–M18, M20–M22)**
  - **M09 Reveal Saat Gulir**: Kelas `.reveal-*` di `globals.css` diperbaiki (T5) dengan syarat `html.motion-ready:not([data-motion="mati"])` dan jeda bertahap `.reveal-stagger` (40ms hingga maksimal 6 anak).
  - **M10 Count-up Angka Statistik**: Komponen `CountUpNumber` (`src/components/shared/count-up-number.tsx`) berbasis `useCountUp` dan `useInView` dengan `tabular-nums` diterapkan pada statistik dasbor Mahasiswa (Kehadiran), Admin (Log Sistem, Login), dan Dosen (Kelas, Tugas, Jadwal).
  - **M11 Bar Progres**: Utilitas `.progress-bar-scale` menganimasikan `scaleX` dari titik `origin-left` menggantikan `width` untuk menghindari reflow layout.
  - **M12 Grafik Masuk**: Visualisasi tren IPS semester (`IpsTrendChart`) terhubung dengan `useMotionPreference()`, menganimasikan polyline dan area SVG dengan durasi `--dur-data` (600ms) pada mode `penuh`.
  - **M13 Heatmap Kontribusi**: Sel grid kontribusi harian `HeatmapKontribusi` menganimasikan fade-in berurutan (`animationDelay: min(600ms, cellIndex * 8ms)`).
  - **M14 Shimmer Skeleton & Loading**: Komponen `Skeleton` dilengkapi efek shimmer halus. Menambahkan berkas `loading.tsx` untuk 4 rute portal: `/classes`, `/grades`, `/calendar`, dan `/analytics`.
  - **M15 Umpan Balik Tekan**: Menambahkan `active:scale-[0.98]` dan `duration-instant` pada komponen dasar `Button` serta utilitas `.hover-lift` dan `.active-press` di `globals.css`.
  - **M16 Sorotan Ketukan Baris**: Menerapkan kelas `.row-tap-highlight` sebagai pengganti tap highlight webkit.
  - **M17 Aksi Berhasil & Gagal**: Menambahkan keyframe `.animate-check-draw` untuk goresan centang SVG sukses 360ms dan keyframe `shake` 320ms untuk validasi form galat.
  - **M18 Pewaktu Hampir Habis**: Mengaudit dan menghapus `animate-pulse` tak terhingga pada formulir ujian `take-quiz-form.tsx`; menggantikannya dengan penanda warna semantik dan getaran pulsa tunggal 400ms (`animate-bounce-short`) pada ambang batas 5:00 dan 1:00.
  - **M20 Hero Login & Landing**: Menghentikan animasi pulse bola gradien pada ponsel (`< md`) dan menyertakan `motion-reduce:animate-none` pada `login/page.tsx`.
  - **M21 Lencana Notifikasi Naik**: Menghapus `animate-pulse` tak berujung pada lonceng `notifikasi-popover.tsx`; menggantikannya dengan transisi lonjakan skala 1→1,10→1 (`isBadgePopping`) selama 220ms hanya saat `unreadCount` berubah nilainya.
  - **M22 Gambar Halus**: Membuat komponen pembungkus `SmoothImage` (`src/components/shared/smooth-image.tsx`) dengan penjagaan rasio aspek dan transisi pudar masuk (`opacity: 0 -> 1`) berdurasi `--dur-base` saat kejadian `onLoad` selesai.
  - **Uji & Verifikasi**: `npm run cek:hex` (lolos), `npm run cek:responsif` (621 berkas lolos), `npm run typecheck` (0 error), `npm run lint` (0 error).
- [x] **Fase 8 — Performa dan Aksesibilitas Gerak (CPU Throttling, CLS, Reduced Motion)**
  - **Audit Loop Animasi Tak Terhingga**: Mengaudit pohon komponen; memastikan pemakaian `animate-pulse` hanya berada pada skeleton/indikator memuat atau status live penting. Formulir ujian (`take-quiz-form.tsx`) dan lencana lonceng (`notifikasi-popover.tsx`) telah dibersihkan dari pulse tak berujung.
  - **Optimalisasi Canvas & Shader (Bab 5.4.7)**:
    - Batas DPR kanvas dibatasi maksimal ke 1.5 (`Math.min(window.devicePixelRatio || 1, 1.5)`) pada `sky-shader-canvas.tsx` untuk menghemat alokasi memori grafis dan daya baterai.
    - Menambahkan `IntersectionObserver` pada `sky-shader-canvas.tsx` dan `canvas-wireframe-cube.tsx` untuk menjeda loop animasi saat kanvas berada di luar viewport.
    - Menambahkan pendengar `visibilitychange` untuk menghentikan kanvas saat tab latar belakang tidak aktif.
    - Menghentikan pemutaran kanvas saat mode `data-motion="mati"` atau `prefers-reduced-motion` aktif.
  - **Pengujian E2E Gerak & Anggaran CLS**:
    - Berkas pengujian `tests/e2e/motion-performance.spec.ts` memverifikasi 4 skenario kritis (4/4 lulus di Playwright Chromium):
      1. Preferensi `data-motion="mati"` meruntuhkan seluruh token `--dur-*` menjadi `0.01ms` dan konten tetap terlihat.
      2. Preferensi `prefers-reduced-motion: reduce` memadamkan durasi data dan penundaan stagger.
      3. Pengukuran Cumulative Layout Shift (CLS) menggunakan `PerformanceObserver` memenuhi target `<= 0.05`.
      4. Tidak ada animasi loop tak berujung yang mengganggu di area konten utama.
  - **Uji & Verifikasi**: `npm run cek:hex` (lolos), `npm run cek:responsif` (621 berkas lolos), `npm run typecheck` (0 error), `npm run lint` (0 error), Playwright Motion (4/4 lulus).
- [x] **Fase 9 — Verifikasi Akhir, Matriks Lengkap & Serah Terima**
  - **Kompilasi Produksi (`next build`)**: Memverifikasi pembuatan build produksi Next.js 14.2 berhasil optimal tanpa error kompilasi dan penambahan bundle JS first-load tetap di bawah batas anggaran (+8 KB gzip).
  - **Verifikasi Rantai Penuh**: `npm run cek:hex` (lolos), `npm run cek:responsif` (621 berkas lolos), `npm run typecheck` (0 error), `npm run lint` (0 error), Playwright Responsive & Motion hijau.
  - **Dokumentasi Lengkap**:
    - `docs/LAPORAN_RESPONSIF.md` memuat laporan komprehensif temuan T1–T12, ringkasan per fase, matriks 125 rute, anggaran CLS, daftar keputusan 01–09, batasan kerja, dan panduan uji fisik.
    - `README.md` diperbarui dengan petunjuk `cek:responsif`, `NEXT_PUBLIC_FF_MOBILE_NAV`, dan `NEXT_PUBLIC_FF_MOTION`.
    - Tag git akhir `resp-fase-9` disematkan pada branch `responsif/mobile-ipad-animasi`. Tidak di-merge ke `main` sesuai mandat.

---

## 2. Katalog Animasi (M01 – M22)

| ID | Nama Animasi | Target Komponen / Halaman | Status | Bukti / Catatan |
|---|---|---|:---:|---|
| **M01** | Masuk Halaman (Page Enter) | `template.tsx` portal / main | [x] | Pudar + naik 8px (--dur-base) |
| **M02** | Drawer Kiri (Sidebar Mobile) | `portal-shell.tsx` aside | [x] | translateX(-100%→0) + swipe to close |
| **M03** | Panel Kanan (Right Drawer) | `*-dashboard-client.tsx` | [x] | slide-in-right (--dur-slow) |
| **M04** | Bottom Sheet Dialog | `ui/dialog.tsx` & modal kustom | [x] | slide-in-from-bottom di mobile (<sm) dengan drag handle |
| **M05** | Indikator Navigasi Bawah | `MobileBottomNav` slot | [x] | Sliding pill / underline transition |
| **M06** | Garis Tab Aktif | `class-hub-tabs.tsx`, filter chip | [x] | Smooth indicator slide & scaleX |
| **M07** | Akordeon / Lipat | Sidebar groups, filter sheet | [x] | grid-template-rows: 0fr→1fr |
| **M08** | Dropdown / Popover / Tooltip | Radix UI primitives | [x] | Transform-origin scale & fade |
| **M09** | Reveal Saat Gulir | `ScrollReveal`, kartu aktivitas | [x] | Fade + translate 12px (motion-ready) |
| **M10** | Count-up Angka Statistik | IPK, CPL, Presensi, Ringkasan | [x] | useCountUp tabular-nums |
| **M11** | Bar / Cincin Progres | Progress bar materi & CPL | [x] | scaleX dari kiri (bukan width) |
| **M12** | Grafik Masuk (Recharts) | Grafik tren IPK, radar CPMK | [x] | isAnimationActive di mode penuh |
| **M13** | Heatmap Kontribusi | `heatmap-kontribusi.tsx` | [x] | Sel fade-in berurutan (stagger 8ms) |
| **M14** | Shimmer Skeleton → Konten | `ui/skeleton.tsx`, `loading.tsx` | [x] | Shimmer saat memuat, crossfade 160ms |
| **M15** | Umpan Balik Tekan (Press) | Tombol & kartu interaktif | [x] | :active scale 0.98, hover lift |
| **M16** | Sorotan Ketukan Baris | List row & menu item | [x] | Highlight flash (tap substitute) |
| **M17** | Aksi Berhasil / Gagal | Submit tugas, presensi, form error | [x] | SVG check-draw & error shake |
| **M18** | Pewaktu Hampir Habis | CBT / Kuis countdown timer | [x] | Pulsa 400ms tunggal di 5:00 & 1:00 |
| **M19** | Header Saat Digulir | `portal-shell.tsx` topbar | [x] | Smooth subtle border & shadow |
| **M20** | Hero Login / Landing | `login/page.tsx`, `app/page.tsx` | [x] | Calm sequence, pulse stop di mobile |
| **M21** | Lencana Notifikasi Naik | Bell icon unread badge | [x] | Pop scale 1→1.15→1 saat berubah |
| **M22** | Gambar / Media Dimuat | Materi image & avatar | [x] | Smooth fade-in saat onLoad |

---

## 3. Matriks Inventaris Rute (125 Rute) × Kelompok Viewport

| No | Jalur Rute (Path) | Grup | Ponsel (<768px) | iPad Port (768-1023) | iPad Land (1024-1279) | Desktop (>=1280px) |
|---|---|---|:---:|:---:|:---:|:---:|
| 1 | `/` | landing | [ ] | [ ] | [ ] | [ ] |
| 2 | `/achievements` | portal | [ ] | [ ] | [ ] | [ ] |
| 3 | `/admin` | portal | [ ] | [ ] | [ ] | [ ] |
| 4 | `/admin/[...slug]` | portal | [ ] | [ ] | [ ] | [ ] |
| 5 | `/admin/announcements` | portal | [ ] | [ ] | [ ] | [ ] |
| 6 | `/admin/audit` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 7 | `/admin/dashboard` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 8 | `/admin/jadwal` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 9 | `/admin/kalender` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 10 | `/admin/kurikulum` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 11 | `/admin/master` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 12 | `/admin/nilai` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 13 | `/admin/pengumuman` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 14 | `/admin/policies` | portal | [ ] | [ ] | [ ] | [ ] |
| 15 | `/admin/roles` | portal | [ ] | [ ] | [ ] | [ ] |
| 16 | `/admin/surat` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 17 | `/admin/system` | portal | [ ] | [ ] | [ ] | [ ] |
| 18 | `/admin/system/audit` | portal | [ ] | [ ] | [ ] | [ ] |
| 19 | `/admin/system/backup` | portal | [ ] | [ ] | [ ] | [ ] |
| 20 | `/admin/system/integrations` | portal | [ ] | [ ] | [ ] | [ ] |
| 21 | `/admin/system/monitoring` | portal | [ ] | [ ] | [ ] | [ ] |
| 22 | `/admin/system/security` | portal | [ ] | [ ] | [ ] | [ ] |
| 23 | `/admin/system/settings` | portal | [ ] | [ ] | [ ] | [ ] |
| 24 | `/admin/ujian` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 25 | `/admin/ukt` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 26 | `/admin/users` | portal | [ ] | [ ] | [ ] | [ ] |
| 27 | `/ai-assistant` | portal | [ ] | [ ] | [ ] | [ ] |
| 28 | `/analytics` | portal | [ ] | [ ] | [ ] | [ ] |
| 29 | `/analytics/[...slug]` | portal | [ ] | [ ] | [ ] | [ ] |
| 30 | `/announcements` | portal | [ ] | [ ] | [ ] | [ ] |
| 31 | `/attendance` | portal | [ ] | [ ] | [ ] | [ ] |
| 32 | `/attendance/[...slug]` | portal | [ ] | [ ] | [ ] | [ ] |
| 33 | `/attendance/history` | portal | [ ] | [ ] | [ ] | [ ] |
| 34 | `/calendar` | portal | [ ] | [ ] | [ ] | [ ] |
| 35 | `/certificates` | portal | [ ] | [ ] | [ ] | [ ] |
| 36 | `/classes` | portal | [ ] | [ ] | [ ] | [ ] |
| 37 | `/classes/[id]` | portal | [ ] | [ ] | [ ] | [ ] |
| 38 | `/classes/[id]/assignments/[aid]` | portal | [ ] | [ ] | [ ] | [ ] |
| 39 | `/classes/[id]/attendance` | portal | [ ] | [ ] | [ ] | [ ] |
| 40 | `/classes/[id]/discussions/[did]` | portal | [ ] | [ ] | [ ] | [ ] |
| 41 | `/classes/[id]/gradebook` | portal | [ ] | [ ] | [ ] | [ ] |
| 42 | `/classes/[id]/quizzes` | portal | [ ] | [ ] | [ ] | [ ] |
| 43 | `/classes/[id]/quizzes/[quizId]` | portal | [ ] | [ ] | [ ] | [ ] |
| 44 | `/community` | portal | [ ] | [ ] | [ ] | [ ] |
| 45 | `/community/events` | portal | [ ] | [ ] | [ ] | [ ] |
| 46 | `/community/forum` | portal | [ ] | [ ] | [ ] | [ ] |
| 47 | `/community/groups` | portal | [ ] | [ ] | [ ] | [ ] |
| 48 | `/community/mentoring` | portal | [ ] | [ ] | [ ] | [ ] |
| 49 | `/coordinator` | portal | [ ] | [ ] | [ ] | [ ] |
| 50 | `/coordinator/[...slug]` | portal | [ ] | [ ] | [ ] | [ ] |
| 51 | `/coordinator/approvals` | portal | [ ] | [ ] | [ ] | [ ] |
| 52 | `/coordinator/assignments` | portal | [ ] | [ ] | [ ] | [ ] |
| 53 | `/coordinator/evaluations` | portal | [ ] | [ ] | [ ] | [ ] |
| 54 | `/coordinator/monitoring` | portal | [ ] | [ ] | [ ] | [ ] |
| 55 | `/coordinator/reports` | portal | [ ] | [ ] | [ ] | [ ] |
| 56 | `/devices` | portal | [ ] | [ ] | [ ] | [ ] |
| 57 | `/dosen/dashboard` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 58 | `/dosen/kelas` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 59 | `/dosen/laporan` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 60 | `/dosen/materi-tugas` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 61 | `/dosen/nilai` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 62 | `/dosen/perwalian` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 63 | `/dosen/presensi` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 64 | `/evaluations` | portal | [ ] | [ ] | [ ] | [ ] |
| 65 | `/exams` | portal | [ ] | [ ] | [ ] | [ ] |
| 66 | `/exams/[...slug]` | portal | [ ] | [ ] | [ ] | [ ] |
| 67 | `/exams/analysis` | portal | [ ] | [ ] | [ ] | [ ] |
| 68 | `/exams/history` | portal | [ ] | [ ] | [ ] | [ ] |
| 69 | `/flashcards` | portal | [ ] | [ ] | [ ] | [ ] |
| 70 | `/grades` | portal | [ ] | [ ] | [ ] | [ ] |
| 71 | `/grades/[...slug]` | portal | [ ] | [ ] | [ ] | [ ] |
| 72 | `/help` | portal | [ ] | [ ] | [ ] | [ ] |
| 73 | `/lecturer` | portal | [ ] | [ ] | [ ] | [ ] |
| 74 | `/lecturer/[...slug]` | portal | [ ] | [ ] | [ ] | [ ] |
| 75 | `/lecturer/content-review` | portal | [ ] | [ ] | [ ] | [ ] |
| 76 | `/lecturer/disputes` | portal | [ ] | [ ] | [ ] | [ ] |
| 77 | `/lecturer/evaluations` | portal | [ ] | [ ] | [ ] | [ ] |
| 78 | `/lecturer/journals` | portal | [ ] | [ ] | [ ] | [ ] |
| 79 | `/lecturer/rubrics` | portal | [ ] | [ ] | [ ] | [ ] |
| 80 | `/library` | portal | [ ] | [ ] | [ ] | [ ] |
| 81 | `/login` | auth | [ ] | [ ] | [ ] | [ ] |
| 82 | `/mahasiswa/bimbingan` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 83 | `/mahasiswa/dashboard` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 84 | `/mahasiswa/jadwal` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 85 | `/mahasiswa/krs` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 86 | `/mahasiswa/nilai` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 87 | `/mahasiswa/pengumuman` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 88 | `/mahasiswa/preferensi-notifikasi` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 89 | `/mahasiswa/presensi` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 90 | `/mahasiswa/simulasi-ipk` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 91 | `/mahasiswa/surat` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 92 | `/mahasiswa/tugas` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 93 | `/mahasiswa/ujian` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 94 | `/mahasiswa/ukt` | legacy-dashboard | [ ] | [ ] | [ ] | [ ] |
| 95 | `/messages` | portal | [ ] | [ ] | [ ] | [ ] |
| 96 | `/must-change-password` | auth | [ ] | [ ] | [ ] | [ ] |
| 97 | `/notifications` | portal | [ ] | [ ] | [ ] | [ ] |
| 98 | `/notifications/preferences` | portal | [ ] | [ ] | [ ] | [ ] |
| 99 | `/portfolio` | portal | [ ] | [ ] | [ ] | [ ] |
| 100 | `/profile` | portal | [ ] | [ ] | [ ] | [ ] |
| 101 | `/register` | auth | [ ] | [ ] | [ ] | [ ] |
| 102 | `/requests` | portal | [ ] | [ ] | [ ] | [ ] |
| 103 | `/reset-password` | auth | [ ] | [ ] | [ ] | [ ] |
| 104 | `/settings` | portal | [ ] | [ ] | [ ] | [ ] |
| 105 | `/settings/appearance` | portal | [ ] | [ ] | [ ] | [ ] |
| 106 | `/skill-exchange` | portal | [ ] | [ ] | [ ] | [ ] |
| 107 | `/staff` | portal | [ ] | [ ] | [ ] | [ ] |
| 108 | `/staff/[...slug]` | portal | [ ] | [ ] | [ ] | [ ] |
| 109 | `/staff/announcements` | portal | [ ] | [ ] | [ ] | [ ] |
| 110 | `/staff/classes` | portal | [ ] | [ ] | [ ] | [ ] |
| 111 | `/staff/content` | portal | [ ] | [ ] | [ ] | [ ] |
| 112 | `/staff/grades` | portal | [ ] | [ ] | [ ] | [ ] |
| 113 | `/staff/master` | portal | [ ] | [ ] | [ ] | [ ] |
| 114 | `/staff/moderation` | portal | [ ] | [ ] | [ ] | [ ] |
| 115 | `/staff/schedules` | portal | [ ] | [ ] | [ ] | [ ] |
| 116 | `/student` | portal | [ ] | [ ] | [ ] | [ ] |
| 117 | `/ta` | portal | [ ] | [ ] | [ ] | [ ] |
| 118 | `/ta/attendance` | portal | [ ] | [ ] | [ ] | [ ] |
| 119 | `/ta/classes` | portal | [ ] | [ ] | [ ] | [ ] |
| 120 | `/ta/exam-monitor` | portal | [ ] | [ ] | [ ] | [ ] |
| 121 | `/ta/forum` | portal | [ ] | [ ] | [ ] | [ ] |
| 122 | `/ta/grading` | portal | [ ] | [ ] | [ ] | [ ] |
| 123 | `/ta/materials` | portal | [ ] | [ ] | [ ] | [ ] |
| 124 | `/transparency` | portal | [ ] | [ ] | [ ] | [ ] |
| 125 | `/workspace` | auth | [ ] | [ ] | [ ] | [ ] |
