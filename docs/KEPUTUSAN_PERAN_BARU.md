# Log Keputusan Arsitektur dan Teknis — Penambahan Peran Baru SIAJAR

Dokumen ini mencatat keputusan arsitektural dan teknis yang diambil selama implementasi `docs/INSTRUKSI_PERAN_BARU.md`.

---

## Keputusan Awal & Konfigurasi Dasar

1. **Struktur Identitas**:
   - Dosen Wali **bukan peran** (bukan baris baru di tabel `roles`), melainkan relasi penugasan dosen terhadap mahasiswa (`academic_advisories`).
   - Peran baru yang diimplementasikan: `PROGRAM_SECRETARY` (Sekretaris Prodi) dan `LAB_HEAD` (Kepala Laboratorium).
   - *Catatan Penting*: Peran `DEAN` (Dekan) telah **dibatalkan dan dihapus secara permanen** dari sistem sesuai instruksi eksplisit pengguna.
2. **Pengelolaan Asisten Lab**:
   - Hak penugasan asisten lab diserahkan ke Dosen Pengampu dan Kepala Lab (`LAB_HEAD`).
3. **Penyelarasan Koordinator Prodi**:
   - Peran `PROGRAM_COORDINATOR` dipertahankan sebagai pemegang wewenang persetujuan akhir perubahan nilai dan log audit tingkat prodi.
4. **Pendaftaran Kode & UUID Tetap**:
   - Roles baru di `public.roles`:
     - `PROGRAM_SECRETARY`: `10000000-0000-0000-0000-000000000011`
     - `LAB_HEAD`: `10000000-0000-0000-0000-000000000012`
5. **Penetapan Awalan Menu & Rute Portal**:
   - Sekretaris Prodi: awalan ID menu `sek-`, gerbang portal `/secretary`.
   - Kepala Lab: awalan ID menu `lab-`, gerbang portal `/lab`.
6. **Desain Web dan Komponen**:
   - Sesuai Bagian 3.1, tidak ada penambahan token warna hex atau perubahan pada `tailwind.config.ts`.
   - Seluruh tampilan baru memanfaatkan komponen dan kelas token yang sudah ada (`bg-surface`, `text-ink`, `border-border`, dll.).

---

## Keputusan Fase 1: Fondasi Skema, Helper RLS, dan Registrasi Peran

1. **Migrasi Role Permissions Bersyarat**:
   - Pada migrasi `20261027000041`, penautan permission ke `PROGRAM_COORDINATOR` dan `ACADEMIC_STAFF` dibungkus dengan pengecekan `IF r_coord IS NOT NULL` dan `IF r_staff IS NOT NULL` agar migrasi dapat berjalan mulus pada database bersih (di mana role dasar baru diisi oleh seed berikutnya).
2. **Backfill Fakultas Default**:
   - Dibuatkan satu fakultas bawaan ('FT' - 'Fakultas Teknik', ID `20000000-0000-0000-0000-000000000001`) pada migrasi `20261027000040` untuk membackfill program studi yang ada.
3. **Penyelarasan Helper Functions**:
   - Seluruh helper SQL (`is_program_secretary`, `is_lab_head`, `is_lab_head_of_class`) didefinisikan dengan `SECURITY DEFINER`, `SET search_path = ''`, `STABLE`, hak eksekusi dicabut dari public/anon dan hanya diberikan kepada `authenticated`.
4. **Manajemen Pengguna & Impersonasi**:
   - Hanya `SUPER_ADMIN` yang diizinkan menetapkan atau mencabut peran baru (`PROGRAM_SECRETARY`, `LAB_HEAD`) dengan parameter lingkup (`scopeType` dan `scopeId`). Seluruh aksi tercatat pada `audit_logs`.
5. **Pembatalan & Penghapusan Peran Dekan (DEAN)**:
   - Berdasarkan instruksi pengguna (*"hapus saja role dekan dan push dan commit semua codenya"*), peran `DEAN` dihapus dari kode aplikasi (`menu-config.ts`, `workspace/page.tsx`, `actions.ts`, `demo-users.ts`, `superadmin-users-hub-view.tsx`) dan database (`20261028000043_remove_dean_role.sql`).
   - Rencana Fase 5 (Dekan) ditiadakan; alur kerja berlanjut langsung dari Fase 4 ke Fase 6.


---

## Keputusan Fase 2: Dosen Wali sebagai Tugas Melekat pada LECTURER

1. **Skema Relasi Perwalian & Catatan Internal**:
   - Dibuatkan tabel `academic_advisories` dengan partial unique index pada `(student_user_id) WHERE (status = 'ACTIVE')` untuk menjamin bahwa 1 mahasiswa hanya memiliki 1 Dosen Wali aktif pada satu waktu.
   - Dibuatkan tabel `advisory_notes` untuk mencatat konsultasi dan bimbingan akademik secara internal (hanya dapat dibaca oleh dosen wali yang bersangkutan, Kaprodi, Sekprodi, dan Super Admin). Kolom `note_for_student` disediakan apabila dosen ingin meninggalkan catatan yang secara eksplisit dapat dibaca mahasiswa.
2. **Fungsi Atomik Pergantian Dosen Wali**:
   - Dibuatkan fungsi Postgres `assign_academic_advisor(p_student_id, p_advisor_id, p_program_id, p_angkatan, p_assigned_by)` yang secara otomatis mengakhiri perwalian aktif sebelumnya (`status = 'ENDED'`, `valid_until = now()`) dan menyisipkan perwalian aktif baru secara transaksional.
   - Helper `is_advisor_of(student_id)` dan `advisor_of_current_student()` didefinisikan dengan `SECURITY DEFINER`, `SET search_path = ''`, `STABLE` dan hak eksekusi hanya untuk `authenticated`.
3. **Penyempitan Otorisasi Peringatan Dini**:
   - Otorisasi pada `getMentoringRiskListAction` diperketat agar membatasi data hanya untuk `advisor_user_id = pengguna saat ini`. Peran lain yang kebetulan memiliki wewenang jabatan tetap hanya melihat mahasiswa bimbingannya sendiri lewat jalur ini.
4. **Navigasi & UI Dosen Wali**:
   - Menu `dsn-perwalian` ditambahkan pada `LECTURER_GROUPS` dengan tautan `/lecturer/advisory` tanpa mengubah, memindahkan, atau menghapus menu dosen yang sudah ada (`dsn-mhs-bimbingan`).
   - Halaman `/lecturer/advisory` dan `/lecturer/mentoring` menyajikan hub terpadu dengan 3 tab: Mahasiswa Bimbingan & Status Risiko, Antrean Persetujuan KRS Mahasiswa Perwalian, dan Catatan Konsultasi Perwalian.
5. **Kartu Dosen Wali Sisi Mahasiswa**:
   - Dosen Wali ditampilkan di Beranda Mahasiswa (`/student`) dan Profil Pengguna (`/profile`) via `getMyAdvisorAction`. Jika belum ada wali aktif, menampilkan status 'Belum Ditetapkan'.
6. **Migrasi Data Legacy**:
   - Disediakan skrip migrasi sekali jalan `scripts/migrate-legacy-advisories.js` untuk memindahkan data relasi legacy `dosenWaliId` ke `academic_advisories`.

---

### Fase 3: Sekretaris Prodi (`PROGRAM_SECRETARY`)

1. **Prinsip Peran — Membantu & Memverifikasi, Bukan Memutuskan Akhir**:
   - `PROGRAM_SECRETARY` memiliki lingkup `scope_type = 'PROGRAM'` dan menaungi operasional program studi yang sama dengan `PROGRAM_COORDINATOR`.
   - Wewenang mencakup pemantauan perkuliahan, penyiapan jadwal dan penugasan kelas, penetapan Dosen Wali, verifikasi awal pengajuan mahasiswa, pemantauan peringatan dini (EWS) mahasiswa berisiko, serta pengunduhan laporan akademik.
2. **Batasan Server Tegas**:
   - `decideGradeChangeAction` dibatasi secara ketat hanya untuk aktor `PROGRAM_COORDINATOR`. Panggilan dari `PROGRAM_SECRETARY` ditolak di server dengan pesan otorisasi resmi (`Aksi ini tidak tersedia untuk peran Anda`).
   - Tombol persetujuan/penolakan nilai dihilangkan dari tampilan Sekprodi melalui prop `canApprove={false}`.
   - Akses log audit sistem (`/admin/system/audit`) sepenuhnya diblokir untuk Sekprodi.
3. **Pemanfaatan Ulang Komponen Antarmuka**:
   - Komponen `coordinator-*-hub-view` dan `CoordinatorDashboardClient` digunakan ulang dengan parameter kemampuan (`isSecretary={true}`, `canApprove={false}`, `basePath="/secretary/..."`) untuk memastikan keseragaman visual tanpa duplikasi kode.
4. **Hub Manajemen Perwalian Terpadu**:
   - Dibuatkan `AdvisoryManagementHubView` di `src/modules/academic/advisory-management-hub-view.tsx` yang digunakan bersama oleh Kaprodi (`/coordinator/advisory`) dan Sekprodi (`/secretary/advisory`) untuk menata distribusi Dosen Wali dan bimbingan akademik.


---

## Keputusan Fase 4: Kepala Laboratorium (`LAB_HEAD`) & Reformasi Asisten Lab

1. **Reformasi Otoritas Asisten Lab**:
   - Penugasan, pengubahan izin, dan pencabutan `ASISTEN_LAB` hanya dapat dilakukan oleh **Dosen Pengampu kelas** (`is_class_lecturer`) atau **Kepala Laboratorium** dari laboratorium yang menaungi kelas praktikum tersebut (`is_lab_head_of_class`).
   - Wewenang tulis langsung dari `ACADEMIC_STAFF` dan `SUPER_ADMIN` untuk `ASISTEN_LAB` dicabut pada tingkat fungsi database (`public.set_assistant` via migrasi `20261028000045_lab_assistant_authority.sql`) dan divalidasi pada Server Action (`setAssistantAction`).
   - Staf Akademik dan Super Admin tetap memiliki wewenang **membaca** daftar asisten lab demi kepentingan rekapitulasi dan pemantauan kurikulum (`class_assistants_select` RLS policy dipertahankan).
   - Penugasan `ASISTEN_DOSEN` tetap seperti sebelumnya (Dosen Pengampu kelas atau Super Admin).
   - Pencatatan `actor_role` pada audit log: jika pelaku adalah Dosen Pengampu kelas, dicatat `'LECTURER'`; jika bukan tetapi Kepala Lab kelas tersebut, dicatat `'LAB_HEAD'`; jika seseorang merangkap keduanya, dicatat `'LECTURER'`.

2. **Arsitektur Antarmuka & Portal Kepala Lab (`/lab`)**:
   - Dibuat layout portal `/lab` yang diproteksi secara tegas oleh `assertServerRole(['LAB_HEAD'])`.
   - Seluruh rute `/lab` (Beranda, Profil Lab, Asisten Lab, Kelas Praktikum, Jadwal Lab, dan Rekap Praktikum) diimplementasikan secara fungsional penuh di `src/modules/academic/lab-head-hub-view.tsx` menggunakan komponen retro brutalist tanpa token warna hex baru.
   - Pengecekan isolasi data: Kepala Lab hanya dapat melihat dan mengelola kelas praktikum serta asisten lab yang terhubung ke laboratorium miliknya melalui relasi `class_laboratories`.

3. **Penyelarasan UI Staf & Dosen**:
   - Label pada `assistant-forms.tsx` diperbarui menjadi "Dosen Pengampu & Kepala Lab".
   - Kontrol tambah/ubah/cabut pada `staff-classes-hub-view.tsx` dinonaktifkan dan diganti dengan badge read-only serta catatan kebijakan resmi.
   - Percabangan `isStaff` pada `class-hub-tabs.tsx` untuk Asisten Lab dihapus.

---

## Keputusan Fase 6: Penyelarasan Koordinator, Matriks Wewenang & Penyelesaian Akhir

1. **Total 9 Peran Utama SIAJAR**:
   - Sistem kini memiliki tepat 9 peran yang tercatat di tabel `roles` dan enum RBAC:
     1. `STUDENT` (Mahasiswa)
     2. `TEACHING_ASSISTANT` (Asisten Dosen / Lab)
     3. `LECTURER` (Dosen Pengampu — dengan tugas melekat Dosen Wali)
     4. `PROGRAM_COORDINATOR` (Koordinator Program Studi / Kaprodi)
     5. `PROGRAM_SECRETARY` (Sekretaris Program Studi / Sekprodi)
     6. `LAB_HEAD` (Kepala Laboratorium / Kalab)
     7. `ACADEMIC_STAFF` (Staf Akademik)
     8. `SYSTEM_ADMIN` (Administrator Sistem)
     9. `SUPER_ADMIN` (Super Administrator)
   - Peran `DEAN` dibatalkan dan dihapus secara tuntas dari seluruh basis kode, basis data, dan menu navigasi.
   - Dosen Wali diimplementasikan sebagai relasi penugasan struktural (`academic_advisories`), bukan peran.

2. **Penyelarasan Rute & Resolusi Menu Global**:
   - `getRoleHomeHref` dilengkapi rute untuk `PROGRAM_SECRETARY` (`/secretary`) dan `LAB_HEAD` (`/lab`).
   - `getRoleDisplayName` memetakan nama bahasa Indonesia baku untuk seluruh 9 peran.
   - Audit menu (`npm run audit:menu`) mengonfirmasi 149 menu berstatus **BERFUNGSI** penuh, 0 menu tiruan, 0 menu sebagian, dan 0 menu rusak.
   - Seluruh 166 halaman portal dan rute dinamis berhasil dikompilasi tanpa galat (`npm run build`).
