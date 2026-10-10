import { describe, it, expect } from "vitest";
import {
  hitungSimulasiIpk,
  dapatkanBobotHuruf,
  ItemSimulasiSemester,
} from "../src/lib/akademik/simulasi-ipk";
import { NilaiTranskripItem } from "../src/lib/akademik/nilai";

describe("Modul Simulasi Proyeksi IPK & IPS Mahasiswa (Fase 3)", () => {
  const transkripLalu: NilaiTranskripItem[] = [
    { kodeMataKuliah: "TIF101", namaMataKuliah: "Dasar Pemrograman", sks: 3, huruf: "B", bobot: 3.0 },
    { kodeMataKuliah: "TIF102", namaMataKuliah: "Matematika Diskrit", sks: 3, huruf: "A", bobot: 4.0 },
    { kodeMataKuliah: "TIF103", namaMataKuliah: "Pengantar TI", sks: 2, huruf: "B+", bobot: 3.3 },
    { kodeMataKuliah: "TIF104", namaMataKuliah: "Kalkulus 1", sks: 3, huruf: "D", bobot: 1.0 }, // Nilai D
  ];
  // Total SKS lalu: 11 SKS
  // Total mutu: (3*3) + (4*3) + (3.3*2) + (1*3) = 9 + 12 + 6.6 + 3 = 30.6
  // IPK baseline = 30.6 / 11 = 2.78

  it("1. Konversi huruf target ke bobot mutu bekerja akurat", () => {
    expect(dapatkanBobotHuruf("A")).toBe(4.0);
    expect(dapatkanBobotHuruf("A-")).toBe(3.7);
    expect(dapatkanBobotHuruf("B+")).toBe(3.3);
    expect(dapatkanBobotHuruf("B")).toBe(3.0);
    expect(dapatkanBobotHuruf("C")).toBe(2.0);
    expect(dapatkanBobotHuruf("D")).toBe(1.0);
    expect(dapatkanBobotHuruf("E")).toBe(0.0);
    expect(dapatkanBobotHuruf("invalid")).toBe(0.0);
  });

  it("2. Simulasi dengan daftar mata kuliah kosong mengembalikan nilai baseline", () => {
    const hasil = hitungSimulasiIpk(transkripLalu, []);
    expect(hasil.ipkSaatIni).toBe(2.78);
    expect(hasil.ipkProyeksi).toBe(2.78);
    expect(hasil.selisihIpk).toBe(0.0);
    expect(hasil.ipsProyeksi).toBe(0.0);
  });

  it("3. Simulasi target 'Semua A' pada semester baru menaikkan IPK secara signifikan", () => {
    const semesterBaru: ItemSimulasiSemester[] = [
      { kodeMataKuliah: "TIF201", namaMataKuliah: "Struktur Data", sks: 3, targetHuruf: "A", targetBobot: 4.0 },
      { kodeMataKuliah: "TIF202", namaMataKuliah: "Basis Data", sks: 3, targetHuruf: "A", targetBobot: 4.0 },
      { kodeMataKuliah: "TIF203", namaMataKuliah: "Sistem Operasi", sks: 3, targetHuruf: "A", targetBobot: 4.0 },
    ];
    // Semester baru: 9 SKS semua A (mutu = 36, IPS = 4.00)
    // Kumulatif: 11 + 9 = 20 SKS, Mutu: 30.6 + 36 = 66.6 -> IPK = 66.6 / 20 = 3.33

    const hasil = hitungSimulasiIpk(transkripLalu, semesterBaru);
    expect(hasil.ipsProyeksi).toBe(4.0);
    expect(hasil.ipkProyeksi).toBe(3.33);
    expect(hasil.selisihIpk).toBe(0.55); // Kenaikan +0.55
    expect(hasil.sksBertambah).toBe(9);
  });

  it("4. Simulasi matkul mengulang secara tepat menggantikan nilai lama dengan nilai terbaik", () => {
    // Mahasiswa mengulang TIF104 (Kalkulus 1, sebelumnya D / 1.0) dan menargetkan nilai A (4.0)
    const mengulangKalkulus: ItemSimulasiSemester[] = [
      { kodeMataKuliah: "TIF104", namaMataKuliah: "Kalkulus 1", sks: 3, targetHuruf: "A", targetBobot: 4.0 },
    ];
    // SKS tidak bertambah karena matkul yang sama diulang (11 SKS tetap 11 SKS)
    // Mutu lama 30.6 - (1.0*3) + (4.0*3) = 30.6 - 3 + 12 = 39.6 -> IPK = 39.6 / 11 = 3.60

    const hasil = hitungSimulasiIpk(transkripLalu, mengulangKalkulus);
    expect(hasil.ipkSaatIni).toBe(2.78);
    expect(hasil.ipkProyeksi).toBe(3.60);
    expect(hasil.selisihIpk).toBe(0.82); // Kenaikan drastis +0.82
    expect(hasil.sksBertambah).toBe(0); // SKS tidak berganda
  });

  it("5. Simulasi dengan nilai rendah menghasilkan selisih negatif", () => {
    const semesterRendah: ItemSimulasiSemester[] = [
      { kodeMataKuliah: "TIF201", namaMataKuliah: "Struktur Data", sks: 3, targetHuruf: "D", targetBobot: 1.0 },
      { kodeMataKuliah: "TIF202", namaMataKuliah: "Basis Data", sks: 3, targetHuruf: "C", targetBobot: 2.0 },
    ];
    // 6 SKS: IPS = (3*1 + 3*2) / 6 = 1.50
    // Mutu: 30.6 + 9 = 39.6 / 17 = 2.33

    const hasil = hitungSimulasiIpk(transkripLalu, semesterRendah);
    expect(hasil.ipsProyeksi).toBe(1.5);
    expect(hasil.ipkProyeksi).toBe(2.33);
    expect(hasil.selisihIpk).toBe(-0.45); // Penurunan -0.45
  });
});
