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

  // Untuk Supabase Cloud (staging / production / remote), Supabase aktif sebagai basis data utama
  // Mengembalikan true secara instan (0 ms) untuk menghilangkan blocking delay 1.000 - 1.500 ms di serverless/middleware.
  if (!isLocal) {
    return true;
  }

  const now = Date.now();
  // Cache status selama 30 detik untuk lingkungan lokal
  if (cachedStatus !== null && now - lastCheckTime < 30000) {
    return cachedStatus;
  }

  try {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const headers: Record<string, string> = {};
    if (anonKey) {
      headers['apikey'] = anonKey;
      headers['Authorization'] = `Bearer ${anonKey}`;
    }
    const res = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(300),
    });
    cachedStatus = res.ok;
  } catch {
    cachedStatus = false;
  }

  lastCheckTime = now;
  return cachedStatus;
}
