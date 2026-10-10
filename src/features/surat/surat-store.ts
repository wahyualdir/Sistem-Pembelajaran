import { MasterStore } from "../master/master-store";
import { generateNomorSurat } from "@/lib/akademik/administrasi";

export type JenisSurat = "AKTIF_KULIAH" | "CUTI_AKADEMIK" | "REKOMENDASI_BEASISWA";
export type StatusSurat = "DIAJUKAN" | "DIPROSES" | "DISETUJUI" | "DITOLAK";

export interface PengajuanSuratItem {
  id: string;
  mahasiswaId: string;
  nim: string;
  namaMahasiswa: string;
  prodiNama: string;
  angkatan: number;
  jenis: JenisSurat;
  keterangan: string;
  status: StatusSurat;
  nomorSurat?: string | null;
  tanggalPengajuan: string;
  tanggalSelesai?: string | null;
  diprosesOleh?: string | null;
  alasanTolak?: string | null;
}

// In-Memory Seeds Pengajuan Surat
let suratStore: PengajuanSuratItem[] = [
  {
    id: "srt-1",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    namaMahasiswa: "Wahyu Aldi Riyanto",
    prodiNama: "Teknik Informatika",
    angkatan: 2022,
    jenis: "AKTIF_KULIAH",
    keterangan: "Keperluan kelengkapan berkas tunjangan gaji pensiun orang tua (Taspen)",
    status: "DISETUJUI",
    nomorSurat: "001/FT-UIR/SK-AKTIF/2026",
    tanggalPengajuan: "2026-09-10",
    tanggalSelesai: "2026-09-12 11:00:00",
    diprosesOleh: "Administrator Akademik",
    alasanTolak: null,
  },
  {
    id: "srt-2",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    namaMahasiswa: "Wahyu Aldi Riyanto",
    prodiNama: "Teknik Informatika",
    angkatan: 2022,
    jenis: "REKOMENDASI_BEASISWA",
    keterangan: "Pendaftaran Beasiswa Prestasi Unggulan Pemerintah Provinsi Riau Tahun 2026",
    status: "DIAJUKAN",
    nomorSurat: null,
    tanggalPengajuan: "2026-09-26",
    tanggalSelesai: null,
    diprosesOleh: null,
    alasanTolak: null,
  },
  {
    id: "srt-3",
    mahasiswaId: "mhs-2",
    nim: "223510002",
    namaMahasiswa: "Siti Nur Aisyah",
    prodiNama: "Teknik Informatika",
    angkatan: 2022,
    jenis: "AKTIF_KULIAH",
    keterangan: "Perpanjangan kartu BPJS Kesehatan keluarga",
    status: "DIAJUKAN",
    nomorSurat: null,
    tanggalPengajuan: "2026-09-28",
    tanggalSelesai: null,
    diprosesOleh: null,
    alasanTolak: null,
  },
];

let counterUrutSurat = 2;

export const SuratStore = {
  getSemuaPengajuan: (status?: StatusSurat): PengajuanSuratItem[] => {
    if (status) {
      return suratStore.filter((s) => s.status === status);
    }
    return [...suratStore].sort(
      (a, b) => new Date(b.tanggalPengajuan).getTime() - new Date(a.tanggalPengajuan).getTime()
    );
  },

  getPengajuanByMahasiswa: (mahasiswaId: string): PengajuanSuratItem[] => {
    return suratStore
      .filter((s) => s.mahasiswaId === mahasiswaId)
      .sort((a, b) => new Date(b.tanggalPengajuan).getTime() - new Date(a.tanggalPengajuan).getTime());
  },

  getPengajuanById: (id: string): PengajuanSuratItem | undefined => {
    return suratStore.find((s) => s.id === id);
  },

  ajukanSurat: (
    mahasiswaId: string,
    jenis: JenisSurat,
    keterangan: string
  ): PengajuanSuratItem => {
    const mhs = MasterStore.getMahasiswaById(mahasiswaId);
    if (!mhs) throw new Error("Mahasiswa tidak ditemukan.");

    const prodi = MasterStore.getProdi().find((p) => p.id === mhs.prodiId)?.nama || "Teknik Informatika";

    const newItem: PengajuanSuratItem = {
      id: `srt-${Date.now()}`,
      mahasiswaId,
      nim: mhs.nim,
      namaMahasiswa: mhs.nama,
      prodiNama: prodi,
      angkatan: mhs.angkatan,
      jenis,
      keterangan,
      status: "DIAJUKAN",
      nomorSurat: null,
      tanggalPengajuan: new Date().toISOString().substring(0, 10),
      tanggalSelesai: null,
      diprosesOleh: null,
      alasanTolak: null,
    };

    suratStore.unshift(newItem);
    return newItem;
  },

  // Admin memproses surat (Setujui / Tolak)
  prosesSurat: (params: {
    suratId: string;
    aksi: "SETUJUI" | "TOLAK";
    adminNama: string;
    alasanTolak?: string;
  }): PengajuanSuratItem => {
    const surat = suratStore.find((s) => s.id === params.suratId);
    if (!surat) throw new Error("Permohonan surat tidak ditemukan.");

    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    surat.diprosesOleh = params.adminNama;
    surat.tanggalSelesai = nowStr;

    if (params.aksi === "SETUJUI") {
      surat.status = "DISETUJUI";
      counterUrutSurat++;
      // Buat nomor surat resmi otomatis (Bab 6.8 & 2.2 F14)
      surat.nomorSurat = generateNomorSurat(surat.jenis, counterUrutSurat);
      surat.alasanTolak = null;
    } else {
      surat.status = "DITOLAK";
      surat.alasanTolak = params.alasanTolak || "Persyaratan administrasi tidak memenuhi ketentuan.";
    }

    return surat;
  },
};
