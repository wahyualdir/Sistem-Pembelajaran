'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config/features';

export interface PendingExamAnswerReview {
  id: string;
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_nim: string;
  quiz_id: string;
  quiz_title: string;
  class_id: string;
  class_title: string;
  question_id: string;
  question_type: 'ESSAY' | 'LIVE_CODING';
  question_text: string;
  max_points: number;
  essay_text?: string | null;
  submitted_code?: string | null;
  submitted_at: string;
  rubric_criteria?: Array<{
    id: string;
    title: string;
    max_score: number;
  }>;
}

const DEMO_EXAM_REVIEWS: PendingExamAnswerReview[] = [
  {
    id: 'ea-rev-001',
    attempt_id: 'att-001',
    student_id: 'mhs-1',
    student_name: 'Ahmad Mahasiswa',
    student_nim: '223510001',
    quiz_id: 'quiz-001',
    quiz_title: 'UTS Pemrograman Web & Arsitektur Cloud',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    class_title: 'Pemrograman Web (IF-3A)',
    question_id: 'qb-101',
    question_type: 'ESSAY',
    question_text: 'Jelaskan perbedaan mendasar antara arsitektur Monolithic vs Microservices terkait deployment, database coupling, dan fault isolation.',
    max_points: 25,
    essay_text: 'Pada arsitektur Monolitik, seluruh komponen aplikasi (UI, bisnis proses, data access) dikompilasi dan di-deploy sebagai satu kesatuan binari tunggal. Database biasanya bersifat shared database. Kerugian utamanya adalah single point of failure; jika satu modul memory leak, seluruh sistem crash. Sebaliknya, Microservices memecah domain bisnis menjadi layanan independen ber-database privat (Database per Service) yang berkomunikasi via HTTP/gRPC. Deployment dapat dilakukan per layanan tanpa downtime, dan kegagalan pada satu service tidak langsung melumpuhkan service lainnya.',
    submitted_at: new Date(Date.now() - 3600000).toISOString(),
    rubric_criteria: [
      { id: 'rc-1', title: 'Pemahaman Konsep Deployment & Binari', max_score: 10 },
      { id: 'rc-2', title: 'Analisis Database Coupling', max_score: 8 },
      { id: 'rc-3', title: 'Analisis Fault Isolation & Skalabilitas', max_score: 7 },
    ],
  },
  {
    id: 'ea-rev-002',
    attempt_id: 'att-002',
    student_id: 'mhs-2',
    student_name: 'Budi Kurniawan',
    student_nim: '223510018',
    quiz_id: 'quiz-002',
    quiz_title: 'Kuis Praktikum Algoritma & Struktur Data',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    class_title: 'Algoritma & Struktur Data (IF-3B)',
    question_id: 'qb-103',
    question_type: 'LIVE_CODING',
    question_text: 'Buatlah fungsi solusi(arr, target) yang mengembalikan pasangan indeks array yang jumlahnya sama dengan target menggunakan Hash Table O(n).',
    max_points: 30,
    submitted_code: `function solusi(arr, target) {
  const map = new Map();
  for (let i = 0; i < arr.length; i++) {
    const diff = target - arr[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(arr[i], i);
  }
  return [];
}`,
    submitted_at: new Date(Date.now() - 7200000).toISOString(),
    rubric_criteria: [
      { id: 'rc-4', title: 'Efisiensi Kompleksitas Waktu O(n)', max_score: 15 },
      { id: 'rc-5', title: 'Ketepatan Penanganan Edge Case & Output', max_score: 15 },
    ],
  },
];

export async function getPendingExamReviewsAction(): Promise<PendingExamAnswerReview[]> {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;
  if (role !== 'LECTURER' && role !== 'TEACHING_ASSISTANT' && role !== 'SUPER_ADMIN') {
    return [];
  }

  const isDemo = isDemoMode();
  if (isDemo) {
    return DEMO_EXAM_REVIEWS;
  }

  try {
    const supabase = await createClient();
    // Query answers where essay_text is not null and score_earned is null
    const { data: answers, error } = await supabase
      .from('exam_answers')
      .select('*, exam_attempts:attempt_id(*, quizzes:quiz_id(title, class_id, classes:class_id(title)), profiles:student_id(full_name)), quiz_questions:question_id(question_text, question_type, points)')
      .is('score_earned', null)
      .not('essay_text', 'is', null)
      .limit(50);

    if (error || !answers || answers.length === 0) {
      return DEMO_EXAM_REVIEWS;
    }

    return answers.map((a: any) => ({
      id: a.id,
      attempt_id: a.attempt_id,
      student_id: a.exam_attempts?.student_id || 'unknown',
      student_name: a.exam_attempts?.profiles?.full_name || 'Mahasiswa',
      student_nim: a.exam_attempts?.student_id || '-',
      quiz_id: a.exam_attempts?.quiz_id,
      quiz_title: a.exam_attempts?.quizzes?.title || 'Ujian CBT',
      class_id: a.exam_attempts?.quizzes?.class_id || '',
      class_title: a.exam_attempts?.quizzes?.classes?.title || 'Kelas Perkuliahan',
      question_id: a.question_id,
      question_type: a.quiz_questions?.question_type || 'ESSAY',
      question_text: a.quiz_questions?.question_text || '',
      max_points: a.quiz_questions?.points || 20,
      essay_text: a.essay_text,
      submitted_code: a.submitted_code,
      submitted_at: a.created_at || new Date().toISOString(),
    }));
  } catch {
    return DEMO_EXAM_REVIEWS;
  }
}

const gradeAnswerSchema = z.object({
  answerId: z.string().min(1),
  score: z.number().min(0).max(100),
  feedback: z.string().trim().max(1000).optional(),
});

export async function gradeExamAnswerAction(input: unknown) {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;
  if (role !== 'LECTURER' && role !== 'TEACHING_ASSISTANT' && role !== 'SUPER_ADMIN') {
    return { ok: false, error: 'Akses ditolak: Hanya Dosen atau Asisten berwenang memeriksa jawaban.' };
  }
  if (!user?.user) {
    return { ok: false, error: 'Sesi pengguna tidak valid.' };
  }

  const parsed = gradeAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input nilai tidak valid.' };
  }

  const { answerId, score, feedback } = parsed.data;
  const isDemo = isDemoMode();

  if (isDemo) {
    const idx = DEMO_EXAM_REVIEWS.findIndex((r) => r.id === answerId);
    if (idx >= 0) {
      DEMO_EXAM_REVIEWS.splice(idx, 1);
    }
    revalidatePath('/exams/review');
    return { ok: true, remaining: DEMO_EXAM_REVIEWS.length };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('exam_answers')
      .update({
        score_earned: score,
        feedback: feedback || null,
        graded_at: new Date().toISOString(),
        graded_by: user.user.id,
      })
      .eq('id', answerId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/exams/review');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Gagal menyimpan nilai jawaban.' };
  }
}
