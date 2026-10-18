# SIAJAR — Kebijakan Privasi Data Aktivitas Belajar Mahasiswa

Versi 1.0 · Oktober 2026 · Dokumen Resmi Kepatuhan Pelindungan Data Pribadi (UU PDP)

Dokumen ini menjelaskan secara transparan pengelolaan rekaman aktivitas belajar mahasiswa pada sub-sistem pembelajaran mandiri SIAJAR (Peta Pulau, Flashcard, Podcast Materi, dan Tukar Keahlian).

---

## 1. Prinsip Dasar Pelindungan Data

SIAJAR menganut prinsip *Privacy by Design* dan pemisahan data fungsional (*True Data Decoupling*). Aktivitas belajar mandiri mahasiswa dicatat semata-mata untuk mendukung proses belajar pribadi, bukan sebagai alat pengawasan, penilaian, perankingan, atau pemeringkatan.

> [!IMPORTANT]
> **PERNYATAAN TEGAS KEADILAN AKADEMIK**:
> Rekaman log aktivitas belajar mandiri mahasiswa **TIDAK PERNAH dan DILARANG KERAS** digunakan oleh dosen, program studi, maupun institusi sebagai komponen penilaian akademik, dasar absensi perkuliahan, alat perankingan, atau instrumen penghukuman mahasiswa.

---

## 2. Data Apa yang Dicatat (*Data Whitelist*)

Sistem hanya mencatat kejadian aktivitas yang masuk dalam **daftar putih (*whitelist*) resmi** berikut:
1. `chapter_view`: Waktu membuka dan mempelajari modul materi suatu bab pulau.
2. `quiz_complete`: Hasil capaian dan durasi pengerjaan kuis bab untuk pemetaan kekuatan topik.
3. `flashcard_review`: Riwayat ulasan kartu konsep Leitner (rating pemahaman 1–4 dan tanggal ulasan).
4. `podcast_progress`: Posisi putar terakhir dan durasi mendengarkan audio narasi materi.
5. `skill_exchange_interaction`: Partisipasi terbuka di forum bantuan belajar teman sekelas.

**Data yang TIDAK PERNAH dicatat**:
- Sistem tidak pernah melacak aktivitas di luar tab aplikasi SIAJAR.
- Sistem tidak pernah merekam pengetikan tombol (keystroke logging) pada modul belajar mandiri.
- Sistem tidak pernah merekam kamera atau audio mahasiswa saat belajar mandiri.
- Sistem tidak pernah mencatat riwayat penjelajahan situs internet lain.

---

## 3. Tujuan Pengolahan Data

Pengolahan data aktivitas ditujukan murni untuk manfaat pedagogis mahasiswa:
1. **Pengulangan Berkala (*Spaced Repetition*)**: Menentukan jadwal kemunculan kartu flashcard pada 5 kotak Leitner (jeda 1, 2, 4, 8, dan 16 hari) agar daya ingat konsep bertahan jangka panjang.
2. **Prioritas Belajar Harian**: Menyajikan kartu *Prioritas Hari Ini* di Beranda (maksimal 5 butir dengan alasan transparan) untuk membantu mahasiswa mengelola beban belajar.
3. **Penyusunan Rekap Semester**: Menghasilkan ringkasan pribadi di akhir semester mengenai pencapaian bab, topik yang dikuasai, dan konsistensi kebiasaan belajar autentik.

---

## 4. Masa Simpan Data (*Data Retention*)

- Masa simpan bawaan untuk log aktivitas mentah (`activity_events`) adalah **365 hari (1 tahun)**.
- Pekerjaan terjadwal harian `activity_purge` yang dieksekusi setiap pukul 02.00 WIB secara otomatis membersihkan seluruh rekaman aktivitas yang telah melampaui masa simpan 365 hari.
- Mahasiswa dapat mempercepat pembersihan data ini kapan saja melalui hak hapus mandiri.

---

## 5. Siapa yang Dapat Mengakses Data?

| Entitas Pengguna | Akses Log Aktivitas Mentah (`activity_events`) | Akses Rekap Semester Individu | Akses Data Agregat Kelas |
|---|---|---|---|
| **Mahasiswa Pemilik** | **Penuh (Hanya Data Pribadi)** | **Penuh (Hanya Milik Pribadi)** | Tidak ada |
| **Mahasiswa Lain** | **DITOLAK (RLS)** | **DITOLAK (RLS)** | Tidak ada |
| **Dosen Pengampu** | **DITOLAK (RLS)** | **DITOLAK (RLS)** | Agregat kelas (tingkat kelulusan bab & topik sulit) |
| **Asisten Dosen** | **DITOLAK (RLS)** | **DITOLAK (RLS)** | Agregat praktikum kelas binaan |
| **Kaprodi & Staf** | **DITOLAK (RLS)** | **DITOLAK (RLS)** | Agregat prodi dengan batasan K-Anonymity (N ≥ 5) |
| **System Admin** | **DITOLAK (RLS)** | **DITOLAK (RLS)** | Metrik teknis server tanpa data akademik |
| **Super Admin** | **DITOLAK (RLS)** | **DITOLAK (RLS)** | Agregat kampus untuk adopsi kurikulum |

Semua pembatasan di atas ditegakkan secara permanen pada level mesin basis data melalui kebijakan PostgreSQL *Row-Level Security* (RLS). Klien peramban tidak dapat mem-bypass batasan ini meskipun memanggil query langsung.

---

## 6. Hak Kendali Penuh Mahasiswa

Setiap mahasiswa memiliki 4 hak otonom atas data belajarnya melalui menu **Privasi** (`/transparency`):

1. **Hak Melihat (*Right to Inspect*)**:
   - Mahasiswa dapat memeriksa seluruh log aktivitas yang tercatat atas namanya secara transparan.
2. **Hak Mengunduh (*Right to Portability*)**:
   - Mahasiswa dapat mengekspor dan mengunduh seluruh berkas arsip data aktivitas belajar dalam format JSON atau CSV.
3. **Hak Menghapus Mandiri (*Right to Erasure*)**:
   - Tombol **Hapus Riwayat Saya** tersedia di menu Privasi. Menekan tombol ini akan menghapus seluruh rekaman log aktivitas, riwayat kartu flashcard, progres pemutar podcast, dan rekapitulasi semester secara permanen (*hard delete*).
4. **Hak Mematikan Pencatatan (*Right to Opt-Out*)**:
   - Mahasiswa dapat mematikan sakelar *"Catat aktivitas belajar mandiri"* di menu Pengaturan / Privasi.
   - Bila pencatatan dimatikan:
     - Sistem berhenti menyimpan rekaman log `activity_events`.
     - Rekap Semester tetap berfungsi namun hanya menyajikan data fungsional kelulusan bab pulau tanpa mencantumkan estimasi jam belajar maupun hari aktif, disertai catatan transparan: *"Pencatatan aktivitas dimatikan oleh mahasiswa."*
