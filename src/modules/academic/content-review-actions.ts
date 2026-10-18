'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { computeCardDiff, calculateGroundingScore } from '@/lib/akademik/ai-content';

export interface PendingReviewCard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  source_material_id?: string | null;
  source_material_title?: string | null;
  source_segment?: string | null;
  grounding_score: number;
  status: 'draf' | 'ditinjau' | 'terbit' | 'perlu_tinjau_ulang' | 'ditarik';
  created_at: string;
  chapter_title: string;
  class_title: string;
}

export interface PendingReviewPodcast {
  id: string;
  chapter_id: string;
  chapter_title: string;
  class_title: string;
  title: string;
  narrator: 'Pak Dosen' | 'Bu Dosen';
  script_text: string;
  script_status: 'draf' | 'ditinjau' | 'disetujui' | 'ditarik';
  word_count: number;
  audio_url?: string | null;
  created_at: string;
}

/**
 * Cek persetujuan AI dosen
 */
export async function getLecturerConsentAction(): Promise<{ consented: boolean; termsVersion?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { consented: false };

  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_content_consents')
    .select('consented_at, terms_version')
    .eq('lecturer_id', user.user.id)
    .single();

  if (!data) return { consented: false };
  return { consented: true, termsVersion: data.terms_version };
}

/**
 * Simpan persetujuan AI dosen
 */
export async function saveLecturerConsentAction(): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const { error } = await supabase.from('ai_content_consents').upsert({
    lecturer_id: user.user.id,
    consented_at: new Date().toISOString(),
    terms_version: 'v1.0',
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath('/lecturer/content-review');
  return { ok: true };
}

/**
 * Ambil daftar kartu dan naskah yang menunggu kurasi dosen
 */
export async function listPendingContentReviewsAction(): Promise<{
  cards: PendingReviewCard[];
  podcasts: PendingReviewPodcast[];
}> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { cards: [], podcasts: [] };

  const supabase = await createClient();

  // 1. Flashcards pending
  const { data: flashcards } = await supabase
    .from('flashcards')
    .select(`
      id,
      deck_id,
      front,
      back,
      source_material_id,
      source_segment,
      grounding_score,
      status,
      created_at,
      materials (title),
      chapter_decks!inner (
        title,
        class_chapters!inner (
          title,
          class_id,
          classes!inner (title)
        )
      )
    `)
    .in('status', ['draf', 'ditinjau'])
    .order('created_at', { ascending: false });

  const cards: PendingReviewCard[] = (flashcards || []).map((f: any) => ({
    id: f.id,
    deck_id: f.deck_id,
    front: f.front,
    back: f.back,
    source_material_id: f.source_material_id,
    source_material_title: f.materials?.title || null,
    source_segment: f.source_segment,
    grounding_score: f.grounding_score ?? 100,
    status: f.status,
    created_at: f.created_at,
    chapter_title: f.chapter_decks?.class_chapters?.title || 'Bab',
    class_title: f.chapter_decks?.class_chapters?.classes?.title || 'Kelas',
  }));

  // 2. Podcasts pending
  const { data: podcastsData } = await supabase
    .from('chapter_podcasts')
    .select(`
      id,
      chapter_id,
      title,
      narrator,
      script_text,
      script_status,
      audio_url,
      created_at,
      class_chapters!inner (
        title,
        classes!inner (title)
      )
    `)
    .in('script_status', ['draf', 'ditinjau'])
    .order('created_at', { ascending: false });

  const podcasts: PendingReviewPodcast[] = (podcastsData || []).map((p: any) => ({
    id: p.id,
    chapter_id: p.chapter_id,
    chapter_title: p.class_chapters?.title || 'Bab',
    class_title: p.class_chapters?.classes?.title || 'Kelas',
    title: p.title,
    narrator: p.narrator,
    script_text: p.script_text,
    script_status: p.script_status,
    word_count: p.script_text ? p.script_text.trim().split(/\s+/).length : 0,
    audio_url: p.audio_url,
    created_at: p.created_at,
  }));

  return { cards, podcasts };
}

/**
 * Dosen mengevaluasi kartu: Approve ('terbit'), Reject ('ditarik'), atau Edit
 */
export async function reviewContentCardAction(payload: {
  cardId: string;
  action: 'approve' | 'reject' | 'edit';
  editedContent?: { front: string; back: string };
}): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();

  const { data: original, error: fetchErr } = await supabase
    .from('flashcards')
    .select('front, back, deck_id')
    .eq('id', payload.cardId)
    .single();

  if (fetchErr || !original) {
    return { ok: false, message: 'Kartu tidak ditemukan' };
  }

  const now = new Date().toISOString();
  let nextStatus: 'terbit' | 'ditarik' | 'ditinjau' = 'terbit';
  let diffJson: any = null;
  const updates: any = {
    reviewer_id: user.user.id,
    reviewed_at: now,
  };

  if (payload.action === 'approve') {
    nextStatus = 'terbit';
    updates.status = nextStatus;
  } else if (payload.action === 'reject') {
    nextStatus = 'ditarik';
    updates.status = nextStatus;
  } else if (payload.action === 'edit' && payload.editedContent) {
    const diff = computeCardDiff(original, payload.editedContent);
    diffJson = diff.diff;
    updates.front = payload.editedContent.front.trim();
    updates.back = payload.editedContent.back.trim();
    updates.status = 'terbit'; // setelah diedit langsung terbit
  }

  const { error: updateErr } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', payload.cardId);

  if (updateErr) return { ok: false, message: updateErr.message };

  // Catat review event
  await supabase.from('content_review_events').insert({
    entity_type: 'flashcard',
    entity_id: payload.cardId,
    reviewer_id: user.user.id,
    action: payload.action,
    diff: diffJson,
    created_at: now,
  });

  // Jika ada kartu berstatus terbit pada deck, pastikan deck juga berstatus terbit
  if (nextStatus === 'terbit') {
    await supabase
      .from('chapter_decks')
      .update({ status: 'terbit', updated_at: now })
      .eq('id', original.deck_id);
  }

  revalidatePath('/lecturer/content-review');
  return { ok: true };
}

/**
 * Dosen menyetujui atau menolak naskah podcast
 */
export async function reviewPodcastScriptAction(payload: {
  podcastId: string;
  action: 'approve' | 'reject';
}): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();
  const nextStatus = payload.action === 'approve' ? 'disetujui' : 'ditarik';

  const { error } = await supabase
    .from('chapter_podcasts')
    .update({
      script_status: nextStatus,
      approved_by: payload.action === 'approve' ? user.user.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.podcastId);

  if (error) return { ok: false, message: error.message };

  revalidatePath('/lecturer/content-review');
  return { ok: true };
}

/**
 * Pengecekan fail-closed ketersediaan kunci AI
 */
export async function checkAiAvailabilityAction(): Promise<{
  isAvailable: boolean;
  message?: string;
}> {
  const hasKey = !!(
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.ANTHROPIC_API_KEY
  );

  if (!hasKey) {
    return {
      isAvailable: false,
      message: 'Layanan pembuatan konten AI belum dikonfigurasi oleh Administrator Kampus (kunci API AI tidak ditemukan). Fitur dinonaktifkan secara aman (fail-closed).',
    };
  }

  return { isAvailable: true };
}

/**
 * Meminta generasi konten AI (flashcard atau naskah podcast)
 */
export async function requestAiGenerationJobAction(payload: {
  classId: string;
  chapterId: string;
  kind: 'flashcard' | 'podcast_script';
  materialIds: string[];
}): Promise<{ ok: boolean; message?: string; jobId?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum terautentikasi' };

  // Fail-closed check
  const avail = await checkAiAvailabilityAction();
  if (!avail.isAvailable) {
    return { ok: false, message: avail.message };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_generation_jobs')
    .insert({
      class_id: payload.classId,
      chapter_id: payload.chapterId,
      kind: payload.kind,
      status: 'pending',
      model_used: process.env.GEMINI_API_KEY ? 'gemini-1.5-pro' : 'gpt-4o',
      input_material_ids: payload.materialIds,
      created_by: user.user.id,
    })
    .select('id')
    .single();

  if (error) return { ok: false, message: error.message };

  revalidatePath('/lecturer/content-review');
  return { ok: true, jobId: data.id };
}
