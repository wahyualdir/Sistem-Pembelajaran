import {
  SEED_MAHASISWA,
  SEED_DOSEN,
  SEED_PRODI,
  SEED_RUANG,
  SEED_TAHUN_AJARAN,
  SEED_MATA_KULIAH,
  SEED_PRASYARAT,
  DEFAULT_MAHASISWA,
  DEFAULT_DOSEN,
  DEFAULT_PRODI,
  DEFAULT_RUANG,
  DEFAULT_TAHUN_AJARAN,
  DEFAULT_MATA_KULIAH,
  DEFAULT_PRASYARAT,
} from "@/lib/db/seed-data";
import {
  SEED_MAHASISWA_UIR,
  SEED_DOSEN_UIR,
  SEED_PRODI_UIR,
  SEED_RUANG_UIR,
  SEED_TAHUN_AJARAN_UIR,
  SEED_MATA_KULIAH_UIR,
  SEED_PRASYARAT_UIR,
} from "@/lib/db/seed-data.uir-ti-2026.generated";
import {
  MahasiswaItem,
  DosenItem,
  ProgramStudiItem,
  RuangItem,
  TahunAjaranItem,
  MataKuliahItem,
} from "./types";
import { validatePrerequisiteCycle } from "@/lib/akademik/prasyarat";

let mahasiswaStore: MahasiswaItem[] = [];
let dosenStore: DosenItem[] = [];
let prodiStore: ProgramStudiItem[] = [];
let ruangStore: RuangItem[] = [];
let tahunAjaranStore: TahunAjaranItem[] = [];
let mataKuliahStore: MataKuliahItem[] = [];

function initMasterStores(dataset?: string) {
  const isUir =
    dataset === "uir-ti-2026" ||
    (!dataset && process.env.SEED_DATASET === "uir-ti-2026");

  const mhsSource = isUir ? SEED_MAHASISWA_UIR : (DEFAULT_MAHASISWA || SEED_MAHASISWA);
  const dsnSource = isUir ? SEED_DOSEN_UIR : (DEFAULT_DOSEN || SEED_DOSEN);
  const prodiSource = isUir ? SEED_PRODI_UIR : (DEFAULT_PRODI || SEED_PRODI);
  const ruangSource = isUir ? SEED_RUANG_UIR : (DEFAULT_RUANG || SEED_RUANG);
  const taSource = isUir ? SEED_TAHUN_AJARAN_UIR : (DEFAULT_TAHUN_AJARAN || SEED_TAHUN_AJARAN);
  const mkSource = isUir ? SEED_MATA_KULIAH_UIR : (DEFAULT_MATA_KULIAH || SEED_MATA_KULIAH);
  const praSource = isUir ? SEED_PRASYARAT_UIR : (DEFAULT_PRASYARAT || SEED_PRASYARAT);

  mahasiswaStore = mhsSource.map((m: any) => ({
    ...m,
    status: "AKTIF" as const,
  }));

  dosenStore = dsnSource.map((d: any) => ({
    id: d.id,
    nidn: d.nidn,
    nama: d.nama,
    email: d.email,
    penandaWali: d.penandaWali,
    penandaKaprodi: d.penandaKaprodi,
    statusAktif: d.statusAktif,
  }));

  prodiStore = prodiSource.map((p: any) => {
    const dsn = dsnSource.find((d: any) => d.kaprodiProdiId === p.id);
    return {
      ...p,
      kaprodiId: dsn?.id || null,
    };
  });

  ruangStore = ruangSource.map((r: any) => ({
    ...r,
    statusAktif: true,
  }));

  tahunAjaranStore = [
    {
      id: taSource.id,
      kode: taSource.kode,
      semester: taSource.semester,
      tanggalMulai: "2026-08-31",
      tanggalSelesai: "2027-01-31",
      aktif: true,
    },
  ];

  mataKuliahStore = mkSource.map((mk: any) => {
    const relatedPrasyarat = praSource
      .filter((p: any) => p.mataKuliahId === mk.id)
      .map((p: any) => {
        const parent = mkSource.find((m: any) => m.id === p.prasyaratId);
        return {
          id: p.id,
          prasyaratId: p.prasyaratId,
          namaPrasyarat: parent?.nama || "Mata Kuliah Prasyarat",
          kodePrasyarat: parent?.kode || "",
          nilaiMinimal: p.nilaiMinimal,
        };
      });

    return {
      ...mk,
      statusAktif: true,
      prasyarat: relatedPrasyarat,
    };
  });
}

initMasterStores();

export const MasterStore = {
  resetStore: (dataset?: string) => initMasterStores(dataset),
  // Mahasiswa
  getMahasiswa: () => [...mahasiswaStore],
  getMahasiswaById: (id: string) => mahasiswaStore.find((m) => m.id === id),
  addMahasiswa: (data: Omit<MahasiswaItem, "id" | "status">) => {
    const existing = mahasiswaStore.find(
      (m) => m.nim === data.nim || m.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) {
      throw new Error(`Mahasiswa dengan NIM ${data.nim} atau email tersebut sudah terdaftar.`);
    }
    const newMhs: MahasiswaItem = {
      ...data,
      id: `mhs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: "AKTIF",
    };
    mahasiswaStore.unshift(newMhs);
    return newMhs;
  },
  updateMahasiswa: (id: string, data: Partial<MahasiswaItem>) => {
    const idx = mahasiswaStore.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Mahasiswa tidak ditemukan.");
    mahasiswaStore[idx] = { ...mahasiswaStore[idx], ...data };
    return mahasiswaStore[idx];
  },
  toggleMahasiswaStatus: (id: string) => {
    const idx = mahasiswaStore.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Mahasiswa tidak ditemukan.");
    // Bab 5.1: dinonaktifkan dengan penanda status, bukan dihapus permanen
    const current = mahasiswaStore[idx].status;
    mahasiswaStore[idx].status = current === "AKTIF" ? "CUTI" : "AKTIF";
    return mahasiswaStore[idx];
  },
  assignDosenWali: (mahasiswaId: string, dosenId: string | null) => {
    const idx = mahasiswaStore.findIndex((m) => m.id === mahasiswaId);
    if (idx === -1) throw new Error("Mahasiswa tidak ditemukan.");
    mahasiswaStore[idx].dosenWaliId = dosenId;
    return mahasiswaStore[idx];
  },

  // Dosen
  getDosen: () => [...dosenStore],
  addDosen: (data: Omit<DosenItem, "id" | "statusAktif">) => {
    const existing = dosenStore.find(
      (d) => d.nidn === data.nidn || d.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) {
      throw new Error(`Dosen dengan NIDN ${data.nidn} atau email tersebut sudah terdaftar.`);
    }
    const newDsn: DosenItem = {
      ...data,
      id: `dsn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      statusAktif: true,
    };
    dosenStore.unshift(newDsn);
    return newDsn;
  },
  toggleDosenStatus: (id: string) => {
    const idx = dosenStore.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Dosen tidak ditemukan.");
    dosenStore[idx].statusAktif = !dosenStore[idx].statusAktif;
    return dosenStore[idx];
  },

  // Prodi
  getProdi: () => [...prodiStore],

  // Ruang
  getRuang: () => [...ruangStore],
  addRuang: (data: Omit<RuangItem, "id" | "statusAktif">) => {
    const newRuang: RuangItem = {
      ...data,
      id: `rng-${Date.now()}`,
      statusAktif: true,
    };
    ruangStore.push(newRuang);
    return newRuang;
  },
  toggleRuangStatus: (id: string) => {
    const idx = ruangStore.findIndex((r) => r.id === id);
    if (idx !== -1) {
      ruangStore[idx].statusAktif = !ruangStore[idx].statusAktif;
    }
  },

  // Tahun Ajaran
  getTahunAjaran: () => [...tahunAjaranStore],
  getActiveTahunAjaran: () => tahunAjaranStore.find((t) => t.aktif) || tahunAjaranStore[0],

  // Mata Kuliah & Kurikulum
  getMataKuliah: () => [...mataKuliahStore],
  addMataKuliah: (data: Omit<MataKuliahItem, "id" | "statusAktif" | "prasyarat">) => {
    const existing = mataKuliahStore.find((m) => m.kode.toUpperCase() === data.kode.toUpperCase());
    if (existing) {
      throw new Error(`Kode mata kuliah ${data.kode} sudah terdaftar.`);
    }
    const newMK: MataKuliahItem = {
      ...data,
      id: `mk-${Date.now()}`,
      statusAktif: true,
      prasyarat: [],
    };
    mataKuliahStore.push(newMK);
    return newMK;
  },
  addPrasyarat: (mataKuliahId: string, prasyaratId: string, nilaiMinimal = "D") => {
    // 1. Ekstrak pasangan dependensi yang sudah ada untuk validasi siklus
    const existingPairs: { courseId: string; prerequisiteId: string }[] = [];
    for (const mk of mataKuliahStore) {
      if (mk.prasyarat) {
        for (const p of mk.prasyarat) {
          existingPairs.push({ courseId: mk.id, prerequisiteId: p.prasyaratId });
        }
      }
    }

    // 2. Jalankan algoritma deteksi siklus (Bab 5.4)
    const check = validatePrerequisiteCycle(existingPairs, mataKuliahId, prasyaratId);
    if (!check.valid) {
      throw new Error(check.message);
    }

    const mk = mataKuliahStore.find((m) => m.id === mataKuliahId);
    const parent = mataKuliahStore.find((m) => m.id === prasyaratId);
    if (!mk || !parent) throw new Error("Mata kuliah tidak ditemukan.");

    if (!mk.prasyarat) mk.prasyarat = [];
    const already = mk.prasyarat.some((p) => p.prasyaratId === prasyaratId);
    if (already) throw new Error("Mata kuliah tersebut sudah menjadi prasyarat.");

    mk.prasyarat.push({
      id: `pra-${Date.now()}`,
      prasyaratId,
      namaPrasyarat: parent.nama,
      kodePrasyarat: parent.kode,
      nilaiMinimal,
    });
  },
  deletePrasyarat: (mataKuliahId: string, prasyaratId: string) => {
    const mk = mataKuliahStore.find((m) => m.id === mataKuliahId);
    if (mk && mk.prasyarat) {
      mk.prasyarat = mk.prasyarat.filter((p) => p.prasyaratId !== prasyaratId);
    }
  },
};
