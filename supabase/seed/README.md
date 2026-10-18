# Data Demo SIAJAR (Seed)

Folder ini berisi skrip SQL dan dokumentasi data contoh realistis berbahasa Indonesia untuk mendemonstrasikan seluruh fitur dan alur kerja sistem SIAJAR (Sistem Informasi Ajar Terpadu) dari Fase 0 hingga Fase 7.

---

## 1. Akun Demo Berdasarkan Peran

Seluruh akun demo di bawah telah disiapkan dengan data profil, peran aktif, dan kata sandi demo yang seragam:

> **Kata Sandi Standar Seluruh Akun Demo**: `demo12345`  
> *(Catatan: Pada lingkungan produksi, pengguna diwajibkan mengganti kata sandi saat pertama kali masuk).*

| No | Peran (Role) | Nama Pengguna / Email | Identitas Resmi | Nama Lengkap | Keterangan Akses |
|:---|:---|:---|:---|:---|:---|
| 1 | **Mahasiswa** (`STUDENT`) | `mhs.alpha@student.uir.ac.id` | NIM: `2024010001` | Ahmad Dahlan | Mahasiswa semester 3 aktif, anggota kelas Pemrograman Web dan Basis Data Lanjut. |
| 2 | **Asisten Dosen** (`TEACHING_ASSISTANT`) | `asisten.lab@student.uir.ac.id` | NIM: `2022010001` | Citra Lestari | Asisten laboratorium praktikum Pemrograman Web (diberi izin buka presensi). |
| 3 | **Dosen Pengampu** (`LECTURER`) | `dosen.utama@uir.ac.id` | NIDN: `0012345678` | Dr. Ir. Budi Santoso, M.Kom. | Dosen pengampu Pemrograman Web A dan Rekayasa Perangkat Lunak. |
| 4 | **Koordinator Prodi** (`PROGRAM_COORDINATOR`) | `kaprodi.ti@uir.ac.id` | NIDN: `0087654321` | Dr. Eng. H. Faisal Rahman, S.T., M.T. | Ketua Program Studi Teknik Informatika, pengelola kurikulum OBE dan persetujuan nilai. |
| 5 | **Staf Akademik** (`ACADEMIC_STAFF`) | `staf.akademik@uir.ac.id` | NIP: `198501012010121001` | Siti Rahmawati, S.Kom. | Pengelola administrasi tata usaha, penjadwalan kuliah bebas bentrok, dan verifikasi surat. |
| 6 | **System Administrator** (`SYSTEM_ADMIN`) | `sysadmin@uir.ac.id` | Akun Teknis | Eko Prasetyo, S.T. | Pengelola telemetri server, konektor Judge, dan audit log dengan penyamaran nilai akademik. |
| 7 | **Super Administrator** (`SUPER_ADMIN`) | `superadmin@uir.ac.id` | Otoritas Institusi | Prof. Dr. Syafrinaldi, S.H., M.C.L. | Pimpinan universitas: kebijakan global, manajemen akun, dan hak audit penuh. |

---

## 2. Cakupan Data Demo yang Disediakan

Skrip `demo_seed.sql` mencakup data relasional utuh yang saling terhubung:
1. **1 Program Studi**: Teknik Informatika (Jenjang S1, Fakultas Teknik).
2. **2 Semester Akademik**:
   - `2025/2026 Genap`: Semester lampau yang telah diarsipkan (hanya-baca).
   - `2026/2027 Ganjil`: Semester perkuliahan aktif.
3. **8 Dosen Pengampu**: Dosen tetap dengan NIDN dan keahlian bidang masing-masing.
4. **3 Asisten Dosen**: Mahasiswa tingkat atas dengan surat keputusan penugasan asistensi praktikum.
5. **120 Mahasiswa Fiktif**: Terdaftar pada angkatan 2024 dengan NIM `2024010001` sampai `2024010120`.
6. **6 Kelas Perkuliahan (Masing-masing 16 Pertemuan)**:
   - *Pemrograman Web (Kelas A)*: Kelas aktif lengkap dengan rilis terjadwal materi, tugas individu terlambat dan tepat waktu, tugas kelompok, dan kuis.
   - *Basis Data Lanjut (Kelas B)*: Kelas aktif dengan rubrik penilaian analitik dan sanggahan nilai.
   - *Algoritma dan Struktur Data (Kelas C)*: Kelas aktif dengan ujian koding terintegrasi sandbox.
   - *Kecerdasan Buatan (Kelas A)*: Kelas aktif dengan live poll anonim dan forum diskusi interaktif.
   - *Rekayasa Perangkat Lunak (Kelas B)*: Kelas aktif dengan permohonan izin/sakit mahasiswa.
   - *Jaringan Komputer (Kelas Arsip)*: Kelas semester lalu berstatus `ARCHIVED` (hanya-baca).
7. **1 Ujian CBT Komprehensif dengan 40 Soal**:
   - 20 butir Pilihan Ganda (Tingkat Mudah, Sedang, Sukar).
   - 8 butir Benar / Salah.
   - 5 butir Isian Singkat.
   - 4 butir Esai Komprehensif dengan kriteria rubrik.
   - 3 butir Soal Pemrograman Koding (Python / JavaScript) dengan kasus uji publik dan tersembunyi.
8. **1 Periode Evaluasi Dosen (EDOM)**:
   - Survei kepuasan mahasiswa dengan True Anonymity Decoupling.
9. **Interaksi Kelas Lengkap**:
   - Berita acara perkuliahan harian per tatap muka.
   - Sanggahan nilai resmi dengan batas waktu 7 hari.
   - Permohonan izin dan sakit berlampiran berkas bukti medis.
   - Jajak pendapat kilat (live poll) anonim di kelas.
   - Percakapan privat dan pemesanan konsultasi akademik.

---

## 3. Cara Menjalankan Seed ke Basis Data

Untuk memasukkan seluruh data demo ke instance Supabase lokal atau remote:

### Menggunakan Supabase CLI
```bash
# Menjalankan migrasi lalu memasukkan seed
supabase db reset
```

### Menggunakan Baris Perintah PostgreSQL (psql)
```bash
psql -h <HOST> -p <PORT> -U <USER> -d <DB_NAME> -f supabase/seed/demo_seed.sql
```

Seluruh data dijamin mematuhi konvensi integritas referensial dan seluruh 122 tabel skema publik tetap dalam kondisi proteksi Row-Level Security (RLS) aktif.
