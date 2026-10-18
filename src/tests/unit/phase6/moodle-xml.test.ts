import { describe, it, expect } from 'vitest';
import {
  exportToMoodleXml,
  parseMoodleXml,
  QuestionExportItem
} from '@/lib/akademik/moodle-xml-parser';

describe('Moodle XML Bidirectional Roundtrip (13.3)', () => {
  it('melakukan ekspor ke Moodle XML dan impor kembali secara identik (roundtrip)', () => {
    const originalQuestions: QuestionExportItem[] = [
      {
        question_text: 'Manakah kompleksitas terbaik untuk pencarian pada Balanced Binary Search Tree?',
        question_type: 'MULTIPLE_CHOICE',
        points: 15,
        topic: 'Algoritma & Struktur Data',
        options: [
          { option_text: 'O(1)', is_correct: false },
          { option_text: 'O(log n)', is_correct: true },
          { option_text: 'O(n)', is_correct: false },
          { option_text: 'O(n log n)', is_correct: false }
        ],
        explanation: 'Pohon seimbang seperti AVL atau Red-Black menjamin tinggi O(log n).'
      },
      {
        question_text: 'Apakah protokol UDP bersifat connectionless dan tidak menjamin urutan paket?',
        question_type: 'TRUE_FALSE',
        points: 10,
        topic: 'Jaringan Komputer',
        correct_answer: 'Benar',
        options: [
          { option_text: 'Benar', is_correct: true },
          { option_text: 'Salah', is_correct: false }
        ]
      },
      {
        question_text: 'Jelaskan konsep Polymorphism dalam Pemrograman Berorientasi Objek beserta contoh kodenya.',
        question_type: 'ESSAY',
        points: 25,
        topic: 'Pemrograman Berorientasi Objek',
        explanation: 'Harus menjelaskan method overriding dan dynamic dispatch.'
      }
    ];

    // 1. Ekspor ke XML
    const xml = exportToMoodleXml(originalQuestions);
    expect(xml).toContain('<quiz>');
    expect(xml).toContain('<question type="multichoice">');
    expect(xml).toContain('<question type="truefalse">');
    expect(xml).toContain('<question type="essay">');
    expect(xml).toContain('<question type="category">');

    // 2. Impor kembali dari XML
    const parsed = parseMoodleXml(xml);
    expect(parsed.total_questions).toBe(3);
    expect(parsed.valid_count).toBe(3);
    expect(parsed.error_count).toBe(0);

    // Verifikasi Soal 1: Pilihan Ganda
    const q1 = parsed.items[0];
    expect(q1.tipe).toBe('pilihan_ganda');
    expect(q1.pertanyaan).toContain('Balanced Binary Search Tree');
    expect(q1.kunci).toBe('B');
    expect(q1.bobot).toBe(15);
    expect(q1.topik).toBe('Algoritma & Struktur Data');
    expect(q1.opsi_b).toBe('O(log n)');

    // Verifikasi Soal 2: Benar/Salah
    const q2 = parsed.items[1];
    expect(q2.tipe).toBe('benar_salah');
    expect(q2.kunci).toBe('Benar');
    expect(q2.topik).toBe('Jaringan Komputer');

    // Verifikasi Soal 3: Esai
    const q3 = parsed.items[2];
    expect(q3.tipe).toBe('esai');
    expect(q3.pertanyaan).toContain('Polymorphism');
    expect(q3.bobot).toBe(25);
  });

  it('menangani tipe soal Moodle yang tidak didukung dengan pesan peringatan yang jelas tanpa merusak impor', () => {
    const rawXmlWithUnsupported = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="cloze">
    <name><text>Soal Cloze Test</text></name>
    <questiontext><text>Teks dengan isian rumpang {1:SHORTANSWER:=benar}</text></questiontext>
    <defaultgrade>10</defaultgrade>
  </question>
  <question type="essay">
    <name><text>Soal Uraian Valid</text></name>
    <questiontext><text>Jelaskan apa itu normalisasi database.</text></questiontext>
    <defaultgrade>20</defaultgrade>
  </question>
</quiz>`;

    const parsed = parseMoodleXml(rawXmlWithUnsupported);
    expect(parsed.total_questions).toBe(2);
    expect(parsed.warning_count).toBe(1);
    expect(parsed.valid_count).toBe(1);

    expect(parsed.items[0].status).toBe('peringatan');
    expect(parsed.items[0].issues[0]).toContain("tipe 'cloze' dari Moodle tidak didukung");
    expect(parsed.items[1].status).toBe('valid');
  });
});
