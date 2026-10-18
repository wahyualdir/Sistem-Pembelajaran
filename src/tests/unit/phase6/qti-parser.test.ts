import { describe, it, expect } from 'vitest';
import { exportToQtiZip, parseQtiZipBuffer } from '@/lib/akademik/qti-parser';
import { QuestionExportItem } from '@/lib/akademik/moodle-xml-parser';

describe('QTI 2.1 Bidirectional Zip Roundtrip (13.3)', () => {
  it('melakukan ekspor paket QTI 2.1 zip dan impor kembali secara konsisten', async () => {
    const originalQuestions: QuestionExportItem[] = [
      {
        question_text: 'Komponen arsitektur CPU yang bertugas melakukan operasi aritmatika dan logika adalah:',
        question_type: 'MULTIPLE_CHOICE',
        points: 10,
        options: [
          { option_text: 'Control Unit (CU)', is_correct: false },
          { option_text: 'Arithmetic Logic Unit (ALU)', is_correct: true },
          { option_text: 'Registers', is_correct: false },
          { option_text: 'Cache Memory', is_correct: false }
        ],
        explanation: 'ALU memproses seluruh perhitungan matematika dan operasi logika bitwise.'
      },
      {
        question_text: 'Uraikan perbedaan antara symmetric dan asymmetric encryption dalam keamanan data.',
        question_type: 'ESSAY',
        points: 20,
        explanation: 'Symmetric menggunakan satu kunci rahasia sedangkan asymmetric menggunakan pasangan public-private key.'
      }
    ];

    // 1. Ekspor ke ZIP QTI 2.1
    const zipBuffer = await exportToQtiZip(originalQuestions);
    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(500);

    // 2. Impor kembali dari ZIP QTI 2.1
    const parsed = await parseQtiZipBuffer(zipBuffer);
    expect(parsed.total_questions).toBe(2);
    expect(parsed.valid_count).toBe(2);
    expect(parsed.error_count).toBe(0);

    // Verifikasi Pilihan Ganda
    const q1 = parsed.items[0];
    expect(q1.tipe).toBe('pilihan_ganda');
    expect(q1.pertanyaan).toContain('operasi aritmatika dan logika');
    expect(q1.opsi_b).toBe('Arithmetic Logic Unit (ALU)');
    expect(q1.kunci).toBe('B');

    // Verifikasi Esai
    const q2 = parsed.items[1];
    expect(q2.tipe).toBe('esai');
    expect(q2.pertanyaan).toContain('symmetric dan asymmetric encryption');
  });
});
