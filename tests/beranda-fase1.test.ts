import { describe, it, expect } from 'vitest';
import {
  evaluateBannerConditions,
  calculateCountdown,
  formatJakartaDate,
} from '../src/modules/academic/home-utils';

describe('FASE 1: Redesain Beranda SIAJAR ("Hari Ini + Kelas Saya")', () => {
  const baseTime = new Date('2026-10-08T08:00:00.000Z');

  describe('1. Logika Prioritas Banner Aksi (5 Kondisi)', () => {
    it('Prioritas 1: Menampilkan Ujian Aktif di posisi utama saat terbuka meskipun ada kondisi lain', () => {
      const result = evaluateBannerConditions({
        openExams: [
          {
            id: 'exam-01',
            title: 'Kuis Evaluasi Algoritma Greedy',
            classTitle: 'Struktur Data (TI-201)',
            dueAt: new Date(baseTime.getTime() + 2 * 3600 * 1000).toISOString(),
            hasAttempt: false,
          },
        ],
        openAttendance: {
          id: 'att-01',
          classTitle: 'Pemrograman Web Lanjut',
          method: 'QR Dinamis',
          closeTime: '08:30 WIB',
        },
        urgentAssignments: [
          {
            id: 'asg-01',
            title: 'Tugas RBAC',
            classTitle: 'Pemrograman Web Lanjut',
            dueAt: new Date(baseTime.getTime() + 4 * 3600 * 1000).toISOString(),
          },
        ],
        now: baseTime,
      });

      expect(result.primary.priority).toBe(1);
      expect(result.primary.category).toBe('EXAM');
      expect(result.primary.title).toContain('Kuis Evaluasi Algoritma Greedy');
      expect(result.primary.buttonLabel).toBe('Mulai Ujian');
      expect(result.others.length).toBe(2);
      expect(result.totalActive).toBe(3);
    });

    it('Prioritas 2: Menampilkan Presensi Terbuka jika tidak ada ujian aktif', () => {
      const result = evaluateBannerConditions({
        openExams: [],
        openAttendance: {
          id: 'att-01',
          classTitle: 'Pemrograman Web Lanjut',
          method: 'Biometrik Passkey',
          closeTime: '09:00 WIB',
        },
        urgentAssignments: [
          {
            id: 'asg-01',
            title: 'Tugas Praktikum AI',
            classTitle: 'Kecerdasan Buatan',
            dueAt: new Date(baseTime.getTime() + 6 * 3600 * 1000).toISOString(),
          },
        ],
        now: baseTime,
      });

      expect(result.primary.priority).toBe(2);
      expect(result.primary.category).toBe('ATTENDANCE');
      expect(result.primary.title).toContain('Pemrograman Web Lanjut');
      expect(result.primary.buttonLabel).toBe('Absen Sekarang');
      expect(result.others.length).toBe(1);
      expect(result.totalActive).toBe(2);
    });

    it('Prioritas 3: Menampilkan Tugas < 24 jam jika tidak ada ujian dan tidak ada presensi terbuka', () => {
      const result = evaluateBannerConditions({
        openExams: [],
        openAttendance: null,
        urgentAssignments: [
          {
            id: 'asg-01',
            title: 'Tugas 04: Implementasi RBAC',
            classTitle: 'Pemrograman Web Lanjut',
            dueAt: new Date(baseTime.getTime() + 5 * 3600 * 1000).toISOString(),
          },
        ],
        upcomingClass: {
          id: 'cls-01',
          title: 'Basis Data',
          time: '13:00 - 15:30 WIB',
          room: 'Lab 1',
        },
        now: baseTime,
      });

      expect(result.primary.priority).toBe(3);
      expect(result.primary.category).toBe('ASSIGNMENT');
      expect(result.primary.title).toContain('Tugas 04: Implementasi RBAC');
      expect(result.primary.buttonLabel).toBe('Kerjakan');
    });

    it('Prioritas 4: Menampilkan Kelas Akan Datang jika tidak ada ujian, presensi, atau tugas mendesak', () => {
      const result = evaluateBannerConditions({
        openExams: [],
        openAttendance: null,
        urgentAssignments: [],
        upcomingClass: {
          id: 'cls-01',
          title: 'Pemrograman Web Lanjut',
          time: '08:00 - 10:30 WIB',
          room: 'Lab Komputer 2 (Hybrid)',
        },
        now: baseTime,
      });

      expect(result.primary.priority).toBe(4);
      expect(result.primary.category).toBe('CLASS_UPCOMING');
      expect(result.primary.title).toContain('Pemrograman Web Lanjut');
      expect(result.primary.buttonLabel).toBe('Lihat Kelas');
      expect(result.totalActive).toBe(1);
      expect(result.others.length).toBe(0);
    });

    it('Prioritas 5: Menampilkan pesan santai "Tidak ada yang mendesak hari ini" saat semua kosong', () => {
      const result = evaluateBannerConditions({
        openExams: [],
        openAttendance: null,
        urgentAssignments: [],
        upcomingClass: null,
        lastStudiedMaterial: {
          title: 'Modul 07: Auth Supabase',
          classTitle: 'Pemrograman Web Lanjut',
          href: '/classes',
        },
        now: baseTime,
      });

      expect(result.primary.priority).toBe(5);
      expect(result.primary.category).toBe('IDLE');
      expect(result.primary.title).toBe('Tidak ada yang mendesak hari ini');
      expect(result.primary.buttonLabel).toBe('Lanjut Belajar');
      expect(result.totalActive).toBe(0);
      expect(result.others.length).toBe(0);
    });
  });

  describe('2. Perhitungan Hitung Mundur Server (WIB)', () => {
    it('menghitung menit tersisa untuk tenggat di bawah 1 jam', () => {
      const target = new Date(baseTime.getTime() + 25 * 60 * 1000).toISOString();
      const res = calculateCountdown(target, baseTime);
      expect(res.text).toBe('25 menit lagi');
      expect(res.isUrgent).toBe(true);
    });

    it('menghitung jam tersisa untuk tenggat di bawah 24 jam', () => {
      const target = new Date(baseTime.getTime() + 4 * 3600 * 1000).toISOString();
      const res = calculateCountdown(target, baseTime);
      expect(res.text).toBe('4 jam lagi');
      expect(res.isUrgent).toBe(true);
    });

    it('menampilkan format "Besok" untuk tenggat 1 hari kemudian', () => {
      const target = new Date(baseTime.getTime() + 26 * 3600 * 1000).toISOString();
      const res = calculateCountdown(target, baseTime);
      expect(res.text).toContain('Besok');
      expect(res.isUrgent).toBe(false);
    });

    it('menampilkan status "Sudah lewat" jika waktu target telah berlalu', () => {
      const target = new Date(baseTime.getTime() - 10 * 60 * 1000).toISOString();
      const res = calculateCountdown(target, baseTime);
      expect(res.text).toBe('Sudah lewat');
      expect(res.isUrgent).toBe(true);
    });
  });

  describe('3. Format Zona Waktu Jakarta (WIB)', () => {
    it('memformat tanggal ke WIB dengan tepat', () => {
      const formatted = formatJakartaDate(baseTime, 'time');
      expect(formatted).toContain('WIB');
    });
  });
});
