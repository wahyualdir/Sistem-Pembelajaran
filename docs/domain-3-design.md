# Dokumen Desain Teknis Domain 3: Evaluasi Akademik, Nilai & Gradebook (Revisi Komprehensif Fase 3B)

> **Status Dokumen**: DESAIN SAJA (*Design Only*) — Menunggu Persetujuan Pengguna Sebelum Penulisan Kode / Migrasi.  
> **Tanggal Pembaruan**: 12 Oktober 2026  
> **Sumber Kebenaran Tunggal Skema (*Single Source of Truth*)**: [`docs/schema-snapshot.md`](file:///c:/Users/ACER/Downloads/implementasi/docs/schema-snapshot.md) (Hasil migrasi 1..18 pada PGlite).  
> **Prinsip Dasar**: Tanpa menyentuh database remote, penegakan integritas ACID, pemisahan tugas (*Separation of Duties*), satu sumber kebenaran kunci (*Single Source of Truth*), dan pencegahan sukses palsu (*Zero Fake Success*).

---

## 1. Ringkasan Arsitektur & Prinsip Desain Utama

Desain Domain 3 (Nilai & Gradebook) menetapkan tata kelola evaluasi pembelajaran perguruan tinggi yang aman, akuntabel, dan patuh regulasi:

1. **Pemetaan Butir ke Komponen Penilaian**: Setiap butir evaluasi (tugas, kuis, UTS, UAS, praktikum) dipetakan ke komponen bobot kelas (`grade_components`) via foreign key `component_id`.
2. **Penanganan Evaluasi Non-CBT**: Sebelum Domain 5 (CBT Ujian) dibangun, evaluasi ujian tertulis/lisan (UTS & UAS) ditangani secara elegan melalui `item_type = 'MANUAL'` yang terikat ke `component_id`.
3. **Agregasi Server-Side Deterministik**: Nilai akhir kumulatif dan huruf mutu dihitung 100% di sisi database (RPC PostgreSQL), bukan di browser/klien, dengan aturan pembulatan 2 desimal standar PDDIKTI.
4. **Satu Sumber Kebenaran Status Kunci**: Status pembekuan buku nilai dipusatkan secara eksklusif pada tabel `public.gradebook_locks` per kelas. Status per butir pada `public.grades.status` tetap fokus pada siklus koreksi (`DRAFT` / `FINAL`), sehingga menghilangkan risiko desinkronisasi (*two sources of truth*).
5. **Pemisahan Tugas Ketat (*Separation of Duties*)**:
   - Pembukaan kembali buku nilai yang terkunci (`unlock_gradebook`) wajib melalui alur 3-pihak: Dosen Pengampu mengajukan $\rightarrow$ Kaprodi menyetujui $\rightarrow$ Staf Akademik mengeksekusi.
   - Perubahan nilai setelah gradebook dikunci HANYA dapat dilakukan via alur resmi `grade_change_requests` (Dosen $\rightarrow$ Kaprodi $\rightarrow$ Staf).
6. **Penegakan Hak Privasi Mahasiswa**: Super Admin dan System Admin **DILARANG MEMBACA** baris nilai individual mahasiswa (hanya agregat anonim sistem).
7. **Perlindungan Kolom Sensitif**: Menerapkan konvensi GUC `app.rpc_context` pada seluruh tabel Domain 3 dengan trigger `BEFORE UPDATE`.

---

## 2. Kondisi Skema Saat Ini & Audit Fungsi Database

### 2.1. Tabel `public.grades` (Snapshot Migrasi 1..18)
Tabel master butir nilai telah ada di database dengan 15 kolom:
- Kolom saat ini: `id` (uuid), `class_id` (uuid), `student_id` (uuid), `item_type` (text: 'ASSIGNMENT', 'QUIZ', 'EXAM', 'MANUAL'), `item_id` (uuid), `score` (numeric(6,2)), `max_score` (numeric(6,2)), `comment` (text), `status` (grade_status: 'DRAFT', 'FINAL'), `graded_by` (uuid), `finalized_by` (uuid), `finalized_at` (timestamptz), `is_visible_to_student` (boolean), `created_at`, `updated_at`.
- Batasan integritas saat ini: `UNIQUE (student_id, item_type, item_id)`, `CHECK (score BETWEEN 0 AND max_score)`.
- **Rencana Penyempurnaan pada Migrasi Domain 3**:
  1. Tambah kolom `component_id UUID NULL REFERENCES public.grade_components(id) ON DELETE RESTRICT`.
  2. Tambah batasan CHECK invarian visibilitas mahasiswa:
     ```sql
     CONSTRAINT ck_grades_visibility CHECK (
       (is_visible_to_student = false) OR 
       (is_visible_to_student = true AND status = 'FINAL')
     )
     ```
     *Jaminan Invarian*: Mahasiswa secara struktural TIDAK AKAN PERNAH bisa melihat nilai yang masih berstatus `DRAFT`.
  3. Pasang trigger `tr_grades_protect_sensitive` untuk mencegah manipulasi langsung PostgREST.

### 2.2. Tabel `public.grade_history` (Snapshot Migrasi 1..18)
- Menampung log audit perubahan nilai: `id`, `grade_id`, `class_id`, `old_score`, `new_score`, `old_status`, `new_status`, `changed_by`, `reason`, `changed_at`.
- Dilindungi trigger `tr_grade_history_immutable` (append-only ledger, menolak `UPDATE` dan `DELETE`).
- **Rencana Penyempurnaan**: Memperbarui RLS agar Kaprodi prodi terkait dan Staf Akademik dapat membaca riwayat perubahan untuk keperluan audit forensik.

### 2.3. Tabel `public.assignments` & `public.submissions`
- `assignments`: Tambahkan `component_id UUID NULL REFERENCES public.grade_components(id) ON DELETE RESTRICT` agar setiap penugasan terikat langsung ke komponen evaluasi yang tepat saat dibuat.
- `submissions`: Keterkaitan tugas mahasiswa dengan siklus koreksi (`SUBMITTED` $\rightarrow$ `REVIEWED` saat draf $\rightarrow$ `GRADED` saat final).

### 2.4. Tabel `public.grade_change_requests`
- Menampung permohonan revisi nilai resmi: 18 kolom dengan alur otorisasi 3-pihak (`decide_grade_change` oleh Kaprodi dan `execute_grade_change` oleh Staf Akademik).
- Terintegrasi penuh dengan row lock `FOR UPDATE` dan audit logging.

### 2.5. Audit Lengkap Fungsi Lama yang Menulis `public.grades` (Katalog Postgres)
Berdasarkan pemeriksaan katalog sistem `pg_proc.prosrc`, berikut daftar lengkap seluruh fungsi basis data yang memodifikasi baris `public.grades`:

| Nama Fungsi / RPC | Lokasi Migrasi Saat Ini | Modifikasi pada `public.grades` | Status `app.rpc_context` | Rencana Tindakan di Migrasi Domain 3 |
|---|---|---|---|---|
| `public.save_grade_draft` | `000005_grading.sql` & `000011_assistants.sql` | `INSERT ... ON CONFLICT DO UPDATE` (skor, komentar, graded_by) | **BELUM SET** | `CREATE OR REPLACE` dengan menyetel `set_config('app.rpc_context', 'on', true)` sebelum penulisan dan reset ke `''` setelahnya; validasi `gradebook_locks`. |
| `public.finalize_grade` | `000005_grading.sql` | `UPDATE public.grades SET status = 'FINAL', ...` | **BELUM SET** | `CREATE OR REPLACE` dengan menyetel `set_config('app.rpc_context', 'on', true)` sebelum penulisan dan reset ke `''` setelahnya; validasi `gradebook_locks`. |
| `public.execute_grade_change`| `000014_grade_change_decision_and_execution.sql` | `UPDATE public.grades SET score = proposed_score, ...` | **BELUM SET** | `CREATE OR REPLACE` dengan menyetel `set_config('app.rpc_context', 'on', true)` sebelum penulisan dan reset ke `''` setelahnya; memicu hitung ulang nilai akhir. |
| `public.request_grade_change` | `000009_grade_changes.sql` | *Hanya `SELECT` pada grades, `INSERT` ke grade_change_requests* | Tidak mutasi grades | Pertahankan fungsi yang ada. |
| `public.decide_grade_change` | `000014_grade_change_decision_and_execution.sql` | *Hanya `UPDATE` pada grade_change_requests* | Tidak mutasi grades | Pertahankan fungsi yang ada. |

---

## 3. Pemetaan Butir ke Komponen Evaluasi & Formula Agregasi (D1 & D2)

### 3.1. Penambahan Kolom `component_id`
- Kolom `component_id` ditambahkan pada `public.assignments` dan `public.grades` dengan sifat:
  - `NULLABLE` saat inisialisasi awal agar kompatibel dengan data yang sudah ada.
  - **Kondisi Prasyarat Wajib**: Sebelum fungsi `calculate_final_grades` dijalankan, setiap butir nilai yang diikutsertakan dalam buku nilai **WAJIB MEMILIKI `component_id IS NOT NULL`**. Jika ada butir nilai tanpa komponen bobot, fungsi akan menolak komputasi dengan eksepsi:
    `RAISE EXCEPTION 'UNMAPPED_GRADE_ITEM: Butir nilai % belum dipetakan ke komponen evaluasi.';`

### 3.2. Penanganan Ujian Tertulis (UTS & UAS) Sebelum Domain 5 (CBT)
Sebelum Domain 5 (kuis daring dan CBT terproctor) diimplementasikan, evaluasi ujian tengah semester dan akhir semester konvensional ditangani melalui:
- **`item_type = 'MANUAL'`**:
  Dosen membuat butir nilai ujian di tabel `grades` dengan:
  - `item_type = 'MANUAL'`
  - `item_id = gen_random_uuid()` (pengenal unik sesi evaluasi)
  - `component_id = <ID komponen UTS atau UAS pada grade_components>`
  - `score = <nilai mahasiswa>`
  - `max_score = 100.00`
- Dosen menginput nilai ujian manual melalui RPC `save_grade_draft` / antarmuka gradebook dosen, kemudian memfinalisasikannya via `finalize_grade`.

### 3.3. Formula Agregasi Nilai dalam Satu Komponen

Terdapat dua model matematis umum untuk agregasi butir dalam satu komponen bobot:
1. **Model A: Rasio Akumulasi Skor terhadap Maksimum ($\frac{\sum \text{Skor}}{\sum \text{Maks}} \times 100$)**:
   $$\text{Skor Komponen} = \frac{\sum_{i=1}^n \text{skor}_i}{\sum_{i=1}^n \text{max\_score}_i} \times 100$$
2. **Model B: Rata-Rata Persentase Murni ($\frac{1}{n} \sum \frac{\text{skor}_i}{\text{max\_score}_i} \times 100$)**:
   $$\text{Skor Komponen} = \frac{1}{n} \sum_{i=1}^n \left( \frac{\text{skor}_i}{\text{max\_score}_i} \times 100 \right)$$

#### Pilihan Desain & Alasan Pedagogis:
SIAJAR secara eksplisit menetapkan **Model A (Rasio Akumulasi Skor terhadap Maksimum)** sebagai formula baku:
- **Rasional**: Model A menghargai bobot alami dari skala rubrik tugas. Dosen seringkali memberikan tugas kecil (skor maksimal 20) dan proyek besar (skor maksimal 100). Model A secara adil memberikan pengaruh 5x lebih besar pada proyek besar. Pada Model B, kesalahan kecil pada tugas bernilai maksimal 20 akan menghancurkan persentase secara tidak proporsional.
- **Pengecualian**: Jika seluruh butir memiliki skala skor maksimum yang sama (misal semua tugas berskala 100), Model A dan Model B menghasilkan angka yang identik secara matematis.

#### Contoh Hitung Numerik Konkret:
Seorang mahasiswa pada komponen "Tugas" (bobot kelas = 20%) memiliki 2 butir tugas:
- Tugas 1 (Latihan Mingguan): skor = $18.00$, max_score = $20.00$ ($90.00\%$)
- Tugas 2 (Proyek Kelompok): skor = $70.00$, max_score = $100.00$ ($70.00\%$)

Perhitungan Skor Komponen Tugas:
$$\text{Skor Komponen Tugas} = \frac{18.00 + 70.00}{20.00 + 100.00} \times 100 = \frac{88.00}{120.00} \times 100 = 73.33\%$$

Kontribusi terhadap Nilai Akhir Kelas:
$$\text{Kontribusi Tugas} = 73.33 \times \frac{20\%}{100} = 14.67 \text{ poin}$$

*(Bandingkan jika menggunakan Model B: $\frac{90\% + 70\%}{2} = 80.00\%$, yang secara keliru menganggap latihan bernilai 20 sama pentingnya dengan proyek bernilai 100).*

### 3.4. Aturan Nilai Kosong / Belum Final (K10) & Immutability Bobot
1. **Aturan Nilai Kosong & Draf (K10)**:
   - RPC `calculate_final_grades` **MENOLAK KERAS** kalkulasi jika terdapat mahasiswa terdaftar yang memiliki butir nilai pada komponen aktif yang belum berstatus `FINAL` (misal masih `DRAFT` atau belum dinilai).
   - *Pengecualian*: Mahasiswa yang bersangkutan secara resmi ditandai "tidak dinilai" (*exempted* / dispensasi sakit / cuti akademik yang disetujui).
   - Menghindari terbitnya nilai akhir prematur atau huruf mutu palsu akibat kelalaian dosen yang belum memfinalisasi penilaian.
2. **Aturan Bobot Komponen (`grade_components`)**:
   - Total bobot komponen per kelas $\sum \text{weight\_pct}$ **WAJIB TEPAT 100.00%**. Divalidasi secara ketat di RPC kalkulasi:
     ```sql
     IF (SELECT coalesce(sum(weight_pct), 0) FROM public.grade_components WHERE class_id = p_class_id AND is_active = true) <> 100.00 THEN
         RAISE EXCEPTION 'INVALID_COMPONENT_WEIGHT_SUM: Total bobot komponen kelas harus tepat 100.00%%.';
     END IF;
     ```
   - **Immutability Pasca-Nilai Final**: Dosen **DILARANG MENGUBAH ATAU MENGHAPUS** konfigurasi bobot komponen jika sudah ada minimal satu butir nilai berstatus `FINAL` pada kelas tersebut. Hal ini mencegah manipulasi formula penilaian di tengah jalan yang merugikan mahasiswa.

---

## 4. Rancangan Skema Baru (DDL, Indeks, Foreign Keys & Constraints)

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

### 4.2. Tabel `public.gradebook_locks` (Satu Sumber Kebenaran Kunci per Kelas)
Selaras dengan prinsip D4 dan D5, seluruh referensi pengguna menggunakan `ON DELETE RESTRICT`:
```sql
CREATE TABLE IF NOT EXISTS public.gradebook_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    is_locked BOOLEAN NOT NULL DEFAULT true,
    locked_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unlocked_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    unlocked_at TIMESTAMPTZ NULL,
    unlock_request_id UUID NULL REFERENCES public.grade_change_requests(id) ON DELETE RESTRICT,
    lock_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_gradebook_lock_class UNIQUE (class_id),
    CONSTRAINT ck_lock_reason_min_length CHECK (char_length(trim(lock_reason)) >= 5)
);

CREATE INDEX IF NOT EXISTS idx_gradebook_lock_class ON public.gradebook_locks(class_id);
```

### 4.3. Tabel Konfigurasi Skala Huruf Mutu Dinamis (D6 & K9)
Memindahkan penentuan huruf mutu dari batasan CHECK hardcoded ke tabel konfigurasi relasional. Skala yang dicantumkan di bawah ini berstatus **CONTOH REFERENSI** (penetapan resmi menunggu keputusan Pengguna pada **K9**):

```sql
CREATE TABLE IF NOT EXISTS public.grade_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    CONSTRAINT ck_scale_band_range CHECK (min_score <= max_score)
);

CREATE INDEX IF NOT EXISTS idx_scale_bands_lookup ON public.grade_scale_bands(scale_id, min_score, max_score);
```

*(Catatan: Data seed awal pada tabel ini ditandai sebagai contoh standar 4.00, menunggu ketetapan kurikulum resmi Pengguna).*

### 4.4. Tabel `public.class_final_grades` (Nilai Akhir Kumulatif Mahasiswa)
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
    CONSTRAINT uq_final_grade_class_student UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_final_grades_class ON public.class_final_grades(class_id);
CREATE INDEX IF NOT EXISTS idx_final_grades_student ON public.class_final_grades(student_id);
```

### 4.5. Struktur Relasional Transisi Status Nilai (D4)
Mengganti kolom string role yang rapuh dengan struktur relasional berbasis tabel referensi peran `public.roles`:

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

## 5. Matriks Hak Akses & Penegakan Privasi per Peran (D4 & D7)

| Peran (*Role*) | Butir Nilai Tugas/Kuis (`grades`) | Komponen Bobot (`grade_components`) | Nilai Akhir Kumulatif (`class_final_grades`) | Penguncian Gradebook (`gradebook_locks`) | Riwayat Perubahan (`grade_history`) |
|---|---|---|---|---|---|
| **Mahasiswa** | **BACA**: Hanya baris miliknya yang `is_visible_to_student = true` (`status = 'FINAL'`). Draf **TIDAK TERLIHAT**.<br>**TULIS**: Ditolak 403. | **BACA**: Komponen kelas yang di-enroll aktif.<br>**TULIS**: Ditolak 403. | **BACA**: Hanya baris miliknya jika status `'FINAL'` (`published_at IS NOT NULL`). Draf **TIDAK TERLIHAT**.<br>**TULIS**: Ditolak 403. | **BACA**: Status kunci kelasnya.<br>**TULIS**: Ditolak 403. | **BACA & TULIS**: Ditolak 403 (Rahasia Akademik). |
| **Dosen Pengampu** | **BACA**: Seluruh peserta kelas miliknya.<br>**TULIS**: `save_grade_draft` & `finalize_grade` (Ditolak jika kelas berstatus `is_locked`). | **BACA & TULIS**: Konfigurasi bobot kelas miliknya sebelum ada nilai final. | **BACA**: Seluruh peserta kelasnya.<br>**TULIS**: Menjalankan `calculate_final_grades` & `publish_final_grades`. | **BACA & TULIS**: Mengeksekusi `lock_gradebook` di akhir semester. | **BACA**: Seluruh riwayat kelasnya.<br>**TULIS**: Otomatis via DB trigger (Append-only). |
| **Asisten Dosen (TA)** | **BACA**: Hanya jika didelegasikan `submission.review` atau `assignment.grade`.<br>**TULIS**: `save_grade_draft` HANYA jika punya izin `assignment.grade`. **DILARANG FINALISASI** dan **DILARANG MENILAI DIRI SENDIRI** (`SELF_REVIEW`). | **BACA**: Komponen kelas yang diasisteni.<br>**TULIS**: Ditolak 403. | **BACA**: Sesuai izin baca kelas.<br>**TULIS**: Ditolak 403. | **BACA & TULIS**: Ditolak 403. | **BACA & TULIS**: Ditolak 403. |
| **Kaprodi** | **BACA**: Seluruh butir nilai kelas se-program studinya.<br>**TULIS**: Ditolak mutasi langsung (Hanya memutuskan permohonan `decide_grade_change`). | **BACA**: Seluruh kelas se-prodinya.<br>**TULIS**: Ditolak mutasi langsung. | **BACA**: Seluruh rekap nilai akhir kelas se-prodinya.<br>**TULIS**: Ditolak mutasi langsung. | **BACA**: Status kunci se-prodinya.<br>**TULIS**: Berwenang Kunci Massal Semester (Tindakan TERBATAS pada tabel kunci, **BUKAN mutasi nilai**). Menyetujui permohonan buka kunci. | **BACA**: Seluruh log riwayat se-prodinya.<br>**TULIS**: Ditolak (Append-only). |
| **Staf Akademik** | **BACA**: Seluruh nilai untuk urusan transkrip/KHS.<br>**TULIS**: HANYA melalui eksekusi permohonan yang disetujui Kaprodi (`execute_grade_change`). | **BACA**: Master data kurikulum.<br>**TULIS**: Ditolak. | **BACA**: Pencetakan KHS, Buku Induk Nilai, & PDDIKTI.<br>**TULIS**: Ditolak mutasi langsung. | **BACA**: Status kunci.<br>**TULIS**: Mengeksekusi `unlock_gradebook` setelah permohonan disetujui Kaprodi. | **BACA**: Seluruh riwayat audit.<br>**TULIS**: Ditolak. |
| **Super Admin & System Admin** | **DILARANG MEMBACA NILAI MAHASISWA** (Hanya agregat anonim/telemetri sistem).<br>**DILARANG MENULIS NILAI** (Fail-closed 403, dicabut dari kebijakan tulis & RPC). | **BACA**: Backup & infrastruktur.<br>**DILARANG MENULIS**. | **DILARANG MEMBACA NILAI MAHASISWA**.<br>**DILARANG MENULIS NILAI**. | **DILARANG MENULIS / KUNCI NILAI**. | **BACA**: Jejak forensik keamanan sistem.<br>**DILARANG MENULIS** (Immutable). |

---

## 6. Mekanisme Penguncian & Alur Pembukaan Kunci Gradebook (D4)

### 6.1. Satu Sumber Kebenaran Kunci (*Single Source of Truth*)
- Status pembekuan buku nilai dipusatkan 100% pada tabel `public.gradebook_locks` (`is_locked = true/false`).
- Status butir nilai pada `public.grades.status` tetap berada di domain siklus penilaian (`'DRAFT'` atau `'FINAL'`). Nilai `'LOCKED'` pada `grades.status` **DIHAPUS DARI DESAIN** agar tidak terjadi pertentangan dua sumber kebenaran data.
- Setiap operasi mutasi nilai (`save_grade_draft`, `finalize_grade`) memverifikasi status kunci secara langsung ke tabel `gradebook_locks`:
  ```sql
  IF EXISTS (SELECT 1 FROM public.gradebook_locks WHERE class_id = v_class_id AND is_locked = true) THEN
      RAISE EXCEPTION 'GRADEBOOK_LOCKED: Buku nilai kelas telah dibekukan dan tidak dapat diubah.';
  END IF;
  ```

### 6.2. Prosedur Pembekuan Buku Nilai (`lock_gradebook`)
- **Aktor**: Dosen Pengampu kelas bersangkutan, atau Kaprodi program studi terkait (saat batas kalender akademik tercapai).
- **Validasi**:
  1. Seluruh butir nilai pada komponen wajib harus sudah berstatus `'FINAL'`.
  2. Nilai akhir kumulatif `class_final_grades` sudah dihitung (`calculated_at IS NOT NULL`).
  3. Alasan penguncian minimal 5 karakter.
- **Eksekusi**: Menyisipkan baris ke `public.gradebook_locks` dengan `is_locked = true`, mencatat audit log `'gradebook.lock'`.

### 6.3. Prosedur Pembukaan Kembali Kunci (`unlock_gradebook`)
Membuka kunci buku nilai yang sudah dibekukan adalah tindakan administratif luar biasa yang berisiko tinggi. Demi menjaga integritas dan akuntabilitas akademik, diterapkan alur **Pemisahan Tugas 3-Pihak**:

```
[Dosen Pengampu]                  [Kaprodi]                   [Staf Akademik]
       │                              │                              │
       │ 1. Ajukan Buka Kunci         │                              │
       │    (Alasan min 20 karakter)  │                              │
       ├─────────────────────────────►│                              │
       │                              │ 2. Tinjau & Setujui          │
       │                              │    (Putusan Persetujuan)     │
       │                              ├─────────────────────────────►│
       │                              │                              │ 3. Eksekusi Buka Kunci
       │                              │                              │    (RPC unlock_gradebook)
       │                              │                              │    - is_locked = false
       │                              │                              │    - Audit Log dicatat
       │◄─────────────────────────────┴──────────────────────────────┤
```

1. **Langkah 1 (Pengajuan)**: Dosen pengampu mengajukan permohonan buka kunci secara tertulis dengan alasan rinci (minimal 20 karakter).
2. **Langkah 2 (Persetujuan)**: Koordinator Program Studi (Kaprodi) meninjau alasan dan menyetujui permohonan buka kunci.
3. **Langkah 3 (Eksekusi)**: Staf Akademik memanggil RPC `public.unlock_gradebook(p_class_id UUID, p_request_id UUID)`.
   - RPC memvalidasi bahwa permohonan telah berstatus `APPROVED` oleh Kaprodi dan pengaju $\neq$ penyetuju $\neq$ eksekutor (pemisahan tugas).
   - Memperbarui `gradebook_locks`: `is_locked = false`, `unlocked_by = auth.uid()`, `unlocked_at = now()`.
   - Mencatat peristiwa pembukaan kunci ke `public.audit_logs` dengan aksi `'gradebook.unlock'`.

---

## 7. Perlindungan Kolom Terlindungi & Penegakan GUC `app.rpc_context` (D3)

### 7.1. Daftar Kolom Terlindungi per Tabel
Sesuai konvensi keamanan Fase 3A (G1 & G4), trigger `BEFORE UPDATE` akan memblokir setiap pembaruan kolom sensitif jika GUC `current_setting('app.rpc_context', true) != 'on'`:

1. **`public.grades`** (`tr_grades_protect_sensitive`):
   - Kolom terlindungi: `score`, `max_score`, `status`, `student_id`, `class_id`, `item_id`, `item_type`, `component_id`, `finalized_by`, `finalized_at`, `is_visible_to_student`.
2. **`public.class_final_grades`** (`tr_final_grades_protect_sensitive`):
   - Kolom terlindungi: `total_score`, `letter_grade`, `grade_point`, `is_passed`, `status`, `scale_id`, `published_at`, `published_by`.
3. **`public.gradebook_locks`** (`tr_gradebook_locks_protect_sensitive`):
   - Kolom terlindungi: `is_locked`, `locked_by`, `locked_at`, `unlocked_by`, `unlocked_at`.
4. **`public.grade_components`** (`tr_grade_components_protect_sensitive`):
   - Kolom terlindungi: `weight_pct`, `code`, `class_id`.

### 7.2. Perbaikan Fungsi Lama pada Migrasi Domain 3
Seluruh fungsi lama yang memodifikasi `grades` akan di-`CREATE OR REPLACE` dengan membungkus operasi mutasinya menggunakan pola:
```sql
-- 1. Buka konteks sebelum penulisan
PERFORM set_config('app.rpc_context', 'on', true);

-- 2. Mutasi baris tabel
UPDATE public.grades SET ... WHERE ...;

-- 3. SEGERA kembalikan konteks ke '' setelah penulisan selesai
PERFORM set_config('app.rpc_context', '', true);
```

### 7.3. Perluasan Uji Katalog Otomatis (G4) & Uji Regresi
1. **Perluasan Uji Katalog**:
   Skrip CI `scripts/test-phase3a-domain1-2.mjs` diperluas untuk memindai seluruh fungsi yang menulis kolom terlindungi pada **6 tabel**:
   - `classes`, `enrollments`, `grades`, `class_final_grades`, `gradebook_locks`, `grade_components`.
   - Memastikan 100% fungsi memanggil `set_config('app.rpc_context', 'on'`.
2. **Uji Regresi Pasca-Pemasangan Trigger**:
   - Menjalankan uji regresi alur `execute_grade_change` setelah trigger `tr_grades_protect_sensitive` dipasang.
   - Memastikan eksekusi perubahan nilai oleh Staf Akademik tetap berhasil 100% (karena RPC resmi menyetel `app.rpc_context`), sementara direct `UPDATE` oleh klien/staf tanpa RPC ditolak tegas dengan eksepsi `DIRECT_UPDATE_RESTRICTED`.

---

## 8. Tahapan Berkas Migrasi Database (D3b)

Untuk mematuhi batasan transaksional PostgreSQL DDL:
- Jika di kemudian hari diperlukan penambahan enum baru, berkas penambahan enum dipisahkan ke migrasi khusus lebih awal tanpa menggunakan nilai baru tersebut dalam berkas transaksi yang sama (meniru preseden `20261011000010_grade_status_executed.sql`).
- Rencana berkas migrasi Fase 3B:
  1. `supabase/migrations/20261012000019_phase3b_domain3_gradebook_schema.sql`:
     - Penambahan kolom `component_id` pada `assignments` dan `grades`.
     - Penambahan batasan CHECK invarian `ck_grades_visibility` pada `grades`.
     - DDL tabel `grade_scales`, `grade_scale_bands`, `grade_components`, `class_final_grades`, `gradebook_locks`, `grade_status_transitions`, `grade_transition_roles`.
     - Foreign keys `ON DELETE RESTRICT` untuk seluruh referensi pengguna.
     - Indeks performa dan kebijakan RLS dasar.
  2. `supabase/migrations/20261012000020_phase3b_domain3_gradebook_functions.sql`:
     - Trigger proteksi kolom terlindungi (`tr_grades_protect_sensitive`, dll.).
     - Pembaruan fungsi lama (`save_grade_draft`, `finalize_grade`, `execute_grade_change`) dengan penyetelan `app.rpc_context` dan validasi `gradebook_locks`.
     - RPC baru: `calculate_final_grades`, `publish_final_grades`, `lock_gradebook`, `unlock_gradebook`.
     - Pencabutan hak eksekusi publik dan pemberian izin ke `authenticated` & `service_role`.

---

## 9. Pemetaan Server Actions & Pencegahan Sukses Palsu (F2)

| Nama Server Action | File Target | Peran Pemanggil | RPC Database yang Dipanggil |
|---|---|---|---|
| `saveGradeDraftAction` | `src/modules/academic/grade-actions.ts` | `LECTURER`, `TEACHING_ASSISTANT` (dengan izin `assignment.grade`) | `public.save_grade_draft` |
| `finalizeGradeAction` | `src/modules/academic/grade-actions.ts` | `LECTURER` | `public.finalize_grade` |
| `calculateFinalGradesAction`| `src/modules/academic/grade-actions.ts` | `LECTURER` | `public.calculate_final_grades` |
| `publishFinalGradesAction` | `src/modules/academic/grade-actions.ts` | `LECTURER` | `public.publish_final_grades` |
| `lockGradebookAction` | `src/modules/academic/grade-actions.ts` | `LECTURER`, `PROGRAM_COORDINATOR` | `public.lock_gradebook` |
| `unlockGradebookAction` | `src/modules/academic/grade-actions.ts` | `ACADEMIC_STAFF` | `public.unlock_gradebook` |
| `exportGradebookAction` | `src/modules/academic/grade-actions.ts` | `LECTURER`, `PROGRAM_COORDINATOR`, `ACADEMIC_STAFF` | `public.log_grade_export` |

### Penegakan Feature Flag `FF_PERSISTENCE_GRADES`
- Default environment: `FF_PERSISTENCE_GRADES="false"` di `.env.example` dan lingkungan produksi non-demo.
- Di lingkungan non-demo (`isDemoMode() === false`), jika `FF_PERSISTENCE_GRADES !== "true"`, seluruh Server Action melempar error: `"Fitur ini belum aktif"` dan **0 baris ditulis ke memori maupun database**.
- Seluruh tombol mutasi pada UI (`Simpan Nilai`, `Finalisasi`, `Hitung Nilai Akhir`, `Kunci Buku Nilai`) menampilkan status `disabled` dengan tooltip informasi yang jelas.

---

## 10. Rencana Pengujian Komprehensif (PGlite & Supabase Staging)

### A. Rangkaian Uji PGlite Lokal (Pasangan Kontrol Positif & Negatif)
1. **Uji Akses & Visibilitas Mahasiswa**:
   - `[-] T1.1`: Mahasiswa membaca nilai berstatus `DRAFT` miliknya $\rightarrow$ Ditolak RLS / 0 baris kembali.
   - `[+] T1.2`: Mahasiswa membaca nilai berstatus `FINAL` miliknya $\rightarrow$ Berhasil terbaca.
   - `[-] T1.3`: Mahasiswa membaca nilai mahasiswa lain yang sudah final $\rightarrow$ Ditolak RLS / 0 baris kembali.
2. **Uji Otoritas Dosen & Asisten**:
   - `[-] T2.1`: Dosen menilai kelas dosen lain $\rightarrow$ Ditolak `FORBIDDEN`.
   - `[+] T2.2`: Dosen pengampu menilai kelasnya sendiri $\rightarrow$ Berhasil tersimpan (`save_grade_draft`).
   - `[-] T2.3`: Asisten dosen tanpa izin `assignment.grade` menyimpan draf $\rightarrow$ Ditolak `FORBIDDEN`.
   - `[+] T2.4`: Asisten dosen dengan izin `assignment.grade` menyimpan draf $\rightarrow$ Berhasil tersimpan.
   - `[-] T2.5`: Asisten dosen menilai tugas dirinya sendiri $\rightarrow$ Ditolak `SELF_REVIEW`.
   - `[-] T2.6`: Asisten dosen memanggil `finalize_grade` $\rightarrow$ Ditolak `FORBIDDEN`.
   - `[+] T2.7`: Dosen pengampu memanggil `finalize_grade` $\rightarrow$ Berhasil (`FINAL`, submission `GRADED`).
3. **Uji Proteksi Direct UPDATE & Rentang Nilai**:
   - `[-] T3.1`: Klien/Staf mencoba direct `UPDATE public.grades SET score = 95` tanpa RPC $\rightarrow$ Ditolak trigger `DIRECT_UPDATE_RESTRICTED`.
   - `[-] T3.2`: Menyimpan skor $< 0$ atau $> \text{max\_score}$ $\rightarrow$ Ditolak `INVALID_SCORE` / `ck_grades_score`.
4. **Uji Penguncian Gradebook (`gradebook_locks`)**:
   - `[+] T4.1`: Dosen mengunci gradebook kelas $\rightarrow$ Baris `gradebook_locks` terbentuk (`is_locked = true`).
   - `[-] T4.2`: Dosen mencoba mengubah draf pada kelas terkunci $\rightarrow$ Ditolak `GRADEBOOK_LOCKED`.
   - `[-] T4.3`: Dosen mencoba memfinalisasi pada kelas terkunci $\rightarrow$ Ditolak `GRADEBOOK_LOCKED`.
   - `[+] T4.4`: Staf Akademik mengeksekusi `unlock_gradebook` setelah disetujui Kaprodi $\rightarrow$ Berhasil dibuka kembali.
   - `[-] T4.5`: Dosen atau Kaprodi mencoba mengeksekusi `unlock_gradebook` langsung $\rightarrow$ Ditolak `FORBIDDEN` (Pemisahan Tugas).
5. **Uji Agregasi Komponen & Komputasi Nilai Akhir**:
   - `[+] T5.1`: Agregasi Model A menghitung rasio akumulasi dengan benar dan menghasilkan skor kumulatif akurat.
   - `[-] T5.2`: Menghitung nilai akhir saat total bobot komponen $\neq 100.00\%$ $\rightarrow$ Ditolak `INVALID_COMPONENT_WEIGHT_SUM`.
   - `[-] T5.3`: Menghitung nilai akhir saat ada butir komponen yang belum final $\rightarrow$ Ditolak `UNFINALIZED_GRADES_EXIST`.
   - `[-] T5.4`: Mengubah bobot komponen setelah ada nilai berstatus final $\rightarrow$ Ditolak `GRADE_COMPONENTS_LOCKED_AFTER_FINAL_GRADES`.
6. **Uji Privasi Super Admin & System Admin (D7)**:
   - `[-] T6.1`: Super Admin melakukan `SELECT * FROM public.grades` $\rightarrow$ Mengembalikan 0 baris (RLS memblokir akses ke baris individual).
   - `[-] T6.2`: System Admin memanggil `finalize_grade` atau `save_grade_draft` $\rightarrow$ Ditolak `FORBIDDEN`.
7. **Uji Regresi Pasca-Trigger (D3)**:
   - `[+] T7.1`: Eksekusi perubahan nilai `execute_grade_change` oleh Staf Akademik tetap berjalan mulus dan memperbarui skor di tabel `grades` dengan riwayat di `grade_history`.

---

## 11. Pembaruan Matriks Keputusan Arsitektur (K6 s/d K10) (D8)

| No | Topik Keputusan | Status Keputusan | Ketetapan Resmi / Tindakan Lanjutan |
|---|---|---|---|
| **K6** | **Kewenangan Konfigurasi Bobot Komponen (`grade_components`)** | **DITETAPKAN (OPSI A)** | Bobot komponen evaluasi fleksibel ditentukan dosen pengampu per kelas perkuliahan (dengan validasi jumlah total tepat 100.00% dan dikunci setelah ada nilai final). |
| **K7** | **Metode Pembulatan Nilai Akhir & Penentuan Huruf Mutu** | **DITETAPKAN (OPSI A)** | Pembulatan nilai akhir menggunakan 2 desimal (`ROUND(score, 2)`). Nilai $79.99$ tetap berada pada rentang B+ (tidak dibulatkan ke 80.00), selaras dengan standar pelaporan PDDIKTI. |
| **K8** | **Mekanisme Penguncian Buku Nilai (`gradebook_locks`)** | **DITETAPKAN (OPSI C + D4)** | Kombinasi penguncian manual oleh Dosen, serta penguncian massal semester oleh Kaprodi (pada tabel kunci `gradebook_locks`, bukan mutasi nilai), dengan alur pembukaan kunci via RPC `unlock_gradebook` (3-pihak: Dosen usul $\rightarrow$ Kaprodi setuju $\rightarrow$ Staf eksekusi). |
| **K9** | **Konfigurasi Pita Skala Huruf Mutu & Ambang Kelulusan** | **MENUNGGU JAWABAN PENGGUNA** | Tabel `public.grade_scales` dan `grade_scale_bands` telah disiapkan secara dinamis. Nilai awal yang dicantumkan berstatus CONTOH REFERENSI dan menunggu skala resmi yang akan diberikan oleh Pengguna. |
| **K10**| **Kebijakan Nilai Butir Kosong / Belum Final saat Kalkulasi Nilai Akhir** | **MENUNGGU JAWABAN PENGGUNA** | Rekomendasi teknis: `calculate_final_grades` menolak kalkulasi jika ada butir komponen yang belum `FINAL`, kecuali mahasiswa secara eksplisit ditandai "tidak dinilai" (*exempted*). Menunggu ketetapan Pengguna. |

---

## 12. Penjaminan Integrasi CI & Siklus Regenerasi Snapshot

Untuk memastikan `check:plan` selalu bekerja pada data skema terbaru:
1. Skrip `npm run snapshot` (`node scripts/generate-schema-snapshot.mjs`) meregenerasi [docs/schema-snapshot.md](file:///c:/Users/ACER/Downloads/implementasi/docs/schema-snapshot.md) dari migrasi PGlite 1..N.
2. Perintah `npm run check:snapshot` menjalankan regenerasi snapshot dan memverifikasi ketiadaan perubahan liar via `git diff --exit-code docs/schema-snapshot.md`.
3. Perintah `npm run check:plan` memvalidasi keselarasan [docs/phase-3-plan.md](file:///c:/Users/ACER/Downloads/implementasi/docs/phase-3-plan.md) terhadap snapshot.
4. Rangkaian ini terpasang pada pipeline verifikasi utama `npm run cek`.

---

**Pekerjaan migrasi dan kode Domain 3 TIDAK AKAN DILAKUKAN sebelum revisi desain teknis di atas dan keputusan K9 serta K10 disetujui secara resmi oleh Pengguna.**
