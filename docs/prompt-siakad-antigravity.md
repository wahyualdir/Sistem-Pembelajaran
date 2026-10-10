# Brief Kerja SIAKAD (Sistem Informasi Akademik)

Dokumen ini adalah ringkasan acuan aturan kerja, batasan teknis, dan alur pengerjaan SIAKAD berbasis web hingga siap deploy ke Vercel.

## 1. Aturan Kerja & Metodologi
- Pengerjaan berurutan dari Fase 1 sampai Fase 8 secara konsisten tanpa menunggu konfirmasi manual di setiap sub-langkah.
- Menuliskan rencana singkat sebelum setiap fase dimulai.
- Pada setiap akhir fase, wajib menjalankan dan meloloskan:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- Melakukan git commit bermakna dengan format `fitur: ...`, `perbaikan: ...`, atau `refaktor: ...`.
- Keputusan arsitektural dan penambahan library di luar stack wajib dicatat di `docs/keputusan.md`.

## 2. Batasan Kritis (Non-Negotiable)
1. **Google OAuth Student**:
   - Hanya menerima email student kampus (`ALLOWED_EMAIL_DOMAIN`).
   - Pencocokan domain persis di sisi server (`lib/auth/validasi-email`).
   - Email harus sudah terdaftar pada tabel Mahasiswa.
   - Tidak ada pembuatan akun otomatis (auto-registration ditolak).
2. **Autentikasi Admin & Dosen**:
   - Menggunakan email dan kata sandi (password).
   - Akun dibuat oleh admin atau seed awal.
3. **Keamanan & Otorisasi**:
   - Seluruh pemeriksaan otorisasi wajib berada di sisi server (Server Actions / Route Handlers / Middleware).
   - Menyembunyikan menu navigasi semata-mata untuk UX, bukan pengamanan.
   - Menerapkan Row Level Security (RLS) di Supabase.
4. **Aturan Bisnis Dinamis**:
   - Aturan batas SKS, skala konversi nilai (A, B, C, D, E), batas minimal kehadiran UAS (default 75%), dan syarat kelulusan prasyarat disimpan dalam tabel `KonfigurasiAkademik` (JSON), bukan hardcoded di kode aplikasi.
5. **Design System & Palet Warna**:
   - Hanya menggunakan token warna resmi:
     - Latar Halaman: `#F6F7F9`
     - Permukaan: `#FFFFFF`
     - Border: `#E4E7EC`
     - Teks Utama: `#101828`
     - Teks Sekunder: `#667085`
     - Biru Utama: `#2A4DB7` (Hover: `#233F96`)
     - Biru Tint: `#EEF2FC`
     - Sukses: `#157F4B`
     - Peringatan: `#B45309`
     - Bahaya: `#C0362C`
   - Tanpa gradien, tanpa bayangan tebal di luar sistem.
   - Border radius ketat: `8px` untuk kontrol (tombol, input) dan `12px` untuk kontainer (kartu, dialog).
   - Font tunggal: Inter. Skala ukuran: 12, 14, 16, 20, 24, 30 px.
6. **Kebersihan Kode**:
   - Bebas dari tipe `any`, `console.log` tertinggal, kode komentar mati, atau `TODO`.
   - Responsif tuntas hingga lebar minimum 360 px.

## 3. Rencana Fase Pengerjaan
- **Fase 1: Fondasi**: Setup Next.js App Router, Tailwind CSS + design tokens, shell layout (sidebar, topbar, mobile drawer), UI primitives, skema Prisma, seed, `.env.example`.
- **Fase 2: Autentikasi dan Peran**: Supabase Auth (Google OAuth student + email/password), middleware proteksi rute, dashboard shell per peran, test validasi domain email.
- **Fase 3: Data Master & Kurikulum**: CRUD mahasiswa, dosen, prodi, matakuliah, kelas, ruang, tahun ajaran, kurikulum, prasyarat (anti-siklus), impor CSV.
- **Fase 4: Jadwal & KRS**: Penyusunan jadwal dengan deteksi bentrok, KRS mahasiswa dengan validasi realtime (SKS, prasyarat, bentrok, kuota), persetujuan dosen wali, penguncian UKT.
- **Fase 5: Nilai & Dokumen**: Pengaturan komponen nilai (bobot 100%), input & draf, finalisasi nilai terkunci, kalkulasi IPS & IPK murni, cetak PDF KHS & transkrip resmi.
- **Fase 6: Proses Perkuliahan**: Pertemuan & presensi (syarat UAS 75%), bimbingan wali, materi & tugas, jadwal & cetak kartu ujian.
- **Fase 7: Administrasi**: Pengumuman berpenanda baca, kalender akademik pengontrol sistem, pengajuan surat + PDF nomor otomatis.
- **Fase 8: Dashboard & Penyelesaian**: Visualisasi dashboard 3 peran, ekspor Excel/PDF laporan, audit responsif 360px & aksesibilitas WCAG AA, dokumentasi `README.md`.
