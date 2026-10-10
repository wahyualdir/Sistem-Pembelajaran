/**
 * Modul Akademik Murni: Algoritma Pemilihan Jadwal Kuliah Terdekat
 *
 * Logika pemilihan jadwal:
 * 1. Mendukung injeksi Date (waktuSekarang) untuk testing deterministik.
 * 2. Memetakan hari ke indeks (Minggu=0, Senin=1, ..., Sabtu=6).
 * 3. Menghitung selisih waktu secara akurat dari waktu saat ini.
 * 4. Kelas yang sedang berlangsung menjadi prioritas utama hari ini.
 * 5. Kelas hari ini yang belum selesai didahulukan sebelum kelas hari berikutnya.
 * 6. Kelas hari ini yang sudah selesai bergulir ke jadwal minggu depan.
 * 7. Menghasilkan sapaan kontekstual dan status relatif perkuliahan.
 */

export interface InputJadwalKuliah {
  mataKuliah: string;
  kodeMk: string;
  kelas: string;
  sks: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
  dosen: string;
}

export interface JadwalTerdekatItem extends InputJadwalKuliah {
  menitMenujuMulai: number;
  sedangBerlangsung: boolean;
  adalahHariIni: boolean;
  selisihHari: number;
  labelRelatif: string;
}

export interface HasilJadwalTerdekat {
  jadwalTerdekat: JadwalTerdekatItem[];
  semuaTerurut: JadwalTerdekatItem[];
  adaHariIni: boolean;
  jumlahKelasHariIni: number;
  kelasBerikutnya: JadwalTerdekatItem | null;
  teksKelasBerikutnya: string;
  salamWaktu: string;
  pesanKontekstual: string;
}

const HARI_MAP: Record<string, number> = {
  minggu: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
};

/**
 * Parsing jam format "HH:mm" menjadi menit sejak awal hari (0-1439).
 */
export function parseJamKeMenit(jamStr: string): number {
  if (!jamStr || !jamStr.includes(":")) return 0;
  const [jam, menit] = jamStr.split(":").map((v) => parseInt(v.trim(), 10));
  if (isNaN(jam) || isNaN(menit)) return 0;
  return jam * 60 + menit;
}

/**
 * Mendapatkan sapaan berdasarkan jam lokal (Pagi, Siang, Sore, Malam).
 */
export function dapatkanSalamWaktu(jam: number): string {
  if (jam >= 5 && jam < 11) return "Selamat pagi";
  if (jam >= 11 && jam < 15) return "Selamat siang";
  if (jam >= 15 && jam < 18) return "Selamat sore";
  return "Selamat malam";
}

/**
 * Menghitung offset menit dari waktu saat ini ke waktu mulai kelas.
 * Nilai yang lebih kecil berarti kelas lebih dekat untuk dihadiri.
 */
export function hitungOffsetMenit(
  hariKelas: string,
  jamMulai: string,
  jamSelesai: string,
  waktuSekarang: Date
): {
  offsetMenit: number;
  sedangBerlangsung: boolean;
  adalahHariIni: boolean;
  selisihHari: number;
} {
  const hariLower = hariKelas.trim().toLowerCase();
  const targetDay = HARI_MAP[hariLower] ?? 1; // Default Senin jika tidak dikenali
  const currentDay = waktuSekarang.getDay();

  const currentMinutes = waktuSekarang.getHours() * 60 + waktuSekarang.getMinutes();
  const startMinutes = parseJamKeMenit(jamMulai);
  const endMinutes = parseJamKeMenit(jamSelesai);

  const rawDayDiff = (targetDay - currentDay + 7) % 7;

  if (rawDayDiff === 0) {
    // Kelas dijadwalkan pada hari ini
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      // Sedang berlangsung sekarang! Diberi offset 0 agar tampil paling atas
      return {
        offsetMenit: 0,
        sedangBerlangsung: true,
        adalahHariIni: true,
        selisihHari: 0,
      };
    } else if (currentMinutes < startMinutes) {
      // Belum mulai hari ini
      return {
        offsetMenit: startMinutes - currentMinutes,
        sedangBerlangsung: false,
        adalahHariIni: true,
        selisihHari: 0,
      };
    } else {
      // Sudah selesai hari ini, berulang minggu depan (7 hari ke depan)
      return {
        offsetMenit: 7 * 24 * 60 + (startMinutes - currentMinutes),
        sedangBerlangsung: false,
        adalahHariIni: false,
        selisihHari: 7,
      };
    }
  }

  // Hari lain dalam minggu ini (1 sampai 6 hari mendatang)
  const offset = rawDayDiff * 24 * 60 + (startMinutes - currentMinutes);
  return {
    offsetMenit: offset,
    sedangBerlangsung: false,
    adalahHariIni: false,
    selisihHari: rawDayDiff,
  };
}

/**
 * Memformat label relatif waktu perkuliahan (misal: "Sedang Berlangsung", "Hari ini 10:00", "Besok 08:00").
 */
export function buatLabelRelatif(
  hariKelas: string,
  jamMulai: string,
  sedangBerlangsung: boolean,
  adalahHariIni: boolean,
  selisihHari: number
): string {
  if (sedangBerlangsung) {
    return "Sedang Berlangsung";
  }
  if (adalahHariIni) {
    return `Hari ini, ${jamMulai} WIB`;
  }
  if (selisihHari === 1) {
    return `Besok (${hariKelas}), ${jamMulai} WIB`;
  }
  return `${hariKelas}, ${jamMulai} WIB`;
}

/**
 * Fungsi utama pemilihan jadwal terdekat dengan batasan limit dan sapaan kontekstual.
 */
export function pilihJadwalTerdekat(
  daftarJadwal: InputJadwalKuliah[],
  waktuSekarang: Date = new Date(),
  limit: number = 3
): HasilJadwalTerdekat {
  const salamWaktu = dapatkanSalamWaktu(waktuSekarang.getHours());

  if (!daftarJadwal || daftarJadwal.length === 0) {
    return {
      jadwalTerdekat: [],
      semuaTerurut: [],
      adaHariIni: false,
      jumlahKelasHariIni: 0,
      kelasBerikutnya: null,
      teksKelasBerikutnya: "Belum ada jadwal perkuliahan terdaftar",
      salamWaktu,
      pesanKontekstual: "Tidak ada jadwal perkuliahan aktif untuk semester ini.",
    };
  }

  // Petakan dan kalkulasi offset untuk setiap jadwal
  const hasilKalkulasi: JadwalTerdekatItem[] = daftarJadwal.map((item) => {
    const { offsetMenit, sedangBerlangsung, adalahHariIni, selisihHari } = hitungOffsetMenit(
      item.hari,
      item.jamMulai,
      item.jamSelesai,
      waktuSekarang
    );

    const labelRelatif = buatLabelRelatif(
      item.hari,
      item.jamMulai,
      sedangBerlangsung,
      adalahHariIni,
      selisihHari
    );

    return {
      ...item,
      menitMenujuMulai: offsetMenit,
      sedangBerlangsung,
      adalahHariIni,
      selisihHari,
      labelRelatif,
    };
  });

  // Urutkan berdasarkan waktu terdekat (offset menit terkecil)
  hasilKalkulasi.sort((a, b) => a.menitMenujuMulai - b.menitMenujuMulai);

  // Filter kelas aktif hari ini (baik yang sedang berlangsung atau belum mulai)
  const kelasAktifHariIni = hasilKalkulasi.filter((j) => j.adalahHariIni);
  const adaHariIni = kelasAktifHariIni.length > 0;
  const jumlahKelasHariIni = kelasAktifHariIni.length;

  const kelasBerikutnya = hasilKalkulasi.length > 0 ? hasilKalkulasi[0] : null;

  let teksKelasBerikutnya = "";
  let pesanKontekstual = "";

  if (kelasBerikutnya) {
    if (kelasBerikutnya.sedangBerlangsung) {
      teksKelasBerikutnya = `${kelasBerikutnya.mataKuliah} sedang berlangsung di ${kelasBerikutnya.ruang}`;
      pesanKontekstual = `Ada kelas ${kelasBerikutnya.mataKuliah} yang sedang berlangsung saat ini di ${kelasBerikutnya.ruang}.`;
    } else if (kelasBerikutnya.adalahHariIni) {
      teksKelasBerikutnya = `${kelasBerikutnya.mataKuliah} pukul ${kelasBerikutnya.jamMulai} di ${kelasBerikutnya.ruang}`;
      pesanKontekstual = `Ada ${jumlahKelasHariIni} kelas hari ini, berikutnya pukul ${kelasBerikutnya.jamMulai} WIB di ${kelasBerikutnya.ruang}.`;
    } else {
      teksKelasBerikutnya = `${kelasBerikutnya.mataKuliah} pada ${kelasBerikutnya.hari} pukul ${kelasBerikutnya.jamMulai} WIB di ${kelasBerikutnya.ruang}`;
      pesanKontekstual = `Tidak ada kelas hari ini. Kelas berikutnya adalah ${kelasBerikutnya.mataKuliah} pada ${kelasBerikutnya.hari}, ${kelasBerikutnya.jamMulai} WIB di ${kelasBerikutnya.ruang}.`;
    }
  }

  const jadwalTerdekat = hasilKalkulasi.slice(0, limit);

  return {
    jadwalTerdekat,
    semuaTerurut: hasilKalkulasi,
    adaHariIni,
    jumlahKelasHariIni,
    kelasBerikutnya,
    teksKelasBerikutnya,
    salamWaktu,
    pesanKontekstual,
  };
}
