# AUDIT SISTEM & INVENTARIS BERANDA SIAJAR (FASE 0)

Dokumen ini disusun berdasarkan audit kode aktual pada codebase SIAJAR sebelum memulai perombakan isi Beranda (Hari Ini + Kelas Saya).

---

## 1. KOMPONEN BERANDA SAAT INI

Halaman Beranda Mahasiswa saat ini dirender melalui rute `/student` dengan komponen:
- **Server Entry**: [`src/app/(portal)/student/page.tsx`](file:///c:/Users/ACER/Downloads/implementasi/src/app/(portal)/student/page.tsx)
  - Memanggil `listMyDeadlinesAction()` dari `src/modules/academic/actions.ts`.
  - Meneruskan data `deadlineItems` ke komponen client `StudentDashboardClient`.
- **Client Container**: [`src/app/(portal)/student/student-dashboard-client.tsx`](file:///c:/Users/ACER/Downloads/implementasi/src/app/(portal)/student/student-dashboard-client.tsx)
  - **Layout Kolom**: Terdiri dari 2 kolom besar (`flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]`):
    1. **Kolom Tengah (Konten Utama)**:
       - **Section 1: Categories**: Pills filter kategori (Semua, Kelas Saya, Tugas & Kuis, Ujian, Presensi, Jadwal, Nilai) bersumber dari `BERANDA_CHIPS` di `menu-config.ts`.
       - **Section 2: Popular Books / Kelas Aktif**: Grid 3 kolom kartu sampul buku (aspect ratio 3/4.2, judul, kode MK, dosen, SKS, rating bintang 5, bookmark).
       - **Section 3: Recommended / Materi & Tugas**: Grid materi rekomendasi kartu hitam/kuning dengan pill tipe materi (Modul Kuliah, Kuis Interaktif, Buku Referensi, Tugas Praktikum).
    2. **Kolom Kanan (Detail & Action Panel)**:
       - **Bagian Atas**: [`UirLogo3D`](file:///c:/Users/ACER/Downloads/implementasi/src/components/retro/uir-logo-3d.tsx) (Kartu logo teknologi 3D rotasi interaktif dengan dot grid dan glow lembut).
       - **Dua Tombol Aksi Utama**: "Buka Silabus & Modul Kuliah" dan "Masuk Kelas / Presensi Aktif".
       - **Tiga Tombol Cepat**: Download, Save (Bookmark), Add to List (ke Kalender).
       - **Tabel Metadata Info**: Rating, Jadwal Kuliah, Ruang Kelas, Kehadiran (syarat UAS), Bobot SKS.
       - **Deskripsi Editorial**: Card deskripsi & silabus kuliah yang dipilih.
       - **Bagian Bawah**: Status Semester ("Aktif Berjalan").

---

## 2. SUMBER DATA TIAP SECTION SAAT INI

1. **Categories / Chips**:
   - Sumber: Konstanta `BERANDA_CHIPS` di `src/lib/config/menu-config.ts`.
   - State: `selectedCategory` di `student-dashboard-client.tsx`.
2. **Kelas Aktif (Popular Books)**:
   - Sumber: Array statis mock `COURSES` (5 item: Pemrograman Web Lanjut, Rekayasa Perangkat Lunak, Kecerdasan Buatan, Basis Data Terdistribusi, Keamanan Siber).
   - Data riil di database: Tabel `classes`, `courses`, `enrollments` (dapat diakses via Server Actions `listEnrolledClassesAction()`).
3. **Materi & Tugas (Recommended)**:
   - Sumber: Array statis mock `RECOMMENDED_MATERIALS` (4 item).
   - Data riil di database: Tabel `materials`, `assignments`, `exams`.
4. **Deadlines & Tugas Mendatang**:
   - Sumber: Server action `listMyDeadlinesAction()` yang memfilter tabel `assignments` dan `submissions`.

---

## 3. PERILAKU KLIK KARTU KELAS DAN EFEKNYA KE PANEL KANAN

- State saat ini: `const [selectedCourse, setSelectedCourse] = useState<CourseCardData>(COURSES[0])`.
- Saat salah satu kartu kelas diklik di grid tengah:
  1. Kartu kelas mendapatkan class highlight aktif (`shadow-retro-lg ring-2 ring-black bg-retro-warm/70`).
  2. State `selectedCourse` diperbarui.
  3. Panel kanan secara reaktif memperbarui baris metadata:
     - Rating & total review: `selectedCourse.ratingCount`
     - Jadwal: `selectedCourse.schedule`
     - Ruang: `selectedCourse.room`
     - Kehadiran: `selectedCourse.attendance`
     - SKS: `selectedCourse.sks`
     - Deskripsi silabus: `selectedCourse.description`
- Tidak ada pergantian mode/tab di panel kanan saat ini (selalu menampilkan detail kelas yang dipilih).

---

## 4. ANALISIS KARTU LOGO TEKNOLOGI (`UirLogo3D`) — ELEMEN DIBEKUKAN

File: [`src/components/retro/uir-logo-3d.tsx`](file:///c:/Users/ACER/Downloads/implementasi/src/components/retro/uir-logo-3d.tsx)

### Karakteristik & Logika Kerja:
1. **Daftar Logo**: Array `PROGRAMMING_LANGUAGES` berisi 8 bahasa resmi:
   - Python (`/tech-logos/python.svg`, glow: `rgba(56, 126, 184, 0.35)`)
   - JavaScript (`/tech-logos/javascript.svg`, glow: `rgba(240, 219, 79, 0.35)`)
   - TypeScript (`/tech-logos/typescript.svg`, glow: `rgba(0, 122, 204, 0.35)`)
   - React.js (`/tech-logos/react.svg`, glow: `rgba(97, 218, 251, 0.35)`)
   - C++ (`/tech-logos/cplusplus.svg`, glow: `rgba(0, 89, 156, 0.35)`)
   - Java (`/tech-logos/java.svg`, glow: `rgba(234, 45, 46, 0.35)`)
   - Rust (`/tech-logos/rust.svg`, glow: `rgba(206, 65, 43, 0.35)`)
   - PHP (`/tech-logos/php.svg`, glow: `rgba(119, 123, 180, 0.35)`)
2. **Mekanisme Rotasi & Waktu**:
   - `autoPlayInterval` default: **3200ms**.
   - Timer `setInterval` otomatis berganti logo secara siklis.
   - Menggunakan `useCallback` dan `useEffect`.
   - Pause saat di-hover pengguna (`isHovered`).
3. **Visual & Transisi**:
   - Latar: Dot grid texture `radial-gradient(#000000 1.2px, transparent 1.2px) [background-size:12px_12px]` opacity 15%.
   - Glow radial: Ambient radial glow dinamis 1000ms blur-xl sesuai warna glow bahasa aktif.
   - Panggung 3D: Interaktif tilt mouse hingga ±24 derajat (`transformStyle: 'preserve-3d'`, `rotateX`, `rotateY`).
   - Crossfade: Tumpukan semua logo dengan opacity 0/1 dan transition 700ms (kedua logo sempat bertumpuk saat crossfade, perilaku yang disengaja).
   - Label pil di bawah: Border 2px hitam, font mono uppercase, badge pill dengan nama bahasa aktif.
4. **Status Pembekuan**:
   - File `uir-logo-3d.tsx` **TIDAK BOLEH MUNCUL DI GIT DIFF**.
   - Posisi tetap di paling atas panel kanan untuk seluruh role.

---

## 5. DESIGN TOKENS (WARNA, TIPOGRAFI, BORDER, SHADOW, RADIUS)

Semua token terdefinisi di [`tailwind.config.ts`](file:///c:/Users/ACER/Downloads/implementasi/tailwind.config.ts) dan [`src/app/globals.css`](file:///c:/Users/ACER/Downloads/implementasi/src/app/globals.css):

### Warna:
- Background utama: `var(--bg-main)` (`#FFFFFF`, dark: `#0C0C0C`)
- Surface: `var(--bg-surface)` (`#FFFFFF`, dark: `#141414`)
- Surface Warm: `var(--retro-warm)` (`#F6F3EB`, dark: `#1F1F1F`)
- Border: `var(--retro-border)` (`#000000`, dark: `#FFFFFF`)
- Teks utama: `var(--text-primary)` (`#000000`, dark: `#FFFFFF`)
- Teks sekunder: `var(--text-secondary)` (`#141414`, dark: `#F3F4F6`)
- Teks subtle/muted: `var(--text-subtle)` (`#242424`, dark: `#E5E7EB`)
- Aksen Kuning Retro: `var(--retro-yellow)` (`#FFE500`, dark: `#FACC15`)
- Aksen Oranye Retro: `var(--retro-orange)` (`#FF5500`, dark: `#FB923C`)
- Aksen Mint Retro: `var(--retro-mint)` (`#00E599`, dark: `#4ADE80`)
- Aksen Ungu Retro: `var(--retro-purple)` (`#D4BBFF`, dark: `#C084FC`)
- Aksen Biru Retro: `var(--retro-blue)` (`#70D6FF`, dark: `#60A5FA`)

### Tipografi:
- Font Sans / Heading: Apple SF Pro (`SF Pro Display`, `SF Pro Text`, `SF Pro`) - 400, 500, 600, 700, 800.
- Font Mono: `SF Mono`, `SFMono-Regular`, `ui-monospace`, `Menlo`.

### Border, Shadow & Radius:
- Border default: `border-2 border-black` / `border-retro-border`.
- Radius kontrol/tombol: `rounded-xl` (12px-16px) untuk card & tombol besar; `rounded-control` (8px); `rounded-full` untuk pills/chips.
- Shadow Neo-Brutalis:
  - `shadow-retro`: `2px 2px 0px #000000`
  - `shadow-retro-md`: `3px 3px 0px #000000`
  - `shadow-retro-lg`: `4px 4px 0px #000000`
  - `shadow-[6px_6px_0px_#000000]` (desktop window/card besar)

---

## 6. KOMPONEN REUSABLE & POLA UI

1. **Kartu Sampul Buku**:
   - Aspect ratio `3/4.2`, vintage frame border (`inset-2.5 border-2`), kode mata kuliah mono, judul 3 baris tebal, nama dosen & SKS bergaris pemisah atas.
2. **Kartu Materi / Tugas**:
   - Aspect ratio `16/10`, lingkaran icon `BookOpen` (border-2, w-18 h-18), badge mono tipe materi.
3. **Chips / Category Pills**:
   - `px-4.5 py-2.5 sm:px-6 sm:py-3 rounded-full text-base font-black`, state aktif: `bg-black text-white shadow-retro`, state non-aktif: `bg-retro-surface text-foreground shadow-retro hover:bg-retro-warm`.
4. **Pills / Badges**:
   - `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-black border-2 border-retro-border`.
5. **Tombol Aksi**:
   - Primer: `bg-black text-white rounded-xl border-2 border-black font-heading font-black shadow-retro hover:bg-black/90 active:translate-y-0.5`.
   - Sekunder: `bg-retro-surface text-black rounded-xl border-2 border-black font-heading font-black shadow-retro hover:bg-retro-warm`.
6. **Ikon Set**:
   - `lucide-react` (Star, Bookmark, Play, Download, ListPlus, BookOpen, Calendar, Clock, MapPin, CheckCircle2, Sparkles, dll).
7. **Pola Loading / Kosong / Error**:
   - Skeleton: `src/components/ui/skeleton.tsx` (`bg-muted animate-pulse rounded-md`).
   - Empty State: `src/components/shared/empty-state.tsx`.
   - RetroWindow fallback jika error / kosong.

---

## 7. ARSITEKTUR & DATA FLOW

- **Framework**: Next.js 14 App Router (React 18 Server Components + Client Components).
- **Backend/ORM**: Supabase Client & Admin + Prisma Client (Dual connection dengan fallback offline aman via `SYNTHETIC_DEMO_USERS`).
- **Autentikasi & RBAC**:
  - `getCurrentUserWithRoles()` mengecek sesi Supabase atau cookie `demo_session`.
  - Multi-role didukung dengan cookie `active_role`.
  - Role portal mapping: `STUDENT` -> `/student`, `LECTURER` -> `/lecturer`, `TEACHING_ASSISTANT` -> `/ta`, `PROGRAM_COORDINATOR` -> `/coordinator`, `ACADEMIC_STAFF` -> `/staff`, `SYSTEM_ADMIN` / `SUPER_ADMIN` -> `/admin`.
- **Pola Realtime**:
  - Supabase client realtime channels (`attendance_sessions`, `exams`, `notifications`) atau polling ringan (30 detik).
- **Waktu & Jam Server**:
  - Standardisasi zona waktu: **Asia/Jakarta (WIB)**.

---

## 8. BASELINE SCREENSHOTS TERSIMPAN

Direktori: `docs/frozen-baseline/`
1. `tech-logo-desktop-1440.png` (Crop 1:1 kartu logo 3D desktop)
2. `tech-logo-tablet-820.png` (Crop 1:1 kartu logo 3D tablet)
3. `tech-logo-mobile-390.png` (Crop 1:1 kartu logo 3D mobile)
4. `desktop-beranda-top.png` (Tampilan atas Beranda desktop)
5. `desktop-beranda-mid.png` (Tampilan tengah Beranda desktop)
6. `desktop-beranda-bottom.png` (Tampilan bawah Beranda desktop)
7. `desktop-right-panel.png` (Panel kanan lengkap desktop)
8. `desktop-header.png` (Header desktop)
9. `desktop-sidebar.png` (Sidebar desktop)
10. `floating-ai-button.png` (Tombol melayang Tanya AI)
11. `tablet-beranda-820.png` (Tampilan Beranda di iPad Air)
12. `mobile-beranda-390.png` (Tampilan Beranda di iPhone 14)
