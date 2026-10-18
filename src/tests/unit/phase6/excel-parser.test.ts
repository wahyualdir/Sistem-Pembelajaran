import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import {
  generateQuestionExcelTemplate,
  parseQuestionExcelBuffer
} from '@/lib/akademik/excel-question-parser';

describe('Excel Question Template & Parser (13.2)', () => {
  it('berhasil membuat template Excel resmi dengan kolom dan baris contoh yang valid', async () => {
    const templateBuffer = await generateQuestionExcelTemplate();
    expect(templateBuffer).toBeInstanceOf(Buffer);
    expect(templateBuffer.length).toBeGreaterThan(1000);

    // Muat dan validasi dengan parser
    const result = await parseQuestionExcelBuffer(templateBuffer);
    expect(result.total_rows).toBe(3); // 3 baris contoh
    expect(result.valid_count).toBe(3);
    expect(result.error_count).toBe(0);
    expect(result.items[0].tipe).toBe('pilihan_ganda');
    expect(result.items[0].kunci).toBe('B');
    expect(result.items[1].tipe).toBe('benar_salah');
    expect(result.items[2].tipe).toBe('esai');
  });

  it('mendeteksi galat kunci yang tidak ada di opsi (misal kunci F pada opsi A-D)', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Soal');

    // Header
    worksheet.addRow([
      'tipe', 'pertanyaan', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'opsi_e',
      'kunci', 'bobot', 'tingkat', 'topik', 'cpmk', 'pembahasan'
    ]);

    // Baris dengan kunci F
    worksheet.addRow([
      'pilihan_ganda',
      'Manakah bahasa pemrograman yang diketik secara statis?',
      'Python', 'Ruby', 'PHP', 'JavaScript', '',
      'F', // Kunci F tidak ada di A-D!
      10, 'sedang', 'Pemrograman', 'CPMK-01', 'Penjelasan'
    ]);

    const buf = Buffer.from(await workbook.xlsx.writeBuffer());
    const res = await parseQuestionExcelBuffer(buf);

    expect(res.total_rows).toBe(1);
    expect(res.error_count).toBe(1);
    expect(res.items[0].status).toBe('galat');
    expect(res.items[0].issues[0]).toContain("kunci 'F' tidak ada di pilihan");
  });

  it('mendeteksi peringatan bobot kosong dan menetapkan bobot bawaan 10', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Soal');

    worksheet.addRow([
      'tipe', 'pertanyaan', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'opsi_e',
      'kunci', 'bobot', 'tingkat', 'topik', 'cpmk', 'pembahasan'
    ]);

    worksheet.addRow([
      'pilihan_ganda',
      'Apakah kepanjangan dari SQL?',
      'Structured Query Language', 'Simple Query Logic', '', '', '',
      'A',
      '', // Bobot kosong
      'mudah', 'Database', '', ''
    ]);

    const buf = Buffer.from(await workbook.xlsx.writeBuffer());
    const res = await parseQuestionExcelBuffer(buf);

    expect(res.total_rows).toBe(1);
    expect(res.warning_count).toBe(1);
    expect(res.items[0].bobot).toBe(10);
    expect(res.items[0].status).toBe('peringatan');
  });
});
