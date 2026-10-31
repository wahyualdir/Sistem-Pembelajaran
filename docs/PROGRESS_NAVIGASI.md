# PROGRESS PERBAIKAN NAVIGASI MENU SIAJAR

Dokumen pelacakan progres perbaikan navigasi menu berdasarkan `docs/INSTRUKSI_PERBAIKI_NAVIGASI.md`.

---

## Informasi Baseline (Fase 0)

- **Branch Asal**: `fitur/peran-baru`
- **Tag Pengaman**: `sebelum-fix-navigasi` (`d5d9a18a2d5aa8a90c22f78beda489fffb85f8b5`)
- **Branch Kerja**: `fix/navigasi-menu`
- **Tanggal Mulai**: 30 Oktober 2026

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
| | 1d. Laporan Bukti Hipotesis | Selesai | pending | Dokumentasi bukti H1-H4 & loop PortalShell |
| **Fase 2** | 2.1 Single Source of Truth Role | Sedang | - | `normalizeRoleCode` menyeluruh |
| | 2.2 Stop Silent Fallback STUDENT | Belum | - | `getCurrentUserResolution` & layout portal |
| | 2.3 Sinkronisasi Middleware & Guard | Belum | - | Boundary prefix & handling cookie mismatch |
| | 2.4 Health Check Supabase Resilient | Belum | - | Timeout 3000ms & cache error 5s |
| | 2.5 Cegah Loop Login <-> Beranda | Belum | - | Parameter `?alasan=` di middleware & layout |
| | 2.6 Rapikan Guard Halaman (Opsional)| Ditunda | - | Sesuai persetujuan pengguna |
| **Fase 3** | Verifikasi Menyeluruh | Belum | - | Semua tes hijau & no regresi |
| **Fase 4** | Dokumentasi & Penutupan | Belum | - | Runbook, daftar bug, progres final |

---

## Bukti Fase 1

### 1. Bukti Pengujian Navigasi Klik Sidebar (E2E)
Hasil awal sebelum perbaikan dependensi rendering pada `STUDENT`:
- Seluruh tautan menu (`/calendar`, `/notifications`, `/announcements`, `/classes`, `/exams`, `/library`, `/ai-assistant`, `/messages`, `/flashcards`, `/skill-exchange`, `/grades`, `/achievements`, `/certificates`, `/community`, `/evaluations`, `/requests`) terpental/tertahan di `/student` (`TERPENTAL-KE-BERANDA (BUG)`).
- Log Browser Console menangkap akar masalah rendering klien:
  ```text
  [BROWSER CONSOLE] error Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
      at PortalShell (webpack-internal:///(app-pages-browser)/./src/app/(portal)/portal-shell.tsx:56:11)
  ```
  Akar penyebab: `navGroups` tidak di-memoize dengan `useMemo`, dan dimasukkan ke dalam dependency array `useEffect` yang memanggil `setCollapsedGroups`. Ketika navigasi diinisiasi, re-render `PortalShell` memicu loop `setState` tak hingga, membatalkan transisi router Next.js dan menahan pengguna di beranda.

### 2. Status Verifikasi Hipotesis
| Hipotesis | Status | Bukti / Catatan |
| --- | --- | --- |
| **H1**: Query `user_roles` gagal -> jatuh ke `STUDENT` | **TERBUKTI** | Terbukti di kode `src/modules/identity/current-user.ts:181-200`: `rolesRes.error` diabaikan, `catch {}` mengabaikan kegagalan DB, dan `allowedRoleCodes[0] \|\| 'STUDENT'` diam-diam mengubah role pengguna menjadi `STUDENT`. |
| **H2**: Cookie `active_role` mismatch / variasi SUPERADMIN | **TERBUKTI** | Terbukti di `tests/nav-redirect-contract.test.ts` kasus laten: variasi `superadmin` tidak cocok dengan `SUPER_ADMIN` karena ketiadaan normalisasi peran di route guard; di `current-user.ts` jika cookie tidak ada di roles DB, jatuh diam-diam ke role pertama atau `STUDENT`. |
| **H3**: Cek kesehatan Supabase timeout 1000ms & cache error 30s | **TERBUKTI** | Terbukti di `src/lib/supabase/status.ts`: timeout 1000ms untuk remote URL dan caching hasil offline selama 30 detik menyebabkan layout mengembalikan sesi `null` dan me-redirect ke login. |
| **H4**: Prefix matching tanpa batas segmen (`/tasks` vs `/ta`) | **TERBUKTI** | Terbukti di `tests/nav-redirect-contract.test.ts`: `startsWith('/ta')` salah mengenali `/tasks` sebagai bagian dari portal `/ta`, sehingga mahasiswa mengakses `/tasks` terpental ke `/student`. |
| **H-BARU**: Re-render loop di `PortalShell` membatalkan navigasi klien | **TERBUKTI** | Terbukti via Playwright browser console log runtime: loop tak hingga `setCollapsedGroups` di `PortalShell` menyebabkan transisi router dibatalkan sehingga menu sidebar tidak pernah berpindah halaman. |

**Kesimpulan Gerbang Fase 1**: Seluruh hipotesis (H1, H2, H3, H4) dan H-BARU **TERBUKTI**. Memenuhi syarat untuk melanjutkan ke **FASE 2 (Perbaikan)**.
