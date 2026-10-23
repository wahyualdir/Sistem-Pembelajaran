import { createHash } from 'crypto';

/**
 * Menghasilkan UUID v4 deterministik yang valid berdasarkan input string.
 * Memenuhi spesifikasi RFC 4122 (digit ke-13 adalah '4', digit ke-17 adalah 'a').
 */
export function deterministicUuid(input: string): string {
  const hash = createHash('md5').update(input).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
