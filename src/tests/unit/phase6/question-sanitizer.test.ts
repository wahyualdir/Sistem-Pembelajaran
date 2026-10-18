import { describe, it, expect } from 'vitest';
import {
  sanitizeQuestionHtml,
  normalizeQuestionText,
  computeQuestionHash
} from '@/lib/akademik/question-sanitizer';

describe('Question HTML Sanitizer & Duplicate Detection (13.2)', () => {
  it('membersihkan tag script berbahaya dan atribut event XSS', () => {
    const maliciousHtml = `
      <p>Apa fungsi dari CPU? <script>alert("XSS")</script></p>
      <img src="valid.png" onerror="alert(document.cookie)" />
      <a href="javascript:void(0)" onclick="fetch('https://evil.com')">Klik</a>
    `;

    const cleaned = sanitizeQuestionHtml(maliciousHtml);
    expect(cleaned).not.toContain('<script');
    expect(cleaned).not.toContain('alert');
    expect(cleaned).not.toContain('onerror');
    expect(cleaned).not.toContain('onclick');
    expect(cleaned).not.toContain('javascript:');
    expect(cleaned).toContain('<p>Apa fungsi dari CPU? </p>');
    expect(cleaned).toContain('<img src="valid.png">');
  });

  it('mempertahankan tag HTML aman seperti tabel, tebal, miring, dan kode', () => {
    const safeHtml = `
      <p>Perhatikan tabel berikut:</p>
      <table>
        <thead><tr><th>Input</th><th>Output</th></tr></thead>
        <tbody><tr><td><code>0</code></td><td><strong>1</strong></td></tr></tbody>
      </table>
    `;

    const cleaned = sanitizeQuestionHtml(safeHtml);
    expect(cleaned).toContain('<table>');
    expect(cleaned).toContain('<thead>');
    expect(cleaned).toContain('<code>0</code>');
    expect(cleaned).toContain('<strong>1</strong>');
  });

  it('menghasilkan hash yang identik untuk variasi spasi dan huruf besar/kecil (deteksi duplikat)', () => {
    const textA = 'Manakah dari struktur data berikut yang menerapkan prinsip FIFO?';
    const textB = '  manakah dari STRUKTUR data berikut yang menerapkan prinsip fifo?  ';
    const textC = '<p>Manakah dari <strong>struktur data</strong> berikut yang menerapkan prinsip FIFO?</p>';

    const hashA = computeQuestionHash(textA);
    const hashB = computeQuestionHash(textB);
    const hashC = computeQuestionHash(textC);

    expect(hashA).toBe(hashB);
    expect(hashA).toBe(hashC);

    const differentText = 'Apakah HTTP adalah protokol stateless?';
    expect(computeQuestionHash(differentText)).not.toBe(hashA);
  });
});
