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
  splitPodcastScriptIntoSegments,
  mapCumulativeDuration,
  validateFlashcardsOutput,
  computeCardDiff,
  MockContentGenerator,
  GeminiContentGenerator,
  MockSpeechSynthesizer,
  getContentGenerator,
  getSpeechSynthesizer,
  type RawAiFlashcard,
} from '@/lib/akademik/ai-content';

describe('Tahap 2: Algoritma Kotak Leitner (leitner.ts) — Minimal 15 Kasus reviewCard', () => {
  const baseDate = new Date('2026-10-20T08:00:00Z');

  // --- KELOMPOK RATING 1 (GAGAL) ---
  it('Kasus 1: Rating 1 dari Kotak 1 -> tetap di Kotak 1 (+1 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-1', box: 1, repetitions: 0 }, 1, baseDate);
    expect(res.boxBefore).toBe(1);
    expect(res.boxAfter).toBe(1);
    expect(res.daysInterval).toBe(1);
    expect(res.repetitions).toBe(1);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-21T08:00:00.000Z');
  });

  it('Kasus 2: Rating 1 dari Kotak 2 -> turun ke Kotak 1 (+1 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-2', box: 2, repetitions: 2 }, 1, baseDate);
    expect(res.boxBefore).toBe(2);
    expect(res.boxAfter).toBe(1);
    expect(res.daysInterval).toBe(1);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-21T08:00:00.000Z');
  });

  it('Kasus 3: Rating 1 dari Kotak 3 -> turun ke Kotak 1 (+1 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-3', box: 3, repetitions: 4 }, 1, baseDate);
    expect(res.boxBefore).toBe(3);
    expect(res.boxAfter).toBe(1);
    expect(res.daysInterval).toBe(1);
  });

  it('Kasus 4: Rating 1 dari Kotak 4 -> turun ke Kotak 1 (+1 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-4', box: 4, repetitions: 5 }, 1, baseDate);
    expect(res.boxBefore).toBe(4);
    expect(res.boxAfter).toBe(1);
    expect(res.daysInterval).toBe(1);
    expect(res.repetitions).toBe(6);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-21T08:00:00.000Z');
  });

  it('Kasus 5: Rating 1 dari Kotak 5 (puncak penguasaan) -> tetap jatuh kembali ke Kotak 1 (+1 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-5', box: 5, repetitions: 12 }, 1, baseDate);
    expect(res.boxBefore).toBe(5);
    expect(res.boxAfter).toBe(1);
    expect(res.daysInterval).toBe(1);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-21T08:00:00.000Z');
  });

  // --- KELOMPOK RATING 2 (SULIT) ---
  it('Kasus 6: Rating 2 dari Kotak 1 -> mempertahankan Kotak 1 (+1 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-6', box: 1, repetitions: 1 }, 2, baseDate);
    expect(res.boxBefore).toBe(1);
    expect(res.boxAfter).toBe(1);
    expect(res.daysInterval).toBe(1);
  });

  it('Kasus 7: Rating 2 dari Kotak 2 -> mempertahankan Kotak 2 (+2 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-7', box: 2, repetitions: 3 }, 2, baseDate);
    expect(res.boxBefore).toBe(2);
    expect(res.boxAfter).toBe(2);
    expect(res.daysInterval).toBe(2);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-22T08:00:00.000Z');
  });

  it('Kasus 8: Rating 2 dari Kotak 3 -> mempertahankan Kotak 3 (+4 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-8', box: 3, repetitions: 2 }, 2, baseDate);
    expect(res.boxBefore).toBe(3);
    expect(res.boxAfter).toBe(3);
    expect(res.daysInterval).toBe(4);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-24T08:00:00.000Z');
  });

  it('Kasus 9: Rating 2 dari Kotak 4 -> mempertahankan Kotak 4 (+8 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-9', box: 4, repetitions: 7 }, 2, baseDate);
    expect(res.boxBefore).toBe(4);
    expect(res.boxAfter).toBe(4);
    expect(res.daysInterval).toBe(8);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-28T08:00:00.000Z');
  });

  it('Kasus 10: Rating 2 dari Kotak 5 -> mempertahankan Kotak 5 (+16 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-10', box: 5, repetitions: 9 }, 2, baseDate);
    expect(res.boxBefore).toBe(5);
    expect(res.boxAfter).toBe(5);
    expect(res.daysInterval).toBe(16);
    expect(res.nextReviewAt.toISOString()).toBe('2026-11-05T08:00:00.000Z');
  });

  // --- KELOMPOK RATING 3 (BAIK) ---
  it('Kasus 11: Rating 3 dari Kotak 1 -> naik ke Kotak 2 (+2 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-11', box: 1, repetitions: 0 }, 3, baseDate);
    expect(res.boxBefore).toBe(1);
    expect(res.boxAfter).toBe(2);
    expect(res.daysInterval).toBe(2);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-22T08:00:00.000Z');
  });

  it('Kasus 12: Rating 3 dari Kotak 2 -> naik ke Kotak 3 (+4 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-12', box: 2, repetitions: 1 }, 3, baseDate);
    expect(res.boxBefore).toBe(2);
    expect(res.boxAfter).toBe(3);
    expect(res.daysInterval).toBe(4);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-24T08:00:00.000Z');
  });

  it('Kasus 13: Rating 3 dari Kotak 3 -> naik ke Kotak 4 (+8 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-13', box: 3, repetitions: 3 }, 3, baseDate);
    expect(res.boxBefore).toBe(3);
    expect(res.boxAfter).toBe(4);
    expect(res.daysInterval).toBe(8);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-28T08:00:00.000Z');
  });

  it('Kasus 14: Rating 3 dari Kotak 4 -> naik ke Kotak 5 (+16 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-14', box: 4, repetitions: 4 }, 3, baseDate);
    expect(res.boxBefore).toBe(4);
    expect(res.boxAfter).toBe(5);
    expect(res.daysInterval).toBe(16);
    expect(res.nextReviewAt.toISOString()).toBe('2026-11-05T08:00:00.000Z');
  });

  it('Kasus 15: Rating 3 dari Kotak 5 -> tertahan di batas maksimal Kotak 5 (+16 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-15', box: 5, repetitions: 8 }, 3, baseDate);
    expect(res.boxBefore).toBe(5);
    expect(res.boxAfter).toBe(5);
    expect(res.daysInterval).toBe(16);
    expect(res.nextReviewAt.toISOString()).toBe('2026-11-05T08:00:00.000Z');
  });

  // --- KELOMPOK RATING 4 (MUDAH) & PERGANTIAN BULAN ---
  it('Kasus 16: Rating 4 dari Kotak 1 -> melompat 2 tingkat langsung ke Kotak 3 (+4 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-16', box: 1, repetitions: 0 }, 4, baseDate);
    expect(res.boxBefore).toBe(1);
    expect(res.boxAfter).toBe(3);
    expect(res.daysInterval).toBe(4);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-24T08:00:00.000Z');
  });

  it('Kasus 17: Rating 4 dari Kotak 4 -> naik ke batas Kotak 5 (+16 hari)', () => {
    const res = reviewCard({ flashcardId: 'fc-17', box: 4, repetitions: 5 }, 4, baseDate);
    expect(res.boxBefore).toBe(4);
    expect(res.boxAfter).toBe(5);
    expect(res.daysInterval).toBe(16);
  });

  it('Kasus 18: Perhitungan jadwal ulasan melewati batas pergantian bulan (31 Oktober ke November)', () => {
    const endOfMonth = new Date('2026-10-31T10:00:00Z');
    const res = reviewCard({ flashcardId: 'fc-month', box: 1, repetitions: 0 }, 3, endOfMonth);
    expect(res.boxAfter).toBe(2);
    expect(res.daysInterval).toBe(2);
    expect(res.nextReviewAt.toISOString()).toBe('2026-11-02T10:00:00.000Z');
  });

  it('Kasus 19: Interval jadwal Leitner sesuai spesifikasi: 1, 2, 4, 8, dan 16 hari', () => {
    expect(LEITNER_INTERVALS[1]).toBe(1);
    expect(LEITNER_INTERVALS[2]).toBe(2);
    expect(LEITNER_INTERVALS[3]).toBe(4);
    expect(LEITNER_INTERVALS[4]).toBe(8);
    expect(LEITNER_INTERVALS[5]).toBe(16);
  });

  it('Kasus 20: filterCardsForSession membatasi maksimal 20 kartu baru dan menyertakan kartu jatuh tempo', () => {
    const cards = [];
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
          nextReviewAt: new Date('2026-10-19T08:00:00Z'),
        },
      });
    }

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

  it('Kasus 21: demoteCardOnQuizFailure menurunkan kartu ke Kotak 1 (+1 hari)', () => {
    const state: CardReviewState = {
      flashcardId: 'fc-failed',
      box: 4,
      repetitions: 3,
    };
    const res = demoteCardOnQuizFailure(state, baseDate);
    expect(res.boxAfter).toBe(1);
    expect(res.daysInterval).toBe(1);
    expect(res.nextReviewAt.toISOString()).toBe('2026-10-21T08:00:00.000Z');
  });
});

describe('Tahap 2: Grounding Konten, Validator AI, & Pemecah Naskah (ai-content.ts)', () => {
  const sampleMaterial = `
    Dalam arsitektur basis data modern, transaksi ACID menjamin keandalan sistem.
    Atomicity memastikan seluruh operasi dalam transaksi berhasil atau seluruhnya dibatalkan.
    Consistency memastikan data memenuhi seluruh batasan integritas skema.
    Isolation memisahkan eksekusi transaksi konkuren agar tidak saling mengganggu.
    Durability menjamin data yang telah di-commit tersimpan permanen pada penyimpanan non-volatile.
  `;

  // --- GROUNDING SCORE ---
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

  // --- VALIDATOR NASKAH PODCAST ---
  it('validatePodcastScript menolak naskah di bawah 450 kata', () => {
    const shortText = 'Satu dua tiga empat lima. '.repeat(50); // ~250 kata
    const res = validatePodcastScript(shortText);
    expect(res.isValid).toBe(false);
    expect(res.message).toContain('Minimal 450 kata');
  });

  it('validatePodcastScript menolak naskah di atas 900 kata', () => {
    const longText = 'Kata pengantar materi kuliah hari ini sangat mendalam. '.repeat(150); // 1200 kata
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

  // --- PEMECAH NASKAH PODCAST (SPLITTER FOR TTS) ---
  it('splitPodcastScriptIntoSegments memecah naskah pada batas paragraf tanpa memotong di tengah kalimat', () => {
    const para1 = 'Paragraf pertama menjelaskan konsep transaksi basis data secara mendalam. '.repeat(10);
    const para2 = 'Paragraf kedua mengulas struktur pohon B-Tree untuk mempercepat pencarian indeks. '.repeat(10);
    const fullScript = `${para1}\n\n${para2}`;

    const chunks = splitPodcastScriptIntoSegments(fullScript, 1000);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].text.length).toBeLessThanOrEqual(1000);
    // Tidak boleh terpotong di tengah kata
    expect(chunks[0].text.endsWith('.')).toBe(true);
  });

  it('mapCumulativeDuration menghitung titik awal dan akhir detik secara kumulatif', () => {
    const chunks = [
      { durationSeconds: 60 },
      { durationSeconds: 120 },
      { durationSeconds: 90 },
    ];
    const mapped = mapCumulativeDuration(chunks);
    expect(mapped[0]).toEqual({ chunkIndex: 0, startSecond: 0, endSecond: 60 });
    expect(mapped[1]).toEqual({ chunkIndex: 1, startSecond: 60, endSecond: 180 });
    expect(mapped[2]).toEqual({ chunkIndex: 2, startSecond: 180, endSecond: 270 });
  });

  // --- VALIDATOR KELUARAN FLASHCARD AI ---
  it('validateFlashcardsOutput membuang kartu dengan sumber material_id di luar daftar pilihan', () => {
    const rawCards: RawAiFlashcard[] = [
      { front: 'Apa itu ACID?', back: 'Atomicity, Consistency, Isolation, Durability', material_id: 'mat-valid' },
      { front: 'Apa itu NoSQL?', back: 'Basis data non-relasional dokumen', material_id: 'mat-invalid' },
    ];

    const res = validateFlashcardsOutput(rawCards, ['mat-valid'], { 'mat-valid': sampleMaterial });
    expect(res.validCards.length).toBe(1);
    expect(res.validCards[0].front).toBe('Apa itu ACID?');
    expect(res.discardedCount).toBe(1);
  });

  it('validateFlashcardsOutput membatasi maksimal 25 kartu per pekerjaan AI', () => {
    const rawCards: RawAiFlashcard[] = [];
    for (let i = 1; i <= 30; i++) {
      rawCards.push({
        front: `Pertanyaan ke-${i}?`,
        back: `Jawaban lengkap konsep ke-${i}.`,
        material_id: 'mat-1',
      });
    }

    const res = validateFlashcardsOutput(rawCards, ['mat-1'], { 'mat-1': sampleMaterial });
    expect(res.validCards.length).toBe(25);
    expect(res.discardedCount).toBe(5);
    expect(res.errors[0]).toContain('melebihi batas 25 kartu');
  });

  it('validateFlashcardsOutput membuang kartu dengan panjang karakter melebihi batas (depan > 200, belakang > 400)', () => {
    const rawCards: RawAiFlashcard[] = [
      {
        front: 'P'.repeat(250), // terlalu panjang (>200)
        back: 'Penjelasan singkat.',
        material_id: 'mat-1',
      },
      {
        front: 'Pertanyaan normal.',
        back: 'J'.repeat(450), // terlalu panjang (>400)
        material_id: 'mat-1',
      },
    ];

    const res = validateFlashcardsOutput(rawCards, ['mat-1'], { 'mat-1': sampleMaterial });
    expect(res.validCards.length).toBe(0);
    expect(res.discardedCount).toBe(2);
  });

  it('validateFlashcardsOutput membuang kartu dengan sisi depan duplikat', () => {
    const rawCards: RawAiFlashcard[] = [
      { front: 'Apa itu transaksi?', back: 'Kumpulan operasi basis data.', material_id: 'mat-1' },
      { front: '  apa itu transaksi? ', back: 'Penjelasan kedua.', material_id: 'mat-1' }, // duplikat case-insensitive
    ];

    const res = validateFlashcardsOutput(rawCards, ['mat-1'], { 'mat-1': sampleMaterial });
    expect(res.validCards.length).toBe(1);
    expect(res.discardedCount).toBe(1);
  });

  // --- DIFF KURASI DOSEN ---
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

  // --- TIRUAN CONTENT GENERATOR & SPEECH SYNTHESIZER ---
  it('MockContentGenerator menghasilkan kartu dan naskah podcast valid tanpa memanggil AI sungguhan', async () => {
    const mockGen = new MockContentGenerator();
    const flashcardsRes = await mockGen.generateFlashcards({
      materials: [{ id: 'mat-1', title: 'Basis Data', content: sampleMaterial }],
      chapterTitle: 'Transaksi dan Konkurensi',
    });

    expect(flashcardsRes.cards.length).toBeGreaterThan(0);
    expect(flashcardsRes.modelUsed).toBe('mock-ai-v1');

    const scriptRes = await mockGen.generatePodcastScript({
      materials: [{ id: 'mat-1', title: 'Basis Data', content: sampleMaterial }],
      chapterTitle: 'Transaksi dan Konkurensi',
    });

    expect(scriptRes.title).toContain('Transaksi dan Konkurensi');
    const scriptValidation = validatePodcastScript(scriptRes.scriptText);
    expect(scriptValidation.isValid).toBe(true);
    expect(scriptValidation.wordCount).toBeGreaterThanOrEqual(450);
    expect(scriptValidation.wordCount).toBeLessThanOrEqual(900);
  });

  it('MockSpeechSynthesizer menghasilkan buffer audio dan estimasi durasi suara yang realistis', async () => {
    const mockTts = new MockSpeechSynthesizer();
    const res = await mockTts.synthesize({
      text: 'Halo rekan-rekan mahasiswa sekalian, selamat datang pada podcast pembelajaran sistem informasi.',
      narrator: 'Pak Dosen',
    });

    expect(res.audioBuffer).toBeDefined();
    expect(res.audioBuffer.length).toBeGreaterThan(0);
    expect(res.durationSeconds).toBeGreaterThan(0);
    expect(res.format).toBe('mp3');
  });

  it('getContentGenerator dan getSpeechSynthesizer menerapkan prinsip gagal-tertutup saat konfigurasi nihil', () => {
    const origEnv = process.env.NODE_ENV;
    const origMock = process.env.MOCK_AI;
    const origGemini = process.env.GEMINI_API_KEY;
    const origAiModel = process.env.AI_MODEL;

    try {
      (process.env as any).NODE_ENV = 'production';
      delete process.env.MOCK_AI;
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const aiRes = getContentGenerator();
      expect(aiRes.generator).toBeNull();
      expect(aiRes.error).toContain('belum aktif');

      delete process.env.MOCK_TTS;
      delete process.env.TTS_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      const ttsRes = getSpeechSynthesizer();
      expect(ttsRes.synthesizer).toBeNull();
      expect(ttsRes.error).toContain('belum dikonfigurasi');
    } finally {
      (process.env as any).NODE_ENV = origEnv;
      if (origMock) process.env.MOCK_AI = origMock;
      if (origGemini) process.env.GEMINI_API_KEY = origGemini;
      if (origAiModel) process.env.AI_MODEL = origAiModel;
    }
  });

  it('GeminiContentGenerator menginisialisasi model dari AI_MODEL dan fail-closed jika apiKey kosong pada mode real', () => {
    const origKey = process.env.GEMINI_API_KEY;
    const origModel = process.env.AI_MODEL;

    try {
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      // Tanpa konfigurasi API key: generator bernilai null
      const failed = getContentGenerator({ forceReal: true });
      expect(failed.generator).toBeNull();
      expect(failed.error).toBe('Pembuatan konten AI belum aktif. Hubungi admin.');

      // Dengan konfigurasi API key dan model AI_MODEL
      process.env.GEMINI_API_KEY = 'test-gemini-key-12345';
      process.env.AI_MODEL = 'gemini-1.5-pro';

      const real = getContentGenerator({ forceReal: true });
      expect(real.generator).toBeInstanceOf(GeminiContentGenerator);
      const geminiGen = real.generator as GeminiContentGenerator;
      expect(geminiGen.apiKey).toBe('test-gemini-key-12345');
      expect(geminiGen.model).toBe('gemini-1.5-pro');
    } finally {
      if (origKey) process.env.GEMINI_API_KEY = origKey;
      else delete process.env.GEMINI_API_KEY;
      if (origModel) process.env.AI_MODEL = origModel;
      else delete process.env.AI_MODEL;
    }
  });

  it('GeminiContentGenerator fail-closed jika AI_MODEL kosong atau tidak disetel', () => {
    const origKey = process.env.GEMINI_API_KEY;
    const origModel = process.env.AI_MODEL;

    try {
      process.env.GEMINI_API_KEY = 'test-gemini-key-12345';
      delete process.env.AI_MODEL;

      // 1. Direct constructor call tanpa model dan tanpa AI_MODEL melempar error
      expect(() => new GeminiContentGenerator('test-gemini-key-12345')).toThrow(
        'Pembuatan konten AI belum aktif: AI_MODEL belum disetel. Hubungi admin.'
      );
      expect(() => new GeminiContentGenerator('test-gemini-key-12345', '  ')).toThrow(
        'Pembuatan konten AI belum aktif: AI_MODEL belum disetel. Hubungi admin.'
      );

      // 2. getContentGenerator({ forceReal: true }) mengembalikan error fail-closed saat AI_MODEL kosong
      const resultNoModel = getContentGenerator({ forceReal: true });
      expect(resultNoModel.generator).toBeNull();
      expect(resultNoModel.error).toBe(
        'Pembuatan konten AI belum aktif: AI_MODEL belum disetel. Hubungi admin.'
      );

      // 3. Ketika AI_MODEL disetel kembali, generator berhasil diinisialisasi
      process.env.AI_MODEL = 'custom-gemini-prod';
      const resultWithModel = getContentGenerator({ forceReal: true });
      expect(resultWithModel.generator).toBeInstanceOf(GeminiContentGenerator);
      expect((resultWithModel.generator as GeminiContentGenerator).model).toBe('custom-gemini-prod');
    } finally {
      if (origKey) process.env.GEMINI_API_KEY = origKey;
      else delete process.env.GEMINI_API_KEY;
      if (origModel) process.env.AI_MODEL = origModel;
      else delete process.env.AI_MODEL;
    }
  });
});
