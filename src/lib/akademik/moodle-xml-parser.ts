import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { sanitizeQuestionHtml, computeQuestionHash } from './question-sanitizer';
import { ParsedQuestionItem } from './excel-question-parser';

export interface QuestionExportItem {
  id?: string;
  question_text: string;
  question_type: string; // 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY'
  points: number;
  options?: Array<{
    option_text: string;
    is_correct?: boolean;
    order_index?: number;
  }>;
  correct_answer?: string;
  explanation?: string;
  topic?: string;
  difficulty?: string;
}

/**
 * Ekspor butir soal ke format Moodle XML baku
 */
export function exportToMoodleXml(questions: QuestionExportItem[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`;

  // Kelompokkan berdasarkan topik / kategori
  const groupedByTopic = new Map<string, QuestionExportItem[]>();
  for (const q of questions) {
    const topic = q.topic || 'Umum';
    if (!groupedByTopic.has(topic)) {
      groupedByTopic.set(topic, []);
    }
    groupedByTopic.get(topic)!.push(q);
  }

  for (const [topic, items] of groupedByTopic.entries()) {
    // Tag category Moodle
    xml += `  <question type="category">\n`;
    xml += `    <category>\n`;
    xml += `      <text>$course$/top/${escapeXml(topic)}</text>\n`;
    xml += `    </category>\n`;
    xml += `  </question>\n\n`;

    for (const q of items) {
      const typeLower = q.question_type.toLowerCase();

      if (typeLower.includes('multiple') || typeLower.includes('choice') || typeLower === 'pilihan_ganda') {
        xml += `  <question type="multichoice">\n`;
        xml += `    <name><text>${escapeXml(q.question_text.slice(0, 50))}</text></name>\n`;
        xml += `    <questiontext format="html"><text><![CDATA[${q.question_text}]]></text></questiontext>\n`;
        xml += `    <defaultgrade>${q.points || 10}</defaultgrade>\n`;
        xml += `    <single>true</single>\n`;
        xml += `    <shuffleanswers>true</shuffleanswers>\n`;
        xml += `    <answernumbering>abc</answernumbering>\n`;

        if (q.explanation) {
          xml += `    <generalfeedback format="html"><text><![CDATA[${q.explanation}]]></text></generalfeedback>\n`;
        }

        if (q.options && q.options.length > 0) {
          for (const opt of q.options) {
            const fraction = opt.is_correct ? '100' : '0';
            xml += `    <answer fraction="${fraction}" format="html">\n`;
            xml += `      <text><![CDATA[${opt.option_text}]]></text>\n`;
            xml += `    </answer>\n`;
          }
        }
        xml += `  </question>\n\n`;
      } else if (typeLower.includes('true') || typeLower.includes('benar') || typeLower === 'benar_salah') {
        const isTrueCorrect =
          q.correct_answer?.toLowerCase() === 'benar' ||
          q.correct_answer?.toLowerCase() === 'true' ||
          q.options?.find(o => o.is_correct)?.option_text?.toLowerCase() === 'benar';

        xml += `  <question type="truefalse">\n`;
        xml += `    <name><text>${escapeXml(q.question_text.slice(0, 50))}</text></name>\n`;
        xml += `    <questiontext format="html"><text><![CDATA[${q.question_text}]]></text></questiontext>\n`;
        xml += `    <defaultgrade>${q.points || 10}</defaultgrade>\n`;
        xml += `    <answer fraction="${isTrueCorrect ? '100' : '0'}" format="moodle_auto_format">\n`;
        xml += `      <text>true</text>\n`;
        xml += `    </answer>\n`;
        xml += `    <answer fraction="${!isTrueCorrect ? '100' : '0'}" format="moodle_auto_format">\n`;
        xml += `      <text>false</text>\n`;
        xml += `    </answer>\n`;
        xml += `  </question>\n\n`;
      } else if (typeLower.includes('short') || typeLower.includes('isian') || typeLower === 'isian_singkat') {
        xml += `  <question type="shortanswer">\n`;
        xml += `    <name><text>${escapeXml(q.question_text.slice(0, 50))}</text></name>\n`;
        xml += `    <questiontext format="html"><text><![CDATA[${q.question_text}]]></text></questiontext>\n`;
        xml += `    <defaultgrade>${q.points || 10}</defaultgrade>\n`;
        xml += `    <usecase>0</usecase>\n`;
        xml += `    <answer fraction="100" format="moodle_auto_format">\n`;
        xml += `      <text>${escapeXml(q.correct_answer || '')}</text>\n`;
        xml += `    </answer>\n`;
        xml += `  </question>\n\n`;
      } else {
        // Essay / Uraian
        xml += `  <question type="essay">\n`;
        xml += `    <name><text>${escapeXml(q.question_text.slice(0, 50))}</text></name>\n`;
        xml += `    <questiontext format="html"><text><![CDATA[${q.question_text}]]></text></questiontext>\n`;
        xml += `    <defaultgrade>${q.points || 10}</defaultgrade>\n`;
        xml += `    <responseformat>editor</responseformat>\n`;
        if (q.explanation) {
          xml += `    <generalfeedback format="html"><text><![CDATA[${q.explanation}]]></text></generalfeedback>\n`;
        }
        xml += `  </question>\n\n`;
      }
    }
  }

  xml += `</quiz>\n`;
  return xml;
}

/**
 * Mengimpor dan mem-parse berkas Moodle XML
 */
export function parseMoodleXml(
  xmlContent: string,
  existingHashes: Set<string> = new Set()
): {
  total_questions: number;
  valid_count: number;
  warning_count: number;
  error_count: number;
  items: ParsedQuestionItem[];
} {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
    trimValues: true,
    isArray: (name) => ['question', 'answer'].includes(name)
  });

  const parsed = parser.parse(xmlContent);
  if (!parsed || !parsed.quiz || !parsed.quiz.question) {
    throw new Error('Format berkas bukan Moodle XML yang valid atau elemen <quiz> tidak ditemukan.');
  }

  const rawQuestions = Array.isArray(parsed.quiz.question)
    ? parsed.quiz.question
    : [parsed.quiz.question];

  let currentCategory = 'Umum';
  const items: ParsedQuestionItem[] = [];
  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  let rowCounter = 0;

  for (const q of rawQuestions) {
    const qType = (q['@_type'] || '').toLowerCase();

function extractXmlText(node: any): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (node.__cdata !== undefined) return String(node.__cdata);
  if (node.text !== undefined) return extractXmlText(node.text);
  if (node['#text'] !== undefined) return String(node['#text']);
  return '';
}

    // 1. Tangani Kategori
    if (qType === 'category') {
      const catText = extractXmlText(q.category);
      if (catText) {
        currentCategory = catText.replace('$course$/top/', '').replace('$course$/', '').trim();
      }
      continue;
    }

    rowCounter++;
    const issues: string[] = [];
    let status: 'valid' | 'peringatan' | 'galat' = 'valid';

    // 2. Ekstrak teks soal
    const questionText = extractXmlText(q.questiontext) || extractXmlText(q.name);

    if (!questionText) {
      issues.push(`Soal ${rowCounter}: teks pertanyaan tidak ditemukan.`);
      status = 'galat';
    }

    // 3. Ekstrak bobot
    let bobot = 10;
    if (q.defaultgrade) {
      const g = parseFloat(String(q.defaultgrade));
      if (!isNaN(g) && g > 0) bobot = g;
    }

    // 4. Ekstrak pembahasan
    const explanation = extractXmlText(q.generalfeedback);

    let tipe: 'pilihan_ganda' | 'benar_salah' | 'isian_singkat' | 'esai' = 'pilihan_ganda';
    const options: Record<string, string> = {};
    let keyAnswer = '';

    // Tangani tipe soal
    if (qType === 'multichoice') {
      tipe = 'pilihan_ganda';
      const answers = Array.isArray(q.answer) ? q.answer : q.answer ? [q.answer] : [];
      const letters = ['A', 'B', 'C', 'D', 'E'];

      answers.forEach((ans: any, idx: number) => {
        if (idx < letters.length) {
          const letter = letters[idx];
          const text = extractXmlText(ans);
          options[letter] = text;

          const fraction = parseFloat(ans['@_fraction'] || '0');
          if (fraction >= 100) {
            keyAnswer = letter;
          }
        }
      });

      if (Object.keys(options).length < 2) {
        issues.push(`Soal ${rowCounter}: pilihan ganda Moodle memiliki kurang dari 2 pilihan jawaban.`);
        status = 'galat';
      }
      if (!keyAnswer) {
        issues.push(`Soal ${rowCounter}: tidak ada pilihan dengan nilai 100% (jawaban benar).`);
        status = 'galat';
      }
    } else if (qType === 'truefalse') {
      tipe = 'benar_salah';
      const answers = Array.isArray(q.answer) ? q.answer : q.answer ? [q.answer] : [];
      for (const ans of answers) {
        const text = extractXmlText(ans).toLowerCase();
        const fraction = parseFloat(ans['@_fraction'] || '0');
        if (fraction >= 100) {
          keyAnswer = text === 'true' ? 'Benar' : 'Salah';
        }
      }
      if (!keyAnswer) keyAnswer = 'Benar';
    } else if (qType === 'shortanswer') {
      tipe = 'isian_singkat';
      const answers = Array.isArray(q.answer) ? q.answer : q.answer ? [q.answer] : [];
      if (answers.length > 0) {
        keyAnswer = extractXmlText(answers[0]);
      }
    } else if (qType === 'essay') {
      tipe = 'esai';
      keyAnswer = 'Penilaian manual oleh dosen.';
    } else {
      // Tipe yang tidak didukung: lewati dengan peringatan
      issues.push(`Soal ${rowCounter}: tipe '${qType}' dari Moodle tidak didukung SIAJAR dan dilewati.`);
      status = 'peringatan';
      warningCount++;
      items.push({
        row_number: rowCounter,
        tipe: 'esai',
        pertanyaan: `[Tidak didukung: ${qType}] ` + sanitizeQuestionHtml(questionText),
        kunci: '',
        bobot,
        tingkat: 'sedang',
        topik: currentCategory,
        status: 'peringatan',
        issues,
        hash: computeQuestionHash(questionText)
      });
      continue;
    }

    const hash = computeQuestionHash(questionText);
    if (existingHashes.has(hash)) {
      issues.push(`Soal ${rowCounter}: terdeteksi kemiripan dengan soal yang sudah ada di Bank Soal.`);
      if (status !== 'galat') status = 'peringatan';
    }

    if (status === 'valid') validCount++;
    else if (status === 'peringatan') warningCount++;
    else errorCount++;

    items.push({
      row_number: rowCounter,
      tipe,
      pertanyaan: sanitizeQuestionHtml(questionText),
      opsi_a: options['A'] ? sanitizeQuestionHtml(options['A']) : undefined,
      opsi_b: options['B'] ? sanitizeQuestionHtml(options['B']) : undefined,
      opsi_c: options['C'] ? sanitizeQuestionHtml(options['C']) : undefined,
      opsi_d: options['D'] ? sanitizeQuestionHtml(options['D']) : undefined,
      opsi_e: options['E'] ? sanitizeQuestionHtml(options['E']) : undefined,
      kunci: keyAnswer,
      bobot,
      tingkat: 'sedang',
      topik: currentCategory,
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

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
