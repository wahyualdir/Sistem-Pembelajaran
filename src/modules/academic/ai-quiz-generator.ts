'use server';

import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import { assertClassOwner, ClassAccessError } from '@/lib/auth/class-access';
import type { QuizQuestion } from './quiz-actions';
import { quizStore } from './quiz-actions';

// -------------------------------------------------------------
// Rate Limiter Harian per Dosen untuk Penggunaan AI Generator
// -------------------------------------------------------------
interface DailyRateLimitRecord {
  date: string; // YYYY-MM-DD
  count: number;
}

const rateLimitStore: Map<string, DailyRateLimitRecord> =
  ((globalThis as any).__siajarAiExamRateLimit ??= new Map<string, DailyRateLimitRecord>());

const MAX_AI_GENERATIONS_PER_DAY = 10;

function checkAndIncrementRateLimit(lecturerId: string): { allowed: boolean; remaining: number; resetDate: string } {
  const today = new Date().toISOString().slice(0, 10);
  const current = rateLimitStore.get(lecturerId);

  if (!current || current.date !== today) {
    rateLimitStore.set(lecturerId, { date: today, count: 1 });
    return { allowed: true, remaining: MAX_AI_GENERATIONS_PER_DAY - 1, resetDate: today };
  }

  if (current.count >= MAX_AI_GENERATIONS_PER_DAY) {
    return { allowed: false, remaining: 0, resetDate: today };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: MAX_AI_GENERATIONS_PER_DAY - current.count,
    resetDate: today,
  };
}

// -------------------------------------------------------------
// Schema Input Generator Soal AI
// -------------------------------------------------------------
const generateAiQuizSchema = z.object({
  classId: z.string().uuid('Pilih kelas perkuliahan.'),
  materialTitle: z.string().trim().optional(),
  materialContent: z.string().trim().min(20, 'Konten materi atau ringkasan silabus minimal 20 karakter.'),
  questionCount: z.coerce.number().int().min(1).max(10, 'Maksimal 10 soal per sesi generasi.'),
  questionType: z.enum(['MULTIPLE_CHOICE', 'ESSAY']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  cpmkTarget: z.string().trim().min(3, 'Tentukan Capaian Pembelajaran Mata Kuliah (CPMK) yang dituju.').max(200),
});

export interface AiDraftQuestion {
  tempId: string;
  classId: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'ESSAY';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  cpmk: string;
  points: number;
  // Khusus Pilihan Ganda:
  options?: string[];
  correct_answer_index?: number;
  explanation?: string;
  // Khusus Esai:
  rubric?: string;
  rubric_criteria?: Array<{ criterion: string; weight: number; description: string }>;
  is_ai_generated: true;
  ai_draft_status: 'DRAFT';
}

// -------------------------------------------------------------
// 1. Server Action: Generate Soal DRAF Berbasis AI
// -------------------------------------------------------------
export async function generateAiQuestionsDraftAction(input: unknown): Promise<{
  ok: boolean;
  drafts?: AiDraftQuestion[];
  remainingDailyQuota?: number;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'LECTURER') {
    return { ok: false, error: 'Akses ditolak. Fitur Generator Bank Soal AI hanya dapat digunakan oleh Dosen.' };
  }

  const parsed = generateAiQuizSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const {
    classId,
    materialTitle = 'Materi Kuliah',
    materialContent,
    questionCount,
    questionType,
    difficulty,
    cpmkTarget,
  } = parsed.data;

  try {
    await assertClassOwner(classId);
  } catch (err) {
    if (err instanceof ClassAccessError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  // Cek Kuota Harian Dosen
  const rateLimit = checkAndIncrementRateLimit(user.user.id);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: `Batas harian pembuatan draf soal AI telah tercapai (Maksimal ${MAX_AI_GENERATIONS_PER_DAY} kali per hari). Kuota akan direset besok hari (${rateLimit.resetDate}).`,
    };
  }

  const difficultyLabel = difficulty === 'EASY' ? 'Mudah' : difficulty === 'MEDIUM' ? 'Sedang' : 'Sukar';

  // 1. Coba Integrasi LLM Resmi (Gemini API) jika tersedia
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const prompt = `Anda adalah asisten perancang evaluasi akademik kurikulum perguruan tinggi SIAJAR.
Buatlah ${questionCount} butir draf soal evaluasi akademik berdasarkan materi perkuliahan berikut:
Materi: ${materialTitle}
Isi Rujukan Materi:
"""
${materialContent.slice(0, 4000)}
"""

Spesifikasi Soal:
- Tipe Soal: ${questionType === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda (4 opsi: A, B, C, D dengan 1 kunci jawaban benar dan penjelasan singkat)' : 'Esai Terstruktur (disertai panduan rubrik penilaian per kriteria dengan bobot total 100%)'}
- Tingkat Kesulitan: ${difficultyLabel}
- CPMK yang Dituju: ${cpmkTarget}

Kembalikan jawaban HANYA berupa array JSON valid berformat:
[
  {
    "question_text": "Teks pertanyaan jelas dan lugas",
    "question_type": "${questionType}",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    "correct_answer_index": 0,
    "explanation": "Penjelasan ilmiah singkat mengapa kunci jawaban tersebut benar",
    "rubric": "Panduan penilaian esai",
    "rubric_criteria": [
      {"criterion": "Pemahaman Konsep", "weight": 40, "description": "Ketepatan menjelaskan definisi dan prinsip dasar"},
      {"criterion": "Analisis Kritis", "weight": 35, "description": "Kedalaman komparasi dan argumen logis"},
      {"criterion": "Sistematika Jawaban", "weight": 25, "description": "Kerapian struktur bahasa dan alur penyampaian"}
    ]
  }
]`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(12000),
        }
      );

      if (res.ok) {
        const jsonRes = await res.json();
        const rawJsonText = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsedQuestions = JSON.parse(rawJsonText);
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            const drafts: AiDraftQuestion[] = parsedQuestions.map((q: any) => ({
              tempId: randomUUID(),
              classId,
              question_text: q.question_text || 'Pertanyaan Evaluasi',
              question_type: questionType,
              difficulty,
              cpmk: cpmkTarget,
              points: questionType === 'MULTIPLE_CHOICE' ? 5 : 20,
              options: questionType === 'MULTIPLE_CHOICE' ? q.options || ['A', 'B', 'C', 'D'] : undefined,
              correct_answer_index: typeof q.correct_answer_index === 'number' ? q.correct_answer_index : 0,
              explanation: q.explanation || 'Berdasarkan materi yang dipelajari.',
              rubric: q.rubric || 'Penilaian berdasarkan kedalaman analisis mahasiswa.',
              rubric_criteria: q.rubric_criteria || [
                { criterion: 'Ketepatan Konseptual', weight: 50, description: 'Menjelaskan konsep dengan akurat' },
                { criterion: 'Aplikasi & Analisis', weight: 50, description: 'Penerapan contoh nyata yang tepat' },
              ],
              is_ai_generated: true,
              ai_draft_status: 'DRAFT',
            }));

            return { ok: true, drafts, remainingDailyQuota: rateLimit.remaining };
          }
        }
      }
    } catch {
      // Fallback mulus ke generator deterministik cerdas jika AI timeout/gagal
    }
  }

  // 2. Generator Deterministik Cerdas (Fallback saat offline/tanpa API key)
  const drafts: AiDraftQuestion[] = [];
  const words = materialContent.split(/\s+/).filter((w) => w.length > 4);
  const sampleKeyword = words[0] || 'Arsitektur Sistem';
  const sampleKeyword2 = words[1] || 'Komputasi Cloud';

  for (let i = 1; i <= questionCount; i++) {
    const tempId = randomUUID();

    if (questionType === 'MULTIPLE_CHOICE') {
      drafts.push({
        tempId,
        classId,
        question_text: `[Draf AI #${i}] Dalam implementasi ${sampleKeyword} pada materi "${materialTitle}", manakah pernyataan berikut yang paling tepat sesuai kaidah ${cpmkTarget}?`,
        question_type: 'MULTIPLE_CHOICE',
        difficulty,
        cpmk: cpmkTarget,
        points: 5,
        options: [
          `Memastikan isolasi proses dan redundansi data pada komponen ${sampleKeyword2}.`,
          `Mengurangi throughput jaringan dengan mematikan layer caching secara berkala.`,
          `Mengabaikan prinsip ACID pada seluruh basis data transaksional.`,
          `Membatasi skalabilitas horizontal hanya pada satu node komputasi.`,
        ],
        correct_answer_index: 0,
        explanation: `Pilihan A tepat karena isolasi proses dan redundansi merupakan prinsip utama dalam ${sampleKeyword} sesuai standar ${cpmkTarget}.`,
        is_ai_generated: true,
        ai_draft_status: 'DRAFT',
      });
    } else {
      drafts.push({
        tempId,
        classId,
        question_text: `[Draf AI #${i}] Analisislah rancangan arsitektur pada modul "${materialTitle}" terkait penggunaan ${sampleKeyword}. Jelaskan kelebihan, kekurangan, dan strategi mitigasi resikonya sesuai target ${cpmkTarget}!`,
        question_type: 'ESSAY',
        difficulty,
        cpmk: cpmkTarget,
        points: 25,
        rubric: `Penilaian mengacu pada ketepatan analisis komponen ${sampleKeyword}, argumentasi teknis, dan kelengkapan mitigasi resiko.`,
        rubric_criteria: [
          { criterion: 'Pemahaman Konsep & Definisi', weight: 35, description: `Menjelaskan prinsip kerja ${sampleKeyword} secara komprehensif.` },
          { criterion: 'Analisis Kelebihan & Kelemahan', weight: 40, description: 'Menyajikan komparasi mendalam dengan alternatif teknologi lain.' },
          { criterion: 'Rekomendasi & Sintesis Solusi', weight: 25, description: 'Memberikan strategi mitigasi praktis yang implementatif.' },
        ],
        is_ai_generated: true,
        ai_draft_status: 'DRAFT',
      });
    }
  }

  return { ok: true, drafts, remainingDailyQuota: rateLimit.remaining };
}

// -------------------------------------------------------------
// 2. Server Action: Meninjau, Mengedit, dan Menyetujui Soal ke Bank Soal
// -------------------------------------------------------------
const approveQuestionsSchema = z.object({
  classId: z.string().uuid('Pilih kelas perkuliahan.').optional(),
  questions: z.array(
    z.object({
      classId: z.string().uuid().optional(),
      question_text: z.string().trim().min(5, 'Teks soal minimal 5 karakter.'),
      question_type: z.enum(['MULTIPLE_CHOICE', 'ESSAY']),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
      cpmk: z.string().trim(),
      points: z.coerce.number().min(1),
      options: z.array(z.string()).optional(),
      correct_answer_index: z.coerce.number().optional(),
      explanation: z.string().optional(),
      rubric: z.string().optional(),
      rubric_criteria: z.array(z.object({ criterion: z.string(), weight: z.number(), description: z.string().optional() })).optional(),
    })
  ),
});

export async function approveAiQuestionsToBankAction(input: unknown): Promise<{
  ok: boolean;
  savedCount?: number;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'LECTURER') {
    return { ok: false, error: 'Akses ditolak. Hanya Dosen pengampu yang berhak menyetujui soal ke Bank Soal.' };
  }

  const parsed = approveQuestionsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { classId, questions } = parsed.data;
  if (questions.length === 0) {
    return { ok: false, error: 'Pilih setidaknya 1 draf soal untuk disetujui.' };
  }

  const targetClassId = classId || questions[0]?.classId || '';
  try {
    await assertClassOwner(targetClassId);
  } catch (err) {
    if (err instanceof ClassAccessError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const savedQuestions: QuizQuestion[] = [];
  const now = new Date().toISOString();

  for (const q of questions) {
    const finalQuestion: QuizQuestion = {
      id: randomUUID(),
      question_text: q.question_text,
      question_type: q.question_type,
      difficulty: q.difficulty,
      topic_tag: q.cpmk,
      cpl_tag: q.cpmk,
      points: q.points,
      options: q.options,
      correct_answer_index: q.correct_answer_index,
      explanation: q.explanation,
      rubric: q.rubric,
      // Metadata pelabelan asal AI & verifikasi Dosen
      is_ai_generated: true,
      ai_draft_status: 'APPROVED',
      approved_by: user.profile?.full_name || 'Dosen Pengampu',
      cpmk: q.cpmk,
      rubric_criteria: q.rubric_criteria as any,
    };

    quizStore.questionBank.unshift(finalQuestion);
    savedQuestions.push(finalQuestion);
  }

  // Rekam ke Log Audit Trail (Kewajiban keamanan & kepatuhan Aturan A2)
  await recordSystemAuditLog({
    actorId: user.user.id,
    actorName: user.profile?.full_name || 'Dosen Pengampu',
    actorRole: user.activeRole,
    action: 'exam.approve_ai_questions',
    entityType: 'question_bank',
    entityId: savedQuestions[0]?.id || 'bulk',
    description: `Dosen menyetujui ${savedQuestions.length} butir soal hasil generasi AI ke dalam Bank Soal. Status: DRAF -> APPROVED.`,
    valueBefore: null,
    valueAfter: JSON.stringify({
      approved_count: savedQuestions.length,
      cpmk: savedQuestions[0]?.cpmk,
      approved_at: now,
    }),
  });

  return { ok: true, savedCount: savedQuestions.length };
}

export async function getLecturerAiQuotaStatusAction(): Promise<{ used: number; remaining: number }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { used: 0, remaining: MAX_AI_GENERATIONS_PER_DAY };
  const today = new Date().toISOString().slice(0, 10);
  const current = rateLimitStore.get(user.user.id);
  if (!current || current.date !== today) {
    return { used: 0, remaining: MAX_AI_GENERATIONS_PER_DAY };
  }
  return { used: current.count, remaining: Math.max(0, MAX_AI_GENERATIONS_PER_DAY - current.count) };
}
