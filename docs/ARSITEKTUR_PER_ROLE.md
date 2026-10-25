# Dokumentasi Arsitektur Super Lengkap per Peran (Aktor)
**RuangKampus — Sistem Pembelajaran & Manajemen Akademik Berbasis OBE**  
**Program Studi Teknik Informatika · Universitas Islam Riau**

---

## 1. Arsitektur Peran Mahasiswa (`STUDENT`)

### A. Filosofi & Batasan Peran
Peran Mahasiswa dirancang dengan prinsip **fokus belajar tanpa friksi administratif (*frictionless academic cockpit*)**. Mahasiswa memiliki akses baca ke seluruh materi dan kurikulum yang diambil, hak unggah tugas dan ujian, serta verifikasi presensi mandiri berbasis lokasi. Mahasiswa **diisolasi secara ketat** oleh RLS (*Row-Level Security*) dan kueri terfilter Prisma sehingga tidak dapat melihat data nilai, draf soal, atau berkas pribadi mahasiswa lain.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/student`
- **Grup Menu**:
  1. **Utama**: Beranda (`/student`), Kalender (`/calendar`), Notifikasi (`/notifications`), Pengumuman (`/announcements`)
  2. **Belajar**: Kelas Saya (`/classes`), Ujian (`/exams`), Perpustakaan Digital (`/library`), Tanya AI (`/ai-assistant`), Pesan Kuliah (`/messages`), Flashcard Materi (`/flashcards`), Tukar Keahlian (`/skill-exchange`)
  3. **Nilai**: Nilai Saya & Transkrip (`/grades`), Pencapaian / Badge OBE (`/achievements`), Sertifikat Kompetensi (`/certificates`)
  4. **Lainnya**: Komunitas Mahasiswa (`/community`), Evaluasi Kinerja Dosen (`/evaluations`), Pengajuan Surat & Legalisasi (`/requests`)

### C. Alur Data & Siklus Belajar Mahasiswa
```mermaid
flowchart LR
    subgraph SesiKuliah["1. Sesi Perkuliahan Mingguan"]
        Geo["Deteksi Geolocation API"] --> Calc["Formula Haversine (<= 50m)"]
        Calc --> AbsenOK["Tabel Presensi (HADIR)"]
    end

    subgraph AksesMateri["2. Ruang Kelas Interaktif"]
        AbsenOK --> UnduhMateri["Membaca Materi PDF/Video"]
        UnduhMateri --> UnggahTugas["Unggah Draf Tugas/Praktikum"]
        UnggahTugas --> S3Bucket["Supabase Storage (PDF/ZIP)"]
    end

    subgraph EvaluasiCBT["3. Evaluasi Ujian & Kuis"]
        UnggahTugas --> UjianCBT["CBT Interface (/exams)"]
        UjianCBT --> Lock["Fullscreen & Window Blur Monitor"]
        Lock --> Nilai["Tabel Nilai & Ketercapaian CPMK"]
    end

    subgraph VisualisasiKain["4. Agregasi Dashboard"]
        Nilai --> Grid16["Kain Semester: Kisi 16 Pekan"]
    end
```

### D. Fitur Teknis Kunci Mahasiswa
1. **Mesin Kisi 'Kain Semester'**:
   - Menghitung status 16 kolom pekan untuk setiap mata kuliah yang tercantum pada tabel `KRSDetail`.
   - Kode sel: `■` (Presensi Lengkap + Tugas Terkumpul), `◧` (Presensi Lengkap, tugas belum masuk), `○` (Alpa / Terlewat), `[ ]` (Pekan berjalan).
2. **Sistem Peringatan Dini (*Early Warning System*)**:
   - Algoritma pemicu: Jika ketidakhadiran mencapai $\ge 3$ kali atau persentase kehadiran $< 75\%$, sistem mengunci hak ujian secara otomatis dan mengirim peringatan ke Dosen Wali.

---

## 2. Arsitektur Peran Dosen Pengampu (`LECTURER`)

### A. Filosofi & Batasan Peran
Dosen bertindak sebagai **manajer instruksional dan evaluator luaran pembelajaran (*Instructional Manager & OBE Assessor*)**. Dosen memiliki hak penuh untuk mengelola modul ajar, membuka sesi presensi, menyusun instrumen rubrik penilaian, dan memvalidasi kelulusan CPMK. Akses dibatasi pada kelas-kelas yang resmi ditugaskan oleh program studi pada semester berjalan.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/lecturer`
- **Grup Menu**:
  1. **Utama**: Beranda Dosen (`/lecturer`), Kalender, Notifikasi, Pengumuman
  2. **Mengajar**: Kelas Saya (`/classes`), Berita Acara Kuliah (`/lecturer/journals`), Tinjau Konten Modul (`/lecturer/content-review`), Perpustakaan (`/library`)
  3. **Ujian dan Nilai**: Ujian dan Kuis (`/exams`), Bank Soal Mandiri (`/exams/question-bank`), Periksa Jawaban Esai (`/exams/review`), Analisis Butir Soal (`/exams/analysis`), Rubrik CPMK (`/lecturer/rubrics`), Buku Nilai Komprehensif (`/analytics`), Penanganan Sanggahan Nilai (`/lecturer/disputes`)
  4. **Lainnya**: Pesan Mahasiswa (`/messages`), Mahasiswa Bimbingan Akademik (`/lecturer/mentoring`), Hasil Evaluasi Dosen (`/lecturer/evaluations`), Komunitas Riset (`/community`)

### C. Alur Kerja Evaluasi OBE Dosen
```mermaid
sequenceDiagram
    autonumber
    actor Dsn as Dosen Pengampu
    participant UI as Portal Dosen (/lecturer)
    participant Rubrik as Engine Rubrik (src/features/nilai)
    participant DB as Basis Data PostgreSQL
    participant Mhs as Mahasiswa

    Dsn->>UI: Definisikan Bobot Asesmen (Tugas 20%, Prak 25%, UTS 25%, UAS 30%)
    UI->>Rubrik: Petakan Komponen ke CPMK-1, CPMK-2, CPMK-3
    Rubrik->>DB: Simpan ke Tabel KomponenNilai

    Dsn->>UI: Buka Sesi Presensi (Set Titik Koordinat & Waktu 90 Menit)
    UI->>DB: Terbitkan Pertemuan Baru (Status = OPEN)

    Mhs->>DB: Melakukan Presensi & Mengunggah Tugas
    
    Dsn->>UI: Buka Menu Periksa Jawaban
    Dsn->>UI: Input Skor Berdasarkan Rubrik Skala 0-100
    UI->>DB: Simpan Nilai & Kalkulasi Ketercapaian CPMK Otomatis
    UI-->>Dsn: Tampilkan Visualisasi Ketercapaian Kelas (Diagram Sebaran)
```

### D. Fitur Teknis Kunci Dosen
1. **Manajemen Geofencing Presensi**:
   - Dosen mengendalikan status pembukaan sesi. Koordinat geospasial Gedung D FT UIR di-*cache* untuk verifikasi jarak mahasiswa secara instan.
2. **Kalkulator Mutu Huruf Otomatis**:
   - Mengonversi nilai akumulatif menjadi standar UIR: $\ge 85 \rightarrow \text{A}$, $80-84 \rightarrow \text{A-}$, $75-79 \rightarrow \text{B+}$, $70-74 \rightarrow \text{B}$, dst.

---

## 3. Arsitektur Peran Asisten Dosen (`TEACHING_ASSISTANT`)

### A. Filosofi & Batasan Peran
Peran Asisten Dosen / Asisten Laboratorium adalah **peran hibrida terdelegasi (*Delegated Hybrid Role*)**. Pengguna adalah mahasiswa aktif yang diberikan otoritas operasional tambahan oleh Dosen Pengampu untuk mengawal praktikum dan pengawasan ujian tanpa hak mengubah kebijakan kurikulum atau menerbitkan nilai akhir secara sepihak.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/ta`
- **Grup Menu**:
  1. **Utama**: Beranda Asisten (`/ta`), Kalender, Notifikasi, Pengumuman
  2. **Asistensi Khusus**: Kelas Asistensi (`/ta/classes`), Koreksi Draf Praktikum (`/ta/grading`), Pantau Ujian CBT Anti-Curang (`/ta/exam-monitor`)
  3. **Belajar & Nilai**: Mewarisi seluruh akses pembelajaran mahasiswa aktif

### C. Alur Kerja Pengawasan Ujian & Koreksi Praktikum
```mermaid
flowchart TD
    subgraph LiveProctoring["Live Proctoring CBT (/ta/exam-monitor)"]
        Stream["SSE / WebSocket Polling Peserta Ujian"] --> Detection{"Deteksi Anomali"}
        Detection -- "Pindah Tab / Minimize" --> ViolationLog["Catat Pelanggaran (Event Blur)"]
        ViolationLog --> AlertTA["Tampilkan Indikator Merah di Monitor Asisten"]
        AlertTA --> WarningAction["Kirim Peringatan Langsung ke Layar Mahasiswa"]
    end

    subgraph LabGrading["Koreksi Laporan Praktikum (/ta/grading)"]
        Submissions["Daftar Laporan Praktikum Masuk"] --> ReviewPDF["Buka Dokumen di In-Browser Reader"]
        ReviewPDF --> DraftScore["Beri Skor Draf & Catatan Evaluasi"]
        DraftScore --> LecturerApproval["Kirim ke Dosen Pengampu untuk Disahkan"]
    end
```

---

## 4. Arsitektur Peran Koordinator Program Studi (`PROGRAM_COORDINATOR`)

### A. Filosofi & Batasan Peran
Kaprodi bertindak sebagai **penjamin mutu kurikulum dan pengawas capaian lulusan (*Curriculum Quality & CPL Assurance Officer*)**. Kaprodi memiliki visibilitas makro terhadap seluruh kelas, persebaran beban mengajar dosen, pemetaan prasyarat mata kuliah, dan audit ketercapaian akreditasi internasional (IABEE/OBE).

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/coordinator`
- **Grup Menu**:
  1. **Utama**: Beranda Kaprodi (`/coordinator`), Kalender, Notifikasi, Pengumuman
  2. **Prodi**: Manajemen Kurikulum OBE (`/coordinator/curriculum`), Direktori Mata Kuliah & Prasyarat (`/coordinator/courses`), Distribusi Penugasan Dosen (`/coordinator/assignments`), Hasil Evaluasi Dosen oleh Mahasiswa (`/coordinator/evaluations`)
  3. **Pantauan**: Monitoring Perkuliahan Real-Time (`/coordinator/monitoring`), Analisis Mahasiswa Berisiko Drop-Out (`/coordinator/monitoring/at-risk`)
  4. **Persetujuan**: Validasi & Pengesahan Nilai KHS (`/coordinator/approvals`), Laporan Kinerja Akademik Prodi (`/coordinator/reports`)

### C. Mesin Agregasi Radar CPL Kaprodi
```mermaid
flowchart LR
    KelasAll["Seluruh Kelas Semester Aktif"] --> CPMK_Scores["Kompilasi Skor CPMK Seluruh Mahasiswa"]
    
    subgraph MatrixMapping["Matriks Pemetaan Kurikulum"]
        CPMK_Scores --> CPL1["CPL-1: Kemampuan Sains & Komputasi Dasar"]
        CPMK_Scores --> CPL2["CPL-2: Perancangan Perangkat Lunak Modern"]
        CPMK_Scores --> CPL3["CPL-3: Komunikasi & Etika Profesional"]
        CPMK_Scores --> CPL4["CPL-4: Pembelajaran Mandiri Sepanjang Hayat"]
    end

    CPL1 & CPL2 & CPL3 & CPL4 --> RadarChart["Rendering Grafik Radar Ketercapaian CPL Angkatan"]
    RadarChart --> ExportAkreditasi["Laporan Evaluasi Diri Akreditasi (PDF/Excel)"]
```

---

## 5. Arsitektur Peran Staf Administrasi Akademik (`ACADEMIC_STAFF`)

### A. Filosofi & Batasan Peran
Staf Akademik bertindak sebagai **pengendali data operasional dan layanan dokumen legal (*Operational Logistics & Academic Registrar*)**. Tanggung jawab utamanya mencakup penjadwalan ruang bebas konflik, penerbitan transkrip/KHS resmi, verifikasi kelayakan KRS, dan administrasi surat-menyurat mahasiswa.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/staff`
- **Grup Menu**:
  1. **Utama**: Beranda Staf (`/staff`), Kalender Akademik, Notifikasi
  2. **Data Induk**: Master Mahasiswa (`/staff/master/students`), Master Dosen (`/staff/master/lecturers`), Konfigurasi Tahun Ajaran & Ruang (`/staff/master`)
  3. **Akademik**: Penjadwalan Perkuliahan Bebas Bentrok (`/staff/schedules`), Rekap Peserta Kelas (`/staff/classes`), Audit Nilai & Presensi (`/staff/grades`)
  4. **Layanan**: Verifikasi Pengajuan Surat Masuk (`/staff/services/verification`), Publikasi Pengumuman (`/staff/announcements`), Pencetakan Berkas & Ijazah (`/staff/content`), Moderasi Forum (`/staff/moderation`)

### C. Alur Deteksi Bentrok Penjadwalan Ruang Staf
```mermaid
flowchart TD
    InputJadwal["Staf Mengatur Jadwal: Hari, Jam Mulai, Jam Selesai, Ruang, Dosen"] --> CheckCollision{"Algoritma Deteksi Bentrok Matrix"}
    
    CheckCollision -- "Bentrok Ruang Terdeteksi" --> ErrRuang["Tolak: Ruang Lab 2 Telah Dipakai Kelas IF-402 di Jam Sama"]
    CheckCollision -- "Bentrok Dosen Terdeteksi" --> ErrDosen["Tolak: Dosen Bersangkutan Mengajar di Kelas Lain"]
    
    CheckCollision -- "Tidak Ada Bentrok" --> SaveJadwal["Simpan Jadwal Kuliah ke Database"]
    SaveJadwal --> PublishCalendar["Sinkronkan Otomatis ke Kalender Mahasiswa & Dosen"]
```

---

## 6. Arsitektur Peran Super Administrator (`SUPER_ADMIN`)

### A. Filosofi & Batasan Peran
Super Admin memegang **kedaulatan keamanan sistem, audit forensik, dan tata kelola platform (*Platform Governance & Forensic Auditor*)**. Memiliki hak mengonfigurasi parameter sistem, memantau *connection pool*, mengelola seluruh basis pengguna, serta menjalankan sesi impersonasi legal yang diaudit.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/admin` dan `/admin/system`
- **Grup Menu**:
  1. **Utama**: Beranda Metrik Sistem (`/admin`), Notifikasi
  2. **Pengguna**: Tata Kelola Akun Seluruh Aktor (`/admin/users`), Matriks Hak Akses & Peran (`/admin/roles`)
  3. **Aturan Kampus**: Kebijakan Akademik & Global Switches (`/admin/policies`)
  4. **Sub-Hub Server**: Pemantauan Metrik API/DB (`/admin/system/monitoring`), Integrasi Eksternal SIAKAD (`/admin/system/integrations`), Sesi Login & Manajemen Perangkat (`/admin/system/security`), Backup & Snapshot DB (`/admin/system/backup`), Pengaturan Sistem (`/admin/system/settings`), Log Audit Tidak Dapat Dihapus (`/admin/system/audit`)

### C. Protokol Kriptografis Impersonasi Super Admin
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Super Admin
    participant Action as startImpersonationAction
    participant Crypto as HMAC-SHA256 Signer
    participant Cookie as Cookie Jar (impersonation_token)
    participant Target as Sesi Pengguna Target (Misal Mahasiswa)
    participant Audit as LogAudit (Immutable)

    Admin->>Action: Ajukan Impersonasi (Pilih Target User ID)
    Action->>Action: Verifikasi Kredensial Asli Admin = SUPER_ADMIN di DB
    Action->>Crypto: Bangun Payload: { originalAdminId, targetUserId, exp: now + 15m }
    Crypto-->>Action: Terbitkan Token Kriptografis Bertanda Tangan
    
    Action->>Audit: Rekam Log Audit Wajib: "ADMIN_IMPERSONATION_STARTED"
    Action->>Cookie: Pasang Cookie HTTP-Only Secure 'impersonation_token'
    
    Action-->>Admin: Redirect ke /student (Antarmuka Mahasiswa Target)
    Note over Admin,Target: Seluruh Aksi Selama Impersonasi Berjalan Membawa Flag 'isImpersonating=true'
    
    Admin->>Action: Klik Tombol "Hentikan Sesi Impersonasi"
    Action->>Cookie: Hapus Cookie 'impersonation_token'
    Action->>Audit: Rekam Log Audit: "ADMIN_IMPERSONATION_ENDED"
    Action-->>Admin: Kembali ke Dashboard Super Admin (/admin)
```

---

## 7. Rangkuman Matriks Isolasi & Akses Antar Peran

```mermaid
classDiagram
    class Mahasiswa {
        +KRS
        +PresensiGPS()
        +UploadTugas()
        +KerjakanUjian()
        +KainSemester
    }

    class Dosen {
        +KelolaMateri()
        +BukaSesiPresensi()
        +InputNilaiRubrik()
        +ApprovalKRS()
    }

    class AsistenDosen {
        +KoreksiLaporanDraf()
        +PantauUjianCBT()
    }

    class Kaprodi {
        +ValidasiKurikulum()
        +EvaluasiCPL()
        +AuditMahasiswaBerisiko()
        +SahkanKHS()
    }

    class StafAkademik {
        +AturJadwalRuang()
        +CetakTranskrip()
        +VerifikasiSurat()
    }

    class SuperAdmin {
        +AuditLogging()
        +SignedImpersonation()
        +SystemConfiguration()
        +BackupRestore()
    }

    Mahasiswa <|-- AsistenDosen : "Mewarisi Hak Mahasiswa Aktif"
    Dosen "1" --> "0..*" AsistenDosen : "Mendelegasikan Asistensi"
    Kaprodi "1" --> "1..*" Dosen : "Mengevaluasi Kinerja Mengajar"
    StafAkademik "1" --> "1..*" Mahasiswa : "Menerbitkan Berkas Resmi"
    SuperAdmin "1" ..> "1..*" Mahasiswa : "Audit & Impersonasi Terpantau"
    SuperAdmin "1" ..> "1..*" Dosen : "Audit & Impersonasi Terpantau"
```
