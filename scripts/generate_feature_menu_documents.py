import os
import subprocess
import pandas as pd

# Data lengkap fitur dan menu untuk setiap role di SIAJAR
DATA = [
    # 1. STUDENT
    {
        "No": 1,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Beranda",
        "Route_Path": "/student",
        "Icon": "GraduationCap",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Dashboard terpadu mahasiswa dengan kartu ringkasan kelas aktif, jadwal kuliah hari ini, tugas mendekati tenggat (H-1), pengumuman terbaru, dan chip filter cepat ('Semua', 'Kelas Saya', 'Tugas & Kuis', 'Ujian', 'Presensi', 'Jadwal', 'Nilai').",
        "Batasan_Wewenang": "Hanya dapat melihat data pribadi dan kelas yang di-enroll secara aktif."
    },
    {
        "No": 2,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Kalender akademik terintegrasi yang menggabungkan jadwal perkuliahan rutin, tenggat pengumpulan tugas/kuis, jadwal UTS & UAS, serta fitur berlangganan iCal feed.",
        "Batasan_Wewenang": "Read-only jadwal kegiatan perkuliahan yang diikuti."
    },
    {
        "No": 3,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah pesan belum dibaca (unreadCount > 0)",
        "Deskripsi_Fitur": "Pusat notifikasi in-app untuk pengingat tugas H-1 otomatis, materi baru, pengumuman kelas, nilai yang dipublikasikan, absensi, dan peringatan login perangkat baru.",
        "Batasan_Wewenang": "Dapat menandai telah dibaca dan mengatur preferensi notifikasi personal."
    },
    {
        "No": 4,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Pengumuman",
        "Route_Path": "/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Papan pengumuman resmi kampus, fakultas, dan program studi dengan pencatatan status baca (read-tracking).",
        "Batasan_Wewenang": "Read-only pengumuman yang ditargetkan untuk Mahasiswa / Prodi terkait."
    },
    {
        "No": 5,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Kelas Saya",
        "Route_Path": "/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Ruang belajar mata kuliah aktif: mengunduh materi ajar (Markdown/PDF/video), silabus/RPS, forum diskusi kelas per pertemuan, tugas kuliah, dan pengumpulan jawaban tugas.",
        "Batasan_Wewenang": "Hanya kelas terdaftar. Keterlambatan pengumpulan tugas ditandai otomatis."
    },
    {
        "No": 6,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Presensi",
        "Route_Path": "/attendance",
        "Icon": "CalendarCheck2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Riwayat absensi pertemuan 1-16, input kode verifikasi sesi presensi atau scan QR presensi, serta deteksi peringatan kehadiran < 75% sebagai syarat mutlak UAS.",
        "Batasan_Wewenang": "Hanya dapat mencatat kehadiran saat sesi presensi dibuka oleh dosen."
    },
    {
        "No": 7,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Ujian Aktif",
        "Route_Path": "/exams",
        "Icon": "FileCheck2",
        "Is_Shortcut": True,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pintasan cepat langsung ke Computer Based Test (CBT) kuis atau ujian resmi (UTS/UAS) yang sedang berlangsung dengan timer pengerjaan dan deteksi kecurangan (tab switch/blur).",
        "Batasan_Wewenang": "Hanya tampil jika ada jadwal ujian aktif dan syarat kehadiran >= 75% terpenuhi."
    },
    {
        "No": 8,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Pustaka Digital",
        "Route_Path": "/library",
        "Icon": "Library",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Koleksi materi referensi, e-book, repositori jurnal, dan bahan bacaan suplemen yang disediakan oleh dosen atau perpustakaan kampus.",
        "Batasan_Wewenang": "Akses baca dan unduh materi repositori publik institusi."
    },
    {
        "No": 9,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Tanya AI SIAJAR",
        "Route_Path": "/ai-assistant",
        "Icon": "Sparkles",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Asisten bimbingan belajar cerdas berbasis AI untuk membantu memahami konsep kuliah, penjelasan materi, ringkasan akademik, dan konsultasi studi interaktif.",
        "Batasan_Wewenang": "Interaksi tanya-jawab pembelajaran dalam batas konteks perkuliahan."
    },
    {
        "No": 10,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Komunitas",
        "Route_Path": "/community",
        "Icon": "MessageSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Forum diskusi kampus lintas prodi dan angkatan untuk berbagi pengalaman akademik, kelompok belajar, dan informasi kemahasiswaan.",
        "Batasan_Wewenang": "Membuat postingan & balasan sesuai pedoman moderasi komunitas kampus."
    },
    {
        "No": 11,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "EVALUASI & PRESTASI",
        "Menu_Item": "Nilai & Progres",
        "Route_Path": "/grades",
        "Icon": "CheckSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Rekapitulasi nilai tugas, kuis, UTS, UAS, umpan balik dosen, diagram capaian kompetensi CPL, dan evaluasi hasil belajar semester berjalan.",
        "Batasan_Wewenang": "Hanya menampilkan nilai yang sudah difinalisasi atau diizinkan terlihat oleh dosen."
    },
    {
        "No": 12,
        "Role_Code": "STUDENT",
        "Role_Name": "Mahasiswa",
        "Menu_Group": "EVALUASI & PRESTASI",
        "Menu_Item": "Sertifikat & Portofolio",
        "Route_Path": "/certificates",
        "Icon": "Award",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Portofolio capaian akademik mahasiswa serta penerbitan dan verifikasi sertifikat kompetensi berbasis kode QR digital resmi (/verify/certificate/[code]).",
        "Batasan_Wewenang": "Mengunduh sertifikat sah milik mahasiswa yang bersangkutan."
    },

    # 2. TEACHING_ASSISTANT
    {
        "No": 13,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Beranda",
        "Route_Path": "/ta",
        "Icon": "GraduationCap",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Dashboard sentral asisten: ringkasan kelas yang dibina, jumlah tugas mahasiswa yang menunggu pemeriksaan, dan jadwal praktikum/asistensi.",
        "Batasan_Wewenang": "Tergantung penugasan asisten oleh Dosen Pengampu."
    },
    {
        "No": 14,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Kalender kegiatan terpadu jadwal mengasistensi praktikum dipadukan dengan jadwal kuliah pribadi.",
        "Batasan_Wewenang": "Read-only jadwal asistensi dan perkuliahan."
    },
    {
        "No": 15,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah unread notifikasi",
        "Deskripsi_Fitur": "Pusat notifikasi penerimaan tugas baru dari mahasiswa, instruksi dosen pengampu, dan pembaruan jadwal praktikum.",
        "Batasan_Wewenang": "Mengelola notifikasi peran asistensi."
    },
    {
        "No": 16,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Pengumuman",
        "Route_Path": "/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Papan pengumuman akademik fakultas dan program studi.",
        "Batasan_Wewenang": "Read-only pengumuman publik/akademik."
    },
    {
        "No": 17,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "MODE ASISTEN",
        "Menu_Item": "Kelas Diasistensi",
        "Route_Path": "/ta/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen kelas asistensi: melihat peserta kelas binaan, mengunggah materi praktikum (jika diizinkan), dan memoderasi forum diskusi praktikum.",
        "Batasan_Wewenang": "Hanya pada kelas yang terdaftar pada tabel class_assistants."
    },
    {
        "No": 18,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "MODE ASISTEN",
        "Menu_Item": "Antrean Koreksi",
        "Route_Path": "/ta/grading",
        "Icon": "ClipboardList",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah tugas belum dinilai (taGradingCount)",
        "Deskripsi_Fitur": "Antrean penilaian tugas mahasiswa: memeriksa berkas jawaban, menginput nilai draf (DRAFT score), dan memberikan catatan umpan balik per mahasiswa.",
        "Batasan_Wewenang": "DILARANG memfinalisasi nilai akhir (hanya wewenang Dosen Pengampu)."
    },
    {
        "No": 19,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "MODE ASISTEN",
        "Menu_Item": "Pantau Ujian",
        "Route_Path": "/ta/exam-monitor",
        "Icon": "ShieldAlert",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Ruang proctoring/pengawasan CBT online secara langsung: memantau telemetri peserta ujian, peringatan tab switch/blur, dan status pengumpulan ujian.",
        "Batasan_Wewenang": "Memantau jalannya ujian dan mencatat dugaan pelanggaran integritas akademik."
    },
    {
        "No": 20,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Kelas Saya",
        "Route_Path": "/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Mengikuti kelas perkuliahan sebagai mahasiswa biasa (mengunduh materi, mengumpulkan tugas pribadi).",
        "Batasan_Wewenang": "Sama dengan hak mahasiswa biasa."
    },
    {
        "No": 21,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Presensi",
        "Route_Path": "/attendance",
        "Icon": "CalendarCheck2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Presensi kehadiran pribadi pada mata kuliah yang diambil sebagai mahasiswa.",
        "Batasan_Wewenang": "Presensi diri sendiri."
    },
    {
        "No": 22,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Ujian Aktif",
        "Route_Path": "/exams",
        "Icon": "FileCheck2",
        "Is_Shortcut": True,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Mengikuti ujian sebagai mahasiswa (CBT ujian pribadi).",
        "Batasan_Wewenang": "Hanya bila ada jadwal ujian kelas yang diikutinya."
    },
    {
        "No": 23,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Pustaka Digital",
        "Route_Path": "/library",
        "Icon": "Library",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses materi bacaan dan referensi digital kampus.",
        "Batasan_Wewenang": "Akses baca dan unduh."
    },
    {
        "No": 24,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Tanya AI SIAJAR",
        "Route_Path": "/ai-assistant",
        "Icon": "Sparkles",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Asisten cerdas AI untuk referensi studi dan praktikum.",
        "Batasan_Wewenang": "Tanya-jawab AI interaktif."
    },
    {
        "No": 25,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "PEMBELAJARAN",
        "Menu_Item": "Komunitas",
        "Route_Path": "/community",
        "Icon": "MessageSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Forum komunitas mahasiswa dan asisten kampus.",
        "Batasan_Wewenang": "Partisipasi forum umum."
    },
    {
        "No": 26,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "EVALUASI & PRESTASI",
        "Menu_Item": "Nilai & Progres",
        "Route_Path": "/grades",
        "Icon": "CheckSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Melihat nilai hasil belajar akademik pribadi.",
        "Batasan_Wewenang": "Hanya nilai pribadi."
    },
    {
        "No": 27,
        "Role_Code": "TEACHING_ASSISTANT",
        "Role_Name": "Asisten Dosen",
        "Menu_Group": "EVALUASI & PRESTASI",
        "Menu_Item": "Sertifikat & Portofolio",
        "Route_Path": "/certificates",
        "Icon": "Award",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Portofolio dan sertifikat penugasan asisten laboratorium/asisten dosen resmi.",
        "Batasan_Wewenang": "Akses sertifikat diri sendiri."
    },

    # 3. LECTURER
    {
        "No": 28,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Dashboard Pengajar",
        "Route_Path": "/lecturer",
        "Icon": "LayoutDashboard",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Dashboard komprehensif pengajaran: rekapitulasi kelas aktif, jadwal mengajar hari ini, tingkat kehadiran kelas, tugas yang perlu diperiksa, dan progress SAP perkuliahan.",
        "Batasan_Wewenang": "Akses data kelas dan mahasiswa yang diampu."
    },
    {
        "No": 29,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Kalender pengajaran dosen: jadwal kuliah mingguan, tenggat penilaian tugas, jadwal UTS/UAS kelas diampu, dan agenda bimbingan mahasiswa.",
        "Batasan_Wewenang": "Read-only agenda pengajaran dan kalender akademik."
    },
    {
        "No": 30,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah unread notifikasi",
        "Deskripsi_Fitur": "Notifikasi pengumpulan tugas, permohonan bimbingan mahasiswa wali, konfirmasi persetujuan revisi nilai dari Kaprodi, dan pengingat presensi.",
        "Batasan_Wewenang": "Notifikasi operasional pengajaran."
    },
    {
        "No": 31,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Pengumuman",
        "Route_Path": "/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Membaca dan mempublikasikan pengumuman perkuliahan untuk kelas yang diampu atau prodi.",
        "Batasan_Wewenang": "Membuat pengumuman dengan target kelas yang diampu."
    },
    {
        "No": 32,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "PENGAJARAN & PEMBELAJARAN",
        "Menu_Item": "Kelas Diampu",
        "Route_Path": "/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen penuh ruang kelas: mempublikasikan materi (Markdown/PDF), membuat penugasan terstruktur berbatas tenggat, menunjuk asisten dosen (class_assistants), dan moderasi forum diskusi (pin/kunci topik).",
        "Batasan_Wewenang": "Penuh atas kelas binaannya. Tidak dapat mengakses kelas dosen lain."
    },
    {
        "No": 33,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "PENGAJARAN & PEMBELAJARAN",
        "Menu_Item": "Presensi",
        "Route_Path": "/attendance",
        "Icon": "CalendarCheck2",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Buka/tutup sesi perkuliahan 1-16, generate token QR presensi dinamis atau kode unik, persetujuan izin/sakit, dan verifikasi ambang kehadiran >= 75% syarat UAS.",
        "Batasan_Wewenang": "Mengontrol kehadiran pada kelas yang diampu."
    },
    {
        "No": 34,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "PENGAJARAN & PEMBELAJARAN",
        "Menu_Item": "Pustaka Digital",
        "Route_Path": "/library",
        "Icon": "Library",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Mempublikasikan modul ajar mandiri, artikel ilmiah, dan bahan pustaka suplemen untuk mahasiswa institusi.",
        "Batasan_Wewenang": "Unggah dan kelola materi ajar terverifikasi."
    },
    {
        "No": 35,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "UJIAN & PENILAIAN",
        "Menu_Item": "Ujian & Kuis",
        "Route_Path": "/exams",
        "Icon": "PlusCircle",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pembuatan kuis online & evaluasi ujian resmi (UTS/UAS): pengaturan durasi, pembatasan waktu buka-tutup, pengacakan soal, dan aktivasi telemetri proctoring.",
        "Batasan_Wewenang": "Penuh pada penjadwalan evaluasi kelas sendiri."
    },
    {
        "No": 36,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "UJIAN & PENILAIAN",
        "Menu_Item": "Bank Soal",
        "Route_Path": "/exams/question-bank",
        "Icon": "FolderArchive",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen repositori butir soal dosen (Pilihan Ganda dengan kunci jawaban, Esai, Koding) terklasifikasi menurut capaian pembelajaran mata kuliah.",
        "Batasan_Wewenang": "Bank soal bersifat privat per dosen atau dibagikan ke tim teaching."
    },
    {
        "No": 37,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "UJIAN & PENILAIAN",
        "Menu_Item": "Review Essay & Coding",
        "Route_Path": "/exams/review",
        "Icon": "CheckSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah review pending (lecturerReviewCount)",
        "Deskripsi_Fitur": "Pemeriksaan manual jawaban esai dan peninjauan kode program mahasiswa dengan rubrik evaluasi dan umpan balik personal.",
        "Batasan_Wewenang": "Memberikan skor evaluasi subjektif ujian."
    },
    {
        "No": 38,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "UJIAN & PENILAIAN",
        "Menu_Item": "Analitik & Nilai",
        "Route_Path": "/analytics",
        "Icon": "Activity",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Gradebook terpadu berbobot dinamis (Tugas, Kuis, UTS, UAS = 100%), konversi huruf mutu (A-E), ekspor CSV/Excel, penguncian nilai permanen (Finalize), dan permohonan revisi nilai pasca-finalisasi ke Kaprodi.",
        "Batasan_Wewenang": "Dapat mengunci nilai kelas. Setelah terkunci, perubahan wajib melalui approval Kaprodi."
    },
    {
        "No": 39,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "LAINNYA",
        "Menu_Item": "Komunitas",
        "Route_Path": "/community",
        "Icon": "MessageSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Forum komunikasi civitas akademika dan koordinasi antarstaf pengajar.",
        "Batasan_Wewenang": "Partisipasi diskusi institusional."
    },
    {
        "No": 40,
        "Role_Code": "LECTURER",
        "Role_Name": "Dosen Pengampu",
        "Menu_Group": "LAINNYA",
        "Menu_Item": "Mahasiswa Bimbingan",
        "Route_Path": "/lecturer/mentoring",
        "Icon": "Users",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Dashboard Dosen Wali (Bimbingan Akademik): pemantauan rekam jejak IPS/IPK, riwayat konsultasi, persetujuan KRS (legacy flow), dan deteksi dini mahasiswa berisiko.",
        "Batasan_Wewenang": "Hanya untuk mahasiswa yang ditetapkan di bawah perwaliannya."
    },

    # 4. PROGRAM_COORDINATOR
    {
        "No": 41,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Dashboard Prodi",
        "Route_Path": "/coordinator",
        "Icon": "Compass",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Dashboard pimpinan prodi: statistik rata-rata IPK angkatan, rasio dosen-mahasiswa, ketercapaian SAP perkuliahan, dan distribusi beban mengajar SKS.",
        "Batasan_Wewenang": "Cakupan data terbatas pada Program Studi yang dipimpinnya."
    },
    {
        "No": 42,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Kalender agenda akademik prodi: batas akhir input nilai, jadwal rapat kurikulum, dan jadwal ujian komprehensif/sidang.",
        "Batasan_Wewenang": "Read-only agenda prodi dan universitas."
    },
    {
        "No": 43,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah unread notifikasi",
        "Deskripsi_Fitur": "Pemberitahuan pengajuan persetujuan revisi nilai final dari dosen, permohonan pembukaan kelas baru, dan laporan mahasiswa berisiko.",
        "Batasan_Wewenang": "Notifikasi tata kelola prodi."
    },
    {
        "No": 44,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "MANAJEMEN PRODI",
        "Menu_Item": "Kurikulum & CPL",
        "Route_Path": "/coordinator/curriculum",
        "Icon": "BookOpen",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Penyusunan kurikulum prodi, penetapan Capaian Pembelajaran Lulusan (CPL), bobot semester paket, dan pemetaan prasyarat matkul dengan deteksi otomatis circular prerequisites.",
        "Batasan_Wewenang": "Wewenang penuh kurikulum prodi terkait."
    },
    {
        "No": 45,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "MANAJEMEN PRODI",
        "Menu_Item": "Mata Kuliah",
        "Route_Path": "/coordinator/courses",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Master data mata kuliah prodi: pengaturan kode matkul, SKS (teori/praktik), silabus acuan, dan status keaktifan penawaran semester.",
        "Batasan_Wewenang": "CRUD mata kuliah di prodi sendiri."
    },
    {
        "No": 46,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "MANAJEMEN PRODI",
        "Menu_Item": "Penugasan & Kelas",
        "Route_Path": "/coordinator/assignments",
        "Icon": "Users",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Penetapan dosen pengampu (teaching assignment) pada rombongan belajar/kelas semester aktif, serta persetujuan pembukaan rombel paralel.",
        "Batasan_Wewenang": "Menugaskan dosen homebase prodi pada kelas-kelas prodi."
    },
    {
        "No": 47,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "MONITORING",
        "Menu_Item": "Monitoring",
        "Route_Path": "/coordinator/monitoring",
        "Icon": "Activity",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Monitoring real-time keterlaksanaan proses pembelajaran: progres pengisian materi pertemuan 1-16 dosen, rekap kehadiran, dan ketepatan waktu input nilai.",
        "Batasan_Wewenang": "Pemantauan seluruh kelas di bawah prodi."
    },
    {
        "No": 48,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "MONITORING",
        "Menu_Item": "Mahasiswa Berisiko",
        "Route_Path": "/coordinator/monitoring/at-risk",
        "Icon": "AlertCircle",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Early Warning System (EWS) mahasiswa berisiko: mendeteksi mahasiswa terancam DO atau bermasalah berdasarkan IPK < 2.00, kehadiran < 75%, atau ketidakaktifan submission tugas.",
        "Batasan_Wewenang": "Melihat daftar mahasiswa berisiko dan menginstruksikan tindak lanjut ke Dosen Wali."
    },
    {
        "No": 49,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "PERSETUJUAN & LAPORAN",
        "Menu_Item": "Persetujuan",
        "Route_Path": "/coordinator/approvals",
        "Icon": "CheckCircle2",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah permohonan pending (coordinatorApprovalsCount)",
        "Deskripsi_Fitur": "Verifikasi dan otorisasi persetujuan perubahan nilai final dari dosen pengampu (grade_change_requests) dengan catatan evaluasi akademik resmi.",
        "Batasan_Wewenang": "Kaprodi menjadi pemutus wewenang revisi nilai sebelum dieksekusi Staf BAAK."
    },
    {
        "No": 50,
        "Role_Code": "PROGRAM_COORDINATOR",
        "Role_Name": "Koordinator Prodi",
        "Menu_Group": "PERSETUJUAN & LAPORAN",
        "Menu_Item": "Laporan & Evaluasi",
        "Route_Path": "/coordinator/reports",
        "Icon": "FileSpreadsheet",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Laporan ketercapaian CPL prodi, rekapitulasi distribusi nilai prodi, dan laporan mutu perkuliahan untuk kebutuhan akreditasi LAM-INFOKOM/BAN-PT.",
        "Batasan_Wewenang": "Ekspor dan pelaporan analitik mutu prodi."
    },

    # 5. ACADEMIC_STAFF
    {
        "No": 51,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Dashboard",
        "Route_Path": "/staff",
        "Icon": "LayoutDashboard",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Dashboard operasional BAAK/Akademik: jumlah mahasiswa aktif per angkatan, status penjadwalan kelas, antrean verifikasi berkas, dan agenda kerja harian.",
        "Batasan_Wewenang": "Operasional administrasi akademik seluruh fakultas/universitas."
    },
    {
        "No": 52,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Kalender",
        "Route_Path": "/calendar",
        "Icon": "CalendarDays",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen kalender akademik induk: masa pengisian KRS, masa perkuliahan aktif, minggu tenang, dan periode ujian resmi.",
        "Batasan_Wewenang": "Mengatur jadwal periode kegiatan akademik kampus."
    },
    {
        "No": 53,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah unread notifikasi",
        "Deskripsi_Fitur": "Notifikasi pengajuan berkas/surat mahasiswa, jadwal baru, dan persetujuan perubahan nilai dari Kaprodi yang siap dieksekusi ke master nilai.",
        "Batasan_Wewenang": "Notifikasi administratif harian."
    },
    {
        "No": 54,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "DATA MASTER",
        "Menu_Item": "Mahasiswa",
        "Route_Path": "/staff/master/students",
        "Icon": "Users",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen data induk mahasiswa: pengelolaan NIM, biodata, status aktif/cuti/lulus, penetapan dosen wali, dan impor massal CSV 3-tahap dengan validasi error baris.",
        "Batasan_Wewenang": "CRUD data induk mahasiswa dan impor massal."
    },
    {
        "No": 55,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "DATA MASTER",
        "Menu_Item": "Dosen",
        "Route_Path": "/staff/master/lecturers",
        "Icon": "UserCheck",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengelolaan data induk dosen: NIDN/NIP, kepangkatan akademik, homebase prodi, dan status keaktifan mengajar.",
        "Batasan_Wewenang": "CRUD data pengajar institusi."
    },
    {
        "No": 56,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "DATA MASTER",
        "Menu_Item": "Data Akademik",
        "Route_Path": "/staff/master",
        "Icon": "Database",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Master data program studi (programs), tahun akademik & semester aktif (semesters), serta master ruang perkuliahan (rooms beserta kapasitas & koordinat geofencing).",
        "Batasan_Wewenang": "CRUD entitas master institusional."
    },
    {
        "No": 57,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "KELAS & AKADEMIK",
        "Menu_Item": "Jadwal",
        "Route_Path": "/staff/schedules",
        "Icon": "CalendarClock",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Penyusunan jadwal kuliah dan jadwal ujian dengan algoritma pendeteksi bentrok jadwal dosen mengajar, pemakaian ruang, dan mahasiswa.",
        "Batasan_Wewenang": "Menyusun dan menerbitkan jadwal perkuliahan terkoordinasi."
    },
    {
        "No": 58,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "KELAS & AKADEMIK",
        "Menu_Item": "Kelas & Peserta",
        "Route_Path": "/staff/classes",
        "Icon": "Layers",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pembentukan rombel kelas, kuota daya tampung, enrollment peserta kelas secara batch/massal via CSV, dan perpindahan kelas mahasiswa.",
        "Batasan_Wewenang": "Mengelola kapasitas dan penetapan peserta kelas."
    },
    {
        "No": 59,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "KELAS & AKADEMIK",
        "Menu_Item": "Nilai & Presensi",
        "Route_Path": "/staff/grades",
        "Icon": "CheckSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Rekapitulasi nilai institusional, pemantauan penguncian gradebook, eksekusi pembaruan nilai final pasca-persetujuan Kaprodi, dan laporan presensi komprehensif.",
        "Batasan_Wewenang": "Mengeksekusi nilai final setelah otorisasi Kaprodi."
    },
    {
        "No": 60,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "KONTEN & LAYANAN",
        "Menu_Item": "Verifikasi Berkas",
        "Route_Path": "/staff/services/verification",
        "Icon": "FileText",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pemrosesan permohonan surat keterangan aktif kuliah, surat dispensasi, cuti akademik, dan legalisasi transkrip nilai resmi dengan nomor registrasi unik.",
        "Batasan_Wewenang": "Memverifikasi, menyetujui, dan menerbitkan surat resmi PDF."
    },
    {
        "No": 61,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "KONTEN & LAYANAN",
        "Menu_Item": "Pengumuman & Event",
        "Route_Path": "/staff/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Publikasi agenda event kampus, kalender registrasi, dan pengumuman administratif ke civitas akademika.",
        "Batasan_Wewenang": "Mempublikasikan pengumuman administratif kampus."
    },
    {
        "No": 62,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "KONTEN & LAYANAN",
        "Menu_Item": "Pustaka & Sertifikat",
        "Route_Path": "/staff/content",
        "Icon": "BookOpen",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengelolaan repositori berkas publik, template dokumen institusi, dan penerbitan sertifikat kelulusan/kegiatan terverifikasi.",
        "Batasan_Wewenang": "Mengelola aset dokumen institusi."
    },
    {
        "No": 63,
        "Role_Code": "ACADEMIC_STAFF",
        "Role_Name": "Staf Akademik",
        "Menu_Group": "KONTEN & LAYANAN",
        "Menu_Item": "Moderasi Komunitas",
        "Route_Path": "/staff/moderation",
        "Icon": "MessageSquare",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Moderasi forum komunitas civitas: menindaklanjuti laporan konten tidak pantas atau postingan yang melanggar tata tertib kampus.",
        "Batasan_Wewenang": "Menyembunyikan/menghapus konten forum yang melanggar ketentuan."
    },

    # 6. SYSTEM_ADMIN
    {
        "No": 64,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Dashboard Sistem",
        "Route_Path": "/admin/system",
        "Icon": "Server",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Dashboard teknis kesehatan infrastruktur: beban CPU & RAM, kapasitas penyimpanan, status koneksi Supabase & PgBouncer, status background worker, dan error rate.",
        "Batasan_Wewenang": "Wewenang teknis infrastruktur. TIDAK MEMILIKI akses membaca/mengedit data nilai/akademik mahasiswa."
    },
    {
        "No": 65,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah unread notifikasi",
        "Deskripsi_Fitur": "Peringatan darurat teknis: kegagalan cron job, lonjakan kesalahan server, peringatan disk space, dan percobaan intrusi keamanan.",
        "Batasan_Wewenang": "Peringatan operasional teknis sistem."
    },
    {
        "No": 66,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "MONITORING & INTEGRASI",
        "Menu_Item": "Monitoring Sistem",
        "Route_Path": "/admin/system/monitoring",
        "Icon": "Activity",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Telemetri uptime layanan, latensi response time server action, performa query database Postgres, koneksi Supabase Realtime, dan error tracking.",
        "Batasan_Wewenang": "Pemantauan telemetri performa dan ketersediaan layanan."
    },
    {
        "No": 67,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "MONITORING & INTEGRASI",
        "Menu_Item": "Integrasi",
        "Route_Path": "/admin/system/integrations",
        "Icon": "Globe",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen integrasi eksternal: Google OAuth Client ID, konfigurasi Supabase Storage bucket, webhook eksternal, dan integrasi feeder PDDIKTI.",
        "Batasan_Wewenang": "Konfigurasi API credentials dan konektivitas antarsistem."
    },
    {
        "No": 68,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "KEAMANAN & CADANGAN",
        "Menu_Item": "Keamanan",
        "Route_Path": "/admin/system/security",
        "Icon": "Lock",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pemantauan deteksi sesi dan perangkat (user_devices), aturan rate-limiting login (anti brute-force 5x gagal lock 15 menit), dan pencabutan sesi darurat.",
        "Batasan_Wewenang": "Pengendalian perimeter keamanan siber dan sesi pengguna."
    },
    {
        "No": 69,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "KEAMANAN & CADANGAN",
        "Menu_Item": "Backup & Restore",
        "Route_Path": "/admin/system/backup",
        "Icon": "FolderArchive",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Jadwal pencadangan otomatis skema basis data publik (scripts/backup-db.sh), manajemen snapshot cadangan, dan skrip verifikasi restorasi data.",
        "Batasan_Wewenang": "Menjalankan prosedur backup dan disaster recovery testing."
    },
    {
        "No": 70,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "PENGATURAN & AUDIT",
        "Menu_Item": "Pengaturan Platform",
        "Route_Path": "/admin/system/settings",
        "Icon": "Sliders",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Konfigurasi platform global: domain email yang diizinkan (ALLOWED_EMAIL_DOMAIN), mode pemeliharaan (maintenance mode), batas ukuran upload, dan feature flags.",
        "Batasan_Wewenang": "Konfigurasi variabel runtime platform."
    },
    {
        "No": 71,
        "Role_Code": "SYSTEM_ADMIN",
        "Role_Name": "System Administrator",
        "Menu_Group": "PENGATURAN & AUDIT",
        "Menu_Item": "Log Audit",
        "Route_Path": "/admin/system/audit",
        "Icon": "ScrollText",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Audit trail permanen (audit_logs) yang bersifat immutable: merekam waktu, aktor, peran, aksi, entitas, IP address, user-agent, serta nilai sebelum dan sesudah perubahan data sensitif.",
        "Batasan_Wewenang": "Read-only riwayat log forensik (tidak dapat dimodifikasi atau dihapus)."
    },

    # 7. SUPER_ADMIN
    {
        "No": 72,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Dashboard Universitas",
        "Route_Path": "/admin",
        "Icon": "LayoutDashboard",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Dashboard eksekutif universitas: rekapitulasi data seluruh sivitas akademika, sebaran mahasiswa per prodi, efektivitas perkuliahan, dan statistik kepatuhan sistem.",
        "Batasan_Wewenang": "Pimpinan tertinggi dengan tinjauan makro seluruh institusi."
    },
    {
        "No": 73,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "UTAMA",
        "Menu_Item": "Notifikasi",
        "Route_Path": "/notifications",
        "Icon": "Bell",
        "Is_Shortcut": False,
        "Badge_Counter": "Jumlah unread notifikasi",
        "Deskripsi_Fitur": "Notifikasi strategis institusional, peringatan keamanan tingkat tinggi, dan eskalasi audit insiden.",
        "Batasan_Wewenang": "Pemberitahuan tingkat eksekutif."
    },
    {
        "No": 74,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "PENGGUNA & AKSES",
        "Menu_Item": "Kelola Pengguna",
        "Route_Path": "/admin/users",
        "Icon": "Users",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen seluruh akun pengguna (Mahasiswa, Dosen, Kaprodi, Staf): aktivasi/suspend akun, reset password paksa, dan fitur impersonasi akun berproteksi HMAC fail-closed untuk troubleshooting.",
        "Batasan_Wewenang": "Wewenang penuh akun pengguna dan impersonasi berizin audit."
    },
    {
        "No": 75,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "PENGGUNA & AKSES",
        "Menu_Item": "Role & Permission",
        "Route_Path": "/admin/roles",
        "Icon": "ShieldAlert",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Manajemen matriks Role-Based Access Control (RBAC): penugasan multi-role, penetapan ruang lingkup peran (GLOBAL, PROGRAM, CLASS), dan pengaturan granular hak akses.",
        "Batasan_Wewenang": "Mengatur hierarki dan matriks otorisasi sistem."
    },
    {
        "No": 76,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "KEBIJAKAN & GLOBAL",
        "Menu_Item": "Kebijakan",
        "Route_Path": "/admin/policies",
        "Icon": "Scale",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pengaturan kebijakan akademik institusi: skala konversi huruf mutu (A-E), batas minimal kehadiran ujian (default 75%), rumus SKS maksimal berdasarkan IPS semester lalu.",
        "Batasan_Wewenang": "Menetapkan aturan bisnis akademik universitas."
    },
    {
        "No": 77,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "KEBIJAKAN & GLOBAL",
        "Menu_Item": "Pengumuman Global",
        "Route_Path": "/admin/announcements",
        "Icon": "Megaphone",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Publikasi pengumuman darurat atau keputusan rektorat berskala luas ke seluruh pengguna sistem dengan push notifikasi.",
        "Batasan_Wewenang": "Broadcast pengumuman ke seluruh sivitas kampus."
    },
    {
        "No": 78,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "SISTEM",
        "Menu_Item": "Monitoring Sistem",
        "Route_Path": "/admin/system/monitoring",
        "Icon": "Activity",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared hub ke telemetri kesehatan server dan infrastruktur.",
        "Batasan_Wewenang": "Shared akses teknis (collapsible grup)."
    },
    {
        "No": 79,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "SISTEM",
        "Menu_Item": "Integrasi",
        "Route_Path": "/admin/system/integrations",
        "Icon": "Globe",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared hub ke konfigurasi integrasi OAuth, storage, dan API eksternal.",
        "Batasan_Wewenang": "Shared akses teknis."
    },
    {
        "No": 80,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "SISTEM",
        "Menu_Item": "Keamanan",
        "Route_Path": "/admin/system/security",
        "Icon": "Lock",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared hub ke manajemen keamanan sesi dan pembatasan login.",
        "Batasan_Wewenang": "Shared akses teknis."
    },
    {
        "No": 81,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "SISTEM",
        "Menu_Item": "Backup & Restore",
        "Route_Path": "/admin/system/backup",
        "Icon": "FolderArchive",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared hub ke status backup basis data dan opsi pemulihan.",
        "Batasan_Wewenang": "Shared akses teknis."
    },
    {
        "No": 82,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "SISTEM",
        "Menu_Item": "Pengaturan Platform",
        "Route_Path": "/admin/system/settings",
        "Icon": "Sliders",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared hub ke pengaturan feature flags dan environment platform.",
        "Batasan_Wewenang": "Shared akses teknis."
    },
    {
        "No": 83,
        "Role_Code": "SUPER_ADMIN",
        "Role_Name": "Super Administrator",
        "Menu_Group": "SISTEM",
        "Menu_Item": "Log Audit",
        "Route_Path": "/admin/system/audit",
        "Icon": "ScrollText",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Akses shared hub ke log audit permanen aktivitas sistem.",
        "Batasan_Wewenang": "Shared akses teknis."
    },

    # 8. SHARED_SUPPORT (Semua 7 Role)
    {
        "No": 84,
        "Role_Code": "ALL_ROLES",
        "Role_Name": "Semua Role (Bersama)",
        "Menu_Group": "PENGATURAN & BANTUAN",
        "Menu_Item": "Pengaturan Tampilan",
        "Route_Path": "/settings",
        "Icon": "Settings",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Preferensi personalisasi antarmuka: mode tampilan (Light / Dark / System Default), kepadatan elemen, bahasa, dan pengaturan notifikasi personal.",
        "Batasan_Wewenang": "Dapat diakses oleh seluruh pengguna terdaftar."
    },
    {
        "No": 85,
        "Role_Code": "ALL_ROLES",
        "Role_Name": "Semua Role (Bersama)",
        "Menu_Group": "PENGATURAN & BANTUAN",
        "Menu_Item": "Pusat Bantuan",
        "Route_Path": "/help",
        "Icon": "LifeBuoy",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Pusat bantuan komprehensif, petunjuk operasional sistem per role, FAQ interaktif, dan formulir pengajuan kendala teknis (helpdesk).",
        "Batasan_Wewenang": "Dapat diakses oleh seluruh pengguna terdaftar."
    },
    {
        "No": 86,
        "Role_Code": "ALL_ROLES",
        "Role_Name": "Semua Role (Bersama)",
        "Menu_Group": "PENGATURAN & BANTUAN",
        "Menu_Item": "Transparansi Data",
        "Route_Path": "/transparency",
        "Icon": "Eye",
        "Is_Shortcut": False,
        "Badge_Counter": "-",
        "Deskripsi_Fitur": "Kepatuhan terhadap UU Pelindungan Data Pribadi (UU PDP): ringkasan data profil yang disimpan, daftar sesi dan perangkat terdaftar (/devices), tombol darurat 'Ini bukan saya', dan persetujuan privasi.",
        "Batasan_Wewenang": "Dapat diakses oleh seluruh pengguna terdaftar untuk audit data mandiri."
    }
]

def main():
    print("Mengonversi data ke DataFrame...")
    df = pd.DataFrame(DATA)
    
    docs_dir = os.path.abspath("docs")
    os.makedirs(docs_dir, exist_ok=True)
    
    csv_path = os.path.join(docs_dir, "SIAJAR_Fitur_dan_Menu_Role.csv")
    xlsx_path = os.path.join(docs_dir, "SIAJAR_Fitur_dan_Menu_Role.xlsx")
    html_path = os.path.join(docs_dir, "SIAJAR_Fitur_dan_Menu_Role.html")
    pdf_path = os.path.join(docs_dir, "SIAJAR_Fitur_dan_Menu_Role.pdf")
    
    # 1. Simpan CSV & Excel
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"File CSV berhasil dibuat: {csv_path}")
    
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Semua Menu & Fitur", index=False)
        # Tab per role
        for role in df["Role_Code"].unique():
            sub_df = df[df["Role_Code"] == role]
            sheet_title = role[:31] # max 31 chars
            sub_df.to_excel(writer, sheet_name=sheet_title, index=False)
    print(f"File Excel berhasil dibuat: {xlsx_path}")
    
    # 2. Buat Dokumen HTML untuk di-render ke PDF
    html_content = generate_html(df)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"File HTML berhasil dibuat: {html_path}")
    
    # 3. Render ke PDF via Microsoft Edge Headless
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

def generate_html(df):
    role_titles = {
        "STUDENT": "1. Mahasiswa (STUDENT)",
        "TEACHING_ASSISTANT": "2. Asisten Dosen (TEACHING_ASSISTANT)",
        "LECTURER": "3. Dosen Pengampu (LECTURER)",
        "PROGRAM_COORDINATOR": "4. Koordinator Program Studi (PROGRAM_COORDINATOR / Kaprodi)",
        "ACADEMIC_STAFF": "5. Staf Akademik (ACADEMIC_STAFF / BAAK)",
        "SYSTEM_ADMIN": "6. System Administrator (SYSTEM_ADMIN)",
        "SUPER_ADMIN": "7. Super Administrator (SUPER_ADMIN)",
        "ALL_ROLES": "8. Menu Bersama Seluruh Role (PENGATURAN & BANTUAN)"
    }
    
    sections_html = ""
    for role_code, title in role_titles.items():
        role_df = df[df["Role_Code"] == role_code]
        rows_html = ""
        for _, row in role_df.iterrows():
            badge_html = f"<span class='badge'>{row['Badge_Counter']}</span>" if row['Badge_Counter'] != "-" else "<span class='text-muted'>-</span>"
            shortcut_html = " <span class='badge-shortcut'>Pintasan</span>" if row['Is_Shortcut'] else ""
            rows_html += f"""
            <tr>
                <td style="font-weight: 600; width: 14%;">{row['Menu_Group']}</td>
                <td style="font-weight: 600; width: 18%; color: #1e3a8a;">
                    {row['Menu_Item']}{shortcut_html}<br>
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
                        <th>Item & Rute</th>
                        <th>Badge / Status</th>
                        <th>Deskripsi & Fungsionalitas Fitur</th>
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
        .badge-shortcut {{
            display: inline-block;
            background: #fef3c7;
            color: #b45309;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            margin-left: 4px;
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
        <p><strong>Spesifikasi Lengkap Menu, Rute & Fungsionalitas Setiap Peran (Role)</strong></p>
    </div>
    
    <div class="meta-box">
        <div><strong>Status Sistem:</strong> Fase 2E/3 (Single Source of Truth <code>src/lib/config/menu-config.ts</code>)</div>
        <div><strong>Cakupan:</strong> 7 Role + 1 Menu Dukungan Bersama (Total 86 Item Menu Terdefinisi)</div>
        <div><strong>Arsitektur:</strong> RBAC, RLS PostgreSQL, Next.js 14 App Router</div>
    </div>

    {sections_html}

    <div class="footer">
        Dokumen Resmi SIAJAR • Diterbitkan Otomatis untuk Penjaminan Mutu & Otorisasi Sistem Akademik
    </div>
</body>
</html>
"""
    return html

if __name__ == "__main__":
    main()
