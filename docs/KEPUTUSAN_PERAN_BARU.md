# Log Keputusan Arsitektur dan Teknis — Penambahan Peran Baru SIAJAR

Dokumen ini mencatat keputusan arsitektural dan teknis yang diambil selama implementasi `docs/INSTRUKSI_PERAN_BARU.md`.

---

## Keputusan Awal & Konfigurasi Dasar

1. **Struktur Identitas**:
   - Dosen Wali **bukan peran** (bukan baris baru di tabel `roles`), melainkan relasi penugasan dosen terhadap mahasiswa (`academic_advisories`).
   - Peran baru yang diimplementasikan: `PROGRAM_SECRETARY` (Sekretaris Prodi) dan `LAB_HEAD` (Kepala Laboratorium).
   - *Catatan Penting*: Peran `DEAN` (Dekan) telah **dibatalkan dan dihapus secara permanen** dari sistem sesuai instruksi eksplisit pengguna.
2. **Pengelolaan Asisten Lab**:
   - Hak penugasan asisten lab diserahkan ke Dosen Pengampu dan Kepala Lab (`LAB_HEAD`).
3. **Penyelarasan Koordinator Prodi**:
   - Peran `PROGRAM_COORDINATOR` dipertahankan sebagai pemegang wewenang persetujuan akhir perubahan nilai dan log audit tingkat prodi.
4. **Pendaftaran Kode & UUID Tetap**:
   - Roles baru di `public.roles`:
     - `PROGRAM_SECRETARY`: `10000000-0000-0000-0000-000000000011`
     - `LAB_HEAD`: `10000000-0000-0000-0000-000000000012`
5. **Penetapan Awalan Menu & Rute Portal**:
   - Sekretaris Prodi: awalan ID menu `sek-`, gerbang portal `/secretary`.
   - Kepala Lab: awalan ID menu `lab-`, gerbang portal `/lab`.
6. **Desain Web dan Komponen**:
   - Sesuai Bagian 3.1, tidak ada penambahan token warna hex atau perubahan pada `tailwind.config.ts`.
   - Seluruh tampilan baru memanfaatkan komponen dan kelas token yang sudah ada (`bg-surface`, `text-ink`, `border-border`, dll.).

---

## Keputusan Fase 1: Fondasi Skema, Helper RLS, dan Registrasi Peran

1. **Migrasi Role Permissions Bersyarat**:
   - Pada migrasi `20261027000041`, penautan permission ke `PROGRAM_COORDINATOR` dan `ACADEMIC_STAFF` dibungkus dengan pengecekan `IF r_coord IS NOT NULL` dan `IF r_staff IS NOT NULL` agar migrasi dapat berjalan mulus pada database bersih (di mana role dasar baru diisi oleh seed berikutnya).
2. **Backfill Fakultas Default**:
   - Dibuatkan satu fakultas bawaan ('FT' - 'Fakultas Teknik', ID `20000000-0000-0000-0000-000000000001`) pada migrasi `20261027000040` untuk membackfill program studi yang ada.
3. **Penyelarasan Helper Functions**:
   - Seluruh helper SQL (`is_program_secretary`, `is_lab_head`, `is_lab_head_of_class`) didefinisikan dengan `SECURITY DEFINER`, `SET search_path = ''`, `STABLE`, hak eksekusi dicabut dari public/anon dan hanya diberikan kepada `authenticated`.
4. **Manajemen Pengguna & Impersonasi**:
   - Hanya `SUPER_ADMIN` yang diizinkan menetapkan atau mencabut peran baru (`PROGRAM_SECRETARY`, `LAB_HEAD`) dengan parameter lingkup (`scopeType` dan `scopeId`). Seluruh aksi tercatat pada `audit_logs`.
5. **Pembatalan & Penghapusan Peran Dekan (DEAN)**:
   - Berdasarkan instruksi pengguna (*"hapus saja role dekan dan push dan commit semua codenya"*), peran `DEAN` dihapus dari kode aplikasi (`menu-config.ts`, `workspace/page.tsx`, `actions.ts`, `demo-users.ts`, `superadmin-users-hub-view.tsx`) dan database (`20261028000043_remove_dean_role.sql`).
   - Rencana Fase 5 (Dekan) ditiadakan; alur kerja berlanjut langsung dari Fase 4 ke Fase 6.
