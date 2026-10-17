# Ringkasan Progres Pengerjaan SIAJAR
Instruksi: `docs/INSTRUKSI_ANTIGRAVITY.md` (Versi 2 · Oktober 2026)

---

## Status Fase

| Fase | Nama Fase | Status | Keterangan |
| :--- | :--- | :--- | :--- |
| **Fase 0** | Audit, Penamaan Ulang Menu & Penyelarasan Celah | **Selesai** | Audit selesai (`docs/AUDIT_AWAL.md`), 102 menu tervalidasi, migrasi 22 celah skema diterapkan, lulus typecheck, test, lint, dan build. |
| **Fase 1** | Fondasi Bersama | **Sedang Berjalan** | Kebijakan institusi, rilis terjadwal, notifikasi, cron, bucket storage. |
| **Fase 2** | Tugas dan Nilai | Menunggu | Keterlambatan, tugas kelompok, rubrik, sanggah nilai. |
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

