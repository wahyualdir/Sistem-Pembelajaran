import React from 'react';
import Link from 'next/link';
import {
  Award,
  Clock,
  ShieldAlert,
  Play,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { getAllQuizzesAction } from '@/modules/academic/quiz-actions';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

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
    due_at: '2026-10-15T15:00:00Z',
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
    due_at: '2026-10-12T23:59:00Z',
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
    due_at: '2026-10-20T23:59:00Z',
  },
];

import { redirect } from 'next/navigation';
import { isDemoMode } from '@/lib/config/features';
import { LecturerExamsHubView } from '@/modules/academic/lecturer-exams-hub-view';

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

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER BERANDA STYLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b-2 border-black/15 pb-4">
          <div className="space-y-0.5">
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-black flex items-center gap-2.5">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-black inline-block" />
              <span>Ujian & Kuis Aktif</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium">
              Daftar sesi kuis, ujian tengah semester (UTS), dan evaluasi mandiri yang sedang dibuka.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/exams/history"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black bg-white font-bold text-xs sm:text-sm text-black shadow-retro-sm hover:bg-gray-soft transition-all min-h-[44px]"
            >
              <FileText className="h-4 w-4" />
              <span>Riwayat Ujian & Kuis</span>
            </Link>

            {isLecturer && (
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-xs sm:text-sm shadow-retro hover:bg-neutral-800 transition-all min-h-[44px]"
              >
                <span>Buka Kelas untuk Buat Ujian &rarr;</span>
              </Link>
            )}

            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-gray-soft border-2 border-black text-black shadow-retro-sm">
              {quizzes.length} SESI TERSEDIA
            </span>
          </div>
        </div>

        {/* 2. PANDUAN PENGAWASAN (PROCTORING BANNER) */}
        <div className="rounded-xl border-2 border-black bg-white p-4 sm:p-5 shadow-retro space-y-2">
          <div className="flex items-center gap-2 text-black font-heading font-black text-sm sm:text-base">
            <ShieldAlert className="h-5 w-5 text-black shrink-0" />
            <span>Kebijakan Pengawasan Ujian Terpadu</span>
          </div>
          <p className="text-xs sm:text-sm text-black/75 leading-relaxed font-medium">
            Sesi ujian menggunakan pemantauan perilaku (append-only events) yang mencatat perpindahan tab (<code>visibilitychange</code>), jendela blur, dan keluar dari mode layar penuh. Browser tidak dapat mengintip isi tab lain. Tetaplah berada di halaman ujian hingga selesai.
          </p>
        </div>

        {/* 3. DAFTAR SESI UJIAN AKTIF */}
        <section aria-label="Daftar Sesi Ujian" className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
            <h2 className="font-heading font-black text-xl sm:text-2xl tracking-tight text-black flex items-center gap-2">
              <Award className="h-5 w-5 text-black inline-block" />
              <span>Sesi Ujian Tersedia ({quizzes.length})</span>
            </h2>
            <span className="text-xs font-mono font-bold uppercase text-black">
              Status: Real-time Terhubung
            </span>
          </div>

          {quizzes.length === 0 ? (
            <div className="p-10 sm:p-14 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 shadow-retro space-y-3">
              <Award className="h-10 w-10 sm:h-12 sm:w-12 text-black mx-auto" />
              <h3 className="text-base sm:text-lg font-heading font-black text-black">Belum Ada Sesi Ujian Aktif</h3>
              <p className="text-xs sm:text-sm text-black/75 font-medium max-w-md mx-auto leading-relaxed">
                Saat ini belum ada jadwal kuis atau ujian aktif untuk kelas perkuliahan Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {quizzes.map((quiz: any) => (
                <div
                  key={quiz.id}
                  className="rounded-2xl border-2 border-black bg-white p-4 sm:p-5 shadow-retro hover:shadow-retro-md hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-gray-soft border border-black text-black">
                        {quiz.exam_type ?? 'KUIS'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-black font-mono">
                        <Clock className="h-3.5 w-3.5 text-black" />
                        {quiz.duration_minutes} Menit
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-lg sm:text-xl text-black leading-snug line-clamp-2">
                      {quiz.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-black/75 font-medium line-clamp-3 leading-relaxed">
                      {quiz.description || 'Tidak ada deskripsi ujian tambahan.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t-2 border-black/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-black">
                      <span>Soal: {quiz.questions?.length ?? quiz.questionsCount ?? 10}</span>
                      <span>KKM: {quiz.kkm ?? 70}</span>
                      <span className="text-black font-bold">Proctor: {quiz.proctoring_level ?? 'STANDARD'}</span>
                    </div>

                    <Link
                      href={`/classes/${quiz.class_id}/quizzes/${quiz.id}`}
                      className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-xs sm:text-sm shadow-retro hover:bg-neutral-800 transition-all text-center min-h-[44px]"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>{isLecturer ? 'Buka Panel Live Ujian' : 'Mulai Kerjakan Ujian'}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
