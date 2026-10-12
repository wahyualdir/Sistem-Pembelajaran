# Audit Responsivitas & Skala Proyek SIAJAR (Fase 0)

## 1. Ringkasan Eksekutif & Permasalahan Utama
Berdasarkan audit komprehensif pada basis kode SIAJAR (Next.js 14 App Router, Tailwind CSS, Radix UI), ditemukan beberapa akar masalah yang menyebabkan tampilan terasa terlalu besar (over-scaled) dan sesak pada laptop 1366x768 (zoom 100% maupun zoom Windows 125%/150%), tablet, serta ponsel pintar:

1. **Token Layout Berbasis Pixel Tetap (Hardcoded Pixels)**:
   - `--layout-sidebar-width`: 218px - 315px
   - `--layout-right-panel-width`: 305px - 480px
   - `--layout-header-height`: 72px
   - Pada resolusi 1280px - 1535px (termasuk 1366x768), sidebar (218px) + panel kanan inline (305-330px) menyita lebih dari 40% lebar layar, menyisakan kolom tengah hanya ~59% yang sempit dan tertekan.

2. **Skala Global Terlalu Besar**:
   - `html`: 16px statis tanpa adaptasi breakpoint laptop.
   - Kontrol `.field` dan `.btn-solid`: tinggi 3.1rem (49.6px) dengan font 1.05rem (terlalu masif untuk antarmuka desktop produktivitas).
   - Heading `h1-h6`: font-weight 800 agresif.
   - Ditemukan **147 pemunculan** kelas `text-3xl` dan `text-4xl` tanpa fluid clamp.
   - Ditemukan **sekitar 493 kelas pixel arbitrer** (`text-[Npx]`, `h-[Npx]`, `w-[Npx]`, `min-w-[Npx]`) yang tidak ikut penskalaan rem.

3. **Inkonsistensi Viewport Mobile & Tablet**:
   - Ditemukan penggunaan `h-screen` / `min-h-screen` (9 berkas) yang rentan overflow pada mobile browser bar, bukan `dvh`.
   - Belum ada `export const viewport` dengan `viewportFit: 'cover'` di `src/app/layout.tsx`.
   - Kurang dukungan safe-area insets (`env(safe-area-inset-*)`).
   - Tombol mengambang (FAB) *Tanya AI SIAJAR* berpotensi menutupi area tombol formulir di viewport pendek jika tidak ada padding bawah yang memadai pada elemen `<main>`.

---

## 2. Inventarisasi Metrik Kunci

| Kategori | Temuan Audit | Target Perbaikan (Fase 1-5) |
|---|---|---|
| **Root Font-Size** | 16px (semua resolusi) | `>=1920`: 16px, `1536-1919`: 15px, `1024-1535`: 14px, `<1024`: 15px |
| **Token Layout** | Px tetap (218-315px, 305-480px, 72px) | Berbasis rem: Sidebar ~15rem, Rail ~4.5rem, Panel Kanan ~20rem, Header ~3.5rem (mobile ~3.25rem) |
| **Panel Kanan (Beranda/LMS)** | Inline aktif pada breakpoint `xl` (1280px) | Inline HANYA pada `>=1536px` (`2xl`), di bawah itu menjadi drawer geser via toggle |
| **Lebar Kolom Tengah Laptop** | ~59% di 1366x768 | **>= 60%** (target tercapai ~84% tanpa inline panel, ~65% di 1536px) |
| **Pemakaian text-3xl / text-4xl** | 147 instans | Ganti dengan utilitas fluid `text-display`, `text-title`, `text-section` |
| **Tinggi Kontrol (.field, .btn-solid)** | 3.1rem (49.6px) | Fine pointer: ~2.5rem; Coarse pointer: min 2.75rem (44px) |
| **Viewport & Mobile Height** | `h-screen`, `min-h-screen` | Standarisasi ke `dvh` dan `min-h-dvh` |
| **Mobile Safe-Area** | Tidak ada | `viewportFit: 'cover'` + safe-area insets |

---

## 3. Rencana Tindak Lanjut per Fase
- **Fase 1**: Fondasi skala rem di `globals.css`, root font-size, breakpoint fluid clamp di `tailwind.config.ts`, kontrol standar, viewport export & safe area.
- **Fase 2**: Refaktor shell (`portal-shell.tsx`, `dashboard-shell.tsx`, `topbar.tsx`, `sidebar.tsx`, panel kanan `right-panel-switcher.tsx`, tombol AI).
- **Fase 3**: Standarisasi komponen primitives (`button`, `input`, `card`, `table`, `dialog`, `badge`, `tabs`).
- **Fase 4**: Harmonisasi hub view & halaman (grid responsif, Recharts ResponsiveContainer, filter chips scroll snap).
- **Fase 5**: E2E verification test suite (`tests/e2e/responsive.spec.ts`) di 11 viewport standar, screenshot visual, validasi cek (typecheck, lint, cek:hex, build).
