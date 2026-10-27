# Log Keputusan Teknis — Peran Baru SIAJAR

Dokumen ini mencatat keputusan arsitektural dan teknis yang diambil selama implementasi penambahan peran baru dan perwalian.

---

## Keputusan Fase 0: Audit & Strategi Fondasi

1. **Pemilihan Branch Kerja**:
   - Dibuat cabang khusus `fitur/peran-baru` berbasis `main` untuk menjaga kebersihan komit dan isolasi pekerjaan dari eksperimen UI lain.
2. **Dosen Wali sebagai Relasi Data (Bukan Role Database)**:
   - Sesuai instruksi Bagian 1, Dosen Wali tidak ditambahkan ke tabel `roles`.
   - Dibuatkan tabel `public.academic_advisories` dengan relasi `advisor_user_id` (`LECTURER`) dan `student_user_id` (`STUDENT`). Mahasiswa hanya boleh memiliki 1 wali berstatus `ACTIVE` (ditegakkan indeks unik parsial).
3. **Pemisahan Migrasi Enum PostgreSQL**:
   - `ALTER TYPE public.scope_type ADD VALUE` tidak dapat digunakan dalam transaksi yang sama di PostgreSQL. Oleh karena itu, penambahan nilai enum `'FACULTY'` dan `'LAB'` dipisahkan ke berkas migrasi khusus tersendiri sebelum tabel yang memakainya dibuat.
4. **Alokasi ID Peran Baru (UUID Statis)**:
   - Mengikuti pola identitas di `supabase/seed.sql` dan migrasi `SUPER_ADMIN`:
     - `PROGRAM_SECRETARY`: `10000000-0000-0000-0000-000000000011`
     - `LAB_HEAD`: `10000000-0000-0000-0000-000000000012`
     - `DEAN`: `10000000-0000-0000-0000-000000000013`
5. **Penetapan Awalan Menu & Rute Portal**:
   - Sekretaris Prodi: awalan ID menu `sek-`, gerbang portal `/secretary`.
   - Kepala Lab: awalan ID menu `lab-`, gerbang portal `/lab`.
   - Dekan: awalan ID menu `dkn-`, gerbang portal `/dean`.
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
   - Seluruh helper SQL (`is_program_secretary`, `is_dean_of_program`, `is_lab_head`, `is_lab_head_of_class`) didefinisikan dengan `SECURITY DEFINER`, `SET search_path = ''`, `STABLE`, hak eksekusi dicabut dari public/anon dan hanya diberikan kepada `authenticated`.
4. **Manajemen Pengguna & Impersonasi**:
   - Hanya `SUPER_ADMIN` yang diizinkan menetapkan atau mencabut peran baru (`PROGRAM_SECRETARY`, `LAB_HEAD`, `DEAN`) dengan parameter lingkup (`scopeType` dan `scopeId`). Seluruh aksi tercatat pada `audit_logs`.
