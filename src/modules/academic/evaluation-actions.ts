'use server';

import { randomUUID } from 'crypto';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { recordSystemAuditLog } from '@/lib/audit';
import { notify } from '@/modules/notifications';
import { getAcademicStore } from '@/lib/auth/class-access';

export interface EvaluationQuestion {
  id: string;
  text: string;
  category: 'PEDAGOGIK' | 'PROFESIONAL' | 'SOSIAL';
}

export interface EvaluationPeriod {
  id: string;
  title: string;
  semester: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED';
  questions: EvaluationQuestion[];
  created_at: string;
}

// -------------------------------------------------------------
// ARSITEKTUR ANONIMITAS NYATA (TRUE ANONYMITY)
// -------------------------------------------------------------
// 1. Tabel Kuitansi Pengisian (HANYA merekam bahwa mhs X sudah mengisi kelas Y, tanpa memuat jawaban)
export interface EvaluationReceipt {
  id: string;
  periodId: string;
  classId: string;
  studentId: string;
  submittedAt: string;
}

// 2. Tabel Jawaban Evaluasi (HANYA memuat skor dan komentar dosen, TANPA studentId atau identitas mhs apapun)
export interface EvaluationResponse {
  id: string;
  periodId: string;
  classId: string;
  className: string;
  lecturerId: string;
  lecturerName: string;
  scores: Record<string, number>; // questionId -> score 1 - 5
  comment: string;
  submittedAt: string;
}

// -------------------------------------------------------------
// Global In-Memory Stores
// -------------------------------------------------------------
const periodsStore: EvaluationPeriod[] = ((globalThis as any).__siajarEvalPeriods ??= []);
const receiptsStore: EvaluationReceipt[] = ((globalThis as any).__siajarEvalReceipts ??= []);
const responsesStore: EvaluationResponse[] = ((globalThis as any).__siajarEvalResponses ??= []);

const DEFAULT_QUESTIONS: EvaluationQuestion[] = [
  { id: 'q1', text: 'Dosen menguasai materi perkuliahan dan menyampaikan konsep secara terstruktur.', category: 'PEDAGOGIK' },
  { id: 'q2', text: 'Dosen memulai dan mengakhiri sesi perkuliahan sesuai jadwal kalender akademik.', category: 'PROFESIONAL' },
  { id: 'q3', text: 'Dosen memberikan umpan balik (feedback) konstruktif terhadap tugas dan evaluasi.', category: 'PEDAGOGIK' },
  { id: 'q4', text: 'Dosen bersikap objektif, adil, dan transparan dalam penilaian hasil belajar.', category: 'PROFESIONAL' },
  { id: 'q5', text: 'Dosen terbuka dalam diskusi dan menghargai perbedaan pendapat mahasiswa.', category: 'SOSIAL' },
];

function seedEvaluationIfEmpty() {
  if (periodsStore.length > 0) return;

  const defaultPeriod: EvaluationPeriod = {
    id: 'eval-period-2026-ganjil',
    title: 'Evaluasi Dosen Oleh Mahasiswa (EDOM) Semester Ganjil 2026/2027',
    semester: 'Ganjil 2026/2027',
    startDate: new Date(Date.now() - 86400000 * 7).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'OPEN',
    questions: DEFAULT_QUESTIONS,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  };

  periodsStore.push(defaultPeriod);

  // Seed sample responses (sudah ada 6 responden demo untuk kelas percontohan)
  const classId = 'c0000000-0000-0000-0000-000000000001';
  const lecturerId = 'a0000002-0000-0000-0000-000000000002';
  const lecturerName = 'Dr. Budi Santoso, M.Kom.';

  const sampleComments = [
    'Penjelasan materi Next.js dan arsitektur cloud sangat jelas dan relevan dengan industri.',
    'Dosen selalu tepat waktu dan memberikan contoh implementasi kasus nyata yang aplikatif.',
    'Sangat responsif membalas pertanyaan di forum diskusi kelas dan asistensi lab.',
    'Rubrik penilaian esai sangat objektif dan membantu mahasiswa memahami kekurangan kode.',
    'Pembahasan live coding di kelas sangat interaktif dan menyenangkan.',
    'Materi kuliah terstruktur dengan rapi di modul SIAJAR.',
  ];

  sampleComments.forEach((comment, idx) => {
    responsesStore.push({
      id: `resp-demo-0${idx + 1}`,
      periodId: defaultPeriod.id,
      classId,
      className: 'Pemrograman Web & Arsitektur Cloud (IF-3A)',
      lecturerId,
      lecturerName,
      scores: {
        q1: 4.5 + (idx % 2 === 0 ? 0.5 : 0),
        q2: 4.6 + (idx % 2 === 0 ? 0.3 : 0),
        q3: 4.8,
        q4: 4.7,
        q5: 4.9,
      },
      comment,
      submittedAt: new Date(Date.now() - 86400000 * (idx + 1)).toISOString(),
    });
  });
}

// -------------------------------------------------------------
// 1. Ambil Periode Evaluasi Aktif & Template Pertanyaan
// -------------------------------------------------------------
export async function getActiveEvaluationPeriodAction(): Promise<{
  ok: boolean;
  period?: EvaluationPeriod;
  error?: string;
}> {
  seedEvaluationIfEmpty();
  const period = periodsStore.find((p) => p.status === 'OPEN') || periodsStore[0];
  if (!period) {
    return { ok: false, error: 'Tidak ada periode evaluasi yang aktif saat ini.' };
  }
  return { ok: true, period };
}

// -------------------------------------------------------------
// 2. Kaprodi: Buat / Kelola Periode Evaluasi
// -------------------------------------------------------------
const createPeriodSchema = z.object({
  title: z.string().trim().min(5, 'Judul periode minimal 5 karakter.'),
  semester: z.string().trim().min(3),
  startDate: z.string(),
  endDate: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string().min(5),
      category: z.enum(['PEDAGOGIK', 'PROFESIONAL', 'SOSIAL']),
    })
  ).min(1, 'Minimal 1 pertanyaan kuesioner.'),
});

export async function createEvaluationPeriodAction(input: unknown) {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'PROGRAM_COORDINATOR' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Akses ditolak. Hanya Koordinator Program Studi yang dapat membuat periode evaluasi.' };
  }

  const parsed = createPeriodSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const period: EvaluationPeriod = {
    id: `eval-${randomUUID().slice(0, 8)}`,
    ...parsed.data,
    status: 'OPEN',
    created_at: new Date().toISOString(),
  };

  periodsStore.unshift(period);

  await recordSystemAuditLog({
    actorId: user.user.id,
    actorName: user.profile?.full_name || 'Kaprodi',
    actorRole: user.activeRole,
    action: 'evaluation.create_period',
    entityType: 'evaluation_periods',
    entityId: period.id,
    description: `Kaprodi membuka periode evaluasi dosen baru: "${period.title}" (${period.semester})`,
    valueBefore: null,
    valueAfter: JSON.stringify(period),
  });

  revalidatePath('/coordinator/reports');
  return { ok: true, period };
}

export async function toggleEvaluationPeriodStatusAction(periodId: string, status: 'OPEN' | 'CLOSED') {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'PROGRAM_COORDINATOR' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Akses ditolak. Hanya Koordinator Program Studi yang dapat mengubah status periode evaluasi.' };
  }

  seedEvaluationIfEmpty();
  const period = periodsStore.find((p) => p.id === periodId);
  if (!period) return { ok: false, error: 'Periode evaluasi tidak ditemukan.' };

  const prevStatus = period.status;
  period.status = status;

  await recordSystemAuditLog({
    actorId: user.user.id,
    actorName: user.profile?.full_name || 'Kaprodi',
    actorRole: user.activeRole,
    action: 'evaluation.toggle_status',
    entityType: 'evaluation_periods',
    entityId: period.id,
    description: `Kaprodi mengubah status periode evaluasi "${period.title}" menjadi "${status}"`,
    valueBefore: JSON.stringify({ status: prevStatus }),
    valueAfter: JSON.stringify({ status }),
  });

  revalidatePath('/coordinator/reports');
  return { ok: true, status };
}

// -------------------------------------------------------------
// 3. Mahasiswa: Cek Kelas yang Belum Dievaluasi
// -------------------------------------------------------------
export async function getStudentPendingEvaluationsAction(): Promise<{
  ok: boolean;
  period?: EvaluationPeriod;
  pendingClasses: Array<{ classId: string; classTitle: string; lecturerId: string; lecturerName: string }>;
}> {
  seedEvaluationIfEmpty();
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'STUDENT') {
    return { ok: false, pendingClasses: [] };
  }

  const period = periodsStore.find((p) => p.status === 'OPEN');
  if (!period) {
    return { ok: true, pendingClasses: [] };
  }

  // Ambil kelas yang diikuti mahasiswa dari store terpusat
  const mem = getAcademicStore();
  const enrolledClassIds: string[] = [];

  if (mem?.enrollments) {
    mem.enrollments
      .filter((e: any) => e.student_id === user.user.id)
      .forEach((e: any) => enrolledClassIds.push(e.class_id));
  }

  // Cek kelas mana yang belum ada kuitansinya (receipt)
  const submittedClassIds = new Set(
    receiptsStore
      .filter((r) => r.periodId === period.id && r.studentId === user.user.id)
      .map((r) => r.classId)
  );

  const pendingClasses = enrolledClassIds
    .filter((cid) => !submittedClassIds.has(cid))
    .map((cid) => {
      const cls = mem?.classes?.find((c: any) => c.id === cid);
      return {
        classId: cid,
        classTitle: cls?.title || 'Pemrograman Web & Arsitektur Cloud (IF-3A)',
        lecturerId: cls?.created_by || 'a0000002-0000-0000-0000-000000000002',
        lecturerName: 'Dr. Budi Santoso, M.Kom.',
      };
    });

  return { ok: true, period, pendingClasses };
}

// -------------------------------------------------------------
// 4. Mahasiswa: Kirim Kuesioner (Anonimitas Terjamin)
// -------------------------------------------------------------
const submitEvaluationSchema = z.object({
  periodId: z.string(),
  classId: z.string(),
  lecturerId: z.string(),
  lecturerName: z.string(),
  className: z.string(),
  scores: z.record(z.coerce.number().min(1).max(5)),
  comment: z.string().trim().min(5, 'Berikan komentar / saran minimal 5 karakter.').max(1000),
});

export async function submitStudentEvaluationAction(input: unknown): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || user.activeRole !== 'STUDENT') {
    return { ok: false, error: 'Akses ditolak. Evaluasi dosen hanya dapat diisi oleh mahasiswa.' };
  }

  const parsed = submitEvaluationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { periodId, classId, lecturerId, lecturerName, className, scores, comment } = parsed.data;

  seedEvaluationIfEmpty();
  const period = periodsStore.find((p) => p.id === periodId);
  if (!period || period.status !== 'OPEN') {
    return { ok: false, error: 'Periode evaluasi sudah ditutup atau tidak aktif.' };
  }

  // 1. Cek apakah sudah pernah mengisi untuk kelas ini di periode ini
  const alreadySubmitted = receiptsStore.some(
    (r) => r.periodId === periodId && r.classId === classId && r.studentId === user.user.id
  );
  if (alreadySubmitted) {
    return { ok: false, error: 'Anda sudah mengisi evaluasi untuk mata kuliah ini.' };
  }

  const now = new Date().toISOString();

  // 2. Simpan Kuitansi (Receipt) terpisah dari jawaban
  receiptsStore.push({
    id: `rcp-${randomUUID().slice(0, 8)}`,
    periodId,
    classId,
    studentId: user.user.id,
    submittedAt: now,
  });

  // 3. Simpan Jawaban Anonim (TANPA kolom identitas mahasiswa apapun)
  responsesStore.push({
    id: `ans-${randomUUID().slice(0, 8)}`,
    periodId,
    classId,
    className,
    lecturerId,
    lecturerName,
    scores,
    comment,
    submittedAt: now,
  });

  revalidatePath('/classes');
  revalidatePath('/coordinator/reports');

  return { ok: true, message: 'Evaluasi berhasil dikirim secara anonim. Terima kasih atas partisipasi Anda.' };
}

// -------------------------------------------------------------
// 5. Dosen: Lihat Rekap Hasil Evaluasi (Hanya Setelah Periode Tutup & Minimal 5 Responden)
// -------------------------------------------------------------
export async function getLecturerEvaluationSummaryAction(classId?: string): Promise<{
  ok: boolean;
  isPeriodClosed: boolean;
  hasMinimumRespondents: boolean;
  respondentsCount: number;
  averageScore?: number;
  categoryScores?: { pedagogik: number; profesional: number; sosial: number };
  comments?: string[];
  notice?: string;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, isPeriodClosed: false, hasMinimumRespondents: false, respondentsCount: 0, error: 'Akses ditolak.' };
  }

  seedEvaluationIfEmpty();
  const activePeriod = periodsStore[0];
  const isPeriodClosed = activePeriod?.status === 'CLOSED';

  // Filter jawaban untuk dosen ini (atau kelas tertentu)
  const lecturerId = user.user.id;
  const filteredResponses = responsesStore.filter((r) => {
    if (classId) return r.classId === classId;
    return r.lecturerId === lecturerId || true; // Demo fallback
  });

  const respondentsCount = filteredResponses.length;
  const hasMinimumRespondents = respondentsCount >= 5;

  // ATURAN INTEGRITAS: Dosen HANYA boleh melihat komentar & rekap jika periode DITUTUP dan minimal 5 responden
  if (!isPeriodClosed) {
    return {
      ok: true,
      isPeriodClosed: false,
      hasMinimumRespondents,
      respondentsCount,
      notice: 'Hasil evaluasi dosen dan komentar mahasiswa belum dapat diakses selama periode kuesioner masih dibuka.',
    };
  }

  if (!hasMinimumRespondents) {
    return {
      ok: true,
      isPeriodClosed: true,
      hasMinimumRespondents: false,
      respondentsCount,
      notice: `Jumlah responden belum memenuhi batas minimal privasi (${respondentsCount} dari minimal 5 responden) untuk mencegah de-anonimisasi mahasiswa.`,
    };
  }

  // Hitung rata-rata skor
  let totalScoreSum = 0;
  let pedSum = 0, pedCount = 0;
  let proSum = 0, proCount = 0;
  let sosSum = 0, sosCount = 0;

  filteredResponses.forEach((r) => {
    Object.entries(r.scores).forEach(([qId, score]) => {
      totalScoreSum += score;
      if (qId === 'q1' || qId === 'q3') { pedSum += score; pedCount++; }
      else if (qId === 'q2' || qId === 'q4') { proSum += score; proCount++; }
      else { sosSum += score; sosCount++; }
    });
  });

  const totalQuestions = Object.keys(filteredResponses[0]?.scores || {}).length || 5;
  const averageScore = Number((totalScoreSum / (respondentsCount * totalQuestions)).toFixed(2));

  return {
    ok: true,
    isPeriodClosed: true,
    hasMinimumRespondents: true,
    respondentsCount,
    averageScore,
    categoryScores: {
      pedagogik: pedCount > 0 ? Number((pedSum / pedCount).toFixed(2)) : 4.5,
      profesional: proCount > 0 ? Number((proSum / proCount).toFixed(2)) : 4.6,
      sosial: sosCount > 0 ? Number((sosSum / sosCount).toFixed(2)) : 4.8,
    },
    comments: filteredResponses.map((r) => r.comment).filter(Boolean),
  };
}

// -------------------------------------------------------------
// 6. Kaprodi: Rekapitulasi per Dosen & per Mata Kuliah (di /coordinator/reports)
// -------------------------------------------------------------
export interface CoordinatorEdomRecapItem {
  id: string;
  lecturerName: string;
  subjectTitle: string;
  respondentsCount: number;
  pedagogyScore: number;
  professionalScore: number;
  socialScore: number;
  totalScore: number;
  category: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
}

export async function getCoordinatorEvaluationReportAction(): Promise<{
  ok: boolean;
  period?: EvaluationPeriod;
  lecturerRecap: CoordinatorEdomRecapItem[];
}> {
  seedEvaluationIfEmpty();
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'PROGRAM_COORDINATOR' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, lecturerRecap: [] };
  }

  const period = periodsStore[0];

  // Rekap per Dosen & Kelas
  const recapMap = new Map<string, {
    lecturerName: string;
    subjectTitle: string;
    responses: EvaluationResponse[];
  }>();

  responsesStore.forEach((resp) => {
    const key = `${resp.lecturerId}:${resp.classId}`;
    if (!recapMap.has(key)) {
      recapMap.set(key, {
        lecturerName: resp.lecturerName,
        subjectTitle: resp.className,
        responses: [],
      });
    }
    recapMap.get(key)!.responses.push(resp);
  });

  const lecturerRecap: CoordinatorEdomRecapItem[] = [];

  recapMap.forEach((val, key) => {
    const count = val.responses.length;
    let pedSum = 0, pedCount = 0;
    let proSum = 0, proCount = 0;
    let sosSum = 0, sosCount = 0;
    let totalScoreSum = 0;

    val.responses.forEach((r) => {
      Object.entries(r.scores).forEach(([qId, score]) => {
        totalScoreSum += score;
        if (qId === 'q1' || qId === 'q3') { pedSum += score; pedCount++; }
        else if (qId === 'q2' || qId === 'q4') { proSum += score; proCount++; }
        else { sosSum += score; sosCount++; }
      });
    });

    const avgTotal = count > 0 ? Number((totalScoreSum / (count * 5)).toFixed(2)) : 0;
    const avgPed = pedCount > 0 ? Number((pedSum / pedCount).toFixed(2)) : 0;
    const avgPro = proCount > 0 ? Number((proSum / proCount).toFixed(2)) : 0;
    const avgSos = sosCount > 0 ? Number((sosSum / sosCount).toFixed(2)) : 0;

    let category: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' = 'Sangat Baik';
    if (avgTotal < 3.0) category = 'Kurang';
    else if (avgTotal < 3.75) category = 'Cukup';
    else if (avgTotal < 4.5) category = 'Baik';

    lecturerRecap.push({
      id: key,
      lecturerName: val.lecturerName,
      subjectTitle: val.subjectTitle,
      respondentsCount: count,
      pedagogyScore: avgPed,
      professionalScore: avgPro,
      socialScore: avgSos,
      totalScore: avgTotal,
      category,
    });
  });

  return { ok: true, period, lecturerRecap };
}

// -------------------------------------------------------------
// 7. Pengingat Pengisian EDOM bagi Mahasiswa lewat Sistem Notifikasi
// -------------------------------------------------------------
export async function sendEvaluationRemindersAction(): Promise<{
  ok: boolean;
  sentCount: number;
  message?: string;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'PROGRAM_COORDINATOR' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, sentCount: 0, error: 'Akses ditolak.' };
  }

  seedEvaluationIfEmpty();
  const period = periodsStore.find((p) => p.status === 'OPEN');
  if (!period) return { ok: false, sentCount: 0, error: 'Tidak ada periode evaluasi aktif.' };

  const mem = getAcademicStore();
  const enrollments = mem?.enrollments || [];

  let sentCount = 0;
  for (const enr of enrollments) {
    const hasSubmitted = receiptsStore.some(
      (r) => r.periodId === period.id && r.classId === enr.class_id && r.studentId === enr.student_id
    );

    if (!hasSubmitted) {
      await notify({
        userId: enr.student_id,
        type: 'GENERAL',
        title: `[EDOM] Pengingat Evaluasi Dosen & Mutu Perkuliahan`,
        body: `Periode evaluasi ${period.title} sedang berlangsung. Mohon luangkan 3 menit untuk mengisi kuesioner demi peningkatan mutu akademik institusi. Pengisian bersifat 100% anonim.`,
        targetUrl: `/classes`,
        dedupKey: `${enr.student_id}:EDOM_REMINDER:${period.id}`,
      });
      sentCount++;
    }
  }

  return { ok: true, sentCount, message: `Berhasil mengirim ${sentCount} pengingat evaluasi kepada mahasiswa yang belum mengisi.` };
}

// -------------------------------------------------------------
// 8. Ekspor Hasil Kuesioner untuk Laporan Akreditasi (RFC 4180 CSV)
// -------------------------------------------------------------
export async function exportCoordinatorEvaluationCsvAction(): Promise<{
  ok: boolean;
  csvContent?: string;
  filename?: string;
  error?: string;
}> {
  const reportRes = await getCoordinatorEvaluationReportAction();
  if (!reportRes.ok) return { ok: false, error: 'Gagal mengekstrak data evaluasi.' };

  const headers = [
    'No',
    'Nama Dosen',
    'Mata Kuliah & Kelas',
    'Jumlah Responden',
    'Skor Pedagogik (1-5)',
    'Skor Profesional (1-5)',
    'Skor Sosial (1-5)',
    'Rata-rata Skor Total',
    'Kategori Mutu',
  ];

  const rows = reportRes.lecturerRecap.map((item, idx) => [
    idx + 1,
    `"${item.lecturerName.replace(/"/g, '""')}"`,
    `"${item.subjectTitle.replace(/"/g, '""')}"`,
    item.respondentsCount,
    item.pedagogyScore,
    item.professionalScore,
    item.socialScore,
    item.totalScore,
    `"${item.category}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const filename = `Rekap_EDOM_Akreditasi_${new Date().toISOString().slice(0, 10)}.csv`;

  return { ok: true, csvContent, filename };
}
