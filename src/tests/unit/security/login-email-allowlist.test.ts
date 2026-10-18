import { describe, it, expect, vi } from 'vitest';
import { validasiEmailKampusAsync, validasiEmailStudent } from '@/lib/auth/validasi-email';

describe('Validasi Email Login & Allowlist (allowed_email_domains dan email_allowlist)', () => {
  it('menerima email mahasiswa dengan domain resmi student.uir.ac.id', async () => {
    const res = await validasiEmailKampusAsync({
      email: 'ahmad.fauzi@student.uir.ac.id',
      emailVerified: true,
    });

    expect(res.valid).toBe(true);
    expect(res.normalizedEmail).toBe('ahmad.fauzi@student.uir.ac.id');
  });

  it('menerima email dosen/staf dengan domain uir.ac.id', async () => {
    const res = await validasiEmailKampusAsync({
      email: 'budi.santoso@uir.ac.id',
      emailVerified: true,
    });

    expect(res.valid).toBe(true);
    expect(res.normalizedEmail).toBe('budi.santoso@uir.ac.id');
  });

  it('menolak email komersial / pribadi di luar domain kampus yang diizinkan', async () => {
    const res = await validasiEmailKampusAsync({
      email: 'mahasiswa.pribadi@domain-luar.org',
      emailVerified: true,
    });

    expect(res.valid).toBe(false);
    expect(res.pesanError).toBeDefined();
  });

  it('menolak email tanpa verifikasi Google (emailVerified = false)', async () => {
    const res = await validasiEmailKampusAsync({
      email: 'ahmad@student.uir.ac.id',
      emailVerified: false,
    });

    expect(res.valid).toBe(false);
    expect(res.pesanError).toContain('belum diverifikasi');
  });

  it('menolak format email yang cacat atau kosong', async () => {
    const resEmpty = await validasiEmailKampusAsync({
      email: '',
      emailVerified: true,
    });
    expect(resEmpty.valid).toBe(false);

    const resNoDomain = await validasiEmailKampusAsync({
      email: 'tanpa-domain',
      emailVerified: true,
    });
    expect(resNoDomain.valid).toBe(false);
  });
});
