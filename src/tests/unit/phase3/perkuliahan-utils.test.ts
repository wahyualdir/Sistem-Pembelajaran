import { describe, it, expect } from 'vitest';
import {
  isValidMeetingHost,
  isMeetingJoinActive,
  validateAbsenceDates,
  calcAttendancePercent,
  isJournalLate,
  isMaterialUnlocked,
} from '@/lib/akademik/perkuliahan-utils';

describe('SIAJAR Fase 3: Utilitas Perkuliahan & Kehadiran', () => {
  describe('1. Validasi URL Kuliah Daring dan Rekaman (10.3)', () => {
    it('mengizinkan domain resmi kuliah daring (Google Meet, Zoom, Teams, Jitsi) dengan HTTPS', () => {
      expect(isValidMeetingHost('https://meet.google.com/abc-defg-hij').valid).toBe(true);
      expect(isValidMeetingHost('https://zoom.us/j/1234567890').valid).toBe(true);
      expect(isValidMeetingHost('https://uir-ac-id.zoom.us/j/1234567890').valid).toBe(true);
      expect(isValidMeetingHost('https://teams.microsoft.com/l/meetup-join/123').valid).toBe(true);
      expect(isValidMeetingHost('https://meet.jit.si/kelas-pemrograman').valid).toBe(true);
    });

    it('menolak URL kuliah daring yang tidak memakai protokol HTTPS', () => {
      const res = isValidMeetingHost('http://meet.google.com/abc-defg-hij');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('HTTPS');
    });

    it('menolak domain yang tidak terdaftar di daftar putih integrasi', () => {
      const res = isValidMeetingHost('https://unknown-meeting-app.com/room123');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Alamat ini belum diizinkan. Minta admin menambahkannya di Integrasi.');
    });

    it('mengizinkan YouTube dan Google Drive hanya untuk tautan rekaman perkuliahan', () => {
      // Untuk meeting biasa -> ditolak
      expect(isValidMeetingHost('https://youtube.com/watch?v=123', false).valid).toBe(false);
      expect(isValidMeetingHost('https://youtu.be/123', false).valid).toBe(false);
      expect(isValidMeetingHost('https://drive.google.com/file/d/123', false).valid).toBe(false);

      // Untuk rekaman -> diizinkan
      expect(isValidMeetingHost('https://youtube.com/watch?v=123', true).valid).toBe(true);
      expect(isValidMeetingHost('https://youtu.be/123', true).valid).toBe(true);
      expect(isValidMeetingHost('https://drive.google.com/file/d/123', true).valid).toBe(true);
    });
  });

  describe('2. Jendela Aktif Tombol Gabung Kuliah Daring (10.3)', () => {
    it('mengaktifkan tombol hanya pada jendela 15 menit sebelum jam mulai hingga jam selesai', () => {
      const sessionDate = '2026-10-20';
      const startTime = '08:00';
      const endTime = '10:30';

      // Pukul 07.40 (20 menit sebelum mulai) -> belum aktif
      const timeEarly = new Date('2026-10-20T07:40:00');
      const earlyCheck = isMeetingJoinActive(sessionDate, startTime, endTime, 15, timeEarly);
      expect(earlyCheck.active).toBe(false);
      expect(earlyCheck.reason).toContain('menit sebelum perkuliahan');

      // Pukul 07.46 (14 menit sebelum mulai) -> aktif
      const timeWindow = new Date('2026-10-20T07:46:00');
      expect(isMeetingJoinActive(sessionDate, startTime, endTime, 15, timeWindow).active).toBe(true);

      // Pukul 09.15 (sedang berlangsung) -> aktif
      const timeDuring = new Date('2026-10-20T09:15:00');
      expect(isMeetingJoinActive(sessionDate, startTime, endTime, 15, timeDuring).active).toBe(true);

      // Pukul 10.31 (setelah selesai) -> nonaktif
      const timeEnded = new Date('2026-10-20T10:31:00');
      const endCheck = isMeetingJoinActive(sessionDate, startTime, endTime, 15, timeEnded);
      expect(endCheck.active).toBe(false);
      expect(endCheck.reason).toContain('telah berakhir');
    });
  });

  describe('3. Validasi Rentang Tanggal Izin dan Sakit Mahasiswa (10.1)', () => {
    const fixedNow = new Date('2026-10-20T10:00:00Z');

    it('mengizinkan rentang tanggal hingga maksimal 14 hari', () => {
      const res = validateAbsenceDates('2026-10-18', '2026-10-25', 7, 14, fixedNow);
      expect(res.valid).toBe(true);
    });

    it('menolak permohonan dengan rentang melebihi 14 hari', () => {
      const res = validateAbsenceDates('2026-10-10', '2026-10-26', 14, 14, fixedNow); // 17 hari
      expect(res.valid).toBe(false);
      expect(res.error).toContain('maksimal 14 hari');
    });

    it('menolak tanggal mulai yang lebih mundur dari batas backdate (default 7 hari)', () => {
      // 2026-10-20 dikurangi 10 hari = 2026-10-10 (melebihi 7 hari)
      const res = validateAbsenceDates('2026-10-10', '2026-10-12', 7, 14, fixedNow);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('lebih dari 7 hari yang lalu');
    });

    it('menolak jika tanggal selesai lebih awal dari tanggal mulai', () => {
      const res = validateAbsenceDates('2026-10-20', '2026-10-18', 7, 14, fixedNow);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('tidak boleh lebih awal');
    });
  });

  describe('4. Perhitungan Persentase Kehadiran 3 Mode Kebijakan (10.1)', () => {
    // 16 pertemuan: 10 hadir, 2 terlambat, 2 izin, 1 sakit, 1 alpa
    const sampleCounts = {
      hadir: 10,
      terlambat: 2,
      izin: 2,
      sakit: 1,
      alpa: 1,
    };

    it('mode exclude (bawaan): izin & sakit dikeluarkan dari pembagi', () => {
      // Pembagi = 16 - (2+1) = 13. Hadir = 10+2 = 12. Persen = 12/13 * 100 = 92.31%
      const percent = calcAttendancePercent({ ...sampleCounts, mode: 'exclude' });
      expect(percent).toBe(92.31);
    });

    it('mode present: izin & sakit dihitung sebagai hadir', () => {
      // Pembagi = 16. Hadir = 10+2+2+1 = 15. Persen = 15/16 * 100 = 93.75%
      const percent = calcAttendancePercent({ ...sampleCounts, mode: 'present' });
      expect(percent).toBe(93.75);
    });

    it('mode absent: izin & sakit dihitung sebagai tidak hadir', () => {
      // Pembagi = 16. Hadir = 10+2 = 12. Persen = 12/16 * 100 = 75%
      const percent = calcAttendancePercent({ ...sampleCounts, mode: 'absent' });
      expect(percent).toBe(75);
    });

    it('mengembalikan 100% jika belum ada pertemuan yang dilaksanakan', () => {
      const percent = calcAttendancePercent({ hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0 });
      expect(percent).toBe(100);
    });
  });

  describe('5. Kepatuhan Waktu Berita Acara Dosen (10.2)', () => {
    it('menandai tepat waktu bila difinalkan dalam 3 hari setelah tanggal perkuliahan', () => {
      const heldOn = '2026-10-15';
      const finalizedOnTime = '2026-10-17T15:00:00Z'; // H+2
      expect(isJournalLate(heldOn, finalizedOnTime, 3)).toBe(false);
    });

    it('menandai is_late = true bila difinalkan lebih dari 3 hari setelah perkuliahan', () => {
      const heldOn = '2026-10-15';
      const finalizedLate = '2026-10-20T08:00:00Z'; // H+5
      expect(isJournalLate(heldOn, finalizedLate, 3)).toBe(true);
    });
  });

  describe('6. Penguncian Berurutan Materi Perkuliahan (10.4)', () => {
    it('membuka materi bebas syarat prasyarat', () => {
      const status = isMaterialUnlocked({
        unlockAfterMaterialId: null,
        requireCompletion: false,
        completedMaterialIds: new Set(),
      });
      expect(status.unlocked).toBe(true);
    });

    it('mengunci materi jika materi prasyarat belum diselesaikan oleh mahasiswa', () => {
      const status = isMaterialUnlocked({
        unlockAfterMaterialId: 'mat-001',
        requireCompletion: true,
        completedMaterialIds: new Set(['mat-000']),
        previousMaterialTitle: 'Pengantar Basis Data',
      });
      expect(status.unlocked).toBe(false);
      expect(status.message).toBe("Selesaikan 'Pengantar Basis Data' dulu untuk membuka materi ini.");
    });

    it('membuka materi jika materi prasyarat telah selesai', () => {
      const status = isMaterialUnlocked({
        unlockAfterMaterialId: 'mat-001',
        requireCompletion: true,
        completedMaterialIds: new Set(['mat-001']),
        previousMaterialTitle: 'Pengantar Basis Data',
      });
      expect(status.unlocked).toBe(true);
    });
  });
});
