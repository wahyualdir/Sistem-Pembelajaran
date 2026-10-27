# AUDIT KEAMANAN API SIAJAR (Fase 1)

Dokumen ini memuat hasil audit menyeluruh terhadap seluruh rute API (`src/app/api/**/route.ts`) di repositori SIAJAR, mencakup metode akses, mekanisme otentikasi/otorisasi, perlindungan terhadap IDOR, dan fail-closed guard.

---

## 1. Tabel Inventaris dan Audit Rute API (29 Rute)

| No | Path Rute API | Metode | Hak Akses (Siapa yang Boleh) | Mekanisme Otentikasi & Otorisasi | Status / Hasil |
|---|---|---|---|---|---|
| 1 | `/api/auth/callback` | `GET` | Publik (Calon Pengguna OAuth) | Pertukaran kode OAuth Supabase + Validasi domain allowlist kampus UIR + Cek registrasi mahasiswa | **AMAN**: Mengalihkan ke login jika tidak sah / ditolak |
| 2 | `/api/auth/logout` | `GET`, `POST` | Pengguna Terotentikasi / Publik | Menghapus seluruh cookie sesi (`siakad_session`, `demo_session`, `active_role`, `impersonation_token`) | **AMAN**: Membersihkan seluruh state sesi di klien |
| 3 | `/api/calendar/feed` | `GET` | Pemilik Token Kalender ICS | Verifikasi token langganan bertanda tangan via `getUserIdFromCalendarToken(token)` | **AMAN**: 401 jika token hilang atau tidak valid |
| 4 | `/api/cron/activity_purge` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 5 | `/api/cron/ai-reminders` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 6 | `/api/cron/ai_content_jobs` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 7 | `/api/cron/auto-archive-classes` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 8 | `/api/cron/content_review_digest` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 9 | `/api/cron/content_stale_check` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 10 | `/api/cron/early-warning` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 11 | `/api/cron/end-impersonation-sessions` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 12 | `/api/cron/finalize-expired-attempts` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 13 | `/api/cron/journal-reminders` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 14 | `/api/cron/morning_summary` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 15 | `/api/cron/purge-absence-proofs` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 16 | `/api/cron/purge-import-staging` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 17 | `/api/cron/recap_generate` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 18 | `/api/cron/reminders` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 19 | `/api/cron/rotate-exam-tokens` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 20 | `/api/cron/scheduled-notifications` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 21 | `/api/cron/skill_request_expire` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 22 | `/api/cron/tts_jobs` | `GET`, `POST` | Vercel Cron / Scheduler Internal | `Authorization: Bearer ${CRON_SECRET}` via perbandingan waktu-konstan (`crypto.timingSafeEqual`) | **AMAN**: 401 jika token salah / tidak disetel |
| 23 | `/api/export/laporan-akademik` | `GET` | `ACADEMIC_STAFF`, `PROGRAM_COORDINATOR`, `SUPER_ADMIN` | Sesi server via `getCurrentUserWithRoles()` + pengecekan role `ALLOWED_EXPORT_ROLES` | **AMAN**: 401 jika anonim, 403 jika role tidak sesuai |
| 24 | `/api/pdf/kartu-ujian` | `GET` | Mahasiswa bersangkutan / Staf / Dosen / Admin | Verifikasi otentikasi & proteksi anti-IDOR via `authorizeAcademicStudentAccess(mahasiswaId)` | **AMAN**: 401 jika anonim, 403 jika IDOR |
| 25 | `/api/pdf/khs` | `GET` | Mahasiswa bersangkutan / Staf / Dosen / Admin | Verifikasi otentikasi & proteksi anti-IDOR via `authorizeAcademicStudentAccess(mahasiswaId)` | **AMAN**: 401 jika anonim, 403 jika IDOR |
| 26 | `/api/pdf/surat` | `GET` | Mahasiswa pemohon / Staf / Admin | Verifikasi otentikasi & proteksi anti-IDOR via `authorizeSuratAccess(surat)` | **AMAN**: 401 jika anonim, 403 jika IDOR |
| 27 | `/api/pdf/transkrip` | `GET` | Mahasiswa bersangkutan / Staf / Dosen / Admin | Verifikasi otentikasi & proteksi anti-IDOR via `authorizeAcademicStudentAccess(mahasiswaId)` | **AMAN**: 401 jika anonim, 403 jika IDOR |
| 28 | `/api/smoke-actions` | `GET` | Khusus Internal Non-Production | Selalu mengembalikan `404 Not Found` pada `NODE_ENV === 'production'` secara fail-closed | **AMAN**: Tertutup mutlak di production |
| 29 | `/api/storage/file` | `GET` | Sesi Pengunduh Internal Dev | Buffer simulasi lokal dev (`ambilSimulatedBerkas`); di cloud production berkas dilayani signed URL | **AMAN**: Mengembalikan 404 jika berkas tidak di memori |

---

## 2. Rincian Penguatan Keamanan Fase 1

1. **Pencabutan Hardcoded Credentials & Bypasses**:
   - Seluruh sandi literal (`'wahyu11'`, `'Password123!'`, `'DemoSiajar2026Secure!'`, `'Admin123!'`) telah dihapus total dari `src/modules/identity/actions.ts`.
   - Gerbang autentikasi mode demo dikembalikan secara ketat: `allowDemo = !isProd || process.env.ALLOW_DEMO_AUTH === 'true'`.
   - Tidak ada lagi pelewatan berbasis identifier (`isSuperAdminByIdentifier`, `isSuperAdminUser`, `20120009`, atau UUID `a0000010-...`).
   - Di `src/lib/auth/session.ts`, fallback `userId: "usr-superadmin"` dan role default `ADMIN` tanpa sesi valid telah dihapus. Sesi yang tidak valid di production selalu menghasilkan `null`.

2. **Perbandingan Waktu-Konstan (Timing-Attack Resistant) pada Cron**:
   - Fungsi `isAuthorizedCronRequest` di `src/lib/cron/auth.ts` kini menggunakan `crypto.timingSafeEqual` untuk mencegah kebocoran informasi melalui serangan analisis waktu (*timing attacks*).

3. **Provisioning Super Admin yang Sah**:
   - Skrip `scripts/create-superadmin.ts` dibuat untuk inisialisasi akun Super Admin secara sah di Supabase Auth & DB menggunakan `SUPABASE_SERVICE_ROLE_KEY`.
   - Memvalidasi panjang sandi minimal 14 karakter dan mencatat peristiwa ke `audit_logs`.

---

## 3. Tindak Lanjut Manual Wajib untuk Pemilik Repositori

> [!CAUTION]
> Tindakan-tindakan berikut **hanya boleh dilakukan oleh pemilik repositori** dengan akses administratif langsung dan tidak dijalankan secara otomatis oleh asisten:

1. **Rotasi Seluruh Kunci Rahasia & Kata Sandi (Credential Rotation)**:
   - Karena sandi `'wahyu11'` dan `'Password123!'` pernah terkomit ke riwayat git di commit terdahulu (`9d2a590`), sandi tersebut dianggap **sudah terkompromi**.
   - Jika akun admin di Supabase production (`superadmin@...`) menggunakan sandi tersebut, segera perbarui melalui dashboard Supabase Auth atau jalankan `npx tsx scripts/create-superadmin.ts` dengan `SUPERADMIN_PASSWORD` baru yang kuat (minimal 14 karakter acak).
   - Pastikan `APP_SECRET`, `SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, dan `CRON_SECRET` di Vercel Environment Variables di-generate ulang jika pernah dibagikan atau tersimpan di tempat tidak aman.

2. **Pembersihan Riwayat Git (Git History Scrubbing)**:
   - Pertimbangkan untuk membersihkan commit `9d2a590` dari riwayat git menggunakan `git-filter-repo` atau BFG Repo-Cleaner jika repositori ini akan dipublikasikan ke publik.

3. **Visibilitas Repositori (Private Repository)**:
   - Pastikan repositori GitHub tetap dalam status **Private** sampai seluruh siklus audit keamanan selesai dan semua rahasia lama telah dirotasi.
