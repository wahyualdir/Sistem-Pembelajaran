import React from 'react';
import { redirect } from 'next/navigation';
import { getAllQuizzesAction } from '@/modules/academic/quiz-actions';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { getHomeActiveClassesAction } from '@/modules/academic/home-actions';
import { LecturerExamsHubView } from '@/modules/academic/lecturer-exams-hub-view';
import { StudentExamsHubView } from '@/modules/academic/student-exams-hub-view';

export default async function ExamsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator/monitoring');
  }
  if (role === 'ACADEMIC_STAFF') {
    redirect('/staff');
  }

  const isNew = user?.isNewAccount ?? false;
  const fetchedQuizzes = isNew ? [] : await getAllQuizzesAction().catch(() => []);
  const isLecturer = role === 'LECTURER';

  // Mengambil daftar kelas aktif yang diampu/diambil mahasiswa saat ini (terhubung ke kurikulum UIR)
  const activeClasses = isNew ? [] : await getHomeActiveClassesAction().catch(() => []);

  // Menemukan kelas-kelas aktif mahasiswa untuk mengikat soal
  const classWeb = activeClasses.find((c) => c.code === 'STI2544138') || activeClasses[0];
  const classAlgo = activeClasses.find((c) => c.code === 'STI2543131') || activeClasses[1];
  const classDB = activeClasses.find((c) => c.code === 'STI2541114') || activeClasses[2];
  const classOS = activeClasses.find((c) => c.code === 'STI2543130') || activeClasses[3];

  // Evaluasi terikat langsung dengan kelas aktif mahasiswa
  const defaultBoundExams = [
    {
      id: `exam-${classWeb?.id || 'c0000000-0000-0000-0000-000000000001'}-uts`,
      class_id: classWeb?.id || 'c0000000-0000-0000-0000-000000000001',
      course_name: classWeb?.title || 'Pemrograman Web & Arsitektur Cloud',
      course_code: classWeb?.code || 'STI2544138',
      title: `Ujian Tengah Semester: ${classWeb?.title || 'Pemrograman Web & Arsitektur Cloud'}`,
      description: `Evaluasi tengah semester mata kuliah ${classWeb?.title || 'Pemrograman Web & Arsitektur Cloud'}. Mencakup Next.js App Router, Server Actions, dan otentikasi peran RBAC.`,
      exam_type: 'UTS',
      duration_minutes: 60,
      questionsCount: 15,
      kkm: 70,
      proctoring_level: 'STANDARD',
      due_at: '2026-10-28T15:00:00Z',
      schedule_info: '28 Okt 2026 · 15:00 WIB',
    },
    {
      id: `exam-${classAlgo?.id || 'c0000000-0000-0000-0000-000000000002'}-kuis`,
      class_id: classAlgo?.id || 'c0000000-0000-0000-0000-000000000002',
      course_name: classAlgo?.title || 'Algoritma & Struktur Data Lanjut',
      course_code: classAlgo?.code || 'STI2543131',
      title: 'Kuis Mingguan: Pohon Berimbang AVL & Kompleksitas Graf',
      description: `Kuis pemahaman materi pekan ke-4 mata kuliah ${classAlgo?.title || 'Algoritma & Struktur Data Lanjut'}: rotasi AVL Tree, algoritma Dijkstra, dan analisis asimtotik.`,
      exam_type: 'KUIS',
      duration_minutes: 30,
      questionsCount: 10,
      kkm: 70,
      proctoring_level: 'LIGHT',
      due_at: '2026-10-26T23:59:00Z',
      schedule_info: 'Tenggat: 26 Okt 2026 · 23:59 WIB',
    },
    {
      id: `exam-${classDB?.id || 'c0000000-0000-0000-0000-000000000003'}-latihan`,
      class_id: classDB?.id || 'c0000000-0000-0000-0000-000000000003',
      course_name: classDB?.title || 'Basis Data Terdistribusi & Big Data',
      course_code: classDB?.code || 'STI2541114',
      title: 'Latihan Mandiri: Normalisasi & Replikasi Multi-Region',
      description: `Simulasi latihan mandiri tanpa batasan waktu untuk pendalaman materi ${classDB?.title || 'Basis Data Terdistribusi & Big Data'}. Skor dan pembahasan keluar instan.`,
      exam_type: 'LATIHAN',
      duration_minutes: 45,
      questionsCount: 12,
      kkm: 65,
      proctoring_level: 'OFF',
      due_at: '2026-10-31T23:59:00Z',
      schedule_info: 'Akses Bebas · Pembahasan Instan',
    },
    {
      id: `exam-${classOS?.id || 'c0000000-0000-0000-0000-000000000001'}-uas`,
      class_id: classOS?.id || 'c0000000-0000-0000-0000-000000000001',
      course_name: classOS?.title || 'Sistem Operasi',
      course_code: classOS?.code || 'STI2543130',
      title: `Ujian Akhir Semester: ${classOS?.title || 'Sistem Operasi'}`,
      description: `Evaluasi akhir komprehensif semester ganjil mata kuliah ${classOS?.title || 'Sistem Operasi'}. Mencakup penjadwalan CPU, sinkronisasi semafor, dan memori virtual.`,
      exam_type: 'UAS',
      duration_minutes: 90,
      questionsCount: 20,
      kkm: 75,
      proctoring_level: 'STRICT',
      due_at: '2027-01-15T10:00:00Z',
      schedule_info: '15 Jan 2027 · 10:00 WIB',
    },
  ];

  // Memastikan soal yang ditampilkan terikat dengan kelas aktif
  const itemsMap = new Map<string, any>();
  for (const q of defaultBoundExams) {
    itemsMap.set(q.exam_type, q);
  }
  for (const q of fetchedQuizzes) {
    if (q.exam_type && itemsMap.has(q.exam_type)) {
      itemsMap.set(q.exam_type, {
        ...itemsMap.get(q.exam_type),
        ...q,
      });
    }
  }
  const quizzes = isNew ? [] : Array.from(itemsMap.values());

  // Jika Dosen / Admin: Tampilkan Hub Dosen
  if (isLecturer) {
    return <LecturerExamsHubView quizzes={quizzes} isDemo={isDemoMode() && !isNew} />;
  }

  // Jika Mahasiswa: Tampilkan Antarmuka Evaluasi Terpadu
  return <StudentExamsHubView initialQuizzes={quizzes} />;
}
