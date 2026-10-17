'use server';

// Server Actions untuk Sanggah Nilai oleh Mahasiswa SIAJAR
// Mengacu pada Dokumen Instruksi Antigravity Versi 2 (Bagian 9.4)

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import { getPolicy } from '@/lib/policies';
import { notify } from '@/modules/notifications/service';
import type { ActionResponse } from '@/modules/identity/types';

export type DisputeStatus = 'diajukan' | 'ditinjau' | 'diterima' | 'ditolak' | 'ditarik';
export type DisputeTargetType = 'submission' | 'exam_attempt' | 'exam_question' | 'attendance';

export interface GradeDisputeItem {
  id: string;
  class_id: string;
  student_id: string;
  student_name?: string;
  nim?: string;
  target_type: DisputeTargetType;
  target_id: string;
  target_title?: string;
  reason: string;
  evidence_path?: string | null;
  status: DisputeStatus;
  response?: string | null;
  old_score?: number | null;
  new_score?: number | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  linked_change_request_id?: string | null;
  created_at: string;
  messages?: GradeDisputeMessageItem[];
}

export interface GradeDisputeMessageItem {
  id: string;
  dispute_id: string;
  author_id: string;
  author_name?: string;
  body: string;
  created_at: string;
}

// In-memory fallback stores
const disputesStore: GradeDisputeItem[] = ((globalThis as any).__siajarDisputes ??= []);
const disputeMessagesStore: GradeDisputeMessageItem[] = ((globalThis as any).__siajarDisputeMessages ??= []);
// Rate limit log per user: userId -> array of submission timestamps (ms)
const disputeRateLimits = new Map<string, number[]>();

const disputeSchema = z.object({
  classId: z.string().uuid('ID Kelas tidak valid.'),
  targetType: z.enum(['submission', 'exam_attempt', 'exam_question', 'attendance']),
  targetId: z.string().uuid('ID Butir target tidak valid.'),
  targetTitle: z.string().trim().optional(),
  publishedAt: z.string().datetime({ offset: true }).optional(),
  currentScore: z.coerce.number().optional().nullable(),
  reason: z.string().trim().min(30, 'Alasan sanggahan minimal 30 karakter agar dapat ditinjau dosen.'),
  evidencePath: z.string().trim().optional().nullable(),
});

/**
 * Mahasiswa mengajukan sanggahan terhadap butir nilai yang telah dipublikasikan.
 */
export async function createGradeDisputeAction(
  input: unknown
): Promise<ActionResponse<GradeDisputeItem>> {
  const parsed = disputeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const isStudent = auth.roles.includes('STUDENT');
  if (!isStudent) {
    return { ok: false, error: 'Hanya Mahasiswa yang dapat mengajukan sanggahan nilai.' };
  }

  const v = parsed.data;

  // 1. Validasi Batas Waktu Sanggah (dispute_window_days dari kebijakan institusi)
  const windowDays = await getPolicy<number>('dispute_window_days') || 7;
  if (v.publishedAt) {
    const pubTime = new Date(v.publishedAt).getTime();
    const expiryTime = pubTime + windowDays * 24 * 60 * 60 * 1000;
    if (Date.now() > expiryTime) {
      return { ok: false, error: 'Batas pengajuan sanggahan sudah lewat.' };
    }
  }

  // 2. Rate limit: maksimal 5 pengajuan per jam per mahasiswa
  const now = Date.now();
  const oneHourAgo = now - 3600 * 1000;
  const userTimestamps = (disputeRateLimits.get(auth.user.id) || []).filter((t) => t > oneHourAgo);
  if (userTimestamps.length >= 5) {
    return {
      ok: false,
      error: 'Batas pengajuan terlampaui. Anda hanya dapat mengajukan maksimal 5 sanggahan per jam.',
    };
  }
  userTimestamps.push(now);
  disputeRateLimits.set(auth.user.id, userTimestamps);

  // 3. Cek apakah ada sanggahan aktif (diajukan / ditinjau) untuk butir ini
  const existingActive = disputesStore.find(
    (d) =>
      d.student_id === auth.user.id &&
      d.target_type === v.targetType &&
      d.target_id === v.targetId &&
      (d.status === 'diajukan' || d.status === 'ditinjau')
  );
  if (existingActive) {
    return {
      ok: false,
      error: 'Anda sudah memiliki sanggahan aktif yang sedang menunggu peninjauan pada butir nilai ini.',
    };
  }

  const id = randomUUID();
  const disputeItem: GradeDisputeItem = {
    id,
    class_id: v.classId,
    student_id: auth.user.id,
    student_name: auth.profile?.full_name || auth.user.email || 'Mahasiswa',
    target_type: v.targetType,
    target_id: v.targetId,
    target_title: v.targetTitle,
    reason: v.reason,
    evidence_path: v.evidencePath ?? null,
    status: 'diajukan',
    old_score: v.currentScore ?? null,
    new_score: null,
    created_at: new Date().toISOString(),
  };

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('grade_disputes')
        .insert({
          id,
          class_id: v.classId,
          student_id: auth.user.id,
          target_type: v.targetType,
          target_id: v.targetId,
          reason: v.reason,
          evidence_path: v.evidencePath ?? null,
          status: 'diajukan',
          old_score: v.currentScore ?? null,
        })
        .select()
        .single();

      if (error) {
        return { ok: false, error: `Gagal mengajukan sanggahan: ${error.message}` };
      }
    }
  } catch {
    // Memory
  }

  disputesStore.push(disputeItem);

  // Catat audit log
  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Mahasiswa',
    actorRole: auth.activeRole,
    action: 'grade_dispute.create',
    entityType: 'grade_disputes',
    entityId: id,
    scopeType: 'CLASS',
    scopeId: v.classId,
    description: `Sanggahan nilai diajukan untuk butir ${v.targetType}:${v.targetId}. Alasan: ${v.reason.slice(0, 50)}...`,
    valueAfter: JSON.stringify({ id, targetType: v.targetType, targetId: v.targetId }),
  });

  return { ok: true, data: disputeItem };
}

/**
 * Mahasiswa menarik sanggahan yang masih berstatus 'diajukan'.
 */
export async function withdrawGradeDisputeAction(
  disputeId: string
): Promise<ActionResponse<{ disputeId: string; status: 'ditarik' }>> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) return { ok: false, error: 'Sesi Anda telah kedaluwarsa.' };

  const dispute = disputesStore.find((d) => d.id === disputeId);
  if (dispute && dispute.student_id !== auth.user.id) {
    return { ok: false, error: 'Anda hanya dapat menarik sanggahan milik sendiri.' };
  }

  if (dispute && dispute.status !== 'diajukan') {
    return { ok: false, error: 'Sanggahan yang sedang ditinjau atau telah diputuskan tidak dapat ditarik.' };
  }

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { error } = await supabase
        .from('grade_disputes')
        .update({ status: 'ditarik' })
        .eq('id', disputeId)
        .eq('student_id', auth.user.id);

      if (error) return { ok: false, error: error.message };
    }
  } catch {
    // Memory
  }

  if (dispute) dispute.status = 'ditarik';

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Mahasiswa',
    actorRole: auth.activeRole,
    action: 'grade_dispute.withdraw',
    entityType: 'grade_disputes',
    entityId: disputeId,
    description: 'Sanggahan nilai ditarik oleh mahasiswa.',
    valueAfter: JSON.stringify({ status: 'ditarik' }),
  });

  return { ok: true, data: { disputeId, status: 'ditarik' } };
}

const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid('ID Sanggahan tidak valid.'),
  decision: z.enum(['diterima', 'ditolak', 'ditinjau']),
  newScore: z.coerce.number().optional().nullable(),
  response: z.string().trim().min(5, 'Tanggapan dosen minimal 5 karakter.'),
  isGradebookFinal: z.boolean().default(false),
}).refine((v) => {
  if (v.decision === 'diterima' && (v.newScore === undefined || v.newScore === null)) {
    return false;
  }
  if (v.decision === 'ditolak' && v.response.length < 20) {
    return false;
  }
  return true;
}, {
  message: 'Keputusan tolak membutuhkan alasan penolakan minimal 20 karakter, dan keputusan terima membutuhkan skor baru.',
  path: ['response'],
});

/**
 * Dosen Pengampu memutuskan sanggahan: Terima, Tolak, atau Minta Penjelasan.
 */
export async function resolveGradeDisputeAction(
  input: unknown
): Promise<ActionResponse<{ disputeId: string; status: DisputeStatus; linkedChangeRequestId?: string | null }>> {
  const parsed = resolveDisputeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) return { ok: false, error: 'Sesi Anda telah kedaluwarsa.' };

  const isLecturerOrAdmin =
    auth.roles.includes('LECTURER') ||
    auth.roles.includes('SUPER_ADMIN');

  if (!isLecturerOrAdmin) {
    return { ok: false, error: 'Hanya Dosen Pengampu yang memiliki wewenang meninjau dan memutuskan sanggahan nilai.' };
  }

  const v = parsed.data;
  let linkedChangeRequestId: string | null = null;

  // Jika keputusan 'diterima' dan buku nilai sudah final -> buat draf grade_change_requests
  if (v.decision === 'diterima' && v.isGradebookFinal) {
    linkedChangeRequestId = randomUUID();
  }

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();

      if (linkedChangeRequestId) {
        // Buat draf grade_change_requests tertaut
        await supabase.from('grade_change_requests').insert({
          id: linkedChangeRequestId,
          status: 'DRAF',
          reason: `Hasil sanggah nilai mahasiswa: ${v.response}`,
          created_by: auth.user.id,
        });
      }

      const { error } = await supabase
        .from('grade_disputes')
        .update({
          status: v.decision,
          response: v.response,
          new_score: v.newScore ?? null,
          resolved_by: auth.user.id,
          resolved_at: new Date().toISOString(),
          linked_change_request_id: linkedChangeRequestId,
        })
        .eq('id', v.disputeId);

      if (error) return { ok: false, error: error.message };
    }
  } catch {
    // Memory
  }

  const dispute = disputesStore.find((d) => d.id === v.disputeId);
  if (dispute) {
    dispute.status = v.decision;
    dispute.response = v.response;
    dispute.new_score = v.newScore ?? null;
    dispute.resolved_by = auth.user.id;
    dispute.resolved_at = new Date().toISOString();
    dispute.linked_change_request_id = linkedChangeRequestId;

    // Kirim notifikasi keputusan kepada mahasiswa
    await notify({
      userId: dispute.student_id,
      type: 'DISPUTE_DECISION',
      title: `Sanggahan Nilai: ${v.decision === 'diterima' ? 'Disetujui' : v.decision === 'ditolak' ? 'Ditolak' : 'Permintaan Penjelasan'}`,
      body: v.response,
      classId: dispute.class_id,
      entityType: 'grade_disputes',
      entityId: dispute.id,
    });
  }

  // Audit log keputusan
  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Dosen',
    actorRole: auth.activeRole,
    action: `grade_dispute.resolve_${v.decision}`,
    entityType: 'grade_disputes',
    entityId: v.disputeId,
    description: `Sanggahan diputuskan '${v.decision}'. Skor baru: ${v.newScore ?? '-'}. Alasan: ${v.response}`,
    valueAfter: JSON.stringify(v),
  });

  revalidatePath('/lecturer/disputes');
  return {
    ok: true,
    data: {
      disputeId: v.disputeId,
      status: v.decision,
      linkedChangeRequestId,
    },
  };
}

/**
 * Mengirim pesan percakapan di dalam sanggahan nilai.
 */
export async function sendDisputeMessageAction(input: {
  disputeId: string;
  body: string;
}): Promise<ActionResponse<GradeDisputeMessageItem>> {
  if (!input.body || input.body.trim().length === 0) {
    return { ok: false, error: 'Pesan percakapan tidak boleh kosong.' };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) return { ok: false, error: 'Sesi Anda telah kedaluwarsa.' };

  const id = randomUUID();
  const item: GradeDisputeMessageItem = {
    id,
    dispute_id: input.disputeId,
    author_id: auth.user.id,
    author_name: auth.profile?.full_name || auth.user.email || 'Pengguna',
    body: input.body.trim(),
    created_at: new Date().toISOString(),
  };

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      await supabase.from('grade_dispute_messages').insert({
        id,
        dispute_id: input.disputeId,
        author_id: auth.user.id,
        body: input.body.trim(),
      });
    }
  } catch {
    // Memory
  }

  disputeMessagesStore.push(item);
  return { ok: true, data: item };
}

/**
 * Mengambil daftar sanggahan untuk dosen (dengan filter status opsional).
 */
export async function listClassDisputesAction(
  classId?: string,
  statusFilter?: DisputeStatus
): Promise<GradeDisputeItem[]> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) return [];

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      let query = supabase
        .from('grade_disputes')
        .select(`
          id, class_id, student_id, target_type, target_id, reason, evidence_path,
          status, response, old_score, new_score, resolved_by, resolved_at, linked_change_request_id, created_at,
          profiles:student_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (classId) query = query.eq('class_id', classId);
      if (statusFilter) query = query.eq('status', statusFilter);

      const { data } = await query;
      if (data) {
        return data.map((d: any) => ({
          id: d.id,
          class_id: d.class_id,
          student_id: d.student_id,
          student_name: d.profiles?.full_name,
          target_type: d.target_type,
          target_id: d.target_id,
          reason: d.reason,
          evidence_path: d.evidence_path,
          status: d.status,
          response: d.response,
          old_score: d.old_score,
          new_score: d.new_score,
          resolved_by: d.resolved_by,
          resolved_at: d.resolved_at,
          linked_change_request_id: d.linked_change_request_id,
          created_at: d.created_at,
        }));
      }
    }
  } catch {
    // Memory
  }

  let list = disputesStore;
  if (classId) list = list.filter((d) => d.class_id === classId);
  if (statusFilter) list = list.filter((d) => d.status === statusFilter);
  return list;
}

/**
 * Mengambil riwayat sanggahan milik mahasiswa yang sedang login.
 */
export async function getMyDisputesAction(): Promise<GradeDisputeItem[]> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) return [];

  return disputesStore.filter((d) => d.student_id === auth.user.id);
}

export async function getDisputesStore(): Promise<GradeDisputeItem[]> {
  return disputesStore;
}
