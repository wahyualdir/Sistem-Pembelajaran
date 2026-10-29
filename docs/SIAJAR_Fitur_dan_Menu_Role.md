# SIAJAR — Spesifikasi Lengkap Fitur dan Menu Setiap Role

> **Status Dokumen**: Terverifikasi Sesuai Basis Kode Aktif (`src/lib/config/menu-config.ts` dan Fase P0 - Tahap 3 Peta Pulau)  
> **Berkas Terkait**: 
> - [SIAJAR_Fitur_dan_Menu_Role.pdf](./SIAJAR_Fitur_dan_Menu_Role.pdf)
> - [SIAJAR_Fitur_dan_Menu_Role.xlsx](./SIAJAR_Fitur_dan_Menu_Role.xlsx)
> - [SIAJAR_Fitur_dan_Menu_Role.csv](./SIAJAR_Fitur_dan_Menu_Role.csv)
> - [SIAJAR_Fitur_dan_Menu_Role.html](./SIAJAR_Fitur_dan_Menu_Role.html)

---

## 1. Ringkasan Eksekutif dan Struktur Otorisasi

Sistem **SIAJAR (Sistem Informasi Ajar Terpadu)** mengimplementasikan arsitektur otorisasi bertingkat berbasis *Role-Based Access Control* (RBAC) dan *PostgreSQL Row-Level Security* (RLS) dengan pemisahan wewenang ketat. Seluruh navigasi antarmuka dikendalikan secara deklaratif melalui konfigurasi tunggal terpusat di `src/lib/config/menu-config.ts`.

Total terdapat **125 butir menu dan fungsionalitas terdefinisi** yang tersebar di **9 peran utama** dan **1 grup menu bersama**:

```
                       ┌───────────────────────────────┐
                       │          SIAJAR LMS           │
                       └──────────────┬────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │ (Akademik dan Belajar)     │ (Tata Kelola Prodi/Staf)   │ (Infrastruktur dan Institusi)
         ▼                            ▼                            ▼
  ┌──────────────┐             ┌──────────────┐             ┌──────────────┐
  │  Mahasiswa   │             │  Koordinator │             │ System Admin │
  │  (STUDENT)   │             │    Prodi     │             │(SYSTEM_ADMIN)│
  └──────┬───────┘             └──────┬───────┘             └──────┬───────┘
         │                            │                            │
  ┌──────▼───────┐             ┌──────▼───────┐             ┌──────▼───────┐
  │Asisten Dosen │             │Staf Akademik │             │ Super Admin  │
  │     (TA)     │             │    (BAAK)    │             │(SUPER_ADMIN) │
  └──────┬───────┘             └──────────────┘             └──────────────┘
         │
  ┌──────▼───────┐
  │Dosen Pengampu│
  │  (LECTURER)  │
  └──────────────┘
```

---

## 2. Rincian Fitur dan Menu per Role

### 2.1. Mahasiswa (`STUDENT`)
Pengguna sentral aktivitas pembelajaran mandiri dan kolaboratif.

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| Utama | **Beranda** | `/student` | `GraduationCap` | - | Halaman kerja personal mahasiswa yang menampilkan ringkasan kelas semester aktif, jadwal kuliah hari ini, tugas mendekati tenggat, pengumuman terbaru, status streak belajar harian WIB, serta filter cepat kategori tugas, kuis, ujian, presensi, jadwal, dan nilai. |
| Utama | **Kalender** | `/calendar` | `CalendarDays` | - | Kalender perkuliahan terintegrasi yang menyajikan jadwal tatap muka mingguan, batas waktu pengumpulan tugas atau kuis, jadwal ujian UTS dan UAS, serta tautan sinkronisasi umpan iCal. |
| Utama | **Notifikasi** | `/notifications` | `Bell` | `unreadCount` | Pusat pemberitahuan kegiatan kelas, rilis materi kuliah, publikasi nilai tugas, pengingat tenggat tugas otomatis, konfirmasi presensi, dan peringatan keamanan sesi masuk dari perangkat baru. |
| Utama | **Pengumuman** | `/announcements` | `Megaphone` | - | Papan pengumuman resmi tingkat universitas, fakultas, program studi, dan kelas dengan pencatatan riwayat keterbacaan mahasiswa. |
| Belajar | **Kelas Saya** | `/classes` | `Layers` | - | Ruang pembelajaran mata kuliah aktif dan arsip: modul materi terstruktur dengan rilis terjadwal dan pelacakan progres sekuensial, penugasan individu dan kelompok dengan perpanjangan tenggat, tautan konferensi video terverifikasi, forum diskusi kelas, serta daftar peserta. |
| Belajar | **Presensi** | `/attendance` | `CalendarCheck2` | - | Pencatatan presensi kehadiran pertemuan 1 sampai 16 menggunakan kode sesi atau QR dinamis dengan validasi radius lokasi GPS, riwayat kehadiran, pengajuan izin dan sakit berlampiran surat bukti medis, serta peringatan kehadiran kurang dari 75% sebagai syarat kelayakan ujian. |
| Belajar | **Ujian** | `/exams` | `FileCheck2` | - | Evaluasi terstandarisasi Computer Based Test untuk kuis, UTS, dan UAS: token akses dinamis, penyimpanan otomatis jawaban lokal (IndexedDB) dengan sinkronisasi server, proteksi kecurangan (deteksi perpindahan tab dan kehilangan fokus jendela), serta pengujian kode pemrograman berbasis autograder sandbox. |
| Belajar | **Perpustakaan** | `/library` | `Library` | - | Katalog repositori modul ajar digital, buku referensi perkuliahan, panduan praktikum laboratorium, dan karya ilmiah pendukung belajar. |
| Belajar | **Tanya AI** | `/ai-assistant` | `Sparkles` | - | Asisten belajar berbasis Retrieval-Augmented Generation yang menjawab pertanyaan konsep materi mata kuliah berdasarkan modul ajar resmi kelas; akses diblokir secara otomatis saat mahasiswa sedang menempuh sesi ujian CBT aktif. |
| Belajar | **Pesan** | `/messages` | `MessageCircle` | `unreadMessages` | Komunikasi terarah perkuliahan: percakapan privat dengan dosen dan asisten kelas, pemesanan sesi konsultasi akademik pada slot waktu luang dosen, serta penegakan jam tenang malam hari (21.00 sampai 06.00 WIB) untuk menjaga kenyamanan komunikasi akademik. |
| Belajar | **Flashcard** | `/flashcards` | `Brain` | `flashcardsDue` | Modul belajar mandiri menggunakan sistem pengulangan berkala (spaced repetition) 5 kotak Leitner: kartu pintar otomatis dibuat dari butir materi modul dan bank soal, pembatasan 20 kartu baru per hari, antarmuka ulasan ramah ponsel, dan pelacakan retensi daya ingat mahasiswa tanpa tekanan nilai. |
| Belajar | **Tukar Keahlian** | `/skill-exchange` | `HandHelping` | `openHelpRequests` | Ruang kolaborasi tanya jawab terstruktur antarmahasiswa sekelas berbasis kekuatan topik: mahasiswa dengan level topik kuat membantu teman yang memerlukan latihan, penandaan jawaban terbantu (+50 XP), tanpa pesan pribadi, pembersihan otomatis tautan eksternal, dan penonaktifan sementara saat ujian/kuis berlangsung (blackout). |
| Nilai | **Nilai Saya** | `/grades` | `CheckSquare` | - | Lembar nilai komprehensif per mata kuliah: rincian skor tugas, kuis, UTS, dan UAS, skor penalti keterlambatan, visualisasi capaian pembelajaran lulusan (CPL dan CPMK), serta formulir pengajuan sanggahan nilai resmi dalam batas waktu 7 hari sejak nilai dipublikasikan. |
| Nilai | **Pencapaian** | `/achievements` | `Trophy` | - | Riwayat gamifikasi akademik: akumulasi poin pengalaman (XP) dari ketepatan waktu pengumpulan tugas dan penyelesaian materi, lencana prestasi belajar, serta rekor streak keaktifan belajar mingguan. |
| Nilai | **Sertifikat** | `/certificates` | `Award` | - | Portofolio akademik digital yang memuat sertifikat kompetensi, keikutsertaan kepanitiaan, atau asisten laboratorium terverifikasi dengan kode verifikasi publik. |
| Lainnya | **Komunitas** | `/community` | `MessageSquare` | - | Forum interaksi akademik terbuka antarmahasiswa lintas kelas dan program studi untuk diskusi keilmuan, kegiatan kemahasiswaan, dan pertukaran informasi belajar. |
| Lainnya | **Evaluasi Dosen** | `/evaluations` | `ClipboardCheck` | `pendingEvaluations` | Pengisian instrumen evaluasi dosen oleh mahasiswa (EDOM) di akhir semester dengan perlindungan anonimitas mutlak: pencatatan status pengisian dan respon survei dipisahkan secara struktural tanpa tautan identitas mahasiswa. |
| Lainnya | **Pengajuan** | `/requests` | `FilePlus2` | - | Layanan administrasi akademik mandiri: pengajuan surat keterangan mahasiswa aktif, dispensasi kegiatan, cuti akademik, dan legalisasi transkrip nilai resmi yang langsung terhubung ke staf akademik. |

---

### 2.2. Asisten Dosen (`TEACHING_ASSISTANT`)
Peran hibrida: mahasiswa yang mengemban tugas asistensi praktikum di bawah supervisi dosen pengampu.

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| Utama | **Beranda** | `/ta` | `GraduationCap` | - | Halaman kerja asisten dosen: ringkasan kelas praktikum yang dibina, jumlah penugasan mahasiswa yang menunggu pemeriksaan draf, jadwal asistensi laboratorium, dan agenda kelas hari ini. |
| Utama | **Kalender** | `/calendar` | `CalendarDays` | - | Kalender gabungan jadwal memandu sesi praktikum laboratorium, batas waktu koreksi tugas, dan jadwal kuliah pribadi. |
| Utama | **Notifikasi** | `/notifications` | `Bell` | `unreadCount` | Pemberitahuan pengumpulan tugas praktikum mahasiswa, penugasan asisten dari dosen, instruksi penilaian, dan pengumuman akademik. |
| Utama | **Pengumuman** | `/announcements` | `Megaphone` | - | Pengumuman akademik universitas, fakultas, dan program studi terkait pelaksanaan praktikum dan perkuliahan. |
| Asistensi | **Kelas Asistensi** | `/ta/classes` | `Layers` | - | Manajemen rombongan belajar praktikum: memantau materi modul praktikum, daftar anggota kelas, dan pembukaan sesi presensi tatap muka jika telah diberi kewenangan oleh dosen pengampu. |
| Asistensi | **Koreksi** | `/ta/grading` | `ClipboardList` | `taGradingCount` | Penilaian draf jawaban tugas mahasiswa menggunakan kriteria rubrik terstruktur, pemberian catatan umpan balik formatif, dan perhitungan penalti keterlambatan otomatis. |
| Asistensi | **Pantau Ujian** | `/ta/exam-monitor` | `ShieldAlert` | - | Pengawasan ruang ujian CBT: telemetri status pengerjaan peserta ujian, penayangan token dinamis yang berotasi berkala, serta deteksi log peringatan perpindahan layar peramban. |
| Belajar | **Kelas Saya** | `/classes` | `Layers` | - | Akses ruang pembelajaran perkuliahan mata kuliah reguler yang diikuti sebagai mahasiswa. |
| Belajar | **Presensi** | `/attendance` | `CalendarCheck2` | - | Presensi kehadiran perkuliahan pribadi sebagai mahasiswa dan pengajuan izin atau sakit. |
| Belajar | **Ujian** | `/exams` | `FileCheck2` | - | Ruang ujian CBT untuk menempuh ujian mata kuliah yang diambil sebagai mahasiswa. |
| Belajar | **Perpustakaan** | `/library` | `Library` | - | Akses repositori buku referensi dan modul praktikum kampus. |
| Belajar | **Tanya AI** | `/ai-assistant` | `Sparkles` | - | Asisten studi interaktif berbasis dokumen materi perkuliahan. |
| Belajar | **Pesan** | `/messages` | `MessageCircle` | `unreadMessages` | Komunikasi dengan dosen pembina asistensi dan mahasiswa praktikan pada kelas binaan. |
| Belajar | **Flashcard** | `/flashcards` | `Brain` | `flashcardsDue` | Akses modul pengulangan berkala Leitner untuk memperdalam pemahaman materi praktikum dan mendampingi mahasiswa di laboratorium. |
| Belajar | **Tukar Keahlian** | `/skill-exchange` | `HandHelping` | `openHelpRequests` | Pemantauan forum tanya jawab topik materi praktikum, pendampingan penjelasan konsep, dan moderasi diskusi bantuan antarmahasiswa. |
| Nilai | **Nilai Saya** | `/grades` | `CheckSquare` | - | Buku nilai akademik pribadi mahasiswa beserta capaian CPL dan opsi sanggahan nilai. |
| Nilai | **Pencapaian** | `/achievements` | `Trophy` | - | Perolehan poin XP, streak belajar harian, dan lencana kompetensi akademik pribadi. |
| Nilai | **Sertifikat** | `/certificates` | `Award` | - | Sertifikat digital surat keputusan asisten laboratorium dan keikutsertaan kegiatan akademik. |
| Lainnya | **Komunitas** | `/community` | `MessageSquare` | - | Forum interaksi mahasiswa untuk diskusi akademik dan kemahasiswaan. |
| Lainnya | **Evaluasi Dosen** | `/evaluations` | `ClipboardCheck` | `pendingEvaluations` | Survei kepuasan mahasiswa atas pengajaran dosen yang diikuti secara anonim. |
| Lainnya | **Pengajuan** | `/requests` | `FilePlus2` | - | Layanan pengajuan surat administrasi mahasiswa ke bagian akademik kampus. |

---

### 2.3. Dosen Pengampu (`LECTURER`)
Pengelola utama ruang perkuliahan, penyusun materi ajar, penguji evaluasi, dan pemegang wewenang nilai mutu kelas.

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| Utama | **Beranda** | `/lecturer` | `LayoutDashboard` | - | Ruang kerja dosen pengampu: ringkasan kelas semester aktif, jadwal tatap muka hari ini, tingkat kehadiran mahasiswa, pengumpulan tugas yang memerlukan pemeriksaan, dan keterisian berita acara perkuliahan. |
| Utama | **Kalender** | `/calendar` | `CalendarDays` | - | Jadwal terpadu perkuliahan rutin, batas akhir pengisian nilai ujian, agenda bimbingan perwalian, dan jadwal pelaksanaan evaluasi kuis atau ujian. |
| Utama | **Notifikasi** | `/notifications` | `Bell` | `unreadCount` | Pemberitahuan pengumpulan tugas baru, permohonan izin atau sakit mahasiswa, pengajuan sanggahan nilai, dan persetujuan revisi nilai pasca-final dari Kaprodi. |
| Utama | **Pengumuman** | `/announcements` | `Megaphone` | - | Penerbitan pengumuman resmi bertarget spesifik kelas diampu atau pengumuman lingkup program studi. |
| Mengajar | **Kelas Saya** | `/classes` | `Layers` | - | Pengelolaan ruang perkuliahan: unggah materi dengan rilis terjadwal dan pelacakan progres, pembuatan tugas individu dan kelompok, pengaturan penalti keterlambatan dan perpanjangan tenggat, penyalinan isi kelas antarsemeester (cloning dengan pergeseran tanggal), serta pengarsipan kelas menjadi hanya-baca. |
| Mengajar | **Presensi** | `/attendance` | `CalendarCheck2` | - | Pengelolaan presensi tatap muka pertemuan 1 sampai 16: pembukaan sesi dengan QR dinamis atau kode sesi berbatas waktu, penetapan radius lokasi GPS, validasi permohonan izin dan sakit mahasiswa dengan lampiran surat, serta pemantauan syarat batas kehadiran minimal 75%. |
| Mengajar | **Berita Acara** | `/lecturer/journals` | `NotebookPen` | - | Pengisian berita acara perkuliahan harian per pertemuan: materi yang diajarkan, kesesuaian dengan Rencana Pembelajaran Semester, metode pembelajaran, catatan kendala kelas, serta pemetaan CPMK dalam tenggat 3 hari pasca-tatap muka. |
| Mengajar | **Tinjau Konten** | `/lecturer/content-review` | `BadgeCheck` | `contentPendingReview` | Dasbor peninjauan dan persetujuan materi hasil olahan AI (Flashcard & Podcast Audio): verifikasi skor keterikatan sumber (grounding score), penyuntingan kartu draf, persetujuan naskah narasi podcast 450-900 kata, antarmuka navigasi cepat papan tombol (A/E/R/J/K), dan persetujuan kebijakan kepatuhan sebelum penerbitan konten ke mahasiswa. |
| Mengajar | **Perpustakaan** | `/library` | `Library` | - | Publikasi dan pengelolaan modul kuliah, buku ajar, diktat praktikum, dan materi referensi ilmiah institusi. |
| Ujian dan Nilai | **Ujian dan Kuis** | `/exams` | `PlusCircle` | - | Perancangan dan penyelenggaraan evaluasi CBT: konfigurasi durasi, jadwal buka-tutup, token akses dinamis, pengacakan soal, aturan proctoring, serta penambahan waktu khusus bagi peserta ujian remedial atau susulan. |
| Ujian dan Nilai | **Bank Soal** | `/exams/question-bank` | `FolderArchive` | - | Repositori butir soal dosen (pilihan ganda, benar salah, isian singkat, esai, dan koding dengan unit test), fitur impor massal dari templat Excel dengan validasi dropdown dan Word DOCX berbasis pola pembersihan HTML (anti-XSS), deteksi duplikasi hash teks, serta ekspor-impor format standar Moodle XML dan paket QTI 2.1 zip. |
| Ujian dan Nilai | **Periksa Jawaban** | `/exams/review` | `CheckSquare` | `lecturerReviewCount` | Penilaian manual jawaban esai dan peninjauan kode pemrograman mahasiswa dengan bantuan rubrik terstruktur, eksekusi sandbox autograder, serta pemeriksa kemiripan teks shingling dan winnowing. |
| Ujian dan Nilai | **Analisis Soal** | `/exams/analysis` | `BarChart3` | - | Analisis psikometri butir soal ujian pasca-pelaksanaan: tingkat kesukaran soal, daya pembeda butir, efektivitas distraktor pilihan ganda, dan indeks reliabilitas instrumen evaluasi (KR-20). |
| Ujian dan Nilai | **Rubrik** | `/lecturer/rubrics` | `ListChecks` | - | Penyusunan rubrik penilaian analitik bertingkat: perumusan kriteria evaluasi, penetapan deskriptor skor, dan penautan kriteria langsung ke tugas kuliah atau soal esai. |
| Ujian dan Nilai | **Buku Nilai** | `/analytics` | `Table2` | - | Rekapitulasi nilai berbobot persentase dinamis (Tugas, Kuis, UTS, UAS = 100%), konversi huruf mutu otomatis (A sampai E), pemetaan capaian CPMK dan CPL, ekspor lembar nilai Excel/CSV, finalisasi buku nilai permanen, serta pengajuan revisi nilai pasca-finalisasi ke Kaprodi. |
| Ujian dan Nilai | **Sanggahan** | `/lecturer/disputes` | `MessageSquareWarning` | `disputeCount` | Penanganan sanggahan nilai resmi yang diajukan mahasiswa dalam jendela waktu 7 hari: peninjauan alasan mahasiswa, pemeriksaan riwayat log penilaian, persetujuan penyesuaian skor, atau penolakan dengan penjelasan tertulis. |
| Lainnya | **Pesan** | `/messages` | `MessageCircle` | `unreadMessages` | Komunikasi terarah perkuliahan: percakapan pesan dengan mahasiswa dan asisten, penyediaan slot waktu konsultasi akademik, jajak pendapat kilat (live poll) anonim di kelas, dan kepatuhan jam tenang (21.00 sampai 06.00 WIB). |
| Lainnya | **Mahasiswa Bimbingan** | `/lecturer/mentoring` | `Users` | - | Panel dosen penasihat akademik: pemantauan perkembangan indeks prestasi semester dan kumulatif mahasiswa bimbingan, rekap absensi, dan deteksi peringatan dini mahasiswa berisiko akademik. |
| Lainnya | **Hasil Evaluasi** | `/lecturer/evaluations` | `ClipboardCheck` | - | Rekapitulasi instrumen evaluasi dosen oleh mahasiswa pada kelas yang diampu: skor rata-rata per kelompok pertanyaan dan tanggapan teks yang disajikan secara acak setelah periode evaluasi resmi ditutup (dengan syarat minimal 5 responden). |
| Lainnya | **Komunitas** | `/community` | `MessageSquare` | - | Forum komunikasi akademik antardosen, koordinasi pengajaran laboratorium, dan diskusi mutu pembelajaran. |

---

### 2.4. Koordinator Program Studi (`PROGRAM_COORDINATOR`)
Penjamin mutu kurikulum, pembagian beban dosen, pemantauan keterlaksanaan pembelajaran, dan pemutus permohonan revisi nilai.

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| Utama | **Beranda** | `/coordinator` | `Compass` | - | Tinjauan mutu pembelajaran program studi: statistik kelulusan, sebaran IPK mahasiswa, pemenuhan Rencana Pembelajaran Semester, distribusi beban SKS dosen pengampu, dan keterisian evaluasi dosen. |
| Utama | **Kalender** | `/calendar` | `CalendarDays` | - | Agenda kalender program studi: batas akhir pengisian nilai dosen, jadwal rapat evaluasi kurikulum, dan kalender yudisium program studi. |
| Utama | **Notifikasi** | `/notifications` | `Bell` | `unreadCount` | Notifikasi permohonan revisi nilai pasca-final dari dosen pengampu, keterlambatan pengisian berita acara dosen, dan penutupan periode evaluasi dosen. |
| Utama | **Pengumuman** | `/announcements` | `Megaphone` | - | Publikasi pengumuman khusus kepada seluruh dosen pengampu dan mahasiswa di bawah naungan program studi. |
| Prodi | **Kurikulum** | `/coordinator/curriculum` | `BookOpen` | - | Tata kelola kurikulum berbasis Outcome-Based Education: penetapan Capaian Pembelajaran Lulusan (CPL), Capaian Pembelajaran Mata Kuliah (CPMK), matriks pemetaan ketercapaian, dan pengaturan prasyarat mata kuliah dengan deteksi otomatis prasyarat melingkar. |
| Prodi | **Mata Kuliah** | `/coordinator/courses` | `Layers` | - | Master mata kuliah program studi: penetapan kode mata kuliah, nama, bobot SKS (teori dan praktikum), silabus acuan, dan status penawaran semester. |
| Prodi | **Penugasan Dosen** | `/coordinator/assignments` | `Users` | - | Plotting penugasan dosen pengampu pada rombongan belajar kelas semester aktif, pembagian tim dosen, dan pemantauan batas maksimal beban SKS mengajar dosen. |
| Prodi | **Evaluasi Dosen** | `/coordinator/evaluations` | `ClipboardCheck` | - | Manajemen periode survei evaluasi dosen oleh mahasiswa: penyusunan kuesioner instrumen dari templat, pembukaan periode survei, pemantauan kelengkapan pengisian per kelas, moderasi komentar teks yang melanggar tata tertib dengan alasan ter-audit, serta analisis agregat hasil evaluasi dosen. |
| Pantauan | **Perkuliahan** | `/coordinator/monitoring` | `Activity` | - | Pemantauan keterlaksanaan tatap muka perkuliahan: kepatuhan pengisian berita acara pertemuan 1 sampai 16 oleh dosen, ketepatan jadwal mengajar, dan persentase kehadiran kelas. |
| Pantauan | **Mahasiswa Berisiko** | `/coordinator/monitoring/at-risk` | `AlertCircle` | - | Sistem peringatan dini akademik: identifikasi otomatis mahasiswa yang berpotensi drop-out berdasarkan IPK kurang dari 2.00, kehadiran perkuliahan kurang dari 75%, atau ketidakaktifan pengumpulan tugas kuliah. |
| Persetujuan | **Persetujuan Nilai** | `/coordinator/approvals` | `CheckCircle2` | `coordinatorApprovalsCount` | Otorisasi permohonan revisi nilai pasca-final yang diajukan oleh dosen pengampu: penelaahan bukti dan alasan revisi sebelum diteruskan ke staf akademik untuk eksekusi pembaruan nilai. |
| Persetujuan | **Laporan** | `/coordinator/reports` | `FileSpreadsheet` | - | Penerbitan laporan ketercapaian CPL program studi, rekapitulasi distribusi nilai mata kuliah, laporan evaluasi dosen, dan ekspor data penjaminan mutu akreditasi. |

---


### 2.5. Sekretaris Program Studi (`PROGRAM_SECRETARY`)
Membantu Koordinator Program Studi dalam operasional dan verifikasi akademik tingkat program studi.

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| - | Beranda | `/secretary` | LayoutDashboard | - | Ruang kerja operasional Sekprodi: metrik kelas, pengajuan masuk, dan risiko mahasiswa. |
| - | Kalender | `/calendar` | CalendarDays | - | Kalender agenda akademik prodi dan jadwal kuliah. |
| - | Notifikasi | `/notifications` | Bell | unreadCount | Pusat notifikasi operasional perkuliahan dan verifikasi pengajuan. |
| - | Pengumuman | `/announcements` | Megaphone | - | Papan pengumuman resmi tingkat universitas, fakultas, dan program studi. |
| Tata Kelola | Monitoring Prodi | `/secretary/monitoring` | Activity | - | Pemantauan keterisian berita acara dan progres perkuliahan kelas prodi (hanya-baca). |
| Tata Kelola | Jadwal dan Penugasan Kelas | `/secretary/classes` | CalendarClock | - | Penataan jadwal kuliah bebas bentrok dan penugasan dosen pengampu kelas prodi. |
| Tata Kelola | Perwalian | `/secretary/advisory` | Users | - | Penetapan dan penggantian Dosen Wali untuk mahasiswa prodi secara terpadu. |
| Tata Kelola | Pengajuan | `/secretary/requests` | FileCheck | - | Verifikasi administratif berkas pengajuan mahasiswa (dilarang menyetujui perubahan nilai). |
| Tata Kelola | Risiko Mahasiswa | `/secretary/risk` | AlertTriangle | - | Pemantauan sistem peringatan dini (EWS) mahasiswa berisiko kendala studi pada prodi. |
| Tata Kelola | Laporan Akademik | `/secretary/reports` | FileSpreadsheet | - | Akses dan ekspor rekapitulasi data akademik dan nilai prodi. |

---

### 2.6. Kepala Laboratorium (`LAB_HEAD`)
Pengelola fasilitas sarana praktikum dan pimpinan asisten laboratorium.

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| - | Beranda | `/lab` | LayoutDashboard | - | Ruang kerja Kepala Lab: ringkasan kelas praktikum, kapasitas ruang, dan asisten lab aktif. |
| - | Kalender | `/calendar` | CalendarDays | - | Kalender jadwal praktikum dan penggunaan ruang laboratorium. |
| - | Notifikasi | `/notifications` | Bell | unreadCount | Pemberitahuan kegiatan praktikum dan instruksi laboratorium. |
| - | Pengumuman | `/announcements` | Megaphone | - | Pengumuman tata tertib dan instruksi keselamatan kerja laboratorium. |
| Kelola Lab | Laboratorium Saya | `/lab/profile` | FlaskConical | - | Profil fasilitas laboratorium, daftar ruang terkait, dan inventaris praktikum. |
| Kelola Lab | Asisten Lab | `/lab/assistants` | Users | - | Penugasan, pengaturan wewenang, dan pencabutan Asisten Laboratorium pada kelas tertaut. |
| Kelola Lab | Kelas Praktikum | `/lab/classes` | Layers | - | Pemantauan rombongan belajar praktikum yang terselenggara di laboratorium ini. |
| Kelola Lab | Jadwal & Penggunaan Lab | `/lab/schedules` | CalendarClock | - | Pemantauan slot pemakaian ruang laboratorium perkuliahan secara langsung. |
| Kelola Lab | Rekap Praktikum | `/lab/recap` | FileSpreadsheet | - | Rekapitulasi presensi praktikan dan nilai praktikum (hanya-baca, tanpa hak finalisasi). |

---

### 2.7. Staf Akademik (`ACADEMIC_STAFF`)
Operator tata usaha akademik universitas: master data, penjadwalan bebas bentrok, pembentukan kelas, dan pemrosesan pengajuan surat.

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| Utama | **Beranda** | `/staff` | `LayoutDashboard` | - | Ruang kerja operasional administrasi akademik: statistik mahasiswa aktif per angkatan, status penjadwalan ruang kuliah, antrean verifikasi pengajuan surat mahasiswa, dan agenda operasional harian. |
| Utama | **Kalender** | `/calendar` | `CalendarDays` | - | Kalender akademik institusi: penetapan periode pengisian KRS, awal dan akhir perkuliahan, minggu tenang perkuliahan, serta jadwal resmi pelaksanaan UTS dan UAS. |
| Utama | **Notifikasi** | `/notifications` | `Bell` | `unreadCount` | Pemberitahuan pengajuan surat mahasiswa baru, pengesahan jadwal kuliah dari Kaprodi, dan keputusan persetujuan revisi nilai yang siap dieksekusi ke pangkalan data. |
| Data Induk | **Mahasiswa** | `/staff/master/students` | `Users` | - | Tata kelola data induk mahasiswa: pengelolaan biodata, NIM, program studi, status akademik (aktif, cuti, lulus, drop-out), penetapan dosen wali perwalian, serta impor massal data mahasiswa via format CSV dengan validasi baris. |
| Data Induk | **Dosen** | `/staff/master/lecturers` | `UserCheck` | - | Manajemen data induk dosen pengajar: biodata, NIDN atau NIP, homebase program studi, kepangkatan akademik fungsional, dan status keaktifan mengajar. |
| Data Induk | **Data Akademik** | `/staff/master` | `Database` | - | Pengelolaan data referensi institusi: master program studi, master semester akademik aktif dan lampau, serta master ruang perkuliahan beserta kapasitas daya tampung dan titik koordinat geofencing GPS. |
| Akademik | **Jadwal** | `/staff/schedules` | `CalendarClock` | - | Penyusunan jadwal tatap muka perkuliahan dan ujian resmi yang dilengkapi mesin pendeteksi bentrok otomatis terhadap jadwal mengajar dosen, pemakaian ruang kuliah, dan rombongan belajar mahasiswa. |
| Akademik | **Kelas dan Peserta** | `/staff/classes` | `Layers` | - | Pembentukan rombel kelas perkuliahan, penetapan daya tampung kuota, pendaftaran mahasiswa peserta kelas secara kolektif, pemindahan kelas mahasiswa, penutupan semester (arsip massal kelas menjadi hanya-baca), serta pembatalan arsip dengan alasan ter-audit. |
| Akademik | **Nilai dan Presensi** | `/staff/grades` | `CheckSquare` | - | Rekapitulasi nilai perkuliahan institusional, pengawasan penguncian buku nilai kelas oleh dosen, eksekusi pembaruan nilai mahasiswa pasca-persetujuan Kaprodi, dan penerbitan rekapitulasi kehadiran mahasiswa. |
| Layanan | **Pengajuan Masuk** | `/staff/services/verification` | `FileText` | `requestCount` | Pemrosesan permohonan surat administrasi mahasiswa: verifikasi berkas pengajuan surat keterangan aktif kuliah, surat dispensasi izin, permohonan cuti akademik, dan legalisasi transkrip nilai resmi ber-QR code. |
| Layanan | **Pengumuman dan Acara** | `/staff/announcements` | `Megaphone` | - | Publikasi agenda resmi universitas, kalender registrasi ulang semester, edaran administratif, dan pengumuman wisuda ke seluruh sivitas. |
| Layanan | **Berkas dan Sertifikat** | `/staff/content` | `BookOpen` | - | Manajemen templat dokumen resmi institusi, formulir akademik, serta penerbitan dan penandatanganan sertifikat kompetensi digital kampus. |
| Layanan | **Moderasi** | `/staff/moderation` | `MessageSquare` | - | Penegakan tata tertib forum interaksi komunitas kampus: peninjauan laporan postingan bernada melanggar, penyembunyian konten, dan pemberian sanksi teguran etika. |

---

### 2.8. System Administrator (`SYSTEM_ADMIN`)
Pengelola infrastruktur, keandalan server, integrasi sistem, dan perimeter keamanan siber (dilarang mengakses data nilai akademik).

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| Utama | **Beranda** | `/admin/system` | `Server` | - | Panel telemetri keandalan sistem dan infrastruktur: utilisasi memori dan CPU server, kapasitas penyimpanan berkas Supabase Storage, status PgBouncer pooler basis data, dan antrean pekerjaan terjadwal. |
| Utama | **Notifikasi** | `/notifications` | `Bell` | `unreadCount` | Peringatan teknis darurat: kegagalan eksekusi cron job, anomali beban lonjakan koneksi basis data, kesalahan autograder sandbox koding, dan peringatan sisa kapasitas ruang penyimpanan. |
| Server | **Pemantauan** | `/admin/system/monitoring` | `Activity` | - | Pemantauan telemetri waktu nyata: uptime layanan, latensi response time server action, metrik eksekusi query PostgreSQL, status sinkronisasi Realtime websocket, dan pelacakan galat aplikasi. |
| Server | **Integrasi** | `/admin/system/integrations` | `Globe` | - | Manajemen integrasi layanan eksternal: konfigurasi Google OAuth Client, pengaturan private bucket Supabase Storage, webhook eksternal, rotasi rahasia CRON_SECRET, dan konektor sandbox Judge autograder. |
| Keamanan | **Sesi Login** | `/admin/system/security` | `Lock` | - | Perimeter keamanan sistem: pemantauan sesi login terdaftar, aturan pembatasan laju percobaan login (anti-brute-force 5 kali gagal berurutan kunci 15 menit), serta pencabutan sesi darurat pengguna yang terindikasi kompromi. |
| Keamanan | **Cadangan Data** | `/admin/system/backup` | `FolderArchive` | - | Pemeliharaan cadangan data: jadwal pencadangan otomatis skema publik basis data, riwayat berkas snapshot cadangan, dan prosedur uji pemulihan data untuk menjaga keberlangsungan layanan. |
| Pengaturan | **Pengaturan Sistem** | `/admin/system/settings` | `Sliders` | - | Konfigurasi platform global: domain email yang diizinkan, mode pemeliharaan, batas ukuran unggah berkas, dan pengaturan feature flags aplikasi. |
| Pengaturan | **Log Audit** | `/admin/system/audit` | `ScrollText` | - | Pemeriksaan rekaman audit log sistem yang disamarkan: mencatat waktu, aktor, peran, aksi, alamat IP, dan user-agent; nilai perubahan data entitas akademik sensitif disembunyikan untuk menjaga kerahasiaan akademik. |

---

### 2.9. Super Administrator (`SUPER_ADMIN`)
Otoritas tertinggi institusi: tata kelola pengguna, matriks perizinan, kebijakan akademik kampus, dan pengawasan audit.

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| Utama | **Beranda** | `/admin` | `LayoutDashboard` | - | Ruang kerja eksekutif institusi: rekapitulasi menyeluruh sivitas akademika universitas, sebaran mahasiswa aktif antarfakultas dan prodi, rasio dosen terhadap mahasiswa, indeks kepatuhan perkuliahan, dan ringkasan audit sistem. |
| Utama | **Notifikasi** | `/notifications` | `Bell` | `unreadCount` | Pemberitahuan strategis institusi, eskalasi insiden keamanan sistem, serta notifikasi aktivitas audit tingkat tinggi. |
| Pengguna | **Akun Pengguna** | `/admin/users` | `Users` | - | Manajemen seluruh akun pengguna institusi: aktivasi, penangguhan, reset kata sandi darurat, dan sesi impersonasi hanya-lihat (maksimal 30 menit dengan alasan ter-audit) untuk investigasi kendala operasional. |
| Pengguna | **Peran dan Akses** | `/admin/roles` | `ShieldAlert` | - | Tata kelola matriks Role-Based Access Control: penugasan multi-peran pengguna, penetapan cakupan peran (GLOBAL, PROGRAM, CLASS), dan pengawasan izin akses fungsional. |
| Aturan Kampus | **Aturan Akademik** | `/admin/policies` | `Scale` | - | Konfigurasi kebijakan akademik institusi terpusat: batas minimal kehadiran ujian (bawaan 75%), jendela waktu sanggah nilai (7 hari), mode perlakuan izin presensi, retensi bukti surat sakit (180 hari), batas keterisian berita acara (3 hari), toleransi keterlambatan ujian CBT, minimal responden evaluasi dosen (5 orang), serta ambang batas kemiripan tugas. |
| Aturan Kampus | **Pengumuman Kampus** | `/admin/announcements` | `Megaphone` | - | Penerbitan pengumuman resmi pimpinan universitas dan rektorat yang disiarkan langsung ke seluruh akun pengguna di lingkungan kampus. |
| Sistem | **Pemantauan** | `/admin/system/monitoring` | `Activity` | - | Akses shared sub-hub pemantauan telemetri keandalan server, latensi tindakan server, dan metrik kinerja kueri basis data. |
| Sistem | **Integrasi** | `/admin/system/integrations` | `Globe` | - | Akses shared sub-hub konfigurasi OAuth, pengelolaan bucket berkas privat, dan pemantauan webhook eksternal. |
| Sistem | **Sesi Login** | `/admin/system/security` | `Lock` | - | Akses shared sub-hub pengawasan perimeter keamanan, pelacakan sesi login lintas akun, dan audit pencabutan sesi darurat. |
| Sistem | **Cadangan Data** | `/admin/system/backup` | `FolderArchive` | - | Akses shared sub-hub penjadwalan cadangan skema publik dan pengelolaan arsip pemulihan data institusi. |
| Sistem | **Pengaturan Sistem** | `/admin/system/settings` | `Sliders` | - | Akses shared sub-hub konfigurasi tingkat sistem, sakelar pemeliharaan, dan feature flags platform. |
| Sistem | **Log Audit** | `/admin/system/audit` | `ScrollText` | - | Pemeriksaan rekaman audit log utuh tanpa penyamaran: merekam seluruh riwayat perubahan data akademik, perubahan nilai, keputusan persetujuan, dan jejak aktivitas impersonasi. |

---

### 2.8. Menu Bersama Seluruh Role (`Akun`)
Grup menu akun di bagian bawah bilah sisi yang selalu dapat diakses oleh seluruh 7 peran.

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
| Akun | **Pengaturan** | `/settings` | `Settings` | - | Pengaturan preferensi antarmuka pengguna: mode tampilan (Terang, Gelap, Ikuti Sistem), tingkat kerapatan elemen layar, bahasa, serta preferensi aktivasi saluran notifikasi per jenis kegiatan. |
| Akun | **Bantuan** | `/help` | `LifeBuoy` | - | Panduan operasional terstruktur per peran: alur penugasan dan evaluasi, tata cara presensi GPS dan QR dinamis, mekanisme ujian CBT terawasi, sanggahan nilai, etika konsultasi, dan pusat tanya jawab. |
| Akun | **Privasi** | `/transparency` | `Eye` | - | Kepatuhan Undang-Undang Pelindungan Data Pribadi: ringkasan data profil tersimpan, riwayat perangkat dan sesi aktif, tombol darurat 'Ini bukan saya' untuk mencabut seluruh sesi jika dicurigai adanya kompromi akun, serta riwayat persetujuan privasi. |

---


## 3. Matriks Otorisasi Sistem

Berikut adalah ketetapan otorisasi definitif untuk setiap wewenang dan fungsionalitas di lingkungan SIAJAR (termasuk Matriks Hak Akses Peta Pulau Bagian 10.1):

- **Peta Pulau**: Dosen/TA mengatur bab dan prasyarat; Mahasiswa melihat peta visual/daftar & mengerjakan kuis bab; Kaprodi melihat agregat per kelas (K-Anonymity N ≥ 5).
- **Flashcard Leitner**: Dosen/AI membuat kartu & dosen meninjau; Mahasiswa mengulas kartu berstatus terbit; Kaprodi melihat adopsi.
- **Podcast Audio**: Dosen menerbitkan naskah dan suara; Mahasiswa memutar pada pulau yang terbuka dengan transkrip.
- **Tukar Keahlian**: Mahasiswa ikut serta per kelas (opt-in); Dosen memantau/moderasi; Staf menangani laporan; terblokir selama asesmen aktif (blackout).
- **Log aktivitas mentah**: hanya pemilik data (mahasiswa); tidak ada peran lain.
- **Rekap Semester**: hanya pemilik data (mahasiswa); bersifat pribadi, tenang, tanpa perbandingan.
- **Laporan penggunaan & adopsi**: Kaprodi (prodinya, agregat dengan masking < 5), Super Admin (seluruh kampus, agregat).
- **Sakelar fitur**: Dosen per kelas; Super Admin global.
- **Akses ruang kelas**: Mahasiswa dan Asisten (terdaftar), Dosen (pengampu), Kaprodi (pantauan prodi), Staf (administrasi kelas), System Admin (tidak ada), Super Admin (hanya lewat impersonasi hanya-lihat).
- **Skor dan koreksi**: Mahasiswa tidak ada; Asisten draf; Dosen draf dan final; Kaprodi, Staf, System Admin, Super Admin tidak ada.
- **Finalisasi buku nilai**: hanya Dosen pemilik kelas.
- **Revisi nilai pasca-final**: Dosen mengajukan; Kaprodi memutuskan; Staf mengeksekusi; Super Admin hak audit.
- **Sanggah nilai**: Mahasiswa mengajukan; Dosen memutuskan; Kaprodi melihat jumlah; lainnya tidak ada.
- **Buka sesi presensi**: Dosen; Asisten bila can_open_attendance diberikan dosen; Kaprodi dan Staf hanya pantau.
- **Izin dan sakit**: Mahasiswa mengajukan; Dosen kelas terkait memutuskan; lainnya tidak ada akses isi.
- **Berita acara**: Dosen menulis; Asisten baca; Kaprodi dan Staf baca dan ekspor.
- **Kelompok tugas**: Dosen mengatur; Mahasiswa bergabung sesuai mode; Asisten baca dan draf skor.
- **Rubrik**: Dosen mengelola; Asisten memakai; Mahasiswa membaca rubrik tugasnya.
- **Ujian**: Dosen membuat dan mengatur; Asisten memantau dan menampilkan token; Dosen menambah waktu peserta.
- **Analisis soal**: Dosen pengampu; Asisten baca.
- **Cek kemiripan**: Dosen; Asisten bila diizinkan dosen.
- **Kurikulum, CPL, CPMK**: Kaprodi mengelola; Dosen memetakan penilaian ke CPMK; Super Admin kebijakan global.
- **Penjadwalan dan kuota kelas**: Staf.
- **Evaluasi dosen**: Kaprodi mengelola periode dan melihat agregat; Dosen melihat hasil sendiri; Mahasiswa mengisi anonim.
- **Pesan dan konsultasi**: Mahasiswa, Asisten, Dosen sesuai aturan jam tenang; Staf hanya salinan laporan; admin tidak ada.
- **Polling**: Dosen membuat; Mahasiswa kelas menjawab.
- **Pengajuan surat**: Mahasiswa mengajukan; Staf memproses.
- **Kelola master pengguna**: Staf (mahasiswa dan dosen); Super Admin penuh.
- **Infrastruktur dan log audit**: System Admin (log disamarkan untuk entitas akademik); Super Admin penuh.
- **Impersonasi**: hanya Super Admin, hanya-lihat, maksimal 30 menit, dengan alasan.
