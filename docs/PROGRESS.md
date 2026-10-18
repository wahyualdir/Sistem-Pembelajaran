# Ringkasan Progres Pengerjaan SIAJAR
Instruksi: `docs/INSTRUKSI_ANTIGRAVITY.md` (Versi 2 · Oktober 2026)

---

## Status Fase

| Fase | Nama Fase | Status | Keterangan |
| :--- | :--- | :--- | :--- |
| **Fase 0** | Audit, Penamaan Ulang Menu & Penyelarasan Celah | **Selesai** | Audit selesai (`docs/AUDIT_AWAL.md`), 102 menu tervalidasi, migrasi 22 celah skema diterapkan, lulus typecheck, test, lint, dan build. |
| **Fase 1** | Fondasi Bersama | **Selesai** | Kebijakan institusi (Lampiran A), rilis terjadwal (release_at), notifikasi terjadwal, 10 cron endpoint, 5 bucket storage RLS, lulus typecheck, 32 tes unit, lint, dan Next.js build. |
| **Fase 2** | Tugas dan Nilai | **Selesai** | Keterlambatan dan perpanjangan, tugas kelompok dan penyesuaian kontribusi, rubrik bertingkat, sanggah nilai dan integrasi perubahan nilai, 34 tes lulus, typecheck, lint, dan build hijau. |
| **Fase 3** | Kehadiran dan Perkuliahan | **Selesai** | Izin & sakit, berita acara, kuliah daring, progres materi, 36 berkas tes (330 tes) lulus, typecheck, lint, dan build hijau. |
| **Fase 4** | Ujian | **Selesai** | Autosave CBT, token, auto-grader koding, analisis butir soal, CPMK->CPL, kemiripan, 38 berkas tes (351 tes) lulus, typecheck, lint, dan build hijau. |
| **Fase 5** | Interaksi | **Selesai** | Pesan & konsultasi, polling, pencapaian, pengingat AI, evaluasi dosen, 39 berkas tes (359 tes) lulus, RLS 120 tabel, typecheck, lint, dan build hijau. |
| **Fase 6** | Alat Bantu Dosen dan Sistem | Menunggu | Salin kelas, arsip, impor soal Excel/Word, Moodle XML & QTI. |
| **Fase 7** | Penutup | Menunggu | Matriks baru, dokumentasi akhir, data seed, verifikasi akhir. |

---

## Log Aktivitas Terkini

### [17 Oktober 2026] Fase 0 Selesai — Audit, Navigasi 102 Menu & Penyelarasan Celah
- **Audit Kode Awal**: Dokumen audit diterbitkan di `docs/AUDIT_AWAL.md` memetakan nama tabel sebenarnya, 8 fungsi helper RLS, server actions, dan library.
- **Peta Menu Final**: Mengonfigurasi `src/lib/config/menu-config.ts` untuk 102 butir menu 7 peran sesuai instruksi tanpa kata/pola terlarang.
- **Rute Baru Terpasang**: Menyediakan 10 rute placeholder lengkap dengan proteksi peran dan empty-state ramah pengguna (`/requests`, `/messages`, `/achievements`, `/evaluations`, `/ta/materials`, `/lecturer/journals`, `/lecturer/rubrics`, `/lecturer/evaluations`, `/lecturer/disputes`, `/exams/analysis`, `/coordinator/evaluations`).
- **Migrasi 22 Gap Alignment**: Dibuat `supabase/migrations/20261017000022_phase0_gap_alignment.sql` menambahkan `can_open_attendance` pada `class_assistants`, tabel `student_requests`, tabel `allowed_email_domains`, `email_allowlist`, serta view `audit_logs_for_sysadmin` dengan masking IP & user agent.
- **Tipe Database Tergenerate**: `src/lib/supabase/types.ts` disinkronkan dengan skema migrasi 22.
- **Arsitektur Server Action & Store**: Memisahkan in-memory store kuis ke `src/modules/academic/quiz-store.ts` guna mematuhi aturan Next.js `'use server'` (tidak mengekspor objek dari berkas action).
- **Verifikasi Kualitas**:
  - `npm run typecheck`: 0 error
  - `npm test`: 31 berkas tes, 259 pengujian lulus (100%)
  - `npm run lint`: 0 error
  - `npm run build`: Berhasil mengompilasi seluruh rute statis & dinamis Next.js tanpa kegagalan.

### [17 Oktober 2026] Fase 1 Selesai — Fondasi Bersama
- **Migrasi 23 (Fondasi Bersama)**: Dibuat `supabase/migrations/20261017000023_phase1_foundation.sql` lengkap dengan instruksi rollback di komentar atas berkas:
  - Tabel `institution_policies` dengan RLS, fungsi SQL `get_policy()`, dan seed 21 parameter kebijakan Lampiran A.
  - Kolom `release_at timestamptz` pada tabel `materials`, `assignments`, dan `quizzes` serta pembaruan RLS mahasiswa (`now() >= release_at`).
  - Tabel `scheduled_notifications` dengan RLS, indeks komposit `(send_at, sent_at)`, dan dedupe key.
  - Pendaftaran 5 bucket Supabase Storage privat (`absence-proofs`, `submission-feedback`, `message-attachments`, `question-assets`, `import-staging`) dengan kebijakan RLS berbasis kepemilikan dan peran.
- **Layanan Kebijakan Terkonfigurasi**: `src/lib/policies/index.ts` menyediakan helper `getPolicy<T>()` dengan cache in-memory 60 detik dan fallback fail-safe.
- **Isolasi Server Action**: `src/lib/policies/actions.ts` mengekspos `getAllPoliciesAction` dan `updatePolicyAction` dengan boundary `'use server'` dan pencatatan audit log `recordSystemAuditLog` (nilai sebelum dan sesudah).
- **Isolasi Syarat Ujian Sisi Server**: Memisahkan evaluasi dinamis ke `src/lib/akademik/syarat-ujian-server.ts` agar modul murni `syarat-ujian.ts` tetap aman diimpor di komponen klien tanpa memicu kebocoran package `server-only`.
- **Rilis Terjadwal di Antarmuka**: Banner informatif *"Tampil untuk mahasiswa pada <tgl>"* pada kartu materi, tugas, dan kuis dosen/asisten, serta penyaringan otomatis sebelum tanggal rilis untuk mahasiswa.
- **Notifikasi Terjadwal & Cron Handler**:
  - Modul `src/modules/notifications/scheduled.ts` dengan penjadwalan idempoten via `dedupe_key`.
  - Helper otentikasi cron fail-closed `src/lib/cron/auth.ts` (`Authorization: Bearer ${CRON_SECRET}`).
  - Pendaftaran 10 jadwal cron di `vercel.json` dan 10 route handler di `src/app/api/cron/*`.
- **Manajemen Kebijakan Institusi (Super Admin)**: Antarmuka tab `SuperadminPoliciesHubView` di `/admin/policies` memungkinkan pengubahan 21 parameter kebijakan langsung oleh Super Admin.
- **Pengujian Unit & Verifikasi Kualitas**:
  - `src/tests/unit/phase1/phase1-foundation.test.ts`: 9 pengujian spesifik Fase 1 lulus 100%.
  - `npm test`: 32 berkas tes, 268 pengujian lulus 100%.
  - `npx tsc --noEmit`: 0 error.
  - `npm run lint`: 0 error.
  - `npm run build`: Berhasil mengompilasi seluruh rute statis & dinamis Next.js tanpa error.

### [17 Oktober 2026] Fase 2 Selesai — Tugas dan Nilai
- **Migrasi 24 (Tugas, Rubrik, Kelompok, dan Sanggahan)**: `supabase/migrations/20261017000024_phase2_assignments_grades.sql` dibuat dengan instruksi rollback di komentar atas berkas:
  - Kebijakan keterlambatan tugas: fungsi SQL `calc_late_penalty()`, kolom `late_policy`, `late_penalty_value`, `late_penalty_cap`, `allow_resubmit`, `max_resubmits`, `submission_mode`, `group_set_id`, dan snapshot `rubric_snapshot` pada `assignments`.
  - Tabel `assignment_extensions` dengan RLS dan indeks unik per penugasan & mahasiswa/kelompok.
  - Tabel `submission_versions` dengan RLS untuk merekam riwayat revisi tugas saat pengumpulan ulang diizinkan.
  - Skema tugas kelompok: tabel `group_sets`, `groups`, `group_members`, `submission_member_adjustments`, serta RPC Postgres `join_group_with_code` dan `leave_group`.
  - Struktur rubrik bertingkat: tabel `rubrics`, `rubric_criteria`, `rubric_levels`, `rubric_scores`, dan komentar umpan balik `feedback_comments`.
  - Sanggah nilai: tabel `grade_disputes`, indeks unik `uq_grade_disputes_active` (maksimal 3 sanggahan aktif per mahasiswa per kelas), dan utas pesan `grade_dispute_messages`.
- **Kalkulator Murni & Server Actions**:
  - `src/lib/akademik/late-penalty.ts`: Fungsi murni TypeScript `calcLatePenalty`, `calcLateMinutes`, `getEffectiveDates`, `isSubmissionClosed`, dan `calcFinalAssignmentScore`.
  - `src/modules/academic/assignment-late-actions.ts`: Server action untuk pemberian perpanjangan tenggat perorangan/kelompok dan pemutihan denda keterlambatan (`waiveLatePenaltyAction`).
  - `src/modules/academic/group-actions.ts`: Server action pembentukan set kelompok (`self`, `lecturer`, `random`), gabung dengan kode 6 karakter alfanumerik, keluar kelompok, dan penyesuaian kontribusi anggota (0.5 - 1.5).
  - `src/modules/academic/rubric-actions.ts`: Pembuatan rubrik berkriteria dan berbobot, duplikasi rubrik, penilaian pengumpulan berbasis rubrik, serta penambahan komentar umpan balik. Asisten hanya dapat menyimpan draf penilaian, dosen mempublikasikan nilai final.
  - `src/modules/academic/dispute-actions.ts`: Pengajuan sanggah nilai dalam jendela 7 hari kalender, pembatasan 3 sanggahan aktif, percakapan sanggahan, penarikan, dan resolusi dosen (otomatis membuat draf `grade_change_requests` jika buku nilai telah difinalisasi).
- **Antarmuka Pengguna Sesuai Standar**:
  - Form tugas (`src/modules/academic/assignment-forms.tsx`): Selector kebijakan denda (`none`, `flat`, `per_hour`, `per_day`), input penalti, cap, opsi pengumpulan ulang, dan kalimat ringkasan natural Bahasa Indonesia.
  - Tab Kelompok (`src/modules/academic/class-groups-tab-view.tsx`) pada halaman detail kelas (`/classes/[id]?tab=kelompok`): Pembuatan kelompok oleh dosen, kartu kelompok, kode join 6 karakter, daftar anggota, dan deteksi kelompok di bawah ukuran minimum.
  - Kartu Perpanjangan Tenggat (`src/modules/academic/assignment-extensions-card.tsx`) pada halaman tugas (`/classes/[id]/assignments/[aid]`): Informasi batas waktu efektif mahasiswa dan formulir perpanjangan oleh dosen.
  - Antarmuka Rubrik Dosen (`/lecturer/rubrics`): Pembuatan rubrik berbobot total 100% dan duplikasi rubrik.
  - Antarmuka Sanggah Nilai Dosen (`/lecturer/disputes`): Filter status, peninjauan sanggahan, utas diskusi dengan mahasiswa, dan formulir keputusan resolusi.
- **Pengujian Unit & Verifikasi Kualitas**:
  - `src/tests/unit/phase2/late-penalty.test.ts`: 17 pengujian lulus 100%.
  - `src/tests/unit/phase2/phase2-assignments-grades.test.ts`: 14 pengujian lulus 100%.
  - Total pengujian unit: 34 berkas tes, 299 pengujian lulus 100%.
  - `npx tsc --noEmit`: 0 error.
  - `npm run lint`: 0 error.
### [17 Oktober 2026] Fase 3 Selesai — Kehadiran dan Perkuliahan
- **Migrasi 25 (Kehadiran dan Perkuliahan)**: `supabase/migrations/20261017000025_phase3_attendance_and_teaching.sql` dibuat dengan instruksi rollback di komentar atas berkas:
  - Tabel permohonan izin & sakit: `absence_requests`, `absence_request_items` dengan relasi ke pertemuan kelas, status verifikasi (`pending`, `approved`, `rejected`), dan signed URL berumur pendek 60 detik.
  - Kolom audit sumber di `attendance_records`: `source` ('manual', 'qr', 'absence_request') dan `absence_item_id`.
  - Fungsi SQL `attendance_percent(p_student_id, p_class_id)` dengan dukungan kebijakan `attendance_permission_policy` ('exclude', 'present', 'absent').
  - Fungsi SQL `review_absence_item(p_item_id, p_decision, p_note)` yang secara atomik memperbarui status pengajuan dan baris presensi.
  - Tabel berita acara perkuliahan: `class_session_journals`, `journal_materials`, pelacakan revisi pasca-finalisasi (`revision_count`, `revision_reason`).
  - Kolom kuliah daring di `class_sessions`: `delivery_mode` ('tatap_muka', 'daring_sinkron', 'daring_asinkron', 'hybrid'), `meeting_url`, `recording_url`, `recording_visible_from`.
  - Kolom ketuntasan berurutan di `materials`: `unlock_after_material_id`, `require_completion`, dan tabel pelacakan `material_progress`.
- **Kalkulator Murni & Server Actions**:
  - `src/lib/akademik/perkuliahan-utils.ts`: Fungsi murni TypeScript `isValidMeetingHost`, `isMeetingJoinActive`, `validateAbsenceDates`, `calcAttendancePercent`, `isJournalLate`, dan `isMaterialUnlocked`.
  - `src/modules/academic/absence-actions.ts`: Pengajuan izin/sakit dengan privasi non-diagnosis, pembatalan, persetujuan/penolakan individual dan batch oleh dosen, serta signed URL 60 detik dengan audit log.
  - `src/modules/academic/journal-actions.ts`: Simpan draf berita acara (dosen & asisten), finalisasi berita acara (hanya dosen), revisi berita acara pasca-finalisasi dengan audit log, dan ekspor Excel (.xlsx) dengan `exceljs`.
  - `src/modules/academic/online-meeting-actions.ts`: Pengaturan mode perkuliahan dan URL konferensi terverifikasi (Meet, Zoom, Teams, Webex, YouTube) dengan opsi seragam ke seluruh sesi.
  - `src/modules/academic/material-progress-actions.ts`: Pencatatan buka materi, tandai selesai/batal, agregasi progres materi mahasiswa dan dosen, serta aksi ingatkan mahasiswa belum membuka dengan batasan 24 jam.
- **Antarmuka Pengguna Terpadu**:
  - Modal Izin/Sakit Mahasiswa & Tab Peninjauan Dosen (`src/modules/academic/absence-modal-and-view.tsx`): Formulir terstruktur dengan peringatan privasi, filter status pengajuan, peninjauan batch, modal alasan penolakan, dan pratinjau bukti berkas signed URL.
  - Halaman Berita Acara Dosen (`/lecturer/journals` & `src/modules/academic/lecturer-journals-view.tsx`): Ringkasan status keterlambatan (H+3 23.59 WIB), formulir draf/finalisasi, pencatatan revisi, dan ekspor spreadsheet rekapitulasi.
  - Tab Pertemuan & Materi Kelas (`src/modules/academic/class-hub-tabs.tsx`): Bilah kemajuan belajar mahasiswa, kartu materi terkunci dengan indikasi prasyarat belum selesai, tombol gabung pertemuan daring sinkron dengan validasi waktu aktif, dan panel kontrol ingatkan mahasiswa bagi dosen.
- **Pengujian Unit & Verifikasi Kualitas**:
  - `src/tests/unit/phase3/perkuliahan-utils.test.ts`: 31 pengujian spesifik Fase 3 lulus 100%.
  - Total pengujian unit: 36 berkas tes, 330 pengujian lulus 100%.
  - `npx tsc --noEmit`: 0 error.
  - `npm run lint`: 0 error.
  - `npm run build`: Kompilasi produksi Next.js hijau dan bersih.

### [17 Oktober 2026] Fase 4 Selesai — Ujian
- **Migrasi 26 (Ujian, CBT, Analisis Butir, CPMK-CPL, dan Kemiripan)**: `supabase/migrations/20261017000026_phase4_exams_analytics.sql` dibuat dengan instruksi rollback di komentar atas berkas:
  - 16 tabel baru dengan RLS: `exam_events`, `exam_access_tokens`, `exam_makeup_participants`, `coding_test_cases`, `coding_submissions`, `exam_item_stats`, `exam_summary_stats`, `cpl`, `cpmk`, `cpmk_cpl_map`, `assessment_cpmk_map`, `achievement_snapshots`, `journal_cpmk`, `similarity_runs`, `submission_fingerprints`, `similarity_pairs`.
  - Kolom CBT & Ujian: `expires_at`, `extra_time_seconds`, `last_heartbeat_at`, `active_session_id`, `auto_submitted`, `submit_idempotency_key` pada `exam_attempts`; `revision`, `updated_at` pada `exam_answers`; `access_mode`, `parent_quiz_id`, `kind`, `score_cap`, `combine_policy` pada `quizzes`; `code_language`, `time_limit_ms`, `memory_limit_mb`, `compare_mode`, `needs_revision` pada `quiz_questions`; `can_view_similarity` pada `class_assistants`.
  - 8 RPC Postgres atomik: `claim_attempt_session`, `save_exam_answers`, `exam_heartbeat`, `submit_exam`, `grant_exam_extra_time`, `enter_exam`, `get_exam_monitoring_summary`, `finalize_expired_attempts`.
- **Kalkulator Murni & Server Actions**:
  - `src/lib/akademik/exam-utils.ts`: Analisis butir soal (`analyzeExamItems` dengan hitungan p, D, r_pb, KR-20, dan efektivitas distractor), gabungan nilai susulan/remedial (`calcCombinedExamScore`), pembanding output autograder (`compareOutput`), pemetaan capaian CPMK/CPL (`calcStudentCpmkScores`, `calcStudentCplScores`), dan deteksi kemiripan teks shingling/Jaccard serta kode winnowing dengan pengecualian starter code.
  - `src/lib/judge/coderunner.ts`: Adapter Judge0 fail-safe dengan deteksi ketersediaan API instan.
  - `src/hooks/use-exam-autosave.ts`: Hook autosave CBT dengan backup IndexedDB/localStorage, batch debounce 1.5 detik, retry exponential backoff, kunci sesi aktif tunggal, time offset server, heartbeat 15 detik, dan telemetri proctoring.
  - `src/modules/academic/exam-actions.ts`: Kumpulan server action terproteksi untuk alur CBT, perpanjangan waktu pengawas, rotasi token, pembuatan ujian susulan/remedial, submit kode autograder dengan rate-limit 5 detik, hitung analisis butir, rekap capaian CPMK kelas, dan cek kemiripan berkas.
- **Antarmuka Pengguna Terpadu**:
  - Pengawas Ujian (`/ta/exam-monitor` & `src/modules/academic/exam-proctor-view.tsx`): Ringkasan status peserta realtime (mengerjakan, selesai, koneksi terputus, curang/fokus hilang), panel token dinamis, modal tambah waktu ujian, dan log telemetri proctoring.
  - Analisis Butir Soal (`/exams/analysis` & `src/modules/academic/exam-analysis-view.tsx`): Indeks kesukaran (p), daya beda (D), korelasi point-biserial, reliabilitas KR-20, analisis distraktor, dan penandaan otomatis soal yang butuh revisi.
  - Cek Kemiripan (`src/modules/academic/similarity-check-panel.tsx` & `src/modules/academic/similarity-review-view.tsx`): Pemicu analisis kemiripan per tugas dengan disclaimer hukum tegas bahwa skor tinggi bukan bukti plagiarisme otomatis melainkan indikator telaah manual.
  - Radar Capaian CPMK/CPL (`src/modules/academic/cpmk-cpl-radar-card.tsx`): Visualisasi capaian lulusan per mata kuliah terintegrasi di tab kelas dan buku nilai mahasiswa.
- **Pengujian Unit & Verifikasi Kualitas**:
  - `src/tests/unit/phase4/exam-utils.test.ts`: 21 pengujian murni spesifik Fase 4 lulus 100%.
  - Total pengujian unit: 38 berkas tes, 351 pengujian lulus 100%.
  - `npx tsc --noEmit`: 0 error.
  - `npm run lint`: 0 error.
  - `npm run build`: Kompilasi produksi Next.js hijau dan bersih.

### [17 Oktober 2026] Fase 5 Selesai — Interaksi
- **Migrasi 27 (Pesan, Konsultasi, Polling, Gamifikasi, Pengingat AI, EDOM)**: Dibuat `supabase/migrations/20261017000027_phase5_interaction.sql` lengkap dengan instruksi rollback di komentar atas berkas:
  - 22 tabel baru dengan RLS aktif: `conversations`, `conversation_participants`, `messages`, `message_reports`, `consultation_slots`, `consultation_bookings`, `live_polls`, `live_poll_votes`, `xp_events`, `badges` (dengan seed 7 lencana), `study_streaks`, `class_gamification_settings`, `student_gamification_prefs`, `ai_reminders`, `ai_usage_logs`, `evaluation_templates`, `evaluation_questions`, `evaluation_periods`, `evaluation_targets`, `evaluation_completions`, `evaluation_responses`, `evaluation_answers`.
  - 9 RPC Postgres atomik: `start_conversation`, `book_consultation_slot` (dengan `FOR UPDATE` kunci kapasitas), `cancel_consultation_booking` (syarat H-2 jam), `submit_poll_vote`, `get_poll_results` (100% anonim tanpa `student_id`), `award_xp` (kebiasaan streak WIB), `get_class_leaderboard`, `submit_evaluation` (True Anonymity Decoupling), `get_lecturer_evaluation_summary` (ambang batas $\ge 5$ responden).
  - Verifikasi RLS: Seluruh 120 tabel pada skema public lolos `npm run check:rls`.
- **Kalkulator Murni & Server Actions**:
  - `src/lib/config/gamification.ts`: Konfigurasi poin terpusat (tugas tepat waktu 10, hadir 5, materi 3, polling 2, kuis benar 3) dan kalkulator streak harian deterministik.
  - `src/lib/ai/prompts.ts` & `src/lib/ai/reminder-templates.ts`: Prompt sistem AI ketat bebas emoji, deteksi jam tenang (22.00–06.00 WIB) dengan pergeseran ke pukul 06.00 pagi (kecuali `login_baru`), dan templat statis alami untuk 7 jenis pengingat.
  - `src/lib/ai/reminder-service.ts`: Layanan pembuat pengingat cerdas dengan batas waktu 5 detik, pencatatan `ai_usage_logs`, dan fallback fail-safe.
  - `src/lib/akademik/message-utils.ts`: Utilitas murni jam tenang dosen (20.00–07.00 WIB) dan batas pembatalan konsultasi 2 jam.
  - `src/modules/academic/message-actions.ts`: Server action pesan langsung dengan rate limit 30 pesan/menit, pelaporan pesan ke moderasi staf, dan manajemen slot konsultasi.
  - `src/modules/academic/poll-actions.ts`: Pembuatan polling kilat (single, multiple, scale, text), buka/tutup, dan voting mahasiswa.
  - `src/modules/academic/gamification-actions.ts`: Ringkasan pencapaian mahasiswa, preferensi leaderboard opt-in, dan papan peringkat mingguan.
- **Antarmuka Pengguna Terpadu**:
  - Halaman Pesan (`/messages` & `src/modules/academic/messages-hub-view.tsx`): Tampilan dua kolom responsif, tab percakapan dengan indikator jam tenang dosen, pelaporan pesan terproteksi, serta pemesanan dan pembatalan slot konsultasi.
  - Kartu Polling Kelas (`src/modules/academic/class-live-poll-card.tsx`): Terintegrasi langsung di bagian atas stream perkuliahan (`class-hub-tabs.tsx`).
  - Halaman Pencapaian (`/achievements` & `src/modules/academic/achievements-view.tsx`): Ringkasan XP, streak harian, kisi 7 lencana dengan syarat terbuka, dan kontrol partisipasi papan peringkat ber-alias.
  - Evaluasi Dosen Mahasiswa (`/evaluations` & `src/modules/academic/student-evaluations-view.tsx`): Daftar kelas yang menunggu evaluasi, banner anonimitas 100%, dan formulir penilaian.
  - Hasil Evaluasi Dosen (`/lecturer/evaluations` & `src/modules/academic/lecturer-evaluations-view.tsx`): Ringkasan skor per kompetensi dan komentar mahasiswa acak tanpa tanggal/nama (dengan proteksi periode tutup dan minimal 5 responden).
  - Evaluasi Mutu Kaprodi (`/coordinator/evaluations` & `src/modules/academic/coordinator-evaluations-view.tsx`): Kontrol buka/tutup periode evaluasi, pengiriman pengingat massal, rekapitulasi mutu dosen, dan ekspor CSV.
- **Pengujian Unit & Verifikasi Kualitas**:
  - `src/tests/unit/phase5/phase5-interaction.test.ts`: 8 pengujian spesifik Fase 5 lulus 100%.
  - `src/tests/unit/evaluation/evaluation.test.ts`: 8 pengujian siklus hidup EDOM dan True Anonymity lulus 100%.
### [18 Oktober 2026] Fase 6 Selesai — Alat Bantu Dosen dan Sistem
- **Migrasi 28 (Salin & Arsip Kelas, Impor Soal Massal, Moodle XML & QTI)**: Dibuat `supabase/migrations/20261017000028_phase6_tools_and_archive.sql` lengkap dengan instruksi rollback di komentar atas berkas:
  - Tabel baru dengan RLS aktif: `clone_jobs` dan `question_import_jobs`.
  - Kolom baru pada tabel `classes`: `archived_at TIMESTAMPTZ`, `archived_by UUID`, `archive_reason TEXT`.
  - 3 RPC Postgres atomik: `clone_class` (salin materi, tugas bergeser tanggal, kuis bergeser tanggal, rubrik, gamifikasi, CPMK, asisten; mengecualikan 100% data mahasiswa), `archive_class` (mengubah status ke ARCHIVED dengan pencatatan audit log), `unarchive_class` (membuka kembali arsip khusus staf/super admin).
  - Verifikasi RLS: Seluruh 122 tabel pada skema public lolos `npm run check:rls`.
- **Modul Murni Parser & Sanitasi**:
  - `src/lib/akademik/question-sanitizer.ts`: Sanitasi HTML ketat (pembersihan `<script>`, iframe, dan atribut event XSS) serta deteksi duplikat dengan hash teks normalisasi.
  - `src/lib/akademik/excel-question-parser.ts`: Generator template Excel resmi `.xlsx` (`exceljs`) dengan validasi dropdown pilihan tipe dan tingkat kesulitan, serta parser berkas dengan pesan galat natural.
  - `src/lib/akademik/word-question-parser.ts`: Ekstraksi dokumen Word `.docx` (`mammoth`) berbasis pola nomor soal, pilihan a–e, `Jawaban: B`, dan `Pembahasan:`.
  - `src/lib/akademik/moodle-xml-parser.ts`: Generator dan parser dua arah (bidirectional) Moodle XML (`fast-xml-parser`) untuk pilihan ganda, benar/salah, isian singkat, dan esai dengan dukungan kategori dan CDATA.
  - `src/lib/akademik/qti-parser.ts`: Generator dan parser paket arsip QTI 2.1 `.zip` (`jszip` dan `fast-xml-parser`) dengan `imsmanifest.xml`.
- **Server Actions & Antarmuka Terpadu**:
  - `src/modules/academic/class-clone-actions.ts`: Server action penyalinan kelas dengan pergeseran tenggat waktu, pengarsipan kelas tunggal, dan penutupan semester massal.
  - `src/modules/academic/question-import-actions.ts`: Server action unduh template Excel, parsing berkas unggahan, pratinjau tabel interaktif, dan konfirmasi impor batch per 100 soal ke database.
  - `src/modules/academic/question-import-modal.tsx`: Modal lengkap impor massal di Bank Soal (`/exams/question-bank`) dengan tabel pratinjau status (Valid, Peringatan, Galat) dan tombol ekspor Moodle XML serta QTI 2.1 zip.
  - `src/modules/academic/class-clone-modal.tsx`: Modal salin isi kelas untuk Dosen dan Staf pada halaman `/classes`.
  - `src/modules/academic/staff-archive-semester-modal.tsx`: Tombol dan modal "Tutup Semester" pada halaman `/staff/classes`.
  - Filter "Aktif" dan "Arsip" pada halaman Kelas Saya (`/classes`) dengan pita peringatan baca-saja pada kelas arsip.
- **Pengujian Unit & Verifikasi Kualitas**:
  - `src/tests/unit/phase6/question-sanitizer.test.ts`: Uji sanitasi XSS dan hash duplikat (3 tes lulus).
  - `src/tests/unit/phase6/excel-parser.test.ts`: Uji generator template Excel dan deteksi galat kunci (3 tes lulus).
  - `src/tests/unit/phase6/word-parser.test.ts`: Uji ekstraksi pola Word DOCX (2 tes lulus).
  - `src/tests/unit/phase6/moodle-xml.test.ts`: Uji putar-balik (roundtrip) Moodle XML dan tipe tak didukung (2 tes lulus).
  - `src/tests/unit/phase6/qti-parser.test.ts`: Uji putar-balik (roundtrip) paket arsip QTI 2.1 zip (1 tes lulus).
  - `src/tests/unit/phase6/class-clone-archive.test.ts`: Uji aturan bisnis isolasi data mahasiswa dan pergeseran tanggal (3 tes lulus).
  - Total pengujian unit: 45 berkas tes, 373 pengujian lulus 100%.
  - `npm run check:rls`: 122 dari 122 tabel skema public memiliki RLS aktif.
  - `npx tsc --noEmit`: 0 error.
  - `npm run lint`: 0 error.
  - `npm run build`: Kompilasi produksi Next.js hijau dan bersih.



