import { describe, it, expect } from 'vitest';
import {
  validateFeedbackAnchor,
  validateCommentBody,
  canStudentViewFeedback,
} from '@/lib/akademik/feedback-comments-utils';

describe('SIAJAR Bagian 9.3: Rubrik dan Komentar Berkas (Feedback Comments)', () => {
  describe('1. Validasi Penanda Komentar Berkas (Anchor)', () => {
    it('mengizinkan komentar umum tanpa anchor (null atau undefined)', () => {
      expect(validateFeedbackAnchor(null).valid).toBe(true);
      expect(validateFeedbackAnchor(undefined).valid).toBe(true);
    });

    it('memvalidasi penanda baris kode (type: "lines")', () => {
      // Valid line anchor
      expect(validateFeedbackAnchor({ type: 'lines', from: 3, to: 7 }).valid).toBe(true);
      expect(validateFeedbackAnchor({ type: 'lines', from: 10, to: 10 }).valid).toBe(true);

      // Invalid line anchor
      const invalidFromZero = validateFeedbackAnchor({ type: 'lines', from: 0, to: 5 });
      expect(invalidFromZero.valid).toBe(false);
      expect(invalidFromZero.error).toContain('minimal 1');

      const invalidInverted = validateFeedbackAnchor({ type: 'lines', from: 12, to: 8 });
      expect(invalidInverted.valid).toBe(false);
      expect(invalidInverted.error).toContain('tidak boleh lebih kecil');

      const invalidNonNumber = validateFeedbackAnchor({ type: 'lines', from: '3', to: 7 });
      expect(invalidNonNumber.valid).toBe(false);
      expect(invalidNonNumber.error).toContain('harus berupa angka');
    });

    it('memvalidasi penanda halaman dokumen PDF (type: "page")', () => {
      // Valid page anchor
      expect(validateFeedbackAnchor({ type: 'page', page: 2, x: 0.4, y: 0.3 }).valid).toBe(true);
      expect(validateFeedbackAnchor({ type: 'page', page: 1, x: 0.0, y: 1.0 }).valid).toBe(true);

      // Invalid page number
      const invalidPageZero = validateFeedbackAnchor({ type: 'page', page: 0, x: 0.5, y: 0.5 });
      expect(invalidPageZero.valid).toBe(false);
      expect(invalidPageZero.error).toContain('minimal 1');

      // Invalid coordinates out of [0, 1] range
      const invalidX = validateFeedbackAnchor({ type: 'page', page: 1, x: 1.2, y: 0.5 });
      expect(invalidX.valid).toBe(false);
      expect(invalidX.error).toContain('di antara 0.0 dan 1.0');

      const invalidY = validateFeedbackAnchor({ type: 'page', page: 1, x: 0.5, y: -0.1 });
      expect(invalidY.valid).toBe(false);
      expect(invalidY.error).toContain('di antara 0.0 dan 1.0');
    });

    it('menolak tipe penanda selain "lines" atau "page"', () => {
      const res = validateFeedbackAnchor({ type: 'paragraph', number: 3 });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('hanya mendukung "lines" atau "page"');
    });
  });

  describe('2. Validasi Teks Komentar Berkas (Body Length)', () => {
    it('menolak komentar kosong atau spasi saja', () => {
      expect(validateCommentBody('').valid).toBe(false);
      expect(validateCommentBody('   ').valid).toBe(false);
    });

    it('menerima komentar dengan panjang 1 sampai 2000 karakter', () => {
      expect(validateCommentBody('Perhatikan penamaan variabel di sini.').valid).toBe(true);
      const longComment = 'A'.repeat(2000);
      expect(validateCommentBody(longComment).valid).toBe(true);
    });

    it('menolak komentar yang melampaui 2000 karakter', () => {
      const tooLong = 'A'.repeat(2001);
      const res = validateCommentBody(tooLong);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('maksimal 2000');
    });
  });

  describe('3. Hak Akses Mahasiswa Melihat Komentar Berkas (RLS & Publication)', () => {
    it('menyembunyikan komentar jika nilai belum dipublikasikan', () => {
      expect(canStudentViewFeedback(false, false)).toBe(false);
      expect(canStudentViewFeedback(false, true)).toBe(false);
    });

    it('menyembunyikan komentar draf (seperti draf dari Asisten) meskipun nilai telah dipublikasikan', () => {
      expect(canStudentViewFeedback(true, true)).toBe(false);
    });

    it('menampilkan komentar hanya jika nilai dipublikasikan dan komentar bukan draf', () => {
      expect(canStudentViewFeedback(true, false)).toBe(true);
    });
  });
});
