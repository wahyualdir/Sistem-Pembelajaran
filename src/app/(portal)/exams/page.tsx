import React from 'react';
import { redirect } from 'next/navigation';
import { getAllQuizzesAction } from '@/modules/academic/quiz-actions';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { LecturerExamsHubView } from '@/modules/academic/lecturer-exams-hub-view';
import { StudentExamsHubView } from '@/modules/academic/student-exams-hub-view';

const DEFAULT_DEMO_EXAMS = [
  {
    id: 'quiz-demo-1',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'UTS Praktikum: Arsitektur Backend & API (TI-301)',
    description: 'Evaluasi tengah semester mencakup 8 tipe soal: Pilihan Ganda, Benar/Salah, Isian Singkat, Essay ber-rubrik, dan Live Coding JavaScript.',
    exam_type: 'UTS',
    duration_minutes: 90,
    questionsCount: 15,
    kkm: 75,
    proctoring_level: 'STANDARD',
    due_at: '2026-10-28T15:00:00Z',
  },
  {
    id: 'quiz-demo-2',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Kuis Evaluasi Algoritma Sorting & Kompleksitas (TI-102)',
    description: 'Kuis mingguan algoritma QuickSort, MergeSort, analisis Big-O notation, dan manipulasi pointer C/C++.',
    exam_type: 'KUIS',
    duration_minutes: 45,
    questionsCount: 10,
    kkm: 70,
    proctoring_level: 'LIGHT',
    due_at: '2026-10-26T23:59:00Z',
  },
  {
    id: 'quiz-demo-3',
    class_id: 'c0000000-0000-0000-0000-000000000003',
    title: 'Latihan Mandiri: Normalisasi Database & Indexing (TI-204)',
    description: 'Simulasi ujian mandiri tanpa batas percobaan untuk persiapan UTS Sistem Basis Data.',
    exam_type: 'LATIHAN',
    duration_minutes: 60,
    questionsCount: 12,
    kkm: 65,
    proctoring_level: 'OFF',
    due_at: '2026-10-31T23:59:00Z',
  },
  {
    id: 'quiz-demo-4',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Ujian Akhir Semester: Rekayasa Perangkat Lunak & Sistem Terdistribusi',
    description: 'Evaluasi akhir komprehensif penentu kelulusan semester. Wajib memenuhi syarat presensi minimal 75% untuk verifikasi dan pembukaan sesi ujian.',
    exam_type: 'UAS',
    duration_minutes: 120,
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

  // Gabungkan dengan demo exams agar tampilan cards selalu full dan informatif HANYA untuk demo users
  const quizzes = isNew ? [] : fetchedQuizzes.length > 0 ? fetchedQuizzes : DEFAULT_DEMO_EXAMS;

  // Jika Dosen / Admin: Tampilkan Hub Bertab Dosen [Daftar & Buat | Panel Live | Log Pelanggaran]
  if (isLecturer) {
    return <LecturerExamsHubView quizzes={quizzes} isDemo={isDemoMode() && !isNew} />;
  }

  // Jika Mahasiswa: Tampilkan Pusat Evaluasi Terpadu [Semua | Kuis | Latihan | UTS | UAS]
  return <StudentExamsHubView initialQuizzes={quizzes} />;
}
