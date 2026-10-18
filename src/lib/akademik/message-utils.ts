/**
 * Utilitas Murni Percakapan & Konsultasi SIAJAR (Section 12.1)
 */

/**
 * Memeriksa apakah saat ini berada dalam jam tenang dosen (20.00 - 07.00 WIB)
 */
export function isLecturerQuietHours(date: Date = new Date()): boolean {
  const utcHours = date.getUTCHours();
  const wibHours = (utcHours + 7) % 24;
  return wibHours >= 20 || wibHours < 7;
}

/**
 * Validasi batas waktu pembatalan konsultasi minimal 2 jam sebelum mulai
 */
export function canCancelConsultation(startsAt: string | Date, now: Date = new Date(), minCancelHours: number = 2): boolean {
  const start = new Date(startsAt).getTime();
  const current = now.getTime();
  const diffHours = (start - current) / (3600 * 1000);
  return diffHours >= minCancelHours;
}
