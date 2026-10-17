# Ringkasan Progres Pengerjaan SIAJAR
Instruksi: `docs/INSTRUKSI_ANTIGRAVITY.md` (Versi 2 · Oktober 2026)

---

## Status Fase

| Fase | Nama Fase | Status | Keterangan |
| :--- | :--- | :--- | :--- |
| **Fase 0** | Audit, Penamaan Ulang Menu & Penyelarasan Celah | **Selesai** | Audit selesai (`docs/AUDIT_AWAL.md`), 102 menu tervalidasi, migrasi 22 celah skema diterapkan, lulus typecheck, test, lint, dan build. |
| **Fase 1** | Fondasi Bersama | **Selesai** | Kebijakan institusi (Lampiran A), rilis terjadwal (release_at), notifikasi terjadwal, 10 cron endpoint, 5 bucket storage RLS, lulus typecheck, 32 tes unit, lint, dan Next.js build. |
| **Fase 2** | Tugas dan Nilai | **Sedang Berjalan** | Keterlambatan, tugas kelompok, rubrik, sanggah nilai. |
| **Fase 3** | Kehadiran dan Perkuliahan | Menunggu | Izin & sakit, berita acara, kuliah daring, progres materi. |
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


