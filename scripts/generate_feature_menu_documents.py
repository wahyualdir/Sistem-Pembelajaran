import os
import subprocess
import shutil
import pandas as pd

# Data lengkap 102 butir fitur dan menu untuk setiap role di SIAJAR (Fase 0 - Fase 7)
# Bebas dari kata dan pola terlarang (Bagian 4 & 6)
DATA = [
    # ==========================================
    # 1. STUDENT (16 Menu Items)
    # ==========================================
    {
        "No": 1,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "-",
        "Menu_Item": "Beranda",
        "Route_Path": "/student",
        "Icon": "GraduationCap",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Halaman kerja personal mahasiswa yang menampilkan ringkasan kelas semester aktif, jadwal kuliah hari ini, tugas mendekati tenggat, pengumuman terbaru, status streak belajar harian WIB, serta filter cepat kategori tugas, kuis, ujian, presensi, jadwal, dan nilai.",
        "Batasan_Wewenang": "Hanya dapat melihat data pribadi dan kelas yang diikuti secara sah."
    },
    {
        "No": 2,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "-",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Kalender perkuliahan terintegrasi yang menyajikan jadwal tatap muka mingguan, batas waktu pengumpulan tugas atau kuis, jadwal ujian UTS dan UAS, serta tautan sinkronisasi umpan iCal.",
        "Batasan_Wewenang": "Hanya dapat melihat jadwal kegiatan akademik kelas terdaftar."
    },
    {
        "No": 3,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "-",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadCount",
        "Deskripsi_Fitur": "Pusat pemberitahuan kegiatan kelas, rilis materi kuliah, publikasi nilai tugas, pengingat tenggat tugas otomatis, konfirmasi presensi, dan peringatan keamanan sesi masuk dari perangkat baru.",
        "Batasan_Wewenang": "Dapat menandai notifikasi telah dibaca dan mengatur preferensi notifikasi personal."
    },
    {
        "No": 4,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "-",
        "Menu_Item": "Pengumuman",
        "Route_Path": "/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Papan pengumuman resmi tingkat universitas, fakultas, program studi, dan kelas dengan pencatatan riwayat keterbacaan mahasiswa.",
        "Batasan_Wewenang": "Membaca pengumuman yang ditujukan untuk mahasiswa atau program studi terkait."
    },
    {
        "No": 5,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Belajar",
        "Menu_Item": "Kelas Saya",
        "Route_Path": "/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Ruang pembelajaran mata kuliah aktif dan arsip: modul materi terstruktur dengan rilis terjadwal dan pelacakan progres sekuensial, penugasan individu dan kelompok dengan perpanjangan tenggat, tautan konferensi video terverifikasi, forum diskusi kelas, serta daftar peserta.",
        "Batasan_Wewenang": "Mengakses materi dan mengumpulkan tugas pada kelas aktif; kelas berstatus diarsipkan bersifat hanya-baca."
    },
    {
        "No": 6,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Belajar",
        "Menu_Item": "Presensi",
        "Route_Path": "/attendance",
        "Icon": "CalendarCheck2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pencatatan presensi kehadiran pertemuan 1 sampai 16 menggunakan kode sesi atau QR dinamis dengan validasi radius lokasi GPS, riwayat kehadiran, pengajuan izin dan sakit berlampiran surat bukti medis, serta peringatan kehadiran kurang dari 75% sebagai syarat kelayakan ujian.",
        "Batasan_Wewenang": "Hanya dapat mencatat kehadiran saat sesi presensi dibuka oleh dosen dan mengajukan permohonan izin atau sakit."
    },
    {
        "No": 7,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Belajar",
        "Menu_Item": "Ujian",
        "Route_Path": "/exams",
        "Icon": "FileCheck2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Evaluasi terstandarisasi Computer Based Test untuk kuis, UTS, dan UAS: token akses dinamis, penyimpanan otomatis jawaban lokal (IndexedDB) dengan sinkronisasi server, proteksi kecurangan (deteksi perpindahan tab dan kehilangan fokus jendela), serta pengujian kode pemrograman berbasis autograder sandbox.",
        "Batasan_Wewenang": "Hanya dapat mengikuti kuis atau ujian saat jadwal dibuka dan syarat kehadiran minimal 75% terpenuhi."
    },
    {
        "No": 8,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Belajar",
        "Menu_Item": "Perpustakaan",
        "Route_Path": "/library",
        "Icon": "Library",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Katalog repositori modul ajar digital, buku referensi perkuliahan, panduan praktikum laboratorium, dan karya ilmiah pendukung belajar.",
        "Batasan_Wewenang": "Dapat mengunduh dan membaca materi pustaka terbuka universitas."
    },
    {
        "No": 9,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Belajar",
        "Menu_Item": "Tanya AI",
        "Route_Path": "/ai-assistant",
        "Icon": "Sparkles",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Asisten belajar berbasis Retrieval-Augmented Generation yang menjawab pertanyaan konsep materi mata kuliah berdasarkan modul ajar resmi kelas; akses diblokir secara otomatis saat mahasiswa sedang menempuh sesi ujian CBT aktif.",
        "Batasan_Wewenang": "Mengajukan pertanyaan terkait bahan ajar kelas yang diikuti di luar jam ujian."
    },
    {
        "No": 10,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Belajar",
        "Menu_Item": "Pesan",
        "Route_Path": "/messages",
        "Icon": "MessageCircle",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadMessages",
        "Deskripsi_Fitur": "Komunikasi terarah perkuliahan: percakapan privat dengan dosen dan asisten kelas, pemesanan sesi konsultasi akademik pada slot waktu luang dosen, serta penegakan jam tenang malam hari (21.00 sampai 06.00 WIB) untuk menjaga kenyamanan komunikasi akademik.",
        "Batasan_Wewenang": "Mengirim pesan kepada dosen pengampu, asisten kelas, atau rekan sekelas; memesan slot konsultasi terbuka."
    },
    {
        "No": 11,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Belajar",
        "Menu_Item": "Flashcard",
        "Route_Path": "/flashcards",
        "Icon": "Brain",
        "Is_Shortcut": False,
        "Badge_Counter": "flashcardsDue",
        "Deskripsi_Fitur": "Modul belajar mandiri menggunakan sistem pengulangan berkala (spaced repetition) 5 kotak Leitner: kartu pintar otomatis dibuat dari butir materi modul dan bank soal, pembatasan 20 kartu baru per hari, antarmuka ulasan ramah ponsel, dan pelacakan retensi daya ingat mahasiswa tanpa tekanan nilai.",
        "Batasan_Wewenang": "Hanya dapat mengakses deck dan kartu yang telah diterbitkan dosen pada kelas yang terdaftar."
    },
    {
        "No": 12,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Belajar",
        "Menu_Item": "Tukar Keahlian",
        "Route_Path": "/skill-exchange",
        "Icon": "HandHelping",
        "Is_Shortcut": False,
        "Badge_Counter": "openHelpRequests",
        "Deskripsi_Fitur": "Ruang kolaborasi tanya jawab terstruktur antarmahasiswa sekelas berbasis kekuatan topik: mahasiswa dengan level topik kuat membantu teman yang memerlukan latihan, penandaan jawaban terbantu (+50 XP), tanpa pesan pribadi, pembersihan otomatis tautan eksternal, dan penonaktifan sementara saat ujian/kuis berlangsung (blackout).",
        "Batasan_Wewenang": "Hanya dapat mengajukan pertanyaan dan membantu rekan pada kelas yang sama; fitur terkunci saat asesmen aktif."
    },
    {
        "No": 13,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Nilai",
        "Menu_Item": "Nilai Saya",
        "Route_Path": "/grades",
        "Icon": "CheckSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Lembar nilai komprehensif per mata kuliah: rincian skor tugas, kuis, UTS, dan UAS, skor penalti keterlambatan, visualisasi capaian pembelajaran lulusan (CPL dan CPMK), serta formulir pengajuan sanggahan nilai resmi dalam batas waktu 7 hari sejak nilai dipublikasikan.",
        "Batasan_Wewenang": "Membaca nilai mata kuliah yang diambil dan mengajukan sanggahan nilai."
    },
    {
        "No": 12,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Nilai",
        "Menu_Item": "Pencapaian",
        "Route_Path": "/achievements",
        "Icon": "Trophy",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Riwayat gamifikasi akademik: akumulasi poin pengalaman (XP) dari ketepatan waktu pengumpulan tugas dan penyelesaian materi, lencana prestasi belajar, serta rekor streak keaktifan belajar mingguan.",
        "Batasan_Wewenang": "Melihat capaian poin, lencana, dan streak belajar pribadi."
    },
    {
        "No": 13,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Nilai",
        "Menu_Item": "Sertifikat",
        "Route_Path": "/certificates",
        "Icon": "Award",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Portofolio akademik digital yang memuat sertifikat kompetensi, keikutsertaan kepanitiaan, atau asisten laboratorium terverifikasi dengan kode verifikasi publik.",
        "Batasan_Wewenang": "Mengunduh berkas sertifikat resmi dan membagikan tautan verifikasi."
    },
    {
        "No": 14,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Komunitas",
        "Route_Path": "/community",
        "Icon": "MessageSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Forum interaksi akademik terbuka antarmahasiswa lintas kelas dan program studi untuk diskusi keilmuan, kegiatan kemahasiswaan, dan pertukaran informasi belajar.",
        "Batasan_Wewenang": "Membuat postingan diskusi, menanggapi utas rekan, dan melaporkan konten yang melanggar etika."
    },
    {
        "No": 15,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Evaluasi Dosen",
        "Route_Path": "/evaluations",
        "Icon": "ClipboardCheck",
        "Is_Shortcut": False,
        "Badge_Counter": "pendingEvaluations",
        "Deskripsi_Fitur": "Pengisian instrumen evaluasi dosen oleh mahasiswa (EDOM) di akhir semester dengan perlindungan anonimitas mutlak: pencatatan status pengisian dan respon survei dipisahkan secara struktural tanpa tautan identitas mahasiswa.",
        "Batasan_Wewenang": "Mengisi kuesioner evaluasi dosen untuk kelas yang diikuti selama periode survei dibuka."
    },
    {
        "No": 16,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Pengajuan",
        "Route_Path": "/requests",
        "Icon": "FilePlus2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Layanan administrasi akademik mandiri: pengajuan surat keterangan mahasiswa aktif, dispensasi kegiatan, cuti akademik, dan legalisasi transkrip nilai resmi yang langsung terhubung ke staf akademik.",
        "Batasan_Wewenang": "Mengajukan permohonan surat administrasi dan memantau status penyelesaiannya."
    },

    # ==========================================
    # 2. TEACHING_ASSISTANT (19 Menu Items)
    # ==========================================
    {
        "No": 17,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "-",
        "Menu_Item": "Beranda",
        "Route_Path": "/ta",
        "Icon": "GraduationCap",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Halaman kerja asisten dosen: ringkasan kelas praktikum yang dibina, jumlah penugasan mahasiswa yang menunggu pemeriksaan draf, jadwal asistensi laboratorium, dan agenda kelas hari ini.",
        "Batasan_Wewenang": "Memantau aktivitas asistensi pada rombongan belajar yang ditugaskan."
    },
    {
        "No": 18,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "-",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Kalender gabungan jadwal memandu sesi praktikum laboratorium, batas waktu koreksi tugas, dan jadwal kuliah pribadi.",
        "Batasan_Wewenang": "Melihat jadwal asistensi dan jadwal perkuliahan pribadi."
    },
    {
        "No": 19,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "-",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadCount",
        "Deskripsi_Fitur": "Pemberitahuan pengumpulan tugas praktikum mahasiswa, penugasan asisten dari dosen, instruksi penilaian, dan pengumuman akademik.",
        "Batasan_Wewenang": "Membaca dan menandai notifikasi asistensi."
    },
    {
        "No": 20,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "-",
        "Menu_Item": "Pengumuman",
        "Route_Path": "/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengumuman akademik universitas, fakultas, dan program studi terkait pelaksanaan praktikum dan perkuliahan.",
        "Batasan_Wewenang": "Membaca pengumuman resmi institusi."
    },
    {
        "No": 21,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Asistensi",
        "Menu_Item": "Kelas Asistensi",
        "Route_Path": "/ta/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen rombongan belajar praktikum: memantau materi modul praktikum, daftar anggota kelas, dan pembukaan sesi presensi tatap muka jika telah diberi kewenangan oleh dosen pengampu.",
        "Batasan_Wewenang": "Terbatas pada kelas yang terdaftar dalam penetapan asisten; dilarang memfinalisasi nilai akhir."
    },
    {
        "No": 22,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Asistensi",
        "Menu_Item": "Koreksi",
        "Route_Path": "/ta/grading",
        "Icon": "ClipboardList",
        "Is_Shortcut": False,
        "Badge_Counter": "taGradingCount",
        "Deskripsi_Fitur": "Penilaian draf jawaban tugas mahasiswa menggunakan kriteria rubrik terstruktur, pemberian catatan umpan balik formatif, dan perhitungan penalti keterlambatan otomatis.",
        "Batasan_Wewenang": "Memberikan skor draf; pengesahan dan publikasi nilai final tetap menjadi wewenang dosen pengampu."
    },
    {
        "No": 23,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Asistensi",
        "Menu_Item": "Pantau Ujian",
        "Route_Path": "/ta/exam-monitor",
        "Icon": "ShieldAlert",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengawasan ruang ujian CBT: telemetri status pengerjaan peserta ujian, penayangan token dinamis yang berotasi berkala, serta deteksi log peringatan perpindahan layar peramban.",
        "Batasan_Wewenang": "Memantau jalannya ujian kelas asistensi; tidak berwenang mengubah kunci jawaban atau bobot soal."
    },
    {
        "No": 24,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Belajar",
        "Menu_Item": "Kelas Saya",
        "Route_Path": "/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses ruang pembelajaran perkuliahan mata kuliah reguler yang diikuti sebagai mahasiswa.",
        "Batasan_Wewenang": "Mengikuti proses belajar mengajar pada kelas terdaftar."
    },
    {
        "No": 25,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Belajar",
        "Menu_Item": "Presensi",
        "Route_Path": "/attendance",
        "Icon": "CalendarCheck2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Presensi kehadiran perkuliahan pribadi sebagai mahasiswa dan pengajuan izin atau sakit.",
        "Batasan_Wewenang": "Mengisi presensi kelas mahasiswa terdaftar."
    },
    {
        "No": 26,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Belajar",
        "Menu_Item": "Ujian",
        "Route_Path": "/exams",
        "Icon": "FileCheck2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Ruang ujian CBT untuk menempuh ujian mata kuliah yang diambil sebagai mahasiswa.",
        "Batasan_Wewenang": "Mengerjakan ujian kelas yang diambil."
    },
    {
        "No": 27,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Belajar",
        "Menu_Item": "Perpustakaan",
        "Route_Path": "/library",
        "Icon": "Library",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses repositori buku referensi dan modul praktikum kampus.",
        "Batasan_Wewenang": "Membaca dan mengunduh referensi terbuka."
    },
    {
        "No": 28,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Belajar",
        "Menu_Item": "Tanya AI",
        "Route_Path": "/ai-assistant",
        "Icon": "Sparkles",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Asisten studi interaktif berbasis dokumen materi perkuliahan.",
        "Batasan_Wewenang": "Mengajukan pertanyaan bahan ajar perkuliahan pribadi."
    },
    {
        "No": 29,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Belajar",
        "Menu_Item": "Pesan",
        "Route_Path": "/messages",
        "Icon": "MessageCircle",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadMessages",
        "Deskripsi_Fitur": "Komunikasi dengan dosen pembina asistensi dan mahasiswa praktikan pada kelas binaan.",
        "Batasan_Wewenang": "Berkirim pesan dalam batas aturan jam tenang (21.00 sampai 06.00 WIB)."
    },
    {
        "No": 30,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Belajar",
        "Menu_Item": "Flashcard",
        "Route_Path": "/flashcards",
        "Icon": "Brain",
        "Is_Shortcut": False,
        "Badge_Counter": "flashcardsDue",
        "Deskripsi_Fitur": "Akses modul pengulangan berkala Leitner untuk memperdalam pemahaman materi praktikum dan mendampingi mahasiswa di laboratorium.",
        "Batasan_Wewenang": "Mengakses flashcard pada kelas asistensi yang ditugaskan."
    },
    {
        "No": 31,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Belajar",
        "Menu_Item": "Tukar Keahlian",
        "Route_Path": "/skill-exchange",
        "Icon": "HandHelping",
        "Is_Shortcut": False,
        "Badge_Counter": "openHelpRequests",
        "Deskripsi_Fitur": "Pemantauan forum tanya jawab topik materi praktikum, pendampingan penjelasan konsep, dan moderasi diskusi bantuan antarmahasiswa.",
        "Batasan_Wewenang": "Dapat memberikan tanggapan bantuan dan menandai laporan pelanggaran di forum Tukar Keahlian kelas asistensi."
    },
    {
        "No": 32,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Nilai",
        "Menu_Item": "Nilai Saya",
        "Route_Path": "/grades",
        "Icon": "CheckSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Buku nilai akademik pribadi mahasiswa beserta capaian CPL dan opsi sanggahan nilai.",
        "Batasan_Wewenang": "Membaca transkrip nilai perkuliahan pribadi."
    },
    {
        "No": 31,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Nilai",
        "Menu_Item": "Pencapaian",
        "Route_Path": "/achievements",
        "Icon": "Trophy",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Perolehan poin XP, streak belajar harian, dan lencana kompetensi akademik pribadi.",
        "Batasan_Wewenang": "Memantau perkembangan reputasi akademik pribadi."
    },
    {
        "No": 32,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Nilai",
        "Menu_Item": "Sertifikat",
        "Route_Path": "/certificates",
        "Icon": "Award",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Sertifikat digital surat keputusan asisten laboratorium dan keikutsertaan kegiatan akademik.",
        "Batasan_Wewenang": "Mengunduh sertifikat penugasan asisten."
    },
    {
        "No": 33,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Komunitas",
        "Route_Path": "/community",
        "Icon": "MessageSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Forum interaksi mahasiswa untuk diskusi akademik dan kemahasiswaan.",
        "Batasan_Wewenang": "Berpartisipasi dalam diskusi komunitas."
    },
    {
        "No": 34,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Evaluasi Dosen",
        "Route_Path": "/evaluations",
        "Icon": "ClipboardCheck",
        "Is_Shortcut": False,
        "Badge_Counter": "pendingEvaluations",
        "Deskripsi_Fitur": "Survei kepuasan mahasiswa atas pengajaran dosen yang diikuti secara anonim.",
        "Batasan_Wewenang": "Mengisi evaluasi dosen kelas terdaftar."
    },
    {
        "No": 35,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Pengajuan",
        "Route_Path": "/requests",
        "Icon": "FilePlus2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Layanan pengajuan surat administrasi mahasiswa ke bagian akademik kampus.",
        "Batasan_Wewenang": "Mengajukan permohonan surat kemahasiswaan."
    },

    # ==========================================
    # 3. LECTURER (19 Menu Items)
    # ==========================================
    {
        "No": 36,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "-",
        "Menu_Item": "Beranda",
        "Route_Path": "/lecturer",
        "Icon": "LayoutDashboard",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Ruang kerja dosen pengampu: ringkasan kelas semester aktif, jadwal tatap muka hari ini, tingkat kehadiran mahasiswa, pengumpulan tugas yang memerlukan pemeriksaan, dan keterisian berita acara perkuliahan.",
        "Batasan_Wewenang": "Mengelola operasional seluruh kelas perkuliahan yang diampu."
    },
    {
        "No": 37,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "-",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Jadwal terpadu perkuliahan rutin, batas akhir pengisian nilai ujian, agenda bimbingan perwalian, dan jadwal pelaksanaan evaluasi kuis atau ujian.",
        "Batasan_Wewenang": "Mengatur jadwal akademik kelas binaan."
    },
    {
        "No": 38,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "-",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadCount",
        "Deskripsi_Fitur": "Pemberitahuan pengumpulan tugas baru, permohonan izin atau sakit mahasiswa, pengajuan sanggahan nilai, dan persetujuan revisi nilai pasca-final dari Kaprodi.",
        "Batasan_Wewenang": "Menerima dan menindaklanjuti pemberitahuan perkuliahan."
    },
    {
        "No": 39,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "-",
        "Menu_Item": "Pengumuman",
        "Route_Path": "/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Penerbitan pengumuman resmi bertarget spesifik kelas diampu atau pengumuman lingkup program studi.",
        "Batasan_Wewenang": "Membuat dan mengelola pengumuman pada kelas yang diampu."
    },
    {
        "No": 40,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Mengajar",
        "Menu_Item": "Kelas Saya",
        "Route_Path": "/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengelolaan ruang perkuliahan: unggah materi dengan rilis terjadwal dan pelacakan progres, pembuatan tugas individu dan kelompok, pengaturan penalti keterlambatan dan perpanjangan tenggat, penyalinan isi kelas antarsemeester (cloning dengan pergeseran tanggal), serta pengarsipan kelas menjadi hanya-baca.",
        "Batasan_Wewenang": "Penuh atas kelas yang diampu; menugaskan asisten dosen dengan kewenangan buka presensi."
    },
    {
        "No": 41,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Mengajar",
        "Menu_Item": "Presensi",
        "Route_Path": "/attendance",
        "Icon": "CalendarCheck2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengelolaan presensi tatap muka pertemuan 1 sampai 16: pembukaan sesi dengan QR dinamis atau kode sesi berbatas waktu, penetapan radius lokasi GPS, validasi permohonan izin dan sakit mahasiswa dengan lampiran surat, serta pemantauan syarat batas kehadiran minimal 75%.",
        "Batasan_Wewenang": "Membuka dan menutup sesi presensi, serta memutuskan permohonan izin atau sakit."
    },
    {
        "No": 42,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Mengajar",
        "Menu_Item": "Berita Acara",
        "Route_Path": "/lecturer/journals",
        "Icon": "NotebookPen",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengisian berita acara perkuliahan harian per pertemuan: materi yang diajarkan, kesesuaian dengan Rencana Pembelajaran Semester, metode pembelajaran, catatan kendala kelas, serta pemetaan CPMK dalam tenggat 3 hari pasca-tatap muka.",
        "Batasan_Wewenang": "Menulis dan mengesahkan berita acara perkuliahan kelas diampu."
    },
    {
        "No": 43,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Mengajar",
        "Menu_Item": "Tinjau Konten",
        "Route_Path": "/lecturer/content-review",
        "Icon": "BadgeCheck",
        "Is_Shortcut": False,
        "Badge_Counter": "contentPendingReview",
        "Deskripsi_Fitur": "Dasbor peninjauan dan persetujuan materi hasil olahan AI (Flashcard & Podcast Audio): verifikasi skor keterikatan sumber (grounding score), penyuntingan kartu draf, persetujuan naskah narasi podcast 450-900 kata, antarmuka navigasi cepat papan tombol (A/E/R/J/K), dan persetujuan kebijakan kepatuhan sebelum penerbitan konten ke mahasiswa.",
        "Batasan_Wewenang": "Hanya dosen pengampu yang berwenang meninjau, menyetujui, menyunting, atau menolak draf flashcard dan naskah podcast di kelasnya."
    },
    {
        "No": 44,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Mengajar",
        "Menu_Item": "Perpustakaan",
        "Route_Path": "/library",
        "Icon": "Library",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Publikasi dan pengelolaan modul kuliah, buku ajar, diktat praktikum, dan materi referensi ilmiah institusi.",
        "Batasan_Wewenang": "Mengunggah dan membagikan bahan ajar ke repositori kampus."
    },
    {
        "No": 44,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Ujian dan Nilai",
        "Menu_Item": "Ujian dan Kuis",
        "Route_Path": "/exams",
        "Icon": "PlusCircle",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Perancangan dan penyelenggaraan evaluasi CBT: konfigurasi durasi, jadwal buka-tutup, token akses dinamis, pengacakan soal, aturan proctoring, serta penambahan waktu khusus bagi peserta ujian remedial atau susulan.",
        "Batasan_Wewenang": "Mengatur dan mempublikasikan ujian pada kelas yang diampu."
    },
    {
        "No": 45,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Ujian dan Nilai",
        "Menu_Item": "Bank Soal",
        "Route_Path": "/exams/question-bank",
        "Icon": "FolderArchive",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Repositori butir soal dosen (pilihan ganda, benar salah, isian singkat, esai, dan koding dengan unit test), fitur impor massal dari templat Excel dengan validasi dropdown dan Word DOCX berbasis pola pembersihan HTML (anti-XSS), deteksi duplikasi hash teks, serta ekspor-impor format standar Moodle XML dan paket QTI 2.1 zip.",
        "Batasan_Wewenang": "Mengelola bank soal pribadi dan mengimpor soal ke ujian."
    },
    {
        "No": 46,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Ujian dan Nilai",
        "Menu_Item": "Periksa Jawaban",
        "Route_Path": "/exams/review",
        "Icon": "CheckSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "lecturerReviewCount",
        "Deskripsi_Fitur": "Penilaian manual jawaban esai dan peninjauan kode pemrograman mahasiswa dengan bantuan rubrik terstruktur, eksekusi sandbox autograder, serta pemeriksa kemiripan teks shingling dan winnowing.",
        "Batasan_Wewenang": "Menilai dan mempublikasikan skor hasil evaluasi jawaban ujian."
    },
    {
        "No": 47,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Ujian dan Nilai",
        "Menu_Item": "Analisis Soal",
        "Route_Path": "/exams/analysis",
        "Icon": "BarChart3",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Analisis psikometri butir soal ujian pasca-pelaksanaan: tingkat kesukaran soal, daya pembeda butir, efektivitas distraktor pilihan ganda, dan indeks reliabilitas instrumen evaluasi (KR-20).",
        "Batasan_Wewenang": "Membaca statistik performa butir soal ujian yang diampu."
    },
    {
        "No": 48,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Ujian dan Nilai",
        "Menu_Item": "Rubrik",
        "Route_Path": "/lecturer/rubrics",
        "Icon": "ListChecks",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Penyusunan rubrik penilaian analitik bertingkat: perumusan kriteria evaluasi, penetapan deskriptor skor, dan penautan kriteria langsung ke tugas kuliah atau soal esai.",
        "Batasan_Wewenang": "Membuat, menyunting, dan menetapkan rubrik pada instrumen penilaian."
    },
    {
        "No": 49,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Ujian dan Nilai",
        "Menu_Item": "Buku Nilai",
        "Route_Path": "/analytics",
        "Icon": "Table2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Rekapitulasi nilai berbobot persentase dinamis (Tugas, Kuis, UTS, UAS = 100%), konversi huruf mutu otomatis (A sampai E), pemetaan capaian CPMK dan CPL, ekspor lembar nilai Excel/CSV, finalisasi buku nilai permanen, serta pengajuan revisi nilai pasca-finalisasi ke Kaprodi.",
        "Batasan_Wewenang": "Memfinalisasi nilai akhir kelas; mengajukan perubahan nilai ke Kaprodi jika terjadi koreksi pasca-final."
    },
    {
        "No": 50,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Ujian dan Nilai",
        "Menu_Item": "Sanggahan",
        "Route_Path": "/lecturer/disputes",
        "Icon": "MessageSquareWarning",
        "Is_Shortcut": False,
        "Badge_Counter": "disputeCount",
        "Deskripsi_Fitur": "Penanganan sanggahan nilai resmi yang diajukan mahasiswa dalam jendela waktu 7 hari: peninjauan alasan mahasiswa, pemeriksaan riwayat log penilaian, persetujuan penyesuaian skor, atau penolakan dengan penjelasan tertulis.",
        "Batasan_Wewenang": "Memutuskan persetujuan atau penolakan sanggahan nilai kelas diampu."
    },
    {
        "No": 51,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Pesan",
        "Route_Path": "/messages",
        "Icon": "MessageCircle",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadMessages",
        "Deskripsi_Fitur": "Komunikasi terarah perkuliahan: percakapan pesan dengan mahasiswa dan asisten, penyediaan slot waktu konsultasi akademik, jajak pendapat kilat (live poll) anonim di kelas, dan kepatuhan jam tenang (21.00 sampai 06.00 WIB).",
        "Batasan_Wewenang": "Mengirim pesan, membuka slot konsultasi, dan membuat live poll kelas."
    },
    {
        "No": 52,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Mahasiswa Bimbingan",
        "Route_Path": "/lecturer/mentoring",
        "Icon": "Users",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Panel dosen penasihat akademik: pemantauan perkembangan indeks prestasi semester dan kumulatif mahasiswa bimbingan, rekap absensi, dan deteksi peringatan dini mahasiswa berisiko akademik.",
        "Batasan_Wewenang": "Memantau dan membimbing mahasiswa perwalian yang ditugaskan."
    },
    {
        "No": 53,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Hasil Evaluasi",
        "Route_Path": "/lecturer/evaluations",
        "Icon": "ClipboardCheck",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Rekapitulasi instrumen evaluasi dosen oleh mahasiswa pada kelas yang diampu: skor rata-rata per kelompok pertanyaan dan tanggapan teks yang disajikan secara acak setelah periode evaluasi resmi ditutup (dengan syarat minimal 5 responden).",
        "Batasan_Wewenang": "Membaca hasil survei evaluasi kelas sendiri setelah periode ditutup."
    },
    {
        "No": 54,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "Lainnya",
        "Menu_Item": "Komunitas",
        "Route_Path": "/community",
        "Icon": "MessageSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Forum komunikasi akademik antardosen, koordinasi pengajaran laboratorium, dan diskusi mutu pembelajaran.",
        "Batasan_Wewenang": "Berpartisipasi dalam forum interaksi akademik."
    },

    # ==========================================
    # 4. PROGRAM_COORDINATOR (12 Menu Items)
    # ==========================================
    {
        "No": 55,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "-",
        "Menu_Item": "Beranda",
        "Route_Path": "/coordinator",
        "Icon": "Compass",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Tinjauan mutu pembelajaran program studi: statistik kelulusan, sebaran IPK mahasiswa, pemenuhan Rencana Pembelajaran Semester, distribusi beban SKS dosen pengampu, dan keterisian evaluasi dosen.",
        "Batasan_Wewenang": "Memantau kinerja akademik program studi."
    },
    {
        "No": 56,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "-",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Agenda kalender program studi: batas akhir pengisian nilai dosen, jadwal rapat evaluasi kurikulum, dan kalender yudisium program studi.",
        "Batasan_Wewenang": "Memantau timeline akademik program studi."
    },
    {
        "No": 57,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "-",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadCount",
        "Deskripsi_Fitur": "Notifikasi permohonan revisi nilai pasca-final dari dosen pengampu, keterlambatan pengisian berita acara dosen, dan penutupan periode evaluasi dosen.",
        "Batasan_Wewenang": "Membaca dan menindaklanjuti permohonan persetujuan."
    },
    {
        "No": 58,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "-",
        "Menu_Item": "Pengumuman",
        "Route_Path": "/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Publikasi pengumuman khusus kepada seluruh dosen pengampu dan mahasiswa di bawah naungan program studi.",
        "Batasan_Wewenang": "Menerbitkan pengumuman tingkat program studi."
    },
    {
        "No": 59,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "Prodi",
        "Menu_Item": "Kurikulum",
        "Route_Path": "/coordinator/curriculum",
        "Icon": "BookOpen",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Tata kelola kurikulum berbasis Outcome-Based Education: penetapan Capaian Pembelajaran Lulusan (CPL), Capaian Pembelajaran Mata Kuliah (CPMK), matriks pemetaan ketercapaian, dan pengaturan prasyarat mata kuliah dengan deteksi otomatis prasyarat melingkar.",
        "Batasan_Wewenang": "Mengelola kurikulum, pemetaan CPL dan CPMK, serta struktur mata kuliah prodi."
    },
    {
        "No": 60,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "Prodi",
        "Menu_Item": "Mata Kuliah",
        "Route_Path": "/coordinator/courses",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Master mata kuliah program studi: penetapan kode mata kuliah, nama, bobot SKS (teori dan praktikum), silabus acuan, dan status penawaran semester.",
        "Batasan_Wewenang": "Mengatur data mata kuliah yang ditawarkan di program studi."
    },
    {
        "No": 61,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "Prodi",
        "Menu_Item": "Penugasan Dosen",
        "Route_Path": "/coordinator/assignments",
        "Icon": "Users",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Plotting penugasan dosen pengampu pada rombongan belajar kelas semester aktif, pembagian tim dosen, dan pemantauan batas maksimal beban SKS mengajar dosen.",
        "Batasan_Wewenang": "Menugaskan dosen pada kelas mata kuliah program studi."
    },
    {
        "No": 62,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "Prodi",
        "Menu_Item": "Evaluasi Dosen",
        "Route_Path": "/coordinator/evaluations",
        "Icon": "ClipboardCheck",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen periode survei evaluasi dosen oleh mahasiswa: penyusunan kuesioner instrumen dari templat, pembukaan periode survei, pemantauan kelengkapan pengisian per kelas, moderasi komentar teks yang melanggar tata tertib dengan alasan ter-audit, serta analisis agregat hasil evaluasi dosen.",
        "Batasan_Wewenang": "Mengelola periode evaluasi, memoderasi komentar, dan melihat hasil agregat prodi."
    },
    {
        "No": 63,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "Pantauan",
        "Menu_Item": "Perkuliahan",
        "Route_Path": "/coordinator/monitoring",
        "Icon": "Activity",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pemantauan keterlaksanaan tatap muka perkuliahan: kepatuhan pengisian berita acara pertemuan 1 sampai 16 oleh dosen, ketepatan jadwal mengajar, dan persentase kehadiran kelas.",
        "Batasan_Wewenang": "Memantau jalannya perkuliahan dan kepatuhan administrasi dosen."
    },
    {
        "No": 64,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "Pantauan",
        "Menu_Item": "Mahasiswa Berisiko",
        "Route_Path": "/coordinator/monitoring/at-risk",
        "Icon": "AlertCircle",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Sistem peringatan dini akademik: identifikasi otomatis mahasiswa yang berpotensi drop-out berdasarkan IPK kurang dari 2.00, kehadiran perkuliahan kurang dari 75%, atau ketidakaktifan pengumpulan tugas kuliah.",
        "Batasan_Wewenang": "Mengakses rekapitulasi data mahasiswa berisiko untuk pembinaan akademik."
    },
    {
        "No": 65,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "Persetujuan",
        "Menu_Item": "Persetujuan Nilai",
        "Route_Path": "/coordinator/approvals",
        "Icon": "CheckCircle2",
        "Is_Shortcut": False,
        "Badge_Counter": "coordinatorApprovalsCount",
        "Deskripsi_Fitur": "Otorisasi permohonan revisi nilai pasca-final yang diajukan oleh dosen pengampu: penelaahan bukti dan alasan revisi sebelum diteruskan ke staf akademik untuk eksekusi pembaruan nilai.",
        "Batasan_Wewenang": "Memutuskan persetujuan atau penolakan pengajuan perubahan nilai dosen."
    },
    {
        "No": 66,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Program Studi",
        "Menu_Group": "Persetujuan",
        "Menu_Item": "Laporan",
        "Route_Path": "/coordinator/reports",
        "Icon": "FileSpreadsheet",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Penerbitan laporan ketercapaian CPL program studi, rekapitulasi distribusi nilai mata kuliah, laporan evaluasi dosen, dan ekspor data penjaminan mutu akreditasi.",
        "Batasan_Wewenang": "Mengunduh dan mencetak laporan mutu akademik program studi."
    },

    # ==========================================
    # 5. ACADEMIC_STAFF (13 Menu Items)
    # ==========================================
    {
        "No": 67,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "-",
        "Menu_Item": "Beranda",
        "Route_Path": "/staff",
        "Icon": "LayoutDashboard",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Ruang kerja operasional administrasi akademik: statistik mahasiswa aktif per angkatan, status penjadwalan ruang kuliah, antrean verifikasi pengajuan surat mahasiswa, dan agenda operasional harian.",
        "Batasan_Wewenang": "Mengelola operasional tata usaha dan administrasi akademik universitas."
    },
    {
        "No": 68,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "-",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Kalender akademik institusi: penetapan periode pengisian KRS, awal dan akhir perkuliahan, minggu tenang perkuliahan, serta jadwal resmi pelaksanaan UTS dan UAS.",
        "Batasan_Wewenang": "Memantau dan mengelola agenda kalender akademik institusi."
    },
    {
        "No": 69,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "-",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadCount",
        "Deskripsi_Fitur": "Pemberitahuan pengajuan surat mahasiswa baru, pengesahan jadwal kuliah dari Kaprodi, dan keputusan persetujuan revisi nilai yang siap dieksekusi ke pangkalan data.",
        "Batasan_Wewenang": "Menerima dan menindaklanjuti notifikasi administrasi."
    },
    {
        "No": 70,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Data Induk",
        "Menu_Item": "Mahasiswa",
        "Route_Path": "/staff/master/students",
        "Icon": "Users",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Tata kelola data induk mahasiswa: pengelolaan biodata, NIM, program studi, status akademik (aktif, cuti, lulus, drop-out), penetapan dosen wali perwalian, serta impor massal data mahasiswa via format CSV dengan validasi baris.",
        "Batasan_Wewenang": "Menambah, menyunting, dan memutakhirkan data induk mahasiswa."
    },
    {
        "No": 71,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Data Induk",
        "Menu_Item": "Dosen",
        "Route_Path": "/staff/master/lecturers",
        "Icon": "UserCheck",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen data induk dosen pengajar: biodata, NIDN atau NIP, homebase program studi, kepangkatan akademik fungsional, dan status keaktifan mengajar.",
        "Batasan_Wewenang": "Memutakhirkan master data tenaga pengajar universitas."
    },
    {
        "No": 72,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Data Induk",
        "Menu_Item": "Data Akademik",
        "Route_Path": "/staff/master",
        "Icon": "Database",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengelolaan data referensi institusi: master program studi, master semester akademik aktif dan lampau, serta master ruang perkuliahan beserta kapasitas daya tampung dan titik koordinat geofencing GPS.",
        "Batasan_Wewenang": "Menambah dan mengaktifkan semester, program studi, serta ruang kuliah."
    },
    {
        "No": 73,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Akademik",
        "Menu_Item": "Jadwal",
        "Route_Path": "/staff/schedules",
        "Icon": "CalendarClock",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Penyusunan jadwal tatap muka perkuliahan dan ujian resmi yang dilengkapi mesin pendeteksi bentrok otomatis terhadap jadwal mengajar dosen, pemakaian ruang kuliah, dan rombongan belajar mahasiswa.",
        "Batasan_Wewenang": "Menyusun, memvalidasi, dan menerbitkan jadwal perkuliahan bebas bentrok."
    },
    {
        "No": 74,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Akademik",
        "Menu_Item": "Kelas dan Peserta",
        "Route_Path": "/staff/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pembentukan rombel kelas perkuliahan, penetapan daya tampung kuota, pendaftaran mahasiswa peserta kelas secara kolektif, pemindahan kelas mahasiswa, penutupan semester (arsip massal kelas menjadi hanya-baca), serta pembatalan arsip dengan alasan ter-audit.",
        "Batasan_Wewenang": "Membentuk kelas, mendaftarkan peserta, menutup semester, dan mengarsipkan kelas."
    },
    {
        "No": 75,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Akademik",
        "Menu_Item": "Nilai dan Presensi",
        "Route_Path": "/staff/grades",
        "Icon": "CheckSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Rekapitulasi nilai perkuliahan institusional, pengawasan penguncian buku nilai kelas oleh dosen, eksekusi pembaruan nilai mahasiswa pasca-persetujuan Kaprodi, dan penerbitan rekapitulasi kehadiran mahasiswa.",
        "Batasan_Wewenang": "Mengeksekusi perubahan nilai resmi pasca-persetujuan Kaprodi dan mencetak rekapitulasi nilai."
    },
    {
        "No": 76,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Layanan",
        "Menu_Item": "Pengajuan Masuk",
        "Route_Path": "/staff/services/verification",
        "Icon": "FileText",
        "Is_Shortcut": False,
        "Badge_Counter": "requestCount",
        "Deskripsi_Fitur": "Pemrosesan permohonan surat administrasi mahasiswa: verifikasi berkas pengajuan surat keterangan aktif kuliah, surat dispensasi izin, permohonan cuti akademik, dan legalisasi transkrip nilai resmi ber-QR code.",
        "Batasan_Wewenang": "Memeriksa berkas permohonan, menyetujui, meminta perbaikan, atau menolak pengajuan surat."
    },
    {
        "No": 77,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Layanan",
        "Menu_Item": "Pengumuman dan Acara",
        "Route_Path": "/staff/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Publikasi agenda resmi universitas, kalender registrasi ulang semester, edaran administratif, dan pengumuman wisuda ke seluruh sivitas.",
        "Batasan_Wewenang": "Menerbitkan pengumuman administratif dan agenda kampus."
    },
    {
        "No": 78,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Layanan",
        "Menu_Item": "Berkas dan Sertifikat",
        "Route_Path": "/staff/content",
        "Icon": "BookOpen",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen templat dokumen resmi institusi, formulir akademik, serta penerbitan dan penandatanganan sertifikat kompetensi digital kampus.",
        "Batasan_Wewenang": "Mengelola repositori berkas resmi dan nomor sertifikat."
    },
    {
        "No": 79,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "Layanan",
        "Menu_Item": "Moderasi",
        "Route_Path": "/staff/moderation",
        "Icon": "MessageSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Penegakan tata tertib forum interaksi komunitas kampus: peninjauan laporan postingan bernada melanggar, penyembunyian konten, dan pemberian sanksi teguran etika.",
        "Batasan_Wewenang": "Memoderasi konten forum komunitas dan menindak pelanggaran tata tertib."
    },

    # ==========================================
    # 6. SYSTEM_ADMIN (8 Menu Items)
    # ==========================================
    {
        "No": 80,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "-",
        "Menu_Item": "Beranda",
        "Route_Path": "/admin/system",
        "Icon": "Server",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Panel telemetri keandalan sistem dan infrastruktur: utilisasi memori dan CPU server, kapasitas penyimpanan berkas Supabase Storage, status PgBouncer pooler basis data, dan antrean pekerjaan terjadwal.",
        "Batasan_Wewenang": "Memantau stabilitas teknis infrastruktur; dilarang mengakses konten nilai atau data pribadi akademik mahasiswa."
    },
    {
        "No": 81,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "-",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadCount",
        "Deskripsi_Fitur": "Peringatan teknis darurat: kegagalan eksekusi cron job, anomali beban lonjakan koneksi basis data, kesalahan autograder sandbox koding, dan peringatan sisa kapasitas ruang penyimpanan.",
        "Batasan_Wewenang": "Menerima dan merespon peringatan teknis infrastruktur."
    },
    {
        "No": 82,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "Server",
        "Menu_Item": "Pemantauan",
        "Route_Path": "/admin/system/monitoring",
        "Icon": "Activity",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pemantauan telemetri waktu nyata: uptime layanan, latensi response time server action, metrik eksekusi query PostgreSQL, status sinkronisasi Realtime websocket, dan pelacakan galat aplikasi.",
        "Batasan_Wewenang": "Memantau performa teknis sistem secara mendalam."
    },
    {
        "No": 83,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "Server",
        "Menu_Item": "Integrasi",
        "Route_Path": "/admin/system/integrations",
        "Icon": "Globe",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen integrasi layanan eksternal: konfigurasi Google OAuth Client, pengaturan private bucket Supabase Storage, webhook eksternal, rotasi rahasia CRON_SECRET, dan konektor sandbox Judge autograder.",
        "Batasan_Wewenang": "Mengonfigurasi parameter konektivitas sistem eksternal dan API gateway."
    },
    {
        "No": 84,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "Keamanan",
        "Menu_Item": "Sesi Login",
        "Route_Path": "/admin/system/security",
        "Icon": "Lock",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Perimeter keamanan sistem: pemantauan sesi login terdaftar, aturan pembatasan laju percobaan login (anti-brute-force 5 kali gagal berurutan kunci 15 menit), serta pencabutan sesi darurat pengguna yang terindikasi kompromi.",
        "Batasan_Wewenang": "Mengatur kebijakan keamanan sesi dan menangguhkan sesi mencurigakan."
    },
    {
        "No": 85,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "Keamanan",
        "Menu_Item": "Cadangan Data",
        "Route_Path": "/admin/system/backup",
        "Icon": "FolderArchive",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pemeliharaan cadangan data: jadwal pencadangan otomatis skema publik basis data, riwayat berkas snapshot cadangan, dan prosedur uji pemulihan data untuk menjaga keberlangsungan layanan.",
        "Batasan_Wewenang": "Mengelola berkas cadangan dan menjalankan skrip pemulihan darurat."
    },
    {
        "No": 86,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "Pengaturan",
        "Menu_Item": "Pengaturan Sistem",
        "Route_Path": "/admin/system/settings",
        "Icon": "Sliders",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Konfigurasi platform global: domain email yang diizinkan, mode pemeliharaan, batas ukuran unggah berkas, dan pengaturan feature flags aplikasi.",
        "Batasan_Wewenang": "Mengelola parameter teknis platform universitas."
    },
    {
        "No": 87,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "Pengaturan",
        "Menu_Item": "Log Audit",
        "Route_Path": "/admin/system/audit",
        "Icon": "ScrollText",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pemeriksaan rekaman audit log sistem yang disamarkan: mencatat waktu, aktor, peran, aksi, alamat IP, dan user-agent; nilai perubahan data entitas akademik sensitif disembunyikan untuk menjaga kerahasiaan akademik.",
        "Batasan_Wewenang": "Membaca log audit sistem dengan penyamaran entitas akademik."
    },

    # ==========================================
    # 7. SUPER_ADMIN (12 Menu Items)
    # ==========================================
    {
        "No": 88,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "-",
        "Menu_Item": "Beranda",
        "Route_Path": "/admin",
        "Icon": "LayoutDashboard",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Ruang kerja eksekutif institusi: rekapitulasi menyeluruh sivitas akademika universitas, sebaran mahasiswa aktif antarfakultas dan prodi, rasio dosen terhadap mahasiswa, indeks kepatuhan perkuliahan, dan ringkasan audit sistem.",
        "Batasan_Wewenang": "Wewenang tertinggi tata kelola institusi dan kebijakan universitas."
    },
    {
        "No": 89,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "-",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "unreadCount",
        "Deskripsi_Fitur": "Pemberitahuan strategis institusi, eskalasi insiden keamanan sistem, serta notifikasi aktivitas audit tingkat tinggi.",
        "Batasan_Wewenang": "Menerima pemberitahuan tingkat eksekutif."
    },
    {
        "No": 90,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Pengguna",
        "Menu_Item": "Akun Pengguna",
        "Route_Path": "/admin/users",
        "Icon": "Users",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen seluruh akun pengguna institusi: aktivasi, penangguhan, reset kata sandi darurat, dan sesi impersonasi hanya-lihat (maksimal 30 menit dengan alasan ter-audit) untuk investigasi kendala operasional.",
        "Batasan_Wewenang": "Penuh atas seluruh identitas akun pengguna dan pelaksanaan impersonasi hanya-lihat."
    },
    {
        "No": 91,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Pengguna",
        "Menu_Item": "Peran dan Akses",
        "Route_Path": "/admin/roles",
        "Icon": "ShieldAlert",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Tata kelola matriks Role-Based Access Control: penugasan multi-peran pengguna, penetapan cakupan peran (GLOBAL, PROGRAM, CLASS), dan pengawasan izin akses fungsional.",
        "Batasan_Wewenang": "Menetapkan peran pengguna dan mengatur cakupan wewenang institusi."
    },
    {
        "No": 92,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Aturan Kampus",
        "Menu_Item": "Aturan Akademik",
        "Route_Path": "/admin/policies",
        "Icon": "Scale",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Konfigurasi kebijakan akademik institusi terpusat: batas minimal kehadiran ujian (bawaan 75%), jendela waktu sanggah nilai (7 hari), mode perlakuan izin presensi, retensi bukti surat sakit (180 hari), batas keterisian berita acara (3 hari), toleransi keterlambatan ujian CBT, minimal responden evaluasi dosen (5 orang), serta ambang batas kemiripan tugas.",
        "Batasan_Wewenang": "Mengubah dan mengesahkan seluruh parameter kebijakan akademik institusi."
    },
    {
        "No": 93,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Aturan Kampus",
        "Menu_Item": "Pengumuman Kampus",
        "Route_Path": "/admin/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Penerbitan pengumuman resmi pimpinan universitas dan rektorat yang disiarkan langsung ke seluruh akun pengguna di lingkungan kampus.",
        "Batasan_Wewenang": "Menyiarkan pengumuman darurat dan keputusan pimpinan berskala universitas."
    },
    {
        "No": 94,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Sistem",
        "Menu_Item": "Pemantauan",
        "Route_Path": "/admin/system/monitoring",
        "Icon": "Activity",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared sub-hub pemantauan telemetri keandalan server, latensi tindakan server, dan metrik kinerja kueri basis data.",
        "Batasan_Wewenang": "Hak akses penuh ke telemetri performa sistem."
    },
    {
        "No": 95,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Sistem",
        "Menu_Item": "Integrasi",
        "Route_Path": "/admin/system/integrations",
        "Icon": "Globe",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared sub-hub konfigurasi OAuth, pengelolaan bucket berkas privat, dan pemantauan webhook eksternal.",
        "Batasan_Wewenang": "Hak akses penuh ke manajemen integrasi institusi."
    },
    {
        "No": 96,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Sistem",
        "Menu_Item": "Sesi Login",
        "Route_Path": "/admin/system/security",
        "Icon": "Lock",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared sub-hub pengawasan perimeter keamanan, pelacakan sesi login lintas akun, dan audit pencabutan sesi darurat.",
        "Batasan_Wewenang": "Hak akses penuh atas audit sesi keamanan platform."
    },
    {
        "No": 97,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Sistem",
        "Menu_Item": "Cadangan Data",
        "Route_Path": "/admin/system/backup",
        "Icon": "FolderArchive",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared sub-hub penjadwalan cadangan skema publik dan pengelolaan arsip pemulihan data institusi.",
        "Batasan_Wewenang": "Hak akses penuh atas cadangan data universitas."
    },
    {
        "No": 98,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Sistem",
        "Menu_Item": "Pengaturan Sistem",
        "Route_Path": "/admin/system/settings",
        "Icon": "Sliders",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared sub-hub konfigurasi tingkat sistem, sakelar pemeliharaan, dan feature flags platform.",
        "Batasan_Wewenang": "Hak akses penuh atas pengaturan sistem platform."
    },
    {
        "No": 99,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "Sistem",
        "Menu_Item": "Log Audit",
        "Route_Path": "/admin/system/audit",
        "Icon": "ScrollText",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pemeriksaan rekaman audit log utuh tanpa penyamaran: merekam seluruh riwayat perubahan data akademik, perubahan nilai, keputusan persetujuan, dan jejak aktivitas impersonasi.",
        "Batasan_Wewenang": "Akses penuh tanpa penyamaran terhadap seluruh riwayat audit platform."
    },

    # ==========================================
    # 8. ALL_ROLES / Shared Menu (3 Menu Items)
    # ==========================================
    {
        "No": 100,
        "Role_Code": "ALL_ROLES",
        "Role_Name": "Menu Bersama",
        "Menu_Group": "Akun",
        "Menu_Item": "Pengaturan",
        "Route_Path": "/settings",
        "Icon": "Settings",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengaturan preferensi antarmuka pengguna: mode tampilan (Terang, Gelap, Ikuti Sistem), tingkat kerapatan elemen layar, bahasa, serta preferensi aktivasi saluran notifikasi per jenis kegiatan.",
        "Batasan_Wewenang": "Dapat diakses oleh seluruh pengguna login untuk pengaturan profil pribadi."
    },
    {
        "No": 101,
        "Role_Code": "ALL_ROLES",
        "Role_Name": "Menu Bersama",
        "Menu_Group": "Akun",
        "Menu_Item": "Bantuan",
        "Route_Path": "/help",
        "Icon": "LifeBuoy",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Panduan operasional terstruktur per peran: alur penugasan dan evaluasi, tata cara presensi GPS dan QR dinamis, mekanisme ujian CBT terawasi, sanggahan nilai, etika konsultasi, dan pusat tanya jawab.",
        "Batasan_Wewenang": "Terbuka untuk seluruh pengguna sebagai referensi operasional resmi aplikasi."
    },
    {
        "No": 102,
        "Role_Code": "ALL_ROLES",
        "Role_Name": "Menu Bersama",
        "Menu_Group": "Akun",
        "Menu_Item": "Privasi",
        "Route_Path": "/transparency",
        "Icon": "Eye",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Kepatuhan Undang-Undang Pelindungan Data Pribadi: ringkasan data profil tersimpan, riwayat perangkat dan sesi aktif, tombol darurat 'Ini bukan saya' untuk mencabut seluruh sesi jika dicurigai adanya kompromi akun, serta riwayat persetujuan privasi.",
        "Batasan_Wewenang": "Hak transparansi data pribadi untuk seluruh sivitas akademika."
    }
]

def main():
    for idx, item in enumerate(DATA, start=1):
        item["No"] = idx
    print(f"Menyiapkan data spesifikasi menu ({len(DATA)} butir)...")
    df = pd.DataFrame(DATA)
    
    docs_dir = os.path.join(os.path.dirname(__file__), "..", "docs")
    csv_path = os.path.join(docs_dir, "SIAJAR_Fitur_dan_Menu_Role.csv")
    xlsx_path = os.path.join(docs_dir, "SIAJAR_Fitur_dan_Menu_Role.xlsx")
    html_path = os.path.join(docs_dir, "SIAJAR_Fitur_dan_Menu_Role.html")
    pdf_path = os.path.join(docs_dir, "SIAJAR_Fitur_dan_Menu_Role.pdf")
    md_path = os.path.join(docs_dir, "SIAJAR_Fitur_dan_Menu_Role.md")
    
    # 1. Simpan CSV & Excel
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"File CSV berhasil dibuat: {csv_path}")
    
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Semua Menu dan Fitur", index=False)
        for role in df["Role_Code"].unique():
            sub_df = df[df["Role_Code"] == role]
            sheet_title = role[:31]
            sub_df.to_excel(writer, sheet_name=sheet_title, index=False)
    print(f"File Excel berhasil dibuat: {xlsx_path}")
    
    # 2. Buat Dokumen HTML
    html_content = generate_html(df)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"File HTML berhasil dibuat: {html_path}")
    
    # 3. Buat Dokumen Markdown Resmi
    md_content = generate_markdown(df)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"File Markdown berhasil dibuat: {md_path}")
    
    # 4. Render ke PDF via Microsoft Edge Headless
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if os.path.exists(edge_path):
        print("Merender PDF melalui Microsoft Edge headless...")
        cmd = [
            edge_path,
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            f"file:///{html_path.replace(os.sep, '/')}"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and os.path.exists(pdf_path):
            print(f"PDF Berhasil dibuat: {pdf_path} (Ukuran: {os.path.getsize(pdf_path)} bytes)")
        else:
            print(f"Gagal generate PDF: {res.stderr}")
    else:
        print("Microsoft Edge tidak ditemukan pada lokasi standar.")

    # 5. Salin ke artifact directory jika tersedia
    brain_dir = r"C:\Users\ACER\.gemini\antigravity\brain\12de0f7a-953f-4f1e-be2b-cc4638dd80a3"
    if os.path.exists(brain_dir):
        for fname in ["SIAJAR_Fitur_dan_Menu_Role.csv", "SIAJAR_Fitur_dan_Menu_Role.xlsx", "SIAJAR_Fitur_dan_Menu_Role.pdf", "SIAJAR_Fitur_dan_Menu_Role.html"]:
            src = os.path.join(docs_dir, fname)
            dst = os.path.join(brain_dir, fname)
            if os.path.exists(src):
                shutil.copy2(src, dst)
        # Markdown artifact
        shutil.copy2(md_path, os.path.join(brain_dir, "SIAJAR_Fitur_dan_Menu_Role.md"))
        print("File dokumen berhasil disinkronisasi ke folder artifact brain.")

def generate_markdown(df):
    role_sections = [
        ("STUDENT", "2.1. Mahasiswa (`STUDENT`)", "Pengguna sentral aktivitas pembelajaran mandiri dan kolaboratif."),
        ("TEACHING_ASSISTANT", "2.2. Asisten Dosen (`TEACHING_ASSISTANT`)", "Peran hibrida: mahasiswa yang mengemban tugas asistensi praktikum di bawah supervisi dosen pengampu."),
        ("LECTURER", "2.3. Dosen Pengampu (`LECTURER`)", "Pengelola utama ruang perkuliahan, penyusun materi ajar, penguji evaluasi, dan pemegang wewenang nilai mutu kelas."),
        ("PROGRAM_COORDINATOR", "2.4. Koordinator Program Studi (`PROGRAM_COORDINATOR`)", "Penjamin mutu kurikulum, pembagian beban dosen, pemantauan keterlaksanaan pembelajaran, dan pemutus permohonan revisi nilai."),
        ("ACADEMIC_STAFF", "2.5. Staf Akademik (`ACADEMIC_STAFF`)", "Operator tata usaha akademik universitas: master data, penjadwalan bebas bentrok, pembentukan kelas, dan pemrosesan pengajuan surat."),
        ("SYSTEM_ADMIN", "2.6. System Administrator (`SYSTEM_ADMIN`)", "Pengelola infrastruktur, keandalan server, integrasi sistem, dan perimeter keamanan siber (dilarang mengakses data nilai akademik)."),
        ("SUPER_ADMIN", "2.7. Super Administrator (`SUPER_ADMIN`)", "Otoritas tertinggi institusi: tata kelola pengguna, matriks perizinan, kebijakan akademik kampus, dan pengawasan audit."),
        ("ALL_ROLES", "2.8. Menu Bersama Seluruh Role (`Akun`)", "Grup menu akun di bagian bawah bilah sisi yang selalu dapat diakses oleh seluruh 7 peran.")
    ]
    
    sections_md = ""
    for role_code, title, desc in role_sections:
        role_df = df[df["Role_Code"] == role_code]
        table_rows = ""
        for _, r in role_df.iterrows():
            grp = r["Menu_Group"] if r["Menu_Group"] != "-" else "Utama"
            bdg = f"`{r['Badge_Counter']}`" if r["Badge_Counter"] != "-" else "-"
            table_rows += f"| {grp} | **{r['Menu_Item']}** | `{r['Route_Path']}` | `{r['Icon']}` | {bdg} | {r['Deskripsi_Fitur']} |\n"
            
        sections_md += f"""### {title}
{desc}

| Grup | Menu Item | Rute | Ikon | Badge / State | Deskripsi Fungsionalitas Fitur |
|---|---|---|---|---|---|
{table_rows}
---

"""

    md = f"""# SIAJAR — Spesifikasi Lengkap Fitur dan Menu Setiap Role

> **Status Dokumen**: Terverifikasi Sesuai Basis Kode Aktif (`src/lib/config/menu-config.ts` dan Fase P0 - Tahap 3 Peta Pulau)  
> **Berkas Terkait**: 
> - [SIAJAR_Fitur_dan_Menu_Role.pdf](./SIAJAR_Fitur_dan_Menu_Role.pdf)
> - [SIAJAR_Fitur_dan_Menu_Role.xlsx](./SIAJAR_Fitur_dan_Menu_Role.xlsx)
> - [SIAJAR_Fitur_dan_Menu_Role.csv](./SIAJAR_Fitur_dan_Menu_Role.csv)
> - [SIAJAR_Fitur_dan_Menu_Role.html](./SIAJAR_Fitur_dan_Menu_Role.html)

---

## 1. Ringkasan Eksekutif dan Struktur Otorisasi

Sistem **SIAJAR (Sistem Informasi Ajar Terpadu)** mengimplementasikan arsitektur otorisasi bertingkat berbasis *Role-Based Access Control* (RBAC) dan *PostgreSQL Row-Level Security* (RLS) dengan pemisahan wewenang ketat. Seluruh navigasi antarmuka dikendalikan secara deklaratif melalui konfigurasi tunggal terpusat di `src/lib/config/menu-config.ts`.

Total terdapat **107 butir menu dan fungsionalitas terdefinisi** yang tersebar di **7 peran utama** dan **1 grup menu bersama**:

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

{sections_md}
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
"""
    return md

def generate_html(df):
    role_titles = {
        "STUDENT": "1. Mahasiswa (STUDENT) — 18 Menu",
        "TEACHING_ASSISTANT": "2. Asisten Dosen (TEACHING_ASSISTANT) — 21 Menu",
        "LECTURER": "3. Dosen Pengampu (LECTURER) — 20 Menu",
        "PROGRAM_COORDINATOR": "4. Koordinator Program Studi (PROGRAM_COORDINATOR) — 12 Menu",
        "ACADEMIC_STAFF": "5. Staf Akademik (ACADEMIC_STAFF) — 13 Menu",
        "SUPER_ADMIN": "7. Super Administrator (SUPER_ADMIN) — 12 Menu",
        "ALL_ROLES": "8. Menu Bersama Seluruh Role (Akun) — 3 Menu"
    }
    
    sections_html = ""
    for role_code, title in role_titles.items():
        role_df = df[df["Role_Code"] == role_code]
        rows_html = ""
        for _, row in role_df.iterrows():
            badge_html = f"<span class='badge'>{row['Badge_Counter']}</span>" if row['Badge_Counter'] != "-" else "<span class='text-muted'>-</span>"
            grp = row['Menu_Group'] if row['Menu_Group'] != '-' else 'Utama'
            rows_html += f"""
            <tr>
                <td style="font-weight: 600; width: 14%;">{grp}</td>
                <td style="font-weight: 600; width: 18%; color: #1e3a8a;">
                    {row['Menu_Item']}<br>
                    <code style="font-size: 11px; color: #475569;">{row['Route_Path']}</code>
                </td>
                <td style="width: 12%; font-size: 12px; color: #64748b;">{badge_html}</td>
                <td style="width: 38%; font-size: 12px; line-height: 1.5;">{row['Deskripsi_Fitur']}</td>
                <td style="width: 18%; font-size: 11px; color: #475569; line-height: 1.4;">{row['Batasan_Wewenang']}</td>
            </tr>
            """
            
        sections_html += f"""
        <div class="role-section">
            <h2 class="role-header">{title}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Grup Menu</th>
                        <th>Item dan Rute</th>
                        <th>Badge / Status</th>
                        <th>Deskripsi Fungsionalitas Fitur</th>
                        <th>Batasan Wewenang</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html}
                </tbody>
            </table>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SIAJAR - Spesifikasi Fitur dan Menu per Role</title>
    <style>
        @page {{
            size: A4 portrait;
            margin: 15mm 12mm 15mm 12mm;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}
        .header {{
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }}
        .header h1 {{
            margin: 0 0 6px 0;
            font-size: 22px;
            color: #1e3a8a;
            letter-spacing: -0.5px;
        }}
        .header p {{
            margin: 0;
            color: #475569;
            font-size: 12px;
        }}
        .meta-box {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 20px;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
        }}
        .role-section {{
            margin-bottom: 24px;
            page-break-inside: avoid;
        }}
        .role-header {{
            background: #f1f5f9;
            border-left: 4px solid #2563eb;
            padding: 8px 12px;
            font-size: 14px;
            margin: 0 0 10px 0;
            color: #0f172a;
            border-radius: 0 6px 6px 0;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }}
        th {{
            background-color: #f8fafc;
            color: #334155;
            text-align: left;
            padding: 8px 10px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #cbd5e1;
            border-top: 1px solid #e2e8f0;
        }}
        td {{
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }}
        tr:nth-child(even) td {{
            background-color: #fafafa;
        }}
        .badge {{
            display: inline-block;
            background: #dbeafe;
            color: #1d4ed8;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }}
        .text-muted {{
            color: #94a3b8;
        }}
        code {{
            background: #f1f5f9;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: Consolas, monospace;
        }}
        .footer {{
            text-align: center;
            font-size: 10px;
            color: #64748b;
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>SIAJAR — Sistem Informasi Ajar Terpadu</h1>
        <p><strong>Spesifikasi Lengkap Menu, Rute dan Fungsionalitas Setiap Peran (Role)</strong></p>
    </div>
    
    <div class="meta-box">
        <div><strong>Status Sistem:</strong> Fase 7 Terverifikasi (Single Source of Truth <code>src/lib/config/menu-config.ts</code>)</div>
        <div><strong>Cakupan:</strong> 7 Peran Utama + 1 Menu Bersama (Total 102 Item Menu Terdefinisi)</div>
        <div><strong>Arsitektur:</strong> RBAC, RLS PostgreSQL, Next.js 14 App Router</div>
    </div>

    {sections_html}

    <div class="role-section">
        <h2 class="role-header">Matriks Otorisasi Sistem</h2>
        <ul style="line-height: 1.8; font-size: 12px; color: #334155;">
            <li><strong>Akses ruang kelas</strong>: Mahasiswa dan Asisten (terdaftar), Dosen (pengampu), Kaprodi (pantauan prodi), Staf (administrasi kelas), System Admin (tidak ada), Super Admin (hanya lewat impersonasi hanya-lihat).</li>
            <li><strong>Skor dan koreksi</strong>: Mahasiswa tidak ada; Asisten draf; Dosen draf dan final; Kaprodi, Staf, System Admin, Super Admin tidak ada.</li>
            <li><strong>Finalisasi buku nilai</strong>: hanya Dosen pemilik kelas.</li>
            <li><strong>Revisi nilai pasca-final</strong>: Dosen mengajukan; Kaprodi memutuskan; Staf mengeksekusi; Super Admin hak audit.</li>
            <li><strong>Sanggah nilai</strong>: Mahasiswa mengajukan; Dosen memutuskan; Kaprodi melihat jumlah; lainnya tidak ada.</li>
            <li><strong>Buka sesi presensi</strong>: Dosen; Asisten bila can_open_attendance diberikan dosen; Kaprodi dan Staf hanya pantau.</li>
            <li><strong>Izin dan sakit</strong>: Mahasiswa mengajukan; Dosen kelas terkait memutuskan; lainnya tidak ada akses isi.</li>
            <li><strong>Berita acara</strong>: Dosen menulis; Asisten baca; Kaprodi dan Staf baca dan ekspor.</li>
            <li><strong>Kelompok tugas</strong>: Dosen mengatur; Mahasiswa bergabung sesuai mode; Asisten baca dan draf skor.</li>
            <li><strong>Rubrik</strong>: Dosen mengelola; Asisten memakai; Mahasiswa membaca rubrik tugasnya.</li>
            <li><strong>Ujian</strong>: Dosen membuat dan mengatur; Asisten memantau dan menampilkan token; Dosen menambah waktu peserta.</li>
            <li><strong>Analisis soal</strong>: Dosen pengampu; Asisten baca.</li>
            <li><strong>Cek kemiripan</strong>: Dosen; Asisten bila diizinkan dosen.</li>
            <li><strong>Kurikulum, CPL, CPMK</strong>: Kaprodi mengelola; Dosen memetakan penilaian ke CPMK; Super Admin kebijakan global.</li>
            <li><strong>Penjadwalan dan kuota kelas</strong>: Staf.</li>
            <li><strong>Evaluasi dosen</strong>: Kaprodi mengelola periode dan melihat agregat; Dosen melihat hasil sendiri; Mahasiswa mengisi anonim.</li>
            <li><strong>Pesan dan konsultasi</strong>: Mahasiswa, Asisten, Dosen sesuai aturan jam tenang; Staf hanya salinan laporan; admin tidak ada.</li>
            <li><strong>Polling</strong>: Dosen membuat; Mahasiswa kelas menjawab.</li>
            <li><strong>Pengajuan surat</strong>: Mahasiswa mengajukan; Staf memproses.</li>
            <li><strong>Kelola master pengguna</strong>: Staf (mahasiswa dan dosen); Super Admin penuh.</li>
            <li><strong>Infrastruktur dan log audit</strong>: System Admin (log disamarkan untuk entitas akademik); Super Admin penuh.</li>
            <li><strong>Impersonasi</strong>: hanya Super Admin, hanya-lihat, maksimal 30 menit, dengan alasan.</li>
        </ul>
    </div>

    <div class="footer">
        Dokumen Resmi SIAJAR • Diterbitkan Otomatis untuk Penjaminan Mutu dan Otorisasi Sistem Akademik
    </div>
</body>
</html>
"""
    return html

if __name__ == "__main__":
    main()
