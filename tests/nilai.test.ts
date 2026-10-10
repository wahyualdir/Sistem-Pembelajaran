import { describe, it, expect } from "vitest";
import {
  konversiNilaiKeHuruf,
  validasiTotalBobot,
  hitungNilaiAkhir,
  hitungIPS,
  hitungIPK,
  SKALA_NILAI_DEFAULT,
} from "../src/lib/akademik/nilai";

describe("Modul Akademik: Nilai, IPS, dan IPK", () => {
  describe("konversiNilaiKeHuruf - Batas Kritis", () => {
    it("menangani batas antara A- dan A (84.99 vs 85.00)", () => {
      const diBawah85 = konversiNilaiKeHuruf(84.99);
      expect(diBawah85.huruf).toBe("A-");
      expect(diBawah85.bobot).toBe(3.7);

      const tepat85 = konversiNilaiKeHuruf(85.0);
      expect(tepat85.huruf).toBe("A");
      expect(tepat85.bobot).toBe(4.0);
    });

    it("menangani batas antara B+ dan A- (79.99 vs 80.00)", () => {
      const diBawah80 = konversiNilaiKeHuruf(79.99);
      expect(diBawah80.huruf).toBe("B+");
      expect(diBawah80.bobot).toBe(3.3);

      const tepat80 = konversiNilaiKeHuruf(80.0);
      expect(tepat80.huruf).toBe("A-");
      expect(tepat80.bobot).toBe(3.7);
    });

    it("menangani batas antara E dan D (39.99 vs 40.00)", () => {
      const diBawah40 = konversiNilaiKeHuruf(39.99);
      expect(diBawah40.huruf).toBe("E");
      expect(diBawah40.bobot).toBe(0.0);

      const tepat40 = konversiNilaiKeHuruf(40.0);
      expect(tepat40.huruf).toBe("D");
      expect(tepat40.bobot).toBe(1.0);
    });

    it("menangani nilai ekstrem 0 dan 100", () => {
      expect(konversiNilaiKeHuruf(100)).toEqual({ huruf: "A", bobot: 4.0 });
      expect(konversiNilaiKeHuruf(0)).toEqual({ huruf: "E", bobot: 0.0 });
    });
  });

  describe("validasiTotalBobot", () => {
    it("menerima total bobot yang tepat 100%", () => {
      expect(validasiTotalBobot([20, 30, 50])).toBe(true);
      expect(validasiTotalBobot([10, 20, 30, 40])).toBe(true);
    });

    it("menolak total bobot yang tidak 100%", () => {
      expect(validasiTotalBobot([20, 30, 40])).toBe(false); // 90%
      expect(validasiTotalBobot([30, 40, 40])).toBe(false); // 110%
    });
  });

  describe("hitungNilaiAkhir", () => {
    it("menghitung nilai akhir dengan bobot 100% secara akurat", () => {
      // Tugas 20% (skor 80), UTS 30% (skor 85), UAS 50% (skor 90)
      // Total = 16 + 25.5 + 45 = 86.5 -> A (4.0)
      const hasil = hitungNilaiAkhir([
        { angka: 80, bobotPersen: 20 },
        { angka: 85, bobotPersen: 30 },
        { angka: 90, bobotPersen: 50 },
      ]);

      expect(hasil.valid).toBe(true);
      expect(hasil.nilaiAkhir).toBe(86.5);
      expect(hasil.huruf).toBe("A");
      expect(hasil.bobot).toBe(4.0);
    });

    it("menolak jika total bobot bukan 100%", () => {
      const hasil = hitungNilaiAkhir([
        { angka: 80, bobotPersen: 20 },
        { angka: 85, bobotPersen: 30 },
      ]);
      expect(hasil.valid).toBe(false);
      expect(hasil.pesanGalat).toContain("Total bobot komponen harus 100%");
    });

    it("menolak jika ada angka di luar batas 0-100", () => {
      const hasil = hitungNilaiAkhir([
        { angka: 120, bobotPersen: 50 },
        { angka: 80, bobotPersen: 50 },
      ]);
      expect(hasil.valid).toBe(false);
      expect(hasil.pesanGalat).toContain("antara 0 dan 100");
    });
  });

  describe("hitungIPS", () => {
    it("menghitung IPS dengan rata-rata berbobot SKS", () => {
      // MK 1: 3 SKS, A (4.0) -> Mutu 12
      // MK 2: 3 SKS, B (3.0) -> Mutu 9
      // Total Mutu = 21, Total SKS = 6 -> IPS = 21 / 6 = 3.50
      const nilai = [
        { sks: 3, bobot: 4.0 },
        { sks: 3, bobot: 3.0 },
      ];
      expect(hitungIPS(nilai)).toBe(3.5);
    });

    it("mengembalikan 0 jika daftar nilai kosong atau total SKS 0", () => {
      expect(hitungIPS([])).toBe(0.0);
      expect(hitungIPS([{ sks: 0, bobot: 4.0 }])).toBe(0.0);
    });
  });

  describe("hitungIPK dan Mata Kuliah Diulang", () => {
    it("mengambil nilai terbaik ketika ada mata kuliah yang diulang", () => {
      // Mahasiswa mengambil Pemrograman Dasar (TIF101, 3 SKS) dua kali:
      // Semester 1: Nilai D (bobot 1.0)
      // Semester 3: Nilai A (bobot 4.0) -> Harus diambil yang A (bobot 4.0)
      // Dan Struktur Data (TIF201, 3 SKS): Nilai B (bobot 3.0)
      // Total SKS dihitung: 3 + 3 = 6 SKS (TIF101 tidak dihitung ganda)
      // Total mutu: (3 * 4.0) + (3 * 3.0) = 12 + 9 = 21 -> IPK = 3.50
      const riwayat = [
        {
          kodeMataKuliah: "TIF101",
          namaMataKuliah: "Pemrograman Dasar",
          sks: 3,
          huruf: "D",
          bobot: 1.0,
          semesterPaket: 1,
        },
        {
          kodeMataKuliah: "TIF101",
          namaMataKuliah: "Pemrograman Dasar",
          sks: 3,
          huruf: "A",
          bobot: 4.0,
          semesterPaket: 3,
        },
        {
          kodeMataKuliah: "TIF201",
          namaMataKuliah: "Struktur Data",
          sks: 3,
          huruf: "B",
          bobot: 3.0,
          semesterPaket: 2,
        },
      ];

      const hasil = hitungIPK(riwayat);
      expect(hasil.ipk).toBe(3.5);
      expect(hasil.totalSksDitempuh).toBe(6);
      expect(hasil.totalSksLulus).toBe(6);

      // Cek apakah ditandai diulang
      const tif101 = hasil.daftarMataKuliahFinal.find(
        (m) => m.kodeMataKuliah === "TIF101"
      );
      expect(tif101?.diulang).toBe(true);
      expect(tif101?.huruf).toBe("A");
      expect(tif101?.bobot).toBe(4.0);

      const tif201 = hasil.daftarMataKuliahFinal.find(
        (m) => m.kodeMataKuliah === "TIF201"
      );
      expect(tif201?.diulang).toBe(false);
    });

    it("tidak meluluskan SKS untuk mata kuliah bernilai E", () => {
      const riwayat = [
        {
          kodeMataKuliah: "TIF101",
          namaMataKuliah: "Pemrograman Dasar",
          sks: 3,
          huruf: "A",
          bobot: 4.0,
        },
        {
          kodeMataKuliah: "TIF301",
          namaMataKuliah: "Kecerdasan Buatan",
          sks: 3,
          huruf: "E",
          bobot: 0.0,
        },
      ];

      const hasil = hitungIPK(riwayat);
      expect(hasil.totalSksDitempuh).toBe(6);
      expect(hasil.totalSksLulus).toBe(3); // Hanya TIF101 yang lulus
      // IPK = (3*4 + 3*0) / 6 = 12 / 6 = 2.00
      expect(hasil.ipk).toBe(2.0);
    });

    it("mengembalikan 0 untuk riwayat studi kosong", () => {
      const hasil = hitungIPK([]);
      expect(hasil.ipk).toBe(0.0);
      expect(hasil.totalSksLulus).toBe(0);
      expect(hasil.totalSksDitempuh).toBe(0);
      expect(hasil.daftarMataKuliahFinal).toHaveLength(0);
    });
  });
});
