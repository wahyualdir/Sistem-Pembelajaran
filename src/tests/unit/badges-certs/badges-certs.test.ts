import { describe, it, expect } from 'vitest';
import {
  getStudentBadgesAction,
  getStudentCertificatesAction,
  verifyCertificateByCodeAction,
} from '@/modules/academic/badge-certificate-actions';

describe('Lencana Prestasi Mahasiswa & Sertifikat Kelulusan dengan Verifikasi Publik', () => {
  describe('1. Lencana Prestasi Akademik (Monochrome Palette)', () => {
    it('mengambil 4 lencana prestasi mahasiswa lengkap dengan progres capaian', async () => {
      const badges = await getStudentBadgesAction();

      expect(badges).toBeDefined();
      expect(badges.length).toBeGreaterThanOrEqual(4);

      const codes = badges.map((b) => b.code);
      expect(codes).toContain('KEHADIRAN_PENUH');
      expect(codes).toContain('STREAK_30_HARI');
      expect(codes).toContain('TEPAT_WAKTU');
      expect(codes).toContain('BINTANG_DISKUSI');

      // Memastikan tiap lencana memiliki deskripsi dan status terbuka
      const streakBadge = badges.find((b) => b.code === 'STREAK_30_HARI');
      expect(streakBadge?.title).toBe('Streak Belajar 30 Hari');
      expect(streakBadge?.progress).toContain('30');
      expect(streakBadge?.isUnlocked).toBe(true);
    });
  });

  describe('2. Sertifikat Kelulusan Mata Kuliah & Verifikasi Publik', () => {
    it('mengambil daftar sertifikat kelulusan resmi mahasiswa', async () => {
      const certs = await getStudentCertificatesAction();

      expect(certs).toBeDefined();
      expect(certs.length).toBeGreaterThan(0);

      const firstCert = certs[0];
      expect(firstCert.verificationCode).toBeDefined();
      expect(firstCert.courseName).toBeDefined();
      expect(firstCert.grade).toBeDefined();
      expect(firstCert.signatureHash).toBeDefined();
    });

    it('dapat memverifikasi sertifikat publik menggunakan kode resmi yang sah', async () => {
      const result = await verifyCertificateByCodeAction('UIR-CERT-2026-TI-0018');

      expect(result.isValid).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate?.title).toContain('Pemrograman Web Lanjut');
      expect(result.certificate?.recipientName).toBe('Wahyu Aldiriyanto');
      expect(result.certificate?.studentNim).toBe('2024001');
      expect(result.certificate?.status).toBe('RESMI');
    });

    it('menolak verifikasi jika kode sertifikat tidak terdaftar atau salah', async () => {
      const result = await verifyCertificateByCodeAction('KODE-PALSU-TIDAK-VALID-999');

      expect(result.isValid).toBe(false);
      expect(result.certificate).toBeUndefined();
      expect(result.error).toContain('tidak ditemukan atau belum terdaftar');
    });

    it('menolak verifikasi jika kode kosong', async () => {
      const result = await verifyCertificateByCodeAction('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('wajib diisi');
    });
  });

  describe('3. Kepatuhan Privasi: Dilarang Mengekspos Alamat Email Pribadi', () => {
    it('memastikan tidak ada alamat email pribadi yang terekspos pada objek sertifikat atau lencana', async () => {
      const certs = await getStudentCertificatesAction();
      const badges = await getStudentBadgesAction();

      const certsJson = JSON.stringify(certs);
      const badgesJson = JSON.stringify(badges);

      // Tidak boleh mengandung '@' (karakter khas alamat surel/email)
      expect(certsJson).not.toContain('@');
      expect(badgesJson).not.toContain('@');

      // Memastikan identitas menggunakan NIM
      certs.forEach((c) => {
        expect(c.studentNim).toBeDefined();
        expect((c as any).email).toBeUndefined();
      });
    });
  });
});
