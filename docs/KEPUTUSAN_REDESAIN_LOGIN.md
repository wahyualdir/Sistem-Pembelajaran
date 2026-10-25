# Keputusan Redesain Halaman Masuk RuangKampus

**Tanggal:** 25 Oktober 2026  
**Penulis:** Tim Pengembang AI & Antigravity  
**Rujukan:** Konsep Desain "Halaman Masuk RuangKampus" oleh Yanzz (`docs/INSTRUKSI_REDESAIN_LOGIN.md`)

---

## 1. Nomenklatur & Penyelarasan Merek Produk (SIAJAR vs RuangKampus)

### Latar Belakang
- Pada implementasi kode dasar dan dokumen arsitektur teknis sebelumnya (misalnya dokumen PRD, SRS, nama variabel lingkungan `DEMO_PASSWORD`, in-memory store `__siajarCustomPasswords`, nama basis data, serta tabel referensi), sistem dinamakan **SIAJAR** (*Sistem Informasi Akademik dan Pembelajaran Terpadu*).
- Pada arahan visual terbaru dari Yanzz, seluruh elemen antarmuka yang berhadapan langsung dengan pengguna (*user-facing*) pada halaman masuk (`src/app/(auth)/login/page.tsx`) diwajibkan menggunakan satu nama produk tunggal: **RuangKampus**. Istilah seperti *"Ruang Kerja"* dan lencana *"Portal Akademik Terpadu"* atau *"SIAJAR"* telah dihilangkan dari antarmuka login.

### Keputusan Teknis
1. **Pemisahan Tampilan Pengguna vs Dokumen Teknis Internal**:
   - Seluruh teks tampilan pada halaman masuk secara konsisten menggunakan **RuangKampus**.
   - Dokumen teknis internal, modul backend (`src/modules/identity/`), migrasi basis data, dan skrip seed tetap mempertahankan penamaan teknis **SIAJAR** untuk menjaga kompatibilitas mundur (*backward compatibility*) dan mencegah regresi pada CI/CD.
2. **Permohonan Keputusan kepada Pemilik Produk (Yanzz)**:
   - Kami meminta Yanzz untuk menetapkan keputusan final: Apakah nama **RuangKampus** akan diadopsi secara menyeluruh ke seluruh sistem (termasuk mengganti nama modul teknis, repositori, skrip seed, dan dokumen arsitektur), atau apakah **RuangKampus** akan menjadi nama dagang (*consumer-facing brand*) sementara **SIAJAR** tetap menjadi nama mesin internal (*engine/platform core*).

---

## 2. Pilihan Elemen Formulir & Sesi

- **Kotak Centang "Ingat saya di perangkat ini"**:  
  Dihapus dari formulir masuk karena `loginAction` pada `src/modules/identity/actions.ts` menggunakan skema sesi terpadu dengan cookie berdurasi tetap (7 hari untuk sesi pengguna dan 365 hari untuk identitas perangkat `device_id`), tanpa parameter `rememberMe` pada server action. Penghapusan ini mematuhi instruksi Bagian 4 ("hanya bila sesi memang mendukungnya, kalau tidak, hapus").
- **Mode Pengembang**:  
  Dipindahkan ke bagian bawah halaman dalam elemen `<details>` bertuliskan *"Mode pengembang"*, hanya aktif pada `NODE_ENV === 'development'`, dan hanya mengisi kolom identitas (tanpa pernah mengisi kata sandi).
- **Penanganan Galat Generik**:  
  Pesan galat diseragamkan menjadi *"NIM atau kata sandi salah."* tanpa membedakan apakah akun ditemukan atau kata sandi salah untuk mencegah kebocoran informasi identitas pengguna (*user enumeration*).
- **Penguncian Akun**:  
  Jika batas 5 kali percobaan gagal tercapai, antarmuka menampilkan *"Terlalu banyak percobaan. Coba lagi dalam {n} menit."* dengan nilai waktu yang dihitung secara dinamis dari respons server (`loginAction`), bukan dari waktu lokal perangkat.
