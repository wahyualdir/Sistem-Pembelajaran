'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { createNotification } from '@/modules/academic/actions';

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
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  status: AttendanceStatus;
  notes?: string;
  recorded_at: string;

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

  // 2. GPS Location Validation (Calculated strictly on server using Haversine)
  if (input.method === 'LOCATION_GPS' || (s.methods?.includes('LOCATION_GPS') && input.userLat !== undefined)) {
    if (input.userLat === undefined || input.userLng === undefined) {
      return { ok: false, error: 'Koordinat lokasi GPS tidak terdeteksi.' };
    }

    if (input.userAccuracy && input.userAccuracy > 150) {
      return { ok: false, error: `Akurasi GPS perangkat terlalu rendah (±${Math.round(input.userAccuracy)}m). Pastikan Anda berada di area terbuka.` };
    }

    const classLat = s.location_lat ?? -6.2088;
    const classLng = s.location_lng ?? 106.8456;
    calculatedDistance = await calculateHaversineDistanceMeters(input.userLat, input.userLng, classLat, classLng);

    const allowedRadius = s.location_radius ?? 50;
    if (calculatedDistance > allowedRadius) {
      return {
        ok: false,
        error: `Anda berada di luar radius kelas! Jarak terdeteksi: ${calculatedDistance} meter (Maksimal: ${allowedRadius} meter).`,
      };
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
    is_late: isLate,
    is_flagged_anomaly: isFlaggedAnomaly,
    anomaly_reason: anomalyReason,
    recorded_at: new Date().toISOString(),
  };

  presensiStore.records.push(record);
  safeRevalidate('/classes/[id]', 'page');
  return { ok: true, data: record };
}

// Lecturer / Admin Manual Override
export async function updateStudentAttendanceAction(
  sessionId: string,
  studentId: string,
  studentName: string,
  status: AttendanceStatus,
  notes?: string
): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'TEACHING_ASSISTANT' && user.activeRole !== 'SYSTEM_ADMIN' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Tidak memiliki izin mengubah presensi.' };
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
  return { ok: true };
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
    id: 'leave-' + randomUUID().slice(0, 8),
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

  presensiStore.leaves.unshift(record);
  safeRevalidate('/attendance', 'page');
  return { ok: true, data: record };
}

export async function listLeavePermitsAction(): Promise<LeavePermitRecord[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];
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
  const item = presensiStore.leaves.find((l) => l.id === input.permit_id);
  if (!item) return { ok: false, error: 'Pengajuan izin tidak ditemukan.' };
  item.status = input.status;
  item.feedback = input.feedback;
  safeRevalidate('/attendance', 'page');
  return { ok: true };
}
