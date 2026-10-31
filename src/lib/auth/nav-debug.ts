/**
 * Logging diagnostik untuk pelacakan alur navigasi dan resolusi peran.
 * Hanya mencetak jika process.env.NAV_DEBUG === '1'. Format: satu baris JSON.
 * DILARANG mencatat email, nama, atau token. Id pengguna hanya 8 karakter pertama.
 */
export function navDebug(event: string, data: Record<string, unknown>): void {
  if (process.env.NAV_DEBUG !== '1') {
    return;
  }

  const sanitizedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (
      key.toLowerCase().includes('email') ||
      key.toLowerCase().includes('name') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('password')
    ) {
      continue;
    }
    if ((key === 'userId' || key === 'user_id' || key === 'id') && typeof value === 'string') {
      sanitizedData[key] = value.slice(0, 8);
    } else {
      sanitizedData[key] = value;
    }
  }

  const logLine = JSON.stringify({
    tag: 'NAV_DEBUG',
    timestamp: new Date().toISOString(),
    event,
    ...sanitizedData,
  });

  // Cetak tepat 1 baris JSON
  console.log(logLine);
}
