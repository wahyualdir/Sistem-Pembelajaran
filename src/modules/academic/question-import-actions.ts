'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  generateQuestionExcelTemplate,
  parseQuestionExcelBuffer,
  ParsedQuestionItem
} from '@/lib/akademik/excel-question-parser';
import { parseQuestionDocxBuffer } from '@/lib/akademik/word-question-parser';
import { exportToMoodleXml, parseMoodleXml } from '@/lib/akademik/moodle-xml-parser';
import { exportToQtiZip, parseQtiZipBuffer } from '@/lib/akademik/qti-parser';
import { revalidatePath } from 'next/cache';

/**
 * Menghasilkan template Excel untuk diunduh pengguna
 */
export async function getQuestionTemplateBase64Action() {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, pesan: 'Sesi masuk telah berakhir.' };
  }

  try {
    const buffer = await generateQuestionExcelTemplate();
    return {
      ok: true,
      data: {
        filename: 'Template_Bank_Soal_SIAJAR.xlsx',
        base64: buffer.toString('base64'),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    };
  } catch (err: any) {
    return { ok: false, pesan: `Gagal membuat template: ${err.message}` };
  }
}

/**
 * Mem-parse berkas yang diunggah (Excel, Word, Moodle XML, atau QTI zip)
 */
export async function parseUploadedQuestionFileAction(formData: FormData) {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, pesan: 'Sesi masuk telah berakhir.' };
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return { ok: false, pesan: 'Berkas tidak ditemukan pada permintaan.' };
  }

  // Batas 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, pesan: 'Ukuran berkas melebihi batas 10 MB.' };
  }

  const filename = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Ambil hash soal yang sudah ada di DB untuk deteksi duplikat
  const supabase = await createClient();
  const { data: existingQ } = await supabase
    .from('quiz_questions')
    .select('question_text')
    .limit(500);

  const existingHashes = new Set<string>();
  if (existingQ) {
    for (const q of existingQ) {
      if (q.question_text) {
        // Simple hash matching
        existingHashes.add(q.question_text.slice(0, 40).toLowerCase().trim());
      }
    }
  }

  try {
    let result: {
      total_rows?: number;
      total_questions?: number;
      valid_count: number;
      warning_count: number;
      error_count: number;
      items: ParsedQuestionItem[];
    };
    let formatType: 'excel' | 'word' | 'moodle_xml' | 'qti' = 'excel';

    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      formatType = 'excel';
      result = await parseQuestionExcelBuffer(buffer, existingHashes);
    } else if (filename.endsWith('.docx')) {
      formatType = 'word';
      result = await parseQuestionDocxBuffer(buffer, existingHashes);
    } else if (filename.endsWith('.xml')) {
      formatType = 'moodle_xml';
      const xmlString = buffer.toString('utf-8');
      result = parseMoodleXml(xmlString, existingHashes);
    } else if (filename.endsWith('.zip')) {
      formatType = 'qti';
      result = await parseQtiZipBuffer(buffer, existingHashes);
    } else {
      return {
        ok: false,
        pesan: 'Format berkas tidak didukung. Harap unggah berkas .xlsx, .docx, .xml (Moodle), atau .zip (QTI 2.1).'
      };
    }

    if (result.items.length > 500) {
      return {
        ok: false,
        pesan: `Jumlah soal (${result.items.length}) melebihi batas maksimal 500 soal dalam satu kali impor.`
      };
    }

    return {
      ok: true,
      data: {
        format: formatType,
        total: result.items.length,
        validCount: result.valid_count,
        warningCount: result.warning_count,
        errorCount: result.error_count,
        items: result.items
      }
    };
  } catch (err: any) {
    return { ok: false, pesan: `Gagal memproses berkas: ${err.message}` };
  }
}

/**
 * Konfirmasi dan simpan soal hasil impor ke database
 */
export async function confirmQuestionImportAction(input: {
  format: 'excel' | 'word' | 'moodle_xml' | 'qti';
  items: ParsedQuestionItem[];
  classId?: string;
  topic?: string;
  mode: 'skip_errors' | 'cancel_on_error';
}) {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, pesan: 'Sesi masuk telah berakhir.' };
  }

  const { format, items, classId, topic, mode } = input;

  const hasErrors = items.some(item => item.status === 'galat');
  if (mode === 'cancel_on_error' && hasErrors) {
    return {
      ok: false,
      pesan: 'Impor dibatalkan karena terdapat soal dengan status galat.'
    };
  }

  const validItems = items.filter(item => item.status !== 'galat');
  if (validItems.length === 0) {
    return { ok: false, pesan: 'Tidak ada soal valid untuk disimpan.' };
  }

  const supabase = await createClient();
  let importedCount = 0;

  // Batch insert per 100 soal
  const BATCH_SIZE = 100;
  for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
    const batch = validItems.slice(i, i + BATCH_SIZE);

    for (const q of batch) {
      // Map tipe soal ke VARCHAR(50) quiz_questions
      let dbType = 'MULTIPLE_CHOICE';
      if (q.tipe === 'benar_salah') dbType = 'TRUE_FALSE';
      else if (q.tipe === 'isian_singkat') dbType = 'SHORT_ANSWER';
      else if (q.tipe === 'esai') dbType = 'ESSAY';

      // 1. Insert ke quiz_questions
      const { data: newQ, error: qErr } = await supabase
        .from('quiz_questions')
        .insert({
          question_text: q.pertanyaan,
          question_type: dbType,
          points: q.bobot || 10,
          difficulty: (q.tingkat || 'sedang').toUpperCase(),
          topic_tag: q.topik || topic || 'Umum',
          cpl_tag: q.cpmk || null,
          explanation: q.pembahasan || null,
          metadata: { imported_format: format, row: q.row_number }
        })
        .select('id')
        .single();

      if (qErr || !newQ) continue;

      const questionId = newQ.id;

      // 2. Insert ke quiz_options jika pilihan ganda atau benar_salah
      if (q.tipe === 'pilihan_ganda') {
        const optionList: Array<{ text: string; letter: string }> = [];
        if (q.opsi_a) optionList.push({ text: q.opsi_a, letter: 'A' });
        if (q.opsi_b) optionList.push({ text: q.opsi_b, letter: 'B' });
        if (q.opsi_c) optionList.push({ text: q.opsi_c, letter: 'C' });
        if (q.opsi_d) optionList.push({ text: q.opsi_d, letter: 'D' });
        if (q.opsi_e) optionList.push({ text: q.opsi_e, letter: 'E' });

        let correctOptId: string | null = null;

        for (let oIdx = 0; oIdx < optionList.length; oIdx++) {
          const opt = optionList[oIdx];
          const { data: newOpt } = await supabase
            .from('quiz_options')
            .insert({
              question_id: questionId,
              option_text: opt.text,
              order_index: oIdx
            })
            .select('id')
            .single();

          if (newOpt && opt.letter === q.kunci?.toUpperCase()) {
            correctOptId = newOpt.id;
          }
        }

        // 3. Simpan Kunci Jawaban
        await supabase.from('quiz_question_keys').insert({
          question_id: questionId,
          correct_option_id: correctOptId,
          correct_data: { key: q.kunci },
          explanation: q.pembahasan || null
        });
      } else if (q.tipe === 'benar_salah') {
        const { data: optBenar } = await supabase
          .from('quiz_options')
          .insert({
            question_id: questionId,
            option_text: 'Benar',
            order_index: 0
          })
          .select('id')
          .single();

        const { data: optSalah } = await supabase
          .from('quiz_options')
          .insert({
            question_id: questionId,
            option_text: 'Salah',
            order_index: 1
          })
          .select('id')
          .single();

        const isBenar = ['benar', 'true', 'b'].includes(q.kunci?.toLowerCase() || '');
        const correctOptId = isBenar ? optBenar?.id : optSalah?.id;

        await supabase.from('quiz_question_keys').insert({
          question_id: questionId,
          correct_option_id: correctOptId || null,
          correct_data: { key: isBenar ? 'Benar' : 'Salah' },
          explanation: q.pembahasan || null
        });
      } else {
        // Isian singkat atau esai
        await supabase.from('quiz_question_keys').insert({
          question_id: questionId,
          correct_option_id: null,
          correct_data: { key: q.kunci },
          explanation: q.pembahasan || null
        });
      }

      importedCount++;
    }
  }

  // Catat ke question_import_jobs
  await supabase.from('question_import_jobs').insert({
    format,
    total_count: items.length,
    valid_count: importedCount,
    warning_count: items.filter(it => it.status === 'peringatan').length,
    error_count: items.filter(it => it.status === 'galat').length,
    status: 'selesai',
    summary: {
      imported_count: importedCount,
      skipped_count: items.length - importedCount
    },
    created_by: user.user.id
  });

  // Catat ke audit_logs
  await supabase.from('audit_logs').insert({
    actor_id: user.user.id,
    action: 'IMPOR_SOAL_MASSAL',
    entity: 'quiz_questions',
    meta: {
      format,
      total: items.length,
      imported: importedCount
    }
  });

  revalidatePath('/exams/question-bank');
  return {
    ok: true,
    pesan: `Berhasil mengimpor ${importedCount} butir soal ke Bank Soal.`,
    data: {
      importedCount,
      skippedCount: items.length - importedCount
    }
  };
}

/**
 * Ekspor butir soal ke Moodle XML atau QTI 2.1 zip
 */
export async function exportQuestionBankAction(input: {
  format: 'moodle_xml' | 'qti';
  topic?: string;
}) {
  const user = await getCurrentUserWithRoles();
  if (!user) {
    return { ok: false, pesan: 'Sesi masuk telah berakhir.' };
  }

  const supabase = await createClient();

  // Query soal
  let query = supabase.from('quiz_questions').select(`
    id,
    question_text,
    question_type,
    points,
    difficulty,
    topic_tag,
    explanation,
    quiz_options (
      id,
      option_text,
      order_index
    ),
    quiz_question_keys (
      correct_option_id,
      correct_data,
      explanation
    )
  `);

  if (input.topic) {
    query = query.eq('topic_tag', input.topic);
  }

  const { data: questions, error } = await query.limit(200);

  if (error || !questions || questions.length === 0) {
    return { ok: false, pesan: 'Tidak ada soal ditemukan untuk diekspor.' };
  }

  const exportItems = questions.map((q: any) => {
    const keyData = Array.isArray(q.quiz_question_keys)
      ? q.quiz_question_keys[0]
      : q.quiz_question_keys;
    const correctOptId = keyData?.correct_option_id;

    const options = (q.quiz_options || []).map((opt: any) => ({
      option_text: opt.option_text,
      is_correct: opt.id === correctOptId,
      order_index: opt.order_index
    }));

    return {
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: Number(q.points) || 10,
      options,
      correct_answer: keyData?.correct_data?.key || undefined,
      explanation: q.explanation || keyData?.explanation || undefined,
      topic: q.topic_tag || 'Umum',
      difficulty: q.difficulty || 'MEDIUM'
    };
  });

  try {
    if (input.format === 'moodle_xml') {
      const xml = exportToMoodleXml(exportItems);
      return {
        ok: true,
        data: {
          filename: `Bank_Soal_Moodle_${Date.now()}.xml`,
          content: xml,
          mimeType: 'application/xml',
          isBase64: false
        }
      };
    } else {
      const zipBuffer = await exportToQtiZip(exportItems);
      return {
        ok: true,
        data: {
          filename: `Bank_Soal_QTI21_${Date.now()}.zip`,
          base64: zipBuffer.toString('base64'),
          mimeType: 'application/zip',
          isBase64: true
        }
      };
    }
  } catch (err: any) {
    return { ok: false, pesan: `Gagal mengekspor soal: ${err.message}` };
  }
}
