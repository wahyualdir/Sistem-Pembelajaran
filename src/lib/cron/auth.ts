import { NextResponse } from 'next/server';

/**
 * Memverifikasi otorisasi pekerjaan terjadwal (cron) secara seragam.
 * Memeriksa header 'Authorization: Bearer ${CRON_SECRET}'.
 * Menerapkan prinsip fail-closed: jika CRON_SECRET tidak disetel, permintaan selalu ditolak (401).
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export function unauthorizedCronResponse() {
  return NextResponse.json(
    { success: false, error: 'UNAUTHORIZED: Missing or invalid CRON_SECRET.' },
    { status: 401 }
  );
}
