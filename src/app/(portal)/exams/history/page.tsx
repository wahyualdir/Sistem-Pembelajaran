import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { getAllAttemptsAction, getAllQuizzesAction } from '@/modules/academic/quiz-actions';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export default async function ExamHistoryPage() {
  const attempts = await getAllAttemptsAction().catch(() => []);
  const quizzes = await getAllQuizzesAction().catch(() => []);
  const user = await getCurrentUserWithRoles();

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-5 sm:space-y-6 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="riwayat_evaluasi_kuis.app"
        badge="Rekap Evaluasi"
        headerClassName="bg-gray-soft"
        bodyClassName="p-4 sm:p-6 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 sm:p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
                Riwayat Ujian & Kuis
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black/80 font-medium max-w-2xl mt-1 leading-relaxed">
              Daftar seluruh ujian dan kuis yang telah Anda kerjakan, skor perolehan, pembahasan soal, dan status verifikasi penilaian essay/coding.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/exams"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black bg-white font-bold text-xs sm:text-sm shadow-retro hover:bg-gray-soft transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Ujian Aktif</span>
            </Link>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TABEL RIWAYAT PENGERJAAN */}
      <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
        <div className="p-3.5 sm:p-4 bg-gray-soft border-b-2 border-black flex items-center justify-between">
          <h2 className="font-heading font-bold text-sm sm:text-base text-black">
            Rekap Pengerjaan ({attempts.length})
          </h2>
          <span className="text-xs font-sans font-bold text-black/70">
            Sistem Skoring Otomatis
          </span>
        </div>

        {attempts.length === 0 ? (
          <div className="p-8 sm:p-10 text-center space-y-3">
            <div className="p-3 rounded-full border-2 border-black bg-gray-soft w-fit mx-auto shadow-xs">
              <Award className="h-7 w-7 text-black/70" />
            </div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-black">
              Belum Ada Riwayat Ujian
            </h3>
            <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto leading-relaxed font-medium">
              Anda belum menyelesaikan sesi ujian atau kuis. Silakan mulai pengerjaan dari menu Ujian Aktif.
            </p>
            <div className="pt-2">
              <Link
                href="/exams"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-black text-white text-xs sm:text-sm font-bold shadow-retro hover:bg-neutral-800 transition-all"
              >
                <span>Lihat Sesi Ujian</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-black bg-gray-soft text-xs font-sans font-bold uppercase text-black">
                <tr>
                  <th className="p-3.5 sm:p-4">Ujian / Kuis</th>
                  <th className="p-3.5 sm:p-4">Waktu Selesai</th>
                  <th className="p-3.5 sm:p-4">Skor / Poin</th>
                  <th className="p-3.5 sm:p-4">Pelanggaran</th>
                  <th className="p-3.5 sm:p-4">Status</th>
                  <th className="p-3.5 sm:p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {attempts.map((attempt) => {
                  const quiz = quizzes.find((q) => q.id === attempt.quiz_id);
                  const isPassed = attempt.score >= (quiz?.kkm ?? 70);

                  return (
                    <tr key={attempt.id} className="hover:bg-gray-soft/30 transition-colors font-medium">
                      <td className="p-3.5 sm:p-4 text-black">
                        <div className="font-heading font-bold text-sm sm:text-base">{quiz?.title ?? 'Sesi Ujian'}</div>
                        <div className="text-xs font-sans font-bold text-neutral-800 mt-0.5">
                          Tipe: {quiz?.exam_type ?? 'KUIS'} · KKM: {quiz?.kkm ?? 70}
                        </div>
                      </td>
                      <td className="p-3.5 sm:p-4 font-sans text-xs sm:text-sm font-bold text-neutral-900">
                        {new Date(attempt.submitted_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3.5 sm:p-4 font-sans font-bold text-sm sm:text-base">
                        <span className={isPassed ? 'text-black' : 'text-primary-dark'}>
                          {attempt.score}
                        </span>
                        <span className="text-xs font-bold text-neutral-700">
                          {' '}/ {attempt.max_score}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 font-sans text-xs sm:text-sm">
                        {(attempt.violations_count ?? 0) > 0 ? (
                          <span className="text-primary-dark font-bold">
                            {attempt.violations_count}x Terdeteksi
                          </span>
                        ) : (
                          <span className="text-neutral-800 font-bold">0 (Bersih)</span>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-sans font-bold border-2 border-black shadow-xs ${
                            isPassed ? 'bg-retro-mint text-black' : 'bg-gray-soft text-black'
                          }`}
                        >
                          {isPassed ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Lulus KKM
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Remedial
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-right">
                        {quiz && (
                          <Link
                            href={`/classes/${quiz.class_id}/quizzes/${quiz.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-black bg-gray-soft hover:bg-black hover:text-white font-heading font-bold text-xs sm:text-sm text-black shadow-xs transition-all"
                          >
                            <span>Detail Pembahasan</span>
                            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
