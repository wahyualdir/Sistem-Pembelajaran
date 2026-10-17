// Seed Data SIAKAD - Berisi 3 Prodi, 8 Dosen, 30 Mahasiswa, 20 Mata Kuliah, Jadwal, Konfigurasi Akademik

export interface SeedConfig {
  kunci: string;
  nilai: string;
  deskripsi: string;
}

export const SEED_CONFIGS: SeedConfig[] = [
  {
    kunci: "aturan_sks",
    nilai: JSON.stringify([
      { minIps: 3.0, maxSks: 24 },
      { minIps: 2.5, maxSks: 21 },
      { minIps: 2.0, maxSks: 18 },
      { minIps: 0.0, maxSks: 15 },
    ]),
    deskripsi: "Batas pengambilan SKS berdasarkan IPS semester sebelumnya",
  },
  {
    kunci: "skala_nilai",
    nilai: JSON.stringify([
      { huruf: "A", bobot: 4.0, min: 85.0, max: 100.0 },
      { huruf: "A-", bobot: 3.7, min: 80.0, max: 84.99 },
      { huruf: "B+", bobot: 3.3, min: 75.0, max: 79.99 },
      { huruf: "B", bobot: 3.0, min: 70.0, max: 74.99 },
      { huruf: "B-", bobot: 2.7, min: 65.0, max: 69.99 },
      { huruf: "C+", bobot: 2.3, min: 60.0, max: 64.99 },
      { huruf: "C", bobot: 2.0, min: 55.0, max: 59.99 },
      { huruf: "D", bobot: 1.0, min: 40.0, max: 54.99 },
      { huruf: "E", bobot: 0.0, min: 0.0, max: 39.99 },
    ]),
    deskripsi: "Skala konversi nilai angka ke huruf dan bobot mutu",
  },
  {
    kunci: "batas_kehadiran_uas",
    nilai: JSON.stringify({ persentaseMinimal: 75, izinDihitungHadir: false }),
    deskripsi: "Persentase minimal kehadiran mahasiswa untuk syarat mengikuti UAS",
  },
  {
    kunci: "prasyarat_default",
    nilai: JSON.stringify({ nilaiMinimal: "D" }),
    deskripsi: "Nilai huruf minimal untuk kelulusan mata kuliah prasyarat",
  },
];

export const SEED_PRODI = [
  { id: "prodi-ti", kode: "TI", nama: "Teknik Informatika", jenjang: "S1" },
  { id: "prodi-si", kode: "SI", nama: "Sistem Informasi", jenjang: "S1" },
  { id: "prodi-tk", kode: "TK", nama: "Teknik Komputer", jenjang: "S1" },
];

export const SEED_USERS = [
  // Admin
  {
    id: "usr-superadmin",
    email: "superadmin@siajar.test",
    peran: "ADMIN" as const,
    passwordHash: null,
    aktif: true,
  },
  {
    id: "usr-admin-1",
    email: "admin@siakad.uir.ac.id",
    peran: "ADMIN" as const,
    passwordHash: null,
    aktif: true,
  },
  // 8 Dosen
  {
    id: "usr-dsn-1",
    email: "ardiansyah@dosen.uir.ac.id",
    peran: "DOSEN" as const,
    passwordHash: "$2a$10$Wq31f3NqXhK2Gg4N2w6oTu7P6d5h8xK9f3Z8u5e7b2v1m0z9l8q2W",
    aktif: true,
  },
  {
    id: "usr-dsn-2",
    email: "nurul.hidayati@dosen.uir.ac.id",
    peran: "DOSEN" as const,
    passwordHash: "$2a$10$Wq31f3NqXhK2Gg4N2w6oTu7P6d5h8xK9f3Z8u5e7b2v1m0z9l8q2W",
    aktif: true,
  },
  {
    id: "usr-dsn-3",
    email: "hendra.gunawan@dosen.uir.ac.id",
    peran: "DOSEN" as const,
    passwordHash: "$2a$10$Wq31f3NqXhK2Gg4N2w6oTu7P6d5h8xK9f3Z8u5e7b2v1m0z9l8q2W",
    aktif: true,
  },
  {
    id: "usr-dsn-4",
    email: "fajar.ramadhan@dosen.uir.ac.id",
    peran: "DOSEN" as const,
    passwordHash: "$2a$10$Wq31f3NqXhK2Gg4N2w6oTu7P6d5h8xK9f3Z8u5e7b2v1m0z9l8q2W",
    aktif: true,
  },
  {
    id: "usr-dsn-5",
    email: "rina.fitriani@dosen.uir.ac.id",
    peran: "DOSEN" as const,
    passwordHash: "$2a$10$Wq31f3NqXhK2Gg4N2w6oTu7P6d5h8xK9f3Z8u5e7b2v1m0z9l8q2W",
    aktif: true,
  },
  {
    id: "usr-dsn-6",
    email: "budi.santoso@dosen.uir.ac.id",
    peran: "DOSEN" as const,
    passwordHash: "$2a$10$Wq31f3NqXhK2Gg4N2w6oTu7P6d5h8xK9f3Z8u5e7b2v1m0z9l8q2W",
    aktif: true,
  },
  {
    id: "usr-dsn-7",
    email: "siti.nurhaliza@dosen.uir.ac.id",
    peran: "DOSEN" as const,
    passwordHash: "$2a$10$Wq31f3NqXhK2Gg4N2w6oTu7P6d5h8xK9f3Z8u5e7b2v1m0z9l8q2W",
    aktif: true,
  },
  {
    id: "usr-dsn-8",
    email: "ahmad.fauzi@dosen.uir.ac.id",
    peran: "DOSEN" as const,
    passwordHash: "$2a$10$Wq31f3NqXhK2Gg4N2w6oTu7P6d5h8xK9f3Z8u5e7b2v1m0z9l8q2W",
    aktif: true,
  },
];

export const SEED_DOSEN = [
  {
    id: "dsn-1",
    nidn: "0012058001",
    nama: "Dr. Ardiansyah, S.T., M.Kom.",
    email: "ardiansyah@dosen.uir.ac.id",
    penandaWali: true,
    penandaKaprodi: true,
    statusAktif: true,
    penggunaId: "usr-dsn-1",
    kaprodiProdiId: "prodi-ti",
  },
  {
    id: "dsn-2",
    nidn: "0023088202",
    nama: "Nurul Hidayati, M.Kom.",
    email: "nurul.hidayati@dosen.uir.ac.id",
    penandaWali: true,
    penandaKaprodi: true,
    statusAktif: true,
    penggunaId: "usr-dsn-2",
    kaprodiProdiId: "prodi-si",
  },
  {
    id: "dsn-3",
    nidn: "0015018103",
    nama: "Hendra Gunawan, M.T.",
    email: "hendra.gunawan@dosen.uir.ac.id",
    penandaWali: true,
    penandaKaprodi: true,
    statusAktif: true,
    penggunaId: "usr-dsn-3",
    kaprodiProdiId: "prodi-tk",
  },
  {
    id: "dsn-4",
    nidn: "0004078504",
    nama: "Fajar Ramadhan, M.Kom.",
    email: "fajar.ramadhan@dosen.uir.ac.id",
    penandaWali: true,
    penandaKaprodi: false,
    statusAktif: true,
    penggunaId: "usr-dsn-4",
  },
  {
    id: "dsn-5",
    nidn: "0019098305",
    nama: "Dr. Rina Fitriani, M.Sc.",
    email: "rina.fitriani@dosen.uir.ac.id",
    penandaWali: true,
    penandaKaprodi: false,
    statusAktif: true,
    penggunaId: "usr-dsn-5",
  },
  {
    id: "dsn-6",
    nidn: "0027048606",
    nama: "Budi Santoso, M.Kom.",
    email: "budi.santoso@dosen.uir.ac.id",
    penandaWali: true,
    penandaKaprodi: false,
    statusAktif: true,
    penggunaId: "usr-dsn-6",
  },
  {
    id: "dsn-7",
    nidn: "0011118807",
    nama: "Siti Nurhaliza, M.Cs.",
    email: "siti.nurhaliza@dosen.uir.ac.id",
    penandaWali: true,
    penandaKaprodi: false,
    statusAktif: true,
    penggunaId: "usr-dsn-7",
  },
  {
    id: "dsn-8",
    nidn: "0008028708",
    nama: "Ahmad Fauzi, S.T., M.Kom.",
    email: "ahmad.fauzi@dosen.uir.ac.id",
    penandaWali: true,
    penandaKaprodi: false,
    statusAktif: true,
    penggunaId: "usr-dsn-8",
  },
];

export const SEED_MAHASISWA = [
  // 30 Mahasiswa Realistis
  { id: "mhs-1", nim: "223510001", nama: "Ahmad Mahasiswa", email: "mhs2024001@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-1" },
  { id: "mhs-2", nim: "223510002", nama: "Muhammad Rizky Pratama", email: "rizky.pratama@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-1" },
  { id: "mhs-3", nim: "223510003", nama: "Annisa Rahmadani", email: "annisa.r@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-1" },
  { id: "mhs-4", nim: "223510004", nama: "Dimas Anggara Putra", email: "dimas.ap@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-1" },
  { id: "mhs-5", nim: "223510005", nama: "Tiara Indah Lestari", email: "tiara.il@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-4" },
  { id: "mhs-6", nim: "223510006", nama: "Bagus Setiawan", email: "bagus.setiawan@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-4" },
  { id: "mhs-7", nim: "223510007", nama: "Dian Safitri", email: "dian.safitri@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-4" },
  { id: "mhs-8", nim: "223510008", nama: "Rahmat Hidayatullah", email: "rahmat.h@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-4" },
  { id: "mhs-9", nim: "223510009", nama: "Nurul Aini", email: "nurul.aini@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-5" },
  { id: "mhs-10", nim: "223510010", nama: "Farhan Maulana", email: "farhan.m@student.uir.ac.id", angkatan: 2022, prodiId: "prodi-ti", dosenWaliId: "dsn-5" },

  // SI (10 mhs)
  { id: "mhs-11", nim: "233110001", nama: "Salsabila Putri", email: "salsabila.p@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-2" },
  { id: "mhs-12", nim: "233110002", nama: "Aditya Dharmawan", email: "aditya.d@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-2" },
  { id: "mhs-13", nim: "233110003", nama: "Cut Mutia Zahra", email: "cut.mutia@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-2" },
  { id: "mhs-14", nim: "233110004", nama: "Fikri Haikal", email: "fikri.haikal@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-2" },
  { id: "mhs-15", nim: "233110005", nama: "Nabila Syahrani", email: "nabila.s@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-6" },
  { id: "mhs-16", nim: "233110006", nama: "Yoga Pratama", email: "yoga.pratama@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-6" },
  { id: "mhs-17", nim: "233110007", nama: "Dewi Anggraini", email: "dewi.a@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-6" },
  { id: "mhs-18", nim: "233110008", nama: "Ilham Kurniawan", email: "ilham.k@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-6" },
  { id: "mhs-19", nim: "233110009", nama: "Gita Permatasari", email: "gita.p@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-7" },
  { id: "mhs-20", nim: "233110010", nama: "Rian Firmansyah", email: "rian.f@student.uir.ac.id", angkatan: 2023, prodiId: "prodi-si", dosenWaliId: "dsn-7" },

  // TK (10 mhs)
  { id: "mhs-21", nim: "243210001", nama: "Teguh Santoso", email: "teguh.s@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-3" },
  { id: "mhs-22", nim: "243210002", nama: "Zahra Nurhaliza", email: "zahra.n@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-3" },
  { id: "mhs-23", nim: "243210003", nama: "Eko Prasetyo", email: "eko.p@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-3" },
  { id: "mhs-24", nim: "243210004", nama: "Melati Kusuma", email: "melati.k@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-3" },
  { id: "mhs-25", nim: "243210005", nama: "Iqbal Ramadhani", email: "iqbal.r@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-8" },
  { id: "mhs-26", nim: "243210006", nama: "Aulia Rahma", email: "aulia.rahma@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-8" },
  { id: "mhs-27", nim: "243210007", nama: "Satria Nugraha", email: "satria.n@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-8" },
  { id: "mhs-28", nim: "243210008", nama: "Putri Ayuningtyas", email: "putri.a@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-8" },
  { id: "mhs-29", nim: "243210009", nama: "Dicky Wahyudi", email: "dicky.w@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-8" },
  { id: "mhs-30", nim: "243210010", nama: "Cindy Claudia", email: "cindy.c@student.uir.ac.id", angkatan: 2024, prodiId: "prodi-tk", dosenWaliId: "dsn-8" },
];

export const SEED_MATA_KULIAH = [
  // TI
  { id: "mk-1", kode: "TIF101", nama: "Algoritma & Pemrograman", sks: 3, jenis: "WAJIB" as const, semesterPaket: 1, prodiId: "prodi-ti" },
  { id: "mk-2", kode: "TIF102", nama: "Struktur Data", sks: 3, jenis: "WAJIB" as const, semesterPaket: 2, prodiId: "prodi-ti" },
  { id: "mk-3", kode: "TIF201", nama: "Pemrograman Berorientasi Objek", sks: 3, jenis: "WAJIB" as const, semesterPaket: 3, prodiId: "prodi-ti" },
  { id: "mk-4", kode: "TIF202", nama: "Basis Data", sks: 3, jenis: "WAJIB" as const, semesterPaket: 3, prodiId: "prodi-ti" },
  { id: "mk-5", kode: "TIF203", nama: "Sistem Basis Data Lanjut", sks: 3, jenis: "WAJIB" as const, semesterPaket: 4, prodiId: "prodi-ti" },
  { id: "mk-6", kode: "TIF301", nama: "Rekayasa Perangkat Lunak", sks: 3, jenis: "WAJIB" as const, semesterPaket: 5, prodiId: "prodi-ti" },
  { id: "mk-7", kode: "TIF302", nama: "Pengembangan Web Modern", sks: 3, jenis: "WAJIB" as const, semesterPaket: 5, prodiId: "prodi-ti" },
  { id: "mk-8", kode: "TIF303", nama: "Kecerdasan Buatan", sks: 3, jenis: "WAJIB" as const, semesterPaket: 5, prodiId: "prodi-ti" },
  { id: "mk-9", kode: "TIF401", nama: "Pembelajaran Mesin", sks: 3, jenis: "PILIHAN" as const, semesterPaket: 7, prodiId: "prodi-ti" },
  { id: "mk-10", kode: "TIF402", nama: "Keamanan Siber", sks: 3, jenis: "PILIHAN" as const, semesterPaket: 7, prodiId: "prodi-ti" },

  // SI
  { id: "mk-11", kode: "SIF101", nama: "Pengantar Sistem Informasi", sks: 3, jenis: "WAJIB" as const, semesterPaket: 1, prodiId: "prodi-si" },
  { id: "mk-12", kode: "SIF201", nama: "Analisis & Perancangan Sistem", sks: 3, jenis: "WAJIB" as const, semesterPaket: 3, prodiId: "prodi-si" },
  { id: "mk-13", kode: "SIF202", nama: "Manajemen Proses Bisnis", sks: 3, jenis: "WAJIB" as const, semesterPaket: 3, prodiId: "prodi-si" },
  { id: "mk-14", kode: "SIF301", nama: "Sistem Informasi Manajemen", sks: 3, jenis: "WAJIB" as const, semesterPaket: 5, prodiId: "prodi-si" },
  { id: "mk-15", kode: "SIF302", nama: "Enterprise Resource Planning", sks: 3, jenis: "PILIHAN" as const, semesterPaket: 5, prodiId: "prodi-si" },

  // TK
  { id: "mk-16", kode: "TKF101", nama: "Rangkaian Digital", sks: 3, jenis: "WAJIB" as const, semesterPaket: 1, prodiId: "prodi-tk" },
  { id: "mk-17", kode: "TKF201", nama: "Organisasi & Arsitektur Komputer", sks: 3, jenis: "WAJIB" as const, semesterPaket: 3, prodiId: "prodi-tk" },
  { id: "mk-18", kode: "TKF202", nama: "Jaringan Komputer", sks: 3, jenis: "WAJIB" as const, semesterPaket: 3, prodiId: "prodi-tk" },
  { id: "mk-19", kode: "TKF301", nama: "Sistem Tertanam & IoT", sks: 3, jenis: "WAJIB" as const, semesterPaket: 5, prodiId: "prodi-tk" },
  { id: "mk-20", kode: "TKF302", nama: "Robotika", sks: 3, jenis: "PILIHAN" as const, semesterPaket: 5, prodiId: "prodi-tk" },
];

export const SEED_PRASYARAT = [
  { id: "pra-1", mataKuliahId: "mk-2", prasyaratId: "mk-1", nilaiMinimal: "D" }, // Struktur Data butuh Algo (D)
  { id: "pra-2", mataKuliahId: "mk-3", prasyaratId: "mk-1", nilaiMinimal: "D" }, // PBO butuh Algo (D)
  { id: "pra-3", mataKuliahId: "mk-5", prasyaratId: "mk-4", nilaiMinimal: "D" }, // Basis Data Lanjut butuh Basis Data (D)
  { id: "pra-4", mataKuliahId: "mk-7", prasyaratId: "mk-3", nilaiMinimal: "D" }, // Web butuh PBO (D)
  { id: "pra-5", mataKuliahId: "mk-9", prasyaratId: "mk-8", nilaiMinimal: "D" }, // ML butuh AI (D)
  { id: "pra-6", mataKuliahId: "mk-12", prasyaratId: "mk-11", nilaiMinimal: "D" }, // APSI butuh PSI (D)
  { id: "pra-7", mataKuliahId: "mk-17", prasyaratId: "mk-16", nilaiMinimal: "D" }, // Orkom butuh Rangkaian Digital (D)
];

export const SEED_RUANG = [
  { id: "rng-1", kode: "LAB-K1", nama: "Laboratorium Komputer 1", kapasitas: 35, gedung: "Gedung Fakultas Lt. 2" },
  { id: "rng-2", kode: "LAB-K2", nama: "Laboratorium Komputer 2", kapasitas: 35, gedung: "Gedung Fakultas Lt. 2" },
  { id: "rng-3", kode: "RT-201", nama: "Ruang Teori 201", kapasitas: 40, gedung: "Gedung Kuliah Bersama Lt. 2" },
  { id: "rng-4", kode: "RT-202", nama: "Ruang Teori 202", kapasitas: 40, gedung: "Gedung Kuliah Bersama Lt. 2" },
];

export const SEED_TAHUN_AJARAN = {
  id: "ta-2026-ganjil",
  kode: "2026/2027",
  semester: "GANJIL" as const,
  tanggalMulai: new Date("2026-09-01"),
  tanggalSelesai: new Date("2027-01-31"),
  aktif: true,
};

export const SEED_KALENDER = [
  {
    id: "kal-1",
    tahunAjaranId: "ta-2026-ganjil",
    jenis: "KRS" as const,
    keterangan: "Periode Pengisian KRS Mahasiswa",
    mulai: new Date("2026-09-01"),
    selesai: new Date("2026-10-31"), // Dibuka untuk periode berjalan
  },
  {
    id: "kal-2",
    tahunAjaranId: "ta-2026-ganjil",
    jenis: "UTS" as const,
    keterangan: "Ujian Tengah Semester Ganjil 2026/2027",
    mulai: new Date("2026-11-01"),
    selesai: new Date("2026-11-15"),
  },
  {
    id: "kal-3",
    tahunAjaranId: "ta-2026-ganjil",
    jenis: "UAS" as const,
    keterangan: "Ujian Akhir Semester Ganjil 2026/2027",
    mulai: new Date("2027-01-10"),
    selesai: new Date("2027-01-25"),
  },
];
