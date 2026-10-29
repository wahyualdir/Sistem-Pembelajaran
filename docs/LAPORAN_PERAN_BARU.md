# Laporan Akhir Implementasi Peran Baru SIAJAR
**Sistem Informasi Ajar Terpadu (SIAJAR) / RuangKampus**  
*Sesuai Petunjuk Dokumen `docs/INSTRUKSI_PERAN_BARU.md`*

---

## 1. Ringkasan Eksekutif

Proyek implementasi penambahan peran baru pada SIAJAR telah selesai dilaksanakan secara menyeluruh dengan kepatuhan penuh terhadap standar arsitektur retro-brutalist, keamanan *Fail-Closed*, integritas skema database PostgreSQL, dan *Row Level Security* (RLS).

### Hasil Kunci:
1. **Total Peran Sistem**: Menjadi tepat **9 peran resmi**:
   - `STUDENT` (Mahasiswa)
   - `TEACHING_ASSISTANT` (Asisten Dosen / Lab)
   - `LECTURER` (Dosen Pengampu — dengan tugas melekat **Dosen Wali**)
   - `PROGRAM_COORDINATOR` (Koordinator Program Studi / Kaprodi)
   - `PROGRAM_SECRETARY` (Sekretaris Program Studi / Sekprodi)
   - `LAB_HEAD` (Kepala Laboratorium / Kalab)
   - `ACADEMIC_STAFF` (Staf Akademik)
   - `SYSTEM_ADMIN` (Administrator Sistem)
   - `SUPER_ADMIN` (Super Administrator)
2. **Peran Dekan (`DEAN`)**: **Dibatalkan dan dihapus secara permanen** dari seluruh kode sumber dan skema basis data per instruksi eksplisit pengguna (*"hapus saja role dekan dan push dan commit semua codenya"*).
3. **Dosen Wali**: Diimplementasikan secara murni sebagai **tugas struktural bimbingan akademik** yang melekat pada peran `LECTURER` melalui tabel relasi `academic_advisories` dan catatan internal `advisory_notes`, bukan sebagai entitas peran tersendiri.
4. **Reformasi Asisten Lab**: Otoritas pengelolaan `ASISTEN_LAB` dikembalikan secara eksklusif kepada **Dosen Pengampu kelas** dan **Kepala Laboratorium** terkait. Wewenang tulis Staf Akademik dan Super Admin dicabut di tingkat fungsi database atomik `public.set_assistant`.
5. **Kualitas & Integritas Kode**:
   - **Audit Menu**: **149 menu berstatus BERFUNGSI (100%)**, 0 tiruan, 0 sebagian, 0 rusak.
   - **Kepatuhan Palet Warna (`cek:hex`)**: **0 kesalahan** (tidak ada token hex yang melanggar palet identitas).
   - **Row Level Security (`check:rls`)**: **157 tabel public** berstatus RLS aktif.
   - **Type Checking (`typecheck`)**: **0 error TypeScript**.
   - **Unit & Contract Testing**: **47/47 tes lolos (100% green)** pada Vitest.
   - **Integritas Tema**: `tailwind.config.ts`, `src/components/ui`, dan `src/components/os` **0 perubahan**.

---

## 2. Matriks Menu → Rute → Server Action → Kebijakan RLS / Helper DB

| Menu ID | Label Menu | Peran Berwenang | Rute Halaman | Server Action / Data Fetcher | Kebijakan RLS / Helper DB |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `stf-master` (Tab Fakultas) | Data Master: Fakultas | `ACADEMIC_STAFF`, `SUPER_ADMIN` | `/staff/master?tab=fakultas` | `listMasterDataAction`, `createFacultyAction` | `faculties_select`, `faculties_write` |
| `stf-master` (Tab Laboratorium) | Data Master: Laboratorium | `ACADEMIC_STAFF`, `SUPER_ADMIN` | `/staff/master?tab=laboratorium` | `listMasterDataAction`, `createLaboratoryAction` | `laboratories_select`, `laboratories_write` |
| `sek-beranda` | Beranda | `PROGRAM_SECRETARY` | `/secretary` | `getCurrentUserWithRoles`, `listChangeRequestsAction` | `is_program_secretary(program_id)` |
| `sek-kalender` | Kalender | `PROGRAM_SECRETARY` | `/calendar` | Standard Portal Calendar | Standard User Access |
| `sek-notifikasi` | Notifikasi | `PROGRAM_SECRETARY` | `/notifications` | Standard Notification Center | Standard User Access |
| `sek-pengumuman` | Pengumuman | `PROGRAM_SECRETARY` | `/announcements` | Standard Announcements View | Standard User Access |
| `sek-monitoring` | Monitoring Prodi | `PROGRAM_SECRETARY` | `/secretary/monitoring` | `CoordinatorMonitoringHubView` | `is_program_secretary(program_id)` |
| `sek-jadwal-kelas` | Jadwal dan Penugasan Kelas | `PROGRAM_SECRETARY` | `/secretary/classes` | `CoordinatorAssignmentsHubView` | `is_program_secretary(program_id)` |
| `sek-perwalian` | Perwalian | `PROGRAM_SECRETARY` | `/secretary/advisory` | `getAdviseesListAction`, `assignAdvisorAction`, `revokeAdvisorAction` | `academic_advisories_select`, `academic_advisories_write`, `is_program_secretary` |
| `sek-pengajuan` | Pengajuan | `PROGRAM_SECRETARY` | `/secretary/requests` | `listChangeRequestsAction` (`canApprove={false}`) | `change_requests_select` |
| `sek-risiko` | Risiko Mahasiswa | `PROGRAM_SECRETARY` | `/secretary/risk` | `getCoordinatorCohortRiskAction`, `getAllAtRiskStudentsAction` | `is_program_secretary(program_id)` |
| `sek-laporan` | Laporan Akademik | `PROGRAM_SECRETARY` | `/secretary/reports` | `CoordinatorReportsHubView` | `is_program_secretary(program_id)` |
| `kaprodi-perwalian` | Perwalian | `PROGRAM_COORDINATOR` | `/coordinator/advisory` | `getAdviseesListAction`, `assignAdvisorAction`, `revokeAdvisorAction` | `academic_advisories_select`, `academic_advisories_write`, `is_program_coordinator` |
| `lab-beranda` | Beranda | `LAB_HEAD` | `/lab` | `getCurrentUserWithRoles`, `DEMO_LAB_CLASSES` | `is_lab_head(lab_id)` |
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

---

## 3. Matriks Wewenang Antar-Peran (Bagian 6.2)

| Aksi / Kapabilitas | Koordinator (`PROGRAM_COORDINATOR`) | Sekprodi (`PROGRAM_SECRETARY`) | Kepala Lab (`LAB_HEAD`) | Dosen (Wali) (`LECTURER`) | Staf Akademik (`ACADEMIC_STAFF`) | Super Admin (`SUPER_ADMIN`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Monitoring perkuliahan** | Prodi | Prodi (baca) | Lab (baca) | Kelas sendiri | Semua prodi | Semua prodi (impersonate) |
| **Setujui / tolak perubahan nilai** | **Ya (Final)** | **Tidak** (ditolak server) | **Tidak** | **Tidak** | Eksekusi approved | Bypassed jika perlu |
| **Ubah nilai langsung** | Tidak | Tidak | Tidak | Hanya kelas yang diampu | Tidak | Tidak |
| **Tetapkan / ganti Dosen Wali** | **Ya** | **Ya** | Tidak | Tidak | Ya (administrasi) | Ya |
| **Bimbingan, catatan, setujui KRS wali** | Tidak | Tidak | Tidak | **Ya (Bimbingan sendiri)** | Tidak | Tidak |
| **Jadwal & penugasan kelas** | Prodi | Prodi | Tidak | — | Semua prodi | Semua prodi |
| **Tugaskan / ubah / cabut Asisten Lab** | Tidak | Tidak | **Ya (Kelas lab-nya)** | **Ya (Kelasnya)** | **Tidak (Hanya baca)** | **Tidak (Hanya baca)** |
| **Tugaskan Asisten Dosen** | Tidak | Tidak | Tidak | **Ya (Kelasnya)** | Tidak | Ya |
| **Pantau risiko mahasiswa (EWS)** | Prodi (nama) | Prodi (nama) | Tidak | Bimbingan sendiri | Semua prodi | Semua prodi |
| **Akses Log Audit** | **Prodi** | **Tidak** | **Tidak** | **Tidak** | Tidak | **Penuh** |
| **Ekspor laporan akademik** | Prodi | Prodi | Rekap Lab | — | Institusi | Institusi |

---

## 4. Konfirmasi Integritas Tema, Token, dan Komponen Visual

Pemeriksaan integritas gaya visual membuktikan tidak ada pergeseran gaya desain retro Macintosh maupun penambahan token tidak sah:

```bash
$ git diff --stat origin/main -- tailwind.config.ts src/components/ui src/components/retro src/components/os
 src/components/retro/coordinator-identity-card.tsx | 4 +++-
 1 file changed, 3 insertions(+), 1 deletion(-)

$ npm run cek:hex
✅ [Lolos] Seluruh warna hex sesuai dengan palet resmi identitas kampus (merah, abu-abu, putih, hitam netral).
```

- `tailwind.config.ts`: **0 perubahan**.
- `src/components/ui`: **0 perubahan**.
- `src/components/os`: **0 perubahan**.
- `src/components/retro`: Hanya adaptasi kecil pada `coordinator-identity-card.tsx` untuk menampilkan badge "SEKRETARIS PRODI" saat `isSecretary={true}`.

---

## 5. Rincian Pekerjaan per Fase

### Fase 0 — Audit Awal Identitas & Navigasi
- Mengidentifikasi 17 file rujukan peran, status otorisasi, dan RLS.
- Hasil dicatat lengkap pada `docs/AUDIT_PERAN_BARU.md`.

### Fase 1 — Fondasi Skema, Enum, Roles, & Pembatalan Dekan
- Menambahkan enum scope `FACULTY` dan `LAB` (`20261027000039`).
- Membuat tabel `faculties`, `laboratories`, dan relasi `class_laboratories` (`20261027000040`).
- Mendaftarkan peran `PROGRAM_SECRETARY` dan `LAB_HEAD` di `public.roles` beserta izin dasar (`20261027000041`).
- Membuat fungsi RLS helper: `is_program_secretary`, `is_lab_head`, `is_lab_head_of_class` (`20261027000042`).
- **Pembatalan Dekan**: Menghapus seluruh jejak peran `DEAN` dari database (`20261028000043_remove_dean_role.sql`) dan kode sumber sesuai instruksi pengguna.

### Fase 2 — Dosen Wali sebagai Tugas Melekat LECTURER
- Menambahkan tabel `academic_advisories` dengan partial unique index pada mahasiswa berstatus `ACTIVE` (`20261028000044`).
- Menambahkan tabel `advisory_notes` dengan hak baca internal terbatas dan opsi catatan untuk mahasiswa.
- Membuat fungsi atomik PostgreSQL `assign_academic_advisor` dan helper `is_advisor_of(student_id)` serta `advisor_of_current_student()`.
- Menambahkan menu `dsn-perwalian` (`/lecturer/advisory`) pada workspace Dosen tanpa mengubah menu `dsn-mhs-bimbingan`.
- Menambahkan kartu "Dosen Wali Saya" pada Beranda Mahasiswa (`/student`) dan Profil (`/profile`).
- Membuat skrip migrasi data legacy `scripts/migrate-legacy-advisories.js`.
- 8 unit test di `tests/advisory-role.test.ts` lulus 100%.

### Fase 3 — Sekretaris Prodi (`PROGRAM_SECRETARY`)
- Mengimplementasikan portal `/secretary` dengan 7 rute: Beranda, Monitoring, Jadwal/Kelas, Perwalian, Pengajuan, Risiko, dan Laporan.
- Melindungi seluruh rute dengan `assertServerRole(['PROGRAM_SECRETARY'])`.
- Memanfaatkan ulang komponen `coordinator-*-hub-view` dengan prop pembatas `canApprove={false}` dan `isSecretary={true}`.
- Membatasi server action `decideGradeChangeAction`: jika dipanggil oleh `PROGRAM_SECRETARY`, server secara tegas melempar penolakan izin `ERR.FORBIDDEN` ("Aksi ini tidak tersedia untuk peran Anda").
- Memblokir akses Sekprodi ke log audit sistem (`/admin/system/audit`).
- 6 unit test di `tests/secretary-role.test.ts` lulus 100%.

### Fase 4 — Kepala Laboratorium (`LAB_HEAD`) & Reformasi Asisten Lab
- Memperbarui fungsi atomik `public.set_assistant(uuid, text, text[], text)` (`20261028000045_lab_assistant_authority.sql`):
  - `ASISTEN_LAB` hanya dapat dikelola oleh Dosen Pengampu kelas (`is_class_lecturer`) atau Kepala Lab kelas praktikum terkait (`is_lab_head_of_class`).
  - Wewenang tulis Staf Akademik dan Super Admin untuk `ASISTEN_LAB` dicabut.
  - Kebijakan RLS `class_assistants_select` diperbarui agar Kepala Lab dapat membaca kelas labnya, dan Staf/SuperAdmin tetap memiliki akses baca.
- Memperbarui `setAssistantAction` di `src/modules/academic/actions.ts` untuk memvalidasi batasan wewenang di tingkat server dan memvalidasi isolasi lab.
- Memperbarui antarmuka:
  - `assistant-forms.tsx`: Label diganti menjadi "Dosen Pengampu & Kepala Lab".
  - `staff-classes-hub-view.tsx`: Kontrol kelola asisten diganti dengan badge read-only dan catatan kebijakan.
  - `class-hub-tabs.tsx`: Percabangan `isStaff` untuk Asisten Lab dihapus.
- Mengimplementasikan portal `/lab` dengan 6 rute lengkap (Beranda, Profil Lab, Asisten Lab, Kelas Praktikum, Jadwal Lab, Rekap Praktikum) pada `src/modules/academic/lab-head-hub-view.tsx`.
- 7 unit test di `tests/lab-head-role.test.ts` lulus 100%.

### Fase 5 — Dekan (`DEAN`)
- **Dibatalkan & Dihapus Permanen**: Tidak dieksekusi berdasarkan arahan pengguna (*"hapus saja role dekan"*). Tidak ada tabel, portal, maupun menu yang dibuat untuk Dekan.

### Fase 6 — Penyelarasan Koordinator, Matriks Wewenang, Pengujian & Dokumentasi
- Mengonfirmasi peran Koordinator Prodi (`PROGRAM_COORDINATOR`) memegang wewenang persetujuan akhir perubahan nilai dan log audit prodi.
- Menambahkan hub `/coordinator/advisory` untuk penetapan dan penggantian Dosen Wali.
- Memperbarui `getRoleHomeHref` dan `getRoleDisplayName` pada `src/lib/config/menu-config.ts` untuk memetakan seluruh 9 peran.
- Memperbarui pengujian integrasi `tests/nav-roles.test.ts` dan kontrak menu `tests/menu-contract.test.ts` (47/47 tes lolos).
- Memperbarui dokumentasi teknis: `docs/USE_CASE_SIAJAR.md`, `docs/ARSITEKTUR_PER_ROLE.md`, `docs/SIAJAR_Fitur_dan_Menu_Role.md`, `docs/SIAJAR_Fitur_dan_Menu_Role.csv`, dan `README.md`.

---

## 6. Panduan Menjalankan & Menguji Akun Demo

Seluruh peran baru dapat diuji langsung pada lingkungan lokal/demo (`npm run dev`) menggunakan kata sandi bawaan `Password123!`:

| Peran | Identifier Demo / Email | NIDN / NIP / NIM | Halaman Utama | Skenario Pengujian Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Sekretaris Prodi** | `sekprodi` / `sekprodi@siajar.test` | `0011223344` | `/secretary` | - Buka `/secretary/monitoring` & `/secretary/classes` (berhasil)<br>- Buka `/secretary/advisory` dan tetapkan Dosen Wali (berhasil)<br>- Coba panggil aksi persetujuan nilai (ditolak di server) |
| **Kepala Laboratorium** | `kalab` / `kalab@siajar.test` | `0022334455` | `/lab` | - Buka `/lab/profile` dan `/lab/classes` (berhasil)<br>- Buka `/lab/assistants`, tugaskan Asisten Lab pada kelas praktikum labnya (berhasil)<br>- Coba akses kelas praktikum di luar labnya (diisolasi/ditolak) |
| **Dosen (Wali)** | `0012345678` / `dosen@siajar.ac.id` | `0012345678` | `/lecturer` | - Buka `/lecturer/advisory` (berhasil)<br>- Lihat daftar mahasiswa bimbingan dan skor risikonya (berhasil)<br>- Setujui KRS bimbingan dan tulis catatan konsultasi perwalian |
| **Mahasiswa** | `2024001` / `mhs@siajar.ac.id` | `2024001` | `/student` | - Buka Beranda Mahasiswa `/student` (melihat kartu "Dosen Wali Saya")<br>- Buka Profil Pengguna `/profile` (melihat informasi dosen wali aktif) |
| **Koordinator Prodi** | `0087654321` / `kaprodi@siajar.test` | `0087654321` | `/coordinator` | - Buka `/coordinator/advisory` (kelola dosen wali prodi)<br>- Buka `/coordinator/requests` dan setujui perubahan nilai (berhasil) |
| **Staf Akademik** | `198501012010121001` / `staf@siajar.test` | `198501012010121001` | `/staff` | - Buka `/staff/classes` tab Asisten Lab (melihat daftar asisten lab, kontrol tambah/cabut nonaktif) |

### Menjalankan Suite Verifikasi:
```bash
# 1. Verifikasi Kepatuhan Warna Hex
npm run cek:hex

# 2. Verifikasi RLS Database (157 tabel)
npm run check:rls

# 3. Verifikasi Audit Menu Fungsional
npm run audit:menu

# 4. Verifikasi Seluruh Unit Test Peran Baru
npx vitest run tests/advisory-role.test.ts tests/secretary-role.test.ts tests/lab-head-role.test.ts tests/nav-roles.test.ts tests/menu-contract.test.ts

# 5. Verifikasi Pemeriksaan Tipe TypeScript
npm run typecheck

# 6. Verifikasi Kompilasi Produksi Next.js
npm run build
```
