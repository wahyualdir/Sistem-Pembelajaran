export interface MahasiswaItem {
  id: string;
  nim: string;
  nama: string;
  email: string;
  angkatan: number;
  prodiId: string;
  dosenWaliId?: string | null;
  status: "AKTIF" | "CUTI" | "LULUS" | "KELUAR";
}

export interface DosenItem {
  id: string;
  nidn: string;
  nama: string;
  email: string;
  penandaWali: boolean;
  penandaKaprodi: boolean;
  statusAktif: boolean;
}

export interface ProgramStudiItem {
  id: string;
  kode: string;
  nama: string;
  jenjang: string;
  kaprodiId?: string | null;
}

export interface RuangItem {
  id: string;
  kode: string;
  nama: string;
  kapasitas: number;
  gedung: string;
  statusAktif: boolean;
}

export interface TahunAjaranItem {
  id: string;
  kode: string;
  semester: "GANJIL" | "GENAP";
  tanggalMulai: string;
  tanggalSelesai: string;
  aktif: boolean;
}

export interface MataKuliahItem {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  jenis: "WAJIB" | "PILIHAN";
  semesterPaket: number;
  prodiId: string;
  statusAktif: boolean;
  prasyarat?: {
    id: string;
    prasyaratId: string;
    namaPrasyarat: string;
    kodePrasyarat: string;
    nilaiMinimal: string;
  }[];
}

export interface PrasyaratItem {
  id: string;
  mataKuliahId: string;
  prasyaratId: string;
  nilaiMinimal: string;
}
