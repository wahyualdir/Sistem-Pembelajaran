# Panduan Rollback Fitur "Kain Semester"

Dokumen ini memuat prosedur resmi pembatalan fitur "Kain Semester" mahasiswa tanpa menyentuh database.

---

## Informasi Penanda Awal

- **Commit Awal**: `fcb28ec4b9eeea5136e02f4c0a12dfba81093614`
- **Tag Penanda**: `pra-kain-semester`
- **Cabang Fitur**: `fitur/kain-semester`
- **Cabang Utama**: `seed-akademik-uir` (atau `main` bila dimerge)

---

## Log Commit per Fase

Daftar hash commit untuk setiap fase (berdasarkan `git log --oneline pra-kain-semester..HEAD`):

- **Fase A (Jaring Pengaman Rollback)**: `5bdf015` (`chore(kain-semester): siapkan tag dan catatan rollback`)
- **Fase B (Audit Sumber Data & RLS)**: `426c391` (`docs(kain-semester): audit sumber data`)
- **Fase C (Feature Flag Server-Only)**: `ecc8f37` (`feat(kain-semester): tambah feature flag FF_KAIN_SEMESTER`)
- **Fase D (Logika Murni & Unit Test)**: `ea2bf98` (`feat(kain-semester): logika murni kisi semester`) & `6051e8c` (`test(kain-semester): kasus uji kisi semester`)
- **Fase E (Server Action RLS)**: `46944f2` (`feat(kain-semester): server action pemuat kisi semester`)
- **Fase F (Komponen UI & Radix Sheet)**: `2f944b6` (`feat(kain-semester): komponen kisi dan sheet detail`)
- **Fase G (Integrasi Beranda Mahasiswa)**: `849f8d7` (`feat(kain-semester): integrasi di beranda mahasiswa di belakang flag`)
- **Fase H (Verifikasi Menyeluruh & Aksesibilitas)**: `d7b8f13` (`test(kain-semester): verifikasi menyeluruh aksesibilitas dan ragam skenario`)
- **Fase I (Dokumentasi Akhir)**: `b21d985` (`docs(kain-semester): perbarui catatan rollback dan progres akhir`)

---

## Tingkat Prosedur Rollback

Fitur ini dirancang agar dapat dicabut tanpa menyentuh database karena tidak ada migrasi skema. Tersedia 4 tingkatan rollback:

### Tingkat 0: Matikan Fitur (Tanpa Mengubah Kode, Paling Cepat)

1. Di pengaturan environment hosting (Vercel / server produksi), ubah nilai `FF_KAIN_SEMESTER` menjadi `false` atau hapus variabel tersebut.
2. **Deploy ulang** aplikasi agar pembacaan environment server-side diperbarui.
3. **Hasil**: Halaman `/student` secara otomatis kembali menampilkan kartu "Status akademik dan peringatan dini" (`StudentAcademicStatusCard`) lama. Seluruh kode fitur tetap ada tetapi tidak aktif dan tidak dieksekusi.
4. Di lingkungan lokal: set `FF_KAIN_SEMESTER=false` di `.env.local`, lalu restart dev server.

### Tingkat 1: Batalkan lewat Git Revert (Aman untuk Riwayat Bersama)

Gunakan metode ini bila cabang fitur sudah digabungkan (merge) ke cabang utama dan digunakan bersama tim:

```bash
# 1. Periksa daftar commit fitur:
git log --oneline pra-kain-semester..HEAD

# 2. Batalkan seluruh rentang commit fitur sekaligus:
git revert --no-edit pra-kain-semester..HEAD

# 3. Atau jika fitur masuk lewat satu merge commit:
git revert -m 1 <hash-merge-commit>
```

Untuk membatalkan **satu fase saja**, revert commit fase tertentu. Urutan aman pembatalan parsial adalah dari fase terbaru ke fase terlama (Fase I -> H -> G -> ... -> A).

### Tingkat 2: Buang Cabang (Fitur Belum Ter-merge)

Jika masih di cabang fitur dan ingin membatalkan total:

```bash
git checkout seed-akademik-uir
git branch -D fitur/kain-semester
```

Tag `pra-kain-semester` tetap dipertahankan sebagai titik referensi historis.

### Tingkat 3: Kembalikan Berkas Tertentu ke Kondisi Awal

Jika hanya ingin mengembalikan berkas lama yang disentuh oleh fitur ini:

```bash
git checkout pra-kain-semester -- "src/app/(portal)/student/page.tsx"
git checkout pra-kain-semester -- "src/app/(portal)/student/student-dashboard-client.tsx"
git checkout pra-kain-semester -- src/lib/config/features.ts
git checkout pra-kain-semester -- .env.example
```

Berkas baru yang dibuat oleh fitur ini (dapat dihapus bila ingin pembersihan total tanpa sisa):
- `src/lib/akademik/semester-weave.ts`
- `src/modules/academic/semester-weave-actions.ts`
- `src/components/home/semester-weave.tsx`
- `src/components/home/semester-weave-sheet.tsx`
- `src/tests/unit/semester-weave/`
- `docs/AUDIT_KAIN_SEMESTER.md`
- `docs/PROGRESS_KAIN_SEMESTER.md`
- `docs/ROLLBACK_KAIN_SEMESTER.md`

---

## Verifikasi Setelah Rollback (Wajib)

1. `git status` bersih, `git log --oneline -5` menunjukkan status pembatalan yang rapi.
2. Jalankan pemeriksaan pengujian:
   ```bash
   npm run typecheck && npm run lint && npm test
   ```
   Hasil harus identik dengan baseline Fase A (69 file lolos, 631 tes hijau).
3. Buka halaman `/student`: kartu lama `StudentAcademicStatusCard` muncul dengan normal, tidak ada elemen kain semester, tidak ada error di konsol.
4. Verifikasi sisa pencarian kode:
   ```bash
   grep -rn "semester-weave\|FF_KAIN_SEMESTER" src .env.example
   ```
   Tidak boleh ada sisa referensi selain jika sengaja dibiarkan pada Tingkat 0.
