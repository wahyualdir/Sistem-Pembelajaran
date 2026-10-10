import { describe, it, expect } from "vitest";
import {
  isPeriodeAktif,
  generateNomorSurat,
  isPengumumanRelevan,
} from "../src/lib/akademik/administrasi";

describe("Modul Administrasi: Kalender, Surat, & Pengumuman (Bab 2.2 F13 & F14)", () => {
  describe("isPeriodeAktif", () => {
    it("mengembalikan true jika tanggal acuan berada di dalam rentang periode", () => {
      const mulai = "2026-08-01";
      const selesai = "2026-08-31";
      const tanggalCek = new Date("2026-08-15");

      expect(isPeriodeAktif(mulai, selesai, tanggalCek)).toBe(true);
    });

    it("mengembalikan false jika tanggal acuan sudah melewati batas akhir", () => {
      const mulai = "2026-08-01";
      const selesai = "2026-08-31";
      const tanggalCek = new Date("2026-09-05");

      expect(isPeriodeAktif(mulai, selesai, tanggalCek)).toBe(false);
    });

    it("mengembalikan false jika tanggal acuan sebelum periode dibuka", () => {
      const mulai = "2026-09-01";
      const selesai = "2026-09-15";
      const tanggalCek = new Date("2026-08-25");

      expect(isPeriodeAktif(mulai, selesai, tanggalCek)).toBe(false);
    });
  });

  describe("generateNomorSurat", () => {
    it("menghasilkan nomor surat keterangan aktif kuliah dengan format standar dan padding angka", () => {
      const no = generateNomorSurat("AKTIF_KULIAH", 1, 2026);
      expect(no).toBe("001/FT-UIR/SK-AKTIF/2026");
    });

    it("menghasilkan nomor surat cuti akademik", () => {
      const no = generateNomorSurat("CUTI_AKADEMIK", 12, 2026);
      expect(no).toBe("012/FT-UIR/SK-CUTI/2026");
    });

    it("menghasilkan nomor surat rekomendasi beasiswa", () => {
      const no = generateNomorSurat("REKOMENDASI_BEASISWA", 105, 2026);
      expect(no).toBe("105/FT-UIR/SR-BEASISWA/2026");
    });
  });

  describe("isPengumumanRelevan - Penargetan Audiens", () => {
    it("admin selalu dapat melihat seluruh jenis pengumuman", () => {
      const admin = { peran: "ADMIN" as const };
      expect(isPengumumanRelevan({ target: "PRODI", targetId: "prodi-tif" }, admin)).toBe(true);
      expect(isPengumumanRelevan({ target: "ANGKATAN", targetId: "2024" }, admin)).toBe(true);
    });

    it("pengumuman SEMUA dapat dilihat oleh mahasiswa mana pun", () => {
      const mhs = { peran: "MAHASISWA" as const, prodiId: "prodi-tif", angkatan: 2022 };
      expect(isPengumumanRelevan({ target: "SEMUA" }, mhs)).toBe(true);
    });

    it("pengumuman PRODI hanya muncul untuk mahasiswa prodi bersangkutan", () => {
      const mhsTif = { peran: "MAHASISWA" as const, prodiId: "prodi-tif", angkatan: 2022 };
      const mhsSipil = { peran: "MAHASISWA" as const, prodiId: "prodi-sipil", angkatan: 2022 };

      expect(isPengumumanRelevan({ target: "PRODI", targetId: "prodi-tif" }, mhsTif)).toBe(true);
      expect(isPengumumanRelevan({ target: "PRODI", targetId: "prodi-tif" }, mhsSipil)).toBe(false);
    });

    it("pengumuman ANGKATAN hanya muncul untuk angkatan yang cocok", () => {
      const mhs2022 = { peran: "MAHASISWA" as const, angkatan: 2022 };
      expect(isPengumumanRelevan({ target: "ANGKATAN", targetId: "2022" }, mhs2022)).toBe(true);
      expect(isPengumumanRelevan({ target: "ANGKATAN", targetId: "2024" }, mhs2022)).toBe(false);
    });
  });
});
