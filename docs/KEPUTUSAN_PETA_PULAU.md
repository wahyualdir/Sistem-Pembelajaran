# Catatan Keputusan Teknis dan Desain Fitur Peta Pulau

Dokumen ini mencatat keputusan desain dan teknis yang diambil selama implementasi fitur Peta Pulau di SIAJAR sesuai panduan fail-closed dan aman.

---

## 1. Fase P0: Fondasi dan Navigasi
- **Keputusan**: Penambahan menu navigasi disesuaikan dengan instruksi Bagian 5: Mahasiswa (+2: Flashcard, Tukar Keahlian), Asisten Dosen (+2: Flashcard, Tukar Keahlian), dan Dosen (+1: Tinjau Konten). Total menu menjadi tepat 107 butir (102 sebelumnya + 5 butir baru).
- **Rasional**: Memastikan konsistensi penomoran menu di seluruh portal SIAJAR tanpa menambah menu redundan pada peran lain yang tidak terdampak (Staf, Kaprodi, Admin).
- **Ikon Menu**: Menggunakan ikon standar `lucide-react` yang sudah terverifikasi ada (`Brain`, `HandHelping`, `BadgeCheck`).
- **Pengait Bab**: Kolom `chapter_id` ditambahkan ke `materials`, `quizzes`, `assignments`, dan `topic_id` ke `quiz_questions` sebagai kolom nullable agar tidak merusak data perkuliahan yang sudah ada.
- **Isolasi Log Aktivitas**: Tabel `activity_events` tidak diberi izin `SELECT` langsung kepada Dosen, Asisten, Kaprodi, maupun Admin. Akses pelaporan hanya dilayani melalui fungsi RPC agregat dengan masking ambang minimum `< 5` mahasiswa untuk melindungi privasi.

---

## 2. Tahap 1: Inti Belajar, Peta Visual, & Prioritas Hari Ini
- **Prasyarat Linear**: Aturan keterbukaan pulau ditegakkan secara terpusat oleh fungsi `chapter_unlocked(student, chapter)`. Bab berikutnya terbuka jika seluruh bab wajib sebelumnya telah lulus kuis bab (skor terbaik ≥ ambang kelulusan, bawaan 70%).
- **Aksesibilitas Tampilan Ganda (SVG & Daftar)**: Setiap tampilan peta visual pulau wajib memiliki sakelar "Tampilan Daftar" (`table-list`). Layar sempit dan pembaca layar otomatis diarahkan ke tampilan daftar secara elegan tanpa pustaka visual 3D yang berat.
- **Prioritas Hari Ini Transparan**: Kartu *Prioritas Hari Ini* di Beranda dihitung menggunakan formula aturan eksplisit berbasis bobot waktu (tenggat tugas, kartu Leitner jatuh tempo, dan target bab), bukan menggunakan tebakan model AI, maksimal menyajikan 5 butir penting dengan alasan singkat.

---

## 3. Tahap 2: Flashcard Leitner, Tinjau AI, & Podcast Audio
- **Sistem Kotak Leitner**: Menggunakan 5 kotak dengan interval pengulangan berurutan 1, 2, 4, 8, dan 16 hari kalender WIB. Batas harian diatur 20 kartu baru dan 100 kartu ulasan per hari untuk menjaga konsistensi belajar tanpa beban kognitif berlebih.
- **Prinsip Fail-Closed AI & TTS**: Ketiadaan kunci API (`GEMINI_API_KEY`, `OPENAI_API_KEY`, atau `TTS_API_KEY`) secara otomatis menonaktifkan tombol pembuatan dengan banner informatif. Sistem dilarang mengembalikan data dummy tebakan saat kredensial tidak valid.
- **Persetujuan Naskah Sebelum Suara**: Dosen wajib memeriksa dan menyetujui draf naskah narasi (450–900 kata) sebelum suara narator disintesis. Pemutar audio di drawer pulau selalu menampilkan transkrip berdampingan dengan audio player.
- **Pintasan Keyboard Dosen**: Menambahkan navigasi papan tombol cepat pada antarmuka Tinjau Konten (`A` untuk Setuju, `E` untuk Sunting, `R` untuk Tolak, `J`/`K` untuk berpindah butir) demi kenyamanan dosen pengampu.

---

## 4. Tahap 3: Sosial (Tukar Keahlian), Rekap Semester, & K-Anonymity
- **Larangan Pesan Pribadi Antarmahasiswa**: Forum Tukar Keahlian dirancang sebagai diskusi terstruktur berbasis topik. Pesan langsung (private messaging) antarmahasiswa tetap dilarang keras di seluruh portal SIAJAR.
- **Pembersihan Tautan & Blackout Asesmen**: Tautan URL eksternal dan lampiran file dibersihkan secara otomatis untuk mencegah spam dan kecurangan akademik. Fitur Tukar Keahlian otomatis dibekukan (*blackout*) saat ujian atau kuis bernilai aktif di kelas.
- **Perlindungan K-Anonymity Kaprodi (N ≥ 5)**: Seluruh metrik agregat per kelas pada laporan Kaprodi yang memiliki mahasiswa terdaftar kurang dari 5 wajib disamarkan (`< 5 (Privasi Terjaga)`).
- **Rekap Semester Retro-Brutalist**: Disematkan sebagai tab di menu **Pencapaian**, menyajikan data capaian pribadi dengan bahasa tenang, tanpa perbandingan sosial, tanpa peringkat nilai, dan tanpa tombol bagikan.
