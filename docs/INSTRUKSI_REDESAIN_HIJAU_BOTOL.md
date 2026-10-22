# SIAJAR — Instruksi Redesain "Hijau Botol" untuk Antigravity

Versi 1 · 23 Oktober 2026 · Bahasa antarmuka dan dokumentasi: Indonesia

Taruh berkas ini di `docs/INSTRUKSI_REDESAIN_HIJAU_BOTOL.md`, lalu tempel prompt pembuka di bawah ke chat Antigravity. Berkas ini hanya mengatur tampilan. Instruksi fitur lama (`docs/INSTRUKSI_ANTIGRAVITY.md`) tidak berubah dan tetap berlaku untuk aturan tulisan antarmuka (bagian 4 di sana).

---

## Prompt pembuka (tempel ke Antigravity)

```
Baca seluruh isi docs/INSTRUKSI_REDESAIN_HIJAU_BOTOL.md dan bagian 4 di
docs/INSTRUKSI_ANTIGRAVITY.md sebelum menyentuh kode apa pun.

Tugasmu hanya mengubah tampilan SIAJAR dari gaya retro (jendela Mac, border hitam
tebal, bayangan keras) menjadi LMS yang bersih dan rapi dengan aksen hijau botol.
Jangan mengubah logika, database, RLS, server action, rute, atau menu-config.

Syarat yang tidak boleh dilanggar:
1. Kerjakan hanya di branch redesain/hijau-botol. Jangan menyentuh main.
2. Tampilan lama harus tetap ada dan tetap jadi default. Tampilan baru hanya muncul
   bila tema "botol" dipilih. Jangan menghapus komponen, kelas, atau berkas retro.
3. Satu fase, satu rangkaian commit dengan awalan feat(tampilan) atau copy(teks-ui),
   supaya tiap fase bisa dibatalkan sendiri.
4. Setelah tiap fase: typecheck, lint, test, build, cek:hex, cek:kontras, dan
   perbandingan screenshot tema retro terhadap baseline harus lolos. Tulis ringkasan
   di docs/PROGRESS.md.
5. Jangan menebak nama berkas, kelas, atau komponen. Semua nama di dokumen ini yang
   bertanda "sketsa" harus dicocokkan dulu dengan isi repo.

Mulai dari Fase 0. Kerjakan Fase 0 sampai Fase 9 berurutan tanpa berhenti untuk
konfirmasi. Bila ada yang tidak jelas, pilih opsi paling aman, catat di
docs/KEPUTUSAN.md dengan awalan [Redesain], lalu lanjut.
```

---

## 1. Tujuan dan batas

**Tujuan.** Satu tema baru bernama `botol`: terang, tenang, rapi, mudah dipindai. Aksen tunggal hijau botol. Tata letak tiga kolom (sidebar, konten, rail kanan) dipertahankan dan dibuat seragam untuk ketujuh peran.

**Yang boleh diubah:** CSS, token, komponen presentasi di `src/components`, berkas tampilan di `src/app/(portal)`, teks judul dan label antarmuka, layout root, satu route handler kecil untuk pemilih tema.

**Yang tidak boleh diubah:**

- `src/modules/**` (kecuali satu server action pemilih tema bila diputuskan di Fase 1), `supabase/**`, `prisma/**`
- `src/lib/config/menu-config.ts`, nama rute, nama peran, kebijakan RLS
- Perilaku fitur: autosave ujian, presensi, penilaian, notifikasi, dan seterusnya
- Dependensi npm. Tidak ada paket baru. Font memakai `next/font` bawaan.

**Di luar cakupan putaran ini** (catat di `docs/IDE_LANJUTAN.md`, jangan dikerjakan): mode gelap untuk tema botol, penghapusan kode retro, ilustrasi baru, animasi baru.

---

## 2. Jaring pengaman dan rollback

Ada tiga lapis. Semuanya harus berfungsi sebelum fase visual pertama.

### Lapis 1 — Git

- Buat tag `pra-redesain-botol` pada HEAD saat ini, dan branch `redesain/hijau-botol` dari titik itu.
- Branch tidak digabung ke `main` oleh Antigravity. Penggabungan diputuskan pemilik.
- Setiap fase menghasilkan commit dengan awalan seragam (`feat(tampilan): …` atau `copy(teks-ui): …`). Commit teks judul (Fase 8) dipisah dari commit gaya supaya bisa dibatalkan terpisah.

### Lapis 2 — Tema ganda (rollback tanpa mengubah kode)

- Kedua tampilan hidup berdampingan. Atribut `data-theme="retro"` atau `data-theme="botol"` dipasang di `<html>`.
- **Default tetap `retro`.** Antigravity tidak boleh mengubah default menjadi `botol`.
- Pilihan tema disimpan di cookie `siajar-tema`. Cara kembali ke tampilan lama: buka `/tema?set=retro`, atau Pengaturan, bagian Tampilan, atau set env `UI_THEME_DEFAULT=retro`.
- Seluruh gaya tema baru ada di **satu berkas** `src/app/tema-botol.css` yang diimpor dari layout root. Menghapus satu baris impor itu menghilangkan tema baru seluruhnya.

### Lapis 3 — Deploy

- Pemilik dapat mempromosikan deployment Vercel sebelumnya (Instant Rollback) bila hasil deploy tidak cocok.

### Aturan agar rollback tetap berlaku

- Jangan menghapus berkas, komponen, kelas CSS, atau font SF Pro. Penghapusan retro dikerjakan terpisah, setelah pemilik menyetujui.
- Perubahan pada komponen bersama harus netral terhadap tema: bedakan tampilan lewat token CSS dan atribut `data-ui`, bukan dengan menggandakan komponen.
- Tema `retro` harus tetap identik dengan baseline setelah tiap fase (lihat Fase 0 dan bagian 7).

---

## 3. Aturan agar tidak terlihat buatan AI

Ini daftar larangan yang diperiksa di akhir tiap fase. Pelanggaran diperbaiki sebelum commit.

**Visual**

- Tidak ada gradien (linear, radial, conic) di mana pun.
- Tidak ada efek kaca (`backdrop-blur`), glow, atau bayangan berwarna.
- Tidak ada warna Tailwind keluarga `blue`, `indigo`, `violet`, `purple`, `sky`, `cyan`, `fuchsia`, `pink`. Info tidak diberi warna: abu dan ikon.
- Tidak ada ikon di dalam kotak berwarna pada tiap kartu. Ikon hanya dipakai bila membawa makna (menu, status, aksi).
- Tidak ada tiga kotak statistik kembar dengan ikon besar. Angka ringkas ditampilkan sebagai satu panel berisi sel yang dipisah garis tipis.
- Tidak ada kartu di dalam kartu. Bagian dalam panel berupa baris dengan garis pemisah.
- Tidak ada `rounded-2xl` atau lebih besar. Radius hanya 4, 6, 10, 12 px, dan pil untuk chip status.
- Tidak ada label kapital kecil berjarak huruf lebar (gaya "eyebrow"). Judul grup memakai huruf biasa.
- Tidak ada banner pahlawan (hero), gelembung dekoratif, pola titik, atau ilustrasi pengisi.
- Tidak ada animasi memantul, berdenyut, atau berkilau. Gerak hanya `transition` warna dan opasitas 120 ms, tanpa transformasi saat hover. Hormati `prefers-reduced-motion`.

**Teks**

- Ikuti bagian 4 `INSTRUKSI_ANTIGRAVITY.md`: pendek, tanpa emoji, tanpa seruan, tanpa kata terlarang (Dashboard, Portal, Hub, Insight, dan seterusnya).
- Ganti sisa bahasa Inggris di antarmuka, misalnya "CATEGORIES" menjadi "Filter".
- Judul panel bukan nama berkas. `dosen_perkuliahan_portal.app` dan `antrean_koreksi_tugas.list (0)` menjadi judul biasa seperti "Antrean koreksi".

---

## 4. Spesifikasi visual

### 4.1 Warna (token tema botol)

Netral (tanpa semburat biru atau ungu):

| Token | Nilai | Pemakaian |
|---|---|---|
| `--bg` | `#F6F6F5` | latar halaman |
| `--surface` | `#FFFFFF` | panel, sidebar, topbar |
| `--surface-2` | `#F0F1EF` | hover baris, latar kolom pencarian, header tabel |
| `--ink` | `#1D1F1D` | teks utama |
| `--ink-2` | `#5C615D` | teks sekunder, label |
| `--ink-3` | `#8A8F8B` | placeholder dan ikon nonaktif. Bukan untuk teks bermakna. |
| `--garis` | `#E2E3E0` | border panel, pemisah baris |
| `--garis-input` | `#8A8F8B` | border input dan kontrol (kontras 3:1) |

Aksen dan status:

| Token | Nilai | Pemakaian |
|---|---|---|
| `--primary` | `#1B5E43` | tombol utama, tautan, menu aktif, fokus |
| `--primary-dark` | `#144832` | hover dan active tombol utama |
| `--primary-soft` | `#E5EFE9` | latar item aktif, item unggulan, chip "berlangsung" |
| `--status-danger` | `#B42318` | tenggat mendesak, galat, tombol hapus |
| `--status-danger-soft` | `#FDECEA` | latar chip mendesak dan pesan galat |
| `--status-warn` | `#B7791F` | ikon peringatan |
| `--status-warn-text` | `#8A5A12` | teks peringatan di atas tint |
| `--status-warn-soft` | `#FBF1DC` | latar chip perhatian |

Aturan pemakaian:

- Hijau hanya untuk aksi utama, menu aktif, dan fokus. Satu tombol utama per tampilan.
- Merah hanya untuk tenggat mendesak (kurang dari 3 jam), galat, dan tindakan merusak. Merah tidak dipakai untuk merek.
- "Berhasil" tidak diberi hijau kedua: ikon centang dengan teks `--ink`.
- Status tidak boleh dibedakan hanya lewat warna. Selalu ada ikon atau teks.
- Fokus: `outline: 2px solid var(--primary); outline-offset: 2px` pada semua kontrol interaktif.
- Berlaku untuk tema botol saja. Mode gelap diabaikan di tema ini: tombol gelap/terang disembunyikan, dan blok token botol juga ditulis untuk `[data-theme="botol"].dark` supaya selalu terang.

### 4.2 Tipografi

- Satu keluarga: **Source Sans 3** lewat `next/font/google` (subset latin, bobot 400, 500, 600, 700, `display: swap`). Bila build tidak bisa mengunduh, simpan woff2 di `public/fonts/` dan pakai `localFont`, sertakan berkas lisensi OFL.
- Variabel `--font-sans` dan `--font-heading` di tema botol menunjuk ke font ini. SF Pro tetap dimuat untuk tema retro dan tidak dihapus di putaran ini.
- Bobot isi 400. Di tema botol, `.font-bold` dipetakan ke 600 dan `.font-extrabold`/`.font-black` ke 700. Body default tidak lagi tebal.
- Skala: 12 (keterangan, minimum), 13 (label), 14 (isi), 15 (judul panel), 20, 24 (judul halaman), 28 (angka metrik). Tinggi baris isi 1.5, judul 1.25.
- Angka jam, nilai, persentase, dan hitung mundur memakai `font-variant-numeric: tabular-nums`.
- Teks 10px dan 11px dinaikkan ke 12px di tema botol.

### 4.3 Bentuk, jarak, bayangan

- Skala jarak 4 px: 4, 8, 12, 16, 20, 24, 32, 48.
- Radius: kontrol 6, panel 10, dialog 12, chip pil, avatar bulat.
- Border 1px. Tidak ada border 2 px atau lebih di tema botol, kecuali penanda aktif 3 px di sisi kiri.
- Bayangan: tidak ada pada keadaan diam. Popover `0 8px 24px rgb(29 31 29 / 0.12)`. Dialog memakai overlay `rgb(29 31 29 / 0.4)`.
- Ikon `lucide-react` 18 px (16 px di dalam teks), `stroke-width` 1.75 lewat CSS.

### 4.4 Komponen dasar

**Panel.** Latar `--surface`, border `--garis`, radius 10. Header 48 px: judul 15/600, keterangan 13 `--ink-2`, slot aksi di kanan. Isi berpadding 16 (20 di layar lebar). Panel tidak bersarang.

**Baris daftar.** Tinggi minimum 56, padding 12 × 16, pemisah 1px, hover `--surface-2`. Seluruh baris bisa difokus bila bisa diklik.

**Item unggulan.** Satu per halaman (ujian aktif atau kelas berlangsung): latar `--primary-soft` dengan garis kiri 3px `--primary`.

**Chip status.** Tinggi 22, padding 0 8, pil, teks 12/500 huruf biasa, selalu dengan ikon kecil atau titik.

| Varian | Latar | Teks | Contoh |
|---|---|---|---|
| Netral | `--surface-2` | `--ink-2` | Akan datang |
| Berlangsung | `--primary-soft` | `--primary` | Berlangsung |
| Mendesak | `--status-danger-soft` | `--status-danger` | 15 menit lagi |
| Perhatian | `--status-warn-soft` | `--status-warn-text` | Hampir 75% |
| Selesai | `--surface-2` | `--ink` + ikon centang | Dinilai |

**Metrik.** Satu panel dengan sel berpemisah garis vertikal tipis. Label 13 `--ink-2`, nilai 28/600 tabular. Tanpa ikon besar.

**Tombol.** Tinggi 40 (32 untuk padat, 44 untuk target sentuh di ponsel), radius 6.

| Varian | Tampilan |
|---|---|
| Utama | hijau penuh, teks putih |
| Sekunder | putih, border 1px `--garis-input` |
| Ghost | tanpa border, hover `--surface-2` |
| Bahaya | teks `--status-danger`, border `--status-danger` |

Status nonaktif: opasitas 0.5 dan `cursor: not-allowed`.

**Input.** Tinggi 40, border `--garis-input`, radius 6, fokus memakai cincin hijau. Label selalu terlihat dan terhubung ke input. Galat berupa teks di bawah kolom, bukan hanya garis merah.

**Tabel.** Header 12.5/600 `--ink-2` di atas `--surface-2`. Baris tinggi 48, tanpa zebra, pemisah 1px. Tabel lebar menggulir di wadahnya sendiri.

**Tab.** Tab bergaris bawah (garis bawah 2px hijau pada tab aktif), bukan pil.

---

## 5. Spesifikasi tata letak

Dipertahankan: tiga kolom `sidebar | konten | rail`. Token lebar yang sudah ada dipakai ulang (`--layout-sidebar-width`, `--layout-right-panel-width`).

| Lebar layar | Perilaku |
|---|---|
| 1280 px ke atas | sidebar 15rem, konten fleksibel, rail `clamp(288px, 22vw, 336px)` |
| 1024–1279 px | sidebar menyusut ke rel ikon `--layout-rail-width`, rail tetap |
| di bawah 1024 px | satu kolom. Sidebar lewat menu seluler yang sudah ada. Panel rail pindah ke bawah konten, urutannya sama. |

**Sidebar.** Latar `--surface`, border kanan 1px. Nama aplikasi "SIAJAR" 16/600 dengan "Sistem Akademik" 12 `--ink-2`, tanpa kotak logo hitam atau logo 3D. Judul grup 12/600 `--ink-2` huruf biasa, jarak atas 20. Item 40 tinggi, radius 6, ikon 18, label 14/500. Hover `--surface-2`. Aktif: latar `--primary-soft`, teks `--primary`, garis kiri 3px. Lencana jumlah: pil 18 px, hijau bertuliskan putih, merah bila mendesak. Blok akun di dasar: avatar bulat 32 berinisial, nama 14/600, peran 12 `--ink-2`.

**Topbar.** Tinggi 56 (`--layout-header-height` di tema botol). Latar `--surface`, border bawah 1px. Pencarian 40 tinggi, lebar maksimum 560, latar `--surface-2`, petunjuk `⌘K` kecil. Kanan: chip tahun ajaran (netral), pemilih peran, lonceng notifikasi dengan titik merah kecil. Fungsi pencarian dan pintasan tidak berubah.

**Tombol Tanya AI.** Tetap melayang (fungsi tidak berubah), tetapi di tema botol berupa tombol hijau 40 px di pojok kanan bawah dengan jarak 16 px, dan konten serta rail diberi `padding-bottom: 72px` supaya tidak ada yang tertutup.

**Konten.** Padding 24 (16 di bawah 1024). Pola kepala halaman: judul 24/600, satu kalimat keterangan 14 `--ink-2`, aksi di kanan. Tanpa label kecil di atas judul seperti "PORTAL MAHASISWA".

**Rail kanan.** Satu kolom panel bertumpuk, jarak 12, padding 16, menggulir sendiri di bawah topbar. Slot sama untuk semua peran:

| Peran | Slot 1 (identitas) | Slot 2 (hari ini) | Slot 3 (ringkasan) |
|---|---|---|---|
| Mahasiswa | nama, NIM, prodi, semester | jadwal dan tenggat hari ini | kehadiran, IPK, streak |
| Asisten dosen | nama, kelas yang dibantu | praktikum hari ini | koreksi menunggu, pantauan ujian |
| Dosen | nama, jumlah kelas | kelas hari ini, presensi dibuka | antrean koreksi, berkas belum final |
| Koordinator | nama, prodi | persetujuan nilai menunggu | risiko mahasiswa, ringkasan laporan |
| Staf akademik | nama, unit | permintaan masuk | jadwal bentrok, pengumuman |
| System admin / Super admin | nama, peran | kesehatan sistem | audit terbaru, pengguna aktif |

Isi slot hanya memakai data yang sudah diambil panel sekarang. Bila sebuah modul belum punya sumber data, tampilkan keadaan kosong satu kalimat, jangan membuat data tiruan.

---

## 6. Fase kerja

Tiap fase: kerjakan langkah, jalankan pemeriksaan (bagian 7), commit, tulis ringkasan di `docs/PROGRESS.md`. Bila pemeriksaan gagal, perbaiki sampai hijau sebelum lanjut.

### Fase 0 — Pengaman dan baseline

Tidak ada perubahan tampilan.

1. Pastikan `git status` bersih. Buat tag `pra-redesain-botol` pada HEAD saat ini, dan branch `redesain/hijau-botol` dari titik itu. Bila diizinkan, dorong tag ke remote. Jangan mendorong apa pun ke `main`.
2. Audit singkat, tulis ke `docs/REDESAIN/AUDIT_UI.md` (maksimal dua halaman): berkas shell (`portal-shell.tsx`, `portal-nav.tsx`, `mobile-menu.tsx`, `src/components/shared/topbar.tsx`), kelima `*-right-panel.tsx` dan `right-panel-switcher.tsx` di `src/components/home`, komponen `src/components/ui`, jumlah pemakaian `shadow-retro*`, `border-retro*`, `RetroWindow`, `border-black`/`bg-black`/`text-black`, kelas warna terlarang (bagian 3), dan blok `.font-*` serta `.text-sm` di `globals.css` baris sekitar 880–905.
3. Bangun baseline screenshot dengan Playwright (`tests/visual/tema.spec.ts`), memakai `toHaveScreenshot` bawaan, bukan paket baru. Untuk tiap peran ambil halaman beranda, Kelas Saya (atau padanannya), Ujian, dan Pengaturan pada 1366×768 dan 390×844. Login memakai mekanisme yang sudah dipakai middleware (`demo_session` dan `active_role`, lihat `src/middleware.ts` dan `tests/e2e/responsive.spec.ts`). Bekukan waktu dengan `page.clock` dan gunakan data seed supaya hasilnya stabil. Tutup bagian dinamis dengan `mask`. Simpan di `tests/visual/__snapshots__/`.
4. Jalankan `npm run cek` dan catat kegagalan yang sudah ada sebelumnya di `docs/REDESAIN/AUDIT_UI.md`, supaya tidak dianggap berasal dari redesain.

**Selesai bila:** tag dan branch ada, baseline screenshot tersimpan dan lolos dua kali berturut-turut, audit tertulis.

### Fase 1 — Mekanisme tema (tampilan tetap sama)

1. `src/lib/ui/theme.ts`: konstanta `UI_THEMES = ['retro', 'botol']`, nama cookie `siajar-tema`, fungsi murni `parseUiTheme(nilai)` yang menolak nilai lain, dan pembaca default dari env `UI_THEME_DEFAULT` (bawaan `retro`). Tambahkan unit test.
2. `src/app/layout.tsx`: baca cookie di server (`cookies()` dari Next 14), pasang `data-theme` di `<html>`, dan impor `./tema-botol.css` setelah `./globals.css`. Karena layout root jadi dinamis, jalankan `npm run build` dan pastikan tidak ada halaman penting yang berubah perilaku. Bila ada, pakai pola skrip inline tanpa kedip sebagai gantinya dan catat keputusannya.
3. Route handler `src/app/tema/route.ts` (GET): parameter `set` (`retro` atau `botol`, selain itu 400) dan `kembali` (harus diawali satu `/`, tidak boleh `//`, tidak boleh mengandung `\`, bawaan `/`). Set cookie (`path=/`, `sameSite=lax`, umur satu tahun) lalu redirect. Rute ini tidak termasuk `PORTAL_PREFIXES`, jadi tidak perlu mengubah middleware. Pastikan itu benar dengan membaca middleware.
4. Pengaturan (`src/app/(portal)/settings`): bagian "Tampilan" berisi dua pilihan, "Tampilan lama" dan "Tampilan baru". Tulis lewat link ke `/tema` atau server action kecil dengan validasi Zod, format hasil `{ ok, data }`.
5. File `src/app/tema-botol.css` dibuat kosong dengan komentar kepala yang menjelaskan cara menghapusnya.

**Selesai bila:** default `retro`, screenshot retro sama dengan baseline, `/tema?set=botol` mengubah atribut `data-theme` dan `/tema?set=retro` mengembalikannya, redirect terbuka (`kembali=//contoh.com`) ditolak, tes baru lolos.

### Fase 2 — Token dan tipografi tema botol (CSS saja)

Semua di `src/app/tema-botol.css`. Tidak ada komponen yang disentuh.

1. Pemilih `[data-theme="botol"], [data-theme="botol"].dark` menimpa variabel yang sudah ada:

```css
[data-theme="botol"], [data-theme="botol"].dark {
  --bg: #F6F6F5;            --surface: #FFFFFF;
  --ink: #1D1F1D;          --primary: #1B5E43;
  --primary-dark: #144832;  --primary-soft: #E5EFE9;
  --primary-foreground: #FFFFFF;
  --gray: #5C615D;          --gray-dark: #5C615D;     --gray-soft: #EDEEEC;
  --bg-main: var(--bg);     --bg-surface: var(--surface);
  --bg-surface-raised: #F0F1EF;
  --border-main: #E2E3E0;   --border-strong: #8A8F8B;
  --text-primary: #1D1F1D;  --text-secondary: #5C615D; --text-subtle: #8A8F8B;
  --ring: rgb(27 94 67 / 0.35);
  --status-danger: #B42318; --status-danger-soft: #FDECEA;
  --status-danger-border: #F1B8B2; --status-danger-foreground: #FFFFFF;
  --radius-sm: 4px; --radius-control: 6px; --radius-container: 10px; --radius-lg: 12px;
  --shadow: none; --shadow-sm: none; --shadow-md: none;
  --retro-bg: var(--bg); --retro-surface: var(--surface); --retro-warm: #F0F1EF;
  --retro-border: #E2E3E0; --retro-dither: #EDEEEC;
  --layout-header-height: 3.5rem;
}
```

Cocokkan nama variabel dengan isi `globals.css` dan sesuaikan `--panel` serta `--panel-accent` setelah memeriksa pemakaiannya (audit Fase 0). Tambahkan token baru (`--surface-2`, `--ink-2`, `--ink-3`, `--garis-input`, `--status-warn*`) di blok yang sama.

2. Font: tambahkan Source Sans 3 di `layout.tsx` dengan variabel `--font-source-sans`, lalu tunjuk `--font-sans` dan `--font-heading` ke sana di tema botol. Atur `body` bobot 400 dan petakan `.font-bold`, `.font-extrabold`, `.font-black` seperti bagian 4.2. Baca dulu kelas `.font-*` dan `.text-sm` kustom di `globals.css` agar tidak bentrok.
3. Penetral kelas lama, semuanya berawalan `[data-theme="botol"]`:
   - `.shadow-retro`, `-sm`, `-md`, `-lg`, `-window` menjadi `box-shadow: none`.
   - `.border-black`, `.border-ink` memakai `var(--border-main)`. `.text-black` memakai `var(--text-primary)`. `.bg-black` memakai `var(--ink)`.
   - `.border-2`, `.border-4`, dan varian sisi (`.border-b-2`, `.border-t-2`, `.border-l-2`, `.border-r-2`) menjadi 1px. Elemen yang memang perlu tebal diberi `data-keep-border`.
   - `.uppercase` menjadi `text-transform: none` (kecuali `[data-keep-uppercase]`), dan `.tracking-wide|wider|widest` menjadi `letter-spacing: 0`.
   - `.animate-sky-*`, `.animate-retro-*`, `.animate-uir-*` menjadi `animation: none`. `.bg-retro-dither` dan `.bg-retro-grid` menjadi `background-image: none`.
   - `svg.lucide { stroke-width: 1.75 }`.
   - Elemen dengan `data-ui="dekorasi"` disembunyikan (atribut dipasang di Fase 5).
4. Skrip `scripts/cek-kontras.mjs` dan perintah `npm run cek:kontras` (bagian 7). Perbarui `scripts/cek-hex.js` agar mengizinkan gabungan hex retro dan botol, dengan komentar bahwa daftar retro dihapus saat tema retro dipensiunkan.

**Selesai bila:** dengan `data-theme="botol"` semua halaman terbaca dan tidak ada tata letak yang pecah (periksa lewat Playwright pada tiap peran), tema `retro` identik dengan baseline, `cek:hex` dan `cek:kontras` lolos.

### Fase 3 — Primitif tampilan

Buat atau selaraskan komponen dasar di `src/components/ui` dengan token semantik saja (`--surface`, `--border-main`, `--radius-container`, `--shadow-md`, dan seterusnya). Dengan begitu satu komponen tampil benar di kedua tema. Pakai komponen yang sudah ada (`button`, `input`, `badge`, `card`, `table`, `dialog`) dan jangan membuat versi kedua.

1. `Panel`, `PanelHeader`, `Row`, `Chip`, `Metric`, `Tabs` baru sesuai bagian 4.4. Beri atribut `data-ui` ("panel", "row", "chip", "metric") sebagai kait CSS.
2. `RetroWindow` tidak ditulis ulang. Tambahkan hanya atribut `data-ui="window"`, `data-ui="window-header"`, dan `data-ui="traffic-lights"` pada elemen yang sudah ada. Di `tema-botol.css`, timpa dengan `[data-theme="botol"] [data-ui="window"]` (border 1px, radius 10, tanpa bayangan), sembunyikan lampu jendela, dan ubah header menjadi header panel. Karena `RetroWindow` dipakai di 77 file, cara ini mengubah semuanya tanpa menyentuh pemakainya.
3. `button`, `input`, `badge`, `table`, `dialog` disesuaikan lewat kelas berbasis token agar sesuai bagian 4.4. Perilaku dan props tidak berubah.
4. Halaman kecil `docs/REDESAIN/KATALOG.md` berisi tangkapan layar tiap varian komponen di tema botol (dibuat lewat Playwright pada halaman uji internal yang tidak ditautkan dari menu).

**Selesai bila:** komponen terdokumentasi di katalog, retro tetap identik dengan baseline.

### Fase 4 — Shell

Berkas: `src/app/(portal)/portal-shell.tsx`, `portal-nav.tsx`, `mobile-menu.tsx`, `src/components/shared/topbar.tsx`, `src/components/shared/ai-academic-assistant.tsx`, kelas `.sidebar-compact-user-card` di `globals.css`.

1. Terapkan bagian 5 untuk sidebar, topbar, dan menu seluler. DOM dipertahankan. Perbedaan tampilan lewat `data-ui` dan CSS tema botol (misalnya `data-ui="nav-item"`, `data-active="true"`).
2. Sembunyikan tombol gelap/terang di tema botol dengan atribut `data-ui="toggle-gelap"`, jangan menghapus logikanya.
3. Tombol Tanya AI dan padding bawah konten sesuai bagian 5.
4. Logo: pakai aset logo datar yang sudah ada. Komponen `uir-logo-3d.tsx` diberi `data-ui="dekorasi"`.

**Selesai bila:** keyboard bisa menjangkau semua menu, menu aktif jelas tanpa mengandalkan warna saja (garis kiri dan bobot teks), tidak ada gulir horizontal pada 360 px, tidak ada elemen yang tertutup tombol Tanya AI.

### Fase 5 — Rail kanan seragam

Berkas: `src/components/home/{admin,coordinator,lecturer,staff,ta}-right-panel.tsx`, `right-panel-switcher.tsx`, `student-academic-status-card.tsx`, dan kartu identitas di `src/components/retro/*-identity-card.tsx`.

1. Buat `src/components/rail/` berisi `Rail` (kolom), `RailPanel` (pembungkus panel dengan slot judul dan aksi), `RailList`, dan `RailStat` (baris label kiri, nilai kanan). Gunakan `Panel` dan `Row` dari Fase 3.
2. Susun ulang tiap panel peran memakai komponen itu dengan slot di bagian 5. Props, nama ekspor, pengambilan data, dan logika tidak berubah. Tujuannya mengurangi duplikasi tanpa mengubah perilaku. Bila sebuah berkas terlalu rumit untuk diubah dengan aman, pertahankan dan bungkus keluarannya.
3. Kartu identitas berukuran besar (avatar Rust, logo 3D, ilustrasi Mac, `sky-*`) diberi `data-ui="dekorasi"` agar hilang di tema botol. Avatar mahasiswa tetap ada sebagai gambar 56 px di slot identitas.
4. Tab "Hari ini" dan "Detail kelas" memakai komponen `Tabs` bergaris bawah.

**Selesai bila:** keenam rail punya struktur slot yang sama, tidak ada kartu di dalam kartu, tidak ada data tiruan, dan screenshot retro identik dengan baseline.

### Fase 6 — Beranda ketujuh peran

Berkas: halaman beranda tiap peran di `src/app/(portal)/**` serta `action-banner.tsx`, `active-classes-grid.tsx`, `daily-priority-card.tsx`, `nearest-deadlines.tsx`, `today-schedule.tsx`.

**Mahasiswa**

- Kepala halaman sesuai bagian 5. Filter "Semua, Kelas Saya, Tugas dan Kuis, Ujian, Presensi, Jadwal, Nilai" menjadi tab bergaris bawah, bukan pil, dengan perilaku sama.
- "Prioritas utama" menjadi item unggulan satu-satunya. "4 lainnya" menjadi tautan teks.
- "Jadwal hari ini": satu panel berisi baris. Kolom kiri berisi jam (tabular), tengah berisi chip status, judul, ruang, dan dosen, kanan berisi tombol. "Absen" memakai tombol utama hijau, bukan merah.
- "Tenggat terdekat": satu panel berisi baris. Mata kuliah 13 `--ink-2`, judul 14/600, sisa waktu sebagai chip (mendesak bila kurang dari 3 jam), aksi sebagai tombol sekunder. Item yang sudah tampil sebagai unggulan tidak diulang di daftar ini (penyaringan di sisi tampilan saja).

**Peran lain**

- Kepala halaman, lalu satu panel metrik (sel berpemisah), lalu panel antrean atau daftar utama peran itu. Keadaan kosong cukup satu kalimat dengan ikon centang kecil, tanpa kotak garis putus-putus.
- Pakai data dan komponen daftar yang sudah ada. Jangan membuat kartu baru per statistik.

**Selesai bila:** ketujuh beranda memakai pola yang sama, tidak ada informasi yang muncul dua kali dalam satu layar, dan screenshot 1366×768 serta 390×844 tiap peran sudah diambil di `docs/REDESAIN/sesudah/`.

### Fase 7 — Halaman umum dan sisa dekorasi

1. Terapkan primitif Fase 3 ke pola yang berulang: daftar kelas, detail kelas dan tab-nya, ujian (CBT, bank soal), presensi, tugas, nilai, pesan, kalender, notifikasi, pengaturan. Bila pola sudah lewat `RetroWindow` atau komponen `ui`, cukup lewat CSS Fase 2 dan 3. Sentuh komponen hanya bila CSS tidak cukup.
2. Hilangkan dekorasi yang tersisa di tema botol (pola titik, ilustrasi pengisi, lampu jendela) lewat `data-ui="dekorasi"`.
3. Warna terlarang: jalankan `scripts/cek-warna-terlarang.mjs` (bagian 7). Saat ini ada sekitar 8 berkas dengan kelas warna keluarga biru, ungu, atau sejenisnya. Ganti sesuai token, dan bila warna itu bermakna (misalnya grafik), pakai hijau, abu, merah, atau kuning dari palet bagian 4.1 dengan pembeda bentuk atau label. Setelah bersih, ubah skrip menjadi gagal (exit 1) bila ada pelanggaran dan tambahkan ke `npm run cek`.
4. Grafik (bila ada): satu warna aksen hijau, abu untuk pembanding, label langsung di grafik, tanpa gradien isi.

**Selesai bila:** tidak ada halaman yang tampak "campuran" (setengah retro, setengah baru) di tema botol, dan skrip warna terlarang bersih.

### Fase 8 — Teks dan judul (commit terpisah)

Satu commit atau lebih dengan awalan `copy(teks-ui)`. Perubahan ini berlaku di kedua tema, jadi dipisah supaya bisa dibatalkan sendiri dengan `git revert`.

1. Ganti judul gaya nama berkas (`*.app`, `*.list`, `ui_window.app`, dan sejenisnya) dengan judul biasa.
2. Ganti kata terlarang di judul dan menu: "Dashboard Pengajar" menjadi "Beranda", label "Portal Mahasiswa" dihapus, "Categories" menjadi "Filter". Nama menu hanya diubah lewat `menu-config.ts` bila itu satu-satunya sumber, dan hanya pada teks label, bukan kunci atau rute.
3. Sapaan: mahasiswa "kamu", peran lain "Anda". Waktu mengikuti helper format yang sudah ada.
4. Contoh: "Pantau perkuliahan aktif, jadwal kuliah hari ini, tenggat tugas, dan ujian Anda." menjadi "Jadwal, tenggat, dan ujianmu hari ini."

**Selesai bila:** pencarian `\.app\b`, `\.list\b`, dan daftar kata terlarang pada teks tampilan tidak menemukan sisa, dan tes yang memeriksa teks (bila ada) sudah disesuaikan.

### Fase 9 — Verifikasi dan serah terima

1. Jalankan seluruh pemeriksaan bagian 7.
2. Ambil screenshot akhir tema botol untuk tiap peran (1366×768, 1024×768, 390×844) di `docs/REDESAIN/sesudah/`.
3. Uji manual lewat keyboard: Tab melalui sidebar, topbar, rail, dan satu dialog. Fokus selalu terlihat, tidak ada jebakan fokus.
4. Pastikan tidak ada gulir horizontal pada 360 px di halaman beranda, daftar kelas, dan satu tabel lebar.
5. Pastikan default tetap `retro`. Jangan mengubahnya.
6. Tulis `docs/REDESAIN/PANDUAN_ROLLBACK.md` yang berisi perintah di bagian 9 dengan nama tag dan branch yang sebenarnya.
7. Tulis laporan akhir (bagian 10).

**Selesai bila:** semua butir bagian 8 terpenuhi.

---

## 7. Pemeriksaan otomatis yang harus ada

| Perintah | Isi | Gagal bila |
|---|---|---|
| `npm run cek:hex` | `scripts/cek-hex.js` diperbarui | ada hex di luar gabungan palet retro dan botol |
| `npm run cek:kontras` | `scripts/cek-kontras.mjs`, murni Node, tanpa paket | pasangan teks di bawah 4.5:1 atau pasangan kontrol di bawah 3:1 |
| `npm run cek:warna` | `scripts/cek-warna-terlarang.mjs` | kelas `(blue\|indigo\|violet\|purple\|sky\|cyan\|fuchsia\|pink)-\d` ditemukan di `src` (Fase 7) |
| `npx playwright test tests/visual` | perbandingan screenshot tema retro | selisih piksel melebihi toleransi 0,1% |

Pasangan yang diperiksa `cek:kontras`:

- `--ink` pada `--surface` dan `--bg`
- `--ink-2` pada `--surface`, `--bg`, dan `--surface-2`
- `#FFFFFF` pada `--primary` dan `--primary-dark`
- `--primary` pada `--primary-soft`
- `--status-danger` pada `--status-danger-soft` dan `--surface`
- `--status-warn-text` pada `--status-warn-soft`
- Kontrol (3:1): `--garis-input` pada `--surface`, dan `--primary` pada `--surface` untuk cincin fokus

`cek:kontras` dan `cek:warna` ditambahkan ke skrip `cek` di `package.json`. Tiap fase juga menjalankan `typecheck`, `lint`, `test`, dan `build`.

---

## 8. Daftar "Selesai bila" akhir

- [ ] Tag `pra-redesain-botol` dan branch `redesain/hijau-botol` ada, `main` tidak tersentuh.
- [ ] Default tema tetap `retro`. Tema retro identik dengan baseline.
- [ ] `/tema?set=botol` dan `/tema?set=retro` berfungsi, dan pilihan "Tampilan" di Pengaturan berfungsi.
- [ ] Menghapus impor `tema-botol.css` mengembalikan tampilan lama sepenuhnya.
- [ ] Tidak ada berkas, komponen, atau kelas retro yang dihapus.
- [ ] Ketujuh peran punya beranda dengan rail kanan berstruktur sama di tema botol.
- [ ] Tidak ada gradien, efek kaca, bayangan keras, warna biru atau ungu, label kapital berjarak lebar, atau kartu bersarang di tema botol.
- [ ] Semua teks status didampingi ikon atau teks, bukan hanya warna.
- [ ] `cek:hex`, `cek:kontras`, `cek:warna`, `typecheck`, `lint`, `test`, `build`, dan tes visual lolos.
- [ ] Tidak ada dependensi npm baru. Tidak ada perubahan di `src/modules`, `supabase`, `prisma`.
- [ ] `docs/PROGRESS.md`, `docs/KEPUTUSAN.md`, `docs/IDE_LANJUTAN.md`, dan `docs/REDESAIN/PANDUAN_ROLLBACK.md` terisi.

---

## 9. Panduan rollback untuk pemilik

**Mencoba tampilan baru**

```
Buka  /tema?set=botol        (kembali dengan  /tema?set=retro)
atau  Pengaturan → Tampilan
```

**A. Tidak cocok, kembali cepat (tanpa kode)**

```
Buka /tema?set=retro
atau set env UI_THEME_DEFAULT=retro dan deploy ulang
```

**B. Batalkan satu fase atau hanya perubahan teks**

```
git log --oneline --grep="tampilan"        # lihat commit tiap fase
git log --oneline --grep="teks-ui"         # commit judul dan teks
git revert <hash-commit>                   # batalkan satu commit, riwayat tetap utuh
```

**C. Batalkan seluruh redesain**

```
# Belum digabung ke main: cukup tinggalkan branch.
git switch main

# Sudah digabung ke main dengan merge commit:
git revert -m 1 <hash-merge-commit>

# Kembali ke titik awal pada branch kerja (hapus semua perubahan di branch itu):
git switch redesain/hijau-botol
git reset --hard pra-redesain-botol
```

`git reset --hard` menghapus commit di branch yang dipakai. Jangan jalankan di `main` yang sudah dibagikan.

**D. Deploy**

Di dashboard Vercel, buka deployment sebelumnya dan pilih Promote to Production (Instant Rollback).

---

## 10. Laporan akhir

Tulis di `docs/REDESAIN/LAPORAN.md`, maksimal dua halaman:

1. Daftar fase dan commit-nya (hash dan judul).
2. Berkas yang diubah per fase, dan jumlah pemakaian `RetroWindow`, `shadow-retro*`, dan `border-black` yang ditangani lewat CSS dibanding lewat edit komponen.
3. Hal yang sengaja tidak dikerjakan dan alasannya, termasuk mode gelap untuk tema botol dan penghapusan kode retro.
4. Keputusan di `docs/KEPUTUSAN.md` bertanda [Redesain].
5. Temuan di luar cakupan (di `docs/IDE_LANJUTAN.md`), misalnya komponen yang tidak bisa diseragamkan tanpa mengubah logika.
6. Cara mencoba tampilan baru dan cara kembali (salin dari bagian 9).
