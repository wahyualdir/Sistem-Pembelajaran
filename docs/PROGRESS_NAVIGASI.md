# PROGRESS PERBAIKAN NAVIGASI MENU SIAJAR

Dokumen pelacakan progres perbaikan navigasi menu berdasarkan `docs/INSTRUKSI_PERBAIKI_NAVIGASI.md`.

---

## Informasi Baseline (Fase 0)

- **Branch Asal**: `fitur/peran-baru`
- **Tag Pengaman**: `sebelum-fix-navigasi` (`d5d9a18a2d5aa8a90c22f78beda489fffb85f8b5`)
- **Branch Kerja**: `fix/navigasi-menu`
- **Tanggal Mulai**: 30 Oktober 2026
- **Tanggal Selesai**: 31 Oktober 2026

### Hasil Pengujian Baseline
| Pemeriksaan | Perintah | Status | Detail |
| --- | --- | --- | --- |
| Prisma Client | `npx prisma generate` | ✅ PASS | Generated v5.22.0 |
| Typecheck | `npm run typecheck` | ✅ PASS | `tsc --noEmit` 0 errors |
| Lint | `npm run lint` | ✅ PASS | `next lint` 0 warnings / errors |
| Unit Tests | `npm test` | ✅ PASS | 84 test files, 737 tests passed |
| Menu Audit | `npm run audit:menu` | ✅ PASS | 149 menu BERFUNGSI, 0 RUSAK |
| Utang Tipe (`any`) | `git grep -E ": any\b\|as any\b"` | 660 baris | Baseline tercatat 660 |

---

## Tabel Pelacakan Fase

| Fase | Sub-langkah | Status | Commit SHA | Deskripsi Singkat |
| --- | --- | --- | --- | --- |
| **Fase 0** | Baseline & Safety Tag | Selesai | `254c404` | chore(nav): baseline dan catatan progres |
| **Fase 1** | 1a. Tes Kontrak Redirect | Selesai | `eac6885` | test(nav): kunci perilaku keputusan redirect middleware |
| | 1b. Tes E2E Klik Sidebar | Selesai | `16cc8fb` | test(nav): e2e klik sidebar semua peran |
| | 1c. Logging Diagnostik | Selesai | `753a4c3` | chore(nav): pasang logging diagnostik navDebug |
| | 1d. Laporan Bukti Hipotesis | Selesai | `0d163c0` | Dokumentasi bukti H1-H4 & loop PortalShell |
| **Fase 2** | 2.1 Single Source of Truth Role | Selesai | `bbdd2b0` | `normalizeRoleCode` menyeluruh |
| | 2.2 Stop Silent Fallback STUDENT | Selesai | `438afc1` | `getCurrentUserResolution` & layout portal & fix loop PortalShell |
| | 2.3 Sinkronisasi Middleware & Guard | Selesai | `0fb8d1a` | Boundary prefix & handling cookie mismatch |
| | 2.4 Health Check Supabase Resilient | Selesai | `a311e01` | Timeout 3000ms & cache error 5s |
| | 2.5 Cegah Loop Login <-> Beranda | Selesai | `c1e9685` | Parameter `?alasan=` di middleware & layout |
| | 2.6 Rapikan Guard Halaman (Opsional)| Ditunda | - | Sesuai instruksi: ditunda demi batasan perubahan |
| **Fase 3** | Verifikasi Menyeluruh & Perbaikan | Selesai | `39e9ea4`, `cae8721` | Build lolos 166 halaman, vitest 86/86 (757 tests), lint 0 error, E2E menu 124/124 OK (7 peran) |
| **Fase 4** | Dokumentasi & Penutupan | Selesai | *HEAD* | Runbook diagnosa navigasi, daftar bug lengkap, ringkasan final 7 poin |

---

## Hasil Verifikasi Akhir (Fase 3)

| Pengecekan | Metrik Baseline | Metrik Akhir | Status | Detail |
| :--- | :--- | :--- | :--- | :--- |
| **Utang Tipe (`any`)** | 660 | **659** | ✅ LULUS | Berkurang 1 baris (659), tidak ada `any` baru |
| **Validitas Tipe (TypeScript)** | 0 error | **0 error** | ✅ LULUS | `tsc --noEmit` 0 errors |
| **ESLint** | 0 warning / error | **0 warning / error** | ✅ LULUS | `✔ No ESLint warnings or errors` |
| **Unit Tests (Vitest)** | 737 lulus (84 files) | **757 lulus (86 files)** | ✅ LULUS | 100% lulus (+20 tests baru: user resolution & redirect contract) |
| **Audit Menu Otomatis** | 149 BERFUNGSI, 0 RUSAK | **149 BERFUNGSI, 0 RUSAK** | ✅ LULUS | 149 BERFUNGSI, 0 SEBAGIAN, 0 TIRUAN, 0 RUSAK |
| **Next.js Production Build** | - | **Kompilasi Sukses (0)** | ✅ LULUS | 166 halaman terkompilasi, middleware 93.9 kB |
| **E2E Sidebar Click Test** | Freeze / Bouncing | **100% Lulus (124/124 OK)** | ✅ LULUS | 124 menu pada 7 peran (STUDENT, TA, LECTURER, COORDINATOR, STAFF, SYSADMIN, SUPERADMIN) 0 BUG |

---

## Bukti Fase 1 & Temuan Akar Masalah

### 1. Bukti Pengujian Navigasi Klik Sidebar (E2E)
Hasil awal sebelum perbaikan dependensi rendering:
- Seluruh tautan menu sidebar terpental/tertahan di beranda (`TERPENTAL-KE-BERANDA (BUG)`).
- Log Browser Console menangkap akar masalah rendering klien:
  ```text
  [BROWSER CONSOLE] error Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
      at PortalShell (webpack-internal:///(app-pages-browser)/./src/app/(portal)/portal-shell.tsx:56:11)
  ```
  **Akar penyebab**: `navGroups` tidak di-memoize dengan `useMemo`, dan dimasukkan ke dalam dependency array `useEffect` yang memanggil `setCollapsedGroups`. Ketika navigasi diinisiasi, re-render `PortalShell` memicu loop `setState` tak hingga, membatalkan transisi router Next.js dan menahan pengguna di beranda.

### 2. Status Verifikasi Hipotesis
| Hipotesis | Status | Bukti / Catatan |
| --- | --- | --- |
| **H1**: Query `user_roles` gagal -> jatuh ke `STUDENT` | **TERBUKTI & DIPERBAIKI** | Terbukti di kode `src/modules/identity/current-user.ts`: `rolesRes.error` diabaikan, dan `allowedRoleCodes[0] \|\| 'STUDENT'` diam-diam mengubah role pengguna menjadi `STUDENT`. Diperbaiki dengan `getCurrentUserResolution()`. |
| **H2**: Cookie `active_role` mismatch / variasi SUPERADMIN | **TERBUKTI & DIPERBAIKI** | Terbukti di `tests/nav-redirect-contract.test.ts`: variasi huruf besar/kecil tidak cocok. Diperbaiki dengan `normalizeRoleCode()` dan pengalihan ke `/workspace?alasan=peran-tidak-cocok`. |
| **H3**: Cek kesehatan Supabase timeout 1000ms & cache error 30s | **TERBUKTI & DIPERBAIKI** | Terbukti di `src/lib/supabase/status.ts`: batas waktu remote dinaikkan ke 3000ms dan kegagalan di-cache maksimal 5s. |
| **H4**: Prefix matching tanpa batas segmen (`/tasks` vs `/ta`) | **TERBUKTI & DIPERBAIKI** | Terbukti di `tests/nav-redirect-contract.test.ts`: `startsWith('/ta')` salah mengenali `/tasks`. Diperbaiki dengan `matchesPrefix()`. |
| **H-BARU**: Re-render loop di `PortalShell` membatalkan navigasi klien | **TERBUKTI & DIPERBAIKI** | Diperbaiki dengan `useMemo` pada `navGroups` dan stabilisasi dependensi `useEffect` di `portal-shell.tsx`. |
| **H-AUTH**: Hanging Supabase Query & Postgres 22P02 pada Akun Demo | **TERBUKTI & DIPERBAIKI** | Diperbaiki dengan `withTimeout(promise, 2500)` dan proteksi kueri UUID untuk sesi demo di `actions.ts` dan `current-user.ts`. |
| **H-RSC**: Ekspor Client Component ke Server Component (`/ta/classes`) | **TERBUKTI & DIPERBAIKI** | Terbukti `TypeError: getClassroomBannerTheme is not a function` pada `/ta/classes`. Diperbaiki dengan ekstraksi fungsi murni ke `src/modules/academic/classroom-banner-themes.ts`. |
| **H-ACCORDION**: Inversi boolean grup `defaultCollapsed: true` di Sidebar | **TERBUKTI & DIPERBAIKI** | Terbukti grup 'Akun' (`shared-akun`) tetap tertutup karena `prev[groupId]` bernilai `undefined`. Diperbaiki dengan mengevaluasi `defaultCollapsed` pada `toggleGroupCollapse`. |

---

## 8. Penutupan Catatan Audit dan Uji Peran Baru

**Tanggal**: 1 November 2026  
**Branch**: `fix/navigasi-menu`  
**Tag Baseline**: `sebelum-penutupan-catatan`

### Baseline Awal
- `git status`: clean
- `git grep -nE ": any\b|as any\b" -- src | Measure-Object -Line`: 659 baris (terjaga)
- `npm run typecheck`: Lolos (0 error)
- `npm run lint`: Lolos (0 warning / error)
- `npm test`: 87 file lolos (762 unit tests passing)
- `npm run audit:menu`: 149 BERFUNGSI (0 broken, 0 tiruan di luar baseline)

### Log Eksekusi & Commit Penutupan Catatan
1. `076be99` — `docs(audit): simpan instruksi penutupan catatan audit dan uji peran baru`
2. `fb1152c` — `chore(nav): audit statis guard halaman untuk peran baru` (`scripts/audit-role-guards.ts`, `docs/AUDIT_GUARD_PERAN_BARU.md`: 25 DIIZINKAN, 0 DITOLAK-SALAH)
3. `58bd718` — `test(nav): tes klik peran sekretaris prodi dan kepala lab` (`tests/nav-new-roles.test.ts`, pembaruan `demo-prod-gating.test.ts`, integrasi 9 peran di `menu-click-navigation.spec.ts` dan `menu-click-strict.spec.ts`)
4. `3027ce7` — `fix(nav): normalisasi peran baru dan cegah fallback diam-diam ke beranda mahasiswa` (`menu-config.ts`, `route-guard.ts`, `workspace/page.tsx`)
5. `1c2b9b0` — `fix(security): fail-closed untuk superadmin demo tanpa env` (eliminasi retry sandi demo di production pada `actions.ts`, pembersihan string sandi lama dari working tree hingga 0)
6. `979dda3` — `fix(security): panel dan sandi demo hanya di non-production` (`login-dev-mode.tsx`, `login/page.tsx`, `.env.example`, `login-redesign.test.tsx`)
7. `3f96bde` — `ci: sediakan env demo untuk tes e2e` (`.github/workflows/ci.yml` job-level demo env)


