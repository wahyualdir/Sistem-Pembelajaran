import { describe, it, expect } from "vitest";
import { hitungBatasSks, DEFAULT_ATURAN_SKS } from "../src/lib/akademik/aturan-sks";

describe("Aturan Penentuan Batas Maksimal SKS (Bab 2.3)", () => {
  it("1. Mahasiswa semester pertama mendapat paket tetap bawaan (20 SKS)", () => {
    const limit = hitungBatasSks(null, true);
    expect(limit).toBe(20);
  });

  it("2. Mahasiswa dengan IPS >= 3.00 berhak mengambil hingga 24 SKS", () => {
    expect(hitungBatasSks(3.0)).toBe(24);
    expect(hitungBatasSks(3.52)).toBe(24);
    expect(hitungBatasSks(4.0)).toBe(24);
  });

  it("3. Mahasiswa dengan IPS 2.50 sampai 2.99 berhak mengambil hingga 21 SKS", () => {
    expect(hitungBatasSks(2.5)).toBe(21);
    expect(hitungBatasSks(2.75)).toBe(21);
    expect(hitungBatasSks(2.99)).toBe(21);
  });

  it("4. Mahasiswa dengan IPS 2.00 sampai 2.49 berhak mengambil hingga 18 SKS", () => {
    expect(hitungBatasSks(2.0)).toBe(18);
    expect(hitungBatasSks(2.4)).toBe(18);
  });

  it("5. Mahasiswa dengan IPS di bawah 2.00 dibatasi maksimal 15 SKS", () => {
    expect(hitungBatasSks(1.99)).toBe(15);
    expect(hitungBatasSks(1.5)).toBe(15);
    expect(hitungBatasSks(0.0)).toBe(15);
  });

  it("6. Mampu membaca konfigurasi aturan dinamis kampus yang disesuaikan", () => {
    const customConfig = [
      { minIps: 3.5, maxSks: 24 },
      { minIps: 2.75, maxSks: 20 },
      { minIps: 0.0, maxSks: 16 },
    ];
    expect(hitungBatasSks(3.2, false, customConfig)).toBe(20);
    expect(hitungBatasSks(3.6, false, customConfig)).toBe(24);
  });
});
