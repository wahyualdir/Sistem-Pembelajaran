import {
  ItemAktivitasHarian,
  RingkasanHariAktivitas,
  StatistikAktivitas,
  JenisAktivitas,
} from './tipe';
import { poinKeLevel } from './level';

/**
 * Mengelompokkan dan menjumlahkan aktivitas harian per tanggal ('YYYY-MM-DD').
 */
export function agregasikanAktivitasPerHari(
  daftarAktivitas: ItemAktivitasHarian[]
): Map<string, RingkasanHariAktivitas> {
  const map = new Map<string, RingkasanHariAktivitas>();

  for (const item of daftarAktivitas) {
    let entry = map.get(item.date);
    if (!entry) {
      entry = {
        date: item.date,
        totalPoints: 0,
        totalCount: 0,
        level: 0,
        details: {},
      };
      map.set(item.date, entry);
    }

    entry.totalPoints += item.points;
    entry.totalCount += item.count;

    const kind = item.kind as JenisAktivitas;
    if (!entry.details[kind]) {
      entry.details[kind] = { count: 0, points: 0 };
    }
    const currentDetail = entry.details[kind]!;
    currentDetail.count += item.count;
    currentDetail.points += item.points;
  }

  // Hitung level untuk tiap hari setelah poin teragregasi
  for (const entry of map.values()) {
    entry.level = poinKeLevel(entry.totalPoints);
  }

  return map;
}

/**
 * Menghitung ringkasan statistik (total aktivitas, total poin, hari aktif).
 */
export function hitungStatistikAktivitas(
  daftarAktivitas: ItemAktivitasHarian[],
  rentangHari: number = 365
): StatistikAktivitas {
  const mapHari = agregasikanAktivitasPerHari(daftarAktivitas);

  let totalAktivitas = 0;
  let totalPoin = 0;
  let hariAktif = 0;

  for (const hari of mapHari.values()) {
    totalAktivitas += hari.totalCount;
    totalPoin += hari.totalPoints;
    if (hari.totalPoints > 0 || hari.totalCount > 0) {
      hariAktif++;
    }
  }

  return {
    totalAktivitas,
    totalPoin,
    hariAktif,
    rentangHari,
  };
}
