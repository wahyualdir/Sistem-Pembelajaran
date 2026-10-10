import { describe, it, expect, beforeEach } from 'vitest';
import {
  loginSchema,
  changePasswordSchema,
  switchWorkspaceSchema,
} from '../src/modules/identity/schemas';
import { SYNTHETIC_DEMO_USERS } from '../src/modules/identity/demo-users';
import {
  parseUserAgent,
  maskIpAddress,
  hashDeviceId,
} from '../src/modules/identity/device';
import {
  checkIpRateLimit,
  checkIdentifierLockout,
  recordLoginFailure,
  resetLoginFailure,
} from '../src/modules/identity/rate-limiter';

describe('SIAJAR Fase 1: Identity & Access Logic Tests', () => {
  describe('1. Validasi Skema Zod (Identity & Password)', () => {
    it('memvalidasi input login yang sah dengan berbagai tipe identifier', () => {
      const validCases = [
        { identifier: '2024001', password: 'Password123!' },
        { identifier: 'dosen@siajar.ac.id', password: 'SecretPassword99#' },
        { identifier: 'sysadmin', password: 'SuperAdminPass!2' },
        { identifier: 'wahyualdiriyanto80@gmail.com', password: 'Wahyu11' },
      ];

      for (const c of validCases) {
        const res = loginSchema.safeParse(c);
        expect(res.success).toBe(true);
      }
    });

    it('memastikan akun Super Admin Wahyu terdaftar dengan role SYSTEM_ADMIN', () => {
      const user = SYNTHETIC_DEMO_USERS['wahyualdiriyanto80@gmail.com'];
      expect(user).toBeDefined();
      expect(user.roles).toContain('SYSTEM_ADMIN');
      expect(user.password).toBe('Wahyu11');
      expect(user.status).toBe('ACTIVE');
    });

    it('menolak input login yang terlalu pendek atau kosong', () => {
      const invalidCases = [
        { identifier: 'ab', password: 'Password123!' },
        { identifier: '', password: 'Password123!' },
        { identifier: '2024001', password: '123' },
      ];

      for (const c of invalidCases) {
        const res = loginSchema.safeParse(c);
        expect(res.success).toBe(false);
      }
    });

    it('menegakkan kebijakan password ketat: minimal 10 karakter, huruf besar, angka, dan simbol', () => {
      const validPassword = {
        currentPassword: 'Password123!',
        newPassword: 'KatasandiBaru2026#',
        confirmPassword: 'KatasandiBaru2026#',
      };
      const res = changePasswordSchema.safeParse(validPassword);
      expect(res.success).toBe(true);
    });

    it('menolak password yang tidak memenuhi syarat kompleksitas atau konfirmasi tidak cocok', () => {
      // Kurang dari 10 karakter
      const shortPass = changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'Abc1!',
        confirmPassword: 'Abc1!',
      });
      expect(shortPass.success).toBe(false);

      // Tanpa angka
      const noNum = changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'KatasandiBaru!',
        confirmPassword: 'KatasandiBaru!',
      });
      expect(noNum.success).toBe(false);

      // Konfirmasi tidak cocok
      const mismatch = changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'KatasandiBaru2026#',
        confirmPassword: 'DifferentPass2026#',
      });
      expect(mismatch.success).toBe(false);
    });

    it('memvalidasi pemilihan workspace hanya untuk 6 role yang sah', () => {
      const validRoles = [
        'STUDENT',
        'LECTURER',
        'TEACHING_ASSISTANT',
        'PROGRAM_COORDINATOR',
        'ACADEMIC_STAFF',
        'SYSTEM_ADMIN',
      ];

      for (const roleCode of validRoles) {
        const res = switchWorkspaceSchema.safeParse({ roleCode });
        expect(res.success).toBe(true);
      }

      // Role tidak sah
      const invalid = switchWorkspaceSchema.safeParse({ roleCode: 'UNKNOWN_ROLE' as unknown });
      expect(invalid.success).toBe(false);
    });
  });

  describe('2. Keamanan Perangkat & Privasi (Bagian 22)', () => {
    it('melakukan parsing User-Agent secara akurat dan ramah pengguna', () => {
      const chromeWindows =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
      expect(parseUserAgent(chromeWindows)).toBe('Chrome di Windows');

      const safariMac =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
      expect(parseUserAgent(safariMac)).toBe('Safari di macOS');

      const firefoxAndroid =
        'Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0';
      expect(parseUserAgent(firefoxAndroid)).toBe('Firefox di Android');

      expect(parseUserAgent(null)).toBe('Perangkat Tidak Dikenal');
    });

    it('melakukan masking alamat IP untuk mematuhi privasi UU PDP (Bagian 15.3)', () => {
      expect(maskIpAddress('192.168.1.50')).toBe('192.168.1.xxx');
      expect(maskIpAddress('10.0.25.101')).toBe('10.0.25.xxx');
      expect(maskIpAddress('127.0.0.1')).toBe('127.0.0.xxx');
      expect(maskIpAddress('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toBe('2001:db8:85a3:xxxx:xxxx');
    });

    it('menghasilkan hash SHA-256 yang deterministik untuk cookie device_id', () => {
      const devId = '550e8400-e29b-41d4-a716-446655440000';
      const hash1 = hashDeviceId(devId);
      const hash2 = hashDeviceId(devId);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });
  });

  describe('3. Rate Limiter & Skenario D6 (Lockout 5x Gagal)', () => {
    const testId = 'test-lockout-nim-2024';

    beforeEach(() => {
      resetLoginFailure(testId);
    });

    it('mengunci akun selama 15 menit setelah 5 kali gagal login berturut-turut (Skenario D6)', () => {
      // 4 kali gagal pertama -> belum terkunci
      for (let i = 1; i <= 4; i++) {
        const res = recordLoginFailure(testId);
        expect(res.locked).toBe(false);
        const lockCheck = checkIdentifierLockout(testId);
        expect(lockCheck.allowed).toBe(true);
      }

      // Percobaan gagal ke-5 -> akun terkunci!
      const fifth = recordLoginFailure(testId);
      expect(fifth.locked).toBe(true);
      expect(fifth.retryAfterSeconds).toBeGreaterThan(0);

      // Pengecekan status lockout
      const lockCheck = checkIdentifierLockout(testId);
      expect(lockCheck.allowed).toBe(false);
      expect(lockCheck.reason).toBe('ACCOUNT_LOCKED');
      expect(lockCheck.retryAfterSeconds).toBeGreaterThan(0);

      // Reset saat kredensial valid
      resetLoginFailure(testId);
      const afterReset = checkIdentifierLockout(testId);
      expect(afterReset.allowed).toBe(true);
    });

    it('membatasi lonjakan request berlebih per IP (IP Rate Limit)', () => {
      const testIp = '10.99.88.77';
      let lastResult;
      for (let i = 0; i < 20; i++) {
        lastResult = checkIpRateLimit(testIp);
      }
      expect(lastResult?.allowed).toBe(true);

      // Request ke-21 melebihi kapasitas per menit
      const overLimit = checkIpRateLimit(testIp);
      expect(overLimit.allowed).toBe(false);
      expect(overLimit.reason).toBe('RATE_LIMIT');
    });
  });
});
