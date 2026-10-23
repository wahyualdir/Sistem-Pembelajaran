# Laporan Progres Seed Data Akademik SIAJAR (UIR Ganjil 2026/2027)

Dokumen ini mencatat status verifikasi objektif dan bukti eksekusi per fase secara jujur dan transparan.

---

## 1. Ringkasan Status Fase

| Fase | Deskripsi | Status | Bukti / Keluaran Perintah |
| :--- | :--- | :---: | :--- |
| **S0** | Audit Skema, Persistensi, dan Login | **SELESAI** | Laporan audit lengkap di `docs/AUDIT_SEED_AKADEMIK.md` dan keputusan teknis di `docs/KEPUTUSAN_SEED_AKADEMIK.md`. |
| **S1** | Migrasi `class_schedule_slots` & `course_code_aliases` | **SELESAI (Skema & RLS)** | Migrasi `20261021000035_class_schedule_slots_and_aliases.sql` dibuat; `npm run check:rls` lolos 150 tabel; pengujian pgTAP menunggu eksekusi CI resmi. |
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

> [!CAUTION]
> **Kebijakan Keabsahan Uji pgTAP**:
> Hasil pengujian pgTAP yang **sah dan resmi HANYA berasal dari `supabase test db` di CI GitHub Actions**.
> Hasil dari `scripts/run-pgtap.mjs` adalah **harness tiruan/emulasi lokal** (PGlite) dan **TIDAK dianggap sebagai bukti kelulusan resmi**. Seluruh suite pgTAP berstatus **MENUNGGU VERIFIKASI CI**.

### A. Yang SUDAH Dijalankan Terhadap Basis Data:
1. **Eksekusi 39 Migrasi SQL dari Awal (Clean DB)**:
   - Seluruh 39 berkas migrasi Supabase (`20260930000001` s.d. `20261023000037`) telah dieksekusi dari nol pada mesin PostgreSQL/PGlite disposable dan berhasil tanpa error sintaks/skema (`node scripts/test-migrations-pglite.mjs`).

### B. Yang BELUM Dijalankan Terhadap Basis Data / Menunggu Verifikasi CI:
1. **Eksekusi Sah `supabase test db` (Seluruh Suite pgTAP)**:
   - Perintah resmi `supabase test db` untuk seluruh berkas pengujian (`02_identity_rls.sql`, `03_academic_rls.sql`, `05_assistants_rls.sql`, `09_peta_pulau_p0.test.sql`, `10_peta_pulau_tahap1.test.sql`, `13_class_schedule_slots_rls.sql`, `14_daily_activities_rls.sql`) **belum dijalankan di host lokal** karena Supabase CLI dan Docker daemon tidak terpasang di lingkungan Windows pengembang.
   - **Perbaikan Uji 5 `14_daily_activities_rls.sql`**: Telah diselidiki bahwa kegagalan uji 5 disebabkan data uji kelas belum mendefinisikan peran `LECTURER` dengan `scope_type = 'CLASS'` dan `enrollment` untuk mahasiswa, serta kebijakan RLS `daily_activities_select` diperkuat agar mengenali dosen pengampu langsung (`classes.lecturer_id` / `classes.created_by`).
   - Seluruh pengujian pgTAP basis data **belum terbukti hijau sampai ada log nyata dari GitHub Actions**.
2. **Fase S3 (Penyediaan 168 Akun Auth Supabase)**:
   - Pemanggilan Admin API (`auth.admin.createUser`) di `scripts/seed-akademik/accounts.ts` **belum pernah dijalankan** terhadap target instance database Supabase aktif (hanya diverifikasi pada lapisan mock dan dry-run).
3. **Fase S4 (Penyemaian Data Relasional Akademik)**:
   - Penulisan tabel relasional (`programs`, `semesters`, `rooms`, `courses`, `classes`, `class_schedule_slots`, `enrollments`, `class_assistants`) via Supabase Client di `scripts/seed-akademik/academic.ts` **belum pernah dijalankan** terhadap target instance database Supabase aktif.
4. **Langkah CI Seed (`npm run seed:akademik -- --apply`)**:
   - Langkah penyemaian data sungguhan di GitHub Actions CI **belum dijalankan terhadap database CI** sebelum pipeline CI di GitHub menyelesaikan eksekusi runner-nya.
