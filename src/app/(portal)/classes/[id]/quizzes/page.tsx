import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getClassDetailAction } from '@/modules/academic/actions';
import { listClassQuizzesAction, getMyQuizAttemptAction } from '@/modules/academic/quiz-actions';
import { CreateQuizModal } from '@/modules/academic/quiz-components';
import { HelpCircle, Clock, CheckCircle2, ArrowLeft, ArrowRight, Award } from 'lucide-react';

export default async function ClassQuizzesPage({ params }: { params: { id: string } }) {
  const detail = await getClassDetailAction(params.id);
  if (!detail) notFound();

  const userContext = await getCurrentUserWithRoles();
  const role = userContext?.activeRole ?? 'STUDENT';
  const isLecturer = role === 'LECTURER' || role === 'SYSTEM_ADMIN';

  const quizzes = await listClassQuizzesAction(params.id);

  return (
    <div className="w-full space-y-8 p-6 sm:p-9 animate-fade-up">
      <div>
        <p className="text-base text-muted-foreground flex items-center gap-1.5 mb-2">
          <Link href={`/classes/${params.id}`} className="hover:text-foreground flex items-center gap-1.5 font-medium">
            <ArrowLeft className="h-4 w-4" /> Kembali ke {detail.cls.title}
          </Link>
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-2.5">
              <Award className="h-7 w-7 text-primary" />
              Kuis & Ujian Kelas
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Kelas {detail.cls.section} — Ujian dan kuis berkala dengan penilaian otomatis & timer pengerjaan.
            </p>
          </div>

          {isLecturer && <CreateQuizModal classId={params.id} />}
        </div>
      </div>

      <section className="space-y-5">
        {quizzes.length === 0 ? (
          <div className="rounded-[3px] border-2 border-dashed border-border p-10 text-center text-base text-muted-foreground">
            {isLecturer
              ? 'Belum ada kuis yang diterbitkan. Klik "+ Buat Kuis Baru" di atas untuk menambahkan bank soal kuis.'
              : 'Dosen belum menerbitkan kuis atau ujian untuk kelas ini.'}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {await Promise.all(
              quizzes.map(async (q) => {
                const myAttempt = !isLecturer ? await getMyQuizAttemptAction(q.id) : null;
                const isClosed = Date.now() > Date.parse(q.due_at);

                return (
                  <div
                    key={q.id}
                    className="rounded-[3px] border-2 border-retro-border bg-surface p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-retro hover:shadow-retro-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-sm font-mono font-bold bg-muted text-muted-foreground px-3 py-1 rounded border border-border">
                          {q.questions.length} Soal · {q.total_points} Poin
                        </span>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-mono">
                          <Clock className="h-4 w-4" />
                          <span>{q.duration_minutes} Menit</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-lg sm:text-xl text-foreground line-clamp-1">{q.title}</h3>
                      {q.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{q.description}</p>
                      )}
                    </div>

                    <div className="pt-3.5 border-t-2 border-border flex items-center justify-between">
                      <div className="text-sm text-muted-foreground font-mono">
                        Tenggat: {new Date(q.due_at).toLocaleDateString('id-ID')}
                      </div>

                      {myAttempt ? (
                        <Link
                          href={`/classes/${params.id}/quizzes/${q.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-success hover:underline"
                        >
                          Nilai: {myAttempt.score}/{myAttempt.max_score} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : isClosed ? (
                        <span className="text-sm text-danger font-bold">Ditutup</span>
                      ) : (
                        <Link
                          href={`/classes/${params.id}/quizzes/${q.id}`}
                          className="btn-solid !w-auto !h-9 text-sm px-4 inline-flex items-center gap-1.5 font-bold"
                        >
                          {isLecturer ? 'Lihat Soal' : 'Kerjakan'} <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
}
