# Dokumen Desain Teknis Domain 3: Evaluasi Akademik, Nilai & Gradebook (Fase 3B)

> **Status Dokumen**: DESAIN SAJA (*Design Only*) — Menunggu Persetujuan Pengguna Sebelum Penulisan Kode / Migrasi.  
> **Tanggal**: 12 Oktober 2026  
> **Sumber Kebenaran Tunggal (*Single Source of Truth*)**: [`docs/schema-snapshot.md`](file:///c:/Users/ACER/Downloads/implementasi/docs/schema-snapshot.md) (Hasil migrasi 1..18 pada PGlite)  
> **Target Implementasi Berikutnya**: Migrasi `20261012000019_phase3b_domain3_gradebook_schema.sql` dan `20261012000020_phase3b_domain3_gradebook_functions.sql`

---

## 1. Yang SUDAH ADA di Skema Basis Data (Berdasarkan Snapshot Migrasi 1..18)

Berdasarkan audit snapshot skema pada [`docs/schema-snapshot.md`](file:///c:/Users/ACER/Downloads/implementasi/docs/schema-snapshot.md), fondasi awal penilaian telah tersedia di database PostgreSQL:

### A. Tabel `public.grades` (15 Kolom)
- **Struktur Kolom**:
  - `id` (`uuid`, PK)
  - `class_id` (`uuid`, FK -> `public.classes(id)` ON DELETE RESTRICT) — *Terbukti SUDAH ADA di snapshot skema*.
  - `student_id` (`uuid`, FK -> `public.profiles(id)` ON DELETE RESTRICT)
  - `item_type` (`text`, CHECK: `'ASSIGNMENT'`, `'QUIZ'`, `'EXAM'`, `'MANUAL'`)
  - `item_id` (`uuid`)
  - `score` (`numeric(6,2)`)
  - `max_score` (`numeric(6,2)`)
  - `comment` (`text`, maksimal 5000 karakter)
  - `status` (`public.grade_status`: `'DRAFT'`, `'FINAL'`)
  - `graded_by` (`uuid`, FK -> `public.profiles(id)` ON DELETE RESTRICT)
  - `finalized_by` (`uuid`, FK -> `public.profiles(id)` NULLABLE)
  - `finalized_at` (`timestamp with time zone`, NULLABLE)
  - `is_visible_to_student` (`boolean`, DEFAULT `false`)
  - `created_at` (`timestamp with time zone`)
  - `updated_at` (`timestamp with time zone`)
- **Batasan Integritas**:
  - `CONSTRAINT uq_grades_item UNIQUE (student_id, item_type, item_id)`
  - `CONSTRAINT ck_grades_score CHECK (score BETWEEN 0 AND max_score)`
- **Kebijakan RLS Saat Ini**:
  - `grades_select`: Dosen kelas (`is_class_lecturer`), TA dengan izin `submission.review` atau `assignment.grade`, serta mahasiswa bersangkutan HANYA jika `is_visible_to_student = true`.
- **Evaluasi & Kekurangan Saat Ini**:
  1. Enum `grade_status` hanya memiliki nilai `'DRAFT'` dan `'FINAL'`; belum mendukung status pembekuan buku nilai `'LOCKED'`.
  2. Belum ada trigger proteksi kolom sensitif (`tr_grades_protect_sensitive`) berbasis GUC `app.rpc_context`, sehingga rentan *direct update* PostgREST.
  3. Kaprodi prodinya dan Staf Akademik belum terdaftar pada RLS `grades_select` untuk keperluan rekap nilai dan pelaporan akreditasi.

---

### B. Tabel `public.grade_history` (10 Kolom)
- **Struktur Kolom**:
  - `id` (`uuid`, PK)
  - `grade_id` (`uuid`, FK -> `public.grades(id)` ON DELETE RESTRICT)
  - `class_id` (`uuid`, FK -> `public.classes(id)` ON DELETE RESTRICT)
  - `old_score` (`numeric(6,2)`, NULLABLE)
  - `new_score` (`numeric(6,2)`)
  - `old_status` (`public.grade_status`, NULLABLE)
  - `new_status` (`public.grade_status`)
  - `changed_by` (`uuid`, FK -> `public.profiles(id)` ON DELETE RESTRICT)
  - `reason` (`text`, NULLABLE)
  - `changed_at` (`timestamp with time zone`)
- **Integritas Immutability**:
  - Trigger `tr_grade_history_immutable` aktif mencegah perintah `UPDATE` dan `DELETE` (append-only ledger).
- **Evaluasi & Kekurangan Saat Ini**:
  1. RLS `grade_history_select` saat ini hanya mengizinkan dosen pengampu kelas. Kaprodi dan Staf Akademik belum memiliki hak baca untuk audit forensik akademik.

---

### C. Tabel `public.submissions` (8 Kolom)
- **Struktur Kolom**: `id`, `assignment_id`, `student_id`, `attempt_no`, `status` (`'DRAFT'`, `'SUBMITTED'`, `'RETURNED'`, `'REVIEWED'`, `'GRADED'`), `text_body`, `submitted_at`, `is_late`.
- **Evaluasi & Kekurangan Saat Ini**: Menghubungkan tugas mahasiswa ke penilaian. Belum memiliki kolom berkas lampiran berbasis Supabase Storage Signed URL.

---

### D. Tabel `public.assignments` (11 Kolom)
- **Struktur Kolom**: `id`, `class_id`, `title`, `description`, `due_at`, `close_at`, `max_score`, `status` (`'DRAFT'`, `'PUBLISHED'`, `'CLOSED'`), `created_by`, `created_at`, `updated_at`.
- **Evaluasi & Kekurangan Saat Ini**: Belum memiliki relasi ke komponen pembobotan evaluasi kelas (`grade_components`).

---

### E. Tabel `public.grade_change_requests` (18 Kolom)
- **Struktur Kolom**: `id`, `grade_id`, `class_id`, `requested_by`, `class_title`, `assignment_title`, `student_name`, `old_score`, `proposed_score`, `reason`, `status` (`'PENDING'`, `'APPROVED'`, `'REJECTED'`, `'EXECUTED'`), `reviewed_by`, `review_note`, `reviewed_at`, `created_at`, `executed_by`, `executed_at`, `execution_note`.
- **RPC Terkait**:
  - `public.decide_grade_change(p_request, p_approve, p_note)` (Kaprodi).
  - `public.execute_grade_change(p_request, p_note)` (Staf Akademik).
- **Evaluasi & Kekurangan Saat Ini**: Alur 3-pihak (Dosen -> Kaprodi -> Staf) sudah sangat solid dengan Separation of Duties, namun belum terintegrasi dengan penutupan/pembekuan buku nilai (`gradebook_locks`) dan komputasi ulang nilai akhir otomatis.

---

### F. Fungsi RPC yang Sudah Ada
1. **`public.save_grade_draft(p_submission, p_score, p_comment)`**:
   - Dosen kelas atau asisten dengan izin `assignment.grade` dapat menyimpan draf nilai.
   - Mengubah status submission menjadi `'REVIEWED'`.
   - *Kekurangan*: Belum memeriksa apakah kelas terkunci (`gradebook_locks.is_locked = true`), dan belum menyetel `app.rpc_context`.
2. **`public.finalize_grade(p_submission)`**:
   - Hanya dosen kelas yang berwenang (asisten ditolak).
   - Mengubah status menjadi `'FINAL'`, membuat `is_visible_to_student = true`, dan submission menjadi `'GRADED'`.
   - *Kekurangan*: Belum memvalidasi kunci gradebook, belum memicu hitung ulang nilai akhir kumulatif, dan belum menyetel `app.rpc_context`.
3. **`public.log_grade_export(p_class)`**:
   - Dosen mencatat jejak audit saat mengunduh Excel/PDF nilai kelas.
   - *Kekurangan*: Belum mengakomodasi ekspor tingkat prodi oleh Kaprodi atau tingkat universitas oleh Staf Akademik.

---

## 2. Yang BARU (Rancangan Skema & Usulan Migrasi Domain 3)

Untuk melengkapi Domain 3 menjadi sistem buku nilai (*gradebook*) akademik yang utuh dan berstandar perguruan tinggi, diusulkan penambahan 3 entitas baru:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        public.classes (id)                             │
└──────────┬─────────────────────────────┬───────────────────────────────┘
           │ 1:N                         │ 1:N                         │ 1:1
           ▼                             ▼                             ▼
┌───────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────┐
│public.grade_components│   │   public.grades          │   │public.gradebook_locks│
│- class_id             │   │   - class_id             │   │- class_id (UQ)       │
│- name (Tugas, UTS..)  │   │   - student_id           │   │- is_locked           │
│- weight_pct (20%, 30%)│   │   - item_type, score     │   │- locked_by, reason   │
└──────────┬────────────┘   └────────────┬─────────────┘   └──────────────────────┘
           │                             │
           └──────────────┬──────────────┘
                          ▼
             [RPC calculate_final_grades]
                          │
                          ▼
            ┌───────────────────────────┐
            │public.class_final_grades  │
            │- class_id, student_id (UQ)│
            │- total_score (0.00-100.00)│
            │- letter_grade (A, B, C...)│
            │- grade_point (4.00, 3.00) │
            │- status (DRAFT/FINAL/LOCK)│
            └───────────────────────────┘
```

---

### A. Tabel Baru 1: `public.grade_components` (Bobot Komponen per Kelas)
Menyimpan konfigurasi bobot penilaian per kelas yang dapat disesuaikan dosen pengampu (misal: Tugas 20%, Kuis 15%, UTS 30%, UAS 35% -> Total 100%).

```sql
CREATE TABLE IF NOT EXISTS public.grade_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    weight_pct NUMERIC(5,2) NOT NULL,
    order_index SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_class_comp_code UNIQUE (class_id, code),
    CONSTRAINT ck_comp_weight_range CHECK (weight_pct > 0 AND weight_pct <= 100)
);

CREATE INDEX IF NOT EXISTS idx_grade_components_class ON public.grade_components(class_id);
```

---

### B. Tabel Baru 2: `public.class_final_grades` (Nilai Akhir Kumulatif Mahasiswa)
Menyimpan hasil kalkulasi komputasi server untuk nilai angka final, huruf mutu, angka mutu, dan status kelulusan mahasiswa per kelas.

```sql
CREATE TABLE IF NOT EXISTS public.class_final_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    total_score NUMERIC(5,2) NOT NULL,
    letter_grade VARCHAR(2) NOT NULL,
    grade_point NUMERIC(3,2) NOT NULL,
    is_passed BOOLEAN NOT NULL DEFAULT false,
    status public.grade_status NOT NULL DEFAULT 'DRAFT',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    calculated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    published_at TIMESTAMPTZ NULL,
    published_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_final_grade_class_student UNIQUE (class_id, student_id),
    CONSTRAINT ck_final_score_range CHECK (total_score BETWEEN 0.00 AND 100.00),
    CONSTRAINT ck_letter_grade_valid CHECK (letter_grade IN ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E', 'F')),
    CONSTRAINT ck_grade_point_range CHECK (grade_point BETWEEN 0.00 AND 4.00)
);

CREATE INDEX IF NOT EXISTS idx_final_grades_class ON public.class_final_grades(class_id);
CREATE INDEX IF NOT EXISTS idx_final_grades_student ON public.class_final_grades(student_id);
```

---

### C. Tabel Baru 3: `public.gradebook_locks` (Penguncian Gradebook per Kelas)
Menyediakan mekanisme pembekuan buku nilai ketika perkuliahan semester berakhir atau telah disahkan oleh Kaprodi/Dosen.

```sql
CREATE TABLE IF NOT EXISTS public.gradebook_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    is_locked BOOLEAN NOT NULL DEFAULT true,
    locked_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unlocked_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    unlocked_at TIMESTAMPTZ NULL,
    lock_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_gradebook_lock_class UNIQUE (class_id),
    CONSTRAINT ck_lock_reason_min_length CHECK (char_length(trim(lock_reason)) >= 5)
);

CREATE INDEX IF NOT EXISTS idx_gradebook_lock_class ON public.gradebook_locks(class_id);
```

---

### D. Perluasan Enum Status Nilai
```sql
ALTER TYPE public.grade_status ADD VALUE IF NOT EXISTS 'LOCKED';
```

---

### E. Rencana File Migrasi (Fase 3B)
1. **`supabase/migrations/20261012000019_phase3b_domain3_gradebook_schema.sql`**:
   - `ALTER TYPE public.grade_status ADD VALUE IF NOT EXISTS 'LOCKED';`
   - DDL tabel `public.grade_components`, `public.class_final_grades`, `public.gradebook_locks`.
   - Indeks performa, foreign keys, CHECK constraints, dan trigger `fn_set_updated_at()`.
   - Kebijakan RLS dasar untuk pembacaan dan isolasi per peran.
2. **`supabase/migrations/20261012000020_phase3b_domain3_gradebook_functions.sql`**:
   - Trigger `BEFORE UPDATE` pencegah mutasi langsung (`tr_grades_protect_sensitive`, `tr_final_grades_protect_sensitive`, `tr_gradebook_locks_protect_sensitive`).
   - RPC `public.calculate_final_grades(p_class_id UUID)`.
   - RPC `public.publish_final_grades(p_class_id UUID)`.
   - RPC `public.lock_gradebook(p_class_id UUID, p_reason TEXT)`.
   - Pembaruan RPC `save_grade_draft` dan `finalize_grade` dengan validasi pengecekan kunci gradebook dan set GUC `app.rpc_context`.
   - `REVOKE ALL FROM PUBLIC, anon` dan `GRANT EXECUTE TO authenticated, service_role`.

---

## 3. Matriks Aturan Akses per Peran (Role-Based Access Control)

| Peran (*Role*) | Butir Nilai Tugas/Kuis (`grades`) | Komponen Bobot (`grade_components`) | Nilai Akhir Kumulatif (`class_final_grades`) | Penguncian Buku Nilai (`gradebook_locks`) | Riwayat Perubahan (`grade_history`) |
|---|---|---|---|---|---|
| **Mahasiswa** | **BACA**: Hanya baris miliknya yang `is_visible_to_student = true` (`status = 'FINAL'` atau `'LOCKED'`). Baris `DRAFT` **TIDAK TERLIHAT**.<br>**TULIS**: Ditolak 403. | **BACA**: Komponen kelas yang terdaftar aktif (`ACTIVE`).<br>**TULIS**: Ditolak 403. | **BACA**: Hanya baris miliknya jika status `'FINAL'` atau `'LOCKED'`. Draf **TIDAK TERLIHAT**.<br>**TULIS**: Ditolak 403. | **BACA**: Status kunci kelasnya.<br>**TULIS**: Ditolak 403. | **BACA & TULIS**: Ditolak 403 (Rahasia Dosen). |
| **Dosen Pengampu** | **BACA**: Seluruh peserta kelas miliknya.<br>**TULIS**: `save_grade_draft` & `finalize_grade` (Ditolak jika kelas berstatus `is_locked`). | **BACA & TULIS**: Konfigurasi bobot kelas miliknya (`is_class_lecturer`). | **BACA**: Seluruh peserta kelasnya.<br>**TULIS**: Menjalankan `calculate_final_grades` & `publish_final_grades`. | **BACA & TULIS**: Mengeksekusi `lock_gradebook` di akhir semester. | **BACA**: Seluruh riwayat kelasnya.<br>**TULIS**: Otomatis via DB trigger (Append-only). |
| **Asisten Dosen (TA)** | **BACA**: Hanya jika didelegasikan `submission.review` atau `assignment.grade`.<br>**TULIS**: `save_grade_draft` HANYA jika punya izin `assignment.grade`. **DILARANG FINALISASI** (`finalize_grade` ditolak). **DILARANG MENILAI DIRI SENDIRI** (`SELF_REVIEW`). | **BACA**: Komponen kelas yang diasisteni.<br>**TULIS**: Ditolak 403. | **BACA**: Sesuai izin baca kelas.<br>**TULIS**: Ditolak 403. | **BACA & TULIS**: Ditolak 403. | **BACA & TULIS**: Ditolak 403. |
| **Kaprodi** | **BACA**: Seluruh butir nilai kelas se-program studinya.<br>**TULIS**: Ditolak mutasi langsung (Hanya memutuskan permohonan `decide_grade_change`). | **BACA**: Seluruh kelas se-prodinya.<br>**TULIS**: Ditolak mutasi langsung. | **BACA**: Seluruh rekap nilai akhir kelas se-prodinya.<br>**TULIS**: Ditolak mutasi langsung. | **BACA**: Status kunci se-prodinya.<br>**TULIS**: Berwenang Kunci Massal Prodi saat batas kalender akademik tercapai. | **BACA**: Seluruh log riwayat se-prodinya.<br>**TULIS**: Ditolak (Append-only). |
| **Staf Akademik** | **BACA**: Seluruh nilai untuk urusan transkrip/KHS.<br>**TULIS**: HANYA melalui eksekusi permohonan yang disetujui Kaprodi (`execute_grade_change`). | **BACA**: Master data kurikulum.<br>**TULIS**: Ditolak. | **BACA**: Pencetakan KHS, Buku Induk Nilai, & PDDIKTI.<br>**TULIS**: Ditolak mutasi langsung. | **BACA**: Status kunci.<br>**TULIS**: Buka Kunci Darurat Khusus dengan otorisasi resmi rektorat. | **BACA**: Seluruh riwayat audit.<br>**TULIS**: Ditolak. |
| **Super Admin & System Admin** | **DILARANG TULIS NILAI** (Fail-closed 403, dicabut dari kebijakan tulis & RPC). Akses baca dibatasi hanya untuk monitoring teknis & pemulihan bencana. | **DILARANG TULIS**. | **DILARANG TULIS NILAI**. | **DILARANG TULIS / KUNCI NILAI**. | **BACA**: Jejak forensik sistem.<br>**TULIS**: Ditolak mutlak (Immutable). |

---

## 4. Daur Hidup Status Nilai & Tabel Transisi (State Machine)

```
                 [save_grade_draft]
                         │
                         ▼
                  ┌──────────────┐
     ┌───────────►│    DRAFT     │◄────────────┐
     │            └──────┬───────┘             │
     │                   │                     │
     │                   │ [finalize_grade]    │ [reopen_draft]
     │                   ▼                     │ (hanya jika belum LOCKED)
     │            ┌──────────────┐             │
     │            │    FINAL     ├─────────────┘
     │            └──────┬───────┘
     │                   │
     │                   │ [lock_gradebook]
     │                   ▼
     │            ┌──────────────┐
     └────────────┤    LOCKED    │
                  └──────────────┘
                         │
                         │ [grade_change_requests]
                         │ (Dosen Usul -> Kaprodi Setuju -> Staf Eksekusi)
                         ▼
                  [Nilai Diperbarui + Status Tetap LOCKED + Tercatat di Audit]
```

### A. Tabel Transisi Status Nilai (`public.grade_status_transitions`)
Untuk memastikan integritas mesin status di level database, dibuat tabel transisi eksplisit:

```sql
CREATE TABLE IF NOT EXISTS public.grade_status_transitions (
    from_status public.grade_status NOT NULL,
    to_status public.grade_status NOT NULL,
    allowed_role VARCHAR(50) NOT NULL,
    description TEXT,
    PRIMARY KEY (from_status, to_status)
);

INSERT INTO public.grade_status_transitions (from_status, to_status, allowed_role, description) VALUES
    ('DRAFT', 'FINAL', 'LECTURER', 'Dosen memfinalisasi draf nilai; nilai dipublikasikan ke mahasiswa'),
    ('FINAL', 'DRAFT', 'LECTURER', 'Dosen membuka kembali draf koreksi sebelum gradebook dikunci'),
    ('FINAL', 'LOCKED', 'LECTURER,PROGRAM_COORDINATOR', 'Dosen atau Kaprodi membekukan nilai akhir semester'),
    ('LOCKED', 'LOCKED', 'ACADEMIC_STAFF', 'Staf mengeksekusi revisi resmi grade_change_requests pasca-penguncian')
ON CONFLICT (from_status, to_status) DO NOTHING;
```

### B. Prosedur Perubahan Nilai Setelah Status `LOCKED`
Setelah status buku nilai berubah menjadi `LOCKED`:
1. **Dosen Pengampu** DILARANG memanggil `save_grade_draft` maupun `finalize_grade` (akan dilempar eksepsi `GRADEBOOK_LOCKED`).
2. Satu-satunya pintu perubahan nilai adalah alur permohonan 3-pihak:
   - **Langkah 1 (Pengajuan)**: Dosen memanggil `request_grade_change` dengan bukti revisi dan skor usulan baru (status permohonan: `PENDING`).
   - **Langkah 2 (Keputusan)**: Kaprodi memverifikasi keabsahan akademik dan memanggil `decide_grade_change` (status permohonan: `APPROVED` atau `REJECTED`).
   - **Langkah 3 (Eksekusi)**: Staf Akademik memanggil `execute_grade_change` (status permohonan: `EXECUTED`). RPC ini akan membuka sesi transaksi dengan `app.rpc_context = 'on'`, memperbarui nilai di tabel `grades`, menulis riwayat di `grade_history`, memicu perhitungan ulang `class_final_grades`, dan segera mereset `app.rpc_context = ''`.

---

## 5. Integritas ACID, Komputasi Server & Pencegahan Kecurangan

### A. Riwayat Audit Nilai Append-Only
Tabel `public.grade_history` dilindungi oleh trigger `tr_grade_history_immutable` yang memanggil `public.fn_prevent_audit_log_modification()`. Percobaan apapun untuk menjalankan kueri `UPDATE` atau `DELETE` pada tabel riwayat ini akan langsung digagalkan PostgreSQL.

### B. Perhitungan Nilai Akhir Wajib di Sisi Server (Database RPC)
Nilai akhir mahasiswa **DILARANG DIHITUNG DI SISI KLIEN ATAU BROWSER**. Klien hanya mengirimkan instruksi pemicu, sementara seluruh kalkulasi dilakukan secara atomik di dalam PostgreSQL via RPC:

$$\text{Nilai Komponen}_k = \frac{\sum \text{Skor Tugas}}{\sum \text{Skor Maksimal}} \times 100$$

$$\text{Total Nilai Akhir} = \sum_{k=1}^m \left( \text{Nilai Komponen}_k \times \frac{\text{Weight \%}_k}{100} \right)$$

### C. Standar Pembulatan & Skala Konversi Huruf Mutu
- Pembulatan kalkulasi angka: `ROUND(total_score, 2)` (2 angka di belakang koma).
- Rentang skor angka dijamin valid oleh `CHECK (total_score BETWEEN 0.00 AND 100.00)`.
- Tabel Standar Konversi Otomatis Akademik di PostgreSQL:

| Rentang Skor Akhir | Huruf Mutu | Angka Mutu (*Grade Point*) | Status Kelulusan |
|---|---|---|---|
| $85.00 - 100.00$ | **A** | 4.00 | **Lulus** |
| $80.00 - 84.99$ | **A-** | 3.70 | **Lulus** |
| $75.00 - 79.99$ | **B+** | 3.30 | **Lulus** |
| $70.00 - 74.99$ | **B** | 3.00 | **Lulus** |
| $65.00 - 69.99$ | **B-** | 2.70 | **Lulus** |
| $60.00 - 64.99$ | **C+** | 2.30 | **Lulus** |
| $55.00 - 59.99$ | **C** | 2.00 | **Lulus** |
| $40.00 - 54.99$ | **D** | 1.00 | **Tidak Lulus** |
| $0.00 - 39.99$ | **E** | 0.00 | **Tidak Lulus** |

### D. Idempotensi & Concurrency Control (Row-Level Locking)
- Seluruh RPC mutasi (`save_grade_draft`, `finalize_grade`, `calculate_final_grades`, `lock_gradebook`) mengunci baris kelas dan nilai terkait menggunakan klausa `FOR UPDATE` untuk mencegah *race condition* atau penulisan ganda konkuren.
- Panggilan berulang pada `finalize_grade` bersifat idempoten: jika baris sudah `FINAL`, sistem tidak menduplikasi rekaman di `grade_history`.

---

## 6. Kolom Terlindungi & Penegakan Konvensi `app.rpc_context`

Mengikuti konvensi keamanan Fase 3A (G1 & G4), setiap kolom sensitif dilindungi oleh trigger `BEFORE UPDATE` yang menolak manipulasi langsung dari REST API/PostgREST jika sesi `current_setting('app.rpc_context', true) != 'on'`:

### A. Daftar Kolom Terlindungi
1. **Tabel `public.grades`** (Trigger: `tr_grades_protect_sensitive`):
   - Kolom: `score`, `max_score`, `status`, `student_id`, `class_id`, `item_id`, `item_type`, `finalized_by`, `finalized_at`, `is_visible_to_student`.
2. **Tabel `public.class_final_grades`** (Trigger: `tr_final_grades_protect_sensitive`):
   - Kolom: `total_score`, `letter_grade`, `grade_point`, `is_passed`, `status`, `published_at`, `published_by`.
3. **Tabel `public.gradebook_locks`** (Trigger: `tr_gradebook_locks_protect_sensitive`):
   - Kolom: `is_locked`, `locked_by`, `locked_at`, `unlocked_by`, `unlocked_at`.

### B. Pola Eksekusi pada Fungsi RPC Resmi
Setiap fungsi RPC yang memperbarui kolom terlindungi **WAJIB** menerapkan pola buka-dan-reset konteks segera:

```sql
-- 1. Buka konteks sebelum penulisan
PERFORM set_config('app.rpc_context', 'on', true);

-- 2. Operasi mutasi tabel terlindungi
UPDATE public.grades SET score = p_score, status = 'FINAL' WHERE id = v_grade_id;

-- 3. SEGERA kembalikan konteks ke '' setelah penulisan selesai
PERFORM set_config('app.rpc_context', '', true);
```

---

## 7. Pemetaan Server Actions & Tombol UI (Pencegahan Sukses Palsu F2)

### A. Matriks Server Actions (Domain 3)
| Nama Server Action | File Target | Peran Pemanggil | RPC Database yang Dipanggil |
|---|---|---|---|
| `saveGradeDraftAction` | `src/modules/academic/grade-actions.ts` | `LECTURER`, `TEACHING_ASSISTANT` (dengan izin `assignment.grade`) | `public.save_grade_draft` |
| `finalizeGradeAction` | `src/modules/academic/grade-actions.ts` | `LECTURER` | `public.finalize_grade` |
| `calculateFinalGradesAction`| `src/modules/academic/grade-actions.ts` | `LECTURER` | `public.calculate_final_grades` |
| `lockGradebookAction` | `src/modules/academic/grade-actions.ts` | `LECTURER`, `PROGRAM_COORDINATOR` | `public.lock_gradebook` |
| `publishFinalGradesAction` | `src/modules/academic/grade-actions.ts` | `LECTURER` | `public.publish_final_grades` |
| `exportGradebookAction` | `src/modules/academic/grade-actions.ts` | `LECTURER`, `PROGRAM_COORDINATOR`, `ACADEMIC_STAFF` | `public.log_grade_export` |

### B. Penegakan Feature Flag `FF_PERSISTENCE_GRADES` & Zero Sukses Palsu
1. **Konfigurasi Lingkungan**:
   - Nilai default: `FF_PERSISTENCE_GRADES="false"` di `.env.example` dan lingkungan produksi.
2. **Perilaku Server Action**:
   - Di lingkungan non-demo (`isDemoMode() === false`), jika `FF_PERSISTENCE_GRADES !== "true"`, server action langsung melempar pesan penolakan eksplisit: `"Fitur ini belum aktif"` dan **TIDAK MENULIS APAPUN KE MEMORI ATAU DATABASE**.
3. **Perilaku Tombol Antarmuka (UI)**:
   - Komponen antarmuka pada halaman `src/app/(portal)/classes/[id]/page.tsx` (tab Gradebook) dan `src/app/(portal)/grades/page.tsx`:
     - Tombol "Simpan Nilai", "Finalisasi", "Hitung Nilai Akhir", dan "Kunci Gradebook" menampilkan status `disabled` dengan tooltip `"Fitur ini belum aktif"` selama feature flag bernilai `false`.
     - Tidak ada simulasi toast "Berhasil disimpan" palsu pada lingkungan produksi non-demo.

---

## 8. Rencana Pengujian Komprehensif (PGlite & Supabase Staging)

### A. Rangkaian Uji PGlite Lokal (Pasangan Kontrol Positif / Negatif)
Suite pengujian akan ditambahkan ke `scripts/test-phase3b-domain3.mjs`:

1. **Uji Akses & Visibilitas Mahasiswa**:
   - `[-] T1.1`: Mahasiswa mencoba membaca nilai berstatus `DRAFT` miliknya -> Ditolak / Mengembalikan 0 baris (RLS).
   - `[+] T1.2`: Mahasiswa membaca nilai berstatus `FINAL` miliknya (`is_visible_to_student = true`) -> Berhasil terbaca.
   - `[-] T1.3`: Mahasiswa mencoba membaca nilai mahasiswa lain yang sudah final -> Ditolak / Mengembalikan 0 baris (RLS).
2. **Uji Otoritas Dosen & Asisten**:
   - `[-] T2.1`: Dosen mencoba menilai submission pada kelas dosen lain -> Ditolak `FORBIDDEN`.
   - `[+] T2.2`: Dosen pengampu menilai submission kelasnya sendiri -> Berhasil tersimpan (`save_grade_draft`).
   - `[-] T2.3`: Asisten dosen tanpa izin `assignment.grade` mencoba menyimpan draf -> Ditolak `FORBIDDEN`.
   - `[+] T2.4`: Asisten dosen dengan izin `assignment.grade` menyimpan draf -> Berhasil tersimpan.
   - `[-] T2.5`: Asisten dosen mencoba menilai tugas dirinya sendiri yang mengambil mata kuliah itu -> Ditolak `SELF_REVIEW`.
   - `[-] T2.6`: Asisten dosen memanggil `finalize_grade` -> Ditolak `FORBIDDEN` (Hanya dosen pengampu).
   - `[+] T2.7`: Dosen pengampu memanggil `finalize_grade` -> Berhasil (`FINAL`, submission `GRADED`).
3. **Uji Proteksi Direct UPDATE & Rentang Nilai**:
   - `[-] T3.1`: Klien/Staf mencoba direct `UPDATE public.grades SET score = 98` tanpa RPC context -> Ditolak trigger `DIRECT_UPDATE_RESTRICTED`.
   - `[-] T3.2`: Menyimpan skor negatif (misal: `-5`) -> Ditolak `INVALID_SCORE` / `ck_grades_score`.
   - `[-] T3.3`: Menyimpan skor melebihi max_score (misal: `105` dari `100`) -> Ditolak `INVALID_SCORE`.
4. **Uji Penguncian Gradebook (`gradebook_locks`)**:
   - `[+] T4.1`: Dosen mengunci gradebook kelas (`lock_gradebook`) -> Status kelas terkunci (`is_locked = true`).
   - `[-] T4.2`: Dosen mencoba mengubah nilai draf pada kelas yang terkunci -> Ditolak `GRADEBOOK_LOCKED`.
   - `[-] T4.3`: Dosen mencoba memfinalisasi nilai pada kelas yang terkunci -> Ditolak `GRADEBOOK_LOCKED`.
   - `[+] T4.4`: Perubahan nilai pada kelas terkunci melalui alur resmi `grade_change_requests` (Dosen request -> Kaprodi approve -> Staf execute) -> Berhasil dieksekusi dengan audit trail lengkap.
5. **Uji Komputasi Nilai Akhir & Konversi Huruf Mutu**:
   - `[+] T5.1`: RPC `calculate_final_grades` menghitung akumulasi bobot dengan benar (misal: Tugas 80 x 20% + UTS 90 x 40% + UAS 85 x 40% = 86.00) -> Terbentuk huruf mutu `'A'`, IP `4.00`, `is_passed = true`.
   - `[-] T5.2`: Menghitung nilai akhir dengan total bobot komponen $\neq 100\%$ -> Ditolak `INVALID_COMPONENT_WEIGHT_SUM`.
6. **Uji Immutability Audit History**:
   - `[-] T6.1`: Percobaan `DELETE FROM public.grade_history` -> Ditolak trigger `tr_grade_history_immutable`.
   - `[-] T6.2`: Percobaan `UPDATE public.grade_history` -> Ditolak trigger `tr_grade_history_immutable`.
7. **Uji Super Admin & Hak Eksekusi**:
   - `[-] T7.1`: Super Admin memanggil `finalize_grade` atau `save_grade_draft` -> Ditolak `FORBIDDEN`.

### B. Pengujian yang WAJIB Dilakukan di Supabase Staging Nyata
Sebelum kode Domain 3 dapat dirilis ke produksi:
1. **Verifikasi Token JWT Asli PostgREST**:
   - Pengujian pemanggilan endpoint REST API `POST /rest/v1/grades` dengan token JWT masing-masing peran untuk membuktikan tidak ada kebocoran endpoint OpenAPI.
2. **Uji Kinerja Konkurensi & Locking**:
   - Pengujian beban konkurensi ketika 100 mahasiswa serentak mengumpulkan tugas dan dosen menjalankan finalisasi serta kalkulasi nilai akhir secara paralel.
3. **Audit Log Forensik Terpusat**:
   - Verifikasi bahwa log aktivitas penilaian terekam sempurna di `public.audit_logs` dan `public.grade_history` tanpa ada baris yang hilang saat *high traffic*.

---

## 9. Analisis Risiko & Keputusan yang Perlu Diambil Pengguna

Sebelum implementasi teknis Domain 3 dimulai, terdapat 3 keputusan arsitektural yang membutuhkan keputusan resmi dari Pengguna:

| No | Topik Keputusan | Pilihan Opsi Solusi | Analisis & Rekomendasi Arsitektur |
|---|---|---|---|
| **K6** | **Tingkat Kewenangan Konfigurasi Bobot Komponen (`grade_components`)** | **Opsi A**: Bebas ditentukan dosen pengampu per kelas perkuliahan.<br>**Opsi B**: Ditetapkan seragam per mata kuliah/program studi oleh Kaprodi.<br>**Opsi C (Hibrida)**: Kaprodi menetapkan rentang/template standar prodi, namun dosen pengampu dapat menyesuaikan bobot kelas spesifik sebelum perkuliahan dimulai. | **Rekomendasi: Opsi C (Hibrida)**.<br>Memberikan kepatuhan terhadap kurikulum program studi namun tetap memberikan fleksibilitas pedagogis bagi dosen pengampu kelas paralel. |
| **K7** | **Metode Pembulatan Nilai Akhir & Penentuan Huruf Mutu** | **Opsi A**: Pembulatan 2 desimal (`ROUND(score, 2)`) (Standar PDDIKTI). Nilai 79.99 tetap berada di rentang B+ (tidak dibulatkan ke 80.00).<br>**Opsi B**: Pembulatan integer (`ROUND(score, 0)`), sehingga 79.50 ke atas dibulatkan menjadi 80 (A-). | **Rekomendasi: Opsi A (2 Desimal)**.<br>Mencegah inflasi nilai yang tidak adil dan selaras dengan standar pelaporan akademik nasional. |
| **K8** | **Mekanisme Pemicu Penguncian Buku Nilai (`gradebook_locks`)** | **Opsi A**: Manual oleh Dosen Pengampu melalui tombol antarmuka "Kunci Buku Nilai".<br>**Opsi B**: Otomatis oleh *cron trigger* sistem pada $H+7$ setelah hari terakhir semester.<br>**Opsi C**: Kombinasi manual oleh Dosen, disertai tombol "Kunci Massal Semester" bagi Kaprodi saat batas waktu kalender akademik berakhir. | **Rekomendasi: Opsi C (Kombinasi Manual & Kaprodi)**.<br>Menghargai wewenang dosen untuk mengunci lebih awal, namun memberi jaminan kepastian bagi prodi untuk menutup masa penilaian tepat waktu. |

---

## 10. Kesimpulan & Status Kesiapan

Dokumen desain Domain 3 ini telah:
1. Mematuhi 100% snapshot skema database yang ada di [`docs/schema-snapshot.md`](file:///c:/Users/ACER/Downloads/implementasi/docs/schema-snapshot.md).
2. Mempertahankan konvensi keamanan GUC `app.rpc_context` yang telah ditetapkan pada Fase 3A.
3. Merancang penegakan pemisahan peran (*Separation of Duties*) dan pencegahan sukses palsu (*Zero Fake Success*).

**Pekerjaan migrasi dan kode Domain 3 TIDAK AKAN DIMULAI sebelum desain teknis di atas disetujui oleh Pengguna.**
