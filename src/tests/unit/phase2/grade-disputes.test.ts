import { describe, it, expect } from 'vitest';
import {
  validateDisputeWindow,
  validateDisputeReason,
  checkDisputeHourlyLimit,
  canWithdrawDispute,
  validateDisputeEvidence,
  evaluateDisputeDecision,
} from '@/lib/akademik/dispute-utils';

describe('SIAJAR Bagian 9.4: Sanggah Nilai oleh Mahasiswa (Grade Disputes)', () => {
  describe('1. Validasi Batas Waktu Sanggahan (dispute_window_days)', () => {
    const fixedNow = new Date('2026-10-20T10:00:00Z');

    it('mengizinkan pengajuan sanggahan dalam rentang 7 hari sejak nilai dipublikasikan', () => {
      // Dipublikasikan 3 hari yang lalu
      const publishedAt = new Date(fixedNow.getTime() - 3 * 24 * 3600 * 1000).toISOString();
      const res = validateDisputeWindow(publishedAt, 7, fixedNow);

      expect(res.valid).toBe(true);
      expect(res.remainingDays).toBe(4);
    });

    it('menolak pengajuan sanggahan jika telah melewati batas 7 hari dengan pesan yang tepat', () => {
      // Dipublikasikan 8 hari yang lalu
      const publishedAt = new Date(fixedNow.getTime() - 8 * 24 * 3600 * 1000).toISOString();
      const res = validateDisputeWindow(publishedAt, 7, fixedNow);

      expect(res.valid).toBe(false);
      expect(res.error).toBe('Batas pengajuan sanggahan sudah lewat.');
    });

    it('menolak tanggal publikasi yang tidak valid', () => {
      const res = validateDisputeWindow('bukan-tanggal-valid', 7, fixedNow);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('tidak valid');
    });
  });

  describe('2. Validasi Alasan Sanggahan (Minimal 30 Karakter)', () => {
    it('menerima alasan yang memiliki 30 karakter atau lebih', () => {
      const validReason = 'Terdapat kekeliruan dalam penilaian nomor 3 terkait query JOIN SQL.';
      expect(validReason.length).toBeGreaterThanOrEqual(30);
      expect(validateDisputeReason(validReason).valid).toBe(true);
    });

    it('menolak alasan yang kurang dari 30 karakter dengan pesan instruktif', () => {
      const shortReason = 'Nilai saya salah';
      const res = validateDisputeReason(shortReason);

      expect(res.valid).toBe(false);
      expect(res.error).toBe('Alasan sanggahan minimal 30 karakter agar dapat ditinjau dosen.');
    });
  });

  describe('3. Pembatasan Laju Pengajuan (Rate Limit: Maks 5 per Jam)', () => {
    const now = 1700000000000;

    it('mengizinkan pengajuan jika frekuensi dalam 1 jam masih di bawah 5', () => {
      const timestamps = [
        now - 10 * 60 * 1000,
        now - 20 * 60 * 1000,
        now - 30 * 60 * 1000,
      ]; // 3 pengajuan
      const check = checkDisputeHourlyLimit(timestamps, now, 5);

      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(2);
    });

    it('menolak pengajuan jika kuota 5 per jam telah tercapai', () => {
      const timestamps = [
        now - 5 * 60 * 1000,
        now - 10 * 60 * 1000,
        now - 15 * 60 * 1000,
        now - 20 * 60 * 1000,
        now - 25 * 60 * 1000,
      ]; // 5 pengajuan
      const check = checkDisputeHourlyLimit(timestamps, now, 5);

      expect(check.allowed).toBe(false);
      expect(check.remaining).toBe(0);
    });

    it('mengabaikan pengajuan yang sudah lewat lebih dari 1 jam yang lalu', () => {
      const timestamps = [
        now - 2 * 3600 * 1000, // 2 jam lalu (expired)
        now - 3 * 3600 * 1000, // 3 jam lalu (expired)
        now - 15 * 60 * 1000,  // 15 menit lalu
      ];
      const check = checkDisputeHourlyLimit(timestamps, now, 5);

      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(4);
    });
  });

  describe('4. Penarikan Sanggahan oleh Mahasiswa', () => {
    it('mengizinkan penarikan hanya jika status masih "diajukan"', () => {
      expect(canWithdrawDispute('diajukan')).toBe(true);
    });

    it('melarang penarikan jika status sedang ditinjau, diterima, ditolak, atau sudah ditarik', () => {
      expect(canWithdrawDispute('ditinjau')).toBe(false);
      expect(canWithdrawDispute('diterima')).toBe(false);
      expect(canWithdrawDispute('ditolak')).toBe(false);
      expect(canWithdrawDispute('ditarik')).toBe(false);
    });
  });

  describe('5. Validasi Berkas Bukti Sanggahan', () => {
    it('menerima berkas PDF dan gambar di bawah 5 MB', () => {
      expect(validateDisputeEvidence({ sizeBytes: 2 * 1024 * 1024, mimeType: 'application/pdf' }).valid).toBe(true);
      expect(validateDisputeEvidence({ sizeBytes: 1 * 1024 * 1024, mimeType: 'image/png' }).valid).toBe(true);
      expect(validateDisputeEvidence({ sizeBytes: 500 * 1024, mimeType: 'image/jpeg' }).valid).toBe(true);
    });

    it('menolak berkas berukuran lebih dari 5 MB', () => {
      const res = validateDisputeEvidence({ sizeBytes: 6 * 1024 * 1024, mimeType: 'application/pdf' });
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Ukuran berkas bukti maksimal 5 MB.');
    });

    it('menolak format berkas selain PDF atau gambar', () => {
      const res = validateDisputeEvidence({ sizeBytes: 100 * 1024, mimeType: 'application/zip' });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('harus berupa PDF atau gambar');
    });
  });

  describe('6. Keputusan Sanggah Nilai dan Alur Revisi Buku Nilai Final', () => {
    it('menolak keputusan "ditolak" jika alasan kurang dari 20 karakter', () => {
      const res = evaluateDisputeDecision({
        decision: 'ditolak',
        response: 'Tidak relevan', // < 20 karakter
        isGradebookFinal: false,
      });

      expect(res.valid).toBe(false);
      expect(res.error).toBe('Keputusan tolak membutuhkan alasan penolakan minimal 20 karakter.');
    });

    it('menerima keputusan "ditolak" jika alasan minimal 20 karakter', () => {
      const res = evaluateDisputeDecision({
        decision: 'ditolak',
        response: 'Penilaian sudah sesuai rubrik kriteria pada penulisan sintaks.',
        isGradebookFinal: false,
      });

      expect(res.valid).toBe(true);
      expect(res.createsChangeRequestDraft).toBe(false);
    });

    it('menolak keputusan "diterima" tanpa skor baru yang valid', () => {
      const res = evaluateDisputeDecision({
        decision: 'diterima',
        response: 'Disetujui',
        newScore: undefined,
        isGradebookFinal: false,
      });

      expect(res.valid).toBe(false);
      expect(res.error).toBe('Keputusan terima membutuhkan skor baru yang valid (0 - 100).');
    });

    it('jika buku nilai belum final, keputusan "diterima" langsung menerapkan nilai tanpa draf revisi', () => {
      const res = evaluateDisputeDecision({
        decision: 'diterima',
        response: 'Koreksi perhitungan nomor 3 disetujui.',
        newScore: 88,
        isGradebookFinal: false,
      });

      expect(res.valid).toBe(true);
      expect(res.createsChangeRequestDraft).toBe(false);
      expect(res.draftChangeRequest).toBeNull();
    });

    it('jika buku nilai sudah final, keputusan "diterima" menghasilkan draf grade_change_requests', () => {
      const res = evaluateDisputeDecision({
        decision: 'diterima',
        response: 'Koreksi perhitungan nomor 3 disetujui setelah nilai akhir terbit.',
        newScore: 92,
        isGradebookFinal: true,
      });

      expect(res.valid).toBe(true);
      expect(res.createsChangeRequestDraft).toBe(true);
      expect(res.draftChangeRequest).toEqual({
        status: 'DRAF',
        reason: 'Hasil persetujuan sanggah nilai mahasiswa: Koreksi perhitungan nomor 3 disetujui setelah nilai akhir terbit.',
        newScore: 92,
      });
    });
  });
});
