import { JadwalStore } from "../jadwal/jadwal-store";
import { MasterStore } from "../master/master-store";
import { KrsStore } from "../krs/krs-store";
import { hitungPersentaseKehadiran } from "@/lib/akademik/syarat-ujian";

export type StatusKehadiran = "HADIR" | "IZIN" | "SAKIT" | "ALPA";

export interface PertemuanItem {
  id: string;
  kelasId: string;
  nomor: number;
  tanggal: string;
  materiSingkat: string;
  selesai: boolean;
}

export interface PresensiRecord {
  id: string;
  pertemuanId: string;
  mahasiswaId: string;
  nim: string;
  nama: string;
  status: StatusKehadiran;
  catatan?: string;
}

export interface RekapKehadiranMhs {
  kelasId: string;
  kodeMataKuliah: string;
  namaMataKuliah: string;
  kodeKelas: string;
  sks: number;
  dosenPengampu: string;
  totalPertemuan: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  persentase: number;
  peringatan: boolean; // < 80%
  lolosUas: boolean; // >= 75%
}

// Data awal pertemuan untuk kelas TIF101 dan TIF201
let pertemuanStore: PertemuanItem[] = [
  {
    id: "ptm-tif101-1",
    kelasId: "kls-tif101-a",
    nomor: 1,
    tanggal: "2026-09-02",
    materiSingkat: "Kontrak Perkuliahan & Pengenalan Algoritma Dasar",
    selesai: true,
  },
  {
    id: "ptm-tif101-2",
    kelasId: "kls-tif101-a",
    nomor: 2,
    tanggal: "2026-09-09",
    materiSingkat: "Tipe Data, Variabel, dan Operator Logika",
    selesai: true,
  },
  {
    id: "ptm-tif101-3",
    kelasId: "kls-tif101-a",
    nomor: 3,
    tanggal: "2026-09-16",
    materiSingkat: "Struktur Percabangan If-Else dan Switch Case",
    selesai: true,
  },
  {
    id: "ptm-tif101-4",
    kelasId: "kls-tif101-a",
    nomor: 4,
    tanggal: "2026-09-23",
    materiSingkat: "Perulangan While, For, dan Do-While",
    selesai: true,
  },
  {
    id: "ptm-tif201-1",
    kelasId: "kls-tif201-a",
    nomor: 1,
    tanggal: "2026-09-03",
    materiSingkat: "Pengantar Struktur Data & Kompleksitas Algoritma",
    selesai: true,
  },
  {
    id: "ptm-tif201-2",
    kelasId: "kls-tif201-a",
    nomor: 2,
    tanggal: "2026-09-10",
    materiSingkat: "Array 1D, 2D dan Alokasi Memori Dinamis",
    selesai: true,
  },
];

// Rekam presensi per pertemuan
let presensiRecords: PresensiRecord[] = [
  // Pertemuan 1 TIF101
  {
    id: "pres-1",
    pertemuanId: "ptm-tif101-1",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    nama: "Wahyu Aldi Riyanto",
    status: "HADIR",
  },
  {
    id: "pres-2",
    pertemuanId: "ptm-tif101-1",
    mahasiswaId: "mhs-2",
    nim: "223510002",
    nama: "Siti Nur Aisyah",
    status: "HADIR",
  },
  {
    id: "pres-3",
    pertemuanId: "ptm-tif101-1",
    mahasiswaId: "mhs-3",
    nim: "223510003",
    nama: "Budi Pratama",
    status: "HADIR",
  },
  // Pertemuan 2 TIF101
  {
    id: "pres-4",
    pertemuanId: "ptm-tif101-2",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    nama: "Wahyu Aldi Riyanto",
    status: "HADIR",
  },
  {
    id: "pres-5",
    pertemuanId: "ptm-tif101-2",
    mahasiswaId: "mhs-2",
    nim: "223510002",
    nama: "Siti Nur Aisyah",
    status: "IZIN",
    catatan: "Mengikuti seminar kampus",
  },
  {
    id: "pres-6",
    pertemuanId: "ptm-tif101-2",
    mahasiswaId: "mhs-3",
    nim: "223510003",
    nama: "Budi Pratama",
    status: "HADIR",
  },
  // Pertemuan 3 TIF101
  {
    id: "pres-7",
    pertemuanId: "ptm-tif101-3",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    nama: "Wahyu Aldi Riyanto",
    status: "HADIR",
  },
  {
    id: "pres-8",
    pertemuanId: "ptm-tif101-3",
    mahasiswaId: "mhs-2",
    nim: "223510002",
    nama: "Siti Nur Aisyah",
    status: "HADIR",
  },
  {
    id: "pres-9",
    pertemuanId: "ptm-tif101-3",
    mahasiswaId: "mhs-3",
    nim: "223510003",
    nama: "Budi Pratama",
    status: "ALPA",
  },
  // Pertemuan 4 TIF101
  {
    id: "pres-10",
    pertemuanId: "ptm-tif101-4",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    nama: "Wahyu Aldi Riyanto",
    status: "HADIR",
  },
  {
    id: "pres-11",
    pertemuanId: "ptm-tif101-4",
    mahasiswaId: "mhs-2",
    nim: "223510002",
    nama: "Siti Nur Aisyah",
    status: "HADIR",
  },
  {
    id: "pres-12",
    pertemuanId: "ptm-tif101-4",
    mahasiswaId: "mhs-3",
    nim: "223510003",
    nama: "Budi Pratama",
    status: "HADIR",
  },
  // Pertemuan 1 TIF201
  {
    id: "pres-13",
    pertemuanId: "ptm-tif201-1",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    nama: "Wahyu Aldi Riyanto",
    status: "HADIR",
  },
  // Pertemuan 2 TIF201
  {
    id: "pres-14",
    pertemuanId: "ptm-tif201-2",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    nama: "Wahyu Aldi Riyanto",
    status: "HADIR",
  },
];

export const PresensiStore = {
  // Ambil semua pertemuan kelas
  getPertemuanByKelas: (kelasId: string): PertemuanItem[] => {
    return pertemuanStore
      .filter((p) => p.kelasId === kelasId)
      .sort((a, b) => a.nomor - b.nomor);
  },

  // Tambah pertemuan baru oleh dosen
  tambahPertemuan: (
    kelasId: string,
    nomor: number,
    tanggal: string,
    materiSingkat: string
  ): PertemuanItem => {
    const existing = pertemuanStore.find((p) => p.kelasId === kelasId && p.nomor === nomor);
    if (existing) {
      throw new Error(`Pertemuan ke-${nomor} untuk kelas ini sudah ada.`);
    }

    const newPtm: PertemuanItem = {
      id: `ptm-${kelasId}-${nomor}`,
      kelasId,
      nomor,
      tanggal,
      materiSingkat,
      selesai: false,
    };
    pertemuanStore.push(newPtm);
    return newPtm;
  },

  // Ambil presensi mahasiswa pada pertemuan tertentu
  getPresensiByPertemuan: (pertemuanId: string, kelasId: string): PresensiRecord[] => {
    const existingRecords = presensiRecords.filter((p) => p.pertemuanId === pertemuanId);

    // Dapatkan peserta dari KRS yang disetujui untuk kelas ini
    const krsList = KrsStore.getAllKrs().filter(
      (k) => k.status === "DISETUJUI" && k.items.some((item) => item.kelasId === kelasId)
    );

    // Gabungkan dengan peserta terdaftar
    const result: PresensiRecord[] = [];
    for (const krs of krsList) {
      const recorded = existingRecords.find((r) => r.mahasiswaId === krs.mahasiswaId);
      if (recorded) {
        result.push(recorded);
      } else {
        // Bawaan HADIR untuk mempercepat input dosen (Bab 6.5)
        result.push({
          id: `pres-${pertemuanId}-${krs.mahasiswaId}`,
          pertemuanId,
          mahasiswaId: krs.mahasiswaId,
          nim: krs.nimMahasiswa,
          nama: krs.namaMahasiswa,
          status: "HADIR",
        });
      }
    }

    return result;
  },

  // Dosen menyimpan presensi suatu pertemuan
  simpanPresensi: (
    pertemuanId: string,
    records: { mahasiswaId: string; nim: string; nama: string; status: StatusKehadiran; catatan?: string }[]
  ) => {
    // Hapus record lama pada pertemuan ini
    presensiRecords = presensiRecords.filter((p) => p.pertemuanId !== pertemuanId);

    // Tambahkan record baru
    for (const r of records) {
      presensiRecords.push({
        id: `pres-${pertemuanId}-${r.mahasiswaId}`,
        pertemuanId,
        mahasiswaId: r.mahasiswaId,
        nim: r.nim,
        nama: r.nama,
        status: r.status,
        catatan: r.catatan,
      });
    }

    // Tandai pertemuan selesai
    const ptm = pertemuanStore.find((p) => p.id === pertemuanId);
    if (ptm) {
      ptm.selesai = true;
    }
  },

  // Rekap kehadiran untuk mahasiswa per mata kuliah
  getRekapMahasiswa: (mahasiswaId: string): RekapKehadiranMhs[] => {
    const krsMahasiswa = KrsStore.getKrsByMahasiswa(mahasiswaId);
    if (!krsMahasiswa || krsMahasiswa.status !== "DISETUJUI") {
      return [];
    }

    const rekapList: RekapKehadiranMhs[] = [];

    for (const item of krsMahasiswa.items) {
      const kelas = item.kelas;
      const daftarPertemuan = pertemuanStore.filter((p) => p.kelasId === kelas.id);
      const totalPertemuan = daftarPertemuan.length;

      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alpa = 0;

      for (const ptm of daftarPertemuan) {
        const record = presensiRecords.find(
          (p) => p.pertemuanId === ptm.id && p.mahasiswaId === mahasiswaId
        );
        if (record) {
          if (record.status === "HADIR") hadir++;
          else if (record.status === "IZIN") izin++;
          else if (record.status === "SAKIT") sakit++;
          else if (record.status === "ALPA") alpa++;
        }
      }

      const persentase = hitungPersentaseKehadiran(hadir, totalPertemuan);
      const lolosUas = persentase >= 75.0;
      const peringatan = totalPertemuan > 0 && persentase < 80.0;

      rekapList.push({
        kelasId: kelas.id,
        kodeMataKuliah: kelas.kodeMataKuliah,
        namaMataKuliah: kelas.namaMataKuliah,
        kodeKelas: kelas.kode,
        sks: kelas.sks,
        dosenPengampu: kelas.namaDosen,
        totalPertemuan,
        hadir,
        izin,
        sakit,
        alpa,
        persentase,
        peringatan,
        lolosUas,
      });
    }

    return rekapList;
  },

  // Persentase kehadiran rata-rata mahasiswa untuk evaluasi kartu ujian
  getPersentaseKehadiranRataRata: (mahasiswaId: string): number => {
    const rekap = PresensiStore.getRekapMahasiswa(mahasiswaId);
    if (rekap.length === 0) return 100.0;
    const totalPersen = rekap.reduce((sum, item) => sum + item.persentase, 0);
    return Math.round((totalPersen / rekap.length) * 100) / 100;
  },
};
