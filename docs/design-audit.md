# AUDIT DESAIN SIAJAR (SISTEM AKADEMIK & PEMBELAJARAN)
**Dokumen Audit Desain Visual, Token, Komponen, dan Pola Interaksi**  
*Tanggal: 7 Oktober 2026*  
*Basis Kode: SIAJAR Next.js App Router + Tailwind CSS + Radix UI + Lucide React*

---

## 1. DESIGN TOKENS

Semua nilai di bawah ini diekstraksi langsung dari `src/app/globals.css` dan `tailwind.config.ts`.

### 1.1 Warna (Color Palette)

#### A. Permukaan & Latar Belakang (Monokrom Retro Mac OS)
| Token CSS Variable | Nilai Light Mode | Nilai Dark Mode (`.dark`) | Kegunaan |
|---|---|---|---|
| `--bg-main` | `#FFFFFF` | `#111111` | Latar belakang kanvas aplikasi |
| `--bg-surface` | `#FFFFFF` | `#181818` | Latar kartu, modal, popover |
| `--bg-surface-raised` | `#F5F5F5` | `#222222` | Kontainer elemen terangkat |
| `--border-main` | `#000000` | `#FFFFFF` | Garis tepi elemen standar |
| `--border-strong` | `#000000` | `#FFFFFF` | Garis tepi pembatas tebal |

#### B. Tipografi & Teks
| Token CSS Variable | Nilai Light Mode | Nilai Dark Mode | Kegunaan |
|---|---|---|---|
| `--text-primary` | `#000000` | `#FFFFFF` | Teks utama, judul, teks tombol aktif |
| `--text-secondary` | `#2B2B2B` | `#CCCCCC` | Deskripsi, keterangan, teks penjelas |
| `--text-subtle` | `#555555` | `#999999` | Teks pendukung, placeholder, timestamp |

#### C. Aksen Utama & Interaksi
| Token CSS Variable | Nilai Light Mode | Nilai Dark Mode | Kegunaan |
|---|---|---|---|
| `--primary` | `#000000` | `#FFFFFF` | Elemen primer aktif, badge solid |
| `--primary-hover` | `#1A1A1A` | `#E5E5E5` | State hover tombol primer |
| `--primary-soft` | `#F0F0F0` | `#252525` | Background item aktif di navigasi |
| `--primary-foreground` | `#FFFFFF` | `#000000` | Teks di atas warna primary |
| `--ring` | `rgb(0 0 0 / 0.35)` | `rgb(255 255 255 / 0.45)` | Focus ring aksesibilitas |

#### D. Palet Retro Mackenzie Child ("Hello. I'm Mac.")
| Token Tailwind / CSS Var | Nilai Heksadesimal | Kegunaan dalam UI |
|---|---|---|
| `var(--retro-bg)` | `#FFFFFF` (dark: `#111111`) | Kanvas jendela retro |
| `var(--retro-surface)` | `#FFFFFF` (dark: `#181818`) | Badan jendela (*window body*) |
| `var(--retro-warm)` | `#E2E2E2` (dark: `#262626`) | Header bar jendela, chip inactive |
| `var(--retro-yellow)` | `#EFEFEF` (dark: `#2A2A2A`) | Aksen banner search topbar, chip highlight |
| `var(--retro-orange)` | `#000000` (dark: `#FFFFFF`) | Aksen ikon titik mac, indikator aktif |
| `var(--retro-border)` | `#000000` (dark: `#FFFFFF`) | Border 2px hitam tegas |
| `var(--retro-purple)` | `#E8E8E8` (dark: `#2E2E2E`) | Latar badge kategori alternatif |
| `var(--retro-mint)` | `#F0F0F0` (dark: `#252525`) | Latar badge kode kelas / SKS |
| `var(--retro-pink)` | `#EAEAEA` (dark: `#2B2B2B`) | Tag variasi konten |
| `var(--retro-blue)` | `#E2E2E2` (dark: `#303030`) | Aksen sekunder |
| `var(--retro-dither)` | `#DFDFDF` (dark: `#222222`) | Pola dot-halftone retro grid |

#### E. Traffic Light Window Buttons (Tombol Jendela Mac)
- **Merah**: `#FF5F56` dengan border `border-black/80` dan bayangan `shadow-[0.5px_0.5px_0px_#000]`
- **Kuning**: `#FFBD2E` dengan border `border-black/80` dan bayangan `shadow-[0.5px_0.5px_0px_#000]`
- **Hijau**: `#27C93F` dengan border `border-black/80` dan bayangan `shadow-[0.5px_0.5px_0px_#000]`

#### F. Status (Monokrom High-Contrast)
| Status | Default (Light) | Soft (Background) | Border | Foreground (Teks) |
|---|---|---|---|---|
| `success` | `#000000` | `#F0F0F0` | `#000000` | `#FFFFFF` |
| `warning` | `#222222` | `#ECECEC` | `#000000` | `#FFFFFF` |
| `danger` | `#000000` | `#F4F4F4` | `#000000` | `#FFFFFF` |
| `info` | `#000000` | `#F0F0F0` | `#000000` | `#FFFFFF` |

---

### 1.2 Tipografi

- **Font Family**:
  - `sans` & `heading`: `'SF Pro Display'`, `'SF Pro Text'`, `'SF Pro'`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `Roboto`, `Helvetica`, `Arial`, `sans-serif`
  - `mono`: `'SF Mono'`, `SFMono-Regular`, `ui-monospace`, `Menlo`, `Monaco`, `Consolas`, `monospace`
- **Ukuran Dasar**:
  - `html`: `18px`
  - `body`: `1.05rem` (~19px), `line-height: 1.6`
- **Hierarki Heading**:
  - `h1`: `text-2xl` sm: `text-3xl`, `font-black`, `tracking-tight`, `font-heading`, `text-wrap: balance`
  - `h2`: `text-lg` sm: `text-xl`, `font-semibold` / `font-black`, `tracking-tight`
  - `h3`: `text-base` sm: `text-[17px]`, `font-bold` / `font-black`
  - `h4`: `text-base` / `text-lg`, `font-bold`
  - `body`: `text-sm` sm: `text-base`, `font-normal`
  - `caption / label`: `text-xs` / `text-[11px]`, `font-mono font-bold uppercase tracking-wider`
  - `letter-spacing`: Headings memakai `-0.015em`, kode dan badge memakai `tracking-wider` / `tracking-[0.18em]`

---

### 1.3 Border Width & Sudut Kelengkungan (Border Radius)

- **Ketebalan Border**:
  - Border Standar: `border-2 border-black` (`2px solid #000000`)
  - Border Tipis: `border-[1.5px] border-black` / `border-retro-sm`
  - Border Pembatas Internal: `border-retro-border/30` atau `border-retro-border/40`
- **Radius**:
  - Token CSS: `--radius-sm: 0px`, `--radius-control: 2px`, `--radius-container: 2px`, `--radius-lg: 2px`
  - Tailwind Extend:
    - `rounded-none sm:rounded-[2px]` / `sm:rounded-[3px]` untuk kartu, input, tabel, window.
    - `rounded-xl` (`12px`) / `rounded-2xl` (`16px`) untuk kontainer shell atau kartu cover buku.
    - `rounded-full` khusus untuk Chip Kategori, Badge Pil, dan Tombol Melayang ("Tanya AI SIAJAR").

---

### 1.4 Bayangan Keras (Hard Shadow / Neo-Brutalist Offset)

Tidak ada shadow lembut (blur: 0px pada seluruh shadow keras):
- `shadow-retro`: `4px 4px 0px #000000` (atau `2px 2px 0px var(--retro-border)`)
- `shadow-retro-md`: `5px 5px 0px #000000`
- `shadow-retro-lg`: `7px 7px 0px #000000`
- `shadow-retro-window`: `6px 6px 0px #000000`
- `shadow-sm`: `2px 2px 0px #000000`
- `shadow-md`: `4px 4px 0px #000000`
- `shadow-xs`: `1.5px 1.5px 0px #000000`

---

### 1.5 Pola Latar Belakang & Efek Visual Retro

1. **Halftone Dither Pattern** (`.bg-retro-dither`):
   ```css
   background-color: #E2E2E2;
   background-image: radial-gradient(#000000 1.15px, transparent 1.15px);
   background-size: 4px 4px;
   ```
2. **Retro Grid Pattern** (`.bg-retro-grid`):
   ```css
   background-size: 20px 20px;
   background-image: linear-gradient(to right, #00000014 1px, transparent 1px),
                     linear-gradient(to bottom, #00000014 1px, transparent 1px);
   ```

---

## 2. DAFTAR KOMPONEN REUSABLE

### 2.1 Komponen Primitif UI (`src/components/ui/`)

| Komponen | Path File | Varian / Props | Gaya Visual |
|---|---|---|---|
| `Button` | `src/components/ui/button.tsx` | `variant`: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`<br>`size`: `default`, `sm`, `lg`, `icon` | `border-2 border-black rounded-[2px] font-bold shadow-[2.5px_2.5px_0px_#000]` |
| `Input` | `src/components/ui/input.tsx` | HTML Input Props standard | `border-2 border-black bg-white shadow-[2.5px_2.5px_0px_#000] focus:shadow-[4px_4px_0px_#000]` |
| `Badge` | `src/components/ui/badge.tsx` | `variant`: `default`, `secondary`, `success`, `warning`, `danger`, `info`, `outline` | `border-[1.5px] border-black text-[11px] font-bold shadow-[1.5px_1.5px_0px_#000]` |
| `Card` | `src/components/ui/card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `border-2 border-black bg-white shadow-[6px_6px_0px_#000]` |
| `Dialog` | `src/components/ui/dialog.tsx` | Radix Dialog Primitive (`Dialog`, `DialogTrigger`, `DialogContent`, dsb) | `border-2 border-black bg-white rounded-lg shadow-none overlay: bg-black/40` |
| `Table` | `src/components/ui/table.tsx` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | `border-2 border-black bg-white shadow-[4px_4px_0px_#000] header: bg-[#E2E2E2]` |
| `Skeleton` | `src/components/ui/skeleton.tsx` | `className` | `animate-pulse rounded-md bg-muted` |

### 2.2 Komponen Retro (`src/components/retro/`)

| Komponen | Path File | Deskripsi & Varian |
|---|---|---|
| `RetroWindow` | `src/components/retro/retro-window.tsx` | Kontainer jendela retro dengan traffic lights bulat merah-kuning-hijau, judul bar retro, badge header, dan aksi di kanan header bar. |
| `UirLogo3D` | `src/components/retro/uir-logo-3d.tsx` | Logo 3D isometrik dengan animasi floating perspektif, bayangan tanah, dan efek kilau. |
| `MacIllustration` | `src/components/retro/mac-illustration.tsx` | Ilustrasi vektor Macintosh klasik monochrome dengan floppy drive dan status LED. |

### 2.3 Komponen Bersama (`src/components/shared/`)

| Komponen | Path File | Deskripsi & Varian |
|---|---|---|
| `Sidebar` | `src/components/shared/sidebar.tsx` | Navigasi samping data-driven per role, box profil inisial, switcher role, tombol logout. |
| `Topbar` | `src/components/shared/topbar.tsx` | Search bar retro bergaris, badge semester, lonceng notifikasi. |
| `PortalShell` | `src/app/(portal)/portal-shell.tsx` | Shell aplikasi utama Next.js App Router (sidebar responsive + topbar kuning + viewport). |
| `PortalNav` | `src/app/(portal)/portal-nav.tsx` | Navigasi menu dinamis berbasis role (`getNavGroups(role)`). |
| `AiAcademicAssistant` | `src/components/shared/ai-academic-assistant.tsx` | Tombol melayang pil hitam di kanan bawah + popover chat AI dengan quick prompts. |
| `NotifikasiPopover` | `src/components/shared/notifikasi-popover.tsx` | Popover notifikasi dengan tab, aksi tandai dibaca, dan status unread. |
| `EmptyState` | `src/components/shared/empty-state.tsx` | Tampilan state kosong dengan ikon, judul, deskripsi, dan tombol CTA. |
| `StatusBadge` | `src/components/shared/status-badge.tsx` | Badge status akademik berkontras tinggi (HADIR, IZIN, DISETUJUI, dsb). |
| `MarkdownViewer` | `src/components/shared/markdown-viewer.tsx` | Penampil materi dan teks dengan format markdown ter-sanitize. |

---

## 3. POLA LAYOUT HALAMAN

### 3.1 Pola Shell Standar
```
+-----------------------------------------------------------------------------------------+
| [O O O] SIAJAR   | [ Cari mata kuliah...                     ] [2026/2027 GANJIL] [ 🔔 ]| (Header)
+------------------+----------------------------------------------------------------------+
| SIDEBAR          | KONTEN UTAMA (flex-1)                               | PANEL DETAIL   |
| - Role Badge     | - Jendela Header (RetroWindow)                      | (Opsional/Mhs) |
| - Grup Menu      | - Baris Kategori (Pill Buttons)                     | - Logo 3D UIR  |
| - Menu Items     | - Grid Konten (1 col mobile, 2 col md, 3 col lg)   | - Tombol Aksi  |
| - Profil & Mode  | - Judul Section + link "more ->"                    | - Spek Kelas   |
| - Logout         | - Tabel / Form / Hub Kelas                          |                |
+-----------------------------------------------------------------------------------------+
```

### 3.2 Aturan Grid & Jarak Antar Section
- **Jarak Antar Section Utama**: `space-y-6` sm: `space-y-8` atau `space-y-10`.
- **Padding Viewport**: `p-4 sm:p-6 lg:p-8` (atau `p-6 sm:p-10` pada portal mahasiswa).
- **Grid Kartu**:
  - Kolom Hari / Kelas / Modul: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7`
- **Pola Judul Section & "more →"**:
  ```tsx
  <div className="flex items-center justify-between">
    <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
      Judul Section
    </h2>
    <Link href="/link-tujuan" className="text-base sm:text-lg font-black text-muted-foreground hover:text-foreground transition-colors">
      more &rarr;
    </Link>
  </div>
  ```

### 3.3 Kartu Bergaya Sampul Buku (*Book Cover Card*)
- Rasio Aspek: `aspect-[3/4.2]`
- Frame Buku Vintage: `border-2 border-retro-border rounded-xl p-6` dengan bingkai dalam tipis `absolute inset-2.5 border-2 rounded-lg pointer-events-none`
- Tipografi: Kode MK monospace tebal di atas, judul di tengah (`line-clamp-3`), dosen & SKS di bagian bawah dengan garis pemisah `border-t-2`.
- Warna sampul: Monokrom hitam (`bg-black text-white`) atau aksen retro yellow (`bg-retro-yellow text-black`).

---

## 4. POLA INTERAKSI STATE

| State | Perilaku & Class Tailwind |
|---|---|
| **Hover** | Transisi halus, naik sedikit: `transition-all hover:-translate-y-0.5` atau `hover:-translate-y-1`<br>Bayangan membesar: `hover:shadow-retro-md`<br>Tombol solid: `hover:bg-black hover:text-white` |
| **Active / Click** | Efek tekan: `active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000]` |
| **Focus-Visible** | Aksesibilitas tegas: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2` |
| **Disabled** | `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none` |
| **Loading** | Indikator `animate-spin` pada ikon Lucide, atau bar penyapu `.sweep` pada tombol |
| **Empty State** | Border putus-putus `border-2 border-dashed border-retro-border bg-retro-warm/30 rounded-lg p-10 text-center` |
| **Error / Validasi** | Teks tegas monokrom hitam/putih dengan badge alert, tanpa warna neon acak |

---

## 5. IKONOGRAFI

- **Library**: `lucide-react` (versi 0.446.0).
- **Gaya Ikon**: Garis luar (*outline*).
- **Ukuran Standar**:
  - Mini / Inline teks: `h-3.5 w-3.5` atau `h-4 w-4`
  - Item Navigasi: `h-4 w-4` atau `h-5 w-5`
  - Header & Section: `h-5 w-5` atau `h-6 w-6`
  - Fitur / Ilustrasi kosong: `h-9 w-9` sampai `h-10 w-10`
- **Ketebalan Garis**: Standar bawaan Lucide (`stroke-width: 2`).

---

## 6. STATUS PEWARNAAN & ELEMEN BARU

Sesuai aturan 1.5 prompt:
1. Warna status memakai token monokrom berkontras tinggi yang sudah ada (`--status-success`, `--status-warning`, `--status-danger`, `--status-info`).
2. Perbedaan status dipertegas lewat **label teks eksplisit**, **ikon kontekstual**, dan **pola visual solid vs outline**.
3. Komponen baru (seperti live panel ujian, modul presensi lokasi, live coding sandbox) **wajib 100% menggunakan token yang diaudit di atas** tanpa menambah font, warna, atau library eksternal baru.
