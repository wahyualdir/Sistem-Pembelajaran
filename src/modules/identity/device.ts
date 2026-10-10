import { createHash } from 'crypto';

export interface DeviceInfo {
  label: string;
  ipMasked: string;
  country: string;
  city: string;
}

/**
 * Parsing User-Agent menjadi string ringkas yang ramah pengguna
 * Contoh: "Chrome di Windows", "Safari di iPhone", "Firefox di Linux"
 */
export function parseUserAgent(uaString: string | null): string {
  if (!uaString) return 'Perangkat Tidak Dikenal';

  let browser = 'Browser';
  if (uaString.includes('Edg/')) browser = 'Edge';
  else if (uaString.includes('Chrome/')) browser = 'Chrome';
  else if (uaString.includes('Safari/') && !uaString.includes('Chrome/')) browser = 'Safari';
  else if (uaString.includes('Firefox/')) browser = 'Firefox';
  else if (uaString.includes('OPR/') || uaString.includes('Opera/')) browser = 'Opera';

  let os = 'Sistem';
  if (uaString.includes('Windows NT 10.0') || uaString.includes('Windows')) os = 'Windows';
  else if (uaString.includes('Macintosh') || uaString.includes('Mac OS X')) os = 'macOS';
  else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';
  else if (uaString.includes('Android')) os = 'Android';
  else if (uaString.includes('Linux')) os = 'Linux';

  return `${browser} di ${os}`;
}

/**
 * Masking alamat IP untuk mematuhi privasi UU PDP (Bagian 15.3 & 22.5)
 */
export function maskIpAddress(ip: string | null): string {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return '127.0.0.xxx';

  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  } else if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 3).join(':')}:xxxx:xxxx`;
  }
  return 'xxx.xxx.xxx.xxx';
}

/**
 * Hash cookie device_id dengan SHA-256 untuk disimpan di basis data
 */
export function hashDeviceId(deviceId: string): string {
  return createHash('sha256').update(deviceId).digest('hex');
}
