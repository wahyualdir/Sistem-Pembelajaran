# Laporan Progres Pengerjaan Fitur Peta Pulau SIAJAR

Dokumen ini memantau implementasi fitur Peta Pulau secara transparan, berbasis bukti eksekusi tes aktual, dan mengikuti kaidah **fail-closed** sesuai `docs/INSTRUKSI_PETA_PULAU.md`.

- **Cabang Aktif**: `fitur-peta-pulau`
- **Komit Basis**: `3071f74` (`docs: add INSTRUKSI_PETA_PULAU.md specification`)
- **Status Akhir**: Sedang berjalan (Dalam pengerjaan mandiri Fase P0 sampai Tahap 3)
- **Aturan Pelaporan**: Tidak ada klaim "100% selesai". Fitur hanya dinyatakan "selesai" jika memiliki tes verifikasi yang benar-benar dieksekusi dan lolos. Pengujian yang belum dapat dijalankan dicatat sebagai "belum dijalankan" disertai alasan teknis lingkungan.

---

## 1. Matriks Status Fitur

| Fase / Tahap | Fitur / Komponen | Status | Tes Pembukti | Status Verifikasi | Catatan & Batasan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0: Audit & Menu** | Audit Skema & Komponen | Selesai | `docs/AUDIT_PETA_PULAU.md` | Terverifikasi | Pemetaan 12 entitas tabel, helper RLS, dan modul AI. |
| **P0: Navigasi** | Penyesuaian 107 Menu | Selesai | `tests/nav-roles.test.ts` | Belum dijalankan | Menambahkan 5 menu baru (Flashcard, Tukar Keahlian, Tinjau Konten). |
| **P0: Halaman Rute** | Rute & Halaman Sementara | Belum | `tests/peta-pulau-routes.test.ts` | Belum dibuat | `/flashcards`, `/skill-exchange`, `/lecturer/content-review`. |
| **P0: Fondasi DB** | Penanda Fitur Kelas (`class_feature_flags`) | Belum | Migrasi 20261018000029 + pgTAP | Belum dijalankan | Sakelar per kelas + fungsi `feature_enabled`. |
| **P0: Fondasi DB** | Pengait Bab (`chapter_id` & `topic_id`) | Belum | Migrasi 20261018000029 | Belum dijalankan | Nullable pada `materials`, `quizzes`, `assignments`, `quiz_questions`. |
| **P0: Fondasi DB** | Log Aktivitas & Privasi (`activity_events`) | Belum | pgTAP + unit test | Belum dijalankan | `log_activity` fail-closed whitelist, isolasi total dari dosen/admin. |
| **P0: Konfigurasi** | Kebijakan Baru (Lampiran A) | Belum | Migrasi 20261018000029 | Belum dijalankan | 20 kunci kebijakan baru di `institution_policies`. |
| **P0: Notifikasi** | Jenis Notifikasi Baru (Lampiran B) | Belum | Unit test notifikasi | Belum dijalankan | Ringkasan pagi, konten siap, pulau terbuka, bantuan teman. |
| **Tahap 1: Inti** | Bab & Pulau (`class_chapters`, `chapter_progress`) | Belum | Unit test `chapter_state` + pgTAP | Belum dijalankan | Status pulau (terkunci, terbuka, selesai), override, linear prerequisite. |
| **Tahap 1: Inti** | Penegakan RLS Materi & Kuis Terkunci | Belum | pgTAP RLS | Belum dijalankan | Mahasiswa tidak dapat SELECT materi/kuis pada bab terkunci. |
| **Tahap 1: Inti** | Kuis Bab & Kekuatan Topik (`computeTopicLevel`) | Belum | Unit test `computeTopicLevel` | Belum dijalankan | Level topik: `belum_cukup_data`, `perlu_latihan`, `cukup`, `kuat`. |
| **Tahap 1: Inti** | RPC `finish_chapter_quiz_attempt` | Belum | Unit test RPC / integrasi | Belum dijalankan | Idempoten, update progress, rekap topik, award XP. |
| **Tahap 1: Inti** | Peta Visual (SVG + Daftar Fallback) | Belum | Playwright / Komponen | Belum dijalankan | Tab Peta di `/classes/[classId]`, aksesibilitas keyboard dan pembaca layar. |
| **Tahap 1: Inti** | Progres Kelas & Tindakan Dosen | Belum | Unit test RPC agregat | Belum dijalankan | Sebaran per bab, topik tersulit (ambang >= 5), peringatan, buka manual. |
| **Tahap 1: Inti** | Prioritas Hari Ini (`buildDailyPriorities`) | Belum | Unit test `buildDailyPriorities` | Belum dijalankan | Perhitungan skor transparan tanpa AI, zona WIB, max 5 butir. |
| **Tahap 1: Inti** | Tab Tenggat Kalender | Belum | Komponen / Integrasi | Belum dijalankan | Menampilkan batas akhir pengumpulan dan target bab. |
| **Tahap 2: Konten** | Kotak Leitner Flashcard (`reviewCard`) | Belum | Unit test `reviewCard` | Belum dijalankan | 5 kotak, jeda 1, 2, 4, 8, 16 hari WIB. |
| **Tahap 2: Konten** | Antrean Flashcard (`get_flashcard_queue`) | Belum | Unit test antrean | Belum dijalankan | Batas kartu baru (20/hari) dan kartu ulasan (100/hari). |
| **Tahap 2: Konten** | Pembuatan Konten AI & Landasan (`groundingScore`) | Belum | Unit test validator & score | Belum dijalankan | Interface `ContentGenerator`, validasi Zod, fail-closed tanpa kunci AI. |
| **Tahap 2: Konten** | Tinjau Konten (`/lecturer/content-review`) | Belum | Playwright / Komponen | Belum dijalankan | Persetujuan dosen sebelum terbit, jejak audit review session. |
| **Tahap 2: Konten** | Podcast Bab & Sintesis Suara | Belum | Unit test parser + adapter | Belum dijalankan | Interface `SpeechSynthesizer`, potongan chunk tanpa ffmpeg, player audio. |
| **Tahap 2: Konten** | Kartu dari Soal Kuis Salah | Belum | Unit test & pgTAP | Belum dijalankan | Turun ke kotak 1, proteksi kunci jawaban kuis (mahasiswa dilarang SELECT). |
| **Tahap 3: Sosial** | Tukar Keahlian (`skill_exchange_*`) | Belum | Unit test rules + pgTAP | Belum dijalankan | Larangan pesan pribadi, pemblokiran saat ujian, anonimitas pemohon. |
| **Tahap 3: Sosial** | Batas Poin & Pasangan Tukar Keahlian | Belum | Unit test caps | Belum dijalankan | Maks 3x/hari per pembantu, maks 2x/minggu per pasangan. |
| **Tahap 3: Rekap** | Rekap Semester (`buildRecap`) | Belum | Unit test `buildRecap` | Belum dijalankan | Refleksi pribadi tanpa perbandingan, dukungan mode log mati. |
| **Tahap 3: Laporan** | Laporan Penggunaan Agregat | Belum | Unit test RPC / pgTAP | Belum dijalankan | Masking sel `< 5`, proteksi prodi Kaprodi. |

---

## 2. Catatan Lingkungan Pengujian Eksekusi

1. **Unit Test (Vitest)**:
   - Perintah: `npm test`
   - Status baseline: 53 berkas lulus, 437 tes lulus (durasi ~81 detik).
2. **Uji Kebijakan RLS Basis Data (pgTAP via Supabase CLI)**:
   - Perintah: `supabase test db`
   - Catatan: Lingkungan Windows lokal saat ini tidak menjalankan daemon Docker (`docker engine`), sehingga koneksi ke port lokal Supabase DB `127.0.0.1:54322` mengembalikan `ECONNREFUSED`.
   - Kebijakan pengerjaan: Seluruh berkas uji RLS ditulis lengkap dan standar di `supabase/tests/database/` dengan skenario positif dan kasus negatif ketat. Status eksekusi dicatat "belum dijalankan (keterbatasan daemon Docker di host)" tanpa mengklaim selesai palsu.
3. **Uji End-to-End (Playwright)**:
   - Perintah: `$env:PLAYWRIGHT_BROWSERS_PATH="D:\playwright-browsers"; npx playwright test`
