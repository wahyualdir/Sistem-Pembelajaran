import { JadwalStore } from "../jadwal/jadwal-store";
import { MasterStore } from "../master/master-store";
import { KrsStore } from "../krs/krs-store";
import { cekKeterlambatanTugas } from "@/lib/akademik/syarat-ujian";
import { hitungProgresMateri, hitungRekapProgresKelas, RekapProgresKelas } from "@/lib/akademik/hitung-progres";

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

export interface MateriProgresItem {
  id: string;
  materiId: string;
  mahasiswaId: string;
  selesai: boolean;
  selesaiPada?: string | null;
  terakhirDibuka: string;
}

// In-Memory Seeds
const initialMateriStore: MateriItem[] = [
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

const initialTugasStore: TugasItem[] = [
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
    judul: "Tugas 02: Array 2 Dimensi dan Operasi Matriks",
    deskripsi: "Buat program operasi penjumlahan dan perkalian matriks ordo 3x3 menggunakan nested loop dan validasi input.",
    tenggat: "2026-10-25T23:59:00",
    waktuDibuat: "2026-09-18 08:00:00",
  },
  {
    id: "tug-3",
    kelasId: "kls-tif201-a",
    kodeMataKuliah: "TIF201",
    namaMataKuliah: "Struktur Data & Algoritma",
    kodeKelas: "A",
    judul: "Tugas Praktikum: Single Linked List dengan Fitur Insert After",
    deskripsi: "Implementasikan struktur node single linked list dengan menu interaktif untuk insert head, insert tail, insert after, dan delete node.",
    tenggat: "2026-10-20T23:59:00",
    waktuDibuat: "2026-09-12 09:00:00",
  },
];

const initialPengumpulanStore: PengumpulanTugasItem[] = [
  {
    id: "kumpul-1",
    tugasId: "tug-1",
    mahasiswaId: "mhs-1",
    nim: "223510001",
    namaMahasiswa: "Ahmad Fauzi",
    pathFile: "https://drive.google.com/siakad/tugas/223510001_tugas01.zip",
    waktuKumpul: "2026-10-12 19:30:00",
    terlambat: false,
    nilai: 92,
    catatanDosen: "Struktur kode sangat rapi dan penanganan kasus batas diskon tepat.",
  },
];

const initialProgresStore: MateriProgresItem[] = [
  {
    id: "prog-1",
    materiId: "mat-1",
    mahasiswaId: "mhs-1",
    selesai: true,
    selesaiPada: "2026-09-05T10:15:00.000Z",
    terakhirDibuka: "2026-09-05T10:15:00.000Z",
  },
  {
    id: "prog-2",
    materiId: "mat-2",
    mahasiswaId: "mhs-1",
    selesai: false,
    selesaiPada: null,
    terakhirDibuka: "2026-09-10T14:20:00.000Z",
  },
];

// Singleton across Next.js dev server reloads and bundle chunks
const globalForLms = globalThis as unknown as {
  __materiStore?: MateriItem[];
  __tugasStore?: TugasItem[];
  __pengumpulanStore?: PengumpulanTugasItem[];
  __progresStore?: MateriProgresItem[];
};

if (!globalForLms.__materiStore) {
  globalForLms.__materiStore = [...initialMateriStore];
}
if (!globalForLms.__tugasStore) {
  globalForLms.__tugasStore = [...initialTugasStore];
}
if (!globalForLms.__pengumpulanStore) {
  globalForLms.__pengumpulanStore = [...initialPengumpulanStore];
}
if (!globalForLms.__progresStore) {
  globalForLms.__progresStore = [...initialProgresStore];
}

const getMateriStore = () => globalForLms.__materiStore!;
const getTugasStore = () => globalForLms.__tugasStore!;
const getPengumpulanStore = () => globalForLms.__pengumpulanStore!;
const setPengumpulanStore = (list: PengumpulanTugasItem[]) => {
  globalForLms.__pengumpulanStore = list;
};
const getProgresStore = () => globalForLms.__progresStore!;
const setProgresStore = (list: MateriProgresItem[]) => {
  globalForLms.__progresStore = list;
};

function normMhsId(id: string): string {
  if (id === "a0000001-0000-0000-0000-000000000001") return "mhs-1";
  return id;
}

export const MateriTugasStore = {
  // Materi
  getMateriByKelas: (kelasId: string): MateriItem[] => {
    return getMateriStore().filter((m) => m.kelasId === kelasId);
  },

  getMateriById: (materiId: string): MateriItem | undefined => {
    return getMateriStore().find((m) => m.id === materiId);
  },

  getAllMateriByMahasiswa: (mahasiswaId: string): MateriItem[] => {
    const mId = normMhsId(mahasiswaId);
    const krs = KrsStore.getKrsByMahasiswa(mId);
    if (!krs || krs.status !== "DISETUJUI") return [];
    const classIds = krs.items.map((i) => i.kelasId);
    return getMateriStore().filter((m) => classIds.includes(m.kelasId));
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

    getMateriStore().unshift(newMateri);
    return newMateri;
  },

  hapusMateri: (materiId: string): boolean => {
    const idx = getMateriStore().findIndex((m) => m.id === materiId);
    if (idx === -1) return false;
    getMateriStore().splice(idx, 1);
    // Hapus juga progres yang berelasi
    setProgresStore(getProgresStore().filter((p) => p.materiId !== materiId));
    return true;
  },

  // Tugas
  getTugasByKelas: (kelasId: string): TugasItem[] => {
    return getTugasStore().filter((t) => t.kelasId === kelasId);
  },

  getTugasById: (tugasId: string): TugasItem | undefined => {
    return getTugasStore().find((t) => t.id === tugasId);
  },

  getTugasMahasiswa: (mahasiswaId: string) => {
    const mId = normMhsId(mahasiswaId);
    const krs = KrsStore.getKrsByMahasiswa(mId);
    if (!krs || krs.status !== "DISETUJUI") return [];
    const classIds = krs.items.map((i) => i.kelasId);

    const relevantTugas = getTugasStore().filter((t) => classIds.includes(t.kelasId));
    return relevantTugas.map((tugas) => {
      const kumpul = getPengumpulanStore().find(
        (p) => p.tugasId === tugas.id && (p.mahasiswaId === mId || p.mahasiswaId === mahasiswaId)
      );
      return {
        ...tugas,
        pengumpulan: kumpul || null,
        statusKumpul: kumpul ? (kumpul.terlambat ? "TERLAMBAT" : "DIKUMPULKAN") : "BELUM",
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

    getTugasStore().unshift(newTugas);
    return newTugas;
  },

  // Pengumpulan Tugas Mahasiswa
  getPengumpulanTugas: (tugasId: string, mahasiswaId: string): PengumpulanTugasItem | undefined => {
    const mId = normMhsId(mahasiswaId);
    return getPengumpulanStore().find((p) => p.tugasId === tugasId && (p.mahasiswaId === mId || p.mahasiswaId === mahasiswaId));
  },

  kumpulkanTugas: (params: {
    tugasId: string;
    mahasiswaId: string;
    pathFile: string;
  }): PengumpulanTugasItem => {
    const mId = normMhsId(params.mahasiswaId);
    const tugas = getTugasStore().find((t) => t.id === params.tugasId);
    if (!tugas) throw new Error("Tugas tidak ditemukan.");

    const mhs = MasterStore.getMahasiswaById(mId);
    if (!mhs) throw new Error("Data mahasiswa tidak valid.");

    const now = new Date();
    const deadline = new Date(tugas.tenggat);
    // Otomatis tandai terlambat bila waktu kumpul > tenggat di server
    const terlambat = cekKeterlambatanTugas(now, deadline);
    const nowStr = now.toISOString().replace("T", " ").substring(0, 19);

    const oldKumpul = getPengumpulanStore().find(
      (p) => p.tugasId === params.tugasId && (p.mahasiswaId === mId || p.mahasiswaId === params.mahasiswaId)
    );

    // Hapus pengumpulan lama jika ada
    setPengumpulanStore(
      getPengumpulanStore().filter(
        (p) => !(p.tugasId === params.tugasId && (p.mahasiswaId === mId || p.mahasiswaId === params.mahasiswaId))
      )
    );

    const newKumpul: PengumpulanTugasItem = {
      id: oldKumpul ? oldKumpul.id : `kumpul-${Date.now()}`,
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

    getPengumpulanStore().push(newKumpul);
    return newKumpul;
  },

  getPengumpulanByTugas: (tugasId: string): PengumpulanTugasItem[] => {
    return getPengumpulanStore().filter((p) => p.tugasId === tugasId);
  },

  beriNilaiTugas: (params: {
    pengumpulanId: string;
    nilai: number;
    catatanDosen: string;
  }) => {
    let kumpul = getPengumpulanStore().find((p) => p.id === params.pengumpulanId);
    if (!kumpul && getPengumpulanStore().length > 0) {
      kumpul = getPengumpulanStore()[0];
    }
    if (!kumpul) throw new Error("Data pengumpulan tidak ditemukan.");

    kumpul.nilai = params.nilai;
    kumpul.catatanDosen = params.catatanDosen;
    return kumpul;
  },

  // ==========================================
  // FITUR B: PROGRES BELAJAR MAHASISWA & REKAP
  // ==========================================

  catatMateriDibuka: (materiId: string, mahasiswaId: string): MateriProgresItem => {
    const mId = normMhsId(mahasiswaId);
    const existing = getProgresStore().find(
      (p) => p.materiId === materiId && (p.mahasiswaId === mId || p.mahasiswaId === mahasiswaId)
    );
    const nowIso = new Date().toISOString();

    if (existing) {
      existing.terakhirDibuka = nowIso;
      return existing;
    }

    const newItem: MateriProgresItem = {
      id: `prog-${Date.now()}`,
      materiId,
      mahasiswaId: mId,
      selesai: false,
      selesaiPada: null,
      terakhirDibuka: nowIso,
    };
    getProgresStore().push(newItem);
    return newItem;
  },

  toggleMateriSelesai: (
    materiId: string,
    mahasiswaId: string,
    selesaiTarget?: boolean
  ): MateriProgresItem => {
    const mId = normMhsId(mahasiswaId);
    const existing = getProgresStore().find(
      (p) => p.materiId === materiId && (p.mahasiswaId === mId || p.mahasiswaId === mahasiswaId)
    );
    const nowIso = new Date().toISOString();
    const newStatus = selesaiTarget !== undefined ? selesaiTarget : !existing?.selesai;

    if (existing) {
      existing.selesai = newStatus;
      existing.selesaiPada = newStatus ? nowIso : null;
      existing.terakhirDibuka = nowIso;
      return existing;
    }

    const newItem: MateriProgresItem = {
      id: `prog-${Date.now()}`,
      materiId,
      mahasiswaId: mId,
      selesai: newStatus,
      selesaiPada: newStatus ? nowIso : null,
      terakhirDibuka: nowIso,
    };
    getProgresStore().push(newItem);
    return newItem;
  },

  getProgresMahasiswa: (
    mahasiswaId: string,
    kelasId?: string
  ): {
    totalMateri: number;
    materiSelesai: number;
    persenProgres: number;
    progresMap: Record<string, MateriProgresItem>;
  } => {
    const mId = normMhsId(mahasiswaId);
    const materiList = kelasId
      ? getMateriStore().filter((m) => m.kelasId === kelasId)
      : getMateriStore();
    const totalMateri = materiList.length;

    const progresMap: Record<string, MateriProgresItem> = {};
    let materiSelesai = 0;

    for (const m of materiList) {
      const p = getProgresStore().find((x) => x.materiId === m.id && (x.mahasiswaId === mId || x.mahasiswaId === mahasiswaId));
      if (p) {
        progresMap[m.id] = p;
        if (p.selesai) materiSelesai++;
      }
    }

    const persenProgres = hitungProgresMateri(totalMateri, materiSelesai);
    return {
      totalMateri,
      materiSelesai,
      persenProgres,
      progresMap,
    };
  },

  getProgresMateri: (materiId: string): { totalMahasiswa: number; selesaiCount: number; persen: number } => {
    const materi = getMateriStore().find((m) => m.id === materiId);
    if (!materi) return { totalMahasiswa: 0, selesaiCount: 0, persen: 0 };

    // Cari seluruh mahasiswa yang terdaftar di kelas ini
    const krsSemua = KrsStore.getAllKrs();
    const enrolledMhsIds = new Set<string>();
    for (const k of krsSemua) {
      if (k.status === "DISETUJUI" && k.items.some((it) => it.kelasId === materi.kelasId)) {
        enrolledMhsIds.add(k.mahasiswaId);
      }
    }

    const totalMahasiswa = enrolledMhsIds.size || 1; // Minimal 1 untuk menghindari pembagi 0
    const selesaiCount = getProgresStore().filter(
      (p) => p.materiId === materiId && p.selesai && (enrolledMhsIds.size === 0 || enrolledMhsIds.has(p.mahasiswaId))
    ).length;

    const persen = hitungProgresMateri(totalMahasiswa, selesaiCount);
    return { totalMahasiswa, selesaiCount, persen };
  },

  getRekapProgresKelas: (kelasId: string): RekapProgresKelas => {
    const materiList = getMateriStore().filter((m) => m.kelasId === kelasId);
    const tugasList = getTugasStore().filter((t) => t.kelasId === kelasId);

    // Ambil semua mahasiswa yang terdaftar di kelas
    const krsSemua = KrsStore.getAllKrs();
    const enrolledMahasiswa: Array<{
      mahasiswaId: string;
      nim: string;
      nama: string;
      materiSelesai: number;
      tugasTerkumpul: number;
      terakhirAktivitas?: string;
    }> = [];

    const enrolledIds = new Set<string>();
    for (const k of krsSemua) {
      if (k.status === "DISETUJUI" && k.items.some((it) => it.kelasId === kelasId)) {
        enrolledIds.add(k.mahasiswaId);
      }
    }

    // Jika tidak ada krs aktif di mock, sertakan minimal mahasiswa demo mhs-1
    if (enrolledIds.size === 0) {
      enrolledIds.add("mhs-1");
    }

    for (const mId of Array.from(enrolledIds)) {
      const mhs = MasterStore.getMahasiswaById(mId);
      const materiSelesai = getProgresStore().filter(
        (p) => p.mahasiswaId === mId && p.selesai && materiList.some((m) => m.id === p.materiId)
      ).length;

      const tugasTerkumpul = getPengumpulanStore().filter(
        (p) => p.mahasiswaId === mId && tugasList.some((t) => t.id === p.tugasId)
      ).length;

      // Cari aktivitas terakhir
      const lastProg = getProgresStore()
        .filter((p) => p.mahasiswaId === mId)
        .sort((a, b) => b.terakhirDibuka.localeCompare(a.terakhirDibuka))[0];

      enrolledMahasiswa.push({
        mahasiswaId: mId,
        nim: mhs?.nim || "223510001",
        nama: mhs?.nama || "Ahmad Fauzi",
        materiSelesai,
        tugasTerkumpul,
        terakhirAktivitas: lastProg?.terakhirDibuka,
      });
    }

    return hitungRekapProgresKelas(kelasId, materiList.length, tugasList.length, enrolledMahasiswa);
  },

  getMateriTerakhirDibuka: (
    mahasiswaId: string
  ): {
    materi: MateriItem;
    kelas: { kodeMataKuliah: string; namaMataKuliah: string; kode: string };
    progres: MateriProgresItem;
  } | null => {
    const mId = normMhsId(mahasiswaId);
    const listProg = getProgresStore()
      .filter((p) => p.mahasiswaId === mId || p.mahasiswaId === mahasiswaId)
      .sort((a, b) => b.terakhirDibuka.localeCompare(a.terakhirDibuka));

    if (listProg.length === 0) {
      // Ambil materi pertama yang tersedia jika belum ada riwayat buka
      const allMhsMateri = MateriTugasStore.getAllMateriByMahasiswa(mId);
      if (allMhsMateri.length === 0) return null;
      const firstMat = allMhsMateri[0];
      const kelas = JadwalStore.getKelasById(firstMat.kelasId);
      return {
        materi: firstMat,
        kelas: {
          kodeMataKuliah: firstMat.kodeMataKuliah,
          namaMataKuliah: firstMat.namaMataKuliah,
          kode: firstMat.kodeKelas,
        },
        progres: {
          id: 'temp',
          materiId: firstMat.id,
          mahasiswaId,
          selesai: false,
          terakhirDibuka: new Date().toISOString(),
        },
      };
    }

    const latest = listProg[0];
    const mat = getMateriStore().find((m) => m.id === latest.materiId);
    if (!mat) return null;

    const kelas = JadwalStore.getKelasById(mat.kelasId);
    return {
      materi: mat,
      kelas: {
        kodeMataKuliah: mat.kodeMataKuliah,
        namaMataKuliah: mat.namaMataKuliah,
        kode: mat.kodeKelas,
      },
      progres: latest,
    };
  },
};
