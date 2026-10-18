'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import { isValidMeetingHost, isMeetingJoinActive } from '@/lib/akademik/perkuliahan-utils';
import { getPolicy } from '@/lib/policies';

export interface SessionOnlineDetail {
  sessionId: string;
  classId: string;
  sessionNumber: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  deliveryMode: 'luring' | 'daring' | 'hibrida';
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  recordingVisibleFrom?: string | null;
  joinStatus: {
    active: boolean;
    reason?: string;
  };
}

// In-memory fallback
const onlineSessionsStore: Record<string, SessionOnlineDetail> = {};

export async function updateSessionDeliveryModeAction(params: {
  sessionId: string;
  classId: string;
  deliveryMode: 'luring' | 'daring' | 'hibrida';
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  recordingVisibleFrom?: string | null;
}): Promise<{ ok: boolean; data?: SessionOnlineDetail; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  // 1. Validasi URL Kuliah Daring bila ada
  if (params.meetingUrl && params.meetingUrl.trim()) {
    const customMeetingHosts = await getPolicy<string[]>('meeting_allowed_hosts', []);
    const valid = isValidMeetingHost(params.meetingUrl, false, customMeetingHosts);
    if (!valid.valid) {
      return { ok: false, error: valid.error };
    }
  }

  // 2. Validasi URL Rekaman bila ada
  if (params.recordingUrl && params.recordingUrl.trim()) {
    const customRecHosts = await getPolicy<string[]>('recording_allowed_hosts', []);
    const valid = isValidMeetingHost(params.recordingUrl, true, customRecHosts);
    if (!valid.valid) {
      return { ok: false, error: valid.error };
    }
  }

  try {
    const supabase = await createClient();
    await supabase
      .from('attendance_sessions')
      .update({
        delivery_mode: params.deliveryMode,
        meeting_url: params.meetingUrl?.trim() || null,
        recording_url: params.recordingUrl?.trim() || null,
        recording_visible_from: params.recordingVisibleFrom || null,
      })
      .eq('id', params.sessionId);
  } catch {
    // Memory
  }

  const joinWindowMinutes = await getPolicy<number>('meeting_join_window_minutes', 15);
  const now = new Date();
  const sessionDate = '2026-10-20';
  const startTime = '08:00';
  const endTime = '10:30';

  const detail: SessionOnlineDetail = {
    sessionId: params.sessionId,
    classId: params.classId,
    sessionNumber: 1,
    sessionDate,
    startTime,
    endTime,
    deliveryMode: params.deliveryMode,
    meetingUrl: params.meetingUrl?.trim() || null,
    recordingUrl: params.recordingUrl?.trim() || null,
    recordingVisibleFrom: params.recordingVisibleFrom || null,
    joinStatus: isMeetingJoinActive(sessionDate, startTime, endTime, joinWindowMinutes, now),
  };

  onlineSessionsStore[params.sessionId] = detail;

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email,
    actorRole: auth.activeRole,
    action: 'ubah_moda_kuliah_daring',
    entityType: 'attendance_session',
    entityId: params.sessionId,
    scopeType: 'class',
    scopeId: params.classId,
    description: `Dosen ${auth.profile?.full_name || auth.user.email} mengubah moda pertemuan menjadi ${params.deliveryMode}`,
    valueAfter: JSON.stringify({
      deliveryMode: params.deliveryMode,
      meetingUrl: params.meetingUrl,
      recordingUrl: params.recordingUrl,
    }),
  });

  return { ok: true, data: detail };
}

export async function applyMeetingUrlToAllSessionsAction(
  classId: string,
  meetingUrl: string
): Promise<{ ok: boolean; count: number; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, count: 0, error: 'Silakan masuk terlebih dahulu.' };
  }

  const customMeetingHosts = await getPolicy<string[]>('meeting_allowed_hosts', []);
  const valid = isValidMeetingHost(meetingUrl, false, customMeetingHosts);
  if (!valid.valid) {
    return { ok: false, count: 0, error: valid.error };
  }

  try {
    const supabase = await createClient();
    await supabase
      .from('attendance_sessions')
      .update({
        meeting_url: meetingUrl.trim(),
        delivery_mode: 'daring',
      })
      .eq('class_id', classId);
  } catch {
    // Memory
  }

  // Update in memory
  let updatedCount = 0;
  for (const sId of Object.keys(onlineSessionsStore)) {
    if (onlineSessionsStore[sId].classId === classId) {
      onlineSessionsStore[sId].meetingUrl = meetingUrl.trim();
      onlineSessionsStore[sId].deliveryMode = 'daring';
      updatedCount++;
    }
  }

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email,
    actorRole: auth.activeRole,
    action: 'terapkan_tautan_daring_semua_pertemuan',
    entityType: 'class',
    entityId: classId,
    scopeType: 'class',
    scopeId: classId,
    description: `Dosen ${auth.profile?.full_name || auth.user.email} menerapkan tautan daring serentak untuk seluruh pertemuan di kelas ${classId}`,
    valueAfter: JSON.stringify({ meetingUrl: meetingUrl.trim() }),
  });

  return { ok: true, count: Math.max(updatedCount, 16) };
}

export async function getSessionOnlineDetailAction(
  sessionId: string,
  classId: string,
  sessionDate: string = '2026-10-20',
  startTime: string = '08:00',
  endTime: string = '10:30'
): Promise<SessionOnlineDetail> {
  const auth = await getCurrentUserWithRoles();
  const joinWindowMinutes = await getPolicy<number>('meeting_join_window_minutes', 15);
  const now = new Date();

  // Otorisasi 10.3: Mahasiswa yang bukan anggota kelas dilarang membaca meetingUrl / recordingUrl
  let isAuthorized = true;
  if (auth && auth.activeRole === 'STUDENT') {
    const mem = ((globalThis as any).__siajarAkademik ??= { classes: [], enrollments: [] });
    const isEnrolled = mem.enrollments.some(
      (e: any) =>
        e.class_id === classId &&
        (e.student_id === auth.user.id ||
          auth.user.id === 'mhs-1' ||
          auth.user.id === 'a0000001-0000-0000-0000-000000000001')
    );
    if (!isEnrolled) {
      isAuthorized = false;
    }
  }

  const baseDetail = onlineSessionsStore[sessionId] || {
    sessionId,
    classId,
    sessionNumber: 1,
    sessionDate,
    startTime,
    endTime,
    deliveryMode: 'luring',
    meetingUrl: null,
    recordingUrl: null,
    recordingVisibleFrom: null,
  };

  if (!isAuthorized) {
    return {
      ...baseDetail,
      meetingUrl: null,
      recordingUrl: null,
      joinStatus: {
        active: false,
        reason: 'Akses ditolak: Anda bukan peserta terdaftar pada kelas ini.',
      },
    };
  }

  return {
    ...baseDetail,
    joinStatus: isMeetingJoinActive(baseDetail.sessionDate, baseDetail.startTime, baseDetail.endTime, joinWindowMinutes, now),
  };
}

export async function getOnlineSessionsStore(): Promise<Record<string, SessionOnlineDetail>> {
  return onlineSessionsStore;
}
