import { describe, it, expect, vi } from 'vitest';
import { Judge0Adapter } from '@/lib/judge/coderunner';
import {
  generateExamToken,
  calcCombinedExamScore,
  compareOutput,
  calcStudentCpmkScores,
  calcStudentCplScores,
  extractTextShingles,
  calcTextJaccardSimilarity,
  extractCodeFingerprints,
  extractStarterCodeKgrams,
  calcCodeSimilarity,
} from '@/lib/akademik/exam-utils';

describe('Pengujian Terpadu Fase 4: Ujian, Auto-grader, CPMK-CPL, dan Kemiripan', () => {
  describe('Judge0 Adapter & Graceful Fallback (11.3)', () => {
    it('mengembalikan status tidak aktif dengan anggun jika JUDGE_API_URL kosong atau fitur dinonaktifkan', async () => {
      const adapter = new Judge0Adapter();
      const res = await adapter.run({
        language: 'python',
        sourceCode: 'print("Halo")',
        testCases: [
          { id: 'tc1', stdin: '', expectedStdout: 'Halo\n', isHidden: false, weight: 1 },
          { id: 'tc2', stdin: '', expectedStdout: 'Halo\n', isHidden: true, weight: 2 },
        ],
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe('galat');
      expect(res.compileOutput).toContain('Penilaian otomatis belum aktif');
      expect(res.results.length).toBe(2);
      expect(res.results[0].isHidden).toBe(false);
      expect(res.results[1].isHidden).toBe(true);
    });

    it('memvalidasi keempat mode pencocokan keluaran (exact, trim, tokens, float)', () => {
      // exact
      expect(compareOutput('output', 'output', 'exact')).toBe(true);
      expect(compareOutput('output\n', 'output', 'exact')).toBe(false);

      // trim
      expect(compareOutput(' output \n', 'output', 'trim')).toBe(true);

      // tokens
      expect(compareOutput('1  2   3', '1 2 3', 'tokens')).toBe(true);

      // float dengan toleransi 1e-4
      expect(compareOutput('0.10001', '0.10000', 'float')).toBe(true);
      expect(compareOutput('0.10020', '0.10000', 'float')).toBe(false);
    });
  });

  describe('Token Ujian & Nilai Remedial (11.2)', () => {
    it('menghasilkan token 6 karakter tanpa huruf ambigu', () => {
      for (let i = 0; i < 20; i++) {
        const token = generateExamToken();
        expect(token).toHaveLength(6);
        expect(token).not.toMatch(/[0O1IL]/);
      }
    });

    it('menghitung skor remedial sesuai kebijakan gabung dan batas nilai (score_cap)', () => {
      // Kebijakan tertinggi dengan cap 70
      expect(calcCombinedExamScore(55, 95, 'tertinggi', 70)).toBe(70);
      expect(calcCombinedExamScore(75, 95, 'tertinggi', 70)).toBe(75);

      // Kebijakan ganti dengan cap 70
      expect(calcCombinedExamScore(55, 95, 'ganti', 70)).toBe(70);

      // Kebijakan rata-rata dengan cap 70: (50 + 70) / 2 = 60
      expect(calcCombinedExamScore(50, 90, 'rata_rata', 70)).toBe(60);

      // Tanpa cap
      expect(calcCombinedExamScore(50, 90, 'rata_rata')).toBe(70);
    });
  });

  describe('Pemetaan CPMK ke CPL (11.5)', () => {
    it('mengecualikan penilaian yang belum dipublikasikan dari perhitungan CPMK', () => {
      const items = [
        { id: '1', classId: 'cls1', cpmkId: 'c1', score: 100, maxScore: 100, weightPercent: 100, isPublished: true },
        { id: '2', classId: 'cls1', cpmkId: 'c1', score: 0, maxScore: 100, weightPercent: 100, isPublished: false },
      ];

      const res = calcStudentCpmkScores(items);
      expect(res.c1).toBe(100);
    });

    it('menghitung rata-rata tertimbang CPL lintas beberapa CPMK', () => {
      const cpmkScores = { c1: 80, c2: 90 };
      const mappings = [
        { cpmkId: 'c1', cplId: 'cpl_a', weightPercent: 40 },
        { cpmkId: 'c2', cplId: 'cpl_a', weightPercent: 60 },
      ];

      const cplScores = calcStudentCplScores(cpmkScores, mappings);
      // (80*40 + 90*60) / 100 = (3200 + 5400) / 100 = 86
      expect(cplScores.cpl_a).toBe(86);
    });
  });

  describe('Deteksi Kemiripan Tugas (11.6)', () => {
    it('mengabaikan kode awal (starter code) dalam perhitungan kemiripan antar mahasiswa', () => {
      const starterCode = `
        class SolutionBase {
          constructor() {
            this.state = [];
          }
          execute() {
            return this.state;
          }
        }
      `;
      const starterKgrams = extractStarterCodeKgrams(starterCode);

      const mhsA = `
        ${starterCode}
        function solusiA(n) {
          let total = 0;
          for (let i = 0; i < n; i++) total += i;
          return total;
        }
      `;

      const mhsB = `
        ${starterCode}
        function solusiB(items) {
          return items.filter(x => x > 0).map(x => x * 2);
        }
      `;

      const fpAWithStarter = extractCodeFingerprints(mhsA);
      const fpBWithStarter = extractCodeFingerprints(mhsB);
      const simWithStarter = calcCodeSimilarity(fpAWithStarter, fpBWithStarter);

      const fpAFiltered = extractCodeFingerprints(mhsA, starterKgrams);
      const fpBFiltered = extractCodeFingerprints(mhsB, starterKgrams);
      const simFiltered = calcCodeSimilarity(fpAFiltered, fpBFiltered);

      expect(simFiltered).toBeLessThan(simWithStarter);
    });
  });
});
