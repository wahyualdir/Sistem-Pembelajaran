# Hasil Audit Sumber Data Fitur "Kain Semester"

Dokumen audit ini memverifikasi skema database, kebijakan RLS, indeks, dan pola kode yang ada di repositori sebelum implementasi fitur Kain Semester dimulai.

---

### 1. Nama Tabel & Kolom Sebenarnya
Verifikasi pada skema migrasi Supabase (`supabase/migrations/`):
- `classes` (`id`, `title`, `section`, `status`, `created_by`, `deleted_at`, `course_id`, `semester_id`): Satu baris Kain Semester = satu kelas mahasiswa.
- `enrollments` (`id`, `class_id`, `student_id`, `status`, `enrolled_at`, `dropped_at`): Filter hanya mahasiswa aktif (`status = 'ACTIVE'`).
- `attendance_sessions` (`id`, `class_id`, `session_number`, `title`, `session_date`, `is_open`, `start_time`, `end_time`): `session_number` dijamin CHECK 1..16 dan unik per `(class_id, session_number)`.
- `attendance_records` (`id`, `session_id`, `student_id`, `status`, `check_in_at`, `is_late`, `source`, `absence_item_id`): Menyimpan status kehadiran (`HADIR`, `TERLAMBAT`, `IZIN`, `SAKIT`, `ALPA`).
- `assignments` (`id`, `class_id`, `title`, `due_at`, `close_at`, `status`, `max_score`, `release_at`): Tugas perkuliahan.
- `submissions` (`id`, `assignment_id`, `student_id`, `status`, `submitted_at`, `is_late`, `attempt_no`): Pengumpulan tugas mahasiswa (`status IN ('SUBMITTED','RETURNED','REVIEWED','GRADED')` dihitung sebagai dikumpulkan; `DRAFT` tidak).

### 2. Kebijakan RLS (Row Level Security) `SELECT`
- `classes`: Diizinkan untuk mahasiswa terdaftar lewat fungsi `public.is_enrolled(id)`.
- `enrollments`: Diizinkan untuk `student_id = auth.uid()`.
- `attendance_sessions`: Diizinkan untuk kelas yang diikuti mahasiswa lewat `public.is_enrolled(class_id)`.
- `attendance_records`: Diizinkan secara aman HANYA untuk baris miliknya sendiri (`student_id = auth.uid()`).
- `assignments`: Mahasiswa terdaftar dapat membaca tugas terbit (`status = 'PUBLISHED'` dan `is_enrolled(class_id)`).
- `submissions`: Mahasiswa HANYA dapat membaca pengumpulan miliknya sendiri (`student_id = auth.uid()`).
> **Kesimpulan Keamanan**: Seluruh query dapat berjalan menggunakan Supabase client terotentikasi standar (`createClient()`) yang menghormati RLS. Dilarang keras dan tidak diperlukan pemakaian `supabaseAdmin` / `service_role`.

### 3. Indeks Database yang Ada
- `classes`: `idx_classes_status` pada `(status)`
- `enrollments`: `idx_enrollments_student` pada `(student_id, status)`
- `attendance_sessions`: `idx_attendance_sessions_class` pada `(class_id)`
- `attendance_records`: `idx_attendance_records_session` pada `(session_id)`, `idx_attendance_records_student` pada `(student_id)`
- `assignments`: `idx_assignments_class` pada `(class_id, due_at)`
- `submissions`: `idx_submissions_student` pada `(student_id)`
> **Kesimpulan Indeks**: Seluruh klausa `WHERE` dan `IN` pada rencana 5 query telah terindeks secara optimal di Postgres. Tidak diperlukan migrasi skema baru.

### 4. Bukti Model Prisma Legacy Tidak Digunakan
Pencarian `git grep` pada direktori `src/`:
- `prisma.presensi`: 0 temuan
- `prisma.pertemuan`: 0 temuan
- `prisma.tugas`: 0 temuan
- `prisma.pengumpulanTugas`: 0 temuan
Prisma hanya digunakan untuk tabel audit dan pengguna legacy. Semua data perkuliahan aktif bersumber dari Supabase.

### 5. Pola Jalur Data yang Diikuti
Mengikuti konvensi `attendance-actions.ts` dan `peta-pulau-actions.ts`:
- Periksa kesiapan Supabase: `await checkSupabaseOnline()`.
- Bila Supabase offline atau sesi pengguna tidak ditemukan: kembalikan respons kosong yang jujur (tanpa mock/data karangan).
- Gunakan `createClient()` dari `@/lib/supabase/server`.

### 6. Bentuk Respons Server Action
Mengikuti `ActionResponse<T>` dari `@/modules/identity/types`:
- Sukses: `{ ok: true, data: SemesterWeaveData }`
- Gagal: `{ ok: false, pesan: 'Kain semester belum bisa dimuat. Coba muat ulang halaman.' }` (pesan berbahasa Indonesia natural, tanpa rincian teknis/SQL).

### 7. Rute Tautan Navigasi Kelas
- Rute halaman detail kelas: `/classes/${classId}` (berkas `src/app/(portal)/classes/[id]/page.tsx`), yang sudah mengintegrasikan tab Peta Pulau dan tugas.

### 8. Label Tampilan Baris Kelas
- Menggunakan `classes.title` sebagai nama utama (misal: "Pemrograman Web Lanjut") dengan `section` pada tooltip/sheet (misal: "Kelas IF-3A").
- Ditata alfabetis berdasarkan `title` agar stabil antar-muatan.

### 9. Keputusan Algoritma "Pekan Sekarang"
- Mengikuti Bagian 5.2 instruksi:
  1. `semesterStart` = `session_date` terkecil dari seluruh sesi bernomor 1 (`session_number = 1`) milik kelas aktif mahasiswa.
  2. `week = Math.floor((hariIniWIB - semesterStart) / 7 hari) + 1`, dijepit ke rentang `1..16`.
  3. Bila `hariIniWIB < semesterStart`: `week = 0` (semester belum dimulai).
  4. Cadangan: jika tidak ada sesi bernomor 1, ambil sesi dengan `session_date <= hariIniWIB` dengan nomor sesi terbesar. Bila tidak ada sama sekali, `week = null`.
- Dicatat di `docs/KEPUTUSAN.md`.
