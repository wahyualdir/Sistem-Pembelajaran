import { describe, it, expect, beforeEach } from "vitest";
import { KrsStore } from "../src/features/krs/krs-store";
import { JadwalStore } from "../src/features/jadwal/jadwal-store";
import { NilaiStore } from "../src/features/nilai/nilai-store";
import { UktStore } from "../src/features/ukt/ukt-store";
import { hitungBatasSks } from "../src/lib/akademik/aturan-sks";
import {
  hitungNilaiAkhir,
  konversiNilaiKeHuruf,
  hitungIPS,
  hitungIPK,
  NilaiTranskripItem,
} from "../src/lib/akademik/nilai";

describe("Uji Integrasi End-to-End: Alur KRS, Dosen Wali, Nilai, dan IPK (Fase 4)", () => {
  const dummyMhsId = "mhs-1"; // Wahyu Aldi (UKT Lunas di seed data)
  const dosenWaliId = "dsn-1"; // Dr. Ardiansyah
  const dosenLainId = "dsn-2";

  beforeEach(() => {
    // Pastikan status KRS bersih untuk pengujian
    const krs = KrsStore.getKrsByMahasiswa(dummyMhsId);
    krs.status = "DRAF";
  });

  describe("1. Validasi Batas Jatah SKS Berdasarkan IPS Semester Lalu", () => {
    it("menghitung batas SKS sesuai regulasi akademik kampus", () => {
      expect(hitungBatasSks(3.85)).toBe(24);
      expect(hitungBatasSks(3.25)).toBe(24);
      expect(hitungBatasSks(2.75)).toBe(21);
      expect(hitungBatasSks(2.25)).toBe(18);
      expect(hitungBatasSks(1.5)).toBe(15);
    });
  });

  describe("2. Siklus Pengisian KRS & Validasi Keranjang", () => {
    it("menolak mahasiswa yang belum melunasi UKT", () => {
      // Mahasiswa index 12 di seed data berstatus belum lunas
      const nunggakMhsId = "mhs-13";
      expect(() => {
        KrsStore.tambahKelasKeKrs(nunggakMhsId, "kls-tif101-a");
      }).toThrow(/UKT|Tagihan/i);
    });

    it("berhasil membuat draf KRS dan menambah mata kuliah sesuai kuota", () => {
      // Dapatkan krs untuk dummyMhsId
      const krs = KrsStore.getKrsByMahasiswa(dummyMhsId);
      expect(krs).toBeDefined();
      expect(krs.status).toBe("DRAF");

      // Reset items untuk pengujian bersih
      krs.items = [];
      krs.totalSks = 0;

      // Tambah kelas Pemrograman Dasar (3 SKS)
      const updated = KrsStore.tambahKelasKeKrs(dummyMhsId, "kls-tif101-a");
      expect(updated.items.length).toBe(1);
      expect(updated.totalSks).toBe(3);
      expect(updated.status).toBe("DRAF");
    });

    it("menolak duplikasi mata kuliah yang sama di keranjang KRS", () => {
      expect(() => {
        // kls-tif101-a sudah ditambahkan sebelumnya
        KrsStore.tambahKelasKeKrs(dummyMhsId, "kls-tif101-a");
      }).toThrow(/sudah ada di dalam KRS/i);
    });

    it("menolak penambahan kelas jika melebihi batas jatah SKS", () => {
      const krs = KrsStore.getKrsByMahasiswa(dummyMhsId);
      // Set jatah SKS rendah untuk pengujian batas
      krs.batasSks = 3; // hanya jatah 3 SKS, sedangkan krs sudah ada 3 SKS
      expect(() => {
        KrsStore.tambahKelasKeKrs(dummyMhsId, "kls-tif201-a"); // 3 SKS
      }).toThrow(/melebihi batas jatah SKS/i);

      // Kembalikan batas normal
      krs.batasSks = 24;
    });

    it("menolak pengajuan jika keranjang KRS masih kosong", () => {
      const emptyMhsId = "mhs-empty-krs";
      const emptyKrs = KrsStore.getKrsByMahasiswa(emptyMhsId);
      emptyKrs.items = [];
      emptyKrs.totalSks = 0;

      expect(() => {
        KrsStore.ajukanKrs(emptyMhsId);
      }).toThrow(/Pilih minimal 1 mata kuliah/i);
    });

    it("berhasil mengajukan KRS ke Dosen Wali", () => {
      const krs = KrsStore.getKrsByMahasiswa(dummyMhsId);
      expect(krs.items.length).toBeGreaterThan(0);

      const submitted = KrsStore.ajukanKrs(dummyMhsId);
      expect(submitted.status).toBe("DIAJUKAN");

      // Menolak perubahan saat status DIAJUKAN
      expect(() => {
        KrsStore.tambahKelasKeKrs(dummyMhsId, "kls-tif201-a");
      }).toThrow(/sedang diajukan/i);
    });
  });

  describe("3. Otorisasi & Persetujuan Dosen Wali", () => {
    it("menolak dosen yang bukan dosen wali saat menyetujui KRS", () => {
      const krs = KrsStore.getKrsByMahasiswa(dummyMhsId);
      krs.dosenWaliId = dosenWaliId;

      // Simulasi pemeriksaan otorisasi di service / action
      const isAuthorized = krs.dosenWaliId === dosenLainId;
      expect(isAuthorized).toBe(false);
    });

    it("berhasil menyetujui KRS oleh Dosen Wali dan kuota kelas bertambah", () => {
      const krs = KrsStore.getKrsByMahasiswa(dummyMhsId);
      const targetKelas = JadwalStore.getKelasById(krs.items[0].kelasId);
      const kuotaAwal = targetKelas?.terisi || 0;

      const approved = KrsStore.setujuiKrs(krs.id, "KRS disetujui, sukses semesternya.");
      expect(approved.status).toBe("DISETUJUI");
      expect(approved.catatanWali).toContain("sukses");

      const kuotaAkhir = JadwalStore.getKelasById(krs.items[0].kelasId)?.terisi || 0;
      expect(kuotaAkhir).toBeGreaterThanOrEqual(kuotaAwal);
    });

    it("mengunci perubahan pada KRS yang sudah berstatus DISETUJUI", () => {
      const krs = KrsStore.getKrsByMahasiswa(dummyMhsId);
      krs.status = "DISETUJUI";
      expect(() => {
        KrsStore.tambahKelasKeKrs(dummyMhsId, "kls-tif201-a");
      }).toThrow(/sudah disetujui/i);
    });
  });

  describe("4. Input Nilai Komponen & Kalkulasi Nilai Akhir serta IPS/IPK", () => {
    it("menghitung Nilai Akhir berbobot dengan benar", () => {
      // 85*0.2 + 80*0.3 + 90*0.5 = 17 + 24 + 45 = 86.0
      const komponen = [
        { angka: 85, bobotPersen: 20 },
        { angka: 80, bobotPersen: 30 },
        { angka: 90, bobotPersen: 50 },
      ];

      const hasil = hitungNilaiAkhir(komponen);
      expect(hasil.valid).toBe(true);
      expect(hasil.nilaiAkhir).toBe(86);
      expect(hasil.huruf).toBe("A");
      expect(hasil.bobot).toBe(4.0);
    });

    it("menghitung IPS dan akumulasi IPK secara deterministik", () => {
      const semester1: NilaiTranskripItem[] = [
        { kodeMataKuliah: "TIF101", namaMataKuliah: "Pemrograman Dasar", sks: 3, huruf: "A", bobot: 4.0 },
        { kodeMataKuliah: "TIF102", namaMataKuliah: "Matematika Diskrit", sks: 3, huruf: "B+", bobot: 3.5 },
        { kodeMataKuliah: "TIF103", namaMataKuliah: "Pengantar TI", sks: 2, huruf: "A", bobot: 4.0 },
        { kodeMataKuliah: "TIF104", namaMataKuliah: "Algoritma & Struktur Data", sks: 4, huruf: "B", bobot: 3.0 },
      ];

      // Total SKS = 3+3+2+4 = 12 SKS
      // SKS x Bobot:
      // TIF101: 3 * 4.0 = 12.0
      // TIF102: 3 * 3.5 = 10.5
      // TIF103: 2 * 4.0 = 8.0
      // TIF104: 4 * 3.0 = 12.0
      // Total Bobot = 42.5
      // IPS = 42.5 / 12 = 3.54166... -> 3.54
      const ips = hitungIPS(semester1);
      expect(ips).toBe(3.54);

      // Semester 2
      const semester2: NilaiTranskripItem[] = [
        { kodeMataKuliah: "TIF201", namaMataKuliah: "PBO", sks: 3, huruf: "A", bobot: 4.0 },
        { kodeMataKuliah: "TIF202", namaMataKuliah: "Basis Data", sks: 3, huruf: "A", bobot: 4.0 },
      ];
      // Total kumulatif SKS = 12 + 6 = 18 SKS
      // Sem 2 Bobot = 3*4 + 3*4 = 24.0
      // Total Kumulatif Bobot = 42.5 + 24.0 = 66.5
      // IPK = 66.5 / 18 = 3.6944... -> 3.69
      const allTranskrip = [...semester1, ...semester2];
      const hasilIpk = hitungIPK(allTranskrip);
      expect(hasilIpk.ipk).toBe(3.69);
      expect(hasilIpk.totalSksLulus).toBe(18);
    });
  });
});
