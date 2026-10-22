import { ItemAktivitasHarian, JenisAktivitas } from './tipe';
import { BOBOT_AKTIVITAS, BATAS_HARIAN_POIN } from './konfigurasi';
import { getTanggalWIB, tambahHari, hariDalamMingguSenin } from './waktu';
import { seedAktivitasHarianMemori } from './pencatat';

// Pseudo-random number generator deterministik sederhana (Linear Congruential Generator)
function buatPseudoRandom(seedAwal: number) {
  let s = seedAwal;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Menghasilkan kumpulan data aktivitas realistis untuk akun demo
 * selama 120 hari terakhir.
 */
export function bangunSeedAktivitasDemo(): ItemAktivitasHarian[] {
  const hasil: ItemAktivitasHarian[] = [];
  const tanggalHariIni = getTanggalWIB();

  // Akun Demo Mahasiswa (Ahmad Mahasiswa)
  const mhsId = 'a0000001-0000-0000-0000-000000000001';
  const kelasMhs = [
    'c0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
  ];
  const randMhs = buatPseudoRandom(12345);

  for (let i = 120; i >= 0; i--) {
    const tgl = tambahHari(tanggalHariIni, -i);
    const dow = hariDalamMingguSenin(tgl);
    const isWeekend = dow >= 5;

    // Peluang aktif: hari kerja 75%, akhir pekan 30%
    const prob = isWeekend ? 0.3 : 0.75;
    if (randMhs() < prob) {
      const cls = kelasMhs[Math.floor(randMhs() * kelasMhs.length)];
      const jenisPilihan: JenisAktivitas[] = isWeekend
        ? ['kumpul_tugas', 'balas_diskusi']
        : ['hadir_presensi', 'kumpul_tugas', 'selesai_kuis', 'topik_diskusi', 'balas_diskusi'];

      const jumlahJenis = 1 + Math.floor(randMhs() * 3);
      for (let j = 0; j < jumlahJenis; j++) {
        const k = jenisPilihan[Math.floor(randMhs() * jenisPilihan.length)];
        const bobot = BOBOT_AKTIVITAS[k] || 1;
        const count = 1 + (k === 'balas_diskusi' && randMhs() > 0.6 ? 1 : 0);
        const points = Math.min(bobot * count, BATAS_HARIAN_POIN[k] ?? 999);

        hasil.push({
          id: `seed-mhs-${tgl}-${k}-${j}`,
          userId: mhsId,
          classId: cls,
          date: tgl,
          kind: k,
          count,
          points,
        });
      }
    }
  }

  // Akun Demo Dosen (Dr. Budi Santoso)
  const dosenId = 'a0000002-0000-0000-0000-000000000002';
  const kelasDosen = [
    'c0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
  ];
  const randDosen = buatPseudoRandom(67890);

  for (let i = 120; i >= 0; i--) {
    const tgl = tambahHari(tanggalHariIni, -i);
    const dow = hariDalamMingguSenin(tgl);
    const isWeekend = dow >= 5;

    const prob = isWeekend ? 0.2 : 0.7;
    if (randDosen() < prob) {
      const cls = kelasDosen[Math.floor(randDosen() * kelasDosen.length)];
      const jenisPilihan: JenisAktivitas[] = [
        'terbit_materi',
        'terbit_pengumuman',
        'terbit_tugas',
        'buat_kuis',
        'review_pengumpulan',
        'finalisasi_nilai',
      ];

      const jumlahJenis = 1 + Math.floor(randDosen() * 2);
      for (let j = 0; j < jumlahJenis; j++) {
        const k = jenisPilihan[Math.floor(randDosen() * jenisPilihan.length)];
        const bobot = BOBOT_AKTIVITAS[k] || 1;
        const count = k === 'review_pengumpulan' ? 1 + Math.floor(randDosen() * 4) : 1;
        const points = Math.min(bobot * count, BATAS_HARIAN_POIN[k] ?? 999);

        hasil.push({
          id: `seed-dsn-${tgl}-${k}-${j}`,
          userId: dosenId,
          classId: cls,
          date: tgl,
          kind: k,
          count,
          points,
        });
      }
    }
  }

  return hasil;
}

let seedInitialized = false;

/**
 * Memastikan data aktivitas demo terisi di memory store jika belum ada.
 */
export function pastikanSeedAktivitasDemo(): void {
  if (seedInitialized) return;
  const store: ItemAktivitasHarian[] = ((globalThis as any).__siajarAktivitasHarian ??= []);
  if (store.length === 0) {
    const seeds = bangunSeedAktivitasDemo();
    seedAktivitasHarianMemori(seeds);
  }
  seedInitialized = true;
}
