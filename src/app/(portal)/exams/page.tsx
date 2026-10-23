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

  // Mengambil daftar kelas aktif yang diampu/diambil mahasiswa saat ini
  const activeClasses = isNew ? [] : await getHomeActiveClassesAction().catch(() => []);

  // Menemukan kelas-kelas aktif mahasiswa untuk mengikat soal
  const classWeb = activeClasses.find((c) => c.code === 'TI-301') || activeClasses[0];
  const classRPL = activeClasses.find((c) => c.code === 'TI-302') || activeClasses[1];
  const classAI = activeClasses.find((c) => c.code === 'TI-401') || activeClasses[2];
  const classDB = activeClasses.find((c) => c.code === 'TI-305') || activeClasses[3];

  // Evaluasi terikat langsung dengan kelas aktif mahasiswa (tanpa kata "resmi")
  const defaultBoundExams = [
    {
      id: `exam-${classWeb?.id || 'course-1'}-uts`,
      class_id: classWeb?.id || 'course-1',
      course_name: classWeb?.title || 'Pemrograman Web Lanjut',
      course_code: classWeb?.code || 'TI-301',
      title: `Ujian Tengah Semester: ${classWeb?.title || 'Pemrograman Web Lanjut'}`,
      description: `Evaluasi tengah semester mata kuliah ${classWeb?.title || 'Pemrograman Web Lanjut'}. Mencakup Next.js App Router, Server Actions, dan otentikasi peran RBAC.`,
      exam_type: 'UTS',
      duration_minutes: 60,
      questionsCount: 15,
      kkm: 70,
      proctoring_level: 'STANDARD',
      due_at: '2026-10-28T15:00:00Z',
      schedule_info: '28 Okt 2026 · 15:00 WIB',
    },
    {
      id: `exam-${classAI?.id || 'course-3'}-kuis`,
      class_id: classAI?.id || 'course-3',
      course_name: classAI?.title || 'Kecerdasan Buatan & Machine Learning',
      course_code: classAI?.code || 'TI-401',
      title: 'Kuis Mingguan: Jaringan Saraf Tiruan & Model Heuristik',
      description: `Kuis pemahaman materi pekan ke-4 mata kuliah ${classAI?.title || 'Kecerdasan Buatan & Machine Learning'}: neural networks, fungsi aktivasi, dan model komputasi.`,
      exam_type: 'KUIS',
      duration_minutes: 30,
      questionsCount: 10,
      kkm: 70,
      proctoring_level: 'LIGHT',
      due_at: '2026-10-26T23:59:00Z',
      schedule_info: 'Tenggat: 26 Okt 2026 · 23:59 WIB',
    },
    {
      id: `exam-${classDB?.id || 'course-4'}-latihan`,
      class_id: classDB?.id || 'course-4',
      course_name: classDB?.title || 'Basis Data Terdistribusi',
      course_code: classDB?.code || 'TI-305',
      title: 'Latihan Mandiri: Normalisasi & Replikasi Multi-Region',
      description: `Simulasi latihan mandiri tanpa batasan waktu untuk pendalaman materi ${classDB?.title || 'Basis Data Terdistribusi'}. Skor dan pembahasan keluar instan.`,
      exam_type: 'LATIHAN',
      duration_minutes: 45,
      questionsCount: 12,
      kkm: 65,
      proctoring_level: 'OFF',
      due_at: '2026-10-31T23:59:00Z',
      schedule_info: 'Akses Bebas · Pembahasan Instan',
    },
    {
      id: `exam-${classRPL?.id || 'course-2'}-uas`,
      class_id: classRPL?.id || 'course-2',
      course_name: classRPL?.title || 'Rekayasa Perangkat Lunak',
      course_code: classRPL?.code || 'TI-302',
      title: `Ujian Akhir Semester: ${classRPL?.title || 'Rekayasa Perangkat Lunak'}`,
      description: `Evaluasi akhir komprehensif semester ganjil mata kuliah ${classRPL?.title || 'Rekayasa Perangkat Lunak'}. Mencakup SDLC, metodologi Agile Scrum, dan clean architecture.`,
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
