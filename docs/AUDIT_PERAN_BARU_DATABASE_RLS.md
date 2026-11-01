# Audit Peran Baru Terhadap Database & Kebijakan RLS

Dokumen ini melengkapi Fase 2 dari `docs/INSTRUKSI_TUTUP_CATATAN_TAHAP_2.md`. Pengujian klik E2E sebelumnya membuktikan jalur navigasi dan proteksi guard halaman berjalan sempurna pada mode demo/pengujian. Laporan ini mengaudit kesiapan skema database PostgreSQL Supabase dan Row Level Security (RLS) di lingkungan produksi riil.

---

## 1. Inventaris & Perbandingan Peran: Kode Sumber vs Database (9 Peran)

| # | Kode Peran di Kode (`MENU_CONFIG`) | Sumber Inisialisasi Database | Kode di Database | Hasil `normalizeRoleCode` | Rute Portal (`ROLE_PORTAL_MAP`) | Status Keselarasan |
| - | --- | --- | --- | --- | --- | --- |
| 1 | `STUDENT` | `supabase/seed.sql:6`, `seed_referensi.sql:9` | `STUDENT` | `STUDENT` | `/student` | **Selaras 100%** |
| 2 | `LECTURER` | `supabase/seed.sql:7`, `seed_referensi.sql:10` | `LECTURER` | `LECTURER` | `/lecturer` | **Selaras 100%** |
| 3 | `TEACHING_ASSISTANT` | `supabase/seed.sql:8`, `seed_referensi.sql:11` | `TEACHING_ASSISTANT` | `TEACHING_ASSISTANT` | `/ta` | **Selaras 100%** |
| 4 | `PROGRAM_COORDINATOR`| `supabase/seed.sql:9`, `seed_referensi.sql:12` | `PROGRAM_COORDINATOR`| `PROGRAM_COORDINATOR`| `/coordinator` | **Selaras 100%** |
| 5 | `ACADEMIC_STAFF` | `supabase/seed.sql:10`, `seed_referensi.sql:13` | `ACADEMIC_STAFF` | `ACADEMIC_STAFF` | `/staff` | **Selaras 100%** |
| 6 | `SYSTEM_ADMIN` | `supabase/seed.sql:11`, `seed_referensi.sql:14` | `SYSTEM_ADMIN` | `SYSTEM_ADMIN` | `/admin` | **Selaras 100%** |
| 7 | `SUPER_ADMIN` | `20261011000015_audit_logs_hardening.sql:37`, `seed_referensi.sql:15` | `SUPER_ADMIN` | `SUPER_ADMIN` | `/admin` | **Selaras 100%** |
| 8 | `PROGRAM_SECRETARY` | `20261027000041_roles_and_permissions_extension.sql:9` | `PROGRAM_SECRETARY` | `PROGRAM_SECRETARY` | `/secretary` | **Selaras 100%** (migrasi 41) |
| 9 | `LAB_HEAD` | `20261027000041_roles_and_permissions_extension.sql:10` | `LAB_HEAD` | `LAB_HEAD` | `/lab` | **Selaras 100%** (migrasi 41) |

*Catatan penting*: Baris untuk `PROGRAM_SECRETARY` dan `LAB_HEAD` dibuat secara resmi pada migrasi `20261027000041_roles_and_permissions_extension.sql`. Namun pada berkas seed katalog minimal `supabase/seed_referensi.sql`, kedua peran ini belum tercantum (hanya mencakup 7 peran).

---

## 2. Analisis Kebijakan RLS & Server Action untuk Peran Baru di Production

### 2.1. Peran `PROGRAM_SECRETARY` (Sekretaris Prodi)

1. **`/secretary/advisory` (Manajemen Perwalian)**:
   - **Status di Production**: **TERLAYANI BAIK**.
   - **Bukti RLS**: Kebijakan `academic_advisories_select` dan `academic_advisories_write` pada `supabase/migrations/20261028000044_academic_advisories.sql` baris 158 dan 171 secara eksplisit memanggil `public.is_program_secretary(program_id)`.
2. **`/secretary/classes` (Jadwal & Penugasan Kelas)**:
   - **Status di Production**: **BERISIKO KOSONG (0 baris)** jika menggunakan query langsung via Supabase client.
   - **Bukti RLS**: Kebijakan `classes_select` pada `supabase/migrations/20261011000016_phase3a_domain1_2_hardening.sql` baris 61-66 hanya memeriksa `public.has_active_role('PROGRAM_COORDINATOR') AND public.is_program_coordinator(cr.program_id)`. Peran `PROGRAM_SECRETARY` belum diizinkan membaca baris `classes`.
3. **`/secretary/requests` (Verifikasi Pengajuan Perubahan Nilai)**:
   - **Status di Production**: **BERISIKO KOSONG (0 baris)**.
   - **Penyebab Kode & RLS**:
     - Di `src/modules/academic/actions.ts:2310`: `listChangeRequestsAction()` memiliki guard awal `if (!c || c.activeRole !== 'PROGRAM_COORDINATOR') return [];` sehingga langsung mengembalikan array kosong untuk `PROGRAM_SECRETARY`.
     - Di RLS: `gcr_staff_select` pada `20261011000014_grade_change_decision_and_execution.sql:19` hanya mengizinkan dosen, kaprodi, atau staf akademik.
4. **`/secretary/risk` (Pemantauan Mahasiswa Berisiko)**:
   - **Status di Production**: **TERLAYANI**.
   - **Bukti Kode**: `src/modules/early-warning/actions.ts:107` secara eksplisit mengizinkan `role === 'PROGRAM_SECRETARY'`.

### 2.2. Peran `LAB_HEAD` (Kepala Laboratorium)

1. **`/lab/assistants` (Manajemen Asisten Lab)**:
   - **Status di Production**: **TERLAYANI BAIK**.
   - **Bukti RLS**: Kebijakan `class_assistants_select` dan fungsi `public.set_assistant()` pada `supabase/migrations/20261028000045_lab_assistant_authority.sql` baris 16 dan 49 secara eksplisit memverifikasi `public.is_lab_head_of_class(class_id)`.
2. **`/lab/classes` & `/lab/schedules` (Kelas Praktikum & Jadwal Lab)**:
   - **Status di Production**: **BERISIKO KOSONG (0 baris)** jika mengambil data langsung dari tabel `classes` di Supabase.
   - **Bukti RLS**: `classes_select` pada `supabase/migrations/20261011000016_phase3a_domain1_2_hardening.sql` tidak memeriksa `public.is_lab_head_of_class(id)` sehingga Kepala Lab tidak dapat membaca kelas praktikum yang dilaksanakan di laboratoriumnya.

---

## 3. DRAFT SQL Perbaikan RLS

Sebagai solusi penutupan risiko data kosong di production, agen telah menyusun draft SQL idempoten yang siap dijalankan oleh pengguna:
👉 [DRAFT_MIGRASI_PERAN_BARU.sql](file:///c:/Users/ACER/Downloads/implementasi/docs/DRAFT_MIGRASI_PERAN_BARU.sql)

Draft tersebut:
1. Menambahkan baris idempoten `ON CONFLICT DO UPDATE` untuk `PROGRAM_SECRETARY` dan `LAB_HEAD` pada tabel `roles`.
2. Memperbarui `classes_select` agar menyertakan `PROGRAM_SECRETARY` (berdasarkan prodi) dan `LAB_HEAD` (berdasarkan lab kelas).
3. Memperbarui `gcr_staff_select` agar menyertakan `PROGRAM_SECRETARY` untuk membaca daftar pengajuan prodi terkait.

Draft ini **TIDAK dijalankan** dan **TIDAK ditaruh di folder `supabase/migrations/`** sesuai aturan read-only database.
