import { describe, it, expect } from "vitest";
import {
  pilihJadwalTerdekat,
  parseJamKeMenit,
  dapatkanSalamWaktu,
  hitungOffsetMenit,
  InputJadwalKuliah,
} from "../src/lib/akademik/jadwal-terdekat";

describe("Algoritma Pemilihan Jadwal Terdekat Mahasiswa", () => {
  const dummyJadwal: InputJadwalKuliah[] = [
    {
      mataKuliah: "Algoritma & Pemrograman",
      kodeMk: "TIF101",
      kelas: "A",
      sks: 3,
      hari: "Senin",
      jamMulai: "08:00",
      jamSelesai: "09:40",
      ruang: "Lab Komputer 1",
      dosen: "Dr. Ardiansyah",
    },
    {
      mataKuliah: "Pemrograman Berorientasi Objek",
      kodeMk: "TIF201",
      kelas: "A",
      sks: 3,
      hari: "Senin",
      jamMulai: "10:00",
      jamSelesai: "11:40",
      ruang: "Lab Komputer 1",
      dosen: "Fajar Ramadhan, M.Kom.",
    },
    {
      mataKuliah: "Basis Data",
      kodeMk: "TIF202",
      kelas: "A",
      sks: 3,
      hari: "Selasa",
      jamMulai: "08:00",
      jamSelesai: "09:40",
      ruang: "Lab Komputer 2",
      dosen: "Dr. Rina Fitriani",
    },
    {
      mataKuliah: "Pengembangan Web Modern",
      kodeMk: "TIF302",
      kelas: "A",
      sks: 3,
      hari: "Rabu",
      jamMulai: "13:00",
      jamSelesai: "15:30",
      ruang: "Lab Komputer 2",
      dosen: "Budi Santoso, M.Kom.",
    },
  ];

  it("1. Parsing jam format HH:mm ke menit berjalan akurat", () => {
    expect(parseJamKeMenit("08:00")).toBe(480);
    expect(parseJamKeMenit("09:40")).toBe(580);
    expect(parseJamKeMenit("13:15")).toBe(795);
    expect(parseJamKeMenit("")).toBe(0);
    expect(parseJamKeMenit("invalid")).toBe(0);
  });

  it("2. Menghasilkan sapaan waktu yang tepat sesuai jam", () => {
    expect(dapatkanSalamWaktu(6)).toBe("Selamat pagi");
    expect(dapatkanSalamWaktu(12)).toBe("Selamat siang");
    expect(dapatkanSalamWaktu(16)).toBe("Selamat sore");
    expect(dapatkanSalamWaktu(20)).toBe("Selamat malam");
    expect(dapatkanSalamWaktu(2)).toBe("Selamat malam");
  });

  it("3. Menangani daftar jadwal kosong dengan aman", () => {
    const hasil = pilihJadwalTerdekat([], new Date("2026-09-28T08:00:00"));
    expect(hasil.jadwalTerdekat).toEqual([]);
    expect(hasil.adaHariIni).toBe(false);
    expect(hasil.kelasBerikutnya).toBeNull();
    expect(hasil.jumlahKelasHariIni).toBe(0);
  });

  it("4. Mengutamakan kelas hari ini yang akan datang", () => {
    // Senin 2026-09-28 pukul 07:00 (sebelum kelas 08:00 dan 10:00)
    const waktuSekarang = new Date("2026-09-28T07:00:00");
    const hasil = pilihJadwalTerdekat(dummyJadwal, waktuSekarang, 3);

    expect(hasil.adaHariIni).toBe(true);
    expect(hasil.jumlahKelasHariIni).toBe(2);
    expect(hasil.kelasBerikutnya?.kodeMk).toBe("TIF101");
    expect(hasil.jadwalTerdekat[0].kodeMk).toBe("TIF101");
    expect(hasil.jadwalTerdekat[1].kodeMk).toBe("TIF201");
    expect(hasil.jadwalTerdekat[2].kodeMk).toBe("TIF202"); // Selasa
  });

  it("5. Mendeteksi kelas yang sedang berlangsung hari ini", () => {
    // Senin 2026-09-28 pukul 08:30 (kelas TIF101 08:00-09:40 sedang berlangsung)
    const waktuSekarang = new Date("2026-09-28T08:30:00");
    const hasil = pilihJadwalTerdekat(dummyJadwal, waktuSekarang, 2);

    expect(hasil.adaHariIni).toBe(true);
    expect(hasil.kelasBerikutnya?.kodeMk).toBe("TIF101");
    expect(hasil.kelasBerikutnya?.sedangBerlangsung).toBe(true);
    expect(hasil.kelasBerikutnya?.labelRelatif).toBe("Sedang Berlangsung");
    expect(hasil.pesanKontekstual).toContain("sedang berlangsung");
  });

  it("6. Mengabaikan kelas hari ini yang sudah selesai dan memilih kelas berikutnya", () => {
    // Senin 2026-09-28 pukul 12:00 (kedua kelas Senin 08:00 dan 10:00 sudah selesai)
    const waktuSekarang = new Date("2026-09-28T12:00:00");
    const hasil = pilihJadwalTerdekat(dummyJadwal, waktuSekarang, 3);

    expect(hasil.adaHariIni).toBe(false);
    expect(hasil.jumlahKelasHariIni).toBe(0);
    // Kelas berikutnya harus Selasa (TIF202)
    expect(hasil.kelasBerikutnya?.kodeMk).toBe("TIF202");
    expect(hasil.kelasBerikutnya?.hari).toBe("Selasa");
    expect(hasil.jadwalTerdekat[0].kodeMk).toBe("TIF202"); // Selasa
    expect(hasil.jadwalTerdekat[1].kodeMk).toBe("TIF302"); // Rabu
    // Kelas Senin yang sudah selesai akan berputar ke minggu depan
    expect(hasil.semuaTerurut[2].kodeMk).toBe("TIF101");
    expect(hasil.semuaTerurut[3].kodeMk).toBe("TIF201");
  });

  it("7. Bekerja mulus saat akhir pekan (Sabtu/Minggu bergulir ke Senin)", () => {
    // Sabtu 2026-10-03 pukul 14:00
    const waktuSekarang = new Date("2026-10-03T14:00:00");
    const hasil = pilihJadwalTerdekat(dummyJadwal, waktuSekarang, 2);

    expect(hasil.adaHariIni).toBe(false);
    expect(hasil.kelasBerikutnya?.hari).toBe("Senin");
    expect(hasil.kelasBerikutnya?.kodeMk).toBe("TIF101");
    expect(hasil.jadwalTerdekat[0].hari).toBe("Senin");
    expect(hasil.jadwalTerdekat[1].hari).toBe("Senin");
  });

  it("8. Toleran terhadap perbedaan huruf kapital nama hari", () => {
    const jadwalCampur: InputJadwalKuliah[] = [
      {
        mataKuliah: "Kecerdasan Buatan",
        kodeMk: "TIF303",
        kelas: "A",
        sks: 3,
        hari: "kAmIs",
        jamMulai: "08:00",
        jamSelesai: "10:30",
        ruang: "RT-201",
        dosen: "Siti Nurhaliza",
      },
    ];
    // Kamis 2026-10-01 pukul 07:00
    const waktuSekarang = new Date("2026-10-01T07:00:00");
    const hasil = pilihJadwalTerdekat(jadwalCampur, waktuSekarang);

    expect(hasil.adaHariIni).toBe(true);
    expect(hasil.kelasBerikutnya?.kodeMk).toBe("TIF303");
  });
});
