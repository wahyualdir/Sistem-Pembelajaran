# AUDIT STATIS GUARD HALAMAN UNTUK PERAN BARU

**Tanggal**: 2026-11-01
**Peran Diperiksa**: PROGRAM_SECRETARY (13 menu), LAB_HEAD (12 menu)

## Ringkasan Eksekutif

- **DIIZINKAN**: 25 menu
- **DITOLAK-SALAH**: 0 menu
- **TIDAK-PASTI**: 0 menu
- **Total Diperiksa**: 25 menu (25 menu unik per peran)

## Peran: `PROGRAM_SECRETARY`

| Menu (href) | Berkas Halaman (`page.tsx`) | Status | Guard Terdeteksi | Catatan |
| --- | --- | --- | --- | --- |
| `/secretary` | `src/app/(portal)/secretary/page.tsx` | **DIIZINKAN** | redirect('/admin/system'); redirect('/admin'); redirect('/coordinator'); redirect('/lecturer'); redirect('/student'); redirect('/ta'); redirect('/staff'); redirect('/lab'); redirect('/login'); Role checks: SYSTEM_ADMIN, SUPER_ADMIN, PROGRAM_SECRETARY, PROGRAM_COORDINATOR, LECTURER, STUDENT, TEACHING_ASSISTANT, ACADEMIC_STAFF, LAB_HEAD | Guard secara eksplisit mengizinkan peran PROGRAM_SECRETARY |
| `/calendar` | `src/app/(portal)/calendar/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/notifications` | `src/app/(portal)/notifications/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/announcements` | `src/app/(portal)/announcements/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/secretary/monitoring` | `src/app/(portal)/secretary/monitoring/page.tsx` | **DIIZINKAN** | assertServerRole([PROGRAM_SECRETARY]); redirect('/workspace'); Role checks: PROGRAM_SECRETARY | Guard secara eksplisit mengizinkan peran PROGRAM_SECRETARY |
| `/secretary/classes` | `src/app/(portal)/secretary/classes/page.tsx` | **DIIZINKAN** | assertServerRole([PROGRAM_SECRETARY]); redirect('/workspace'); Role checks: PROGRAM_SECRETARY | Guard secara eksplisit mengizinkan peran PROGRAM_SECRETARY |
| `/secretary/advisory` | `src/app/(portal)/secretary/advisory/page.tsx` | **DIIZINKAN** | assertServerRole([PROGRAM_SECRETARY]); redirect('/workspace'); Role checks: PROGRAM_SECRETARY | Guard secara eksplisit mengizinkan peran PROGRAM_SECRETARY |
| `/secretary/requests` | `src/app/(portal)/secretary/requests/page.tsx` | **DIIZINKAN** | assertServerRole([PROGRAM_SECRETARY]); redirect('/workspace'); Role checks: PROGRAM_SECRETARY | Guard secara eksplisit mengizinkan peran PROGRAM_SECRETARY |
| `/secretary/risk` | `src/app/(portal)/secretary/risk/page.tsx` | **DIIZINKAN** | assertServerRole([PROGRAM_SECRETARY]); redirect('/workspace'); Role checks: PROGRAM_SECRETARY | Guard secara eksplisit mengizinkan peran PROGRAM_SECRETARY |
| `/secretary/reports` | `src/app/(portal)/secretary/reports/page.tsx` | **DIIZINKAN** | assertServerRole([PROGRAM_SECRETARY]); redirect('/workspace'); Role checks: PROGRAM_SECRETARY | Guard secara eksplisit mengizinkan peran PROGRAM_SECRETARY |
| `/settings` | `src/app/(portal)/settings/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/help` | `src/app/(portal)/help/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/transparency` | `src/app/(portal)/transparency/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |

## Peran: `LAB_HEAD`

| Menu (href) | Berkas Halaman (`page.tsx`) | Status | Guard Terdeteksi | Catatan |
| --- | --- | --- | --- | --- |
| `/lab` | `src/app/(portal)/lab/page.tsx` | **DIIZINKAN** | assertServerRole([LAB_HEAD]); redirect('/workspace'); Role checks: LAB_HEAD | Guard secara eksplisit mengizinkan peran LAB_HEAD |
| `/calendar` | `src/app/(portal)/calendar/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/notifications` | `src/app/(portal)/notifications/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/announcements` | `src/app/(portal)/announcements/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/lab/profile` | `src/app/(portal)/lab/profile/page.tsx` | **DIIZINKAN** | assertServerRole([LAB_HEAD]); redirect('/workspace'); Role checks: LAB_HEAD | Guard secara eksplisit mengizinkan peran LAB_HEAD |
| `/lab/assistants` | `src/app/(portal)/lab/assistants/page.tsx` | **DIIZINKAN** | assertServerRole([LAB_HEAD]); redirect('/workspace'); Role checks: LAB_HEAD | Guard secara eksplisit mengizinkan peran LAB_HEAD |
| `/lab/classes` | `src/app/(portal)/lab/classes/page.tsx` | **DIIZINKAN** | assertServerRole([LAB_HEAD]); redirect('/workspace'); Role checks: LAB_HEAD | Guard secara eksplisit mengizinkan peran LAB_HEAD |
| `/lab/schedules` | `src/app/(portal)/lab/schedules/page.tsx` | **DIIZINKAN** | assertServerRole([LAB_HEAD]); redirect('/workspace'); Role checks: LAB_HEAD | Guard secara eksplisit mengizinkan peran LAB_HEAD |
| `/lab/recap` | `src/app/(portal)/lab/recap/page.tsx` | **DIIZINKAN** | assertServerRole([LAB_HEAD]); redirect('/workspace'); Role checks: LAB_HEAD | Guard secara eksplisit mengizinkan peran LAB_HEAD |
| `/settings` | `src/app/(portal)/settings/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/help` | `src/app/(portal)/help/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |
| `/transparency` | `src/app/(portal)/transparency/page.tsx` | **DIIZINKAN** | Tidak ada guard peran spesifik | Halaman umum/bersama (akses terbuka untuk semua peran portal) |

