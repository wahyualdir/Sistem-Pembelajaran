import { describe, it, expect } from "vitest";
import { validatePrerequisiteCycle } from "../src/lib/akademik/prasyarat";

describe("Validasi Prasyarat Mata Kuliah & Deteksi Lingkaran (Bab 5.4 & F3)", () => {
  it("1. Menerima prasyarat linear yang valid (A butuh B)", () => {
    const existing: { courseId: string; prerequisiteId: string }[] = [];
    const result = validatePrerequisiteCycle(existing, "mk-struktur-data", "mk-algoritma");
    expect(result.valid).toBe(true);
  });

  it("2. Menolak prasyarat yang merujuk pada diri sendiri (A butuh A)", () => {
    const existing = [{ courseId: "mk-algoritma", prerequisiteId: "mk-pengantar" }];
    const result = validatePrerequisiteCycle(existing, "mk-algoritma", "mk-algoritma");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("dirinya sendiri");
  });

  it("3. Menolak siklus langsung 2 mata kuliah (A butuh B, lalu B butuh A)", () => {
    // Sudah ada: Struktur Data (A) butuh Algoritma (B)
    const existing = [{ courseId: "mk-struktur-data", prerequisiteId: "mk-algoritma" }];

    // Coba tambahkan: Algoritma (B) butuh Struktur Data (A)
    const result = validatePrerequisiteCycle(existing, "mk-algoritma", "mk-struktur-data");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("siklus");
  });

  it("4. Menolak siklus bertingkat 3 mata kuliah (A -> B -> C -> A)", () => {
    // Web (A) butuh PBO (B)
    // PBO (B) butuh Struktur Data (C)
    const existing = [
      { courseId: "mk-web", prerequisiteId: "mk-pbo" },
      { courseId: "mk-pbo", prerequisiteId: "mk-struktur-data" },
    ];

    // Coba tambahkan: Struktur Data (C) butuh Web (A)
    const result = validatePrerequisiteCycle(existing, "mk-struktur-data", "mk-web");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("siklus");
  });

  it("5. Menerima percabangan grafik asiklik (DAG: diamond dependency)", () => {
    // Sistem Terdistribusi butuh Jaringan dan Basis Data
    // Jaringan butuh Arsitektur Komputer
    // Basis Data butuh Arsitektur Komputer
    const existing = [
      { courseId: "mk-jaringan", prerequisiteId: "mk-arkom" },
      { courseId: "mk-basisdata", prerequisiteId: "mk-arkom" },
      { courseId: "mk-terdistribusi", prerequisiteId: "mk-jaringan" },
    ];

    // Tambah: Sistem Terdistribusi butuh Basis Data (valid, bukan siklus)
    const result = validatePrerequisiteCycle(existing, "mk-terdistribusi", "mk-basisdata");
    expect(result.valid).toBe(true);
  });
});
