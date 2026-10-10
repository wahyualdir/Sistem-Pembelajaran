import {
  hitungNilaiAkhir,
  konversiNilaiKeHuruf,
  validasiTotalBobot,
  hitungIPS,
  hitungIPK,
  NilaiTranskripItem,
} from "@/lib/akademik/nilai";
import { JadwalStore } from "../jadwal/jadwal-store";
import { MasterStore } from "../master/master-store";
import { SEED_TAHUN_AJARAN } from "@/lib/db/seed-data";

export interface KomponenItem {
  id: string;
  kelasId: string;
  nama: string;
  bobotPersen: number;
}

export interface NilaiMahasiswa {
  krsDetailId: string;
  mahasiswaId: string;
  nim: string;
  nama: string;
  prodiNama: string;
  skorKomponen: Record<string, number>; // komponenId -> angka
  nilaiAkhir?: number | null;
  nilaiHuruf?: string | null;
  bobot?: number | null;
}

export interface KelasNilaiData {
  kelasId: string;
  kodeKelas: string;
  mataKuliahId: string;
  kodeMataKuliah: string;
  namaMataKuliah: string;
  sks: number;
  dosenId: string;
  namaDosen: string;
  tahunAjaranId: string;
  tahunAjaranKode: string;
  statusFinal: boolean;
  tanggalFinal?: string | null;
  komponen: KomponenItem[];
  peserta: NilaiMahasiswa[];
}

export interface LogAuditItem {
  id: string;
  penggunaId: string;
  penggunaNama: string;
  peran: string;
  aksi: string;
  entitas: string;
  entitasId: string;
  keterangan: string;
  nilaiLama?: string | null;
  nilaiBaru?: string | null;
  waktu: string;
}

// Memory store untuk Log Audit
const logAuditStore: LogAuditItem[] = [
  {
    id: "log-1",
    penggunaId: "usr-admin-1",
    penggunaNama: "Administrator SIAKAD",
    peran: "ADMIN",
    aksi: "KOREKSI_NILAI",
    entitas: "KRSDetail",
    entitasId: "krsd-past-tif101-mhs1",
    keterangan: "Koreksi nilai UAS Pemrograman Dasar karena salah input berkas jawaban",
    nilaiLama: "Nilai Akhir: 68.00 (B-)",
    nilaiBaru: "Nilai Akhir: 86.50 (A)",
    waktu: "2026-09-15 14:22:00",
  },
];

// Memory store untuk kelas aktif nilai
const kelasNilaiStore: KelasNilaiData[] = [
  {
    kelasId: "kls-tif101-a",
    kodeKelas: "A",
    mataKuliahId: "mk-tif101",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Pemrograman Dasar",
    sks: 3,
    dosenId: "dsn-1",
    namaDosen: "Dr. Ardiansyah, S.T., M.Kom.",
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    statusFinal: false,
    komponen: [
      { id: "komp-1", kelasId: "kls-tif101-a", nama: "Tugas & Praktikum", bobotPersen: 20 },
      { id: "komp-2", kelasId: "kls-tif101-a", nama: "UTS", bobotPersen: 30 },
      { id: "komp-3", kelasId: "kls-tif101-a", nama: "UAS", bobotPersen: 50 },
    ],
    peserta: [
      {
        krsDetailId: "krsd-1",
        mahasiswaId: "mhs-1",
        nim: "223510001",
        nama: "Wahyu Aldi Riyanto",
        prodiNama: "Teknik Informatika",
        skorKomponen: {
          "komp-1": 85,
          "komp-2": 82,
          "komp-3": 88,
        },
        nilaiAkhir: 85.6,
        nilaiHuruf: "A",
        bobot: 4.0,
      },
      {
        krsDetailId: "krsd-mhs2-tif101",
        mahasiswaId: "mhs-2",
        nim: "223510002",
        nama: "Siti Nur Aisyah",
        prodiNama: "Teknik Informatika",
        skorKomponen: {
          "komp-1": 80,
          "komp-2": 78,
          "komp-3": 75,
        },
        nilaiAkhir: 76.9,
        nilaiHuruf: "B+",
        bobot: 3.3,
      },
      {
        krsDetailId: "krsd-mhs3-tif101",
        mahasiswaId: "mhs-3",
        nim: "223510003",
        nama: "Budi Pratama",
        prodiNama: "Teknik Informatika",
        skorKomponen: {
          "komp-1": 70,
          "komp-2": 65,
          "komp-3": 68,
        },
        nilaiAkhir: 67.5,
        nilaiHuruf: "B-",
        bobot: 2.7,
      },
    ],
  },
  {
    kelasId: "kls-tif201-a",
    kodeKelas: "A",
    mataKuliahId: "mk-tif201",
    kodeMataKuliah: "TIF201",
    namaMataKuliah: "Struktur Data & Algoritma",
    sks: 3,
    dosenId: "dsn-2",
    namaDosen: "Nurul Hidayati, M.Kom.",
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    statusFinal: true,
    tanggalFinal: "2026-09-20 10:15:00",
    komponen: [
      { id: "komp-201-1", kelasId: "kls-tif201-a", nama: "Tugas", bobotPersen: 20 },
      { id: "komp-201-2", kelasId: "kls-tif201-a", nama: "Kuis", bobotPersen: 10 },
      { id: "komp-201-3", kelasId: "kls-tif201-a", nama: "UTS", bobotPersen: 30 },
      { id: "komp-201-4", kelasId: "kls-tif201-a", nama: "UAS", bobotPersen: 40 },
    ],
    peserta: [
      {
        krsDetailId: "krsd-2",
        mahasiswaId: "mhs-1",
        nim: "223510001",
        nama: "Wahyu Aldi Riyanto",
        prodiNama: "Teknik Informatika",
        skorKomponen: {
          "komp-201-1": 90,
          "komp-201-2": 85,
          "komp-201-3": 88,
          "komp-201-4": 86,
        },
        nilaiAkhir: 87.3,
        nilaiHuruf: "A",
        bobot: 4.0,
      },
      {
        krsDetailId: "krsd-mhs2-tif201",
        mahasiswaId: "mhs-2",
        nim: "223510002",
        nama: "Siti Nur Aisyah",
        prodiNama: "Teknik Informatika",
        skorKomponen: {
          "komp-201-1": 75,
          "komp-201-2": 70,
          "komp-201-3": 72,
          "komp-201-4": 74,
        },
        nilaiAkhir: 73.2,
        nilaiHuruf: "B",
        bobot: 3.0,
      },
    ],
  },
];

// Riwayat Nilai Semester Lalu Mahasiswa untuk KHS & Transkrip Kumulatif
export interface RiwayatStudiItem {
  id: string;
  mahasiswaId: string;
  semester: number;
  tahunAjaranKode: string;
  kodeMataKuliah: string;
  namaMataKuliah: string;
  sks: number;
  nilaiAngka: number;
  nilaiHuruf: string;
  bobot: number;
}

const riwayatStudiStore: RiwayatStudiItem[] = [
  // ==========================================
  // WAHYU ALDI RIYANTO (mhs-1) - Angkatan 2022
  // Profil: Berprestasi, IPK ~3.70, Total 85 SKS Lulus
  // ==========================================

  // Semester 1 (2024/2025 Ganjil) - 21 SKS (IPS: 3.25)
  {
    id: "rw-m1-s1-1",
    mahasiswaId: "mhs-1",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Algoritma & Pemrograman",
    sks: 3,
    nilaiAngka: 52,
    nilaiHuruf: "D",
    bobot: 1.0, // Diulang di semester 3 dan mendapat A (4.0)!
  },
  {
    id: "rw-m1-s1-2",
    mahasiswaId: "mhs-1",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF102",
    namaMataKuliah: "Matematika Diskrit",
    sks: 3,
    nilaiAngka: 88,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s1-3",
    mahasiswaId: "mhs-1",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF103",
    namaMataKuliah: "Pengantar Teknologi Informasi",
    sks: 2,
    nilaiAngka: 82,
    nilaiHuruf: "A-",
    bobot: 3.7,
  },
  {
    id: "rw-m1-s1-4",
    mahasiswaId: "mhs-1",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF104",
    namaMataKuliah: "Kalkulus 1",
    sks: 3,
    nilaiAngka: 78,
    nilaiHuruf: "B+",
    bobot: 3.3,
  },
  {
    id: "rw-m1-s1-5",
    mahasiswaId: "mhs-1",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF105",
    namaMataKuliah: "Bahasa Inggris Komputer",
    sks: 2,
    nilaiAngka: 86,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s1-6",
    mahasiswaId: "mhs-1",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF106",
    namaMataKuliah: "Pendidikan Agama Islam",
    sks: 2,
    nilaiAngka: 90,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s1-7",
    mahasiswaId: "mhs-1",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF107",
    namaMataKuliah: "Pancasila & Kewarganegaraan",
    sks: 2,
    nilaiAngka: 87,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s1-8",
    mahasiswaId: "mhs-1",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF108",
    namaMataKuliah: "Dasar Sistem Komputer",
    sks: 4,
    nilaiAngka: 72,
    nilaiHuruf: "B",
    bobot: 3.0,
  },

  // Semester 2 (2024/2025 Genap) - 21 SKS (IPS: 3.60)
  {
    id: "rw-m1-s2-1",
    mahasiswaId: "mhs-1",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF201",
    namaMataKuliah: "Struktur Data & Algoritma",
    sks: 3,
    nilaiAngka: 78,
    nilaiHuruf: "B+",
    bobot: 3.3,
  },
  {
    id: "rw-m1-s2-2",
    mahasiswaId: "mhs-1",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF202",
    namaMataKuliah: "Basis Data",
    sks: 3,
    nilaiAngka: 88,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s2-3",
    mahasiswaId: "mhs-1",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF203",
    namaMataKuliah: "Arsitektur & Organisasi Komputer",
    sks: 3,
    nilaiAngka: 83,
    nilaiHuruf: "A-",
    bobot: 3.7,
  },
  {
    id: "rw-m1-s2-4",
    mahasiswaId: "mhs-1",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF204",
    namaMataKuliah: "Kalkulus 2",
    sks: 3,
    nilaiAngka: 73,
    nilaiHuruf: "B",
    bobot: 3.0,
  },
  {
    id: "rw-m1-s2-5",
    mahasiswaId: "mhs-1",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF205",
    namaMataKuliah: "Aljabar Linier & Matriks",
    sks: 3,
    nilaiAngka: 82,
    nilaiHuruf: "A-",
    bobot: 3.7,
  },
  {
    id: "rw-m1-s2-6",
    mahasiswaId: "mhs-1",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF206",
    namaMataKuliah: "Bahasa Indonesia Akademik",
    sks: 2,
    nilaiAngka: 89,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s2-7",
    mahasiswaId: "mhs-1",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF207",
    namaMataKuliah: "Komunikasi Interpersonal",
    sks: 2,
    nilaiAngka: 86,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s2-8",
    mahasiswaId: "mhs-1",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF208",
    namaMataKuliah: "Sistem Operasi",
    sks: 2,
    nilaiAngka: 77,
    nilaiHuruf: "B+",
    bobot: 3.3,
  },

  // Semester 3 (2025/2026 Ganjil) - 23 SKS (IPS: 3.75)
  {
    id: "rw-m1-s3-1",
    mahasiswaId: "mhs-1",
    semester: 3,
    tahunAjaranKode: "2025/2026 Ganjil",
    kodeMataKuliah: "TIF101", // Mengulang TIF101 dan memperoleh nilai A (4.0)!
    namaMataKuliah: "Algoritma & Pemrograman",
    sks: 3,
    nilaiAngka: 92,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s3-2",
    mahasiswaId: "mhs-1",
    semester: 3,
    tahunAjaranKode: "2025/2026 Ganjil",
    kodeMataKuliah: "TIF301",
    namaMataKuliah: "Pemrograman Berorientasi Objek",
    sks: 3,
    nilaiAngka: 86,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s3-3",
    mahasiswaId: "mhs-1",
    semester: 3,
    tahunAjaranKode: "2025/2026 Ganjil",
    kodeMataKuliah: "TIF302",
    namaMataKuliah: "Rekayasa Perangkat Lunak",
    sks: 3,
    nilaiAngka: 79,
    nilaiHuruf: "B+",
    bobot: 3.3,
  },
  {
    id: "rw-m1-s3-4",
    mahasiswaId: "mhs-1",
    semester: 3,
    tahunAjaranKode: "2025/2026 Ganjil",
    kodeMataKuliah: "TIF303",
    namaMataKuliah: "Jaringan Komputer",
    sks: 3,
    nilaiAngka: 87,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s3-5",
    mahasiswaId: "mhs-1",
    semester: 3,
    tahunAjaranKode: "2025/2026 Ganjil",
    kodeMataKuliah: "TIF304",
    namaMataKuliah: "Probabilitas & Statistika",
    sks: 3,
    nilaiAngka: 82,
    nilaiHuruf: "A-",
    bobot: 3.7,
  },
  {
    id: "rw-m1-s3-6",
    mahasiswaId: "mhs-1",
    semester: 3,
    tahunAjaranKode: "2025/2026 Ganjil",
    kodeMataKuliah: "TIF305",
    namaMataKuliah: "Interaksi Manusia & Komputer",
    sks: 3,
    nilaiAngka: 90,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s3-7",
    mahasiswaId: "mhs-1",
    semester: 3,
    tahunAjaranKode: "2025/2026 Ganjil",
    kodeMataKuliah: "TIF306",
    namaMataKuliah: "Sistem Basis Data Lanjut",
    sks: 3,
    nilaiAngka: 78,
    nilaiHuruf: "B+",
    bobot: 3.3,
  },
  {
    id: "rw-m1-s3-8",
    mahasiswaId: "mhs-1",
    semester: 3,
    tahunAjaranKode: "2025/2026 Ganjil",
    kodeMataKuliah: "TIF307",
    namaMataKuliah: "Analisis Algoritma",
    sks: 2,
    nilaiAngka: 84,
    nilaiHuruf: "A-",
    bobot: 3.7,
  },

  // Semester 4 (2025/2026 Genap) - 23 SKS (IPS: 3.78)
  {
    id: "rw-m1-s4-1",
    mahasiswaId: "mhs-1",
    semester: 4,
    tahunAjaranKode: "2025/2026 Genap",
    kodeMataKuliah: "TIF401",
    namaMataKuliah: "Pemrograman Web Lanjut",
    sks: 3,
    nilaiAngka: 90,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s4-2",
    mahasiswaId: "mhs-1",
    semester: 4,
    tahunAjaranKode: "2025/2026 Genap",
    kodeMataKuliah: "TIF402",
    namaMataKuliah: "Teori Bahasa & Otomata",
    sks: 3,
    nilaiAngka: 79,
    nilaiHuruf: "B+",
    bobot: 3.3,
  },
  {
    id: "rw-m1-s4-3",
    mahasiswaId: "mhs-1",
    semester: 4,
    tahunAjaranKode: "2025/2026 Genap",
    kodeMataKuliah: "TIF403",
    namaMataKuliah: "Kecerdasan Komputasional",
    sks: 3,
    nilaiAngka: 88,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s4-4",
    mahasiswaId: "mhs-1",
    semester: 4,
    tahunAjaranKode: "2025/2026 Genap",
    kodeMataKuliah: "TIF404",
    namaMataKuliah: "Keamanan Komputer & Jaringan",
    sks: 3,
    nilaiAngka: 84,
    nilaiHuruf: "A-",
    bobot: 3.7,
  },
  {
    id: "rw-m1-s4-5",
    mahasiswaId: "mhs-1",
    semester: 4,
    tahunAjaranKode: "2025/2026 Genap",
    kodeMataKuliah: "TIF405",
    namaMataKuliah: "Pemrograman Piranti Bergerak",
    sks: 3,
    nilaiAngka: 91,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s4-6",
    mahasiswaId: "mhs-1",
    semester: 4,
    tahunAjaranKode: "2025/2026 Genap",
    kodeMataKuliah: "TIF406",
    namaMataKuliah: "Riset Operasi",
    sks: 3,
    nilaiAngka: 78,
    nilaiHuruf: "B+",
    bobot: 3.3,
  },
  {
    id: "rw-m1-s4-7",
    mahasiswaId: "mhs-1",
    semester: 4,
    tahunAjaranKode: "2025/2026 Genap",
    kodeMataKuliah: "TIF407",
    namaMataKuliah: "Tata Kelola TI",
    sks: 2,
    nilaiAngka: 86,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m1-s4-8",
    mahasiswaId: "mhs-1",
    semester: 4,
    tahunAjaranKode: "2025/2026 Genap",
    kodeMataKuliah: "TIF408",
    namaMataKuliah: "Metodologi Penelitian TI",
    sks: 3,
    nilaiAngka: 89,
    nilaiHuruf: "A",
    bobot: 4.0,
  },

  // ==========================================
  // MUHAMMAD RIZKY PRATAMA (mhs-2) - Angkatan 2022
  // Profil: Rata-rata / Biasa, IPK ~3.18
  // ==========================================
  {
    id: "rw-m2-s1-1",
    mahasiswaId: "mhs-2",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Algoritma & Pemrograman",
    sks: 3,
    nilaiAngka: 72,
    nilaiHuruf: "B",
    bobot: 3.0,
  },
  {
    id: "rw-m2-s1-2",
    mahasiswaId: "mhs-2",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF102",
    namaMataKuliah: "Matematika Diskrit",
    sks: 3,
    nilaiAngka: 76,
    nilaiHuruf: "B+",
    bobot: 3.3,
  },
  {
    id: "rw-m2-s2-1",
    mahasiswaId: "mhs-2",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF201",
    namaMataKuliah: "Struktur Data & Algoritma",
    sks: 3,
    nilaiAngka: 70,
    nilaiHuruf: "B",
    bobot: 3.0,
  },
  {
    id: "rw-m2-s2-2",
    mahasiswaId: "mhs-2",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF202",
    namaMataKuliah: "Basis Data",
    sks: 3,
    nilaiAngka: 77,
    nilaiHuruf: "B+",
    bobot: 3.3,
  },

  // ==========================================
  // ANNISA RAHMADANI (mhs-3) - Angkatan 2022
  // Profil: Sangat Berprestasi (Cum Laude), IPK ~3.92
  // ==========================================
  {
    id: "rw-m3-s1-1",
    mahasiswaId: "mhs-3",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Algoritma & Pemrograman",
    sks: 3,
    nilaiAngka: 95,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m3-s1-2",
    mahasiswaId: "mhs-3",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF102",
    namaMataKuliah: "Matematika Diskrit",
    sks: 3,
    nilaiAngka: 92,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m3-s2-1",
    mahasiswaId: "mhs-3",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF201",
    namaMataKuliah: "Struktur Data & Algoritma",
    sks: 3,
    nilaiAngka: 88,
    nilaiHuruf: "A",
    bobot: 4.0,
  },
  {
    id: "rw-m3-s2-2",
    mahasiswaId: "mhs-3",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF202",
    namaMataKuliah: "Basis Data",
    sks: 3,
    nilaiAngka: 90,
    nilaiHuruf: "A",
    bobot: 4.0,
  },

  // ==========================================
  // DIMAS ANGGARA PUTRA (mhs-4) - Angkatan 2022
  // Profil: Berisiko Akademik, IPK ~2.25
  // ==========================================
  {
    id: "rw-m4-s1-1",
    mahasiswaId: "mhs-4",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Algoritma & Pemrograman",
    sks: 3,
    nilaiAngka: 58,
    nilaiHuruf: "C",
    bobot: 2.0,
  },
  {
    id: "rw-m4-s1-2",
    mahasiswaId: "mhs-4",
    semester: 1,
    tahunAjaranKode: "2024/2025 Ganjil",
    kodeMataKuliah: "TIF102",
    namaMataKuliah: "Matematika Diskrit",
    sks: 3,
    nilaiAngka: 62,
    nilaiHuruf: "C+",
    bobot: 2.3,
  },
  {
    id: "rw-m4-s2-1",
    mahasiswaId: "mhs-4",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF201",
    namaMataKuliah: "Struktur Data & Algoritma",
    sks: 3,
    nilaiAngka: 55,
    nilaiHuruf: "C",
    bobot: 2.0,
  },
  {
    id: "rw-m4-s2-2",
    mahasiswaId: "mhs-4",
    semester: 2,
    tahunAjaranKode: "2024/2025 Genap",
    kodeMataKuliah: "TIF202",
    namaMataKuliah: "Basis Data",
    sks: 3,
    nilaiAngka: 64,
    nilaiHuruf: "C+",
    bobot: 2.3,
  },
];

export const NilaiStore = {
  // Ambil data nilai kelas berdasarkan kelasId
  getKelasNilai: (kelasId: string): KelasNilaiData | undefined => {
    let kelasNilai = kelasNilaiStore.find((k) => k.kelasId === kelasId);
    if (!kelasNilai) {
      // Buat kelas nilai baru jika kelas ada di JadwalStore
      const kelas = JadwalStore.getKelasById(kelasId);
      if (kelas) {
        kelasNilai = {
          kelasId: kelas.id,
          kodeKelas: kelas.kode,
          mataKuliahId: kelas.mataKuliahId,
          kodeMataKuliah: kelas.kodeMataKuliah,
          namaMataKuliah: kelas.namaMataKuliah,
          sks: kelas.sks,
          dosenId: kelas.dosenId,
          namaDosen: kelas.namaDosen,
          tahunAjaranId: SEED_TAHUN_AJARAN.id,
          tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
          statusFinal: false,
          komponen: [
            { id: `komp-${kelasId}-1`, kelasId, nama: "Tugas", bobotPersen: 20 },
            { id: `komp-${kelasId}-2`, kelasId, nama: "UTS", bobotPersen: 30 },
            { id: `komp-${kelasId}-3`, kelasId, nama: "UAS", bobotPersen: 50 },
          ],
          peserta: [
            {
              krsDetailId: `krsd-${kelasId}-mhs1`,
              mahasiswaId: "mhs-1",
              nim: "223510001",
              nama: "Wahyu Aldi Riyanto",
              prodiNama: "Teknik Informatika",
              skorKomponen: {},
            },
          ],
        };
        kelasNilaiStore.push(kelasNilai);
      }
    }
    return kelasNilai;
  },

  // Ambil semua kelas yang diampu oleh seorang Dosen
  getKelasByDosen: (dosenId: string): KelasNilaiData[] => {
    // Sinkronkan dulu dari JadwalStore agar semua kelas dosen muncul
    const allKelas = JadwalStore.getKelas();
    for (const k of allKelas) {
      if (k.dosenId === dosenId) {
        NilaiStore.getKelasNilai(k.id);
      }
    }
    return kelasNilaiStore.filter((k) => k.dosenId === dosenId);
  },

  // Dosen memperbarui komponen nilai kelas
  updateKomponen: (
    kelasId: string,
    komponenBaru: { nama: string; bobotPersen: number }[]
  ): { success: boolean; message: string } => {
    const kelasNilai = NilaiStore.getKelasNilai(kelasId);
    if (!kelasNilai) {
      return { success: false, message: "Kelas tidak ditemukan" };
    }
    if (kelasNilai.statusFinal) {
      return {
        success: false,
        message: "Komponen tidak dapat diubah karena nilai kelas sudah difinalisasi/terkunci.",
      };
    }

    const totalBobot = komponenBaru.reduce((sum, item) => sum + item.bobotPersen, 0);
    if (!validasiTotalBobot(komponenBaru.map((k) => k.bobotPersen))) {
      return {
        success: false,
        message: `Total bobot komponen harus tepat 100%, saat ini ${totalBobot}%`,
      };
    }

    // Set komponen baru
    kelasNilai.komponen = komponenBaru.map((item, index) => ({
      id: `komp-${kelasId}-${index + 1}`,
      kelasId,
      nama: item.nama,
      bobotPersen: item.bobotPersen,
    }));

    return { success: true, message: "Komponen nilai berhasil diperbarui" };
  },

  // Dosen menyimpan draf nilai mahasiswa
  simpanDraf: (
    kelasId: string,
    nilaiData: { krsDetailId: string; skorKomponen: Record<string, number> }[]
  ): { success: boolean; message: string } => {
    const kelasNilai = NilaiStore.getKelasNilai(kelasId);
    if (!kelasNilai) return { success: false, message: "Kelas tidak ditemukan" };

    if (kelasNilai.statusFinal) {
      return {
        success: false,
        message: "Nilai kelas sudah terkunci dan tidak dapat diubah dosen.",
      };
    }

    for (const item of nilaiData) {
      const peserta = kelasNilai.peserta.find((p) => p.krsDetailId === item.krsDetailId);
      if (peserta) {
        peserta.skorKomponen = { ...peserta.skorKomponen, ...item.skorKomponen };

        // Kalkulasi sementara jika semua komponen sudah terisi
        const komponenInput = kelasNilai.komponen.map((k) => ({
          angka: peserta.skorKomponen[k.id] ?? 0,
          bobotPersen: k.bobotPersen,
        }));

        const isSemuaTerisi = kelasNilai.komponen.every(
          (k) => peserta.skorKomponen[k.id] !== undefined
        );

        if (isSemuaTerisi) {
          const hitung = hitungNilaiAkhir(komponenInput);
          if (hitung.valid) {
            peserta.nilaiAkhir = hitung.nilaiAkhir;
            peserta.nilaiHuruf = hitung.huruf;
            peserta.bobot = hitung.bobot;
          }
        }
      }
    }

    return { success: true, message: "Draf nilai berhasil disimpan" };
  },

  // Dosen melakukan finalisasi nilai kelas
  finalisasiNilai: (
    kelasId: string,
    dosenNama: string
  ): { success: boolean; message: string } => {
    const kelasNilai = NilaiStore.getKelasNilai(kelasId);
    if (!kelasNilai) return { success: false, message: "Kelas tidak ditemukan" };

    if (kelasNilai.statusFinal) {
      return { success: false, message: "Nilai kelas sudah difinalisasi sebelumnya" };
    }

    // 1. Validasi total bobot komponen tepat 100%
    const totalBobot = kelasNilai.komponen.reduce((sum, k) => sum + k.bobotPersen, 0);
    if (!validasiTotalBobot(kelasNilai.komponen.map((k) => k.bobotPersen))) {
      return {
        success: false,
        message: `Total bobot komponen harus 100% sebelum finalisasi, saat ini ${totalBobot}%`,
      };
    }

    // 2. Validasi setiap peserta memiliki nilai di semua komponen
    for (const peserta of kelasNilai.peserta) {
      for (const komp of kelasNilai.komponen) {
        const val = peserta.skorKomponen[komp.id];
        if (val === undefined || val === null || isNaN(val)) {
          return {
            success: false,
            message: `Mahasiswa ${peserta.nama} (${peserta.nim}) belum memiliki nilai pada komponen "${komp.nama}"`,
          };
        }
        if (val < 0 || val > 100) {
          return {
            success: false,
            message: `Nilai ${komp.nama} untuk ${peserta.nama} harus antara 0 dan 100`,
          };
        }
      }
    }

    // 3. Hitung nilai akhir permanen untuk seluruh mahasiswa
    for (const peserta of kelasNilai.peserta) {
      const komponenInput = kelasNilai.komponen.map((k) => ({
        angka: peserta.skorKomponen[k.id],
        bobotPersen: k.bobotPersen,
      }));
      const hasil = hitungNilaiAkhir(komponenInput);
      peserta.nilaiAkhir = hasil.nilaiAkhir;
      peserta.nilaiHuruf = hasil.huruf;
      peserta.bobot = hasil.bobot;
    }

    // 4. Kunci nilai kelas
    kelasNilai.statusFinal = true;
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    kelasNilai.tanggalFinal = nowStr;

    // Catat ke Log Audit
    NilaiStore.tambahLogAudit({
      penggunaId: kelasNilai.dosenId,
      penggunaNama: dosenNama,
      peran: "DOSEN",
      aksi: "FINALISASI_NILAI",
      entitas: "Kelas",
      entitasId: kelasId,
      keterangan: `Finalisasi nilai kelas ${kelasNilai.kodeMataKuliah} (${kelasNilai.namaMataKuliah}) Kelas ${kelasNilai.kodeKelas}`,
      nilaiLama: "Status: DRAF",
      nilaiBaru: `Status: TERKUNCI, Peserta: ${kelasNilai.peserta.length} mhs`,
    });

    return { success: true, message: "Nilai kelas berhasil difinalisasi dan terkunci" };
  },

  // Admin melakukan koreksi nilai terkunci dengan alasan tercatat di Log Audit
  koreksiNilaiAdmin: (params: {
    kelasId: string;
    krsDetailId: string;
    skorKomponenBaru: Record<string, number>;
    alasan: string;
    adminId: string;
    adminNama: string;
  }): { success: boolean; message: string } => {
    const { kelasId, krsDetailId, skorKomponenBaru, alasan, adminId, adminNama } = params;

    if (!alasan || alasan.trim().length < 5) {
      return {
        success: false,
        message: "Alasan koreksi nilai wajib diisi minimal 5 karakter.",
      };
    }

    const kelasNilai = NilaiStore.getKelasNilai(kelasId);
    if (!kelasNilai) return { success: false, message: "Kelas tidak ditemukan" };

    const peserta = kelasNilai.peserta.find((p) => p.krsDetailId === krsDetailId);
    if (!peserta) return { success: false, message: "Mahasiswa tidak ditemukan di kelas ini" };

    const nilaiLamaRingkas = `Akhir: ${peserta.nilaiAkhir ?? "-"} (${peserta.nilaiHuruf ?? "-"})`;

    // Update skor komponen
    peserta.skorKomponen = { ...peserta.skorKomponen, ...skorKomponenBaru };

    // Hitung ulang nilai akhir
    const komponenInput = kelasNilai.komponen.map((k) => ({
      angka: peserta.skorKomponen[k.id] ?? 0,
      bobotPersen: k.bobotPersen,
    }));
    const hasil = hitungNilaiAkhir(komponenInput);
    if (!hasil.valid) {
      return { success: false, message: hasil.pesanGalat || "Perhitungan nilai tidak valid" };
    }

    peserta.nilaiAkhir = hasil.nilaiAkhir;
    peserta.nilaiHuruf = hasil.huruf;
    peserta.bobot = hasil.bobot;

    const nilaiBaruRingkas = `Akhir: ${hasil.nilaiAkhir} (${hasil.huruf})`;

    // Catat ke Log Audit
    NilaiStore.tambahLogAudit({
      penggunaId: adminId,
      penggunaNama: adminNama,
      peran: "ADMIN",
      aksi: "KOREKSI_NILAI",
      entitas: "KRSDetail",
      entitasId: krsDetailId,
      keterangan: `Koreksi nilai ${peserta.nama} (${peserta.nim}) MK ${kelasNilai.namaMataKuliah}. Alasan: ${alasan.trim()}`,
      nilaiLama: nilaiLamaRingkas,
      nilaiBaru: nilaiBaruRingkas,
    });

    return {
      success: true,
      message: `Nilai berhasil dikoreksi menjadi ${hasil.huruf} (${hasil.nilaiAkhir}). Tercatat di log audit.`,
    };
  },

  // Riwayat KHS Mahasiswa
  getKhsMahasiswa: (
    mahasiswaId: string,
    tahunAjaranKode?: string
  ): {
    mahasiswa: ReturnType<typeof MasterStore.getMahasiswaById>;
    tahunAjaranKode: string;
    semester: number;
    daftarNilai: {
      kodeMataKuliah: string;
      namaMataKuliah: string;
      sks: number;
      nilaiAngka: number;
      nilaiHuruf: string;
      bobot: number;
      nilaiMutu: number;
    }[];
    totalSks: number;
    ips: number;
  } => {
    const mhs = MasterStore.getMahasiswaById(mahasiswaId);

    // Filter dari riwayat studi
    const filterTahun = tahunAjaranKode || "2025/2026 Ganjil";
    const rawItems = riwayatStudiStore.filter(
      (r) => r.mahasiswaId === mahasiswaId && r.tahunAjaranKode === filterTahun
    );

    const daftarNilai = rawItems.map((r) => ({
      kodeMataKuliah: r.kodeMataKuliah,
      namaMataKuliah: r.namaMataKuliah,
      sks: r.sks,
      nilaiAngka: r.nilaiAngka,
      nilaiHuruf: r.nilaiHuruf,
      bobot: r.bobot,
      nilaiMutu: Math.round(r.bobot * r.sks * 100) / 100,
    }));

    const totalSks = daftarNilai.reduce((sum, item) => sum + item.sks, 0);
    const ips = hitungIPS(daftarNilai);

    return {
      mahasiswa: mhs,
      tahunAjaranKode: filterTahun,
      semester: rawItems[0]?.semester || 1,
      daftarNilai,
      totalSks,
      ips,
    };
  },

  // Transkrip Nilai Kumulatif Mahasiswa
  getTranskripMahasiswa: (
    mahasiswaId: string
  ): {
    mahasiswa: ReturnType<typeof MasterStore.getMahasiswaById>;
    ipk: number;
    totalSksLulus: number;
    totalSksDitempuh: number;
    daftarMataKuliah: (NilaiTranskripItem & { diulang: boolean })[];
  } => {
    const mhs = MasterStore.getMahasiswaById(mahasiswaId);
    const rawItems = riwayatStudiStore.filter((r) => r.mahasiswaId === mahasiswaId);

    const formatList: NilaiTranskripItem[] = rawItems.map((r) => ({
      kodeMataKuliah: r.kodeMataKuliah,
      namaMataKuliah: r.namaMataKuliah,
      sks: r.sks,
      huruf: r.nilaiHuruf,
      bobot: r.bobot,
      semesterPaket: r.semester,
      tahunAjaranKode: r.tahunAjaranKode,
    }));

    const hasil = hitungIPK(formatList);

    return {
      mahasiswa: mhs,
      ipk: hasil.ipk,
      totalSksLulus: hasil.totalSksLulus,
      totalSksDitempuh: hasil.totalSksDitempuh,
      daftarMataKuliah: hasil.daftarMataKuliahFinal,
    };
  },

  // Daftar semester riwayat studi untuk pilihan KHS
  getPilihanSemesterMahasiswa: (mahasiswaId: string): string[] => {
    const semesters = riwayatStudiStore
      .filter((r) => r.mahasiswaId === mahasiswaId)
      .map((r) => r.tahunAjaranKode);
    return Array.from(new Set(semesters));
  },

  // Riwayat tren IPS seluruh semester mahasiswa
  getRiwayatIpsMahasiswa: (
    mahasiswaId: string
  ): { semester: number; tahunAjaranKode: string; ips: number; sks: number }[] => {
    const semesters = NilaiStore.getPilihanSemesterMahasiswa(mahasiswaId);
    return semesters
      .map((ta) => {
        const khs = NilaiStore.getKhsMahasiswa(mahasiswaId, ta);
        return {
          semester: khs.semester,
          tahunAjaranKode: ta,
          ips: khs.ips,
          sks: khs.totalSks,
        };
      })
      .sort((a, b) => a.semester - b.semester);
  },

  // Log Audit
  getLogAudit: (limit = 20): LogAuditItem[] => {
    return [...logAuditStore].reverse().slice(0, limit);
  },

  tambahLogAudit: (data: Omit<LogAuditItem, "id" | "waktu">) => {
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    logAuditStore.push({
      ...data,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      waktu: nowStr,
    });
  },
};
