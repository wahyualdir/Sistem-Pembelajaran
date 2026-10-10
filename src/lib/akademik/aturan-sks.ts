/**
 * Aturan Penentuan Batas SKS Maksimal Mahasiswa (Bab 2.3 & Bab 6.1)
 *
 * "Batas SKS. Mahasiswa semester pertama mengambil paket tetap (20 SKS).
 * Selanjutnya batas mengikuti IPS semester lalu:
 * - IPS >= 3.00: boleh 24 SKS
 * - IPS 2.50 s/d 2.99: boleh 21 SKS
 * - IPS 2.00 s/d 2.49: boleh 18 SKS
 * - IPS < 2.00: boleh 15 SKS"
 */

export interface AturanSksTier {
  minIps: number;
  maxSks: number;
}

export const DEFAULT_ATURAN_SKS: AturanSksTier[] = [
  { minIps: 3.0, maxSks: 24 },
  { minIps: 2.5, maxSks: 21 },
  { minIps: 2.0, maxSks: 18 },
  { minIps: 0.0, maxSks: 15 },
];

export function hitungBatasSks(
  ipsSemesterLalu: number | null | undefined,
  isSemesterPertama = false,
  aturan: AturanSksTier[] = DEFAULT_ATURAN_SKS,
  sksPaketSemesterPertama = 20
): number {
  if (isSemesterPertama || ipsSemesterLalu === null || ipsSemesterLalu === undefined) {
    return sksPaketSemesterPertama;
  }

  // Urutkan tier dari minIps tertinggi ke terendah
  const sortedTiers = [...aturan].sort((a, b) => b.minIps - a.minIps);

  for (const tier of sortedTiers) {
    if (ipsSemesterLalu >= tier.minIps) {
      return tier.maxSks;
    }
  }

  return 15;
}
