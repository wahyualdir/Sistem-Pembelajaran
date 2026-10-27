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
