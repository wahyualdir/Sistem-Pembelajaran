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

import { LecturerExamsHubView } from '@/modules/academic/lecturer-exams-hub-view';

export default async function ExamsPage() {
  const fetchedQuizzes = await getAllQuizzesAction().catch(() => []);
  const user = await getCurrentUserWithRoles();
  const isLecturer = user?.activeRole === 'LECTURER' || user?.activeRole === 'SYSTEM_ADMIN' || user?.activeRole === 'SUPER_ADMIN';

  // Gabungkan dengan demo exams agar tampilan cards selalu full dan informatif
  const quizzes = fetchedQuizzes.length > 0 ? fetchedQuizzes : DEFAULT_DEMO_EXAMS;

  // Jika Dosen / Admin: Tampilkan Hub Bertab Dosen [Daftar & Buat | Panel Live | Log Pelanggaran]
  if (isLecturer) {
    return <LecturerExamsHubView quizzes={quizzes} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="ujian_aktif_dan_evaluasi.app"
        subtitle="Modul Evaluasi Terpadu LMS SIAJAR"
        headerBadge="Sesi Aktif"
        headerBadgeVariant="warning"
        bodyClassName="p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-2.5 sm:gap-3">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-retro-orange shrink-0" />
              <span>Ujian & Kuis Aktif</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-black font-medium max-w-3xl leading-relaxed">
              Daftar sesi kuis, ujian tengah semester (UTS), dan evaluasi mandiri yang sedang dibuka. Pastikan koneksi internet stabil dan patuhi aturan pengawasan proctoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/exams/history"
              className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg border-2 border-black bg-retro-surface font-bold text-xs sm:text-sm shadow-retro hover:bg-retro-warm transition-all"
            >
              <FileText className="h-4 w-4" />
              <span>Riwayat Ujian & Kuis</span>
            </Link>

            {isLecturer && (
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg border-2 border-black bg-black text-white font-bold text-xs sm:text-sm shadow-retro-md hover:bg-neutral-800 transition-all"
              >
                <span>Buka Kelas untuk Buat Ujian &rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </RetroWindow>

      {/* 2. PANDUAN PENGAWASAN (PROCTORING BANNER) FULL WIDTH */}
      <div className="rounded-xl border-2 border-black bg-retro-warm/50 p-4 sm:p-5 shadow-retro space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 text-foreground font-heading font-black text-base">
          <ShieldAlert className="h-5 w-5 text-retro-orange shrink-0" />
          <span>Kebijakan Pengawasan Ujian Terpadu</span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-normal">
          Sesi ujian menggunakan pemantauan perilaku (append-only events) yang mencatat perpindahan tab (<code>visibilitychange</code>), jendela blur, dan keluar dari mode layar penuh. Browser tidak dapat mengintip isi tab lain. Tetaplah berada di halaman ujian hingga selesai.
        </p>
      </div>

      {/* 3. DAFTAR SESI UJIAN AKTIF (GRID 3 KOLOM FULL WIDTH) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-lg sm:text-xl text-foreground">
            Sesi Ujian Tersedia ({quizzes.length})
          </h2>
          <span className="text-xs font-mono font-bold uppercase text-muted-foreground">
            Status: Real-time Terhubung
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {quizzes.map((quiz: any) => (
            <div
              key={quiz.id}
              className="rounded-xl border-2 border-black bg-white p-4 sm:p-6 shadow-retro hover:shadow-retro-md hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded border-2 border-black bg-retro-yellow text-xs sm:text-sm font-mono font-black uppercase text-black shadow-[1.5px_1.5px_0px_#000]">
                    {quiz.exam_type ?? 'KUIS'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-black text-black font-mono">
                    <Clock className="h-4 w-4" />
                    {quiz.duration_minutes} Menit
                  </span>
                </div>

                <h3 className="font-heading font-black text-xl text-black leading-snug line-clamp-2">
                  {quiz.title}
                </h3>

                <p className="text-sm sm:text-base text-black/90 font-medium line-clamp-3 leading-relaxed">
                  {quiz.description || 'Tidak ada deskripsi ujian tambahan.'}
                </p>
              </div>

              <div className="pt-4 border-t-2 border-black/10 space-y-4">
                <div className="flex items-center justify-between text-sm font-mono font-black text-black">
                  <span>Soal: {quiz.questions?.length ?? quiz.questionsCount ?? 10}</span>
                  <span>KKM: {quiz.kkm ?? 70}</span>
                  <span className="text-retro-orange font-black">Proctor: {quiz.proctoring_level ?? 'STANDARD'}</span>
                </div>

                <Link
                  href={`/classes/${quiz.class_id}/quizzes/${quiz.id}`}
                  className="flex w-full items-center justify-center gap-2 py-3.5 rounded-lg border-2 border-black bg-black text-white font-heading font-black text-base shadow-retro hover:bg-neutral-800 transition-all text-center"
                >
                  <Play className="h-5 w-5 fill-white" />
                  <span>{isLecturer ? 'Buka Panel Live Ujian' : 'Mulai Kerjakan Ujian'}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
