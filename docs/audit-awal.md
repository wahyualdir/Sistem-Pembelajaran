# Audit Awal Repositori & Baseline Teknis SIAKAD UIR
Tanggal: 29 September 2026  
Cabang: `feat/redesain-dan-ai-agent`  
Penyusun: Senior Full-Stack Engineer + Product Designer

---

## 1. Pemetaan Struktur Repositori & Stack Teknologi

### 1.1 Identitas Framework & Dependensi Kunci
Berdasarkan pemeriksaan langsung pada `package.json`, `next.config.mjs`, dan lingkungan runtime:
- **Framework Web**: Next.js 14.2.13 (App Router)
- **Runtime UI**: React 18.3.1, React DOM 18.3.1
- **Bahasa**: TypeScript 5.6.2 (Strict mode aktif)
- **Styling**: Tailwind CSS 3.4.13, PostCSS 8.4.47, `tailwindcss-animate` 1.0.7
- **Komponen Primitif**: Radix UI Primitives (Avatar, Checkbox, Dialog, Dropdown Menu, Label, Select, Tabs, Tooltip)
- **Ikonografi**: Lucide React 0.446.0
- **Database & ORM**: Prisma ORM 5.20.0 (Client & CLI), PostgreSQL (Supabase)
- **Autentikasi**: `@supabase/ssr` 0.5.1, `@supabase/supabase-js` 2.45.4, `bcryptjs` 2.4.3
- **Olah Data & Dokumen**: `@tanstack/react-table` 8.20.5, `recharts` 2.12.7, `@react-pdf/renderer` 3.4.4, `papaparse` 5.4.1, `exceljs` 4.4.0
- **Pengujian**: Vitest 2.1.1

### 1.2 Struktur Rute per Peran
Aplikasi menggunakan pola route grouping Next.js App Router:
- **`(auth)`**:
  - `/login`: Halaman gerbang autentikasi tunggal dengan dua kolom antarmuka (Mahasiswa via simulasi Google Email dan Dosen/Admin via kredensial email & password).
- **`(dashboard)/admin`** (11 halaman):
  - `/admin/dashboard`: Ringkasan analitik, grafik sebaran prodi & IPK.
  - `/admin/master`: Manajemen data mahasiswa, dosen, dan tahun ajaran.
  - `/admin/kurikulum`: Daftar program studi dan struktur kurikulum mata kuliah.
  - `/admin/jadwal`: Plotting jadwal kuliah, alokasi kelas dan ruang.
  - `/admin/ukt`: Validasi dan persetujuan status tagihan UKT/dispensasi.
  - `/admin/ujian`: Penjadwalan UTS & UAS per semester.
  - `/admin/nilai`: Koreksi nilai resmi terkunci dengan kewajiban audit trail.
  - `/admin/pengumuman`: Manajemen siaran pengumuman akademik bertarget.
  - `/admin/kalender`: Pengaturan rentang tanggal kegiatan akademik.
  - `/admin/surat`: Verifikasi dan penerbitan permohonan surat keterangan.
  - `/admin/audit`: Peninjauan log audit aktivitas sensitif.
- **`(dashboard)/dosen`** (7 halaman):
  - `/dosen/dashboard`: Statistik beban mengajar dan pintasan aksi perwalian.
  - `/dosen/kelas`: Daftar kelas perkuliahan yang diampu.
  - `/dosen/presensi`: Rekapitulasi dan input presensi pertemuan 1–16.
  - `/dosen/nilai`: Lembar penilaian komponen tugas/UTS/UAS dan finalisasi nilai.
  - `/dosen/materi-tugas`: Distribusi modul perkuliahan dan evaluasi tugas.
  - `/dosen/perwalian`: Konsultasi bimbingan dan persetujuan KRS mahasiswa.
  - `/dosen/laporan`: Pantauan capaian mutu mahasiswa khusus Kaprodi.
- **`(dashboard)/mahasiswa`** (11 halaman):
  - `/mahasiswa/dashboard`: Informasi capaian akademik, jadwal hari ini, checklist.
  - `/mahasiswa/krs`: Pengambilan rencana studi online dan batas kuota SKS.
  - `/mahasiswa/jadwal`: Kalender jadwal perkuliahan mingguan.
  - `/mahasiswa/presensi`: Rekap kehadiran mandiri dan deteksi ambang batas 75%.
  - `/mahasiswa/nilai`: Lembar KHS per semester dan transkrip akademik kumulatif.
  - `/mahasiswa/ujian`: Kartu ujian resmi (UTS/UAS) dengan validasi 3 syarat.
  - `/mahasiswa/tugas`: Daftar penugasan aktif dan portal pengumpulan berkas.
  - `/mahasiswa/bimbingan`: Riwayat catatan konsultasi dosen pembimbing akademik.
  - `/mahasiswa/ukt`: Informasi nominal tagihan semester dan unggah bukti transfer.
  - `/mahasiswa/surat`: Formulir pengajuan surat aktif kuliah/cuti/beasiswa.
  - `/mahasiswa/pengumuman`: Papan informasi pengumuman kampus.
- **`api`** (Route Handlers):
  - `/api/auth/callback`: Handler otorisasi OAuth.
  - `/api/auth/logout`: Pembersihan cookie sesi.
  - `/api/export/laporan-akademik`: Ekspor spreadsheet XLSX berkas laporan kampus.
  - `/api/pdf/kartu-ujian`: Streaming PDF kartu peserta ujian.
  - `/api/pdf/khs`: Streaming PDF Kartu Hasil Studi ber-kop resmi.
  - `/api/pdf/surat`: Streaming PDF Surat Keterangan resmi bertanda tangan.
  - `/api/pdf/transkrip`: Streaming PDF Transkrip Nilai lengkap.

### 1.3 Modul Aturan Bisnis Akademik (`src/lib/akademik`)
Modul logika bisnis telah diisolasi sebagai fungsi murni:
1. `administrasi.ts`:
   - Generator format nomor surat otomatis (`001/FT-UIR/SK-AKTIF/2026`).
   - Format penomoran dokumen transkrip dan kartu ujian.
2. `aturan-sks.ts`:
   - `hitungBatasSKS(ips)`: Aturan batas beban SKS berdasarkan IPS semester lalu:
     - IPS $\ge 3.00 \rightarrow 24$ SKS
     - $2.50 \le \text{IPS} < 3.00 \rightarrow 21$ SKS
     - $2.00 \le \text{IPS} < 2.50 \rightarrow 18$ SKS
     - IPS $< 2.00 \rightarrow 15$ SKS
   - `validasiBebanSKS(totalSks, batasMaksimal)`: Memeriksa agar tidak melebihi batas.
3. `bentrok.ts`:
   - `cekBentrokJadwal(jadwalBaru, daftarJadwalLama)`: Mendeteksi tumpang tindih waktu (irisan interval menit) pada hari yang sama untuk ruang, dosen, maupun mahasiswa.
4. `nilai.ts`:
   - `konversiAngkaKeMutu(nilaiAngka)`: Skala rentang $A$ ($85-100, 4.0$), $A-$ ($80-84, 3.75$), $B+$ ($75-79, 3.5$), $B$ ($70-74, 3.0$), $B-$ ($65-69, 2.75$), $C+$ ($60-64, 2.5$), $C$ ($55-59, 2.0$), $D$ ($40-54, 1.0$), $E$ ($0-39, 0.0$).
   - `hitungIPS(daftarNilaiSemester)`: Rata-rata tertimbang bobot nilai per SKS semester berjalan.
   - `hitungIPK(daftarSemuaNilai)`: Rata-rata tertimbang seluruh semester dengan seleksi nilai terbaik untuk mata kuliah yang diambil ulang.
5. `prasyarat.ts`:
   - `cekKelayakanPrasyarat(mataKuliahId, riwayatNilai)`: Memverifikasi kelulusan mata kuliah prasyarat dengan nilai minimal yang ditentukan (default 'D').
6. `syarat-ujian.ts`:
   - `evaluasiSyaratUjian(krsStatus, uktStatus, persentaseKehadiran)`: Validasi gerbang pencetakan kartu ujian (KRS `DISETUJUI`, UKT `LUNAS` / `DISPENSASI`, Kehadiran $\ge 75\%$).

### 1.4 Alur Autentikasi Saat Ini
1. **Middleware (`src/middleware.ts`)**:
   - Membaca cookie HTTP `siakad_session`.
   - Mengurai objek sesi JSON ter-encode base64 (`userId`, `email`, `role`, `name`, `subId`).
   - Melindungi rute private: mengarahkan pengguna belum login ke `/login` dan memblokir akses rute lintas peran (misal mahasiswa mencoba mengakses `/admin/*` atau `/dosen/*`).
2. **Kondisi Autentikasi Mahasiswa (Audit Fakta)**:
   - Di `src/app/(auth)/login/page.tsx`, kolom masuk mahasiswa berupa input email biasa `<Input type="email">`.
   - Tombol kirim mengeksekusi Server Action `loginStudentGoogle` di `src/lib/auth/actions.ts`.
   - Server Action hanya memverifikasi domain email institusi berakhiran `@student.uir.ac.id` (`src/lib/auth/validasi-email.ts`), mencari rekaman mahasiswa yang cocok di Prisma atau `SEED_MAHASISWA`, lalu langsung menerbitkan cookie sesi tanpa alur redirect/dialog Google OAuth sesungguhnya.
3. **Kredensial Staf & Dosen**:
   - Dosen dan Admin memasukkan email dan password.
   - Diverifikasi menggunakan `bcrypt.compare` terhadap `passwordHash` di tabel `Pengguna`.
   - Ditemukan celah fallback: `if (!isPasswordValid && password === "password123") { isPasswordValid = true; }` pada baris 76 `src/lib/auth/actions.ts`.
4. **Tombol Shortcut Demo**:
   - Ditemukan tombol pintas instan pada halaman login (`src/app/(auth)/login/page.tsx` baris 160–176 dan 232–251) yang merender akun demo:
     - Mahasiswa: Wahyu Aldi & Salsabila.
     - Penguji: Admin Akademik & Dr. Ardiansyah dengan kata sandi tertulis `"password123"`.

### 1.5 Variabel Lingkungan (`.env.example`)
Variabel lingkungan yang dikonfigurasi pada proyek:
- `DATABASE_URL`: Connection string PostgreSQL (mode pooling / transaction pgbouncer).
- `DIRECT_URL`: Connection string PostgreSQL langsung untuk eksekusi migrasi skema Prisma.
- `NEXT_PUBLIC_SUPABASE_URL`: Endpoint REST API Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci akses publik anonim Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Kunci administratif server-side Supabase.
- `ALLOWED_EMAIL_DOMAIN`: Restriksi domain email mahasiswa (`student.uir.ac.id`).
- `NEXT_PUBLIC_APP_URL`: Base URL callback aplikasi (`http://localhost:3000`).

---

## 2. Baseline Verifikasi Kode (Awal Fase 0)

| Uji | Perintah | Status | Catatan / Hasil |
|---|---|---|---|
| **Unit Test** | `npm test` | **PASS** | 7 file test, 55 pengujian lulus (30.48s). |
| **Typecheck** | `npm run typecheck` | **PASS** | `tsc --noEmit` bersih, 0 galat tipe. |
| **Lint** | `npm run lint` | **PASS** | `next lint` bersih tanpa peringatan atau galat. |
| **Production Build** | `npm run build` | **PASS** | Berhasil memproses Prisma Client dan Next.js production bundle (41 halaman statis & dinamis). Catatan: EPERM dapat terjadi jika `next dev` mengunci binary engine Windows. |

---

## 3. Pembuktian Bug Utama

### 3.1 Bug Token Teks (`text-text-primary` & `text-text-secondary`)
- **Pemeriksaan Bundle CSS**:
  - Perintah: `Get-ChildItem .next\static\css\*.css | Select-String "text-text-primary|text-text-secondary"`
  - Hasil: **0 baris / aturan CSS ditemukan**. Kelas ini tidak dikenali oleh Tailwind karena `tailwind.config.ts` mendefinisikan warna teks sebagai `foreground` dan `muted.foreground`, bukan `text.primary` atau `text.secondary`.
- **Dampak Visual**: Semua teks dengan kelas ini mewarisi warna default induk tanpa pengaturan warna eksplisit, merusak hierarki tipografi.
- **Frekuensi Pemakaian**:
  - `text-text-primary`: **230 pemunculan**
  - `text-text-secondary`: **394 pemunculan**
  - **Total**: **624 pemunculan** pada berkas komponen dan halaman.

### 3.2 Warna Hex Hardcoded
- **Pemeriksaan**: `Select-String -Pattern "#[0-9a-fA-F]{3,8}\b"` di seluruh direktori `src/` (di luar file konfigurasi token dan `globals.css`).
- **Hasil**: Ditemukan **259 pemunculan** nilai hex hardcoded langsung di atribut JSX / kelas utilitas (contoh: `#F6F7F9`, `#FDE8E7`, `#F9BFBC`, `#C5E8D2`, `#E7F6EC`, `#FEF3E6`, `#FCD9B1`, `#101828`, `#667085`, `#2A4DB7`, `#157F4B`, `#C0362C`).
- **Dampak**: Merusak konsistensi desain sistem dan mencegah fungsionalitas dark mode bekerja secara proporsional.

---

## 4. Peta Penyimpanan Data In-Memory (State Stores)

Seluruh modul fitur saat ini mengandalkan state store in-memory (Zustand / local variable state) dengan data seed statis, yang harus dimigrasikan ke PostgreSQL/Prisma pada Fase 4:

| No | Berkas Store | Entitas Utama yang Dikelola | Fungsi & Mutasi Kritis |
|---|---|---|---|
| 1 | `src/features/krs/krs-store.ts` | `KRS`, `KRSItem`, `PaketSemester` | `ambilKRSMahasiswa`, `tambahMataKuliahKRS`, `hapusMataKuliahKRS`, `ajukanKRS`, `setujuiKRSWali`, `tolakKRSWali` |
| 2 | `src/features/nilai/nilai-store.ts` | `KomponenNilai`, `NilaiMahasiswa`, `KHS`, `Transkrip` | `ambilKHSMahasiswa`, `ambilTranskripMahasiswa`, `simpanNilaiDraf`, `finalisasiNilaiKelas`, `koreksiNilaiAdmin` |
| 3 | `src/features/presensi/presensi-store.ts` | `PertemuanKuliah`, `PresensiMahasiswa` | `ambilPresensiKelas`, `bukaPertemuan`, `catatPresensiPertemuan`, `ambilRekapPresensiMahasiswa` |
| 4 | `src/features/jadwal/jadwal-store.ts` | `JadwalKuliah`, `AlokasiRuang` | `ambilJadwalMingguan`, `tambahJadwalKuliah`, `ubahJadwalKuliah`, `hapusJadwalKuliah` |
| 5 | `src/features/ujian/ujian-store.ts` | `JadwalUjian`, `KartuUjian` | `ambilJadwalUjianSemester`, `buatJadwalUjian`, `ambilKartuUjianMahasiswa` |
| 6 | `src/features/materi-tugas/materi-tugas-store.ts` | `MateriKuliah`, `TugasKuliah`, `PengumpulanTugas` | `unggahMateri`, `buatTugas`, `kumpulTugasMahasiswa`, `nilaiPengumpulanTugas` |
| 7 | `src/features/bimbingan/bimbingan-store.ts` | `SesiBimbinganWali`, `CatatanKonsultasi` | `ajukanBimbingan`, `balasBimbinganDosen`, `selesaikanBimbingan` |
| 8 | `src/features/ukt/ukt-store.ts` | `TagihanUKT`, `BuktiPembayaran`, `Dispensasi` | `ambilTagihanMahasiswa`, `unggahBuktiBayar`, `verifikasiUKTAdmin`, `ajukanDispensasi` |
| 9 | `src/features/surat/surat-store.ts` | `PengajuanSurat`, `ArsipSurat` | `ajukanPermohonanSurat`, `prosesSuratAdmin`, `terbitkanSuratResmi` |
| 10 | `src/features/master/master-store.ts` | `Mahasiswa`, `Dosen`, `MataKuliah`, `Ruang`, `TahunAjaran` | Operasi CRUD master data, impor CSV mahasiswa/dosen, toggle status aktif |
| 11 | `src/features/administrasi/administrasi-store.ts` | `Pengumuman`, `KalenderAkademik`, `LogAudit` | `buatPengumuman`, `tambahKegiatanKalender`, `catatLogAudit`, `ambilLogAudit` |

---

## 5. Ringkasan Temuan & Rekomendasi Aksi Fase 1

1. **Tokenisasi Warna**:
   - Definisikan alias dan variabel CSS lengkap untuk palet permukaan, teks, merek, dan semantik (terang & gelap).
   - Migrasi massal kelas `text-text-primary` $\rightarrow$ `text-foreground` dan `text-text-secondary` $\rightarrow$ `text-muted-foreground` agar konsisten dengan standar shadcn/Tailwind.
   - Sediakan fallback alias `colors.text: { primary, secondary }` pada `tailwind.config.ts` untuk memastikan tidak ada pemanggilan yang menghasilkan nol aturan CSS.
2. **Eliminasi Hex**:
   - Ganti seluruh 259 pemakaian hex hardcoded ke kelas token semantik (`bg-surface`, `bg-muted`, `border-border`, `text-primary`, `bg-primary/10`, `text-danger`, dll.).
   - Tambahkan skrip pengecekan otomatis `npm run cek:hex` untuk mencegah hex baru lolos.
3. **Sidebar & Branding**:
   - Perbaiki inkonsistensi nama produk: seragamkan menjadi **SIAKAD UIR** di sidebar dan topbar.
   - Ganti logo inisial kotak "SK" dengan logo SVG institusi yang representatif.
   - Kelompokkan navigasi sidebar ke dalam 3 kategori logis: **Akademik**, **Layanan**, dan **Informasi**.
   - Tambahkan indikator visual garis vertikal di sisi kiri item navigasi yang aktif.
4. **Komponen `StatusBadge`**:
   - Buat komponen `StatusBadge` terpusat untuk memetakan enum mentah (`DISETUJUI`, `DRAF`, `LUNAS`, `BELUM`, dll.) ke label Bahasa Indonesia yang ramah disertai titik warna semantik.
5. **Tipografi & Dark Mode**:
   - Hilangkan gaya huruf kapital bersela lebar (`uppercase tracking-wider`).
   - Pasang font sekunder yang hangat (Plus Jakarta Sans via `next/font`) untuk judul dan angka besar, serta pastikan `tabular-nums` untuk angka statistik.
   - Sediakan dukungan tema gelap yang kontras dan nyaman dibaca (WCAG AA).
