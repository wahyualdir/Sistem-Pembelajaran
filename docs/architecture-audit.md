# AUDIT ARSITEKTUR & STACK SIAJAR (SISTEM AKADEMIK + LMS)
**Dokumen Audit Arsitektur Sistem, Model Data, Otorisasi RBAC, dan Roadmap Implementasi**  
*Tanggal: 7 Oktober 2026*  
*Cabang: `feat/redesain-dan-ai-agent`*

---

## 1. PEMETAAN STACK TEKNOLOGI

Berdasarkan pemeriksaan langsung pada `package.json`, konfigurasi proyek, dan runtime:

| Lapisan | Teknologi | Versi | Catatan & Konvensi |
|---|---|---|---|
| **Framework Web** | Next.js (App Router) | 14.2.13 | Server Components, Server Actions (`use server`), Route Handlers |
| **Runtime & Bahasa** | React & TypeScript | React 18.3.1, TS 5.6.2 | Strict mode aktif, non-destructive backwards-compatible typing |
| **Styling & CSS** | Tailwind CSS & PostCSS | Tailwind 3.4.13, PostCSS 8.4.47 | Neo-brutalist / Classic Mac OS design tokens, `tailwindcss-animate` |
| **Primitif UI** | Radix UI | Radix UI Primitives | Dialog, Dropdown, Tabs, Avatar, Tooltip, Checkbox, Select |
| **Ikon** | Lucide React | 0.446.0 | Outline icons (`h-4`, `h-5`, `h-6`) |
| **Database & ORM** | Prisma ORM & Supabase Postgres | Prisma 5.20.0, Postgres | Prisma Client (`@prisma/client`), Supabase Server Client (`@supabase/ssr`) |
| **Autentikasi & Sesi** | Multi-Layer Auth | Supabase Auth + Cookie Demo Session | Dukungan demo login instant & kredensial password hash |
| **Olah Dokumen & Data** | TanStack Table, Recharts, ExcelJS, PapaParse, React-PDF | TanStack 8.20.5, Recharts 2.12.7, ExcelJS 4.4.0 | Ekspor rekap nilai, PDF KHS, chart tren IPS |
| **Pengujian (Testing)** | Vitest & Playwright | Vitest 2.1.1, Playwright | Unit & integration test via `npm test`, E2E test via `npm run test:e2e` |

---

## 2. SISTEM PERAN (ROLE) & HAK AKSES (RBAC)

### 2.1 Tujuh Peran (7 Roles) Utama SIAJAR

Sesuai spesifikasi Bagian 4:

1. **Super Admin (`SUPER_ADMIN` / `SUPERADMIN`)**
   - Akses penuh ke seluruh sistem dan manajemen global.
   - Fitur spesifik: Kelola Pengguna, Role & Permission, Impersonate (dengan audit trail otomatis), Kebijakan Akademik, Privasi & Retensi Data, Dashboard Universitas.
2. **System Admin (`SYSTEM_ADMIN`)**
   - Fokus teknis platform tanpa akses ke konten perkuliahan atau nilai.
   - Fitur spesifik: Status Server, Antrean Sandbox Coding, Realtime/WebSocket, Log Error, Konfigurasi Integrasi (Peta, API Key, SSO), Rate Limiting, Audit Log.
3. **Koordinator Prodi / Kaprodi (`PROGRAM_COORDINATOR`)**
   - Manajemen mutu, kurikulum, dan pengawasan di tingkat program studi.
   - Fitur spesifik: Kurikulum & CPL, Penugasan Dosen, Monitoring Kelas Prodi, Persetujuan Perubahan Nilai, Evaluasi Dosen. Sedia role switcher langsung ke Dosen.
4. **Staf Akademik (`ACADEMIC_STAFF`)**
   - Tata usaha akademik, data master, dan penjadwalan.
   - Fitur spesifik: Data Master Mahasiswa/Dosen/Ruang, Penjadwalan Kuliah & Ujian, Enroll Peserta, Verifikasi Berkas, Rekap Presensi/Nilai.
5. **Dosen Pengampu (`LECTURER`)**
   - Manajemen perkuliahan, pembelajaran, ujian, dan presensi kelas diampu.
   - Fitur spesifik: Kelas Diampu, Konten Materi, Tugas, Bank Soal, Ujian & Panel Live, Sesi Presensi (QR/Lokasi), BAP, Penilaian Akhir.
6. **Mahasiswa (`STUDENT`)**
   - Peserta aktif kegiatan perkuliahan dan akademik.
   - Fitur spesifik: Beranda & Kalender, Kelas Saya (Materi, Tugas, Ujian, Presensi), Riwayat Nilai & Progres, Portofolio.
7. **Mahasiswa + Asisten (`STUDENT` + `TEACHING_ASSISTANT`)**
   - Akun mahasiswa yang ditugaskan sebagai asisten pada kelas tertentu.
   - Hak asisten berlaku **per kelas** (scoped), bukan global.
   - Fitur spesifik: Kategori khusus **MODE ASISTEN** (Kelas Diasistensi, Bantu Presensi, Koreksi Tugas draf, Jawab Forum, Pantau Ujian).
   - *Batasan ketat*: Asisten tidak boleh menilai diri sendiri, tidak boleh melihat nilai kelas lain, dan nilai koreksinya berstatus draf menunggu pengesahan dosen.

### 2.2 Mekanisme Multi-Role & Role Switcher

- Akun dengan lebih dari satu peran dapat berganti konteks peran kapan saja melalui:
  1. Halaman pemilih peran `/workspace`.
  2. Tombol dropdown pill peran di bagian bawah sidebar pada `PortalShell`.
- Role aktif disimpan di cookie `active_role` dan diverifikasi di `src/middleware.ts`.
- Server Action `switchWorkspaceAction(roleCode)` bertugas memvalidasi bahwa peran yang diminta benar-benar dimiliki pengguna sebelum memperbarui cookie dan mengarahkan ke portal yang bersesuaian.

---

## 3. STATUS MODUL PEMBELAJARAN (LMS) SAAT INI

| Modul | Status Saat Ini di Kodebase | Target Penambahan / Keselarasan |
|---|---|---|
| **Hub Kelas (`/classes/[id]`)** | Sudah ada halaman dengan section (Pengumuman, Materi, Tugas, Diskusi, Anggota, Asisten) | Refaktor menjadi model **Tab Terpadu** (Ringkasan, Materi, Tugas, Ujian & Kuis, Presensi, Diskusi, Nilai, Peserta, Pengumuman, Berkas) sesuai Bagian 5 prompt. |
| **Ujian & Kuis** | Sederhana (`CreateQuizModal`, `TakeQuizModal`, pilihan ganda & essay dasar) | Transformasi menjadi Modul Ujian Lengkap (Pilihan ganda, Benar/Salah, Isian, Menjodohkan, Live Coding terisolasi, Bank Soal, Panel Live Dosen dengan deteksi tab-switch, batas waktu server, autosave). |
| **Presensi Kehadiran** | Sesi manual dasar dengan kode angka | Dukungan 3 metode presensi terpadu: **QR Dinamis** (refresh 20-30 detik), **Biometrik WebAuthn**, **Lokasi GPS** (perhitungan Haversine di server dengan fallback Leaflet/OSM). |
| **Notifikasi** | Model database lengkap, popover notifikasi di topbar, in-app actions | Pemicu otomatis lintas modul: tugas mendekati tenggat, presensi dibuka, kuis dimulai, pelanggaran ujian ke dosen. |
| **Tanya AI SIAJAR** | Komponen melayang sudah aktif di seluruh halaman | Penambahan konteks berbasis modul kelas, peringatan tenggat proaktif, dan bantuan pembuatan soal kuis bagi dosen. |
| **Menu Non-LMS (SIAKAD Lama)** | Tersedia lengkap di rute `(dashboard)` | Dipertahankan 100% utuh tanpa penghapusan rute maupun data, dikontrol secara elegan lewat feature flag `FEATURES.siakadLegacy`. |

---

## 4. MODEL DATA & STATUS MIGRASI

Aplikasi memiliki dua sumber definisi skema data yang saling melengkapi:

1. **Prisma ORM (`prisma/schema.prisma`)**:
   - Berisi entitas inti SIAKAD: `Pengguna`, `Mahasiswa`, `Dosen`, `ProgramStudi`, `MataKuliah`, `TahunAjaran`, `Ruang`, `Kelas`, `JadwalKuliah`, `KRS`, `KRSDetail`, `KomponenNilai`, `Nilai`, `Pertemuan`, `Presensi`, `Materi`, `Tugas`, `PengumpulanTugas`, `Tagihan`, `Ujian`, `Pengumuman`, `KalenderAkademik`, `LogAudit`, `Notifikasi`, `PerangkatLogin`.
2. **Supabase SQL Migrations (`supabase/migrations/`)**:
   - Berisi skema keamanan tingkat tinggi: `profiles`, `user_roles`, `class_assistants`, `materials`, `assignments`, `submissions`, `grades`, `discussions`, `attendance_sessions`, `audit_logs`, serta fungsi RLS helper (SECURITY DEFINER).

Semua migrasi baru akan bersifat **aditif (non-destruktif)** sesuai aturan Bagian 9 prompt.

---

## 5. STATUS PENGUJIAN (TEST SUITE)

- Framework: **Vitest 2.1.1**
- Hasil eksekusi `npm test`:
  - Total file test: 15 file test suite.
  - 14 file passed, 115 tests passed.
  - Catatan minor: 1 kegagalan kecil pada `tests/nav-roles.test.ts` (mencari label `'Kelas Asistensi (LMS)'` sementara label di `portal-nav.tsx` tertulis `'Kelas Asistensi'`). Akan diselaraskan pada Fase 1-2.

---

## 6. RENCANA KERJA PER FASE (ROADMAP FASE 1 - 8)

| Fase | Target Utama | Rincian Deliverable |
|---|---|---|
| **Fase 0** | Audit Desain & Arsitektur | Penyusunan `docs/design-audit.md` & `docs/architecture-audit.md` *(Selesai)*. |
| **Fase 1** | Role, Permission, Role Switcher | Pemisahan peran 7 aktor, penegakan RBAC di server action & middleware, sinkronisasi `switchWorkspaceAction`, seed data 7 role. |
| **Fase 2** | Sidebar Dinamis & Routing | Konfigurasi menu data-driven per role di `portal-nav.tsx`, rute portal per aktor, isolasi akses menu asing, penyembunyian SIAKAD legacy via flag aman. |
| **Fase 3** | Hub Kelas Berbasis Tab | Halaman kelas `/classes/[id]` berformat tab lengkap: Ringkasan, Materi, Tugas, Ujian, Presensi, Diskusi, Nilai, Peserta, Pengumuman, Berkas. Panel kanan bergaya retro dot-grid. |
| **Fase 4** | Modul Ujian & Kuis Lengkap | Bank soal, ragam jenis soal (termasuk live coding mock runner), autosave & server timer, Panel Live Dosen dengan feed event real-time & deteksi pindah tab. |
| **Fase 5** | Modul Presensi Terpadu | Buka sesi presensi dosen, QR dinamis berganti berkala, presensi lokasi (Haversine server-side) dengan peta ber-theme retro, biometrik WebAuthn, rekap kehadiran. |
| **Fase 6** | Fitur Lintas Modul | Pemicu notifikasi in-app, integrasi Tanya AI SIAJAR kontekstual kelas, pencarian global terpadu, transparansi data & retensi. |
| **Fase 7** | Portal Manajemen | Portal Kaprodi (monitoring prodi, kurikulum, persetujuan nilai), Portal Staf Akademik (master data, jadwal), Portal System Admin (server status, audit log), Portal Super Admin (kelola user, impersonate). |
| **Fase 8** | QA Akhir, Design Parity Review & Laporan | Menjalankan seluruh test suite Vitest, verifikasi kepatuhan checklist desain neo-brutalist pada setiap halaman baru, pelaporan akhir. |
