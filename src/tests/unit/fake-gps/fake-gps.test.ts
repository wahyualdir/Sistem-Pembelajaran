import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock current active user (Dosen Pengampu)
const mockCurrentUser = {
  user: { id: 'usr-lec-01' },
  profile: { full_name: 'Dr. Dosen Pengampu Presensi' },
  roles: [{ id: 'r1', roles: { code: 'LECTURER' } }],
  activeRole: 'LECTURER',
};

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

import {
  checkAccuracyAnomaly,
  checkSpeedJumpAnomaly,
  checkIdenticalCoordinatesAnomaly,
  checkIpLocationMismatch,
  evaluateGpsAttendanceIntegrity,
} from '@/modules/academic/attendance-gps-heuristic';
import {
  submitMultiFactorAttendanceAction,
  verifyAttendanceAction,
  listAttendanceAnomaliesAction,
} from '@/modules/academic/attendance-actions';
import { NilaiStore } from '@/features/nilai/nilai-store';

describe('Deteksi Lokasi Palsu pada Presensi GPS (Mock Location Detection)', () => {
  describe('1. Pengujian 4 Heuristik Integritas GPS', () => {
    it('Heuristik 1: Akurasi tidak wajar (< 1.0m atau > 500m)', () => {
      // Mock GPS software sering memberikan nilai akurasi 0.0m atau 0.5m
      const mockSoftware = checkAccuracyAnomaly(0.0);
      expect(mockSoftware.isAnomaly).toBe(true);
      expect(mockSoftware.reason).toContain('< 1.0m');

      // Akurasi menara seluler BTS terlalu jauh (> 500m)
      const distantTower = checkAccuracyAnomaly(750);
      expect(distantTower.isAnomaly).toBe(true);
      expect(distantTower.reason).toContain('> 500m');

      // Akurasi ponsel normal di area terbuka (10m - 25m)
      const normalPhone = checkAccuracyAnomaly(14.5);
      expect(normalPhone.isAnomaly).toBe(false);
    });

    it('Heuristik 2: Loncatan kecepatan mustahil (> 50 km dalam < 30 menit atau kecepatan > 100 km/jam)', () => {
      const now = new Date('2026-10-16T10:00:00Z');
      const fifteenMinsAgo = new Date('2026-10-16T09:45:00Z');

      // Titik A: Pekanbaru (-0.5071, 101.4478)
      // Titik B: Dumai (-1.6800, 101.4500) -> Jarak ~130 km dalam 15 menit
      const jumpAnomaly = checkSpeedJumpAnomaly(
        { lat: 1.6800, lng: 101.4500, recordedAt: now },
        { lat: 0.5071, lng: 101.4478, recordedAt: fifteenMinsAgo }
      );

      expect(jumpAnomaly.isAnomaly).toBe(true);
      expect(jumpAnomaly.reason).toContain('Perpindahan posisi mustahil');
      expect(jumpAnomaly.speedKmH).toBeGreaterThan(100);

      // Perjalanan wajar dalam kota: 2 km dalam 15 menit (~8 km/jam jalan/motor santai)
      const normalMovement = checkSpeedJumpAnomaly(
        { lat: 0.5100, lng: 101.4480, recordedAt: now },
        { lat: 0.5071, lng: 101.4478, recordedAt: fifteenMinsAgo }
      );
      expect(normalMovement.isAnomaly).toBe(false);
    });

    it('Heuristik 3: Koordinat identik presisi 6 desimal antar mahasiswa (tanpa jitter sensor alami)', () => {
      const sessionRecords = [
        { lat: -6.208801, lng: 106.845602, studentId: 'std-other-1', studentName: 'Mahasiswa B' },
      ];

      // Mahasiswa A mengirimkan koordinat yang sama persis hingga 6 angka di belakang koma
      const identicalCheck = checkIdenticalCoordinatesAnomaly(
        { lat: -6.208801, lng: 106.845602, studentId: 'std-cur-1' },
        sessionRecords
      );

      expect(identicalCheck.isAnomaly).toBe(true);
      expect(identicalCheck.reason).toContain('Koordinat GPS identik hingga 6 digit');

      // Koordinat berbeda secara wajar karena jitter osilasi GPS alami
      const naturalNoiseCheck = checkIdenticalCoordinatesAnomaly(
        { lat: -6.208845, lng: 106.845638, studentId: 'std-cur-1' },
        sessionRecords
      );
      expect(naturalNoiseCheck.isAnomaly).toBe(false);
    });

    it('Heuristik 4: Ketidaksesuaian IP dan Lokasi GPS (Rough IP-location mismatch)', () => {
      // IP terindikasi VPN / proxy anonim
      const vpnCheck = checkIpLocationMismatch('198.51.100.42 (vpn-node)', -6.2088, 106.8456);
      expect(vpnCheck.isAnomaly).toBe(true);
      expect(vpnCheck.reason).toContain('VPN/Proxy');

      // Koordinat luar negeri (misal benua Eropa 52.5, 13.4) tapi mengaku IP kampus lokal
      const remoteAbroadCheck = checkIpLocationMismatch('192.168.1.50', 52.52, 13.405);
      expect(remoteAbroadCheck.isAnomaly).toBe(true);
      expect(remoteAbroadCheck.reason).toContain('luar negeri');

      // IP kampus normal dengan koordinat lokal
      const normalCheck = checkIpLocationMismatch('192.168.1.50', -6.2088, 106.8456);
      expect(normalCheck.isAnomaly).toBe(false);
    });

    it('Evaluator terpadu menghasilkan evaluasi integritas presensi lengkap', () => {
      const evalResult = evaluateGpsAttendanceIntegrity({
        studentId: 'std-test-eval',
        userLat: -6.2088,
        userLng: 106.8456,
        userAccuracy: 0.0, // Anomali
      });

      expect(evalResult.needsVerification).toBe(true);
      expect(evalResult.flags.unnaturalAccuracy).toBe(true);
      expect(evalResult.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('2. Prinsip Non-Punitive & Penandaan "Perlu diverifikasi"', () => {
    it('presensi mahasiswa TIDAK ditolak otomatis saat anomali, melainkan ditandai perlu diverifikasi', async () => {
      const store = (globalThis as any).__siajarPresensi;
      const testSessionId = 'ses-gps-test-01';

      // Pastikan ada sesi aktif
      if (!store.sessions.some((s: any) => s.id === testSessionId)) {
        store.sessions.push({
          id: testSessionId,
          class_id: 'c0000000-0000-0000-0000-000000000001',
          meeting_number: 2,
          title: 'Praktikum Geofencing & GPS Sensor',
          date: new Date().toISOString().split('T')[0],
          start_time: '08:00',
          end_time: '11:00',
          code: '123456',
          is_open: true,
          location_lat: -6.2088,
          location_lng: 106.8456,
          location_radius: 100,
          methods: ['LOCATION_GPS'],
        });
      }

      // Kirim presensi dengan akurasi 0.0m (terindikasi mock location)
      const res = await submitMultiFactorAttendanceAction({
        sessionId: testSessionId,
        method: 'LOCATION_GPS',
        userLat: -6.2088,
        userLng: 106.8456,
        userAccuracy: 0.0,
      });

      expect(res.ok).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.needs_verification).toBe(true);
      expect(res.data?.verification_status).toBe('MENUNGGU');
      expect(res.data?.verification_reason).toContain('Akurasi GPS tidak wajar');
      expect(res.data?.status).toBe('HADIR'); // Tidak langsung dijatuhi penalti Alpa
    });
  });

  describe('3. Verifikasi Pengajar & Kepatuhan Aturan A2', () => {
    it('dosen atau asdos dapat memverifikasi presensi sah atau menolak menjadi Alpa dengan audit trail', async () => {
      const anomalies = await listAttendanceAnomaliesAction();
      expect(anomalies.length).toBeGreaterThan(0);

      const targetRecord = anomalies[0];
      const verifyRes = await verifyAttendanceAction({
        recordId: targetRecord.id,
        decision: 'DISETUJUI',
        note: 'Mahasiswa sudah mengonfirmasi hadir langsung di baris depan kelas.',
      });

      expect(verifyRes.ok).toBe(true);

      const store = (globalThis as any).__siajarPresensi;
      const updated = store.records.find((r: any) => r.id === targetRecord.id);
      expect(updated.needs_verification).toBe(false);
      expect(updated.verification_status).toBe('DISETUJUI');

      // Periksa pencatatan ke audit trail
      const logs = NilaiStore.getLogAudit();
      const audit = logs.find((l) => l.entitasId === targetRecord.id);
      expect(audit).toBeDefined();
      expect(audit?.keterangan).toContain('DISETUJUI');
    });
  });
});
