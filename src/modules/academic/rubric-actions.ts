'use server';

// Server Actions untuk Pengelolaan Rubrik Penilaian dan Umpan Balik SIAJAR
// Mengacu pada Dokumen Instruksi Antigravity Versi 2 (Bagian 9.3)

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import type { ActionResponse } from '@/modules/identity/types';

export interface RubricLevelItem {
  id: string;
  position: number;
  label: string;
  description?: string | null;
  points: number;
}

export interface RubricCriterionItem {
  id: string;
  position: number;
  title: string;
  description?: string | null;
  max_points: number;
  levels: RubricLevelItem[];
}

export interface RubricItem {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  is_template: boolean;
  created_at: string;
  criteria: RubricCriterionItem[];
}

export interface RubricScoreItem {
  submission_id: string;
  criterion_id: string;
  level_label?: string | null;
  points: number;
  comment?: string | null;
  graded_by: string;
}

export interface FeedbackCommentItem {
  id: string;
  submission_id: string;
  author_id: string;
  author_name?: string;
  file_path?: string | null;
  anchor?: {
    type: 'lines' | 'page';
    from?: number;
    to?: number;
    page?: number;
    x?: number;
    y?: number;
  } | null;
  body: string;
  created_at: string;
}

// In-memory fallback stores
const rubricsStore: RubricItem[] = ((globalThis as any).__siajarRubrics ??= []);
const rubricScoresStore: RubricScoreItem[] = ((globalThis as any).__siajarRubricScores ??= []);
const feedbackCommentsStore: FeedbackCommentItem[] = ((globalThis as any).__siajarFeedbackComments ??= []);

const rubricSchema = z.object({
  title: z.string().trim().min(3, 'Judul rubrik minimal 3 karakter.').max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  isTemplate: z.boolean().default(false),
  criteria: z.array(
    z.object({
      title: z.string().trim().min(2, 'Nama kriteria minimal 2 karakter.'),
      description: z.string().trim().max(500).optional().nullable(),
      maxPoints: z.coerce.number().positive('Poin maksimal kriteria harus lebih besar dari 0.'),
      levels: z.array(
        z.object({
          label: z.string().trim().min(1, 'Label tingkat capaian wajib diisi.'),
          description: z.string().trim().max(500).optional().nullable(),
          points: z.coerce.number().min(0, 'Poin tidak boleh negatif.'),
        })
      ).min(1, 'Kriteria harus memiliki minimal satu tingkat capaian.'),
    })
  ).min(1, 'Rubrik harus memiliki minimal satu kriteria penilaian.'),
});

/**
 * Membuat rubrik penilaian baru (Hanya Dosen Pengampu).
 */
export async function createRubricAction(
  input: unknown
): Promise<ActionResponse<RubricItem>> {
  const parsed = rubricSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const isLecturerOrAdmin =
    auth.roles.includes('LECTURER') ||
    auth.roles.includes('SUPER_ADMIN');

  if (!isLecturerOrAdmin) {
    return { ok: false, error: 'Hanya Dosen yang memiliki wewenang membuat rubrik penilaian.' };
  }

  const v = parsed.data;
  const rubricId = randomUUID();

  const formattedCriteria: RubricCriterionItem[] = v.criteria.map((c, cIdx) => {
    const critId = randomUUID();
    return {
      id: critId,
      position: cIdx + 1,
      title: c.title,
      description: c.description ?? null,
      max_points: c.maxPoints,
      levels: c.levels.map((l, lIdx) => ({
        id: randomUUID(),
        position: lIdx + 1,
        label: l.label,
        description: l.description ?? null,
        points: l.points,
      })),
    };
  });

  const rubricItem: RubricItem = {
    id: rubricId,
    owner_id: auth.user.id,
    title: v.title,
    description: v.description ?? null,
    is_template: v.isTemplate,
    created_at: new Date().toISOString(),
    criteria: formattedCriteria,
  };

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      await supabase.from('rubrics').insert({
        id: rubricId,
        owner_id: auth.user.id,
        title: v.title,
        description: v.description ?? null,
        is_template: v.isTemplate,
      });

      for (const crit of formattedCriteria) {
        await supabase.from('rubric_criteria').insert({
          id: crit.id,
          rubric_id: rubricId,
          position: crit.position,
          title: crit.title,
          description: crit.description,
          max_points: crit.max_points,
        });

        for (const lvl of crit.levels) {
          await supabase.from('rubric_levels').insert({
            id: lvl.id,
            criterion_id: crit.id,
            position: lvl.position,
            label: lvl.label,
            description: lvl.description,
            points: lvl.points,
          });
        }
      }
    }
  } catch {
    // Fallback memory
  }

  rubricsStore.push(rubricItem);

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Dosen',
    actorRole: auth.activeRole,
    action: 'rubric.create',
    entityType: 'rubrics',
    entityId: rubricId,
    description: `Rubrik '${v.title}' dengan ${formattedCriteria.length} kriteria dibuat.`,
    valueAfter: JSON.stringify({ id: rubricId, title: v.title }),
  });

  return { ok: true, data: rubricItem };
}

/**
 * Menggandakan rubrik yang sudah ada.
 */
export async function duplicateRubricAction(
  sourceRubricId: string,
  newTitle?: string
): Promise<ActionResponse<RubricItem>> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const existing = rubricsStore.find((r) => r.id === sourceRubricId);
  if (!existing) {
    return { ok: false, error: 'Rubrik asal tidak ditemukan.' };
  }

  const title = newTitle?.trim() || `${existing.title} (Salinan)`;
  return createRubricAction({
    title,
    description: existing.description,
    isTemplate: false,
    criteria: existing.criteria.map((c) => ({
      title: c.title,
      description: c.description,
      maxPoints: c.max_points,
      levels: c.levels.map((l) => ({
        label: l.label,
        description: l.description,
        points: l.points,
      })),
    })),
  });
}

/**
 * Mengambil daftar rubrik (milik sendiri dan templat umum).
 */
export async function listRubricsAction(): Promise<RubricItem[]> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) return [];

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data } = await supabase
        .from('rubrics')
        .select(`
          id, owner_id, title, description, is_template, created_at,
          rubric_criteria (
            id, position, title, description, max_points,
            rubric_levels (id, position, label, description, points)
          )
        `)
        .or(`owner_id.eq.${auth.user.id},is_template.eq.true`)
        .order('created_at', { ascending: false });

      if (data) {
        return (data as any[]).map((r) => ({
          id: r.id,
          owner_id: r.owner_id,
          title: r.title,
          description: r.description,
          is_template: r.is_template,
          created_at: r.created_at,
          criteria: (r.rubric_criteria || []).map((c: any) => ({
            id: c.id,
            position: c.position,
            title: c.title,
            description: c.description,
            max_points: c.max_points,
            levels: c.rubric_levels || [],
          })),
        }));
      }
    }
  } catch {
    // Memory
  }

  return rubricsStore.filter((r) => r.owner_id === auth.user.id || r.is_template);
}

/**
 * Memasang snapshot rubrik ke tugas kuliah (Assignments.rubric_snapshot).
 */
export async function attachRubricToAssignmentAction(
  assignmentId: string,
  rubricId: string
): Promise<ActionResponse<{ assignmentId: string }>> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) return { ok: false, error: 'Sesi Anda telah kedaluwarsa.' };

  const rubrics = await listRubricsAction();
  const rubric = rubrics.find((r) => r.id === rubricId);
  if (!rubric) return { ok: false, error: 'Rubrik tidak ditemukan.' };

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { error } = await supabase
        .from('assignments')
        .update({ rubric_snapshot: rubric as any })
        .eq('id', assignmentId);

      if (error) return { ok: false, error: error.message };
    }
  } catch {
    // Fallback
  }

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || 'Dosen',
    actorRole: auth.activeRole,
    action: 'assignment.attach_rubric',
    entityType: 'assignments',
    entityId: assignmentId,
    description: `Rubrik '${rubric.title}' dipasang ke tugas sebagai snapshot penilaian.`,
    valueAfter: JSON.stringify({ rubricId, title: rubric.title }),
  });

  return { ok: true, data: { assignmentId } };
}

/**
 * Mengisi nilai rubrik pada pengumpulan mahasiswa.
 * Asisten hanya boleh menyimpan draf (isDraft = true).
 */
export async function gradeSubmissionWithRubricAction(input: {
  submissionId: string;
  scores: Array<{
    criterionId: string;
    levelLabel?: string;
    points: number;
    comment?: string;
  }>;
  isDraft: boolean;
  manualOverrideScore?: number;
  overrideReason?: string;
}): Promise<ActionResponse<{ rawScore: number; isDraft: boolean }>> {
  const auth = await getCurrentUserWithRoles();
  if (!auth) return { ok: false, error: 'Sesi Anda telah kedaluwarsa.' };

  const isTA = auth.roles.includes('TEACHING_ASSISTANT') && !auth.roles.includes('LECTURER');
  // Asisten dilarang finalisasi nilai, harus draft
  const isDraft = isTA ? true : input.isDraft;

  if (input.manualOverrideScore !== undefined && input.manualOverrideScore !== null) {
    if (!input.overrideReason || input.overrideReason.trim().length < 5) {
      return { ok: false, error: 'Penimpaan skor total wajib menyertakan alasan (minimal 5 karakter).' };
    }
  }

  // Hitung total poin dari kriteria
  const sumPoints = input.scores.reduce((acc, curr) => acc + curr.points, 0);
  const rawScore = input.manualOverrideScore !== undefined && input.manualOverrideScore !== null
    ? input.manualOverrideScore
    : sumPoints;

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();

      for (const s of input.scores) {
        await supabase.from('rubric_scores').upsert({
          submission_id: input.submissionId,
          criterion_id: s.criterionId,
          level_label: s.levelLabel ?? null,
          points: s.points,
          comment: s.comment ?? null,
          graded_by: auth.user.id,
        }, { onConflict: 'submission_id,criterion_id' });
      }

      await supabase
        .from('submissions')
        .update({
          raw_score: rawScore,
          status: isDraft ? 'REVIEWED' : 'GRADED',
        })
        .eq('id', input.submissionId);
    }
  } catch {
    // Fallback
  }

  for (const s of input.scores) {
    const existingIdx = rubricScoresStore.findIndex(
      (r) => r.submission_id === input.submissionId && r.criterion_id === s.criterionId
    );
    const item: RubricScoreItem = {
      submission_id: input.submissionId,
      criterion_id: s.criterionId,
      level_label: s.levelLabel ?? null,
      points: s.points,
      comment: s.comment ?? null,
      graded_by: auth.user.id,
    };
    if (existingIdx !== -1) {
      rubricScoresStore[existingIdx] = item;
    } else {
      rubricScoresStore.push(item);
    }
  }

  await recordSystemAuditLog({
    actorId: auth.user.id,
    actorName: auth.profile?.full_name || auth.user.email || (isTA ? 'Asisten' : 'Dosen'),
    actorRole: auth.activeRole,
    action: isDraft ? 'submission.grade_draft' : 'submission.grade_finalize',
    entityType: 'submissions',
    entityId: input.submissionId,
    description: `Penilaian rubrik disimpan (${isDraft ? 'Draf' : 'Final'}). Skor mentah: ${rawScore}`,
    valueAfter: JSON.stringify({ rawScore, isDraft, override: input.manualOverrideScore }),
  });

  return { ok: true, data: { rawScore, isDraft } };
}

/**
 * Menambahkan umpan balik komentar pada pengumpulan (mendukung rentang baris teks/kode atau halaman PDF).
 */
export async function addFeedbackCommentAction(input: {
  submissionId: string;
  filePath?: string;
  anchor?: FeedbackCommentItem['anchor'];
  body: string;
}): Promise<ActionResponse<FeedbackCommentItem>> {
  if (!input.body || input.body.trim().length === 0 || input.body.length > 2000) {
    return { ok: false, error: 'Komentar umpan balik wajib diisi (maksimal 2000 karakter).' };
  }

  const auth = await getCurrentUserWithRoles();
  if (!auth) return { ok: false, error: 'Sesi Anda telah kedaluwarsa.' };

  const id = randomUUID();
  const item: FeedbackCommentItem = {
    id,
    submission_id: input.submissionId,
    author_id: auth.user.id,
    author_name: auth.profile?.full_name || auth.user.email || 'Penilai',
    file_path: input.filePath ?? null,
    anchor: input.anchor ?? null,
    body: input.body.trim(),
    created_at: new Date().toISOString(),
  };

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      await supabase.from('feedback_comments').insert({
        id,
        submission_id: input.submissionId,
        author_id: auth.user.id,
        file_path: input.filePath ?? null,
        anchor: (input.anchor as any) ?? null,
        body: input.body.trim(),
      });
    }
  } catch {
    // Fallback
  }

  feedbackCommentsStore.push(item);
  return { ok: true, data: item };
}

/**
 * Mengambil daftar umpan balik komentar pada pengumpulan.
 */
export async function listSubmissionFeedbackCommentsAction(
  submissionId: string
): Promise<FeedbackCommentItem[]> {
  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data } = await supabase
        .from('feedback_comments')
        .select(`
          id, submission_id, author_id, file_path, anchor, body, created_at,
          profiles:author_id (full_name)
        `)
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (data) {
        return data.map((d: any) => ({
          id: d.id,
          submission_id: d.submission_id,
          author_id: d.author_id,
          author_name: d.profiles?.full_name,
          file_path: d.file_path,
          anchor: d.anchor,
          body: d.body,
          created_at: d.created_at,
        }));
      }
    }
  } catch {
    // Memory
  }

  return feedbackCommentsStore.filter((f) => f.submission_id === submissionId);
}

export async function getRubricsStore(): Promise<RubricItem[]> {
  return rubricsStore;
}

export async function getRubricScoresStore(): Promise<RubricScoreItem[]> {
  return rubricScoresStore;
}
