/**
 * Supabase Availability Checker
 * Mencegah blocking TCP connection timeout (10-15s) saat Supabase lokal tidak sedang berjalan.
 * Memungkinkan dual-mode: 
 * - Full Supabase Auth + RLS di CI / staging / production (instant true untuk remote Supabase)
 * - Zero-delay instant fallback untuk lingkungan lokal tanpa Docker daemon
 */

let cachedStatus: boolean | null = null;
let lastCheckTime = 0;

export async function checkSupabaseOnline(): Promise<boolean> {
  // Dalam lingkungan unit test (Vitest / Jest), fallback ke in-memory store
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return false;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');

  const now = Date.now();
  // Hasil BERHASIL di-cache 30 detik; hasil GAGAL di-cache maksimal 5 detik
  const cacheTtl = cachedStatus === true ? 30000 : 5000;
  if (cachedStatus !== null && now - lastCheckTime < cacheTtl) {
    return cachedStatus;
  }

  try {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const headers: Record<string, string> = {};
    if (anonKey) {
      headers['apikey'] = anonKey;
      headers['Authorization'] = `Bearer ${anonKey}`;
    }
    // Timeout URL remote: 3000ms, lokal: 300ms
    const timeoutMs = isLocal ? 300 : 3000;
    const res = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    cachedStatus = res.ok;
  } catch {
    cachedStatus = false;
  }

  lastCheckTime = now;
  return cachedStatus;
}
