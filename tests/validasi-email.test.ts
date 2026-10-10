import { describe, it, expect } from "vitest";
import { validasiEmailStudent } from "../src/lib/auth/validasi-email";

describe("Validasi Domain Email Student Google OAuth (Bab 4.2)", () => {
  const allowedDomain = "student.uir.ac.id";

  it("1. Menerima domain yang benar dan terverifikasi", () => {
    const result = validasiEmailStudent({
      email: "wahyualdi@student.uir.ac.id",
      emailVerified: true,
      allowedDomain,
    });
    expect(result.valid).toBe(true);
    expect(result.normalizedEmail).toBe("wahyualdi@student.uir.ac.id");
  });

  it("2. Menolak domain salah (misalnya gmail.com atau yahoo.com)", () => {
    const result = validasiEmailStudent({
      email: "mahasiswa@gmail.com",
      emailVerified: true,
      allowedDomain,
    });
    expect(result.valid).toBe(false);
    expect(result.pesanError).toContain("Gunakan email student kampus");
  });

  it("3. Menolak subdomain palsu atau domain bertingkat", () => {
    // Suffix spoofing
    const resSuffix = validasiEmailStudent({
      email: "penipu@student.uir.ac.id.attacker.com",
      emailVerified: true,
      allowedDomain,
    });
    expect(resSuffix.valid).toBe(false);

    // Prefix spoofing
    const resPrefix = validasiEmailStudent({
      email: "penipu@fake.student.uir.ac.id",
      emailVerified: true,
      allowedDomain,
    });
    expect(resPrefix.valid).toBe(false);
  });

  it("4. Mengabaikan perbedaan huruf besar dan kecil (case-insensitive)", () => {
    const result = validasiEmailStudent({
      email: "WahyuAldi.Riyanto@STUDENT.UIR.AC.ID",
      emailVerified: true,
      allowedDomain,
    });
    expect(result.valid).toBe(true);
    expect(result.normalizedEmail).toBe("wahyualdi.riyanto@student.uir.ac.id");
  });

  it("5. Menolak email yang belum terverifikasi oleh Google", () => {
    const result = validasiEmailStudent({
      email: "wahyualdi@student.uir.ac.id",
      emailVerified: false,
      allowedDomain,
    });
    expect(result.valid).toBe(false);
    expect(result.pesanError).toContain("belum diverifikasi");
  });
});
