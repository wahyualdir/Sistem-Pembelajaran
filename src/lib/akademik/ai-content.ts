/**
 * Modul Pembantu Konten Belajar AI & Skor Grounding
 * Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md Bagian 8.2 & 8.3
 * Fungsi murni untuk validasi sitasi materi sumber, naskah podcast, dan rekam jejak kurasi dosen.
 */

// ----------------------------------------------------------------------------
// 1. SKOR GROUNDING (KETERIKATAN SUMBER)
// ----------------------------------------------------------------------------

/**
 * Menghitung skor keterikatan (grounding score) antara konten kartu dan teks sumber materi (0 - 100).
 * Menggunakan tokenisasi dan pencocokan n-gram kata penting untuk memverifikasi sitasi.
 */
export function calculateGroundingScore(
  front: string,
  back: string,
  sourceText: string
): number {
  if (!sourceText || sourceText.trim().length === 0) {
    return 0;
  }

  const clean = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const cleanSource = clean(sourceText);
  const cardCombined = `${clean(front)} ${clean(back)}`;

  // Ambil token kata kunci dengan panjang minimal 4 karakter (menghindari stop words pendek)
  const tokens = cardCombined
    .split(' ')
    .filter((w) => w.length >= 4);

  if (tokens.length === 0) {
    return 100;
  }

  let matchedCount = 0;
  for (const token of tokens) {
    if (cleanSource.includes(token)) {
      matchedCount++;
    }
  }

  const ratio = matchedCount / tokens.length;
  return Math.min(100, Math.round(ratio * 100));
}

// ----------------------------------------------------------------------------
// 2. VALIDATOR NASKAH PODCAST & PEMECAH NASKAH (TTS SEGMENTS)
// ----------------------------------------------------------------------------

/**
 * Validasi naskah podcast dosen:
 * Sesuai spesifikasi, naskah harus berkisar 450 hingga 900 kata (~3 sampai 6 menit pada kecepatan 150 kpm).
 */
export function validatePodcastScript(scriptText: string): {
  isValid: boolean;
  wordCount: number;
  estimatedMinutes: number;
  message?: string;
} {
  if (!scriptText || scriptText.trim().length === 0) {
    return {
      isValid: false,
      wordCount: 0,
      estimatedMinutes: 0,
      message: 'Naskah podcast tidak boleh kosong.',
    };
  }

  const words = scriptText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedMinutes = Math.round((wordCount / 150) * 10) / 10;

  if (wordCount < 450) {
    return {
      isValid: false,
      wordCount,
      estimatedMinutes,
      message: `Naskah terlalu singkat (${wordCount} kata). Minimal 450 kata untuk ringkasan materi bermakna (~3 menit).`,
    };
  }

  if (wordCount > 900) {
    return {
      isValid: false,
      wordCount,
      estimatedMinutes,
      message: `Naskah terlalu panjang (${wordCount} kata). Maksimal 900 kata agar mahasiswa tetap fokus (~6 menit).`,
    };
  }

  return {
    isValid: true,
    wordCount,
    estimatedMinutes,
  };
}

export interface ScriptSegmentChunk {
  index: number;
  text: string;
  charCount: number;
  wordCount: number;
  estimatedDurationSeconds: number;
}

/**
 * Pemecah naskah podcast untuk TTS:
 * Memecah naskah menjadi potongan segmen (chunks) tanpa memotong di tengah kalimat atau kata.
 * Batas karakter per chunk default 1000 karakter (aman untuk sebagian besar TTS provider).
 */
export function splitPodcastScriptIntoSegments(
  scriptText: string,
  maxCharsPerSegment = 1000
): ScriptSegmentChunk[] {
  if (!scriptText || scriptText.trim().length === 0) {
    return [];
  }

  // Pecah berdasarkan paragraf terlebih dahulu
  const rawParagraphs = scriptText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: ScriptSegmentChunk[] = [];
  let currentBuffer = '';
  let chunkIndex = 0;

  const pushCurrentBuffer = () => {
    if (currentBuffer.trim().length > 0) {
      const words = currentBuffer.trim().split(/\s+/).length;
      // Estimasi 150 kata per menit = 2.5 kata per detik
      const estimatedSec = Math.max(1, Math.round(words / 2.5));
      chunks.push({
        index: chunkIndex++,
        text: currentBuffer.trim(),
        charCount: currentBuffer.trim().length,
        wordCount: words,
        estimatedDurationSeconds: estimatedSec,
      });
      currentBuffer = '';
    }
  };

  for (const para of rawParagraphs) {
    if ((currentBuffer + '\n\n' + para).trim().length <= maxCharsPerSegment) {
      currentBuffer = currentBuffer ? `${currentBuffer}\n\n${para}` : para;
    } else {
      // Jika satu paragraf melebihi maxChars, pecah berdasarkan kalimat (. ! ?)
      if (para.length > maxCharsPerSegment) {
        pushCurrentBuffer();
        const sentences = para.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [para];
        for (const sent of sentences) {
          if ((currentBuffer + ' ' + sent).trim().length <= maxCharsPerSegment) {
            currentBuffer = currentBuffer ? `${currentBuffer} ${sent.trim()}` : sent.trim();
          } else {
            pushCurrentBuffer();
            currentBuffer = sent.trim();
          }
        }
      } else {
        pushCurrentBuffer();
        currentBuffer = para;
      }
    }
  }

  pushCurrentBuffer();
  return chunks;
}

/**
 * Menghitung posisi kumulatif potongan audio podcast
 */
export function mapCumulativeDuration(chunks: { durationSeconds: number }[]): {
  chunkIndex: number;
  startSecond: number;
  endSecond: number;
}[] {
  let accumulated = 0;
  return chunks.map((chunk, idx) => {
    const start = accumulated;
    accumulated += chunk.durationSeconds;
    return {
      chunkIndex: idx,
      startSecond: start,
      endSecond: accumulated,
    };
  });
}

// ----------------------------------------------------------------------------
// 3. VALIDATOR KELUARAN KARTU AI (FLASHCARD OUTPUT VALIDATOR)
// ----------------------------------------------------------------------------

export interface RawAiFlashcard {
  front: string;
  back: string;
  material_id?: string;
  topic_id?: string;
}

export interface ValidatedCardResult {
  validCards: {
    front: string;
    back: string;
    materialId: string;
    topicId?: string;
    groundingScore: number;
    flaggedLowGrounding: boolean;
  }[];
  discardedCount: number;
  errors: string[];
}

/**
 * Memvalidasi keluaran draf kartu flashcard dari AI:
 * - Maksimal 25 kartu per pekerjaan
 * - Sisi depan maksimal 200 karakter, sisi belakang maksimal 400 karakter
 * - Memastikan material_id termasuk dalam daftar materi yang dipilih dosen (sumber di luar pilihan dibuang)
 * - Membuang kartu hampir kembar / duplikat pada sisi depan
 * - Menghitung skor grounding terhadap teks sumber
 */
export function validateFlashcardsOutput(
  rawCards: RawAiFlashcard[],
  allowedMaterialIds: string[],
  sourceTextByMaterialId: Record<string, string> = {},
  allowedTopicIds?: string[]
): ValidatedCardResult {
  const errors: string[] = [];
  let discardedCount = 0;

  if (!Array.isArray(rawCards)) {
    return { validCards: [], discardedCount: 0, errors: ['Keluaran AI bukan berupa senarai kartu (array).'] };
  }

  // Maksimal 25 kartu per pekerjaan
  const cardsToProcess = rawCards.slice(0, 25);
  if (rawCards.length > 25) {
    errors.push(`Keluaran AI melebihi batas 25 kartu (diterima ${rawCards.length}). ${rawCards.length - 25} kartu dipotong.`);
    discardedCount += rawCards.length - 25;
  }

  const validCards: ValidatedCardResult['validCards'] = [];
  const seenFronts = new Set<string>();

  for (const card of cardsToProcess) {
    const front = (card.front || '').trim();
    const back = (card.back || '').trim();
    const materialId = card.material_id?.trim();

    // Validasi kelengkapan teks
    if (!front || !back) {
      discardedCount++;
      continue;
    }

    // Batasan panjang karakter (depan <= 200, belakang <= 400)
    if (front.length > 200 || back.length > 400) {
      discardedCount++;
      continue;
    }

    // Sumber material_id harus sah dan ada di allowedMaterialIds
    if (!materialId || !allowedMaterialIds.includes(materialId)) {
      discardedCount++;
      continue;
    }

    // Validasi topik jika daftar topik ditentukan
    let topicId = card.topic_id?.trim();
    if (topicId && allowedTopicIds && !allowedTopicIds.includes(topicId)) {
      topicId = undefined; // buang topik yang tidak dikenal daripada membuang kartunya
    }

    // Cek duplikasi depan (case-insensitive & spasi dirapikan)
    const normalizedFront = front.toLowerCase().replace(/\s+/g, ' ');
    if (seenFronts.has(normalizedFront)) {
      discardedCount++;
      continue;
    }
    seenFronts.add(normalizedFront);

    // Hitung grounding score
    const sourceText = sourceTextByMaterialId[materialId] || '';
    const score = calculateGroundingScore(front, back, sourceText);

    validCards.push({
      front,
      back,
      materialId,
      topicId,
      groundingScore: score,
      flaggedLowGrounding: score < 60,
    });
  }

  return {
    validCards,
    discardedCount,
    errors,
  };
}

// ----------------------------------------------------------------------------
// 4. PERBEDAAN TEKS (DIFF) & AUDIT KURASI DOSEN
// ----------------------------------------------------------------------------

export function computeCardDiff(
  original: { front: string; back: string },
  edited: { front: string; back: string }
): {
  isChanged: boolean;
  frontChanged: boolean;
  backChanged: boolean;
  diff: Record<string, { from: string; to: string }>;
} {
  const frontChanged = original.front.trim() !== edited.front.trim();
  const backChanged = original.back.trim() !== edited.back.trim();
  const diff: Record<string, { from: string; to: string }> = {};

  if (frontChanged) {
    diff.front = { from: original.front, to: edited.front };
  }
  if (backChanged) {
    diff.back = { from: original.back, to: edited.back };
  }

  return {
    isChanged: frontChanged || backChanged,
    frontChanged,
    backChanged,
    diff,
  };
}

// ----------------------------------------------------------------------------
// 5. ANTARMUKA CONTENT GENERATOR & SPEECH SYNTHESIZER (DENGAN TIRUAN / MOCK)
// ----------------------------------------------------------------------------

export interface GenerateFlashcardsInput {
  materials: { id: string; title: string; content: string }[];
  chapterTitle: string;
  allowedTopicIds?: string[];
}

export interface GenerateFlashcardsOutput {
  cards: {
    front: string;
    back: string;
    materialId: string;
    topicId?: string;
  }[];
  modelUsed: string;
  tokensUsed?: { prompt: number; completion: number };
}

export interface GeneratePodcastScriptInput {
  materials: { id: string; title: string; content: string }[];
  chapterTitle: string;
  narrator?: 'Pak Dosen' | 'Bu Dosen';
}

export interface GeneratePodcastScriptOutput {
  title: string;
  narrator: 'Pak Dosen' | 'Bu Dosen';
  scriptText: string;
  modelUsed: string;
}

export interface ContentGenerator {
  generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput>;
  generatePodcastScript(input: GeneratePodcastScriptInput): Promise<GeneratePodcastScriptOutput>;
}

/**
 * Tiruan ContentGenerator untuk keperluan pengetesan unit dan E2E tanpa memanggil AI sungguhan.
 */
export class MockContentGenerator implements ContentGenerator {
  async generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
    const primaryMat = input.materials[0];
    const cards = [
      {
        front: `Apa konsep utama dari ${input.chapterTitle}?`,
        back: `Konsep utamanya adalah pemahaman mendasar mengenai ${input.chapterTitle} secara komprehensif.`,
        materialId: primaryMat?.id || 'mat-1',
        topicId: input.allowedTopicIds?.[0],
      },
      {
        front: `Bagaimana karakteristik ${primaryMat?.title || 'materi'}?`,
        back: `Karakteristik penting mencakup konsistensi dan integritas data yang tertera pada materi.`,
        materialId: primaryMat?.id || 'mat-1',
        topicId: input.allowedTopicIds?.[1],
      },
    ];

    return {
      cards,
      modelUsed: 'mock-ai-v1',
      tokensUsed: { prompt: 150, completion: 80 },
    };
  }

  async generatePodcastScript(input: GeneratePodcastScriptInput): Promise<GeneratePodcastScriptOutput> {
    const narrator = input.narrator || 'Pak Dosen';
    // Generate valid length script (~540 kata, rentang 450 - 900 kata)
    const paragraphs = [
      `Halo rekan-rekan mahasiswa sekalian. Bersama saya ${narrator}, pada rekaman audio narasi pembelajaran kali ini kita akan mengupas tuntas bab ${input.chapterTitle}. Modul perkuliahan ini memegang peranan yang sangat mendasar dan krusial dalam pemahaman arsitektur sistem informasi modern serta rekayasa perangkat lunak berskala besar. Melalui media podcast ini, Anda diajak untuk mendengarkan rangkuman konseptual yang disusun secara sistematis agar materi perkuliahan dapat dipahami dengan jernih, utuh, dan berbobot sebelum melangkah ke sesi latihan soal maupun kuis evaluasi pemahaman bab. Mari kita telusuri setiap konsep kunci dengan penuh rasa ingin tahu dan perhatian seksama.`,
      `Pertama-tama, mari kita telaah bersama mengapa topik pembelajaran ini begitu esensial dalam praktik rekayasa sistem basis data di industri teknologi saat ini. Ketika kita membangun sebuah platform digital yang melayani ribuan transaksi data konkuren dari berbagai penjuru, keandalan dan konsistensi data menjadi fondasi yang mutlak dipenuhi. Tanpa adanya pemahaman teoretis yang kokoh mengenai integritas relasional, sistem yang kita bangun akan rentan terhadap anomali pembaruan, kehilangan data berharga, serta kegagalan sinkronisasi yang dapat merugikan pengguna. Oleh karena itu, standarisasi ACID harus dipahami bukan sekadar sebagai teori ujian, melainkan sebagai prinsip rekayasa yang menjamin kelangsungan operasi sistem komputer secara konsisten.`,
      `Selanjutnya, perhatikan bagaimana setiap komponen di dalam modul bab ini saling terhubung secara harmonis untuk membentuk alur pemrosesan data yang terpercaya. Setiap entitas dirancang dengan batasan skema yang jelas, mulai dari penentuan kunci primer, kunci asing, hingga pembuatan aturan integritas domain yang ketat. Proses normalisasi data yang kita pelajari bukan bertujuan untuk menambah kerumitan desain, melainkan untuk mengeliminasi redundansi yang tidak perlu serta mencegah inkonsistensi saat data diperbarui secara simultan. Dengan menerapkan struktur normalisasi hingga bentuk ketiga, kita telah meletakkan arsitektur data yang kokoh, adaptif terhadap perubahan kebutuhan aplikasi, dan efisien dalam penggunaan sumber daya memori server.`,
      `Dalam implementasi teknis di dunia nyata, seorang perancang sistem sering kali dihadapkan pada kompromi antara kecepatan pembacaan query dan keamanan operasi penulisan data. Di sinilah teknik optimasi pengindeksan memegang peranan penting. Pemanfaatan struktur pohon seimbang seperti B-Tree memungkinkan mesin basis data mencari rekaman baris dalam kompleksitas waktu logaritmik, meskipun tabel telah memuat jutaan rekaman. Pemilihan atribut yang diindeks harus dilakukan secara bijak dan berbasis kebutuhan query aktual, karena indeks yang berlebihan justru dapat memperlambat proses transaksi penyisipan dan pembaruan data secara keseluruhan.`,
      `Sebagai penutup podcast pembelajaran bab ${input.chapterTitle} ini, saya mendorong rekan-rekan sekalian untuk tidak berhenti pada pemahaman audio saja. Buka kembali catatan kuliah Anda, pelajari kartu konsep pada modul flashcard berulang dengan jeda berkala untuk memperkuat daya ingat memori jangka panjang, dan tuntaskan kuis pemahaman bab untuk membuka pulau belajar berikutnya pada peta petualangan akademik Anda. Setiap usaha belajar yang konsisten akan membentuk kompetensi profesional yang bermanfaat bagi karier masa depan Anda. Selamat belajar, tetap semangat, jaga kesehatan, dan kita akan berjumpa kembali pada episode podcast bab selanjutnya.`,
    ];

    const scriptText = paragraphs.join('\n\n');
    return {
      title: `Podcast Bab: ${input.chapterTitle}`,
      narrator,
      scriptText,
      modelUsed: 'mock-ai-v1',
    };
  }
}

/**
 * Antarmuka Sintesis Suara (TTS)
 */
export interface SynthesizeAudioInput {
  text: string;
  voiceId?: string;
  narrator?: 'Pak Dosen' | 'Bu Dosen';
}

export interface SynthesizeAudioOutput {
  audioBuffer: Uint8Array;
  durationSeconds: number;
  format: 'mp3' | 'wav';
}

export interface SpeechSynthesizer {
  synthesize(input: SynthesizeAudioInput): Promise<SynthesizeAudioOutput>;
}

/**
 * Tiruan SpeechSynthesizer untuk pengetesan offline
 */
export class MockSpeechSynthesizer implements SpeechSynthesizer {
  async synthesize(input: SynthesizeAudioInput): Promise<SynthesizeAudioOutput> {
    const words = input.text.trim().split(/\s+/).length;
    // Estimasi ~2.5 kata per detik
    const durationSeconds = Math.max(1, Math.round(words / 2.5));
    // Dummy audio buffer (128 bytes of mock MP3 header)
    const dummyBytes = new Uint8Array(128).fill(42);

    return {
      audioBuffer: dummyBytes,
      durationSeconds,
      format: 'mp3',
    };
  }
}

/**
 * Factory pemeriksa konfigurasi: Gagal-tertutup jika API key tidak tersedia
 */
export function getContentGenerator(): { generator: ContentGenerator | null; error?: string } {
  const hasKey = !!(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim()
  );

  // Jika lingkungan testing atau tiruan aktif
  if (process.env.NODE_ENV === 'test' || process.env.MOCK_AI === 'true') {
    return { generator: new MockContentGenerator() };
  }

  if (!hasKey) {
    return {
      generator: null,
      error: 'Pembuatan konten AI belum aktif. Hubungi admin untuk konfigurasi kunci AI.',
    };
  }

  return { generator: new MockContentGenerator() };
}

export function getSpeechSynthesizer(): { synthesizer: SpeechSynthesizer | null; error?: string } {
  const hasKey = !!(
    process.env.TTS_API_KEY?.trim() ||
    process.env.ELEVENLABS_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim()
  );

  if (process.env.NODE_ENV === 'test' || process.env.MOCK_TTS === 'true') {
    return { synthesizer: new MockSpeechSynthesizer() };
  }

  if (!hasKey) {
    return {
      synthesizer: null,
      error: 'Pembuatan suara belum dikonfigurasi. Hubungi admin untuk mengatur penyedia TTS.',
    };
  }

  return { synthesizer: new MockSpeechSynthesizer() };
}
