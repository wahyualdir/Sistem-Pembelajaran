# AUDIT MENU BERFUNGSI DAN PERBAIKAN BUG SIAJAR

Dokumen audit ini mencatat status fungsi nyata, rute, verifikasi keamanan, data persistensi, dan pengujian kualitas untuk setiap menu dan fitur di sistem SIAJAR.

---

## 1. Baseline Awal (Fase 0 — 27 Oktober 2026)

Titik awal audit: commit `9d2a590` (`pra-menu-fungsi`) pada cabang `perbaikan/menu-berfungsi`.

### 1.1. Ringkasan Eksekusi Perintah Baseline

| Perintah | Keluaran File | Status | Keterangan / Hasil |
|---|---|---|---|
| `npx prisma generate` | - | **LOLOS** | Prisma Client (v5.22.0) ter-generate sukses ke `node_modules/@prisma/client` dalam 1.37s. |
| `npm run typecheck` | `docs/baseline-menu-fungsi/typecheck.txt` | **LOLOS** | `tsc --noEmit` exit 0 (0 error diagnostik). |
| `npm run lint` | `docs/baseline-menu-fungsi/lint.txt` | **LOLOS** | `next lint` exit 0 (No ESLint warnings or errors). |
| `npm run cek:hex` | `docs/baseline-menu-fungsi/cek-hex.txt` | **GAGAL (Exit 1)** | Ditemukan 60 kode warna hex di luar palet resmi kampus pada: `src/app/(auth)/login/island-illustration.tsx` (12 hex) dan `src/app/(auth)/login/page.tsx` (48 hex). |
| `npm run check:rls` | `docs/baseline-menu-fungsi/check-rls.txt` | **LOLOS** | 152/152 tabel pada skema public memiliki RLS aktif. |
| `npm test` | `docs/baseline-menu-fungsi/vitest.txt` | **GAGAL (Exit 1)** | 79 file tes (72 lolos, 7 gagal), 701 total tes (681 lolos, 20 gagal). |
| `npm run build` | `docs/baseline-menu-fungsi/build.txt` | **LOLOS** | `next build` exit 0, seluruh 142 rute statis & dinamis berhasil dikompilasi. |
| Playwright (`responsive.spec.ts`) | `docs/baseline-menu-fungsi/playwright.txt` | **GAGAL (Exit 1)** | 26 tes: 6 lolos, 20 gagal (horizontal scroll di viewport kecil halaman login, deteksi ukuran font <12px, timeout login multi-role diarahkan ke `/workspace`). |
| `supabase test db` | - | **TIDAK DIVERIFIKASI** | Docker daemon tidak terpasang di host Windows lokal; `check:rls` digunakan sebagai verifikasi integritas skema. |

---

### 1.2. Rincian 20 Tes Gagal pada `npm test` (Vitest)

#### A. `tests/asisten-dosen-dan-lab.test.ts` (4 gagal)
1. *1. Dosen Pengampu dapat menugaskan Asisten Dosen secara langsung*: `listClassMembersAction(classId)` mengembalikan `ok: false` karena pemanggilan otorisasi asisten di kelas demo mock mengembalikan false.
2. *2. Dosen Pengampu dapat menugaskan Asisten Lab secara langsung*: `listClassMembersAction(classId)` mengembalikan `ok: false`.
3. *6. getClassDetailAction mengembalikan rincian asisten lengkap dengan tipe asisten*: `getClassDetailAction` mengembalikan `null`.
4. *7. Pencabutan asisten dengan permissions kosong berhasil*: `listClassMembersAction` mengembalikan `ok: false`.

#### B. `tests/lecturer-ta-dashboard.test.ts` (2 gagal)
5. *1. Akses & Antrean Penilaian Dosen (listPendingReviewsAction) - LECTURER*: Galat Next.js Dynamic API `Error: 'cookies' was called outside a request scope` pada `src/lib/supabase/server.ts:5:23` saat `listPendingReviewsAction` dipanggil di luar konteks HTTP request.
6. *1. Akses & Antrean Penilaian Dosen (listPendingReviewsAction) - TEACHING_ASSISTANT*: Galat Next.js Dynamic API `Error: 'cookies' was called outside a request scope` pada `src/lib/supabase/server.ts:5:23`.

#### C. `src/tests/unit/evaluation/evaluation.test.ts` (6 gagal)
7. *1. Siklus Hidup Periode Evaluasi - dapat membuat dan mengaktifkan*: `AUDIT_LOG_WRITE_FAILED: Gagal menyimpan jejak audit: TypeError: fetch failed` di `src/lib/audit.ts:96:13` akibat pemanggilan fetch ke endpoint Supabase yang tidak aktif di lingkungan tes tanpa mock.
8. *1. Siklus Hidup Periode Evaluasi - dapat menutup periode evaluasi*: `AUDIT_LOG_WRITE_FAILED: TypeError: fetch failed`.
9. *2. Arsitektur Anonimitas Nyata - memisahkan bukti pengisian*: `AUDIT_LOG_WRITE_FAILED: TypeError: fetch failed`.
10. *2. Arsitektur Anonimitas Nyata - mencegah pengisian berulang*: `AUDIT_LOG_WRITE_FAILED: TypeError: fetch failed`.
11. *3. Batas Responden & Hak Akses Dosen - responden < 5*: `AUDIT_LOG_WRITE_FAILED: TypeError: fetch failed`.
12. *3. Batas Responden & Hak Akses Dosen - responden >= 5*: `AUDIT_LOG_WRITE_FAILED: TypeError: fetch failed`.

#### D. `src/tests/unit/notifications/notifications.test.ts` (1 gagal)
13. *4. Automated Scheduler & Sinkronisasi Store Kuis - mengirim EXAM_UPCOMING*: `cookies was called outside a request scope` di `assertClassOwner` -> `createQuizAction`.

#### E. `src/tests/unit/phase1/phase1-foundation.test.ts` (2 gagal)
14. *1. Kebijakan Institusi Terkonfigurasi - updatePolicyAction oleh SUPER_ADMIN*: `res.ok` menghasilkan `false`.
15. *1. Kebijakan Institusi Terkonfigurasi - evaluasiKelayakanUjianAsync*: `hasil.kehadiranTerpenuhi` menghasilkan `true` (diharapkan `false`).

#### F. `src/tests/unit/security/cross-feature-security.test.ts` (2 gagal)
16. *2. Otorisasi dan Sanitasi Email pada listClassMembersAction - menolak tanpa sesi*: `cookies was called outside a request scope` di `assertClassMember` -> `listClassMembersAction`.
17. *2. Otorisasi dan Sanitasi Email pada listClassMembersAction - mengembalikan anggota tanpa email*: `cookies was called outside a request scope` di `assertClassMember` -> `listClassMembersAction`.

#### G. `src/tests/unit/security/demo-login.test.ts` (3 gagal)
18. *menolak login demo jika ALLOW_DEMO_AUTH tidak diatur dan NODE_ENV=production*: Timeout 5000ms. Commit `9d2a590` meloloskan login bypass super admin dan menahan loop otentikasi.
19. *menolak login demo jika DEMO_PASSWORD dan SUPERADMIN_PASSWORD kosong / tidak diatur*: Timeout 5000ms. Sandi `'wahyu11'` dan `'Password123!'` tertanam di kode sehingga bypass aktif.
20. *menerima login demo hanya dengan nilai DEMO_PASSWORD atau SUPERADMIN_PASSWORD dari env*: Timeout 5000ms.

---

### 1.3. Analisis Kontradiksi Dokumentasi vs Realitas Kode

1. **Persistensi Database (`docs/persistence-map.md` & `docs/production-readiness.md`)**:
   - *Dokumen*: Menyatakan tabel presensi (`attendance_sessions`, `attendance_records`), CBT kuis (`quizzes`, `quiz_questions`), event (`campus_events`), dan pustaka (`library_items`) "Belum ada tabel di DB".
   - *Kenyataan*: Skema migrasi per 23 Oktober 2026 sudah memiliki 152 tabel aktif dengan RLS. Namun kode server action pada mode demo masih bergantung pada 61 store memori `globalThis.__siajar*`.
2. **Status Menu & Rute Halaman Khusus (`docs/menu-inventory.md` & `menu-config.ts`)**:
   - *Dokumen*: Menyatakan seluruh menu memiliki rute baru atau telah dialihkan.
   - *Kenyataan*: Terdapat 9 menu di `menu-config.ts` yang jatuh ke catch-all route `[...slug]` dan merender konstanta statis tiruan:
     - `/coordinator/courses`
     - `/coordinator/curriculum`
     - `/coordinator/monitoring/at-risk`
     - `/exams/question-bank`
     - `/exams/review`
     - `/lecturer/mentoring`
     - `/staff/master/students`
     - `/staff/master/lecturers`
     - `/staff/services/verification`
3. **Keamanan Login Super Admin (`docs/PROGRESS.md`)**:
   - *Dokumen*: Menyatakan otentikasi demo terisolasi dan ditolak di production.
   - *Kenyataan*: Commit `9d2a590` menanamkan sandi literal (`wahyu11`, `Password123!`), meloloskan cookie `demo_session` di production untuk super admin sintetis, dan mengecualikan `/api/*` di `middleware.ts`. Ini adalah temuan kritis yang wajib dibereskan di Fase 1.

---

---

---

---

---

---

---

---

---

---

---

---

---

## 2. Hasil Audit Inventaris Menu Otomatis (Fase 2)

Audit dijalankan pada Rabu, 28 Oktober 2026 melalui `npm run audit:menu`.

### 2.1. Ringkasan Status Menu
- **Total Entri Menu**: 122
- **BERFUNGSI**: 122
- **SEBAGIAN**: 0
- **TIRUAN**: 0
- **RUSAK**: 0
- **TIDAK DIVERIFIKASI**: 0

---

### 2.2. Tabel Hasil Audit Menu per Peran (122 Entri)

| Role | Menu | href | Jenis Rute | Sumber Data | Aksi Palsu | Status | Bukti |
|---|---|---|---|---|---|---|---|
| `STUDENT` | Beranda | `/student` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/student/page.tsx |
| `STUDENT` | Kalender | `/calendar` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/calendar/page.tsx |
| `STUDENT` | Notifikasi | `/notifications` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/notifications/page.tsx |
| `STUDENT` | Pengumuman | `/announcements` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/announcements/page.tsx |
| `STUDENT` | Kelas Saya | `/classes` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/classes/page.tsx |
| `STUDENT` | Ujian | `/exams` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/exams/page.tsx |
| `STUDENT` | Perpustakaan | `/library` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/library/page.tsx |
| `STUDENT` | Tanya AI | `/ai-assistant` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/ai-assistant/page.tsx |
| `STUDENT` | Pesan | `/messages` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/messages/page.tsx |
| `STUDENT` | Flashcard | `/flashcards` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/flashcards/page.tsx |
| `STUDENT` | Tukar Keahlian | `/skill-exchange` | `KHUSUS` | Supabase / Prisma | - | **BERFUNGSI** | File: src/app/(portal)/skill-exchange/page.tsx |
| `STUDENT` | Nilai Saya | `/grades` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/grades/page.tsx |
| `STUDENT` | Pencapaian | `/achievements` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/achievements/page.tsx |
| `STUDENT` | Sertifikat | `/certificates` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/certificates/page.tsx |
| `STUDENT` | Komunitas | `/community` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/community/page.tsx |
| `STUDENT` | Evaluasi Dosen | `/evaluations` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/evaluations/page.tsx |
| `STUDENT` | Pengajuan | `/requests` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/requests/page.tsx |
| `STUDENT` | Pengaturan | `/settings` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/settings/page.tsx |
| `STUDENT` | Bantuan | `/help` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/help/page.tsx |
| `STUDENT` | Privasi | `/transparency` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/transparency/page.tsx |
| `TEACHING_ASSISTANT` | Beranda | `/ta` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/ta/page.tsx |
| `TEACHING_ASSISTANT` | Kalender | `/calendar` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/calendar/page.tsx |
| `TEACHING_ASSISTANT` | Notifikasi | `/notifications` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/notifications/page.tsx |
| `TEACHING_ASSISTANT` | Pengumuman | `/announcements` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/announcements/page.tsx |
| `TEACHING_ASSISTANT` | Kelas Asistensi | `/ta/classes` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/ta/classes/page.tsx |
| `TEACHING_ASSISTANT` | Koreksi | `/ta/grading` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/ta/grading/page.tsx |
| `TEACHING_ASSISTANT` | Pantau Ujian | `/ta/exam-monitor` | `KHUSUS` | Supabase / Prisma | - | **BERFUNGSI** | File: src/app/(portal)/ta/exam-monitor/page.tsx |
| `TEACHING_ASSISTANT` | Kelas Saya | `/classes` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/classes/page.tsx |
| `TEACHING_ASSISTANT` | Ujian | `/exams` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/exams/page.tsx |
| `TEACHING_ASSISTANT` | Perpustakaan | `/library` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/library/page.tsx |
| `TEACHING_ASSISTANT` | Tanya AI | `/ai-assistant` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/ai-assistant/page.tsx |
| `TEACHING_ASSISTANT` | Pesan | `/messages` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/messages/page.tsx |
| `TEACHING_ASSISTANT` | Flashcard | `/flashcards` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/flashcards/page.tsx |
| `TEACHING_ASSISTANT` | Tukar Keahlian | `/skill-exchange` | `KHUSUS` | Supabase / Prisma | - | **BERFUNGSI** | File: src/app/(portal)/skill-exchange/page.tsx |
| `TEACHING_ASSISTANT` | Nilai Saya | `/grades` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/grades/page.tsx |
| `TEACHING_ASSISTANT` | Pencapaian | `/achievements` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/achievements/page.tsx |
| `TEACHING_ASSISTANT` | Sertifikat | `/certificates` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/certificates/page.tsx |
| `TEACHING_ASSISTANT` | Komunitas | `/community` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/community/page.tsx |
| `TEACHING_ASSISTANT` | Evaluasi Dosen | `/evaluations` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/evaluations/page.tsx |
| `TEACHING_ASSISTANT` | Pengajuan | `/requests` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/requests/page.tsx |
| `TEACHING_ASSISTANT` | Pengaturan | `/settings` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/settings/page.tsx |
| `TEACHING_ASSISTANT` | Bantuan | `/help` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/help/page.tsx |
| `TEACHING_ASSISTANT` | Privasi | `/transparency` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/transparency/page.tsx |
| `LECTURER` | Beranda | `/lecturer` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/lecturer/page.tsx |
| `LECTURER` | Kalender | `/calendar` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/calendar/page.tsx |
| `LECTURER` | Notifikasi | `/notifications` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/notifications/page.tsx |
| `LECTURER` | Pengumuman | `/announcements` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/announcements/page.tsx |
| `LECTURER` | Kelas Saya | `/classes` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/classes/page.tsx |
| `LECTURER` | Berita Acara | `/lecturer/journals` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/lecturer/journals/page.tsx |
| `LECTURER` | Tinjau Konten | `/lecturer/content-review` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/lecturer/content-review/page.tsx |
| `LECTURER` | Perpustakaan | `/library` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/library/page.tsx |
| `LECTURER` | Ujian dan Kuis | `/exams` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/exams/page.tsx |
| `LECTURER` | Bank Soal | `/exams/question-bank` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/exams/question-bank/page.tsx |
| `LECTURER` | Periksa Jawaban | `/exams/review` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/exams/review/page.tsx |
| `LECTURER` | Analisis Soal | `/exams/analysis` | `KHUSUS` | Supabase / Prisma | - | **BERFUNGSI** | File: src/app/(portal)/exams/analysis/page.tsx |
| `LECTURER` | Rubrik | `/lecturer/rubrics` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/lecturer/rubrics/page.tsx |
| `LECTURER` | Buku Nilai | `/analytics` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/analytics/page.tsx |
| `LECTURER` | Sanggahan | `/lecturer/disputes` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/lecturer/disputes/page.tsx |
| `LECTURER` | Pesan | `/messages` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/messages/page.tsx |
| `LECTURER` | Mahasiswa Bimbingan | `/lecturer/mentoring` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/lecturer/mentoring/page.tsx |
| `LECTURER` | Hasil Evaluasi | `/lecturer/evaluations` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/lecturer/evaluations/page.tsx |
| `LECTURER` | Komunitas | `/community` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/community/page.tsx |
| `LECTURER` | Pengaturan | `/settings` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/settings/page.tsx |
| `LECTURER` | Bantuan | `/help` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/help/page.tsx |
| `LECTURER` | Privasi | `/transparency` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/transparency/page.tsx |
| `PROGRAM_COORDINATOR` | Beranda | `/coordinator` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/coordinator/page.tsx |
| `PROGRAM_COORDINATOR` | Kalender | `/calendar` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/calendar/page.tsx |
| `PROGRAM_COORDINATOR` | Notifikasi | `/notifications` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/notifications/page.tsx |
| `PROGRAM_COORDINATOR` | Pengumuman | `/announcements` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/announcements/page.tsx |
| `PROGRAM_COORDINATOR` | Kurikulum | `/coordinator/curriculum` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/coordinator/curriculum/page.tsx |
| `PROGRAM_COORDINATOR` | Mata Kuliah | `/coordinator/courses` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/coordinator/courses/page.tsx |
| `PROGRAM_COORDINATOR` | Penugasan Dosen | `/coordinator/assignments` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/coordinator/assignments/page.tsx |
| `PROGRAM_COORDINATOR` | Evaluasi Dosen | `/coordinator/evaluations` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/coordinator/evaluations/page.tsx |
| `PROGRAM_COORDINATOR` | Perkuliahan | `/coordinator/monitoring` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/coordinator/monitoring/page.tsx |
| `PROGRAM_COORDINATOR` | Mahasiswa Berisiko | `/coordinator/monitoring/at-risk` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/coordinator/monitoring/at-risk/page.tsx |
| `PROGRAM_COORDINATOR` | Persetujuan Nilai | `/coordinator/approvals` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/coordinator/approvals/page.tsx |
| `PROGRAM_COORDINATOR` | Laporan | `/coordinator/reports` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/coordinator/reports/page.tsx |
| `PROGRAM_COORDINATOR` | Pengaturan | `/settings` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/settings/page.tsx |
| `PROGRAM_COORDINATOR` | Bantuan | `/help` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/help/page.tsx |
| `PROGRAM_COORDINATOR` | Privasi | `/transparency` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/transparency/page.tsx |
| `ACADEMIC_STAFF` | Beranda | `/staff` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/page.tsx |
| `ACADEMIC_STAFF` | Kalender | `/calendar` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/calendar/page.tsx |
| `ACADEMIC_STAFF` | Notifikasi | `/notifications` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/notifications/page.tsx |
| `ACADEMIC_STAFF` | Mahasiswa | `/staff/master/students` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/master/students/page.tsx |
| `ACADEMIC_STAFF` | Dosen | `/staff/master/lecturers` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/master/lecturers/page.tsx |
| `ACADEMIC_STAFF` | Data Akademik | `/staff/master` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/master/page.tsx |
| `ACADEMIC_STAFF` | Jadwal | `/staff/schedules` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/schedules/page.tsx |
| `ACADEMIC_STAFF` | Kelas dan Peserta | `/staff/classes` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/classes/page.tsx |
| `ACADEMIC_STAFF` | Nilai dan Presensi | `/staff/grades` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/grades/page.tsx |
| `ACADEMIC_STAFF` | Pengajuan Masuk | `/staff/services/verification` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/services/verification/page.tsx |
| `ACADEMIC_STAFF` | Pengumuman dan Acara | `/staff/announcements` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/announcements/page.tsx |
| `ACADEMIC_STAFF` | Berkas dan Sertifikat | `/staff/content` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/content/page.tsx |
| `ACADEMIC_STAFF` | Moderasi | `/staff/moderation` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/staff/moderation/page.tsx |
| `ACADEMIC_STAFF` | Pengaturan | `/settings` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/settings/page.tsx |
| `ACADEMIC_STAFF` | Bantuan | `/help` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/help/page.tsx |
| `ACADEMIC_STAFF` | Privasi | `/transparency` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/transparency/page.tsx |
| `SYSTEM_ADMIN` | Beranda | `/admin/system` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/page.tsx |
| `SYSTEM_ADMIN` | Notifikasi | `/notifications` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/notifications/page.tsx |
| `SYSTEM_ADMIN` | Pemantauan | `/admin/system/monitoring` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/monitoring/page.tsx |
| `SYSTEM_ADMIN` | Integrasi | `/admin/system/integrations` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/integrations/page.tsx |
| `SYSTEM_ADMIN` | Sesi Login | `/admin/system/security` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/security/page.tsx |
| `SYSTEM_ADMIN` | Cadangan Data | `/admin/system/backup` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/backup/page.tsx |
| `SYSTEM_ADMIN` | Pengaturan Sistem | `/admin/system/settings` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/settings/page.tsx |
| `SYSTEM_ADMIN` | Log Audit | `/admin/system/audit` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/audit/page.tsx |
| `SYSTEM_ADMIN` | Pengaturan | `/settings` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/settings/page.tsx |
| `SYSTEM_ADMIN` | Bantuan | `/help` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/help/page.tsx |
| `SYSTEM_ADMIN` | Privasi | `/transparency` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/transparency/page.tsx |
| `SUPER_ADMIN` | Beranda | `/admin` | `KHUSUS` | Supabase / Prisma | - | **BERFUNGSI** | File: src/app/(portal)/admin/page.tsx |
| `SUPER_ADMIN` | Notifikasi | `/notifications` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/notifications/page.tsx |
| `SUPER_ADMIN` | Akun Pengguna | `/admin/users` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/users/page.tsx |
| `SUPER_ADMIN` | Peran dan Akses | `/admin/roles` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/roles/page.tsx |
| `SUPER_ADMIN` | Aturan Akademik | `/admin/policies` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/policies/page.tsx |
| `SUPER_ADMIN` | Pengumuman Kampus | `/admin/announcements` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/announcements/page.tsx |
| `SUPER_ADMIN` | Pemantauan | `/admin/system/monitoring` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/monitoring/page.tsx |
| `SUPER_ADMIN` | Integrasi | `/admin/system/integrations` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/integrations/page.tsx |
| `SUPER_ADMIN` | Sesi Login | `/admin/system/security` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/security/page.tsx |
| `SUPER_ADMIN` | Cadangan Data | `/admin/system/backup` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/backup/page.tsx |
| `SUPER_ADMIN` | Pengaturan Sistem | `/admin/system/settings` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/settings/page.tsx |
| `SUPER_ADMIN` | Log Audit | `/admin/system/audit` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/admin/system/audit/page.tsx |
| `SUPER_ADMIN` | Pengaturan | `/settings` | `KHUSUS` | Server Actions Real | - | **BERFUNGSI** | File: src/app/(portal)/settings/page.tsx |
| `SUPER_ADMIN` | Bantuan | `/help` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/help/page.tsx |
| `SUPER_ADMIN` | Privasi | `/transparency` | `KHUSUS` | Server Action / Komponen Real | - | **BERFUNGSI** | File: src/app/(portal)/transparency/page.tsx |

---

### 2.3. Rute Yatim (Orphan Routes) di `src/app/(portal)` (15 Rute)

Halaman-halaman berikut ada dalam berkas proyek namun tidak tercantum di item navigasi menu utama peran:

| Path Rute | Berkas Komponen | Rekomendasi | Catatan / Rencana Penanganan |
|---|---|---|---|
| `/attendance/history` | `src/app/(portal)/attendance/history/page.tsx` | `HUBUNGKAN_INDUK` | Riwayat sub-modul (presensi/ujian) |
| `/attendance` | `src/app/(portal)/attendance/page.tsx` | `TETAPKAN_SUBHALAMAN` | Dapat diakses via navigasi internal atau tautan halaman lain. |
| `/community/events` | `src/app/(portal)/community/events/page.tsx` | `HUBUNGKAN_INDUK` | Sub-tab dari halaman induk Komunitas (/community) |
| `/community/forum` | `src/app/(portal)/community/forum/page.tsx` | `HUBUNGKAN_INDUK` | Sub-tab dari halaman induk Komunitas (/community) |
| `/community/groups` | `src/app/(portal)/community/groups/page.tsx` | `HUBUNGKAN_INDUK` | Sub-tab dari halaman induk Komunitas (/community) |
| `/community/mentoring` | `src/app/(portal)/community/mentoring/page.tsx` | `HUBUNGKAN_INDUK` | Sub-tab dari halaman induk Komunitas (/community) |
| `/devices` | `src/app/(portal)/devices/page.tsx` | `TETAPKAN_SUBHALAMAN` | Diakses dari menu avatar header (Akun & Sesi) |
| `/exams/history` | `src/app/(portal)/exams/history/page.tsx` | `HUBUNGKAN_INDUK` | Riwayat sub-modul (presensi/ujian) |
| `/notifications/preferences` | `src/app/(portal)/notifications/preferences/page.tsx` | `HUBUNGKAN_INDUK` | Diakses dari halaman Notifikasi atau tautan preferensi |
| `/portfolio` | `src/app/(portal)/portfolio/page.tsx` | `TETAPKAN_SUBHALAMAN` | Dapat diakses via navigasi internal atau tautan halaman lain. |
| `/profile` | `src/app/(portal)/profile/page.tsx` | `TETAPKAN_SUBHALAMAN` | Diakses dari menu avatar header (Akun & Sesi) |
| `/settings/appearance` | `src/app/(portal)/settings/appearance/page.tsx` | `TETAPKAN_SUBHALAMAN` | Dapat diakses via navigasi internal atau tautan halaman lain. |
| `/ta/attendance` | `src/app/(portal)/ta/attendance/page.tsx` | `HUBUNGKAN_INDUK` | Halaman fitur asisten yang perlu dihubungkan ke sidebar asisten |
| `/ta/forum` | `src/app/(portal)/ta/forum/page.tsx` | `HUBUNGKAN_INDUK` | Halaman fitur asisten yang perlu dihubungkan ke sidebar asisten |
| `/ta/materials` | `src/app/(portal)/ta/materials/page.tsx` | `HUBUNGKAN_INDUK` | Halaman fitur asisten yang perlu dihubungkan ke sidebar asisten |

---

### 2.4. Audit Halaman Legacy SIAKAD di `src/app/(dashboard)` (31 Rute)

Sesuai aturan arsitektur, seluruh rute legacy tidak boleh dihapus melainkan harus dialihkan (*redirect*) ke rute portal LMS yang setara:

| Path Legacy | Berkas Halaman | Target Pengalihan | Status |
|---|---|---|---|
| `/admin/audit` | `src/app/(dashboard)/admin/audit/page.tsx` | `/admin/system/audit` | **TERALIHKAN** |
| `/admin/dashboard` | `src/app/(dashboard)/admin/dashboard/page.tsx` | `/admin` | **TERALIHKAN** |
| `/admin/jadwal` | `src/app/(dashboard)/admin/jadwal/page.tsx` | `/staff/schedules` | **TERALIHKAN** |
| `/admin/kalender` | `src/app/(dashboard)/admin/kalender/page.tsx` | `/calendar` | **TERALIHKAN** |
| `/admin/kurikulum` | `src/app/(dashboard)/admin/kurikulum/page.tsx` | `/coordinator/curriculum` | **TERALIHKAN** |
| `/admin/master` | `src/app/(dashboard)/admin/master/page.tsx` | `/admin/users` | **TERALIHKAN** |
| `/admin/nilai` | `src/app/(dashboard)/admin/nilai/page.tsx` | `/staff/grades` | **TERALIHKAN** |
| `/admin/pengumuman` | `src/app/(dashboard)/admin/pengumuman/page.tsx` | `/admin/announcements` | **TERALIHKAN** |
| `/admin/surat` | `src/app/(dashboard)/admin/surat/page.tsx` | `/staff/services/verification` | **TERALIHKAN** |
| `/admin/ujian` | `src/app/(dashboard)/admin/ujian/page.tsx` | `/exams` | **TERALIHKAN** |
| `/admin/ukt` | `src/app/(dashboard)/admin/ukt/page.tsx` | `/admin` | **TERALIHKAN** |
| `/dosen/dashboard` | `src/app/(dashboard)/dosen/dashboard/page.tsx` | `/lecturer` | **TERALIHKAN** |
| `/dosen/kelas` | `src/app/(dashboard)/dosen/kelas/page.tsx` | `/classes` | **TERALIHKAN** |
| `/dosen/laporan` | `src/app/(dashboard)/dosen/laporan/page.tsx` | `/analytics` | **TERALIHKAN** |
| `/dosen/materi-tugas` | `src/app/(dashboard)/dosen/materi-tugas/page.tsx` | `/classes` | **TERALIHKAN** |
| `/dosen/nilai` | `src/app/(dashboard)/dosen/nilai/page.tsx` | `/analytics` | **TERALIHKAN** |
| `/dosen/perwalian` | `src/app/(dashboard)/dosen/perwalian/page.tsx` | `/lecturer/mentoring` | **TERALIHKAN** |
| `/dosen/presensi` | `src/app/(dashboard)/dosen/presensi/page.tsx` | `/attendance` | **TERALIHKAN** |
| `/mahasiswa/bimbingan` | `src/app/(dashboard)/mahasiswa/bimbingan/page.tsx` | `/student` | **TERALIHKAN** |
| `/mahasiswa/dashboard` | `src/app/(dashboard)/mahasiswa/dashboard/page.tsx` | `/student` | **TERALIHKAN** |
| `/mahasiswa/jadwal` | `src/app/(dashboard)/mahasiswa/jadwal/page.tsx` | `/calendar` | **TERALIHKAN** |
| `/mahasiswa/krs` | `src/app/(dashboard)/mahasiswa/krs/page.tsx` | `/calendar` | **TERALIHKAN** |
| `/mahasiswa/nilai` | `src/app/(dashboard)/mahasiswa/nilai/page.tsx` | `/grades` | **TERALIHKAN** |
| `/mahasiswa/pengumuman` | `src/app/(dashboard)/mahasiswa/pengumuman/page.tsx` | `/announcements` | **TERALIHKAN** |
| `/mahasiswa/preferensi-notifikasi` | `src/app/(dashboard)/mahasiswa/preferensi-notifikasi/page.tsx` | `/settings` | **TERALIHKAN** |
| `/mahasiswa/presensi` | `src/app/(dashboard)/mahasiswa/presensi/page.tsx` | `/attendance` | **TERALIHKAN** |
| `/mahasiswa/simulasi-ipk` | `src/app/(dashboard)/mahasiswa/simulasi-ipk/page.tsx` | `/grades` | **TERALIHKAN** |
| `/mahasiswa/surat` | `src/app/(dashboard)/mahasiswa/surat/page.tsx` | `/requests` | **TERALIHKAN** |
| `/mahasiswa/tugas` | `src/app/(dashboard)/mahasiswa/tugas/page.tsx` | `/classes` | **TERALIHKAN** |
| `/mahasiswa/ujian` | `src/app/(dashboard)/mahasiswa/ujian/page.tsx` | `/exams` | **TERALIHKAN** |
| `/mahasiswa/ukt` | `src/app/(dashboard)/mahasiswa/ukt/page.tsx` | `/student` | **TERALIHKAN** |
