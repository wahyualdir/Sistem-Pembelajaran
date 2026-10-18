/**
 * SIAJAR - Modul Utilitas Murni Ujian & Analisis Akademik (Fase 4)
 * Mencakup:
 * 1. Analisis butir soal (Tingkat kesukaran, Daya pembeda, Point-Biserial, KR-20 / Alpha, Pengecoh)
 * 2. Perhitungan gabung nilai susulan & remedial (tertinggi, ganti, rata-rata, score cap)
 * 3. Evaluasi pencocokan keluaran kode auto-grader (exact, trim, tokens, float)
 * 4. Perhitungan ketercapaian CPMK dan CPL
 * 5. Deteksi kemiripan teks (Jaccard shingle) & kode (tokenized winnowing)
 */

// ============================================================================
// 1. ANALISIS BUTIR SOAL (Bagian 11.4)
// ============================================================================

export interface ParticipantScore {
  studentId: string;
  totalScore: number;
  itemScores: Record<string, number>; // questionId -> score (0 or 1 for MC, 0..max for essay/code)
  itemChoices?: Record<string, string>; // questionId -> selectedOption (e.g., 'A', 'B', 'C', 'D')
}

export interface ItemAnalysisResult {
  questionId: string;
  n: number;
  difficultyP: number;
  difficultyCategory: 'sukar' | 'sedang' | 'mudah';
  discriminationD: number;
  discriminationCategory: 'sangat_baik' | 'baik' | 'cukup' | 'perlu_revisi' | 'data_belum_cukup';
  pointBiserial: number;
  distractorWarnings: string[];
  needsRevision: boolean;
  optionCounts: Record<string, number>;
}

export interface ExamSummaryResult {
  n: number;
  mean: number;
  median: number;
  stddev: number;
  min: number;
  max: number;
  kr20: number;
  histogram: Array<{ bin: string; count: number }>;
}

export function calcMean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return Math.round((sum / numbers.length) * 100) / 100;
}

export function calcStdDev(numbers: number[], mean?: number): number {
  if (numbers.length <= 1) return 0;
  const m = mean ?? calcMean(numbers);
  const variance = numbers.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / numbers.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

export function calcMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
}

/**
 * Menghitung analisis butir soal per butir dan ringkasan ujian
 */
export function analyzeExamItems(
  questionIds: string[],
  maxScores: Record<string, number>,
  participants: ParticipantScore[],
  correctOptions?: Record<string, string> // questionId -> correct option key e.g. 'A'
): { items: Record<string, ItemAnalysisResult>; summary: ExamSummaryResult } {
  const n = participants.length;
  if (n === 0) {
    return {
      items: {},
      summary: {
        n: 0,
        mean: 0,
        median: 0,
        stddev: 0,
        min: 0,
        max: 0,
        kr20: 0,
        histogram: [],
      },
    };
  }

  const totalScores = participants.map((p) => p.totalScore);
  const meanTotal = calcMean(totalScores);
  const sTotal = calcStdDev(totalScores, meanTotal);
  const medianTotal = calcMedian(totalScores);
  const minTotal = Math.min(...totalScores);
  const maxTotal = Math.max(...totalScores);

  // Buat histogram 5 bin
  const range = maxTotal - minTotal;
  const binStep = range > 0 ? range / 5 : 1;
  const histogram: Array<{ bin: string; count: number }> = [];
  for (let b = 0; b < 5; b++) {
    const start = minTotal + b * binStep;
    const end = b === 4 ? maxTotal : start + binStep;
    const binLabel = `${Math.round(start)}-${Math.round(end)}`;
    const count = totalScores.filter((s) => (b === 4 ? s >= start && s <= end : s >= start && s < end)).length;
    histogram.push({ bin: binLabel, count });
  }

  // Urutkan peserta berdasarkan totalScore descending
  const sorted = [...participants].sort((a, b) => b.totalScore - a.totalScore);
  const groupSize = Math.max(1, Math.round(n * 0.27));
  const upperGroup = sorted.slice(0, groupSize);
  const lowerGroup = sorted.slice(n - groupSize);

  const items: Record<string, ItemAnalysisResult> = {};
  const pList: number[] = [];
  const qList: number[] = [];

  for (const qId of questionIds) {
    const qMax = maxScores[qId] ?? 1;
    const rawScores = participants.map((p) => p.itemScores[qId] ?? 0);
    const avgScore = rawScores.reduce((a, b) => a + b, 0) / n;
    const p = qMax > 0 ? avgScore / qMax : 0;
    const q = Math.max(0, 1 - p);
    pList.push(p);
    qList.push(q);

    // Kategori Kesukaran
    let difficultyCategory: 'sukar' | 'sedang' | 'mudah' = 'sedang';
    if (p < 0.3) difficultyCategory = 'sukar';
    else if (p > 0.7) difficultyCategory = 'mudah';

    // Daya Pembeda (D = p_atas - p_bawah)
    const upperAvg = upperGroup.reduce((sum, u) => sum + (u.itemScores[qId] ?? 0), 0) / groupSize;
    const lowerAvg = lowerGroup.reduce((sum, l) => sum + (l.itemScores[qId] ?? 0), 0) / groupSize;
    const pUpper = qMax > 0 ? upperAvg / qMax : 0;
    const pLower = qMax > 0 ? lowerAvg / qMax : 0;
    const D = Math.round((pUpper - pLower) * 10000) / 10000;

    let discriminationCategory: ItemAnalysisResult['discriminationCategory'];
    if (n < 20) {
      discriminationCategory = 'data_belum_cukup';
    } else if (D >= 0.4) {
      discriminationCategory = 'sangat_baik';
    } else if (D >= 0.3) {
      discriminationCategory = 'baik';
    } else if (D >= 0.2) {
      discriminationCategory = 'cukup';
    } else {
      discriminationCategory = 'perlu_revisi';
    }

    // Korelasi Point-Biserial: r_pb = (M1 - M0) / s * sqrt(p * q)
    let r_pb = 0;
    const correctGroup = participants.filter((pt) => (pt.itemScores[qId] ?? 0) >= qMax);
    const incorrectGroup = participants.filter((pt) => (pt.itemScores[qId] ?? 0) < qMax);
    if (correctGroup.length > 0 && incorrectGroup.length > 0 && sTotal > 0 && p > 0 && q > 0) {
      const M1 = calcMean(correctGroup.map((c) => c.totalScore));
      const M0 = calcMean(incorrectGroup.map((inc) => inc.totalScore));
      r_pb = ((M1 - M0) / sTotal) * Math.sqrt(p * q);
      r_pb = Math.round(r_pb * 10000) / 10000;
    }

    // Analisis Pengecoh & Option Counts
    const optionCounts: Record<string, number> = {};
    const upperOptionCounts: Record<string, number> = {};
    const lowerOptionCounts: Record<string, number> = {};
    for (const pt of participants) {
      const opt = pt.itemChoices?.[qId];
      if (opt) {
        optionCounts[opt] = (optionCounts[opt] ?? 0) + 1;
      }
    }
    for (const u of upperGroup) {
      const opt = u.itemChoices?.[qId];
      if (opt) upperOptionCounts[opt] = (upperOptionCounts[opt] ?? 0) + 1;
    }
    for (const l of lowerGroup) {
      const opt = l.itemChoices?.[qId];
      if (opt) lowerOptionCounts[opt] = (lowerOptionCounts[opt] ?? 0) + 1;
    }

    const distractorWarnings: string[] = [];
    const correctOpt = correctOptions?.[qId];
    for (const [optKey, count] of Object.entries(optionCounts)) {
      if (optKey === correctOpt) continue;
      const pct = (count / n) * 100;
      if (pct < 5) {
        distractorWarnings.push(`Pilihan ${optKey} dipilih kurang dari 5% peserta (${pct.toFixed(1)}%).`);
      }
      const uCount = upperOptionCounts[optKey] ?? 0;
      const lCount = lowerOptionCounts[optKey] ?? 0;
      if (uCount > lCount) {
        distractorWarnings.push(`Pilihan ${optKey} lebih banyak dipilih kelompok atas (${uCount}) daripada kelompok bawah (${lCount}) - indikasi ambigu.`);
      }
    }

    const needsRevision = discriminationCategory === 'perlu_revisi' || distractorWarnings.length > 0;

    items[qId] = {
      questionId: qId,
      n,
      difficultyP: Math.round(p * 10000) / 10000,
      difficultyCategory,
      discriminationD: D,
      discriminationCategory,
      pointBiserial: r_pb,
      distractorWarnings,
      needsRevision,
      optionCounts,
    };
  }

  // Reliabilitas KR-20: (k / (k - 1)) * (1 - sum(p * q) / s^2)
  const k = questionIds.length;
  let kr20 = 0;
  if (k > 1 && sTotal > 0) {
    const sumPq = pList.reduce((sum, p, i) => sum + p * qList[i], 0);
    const variance = Math.pow(sTotal, 2);
    kr20 = (k / (k - 1)) * (1 - sumPq / variance);
    kr20 = Math.max(0, Math.min(1, Math.round(kr20 * 10000) / 10000));
  }

  return {
    items,
    summary: {
      n,
      mean: meanTotal,
      median: medianTotal,
      stddev: sTotal,
      min: minTotal,
      max: maxTotal,
      kr20,
      histogram,
    },
  };
}

// ============================================================================
// 2. TOKEN & GABUNG NILAI REMEDIAL (Bagian 11.2)
// ============================================================================

const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // tanpa 0/O, 1/I/L

export function generateExamToken(): string {
  let token = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * TOKEN_ALPHABET.length);
    token += TOKEN_ALPHABET[idx];
  }
  return token;
}

/**
 * Menghitung nilai gabungan untuk ujian remedial / susulan
 */
export function calcCombinedExamScore(
  utamaScore: number,
  remedialScore: number | null,
  policy: 'tertinggi' | 'ganti' | 'rata_rata',
  scoreCap: number | null = null
): number {
  if (remedialScore === null || remedialScore === undefined) {
    return Math.round(utamaScore * 100) / 100;
  }

  // Terapkan score_cap pada remedial
  const effectiveRemedial = scoreCap !== null ? Math.min(remedialScore, scoreCap) : remedialScore;

  let result = utamaScore;
  switch (policy) {
    case 'tertinggi':
      result = Math.max(utamaScore, effectiveRemedial);
      break;
    case 'ganti':
      result = effectiveRemedial;
      break;
    case 'rata_rata':
      result = (utamaScore + effectiveRemedial) / 2;
      break;
  }

  return Math.round(result * 100) / 100;
}

/**
 * Memvalidasi apakah mahasiswa berhak mengikuti ujian susulan / remedial (Bagian 11.2)
 */
export function validateMakeupParticipation(
  examKind: 'utama' | 'susulan' | 'remedial',
  studentId: string,
  allowedStudentIds: string[]
): { allowed: boolean; reason?: string } {
  if (examKind === 'utama') {
    return { allowed: true };
  }

  const isRegistered = allowedStudentIds.includes(studentId);
  if (!isRegistered) {
    return {
      allowed: false,
      reason: `Akses ditolak. Anda tidak terdaftar sebagai peserta ujian ${examKind} ini.`,
    };
  }

  return { allowed: true };
}



// ============================================================================
// 3. AUTO-GRADER SOAL KODING (Bagian 11.3)
// ============================================================================

export type CompareMode = 'exact' | 'trim' | 'tokens' | 'float';

export function compareOutput(
  actual: string,
  expected: string,
  mode: CompareMode = 'trim'
): boolean {
  if (mode === 'exact') {
    return actual === expected;
  }

  if (mode === 'trim') {
    return actual.trim() === expected.trim();
  }

  if (mode === 'tokens') {
    const actualTokens = actual.trim().split(/\s+/).filter(Boolean);
    const expectedTokens = expected.trim().split(/\s+/).filter(Boolean);
    if (actualTokens.length !== expectedTokens.length) return false;
    return actualTokens.every((tok, i) => tok === expectedTokens[i]);
  }

  if (mode === 'float') {
    const actualTokens = actual.trim().split(/\s+/).filter(Boolean);
    const expectedTokens = expected.trim().split(/\s+/).filter(Boolean);
    if (actualTokens.length !== expectedTokens.length) return false;

    const EPSILON = 1e-4;
    return actualTokens.every((tok, i) => {
      const actNum = parseFloat(tok);
      const expNum = parseFloat(expectedTokens[i]);
      if (isNaN(actNum) || isNaN(expNum)) {
        return tok === expectedTokens[i];
      }
      return Math.abs(actNum - expNum) <= EPSILON;
    });
  }

  return actual.trim() === expected.trim();
}

// ============================================================================
// 4. PEMETAAN CPMK KE CPL (Bagian 11.5)
// ============================================================================

export interface AssessmentItemForCpmk {
  id: string;
  classId: string;
  cpmkId: string;
  score: number;
  maxScore: number;
  weightPercent: number; // e.g. 50%
  isPublished: boolean;
}

export interface CpmkCplMapping {
  cpmkId: string;
  cplId: string;
  weightPercent: number;
}

/**
 * Menghitung skor CPMK mahasiswa di suatu kelas (rata-rata tertimbang skor / maxScore * bobot)
 */
export function calcStudentCpmkScores(
  items: AssessmentItemForCpmk[]
): Record<string, number> {
  // Hanya butir yang sudah dipublikasikan yang dihitung
  const publishedItems = items.filter((item) => item.isPublished && item.maxScore > 0);

  const cpmkBuckets: Record<string, { totalWeightedScore: number; totalWeight: number }> = {};

  for (const it of publishedItems) {
    if (!cpmkBuckets[it.cpmkId]) {
      cpmkBuckets[it.cpmkId] = { totalWeightedScore: 0, totalWeight: 0 };
    }
    const ratio = Math.min(1, Math.max(0, it.score / it.maxScore));
    cpmkBuckets[it.cpmkId].totalWeightedScore += ratio * 100 * it.weightPercent;
    cpmkBuckets[it.cpmkId].totalWeight += it.weightPercent;
  }

  const results: Record<string, number> = {};
  for (const [cpmkId, bucket] of Object.entries(cpmkBuckets)) {
    if (bucket.totalWeight > 0) {
      results[cpmkId] = Math.round((bucket.totalWeightedScore / bucket.totalWeight) * 100) / 100;
    } else {
      results[cpmkId] = 0;
    }
  }

  return results;
}

/**
 * Menghitung skor CPL mahasiswa dari skor-skor CPMK berdasarkan matriks pemetaan
 */
export function calcStudentCplScores(
  cpmkScores: Record<string, number>,
  mappings: CpmkCplMapping[]
): Record<string, number> {
  const cplBuckets: Record<string, { totalWeightedScore: number; totalWeight: number }> = {};

  for (const map of mappings) {
    const cpmkScore = cpmkScores[map.cpmkId];
    if (cpmkScore === undefined) continue;

    if (!cplBuckets[map.cplId]) {
      cplBuckets[map.cplId] = { totalWeightedScore: 0, totalWeight: 0 };
    }
    cplBuckets[map.cplId].totalWeightedScore += cpmkScore * map.weightPercent;
    cplBuckets[map.cplId].totalWeight += map.weightPercent;
  }

  const results: Record<string, number> = {};
  for (const [cplId, bucket] of Object.entries(cplBuckets)) {
    if (bucket.totalWeight > 0) {
      results[cplId] = Math.round((bucket.totalWeightedScore / bucket.totalWeight) * 100) / 100;
    } else {
      results[cplId] = 0;
    }
  }

  return results;
}

// ============================================================================
// 5. CEK KEMIRIPAN TUGAS (Bagian 11.6)
// ============================================================================

const ID_STOPWORDS = new Set([
  'dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'adalah', 'ini', 'itu',
  'dengan', 'atau', 'dalam', 'oleh', 'karena', 'maka', 'tentang', 'sebagai',
  'bisa', 'dapat', 'akan', 'telah', 'sudah', 'jika', 'bila', 'saat', 'ada'
]);

/**
 * Simple 32-bit FNV-1a hash untuk string
 */
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Ekstraksi shingle 5 kata dari teks bahasa Indonesia
 */
export function extractTextShingles(text: string): number[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !ID_STOPWORDS.has(w));

  if (normalized.length < 5) {
    return normalized.length > 0 ? [fnv1a(normalized.join(' '))] : [];
  }

  const shingles = new Set<number>();
  for (let i = 0; i <= normalized.length - 5; i++) {
    const chunk = normalized.slice(i, i + 5).join(' ');
    shingles.add(fnv1a(chunk));
  }
  return Array.from(shingles);
}

/**
 * Kemiripan Jaccard teks = |A ∩ B| / |A ∪ B|
 */
export function calcTextJaccardSimilarity(shinglesA: number[], shinglesB: number[]): number {
  if (shinglesA.length === 0 || shinglesB.length === 0) return 0;
  const setA = new Set(shinglesA);
  const setB = new Set(shinglesB);

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  if (union === 0) return 0;
  return Math.round((intersection / union) * 10000) / 10000;
}

/**
 * Tokenisasi kode sederhana: nama variabel & fungsi diganti $ID, literal diganti $LIT
 */
export function extractCodeFingerprints(
  sourceCode: string,
  starterHashesToExclude?: Set<number>
): number[] {
  // Ganti string dan nomor literal dengan $LIT
  const sanitized = sourceCode
    .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, ' $LIT ')
    .replace(/\b\d+(\.\d+)?\b/g, ' $LIT ')
    .replace(/\/\/.*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const KEYWORDS = new Set([
    'if', 'else', 'for', 'while', 'do', 'return', 'function', 'def', 'class',
    'import', 'from', 'export', 'const', 'let', 'var', 'int', 'float', 'double',
    'void', 'public', 'private', 'protected', 'static', 'new', 'try', 'catch',
    'throw', 'throws', 'switch', 'case', 'break', 'continue', 'default', 'async', 'await'
  ]);

  const rawTokens = sanitized.split(/[^\w$]+/).filter(Boolean);
  const tokenStream = rawTokens.map((t) => (KEYWORDS.has(t) ? t : '$ID'));

  if (tokenStream.length < 8) {
    const h = fnv1a(tokenStream.join(''));
    return starterHashesToExclude?.has(h) ? [] : [h];
  }

  // Bentuk 8-grams
  const kGrams: number[] = [];
  for (let i = 0; i <= tokenStream.length - 8; i++) {
    const chunk = tokenStream.slice(i, i + 8).join('');
    kGrams.push(fnv1a(chunk));
  }

  // Winnowing (jendela 4): pilih hash minimum pada setiap sliding window
  const windowSize = 4;
  const fingerprints = new Set<number>();
  for (let i = 0; i <= kGrams.length - windowSize; i++) {
    const win = kGrams.slice(i, i + windowSize);
    const minVal = Math.min(...win);
    if (!starterHashesToExclude?.has(minVal)) {
      fingerprints.add(minVal);
    }
  }

  return Array.from(fingerprints);
}

/**
 * Ekstraksi seluruh k-gram dari starter code untuk penyaringan winnowing
 */
export function extractStarterCodeKgrams(sourceCode: string): Set<number> {
  const sanitized = sourceCode
    .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, ' $LIT ')
    .replace(/\b\d+(\.\d+)?\b/g, ' $LIT ')
    .replace(/\/\/.*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const KEYWORDS = new Set([
    'if', 'else', 'for', 'while', 'do', 'return', 'function', 'def', 'class',
    'import', 'from', 'export', 'const', 'let', 'var', 'int', 'float', 'double',
    'void', 'public', 'private', 'protected', 'static', 'new', 'try', 'catch',
    'throw', 'throws', 'switch', 'case', 'break', 'continue', 'default', 'async', 'await'
  ]);

  const rawTokens = sanitized.split(/[^\w$]+/).filter(Boolean);
  const tokenStream = rawTokens.map((t) => (KEYWORDS.has(t) ? t : '$ID'));

  const set = new Set<number>();
  if (tokenStream.length < 8) {
    set.add(fnv1a(tokenStream.join('')));
    return set;
  }

  for (let i = 0; i <= tokenStream.length - 8; i++) {
    const chunk = tokenStream.slice(i, i + 8).join('');
    set.add(fnv1a(chunk));
  }
  return set;
}

/**
 * Kemiripan kode: irisan / min(|A|, |B|)
 */
export function calcCodeSimilarity(fingerprintsA: number[], fingerprintsB: number[]): number {
  if (fingerprintsA.length === 0 || fingerprintsB.length === 0) return 0;
  const setA = new Set(fingerprintsA);
  const setB = new Set(fingerprintsB);

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const minSize = Math.min(setA.size, setB.size);
  if (minSize === 0) return 0;
  return Math.round((intersection / minSize) * 10000) / 10000;
}
