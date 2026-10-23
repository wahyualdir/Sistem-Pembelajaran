import React from 'react';
import { redirect } from 'next/navigation';
import { getAllQuizzesAction } from '@/modules/academic/quiz-actions';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { LecturerExamsHubView } from '@/modules/academic/lecturer-exams-hub-view';
import { StudentExamsHubView } from '@/modules/academic/student-exams-hub-view';

const DEFAULT_DEMO_EXAMS = [
  {
    id: 'quiz-demo-uts',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    course_name: 'Pemrograman Lanjut & Algoritma',
    course_code: 'TIF-301',
    title: 'Ujian Tengah Semester: Pemrograman Lanjut & Algoritma',
    description: 'Evaluasi resmi tengah semester. Mencakup live coding JavaScript, analisis Big-O, rekursi, dan manipulasi struktur data pointer.',
    exam_type: 'UTS',
    duration_minutes: 60,
    questionsCount: 15,
    kkm: 70,
    proctoring_level: 'STANDARD',
    due_at: '2026-10-28T15:00:00Z',
  },
  {
    id: 'quiz-demo-kuis',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    course_name: 'Struktur Data & Kompleksitas',
    course_code: 'TIF-102',
    title: 'Kuis Mingguan: Algoritma Sorting & Divide-and-Conquer',
    description: 'Kuis pemahaman materi pekan ke-4: QuickSort, MergeSort, analisis kompleksitas asimptotik, dan studi kasus algoritma rekursif.',
    exam_type: 'KUIS',
    duration_minutes: 30,
    questionsCount: 10,
    kkm: 70,
    proctoring_level: 'LIGHT',
    due_at: '2026-10-26T23:59:00Z',
  },
  {
    id: 'quiz-demo-latihan',
    class_id: 'c0000000-0000-0000-0000-000000000003',
    course_name: 'Sistem Basis Data Terdistribusi',
    course_code: 'TIF-204',
    title: 'Latihan Mandiri: Normalisasi Database & Indexing B-Tree',
    description: 'Simulasi latihan soal mandiri tanpa batasan waktu dan percobaan. Skor dan pembahasan tampil langsung untuk persiapan ujian.',
    exam_type: 'LATIHAN',
    duration_minutes: 45,
    questionsCount: 12,
    kkm: 65,
    proctoring_level: 'OFF',
    due_at: '2026-10-31T23:59:00Z',
  },
  {
    id: 'quiz-demo-uas',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    course_name: 'Rekayasa Perangkat Lunak & Cloud',
    course_code: 'TIF-401',
    title: 'Ujian Akhir Semester: Rekayasa Perangkat Lunak & Sistem Terdistribusi',
    description: 'Evaluasi akhir komprehensif semester ganjil. Mencakup perancangan sistem, microservices, database transactions, dan keamanan API.',
    exam_type: 'UAS',
    duration_minutes: 90,
    questionsCount: 20,
    kkm: 75,
    proctoring_level: 'STRICT',
    due_at: '2027-01-15T10:00:00Z',
  },
];

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

  // Memastikan tepat 4 evaluasi representatif (1 Kuis, 1 Latihan, 1 UTS, 1 UAS)
  const itemsMap = new Map<string, any>();
  for (const q of DEFAULT_DEMO_EXAMS) {
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
