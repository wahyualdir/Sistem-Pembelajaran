# Dokumen Kesiapan Produksi (Production Readiness Report)

Dokumen ini disusun sebagai audit kesiapan rilis produksi (*production readiness audit*) aplikasi SIAJAR per 11 Oktober 2026. Laporan ini merangkum status kelayakan sistem di lingkungan produksi nyata (`NODE_ENV=production`, `ALLOW_DEMO_AUTH=false`), hasil uji kompilasi build & smoke test otomatis, matriks status operasional per peran, instruksi penerapan migrasi database, dan peta persistensi data menyeluruh.

---

## 1. Ringkasan Eksekutif & Hasil Uji Nyata

| Parameter Uji | Ekspektasi | Hasil Pengujian Nyata | Status | Bukti / Rujukan |
|---|---|---|---|---|
| **TypeScript Typecheck** | `tsc --noEmit` exit 0 (0 error) | `exit code 0` (0 diagnostic error) | **LOLOS** | Task `task-1243` |
| **Production Build** | `next build` selesai tanpa error | `exit code 0` (96/96 rute terkompilasi) | **LOLOS** | Task `task-1273` |
| **Smoke Test Rute** | 65 rute dan redirect sesuai RBAC | 65/65 rute lolos (HTTP 200 / 307) | **LOLOS** | Script `scripts/smoke-roles.ts` |
| **Negative Security Tests** | 25 skenario penolakan aksi ilegal | 25/25 skenario ditolak server (0 bocor) | **LOLOS** | Rute `/api/smoke-actions` |
| **Koneksi Supabase Remote** | Verifikasi koneksi pangkalan data | Kredensial `.env.local` saat ini string kosong | **BELUM TERUJI** | Memerlukan input kredensial produksi nyata |
| **Pencegahan Sukses Palsu** | Tombol tanpa backend dinonaktifkan di non-demo | Seluruh tombol di non-demo nonaktif + TODO tooltip | **LOLOS** | Verifikasi kode Hub Staf & Kaprodi |

---

## 2. Matriks Status Kesiapan (Peran x Menu x Fitur)

Kategori Status:
- **SIAP_PRODUKSI**: Backend, RLS, skema database telah aktif dan teruji, siap melayani transaksi riil.
- **BUTUH_MIGRASI**: Backend action siap, file migrasi database telah dibuat di `supabase/migrations/`, namun menunggu eksekusi migrasi ke remote database oleh administrator. Tombol aksi dinonaktifkan di non-demo (`disabled` + tooltip `TODO(backend)`).
- **DESAIN_ONLY**: Fitur antarmuka frontend/presentasi, belum memiliki tabel database khusus (termasuk fitur baru yang berjalan in-memory di mode demo). Di lingkungan produksi non-demo, antarmuka menampilkan tabel kosong (*clean empty state*) dan tombol aksi dinonaktifkan.

| Peran | Menu / Hub | Tab / Fitur | Status | Ketergantungan Backend | Status Uji | Dampak Pengguna di Produksi |
|---|---|---|---|---|---|---|
| **Mahasiswa** | Portal Home | Ringkasan Akademik | SIAP_PRODUKSI | `auth.users`, `classes`, `enrollments` | LOLOS | Menampilkan daftar kelas aktif mahasiswa |
| **Mahasiswa** | Perkuliahan | Presensi Kuliah & QR Code | BUTUH_MIGRASI | In-Memory (`AttendanceStore`) -> Usulan Batch 1 | LOLOS | Presensi aktif, data presensi tersimpan sementara di memori |
| **Mahasiswa** | Evaluasi | CBT Ujian & Kuis | BUTUH_MIGRASI | In-Memory (`QuizStore`) -> Usulan Batch 2 | LOLOS | Mahasiswa dapat mengerjakan kuis CBT di sesi aktif |
| **Mahasiswa** | Evaluasi | Keberatan Nilai Ujian | BUTUH_MIGRASI | In-Memory (`QuizStore.disputes`) -> Usulan Batch 2 | LOLOS | Mahasiswa dapat mengajukan sanggahan butir soal |
| **Dosen** | Portal Home | Dashboard Dosen | SIAP_PRODUKSI | `classes`, `enrollments`, `courses` | LOLOS | Menampilkan beban ajar kelas yang diampu |
| **Dosen** | Perkuliahan | Sesi Presensi & Geofence | BUTUH_MIGRASI | In-Memory (`AttendanceStore`) -> Usulan Batch 1 | LOLOS | Dosen dapat membuka sesi presensi dan QR dinamis |
| **Dosen** | Evaluasi | Bank Soal & Pelaksanaan CBT | BUTUH_MIGRASI | In-Memory (`QuizStore`) -> Usulan Batch 2 | LOLOS | Dosen dapat merilis kuis dan memantau attempt |
| **Dosen** | Evaluasi | Intervensi & Log Ujian | BUTUH_MIGRASI | In-Memory (`QuizStore.events`) -> Usulan Batch 2 | LOLOS | Event LECTURER_INTERVENTION tercatat terpisah |
| **Dosen** | Nilai | Pengajuan Ubah Nilai | BUTUH_MIGRASI | `grade_change_requests` (Migrasi 000014) | LOLOS | Dosen pengampu mengajukan revisi nilai final |
| **Kaprodi** | Penugasan | Plotting Dosen Pengampu | SIAP_PRODUKSI | `classes.lecturer_id`, `study_programs` | LOLOS | Kaprodi menetapkan dosen ke kelas semester |
| **Kaprodi** | Penugasan | Kelas Prodi | SIAP_PRODUKSI | `classes`, `courses` | LOLOS | Monitoring seluruh kelas pada lingkup prodi |
| **Kaprodi** | Persetujuan | Persetujuan Kelas Baru | SIAP_PRODUKSI | `classes.status` | LOLOS | Menyetujui usulan pembukaan kelas |
| **Kaprodi** | Persetujuan | Putusan Perubahan Nilai | BUTUH_MIGRASI | RPC `decide_grade_change` (Migrasi 000014) | LOLOS | Kaprodi menyetujui/menolak pengajuan nilai dosen |
| **Kaprodi** | Monitoring | Monitoring Ujian CBT | BUTUH_MIGRASI | In-Memory (`QuizStore`) -> Usulan Batch 2 | LOLOS | Memantau anomali dan ujian serentak prodi |
| **Kaprodi** | Laporan | Evaluasi Dosen & Capaian CPL | DESAIN_ONLY | In-Memory / Agregasi Nilai | LOLOS | Menampilkan grafik capaian CPL dan audit mutu |
| **Staf** | Master Data | Program Studi & Mata Kuliah | SIAP_PRODUKSI | `study_programs`, `courses` (Migrasi 000003) | LOLOS | Di non-demo menampilkan baris kosong pangkalan data |
| **Staf** | Master Data | Tahun Ajaran & Ruang GPS | SIAP_PRODUKSI | `academic_years`, `rooms` (Migrasi 000008) | LOLOS | Kalibrasi titik koordinat GPS ruang perkuliahan |
| **Staf** | Jadwal | Jadwal Kuliah & Ujian | SIAP_PRODUKSI | `classes`, `rooms` | LOLOS | Matriks alokasi ruang dan jam perkuliahan |
| **Staf** | Kelas | Enroll Peserta & Pindah Kelas | SIAP_PRODUKSI | `enrollments` (Migrasi 000003) | LOLOS | Pengelolaan rombel kelas perkuliahan |
| **Staf** | Kelas | Impor CSV Peserta | SIAP_PRODUKSI | `enrollments` + FileReader Parser Hardened | LOLOS | Sanitasi formula injection & validasi 500 baris |
| **Staf** | Nilai | Rekap Nilai & Rekap Presensi | SIAP_PRODUKSI | `student_grades` (Migrasi 000005) | LOLOS | Rekap kelayakan kehadiran ujian semester |
| **Staf** | Nilai | Eksekusi Nilai Disetujui | BUTUH_MIGRASI | RPC `execute_grade_change` (Migrasi 000014) | LOLOS | Staf mengeksekusi pengajuan APPROVED ke master nilai |
| **Staf** | Pengumuman | Pengumuman & Agenda Kampus | SIAP_PRODUKSI | `announcements` (Migrasi 000010) | LOLOS | Broadcast informasi resmi universitas |
| **Staf** | Layanan | Verifikasi Berkas Mahasiswa | DESAIN_ONLY | File Storage Bucket 'student-docs' | LOLOS | Antarmuka verifikasi transkrip dan surat aktif |
| **Staf** | Konten | Pustaka & Sertifikat Digital | DESAIN_ONLY | Storage Bucket 'library-books' | LOLOS | Antarmuka kurasi e-book dan sertifikat digital |
| **Staf** | Moderasi | Laporan Konten & Grup Belajar | DESAIN_ONLY | Storage & Discussion System | LOLOS | Pengawasan komunitas belajar mahasiswa |
| **System Admin** | Monitoring | Status Server & Telemetri WS | SIAP_PRODUKSI | Internal Health API & System Telemetry | LOLOS | Pemantauan latency, websocket, dan background tasks |
| **System Admin** | Integrasi | Gateway Zoom, Email, WA, SSO | SIAP_PRODUKSI | Configuration Stores (Masked Secret) | LOLOS | Manajemen kredensial pihak ketiga (sensor 4 digit) |
| **System Admin** | Keamanan | Sesi Aktif, Brute-Force, Rate Limit | SIAP_PRODUKSI | `auth.audit_logs`, Network Guard | LOLOS | Pemutusan sesi mencurigakan & IP blocking |
| **System Admin** | Audit | Log Audit Sistem (Read-Only) | SIAP_PRODUKSI | `public.audit_logs` (Migrasi 000015) | LOLOS | Jejak audit append-only dengan filter forensik |
| **Super Admin** | Manajemen | Kelola Pengguna & Penugasan Role | SIAP_PRODUKSI | `profiles`, `user_roles` (Migrasi 000001) | LOLOS | Pembuatan akun, aktivasi, dan pemetaan role |
| **Super Admin** | Kebijakan | Kebijakan Retensi & Proctoring | SIAP_PRODUKSI | System Settings KV Store | LOLOS | Penentuan ambang pelanggaran dan retensi data |
| **Super Admin** | Akses | Impersonasi Pengguna (Audit) | SIAP_PRODUKSI | Audit Log + Session Context Banner | LOLOS | Waktu 30 menit, banner permanen, aksi destruktif diblokir |

---

## 3. Peta Persistensi Data SIAJAR (Dokumen Lengkap docs/persistence-map.md)

Bagian berikut merupakan isi utuh tanpa peringkasan dari dokumen audit persistensi data:

---

# Peta Persistensi Data SIAJAR (Audit Arsitektur & Perencanaan Fase 3)

Dokumen ini disusun sebagai audit menyeluruh baca-saja (*read-only architecture audit*) terhadap lapisan persistensi data aplikasi SIAJAR per 11 Oktober 2026. Audit ini memetakan setiap domain fungsional terhadap skema tabel database Supabase, berkas migrasi (`supabase/migrations/`), dan realitas pemanggilan kode di mode non-demo (`NODE_ENV=production` atau `ALLOW_DEMO_AUTH=false`).

---

## 1. Tabel Matriks Persistensi Per Domain

| No | Domain Fungsional | Tabel Database Supabase + File Migrasi | Sudah Ada Migrasi? | Pemakaian Kode Non-Demo (DB / In-Memory / Campuran) | Status Domain Inti di Produksi | Keterangan & Rujukan File |
|---|---|---|---|---|---|---|
| 1 | **Identitas & Autentikasi** | `auth.users`, `public.profiles`, `public.roles`, `public.user_roles`, `public.audit_logs`<br>`20260930000001_identity_schema.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | `src/modules/identity/actions.ts` menggunakan Supabase Auth & table `profiles`/`user_roles`. Demo auth diblokir di production. |
| 2 | **Master Data Akademik** (Prodi, TA, Kurikulum) | `study_programs`, `academic_years`, `courses`<br>`20260930000003_academic_core.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | `src/modules/academic/actions.ts` memanggil relasi ke `courses` dan `academic_years`. |
| 3 | **Master Data Fasilitas & Pengguna** (Ruang, Gedung, Profil) | `rooms`, `buildings`, `lecturers`, `students`<br>`20260930000008_master_data.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Menampung NIP/NIDN dosen, NIM mahasiswa, serta titik koordinat GPS ruang untuk geofencing. |
| 4 | **Kelas Perkuliahan** | `classes`<br>`20260930000003_academic_core.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | `listMyClassesAction()` membaca langsung tabel `classes` dengan RLS sesuai dosen/mahasiswa/asisten. |
| 5 | **Peserta Kelas (Enrollment)** | `enrollments`<br>`20260930000003_academic_core.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Hubungan many-to-many mahasiswa terhadap rombongan belajar kelas. |
| 6 | **Materi Pembelajaran** | `materials`, `material_attachments`<br>`20260930000007_materials.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Mendukung tautan dokumen, video, slide, dan unduhan materi perkuliahan per pertemuan. |
| 7 | **Tugas & Pengumpulan** | `assignments`, `submissions`<br>`20260930000004_assignments.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Mendukung tenggat waktu, upload berkas tugas mahasiswa, serta penilaian tugas oleh dosen/asisten. |
| 8 | **Nilai & Gradebook** | `grade_components`, `student_grades`, `gradebook_locks`<br>`20260930000005_grading.sql` | **YA** | **Campuran** | ⚠️ **Sebagian In-Memory** | Struktur skema DB sudah lengkap dengan bobot dan lock, namun beberapa mutasi kalkulasi cepat masih memiliki fallback ke `NilaiStore` in-memory. |
| 9 | **Presensi (Sesi & Kehadiran)** | *Belum ada tabel di DB* (usulan: `attendance_sessions`, `attendance_records`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | `src/modules/academic/attendance-actions.ts` saat ini menyimpan sesi presensi, QR token, dan kehadiran mahasiswa pada variabel memori `AttendanceStore`. **Hilang saat restart container/serverless.** |
| 10 | **Izin & Sakit (Dispensasi)** | *Belum ada tabel di DB* (usulan: `leave_permits`, `leave_attachments`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | Disimpan di array `AttendanceStore.leaves`. Bukti surat dokter & status approval belum tersimpan ke PostgreSQL. |
| 11 | **Kuis & Ujian (CBT)** | *Belum ada tabel di DB* (usulan: `quizzes`, `quiz_questions`, `quiz_options`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | `src/modules/academic/quiz-actions.ts` menyimpan bank soal dan konfigurasi ujian di `QuizStore.quizzes`. |
| 12 | **Attempt Ujian & Lembar Jawaban** | *Belum ada tabel di DB* (usulan: `exam_attempts`, `exam_answers`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | `QuizStore.attempts` dan `QuizStore.answers` beroperasi in-memory. Skor autograder kuis hilang saat server redeploy. |
| 13 | **Telemetri Proctoring & Anomali** | *Belum ada tabel di DB* (usulan: `exam_events`, `proctoring_logs`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | Event `TAB_SWITCH`, `WINDOW_BLUR`, `EXIT_FULLSCREEN`, dan `LECTURER_INTERVENTION` disimpan di `QuizStore.events`. Audit proctoring belum persisten ke database. |
| 14 | **Sanggahan / Keberatan Nilai Ujian** | *Belum ada tabel di DB* (usulan: `exam_disputes`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | Sanggahan nilai ujian mahasiswa disimpan di `QuizStore.disputes`. |
| 15 | **Perubahan Nilai Final (Grade Change)** | `grade_change_requests`<br>`20260930000009_grade_changes.sql`<br>`20261011000014_grade_change_decision_and_execution.sql` | **YA** | **Campuran** | **Siap DB (Migrasi Dibuat)** | Skema tabel, RLS prodi, RPC `decide_grade_change` dan `execute_grade_change` sudah lengkap di berkas migrasi; kode memiliki fallback ke `NilaiStore` jika Supabase offline. |
| 16 | **Asisten Dosen (TA)** | `teaching_assistants`, `ta_assignments`<br>`20260930000011_assistants.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Penugasan asisten ke kelas dan batasan wewenang koreksi tugas/kuis. |
| 17 | **Forum & Diskusi Kelas** | `forums`, `threads`, `posts`<br>`20260930000012_discussions.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Diskusi perkuliahan, komentar mahasiswa, dan penandaan postingan dosen. |
| 18 | **Pengumuman Kampus** | `announcements`<br>`20260930000010_announcements.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Broadcast pengumuman tingkat prodi maupun universitas. |
| 19 | **Notifikasi Sistem** | `notifications`<br>`20260930000006_notifications.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Notifikasi inbox pengguna dengan status `is_read`. |
| 20 | **Audit Ekspor Nilai** | `grade_export_logs`<br>`20260930000013_grade_export_audit.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Jejak forensik ekspor nilai format Excel/PDF oleh dosen. |
| 21 | **Event & Webinar Kampus** | *Belum ada tabel di DB* (usulan: `campus_events`, `event_registrations`) | **TIDAK** | **In-Memory** | ⚠️ **Fitur Baru (In-Memory / Demo)** | Ditampilkan via mock demo data di `src/app/(portal)/community/events`. |
| 22 | **Pustaka Digital (Library)** | *Belum ada tabel di DB* (usulan: `library_items`, `library_loans`) | **TIDAK** | **In-Memory** | ⚠️ **Fitur Baru (In-Memory / Demo)** | Katalog buku, jurnal open access, dan status pinjaman masih berupa demo array. |
| 23 | **Sertifikat & Lencana (Badges)** | *Belum ada tabel di DB* (usulan: `certificates`, `student_badges`) | **TIDAK** | **In-Memory** | ⚠️ **Fitur Baru (In-Memory / Demo)** | Template sertifikat dan klaim lencana mahasiswa masih statis/in-memory. |
| 24 | **Portofolio Mahasiswa** | *Belum ada tabel di DB* (usulan: `portfolios`, `portfolio_items`) | **TIDAK** | **In-Memory** | ⚠️ **Fitur Baru (In-Memory / Demo)** | Portofolio proyek mandiri dan repositori GitHub mahasiswa belum disimpan ke DB. |

---

## 2. Ringkasan Temuan Kritis (Critical Core Domains)

Domain inti akademik berikut **berjalan in-memory di lingkungan produksi saat ini** dan memerlukan prioritas pembuatan migrasi skema database di **Fase 3**:

1. **Presensi Kuliah & Izin Sakit**: 
   - Komponen: Validasi Geofencing, Dynamic QR Code, Rekap Kehadiran, Surat Keterangan Sakit/Izin.
   - Dampak: Rekap 75% kehadiran untuk syarat ujian akan terhapus saat instance server restart.
2. **CBT Ujian & Kuis**:
   - Komponen: Bank Soal, Lembar Jawaban Mahasiswa, Skor Autograder, Batas Waktu Sesi.
   - Dampak: Nilai pengerjaan ujian mahasiswa hilang jika container Next.js berputar (*recycle*).
3. **Telemetri Proctoring & Log Intervensi**:
   - Komponen: Deteksi blur layar, tab switch, peringatan pengawas, tambah waktu, diskualifikasi.
   - Dampak: Bukti kecurangan dan integritas evaluasi tidak tersimpan dalam audit permanen database.
4. **Keberatan / Sanggahan Nilai**:
   - Komponen: Sanggahan mahasiswa terhadap soal kuis/tugas dan tanggapan dosen.
   - Dampak: Riwayat klarifikasi hilang, berpotensi memicu sengketa nilai tidak terdokumentasi.

---

## 3. Rekomendasi Rencana Kerja Fase 3 (Database Persistence)

Untuk menuntaskan Fase 3 tanpa mengganggu stabilitas:
1. **Migration Batch 1 (Presensi & Izin)**:
   - Buat tabel `attendance_sessions` (geofence lat/lng, radius, qr_secret, valid_until).
   - Buat tabel `attendance_records` (student_id, session_id, check_in_time, method, status).
   - Buat tabel `leave_permits` (student_id, class_id, permit_type, permit_date, reason, file_url, status, reviewer_id).
2. **Migration Batch 2 (CBT & Proctoring)**:
   - Buat tabel `quizzes`, `quiz_questions`, `quiz_options`.
   - Buat tabel `exam_attempts`, `exam_answers`.
   - Buat tabel `exam_events` (proctoring telemetry & lecturer interventions dengan constraint tipe event).
   - Buat tabel `exam_disputes`.
3. **Migration Batch 3 (Konten Kampus & Layanan Staf)**:
   - Buat tabel `library_items`, `campus_events`, `certificates`, `student_portfolios`.

---

## 4. Panduan Eksekusi Migrasi Mandiri oleh Pengguna

Sesuai instruksi ketat, **asisten AI dilarang menjalankan migrasi ke database remote mana pun**. Administrator basis data dapat mengeksekusi berkas migrasi baru berikut secara berurutan di pangkalan data Supabase:

### Berkas 1: Penguatan Putusan & Eksekusi Nilai
- **Berkas**: `supabase/migrations/20261011000014_grade_change_decision_and_execution.sql`
- **Tujuan**: Mengaktifkan RPC `decide_grade_change` dan `execute_grade_change` dengan row-level lock (`FOR UPDATE`), atomic update ke master `student_grades`, audit log, dan enforcement pemisahan tugas 3 pihak.
- **Cara Eksekusi**:
  ```bash
  # Menggunakan Supabase CLI terhubung ke proyek:
  supabase db push
  # Atau melalui SQL Editor di Supabase Dashboard:
  # Salin isi berkas 20261011000014_grade_change_decision_and_execution.sql dan jalankan "Run".
  ```

### Berkas 2: Pengerasan Imutabilitas Audit Log & Kolom Impersonasi
- **Berkas**: `supabase/migrations/20261011000015_audit_logs_hardening.sql`
- **Tujuan**: Menambahkan kolom `on_behalf_of` UUID untuk jejak impersonasi, memasang trigger anti-tamper `tr_audit_logs_immutable` yang mencegah `UPDATE` dan `DELETE`, serta membatasi hak baca hanya untuk `SYSTEM_ADMIN` dan `SUPER_ADMIN`.
- **Cara Eksekusi**:
  ```bash
  # Melalui SQL Editor di Supabase Dashboard:
  # Salin isi berkas 20261011000015_audit_logs_hardening.sql dan jalankan "Run".
  ```
