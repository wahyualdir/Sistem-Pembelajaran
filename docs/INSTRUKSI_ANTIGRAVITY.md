SIAJAR — Instruksi Pengerjaan untuk Antigravity
Versi 2 · Oktober 2026 · Bahasa antarmuka dan dokumentasi: Indonesia
Berkas ini adalah satu-satunya sumber instruksi untuk tahap penyempurnaan SIAJAR. Taruh di docs/INSTRUKSI_ANTIGRAVITY.md pada repo, lalu tempel prompt pembuka di bawah ke chat Antigravity.

Prompt pembuka (tempel ke Antigravity)
Baca seluruh isi docs/INSTRUKSI_ANTIGRAVITY.md sebelum menyentuh kode apa pun.

Kerjakan Fase 0 sampai Fase 7 secara berurutan dan mandiri. Jangan berhenti untuk meminta
konfirmasi di antara fase. Kalau menemukan hal yang tidak jelas, pilih opsi paling aman,
catat keputusannya di docs/KEPUTUSAN.md, lalu lanjut.

Mulai dengan audit kode (Fase 0, langkah 1). Jangan berasumsi nama tabel, kolom, atau rute:
semua nama di dokumen ini adalah sketsa, nama sebenarnya ikuti yang ada di repo.

Setelah tiap fase selesai: jalankan typecheck, lint, test, dan build; perbaiki sampai hijau;
commit; tulis ringkasan di docs/PROGRESS.md. Jangan menghapus atau mengubah perilaku fitur
yang sudah ada kecuali dinyatakan eksplisit di dokumen.


1. Cara kerja yang diminta
Audit dulu, baru ubah. Fase 0 langkah 1 adalah membaca repo: struktur folder, src/lib/config/menu-config.ts, skema database di supabase/migrations, kebijakan RLS yang ada, daftar server action, dan komponen UI bersama. Hasil audit ditulis ke docs/AUDIT_AWAL.md (maksimal dua halaman): nama tabel sebenarnya, helper RLS yang sudah ada, library UI dan chart yang dipakai, pola validasi, pola penanganan error.
Pakai yang sudah ada. Kalau repo sudah punya helper, komponen, atau pola (misalnya helper RLS, komponen tabel, toast, form), pakai itu. Jangan membuat versi kedua.
Satu fase, satu rangkaian commit. Pesan commit memakai awalan konvensional dan deskripsi Indonesia, contoh: feat(tugas): tambah aturan keterlambatan dan perpanjangan tenggat.
Migrasi database selalu berupa berkas baru bernomor di supabase/migrations. Jangan mengedit migrasi lama. Setiap migrasi idempoten sejauh mungkin (if not exists), dan di komentar atas berkas tulis cara membatalkannya.
Setelah tiap fase jalankan perintah pemeriksaan sesuai package manager repo (typecheck, lint, test unit, build). Fase dianggap selesai hanya kalau semuanya lolos dan semua poin "Selesai bila" terpenuhi.
Jangan menambah fitur di luar dokumen. Tidak ada PWA, tidak ada notifikasi push, tidak ada mode hemat data. Kalau muncul ide perbaikan, catat di docs/IDE_LANJUTAN.md dan jangan dikerjakan.
Jangan menebak API library dari ingatan. Sebelum memakai library baru, cek versi stabil terbaru dan baca dokumentasinya. Pasang versi yang sudah beredar cukup lama, bukan rilis hari ini.
Laporan akhir (Fase 7) berisi: daftar fitur yang selesai, daftar yang sengaja ditunda beserta alasannya, daftar keputusan di KEPUTUSAN.md, dan cara menjalankan seed data demo.
2. Konteks proyek
Aplikasi: web LMS kampus untuk Universitas Islam Riau, nama produk SIAJAR.
Stack yang sudah berjalan: Next.js (App Router, Server Actions), Supabase (Postgres, Row-Level Security, Realtime, Storage, PgBouncer), login Google OAuth, hosting Vercel.
Navigasi dikendalikan satu berkas: src/lib/config/menu-config.ts. Semua perubahan menu lewat berkas ini.
Tujuh peran: STUDENT, TEACHING_ASSISTANT, LECTURER, PROGRAM_COORDINATOR, ACADEMIC_STAFF, SYSTEM_ADMIN, SUPER_ADMIN.
Tabel yang menurut dokumen lama sudah ada (cari nama pastinya): class_assistants, grade_change_requests, audit_logs, user_devices, programs, semesters, rooms, serta tabel kelas, peserta kelas, pertemuan 1–16, materi, tugas, pengumpulan, presensi, ujian, soal, percobaan ujian, dan nilai.
Zona waktu tampilan: Asia/Jakarta (WIB). Simpan semua waktu sebagai timestamptz (UTC) dan ubah ke WIB hanya saat ditampilkan.
Skala pemakaian yang direncanakan: ratusan mahasiswa serentak saat ujian. Semua query di jalur ujian, presensi, dan polling harus punya indeks yang tepat dan tidak boleh N+1.
3. Aturan teknis lintas fitur
RLS wajib untuk setiap tabel baru. Aktifkan enable row level security di migrasi yang sama dengan pembuatan tabel. Tidak boleh ada tabel tanpa kebijakan. Pakai helper yang sudah ada (misalnya "dosen pengampu kelas ini", "asisten kelas ini", "anggota kelas ini"). Kalau belum ada, buat sebagai fungsi security definer dengan set search_path = '', lalu pakai di semua kebijakan baru.
Operasi lintas tabel yang harus atomik ditulis sebagai fungsi Postgres (RPC) dan dipanggil dari server action. Jangan merangkai beberapa insert dari sisi aplikasi.
Validasi semua input di server action dengan Zod. Skema Zod dipakai juga di form (satu sumber). Pesan galat validasi berbahasa Indonesia natural.
Format hasil server action seragam: { ok: true, data } atau { ok: false, pesan, kolom? }. Pesan galat ditulis untuk pengguna, bukan pesan teknis.
Audit log untuk setiap aksi sensitif (ubah nilai, finalisasi, setujui atau tolak, impersonasi, ubah kebijakan, hapus massal, lihat berkas bukti izin/sakit). Pakai tabel audit_logs yang ada. Isi: aktor, peran, aksi, entitas, id entitas, IP, user-agent, nilai sebelum dan sesudah.
Storage: bucket privat, akses lewat signed URL berumur pendek (60 detik). Batasi tipe MIME dan ukuran di sisi server, bukan hanya di klien. Nama berkas disimpan sebagai UUID, nama asli disimpan di kolom terpisah.
Rate limit untuk aksi yang bisa disalahgunakan: kirim pesan, masuk token ujian, jalankan kode, kirim sanggahan, kirim vote polling.
Pagination untuk semua daftar yang bisa lebih dari 50 baris. Pakai keyset (cursor) untuk daftar besar seperti pesan dan log.
Cron: pekerjaan terjadwal ditulis sebagai route handler yang dilindungi CRON_SECRET, dipicu Vercel Cron atau pg_cron. Setiap pekerjaan harus aman dijalankan dua kali (idempoten).
Hindari cache statis pada halaman yang bergantung waktu atau peran (tenggat, ujian, rilis terjadwal). Pakai dynamic = 'force-dynamic' atau no-store sesuai pola repo.
Tipe TypeScript database digenerate ulang setelah tiap migrasi. Dilarang memakai any.
Aksesibilitas: semua kontrol bisa dioperasikan dengan keyboard, label form terhubung ke input, kontras warna cukup, status tidak hanya dibedakan lewat warna.
Responsif: semua halaman baru harus nyaman di lebar 360 px. Tabel lebar menggulir di dalam wadahnya sendiri.
Keadaan kosong, memuat, dan galat harus ada di setiap halaman baru.
Pengujian: fungsi murni (hitung denda, hitung CPL, analisis soal, kemiripan, parser Moodle XML) wajib punya unit test. Kebijakan RLS tabel baru diuji dengan pgTAP (supabase test db) atau skrip SQL setara. Alur kritis (autosave ujian, sanggah nilai, izin sakit) diuji end-to-end dengan Playwright per peran.
4. Aturan tulisan antarmuka (supaya tidak terasa buatan AI)
Semua teks yang tampil ke pengguna mengikuti aturan ini: judul menu, judul halaman, tombol, label, keadaan kosong, pesan galat, notifikasi, dan teks bantuan.
Prinsip
Pendek, langsung, seperti ditulis staf kampus yang rapi. Tidak promosi, tidak antusias berlebihan.
Pakai istilah Indonesia yang sudah lazim: tugas, nilai, tenggat, kelas, berkas, kumpulkan. Hindari serapan Inggris yang tidak perlu (submit, deadline, grade, feedback) di teks antarmuka.
Tanpa emoji. Tanpa tanda seru berlebihan (maksimal sangat jarang). Tanpa kalimat pembuka basa-basi seperti "Wah", "Yuk", "Selamat datang di dunia…".
Kalau perlu menyapa pengguna, mahasiswa disapa "kamu", dosen, staf, dan admin "Anda". Kalimat tanpa subjek lebih disukai.
Tombol berupa kata kerja konkret: "Kumpulkan", "Simpan", "Ajukan Sanggahan", "Setujui", "Tolak", "Batalkan".
Pesan galat menyebut penyebab dan langkah berikutnya, tidak menyalahkan pengguna.
Keadaan kosong cukup satu kalimat fakta, ditambah satu tindakan bila ada.
Contoh yang benar dan yang dihindari
Benar: "Belum ada tugas di kelas ini." Hindari: "Wah, sepertinya belum ada apa-apa di sini!"
Benar: "Berkas terlalu besar. Maksimal 10 MB." Hindari: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi nanti."
Benar: "Tugas Basis Data Bab 3 ditutup besok pukul 23.59." Hindari: "Jangan lewatkan tenggat tugasmu! ⏰"
Benar: "Jawaban tersimpan pukul 14.03." Hindari: "Auto-save berhasil dilakukan secara real-time."
Benar: "Kehadiranmu di Algoritma 78%. Satu kali absen lagi, kamu turun di bawah 75%." Hindari: "Waspada! Kehadiranmu berada di zona kritis!"
Kata dan pola yang dilarang dipakai di nama menu, judul, dan teks
Kata: Dashboard, Insight, Hub, Smart, Pusat (sebagai awalan), Portal, Seamless, Powerful, Eksplorasi, Optimalkan, Tingkatkan, Revolusi, Ekosistem.
Pola: tiga kata sejajar berirama ("Cepat, Mudah, Aman"), tanda & di nama menu (tulis "dan" bila perlu), garis miring pada nama menu, awalan "Kelola …" di setiap menu, judul huruf kapital semua.
Gaya penulisan menu: Title Case pendek, satu sampai tiga kata. Judul grup menu satu atau dua kata, bukan huruf kapital semua.
5. Aturan tampilan
Pakai token desain (warna, radius, spasi, tipografi) yang sudah ada. Jangan mendesain ulang halaman lama.
Jangan memakai gradien ungu-biru, bayangan berlapis, kartu kaca (glassmorphism), atau ilustrasi generik. Tampilan harus tenang dan padat informasi, seperti aplikasi kerja.
Satu warna aksen untuk tindakan utama. Warna status (sukses, peringatan, bahaya) hanya untuk status.
Animasi seperlunya: transisi 150–200 ms untuk hover, buka tutup panel, dan perubahan status. Hormati prefers-reduced-motion. Tidak ada animasi dekoratif yang berulang.
Ikon dari lucide-react yang sudah dipakai. Sebelum memakai ikon baru, pastikan namanya ada di versi yang terpasang.
Tabel data: kepala tabel melekat saat menggulir, baris bisa dipindai, aksi baris di sisi kanan, pencarian dan filter di atas.

6. Peta menu final (menu-config.ts)
Hanya label dan pengelompokan yang berganti pada menu lama. Rute lama tidak diubah supaya tautan, bookmark, dan kebijakan akses tidak rusak. Menu baru memakai rute baru seperti tertulis. Judul halaman (<h1>), judul tab browser (<title>), breadcrumb, teks notifikasi, dan halaman bantuan harus ikut memakai nama baru.
Format tiap baris: Label — rute — ikon — badge — catatan.
Total setelah perubahan: 102 butir menu (sub-hub Super Admin dihitung 6 butir, menu bersama dihitung sekali). Pakai angka ini sebagai pemeriksaan akhir.
6.1 Mahasiswa (STUDENT)
Tanpa judul grup:
Beranda — /student — GraduationCap
Kalender — /calendar — CalendarDays
Notifikasi — /notifications — Bell — unreadCount
Pengumuman — /announcements — Megaphone
Grup Belajar:
Kelas Saya — /classes — Layers — tab di dalam kelas: Materi, Tugas, Kelompok, Forum, Pertemuan, Nilai
Presensi — /attendance — CalendarCheck2 — tab: Riwayat, Izin dan Sakit
Ujian — /exams — FileCheck2 — daftar ujian berlangsung, akan datang, dan selesai
Perpustakaan — /library — Library
Tanya AI — /ai-assistant — Sparkles
Pesan — /messages — MessageCircle — unreadMessages — tab: Percakapan, Konsultasi
Grup Nilai:
Nilai Saya — /grades — CheckSquare — memuat grafik CPL dan tombol sanggahan
Pencapaian — /achievements — Trophy
Sertifikat — /certificates — Award
Grup Lainnya:
Komunitas — /community — MessageSquare
Evaluasi Dosen — /evaluations — ClipboardCheck — pendingEvaluations
Pengajuan — /requests — FilePlus2
6.2 Asisten Dosen (TEACHING_ASSISTANT)
Menu Asisten = menu Mahasiswa (6.1) ditambah satu grup di antara "Utama" dan "Belajar". Susun lewat komposisi di menu-config.ts, jangan salin ulang daftar. Beranda Asisten memakai rute /ta.
Grup Asistensi (bisa dilipat):
Kelas Asistensi — /ta/classes — Layers
Koreksi — /ta/grading — ClipboardList — taGradingCount
Pantau Ujian — /ta/exam-monitor — ShieldAlert
6.3 Dosen Pengampu (LECTURER)
Tanpa judul grup:
Beranda — /lecturer — LayoutDashboard
Kalender — /calendar — CalendarDays
Notifikasi — /notifications — Bell — unreadCount
Pengumuman — /announcements — Megaphone
Grup Mengajar:
Kelas Saya — /classes — Layers
Presensi — /attendance — CalendarCheck2 — tab: Sesi, Permohonan Izin
Berita Acara — /lecturer/journals — NotebookPen
Perpustakaan — /library — Library
Grup Ujian dan Nilai:
Ujian dan Kuis — /exams — PlusCircle
Bank Soal — /exams/question-bank — FolderArchive
Periksa Jawaban — /exams/review — CheckSquare — lecturerReviewCount
Analisis Soal — /exams/analysis — BarChart3
Rubrik — /lecturer/rubrics — ListChecks
Buku Nilai — /analytics — Table2
Sanggahan — /lecturer/disputes — MessageSquareWarning — disputeCount
Grup Lainnya:
Pesan — /messages — MessageCircle — unreadMessages
Mahasiswa Bimbingan — /lecturer/mentoring — Users
Hasil Evaluasi — /lecturer/evaluations — ClipboardCheck
Komunitas — /community — MessageSquare
6.4 Koordinator Program Studi (PROGRAM_COORDINATOR)
Tanpa judul grup:
Beranda — /coordinator — Compass
Kalender — /calendar — CalendarDays
Notifikasi — /notifications — Bell — unreadCount
Pengumuman — /announcements — Megaphone — baru ditambahkan
Grup Prodi:
Kurikulum — /coordinator/curriculum — BookOpen — memuat CPL, CPMK, pemetaan, prasyarat
Mata Kuliah — /coordinator/courses — Layers
Penugasan Dosen — /coordinator/assignments — Users
Evaluasi Dosen — /coordinator/evaluations — ClipboardCheck
Grup Pantauan:
Perkuliahan — /coordinator/monitoring — Activity
Mahasiswa Berisiko — /coordinator/monitoring/at-risk — AlertCircle
Grup Persetujuan:
Persetujuan Nilai — /coordinator/approvals — CheckCircle2 — coordinatorApprovalsCount
Laporan — /coordinator/reports — FileSpreadsheet
6.5 Staf Akademik (ACADEMIC_STAFF)
Tanpa judul grup:
Beranda — /staff — LayoutDashboard
Kalender — /calendar — CalendarDays
Notifikasi — /notifications — Bell — unreadCount
Grup Data Induk:
Mahasiswa — /staff/master/students — Users
Dosen — /staff/master/lecturers — UserCheck
Data Akademik — /staff/master — Database
Grup Akademik:
Jadwal — /staff/schedules — CalendarClock
Kelas dan Peserta — /staff/classes — Layers
Nilai dan Presensi — /staff/grades — CheckSquare
Grup Layanan:
Pengajuan Masuk — /staff/services/verification — FileText — requestCount
Pengumuman dan Acara — /staff/announcements — Megaphone
Berkas dan Sertifikat — /staff/content — BookOpen
Moderasi — /staff/moderation — MessageSquare
6.6 System Administrator (SYSTEM_ADMIN)
Tanpa judul grup:
Beranda — /admin/system — Server
Notifikasi — /notifications — Bell — unreadCount
Grup Server:
Pemantauan — /admin/system/monitoring — Activity
Integrasi — /admin/system/integrations — Globe
Grup Keamanan:
Sesi Login — /admin/system/security — Lock
Cadangan Data — /admin/system/backup — FolderArchive
Grup Pengaturan:
Pengaturan Sistem — /admin/system/settings — Sliders
Log Audit — /admin/system/audit — ScrollText
6.7 Super Administrator (SUPER_ADMIN)
Tanpa judul grup:
Beranda — /admin — LayoutDashboard
Notifikasi — /notifications — Bell — unreadCount
Grup Pengguna:
Akun Pengguna — /admin/users — Users
Peran dan Akses — /admin/roles — ShieldAlert
Grup Aturan Kampus:
Aturan Akademik — /admin/policies — Scale
Pengumuman Kampus — /admin/announcements — Megaphone
Grup Sistem: enam butir yang sama dengan 6.6 (Pemantauan, Integrasi, Sesi Login, Cadangan Data, Pengaturan Sistem, Log Audit), rute /admin/system/*.
6.8 Menu bersama semua peran
Grup Akun (paling bawah sidebar):
Pengaturan — /settings — Settings — tampilan (terang, gelap, ikuti sistem), kerapatan, dan preferensi notifikasi per jenis
Bantuan — /help — LifeBuoy
Privasi — /transparency — Eye — ringkasan data tersimpan, sesi dan perangkat (/devices), tombol "Ini bukan saya", riwayat persetujuan privasi
6.9 Peta label lama ke label baru
Gunakan daftar ini untuk mencari dan mengganti semua kemunculan (kode, snapshot test, e2e, seed, dokumentasi, teks notifikasi, halaman bantuan).
Dashboard Pengajar, Dashboard Prodi, Dashboard, Dashboard Sistem, Dashboard Universitas → Beranda
Ujian Aktif → Ujian
Pustaka Digital → Perpustakaan
Tanya AI SIAJAR → Tanya AI
Nilai & Progres → Nilai Saya
Sertifikat & Portofolio → Sertifikat
Kelas Diampu → Kelas Saya (untuk Dosen; rute tetap /classes)
Kelas Diasistensi → Kelas Asistensi
Antrean Koreksi → Koreksi
Ujian & Kuis → Ujian dan Kuis
Review Essay & Coding → Periksa Jawaban
Analitik & Nilai → Buku Nilai
Kurikulum & CPL → Kurikulum
Penugasan & Kelas → Penugasan Dosen
Monitoring (Kaprodi) → Perkuliahan
Persetujuan (Kaprodi) → Persetujuan Nilai
Laporan & Evaluasi → Laporan
Kelas & Peserta → Kelas dan Peserta
Nilai & Presensi → Nilai dan Presensi
Verifikasi Berkas → Pengajuan Masuk
Pengumuman & Event → Pengumuman dan Acara
Pustaka & Sertifikat → Berkas dan Sertifikat
Moderasi Komunitas → Moderasi
Monitoring Sistem → Pemantauan
Keamanan (item) → Sesi Login
Backup & Restore → Cadangan Data
Pengaturan Platform → Pengaturan Sistem
Kelola Pengguna → Akun Pengguna
Role & Permission → Peran dan Akses
Kebijakan → Aturan Akademik
Pengumuman Global → Pengumuman Kampus
Pengaturan Tampilan → Pengaturan
Pusat Bantuan → Bantuan
Transparansi Data → Privasi
Judul grup lama → baru: PEMBELAJARAN → Belajar; EVALUASI & PRESTASI → Nilai; MODE ASISTEN → Asistensi; PENGAJARAN & PEMBELAJARAN → Mengajar; UJIAN & PENILAIAN → Ujian dan Nilai; LAINNYA → Lainnya; MANAJEMEN PRODI → Prodi; MONITORING → Pantauan; PERSETUJUAN & LAPORAN → Persetujuan; DATA MASTER → Data Induk; KELAS & AKADEMIK → Akademik; KONTEN & LAYANAN → Layanan; MONITORING & INTEGRASI → Server; KEAMANAN & CADANGAN → Keamanan; PENGATURAN & AUDIT → Pengaturan; PENGGUNA & AKSES → Pengguna; KEBIJAKAN & GLOBAL → Aturan Kampus; SISTEM → Sistem; PENGATURAN & BANTUAN → Akun. Grup "UTAMA" tidak lagi diberi judul.
Chip filter di Beranda Mahasiswa: "Tugas & Kuis" menjadi "Tugas dan Kuis". Chip lain tetap.

7. Fase 0 — Audit, penamaan ulang menu, dan penyelarasan celah
7.1 Langkah
Audit kode dan tulis docs/AUDIT_AWAL.md (lihat bagian 1, poin 1).
Terapkan peta menu bagian 6 ke menu-config.ts. Tambahkan menu baru dengan halaman sementara yang sah (judul, keadaan kosong, dan pembatasan akses sudah benar) supaya navigasi tidak menghasilkan 404 sebelum fiturnya selesai di fase berikutnya.
Ganti semua label lama sesuai bagian 6.9 di seluruh repo. Jalankan pencarian untuk setiap label lama dan pastikan tidak tersisa, termasuk di teks notifikasi, seed, test, dan dokumentasi.
Terapkan penyelarasan celah di 7.2.
Tambahkan test snapshot menu per peran yang memastikan jumlah butir sesuai (total 102) dan tidak ada kata terlarang dari bagian 4.
7.2 Penyelarasan celah dari spesifikasi lama
Keputusan di bawah sudah diambil. Kerjakan sebagai bagian Fase 0, kecuali dinyatakan lain.
Satu halaman per rute bersama. Rute /classes, /attendance, /exams, /library, /community, /messages, /calendar, /notifications, /announcements dipakai banyak peran. Implementasikan sebagai satu page.tsx per rute yang memilih tampilan berdasarkan peran aktif di server (misalnya getRoleView()), bukan beberapa route group dengan URL yang sama (itu membuat build Next.js gagal). Tambahkan test yang memastikan build tidak memiliki dua halaman yang resolve ke path yang sama.
Peran ganda. Kalau satu akun punya lebih dari satu peran (misalnya Dosen dan Koordinator), tampilkan pengganti peran di header. Sidebar menampilkan menu peran yang sedang aktif. Peran aktif disimpan di cookie yang ditandatangani dan diverifikasi ulang terhadap tabel peran pada setiap permintaan.
Pengumuman untuk Koordinator. Sudah ditambahkan di 6.4.
Asisten membuka presensi. Tambahkan kolom can_open_attendance boolean not null default false pada class_assistants. Dosen mengaturnya per asisten per kelas lewat tab Asisten di pengaturan kelas. Kalau true, Asisten melihat tombol buka sesi presensi di kelas itu. Aksinya masuk audit log dengan aktor Asisten.
Entri matriks tanpa fitur. Hapus dari matriks otorisasi: "Usulan" jadwal untuk Dosen dan Kaprodi, "Masukan" kurikulum untuk Dosen, "Dukungan Teknis" kurikulum untuk Staf. Ganti dengan "Tidak ada akses". (Matriks baru ada di bagian 14.1.)
Pengajuan mahasiswa. Buat halaman /requests (menu Pengajuan) sebagai sisi pengaju dari alur yang sudah dilayani Staf di Pengajuan Masuk:
Jenis pengajuan: surat keterangan aktif kuliah, dispensasi, cuti akademik, legalisasi transkrip.
Tabel student_requests(id, student_id, type, details jsonb, attachment_path, status check in ('diajukan','diproses','perlu_perbaikan','selesai','ditolak'), staff_note, result_path, created_at, updated_at) dengan RLS: mahasiswa membaca dan membuat miliknya sendiri; Staf membaca semua dan memperbarui status; tidak ada yang bisa menghapus.
Mahasiswa melihat status, catatan Staf, dan mengunduh hasil (surat ber-QR yang sudah ada). Staf memproses dari Pengajuan Masuk dengan badge requestCount.
Jika tabel serupa sudah ada dari audit, pakai itu dan hanya tambahkan sisi mahasiswa.
KRS: periksa apakah sudah ada tabel dan alur KRS. Jika ada, tambahkan sisi mahasiswa pada tab kedua di /requests bernama "KRS". Jika belum ada, jangan membuat alur KRS baru. Catat di KEPUTUSAN.md bahwa persetujuan KRS oleh Dosen Wali belum punya sisi pengaju.
Log audit untuk System Admin disamarkan. Buat view audit_logs_for_sysadmin yang mengganti kolom nilai sebelum dan sesudah menjadi '[disembunyikan]' untuk entitas akademik (nilai, pengumpulan, jawaban ujian, permintaan revisi nilai, permohonan izin dan sakit, pesan, sanggahan). Halaman Log Audit untuk System Admin membaca view ini. Super Admin membaca tabel penuh.
Impersonasi hanya lihat. Saat Super Admin masuk sebagai pengguna lain: alasan wajib (minimal 20 karakter), durasi maksimal 30 menit lalu berakhir otomatis, semua server action yang menulis data ditolak dengan pesan "Mode lihat sebagai pengguna lain tidak bisa mengubah data.", pita merah tetap di atas layar bertuliskan nama pengguna dan tombol "Keluar dari mode ini", awal dan akhir sesi serta alasan masuk audit log, dan tidak boleh meniru sesama Super Admin. Perlindungan HMAC fail-closed yang sudah ada tetap dipakai.
Login lebih dari satu domain. Ganti ALLOWED_EMAIL_DOMAIN tunggal dengan dua hal yang bisa diatur dari Pengaturan Sistem:
tabel allowed_email_domains(domain, allowed_roles text[], is_active); domain email mahasiswa hanya boleh STUDENT;
tabel email_allowlist(email, role, added_by, created_at) untuk dosen, staf, dan admin yang emailnya berada di domain lain.
Setelah callback Google OAuth: cek domain atau allowlist; kalau tidak lolos, keluarkan sesi dan tampilkan "Email ini belum terdaftar di SIAJAR. Hubungi BAAK atau admin kampus." Pengguna non-mahasiswa tidak boleh menentukan perannya sendiri; perannya selalu dari allowlist atau data induk. Perilaku login mahasiswa yang sekarang jangan dirusak; sesuaikan dengan alur yang ada.
Ambang kehadiran dari kebijakan. Semua angka 75% di kode dan teks diganti pembacaan dari kebijakan min_attendance_percent. Tidak ada angka tetap yang tersebar.

8. Fase 1 — Fondasi bersama
Kerjakan semuanya dulu karena dipakai banyak fitur.
8.1 Kebijakan akademik terkonfigurasi
Tabel institution_policies(key text primary key, value jsonb not null, description text, updated_by uuid, updated_at timestamptz). Hanya Super Admin yang bisa mengubah; semua peran login bisa membaca kunci yang tidak sensitif lewat fungsi get_policy(key).
Seed kunci dan nilai awal (lihat Lampiran A). Halaman Aturan Akademik menampilkannya dalam kelompok dengan penjelasan satu kalimat dan nilai bawaan. Setiap perubahan masuk audit log dengan nilai sebelum dan sesudah.
Di kode, baca lewat satu helper (getPolicy<T>(key)) dengan cache pendek (maksimal 60 detik) dan nilai bawaan aman.
8.2 Rilis terjadwal dan arsip
Tambahkan release_at timestamptz null pada materi, tugas, dan kuis (ujian sudah punya jadwal buka). Aturan RLS untuk mahasiswa: baris terlihat bila release_at is null or release_at <= now(). Dosen dan Asisten kelas selalu melihat, dengan label "Tampil untuk mahasiswa pada 12 Okt 08.00".
Tambahkan classes.status dengan nilai aktif, selesai, diarsipkan (bawaan aktif) bila belum ada. Detail arsip ada di bagian 13.1.
8.3 Notifikasi
Pakai tabel notifikasi yang sudah ada. Tambahkan jenis notifikasi baru (Lampiran B) sebagai enum atau konstanta terpusat, bukan string tersebar.
Tambahkan notification_preferences(user_id, kind, enabled) bila belum ada, dan tampilkan di Pengaturan. Notifikasi keamanan (login dari perangkat baru) tidak bisa dimatikan.
Pekerjaan terjadwal scheduled_notifications (tabel: id, user_id, kind, payload, send_at, sent_at, dedupe_key unique) dijalankan tiap 5 menit.
8.4 Pekerjaan terjadwal dan keamanan cron
Satu pola route handler /api/cron/<nama> dengan pemeriksaan header Authorization: Bearer ${CRON_SECRET}. Daftar pekerjaan ada di Lampiran C. Catat jadwal di vercel.json atau pg_cron, mana yang sudah dipakai repo.
8.5 Bucket storage baru
absence-proofs (privat), submission-feedback (privat), message-attachments (privat), question-assets (privat, gambar soal), import-staging (privat, otomatis dihapus setelah 24 jam). Tiap bucket punya kebijakan akses tertulis di migrasi.
Selesai bila: kebijakan terbaca dan bisa diubah dari antarmuka dengan audit; rilis terjadwal bekerja di RLS (diuji dengan akun mahasiswa); satu notifikasi contoh terkirim lewat scheduled_notifications; cron terlindungi (permintaan tanpa rahasia ditolak 401).

9. Fase 2 — Tugas dan nilai
9.1 Aturan keterlambatan dan perpanjangan tenggat
Tujuan. Penalti keterlambatan otomatis dan adil, perpanjangan tenggat untuk mahasiswa atau kelompok tertentu, dan opsi kirim ulang.
Hak akses.
Dosen pengampu: atur kebijakan per tugas, beri atau cabut perpanjangan, hapus penalti per pengumpulan dengan alasan.
Asisten: hanya melihat.
Mahasiswa: melihat tenggat efektifnya sendiri, mengirim dan mengirim ulang sesuai aturan.
Skema (sketsa).
alter table assignments
  add column late_policy text not null default 'none'
    check (late_policy in ('none','per_day','per_hour','flat')),
  add column late_penalty_value numeric(5,2) not null default 0,   -- persen
  add column late_penalty_cap numeric(5,2) not null default 100,   -- batas penalti total, persen
  add column close_at timestamptz,                                  -- null = tidak ada penutupan keras
  add column allow_resubmit boolean not null default true,
  add column max_resubmits int;                                      -- null = tanpa batas

create table assignment_extensions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid references profiles(id),
  group_id uuid,                                                     -- diisi bila tugas kelompok
  new_due_at timestamptz not null,
  new_close_at timestamptz,
  reason text not null check (char_length(reason) >= 5),
  granted_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  check ((student_id is not null)::int + (group_id is not null)::int = 1)
);

alter table submissions
  add column attempt_no int not null default 1,
  add column late_minutes int not null default 0,
  add column raw_score numeric(6,2),
  add column penalty_percent numeric(5,2) not null default 0,
  add column penalty_waived boolean not null default false,
  add column penalty_waived_reason text;

create table submission_versions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  attempt_no int not null,
  file_paths jsonb not null,
  submitted_at timestamptz not null default now()
);

Aturan bisnis.
Waktu selalu dari server. Jam perangkat mahasiswa tidak dipakai untuk menentukan terlambat.
Tenggat efektif = coalesce(perpanjangan.new_due_at, assignment.due_at). Penutupan efektif = coalesce(perpanjangan.new_close_at, assignment.close_at).
Setelah penutupan efektif, pengumpulan ditolak di server dengan pesan "Pengumpulan sudah ditutup pada 12 Okt 23.59."
Menit terlambat = selisih waktu pengumpulan terakhir terhadap tenggat efektif, dibulatkan ke atas. Satuan penalti: per_day = ceil(menit/1440), per_hour = ceil(menit/60), flat = satu kali. Penalti persen = min(late_penalty_cap, late_penalty_value * satuan).
Skor akhir = raw_score * (1 - penalty_percent/100), kecuali penalty_waived = true. Skor mentah dan penalti disimpan terpisah supaya dosen bisa menghapus penalti tanpa kehilangan skor mentah. Fungsi hitung berupa fungsi SQL murni calc_late_penalty(...) dan fungsi TypeScript yang setara; keduanya diuji dengan data yang sama.
Kirim ulang: setiap kirim ulang membuat baris submission_versions baru dan menaikkan attempt_no. Yang dinilai adalah versi terakhir. Waktu terlambat dihitung dari pengiriman terakhir. Kirim ulang ditolak bila allow_resubmit = false atau max_resubmits terlampaui.
Perpanjangan tidak bisa mengurangi tenggat; new_due_at harus lebih besar dari tenggat asli.
Antarmuka.
Form tugas (dosen): bagian "Keterlambatan" dengan pilihan kebijakan, besaran, batas, dan tanggal penutupan. Ringkasan satu kalimat di bawahnya, misalnya "Terlambat dikenai pengurangan 10% per hari, maksimal 50%. Pengumpulan ditutup 20 Okt 23.59."
Halaman tugas (dosen): tab "Perpanjangan" berisi daftar dan tombol "Beri Perpanjangan" (pilih mahasiswa atau kelompok, tanggal baru, alasan).
Halaman tugas (mahasiswa): hitung mundur, status (Belum dikumpulkan, Dikumpulkan tepat waktu, Dikumpulkan terlambat 2 jam, Ditutup), dan aturan keterlambatan terbaca jelas sebelum tenggat. Kalau mahasiswa punya perpanjangan, tampilkan "Tenggat kamu diperpanjang sampai …".
Layar koreksi: tampilkan skor mentah, penalti, dan skor akhir; tombol "Hapus Penalti" dengan alasan wajib.
Kasus tepi. Tenggat jatuh saat jam berubah (WIB tidak ada DST, tetap uji konversi). Pengumpulan tepat pada detik tenggat dianggap tepat waktu. Pengumpulan dua tab bersamaan: gunakan attempt_no dengan kunci unik (submission_id, attempt_no) dan percobaan ulang yang aman.
Selesai bila: semua jenis penalti terhitung benar pada unit test (minimal 12 kasus termasuk batas); perpanjangan individu dan kelompok bekerja; pengumpulan setelah penutupan ditolak di server (bukan hanya disembunyikan di klien); riwayat versi tampil bagi dosen.
9.2 Tugas kelompok
Tujuan. Tugas dikumpulkan per kelompok dengan satu pengumpulan, nilai kelompok, dan penyesuaian kontribusi per anggota.
Hak akses.
Dosen: buat set kelompok, atur anggota, kunci, nilai.
Asisten: lihat dan beri skor draf.
Mahasiswa: buat atau bergabung sesuai mode, kumpulkan atas nama kelompok.
Skema (sketsa).
create table group_sets (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  name text not null,
  formation text not null check (formation in ('lecturer','random','self')),
  min_size int not null default 2, max_size int not null default 5,
  lock_at timestamptz,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (class_id, name)
);
create table groups (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references group_sets(id) on delete cascade,
  name text not null,
  join_code text not null,                       -- 6 karakter, untuk mode 'self'
  unique (set_id, name), unique (set_id, join_code)
);
create table group_members (
  group_id uuid not null references groups(id) on delete cascade,
  set_id uuid not null references group_sets(id) on delete cascade,  -- didenormalisasi untuk keunikan
  student_id uuid not null references profiles(id),
  role text not null default 'member' check (role in ('leader','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, student_id),
  unique (set_id, student_id)                    -- satu mahasiswa, satu kelompok per set
);
alter table assignments
  add column submission_mode text not null default 'individual' check (submission_mode in ('individual','group')),
  add column group_set_id uuid references group_sets(id);
alter table submissions
  add column group_id uuid references groups(id),
  add column submitted_by uuid references profiles(id);
-- unik: satu pengumpulan per kelompok per tugas
create unique index on submissions (assignment_id, group_id) where group_id is not null;
create table submission_member_adjustments (
  submission_id uuid not null references submissions(id) on delete cascade,
  student_id uuid not null references profiles(id),
  contribution_percent numeric(5,2) not null default 100 check (contribution_percent between 0 and 100),
  note text,
  primary key (submission_id, student_id)
);

Aturan bisnis.
Mode lecturer: dosen menyusun kelompok manual (seret dan lepas) atau impor CSV (NIM, nama kelompok). Mode random: dosen menentukan ukuran, sistem membuat pratinjau acak (dengan seed yang disimpan), dosen menekan "Terapkan". Mode self: mahasiswa membuat kelompok (menjadi ketua) dan mengundang lewat kode 6 karakter atau NIM sampai lock_at.
Operasi gabung, keluar, dan pindah dilakukan lewat RPC dengan penguncian baris (select ... for update) supaya batas max_size tidak terlampaui saat banyak mahasiswa bergabung bersamaan.
Setelah lock_at, hanya dosen yang bisa mengubah anggota. Memindahkan anggota dari kelompok yang sudah mengumpulkan menampilkan peringatan dan masuk audit log.
Mahasiswa yang belum punya kelompok saat penguncian muncul di daftar "Belum berkelompok" milik dosen, dengan tombol "Tempatkan Secara Acak".
Pengumpulan: anggota mana pun boleh mengumpulkan. Halaman menampilkan siapa yang terakhir mengumpulkan dan kapan.
Penilaian: dosen memberi skor kelompok. Skor tiap anggota = skor kelompok × contribution_percent/100 (bawaan 100). Perubahan persen wajib disertai catatan bila di bawah 100.
Keterlambatan dan perpanjangan (9.1) berlaku per kelompok.
Anggota yang keluar dari kelas (mengundurkan diri) otomatis dilepas dari kelompok dan ditandai di daftar dosen.
Antarmuka.
Tab Kelompok di kelas (dosen): daftar set, pembuat set (nama, mode, ukuran, kunci), papan kelompok dengan seret dan lepas, indikator kelompok di bawah ukuran minimum.
Tab Kelompok di kelas (mahasiswa): kelompok saya, anggota, kode undangan, tombol keluar (sebelum kunci).
Layar koreksi: skor kelompok di atas, daftar anggota dengan kolom persen kontribusi dan skor akhir tiap anggota.
Kasus tepi. Dua mahasiswa menerima kode yang sama pada detik yang sama untuk slot terakhir; ketua keluar (ketua pindah ke anggota tertua); set dihapus saat sudah ada pengumpulan (ditolak).
Selesai bila: tiga mode pembentukan bekerja; uji balapan gabung kelompok tidak melampaui max_size; satu pengumpulan per kelompok ditegakkan oleh database; skor per anggota terhitung benar.
9.3 Rubrik dan umpan balik
Tujuan. Penilaian berbasis rubrik yang konsisten antara dosen dan asisten, dengan komentar pada berkas.
Hak akses.
Dosen: buat, ubah, dan pakai rubrik; finalisasi.
Asisten: mengisi rubrik sebagai draf sesuai aturan lama (tidak boleh finalisasi).
Mahasiswa: melihat rubrik sebelum mengumpulkan; melihat skor rubrik dan komentar setelah nilai dipublikasikan.
Skema (sketsa).
create table rubrics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  title text not null, description text,
  is_template boolean not null default false,
  created_at timestamptz not null default now()
);
create table rubric_criteria (
  id uuid primary key default gen_random_uuid(),
  rubric_id uuid not null references rubrics(id) on delete cascade,
  position int not null, title text not null, description text,
  max_points numeric(6,2) not null check (max_points > 0)
);
create table rubric_levels (
  id uuid primary key default gen_random_uuid(),
  criterion_id uuid not null references rubric_criteria(id) on delete cascade,
  position int not null, label text not null, description text,
  points numeric(6,2) not null
);
alter table assignments add column rubric_snapshot jsonb;      -- salinan rubrik saat dipasang
create table rubric_scores (
  submission_id uuid not null references submissions(id) on delete cascade,
  criterion_id uuid not null,                                   -- id kriteria pada snapshot
  level_label text, points numeric(6,2) not null, comment text,
  graded_by uuid not null references profiles(id),
  primary key (submission_id, criterion_id)
);
create table feedback_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  author_id uuid not null references profiles(id),
  file_path text,
  anchor jsonb,                                                  -- {type:'lines',from:3,to:7} atau {type:'page',page:2,x:0.4,y:0.3}
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

Aturan bisnis.
Rubrik dipasang ke tugas dengan menyalin isinya ke rubric_snapshot. Mengubah rubrik asli tidak mengubah tugas yang sudah memakainya. Setelah skor pertama masuk, snapshot tidak bisa diubah.
Skor total = jumlah poin kriteria, dinormalkan ke bobot tugas. Dosen boleh menimpa total dengan alasan wajib yang tercatat.
Skor dan komentar berstatus draf tidak terlihat mahasiswa sampai nilai dipublikasikan. Skor dari Asisten selalu draf.
Komentar pada berkas: untuk berkas teks dan kode, komentar menempel ke rentang baris; untuk PDF, komentar menempel ke halaman dan titik. Jenis berkas lain hanya mendapat komentar umum.
Antarmuka.
Rubrik (dosen): daftar rubrik milik sendiri dan templat; pembuat berbentuk grid (kriteria sebagai baris, tingkat capaian sebagai kolom) dengan tambah dan hapus baris atau kolom, pratinjau total poin, tombol "Gandakan".
Layar koreksi: dua panel. Kiri: penampil berkas (teks atau kode dengan nomor baris, atau PDF). Kanan: rubrik berupa kartu per kriteria dengan pilihan tingkat, kolom komentar, total berjalan, dan komentar umum. Tombol "Berikutnya" dan "Sebelumnya" untuk berpindah antarpengumpulan, simpan draf otomatis tiap beberapa detik, pintasan keyboard yang dijelaskan di bantuan kecil.
Mahasiswa: setelah publikasi, halaman tugas menampilkan rubrik terisi dan komentar yang tertaut ke berkasnya.
Selesai bila: rubrik bisa dibuat, digandakan, dan dipasang; asisten hanya bisa menyimpan draf (diuji RLS); mahasiswa tidak bisa membaca draf (diuji RLS); komentar baris dan halaman tampil benar.
9.4 Sanggah nilai oleh mahasiswa
Tujuan. Jalur resmi bagi mahasiswa untuk mempertanyakan nilai, dengan batas waktu dan jejak lengkap.
Hak akses.
Mahasiswa: mengajukan, menambah keterangan, menarik sanggahan miliknya.
Dosen pengampu: meninjau dan memutuskan.
Kaprodi: hanya melihat ringkasan jumlah per kelas (tanpa isi) di Laporan.
Staf dan admin: tidak ada akses ke isi.
Skema (sketsa).
create table grade_disputes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id),
  student_id uuid not null references profiles(id),
  target_type text not null check (target_type in ('submission','exam_attempt','exam_question','attendance')),
  target_id uuid not null,
  reason text not null check (char_length(reason) >= 30),
  evidence_path text,
  status text not null default 'diajukan'
    check (status in ('diajukan','ditinjau','diterima','ditolak','ditarik')),
  response text,
  old_score numeric(6,2), new_score numeric(6,2),
  resolved_by uuid references profiles(id), resolved_at timestamptz,
  linked_change_request_id uuid references grade_change_requests(id),
  created_at timestamptz not null default now()
);
create unique index on grade_disputes (student_id, target_type, target_id)
  where status in ('diajukan','ditinjau');
create table grade_dispute_messages (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references grade_disputes(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null, created_at timestamptz not null default now()
);

Aturan bisnis.
Batas pengajuan: dispute_window_days (bawaan 7) sejak nilai dipublikasikan. Setelah itu tombol nonaktif dengan keterangan "Batas pengajuan sanggahan sudah lewat."
Satu sanggahan aktif per butir nilai per mahasiswa.
Dosen memilih: Terima (isi skor baru), Tolak (alasan minimal 20 karakter), atau Minta Penjelasan (status ditinjau, membuka percakapan singkat dengan mahasiswa di dalam sanggahan itu).
Jika buku nilai belum final: skor baru langsung diterapkan dan diaudit.
Jika buku nilai sudah final: sistem membuat draf grade_change_requests yang sudah terisi dari sanggahan, dosen memeriksanya lalu mengajukannya ke Kaprodi lewat alur yang ada. Status sanggahan menjadi diterima dan menyimpan linked_change_request_id. Nilai baru berlaku setelah alur Kaprodi dan BAAK selesai.
Mahasiswa bisa menarik sanggahan selama masih diajukan.
Berkas bukti: privat, maksimal 5 MB, PDF atau gambar.
Batasi laju pengajuan (maksimal 5 per jam per mahasiswa).
Antarmuka.
Nilai Saya: tiap butir nilai yang sudah dipublikasikan punya tombol "Ajukan Sanggahan" dan, bila ada, chip status. Dialog: ringkasan butir, kolom alasan dengan penghitung karakter, unggah bukti opsional.
Sanggahan (dosen): antrean dengan filter status dan kelas, badge disputeCount; detail menampilkan butir nilai, jawaban atau pengumpulan, alasan mahasiswa, riwayat percakapan, dan tombol keputusan.
Notifikasi. Dosen: sanggahan baru. Mahasiswa: keputusan dan permintaan penjelasan.
Selesai bila: batas waktu ditegakkan di server; sanggahan pada nilai final menghasilkan draf permintaan revisi yang tertaut; mahasiswa lain tidak bisa membaca sanggahan orang lain (diuji RLS); semua keputusan terekam di audit log.

10. Fase 3 — Kehadiran dan perkuliahan
10.1 Izin dan sakit dari sisi mahasiswa
Tujuan. Mahasiswa mengajukan izin atau sakit lengkap dengan bukti, tiap dosen menyetujui untuk kelasnya sendiri, dan presensi terisi otomatis setelah disetujui.
Hak akses.
Mahasiswa: mengajukan, membatalkan yang masih menunggu, melihat riwayat miliknya.
Dosen pengampu: meninjau permohonan yang menyangkut kelasnya saja, melihat bukti kelasnya saja.
Asisten, Kaprodi, Staf, admin: tidak bisa melihat isi maupun bukti.
Skema (sketsa).
create table absence_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  type text not null check (type in ('izin','sakit')),
  start_date date not null, end_date date not null check (end_date >= start_date),
  reason text not null check (char_length(reason) >= 10),
  attachment_path text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create table absence_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references absence_requests(id) on delete cascade,
  class_id uuid not null references classes(id),
  session_id uuid not null references class_sessions(id),
  status text not null default 'menunggu' check (status in ('menunggu','disetujui','ditolak')),
  reviewed_by uuid references profiles(id), reviewed_at timestamptz, review_note text,
  unique (request_id, session_id)
);
alter table attendance_records
  add column source text not null default 'manual',          -- 'manual' | 'qr' | 'kode' | 'izin_sakit'
  add column absence_item_id uuid references absence_request_items(id);

Aturan bisnis.
Rentang tanggal maksimal 14 hari. Tanggal mulai tidak boleh lebih lama dari absence_request_max_backdate_days (bawaan 7) ke belakang.
Setelah mahasiswa memilih tanggal, sistem mencari semua pertemuan di kelas yang ia ikuti dalam rentang itu. Mahasiswa bisa mencabut centang pertemuan tertentu. Satu pertemuan hanya boleh punya satu butir aktif.
Bukti: PDF, JPG, atau PNG, maksimal 5 MB, disimpan di bucket absence-proofs dengan path {student_id}/{request_id}/{uuid}.{ext}. Bukti wajib untuk jenis sakit bila kebijakan sick_requires_attachment aktif (bawaan aktif).
Tulis petunjuk di bawah kolom alasan: "Cukup tulis alasan singkat. Tidak perlu menyebut diagnosis."
Persetujuan lewat RPC review_absence_item(item_id, decision, note): mengubah status butir, lalu membuat atau memperbarui attendance_records untuk pertemuan itu dengan status izin atau sakit dan source = 'izin_sakit'. Jika presensi pertemuan itu sudah hadir, permohonan butir itu ditolak otomatis dengan catatan sistem.
Penolakan wajib catatan. Dosen dapat membatalkan persetujuan sebelumnya (presensi dikembalikan ke alpa), dan itu tercatat di audit log.
Perhitungan persentase kehadiran mengikuti kebijakan attendance_excused_mode: exclude (bawaan; izin dan sakit disetujui dikeluarkan dari penyebut), present (dihitung hadir), atau absent (dihitung tidak hadir). Satu fungsi SQL attendance_percent(student_id, class_id) dipakai di semua tempat (Mahasiswa, Dosen, Kaprodi, EWS).
Setiap kali dosen membuka bukti, tulis audit log lihat_bukti_izin.
Pekerjaan purge_absence_proofs menghapus berkas bukti setelah absence_proof_retention_days (bawaan 180) sejak semester berakhir; baris tetap ada, attachment_path dikosongkan.
Antarmuka.
Mahasiswa, Presensi tab Izin dan Sakit: formulir (jenis, tanggal mulai dan selesai, daftar pertemuan terdeteksi dengan kotak centang, alasan, unggah bukti), lalu daftar riwayat dengan status per kelas.
Dosen, Presensi tab Permohonan Izin: antrean per kelas, filter status, setujui massal (dengan konfirmasi jumlah), tolak dengan catatan. Pratinjau bukti di panel samping dengan tautan bertanda waktu.
Notifikasi. Dosen: permohonan baru (digabung per mahasiswa, bukan per pertemuan). Mahasiswa: keputusan per kelas.
Selesai bila: permohonan lintas beberapa kelas membuat butir per kelas; dosen A tidak bisa membaca butir atau bukti milik kelas dosen B (uji RLS dan uji storage); presensi berubah setelah persetujuan dan kembali setelah dibatalkan; persentase kehadiran sama di semua halaman.
10.2 Berita acara perkuliahan
Tujuan. Dosen mencatat materi yang benar-benar disampaikan di setiap pertemuan. Kaprodi memantau kepatuhan dan bisa mengekspor rekapnya untuk akreditasi.
Hak akses. Dosen pengampu (termasuk dosen tim) menulis dan memfinalkan; Asisten hanya membaca; Kaprodi membaca dan mengekspor untuk prodinya; Staf membaca; Mahasiswa tidak ada akses.
Skema (sketsa).
create table class_session_journals (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  session_id uuid not null unique references class_sessions(id) on delete cascade,
  held_on date not null,
  mode text not null check (mode in ('luring','daring','hibrida')),
  topic text not null,
  summary text, method text, obstacles text,
  status text not null default 'draf' check (status in ('draf','final')),
  is_late boolean not null default false,
  finalized_by uuid references profiles(id), finalized_at timestamptz,
  revision_count int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table journal_materials (
  journal_id uuid references class_session_journals(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  primary key (journal_id, material_id)
);

(Tautan ke CPMK ditambahkan di 11.5 setelah tabel CPMK ada.)
Aturan bisnis.
Satu berita acara per pertemuan. Isian awal (topic) diambil dari judul pertemuan atau materi yang tertaut; ringkasan kehadiran (hadir, izin, sakit, alpa) dihitung saat ditampilkan, tidak disimpan.
Difinalkan hanya bila tanggal pertemuan sudah tiba. is_late = true bila difinalkan lebih dari journal_deadline_days (bawaan 3) setelah held_on.
Mengubah berita acara yang sudah final menaikkan revision_count dan menulis audit log dengan isi sebelum dan sesudah.
Pengingat: pekerjaan journal_reminders mengirim notifikasi ke dosen bila pertemuan kemarin belum punya berita acara final (H+1), dan sekali lagi pada H+3.
Antarmuka.
Berita Acara (dosen): pilih kelas, lalu garis waktu pertemuan 1–16 dengan chip status (Belum diisi, Draf, Final, Terlambat). Klik pertemuan membuka editor di panel samping dengan tombol "Isi dari Materi Pertemuan".
Perkuliahan (Kaprodi): tambahkan bagian kepatuhan berita acara per kelas dan per dosen (persentase final, jumlah terlambat). Tombol "Ekspor" menghasilkan .xlsx per kelas berisi pertemuan ke-, tanggal, moda, materi, metode, kendala, jumlah hadir, dan status; pakai exceljs, kolom diberi lebar dan header beku.
Selesai bila: dosen A tidak bisa menulis berita acara kelas dosen B; pengingat tidak terkirim dobel; ekspor terbuka rapi di Excel; revisi tercatat.
10.3 Tautan kuliah daring dan rekaman
Tujuan. Setiap pertemuan bisa memuat tautan kuliah daring dan tautan rekaman, hanya terlihat oleh anggota kelas.
Skema (sketsa).
alter table class_sessions
  add column delivery_mode text not null default 'luring' check (delivery_mode in ('luring','daring','hibrida')),
  add column meeting_url text,
  add column recording_url text,
  add column recording_visible_from timestamptz;

Aturan bisnis.
Validasi host di server terhadap daftar putih yang dapat diatur di Integrasi (bawaan: meet.google.com, zoom.us dan subdomainnya, teams.microsoft.com, teams.live.com, meet.jit.si; untuk rekaman tambah youtube.com, youtu.be, drive.google.com). Hanya https. Tautan di luar daftar ditolak dengan pesan "Alamat ini belum diizinkan. Minta admin menambahkannya di Integrasi."
Tautan hanya terbaca anggota kelas lewat RLS. Tombol Gabung aktif mulai meeting_join_window_minutes (bawaan 15) sebelum jam mulai sampai jam selesai. Rekaman tampil mulai recording_visible_from (bawaan: segera setelah diisi).
Tautan dibuka di tab baru dengan rel="noopener noreferrer".
Umpan iCal yang sudah ada ikut memuat tautan kuliah (bidang URL).
Dosen bisa memakai satu tautan untuk semua pertemuan lewat tombol "Pakai untuk Semua Pertemuan" dengan konfirmasi.
Antarmuka. Editor pertemuan: pilihan moda, kolom tautan kuliah, kolom rekaman. Halaman pertemuan (mahasiswa): kartu dengan tombol Gabung dan keterangan waktu aktifnya, lalu Tonton Rekaman bila tersedia. Kalender menampilkan ikon moda daring.
Selesai bila: tautan dengan host di luar daftar ditolak di server; mahasiswa non-anggota tidak bisa membaca tautan (uji RLS); tombol Gabung mengikuti jendela waktu.
10.4 Progres materi dan penguncian berurutan
Tujuan. Mahasiswa menandai materi selesai dan melihat kemajuannya; dosen bisa membuka materi secara berurutan dan melihat siapa yang belum membaca.
Skema (sketsa).
create table material_progress (
  material_id uuid not null references materials(id) on delete cascade,
  student_id uuid not null references profiles(id),
  status text not null default 'dibuka' check (status in ('dibuka','selesai')),
  first_opened_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (material_id, student_id)
);
alter table materials
  add column unlock_after_material_id uuid references materials(id),
  add column require_completion boolean not null default false;

Aturan bisnis.
Membuka materi membuat baris dibuka. Tombol "Tandai Selesai" mengubahnya menjadi selesai dan bisa dibatalkan.
Bila unlock_after_material_id terisi dan require_completion aktif, materi terkunci bagi mahasiswa sampai materi sebelumnya selesai. Penguncian ditegakkan di server (RLS atau RPC), bukan hanya disembunyikan. Pesan di kartu terkunci: "Selesaikan 'Pengantar Basis Data' dulu untuk membuka materi ini."
Rilis terjadwal (8.2) dan penguncian berurutan bisa dipakai bersamaan; keduanya harus terpenuhi.
Di halaman kelas mahasiswa tampil "6 dari 10 materi selesai" dengan bilah progres. Di sisi dosen, setiap materi menampilkan persentase penyelesaian dan daftar mahasiswa yang belum membuka, dengan tombol "Ingatkan" (satu notifikasi, dibatasi sekali per 24 jam per materi).
Selesai bila: materi terkunci tidak bisa diambil lewat URL langsung (uji dengan akun mahasiswa); daftar belum membuka akurat; ingatkan tidak bisa dipakai berulang dalam 24 jam.

11. Fase 4 — Ujian
11.1 Autosave dan pemulihan saat koneksi putus
Tujuan. Jawaban tidak boleh hilang walaupun koneksi putus, tab tertutup, atau peramban memuat ulang. Waktu ujian diatur server, bukan jam perangkat.
Skema (sketsa).
alter table exam_attempts
  add column expires_at timestamptz,                         -- batas waktu mengerjakan, dari server
  add column extra_time_seconds int not null default 0,
  add column last_heartbeat_at timestamptz,
  add column active_session_id uuid,
  add column auto_submitted boolean not null default false;
alter table exam_answers
  add column revision int not null default 0,
  add column updated_at timestamptz not null default now();
create unique index if not exists exam_answers_attempt_question_uq on exam_answers (attempt_id, question_id);
create table exam_events (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  kind text not null check (kind in ('offline','online','tab_hidden','tab_visible','fullscreen_exit','sesi_ganda','waktu_ditambah')),
  meta jsonb, client_time timestamptz, server_time timestamptz not null default now()
);
create index on exam_events (attempt_id, server_time);

Fungsi server (RPC).
claim_attempt_session(attempt_id) menghasilkan session_id baru dan menyimpannya di active_session_id. Sesi lama menjadi tidak aktif.
save_exam_answers(attempt_id, session_id, items jsonb); items berisi {question_id, answer, revision}. Upsert hanya bila revision lebih besar dari yang tersimpan. Tolak bila percobaan bukan berlangsung, session_id bukan sesi aktif (kode SESI_LAIN), atau waktu server melewati expires_at + extra_time_seconds + exam_grace_seconds (bawaan 20). Kembalikan revisi yang diterima per soal, server_now, dan expires_at.
exam_heartbeat(attempt_id, session_id) memperbarui last_heartbeat_at.
submit_exam(attempt_id, session_id, idempotency_key): menutup percobaan sekali saja; pemanggilan ulang dengan kunci yang sama mengembalikan hasil yang sama.
grant_exam_extra_time(attempt_id, seconds, reason) untuk dosen (bukan Asisten): menambah waktu satu peserta, mencatat exam_events jenis waktu_ditambah, dan menulis audit log.
Pekerjaan finalize_expired_attempts (tiap menit): menutup percobaan berlangsung yang sudah melewati batas, menandai auto_submitted = true, memakai jawaban yang tersimpan di server.
Klien. Buat hook useExamAutosave(attemptId):
State di memori adalah sumber utama; setiap perubahan jawaban menaikkan revision lokal untuk soal itu dan disalin ke IndexedDB (idb-keyval, kunci exam:{attemptId}).
Kirim perubahan dengan debounce 1,5 detik dalam satu permintaan (batch). Gagal: antre, coba lagi dengan jeda 1, 2, 4, 8 … maksimal 30 detik. Kembali online: kirim semua yang antre.
Penanda status di pojok layar ujian: "Tersimpan pukul 14.03" / "Menyimpan…" / "Tidak ada koneksi. Jawaban disimpan di perangkat ini dan dikirim otomatis saat tersambung." Teks itu tidak boleh dramatis.
Muat ulang atau buka kembali: ambil jawaban server, gabungkan dengan IndexedDB per soal dengan aturan "revisi lebih tinggi menang", lalu lanjutkan ke soal terakhir yang dibuka.
Pencatat waktu: setiap respons server memuat server_now; simpan offset = server_now - Date.now(). Sisa waktu = expires_at - (Date.now() + offset). Jam perangkat tidak pernah menentukan apakah waktu habis.
Waktu habis saat online: kirim submit_exam. Waktu habis saat offline: tampilkan "Waktu habis. Jawaban akan dikirim otomatis begitu tersambung." Pekerjaan server menutup percobaan walau klien tidak pernah online lagi.
Dua tab atau dua perangkat: tab yang terakhir memanggil claim_attempt_session menang. Tab lain menerima SESI_LAIN dan berubah menjadi hanya-baca dengan pesan "Ujian ini sedang dibuka di tempat lain. Tutup salah satunya." Kejadian sesi_ganda masuk exam_events.
Kirim exam_heartbeat tiap 15 detik dan catat offline, online, tab_hidden, tab_visible, fullscreen_exit ke exam_events (dengan batas laju supaya tidak membanjiri).
Peringatan beforeunload saat masih ada jawaban yang belum terkirim.
Pemantauan (Dosen dan Asisten). Di Pantau Ujian dan halaman ujian dosen: daftar peserta dengan status (Mengerjakan, Terputus bila heartbeat lebih dari 45 detik, Selesai, Selesai otomatis), jumlah soal terjawab, jumlah kejadian tab keluar, dan tombol "Tambah Waktu" (dosen saja). Perbarui dengan polling 10 detik lewat satu RPC agregat, bukan langganan Realtime per peserta.
Selesai bila (uji Playwright):
putus jaringan 2 menit saat mengerjakan, lalu tersambung lagi: tidak ada jawaban hilang;
tutup peramban saat mengerjakan, buka lagi: jawaban dan sisa waktu benar;
ubah jam perangkat maju atau mundur: sisa waktu tidak berubah;
dua tab: tab lama menjadi hanya-baca;
waktu habis saat offline: percobaan tertutup otomatis oleh server;
300 peserta simulasi menyimpan jawaban bersamaan tanpa galat (uji beban sederhana dengan skrip).
11.2 Token masuk, ujian susulan, dan remedial
Tujuan. Ujian bisa dikunci dengan token yang ditampilkan pengawas, dan dosen bisa membuat ujian susulan atau remedial untuk peserta tertentu.
Skema (sketsa).
alter table exams
  add column access_mode text not null default 'open' check (access_mode in ('open','token')),
  add column parent_exam_id uuid references exams(id),
  add column kind text not null default 'utama' check (kind in ('utama','susulan','remedial')),
  add column score_cap numeric(5,2),                                -- batas nilai remedial, null = tanpa batas
  add column combine_policy text not null default 'tertinggi'
    check (combine_policy in ('tertinggi','ganti','rata_rata'));
create table exam_access_tokens (
  exam_id uuid primary key references exams(id) on delete cascade,
  token text not null,                                              -- 6 karakter, tanpa huruf mirip (0/O, 1/I/L)
  rotated_at timestamptz not null default now(),
  rotate_every_minutes int                                           -- null = tidak diputar
);
create table exam_makeup_participants (
  exam_id uuid not null references exams(id) on delete cascade,     -- ujian susulan/remedial
  student_id uuid not null references profiles(id),
  reason text not null, approved_by uuid not null references profiles(id),
  primary key (exam_id, student_id)
);

Aturan bisnis.
Token: dibuat acak, 6 karakter dari alfabet tanpa karakter mirip. Hanya terbaca oleh Dosen dan Asisten yang ditugaskan (RLS). Masuk ruang ujian memanggil RPC enter_exam(exam_id, token) yang membandingkan token di server. Batas laju 5 percobaan per menit per pengguna; lewat itu ditolak sementara 2 menit. Kalau rotate_every_minutes terisi, pekerjaan terjadwal memutar token dan peserta yang sudah masuk tidak terpengaruh.
Susulan dan remedial membuat baris exams baru dengan parent_exam_id, menyalin pengaturan ujian induk (durasi, pengacakan, proctoring) dengan jadwal baru. Soal: pakai soal yang sama, atau ambil ulang dari bank soal dengan cetak biru yang sama. Hanya mahasiswa di exam_makeup_participants yang bisa masuk (ditegakkan di RPC dan RLS).
Nilai komponen ujian di buku nilai dihitung sesuai combine_policy, dengan score_cap diterapkan pada skor remedial. Ringkasan kebijakan tampil di halaman ujian: "Nilai remedial maksimal 70. Nilai akhir komponen ini memakai skor tertinggi."
Semua pembuatan susulan dan remedial, penambahan peserta, dan perubahan kebijakan gabung masuk audit log.
Antarmuka.
Layar Pengawas (Dosen dan Asisten): halaman penuh dengan token berukuran besar, hitung mundur putaran berikutnya, daftar peserta yang sudah masuk, dan tombol "Putar Token Sekarang".
Halaman ujian (dosen): tombol "Buat Susulan" dan "Buat Remedial" dengan pemilih peserta (cari NIM atau nama), alasan, jadwal, dan batas nilai.
Mahasiswa: kartu ujian susulan hanya muncul untuk yang terdaftar, dengan keterangan jelas bahwa ini susulan atau remedial.
Selesai bila: token salah ditolak dan dibatasi lajunya; mahasiswa yang tidak terdaftar tidak bisa masuk susulan lewat URL langsung; perhitungan gabung nilai benar untuk ketiga kebijakan (unit test).
11.3 Auto-grader soal koding
Tujuan. Soal koding dinilai otomatis dengan kasus uji. Kode mahasiswa tidak pernah dijalankan di server Next.js atau Vercel.
Arsitektur.
Buat antarmuka CodeRunner di src/lib/judge/ dengan satu adapter awal untuk Judge0 CE yang dijalankan sendiri di server terpisah (Docker). Konfigurasi lewat JUDGE_API_URL, JUDGE_API_KEY, JUDGE_WEBHOOK_SECRET. Adapter lain bisa ditambah nanti tanpa mengubah kode pemanggil.
Eksekusi memakai antrean di database (coding_submissions) dan hasil kembali lewat webhook yang diverifikasi dengan rahasia, atau polling dari pekerjaan terjadwal bila webhook tidak memungkinkan.
Kalau JUDGE_API_URL tidak diatur atau kebijakan coding_autograder_enabled mati: soal koding tetap bisa dibuat dan dinilai manual lewat Periksa Jawaban, dan antarmuka dosen menampilkan "Penilaian otomatis belum aktif. Soal koding akan diperiksa manual."
Skema (sketsa).
alter table questions
  add column code_language text,                               -- 'python','javascript','java','c','cpp','php'
  add column starter_code text,
  add column time_limit_ms int default 2000,
  add column memory_limit_mb int default 128,
  add column compare_mode text default 'trim' check (compare_mode in ('exact','trim','tokens','float'));
create table coding_test_cases (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  position int not null, stdin text not null default '', expected_stdout text not null,
  is_hidden boolean not null default false, weight int not null default 1 check (weight > 0)
);
create table coding_submissions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  question_id uuid not null references questions(id),
  language text not null, source_code text not null check (char_length(source_code) <= 65536),
  purpose text not null check (purpose in ('coba','final')),
  status text not null default 'antre' check (status in ('antre','berjalan','selesai','galat')),
  compile_output text, results jsonb,                          -- [{test_id, ok, time_ms, memory_kb, stdout_excerpt}]
  score numeric(6,2), judged_at timestamptz, created_at timestamptz not null default now()
);

Aturan bisnis.
"Coba Jalankan" menjalankan hanya kasus uji tidak tersembunyi. Pengiriman final (saat ujian dikumpulkan atau tombol "Kirim Jawaban Soal Ini") menjalankan semua kasus uji. Kasus tersembunyi hanya menampilkan lulus atau gagal.
Batas bawaan: waktu 2 detik, memori 128 MB, keluaran 64 KB, kode 64 KB. Tanpa akses jaringan di sandbox. Batas laju "Coba Jalankan": satu kali per 5 detik per mahasiswa.
Skor = jumlah bobot kasus uji lulus ÷ jumlah bobot × bobot soal. Dosen tetap bisa menimpa skor di Periksa Jawaban (dengan catatan).
Hasil galat sandbox (bukan kesalahan kode mahasiswa) ditandai galat dan tidak menghukum mahasiswa; dosen diberi tahu dan bisa menjalankan ulang.
Antarmuka.
Mahasiswa: editor kode CodeMirror 6 (ringan), pilihan bahasa bila lebih dari satu, tombol Coba Jalankan dan panel hasil per kasus uji. Penyimpanan otomatis ikut jalur autosave 11.1.
Dosen: editor kasus uji (tambah manual atau tempel banyak sekaligus dari CSV), tombol Uji dengan Kunci Jawaban yang menjalankan solusi dosen terhadap semua kasus uji untuk memastikan soal benar sebelum dipublikasikan.
Pemantauan (System Admin) di Integrasi: status konektor Judge (hijau bila sehat), panjang antrean, dan kegagalan terakhir.
Selesai bila: kode berulang tak berhenti, penggunaan memori besar, dan keluaran besar sama-sama berakhir aman; kasus tersembunyi tidak bocor ke klien (cek payload jaringan); fitur mati dengan anggun bila konektor tidak ada; unit test untuk keempat mode perbandingan.
11.4 Analisis butir soal
Tujuan. Setelah ujian selesai, dosen melihat kualitas tiap soal dan ujian secara keseluruhan.
Skema (sketsa).
create table exam_item_stats (
  exam_id uuid not null references exams(id) on delete cascade,
  question_id uuid not null references questions(id),
  n int not null,
  difficulty_p numeric(5,4),                -- proporsi benar, atau rata-rata skor/skor maks untuk esai dan koding
  discrimination_d numeric(5,4),            -- kelompok atas 27% dikurangi bawah 27%
  point_biserial numeric(5,4),
  option_counts jsonb,                      -- {"A":12,"B":40,...} plus kelompok atas/bawah
  avg_time_seconds numeric(8,2),
  omit_rate numeric(5,4),
  computed_at timestamptz not null default now(),
  primary key (exam_id, question_id)
);
create table exam_summary_stats (
  exam_id uuid primary key references exams(id) on delete cascade,
  n int, mean numeric, median numeric, stddev numeric, min numeric, max numeric,
  kr20 numeric, histogram jsonb, computed_at timestamptz not null default now()
);
alter table questions add column needs_revision boolean not null default false;

Rumus (tulis sebagai fungsi murni TypeScript dan uji dengan dataset kecil yang hasilnya dihitung tangan).
Tingkat kesukaran: p = jumlah benar / jumlah peserta. Kategori: p < 0,30 sukar; 0,30 ≤ p ≤ 0,70 sedang; p > 0,70 mudah.
Daya pembeda: urutkan peserta menurut skor total, ambil 27% teratas dan 27% terbawah, D = p_atas − p_bawah. Kategori: D ≥ 0,40 sangat baik; 0,30–0,39 baik; 0,20–0,29 cukup; < 0,20 perlu direvisi. Bila peserta kurang dari 20, tampilkan "Data belum cukup" dan pakai korelasi point-biserial sebagai pembanding.
Point-biserial: r_pb = (M1 − M0) / s × √(p × q).
Reliabilitas KR-20: (k / (k − 1)) × (1 − Σ p_i q_i / σ²); untuk soal esai dan koding pakai Cronbach alpha dengan skor ternormalisasi.
Pengecoh: tandai pilihan yang dipilih kurang dari 5% peserta, atau yang lebih banyak dipilih kelompok atas daripada kelompok bawah (indikasi kunci salah atau soal ambigu).
Soal esai dan koding: p = rata-rata skor ÷ skor maksimum; D dihitung dari selisih rata-rata kelompok atas dan bawah.
Antarmuka. Analisis Soal: pilih ujian, lalu ringkasan (rata-rata, median, sebaran, KR-20) dengan histogram (pakai library chart yang sudah ada), daftar soal yang bisa diurutkan dengan chip kategori kesukaran dan daya pembeda, laci detail per soal berisi sebaran pilihan jawaban dan teks soal. Tombol "Tandai Perlu Revisi" mengisi questions.needs_revision dan menambahkan lencana di Bank Soal. Bank Soal menampilkan riwayat rata-rata kesukaran lintas penggunaan.
Hitung sebagai pekerjaan asinkron untuk ujian di atas 500 peserta; tampilkan "Sedang dihitung" selama menunggu. Hasil dihitung ulang bila ada skor yang dikoreksi.
Hanya Dosen pengampu (dan Asisten kelas itu, hanya baca) yang bisa membuka.
Selesai bila: hasil cocok dengan dataset uji hitung tangan; ujian tanpa jawaban tidak membuat pembagian dengan nol; tanda perlu revisi muncul di Bank Soal.
11.5 Pemetaan CPMK ke CPL
Tujuan. Grafik CPL pada Nilai Saya dan laporan prodi berasal dari data nyata, bukan angka tetap.
Skema (sketsa). Periksa dulu tabel CPL yang sudah ada dari audit; pakai bila tersedia.
create table cpl (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id),
  code text not null, description text not null, unique (program_id, code)
);
create table cpmk (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id),
  code text not null, description text not null, unique (course_id, code)
);
create table cpmk_cpl_map (
  cpmk_id uuid references cpmk(id) on delete cascade,
  cpl_id uuid references cpl(id) on delete cascade,
  weight_percent numeric(5,2) not null default 100 check (weight_percent > 0 and weight_percent <= 100),
  primary key (cpmk_id, cpl_id)
);
create table assessment_cpmk_map (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  assessment_type text not null check (assessment_type in ('assignment','question')),
  assessment_id uuid not null,
  cpmk_id uuid not null references cpmk(id),
  weight_percent numeric(5,2) not null default 100 check (weight_percent > 0 and weight_percent <= 100),
  unique (assessment_type, assessment_id, cpmk_id)
);
create table achievement_snapshots (
  student_id uuid not null, class_id uuid not null, cpmk_id uuid not null,
  score_percent numeric(5,2), computed_at timestamptz not null default now(),
  primary key (student_id, class_id, cpmk_id)
);

Aturan bisnis.
Kaprodi mengelola CPL, CPMK, dan pemetaan CPMK→CPL di Kurikulum (tab CPL, CPMK, Pemetaan). Pemetaan ditampilkan sebagai grid yang bisa disunting.
Dosen menandai CPMK pada setiap tugas dan soal saat membuatnya (pilih satu atau beberapa CPMK mata kuliah itu dengan bobot; jumlah bobot per butir = 100%).
Skor CPMK mahasiswa di satu kelas = rata-rata tertimbang (skor/skor maksimum) × bobot dari semua butir terpetakan yang sudah dipublikasikan atau final. Skor CPL = rata-rata tertimbang skor CPMK menurut cpmk_cpl_map, lintas kelas dan semester. Batas ketercapaian CPMK dari kebijakan cpmk_pass_threshold (bawaan 60).
Dashboard kelas (dosen) memperingatkan "CPMK 3 belum punya penilaian" bila ada CPMK tanpa butir terpetakan.
Hitung ulang achievement_snapshots saat nilai dipublikasikan atau dikoreksi, secara terbatas pada kelas yang berubah.
Tautkan CPMK ke berita acara (10.2): tabel journal_cpmk(journal_id, cpmk_id) dan pemilih CPMK di editor berita acara.
Antarmuka.
Nilai Saya: grafik batang atau radar CPL (pakai chart yang sudah ada) dengan keterangan jelas "Dihitung dari penilaian yang sudah dipublikasikan."
Laporan (Kaprodi): ketercapaian CPL per angkatan dan per mata kuliah, dengan ekspor .xlsx.
Selesai bila: unit test perhitungan CPMK dan CPL dengan contoh tertulis (minimal tiga mahasiswa, dua CPMK, dua CPL); butir yang belum dipublikasikan tidak ikut terhitung; peringatan CPMK tanpa penilaian tampil.
11.6 Cek kemiripan tugas
Tujuan. Membantu dosen menemukan pengumpulan yang mirip. Alat ini menunjukkan kemiripan, bukan memvonis plagiarisme.
Skema (sketsa).
create table similarity_runs (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  started_by uuid not null references profiles(id),
  scope text not null default 'class' check (scope in ('class','course_history')),
  status text not null default 'antre' check (status in ('antre','berjalan','selesai','galat')),
  threshold numeric(4,2) not null default 0.60,
  created_at timestamptz not null default now(), finished_at timestamptz
);
create table submission_fingerprints (
  submission_id uuid not null references submissions(id) on delete cascade,
  kind text not null check (kind in ('teks','kode')),
  hashes bigint[] not null,
  primary key (submission_id, kind)
);
create table similarity_pairs (
  run_id uuid not null references similarity_runs(id) on delete cascade,
  submission_a uuid not null, submission_b uuid not null,
  score numeric(5,4) not null, matched_segments jsonb,
  review_status text not null default 'baru' check (review_status in ('baru','wajar','perlu_ditinjau')),
  review_note text,
  primary key (run_id, submission_a, submission_b)
);

Metode.
Teks (.docx, .pdf, .txt, .md): ekstrak teks (mammoth untuk docx, pustaka PDF yang sudah ada atau pdfjs-dist), normalkan (huruf kecil, buang tanda baca dan kata henti bahasa Indonesia), bentuk shingle 5 kata, hash, lalu hitung kemiripan Jaccard antar pasangan.
Kode (.py, .js, .ts, .java, .c, .cpp, .php, dan jawaban koding ujian): token-kan, ganti nama identifier dan literal dengan penanda generik, bentuk k-gram (k = 8), pilih sidik jari dengan winnowing (jendela 4), skor = irisan ÷ ukuran himpunan terkecil.
Kecualikan: anggota kelompok yang sama (tugas kelompok), serta kode dasar yang diunggah dosen sebagai "Kode Awal" (sidik jarinya dibuang dari semua pengumpulan).
Skala: kelas sampai 200 pengumpulan berarti ≤ 20 ribu pasangan, aman dikerjakan di pekerjaan latar. Jalankan lewat pekerjaan terjadwal, bukan dalam permintaan HTTP.
Antarmuka. Di halaman tugas dosen: tombol Cek Kemiripan (dan opsi otomatis setelah tenggat penutupan). Hasil: daftar pasangan terurut skor dengan penggeser ambang (bawaan 60%), tampilan berdampingan dengan segmen yang cocok disorot, tombol "Wajar" dan "Perlu Ditinjau", dan kolom catatan. Di atas hasil selalu ada teks: "Kemiripan tinggi belum tentu plagiarisme. Tinjau isinya sebelum mengambil keputusan." Tidak ada penalti otomatis. Mahasiswa tidak pernah melihat isi pengumpulan orang lain.
Hak akses. Dosen pengampu penuh; Asisten hanya baca bila diizinkan dosen lewat kolom can_view_similarity boolean not null default false pada class_assistants; setiap pembukaan hasil masuk audit log.
Selesai bila: unit test dengan sepasang teks yang disalin sebagian, sepasang kode yang hanya diganti nama variabel, dan sepasang yang berbeda (hasil sesuai harapan); kode dasar tidak memicu kemiripan palsu; lari 200 pengumpulan selesai dalam waktu wajar di latar belakang.

12. Fase 5 — Interaksi
12.1 Pesan dan konsultasi
Tujuan. Percakapan langsung antara dosen dan mahasiswa yang terkait, serta pemesanan jadwal konsultasi.
Skema (sketsa).
create table conversations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id),                 -- konteks kelas, boleh null untuk dosen wali
  created_at timestamptz not null default now(), last_message_at timestamptz
);
create table conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references profiles(id),
  last_read_at timestamptz, muted boolean not null default false,
  primary key (conversation_id, user_id)
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  attachment_path text, created_at timestamptz not null default now(),
  edited_at timestamptz, deleted_at timestamptz
);
create index on messages (conversation_id, created_at desc);
create table message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id), reporter_id uuid not null references profiles(id),
  reason text not null, snapshot jsonb not null,        -- salinan pesan dan 5 pesan sekitarnya saat dilaporkan
  status text not null default 'baru', created_at timestamptz not null default now()
);
create table consultation_slots (
  id uuid primary key default gen_random_uuid(),
  lecturer_id uuid not null references profiles(id),
  starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at),
  place_or_link text, capacity int not null default 1 check (capacity between 1 and 20),
  status text not null default 'terbuka' check (status in ('terbuka','ditutup','dibatalkan'))
);
create table consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references consultation_slots(id) on delete cascade,
  student_id uuid not null references profiles(id),
  topic text not null check (char_length(topic) >= 5),
  status text not null default 'dipesan' check (status in ('dipesan','selesai','dibatalkan','tidak_hadir')),
  lecturer_note text, created_at timestamptz not null default now(),
  unique (slot_id, student_id)
);

Aturan bisnis.
Percakapan dibuat lewat RPC start_conversation(target_user_id, class_id). Diizinkan hanya antara: Mahasiswa atau Asisten ↔ Dosen atau Asisten yang berbagi kelas aktif; Dosen ↔ mahasiswa bimbingannya. Tidak ada pesan Mahasiswa ↔ Mahasiswa (itu tempatnya Komunitas). Peran admin tidak membaca percakapan. Kaprodi dan Staf tidak punya akses.
Pesan baru tampil real-time lewat Supabase Realtime pada percakapan yang sedang terbuka; daftar percakapan dan badge unreadMessages diperbarui lewat polling ringan atau langganan terfilter pengguna. Paginasi keyset, 30 pesan per halaman.
Lampiran: PDF atau gambar, maksimal 5 MB, bucket message-attachments.
Batas laju: 30 pesan per menit per pengguna.
Dosen dapat mengatur "jam tenang" (misalnya 20.00–07.00). Di luar jam itu pengirim melihat catatan "Dosen biasanya membalas pada jam kerja." Pesan tetap terkirim, tidak diblokir.
Pelaporan: tombol "Laporkan" pada pesan menyimpan salinan konteks ke message_reports dan memunculkannya di Moderasi (Staf). Hanya salinan itu yang bisa dibaca Staf, bukan seluruh percakapan.
Pesan yang dihapus pengirim ditandai deleted_at dan tampil sebagai "Pesan dihapus".
Konsultasi: dosen membuat slot (tunggal atau berulang mingguan sampai tanggal tertentu). Mahasiswa dari kelas dosen itu atau bimbingannya memesan slot dengan topik singkat. Pembatalan oleh mahasiswa hanya sampai consultation_cancel_min_hours (bawaan 2) sebelum mulai. Pemesanan maksimal consultation_max_future_days (bawaan 30) ke depan. Pemesanan ganda dicegah oleh kunci unik dan RPC dengan penguncian baris untuk kapasitas.
Slot dan pemesanan muncul di Kalender. Pemesanan berstatus selesai ikut tampil di riwayat konsultasi pada Mahasiswa Bimbingan (fitur yang sudah ada).
Antarmuka.
Pesan: dua kolom (daftar percakapan, isi percakapan) di layar lebar; satu kolom bertingkat di ponsel. Tab Percakapan dan Konsultasi.
Konsultasi (mahasiswa): daftar dosen, kalender slot terbuka, tombol "Pesan Slot". Konsultasi (dosen): pembuat slot, daftar pemesanan, tombol "Tandai Selesai" dengan catatan.
Pesan baru dari halaman kelas atau daftar peserta lewat tombol "Kirim Pesan".
Selesai bila: mahasiswa tidak bisa memulai percakapan dengan mahasiswa lain atau dosen di luar kelasnya (uji RLS dan RPC); Staf hanya melihat salinan laporan; pemesanan serentak tidak melampaui kapasitas; batas laju bekerja.
12.2 Polling dan kuis cepat saat kuliah
Tujuan. Dosen melempar pertanyaan singkat saat kuliah dan melihat jawaban masuk secara langsung.
Skema (sketsa).
create table live_polls (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  session_id uuid references class_sessions(id),
  created_by uuid not null references profiles(id),
  question text not null,
  kind text not null check (kind in ('single','multiple','scale','text')),
  options jsonb,                                         -- [{id,label}]
  is_anonymous boolean not null default true,
  is_quiz boolean not null default false, correct_option_ids text[],
  status text not null default 'draf' check (status in ('draf','buka','tutup')),
  opened_at timestamptz, closed_at timestamptz
);
create table live_poll_votes (
  poll_id uuid not null references live_polls(id) on delete cascade,
  student_id uuid not null references profiles(id),
  answer jsonb not null, created_at timestamptz not null default now(),
  primary key (poll_id, student_id)
);

Aturan bisnis.
Dosen menekan "Buka" dan mahasiswa kelas itu yang sedang membuka SIAJAR menerima kartu pertanyaan lewat Realtime pada kanal class:{id}; kartu juga muncul bila mahasiswa membuka halaman kelas setelahnya selama polling masih buka.
Satu suara per mahasiswa. Mahasiswa boleh mengubah jawaban selama polling buka.
Jika is_anonymous = true: dosen tidak pernah menerima student_id. Hasil diambil lewat RPC agregat; kebijakan RLS pada live_poll_votes tidak mengizinkan dosen membaca baris mentah.
Hasil ke mahasiswa hanya setelah ditutup (bila is_quiz, jawaban benar ikut tampil). Hasil langsung ke dosen diperbarui tiap 2 detik lewat RPC agregat (bukan menyiarkan tiap suara).
Kuis cepat tidak memengaruhi nilai. Jawaban yang benar hanya memberi poin pencapaian (12.3).
Batas laju pengiriman suara; hanya mahasiswa yang terdaftar di kelas yang bisa memilih.
Antarmuka. Dosen: tombol "Polling Baru" di halaman kelas dan pertemuan, pembuat cepat, mode presentasi (layar penuh, bar hasil besar) yang bisa dibuka di jendela terpisah. Mahasiswa: kartu pertanyaan di bagian atas halaman kelas dengan tombol jawab, penanda "Jawaban terkirim", lalu hasil setelah ditutup. Riwayat polling per kelas dengan ekspor .csv agregat.
Selesai bila: 300 mahasiswa menjawab bersamaan tanpa galat; anonimitas terjaga (uji RLS); mahasiswa non-anggota tidak bisa memilih.
12.3 Pencapaian (gamifikasi ringan)
Tujuan. Penghargaan kecil untuk kebiasaan baik. Tidak memengaruhi nilai dan tidak menekan.
Skema (sketsa).
create table xp_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  class_id uuid references classes(id),
  kind text not null, points int not null,
  ref_type text not null, ref_id uuid not null,
  created_at timestamptz not null default now(),
  unique (student_id, kind, ref_type, ref_id)            -- idempoten
);
create table badges (code text primary key, name text not null, description text not null, icon text not null);
create table student_badges (
  student_id uuid references profiles(id), badge_code text references badges(code),
  class_id uuid, earned_at timestamptz not null default now(),
  primary key (student_id, badge_code, class_id)
);
create table study_streaks (
  student_id uuid primary key references profiles(id),
  current_days int not null default 0, best_days int not null default 0, last_active_on date
);
create table class_gamification_settings (
  class_id uuid primary key references classes(id) on delete cascade,
  enabled boolean not null default true, leaderboard_enabled boolean not null default false
);
create table student_gamification_prefs (
  student_id uuid primary key references profiles(id),
  show_on_leaderboard boolean not null default false, display_alias text
);

Aturan bisnis.
Poin hanya diberikan oleh fungsi server award_xp(...) (SECURITY DEFINER), dipanggil dari kejadian: tugas dikumpulkan tepat waktu, presensi hadir, materi diselesaikan, polling dijawab, kuis cepat benar. Mahasiswa tidak bisa menulis tabel ini langsung (RLS: hanya baca milik sendiri). Kunci unik membuat pemberian poin aman diulang.
Besaran poin ada di satu berkas konfigurasi (bukan tersebar), mudah diubah. Awal: tugas tepat waktu 10, hadir 5, materi selesai 3, jawab polling 2, kuis cepat benar 3.
Kebiasaan harian (streak) dihitung dari hari dengan sedikitnya satu aktivitas belajar (hadir, membuka materi, mengumpulkan tugas), zona WIB. Streak yang putus kembali ke 0 tanpa pesan menakut-nakuti.
Papan peringkat per kelas opt-in dua lapis: dosen mengaktifkan untuk kelas, mahasiswa memilih ikut. Tampil dengan nama alias, 10 teratas ditambah posisi sendiri, direset mingguan. Peringkat tidak pernah berdasarkan nilai ujian atau tugas, hanya poin kebiasaan.
Lencana awal (nama natural, syarat ditampilkan pada lencana yang belum diraih): "Tepat Waktu" (5 tugas berturut-turut tepat waktu), "Hadir Penuh" (hadir di semua pertemuan satu bulan), "Tuntas Materi" (100% materi satu kelas), "Rajin Membaca" (20 materi selesai), "Penjawab Aktif" (10 polling dijawab), "Seminggu Beruntun" (7 hari kebiasaan), "Sebulan Beruntun" (30 hari).
Admin dapat mematikan fitur lewat kebijakan gamification_enabled.
Antarmuka. Pencapaian: ringkasan poin dan kebiasaan harian, kisi lencana (yang belum diraih tampak redup dengan syaratnya), papan peringkat bila aktif dan diikuti, dan sakelar "Tampilkan saya di papan peringkat" beserta alias. Teks netral dan singkat, tanpa seruan.
Selesai bila: poin tidak bisa ditambah dari klien (uji RLS); pemberian ganda tidak menggandakan poin; papan peringkat hanya memuat mahasiswa yang opt-in.
12.4 Pengingat AI yang proaktif
Tujuan. Pengingat tugas, ujian, kehadiran, dan keamanan akun yang tepat waktu. Aturan menentukan apa dan kapan; AI hanya merapikan kalimatnya.
Skema (sketsa).
create table ai_reminders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  kind text not null check (kind in ('tugas_h1','tugas_3jam','ujian_h1','kehadiran','materi_baru','login_baru','ringkasan_mingguan')),
  ref_type text, ref_id uuid,
  payload jsonb not null,                                -- data terstruktur sumber kalimat
  message text,                                          -- hasil akhir
  status text not null default 'terjadwal' check (status in ('terjadwal','terkirim','dibaca','dibatalkan')),
  scheduled_for timestamptz not null, sent_at timestamptz,
  dedupe_key text not null unique
);
create table ai_usage_logs (
  id bigint generated always as identity primary key,
  student_id uuid, kind text, input_tokens int, output_tokens int, ok boolean, created_at timestamptz default now()
);

Aturan pemicu (pekerjaan terjadwal tiap 15 menit, idempoten lewat dedupe_key).
Tugas: H-1 dan 3 jam sebelum tenggat efektif (9.1) bagi yang belum mengumpulkan.
Ujian: H-1 sebelum jadwal buka.
Kehadiran: bila persentase kehadiran di sebuah kelas berada dalam jarak satu absen dari ambang min_attendance_percent. Hitung "sisa absen aman" lewat attendance_percent (10.1).
Materi baru: dirilis dan belum dibuka setelah 3 hari.
Login baru: segera saat user_devices mendeteksi perangkat atau lokasi baru, dengan tautan "Ini bukan saya" yang sudah ada. Pengingat ini tidak bisa dimatikan dan tidak mengikuti jam tenang.
Ringkasan mingguan: Senin 07.00 WIB berisi tugas dan ujian minggu ini, tugas yang lewat tenggat, ringkasan kehadiran, dan satu saran singkat.
Jam tenang untuk pengingat lain: 22.00–06.00 WIB; pengingat yang jatuh di jam itu digeser ke 06.00.
Peran AI.
Pakai klien AI yang sudah dipakai fitur Tanya AI; model dan kunci dari variabel lingkungan (AI_MODEL, kunci yang sudah ada). Jangan menulis nama model di kode.
Masukan ke AI hanya payload terstruktur milik mahasiswa itu sendiri. Keluaran wajib JSON { "pesan": "..." } dengan 1–3 kalimat Bahasa Indonesia, nada sopan dan santai, tanpa emoji, tanpa menambah fakta di luar payload.
Prompt sistem (simpan sebagai konstanta terpisah): "Kamu menulis pengingat singkat untuk mahasiswa di LMS kampus. Tulis 1 sampai 3 kalimat Bahasa Indonesia yang sopan dan wajar, tanpa emoji dan tanpa tanda seru berlebihan. Gunakan hanya fakta pada data yang diberikan. Jangan menambah angka, nama, atau tanggal. Keluarkan JSON saja dengan satu kunci 'pesan'."
Batas waktu panggilan 5 detik. Gagal, kosong, atau tidak lolos validasi JSON: pakai kalimat templat statis yang sudah disiapkan per jenis. Cache hasil berdasarkan hash payload. Batasi jumlah panggilan per pengguna per hari dan catat di ai_usage_logs.
Jangan pernah memasukkan data mahasiswa lain, isi bukti izin atau sakit, atau isi pesan ke prompt.
Antarmuka. Pengingat muncul sebagai notifikasi biasa (jenis tersendiri) dan sebagai kartu di Beranda. Pengaturan memuat sakelar per jenis pengingat (kecuali login baru). Admin bisa mematikan seluruh fitur lewat ai_reminders_enabled.
Selesai bila: tidak ada pengingat ganda untuk kejadian yang sama; fallback templat berfungsi saat AI dimatikan; tidak ada data lintas pengguna di payload (uji); jam tenang dihormati; ringkasan mingguan hanya memuat data milik penerima.
12.5 Evaluasi dosen oleh mahasiswa
Tujuan. Kuesioner evaluasi per dosen per kelas yang anonim bagi dosen, dengan hasil agregat untuk Kaprodi.
Skema (sketsa).
create table evaluation_templates (id uuid primary key default gen_random_uuid(), name text not null, created_by uuid references profiles(id));
create table evaluation_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references evaluation_templates(id) on delete cascade,
  position int not null, category text, text text not null,
  kind text not null check (kind in ('skala','teks')), required boolean not null default true
);
create table evaluation_periods (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references semesters(id), template_id uuid not null references evaluation_templates(id),
  name text not null, opens_at timestamptz not null, closes_at timestamptz not null,
  status text not null default 'draf' check (status in ('draf','buka','tutup')),
  require_before_final_grades boolean not null default false,
  created_by uuid not null references profiles(id)
);
create table evaluation_targets (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references evaluation_periods(id) on delete cascade,
  class_id uuid not null references classes(id), lecturer_id uuid not null references profiles(id),
  unique (period_id, class_id, lecturer_id)
);
-- Pencatat siapa yang sudah mengisi. TIDAK menyimpan jawaban.
create table evaluation_completions (
  target_id uuid references evaluation_targets(id) on delete cascade,
  student_id uuid references profiles(id), completed_at timestamptz not null default now(),
  primary key (target_id, student_id)
);
-- Jawaban. TIDAK menyimpan student_id dan hanya menyimpan tanggal, bukan jam.
create table evaluation_responses (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references evaluation_targets(id) on delete cascade,
  submitted_on date not null default current_date
);
create table evaluation_answers (
  response_id uuid references evaluation_responses(id) on delete cascade,
  question_id uuid references evaluation_questions(id),
  value_int int check (value_int between 1 and 5), value_text text, is_hidden boolean not null default false,
  primary key (response_id, question_id)
);

Aturan bisnis.
Anonimitas: pengiriman hanya lewat RPC submit_evaluation(target_id, answers jsonb) bertipe SECURITY DEFINER yang, dalam satu transaksi, menyisipkan baris evaluation_completions (menolak bila sudah ada) dan satu evaluation_responses beserta evaluation_answers. Tidak ada kolom atau indeks yang menautkan keduanya. Tidak ada peran yang bisa membaca kedua tabel dan menggabungkannya (RLS: evaluation_completions hanya terbaca oleh mahasiswa itu sendiri dan untuk hitungan agregat oleh Kaprodi; evaluation_responses dan evaluation_answers hanya lewat RPC agregat).
Hasil per dosen hanya ditampilkan bila jumlah responden ≥ evaluation_min_respondents (bawaan 5). Di bawah itu tampil "Responden belum cukup untuk ditampilkan."
Komentar teks ditampilkan acak urutannya, tanpa tanggal. Kaprodi dapat menyembunyikan komentar yang melanggar tata tertib (is_hidden) dengan alasan yang masuk audit log; dosen tidak melihat komentar tersembunyi.
Hasil terbuka bagi dosen setelah periode tutup. Kaprodi melihat agregat per dosen dan per kelas serta perbandingan dengan semester sebelumnya.
Bila require_before_final_grades aktif, Nilai Saya menyembunyikan nilai akhir satu kelas selama periode terbuka dan evaluasi kelas itu belum diisi, dengan kartu "Isi evaluasi dosen untuk melihat nilai akhir kelas ini." Nilai per tugas dan ujian tetap terlihat.
Kelas dengan beberapa dosen menghasilkan satu target per dosen.
Antarmuka.
Mahasiswa, Evaluasi Dosen: daftar kelas yang menunggu evaluasi (dengan badge), form satu halaman per kelompok pertanyaan (skala 1–5 berlabel kata, bukan hanya angka: Sangat kurang … Sangat baik), progres, dan konfirmasi akhir "Jawaban dikirim secara anonim."
Kaprodi, Evaluasi Dosen: tab Templat (kelola pertanyaan), Periode (buat dari templat, pilih kelas otomatis dari semester, atur buka dan tutup), Kelengkapan (persentase pengisian per kelas), Hasil (per dosen, grafik per kategori, komentar, ekspor .xlsx).
Dosen, Hasil Evaluasi: hasil kelasnya sendiri setelah periode ditutup.
Notifikasi. Mahasiswa: periode dibuka, pengingat 3 hari dan 1 hari sebelum tutup bagi yang belum mengisi. Kaprodi: periode ditutup beserta ringkasan kelengkapan.
Selesai bila: tidak ada query yang bisa menautkan mahasiswa ke jawabannya (uji dengan akun Kaprodi dan akun admin); batas responden minimum ditegakkan di server; pengiriman ganda ditolak; pembatasan nilai akhir bekerja dan bisa dimatikan.

13. Fase 6 — Alat bantu dosen dan sistem
13.1 Salin kelas dan arsip kelas
Tujuan. Dosen memakai ulang isi kelas semester lalu, dan kelas lama diarsipkan menjadi hanya-baca.
Salin kelas.
RPC clone_class(source_class_id, target_class_id, options jsonb, date_shift_days int) dijalankan sebagai pekerjaan latar dengan tabel clone_jobs(id, status, progress, error, requested_by).
Yang bisa disalin (dipilih di langkah pratinjau): materi (beserta berkas), tugas (status draf, tanggal digeser), rubrik, kuis dan ujian (status draf), pengaturan bobot nilai, pemetaan CPMK, pengaturan gamifikasi, pengaturan asisten (hanya bila dipilih).
Yang tidak disalin: pengumpulan, nilai, peserta, presensi, kiriman forum, percakapan, polling lama.
Berkas storage disalin sebagai objek baru; jangan berbagi path dengan kelas sumber.
Langkah: pilih kelas sumber (dari kelas milik dosen), pilih kelas tujuan (kelas semester aktif yang sudah dibentuk Staf untuk mata kuliah yang sama), pilih apa yang disalin, atur pergeseran tanggal (otomatis disarankan dari selisih awal semester), pratinjau jumlah per jenis, jalankan. Selama berjalan tampil progres; selesai tampil ringkasan dan tautan ke kelas tujuan.
Dosen yang mengampu kelas sumber dan tujuan, atau Staf Akademik, boleh menjalankan. Semuanya masuk audit log.
Arsip.
Status selesai dan diarsipkan pada classes.status. Kelas diarsipkan bersifat hanya-baca: kebijakan RLS dan server action menolak semua penulisan oleh Dosen, Asisten, dan Mahasiswa (kecuali tindakan administratif Staf dan Super Admin).
Mahasiswa tetap bisa membuka materi dan nilai kelas arsip selama student_access_archived_days (bawaan 365) sejak diarsipkan.
Staf memiliki tombol Tutup Semester di Kelas dan Peserta yang mengarsipkan banyak kelas sekaligus dengan pratinjau dan konfirmasi. Pekerjaan auto_archive_classes mengarsipkan kelas otomatis class_archive_after_days (bawaan 30) setelah semester berakhir, bila kebijakan auto_archive_enabled aktif.
Pembatalan arsip hanya oleh Staf dengan alasan yang masuk audit log.
Kelas Saya punya filter Aktif dan Arsip; kelas arsip memakai pita informasi "Kelas ini sudah diarsipkan dan hanya bisa dibaca."
Selesai bila: salinan tidak memuat data mahasiswa; tanggal tergeser benar; penulisan pada kelas arsip ditolak di server untuk setiap peran; pekerjaan salin aman diulang bila gagal di tengah (tidak membuat duplikat).
13.2 Impor soal massal dari Excel dan Word
Tujuan. Dosen memasukkan banyak soal ke Bank Soal sekaligus, dengan pratinjau dan pesan galat yang jelas.
Format Excel. Templat .xlsx yang bisa diunduh, dibuat dengan exceljs, berisi validasi daftar pilihan (dropdown) dan dua baris contoh. Kolom: tipe (pilihan_ganda, benar_salah, isian_singkat, esai), pertanyaan, opsi_a … opsi_e, kunci, bobot, tingkat (mudah, sedang, sukar), topik, cpmk (kode), pembahasan.
Format Word. Dokumen .docx dengan pola: nomor lalu titik lalu teks soal; pilihan a. sampai e.; baris Jawaban: B; baris opsional Pembahasan:; pemisah antarsoal berupa nomor berikutnya. Gambar tersemat didukung (diunggah ke question-assets, maksimal 2 MB per gambar). Gunakan mammoth untuk mengubah ke HTML, lalu parser berbasis pola. Sediakan juga contoh dokumen yang bisa diunduh.
Alur.
Unggah (maksimal 10 MB, maksimal 500 soal) ke import-staging.
Parse di server, hasil berupa daftar baris dengan status: Valid, Peringatan (misalnya bobot kosong, memakai bawaan), Galat (misalnya kunci tidak ada di pilihan).
Pratinjau yang bisa disunting langsung di tempat; pesan galat natural, misalnya "Baris 14: kunci 'F' tidak ada di pilihan. Pilihan yang tersedia A sampai D."
Deteksi duplikat dengan hash teks yang dinormalkan, ditandai sebagai peringatan terhadap soal yang sudah ada di bank.
Konfirmasi. Opsi: "Impor semua yang valid dan lewati yang galat" atau "Batalkan semuanya bila ada galat". Penyisipan dalam transaksi per kelompok 100 soal.
Ringkasan: berapa soal masuk, berapa dilewati, dan daftar galatnya yang bisa diunduh .csv.
Keamanan. Bersihkan HTML soal dengan daftar putih tag (teks dasar, tabel, gambar tersemat, rumus bila ada), tolak skrip dan atribut event. Berkas staging dihapus otomatis setelah 24 jam. Ukuran dan tipe MIME diperiksa di server.
Selesai bila: berkas dengan 500 soal terimpor di bawah 30 detik; setiap jenis galat punya pesan yang jelas; HTML berbahaya dibersihkan (uji dengan muatan XSS); duplikat terdeteksi.
13.3 Ekspor dan impor Moodle XML dan QTI
Tujuan. Bank soal tidak terkunci di SIAJAR.
Moodle XML (kerjakan lengkap).
Ekspor: pilih soal atau folder topik di Bank Soal, hasilkan satu berkas .xml. Jenis yang didukung: multichoice (tunggal dan jamak), truefalse, shortanswer, essay. Topik menjadi <question type="category">.
Impor: parse dengan fast-xml-parser, tangani CDATA, questiontext format="html" (bersihkan HTML seperti 13.2), gambar <file encoding="base64"> (unggah ke question-assets), dan nilai fraction (100 = benar; nilai parsial pada pilihan jamak dipetakan ke bobot). Jenis yang tidak didukung dilewati dengan peringatan yang menyebut jenisnya.
Alur impor memakai pratinjau yang sama dengan 13.2.
QTI 2.1 (fase akhir, setelah Moodle XML lulus uji).
Ekspor dan impor paket .zip dengan imsmanifest.xml untuk soal pilihan ganda tunggal dan jamak serta esai. Verifikasi spesifikasi terbaru dan pilih 2.1 sebagai dasar karena paling luas didukung; catat di KEPUTUSAN.md bila memilih versi lain.
Selesai bila: uji putar-balik (ekspor lalu impor kembali menghasilkan soal yang sama untuk semua jenis yang didukung); berkas contoh dari Moodle terbaca; jenis tak didukung tidak merusak impor.

14. Fase 7 — Penutup
14.1 Matriks otorisasi versi baru
Gantikan tabel matriks lama dengan daftar berikut di dokumentasi. Tuliskan sebagai poin, bukan tabel.
Akses ruang kelas: Mahasiswa dan Asisten (terdaftar), Dosen (pengampu), Kaprodi (pantauan prodi), Staf (administrasi kelas), System Admin (tidak ada), Super Admin (hanya lewat impersonasi hanya-lihat).
Skor dan koreksi: Mahasiswa tidak ada; Asisten draf; Dosen draf dan final; Kaprodi, Staf, System Admin, Super Admin tidak ada.
Finalisasi buku nilai: hanya Dosen pemilik kelas.
Revisi nilai pasca-final: Dosen mengajukan; Kaprodi memutuskan; Staf mengeksekusi; Super Admin hak audit.
Sanggah nilai: Mahasiswa mengajukan; Dosen memutuskan; Kaprodi melihat jumlah; lainnya tidak ada.
Buka sesi presensi: Dosen; Asisten bila can_open_attendance diberikan dosen; Kaprodi dan Staf hanya pantau.
Izin dan sakit: Mahasiswa mengajukan; Dosen kelas terkait memutuskan; lainnya tidak ada akses isi.
Berita acara: Dosen menulis; Asisten baca; Kaprodi dan Staf baca dan ekspor.
Kelompok tugas: Dosen mengatur; Mahasiswa bergabung sesuai mode; Asisten baca dan draf skor.
Rubrik: Dosen mengelola; Asisten memakai; Mahasiswa membaca rubrik tugasnya.
Ujian: Dosen membuat dan mengatur; Asisten memantau dan menampilkan token; Dosen menambah waktu peserta.
Analisis soal: Dosen pengampu; Asisten baca.
Cek kemiripan: Dosen; Asisten bila diizinkan dosen.
Kurikulum, CPL, CPMK: Kaprodi mengelola; Dosen memetakan penilaian ke CPMK; Super Admin kebijakan global.
Penjadwalan dan kuota kelas: Staf.
Evaluasi dosen: Kaprodi mengelola periode dan melihat agregat; Dosen melihat hasil sendiri; Mahasiswa mengisi anonim.
Pesan dan konsultasi: Mahasiswa, Asisten, Dosen sesuai aturan 12.1; Staf hanya salinan laporan; admin tidak ada.
Polling: Dosen membuat; Mahasiswa kelas menjawab.
Pengajuan surat: Mahasiswa mengajukan; Staf memproses.
Kelola master pengguna: Staf (mahasiswa dan dosen); Super Admin penuh.
Infrastruktur dan log audit: System Admin (log disamarkan untuk entitas akademik); Super Admin penuh.
Impersonasi: hanya Super Admin, hanya-lihat, maksimal 30 menit, dengan alasan.
14.2 Dokumentasi
Perbarui docs/SIAJAR_Fitur_dan_Menu_Role.md dengan menu baru (bagian 6), fitur tambahan, dan matriks 14.1. Ganti semua tautan file:///c:/Users/... dengan tautan relatif (misalnya ./SIAJAR_Fitur_dan_Menu_Role.pdf). Hapus bagian "Panduan Mengunduh" yang bersifat catatan proses. Tulis angka persentase memakai teks biasa ("kurang dari 75%"), tanpa notasi LaTeX.
Cari skrip yang menghasilkan PDF, XLSX, CSV, dan HTML dari dokumen itu, lalu jalankan ulang agar semuanya sinkron.
Perbarui halaman Bantuan per peran dengan alur baru yang relevan, ditulis mengikuti aturan bagian 4.
Tulis docs/RUNBOOK.md: cara menjalankan konektor Judge, cara memutar CRON_SECRET, cara memulihkan cadangan, dan cara membaca log audit.
14.3 Data contoh (seed)
Buat atau perbarui supabase/seed/ dengan data demo realistis berbahasa Indonesia: satu prodi, dua semester, 8 dosen, 3 asisten, 120 mahasiswa, 6 kelas dengan 16 pertemuan, tugas individu dan kelompok (sebagian terlambat, sebagian diperpanjang), satu ujian dengan 40 soal beragam termasuk koding, satu periode evaluasi, beberapa sanggahan dan permohonan izin, percakapan, serta polling. Nama dan NIM fiktif. Satu akun per peran dengan kata sandi demo tertulis di README seed.
14.4 Pemeriksaan akhir
Semua perintah pemeriksaan hijau: typecheck, lint, test unit, test RLS, test e2e, build produksi.
Jumlah menu per peran dan total (102) sesuai; tidak ada label lama maupun kata terlarang tersisa.
Setiap tabel baru punya RLS dan minimal satu uji kebijakan.
Tidak ada rahasia di klien (periksa bundel untuk JUDGE_API_KEY, CRON_SECRET, kunci layanan).
Lighthouse atau pemeriksaan aksesibilitas dasar untuk halaman baru yang paling sering dipakai (Kelas Saya, Ujian, Nilai Saya, Pesan).
Tulis docs/PROGRESS.md akhir: fase selesai, fase ditunda, keputusan, dan temuan.

Lampiran A — Kunci kebijakan akademik (seed awal)
Semua dapat diubah Super Admin di Aturan Akademik.
min_attendance_percent = 75
attendance_excused_mode = exclude
dispute_window_days = 7
absence_request_max_backdate_days = 7
sick_requires_attachment = true
absence_proof_retention_days = 180
journal_deadline_days = 3
exam_grace_seconds = 20
evaluation_min_respondents = 5
consultation_cancel_min_hours = 2
consultation_max_future_days = 30
meeting_join_window_minutes = 15
meeting_allowed_hosts = daftar di 10.3
class_archive_after_days = 30
auto_archive_enabled = false
student_access_archived_days = 365
gamification_enabled = true
coding_autograder_enabled = false (aktifkan setelah konektor Judge siap)
similarity_default_threshold = 0.60
cpmk_pass_threshold = 60
ai_reminders_enabled = true
Lampiran B — Jenis notifikasi baru
Teks contoh harus mengikuti aturan bagian 4.
Tenggat tugas diperpanjang → mahasiswa: "Tenggat Tugas Basis Data Bab 3 diperpanjang sampai 22 Okt pukul 23.59."
Sanggahan baru → dosen: "Ada sanggahan baru untuk Kuis 2 di kelas Algoritma A."
Keputusan sanggahan → mahasiswa: "Sanggahanmu untuk Kuis 2 diterima. Nilai baru: 82."
Permohonan izin baru → dosen: "Rina Putri mengajukan izin 3 pertemuan di kelas Anda."
Keputusan izin → mahasiswa: "Izinmu untuk Algoritma A pertemuan 5 disetujui."
Berita acara belum diisi → dosen: "Berita acara Pertemuan 6 Algoritma A belum diisi."
Ditambahkan ke kelompok → mahasiswa: "Kamu ditambahkan ke Kelompok 3 untuk Proyek Web."
Pesan baru → penerima: "Pesan baru dari Dr. Andi."
Konsultasi dipesan atau dibatalkan → dosen dan mahasiswa.
Polling dibuka → mahasiswa: "Ada pertanyaan dari dosen di kelas Algoritma A."
Periode evaluasi dibuka dan pengingat → mahasiswa.
Ujian susulan atau remedial dijadwalkan → peserta.
Materi terbuka (rilis terjadwal) → mahasiswa.
Tugas dikoreksi dan nilai dipublikasikan → mahasiswa (yang sudah ada, pastikan teksnya mengikuti aturan baru).
Pengingat dari bagian 12.4 → mahasiswa.
Lampiran C — Pekerjaan terjadwal
Semua lewat /api/cron/<nama> dengan CRON_SECRET, idempoten.
scheduled_notifications (tiap 5 menit)
finalize_expired_attempts (tiap menit)
rotate_exam_tokens (tiap menit; hanya memutar yang jatuh tempo)
ai_reminders (tiap 15 menit) dan ai_weekly_summary (Senin 07.00 WIB)
journal_reminders (harian 08.00 WIB)
purge_absence_proofs (harian)
purge_import_staging (tiap jam)
auto_archive_classes (harian)
judge_poll (tiap menit, hanya bila webhook tidak dipakai)
similarity_runs (tiap menit, mengambil antrean)
item_analysis (tiap 5 menit, mengambil ujian yang baru selesai)
end_impersonation_sessions (tiap menit)
Lampiran D — Variabel lingkungan dan dependensi
Variabel lingkungan baru (tambahkan ke .env.example tanpa nilai):
CRON_SECRET
JUDGE_API_URL, JUDGE_API_KEY, JUDGE_WEBHOOK_SECRET
AI_MODEL (kunci AI memakai yang sudah dipakai Tanya AI)
Dependensi yang mungkin diperlukan (periksa dulu apakah repo sudah punya padanannya; pasang hanya bila perlu, cek versi stabil dan dokumentasi sebelum memakai): zod, exceljs, mammoth, fast-xml-parser, jszip, idb-keyval, date-fns dan date-fns-tz, CodeMirror 6 (@codemirror/*), penampil PDF (react-pdf atau pdfjs-dist), pembersih HTML (sanitize-html atau isomorphic-dompurify), library chart yang sudah dipakai repo.

Akhir dokumen.