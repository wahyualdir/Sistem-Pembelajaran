interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  ipAttempts?: Map<string, RateLimitEntry>;
  identifierAttempts?: Map<string, RateLimitEntry>;
};

const ipAttempts =
  globalForRateLimit.ipAttempts ?? (globalForRateLimit.ipAttempts = new Map());
const identifierAttempts =
  globalForRateLimit.identifierAttempts ?? (globalForRateLimit.identifierAttempts = new Map());

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 menit
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 menit
const MAX_REQUESTS_PER_MINUTE = 20;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
  reason?: 'RATE_LIMIT' | 'ACCOUNT_LOCKED';
}

/**
 * Pengecekan rate limit IP (mencegah DoS / brute force masif)
 */
export function checkIpRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = ipAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - 1 };
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter, reason: 'RATE_LIMIT' };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - entry.count };
}

/**
 * Pengecekan percobaan gagal per identifier (5x gagal -> 15 menit terkunci)
 * Sesuai Bagian 3.3 & Skenario D6
 */
export function checkIdentifierLockout(identifier: string): RateLimitResult {
  const norm = identifier.trim().toLowerCase();
  const now = Date.now();
  const entry = identifierAttempts.get(norm);

  if (entry && now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: retryAfter,
      reason: 'ACCOUNT_LOCKED',
    };
  }

  if (!entry || now >= entry.resetAt) {
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  return { allowed: true, remaining: Math.max(0, MAX_ATTEMPTS - entry.count) };
}

/**
 * Catat kegagalan login untuk identifier
 */
export function recordLoginFailure(identifier: string): { locked: boolean; retryAfterSeconds?: number } {
  const norm = identifier.trim().toLowerCase();
  const now = Date.now();
  const entry = identifierAttempts.get(norm);

  if (!entry || now >= entry.resetAt) {
    identifierAttempts.set(norm, { count: 1, resetAt: now + LOCKOUT_MS });
    return { locked: false };
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.resetAt = now + LOCKOUT_MS;
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { locked: true, retryAfterSeconds: retryAfter };
  }

  return { locked: false };
}

/**
 * Reset hitungan kegagalan saat login berhasil
 */
export function resetLoginFailure(identifier: string): void {
  const norm = identifier.trim().toLowerCase();
  identifierAttempts.delete(norm);
  void syncDistributedRateLimit(`lockout:${norm}`, 0, true);
}

/**
 * Sinkronisasi non-blocking ke Upstash Redis REST API (multi-instance production)
 * bila UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN dikonfigurasi.
 */
export async function syncDistributedRateLimit(
  key: string,
  ttlSeconds: number = 900,
  reset: boolean = false
): Promise<number | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return null;

  try {
    const cleanUrl = redisUrl.replace(/\/$/, '');
    const command = reset
      ? ['DEL', `siajar:rl:${key}`]
      : ['INCR', `siajar:rl:${key}`];

    const res = await fetch(`${cleanUrl}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const count = typeof data?.result === 'number' ? data.result : null;

    if (!reset && count === 1 && ttlSeconds > 0) {
      await fetch(`${cleanUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['EXPIRE', `siajar:rl:${key}`, String(ttlSeconds)]),
        signal: AbortSignal.timeout(2000),
      });
    }

    return count;
  } catch {
    return null;
  }
}

