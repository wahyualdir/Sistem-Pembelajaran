# Use Case Diagram SIAJAR / RuangKampus

Dokumen ini diturunkan langsung dari kode repo `wahyualdir/Sistem-Pembelajaran` (branch `main`): daftar menu per peran di `src/lib/config/menu-config.ts`, server actions di `src/modules/**`, dan pemeriksaan peran (guard) di dalam tiap aksi. Isinya menggambarkan **apa yang ada di kode**, bukan rencana.

## Cara membaca

| Simbol | Arti |
| --- | --- |
| Kotak `👤` | Aktor manusia (7 peran, karena kode memisahkan `SYSTEM_ADMIN` dan `SUPER_ADMIN`) |
| Kotak `⚙` abu-abu putus-putus | Aktor sekunder: sistem eksternal atau penjadwal |
| Oval | Use case |
| Oval kuning putus-putus | Ada di menu atau izin, tetapi halamannya masih cangkang atau izinnya baru ditegakkan di database (belum ada antarmuka penuh) |
| Garis polos | Asosiasi aktor dengan use case |
| Panah putus `include` | Use case dasar selalu memanggil use case yang disertakan |
| Panah putus `extend` | Use case tambahan (arah panah ke use case dasar) yang dijalankan bila kondisinya terpenuhi |
| Panah `mewarisi` | Generalisasi: aktor turunan memiliki semua use case aktor induk |

Status "terimplementasi" berarti ada server action atau halaman yang sesuai di kode. Belum diuji dengan menjalankan aplikasinya.

---

## 1. Konteks sistem (tingkat paket)

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef ext fill:#eeeeee,stroke:#777777,stroke-dasharray:3 3,color:#222222

  MHS["👤 Mahasiswa"]:::actor
  TA["👤 Asisten Dosen"]:::actor
  DSN["👤 Dosen Pengampu"]:::actor
  KPR["👤 Koordinator Prodi"]:::actor
  STF["👤 Staf Akademik"]:::actor
  SYS["👤 System Admin"]:::actor
  SUP["👤 Super Admin"]:::actor
  OAUTH["⚙ Google OAuth"]:::ext
  AI["⚙ Gemini API"]:::ext
  JUDGE["⚙ Piston / Judge"]:::ext
  CRON["⚙ Penjadwal Cron"]:::ext

  TA -->|"mewarisi semua use case"| MHS
  SUP -->|"mewarisi use case sistem"| SYS

  subgraph SIAJAR["Batas sistem: SIAJAR / RuangKampus"]
    P1(["P1 Akun, sesi, notifikasi<br/>login, perangkat, kalender"])
    P2(["P2 Kelas dan pembelajaran<br/>materi, tugas, diskusi, Peta Pulau"])
    P3(["P3 Presensi<br/>QR dinamis, lokasi, izin"])
    P4(["P4 Ujian dan kuis<br/>CBT, bank soal, pemantauan"])
    P5(["P5 Penilaian dan sanggahan<br/>rubrik, gradebook, perubahan nilai"])
    P6(["P6 Analitik dan peringatan dini<br/>risiko mahasiswa, radar CPL"])
    P7(["P7 Komunikasi dan komunitas<br/>pesan, forum, grup, mentoring"])
    P8(["P8 Layanan dan evaluasi<br/>pengajuan, evaluasi dosen"])
    P9(["P9 Akademik dan data induk<br/>jadwal, peserta, penugasan, kelas"])
    P10(["P10 Operasional sistem<br/>pemantauan, cadangan, audit"])
    P11(["P11 Pengguna dan kebijakan<br/>akun, peran, aturan, impersonasi"])
  end

  MHS --- P1 & P2 & P3 & P4 & P5 & P7 & P8
  DSN --- P1 & P2 & P3 & P4 & P5 & P6 & P7
  TA --- P2 & P3 & P4 & P5
  KPR --- P1 & P5 & P6 & P8 & P9
  STF --- P1 & P5 & P6 & P8 & P9
  SYS --- P1 & P10
  SUP --- P10 & P11
  OAUTH --- P1
  AI --- P2 & P4
  JUDGE --- P4
  CRON --- P1 & P6 & P11
```

---

## 2. Use case umum (semua peran)

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef ext fill:#eeeeee,stroke:#777777,stroke-dasharray:3 3,color:#222222

  USR["👤 Semua pengguna<br/>(7 peran)"]:::actor
  OAUTH["⚙ Google OAuth"]:::ext
  CRON["⚙ Penjadwal Cron"]:::ext

  subgraph SIAJAR["Batas sistem: akun, sesi, dan notifikasi"]
    A1(["Masuk dengan email dan sandi"])
    A1a(["Batasi percobaan login"])
    A1b(["Catat perangkat"])
    A2(["Masuk dengan Google<br/>domain mahasiswa"])
    A2a(["Cocokkan domain email di server"])
    A3(["Daftar akun"])
    A4(["Ganti kata sandi<br/>wajib saat pertama"])
    A5(["Pilih workspace atau ganti peran aktif"])
    A6(["Kelola perangkat dan sesi"])
    A6a(["Cabut perangkat atau sesi lain"])
    A7(["Laporkan: bukan saya"])
    A8(["Keluar"])
    A9(["Lihat dan tandai notifikasi"])
    A10(["Atur preferensi notifikasi<br/>in-app, email, WhatsApp"])
    A11(["Lihat kalender tenggat"])
    A12(["Berlangganan kalender iCal"])
    A12a(["Buat token kalender pribadi"])
    A12b(["Reset token kalender"])
    A13(["Lihat pengumuman"])
    A14(["Lihat halaman transparansi data"])
    A15(["Kirim pengingat tenggat otomatis"])
  end

  USR --- A1 & A2 & A3 & A4 & A5 & A6 & A7 & A8
  USR --- A9 & A10 & A11 & A12 & A13 & A14
  A1 -.->|"include"| A1a
  A1 -.->|"include"| A1b
  A2 -.->|"include"| A2a
  A5 -.->|"extend"| A1
  A6a -.->|"extend"| A6
  A10 -.->|"extend"| A9
  A12 -.->|"include"| A12a
  A12b -.->|"extend"| A12
  OAUTH --- A2
  CRON --- A15
  A15 -.->|"include"| A9
```

---

## 3. Mahasiswa

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef ext fill:#eeeeee,stroke:#777777,stroke-dasharray:3 3,color:#222222

  MHS["👤 Mahasiswa"]:::actor
  AI["⚙ Gemini API"]:::ext
  JUDGE["⚙ Piston / Judge"]:::ext

  subgraph SIAJAR["Batas sistem: use case Mahasiswa"]
    subgraph SK["Kelas dan belajar"]
      K1(["Gabung kelas dengan kode"])
      K1a(["Batasi percobaan kode<br/>8 salah per 10 menit"])
      K2(["Lihat daftar dan detail kelas"])
      K3(["Baca materi dan catat progres"])
      K4(["Jelajahi Peta Pulau<br/>bab dan topik"])
      K4a(["Kerjakan kuis bab"])
      K5(["Lihat prioritas harian"])
      K6(["Kumpulkan tugas"])
      K7(["Lihat umpan balik dan rubrik"])
      K8(["Ikut diskusi dan forum kelas"])
      K8a(["Tandai jawaban terbaik"])
      K9(["Gabung kelompok dengan kode"])
      K10(["Ikut polling langsung"])
      K11(["Dengarkan podcast materi"])
      K12(["Belajar flashcard Leitner"])
      K13(["Tanya asisten AI akademik"])
      K14(["Cari katalog perpustakaan"])
      K15(["Tukar keahlian"])
    end
    subgraph SP["Presensi"]
      PR1(["Presensi pertemuan<br/>QR dinamis atau kode PIN"])
      PR1a(["Hitung jarak ke lokasi kelas<br/>Haversine, radius bawaan 50 m"])
      PR1b(["Deteksi heuristik GPS tidak wajar"])
      PR1c(["Tandai untuk verifikasi dosen<br/>bila di luar radius"])
      PR2(["Lihat rekap presensi saya"])
      PR3(["Ajukan izin atau sakit"])
      PR3a(["Unggah bukti ketidakhadiran"])
      PR4(["Batalkan pengajuan izin"])
    end
    subgraph SU["Ujian dan kuis"]
      UJ1(["Kerjakan kuis atau ujian"])
      UJ1a(["Simpan jawaban otomatis"])
      UJ1b(["Catat peristiwa dan pelanggaran ujian"])
      UJ1c(["Jalankan kode pada soal koding"])
      UJ2(["Lihat hasil percobaan"])
      UJ3(["Ajukan sanggahan ujian"])
    end
    subgraph SN["Nilai dan capaian"]
      NL1(["Lihat nilai dan rekap semester"])
      NL2(["Ajukan sanggahan nilai"])
      NL2a(["Kirim pesan pada sanggahan"])
      NL2b(["Tarik sanggahan"])
      NL3(["Lihat pencapaian dan lencana"])
      NL4(["Lihat dan verifikasi sertifikat"])
      NL5(["Lihat status akademik<br/>dan peringatan dini"])
    end
    subgraph SL["Layanan dan komunitas"]
      LY1(["Isi evaluasi dosen"])
      LY2(["Buat dan pantau pengajuan layanan"])
      LY3(["Kirim pesan langsung"])
      LY4(["Pesan slot konsultasi dosen"])
      LY5(["Ikut komunitas<br/>forum, grup, acara, mentoring"])
      LY6(["Atur privasi data aktivitas"])
    end
  end

  MHS --- K1 & K2 & K3 & K4 & K5 & K6 & K7 & K8
  MHS --- K9 & K10 & K11 & K12 & K13 & K14 & K15
  MHS --- PR1 & PR2 & PR3 & PR4
  MHS --- UJ1 & UJ2 & UJ3
  MHS --- NL1 & NL2 & NL3 & NL4 & NL5
  MHS --- LY1 & LY2 & LY3 & LY4 & LY5 & LY6

  K1 -.->|"include"| K1a
  K4a -.->|"extend"| K4
  K8a -.->|"extend"| K8
  PR1 -.->|"include"| PR1a
  PR1 -.->|"include"| PR1b
  PR1c -.->|"extend"| PR1
  PR3 -.->|"include"| PR3a
  UJ1 -.->|"include"| UJ1a
  UJ1 -.->|"include"| UJ1b
  UJ1c -.->|"extend"| UJ1
  NL2a -.->|"extend"| NL2
  NL2b -.->|"extend"| NL2
  AI --- K13
  JUDGE --- UJ1c
```

---

## 4. Asisten Dosen

Asisten adalah peran hibrida: menunya sama dengan Mahasiswa ditambah grup **Asistensi** (Kelas Asistensi, Koreksi, Pantau Ujian). Hak tambahan bergantung pada izin yang didelegasikan dosen per kelas.

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef partial fill:#fff6d6,stroke:#b26a00,stroke-dasharray:5 4,color:#222222
  classDef note fill:#f7f7f7,stroke:#999999,stroke-dasharray:2 3,color:#333333

  TA["👤 Asisten Dosen"]:::actor
  MHS["👤 Mahasiswa"]:::actor
  DSN["👤 Dosen Pengampu"]:::actor
  BATAS["Batas peran: tidak dapat finalisasi nilai,<br/>mengajukan perubahan nilai, menugaskan staf,<br/>atau mengintervensi peserta ujian"]:::note

  TA -->|"mewarisi semua use case"| MHS

  subgraph SIAJAR["Batas sistem: use case tambahan Asisten Dosen"]
    subgraph SA["Asistensi sesuai izin delegasi"]
      T1(["Lihat kelas asistensi"])
      T2(["Tinjau pengumpulan tugas"])
      T3(["Beri nilai draf dan umpan balik"])
      T0(["Periksa izin delegasi kelas"])
      T4(["Pantau ujian langsung"])
      T4a(["Lihat peristiwa dan pelanggaran peserta"])
      T5(["Buka sesi presensi"])
      T6(["Verifikasi presensi mahasiswa"])
      T7(["Tinjau izin ketidakhadiran"])
      T8(["Buat polling langsung"])
      T9(["Lihat hasil cek kemiripan tugas"])
      T10(["Pantau forum kelas asistensi"])
    end
    subgraph SD["Izin delegasi: ditegakkan di database, antarmuka belum penuh"]
      T11(["Terbitkan materi"]):::partial
      T12(["Kirim pengumuman"]):::partial
      T13(["Terbitkan tugas"]):::partial
    end
    DL(["Atur asisten dan izin delegasi"])
  end

  TA --- T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9 & T10
  TA --- T11 & T12 & T13
  DSN --- DL
  T2 -.->|"include"| T0
  T3 -.->|"include"| T0
  T11 -.->|"include"| T0
  T12 -.->|"include"| T0
  T13 -.->|"include"| T0
  T4a -.->|"extend"| T4
  DL -.->|"menetapkan izin"| T0
  TA -.- BATAS
```

---

## 5. Dosen Pengampu (bagian A: mengajar dan presensi)

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef ext fill:#eeeeee,stroke:#777777,stroke-dasharray:3 3,color:#222222

  DSN["👤 Dosen Pengampu"]:::actor
  KPR["👤 Koordinator Prodi"]:::actor
  AI["⚙ Gemini API"]:::ext

  subgraph SIAJAR["Batas sistem: use case Dosen (mengajar dan presensi)"]
    subgraph DK["Kelas dan konten"]
      D1(["Buat kelas dan kode kelas"])
      D2(["Ajukan kelas ke koordinator"])
      D3(["Lihat anggota kelas"])
      D4(["Kloning kelas"])
      D5(["Arsipkan kelas"])
      D6(["Atur asisten dan izin delegasi"])
      D6a(["Pilih izin: tinjau, nilai draf,<br/>materi, pengumuman, tugas"])
      D7(["Terbitkan materi Markdown"])
      D7a(["Minta AI membuat konten<br/>podcast dan kartu belajar"])
      D8(["Kirim pengumuman kelas"])
      D9(["Buat tugas"])
      D9a(["Atur penalti keterlambatan"])
      D9b(["Beri perpanjangan tenggat"])
      D10(["Atur Peta Pulau<br/>bab, topik, buka kunci"])
      D11(["Pantau mahasiswa tertinggal<br/>dan kirim pengingat"])
      D12(["Kelola kelompok kelas"])
      D13(["Kelola polling langsung"])
      D14(["Moderasi diskusi<br/>sematkan, kunci, sembunyikan"])
      D15(["Atur mode pertemuan daring"])
      D16(["Tulis berita acara perkuliahan"])
      D16a(["Finalisasi berita acara"])
      D16b(["Ekspor berita acara ke Excel"])
      D17(["Tinjau konten buatan AI"])
      D17a(["Beri persetujuan penggunaan AI"])
      D18(["Buat slot konsultasi"])
    end
    subgraph DP["Presensi"]
      D19(["Buka dan tutup sesi presensi"])
      D19a(["Tampilkan QR dinamis"])
      D19b(["Atur titik lokasi dan radius"])
      D20(["Verifikasi atau koreksi presensi"])
      D21(["Tinjau anomali presensi"])
      D22(["Setujui izin ketidakhadiran"])
      D22a(["Setujui sekaligus"])
      D23(["Lihat rekap presensi kelas<br/>syarat UAS 75 persen"])
    end
    subgraph DL["Pemantauan dan komunikasi"]
      D24(["Lihat mahasiswa bimbingan dan risikonya"])
      D25(["Lihat ringkasan risiko kelas"])
      D26(["Lihat hasil evaluasi dosen"])
      D27(["Kirim pesan ke mahasiswa"])
    end
  end

  DSN --- D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8 & D9
  DSN --- D10 & D11 & D12 & D13 & D14 & D15 & D16 & D17 & D18
  DSN --- D19 & D20 & D21 & D22 & D23
  DSN --- D24 & D25 & D26 & D27

  D6 -.->|"include"| D6a
  D7a -.->|"extend"| D7
  D9a -.->|"extend"| D9
  D9b -.->|"extend"| D9
  D16a -.->|"extend"| D16
  D16b -.->|"extend"| D16
  D17 -.->|"include"| D17a
  D19 -.->|"include"| D19a
  D19b -.->|"extend"| D19
  D22a -.->|"extend"| D22
  AI --- D7a
  D2 -.->|"disetujui oleh"| KPR
```

---

## 6. Dosen Pengampu (bagian B: ujian dan penilaian)

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef ext fill:#eeeeee,stroke:#777777,stroke-dasharray:3 3,color:#222222

  DSN["👤 Dosen Pengampu"]:::actor
  KPR["👤 Koordinator Prodi"]:::actor
  AI["⚙ Gemini API"]:::ext
  JUDGE["⚙ Piston / Judge"]:::ext

  subgraph SIAJAR["Batas sistem: use case Dosen (ujian dan penilaian)"]
    subgraph EU["Ujian dan bank soal"]
      E1(["Buat kuis atau ujian"])
      E1a(["Susun soal dari bank soal"])
      E1b(["Periksa soal AI sudah disetujui"])
      E2(["Kelola bank soal"])
      E2a(["Impor soal<br/>Excel, Word, Moodle XML, QTI"])
      E2b(["Buat soal dengan AI"])
      E3(["Pantau ujian langsung"])
      E3a(["Intervensi peserta<br/>hanya dosen"])
      E4(["Periksa jawaban esai"])
      E4a(["Bantuan penilaian esai AI"])
      E5(["Analisis ujian dan butir soal"])
      E6(["Tinjau pelanggaran ujian"])
      E7(["Tanggapi sanggahan ujian"])
      E8(["Jalankan dan nilai soal koding"])
    end
    subgraph EN["Penilaian dan buku nilai"]
      G1(["Buat dan duplikasi rubrik"])
      G2(["Pasang rubrik ke tugas"])
      G3(["Nilai pengumpulan dengan rubrik"])
      G3a(["Beri komentar umpan balik"])
      G4(["Beri nilai draf"])
      G5(["Finalisasi nilai"])
      G5a(["Catat riwayat nilai dan audit"])
      G6(["Atur komponen nilai berbobot<br/>dan konversi huruf mutu"])
      G7(["Kunci buku nilai kelas"])
      G8(["Lihat dan ekspor rekap nilai CSV"])
      G8a(["Catat ekspor di log audit"])
      G9(["Ajukan perubahan nilai final"])
      G10(["Tanggapi sanggahan nilai"])
      G11(["Jalankan cek kemiripan tugas"])
      G11a(["Tinjau pasangan mirip"])
      G11b(["Atur ambang kemiripan"])
    end
  end

  DSN --- E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8
  DSN --- G1 & G2 & G3 & G4 & G5 & G6 & G7 & G8 & G9 & G10 & G11

  E1 -.->|"include"| E1a
  E1 -.->|"include"| E1b
  E2a -.->|"extend"| E2
  E2b -.->|"extend"| E2
  E3a -.->|"extend"| E3
  E4a -.->|"extend"| E4
  G3 -.->|"include"| G3a
  G5 -.->|"include"| G5a
  G8 -.->|"include"| G8a
  G11a -.->|"extend"| G11
  G11b -.->|"extend"| G11
  AI --- E2b
  AI --- E4a
  JUDGE --- E8
  G9 -.->|"diputuskan oleh"| KPR
```

---

## 7. Koordinator Program Studi

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef partial fill:#fff6d6,stroke:#b26a00,stroke-dasharray:5 4,color:#222222
  classDef note fill:#f7f7f7,stroke:#999999,stroke-dasharray:2 3,color:#333333

  KPR["👤 Koordinator Prodi"]:::actor
  DSN["👤 Dosen Pengampu"]:::actor
  STF["👤 Staf Akademik"]:::actor
  BATAS["Batas peran: hanya Koordinator yang boleh menyetujui kelas<br/>dan menugaskan dosen (Staf dan Super Admin dikecualikan).<br/>Kedua aksi diblokir selama sesi impersonasi."]:::note

  subgraph SIAJAR["Batas sistem: use case Koordinator Prodi"]
    subgraph KA["Persetujuan dan penugasan"]
      C1(["Setujui atau tolak kelas yang diajukan"])
      C2(["Tugaskan dosen pengampu ke kelas"])
      C3(["Putuskan pengajuan perubahan nilai"])
      C3a(["Validasi prodi mata kuliah sesuai"])
      C3b(["Tulis catatan keputusan"])
      C4(["Kunci buku nilai kelas"])
    end
    subgraph KK["Kurikulum"]
      C5(["Lihat kurikulum dan CPL"]):::partial
      C6(["Kelola mata kuliah prodi"]):::partial
      C7(["Lihat radar CPMK-CPL"])
    end
    subgraph KM["Pemantauan"]
      C8(["Pantau perkuliahan<br/>kelas, dosen, presensi, ujian"])
      C9(["Pantau mahasiswa berisiko<br/>per angkatan"])
      C10(["Lihat ringkasan risiko kelas"])
    end
    subgraph KE["Evaluasi dan laporan"]
      C11(["Kelola periode evaluasi dosen<br/>buat, buka, tutup"])
      C12(["Kirim pengingat evaluasi"])
      C13(["Lihat laporan evaluasi dosen"])
      C13a(["Ekspor laporan evaluasi CSV"])
      C14(["Lihat laporan adopsi LMS"])
      C15(["Ekspor laporan akademik"])
    end
  end

  KPR --- C1 & C2 & C3 & C4 & C5 & C6 & C7
  KPR --- C8 & C9 & C10 & C11 & C12 & C13 & C14 & C15
  C3 -.->|"include"| C3a
  C3 -.->|"include"| C3b
  C13a -.->|"extend"| C13
  STF -.->|"mengajukan kelas"| C1
  DSN -.->|"mengajukan perubahan nilai"| C3
  C3 -.->|"status APPROVED, dieksekusi oleh"| STF
  KPR -.- BATAS
```

---

## 8. Staf Akademik

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef partial fill:#fff6d6,stroke:#b26a00,stroke-dasharray:5 4,color:#222222

  STF["👤 Staf Akademik"]:::actor
  KPR["👤 Koordinator Prodi"]:::actor

  subgraph SIAJAR["Batas sistem: use case Staf Akademik"]
    subgraph SD["Data induk"]
      S1(["Kelola data akademik<br/>prodi, mata kuliah, tahun ajaran, ruang"])
      S2(["Lihat direktori mahasiswa"]):::partial
      S3(["Lihat direktori dosen"]):::partial
    end
    subgraph SJ["Jadwal dan kelas"]
      S4(["Susun jadwal kuliah dan slot kelas"])
      S4a(["Deteksi bentrok ruang dan dosen"])
      S5(["Susun jadwal ujian"])
      S6(["Lihat penggunaan ruang"])
      S7(["Ajukan kelas baru"])
      S8(["Daftarkan peserta ke kelas"])
      S8a(["Impor peserta dari CSV"])
      S8b(["Pindahkan peserta antar kelas"])
      S9(["Kloning kelas"])
      S10(["Arsipkan semester secara massal"])
    end
    subgraph SN["Nilai dan presensi"]
      S11(["Lihat rekap nilai dan presensi"])
      S11a(["Ekspor laporan"])
      S12(["Eksekusi perubahan nilai yang disetujui"])
      S12a(["Validasi status APPROVED<br/>dan satu kali eksekusi"])
      S13(["Kunci buku nilai kelas"])
    end
    subgraph SL["Layanan"]
      S14(["Verifikasi pengajuan mahasiswa"]):::partial
      S15(["Kelola pengumuman dan acara"])
      S16(["Kelola berkas dan sertifikat"])
      S17(["Moderasi konten<br/>forum, pesan, tukar keahlian"])
      S18(["Kelola katalog perpustakaan"])
      S19(["Lihat risiko mahasiswa per angkatan"])
    end
  end

  STF --- S1 & S2 & S3
  STF --- S4 & S5 & S6 & S7 & S8 & S9 & S10
  STF --- S11 & S12 & S13
  STF --- S14 & S15 & S16 & S17 & S18 & S19
  S4 -.->|"include"| S4a
  S8a -.->|"extend"| S8
  S8b -.->|"extend"| S8
  S11a -.->|"extend"| S11
  S12 -.->|"include"| S12a
  S7 -.->|"disetujui oleh"| KPR
  S12 -.->|"setelah diputuskan oleh"| KPR
```

---

## 9. System Admin dan Super Admin

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef ext fill:#eeeeee,stroke:#777777,stroke-dasharray:3 3,color:#222222

  SYS["👤 System Admin"]:::actor
  SUP["👤 Super Admin"]:::actor
  CRON["⚙ Penjadwal Cron"]:::ext

  SUP -->|"mewarisi use case sistem"| SYS

  subgraph SIAJAR["Batas sistem: use case administrasi"]
    subgraph YO["Operasional sistem (System Admin dan Super Admin)"]
      Y1(["Lihat dasbor sistem"])
      Y2(["Pantau kesehatan sistem"])
      Y3(["Kelola integrasi"])
      Y4(["Kelola sesi login dan keamanan"])
      Y5(["Kelola cadangan data"])
      Y6(["Atur pengaturan sistem"])
      Y7(["Lihat log audit<br/>tampilan System Admin"])
      Y8(["Jalankan hitung risiko harian"])
    end
    subgraph YT["Tata kelola (khusus Super Admin)"]
      Z1(["Kelola akun pengguna"])
      Z1a(["Ubah email pengguna"])
      Z1b(["Hapus pengguna"])
      Z1c(["Cegah hapus diri sendiri<br/>dan Super Admin terakhir"])
      Z2(["Ubah peran pengguna"])
      Z3(["Kelola peran dan akses"])
      Z4(["Atur aturan akademik"])
      Z4a(["Atur kebijakan peringatan dini"])
      Z5(["Kirim pengumuman kampus"])
      Z6(["Lihat log audit penuh"])
      Z7(["Impersonasi pengguna"])
      Z7a(["Wajib alasan minimal 10 karakter"])
      Z7b(["Tandatangani token HMAC-SHA256<br/>berlaku 30 menit"])
      Z7c(["Catat mulai dan akhir ke log audit"])
      Z7d(["Blokir aksi sensitif saat impersonasi"])
      Z7e(["Hentikan impersonasi"])
      Z7f(["Akhiri sesi kedaluwarsa otomatis"])
    end
  end

  SYS --- Y1 & Y2 & Y3 & Y4 & Y5 & Y6 & Y7 & Y8
  SUP --- Z1 & Z2 & Z3 & Z4 & Z5 & Z6 & Z7
  Z1a -.->|"extend"| Z1
  Z1b -.->|"extend"| Z1
  Z1b -.->|"include"| Z1c
  Z4a -.->|"extend"| Z4
  Z7 -.->|"include"| Z7a
  Z7 -.->|"include"| Z7b
  Z7 -.->|"include"| Z7c
  Z7 -.->|"include"| Z7d
  Z7e -.->|"extend"| Z7
  Z7f -.->|"extend"| Z7
  CRON --- Z7f
```

---

## 10. Use case lintas peran

Tiga alur yang melibatkan lebih dari satu aktor. Aturan pemisahan tugas (siapa yang boleh dan tidak boleh) diambil dari guard di server actions.

```mermaid
flowchart LR
  classDef default fill:#ffffff,stroke:#555555,color:#111111
  classDef actor fill:#e6f0ea,stroke:#1b5e43,stroke-width:2px,color:#0b2e21
  classDef note fill:#f7f7f7,stroke:#999999,stroke-dasharray:2 3,color:#333333

  DSN["👤 Dosen Pengampu"]:::actor
  KPR["👤 Koordinator Prodi"]:::actor
  STF["👤 Staf Akademik"]:::actor
  MHS["👤 Mahasiswa"]:::actor
  TA["👤 Asisten Dosen"]:::actor

  subgraph SIAJAR["Batas sistem: alur lintas peran"]
    subgraph F1["Alur A: perubahan nilai final"]
      X1(["Ajukan perubahan nilai final"])
      X2(["Putuskan setujui atau tolak"])
      X3(["Eksekusi perubahan nilai"])
      X4(["Catat riwayat, audit, dan notifikasi"])
    end
    subgraph F2["Alur B: dari kelas diajukan sampai mahasiswa bergabung"]
      Y1(["Ajukan kelas baru"])
      Y2(["Setujui kelas"])
      Y3(["Tugaskan dosen pengampu"])
      Y4(["Daftarkan peserta atau impor CSV"])
      Y5(["Gabung kelas dengan kode"])
    end
    subgraph F3["Alur C: delegasi kerja ke asisten"]
      W1(["Atur asisten dan izin delegasi"])
      W2(["Tinjau dan beri nilai draf"])
      W3(["Finalisasi nilai"])
    end
  end

  DSN --- X1 & Y1 & W1 & W3
  KPR --- X2 & Y2 & Y3
  STF --- X3 & Y1 & Y4
  MHS --- Y5
  TA --- W2
  X1 -->|"memicu"| X2
  X2 -->|"hanya jika APPROVED"| X3
  X3 -.->|"include"| X4
  Y1 -->|"memicu"| Y2
  Y2 -->|"memicu"| Y3
  Y3 -->|"memicu"| Y4
  Y4 -->|"memungkinkan"| Y5
  W1 -->|"memberi izin"| W2
  W2 -->|"diteruskan ke"| W3
```

Aturan yang ditegakkan kode pada ketiga alur:

- **Alur A:** hanya Dosen yang boleh mengajukan perubahan nilai; hanya Koordinator dari prodi mata kuliah terkait yang boleh memutuskan; hanya Staf yang boleh mengeksekusi, dan hanya satu kali, hanya untuk status `APPROVED`.
- **Alur B:** Staf atau Dosen boleh mengajukan kelas; hanya Koordinator yang boleh menyetujui dan menugaskan dosen; hanya Staf yang boleh mendaftarkan peserta. Super Admin dikecualikan dari ketiga aksi persetujuan dan pendaftaran. Keempat aksi (mengajukan, menyetujui, menugaskan, mendaftarkan) diblokir saat sesi impersonasi.
- **Alur C:** finalisasi nilai tetap hanya milik Dosen. Asisten hanya memberi nilai draf.

---

## 11. Matriks aktor dan use case

Simbol: ✓ berwenang menurut guard di kode, ◐ sebagian atau bersyarat (lihat catatan), kosong = tidak berwenang. Kolom Asisten sudah termasuk use case yang diwarisi dari Mahasiswa.

| Use case | Mhs | Asisten | Dosen | Kaprodi | Staf | SysAdm | SuperAdm |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Masuk, kelola sesi dan perangkat, notifikasi | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lihat kalender | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| Gabung kelas dengan kode | ✓ | ✓ | | | | | |
| Buat kelas | | | ✓ | | | | |
| Ajukan kelas baru | | | ✓ | | ✓ | | |
| Setujui kelas dan tugaskan dosen | | | | ✓ | | | |
| Daftarkan peserta ke kelas | | | | | ✓ | | |
| Kloning kelas | | | ✓ | | ✓ | | ✓ |
| Terbitkan materi dan buat tugas | | ◐ ¹ | ✓ | | | | |
| Kirim pengumuman kelas | | ◐ ¹ | ✓ | | | | |
| Kumpulkan tugas | ✓ | ✓ | | | | | |
| Tinjau pengumpulan dan beri nilai draf | | ◐ ¹ | ✓ | | | | |
| Finalisasi nilai | | | ✓ | | | | |
| Ajukan perubahan nilai final | | | ✓ | | | | |
| Putuskan perubahan nilai final | | | | ✓ | | | |
| Eksekusi perubahan nilai yang disetujui | | | | | ✓ | | |
| Kunci buku nilai kelas | | | ✓ | ✓ | ✓ | | |
| Atur asisten dan izin delegasi | | | ✓ | | | | ✓ |
| Presensi sebagai peserta | ✓ | ✓ | | | | | |
| Buka sesi presensi | | ◐ ¹ | ✓ | | | ✓ ² | ✓ ² |
| Verifikasi presensi | | ✓ | ✓ | | | | ✓ |
| Setujui izin ketidakhadiran | | ✓ | ✓ | | | | |
| Buat kuis atau ujian | | | ✓ | | | | ✓ |
| Kerjakan kuis atau ujian | ✓ | ✓ | | | | | |
| Pantau ujian langsung | | ✓ | ✓ | ✓ | ✓ | | ✓ |
| Intervensi peserta ujian | | | ✓ | | | | |
| Buat polling langsung | | ✓ | ✓ | | | | ✓ |
| Jalankan cek kemiripan tugas | | ✓ | ✓ | | | | ✓ |
| Isi evaluasi dosen | ✓ | ✓ | | | | | |
| Kelola periode evaluasi dosen | | | | ✓ | | | ✓ |
| Buat pengajuan layanan | ✓ | ✓ | | | | | |
| Proses pengajuan layanan | | | | | ✓ | | ✓ |
| Pantau risiko mahasiswa per angkatan | | | | ✓ | ✓ | | |
| Lihat mahasiswa bimbingan dan risiko kelas | | | ✓ | | | | |
| Kelola katalog perpustakaan | | | ✓ | ✓ | ✓ | | |
| Tanya asisten AI akademik | ✓ | ✓ | | | | | |
| Atur kebijakan peringatan dini | | | | | | | ✓ |
| Hitung risiko harian | | | | | | ✓ | ✓ |
| Lihat log audit | | | | | | ◐ ³ | ✓ |
| Pemantauan, integrasi, sesi login, cadangan, pengaturan sistem | | | | | | ✓ | ✓ |
| Kelola akun, peran, dan hapus pengguna | | | | | | | ✓ |
| Impersonasi pengguna | | | | | | | ✓ |

Catatan:

1. Izin Asisten didelegasikan dosen per kelas. Lima izin yang bisa didelegasikan: tinjau pengumpulan, nilai draf, kelola materi, kelola pengumuman, buat tugas. Penegakannya ada di database. Antarmuka asisten baru mencakup peninjauan pengumpulan dan nilai draf (README bagian "Batasan yang diketahui"). Finalisasi nilai, perubahan nilai, dan penugasan staf sengaja tidak bisa didelegasikan.
2. Guard `createAttendanceSessionAction` mengizinkan SYSTEM_ADMIN dan SUPER_ADMIN, tetapi tidak ada menu terkait untuk kedua peran itu.
3. System Admin membaca tampilan `audit_logs_for_sysadmin`, bukan tabel audit penuh.

---

## 12. Selisih dengan dokumen `ARSITEKTUR_PER_ROLE.md`

Hasil membandingkan dokumen buatan Antigravity dengan kode. Gunakan kolom kanan bila dokumen itu dipakai untuk laporan.

| Klaim di dokumen | Yang ditemukan di kode |
| --- | --- |
| Enam peran | Tujuh kode peran. `SYSTEM_ADMIN` (8 menu) dan `SUPER_ADMIN` (12 menu) terpisah |
| Token impersonasi berlaku 15 menit | 30 menit; wajib alasan minimal 10 karakter; bila pencatatan audit gagal, aksi dibatalkan |
| Presensi geofence ke titik Gedung D, ≤ 50 m | Jarak Haversine ke koordinat yang tersimpan pada sesi presensi (diisi dosen), radius bawaan 50 m. Bila koordinat tidak diisi, kode memakai bawaan -6.2088, 106.8456 (area Jakarta), bukan kampus UIR. Di luar radius tidak ditolak otomatis, tetapi ditandai agar diverifikasi dosen. Metodenya QR dinamis atau kode PIN |
| Anti-mock location | Heuristik: akurasi GPS di bawah 1 m atau di atas 500 m, dan lompatan kecepatan tidak wajar |
| Asisten dapat mengirim teguran saat ujian | Intervensi ujian hanya untuk Dosen. Asisten hanya memantau |
| Audit log tamper-proof | Append-only lewat trigger, dengan pengecualian terkontrol (`lawful_retention_purge`, `lawful_anonymization`). Belum ada hash chain |
| Pemantauan ujian streaming real-time | Polling setiap 5 detik |
| Dokumen PDF bertanda tangan digital | Hanya kotak tanda tangan pada tata letak; tidak ada tanda tangan kriptografis atau QR verifikasi |
| Kaprodi mengesahkan KHS | Kaprodi memutuskan perubahan nilai; yang mengeksekusi perubahan adalah Staf |
| Menu Kurikulum, Mata Kuliah (Kaprodi) serta Mahasiswa, Dosen, Pengajuan Masuk (Staf) disebut sebagai bagian arsitektur | Menunya ada, tetapi halamannya cangkang berisi ringkasan dan tautan; fungsinya ada di hub lain (ditandai kuning di diagram) |

---

## Menyimpan di repo

Simpan sebagai `docs/USE_CASE_SIAJAR.md`. GitHub dan pratinjau markdown Antigravity merender blok `mermaid` langsung. Bila pratinjau menampilkan error pada satu blok, laporkan nomor diagramnya.
