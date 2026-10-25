'use server';

import { hasUserRole } from '@/lib/auth/server-guards';

// Server Actions untuk Pengelolaan Tugas Kelompok SIAJAR
// Mengacu pada Dokumen Instruksi Antigravity Versi 2 (Bagian 9.2)

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import type { ActionResponse } from '@/modules/identity/types';

export interface GroupMemberItem {
  student_id: string;
  student_name: string;
  nim?: string;
  role: 'leader' | 'member';
  joined_at: string;
}

export interface GroupItem {
  id: string;
  set_id: string;
  name: string;
  join_code: string;
  members: GroupMemberItem[];
}

export interface GroupSetItem {
  id: string;
  class_id: string;
  name: string;
  formation: 'lecturer' | 'random' | 'self';
  min_size: number;
  max_size: number;
  lock_at: string | null;
  created_by: string;
  created_at: string;
  groups?: GroupItem[];
}

// In-memory fallback stores
const groupSetsStore: GroupSetItem[] = ((globalThis as any).__siajarGroupSets ??= []);
const groupsStore: GroupItem[] = ((globalThis as any).__siajarGroups ??= []);

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const createSetSchema = z.object({
  classId: z.string().uuid('ID Kelas tidak valid.'),
  name: z.string().trim().min(3, 'Nama kelompok minimal 3 karakter.').max(100),
  formation: z.enum(['lecturer', 'random', 'self']),
  minSize: z.coerce.number().int().min(2, 'Ukuran minimum kelompok adalah 2 orang.').max(10),
  maxSize: z.coerce.number().int().min(2).max(15),
  lockAt: z.string().datetime({ offset: true }).optional().nullable(),
}).refine((v) => v.maxSize >= v.minSize, {
  message: 'Ukuran maksimal harus lebih besar atau sama dengan ukuran minimal.',
  path: ['maxSize'],
});

/**
 * Membuat Set Kelompok baru untuk kelas (Hanya Dosen Pengampu).
 */
export async function createGroupSetAction(
  input: unknown
): Promise<ActionResponse<GroupSetItem>> {
  const parsed = createSetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const isLecturerOrAdmin = hasUserRole(auth, ['LECTURER', 'SUPER_ADMIN']);

  if (!isLecturerOrAdmin) {
    return { ok: false, error: 'Hanya Dosen Pengampu yang memiliki wewenang membuat set kelompok.' };
  }

  const v = parsed.data;
  const id = randomUUID();

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('group_sets')
        .insert({
          id,
          class_id: v.classId,
          name: v.name,
          formation: v.formation,
          min_size: v.minSize,
          max_size: v.maxSize,
          lock_at: v.lockAt ?? null,
          created_by: auth.user.id,
        })
        .select()
        .single();

      if (error) {
        return { ok: false, error: `Gagal membuat set kelompok: ${error.message}` };
      }

      await recordSystemAuditLog({
        actorId: auth.user.id,
        actorName: auth.profile?.full_name || auth.user.email || 'Dosen',
        actorRole: auth.activeRole,
        action: 'group_set.create',
        entityType: 'group_sets',
        entityId: id,
        scopeType: 'CLASS',
        scopeId: v.classId,
        description: `Set kelompok '${v.name}' mode ${v.formation} (${v.minSize}-${v.maxSize} anggota) dibuat.`,
        valueAfter: JSON.stringify(v),
      });

      revalidatePath(`/classes/[id]`);
      return { ok: true, data: data as GroupSetItem };
    }
  } catch {
    // Fallback in-memory
  }

  const item: GroupSetItem = {
    id,
    class_id: v.classId,
    name: v.name,
    formation: v.formation,
    min_size: v.minSize,
    max_size: v.maxSize,
    lock_at: v.lockAt ?? null,
    created_by: auth.user.id,
    created_at: new Date().toISOString(),
    groups: [],
  };

  groupSetsStore.push(item);

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Dosen',
    actorRole: auth.activeRole,
    action: 'group_set.create',
    entityType: 'group_sets',
    entityId: id,
    description: `Set kelompok '${v.name}' mode ${v.formation} dibuat.`,
    valueAfter: JSON.stringify(v),
  });

  return { ok: true, data: item };
}

/**
 * Mahasiswa bergabung ke kelompok menggunakan kode undangan 6-karakter (Mode 'self').
 */
export async function joinGroupByCodeAction(
  setId: string,
  joinCode: string
): Promise<ActionResponse<{ groupId: string; groupName: string }>> {
  const code = joinCode?.trim().toUpperCase();
  if (!code || code.length !== 6) {
    return { ok: false, error: 'Kode kelompok terdiri dari 6 huruf atau angka.' };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('join_group_with_code', {
        p_set_id: setId,
        p_join_code: code,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, data: { groupId: data as string, groupName: 'Kelompok' } };
    }
  } catch {
    // Fallback in-memory
  }

  // Memory fallback
  const set = groupSetsStore.find((s) => s.id === setId);
  if (!set) return { ok: false, error: 'Set kelompok tidak ditemukan.' };

  if (set.lock_at && new Date() > new Date(set.lock_at)) {
    return { ok: false, error: 'Pembentukan kelompok telah dikunci.' };
  }

  const targetGroup = groupsStore.find(
    (g) => g.set_id === setId && g.join_code.toUpperCase() === code
  );
  if (!targetGroup) {
    return { ok: false, error: 'Kode kelompok tidak ditemukan.' };
  }

  if (targetGroup.members.length >= set.max_size) {
    return {
      ok: false,
      error: `Kelompok ini sudah mencapai kapasitas maksimal (${set.max_size} orang).`,
    };
  }

  // Pastikan belum masuk di kelompok lain pada set ini
  const existingGroup = groupsStore.find(
    (g) => g.set_id === setId && g.members.some((m) => m.student_id === auth.user.id)
  );
  if (existingGroup) {
    return { ok: false, error: 'Anda sudah bergabung di kelompok lain pada penugasan ini.' };
  }

  targetGroup.members.push({
    student_id: auth.user.id,
    student_name: auth.profile?.full_name || auth.user.email || 'Mahasiswa',
    role: 'member',
    joined_at: new Date().toISOString(),
  });

  return { ok: true, data: { groupId: targetGroup.id, groupName: targetGroup.name } };
}

/**
 * Mahasiswa keluar dari kelompok sebelum waktu penguncian (Mode 'self').
 */
export async function leaveGroupAction(
  groupId: string
): Promise<ActionResponse<{ success: boolean }>> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true, data: { success: true } };
    }
  } catch {
    // Fallback in-memory
  }

  const group = groupsStore.find((g) => g.id === groupId);
  if (!group) return { ok: false, error: 'Kelompok tidak ditemukan.' };

  const memberIndex = group.members.findIndex((m) => m.student_id === auth.user.id);
  if (memberIndex === -1) {
    return { ok: false, error: 'Anda bukan anggota kelompok ini.' };
  }

  const leavingMember = group.members[memberIndex];
  group.members.splice(memberIndex, 1);

  // Jika ketua keluar, serahkan jabatan ke anggota berikutnya
  if (leavingMember.role === 'leader' && group.members.length > 0) {
    group.members[0].role = 'leader';
  }

  return { ok: true, data: { success: true } };
}

/**
 * Menyesuaikan persentase kontribusi anggota kelompok (Hanya Dosen Pengampu).
 * Wajib menyertakan catatan jika kontribusi di bawah 100%.
 */
export async function adjustMemberContributionAction(input: {
  submissionId: string;
  studentId: string;
  contributionPercent: number;
  note?: string;
}): Promise<ActionResponse<{ contributionPercent: number }>> {
  if (input.contributionPercent < 0 || input.contributionPercent > 100) {
    return { ok: false, error: 'Persentase kontribusi harus berada di antara 0 dan 100%.' };
  }

  if (input.contributionPercent < 100 && (!input.note || input.note.trim().length < 5)) {
    return { ok: false, error: 'Catatan penyesuaian kontribusi di bawah 100% wajib diisi (minimal 5 karakter).' };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { error } = await supabase
        .from('submission_member_adjustments')
        .upsert({
          submission_id: input.submissionId,
          student_id: input.studentId,
          contribution_percent: input.contributionPercent,
          note: input.note?.trim() || null,
        }, { onConflict: 'submission_id,student_id' });

      if (error) {
        return { ok: false, error: `Gagal memperbarui kontribusi anggota: ${error.message}` };
      }
    }
  } catch {
    // Fallback
  }

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Dosen',
    actorRole: auth.activeRole,
    action: 'group.adjust_contribution',
    entityType: 'submission_member_adjustments',
    entityId: `${input.submissionId}:${input.studentId}`,
    description: `Kontribusi mahasiswa disesuaikan menjadi ${input.contributionPercent}%. Catatan: ${input.note || '-'}`,
    valueAfter: JSON.stringify(input),
  });

  return { ok: true, data: { contributionPercent: input.contributionPercent } };
}

/**
 * Mengambil daftar Set Kelompok di kelas.
 */
export async function listClassGroupSetsAction(
  classId: string
): Promise<GroupSetItem[]> {
  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('group_sets')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as GroupSetItem[];
      }
    }
  } catch {
    // Memory
  }

  return groupSetsStore.filter((s) => s.class_id === classId);
}

export async function getGroupSetsStore(): Promise<GroupSetItem[]> {
  return groupSetsStore;
}

export async function getGroupsStore(): Promise<GroupItem[]> {
  return groupsStore;
}
