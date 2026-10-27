# Audit Peran Baru (Fase 0) — SIAJAR / RuangKampus

**Tanggal:** 27 Oktober 2026  
**Dokumen Acuan:** `docs/INSTRUKSI_PERAN_BARU.md`  
**Tujuan:** Memetakan seluruh artefak identitas, RLS, server guards, modul akademik, dan UI sebelum penambahan peran `PROGRAM_SECRETARY`, `LAB_HEAD`, `DEAN`, serta tugas `Dosen Wali`.

---

## 1. Skema Identitas & Role Persistence

| Komponen | Status Saat Ini | Rencana Perubahan (Fase 1–2) |
| :--- | :--- | :--- |
| `public.roles` | Berisi 7 role (`STUDENT`, `LECTURER`, `TEACHING_ASSISTANT`, `PROGRAM_COORDINATOR`, `ACADEMIC_STAFF`, `SYSTEM_ADMIN`, `SUPER_ADMIN`). | Tambah 3 role via migrasi: `PROGRAM_SECRETARY` (`..0011`), `LAB_HEAD` (`..0012`), `DEAN` (`..0013`). **Dosen Wali bukan role**. |
| `public.scope_type` (Enum) | Nilai saat ini: `'GLOBAL'`, `'PROGRAM'`, `'CLASS'`. | Tambah nilai enum via migrasi terpisah: `'FACULTY'`, `'LAB'`. |
| `public.user_roles` | Menyimpan `user_id`, `role_id`, `scope_type`, `scope_id`, `status` (`ACTIVE`/`REVOKED`/`EXPIRED`), `valid_until`. | Mendukung penetapan role baru: Dekan (`FACULTY`), Kaprodi/Sekprodi (`PROGRAM`), Kepala Lab (`LAB`). |
| Helper RLS | `is_program_coordinator`, `is_class_lecturer`, `is_class_staff`, `has_active_role`, `has_global_role`. | Buat fungsi baru: `is_program_secretary(program_id)`, `is_dean_of_program(program_id)`, `is_lab_head(lab_id)`, `is_lab_head_of_class(class_id)`. |
| Master Data Baru | Tabel `programs` ada tapi belum ada `faculties` dan `laboratories`. | Buat tabel `faculties`, kolom `programs.faculty_id`, `laboratories`, dan `class_laboratories` dengan RLS aktif. |

---

## 2. Pemetaan Kemunculan Peran & Keputusan Akses

| Lokasi Kemunculan | Pola Saat Ini | Keputusan untuk Peran Baru |
| :--- | :--- | :--- |
| **`supabase/migrations/*`** (`is_program_coordinator`) | Memeriksa peran `PROGRAM_COORDINATOR` dengan `scope_id = p_program_id`. | `PROGRAM_SECRETARY` dibuatkan helper terpisah `is_program_secretary`. Pada aksi tertentu (monitoring/baca), keduanya diizinkan; pada persetujuan final nilai, **hanya** `is_program_coordinator`. |
| **`supabase/migrations/*`** (`has_active_role('ACADEMIC_STAFF')`) | Dipakai untuk izin master data & jadwal. | `PROGRAM_SECRETARY` diberi izin mengelola jadwal & kelas terbatas pada prodinya; `LAB_HEAD` hanya untuk lab-nya; `DEAN` hanya baca agregat. |
| **`supabase/migrations/*`** (`set_assistant`) | Memeriksa `LECTURER` atau `ACADEMIC_STAFF` / `SUPER_ADMIN` untuk `ASISTEN_LAB`. | **Dirombak di Fase 4.1**: `ASISTEN_LAB` hanya boleh dikelola oleh `LECTURER` (pengampu kelas) dan `LAB_HEAD` (kepala lab kelas terkait). Staf Akademik & Super Admin dicabut hak kelolanya (hanya baca). |
| **`src/lib/config/menu-config.ts`** | `normalizeRoleCode`, `getRoleHomeHref`, `getRoleDisplayName`, `isRouteAllowedForRole`, `MENU_CONFIG`. | Daftarkan `PROGRAM_SECRETARY` (`/secretary`), `LAB_HEAD` (`/lab`), `DEAN` (`/dean`). Dosen tetap `/lecturer` dengan tambahan sub-menu "Perwalian". |
| **`src/modules/identity/schemas.ts`** | Enum `switchWorkspaceSchema` dan `registerSchema` (7 peran). | Perluas enum dengan `PROGRAM_SECRETARY`, `LAB_HEAD`, `DEAN`. |
| **`src/modules/identity/actions.ts`** | `ROLE_PORTAL_MAP`, `switchWorkspaceAction`, `updateUserRoleAction`. | Petakan portal rute default, izinkan `SUPER_ADMIN` menetapkan ketiga peran baru beserta `scope_id`, rekam ke `audit_logs`. |
| **`src/modules/academic/actions.ts`** (`setAssistantAction`) | Menerima `LECTURER`, `ACADEMIC_STAFF`, `SUPER_ADMIN`. | Batasi `ASISTEN_LAB` hanya untuk `LECTURER` dan `LAB_HEAD`. Tolak `ACADEMIC_STAFF` dan `SUPER_ADMIN` dengan pesan Indonesia yang ramah. |
| **`src/modules/early-warning/*`** (`getMentoringRiskListAction`) | Mengambil dari `lecturerId` via in-memory store/classes. | Hubungkan dengan tabel baru `academic_advisories` (`advisor_user_id = auth.uid()`). Dekan hanya melihat agregat tanpa identitas mahasiswa. |

---

## 3. Titik Penutupan Tipe TypeScript (Exhaustive Checks)

1. `src/modules/identity/schemas.ts`:
   - `switchWorkspaceSchema`: `z.enum([...7 roles..., 'PROGRAM_SECRETARY', 'LAB_HEAD', 'DEAN'])`.
2. `src/modules/identity/actions.ts`:
   - `ROLE_PORTAL_MAP`: Tambahkan entri `PROGRAM_SECRETARY: '/secretary'`, `LAB_HEAD: '/lab'`, `DEAN: '/dean'`.
3. `src/lib/config/menu-config.ts`:
   - `normalizeRoleCode`: Petakan alias sekprodi (`SEKPRODI`, `PROGRAM_SECRETARY`), kepala lab (`KALAB`, `LAB_HEAD`), dekan (`DEKAN`, `DEAN`).
   - `getRoleHomeHref`: Mengembalikan `/secretary`, `/lab`, `/dean`.
   - `getRoleDisplayName`: "Sekretaris Program Studi", "Kepala Laboratorium", "Dekan".
   - `MENU_CONFIG`: Menyediakan grup menu untuk ketiga peran baru.
   - `isRouteAllowedForRole`: Proteksi rute `/secretary/*`, `/lab/*`, `/dean/*`.

---

## 4. Rencana Data Dosen Wali & Modul Perwalian

1. **Struktur Data Baru (`academic_advisories`)**:
   - Menghubungkan `advisor_user_id` (`LECTURER`) dan `student_user_id` (`STUDENT`) dengan `status = 'ACTIVE'`.
   - Indeks unik parsial: `UNIQUE (student_user_id) WHERE (status = 'ACTIVE')` memastikan mahasiswa hanya memiliki satu wali aktif.
2. **Catatan Perwalian (`advisory_notes`)**:
   - `advisory_id`, `author_id`, `content`, `created_at`.
   - Akses baca: Dosen Wali yang bersangkutan, Kaprodi, dan Sekprodi prodi tersebut.
3. **Pemberian Persetujuan KRS**:
   - Mahasiswa mengajukan KRS -> Status `DIAJUKAN` ("Menunggu Persetujuan Wali").
   - Hanya dosen yang terdaftar sebagai wali aktif mahasiswa yang dapat menyetujui (`requests-view.tsx` & `krs-store.ts`).
4. **Data Legacy (`dosenWaliId`)**:
   - Dibuatkan skrip migrasi data idempoten `scripts/migrate-legacy-advisories.ts` untuk memindahkan `dosenWaliId` dari data json/store lama ke tabel `academic_advisories`.

---

## 5. Acuan Tampilan Antarmuka (UI Pattern Alignment)

Mengikuti Aturan Keras Bagian 3: **Desain web tidak boleh berubah** (tidak ada warna hex baru, tidak mengubah token tema).
- **Sekretaris Prodi (`/secretary`)**: Menggunakan komponen hub yang sama dengan Koordinator Prodi (`coordinator-monitoring-hub-view`, `coordinator-reports-hub-view`) dengan prop `readOnly={true}` atau `canApprove={false}`.
- **Kepala Laboratorium (`/lab`)**: Menggunakan pola kartu dan tabel kelas praktikum yang ada di `staff-classes-hub-view.tsx` dan `assistant-forms.tsx`.
- **Dekan (`/dean`)**: Menggunakan pola ringkasan KPI dan grafik metrik agregat yang ada di `coordinator-reports-hub-view.tsx` dan `lecturer-analytics-hub-view.tsx` tanpa menampilkan nama atau identitas individual mahasiswa.

---

## 6. Rencana Pengujian & Kepatuhan CI

1. `npm run cek:hex`: Wajib lolos 0 pelanggaran warna hex mentah.
2. `npm run check:rls`: Memastikan tabel `faculties`, `laboratories`, `class_laboratories`, `academic_advisories`, `advisory_notes` memiliki RLS aktif.
3. `npm run check:snapshot`: Memperbarui `docs/schema-snapshot.md` via `npm run snapshot` setelah migrasi dibuat.
4. `npm run typecheck`: Memastikan tidak ada kesalahan tipe TypeScript di seluruh repositori.
5. `npm test`: Menjalankan seluruh rangkaian tes Vitest (unit tests matriks wewenang, perwalian, dan validasi RBAC).
