import { describe, it, expect } from 'vitest';
import {
  analyzeExamItems,
  calcMean,
  calcMedian,
  calcStdDev,
  calcCombinedExamScore,
  compareOutput,
  calcStudentCpmkScores,
  calcStudentCplScores,
  extractTextShingles,
  calcTextJaccardSimilarity,
  extractCodeFingerprints,
  extractStarterCodeKgrams,
  calcCodeSimilarity,
  generateExamToken,
} from '@/lib/akademik/exam-utils';

describe('Modul Utilitas Ujian Fase 4 (exam-utils.ts)', () => {
  describe('1. Analisis Butir Soal (11.4)', () => {
    it('menghitung mean, median, dan stddev dengan benar', () => {
      const numbers = [70, 80, 90, 100];
      expect(calcMean(numbers)).toBe(85);
      expect(calcMedian(numbers)).toBe(85);
      expect(calcStdDev(numbers)).toBe(11.18);

      expect(calcMean([])).toBe(0);
      expect(calcMedian([])).toBe(0);
      expect(calcStdDev([])).toBe(0);
    });

    it('menghitung tingkat kesukaran dan daya pembeda pada dataset kecil', () => {
      // 10 peserta: 5 atas (skor 3-2), 5 bawah (skor 1-0)
      const participants = [
        { studentId: 's1', totalScore: 3, itemScores: { q1: 1, q2: 1, q3: 1 }, itemChoices: { q1: 'A', q2: 'B', q3: 'C' } },
        { studentId: 's2', totalScore: 3, itemScores: { q1: 1, q2: 1, q3: 1 }, itemChoices: { q1: 'A', q2: 'B', q3: 'C' } },
        { studentId: 's3', totalScore: 2, itemScores: { q1: 1, q2: 1, q3: 0 }, itemChoices: { q1: 'A', q2: 'B', q3: 'D' } },
        { studentId: 's4', totalScore: 2, itemScores: { q1: 1, q2: 1, q3: 0 }, itemChoices: { q1: 'A', q2: 'B', q3: 'D' } },
        { studentId: 's5', totalScore: 2, itemScores: { q1: 1, q2: 0, q3: 1 }, itemChoices: { q1: 'A', q2: 'C', q3: 'C' } },
        { studentId: 's6', totalScore: 1, itemScores: { q1: 1, q2: 0, q3: 0 }, itemChoices: { q1: 'A', q2: 'C', q3: 'D' } },
        { studentId: 's7', totalScore: 1, itemScores: { q1: 1, q2: 0, q3: 0 }, itemChoices: { q1: 'A', q2: 'C', q3: 'D' } },
        { studentId: 's8', totalScore: 1, itemScores: { q1: 0, q2: 1, q3: 0 }, itemChoices: { q1: 'B', q2: 'B', q3: 'D' } },
        { studentId: 's9', totalScore: 0, itemScores: { q1: 0, q2: 0, q3: 0 }, itemChoices: { q1: 'C', q2: 'D', q3: 'D' } },
        { studentId: 's10', totalScore: 0, itemScores: { q1: 0, q2: 0, q3: 0 }, itemChoices: { q1: 'D', q2: 'D', q3: 'D' } },
      ];

      const res = analyzeExamItems(
        ['q1', 'q2', 'q3'],
        { q1: 1, q2: 1, q3: 1 },
        participants,
        { q1: 'A', q2: 'B', q3: 'C' }
      );

      expect(res.summary.n).toBe(10);
      expect(res.summary.mean).toBe(1.5);
      expect(res.summary.min).toBe(0);
      expect(res.summary.max).toBe(3);

      // q1 dijawab benar oleh 7 orang -> p = 0.70 (sedang)
      expect(res.items.q1.difficultyP).toBe(0.7);
      expect(res.items.q1.difficultyCategory).toBe('sedang');

      // q3 dijawab benar oleh 3 orang -> p = 0.30 (sedang)
      expect(res.items.q3.difficultyP).toBe(0.3);

      // n < 20 -> discriminationCategory harus 'data_belum_cukup'
      expect(res.items.q1.discriminationCategory).toBe('data_belum_cukup');
    });

    it('mendeteksi peringatan pengecoh yang dipilih kurang dari 5% peserta', () => {
      // 25 peserta untuk uji daya pembeda dan pengecoh
      const participants = Array.from({ length: 25 }, (_, i) => ({
        studentId: `s${i}`,
        totalScore: i >= 15 ? 1 : 0,
        itemScores: { q1: i >= 15 ? 1 : 0 },
        itemChoices: { q1: i >= 15 ? 'A' : (i === 0 ? 'B' : 'C') }, // 'B' hanya dipilih 1 dari 25 (4%)
      }));

      const res = analyzeExamItems(
        ['q1'],
        { q1: 1 },
        participants,
        { q1: 'A' }
      );

      expect(res.items.q1.distractorWarnings.some((w) => w.includes('Pilihan B dipilih kurang dari 5%'))).toBe(true);
      expect(res.items.q1.needsRevision).toBe(true);
    });

    it('menangani kasus tanpa peserta (n = 0) tanpa pembagian dengan nol', () => {
      const res = analyzeExamItems(['q1'], { q1: 1 }, []);
      expect(res.summary.n).toBe(0);
      expect(res.summary.mean).toBe(0);
      expect(res.summary.kr20).toBe(0);
      expect(Object.keys(res.items).length).toBe(0);
    });
  });

  describe('2. Token & Nilai Remedial (11.2)', () => {
    it('membuat token ujian 6 karakter tanpa karakter mirip (0, O, 1, I, L)', () => {
      for (let i = 0; i < 50; i++) {
        const token = generateExamToken();
        expect(token.length).toBe(6);
        expect(token).not.toMatch(/[0O1IL]/);
      }
    });

    it('menghitung skor gabungan ujian dengan kebijakan tertinggi, ganti, dan rata-rata', () => {
      const utama = 50;
      const remedial = 80;

      // Kebijakan tertinggi tanpa cap
      expect(calcCombinedExamScore(utama, remedial, 'tertinggi')).toBe(80);
      // Kebijakan tertinggi dengan score_cap 70
      expect(calcCombinedExamScore(utama, remedial, 'tertinggi', 70)).toBe(70);
      // Jika remedial lebih rendah dari utama
      expect(calcCombinedExamScore(75, 60, 'tertinggi', 70)).toBe(75);

      // Kebijakan ganti dengan cap 70
      expect(calcCombinedExamScore(utama, remedial, 'ganti', 70)).toBe(70);
      // Kebijakan ganti tanpa cap
      expect(calcCombinedExamScore(utama, remedial, 'ganti')).toBe(80);

      // Kebijakan rata-rata dengan cap 70: (50 + 70) / 2 = 60
      expect(calcCombinedExamScore(utama, remedial, 'rata_rata', 70)).toBe(60);

      // Remedial null
      expect(calcCombinedExamScore(utama, null, 'tertinggi')).toBe(50);
    });
  });

  describe('3. Pencocokan Auto-grader Koding (11.3)', () => {
    it('mendukung mode pencocokan exact', () => {
      expect(compareOutput('Halo Dunia\n', 'Halo Dunia\n', 'exact')).toBe(true);
      expect(compareOutput('Halo Dunia\n', 'Halo Dunia', 'exact')).toBe(false);
    });

    it('mendukung mode pencocokan trim', () => {
      expect(compareOutput('  Halo Dunia \n', 'Halo Dunia', 'trim')).toBe(true);
      expect(compareOutput('Halo Dunia', 'halo dunia', 'trim')).toBe(false);
    });

    it('mendukung mode pencocokan tokens', () => {
      expect(compareOutput('10   20 \n 30', '10 20 30', 'tokens')).toBe(true);
      expect(compareOutput('10 20', '10 20 30', 'tokens')).toBe(false);
    });

    it('mendukung mode pencocokan float dengan epsilon 1e-4', () => {
      expect(compareOutput('3.14159', '3.14158', 'float')).toBe(true); // selisih 0.00001 <= 1e-4
      expect(compareOutput('3.14159', '3.14000', 'float')).toBe(false); // selisih 0.00159 > 1e-4
    });
  });

  describe('4. Pemetaan CPMK ke CPL (11.5)', () => {
    it('menghitung skor CPMK dan skor CPL dari 3 mahasiswa dengan benar', () => {
      // 2 CPMK (cpmk1 bobot 40%, cpmk2 bobot 60%)
      const assessmentsMhs1 = [
        { id: 'a1', classId: 'c1', cpmkId: 'cpmk1', score: 80, maxScore: 100, weightPercent: 50, isPublished: true },
        { id: 'a2', classId: 'c1', cpmkId: 'cpmk1', score: 90, maxScore: 100, weightPercent: 50, isPublished: true },
        { id: 'a3', classId: 'c1', cpmkId: 'cpmk2', score: 60, maxScore: 100, weightPercent: 100, isPublished: true },
        // Item belum dipublikasikan tidak boleh terhitung
        { id: 'a4', classId: 'c1', cpmkId: 'cpmk2', score: 0, maxScore: 100, weightPercent: 100, isPublished: false },
      ];

      const cpmkScores = calcStudentCpmkScores(assessmentsMhs1);
      // cpmk1: (0.8*100*50 + 0.9*100*50) / 100 = 85
      expect(cpmkScores.cpmk1).toBe(85);
      // cpmk2: 60
      expect(cpmkScores.cpmk2).toBe(60);

      // Pemetaan CPMK ke CPL:
      // CPL1 dipetakan dari CPMK1 (bobot 100%)
      // CPL2 dipetakan dari CPMK1 (50%) dan CPMK2 (50%)
      const mappings = [
        { cpmkId: 'cpmk1', cplId: 'cpl1', weightPercent: 100 },
        { cpmkId: 'cpmk1', cplId: 'cpl2', weightPercent: 50 },
        { cpmkId: 'cpmk2', cplId: 'cpl2', weightPercent: 50 },
      ];

      const cplScores = calcStudentCplScores(cpmkScores, mappings);
      expect(cplScores.cpl1).toBe(85);
      // CPL2: (85*50 + 60*50) / 100 = 72.5
      expect(cplScores.cpl2).toBe(72.5);
    });
  });

  describe('5. Cek Kemiripan Tugas (11.6)', () => {
    it('mendeteksi kemiripan teks menggunakan shingle Jaccard', () => {
      const text1 = 'Algoritma pencarian biner bekerja dengan membagi dua ruang pencarian pada larik yang terurut secara efisien.';
      const text2 = 'Algoritma pencarian biner bekerja dengan membagi dua ruang pencarian pada array data yang terurut rapi.';
      const textDifferent = 'Sistem operasi Linux menggunakan kernel monolitik dengan arsitektur modular yang stabil dan aman.';

      const sh1 = extractTextShingles(text1);
      const sh2 = extractTextShingles(text2);
      const shDiff = extractTextShingles(textDifferent);

      const simHigh = calcTextJaccardSimilarity(sh1, sh2);
      const simDiff = calcTextJaccardSimilarity(sh1, shDiff);

      expect(simHigh).toBeGreaterThan(0.2); // Teks yang disalin sebagian punya kemiripan tinggi
      expect(simDiff).toBe(0); // Teks topik berbeda tidak memiliki shingle sama
    });

    it('mendeteksi kemiripan kode saat variabel dan fungsi diganti namanya', () => {
      const codeOriginal = `
        function hitungLuas(panjang, lebar) {
          if (panjang <= 0 || lebar <= 0) {
            return 0;
          }
          let hasil = panjang * lebar;
          return hasil;
        }
      `;

      const codeRenamed = `
        function calculateArea(x, y) {
          if (x <= 0 || y <= 0) {
            return 0;
          }
          let area = x * y;
          return area;
        }
      `;

      const codeDifferent = `
        function connectDatabase(host, port) {
          let socket = new Socket(host, port);
          socket.authenticate();
          return socket;
        }
      `;

      const fpOrig = extractCodeFingerprints(codeOriginal);
      const fpRenamed = extractCodeFingerprints(codeRenamed);
      const fpDiff = extractCodeFingerprints(codeDifferent);

      const simRenamed = calcCodeSimilarity(fpOrig, fpRenamed);
      const simDiff = calcCodeSimilarity(fpOrig, fpDiff);

      // Kode yang hanya di-rename variabelnya harus memiliki kemiripan 100%
      expect(simRenamed).toBe(1);
      // Kode berbeda harus sangat rendah atau nol
      expect(simDiff).toBeLessThan(0.3);
    });

    it('mengecualikan kode dasar starter code sehingga tidak memicu kemiripan palsu', () => {
      const starterCode = `
        function inisialisasiStrukturData(panjangAwal, kapasitasMaksimum) {
          let buffer = [];
          for (let i = 0; i < panjangAwal; i++) {
            buffer.push(0);
          }
          return buffer;
        }
      `;
      const starterHashes = extractStarterCodeKgrams(starterCode);

      const studentCode1 = `
        function inisialisasiStrukturData(panjangAwal, kapasitasMaksimum) {
          let buffer = [];
          for (let i = 0; i < panjangAwal; i++) {
            buffer.push(0);
          }
          return buffer;
        }
        function prosesDataMahasiswaA(antrean, batas) {
          let counter = 0;
          for (let idx = 0; idx < antrean.length; idx++) {
            if (antrean[idx] > batas) {
              counter += 1;
            }
          }
          return counter;
        }
      `;

      const studentCode2 = `
        function inisialisasiStrukturData(panjangAwal, kapasitasMaksimum) {
          let buffer = [];
          for (let i = 0; i < panjangAwal; i++) {
            buffer.push(0);
          }
          return buffer;
        }
        function transformArrayMahasiswaB(data, multiplier) {
          let hasil = [];
          let p = 0;
          while (p < data.length) {
            hasil.push(data[p] * multiplier);
            p++;
          }
          return hasil;
        }
      `;

      // Ekstraksi tanpa filter starter code
      const fp1Without = extractCodeFingerprints(studentCode1);
      const fp2Without = extractCodeFingerprints(studentCode2);
      const simWithout = calcCodeSimilarity(fp1Without, fp2Without);
      expect(simWithout).toBeGreaterThan(0);

      // Ekstraksi DENGAN filter starter code
      const fp1WithFilter = extractCodeFingerprints(studentCode1, starterHashes);
      const fp2WithFilter = extractCodeFingerprints(studentCode2, starterHashes);
      const simWithFilter = calcCodeSimilarity(fp1WithFilter, fp2WithFilter);

      // Kode mahasiswa bagian solusi mereka sendiri berbeda, jadi kemiripan turun
      expect(simWithFilter).toBeLessThan(simWithout);
    });
  });
});
