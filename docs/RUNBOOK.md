# SIAJAR — Panduan Operasional Sistem (Runbook)

Dokumen ini merupakan panduan teknis operasional bagi System Administrator dan Super Administrator dalam memelihara keandalan, keamanan, dan keberlangsungan layanan SIAJAR (Sistem Informasi Ajar Terpadu).

---

## 1. Menjalankan dan Memelihara Konektor Autograder Koding (Judge / Piston)

Konektor Judge bertugas mengeksekusi dan menilai kode program mahasiswa pada butir soal pemrograman ujian CBT secara otomatis di dalam lingkungan sandbox terisolasi.

### 1.1. Parameter Lingkungan (Environment Variables)
Pastikan parameter berikut telah terpasang pada konfigurasi server (`.env.production` atau manajemen secret hosting):

```bash
# URL layanan sandbox Judge (misalnya Judge0 atau runner Piston mandiri di VPC internal)
JUDGE_API_URL=https://judge.internal.institution.ac.id

# Kunci API otentikasi untuk pengiriman job
JUDGE_API_KEY=rahasia-judge-api-key-institusi

# Kunci rahasia validasi HMAC untuk webhook hasil eksekusi
JUDGE_WEBHOOK_SECRET=rahasia-judge-webhook-hmac-32char
```

### 1.2. Lokasi Hosting dan Arsitektur Isolasi Sandbox
1. **Lokasi Hosting Mandiri (Private VPC)**:
   - Runner autograder koding (Judge0 / Piston) di-hosting secara mandiri (*self-hosted*) pada kluster komputasi terisolasi di dalam VPC privat institusi (`judge.internal.institution.ac.id`).
   - Runner tidak membuka ingress langsung ke internet publik. Seluruh akses hanya diizinkan dari IP privat server aplikasi SIAJAR via VPC Peering atau Security Group tertutup.

2. **Isolasi Jaringan Runner (`--network none`)**:
   - Setiap eksekusi kode program mahasiswa dijalankan di dalam container Docker/Isolate sandbox sementara dengan flag:
     ```bash
     docker run --network none --read-only --tmpfs /tmp:rw,noexec,nosuid,size=10m ...
     ```
   - Container tidak memiliki antarmuka jaringan eksternal (hanya loopback `lo`), sehingga memblokir 100% upaya akses internet luar, panggilan HTTP/DNS liar, pemindaian port jaringan kampus, maupun akses ke metadata cloud (`169.254.169.254`).

3. **Batas Waktu dan Memori (Resource Limits & DoS Protection)**:
   - **Batas Waktu CPU (CPU Time Limit)**: Default 2000 ms (2,0 detik) per kasus uji; batas toleransi hard timeout sistem sebesar 5000 ms.
   - **Batas Memori RAM (Memory Limit)**: Default 128 MB (131.072 KB) per container sandbox dengan cgroup memory enforcement (OOM Killer aktif jika melampaui batas).
   - **Batas Proses & Thread (PIDs Limit)**: Maksimal 64 thread/proses (`--pids-limit 64`) untuk meniadakan potensi serangan *fork bomb*.
   - **Batas Penulisan Disk**: Direktori root bersifat *read-only*. Ruang tulis sementara hanya diizinkan pada partisi memori `/tmp` berukuran maksimal 10 MB.

4. **Isolasi Kasus Uji Tersembunyi (Hidden Test Cases Payload Sanitization)**:
   - Soal koding dapat memuat kasus uji terbuka (*public*) dan kasus uji tersembunyi (*hidden* dengan `tc.isHidden = true`).
   - **Proteksi Payload Klien**: Sesuai implementasi pada `Judge0Adapter` (`src/lib/judge/coderunner.ts`), data `stdin`, `expectedStdout`, dan rekaman keluaran asli `rawStdout` dari kasus uji tersembunyi **TIDAK PERNAH dikirim ke payload respons klien**.
   - Pada kasus uji tersembunyi, atribut `stdoutExcerpt` disanitasi secara ketat hanya menghasilkan status biner:
     ```typescript
     stdoutExcerpt: tc.isHidden ? (passed ? 'Lulus' : 'Gagal') : rawStdout.slice(0, 300)
     ```
   - Hal ini terbukti dan diverifikasi melalui pengujian unit di `src/tests/unit/phase4/phase4-exams-autograder.test.ts`, menjamin integritas dan kerahasiaan kasus uji evaluasi dosen.

### 1.3. Modus Operasional
Sistem mendukung dua mekanisme penerimaan hasil penilaian kode:

1. **Modus Webhook (Rekomendasi Waktu Nyata)**:
   - Layanan Judge memanggil endpoint `POST /api/webhook/judge` ketika eksekusi kode selesai.
   - Endpoint memvalidasi tanda tangan HMAC pada header `X-Judge-Signature` menggunakan `JUDGE_WEBHOOK_SECRET`.
   - Nilai dan status kasus uji (Passed, Wrong Answer, Time Limit Exceeded, Memory Limit Exceeded, Runtime Error) langsung diperbarui ke tabel `coding_submissions`.

2. **Modus Polling (Pencadangan / Fallback)**:
   - Jika webhook terkendala jaringan atau dinonaktifkan, pekerjaan terjadwal `GET /api/cron/judge_poll` dijalankan tiap 1 menit dengan otentikasi `CRON_SECRET`.
   - Pekerjaan ini memeriksa antrean submission yang masih berstatus `PENDING` atau `PROCESSING` dan menarik hasilnya dari `JUDGE_API_URL`.

### 1.4. Uji Konektivitas dan Penanganan Kendala
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

---

## 5. Konfigurasi Lingkungan Basis Data (`app.environment`) dan Pengaman Gagal-Tertutup

Untuk mencegah kerusakan atau kontaminasi data di lingkungan produksi (*production*), basis data SIAJAR menerapkan pengaman gagal-tertutup (*fail-closed*) berbasis parameter pengaturan basis data PostgreSQL (`app.environment`).

### 5.1. Mekanisme Pengaman Gagal-Tertutup (`demo_seed.sql`)
Berkas seed demonstrasi `supabase/seed/demo_seed.sql` berisi data dummy berskala besar untuk kebutuhan pengujian lokal dan QA staging. Pada bagian awal skrip, terpasang pengaman gagal-tertutup:

```sql
DO $$
BEGIN
    IF COALESCE(current_setting('app.environment', true), '') NOT IN ('local', 'staging') THEN
        RAISE EXCEPTION 'Keamanan Terlanggar: demo_seed.sql HANYA boleh dieksekusi pada lingkungan local atau staging! Nilai saat ini: %',
            COALESCE(current_setting('app.environment', true), '(kosong/tidak diatur)');
    END IF;
END $$;
```

**Karakteristik Pengaman**:
- Bila `app.environment` bernilai `NULL`, kosong (`''`), atau nilai selain `'local'` atau `'staging'`, eksekusi akan **langsung melempar exception fatal** dan membatalkan seluruh transaksi database (*fail-closed*).
- Perlindungan ini diuji secara ketat dalam tes unit `src/tests/unit/security/seed-safeguard.test.ts` dan pengujian pgTAP `supabase/tests/database/07_phase5_interaction_and_disputes_rls.sql`.

### 5.2. Cara Mengatur `app.environment`
Administrator dapat mengatur parameter ini pada lingkungan yang sah:

1. **Lingkungan Lokal (Local Development)**:
   - Secara permanen pada level basis data:
     ```sql
     ALTER DATABASE postgres SET app.environment = 'local';
     ```
   - Atau per sesi psql sebelum mengeksekusi seed:
     ```sql
     SET app.environment = 'local';
     \i supabase/seed/demo_seed.sql
     ```

2. **Lingkungan Pengujian / Pementasan (Staging)**:
   - Secara permanen pada database staging:
     ```sql
     ALTER DATABASE siajar_staging SET app.environment = 'staging';
     ```
   - Atau per sesi deployment psql:
     ```sql
     SET app.environment = 'staging';
     ```

### 5.3. LARANGAN KERAS DI PRODUKSI (STRICT PRODUCTION RULE)
> [!CAUTION]
> **DILARANG MENGATUR `app.environment` KE NILAI 'local' ATAU 'staging' DI BASIS DATA PRODUKSI!**
> 
> Pada kluster basis data produksi (*production database*):
> 1. Parameter `app.environment` harus dibiarkan kosong, bernilai default, atau disetel secara eksplisit ke `'production'`:
>    ```sql
>    ALTER DATABASE siajar_prod SET app.environment = 'production';
>    ```
> 2. Jangan pernah menyetel nilai `'local'` atau `'staging'` pada server produksi.
> 3. Jika operator atau skrip otomasi secara tidak sengaja mencoba mengeksekusi `demo_seed.sql` pada basis data produksi, transaksi akan **gagal seketika** tanpa menyentuh atau merusak satu baris data riil pun.

---

## 6. Operasional Fitur Pembelajaran Peta Pulau, Konten AI, dan Podcast

Sub-sistem Peta Pulau melengkapi SIAJAR dengan modul pembelajaran terstruktur (pulau materi), flashcard pengulangan berkala (Leitner), podcast audio materi, kolaborasi bantuan sejawat (Tukar Keahlian), dan rekapitulasi semester autentik.

### 6.1. Kebijakan Batas dan Persetujuan Konten AI
1. **Prinsip Gagal-Tertutup (*Fail-Closed*)**:
   - Jika kredensial API AI (`GEMINI_API_KEY`, `OPENAI_API_KEY`, atau `ANTHROPIC_API_KEY`) tidak terpasang di environment variable, tombol pembuatan konten AI secara otomatis dinonaktifkan dengan banner peringatan yang jelas: *"Fitur AI tidak tersedia: Kunci API AI belum dikonfigurasi di server."*
   - Sistem menolak beroperasi menggunakan nilai tebakan (*guessing values*).
2. **Keterikatan Sumber (*Grounding Score*)**:
   - Setiap kartu flashcard dan segmen podcast yang dibuat oleh AI diverifikasi keterikatannya dengan materi sumber (teks modul bab).
   - Kartu dengan skor keterikatan di bawah ambang minimal (60%) diberi tanda peringatan khusus *"Keterikatan Rendah"* agar dosen meneliti ulang atau menyuntingnya.
3. **Persetujuan Dosen Pengampu (*Human-in-the-Loop*)**:
   - Seluruh konten buatan AI berstatus awal `'draf'`.
   - Konten draf **TIDAK PERNAH** dapat diakses oleh mahasiswa (dilindungi RLS PostgreSQL).
   - Dosen pengampu wajib meninjau, menyunting, dan menyetujui pernyataan kebijakan kepatuhan sebelum konten dipublikasikan (`'terbit'`).

### 6.2. Konfigurasi Suara dan Sintesis Audio Podcast
1. **Parameter Lingkungan Suara**:
   ```bash
   # Penyedia sintesis suara (ElevenLabs, Google Cloud TTS, atau Edge TTS)
   TTS_PROVIDER=elevenlabs
   TTS_API_KEY=kunci-api-tts-institusi
   TTS_VOICE_ID=voice-id-narator-tenang
   ```
2. **Spesifikasi Naskah Podcast**:
   - Format: Satu narator tunggal (*single narrator*).
   - Panjang: 450 hingga 900 kata (durasi audio berkisar 3 sampai 6 menit).
   - Dosen wajib menyetujui naskah sebelum audio disintesis. Transkrip selalu ditampilkan berdampingan dengan pemutar audio.
   - Fitur podcast bawaan dinonaktifkan (`feature_podcast_enabled = false`) hingga konfigurasi suara selesai diuji dan disetujui.

### 6.3. Pekerjaan Terjadwal (*Cron Jobs*) Peta Pulau
Seluruh cron jobs dipanggil melalui `GET /api/cron/<nama>` dengan proteksi header `Authorization: Bearer $CRON_SECRET` dan bersifat idempoten:
1. `ai_content_jobs` (Eksekusi: Tiap Menit `* * * * *`):
   - Mengambil antrean pembuatan kartu flashcard dan naskah podcast (`ai_generation_jobs`) berstatus `antre`.
   - Mengontrol kuota harian per kelas dan batas 2 pekerjaan konkuren per dosen.
2. `tts_jobs` (Eksekusi: Tiap Menit `* * * * *`):
   - Mengambil antrean sintesis audio podcast (`tts_jobs`) berstatus `antre`.
   - Menghasilkan potongan audio MP3 dan menghitung durasi kumulatif secara idempoten.
3. `content_stale_check` (Eksekusi: Tiap 1 Jam `0 * * * *`):
   - Memeriksa materi kuliah yang mengalami pembaruan revisi konten dengan menghitung ulang `source_hash`.
   - Konten terkait otomatis ditandai statusnya menjadi `'perlu_tinjau_ulang'` agar dosen pengampu dapat memverifikasi relevansinya kembali.
4. `morning_summary` (Eksekusi: Harian Pukul 07.00 WIB / 00.00 UTC `0 0 * * *`):
   - Mengirimkan ringkasan pagi ke mahasiswa aktif: tugas yang mendekati tenggat dan kartu flashcard jatuh tempo hari ini.
5. `content_review_digest` (Eksekusi: Harian Pukul 08.00 WIB / 01.00 UTC `0 1 * * *`):
   - Mengirimkan ringkasan harian terpadu ke dosen pengampu yang memiliki draf kartu/naskah menunggu tinjauan kurasi.
6. `skill_request_expire` (Eksekusi: Harian Pukul 09.00 WIB / 02.00 UTC `0 2 * * *`):
   - Menutup permintaan bantuan Tukar Keahlian terbuka yang telah melampaui masa kedaluwarsa (`skill_request_expire_days`, bawaan 14 hari).
7. `recap_generate` (Eksekusi: Harian Pukul 10.00 WIB / 03.00 UTC `0 3 * * *`):
   - Menghasilkan ringkasan `semester_recaps` untuk semester yang telah berakhir pada kelas-kelas yang mengaktifkan fitur.
   - Bersifat idempoten (tidak menduplikasi rekapitulasi yang sudah ada).
   - Mahasiswa dapat memicu pembuatan ulang secara mandiri melalui tombol **Muat Ulang** di tab Rekap Semester (dibatasi 1x per hari).
8. `activity_purge` (Eksekusi: Harian Pukul 11.00 WIB / 04.00 UTC `0 4 * * *`):
   - Menghapus rekaman log aktivitas (`activity_events`) yang telah melampaui masa simpan institusi (`activity_retention_days`, bawaan 365 hari / 1 tahun).
   - Mahasiswa juga memiliki hak hapus mandiri melalui menu **Privasi** > **Hapus Riwayat Aktivitas**.

### 6.4. Batasan Frekuensi Paket Hosting dan Solusi Pengganti (*Fallbacks*)
> [!IMPORTANT]
> **Batasan Layanan Hosting Vercel**:
> - **Vercel Paket Gratis (Hobby)**: Hanya mendukung frekuensi eksekusi cron **maksimal 1 kali per hari** (frekuensi harian). Panggilan berfrekuensi per menit (`* * * * *`) atau per jam (`0 * * * *`) **TIDAK DIDUKUNG** dan deployment akan ditolak atau dilewati.
> - **Vercel Paket Berbayar (Pro / Enterprise)**: Mendukung eksekusi hingga frekuensi **1 kali per menit** (`* * * * *`) untuk seluruh 8 endpoint.

Bila institusi menggunakan paket hosting tanpa dukungan sub-harian (misalnya Vercel Hobby atau hosting statis), gunakan salah satu dari dua solusi pengganti resmi berikut:

#### Opsi 1: Penjadwal Database Eksternal (`pg_cron` Supabase) — Sangat Direkomendasikan
Gunakan ekstensi bawaan PostgreSQL `pg_cron` dan `pg_net` di kluster Supabase untuk memanggil endpoint API secara terjadwal:
```sql
-- 1. Aktifkan ekstensi yang diperlukan
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Jadwalkan antrean AI dan TTS tiap menit
SELECT cron.schedule(
    'siajar_ai_content_jobs',
    '* * * * *',
    $$
    SELECT net.http_get(
        url := 'https://siajar.institution.ac.id/api/cron/ai_content_jobs',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || coalesce(current_setting('app.cron_secret', true), 'RAHASIA_CRON_ANDA')
        )
    );
    $$
);

SELECT cron.schedule(
    'siajar_tts_jobs',
    '* * * * *',
    $$
    SELECT net.http_get(
        url := 'https://siajar.institution.ac.id/api/cron/tts_jobs',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || coalesce(current_setting('app.cron_secret', true), 'RAHASIA_CRON_ANDA')
        )
    );
    $$
);

-- 3. Jadwalkan pemeriksaan konten basi tiap jam
SELECT cron.schedule(
    'siajar_content_stale_check',
    '0 * * * *',
    $$
    SELECT net.http_get(
        url := 'https://siajar.institution.ac.id/api/cron/content_stale_check',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || coalesce(current_setting('app.cron_secret', true), 'RAHASIA_CRON_ANDA')
        )
    );
    $$
);
```

#### Opsi 2: GitHub Actions Scheduled Runner
Buat berkas alur kerja `.github/workflows/cron-peta-pulau.yml` dengan rahasia repositori `CRON_SECRET` dan `SIAJAR_BASE_URL`:
```yaml
name: SIAJAR Peta Pulau Crons
on:
  schedule:
    # Eksekusi antrean setiap 5 menit (batas minimum gratis GitHub Actions)
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  run-crons:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger AI Content Jobs
        run: |
          curl -f -X GET "${{ secrets.SIAJAR_BASE_URL }}/api/cron/ai_content_jobs" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
      - name: Trigger TTS Jobs
        run: |
          curl -f -X GET "${{ secrets.SIAJAR_BASE_URL }}/api/cron/tts_jobs" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### 6.5. Sakelar Penonaktifan Fitur Global (*Kill Switches*)
Super Administrator dapat menonaktifkan fitur secara global tanpa deploy ulang melalui tabel kebijakan institusi (`institution_policies`):
- Mematikan Peta Pulau secara global:
  ```sql
  UPDATE public.institution_policies SET value = 'false'::jsonb WHERE key = 'feature_peta_pulau_enabled';
  ```
- Mematikan Flashcard secara global:
  ```sql
  UPDATE public.institution_policies SET value = 'false'::jsonb WHERE key = 'feature_flashcard_enabled';
  ```
- Mematikan Podcast secara global:
  ```sql
  UPDATE public.institution_policies SET value = 'false'::jsonb WHERE key = 'feature_podcast_enabled';
  ```
- Mematikan Tukar Keahlian secara global:
  ```sql
  UPDATE public.institution_policies SET value = 'false'::jsonb WHERE key = 'feature_tukar_keahlian_enabled';
  ```


