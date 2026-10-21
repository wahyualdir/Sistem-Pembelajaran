# Audit Skema Basis Data dan Persistensi Akademik SIAJAR (Fase S0)

**Tanggal:** 21 Oktober 2026  
**Dokumen Acuan:** `docs/INSTRUKSI_SEED_AKADEMIK.md` (Fase S0)  
**Tujuan:** Memvalidasi struktur tabel, kendala integritas (constraint), alur identitas & autentikasi, serta persistensi jadwal & perwalian sebelum eksekusi seed data UIR Ganjil 2026/2027.

---

## 1. Daftar Kolom dan Kendala (Constraint) Tabel Sasaran

Berdasarkan pemeriksaan langsung terhadap seluruh berkas migrasi `supabase/migrations/*.sql` (migrasi 01 s.d. 34):

| Tabel | Kolom Kunci & Tipe | Constraint Unik | Constraint CHECK & Catatan Khusus |
| :--- | :--- | :--- | :--- |
| **`programs`** | `id` (UUID PK), `code` (TEXT), `name` (TEXT), `is_active` (BOOL) | `UNIQUE (code)` | `char_length(code) BETWEEN 2 AND 20`, `char_length(name) BETWEEN 3 AND 120`. |
| **`semesters`** | `id` (UUID PK), `label` (TEXT), `is_active` (BOOL) | `UNIQUE (label)` | `char_length(label) BETWEEN 5 AND 40`. Label harus unik (contoh: `'Ganjil 2026/2027'`). |
| **`rooms`** | `id` (UUID PK), `code` (VARCHAR 50), `name` (VARCHAR 100), `building` (VARCHAR 100), `capacity` (INT), `latitude`, `longitude`, `radius_meters` (INT DEF 50) | `UNIQUE (code)` | RLS aktif: dibaca semua `authenticated`, ditulis oleh `ACADEMIC_STAFF` / `SUPER_ADMIN`. |
| **`courses`** | `id` (UUID PK), `program_id` (UUID FK), `code` (TEXT), `name` (TEXT), `credits` (SMALLINT), `is_active` (BOOL) | `UNIQUE (code)` | `char_length(code) BETWEEN 3 AND 20`, `char_length(name) BETWEEN 3 AND 120`, `credits BETWEEN 1 AND 6`. |
| **`classes`** | `id` (UUID PK), `title` (TEXT), `section` (TEXT), `join_code` (CHAR 8), `capacity` (SMALLINT), `status` (ENUM `class_status`), `created_by` (UUID FK), `course_id` (UUID FK), `semester_id` (UUID FK), `lecturer_id` (UUID FK) | `UNIQUE (join_code)` | **PENTING**: `join_code` bertipe `CHAR(8)`. Nilai harus pas 8 karakter alfanumerik kapital untuk mencegah spasi ganjil. `title` (3..120), `capacity > 0`. Proteksi trigger `fn_protect_classes_sensitive_columns` memerlukan `app.rpc_context = 'on'` saat upsert langsung. |
| **`enrollments`** | `id` (UUID PK), `class_id` (UUID FK), `student_id` (UUID FK), `status` (ENUM `enrollment_status`), `enrolled_at`, `dropped_at` | `UNIQUE (class_id, student_id)` | Enum status: `ACTIVE`, `DROPPED`, `COMPLETED`, `REMOVED`. |
| **`profiles`** | `id` (UUID PK FK `auth.users`), `full_name` (TEXT), `email` (TEXT), `status` (ENUM `user_status`), `must_change_password` (BOOL), `locked_until` | `UNIQUE (email)` | Status enum: `PENDING`, `ACTIVE`, `LOCKED`, `SUSPENDED`, `DEACTIVATED`. |
| **`user_identifiers`** | `id` (UUID PK), `user_id` (UUID FK), `type` (ENUM `identifier_type`), `value` (VARCHAR 100), `is_primary` (BOOL) | `UNIQUE (type, value)` | Type enum: `NIM`, `NIDN`, `NIP`, `EMAIL`, `USERNAME`. |
| **`user_roles`** | `id` (UUID PK), `user_id` (UUID FK), `role_id` (UUID FK), `scope_type` (ENUM `scope_type`), `scope_id` (UUID NULL), `status` (ENUM `user_role_status`) | Unique index pada `(user_id, role_id, scope_type, COALESCE(scope_id, '0000...'))` | Scope: `GLOBAL`, `PROGRAM`, `CLASS`. Status: `ACTIVE`, `REVOKED`, `EXPIRED`. |
| **`class_assistants`** | `id` (UUID PK), `class_id` (UUID FK), `user_id` (UUID FK), `permission` (TEXT), `granted_by` (UUID FK), `can_open_attendance` (BOOL DEF FALSE) | `UNIQUE (class_id, user_id, permission)` | `permission IN ('material.manage', 'announcement.manage', 'assignment.create', 'submission.review', 'assignment.grade')`. Kolom `can_open_attendance` ada di migrasi 22. |
| **`attendance_sessions`** | `id` (UUID PK), `class_id` (UUID FK), `session_number` (INT), `title` (VARCHAR 200), `session_date` (DATE), `start_time` (VARCHAR 10), `end_time` (VARCHAR 10), `code` (VARCHAR 20), `is_open` (BOOL), `room_id` (UUID FK), `created_by` (UUID FK) | `UNIQUE (class_id, session_number)` | `session_number BETWEEN 1 AND 16`. |

---

## 2. Penyediaan Akun (Account Provisioning)

- **Fungsi Eksisting:** Ditemukan di `src/modules/identity/actions.ts` (`tambahPenggunaAction` baris 480–510) yang menggunakan `supabaseAdmin.auth.admin.createUser` diikuti penyisipan ke `profiles`, `user_identifiers`, dan `user_roles`.
- **Keputusan Implementasi Seed:** Untuk eksekusi seed CLI berkinerja tinggi, kita membuat modul pembungkus terspesialisasi di `scripts/seed-akademik/accounts.ts`. Modul ini memanggil `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })`, kemudian melakukan `upsert` idempotent ke `profiles`, `user_identifiers` (tipe `NIM`, `NIDN`, `NIP`, serta email teknis), dan `user_roles`.

---

## 3. Alur Login & Pemeriksaan Domain

- **Pencarian Identitas:** Di `src/modules/identity/actions.ts:122-135`, alur login kata sandi mencari identifier (NIM/NIDN/NIP) di tabel `user_identifiers` dan memetakan ke email akun Supabase `profiles.email`. Login Supabase dijalankan dengan `signInWithPassword({ email: targetEmail, password })`.
- **Pemeriksaan `allowed_email_domains`:** Fungsi `validasiEmailKampusAsync` (`src/lib/auth/validasi-email.ts`) digunakan pada alur **Google OAuth**. Alur password berbasis NIM/NIDN/NIP tidak memblokir domain `.test` jika akun sudah ada di Supabase. Namun, demi konsistensi dan keselamatan (Aturan 2.4), skrip seed akan menambahkan domain `mhs.siajar.test`, `dosen.siajar.test`, dan `staf.siajar.test` ke tabel `allowed_email_domains` jika tabel tersebut aktif.
- **Pengalihan `must_change_password`:** Di baris 359–365 `src/modules/identity/actions.ts`, jika `must_change_password === true`, login mengembalikan `{ ok: true, redirectTo: '/must-change-password' }`. Sesuai spesifikasi, seed akan mengatur `must_change_password = false` secara bawaan agar akun langsung siap digunakan untuk pengujian demo.

---

## 4. Persistensi Jadwal Staf, KRS, dan Dosen Wali

- **Flag Persistensi:** Diatur di `src/lib/config/features.ts` melalui variabel lingkungan (misalnya `FF_PERSISTENCE_ACADEMIC`).
- **Jadwal Staf & KRS:** Masih memiliki jalur ganda:
  1. Jalur database (Supabase): membaca tabel `classes`, `courses`, `enrollments`.
  2. Jalur in-memory store legacy: `src/features/jadwal/jadwal-store.ts` dan `src/features/krs/krs-store.ts` yang mengimpor data statis dari `src/lib/db/seed-data.ts`.
- **Dosen Wali (Perwalian):** **Tidak ada tabel basis data** untuk `dosen_wali` di seluruh 34 migrasi skema. Di kode eksisting, relasi `dosenWaliId` hanya ada pada objek in-memory `SEED_MAHASISWA` di `src/lib/db/seed-data.ts` dan store KRS.
- **Keputusan:** Relasi Dosen Wali disimpan pada generator seed data lapis lama (`src/lib/db/seed-data.uir-ti-2026.generated.ts`) pada Fase S5 tanpa memodifikasi skema migrasi tabel yang tidak memiliki kolom tersebut.

---

## 5. Prasyarat Mata Kuliah & Struktur Kurikulum

- **Pemeriksaan Skema:** Tidak ditemukan tabel relasi prasyarat (misal `course_prerequisites`) pada migrasi basis data. Prasyarat pada `kurikulum_2025.csv` berupa teks referensi mata kuliah sebelumnya.
- **Keputusan:** Data kurikulum dimasukkan ke tabel `courses` (kode, nama, sks). Data prasyarat dicatat pada berkas generated layer S5.

---

## 6. Keputusan Jadwal Mingguan

- **Pemeriksaan Skema:** Tidak ada tabel jadwal mingguan (hari, jam mulai, jam selesai, ruang, komponen teori/praktik) pada basis data Supabase saat ini. Tabel `classes` hanya menyimpan metadata agregat kelas.
- **Keputusan:** **Memilih Opsi B (bawaan)**. Membuat migrasi baru `20261021000035_class_schedule_slots_and_aliases.sql` yang menambahkan tabel:
  1. `public.class_schedule_slots` (256 baris jadwal)
  2. `public.course_code_aliases` (pemetaan kode jadwal ke kode kurikulum)
  Beserta pengamanan RLS lengkap.
