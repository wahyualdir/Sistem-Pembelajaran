# SIAJAR — Panduan Operasional Sistem (Runbook)

Dokumen ini merupakan panduan teknis operasional bagi System Administrator dan Super Administrator dalam memelihara keandalan, keamanan, dan keberlangsungan layanan SIAJAR (Sistem Informasi Ajar Terpadu).

---

## 1. Menjalankan dan Memelihara Konektor Autograder Koding (Judge)

Konektor Judge bertugas mengeksekusi dan menilai kode program mahasiswa pada butir soal pemrograman ujian CBT secara otomatis di dalam lingkungan sandbox terisolasi.

### 1.1. Parameter Lingkungan (Environment Variables)
Pastikan parameter berikut telah terpasang pada konfigurasi server (`.env.production` atau manajemen secret hosting):

```bash
# URL layanan sandbox Judge (misalnya Judge0 atau runner isolate mandiri)
JUDGE_API_URL=https://judge.institution.ac.id

# Kunci API otentikasi untuk pengiriman job
JUDGE_API_KEY=rahasia-judge-api-key-institusi

# Kunci rahasia validasi HMAC untuk webhook hasil eksekusi
JUDGE_WEBHOOK_SECRET=rahasia-judge-webhook-hmac-32char
```

### 1.2. Modus Operasional
Sistem mendukung dua mekanisme penerimaan hasil penilaian kode:

1. **Modus Webhook (Rekomendasi Waktu Nyata)**:
   - Layanan Judge memanggil endpoint `POST /api/webhook/judge` ketika eksekusi kode selesai.
   - Endpoint memvalidasi tanda tangan HMAC pada header `X-Judge-Signature` menggunakan `JUDGE_WEBHOOK_SECRET`.
   - Nilai dan status kasus uji (Passed, Wrong Answer, Time Limit Exceeded, Memory Limit Exceeded, Runtime Error) langsung diperbarui ke tabel `coding_submissions`.

2. **Modus Polling (Pencadangan / Fallback)**:
   - Jika webhook terkendala jaringan atau dinonaktifkan, pekerjaan terjadwal `GET /api/cron/judge_poll` dijalankan tiap 1 menit dengan otentikasi `CRON_SECRET`.
   - Pekerjaan ini memeriksa antrean submission yang masih berstatus `PENDING` atau `PROCESSING` dan menarik hasilnya dari `JUDGE_API_URL`.

### 1.3. Uji Konektivitas dan Penanganan Kendala
1. **Pemeriksaan Kesehatan Layanan**:
   ```bash
   curl -i -H "Authorization: Bearer $JUDGE_API_KEY" $JUDGE_API_URL/health
   # Respon diharapkan: HTTP 200 OK dengan status "ok"
   ```
2. **Penanganan Darurat (Fail-Safe Switch)**:
   - Jika runner Judge mengalami kehabisan memori atau gangguan server, Super Admin dapat menonaktifkan fitur autograder koding sementara waktu melalui menu **Aturan Akademik** dengan mengubah kebijakan:
     ```
     coding_autograder_enabled = false
     ```
   - Perubahan ini berlaku instan tanpa membutuhkan restart server atau deploy ulang. Jawaban kode mahasiswa akan dialihkan ke antrean koreksi manual dosen pengampu di menu **Periksa Jawaban**.

---

## 2. Prosedur Pemutaran Kredensial Rahasia (`CRON_SECRET`)

Endpoint pekerjaan terjadwal (`/api/cron/*`) diproteksi menggunakan token `CRON_SECRET` untuk mencegah eksekusi tanpa hak dari pihak luar.

### 2.1. Jadwal Rotasi Kredensial
- **Rutin**: Setiap 90 hari sekali pada jadwal pemeliharaan berkala.
- **Darurat**: Segera dilakukan jika terdapat indikasi kebocoran kredensial atau pergantian personel administrator.

### 2.2. Langkah Pemutaran Zero-Downtime
1. **Buat Token Baru Berentropi Tinggi**:
   Jalankan perintah berikut di terminal aman untuk menghasilkan token 64 karakter heksadesimal:
   ```bash
   openssl rand -hex 32
   # Contoh hasil: e7b29a8f4c1056df92a1c0d481b7e3f892a019487c65321ab0d4e78216fcb90a
   ```

2. **Perbarui Variabel Lingkungan Server**:
   - Masukkan token baru ke pengaturan environment variable hosting (misalnya Vercel Project Settings > Environment Variables > `CRON_SECRET`).
   - Lakukan redeploy atau restart instance aplikasi agar proses membaca token baru.

3. **Perbarui Penjadwal Cron Eksternal**:
   - Masukkan token baru ke header konfigurasi penjadwal cron (Vercel Cron, pg_cron, atau runner crontab):
     ```
     Authorization: Bearer e7b29a8f4c1056df92a1c0d481b7e3f892a019487c65321ab0d4e78216fcb90a
     ```

4. **Verifikasi Panggilan Resmi (Uji Positif)**:
   ```bash
   curl -i -X POST \
     -H "Authorization: Bearer <TOKEN_BARU>" \
     https://siajar.institution.ac.id/api/cron/scheduled_notifications
   # Respon diharapkan: HTTP 200 OK
   ```

5. **Verifikasi Penolakan (Uji Negatif)**:
   ```bash
   # Uji tanpa token
   curl -i https://siajar.institution.ac.id/api/cron/scheduled_notifications
   # Respon diharapkan: HTTP 401 Unauthorized

   # Uji dengan token lama yang sudah kedaluwarsa
   curl -i -H "Authorization: Bearer <TOKEN_LAMA>" https://siajar.institution.ac.id/api/cron/scheduled_notifications
   # Respon diharapkan: HTTP 401 Unauthorized
   ```

---

## 3. Prosedur Pemulihan Cadangan Data (Backup dan Restore)

Prosedur ini digunakan untuk memulihkan basis data PostgreSQL dari cadangan snapshot saat terjadi kegagalan perangkat keras, bencana alam, atau kerusakan integritas data.

### 3.1. Struktur dan Lokasi Berkas Cadangan
- Berkas cadangan dihasilkan secara otomatis tiap hari pukul 02.00 WIB melalui cron pencadangan basis data.
- Format penamaan berkas: `backups/db-YYYYMMDD-HHMMSS.sql.gz`.
- Penyimpanan sekunder diarsipkan ke bucket penyimpanan terisolasi di luar kluster server utama.

### 3.2. Prosedur Pemulihan Bencana (Disaster Recovery)

1. **Aktifkan Mode Pemeliharaan (Maintenance Mode)**:
   Cegah aktivitas penulisan data dari mahasiswa dan dosen selama proses pemulihan:
   - Ubah konfigurasi `system_settings`:
     ```sql
     UPDATE public.system_settings 
     SET value_json = 'true'::jsonb 
     WHERE key = 'platform.maintenance_mode';
     ```
   - Halaman publik akan menampilkan pemberitahuan bahwa pemeliharaan terjadwal sedang berlangsung.

2. **Putus Koneksi Aktif ke Basis Data**:
   Hentikan koneksi dari penampung koneksi (PgBouncer) untuk memastikan tidak ada transaksi yang menggantung:
   ```bash
   # Melalui psql administrator
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE datname = 'siajar' AND pid <> pg_backend_pid();
   ```

3. **Jalankan Eksekusi Restorasi Data**:
   Gunakan skrip pemulihan resmi `scripts/restore-db.sh` atau baris perintah PostgreSQL:
   ```bash
   # Contoh perintah restorasi dari snapshot terkompresi
   gunzip -c backups/db-20261017-020000.sql.gz | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d siajar
   ```

4. **Verifikasi Integritas Pasca-Pemulihan (Wajib Dilakukan)**:
   Setelah proses restorasi selesai, jalankan urutan pemeriksaan verifikasi berikut:
   - **Verifikasi Row-Level Security**:
     ```bash
     npm run check:rls
     # Harus menghasilkan status sukses: 122 tabel public memiliki RLS aktif
     ```
   - **Verifikasi Integritas Foreign Key**:
     ```sql
     -- Pastikan tidak ada data orphan pada tabel enrollment
     SELECT count(*) FROM public.enrollments e 
     LEFT JOIN public.classes c ON e.class_id = c.id 
     WHERE c.id IS NULL;
     -- Hasil harus 0 baris
     ```
   - **Verifikasi Status Semester**:
     ```sql
     SELECT id, label, is_active FROM public.semesters WHERE is_active = true;
     -- Pastikan semester aktif sesuai dengan kalender berjalan
     ```
   - **Verifikasi Uji Fungsional**:
     Jalankan pengujian unit kritis:
     ```bash
     npm test
     ```

5. **Nonaktifkan Mode Pemeliharaan**:
   Kembalikan akses normal sistem:
   ```sql
   UPDATE public.system_settings 
   SET value_json = 'false'::jsonb 
   WHERE key = 'platform.maintenance_mode';
   ```

---

## 4. Prosedur Pembacaan dan Audit Log Sistem

Catatan log audit merupakan instrumen transparansi, akuntabilitas, dan kepatuhan terhadap Undang-Undang Pelindungan Data Pribadi (UU PDP).

### 4.1. Struktur Tabel `audit_logs`
Tabel `public.audit_logs` merekam setiap peristiwa perubahan data penting dengan atribut:
- `id`: UUID unik transaksi audit.
- `created_at`: Waktu pencatatan kejadian dalam UTC.
- `actor_user_id`: ID pengguna yang melakukan aksi.
- `actor_role`: Peran aktif pengguna saat melakukan aksi.
- `action`: Tindakan yang dieksekusi (contoh: `grade.finalize`, `grade.change_request`, `class.archive`, `impersonation.start`).
- `entity_type`: Tipe entitas yang berubah (contoh: `classes`, `grades`, `submissions`).
- `entity_id`: Kunci primer baris entitas yang bersangkutan.
- `before_json` & `after_json`: Data sebelum dan sesudah perubahan.
- `ip_address` & `user_agent`: Alamat IP dan identitas peramban aktor.

### 4.2. Penyamaran Data Akademik untuk System Administrator
Untuk menjaga kerahasiaan akademik dan privasi mahasiswa, sistem menerapkan pemisahan hak baca log audit:

1. **System Administrator (SYSTEM_ADMIN)**:
   - Mengakses view `public.audit_logs_for_sysadmin`.
   - Nilai kolom `before_json` dan `after_json` untuk entitas akademik sensitif (**nilai, pengumpulan tugas, lembar jawaban ujian, permohonan sanggahan nilai, izin dan sakit, pesan, dan evaluasi dosen**) disamarkan secara otomatis menjadi teks `'[disembunyikan]'`.
   - System Admin tetap dapat memantau kapan peristiwa terjadi, siapa aktornya, dan dari alamat IP mana, tanpa dapat mengintip isi nilai atau jawaban mahasiswa.

2. **Super Administrator (SUPER_ADMIN)**:
   - Memiliki hak akses penuh membaca tabel asli `public.audit_logs` tanpa penyamaran untuk keperluan investigasi resmi institusi.

### 4.3. Audit Jejak Impersonasi Akun
SIAJAR menyediakan fasilitas bagi Super Admin untuk melihat sistem dari sudut pandang pengguna lain (impersonasi hanya-lihat) untuk membantu investigasi kendala operasional:
- **Aturan Keamanan**:
  - Wajib menyertakan alasan resmi minimal 20 karakter sebelum sesi dimulai.
  - Sesi berakhir otomatis dalam batas waktu maksimal 30 menit.
  - Seluruh tindakan penulisan data ditolak di tingkat server (*read-only enforcement*).
  - Tidak diizinkan melakukan impersonasi terhadap sesama akun Super Admin.
- **Pencatatan Audit**:
  - Saat sesi dimulai, tercatat baris dengan aksi `impersonation.start` memuat ID target, alasan, dan waktu mulai.
  - Saat sesi berakhir atau ditutup, tercatat aksi `impersonation.end`.
  - Pekerjaan cron `GET /api/cron/end_impersonation_sessions` dijalankan tiap menit untuk memastikan tidak ada sesi impersonasi yang melebihi batas waktu 30 menit.

### 4.4. Kebijakan Retensi Berkas
- **Bukti Izin dan Sakit**: Berkas bukti medis yang diunggah mahasiswa pada menu Presensi disimpan selama 180 hari. Setelah itu, berkas dibersihkan otomatis oleh cron `GET /api/cron/purge_absence_proofs`.
- **Berkas Staging Impor Bank Soal**: Berkas templat Excel atau Word yang diunggah saat impor bank soal otomatis dibersihkan setelah 24 jam oleh cron `GET /api/cron/purge_import_staging`.
