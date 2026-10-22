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
Test Files  66 passed (66)
     Tests  613 passed (613)
  Duration  101.08s
```
*(Tidak ada kegagalan, tidak ada regresi pada tes eksisting).*

---

## 3. Status Berkas Rahasia (Git Safeguard)
Berkas `docs/seed-data/PEMETAAN_RAHASIA_dosen_lama_ke_baru.csv` dan `.env.seed*` dipastikan telah masuk ke `.gitignore` dan **tidak terlacak** oleh git (`git status` bersih dari berkas rahasia).
