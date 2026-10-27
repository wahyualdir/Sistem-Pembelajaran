# Laporan Progres Implementasi Peran Baru SIAJAR

Dokumen ini mencatat matriks pelacakan `Menu → Rute → Server Action → Kebijakan RLS / Permission` serta status eksekusi tiap fase.

---

## 1. Status Fase

| Fase | Deskripsi | Status | Catatan / Bukti |
| :--- | :--- | :---: | :--- |
| **Fase 0** | Audit Kode, Identitas, RLS, & Navigasi | **SELESAI** | Hasil audit lengkap di `docs/AUDIT_PERAN_BARU.md`. |
| **Fase 1** | Fondasi Peran dan Lingkup (Enum, Migrasi, Roles, Master Data) | **SELESAI** | 4 migrasi (39-42), enum `FACULTY` & `LAB`, helper `is_program_secretary`, `is_dean_of_program`, `is_lab_head`, `is_lab_head_of_class`, master data fakultas & laboratorium di Staf/Super Admin, akun demo, snapshot 44 migrasi, RLS 155 tabel aktif, `typecheck` & `cek:hex` hijau. |
| **Fase 2** | Dosen Wali sebagai Tugas Dosen (Data, Advisory Notes, Menu Perwalian) | **DALAM PROSES** | Pembuatan skema `academic_advisories`, `advisory_notes`, helper perwalian, dan menu perwalian dosen. |
| **Fase 3** | Sekretaris Prodi (`PROGRAM_SECRETARY`) | **MENUNGGU** | Menunggu penyelesaian Fase 2. |
| **Fase 4** | Kepala Laboratorium (`LAB_HEAD`) & Reformasi Wewenang Asisten Lab | **MENUNGGU** | Menunggu penyelesaian Fase 3. |
| **Fase 5** | Dekan (`DEAN`) (Pemantauan Agregat Tingkat Fakultas) | **MENUNGGU** | Menunggu penyelesaian Fase 4. |
| **Fase 6** | Penyelarasan Koordinator, Matriks Wewenang, Pengujian, Dokumentasi | **MENUNGGU** | Menunggu penyelesaian Fase 5. |

---

## 2. Matriks Menu → Rute → Server Action → Kebijakan RLS / Permission

| Menu ID | Label Menu | Role Berwenang | Rute Halaman | Server Action / Data Fetcher | Kebijakan RLS / Helper DB |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `stf-master` (Tab Fakultas) | Data Master: Fakultas | `ACADEMIC_STAFF`, `SUPER_ADMIN` | `/staff/master?tab=fakultas` | `listMasterDataAction`, `createFacultyAction` | `faculties_select`, `faculties_write` |
| `stf-master` (Tab Laboratorium) | Data Master: Laboratorium | `ACADEMIC_STAFF`, `SUPER_ADMIN` | `/staff/master?tab=laboratorium` | `listMasterDataAction`, `createLaboratoryAction` | `laboratories_select`, `laboratories_write` |
| `sek-beranda` | Beranda Sekprodi | `PROGRAM_SECRETARY` | `/secretary` | `getCurrentUserWithRoles` | `is_program_secretary(program_id)` |
| `lab-beranda` | Beranda Kepala Lab | `LAB_HEAD` | `/lab` | `getCurrentUserWithRoles` | `is_lab_head(lab_id)` |
| `dkn-beranda` | Beranda Dekan | `DEAN` | `/dean` | `getCurrentUserWithRoles` | `is_dean_of_program(program_id)` |
