/**
 * Modul Pembantu Konten Belajar AI & Skor Grounding
 * Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md Bagian 8.2 & 8.3
 * Fungsi murni untuk validasi sitasi materi sumber, naskah podcast, dan rekam jejak kurasi dosen.
 */

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

/**
 * Menghitung perbedaan teks sebelum dan sesudah diedit oleh dosen untuk audit log content_review_events
 */
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
