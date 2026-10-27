import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Memverifikasi otorisasi pekerjaan terjadwal (cron) secara seragam.
 * Memeriksa header 'Authorization: Bearer ${CRON_SECRET}' dengan perbandingan waktu-konstan.
 * Menerapkan prinsip fail-closed: jika CRON_SECRET tidak disetel, permintaan selalu ditolak (401).
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }
  const expectedHeader = `Bearer ${cronSecret}`;
  const authBuf = Buffer.from(authHeader, 'utf-8');
  const expectedBuf = Buffer.from(expectedHeader, 'utf-8');

  if (authBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(authBuf, expectedBuf);
}

export function unauthorizedCronResponse() {
  return NextResponse.json(
    { success: false, error: 'UNAUTHORIZED: Missing or invalid CRON_SECRET.' },
    { status: 401 }
  );
}
