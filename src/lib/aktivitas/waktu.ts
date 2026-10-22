/**
 * Utilitas penanggalan untuk zona waktu Asia/Jakarta (WIB).
 */

const JAKARTA_TZ = 'Asia/Jakarta';

/**
 * Mengembalikan tanggal hari ini atau tanggal dari objek Date / string dalam format 'YYYY-MM-DD'
 * berdasarkan zona waktu Asia/Jakarta.
 */
export function getTanggalWIB(input?: Date | number | string): string {
  const d = input ? new Date(input) : new Date();
  // Menggunakan 'en-CA' yang selalu menghasilkan format ISO YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Menambahkan atau mengurangi jumlah hari dari string tanggal 'YYYY-MM-DD'.
 */
export function tambahHari(tanggalStr: string, jumlahHari: number): string {
  const [year, month, day] = tanggalStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + jumlahHari);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dt = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

/**
 * Menghitung selisih hari antara dua string tanggal (tanggalAkhir - tanggalAwal).
 */
export function selisihHari(tanggalAwal: string, tanggalAkhir: string): number {
  const [y1, m1, d1] = tanggalAwal.split('-').map(Number);
  const [y2, m2, d2] = tanggalAkhir.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (24 * 60 * 60 * 1000));
}

/**
 * Mengembalikan indeks hari dalam seminggu dengan Senin sebagai hari pertama (0 = Senin, ..., 6 = Minggu).
 */
export function hariDalamMingguSenin(tanggalStr: string): number {
  const [y, m, d] = tanggalStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // getUTCDay: 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const utcDay = date.getUTCDay();
  return utcDay === 0 ? 6 : utcDay - 1;
}

/**
 * Format tanggal ramah Bahasa Indonesia, misal: "12 Oktober 2026" atau "Senin, 12 Okt 2026".
 */
export function formatTanggalIndo(
  tanggalStr: string,
  opsi: { denganHari?: boolean; singkatBulan?: boolean } = {}
): string {
  const [y, m, d] = tanggalStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC',
    weekday: opsi.denganHari ? 'long' : undefined,
    day: 'numeric',
    month: opsi.singkatBulan ? 'short' : 'long',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat('id-ID', options).format(date);
}
