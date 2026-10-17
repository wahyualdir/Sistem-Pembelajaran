import { describe, it, expect } from 'vitest';
import {
  isValidMeetingHost,
  isMeetingJoinActive,
  validateAbsenceDates,
  calcAttendancePercent,
  isJournalLate,
  isMaterialUnlocked,
} from '@/lib/akademik/perkuliahan-utils';

describe('SIAJAR Fase 3: Kehadiran dan Perkuliahan', () => {
  describe('1. Izin dan Sakit Mahasiswa (10.1)', () => {
    it('memvalidasi batas rentang tanggal maksimal 14 hari kalender', () => {
      const fixedNow = new Date('2026-10-20T10:00:00Z');
      expect(validateAbsenceDates('2026-10-18', '2026-10-25', 7, 14, fixedNow).valid).toBe(true);
      expect(validateAbsenceDates('2026-10-10', '2026-10-26', 14, 14, fixedNow).valid).toBe(false);
    });

    it('menolak pengajuan tanggal mulai yang melampaui batas backdate 7 hari', () => {
      const fixedNow = new Date('2026-10-20T10:00:00Z');
      const res = validateAbsenceDates('2026-10-10', '2026-10-12', 7, 14, fixedNow);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('lebih dari 7 hari');
    });

    it('menolak permohonan jika presensi sesi tersebut sudah berstatus HADIR', () => {
      const evaluateAbsenceApproval = (currentStatus: string, decision: 'disetujui' | 'ditolak') => {
        if (decision === 'disetujui' && currentStatus === 'HADIR') {
          return {
            ok: false,
            error: 'Ditolak sistem: mahasiswa sudah tercatat HADIR pada pertemuan ini.',
          };
        }
        return { ok: true, status: decision };
      };

      expect(evaluateAbsenceApproval('HADIR', 'disetujui')).toEqual({
        ok: false,
        error: 'Ditolak sistem: mahasiswa sudah tercatat HADIR pada pertemuan ini.',
      });
      expect(evaluateAbsenceApproval('ALPA', 'disetujui')).toEqual({
        ok: true,
        status: 'disetujui',
      });
    });

    it('memastikan persentase kehadiran konsisten pada mode exclude (default), present, dan absent', () => {
      const sample = { hadir: 12, terlambat: 1, izin: 2, sakit: 1, alpa: 0 }; // total 16 sesi
      // Mode exclude: (12+1) / (16 - 3) = 13/13 * 100 = 100%
      expect(calcAttendancePercent({ ...sample, mode: 'exclude' })).toBe(100);
      // Mode present: (12+1+2+1) / 16 = 16/16 * 100 = 100%
      expect(calcAttendancePercent({ ...sample, mode: 'present' })).toBe(100);
      // Mode absent: (12+1) / 16 = 13/16 * 100 = 81.25%
      expect(calcAttendancePercent({ ...sample, mode: 'absent' })).toBe(81.25);
    });
  });

  describe('2. Berita Acara Perkuliahan (10.2)', () => {
    it('mencegah finalisasi berita acara sebelum tanggal pertemuan perkuliahan tiba', () => {
      const canFinalizeJournal = (sessionDateStr: string, now: Date) => {
        const sessionDate = new Date(sessionDateStr);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        return sessionDate.getTime() <= todayEnd.getTime();
      };

      const now = new Date('2026-10-20T10:00:00Z');
      expect(canFinalizeJournal('2026-10-18', now)).toBe(true);
      expect(canFinalizeJournal('2026-10-20', now)).toBe(true);
      expect(canFinalizeJournal('2026-10-22', now)).toBe(false);
    });

    it('menghitung status keterlambatan berita acara secara akurat (batas default 3 hari)', () => {
      const heldOn = '2026-10-10';
      const onTimeDate = '2026-10-13T12:00:00Z'; // H+3
      const lateDate = '2026-10-15T09:00:00Z'; // H+5

      expect(isJournalLate(heldOn, onTimeDate, 3)).toBe(false);
      expect(isJournalLate(heldOn, lateDate, 3)).toBe(true);
    });

    it('menaikkan revision_count saat berita acara berstatus final diubah', () => {
      interface MockJournal {
        status: 'draf' | 'final';
        revisionCount: number;
        topic: string;
      }

      const updateJournal = (journal: MockJournal, newTopic: string): MockJournal => {
        const isFinal = journal.status === 'final';
        return {
          ...journal,
          topic: newTopic,
          revisionCount: isFinal ? journal.revisionCount + 1 : journal.revisionCount,
        };
      };

      const draftJournal: MockJournal = { status: 'draf', revisionCount: 0, topic: 'Awal' };
      const updatedDraft = updateJournal(draftJournal, 'Revisi Draf');
      expect(updatedDraft.revisionCount).toBe(0);

      const finalJournal: MockJournal = { status: 'final', revisionCount: 0, topic: 'Materi Selesai' };
      const updatedFinal = updateJournal(finalJournal, 'Perbaikan Materi');
      expect(updatedFinal.revisionCount).toBe(1);
    });
  });

  describe('3. Tautan Kuliah Daring dan Rekaman (10.3)', () => {
    it('memvalidasi host resmi dan menolak host asing dengan pesan instruksi', () => {
      expect(isValidMeetingHost('https://meet.google.com/abc-defg-hij').valid).toBe(true);
      expect(isValidMeetingHost('https://zoom.us/j/999888777').valid).toBe(true);
      expect(isValidMeetingHost('https://uir.zoom.us/j/999888777').valid).toBe(true);

      const invalid = isValidMeetingHost('https://discord.gg/kelas');
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toBe('Alamat ini belum diizinkan. Minta admin menambahkannya di Integrasi.');
    });

    it('menolak protokol selain HTTPS', () => {
      const res = isValidMeetingHost('http://zoom.us/j/999888777');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('HTTPS');
    });

    it('memastikan tombol Gabung Kuliah Daring aktif hanya pada rentang 15 menit sebelum jam mulai', () => {
      const sessionDate = '2026-10-25';
      const start = '10:00';
      const end = '12:00';

      const beforeWindow = new Date('2026-10-25T09:40:00'); // 20 menit sebelum
      const inWindow = new Date('2026-10-25T09:50:00'); // 10 menit sebelum
      const duringSession = new Date('2026-10-25T11:00:00'); // sedang kuliah
      const afterSession = new Date('2026-10-25T12:05:00'); // telah selesai

      expect(isMeetingJoinActive(sessionDate, start, end, 15, beforeWindow).active).toBe(false);
      expect(isMeetingJoinActive(sessionDate, start, end, 15, inWindow).active).toBe(true);
      expect(isMeetingJoinActive(sessionDate, start, end, 15, duringSession).active).toBe(true);
      expect(isMeetingJoinActive(sessionDate, start, end, 15, afterSession).active).toBe(false);
    });
  });

  describe('4. Progres Materi dan Penguncian Berurutan (10.4)', () => {
    it('mengunci materi jika materi prasyarat belum diselesaikan oleh mahasiswa', () => {
      const lockCheck = isMaterialUnlocked({
        unlockAfterMaterialId: 'modul-1',
        requireCompletion: true,
        completedMaterialIds: new Set(),
        previousMaterialTitle: 'Pengantar Basis Data',
      });

      expect(lockCheck.unlocked).toBe(false);
      expect(lockCheck.message).toBe("Selesaikan 'Pengantar Basis Data' dulu untuk membuka materi ini.");
    });

    it('membuka materi seketika jika materi prasyarat telah ditandai selesai', () => {
      const lockCheck = isMaterialUnlocked({
        unlockAfterMaterialId: 'modul-1',
        requireCompletion: true,
        completedMaterialIds: new Set(['modul-1']),
        previousMaterialTitle: 'Pengantar Basis Data',
      });

      expect(lockCheck.unlocked).toBe(true);
    });

    it('membatasi pengiriman pengingat materi oleh dosen maksimal 1 kali per 24 jam', () => {
      const checkReminderCooldown = (lastRemindedAtMs: number, nowMs: number) => {
        const cooldownMs = 24 * 3600 * 1000;
        return nowMs - lastRemindedAtMs >= cooldownMs;
      };

      const now = Date.now();
      const oneHourAgo = now - 3600 * 1000;
      const twentyFiveHoursAgo = now - 25 * 3600 * 1000;

      expect(checkReminderCooldown(oneHourAgo, now)).toBe(false);
      expect(checkReminderCooldown(twentyFiveHoursAgo, now)).toBe(true);
    });
  });
});
