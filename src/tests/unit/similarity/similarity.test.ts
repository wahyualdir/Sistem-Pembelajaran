import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock current active user (Dosen Pengampu)
const mockCurrentUser = {
  user: { id: 'usr-lec-01' },
  profile: { full_name: 'Dosen Pengampu Web' },
  roles: [{ id: 'r1', roles: { code: 'LECTURER' } }],
  activeRole: 'LECTURER',
};

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

import {
  normalizeSourceCode,
  calculateJaccardSimilarity,
  extractMatchingSegments,
} from '@/modules/academic/similarity-engine';
import {
  updateAssignmentSimilarityThresholdAction,
  reviewSimilarityPairAction,
  runAssignmentSimilarityCheckAction,
} from '@/modules/academic/similarity-actions';
import { NilaiStore } from '@/features/nilai/nilai-store';

describe('Deteksi Kemiripan Pengumpulan Tugas (Similarity Engine)', () => {
  const assignmentId = 'asg-test-sim-001';

  beforeEach(() => {
    // Reset stores
    const store = (globalThis as any).__siajarSimilarityPairs;
    if (store && Array.isArray(store)) {
      store.length = 0;
    }
  });

  describe('1. Normalisasi Kode Sumber (Source Code Normalization)', () => {
    it('menghapus komentar satu baris // dan # serta komentar multi-baris /* */', () => {
      const code = `
        // Ini komentar JavaScript
        function calculate() {
          /* Komentar
             panjang */
          # Komentar gaya Python
          return 42;
        }
      `;
      const { normalized, isCode } = normalizeSourceCode(code);
      expect(isCode).toBe(true);
      expect(normalized).not.toContain('komentar');
      expect(normalized).not.toContain('javascript');
      expect(normalized).not.toContain('python');
      expect(normalized).toContain('return 42');
    });

    it('melakukan kanonikalisasi nama variabel sehingga penggantian nama tetap terdeteksi mirip', () => {
      const codeStudentA = `
        function hitungRataRata(dataNilai) {
          let totalJumlah = 0;
          for (let index = 0; index < dataNilai.length; index++) {
            totalJumlah += dataNilai[index];
          }
          return totalJumlah / dataNilai.length;
        }
      `;

      const codeStudentB = `
        function hitungRataRata(arrAngka) {
          let sumTotal = 0;
          for (let i = 0; i < arrAngka.length; i++) {
            sumTotal += arrAngka[i];
          }
          return sumTotal / arrAngka.length;
        }
      `;

      // Kalkulasi kemiripan setelah normalisasi dan kanonikalisasi identifier
      const { score, isCode } = calculateJaccardSimilarity(codeStudentA, codeStudentB);
      expect(isCode).toBe(true);
      expect(score).toBeGreaterThan(70); // Kemiripan sangat tinggi di atas 70%
    });
  });

  describe('2. Algoritma N-Gram Shingling & Jaccard Similarity', () => {
    it('memberikan skor 100% untuk dua dokumen teks yang identik', () => {
      const text = 'Analisis perancangan perangkat lunak berbasis arsitektur microservices untuk skalabilitas tinggi.';
      const { score } = calculateJaccardSimilarity(text, text);
      expect(score).toBe(100);
    });

    it('memberikan skor 0% untuk dokumen yang sama sekali berbeda', () => {
      const textA = 'Algoritma Dijkstra mencari lintasan terpendek pada graf berbobot positif berarah.';
      const textB = 'Filsafat etika deontologi menekankan kewajiban moral imperatif di atas konsekuensi utilitas.';
      const { score } = calculateJaccardSimilarity(textA, textB);
      expect(score).toBe(0);
    });

    it('menemukan segmen kalimat yang cocok berdampingan', () => {
      const textA = 'Pengantar Basis Data. Konsep normalisasi database relasional 1NF 2NF 3NF. Kesimpulan analisis.';
      const textB = 'Laporan praktikum mahasiswa. Konsep normalisasi database relasional 1NF 2NF 3NF. Daftar pustaka referensi.';
      const segments = extractMatchingSegments(textA, textB);
      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].textA).toContain('normalisasi database relasional');
    });
  });

  describe('3. Ambang Batas & Peninjauan Dosen (Audit Trail)', () => {
    it('berhasil memperbarui ambang batas kemiripan per tugas', async () => {
      const res = await updateAssignmentSimilarityThresholdAction({ assignmentId, threshold: 50 });
      expect(res.ok).toBe(true);
      expect(res.threshold).toBe(50);
    });

    it('dosen dapat menandai hasil peninjauan dan tercatat di audit trail', async () => {
      // Jalankan pengecekan kemiripan untuk menghasilkan pasangan perbandingan
      const checkRes = await runAssignmentSimilarityCheckAction(assignmentId);
      expect(checkRes.ok).toBe(true);
      expect(checkRes.pairs).toBeDefined();
      expect(checkRes.pairs!.length).toBeGreaterThan(0);

      const pairToReview = checkRes.pairs![0];
      const reviewRes = await reviewSimilarityPairAction({
        pairId: pairToReview.id,
        status: 'PERLU_KLARIFIKASI',
        note: 'Terdapat kemiripan struktur logika fungsi kalkulasi, panggil mahasiswa untuk wawancara kode.',
      });

      expect(reviewRes.ok).toBe(true);
      expect(reviewRes.pair?.reviewStatus).toBe('PERLU_KLARIFIKASI');
      expect(reviewRes.pair?.reviewNote).toContain('kemiripan struktur logika');

      // Verifikasi pencatatan audit log
      const logs = NilaiStore.getLogAudit();
      const auditLog = logs.find((l) => l.entitasId === pairToReview.id);
      expect(auditLog).toBeDefined();
      expect(auditLog?.keterangan).toContain('PERLU_KLARIFIKASI');
    });
  });
});
