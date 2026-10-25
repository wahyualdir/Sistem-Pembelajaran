# Dokumentasi Arsitektur Lengkap per Peran (Aktor)
**RuangKampus — Sistem Pembelajaran & Manajemen Akademik Berbasis OBE**  
**Program Studi Teknik Informatika · Universitas Islam Riau**  
*Dituntun langsung dari implementasi kode sumber repositori (branch `main` & `fitur/kain-semester`)*

---

## 1. Arsitektur Peran Mahasiswa (`STUDENT`)

### A. Filosofi & Batasan Peran
Peran Mahasiswa dirancang sebagai **ruang kendali belajar terpadu (*academic cockpit*)**. Mahasiswa memiliki akses baca ke seluruh materi dan kurikulum yang diambil pada semester aktif, hak mengumpulkan tugas, verifikasi presensi mandiri, serta pengerjaan ujian CBT. Mahasiswa diisolasi secara ketat oleh *Row-Level Security* (RLS) dan filter kueri Prisma sehingga tidak dapat mengakses berkas, nilai, atau draf ujian mahasiswa lain.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/student`
- **Grup Menu (16 Item)**:
  1. **Utama**: Beranda (`/student`), Kalender (`/calendar`), Notifikasi (`/notifications`), Pengumuman (`/announcements`)
  2. **Belajar**: Kelas Saya (`/classes`), Ujian (`/exams`), Perpustakaan Digital (`/library`), Tanya AI (`/ai-assistant`), Pesan Kuliah (`/messages`), Flashcard Materi (`/flashcards`), Tukar Keahlian (`/skill-exchange`)
  3. **Nilai**: Nilai Saya & Transkrip (`/grades`), Pencapaian / Badge OBE (`/achievements`), Sertifikat Kompetensi (`/certificates`)
  4. **Lainnya**: Komunitas Mahasiswa (`/community`), Evaluasi Kinerja Dosen (`/evaluations`), Pengajuan Surat & Legalisasi (`/requests`)

### C. Alur Data & Siklus Belajar Mahasiswa
```mermaid
flowchart LR
    subgraph SesiKuliah["1. Sesi Presensi Pertemuan"]
        Method["Pilih Metode: QR Dinamis / Kode PIN"] --> Geo["Ambil Geolocation API (Lat, Lng, Accuracy)"]
        Geo --> Heuristics["4 Heuristik Anti-Mock GPS"]
        Heuristics --> Calc["Jarak Haversine ke Titik Sesi"]
        Calc --> StatusDecision{"Jarak <= Radius Sesi (50m)?"}
        StatusDecision -- "Ya" --> PresensiOK["Status: HADIR (Terverifikasi)"]
        StatusDecision -- "Tidak" --> PresensiFlag["Tandai: MENUNGGU Verifikasi Dosen"]
    end

    subgraph AksesMateri["2. Ruang Kelas Interaktif"]
        PresensiOK & PresensiFlag --> UnduhMateri["Membaca Materi PDF/Video"]
        UnduhMateri --> UnggahTugas["Unggah Draf Tugas/Praktikum"]
        UnggahTugas --> S3Bucket["Penyimpanan Berkas (Supabase Storage)"]
    end

    subgraph EvaluasiCBT["3. Evaluasi Ujian & Kuis"]
        UnggahTugas --> UjianCBT["CBT Interface (/exams)"]
        UjianCBT --> Lock["Fullscreen & Blur/Visibility Listener"]
        Lock --> Nilai["Tabel Nilai & Ketercapaian CPMK"]
    end

    subgraph VisualisasiKain["4. Agregasi Dashboard"]
        Nilai --> Grid16["Kain Semester: Kisi 16 Pekan"]
    end
```

### D. Fitur Teknis Kunci Mahasiswa
1. **Mesin Kisi 'Kain Semester'**:
   - Menghitung status 16 kolom pekan untuk setiap mata kuliah yang tercantum pada tabel `KRSDetail`.
   - Simbol sel: `■` (Presensi Lengkap + Tugas Terkumpul), `◧` (Presensi Lengkap, tugas belum masuk), `○` (Alpa / Terlewat), `[ ]` (Pekan berjalan).
2. **Sistem Peringatan Dini (*Early Warning System*)**:
   - Algoritma pemicu: Jika ketidakhadiran mencapai $\ge 3$ kali atau persentase kehadiran $< 75\%$, sistem memunculkan peringatan kritis dan mengirimkan notifikasi ke Dosen Wali.
3. **Presensi Multi-Faktor**:
   - Validasi QR dinamis dengan toleransi kedaluwarsa 10 detik (*grace period*) atau kode PIN 6-digit.
   - Evaluasi integritas geospasial: deteksi akurasi $< 1\text{m}$ atau $> 500\text{m}$, lompatan kecepatan tidak wajar (*speed jump*), koordinat identik 6 desimal antar mahasiswa, dan ketidaksesuaian IP. Bila berada di luar radius, presensi tidak ditolak mentah-mentah melainkan ditandai untuk diverifikasi dosen.

---

## 2. Arsitektur Peran Asisten Dosen (`TEACHING_ASSISTANT`)

### A. Filosofi & Batasan Peran
Peran Asisten Dosen adalah **peran hibrida terdelegasi (*Delegated Hybrid Role*)**. Pengguna adalah mahasiswa aktif yang mendapatkan delegasi operasional per kelas dari Dosen Pengampu melalui tabel `class_assistants`. Batasan tegas di kode: Asisten **tidak dapat memfinalisasi nilai akhir, tidak dapat mengajukan perubahan nilai final, tidak dapat menugaskan staf, dan tidak dapat mengintervensi peserta ujian secara langsung**.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/ta`
- **Grup Menu (19 Item)**:
  1. **Utama**: Beranda Asisten (`/ta`), Kalender, Notifikasi, Pengumuman
  2. **Asistensi Khusus (3 Item)**: Kelas Asistensi (`/ta/classes`), Koreksi Draf Tugas (`/ta/grading`), Pantau Ujian CBT (`/ta/exam-monitor`)
  3. **Belajar, Nilai, Lainnya**: Mewarisi seluruh use case mahasiswa aktif

### C. Alur Kerja Pengawasan Ujian & Koreksi Praktikum
```mermaid
flowchart TD
    subgraph LiveProctoring["Pemantauan Ujian CBT (/ta/exam-monitor)"]
        Polling["Polling Status Peserta Tiap 5 Detik"] --> Detection{"Deteksi Anomali Peserta"}
        Detection -- "Pindah Tab / Minimize" --> ViolationLog["Catat Pelanggaran (Event Blur/Visibility)"]
        ViolationLog --> AlertTA["Tampilkan Indikator Pelanggaran di Layar Asisten"]
        AlertTA --> ReportLecturer["Diteruskan ke Dosen Pengampu (Hanya Dosen yang Berhak Intervensi)"]
    end

    subgraph LabGrading["Koreksi Laporan Praktikum (/ta/grading)"]
        Submissions["Daftar Laporan Praktikum Masuk"] --> ReviewPDF["Periksa Dokumen Mahasiswa"]
        ReviewPDF --> DraftScore["Input Skor Draf & Catatan Evaluasi"]
        DraftScore --> LecturerApproval["Divalidasi & Difinalisasi oleh Dosen Pengampu"]
    end
```

### D. Fitur Teknis Kunci Asisten Dosen
1. **Pemeriksaan Izin Delegasi Berbasis Database**:
   - Lima izin delegasi: `can_review_submissions`, `can_grade_draft`, `can_manage_materials`, `can_manage_announcements`, dan `can_open_attendance`.
   - Aksi seperti `createAttendanceSessionAction` memeriksa apakah kolom `can_open_attendance` bernilai `true` sebelum sesi dibuka.

---

## 3. Arsitektur Peran Dosen Pengampu (`LECTURER`)

### A. Filosofi & Batasan Peran
Dosen bertindak sebagai **manajer instruksional dan evaluator luaran pembelajaran (*Instructional Manager & OBE Assessor*)**. Dosen memiliki hak penuh atas pengelolaan konten pembelajaran, penyelenggaraan sesi presensi, penyusunan instrumen rubrik penilaian, intervensi peserta ujian, dan pembimbingan akademik (wali).

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/lecturer`
- **Grup Menu (19 Item)**:
  1. **Utama**: Beranda Dosen (`/lecturer`), Kalender, Notifikasi, Pengumuman
  2. **Mengajar**: Kelas Saya (`/classes`), Berita Acara Perkuliahan (`/lecturer/journals`), Tinjau Konten Buatan AI (`/lecturer/content-review`), Perpustakaan (`/library`)
  3. **Ujian dan Nilai**: Ujian dan Kuis (`/exams`), Bank Soal Mandiri (`/exams/question-bank`), Periksa Jawaban Esai (`/exams/review`), Analisis Butir Soal (`/exams/analysis`), Rubrik CPMK (`/lecturer/rubrics`), Buku Nilai Komprehensif (`/analytics`), Tanggapan Sanggahan Nilai (`/lecturer/disputes`)
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

    Dsn->>UI: Definisikan Bobot Asesmen (Tugas, Kuis, Praktikum, UTS, UAS)
    UI->>Rubrik: Petakan Komponen ke Indikator CPMK
    Rubrik->>DB: Simpan ke Tabel KomponenNilai

    Dsn->>UI: Buka Sesi Presensi (Set Titik Koordinat & Radius)
    UI->>DB: Terbitkan Pertemuan Baru (Status = OPEN)

    Mhs->>DB: Melakukan Presensi & Mengunggah Tugas
    
    Dsn->>UI: Buka Menu Periksa Jawaban & Penilaian
    Dsn->>UI: Input Skor Berdasarkan Rubrik Skala 0-100
    UI->>DB: Simpan Nilai & Hitung Mutu Huruf Otomatis
    UI-->>Dsn: Tampilkan Visualisasi Ketercapaian CPMK Kelas
```

### D. Fitur Teknis Kunci Dosen
1. **Pengendalian Sesi Presensi**:
   - Dosen menyimpan koordinat sesi; jika tidak diisi, sistem menggunakan koordinat cadangan dengan radius bawaan 50 meter.
   - Dosen dapat menyetujui sekaligus (*bulk approve*) presensi yang berstatus menunggu verifikasi di luar radius.
2. **Koreksi Esai dengan Bantuan AI & Cek Kemiripan**:
   - Dilengkapi integrasi Gemini API untuk evaluasi draf jawaban esai serta mesin deteksi kemiripan penugasan (*similarity check*).
3. **Pengajuan Perubahan Nilai Final**:
   - Jika buku nilai telah dikunci, dosen mengajukan perubahan nilai final yang wajib diputuskan oleh Koordinator Program Studi.

---

## 4. Arsitektur Peran Koordinator Program Studi (`PROGRAM_COORDINATOR`)

### A. Filosofi & Batasan Peran
Kaprodi bertindak sebagai **penjamin mutu kurikulum dan pengawas capaian lulusan (*Curriculum Quality & CPL Assurance*)**. Kaprodi memiliki wewenang khusus untuk menyetujui kelas yang diajukan, menugaskan dosen pengampu, memutuskan permohonan perubahan nilai final, serta memantau mahasiswa berisiko putus studi (*at-risk*). **Aksi persetujuan kelas dan penugasan dosen diblokir secara ketat saat sesi impersonasi aktif.**

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/coordinator`
- **Grup Menu (12 Item)**:
  1. **Utama**: Beranda Kaprodi (`/coordinator`), Kalender, Notifikasi, Pengumuman
  2. **Prodi**: Manajemen Kurikulum & CPL (`/coordinator/curriculum`), Direktori Mata Kuliah (`/coordinator/courses`), Penugasan Dosen Pengampu (`/coordinator/assignments`), Evaluasi Kinerja Dosen (`/coordinator/evaluations`)
  3. **Pantauan**: Monitoring Perkuliahan Real-Time (`/coordinator/monitoring`), Analisis Mahasiswa Berisiko per Angkatan (`/coordinator/monitoring/at-risk`)
  4. **Persetujuan**: Persetujuan Perubahan Nilai (`/coordinator/approvals`), Laporan Kinerja Akademik Prodi (`/coordinator/reports`)

### C. Alur Persetujuan Perubahan Nilai Kaprodi
```mermaid
flowchart LR
    DosenReq["Dosen Mengajukan Perubahan Nilai Final"] --> ValidateProdi{"Validasi Prodi Sesuai?"}
    ValidateProdi -- "Tidak Sesuai" --> RejectAuth["Ditolak: Di Luar Otoritas Prodi"]
    ValidateProdi -- "Sesuai" --> ReviewNote["Kaprodi Meninjau Alasan & Bukti Nilai"]
    
    ReviewNote --> Decision{"Keputusan Kaprodi"}
    Decision -- "Tolak" --> StatusRejected["Status: REJECTED (Tulis Catatan Keputusan)"]
    Decision -- "Setujui" --> StatusApproved["Status: APPROVED (Tulis Catatan Keputusan)"]
    
    StatusApproved --> StaffExecution["Diteruskan ke Staf Akademik untuk Dieksekusi"]
```

---

## 5. Arsitektur Peran Staf Administrasi Akademik (`ACADEMIC_STAFF`)

### A. Filosofi & Batasan Peran
Staf Akademik bertindak sebagai **pengendali data operasional dan eksekutor dokumen resmi (*Academic Registrar & Logistics*)**. Staf bertanggung jawab atas penyusunan jadwal kuliah bebas bentrok, pendaftaran dan pemindahan peserta kelas, eksekusi perubahan nilai yang telah disetujui Kaprodi, serta pengelolaan berkas akademik.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/staff`
- **Grup Menu (13 Item)**:
  1. **Utama**: Beranda Staf (`/staff`), Kalender Akademik, Notifikasi
  2. **Data Induk**: Master Mahasiswa (`/staff/master/students`), Master Dosen (`/staff/master/lecturers`), Data Akademik Prodi & Ruang (`/staff/master`)
  3. **Akademik**: Penyusunan Jadwal Bebas Bentrok (`/staff/schedules`), Kelas dan Peserta (`/staff/classes`), Audit Nilai dan Presensi (`/staff/grades`)
  4. **Layanan**: Verifikasi Pengajuan Mahasiswa (`/staff/services/verification`), Pengumuman dan Acara Kampus (`/staff/announcements`), Berkas dan Sertifikat (`/staff/content`), Moderasi Konten Komunitas (`/staff/moderation`)

### C. Alur Deteksi Bentrok Penjadwalan Staf
```mermaid
flowchart TD
    InputSlot["Staf Input Jadwal: Hari, Jam Mulai, Jam Selesai, Ruang, Dosen"] --> CheckCollision{"Algoritma Deteksi Bentrok"}
    
    CheckCollision -- "Bentrok Ruang Terdeteksi" --> ErrRuang["Tolak: Ruang Telah Digunakan Kelas Lain di Waktu Tersebut"]
    CheckCollision -- "Bentrok Dosen Terdeteksi" --> ErrDosen["Tolak: Dosen Bersangkutan Mengajar di Kelas Lain"]
    
    CheckCollision -- "Bebas Bentrok" --> SaveSchedule["Simpan ke Tabel JadwalKuliah"]
    SaveSchedule --> SyncCalendar["Sinkronkan Otomatis ke Kalender Mahasiswa & Dosen"]
```

### D. Fitur Teknis Kunci Staf Akademik
1. **Eksekusi Perubahan Nilai**:
   - Staf memvalidasi status `APPROVED` dari Kaprodi dan mengeksekusi perubahan nilai ke tabel database utama secara idempoten (hanya diizinkan satu kali eksekusi per pengajuan).
2. **Pencetakan Berkas Resmi**:
   - Pembuatan dokumen cetak (KRS, KHS, Kartu Ujian) dengan kotak tanda tangan resmi tata letak.

---

## 6. Arsitektur Peran System Administrator (`SYSTEM_ADMIN`)

### A. Filosofi & Batasan Peran
System Admin bertanggung jawab atas **kesehatan operasional infrastruktur dan konektivitas sistem (*System Operations & Infrastructure Stability*)**. System Admin memantau metrik performa, mengelola cadangan data, dan memeriksa log audit operasional melalui *view* terfilter `audit_logs_for_sysadmin`.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/admin/system`
- **Grup Menu (8 Item)**:
  1. **Utama**: Beranda Sistem (`/admin/system`), Notifikasi
  2. **Server**: Pemantauan Sistem & Endpoint (`/admin/system/monitoring`), Integrasi Eksternal SIAKAD (`/admin/system/integrations`)
  3. **Keamanan**: Sesi Login & Manajemen Sesi (`/admin/system/security`), Cadangan & Pemulihan Data (`/admin/system/backup`)
  4. **Pengaturan**: Pengaturan Sistem (`/admin/system/settings`), Log Audit Operasional (`/admin/system/audit`)

---

## 7. Arsitektur Peran Super Administrator (`SUPER_ADMIN`)

### A. Filosofi & Batasan Peran
Super Admin memegang **kedaulatan tata kelola platform, keamanan identitas, dan audit forensik menyeluruh (*Platform Governance & Forensic Authority*)**. Memiliki hak mengelola akun dan peran pengguna, mengubah aturan akademik global, membaca log audit penuh, serta menjalankan impersonasi legal yang terikat aturan forensik ketat. Super Admin **mewarisi seluruh use case operasional milik System Admin**.

### B. Hierarki Navigasi & Rute Portal
- **Gerbang Utama**: `/admin`
- **Grup Menu (12 Item Utama + 8 Item Sub-Hub Sistem)**:
  1. **Utama**: Beranda Tata Kelola (`/admin`), Notifikasi
  2. **Pengguna**: Tata Kelola Akun Pengguna (`/admin/users`), Matriks Peran dan Hak Akses (`/admin/roles`)
  3. **Aturan Kampus**: Kebijakan Akademik & Batas Peringatan Dini (`/admin/policies`)
  4. **Sub-Hub Server**: Mengakses seluruh 8 menu System Admin di `/admin/system/*`

### C. Protokol Kriptografis Impersonasi Super Admin
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Super Admin
    participant Action as impersonateUserAction
    participant DB as PostgreSQL (user_roles)
    participant Crypto as HMAC-SHA256 Token Signer
    participant Cookie as Cookie Jar (impersonation_token)
    participant Audit as LogAudit (Append-Only)

    Admin->>Action: Ajukan Impersonasi (Pilih Target User ID & Tulis Alasan)
    
    Action->>Action: Cek Chaining: Dilarang Melakukan Penyamaran Bertingkat
    Action->>Action: Cek Diri Sendiri: Dilarang Menyamar Sebagai Diri Sendiri
    Action->>DB: Periksa Role Target di Database
    alt Target Memiliki Role SUPER_ADMIN
        DB-->>Action: Target adalah Super Admin
        Action-->>Admin: Ditolak: Dilarang Menyamar Sebagai Sesama Super Administrator
    else Target Adalah Pengguna Biasa
        Action->>Action: Validasi Alasan Wajib Minimal 10 Karakter
        Action->>Crypto: Bangun Payload Bertanda Tangan (Masa Berlaku Tepat 30 Menit)
        Crypto-->>Action: Token Bertanda Tangan HMAC-SHA256
        
        Action->>Audit: Rekam Log Audit 'START_IMPERSONATION' (ID Admin, Target, Alasan, IP)
        alt Pencatatan Audit Gagal
            Audit-->>Action: Database Error
            Action-->>Admin: Dibatalkan: Kegagalan Pencatatan Audit Membatalkan Aksi
        else Audit Berhasil Direkam
            Action->>Cookie: Pasang Cookie HttpOnly 'impersonation_token'
            Action-->>Admin: Redirect ke Beranda Portal Target (isImpersonating=true)
        end
    end
```

### D. Fitur Teknis Kunci Super Admin
1. **Pencegahan Penghapusan Diri Sendiri & Super Admin Terakhir**:
   - Sistem menolak aksi penghapusan akun bila akun yang dihapus adalah akun admin yang sedang login atau merupakan satu-satunya Super Admin aktif di database.
2. **Log Audit Terkendali**:
   - Penyimpanan riwayat aksi berprinsip *append-only* dengan pengecualian terkontrol (`lawful_retention_purge`, `lawful_anonymization`).
3. **Blokir Aksi Sensitif Selama Impersonasi**:
   - Saat sesi impersonasi aktif, aksi persetujuan kelas, penugasan dosen, perubahan kata sandi, dan perubahan email diblokir secara mutlak di tingkat Server Action.

---

## 8. Diagram Relasi Pewarisan & Kolaborasi Antar Peran

```mermaid
classDiagram
    class PenggunaUmum {
        +LoginEmailPassword()
        +LoginGoogleOAuth()
        +KelolaSesiPerangkat()
        +LihatKalender()
        +PreferensiNotifikasi()
        +LihatTransparansiData()
    }

    class Mahasiswa {
        +PresensiGPS(Haversine)
        +UploadTugas()
        +KerjakanUjianCBT()
        +PantauKainSemester()
        +AjukanSanggahanNilai()
    }

    class AsistenDosen {
        +KoreksiDrafTugas()
        +PantauUjianCBT(Polling5s)
        +BukaPresensiIzinDelegasi()
    }

    class DosenPengampu {
        +KelolaMateriTugas()
        +BukaTutupPresensiGPS()
        +NilaiRubrikCPMK()
        +AjukanPerubahanNilai()
        +IntervensiUjianCBT()
    }

    class KoordinatorProdi {
        +SetujuiKelasBaru()
        +TugaskanDosenPengampu()
        +PutuskanPerubahanNilai()
        +PantauMahasiswaBerisiko()
        +RadarCPL()
    }

    class StafAkademik {
        +JadwalKuliahBebasBentrok()
        +DaftarkanPesertaKelas()
        +EksekusiPerubahanNilaiApproved()
        +CetakDokumenResmi()
    }

    class SystemAdmin {
        +PemantauanSistem()
        +IntegrasiSIAKAD()
        +CadanganData()
        +LogAuditSysAdmin()
    }

    class SuperAdmin {
        +KelolaAkunPeran()
        +Impersonasi30MenitHMAC()
        +AturanAkademikGlobal()
        +LogAuditPenuh()
    }

    PenggunaUmum <|-- Mahasiswa
    PenggunaUmum <|-- DosenPengampu
    PenggunaUmum <|-- KoordinatorProdi
    PenggunaUmum <|-- StafAkademik
    PenggunaUmum <|-- SystemAdmin
    
    Mahasiswa <|-- AsistenDosen : "Mewarisi Seluruh Use Case Mahasiswa"
    SystemAdmin <|-- SuperAdmin : "Mewarisi Seluruh Use Case System Admin"

    DosenPengampu "1" --> "0..*" AsistenDosen : "Delegasikan Izin (class_assistants)"
    KoordinatorProdi "1" --> "1..*" DosenPengampu : "Mengesahkan Kelas & Nilai"
    KoordinatorProdi "1" ..> "1" StafAkademik : "Keputusan Nilai Dieksekusi Staf"
    SuperAdmin "1" ..> "1..*" PenggunaUmum : "Impersonasi Terkendali (Audit Trail)"
```
