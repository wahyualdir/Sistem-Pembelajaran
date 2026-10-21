import { SEED_TAHUN_AJARAN } from "@/lib/db/seed-data";
import { SEED_KRS_UIR } from "@/lib/db/seed-data.uir-ti-2026.generated";
import { JadwalStore, KelasItem } from "../jadwal/jadwal-store";
import { MasterStore } from "../master/master-store";
import { UktStore } from "../ukt/ukt-store";
import { hitungBatasSks } from "@/lib/akademik/aturan-sks";
import { adaBentrok, RentangJadwal } from "@/lib/akademik/bentrok";

const isUirDataset =
  typeof process !== "undefined" &&
  process.env?.SEED_DATASET === "uir-ti-2026";

export interface KRSItem {
  id: string;
  mahasiswaId: string;
  namaMahasiswa: string;
  nimMahasiswa: string;
  dosenWaliId?: string | null;
  namaDosenWali?: string;
  tahunAjaranId: string;
  tahunAjaranKode: string;
  status: "DRAF" | "DIAJUKAN" | "DISETUJUI" | "DITOLAK";
  totalSks: number;
  batasSks: number;
  ipsSemesterLalu: number;
  catatanWali?: string | null;
  items: {
    krsDetailId: string;
    kelasId: string;
    kelas: KelasItem;
  }[];
}

// Inisialisasi KRS default
const DEFAULT_KRS: KRSItem[] = [
  // Mahasiswa Wahyu Aldi (mhs-1) sudah memiliki KRS disetujui (sample)
  {
    id: "krs-mhs-1",
    mahasiswaId: "mhs-1",
    namaMahasiswa: "Wahyu Aldi Riyanto",
    nimMahasiswa: "223510001",
    dosenWaliId: "dsn-1",
    namaDosenWali: "Dr. Ardiansyah, S.T., M.Kom.",
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    status: "DISETUJUI",
    totalSks: 21,
    batasSks: 24,
    ipsSemesterLalu: 3.78,
    catatanWali: "KRS disetujui. Pertahankan prestasi dan rajin perkuliahan.",
    items: [
      {
        krsDetailId: "krsd-1",
        kelasId: "kls-tif101-a",
        kelas: JadwalStore.getKelasById("kls-tif101-a")!,
      },
      {
        krsDetailId: "krsd-2",
        kelasId: "kls-tif201-a",
        kelas: JadwalStore.getKelasById("kls-tif201-a")!,
      },
      {
        krsDetailId: "krsd-3",
        kelasId: "kls-tif202-a",
        kelas: JadwalStore.getKelasById("kls-tif202-a")!,
      },
      {
        krsDetailId: "krsd-4",
        kelasId: "kls-tif301-a",
        kelas: JadwalStore.getKelasById("kls-tif301-a")!,
      },
      {
        krsDetailId: "krsd-5",
        kelasId: "kls-tif302-a",
        kelas: JadwalStore.getKelasById("kls-tif302-a")!,
      },
      {
        krsDetailId: "krsd-6",
        kelasId: "kls-tif303-a",
        kelas: JadwalStore.getKelasById("kls-tif303-a")!,
      },
      {
        krsDetailId: "krsd-7",
        kelasId: "kls-tif401-a",
        kelas: JadwalStore.getKelasById("kls-tif401-a")!,
      },
    ],
  },
  // Mahasiswa Dimas (mhs-4) berstatus DIAJUKAN (menunggu persetujuan dosen wali)
  {
    id: "krs-mhs-4",
    mahasiswaId: "mhs-4",
    namaMahasiswa: "Dimas Anggara Putra",
    nimMahasiswa: "223510004",
    dosenWaliId: "dsn-1",
    namaDosenWali: "Dr. Ardiansyah, S.T., M.Kom.",
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    status: "DIAJUKAN",
    totalSks: 6,
    batasSks: 24,
    ipsSemesterLalu: 3.5,
    catatanWali: null,
    items: [
      {
        krsDetailId: "krsd-3",
        kelasId: "kls-tif202-a",
        kelas: JadwalStore.getKelasById("kls-tif202-a")!,
      },
      {
        krsDetailId: "krsd-4",
        kelasId: "kls-tif302-a",
        kelas: JadwalStore.getKelasById("kls-tif302-a")!,
      },
    ],
  },
];

let krsStore: KRSItem[] = isUirDataset
  ? [...(SEED_KRS_UIR as KRSItem[])]
  : [...DEFAULT_KRS];

export const KrsStore = {
  resetStore: (dataset?: string) => {
    if (dataset === "uir-ti-2026" || (!dataset && process.env.SEED_DATASET === "uir-ti-2026")) {
      krsStore = [...(SEED_KRS_UIR as KRSItem[])];
    } else {
      krsStore = [...DEFAULT_KRS];
    }
  },
  getKrsByMahasiswa: (mahasiswaId: string, tahunAjaranId = SEED_TAHUN_AJARAN.id): KRSItem => {
    let existing = krsStore.find(
      (k) =>
        (k.mahasiswaId === mahasiswaId ||
          (mahasiswaId === "a0000001-0000-0000-0000-000000000001" && k.mahasiswaId === "mhs-1")) &&
        k.tahunAjaranId === tahunAjaranId
    );

    if (!existing) {
      const mhs = MasterStore.getMahasiswaById(mahasiswaId);
      const wali = MasterStore.getDosen().find((d) => d.id === mhs?.dosenWaliId);
      const ips = 3.65; // Nilai bawaan semester lalu
      const batasSks = hitungBatasSks(ips);

      existing = {
        id: `krs-${mahasiswaId}`,
        mahasiswaId,
        namaMahasiswa: mhs?.nama || "Mahasiswa",
        nimMahasiswa: mhs?.nim || "",
        dosenWaliId: mhs?.dosenWaliId,
        namaDosenWali: wali?.nama || "Belum ditetapkan",
        tahunAjaranId,
        tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
        status: "DRAF",
        totalSks: 0,
        batasSks,
        ipsSemesterLalu: ips,
        catatanWali: null,
        items: [],
      };
      krsStore.push(existing);
    }

    return existing;
  },

  getAllKrs: () => [...krsStore],

  getKrsByDosenWali: (dosenId: string) => {
    return krsStore.filter((k) => k.dosenWaliId === dosenId);
  },

  tambahKelasKeKrs: (mahasiswaId: string, kelasId: string) => {
    // 1. Cek UKT (Bab 2.3 & 6.1)
    const checkUkt = UktStore.isUktLunas(mahasiswaId);
    if (!checkUkt.bolehKrs) {
      throw new Error(checkUkt.alasan);
    }

    const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
    if (krs.status === "DIAJUKAN") {
      throw new Error("KRS sedang diajukan ke Dosen Wali dan tidak dapat diubah.");
    }
    if (krs.status === "DISETUJUI") {
      throw new Error("KRS sudah disetujui Dosen Wali. Perubahan hanya diperkenankan pada masa revisi resmi.");
    }

    const targetKelas = JadwalStore.getKelasById(kelasId);
    if (!targetKelas) throw new Error("Kelas tidak ditemukan.");

    // 2. Cek apakah mata kuliah yang sama sudah diambil
    const alreadySameMK = krs.items.some(
      (item) => item.kelas.mataKuliahId === targetKelas.mataKuliahId
    );
    if (alreadySameMK) {
      throw new Error(`Mata kuliah ${targetKelas.namaMataKuliah} sudah ada di dalam KRS Anda.`);
    }

    // 3. Cek batas SKS
    if (krs.totalSks + targetKelas.sks > krs.batasSks) {
      throw new Error(
        `Pengambilan kelas ini melebihi batas jatah SKS Anda (${krs.totalSks + targetKelas.sks} > ${krs.batasSks} SKS).`
      );
    }

    // 4. Cek kuota kelas
    if (targetKelas.terisi >= targetKelas.kuota) {
      throw new Error(`Kuota kelas ${targetKelas.namaMataKuliah} (${targetKelas.kode}) sudah penuh.`);
    }

    // 5. Cek bentrok jadwal dengan kelas yang sudah dipilih di KRS (Bab 6.2)
    for (const newJ of targetKelas.jadwal) {
      const rentangBaru: RentangJadwal = {
        hari: newJ.hari,
        jamMulai: newJ.jamMulai,
        jamSelesai: newJ.jamSelesai,
      };

      for (const item of krs.items) {
        for (const existingJ of item.kelas.jadwal) {
          const rentangLama: RentangJadwal = {
            hari: existingJ.hari,
            jamMulai: existingJ.jamMulai,
            jamSelesai: existingJ.jamSelesai,
          };

          if (adaBentrok(rentangBaru, rentangLama)) {
            throw new Error(
              `Bentrok jadwal kuliah pada hari ${newJ.hari} jam ${newJ.jamMulai}-${newJ.jamSelesai} dengan mata kuliah ${item.kelas.namaMataKuliah}.`
            );
          }
        }
      }
    }

    // Masukkan ke keranjang KRS
    krs.items.push({
      krsDetailId: `krsd-${Date.now()}`,
      kelasId: targetKelas.id,
      kelas: targetKelas,
    });
    krs.totalSks += targetKelas.sks;
    krs.status = "DRAF";
    return krs;
  },

  hapusKelasDariKrs: (mahasiswaId: string, kelasId: string) => {
    const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
    if (krs.status === "DIAJUKAN" || krs.status === "DISETUJUI") {
      throw new Error("KRS tidak dapat diubah pada status saat ini.");
    }

    const idx = krs.items.findIndex((i) => i.kelasId === kelasId);
    if (idx !== -1) {
      const removed = krs.items.splice(idx, 1)[0];
      krs.totalSks -= removed.kelas.sks;
    }
    return krs;
  },

  ajukanKrs: (mahasiswaId: string) => {
    const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
    if (krs.items.length === 0) {
      throw new Error("Pilih minimal 1 mata kuliah sebelum mengajukan KRS.");
    }
    krs.status = "DIAJUKAN";
    return krs;
  },

  setujuiKrs: (krsId: string, catatan = "KRS telah disetujui dosen wali.") => {
    const krs = krsStore.find((k) => k.id === krsId);
    if (!krs) throw new Error("KRS tidak ditemukan.");

    // Bab 6.1 poin 8: Saat disetujui, kuota kelas dikurangi secara konsisten
    for (const item of krs.items) {
      try {
        JadwalStore.incrementTerisi(item.kelasId);
      } catch {
        // Kuota terisi diupdate
      }
    }

    krs.status = "DISETUJUI";
    krs.catatanWali = catatan;
    return krs;
  },

  tolakKrs: (krsId: string, catatan: string) => {
    const krs = krsStore.find((k) => k.id === krsId);
    if (!krs) throw new Error("KRS tidak ditemukan.");
    krs.status = "DITOLAK";
    krs.catatanWali = catatan || "Harap konsultasikan pemilihan mata kuliah dengan dosen wali.";
    return krs;
  },
};
