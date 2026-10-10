import { describe, it, expect } from "vitest";
import {
  hitungProgresKelulusan,
  MataKuliahSelesai,
} from "../src/lib/akademik/progres-kelulusan";

describe("Modul Perhitungan Progres Kelulusan Mahasiswa (Fase 3)", () => {
  it("1. Menangani riwayat mata kuliah kosong dengan aman", () => {
    const hasil = hitungProgresKelulusan([], 0);
    expect(hasil.totalSksLulus).toBe(0);
    expect(hasil.persenTotal).toBe(0);
    expect(hasil.sksWajibLulus).toBe(0);
    expect(hasil.sksPilihanLulus).toBe(0);
    expect(hasil.sisaSksTotal).toBe(144);
    expect(hasil.perkiraanSemesterTersisa).toBe(8); // 144 / 20 = 8 semester
    expect(hasil.statusKelayakanSkripsi).toBe(false);
  });

  it("2. Menghitung pemisahan SKS wajib dan pilihan secara presisi", () => {
    const daftarMk: MataKuliahSelesai[] = [
      { kodeMataKuliah: "TIF101", sks: 3, jenis: "WAJIB", lulus: true },
      { kodeMataKuliah: "TIF102", sks: 3, jenis: "WAJIB", lulus: true },
      { kodeMataKuliah: "TIF103", sks: 2, jenis: "WAJIB", lulus: true },
      { kodeMataKuliah: "TIF401", sks: 3, jenis: "PILIHAN", lulus: true },
      { kodeMataKuliah: "TIF402", sks: 3, jenis: "PILIHAN", lulus: true },
      { kodeMataKuliah: "TIF201", sks: 3, jenis: "WAJIB", lulus: false }, // Tidak lulus, tidak dihitung
    ];

    const hasil = hitungProgresKelulusan(daftarMk, 0);
    expect(hasil.sksWajibLulus).toBe(8); // 3+3+2
    expect(hasil.sksPilihanLulus).toBe(6); // 3+3
    expect(hasil.totalSksLulus).toBe(14);
    expect(hasil.sisaSksWajib).toBe(126 - 8); // 118
    expect(hasil.sisaSksPilihan).toBe(18 - 6); // 12
  });

  it("3. Menghitung perkiraan sisa semester dengan mempertimbangkan semester berjalan", () => {
    // Mahasiswa semester 5 yang sudah lulus 85 SKS dan sedang menempuh 21 SKS di KRS
    const daftarMk: MataKuliahSelesai[] = [
      { kodeMataKuliah: "MK-WAJIB-1", sks: 73, jenis: "WAJIB", lulus: true },
      { kodeMataKuliah: "MK-PILIHAN-1", sks: 12, jenis: "PILIHAN", lulus: true },
    ];
    // Total lulus: 85 SKS. Target 144 SKS. Sisa total: 59 SKS.
    // Sedang ditempuh semester ini: 21 SKS.
    // Sisa setelah semester ini: 59 - 21 = 38 SKS.
    // Perkiraan sisa semester: Math.ceil(38 / 20) = 2 semester lagi (Semester 6 dan 7)!

    const hasil = hitungProgresKelulusan(daftarMk, 21);
    expect(hasil.totalSksLulus).toBe(85);
    expect(hasil.persenTotal).toBe(59);
    expect(hasil.sisaSksTotal).toBe(59);
    expect(hasil.perkiraanSemesterTersisa).toBe(2);
    // 85 + 21 = 106 SKS >= 100 SKS -> memenuhi syarat skripsi
    expect(hasil.statusKelayakanSkripsi).toBe(true);
  });

  it("4. Menghasilkan perkiraan 0 semester bila SKS target sudah terpenuhi", () => {
    const lulusSemua: MataKuliahSelesai[] = [
      { kodeMataKuliah: "MK-W", sks: 126, jenis: "WAJIB", lulus: true },
      { kodeMataKuliah: "MK-P", sks: 18, jenis: "PILIHAN", lulus: true },
    ];
    const hasil = hitungProgresKelulusan(lulusSemua, 0);
    expect(hasil.totalSksLulus).toBe(144);
    expect(hasil.persenTotal).toBe(100);
    expect(hasil.sisaSksTotal).toBe(0);
    expect(hasil.perkiraanSemesterTersisa).toBe(0);
  });
});
