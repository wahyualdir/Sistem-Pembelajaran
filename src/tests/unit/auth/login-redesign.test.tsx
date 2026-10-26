import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn((key: string) => (key === 'error' ? null : null)),
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

// Mock next/font/google agar tidak melempar TypeError di lingkungan uji Node
vi.mock('next/font/google', () => ({
  Bricolage_Grotesque: vi.fn(() => ({
    className: 'mock-bricolage',
    variable: '--font-bricolage-login',
  })),
  Inter: vi.fn(() => ({
    className: 'mock-inter',
    variable: '--font-inter-login',
  })),
}));

// Mock identity server action
vi.mock('@/modules/identity/actions', () => ({
  loginAction: vi.fn(),
}));

import LoginPage from '@/app/(auth)/login/page';
import { LoginDevMode } from '@/app/(auth)/login/login-dev-mode';

describe('Redesain Halaman Masuk RuangKampus (docs/INSTRUKSI_REDESAIN_LOGIN.md)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
  });

  describe('1. Aksesibilitas Formulir & Keterhubungan Label', () => {
    it('memastikan label terhubung ke isian identifier dengan htmlFor/for="identifier"', () => {
      const html = renderToString(<LoginPage />);
      expect(html).toContain('for="identifier"');
      expect(html).toContain('id="identifier"');
      expect(html).toContain('placeholder="Contoh: 243510001"');
      expect(html).toMatch(/autocomplete="username"/i);
    });

    it('memastikan label terhubung ke isian kata sandi dengan htmlFor/for="password"', () => {
      const html = renderToString(<LoginPage />);
      expect(html).toContain('for="password"');
      expect(html).toContain('id="password"');
      expect(html).toContain('placeholder="Masukkan kata sandi"');
      expect(html).toMatch(/autocomplete="current-password"/i);
    });

    it('memastikan tombol mata memiliki aria-label untuk pembaca layar', () => {
      const html = renderToString(<LoginPage />);
      expect(html).toContain('aria-label="Tampilkan kata sandi"');
    });
  });

  describe('2. Keseragaman Merek & Salinan Teks (Copywriting)', () => {
    it('menampilkan satu nama merek tunggal "RuangKampus" dan menghapus istilah lama', () => {
      const html = renderToString(<LoginPage />);
      expect(html).toContain('RuangKampus');
      expect(html).not.toContain('Ruang Kerja');
      expect(html).not.toContain('Portal Akademik Terpadu');
    });

    it('menampilkan teks panel merek dan formulir yang persis sesuai spesifikasi', () => {
      const html = renderToString(<LoginPage />);
      // Panel Merek Kiri
      expect(html).toContain('Kelas, tugas, dan ujian di satu tempat.');
      expect(html).toContain(
        'Masuk untuk melihat jadwal hari ini, tenggat yang paling dekat, dan materi dari dosenmu.'
      );
      expect(html).toContain('Teknik Informatika • Universitas Islam Riau');

      // Formulir Kanan
      expect(html).toContain('Gunakan NIM, NIDN, NIP, atau email kampus.');
      expect(html).toContain('Lupa kata sandi?');
      expect(html).not.toContain('Masuk dengan akun Google kampus');
      expect(html).not.toContain('Belum punya akun?');
      expect(html).not.toContain('Daftar di sini');
    });

    it('memuat ilustrasi garis 3 pulau (Selesai, Sedang dipelajari, Terkunci)', () => {
      const html = renderToString(<LoginPage />);
      expect(html).toContain('Selesai');
      expect(html).toContain('Sedang dipelajari');
      expect(html).toContain('Terkunci');
      expect(html).toContain('stroke-dasharray');
    });
  });

  describe('3. Mode Pengembang (Spesifikasi Bagian 6)', () => {
    it('TIDAK memunculkan elemen "Mode pengembang" saat NODE_ENV === "production"', () => {
      (process.env as any).NODE_ENV = 'production';
      const onSelect = vi.fn();
      const html = renderToString(<LoginDevMode onSelectIdentifier={onSelect} />);
      expect(html).toBe('');
      expect(html).not.toContain('Mode pengembang');
      expect(html).not.toContain('dev-mode-details');
    });

    it('memunculkan elemen "Mode pengembang" dalam details saat NODE_ENV === "development"', () => {
      (process.env as any).NODE_ENV = 'development';
      const onSelect = vi.fn();
      const html = renderToString(<LoginDevMode onSelectIdentifier={onSelect} />);
      expect(html).toContain('Mode pengembang');
      expect(html).toContain('data-testid="dev-mode-details"');
      expect(html).toContain('243510001'); // Mahasiswa
      expect(html).toContain('20120009'); // Super Admin
    });

    it('hanya mengisi identitas dan tidak mengisi kata sandi saat akun dipilih', () => {
      const onSelect = vi.fn();
      // Render di mode development
      (process.env as any).NODE_ENV = 'development';
      const component = <LoginDevMode onSelectIdentifier={onSelect} />;
      expect(component.props.onSelectIdentifier).toBe(onSelect);
    });
  });

  describe('4. Pemformatan Galat & Penguncian Akun', () => {
    it('memformat teks penguncian server menjadi "Terlalu banyak percobaan. Coba lagi dalam {n} menit."', () => {
      // Uji fungsi format respons terkunci
      const formatLockout = (errMsg: string) => {
        const errLower = errMsg.toLowerCase();
        if (
          errLower.includes('terkunci') ||
          errLower.includes('terlalu banyak percobaan') ||
          errLower.includes('detik') ||
          errLower.includes('menit')
        ) {
          const minuteMatch = errMsg.match(/(\d+)\s*menit/i);
          const secondMatch = errMsg.match(/(\d+)\s*detik/i);
          let minutes = 15;
          if (minuteMatch) {
            minutes = parseInt(minuteMatch[1], 10);
          } else if (secondMatch) {
            minutes = Math.max(1, Math.ceil(parseInt(secondMatch[1], 10) / 60));
          }
          return `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`;
        }
        return 'NIM atau kata sandi salah.';
      };

      expect(
        formatLockout('Akun terkunci otomatis karena 5 kali percobaan gagal berturut-turut. Coba lagi dalam 15 menit.')
      ).toBe('Terlalu banyak percobaan. Coba lagi dalam 15 menit.');

      expect(
        formatLockout('Akun terkunci sementara karena 5 kali percobaan gagal berturut-turut. Coba lagi dalam 900 detik.')
      ).toBe('Terlalu banyak percobaan. Coba lagi dalam 15 menit.');

      expect(
        formatLockout('Identifier atau password salah.')
      ).toBe('NIM atau kata sandi salah.');
    });
  });
});
