import { describe, it, expect, beforeEach } from 'vitest';
import {
  poinKeLevel,
  bangunGridKontribusi,
  catatAktivitas,
  ambilAktivitasUser,
  ambilAktivitasKelasAgregat,
  resetAktivitasHarianMemori,
  getTanggalWIB,
  tambahHari,
  hariDalamMingguSenin,
  BOBOT_AKTIVITAS,
  BATAS_HARIAN_POIN,
} from '@/lib/aktivitas';

describe('SIAJAR Fitur Grafik Kontribusi: Logika Poin & Level', () => {
  it('memetakan poin harian ke tingkat level 0 sampai 4 dengan benar', () => {
    // Level 0: 0 poin
    expect(poinKeLevel(0)).toBe(0);
    expect(poinKeLevel(-5)).toBe(0);

    // Level 1: 1 - 2 poin
    expect(poinKeLevel(1)).toBe(1);
    expect(poinKeLevel(2)).toBe(1);

    // Level 2: 3 - 5 poin
    expect(poinKeLevel(3)).toBe(2);
    expect(poinKeLevel(4)).toBe(2);
    expect(poinKeLevel(5)).toBe(2);

    // Level 3: 6 - 9 poin
    expect(poinKeLevel(6)).toBe(3);
    expect(poinKeLevel(8)).toBe(3);
    expect(poinKeLevel(9)).toBe(3);

    // Level 4: 10+ poin
    expect(poinKeLevel(10)).toBe(4);
    expect(poinKeLevel(25)).toBe(4);
  });

  it('memiliki bobot poin dan batas harian yang sesuai spesifikasi untuk 11 jenis aktivitas', () => {
    expect(BOBOT_AKTIVITAS.kumpul_tugas).toBe(3);
    expect(BATAS_HARIAN_POIN.kumpul_tugas).toBeNull();

    expect(BOBOT_AKTIVITAS.hadir_presensi).toBe(1);
    expect(BATAS_HARIAN_POIN.hadir_presensi).toBe(1);

    expect(BOBOT_AKTIVITAS.selesai_kuis).toBe(3);
    expect(BATAS_HARIAN_POIN.selesai_kuis).toBeNull();

    expect(BOBOT_AKTIVITAS.topik_diskusi).toBe(2);
    expect(BATAS_HARIAN_POIN.topik_diskusi).toBe(6);

    expect(BOBOT_AKTIVITAS.balas_diskusi).toBe(1);
    expect(BATAS_HARIAN_POIN.balas_diskusi).toBe(5);

    expect(BOBOT_AKTIVITAS.terbit_materi).toBe(3);
    expect(BATAS_HARIAN_POIN.terbit_materi).toBeNull();

    expect(BOBOT_AKTIVITAS.terbit_pengumuman).toBe(1);
    expect(BATAS_HARIAN_POIN.terbit_pengumuman).toBe(3);

    expect(BOBOT_AKTIVITAS.terbit_tugas).toBe(3);
    expect(BATAS_HARIAN_POIN.terbit_tugas).toBeNull();

    expect(BOBOT_AKTIVITAS.buat_kuis).toBe(3);
    expect(BATAS_HARIAN_POIN.buat_kuis).toBeNull();

    expect(BOBOT_AKTIVITAS.review_pengumpulan).toBe(1);
    expect(BATAS_HARIAN_POIN.review_pengumpulan).toBe(10);

    expect(BOBOT_AKTIVITAS.finalisasi_nilai).toBe(3);
    expect(BATAS_HARIAN_POIN.finalisasi_nilai).toBeNull();
  });
});

describe('SIAJAR Fitur Grafik Kontribusi: Pencatatan & Batas Harian (Capping)', () => {
  beforeEach(() => {
    resetAktivitasHarianMemori();
  });

  it('mencatat aktivitas kumpul_tugas tanpa batas (unlimited)', async () => {
    const userId = 'mhs-uji-1';
    const date = '2026-10-20';

    const r1 = await catatAktivitas({ userId, kind: 'kumpul_tugas', date });
    expect(r1.success).toBe(true);
    expect(r1.recordedPoints).toBe(3);
    expect(r1.isCapped).toBe(false);

    const r2 = await catatAktivitas({ userId, kind: 'kumpul_tugas', date });
    expect(r2.recordedPoints).toBe(3);
    expect(r2.totalDailyPoints).toBe(6);
    expect(r2.isCapped).toBe(false);

    const daftar = await ambilAktivitasUser({ userId, startDate: date, endDate: date });
    expect(daftar.length).toBe(1);
    expect(daftar[0].count).toBe(2);
    expect(daftar[0].points).toBe(6);
  });

  it('menegakkan batas harian (cap) pada topik_diskusi (maks 6 poin)', async () => {
    const userId = 'mhs-uji-2';
    const classId = 'c0000001-0000-0000-0000-000000000001';
    const date = '2026-10-21';

    // Topik 1 (+2 poin -> total 2)
    const t1 = await catatAktivitas({ userId, classId, kind: 'topik_diskusi', date });
    expect(t1.recordedPoints).toBe(2);
    expect(t1.isCapped).toBe(false);

    // Topik 2 (+2 poin -> total 4)
    const t2 = await catatAktivitas({ userId, classId, kind: 'topik_diskusi', date });
    expect(t2.recordedPoints).toBe(2);
    expect(t2.isCapped).toBe(false);

    // Topik 3 (+2 poin -> total 6, mencapai cap)
    const t3 = await catatAktivitas({ userId, classId, kind: 'topik_diskusi', date });
    expect(t3.recordedPoints).toBe(2);
    expect(t3.isCapped).toBe(false);

    // Topik 4 (+0 poin -> sudah melebihi cap 6 poin, isCapped = true)
    const t4 = await catatAktivitas({ userId, classId, kind: 'topik_diskusi', date });
    expect(t4.recordedPoints).toBe(0);
    expect(t4.isCapped).toBe(true);

    const daftar = await ambilAktivitasUser({ userId, startDate: date, endDate: date });
    expect(daftar[0].count).toBe(4);
    expect(daftar[0].points).toBe(6);
  });

  it('mengagregasi data aktivitas kelas secara anonim tanpa identitas pengguna', async () => {
    const classId = 'c0000001-0000-0000-0000-000000000002';
    const date = '2026-10-22';

    await catatAktivitas({ userId: 'mhs-a', classId, kind: 'kumpul_tugas', date });
    await catatAktivitas({ userId: 'mhs-b', classId, kind: 'kumpul_tugas', date });
    await catatAktivitas({ userId: 'mhs-c', classId, kind: 'balas_diskusi', date });

    const agregat = await ambilAktivitasKelasAgregat({ classId, startDate: date, endDate: date });
    expect(agregat.length).toBeGreaterThan(0);

    // Pastikan tidak ada ID user riil di output anonim
    for (const item of agregat) {
      expect(item.userId).toBe('anonymous');
      expect(item.classId).toBe(classId);
    }

    const tugasItem = agregat.find((a) => a.kind === 'kumpul_tugas');
    expect(tugasItem?.count).toBe(2);
    expect(tugasItem?.points).toBe(6);
  });
});

describe('SIAJAR Fitur Grafik Kontribusi: Pembangun Grid & Waktu', () => {
  it('menghitung indeks hari dimulai dari Senin (0 = Senin s.d. 6 = Minggu)', () => {
    // 2026-10-19 adalah hari Senin
    expect(hariDalamMingguSenin('2026-10-19')).toBe(0);
    // 2026-10-20 adalah Selasa
    expect(hariDalamMingguSenin('2026-10-20')).toBe(1);
    // 2026-10-25 adalah Minggu
    expect(hariDalamMingguSenin('2026-10-25')).toBe(6);
  });

  it('menghitung penambahan hari dan penanganan pergantian bulan/tahun', () => {
    expect(tambahHari('2026-02-28', 1)).toBe('2026-03-01'); // 2026 bukan kabisat
    expect(tambahHari('2024-02-28', 1)).toBe('2024-02-29'); // 2024 tahun kabisat
    expect(tambahHari('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('membangun grid mode penuh (53 minggu) dan mode ringkas (26 minggu)', () => {
    const tanggalAkhir = '2026-10-22'; // Kamis

    // Mode penuh
    const gridPenuh = bangunGridKontribusi([], { mode: 'penuh', tanggalAkhir });
    expect(gridPenuh.weeks.length).toBe(53);
    for (const week of gridPenuh.weeks) {
      expect(week.days.length).toBe(7);
      // Hari pertama dalam kolom selalu Senin (dayOfWeek 0)
      expect(week.days[0]?.dayOfWeek).toBe(0);
      // Hari terakhir selalu Minggu (dayOfWeek 6)
      expect(week.days[6]?.dayOfWeek).toBe(6);
    }
    expect(gridPenuh.months.length).toBeGreaterThanOrEqual(10);

    // Mode ringkas
    const gridRingkas = bangunGridKontribusi([], { mode: 'ringkas', tanggalAkhir });
    expect(gridRingkas.weeks.length).toBe(26);
    expect(gridRingkas.weeks[0].days.length).toBe(7);
  });

  it('menempatkan hari di masa depan sebagai isCurrentPeriod: false', () => {
    const tanggalAkhir = '2026-10-20'; // Selasa
    const grid = bangunGridKontribusi([], { mode: 'penuh', tanggalAkhir });

    const mingguTerakhir = grid.weeks[grid.weeks.length - 1];
    // Selasa (indeks 1) adalah hari ini
    expect(mingguTerakhir.days[1]?.isCurrentPeriod).toBe(true);
    // Rabu (indeks 2), Kamis (3), dst di masa depan
    expect(mingguTerakhir.days[2]?.isCurrentPeriod).toBe(false);
    expect(mingguTerakhir.days[6]?.isCurrentPeriod).toBe(false);
  });
});
