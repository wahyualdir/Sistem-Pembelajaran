import {
  isPeriodeAktif,
  isPengumumanRelevan,
  UserAcademicProfile,
} from "@/lib/akademik/administrasi";
import { SEED_TAHUN_AJARAN } from "@/lib/db/seed-data";

export type TargetPengumuman = "SEMUA" | "PRODI" | "ANGKATAN" | "KELAS";
export type JenisKegiatanKalender = "KRS" | "UTS" | "UAS" | "LIBUR" | "BAYAR_UKT";

export interface PengumumanItem {
  id: string;
  judul: string;
  isi: string;
  target: TargetPengumuman;
  targetId?: string | null;
  targetNama?: string;
  penulisId: string;
  namaPenulis: string;
  terbitPada: string;
}

export interface PengumumanDibacaRecord {
  pengumumanId: string;
  penggunaId: string;
  dibacaPada: string;
}

export interface KalenderItem {
  id: string;
  tahunAjaranId: string;
  tahunAjaranKode: string;
  jenis: JenisKegiatanKalender;
  keterangan: string;
  mulai: string;
  selesai: string;
}

// In-Memory Store Pengumuman
let pengumumanStore: PengumumanItem[] = [
  {
    id: "peng-1",
    judul: "Jadwal Pengisian Kartu Rencana Studi (KRS) Semester Ganjil 2026/2027",
    isi: "Diberitahukan kepada seluruh mahasiswa Universitas Islam Riau bahwa periode pengisian dan revisi KRS online semester ganjil 2026/2027 dibuka mulai tanggal 18 Agustus 2026 sampai dengan 31 Oktober 2026. Pastikan telah melunasi tagihan UKT sebelum menyusun rencana studi.",
    target: "SEMUA",
    targetId: null,
    targetNama: "Seluruh Mahasiswa & Dosen",
    penulisId: "usr-admin-1",
    namaPenulis: "Bagian Administrasi Akademik",
    terbitPada: "2026-08-15 09:00:00",
  },
  {
    id: "peng-2",
    judul: "Sosialisasi Kerja Praktik & Magang Industri Mahasiswa Teknik Informatika Angkatan 2022",
    isi: "Program Studi Teknik Informatika mengadakan briefing wajib terkait tata cara pendaftaran Kerja Praktik dan magang MBKM pada hari Sabtu, 5 Oktober 2026 bertempat di Gedung Teater Fakultas Teknik.",
    target: "ANGKATAN",
    targetId: "2022",
    targetNama: "Angkatan 2022",
    penulisId: "usr-dsn-1",
    namaPenulis: "Dr. Ardiansyah, S.T., M.Kom. (Kaprodi)",
    terbitPada: "2026-09-20 14:00:00",
  },
  {
    id: "peng-3",
    judul: "Ketentuan Pengajuan Surat Bebas Cuti Akademik",
    isi: "Mahasiswa yang berencana mengajukan cuti akademik untuk semester mendatang diharapkan menyerahkan permohonan paling lambat satu minggu sebelum jadwal UTS dimulai.",
    target: "SEMUA",
    targetId: null,
    targetNama: "Seluruh Mahasiswa",
    penulisId: "usr-admin-1",
    namaPenulis: "Bagian Akademik",
    terbitPada: "2026-09-25 11:30:00",
  },
];

let pengumumanDibacaStore: PengumumanDibacaRecord[] = [
  {
    pengumumanId: "peng-1",
    penggunaId: "mhs-1",
    dibacaPada: "2026-08-16 10:12:00",
  },
];

// In-Memory Store Kalender Akademik
let kalenderStore: KalenderItem[] = [
  {
    id: "kal-1",
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    jenis: "BAYAR_UKT",
    keterangan: "Pembayaran UKT dan Pendaftaran Ulang Mahasiswa",
    mulai: "2026-08-01",
    selesai: "2026-08-31",
  },
  {
    id: "kal-2",
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    jenis: "KRS",
    keterangan: "Pengisian, Konsultasi, dan Persetujuan KRS Online",
    mulai: "2026-08-15",
    selesai: "2026-10-31", // Periode KRS saat ini sedang aktif
  },
  {
    id: "kal-3",
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    jenis: "UTS",
    keterangan: "Pelaksanaan Ujian Tengah Semester (UTS)",
    mulai: "2026-10-26",
    selesai: "2026-11-06",
  },
  {
    id: "kal-4",
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    jenis: "UAS",
    keterangan: "Pelaksanaan Ujian Akhir Semester (UAS)",
    mulai: "2027-01-11",
    selesai: "2027-01-22",
  },
  {
    id: "kal-5",
    tahunAjaranId: SEED_TAHUN_AJARAN.id,
    tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
    jenis: "LIBUR",
    keterangan: "Libur Akhir Semester Ganjil",
    mulai: "2027-01-25",
    selesai: "2027-02-12",
  },
];

export const AdministrasiStore = {
  // Pengumuman
  getSemuaPengumuman: (): PengumumanItem[] => {
    return [...pengumumanStore].sort(
      (a, b) => new Date(b.terbitPada).getTime() - new Date(a.terbitPada).getTime()
    );
  },

  getPengumumanForUser: (
    user: UserAcademicProfile,
    userId: string
  ): (PengumumanItem & { sudahDibaca: boolean })[] => {
    const relevant = pengumumanStore.filter((p) => isPengumumanRelevan(p, user));

    return relevant.map((p) => {
      const read = pengumumanDibacaStore.some(
        (r) => r.pengumumanId === p.id && r.penggunaId === userId
      );
      return {
        ...p,
        sudahDibaca: read,
      };
    });
  },

  tambahPengumuman: (params: {
    judul: string;
    isi: string;
    target: TargetPengumuman;
    targetId?: string | null;
    targetNama?: string;
    penulisId: string;
    namaPenulis: string;
  }): PengumumanItem => {
    const newPeng: PengumumanItem = {
      id: `peng-${Date.now()}`,
      ...params,
      terbitPada: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    pengumumanStore.unshift(newPeng);
    return newPeng;
  },

  tandaiDibaca: (pengumumanId: string, penggunaId: string) => {
    const existing = pengumumanDibacaStore.find(
      (r) => r.pengumumanId === pengumumanId && r.penggunaId === penggunaId
    );
    if (!existing) {
      pengumumanDibacaStore.push({
        pengumumanId,
        penggunaId,
        dibacaPada: new Date().toISOString().replace("T", " ").substring(0, 19),
      });
    }
  },

  // Kalender Akademik
  getSemuaKalender: (tahunAjaranId = SEED_TAHUN_AJARAN.id): KalenderItem[] => {
    return kalenderStore.filter((k) => k.tahunAjaranId === tahunAjaranId);
  },

  tambahKalender: (params: {
    jenis: JenisKegiatanKalender;
    keterangan: string;
    mulai: string;
    selesai: string;
  }): KalenderItem => {
    const newItem: KalenderItem = {
      id: `kal-${Date.now()}`,
      tahunAjaranId: SEED_TAHUN_AJARAN.id,
      tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
      ...params,
    };
    kalenderStore.push(newItem);
    return newItem;
  },

  // Pengendali Fitur: Cek apakah periode KRS sedang dibuka saat ini (Bab 2.2 F13)
  isKrsBuka: (tanggalAcuan: Date = new Date()): { buka: boolean; periode?: KalenderItem } => {
    const krsKalender = kalenderStore.find((k) => k.jenis === "KRS");
    if (!krsKalender) return { buka: true }; // Bawaan buka jika belum disetel

    const buka = isPeriodeAktif(krsKalender.mulai, krsKalender.selesai, tanggalAcuan);
    return { buka, periode: krsKalender };
  },
};
