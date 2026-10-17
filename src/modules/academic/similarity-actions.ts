'use server';

import { randomUUID } from 'crypto';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';

export type {
  SimilarityReviewStatus,
  MatchingSegment,
  SimilarityPair,
  AssignmentSimilarityConfig,
} from './similarity-engine';

import {
  type SimilarityPair,
  type AssignmentSimilarityConfig,
  similarityPairsStore,
  similarityConfigsStore,
  calculateJaccardSimilarity,
} from './similarity-engine';

// -------------------------------------------------------------
// 2. Server Action: Jalankan Deteksi Kemiripan untuk Tugas
// -------------------------------------------------------------
export async function runAssignmentSimilarityCheckAction(assignmentId: string): Promise<{
  ok: boolean;
  pairs?: SimilarityPair[];
  threshold?: number;
  totalSubmissions?: number;
  highRiskCount?: number;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'TEACHING_ASSISTANT' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Akses ditolak. Hasil kemiripan tugas hanya dapat dilihat oleh Dosen Pengampu dan Asisten Dosen.' };
  }

  // Ambil daftar submission tugas dari memory store
  const memTugas = (globalThis as any).__siajarTugas;
  const rawSubmissions: Array<{ id: string; student_id: string; student_name: string; text_body: string }> =
    memTugas?.submissions?.filter((s: any) => s.assignment_id === assignmentId) || [];

  const config = similarityConfigsStore.get(assignmentId) || {
    assignmentId,
    threshold: 40,
    excludeReferences: true,
  };

  // Jika submission kurang dari 2, buat contoh demo perbandingan agar dosen dapat langsung mengevaluasi
  let submissions = [...rawSubmissions];
  if (submissions.length < 2) {
    submissions = [
      {
        id: 'sub-demo-01',
        student_id: 'std-demo-01',
        student_name: 'Ahmad Fauzi',
        text_body: `// Algoritma Pengurutan QuickSort dengan Pivot Tengah
function quickSort(items, left, right) {
    let index;
    if (items.length > 1) {
        let pivot = items[Math.floor((right + left) / 2)];
        let i = left;
        let j = right;
        while (i <= j) {
            while (items[i] < pivot) { i++; }
            while (items[j] > pivot) { j--; }
            if (i <= j) {
                let temp = items[i];
                items[i] = items[j];
                items[j] = temp;
                i++;
                j--;
            }
        }
        index = i;
        if (left < index - 1) { quickSort(items, left, index - 1); }
        if (index < right) { quickSort(items, index, right); }
    }
    return items;
}`,
      },
      {
        id: 'sub-demo-02',
        student_id: 'std-demo-02',
        student_name: 'Dimas Aditya',
        text_body: `/* Implementasi Quick Sort Data Mahasiswa */
function quickSort(arrayData, batasKiri, batasKanan) {
    let penanda;
    if (arrayData.length > 1) {
        let titikTengah = arrayData[Math.floor((batasKanan + batasKiri) / 2)];
        let p = batasKiri;
        let q = batasKanan;
        while (p <= q) {
            while (arrayData[p] < titikTengah) { p++; }
            while (arrayData[q] > titikTengah) { q--; }
            if (p <= q) {
                let wadah = arrayData[p];
                arrayData[p] = arrayData[q];
                arrayData[q] = wadah;
                p++;
                q--;
            }
        }
        penanda = p;
        if (batasKiri < penanda - 1) { quickSort(arrayData, batasKiri, penanda - 1); }
        if (penanda < batasKanan) { quickSort(arrayData, penanda, batasKanan); }
    }
    return arrayData;
}`,
      },
      {
        id: 'sub-demo-03',
        student_id: 'std-demo-03',
        student_name: 'Siti Rahma',
        text_body: `// Implementasi MergeSort rekursif dengan fungsi pembantu merge
function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    return merge(left, right);
}`,
      },
    ];
  }

  const existingPairs = similarityPairsStore.filter((p) => p.assignmentId === assignmentId);
  const pairsMap = new Map<string, SimilarityPair>();
  existingPairs.forEach((p) => pairsMap.set(`${p.submissionIdA}:${p.submissionIdB}`, p));

  const generatedPairs: SimilarityPair[] = [];

  // Bandingkan setiap pasangan submission (Pairwise Comparison)
  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const subA = submissions[i];
      const subB = submissions[j];
      const pairKey = `${subA.id}:${subB.id}`;

      const { score, isCode, matchingSegments } = calculateJaccardSimilarity(subA.text_body, subB.text_body);

      const existing = pairsMap.get(pairKey);
      const pair: SimilarityPair = {
        id: existing?.id || `sim-${randomUUID().slice(0, 8)}`,
        assignmentId,
        submissionIdA: subA.id,
        studentIdA: subA.student_id,
        studentNameA: subA.student_name,
        submissionIdB: subB.id,
        studentIdB: subB.student_id,
        studentNameB: subB.student_name,
        similarityScore: score,
        threshold: config.threshold,
        isCode,
        matchingSegments,
        textA: subA.text_body,
        textB: subB.text_body,
        reviewStatus: existing?.reviewStatus || (score >= config.threshold ? 'BELUM_DITINJAU' : 'TIDAK_MASALAH'),
        reviewNote: existing?.reviewNote || null,
        reviewedBy: existing?.reviewedBy || null,
        reviewedAt: existing?.reviewedAt || null,
        analyzedAt: new Date().toISOString(),
      };

      generatedPairs.push(pair);
    }
  }

  // Perbarui store
  // Hapus entri lama untuk assignmentId ini
  for (let idx = similarityPairsStore.length - 1; idx >= 0; idx--) {
    if (similarityPairsStore[idx].assignmentId === assignmentId) {
      similarityPairsStore.splice(idx, 1);
    }
  }
  similarityPairsStore.push(...generatedPairs);

  const highRiskCount = generatedPairs.filter((p) => p.similarityScore >= config.threshold).length;

  return {
    ok: true,
    pairs: generatedPairs.sort((a, b) => b.similarityScore - a.similarityScore),
    threshold: config.threshold,
    totalSubmissions: submissions.length,
    highRiskCount,
  };
}

// -------------------------------------------------------------
// 3. Server Action: Tinjau & Tandai Hasil Kemiripan oleh Dosen
// -------------------------------------------------------------
const reviewSimilaritySchema = z.object({
  pairId: z.string(),
  status: z.enum(['TIDAK_MASALAH', 'PERLU_KLARIFIKASI', 'PELANGGARAN']),
  note: z.string().trim().min(5, 'Catatan telaah minimal 5 karakter.').max(500),
});

export async function reviewSimilarityPairAction(input: unknown): Promise<{
  ok: boolean;
  pair?: SimilarityPair;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'TEACHING_ASSISTANT')) {
    return { ok: false, error: 'Akses ditolak. Hanya Dosen pengampu dan Asisten Dosen yang dapat meninjau hasil kemiripan.' };
  }

  const parsed = reviewSimilaritySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { pairId, status, note } = parsed.data;
  const pair = similarityPairsStore.find((p) => p.id === pairId);
  if (!pair) {
    return { ok: false, error: 'Pasangan kemiripan tugas tidak ditemukan.' };
  }

  const reviewerName = user.profile?.full_name || (user.user as any).name || 'Dosen Pengampu';
  const now = new Date().toISOString();

  const prevStatus = pair.reviewStatus;
  pair.reviewStatus = status;
  pair.reviewNote = note;
  pair.reviewedBy = reviewerName;
  pair.reviewedAt = now;

  // Rekam ke Audit Trail (Kewajiban keamanan: Semua keputusan dicatat)
  await recordSystemAuditLog({
    actorId: user.user.id,
    actorName: reviewerName,
    actorRole: user.activeRole,
    action: 'assignment.similarity_review',
    entityType: 'similarity_pairs',
    entityId: pair.id,
    description: `Dosen menetapkan status kemiripan tugas (${pair.studentNameA} vs ${pair.studentNameB}) ke "${status}". Catatan: "${note}"`,
    valueBefore: JSON.stringify({ reviewStatus: prevStatus }),
    valueAfter: JSON.stringify({ reviewStatus: status, note, reviewedBy: reviewerName }),
  });

  revalidatePath('/classes/[id]/assignments/[aid]', 'page');

  return { ok: true, pair };
}

// -------------------------------------------------------------
// 4. Server Action: Atur Ambang Batas Kemiripan per Tugas
// -------------------------------------------------------------
const updateThresholdSchema = z.object({
  assignmentId: z.string(),
  threshold: z.coerce.number().int().min(10, 'Minimal 10%').max(90, 'Maksimal 90%'),
});

export async function updateAssignmentSimilarityThresholdAction(input: unknown): Promise<{
  ok: boolean;
  threshold?: number;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'LECTURER') {
    return { ok: false, error: 'Akses ditolak. Pengaturan ambang batas hanya dapat diubah oleh Dosen Pengampu.' };
  }

  const parsed = updateThresholdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { assignmentId, threshold } = parsed.data;
  similarityConfigsStore.set(assignmentId, {
    assignmentId,
    threshold,
    excludeReferences: true,
  });

  return { ok: true, threshold };
}
