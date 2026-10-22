# Snapshot Skema Database SIAJAR (Single Source of Truth)

> **Tanggal Dihasilkan**: 12 Oktober 2026  
> **Lingkungan**: PGlite (PostgreSQL 16) setelah migrasi 1..39 dijalankan dari nol.  
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

### Tabel: `public.absence_request_items`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `request_id` | `uuid` | NO | - |
| `class_id` | `uuid` | NO | - |
| `session_id` | `uuid` | NO | - |
| `status` | `text` | NO | `'menunggu'` |
| `reviewed_by` | `uuid` | YES | - |
| `reviewed_at` | `timestamp with time zone` | YES | - |
| `review_note` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `request_id` -> `public.absence_requests(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `reviewed_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `session_id` -> `public.attendance_sessions(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `request_id`
- UNIQUE: `session_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `absence_request_items_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `absence_request_items_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `absence_request_items_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.absence_requests`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `type` | `text` | NO | - |
| `start_date` | `date` | NO | - |
| `end_date` | `date` | NO | - |
| `reason` | `text` | NO | - |
| `attachment_path` | `text` | YES | - |
| `cancelled_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `absence_requests_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `absence_requests_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `absence_requests_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.achievement_snapshots`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `class_id` | `uuid` | NO | - |
| `cpmk_id` | `uuid` | NO | - |
| `score_percent` | `numeric` | NO | `0.00` |
| `computed_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `cpmk_id` -> `public.cpmk(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `class_id`
- PRIMARY KEY: `cpmk_id`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `achievement_snapshots_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.activity_event_kinds`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 2

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `kind` | `text` | NO | - |
| `allowed_meta_keys` | `ARRAY` | NO | `'{}'[]` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `kind`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `activity_event_kinds_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.activity_events`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `bigint` | NO | - |
| `student_id` | `uuid` | NO | - |
| `class_id` | `uuid` | YES | - |
| `kind` | `text` | NO | - |
| `ref_type` | `text` | YES | - |
| `ref_id` | `uuid` | YES | - |
| `meta` | `jsonb` | NO | `'{}'` |
| `occurred_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `kind` -> `public.activity_event_kinds(kind)` (ON DELETE NO ACTION)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `activity_events_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.activity_logging_prefs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `enabled` | `boolean` | NO | `true` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `activity_logging_prefs_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `activity_logging_prefs_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `activity_logging_prefs_update` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.ai_content_consents`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `lecturer_id` | `uuid` | NO | - |
| `consented_at` | `timestamp with time zone` | NO | `now()` |
| `terms_version` | `text` | NO | `'v1.0'` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `lecturer_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `lecturer_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `ai_content_consents_self` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.ai_generation_jobs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `chapter_id` | `uuid` | NO | - |
| `kind` | `text` | NO | - |
| `status` | `text` | NO | `'pending'` |
| `model_used` | `text` | YES | - |
| `input_material_ids` | `ARRAY` | YES | - |
| `result_payload` | `jsonb` | YES | - |
| `error_message` | `text` | YES | - |
| `created_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `completed_at` | `timestamp with time zone` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `ai_generation_jobs_access` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.ai_reminders`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `kind` | `text` | NO | - |
| `ref_type` | `text` | YES | - |
| `ref_id` | `uuid` | YES | - |
| `payload` | `jsonb` | NO | - |
| `message` | `text` | YES | - |
| `status` | `text` | NO | `'terjadwal'` |
| `scheduled_for` | `timestamp with time zone` | NO | - |
| `sent_at` | `timestamp with time zone` | YES | - |
| `dedupe_key` | `text` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `dedupe_key`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `ai_reminders_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `ai_reminders_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.ai_usage_logs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `bigint` | NO | - |
| `student_id` | `uuid` | YES | - |
| `kind` | `text` | YES | - |
| `input_tokens` | `integer` | YES | - |
| `output_tokens` | `integer` | YES | - |
| `ok` | `boolean` | YES | `true` |
| `created_at` | `timestamp with time zone` | YES | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `ai_usage_logs_access` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.allowed_email_domains`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `domain` | `text` | NO | - |
| `role_hint` | `character varying` | YES | - |
| `is_active` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `id`
- UNIQUE: `domain`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `allowed_email_domains_admin` | `ALL` | `authenticated` | PERMISSIVE |
| `allowed_email_domains_select` | `SELECT` | `anon,authenticated` | PERMISSIVE |

---

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

### Tabel: `public.assessment_cpmk_map`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `assessment_type` | `text` | NO | - |
| `assessment_id` | `uuid` | NO | - |
| `cpmk_id` | `uuid` | NO | - |
| `weight_percent` | `numeric` | NO | `100` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `cpmk_id` -> `public.cpmk(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `assessment_id`
- UNIQUE: `assessment_type`
- UNIQUE: `cpmk_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `assessment_cpmk_map_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `assessment_cpmk_map_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.assignment_extensions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `assignment_id` | `uuid` | NO | - |
| `student_id` | `uuid` | YES | - |
| `group_id` | `uuid` | YES | - |
| `new_due_at` | `timestamp with time zone` | NO | - |
| `new_close_at` | `timestamp with time zone` | YES | - |
| `reason` | `text` | NO | - |
| `granted_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `assignment_id` -> `public.assignments(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `granted_by` -> `public.profiles(id)` (ON DELETE NO ACTION)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE NO ACTION)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `extension_all_lecturer` | `ALL` | `authenticated` | PERMISSIVE |
| `extension_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.assignments`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 21

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
| `release_at` | `timestamp with time zone` | YES | - |
| `late_policy` | `text` | NO | `'none'` |
| `late_penalty_value` | `numeric` | NO | `0` |
| `late_penalty_cap` | `numeric` | NO | `100` |
| `allow_resubmit` | `boolean` | NO | `true` |
| `max_resubmits` | `integer` | YES | - |
| `submission_mode` | `text` | NO | `'individual'` |
| `group_set_id` | `uuid` | YES | - |
| `rubric_snapshot` | `jsonb` | YES | - |
| `chapter_id` | `uuid` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `assignments_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.attendance_records`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 18

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `session_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `student_name` | `character varying` | YES | - |
| `check_in_at` | `timestamp with time zone` | NO | `now()` |
| `method` | `character varying` | NO | `'QR_DYNAMIC'` |
| `status` | `character varying` | NO | `'HADIR'` |
| `latitude` | `numeric` | YES | - |
| `longitude` | `numeric` | YES | - |
| `distance_meters` | `integer` | YES | - |
| `device_id` | `character varying` | YES | - |
| `is_late` | `boolean` | NO | `false` |
| `is_flagged_anomaly` | `boolean` | NO | `false` |
| `anomaly_reason` | `text` | YES | - |
| `verified_by` | `uuid` | YES | - |
| `notes` | `text` | YES | - |
| `source` | `text` | NO | `'manual'` |
| `absence_item_id` | `uuid` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `absence_item_id` -> `public.absence_request_items(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `session_id` -> `public.attendance_sessions(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `verified_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `session_id`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `attendance_records_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `attendance_records_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `attendance_records_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.attendance_sessions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 25

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `session_number` | `integer` | NO | - |
| `title` | `character varying` | NO | - |
| `session_date` | `date` | NO | `CURRENT_DATE` |
| `start_time` | `character varying` | NO | `'08:00'` |
| `end_time` | `character varying` | NO | `'10:30'` |
| `code` | `character varying` | NO | - |
| `is_open` | `boolean` | NO | `true` |
| `methods` | `jsonb` | NO | `'["QR_DYNAMIC", "LOCATION_GPS"]'` |
| `preset` | `character varying` | NO | `'TATAP_MUKA'` |
| `location_lat` | `numeric` | YES | - |
| `location_lng` | `numeric` | YES | - |
| `radius_meters` | `integer` | NO | `50` |
| `location_name` | `character varying` | YES | - |
| `late_threshold_minutes` | `integer` | NO | `15` |
| `qr_token_secret` | `character varying` | YES | - |
| `qr_refreshed_at` | `timestamp with time zone` | YES | - |
| `room_id` | `uuid` | YES | - |
| `created_by` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `delivery_mode` | `text` | NO | `'luring'` |
| `meeting_url` | `text` | YES | - |
| `recording_url` | `text` | YES | - |
| `recording_visible_from` | `timestamp with time zone` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `room_id` -> `public.rooms(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `session_number`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `attendance_sessions_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `attendance_sessions_write` | `ALL` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.badges`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `code` | `text` | NO | - |
| `name` | `text` | NO | - |
| `description` | `text` | NO | - |
| `icon` | `text` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `code`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `badges_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.campus_events`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 11

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `title` | `character varying` | NO | - |
| `description` | `text` | YES | - |
| `category` | `character varying` | NO | `'Seminar Akademik'` |
| `event_date` | `timestamp with time zone` | NO | `now()` |
| `location` | `character varying` | NO | `'Auditorium Utama / Daring'` |
| `organizer` | `character varying` | NO | `'Fakultas Teknik'` |
| `max_participants` | `integer` | YES | `200` |
| `badge` | `character varying` | YES | `'Terbuka'` |
| `created_by` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `campus_events_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `campus_events_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.certificates`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 11

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `class_id` | `uuid` | YES | - |
| `title` | `character varying` | NO | - |
| `issuer` | `character varying` | NO | `'Laboratorium & Fakultas Teknik UIR'` |
| `issue_date` | `character varying` | NO | - |
| `credential_id` | `character varying` | NO | - |
| `grade` | `character varying` | NO | `'Sangat Memuaskan (A)'` |
| `hours` | `character varying` | NO | `'48 Jam Pelatihan'` |
| `file_url` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `credential_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `certificates_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `certificates_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.chapter_decks`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `chapter_id` | `uuid` | NO | - |
| `title` | `text` | NO | - |
| `status` | `text` | NO | `'draf'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `chapter_decks_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `chapter_decks_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.chapter_podcasts`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 15

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `chapter_id` | `uuid` | NO | - |
| `title` | `text` | NO | - |
| `narrator` | `text` | NO | `'Pak Dosen'` |
| `script_text` | `text` | NO | - |
| `script_status` | `text` | NO | `'draf'` |
| `audio_url` | `text` | YES | - |
| `audio_duration_seconds` | `integer` | YES | `0` |
| `transcription_segments` | `jsonb` | YES | - |
| `created_by` | `uuid` | YES | - |
| `approved_by` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |
| `audio_status` | `text` | YES | `'belum'` |
| `audio_chunks` | `jsonb` | YES | `'[]'` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `approved_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `chapter_podcasts_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `chapter_podcasts_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.chapter_progress`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `chapter_id` | `uuid` | NO | - |
| `best_score` | `numeric` | YES | - |
| `attempts` | `integer` | NO | `0` |
| `passed_at` | `timestamp with time zone` | YES | - |
| `materials_done_at` | `timestamp with time zone` | YES | - |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `chapter_id`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `chapter_progress_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `chapter_progress_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.chapter_topics`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `chapter_id` | `uuid` | NO | - |
| `name` | `text` | NO | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `chapter_id`
- UNIQUE: `name`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `chapter_topics_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `chapter_topics_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.chapter_unlock_overrides`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `chapter_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `granted_by` | `uuid` | NO | - |
| `reason` | `text` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `granted_by` -> `public.profiles(id)` (ON DELETE NO ACTION)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `chapter_id`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `chapter_unlock_overrides_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `chapter_unlock_overrides_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.class_assistants`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 10

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `user_id` | `uuid` | NO | - |
| `permission` | `text` | NO | - |
| `granted_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `can_open_attendance` | `boolean` | NO | `false` |
| `can_view_similarity` | `boolean` | NO | `false` |
| `can_prepare_content` | `boolean` | NO | `false` |
| `assistant_type` | `character varying` | NO | `'ASISTEN_DOSEN'` |

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

### Tabel: `public.class_chapters`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 11

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `position` | `integer` | NO | - |
| `title` | `text` | NO | - |
| `summary` | `text` | YES | - |
| `is_optional` | `boolean` | NO | `false` |
| `pass_score` | `numeric` | YES | - |
| `target_date` | `date` | YES | - |
| `completion_rule` | `text` | NO | `'kuis'` |
| `archived_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `position`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `class_chapters_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `class_chapters_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.class_feature_flags`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `class_id` | `uuid` | NO | - |
| `feature` | `text` | NO | - |
| `enabled` | `boolean` | NO | `false` |
| `updated_by` | `uuid` | YES | - |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `updated_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `class_id`
- PRIMARY KEY: `feature`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `class_feature_flags_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `class_feature_flags_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.class_final_grades`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 10

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `numeric_score` | `numeric` | NO | `0.00` |
| `letter_grade` | `character varying` | NO | `'E'` |
| `grade_point` | `numeric` | NO | `0.00` |
| `status` | `character varying` | NO | `'DRAFT'` |
| `published_at` | `timestamp with time zone` | YES | - |
| `calculated_by` | `uuid` | YES | - |
| `calculated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `calculated_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `class_final_grades_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `class_final_grades_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.class_gamification_settings`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `class_id` | `uuid` | NO | - |
| `enabled` | `boolean` | NO | `true` |
| `leaderboard_enabled` | `boolean` | NO | `false` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `class_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `class_gamification_settings_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `class_gamification_settings_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.class_schedule_slots`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `component` | `text` | NO | - |
| `day_of_week` | `smallint` | NO | - |
| `start_time` | `time without time zone` | NO | - |
| `end_time` | `time without time zone` | NO | - |
| `room_id` | `uuid` | YES | - |
| `lecturer_id` | `uuid` | YES | - |
| `sks` | `smallint` | YES | - |
| `source_ref` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `lecturer_id` -> `public.profiles(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `room_id` -> `public.rooms(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `component`
- UNIQUE: `day_of_week`
- UNIQUE: `start_time`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `class_schedule_slots_delete` | `DELETE` | `authenticated` | PERMISSIVE |
| `class_schedule_slots_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `class_schedule_slots_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `class_schedule_slots_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.class_session_journals`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 16

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `session_id` | `uuid` | NO | - |
| `held_on` | `date` | NO | - |
| `mode` | `text` | NO | - |
| `topic` | `text` | NO | - |
| `summary` | `text` | YES | - |
| `method` | `text` | YES | - |
| `obstacles` | `text` | YES | - |
| `status` | `text` | NO | `'draf'` |
| `is_late` | `boolean` | NO | `false` |
| `finalized_by` | `uuid` | YES | - |
| `finalized_at` | `timestamp with time zone` | YES | - |
| `revision_count` | `integer` | NO | `0` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `finalized_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `session_id` -> `public.attendance_sessions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `session_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `class_session_journals_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `class_session_journals_write` | `ALL` | `authenticated` | PERMISSIVE |

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
- **Jumlah Kolom**: 17

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
| `archived_at` | `timestamp with time zone` | YES | - |
| `archived_by` | `uuid` | YES | - |
| `archive_reason` | `text` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `archived_by` -> `public.profiles(id)` (ON DELETE SET NULL)
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

### Tabel: `public.clone_jobs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `source_class_id` | `uuid` | NO | - |
| `target_class_id` | `uuid` | NO | - |
| `status` | `text` | NO | `'antre'` |
| `progress` | `integer` | NO | `0` |
| `options` | `jsonb` | NO | `'{}'` |
| `date_shift_days` | `integer` | NO | `0` |
| `error` | `text` | YES | - |
| `result_summary` | `jsonb` | NO | `'{}'` |
| `requested_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `requested_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `source_class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `target_class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `clone_jobs_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `clone_jobs_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.coding_submissions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `attempt_id` | `uuid` | NO | - |
| `question_id` | `uuid` | NO | - |
| `language` | `text` | NO | - |
| `source_code` | `text` | NO | - |
| `purpose` | `text` | NO | - |
| `status` | `text` | NO | `'antre'` |
| `compile_output` | `text` | YES | - |
| `results` | `jsonb` | YES | `'[]'` |
| `score` | `numeric` | YES | - |
| `judged_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `attempt_id` -> `public.exam_attempts(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `question_id` -> `public.quiz_questions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `coding_submissions_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `coding_submissions_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.coding_test_cases`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `question_id` | `uuid` | NO | - |
| `position` | `integer` | NO | `0` |
| `stdin` | `text` | NO | `''` |
| `expected_stdout` | `text` | NO | - |
| `is_hidden` | `boolean` | NO | `false` |
| `weight` | `integer` | NO | `1` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `question_id` -> `public.quiz_questions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `coding_test_cases_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `coding_test_cases_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.consultation_bookings`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `slot_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `topic` | `text` | NO | - |
| `status` | `text` | NO | `'dipesan'` |
| `lecturer_note` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `slot_id` -> `public.consultation_slots(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `slot_id`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `consultation_bookings_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `consultation_bookings_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `consultation_bookings_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.consultation_slots`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `lecturer_id` | `uuid` | NO | - |
| `starts_at` | `timestamp with time zone` | NO | - |
| `ends_at` | `timestamp with time zone` | NO | - |
| `place_or_link` | `text` | YES | - |
| `capacity` | `integer` | NO | `1` |
| `status` | `text` | NO | `'terbuka'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `lecturer_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `consultation_slots_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `consultation_slots_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.content_review_events`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `entity_type` | `text` | NO | - |
| `entity_id` | `uuid` | NO | - |
| `reviewer_id` | `uuid` | NO | - |
| `action` | `text` | NO | - |
| `diff` | `jsonb` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `reviewer_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `content_review_events_access` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.conversation_participants`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `conversation_id` | `uuid` | NO | - |
| `user_id` | `uuid` | NO | - |
| `last_read_at` | `timestamp with time zone` | YES | - |
| `muted` | `boolean` | NO | `false` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `conversation_id` -> `public.conversations(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `conversation_id`
- PRIMARY KEY: `user_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `conversation_participants_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.conversations`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `last_message_at` | `timestamp with time zone` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `conversations_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.course_code_aliases`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `course_id` | `uuid` | NO | - |
| `alias_code` | `text` | NO | - |
| `source` | `text` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `course_id` -> `public.courses(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `alias_code`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `course_code_aliases_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `course_code_aliases_write` | `ALL` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.cpl`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `program_id` | `uuid` | NO | - |
| `code` | `text` | NO | - |
| `description` | `text` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `program_id` -> `public.programs(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `code`
- UNIQUE: `program_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `cpl_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `cpl_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.cpmk`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `course_id` | `uuid` | NO | - |
| `code` | `text` | NO | - |
| `description` | `text` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `course_id` -> `public.courses(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `code`
- UNIQUE: `course_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `cpmk_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `cpmk_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.cpmk_cpl_map`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `cpmk_id` | `uuid` | NO | - |
| `cpl_id` | `uuid` | NO | - |
| `weight_percent` | `numeric` | NO | `100` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `cpl_id` -> `public.cpl(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `cpmk_id` -> `public.cpmk(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `cpl_id`
- PRIMARY KEY: `cpmk_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `cpmk_cpl_map_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `cpmk_cpl_map_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.daily_activities`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | - |
| `class_id` | `uuid` | YES | - |
| `date` | `date` | NO | - |
| `kind` | `text` | NO | - |
| `count` | `integer` | NO | `1` |
| `points` | `integer` | NO | `0` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `date`
- UNIQUE: `kind`
- UNIQUE: `user_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `daily_activities_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.daily_priority_dismissals`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `item_key` | `text` | NO | - |
| `day` | `date` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `day`
- PRIMARY KEY: `item_key`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `daily_priority_dismissals_access` | `ALL` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.email_allowlist`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `email` | `text` | NO | - |
| `role_hint` | `character varying` | YES | - |
| `notes` | `text` | YES | - |
| `is_active` | `boolean` | NO | `true` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `id`
- UNIQUE: `email`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `email_allowlist_admin` | `ALL` | `authenticated` | PERMISSIVE |
| `email_allowlist_select` | `SELECT` | `anon,authenticated` | PERMISSIVE |

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

### Tabel: `public.evaluation_answers`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `response_id` | `uuid` | NO | - |
| `question_id` | `uuid` | NO | - |
| `value_int` | `integer` | YES | - |
| `value_text` | `text` | YES | - |
| `is_hidden` | `boolean` | NO | `false` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `question_id` -> `public.evaluation_questions(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `response_id` -> `public.evaluation_responses(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `question_id`
- PRIMARY KEY: `response_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `eval_answers_deny_all` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.evaluation_completions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `target_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `completed_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `target_id` -> `public.evaluation_targets(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `student_id`
- PRIMARY KEY: `target_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `eval_completions_student` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.evaluation_periods`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 10

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `semester_id` | `uuid` | NO | - |
| `template_id` | `uuid` | NO | - |
| `name` | `text` | NO | - |
| `opens_at` | `timestamp with time zone` | NO | - |
| `closes_at` | `timestamp with time zone` | NO | - |
| `status` | `text` | NO | `'draf'` |
| `require_before_final_grades` | `boolean` | NO | `false` |
| `created_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `semester_id` -> `public.semesters(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `template_id` -> `public.evaluation_templates(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `eval_periods_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `eval_periods_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.evaluation_questions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `template_id` | `uuid` | NO | - |
| `position` | `integer` | NO | - |
| `category` | `text` | YES | - |
| `text` | `text` | NO | - |
| `kind` | `text` | NO | - |
| `required` | `boolean` | NO | `true` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `template_id` -> `public.evaluation_templates(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `eval_questions_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `eval_questions_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.evaluation_responses`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `target_id` | `uuid` | NO | - |
| `submitted_on` | `date` | NO | `CURRENT_DATE` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `target_id` -> `public.evaluation_targets(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `eval_responses_deny_all` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.evaluation_targets`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `period_id` | `uuid` | NO | - |
| `class_id` | `uuid` | NO | - |
| `lecturer_id` | `uuid` | NO | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `lecturer_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `period_id` -> `public.evaluation_periods(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `lecturer_id`
- UNIQUE: `period_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `eval_targets_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.evaluation_templates`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `name` | `text` | NO | - |
| `created_by` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `eval_templates_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `eval_templates_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.event_registrations`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `event_id` | `uuid` | NO | - |
| `user_id` | `uuid` | NO | - |
| `registered_at` | `timestamp with time zone` | NO | `now()` |
| `status` | `character varying` | NO | `'REGISTERED'` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `event_id` -> `public.campus_events(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `event_id`
- UNIQUE: `user_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `event_registrations_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `event_registrations_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_access_tokens`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `quiz_id` | `uuid` | NO | - |
| `token` | `text` | NO | - |
| `rotated_at` | `timestamp with time zone` | NO | `now()` |
| `rotate_every_minutes` | `integer` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `quiz_id` -> `public.quizzes(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `quiz_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_access_tokens_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `exam_access_tokens_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_answers`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 13

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `attempt_id` | `uuid` | NO | - |
| `question_id` | `uuid` | NO | - |
| `selected_option_id` | `uuid` | YES | - |
| `essay_text` | `text` | YES | - |
| `answer_data` | `jsonb` | NO | `'{}'` |
| `is_draft` | `boolean` | NO | `true` |
| `last_saved_at` | `timestamp with time zone` | NO | `now()` |
| `score_earned` | `numeric` | NO | `0.00` |
| `graded_by` | `uuid` | YES | - |
| `graded_at` | `timestamp with time zone` | YES | - |
| `revision` | `integer` | NO | `0` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `attempt_id` -> `public.exam_attempts(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `graded_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `question_id` -> `public.quiz_questions(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `selected_option_id` -> `public.quiz_options(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`
- UNIQUE: `attempt_id`
- UNIQUE: `question_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_answers_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `exam_answers_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_attempts`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 22

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `quiz_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `student_name` | `character varying` | YES | - |
| `started_at` | `timestamp with time zone` | NO | `now()` |
| `deadline_at` | `timestamp with time zone` | NO | `(now() + '01:00:00')` |
| `finished_at` | `timestamp with time zone` | YES | - |
| `total_score` | `numeric` | NO | `0.00` |
| `max_score` | `numeric` | NO | `100.00` |
| `is_graded` | `boolean` | NO | `true` |
| `violations_count` | `integer` | NO | `0` |
| `is_terminated` | `boolean` | NO | `false` |
| `status` | `character varying` | NO | `'IN_PROGRESS'` |
| `answers_json` | `jsonb` | NO | `'{}'` |
| `ai_grading_drafts` | `jsonb` | NO | `'{}'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `expires_at` | `timestamp with time zone` | YES | - |
| `extra_time_seconds` | `integer` | NO | `0` |
| `last_heartbeat_at` | `timestamp with time zone` | YES | - |
| `active_session_id` | `uuid` | YES | - |
| `auto_submitted` | `boolean` | NO | `false` |
| `submit_idempotency_key` | `text` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `quiz_id` -> `public.quizzes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_attempts_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `exam_attempts_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `exam_attempts_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_disputes`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 13

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `attempt_id` | `uuid` | NO | - |
| `exam_id` | `uuid` | NO | - |
| `question_id` | `uuid` | YES | - |
| `student_id` | `uuid` | NO | - |
| `student_name` | `character varying` | YES | - |
| `reason` | `text` | NO | - |
| `status` | `character varying` | NO | `'PENDING'` |
| `lecturer_feedback` | `text` | YES | - |
| `adjusted_points` | `numeric` | YES | - |
| `submitted_at` | `timestamp with time zone` | NO | `now()` |
| `resolved_at` | `timestamp with time zone` | YES | - |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `attempt_id` -> `public.exam_attempts(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `exam_id` -> `public.quizzes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `question_id` -> `public.quiz_questions(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_disputes_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `exam_disputes_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `exam_disputes_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_events`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `bigint` | NO | - |
| `attempt_id` | `uuid` | NO | - |
| `kind` | `text` | NO | - |
| `meta` | `jsonb` | NO | `'{}'` |
| `client_time` | `timestamp with time zone` | YES | - |
| `server_time` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `attempt_id` -> `public.exam_attempts(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_events_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `exam_events_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_item_stats`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 10

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `quiz_id` | `uuid` | NO | - |
| `question_id` | `uuid` | NO | - |
| `n` | `integer` | NO | `0` |
| `difficulty_p` | `numeric` | YES | - |
| `discrimination_d` | `numeric` | YES | - |
| `point_biserial` | `numeric` | YES | - |
| `option_counts` | `jsonb` | NO | `'{}'` |
| `avg_time_seconds` | `numeric` | YES | - |
| `omit_rate` | `numeric` | YES | - |
| `computed_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `question_id` -> `public.quiz_questions(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `quiz_id` -> `public.quizzes(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `question_id`
- PRIMARY KEY: `quiz_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_item_stats_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_makeup_participants`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `quiz_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `reason` | `text` | NO | - |
| `approved_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `approved_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `quiz_id` -> `public.quizzes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `quiz_id`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_makeup_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `exam_makeup_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_proctor_interventions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `attempt_id` | `uuid` | YES | - |
| `exam_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `student_name` | `character varying` | YES | - |
| `proctor_user_id` | `uuid` | NO | - |
| `actor_name` | `character varying` | YES | - |
| `action_type` | `character varying` | NO | - |
| `reason` | `text` | NO | - |
| `value_before` | `text` | YES | - |
| `value_after` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `attempt_id` -> `public.exam_attempts(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `exam_id` -> `public.quizzes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `proctor_user_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_proctor_interventions_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `exam_proctor_interventions_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_summary_stats`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 10

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `quiz_id` | `uuid` | NO | - |
| `n` | `integer` | NO | `0` |
| `mean` | `numeric` | YES | - |
| `median` | `numeric` | YES | - |
| `stddev` | `numeric` | YES | - |
| `min` | `numeric` | YES | - |
| `max` | `numeric` | YES | - |
| `kr20` | `numeric` | YES | - |
| `histogram` | `jsonb` | NO | `'[]'` |
| `computed_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `quiz_id` -> `public.quizzes(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `quiz_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_summary_stats_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.exam_telemetry_events`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 11

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `attempt_id` | `uuid` | YES | - |
| `exam_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `student_name` | `character varying` | YES | - |
| `event_type` | `character varying` | NO | - |
| `duration_seconds` | `integer` | YES | `0` |
| `details` | `text` | YES | - |
| `client_timestamp` | `timestamp with time zone` | NO | `now()` |
| `metadata` | `jsonb` | NO | `'{}'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `attempt_id` -> `public.exam_attempts(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `exam_id` -> `public.quizzes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `exam_telemetry_events_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `exam_telemetry_events_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.feedback_comments`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `submission_id` | `uuid` | NO | - |
| `author_id` | `uuid` | NO | - |
| `file_path` | `text` | YES | - |
| `anchor` | `jsonb` | YES | - |
| `body` | `text` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `author_id` -> `public.profiles(id)` (ON DELETE NO ACTION)
- FOREIGN KEY: `submission_id` -> `public.submissions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `feedback_comments_author` | `ALL` | `authenticated` | PERMISSIVE |
| `feedback_comments_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.flashcard_review_log`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `flashcard_id` | `uuid` | NO | - |
| `box_before` | `integer` | NO | - |
| `box_after` | `integer` | NO | - |
| `rating` | `integer` | NO | - |
| `review_duration_ms` | `integer` | YES | - |
| `reviewed_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `flashcard_id` -> `public.flashcards(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `flashcard_review_log_student_only` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.flashcard_reviews`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `flashcard_id` | `uuid` | NO | - |
| `box` | `integer` | NO | `1` |
| `next_review_at` | `timestamp with time zone` | NO | `now()` |
| `repetitions` | `integer` | NO | `0` |
| `last_rating` | `integer` | YES | - |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `flashcard_id` -> `public.flashcards(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `flashcard_id`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `flashcard_reviews_student_only` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.flashcards`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `deck_id` | `uuid` | NO | - |
| `front` | `text` | NO | - |
| `back` | `text` | NO | - |
| `source_material_id` | `uuid` | YES | - |
| `source_segment` | `text` | YES | - |
| `grounding_score` | `integer` | YES | `100` |
| `status` | `text` | NO | `'draf'` |
| `created_by` | `uuid` | YES | - |
| `reviewer_id` | `uuid` | YES | - |
| `reviewed_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `deck_id` -> `public.chapter_decks(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `reviewer_id` -> `public.profiles(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `source_material_id` -> `public.materials(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `flashcards_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `flashcards_select` | `SELECT` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.grade_components`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `name` | `character varying` | NO | - |
| `weight_percent` | `numeric` | NO | - |
| `created_by` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `name`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `grade_components_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `grade_components_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.grade_dispute_messages`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `dispute_id` | `uuid` | NO | - |
| `author_id` | `uuid` | NO | - |
| `body` | `text` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `author_id` -> `public.profiles(id)` (ON DELETE NO ACTION)
- FOREIGN KEY: `dispute_id` -> `public.grade_disputes(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `dispute_messages_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `dispute_messages_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.grade_disputes`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 15

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `target_type` | `text` | NO | - |
| `target_id` | `uuid` | NO | - |
| `reason` | `text` | NO | - |
| `evidence_path` | `text` | YES | - |
| `status` | `text` | NO | `'diajukan'` |
| `response` | `text` | YES | - |
| `old_score` | `numeric` | YES | - |
| `new_score` | `numeric` | YES | - |
| `resolved_by` | `uuid` | YES | - |
| `resolved_at` | `timestamp with time zone` | YES | - |
| `linked_change_request_id` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE NO ACTION)
- FOREIGN KEY: `linked_change_request_id` -> `public.grade_change_requests(id)` (ON DELETE NO ACTION)
- FOREIGN KEY: `resolved_by` -> `public.profiles(id)` (ON DELETE NO ACTION)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE NO ACTION)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `disputes_insert_student` | `INSERT` | `authenticated` | PERMISSIVE |
| `disputes_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `disputes_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.grade_exemptions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 13

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `item_id` | `uuid` | YES | - |
| `component_id` | `uuid` | YES | - |
| `reason` | `text` | NO | - |
| `status` | `character varying` | NO | `'PENDING'` |
| `requested_by` | `uuid` | NO | - |
| `approved_by` | `uuid` | YES | - |
| `approved_at` | `timestamp with time zone` | YES | - |
| `rejection_reason` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `approved_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `component_id` -> `public.grade_components(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `requested_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `grade_exemptions_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `grade_exemptions_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `grade_exemptions_update` | `UPDATE` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.grade_items`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `component_id` | `uuid` | YES | - |
| `title` | `character varying` | NO | - |
| `max_score` | `numeric` | NO | `100.00` |
| `status` | `character varying` | NO | `'ACTIVE'` |
| `created_by` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `component_id` -> `public.grade_components(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `grade_items_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `grade_items_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.grade_scale_bands`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `scale_id` | `uuid` | NO | - |
| `letter` | `character varying` | NO | - |
| `grade_point` | `numeric` | NO | - |
| `min_score` | `numeric` | NO | - |
| `max_score` | `numeric` | NO | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `scale_id` -> `public.grade_scales(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `letter`
- UNIQUE: `scale_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `grade_scale_bands_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `grade_scale_bands_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.grade_scales`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `name` | `character varying` | NO | - |
| `is_default` | `boolean` | NO | `false` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- PRIMARY KEY: `id`
- UNIQUE: `name`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `grade_scales_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `grade_scales_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.gradebook_locks`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `is_locked` | `boolean` | NO | `true` |
| `locked_by` | `uuid` | YES | - |
| `locked_at` | `timestamp with time zone` | NO | `now()` |
| `expires_at` | `timestamp with time zone` | YES | - |
| `reason` | `text` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `locked_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `gradebook_locks_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `gradebook_locks_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.gradebook_unlock_requests`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 11

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `requested_by` | `uuid` | NO | - |
| `reason` | `text` | NO | - |
| `status` | `character varying` | NO | `'PENDING'` |
| `approved_by` | `uuid` | YES | - |
| `approved_at` | `timestamp with time zone` | YES | - |
| `executed_by` | `uuid` | YES | - |
| `executed_at` | `timestamp with time zone` | YES | - |
| `expires_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `approved_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `executed_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `requested_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `gradebook_unlock_requests_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `gradebook_unlock_requests_write` | `ALL` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.group_members`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `group_id` | `uuid` | NO | - |
| `set_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `role` | `text` | NO | `'member'` |
| `joined_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `group_id` -> `public.groups(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `set_id` -> `public.group_sets(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE NO ACTION)
- PRIMARY KEY: `group_id`
- PRIMARY KEY: `student_id`
- UNIQUE: `set_id`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `group_members_lecturer` | `ALL` | `authenticated` | PERMISSIVE |
| `group_members_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.group_sets`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `name` | `text` | NO | - |
| `formation` | `text` | NO | - |
| `min_size` | `integer` | NO | `2` |
| `max_size` | `integer` | NO | `5` |
| `lock_at` | `timestamp with time zone` | YES | - |
| `created_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE NO ACTION)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `name`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `group_sets_lecturer` | `ALL` | `authenticated` | PERMISSIVE |
| `group_sets_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.groups`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `set_id` | `uuid` | NO | - |
| `name` | `text` | NO | - |
| `join_code` | `text` | NO | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `set_id` -> `public.group_sets(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `join_code`
- UNIQUE: `name`
- UNIQUE: `set_id`
- UNIQUE: `set_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `groups_lecturer` | `ALL` | `authenticated` | PERMISSIVE |
| `groups_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.institution_policies`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `key` | `text` | NO | - |
| `value` | `jsonb` | NO | - |
| `description` | `text` | YES | - |
| `updated_by` | `uuid` | YES | - |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `updated_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `key`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `institution_policies_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `institution_policies_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `institution_policies_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.journal_cpmk`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 2

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `journal_id` | `uuid` | NO | - |
| `cpmk_id` | `uuid` | NO | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `cpmk_id` -> `public.cpmk(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `journal_id` -> `public.class_session_journals(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `cpmk_id`
- PRIMARY KEY: `journal_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `journal_cpmk_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `journal_cpmk_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.journal_materials`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `journal_id` | `uuid` | NO | - |
| `material_id` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `journal_id` -> `public.class_session_journals(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `material_id` -> `public.materials(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `journal_id`
- PRIMARY KEY: `material_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `journal_materials_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `journal_materials_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.leave_permits`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 15

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `student_name` | `character varying` | YES | - |
| `class_id` | `uuid` | YES | - |
| `course_title` | `character varying` | NO | - |
| `session_number` | `integer` | NO | `1` |
| `permit_type` | `character varying` | NO | `'SAKIT'` |
| `permit_date` | `date` | NO | `CURRENT_DATE` |
| `reason` | `text` | NO | - |
| `attachment_url` | `text` | YES | - |
| `status` | `character varying` | NO | `'MENUNGGU VERIFIKASI'` |
| `reviewed_by` | `uuid` | YES | - |
| `reviewed_at` | `timestamp with time zone` | YES | - |
| `review_note` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `reviewed_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `leave_permits_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `leave_permits_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `leave_permits_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.library_items`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 14

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `isbn` | `character varying` | YES | - |
| `title` | `character varying` | NO | - |
| `author` | `character varying` | NO | - |
| `category` | `character varying` | NO | `'Modul Kuliah'` |
| `year` | `character varying` | NO | `'2026'` |
| `pages` | `integer` | NO | `100` |
| `badge` | `character varying` | NO | `'Modul Internal'` |
| `file_url` | `text` | YES | - |
| `file_size` | `character varying` | YES | - |
| `total_copies` | `integer` | NO | `1` |
| `available_copies` | `integer` | NO | `1` |
| `created_by` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `library_items_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `library_items_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.library_loans`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `item_id` | `uuid` | NO | - |
| `user_id` | `uuid` | NO | - |
| `borrowed_at` | `timestamp with time zone` | NO | `now()` |
| `due_at` | `timestamp with time zone` | NO | `(now() + '14 days')` |
| `returned_at` | `timestamp with time zone` | YES | - |
| `status` | `character varying` | NO | `'BORROWED'` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `item_id` -> `public.library_items(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `library_loans_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `library_loans_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.live_poll_votes`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `poll_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `answer` | `jsonb` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `poll_id` -> `public.live_polls(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `poll_id`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `live_poll_votes_student_access` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.live_polls`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 14

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `session_id` | `uuid` | YES | - |
| `created_by` | `uuid` | NO | - |
| `question` | `text` | NO | - |
| `kind` | `text` | NO | - |
| `options` | `jsonb` | YES | - |
| `is_anonymous` | `boolean` | NO | `true` |
| `is_quiz` | `boolean` | NO | `false` |
| `correct_option_ids` | `ARRAY` | YES | - |
| `status` | `text` | NO | `'draf'` |
| `opened_at` | `timestamp with time zone` | YES | - |
| `closed_at` | `timestamp with time zone` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `session_id` -> `public.attendance_sessions(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `live_polls_manage` | `ALL` | `authenticated` | PERMISSIVE |
| `live_polls_select` | `SELECT` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.material_progress`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `material_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `status` | `text` | NO | `'dibuka'` |
| `first_opened_at` | `timestamp with time zone` | NO | `now()` |
| `completed_at` | `timestamp with time zone` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `material_id` -> `public.materials(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `material_id`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `material_progress_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `material_progress_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.materials`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

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
| `release_at` | `timestamp with time zone` | YES | - |
| `unlock_after_material_id` | `uuid` | YES | - |
| `require_completion` | `boolean` | NO | `false` |
| `chapter_id` | `uuid` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `unlock_after_material_id` -> `public.materials(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `materials_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.message_reports`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `message_id` | `uuid` | NO | - |
| `reporter_id` | `uuid` | NO | - |
| `reason` | `text` | NO | - |
| `snapshot` | `jsonb` | NO | - |
| `status` | `text` | NO | `'baru'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `message_id` -> `public.messages(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `reporter_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `message_reports_access` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.messages`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `conversation_id` | `uuid` | NO | - |
| `sender_id` | `uuid` | NO | - |
| `body` | `text` | NO | - |
| `attachment_path` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `edited_at` | `timestamp with time zone` | YES | - |
| `deleted_at` | `timestamp with time zone` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `conversation_id` -> `public.conversations(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `sender_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `messages_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `messages_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `messages_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.notification_preferences`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `user_id` | `uuid` | NO | - |
| `channels` | `jsonb` | NO | `'{"email": true, "in_app": true, "whatsapp": false}'` |
| `events` | `jsonb` | NO | `'{"forum_reply": true, "early_warning": true, "exam_upcoming": true, "assignment_due": true, "assignment_new": true, "grade_published": true, "attendance_closing": true}'` |
| `phone_number` | `character varying` | YES | - |
| `quiet_hours_start` | `character varying` | YES | `'22:00'` |
| `quiet_hours_end` | `character varying` | YES | `'06:00'` |
| `backup_email` | `character varying` | YES | - |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `user_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `notification_preferences_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `notification_preferences_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `notification_preferences_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.notifications`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 13

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
| `dedup_key` | `character varying` | YES | - |
| `target_url` | `text` | YES | - |
| `snoozed_until` | `timestamp with time zone` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `notifications_insert_authenticated` | `INSERT` | `authenticated` | PERMISSIVE |
| `notifications_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `notifications_update_own` | `UPDATE` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.podcast_progress`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `podcast_id` | `uuid` | NO | - |
| `last_position_seconds` | `integer` | NO | `0` |
| `is_completed` | `boolean` | NO | `false` |
| `completed_at` | `timestamp with time zone` | YES | - |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `podcast_id` -> `public.chapter_podcasts(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `podcast_id`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `podcast_progress_student_only` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.portfolio_items`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `portfolio_id` | `uuid` | NO | - |
| `title` | `character varying` | NO | - |
| `artifact_url` | `text` | NO | - |
| `description` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `portfolio_id` -> `public.portfolios(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `portfolio_items_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `portfolio_items_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.portfolios`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `title` | `character varying` | NO | - |
| `course_name` | `character varying` | NO | - |
| `project_type` | `character varying` | NO | `'Capstone Project'` |
| `description` | `text` | NO | - |
| `tech_stack` | `jsonb` | NO | `'[]'` |
| `status` | `character varying` | NO | `'Terverifikasi Dosen'` |
| `repo_url` | `text` | YES | - |
| `demo_url` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `portfolios_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `portfolios_write` | `ALL` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.question_import_jobs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 12

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `format` | `text` | NO | - |
| `file_path` | `text` | YES | - |
| `total_count` | `integer` | NO | `0` |
| `valid_count` | `integer` | NO | `0` |
| `warning_count` | `integer` | NO | `0` |
| `error_count` | `integer` | NO | `0` |
| `status` | `text` | NO | `'draf'` |
| `summary` | `jsonb` | NO | `'{}'` |
| `errors` | `jsonb` | NO | `'[]'` |
| `created_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `question_import_jobs_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `question_import_jobs_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.quiz_attempt_topic_results`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `attempt_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `topic_id` | `uuid` | NO | - |
| `answered` | `integer` | NO | - |
| `correct` | `integer` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `attempt_id` -> `public.exam_attempts(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `topic_id` -> `public.chapter_topics(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `attempt_id`
- PRIMARY KEY: `topic_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `quiz_attempt_topic_results_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.quiz_options`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `question_id` | `uuid` | NO | - |
| `option_text` | `text` | NO | - |
| `order_index` | `integer` | NO | `0` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `question_id` -> `public.quiz_questions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `quiz_options_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `quiz_options_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.quiz_question_keys`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `question_id` | `uuid` | NO | - |
| `correct_option_id` | `uuid` | YES | - |
| `correct_data` | `jsonb` | NO | `'{}'` |
| `explanation` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `correct_option_id` -> `public.quiz_options(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `question_id` -> `public.quiz_questions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `question_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `quiz_question_keys_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `quiz_question_keys_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.quiz_questions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 21

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `quiz_id` | `uuid` | YES | - |
| `question_text` | `text` | NO | - |
| `question_type` | `character varying` | NO | `'MULTIPLE_CHOICE'` |
| `points` | `numeric` | NO | `10.00` |
| `order_index` | `integer` | NO | `0` |
| `topic_tag` | `character varying` | YES | - |
| `cpl_tag` | `character varying` | YES | - |
| `difficulty` | `character varying` | YES | `'MEDIUM'` |
| `rubric` | `text` | YES | - |
| `starter_code` | `text` | YES | - |
| `programming_language` | `character varying` | YES | - |
| `explanation` | `text` | YES | - |
| `metadata` | `jsonb` | NO | `'{}'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `code_language` | `text` | YES | - |
| `time_limit_ms` | `integer` | YES | `2000` |
| `memory_limit_mb` | `integer` | YES | `128` |
| `compare_mode` | `text` | YES | `'trim'` |
| `needs_revision` | `boolean` | NO | `false` |
| `topic_id` | `uuid` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `quiz_id` -> `public.quizzes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `topic_id` -> `public.chapter_topics(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `quiz_questions_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `quiz_questions_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.quizzes`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 33

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `title` | `character varying` | NO | - |
| `description` | `text` | NO | `''` |
| `exam_type` | `character varying` | NO | `'KUIS'` |
| `duration_minutes` | `integer` | NO | `60` |
| `start_time` | `timestamp with time zone` | NO | `now()` |
| `end_time` | `timestamp with time zone` | NO | `(now() + '7 days')` |
| `max_attempts` | `integer` | NO | `1` |
| `shuffle_questions` | `boolean` | NO | `true` |
| `shuffle_options` | `boolean` | NO | `true` |
| `is_published` | `boolean` | NO | `false` |
| `strict_proctoring` | `boolean` | NO | `false` |
| `proctoring_level` | `character varying` | NO | `'STANDARD'` |
| `max_violations` | `integer` | NO | `5` |
| `require_fullscreen` | `boolean` | NO | `true` |
| `block_copy_paste` | `boolean` | NO | `true` |
| `require_attendance` | `boolean` | NO | `false` |
| `passcode` | `character varying` | YES | - |
| `kkm` | `integer` | NO | `70` |
| `result_display` | `character varying` | NO | `'IMMEDIATE'` |
| `status` | `character varying` | NO | `'PUBLISHED'` |
| `total_points` | `numeric` | NO | `100.00` |
| `created_by` | `uuid` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `release_at` | `timestamp with time zone` | YES | - |
| `access_mode` | `text` | NO | `'open'` |
| `parent_quiz_id` | `uuid` | YES | - |
| `kind` | `text` | NO | `'utama'` |
| `score_cap` | `numeric` | YES | - |
| `combine_policy` | `text` | NO | `'tertinggi'` |
| `chapter_id` | `uuid` | YES | - |
| `peer_help_blocked` | `boolean` | NO | `false` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `created_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `parent_quiz_id` -> `public.quizzes(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `quizzes_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `quizzes_write` | `ALL` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.rubric_criteria`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `rubric_id` | `uuid` | NO | - |
| `position` | `integer` | NO | - |
| `title` | `text` | NO | - |
| `description` | `text` | YES | - |
| `max_points` | `numeric` | NO | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `rubric_id` -> `public.rubrics(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `rubric_criteria_owner` | `ALL` | `authenticated` | PERMISSIVE |
| `rubric_criteria_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.rubric_levels`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `criterion_id` | `uuid` | NO | - |
| `position` | `integer` | NO | - |
| `label` | `text` | NO | - |
| `description` | `text` | YES | - |
| `points` | `numeric` | NO | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `criterion_id` -> `public.rubric_criteria(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `rubric_levels_owner` | `ALL` | `authenticated` | PERMISSIVE |
| `rubric_levels_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.rubric_scores`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `submission_id` | `uuid` | NO | - |
| `criterion_id` | `uuid` | NO | - |
| `level_label` | `text` | YES | - |
| `points` | `numeric` | NO | - |
| `comment` | `text` | YES | - |
| `graded_by` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `graded_by` -> `public.profiles(id)` (ON DELETE NO ACTION)
- FOREIGN KEY: `submission_id` -> `public.submissions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `criterion_id`
- PRIMARY KEY: `submission_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `rubric_scores_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `rubric_scores_staff` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.rubrics`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `owner_id` | `uuid` | NO | - |
| `title` | `text` | NO | - |
| `description` | `text` | YES | - |
| `is_template` | `boolean` | NO | `false` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `owner_id` -> `public.profiles(id)` (ON DELETE NO ACTION)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `rubrics_owner` | `ALL` | `authenticated` | PERMISSIVE |
| `rubrics_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.scheduled_notifications`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `user_id` | `uuid` | NO | - |
| `kind` | `text` | NO | - |
| `payload` | `jsonb` | NO | `'{}'` |
| `send_at` | `timestamp with time zone` | NO | `now()` |
| `sent_at` | `timestamp with time zone` | YES | - |
| `dedupe_key` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `user_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `dedupe_key`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `scheduled_notifications_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `scheduled_notifications_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `scheduled_notifications_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.semester_recaps`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `semester_id` | `text` | NO | - |
| `payload` | `jsonb` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `semester_id`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `semester_recaps_self` | `ALL` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.similarity_pairs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `run_id` | `uuid` | NO | - |
| `submission_a` | `uuid` | NO | - |
| `submission_b` | `uuid` | NO | - |
| `score` | `numeric` | NO | - |
| `matched_segments` | `jsonb` | YES | `'[]'` |
| `review_status` | `text` | NO | `'baru'` |
| `review_note` | `text` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `run_id` -> `public.similarity_runs(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `submission_a` -> `public.submissions(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `submission_b` -> `public.submissions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `run_id`
- PRIMARY KEY: `submission_a`
- PRIMARY KEY: `submission_b`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `similarity_pairs_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `similarity_pairs_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.similarity_runs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `assignment_id` | `uuid` | NO | - |
| `started_by` | `uuid` | NO | - |
| `scope` | `text` | NO | `'class'` |
| `status` | `text` | NO | `'antre'` |
| `threshold` | `numeric` | NO | `0.60` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `finished_at` | `timestamp with time zone` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `assignment_id` -> `public.assignments(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `started_by` -> `public.profiles(id)` (ON DELETE RESTRICT)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `similarity_runs_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.skill_exchange_optin`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `class_id` | `uuid` | NO | - |
| `is_opted_in` | `boolean` | NO | `true` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `class_id`
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `skill_exchange_optin_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `skill_exchange_optin_update` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.skill_reports`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `request_id` | `uuid` | YES | - |
| `response_id` | `uuid` | YES | - |
| `reporter_id` | `uuid` | NO | - |
| `reason` | `text` | NO | - |
| `status` | `text` | NO | `'menunggu'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `reporter_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `request_id` -> `public.skill_requests(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `response_id` -> `public.skill_responses(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `skill_reports_access` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.skill_requests`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 9

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `class_id` | `uuid` | NO | - |
| `chapter_id` | `uuid` | NO | - |
| `topic_id` | `uuid` | YES | - |
| `student_id` | `uuid` | NO | - |
| `title` | `text` | NO | - |
| `description` | `text` | NO | - |
| `status` | `text` | NO | `'terbuka'` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `chapter_id` -> `public.class_chapters(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `topic_id` -> `public.chapter_topics(id)` (ON DELETE SET NULL)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `skill_requests_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `skill_requests_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `skill_requests_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.skill_responses`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 6

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `request_id` | `uuid` | NO | - |
| `responder_id` | `uuid` | NO | - |
| `content` | `text` | NO | - |
| `is_accepted` | `boolean` | NO | `false` |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `request_id` -> `public.skill_requests(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `responder_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `skill_responses_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `skill_responses_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.student_badges`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `badge_code` | `character varying` | NO | - |
| `badge_name` | `character varying` | NO | - |
| `description` | `text` | YES | - |
| `awarded_at` | `timestamp with time zone` | NO | `now()` |
| `class_id` | `uuid` | YES | - |
| `earned_at` | `timestamp with time zone` | YES | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `badge_code`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `student_badges_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `student_badges_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.student_gamification_prefs`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `show_on_leaderboard` | `boolean` | NO | `false` |
| `display_alias` | `text` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `student_gamification_prefs_access` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.student_requests`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 10

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `type` | `character varying` | NO | - |
| `details` | `jsonb` | NO | `'{}'` |
| `attachment_path` | `text` | YES | - |
| `status` | `character varying` | NO | `'MENUNGGU'` |
| `staff_note` | `text` | YES | - |
| `result_path` | `text` | YES | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `student_requests_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `student_requests_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `student_requests_update` | `UPDATE` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.student_risk_evaluations`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 18

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `class_id` | `uuid` | NO | - |
| `risk_level` | `character varying` | NO | - |
| `previous_risk_level` | `character varying` | YES | - |
| `score` | `numeric` | NO | `100.00` |
| `attendance_percent` | `numeric` | NO | `100.00` |
| `missing_assignments_count` | `integer` | NO | `0` |
| `late_submissions_count` | `integer` | NO | `0` |
| `average_grade` | `numeric` | YES | - |
| `grade_trend` | `character varying` | NO | `'STABIL'` |
| `material_progress_percent` | `numeric` | NO | `100.00` |
| `indicators` | `jsonb` | NO | `'[]'` |
| `recommendations` | `jsonb` | NO | `'[]'` |
| `last_notified_risk_level` | `character varying` | YES | - |
| `evaluated_at` | `timestamp with time zone` | NO | `now()` |
| `created_at` | `timestamp with time zone` | NO | `now()` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `class_id`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `student_risk_evaluations_select` | `SELECT` | `authenticated` | PERMISSIVE |
| `student_risk_evaluations_write` | `ALL` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.study_streaks`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `current_days` | `integer` | NO | `0` |
| `best_days` | `integer` | NO | `0` |
| `last_active_on` | `date` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `study_streaks_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.submission_fingerprints`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 3

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `submission_id` | `uuid` | NO | - |
| `kind` | `text` | NO | - |
| `hashes` | `ARRAY` | NO | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `submission_id` -> `public.submissions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `kind`
- PRIMARY KEY: `submission_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `submission_fingerprints_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.submission_member_adjustments`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 4

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `submission_id` | `uuid` | NO | - |
| `student_id` | `uuid` | NO | - |
| `contribution_percent` | `numeric` | NO | `100` |
| `note` | `text` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE NO ACTION)
- FOREIGN KEY: `submission_id` -> `public.submissions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `student_id`
- PRIMARY KEY: `submission_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `adjustments_lecturer` | `ALL` | `authenticated` | PERMISSIVE |
| `adjustments_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.submission_versions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 5

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `submission_id` | `uuid` | NO | - |
| `attempt_no` | `integer` | NO | - |
| `file_paths` | `jsonb` | NO | `'[]'` |
| `submitted_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `submission_id` -> `public.submissions(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `attempt_no`
- UNIQUE: `submission_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `submission_versions_insert` | `INSERT` | `authenticated` | PERMISSIVE |
| `submission_versions_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

### Tabel: `public.submissions`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 15

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
| `late_minutes` | `integer` | NO | `0` |
| `raw_score` | `numeric` | YES | - |
| `penalty_percent` | `numeric` | NO | `0` |
| `penalty_waived` | `boolean` | NO | `false` |
| `penalty_waived_reason` | `text` | YES | - |
| `group_id` | `uuid` | YES | - |
| `submitted_by` | `uuid` | YES | - |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `assignment_id` -> `public.assignments(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE RESTRICT)
- FOREIGN KEY: `submitted_by` -> `public.profiles(id)` (ON DELETE NO ACTION)
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

### Tabel: `public.topic_mastery`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 7

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `student_id` | `uuid` | NO | - |
| `topic_id` | `uuid` | NO | - |
| `answered` | `integer` | NO | `0` |
| `correct` | `integer` | NO | `0` |
| `attempts_counted` | `integer` | NO | `0` |
| `level` | `text` | NO | `'belum_cukup_data'` |
| `updated_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- FOREIGN KEY: `topic_id` -> `public.chapter_topics(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `student_id`
- PRIMARY KEY: `topic_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `topic_mastery_select` | `SELECT` | `authenticated` | PERMISSIVE |

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

### Tabel: `public.xp_events`

- **Status Row Level Security (RLS)**: AKTIF (Enabled)
- **Jumlah Kolom**: 8

| Nama Kolom | Tipe Data | Nullable | Nilai Default |
|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `student_id` | `uuid` | NO | - |
| `class_id` | `uuid` | YES | - |
| `kind` | `text` | NO | - |
| `points` | `integer` | NO | - |
| `ref_type` | `text` | NO | - |
| `ref_id` | `uuid` | NO | - |
| `created_at` | `timestamp with time zone` | NO | `now()` |

**Batasan Integritas & Foreign Key**:
- FOREIGN KEY: `class_id` -> `public.classes(id)` (ON DELETE SET NULL)
- FOREIGN KEY: `student_id` -> `public.profiles(id)` (ON DELETE CASCADE)
- PRIMARY KEY: `id`
- UNIQUE: `kind`
- UNIQUE: `ref_id`
- UNIQUE: `ref_type`
- UNIQUE: `student_id`

**Kebijakan RLS (Security Policies)**:
| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |
|---|---|---|---|
| `xp_events_select` | `SELECT` | `authenticated` | PERMISSIVE |

---

