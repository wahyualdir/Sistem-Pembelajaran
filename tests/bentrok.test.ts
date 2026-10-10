import { describe, it, expect } from "vitest";
import { adaBentrok, cariBentrok } from "../src/lib/akademik/bentrok";

describe("Deteksi Bentrok Jadwal Kuliah (Bab 6.2)", () => {
  it("1. Tidak bentrok bila jadwal jatuh pada hari yang berbeda", () => {
    const a = { hari: "Senin", jamMulai: "08:00", jamSelesai: "10:00" };
    const b = { hari: "Selasa", jamMulai: "08:00", jamSelesai: "10:00" };
    expect(adaBentrok(a, b)).toBe(false);
  });

  it("2. Bentrok bila hari sama dan waktu saling tumpang tindih", () => {
    const a = { hari: "Senin", jamMulai: "08:00", jamSelesai: "10:00" };
    const b = { hari: "Senin", jamMulai: "09:00", jamSelesai: "11:00" };
    expect(adaBentrok(a, b)).toBe(true);
  });

  it("3. Tidak bentrok bila jadwal bersentuhan di titik batas jam selesai (jam selesai eksklusif)", () => {
    // Sesuai Bab 6.2: "jadwal yang berakhir pukul 09.40 dan jadwal lain yang mulai 09.40 tidak bentrok"
    const a = { hari: "Senin", jamMulai: "08:00", jamSelesai: "09:40" };
    const b = { hari: "Senin", jamMulai: "09:40", jamSelesai: "11:20" };
    expect(adaBentrok(a, b)).toBe(false);
    expect(adaBentrok(b, a)).toBe(false);
  });

  it("4. Bentrok bila salah satu jadwal berada penuh di dalam rentang jadwal lain", () => {
    const a = { hari: "Rabu", jamMulai: "08:00", jamSelesai: "12:00" };
    const b = { hari: "Rabu", jamMulai: "09:00", jamSelesai: "10:30" };
    expect(adaBentrok(a, b)).toBe(true);
  });

  it("5. Fungsi cariBentrok dapat menemukan semua jadwal yang bertabrakan", () => {
    const target = { hari: "Kamis", jamMulai: "10:00", jamSelesai: "12:00" };
    const existing = [
      { hari: "Kamis", jamMulai: "08:00", jamSelesai: "10:00", label: "MK 1" }, // eksklusif -> aman
      { hari: "Kamis", jamMulai: "11:00", jamSelesai: "13:00", label: "MK 2" }, // bentrok
      { hari: "Jumat", jamMulai: "10:00", jamSelesai: "12:00", label: "MK 3" }, // beda hari -> aman
    ];

    const result = cariBentrok(target, existing);
    expect(result.length).toBe(1);
    expect(result[0].label).toBe("MK 2");
  });
});
