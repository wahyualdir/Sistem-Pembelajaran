# SIAJAR — Instruksi Pengerjaan untuk Antigravity
Versi 2 · Oktober 2026 · Bahasa antarmuka dan dokumentasi: Indonesia
Berkas ini adalah satu-satunya sumber instruksi untuk tahap penyempurnaan SIAJAR.

## Prompt pembuka
Baca seluruh isi docs/INSTRUKSI_ANTIGRAVITY.md sebelum menyentuh kode apa pun.

Kerjakan Fase 0 sampai Fase 7 secara berurutan dan mandiri. Jangan berhenti untuk meminta
konfirmasi di antara fase. Kalau menemukan hal yang tidak jelas, pilih opsi paling aman,
catat keputusannya di docs/KEPUTUSAN.md, lalu lanjut.

Mulai dengan audit kode (Fase 0, langkah 1). Jangan berasumsi nama tabel, kolom, atau rute:
semua nama di dokumen ini adalah sketsa, nama sebenarnya ikuti yang ada di repo.

Setelah tiap fase selesai: jalankan typecheck, lint, test, dan build; perbaiki sampai hijau;
commit; tulis ringkasan di docs/PROGRESS.md. Jangan menghapus atau mengubah perilaku fitur
yang sudah ada kecuali dinyatakan eksplisit di dokumen.

---

## 1. Cara kerja yang diminta
1. **Audit dulu, baru ubah.** Fase 0 langkah 1 adalah membaca repo: struktur folder, `src/lib/config/menu-config.ts`, skema database di `supabase/migrations`, kebijakan RLS yang ada, daftar server action, dan komponen UI bersama. Hasil audit ditulis ke `docs/AUDIT_AWAL.md` (maksimal dua halaman): nama tabel sebenarnya, helper RLS yang sudah ada, library UI dan chart yang dipakai, pola validasi, pola penanganan error.
2. **Pakai yang sudah ada.** Kalau repo sudah punya helper, komponen, atau pola (misalnya helper RLS, komponen tabel, toast, form), pakai itu. Jangan membuat versi kedua.
3. **Satu fase, satu rangkaian commit.** Pesan commit memakai awalan konvensional dan deskripsi Indonesia, contoh: `feat(tugas): tambah aturan keterlambatan dan perpanjangan tenggat`.
4. **Migrasi database selalu berupa berkas baru bernomor di `supabase/migrations`.** Jangan mengedit migrasi lama. Setiap migrasi idempoten sejauh mungkin (`if not exists`), dan di komentar atas berkas tulis cara membatalkannya.
5. **Setelah tiap fase jalankan perintah pemeriksaan sesuai package manager repo** (`typecheck`, `lint`, `test unit`, `build`). Fase dianggap selesai hanya kalau semuanya lolos dan semua poin "Selesai bila" terpenuhi.
6. **Jangan menambah fitur di luar dokumen.** Tidak ada PWA, tidak ada notifikasi push, tidak ada mode hemat data. Kalau muncul ide perbaikan, catat di `docs/IDE_LANJUTAN.md` dan jangan dikerjakan.
7. **Jangan menebak API library dari ingatan.** Sebelum memakai library baru, cek versi stabil terbaru dan baca dokumentasinya. Pasang versi yang sudah beredar cukup lama, bukan rilis hari ini.
8. **Laporan akhir (Fase 7) berisi:** daftar fitur yang selesai, daftar yang sengaja ditunda beserta alasannya, daftar keputusan di `KEPUTUSAN.md`, dan cara menjalankan seed data demo.

---

## 2. Konteks proyek
- **Aplikasi**: web LMS kampus untuk Universitas Islam Riau, nama produk SIAJAR.
- **Stack yang sudah berjalan**: Next.js (App Router, Server Actions), Supabase (Postgres, Row-Level Security, Realtime, Storage, PgBouncer), login Google OAuth, hosting Vercel.
- **Navigasi dikendalikan satu berkas**: `src/lib/config/menu-config.ts`. Semua perubahan menu lewat berkas ini.
- **Tujuh peran**: `STUDENT`, `TEACHING_ASSISTANT`, `LECTURER`, `PROGRAM_COORDINATOR`, `ACADEMIC_STAFF`, `SYSTEM_ADMIN`, `SUPER_ADMIN`.
- **Tabel yang menurut dokumen lama sudah ada** (cari nama pastinya): `class_assistants`, `grade_change_requests`, `audit_logs`, `user_devices`, `programs`, `semesters`, `rooms`, serta tabel kelas, peserta kelas, pertemuan 1–16, materi, tugas, pengumpulan, presensi, ujian, soal, percobaan ujian, dan nilai.
- **Zona waktu tampilan**: Asia/Jakarta (WIB). Simpan semua waktu sebagai `timestamptz` (UTC) dan ubah ke WIB hanya saat ditampilkan.
- **Skala pemakaian yang direncanakan**: ratusan mahasiswa serentak saat ujian. Semua query di jalur ujian, presensi, dan polling harus punya indeks yang tepat dan tidak boleh N+1.

---

## 3. Aturan teknis lintas fitur
- **RLS wajib untuk setiap tabel baru.** Aktifkan enable row level security di migrasi yang sama dengan pembuatan tabel. Tidak boleh ada tabel tanpa kebijakan. Pakai helper yang sudah ada (misalnya "dosen pengampu kelas ini", "asisten kelas ini", "anggota kelas ini"). Kalau belum ada, buat sebagai fungsi security definer dengan `set search_path = ''`, lalu pakai di semua kebijakan baru.
- **Operasi lintas tabel yang harus atomik ditulis sebagai fungsi Postgres (RPC)** dan dipanggil dari server action. Jangan merangkai beberapa insert dari sisi aplikasi.
- **Validasi semua input di server action dengan Zod.** Skema Zod dipakai juga di form (satu sumber). Pesan galat validasi berbahasa Indonesia natural.
- **Format hasil server action seragam**: `{ ok: true, data }` atau `{ ok: false, pesan, kolom? }`. Pesan galat ditulis untuk pengguna, bukan pesan teknis.
- **Audit log untuk setiap aksi sensitif** (ubah nilai, finalisasi, setujui atau tolak, impersonasi, ubah kebijakan, hapus massal, lihat berkas bukti izin/sakit). Pakai tabel `audit_logs` yang ada. Isi: aktor, peran, aksi, entitas, id entitas, IP, user-agent, nilai sebelum dan sesudah.
- **Storage**: bucket privat, akses lewat signed URL berumur pendek (60 detik). Batasi tipe MIME dan ukuran di sisi server, bukan hanya di klien. Nama berkas disimpan sebagai UUID, nama asli disimpan di kolom terpisah.
- **Rate limit untuk aksi yang bisa disalahgunakan**: kirim pesan, masuk token ujian, jalankan kode, kirim sanggahan, kirim vote polling.
- **Pagination untuk semua daftar yang bisa lebih dari 50 baris.** Pakai keyset (cursor) untuk daftar besar seperti pesan dan log.
- **Cron**: pekerjaan terjadwal ditulis sebagai route handler yang dilindungi `CRON_SECRET`, dipicu Vercel Cron atau pg_cron. Setiap pekerjaan harus aman dijalankan dua kali (idempoten).
- **Hindari cache statis pada halaman yang bergantung waktu atau peran** (tenggat, ujian, rilis terjadwal). Pakai `dynamic = 'force-dynamic'` atau `no-store` sesuai pola repo.
- **Tipe TypeScript database digenerate ulang setelah tiap migrasi.** Dilarang memakai `any`.
- **Aksesibilitas**: semua kontrol bisa dioperasikan dengan keyboard, label form terhubung ke input, kontras warna cukup, status tidak hanya dibedakan lewat warna.
- **Responsif**: semua halaman baru harus nyaman di lebar 360 px. Tabel lebar menggulir di dalam wadahnya sendiri.
- **Keadaan kosong, memuat, dan galat harus ada di setiap halaman baru.**
- **Pengujian**: fungsi murni (hitung denda, hitung CPL, analisis soal, kemiripan, parser Moodle XML) wajib punya unit test. Kebijakan RLS tabel baru diuji dengan pgTAP (`supabase test db`) atau skrip SQL setara. Alur kritis (autosave ujian, sanggah nilai, izin sakit) diuji end-to-end dengan Playwright per peran.

---

## 4. Aturan tulisan antarmuka (supaya tidak terasa buatan AI)
Semua teks yang tampil ke pengguna mengikuti aturan ini: judul menu, judul halaman, tombol, label, keadaan kosong, pesan galat, notifikasi, dan teks bantuan.
### Prinsip
- Pendek, langsung, seperti ditulis staf kampus yang rapi. Tidak promosi, tidak antusias berlebihan.
- Pakai istilah Indonesia yang sudah lazim: tugas, nilai, tenggat, kelas, berkas, kumpulkan. Hindari serapan Inggris yang tidak perlu (submit, deadline, grade, feedback) di teks antarmuka.
- Tanpa emoji. Tanpa tanda seru berlebihan (maksimal sangat jarang). Tanpa kalimat pembuka basa-basi seperti "Wah", "Yuk", "Selamat datang di dunia…".
- Kalau perlu menyapa pengguna, mahasiswa disapa "kamu", dosen, staf, dan admin "Anda". Kalimat tanpa subjek lebih disukai.
- Tombol berupa kata kerja konkret: "Kumpulkan", "Simpan", "Ajukan Sanggahan", "Setujui", "Tolak", "Batalkan".
- Pesan galat menyebut penyebab dan langkah berikutnya, tidak menyalahkan pengguna.
- Keadaan kosong cukup satu kalimat fakta, ditambah satu tindakan bila ada.

### Contoh yang benar dan yang dihindari
- Benar: "Belum ada tugas di kelas ini." Hindari: "Wah, sepertinya belum ada apa-apa di sini!"
- Benar: "Berkas terlalu besar. Maksimal 10 MB." Hindari: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi nanti."
- Benar: "Tugas Basis Data Bab 3 ditutup besok pukul 23.59." Hindari: "Jangan lewatkan tenggat tugasmu! ⏰"
- Benar: "Jawaban tersimpan pukul 14.03." Hindari: "Auto-save berhasil dilakukan secara real-time."
- Benar: "Kehadiranmu di Algoritma 78%. Satu kali absen lagi, kamu turun di bawah 75%." Hindari: "Waspada! Kehadiranmu berada di zona kritis!"

### Kata dan pola yang dilarang dipakai di nama menu, judul, dan teks
- **Kata**: Dashboard, Insight, Hub, Smart, Pusat (sebagai awalan), Portal, Seamless, Powerful, Eksplorasi, Optimalkan, Tingkatkan, Revolusi, Ekosistem.
- **Pola**: tiga kata sejajar berirama ("Cepat, Mudah, Aman"), tanda & di nama menu (tulis "dan" bila perlu), garis miring pada nama menu, awalan "Kelola …" di setiap menu, judul huruf kapital semua.
- **Gaya penulisan menu**: Title Case pendek, satu sampai tiga kata. Judul grup menu satu atau dua kata, bukan huruf kapital semua.

---

## 5. Aturan tampilan
- Pakai token desain (warna, radius, spasi, tipografi) yang sudah ada. Jangan mendesain ulang halaman lama.
- Jangan memakai gradien ungu-biru, bayangan berlapis, kartu kaca (glassmorphism), atau ilustrasi generik. Tampilan harus tenang dan padat informasi, seperti aplikasi kerja.
- Satu warna aksen untuk tindakan utama. Warna status (sukses, peringatan, bahaya) hanya untuk status.
- Animasi seperlunya: transisi 150–200 ms untuk hover, buka tutup panel, dan perubahan status. Hormati `prefers-reduced-motion`. Tidak ada animasi dekoratif yang berulang.
- Ikon dari `lucide-react` yang sudah dipakai. Sebelum memakai ikon baru, pastikan namanya ada di versi yang terpasang.
- Tabel data: kepala tabel melekat saat menggulir, baris bisa dipindai, aksi baris di sisi kanan, pencarian dan filter di atas.

---

## 6. Peta menu final (menu-config.ts)
Hanya label dan pengelompokan yang berganti pada menu lama. Rute lama tidak diubah supaya tautan, bookmark, dan kebijakan akses tidak rusak. Menu baru memakai rute baru seperti tertulis. Judul halaman (`<h1>`), judul tab browser (`<title>`), breadcrumb, teks notifikasi, dan halaman bantuan harus ikut memakai nama baru.
Format tiap baris: Label — rute — ikon — badge — catatan.
**Total setelah perubahan: 102 butir menu** (sub-hub Super Admin dihitung 6 butir, menu bersama dihitung sekali). Pakai angka ini sebagai pemeriksaan akhir.

### 6.1 Mahasiswa (STUDENT)
**Tanpa judul grup:**
- Beranda — `/student` — `GraduationCap`
- Kalender — `/calendar` — `CalendarDays`
- Notifikasi — `/notifications` — `Bell` — `unreadCount`
- Pengumuman — `/announcements` — `Megaphone`

**Grup Belajar:**
- Kelas Saya — `/classes` — `Layers` — tab di dalam kelas: Materi, Tugas, Kelompok, Forum, Pertemuan, Nilai
- Presensi — `/attendance` — `CalendarCheck2` — tab: Riwayat, Izin dan Sakit
- Ujian — `/exams` — `FileCheck2` — daftar ujian berlangsung, akan datang, dan selesai
- Perpustakaan — `/library` — `Library`
- Tanya AI — `/ai-assistant` — `Sparkles`
- Pesan — `/messages` — `MessageCircle` — `unreadMessages` — tab: Percakapan, Konsultasi

**Grup Nilai:**
- Nilai Saya — `/grades` — `CheckSquare` — memuat grafik CPL dan tombol sanggahan
- Pencapaian — `/achievements` — `Trophy`
- Sertifikat — `/certificates` — `Award`

**Grup Lainnya:**
- Komunitas — `/community` — `MessageSquare`
- Evaluasi Dosen — `/evaluations` — `ClipboardCheck` — `pendingEvaluations`
- Pengajuan — `/requests` — `FilePlus2`

### 6.2 Asisten Dosen (TEACHING_ASSISTANT)
Menu Asisten = menu Mahasiswa (6.1) ditambah satu grup di antara "Utama" dan "Belajar". Susun lewat komposisi di `menu-config.ts`, jangan salin ulang daftar. Beranda Asisten memakai rute `/ta`.
**Grup Asistensi (bisa dilipat):**
- Kelas Asistensi — `/ta/classes` — `Layers`
- Koreksi — `/ta/grading` — `ClipboardList` — `taGradingCount`
- Pantau Ujian — `/ta/exam-monitor` — `ShieldAlert`

### 6.3 Dosen Pengampu (LECTURER)
**Tanpa judul grup:**
- Beranda — `/lecturer` — `LayoutDashboard`
- Kalender — `/calendar` — `CalendarDays`
- Notifikasi — `/notifications` — `Bell` — `unreadCount`
- Pengumuman — `/announcements` — `Megaphone`

**Grup Mengajar:**
- Kelas Saya — `/classes` — `Layers`
- Presensi — `/attendance` — `CalendarCheck2` — tab: Sesi, Permohonan Izin
- Berita Acara — `/lecturer/journals` — `NotebookPen`
- Perpustakaan — `/library` — `Library`

**Grup Ujian dan Nilai:**
- Ujian dan Kuis — `/exams` — `PlusCircle`
- Bank Soal — `/exams/question-bank` — `FolderArchive`
- Periksa Jawaban — `/exams/review` — `CheckSquare` — `lecturerReviewCount`
- Analisis Soal — `/exams/analysis` — `BarChart3`
- Rubrik — `/lecturer/rubrics` — `ListChecks`
- Buku Nilai — `/analytics` — `Table2`
- Sanggahan — `/lecturer/disputes` — `MessageSquareWarning` — `disputeCount`

**Grup Lainnya:**
- Pesan — `/messages` — `MessageCircle` — `unreadMessages`
- Mahasiswa Bimbingan — `/lecturer/mentoring` — `Users`
- Hasil Evaluasi — `/lecturer/evaluations` — `ClipboardCheck`
- Komunitas — `/community` — `MessageSquare`

### 6.4 Koordinator Program Studi (PROGRAM_COORDINATOR)
**Tanpa judul grup:**
- Beranda — `/coordinator` — `Compass`
- Kalender — `/calendar` — `CalendarDays`
- Notifikasi — `/notifications` — `Bell` — `unreadCount`
- Pengumuman — `/announcements` — `Megaphone` — baru ditambahkan

**Grup Prodi:**
- Kurikulum — `/coordinator/curriculum` — `BookOpen` — memuat CPL, CPMK, pemetaan, prasyarat
- Mata Kuliah — `/coordinator/courses` — `Layers`
- Penugasan Dosen — `/coordinator/assignments` — `Users`
- Evaluasi Dosen — `/coordinator/evaluations` — `ClipboardCheck`

**Grup Pantauan:**
- Perkuliahan — `/coordinator/monitoring` — `Activity`
- Mahasiswa Berisiko — `/coordinator/monitoring/at-risk` — `AlertCircle`

**Grup Persetujuan:**
- Persetujuan Nilai — `/coordinator/approvals` — `CheckCircle2` — `coordinatorApprovalsCount`
- Laporan — `/coordinator/reports` — `FileSpreadsheet`

### 6.5 Staf Akademik (ACADEMIC_STAFF)
**Tanpa judul grup:**
- Beranda — `/staff` — `LayoutDashboard`
- Kalender — `/calendar` — `CalendarDays`
- Notifikasi — `/notifications` — `Bell` — `unreadCount`

**Grup Data Induk:**
- Mahasiswa — `/staff/master/students` — `Users`
- Dosen — `/staff/master/lecturers` — `UserCheck`
- Data Akademik — `/staff/master` — `Database`

**Grup Akademik:**
- Jadwal — `/staff/schedules` — `CalendarClock`
- Kelas dan Peserta — `/staff/classes` — `Layers`
- Nilai dan Presensi — `/staff/grades` — `CheckSquare`

**Grup Layanan:**
- Pengajuan Masuk — `/staff/services/verification` — `FileText` — `requestCount`
- Pengumuman dan Acara — `/staff/announcements` — `Megaphone`
- Berkas dan Sertifikat — `/staff/content` — `BookOpen`
- Moderasi — `/staff/moderation` — `MessageSquare`

### 6.6 System Administrator (SYSTEM_ADMIN)
**Tanpa judul grup:**
- Beranda — `/admin/system` — `Server`
- Notifikasi — `/notifications` — `Bell` — `unreadCount`

**Grup Server:**
- Pemantauan — `/admin/system/monitoring` — `Activity`
- Integrasi — `/admin/system/integrations` — `Globe`

**Grup Keamanan:**
- Sesi Login — `/admin/system/security` — `Lock`
- Cadangan Data — `/admin/system/backup` — `FolderArchive`

**Grup Pengaturan:**
- Pengaturan Sistem — `/admin/system/settings` — `Sliders`
- Log Audit — `/admin/system/audit` — `ScrollText`

### 6.7 Super Administrator (SUPER_ADMIN)
**Tanpa judul grup:**
- Beranda — `/admin` — `LayoutDashboard`
- Notifikasi — `/notifications` — `Bell` — `unreadCount`

**Grup Pengguna:**
- Akun Pengguna — `/admin/users` — `Users`
- Peran dan Akses — `/admin/roles` — `ShieldAlert`

**Grup Aturan Kampus:**
- Aturan Akademik — `/admin/policies` — `Scale`
- Pengumuman Kampus — `/admin/announcements` — `Megaphone`

**Grup Sistem:** enam butir yang sama dengan 6.6 (Pemantauan, Integrasi, Sesi Login, Cadangan Data, Pengaturan Sistem, Log Audit), rute `/admin/system/*`.

### 6.8 Menu bersama semua peran
**Grup Akun (paling bawah sidebar):**
- Pengaturan — `/settings` — `Settings` — tampilan (terang, gelap, ikuti sistem), kerapatan, dan preferensi notifikasi per jenis
- Bantuan — `/help` — `LifeBuoy`
- Privasi — `/transparency` — `Eye` — ringkasan data tersimpan, sesi dan perangkat (`/devices`), tombol "Ini bukan saya", riwayat persetujuan privasi

### 6.9 Peta label lama ke label baru
Gunakan daftar ini untuk mencari dan mengganti semua kemunculan (kode, snapshot test, e2e, seed, dokumentasi, teks notifikasi, halaman bantuan).
- Dashboard Pengajar, Dashboard Prodi, Dashboard, Dashboard Sistem, Dashboard Universitas → Beranda
- Ujian Aktif → Ujian
- Pustaka Digital → Perpustakaan
- Tanya AI SIAJAR → Tanya AI
- Nilai & Progres → Nilai Saya
- Sertifikat & Portofolio → Sertifikat
- Kelas Diampu → Kelas Saya (untuk Dosen; rute tetap `/classes`)
- Kelas Diasistensi → Kelas Asistensi
- Antrean Koreksi → Koreksi
- Ujian & Kuis → Ujian dan Kuis
- Review Essay & Coding → Periksa Jawaban
- Analitik & Nilai → Buku Nilai
- Kurikulum & CPL → Kurikulum
- Penugasan & Kelas → Penugasan Dosen
- Monitoring (Kaprodi) → Perkuliahan
- Persetujuan (Kaprodi) → Persetujuan Nilai
- Laporan & Evaluasi → Laporan
- Kelas & Peserta → Kelas dan Peserta
- Nilai & Presensi → Nilai dan Presensi
- Verifikasi Berkas → Pengajuan Masuk
- Pengumuman & Event → Pengumuman dan Acara
- Pustaka & Sertifikat → Berkas dan Sertifikat
- Moderasi Komunitas → Moderasi
- Monitoring Sistem → Pemantauan
- Keamanan (item) → Sesi Login
- Backup & Restore → Cadangan Data
- Pengaturan Platform → Pengaturan Sistem
- Kelola Pengguna → Akun Pengguna
- Role & Permission → Peran dan Akses
- Kebijakan → Aturan Akademik
- Pengumuman Global → Pengumuman Kampus
- Pengaturan Tampilan → Pengaturan
- Pusat Bantuan → Bantuan
- Transparansi Data → Privasi
- Judul grup lama → baru: `PEMBELAJARAN` → `Belajar`; `EVALUASI & PRESTASI` → `Nilai`; `MODE ASISTEN` → `Asistensi`; `PENGAJARAN & PEMBELAJARAN` → `Mengajar`; `UJIAN & PENILAIAN` → `Ujian dan Nilai`; `LAINNYA` → `Lainnya`; `MANAJEMEN PRODI` → `Prodi`; `MONITORING` → `Pantauan`; `PERSETUJUAN & LAPORAN` → `Persetujuan`; `DATA MASTER` → `Data Induk`; `KELAS & AKADEMIK` → `Akademik`; `KONTEN & LAYANAN` → `Layanan`; `MONITORING & INTEGRASI` → `Server`; `KEAMANAN & CADANGAN` → `Keamanan`; `PENGATURAN & AUDIT` → `Pengaturan`; `PENGGUNA & AKSES` → `Pengguna`; `KEBIJAKAN & GLOBAL` → `Aturan Kampus`; `SISTEM` → `Sistem`; `PENGATURAN & BANTUAN` → `Akun`. Grup "UTAMA" tidak lagi diberi judul.
- Chip filter di Beranda Mahasiswa: "Tugas & Kuis" menjadi "Tugas dan Kuis". Chip lain tetap.

---

## 7. Fase 0 — Audit, penamaan ulang menu, dan penyelarasan celah
### 7.1 Langkah
1. Audit kode dan tulis `docs/AUDIT_AWAL.md` (lihat bagian 1, poin 1).
2. Terapkan peta menu bagian 6 ke `menu-config.ts`. Tambahkan menu baru dengan halaman sementara yang sah (judul, keadaan kosong, dan pembatasan akses sudah benar) supaya navigasi tidak menghasilkan 404 sebelum fiturnya selesai di fase berikutnya.
3. Ganti semua label lama sesuai bagian 6.9 di seluruh repo. Jalankan pencarian untuk setiap label lama dan pastikan tidak tersisa, termasuk di teks notifikasi, seed, test, dan dokumentasi.
4. Terapkan penyelarasan celah di 7.2.
5. Tambahkan test snapshot menu per peran yang memastikan jumlah butir sesuai (total 102) dan tidak ada kata terlarang dari bagian 4.

### 7.2 Penyelarasan celah dari spesifikasi lama
- **Satu halaman per rute bersama**: `/classes`, `/attendance`, `/exams`, `/library`, `/community`, `/messages`, `/calendar`, `/notifications`, `/announcements`.
- **Peran ganda**: pengganti peran di header, sidebar menu peran aktif, cookie peran aktif ditandatangani dan diverifikasi.
- **Pengumuman untuk Koordinator**: tambahkan di 6.4.
- **Asisten membuka presensi**: kolom `can_open_attendance` boolean not null default false pada `class_assistants`.
- **Entri matriks tanpa fitur**: hapus entri tanpa fitur dari matriks.
- **Pengajuan mahasiswa**: halaman `/requests` (student_requests).
- **Log audit untuk System Admin disamarkan**: view `audit_logs_for_sysadmin`.
- **Impersonasi hanya lihat**: max 30 menit, server action tulis ditolak, pita merah, dll.
- **Login lebih dari satu domain**: tabel `allowed_email_domains` dan `email_allowlist`.
- **Ambang kehadiran dari kebijakan**: baca dari `min_attendance_percent`.

---

## 8. Fase 1 — Fondasi bersama
- 8.1 Kebijakan akademik terkonfigurasi (`institution_policies`, Lampiran A)
- 8.2 Rilis terjadwal dan arsip (`release_at`, `classes.status`)
- 8.3 Notifikasi (`scheduled_notifications`, `notification_preferences`)
- 8.4 Pekerjaan terjadwal dan keamanan cron (`/api/cron/<nama>`)
- 8.5 Bucket storage baru (`absence-proofs`, `submission-feedback`, `message-attachments`, `question-assets`, `import-staging`)

---

## 9. Fase 2 — Tugas dan nilai
- 9.1 Aturan keterlambatan dan perpanjangan tenggat
- 9.2 Tugas kelompok
- 9.3 Rubrik dan umpan balik
- 9.4 Sanggah nilai oleh mahasiswa

---

## 10. Fase 3 — Kehadiran dan perkuliahan
- 10.1 Izin dan sakit dari sisi mahasiswa
- 10.2 Berita acara perkuliahan
- 10.3 Tautan kuliah daring dan rekaman
- 10.4 Progres materi dan penguncian berurutan

---

## 11. Fase 4 — Ujian
- 11.1 Autosave dan pemulihan saat koneksi putus
- 11.2 Token masuk, ujian susulan, dan remedial
- 11.3 Auto-grader soal koding
- 11.4 Analisis butir soal
- 11.5 Pemetaan CPMK ke CPL
- 11.6 Cek kemiripan tugas

---

## 12. Fase 5 — Interaksi
- 12.1 Pesan dan konsultasi
- 12.2 Polling dan kuis cepat saat kuliah
- 12.3 Pencapaian (gamifikasi ringan)
- 12.4 Pengingat AI yang proaktif
- 12.5 Evaluasi dosen oleh mahasiswa

---

## 13. Fase 6 — Alat bantu dosen dan sistem
- 13.1 Salin kelas dan arsip kelas
- 13.2 Impor soal massal dari Excel dan Word
- 13.3 Ekspor dan impor Moodle XML dan QTI

---

## 14. Fase 7 — Penutup
- 14.1 Matriks otorisasi versi baru
- 14.2 Dokumentasi
- 14.3 Data contoh (seed)
- 14.4 Pemeriksaan akhir (typecheck, lint, test, build hijau)

---

## Lampiran A — Kunci kebijakan akademik (seed awal)
- `min_attendance_percent` = 75
- `attendance_excused_mode` = exclude
- `dispute_window_days` = 7
- `absence_request_max_backdate_days` = 7
- `sick_requires_attachment` = true
- `absence_proof_retention_days` = 180
- `journal_deadline_days` = 3
- `exam_grace_seconds` = 20
- `evaluation_min_respondents` = 5
- `consultation_cancel_min_hours` = 2
- `consultation_max_future_days` = 30
- `meeting_join_window_minutes` = 15
- `meeting_allowed_hosts` = meet.google.com, zoom.us, teams.microsoft.com, teams.live.com, meet.jit.si, youtube.com, youtu.be, drive.google.com
- `class_archive_after_days` = 30
- `auto_archive_enabled` = false
- `student_access_archived_days` = 365
- `gamification_enabled` = true
- `coding_autograder_enabled` = false
- `similarity_default_threshold` = 0.60
- `cpmk_pass_threshold` = 60
- `ai_reminders_enabled` = true

## Lampiran B — Jenis notifikasi baru
- Tenggat tugas diperpanjang
- Sanggahan baru
- Keputusan sanggahan
- Permohonan izin baru
- Keputusan izin
- Berita acara belum diisi
- Ditambahkan ke kelompok
- Pesan baru
- Konsultasi dipesan atau dibatalkan
- Polling dibuka
- Periode evaluasi dibuka dan pengingat
- Ujian susulan atau remedial dijadwalkan
- Materi terbuka (rilis terjadwal)
- Tugas dikoreksi dan nilai dipublikasikan
- Pengingat dari bagian 12.4

## Lampiran C — Pekerjaan terjadwal
- `scheduled_notifications` (tiap 5 menit)
- `finalize_expired_attempts` (tiap menit)
- `rotate_exam_tokens` (tiap menit)
- `ai_reminders` (tiap 15 menit) dan `ai_weekly_summary` (Senin 07.00 WIB)
- `journal_reminders` (harian 08.00 WIB)
- `purge_absence_proofs` (harian)
- `purge_import_staging` (tiap jam)
- `auto_archive_classes` (harian)
- `judge_poll` (tiap menit)
- `similarity_runs` (tiap menit)
- `item_analysis` (tiap 5 menit)
- `end_impersonation_sessions` (tiap menit)

## Lampiran D — Variabel lingkungan dan dependensi
- Variabel baru: `CRON_SECRET`, `JUDGE_API_URL`, `JUDGE_API_KEY`, `JUDGE_WEBHOOK_SECRET`, `AI_MODEL`
- Dependensi potensial: `zod`, `exceljs`, `mammoth`, `fast-xml-parser`, `jszip`, `idb-keyval`, `date-fns`, `date-fns-tz`, `@codemirror/*`, `pdfjs-dist`, `sanitize-html`
