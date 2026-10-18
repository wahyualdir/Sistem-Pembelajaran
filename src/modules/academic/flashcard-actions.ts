'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  reviewCard,
  filterCardsForSession,
  type LeitnerBox,
  type LeitnerRating,
} from '@/lib/akademik/leitner';

export interface StudentDeckItem {
  id: string;
  chapter_id: string;
  chapter_title: string;
  class_id: string;
  class_title: string;
  title: string;
  total_cards: number;
  due_cards: number;
  new_cards: number;
  box_counts: Record<LeitnerBox, number>;
}

export interface SessionCardItem {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  source_segment?: string | null;
  box: LeitnerBox;
  repetitions: number;
  is_due: boolean;
}

/**
 * Mengambil daftar deck flashcard kelas aktif yang telah diterbitkan untuk mahasiswa
 */
export async function listStudentFlashcardDecksAction(): Promise<StudentDeckItem[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  const supabase = await createClient();

  // Ambil kelas mahasiswa yang aktif
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('class_id, classes(id, title)')
    .eq('student_id', user.user.id)
    .eq('status', 'ACTIVE');

  if (!enrollments || enrollments.length === 0) return [];
  const classIds = enrollments.map((e: any) => e.class_id);

  // Ambil bab yang sudah terbuka untuk kelas tersebut
  const { data: decks, error } = await supabase
    .from('chapter_decks')
    .select(`
      id,
      title,
      chapter_id,
      class_chapters!inner (
        id,
        title,
        class_id,
        classes!inner (id, title)
      ),
      flashcards (
        id,
        status,
        flashcard_reviews (
          box,
          next_review_at
        )
      )
    `)
    .eq('status', 'terbit')
    .in('class_chapters.class_id', classIds);

  if (error || !decks) return [];

  const nowMs = Date.now();
  const res: StudentDeckItem[] = [];

  for (const d of decks as any[]) {
    const publishedCards = (d.flashcards || []).filter((fc: any) => fc.status === 'terbit');
    if (publishedCards.length === 0) continue;

    let dueCards = 0;
    let newCards = 0;
    const boxCounts: Record<LeitnerBox, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const card of publishedCards) {
      const rev = Array.isArray(card.flashcard_reviews) ? card.flashcard_reviews[0] : card.flashcard_reviews;
      if (!rev) {
        newCards++;
        boxCounts[1]++;
      } else {
        const b = (rev.box || 1) as LeitnerBox;
        boxCounts[b] = (boxCounts[b] || 0) + 1;
        if (new Date(rev.next_review_at).getTime() <= nowMs) {
          dueCards++;
        }
      }
    }

    res.push({
      id: d.id,
      chapter_id: d.chapter_id,
      chapter_title: d.class_chapters?.title || 'Bab',
      class_id: d.class_chapters?.class_id,
      class_title: d.class_chapters?.classes?.title || 'Kelas',
      title: d.title,
      total_cards: publishedCards.length,
      due_cards: dueCards,
      new_cards: newCards,
      box_counts: boxCounts,
    });
  }

  return res;
}

/**
 * Mengambil antrean kartu untuk sesi belajar aktif (maks 20 kartu baru + kartu jatuh tempo)
 */
export async function getFlashcardSessionAction(deckId: string): Promise<{
  deckTitle: string;
  chapterTitle: string;
  cards: SessionCardItem[];
  dueCount: number;
  newCount: number;
} | null> {
  const user = await getCurrentUserWithRoles();
  if (!user) return null;

  const supabase = await createClient();

  const { data: deck, error } = await supabase
    .from('chapter_decks')
    .select(`
      id,
      title,
      class_chapters (title),
      flashcards (
        id,
        front,
        back,
        source_segment,
        status,
        flashcard_reviews (
          box,
          repetitions,
          next_review_at
        )
      )
    `)
    .eq('id', deckId)
    .single();

  if (error || !deck) return null;

  const published = (deck.flashcards || []).filter((f: any) => f.status === 'terbit');

  const candidates = published.map((f: any) => {
    const rev = Array.isArray(f.flashcard_reviews) ? f.flashcard_reviews[0] : f.flashcard_reviews;
    return {
      id: f.id,
      deckId: deck.id,
      front: f.front,
      back: f.back,
      sourceSegment: f.source_segment,
      reviewState: rev
        ? {
            flashcardId: f.id,
            box: (rev.box || 1) as LeitnerBox,
            repetitions: rev.repetitions || 0,
            nextReviewAt: rev.next_review_at ? new Date(rev.next_review_at) : null,
          }
        : null,
    };
  });

  const session = filterCardsForSession(candidates, new Date(), 20);

  const mappedCards: SessionCardItem[] = session.sessionCards.map((c) => ({
    id: c.id,
    deck_id: c.deckId,
    front: c.front,
    back: c.back,
    source_segment: (c as any).sourceSegment,
    box: c.reviewState?.box || 1,
    repetitions: c.reviewState?.repetitions || 0,
    is_due: !!(c.reviewState?.nextReviewAt && c.reviewState.nextReviewAt.getTime() <= Date.now()),
  }));

  return {
    deckTitle: deck.title,
    chapterTitle: (deck.class_chapters as any)?.title || 'Bab',
    cards: mappedCards,
    dueCount: session.dueCount,
    newCount: session.newCount,
  };
}

/**
 * Mengirimkan hasil evaluasi kartu oleh mahasiswa (Rating 1 sampai 4)
 */
export async function submitFlashcardReviewAction(
  flashcardId: string,
  rating: LeitnerRating,
  durationMs?: number
): Promise<{ ok: boolean; message?: string; boxAfter?: number }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum terautentikasi' };

  const supabase = await createClient();

  // Jalankan RPC submit_flashcard_review di Supabase
  const { data, error } = await supabase.rpc('submit_flashcard_review', {
    p_flashcard_id: flashcardId,
    p_rating: rating,
    p_duration_ms: durationMs || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/flashcards');
  return { ok: true, boxAfter: data?.box_after };
}
