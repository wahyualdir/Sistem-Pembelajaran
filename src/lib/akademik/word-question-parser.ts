import mammoth from 'mammoth';
import { sanitizeQuestionHtml, computeQuestionHash } from './question-sanitizer';
import { ParsedQuestionItem } from './excel-question-parser';

export interface ParseWordResult {
  total_questions: number;
  valid_count: number;
  warning_count: number;
  error_count: number;
  items: ParsedQuestionItem[];
}

/**
 * Membaca dan mem-parse dokumen Word (.docx) butir soal
 */
export async function parseQuestionDocxBuffer(
  buffer: Buffer,
  existingHashes: Set<string> = new Set()
): Promise<ParseWordResult> {
  // Ekstrak teks mentah dan HTML dari docx menggunakan mammoth
  const rawTextResult = await mammoth.extractRawText({ buffer });
  const text = rawTextResult.value;

  if (!text || !text.trim()) {
    throw new Error('Dokumen Word kosong atau tidak dapat diekstraksi.');
  }

  // Pecah dokumen berdasarkan pola nomor soal: \n1. atau \n1) di awal baris
  // Normalisasi line endings
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  interface RawQuestionBlock {
    questionNumber: number;
    textLines: string[];
  }

  const blocks: RawQuestionBlock[] = [];
  let currentBlock: RawQuestionBlock | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Deteksi awal soal baru: "1.", "1)", "1 .", "Soal 1:"
    const questionStartMatch = line.match(/^(?:Soal\s*)?(\d+)[\.\)]\s*(.*)/i);
    if (questionStartMatch) {
      if (currentBlock && currentBlock.textLines.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        questionNumber: parseInt(questionStartMatch[1], 10),
        textLines: [questionStartMatch[2].trim()]
      };
    } else {
      if (currentBlock) {
        currentBlock.textLines.push(line);
      }
    }
  }

  if (currentBlock && currentBlock.textLines.length > 0) {
    blocks.push(currentBlock);
  }

  if (blocks.length === 0) {
    throw new Error(
      'Format dokumen Word tidak sesuai pola SIAJAR. Setiap soal harus diawali nomor soal (contoh: "1. Apa itu...") diikuti pilihan "a.", "b.", dan "Jawaban: B".'
    );
  }

  const items: ParsedQuestionItem[] = [];
  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];
    const rowNum = block.questionNumber || (idx + 1);
    const issues: string[] = [];
    let status: 'valid' | 'peringatan' | 'galat' = 'valid';

    let questionText = '';
    const options: Record<string, string> = {};
    let keyAnswer = '';
    let explanation = '';
    let readingExplanation = false;

    for (const line of block.textLines) {
      // Cek apakah ini baris Pembahasan
      const explMatch = line.match(/^(?:Pembahasan|Penjelasan)\s*:\s*(.*)/i);
      if (explMatch) {
        explanation = explMatch[1].trim();
        readingExplanation = true;
        continue;
      }

      if (readingExplanation) {
        explanation += ' ' + line;
        continue;
      }

      // Cek apakah ini baris Jawaban / Kunci
      const keyMatch = line.match(/^(?:Jawaban|Kunci|Kunci Jawaban|Ans)\s*:\s*(.*)/i);
      if (keyMatch) {
        keyAnswer = keyMatch[1].trim();
        continue;
      }

      // Cek apakah ini pilihan a. sampai e.
      const optMatch = line.match(/^([a-eA-E])[\.\)]\s*(.*)/);
      if (optMatch) {
        const letter = optMatch[1].toUpperCase();
        options[letter] = optMatch[2].trim();
        continue;
      }

      // Jika belum masuk pilihan/jawaban, ini kelanjutan pertanyaan
      if (Object.keys(options).length === 0 && !keyAnswer) {
        questionText = questionText ? questionText + ' ' + line : line;
      }
    }

    // Tentukan tipe
    const optionKeys = Object.keys(options).sort();
    let tipe: 'pilihan_ganda' | 'benar_salah' | 'isian_singkat' | 'esai' = 'pilihan_ganda';

    const isTrueFalseOptions =
      optionKeys.length === 2 &&
      ((options['A']?.toLowerCase() === 'benar' && options['B']?.toLowerCase() === 'salah') ||
       (options['A']?.toLowerCase() === 'true' && options['B']?.toLowerCase() === 'false'));

    const isTrueFalseKey = ['benar', 'salah', 'true', 'false'].includes(keyAnswer.toLowerCase());

    if (isTrueFalseOptions || (optionKeys.length === 0 && isTrueFalseKey)) {
      tipe = 'benar_salah';
      if (keyAnswer.toUpperCase() === 'A' && options['A']?.toLowerCase() === 'benar') {
        keyAnswer = 'Benar';
      } else if (keyAnswer.toUpperCase() === 'B' && options['B']?.toLowerCase() === 'salah') {
        keyAnswer = 'Salah';
      } else if (isTrueFalseKey) {
        keyAnswer = ['benar', 'true'].includes(keyAnswer.toLowerCase()) ? 'Benar' : 'Salah';
      }
    } else if (optionKeys.length >= 2) {
      tipe = 'pilihan_ganda';
    } else if (keyAnswer && keyAnswer.length < 50) {
      tipe = 'isian_singkat';
    } else {
      tipe = 'esai';
    }

    if (!questionText) {
      issues.push(`Soal ${rowNum}: teks pertanyaan tidak ditemukan.`);
      status = 'galat';
    }

    if (tipe === 'pilihan_ganda') {
      if (optionKeys.length < 2) {
        issues.push(`Soal ${rowNum}: pilihan ganda minimal memiliki 2 opsi (A dan B).`);
        status = 'galat';
      }
      const cleanKey = keyAnswer.toUpperCase().trim();
      if (!cleanKey) {
        issues.push(`Soal ${rowNum}: baris 'Jawaban: ' belum diisi.`);
        status = 'galat';
      } else if (!optionKeys.includes(cleanKey)) {
        issues.push(`Soal ${rowNum}: kunci '${cleanKey}' tidak ada di pilihan. Pilihan yang tersedia: ${optionKeys.join(', ')}.`);
        status = 'galat';
      }
    } else if (!keyAnswer && status !== 'galat') {
      issues.push(`Soal ${rowNum}: kunci jawaban kosong.`);
      status = 'peringatan';
    }

    const hash = computeQuestionHash(questionText);
    if (existingHashes.has(hash)) {
      issues.push(`Soal ${rowNum}: terdeteksi kemiripan dengan soal yang sudah ada di Bank Soal.`);
      if (status !== 'galat') status = 'peringatan';
    }

    if (status === 'valid') validCount++;
    else if (status === 'peringatan') warningCount++;
    else errorCount++;

    items.push({
      row_number: rowNum,
      tipe,
      pertanyaan: sanitizeQuestionHtml(questionText),
      opsi_a: options['A'] ? sanitizeQuestionHtml(options['A']) : undefined,
      opsi_b: options['B'] ? sanitizeQuestionHtml(options['B']) : undefined,
      opsi_c: options['C'] ? sanitizeQuestionHtml(options['C']) : undefined,
      opsi_d: options['D'] ? sanitizeQuestionHtml(options['D']) : undefined,
      opsi_e: options['E'] ? sanitizeQuestionHtml(options['E']) : undefined,
      kunci: keyAnswer,
      bobot: 10,
      tingkat: 'sedang',
      topik: 'Umum',
      pembahasan: explanation ? sanitizeQuestionHtml(explanation) : undefined,
      status,
      issues,
      hash
    });
  }

  return {
    total_questions: items.length,
    valid_count: validCount,
    warning_count: warningCount,
    error_count: errorCount,
    items
  };
}
