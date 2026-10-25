'use server';

import { hasUserRole } from '@/lib/auth/server-guards';

// Server Actions untuk Komentar Berkas pada Penilaian Tugas SIAJAR (Bagian 9.3)

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import type { ActionResponse } from '@/modules/identity/types';
import {
  type FeedbackComment,
  type FeedbackAnchor,
  validateFeedbackAnchor,
  validateCommentBody,
} from '@/lib/akademik/feedback-comments-utils';

// Store in-memory fallback
const feedbackCommentsStore: FeedbackComment[] = ((globalThis as any).__siajarFeedbackComments ??= []);

const commentSchema = z.object({
  submissionId: z.string().uuid('ID Pengumpulan tidak valid.'),
  filePath: z.string().trim().optional().nullable(),
  anchor: z.any().optional().nullable(),
  body: z.string().trim().min(1, 'Komentar tidak boleh kosong.').max(2000, 'Komentar maksimal 2000 karakter.'),
  isDraft: z.boolean().default(false),
});

/**
 * Dosen atau Asisten menambahkan komentar pada berkas tugas mahasiswa.
 * Asisten selalu berstatus draf.
 */
export async function createFeedbackCommentAction(
  input: unknown
): Promise<ActionResponse<FeedbackComment>> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const isLecturer = hasUserRole(auth, ['LECTURER', 'SUPER_ADMIN']);
  const isTA = hasUserRole(auth, 'TEACHING_ASSISTANT');

  if (!isLecturer && !isTA) {
    return { ok: false, error: 'Hanya Pengajar atau Asisten yang dapat memberikan komentar pada berkas.' };
  }

  const v = parsed.data;

  // Validasi anchor
  if (v.anchor) {
    const anchorCheck = validateFeedbackAnchor(v.anchor);
    if (!anchorCheck.valid) {
      return { ok: false, error: anchorCheck.error || 'Penanda berkas tidak valid.' };
    }
  }

  // Asisten selalu menghasilkan draf
  const isDraft = isTA ? true : v.isDraft;

  const id = randomUUID();
  const comment: FeedbackComment = {
    id,
    submission_id: v.submissionId,
    author_id: auth.user.id,
    author_name: auth.profile?.full_name || auth.user.email || 'Pengajar',
    author_role: isTA ? 'TEACHING_ASSISTANT' : 'LECTURER',
    file_path: v.filePath ?? null,
    anchor: v.anchor as FeedbackAnchor | null,
    body: v.body,
    is_draft: isDraft,
    created_at: new Date().toISOString(),
  };

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      await supabase.from('feedback_comments').insert({
        id,
        submission_id: v.submissionId,
        author_id: auth.user.id,
        file_path: v.filePath ?? null,
        anchor: v.anchor ?? null,
        body: v.body,
        created_at: comment.created_at,
      });
    }
  } catch {
    // Memory
  }

  feedbackCommentsStore.push(comment);

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Pengajar',
    actorRole: auth.activeRole,
    action: 'feedback_comment.create',
    entityType: 'feedback_comments',
    entityId: id,
    description: `Komentar ditambahkan pada berkas pengumpulan ${v.submissionId}`,
  });

  return { ok: true, data: comment };
}

/**
 * Mengambil daftar komentar berkas untuk satu pengumpulan.
 * Mahasiswa hanya menerima komentar yang sudah final (bukan draf) bila nilai dipublikasikan.
 */
export async function getFeedbackCommentsAction(
  submissionId: string,
  isGradePublished: boolean = true
): Promise<ActionResponse<FeedbackComment[]>> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi kedaluwarsa.' };
  }

  const isStudent = hasUserRole(auth, 'STUDENT');

  let list = feedbackCommentsStore.filter((c) => c.submission_id === submissionId);

  if (isStudent) {
    if (!isGradePublished) {
      return { ok: true, data: [] };
    }
    list = list.filter((c) => !c.is_draft);
  }

  return { ok: true, data: list };
}

/**
 * Menghapus komentar berkas milik sendiri atau oleh Dosen.
 */
export async function deleteFeedbackCommentAction(
  commentId: string
): Promise<ActionResponse<{ deletedId: string }>> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi kedaluwarsa.' };
  }

  const index = feedbackCommentsStore.findIndex((c) => c.id === commentId);
  if (index === -1) {
    return { ok: false, error: 'Komentar tidak ditemukan.' };
  }

  const comment = feedbackCommentsStore[index];
  const isOwner = comment.author_id === auth.user.id;
  const isLecturer = hasUserRole(auth, ['LECTURER', 'SUPER_ADMIN']);

  if (!isOwner && !isLecturer) {
    return { ok: false, error: 'Anda tidak memiliki wewenang untuk menghapus komentar ini.' };
  }

  feedbackCommentsStore.splice(index, 1);

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      await supabase.from('feedback_comments').delete().eq('id', commentId);
    }
  } catch {
    // Memory
  }

  return { ok: true, data: { deletedId: commentId } };
}
