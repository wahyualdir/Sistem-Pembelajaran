'use client';

import { WindowTrafficLights } from '@/components/retro/window-traffic-lights';
import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Maximize2,
  Code2,
  Play,
  AlertTriangle,
  MessageSquare,
  Lock,
  Terminal,
} from 'lucide-react';
import {
  submitQuizAttemptAction,
  recordExamEventAction,
  executeLiveCodeAction,
  submitExamDisputeAction,
  type QuizItem,
  type QuizQuestion,
  type QuizAttempt,
} from '../quiz-actions';
import { Feedback } from '../class-forms';

// ==========================================
// TAKE QUIZ & EXAM FORM (MAHASISWA)
// ==========================================
export function TakeQuizForm({
  quiz,
  existingAttempt,
  courseTitle,
  hideHeaderWindow = false,
}: {
  quiz: QuizItem;
  existingAttempt: QuizAttempt | null;
  courseTitle?: string;
  hideHeaderWindow?: boolean;
}) {
  const router = useRouter();
  const [hasConsented, setHasConsented] = useState(false);
  const [passcodeEntered, setPasscodeEntered] = useState('');
  const [passcodeVerified, setPasscodeVerified] = useState(!quiz.passcode || hideHeaderWindow);
  const [answers, setAnswers] = useState<Record<string, any>>(existingAttempt?.answers ?? {});
  const [violations, setViolations] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningAlert, setWarningAlert] = useState<string | null>(null);

  // Live Coding testing state
  const [codeRunOutput, setCodeRunOutput] = useState<Record<string, string>>({});
  const [isRunningCode, setIsRunningCode] = useState<string | null>(null);

  // Dispute modal
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Countdown timer in seconds
  const [timeLeft, setTimeLeft] = useState(quiz.duration_minutes * 60);

  const handleSubmitAuto = useCallback(() => {
    startTransition(async () => {
      await submitQuizAttemptAction(quiz.id, answers, violations);
      router.refresh();
    });
  }, [quiz.id, answers, violations, router]);

  // Timer effect
  useEffect(() => {
    if (existingAttempt || !hasConsented || !passcodeVerified) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto submit when time runs out
          handleSubmitAuto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [existingAttempt, hasConsented, passcodeVerified, handleSubmitAuto]);

  // Fullscreen & Proctoring event listeners
  useEffect(() => {
    if (existingAttempt || !hasConsented || !passcodeVerified) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setViolations((v) => v + 1);
        setWarningAlert('Peringatan: Anda terdeteksi meninggalkan tab ujian!');
        recordExamEventAction({
          exam_id: quiz.id,
          event_type: 'TAB_SWITCH',
          details: 'Mahasiswa beralih tab atau meminimalkan jendela browser.',
        });
      }
    };

    const handleBlur = () => {
      recordExamEventAction({
        exam_id: quiz.id,
        event_type: 'WINDOW_BLUR',
        details: 'Fokus jendela ujian hilang.',
      });
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (quiz.block_copy_paste) {
        e.preventDefault();
        setWarningAlert('Penyalinan teks diblokir selama sesi ujian.');
        recordExamEventAction({
          exam_id: quiz.id,
          event_type: 'COPY',
          details: 'Mencoba menyalin teks.',
        });
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (quiz.block_copy_paste) {
        e.preventDefault();
        setWarningAlert('Penempelan teks dari luar diblokir.');
        recordExamEventAction({
          exam_id: quiz.id,
          event_type: 'PASTE',
          details: 'Mencoba menempel teks dari clipboard.',
        });
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (quiz.block_copy_paste) {
        e.preventDefault();
        recordExamEventAction({
          exam_id: quiz.id,
          event_type: 'CONTEXT_MENU',
          details: 'Membuka menu klik kanan.',
        });
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [existingAttempt, hasConsented, passcodeVerified, quiz.id, quiz.block_copy_paste]);

  const requestFullscreenMode = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      // Ignore if user rejects
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    startTransition(async () => {
      const res = await submitQuizAttemptAction(quiz.id, answers, violations);
      if (res.ok) {
        setSuccess('Jawaban ujian berhasil dikumpulkan!');
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setTimeout(() => router.refresh(), 1000);
      } else {
        setError(res.error ?? 'Gagal mengumpulkan ujian.');
      }
    });
  };

  const handleRunPublicTests = async (q: QuizQuestion) => {
    if (!q.test_cases || q.test_cases.length === 0) return;
    setIsRunningCode(q.id);
    const code = String(answers[q.id] ?? q.starter_code ?? '');
    const res = await executeLiveCodeAction(q.programming_language || 'javascript', code, q.test_cases);

    const publicResults = res.results.filter((r) => !r.is_hidden);
    const lines = publicResults.map(
      (r, idx) => `[Test #${idx + 1}] Input: ${r.input} => Output: ${r.actual_output} (${r.passed ? 'PASSED' : 'FAILED, Expected: ' + r.expected_output})`
    );

    setCodeRunOutput({
      ...codeRunOutput,
      [q.id]: lines.join('\n'),
    });
    setIsRunningCode(null);
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingAttempt) return;
    startTransition(async () => {
      const res = await submitExamDisputeAction(existingAttempt.id, disputeReason);
      if (res.ok) {
        setIsDisputeOpen(false);
        router.refresh();
      }
    });
  };

  // ==========================================
  // VIEW: IF ALREADY SUBMITTED
  // ==========================================
  if (existingAttempt) {
    const isPassed = existingAttempt.score >= (quiz.kkm ?? 70);

    const resultBody = (
      <div className="p-5 sm:p-7 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black/15 pb-5 gap-4">
          <div>
            {courseTitle && (
              <span className="text-xs sm:text-sm font-bold text-black/70 block mb-2">
                Mata Kuliah: <strong className="text-black">{courseTitle}</strong>
              </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-black bg-retro-mint border-2 border-black px-3 py-1 rounded shadow-retro-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Ujian Selesai Dikerjakan
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded border-2 border-black shadow-retro-sm ${isPassed ? 'text-black bg-gray-soft' : 'text-white bg-primary'}`}>
                {isPassed ? 'Memenuhi KKM' : 'Di Bawah KKM'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-black/80 font-medium mt-2">
              Dikumpulkan pada: {new Date(existingAttempt.submitted_at).toLocaleString('id-ID')} WIB
              {existingAttempt.violations_count ? ` • Catatan: ${existingAttempt.violations_count} anomali proctoring` : ''}
            </p>
          </div>
          <div className="text-left sm:text-right bg-gray-soft border-2 border-black p-4 rounded-xl shadow-retro">
            <span className="text-xs text-black/70 font-bold block">Nilai Perolehan Akhir</span>
            <div className="text-3xl sm:text-4xl font-bold font-sans text-black">
              {existingAttempt.score}
              <span className="text-sm sm:text-base font-normal text-black/60"> / {existingAttempt.max_score}</span>
            </div>
          </div>
        </div>

        {/* Dispute Status if submitted */}
        {existingAttempt.dispute && (
          <div className="p-4 rounded-xl border-2 border-black bg-gray-soft/50 text-xs sm:text-sm space-y-1.5 shadow-retro">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-black">
                <MessageSquare className="h-4 w-4 text-primary" /> Status Sengketa Nilai:
              </span>
              <span className="font-sans uppercase font-bold px-2 py-0.5 rounded border border-black bg-white text-black">
                {existingAttempt.dispute.status}
              </span>
            </div>
            <p className="text-black/80 font-medium">Alasan: {existingAttempt.dispute.reason}</p>
            {existingAttempt.dispute.lecturer_note && (
              <p className="text-black font-bold pt-1 border-t border-black/15">
                Tanggapan Dosen: {existingAttempt.dispute.lecturer_note}
              </p>
            )}
          </div>
        )}

        {/* Question Review */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-sm sm:text-base text-black">
              Review Hasil & Pembahasan Soal
            </h4>
            {!existingAttempt.dispute && (
              <button
                type="button"
                onClick={() => setIsDisputeOpen(true)}
                className="text-xs font-bold text-black hover:text-primary-dark flex items-center gap-1.5 border-2 border-black px-2.5 py-1 rounded bg-white shadow-retro hover:bg-gray-soft transition-all"
              >
                <HelpCircle className="h-3.5 w-3.5" /> Ajukan Sengketa Nilai
              </button>
            )}
          </div>

          {quiz.questions.map((q, idx) => {
            const myAns = existingAttempt.answers[q.id];
            const isCorrect =
              (q.question_type === 'MULTIPLE_CHOICE' && Number(myAns) === q.correct_answer_index) ||
              (q.question_type === 'TRUE_FALSE' && myAns === q.correct_boolean) ||
              (q.question_type === 'SHORT_ANSWER' && String(myAns).toLowerCase() === q.correct_text?.toLowerCase());

            const aiDraft = existingAttempt.ai_grading_drafts?.[q.id];

            return (
              <div key={q.id} className="rounded-xl border-2 border-black bg-white p-4 sm:p-5 space-y-3 text-sm shadow-retro">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold font-sans text-xs text-black/70">
                    Soal #{idx + 1} ({q.points} Poin) • <span className="font-sans text-xs font-bold">{q.question_type}</span>
                  </span>
                  {q.question_type !== 'ESSAY' && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded border border-black shadow-retro-sm ${
                        isCorrect ? 'text-black bg-retro-mint' : 'text-white bg-primary'
                      }`}
                    >
                      {isCorrect ? `Benar (+${q.points})` : 'Salah (0)'}
                    </span>
                  )}
                  {q.question_type === 'ESSAY' && aiDraft && (
                    <span className="text-xs font-bold text-black bg-gray-soft border border-black px-2.5 py-0.5 rounded">
                      Draf AI: +{aiDraft.ai_score} Poin {aiDraft.verified_by_lecturer ? '(Disahkan)' : '(Menunggu Review)'}
                    </span>
                  )}
                </div>

                <p className="font-bold text-sm sm:text-base text-black leading-relaxed">{q.question_text}</p>

                {q.question_type === 'MULTIPLE_CHOICE' && (
                  <div className="text-xs sm:text-sm text-black/80 space-y-1 pt-1">
                    <p>
                      Jawaban Anda:{' '}
                      <strong className="text-black bg-gray-soft px-2 py-0.5 rounded border border-black/30 font-bold">
                        {q.options?.[Number(myAns)] ?? '-'}
                      </strong>
                    </p>
                    {q.correct_answer_index !== undefined && (
                      <p className="text-black font-bold pt-0.5">
                        Kunci Jawaban:{' '}
                        <span className="bg-retro-mint/60 px-2 py-0.5 rounded border border-black/30">
                          {q.options?.[q.correct_answer_index]}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {q.question_type === 'TRUE_FALSE' && (
                  <p className="text-xs sm:text-sm text-black/80">
                    Jawaban Anda:{' '}
                    <strong className="text-black bg-gray-soft px-2 py-0.5 rounded border border-black/30 font-bold">
                      {String(myAns) === 'true' ? 'Benar' : 'Salah'}
                    </strong>
                  </p>
                )}

                {q.question_type === 'SHORT_ANSWER' && (
                  <div className="text-xs sm:text-sm text-black/80 space-y-1">
                    <p>
                      Jawaban Anda:{' '}
                      <strong className="text-black font-sans bg-gray-soft px-2 py-0.5 rounded border border-black/30">
                        {String(myAns ?? '-')}
                      </strong>
                    </p>
                    {q.correct_text && (
                      <p className="text-black font-bold">
                        Kunci:{' '}
                        <span className="font-sans bg-retro-mint/60 px-2 py-0.5 rounded border border-black/30">
                          {q.correct_text}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {q.question_type === 'LIVE_CODING' && (
                  <div className="rounded-lg border-2 border-black bg-black text-retro-mint p-3 text-xs font-sans whitespace-pre-wrap shadow-retro">
                    {String(myAns ?? '')}
                  </div>
                )}

                {q.question_type === 'ESSAY' && (
                  <div className="space-y-2 pt-1">
                    <div className="rounded-lg border-2 border-black bg-gray-soft/30 p-3 text-xs sm:text-sm text-black">
                      {String(myAns ?? '')}
                    </div>
                    {aiDraft && (
                      <p className="text-xs text-black/80 italic border-l-4 border-primary pl-3 py-1 bg-gray-soft/20 rounded-r">
                        Feedback AI: {aiDraft.feedback}
                      </p>
                    )}
                  </div>
                )}

                {q.explanation && (
                  <div className="mt-2 p-3 rounded-lg bg-gray-soft/40 text-xs sm:text-sm text-black border border-black/20">
                    <strong className="text-black font-bold">Pembahasan:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dispute Modal */}
        {isDisputeOpen && (
          <form onSubmit={handleDisputeSubmit} className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white space-y-3 shadow-retro">
            <h5 className="font-heading font-bold text-sm flex items-center gap-2 text-black">
              <HelpCircle className="h-4 w-4 text-primary" /> Pengajuan Sengketa / Klarifikasi Nilai
            </h5>
            <textarea
              rows={3}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Jelaskan alasan sengketa nilai secara akademis (mis. jawaban esai sesuai literatur, dsb)..."
              required
              className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-black font-sans"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 px-4 py-2 text-xs sm:text-sm font-bold shadow-retro transition-all"
              >
                Kirim Pengajuan
              </button>
              <button
                type="button"
                onClick={() => setIsDisputeOpen(false)}
                className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-bold text-black hover:bg-gray-soft shadow-retro transition-all"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    );

    if (hideHeaderWindow) {
      return (
        <div className="w-full rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro overflow-hidden transition-all animate-fade-up font-sans">
          {resultBody}
        </div>
      );
    }

    return (
      <div className="w-full rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro-md overflow-hidden transition-all animate-fade-up font-sans">
        {/* Retro Window Header Bar */}
        <div className="flex h-12 sm:h-14 items-center justify-between border-b-2 border-black bg-gray-soft px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <WindowTrafficLights size="sm" />
            <span className="text-sm sm:text-base font-bold text-black tracking-tight font-heading ml-1.5 truncate">
              Hasil Evaluasi: {quiz.title}
            </span>
          </div>
          <span
            className={`rounded border-2 border-black px-2.5 py-0.5 text-xs font-bold font-sans shadow-retro-sm shrink-0 ${
              isPassed ? 'bg-retro-mint text-black' : 'bg-primary text-white'
            }`}
          >
            {isPassed ? 'LULUS KKM' : 'DI BAWAH KKM'}
          </span>
        </div>
        {resultBody}
      </div>
    );
  }

  // ==========================================
  // VIEW: PRE-EXAM CONSENT & PASSCODE SCREEN
  // ==========================================
  if (!hasConsented || !passcodeVerified) {
    const cardBody = (
      <div className="p-5 sm:p-7 lg:p-8 space-y-6">
        {hideHeaderWindow ? (
          <div className="border-b-2 border-black/15 pb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-black flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-retro-mint border border-black inline-block" />
              Lembar Pengerjaan Mahasiswa · Tata Tertib & Ketentuan Ujian
            </span>
            <span className="text-xs font-sans font-bold text-black/60 bg-gray-soft px-2 py-0.5 rounded border border-black/20">
              Durasi: {quiz.duration_minutes} Menit · Total: {quiz.total_points} Poin
            </span>
          </div>
        ) : (
          <div className="border-b-2 border-black/15 pb-5 space-y-3">
            {courseTitle && (
              <span className="text-xs sm:text-sm font-bold text-black/70 block">
                Mata Kuliah: <strong className="text-black">{courseTitle}</strong>
              </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs font-bold bg-primary text-white px-2.5 py-1 rounded border-2 border-black shadow-retro-sm">
                {quiz.exam_type ?? 'UJIAN RESMI'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-black bg-gray-soft border-2 border-black/30 px-2.5 py-0.5 rounded font-sans">
                ⏱️ Durasi: {quiz.duration_minutes} Menit
              </span>
              {quiz.kkm && (
                <span className="text-xs sm:text-sm font-bold text-black bg-white border-2 border-black/30 px-2.5 py-0.5 rounded font-sans">
                  🎯 KKM: {quiz.kkm}
                </span>
              )}
              <span className="text-xs sm:text-sm font-bold text-black bg-white border-2 border-black/30 px-2.5 py-0.5 rounded font-sans">
                📊 Total: {quiz.total_points} Poin
              </span>
              <span className="text-xs sm:text-sm font-bold text-black bg-gray-soft border-2 border-black/30 px-2.5 py-0.5 rounded font-sans">
                🛡️ Pengawasan: {quiz.proctoring_level ?? 'STANDAR'}
              </span>
            </div>

            <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-black">
              {quiz.title}
            </h1>
            <p className="text-xs sm:text-sm text-black/80 font-medium leading-relaxed max-w-3xl">
              {quiz.description || 'Ujian resmi diawasi dengan sistem proctoring terpadu. Pastikan koneksi internet stabil dan patuhi ketentuan berikut.'}
            </p>
          </div>
        )}

        {/* Clean 4-Card Proctoring Rules Grid */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-sm sm:text-base text-black flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
            <span>Tata Tertib & Ketentuan Pengawasan (Proctoring)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3.5 rounded-lg border-2 border-black bg-gray-soft/60 shadow-retro">
              <Eye className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-black block">Fokus Jendela & Layar Penuh</span>
                <span className="text-xs text-black/75 font-medium leading-relaxed block">
                  Beralih tab browser atau keluar dari mode layar penuh akan dicatat otomatis ke log dosen.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-lg border-2 border-black bg-gray-soft/60 shadow-retro">
              <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-black block">Proteksi Integritas</span>
                <span className="text-xs text-black/75 font-medium leading-relaxed block">
                  Fitur salin-tempel (copy/paste) dan klik kanan dinonaktifkan demi integritas akademik.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-lg border-2 border-black bg-gray-soft/60 shadow-retro">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-black block">Sinkronisasi Waktu Server</span>
                <span className="text-xs text-black/75 font-medium leading-relaxed block">
                  Waktu pengerjaan dihitung akurat dari jam server, bukan jam perangkat lokal Anda.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-lg border-2 border-black bg-gray-soft/60 shadow-retro">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-black block">Penyimpanan Otomatis</span>
                <span className="text-xs text-black/75 font-medium leading-relaxed block">
                  Jawaban Anda disimpan otomatis ke server secara berkala selama ujian berlangsung.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Passcode Verification if required */}
        {quiz.passcode && !passcodeVerified && (
          <div className="rounded-xl border-2 border-black bg-white p-4 sm:p-5 shadow-retro space-y-2.5">
            <label className="block text-xs sm:text-sm font-bold text-black font-heading">
              Passcode Akses Ujian
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-md">
              <input
                type="password"
                value={passcodeEntered}
                onChange={(e) => setPasscodeEntered(e.target.value)}
                placeholder="Masukkan passcode dari dosen..."
                className="w-full rounded-lg border-2 border-black bg-white px-3.5 py-2 font-sans text-sm text-black shadow-retro focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={() => {
                  if (passcodeEntered.trim() === quiz.passcode?.trim()) {
                    setPasscodeVerified(true);
                    setError('');
                  } else {
                    setError('Passcode salah. Silakan tanyakan kepada dosen pengampu.');
                  }
                }}
                className="rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 px-5 py-2 text-xs sm:text-sm font-bold shadow-retro transition-all shrink-0"
              >
                Verifikasi Passcode
              </button>
            </div>
            {error && <p className="text-xs text-primary-dark font-bold">{error}</p>}
          </div>
        )}

        {/* Consent Checkbox */}
        <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-gray-soft/40">
          <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm font-bold text-black select-none leading-relaxed">
            <input
              type="checkbox"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-2 border-black text-black accent-black focus:ring-2 focus:ring-black shrink-0"
            />
            <span>
              Saya telah membaca, memahami, dan menyetujui seluruh tata tertib ujian serta mekanisme pemantauan sistem yang berlaku.
            </span>
          </label>
        </div>

        <div className="pt-3 border-t-2 border-black/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-black/60 font-sans hidden sm:inline-block">
            SIAJAR CBT Engine · Mode Aman Aktif
          </span>
          <button
            type="button"
            disabled={!hasConsented || !passcodeVerified}
            onClick={() => {
              if (quiz.require_fullscreen) {
                requestFullscreenMode();
              }
            }}
            className="w-full sm:w-auto rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed px-7 py-3 font-bold text-sm sm:text-base shadow-retro-md transition-all flex items-center justify-center gap-2.5"
          >
            <span>Mulai Mengerjakan Ujian</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );

    if (hideHeaderWindow) {
      return (
        <div className="w-full rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro overflow-hidden transition-all animate-fade-up font-sans">
          {cardBody}
        </div>
      );
    }

    return (
      <div className="w-full rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro-md overflow-hidden transition-all animate-fade-up font-sans">
        {/* Retro Window Header Bar */}
        <div className="flex h-12 sm:h-14 items-center justify-between border-b-2 border-black bg-gray-soft px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <WindowTrafficLights size="sm" />
            <span className="text-sm sm:text-base font-bold text-black tracking-tight font-heading ml-1.5 truncate">
              Lembar Pengerjaan: {quiz.title}
            </span>
          </div>
          <span className="rounded border-2 border-black bg-white px-2.5 py-0.5 text-xs font-bold font-sans text-black shadow-retro-sm shrink-0">
            {quiz.exam_type ?? 'UJIAN'}
          </span>
        </div>
        {cardBody}
      </div>
    );
  }

  // ==========================================
  // VIEW: ACTIVE EXAM IN PROGRESS
  // ==========================================
  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans">
      {/* Warning Alert if triggered */}
      {warningAlert && (
        <div className="rounded-xl border-2 border-ink bg-surface p-4 text-xs sm:text-sm text-primary-dark font-bold flex items-center justify-between shadow-retro">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {warningAlert}
          </span>
          <button
            type="button"
            onClick={() => setWarningAlert(null)}
            className="text-xs underline hover:opacity-80 font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Sticky Countdown & Status Bar */}
      <div className="sticky top-2 z-20 rounded-xl border-2 border-black bg-gray-soft/95 backdrop-blur px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-retro">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${timeLeft <= 300 ? 'text-primary-dark animate-pulse' : 'text-primary'}`} />
            <span className="text-xs sm:text-sm text-black font-bold">Sisa Waktu:</span>
            <span className={`font-sans text-base sm:text-lg font-bold ${timeLeft <= 300 ? 'text-primary-dark' : 'text-black'}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>
          {violations > 0 && (
            <span className="text-xs font-sans text-primary-dark bg-surface border border-ink px-2.5 py-0.5 rounded-full font-bold">
              {violations} Catatan Peringatan
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {quiz.require_fullscreen && !isFullscreen && (
            <button
              type="button"
              onClick={requestFullscreenMode}
              className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-soft font-bold flex items-center gap-1.5 text-black shadow-retro"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
            </button>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 px-5 py-2 text-xs sm:text-sm font-bold shadow-retro transition-all"
          >
            {pending ? 'Mengirim...' : 'Kumpulkan Ujian'}
          </button>
        </div>
      </div>

      {/* Question Items List */}
      <div className="space-y-6">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="rounded-xl border-2 border-black bg-white p-5 sm:p-7 space-y-4 shadow-retro">
            <div className="flex items-center justify-between border-b-2 border-black/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm font-sans bg-gray-soft border border-black/30 px-2.5 py-0.5 rounded text-black">Soal #{idx + 1}</span>
                <span className="text-xs text-black/70 uppercase font-sans font-bold">{q.question_type}</span>
              </div>
              <span className="text-xs sm:text-sm font-sans bg-gray-soft border border-black/30 px-2.5 py-0.5 rounded text-black font-bold">
                {q.points} Poin
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold text-black leading-relaxed whitespace-pre-wrap">
              {q.question_text}
            </p>

            {/* Multiple Choice */}
            {q.question_type === 'MULTIPLE_CHOICE' && q.options && (
              <div className="space-y-2.5 pt-1">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-lg border-2 border-black cursor-pointer text-sm font-bold transition-all shadow-retro ${
                      answers[q.id] === optIdx
                        ? 'bg-gray-soft text-black shadow-retro-md'
                        : 'bg-white hover:bg-gray-soft text-black'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      checked={answers[q.id] === optIdx}
                      onChange={() => setAnswers({ ...answers, [q.id]: optIdx })}
                      className="h-4 w-4 text-black accent-black"
                    />
                    <span className="font-sans text-xs font-bold w-4">{String.fromCharCode(65 + optIdx)}.</span>
                    <span className="text-xs sm:text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* True / False */}
            {q.question_type === 'TRUE_FALSE' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAnswers({ ...answers, [q.id]: true })}
                  className={`p-3.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold text-center shadow-retro transition-all ${
                    answers[q.id] === true
                      ? 'bg-gray-soft text-black shadow-retro-md'
                      : 'bg-white hover:bg-gray-soft text-black'
                  }`}
                >
                  BENAR (TRUE)
                </button>
                <button
                  type="button"
                  onClick={() => setAnswers({ ...answers, [q.id]: false })}
                  className={`p-3.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold text-center shadow-retro transition-all ${
                    answers[q.id] === false
                      ? 'bg-gray-soft text-black shadow-retro-md'
                      : 'bg-white hover:bg-gray-soft text-black'
                  }`}
                >
                  SALAH (FALSE)
                </button>
              </div>
            )}

            {/* Short Answer */}
            {q.question_type === 'SHORT_ANSWER' && (
              <div className="pt-1">
                <input
                  type="text"
                  value={String(answers[q.id] ?? '')}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Ketikkan jawaban singkat Anda di sini..."
                  className="w-full rounded-lg border-2 border-black bg-white px-3.5 py-2 font-sans text-sm text-black shadow-retro focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}

            {/* Essay */}
            {q.question_type === 'ESSAY' && (
              <div className="pt-1 space-y-2">
                <textarea
                  rows={5}
                  value={String(answers[q.id] ?? '')}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Tuliskan elaborasi jawaban uraian Anda secara sistematis..."
                  className="w-full rounded-lg border-2 border-black bg-white p-3.5 text-sm font-medium text-black shadow-retro focus:outline-none focus:ring-2 focus:ring-black leading-relaxed"
                />
                <div className="flex justify-between text-xs text-black/60 font-medium">
                  <span>Draf akan dianalisis oleh AI sebelum verifikasi dosen.</span>
                  <span className="font-sans font-bold">{String(answers[q.id] ?? '').split(/\s+/).filter(Boolean).length} kata</span>
                </div>
              </div>
            )}

            {/* Live Coding */}
            {q.question_type === 'LIVE_CODING' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                    <Code2 className="h-3.5 w-3.5" /> Editor ({q.programming_language})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRunPublicTests(q)}
                    disabled={isRunningCode === q.id}
                    className="rounded-lg border-2 border-black bg-white px-3 py-1 text-xs hover:bg-gray-soft font-sans font-bold flex items-center gap-1.5 text-black shadow-retro"
                  >
                    <Play className="h-3 w-3" /> {isRunningCode === q.id ? 'Menguji...' : 'Uji Test Case Publik'}
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={String(answers[q.id] ?? q.starter_code ?? '')}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full rounded-lg border-2 border-black p-3.5 text-xs font-sans bg-neutral-900 text-neutral-100 shadow-retro leading-relaxed"
                  spellCheck={false}
                />

                {/* Console Output Terminal */}
                {codeRunOutput[q.id] && (
                  <div className="rounded-lg border-2 border-black bg-gray-soft p-4 space-y-1.5 shadow-retro">
                    <div className="flex items-center gap-1.5 text-xs font-sans text-black font-bold">
                      <Terminal className="h-3.5 w-3.5" /> Hasil Uji Sandbox:
                    </div>
                    <pre className="text-xs font-mono text-black whitespace-pre-wrap leading-relaxed">
                      {codeRunOutput[q.id]}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t-2 border-black/15">
        <span className="text-xs text-black/70 font-sans font-bold">
          Status: Jawaban tersimpan otomatis ke server SIAJAR.
        </span>
        <button
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 disabled:opacity-50 px-8 py-3.5 text-sm sm:text-base font-bold shadow-retro-md transition-all"
        >
          {pending ? 'Mengirim Jawaban...' : 'Kumpulkan Seluruh Jawaban'}
        </button>
      </div>
      <Feedback error={error} success={success} tick={0} />
    </form>
  );
}
