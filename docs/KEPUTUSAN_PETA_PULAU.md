# Catatan Keputusan Teknis dan Desain Fitur Peta Pulau

Dokumen ini mencatat keputusan desain dan teknis yang diambil selama implementasi fitur Peta Pulau di SIAJAR sesuai panduan fail-closed dan aman.

---

## 1. Fase P0: Fondasi dan Menu
- **Keputusan**: Penambahan menu navigasi disesuaikan dengan instruksi Bagian 5: Mahasiswa (+2: Flashcard, Tukar Keahlian), Asisten Dosen (+2: Flashcard, Tukar Keahlian), dan Dosen (+1: Tinjau Konten). Total menu menjadi tepat 107 butir (102 sebelumnya + 5 butir baru).
- **Rasional**: Memastikan konsistensi penomoran menu di seluruh portal SIAJAR tanpa menambah menu redundan pada peran lain yang tidak terdampak (Staf, Kaprodi, Admin).
- **Ikon Menu**: Menggunakan ikon standar `lucide-react` yang sudah terverifikasi ada (`Brain`, `HandHelping`, `BadgeCheck`).

## 2. Struktur Data Tabel & RLS
- **Keputusan**: Kolom `chapter_id` ditambahkan ke `materials`, `quizzes`, `assignments`, dan `topic_id` ke `quiz_questions` sebagai kolom nullable agar tidak merusak data perkuliahan yang sudah ada.
- **Rasional**: Konten yang belum dikaitkan ke bab tetap dapat diakses di bagian perkuliahan umum tanpa terkunci.
- **Isolasi Log Aktivitas**: Tabel `activity_events` tidak diberi izin `SELECT` langsung kepada Dosen, Asisten, Kaprodi, maupun Admin. Akses pelaporan hanya dilayani melalui fungsi RPC agregat dengan masking ambang minimum `< 5` mahasiswa untuk melindungi privasi.
