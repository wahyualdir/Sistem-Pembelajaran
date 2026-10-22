import {
  ItemAktivitasHarian,
  HasilGridKontribusi,
  KolomMingguGrid,
  SelGridKontribusi,
  LabelBulanGrid,
} from './tipe';
import { NAMA_BULAN_ID } from './konfigurasi';
import {
  getTanggalWIB,
  tambahHari,
  hariDalamMingguSenin,
  selisihHari,
} from './waktu';
import { agregasikanAktivitasPerHari, hitungStatistikAktivitas } from './ringkasan';

export interface OpsiGridKontribusi {
  mode?: 'penuh' | 'ringkas';
  tanggalAkhir?: string; // Format 'YYYY-MM-DD', default hari ini WIB
}

/**
 * Membangun struktur matriks grid kontribusi gaya GitHub:
 * - Kolom: Minggu (kronologis dari kiri ke kanan)
 * - Baris: Hari (0 = Senin s.d. 6 = Minggu)
 * - Mode 'penuh': 53 minggu (~12 bulan)
 * - Mode 'ringkas': 26 minggu (~6 bulan)
 */
export function bangunGridKontribusi(
  daftarAktivitas: ItemAktivitasHarian[],
  opsi: OpsiGridKontribusi = {}
): HasilGridKontribusi {
  const mode = opsi.mode || 'penuh';
  const jumlahMinggu = mode === 'penuh' ? 53 : 26;
  const tanggalAkhir = opsi.tanggalAkhir || getTanggalWIB();

  // Hari dalam minggu untuk tanggal akhir (0 = Senin, ..., 6 = Minggu)
  const dowAkhir = hariDalamMingguSenin(tanggalAkhir);

  // Cari hari Minggu di akhir minggu berjalan sebagai batas akhir grid
  const mingguTerakhir = tambahHari(tanggalAkhir, 6 - dowAkhir);

  // Cari hari Senin di awal grid (jumlahMinggu * 7 hari sebelum akhir minggu)
  const seninAwal = tambahHari(mingguTerakhir, -(jumlahMinggu * 7 - 1));

  // Agregasi aktivitas per hari
  const mapHari = agregasikanAktivitasPerHari(daftarAktivitas);

  const weeks: KolomMingguGrid[] = [];
  const months: LabelBulanGrid[] = [];

  let bulanTerakhir = -1;
  let tanggalJalan = seninAwal;

  for (let w = 0; w < jumlahMinggu; w++) {
    const days: (SelGridKontribusi | null)[] = [];

    for (let d = 0; d < 7; d++) {
      const curDate = tanggalJalan;
      const isFuture = selisihHari(tanggalAkhir, curDate) > 0;
      const entry = mapHari.get(curDate);

      // Cek penempatan label bulan pada hari Senin atau hari ke-1 bulan
      const [yearStr, monthStr, dayStr] = curDate.split('-');
      const bulanIdx = parseInt(monthStr, 10) - 1;
      const tglAngka = parseInt(dayStr, 10);

      // Tandai label bulan jika awal bulan jatuh di minggu ini dan belum dicatat
      if (tglAngka <= 7 && bulanIdx !== bulanTerakhir && !isFuture) {
        // Beri jarak minimal 2 kolom dari label bulan sebelumnya agar tidak bertumpuk
        const lastCol = months.length > 0 ? months[months.length - 1].colIndex : -99;
        if (w - lastCol >= 2) {
          months.push({
            label: NAMA_BULAN_ID[bulanIdx],
            colIndex: w,
          });
          bulanTerakhir = bulanIdx;
        }
      }

      if (isFuture) {
        // Hari di masa depan (melebihi tanggal akhir)
        days.push({
          date: curDate,
          dayOfWeek: d,
          points: 0,
          count: 0,
          level: 0,
          isCurrentPeriod: false,
          details: {},
        });
      } else {
        days.push({
          date: curDate,
          dayOfWeek: d,
          points: entry ? entry.totalPoints : 0,
          count: entry ? entry.totalCount : 0,
          level: entry ? entry.level : 0,
          isCurrentPeriod: true,
          details: entry ? entry.details : {},
        });
      }

      tanggalJalan = tambahHari(tanggalJalan, 1);
    }

    weeks.push({
      weekIndex: w,
      days,
    });
  }

  // Filter aktivitas yang masuk dalam rentang grid untuk statistik
  const aktivitasDalamRentang = daftarAktivitas.filter((a) => {
    return (
      selisihHari(seninAwal, a.date) >= 0 && selisihHari(a.date, tanggalAkhir) >= 0
    );
  });

  const rentangHari = selisihHari(seninAwal, tanggalAkhir) + 1;
  const stats = hitungStatistikAktivitas(aktivitasDalamRentang, rentangHari);

  return {
    weeks,
    months,
    stats,
    startDate: seninAwal,
    endDate: tanggalAkhir,
  };
}
