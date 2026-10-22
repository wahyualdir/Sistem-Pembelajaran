import { describe, it, expect } from 'vitest';
import { assertSafetyGuard, extractProjectRefFromUrl } from '../../../../scripts/seed-akademik/guard';

describe('Guard Keselamatan Seed Akademik (Fail-Closed)', () => {
  it('berhasil lolos jika semua parameter valid untuk lokal', () => {
    expect(() =>
      assertSafetyGuard({
        seedEnv: 'local',
        seedConfirmProjectRef: 'local',
        nodeEnv: 'development',
        vercelEnv: 'development',
        seedPassword: 'SecretPassword123!',
        supabaseUrl: 'http://127.0.0.1:54321',
      })
    ).not.toThrow();
  });

  it('berhasil lolos jika semua parameter valid untuk staging', () => {
    expect(() =>
      assertSafetyGuard({
        seedEnv: 'staging',
        seedConfirmProjectRef: 'xyz-project',
        nodeEnv: 'development',
        vercelEnv: 'preview',
        seedPassword: 'SecretPassword123!',
        supabaseUrl: 'https://xyz-project.supabase.co',
      })
    ).not.toThrow();
  });

  it('menolak keras jika NODE_ENV adalah production', () => {
    expect(() =>
      assertSafetyGuard({
        seedEnv: 'local',
        seedConfirmProjectRef: 'local',
        nodeEnv: 'production',
        seedPassword: 'SecretPassword123!',
        supabaseUrl: 'http://127.0.0.1:54321',
      })
    ).toThrow(/NODE_ENV atau VERCEL_ENV adalah "production"/);
  });

  it('menolak keras jika VERCEL_ENV adalah production', () => {
    expect(() =>
      assertSafetyGuard({
        seedEnv: 'staging',
        seedConfirmProjectRef: 'xyz-project',
        nodeEnv: 'development',
        vercelEnv: 'production',
        seedPassword: 'SecretPassword123!',
        supabaseUrl: 'https://xyz-project.supabase.co',
      })
    ).toThrow(/NODE_ENV atau VERCEL_ENV adalah "production"/);
  });

  it('menolak keras jika SEED_ENV kosong atau bernilai produksi', () => {
    expect(() =>
      assertSafetyGuard({
        seedEnv: '',
        seedConfirmProjectRef: 'local',
        nodeEnv: 'development',
        seedPassword: 'SecretPassword123!',
        supabaseUrl: 'http://127.0.0.1:54321',
      })
    ).toThrow(/SEED_ENV harus bernilai tepat "local" atau "staging"/);

    expect(() =>
      assertSafetyGuard({
        seedEnv: 'production',
        seedConfirmProjectRef: 'local',
        nodeEnv: 'development',
        seedPassword: 'SecretPassword123!',
        supabaseUrl: 'http://127.0.0.1:54321',
      })
    ).toThrow(/SEED_ENV harus bernilai tepat "local" atau "staging"/);
  });

  it('menolak jika SEED_CONFIRM_PROJECT_REF tidak cocok dengan url target', () => {
    expect(() =>
      assertSafetyGuard({
        seedEnv: 'local',
        seedConfirmProjectRef: 'wrong-ref',
        nodeEnv: 'development',
        seedPassword: 'SecretPassword123!',
        supabaseUrl: 'http://127.0.0.1:54321',
      })
    ).toThrow(/tidak cocok dengan ref proyek basis data target/);
  });

  it('menolak jika SEED_PASSWORD kurang dari batas minimal atau kosong', () => {
    // local: minimal 6 karakter
    expect(() =>
      assertSafetyGuard({
        seedEnv: 'local',
        seedConfirmProjectRef: 'local',
        nodeEnv: 'development',
        seedPassword: '12345',
        supabaseUrl: 'http://127.0.0.1:54321',
      })
    ).toThrow(/minimal 6 karakter/);

    expect(() =>
      assertSafetyGuard({
        seedEnv: 'local',
        seedConfirmProjectRef: 'local',
        nodeEnv: 'development',
        seedPassword: '',
        supabaseUrl: 'http://127.0.0.1:54321',
      })
    ).toThrow(/minimal 6 karakter/);

    // staging: minimal 12 karakter
    expect(() =>
      assertSafetyGuard({
        seedEnv: 'staging',
        seedConfirmProjectRef: 'xyz-project',
        nodeEnv: 'development',
        seedPassword: '123456',
        supabaseUrl: 'https://xyz-project.supabase.co',
      })
    ).toThrow(/minimal 12 karakter/);
  });

  it('menerima kata sandi 6 karakter pada SEED_ENV=local dan minimal 12 karakter pada SEED_ENV=staging', () => {
    // local: 6 karakter diterima
    expect(() =>
      assertSafetyGuard({
        seedEnv: 'local',
        seedConfirmProjectRef: 'local',
        nodeEnv: 'development',
        seedPassword: '123456',
        supabaseUrl: 'http://127.0.0.1:54321',
      })
    ).not.toThrow();

    // staging: 12 karakter diterima
    expect(() =>
      assertSafetyGuard({
        seedEnv: 'staging',
        seedConfirmProjectRef: 'xyz-project',
        nodeEnv: 'development',
        seedPassword: 'SecretPassword123!',
        supabaseUrl: 'https://xyz-project.supabase.co',
      })
    ).not.toThrow();
  });

  it('mengekstrak project ref dari berbagai format URL Supabase', () => {
    expect(extractProjectRefFromUrl('http://localhost:54321')).toBe('local');
    expect(extractProjectRefFromUrl('http://127.0.0.1:54321')).toBe('local');
    expect(extractProjectRefFromUrl('https://wjozquxlicbejicjpfqa.supabase.co')).toBe('wjozquxlicbejicjpfqa');
  });
});
