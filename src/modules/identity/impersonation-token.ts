import { createHmac, timingSafeEqual } from 'crypto';

export interface ImpersonationTokenPayload {
  originalAdminId: string;
  originalAdminRole: string;
  originalAdminName: string;
  targetUserId: string;
  reason: string;
  startedAt: number;
  expiresAt: number;
}

function getImpersonationSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_SECRET wajib ada dan disetel di lingkungan produksi!');
    }
    throw new Error('APP_SECRET wajib disetel di file environment (.env.local / process.env)!');
  }
  return secret;
}

/**
 * A3a: Menandatangani payload sesi penyamaran dengan HMAC-SHA256 di sisi server
 */
export function signImpersonationToken(payload: ImpersonationTokenPayload): string {
  const secret = getImpersonationSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * A3a: Memverifikasi keaslian dan masa berlaku token penyamaran di sisi server
 */
export function verifyImpersonationToken(token: string): ImpersonationTokenPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const secret = getImpersonationSecret();
  const expectedSignature = createHmac('sha256', secret).update(data).digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null; // Tanda tangan tidak cocok (pemalsuan dicegah)
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as ImpersonationTokenPayload;
    if (!payload.originalAdminId || !payload.targetUserId || !payload.expiresAt) return null;
    if (Date.now() > payload.expiresAt) {
      return null; // Telah kedaluwarsa
    }
    return payload;
  } catch {
    return null;
  }
}
