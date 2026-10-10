import { JadwalStore } from "../jadwal/jadwal-store";
import { MasterStore } from "../master/master-store";
import { KrsStore } from "../krs/krs-store";
import { UktStore } from "../ukt/ukt-store";
import { PresensiStore } from "../presensi/presensi-store";
import {
  evaluasiKelayakanUjian,
  HasilEvaluasiUjian,
} from "@/lib/akademik/syarat-ujian";
import { SEED_TAHUN_AJARAN } from "@/lib/db/seed-data";

export type JenisUjian = "UTS" | "UAS";

export interface JadwalUjianItem {
  id: string;
  kelasId: string;
  kodeKelas: string;
  kodeMataKuliah: string;
  namaMataKuliah: string;
  sks: number;
  jenis: JenisUjian;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  ruangId: string;
  namaRuang: string;
  dosenPengampu: string;
}

// In-Memory Seeds Jadwal Ujian
let ujianStore: JadwalUjianItem[] = [
  // UTS
  {
    id: "uj-uts-tif101",
    kelasId: "kls-tif101-a",
    kodeKelas: "A",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Pemrograman Dasar",
    sks: 3,
    jenis: "UTS",
    tanggal: "2026-10-26",
    jamMulai: "08:00",
    jamSelesai: "09:40",
    ruangId: "rng-lab-1",
    namaRuang: "Lab Komputer 1",
    dosenPengampu: "Dr. Ardiansyah, S.T., M.Kom.",
  },
  {
    id: "uj-uts-tif201",
    kelasId: "kls-tif201-a",
    kodeKelas: "A",
    kodeMataKuliah: "TIF201",
    namaMataKuliah: "Struktur Data & Algoritma",
    sks: 3,
    jenis: "UTS",
    tanggal: "2026-10-27",
    jamMulai: "10:00",
    jamSelesai: "11:40",
    ruangId: "rng-lab-2",
    namaRuang: "Lab Komputer 2",
    dosenPengampu: "Nurul Hidayati, M.Kom.",
  },
  // UAS
  {
    id: "uj-uas-tif101",
    kelasId: "kls-tif101-a",
    kodeKelas: "A",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Pemrograman Dasar",
    sks: 3,
    jenis: "UAS",
    tanggal: "2027-01-11",
    jamMulai: "08:00",
    jamSelesai: "10:00",
    ruangId: "rng-lab-1",
    namaRuang: "Lab Komputer 1",
    dosenPengampu: "Dr. Ardiansyah, S.T., M.Kom.",
  },
  {
    id: "uj-uas-tif201",
    kelasId: "kls-tif201-a",
    kodeKelas: "A",
    kodeMataKuliah: "TIF201",
    namaMataKuliah: "Struktur Data & Algoritma",
    sks: 3,
    jenis: "UAS",
    tanggal: "2027-01-12",
    jamMulai: "10:00",
    jamSelesai: "12:00",
    ruangId: "rng-lab-2",
    namaRuang: "Lab Komputer 2",
    dosenPengampu: "Nurul Hidayati, M.Kom.",
  },
];

export const UjianStore = {
  getSemuaJadwal: (jenis?: JenisUjian): JadwalUjianItem[] => {
    if (jenis) {
      return ujianStore.filter((u) => u.jenis === jenis);
    }
    return [...ujianStore];
  },

  tambahJadwal: (params: {
    kelasId: string;
    jenis: JenisUjian;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    ruangId: string;
  }): JadwalUjianItem => {
    const kelas = JadwalStore.getKelasById(params.kelasId);
    if (!kelas) throw new Error("Kelas tidak ditemukan.");

    const ruang = MasterStore.getRuang().find((r) => r.id === params.ruangId);
    if (!ruang) throw new Error("Ruang tidak ditemukan.");

    // Cek duplikasi jadwal ujian untuk kelas dan jenis yang sama
    const existing = ujianStore.find(
      (u) => u.kelasId === params.kelasId && u.jenis === params.jenis
    );
    if (existing) {
      throw new Error(`Jadwal ${params.jenis} untuk kelas ini sudah ada.`);
    }

    const newUjian: JadwalUjianItem = {
      id: `uj-${Date.now()}`,
      kelasId: params.kelasId,
      kodeKelas: kelas.kode,
      kodeMataKuliah: kelas.kodeMataKuliah,
      namaMataKuliah: kelas.namaMataKuliah,
      sks: kelas.sks,
      jenis: params.jenis,
      tanggal: params.tanggal,
      jamMulai: params.jamMulai,
      jamSelesai: params.jamSelesai,
      ruangId: params.ruangId,
      namaRuang: ruang.nama,
      dosenPengampu: kelas.namaDosen,
    };

    ujianStore.push(newUjian);
    return newUjian;
  },

  // Ambil jadwal ujian mahasiswa sesuai kelas KRS yang disetujui
  getJadwalMahasiswa: (
    mahasiswaId: string,
    jenis: JenisUjian = "UTS"
  ): JadwalUjianItem[] => {
    const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
    if (!krs || krs.status !== "DISETUJUI") return [];

    const classIds = krs.items.map((i) => i.kelasId);
    return ujianStore.filter((u) => classIds.includes(u.kelasId) && u.jenis === jenis);
  },

  // Cek kelayakan kartu ujian mahasiswa (Bab 6.6)
  evaluasiKartuUjianMahasiswa: (
    mahasiswaId: string
  ): HasilEvaluasiUjian & {
    krsStatus: string;
    uktStatus: string;
    persentaseKehadiran: number;
    batasMinimalKehadiran: number;
  } => {
    const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
    const ukt = UktStore.getTagihanByMahasiswa(mahasiswaId);
    const kehadiranRataRata = PresensiStore.getPersentaseKehadiranRataRata(mahasiswaId);

    const krsStatus = krs?.status || "DRAF";
    const uktStatus = ukt?.status || "BELUM";
    const batasMinimalKehadiran = 75.0;

    const evaluasi = evaluasiKelayakanUjian({
      krsStatus,
      uktStatus,
      persentaseKehadiran: kehadiranRataRata,
      batasMinimalKehadiran,
    });

    return {
      ...evaluasi,
      krsStatus,
      uktStatus,
      persentaseKehadiran: kehadiranRataRata,
      batasMinimalKehadiran,
    };
  },
};
