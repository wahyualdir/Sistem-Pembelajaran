import { describe, it, expect } from 'vitest';
import {
  reviewCard,
  filterCardsForSession,
  demoteCardOnQuizFailure,
  LEITNER_INTERVALS,
  type CardReviewState,
} from '@/lib/akademik/leitner';
import {
  calculateGroundingScore,
  validatePodcastScript,
  computeCardDiff,
} from '@/lib/akademik/ai-content';

describe('Tahap 2: Algoritma Kotak Leitner (leitner.ts)', () => {
  const baseDate = new Date('2026-10-20T08:00:00Z');

  it('Rating 1 (Gagal) selalu mengembalikan kartu ke Kotak 1 dengan interval 1 hari', () => {
    const fromBox4: CardReviewState = {
      flashcardId: 'fc-1',
      box: 4,
      repetitions: 5,
    };
    const res = reviewCard(fromBox4, 1, baseDate);
    expect(res.boxBefore).toBe(4);
    expect(res.boxAfter).toBe(1);
    expect(res.daysInterval).toBe(1);
    expect(res.repetitions).toBe(6);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-21T08:00:00.000Z');
  });

  it('Rating 2 (Sulit) mempertahankan kotak saat ini', () => {
    const fromBox3: CardReviewState = {
      flashcardId: 'fc-2',
      box: 3,
      repetitions: 2,
    };
    const res = reviewCard(fromBox3, 2, baseDate);
    expect(res.boxBefore).toBe(3);
    expect(res.boxAfter).toBe(3);
    expect(res.daysInterval).toBe(4);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-24T08:00:00.000Z');
  });

  it('Rating 3 (Baik) menaikkan kartu 1 kotak sampai batas maksimal Kotak 5', () => {
    const fromBox2: CardReviewState = { flashcardId: 'fc-3', box: 2, repetitions: 1 };
    const res = reviewCard(fromBox2, 3, baseDate);
    expect(res.boxAfter).toBe(3);
    expect(res.daysInterval).toBe(4);

    const fromBox5: CardReviewState = { flashcardId: 'fc-3', box: 5, repetitions: 8 };
    const res5 = reviewCard(fromBox5, 3, baseDate);
    expect(res5.boxAfter).toBe(5);
    expect(res5.daysInterval).toBe(16);
  });

  it('Rating 4 (Mudah) melompatkan kartu dari Kotak 1 langsung ke Kotak 3 (+4 hari)', () => {
    const fromBox1: CardReviewState = { flashcardId: 'fc-4', box: 1, repetitions: 0 };
    const res = reviewCard(fromBox1, 4, baseDate);
    expect(res.boxBefore).toBe(1);
    expect(res.boxAfter).toBe(3);
    expect(res.daysInterval).toBe(4);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-24T08:00:00.000Z');
  });

  it('Rating 4 (Mudah) dari Kotak 3 menaikkan ke Kotak 4', () => {
    const fromBox3: CardReviewState = { flashcardId: 'fc-5', box: 3, repetitions: 2 };
    const res = reviewCard(fromBox3, 4, baseDate);
    expect(res.boxAfter).toBe(4);
    expect(res.daysInterval).toBe(8);
  });

  it('Interval jadwal Leitner sesuai spesifikasi: 1, 2, 4, 8, dan 16 hari', () => {
    expect(LEITNER_INTERVALS[1]).toBe(1);
    expect(LEITNER_INTERVALS[2]).toBe(2);
    expect(LEITNER_INTERVALS[3]).toBe(4);
    expect(LEITNER_INTERVALS[4]).toBe(8);
    expect(LEITNER_INTERVALS[5]).toBe(16);
  });

  it('filterCardsForSession membatasi maksimal 20 kartu baru per hari dan menyertakan seluruh kartu jatuh tempo', () => {
    const cards = [];
    // 5 kartu jatuh tempo
    for (let i = 1; i <= 5; i++) {
      cards.push({
        id: `due-${i}`,
        deckId: 'deck-1',
        front: `F ${i}`,
        back: `B ${i}`,
        reviewState: {
          flashcardId: `due-${i}`,
          box: 2 as const,
          repetitions: 1,
          nextReviewAt: new Date('2026-10-19T08:00:00Z'), // kemarin (jatuh tempo)
        },
      });
    }

    // 35 kartu baru (belum pernah direview)
    for (let i = 1; i <= 35; i++) {
      cards.push({
        id: `new-${i}`,
        deckId: 'deck-1',
        front: `New F ${i}`,
        back: `New B ${i}`,
        reviewState: null,
      });
    }

    const session = filterCardsForSession(cards, baseDate, 20);
    expect(session.dueCount).toBe(5);
    expect(session.newCount).toBe(20);
    expect(session.sessionCards.length).toBe(25);
  });

  it('demoteCardOnQuizFailure menurunkan kartu ke Kotak 1', () => {
    const state: CardReviewState = {
      flashcardId: 'fc-failed',
      box: 4,
      repetitions: 3,
    };
    const res = demoteCardOnQuizFailure(state, baseDate);
    expect(res.boxAfter).toBe(1);
    expect(res.daysInterval).toBe(1);
  });
});

describe('Tahap 2: Grounding Konten & Podcast (ai-content.ts)', () => {
  const sampleMaterial = `
    Dalam arsitektur basis data modern, transaksi ACID menjamin keandalan sistem.
    Atomicity memastikan seluruh operasi dalam transaksi berhasil atau seluruhnya dibatalkan.
    Consistency memastikan data memenuhi seluruh batasan integritas skema.
    Isolation memisahkan eksekusi transaksi konkuren agar tidak saling mengganggu.
    Durability menjamin data yang telah di-commit tersimpan permanen pada penyimpanan non-volatile.
  `;

  it('calculateGroundingScore menghasilkan 0 jika materi sumber kosong', () => {
    const score = calculateGroundingScore('Apa itu Atomicity?', 'Seluruh operasi berhasil atau batal.', '');
    expect(score).toBe(0);
  });

  it('calculateGroundingScore menghasilkan skor tinggi jika kartu disitir kuat dari materi', () => {
    const score = calculateGroundingScore(
      'Apa prinsip Atomicity dalam transaksi ACID?',
      'Atomicity memastikan seluruh operasi dalam transaksi berhasil atau seluruhnya dibatalkan.',
      sampleMaterial
    );
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('calculateGroundingScore menghasilkan skor rendah jika kartu berhalusinasi atau di luar topik', () => {
    const score = calculateGroundingScore(
      'Siapa penemu bahasa Python?',
      'Guido van Rossum mengembangkan Python pada tahun 1989 di Belanda.',
      sampleMaterial
    );
    expect(score).toBeLessThan(30);
  });

  it('validatePodcastScript menolak naskah di bawah 450 kata', () => {
    const shortText = 'Satu dua tiga empat lima. '.repeat(50); // ~250 kata
    const res = validatePodcastScript(shortText);
    expect(res.isValid).toBe(false);
    expect(res.message).toContain('Minimal 450 kata');
  });

  it('validatePodcastScript menolak naskah di atas 900 kata', () => {
    const longText = 'Kata pengantar materi kuliah hari ini sangat mendalam. '.repeat(150); // 1200 kata (>900 kata)
    const res = validatePodcastScript(longText);
    expect(res.isValid).toBe(false);
    expect(res.message).toContain('Maksimal 900 kata');
  });

  it('validatePodcastScript menerima naskah valid antara 450 sampai 900 kata', () => {
    const validWords = [];
    for (let i = 1; i <= 600; i++) {
      validWords.push(`kata${i}`);
    }
    const script = validWords.join(' ');
    const res = validatePodcastScript(script);
    expect(res.isValid).toBe(true);
    expect(res.wordCount).toBe(600);
    expect(res.estimatedMinutes).toBe(4);
  });

  it('computeCardDiff mendeteksi perubahan pada bagian depan dan belakang kartu', () => {
    const orig = { front: 'Apa itu SQL?', back: 'Structured Query Language' };
    const edited = { front: 'Apa kepanjangan SQL?', back: 'Structured Query Language (ANSI)' };

    const diffRes = computeCardDiff(orig, edited);
    expect(diffRes.isChanged).toBe(true);
    expect(diffRes.frontChanged).toBe(true);
    expect(diffRes.backChanged).toBe(true);
    expect(diffRes.diff.front.from).toBe('Apa itu SQL?');
    expect(diffRes.diff.front.to).toBe('Apa kepanjangan SQL?');
  });
});
