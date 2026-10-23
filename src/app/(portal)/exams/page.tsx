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
    title: 'Ujian Tengah Semester: Pemrograman Lanjut & Algoritma',
    description: 'UTS Resmi Semester Ganjil. Ujian ini diawasi dengan sistem proctoring standar. Harap aktifkan layar penuh dan hindari membuka tab lain.',
    exam_type: 'UTS',
    duration_minutes: 60,
    questionsCount: 15,
    kkm: 70,
    proctoring_level: 'STANDARD',
    due_at: '2026-10-28T15:00:00Z',
  },
  {
    id: 'quiz-demo-2',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Kuis Mingguan 04: Kompleksitas Algoritma & Rekursi',
    description: 'Kuis pemahaman materi struktur data: analisis kompleksitas Big-O notation, rekursi divide and conquer, serta manipulasi pointer.',
    exam_type: 'KUIS',
    duration_minutes: 30,
    questionsCount: 10,
    kkm: 70,
    proctoring_level: 'LIGHT',
    due_at: '2026-10-26T23:59:00Z',
  },
  {
    id: 'quiz-demo-3',
    class_id: 'c0000000-0000-0000-0000-000000000003',
    title: 'Latihan Mandiri: Normalisasi Database & Indexing B-Tree',
    description: 'Simulasi latihan soal mandiri tanpa batasan waktu dan percobaan. Skor dan pembahasan tampil instan untuk persiapan UTS/UAS.',
    exam_type: 'LATIHAN',
    duration_minutes: 45,
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

  // Gabungkan DEFAULT_DEMO_EXAMS dan fetchedQuizzes sehingga keempat kategori (Kuis, Latihan, UTS, UAS) selalu terwakili
  const itemsMap = new Map<string, any>();
  for (const q of DEFAULT_DEMO_EXAMS) {
    itemsMap.set(q.exam_type ?? q.id, q);
  }
  for (const q of fetchedQuizzes) {
    itemsMap.set(q.id, q);
  }
  const quizzes = isNew ? [] : Array.from(itemsMap.values());

  // Jika Dosen / Admin: Tampilkan Hub Bertab Dosen [Daftar & Buat | Panel Live | Log Pelanggaran]
  if (isLecturer) {
    return <LecturerExamsHubView quizzes={quizzes} isDemo={isDemoMode() && !isNew} />;
  }

  // Jika Mahasiswa: Tampilkan Pusat Evaluasi Terpadu [Semua | Kuis | Latihan | UTS | UAS]
  return <StudentExamsHubView initialQuizzes={quizzes} />;
}
