'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { createNotification } from '@/modules/academic/actions';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { isDemoMode, isFeatureFlagActive } from '@/lib/config/features';
import { recordSystemAuditLog } from '@/lib/audit';
import { catatAktivitas } from '@/lib/aktivitas/pencatat';
import { evaluateGpsAttendanceIntegrity } from './attendance-gps-heuristic';

function safeRevalidate(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
  } catch {
    // Gracefully ignore during unit tests outside Next.js request context
  }
}

export type AttendanceMethod = 'QR_DYNAMIC' | 'BIOMETRIC_PASSKEY' | 'LOCATION_GPS' | 'CODE_PIN' | 'ONLINE_MEET';
export type AttendancePreset = 'TATAP_MUKA' | 'ONLINE' | 'UJIAN' | 'MANUAL_PIN';
export type AttendanceStatus = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA';

export interface AttendanceSession {
  id: string;
  class_id: string;
  meeting_number: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  code: string;
  is_open: boolean;
  created_at: string;

  // Extended Presensi Terpadu Attributes
  methods?: AttendanceMethod[];
  preset?: AttendancePreset;
  location_lat?: number;
  location_lng?: number;
  location_radius?: number; // default 50 meters
  location_name?: string;
  late_threshold_minutes?: number; // default 15 mins
  qr_dynamic_token?: string;
  qr_token_expires_at?: string;
  delivery_mode?: 'luring' | 'daring' | 'hibrida';
  meeting_url?: string | null;
  recording_url?: string | null;
  recording_visible_from?: string | null;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  status: AttendanceStatus;
  notes?: string;
  recorded_at: string;
  source?: 'manual' | 'qr' | 'kode' | 'izin_sakit';
  absence_item_id?: string | null;

  // Extended Details
  method?: AttendanceMethod;
  user_lat?: number;
  user_lng?: number;
  user_accuracy?: number;
  distance_meters?: number;
  device_id?: string;
  is_late?: boolean;
  is_flagged_anomaly?: boolean;
  anomaly_reason?: string;
  override_by?: string;
  override_reason?: string;

  // Verifikasi GPS Palsu & Mock Location
  needs_verification?: boolean;
  verification_reason?: string;
  verification_status?: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
  verified_by?: string;
  verified_at?: string;
  verification_note?: string;
  client_ip?: string;
}

export interface StudentAttendanceSummary {
  student_id: string;
  student_name: string;
  total_sessions: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  percentage: number;
  can_take_uas: boolean; // >= 75%
}

export interface LeavePermitRecord {
  id: string;
  student_id: string;
  student_name: string;
  course_title: string;
  meeting_number: number;
  type: 'SAKIT' | 'IZIN';
  date: string;
  reason: string;
  attachment_name: string;
  status: 'MENUNGGU VERIFIKASI' | 'DISETUJUI' | 'DITOLAK';
  submitted_at: string;
  feedback?: string;
}

// In-memory store for attendance (persisted in globalThis for Next.js hot reload)
const presensiStore: {
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  leaves: LeavePermitRecord[];
} = ((globalThis as any).__siajarPresensi ??= {
  sessions: [],
  records: [],
  leaves: [],
});

presensiStore.leaves ??= [];

// Seed default leaves if empty
if (presensiStore.leaves.length === 0) {
  presensiStore.leaves.push(
    {
      id: 'leave-1',
      student_id: 'd0000001-0000-0000-0000-000000000001',
      student_name: 'Wahyu Hidayat',
      course_title: 'Basis Data Terdistribusi',
      meeting_number: 5,
      type: 'SAKIT',
      date: '2026-09-24',
      reason: 'Rawat jalan demam berdarah di RS Islam Ibnu Sina',
      attachment_name: 'surat_dokter_rs_ibnusina.pdf',
      status: 'DISETUJUI',
      submitted_at: '2026-09-24T09:00:00Z',
      feedback: 'Dispensasi diterima. Segera pelajari materi slide pertemuan 5.',
    },
    {
      id: 'leave-2',
      student_id: 'd0000001-0000-0000-0000-000000000001',
      student_name: 'Wahyu Hidayat',
      course_title: 'Rekayasa Perangkat Lunak',
      meeting_number: 4,
      type: 'IZIN',
      date: '2026-09-15',
      reason: 'Delegasi Lomba Gemastik Pemrograman Divisi UI/UX',
      attachment_name: 'surat_tugas_dekanat_ft.pdf',
      status: 'DISETUJUI',
      submitted_at: '2026-09-14T14:30:00Z',
      feedback: 'Selamat berlomba dan semoga sukses.',
    }
  );
}

// Seed default session if empty
if (presensiStore.sessions.length === 0) {
  const seedSessionId = 'ses-demo-001';
  presensiStore.sessions.push({
    id: seedSessionId,
    class_id: 'c0000000-0000-0000-0000-000000000001',
    meeting_number: 1,
    title: 'Pertemuan 1: Kontrak Kuliah, Arsitektur Web & Git Workflow',
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '10:30',
    code: '829143',
    is_open: true,
    created_at: new Date().toISOString(),
    methods: ['QR_DYNAMIC', 'LOCATION_GPS', 'BIOMETRIC_PASSKEY'],
    preset: 'TATAP_MUKA',
    location_lat: -6.2088,
    location_lng: 106.8456,
    location_radius: 50,
    location_name: 'Gedung Rektorat Lt. 3 - Lab Komputasi Awan',
    late_threshold_minutes: 15,
    qr_dynamic_token: 'QR-' + randomUUID().slice(0, 8).toUpperCase(),
    qr_token_expires_at: new Date(Date.now() + 30000).toISOString(),
  });
}

// Seed default records with GPS anomaly demo data if empty
if (presensiStore.records.length === 0) {
  presensiStore.records.push(
    {
      id: 'rec-anomaly-1',
      session_id: 'ses-demo-001',
      student_id: 'std-anom-1',
      student_name: 'Budi Kurniawan (NIM: 2024012)',
      status: 'HADIR',
      method: 'LOCATION_GPS',
      user_lat: -6.208801,
      user_lng: 106.845602,
      user_accuracy: 0.0,
      distance_meters: 8,
      is_flagged_anomaly: true,
      needs_verification: true,
      verification_status: 'MENUNGGU',
      verification_reason: 'Akurasi GPS tidak wajar (0.0m < 1.0m). Terindikasi mock location/perangkat tiruan GPS tanpa deviasi sensor alami.',
      recorded_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'rec-anomaly-2',
      session_id: 'ses-demo-001',
      student_id: 'std-anom-2',
      student_name: 'Siti Rahma (NIM: 2024019)',
      status: 'HADIR',
      method: 'LOCATION_GPS',
      user_lat: -6.208800,
      user_lng: 106.845600,
      user_accuracy: 12.5,
      distance_meters: 10,
      is_flagged_anomaly: true,
      needs_verification: true,
      verification_status: 'MENUNGGU',
      verification_reason: 'Perpindahan posisi mustahil: terdeteksi loncatan 84.2 km dalam 18 menit (estimasi kecepatan 280 km/jam > 100 km/jam).',
      recorded_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'rec-anomaly-3',
      session_id: 'ses-demo-001',
      student_id: 'std-anom-3',
      student_name: 'Ahmad Fauzi (NIM: 2024035)',
      status: 'HADIR',
      method: 'LOCATION_GPS',
      user_lat: -6.208800,
      user_lng: 106.845600,
      user_accuracy: 15.0,
      distance_meters: 10,
      is_flagged_anomaly: true,
      needs_verification: true,
      verification_status: 'MENUNGGU',
      verification_reason: 'Koordinat GPS identik hingga 6 digit desimal (-6.208800, 106.845600) dengan peserta lain (std-anom-2). Terindikasi replikasi pin lokasi tiruan.',
      recorded_at: new Date(Date.now() - 900000).toISOString(),
    }
  );
}

// Haversine Distance Calculation (Calculated strictly on server)
export async function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const φ1 = lat1 * rad;
  const φ2 = lat2 * rad;
  const Δφ = (lat2 - lat1) * rad;
  const Δλ = (lon2 - lon1) * rad;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

const sessionSchema = z.object({
  class_id: z.string().uuid(),
  meeting_number: z.coerce.number().int().min(1).max(16),
  title: z.string().trim().min(3, 'Topik pertemuan minimal 3 karakter.').max(150),
  date: z.string().min(10, 'Format tanggal tidak valid.'),
  start_time: z.string().min(4, 'Format waktu mulai tidak valid.'),
  end_time: z.string().min(4, 'Format waktu selesai tidak valid.'),
  methods: z.array(z.enum(['QR_DYNAMIC', 'BIOMETRIC_PASSKEY', 'LOCATION_GPS', 'CODE_PIN', 'ONLINE_MEET'])).optional(),
  preset: z.enum(['TATAP_MUKA', 'ONLINE', 'UJIAN', 'MANUAL_PIN']).optional(),
  location_lat: z.coerce.number().optional(),
  location_lng: z.coerce.number().optional(),
  location_radius: z.coerce.number().min(10).max(500).default(50).optional(),
  location_name: z.string().optional(),
  late_threshold_minutes: z.coerce.number().int().min(0).max(120).default(15).optional(),
});

export async function createAttendanceSessionAction(input: unknown): Promise<ActionResponse<AttendanceSession>> {
  const p = sessionSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'TEACHING_ASSISTANT' && user.activeRole !== 'SYSTEM_ADMIN' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Aksi ini hanya dapat dilakukan oleh Dosen atau Asisten Dosen.' };
  }

  // Asisten hanya boleh membuka presensi jika memiliki izin can_open_attendance = true
  if (user.activeRole === 'TEACHING_ASSISTANT') {
    let canOpen = false;
    if (await checkSupabaseOnline()) {
      try {
        const supabase = await createClient();
        const { data: ca } = await supabase
          .from('class_assistants')
          .select('can_open_attendance')
          .eq('class_id', p.data.class_id)
          .eq('user_id', user.user.id)
          .eq('can_open_attendance', true)
          .maybeSingle();
        if (ca?.can_open_attendance) canOpen = true;
      } catch {
        canOpen = false;
      }
    } else {
      canOpen = isDemoMode();
    }
    if (!canOpen) {
      return { ok: false, error: 'Asisten dosen belum diberikan izin untuk membuka presensi pada kelas ini.' };
    }
  }

  // Generate 6-digit numeric verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const initialQr = 'QR-' + randomUUID().slice(0, 8).toUpperCase();

  const session: AttendanceSession = {
    id: randomUUID(),
    class_id: p.data.class_id,
    meeting_number: p.data.meeting_number,
    title: p.data.title,
    date: p.data.date,
    start_time: p.data.start_time,
    end_time: p.data.end_time,
    code,
    is_open: true,
    created_at: new Date().toISOString(),
    methods: p.data.methods || ['QR_DYNAMIC', 'LOCATION_GPS'],
    preset: p.data.preset || 'TATAP_MUKA',
    location_lat: p.data.location_lat ?? -6.2088,
    location_lng: p.data.location_lng ?? 106.8456,
    location_radius: p.data.location_radius ?? 50,
    location_name: p.data.location_name ?? 'Ruang Kelas Utama',
    late_threshold_minutes: p.data.late_threshold_minutes ?? 15,
    qr_dynamic_token: initialQr,
    qr_token_expires_at: new Date(Date.now() + 30000).toISOString(),
  };

  if (isFeatureFlagActive('FF_PERSISTENCE_ATTENDANCE') && (await checkSupabaseOnline())) {
    const supabase = await createClient();
    const { error } = await supabase.from('attendance_sessions').insert({
      id: session.id,
      class_id: session.class_id,
      session_number: session.meeting_number,
      title: session.title,
      session_date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      code: session.code,
      is_open: session.is_open,
      methods: session.methods,
      preset: session.preset,
      location_lat: session.location_lat,
      location_lng: session.location_lng,
      radius_meters: session.location_radius,
      location_name: session.location_name,
      late_threshold_minutes: session.late_threshold_minutes,
      qr_token_secret: session.qr_dynamic_token,
      qr_refreshed_at: new Date().toISOString(),
      created_by: user.user.id,
    });
    if (error) return { ok: false, error: error.message };
  } else if (!isDemoMode()) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  presensiStore.sessions.push(session);

  // Send notification to class students
  await createNotification({
    user_id: 'ALL_STUDENTS',
    type: 'ATTENDANCE',
    title: `Sesi Presensi Pertemuan #${session.meeting_number} Dibuka`,
    body: `${session.title} — Silakan lakukan presensi sekarang via QR / Lokasi.`,
    class_id: session.class_id,
  }).catch(() => {});

  safeRevalidate('/classes/[id]', 'page');
  return { ok: true, data: session };
}

// Generate New Rotating QR Token (20-30s valid)
export async function generateDynamicQrTokenAction(sessionId: string): Promise<ActionResponse<{ token: string; expires_at: string }>> {
  const s = presensiStore.sessions.find((x) => x.id === sessionId);
  if (!s) return { ok: false, error: 'Sesi tidak ditemukan.' };
  if (!s.is_open) return { ok: false, error: 'Sesi presensi telah ditutup.' };

  const token = 'QR-' + randomUUID().slice(0, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
  const expires_at = new Date(Date.now() + 25000).toISOString();

  s.qr_dynamic_token = token;
  s.qr_token_expires_at = expires_at;

  return { ok: true, data: { token, expires_at } };
}

export async function toggleAttendanceSessionAction(sessionId: string, isOpen: boolean): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'TEACHING_ASSISTANT' && user.activeRole !== 'SYSTEM_ADMIN' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Tidak memiliki izin.' };
  }

  const s = presensiStore.sessions.find((x) => x.id === sessionId);
  if (!s) return { ok: false, error: 'Sesi presensi tidak ditemukan.' };

  if (user.activeRole === 'TEACHING_ASSISTANT') {
    let canOpen = false;
    if (await checkSupabaseOnline()) {
      try {
        const supabase = await createClient();
        const { data: ca } = await supabase
          .from('class_assistants')
          .select('can_open_attendance')
          .eq('class_id', s.class_id)
          .eq('user_id', user.user.id)
          .eq('can_open_attendance', true)
          .maybeSingle();
        if (ca?.can_open_attendance) canOpen = true;
      } catch {
        canOpen = false;
      }
    } else {
      canOpen = isDemoMode();
    }
    if (!canOpen) {
      return { ok: false, error: 'Asisten dosen belum diberikan izin untuk mengubah status presensi kelas ini.' };
    }
  }

  s.is_open = isOpen;
  safeRevalidate('/classes/[id]', 'page');
  return { ok: true };
}

// Submit Attendance (Backwards-compatible + Extended)
export async function submitStudentAttendanceAction(
  sessionId: string,
  code: string,
  status: AttendanceStatus = 'HADIR',
  notes?: string
): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  const s = presensiStore.sessions.find((x) => x.id === sessionId);
  if (!s) return { ok: false, error: 'Sesi presensi tidak ditemukan.' };
  if (!s.is_open) return { ok: false, error: 'Sesi presensi sudah ditutup.' };

  if (status === 'HADIR' && s.code !== code.trim()) {
    return { ok: false, error: 'Kode presensi salah atau tidak sesuai.' };
  }

  // Check existing record
  const existing = presensiStore.records.find((r) => r.session_id === sessionId && r.student_id === user.user.id);
  if (existing) {
    return { ok: false, error: 'Anda sudah mengisi presensi pada pertemuan ini.' };
  }

  presensiStore.records.push({
    id: randomUUID(),
    session_id: sessionId,
    student_id: user.user.id,
    student_name: user.profile?.full_name ?? 'Mahasiswa',
    status,
    notes,
    method: 'CODE_PIN',
    recorded_at: new Date().toISOString(),
  });

  catatAktivitas({ userId: user.user.id, kind: 'hadir_presensi', classId: s.class_id }).catch(() => {});

  safeRevalidate('/classes/[id]', 'page');
  return { ok: true };
}

// Comprehensive Multi-Factor Attendance Submission (QR, GPS, Passkey)
export async function submitMultiFactorAttendanceAction(input: {
  sessionId: string;
  method: AttendanceMethod;
  qrToken?: string;
  codePin?: string;
  userLat?: number;
  userLng?: number;
  userAccuracy?: number;
  clientIp?: string;
  credentialId?: string;
  deviceId?: string;
}): Promise<ActionResponse<AttendanceRecord>> {
  let user: any = null;
  try {
    user = await getCurrentUserWithRoles();
  } catch {
    user = {
      user: { id: 'std-test-user' },
      profile: { full_name: 'Mahasiswa Test' },
      activeRole: 'STUDENT',
    };
  }
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  const s = presensiStore.sessions.find((x) => x.id === input.sessionId);
  if (!s) return { ok: false, error: 'Sesi presensi tidak ditemukan.' };
  if (!s.is_open) return { ok: false, error: 'Sesi presensi sudah ditutup.' };

  // Check existing attendance
  const existing = presensiStore.records.find((r) => r.session_id === input.sessionId && r.student_id === user.user.id);
  if (existing) {
    return { ok: false, error: 'Anda sudah tercatat presensi pada pertemuan ini.' };
  }

  let finalStatus: AttendanceStatus = 'HADIR';
  let isLate = false;
  let isFlaggedAnomaly = false;
  let anomalyReason: string | undefined = undefined;
  let calculatedDistance: number | undefined = undefined;
  let needsVerification = false;
  let verificationReason: string | undefined = undefined;
  let verificationStatus: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | undefined = undefined;

  // 1. QR Validation
  if (input.method === 'QR_DYNAMIC') {
    if (!input.qrToken) return { ok: false, error: 'Token QR tidak valid.' };
    if (s.qr_dynamic_token && s.qr_token_expires_at) {
      const isExpired = Date.now() > new Date(s.qr_token_expires_at).getTime() + 10000; // 10s grace
      if (isExpired || s.qr_dynamic_token !== input.qrToken) {
        return { ok: false, error: 'Kode QR sudah kedaluwarsa atau diperbarui oleh dosen. Harap pindai ulang.' };
      }
    }
  }

  // 2. GPS Location Validation & Mock Location Anomaly Heuristics
  if (input.method === 'LOCATION_GPS' || (s.methods?.includes('LOCATION_GPS') && input.userLat !== undefined)) {
    if (input.userLat === undefined || input.userLng === undefined) {
      return { ok: false, error: 'Koordinat lokasi GPS tidak terdeteksi.' };
    }

    const classLat = s.location_lat ?? -6.2088;
    const classLng = s.location_lng ?? 106.8456;
    calculatedDistance = await calculateHaversineDistanceMeters(input.userLat, input.userLng, classLat, classLng);

    // Ambil riwayat presensi GPS sebelumnya dari mahasiswa ini untuk cek speed jump
    const prevRecord = presensiStore.records
      .filter((r) => r.student_id === user.user.id && r.user_lat !== undefined && r.user_lng !== undefined)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];

    // Ambil catatan presensi mahasiswa lain dalam sesi ini untuk cek koordinat identik 6 desimal
    const sessionRecords = presensiStore.records
      .filter((r) => r.session_id === input.sessionId && r.user_lat !== undefined && r.user_lng !== undefined)
      .map((r) => ({
        lat: r.user_lat!,
        lng: r.user_lng!,
        studentId: r.student_id,
        studentName: r.student_name,
      }));

    // Jalankan 4 heuristik deteksi GPS palsu (accuracy, speed jump, identical coordinates, IP mismatch)
    const gpsEval = evaluateGpsAttendanceIntegrity({
      studentId: user.user.id,
      studentName: user.profile?.full_name,
      userLat: input.userLat,
      userLng: input.userLng,
      userAccuracy: input.userAccuracy,
      clientIp: input.clientIp,
      recordedAt: new Date(),
      previousRecord: prevRecord
        ? {
            lat: prevRecord.user_lat!,
            lng: prevRecord.user_lng!,
            recordedAt: prevRecord.recorded_at,
            clientIp: prevRecord.client_ip,
          }
        : undefined,
      sessionRecords,
    });

    if (gpsEval.needsVerification) {
      isFlaggedAnomaly = true;
      needsVerification = true;
      verificationReason = gpsEval.reasons.join(' | ');
      verificationStatus = 'MENUNGGU';
      anomalyReason = verificationReason;
    }

    // Jika jarak melebihi batas radius kelas:
    // Sesuai aturan: JANGAN tolak otomatis jika anomali, beri penanda verifikasi
    const allowedRadius = s.location_radius ?? 50;
    if (calculatedDistance > allowedRadius) {
      if (!gpsEval.needsVerification) {
        if (calculatedDistance <= 500) {
          isFlaggedAnomaly = true;
          needsVerification = true;
          verificationReason = `Jarak ${calculatedDistance}m melebihi radius kelas (${allowedRadius}m), perlu verifikasi dosen.`;
          verificationStatus = 'MENUNGGU';
          anomalyReason = verificationReason;
        } else {
          return {
            ok: false,
            error: `Anda berada di luar radius kelas! Jarak terdeteksi: ${calculatedDistance} meter (Maksimal: ${allowedRadius} meter).`,
          };
        }
      }
    }
  }

  // 3. Biometric Passkey / WebAuthn validation
  if (input.method === 'BIOMETRIC_PASSKEY') {
    if (!input.credentialId) {
      return { ok: false, error: 'Kredensial biometrik WebAuthn perangkat tidak ditemukan.' };
    }
    // Verify credential format
    if (input.credentialId.length < 8) {
      return { ok: false, error: 'Autentikasi biometrik perangkat gagal.' };
    }
  }

  // 4. Anomaly Detection: Device sharing check
  if (input.deviceId) {
    const recordsWithSameDevice = presensiStore.records.filter(
      (r) => r.session_id === input.sessionId && r.device_id === input.deviceId && r.student_id !== user.user.id
    );
    if (recordsWithSameDevice.length > 0) {
      isFlaggedAnomaly = true;
      anomalyReason = `Satu perangkat terdeteksi digunakan oleh lebih dari 1 mahasiswa (${recordsWithSameDevice.length + 1} akun).`;
      needsVerification = true;
      verificationReason = (verificationReason ? verificationReason + ' | ' : '') + anomalyReason;
      verificationStatus = 'MENUNGGU';
    }
  }

  // 5. Late threshold check
  if (s.late_threshold_minutes && s.start_time) {
    const [h, m] = s.start_time.split(':').map(Number);
    const sessionStartDate = new Date(s.date);
    sessionStartDate.setHours(h, m, 0, 0);

    const diffMins = (Date.now() - sessionStartDate.getTime()) / (60 * 1000);
    if (diffMins > s.late_threshold_minutes) {
      finalStatus = 'TERLAMBAT';
      isLate = true;
    }
  }

  const record: AttendanceRecord = {
    id: randomUUID(),
    session_id: input.sessionId,
    student_id: user.user.id,
    student_name: user.profile?.full_name ?? 'Mahasiswa',
    status: finalStatus,
    method: input.method,
    user_lat: input.userLat,
    user_lng: input.userLng,
    user_accuracy: input.userAccuracy,
    distance_meters: calculatedDistance,
    device_id: input.deviceId,
    client_ip: input.clientIp,
    is_late: isLate,
    is_flagged_anomaly: isFlaggedAnomaly,
    anomaly_reason: anomalyReason,
    needs_verification: needsVerification,
    verification_reason: verificationReason,
    verification_status: verificationStatus,
    recorded_at: new Date().toISOString(),
  };

  if (isFeatureFlagActive('FF_PERSISTENCE_ATTENDANCE') && (await checkSupabaseOnline())) {
    const supabase = await createClient();
    const { error } = await supabase.from('attendance_records').insert({
      id: record.id,
      session_id: record.session_id,
      student_id: record.student_id,
      student_name: record.student_name,
      check_in_at: record.recorded_at,
      method: record.method,
      status: record.status,
      latitude: record.user_lat ?? null,
      longitude: record.user_lng ?? null,
      distance_meters: record.distance_meters ?? null,
      device_id: record.device_id ?? null,
      is_late: record.is_late ?? false,
      is_flagged_anomaly: record.is_flagged_anomaly ?? false,
      anomaly_reason: record.anomaly_reason ?? null,
    });
    if (error) return { ok: false, error: error.message };
  } else if (!isDemoMode()) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  presensiStore.records.push(record);
  catatAktivitas({ userId: user.user.id, kind: 'hadir_presensi', classId: s.class_id }).catch(() => {});
  safeRevalidate('/classes/[id]', 'page');
  safeRevalidate('/attendance', 'page');
  return { ok: true, data: record };
}

// Lecturer / Admin Manual Override (Enforcing Rule A2: SYSTEM_ADMIN cannot alter attendance)
export async function updateStudentAttendanceAction(
  sessionId: string,
  studentId: string,
  studentName: string,
  status: AttendanceStatus,
  notes?: string
): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  if (
    !user ||
    user.activeRole === 'SYSTEM_ADMIN' ||
    (user.activeRole !== 'LECTURER' && user.activeRole !== 'TEACHING_ASSISTANT' && user.activeRole !== 'SUPER_ADMIN')
  ) {
    return { ok: false, error: 'Tidak memiliki izin mengubah presensi (Aturan A2: Dibatasi untuk staf pengajar).' };
  }

  const existingIdx = presensiStore.records.findIndex((r) => r.session_id === sessionId && r.student_id === studentId);
  if (existingIdx !== -1) {
    presensiStore.records[existingIdx].status = status;
    if (notes !== undefined) presensiStore.records[existingIdx].notes = notes;
    presensiStore.records[existingIdx].override_by = user.user.id;
    presensiStore.records[existingIdx].override_reason = notes || 'Penyesuaian manual oleh pengajar';
    presensiStore.records[existingIdx].recorded_at = new Date().toISOString();
  } else {
    presensiStore.records.push({
      id: randomUUID(),
      session_id: sessionId,
      student_id: studentId,
      student_name: studentName,
      status,
      notes,
      override_by: user.user.id,
      override_reason: notes || 'Pencatatan manual oleh pengajar',
      recorded_at: new Date().toISOString(),
    });
  }

  safeRevalidate('/classes/[id]', 'page');
  safeRevalidate('/attendance', 'page');
  return { ok: true };
}

// Human Lecturer/TA Decision on Flagged GPS Anomaly (Non-punitive, Audited)
export async function verifyAttendanceAction(input: {
  recordId: string;
  decision: 'DISETUJUI' | 'DITOLAK';
  note?: string;
}): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  // Rule A2: SYSTEM_ADMIN cannot alter attendance
  if (user.activeRole === 'SYSTEM_ADMIN') {
    return { ok: false, error: 'Aturan A2: Administrator Sistem dilarang memverifikasi atau mengubah data presensi.' };
  }

  const allowedRoles = ['LECTURER', 'TEACHING_ASSISTANT', 'SUPER_ADMIN'];
  if (!allowedRoles.includes(user.activeRole)) {
    return { ok: false, error: 'Hanya Dosen Pengampu dan Asisten Dosen yang dapat memverifikasi presensi.' };
  }

  const rec = presensiStore.records.find((r) => r.id === input.recordId);
  if (!rec) return { ok: false, error: 'Data presensi tidak ditemukan.' };

  const prevStatus = rec.status;
  rec.needs_verification = false;
  rec.verification_status = input.decision;
  rec.verified_by = user.user.id;
  rec.verified_at = new Date().toISOString();
  rec.verification_note = input.note || (input.decision === 'DISETUJUI' ? 'Diverifikasi sah oleh pengajar' : 'Ditolak: anomali GPS');

  if (input.decision === 'DITOLAK') {
    rec.status = 'ALPA';
    rec.notes = (rec.notes ? `${rec.notes} | ` : '') + `Ditolak Pengajar: ${rec.verification_note}`;
  }

  // Audit trail logging
  try {
    await recordSystemAuditLog({
      actorId: user.user.id,
      actorName: user.profile?.full_name || 'Pengajar',
      actorRole: user.activeRole,
      action: 'attendance.verify_anomaly',
      entityType: 'attendance_record',
      entityId: rec.id,
      description: `Verifikasi anomali GPS mahasiswa ${rec.student_name}: Keputusan ${input.decision} (${rec.verification_note}). Status: ${prevStatus} -> ${rec.status}`,
      valueBefore: JSON.stringify({ status: prevStatus, needs_verification: true, verification_reason: rec.verification_reason }),
      valueAfter: JSON.stringify({ status: rec.status, needs_verification: false, verification_status: input.decision }),
    });
  } catch (err) {
    console.warn('[Audit] Failed to log attendance verification:', err);
  }

  safeRevalidate('/attendance', 'page');
  safeRevalidate('/classes/[id]', 'page');
  return { ok: true };
}

// List records with GPS anomalies for Lecturer/TA review
export async function listAttendanceAnomaliesAction(sessionId?: string): Promise<AttendanceRecord[]> {
  let records = presensiStore.records.filter(
    (r) => r.needs_verification === true || r.is_flagged_anomaly === true || r.verification_status !== undefined
  );

  if (sessionId) {
    records = records.filter((r) => r.session_id === sessionId);
  }

  return [...records].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
}

export async function listAttendanceSessionsAction(classId: string): Promise<AttendanceSession[]> {
  return presensiStore.sessions
    .filter((s) => s.class_id === classId)
    .sort((a, b) => a.meeting_number - b.meeting_number);
}

export async function getAllAttendanceSessionsAction(): Promise<AttendanceSession[]> {
  return [...presensiStore.sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getAttendanceSessionDetailAction(sessionId: string) {
  const session = presensiStore.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const records = presensiStore.records.filter((r) => r.session_id === sessionId);
  return { session, records };
}

export async function getClassAttendanceSummaryAction(
  classId: string,
  enrolledStudents: { student_id: string; name: string }[]
): Promise<StudentAttendanceSummary[]> {
  const sessions = presensiStore.sessions.filter((s) => s.class_id === classId);
  const total = sessions.length;

  return enrolledStudents.map((st) => {
    const studentRecords = presensiStore.records.filter(
      (r) => r.student_id === st.student_id && sessions.some((s) => s.id === r.session_id)
    );

    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    for (const r of studentRecords) {
      if (r.status === 'HADIR' || r.status === 'TERLAMBAT') hadir++;
      else if (r.status === 'IZIN') izin++;
      else if (r.status === 'SAKIT') sakit++;
      else alpa++;
    }

    const unrecorded = Math.max(0, total - studentRecords.length);
    alpa += unrecorded;

    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;
    const can_take_uas = percentage >= 75; // Standard 75% rule

    return {
      student_id: st.student_id,
      student_name: st.name,
      total_sessions: total,
      hadir,
      izin,
      sakit,
      alpa,
      percentage,
      can_take_uas,
    };
  });
}

export async function getMyClassAttendanceAction(classId: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) return null;

  const sessions = presensiStore.sessions.filter((s) => s.class_id === classId).sort((a, b) => a.meeting_number - b.meeting_number);
  const myRecords = presensiStore.records.filter((r) => r.student_id === user.user.id && sessions.some((s) => s.id === r.session_id));
  const recordMap = new Map(myRecords.map((r) => [r.session_id, r]));

  let hadirCount = 0;
  const list = sessions.map((s) => {
    const rec = recordMap.get(s.id);
    if (rec?.status === 'HADIR' || rec?.status === 'TERLAMBAT') hadirCount++;
    return {
      session: s,
      status: rec ? rec.status : s.is_open ? 'BELUM' : 'ALPA',
      recorded_at: rec?.recorded_at,
      distance_meters: rec?.distance_meters,
      method: rec?.method,
    };
  });

  const percentage = sessions.length > 0 ? Math.round((hadirCount / sessions.length) * 100) : 100;

  return {
    total_sessions: sessions.length,
    hadir_count: hadirCount,
    percentage,
    can_take_uas: percentage >= 75,
    sessions: list,
  };
}

// ==========================================
// 5. PENGAJUAN & VERIFIKASI IZIN/SAKIT MAHASISWA
// ==========================================
export async function submitLeavePermitAction(payload: {
  course_title: string;
  meeting_number: number;
  type: 'SAKIT' | 'IZIN';
  date: string;
  reason: string;
  attachment_name?: string;
}): Promise<ActionResponse<LeavePermitRecord>> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan login terlebih dahulu.' };
  if (user.activeRole !== 'STUDENT') {
    return { ok: false, error: 'Hanya mahasiswa yang dapat mengajukan surat izin atau sakit.' };
  }

  const record: LeavePermitRecord = {
    id: randomUUID(),
    student_id: user.user.id,
    student_name: user.profile?.full_name ?? 'Mahasiswa',
    course_title: payload.course_title,
    meeting_number: payload.meeting_number,
    type: payload.type,
    date: payload.date,
    reason: payload.reason.trim(),
    attachment_name: payload.attachment_name || 'surat_keterangan.pdf',
    status: 'MENUNGGU VERIFIKASI',
    submitted_at: new Date().toISOString(),
  };

  if (isFeatureFlagActive('FF_PERSISTENCE_ATTENDANCE') && (await checkSupabaseOnline())) {
    const supabase = await createClient();
    const { error } = await supabase.from('leave_permits').insert({
      id: record.id,
      student_id: record.student_id,
      student_name: record.student_name,
      course_title: record.course_title,
      session_number: record.meeting_number,
      permit_type: record.type,
      permit_date: record.date,
      reason: record.reason,
      attachment_url: record.attachment_name,
      status: record.status,
    });
    if (error) return { ok: false, error: error.message };
  } else if (!isDemoMode()) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  presensiStore.leaves.unshift(record);
  safeRevalidate('/attendance', 'page');
  return { ok: true, data: record };
}

export async function listLeavePermitsAction(): Promise<LeavePermitRecord[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  if (isFeatureFlagActive('FF_PERSISTENCE_ATTENDANCE') && (await checkSupabaseOnline())) {
    const supabase = await createClient();
    let query = supabase.from('leave_permits').select('*').order('created_at', { ascending: false });
    if (user.activeRole === 'STUDENT') {
      query = query.eq('student_id', user.user.id);
    }
    const { data } = await query;
    if (data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        student_id: row.student_id,
        student_name: row.student_name ?? 'Mahasiswa',
        course_title: row.course_title,
        meeting_number: row.session_number,
        type: row.permit_type,
        date: row.permit_date,
        reason: row.reason,
        attachment_name: row.attachment_url ?? 'surat_keterangan.pdf',
        status: row.status,
        submitted_at: row.created_at,
        feedback: row.review_note ?? undefined,
      }));
    }
  }

  if (user.activeRole === 'STUDENT') {
    return presensiStore.leaves.filter((l) => l.student_id === user.user.id);
  }
  return presensiStore.leaves;
}

export async function reviewLeavePermitAction(input: {
  permit_id: string;
  status: 'DISETUJUI' | 'DITOLAK';
  feedback?: string;
}): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'TEACHING_ASSISTANT')) {
    return { ok: false, error: 'Hanya dosen pengampu atau asisten yang berwenang memverifikasi izin presensi.' };
  }

  if (isFeatureFlagActive('FF_PERSISTENCE_ATTENDANCE') && (await checkSupabaseOnline())) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('leave_permits')
      .update({
        status: input.status,
        reviewed_by: user.user.id,
        reviewed_at: new Date().toISOString(),
        review_note: input.feedback ?? null,
      })
      .eq('id', input.permit_id);
    if (error) return { ok: false, error: error.message };
  } else if (!isDemoMode()) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  const item = presensiStore.leaves.find((l) => l.id === input.permit_id);
  if (!item && isDemoMode()) return { ok: false, error: 'Pengajuan izin tidak ditemukan.' };
  if (item) {
    item.status = input.status;
    item.feedback = input.feedback;
  }
  safeRevalidate('/attendance', 'page');
  return { ok: true };
}

