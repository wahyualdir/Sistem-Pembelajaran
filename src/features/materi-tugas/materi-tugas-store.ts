import { JadwalStore } from "../jadwal/jadwal-store";
import { MasterStore } from "../master/master-store";
import { KrsStore } from "../krs/krs-store";
import { cekKeterlambatanTugas } from "@/lib/akademik/syarat-ujian";

export interface MateriItem {
  id: string;
  kelasId: string;
  kodeMataKuliah: string;
  namaMataKuliah: string;
  kodeKelas: string;
  judul: string;
  deskripsi?: string;
  pathFile: string;
  ukuranMb: number;
  tanggalUpload: string;
  diunggahOleh: string;
}

export interface TugasItem {
  id: string;
  kelasId: string;
  kodeMataKuliah: string;
  namaMataKuliah: string;
  kodeKelas: string;
  judul: string;
  deskripsi: string;
  tenggat: string; // ISO datetime string
  waktuDibuat: string;
}

export interface PengumpulanTugasItem {
  id: string;
  tugasId: string;
  mahasiswaId: string;
  nim: string;
  namaMahasiswa: string;
  pathFile: string;
  waktuKumpul: string;
  terlambat: boolean;
  nilai?: number | null;
  catatanDosen?: string | null;
}

// In-Memory Seeds
let materiStore: MateriItem[] = [
  {
    id: "mat-1",
    kelasId: "kls-tif101-a",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Pemrograman Dasar",
    kodeKelas: "A",
    judul: "Modul 01 - Pengantar Algoritma dan Notasi Flowchart",
    deskripsi: "Materi pengenalan dasar logika komputasi, algoritma sekuensial, dan flowchart standar ISO.",
    pathFile: "https://drive.google.com/siakad/materi/modul-01-algoritma.pdf",
    ukuranMb: 2.4,
    tanggalUpload: "2026-09-02",
    diunggahOleh: "Dr. Ardiansyah, S.T., M.Kom.",
  },
  {
    id: "mat-2",
    kelasId: "kls-tif101-a",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Pemrograman Dasar",
    kodeKelas: "A",
    judul: "Modul 02 - Variabel, Operator, dan Tipe Data Primitif C++",
    deskripsi: "Panduan sintaks dasar C++, alokasi memori untuk tipe data primitif, dan operator aritmatika.",
    pathFile: "https://drive.google.com/siakad/materi/modul-02-variabel-cpp.pdf",
    ukuranMb: 3.1,
    tanggalUpload: "2026-09-09",
    diunggahOleh: "Dr. Ardiansyah, S.T., M.Kom.",
  },
  {
    id: "mat-3",
    kelasId: "kls-tif201-a",
    kodeMataKuliah: "TIF201",
    namaMataKuliah: "Struktur Data & Algoritma",
    kodeKelas: "A",
    judul: "Modul 01 - Pengantar Linked List Sederhana",
    deskripsi: "Konsep node, pointer, alokasi memori heap, dan operasi penambahan/penghapusan simpul.",
    pathFile: "https://drive.google.com/siakad/materi/modul-linked-list.pdf",
    ukuranMb: 1.8,
    tanggalUpload: "2026-09-03",
    diunggahOleh: "Nurul Hidayati, M.Kom.",
  },
];

let tugasStore: TugasItem[] = [
  {
    id: "tug-1",
    kelasId: "kls-tif101-a",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Pemrograman Dasar",
    kodeKelas: "A",
    judul: "Tugas 01: Implementasi Program Kasir Sederhana",
    deskripsi: "Buatlah program C++ menggunakan struktur percabangan switch-case dan perulangan while untuk menghitung total belanja dengan diskon bertingkat.",
    tenggat: "2026-10-15T23:59:00",
    waktuDibuat: "2026-09-10 08:00:00",
  },
  {
    id: "tug-2",
    kelasId: "kls-tif101-a",
    kodeMataKuliah: "TIF101",
    namaMataKuliah: "Pemrograman Dasar",
    kodeKelas: "A",
    judul: "Tugas 02: Analisis Logika Sorting Array",
    deskripsi: "Tuliskan kode program dan trace table untuk algoritma Bubble Sort pada 10 angka acak.",
    tenggat: "2026-10-25T23:59:00",
    waktuDibuat: "2026-09-17 10:00:00",
  },
];

let pengumpulanStore: PengumpulanTugasItem[] = [
  {
    id: "kumpul-1",
    tugasId: "tug-1",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    namaMahasiswa: "Wahyu Aldi Riyanto",
    pathFile: "https://drive.google.com/siakad/tugas/223510001_tugas01.zip",
    waktuKumpul: "2026-10-12 19:30:00",
    terlambat: false,
    nilai: 92,
    catatanDosen: "Struktur kode sangat rapi dan penanganan kasus batas diskon tepat.",
  },
];

export const MateriTugasStore = {
  // Materi
  getMateriByKelas: (kelasId: string): MateriItem[] => {
    return materiStore.filter((m) => m.kelasId === kelasId);
  },

  getAllMateriByMahasiswa: (mahasiswaId: string): MateriItem[] => {
    const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
    if (!krs || krs.status !== "DISETUJUI") return [];
    const classIds = krs.items.map((i) => i.kelasId);
    return materiStore.filter((m) => classIds.includes(m.kelasId));
  },

  tambahMateri: (params: {
    kelasId: string;
    judul: string;
    deskripsi?: string;
    pathFile: string;
    ukuranMb: number;
    diunggahOleh: string;
  }): MateriItem => {
    const kelas = JadwalStore.getKelasById(params.kelasId);
    if (!kelas) throw new Error("Kelas tidak ditemukan.");

    const newMateri: MateriItem = {
      id: `mat-${Date.now()}`,
      kelasId: params.kelasId,
      kodeMataKuliah: kelas.kodeMataKuliah,
      namaMataKuliah: kelas.namaMataKuliah,
      kodeKelas: kelas.kode,
      judul: params.judul,
      deskripsi: params.deskripsi,
      pathFile: params.pathFile,
      ukuranMb: params.ukuranMb,
      tanggalUpload: new Date().toISOString().substring(0, 10),
      diunggahOleh: params.diunggahOleh,
    };

    materiStore.unshift(newMateri);
    return newMateri;
  },

  // Tugas
  getTugasByKelas: (kelasId: string): TugasItem[] => {
    return tugasStore.filter((t) => t.kelasId === kelasId);
  },

  getTugasMahasiswa: (
    mahasiswaId: string
  ): (TugasItem & { pengumpulan?: PengumpulanTugasItem })[] => {
    const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
    if (!krs || krs.status !== "DISETUJUI") return [];
    const classIds = krs.items.map((i) => i.kelasId);

    const eligibleTugas = tugasStore.filter((t) => classIds.includes(t.kelasId));
    return eligibleTugas.map((t) => {
      const kumpul = pengumpulanStore.find(
        (p) => p.tugasId === t.id && p.mahasiswaId === mahasiswaId
      );
      return {
        ...t,
        pengumpulan: kumpul,
      };
    });
  },

  tambahTugas: (params: {
    kelasId: string;
    judul: string;
    deskripsi: string;
    tenggat: string;
  }): TugasItem => {
    const kelas = JadwalStore.getKelasById(params.kelasId);
    if (!kelas) throw new Error("Kelas tidak ditemukan.");

    const newTugas: TugasItem = {
      id: `tug-${Date.now()}`,
      kelasId: params.kelasId,
      kodeMataKuliah: kelas.kodeMataKuliah,
      namaMataKuliah: kelas.namaMataKuliah,
      kodeKelas: kelas.kode,
      judul: params.judul,
      deskripsi: params.deskripsi,
      tenggat: params.tenggat,
      waktuDibuat: new Date().toISOString().replace("T", " ").substring(0, 19),
    };

    tugasStore.unshift(newTugas);
    return newTugas;
  },

  // Pengumpulan Tugas Mahasiswa
  kumpulkanTugas: (params: {
    tugasId: string;
    mahasiswaId: string;
    pathFile: string;
  }): PengumpulanTugasItem => {
    const tugas = tugasStore.find((t) => t.id === params.tugasId);
    if (!tugas) throw new Error("Tugas tidak ditemukan.");

    const mhs = MasterStore.getMahasiswaById(params.mahasiswaId);
    if (!mhs) throw new Error("Data mahasiswa tidak valid.");

    const now = new Date();
    const deadline = new Date(tugas.tenggat);
    // Otomatis tandai terlambat bila waktu kumpul > tenggat (Bab 6.9)
    const terlambat = cekKeterlambatanTugas(now, deadline);

    const nowStr = now.toISOString().replace("T", " ").substring(0, 19);

    // Hapus pengumpulan lama jika ada
    pengumpulanStore = pengumpulanStore.filter(
      (p) => !(p.tugasId === params.tugasId && p.mahasiswaId === params.mahasiswaId)
    );

    const newKumpul: PengumpulanTugasItem = {
      id: `kumpul-${Date.now()}`,
      tugasId: params.tugasId,
      mahasiswaId: params.mahasiswaId,
      nim: mhs.nim,
      namaMahasiswa: mhs.nama,
      pathFile: params.pathFile,
      waktuKumpul: nowStr,
      terlambat,
      nilai: null,
      catatanDosen: null,
    };

    pengumpulanStore.push(newKumpul);
    return newKumpul;
  },

  // Pengumpulan tugas per tugas untuk dosen
  getPengumpulanByTugas: (tugasId: string): PengumpulanTugasItem[] => {
    return pengumpulanStore.filter((p) => p.tugasId === tugasId);
  },

  beriNilaiTugas: (params: {
    pengumpulanId: string;
    nilai: number;
    catatanDosen: string;
  }) => {
    const kumpul = pengumpulanStore.find((p) => p.id === params.pengumpulanId);
    if (!kumpul) throw new Error("Data pengumpulan tidak ditemukan.");

    kumpul.nilai = params.nilai;
    kumpul.catatanDosen = params.catatanDosen;
    return kumpul;
  },
};
