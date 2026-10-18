import { describe, it, expect } from 'vitest';

/**
 * Validasi Logika Pengaman Gagal-Tertutup (Fail-Closed Safeguard) demo_seed.sql:
 * Seed HANYA boleh berjalan jika app.environment bernilai tepat 'local' atau 'staging'.
 * Kosong (null/undefined/'') atau nilai lain (misal: 'production', 'prod', 'live', 'dev')
 * HARUS melempar exception / ditolak.
 */
export function evaluateSeedExecutionPermission(appEnvironmentSetting: string | null | undefined): {
  allowed: boolean;
  errorMessage?: string;
} {
  const currentVal = appEnvironmentSetting ?? '';
  if (currentVal !== 'local' && currentVal !== 'staging') {
    return {
      allowed: false,
      errorMessage: `EKSEKUSI DITOLAK (FAIL-CLOSED): demo_seed.sql hanya boleh dijalankan pada lingkungan lokal atau staging (current_setting('app.environment') bernilai tepat 'local' atau 'staging'). Nilai saat ini: '${appEnvironmentSetting ?? '<tidak diatur>'}'.`,
    };
  }

  return { allowed: true };
}

describe('Safeguard demo_seed.sql Gagal-Tertutup (Fail-Closed)', () => {
  it('1. Menolak eksekusi jika app.environment TIDAK DIATUR (undefined atau null)', () => {
    const resUndefined = evaluateSeedExecutionPermission(undefined);
    expect(resUndefined.allowed).toBe(false);
    expect(resUndefined.errorMessage).toContain('FAIL-CLOSED');
    expect(resUndefined.errorMessage).toContain('<tidak diatur>');

    const resNull = evaluateSeedExecutionPermission(null);
    expect(resNull.allowed).toBe(false);
    expect(resNull.errorMessage).toContain('FAIL-CLOSED');
  });

  it('2. Menolak eksekusi jika app.environment berupa string kosong ("")', () => {
    const resEmpty = evaluateSeedExecutionPermission('');
    expect(resEmpty.allowed).toBe(false);
    expect(resEmpty.errorMessage).toContain('FAIL-CLOSED');
  });

  it('3. Menolak eksekusi pada lingkungan produksi ("production", "prod", "live")', () => {
    expect(evaluateSeedExecutionPermission('production').allowed).toBe(false);
    expect(evaluateSeedExecutionPermission('prod').allowed).toBe(false);
    expect(evaluateSeedExecutionPermission('live').allowed).toBe(false);
    expect(evaluateSeedExecutionPermission('PROD').allowed).toBe(false);
  });

  it('4. Menolak eksekusi pada sembarang string di luar "local" atau "staging"', () => {
    expect(evaluateSeedExecutionPermission('dev').allowed).toBe(false);
    expect(evaluateSeedExecutionPermission('testing').allowed).toBe(false);
    expect(evaluateSeedExecutionPermission('sandbox').allowed).toBe(false);
  });

  it('5. MENGIZINKAN eksekusi HANYA jika app.environment bernilai tepat "local" atau "staging"', () => {
    const resLocal = evaluateSeedExecutionPermission('local');
    expect(resLocal.allowed).toBe(true);
    expect(resLocal.errorMessage).toBeUndefined();

    const resStaging = evaluateSeedExecutionPermission('staging');
    expect(resStaging.allowed).toBe(true);
    expect(resStaging.errorMessage).toBeUndefined();
  });
});
