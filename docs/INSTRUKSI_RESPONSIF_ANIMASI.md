# SIAJAR — Instruksi Responsif Mobile/iPad dan Animasi untuk Antigravity

Versi 1 · 26 Oktober 2026 · Bahasa antarmuka dan dokumentasi: Indonesia

Taruh berkas ini di `docs/INSTRUKSI_RESPONSIF_ANIMASI.md`, lalu tempel prompt pembuka di bawah ke chat Antigravity. Berkas ini hanya mengatur **tampilan, tata letak, dan gerak**. Aturan tulisan antarmuka (bagian 4 di `docs/INSTRUKSI_ANTIGRAVITY.md`) tetap berlaku untuk semua teks baru, termasuk `aria-label`.

---

## Prompt pembuka (tempel ke Antigravity)

```
Baca seluruh isi docs/INSTRUKSI_RESPONSIF_ANIMASI.md dan bagian 4 di
docs/INSTRUKSI_ANTIGRAVITY.md sebelum menyentuh kode apa pun.

Tugasmu ada dua, dan hanya dua:
(A) Membuat seluruh halaman SIAJAR rapi, bersih, dan nyaman dipakai di ponsel dan iPad
    (portrait, landscape, dan Split View), tanpa mengubah tampilan desktop >= 1280px.
(B) Menambahkan sistem animasi yang halus, bertujuan, hemat performa, dan menghormati
    preferensi pengguna.

Jangan mengubah logika bisnis, database, RLS, server action, rute, menu-config, isi
teks fitur, atau palet warna. Pekerjaan ini netral palet: pakai token CSS yang sudah ada.

Syarat yang tidak boleh dilanggar:
1. Kerjakan hanya di branch responsif/mobile-ipad-animasi. Jangan menyentuh main.
2. Satu fase, satu rangkaian commit berawalan feat(responsif), feat(gerak), fix(responsif),
   atau test(responsif). Beri tag git resp-fase-N di akhir tiap fase.
3. Tidak ada dependency npm baru. Animasi memakai CSS, tailwindcss-animate yang sudah ada,
   dan hook React kecil buatan sendiri.
4. Semua animasi baru harus mati total bila html[data-motion="mati"], bila kelas
   lite-performance-mode aktif, atau bila prefers-reduced-motion: reduce.
5. Jangan menebak nama berkas, kelas, id menu, atau komponen. Nama bertanda "sketsa" di
   dokumen ini harus dicocokkan dulu dengan isi repo. Angka temuan di bagian 0 adalah hasil
   pemindaian awal: verifikasi ulang di Fase 0 dan catat selisihnya.
6. Setelah tiap fase: typecheck, lint, test, build, cek:hex, cek:responsif, dan matriks
   Playwright perangkat harus lolos. Tulis ringkasan dan centang di
   docs/PROGRESS_RESPONSIF.md.
7. Tampilan desktop >= 1280px harus identik dengan baseline (selisih screenshot <= 0,1%).

Mulai dari Fase 0 dan kerjakan sampai Fase 9 berurutan tanpa berhenti untuk konfirmasi.
Bila ada yang tidak jelas, pilih opsi paling aman, catat di docs/KEPUTUSAN.md dengan
awalan [Responsif], lalu lanjut.
```

---

## 0. Temuan awal dari repo

Hasil pemindaian saya pada commit `df38d86` (cabang `main`). Ini titik awal, bukan kebenaran final: **verifikasi ulang semuanya di Fase 0**.

| # | Temuan | Dampak |
| --- | --- | --- |
| T1 | Sidebar dan panel kanan baru muncul inline di `xl` (1280px). Di bawah itu keduanya menjadi drawer (`xl:hidden`, `xl:flex` di `portal-shell.tsx` dan tiap `*-dashboard-client.tsx`). | iPad landscape (1024–1180px) kehilangan tata letak 3 kolom yang sudah disukai pemilik. |
| T2 | `portal-shell.tsx` memakai `useState(true)` untuk `isDesktop`. | Kilatan tata letak salah saat render pertama di ponsel (hydration). |
| T3 | Tidak ada navigasi bawah (bottom tab bar). Di ponsel semua menu lewat hamburger. | Perpindahan antarmenu lambat dengan satu tangan. |
| T4 | Utilitas `animate-fade-in` (sekitar 56 pemakaian), `animate-scale-in` (8), `animate-slide-in-right` (6), `animate-scale-up` (2), `animate-bounce-short` (2) dipakai di JSX tetapi **tidak didefinisikan** di `tailwind.config.ts` maupun `globals.css`. Hanya `animate-fade-up` yang ada. | Backdrop dan drawer saat ini kemungkinan tidak beranimasi sama sekali. |
| T5 | `.reveal-on-scroll`, `.reveal-scale`, `.reveal-slide-*` di `globals.css` punya keadaan awal dan akhir yang sama (`opacity: 1; transform: none`). | `ScrollReveal` tidak menghasilkan efek visual. |
| T6 | Sekitar 11 berkas tabel tidak memiliki pembungkus `overflow-x-auto` di dekatnya (`class-progress-tab.tsx`, `exam-analytics-modal.tsx`, `features/master/components/*-table.tsx`, `admin-jadwal-view.tsx`, `admin-ukt-view.tsx`, `(dashboard)/dosen/kelas/page.tsx`, `kurikulum-view.tsx`). | Overflow horizontal di ponsel. |
| T7 | Sekitar 14 pemakaian `h-screen`, `min-h-screen`, `100vh`. Dua dashboard memakai `min-h-[calc(100vh-72px)]`, padahal tinggi header 56/64/72px tergantung breakpoint. | Lompatan tinggi saat bilah alamat Safari menyusut; dasar halaman terpotong. |
| T8 | Aturan `font-size: 16px` pada input hanya untuk `max-width: 767px`. `tests/e2e/responsive.spec.ts` hanya menguji halaman login. | Tablet sentuh dan halaman portal belum tercakup. |
| T9 | Sekitar 48 pemakaian `group-hover:`. Contoh: `messages-hub-view.tsx` baris ±348 (`opacity-0 group-hover:opacity-100`). | Tombol tak terlihat di layar sentuh. |
| T10 | `safe-area-inset-bottom` hanya dipakai di sekitar 6 tempat. `<main>` memakai `pb-20 sm:pb-24` tetap. | Konten tertutup home indicator iPhone dan bilah navigasi baru. |
| T11 | `portal-shell.tsx` banyak memakai hex terakota (mis. `#C2553A`) langsung, bukan token. | Pekerjaan ini harus netral palet agar tidak bentrok dengan redesain warna (hijau botol). Kode baru wajib memakai token. |
| T12 | Yang sudah baik dan **dipertahankan**: `Dialog` sudah berbentuk bottom sheet di ponsel; `prefers-reduced-motion` global; `lite-performance-mode`; `viewportFit: "cover"`; `100dvh` pada sidebar; fokus-trap dan Esc pada drawer; `--ease: cubic-bezier(0.22, 1, 0.36, 1)`; keyframe `rise`, `shake`, `sweep`. | Jangan dibongkar. |

Catatan konflik: redesain tema (hijau botol) juga menyentuh `portal-shell.tsx`, `sidebar.tsx`, dan dashboard klien. Bila cabangnya ada, **jangan di-merge ke cabang ini**. Cukup catat risiko konflik di `docs/KEPUTUSAN.md`. Pemilik yang menentukan urutan merge.

---

## 1. Tujuan, batas, dan larangan

**Tujuan responsif.** Setiap halaman di semua peran terlihat rapi dan bisa dipakai tanpa zoom, tanpa scroll horizontal di level halaman, dengan target sentuh yang nyaman, di ponsel (360–430px), iPad portrait/landscape (744–1366px), dan Split View iPad (320–678px).

**Tujuan animasi.** LMS terasa hidup dan responsif tanpa terasa seperti dekorasi: gerak menjelaskan perubahan (membuka panel, berpindah halaman, data masuk, aksi berhasil), bukan memamerkan efek.

### Larangan (dicek otomatis atau lewat review)

1. Mengubah logika, DB, RLS, server action, rute, `menu-config.ts`, atau isi teks fitur.
2. Menambah dependency npm (termasuk framer-motion, GSAP, AutoAnimate, Lottie, plugin container-queries).
3. Menghapus komponen atau kelas retro/OS. Kelas lama tetap ada walau tidak lagi dipakai di tempat tertentu.
4. Menambah hex baru. Pakai token (`bg-surface`, `text-foreground`, `border-border`, `bg-primary`, dan sebagainya). `npm run cek:hex` harus tetap lolos.
5. `overflow-x: hidden` pada `body` atau `html` sebagai tambalan. Cari akar masalahnya. Satu-satunya pengecualian: `overflow-x: clip` pada `html` sebagai jaring pengaman setelah semua akar masalah diperbaiki, dicatat di `KEPUTUSAN.md`.
6. `user-scalable=no`, `maximum-scale`, atau cara apa pun yang mematikan zoom pengguna.
7. Menyembunyikan fitur di ponsel tanpa pengganti. **Paritas fitur**: semua yang bisa dilakukan di desktop harus terjangkau di ponsel, walau bentuknya beda.
8. Deteksi perangkat lewat user-agent. Tata letak hanya bergantung pada lebar viewport, `pointer`, dan `hover` (supaya Split View, Stage Manager, dan jendela kecil di desktop ikut benar).
9. `100vh` atau `h-screen` tanpa pengganti `dvh`/`svh`.
10. Menganimasikan properti yang memicu layout (`width`, `height`, `top`, `left`, `margin`, `padding`), kecuali teknik `grid-template-rows` untuk collapse (6.5, M07).
11. Animasi `infinite` pada area konten. Hanya diizinkan untuk indikator memuat yang sedang benar-benar memuat.
12. Parallax, efek tilt 3D, kursor mengikuti, confetti, teks gradien berkilau, ikon memantul, splash screen, scroll-jacking, dan animasi sambutan yang menahan pengguna.
13. Menunda interaksi demi animasi. Elemen harus bisa diklik selama animasinya berjalan.
14. `window.innerWidth`, `matchMedia`, atau `localStorage` dibaca saat render server/hidrasi tanpa snapshot server yang aman (lihat 5.1.6).
15. Mengubah urutan DOM yang merusak urutan Tab, atau menghapus fokus-trap dan Esc pada drawer/dialog.

---

## 2. Jaring pengaman dan rollback

**Lapis 1 — Git.** Branch `responsif/mobile-ipad-animasi` dari `main`. Tag `resp-fase-0` … `resp-fase-9`. Satu fase = beberapa commit kecil dengan awalan jelas, sehingga bisa di-revert per fase atau per commit.

**Lapis 2 — Sakelar gerak (tanpa mengubah kode).**
- Atribut `html[data-motion]` dengan tiga nilai: `penuh`, `hemat`, `mati`. Nilai awal dari `NEXT_PUBLIC_FF_MOTION` (`penuh` bila `true`, `mati` bila `false`; bila kosong, `penuh`). Preferensi pengguna tersimpan di `localStorage` kunci `siajar_motion` (dibungkus try/catch, seperti `LiteModeToggle`).
- `prefers-reduced-motion: reduce` memaksa `hemat` bila pengguna belum memilih sendiri, dan `mati` untuk gerak non-esensial.
- `lite-performance-mode` (yang sudah ada) dianggap `hemat`.
- Semua durasi animasi baru memakai token `--dur-*`. Pada `mati`, semua token menjadi `0.01ms`, sehingga seluruh animasi runtuh tanpa menghapus kode.

**Lapis 3 — Sakelar navigasi bawah.** `NEXT_PUBLIC_FF_MOBILE_NAV` (default `true`). Bila `false`, ponsel kembali ke perilaku lama (hamburger saja). Tambahkan kedua variabel ke `.env.example` dengan komentar Indonesia.

**Lapis 4 — Deploy.** Tidak ada perubahan `vercel.json` atau skema DB, sehingga rollback di Vercel cukup *Promote previous deployment*.

Aturan agar rollback tetap berlaku: tidak ada perubahan skema, tidak ada perubahan data, tidak ada penghapusan berkas lama.

---

## 3. Protokol anti-terlewat

Bagian ini alasan pekerjaan ini tidak akan "miss".

1. **Inventaris rute otomatis.** Buat `scripts/list-routes.mjs` (sketsa) yang membaca semua `page.tsx` di `src/app/(portal)`, `src/app/(auth)`, `src/app/page.tsx`, dan `src/app/(dashboard)`, menghasilkan `docs/routes-inventory.json`: path, grup route, peran yang boleh mengakses (dari `isRouteAllowedForRole` / `MENU_CONFIG`), apakah dinamis (`[id]`, `[...slug]`).
2. **Contoh parameter dinamis.** `tests/e2e/helpers/route-samples.ts` (sketsa) memetakan rute dinamis ke contoh nyata dari data demo. Jangan menebak id: ambil dari seed demo atau dari tautan yang tampil di halaman induk.
3. **Uji cakupan.** Satu tes memastikan **setiap rute di inventaris** dikunjungi oleh matriks e2e responsif atau tercatat di `docs/RESPONSIF_PENGECUALIAN.md` dengan alasan tertulis (mis. "halaman redirect", "API"). Rute baru yang lupa diuji membuat tes gagal.
4. **Gerbang kode otomatis `cek:responsif`.** Skrip `scripts/cek-responsif.mjs` (polanya seperti `cek:hex`), didaftarkan di `package.json` dan di rantai `npm run cek`. Aturannya ada di bagian 8. Pengecualian hanya lewat `scripts/cek-responsif.allowlist.json`, tiap entri wajib punya `alasan`.
5. **Berkas kemajuan.** `docs/PROGRESS_RESPONSIF.md` berisi kotak centang untuk setiap rute di inventaris × setiap kelompok viewport, dan untuk setiap animasi M01–M22. Tidak ada item "selesai" tanpa bukti (nama tes atau tangkapan layar).
6. **Definisi selesai per halaman** (10 butir, bagian 5.6) diterapkan ke setiap rute, bukan hanya rute contoh.

---

## 4. Matriks perangkat dan breakpoint

Tailwind bawaan dipertahankan: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. Jangan menambah breakpoint baru.

### 4.1 Perilaku tata letak target

| Lebar | Perangkat khas | Navigasi kiri | Konten | Panel kanan | Navigasi bawah |
| --- | --- | --- | --- | --- | --- |
| < 768 | iPhone SE/14/15/Pro Max, Pixel, Split View sempit | Drawer (hamburger atau "Lainnya") | 1 kolom | Drawer dari kanan | **Ada** |
| 768–1023 | iPad Mini/biasa/Air/Pro 11" portrait, ponsel landscape | **Rail ikon** (`--layout-rail-width`), sentuh untuk membuka drawer berlabel | 1–2 kolom | Drawer dari kanan | Tidak ada |
| 1024–1279 | iPad landscape (1024/1112/1180), iPad Pro 12.9" portrait | **Rail ikon** | 1–2 kolom, kolom mengikuti ruang | **Inline** (3 kolom terjaga) | Tidak ada |
| ≥ 1280 | Laptop/desktop, iPad Pro 12.9" landscape (1366) | Sidebar penuh (perilaku sekarang) | Perilaku sekarang | Inline (perilaku sekarang) | Tidak ada |

Aturan tegas: **perilaku ≥ 1280px tidak boleh berubah.** Dua kolom pertama tabel di atas adalah satu-satunya wilayah kerja tata letak.

Hitungan ruang di 1024px: rail 76px + panel kanan `clamp(310px, 25vw, 360px)` = 310px → konten ±638px. Cukup untuk kartu 1–2 kolom bila grid dibuat adaptif (5.4.1).

### 4.2 Viewport uji wajib

| Nama | Ukuran | Mesin |
| --- | --- | --- |
| iPhone SE | 375×667 | WebKit |
| iPhone 14 | 390×844 | WebKit |
| iPhone 14/15 Pro Max | 430×932 | WebKit |
| Pixel 7 | 412×915 | Chromium |
| Ponsel kecil | 360×640 | Chromium |
| Ponsel landscape | 844×390 | WebKit |
| iPad Mini portrait | 744×1133 | WebKit |
| iPad 10,2" portrait | 810×1080 | WebKit |
| iPad Air/Pro 11" portrait | 834×1194 | WebKit |
| iPad Air landscape | 1180×820 | WebKit |
| iPad 10,2" landscape | 1080×810 | WebKit |
| iPad Pro 12.9" portrait / landscape | 1024×1366 / 1366×1024 | WebKit |
| Split View iPad 1/3 | 320×1024 (sempit) | Chromium |
| Laptop pembanding | 1280×720, 1440×900 | Chromium |

Gunakan nama perangkat `devices[...]` Playwright yang benar-benar ada di versi terpasang (`^1.63`); bila tidak ada, pakai `viewport` + `userAgent` manual + `hasTouch: true`, `isMobile: true`. Bila WebKit tidak bisa dipasang (`npx playwright install webkit`), jalankan semuanya di Chromium dan catat keterbatasannya di `KEPUTUSAN.md`.

---

## 5. Spesifikasi responsif

### 5.1 Fondasi CSS dan viewport (Fase 1)

1. **Tinggi layar.** Ganti semua `100vh`, `h-screen`, `min-h-screen` yang membentuk tata letak halaman ke `dvh` (`min-h-dvh`, `h-dvh`; bila versi Tailwind belum punya utilitas itu, pakai `min-h-[100dvh]`). Ganti `min-h-[calc(100vh-72px)]` di dashboard koordinator, admin, dan student dengan tinggi berbasis token: `min-h-[calc(100dvh-var(--layout-header-height-mobile))]` di ponsel dan `xl:min-h-[calc(100dvh-var(--layout-header-height))]`. Pakai `svh` untuk elemen yang tidak boleh bergeser saat bilah alamat bergerak (mis. hero login).
2. **Safe area.** Pakai token safe-area di `:root` yang sudah ada (mis. `--sar`; cocokkan nama lainnya). Wajib dipakai pada: navigasi bawah, drawer kiri dan kanan, footer tombol aksi yang lengket (sticky), tombol AI mengambang, tombol kembali ke atas, toast, footer `Dialog`/sheet, dan header (`padding-top`).
3. **Pencegahan zoom input.** Perluas aturan `font-size: 16px` dari `@media (max-width: 767px)` menjadi `@media (pointer: coarse)` agar iPad ikut. Berlaku untuk `input` (kecuali checkbox/radio/hidden), `select`, `textarea`, dan `[contenteditable]`.
4. **Sentuhan.** `touch-action: manipulation` pada `button, a, [role="button"], summary, label, input, select` (menghilangkan jeda dan zoom ganda-ketuk). `-webkit-tap-highlight-color: transparent` disertai keadaan `:active` buatan sendiri (lihat M15/M16). `-webkit-text-size-adjust: 100%` pada `html` agar teks tidak membesar sendiri saat ponsel diputar.
5. **Gulir.** `overscroll-behavior: contain` pada drawer, sheet, dan kontainer yang bisa digulir agar tidak menggulir halaman di belakangnya. Kunci gulir `body` saat drawer/dialog terbuka tanpa lompatan posisi (simpan `scrollY`, pulihkan saat tutup). `scroll-padding-top` pada `html` sebesar tinggi header + 8px agar tautan anchor tidak tertutup header lengket.
6. **Hidrasi.** Hapus ketergantungan tata letak pada `useState(true)` untuk `isDesktop`. Urutan preferensi: (a) CSS/Tailwind breakpoint; (b) bila JS memang perlu, `useSyncExternalStore` dengan `matchMedia` dan snapshot server `false`; (c) sembunyikan bagian yang bergantung JS dengan CSS sampai terpasang, bukan dengan state awal yang salah. Hasil akhirnya: tidak ada kilatan tata letak saat muat pertama di ponsel.
7. **Viewport meta.** Pertahankan `width: device-width`, `initialScale: 1`, `viewportFit: "cover"`. Tambahkan `themeColor` (terang/gelap) di `export const viewport` dengan nilai dari **satu konstanta** yang menunjuk warna latar token saat ini, bukan hex baru yang tersebar. Bila tipe `Viewport` Next versi terpasang mendukung `interactiveWidget`, set `resizes-content`; bila tidak, lewati dan catat.
8. **Hover vs sentuh.** Efek hover hanya di `@media (hover: hover)`. Tambahkan utilitas `.touch-reveal` (`@media (hover: none) { opacity: 1 !important; visibility: visible !important; }`) untuk elemen yang kini muncul hanya saat hover. Terapkan ke semua kasus T9.
9. **Teks.** Tidak ada teks di bawah 12px (kriteria yang sudah ada di repo). Cari dan perbaiki `text-[9px]`, `text-[10px]`, `text-[11px]` (mis. `text-[11px]` pada kunci pintasan di header). Judul memakai `text-wrap: balance`. Nama panjang, email, dan URL memakai `overflow-wrap: anywhere` atau `truncate` + atribut `title`. Anak flex yang berisi teks wajib `min-w-0`.
10. **Media.** Gambar: `max-w-full h-auto` plus `aspect-ratio` atau `width/height` agar tidak menggeser tata letak. Iframe/video: pembungkus `aspect-video w-full`. Tidak ada `width` tetap di px untuk media.
11. **Mode landscape pendek.** `@media (max-height: 500px) and (orientation: landscape)`: header `h-12`, hilangkan elemen header non-esensial, drawer scrollable, tidak ada elemen `position: fixed` yang memakan lebih dari 20% tinggi.

### 5.2 Shell: navigasi, header, panel kanan (Fase 2)

Berkas utama: `src/app/(portal)/portal-shell.tsx` (791 baris), `portal-nav.tsx`, `src/components/shared/sidebar.tsx`, `topbar.tsx`, `dashboard-shell.tsx`, dan tujuh `*-dashboard-client.tsx`. **Baca dulu seluruh `portal-shell.tsx` baris 80–340 (state `isCollapsed`, `isDrawerOpen`, `isRailActive`, `drawerRef`, fokus-trap) sebelum mengubah apa pun.** Ekstrak bagian baru ke komponen kecil; jangan menambah 300 baris lagi ke berkas yang sudah besar.

**5.2.1 Navigasi bawah (`MobileBottomNav`, sketsa `src/components/shared/mobile-bottom-nav.tsx`).**
- Tampil hanya di `< md`, hanya di rute portal terautentikasi, dan hanya bila `NEXT_PUBLIC_FF_MOBILE_NAV !== 'false'`.
- 4 slot + 1 slot "Lainnya" yang membuka drawer kiri. Slot dipilih per peran dari konfigurasi baru `src/lib/config/mobile-nav.ts` (sketsa) yang **mereferensikan id item yang sudah ada di `MENU_CONFIG`** (jangan membuat item atau mengubah `menu-config.ts`). Petunjuk label (cocokkan dengan id sebenarnya): Mahasiswa → Beranda, Kelas, Kalender, Nilai; Dosen → Beranda, Kelas, Presensi, Nilai; Koordinator → Beranda, Pemantauan, Persetujuan, Laporan; Staf → Beranda, Kelas, Jadwal, Pengumuman; Admin → Beranda, Pengguna, Audit, Pemantauan. Tes unit wajib: setiap id di `mobile-nav.ts` ada di `MENU_CONFIG` untuk peran tersebut.
- Tinggi `--mobile-nav-h: 3.5rem` + safe-area bawah. Ikon 24px, label ≥ 12px, area sentuh ≥ 44×44. Aktif: `aria-current="page"`, indikator garis/pil yang bergeser (M05), tanpa pantulan. Lencana notifikasi memakai komponen yang sudah ada.
- **Disembunyikan** saat: keyboard muncul (fokus di input atau `visualViewport` menyusut > 25%), drawer atau dialog terbuka, dan pada rute mode fokus (pengerjaan kuis/ujian berlangsung, ruang kelas live layar penuh). Temukan rute-rute itu di kode (`take-quiz-form.tsx`, `exam-proctor-view.tsx`, `retro-live-classroom.tsx`, dan rutenya); jangan menebak.
- `<main>`: ganti `pb-20 sm:pb-24` dengan `pb-[calc(var(--mobile-nav-h)+env(safe-area-inset-bottom,0px)+1rem)]` di `< md`; di `md+` kembalikan ke nilai lama.
- Tombol AI mengambang, kembali-ke-atas, dan toast: naikkan `bottom` sebesar `--mobile-nav-h` + safe-area + 12px di `< md`.

**5.2.2 Rail di 768–1279.** Pakai mekanisme `isRailActive` dan `--layout-rail-width` yang sudah ada. Rail selalu aktif pada rentang ini (tanpa tombol hamburger untuk membukanya); ketuk avatar/ikon menu membuka drawer berlabel penuh sebagai overlay dengan backdrop. Tooltip rail hanya di `hover: hover`; untuk sentuh, label ada di drawer dan di `aria-label`. Pertahankan fokus-trap dan Esc.

**5.2.3 Panel kanan.** Ubah titik inline dari `xl` ke `lg` untuk ketujuh dashboard (`hidden xl:flex w-right-panel` → `hidden lg:flex …`) dan untuk tombol pemicu drawer (`xl:hidden` → `lg:hidden`) di shell dan dashboard. Cari semuanya dengan `grep -rn "xl:flex w-right-panel\|xl:hidden" src`. Di bawah `lg`, panel tetap drawer dari kanan dengan `max-w-[22rem]`, `pr/pb` safe-area (sudah ada), dan kunci gulir latar. Konten utama di `lg`–`xl` memakai grid adaptif (5.4.1), bukan kolom tetap.

**5.2.4 Header.** Tinggi memakai token (`h-header-mobile` di ponsel, `sm:h-16`, `xl:h-header` seperti sekarang, atau seragamkan via token; jangan ada angka 72px mentah). Di `< sm`: logo/hamburger, judul halaman atau pencarian ringkas (ikon yang membuka Command Center), lonceng, avatar. Pintasan keyboard (`Ctrl K`) disembunyikan di sentuh. Header tetap `sticky` dengan `padding-top: env(safe-area-inset-top)`.

**5.2.5 Judul halaman dan aksi.** Pola `PageHeader` (komponen kecil): judul kiri, aksi kanan; di `< sm` aksi turun ke bawah judul, tombol utama selebar penuh, aksi sekunder di menu "⋯". Tidak ada baris aksi yang melebihi lebar layar.

### 5.3 Komponen dasar (Fase 3)

- **Dialog/sheet** (`components/ui/dialog.tsx`, dan semua modal kustom seperti `create-quiz-modal`, `class-clone-modal`, `question-import-modal`, `evaluation-form-modal`, `calendar-sync-modal`, `ai-quiz-generator-modal`, `staff-archive-semester-modal`, `exam-analytics-modal`): di `< sm` berbentuk bottom sheet `max-h-[90dvh]`, isi bisa digulir, **footer tombol lengket** dengan padding safe-area, pegangan (handle) visual di atas, tombol tutup ≥ 44px. Modal kustom yang tidak memakai `Dialog` sebaiknya dimigrasikan ke `Dialog`; bila risikonya besar, cukup beri perilaku yang sama dan catat.
- **Tabel** (`ResponsiveTable` / kelas `table-scroll`, sketsa): lihat 5.4.2.
- **Tab dan chip filter** (`class-hub-tabs.tsx`, `BERANDA_CHIPS`, dan sejenisnya): baris yang bisa digulir horizontal (`overflow-x-auto`, `snap-x`, tanpa scrollbar tampak, bayangan pudar di tepi), tab aktif otomatis digulir ke tengah saat dipilih. Tidak ada tab yang terpotong tanpa petunjuk.
- **Kartu**: padding `p-4` di ponsel, `sm:p-5`; tidak ada kartu bersarang lebih dari 2 tingkat visual (kurangi border ganda). Ini sejalan dengan keluhan lama soal kartu bertumpuk pada peran non-mahasiswa.
- **Form**: 1 kolom di `< md`; label di atas input; pesan galat di bawah input; tombol kirim lengket di bawah untuk form panjang; atribut `inputMode`, `autoComplete`, `enterKeyHint` yang sesuai; input tanggal/waktu memakai kontrol bawaan di sentuh.
- **Toast/notifikasi**: di ponsel muncul di atas navigasi bawah (atau di atas, di bawah header) dengan lebar `calc(100vw - 2rem)`; bisa ditutup dengan sentuhan.
- **Dropdown/popover** (Radix): di `< sm` dengan konten panjang, batasi `max-h` dengan `--radix-*-content-available-height` dan beri gulir internal.
- **Skeleton** (`ui/skeleton.tsx`): bentuk mengikuti konten, tinggi tetap agar tidak menggeser tata letak.

### 5.4 Pola per jenis konten

**5.4.1 Grid adaptif.** Untuk kumpulan kartu, pakai `grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr))` (utilitas arbitrer Tailwind atau kelas `.grid-adaptif`) alih-alih `grid-cols-3` bertingkat. Tanpa plugin container-queries. Perbaiki juga grid seperti `grid grid-cols-3` tanpa awalan breakpoint (mis. kartu identitas di `components/retro/*-identity-card.tsx`, `command-center-os.tsx`) bila isinya sempit di 360px.

**5.4.2 Tabel.** Dua strategi, dipilih dengan aturan:
- *Data padat dan dibandingkan antarbaris* (rekap nilai, matriks presensi, analisis butir soal, semester-weave, tabel master): pembungkus `overflow-x-auto` + `overscroll-behavior-x: contain`, kolom pertama `sticky left-0` dengan latar token, `min-w` per tabel yang masuk akal, bayangan pudar di tepi bila ada isi tersembunyi, dan petunjuk "geser ke samping" (satu kali, hilang setelah digulir).
- *Daftar sederhana* (daftar pengajuan, perangkat, pengguna, tugas): di `< md` berubah menjadi daftar kartu bertumpuk memakai `data-label`; kolom aksi menjadi menu "⋯".
- Tidak ada tabel di luar salah satu dari keduanya. Gerbang `cek:responsif` mengecek ini (bagian 8).

**5.4.3 Grafik (recharts).** Selalu di dalam `ResponsiveContainer` dengan induk bertinggi pasti. Di `< sm`: kurangi jumlah tick (`interval="preserveStartEnd"`), singkatkan label, legenda di bawah, tooltip aktif dengan ketukan. Tinggi grafik 200–240px di ponsel.

**5.4.4 Markdown dan materi** (`markdown-viewer.tsx`, `retro-doc-viewer.tsx`, tampilan materi): `pre` dan tabel di dalam markdown punya kontainer `overflow-x-auto`; gambar `max-w-full`; panjang baris `max-w-prose` (≈ 65–75 karakter) di iPad landscape; tautan panjang `overflow-wrap: anywhere`; pemutar PDF/dokumen/video responsif dengan kontrol sentuh.

**5.4.5 Kalender** (`calendar-view-switcher.tsx`): di `< md` tampilan bawaan adalah agenda/daftar; tampilan bulan memakai sel ≥ 44px; mingguan bisa digulir horizontal dengan kolom hari lengket.

**5.4.6 Heatmap kontribusi** (`components/aktivitas/heatmap-kontribusi.tsx`): kontainer bisa digulir horizontal, otomatis tergulir ke minggu terbaru saat dipasang, legenda di bawah.

**5.4.7 Peta Pulau / Kain Semester / widget dekoratif** (`class-island-map.tsx`, `semester-weave*.tsx`, `sky-shader-canvas.tsx`, `canvas-wireframe-cube.tsx`, `uir-logo-3d.tsx`): di `< md` sederhanakan (ilustrasi statis atau ukuran kecil), hentikan render saat di luar layar (`IntersectionObserver`) dan saat tab tersembunyi (`document.visibilityState`), batasi `devicePixelRatio` ke 1,5, dan matikan sepenuhnya di mode `hemat`/`mati`. Fungsi tetap ada; hanya dekorasi yang dikurangi. `semester-weave.tsx` memakai tabel `min-w-[560px]`: pastikan terbungkus gulir (5.4.2).

**5.4.8 Halaman landing, login, register.** `login/page.tsx` punya dua blob blur `h-[520px] w-[520px]` dengan `animate-pulse`: di `< md` kecilkan (`max-w-[60vw]`), hentikan animasinya, dan turunkan blur. Pastikan `min-h-svh`, ilustrasi pulau tidak mendorong form keluar layar, dan tombol utama terlihat tanpa menggulir di 360×640 bila memungkinkan.

### 5.5 Aturan sentuh

- Target sentuh utama ≥ 44×44 CSS px (ikon kecil diberi area sentuh lewat padding atau pseudo-elemen); jarak antartarget ≥ 8px. Tautan di dalam paragraf dikecualikan.
- Tidak ada interaksi yang hanya ada di hover (tooltip esensial, tombol aksi baris, menu). Selalu ada padanan sentuh.
- Tidak ada gestur tersembunyi sebagai satu-satunya cara (geser untuk hapus, dsb.). Gestur hanya pelengkap.
- **Jangan** membuat geser dari tepi kiri layar untuk membuka drawer (bentrok dengan gestur "kembali" Safari iOS). Geser **untuk menutup** drawer boleh.
- Tombol berbahaya (hapus, finalisasi nilai, kumpulkan ujian) tidak boleh berdekatan dengan tombol biasa di ponsel; pisahkan jaraknya atau beri konfirmasi yang sudah ada.

### 5.6 Spesifikasi per area fitur dan definisi selesai per halaman

**Definisi selesai per halaman (10 butir, berlaku untuk SETIAP rute di inventaris):**
1. Tidak ada scroll horizontal pada `document` di semua viewport 4.2.
2. Tidak ada elemen yang lebarnya melebihi viewport di luar kontainer gulir yang disengaja.
3. Tidak ada teks < 12px; tidak ada teks terpotong tanpa `title` atau cara membacanya.
4. Semua kontrol utama ≥ 44×44 di viewport sentuh.
5. Tidak ada fungsi yang hanya ada di hover.
6. Elemen terakhir di halaman tidak tertutup navigasi bawah, tombol AI, atau home indicator.
7. Semua tabel memenuhi 5.4.2; semua grafik memenuhi 5.4.3.
8. Form memakai 1 kolom di ponsel, `inputMode`/`autoComplete` benar, tidak memicu zoom iOS.
9. Orientasi diputar tidak menghilangkan state (form, kuis, scroll) dan tidak merusak tata letak.
10. Tampil benar di setiap tema yang ada di `globals.css` (periksa blok tema alternatif sekitar baris 255–270) dan di mode `hemat`/`mati` gerak.

**Per area (pastikan semua tersentuh; daftar ini panduan, inventaris rute yang menjadi sumber kebenaran):**

| Area | Berkas pemandu (sketsa, cocokkan) | Penerimaan khusus |
| --- | --- | --- |
| Beranda tujuh peran | `*-dashboard-client.tsx`, `components/home/*`, `right-panel-switcher.tsx` | Urutan kartu di ponsel: tindakan mendesak → jadwal hari ini → kelas aktif → tenggat → ringkasan. Panel kanan jadi drawer dengan tab "Hari ini" dan "Detail kelas" tetap berfungsi. |
| Hub kelas | `class-hub-tabs.tsx` (1.880 baris), `class-*-tab*.tsx` | Tab bergulir; tiap tab bisa dipakai di 390px; tidak ada tabel tanpa pembungkus. Pertimbangkan memecah berkas bila perubahan besar, tanpa mengubah perilaku. |
| Materi dan dokumen | `markdown-viewer`, `retro-doc-viewer`, `material-progress` | 5.4.4; progres baca tidak terpicu salah saat gulir bilah alamat. |
| Tugas dan pengumpulan | `assignment-forms.tsx`, `assignment-playback-panel.tsx` | Unggah berkas lewat `file-dropzone` bisa dipakai di sentuh (tombol pilih berkas jelas); tombol kumpul lengket. |
| Kuis, CBT, ujian | `cbt/take-quiz-form.tsx` (893 baris), `exam-proctor-view.tsx`, `exam-live-monitor-panel.tsx`, `use-exam-autosave.ts` | **Hanya tata letak.** Pewaktu lengket di atas; navigasi soal berupa baris yang bisa digulir atau bottom sheet; tombol Sebelumnya/Berikutnya lengket di bawah (tanpa navigasi bawah global); jawaban tidak hilang saat rotasi atau keyboard muncul; tidak ada pintasan yang membuat peserta keluar tak sengaja. |
| Presensi | `attendance-*`, `attendance-hub-view` | Tombol kode verifikasi dan GPS besar dan jelas; matriks presensi memakai strategi gulir. |
| Nilai dan gradebook | `grades-hub-view`, `staff-grades-hub-view`, `lecturer-rubrics-view` | Kolom nama lengket; ekspor tetap terjangkau. |
| Forum, pesan, komunitas | `class-forum-tab-view`, `forum-thread-client-view`, `messages-hub-view`, `community-hub-view` | Pesan: daftar → percakapan sebagai dua layar di ponsel (tombol kembali), aksi baris terlihat tanpa hover. |
| Kalender, jadwal | `calendar-view-switcher`, `staff-schedules-hub-view` | 5.4.5. |
| Pustaka, flashcard, portofolio, pencapaian, sertifikat | `library-hub-view`, `flashcard-client`, `achievements-view`, `certificates-hub-view` | Kartu flashcard bisa dibalik dengan ketukan; sertifikat ditampilkan pas layar dan bisa diunduh. |
| Koordinator, staf, admin | `coordinator-*`, `staff-*`, `modules/admin/*` | Tabel padat memakai gulir + kolom lengket; filter dilipat dalam sheet "Filter" di ponsel. |
| Notifikasi, profil, pengaturan, perangkat | `notifications-view`, `profile`, `settings`, `devices` | Pengaturan: bagian akordeon; **tambahkan kontrol "Animasi: Penuh / Hemat / Mati"** di pengaturan (Fase 5). |
| Auth dan landing | `(auth)/*`, `app/page.tsx` | 5.4.8. |
| Sisa SIAKAD | `(dashboard)/*` | Masuk inventaris; perbaiki seperlunya (minimal tidak overflow), tanpa investasi besar karena di luar cakupan MVP SIAJAR. |

---

## 6. Spesifikasi animasi

### 6.1 Prinsip

1. **Bertujuan.** Setiap animasi menjawab salah satu: "dari mana ini datang", "apa yang berubah", "apakah aksiku berhasil". Bila tidak menjawab satu pun, jangan dibuat.
2. **Cepat dan tenang.** Interaksi 100–200ms, transisi panel 240–300ms, tidak ada yang melebihi 400ms kecuali count-up/grafik (≤ 700ms), sekali saja per kemunculan.
3. **Hanya `transform` dan `opacity`** (kecuali M07). Tidak ada animasi yang memicu reflow.
4. **Tutup lebih cepat dari buka.** Keluar ≈ 70% durasi masuk.
5. **Tidak pernah menahan pengguna.** Konten bisa dibaca dan diklik sejak awal; animasi hanya menghias kedatangannya.
6. **Aman tanpa JS dan saat gagal.** Keadaan awal "tersembunyi" hanya berlaku setelah JS memasang kelas `motion-ready` di `<html>`, dengan pengaman waktu (T5: bagian ini sengaja memperbaiki kegagalan "layar kosong").
7. **Satu bahasa gerak.** Semua memakai token dan easing yang sama.

### 6.2 Token gerak (di `:root` pada `globals.css`)

```css
:root {
  --dur-instant: 80ms;   /* umpan balik sentuh */
  --dur-fast: 140ms;     /* hover, fokus, popover */
  --dur-base: 220ms;     /* tab, akordeon, masuk kecil */
  --dur-slow: 300ms;     /* drawer, sheet, halaman */
  --dur-data: 600ms;     /* grafik, progres, count-up */
  --ease-out: var(--ease);                        /* yang sudah ada */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);          /* keluar */
  --ease-inout: cubic-bezier(0.65, 0, 0.35, 1);   /* geser indikator */
  --stagger: 40ms;
  --stagger-max: 6;                               /* anak ke-7 dst tanpa jeda tambahan */
}
html[data-motion="hemat"],
html.lite-performance-mode { --dur-base: 120ms; --dur-slow: 160ms; --dur-data: 0.01ms; --stagger: 0ms; }
html[data-motion="mati"] {
  --dur-instant: 0.01ms; --dur-fast: 0.01ms; --dur-base: 0.01ms;
  --dur-slow: 0.01ms; --dur-data: 0.01ms; --stagger: 0ms;
}
```
(Kelas `lite-performance-mode` yang sudah ada dipetakan ke perilaku `hemat`. Contoh di atas adalah sketsa: sesuaikan dengan struktur `:root` di `globals.css` dan pastikan `prefers-reduced-motion` memakai nilai `hemat`.) Daftarkan token ke `tailwind.config.ts` (`transitionDuration`, `transitionTimingFunction`, `keyframes`, `animation`) sebagai satu-satunya sumber.

### 6.3 Sakelar dan penghormatan preferensi

- **Hook** (sketsa `src/hooks/`): `useMotionPreference()` → `'penuh' | 'hemat' | 'mati'` (gabungan atribut `data-motion`, `prefers-reduced-motion`, `lite-performance-mode`, dan `navigator.connection?.saveData`); `useInView(ref, { once, rootMargin })`; `useCountUp(nilai, { durasi })`; `useMediaQuery(query)` berbasis `useSyncExternalStore` dengan snapshot server aman.
- Pengaturan pengguna: kontrol "Animasi" di halaman pengaturan, tersimpan di `localStorage` (`siajar_motion`, dibungkus try/catch). `LiteModeToggle` yang ada tetap bekerja dan dihubungkan ke `hemat`.
- **Matriks perilaku:**

| Fitur | penuh | hemat | mati |
| --- | --- | --- | --- |
| Transisi halaman, drawer, sheet | ya | hanya pudar ≤ 160ms | tidak |
| Reveal saat gulir, stagger | ya | tidak (langsung tampil) | tidak |
| Count-up, grafik, heatmap, progres | ya | tidak (nilai akhir langsung) | tidak |
| Shimmer skeleton | ya | statis | statis |
| Umpan balik tekan/hover | ya | ya (≤ 80ms) | tidak |
| Canvas/shader dekoratif | ya (hormati 5.4.7) | berhenti | berhenti |

### 6.4 Perbaikan utilitas yang hilang (Fase 5, langkah pertama dan paling berharga)

1. Definisikan di `tailwind.config.ts` (`theme.extend.keyframes` dan `animation`): `fade-in`, `scale-in`, `scale-up`, `slide-in-right`, `slide-in-left`, `slide-up`, `bounce-short`, `shimmer`, `check-draw`. Durasi dan easing dari token 6.2. `animate-fade-up` yang sudah ada di `globals.css` dipertahankan dan dipetakan ke token.
2. Tes unit `tests/motion-utilities.test.ts` (sketsa): membaca konfigurasi dan memastikan setiap kelas `animate-*` yang dipakai di `src/**/*.tsx` **terdefinisi** (di config, di `globals.css`, atau milik `tailwindcss-animate`). Tes gagal bila ada yang tidak terdefinisi. Ini mencegah T4 terulang.
3. Perbaiki T5: keadaan awal tersembunyi hanya di bawah `html.motion-ready:not([data-motion="mati"]) .reveal-on-scroll:not(.is-visible)`. `ScrollReveal` (`scroll-animation-provider.tsx`) memasang `motion-ready` setelah hidrasi; elemen yang sudah ada di viewport diberi `is-visible` secara sinkron sebelum paint (`useLayoutEffect`) agar tidak berkedip; pengaman: semua elemen yang belum terlihat dipaksa terlihat setelah 1.500ms; sekali tampil, tidak disembunyikan lagi.

### 6.5 Katalog animasi (lengkap: tiap item punya kotak centang di `PROGRESS_RESPONSIF.md`)

| ID | Nama | Di mana | Perilaku | Durasi / easing |
| --- | --- | --- | --- | --- |
| M01 | Masuk halaman | `src/app/(portal)/template.tsx` (sketsa; template me-remount tiap navigasi) | `<main>` pudar + naik 8px. Tanpa animasi keluar. Cek dulu apakah `.portal-enter` yang sudah ada dipakai; pakai satu mekanisme saja. | `--dur-base`, `--ease-out` |
| M02 | Drawer kiri | `portal-shell.tsx` | Geser `translateX(-100%)→0`; backdrop pudar. Geser-untuk-menutup di drawer (ambang 60px atau kecepatan tinggi). Bukan geser-dari-tepi. | masuk `--dur-slow`; keluar `--dur-base`, `--ease-in` |
| M03 | Panel kanan | `*-dashboard-client.tsx` | `slide-in-right` (utilitas yang diperbaiki di 6.4) | `--dur-slow` |
| M04 | Bottom sheet dialog | `ui/dialog.tsx` | `< sm`: naik dari bawah (`slide-in-from-bottom`); `sm+`: pudar + zoom 0,95→1. Backdrop pudar. | `--dur-slow` / `--dur-fast` |
| M05 | Indikator navigasi bawah | `MobileBottomNav` | Garis/pil aktif bergeser antarslot; label aktif menebal. Tanpa pantulan. | `--dur-base`, `--ease-inout` |
| M06 | Garis tab aktif | `class-hub-tabs.tsx`, chip filter | Indikator `translateX` + `scaleX` mengikuti tab terpilih (ukur dengan ref). | `--dur-base`, `--ease-inout` |
| M07 | Akordeon/lipat | grup sidebar, `<details>`, filter | `grid-template-rows: 0fr→1fr` + pudar. Satu-satunya animasi tata letak yang diizinkan. | `--dur-base` |
| M08 | Dropdown/popover/tooltip | Radix | Pudar + skala 0,96→1 dari titik asal (`--radix-*-content-transform-origin`). | `--dur-fast` |
| M09 | Reveal saat gulir | `ScrollReveal`, grid kartu | Pudar + naik 12px, sekali; stagger `--stagger` maksimal `--stagger-max` anak. Hanya untuk yang di bawah lipatan layar. | `--dur-base` |
| M10 | Count-up angka | IPK/IPS, persen kehadiran, jumlah tugas, statistik dasbor | Naik dari 0 ke nilai, `tabular-nums`, sekali per kemunculan, nilai akhir selalu tertulis untuk pembaca layar (`aria-label`). | `--dur-data`, ease-out kubik |
| M11 | Progres | bar progres, cincin progres kelulusan/kelas | Bar: `scaleX` dari kiri (bukan `width`). Cincin: `stroke-dashoffset`. | `--dur-data` |
| M12 | Grafik masuk | recharts (`ips-trend-chart`, radar CPMK/CPL, analitik) | `isAnimationActive` hanya di `penuh` dan hanya saat pertama terlihat. | `--dur-data` |
| M13 | Heatmap | `heatmap-kontribusi.tsx` | Sel pudar bertahap (≈ 8ms per sel, total ≤ 600ms). | — |
| M14 | Skeleton → konten | `ui/skeleton.tsx`, `loading.tsx` rute berat | Shimmer `translateX` selama memuat; saat data tiba, pudar silang 160ms. Tambahkan `loading.tsx` untuk rute berat yang belum punya (kelas, nilai, kalender, analitik) tanpa mengubah pengambilan data. | shimmer 1,4s linear (hanya saat memuat) |
| M15 | Umpan balik tekan | tombol, kartu yang bisa diklik | `:active` skala 0,98 (tombol) atau latar token (baris). Hover-lift 2px + bayangan token hanya di `@media (hover: hover)`. | `--dur-instant` / `--dur-fast` |
| M16 | Sorotan ketukan baris | daftar, item menu | Latar token masuk cepat, pudar pelan. Pengganti `-webkit-tap-highlight-color`. | 80ms / 200ms |
| M17 | Aksi berhasil/gagal | kumpul tugas, presensi, simpan, form galat, toast | Centang tergambar (`check-draw`) 360ms; form galat memakai keyframe `shake` yang sudah ada (cek keberadaannya) 280ms; toast masuk/keluar. | lihat kolom perilaku |
| M18 | Pewaktu hampir habis | pewaktu kuis/ujian | **Tanpa gerakan berulang.** Perubahan warna token + satu penekanan 400ms pada ambang 5:00 dan 1:00. Peserta ujian tidak boleh terganggu. | 400ms sekali |
| M19 | Header saat digulir | header portal (state `isScrolled` sudah ada) | Border/bayangan tipis muncul halus. | `--dur-fast` |
| M20 | Hero login/landing | `login/page.tsx`, `app/page.tsx` | Pertahankan `.seq` dan `.mask-line`. Hentikan `animate-pulse` blob di `< md`/`hemat`. | yang ada |
| M21 | Lencana naik | lonceng notifikasi, hitungan | Skala 1→1,15→1 hanya saat angka **berubah**, bukan saat muat. | 220ms |
| M22 | Gambar/media dimuat | gambar materi, avatar | Pudar 200ms saat `onLoad`, dengan `aspect-ratio` agar tidak menggeser tata letak. | `--dur-base` |

Setiap animasi baru wajib: (a) memakai token, (b) punya perilaku `hemat`/`mati` sesuai 6.3, (c) tidak menimbulkan CLS, (d) tidak menghalangi klik.

### 6.6 Yang dilarang (ulang dari bagian 1, khusus gerak)

Parallax, tilt 3D di komponen biasa (animasi `uir-perspective` yang sudah ada dibiarkan di tempatnya, tidak diperluas), efek kursor, confetti, teks gradien berkilau, ikon memantul/berayun, animasi sambutan yang menunda konten, animasi berulang pada area konten, dan transisi `all` pada elemen besar.

### 6.7 Anggaran performa

- Tidak ada penambahan JS first-load lebih dari **+8 KB gzip** per rute di keluaran `next build` dibanding baseline Fase 0 (catat tabel sebelum/sesudah).
- CLS ≤ 0,05 di semua rute contoh (diukur di e2e, 8.4).
- Animasi berjalan pada compositor (transform/opacity). `will-change` hanya dipasang sesaat sebelum animasi dan dilepas sesudahnya.
- Tidak lebih dari ±6 elemen beranimasi serentak di viewport.
- `backdrop-filter: blur` (mis. header `backdrop-blur-md`) diganti latar solid token di `hemat`/`mati` dan di perangkat `pointer: coarse` berperforma rendah bila terukur bermasalah.
- Canvas/shader: berhenti di luar layar dan saat tab tidak aktif (5.4.7).

---

## 7. Fase kerja

Setiap fase diakhiri: `npm run typecheck && npm run lint && npm test && npm run build && npm run cek:hex && npm run cek:responsif`, matriks Playwright perangkat, pembaruan `PROGRESS_RESPONSIF.md`, dan tag `resp-fase-N`.

### Fase 0 — Pengaman dan baseline
1. `git status` bersih; `git switch -c responsif/mobile-ipad-animasi`. Jangan menggabungkan cabang lain.
2. Baca: dokumen ini, `docs/INSTRUKSI_ANTIGRAVITY.md` bagian 4, `docs/menu-inventory.md`, `src/lib/config/menu-config.ts` (baca saja), `portal-shell.tsx` baris 80–340, `tests/e2e/responsive.spec.ts`, `tests/e2e/auth-flow.spec.ts`.
3. Jalankan baseline penuh (`typecheck`, `lint`, `test`, `build`, `cek:hex`). Bila `prisma generate` gagal karena jaringan, jalankan dari lingkungan yang bisa mengunduh binary Prisma. Catat hasil dan ukuran bundle per rute.
4. Buat `scripts/list-routes.mjs` dan `docs/routes-inventory.json` (bagian 3).
5. Verifikasi ulang T1–T12 dengan perintah pencarian; tulis tabel "temuan awal vs hasil" di `docs/RESPONSIF_AUDIT.md`, ditambah: jumlah `text-[9|10|11px]`, `group-hover:` tanpa `touch-reveal`, `<table` tanpa pembungkus, `w-[≥360px]` tanpa `max-w-full`, `grid-cols-≥3` tanpa breakpoint.
6. Tambahkan proyek perangkat ke `playwright.config.ts` (4.2) tanpa mengubah proyek `chromium` yang ada. Buat helper login per peran (pakai pola `auth-flow.spec.ts` dan `src/modules/identity/demo-users.ts`; **jangan menambah pintu belakang** dan jangan melemahkan `ALLOW_DEMO_AUTH`).
7. Ambil **baseline tangkapan layar**: tiap rute di inventaris × (390×844, 820×1180, 1180×820, 1440×900) untuk peran yang berhak. Simpan di `test-results/baseline-responsif/` (tidak di-commit); hanya ≤ 12 layar kunci yang di-commit ke `docs/responsive-verification/`.
8. Tag `resp-fase-0`.

### Fase 1 — Fondasi CSS dan viewport
Kerjakan 5.1.1–5.1.11. Tambahkan utilitas `.touch-reveal`, `.table-scroll`, `.grid-adaptif`, token `--mobile-nav-h`. Tambah `scripts/cek-responsif.mjs` dengan aturan awal dan daftarkan di `package.json` serta rantai `cek`. Selesai bila: tidak ada `100vh`/`h-screen` tanpa pengganti (kecuali allow-list beralasan), input tidak memicu zoom di iPhone, desktop ≥ 1280 identik dengan baseline.

### Fase 2 — Shell
Kerjakan 5.2.1–5.2.5. Urutan aman: (a) hapus `isDesktop` awal-`true` dan pindah ke CSS; (b) rail 768–1279; (c) panel kanan inline mulai `lg`; (d) `MobileBottomNav` di balik sakelar; (e) offset tombol AI/toast/kembali-ke-atas; (f) header. Fokus-trap, Esc, dan `aria-*` yang sudah ada tidak boleh hilang. Selesai bila: 3 kolom terlihat di 1024–1279; tidak ada kilatan tata letak di ponsel; bottom nav tersembunyi di rute mode fokus; `NEXT_PUBLIC_FF_MOBILE_NAV=false` mengembalikan perilaku lama.

### Fase 3 — Komponen dasar
Kerjakan 5.3. Buat `ResponsiveTable`/`.table-scroll`, `PageHeader`, pembungkus tab bergulir, perilaku sheet seragam untuk semua modal kustom. Tes unit untuk komponen baru. Selesai bila: semua modal punya footer lengket dan tinggi aman di 375×667.

### Fase 4 — Halaman per peran dan fitur
Kerjakan 5.4 dan 5.6 untuk **setiap rute di inventaris**, per kelompok: (1) beranda 7 peran; (2) hub kelas dan materi; (3) tugas, kuis, CBT, ujian; (4) presensi dan nilai; (5) forum, pesan, komunitas, kalender; (6) pustaka, flashcard, pencapaian, sertifikat, portofolio; (7) koordinator, staf, admin, master data; (8) notifikasi, profil, pengaturan, perangkat; (9) auth dan landing; (10) sisa `(dashboard)`. Satu kelompok = satu rangkaian commit `fix(responsif)`. Centang tiap rute di `PROGRESS_RESPONSIF.md` hanya setelah tes e2e rute itu lolos di semua kelompok viewport. Selesai bila: uji cakupan (bagian 3.3) hijau.

### Fase 5 — Fondasi sistem animasi
Kerjakan 6.2, 6.3, 6.4. Urutan: (a) token; (b) utilitas yang hilang + tes anti-tak-terdefinisi; (c) sakelar `data-motion` dan hook; (d) kontrol "Animasi" di pengaturan dan `NEXT_PUBLIC_FF_MOTION` di `.env.example`; (e) perbaikan `ScrollReveal`; (f) tulis `docs/MOTION.md` (panduan singkat untuk pengembang berikutnya: token, hook, aturan, daftar M01–M22). Selesai bila: drawer/backdrop yang selama ini tak beranimasi kini beranimasi, dan `mati` memadamkan semuanya.

### Fase 6 — Animasi shell dan navigasi
M01, M02, M03, M04, M05, M06, M07, M08, M19. Selesai bila: berpindah halaman, membuka/menutup drawer dan sheet terasa halus di iPhone dan iPad (manual, bagian 10) dan tidak ada CLS.

### Fase 7 — Animasi konten dan mikro-interaksi
M09, M10, M11, M12, M13, M14, M15, M16, M17, M18, M20, M21, M22. Tiap item diterapkan ke **semua** tempat yang relevan (mis. M10 ke semua angka statistik; cari dengan pencarian, jangan hanya ke satu dashboard). Selesai bila: semua kotak M01–M22 tercentang dengan bukti.

### Fase 8 — Performa dan aksesibilitas gerak
1. Audit semua `animation: … infinite` dan `animate-pulse/ping/bounce`: yang berada di area konten dihapus atau dibatasi hanya saat memuat.
2. Terapkan 5.4.7 (hentikan canvas di luar layar, batas DPR).
3. Ukur bundle dan CLS (6.7). Perbaiki yang melampaui anggaran.
4. Tes e2e dengan `page.emulateMedia({ reducedMotion: 'reduce' })` dan dengan `data-motion="mati"`: durasi animasi terhitung ≈ 0 dan semua konten tetap tampil.
5. Uji ulang di CPU ber-throttle (CDP `Emulation.setCPUThrottlingRate` 4×) untuk satu rute berat per peran; pastikan tidak ada jank yang jelas.

### Fase 9 — Verifikasi dan serah terima
Jalankan seluruh matriks, `npm run cek`, `npm run build`. Tulis `docs/LAPORAN_RESPONSIF.md` (bagian 12), perbarui `README.md` (bagian "Menjalankan" dan "Pengujian": tambahkan `cek:responsif`, `NEXT_PUBLIC_FF_MOBILE_NAV`, `NEXT_PUBLIC_FF_MOTION`), dan tag `resp-fase-9`. **Jangan merge ke `main`**; serahkan ke pemilik.

---

## 8. Pemeriksaan otomatis yang harus ada

**8.1 `npm run cek:responsif`** (`scripts/cek-responsif.mjs`, gagal bila ada pelanggaran di luar allow-list):
- `100vh`, `h-screen`, `min-h-screen` tanpa pasangan `dvh`/`svh`.
- `<table`/`<Table` tanpa pembungkus `table-scroll`, `ResponsiveTable`, atau `overflow-x-auto`.
- `w-[Npx]`/`min-w-[Npx]` dengan N ≥ 360 tanpa `max-w-full` atau `max-w-[…vw]` pada elemen yang sama.
- `maximum-scale`, `user-scalable`.
- `text-[9px]`, `text-[10px]`, `text-[11px]`.
- `group-hover:opacity-0|…:opacity-100`/`invisible` tanpa `touch-reveal`.
- `@keyframes` yang menganimasikan `width|height|top|left|right|bottom|margin|padding` (kecuali allow-list: M07).
- Kelas `animate-*` yang tidak terdefinisi.
- `animation-iteration-count: infinite`/`animate-pulse|ping|bounce` di luar komponen skeleton/indikator memuat.
- Hex baru di berkas yang diubah (sudah ditangani `cek:hex`).

**8.2 Tes unit (Vitest):** id `mobile-nav.ts` ada di `MENU_CONFIG`; utilitas animasi terdefinisi; hook gerak (`useMotionPreference`, `useCountUp` menghormati `mati`); `ScrollReveal` tidak menyembunyikan konten tanpa `motion-ready`.

**8.3 E2E responsif (Playwright), per rute di inventaris × viewport 4.2:**
1. `document.documentElement.scrollWidth <= window.innerWidth` dan `body.scrollWidth <= window.innerWidth`.
2. Pencari pelanggar: kumpulkan elemen dengan `getBoundingClientRect().right > innerWidth + 1` di luar kontainer `overflow-x` yang sah; cetak selektornya saat gagal.
3. Teks terhitung `font-size ≥ 12px`; input di `pointer: coarse` `≥ 16px`.
4. Kontrol utama (`button`, `[role=button]`, tautan nav, `input`, `select`) ≥ 44×44 di viewport sentuh (laporkan daftar; gagal untuk kontrol utama).
5. Gulir ke dasar halaman: `elementFromPoint` di tengah elemen interaktif terakhir bukan navigasi bawah/tombol AI.
6. Navigasi bawah: terlihat di < 768, tersembunyi di ≥ 768, tersembunyi di rute mode fokus.
7. Matriks tata letak 4.1: di 1024–1279 panel kanan terlihat inline; di 768–1023 rail terlihat dan panel kanan berupa drawer; di ≥ 1280 identik baseline.
8. Rotasi (portrait ↔ landscape) pada form kuis tidak menghilangkan jawaban.
9. Tangkapan layar ke `test-results/`.

**8.4 E2E gerak:** `reducedMotion: 'reduce'` dan `data-motion="mati"` → durasi animasi terhitung ≤ 1ms dan konten tetap terlihat; CLS via `PerformanceObserver` ≤ 0,05 di rute contoh; tidak ada konten dengan `opacity: 0` yang menetap > 2 detik setelah muat.

**8.5 Regresi desktop:** bandingkan tangkapan layar ≥ 1280px terhadap baseline Fase 0 (ambang 0,1%); selisih lebih besar harus dijelaskan di `KEPUTUSAN.md` atau diperbaiki.

---

## 9. Daftar "Selesai bila" akhir

- [ ] Semua rute di `docs/routes-inventory.json` lolos 10 butir definisi selesai (5.6) di semua kelompok viewport, atau tercatat sah di `RESPONSIF_PENGECUALIAN.md`.
- [ ] Tiga kolom terlihat di 1024–1279px; ≥ 1280px identik baseline.
- [ ] Navigasi bawah berfungsi di ponsel, tersembunyi di mode fokus dan saat keyboard muncul; sakelar `FF_MOBILE_NAV` terbukti mengembalikan perilaku lama.
- [ ] Tidak ada scroll horizontal tingkat halaman, tidak ada zoom paksa iOS, tidak ada fungsi hover-only.
- [ ] Semua kelas `animate-*` yang dipakai terdefinisi (tes hijau); drawer, backdrop, dan panel kanan beranimasi.
- [ ] M01–M22 selesai dan terbukti; `ScrollReveal` benar-benar berefek dan tidak pernah meninggalkan layar kosong.
- [ ] `penuh`/`hemat`/`mati` bekerja; `prefers-reduced-motion` dihormati; kontrol "Animasi" ada di pengaturan.
- [ ] Anggaran performa 6.7 terpenuhi (tabel sebelum/sesudah ada di laporan).
- [ ] `npm run cek`, `npm run cek:responsif`, `npm run build`, dan Playwright hijau; `cek:hex` tidak menambah hex.
- [ ] Tidak ada perubahan pada logika, DB, RLS, rute, `menu-config.ts`, atau palet warna.
- [ ] `docs/MOTION.md`, `PROGRESS_RESPONSIF.md`, `RESPONSIF_AUDIT.md`, `LAPORAN_RESPONSIF.md` ada dan terisi.

---

## 10. Verifikasi manual di perangkat nyata (oleh pemilik)

Playwright bukan Safari asli. Sebelum merge, coba ini di perangkat sungguhan:

1. **iPhone Safari:** bilah alamat menyusut saat gulir (tidak ada lompatan tinggi); keyboard muncul di form (navigasi bawah hilang, tombol kirim tetap terjangkau); putar layar; gestur "kembali" dari tepi tidak bentrok; fokus input tidak men-zoom.
2. **iPad Safari:** portrait dan landscape; **Split View 1/3 dan 2/3**; Stage Manager bila tersedia; rail dan drawer; panel kanan inline di landscape; pencarian/Command Center dengan keyboard eksternal.
3. **Android Chrome:** hal yang sama, plus tombol kembali sistem menutup drawer/sheet dulu sebelum meninggalkan halaman.
4. **Zoom teks 200%** (pengaturan aksesibilitas): tidak ada tumpang tindih.
5. **Mode hemat daya / "Kurangi gerakan"** aktif: semua tetap terbaca dan berfungsi tanpa animasi.
6. **Kuis/ujian:** kerjakan satu kuis penuh di ponsel termasuk memutar layar di tengah jalan dan mengunci layar sebentar.

---

## 11. Panduan rollback untuk pemilik

```bash
# Melihat titik aman per fase
git tag --list "resp-fase-*"

# Belum digabung ke main: cukup tinggalkan branch.
git switch main

# Membatalkan satu fase (mis. kembali ke akhir Fase 4) pada branch kerja:
git switch responsif/mobile-ipad-animasi
git reset --hard resp-fase-4

# Sudah digabung ke main dengan merge commit:
git revert -m 1 <hash-merge-commit>

# Membatalkan satu commit saja:
git revert <hash-commit>
```

Rollback tanpa mengubah kode:
- Matikan semua animasi baru: set `NEXT_PUBLIC_FF_MOTION=false`, redeploy.
- Matikan navigasi bawah: set `NEXT_PUBLIC_FF_MOBILE_NAV=false`, redeploy.
- Di Vercel: *Deployments → deployment sebelumnya → Promote to Production*.

Tidak ada migrasi database atau perubahan data, jadi rollback aman kapan pun.

---

## 12. Laporan akhir

`docs/LAPORAN_RESPONSIF.md` memuat: ringkasan per fase; tabel temuan awal vs akhir (T1–T12); jumlah rute diuji × viewport; daftar pengecualian dan alasannya; tabel ukuran bundle sebelum/sesudah; hasil CLS; daftar keputusan `[Responsif]` dari `KEPUTUSAN.md`; daftar hal yang sengaja **tidak** dikerjakan (mis. PWA/manifest, mode offline, gestur geser dari tepi); risiko konflik dengan redesain tema; dan langkah verifikasi manual (bagian 10) yang perlu dilakukan pemilik.
