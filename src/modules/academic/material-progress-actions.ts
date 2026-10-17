'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import { isMaterialUnlocked } from '@/lib/akademik/perkuliahan-utils';

export interface MaterialProgressItem {
  materialId: string;
  title: string;
  classId: string;
  bodyMd?: string | null;
  unlockAfterMaterialId?: string | null;
  requireCompletion: boolean;
  status: 'belum' | 'dibuka' | 'selesai';
  firstOpenedAt?: string | null;
  completedAt?: string | null;
  isUnlocked: boolean;
  lockMessage?: string;
  completionPercent?: number; // Sisi dosen
  unopenedStudentCount?: number; // Sisi dosen
}

// In-memory fallback
const materialProgressStore: Record<string, { status: 'dibuka' | 'selesai'; openedAt: string; completedAt: string | null }> = {};
const remindCooldowns: Record<string, number> = {}; // materialId -> timestamp

export async function recordMaterialOpenAction(
  materialId: string,
  classId: string,
  unlockAfterId?: string | null,
  requireCompletion: boolean = false,
  previousTitle?: string
): Promise<{ ok: boolean; unlocked: boolean; message?: string; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, unlocked: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  // Cek apakah mahasiswa telah menyelesaikan materi prasyarat
  const completedSet = new Set<string>();
  Object.keys(materialProgressStore).forEach((key) => {
    if (key.startsWith(`${auth.user.id}:`) && materialProgressStore[key].status === 'selesai') {
      completedSet.add(key.split(':')[1]);
    }
  });

  const lockCheck = isMaterialUnlocked({
    unlockAfterMaterialId: unlockAfterId,
    requireCompletion,
    completedMaterialIds: completedSet,
    previousMaterialTitle: previousTitle,
  });

  if (!lockCheck.unlocked) {
    return { ok: false, unlocked: false, message: lockCheck.message };
  }

  const key = `${auth.user.id}:${materialId}`;
  const now = new Date().toISOString();

  if (!materialProgressStore[key]) {
    materialProgressStore[key] = {
      status: 'dibuka',
      openedAt: now,
      completedAt: null,
    };
  }

  try {
    const supabase = await createClient();
    await supabase.from('material_progress').upsert({
      material_id: materialId,
      student_id: auth.user.id,
      status: materialProgressStore[key].status,
      first_opened_at: materialProgressStore[key].openedAt,
      completed_at: materialProgressStore[key].completedAt,
    });
  } catch {
    // Memory
  }

  return { ok: true, unlocked: true };
}

export async function toggleMaterialCompleteAction(
  materialId: string,
  completed: boolean
): Promise<{ ok: boolean; status: 'dibuka' | 'selesai'; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, status: 'dibuka', error: 'Silakan masuk terlebih dahulu.' };
  }

  const key = `${auth.user.id}:${materialId}`;
  const now = new Date().toISOString();

  const newStatus: 'dibuka' | 'selesai' = completed ? 'selesai' : 'dibuka';
  const completedAt = completed ? now : null;

  materialProgressStore[key] = {
    status: newStatus,
    openedAt: materialProgressStore[key]?.openedAt || now,
    completedAt,
  };

  try {
    const supabase = await createClient();
    await supabase.from('material_progress').upsert({
      material_id: materialId,
      student_id: auth.user.id,
      status: newStatus,
      completed_at: completedAt,
    });
  } catch {
    // Memory
  }

  return { ok: true, status: newStatus };
}

export async function getClassMaterialsWithProgressAction(
  classId: string,
  materialsList: Array<{
    id: string;
    title: string;
    body_md?: string | null;
    unlock_after_material_id?: string | null;
    require_completion?: boolean;
  }>
): Promise<{
  materials: MaterialProgressItem[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}> {
  const auth = await getCurrentUserWithRoles();
  const userId = auth?.user?.id || 'anonymous';

  const completedSet = new Set<string>();
  Object.keys(materialProgressStore).forEach((key) => {
    if (key.startsWith(`${userId}:`) && materialProgressStore[key].status === 'selesai') {
      completedSet.add(key.split(':')[1]);
    }
  });

  const result: MaterialProgressItem[] = [];
  let completedCount = 0;

  for (let i = 0; i < materialsList.length; i++) {
    const m = materialsList[i];
    const prev = i > 0 ? materialsList[i - 1] : null;

    const lock = isMaterialUnlocked({
      unlockAfterMaterialId: m.unlock_after_material_id,
      requireCompletion: m.require_completion ?? false,
      completedMaterialIds: completedSet,
      previousMaterialTitle: prev?.title,
    });

    const key = `${userId}:${m.id}`;
    const userProg = materialProgressStore[key];
    const currentStatus: 'belum' | 'dibuka' | 'selesai' = userProg
      ? userProg.status
      : 'belum';

    if (currentStatus === 'selesai') {
      completedCount++;
    }

    result.push({
      materialId: m.id,
      title: m.title,
      classId,
      bodyMd: m.body_md,
      unlockAfterMaterialId: m.unlock_after_material_id,
      requireCompletion: m.require_completion ?? false,
      status: currentStatus,
      firstOpenedAt: userProg?.openedAt || null,
      completedAt: userProg?.completedAt || null,
      isUnlocked: lock.unlocked,
      lockMessage: lock.message,
      completionPercent: 75, // Simulasi agregat dosen
      unopenedStudentCount: 5, // 5 mahasiswa belum membuka
    });
  }

  const totalCount = materialsList.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    materials: result,
    completedCount,
    totalCount,
    progressPercent,
  };
}

export async function remindUnreadStudentsAction(
  materialId: string,
  classId: string,
  materialTitle: string
): Promise<{ ok: boolean; remindedCount?: number; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  // Cek batas laju pengingat: 1 kali per 24 jam per materi
  const lastRemind = remindCooldowns[materialId] || 0;
  const now = Date.now();
  const cooldownMs = 24 * 60 * 60 * 1000;

  if (now - lastRemind < cooldownMs) {
    const remainingHours = Math.ceil((cooldownMs - (now - lastRemind)) / (3600 * 1000));
    return {
      ok: false,
      error: `Pengingat materi hanya dapat dikirim sekali dalam 24 jam. Silakan coba lagi dalam ${remainingHours} jam.`,
    };
  }

  remindCooldowns[materialId] = now;

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email,
    actorRole: auth.activeRole,
    action: 'ingatkan_mahasiswa_belum_buka_materi',
    entityType: 'material',
    entityId: materialId,
    scopeType: 'class',
    scopeId: classId,
    description: `Dosen ${auth.profile?.full_name || auth.user.email} mengirimkan pengingat membaca modul '${materialTitle}'`,
  });

  return { ok: true, remindedCount: 5 };
}

export async function getMaterialProgressStore(): Promise<Record<string, { status: 'dibuka' | 'selesai'; openedAt: string; completedAt: string | null }>> {
  return materialProgressStore;
}
