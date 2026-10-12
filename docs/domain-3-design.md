# Dokumen Desain Teknis Domain 3: Evaluasi Akademik, Nilai & Gradebook (Revisi Komprehensif E1–E7 Fase 3B)

> **Status Dokumen**: DESAIN SAJA (*Design Only*) — Menunggu Persetujuan Pengguna Sebelum Penulisan Kode / Migrasi.  
> **Tanggal Pembaruan**: 12 Oktober 2026  
> **Sumber Kebenaran Tunggal Skema (*Single Source of Truth*)**: [`docs/schema-snapshot.md`](file:///c:/Users/ACER/Downloads/implementasi/docs/schema-snapshot.md) (Hasil migrasi 1..19 pada PGlite).  
> **Prinsip Dasar**: Tanpa menyentuh database remote, penegakan integritas ACID, pemisahan tugas ketat (*Separation of Duties*), satu sumber kebenaran kunci (*Single Source of Truth*), akuntabilitas dispensasi/pengecualian, dan pencegahan sukses palsu (*Zero Fake Success*).

---

## 1. Ringkasan Arsitektur & Prinsip Desain Utama

Desain Domain 3 (Nilai & Gradebook) menetapkan arsitektur evaluasi akademik perguruan tinggi yang aman, akuntabel, dan patuh regulasi:

1. **Pemetaan Butir ke Komponen Penilaian**:
   - Setiap butir evaluasi (tugas, kuis, UTS, UAS, praktikum) dipetakan ke komponen bobot kelas (`grade_components`) via foreign key `component_id`.
   - Tugas daring menggunakan `public.assignments.component_id`.
   - Evaluasi manual/luring (UTS, UAS, partisipasi, ujian lisan) menggunakan master butir penilaian `public.grade_items` dengan `item_type = 'MANUAL'` pada `public.grades` yang merujuk langsung ke `grade_items.id`.
2. **Definisi Butir yang Diharapkan & Pengecualian Resmi (E1 / K10)**:
   - Butir yang diharapkan dihitung secara deterministik dari perkalian silang seluruh peserta aktif (`enrollments.status = 'ACTIVE'`) dengan seluruh instrumen evaluasi aktif (`assignments` bertatus `PUBLISHED`/`CLOSED` + `grade_items` berstatus `ACTIVE`).
   - Kalkulasi nilai akhir (`calculate_final_grades`) **MENOLAK KERAS** jika terdapat pasangan (mahasiswa, butir) tanpa nilai berstatus `FINAL`, termasuk jika baris nilai tidak ada sama sekali di database.
   - Mahasiswa hanya dapat dikecualikan dari butir jika memiliki dispensasi resmi di tabel `public.grade_exemptions` dengan pemisahan tugas (*pengaju $\neq$ penyetuju*). Butir yang dikecualikan dikeluarkan dari pembilang dan penyebut pada formula akumulasi.
3. **Satu Sumber Kebenaran Kunci & Pembukaan Kunci Terkendali (E2)**:
   - Status pembekuan buku nilai dipusatkan 100% pada tabel `public.gradebook_locks` per kelas. Status `LOCKED` pada baris nilai individual `grades.status` dihapus dari desain agar tidak memicu dualitas kebenaran.
   - Pembukaan kembali gradebook terkunci (`unlock_gradebook`) wajib melalui permohonan resmi `public.gradebook_unlock_requests` dengan pemisahan tugas 3-pihak: Dosen Pengusul $\rightarrow$ Kaprodi Penyetuju $\rightarrow$ Staf Akademik Eksekutor.
   - Pembukaan kunci bersifat **berbatas waktu** (`expires_at`) dan **berbatas cakupan** (`scope` daftar nilai tertentu). Lewat dari waktu kedaluwarsa, gradebook terkunci otomatis kembali dan wajib dihitung ulang serta diumumkan ulang.
4. **Perhitungan Ulang Deterministik & Invarian Publikasi (E3)**:
   - Disediakan fungsi internal `public.fn_recalculate_student_final(class_id, student_id)` tanpa hak akses publik yang menghitung ulang nilai satu mahasiswa seketika saat permohonan sengketa nilai (`execute_grade_change`) disetujui.
   - Invarian status nilai akhir ditegakkan dengan batasan CHECK: `status = 'FINAL' <=> published_at IS NOT NULL`.
   - Perubahan nilai yang sudah diumumkan memicu notifikasi otomatis ke mahasiswa.
5. **Perlindungan Kolom Sensitif & GUC `app.rpc_context` (E4)**:
   - Kolom kritis pada `grades`, `class_final_grades`, `gradebook_locks`, `grade_components`, `grade_items`, `grade_exemptions`, dan `assignments` (khususnya `max_score` dan `component_id` jika sudah ada nilai) dilindungi trigger `BEFORE UPDATE`.
   - Direct UPDATE via PostgREST ditolak tegas.
6. **Skala Huruf Mutu Dinamis & Bebas Tumpang Tindih (E5)**:
   - Skala huruf mutu dikelola via tabel `public.grade_scales` dan `public.grade_scale_bands`.
   - Rentang skor dilindungi constraint `EXCLUDE USING gist (numrange)` untuk mencegah tumpang tindih rentang, validasi kontinuum $0.00$ s/d $100.00$ tanpa celah (*gapless*), serta indeks unik parsial agar hanya ada satu skala default. Data awal ditandai sebagai **CONTOH REFERENSI** menunggu penetapan Pengguna pada K9.
7. **Privasi Mahasiswa (D7)**:
   - Super Admin dan System Admin **DILARANG MEMBACA** baris nilai individual mahasiswa (hanya telemetri/agregat sistem).

---

## 2. Kondisi Skema Saat Ini & Audit Fungsi Database

### 2.1. Tabel `public.grades` (Snapshot Migrasi 1..19)
Tabel master butir nilai telah ada di database dengan 15 kolom:
- Kolom saat ini: `id` (uuid), `class_id` (uuid), `student_id` (uuid), `item_type` (text: 'ASSIGNMENT', 'QUIZ', 'EXAM', 'MANUAL'), `item_id` (uuid), `score` (numeric(6,2)), `max_score` (numeric(6,2)), `comment` (text), `status` (grade_status: 'DRAFT', 'FINAL'), `graded_by` (uuid), `finalized_by` (uuid), `finalized_at` (timestamptz), `is_visible_to_student` (boolean), `created_at`, `updated_at`.
- Batasan integritas saat ini: `UNIQUE (student_id, item_type, item_id)`, `CHECK (score BETWEEN 0 AND max_score)`.
- **Rencana Penyempurnaan pada Migrasi Domain 3**:
  1. Tambah kolom `component_id UUID NULL REFERENCES public.grade_components(id) ON DELETE RESTRICT`.
  2. Penegakan relasi `item_type = 'MANUAL'`: `item_id` **WAJIB MERUJUK KE `public.grade_items(id)`** (bukan UUID sembarang/acak).
  3. Tambah batasan CHECK invarian visibilitas mahasiswa:
     ```sql
     CONSTRAINT ck_grades_visibility CHECK (
       (is_visible_to_student = false) OR 
       (is_visible_to_student = true AND status = 'FINAL')
     )
     ```
     *Jaminan*: Mahasiswa tidak akan pernah bisa melihat nilai berstatus `DRAFT`.
  4. Pasang trigger proteksi `tr_grades_protect_sensitive`.

### 2.2. Master Butir Penilaian Manual: `public.grade_items` (Tabel Baru)
Untuk menampung butir evaluasi luring/manual seperti UTS, UAS, kuis tatap muka, dan praktikum:
- Kolom: `id` (UUID PK), `class_id` (UUID FK classes RESTRICT), `component_id` (UUID FK grade_components RESTRICT), `title` (VARCHAR(150)), `max_score` (NUMERIC(6,2)), `status` (VARCHAR(20) DEFAULT 'ACTIVE'), `created_by` (UUID FK profiles RESTRICT), `created_at`, `updated_at`.
- Setiap baris `grades` dengan `item_type = 'MANUAL'` memiliki `item_id = grade_items.id`.

### 2.3. Tabel `public.assignments` & `public.submissions`
- `assignments`: Tambahkan `component_id UUID NULL REFERENCES public.grade_components(id) ON DELETE RESTRICT`.
- **Perlindungan Integritas**: Kolom `assignments.max_score` dan `assignments.component_id` dikunci dan dilarang diubah jika sudah ada nilai pada tugas tersebut (`EXISTS (SELECT 1 FROM public.grades WHERE item_type = 'ASSIGNMENT' AND item_id = assignments.id)`).

### 2.4. Audit Lengkap Fungsi Lama yang Menulis `public.grades` (Katalog Postgres)
Berdasarkan pemeriksaan katalog sistem `pg_proc.prosrc`, berikut daftar lengkap seluruh fungsi basis data yang memodifikasi baris `public.grades`:

| Nama Fungsi / RPC | Lokasi Migrasi Saat Ini | Modifikasi pada `public.grades` | Status `app.rpc_context` | Rencana Tindakan di Migrasi Domain 3 |
|---|---|---|---|---|
| `public.save_grade_draft` | `000005_grading.sql` & `000011_assistants.sql` | `INSERT ... ON CONFLICT DO UPDATE` (skor, komentar, graded_by) | **BELUM SET** | `CREATE OR REPLACE` dengan menyetel `set_config('app.rpc_context', 'on', true)` sebelum penulisan dan reset ke `''` setelahnya; validasi `gradebook_locks` dan masa berlaku `expires_at`. |
| `public.finalize_grade` | `000005_grading.sql` | `UPDATE public.grades SET status = 'FINAL', ...` | **BELUM SET** | `CREATE OR REPLACE` dengan menyetel `set_config('app.rpc_context', 'on', true)` sebelum penulisan dan reset ke `''` setelahnya; validasi `gradebook_locks` dan masa berlaku `expires_at`. |
| `public.execute_grade_change`| `000014_grade_change_decision_and_execution.sql` | `UPDATE public.grades SET score = proposed_score, ...` | **BELUM SET** | `CREATE OR REPLACE` dengan menyetel `set_config('app.rpc_context', 'on', true)` sebelum penulisan dan reset ke `''` setelahnya; memanggil internal `fn_recalculate_student_final`. |
| `public.request_grade_change` | `000009_grade_changes.sql` | *Hanya `SELECT` pada grades, `INSERT` ke grade_change_requests* | Tidak mutasi grades | Pertahankan fungsi yang ada. |
| `public.decide_grade_change` | `000014_grade_change_decision_and_execution.sql` | *Hanya `UPDATE` pada grade_change_requests* | Tidak mutasi grades | Pertahankan fungsi yang ada. |

---

## 3. Butir yang Diharapkan, Dispensasi Pengecualian (E1 / K10) & Formula Agregasi

### 3.1. Definisi Formal "Butir yang Diharapkan" (*Expected Grade Items*)
Kalkulasi nilai akhir mahasiswa pada suatu kelas perkuliahan tidak boleh didasarkan pada asumsi nilai kosong bernilai 0 tanpa verifikasi. Setiap instrumen evaluasi yang direncanakan harus tuntas dinilai.

Secara formal, untuk kelas perkuliahan $C$:
1. **Himpunan Peserta Aktif**:
   $$\text{Students}(C) = \{ s \mid \text{enrollments}(C, s).\text{status} = \text{'ACTIVE'} \}$$
2. **Himpunan Instrumen Evaluasi Diharapkan**:
   $$I(C) = I_{\text{assignment}}(C) \cup I_{\text{manual}}(C)$$
   di mana:
   - $I_{\text{assignment}}(C) = \{ a \mid \text{assignments}(C, a).\text{status} \in \{\text{'PUBLISHED'}, \text{'CLOSED'}\} \land a.\text{component\_id IS NOT NULL} \}$
   - $I_{\text{manual}}(C) = \{ m \mid \text{grade\_items}(C, m).\text{status} = \text{'ACTIVE'} \land m.\text{component\_id IS NOT NULL} \}$
3. **Matriks Evaluasi Wajib**:
   $$\text{ExpectedPairs}(C) = \text{Students}(C) \times I(C)$$

### 3.2. Penegakan Aturan Nilai Kosong / Belum Final pada `calculate_final_grades`
Fungsi RPC `calculate_final_grades(p_class_id UUID)` mengeksekusi validasi invarian:
Untuk setiap pasangan $(s, i) \in \text{ExpectedPairs}(C)$:
1. Harus terdapat baris $g \in \text{grades}$ dengan kriteria:
   - $g.\text{student\_id} = s$
   - $g.\text{item\_id} = i.\text{id}$
   - $g.\text{status} = \text{'FINAL'}$
2. **Kecuali** terdapat dispensasi resmi yang disetujui di `public.grade_exemptions`:
   - $\text{grade\_exemptions}.\text{student\_id} = s$
   - $(\text{grade\_exemptions}.\text{item\_id} = i.\text{id} \lor \text{grade\_exemptions}.\text{component\_id} = i.\text{component\_id})$
   - $\text{grade\_exemptions}.\text{status} = \text{'APPROVED'}$

**Reaksi Sistem**:
Jika ditemukan minimal satu pasangan $(s, i)$ tanpa baris nilai di `grades` sama sekali, ATAU baris nilai berstatus `DRAFT`, dan tidak memiliki pengecualian yang disetujui:
`RAISE EXCEPTION 'MISSING_OR_UNFINALIZED_GRADES: Mahasiswa % belum memiliki nilai FINAL pada butir evaluasi % (%).';`

### 3.3. Tabel Pengecualian Resmi: `public.grade_exemptions`
Pengecualian penilaian (dispensasi sakit berat, bencana, penugasan negara) dikelola terpusat dengan integritas tinggi:

```sql
CREATE TABLE IF NOT EXISTS public.grade_exemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    item_id UUID NULL, -- Dapat merujuk ke assignments.id atau grade_items.id
    component_id UUID NULL REFERENCES public.grade_components(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    approved_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    approved_at TIMESTAMPTZ NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_exemption_target CHECK (item_id IS NOT NULL OR component_id IS NOT NULL),
    CONSTRAINT ck_exemption_reason_len CHECK (char_length(trim(reason)) >= 20),
    CONSTRAINT ck_exemption_sod CHECK (
        (status = 'PENDING' AND approved_by IS NULL) OR
        (status IN ('APPROVED', 'REJECTED') AND approved_by IS NOT NULL AND approved_by <> requested_by)
    )
);

CREATE INDEX IF NOT EXISTS idx_grade_exemptions_lookup 
    ON public.grade_exemptions(class_id, student_id, status);
```

### 3.4. Efek Pengecualian pada Formula Agregasi & Contoh Hitung

#### Prinsip Matematis:
Butir evaluasi yang berstatus pengecualian disetujui (`APPROVED`) **DIKELUARKAN DARI PEMBILANG MAUPUN PENYEBUT**:
$$\text{Skor Komponen} = \frac{\sum_{i \in I_{\text{active}} \setminus I_{\text{exempt}}} \text{skor}_i}{\sum_{i \in I_{\text{active}} \setminus I_{\text{exempt}}} \text{max\_score}_i} \times 100$$

Jika suatu komponen secara keseluruhan dikecualikan bagi mahasiswa tersebut (seluruh butir dikecualikan atau dispensasi per komponen), total nilai akhir dinormalisasi terhadap total bobot komponen yang tersisa:
$$\text{Nilai Akhir Kumulatif} = \frac{\sum_{c \in C_{\text{non-exempt}}} (\text{Skor Komponen}_c \times \text{weight\_pct}_c)}{\sum_{c \in C_{\text{non-exempt}}} \text{weight\_pct}_c}$$

#### Contoh Hitung Numerik Konkret:
Kelas Pemrograman Web memiliki 3 komponen:
1. **Tugas** (Bobot 30%):
   - Tugas 1 (Latihan Mingguan): Max 20
   - Tugas 2 (Proyek Mid): Max 100
2. **UTS** (Bobot 30%): Max 100
3. **UAS** (Bobot 40%): Max 100

**Kasus Mahasiswa Budi**:
- Tugas 1: Skor $18.00 / 20.00$.
- Tugas 2: Mendapat dispensasi resmi disetujui (`grade_exemptions.status = 'APPROVED'`) karena opname rumah sakit.
- UTS: Skor $85.00 / 100.00$.
- UAS: Skor $90.00 / 100.00$.

**Perhitungan**:
1. Komponen Tugas:
   Tugas 2 dikeluarkan dari pembilang dan penyebut.
   $$\text{Skor Komponen Tugas} = \frac{18.00}{20.00} \times 100 = 90.00\%$$
2. Komponen UTS:
   $$\text{Skor UTS} = \frac{85.00}{100.00} \times 100 = 85.00\%$$
3. Komponen UAS:
   $$\text{Skor UAS} = \frac{90.00}{100.00} \times 100 = 90.00\%$$
4. Nilai Akhir Kumulatif:
   $$\text{Total Score} = (90.00 \times 0.30) + (85.00 \times 0.30) + (90.00 \times 0.40) = 27.00 + 25.50 + 36.00 = 88.50$$
   Nilai akhir Budi adalah **88.50** (Huruf Mutu: **A**, Angka Mutu: **4.00**). Tanpa dispensasi, nilai Tugas 2 akan menjadi 0 sehingga skor tugas hanya $\frac{18}{120} \times 100 = 15.00\%$, menurunkan total nilai secara tidak adil menjadi $66.00$.

---

## 4. Rancangan Skema DDL Baru Lengkap (DDL, Indeks, Foreign Keys & Constraints)

Seluruh foreign key referensi pengguna menggunakan klausa wajib `ON DELETE RESTRICT`.

### 4.1. Tabel `public.grade_components` (Bobot Komponen per Kelas)
```sql
CREATE TABLE IF NOT EXISTS public.grade_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    weight_pct NUMERIC(5,2) NOT NULL,
    order_index SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_class_comp_code UNIQUE (class_id, code),
    CONSTRAINT ck_comp_weight_range CHECK (weight_pct > 0 AND weight_pct <= 100)
);

CREATE INDEX IF NOT EXISTS idx_grade_components_class ON public.grade_components(class_id);
```

### 4.2. Tabel `public.grade_items` (Master Butir Penilaian Manual / Non-CBT)
```sql
CREATE TABLE IF NOT EXISTS public.grade_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    component_id UUID NOT NULL REFERENCES public.grade_components(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    max_score NUMERIC(6,2) NOT NULL CHECK (max_score > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_grade_items_title_len CHECK (char_length(trim(title)) >= 3)
);

CREATE INDEX IF NOT EXISTS idx_grade_items_class ON public.grade_items(class_id);
CREATE INDEX IF NOT EXISTS idx_grade_items_comp ON public.grade_items(component_id);
```

### 4.3. Tabel `public.gradebook_unlock_requests` (Permohonan Buka Kunci Berbatas Waktu & Cakupan)
```sql
CREATE TABLE IF NOT EXISTS public.gradebook_unlock_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    scope TEXT NOT NULL, -- Berisi 'ALL' atau JSON array string daftar UUID grade_id, misal: '["uuid-1", "uuid-2"]'
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'EXPIRED')),
    approved_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    approved_at TIMESTAMPTZ NULL,
    executed_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    executed_at TIMESTAMPTZ NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_unlock_req_reason_len CHECK (char_length(trim(reason)) >= 20),
    CONSTRAINT ck_unlock_req_expires_future CHECK (expires_at > created_at),
    CONSTRAINT ck_unlock_sod_approve CHECK (approved_by IS NULL OR approved_by <> requested_by),
    CONSTRAINT ck_unlock_sod_execute CHECK (executed_by IS NULL OR (executed_by <> requested_by AND executed_by <> approved_by))
);

CREATE INDEX IF NOT EXISTS idx_unlock_requests_class ON public.gradebook_unlock_requests(class_id, status);
```

### 4.4. Tabel `public.gradebook_locks` (Satu Sumber Kebenaran Kunci Gradebook per Kelas)
```sql
CREATE TABLE IF NOT EXISTS public.gradebook_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    is_locked BOOLEAN NOT NULL DEFAULT true,
    locked_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unlocked_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    unlocked_at TIMESTAMPTZ NULL,
    unlock_request_id UUID NULL REFERENCES public.gradebook_unlock_requests(id) ON DELETE RESTRICT,
    lock_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_gradebook_lock_class UNIQUE (class_id),
    CONSTRAINT ck_lock_reason_min_length CHECK (char_length(trim(lock_reason)) >= 5)
);

CREATE INDEX IF NOT EXISTS idx_gradebook_lock_class ON public.gradebook_locks(class_id);
```

### 4.5. Konfigurasi Skala Huruf Mutu Dinamis Bebas Tumpang Tindih (E5 / K9)
Menggunakan ekstensi PostgreSQL `btree_gist` untuk memberlakukan constraint `EXCLUDE` rentang numerik:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS public.grade_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hanya boleh ada SATU skala aktif default
CREATE UNIQUE INDEX IF NOT EXISTS uq_grade_scales_single_default 
    ON public.grade_scales(is_default) 
    WHERE is_default = true;

CREATE TABLE IF NOT EXISTS public.grade_scale_bands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scale_id UUID NOT NULL REFERENCES public.grade_scales(id) ON DELETE RESTRICT,
    letter_grade VARCHAR(2) NOT NULL,
    grade_point NUMERIC(3,2) NOT NULL CHECK (grade_point BETWEEN 0.00 AND 4.00),
    min_score NUMERIC(5,2) NOT NULL CHECK (min_score >= 0.00 AND min_score <= 100.00),
    max_score NUMERIC(5,2) NOT NULL CHECK (max_score >= 0.00 AND max_score <= 100.00),
    is_passed BOOLEAN NOT NULL DEFAULT true,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_scale_letter UNIQUE (scale_id, letter_grade),
    CONSTRAINT ck_scale_band_range CHECK (min_score <= max_score),
    -- Mencegah tumpang tindih rentang skor dalam satu skala
    CONSTRAINT ex_scale_bands_overlap EXCLUDE USING gist (
        scale_id WITH =,
        numrange(min_score, max_score, '[]') WITH &&
    )
);

CREATE INDEX IF NOT EXISTS idx_scale_bands_lookup ON public.grade_scale_bands(scale_id, min_score, max_score);
```

#### Aturan Pemilihan Skala Huruf Mutu & Validasi Kontinuum 0-100:
1. **Aturan Hirarki Pemilihan**:
   - Jika kelas atau program studi memiliki konfigurasi skala spesifik, sistem memilih `scale_id` tersebut.
   - Fallback: Memilih skala default universitas (`WHERE is_default = true AND is_active = true`).
2. **Validasi Kontinuum Tanpa Celah (*Gapless*)**:
   Trigger pada `grade_scales` memastikan bahwa skala yang aktif mencakup kontinuum utuh dari $0.00$ hingga $100.00$ tanpa ada angka yang bolong di antara batas huruf mutu.
3. **Data Awal**:
   Data seed awal berstatus **CONTOH REFERENSI** menunggu penetapan resmi Pengguna pada K9.

### 4.6. Tabel `public.class_final_grades` (Nilai Akhir Kumulatif Mahasiswa)
```sql
CREATE TABLE IF NOT EXISTS public.class_final_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    scale_id UUID NOT NULL REFERENCES public.grade_scales(id) ON DELETE RESTRICT,
    total_score NUMERIC(5,2) NOT NULL CHECK (total_score BETWEEN 0.00 AND 100.00),
    letter_grade VARCHAR(2) NOT NULL,
    grade_point NUMERIC(3,2) NOT NULL CHECK (grade_point BETWEEN 0.00 AND 4.00),
    is_passed BOOLEAN NOT NULL DEFAULT false,
    status public.grade_status NOT NULL DEFAULT 'DRAFT',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    calculated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    published_at TIMESTAMPTZ NULL,
    published_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_final_grade_class_student UNIQUE (class_id, student_id),
    -- Invarian Publikasi E3: Status FINAL <=> published_at IS NOT NULL
    CONSTRAINT ck_final_grades_published CHECK (
        (status = 'FINAL' AND published_at IS NOT NULL AND published_by IS NOT NULL) OR
        (status <> 'FINAL' AND published_at IS NULL AND published_by IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_final_grades_class ON public.class_final_grades(class_id);
CREATE INDEX IF NOT EXISTS idx_final_grades_student ON public.class_final_grades(student_id);
```

### 4.7. Struktur Relasional Transisi Status Nilai
```sql
CREATE TABLE IF NOT EXISTS public.grade_status_transitions (
    from_status public.grade_status NOT NULL,
    to_status public.grade_status NOT NULL,
    description TEXT,
    PRIMARY KEY (from_status, to_status)
);

CREATE TABLE IF NOT EXISTS public.grade_transition_roles (
    from_status public.grade_status NOT NULL,
    to_status public.grade_status NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    PRIMARY KEY (from_status, to_status, role_id),
    FOREIGN KEY (from_status, to_status) REFERENCES public.grade_status_transitions(from_status, to_status) ON DELETE CASCADE
);
```

---

## 5. Kebijakan Row Level Security (RLS) Lengkap per Peran (E6 & D7)

Seluruh tabel Domain 3 mengaktifkan RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Kebijakan dirancang ketat dengan prinsip privasi penuh:

### 5.1. RLS pada `public.grades`
- Mahasiswa hanya membaca nilai miliknya yang sudah final:
  ```sql
  CREATE POLICY grades_student_select ON public.grades
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid() 
    AND is_visible_to_student = true 
    AND status = 'FINAL'
  );
  ```
- Dosen pengampu membaca dan memanipulasi kelas miliknya:
  ```sql
  CREATE POLICY grades_lecturer_select ON public.grades
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = grades.class_id AND c.lecturer_id = auth.uid())
  );
  ```
- Asisten Dosen membaca jika didelegasikan izin:
  ```sql
  CREATE POLICY grades_ta_select ON public.grades
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_assistants ca 
      WHERE ca.class_id = grades.class_id 
        AND ca.user_id = auth.uid()
        AND ca.permission IN ('assignment.grade', 'submission.review')
    )
  );
  ```
- Kaprodi dan Staf Akademik:
  ```sql
  CREATE POLICY grades_coordinator_select ON public.grades
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.courses cr ON cr.id = c.course_id
      JOIN public.user_roles ur ON ur.user_id = auth.uid() AND ur.status = 'ACTIVE'
      JOIN public.roles r ON r.id = ur.role_id AND r.code = 'PROGRAM_COORDINATOR'
      WHERE c.id = grades.class_id AND ur.scope_id = cr.program_id
    )
  );

  CREATE POLICY grades_staff_select ON public.grades
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id AND r.code = 'ACADEMIC_STAFF'
      WHERE ur.user_id = auth.uid() AND ur.status = 'ACTIVE'
    )
  );
  ```
- **Super Admin & System Admin**: **TIDAK ADA POLICY SELECT/INSERT/UPDATE**. Akses membaca data baris individual mahasiswa ditolak tegas (mengembalikan 0 baris).

### 5.2. RLS pada `public.grade_items`
- Mahasiswa membaca butir penilaian kelas aktif miliknya:
  ```sql
  CREATE POLICY grade_items_student_select ON public.grade_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e 
      WHERE e.class_id = grade_items.class_id AND e.student_id = auth.uid() AND e.status = 'ACTIVE'
    )
  );
  ```
- Dosen pengampu mengelola butir kelas miliknya:
  ```sql
  CREATE POLICY grade_items_lecturer_all ON public.grade_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = grade_items.class_id AND c.lecturer_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = grade_items.class_id AND c.lecturer_id = auth.uid())
  );
  ```

### 5.3. RLS pada `public.grade_exemptions`
- Mahasiswa melihat dispensasi miliknya:
  ```sql
  CREATE POLICY grade_exemptions_student_select ON public.grade_exemptions
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());
  ```
- Dosen pengampu mengajukan dan melihat dispensasi kelasnya:
  ```sql
  CREATE POLICY grade_exemptions_lecturer_select ON public.grade_exemptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = grade_exemptions.class_id AND c.lecturer_id = auth.uid())
  );

  CREATE POLICY grade_exemptions_lecturer_insert ON public.grade_exemptions
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = grade_exemptions.class_id AND c.lecturer_id = auth.uid())
  );
  ```
- Kaprodi menyetujui dispensasi:
  ```sql
  CREATE POLICY grade_exemptions_coordinator_update ON public.grade_exemptions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.courses cr ON cr.id = c.course_id
      JOIN public.user_roles ur ON ur.user_id = auth.uid() AND ur.status = 'ACTIVE'
      JOIN public.roles r ON r.id = ur.role_id AND r.code = 'PROGRAM_COORDINATOR'
      WHERE c.id = grade_exemptions.class_id AND ur.scope_id = cr.program_id
    )
  );
  ```

### 5.4. RLS pada `public.gradebook_unlock_requests` & `public.gradebook_locks`
- Penguncian dan permohonan buka kunci transparan bagi dosen, kaprodi, dan staf akademik, namun mahasiswa hanya membaca status kunci `gradebook_locks`:
  ```sql
  CREATE POLICY gradebook_locks_student_select ON public.gradebook_locks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e 
      WHERE e.class_id = gradebook_locks.class_id AND e.student_id = auth.uid() AND e.status = 'ACTIVE'
    )
  );
  ```

### 5.5. RLS pada `public.class_final_grades`
- Mahasiswa membaca nilai akhir miliknya yang sudah final & dipublikasikan:
  ```sql
  CREATE POLICY final_grades_student_select ON public.class_final_grades
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid() 
    AND status = 'FINAL' 
    AND published_at IS NOT NULL
  );
  ```
- Dosen pengampu membaca rekap kelasnya:
  ```sql
  CREATE POLICY final_grades_lecturer_select ON public.class_final_grades
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_final_grades.class_id AND c.lecturer_id = auth.uid())
  );
  ```

---

## 6. Mekanisme Penguncian, Buka Kunci Berbatas Waktu & Cakupan (E2)

### 6.1. Satu Sumber Kebenaran Kunci (*Single Source of Truth*)
- Status pembekuan buku nilai dipusatkan 100% pada tabel `public.gradebook_locks` (`is_locked = true/false`).
- Status per butir pada `public.grades.status` tetap berada di domain siklus penilaian (`'DRAFT'` atau `'FINAL'`). Nilai `'LOCKED'` pada `grades.status` **DIHAPUS DARI DESAIN**.
- Setiap RPC mutasi nilai (`save_grade_draft`, `finalize_grade`) memeriksa status kunci:
  ```sql
  -- Periksa apakah kelas terkunci dan tidak memiliki sesi buka kunci yang masih berlaku
  IF EXISTS (
    SELECT 1 FROM public.gradebook_locks gl
    WHERE gl.class_id = v_class_id AND gl.is_locked = true
  ) THEN
    -- Periksa apakah ada unlock request aktif
    IF NOT EXISTS (
      SELECT 1 FROM public.gradebook_unlock_requests gur
      WHERE gur.class_id = v_class_id 
        AND gur.status = 'EXECUTED' 
        AND gur.expires_at > now()
    ) THEN
      RAISE EXCEPTION 'GRADEBOOK_LOCKED: Buku nilai kelas sedang dibekukan.';
    END IF;
  END IF;
  ```

### 6.2. Alur Pembukaan Kunci Berbatas Waktu & Cakupan (RPC 3-Pihak)
1. **RPC `public.request_unlock_gradebook(p_class_id UUID, p_reason TEXT, p_scope TEXT, p_duration_hours INT)`**:
   - Dipanggil oleh **Dosen Pengampu**.
   - Validasi: `char_length(trim(p_reason)) >= 20`, kelas berstatus terkunci di `gradebook_locks`, `p_duration_hours BETWEEN 1 AND 72`.
   - Menghitung `v_expires_at = now() + (p_duration_hours || ' hours')::interval`.
   - Memasukkan baris ke `public.gradebook_unlock_requests` dengan status `'PENDING'`, `requested_by = auth.uid()`.
2. **RPC `public.decide_unlock_gradebook(p_request_id UUID, p_approved BOOLEAN, p_rejection_reason TEXT)`**:
   - Dipanggil oleh **Kaprodi**.
   - Validasi: Pemanggil adalah Kaprodi program studi kelas bersangkutan dan **BUKAN PENGUSUL** (`auth.uid() <> requested_by`).
   - Jika disetujui: Memperbarui status ke `'APPROVED'`, mencatat `approved_by = auth.uid()`, `approved_at = now()`.
   - Jika ditolak: Memperbarui status ke `'REJECTED'`, mencatat alasan penolakan.
3. **RPC `public.unlock_gradebook(p_request_id UUID)`**:
   - Dipanggil oleh **Staf Akademik**.
   - Validasi: Pemanggil berstatus Staf Akademik aktif, dan **BUKAN PENGUSUL MAUPUN PENYETUJU** (`auth.uid() <> requested_by AND auth.uid() <> approved_by`).
   - Memastikan permohonan berstatus `'APPROVED'`.
   - Memperbarui `gradebook_unlock_requests`: `status = 'EXECUTED'`, `executed_by = auth.uid()`, `executed_at = now()`.
   - Memperbarui `gradebook_locks`: `is_locked = false`, `unlocked_by = auth.uid()`, `unlocked_at = now()`, `unlock_request_id = p_request_id`.
   - Mencatat peristiwa ke `public.audit_logs`.

### 6.3. Penegakan Batas Waktu (*Auto-Relock*) & Pembatasan Cakupan (*Scope Enforcement*)
1. **Penguncian Otomatis Saat Kedaluwarsa (*Auto-Relock*)**:
   - Di setiap RPC tulis nilai, jika terdeteksi bahwa `gur.expires_at <= now()`, RPC secara otomatis memperbarui `gur.status = 'EXPIRED'`, memperbarui `gradebook_locks.is_locked = true`, dan menolak operasi mutasi:
     `RAISE EXCEPTION 'UNLOCK_EXPIRED: Sesi pembukaan kunci kelas telah kedaluwarsa. Gradebook otomatis dikunci kembali.';`
2. **Pembatasan Cakupan Nilai (*Scope Restriction*)**:
   - Jika `gur.scope <> 'ALL'`, `gur.scope` memuat array JSON ID butir nilai yang diizinkan untuk direvisi.
   - Jika dosen mencoba mengubah baris nilai yang `id`-nya tidak terdaftar dalam `gur.scope`:
     `RAISE EXCEPTION 'OUT_OF_SCOPE_GRADE_MUTATION: Butir nilai % tidak terdaftar dalam izin pembukaan kunci kelas.';`
3. **Kewajiban Hitung Ulang & Publikasi Ulang**:
   - Sebelum sesi buka kunci berakhir dan kelas dikunci kembali secara permanen, dosen **WAJIB** menjalankan `calculate_final_grades` dan `publish_final_grades` untuk memperbarui nilai akhir kumulatif mahasiswa.

---

## 7. Fungsi Internal Hitung Ulang & Notifikasi Perubahan Nilai (E3)

### 7.1. Fungsi Internal `public.fn_recalculate_student_final(p_class_id UUID, p_student_id UUID)`
Fungsi berstatus `SECURITY DEFINER` di sisi basis data, **TANPA GRANT KE PERAN KLIEN** (`REVOKE ALL ON FUNCTION ... FROM PUBLIC, authenticated, anon`). Hanya dapat dipanggil secara internal oleh server:

```sql
CREATE OR REPLACE FUNCTION public.fn_recalculate_student_final(
    p_class_id UUID,
    p_student_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_score NUMERIC(5,2);
    v_letter VARCHAR(2);
    v_point NUMERIC(3,2);
    v_passed BOOLEAN;
    v_scale_id UUID;
    v_old_letter VARCHAR(2);
    v_old_score NUMERIC(5,2);
    v_published_at TIMESTAMPTZ;
BEGIN
    -- 1. Ambil skala yang berlaku untuk kelas ini
    SELECT id INTO v_scale_id 
    FROM public.grade_scales 
    WHERE is_default = true AND is_active = true 
    LIMIT 1;

    -- 2. Hitung akumulasi skor komponen (memperhatikan dispensasi grade_exemptions)
    -- Formula Model A: Sum(Skor) / Sum(Maks) * Bobot
    WITH component_calc AS (
        SELECT 
            gc.id AS component_id,
            gc.weight_pct,
            COALESCE(SUM(g.score), 0) AS total_score,
            COALESCE(SUM(g.max_score), 0) AS total_max
        FROM public.grade_components gc
        JOIN public.grades g ON g.component_id = gc.id AND g.student_id = p_student_id
        LEFT JOIN public.grade_exemptions ge 
            ON ge.class_id = p_class_id 
            AND ge.student_id = p_student_id 
            AND ge.status = 'APPROVED'
            AND (ge.item_id = g.item_id OR ge.component_id = gc.id)
        WHERE gc.class_id = p_class_id 
          AND gc.is_active = true
          AND ge.id IS NULL -- Kecualikan butir yang mendapat dispensasi
        GROUP BY gc.id, gc.weight_pct
    )
    SELECT 
        ROUND(COALESCE(SUM((total_score / NULLIF(total_max, 0)) * weight_pct), 0), 2)
    INTO v_total_score
    FROM component_calc;

    -- 3. Cari huruf mutu pada grade_scale_bands
    SELECT letter_grade, grade_point, is_passed
    INTO v_letter, v_point, v_passed
    FROM public.grade_scale_bands
    WHERE scale_id = v_scale_id 
      AND v_total_score >= min_score 
      AND v_total_score <= max_score
    ORDER BY min_score DESC
    LIMIT 1;

    -- 4. Periksa kondisi nilai lama untuk memicu notifikasi jika sudah terpublikasi
    SELECT total_score, letter_grade, published_at
    INTO v_old_score, v_old_letter, v_published_at
    FROM public.class_final_grades
    WHERE class_id = p_class_id AND student_id = p_student_id;

    -- 5. Perbarui baris class_final_grades dengan proteksi rpc_context
    PERFORM set_config('app.rpc_context', 'on', true);

    UPDATE public.class_final_grades
    SET total_score = v_total_score,
        letter_grade = v_letter,
        grade_point = v_point,
        is_passed = v_passed,
        updated_at = now()
    WHERE class_id = p_class_id AND student_id = p_student_id;

    PERFORM set_config('app.rpc_context', '', true);

    -- 6. Jika nilai sebelumnya sudah dipublikasikan, kirim notifikasi perubahan nilai
    IF v_published_at IS NOT NULL AND (v_old_score <> v_total_score OR v_old_letter <> v_letter) THEN
        INSERT INTO public.notifications (
            user_id, type, title, body, entity_type, entity_id, class_id
        ) VALUES (
            p_student_id,
            'GRADE_REVISED',
            'Pembaruan Nilai Akhir Mata Kuliah',
            format('Nilai akhir Anda telah diperbarui dari %s (%s) menjadi %s (%s) pasca putusan revisi resmi.',
                   v_old_score, v_old_letter, v_total_score, v_letter),
            'class_final_grades',
            p_class_id,
            p_class_id
        );
    END IF;
END;
$$;
```

### 7.2. Integrasi dengan `public.execute_grade_change`
Pada saat Staf Akademik mengeksekusi perubahan nilai resmi (`execute_grade_change`), setelah baris `grades` diperbarui, RPC secara otomatis memanggil:
`PERFORM public.fn_recalculate_student_final(v_req.class_id, v_req.student_id);`
Hal ini menjamin nilai akhir kumulatif mahasiswa selalu sinkron seketika dengan nilai butir yang direvisi.

---

## 8. Perlindungan Kolom Terlindungi (Trigger GUC `app.rpc_context`) & Audit Katalog (E4)

### 8.1. Daftar Kolom Terlindungi per Tabel
Setiap tabel dilindungi oleh trigger `BEFORE UPDATE` yang menolak mutasi jika `current_setting('app.rpc_context', true) != 'on'`:

1. **`public.grades`** (`tr_grades_protect_sensitive`):
   - Kolom terlindungi: `score`, `max_score`, `status`, `student_id`, `class_id`, `item_id`, `item_type`, `component_id`, `finalized_by`, `finalized_at`, `is_visible_to_student`.
2. **`public.class_final_grades`** (`tr_final_grades_protect_sensitive`):
   - Kolom terlindungi: `total_score`, `letter_grade`, `grade_point`, `is_passed`, `status`, `scale_id`, `published_at`, `published_by`.
3. **`public.gradebook_locks`** (`tr_gradebook_locks_protect_sensitive`):
   - Kolom terlindungi: `is_locked`, `locked_by`, `locked_at`, `unlocked_by`, `unlocked_at`, `unlock_request_id`.
4. **`public.grade_components`** (`tr_grade_components_protect_sensitive`):
   - Kolom terlindungi: `name`, `code`, `weight_pct`, `class_id`, `is_active`.
   - **Kondisi Khusus**: Perubahan `is_active = false` atau perubahan `weight_pct` ditolak keras jika sudah ada nilai berstatus `FINAL` pada kelas tersebut.
5. **`public.assignments`** (`tr_assignments_protect_grading`):
   - Kolom terlindungi: `max_score`, `component_id`.
   - **Kondisi Khusus**: Hanya boleh diubah jika belum ada nilai pada penugasan tersebut (`NOT EXISTS (SELECT 1 FROM public.grades WHERE item_type = 'ASSIGNMENT' AND item_id = assignments.id)`).
6. **`public.grade_items`** (`tr_grade_items_protect_sensitive`):
   - Kolom terlindungi: `title`, `max_score`, `component_id`, `class_id`, `status`. Dosen tidak dapat mengubah skala penilaian manual setelah ada nilai final.
7. **`public.grade_exemptions`** (`tr_grade_exemptions_protect_sensitive`):
   - Kolom terlindungi: `status`, `approved_by`, `approved_at`, `student_id`, `class_id`, `item_id`, `component_id`. Hanya dapat diubah melalui RPC persetujuan resmi.
8. **`public.gradebook_unlock_requests`** (`tr_unlock_requests_protect_sensitive`):
   - Kolom terlindungi: `status`, `approved_by`, `approved_at`, `executed_by`, `executed_at`, `expires_at`, `scope`.

### 8.2. Pola Pembungkusan GUC pada RPC Resmi
```sql
-- 1. Buka konteks sebelum penulisan
PERFORM set_config('app.rpc_context', 'on', true);

-- 2. Mutasi baris tabel
UPDATE public.grades SET ... WHERE ...;

-- 3. SEGERA kembalikan konteks ke '' setelah penulisan selesai
PERFORM set_config('app.rpc_context', '', true);
```

### 8.3. Perluasan Uji Katalog Otomatis (G4)
Skrip CI otomatis diperluas untuk memindai katalog sistem PostgreSQL `pg_proc` pada **8 tabel terlindungi**:
- `classes`, `enrollments`, `grades`, `class_final_grades`, `gradebook_locks`, `grade_components`, `assignments`, `grade_items`.
- Setiap fungsi yang memodifikasi kolom terlindungi wajib membungkus operasinya dengan GUC `app.rpc_context`. Direct UPDATE oleh Dosen/Staf via PostgREST ke kolom-kolom ini wajib menghasilkan error `DIRECT_UPDATE_RESTRICTED`.

---

## 9. Tahapan Berkas Migrasi Database (D3b, E2, E3, E4, E5)

Rencana pembagian berkas migrasi Fase 3B disusun transaksional dan modular:

1. **`supabase/migrations/20261012000020_phase3b_domain3_schema.sql`**:
   - DDL ekstensi `btree_gist`.
   - DDL tabel konfigurasi skala: `grade_scales`, `grade_scale_bands` (dengan constraint EXCLUDE `numrange` dan indeks unik default).
   - DDL tabel komponen evaluasi: `grade_components`, `grade_items`.
   - Penambahan kolom `component_id` pada `assignments` dan `grades`.
   - DDL permohonan buka kunci & kunci gradebook: `gradebook_unlock_requests`, `gradebook_locks`.
   - DDL dispensasi evaluasi: `grade_exemptions`.
   - DDL tabel nilai akhir kumulatif: `class_final_grades` (dengan batasan CHECK invarian publikasi).
   - DDL transisi status: `grade_status_transitions`, `grade_transition_roles`.
   - Pengaktifan RLS dan pemasangan seluruh kebijakan RLS untuk seluruh peran.
2. **`supabase/migrations/20261012000021_phase3b_domain3_functions.sql`**:
   - Pembuatan trigger proteksi kolom sensitif pada 8 tabel terlindungi.
   - Pembuatan fungsi internal `fn_recalculate_student_final` (tanpa public grant).
   - Pembaruan fungsi lama: `save_grade_draft`, `finalize_grade`, `execute_grade_change` dengan pembungkusan `app.rpc_context`, verifikasi `gradebook_locks`, dan auto-relock jika unlock kedaluwarsa.
   - Pembuatan RPC baru: `calculate_final_grades`, `publish_final_grades`, `lock_gradebook`, `request_unlock_gradebook`, `decide_unlock_gradebook`, `unlock_gradebook`.

---

## 10. Rencana Pengujian Komprehensif (PGlite & Supabase Staging) (E6)

Rangkaian pengujian disusun dengan pendekatan **Kontrol Positif `[+]` dan Negatif `[-]` Berpasangan** mencakup seluruh aspek E1 hingga E5:

### 10.1. Uji Butir yang Diharapkan & Pengecualian (E1 / K10)
- `[-] T1.1 (Mahasiswa Tanpa Nilai Butir)`: Kelas memiliki komponen UTS manual di `grade_items`. Mahasiswa A tidak memiliki baris nilai di `grades` sama sekali $\rightarrow$ `calculate_final_grades` **DITOLAK** (`MISSING_OR_UNFINALIZED_GRADES`).
- `[-] T1.2 (Mahasiswa dengan Nilai Masih DRAFT)`: Mahasiswa B memiliki baris nilai UTS tetapi statusnya masih `'DRAFT'` $\rightarrow$ `calculate_final_grades` **DITOLAK** (`MISSING_OR_UNFINALIZED_GRADES`).
- `[-] T1.3 (Dispensasi Tanpa Persetujuan)`: Mahasiswa C memiliki entri di `grade_exemptions` tetapi status masih `'PENDING'` (belum disetujui Kaprodi) $\rightarrow$ `calculate_final_grades` **DITOLAK**.
- `[+] T1.4 (Dispensasi Resmi Disetujui)`: Mahasiswa D memiliki dispensasi berstatus `'APPROVED'` untuk Tugas 2 $\rightarrow$ `calculate_final_grades` **BERHASIL**, Tugas 2 dikeluarkan dari pembilang dan penyebut, nilai kumulatif terhitung adil.

### 10.2. Uji Buka Kunci Berbatas Waktu & Cakupan (E2)
- `[-] T2.1 (Pemisahan Tugas Buka Kunci)`: Dosen pengusul mencoba memanggil `decide_unlock_gradebook` atau `unlock_gradebook` untuk permohonannya sendiri $\rightarrow$ **DITOLAK** `FORBIDDEN / SOD_VIOLATION`.
- `[+] T2.2 (Alur Sah 3-Pihak)`: Dosen ajukan $\rightarrow$ Kaprodi setujui $\rightarrow$ Staf eksekusi $\rightarrow$ Gradebook terbuka (`is_locked = false`, request `'EXECUTED'`).
- `[-] T2.3 (Buka Kunci Kedaluwarsa)`: Waktu `now() > expires_at`. Dosen mencoba memanggil `save_grade_draft` $\rightarrow$ **DITOLAK** `UNLOCK_EXPIRED`, status gradebook otomatis kembali terkunci (`is_locked = true`).
- `[-] T2.4 (Mutasi di Luar Cakupan / Out of Scope)`: Sesi buka kunci hanya mengizinkan `scope = '["grade-uuid-1"]'`. Dosen mencoba mengubah `grade-uuid-2` $\rightarrow$ **DITOLAK** `OUT_OF_SCOPE_GRADE_MUTATION`.

### 10.3. Uji Perhitungan Ulang & Invarian Publikasi (E3)
- `[+] T3.1 (Kalkulasi Pasca-Putusan Sengketa)`: Staf Akademik mengeksekusi `execute_grade_change` $\rightarrow$ Fungsi internal `fn_recalculate_student_final` terpanggil otomatis, nilai akhir mahasiswa di `class_final_grades` seketika terbarui ke huruf mutu baru.
- `[+] T3.2 (Notifikasi Perubahan Nilai)`: Nilai yang sudah dipublikasikan mengalami revisi $\rightarrow$ Notifikasi `GRADE_REVISED` otomatis masuk ke akun mahasiswa.
- `[-] T3.3 (Invarian Status Final)`: Upaya menyetel status `class_final_grades` menjadi `'FINAL'` tanpa mengisi `published_at` $\rightarrow$ **DITOLAK** constraint `ck_final_grades_published`.

### 10.4. Uji Proteksi Kolom Terlindungi (E4)
- `[-] T4.1 (Direct UPDATE Komponen oleh Dosen)`: Dosen mencoba menonaktifkan komponen (`UPDATE grade_components SET is_active = false`) via PostgREST langsung tanpa RPC $\rightarrow$ **DITOLAK** trigger `DIRECT_UPDATE_RESTRICTED`.
- `[-] T4.2 (Ubah Bobot Pasca-Nilai Final)`: Dosen mencoba mengubah bobot komponen setelah ada minimal satu nilai final di kelas $\rightarrow$ **DITOLAK** `GRADE_COMPONENTS_LOCKED_AFTER_FINAL_GRADES`.
- `[-] T4.3 (Ubah Skor Maksimal Tugas yang Sudah Dinilai)`: Klien mencoba `UPDATE assignments SET max_score = 150` pada tugas yang sudah memiliki submission dinilai $\rightarrow$ **DITOLAK** trigger `ASSIGNMENT_GRADING_LOCKED`.
- `[-] T4.4 (Direct UPDATE Nilai oleh Staf/Dosen)`: Direct `UPDATE grades SET score = 100` tanpa RPC $\rightarrow$ **DITOLAK** trigger `DIRECT_UPDATE_RESTRICTED`.

### 10.5. Uji Skala Huruf Mutu Bebas Tumpang Tindih (E5)
- `[-] T5.1 (Tumpang Tindih Rentang Skor)`: Upaya memasukkan pita nilai baru dengan rentang $75.00 - 85.00$ padahal sudah ada rentang $80.00 - 100.00$ pada skala yang sama $\rightarrow$ **DITOLAK** constraint `ex_scale_bands_overlap`.
- `[-] T5.2 (Multiple Default Scales)`: Upaya menyetel dua skala berbeda dengan `is_default = true` $\rightarrow$ **DITOLAK** indeks unik parsial `uq_grade_scales_single_default`.

### 10.6. Uji Privasi Mahasiswa (D7)
- `[-] T6.1 (Super Admin Membaca Nilai Mahasiswa)`: Super Admin menjalankan `SELECT * FROM public.grades` atau `SELECT * FROM public.class_final_grades` $\rightarrow$ Mengembalikan **0 baris** (RLS menolak akses individual).
- `[-] T6.2 (System Admin Menulis Nilai)`: System Admin mencoba memanggil RPC penilaian $\rightarrow$ **DITOLAK** `FORBIDDEN`.

---

## 11. Pembaruan Matriks Keputusan Arsitektur (K6 s/d K10) (E7)

| No | Topik Keputusan | Status Keputusan | Ketetapan Resmi / Tindakan Lanjutan |
|---|---|---|---|
| **K6** | **Kewenangan Konfigurasi Bobot Komponen (`grade_components`)** | **DITETAPKAN (OPSI A)** | Bobot komponen ditentukan dosen pengampu per kelas perkuliahan (dengan validasi jumlah total tepat 100.00% dan dikunci mutlak setelah ada nilai final). |
| **K7** | **Metode Pembulatan Nilai Akhir & Penentuan Huruf Mutu** | **DITETAPKAN (OPSI A)** | Pembulatan nilai akhir menggunakan 2 desimal (`ROUND(score, 2)`). Nilai $79.99$ tetap berada pada rentang B+ (tidak dibulatkan ke 80.00), selaras dengan standar pelaporan PDDIKTI. |
| **K8** | **Mekanisme Penguncian Buku Nilai (`gradebook_locks`)** | **DITETAPKAN (OPSI C + E2)** | Sumber kebenaran tunggal pada `gradebook_locks`. Pembukaan kunci berbatas waktu & cakupan via `gradebook_unlock_requests` dengan pemisahan tugas 3-pihak (Dosen usul $\rightarrow$ Kaprodi setuju $\rightarrow$ Staf eksekusi), auto-relock saat kedaluwarsa, dan wajib hitung ulang sebelum kunci permanen. |
| **K9** | **Konfigurasi Pita Skala Huruf Mutu & Ambang Kelulusan** | **MENUNGGU JAWABAN PENGGUNA** | Tabel `public.grade_scales` dan `grade_scale_bands` telah disiapkan secara dinamis dengan constraint bebas tumpang tindih. Nilai awal yang dicantumkan berstatus **CONTOH REFERENSI** menunggu skala resmi yang akan diberikan oleh Pengguna. |
| **K10**| **Kebijakan Nilai Butir Kosong / Belum Final saat Kalkulasi Nilai Akhir** | **MENUNGGU JAWABAN PENGGUNA** | Rekomendasi teknis yang dirancang: `calculate_final_grades` menolak kalkulasi jika ada pasangan (mahasiswa, butir) tanpa nilai FINAL, kecuali mahasiswa memiliki dispensasi resmi yang disetujui di `grade_exemptions`. Menunggu persetujuan definitif Pengguna. |

---

## 12. Penjaminan Integrasi CI & Siklus Snapshot

1. Skrip `npm run snapshot` meregenerasi [docs/schema-snapshot.md](file:///c:/Users/ACER/Downloads/implementasi/docs/schema-snapshot.md) dari migrasi PGlite 1..N.
2. Perintah `npm run check:snapshot` memverifikasi ketiadaan modifikasi skema yang tidak terdokumentasi.
3. Perintah `npm run check:plan` memvalidasi keselarasan seluruh tabel rencana terhadap snapshot.
4. Seluruh rangkaian pemeriksaan ini berjalan otomatis pada pipeline `npm run cek`.

---

**Pekerjaan migrasi dan kode Domain 3 TIDAK AKAN DILAKUKAN sebelum revisi desain teknis di atas dan keputusan K9 serta K10 disetujui secara resmi oleh Pengguna.**
