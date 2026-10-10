import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getClassDetailAction } from '@/modules/academic/actions';
import { getQuizDetailAction, getMyQuizAttemptAction } from '@/modules/academic/quiz-actions';
import {
  TakeQuizForm,
  LecturerExamView,
  ExamAnalyticsModal,
} from '@/modules/academic/quiz-components';
import { ArrowLeft, Award } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

export default async function TakeQuizPage({
  params,
}: {
  params: { id: string; quizId: string };
}) {
  const detail = await getClassDetailAction(params.id);
  const quiz = await getQuizDetailAction(params.quizId);
  if (!detail || !quiz) notFound();

  const userContext = await getCurrentUserWithRoles();
  const role = userContext?.activeRole ?? 'STUDENT';
  const isLecturer = role === 'LECTURER' || role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN';

  const myAttempt = !isLecturer ? await getMyQuizAttemptAction(params.quizId) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 animate-fade-up font-sans">
      {/* 1. Bar Navigasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href={`/classes/${params.id}`}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black bg-white font-bold text-xs sm:text-sm text-black shadow-retro hover:bg-retro-warm transition-all w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke {detail.cls.title}</span>
        </Link>

        {isLecturer ? (
          <div className="flex items-center gap-2">
            <ExamAnalyticsModal examId={quiz.id} />
          </div>
        ) : (
          <span className="text-xs font-mono font-bold text-black/60 hidden sm:inline-block">
            SIAJAR CBT Engine v2.4
          </span>
        )}
      </div>

      {/* 2. Tampilan Sesuai Peran: Dosen (Monitoring & Preview) atau Mahasiswa (Lembar Ujian Mandiri) */}
      {isLecturer ? (
        <div className="space-y-6">
          <RetroWindow
            title={`pengawasan_ujian_${(quiz.exam_type ?? 'kuis').toLowerCase()}.app`}
            headerBadge="MODE PENGAWAS DOSEN"
            headerBadgeVariant="warning"
            subtitle="Pusat Pemantauan & Analisis Integritas Ujian SIAJAR"
            bodyClassName="p-5 sm:p-6"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border-2 border-black bg-retro-orange px-2.5 py-0.5 text-xs font-black font-mono text-white shadow-[1.5px_1.5px_0px_#000]">
                  {quiz.exam_type ?? 'KUIS'}
                </span>
                <span className="rounded border-2 border-black bg-retro-warm px-2.5 py-0.5 text-xs font-black font-mono text-black shadow-[1.5px_1.5px_0px_#000]">
                  Level Pengawasan: {quiz.proctoring_level ?? 'STANDAR'}
                </span>
                <span className="rounded border-2 border-black bg-white px-2.5 py-0.5 text-xs font-bold font-mono text-black shadow-[1.5px_1.5px_0px_#000]">
                  KKM: {quiz.kkm ?? 70}
                </span>
                <span className="rounded border-2 border-black bg-white px-2.5 py-0.5 text-xs font-bold font-mono text-black shadow-[1.5px_1.5px_0px_#000]">
                  Durasi: {quiz.duration_minutes} Menit
                </span>
                <span className="rounded border-2 border-black bg-white px-2.5 py-0.5 text-xs font-bold font-mono text-black shadow-[1.5px_1.5px_0px_#000]">
                  Total: {quiz.total_points} Poin
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-black flex items-center gap-2.5">
                <Award className="h-6 w-6 text-retro-orange shrink-0" />
                <span>{quiz.title}</span>
              </h1>

              <p className="text-xs sm:text-sm text-black/80 font-medium">
                Mata Kuliah: <strong className="text-black">{detail.cls.title}</strong>
                {quiz.description ? ` · ${quiz.description}` : ''}
              </p>
            </div>
          </RetroWindow>

          <LecturerExamView quiz={quiz} courseTitle={detail.cls.title} />
        </div>
      ) : (
        <TakeQuizForm quiz={quiz} existingAttempt={myAttempt} courseTitle={detail.cls.title} />
      )}
    </div>
  );
}
