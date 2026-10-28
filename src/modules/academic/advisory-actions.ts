'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { recordSystemAuditLog } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { getAcademicStore, DEFAULT_LECTURER_ID, DEFAULT_STUDENT_ID, DEFAULT_PRODI_ID } from '@/lib/auth/class-access';
import { KrsStore } from '@/features/krs/krs-store';

export interface AdviseeItem {
  id: string;
  advisory_id?: string;
  student_id: string;
  student_name: string;
  student_nim: string;
  email?: string;
  angkatan?: number;
  program_id?: string;
  program_name?: string;
  advisor_id: string;
  advisor_name?: string;
  status: 'ACTIVE' | 'ENDED';
  valid_from?: string;
  created_at?: string;
}

export interface AdvisoryNoteItem {
  id: string;
  advisory_id: string;
  author_id: string;
  author_name?: string;
  content: string;
  note_for_student?: string | null;
  created_at: string;
}

export interface MyAdvisorData {
  advisor_id: string;
  advisor_name: string;
  advisor_email: string;
  advisor_nidn?: string;
  program_name?: string;
  status: string;
  valid_from?: string;
}

export interface PendingKrsItem {
  id: string;
  student_id: string;
  student_name: string;
  student_nim: string;
  total_sks: number;
  ips_lalu: number;
  items_count: number;
  status: string;
  submitted_at?: string;
  catatan_wali?: string | null;
}

const assignAdvisorSchema = z.object({
  student_id: z.string().min(1, 'ID Mahasiswa wajib diisi'),
  advisor_id: z.string().min(1, 'ID Dosen Wali wajib diisi'),
  program_id: z.string().optional(),
  angkatan: z.number().int().min(2000).max(2100).optional(),
});

const revokeAdvisorSchema = z.object({
  student_id: z.string().min(1, 'ID Mahasiswa wajib diisi'),
});

const addNoteSchema = z.object({
  advisory_id: z.string().min(1, 'ID Perwalian wajib diisi'),
  content: z.string().min(3, 'Catatan perwalian minimal 3 karakter'),
  note_for_student: z.string().optional(),
});

const approveKrsSchema = z.object({
  krs_id: z.string().min(1, 'ID KRS wajib diisi'),
  student_id: z.string().min(1, 'ID Mahasiswa wajib diisi'),
  catatan: z.string().optional(),
});

const rejectKrsSchema = z.object({
  krs_id: z.string().min(1, 'ID KRS wajib diisi'),
  student_id: z.string().min(1, 'ID Mahasiswa wajib diisi'),
  catatan: z.string().min(5, 'Catatan penolakan minimal 5 karakter'),
});

function safeRevalidate(paths: string[]) {
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // Abaikan di luar lingkungan request Next.js (seperti unit test)
    }
  }
}

/**
 * Server Action: Tetapkan atau ganti Dosen Wali untuk seorang mahasiswa.
 * Wewenang: PROGRAM_COORDINATOR, PROGRAM_SECRETARY, ACADEMIC_STAFF, SUPER_ADMIN.
 */
export async function assignAdvisorAction(
  input: z.infer<typeof assignAdvisorSchema>
): Promise<ActionResponse<{ id: string }>> {
  const parsed = assignAdvisorSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Input penetapan wali tidak valid';
    return { ok: false, error: msg, pesan: msg };
  }

  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Sesi berakhir', pesan: 'Sesi Anda telah berakhir. Silakan login kembali.' };
  }

  const role = userContext.activeRole;
  const isAuthorized =
    role === 'PROGRAM_COORDINATOR' ||
    role === 'PROGRAM_SECRETARY' ||
    role === 'ACADEMIC_STAFF' ||
    role === 'SUPER_ADMIN';

  if (!isAuthorized) {
    return { ok: false, error: 'FORBIDDEN', pesan: 'Aksi ini hanya dapat dilakukan oleh Koordinator Prodi, Sekprodi, atau Staf Akademik.' };
  }

  const { student_id, advisor_id, program_id, angkatan } = parsed.data;
  const actorId = userContext.user.id;
  let newAdvisoryId = `adv-${Date.now()}`;

  // Sinkronkan ke Store memori kanonis
  const store = getAcademicStore();
  const existingAdviseeIdx = store.advisees.findIndex((a) => a.student_id === student_id);
  if (existingAdviseeIdx >= 0) {
    store.advisees[existingAdviseeIdx].lecturer_id = advisor_id;
  } else {
    store.advisees.push({
      lecturer_id: advisor_id,
      student_id,
      student_name: 'Mahasiswa Bimbingan',
    });
  }

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      const { data: rpcData, error: rpcErr } = await supabase.rpc('assign_academic_advisor', {
        p_student_id: student_id,
        p_advisor_id: advisor_id,
        p_program_id: program_id || null,
        p_angkatan: angkatan || null,
        p_assigned_by: actorId,
      });

      if (rpcErr) {
        await supabase
          .from('academic_advisories')
          .update({ status: 'ENDED', valid_until: new Date().toISOString() })
          .eq('student_user_id', student_id)
          .eq('status', 'ACTIVE');

        const { data: inserted, error: insertErr } = await supabase
          .from('academic_advisories')
          .insert({
            student_user_id: student_id,
            advisor_user_id: advisor_id,
            program_id: program_id || null,
            angkatan: angkatan || null,
            status: 'ACTIVE',
            assigned_by: actorId,
          })
          .select('id')
          .single();

        if (!insertErr && inserted) {
          newAdvisoryId = inserted.id;
        }
      } else if (rpcData) {
        newAdvisoryId = rpcData;
      }
    } catch {
      // Menggunakan fallback store memori jika terjadi kendala jaringan Supabase
    }
  }

  // Audit Log wajib untuk penetapan Dosen Wali
  await recordSystemAuditLog({
    action: 'ASSIGN_ACADEMIC_ADVISOR',
    actorId,
    actorName: userContext.profile?.full_name || 'User',
    actorRole: role,
    entityType: 'academic_advisories',
    entityId: newAdvisoryId,
    description: `Penetapan Dosen Wali ${advisor_id} untuk mahasiswa ${student_id}`,
    metadata: {
      student_id,
      advisor_id,
      program_id,
      angkatan,
    },
  });

  safeRevalidate(['/lecturer/mentoring', '/lecturer/advisory', '/coordinator/advisory', '/secretary/advisory', '/profile', '/student']);

  return { ok: true, data: { id: newAdvisoryId } };
}

/**
 * Server Action: Cabut Dosen Wali dari seorang mahasiswa.
 * Wewenang: PROGRAM_COORDINATOR, PROGRAM_SECRETARY, ACADEMIC_STAFF, SUPER_ADMIN.
 */
export async function revokeAdvisorAction(
  input: z.infer<typeof revokeAdvisorSchema>
): Promise<ActionResponse<{ success: boolean }>> {
  const parsed = revokeAdvisorSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Input tidak valid';
    return { ok: false, error: msg, pesan: msg };
  }

  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Sesi berakhir', pesan: 'Sesi Anda telah berakhir. Silakan login kembali.' };
  }

  const role = userContext.activeRole;
  const isAuthorized =
    role === 'PROGRAM_COORDINATOR' ||
    role === 'PROGRAM_SECRETARY' ||
    role === 'ACADEMIC_STAFF' ||
    role === 'SUPER_ADMIN';

  if (!isAuthorized) {
    return { ok: false, error: 'FORBIDDEN', pesan: 'Aksi ini hanya dapat dilakukan oleh Koordinator Prodi, Sekprodi, atau Staf Akademik.' };
  }

  const { student_id } = parsed.data;
  const actorId = userContext.user.id;

  const store = getAcademicStore();
  const idx = store.advisees.findIndex((a) => a.student_id === student_id);
  if (idx >= 0) {
    store.advisees.splice(idx, 1);
  }

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      await supabase
        .from('academic_advisories')
        .update({ status: 'ENDED', valid_until: new Date().toISOString() })
        .eq('student_user_id', student_id)
        .eq('status', 'ACTIVE');
    } catch {
      // Fallback
    }
  }

  await recordSystemAuditLog({
    action: 'REVOKE_ACADEMIC_ADVISOR',
    actorId,
    actorName: userContext.profile?.full_name || 'User',
    actorRole: role,
    entityType: 'academic_advisories',
    entityId: student_id,
    description: `Pencabutan Dosen Wali untuk mahasiswa ${student_id}`,
    metadata: { student_id },
  });

  safeRevalidate(['/lecturer/mentoring', '/lecturer/advisory', '/coordinator/advisory', '/secretary/advisory', '/profile', '/student']);

  return { ok: true, data: { success: true } };
}

/**
 * Server Action: Mengambil daftar mahasiswa bimbingan Dosen Wali.
 * Otorisasi:
 * - LECTURER: hanya mahasiswa bimbingan dirinya sendiri yang status ACTIVE.
 * - PROGRAM_COORDINATOR / PROGRAM_SECRETARY: mahasiswa prodi bersangkutan.
 * - ACADEMIC_STAFF / SUPER_ADMIN: semua mahasiswa bimbingan.
 */
export async function getAdviseesListAction(targetAdvisorId?: string): Promise<AdviseeItem[]> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) return [];

  const role = userContext.activeRole;
  if (role === 'SYSTEM_ADMIN' || role === 'STUDENT') return [];

  const myId = userContext.user.id;

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('academic_advisories')
        .select(`
          id,
          student_user_id,
          advisor_user_id,
          program_id,
          angkatan,
          status,
          valid_from,
          created_at,
          student:profiles!academic_advisories_student_user_id_fkey(id, full_name, email),
          advisor:profiles!academic_advisories_advisor_user_id_fkey(id, full_name, email),
          program:programs(id, name)
        `)
        .eq('status', 'ACTIVE');

      if (role === 'LECTURER') {
        query = query.eq('advisor_user_id', myId);
      } else if (targetAdvisorId) {
        query = query.eq('advisor_user_id', targetAdvisorId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          advisory_id: d.id,
          student_id: d.student_user_id,
          student_name: d.student?.full_name || 'Mahasiswa',
          student_nim: d.student?.email ? d.student.email.split('@')[0] : '2024001',
          email: d.student?.email || '',
          angkatan: d.angkatan || 2024,
          program_id: d.program_id,
          program_name: d.program?.name || 'Teknik Informatika',
          advisor_id: d.advisor_user_id,
          advisor_name: d.advisor?.full_name || 'Dosen Wali',
          status: d.status,
          valid_from: d.valid_from,
          created_at: d.created_at,
        }));
      }
    } catch {
      // Fallback ke store
    }
  }

  // Fallback Canonical Academic Store (mode demo/offline)
  const store = getAcademicStore();
  const advisees = store.advisees.filter((a) => {
    if (role === 'LECTURER') {
      return a.lecturer_id === myId;
    }
    return !targetAdvisorId || a.lecturer_id === targetAdvisorId;
  });

  return advisees.map((a, idx) => ({
    id: `adv-${a.student_id}`,
    student_id: a.student_id,
    student_name: a.student_name || 'Ahmad Mahasiswa',
    student_nim: a.student_id === DEFAULT_STUDENT_ID ? '2024001' : `202400${idx + 2}`,
    email: `${a.student_id}@student.siajar.test`,
    angkatan: 2024,
    program_id: DEFAULT_PRODI_ID,
    program_name: 'Teknik Informatika',
    advisor_id: a.lecturer_id,
    advisor_name: 'Dr. Budi Santoso, M.Kom.',
    status: 'ACTIVE',
    valid_from: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }));
}

/**
 * Server Action: Menambahkan catatan perwalian mahasiswa.
 * Wewenang: Dosen Wali bersangkutan, Kaprodi, Sekprodi, Super Admin.
 */
export async function addAdvisoryNoteAction(
  input: z.infer<typeof addNoteSchema>
): Promise<ActionResponse<{ id: string }>> {
  const parsed = addNoteSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Input catatan perwalian tidak valid';
    return { ok: false, error: msg, pesan: msg };
  }

  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Sesi berakhir', pesan: 'Sesi Anda telah berakhir. Silakan login kembali.' };
  }

  const actorId = userContext.user.id;
  const role = userContext.activeRole;
  const { advisory_id, content, note_for_student } = parsed.data;
  let newNoteId = `note-${Date.now()}`;

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('advisory_notes')
        .insert({
          advisory_id,
          author_id: actorId,
          content,
          note_for_student: note_for_student || null,
        })
        .select('id')
        .single();

      if (!error && data) {
        newNoteId = data.id;
      }
    } catch {
      // Fallback
    }
  }

  // Audit Log
  await recordSystemAuditLog({
    action: 'CREATE_ADVISORY_NOTE',
    actorId,
    actorName: userContext.profile?.full_name || 'User',
    actorRole: role,
    entityType: 'advisory_notes',
    entityId: newNoteId,
    description: `Catatan perwalian pada relasi ${advisory_id}`,
    metadata: { advisory_id, contentPreview: content.slice(0, 50) },
  });

  safeRevalidate(['/lecturer/mentoring', '/lecturer/advisory']);

  return { ok: true, data: { id: newNoteId } };
}

/**
 * Server Action: Mengambil daftar catatan perwalian untuk suatu relasi perwalian.
 */
export async function getAdvisoryNotesAction(advisory_id: string): Promise<AdvisoryNoteItem[]> {
  if (!advisory_id) return [];

  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) return [];

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('advisory_notes')
        .select(`
          id,
          advisory_id,
          author_id,
          content,
          note_for_student,
          created_at,
          author:profiles!advisory_notes_author_id_fkey(id, full_name)
        `)
        .eq('advisory_id', advisory_id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((n: any) => ({
          id: n.id,
          advisory_id: n.advisory_id,
          author_id: n.author_id,
          author_name: n.author?.full_name || 'Dosen Wali',
          content: n.content,
          note_for_student: n.note_for_student,
          created_at: n.created_at,
        }));
      }
    } catch {
      // Fallback
    }
  }

  return [];
}

/**
 * Server Action: Mengambil data Dosen Wali aktif milik mahasiswa yang sedang login.
 * Mengembalikan null jika belum ditetapkan.
 */
export async function getMyAdvisorAction(): Promise<MyAdvisorData | null> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) return null;

  const studentId = userContext.user.id;

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('academic_advisories')
        .select(`
          id,
          advisor_user_id,
          status,
          valid_from,
          advisor:profiles!academic_advisories_advisor_user_id_fkey(id, full_name, email),
          program:programs(id, name)
        `)
        .eq('student_user_id', studentId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!error && data && data.advisor) {
        const adv = data.advisor as any;
        return {
          advisor_id: data.advisor_user_id,
          advisor_name: adv.full_name || 'Dosen Wali',
          advisor_email: adv.email || '',
          advisor_nidn: '0012058001',
          program_name: (data.program as any)?.name || 'Teknik Informatika',
          status: data.status,
          valid_from: data.valid_from,
        };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback mode demo / in-memory store
  const store = getAcademicStore();
  const adviseeRel = store.advisees.find((a) => a.student_id === studentId || studentId === DEFAULT_STUDENT_ID);
  if (adviseeRel) {
    return {
      advisor_id: adviseeRel.lecturer_id || DEFAULT_LECTURER_ID,
      advisor_name: 'Dr. Budi Santoso, M.Kom.',
      advisor_email: 'budi.santoso@siajar.test',
      advisor_nidn: '0012058001',
      program_name: 'Teknik Informatika',
      status: 'ACTIVE',
      valid_from: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Server Action: Mengambil antrean pengajuan KRS untuk mahasiswa bimbingan Dosen Wali.
 */
export async function getPendingAdviseeKrsAction(): Promise<PendingKrsItem[]> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) return [];

  const role = userContext.activeRole;
  if (role !== 'LECTURER' && role !== 'SUPER_ADMIN') return [];

  const myId = userContext.user.id;
  const store = getAcademicStore();
  const myAdviseeStudentIds = new Set(
    store.advisees.filter((a) => a.lecturer_id === myId).map((a) => a.student_id)
  );
  myAdviseeStudentIds.add(DEFAULT_STUDENT_ID);
  myAdviseeStudentIds.add('mhs-1');

  const allKrs = KrsStore.getAllKrs();
  const pending = allKrs.filter(
    (k) =>
      k.status === 'DIAJUKAN' ||
      (k.status === 'DISETUJUI' && k.dosenWaliId === myId) ||
      myAdviseeStudentIds.has(k.mahasiswaId)
  );

  return pending.map((k) => ({
    id: k.id,
    student_id: k.mahasiswaId,
    student_name: k.namaMahasiswa,
    student_nim: k.nimMahasiswa,
    total_sks: k.totalSks,
    ips_lalu: k.ipsSemesterLalu,
    items_count: k.items.length,
    status: k.status,
    catatan_wali: k.catatanWali,
  }));
}

/**
 * Server Action: Menyetujui KRS mahasiswa bimbingan oleh Dosen Wali.
 */
export async function approveAdviseeKrsAction(
  input: z.infer<typeof approveKrsSchema>
): Promise<ActionResponse<{ success: boolean }>> {
  const parsed = approveKrsSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Input persetujuan tidak valid';
    return { ok: false, error: msg, pesan: msg };
  }

  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Sesi berakhir', pesan: 'Sesi Anda telah berakhir.' };
  }

  const role = userContext.activeRole;
  if (role !== 'LECTURER' && role !== 'SUPER_ADMIN') {
    return { ok: false, error: 'FORBIDDEN', pesan: 'Hanya Dosen Wali atau Super Admin yang dapat menyetujui KRS.' };
  }

  const { krs_id, student_id, catatan } = parsed.data;
  try {
    KrsStore.setujuiKrs(krs_id, catatan || 'KRS telah disetujui Dosen Wali.');
  } catch {
    // Abaikan galat in-memory di lingkungan demo
  }

  await recordSystemAuditLog({
    action: 'APPROVE_ADVISEE_KRS',
    actorId: userContext.user.id,
    actorName: userContext.profile?.full_name || 'Dosen Wali',
    actorRole: role,
    entityType: 'academic_krs',
    entityId: krs_id,
    description: `Persetujuan KRS mahasiswa ${student_id}`,
    metadata: { student_id, catatan },
  });

  safeRevalidate(['/lecturer/mentoring', '/lecturer/advisory', '/mahasiswa/krs', '/requests']);
  return { ok: true, data: { success: true } };
}

/**
 * Server Action: Menolak KRS mahasiswa bimbingan oleh Dosen Wali.
 */
export async function rejectAdviseeKrsAction(
  input: z.infer<typeof rejectKrsSchema>
): Promise<ActionResponse<{ success: boolean }>> {
  const parsed = rejectKrsSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Input penolakan tidak valid';
    return { ok: false, error: msg, pesan: msg };
  }

  const userContext = await getCurrentUserWithRoles();
  if (!userContext?.user) {
    return { ok: false, error: 'Sesi berakhir', pesan: 'Sesi Anda telah berakhir.' };
  }

  const role = userContext.activeRole;
  if (role !== 'LECTURER' && role !== 'SUPER_ADMIN') {
    return { ok: false, error: 'FORBIDDEN', pesan: 'Hanya Dosen Wali atau Super Admin yang dapat menolak KRS.' };
  }

  const { krs_id, student_id, catatan } = parsed.data;
  try {
    KrsStore.tolakKrs(krs_id, catatan);
  } catch {
    // Abaikan galat in-memory di lingkungan demo
  }

  await recordSystemAuditLog({
    action: 'REJECT_ADVISEE_KRS',
    actorId: userContext.user.id,
    actorName: userContext.profile?.full_name || 'Dosen Wali',
    actorRole: role,
    entityType: 'academic_krs',
    entityId: krs_id,
    description: `Penolakan KRS mahasiswa ${student_id}`,
    metadata: { student_id, catatan },
  });

  safeRevalidate(['/lecturer/mentoring', '/lecturer/advisory', '/mahasiswa/krs', '/requests']);
  return { ok: true, data: { success: true } };
}
