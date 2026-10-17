# Audit Awal Repositori & Baseline Teknis SIAJAR
**Tanggal**: 17 Oktober 2026  
**Status**: Fase 0 Langkah 1 — Selesai  
**Tujuan**: Pemetaan akurat arsitektur sistem, skema basis data riil, RLS helper, server action, library, dan pola validasi sebelum modifikasi kode.

---

## 1. Struktur Folder & Modul Repositori

Repositori menggunakan Next.js 14 App Router dengan arsitektur modular:
- `src/app/(portal)/`: Rute portal utama pengguna (`student`, `ta`, `lecturer`, `coordinator`, `staff`, `admin`, `classes`, `attendance`, `exams`, `grades`, `calendar`, `notifications`, `announcements`, `community`, `library`, `ai-assistant`, `certificates`, `analytics`, `settings`, `help`, `transparency`, `profile`, `devices`).
- `src/app/(auth)/`: Alur login (`/login`), verifikasi Google OAuth, dan pemulihan sesi.
- `src/app/(dashboard)/`: Halaman warisan (*legacy SIAKAD*) yang terlindungi di balik redirect.
- `src/app/api/`: Endpoint API publik & internal (`auth`, `calendar/feed`, `cron`, `export`, `pdf`, `storage`).
- `src/components/`: Komponen antarmuka atomik & molekuler:
  - `ui/`: Primitif Radix UI styled (`button`, `card`, `dialog`, `input`, `table`, `badge`, `skeleton`, `file-dropzone`).
  - `shared/`: Komponen tata kelola (`sidebar`, `topbar`, `status-badge`, `empty-state`, `markdown-viewer`, `notifikasi-popover`).
  - `home/`: Widget dashboard mahasiswa (`today-schedule`, `nearest-deadlines`, `active-classes-grid`).
- `src/lib/`:
  - `config/menu-config.ts`: *Single source of truth* konfigurasi menu dan RBAC 7 peran.
  - `config/features.ts`: Feature flags (`siakadLegacy: false`, `demoMode`).
  - `supabase/`: Klien browser, server (`cookies`), dan admin service-role.
- `src/modules/`: Logika bisnis terisolasi (`academic`, `identity`, `notifications`, `early-warning`, `admin`).
- `supabase/migrations/`: 22 berkas migrasi SQL (terakhir: `20261016000021_notifications_early_warning_persistence.sql`).

---

## 2. Nama Tabel Sebenarnya (PostgreSQL / Supabase Schema `public`)

Berdasarkan audit 22 berkas migrasi aktif di `supabase/migrations/*.sql`, berikut nama tabel sebenarnya:

1. **Identitas & Akses**: `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_identifiers`, `user_devices`, `login_events`, `audit_logs`.
2. **Akademik Inti**: `programs`, `semesters`, `courses`, `classes`, `class_status_transitions`, `enrollments`, `class_assistants`, `rooms`.
3. **Materi & Tugas**: `materials`, `materi_progres`, `assignments`, `submissions`.
4. **Penilaian & Gradebook**: `grades`, `grade_history`, `grade_components`, `grade_items`, `grade_exemptions`, `gradebook_locks`, `gradebook_unlock_requests`, `grade_scales`, `grade_scale_bands`, `class_final_grades`, `grade_change_requests`.
5. **Kehadiran**: `attendance_sessions`, `attendance_records`, `leave_permits`.
6. **Ujian & CBT**: `quizzes`, `quiz_questions`, `quiz_options`, `quiz_question_keys`, `exam_attempts`, `exam_answers`, `exam_telemetry_events`, `exam_proctor_interventions`, `exam_disputes`.
7. **Komunikasi & Konten**: `announcements`, `discussions`, `discussion_replies`, `notifications`, `notification_preferences`.
8. **Layanan & Portofolio**: `library_items`, `library_loans`, `campus_events`, `event_registrations`, `certificates`, `student_badges`, `portfolios`, `portfolio_items`, `student_risk_evaluations`, `system_settings`.

---

## 3. Helper RLS & Fungsi Keamanan yang Sudah Ada

Fungsi database (`SECURITY DEFINER`, `search_path = ''`) yang aktif dipakai dalam RLS:
- `public.has_global_role(role_code text)`: Mengecek peran global pengguna aktif.
- `public.has_active_role(role_code text)`: Mengecek peran aktif pengguna (termasuk multi-role via JWT).
- `public.is_class_staff(class_id uuid)`: Mengecek apakah `auth.uid()` adalah dosen pengampu atau asisten kelas.
- `public.is_class_lecturer(class_id uuid)`: Mengecek dosen utama pemilik kelas.
- `public.is_enrolled(class_id uuid)`: Mengecek apakah mahasiswa terdaftar aktif di kelas.
- `public.has_class_permission(class_id uuid, perm_code text)`: Mengecek delegasi hak asisten kelas.
- `public.is_program_coordinator(program_id uuid)` / `public.is_class_coordinator(class_id uuid)`: Mengecek otorisasi Kaprodi.
- `public.log_audit(...)`: Fungsi pencatatan immutable audit trail yang dipanggil via trigger atau server action.
- `public.fn_prevent_audit_log_modification()`: Trigger penjaga tabel `audit_logs` agar tidak bisa di-UPDATE atau di-DELETE.

---

## 4. Library UI, Chart, dan Utilitas yang Terpasang

- **Framework**: Next.js 14.2.13 (App Router), React 18.3.1, TypeScript 5.6.2 strict.
- **Styling**: Tailwind CSS 3.4.13, PostCSS 8.4.47, `tailwindcss-animate` 1.0.7.
- **Komponen Primitif**: Radix UI (`avatar`, `checkbox`, `dialog`, `dropdown-menu`, `label`, `select`, `tabs`, `tooltip`).
- **Ikon**: `lucide-react` versi 0.446.0 (periksa ketersediaan ikon sebelum digunakan).
- **Visualisasi / Chart**: `recharts` 2.12.7 dan komponen SVG mandiri (`ips-trend-chart.tsx`).
- **Tabel & Dokumen**: `@tanstack/react-table` 8.20.5, `exceljs` 4.4.0, `papaparse` 5.4.1, `@react-pdf/renderer` 3.4.4.
- **Validasi**: `zod` 3.23.8 & `@hookform/resolvers` 3.9.0.
- **Pengujian**: Vitest 2.1.1 (unit test) & Playwright 1.63.0 (e2e).

---

## 5. Pola Validasi & Penanganan Error Server Action

### 5.1 Skema Validasi
Setiap Server Action menggunakan validasi input server-side berbasis Zod:
```typescript
const schema = z.object({
  title: z.string().trim().min(3, 'Nama mata kuliah minimal 3 karakter.').max(120),
  section: z.string().trim().min(1, 'Isi nama kelas, misalnya A.').max(20),
});
```

### 5.2 Format Return Seragam
Format kembalian Server Action konsisten mengacu pada interface `ActionResponse<T>` di `src/modules/identity/types.ts`:
```typescript
export interface ActionResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
}
```
Pesan galat dituliskan dalam bahasa Indonesia natural dan ramah pengguna, tanpa menampilkan exception trace mentah database.

---

## 6. Temuan Kunci & Kesiapan Menuju Fase 0 Langkah 2

1. **Konfigurasi Menu**: `src/lib/config/menu-config.ts` saat ini memiliki 86 butir menu (termasuk item bersama). Target Bagian 6 instruksi adalah **102 butir menu final** dengan struktur grup baru (title case) dan tanpa kata terlarang.
2. **Kebutuhan Halaman Sementara**: Rute baru seperti `/messages`, `/achievements`, `/evaluations`, `/requests`, `/lecturer/journals`, `/lecturer/rubrics`, `/lecturer/disputes`, `/exams/analysis` memerlukan halaman sementara yang sah (*valid temporary pages*) agar tidak memicu galat 404 pada saat navigasi diuji.
3. **Penyelarasan Celah**: Penambahan kolom `can_open_attendance` pada `class_assistants`, view `audit_logs_for_sysadmin`, batas impersonasi 30 menit, dan tabel kebijakan institusi akan diterapkan secara bertahap melalui migrasi database terurut.
