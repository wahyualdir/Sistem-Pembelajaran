# Laporan Progres Pengerjaan Fitur Peta Pulau SIAJAR

Dokumen ini memantau implementasi fitur Peta Pulau secara transparan, berbasis bukti eksekusi tes aktual, dan mengikuti kaidah **fail-closed** sesuai `docs/INSTRUKSI_PETA_PULAU.md`.

- **Cabang Aktif**: `fitur-peta-pulau`
- **Rangkaian Komit**:
  - `36524d1` (`feat(peta-pulau): selesaikan fase p0 fondasi, navigasi 107 menu, dan migrasi skema`)
  - `2188563` (`feat(peta-pulau): implementasikan tahap 1 visualisasi peta, tab bab, progres kelas, dan prioritas hari ini`)
  - `91a6fad` (`feat(peta-pulau): implementasikan tahap 2 flashcard leitner, tinjau ai, dan podcast materi`)
  - `56b1e8e` (`feat(peta-pulau): implementasikan tahap 3 tukar keahlian, rekap semester, dan laporan kaprodi dengan k-anonymity`)
- **Status Akhir Basis Kode**: Fase P0 sampai Tahap 3 telah terpasang lengkap di cabang `fitur-peta-pulau`.
- **Aturan Pelaporan**: Tidak ada klaim "100% selesai". Seluruh unit test murni telah dieksekusi dan lolos 100%. Uji pgTAP dan Playwright dicatat secara jujur sebagai "belum dijalankan di host ini" karena ketiadaan daemon Docker lokal.

---

## 1. Matriks Status Fitur per Tahap

| Fase / Tahap | Fitur / Komponen | Status | Tes Pembukti | Status Verifikasi | Catatan & Batasan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0: Audit & Menu** | Audit Skema & Komponen | Selesai | `docs/AUDIT_PETA_PULAU.md` | Terverifikasi | Pemetaan 12 entitas tabel, helper RLS, dan modul AI. |
| **P0: Navigasi** | Penyesuaian 107 Menu | Selesai | `tests/nav-roles.test.ts` (18 tes) | Lolos (100%) | Mengunci 107 menu di 7 peran (+2 Mhs, +2 TA, +1 Dosen). |
| **P0: Fondasi DB** | Penanda Fitur Kelas (`class_feature_flags`) | Selesai | `20261018000029_peta_pulau_p0_foundation.sql` | Siap Terap | Sakelar per kelas + fungsi `feature_enabled`. |
| **P0: Fondasi DB** | Pengait Bab (`chapter_id` & `topic_id`) | Selesai | `20261018000029_peta_pulau_p0_foundation.sql` | Siap Terap | Nullable pada `materials`, `quizzes`, `assignments`. |
| **P0: Fondasi DB** | Log Aktivitas & Privasi (`activity_events`) | Selesai | `src/tests/unit/peta-pulau/p0-foundation.test.ts` (19 tes) | Lolos (100%) | Whitelist kejadian, isolasi total dari dosen/admin. |
| **P0: Notifikasi & Kebijakan** | 20 Kunci Kebijakan & 6 Jenis Notifikasi | Selesai | `src/tests/unit/peta-pulau/p0-foundation.test.ts` | Lolos (100%) | Ringkasan pagi, pulau terbuka, bantuan teman sekelas. |
| **Tahap 1: Inti** | Peta Visual (SVG) & Tampilan Daftar | Selesai | `src/components/peta-pulau/class-island-map.tsx` | Terpasang | Peta SVG responsif + sakelar Daftar untuk pembaca layar. |
| **Tahap 1: Inti** | Tab Bab & Pengaturan Fitur Dosen | Selesai | `class-chapters-tab.tsx`, `class-feature-settings-tab.tsx` | Terpasang | Ambang batas kelulusan (bawaan 70), buka manual mahasiswa. |
| **Tahap 1: Inti** | Kekuatan Topik & Kuis Bab | Selesai | `src/tests/unit/peta-pulau/tahap1-core.test.ts` (28 tes) | Lolos (100%) | Level `belum_cukup_data`, `perlu_latihan`, `cukup`, `kuat`. |
| **Tahap 1: Inti** | Prioritas Hari Ini | Selesai | `src/tests/unit/peta-pulau/tahap1-core.test.ts` | Lolos (100%) | Perhitungan skor transparan tanpa AI, zona WIB, max 5 butir. |
| **Tahap 1: Inti** | Progres Kelas & Tab Tenggat Kalender | Selesai | `class-progress-tab.tsx`, `calendar-view-switcher.tsx` | Terpasang | Sebaran per bab, topik tersulit (ambang >= 5), tab Tenggat. |
| **Tahap 2: Konten** | Kotak Leitner Flashcard (5 Kotak) | Selesai | `src/tests/unit/peta-pulau/tahap2-content.test.ts` (15 tes) | Lolos (100%) | Interval 1, 2, 4, 8, 16 hari WIB, batas 20 kartu baru/hari. |
| **Tahap 2: Konten** | Tinjau Konten Dosen (`/lecturer/content-review`) | Selesai | `src/app/(portal)/lecturer/content-review` | Terpasang | Grounding score, draf kartu, naskah podcast, tombol A/E/R/J/K. |
| **Tahap 2: Konten** | Podcast Bab (Audio & Transkrip) | Selesai | `src/modules/academic/podcast-actions.ts` | Terpasang | Validator naskah 450-900 kata, fail-closed tanpa kunci TTS. |
| **Tahap 2: Konten** | Evaluasi Suara TTS | Selesai | `scripts/sampel-suara.ts`, `docs/EVALUASI_SUARA.md` | Terpasang | Skrip pembuat sampel suara dan lembar penilaian manusia. |
| **Tahap 3: Sosial** | Tukar Keahlian (`/skill-exchange`) | Selesai | `src/tests/unit/peta-pulau/tahap3-social.test.ts` (8 tes) | Lolos (100%) | Tanya jawab terstruktur, anti-URL eksternal, blackout ujian. |
| **Tahap 3: Sosial** | Batas Poin Bantuan Teman | Selesai | `src/tests/unit/peta-pulau/tahap3-social.test.ts` | Lolos (100%) | +50 XP per jawaban terbantu, batas harian 3x per pembantu. |
| **Tahap 3: Rekap** | Rekap Semester Pribadi | Selesai | `src/modules/academic/achievements-view.tsx` | Terpasang | Format retro-brutalist, lencana kebiasaan, tanpa peringkat. |
| **Tahap 3: Laporan** | Laporan Adopsi Kaprodi (K-Anonymity) | Selesai | `coordinator-reports-hub-view.tsx`, `kaprodi-report-actions.ts` | Terpasang | Tab Adopsi Peta Pulau, masking `< 5 (Privasi Terjaga)`. |
| **Dokumentasi** | Spesifikasi Menu & Dokumen Turunan | Selesai | `scripts/generate_feature_menu_documents.py` | Terverifikasi | Sinkronisasi 107 menu ke PDF, XLSX, CSV, HTML, Markdown. |
| **Dokumentasi** | Panduan Operasional Runbook | Selesai | `docs/RUNBOOK.md` (Bagian 6) | Terverifikasi | Batas AI, konfigurasi suara, 3 cron jobs, kill-switches. |
| **Dokumentasi** | Kebijakan Privasi Data Aktivitas | Selesai | `docs/PRIVASI_DATA_AKTIVITAS.md` | Terverifikasi | Whitelist data, retensi 365 hari, hak opt-out/hapus, non-penalti. |
| **Dokumentasi** | Panduan Bantuan Multi-Peran | Selesai | `src/app/(portal)/help/page.tsx` | Terverifikasi | Alur Peta, Flashcard, Tukar Keahlian, Tinjau Konten per peran. |

---

## 2. Bukti Eksekusi Pengujian Aktual

### 2.1. Pemeriksaan Tipe Data TypeScript (`npx tsc --noEmit`)
```text
Exit Code: 0 (Zero Errors)
Status: Seluruh komponen UI, server action, modul fungsional, dan tipe data terverifikasi valid tanpa galat kompilasi.
```

### 2.2. Uji Unit Fungsional Vitest (`npx vitest run src/tests/unit/peta-pulau/ tests/nav-roles.test.ts`)
```text
Test Files  5 passed (5)
     Tests  88 passed (88)

 ✓ src/tests/unit/peta-pulau/p0-foundation.test.ts (19 tests)
 ✓ src/tests/unit/peta-pulau/tahap1-core.test.ts (28 tests)
 ✓ tests/nav-roles.test.ts (18 tests) - 107 menu terverifikasi bebas kata terlarang
 ✓ src/tests/unit/peta-pulau/tahap2-content.test.ts (15 tests)
 ✓ src/tests/unit/peta-pulau/tahap3-social.test.ts (8 tests)

Duration: 8.07s
Result: 100% Lulus (88/88 tests passed)
```

### 2.3. Uji Kebijakan RLS PostgreSQL (pgTAP)
- Berkas Uji:
  - `supabase/tests/database/09_peta_pulau_p0.test.sql`
  - `supabase/tests/database/10_peta_pulau_tahap1.test.sql`
  - `supabase/tests/database/11_peta_pulau_tahap2.test.sql`
  - `supabase/tests/database/12_peta_pulau_tahap3.test.sql`
- **Status Eksekusi di Host Ini**: **Belum Dijalankan**
- **Alasan Teknis**: Perintah `supabase test db` membutuhkan layanan Docker daemon aktif di host Windows lokal untuk menjalankan kontainer PostgreSQL pengujian (`127.0.0.1:54322`). Di lingkungan ini, Docker daemon tidak berjalan (`Docker daemon is not running`). Seluruh skenario uji positif dan negatif telah ditulis lengkap dan siap dijalankan pada runner CI/CD yang dilengkapi Docker.

### 2.4. Uji Integrasi Antarmuka (Playwright e2e)
- **Status Eksekusi di Host Ini**: **Belum Dijalankan**
- **Alasan Teknis**: Pengujian Playwright end-to-end membutuhkan server backend basis data Supabase lokal yang hidup bersamaan dengan aplikasi Next.js. Mengingat dependensi Docker lokal tidak aktif, pengujian dialihkan ke pipeline CI/CD staging.

---

## 3. Rangkuman Integritas Arsitektur
1. **Pemisahan Wewenang Ketat**: Mahasiswa tidak dapat membaca kartu berstatus draf, naskah podcast draf, ulasan milik orang lain, atau aktivitas mahasiswa lain.
2. **Kepatuhan Privasi (K-Anonymity & True Decoupling)**: Data aktivitas bersifat pribadi, rekap semester tanpa perbandingan antar-mahasiswa, dan agregasi kelas dengan mahasiswa < 5 disamarkan.
3. **Fail-Closed Tanpa Kunci API**: Jika kunci AI atau penyedia suara tidak terkonfigurasi, tombol dinonaktifkan dengan peringatan yang jelas dan menolak beroperasi menggunakan nilai tebakan.
4. **Kekekalan Jumlah Menu**: Total navigasi terkunci tepat pada 107 menu di 7 peran sesuai spesifikasi baku.
