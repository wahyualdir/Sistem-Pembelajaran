import { SEED_MAHASISWA, SEED_TAHUN_AJARAN } from "@/lib/db/seed-data";

export interface TagihanItem {
  id: string;
  mahasiswaId: string;
  namaMahasiswa: string;
  nimMahasiswa: string;
  prodiNama: string;
  tahunAjaranId: string;
  tahunAjaranKode: string;
  jumlah: number;
  status: "BELUM" | "LUNAS" | "DISPENSASI";
  batasDispensasi?: string | null;
  tanggalBayar?: string | null;
  buktiPembayaran?: string | null;
  catatan?: string | null;
}

// Inisialisasi tagihan awal dari seed
let tagihanStore: TagihanItem[] = SEED_MAHASISWA.map((m, idx) => {
  // 10 mahasiswa pertama lunas, 2 dispensasi, sisanya belum lunas
  let status: "BELUM" | "LUNAS" | "DISPENSASI" = "BELUM";
  let tanggalBayar: string | null = null;
  let bukti: string | null = null;
  let catatan: string | null = null;
  let batasDispensasi: string | null = null;

  if (idx < 10) {
    status = "LUNAS";
    tanggalBayar = "2026-08-25";
    bukti = "TRX-BRK-20260825-0012";
    catatan = "Lunas via Virtual Account Bank Riau Kepri Syariah";
  } else if (idx === 10 || idx === 11) {
    status = "DISPENSASI";
    batasDispensasi = "2026-11-15";
    catatan = "Dispensasi pelunasan bertahap disetujui BAAK";
  }

  return {
    id: `tag-${m.id}`,
    mahasiswaId: m.id,
    namaMahasiswa: m.nama,
    nimMahasiswa: m.nim,
    prodiNama: m.prodiId.toUpperCase(),
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    jumlah: 3500000,
    status,
    batasDispensasi,
    tanggalBayar,
    buktiPembayaran: bukti,
    catatan,
  };
});

export const UktStore = {
  getAllTagihan: () => [...tagihanStore],
  getTagihanByMahasiswa: (mahasiswaId: string, tahunAjaranId = SEED_TAHUN_AJARAN.id) => {
    return tagihanStore.find(
      (t) => t.mahasiswaId === mahasiswaId && t.tahunAjaranId === tahunAjaranId
    );
  },

  isUktLunas: (mahasiswaId: string, tahunAjaranId = SEED_TAHUN_AJARAN.id) => {
    const tag = tagihanStore.find(
      (t) => t.mahasiswaId === mahasiswaId && t.tahunAjaranId === tahunAjaranId
    );

    if (!tag) {
      // Jika belum ada tagihan terbit, default izinkan
      return { bolehKrs: true, status: "TIDAK_ADA_TAGIHAN" };
    }

    if (tag.status === "LUNAS") {
      return { bolehKrs: true, status: "LUNAS" };
    }

    if (tag.status === "DISPENSASI") {
      return {
        bolehKrs: true,
        status: "DISPENSASI",
        catatan: tag.catatan || "Dispensasi disetujui",
      };
    }

    return {
      bolehKrs: false,
      status: "BELUM_LUNAS",
      alasan:
        "Tagihan Uang Kuliah Tunggal (UKT) semester berjalan belum dilunasi. Segera lakukan pembayaran atau ajukan permohonan dispensasi ke BAAK.",
    };
  },

  bayarUkt: (tagihanId: string, bukti: string, catatan?: string) => {
    const idx = tagihanStore.findIndex((t) => t.id === tagihanId);
    if (idx === -1) throw new Error("Tagihan tidak ditemukan.");
    tagihanStore[idx].status = "LUNAS";
    tagihanStore[idx].tanggalBayar = new Date().toISOString().split("T")[0];
    tagihanStore[idx].buktiPembayaran = bukti;
    tagihanStore[idx].catatan = catatan || "Diverifikasi Bendahara Kampus";
    return tagihanStore[idx];
  },

  beriDispensasi: (tagihanId: string, alasan: string, batasWaktu: string) => {
    const idx = tagihanStore.findIndex((t) => t.id === tagihanId);
    if (idx === -1) throw new Error("Tagihan tidak ditemukan.");
    tagihanStore[idx].status = "DISPENSASI";
    tagihanStore[idx].catatan = alasan;
    tagihanStore[idx].batasDispensasi = batasWaktu;
    return tagihanStore[idx];
  },
};
