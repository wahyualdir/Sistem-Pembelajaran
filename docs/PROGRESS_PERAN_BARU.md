# Laporan Progres Implementasi Peran Baru SIAJAR

Dokumen ini mencatat matriks pelacakan `Menu → Rute → Server Action → Kebijakan RLS / Permission` serta status eksekusi tiap fase.

---

## 1. Status Fase

| Fase | Deskripsi | Status | Catatan / Bukti |
| :--- | :--- | :---: | :--- |
| **Fase 0** | Audit Kode, Identitas, RLS, & Navigasi | **SELESAI** | Hasil audit lengkap di `docs/AUDIT_PERAN_BARU.md`. |
| **Fase 1** | Fondasi Peran dan Lingkup (Enum, Migrasi, Roles, Master Data) | **SELESAI** | Migrasi (39-43), enum `FACULTY` & `LAB`, helper `is_program_secretary`, `is_lab_head`, `is_lab_head_of_class`, master data fakultas & laboratorium di Staf/Super Admin, akun demo, snapshot migrasi, RLS aktif, `typecheck` & `cek:hex` hijau. *(Role DEAN dibatalkan & dihapus per instruksi)*. |
| **Fase 2** | Dosen Wali sebagai Tugas Dosen (Data, Advisory Notes, Menu Perwalian) | **SELESAI** | Migrasi (44) `academic_advisories`, `advisory_notes`, indeks parsial unik, helper `is_advisor_of`, `advisor_of_current_student`, fungsi atomik `assign_academic_advisor`. Server action di `advisory-actions.ts`. Menu `dsn-perwalian` (`/lecturer/advisory`) dan `dsn-mhs-bimbingan` (`/lecturer/mentoring`), kartu Dosen Wali di `/student` & `/profile`, 8 unit test di `tests/advisory-role.test.ts` lolos 100%. |
| **Fase 3** | Sekretaris Prodi (`PROGRAM_SECRETARY`) | **SELESAI** | Implementasi portal `/secretary/**` (Beranda, Monitoring, Jadwal/Kelas, Perwalian, Pengajuan/Requests, Risiko, Laporan). Penggunaan ulang komponen `coordinator-*-hub-view` dengan pembatasan wewenang `canApprove={false}`. Server guard `assertServerRole(['PROGRAM_SECRETARY'])`, server action `decideGradeChangeAction` menolak peran ini secara ketat di server, 6 unit test di `tests/secretary-role.test.ts` lolos 100%. Audit menu 137 item BERFUNGSI (0 rusak/tiruan). |
| **Fase 4** | Kepala Laboratorium (`LAB_HEAD`) & Reformasi Wewenang Asisten Lab | **SELESAI** | Migrasi (45) pembaruan fungsi atomik `public.set_assistant` dan policy `class_assistants_select` (mencakup `is_lab_head_of_class`). Otorisasi Asisten Lab direformasi: hanya Dosen Pengampu dan Kepala Lab yang berwenang menugaskan/mencabut `ASISTEN_LAB`. Kontrol tulis Staf Akademik & Super Admin dicabut. Implementasi portal `/lab/**` (Beranda, Profil, Asisten, Kelas, Jadwal, Rekap). 7 unit test di `tests/lab-head-role.test.ts` lolos 100%. Audit menu 149 item BERFUNGSI (0 rusak/tiruan). |
| **Fase 5** | Dekan (`DEAN`) (Pemantauan Agregat Tingkat Fakultas) | **DIBATALKAN** | Dihapus secara permanen per instruksi pengguna; peran Dekan ditiadakan dari sistem. |
| **Fase 6** | Penyelarasan Koordinator, Matriks Wewenang, Pengujian, Dokumentasi | **DALAM PROGRES** | Sedang dieksekusi sebagai penutup implementasi. |

---

## 2. Matriks Menu → Rute → Server Action → Kebijakan RLS / Permission

| Menu ID | Label Menu | Role Berwenang | Rute Halaman | Server Action / Data Fetcher | Kebijakan RLS / Helper DB |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `stf-master` (Tab Fakultas) | Data Master: Fakultas | `ACADEMIC_STAFF`, `SUPER_ADMIN` | `/staff/master?tab=fakultas` | `listMasterDataAction`, `createFacultyAction` | `faculties_select`, `faculties_write` |
| `stf-master` (Tab Laboratorium) | Data Master: Laboratorium | `ACADEMIC_STAFF`, `SUPER_ADMIN` | `/staff/master?tab=laboratorium` | `listMasterDataAction`, `createLaboratoryAction` | `laboratories_select`, `laboratories_write` |
| `sek-beranda` | Beranda Sekprodi | `PROGRAM_SECRETARY` | `/secretary` | `getCurrentUserWithRoles`, `listChangeRequestsAction`, `getCoordinatorCohortRiskAction` | `is_program_secretary(program_id)` |
| `sek-kalender` | Kalender | `PROGRAM_SECRETARY` | `/calendar` | Standard Portal Calendar | Standard User Access |
| `sek-notifikasi` | Notifikasi | `PROGRAM_SECRETARY` | `/notifications` | Standard Notification Center | Standard User Access |
| `sek-pengumuman` | Pengumuman | `PROGRAM_SECRETARY` | `/announcements` | Standard Announcements View | Standard User Access |
| `sek-monitoring` | Monitoring Prodi | `PROGRAM_SECRETARY` | `/secretary/monitoring` | `CoordinatorMonitoringHubView` | `is_program_secretary(program_id)` |
| `sek-jadwal-kelas` | Jadwal dan Penugasan Kelas | `PROGRAM_SECRETARY` | `/secretary/classes` | `CoordinatorAssignmentsHubView` | `is_program_secretary(program_id)` |
| `sek-perwalian` | Perwalian | `PROGRAM_SECRETARY` | `/secretary/advisory` | `getAdviseesListAction`, `assignAdvisorAction`, `revokeAdvisorAction` | `academic_advisories_select`, `academic_advisories_write`, `is_program_secretary` |
| `sek-pengajuan` | Pengajuan Mahasiswa | `PROGRAM_SECRETARY` | `/secretary/requests` | `listChangeRequestsAction` (`canApprove={false}`) | `change_requests_select` |
| `sek-risiko` | Risiko Mahasiswa | `PROGRAM_SECRETARY` | `/secretary/risk` | `getCoordinatorCohortRiskAction`, `getAllAtRiskStudentsAction` | `is_program_secretary(program_id)` |
| `sek-laporan` | Laporan Akademik | `PROGRAM_SECRETARY` | `/secretary/reports` | `CoordinatorReportsHubView` | `is_program_secretary(program_id)` |
| `kaprodi-perwalian` | Perwalian | `PROGRAM_COORDINATOR` | `/coordinator/advisory` | `getAdviseesListAction`, `assignAdvisorAction`, `revokeAdvisorAction` | `academic_advisories_select`, `academic_advisories_write`, `is_program_coordinator` |
| `lab-beranda` | Beranda Kepala Lab | `LAB_HEAD` | `/lab` | `getCurrentUserWithRoles`, `DEMO_LAB_CLASSES` | `is_lab_head(lab_id)` |
| `lab-kalender` | Kalender | `LAB_HEAD` | `/calendar` | Standard Portal Calendar | Standard User Access |
| `lab-notifikasi` | Notifikasi | `LAB_HEAD` | `/notifications` | Standard Notification Center | Standard User Access |
| `lab-pengumuman` | Pengumuman | `LAB_HEAD` | `/announcements` | Standard Announcements View | Standard User Access |
| `lab-profil` | Laboratorium Saya | `LAB_HEAD` | `/lab/profile` | `LabProfileView` | `laboratories_select`, `is_lab_head(lab_id)` |
| `lab-asisten` | Asisten Lab | `LAB_HEAD` | `/lab/assistants` | `setAssistantAction`, `DEMO_LAB_ASSISTANTS` | `is_lab_head_of_class(class_id)`, `class_assistants_select` |
| `lab-kelas` | Kelas Praktikum | `LAB_HEAD` | `/lab/classes` | `DEMO_LAB_CLASSES` | `class_laboratories_select`, `is_lab_head(lab_id)` |
| `lab-jadwal` | Jadwal & Penggunaan Lab | `LAB_HEAD` | `/lab/schedules` | `LabSchedulesView` | `class_schedule_slots_select` |
| `lab-rekap` | Rekap Praktikum | `LAB_HEAD` | `/lab/recap` | `LabRecapView` (Read-only) | `is_lab_head(lab_id)` |
| `dsn-perwalian` | Perwalian & Rencana Studi | `LECTURER` | `/lecturer/advisory` | `getAdviseesListAction`, `getPendingAdviseeKrsAction`, `getMentoringRiskListAction`, `approveAdviseeKrsAction`, `rejectAdviseeKrsAction`, `addAdvisoryNoteAction` | `academic_advisories_select`, `academic_advisories_write`, `advisory_notes_select`, `is_advisor_of(student_id)` |
| `dsn-mhs-bimbingan` | Mahasiswa Bimbingan | `LECTURER` | `/lecturer/mentoring` | `getAdviseesListAction`, `getPendingAdviseeKrsAction`, `getMentoringRiskListAction` | `is_advisor_of(student_id)`, `academic_advisories_select` |
| *(Komponen Mahasiswa)* | Kartu Dosen Wali Saya | `STUDENT` | `/student`, `/profile` | `getMyAdvisorAction` | `advisor_of_current_student()`, `academic_advisories_select` |
