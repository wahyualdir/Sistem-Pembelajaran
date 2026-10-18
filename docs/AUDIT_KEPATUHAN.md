# AUDIT KEPATUHAN IMPLEMENTASI SIAJAR
## Pemetaan Fitur Bagian 9 sampai 13 (INSTRUKSI_ANTIGRAVITY.md) terhadap Basis Kode dan Pengujian

> **Status Audit**: Pemeriksaan Menyeluruh terhadap Basis Kode Aktif dan Rangkaian Pengujian  
> **Tanggal Pembaruan**: 18 Oktober 2026  
> **Hasil**: 22 dari 22 Fitur Telah Memiliki Implementasi Penuh dan Pengujian Terverifikasi (100% Selesai)

---

### Ringkasan Status Kepatuhan

| Bagian | Topik Fitur | Status Keseluruhan | Pengujian Pembukti |
| :--- | :--- | :---: | :--- |
| **9.1** | Keterlambatan dan Perpanjangan Tenggat Waktu | **Selesai** | `src/tests/unit/phase2/late-penalty.test.ts` (17 tests) |
| **9.2** | Tugas Kelompok dan Kontribusi Anggota | **Selesai** | `src/tests/unit/phase2/phase2-assignments-grades.test.ts` (14 tests) |
| **9.3** | Rubrik dan Komentar Berkas | **Selesai** | `src/tests/unit/phase2/feedback-comments.test.ts` (10 tests) |
| **9.4** | Sanggah Nilai oleh Mahasiswa | **Selesai** | `src/tests/unit/phase2/grade-disputes.test.ts` (18 tests) |
| **10.1** | Izin dan Sakit dari Sisi Mahasiswa | **Selesai** | `src/tests/unit/phase3/phase3-attendance-teaching.test.ts` & `perkuliahan-utils.test.ts` |
| **10.2** | Berita Acara Perkuliahan (Jurnal Dosen) | **Selesai** | `src/tests/unit/phase3/phase3-attendance-teaching.test.ts` |
| **10.3** | Tautan Kuliah Daring dan Rekaman | **Selesai** | `src/tests/unit/phase3/perkuliahan-utils.test.ts` (18 tests) |
| **10.4** | Progres Materi dan Penguncian Berurutan | **Selesai** | `src/tests/unit/phase3/phase3-attendance-teaching.test.ts` & `perkuliahan-utils.test.ts` |
| **11.1** | Autosave Ujian dan Pemulihan Koneksi | **Selesai** | `src/tests/unit/phase4/exam-autosave.test.ts` & `tests/e2e/exam-autosave.spec.ts` |
| **11.2** | Token Masuk, Ujian Susulan, dan Remedial | **Selesai** | `src/tests/unit/phase4/exam-makeup.test.ts` (10 tests) & `exam-utils.test.ts` |
| **11.3** | Auto-grader Soal Koding | **Selesai** | `src/tests/unit/phase4/phase4-exams-autograder.test.ts` & `exam-utils.test.ts` |
| **11.4** | Analisis Butir Soal Psikometrik | **Selesai** | `src/tests/unit/item-analysis/item-analysis.test.ts` & `exam-utils.test.ts` |
| **11.5** | Pemetaan Kurikulum OBE (CPMK ke CPL) | **Selesai** | `src/tests/unit/phase4/exam-utils.test.ts` |
| **11.6** | Cek Kemiripan Tugas (Teks dan Kode) | **Selesai** | `src/tests/unit/similarity/similarity.test.ts` & `exam-utils.test.ts` |
| **12.1** | Pesan Langsung dan Konsultasi Akademik | **Selesai** | `src/tests/unit/security/no-student-messaging.test.ts` (5 tests) & `phase5-interaction.test.ts` |
| **12.2** | Polling dan Kuis Cepat Saat Kuliah | **Selesai** | `src/tests/unit/phase5/phase5-interaction.test.ts` |
| **12.3** | Pencapaian dan Gamifikasi Kebiasaan Belajar | **Selesai** | `src/tests/unit/badges-certs/badges-certs.test.ts` & `phase5-interaction.test.ts` |
| **12.4** | Pengingat AI yang Proaktif | **Selesai** | `src/tests/unit/phase5/phase5-interaction.test.ts` |
| **12.5** | Evaluasi Dosen oleh Mahasiswa (EDOM) | **Selesai** | `src/tests/unit/evaluation/evaluation.test.ts` (True Anonymity Decoupling) |
| **13.1** | Salin Kelas dan Arsip Kelas | **Selesai** | `src/tests/unit/phase6/class-clone-archive.test.ts` |
| **13.2** | Impor Soal Massal dari Excel dan Word | **Selesai** | `src/tests/unit/phase6/excel-parser.test.ts`, `word-parser.test.ts`, `question-sanitizer.test.ts` |
| **13.3** | Ekspor dan Impor Moodle XML dan QTI 2.1 | **Selesai** | `src/tests/unit/phase6/moodle-xml.test.ts` & `qti-parser.test.ts` |

---

### Rincian Pemeriksaan per Butir Spesifikasi

#### Bagian 9: Tugas, Rubrik, dan Penilaian
1. **9.1 Keterlambatan dan perpanjangan tenggat waktu**:
   - **Status**: **Selesai**
   - **Berkas Implementasi**:
     - `src/lib/akademik/late-penalty.ts`
     - `src/modules/academic/assignment-actions.ts`
     - `supabase/migrations/20261017000024_phase2_assignments_grades.sql`
   - **Pengujian Pembukti**:
     - `src/tests/unit/phase2/late-penalty.test.ts` (17 pengujian: batas toleransi, pemotongan bertingkat per jam/hari, nilai minimum lantai, dan perpanjangan tenggat).

2. **9.2 Tugas kelompok**:
   - **Status**: **Selesai**
   - **Berkas Implementasi**:
     - `src/modules/academic/assignment-actions.ts`
     - `src/modules/academic/class-hub-tabs.tsx`
     - `supabase/migrations/20261017000024_phase2_assignments_grades.sql`
   - **Pengujian Pembukti**:
     - `src/tests/unit/phase2/phase2-assignments-grades.test.ts` (14 pengujian: 3 mode pembentukan kelompok, penguncian kelompok, satu pengumpulan per kelompok, skor kontribusi anggota).

3. **9.3 Rubrik dan umpan balik**:
   - **Status**: **Selesai**
   - **Berkas Implementasi**:
     - `src/lib/akademik/feedback-comments-utils.ts`
     - `src/modules/academic/rubric-actions.ts`
     - `src/modules/academic/feedback-comment-actions.ts`
     - `supabase/migrations/20261017000024_phase2_assignments_grades.sql`
   - **Pengujian Pembukti**:
     - `src/tests/unit/phase2/feedback-comments.test.ts` (10 pengujian: anchor baris kode, anchor halaman PDF, batas panjang 2000 karakter, isolasi komentar draf untuk mahasiswa).
     - `src/tests/unit/phase2/phase2-assignments-grades.test.ts` (rubrik snapshot dan koreksi draf asisten).

4. **9.4 Sanggah nilai oleh mahasiswa**:
   - **Status**: **Selesai**
   - **Berkas Implementasi**:
     - `src/lib/akademik/dispute-utils.ts`
     - `src/modules/academic/dispute-actions.ts`
     - `src/modules/academic/lecturer-disputes-view.tsx`
     - `supabase/migrations/20261017000024_phase2_assignments_grades.sql`
   - **Pengujian Pembukti**:
     - `src/tests/unit/phase2/grade-disputes.test.ts` (18 pengujian: batas jendela 7 hari kalender, alasan minimal 30 karakter, pembatasan laju 5 per jam, penarikan sanggahan status 'diajukan', alasan tolak 20 karakter, pembuatan draf `grade_change_requests` jika buku nilai final).

---

#### Bagian 10: Kehadiran dan Perkuliahan
5. **10.1 Izin dan sakit dari sisi mahasiswa**:
   - **Status**: **Selesai**
   - **Berkas Implementasi**:
     - `src/modules/academic/attendance-actions.ts`
     - `src/lib/akademik/perkuliahan-utils.ts`
     - `supabase/migrations/20261017000025_phase3_attendance_and_teaching.sql`
   - **Pengujian Pembukti**:
     - `src/tests/unit/phase3/phase3-attendance-teaching.test.ts` (alur dispensasi izin dan sakit, persetujuan dosen, retensi berkas bukti).
     - `src/tests/unit/phase3/perkuliahan-utils.test.ts` (fungsi hitung persentase kehadiran `attendance_percent` 3 mode).

6. **10.2 Berita acara perkuliahan**:
   - **Status**: **Selesai**
   - **Berkas Implementasi**:
     - `src/modules/academic/journal-actions.ts`
     - `src/modules/academic/lecturer-journals-view.tsx`
     - `supabase/migrations/20261017000025_phase3_attendance_and_teaching.sql`
   - **Pengujian Pembukti**:
     - `src/tests/unit/phase3/phase3-attendance-teaching.test.ts` (pencatatan materi riil, batas pengisian 3 hari, peningkatan revision_count, dan audit log).

7. **10.3 Tautan kuliah daring dan rekaman**:
   - **Status**: **Selesai**
   - **Berkas Implementasi**:
     - `src/modules/academic/online-meeting-actions.ts`
     - `src/lib/akademik/perkuliahan-utils.ts`
     - `supabase/migrations/20261017000025_phase3_attendance_and_teaching.sql`
   - **Pengujian Pembukti**:
     - `src/tests/unit/phase3/perkuliahan-utils.test.ts` (validasi daftar putih host peladen HTTPS Google Meet, Zoom, Teams, Jitsi, YouTube/Drive rekaman, dan jendela tombol gabung 15 menit).

8. **10.4 Progres materi dan penguncian berurutan**:
   - **Status**: **Selesai**
   - **Berkas Implementasi**:
     - `src/modules/academic/material-progress-actions.ts`
     - `src/lib/akademik/perkuliahan-utils.ts`
     - `supabase/migrations/20261017000025_phase3_attendance_and_teaching.sql`
   - **Pengujian Pembukti**:
     - `src/tests/unit/phase3/phase3-attendance-teaching.test.ts` (penguncian berurutan dengan materi prasyarat, pesan peringatan, pembatasan pengingat 24 jam).

---

#### Bagian 11: Ujian
9. **11.1 Autosave dan pemulihan saat koneksi putus**:
   - **Status**: **Selesai**
   - **Berkas Implementasi**:
     - `src/hooks/use-exam-autosave.ts` (IndexedDB via `idb-keyval`, antrean offline dengan backoff eksponensial, aturan higher revision wins, timer offset peladen)
     - `src/modules/academic/exam-actions.ts`
     - `supabase/migrations/20261017000026_phase4_exams_analytics.sql`
   - **Pengujian Pembukti**:
     - `src/tests/unit/phase4/exam-autosave.test.ts` (3 pengujian IndexedDB batching, revisi, dan sinkronisasi).
     - `tests/e2e/exam-autosave.spec.ts` (pengujian simulasi koneksi terputus dan pemulihan).

10. **11.2 Token masuk, ujian susulan, dan remedial**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/lib/akademik/exam-utils.ts` (`validateMakeupParticipation`, `calcCombinedScore`)
      - `src/modules/academic/exam-actions.ts`
      - `supabase/migrations/20261017000026_phase4_exams_analytics.sql`
    - **Pengujian Pembukti**:
      - `src/tests/unit/phase4/exam-makeup.test.ts` (10 pengujian: isolasi peserta `exam_makeup_participants`, penolakan non-peserta, token 6 karakter tanpa huruf ambigu, pembatasan window waktu susulan, kombinasi skor tertinggi/ganti/rata-rata dengan `score_cap`).
      - `src/tests/unit/phase4/exam-utils.test.ts`.

11. **11.3 Auto-grader soal koding**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/lib/judge/`
      - `src/modules/academic/coding-exam-actions.ts`
      - `supabase/migrations/20261017000026_phase4_exams_analytics.sql`
    - **Pengujian Pembukti**:
      - `src/tests/unit/phase4/phase4-exams-autograder.test.ts`
      - `src/tests/unit/phase4/exam-utils.test.ts` (mode exact, trim, tokens, float).

12. **11.4 Analisis butir soal**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/lib/akademik/exam-utils.ts`
      - `src/modules/academic/exam-analysis-actions.ts`
      - `src/modules/academic/lecturer-exam-analysis-view.tsx`
    - **Pengujian Pembukti**:
      - `src/tests/unit/item-analysis/item-analysis.test.ts` (7 pengujian).
      - `src/tests/unit/phase4/exam-utils.test.ts` (kesukaran P, daya pembeda D, distraktor).

13. **11.5 Pemetaan CPMK ke CPL**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/lib/akademik/exam-utils.ts`
      - `src/modules/academic/curriculum-actions.ts`
      - `supabase/migrations/20261017000026_phase4_exams_analytics.sql`
    - **Pengujian Pembukti**:
      - `src/tests/unit/phase4/exam-utils.test.ts` (kalkulasi CPL dan CPMK riil dari nilai tugas dan kuis).

14. **11.6 Cek kemiripan tugas**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/lib/akademik/similarity-engine.ts`
      - `src/lib/akademik/exam-utils.ts`
      - `src/modules/academic/similarity-actions.ts`
    - **Pengujian Pembukti**:
      - `src/tests/unit/similarity/similarity.test.ts` (7 pengujian).
      - `src/tests/unit/phase4/exam-utils.test.ts` (shingling Jaccard teks, winnowing kode, eliminasi starter code).

---

#### Bagian 12: Interaksi
15. **12.1 Pesan dan konsultasi**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/modules/academic/message-actions.ts` (`validateDirectMessagePermission` memblokir mutlak STUDENT ke STUDENT)
      - `src/modules/academic/consultation-actions.ts`
      - `supabase/migrations/20261017000027_phase5_interaction.sql`
    - **Pengujian Pembukti**:
      - `src/tests/unit/security/no-student-messaging.test.ts` (5 pengujian isolasi pesan antarmahasiswa).
      - `src/tests/unit/phase5/phase5-interaction.test.ts` (kuota konsultasi, jam tenang).

16. **12.2 Polling dan kuis cepat saat kuliah**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/modules/academic/live-poll-actions.ts`
      - `supabase/migrations/20261017000027_phase5_interaction.sql`
    - **Pengujian Pembukti**:
      - `src/tests/unit/phase5/phase5-interaction.test.ts` (anonimitas mutlak via fungsi agregat RPC).

17. **12.3 Pencapaian (gamifikasi ringan)**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/lib/config/gamification.ts`
      - `src/modules/academic/gamification-actions.ts`
      - `supabase/migrations/20261017000027_phase5_interaction.sql`
    - **Pengujian Pembukti**:
      - `src/tests/unit/badges-certs/badges-certs.test.ts` (6 pengujian).
      - `src/tests/unit/phase5/phase5-interaction.test.ts` (streak harian WIB, poin XP, leaderboard opt-in).

18. **12.4 Pengingat AI yang proaktif**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/lib/ai/reminder-engine.ts`
      - `src/app/api/cron/ai-reminders/route.ts`
    - **Pengujian Pembukti**:
      - `src/tests/unit/phase5/phase5-interaction.test.ts` (batas waktu komputasi 5 detik, jam tenang 22–06 WIB, fallback templat statis).

19. **12.5 Evaluasi dosen oleh mahasiswa (EDOM)**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/modules/academic/evaluation-actions.ts`
      - `supabase/migrations/20261017000027_phase5_interaction.sql`
    - **Pengujian Pembukti**:
      - `src/tests/unit/evaluation/evaluation.test.ts` (8 pengujian: True Anonymity Decoupling, minimal 5 responden, komentar acak).

---

#### Bagian 13: Alat Bantu Dosen dan Sistem
20. **13.1 Salin kelas dan arsip kelas**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/modules/academic/class-clone-actions.ts`
      - `supabase/migrations/20261017000028_phase6_tools_and_archive.sql`
    - **Pengujian Pembukti**:
      - `src/tests/unit/phase6/class-clone-archive.test.ts` (3 pengujian: isolasi 100% data mahasiswa, pergeseran tanggal, kelas arsip read-only).

21. **13.2 Impor soal massal dari Excel dan Word**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/lib/akademik/excel-question-parser.ts`
      - `src/lib/akademik/word-question-parser.ts`
      - `src/lib/akademik/question-sanitizer.ts`
      - `src/modules/academic/question-import-actions.ts`
    - **Pengujian Pembukti**:
      - `src/tests/unit/phase6/excel-parser.test.ts` (3 pengujian).
      - `src/tests/unit/phase6/word-parser.test.ts` (2 pengujian).
      - `src/tests/unit/phase6/question-sanitizer.test.ts` (3 pengujian XSS dan deteksi duplikat).

22. **13.3 Ekspor dan impor Moodle XML dan QTI 2.1**:
    - **Status**: **Selesai**
    - **Berkas Implementasi**:
      - `src/lib/akademik/moodle-xml-parser.ts`
      - `src/lib/akademik/qti-parser.ts`
    - **Pengujian Pembukti**:
      - `src/tests/unit/phase6/moodle-xml.test.ts` (2 pengujian round-trip).
      - `src/tests/unit/phase6/qti-parser.test.ts` (1 pengujian round-trip paket arsip QTI zip).

---

### Verifikasi Item Keamanan dan Arsitektur Tambahan

1. **Grup Menu Akun**:
   - Menu Akun untuk seluruh 6 peran secara konsisten dan mutlak hanya berisi `Pengaturan`, `Bantuan`, dan `Privasi`.
   - **Pengujian**: `tests/nav-roles.test.ts` (18 pengujian passed).

2. **Login Berbasis Database Allowlist**:
   - Validasi email kampus via `validasiEmailKampusAsync` menguji domain aktif dari `allowed_email_domains` dan alamat surat elektronik terdaftar pada `email_allowlist`.
   - **Pengujian**: `src/tests/unit/security/login-email-allowlist.test.ts` (5 pengujian passed).

3. **Safeguard Lingkungan Produksi `demo_seed.sql`**:
   - Blok penolakan eksekusi otomatis terpasang di baris awal `supabase/seed/demo_seed.sql`, membatalkan transaksi dengan pesan kesalahan `EXCEPTION` bila dijalankan pada konfigurasi bertaraf produksi.

4. **Uji Kebijakan RLS (pgTAP)**:
   - Rangkaian uji pgTAP `supabase/tests/database/07_phase5_interaction_and_disputes_rls.sql` memvalidasi kebijakan keamanan isolasi baris untuk tabel evaluasi dosen, polling interaktif, permohonan izin/sakit, pesan langsung, dan sanggahan nilai.
   - Seluruh 122 tabel pada skema database lulus verifikasi RLS (`npm run check:rls`).

5. **Tab KRS di Halaman Pengajuan (`/requests`)**:
   - Mahasiswa dapat memantau status KRS berjalan, beban SKS diambil terhadap batas kuota IPS, catatan Dosen Pembimbing Akademik, daftar mata kuliah rencana studi, tombol pengajuan langsung, dan tombol cetak lembar KRS.
   - **Berkas**: `src/modules/requests/requests-view.tsx` & `src/app/(portal)/requests/page.tsx`.
