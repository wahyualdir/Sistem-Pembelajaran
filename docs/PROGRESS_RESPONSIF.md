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
- [ ] **Fase 2 — Shell: Navigasi Bawah, Rail, Panel Kanan, Header**
- [ ] **Fase 3 — Komponen Dasar: Dialog/Sheet, Tabel Scroll, Tab, Form**
- [ ] **Fase 4 — Halaman per Peran dan Fitur (10 Kelompok Fitur)**
- [ ] **Fase 5 — Fondasi Sistem Animasi (Token, Hook, Utilitas, Sakelar)**
- [ ] **Fase 6 — Animasi Shell dan Navigasi (M01–M08, M19)**
- [ ] **Fase 7 — Animasi Konten dan Mikro-interaksi (M09–M18, M20–M22)**
- [ ] **Fase 8 — Performa dan Aksesibilitas Gerak (CPU Throttling, CLS, Reduced Motion)**
- [ ] **Fase 9 — Verifikasi Akhir, Matriks Lengkap & Serah Terima**

---

## 2. Katalog Animasi (M01 – M22)

| ID | Nama Animasi | Target Komponen / Halaman | Status | Bukti / Catatan |
|---|---|---|:---:|---|
| **M01** | Masuk Halaman (Page Enter) | `template.tsx` portal / main | [ ] | Pudar + naik 8px (--dur-base) |
| **M02** | Drawer Kiri (Sidebar Mobile) | `portal-shell.tsx` aside | [ ] | translateX(-100%→0) + swipe to close |
| **M03** | Panel Kanan (Right Drawer) | `*-dashboard-client.tsx` | [ ] | slide-in-right (--dur-slow) |
| **M04** | Bottom Sheet Dialog | `ui/dialog.tsx` & modal kustom | [ ] | slide-in-from-bottom di mobile (<sm) |
| **M05** | Indikator Navigasi Bawah | `MobileBottomNav` slot | [ ] | Sliding pill / underline transition |
| **M06** | Garis Tab Aktif | `class-hub-tabs.tsx`, filter chip | [ ] | Smooth indicator slide & scaleX |
| **M07** | Akordeon / Lipat | Sidebar groups, filter sheet | [ ] | grid-template-rows: 0fr→1fr |
| **M08** | Dropdown / Popover / Tooltip | Radix UI primitives | [ ] | Transform-origin scale & fade |
| **M09** | Reveal Saat Gulir | `ScrollReveal`, kartu aktivitas | [ ] | Fade + translate 12px (motion-ready) |
| **M10** | Count-up Angka Statistik | IPK, CPL, Presensi, Ringkasan | [ ] | useCountUp tabular-nums |
| **M11** | Bar / Cincin Progres | Progress bar materi & CPL | [ ] | scaleX dari kiri (bukan width) |
| **M12** | Grafik Masuk (Recharts) | Grafik tren IPK, radar CPMK | [ ] | isAnimationActive di mode penuh |
| **M13** | Heatmap Kontribusi | `heatmap-kontribusi.tsx` | [ ] | Sel fade-in berurutan (stagger 8ms) |
| **M14** | Shimmer Skeleton → Konten | `ui/skeleton.tsx`, `loading.tsx` | [ ] | Shimmer saat memuat, crossfade 160ms |
| **M15** | Umpan Balik Tekan (Press) | Tombol & kartu interaktif | [ ] | :active scale 0.98, hover lift |
| **M16** | Sorotan Ketukan Baris | List row & menu item | [ ] | Highlight flash (tap substitute) |
| **M17** | Aksi Berhasil / Gagal | Submit tugas, presensi, form error | [ ] | SVG check-draw & error shake |
| **M18** | Pewaktu Hampir Habis | CBT / Kuis countdown timer | [ ] | Pulsa 400ms tunggal di 5:00 & 1:00 |
| **M19** | Header Saat Digulir | `portal-shell.tsx` topbar | [ ] | Smooth subtle border & shadow |
| **M20** | Hero Login / Landing | `login/page.tsx`, `app/page.tsx` | [ ] | Calm sequence, pulse stop di mobile |
| **M21** | Lencana Notifikasi Naik | Bell icon unread badge | [ ] | Pop scale 1→1.15→1 saat berubah |
| **M22** | Gambar / Media Dimuat | Materi image & avatar | [ ] | Smooth fade-in saat onLoad |

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
