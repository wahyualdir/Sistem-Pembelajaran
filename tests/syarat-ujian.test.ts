import { describe, it, expect } from "vitest";
import {
  hitungPersentaseKehadiran,
  evaluasiKelayakanUjian,
  cekKeterlambatanTugas,
} from "../src/lib/akademik/syarat-ujian";

describe("Evaluasi Syarat Kartu Ujian (Bab 6.6) & Presensi (Bab 6.5)", () => {
  describe("hitungPersentaseKehadiran", () => {
    it("menghitung persentase kehadiran dengan benar", () => {
      // 12 dari 16 hadir = 75%
      expect(hitungPersentaseKehadiran(12, 16)).toBe(75.0);
      // 14 dari 16 hadir = 87.5%
      expect(hitungPersentaseKehadiran(14, 16)).toBe(87.5);
      // 10 dari 16 hadir = 62.5%
      expect(hitungPersentaseKehadiran(10, 16)).toBe(62.5);
    });

    it("mengembalikan 100% jika belum ada pertemuan yang dilaksanakan", () => {
      expect(hitungPersentaseKehadiran(0, 0)).toBe(100.0);
    });
  });

  describe("evaluasiKelayakanUjian - 3 Syarat Wajib", () => {
    it("menerbitkan kartu ujian jika seluruh 3 syarat terpenuhi (KRS Disetujui, UKT Lunas, Kehadiran >= 75%)", () => {
      const hasil = evaluasiKelayakanUjian({
        krsStatus: "DISETUJUI",
        uktStatus: "LUNAS",
        persentaseKehadiran: 85.0,
      });

      expect(hasil.layak).toBe(true);
      expect(hasil.alasanTidakLayak).toHaveLength(0);
      expect(hasil.krsTerpenuhi).toBe(true);
      expect(hasil.uktTerpenuhi).toBe(true);
      expect(hasil.kehadiranTerpenuhi).toBe(true);
    });

    it("menerima status UKT dispensasi sebagai pengganti lunas", () => {
      const hasil = evaluasiKelayakanUjian({
        krsStatus: "DISETUJUI",
        uktStatus: "DISPENSASI",
        persentaseKehadiran: 80.0,
      });

      expect(hasil.layak).toBe(true);
      expect(hasil.uktTerpenuhi).toBe(true);
    });

    it("menolak jika UKT belum lunas dan menyebutkan alasannya dengan jelas", () => {
      const hasil = evaluasiKelayakanUjian({
        krsStatus: "DISETUJUI",
        uktStatus: "BELUM",
        persentaseKehadiran: 80.0,
      });

      expect(hasil.layak).toBe(false);
      expect(hasil.uktTerpenuhi).toBe(false);
      expect(hasil.alasanTidakLayak.some((a) => a.includes("UKT"))).toBe(true);
    });

    it("menolak jika KRS belum disetujui dosen wali", () => {
      const hasil = evaluasiKelayakanUjian({
        krsStatus: "DIAJUKAN",
        uktStatus: "LUNAS",
        persentaseKehadiran: 90.0,
      });

      expect(hasil.layak).toBe(false);
      expect(hasil.krsTerpenuhi).toBe(false);
      expect(hasil.alasanTidakLayak.some((a) => a.includes("KRS"))).toBe(true);
    });

    it("menolak jika kehadiran tepat di bawah 75% (misal 74.9%)", () => {
      const hasil = evaluasiKelayakanUjian({
        krsStatus: "DISETUJUI",
        uktStatus: "LUNAS",
        persentaseKehadiran: 74.9,
      });

      expect(hasil.layak).toBe(false);
      expect(hasil.kehadiranTerpenuhi).toBe(false);
      expect(hasil.alasanTidakLayak.some((a) => a.includes("Kehadiran"))).toBe(true);
    });

    it("mengakumulasikan semua alasan jika ketiga syarat tidak ada yang terpenuhi", () => {
      const hasil = evaluasiKelayakanUjian({
        krsStatus: "DRAF",
        uktStatus: "BELUM",
        persentaseKehadiran: 60.0,
      });

      expect(hasil.layak).toBe(false);
      expect(hasil.alasanTidakLayak).toHaveLength(3);
    });
  });

  describe("cekKeterlambatanTugas (Bab 6.9)", () => {
    it("menandai terlambat jika waktu kumpul melebihi batas tenggat", () => {
      const deadline = new Date("2026-10-15T23:59:59");
      const submissionLate = new Date("2026-10-16T00:05:00");
      expect(cekKeterlambatanTugas(submissionLate, deadline)).toBe(true);
    });

    it("tidak menandai terlambat jika waktu kumpul sebelum atau tepat saat batas tenggat", () => {
      const deadline = new Date("2026-10-15T23:59:59");
      const submissionOnTime = new Date("2026-10-15T22:30:00");
      expect(cekKeterlambatanTugas(submissionOnTime, deadline)).toBe(false);
    });
  });
});
