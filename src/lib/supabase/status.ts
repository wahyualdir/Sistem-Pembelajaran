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
    const res = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(300), // 300ms cepat
    });
    cachedStatus = res.ok;
  } catch {
    cachedStatus = false;
  }

  lastCheckTime = now;
  return cachedStatus;
}
