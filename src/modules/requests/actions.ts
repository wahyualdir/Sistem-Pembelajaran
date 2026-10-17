'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config/features';

export type RequestType = 'surat_aktif' | 'dispensasi' | 'cuti' | 'legalisir';
export type RequestStatus = 'MENUNGGU' | 'DIPROSES' | 'DISETUJUI' | 'DITOLAK';

export interface StudentRequestItem {
  id: string;
  student_id: string;
  student_name?: string;
  student_nim?: string;
  type: RequestType;
  details: {
    purpose: string;
    notes?: string;
  };
  attachment_path: string | null;
  status: RequestStatus;
  staff_note: string | null;
  result_path: string | null;
  created_at: string;
  updated_at: string;
}

export type ActionResponse<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string };

const createRequestSchema = z.object({
  type: z.enum(['surat_aktif', 'dispensasi', 'cuti', 'legalisir'], {
    errorMap: () => ({ message: 'Pilih jenis pengajuan yang valid.' }),
  }),
  purpose: z.string().trim().min(5, 'Tuliskan keperluan pengajuan minimal 5 karakter.').max(500),
  notes: z.string().trim().max(1000).optional(),
  attachment_path: z.string().optional().nullable(),
});

// Demo store in memory when offline
const DEMO_REQUESTS: StudentRequestItem[] = [
  {
    id: 'req-001',
    student_id: 'mhs-1',
    student_name: 'Ahmad Mahasiswa',
    student_nim: '223510001',
    type: 'surat_aktif',
    details: {
      purpose: 'Persyaratan beasiswa Bank Indonesia semester ganjil 2026/2027.',
    },
    attachment_path: null,
    status: 'DISETUJUI',
    staff_note: 'Dokumen telah diverifikasi dan ditandatangani secara digital.',
    result_path: '/documents/surat-aktif-ahmad.pdf',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'req-002',
    student_id: 'mhs-1',
    student_name: 'Ahmad Mahasiswa',
    student_nim: '223510001',
    type: 'dispensasi',
    details: {
      purpose: 'Mengikuti perlombaan gemastik tingkat nasional di Surabaya.',
      notes: 'Surat tugas dari dekanat terlampir.',
    },
    attachment_path: '/attachments/surat-tugas-dekanat.pdf',
    status: 'MENUNGGU',
    staff_note: null,
    result_path: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export async function getStudentRequestsAction(): Promise<StudentRequestItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user?.user) return [];

  const isDemo = isDemoMode();
  if (isDemo) {
    return DEMO_REQUESTS.filter(
      (r) => r.student_id === user.user.id || r.student_id === 'mhs-1'
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('student_requests')
      .select('*')
      .eq('student_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return DEMO_REQUESTS.filter(
        (r) => r.student_id === user.user.id || r.student_id === 'mhs-1'
      );
    }

    return data.map((d: any) => ({
      id: d.id,
      student_id: d.student_id,
      type: d.type as RequestType,
      details: d.details || { purpose: '' },
      attachment_path: d.attachment_path,
      status: d.status as RequestStatus,
      staff_note: d.staff_note,
      result_path: d.result_path,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));
  } catch {
    return DEMO_REQUESTS.filter(
      (r) => r.student_id === user.user.id || r.student_id === 'mhs-1'
    );
  }
}

export async function createStudentRequestAction(input: unknown): Promise<ActionResponse<StudentRequestItem>> {
  const user = await getCurrentUserWithRoles();
  if (!user?.user) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  // Mahasiswa atau TA
  const role = user.activeRole;
  if (role !== 'STUDENT' && role !== 'TEACHING_ASSISTANT') {
    return { ok: false, error: 'Hanya mahasiswa yang dapat membuat pengajuan akademik.' };
  }

  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Data pengajuan tidak valid.' };
  }

  const { type, purpose, notes, attachment_path } = parsed.data;
  const isDemo = isDemoMode();

  const newRequest: StudentRequestItem = {
    id: `req-${Date.now()}`,
    student_id: user.user.id,
    student_name: user.profile?.full_name || 'Mahasiswa',
    type,
    details: { purpose, notes },
    attachment_path: attachment_path || null,
    status: 'MENUNGGU',
    staff_note: null,
    result_path: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isDemo) {
    DEMO_REQUESTS.unshift(newRequest);
    revalidatePath('/requests');
    return { ok: true, data: newRequest };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('student_requests')
      .insert({
        student_id: user.user.id,
        type,
        details: { purpose, notes },
        attachment_path: attachment_path || null,
        status: 'MENUNGGU',
      })
      .select('*')
      .single();

    if (error) {
      return { ok: false, error: `Gagal menyimpan pengajuan: ${error.message}` };
    }

    revalidatePath('/requests');
    return {
      ok: true,
      data: {
        id: data.id,
        student_id: data.student_id,
        type: data.type as RequestType,
        details: data.details,
        attachment_path: data.attachment_path,
        status: data.status as RequestStatus,
        staff_note: data.staff_note,
        result_path: data.result_path,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Terjadi kesalahan sistem saat mengirim pengajuan.' };
  }
}

export async function getAllStudentRequestsAction(filterStatus?: string): Promise<StudentRequestItem[]> {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;
  if (role !== 'ACADEMIC_STAFF' && role !== 'SUPER_ADMIN') {
    return [];
  }

  const isDemo = isDemoMode();
  if (isDemo) {
    if (!filterStatus || filterStatus === 'ALL') return DEMO_REQUESTS;
    return DEMO_REQUESTS.filter((r) => r.status === filterStatus);
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from('student_requests')
      .select('*, profiles:student_id(full_name)')
      .order('created_at', { ascending: false });

    if (filterStatus && filterStatus !== 'ALL') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;
    if (error || !data) return DEMO_REQUESTS;

    return data.map((d: any) => ({
      id: d.id,
      student_id: d.student_id,
      student_name: d.profiles?.full_name || 'Mahasiswa',
      type: d.type as RequestType,
      details: d.details || { purpose: '' },
      attachment_path: d.attachment_path,
      status: d.status as RequestStatus,
      staff_note: d.staff_note,
      result_path: d.result_path,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));
  } catch {
    return DEMO_REQUESTS;
  }
}

const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['MENUNGGU', 'DIPROSES', 'DISETUJUI', 'DITOLAK']),
  staff_note: z.string().trim().max(1000).optional(),
  result_path: z.string().optional().nullable(),
});

export async function updateStudentRequestStatusAction(input: unknown): Promise<ActionResponse> {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;
  if (role !== 'ACADEMIC_STAFF' && role !== 'SUPER_ADMIN') {
    return { ok: false, error: 'Akses ditolak. Hanya Staf Akademik yang dapat memperbarui status pengajuan.' };
  }

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Data pembaruan tidak valid.' };
  }

  const { id, status, staff_note, result_path } = parsed.data;
  const isDemo = isDemoMode();

  if (isDemo) {
    const item = DEMO_REQUESTS.find((r) => r.id === id);
    if (!item) return { ok: false, error: 'Pengajuan tidak ditemukan.' };
    item.status = status;
    if (staff_note !== undefined) item.staff_note = staff_note;
    if (result_path !== undefined) item.result_path = result_path;
    item.updated_at = new Date().toISOString();
    revalidatePath('/staff/services/verification');
    revalidatePath('/requests');
    return { ok: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('student_requests')
      .update({
        status,
        staff_note: staff_note || null,
        result_path: result_path || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/staff/services/verification');
    revalidatePath('/requests');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Gagal memperbarui status pengajuan.' };
  }
}
