'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { revalidatePath } from 'next/cache';

export interface CloneClassInput {
  sourceClassId: string;
  targetClassId: string;
  options: {
    materials?: boolean;
    assignments?: boolean;
    quizzes?: boolean;
    rubrics?: boolean;
    gamification?: boolean;
    cpmk?: boolean;
    assistants?: boolean;
  };
  dateShiftDays?: number;
}

export async function cloneClassAction(input: CloneClassInput) {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, pesan: 'Sesi masuk telah berakhir. Silakan masuk kembali.' };
  }

  const allowedRoles = ['LECTURER', 'ACADEMIC_STAFF', 'SUPER_ADMIN'];
  if (!user.roles.some(r => allowedRoles.includes(r))) {
    return { ok: false, pesan: 'Anda tidak memiliki wewenang untuk menyalin kelas.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('clone_class', {
    p_source_id: input.sourceClassId,
    p_target_id: input.targetClassId,
    p_options: input.options,
    p_date_shift_days: input.dateShiftDays || 0
  });

  if (error) {
    return { ok: false, pesan: `Gagal menyalin kelas: ${error.message}` };
  }

  const res = data as any;
  if (!res.ok) {
    return { ok: false, pesan: res.pesan || 'Gagal menyalin kelas.' };
  }

  revalidatePath('/classes');
  revalidatePath('/staff/classes');
  return { ok: true, data: res };
}

export async function archiveClassAction(classId: string, reason: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, pesan: 'Sesi masuk telah berakhir.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('archive_class', {
    p_class_id: classId,
    p_reason: reason || 'Diarsipkan oleh dosen/staf'
  });

  if (error) {
    return { ok: false, pesan: `Gagal mengarsipkan kelas: ${error.message}` };
  }

  const res = data as any;
  if (!res.ok) {
    return { ok: false, pesan: res.pesan };
  }

  revalidatePath('/classes');
  revalidatePath('/staff/classes');
  return { ok: true, pesan: 'Kelas berhasil diarsipkan.' };
}

export async function unarchiveClassAction(classId: string, reason: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, pesan: 'Sesi masuk telah berakhir.' };
  }

  const isStaff = user.roles.some(r => ['ACADEMIC_STAFF', 'SUPER_ADMIN'].includes(r));
  if (!isStaff) {
    return { ok: false, pesan: 'Hanya Staf Akademik atau Super Admin yang dapat membuka arsip kelas.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('unarchive_class', {
    p_class_id: classId,
    p_reason: reason || 'Arsip dibuka kembali oleh staf'
  });

  if (error) {
    return { ok: false, pesan: `Gagal membuka arsip kelas: ${error.message}` };
  }

  const res = data as any;
  if (!res.ok) {
    return { ok: false, pesan: res.pesan };
  }

  revalidatePath('/classes');
  revalidatePath('/staff/classes');
  return { ok: true, pesan: 'Arsip kelas berhasil dibuka kembali.' };
}

/**
 * Tutup Semester & Arsipkan Kelas Massal (Staf Akademik)
 */
export async function bulkArchiveSemesterAction(semesterId: string, reason: string) {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, pesan: 'Sesi masuk telah berakhir.' };
  }

  const isStaff = user.roles.some(r => ['ACADEMIC_STAFF', 'SUPER_ADMIN'].includes(r));
  if (!isStaff) {
    return { ok: false, pesan: 'Hanya Staf Akademik yang dapat menutup semester.' };
  }

  const supabase = await createClient();

  // Ambil semua kelas aktif
  const { data: activeClasses, error: fetchError } = await supabase
    .from('classes')
    .select('id, title')
    .neq('status', 'ARCHIVED');

  if (fetchError || !activeClasses) {
    return { ok: false, pesan: `Gagal memuat daftar kelas: ${fetchError?.message}` };
  }

  let count = 0;
  for (const c of activeClasses) {
    await supabase.rpc('archive_class', {
      p_class_id: c.id,
      p_reason: reason || 'Penutupan semester massal oleh staf'
    });
    count++;
  }

  revalidatePath('/classes');
  revalidatePath('/staff/classes');
  return {
    ok: true,
    pesan: `Berhasil mengarsipkan ${count} kelas untuk penutupan semester.`
  };
}
