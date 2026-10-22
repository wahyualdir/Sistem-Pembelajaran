# Laporan Progres Seed Data Akademik SIAJAR (UIR Ganjil 2026/2027)

Dokumen ini mencatat status verifikasi objektif dan bukti eksekusi per fase secara jujur dan transparan.

---

## 1. Ringkasan Status Fase

| Fase | Deskripsi | Status | Bukti / Keluaran Perintah |
| :--- | :--- | :---: | :--- |
| **S0** | Audit Skema, Persistensi, dan Login | **SELESAI** | Laporan audit lengkap di `docs/AUDIT_SEED_AKADEMIK.md` dan keputusan teknis di `docs/KEPUTUSAN_SEED_AKADEMIK.md`. |
| **S1** | Migrasi `class_schedule_slots` & `course_code_aliases` | **SELESAI** | Migrasi `20261021000035_class_schedule_slots_and_aliases.sql` dibuat; tes pgTAP `13_class_schedule_slots_rls.sql`; `npm run check:rls` lolos 149 tabel. |
| **S2** | Kerangka Skrip Seed TypeScript (`scripts/seed-akademik/`) | **SELESAI** | `guard.ts`, `load.ts`, `index.ts`; unit test lolos (`guard.test.ts` & `load.test.ts`); dry-run CLI memvalidasi CSV tanpa kesalahan. |
| **S3** | Penyediaan 168 Akun Login dan Penugasan Peran | **BELUM DIJALANKAN TERHADAP DATABASE** | Modul `accounts.ts` telah diimplementasikan dan diverifikasi via unit test, namun **belum dijalankan terhadap database** sampai ada keluaran nyata. |
| **S4** | Penyemaian Data Akademik (Prodi, Sem, Ruang, Kelas, Slot, KRS, Asdos) | **BELUM DIJALANKAN TERHADAP DATABASE** | Modul `academic.ts` telah diimplementasikan dan diverifikasi via unit test, namun **belum dijalankan terhadap database** sampai ada keluaran nyata. |
| **S5** | Integrasi Lapisan Data Generated (`seed-data.uir-ti-2026.generated.ts`) | **SELESAI** | Generator `generate-legacy.ts` menghasilkan `seed-data.uir-ti-2026.generated.ts`. Store `master-store`, `jadwal-store`, `krs-store` mendukung `SEED_DATASET=uir-ti-2026`. Unit test di `legacy-layer.test.ts` dan `ruang.test.ts` (14 ruang identik dengan `ruang.csv`) lolos. |
| **S6** | Verifikasi Otomatis, Uji Login, dan Dokumentasi Akhir | **SEBAGIAN (Skrip & Unit Test Siap)** | Modul `verify.ts` selesai; langkah CI seed di `.github/workflows/ci.yml` dan verifikasi database **belum dijalankan terhadap database** sampai ada keluaran nyata. Seluruh unit tests & `npm run typecheck` lolos 100%. |

> [!IMPORTANT]
> **Catatan Status Eksekusi Database**:
> Tahapan **S3** (penyediaan 168 akun auth), **S4** (penyemaian data akademik ke Supabase), serta **langkah CI seed** (`npm run seed:akademik -- --apply`) **belum dijalankan terhadap database** sampai ada keluaran nyata dari lingkungan database aktif. Status tidak akan ditandai "SELESAI" sebelum terdapat bukti eksekusi langsung.

---

## 2. Bukti Keluaran Pengujian (Test & Command Evidence)

### A. Validasi Mode Kering (Dry-Run)
Perintah yang dijalankan: `npm run seed:akademik`
```
> siakad@0.1.0 seed:akademik
> tsx scripts/seed-akademik/index.ts

================================================================
   SIAJAR: Penyemaian Data Akademik UIR (Ganjil 2026/2027)      
================================================================

📂 [1/4] Memuat dan memvalidasi berkas CSV dari docs/seed-data...
   ✅ Validasi Zod dan Integritas Silang Berhasil:
      - Mahasiswa          : 120 orang (NIM 23..26)
      - Dosen              : 42 orang (NIDN 10-digit)
      - Staf & Admin       : 6 orang (NIP 8-digit)
      - Ruang Kelas/Lab    : 14 ruangan
      - Mata Kuliah        : 63 kurikulum (38 alias jadwal)
      - Kelas Perkuliahan  : 164 kelas unik
      - Slot Jadwal        : 256 sesi kuliah
      - Pendaftaran KRS    : 870 entri
      - Penugasan Asdos    : 56 penugasan

ℹ️  MODE KERING (DRY-RUN):
   Semua data valid dan konsisten. Tidak ada perubahan yang ditulis ke database.
   Gunakan flag --apply untuk melakukan penulisan sungguhan.
```

### B. Unit Test Kerangka Seed Akademik (Vitest)
Perintah yang dijalankan: `npx vitest run src/tests/unit/seed-akademik/`
```
 RUN  v2.1.9 C:/Users/ACER/Downloads/implementasi

 ✓ src/tests/unit/seed-akademik/guard.test.ts (9 tests) 40ms
 ✓ src/tests/unit/seed-akademik/ruang.test.ts (3 tests) 53ms
 ✓ src/tests/unit/seed-akademik/load.test.ts (3 tests) 484ms
 ✓ src/tests/unit/seed-akademik/legacy-layer.test.ts (4 tests) 88ms

 Test Files  4 passed (4)
      Tests  19 passed (19)
```

### C. Pemeriksaan RLS Seluruh Skema Publik
Perintah yang dijalankan: `npm run check:rls`
```
--- CI Check: Public Schema Row Level Security (RLS) ---
🔍 Ditemukan 149 tabel pada migrasi: [..., class_schedule_slots, course_code_aliases]
✅ SUKSES: Semua 149 tabel di schema public memiliki RLS aktif!
```

### D. Pemeriksaan Tipe TypeScript
Perintah yang dijalankan: `npm run typecheck`
```
> siakad@0.1.0 typecheck
> tsc --noEmit

Command exited with code 0.
```

### E. Seluruh Unit Test Repositori (Vitest)
Perintah yang dijalankan: `npm test`
```
Test Files  68 passed (68)
     Tests  621 passed (621)
```
*(Termasuk unit test baru `ruang.test.ts` dan `demo-login.test.ts`, tidak ada kegagalan, tidak ada regresi).*

---

## 3. Status Berkas Rahasia (Git Safeguard)
Berkas `docs/seed-data/PEMETAAN_RAHASIA_dosen_lama_ke_baru.csv` dan `.env.seed*` dipastikan telah masuk ke `.gitignore` dan **tidak terlacak** oleh git (`git status` bersih dari berkas rahasia).

---

## 4. Status Kejujuran Eksekusi terhadap Basis Data (Database Execution Status)

### A. Yang SUDAH Dijalankan Terhadap Basis Data:
1. **Eksekusi 38 Migrasi SQL dari Awal (Clean DB)**:
   - Seluruh 38 berkas migrasi Supabase (`20260930000001` s.d. `20261021000035`) telah dieksekusi dari nol pada mesin PostgreSQL/PGlite dan berhasil 100% tanpa error (`node scripts/test-migrations-pglite.mjs`).
2. **Uji Kebijakan RLS & Delegasi Asisten (`05_assistants_rls.sql`)**:
   - Berhasil dieksekusi ulang terhadap skema basis data penuh dengan hasil **29 dari 29 pengujian lolos** (target 29/29 tercapai setelah perbaikan overload fungsi `set_assistant`).
3. **Uji Kebijakan RLS Slot Jadwal (`13_class_schedule_slots_rls.sql`)**:
   - Berhasil dieksekusi terhadap skema basis data penuh dengan hasil **12 dari 12 pengujian lolos**. Percobaan `DELETE` oleh mahasiswa ditolak RLS dan baris slot terbukti tetap ada.

### B. Yang BELUM Dijalankan Terhadap Basis Data:
1. **Fase S3 (Penyediaan 168 Akun Auth Supabase)**:
   - Pemanggilan Admin API (`auth.admin.createUser`) di `scripts/seed-akademik/accounts.ts` **belum pernah dijalankan** terhadap target instance database Supabase aktif (hanya diverifikasi pada lapisan mock dan dry-run).
2. **Fase S4 (Penyemaian Data Relasional Akademik)**:
   - Penulisan tabel relasional (`programs`, `semesters`, `rooms`, `courses`, `classes`, `class_schedule_slots`, `enrollments`, `class_assistants`) via Supabase Client di `scripts/seed-akademik/academic.ts` **belum pernah dijalankan** terhadap target instance database Supabase aktif.
3. **Langkah CI Seed (`npm run seed:akademik -- --apply`)**:
   - Langkah penyemaian data sungguhan di GitHub Actions CI **belum dijalankan terhadap database CI** sebelum pipeline CI di GitHub menyelesaikan eksekusi runner-nya.

