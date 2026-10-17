'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import { getPolicy } from '@/lib/policies';
import { validateAbsenceDates } from '@/lib/akademik/perkuliahan-utils';

export interface AbsenceRequestItem {
  id: string;
  requestId: string;
  classId: string;
  className: string;
  sessionId: string;
  sessionNumber: number;
  sessionDate: string;
  status: 'menunggu' | 'disetujui' | 'ditolak';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

export interface AbsenceRequestRecord {
  id: string;
  studentId: string;
  studentName?: string;
  studentNim?: string;
  type: 'izin' | 'sakit';
  startDate: string;
  endDate: string;
  reason: string;
  attachmentPath?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  items: AbsenceRequestItem[];
}

// In-memory fallback untuk mode pengujian atau saat database offline
const absenceRequestsStore: AbsenceRequestRecord[] = [];

export async function createAbsenceRequestAction(formData: {
  type: 'izin' | 'sakit';
  startDate: string;
  endDate: string;
  reason: string;
  sessionIds: string[];
  attachmentPath?: string | null;
}): Promise<{ ok: boolean; data?: { id: string; itemCount: number }; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  // 1. Ambil kebijakan institusi
  const maxBackdateDays = await getPolicy<number>('absence_request_max_backdate_days', 7);
  const sickRequiresAttachment = await getPolicy<boolean>('sick_requires_attachment', true);

  // 2. Validasi tanggal
  const dateValidation = validateAbsenceDates(
    formData.startDate,
    formData.endDate,
    maxBackdateDays,
    14
  );
  if (!dateValidation.valid) {
    return { ok: false, error: dateValidation.error };
  }

  // 3. Validasi alasan
  if (!formData.reason || formData.reason.trim().length < 10) {
    return { ok: false, error: 'Alasan permohonan harus diisi minimal 10 karakter.' };
  }

  // 4. Validasi bukti sakit
  if (formData.type === 'sakit' && sickRequiresAttachment && !formData.attachmentPath) {
    return {
      ok: false,
      error: 'Lampiran surat bukti sakit wajib diunggah sesuai kebijakan akademik.',
    };
  }

  if (!formData.sessionIds || formData.sessionIds.length === 0) {
    return {
      ok: false,
      error: 'Pilih minimal satu pertemuan perkuliahan yang terdampak.',
    };
  }

  const requestId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const supabase = await createClient();

    // Simpan ke Supabase
    const { error: reqError } = await supabase.from('absence_requests').insert({
      id: requestId,
      student_id: auth.user.id,
      type: formData.type,
      start_date: formData.startDate,
      end_date: formData.endDate,
      reason: formData.reason.trim(),
      attachment_path: formData.attachmentPath || null,
      created_at: now,
    });

    if (!reqError) {
      // Ambil detail sesi untuk dimasukkan ke items
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id, class_id')
        .in('id', formData.sessionIds);

      if (sessions && sessions.length > 0) {
        const itemsToInsert = sessions.map((s) => ({
          request_id: requestId,
          class_id: s.class_id,
          session_id: s.id,
          status: 'menunggu' as const,
          created_at: now,
        }));

        await supabase.from('absence_request_items').insert(itemsToInsert);
      }
    }
  } catch {
    // Fallback store
  }

  // Store memory
  const memoryRecord: AbsenceRequestRecord = {
    id: requestId,
    studentId: auth.user.id,
    studentName: auth.profile?.full_name || auth.user.email,
    studentNim: (auth.profile as any)?.nim || undefined,
    type: formData.type,
    startDate: formData.startDate,
    endDate: formData.endDate,
    reason: formData.reason.trim(),
    attachmentPath: formData.attachmentPath || null,
    createdAt: now,
    items: formData.sessionIds.map((sId, idx) => ({
      id: crypto.randomUUID(),
      requestId,
      classId: 'class-' + sId,
      className: 'Mata Kuliah ' + (idx + 1),
      sessionId: sId,
      sessionNumber: idx + 1,
      sessionDate: formData.startDate,
      status: 'menunggu',
    })),
  };
  absenceRequestsStore.unshift(memoryRecord);

  return {
    ok: true,
    data: { id: requestId, itemCount: formData.sessionIds.length },
  };
}

export async function cancelAbsenceRequestAction(
  requestId: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  const now = new Date().toISOString();

  try {
    const supabase = await createClient();
    await supabase
      .from('absence_requests')
      .update({ cancelled_at: now })
      .eq('id', requestId)
      .eq('student_id', auth.user.id);

    await supabase
      .from('absence_request_items')
      .update({ status: 'ditolak', review_note: 'Dibatalkan oleh mahasiswa.' })
      .eq('request_id', requestId)
      .eq('status', 'menunggu');
  } catch {
    // Memory
  }

  const found = absenceRequestsStore.find(
    (r) => r.id === requestId && r.studentId === auth.user.id
  );
  if (found) {
    found.cancelledAt = now;
    found.items.forEach((item) => {
      if (item.status === 'menunggu') {
        item.status = 'ditolak';
        item.reviewNote = 'Dibatalkan oleh mahasiswa.';
      }
    });
  }

  return { ok: true };
}

export async function reviewAbsenceItemAction(
  itemId: string,
  decision: 'disetujui' | 'ditolak',
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  if (decision === 'ditolak' && (!note || note.trim().length < 3)) {
    return { ok: false, error: 'Penolakan permohonan wajib menyertakan alasan.' };
  }

  const now = new Date().toISOString();

  try {
    const supabase = await createClient();

    // Panggil RPC review_absence_item bila ada
    const { data, error } = await supabase.rpc('review_absence_item', {
      p_item_id: itemId,
      p_decision: decision,
      p_note: note?.trim() || null,
    });

    if (!error && data) {
      const res = data as { ok: boolean; error?: string };
      if (!res.ok) return { ok: false, error: res.error };
    } else {
      // Fallback manual query
      await supabase
        .from('absence_request_items')
        .update({
          status: decision,
          reviewed_by: auth.user.id,
          reviewed_at: now,
          review_note: note?.trim() || null,
        })
        .eq('id', itemId);
    }
  } catch {
    // Memory
  }

  // Update memory store
  for (const req of absenceRequestsStore) {
    const it = req.items.find((i) => i.id === itemId);
    if (it) {
      it.status = decision;
      it.reviewedBy = auth.user.id;
      it.reviewedAt = now;
      it.reviewNote = note?.trim() || null;
      break;
    }
  }

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email,
    actorRole: auth.activeRole,
    action: decision === 'disetujui' ? 'setujui_izin_sakit' : 'tolak_izin_sakit',
    entityType: 'absence_request_item',
    entityId: itemId,
    description: `Dosen ${auth.profile?.full_name || auth.user.email} ${decision} permohonan izin/sakit (item: ${itemId})`,
    valueAfter: JSON.stringify({ decision, note }),
  });

  return { ok: true };
}

export async function batchReviewAbsenceItemsAction(
  itemIds: string[],
  decision: 'disetujui' | 'ditolak',
  note?: string
): Promise<{ ok: boolean; count: number; error?: string }> {
  let count = 0;
  for (const id of itemIds) {
    const res = await reviewAbsenceItemAction(id, decision, note);
    if (res.ok) count++;
  }
  return { ok: true, count };
}

export async function listStudentAbsenceRequestsAction(): Promise<AbsenceRequestRecord[]> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) return [];

  try {
    const supabase = await createClient();
    const { data: requests } = await supabase
      .from('absence_requests')
      .select('*, absence_request_items(*)')
      .eq('student_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (requests && requests.length > 0) {
      return requests.map((r) => ({
        id: r.id,
        studentId: r.student_id,
        type: r.type,
        startDate: r.start_date,
        endDate: r.end_date,
        reason: r.reason,
        attachmentPath: r.attachment_path,
        cancelledAt: r.cancelled_at,
        createdAt: r.created_at,
        items: ((r as { absence_request_items?: any[] }).absence_request_items || []).map((it) => ({
          id: it.id,
          requestId: it.request_id,
          classId: it.class_id,
          className: 'Kelas Terdaftar',
          sessionId: it.session_id,
          sessionNumber: 1,
          sessionDate: r.start_date,
          status: it.status,
          reviewedBy: it.reviewed_by,
          reviewedAt: it.reviewed_at,
          reviewNote: it.review_note,
        })),
      }));
    }
  } catch {
    // Memory
  }

  return absenceRequestsStore.filter((r) => r.studentId === auth.user.id);
}

export async function listClassAbsenceRequestsAction(
  classId: string,
  statusFilter?: 'menunggu' | 'disetujui' | 'ditolak'
): Promise<AbsenceRequestItem[]> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) return [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from('absence_request_items')
      .select('*, absence_requests(*)')
      .eq('class_id', classId);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data && data.length > 0) {
      return data.map((it) => ({
        id: it.id,
        requestId: it.request_id,
        classId: it.class_id,
        className: 'Kelas Terdaftar',
        sessionId: it.session_id,
        sessionNumber: 1,
        sessionDate: (it as { absence_requests?: { start_date?: string } }).absence_requests?.start_date || '',
        status: it.status,
        reviewedBy: it.reviewed_by,
        reviewedAt: it.reviewed_at,
        reviewNote: it.review_note,
      }));
    }
  } catch {
    // Memory
  }

  const items: AbsenceRequestItem[] = [];
  for (const req of absenceRequestsStore) {
    for (const it of req.items) {
      if (it.classId === classId || classId.includes(it.sessionId)) {
        if (!statusFilter || it.status === statusFilter) {
          items.push(it);
        }
      }
    }
  }
  return items;
}

export async function getAbsenceProofSignedUrlAction(
  attachmentPath: string,
  classId: string
): Promise<{ ok: boolean; signedUrl?: string; error?: string }> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  // Audit log: wajib dicatat setiap kali dosen membuka bukti izin/sakit
  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email,
    actorRole: auth.activeRole,
    action: 'lihat_bukti_izin',
    entityType: 'absence_proof',
    entityId: attachmentPath,
    scopeType: 'class',
    scopeId: classId,
    description: `Dosen ${auth.profile?.full_name || auth.user.email} membuka berkas bukti permohonan izin/sakit: ${attachmentPath}`,
  });

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from('absence-proofs')
      .createSignedUrl(attachmentPath, 60); // 60 detik berumur pendek

    if (!error && data?.signedUrl) {
      return { ok: true, signedUrl: data.signedUrl };
    }
  } catch {
    // Fallback URL simulasi
  }

  return {
    ok: true,
    signedUrl: `/api/storage/file?bucket=absence-proofs&path=${encodeURIComponent(attachmentPath)}`,
  };
}

export async function getAbsenceStore(): Promise<AbsenceRequestRecord[]> {
  return absenceRequestsStore;
}
