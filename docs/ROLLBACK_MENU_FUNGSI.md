# SIAJAR — Prosedur dan Log Rollback Perbaikan Menu Berfungsi

Dokumen ini mencatat titik balik (*rollback checkpoints*), tag git, status migrasi basis data, serta prosedur pengembalian untuk setiap fase pengerjaan perbaikan menu berfungsi sesuai `docs/INSTRUKSI_MENU_BERFUNGSI.md`.

---

## 1. Tabel Log Rollback per Fase

| Fase | Tag git | Migrasi baru | Cara membatalkan |
|---|---|---|---|
| **Titik Awal** | `pra-menu-fungsi` | Tidak ada | `git checkout pra-menu-fungsi` |
| **Fase 0** — Jaring Pengaman & Baseline | `fase-0-baseline` | Tidak ada | `git revert fase-0-baseline` |
| **Fase 1** — Perbaikan Keamanan | `fase-1-keamanan` | Tidak ada | `git revert fase-0-baseline..fase-1-keamanan` |
| **Fase 2** — Inventaris & Audit Menu Otomatis | `fase-2-audit` | Tidak ada | `git revert fase-1-keamanan..fase-2-audit` |
| **Fase 3** — Rute dan Akses per Role | `fase-3-rute-akses` | Tidak ada | `git revert fase-2-audit..fase-3-rute-akses` |
| **Fase 4** — Ganti Data Tiruan dengan Data Nyata | `fase-4-data-nyata` | Tidak ada | `git revert fase-3-rute-akses..fase-4-data-nyata` |
| **Fase 5** — Hilangkan Tombol Palsu dan alert() | `fase-5-tombol-nyata` | Tidak ada | `git revert fase-4-data-nyata..fase-5-tombol-nyata` |
| **Fase 6** — Penyimpanan Permanen | `fase-6-persistensi` (`fase-6-penyimpanan-permanen`) | Tidak ada | `git revert fase-5-tombol-nyata..fase-6-persistensi` |
| **Fase 7** — Perburuan Bug Sistematis | `fase-7-bug` (`fase-7-perburuan-bug`) | Tidak ada | `git revert fase-6-persistensi..fase-7-bug` |
| **Fase 8** — Pengujian dan Kontrak Menu | `fase-8-tes` (`fase-8-pengujian`) | Tidak ada | `git revert fase-7-bug..fase-8-tes` |
| **Fase 9** — Dokumentasi dan Serah Terima | `fase-9-dokumen` (`fase-9-dokumentasi`) | Tidak ada | `git revert fase-8-tes..fase-9-dokumen` |

---

## 2. Aturan Keras Pembatalan (Rollback Rules)

1. **Gunakan `git revert`, Jangan `git reset --hard`**:
   Pada cabang kerja bersama atau cabang rilis, gunakan selalu `git revert <tag-sebelum>..<tag-target>` untuk membatalkan perubahan secara transparan, mempertahankan riwayat git, dan tidak menyebabkan inkonsistensi sinkronisasi pada anggota tim lain.
2. **Migrasi Database Bersifat Aditif (Additive Only)**:
   Selama perbaikan Fase 0 s.d. Fase 9, seluruh implementasi memanfaatkan skema tabel database yang telah ada (seperti `courses`, `cpl`, `cpmk`, `student_risk_evaluations`, `question_bank`, `exam_answers`, `student_requests`, `attendance_records`, dan `institution_policies` yang seluruhnya 100% ber-RLS aktif). Tidak ada file migrasi baru yang perlu ditambahkan.
3. **Prosedur Rollback Migrasi Masa Depan**:
   Jika di kemudian hari dibuat migrasi aditif baru (misalnya `20261029000039_fitur_baru.sql`) dan memerlukan pembatalan:
   - **DILARANG MENGHAPUS** berkas migrasi yang telah di-commit ke repositori.
   - Buat migrasi baru ber-timestamp terbaru (misalnya `20261029000040_revert_fitur_baru.sql`) yang berisi perintah SQL pembalik (`DROP TABLE IF EXISTS ...`, `DROP POLICY IF EXISTS ...`, dll.).
   - Catat operasi pembalik tersebut pada dokumen ini.
4. **Titik Awal Aman**:
   Titik awal aman sebelum pekerjaan ini dimulai selalu merujuk pada tag `pra-menu-fungsi` (commit `9d2a590`).
