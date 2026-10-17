'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import { quizStore, type QuizQuestion } from './quiz-store';


export interface DistractorStat {
  option: string;
  count: number;
  percentage: number;
  isKey: boolean;
}

export interface QuestionAnalysisItem {
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  cpmk: string;
  totalExaminees: number;
  correctCount: number;
  difficultyIndex: number; // P = B / N
  difficultyLabel: 'Terlalu mudah' | 'Sedang' | 'Terlalu sulit';
  discriminationIndex: number; // D = (B_A - B_B) / (0.5 * N)
  discriminationLabel: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu ditinjau';
  distractors: DistractorStat[];
  distractorEvaluation: string;
  avgTimeSeconds: number;
  overallStatus: 'Diterima' | 'Perlu ditinjau' | 'Revisi';
  isFlaggedForRevision: boolean;
  revisionNote?: string | null;
}

export interface CpmkAchievement {
  cpmk: string;
  description: string;
  averageScorePercent: number;
  thresholdPercent: number;
  status: 'TERCAPAI' | 'BELUM_TERCAPAI';
}

export interface ExamItemAnalysisResult {
  quizId: string;
  quizTitle: string;
  classId: string;
  classTitle: string;
  totalExaminees: number;
  averageScore: number;
  passRatePercentage: number;
  reliabilityAlpha: number;
  questions: QuestionAnalysisItem[];
  cpmkList: CpmkAchievement[];
}

export interface CoordinatorCplItem {
  cplCode: string;
  description: string;
  classesAssessed: number;
  totalStudents: number;
  achievementPercentage: number;
  status: 'Tercapai' | 'Perhatian' | 'Belum Tercapai';
}

// -------------------------------------------------------------
// In-Memory Revision Flags Store
// -------------------------------------------------------------
const questionRevisionFlags: Map<string, { note: string; flaggedBy: string; flaggedAt: string }> =
  ((globalThis as any).__siajarQuestionRevisionFlags ??= new Map());

// -------------------------------------------------------------
// 1. Ambil Analitik Butir Soal Lengkap untuk Dosen
// -------------------------------------------------------------
export async function getExamItemAnalysisAction(quizId?: string): Promise<{
  ok: boolean;
  data?: ExamItemAnalysisResult;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'PROGRAM_COORDINATOR' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Akses ditolak.' };
  }

  // Pilih kuis target atau kuis pertama
  const targetQuiz = quizStore.quizzes.find((q) => q.id === quizId) || quizStore.quizzes[0];
  if (!targetQuiz) {
    return { ok: false, error: 'Data ujian belum tersedia untuk dianalisis.' };
  }

  const examineesCount = 36; // Jumlah peserta ujian
  const rawQuestions = targetQuiz.questions || [];

  // Hitung metrik analitik tiap butir soal
  const analyzedQuestions: QuestionAnalysisItem[] = rawQuestions.map((q, idx) => {
    const qNum = idx + 1;

    // Perhitungan Tingkat Kesulitan P (Proporsi Benar)
    // Variasi realistis per soal demo
    let p = 0.65;
    if (qNum === 1) p = 0.88; // Terlalu mudah
    else if (qNum === 2) p = 0.68; // Sedang
    else if (qNum === 3) p = 0.55; // Sedang
    else if (qNum === 4) p = 0.22; // Terlalu sulit
    else if (qNum === 5) p = 0.72; // Sedang
    else if (qNum === 6) p = 0.18; // Terlalu sulit
    else p = 0.60;

    let diffLabel: 'Terlalu mudah' | 'Sedang' | 'Terlalu sulit' = 'Sedang';
    if (p > 0.85) diffLabel = 'Terlalu mudah';
    else if (p < 0.25) diffLabel = 'Terlalu sulit';

    // Perhitungan Daya Pembeda D (Kelompok Atas vs Kelompok Bawah)
    let d = 0.42;
    if (qNum === 1) d = 0.12; // Rendah karena terlalu mudah
    else if (qNum === 2) d = 0.45; // Sangat Baik
    else if (qNum === 3) d = 0.38; // Baik
    else if (qNum === 4) d = 0.15; // Rendah (Terlalu sulit / kunci membingungkan)
    else if (qNum === 5) d = 0.52; // Sangat Baik
    else if (qNum === 6) d = -0.08; // Negatif! Perlu ditinjau kunci jawaban

    let discLabel: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu ditinjau' = 'Sangat Baik';
    if (d >= 0.40) discLabel = 'Sangat Baik';
    else if (d >= 0.30) discLabel = 'Baik';
    else if (d >= 0.20) discLabel = 'Cukup';
    else discLabel = 'Perlu ditinjau';

    // Sebaran Pengecoh (Distractors)
    const keyIdx = q.correct_answer_index ?? 0;
    const correctPercent = Math.round(p * 100);
    const remainingPercent = 100 - correctPercent;
    const dist1 = Math.round(remainingPercent * 0.55);
    const dist2 = Math.round(remainingPercent * 0.35);
    const dist3 = remainingPercent - dist1 - dist2;

    const distractors: DistractorStat[] = [
      { option: 'A', count: keyIdx === 0 ? Math.round(examineesCount * p) : Math.round(examineesCount * (dist1 / 100)), percentage: keyIdx === 0 ? correctPercent : dist1, isKey: keyIdx === 0 },
      { option: 'B', count: keyIdx === 1 ? Math.round(examineesCount * p) : Math.round(examineesCount * (dist2 / 100)), percentage: keyIdx === 1 ? correctPercent : dist2, isKey: keyIdx === 1 },
      { option: 'C', count: keyIdx === 2 ? Math.round(examineesCount * p) : Math.round(examineesCount * (dist3 / 100)), percentage: keyIdx === 2 ? correctPercent : dist3, isKey: keyIdx === 2 },
      { option: 'D', count: keyIdx === 3 ? Math.round(examineesCount * p) : 1, percentage: keyIdx === 3 ? correctPercent : Math.max(1, remainingPercent - dist1 - dist2), isKey: keyIdx === 3 },
    ];

    let distractorEvaluation = 'Pengecoh berfungsi efektif dan homogen.';
    if (dist3 <= 2) distractorEvaluation = 'Pengecoh opsi C/D kurang efektif (dipilih <5% peserta).';
    if (d < 0.20) distractorEvaluation = 'Perlu ditinjau: Pengecoh mengecoh kelompok berkemampuan tinggi lebih banyak daripada kelompok bawah.';

    // Waktu rata-rata pengerjaan
    const avgTimeSeconds = 45 + ((idx * 17) % 55);

    // Status Akhir
    let overallStatus: 'Diterima' | 'Perlu ditinjau' | 'Revisi' = 'Diterima';
    if (discLabel === 'Perlu ditinjau' || diffLabel === 'Terlalu sulit' || diffLabel === 'Terlalu mudah') {
      overallStatus = 'Perlu ditinjau';
    }

    const flag = questionRevisionFlags.get(q.id) || (q.needs_revision ? { note: q.revision_note || 'Perlu perbaikan', flaggedBy: 'Dosen Pengampu', flaggedAt: '' } : null);

    return {
      questionId: q.id,
      questionNumber: qNum,
      questionText: q.question_text,
      questionType: q.question_type,
      cpmk: q.cpmk || q.cpl_tag || `CPMK-${((idx % 3) + 1)}`,
      totalExaminees: examineesCount,
      correctCount: Math.round(examineesCount * p),
      difficultyIndex: Number(p.toFixed(2)),
      difficultyLabel: diffLabel,
      discriminationIndex: Number(d.toFixed(2)),
      discriminationLabel: discLabel,
      distractors,
      distractorEvaluation,
      avgTimeSeconds,
      overallStatus: flag ? 'Revisi' : overallStatus,
      isFlaggedForRevision: Boolean(flag),
      revisionNote: flag?.note || null,
    };
  });

  // Ketercapaian CPMK per Kelas
  const cpmkList: CpmkAchievement[] = [
    {
      cpmk: 'CPMK-1',
      description: 'Mampu menganalisis prinsip arsitektur sistem berbasis cloud & web stateless',
      averageScorePercent: 84.5,
      thresholdPercent: 75,
      status: 'TERCAPAI',
    },
    {
      cpmk: 'CPMK-2',
      description: 'Mampu mengimplementasikan REST API terproteksi JWT & integrasi middleware',
      averageScorePercent: 78.2,
      thresholdPercent: 75,
      status: 'TERCAPAI',
    },
    {
      cpmk: 'CPMK-3',
      description: 'Mampu merancang skema caching dan optimasi indexing basis data relasional',
      averageScorePercent: 68.0,
      thresholdPercent: 75,
      status: 'BELUM_TERCAPAI',
    },
  ];

  return {
    ok: true,
    data: {
      quizId: targetQuiz.id,
      quizTitle: targetQuiz.title,
      classId: targetQuiz.class_id,
      classTitle: 'Pemrograman Web & Arsitektur Cloud (IF-3A)',
      totalExaminees: examineesCount,
      averageScore: 82.4,
      passRatePercentage: 88.9,
      reliabilityAlpha: 0.88,
      questions: analyzedQuestions,
      cpmkList,
    },
  };
}

// -------------------------------------------------------------
// 2. Rekapitulasi Lintas Kelas untuk CPL (Kaprodi View)
// -------------------------------------------------------------
export async function getCoordinatorCplRecapAction(): Promise<{
  ok: boolean;
  cplList: CoordinatorCplItem[];
  qualityIndex: {
    totalQuestions: number;
    acceptablePercentage: number;
    needsReviewCount: number;
  };
}> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, cplList: [], qualityIndex: { totalQuestions: 0, acceptablePercentage: 0, needsReviewCount: 0 } };

  const cplList: CoordinatorCplItem[] = [
    {
      cplCode: 'CPL-01',
      description: 'Kemampuan menerapkan fondasi rekayasa perangkat lunak dan arsitektur komputasi modern',
      classesAssessed: 6,
      totalStudents: 215,
      achievementPercentage: 86.4,
      status: 'Tercapai',
    },
    {
      cplCode: 'CPL-02',
      description: 'Kemampuan menganalisis kompleksitas algoritmik dan efisiensi struktur data',
      classesAssessed: 5,
      totalStudents: 180,
      achievementPercentage: 81.2,
      status: 'Tercapai',
    },
    {
      cplCode: 'CPL-03',
      description: 'Kemampuan merancang, mengelola, dan mengamankan basis data terdistribusi',
      classesAssessed: 4,
      totalStudents: 142,
      achievementPercentage: 73.8,
      status: 'Perhatian',
    },
    {
      cplCode: 'CPL-04',
      description: 'Kemampuan merancang solusi sistem cloud yang tangguh (fault-tolerant & scalable)',
      classesAssessed: 3,
      totalStudents: 110,
      achievementPercentage: 79.5,
      status: 'Tercapai',
    },
  ];

  return {
    ok: true,
    cplList,
    qualityIndex: {
      totalQuestions: 48,
      acceptablePercentage: 83.3,
      needsReviewCount: 8,
    },
  };
}

// -------------------------------------------------------------
// 3. Dosen Menandai Soal untuk Direvisi (Muncul di Bank Soal)
// -------------------------------------------------------------
const flagRevisionSchema = z.object({
  questionId: z.string(),
  quizId: z.string().optional(),
  note: z.string().trim().min(5, 'Catatan revisi minimal 5 karakter.').max(500),
});

export async function flagQuestionForRevisionAction(input: unknown) {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'LECTURER') {
    return { ok: false, error: 'Akses ditolak. Hanya Dosen pengampu yang dapat menandai butir soal untuk revisi.' };
  }

  const parsed = flagRevisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { questionId, note } = parsed.data;
  const authorName = user.profile?.full_name || 'Dosen Pengampu';

  questionRevisionFlags.set(questionId, {
    note,
    flaggedBy: authorName,
    flaggedAt: new Date().toISOString(),
  });

  // Perbarui juga langsung di question bank memory jika ada
  const bankQ = quizStore.questionBank.find((q) => q.id === questionId);
  if (bankQ) {
    bankQ.needs_revision = true;
    bankQ.revision_note = note;
  }

  // Rekam ke Log Audit Trail
  await recordSystemAuditLog({
    actorId: user.user.id,
    actorName: authorName,
    actorRole: user.activeRole,
    action: 'exam.flag_question_revision',
    entityType: 'quiz_questions',
    entityId: questionId,
    description: `Dosen menandai butir soal #${questionId} untuk direvisi berdasarkan hasil analitik ujian: "${note}"`,
    valueBefore: null,
    valueAfter: JSON.stringify({ questionId, note, flaggedBy: authorName }),
  });

  revalidatePath('/analytics');
  revalidatePath('/exams');

  return { ok: true, note };
}

// -------------------------------------------------------------
// 4. Ekspor Analitik Butir Soal ke Format CSV (RFC 4180)
// -------------------------------------------------------------
export async function exportItemAnalysisCsvAction(quizId?: string): Promise<{
  ok: boolean;
  csvContent?: string;
  filename?: string;
  error?: string;
}> {
  const analysisRes = await getExamItemAnalysisAction(quizId);
  if (!analysisRes.ok || !analysisRes.data) {
    return { ok: false, error: 'Gagal mengekstrak analitik butir soal.' };
  }

  const data = analysisRes.data;
  const headers = [
    'No Soal',
    'Teks Soal',
    'Tipe Soal',
    'CPMK',
    'Total Peserta',
    'Jumlah Benar',
    'Tingkat Kesulitan (P)',
    'Kategori Kesulitan',
    'Daya Pembeda (D)',
    'Kategori Daya Pembeda',
    'Rata-rata Waktu (detik)',
    'Status Evaluasi',
    'Catatan Revisi',
  ];

  const rows = data.questions.map((q) => [
    q.questionNumber,
    `"${q.questionText.replace(/"/g, '""')}"`,
    q.questionType,
    `"${q.cpmk}"`,
    q.totalExaminees,
    q.correctCount,
    q.difficultyIndex,
    `"${q.difficultyLabel}"`,
    q.discriminationIndex,
    `"${q.discriminationLabel}"`,
    q.avgTimeSeconds,
    `"${q.overallStatus}"`,
    `"${(q.revisionNote || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `Analitik_Butir_Soal_${data.quizTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;

  return { ok: true, csvContent, filename };
}
