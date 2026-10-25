# Cetak Biru & Diagram Arsitektur Super Lengkap: RuangKampus
**Platform Pembelajaran & Manajemen Akademik Berbasis OBE**  
**Program Studi Teknik Informatika — Universitas Islam Riau**  
*Dokumen Arsitektur Komprehensif · Versi 3.0 · Oktober 2026*

---

## DAFTAR ISI DIAGRAM
1. [Bagian 1: Topologi Infrastruktur & Deployment Cloud](#bagian-1-topologi-infrastruktur--deployment-cloud)
2. [Bagian 2: Arsitektur Perangkat Lunak & Pemisahan Lapisan Domain](#bagian-2-arsitektur-perangkat-lunak--pemisahan-lapisan-domain)
3. [Bagian 3: Protokol Autentikasi Kriptografis, Rate Limiter, & Impersonasi](#bagian-3-protokol-autentikasi-kriptografis-rate-limiter--impersonasi)
4. [Bagian 4: Mesin Presensi Cerdas Geofence GPS (Kampus UIR)](#bagian-4-mesin-presensi-cerdas-geofence-gps-kampus-uir)
5. [Bagian 5: Mesin Ujian CBT Terpadu, Rotasi Token, & Anti-Curang](#bagian-5-mesin-ujian-cbt-terpadu-rotasi-token--anti-curang)
6. [Bagian 6: Mesin Visualisasi 'Kain Semester' & Sistem Peringatan Dini](#bagian-6-mesin-visualisasi-kain-semester--sistem-peringatan-dini)
7. [Bagian 7: Mesin Penilaian OBE (Perhitungan CPMK & CPL)](#bagian-7-mesin-penilaian-obe-perhitungan-cpmk--cpl)
8. [Bagian 8: Relasi Entitas Basis Data Menyeluruh (30+ Model Prisma ERD)](#bagian-8-relasi-entitas-basis-data-menyeluruh-30-model-prisma-erd)
9. [Bagian 9: Matriks Hak Akses & Otorisasi Peran (RBAC Matrix)](#bagian-9-matriks-hak-akses--otorisasi-peran-rbac-matrix)

---

## Bagian 1: Topologi Infrastruktur & Deployment Cloud

Menjelaskan arsitektur infrastruktur fisik dan komputasi awan yang mendasari RuangKampus, dari jaringan tepi (*Edge CDN*), komputasi nirserver (*Serverless Node.js*), hingga kluster basis data terkelola.

```mermaid
flowchart TD
    subgraph Users["Pengguna Akhir (Multi-Device)"]
        MHS["Mahasiswa (Laptop / Smartphone Android / iOS)"]
        DSN["Dosen Pengampu & Pembimbing (Workstation)"]
        ADM["Staf Tendik, Kaprodi & Super Admin (PC Desktop)"]
    end

    subgraph EdgeCDN["Lapisan Jaringan Tepi (Edge Infrastructure)"]
        CF["Cloudflare / Vercel Edge Global Anycast CDN"]
        SSL["Enkripsi TLS 1.3 & Proteksi DDoS"]
        StaticAssets["Asset Statis (/public, Font SF Pro, Media)"]
    end

    subgraph AppCompute["Lapisan Komputasi Aplikasi (Next.js Runtime)"]
        EdgeMW["Edge Middleware (src/middleware.ts)"]
        ServerlessApp["Node.js Serverless Container (Next.js 14/15)"]
        CronRunner["Background Cron Scheduler (/api/cron/*)"]
    end

    subgraph DatabaseCluster["Lapisan Data Terkelola (Supabase & PostgreSQL)"]
        PgBouncer["PgBouncer Connection Pooling (Port 6543)"]
        PostgresPrimary[("PostgreSQL 15+ Enterprise Instance")]
        S3Storage["Supabase Storage (Bukti Presensi, Draf Tugas, PDF KHS)"]
        SupabaseAuthService["Supabase GoTrue Identity Service"]
    end

    subgraph IntegrationServices["Layanan Pihak Ketiga & Akademik Eksternal"]
        SIAKAD_UIR["SIAKAD UIR API Sync Engine"]
        LLM_Engine["Google Gemini AI / AI Academic Assistant"]
        CodeJudge["Sandbox Code Execution Engine (Judge0)"]
    end

    MHS --> CF
    DSN --> CF
    ADM --> CF

    CF --> SSL
    SSL --> StaticAssets
    SSL --> EdgeMW

    EdgeMW --> ServerlessApp
    ServerlessApp --> CronRunner

    ServerlessApp --> PgBouncer
    ServerlessApp --> SupabaseAuthService
    ServerlessApp --> S3Storage

    PgBouncer --> PostgresPrimary

    ServerlessApp -.-> SIAKAD_UIR
    ServerlessApp -.-> LLM_Engine
    ServerlessApp -.-> CodeJudge
```

---

## Bagian 2: Arsitektur Perangkat Lunak & Pemisahan Lapisan Domain

Memperlihatkan arsitektur modular internal aplikasi dengan batas pemisahan tanggung jawab (*Separation of Concerns*) yang tegas antara UI, Domain Actions, Fitur, dan Kernel Lib.

```mermaid
flowchart TD
    subgraph UI_Layer["1. Lapisan Antarmuka & Presentasi (src/app)"]
        direction TB
        AuthRoutes["(auth) -> /login, /workspace, /reset-password"]
        PortalShellView["(portal) -> PortalShell & Sub-Portal Peran"]
        
        Sub_Student["/student (Portal Mahasiswa)"]
        Sub_Lecturer["/lecturer (Portal Dosen)"]
        Sub_TA["/ta (Portal Asisten Dosen)"]
        Sub_Coord["/coordinator (Portal Kaprodi)"]
        Sub_Staff["/staff (Portal Staf Akademik)"]
        Sub_Admin["/admin (Portal Administrator)"]
        
        GlobalErr["src/app/error.tsx (Crash Recovery)"]
        Global404["src/app/(portal)/not-found.tsx (404 Handler)"]
    end

    subgraph Shell_Components["2. Pustaka Komponen UI Terpadu (src/components)"]
        direction TB
        SharedComponents["shared/ (PortalShell, CommandCenterOS, AiAcademicAssistant)"]
        UiPrimitives["ui/ (TechBackground, Button, Card, Badge, Dialog)"]
        RetroComponents["retro/ (WindowTrafficLights, IdentityCard, Scanlines)"]
    end

    subgraph Domain_Modules["3. Modul Logika Bisnis & Server Actions (src/modules)"]
        direction TB
        ModIdentity["identity/ (loginAction, impersonate, switchRole)"]
        ModAcademic["academic/ (kainSemester, presensi, nilai, krs)"]
        ModAdmin["admin/ (masterData, systemPolicies, userRoles)"]
        ModEarlyWarning["early-warning/ (attendanceThresholdCheck)"]
        ModRequests["requests/ (suratPengantar, legalisasiIjazah)"]
    end

    subgraph Features_Layer["4. Fitur Modular Perkuliahan (src/features)"]
        direction TB
        FeatPresensi["presensi/ (GPS Geofencing, Rekap Mahasiswa)"]
        FeatNilai["nilai/ (Rubrik Penilaian, Konversi Mutu, KHS)"]
        FeatKrs["krs/ (Paket Semester, Validasi Kuota, Approval Wali)"]
        FeatMateriTugas["materi-tugas/ (Bahan Ajar, Upload Jawaban)"]
        FeatUjian["ujian/ (CBT Engine, Bank Soal, Anti-Curang)"]
    end

    subgraph Core_Kernel["5. Kernel Sistem & Utilitas Platform (src/lib)"]
        direction TB
        LibDb["db/ (Prisma Client Singleton & Seed Registry)"]
        LibAuth["auth/ (Session Management, Crypto Token Signer)"]
        LibAudit["audit/ (Audit Trail Logger Tamper-Proof)"]
        LibPdf["pdf/ (Generator Transkrip KHS, Kartu Ujian, Surat)"]
        LibAi["ai/ (Academic Assistant RAG & Prompt Template)"]
    end

    UI_Layer --> Shell_Components
    UI_Layer --> Domain_Modules
    Domain_Modules --> Features_Layer
    Features_Layer --> Core_Kernel
    Domain_Modules --> Core_Kernel

    PortalShellView --> Sub_Student
    PortalShellView --> Sub_Lecturer
    PortalShellView --> Sub_TA
    PortalShellView --> Sub_Coord
    PortalShellView --> Sub_Staff
    PortalShellView --> Sub_Admin

    UI_Layer -.-> GlobalErr
    UI_Layer -.-> Global404
```

---

## Bagian 3: Protokol Autentikasi Kriptografis, Rate Limiter, & Impersonasi

Diagram interaksi mendalam mengenai pengamanan gerbang masuk sistem terhadap serangan *brute force*, mitigasi akun terkunci, serta protokol impersonasi berbasis *Signed Token*.

```mermaid
sequenceDiagram
    autonumber
    actor User as Klien Peramban
    participant MW as Edge Middleware
    participant Form as Halaman Login
    participant RateLimiter as In-Memory / Redis Limiter
    participant Action as loginAction (Identity Module)
    participant Supabase as Supabase Auth (GoTrue)
    participant DB as PostgreSQL (Prisma ORM)
    participant Audit as LogAudit System

    User->>MW: Mengakses /login
    MW-->>User: Kirim Formulir Login Minimalis

    User->>Form: Input Identitas (NIM/NIDN/NIP) & Password
    Form->>Action: Eksekusi loginAction({ identifier, password })
    
    Action->>RateLimiter: Periksa IP (Maks 10 req/menit)
    alt IP Terkena Rate Limit
        RateLimiter-->>Action: Ditolak (IP Terblokir)
        Action-->>User: Tampilkan Error HTTP 429
    else IP Aman
        Action->>RateLimiter: Periksa Percobaan Gagal Identifier
        alt Gagal >= 5 Kali Berturut-turut
            RateLimiter-->>Action: Ditolak (Account Lockout)
            Action-->>User: Akun Terkunci Sementara 15 Menit
        else Status Akun Normal
            Action->>Supabase: Verifikasi Password via Hash bcrypt/argon2
            alt Password Salah
                Supabase-->>Action: Kredensial Tidak Valid
                Action->>RateLimiter: Tambah Counter Percobaan Gagal
                Action->>Audit: Catat Log 'LOGIN_FAILED'
                Action-->>User: Animasi Getar + Pesan Kredensial Salah
            else Password Benar
                Supabase-->>Action: Token Sesi Berhasil Diterbitkan
                Action->>RateLimiter: Reset Counter Gagal Menjadi 0
                Action->>DB: Query Tabel Pengguna, Mahasiswa/Dosen, & Role
                DB-->>Action: Profil Pengguna & Daftar Peran (STUDENT, LECTURER, dll.)
                
                opt Skenario Impersonasi oleh Super Admin
                    Action->>Action: Verifikasi Signature HMAC-SHA256 Token Asli Admin
                    Action->>Audit: Rekam Entri 'START_IMPERSONATION' (ID Admin -> ID Target)
                end

                Action->>Action: Pasang Cookie Sesi HTTP-Only, Secure, SameSite=Lax
                Action->>Audit: Catat Log 'LOGIN_SUCCESS'
                Action-->>User: HTTP 200 (Redirect ke URL Ruang Kerja Sesuai Peran)
            end
        end
    end
```

---

## Bagian 4: Mesin Presensi Cerdas Geofence GPS (Kampus UIR)

Memvisualisasikan alur verifikasi posisi geospasial mahasiswa saat perkuliahan luring berlangsung, memastikan kehadiran hanya dapat dilakukan di dalam radius toleransi Gedung D Fakultas Teknik UIR.

```mermaid
flowchart LR
    Start(["Mahasiswa Buka Menu Presensi"]) --> GetGeo["Akses Geolocation API Peramban"]
    GetGeo --> AccuracyCheck{"Akurasi GPS <= 20 Meter?"}
    
    AccuracyCheck -- "Tidak (Sinyal Buruk)" --> RetryGPS["Minta Mahasiswa Berpindah ke Area Terbuka"]
    RetryGPS --> GetGeo
    
    AccuracyCheck -- "Ya (Akurasi Baik)" --> MockCheck{"Deteksi Fake GPS / Emulator?"}
    
    MockCheck -- "Terdeteksi Mock" --> FlagCheat["Tolak Presensi & Catat Dugaan Kecurangan"]
    FlagCheat --> StopReject(["Presensi Dibatalkan"])
    
    MockCheck -- "Bersih (Perangkat Asli)" --> CalcHaversine["Kalkulasi Jarak Formula Haversine"]
    
    subgraph GeoCalculation["Kalkulasi Geospasial Gedung D FT UIR"]
        TargetCoord["Titik Pusat: Lat 0.495... Long 101.45..."]
        CalcHaversine --> CompareRadius{"Jarak Mahasiswa <= 50 Meter?"}
    end
    
    CompareRadius -- "Di Luar Radius (> 50m)" --> OutOfRange["Tampilkan Peta: Anda di Luar Jangkauan Kampus"]
    OutOfRange --> StopReject
    
    CompareRadius -- "Dalam Radius (<= 50m)" --> TimeCheck{"Sesi Perkuliahan Masih Terbuka?"}
    
    TimeCheck -- "Sesi Ditutup Dosen" --> SessionExpired["Pemberitahuan: Waktu Presensi Telah Berakhir"]
    SessionExpired --> StopReject
    
    TimeCheck -- "Sesi Terbuka" --> SaveAttendance["Simpan Kehadiran ke Database Prisma"]
    
    SaveAttendance --> DB_Record[("Tabel Presensi:\nStatus = HADIR\nRadius = X meter\nTerverifikasi = TRUE\nWaktu = Timestamp")]
    
    DB_Record --> UpdateKain["Perbarui Status Pekan pada 'Kain Semester'"]
    UpdateKain --> Success(["Presensi Terverifikasi Sukses"])
```

---

## Bagian 5: Mesin Ujian CBT Terpadu, Rotasi Token, & Anti-Curang

Menjelaskan protokol pelaksanaan ujian terkomputerisasi (*Computer-Based Test*) yang menjaga integritas akademik mahasiswa dari kecurangan digital.

```mermaid
sequenceDiagram
    autonumber
    actor Mhs as Mahasiswa Ujian
    participant ExamUI as Antarmuka CBT (/exams/[id])
    participant Monitor as Anti-Cheat Monitor (Client Listener)
    participant Action as submitExamAnswer (Server Action)
    participant TokenService as ExamTokenRotator (Cron API)
    participant DB as Basis Data Ujian

    Note over Mhs,ExamUI: Fase Memasuki Ruang Ujian
    Mhs->>ExamUI: Masukkan Token Ujian dari Pengawas
    ExamUI->>TokenService: Verifikasi Token Aktif
    TokenService-->>ExamUI: Token Valid (Masa Berlaku 15 Menit)
    
    ExamUI->>Monitor: Kunci Layar Penuh (Request Fullscreen API)
    ExamUI->>Monitor: Aktifkan Window Blur, VisibilityChange & Copy-Paste Blocker
    
    Note over Mhs,ExamUI: Fase Pengerjaan & Pengawasan Real-Time
    loop Setiap Menjawab Butir Soal
        Mhs->>ExamUI: Pilih Jawaban / Tulis Jawaban Esai
        ExamUI->>Action: Autosave Jawaban Terenkripsi (Debounced 500ms)
        Action->>DB: Upsert Jawaban Mahasiswa
    end

    alt Mahasiswa Berpindah Tab / Membuka Aplikasi Lain
        Monitor->>ExamUI: Terdeteksi Event 'blur' / 'visibilitychange=hidden'
        ExamUI->>Action: Kirim Log Pelanggaran (Violation Count + 1)
        Action->>DB: Catat Pelanggaran ke Tabel UjianPeserta
        
        alt Jumlah Pelanggaran < 3 Kali
            ExamUI-->>Mhs: Peringatan Keras: "Dilarang Meninggalkan Halaman Ujian!"
        else Jumlah Pelanggaran >= 3 Kali
            ExamUI->>Action: Kunci Lembar Ujian Secara Paksa (Force Submit)
            Action->>DB: Status Ujian = 'DISQUALIFIED_CHEATING'
            ExamUI-->>Mhs: Ujian Dibatalkan Karena Pelanggaran Integritas
        end
    end

    Note over Mhs,ExamUI: Fase Penyelesaian Ujian
    Mhs->>ExamUI: Klik 'Selesai Ujian' / Waktu Habis Otomatis
    ExamUI->>Action: Finalisasi Ujian (Lock Attempt)
    Action->>DB: Hitung Nilai Soal Objektif Otomatis
    Action-->>Mhs: Tampilkan Bukti Pengumpulan Ujian Selesai
```

---

## Bagian 6: Mesin Visualisasi 'Kain Semester' & Sistem Peringatan Dini

State diagram yang mengatur siklus hidup tiap sel status pada kisi matriks akademik 16 pekan untuk seluruh mata kuliah yang diambil mahasiswa.

```mermaid
stateDiagram-v2
    [*] --> BelumBerjalan: Awal Semester (Pekan 1-16 Dibuat)

    state BelumBerjalan {
        [*] --> SelKosong: Kotak Abu-abu [ ]
    }

    BelumBerjalan --> PekanAktif: Waktu Masuk ke Pekan Berjalan (Misal Pekan 9)
    
    state PekanAktif {
        [*] --> MenungguKehadiran
        MenungguKehadiran --> HadirTanpaTugas: Mahasiswa Presensi GPS
        MenungguKehadiran --> TidakHadir: Batas Waktu Kuliah Habis Tanpa Presensi
        
        HadirTanpaTugas --> LengkapSempurna: Mahasiswa Mengunggah Tugas Sebelum Tenggat
        HadirTanpaTugas --> HadirTugasTertunda: Ada Tugas Belum Diunggah
        TidakHadir --> Terlewat: Ikon Lingkaran Merah (Alpa)
    }

    state VisualisasiSimbolKain {
        LengkapSempurna --> SimbolHitamPenuh: Simbol Kotak Hitam Padat (■)
        HadirTugasTertunda --> SimbolSeparuh: Simbol Kotak Separuh (◧)
        Terlewat --> SimbolLingkaran: Simbol Lingkaran (○)
    }

    state EarlyWarningSystem {
        Terlewat --> EvaluasiAmbangBatas: Hitung Total Ketidakhadiran
        EvaluasiAmbangBatas --> PeringatanDiniLevel1: Ketidakhadiran = 2 Kali (Kuning)
        EvaluasiAmbangBatas --> PeringatanDiniKritis: Ketidakhadiran >= 3 Kali (Merah)
        
        PeringatanDiniKritis --> NotifikasiDosenWali: Kirim Notifikasi ke Dosen Pembimbing Akademik
        PeringatanDiniKritis --> KunciUjian: Status Tidak Memenuhi Syarat Mengikuti UAS (< 75%)
    }

    PekanAktif --> SelesaiPekan: Berganti ke Pekan Berikutnya
    SelesaiPekan --> [*]: Pekan 16 Selesai
```

---

## Bagian 7: Mesin Penilaian OBE (Perhitungan CPMK & CPL)

Diagram alur yang memperlihatkan bagaimana evaluasi pembelajaran berbasis luaran dihitung dari bobot rubrik tugas, dipetakan ke CPMK, diagregasi ke CPL prodi, hingga pembentukan KHS.

```mermaid
flowchart TD
    subgraph DosenInput["1. Penetapan Asesmen oleh Dosen Pengampu"]
        R_Tugas["Rubrik Tugas (20%) -> Mengukur CPMK-1"]
        R_Kuis["Rubrik Kuis (15%) -> Mengukur CPMK-2"]
        R_Prak["Praktikum (25%) -> Mengukur CPMK-3"]
        R_UTS["Ujian Tengah Semester (20%) -> Mengukur CPMK-1 & CPMK-2"]
        R_UAS["Ujian Akhir Semester (20%) -> Mengukur CPMK-3 & CPMK-4"]
    end

    subgraph MahasiswaScore["2. Nilai Mentah Mahasiswa"]
        ScoreTugas["Skor Tugas: 90"]
        ScoreKuis["Skor Kuis: 85"]
        ScorePrak["Skor Praktikum: 95"]
        ScoreUTS["Skor UTS: 80"]
        ScoreUAS["Skor UAS: 88"]
    end

    R_Tugas --> ScoreTugas
    R_Kuis --> ScoreKuis
    R_Prak --> ScorePrak
    R_UTS --> ScoreUTS
    R_UAS --> ScoreUAS

    subgraph ObeEngine["3. Engine Perhitungan CPMK (src/features/nilai)"]
        CalcCPMK1["CPMK-1: (Tugas*0.5 + UTS*0.5) = 85.0 (Tinggi)"]
        CalcCPMK2["CPMK-2: (Kuis*0.4 + UTS*0.6) = 82.0 (Tinggi)"]
        CalcCPMK3["CPMK-3: (Prak*0.5 + UAS*0.5) = 91.5 (Sangat Tinggi)"]
        CalcCPMK4["CPMK-4: (UAS*1.0) = 88.0 (Tinggi)"]
    end

    ScoreTugas --> CalcCPMK1
    ScoreUTS --> CalcCPMK1
    ScoreKuis --> CalcCPMK2
    ScoreUTS --> CalcCPMK2
    ScorePrak --> CalcCPMK3
    ScoreUAS --> CalcCPMK3
    ScoreUAS --> CalcCPMK4

    subgraph AggregateCPL["4. Agregasi Capaian Pembelajaran Lulusan (CPL Prodi)"]
        CPL_Sikap["CPL-1 (Sikap & Etika Profesional): 90% Terpenuhi"]
        CPL_Pengetahuan["CPL-2 (Penguasaan Konsep Komputasi): 85% Terpenuhi"]
        CPL_Keterampilan["CPL-3 (Implementasi Rekayasa Perangkat Lunak): 92% Terpenuhi"]
    end

    CalcCPMK1 --> CPL_Pengetahuan
    CalcCPMK2 --> CPL_Pengetahuan
    CalcCPMK3 --> CPL_Keterampilan
    CalcCPMK4 --> CPL_Keterampilan
    CalcCPMK1 --> CPL_Sikap

    subgraph FinalGrade["5. Konversi Huruf Mutu & Publikasi KHS"]
        TotalAngka["Total Nilai Akhir: 88.35"]
        TotalHuruf["Huruf Mutu: A (Bobot 4.00)"]
        PublishKHS["Terbitkan Transkrip Semester Mahasiswa"]
    end

    CalcCPMK1 & CalcCPMK2 & CalcCPMK3 & CalcCPMK4 --> TotalAngka
    TotalAngka --> TotalHuruf
    TotalHuruf --> PublishKHS
```

---

## Bagian 8: Relasi Entitas Basis Data Menyeluruh (30+ Model Prisma ERD)

Skema relasional lengkap yang merefleksikan seluruh model entitas pada berkas `prisma/schema.prisma`.

```mermaid
erDiagram
    Pengguna ||--o{ Mahasiswa : "profil mahasiswa"
    Pengguna ||--o{ Dosen : "profil dosen"
    Pengguna ||--o{ LogAudit : "mencatat log"
    Pengguna ||--o{ Notifikasi : "menerima"
    Pengguna ||--o{ PreferensiNotifikasi : "mengatur"
    Pengguna ||--o{ PerangkatLogin : "mengotorisasi"

    ProgramStudi ||--o{ Mahasiswa : "membina"
    ProgramStudi ||--o{ Dosen : "homebase"
    ProgramStudi ||--o{ MataKuliah : "kurikulum"

    MataKuliah ||--o{ PrasyaratMataKuliah : "memiliki syarat"
    MataKuliah ||--o{ Kelas : "dibuka dalam"

    TahunAjaran ||--o{ Kelas : "berjalan di"
    Ruang ||--o{ JadwalKuliah : "menampung"
    Dosen ||--o{ Kelas : "dosen pengampu"
    Dosen ||--o{ BimbinganWali : "dosen pembimbing"

    Kelas ||--o{ JadwalKuliah : "memiliki waktu"
    Kelas ||--o{ KRSDetail : "diambil via"
    Kelas ||--o{ Pertemuan : "16 pertemuan"
    Kelas ||--o{ KomponenNilai : "rubrik nilai"
    Kelas ||--o{ Materi : "modul ajar"
    Kelas ||--o{ Tugas : "evaluasi tugas"
    Kelas ||--o{ Ujian : "jadwal cbt"

    Mahasiswa ||--o{ KRS : "mengisi rencana"
    Mahasiswa ||--o{ BimbinganWali : "bimbingan"
    Mahasiswa ||--o{ Tagihan : "membayar ukt"
    Mahasiswa ||--o{ PengajuanSurat : "mengajukan berkas"
    Mahasiswa ||--o{ PengumumanDibaca : "riwayat baca"

    KRS ||--o{ KRSDetail : "memuat mk"
    KRSDetail ||--o{ Nilai : "menghasilkan nilai"

    Pertemuan ||--o{ Presensi : "absensi mahasiswa"
    Mahasiswa ||--o{ Presensi : "diverifikasi"

    KomponenNilai ||--o{ Nilai : "menentukan bobot"

    Materi ||--o{ MateriProgres : "dilacak"
    Mahasiswa ||--o{ MateriProgres : "membaca"

    Tugas ||--o{ PengumpulanTugas : "mengumpulkan"
    Mahasiswa ||--o{ PengumpulanTugas : "mengunggah"

    Pengumuman ||--o{ PengumumanDibaca : "dibaca oleh"

    Pengguna {
        string id PK
        string email UK
        string peran
        string status
        datetime created_at
    }

    Mahasiswa {
        string id PK
        string nim UK
        string nama
        string prodi_id FK
        float ipk
        int total_sks
    }

    Dosen {
        string id PK
        string nidn UK
        string nama
        string prodi_id FK
    }

    Kelas {
        string id PK
        string kode_kelas
        string mata_kuliah_id FK
        string dosen_id FK
        string tahun_ajaran_id FK
    }

    Pertemuan {
        string id PK
        string kelas_id FK
        int pertemuan_ke
        string materi_pokok
        datetime tanggal
    }

    Presensi {
        string id PK
        string pertemuan_id FK
        string mahasiswa_id FK
        string status
        float radius_meter
        boolean terverifikasi_gps
    }

    Nilai {
        string id PK
        string krs_detail_id FK
        string komponen_id FK
        float skor_angka
        string cpmk_kode
    }

    Tugas {
        string id PK
        string kelas_id FK
        string judul
        datetime tenggat_waktu
    }

    PengumpulanTugas {
        string id PK
        string tugas_id FK
        string mahasiswa_id FK
        string file_url
        float nilai_skor
    }

    Ujian {
        string id PK
        string kelas_id FK
        string jenis_ujian
        string token_rahasia
        datetime waktu_mulai
        datetime waktu_selesai
    }
```

---

## Bagian 9: Matriks Hak Akses & Otorisasi Peran (RBAC Matrix)

Tabel pemetaan hak akses fungsionalitas di seluruh portal untuk keenam peran pengguna sistem:

| Fitur / Sub-Sistem | Mahasiswa | Dosen | Asisten Dosen | Kaprodi | Staf Akademik | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Kain Semester (Kisi 16 Pekan)** | Baca Sendiri | Baca Kelas Binaan | Baca Kelas Asistensi | Rekap Prodi | - | Audit Semua |
| **Presensi GPS (Kirim Kehadiran)** | Buat (GPS Verify) | - | - | - | - | - |
| **Buka/Tutup Sesi Presensi** | - | Penuh | Buka Sesi Saja | Pantau | - | Penuh |
| **Penyusunan Rubrik OBE (CPMK)** | - | Penuh | Baca Saja | Verifikasi & Validasi | - | Konfigurasi |
| **Input & Perubahan Nilai Mutu** | - | Penuh (Pra-Kunci) | Draf Skor Tugas | Pengesahan KHS | Cetak Transkrip | Buka Kunci Khusus |
| **Penyelenggaraan Ujian CBT** | Kerjakan (Anti-Cheat) | Buat Bank Soal | Pantau / Monitor | Pantau Hasil | Cetak Berita Acara | Reset Token |
| **Pengajuan & Approval KRS** | Buat & Ajukan | Verifikasi Dosen Wali | - | Kuota & Evaluasi | Ekspor SIAKAD | Override Kuota |
| **Impersonasi Akun Pengguna** | - | - | - | - | - | Penuh (Signed Audit) |
| **Audit Trail & System Logs** | - | - | - | Log Prodi | Log Surat/KRS | Penuh (Tamper-Proof) |

---

### Verifikasi Kepatuhan Desain & Teknis
- **Tipografi**: Seluruh antarmuka portal wajib menggunakan font keluarga **Apple SF Pro** (`font-weight: 600` untuk teks isi, `font-weight: 800` untuk heading).
- **Palet Warna**: Seluruh warna dibatasi pada palet identitas resmi kampus (Terracotta `#C2553A`, Dark Terracotta `#853827`, Paper Ivory `#FAF8F5`, dan Charcoal Obsidian `#1C1917` / `#000000`).
- **Validasi Otomatis**: Diverifikasi oleh `scripts/cek-hex.js` dan kompilasi bebas galat TypeScript `tsc --noEmit`.
