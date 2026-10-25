/**
 * Supabase Availability Checker
 * Mencegah blocking TCP connection timeout (10-15s) saat Supabase lokal tidak sedang berjalan.
 * Memungkinkan dual-mode: 
 * - Full Supabase Auth + RLS di CI / staging / production
 * - Zero-delay instant fallback untuk lingkungan lokal tanpa Docker daemon
 */

let cachedStatus: boolean | null = null;
let lastCheckTime = 0;

export async function checkSupabaseOnline(): Promise<boolean> {
  const now = Date.now();
  // Cache status selama 15 detik agar tidak membebani network loop
  if (cachedStatus !== null && now - lastCheckTime < 15000) {
    return cachedStatus;
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const headers: Record<string, string> = {};
    if (anonKey) {
      headers['apikey'] = anonKey;
      headers['Authorization'] = `Bearer ${anonKey}`;
    }
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    const timeoutMs = isLocal ? 300 : 2500;
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
