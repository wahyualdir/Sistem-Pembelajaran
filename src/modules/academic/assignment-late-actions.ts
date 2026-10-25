import { hasUserRole } from '@/lib/auth/server-guards';
'use server';

// Server Actions untuk Keterlambatan dan Perpanjangan Tenggat Tugas SIAJAR
// Mengacu pada Dokumen Instruksi Antigravity Versi 2 (Bagian 9.1)

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import { getEffectiveDates, calcLateMinutes, calcLatePenalty, calcFinalAssignmentScore } from '@/lib/akademik/late-penalty';
import type { ActionResponse } from '@/modules/identity/types';

export interface AssignmentExtensionItem {
  id: string;
  assignment_id: string;
  student_id: string | null;
  student_name?: string;
  group_id: string | null;
  group_name?: string;
  new_due_at: string;
  new_close_at: string | null;
  reason: string;
  granted_by: string;
  created_at: string;
}

// In-memory fallback store untuk pengujian dan lingkungan offline
const extensionStore: AssignmentExtensionItem[] =
  ((globalThis as any).__siajarExtensions ??= []);

const grantExtensionSchema = z.object({
  assignmentId: z.string().uuid('ID Tugas tidak valid.'),
  studentId: z.string().uuid().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
  newDueAt: z.string().datetime({ offset: true, message: 'Format tanggal tenggat baru tidak valid.' }),
  newCloseAt: z.string().datetime({ offset: true }).optional().nullable(),
  reason: z.string().trim().min(5, 'Alasan perpanjangan minimal 5 karakter.'),
}).refine((v) => (v.studentId ? 1 : 0) + (v.groupId ? 1 : 0) === 1, {
  message: 'Pilih tepat satu target: mahasiswa atau kelompok.',
  path: ['studentId'],
});

/**
 * Memberikan perpanjangan waktu pengumpulan tugas kepada mahasiswa atau kelompok tertentu.
 * Hanya DOSEN pengampu kelas.
 */
export async function grantAssignmentExtensionAction(
  input: unknown
): Promise<ActionResponse<AssignmentExtensionItem>> {
  const parsed = grantExtensionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const isLecturerOrAdmin = hasUserRole(auth, ['LECTURER', 'SUPER_ADMIN']);

  if (!isLecturerOrAdmin) {
    return { ok: false, error: 'Hanya Dosen Pengampu yang memiliki wewenang memberikan perpanjangan tenggat.' };
  }

  const v = parsed.data;
  const id = randomUUID();

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();

      // Cek tenggat asli tugas
      const { data: assignment, error: aErr } = await supabase
        .from('assignments')
        .select('id, due_at, close_at, class_id')
        .eq('id', v.assignmentId)
        .maybeSingle();

      if (aErr || !assignment) {
        return { ok: false, error: 'Tugas tidak ditemukan.' };
      }

      // Validasi bahwa tenggat baru lebih besar dari tenggat asli
      if (new Date(v.newDueAt).getTime() <= new Date(assignment.due_at).getTime()) {
        return { ok: false, error: 'Tenggat baru perpanjangan harus lebih lama dari tenggat asli tugas.' };
      }

      const { data, error } = await supabase
        .from('assignment_extensions')
        .insert({
          id,
          assignment_id: v.assignmentId,
          student_id: v.studentId ?? null,
          group_id: v.groupId ?? null,
          new_due_at: v.newDueAt,
          new_close_at: v.newCloseAt ?? null,
          reason: v.reason,
          granted_by: auth.user.id,
        })
        .select()
        .single();

      if (error) {
        return { ok: false, error: `Gagal menyimpan perpanjangan: ${error.message}` };
      }

      await recordSystemAuditLog({
        actorId: auth.user.id,
        actorName: auth.profile?.full_name || auth.user.email || 'Dosen',
        actorRole: auth.activeRole,
        action: 'assignment.grant_extension',
        entityType: 'assignment_extensions',
        entityId: id,
        scopeType: 'CLASS',
        scopeId: assignment.class_id,
        description: `Perpanjangan tenggat tugas diberikan sampai ${v.newDueAt}. Alasan: ${v.reason}`,
        valueAfter: JSON.stringify(v),
      });

      revalidatePath(`/classes/[id]/assignments/${v.assignmentId}`);
      return { ok: true, data: data as AssignmentExtensionItem };
    }
  } catch (err: any) {
    // Abaikan dan gunakan fallback memory store
  }

  // Fallback in-memory store
  const item: AssignmentExtensionItem = {
    id,
    assignment_id: v.assignmentId,
    student_id: v.studentId ?? null,
    group_id: v.groupId ?? null,
    new_due_at: v.newDueAt,
    new_close_at: v.newCloseAt ?? null,
    reason: v.reason,
    granted_by: auth.user.id,
    created_at: new Date().toISOString(),
  };

  extensionStore.push(item);

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Dosen',
    actorRole: auth.activeRole,
    action: 'assignment.grant_extension',
    entityType: 'assignment_extensions',
    entityId: id,
    description: `Perpanjangan tenggat tugas diberikan sampai ${v.newDueAt}. Alasan: ${v.reason}`,
    valueAfter: JSON.stringify(v),
  });

  return { ok: true, data: item };
}

/**
 * Menghapus/memutihkan penalti keterlambatan pada pengumpulan tertentu (Dosen dengan alasan wajib).
 */
export async function waiveLatePenaltyAction(input: {
  submissionId: string;
  reason: string;
}): Promise<ActionResponse<{ submissionId: string; penaltyWaived: boolean }>> {
  if (!input.submissionId || !input.reason || input.reason.trim().length < 5) {
    return { ok: false, error: 'Alasan penghapusan penalti minimal 5 karakter.' };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const isLecturerOrAdmin = hasUserRole(auth, ['LECTURER', 'SUPER_ADMIN']);

  if (!isLecturerOrAdmin) {
    return { ok: false, error: 'Hanya Dosen Pengampu yang berwenang menghapus penalti keterlambatan.' };
  }

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { error } = await supabase
        .from('submissions')
        .update({
          penalty_waived: true,
          penalty_waived_reason: input.reason.trim(),
        })
        .eq('id', input.submissionId);

      if (error) {
        return { ok: false, error: `Gagal memperbarui status penalti: ${error.message}` };
      }
    }
  } catch {
    // Lanjut ke pencatatan audit log
  }

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Dosen',
    actorRole: auth.activeRole,
    action: 'submission.waive_penalty',
    entityType: 'submissions',
    entityId: input.submissionId,
    description: `Penalti keterlambatan dihapus. Alasan: ${input.reason.trim()}`,
    valueAfter: JSON.stringify({ penalty_waived: true, reason: input.reason.trim() }),
  });

  return { ok: true, data: { submissionId: input.submissionId, penaltyWaived: true } };
}

/**
 * Mengambil daftar perpanjangan tenggat pada suatu tugas.
 */
export async function listAssignmentExtensionsAction(
  assignmentId: string
): Promise<AssignmentExtensionItem[]> {
  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('assignment_extensions')
        .select(`
          id, assignment_id, student_id, group_id, new_due_at, new_close_at, reason, granted_by, created_at,
          profiles:student_id (full_name)
        `)
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          assignment_id: d.assignment_id,
          student_id: d.student_id,
          student_name: d.profiles?.full_name,
          group_id: d.group_id,
          new_due_at: d.new_due_at,
          new_close_at: d.new_close_at,
          reason: d.reason,
          granted_by: d.granted_by,
          created_at: d.created_at,
        }));
      }
    }
  } catch {
    // Fallback in-memory
  }

  return extensionStore.filter((e) => e.assignment_id === assignmentId);
}

/**
 * Menghitung tenggat efektif mahasiswa untuk suatu tugas (memeriksa perpanjangan individu atau kelompok).
 */
export async function getStudentEffectiveAssignmentDatesAction(
  assignmentId: string,
  studentId: string,
  groupId?: string
): Promise<{
  dueAt: string;
  closeAt: string | null;
  effectiveDueAt: string;
  effectiveCloseAt: string | null;
  hasExtension: boolean;
  extensionReason: string | null;
}> {
  let baseDue = new Date().toISOString();
  let baseClose: string | null = null;

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data: a } = await supabase
        .from('assignments')
        .select('due_at, close_at')
        .eq('id', assignmentId)
        .maybeSingle();

      if (a) {
        baseDue = a.due_at;
        baseClose = a.close_at;
      }
    }
  } catch {
    // Gunakan bawaan
  }

  // Cari perpanjangan
  const extensions = await listAssignmentExtensionsAction(assignmentId);
  const ext = extensions.find(
    (e) => e.student_id === studentId || (groupId && e.group_id === groupId)
  );

  const { effectiveDueAt, effectiveCloseAt } = getEffectiveDates({
    dueAt: baseDue,
    closeAt: baseClose,
    extensionNewDueAt: ext?.new_due_at,
    extensionNewCloseAt: ext?.new_close_at,
  });

  return {
    dueAt: baseDue,
    closeAt: baseClose,
    effectiveDueAt: effectiveDueAt.toISOString(),
    effectiveCloseAt: effectiveCloseAt ? effectiveCloseAt.toISOString() : null,
    hasExtension: Boolean(ext),
    extensionReason: ext?.reason ?? null,
  };
}

export async function getExtensionStore(): Promise<AssignmentExtensionItem[]> {
  return extensionStore;
}
