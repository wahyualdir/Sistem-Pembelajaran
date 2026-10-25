# Instruksi Redesain Halaman Masuk untuk Antigravity

Rujukan visual: konsep "Halaman Masuk RuangKampus" (tautan desain dari Yanzz). Aturan umum di `docs/INSTRUKSI_ANTIGRAVITY.md` tetap berlaku (aturan tulisan antarmuka, aksesibilitas, pelaporan jujur).

## Prompt pembuka

```
Kerjakan redesain halaman masuk sesuai docs/INSTRUKSI_REDESAIN_LOGIN.md. Ini pekerjaan tampilan saja.
Buat cabang baru fitur/redesain-login dari cabang yang CI-nya sudah hijau (bukan dari seed-akademik-uir).
Jangan mengubah logika otentikasi, server action, migrasi, atau berkas yang tidak disebut di sini.
Jangan menulis "selesai" untuk apa pun yang belum punya keluaran tes yang dijalankan.
```

## 1. Batas pekerjaan

- Ubah hanya `src/app/(auth)/login/page.tsx` dan komponen kecil baru di folder yang sama atau `src/components/auth/`.
- **Jangan** menyentuh `src/modules/identity/actions.ts`, aturan kunci 5 kali gagal, validasi domain email, atau alur OAuth. Tampilan hanya memanggil fungsi yang sudah ada.
- Tanpa dependensi baru. Font dimuat dengan `next/font` (di-host sendiri), bukan CDN.

## 2. Konsep

Tata letak dua kolom di layar lebar (kiri 55%, kanan 45%):

- **Kiri, panel merek** (hijau botol): logo dan nama, satu judul, satu kalimat penjelas, ilustrasi garis tiga pulau berurutan yang dihubungkan jalur putus-putus (selesai, sedang dipelajari, terkunci) sebagai gema fitur Peta Pulau, dan satu baris nama prodi dan kampus di bawah.
- **Kanan, formulir** di atas latar krem, tanpa kartu berbayang: judul "Masuk", penjelasan satu kalimat, dua kolom isian, aksi utama, aksi sekunder Google, dan tautan daftar.

## 3. Token desain

- Panel merek `#1E4638`; krem `#F6F2EA`; teks `#1C1B19`; teks sekunder `#4A473F`; aksen tombol `#B44A2F` (putih di atasnya berkontras sekitar 5,2:1); tautan `#8F3A24`; garis isian `#8A8577` (minimal 3:1 terhadap latar).
- Teks di panel hijau: krem `#F6F2EA` untuk judul, `#D9E3DC` untuk teks pendukung (keduanya di atas 7:1).
- Judul: Bricolage Grotesque 700 (judul 48 px di panel, 34 px di formulir). Badan: Inter 400/500/600, 14 sampai 18 px.
- Radius isian dan tombol 10 px. Tinggi isian 48 px, tombol 50 px. Semua target sentuh minimal 44 px.
- Jangan memakai gradien, kaca buram, bayangan berlapis, emoji, foto stok, atau angka karangan.

## 4. Teks (natural, ejaan Indonesia)

- Judul panel: "Kelas, tugas, dan ujian di satu tempat."
- Kalimat panel: "Masuk untuk melihat jadwal hari ini, tenggat yang paling dekat, dan materi dari dosenmu."
- Formulir: judul "Masuk"; penjelas "Gunakan NIM, NIDN, NIP, atau email kampus."; label "NIM, NIDN, NIP, atau email" (placeholder "Contoh: 243510001"); label "Kata sandi"; tautan "Lupa kata sandi?"; kotak centang "Ingat saya di perangkat ini" (hanya bila sesi memang mendukungnya, kalau tidak, hapus); tombol "Masuk"; pemisah "atau"; tombol "Masuk dengan akun Google kampus"; "Belum punya akun? Daftar di sini".
- Hapus kata "Ruang Kerja" dan lencana "Portal Akademik Terpadu". Satu nama produk saja, "RuangKampus", di seluruh halaman ini. Catat di `docs/KEPUTUSAN_REDESAIN_LOGIN.md` bahwa dokumen teknis tetap memakai nama SIAJAR dan minta Yanzz memilih satu nama untuk dipakai di semua tempat.

## 5. Perilaku dan keadaan

- Atribut: `autocomplete="username"` dan `autocomplete="current-password"`; tombol mata `aria-label="Tampilkan kata sandi"` yang berganti menjadi "Sembunyikan kata sandi".
- Peringatan Caps Lock singkat di bawah kolom kata sandi: "Caps Lock sedang aktif."
- Memuat: tombol nonaktif dengan teks "Memeriksa…", isian tetap terisi.
- Galat (di bawah formulir, `role="alert"`, tanpa warna saja): "NIM atau kata sandi salah." Jangan membedakan "akun tidak ada" dari "kata sandi salah".
- Terkunci (setelah 5 kali salah): "Terlalu banyak percobaan. Coba lagi dalam {n} menit." dengan nilai dari respons server, bukan dari jam perangkat.
- Fokus: cincin 2 px berwarna aksen dengan jarak 2 px. Animasi hanya transisi 150 ms dan menghormati `prefers-reduced-motion`.

## 6. Mode pengembang

Bagian "Akun Simulasi Peran" yang sekarang tampil harus: hanya muncul bila `NODE_ENV === 'development'` (pertahankan pengecekan yang sudah ada), dipindah ke bagian bawah halaman dalam elemen lipat bertuliskan "Mode pengembang", hanya mengisi identitas (tanpa kata sandi), dan tidak ikut di build produksi. Tambahkan tes bahwa bagian itu tidak ada saat `NODE_ENV=production`.

## 7. Responsif

- Di bawah 900 px: satu kolom, panel merek menjadi kepala ringkas (logo dan satu kalimat) dan ilustrasi disembunyikan. Formulir memakai padding 24 px.
- Di 360 px tidak boleh ada gulir horizontal.

## 8. Tes dan bukti

- Unit atau komponen: label terhubung ke isian, tombol mata mengganti tipe isian, bagian pengembang tidak muncul di production.
- Playwright satu alur: isi identitas dan kata sandi salah, galat muncul dengan `role="alert"`.
- Jalankan typecheck, lint, test unit, dan build. Tempel keluarannya, tanpa harness tiruan. Hal yang belum dijalankan ditulis "belum dijalankan".
- Tulis `docs/PROGRESS_REDESAIN_LOGIN.md` dengan status jujur per butir.
