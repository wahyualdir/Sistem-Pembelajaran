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
| **Fase 4** | Ujian | Menunggu | Autosave CBT, token, auto-grader koding, analisis butir soal, CPMK->CPL, kemiripan. |
| **Fase 5** | Interaksi | Menunggu | Pesan & konsultasi, polling, pencapaian, pengingat AI, evaluasi dosen. |
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
