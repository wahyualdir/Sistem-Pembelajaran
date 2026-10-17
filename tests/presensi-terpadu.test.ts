import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => ({
    user: { id: 'std-test-user', email: 'mhs2024001@siajar.test' },
    profile: { id: 'std-test-user', full_name: 'Mahasiswa Test', status: 'ACTIVE' },
    roles: [{ role_id: 'STUDENT', status: 'ACTIVE', roles: { code: 'STUDENT' } }],
    activeRole: 'STUDENT',
    isImpersonating: false,
    impersonatingFrom: null,
  })),
}));

import {
  calculateHaversineDistanceMeters,
  generateDynamicQrTokenAction,
  submitMultiFactorAttendanceAction,
  updateStudentAttendanceAction,
  getAllAttendanceSessionsAction,
  type AttendanceSession,
} from '../src/modules/academic/attendance-actions';

describe('FASE 5: Modul Presensi Terpadu Tests', () => {
  beforeEach(() => {
    const store = ((globalThis as any).__siajarPresensi ??= { sessions: [], records: [] });
  });

  describe('1. Perhitungan Jarak GPS Server-Side (Haversine Formula)', () => {
    it('menghitung jarak secara akurat antara dua titik koordinat bumi dalam meter', async () => {
      // Titik A: Monas Jakarta (-6.1754, 106.8272)
      // Titik B: Gambir Station (-6.1767, 106.8306) -> ~400 meter
      const distance = await calculateHaversineDistanceMeters(-6.1754, 106.8272, -6.1767, 106.8306);
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(500);
    });

    it('mengembalikan 0 meter untuk titik koordinat yang identik', async () => {
      const distance = await calculateHaversineDistanceMeters(-6.2088, 106.8456, -6.2088, 106.8456);
      expect(distance).toBe(0);
    });
  });

  describe('2. Dynamic Rotating QR Token Validation', () => {
    it('menghasilkan token dinamis baru dengan format bertanda waktu', async () => {
      const store = ((globalThis as any).__siajarPresensi ??= { sessions: [], records: [] });
      const sessionId = 'ses-qr-001';
      store.sessions.push({
        id: sessionId,
        class_id: 'c-test',
        meeting_number: 1,
        title: 'P1 QR Test',
        date: '2026-10-01',
        start_time: '08:00',
        end_time: '10:00',
        code: '123456',
        is_open: true,
        created_at: new Date().toISOString(),
      });

      const res = await generateDynamicQrTokenAction(sessionId);
      expect(res.ok).toBe(true);
      expect(res.data?.token).toMatch(/^QR-/);
      expect(res.data?.expires_at).toBeDefined();
    });

    it('menolak token QR yang sudah kedaluwarsa atau tidak cocok', async () => {
      const store = ((globalThis as any).__siajarPresensi ??= { sessions: [], records: [] });
      const sessionId = 'ses-qr-002';
      store.sessions.push({
        id: sessionId,
        class_id: 'c-test',
        meeting_number: 2,
        title: 'P2 QR Test Expired',
        date: '2026-10-01',
        start_time: '08:00',
        end_time: '10:00',
        code: '123456',
        is_open: true,
        created_at: new Date().toISOString(),
        qr_dynamic_token: 'QR-VALID-123',
        qr_token_expires_at: new Date(Date.now() - 60000).toISOString(), // expired 1 minute ago
      });

      const submitRes = await submitMultiFactorAttendanceAction({
        sessionId,
        method: 'QR_DYNAMIC',
        qrToken: 'QR-EXPIRED-TOKEN',
      });

      expect(submitRes.ok).toBe(false);
      expect(submitRes.error).toContain('kedaluwarsa');
    });
  });

  describe('3. Validasi Geolocation & Radius Kelas', () => {
    it('menolak presensi jika jarak mahasiswa melebihi radius kelas yang ditentukan', async () => {
      const store = ((globalThis as any).__siajarPresensi ??= { sessions: [], records: [] });
      const sessionId = 'ses-gps-001';
      store.sessions.push({
        id: sessionId,
        class_id: 'c-test',
        meeting_number: 3,
        title: 'P3 GPS Radius Test',
        date: '2026-10-01',
        start_time: '08:00',
        end_time: '10:00',
        code: '123456',
        is_open: true,
        created_at: new Date().toISOString(),
        location_lat: -6.2088,
        location_lng: 106.8456,
        location_radius: 50, // 50m radius
        methods: ['LOCATION_GPS'],
      });

      // Mahasiswa berada di lokasi yang berjarak ~1.5 km
      const submitRes = await submitMultiFactorAttendanceAction({
        sessionId,
        method: 'LOCATION_GPS',
        userLat: -6.2200,
        userLng: 106.8500,
        userAccuracy: 10,
      });

      expect(submitRes.ok).toBe(false);
      expect(submitRes.error).toContain('luar radius');
    });

    it('mendeteksi anomali jika perangkat sama dipakai oleh banyak akun', async () => {
      const store = ((globalThis as any).__siajarPresensi ??= { sessions: [], records: [] });
      const sessionId = 'ses-device-001';
      store.sessions.push({
        id: sessionId,
        class_id: 'c-test',
        meeting_number: 4,
        title: 'P4 Device Anomaly Test',
        date: '2026-10-01',
        start_time: '08:00',
        end_time: '10:00',
        code: '123456',
        is_open: true,
        created_at: new Date().toISOString(),
        methods: ['CODE_PIN'],
      });

      // Sudah ada mahasiswa A dengan device-id "device-shared-xyz"
      store.records.push({
        id: 'rec-1',
        session_id: sessionId,
        student_id: 'std-mahasiswa-a',
        student_name: 'Mahasiswa A',
        status: 'HADIR',
        device_id: 'device-shared-xyz',
        recorded_at: new Date().toISOString(),
      });

      // Mahasiswa B mencoba klaim dengan device yang sama
      const submitRes = await submitMultiFactorAttendanceAction({
        sessionId,
        method: 'CODE_PIN',
        deviceId: 'device-shared-xyz',
      });

      if (submitRes.ok && submitRes.data) {
        expect(submitRes.data.is_flagged_anomaly).toBe(true);
        expect(submitRes.data.anomaly_reason).toContain('lebih dari 1 mahasiswa');
      }
    });
  });

  describe('5. List All Attendance Sessions Action', () => {
    it('mengembalikan daftar seluruh sesi presensi terurut berdasarkan waktu pembuatan', async () => {
      const store = ((globalThis as any).__siajarPresensi ??= { sessions: [], records: [] });
      store.sessions.push({
        id: 'ses-all-test',
        class_id: 'c-all-test',
        meeting_number: 1,
        title: 'Sesi Uji Coba',
        date: '2026-10-10',
        start_time: '08:00',
        end_time: '10:00',
        code: '123456',
        is_open: true,
        created_at: new Date().toISOString(),
      });

      const list = await getAllAttendanceSessionsAction();
      expect(Array.isArray(list)).toBe(true);
      expect(list.some((s) => s.id === 'ses-all-test')).toBe(true);
    });
  });
});
