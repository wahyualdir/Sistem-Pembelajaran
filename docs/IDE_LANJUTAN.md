# Ide Lanjutan dan Fitur Masa Depan (Backlog Peta Pulau)

Fitur-fitur dan ide di bawah ini sengaja ditunda dan tidak diimplementasikan pada tahap rilis Peta Pulau saat ini, sesuai klausul 10.4 `docs/INSTRUKSI_PETA_PULAU.md`:

1. **Prasyarat Pulau Berbentuk Graf Percabangan**: Saat ini aturan prasyarat linear sederhana digunakan (`chapter_unlocked`). Percabangan topik non-linear (directed acyclic graph) dapat dipertimbangkan pada versi lanjutan.
2. **Podcast Multi-Pembicara / Dua Narator**: Saat ini podcast ringkasan bab dibatasi satu narator untuk kejelasan dan efisiensi sintesis suara.
3. **Regenerasi Sebagian Kartu / Segmen Tunggal via AI**: Pembuatan draf kartu/naskah saat ini dilakukan per kumpulan dokumen bab secara holistik.
4. **Lampiran Berkas dan Tautan Eksternal di Tukar Keahlian**: Ditunda demi keamanan akademik, pencegahan kecurangan, dan kepatuhan anti-spam.
5. **Mode Flashcard Luring (Offline PWA/ServiceWorker)**: Ditunda; sinkronisasi saat ini mengandalkan koneksi aktif dengan mekanisme debounce dan kunci idempotensi `client_id`.
6. **Integrasi Kuis Bab ke Buku Nilai (Gradebook)**: Kuis bab saat ini murni berfungsi sebagai syarat pembuka pulau dan pengukur kekuatan topik (latihan adaptif), bukan sebagai komponen bobot nilai formal perkuliahan.
7. **Berbagi Rekap Semester ke Media Sosial**: Ditunda untuk menjaga ketenangan suasana belajar dan mencegah perbandingan antar-mahasiswa.
8. **Analisis Komparatif Antar-Semester pada Rekap**: Ditunda; saat ini fokus pada refleksi pribadi satu semester berjalan.


---

# Ide Lanjutan dan Fitur Masa Depan (Backlog Kain Semester)

Sesuai panduan `docs/INSTRUKSI_KAIN_SEMESTER.md`, fitur-fitur dan temuan di bawah ini sengaja ditunda dan tidak dimasukkan ke dalam ruang lingkup saat ini:

1. **Data Banner Beranda Hardcoded**:
   - Lokasi: `src/modules/academic/home-actions.ts` fungsi `getHomeBannerAction()`.
   - Temuan: Menampilkan data kuis contoh yang ditulis langsung di kode (`quiz-mid-2026`, "Kuis Evaluasi Tengah Semester Web Modern").
   - Rekomendasi masa depan: Hubungkan dengan tabel `quizzes` aktif via Supabase query bila fitur pengumuman kuis riil ingin ditampilkan di banner.

2. **Model Prisma Legacy Tak Terpakai**:
   - Lokasi: `prisma/schema.prisma` model `Presensi`, `Pertemuan`, `Tugas`, dan `PengumpulanTugas`.
   - Temuan: Model ini merupakan sisa arsitektur SIAKAD lama. Seluruh kode aplikasi aktif di `src/` menggunakan tabel Supabase (`attendance_sessions`, `attendance_records`, `assignments`, `submissions`).
   - Rekomendasi masa depan: Bersihkan skema Prisma lama pada jadwal refaktor pembersihan basis data jika sudah tidak ada dependensi eksternal.

3. **Halaman Presensi Detail**:
   - Membuka halaman rekapitulasi kehadiran per mata kuliah dengan riwayat jam check-in, metode validasi (QR/GPS/Izin), dan rekapitulasi persentase absensi.

4. **Ekspor "Kain Akhir Semester" (Sertifikat / Kartu Visual)**:
   - Mahasiswa dapat mengunduh atau membagikan kisi semester lengkap mereka dalam bentuk gambar / kartu pencapaian di halaman `/achievements` pada akhir pekan ke-16.

5. **Ornamen & Pola Motif Budaya Melayu Riau**:
   - Penambahan aksen tenun pucuk rebung atau selembayung pada header dan legenda kain semester untuk memperkuat identitas budaya kampus Universitas Islam Riau secara elegan dan kontekstual.
