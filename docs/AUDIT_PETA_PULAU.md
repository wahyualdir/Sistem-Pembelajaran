# Audit Skema dan Komponen Eksisting SIAJAR untuk Fitur Peta Pulau

Dokumen ini disusun sebagai bagian dari **Fase P0 Langkah 1** instruksi `docs/INSTRUKSI_PETA_PULAU.md`. Semua nama tabel, kolom, fungsi RLS, dan modul AI yang dicatat di bawah ini merujuk langsung pada implementasi riil di repositori saat ini.

---

## 1. Pemetaan Tabel Basis Data Eksisting

| Entitas Konsep (Dokumen) | Tabel Riil di Basis Data | Kolom Utama Terkait Peta Pulau | Catatan & Relasi |
| :--- | :--- | :--- | :--- |
| **Kelas** | `public.classes` | `id`, `course_id`, `semester_id`, `name`, `code`, `status` | Relasi ke `enrollments`, `class_assistants`, `courses`, `semesters`. |
| **Materi** | `public.materials` | `id`, `class_id`, `title`, `body_md`, `status`, `release_at`, `unlock_after_material_id`, `require_completion` | Relasi ke storage bucket `materi`. Mendukung penguncian sekuensial materi 10.4. |
| **Progres Materi** | `public.material_progress` | `material_id`, `student_id`, `status` (`'dibuka'/'selesai'`), `first_opened_at`, `completed_at` | Tabel pendukung `public.materi_progres` juga tersedia untuk kompatibilitas. |
| **Kuis & Ujian (CBT)** | `public.quizzes` | `id`, `class_id`, `title`, `duration_minutes`, `kkm`, `status`, `kind` (`'utama'/'susulan'/'remedial'`), `release_at` | Mesin autosave, durasi, dan pengacakan soal. Kuis bab diintegrasikan dengan jenis baru `'kuis_bab'`. |
| **Soal Kuis** | `public.quiz_questions` | `id`, `quiz_id`, `question_text`, `question_type`, `points`, `order_index`, `topic_tag`, `cpl_tag` | Jenis nilai-otomatis: `MULTIPLE_CHOICE`, `MULTIPLE_SELECT`, `TRUE_FALSE`, `SHORT_ANSWER`. |
| **Opsi Soal** | `public.quiz_options` | `id`, `question_id`, `option_text`, `order_index` | Pilihan jawaban untuk soal bertipe opsi. |
| **Kunci Jawaban** | `public.quiz_question_keys` | `id`, `question_id`, `correct_option_id`, `correct_data`, `explanation` | **Terkunci ketat oleh RLS**: Mahasiswa dilarang keras melakukan `SELECT` langsung pada tabel ini. |
| **Percobaan Ujian** | `public.exam_attempts` | `id`, `quiz_id`, `student_id`, `started_at`, `deadline_at`, `finished_at`, `total_score`, `status`, `answers_json` | Status: `IN_PROGRESS`, `SUBMITTED`, `TIMED_OUT`, `DISQUALIFIED`. |
| **Jawaban Mahasiswa** | `public.exam_answers` | `id`, `attempt_id`, `question_id`, `selected_option_id`, `essay_text`, `score_earned`, `is_draft` | Menyimpan jawaban mahasiswa per butir soal dengan autosave. |
| **Tugas** | `public.assignments` | `id`, `class_id`, `title`, `due_date`, `points`, `late_policy`, `penalty_percent_per_day`, `release_at` | Ekstensi tenggat dicatat pada `public.assignment_extensions`. |
| **Pengumpulan Tugas** | `public.submissions` | `id`, `assignment_id`, `student_id`, `submitted_at`, `status`, `grade`, `feedback`, `file_url` | Riwayat versi pengumpulan pada `public.submission_versions`. |
| **Notifikasi** | `public.notifications` | `id`, `user_id`, `type`, `title`, `body`, `entity_type`, `entity_id`, `class_id`, `is_read` | Mendukung notifikasi real-time antarmuka. |
| **Notifikasi Terjadwal** | `public.scheduled_notifications` | `id`, `user_id`, `title`, `body`, `scheduled_for`, `status`, `dedupe_key`, `metadata` | Mendukung pencegahan duplikasi dan jam tenang (quiet hours 22.00–06.00 WIB). |
| **Preferensi Notifikasi** | `public.notification_preferences` | `user_id`, `email_enabled`, `push_enabled`, `categories_disabled` | Mendukung kontrol notifikasi per pengguna di menu Pengaturan. |
| **Pencapaian (XP)** | `public.xp_events` | `id`, `student_id`, `class_id`, `kind`, `points`, `ref_type`, `ref_id`, `created_at` | Dibatasi constraint unik `(student_id, kind, ref_type, ref_id)`. |
| **Lencana (Badges)** | `public.badges` & `public.student_badges` | `code`, `name`, `description`, `icon` & `student_id`, `badge_code`, `earned_at` | Gamifikasi prestasi belajar mahasiswa. |
| **Kebiasaan Aktif (Streak)** | `public.study_streaks` | `student_id`, `current_days`, `best_days`, `last_active_on` | Dihitung otomatis per tanggal WIB (`Asia/Jakarta`). |
| **Kebijakan Kampus** | `public.institution_policies` | `key`, `value` (JSONB), `description`, `updated_by`, `updated_at` | Dibaca via fungsi pembantu `public.get_policy(p_key text)`. |

---

## 2. Fungsi Pembantu RLS (Row Level Security) Eksisting

Fungsi pembantu yang telah terpasang dan siap digunakan kembali untuk penegakan akses database:
- `public.is_enrolled(p_class_id uuid)`: Memastikan pengguna terdaftar sebagai mahasiswa aktif pada kelas.
- `public.is_class_staff(p_class_id uuid)`: Memeriksa apakah pengguna adalah Dosen Pengampu atau Asisten Dosen di kelas tersebut.
- `public.is_class_lecturer(p_class_id uuid)`: Memeriksa apakah pengguna secara spesifik berkedudukan sebagai Dosen Pengampu kelas.
- `public.is_class_assistant(p_class_id uuid)`: Memeriksa apakah pengguna adalah Asisten Dosen di kelas.
- `public.has_active_role(p_role_code text)`: Memeriksa peran aktif pengguna dalam sesi (misal `'STUDENT'`, `'LECTURER'`, `'TEACHING_ASSISTANT'`).
- `public.has_global_role(p_role_code text)`: Memeriksa peran pengguna berskala global (misal `'SUPER_ADMIN'`, `'SYSTEM_ADMIN'`, `'ACADEMIC_STAFF'`).
- `public.is_program_coordinator(p_program_id uuid)`: Memeriksa wewenang Kaprodi pada lingkup Program Studi.
- `public.is_class_coordinator(p_class_id uuid)`: Memeriksa wewenang Kaprodi yang membawahi mata kuliah/kelas terkait.
- `public.is_admin()`: Pengecekan cepat untuk `SUPER_ADMIN`, `SYSTEM_ADMIN`, atau `ACADEMIC_STAFF`.
- `public.award_xp(student_id, class_id, kind, points, ref_type, ref_id)`: RPC terpusat untuk mencatat event XP dan memperbarui streak harian mahasiswa di zona WIB secara idempoten.

---

## 3. Klien AI dan Pengingat Eksisting

- **Modul AI**:
  - `src/lib/ai/reminder-service.ts`: Mesin pembuat pesan pengingat berbasis AI.
  - `src/lib/ai/prompts.ts`: Prompt sistem terpusat.
  - `src/lib/ai/reminder-templates.ts`: Templat pesan deterministik statis dan helper jam tenang WIB.
- **Konfigurasi Lingkungan**:
  - `AI_MODEL`: Menentukan model bahasa yang digunakan.
  - `GEMINI_API_KEY` / `OPENAI_API_KEY`: Kunci akses penyedia AI.
- **Pola Fail-Closed & Fallback**:
  - Jika konfigurasi kunci AI atau model belum ditentukan di environment, sistem secara elegan beralih ke templat statis tanpa memicu unhandled rejection/crash.
  - Panggilan AI dibatasi waktu (timeout 5 detik dengan `AbortController`).

---

## 4. Kesimpulan Kesiapan Fondasi P0

1. Skema database siap diekstensi dengan menambahkan `class_feature_flags`, relasi `chapter_id` pada `materials`, `quizzes`, `assignments`, dan `topic_id` pada `quiz_questions`.
2. Mesin ujian (`quizzes`, `quiz_questions`, `quiz_options`, `exam_attempts`, `exam_answers`) siap dipakai langsung untuk kuis bab (`kind = 'kuis_bab'`).
3. Notifikasi terjadwal, sistem XP (`xp_events`, `award_xp`), dan `institution_policies` sudah memiliki struktur dan helper siap pakai.
