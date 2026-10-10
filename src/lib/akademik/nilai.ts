/**
 * Modul Akademik Murni: Perhitungan Nilai, Konversi Huruf, IPS, dan IPK
 * 
 * Sesuai Dokumen Perencanaan Bab 2.3 & Bab 6.3:
 * - Skala Nilai:
 *   A  (4.00) : >= 85
 *   A- (3.70) : 80 <= angka < 85
 *   B+ (3.30) : 75 <= angka < 80
 *   B  (3.00) : 70 <= angka < 75
 *   B- (2.70) : 65 <= angka < 70
 *   C+ (2.30) : 60 <= angka < 65
 *   C  (2.00) : 55 <= angka < 60
 *   D  (1.00) : 40 <= angka < 55
 *   E  (0.00) : < 40
 * - Bobot Komponen Nilai harus tepat berjumlah 100%.
 * - Nilai akhir = sum(angka * bobot / 100).
 * - IPS = sum(bobotHuruf * sks) / sum(sks) untuk satu semester.
 * - IPK = sum(bobotHuruf * sks) / sum(sks) seluruh semester,
 *   mata kuliah yang diulang memakai nilai terbaik (bobot mutu tertinggi).
 */

export interface SkalaNilaiItem {
  min: number;
  max: number;
  huruf: string;
  bobot: number;
}

export const SKALA_NILAI_DEFAULT: SkalaNilaiItem[] = [
  { min: 85, max: 100, huruf: "A", bobot: 4.0 },
  { min: 80, max: 85, huruf: "A-", bobot: 3.7 },
  { min: 75, max: 80, huruf: "B+", bobot: 3.3 },
  { min: 70, max: 75, huruf: "B", bobot: 3.0 },
  { min: 65, max: 70, huruf: "B-", bobot: 2.7 },
  { min: 60, max: 65, huruf: "C+", bobot: 2.3 },
  { min: 55, max: 60, huruf: "C", bobot: 2.0 },
  { min: 40, max: 55, huruf: "D", bobot: 1.0 },
  { min: 0, max: 40, huruf: "E", bobot: 0.0 },
];

export interface KomponenNilaiInput {
  angka: number;
  bobotPersen: number;
}

/**
 * Konversi angka 0-100 ke huruf dan bobot mutu
 */
export function konversiNilaiKeHuruf(
  angka: number,
  skala: SkalaNilaiItem[] = SKALA_NILAI_DEFAULT
): { huruf: string; bobot: number } {
  const rounded = Math.round(angka * 100) / 100;

  for (const item of skala) {
    // Khusus batas atas tertinggi (misal 100), izinkan inklusif
    if (rounded >= item.min && (rounded < item.max || (item.max === 100 && rounded <= 100))) {
      return { huruf: item.huruf, bobot: item.bobot };
    }
  }

  // Fallback untuk angka < 0 atau > 100
  if (rounded >= 100) {
    return { huruf: "A", bobot: 4.0 };
  }
  return { huruf: "E", bobot: 0.0 };
}

/**
 * Validasi apakah total bobot komponen nilai tepat 100%
 */
export function validasiTotalBobot(bobotList: number[]): boolean {
  const total = bobotList.reduce((acc, curr) => acc + curr, 0);
  return Math.abs(total - 100) < 0.001;
}

/**
 * Hitung nilai akhir kelas dari komponen yang sudah berbobot
 */
export function hitungNilaiAkhir(
  komponenList: KomponenNilaiInput[],
  skala: SkalaNilaiItem[] = SKALA_NILAI_DEFAULT
): {
  nilaiAkhir: number;
  huruf: string;
  bobot: number;
  valid: boolean;
  pesanGalat?: string;
} {
  const bobotArray = komponenList.map((k) => k.bobotPersen);
  if (!validasiTotalBobot(bobotArray)) {
    return {
      nilaiAkhir: 0,
      huruf: "E",
      bobot: 0.0,
      valid: false,
      pesanGalat: `Total bobot komponen harus 100%, saat ini ${bobotArray.reduce(
        (a, b) => a + b,
        0
      )}%`,
    };
  }

  let totalSkor = 0;
  for (const k of komponenList) {
    if (k.angka < 0 || k.angka > 100) {
      return {
        nilaiAkhir: 0,
        huruf: "E",
        bobot: 0.0,
        valid: false,
        pesanGalat: `Nilai angka harus antara 0 dan 100, ditemukan: ${k.angka}`,
      };
    }
    totalSkor += (k.angka * k.bobotPersen) / 100;
  }

  const nilaiAkhir = Math.round(totalSkor * 100) / 100;
  const { huruf, bobot } = konversiNilaiKeHuruf(nilaiAkhir, skala);

  return {
    nilaiAkhir,
    huruf,
    bobot,
    valid: true,
  };
}

export interface NilaiSemesterItem {
  sks: number;
  bobot: number;
}

/**
 * Hitung Indeks Prestasi Semester (IPS)
 * IPS = sum(bobotHuruf * sks) / sum(sks)
 */
export function hitungIPS(daftarNilai: NilaiSemesterItem[]): number {
  if (!daftarNilai || daftarNilai.length === 0) return 0.0;

  const totalSks = daftarNilai.reduce((sum, item) => sum + item.sks, 0);
  if (totalSks === 0) return 0.0;

  const totalMutu = daftarNilai.reduce((sum, item) => sum + item.bobot * item.sks, 0);
  const ips = totalMutu / totalSks;

  // Bulatkan 2 tempat desimal
  return Math.round(ips * 100) / 100;
}

export interface NilaiTranskripItem {
  kodeMataKuliah: string;
  namaMataKuliah: string;
  sks: number;
  huruf: string;
  bobot: number;
  semesterPaket?: number;
  tahunAjaranKode?: string;
}

export interface HasilIPK {
  ipk: number;
  totalSksLulus: number;
  totalSksDitempuh: number;
  daftarMataKuliahFinal: (NilaiTranskripItem & { diulang: boolean })[];
}

/**
 * Hitung Indeks Prestasi Kumulatif (IPK)
 * Dengan aturan: Mata kuliah yang diulang memakai nilai terbaik (bobot tertinggi).
 * Nilai lulus minimal D (bobot > 0).
 */
export function hitungIPK(
  semuaNilai: NilaiTranskripItem[],
  nilaiMinimalLulus: string = "D"
): HasilIPK {
  if (!semuaNilai || semuaNilai.length === 0) {
    return {
      ipk: 0.0,
      totalSksLulus: 0,
      totalSksDitempuh: 0,
      daftarMataKuliahFinal: [],
    };
  }

  // Kelompokkan per kode mata kuliah untuk mendeteksi matkul diulang
  const grouped = new Map<string, NilaiTranskripItem[]>();
  for (const item of semuaNilai) {
    const list = grouped.get(item.kodeMataKuliah) || [];
    list.push(item);
    grouped.set(item.kodeMataKuliah, list);
  }

  const finalItems: (NilaiTranskripItem & { diulang: boolean })[] = [];

  for (const [, riwayat] of grouped) {
    if (riwayat.length === 1) {
      finalItems.push({
        ...riwayat[0],
        diulang: false,
      });
    } else {
      // Ambil yang memiliki bobot tertinggi (nilai terbaik)
      const terbaik = riwayat.reduce((prev, curr) => {
        return curr.bobot > prev.bobot ? curr : prev;
      });

      finalItems.push({
        ...terbaik,
        diulang: true,
      });
    }
  }

  let totalSksDitempuh = 0;
  let totalSksLulus = 0;
  let totalMutu = 0;

  for (const item of finalItems) {
    totalSksDitempuh += item.sks;
    totalMutu += item.bobot * item.sks;

    // Cek kelulusan (bawaan D ke atas, atau bobot > 0 jika minimal D)
    const isLulus = nilaiMinimalLulus === "D" ? item.bobot >= 1.0 : item.bobot >= 2.0;
    if (isLulus) {
      totalSksLulus += item.sks;
    }
  }

  const ipk = totalSksDitempuh > 0 ? Math.round((totalMutu / totalSksDitempuh) * 100) / 100 : 0.0;

  return {
    ipk,
    totalSksLulus,
    totalSksDitempuh,
    daftarMataKuliahFinal: finalItems,
  };
}
