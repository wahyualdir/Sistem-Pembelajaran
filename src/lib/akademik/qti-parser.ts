import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { QuestionExportItem } from './moodle-xml-parser';
import { ParsedQuestionItem } from './excel-question-parser';
import { sanitizeQuestionHtml, computeQuestionHash } from './question-sanitizer';

/**
 * Ekspor butir soal ke format QTI 2.1 (.zip paket IMS)
 */
export async function exportToQtiZip(questions: QuestionExportItem[]): Promise<Buffer> {
  const zip = new JSZip();

  let manifestResources = '';

  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    const itemId = `item_${idx + 1}`;
    const filename = `${itemId}.xml`;

    manifestResources += `    <resource identifier="${itemId}" type="imsqti_item_xmlv2p1" href="${filename}"/>\n`;

    const typeLower = q.question_type.toLowerCase();
    const isChoice = typeLower.includes('multiple') || typeLower.includes('choice') || typeLower.includes('pilihan');

    let itemXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    itemXml += `<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1" \n`;
    itemXml += `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \n`;
    itemXml += `  identifier="${itemId}" title="${escapeXml(q.question_text.slice(0, 40))}" adaptive="false" timeDependent="false">\n`;

    if (isChoice) {
      // Deklarasi respons
      itemXml += `  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">\n`;
      const correctOptIndex = q.options?.findIndex(o => o.is_correct);
      const correctId = correctOptIndex !== undefined && correctOptIndex >= 0
        ? `Choice_${String.fromCharCode(65 + correctOptIndex)}`
        : 'Choice_A';

      itemXml += `    <correctResponse>\n`;
      itemXml += `      <value>${correctId}</value>\n`;
      itemXml += `    </correctResponse>\n`;
      itemXml += `  </responseDeclaration>\n`;

      itemXml += `  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">\n`;
      itemXml += `    <defaultValue><value>0</value></defaultValue>\n`;
      itemXml += `  </outcomeDeclaration>\n`;

      itemXml += `  <itemBody>\n`;
      itemXml += `    <p>${escapeXml(q.question_text)}</p>\n`;
      itemXml += `    <choiceInteraction responseIdentifier="RESPONSE" shuffle="true" maxChoices="1">\n`;

      const options = q.options && q.options.length > 0
        ? q.options
        : [{ option_text: 'Opsi A', is_correct: true }, { option_text: 'Opsi B', is_correct: false }];

      options.forEach((opt, optIdx) => {
        const letter = String.fromCharCode(65 + optIdx);
        itemXml += `      <simpleChoice identifier="Choice_${letter}">${escapeXml(opt.option_text)}</simpleChoice>\n`;
      });

      itemXml += `    </choiceInteraction>\n`;
      itemXml += `  </itemBody>\n`;
    } else {
      // Essay / Extended Text
      itemXml += `  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"/>\n`;
      itemXml += `  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>\n`;
      itemXml += `  <itemBody>\n`;
      itemXml += `    <p>${escapeXml(q.question_text)}</p>\n`;
      itemXml += `    <extendedTextInteraction responseIdentifier="RESPONSE" expectedLines="5"/>\n`;
      itemXml += `  </itemBody>\n`;
    }

    if (q.explanation) {
      itemXml += `  <modalFeedback outcomeIdentifier="FEEDBACK" identifier="FEEDBACK_GENERAL" showHide="show">\n`;
      itemXml += `    <p>${escapeXml(q.explanation)}</p>\n`;
      itemXml += `  </modalFeedback>\n`;
    }

    itemXml += `</assessmentItem>\n`;
    zip.file(filename, itemXml);
  }

  // imsmanifest.xml
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" 
  xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_v1p2" 
  xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_v2p1" 
  identifier="MANIFEST_SIAJAR_QTI21">
  <metadata>
    <schema>IMS Content</schema>
    <schemaversion>2.1</schemaversion>
  </metadata>
  <organizations/>
  <resources>
${manifestResources}  </resources>
</manifest>`;

  zip.file('imsmanifest.xml', manifest);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  return buffer;
}

/**
 * Mengimpor dan mem-parse paket QTI 2.1 (.zip)
 */
export async function parseQtiZipBuffer(
  buffer: Buffer,
  existingHashes: Set<string> = new Set()
): Promise<{
  total_questions: number;
  valid_count: number;
  warning_count: number;
  error_count: number;
  items: ParsedQuestionItem[];
}> {
  const zip = await JSZip.loadAsync(buffer);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    isArray: (name) => ['simpleChoice', 'value', 'resource'].includes(name)
  });

  const manifestFile = zip.file('imsmanifest.xml');
  const items: ParsedQuestionItem[] = [];
  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  // Temukan semua berkas XML soal
  const xmlFiles: string[] = [];
  if (manifestFile) {
    const manifestXml = await manifestFile.async('string');
    const parsedManifest = parser.parse(manifestXml);
    const resources = parsedManifest?.manifest?.resources?.resource;
    if (Array.isArray(resources)) {
      for (const res of resources) {
        if (res['@_href'] && zip.file(res['@_href'])) {
          xmlFiles.push(res['@_href']);
        }
      }
    }
  }

  // Fallback: baca semua berkas .xml jika manifest tidak terdaftar
  if (xmlFiles.length === 0) {
    zip.forEach((relativePath) => {
      if (relativePath.endsWith('.xml') && relativePath !== 'imsmanifest.xml') {
        xmlFiles.push(relativePath);
      }
    });
  }

  if (xmlFiles.length === 0) {
    throw new Error('Paket QTI tidak memuat berkas soal XML yang valid.');
  }

  let rowCounter = 0;

  for (const filename of xmlFiles) {
    const file = zip.file(filename);
    if (!file) continue;

    rowCounter++;
    const issues: string[] = [];
    let status: 'valid' | 'peringatan' | 'galat' = 'valid';

    const xmlContent = await file.async('string');
    const parsed = parser.parse(xmlContent);
    const item = parsed.assessmentItem;

    if (!item) {
      issues.push(`Berkas ${filename}: elemen <assessmentItem> tidak ditemukan.`);
      errorCount++;
      continue;
    }

    // Ambil pertanyaan dari <itemBody>
    let questionText = '';
    if (item.itemBody) {
      if (typeof item.itemBody.p === 'string') {
        questionText = item.itemBody.p;
      } else if (item.itemBody.p && item.itemBody.p['#text']) {
        questionText = item.itemBody.p['#text'];
      } else if (item['@_title']) {
        questionText = item['@_title'];
      }
    }

    if (!questionText && item['@_title']) {
      questionText = item['@_title'];
    }

    if (!questionText) {
      issues.push(`Soal ${rowCounter}: teks pertanyaan tidak ditemukan.`);
      status = 'galat';
    }

    let tipe: 'pilihan_ganda' | 'benar_salah' | 'isian_singkat' | 'esai' = 'pilihan_ganda';
    const options: Record<string, string> = {};
    let keyAnswer = '';

    // Ambil kunci dari responseDeclaration
    let correctId = '';
    if (item.responseDeclaration?.correctResponse?.value) {
      const vals = item.responseDeclaration.correctResponse.value;
      correctId = Array.isArray(vals) ? vals[0] : vals;
    }

    if (item.itemBody?.choiceInteraction) {
      tipe = 'pilihan_ganda';
      const choices = item.itemBody.choiceInteraction.simpleChoice;
      const choiceArr = Array.isArray(choices) ? choices : choices ? [choices] : [];
      const letters = ['A', 'B', 'C', 'D', 'E'];

      choiceArr.forEach((ch: any, idx: number) => {
        if (idx < letters.length) {
          const letter = letters[idx];
          const text = typeof ch === 'string' ? ch : ch['#text'] || ch['@_identifier'] || '';
          options[letter] = text;

          const chId = ch['@_identifier'];
          if (chId && chId === correctId) {
            keyAnswer = letter;
          }
        }
      });

      if (!keyAnswer && choiceArr.length > 0) {
        keyAnswer = 'A';
      }
    } else {
      tipe = 'esai';
      keyAnswer = 'Penilaian esai';
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
      bobot: 10,
      tingkat: 'sedang',
      topik: 'Umum',
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
