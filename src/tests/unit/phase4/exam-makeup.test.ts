import { describe, it, expect } from 'vitest';
import {
  generateExamToken,
  calcCombinedExamScore,
  validateMakeupParticipation,
} from '@/lib/akademik/exam-utils';

describe('Token Masuk, Ujian Susulan, dan Remedial (11.2)', () => {
  describe('1. Validasi Token Masuk Ujian', () => {
    it('menghasilkan token 6 karakter tanpa karakter mirip 0/O, 1/I/L', () => {
      for (let i = 0; i < 100; i++) {
        const token = generateExamToken();
        expect(token.length).toBe(6);
        expect(token).not.toMatch(/[0O1IL]/);
      }
    });
  });

  describe('2. Pembatasan Hak Masuk Peserta Ujian Susulan & Remedial', () => {
    const allowedStudents = ['mhs-001', 'mhs-002', 'mhs-005'];

    it('mengizinkan seluruh mahasiswa pada ujian utama', () => {
      const res = validateMakeupParticipation('utama', 'mhs-999', allowedStudents);
      expect(res.allowed).toBe(true);
    });

    it('mengizinkan mahasiswa yang terdaftar pada ujian susulan', () => {
      const res = validateMakeupParticipation('susulan', 'mhs-001', allowedStudents);
      expect(res.allowed).toBe(true);
    });

    it('menolak mahasiswa yang TIDAK terdaftar pada ujian susulan', () => {
      const res = validateMakeupParticipation('susulan', 'mhs-999', allowedStudents);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('tidak terdaftar sebagai peserta ujian susulan');
    });

    it('mengizinkan mahasiswa yang terdaftar pada ujian remedial', () => {
      const res = validateMakeupParticipation('remedial', 'mhs-002', allowedStudents);
      expect(res.allowed).toBe(true);
    });

    it('menolak mahasiswa yang TIDAK terdaftar pada ujian remedial', () => {
      const res = validateMakeupParticipation('remedial', 'mhs-999', allowedStudents);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('tidak terdaftar sebagai peserta ujian remedial');
    });
  });

  describe('3. Perhitungan Skor Gabungan Remedial & Cap Nilai', () => {
    it('kebijakan tertinggi: memilih nilai tertinggi antara utama dan remedial (dengan cap)', () => {
      // Nilai utama 55, remedial 85, cap 70 -> remedial di-cap 70 -> hasil 70
      expect(calcCombinedExamScore(55, 85, 'tertinggi', 70)).toBe(70);

      // Nilai utama 75, remedial 65, cap 70 -> hasil tetap 75 (karena utama lebih tinggi)
      expect(calcCombinedExamScore(75, 65, 'tertinggi', 70)).toBe(75);
    });

    it('kebijakan ganti: mengganti nilai dengan remedial (dengan cap)', () => {
      // Nilai utama 50, remedial 90, cap 75 -> hasil 75
      expect(calcCombinedExamScore(50, 90, 'ganti', 75)).toBe(75);

      // Nilai remedial lebih rendah tetap menggantikan bila kebijakan ganti
      expect(calcCombinedExamScore(60, 50, 'ganti')).toBe(50);
    });

    it('kebijakan rata_rata: menghitung rata-rata nilai utama dan remedial (dengan cap)', () => {
      // Utama 40, remedial 80, cap 70 -> (40 + 70) / 2 = 55
      expect(calcCombinedExamScore(40, 80, 'rata_rata', 70)).toBe(55);
    });

    it('mengembalikan skor utama bila remedial bernilai null atau belum dikerjakan', () => {
      expect(calcCombinedExamScore(65, null, 'tertinggi', 70)).toBe(65);
    });
  });
});
