# SIAJAR — Prosedur dan Log Rollback Perbaikan Menu Berfungsi

Dokumen ini mencatat titik balik (*rollback checkpoints*), tag git, migrasi database yang ditambahkan, serta prosedur pengembalian untuk setiap fase pengerjaan perbaikan menu berfungsi sesuai `docs/INSTRUKSI_MENU_BERFUNGSI.md`.

---

## 1. Tabel Log Rollback per Fase

| Fase | Tag git | Migrasi baru | Cara membatalkan |
|---|---|---|---|
| Titik Awal | `pra-menu-fungsi` | Tidak ada | `git checkout pra-menu-fungsi` |
| Fase 0 — Jaring Pengaman & Baseline | `fase-0-baseline` | Tidak ada | `git revert fase-0-baseline` |
| Fase 1 — Perbaikan Keamanan | `fase-1-keamanan` | Tidak ada | `git revert fase-0-baseline..fase-1-keamanan` |
| Fase 2 — Inventaris & Audit Menu Otomatis | `fase-2-audit` | Tidak ada | `git revert fase-1-keamanan..fase-2-audit` |
| Fase 3 — Rute dan Akses per Role | `fase-3-rute-akses` | Tidak ada | `git revert fase-2-audit..fase-3-rute-akses` |
| Fase 4 — Ganti Data Tiruan dengan Data Nyata | `fase-4-data-nyata` | Tidak ada | `git revert fase-3-rute-akses..fase-4-data-nyata` |

---

## 2. Aturan Keras Pembatalan (Rollback Rules)

1. **Jangan `git reset --hard` pada cabang bersama.** Selalu gunakan `git revert <tag-sebelum>..<tag-fase>` untuk membatalkan perubahan kode aplikasi secara bersih dan terdokumentasi.
2. **Migrasi database hanya bertambah (additive).** Jangan pernah menghapus file migrasi lama yang sudah terkomit di `supabase/migrations/`. Jika migrasi baru perlu dibatalkan, buat berkas migrasi baru ber-timestamp terbaru yang membalik operasi (DROP TABLE, DROP POLICY, dsb.).
3. **Titik awal aman selalu `pra-menu-fungsi`** (commit `9d2a590`).
