export type SimilarityReviewStatus = 'BELUM_DITINJAU' | 'TIDAK_MASALAH' | 'PERLU_KLARIFIKASI' | 'PELANGGARAN';

export interface MatchingSegment {
  textA: string;
  textB: string;
  startIndexA: number;
  endIndexA: number;
  startIndexB: number;
  endIndexB: number;
}

export interface SimilarityPair {
  id: string;
  assignmentId: string;
  submissionIdA: string;
  studentIdA: string;
  studentNameA: string;
  submissionIdB: string;
  studentIdB: string;
  studentNameB: string;
  similarityScore: number; // 0 - 100%
  threshold: number; // 0 - 100%
  isCode: boolean;
  matchingSegments: MatchingSegment[];
  textA: string;
  textB: string;
  reviewStatus: SimilarityReviewStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  analyzedAt: string;
}

export interface AssignmentSimilarityConfig {
  assignmentId: string;
  threshold: number; // default 40
  excludeReferences: boolean;
}

// -------------------------------------------------------------
// In-Memory Persistent Store untuk Hasil Deteksi Kemiripan
// -------------------------------------------------------------
export const similarityPairsStore: SimilarityPair[] =
  ((globalThis as any).__siajarSimilarityPairs ??= []);
export const similarityConfigsStore: Map<string, AssignmentSimilarityConfig> =
  ((globalThis as any).__siajarSimilarityConfigs ??= new Map<string, AssignmentSimilarityConfig>());

// -------------------------------------------------------------
// 1. Algoritma Normalisasi Teks & Kode Sumber
// -------------------------------------------------------------

/**
 * Normalisasi kode sumber:
 * - Hapus komentar satu baris (//, #) dan multi-baris (/* ... * /)
 * - Hapus whitespace berlebih dan indentasi
 * - Samakan nama variabel lokal (tokenisasi kanonikal v0, v1, v2...)
 */
export function normalizeSourceCode(code: string): { normalized: string; isCode: boolean } {
  if (!code) return { normalized: '', isCode: false };

  // Heuristik pendeteksian apakah konten merupakan kode program
  const codeKeywords = /\b(function|const|let|var|def|class|import|return|if|else|for|while|public|private|void|int|string|async|await|console\.log|print)\b/g;
  const keywordMatches = code.match(codeKeywords) || [];
  const isCode = keywordMatches.length >= 3 || (code.includes('{') && code.includes('}')) || code.includes('();');

  // 1. Hapus block comments
  let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, '');
  // 2. Hapus line comments (// dan #)
  cleaned = cleaned.replace(/\/\/.*$/gm, '').replace(/#.*$/gm, '');

  if (isCode) {
    // 3. Kanonikalisasi nama variabel lokal (alphanumeric identifiers non-keyword)
    const keywords = new Set([
      'function', 'const', 'let', 'var', 'def', 'class', 'import', 'from', 'return',
      'if', 'else', 'elif', 'for', 'while', 'public', 'private', 'protected', 'void',
      'int', 'string', 'boolean', 'float', 'double', 'async', 'await', 'try', 'catch',
      'finally', 'throw', 'new', 'this', 'self', 'super', 'switch', 'case', 'break',
      'continue', 'default', 'null', 'undefined', 'true', 'false', 'export', 'default',
    ]);

    const varMap = new Map<string, string>();
    let varCounter = 0;

    // Ganti identifier variabel non-keyword dengan v0, v1, v2...
    cleaned = cleaned.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (token) => {
      if (keywords.has(token)) return token;
      if (!varMap.has(token)) {
        varMap.set(token, `v${varCounter++}`);
      }
      return varMap.get(token)!;
    });
  }

  // 4. Normalisasi whitespace
  const normalized = cleaned.replace(/\s+/g, ' ').trim().toLowerCase();
  return { normalized, isCode };
}

/**
 * Normalisasi teks/laporan (hapus tanda baca dan spasi ganda)
 */
export function normalizeProse(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pembuatan N-Gram / Shingles
 */
export function generateShingles(text: string, shingleSize = 3): Set<string> {
  const words = text.split(' ').filter(Boolean);
  const shingles = new Set<string>();

  if (words.length < shingleSize) {
    if (words.length > 0) shingles.add(words.join(' '));
    return shingles;
  }

  for (let i = 0; i <= words.length - shingleSize; i++) {
    shingles.add(words.slice(i, i + shingleSize).join(' '));
  }

  return shingles;
}

/**
 * Hitung Jaccard Similarity Coefficient: |A ∩ B| / |A ∪ B|
 */
export function calculateJaccardSimilarity(textA: string, textB: string): {
  score: number;
  isCode: boolean;
  matchingSegments: MatchingSegment[];
} {
  const normA = normalizeSourceCode(textA);
  const normB = normalizeSourceCode(textB);
  const isCode = normA.isCode || normB.isCode;

  const targetA = isCode ? normA.normalized : normalizeProse(textA);
  const targetB = isCode ? normB.normalized : normalizeProse(textB);

  if (!targetA || !targetB) {
    return { score: 0, isCode, matchingSegments: [] };
  }

  const shinglesA = generateShingles(targetA, isCode ? 4 : 3);
  const shinglesB = generateShingles(targetB, isCode ? 4 : 3);

  if (shinglesA.size === 0 || shinglesB.size === 0) {
    return { score: 0, isCode, matchingSegments: [] };
  }

  let intersectionCount = 0;
  shinglesA.forEach((shingle) => {
    if (shinglesB.has(shingle)) {
      intersectionCount++;
    }
  });

  const unionCount = shinglesA.size + shinglesB.size - intersectionCount;
  const score = unionCount > 0 ? Math.round((intersectionCount / unionCount) * 100) : 0;

  // Ekstrak potongan teks yang identik untuk penyorotan berdampingan (Side-by-Side Highlight)
  const matchingSegments = extractMatchingSegments(textA, textB);

  return { score, isCode, matchingSegments };
}

/**
 * Menemukan segmen kalimat atau frasa yang identik antara dua dokumen
 */
export function extractMatchingSegments(textA: string, textB: string): MatchingSegment[] {
  const segments: MatchingSegment[] = [];
  const sentencesA = textA.split(/[\n\r.]+/).map((s) => s.trim()).filter((s) => s.length > 15);
  const lowerB = textB.toLowerCase();

  for (const sentence of sentencesA) {
    const cleanSentence = sentence.toLowerCase().replace(/\s+/g, ' ');
    const posB = lowerB.indexOf(cleanSentence);
    if (posB !== -1) {
      const posA = textA.indexOf(sentence);
      segments.push({
        textA: sentence,
        textB: textB.slice(posB, posB + sentence.length),
        startIndexA: posA,
        endIndexA: posA + sentence.length,
        startIndexB: posB,
        endIndexB: posB + sentence.length,
      });
    }
  }

  return segments.slice(0, 8); // Ambil maksimal 8 segmen paling representatif
}
