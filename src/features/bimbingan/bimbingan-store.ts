import { MasterStore } from "../master/master-store";
import { KrsStore } from "../krs/krs-store";

export interface BimbinganItem {
  id: string;
  mahasiswaId: string;
  nimMahasiswa: string;
  namaMahasiswa: string;
  dosenId: string;
  namaDosen: string;
  tanggal: string;
  topik: string;
  catatanMahasiswa: string;
  catatanDosen?: string | null;
  status: "DIAJUKAN" | "SELESAI";
  waktuDibuat: string;
}

let bimbinganStore: BimbinganItem[] = [
  {
    id: "bim-1",
    mahasiswaId: "mhs-1",
    nimMahasiswa: "223510001",
    namaMahasiswa: "Wahyu Aldi Riyanto",
    dosenId: "dsn-1",
    namaDosen: "Dr. Ardiansyah, S.T., M.Kom.",
    tanggal: "2026-08-28",
    topik: "Konsultasi Pengambilan SKS Semester 5 & Rencana Magang",
    catatanMahasiswa: "Ingin berkonsultasi mengenai batas maksimal 24 SKS dan pilihan mata kuliah peminatan Rekayasa Perangkat Lunak.",
    catatanDosen: "Disetujui mengambil 24 SKS karena IPS semester lalu 3.80. Dianjurkan fokus menyelesaikan prasyarat proyek perangkat lunak.",
    status: "SELESAI",
    waktuDibuat: "2026-08-28 09:30:00",
  },
  {
    id: "bim-2",
    mahasiswaId: "mhs-1",
    nimMahasiswa: "223510001",
    namaMahasiswa: "Wahyu Aldi Riyanto",
    dosenId: "dsn-1",
    namaDosen: "Dr. Ardiansyah, S.T., M.Kom.",
    tanggal: "2026-09-18",
    topik: "Rencana Topik Tugas Akhir / Skripsi",
    catatanMahasiswa: "Mohon arahan mengenai topik penelitian sistem cerdas berbasis graf pengetahuan.",
    catatanDosen: null,
    status: "DIAJUKAN",
    waktuDibuat: "2026-09-18 14:10:00",
  },
  {
    id: "bim-3",
    mahasiswaId: "mhs-4",
    nimMahasiswa: "223510004",
    namaMahasiswa: "Dimas Anggara Putra",
    dosenId: "dsn-1",
    namaDosen: "Dr. Ardiansyah, S.T., M.Kom.",
    tanggal: "2026-09-01",
    topik: "Evaluasi Hasil Studi dan Perbaikan Nilai",
    catatanMahasiswa: "Konsultasi mata kuliah yang perlu diulang pada semester ini.",
    catatanDosen: "Disarankan mengulang Pemrograman Dasar agar fondasi logika pemrograman lebih kokoh sebelum lanjut ke Algoritma Lanjut.",
    status: "SELESAI",
    waktuDibuat: "2026-09-01 11:00:00",
  },
];

export const BimbinganStore = {
  getBimbinganByDosen: (dosenId: string): BimbinganItem[] => {
    return bimbinganStore
      .filter((b) => b.dosenId === dosenId)
      .sort((a, b) => new Date(b.waktuDibuat).getTime() - new Date(a.waktuDibuat).getTime());
  },

  getBimbinganByMahasiswa: (mahasiswaId: string): BimbinganItem[] => {
    return bimbinganStore
      .filter((b) => b.mahasiswaId === mahasiswaId)
      .sort((a, b) => new Date(b.waktuDibuat).getTime() - new Date(a.waktuDibuat).getTime());
  },

  ajukanBimbingan: (
    mahasiswaId: string,
    topik: string,
    catatanMahasiswa: string
  ): BimbinganItem => {
    const mhs = MasterStore.getMahasiswaById(mahasiswaId);
    if (!mhs) throw new Error("Mahasiswa tidak ditemukan.");

    const dosenWali = MasterStore.getDosen().find((d) => d.id === mhs.dosenWaliId);
    const dosenId = dosenWali?.id || "dsn-1";
    const namaDosen = dosenWali?.nama || "Dr. Ardiansyah, S.T., M.Kom.";

    const now = new Date();
    const dateStr = now.toISOString().substring(0, 10);
    const timeStr = now.toISOString().replace("T", " ").substring(0, 19);

    const newBim: BimbinganItem = {
      id: `bim-${Date.now()}`,
      mahasiswaId,
      nimMahasiswa: mhs.nim,
      namaMahasiswa: mhs.nama,
      dosenId,
      namaDosen,
      tanggal: dateStr,
      topik,
      catatanMahasiswa,
      catatanDosen: null,
      status: "DIAJUKAN",
      waktuDibuat: timeStr,
    };

    bimbinganStore.unshift(newBim);
    return newBim;
  },

  tanggapBimbingan: (
    bimbinganId: string,
    catatanDosen: string
  ): BimbinganItem => {
    const bim = bimbinganStore.find((b) => b.id === bimbinganId);
    if (!bim) throw new Error("Bimbingan tidak ditemukan.");

    bim.catatanDosen = catatanDosen;
    bim.status = "SELESAI";
    return bim;
  },
};
