/**
 * Algoritma Sistem Kotak Leitner (Flashcard Review)
 * Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md Bagian 8.1
 * 5 kotak dengan jeda 1, 2, 4, 8, dan 16 hari. Batas bawaan 20 kartu baru per hari.
 */

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;
export type LeitnerRating = 1 | 2 | 3 | 4; // 1: Gagal, 2: Sulit, 3: Baik, 4: Mudah

export interface CardReviewState {
  flashcardId: string;
  box: LeitnerBox;
  repetitions: number;
  lastRating?: LeitnerRating | null;
  nextReviewAt?: Date | null;
}

export interface ReviewCardResult {
  flashcardId: string;
  boxBefore: LeitnerBox;
  boxAfter: LeitnerBox;
  rating: LeitnerRating;
  repetitions: number;
  nextReviewAt: Date;
  daysInterval: number;
}

export const LEITNER_INTERVALS: Record<LeitnerBox, number> = {
  1: 1,  // +1 hari
  2: 2,  // +2 hari
  3: 4,  // +4 hari
  4: 8,  // +8 hari
  5: 16, // +16 hari
};

/**
 * Fungsi murni untuk menghitung transisi kotak Leitner dan jadwal review berikutnya
 */
export function reviewCard(
  state: CardReviewState,
  rating: LeitnerRating,
  today: Date = new Date()
): ReviewCardResult {
  const boxBefore = state.box || 1;
  let boxAfter: LeitnerBox;

  switch (rating) {
    case 1:
      // Gagal: Kembali ke Kotak 1
      boxAfter = 1;
      break;
    case 2:
      // Sulit: Tetap di kotak saat ini
      boxAfter = boxBefore;
      break;
    case 3:
      // Baik: Naik 1 kotak (maks 5)
      boxAfter = Math.min(5, boxBefore + 1) as LeitnerBox;
      break;
    case 4:
      // Mudah: Jika dari Kotak 1 lompat ke Kotak 3, selain itu naik 1 kotak (maks 5)
      if (boxBefore === 1) {
        boxAfter = 3;
      } else {
        boxAfter = Math.min(5, boxBefore + 1) as LeitnerBox;
      }
      break;
    default:
      boxAfter = boxBefore;
  }

  const daysInterval = LEITNER_INTERVALS[boxAfter];
  const nextReviewAt = new Date(today.getTime() + daysInterval * 24 * 60 * 60 * 1000);

  return {
    flashcardId: state.flashcardId,
    boxBefore,
    boxAfter,
    rating,
    repetitions: (state.repetitions || 0) + 1,
    nextReviewAt,
    daysInterval,
  };
}

export interface FlashcardCandidate {
  id: string;
  deckId: string;
  front: string;
  back: string;
  reviewState?: CardReviewState | null;
}

/**
 * Menyaring kartu untuk sesi belajar hari ini:
 * Menggabungkan kartu jatuh tempo (due) + maksimal `maxNewCards` (bawaan 20) kartu baru yang belum pernah direview.
 */
export function filterCardsForSession<T extends FlashcardCandidate>(
  cards: T[],
  today: Date = new Date(),
  maxNewCards: number = 20
): {
  sessionCards: T[];
  dueCount: number;
  newCount: number;
} {
  const todayMs = today.getTime();
  const dueCards: T[] = [];
  const newCards: T[] = [];

  for (const card of cards) {
    const rev = card.reviewState;
    if (!rev || !rev.nextReviewAt) {
      newCards.push(card);
    } else {
      if (new Date(rev.nextReviewAt).getTime() <= todayMs) {
        dueCards.push(card);
      }
    }
  }

  const limitedNewCards = newCards.slice(0, Math.max(0, maxNewCards));
  const sessionCards = [...dueCards, ...limitedNewCards];

  return {
    sessionCards,
    dueCount: dueCards.length,
    newCount: limitedNewCards.length,
  };
}

/**
 * Menurunkan kartu ke Kotak 1 bila mahasiswa salah menjawab soal kuis terkait
 */
export function demoteCardOnQuizFailure(
  state: CardReviewState,
  now: Date = new Date()
): ReviewCardResult {
  return reviewCard(state, 1, now);
}
