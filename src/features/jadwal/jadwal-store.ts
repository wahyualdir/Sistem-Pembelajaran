import { SEED_MATA_KULIAH, SEED_DOSEN, SEED_RUANG, SEED_TAHUN_AJARAN } from "@/lib/db/seed-data";
import { adaBentrok, RentangJadwal } from "@/lib/akademik/bentrok";
import { MasterStore } from "../master/master-store";

export interface KelasItem {
  id: string;
  kode: string;
  mataKuliahId: string;
  namaMataKuliah: string;
  kodeMataKuliah: string;
  sks: number;
  tahunAjaranId: string;
  dosenId: string;
  namaDosen: string;
  kuota: number;
  terisi: number;
  jadwal: JadwalItem[];
}

export interface JadwalItem {
  id: string;
  kelasId: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruangId: string;
  namaRuang: string;
}

let kelasStore: KelasItem[] = [
  {
    id: "kls-tif101-a",
    kode: "A",
    mataKuliahId: "mk-1",
    namaMataKuliah: "Algoritma & Pemrograman",
    kodeMataKuliah: "TIF101",
    sks: 3,
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    dosenId: "dsn-1",
    namaDosen: "Dr. Ardiansyah, S.T., M.Kom.",
    kuota: 35,
    terisi: 28,
    jadwal: [
      {
        id: "jdw-1",
        kelasId: "kls-tif101-a",
        hari: "Senin",
        jamMulai: "08:00",
        jamSelesai: "09:40",
        ruangId: "rng-1",
        namaRuang: "Laboratorium Komputer 1",
      },
    ],
  },
  {
    id: "kls-tif201-a",
    kode: "A",
    mataKuliahId: "mk-3",
    namaMataKuliah: "Pemrograman Berorientasi Objek",
    kodeMataKuliah: "TIF201",
    sks: 3,
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    dosenId: "dsn-4",
    namaDosen: "Fajar Ramadhan, M.Kom.",
    kuota: 35,
    terisi: 30,
    jadwal: [
      {
        id: "jdw-2",
        kelasId: "kls-tif201-a",
        hari: "Senin",
        jamMulai: "10:00",
        jamSelesai: "11:40",
        ruangId: "rng-1",
        namaRuang: "Laboratorium Komputer 1",
      },
    ],
  },
  {
    id: "kls-tif202-a",
    kode: "A",
    mataKuliahId: "mk-4",
    namaMataKuliah: "Basis Data",
    kodeMataKuliah: "TIF202",
    sks: 3,
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    dosenId: "dsn-5",
    namaDosen: "Dr. Rina Fitriani, M.Sc.",
    kuota: 35,
    terisi: 25,
    jadwal: [
      {
        id: "jdw-3",
        kelasId: "kls-tif202-a",
        hari: "Selasa",
        jamMulai: "08:00",
        jamSelesai: "09:40",
        ruangId: "rng-2",
        namaRuang: "Laboratorium Komputer 2",
      },
    ],
  },
  {
    id: "kls-tif302-a",
    kode: "A",
    mataKuliahId: "mk-7",
    namaMataKuliah: "Pengembangan Web Modern",
    kodeMataKuliah: "TIF302",
    sks: 3,
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    dosenId: "dsn-6",
    namaDosen: "Budi Santoso, M.Kom.",
    kuota: 35,
    terisi: 32,
    jadwal: [
      {
        id: "jdw-4",
        kelasId: "kls-tif302-a",
        hari: "Rabu",
        jamMulai: "13:00",
        jamSelesai: "15:30",
        ruangId: "rng-2",
        namaRuang: "Laboratorium Komputer 2",
      },
    ],
  },
  {
    id: "kls-tif303-a",
    kode: "A",
    mataKuliahId: "mk-8",
    namaMataKuliah: "Kecerdasan Buatan",
    kodeMataKuliah: "TIF303",
    sks: 3,
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    dosenId: "dsn-7",
    namaDosen: "Siti Nurhaliza, M.Cs.",
    kuota: 40,
    terisi: 20,
    jadwal: [
      {
        id: "jdw-5",
        kelasId: "kls-tif303-a",
        hari: "Kamis",
        jamMulai: "08:00",
        jamSelesai: "10:30",
        ruangId: "rng-3",
        namaRuang: "Ruang Teori 201",
      },
    ],
  },
  {
    id: "kls-tif301-a",
    kode: "A",
    mataKuliahId: "mk-6",
    namaMataKuliah: "Rekayasa Perangkat Lunak",
    kodeMataKuliah: "TIF301",
    sks: 3,
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    dosenId: "dsn-3",
    namaDosen: "Hendra Gunawan, M.T.",
    kuota: 35,
    terisi: 28,
    jadwal: [
      {
        id: "jdw-6",
        kelasId: "kls-tif301-a",
        hari: "Selasa",
        jamMulai: "13:00",
        jamSelesai: "15:30",
        ruangId: "rng-1",
        namaRuang: "Laboratorium Komputer 1",
      },
    ],
  },
  {
    id: "kls-tif401-a",
    kode: "A",
    mataKuliahId: "mk-9",
    namaMataKuliah: "Pembelajaran Mesin",
    kodeMataKuliah: "TIF401",
    sks: 3,
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    dosenId: "dsn-1",
    namaDosen: "Dr. Ardiansyah, S.T., M.Kom.",
    kuota: 35,
    terisi: 24,
    jadwal: [
      {
        id: "jdw-7",
        kelasId: "kls-tif401-a",
        hari: "Jumat",
        jamMulai: "08:00",
        jamSelesai: "10:30",
        ruangId: "rng-2",
        namaRuang: "Laboratorium Komputer 2",
      },
    ],
  },
  {
    id: "kls-tif402-a",
    kode: "A",
    mataKuliahId: "mk-10",
    namaMataKuliah: "Keamanan Siber",
    kodeMataKuliah: "TIF402",
    sks: 3,
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    dosenId: "dsn-8",
    namaDosen: "Ahmad Fauzi, S.T., M.Kom.",
    kuota: 35,
    terisi: 22,
    jadwal: [
      {
        id: "jdw-8",
        kelasId: "kls-tif402-a",
        hari: "Jumat",
        jamMulai: "13:30",
        jamSelesai: "16:00",
        ruangId: "rng-4",
        namaRuang: "Ruang Teori 202",
      },
    ],
  },
];

export const JadwalStore = {
  getKelas: () => [...kelasStore],
  getKelasById: (id: string) => kelasStore.find((k) => k.id === id),
  getKelasByDosen: (dosenId: string) => kelasStore.filter((k) => k.dosenId === dosenId),

  createKelas: (data: {
    kode: string;
    mataKuliahId: string;
    dosenId: string;
    kuota: number;
    jadwal: {
      hari: string;
      jamMulai: string;
      jamSelesai: string;
      ruangId: string;
    }[];
  }) => {
    // 1. Validasi kapasitas ruang vs kuota kelas (Bab 2.2)
    const ruangList = MasterStore.getRuang();
    for (const j of data.jadwal) {
      const r = ruangList.find((item) => item.id === j.ruangId);
      if (r && data.kuota > r.kapasitas) {
        throw new Error(
          `Kuota kelas (${data.kuota}) tidak boleh melebihi kapasitas ruang ${r.nama} (${r.kapasitas} kursi).`
        );
      }
    }

    // 2. Deteksi bentrok jadwal dosen & ruang (Bab 6.2)
    for (const newJ of data.jadwal) {
      const newRentang: RentangJadwal = {
        hari: newJ.hari,
        jamMulai: newJ.jamMulai,
        jamSelesai: newJ.jamSelesai,
      };

      for (const k of kelasStore) {
        for (const existingJ of k.jadwal) {
          const existingRentang: RentangJadwal = {
            hari: existingJ.hari,
            jamMulai: existingJ.jamMulai,
            jamSelesai: existingJ.jamSelesai,
          };

          // Cek bentrok ruang
          if (existingJ.ruangId === newJ.ruangId && adaBentrok(newRentang, existingRentang)) {
            throw new Error(
              `Ruangan ${existingJ.namaRuang} bentrok pada hari ${newJ.hari} pukul ${existingJ.jamMulai}-${existingJ.jamSelesai} dengan kelas ${k.namaMataKuliah} (${k.kode}).`
            );
          }

          // Cek bentrok dosen
          if (k.dosenId === data.dosenId && adaBentrok(newRentang, existingRentang)) {
            throw new Error(
              `Dosen pengampu bentrok jadwal mengajar pada hari ${newJ.hari} pukul ${existingJ.jamMulai}-${existingJ.jamSelesai} di kelas ${k.namaMataKuliah} (${k.kode}).`
            );
          }
        }
      }
    }

    // Buat kelas baru
    const mk = SEED_MATA_KULIAH.find((m) => m.id === data.mataKuliahId);
    const dsn = SEED_DOSEN.find((d) => d.id === data.dosenId);
    const kelasId = `kls-${Date.now()}`;

    const newKelas: KelasItem = {
      id: kelasId,
      kode: data.kode,
      mataKuliahId: data.mataKuliahId,
      namaMataKuliah: mk?.nama || "Mata Kuliah",
      kodeMataKuliah: mk?.kode || "",
      sks: mk?.sks || 3,
      tahunAjaranId: SEED_TAHUN_AJARAN.id,
      dosenId: data.dosenId,
      namaDosen: dsn?.nama || "Dosen Pengajar",
      kuota: data.kuota,
      terisi: 0,
      jadwal: data.jadwal.map((j, idx) => {
        const r = SEED_RUANG.find((ruang) => ruang.id === j.ruangId);
        return {
          id: `jdw-${Date.now()}-${idx}`,
          kelasId,
          hari: j.hari,
          jamMulai: j.jamMulai,
          jamSelesai: j.jamSelesai,
          ruangId: j.ruangId,
          namaRuang: r?.nama || "Ruang Kuliah",
        };
      }),
    };

    kelasStore.unshift(newKelas);
    return newKelas;
  },

  incrementTerisi: (kelasId: string) => {
    const k = kelasStore.find((item) => item.id === kelasId);
    if (k) {
      if (k.terisi >= k.kuota) {
        throw new Error(`Kuota kelas ${k.namaMataKuliah} (${k.kode}) sudah penuh.`);
      }
      k.terisi += 1;
    }
  },

  decrementTerisi: (kelasId: string) => {
    const k = kelasStore.find((item) => item.id === kelasId);
    if (k && k.terisi > 0) {
      k.terisi -= 1;
    }
  },
};
