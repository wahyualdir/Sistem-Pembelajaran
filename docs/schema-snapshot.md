# Snapshot Skema Database SIAJAR (Single Source of Truth)

> **Tanggal Dihasilkan**: 12 Oktober 2026  
> **Lingkungan**: PGlite (PostgreSQL 16) setelah migrasi 1..20 dijalankan dari nol.  
> **Tujuan**: Sumber kebenaran tunggal (*Single Source of Truth*) nama tabel, kolom, tipe data, foreign key, dan kebijakan RLS untuk perencanaan dan implementasi Fase 3.

---

## 1. Tipe Enum Kustom (Custom Enums)

| Nama Enum | Nilai-Nilai Enum (*Allowed Values*) |
|---|---|
| `assignment_status` | `DRAFT`, `PUBLISHED`, `CLOSED` |
| `change_request_status` | `PENDING`, `APPROVED`, `REJECTED`, `EXECUTED` |
| `class_status` | `DRAFT`, `OPEN`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `enrollment_status` | `ACTIVE`, `DROPPED`, `COMPLETED`, `REMOVED` |
| `event_type` | `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `SESSION_REVOKED`, `PASSWORD_CHANGED`, `REPORTED_NOT_ME`, `MFA_CHALLENGE` |
| `grade_status` | `DRAFT`, `FINAL` |
| `identifier_type` | `NIM`, `NIDN`, `NIP`, `EMAIL`, `USERNAME` |
| `material_status` | `DRAFT`, `PUBLISHED`, `HIDDEN` |
| `risk_level` | `LOW`, `MEDIUM`, `HIGH` |
| `scope_type` | `GLOBAL`, `PROGRAM`, `CLASS` |
| `submission_status` | `DRAFT`, `SUBMITTED`, `RETURNED`, `REVIEWED`, `GRADED` |
| `user_role_status` | `ACTIVE`, `REVOKED`, `EXPIRED` |
| `user_status` | `PENDING`, `ACTIVE`, `LOCKED`, `SUSPENDED`, `DEACTIVATED` |

---

## 2. Daftar Tabel & Struktur Kolom (Schema Tables)

### Tabel: `public.announcements`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `author_id` | `uuid` | NO | - |
| `title` | `text` | NO | - |
| `body` | `text` | NO | `''` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `author_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `announcements_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.assignments`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 11

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `title` | `text` | NO | - |
| `description` | `text` | NO | `''` |
| `due_at` | `timestamp with time zone` | NO | - |
| `close_at` | `timestamp with time zone` | NO | - |
| `max_score` | `numeric` | NO | `100` |
| `status` | `USER-DEFINED` | NO | `'PUBLISHED'` |
| `created_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `assignments_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.audit_logs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 17

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `actor_user_id` | `uuid` | YES | - |
| `actor_role` | `character varying` | YES | - |
| `action` | `character varying` | NO | - |
| `entity_type` | `character varying` | NO | - |
| `entity_id` | `uuid` | YES | - |
| `scope_type` | `text` | YES | - |
| `scope_id` | `uuid` | YES | - |
| `before_json` | `jsonb` | YES | - |
| `after_json` | `jsonb` | YES | - |
| `ip_address` | `text` | YES | - |
| `user_agent` | `text` | YES | - |
| `request_id` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `on_behalf_of` | `uuid` | YES | - |
| `description` | `text` | YES | - |
| `details` | `jsonb` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `actor_user_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `on_behalf_of` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `audit_logs_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.class_assistants`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `user_id` | `uuid` | NO | - |
| `permission` | `text` | NO | - |
| `granted_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `granted_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `permission`
- UNIQUE: `user_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `class_assistants_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.class_status_transitions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `from_status` | `USER-DEFINED` | NO | - |
| `to_status` | `USER-DEFINED` | NO | - |
| `description` | `text` | YES | - |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `from_status`
- PRIMARY KEY: `to_status`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `class_status_transitions_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.classes`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 14

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `title` | `text` | NO | - |
| `section` | `text` | NO | `'A'` |
| `join_code` | `character` | NO | - |
| `capacity` | `smallint` | YES | - |
| `status` | `USER-DEFINED` | NO | `'OPEN'` |
| `created_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |
| `deleted_at` | `timestamp with time zone` | YES | - |
| `course_id` | `uuid` | YES | - |
| `semester_id` | `uuid` | YES | - |
| `lecturer_id` | `uuid` | YES | - |
| `rejection_reason` | `text` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `course_id` -> `public.courses(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `lecturer_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `semester_id` -> `public.semesters(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `join_code`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `classes_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `classes_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.courses`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `program_id` | `uuid` | NO | - |
| `code` | `text` | NO | - |
| `name` | `text` | NO | - |
| `credits` | `smallint` | NO | - |
| `is_active` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `program_id` -> `public.programs(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `code`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `courses_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `courses_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `courses_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.discussion_replies`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `discussion_id` | `uuid` | NO | - |
| `class_id` | `uuid` | NO | - |
| `author_id` | `uuid` | NO | - |
| `author_name` | `text` | NO | - |
| `body` | `text` | NO | - |
| `is_hidden` | `boolean` | NO | `false` |
| `hidden_by` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `author_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `discussion_id` -> `public.discussions(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `hidden_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `discussion_replies_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.discussions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `author_id` | `uuid` | NO | - |
| `author_name` | `text` | NO | - |
| `title` | `text` | NO | - |
| `body` | `text` | NO | - |
| `is_pinned` | `boolean` | NO | `false` |
| `is_locked` | `boolean` | NO | `false` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `author_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `discussions_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.enrollments`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `status` | `USER-DEFINED` | NO | `'ACTIVE'` |
| `enrolled_at` | `timestamp with time zone` | NO | `now()` |
| `dropped_at` | `timestamp with time zone` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `enrollments_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `enrollments_staff_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.grade_change_requests`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 18

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `grade_id` | `uuid` | NO | - |
| `class_id` | `uuid` | NO | - |
| `requested_by` | `uuid` | NO | - |
| `class_title` | `text` | NO | - |
| `assignment_title` | `text` | NO | - |
| `student_name` | `text` | NO | - |
| `old_score` | `numeric` | NO | - |
| `proposed_score` | `numeric` | NO | - |
| `reason` | `text` | NO | - |
| `status` | `USER-DEFINED` | NO | `'PENDING'` |
| `reviewed_by` | `uuid` | YES | - |
| `review_note` | `text` | YES | - |
| `reviewed_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `executed_by` | `uuid` | YES | - |
| `executed_at` | `timestamp with time zone` | YES | - |
| `execution_note` | `text` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `executed_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `grade_id` -> `public.grades(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `requested_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `reviewed_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `gcr_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `gcr_staff_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.grade_history`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 10

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `grade_id` | `uuid` | NO | - |
| `class_id` | `uuid` | NO | - |
| `old_score` | `numeric` | YES | - |
| `new_score` | `numeric` | NO | - |
| `old_status` | `USER-DEFINED` | YES | - |
| `new_status` | `USER-DEFINED` | NO | - |
| `changed_by` | `uuid` | NO | - |
| `reason` | `text` | YES | - |
| `changed_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `changed_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `grade_id` -> `public.grades(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `grade_history_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.grades`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 15

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `item_type` | `text` | NO | `'ASSIGNMENT'` |
| `item_id` | `uuid` | NO | - |
| `score` | `numeric` | NO | - |
| `max_score` | `numeric` | NO | - |
| `comment` | `text` | NO | `''` |
| `status` | `USER-DEFINED` | NO | `'DRAFT'` |
| `graded_by` | `uuid` | NO | - |
| `finalized_by` | `uuid` | YES | - |
| `finalized_at` | `timestamp with time zone` | YES | - |
| `is_visible_to_student` | `boolean` | NO | `false` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `finalized_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `graded_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `item_id`
- UNIQUE: `item_type`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `grades_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.login_events`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 11

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | - |
| `device_id` | `uuid` | YES | - |
| `event_type` | `USER-DEFINED` | NO | - |
| `is_new_device` | `boolean` | NO | `false` |
| `risk_level` | `USER-DEFINED` | NO | `'LOW'` |
| `ip_masked` | `text` | YES | - |
| `country` | `text` | YES | - |
| `city` | `text` | YES | - |
| `notified_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `device_id` -> `public.user_devices(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `login_events_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `login_events_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.materi_progres`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `materi_id` | `uuid` | NO | - |
| `mahasiswa_id` | `uuid` | NO | - |
| `selesai` | `boolean` | NO | `false` |
| `selesai_pada` | `timestamp with time zone` | YES | - |
| `terakhir_dibuka` | `timestamp with time zone` | NO | `now()` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `mahasiswa_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `materi_id` -> `public.materials(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `mahasiswa_id`
- UNIQUE: `materi_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `materi_progres_delete` | `DELETE` | `authenticated` | PERMISSIVE |
| `materi_progres_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `materi_progres_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `materi_progres_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.materials`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `title` | `text` | NO | - |
| `body_md` | `text` | NO | `''` |
| `status` | `USER-DEFINED` | NO | `'PUBLISHED'` |
| `created_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `materials_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.notifications`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 10

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | - |
| `type` | `text` | NO | - |
| `title` | `text` | NO | - |
| `body` | `text` | NO | `''` |
| `entity_type` | `text` | YES | - |
| `entity_id` | `uuid` | YES | - |
| `class_id` | `uuid` | YES | - |
| `read_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `notifications_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.permissions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `code` | `character varying` | NO | - |
| `resource` | `character varying` | NO | - |
| `action` | `character varying` | NO | - |
| `description` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `id`
- UNIQUE: `code`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `permissions_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `permissions_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.profiles`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 11

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | - |
| `full_name` | `text` | NO | - |
| `email` | `text` | NO | - |
| `status` | `USER-DEFINED` | NO | `'ACTIVE'` |
| `must_change_password` | `boolean` | NO | `false` |
| `locked_until` | `timestamp with time zone` | YES | - |
| `last_login_at` | `timestamp with time zone` | YES | - |
| `preferred_locale` | `text` | NO | `'id'` |
| `timezone` | `text` | NO | `'Asia/Jakarta'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `id` -> `public.users(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `email`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `profiles_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `profiles_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.programs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `code` | `text` | NO | - |
| `name` | `text` | NO | - |
| `is_active` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `id`
- UNIQUE: `code`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `programs_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `programs_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `programs_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.role_permissions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 2

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `role_id` | `uuid` | NO | - |
| `permission_id` | `uuid` | NO | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `permission_id` -> `public.permissions(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `role_id` -> `public.roles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `permission_id`
- PRIMARY KEY: `role_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `role_permissions_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `role_permissions_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.roles`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `code` | `character varying` | NO | - |
| `name` | `text` | NO | - |
| `description` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `id`
- UNIQUE: `code`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `roles_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `roles_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.rooms`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `code` | `character varying` | NO | - |
| `name` | `character varying` | NO | - |
| `building` | `character varying` | YES | - |
| `capacity` | `integer` | YES | - |
| `latitude` | `numeric` | YES | - |
| `longitude` | `numeric` | YES | - |
| `radius_meters` | `integer` | YES | `50` |
| `created_at` | `timestamp with time zone` | YES | `now()` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `id`
- UNIQUE: `code`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `rooms_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `rooms_staff_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.semesters`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `label` | `text` | NO | - |
| `is_active` | `boolean` | NO | `false` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `id`
- UNIQUE: `label`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `semesters_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `semesters_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `semesters_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.submissions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `assignment_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `attempt_no` | `smallint` | NO | `1` |
| `status` | `USER-DEFINED` | NO | `'SUBMITTED'` |
| `text_body` | `text` | NO | - |
| `submitted_at` | `timestamp with time zone` | NO | `now()` |
| `is_late` | `boolean` | NO | `false` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `assignment_id` -> `public.assignments(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `assignment_id`
- UNIQUE: `attempt_no`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `submissions_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.system_settings`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `key` | `character varying` | NO | - |
| `value_json` | `jsonb` | NO | - |
| `updated_by` | `uuid` | YES | - |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `updated_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `key`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `system_settings_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `system_settings_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.user_devices`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 14

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | - |
| `device_id_hash` | `text` | NO | - |
| `label` | `text` | NO | - |
| `first_seen_at` | `timestamp with time zone` | NO | `now()` |
| `last_seen_at` | `timestamp with time zone` | NO | `now()` |
| `last_ip_masked` | `text` | YES | - |
| `last_country` | `text` | YES | - |
| `last_city` | `text` | YES | - |
| `last_session_id` | `uuid` | YES | - |
| `trusted` | `boolean` | NO | `false` |
| `revoked_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `device_id_hash`
- UNIQUE: `user_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `user_devices_delete` | `DELETE` | `authenticated` | PERMISSIVE |
| `user_devices_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `user_devices_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `user_devices_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.user_identifiers`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | - |
| `type` | `USER-DEFINED` | NO | - |
| `value` | `character varying` | NO | - |
| `is_primary` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `type`
- UNIQUE: `value`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `user_identifiers_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `user_identifiers_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.user_roles`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 11

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | - |
| `role_id` | `uuid` | NO | - |
| `scope_type` | `USER-DEFINED` | NO | `'GLOBAL'` |
| `scope_id` | `uuid` | YES | - |
| `valid_from` | `timestamp with time zone` | NO | `now()` |
| `valid_until` | `timestamp with time zone` | YES | - |
| `granted_by` | `uuid` | YES | - |
| `status` | `USER-DEFINED` | NO | `'ACTIVE'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `granted_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `role_id` -> `public.roles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `user_roles_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `user_roles_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

