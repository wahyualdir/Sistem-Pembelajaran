'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  Pin,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Tv,
  X,
  Volume2,
  BarChart3,
  User,
  Shield,
  Filter,
  Check,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WindowTrafficLights } from '@/components/retro/window-traffic-lights';
import { ClassLivePollCard } from './class-live-poll-card';
import {
  listLiveQuestionsAction,
  createLiveQuestionAction,
  toggleUpvoteLiveQuestionAction,
  updateLiveQuestionStatusAction,
  togglePinLiveQuestionAction,
  deleteLiveQuestionAction,
} from './live-interaction-actions';
import type {
  LiveQuestionItem,
  LiveQuestionFilter,
  LiveQuestionStatus,
} from './live-interaction-types';

interface ClassLiveInteractionViewProps {
  classId: string;
  currentUserRole: string;
  currentUserId?: string;
  isStaff: boolean;
}

export function ClassLiveInteractionView({
  classId,
  currentUserRole,
  currentUserId,
  isStaff,
}: ClassLiveInteractionViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'tanya' | 'kuis'>('tanya');
  const [questions, setQuestions] = useState<LiveQuestionItem[]>([]);
  const [filter, setFilter] = useState<LiveQuestionFilter>('semua');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input
  const [questionText, setQuestionText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Mode proyektor kelas
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  // Modal tanggapan dosen
  const [responseModalQuestion, setResponseModalQuestion] = useState<LiveQuestionItem | null>(null);
  const [responseText, setResponseText] = useState('');

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    const res = await listLiveQuestionsAction(classId, filter);
    if (res.ok) {
      setQuestions(res.questions);
    }
    setIsLoading(false);
  }, [classId, filter]);

  useEffect(() => {
    loadQuestions();
    // Auto-refresh setiap 12 detik selama kuliah berlangsung
    const interval = setInterval(loadQuestions, 12000);
    return () => clearInterval(interval);
  }, [loadQuestions]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const res = await createLiveQuestionAction({
      classId,
      question: questionText.trim(),
      isAnonymous,
    });

    setIsSubmitting(false);

    if (res.ok) {
      setQuestionText('');
      setFeedbackMsg({
        type: 'ok',
        text: 'Pertanyaan Anda berhasil dikirim ke ruang interaksi kelas.',
      });
      loadQuestions();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({
        type: 'err',
        text: res.error || 'Gagal mengirim pertanyaan.',
      });
    }
  };

  const handleToggleUpvote = async (qId: string) => {
    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const nextUpvoted = !q.has_upvoted;
          return {
            ...q,
            has_upvoted: nextUpvoted,
            upvotes_count: nextUpvoted ? q.upvotes_count + 1 : Math.max(0, q.upvotes_count - 1),
          };
        }
        return q;
      })
    );

    await toggleUpvoteLiveQuestionAction(qId, classId);
  };

  const handleStatusChange = async (qId: string, nextStatus: LiveQuestionStatus) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, status: nextStatus } : q))
    );
    await updateLiveQuestionStatusAction(qId, nextStatus, undefined, classId);
  };

  const handleTogglePin = async (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, is_pinned: !q.is_pinned } : q))
    );
    await togglePinLiveQuestionAction(qId, classId);
  };

  const handleSaveResponse = async () => {
    if (!responseModalQuestion) return;
    await updateLiveQuestionStatusAction(
      responseModalQuestion.id,
      'terjawab',
      responseText,
      classId
    );
    setResponseModalQuestion(null);
    setResponseText('');
    loadQuestions();
  };

  const handleDelete = async (qId: string) => {
    if (!confirm('Hapus pertanyaan ini dari ruang kelas?')) return;
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
    await deleteLiveQuestionAction(qId, classId);
  };

  // Cari pertanyaan yang sedang disematkan atau sedang dibahas untuk proyektor
  const pinnedOrActiveQuestion =
    questions.find((q) => q.is_pinned) ||
    questions.find((q) => q.status === 'dibahas') ||
    questions[0] ||
    null;

  return (
    <div className="space-y-6">
      {/* 1. HEADER RUANG INTERAKSI KELAS */}
      <div className="rounded-2xl border-2 border-black bg-yellow-pale shadow-retro-md p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <WindowTrafficLights size="md" />
              <span className="text-xs font-bold text-black uppercase tracking-wider bg-white px-2.5 py-0.5 rounded border border-black shadow-xs">
                Sesi Perkuliahan Langsung
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight flex items-center gap-2">
              <MessageSquare className="h-7 w-7 text-primary" />
              <span>Ruang Interaksi Kuliah</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 max-w-2xl font-normal leading-relaxed">
              Ajukan pertanyaan seputar materi yang sedang diterangkan, dukung pertanyaan teman yang
              juga belum dipahami, dan ikuti kuis kilat untuk menguji pemahaman materi kuliah.
            </p>
          </div>

          {/* Sub-Navigasi Antar Fitur Interaksi */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('tanya')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-black transition-all flex items-center gap-2 shadow-xs cursor-pointer',
                activeSubTab === 'tanya'
                  ? 'bg-black text-white shadow-retro'
                  : 'bg-white text-black hover:bg-gray-soft'
              )}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Tanya Jawab Kuliah</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('kuis')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-black transition-all flex items-center gap-2 shadow-xs cursor-pointer',
                activeSubTab === 'kuis'
                  ? 'bg-black text-white shadow-retro'
                  : 'bg-white text-black hover:bg-gray-soft'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Kuis Kilat & Polling</span>
            </button>

            {isStaff && (
              <button
                type="button"
                onClick={() => setIsProjectorMode(!isProjectorMode)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border-2 border-black bg-surface text-black hover:bg-white shadow-retro transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                title="Buka Tampilan Khusus Layar Proyektor Kelas"
              >
                <Tv className="h-4 w-4 text-primary" />
                <span>Mode Proyektor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MODE PROYEKTOR KELAS (PRESENTASI FOKUS UNTUK DOSEN) */}
      {isProjectorMode && isStaff && (
        <div className="rounded-2xl border-4 border-black bg-black text-white shadow-retro-lg p-6 sm:p-8 space-y-4 animate-fade-up">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-pale">
              <Tv className="h-4 w-4" />
              <span>Tampilan Proyektor Kelas Tatap Muka (Layar Fokus)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsProjectorMode(false)}
              className="text-xs bg-white text-black px-2.5 py-1 rounded font-bold hover:bg-gray-200"
            >
              Tutup Mode Proyektor
            </button>
          </div>

          {pinnedOrActiveQuestion ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-pale text-black text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                  {pinnedOrActiveQuestion.is_pinned ? 'Pertanyaan Disematkan' : 'Sedang Dibahas'}
                </span>
                <span className="text-xs text-white/70">
                  Diajukan oleh {pinnedOrActiveQuestion.student_name} &bull; Didukung {pinnedOrActiveQuestion.upvotes_count} mahasiswa
                </span>
              </div>

              <blockquote className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed text-white font-heading">
                &ldquo;{pinnedOrActiveQuestion.question}&rdquo;
              </blockquote>

              {pinnedOrActiveQuestion.lecturer_response && (
                <div className="p-4 rounded-xl border border-white/30 bg-white/10 text-xs sm:text-sm space-y-1">
                  <span className="font-bold text-yellow-pale block">Catatan Penjelasan Dosen:</span>
                  <p className="text-white/90 leading-relaxed">
                    {pinnedOrActiveQuestion.lecturer_response}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/70 py-4 text-center">
              Belum ada pertanyaan yang disematkan atau ditandai sedang dibahas.
            </p>
          )}
        </div>
      )}

      {/* 3. KONTEN SUB-TAB: KUIS KILAT & POLLING */}
      {activeSubTab === 'kuis' && (
        <div className="space-y-4 animate-fade-up">
          <ClassLivePollCard classId={classId} currentUserRole={currentUserRole} />
        </div>
      )}

      {/* 4. KONTEN SUB-TAB: TANYA JAWAB KULIAH */}
      {activeSubTab === 'tanya' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI: FORM KIRIM PERTANYAAN (UNTUK MAHASISWA & PENGAJAR) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border-2 border-black bg-white shadow-retro p-5 sm:p-6 space-y-4">
              <div className="border-b-2 border-black/10 pb-3">
                <h3 className="font-bold text-base text-black flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <span>Ajukan Pertanyaan</span>
                </h3>
                <p className="text-xs text-black/70 mt-1 font-normal">
                  Punya pertanyaan tentang konsep atau slide materi yang baru saja dijelaskan? Kirim di sini agar dibahas bersama.
                </p>
              </div>

              <form onSubmit={handleSubmitQuestion} className="space-y-3.5">
                <div>
                  <textarea
                    rows={4}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Tuliskan pertanyaan kuliah Anda secara jelas dan ringkas..."
                    className="w-full p-3 rounded-xl border-2 border-black text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none bg-neutral-50"
                  />
                  <div className="flex justify-between items-center text-[11px] text-black/60 mt-1">
                    <span>Minimal 5 karakter</span>
                    <span>{questionText.length}/500</span>
                  </div>
                </div>

                {/* Sakelar Anonim (Menjaga Keberanian Mahasiswa untuk Bertanya) */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-black/20 bg-gray-soft/40 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-2 border-black accent-black"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-black flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span>Kirim sebagai Mahasiswa Anonim</span>
                    </span>
                    <p className="text-[11px] text-black/65 font-normal leading-tight">
                      Nama asli Anda disamarkan dari rekan-rekan sekelas agar Anda dapat bertanya tanpa sungkan.
                    </p>
                  </div>
                </label>

                {feedbackMsg && (
                  <div
                    className={cn(
                      'p-3 rounded-xl border text-xs font-semibold',
                      feedbackMsg.type === 'ok'
                        ? 'bg-green-50 text-green-900 border-green-300'
                        : 'bg-red-50 text-red-900 border-red-300'
                    )}
                  >
                    {feedbackMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || questionText.trim().length < 5}
                  className="w-full py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-xs sm:text-sm shadow-retro hover:bg-neutral-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pertanyaan Kuliah'}</span>
                </button>
              </form>
            </div>

            {/* TIPS BERTANYA YANG BAIK */}
            <div className="p-4 rounded-xl border border-black/20 bg-surface/50 text-xs text-black/80 space-y-1.5">
              <span className="font-bold text-black flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Kiat Bertanya Efektif di Kelas</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-black/75 pl-1">
                <li>Sebutkan slide atau sub-bab yang membingungkan.</li>
                <li>Dukung pertanyaan rekan sekelas yang memiliki kebingungan serupa.</li>
                <li>Dosen akan memilih pertanyaan paling banyak didukung untuk diulas di kelas.</li>
              </ul>
            </div>
          </div>

          {/* KOLOM KANAN: DAFTAR PERTANYAAN WAKTU NYATA */}
          <div className="lg:col-span-7 space-y-4">
            {/* BILAH FILTER & REFRESH */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border-2 border-black bg-white shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs font-bold text-black/70 flex items-center gap-1 mr-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Status:</span>
                </span>
                {(['semua', 'antre', 'dibahas', 'terjawab'] as LiveQuestionFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold transition-all border border-black/20 capitalize',
                      filter === f
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-black/70 hover:bg-neutral-200'
                    )}
                  >
                    {f === 'semua'
                      ? 'Semua'
                      : f === 'antre'
                      ? 'Menunggu'
                      : f === 'dibahas'
                      ? 'Sedang Dibahas'
                      : 'Terjawab'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={loadQuestions}
                disabled={isLoading}
                className="text-xs font-bold text-black/80 hover:text-black flex items-center gap-1 cursor-pointer"
                title="Segarkan daftar pertanyaan"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                <span>{isLoading ? 'Memuat...' : 'Segarkan'}</span>
              </button>
            </div>

            {/* DAFTAR PERTANYAAN */}
            {questions.length === 0 ? (
              <div className="rounded-2xl border-2 border-black border-dashed bg-white p-8 sm:p-12 text-center space-y-2">
                <div className="h-12 w-12 rounded-full border-2 border-black bg-yellow-pale flex items-center justify-center mx-auto text-black shadow-xs">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-sm text-black">Belum Ada Pertanyaan di Kelas Ini</h4>
                <p className="text-xs text-black/65 max-w-sm mx-auto">
                  Jadilah yang pertama mengajukan pertanyaan materi. Pertanyaan Anda akan tampil di
                  layar perkuliahan.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {questions.map((q) => {
                  const isPinned = q.is_pinned;
                  const isBeingDiscussed = q.status === 'dibahas';
                  const isAnswered = q.status === 'terjawab';

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'rounded-2xl border-2 border-black p-4 sm:p-5 transition-all shadow-retro relative',
                        isPinned
                          ? 'bg-yellow-pale/40 border-amber-600 ring-2 ring-amber-500/30'
                          : isBeingDiscussed
                          ? 'bg-blue-50/70 border-blue-600'
                          : isAnswered
                          ? 'bg-neutral-50/80 border-black/30'
                          : 'bg-white'
                      )}
                    >
                      {/* PITA STATUS DISEMATKAN */}
                      {isPinned && (
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-400 w-fit">
                          <Pin className="h-3 w-3 rotate-45" />
                          <span>Sedang Ditayangkan di Layar Kelas</span>
                        </div>
                      )}

                      {/* BARIS ATAS: NAMA PENANYA & BADGE STATUS */}
                      <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-2 mb-2.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={cn(
                              'font-bold truncate max-w-[200px]',
                              q.is_anonymous ? 'text-black/75 italic' : 'text-black'
                            )}
                          >
                            {q.student_name}
                          </span>
                          <span className="text-black/40 text-[11px]">&bull;</span>
                          <span className="text-black/50 text-[11px] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(q.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              WIB
                            </span>
                          </span>
                        </div>

                        {/* BADGE STATUS ALAMI */}
                        <div>
                          {isBeingDiscussed ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-blue-500 bg-blue-100 text-blue-900 flex items-center gap-1 animate-pulse">
                              <Volume2 className="h-3 w-3" />
                              <span>Sedang Dibahas</span>
                            </span>
                          ) : isAnswered ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded border border-green-500 bg-green-100 text-green-900 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Selesai Dijawab</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-black/20 bg-neutral-100 text-black/70">
                              Menunggu Giliran
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ISI PERTANYAAN */}
                      <p className="text-xs sm:text-sm font-semibold text-black leading-relaxed mb-3">
                        {q.question}
                      </p>

                      {/* TANGGAPAN / CATATAN JAWABAN DOSEN */}
                      {q.lecturer_response && (
                        <div className="p-3 rounded-xl border border-black/20 bg-surface/70 text-xs space-y-1 mb-3">
                          <span className="font-bold text-black flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-primary" />
                            <span>Catatan Jawaban Dosen Pengampu:</span>
                          </span>
                          <p className="text-black/80 font-normal leading-relaxed pl-5">
                            {q.lecturer_response}
                          </p>
                        </div>
                      )}

                      {/* BARIS BAWAH: TOMBOL DUKUNGAN (UPVOTE) & AKSI DOSEN */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/10">
                        {/* Tombol Upvote */}
                        <button
                          type="button"
                          onClick={() => handleToggleUpvote(q.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs',
                            q.has_upvoted
                              ? 'border-black bg-primary text-black'
                              : 'border-black bg-white hover:bg-gray-soft text-black/80'
                          )}
                          title="Dukung jika Anda memiliki kebingungan yang sama"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{q.upvotes_count}</span>
                          <span className="text-[11px] font-medium hidden sm:inline">
                            {q.has_upvoted ? 'Didukung oleh Anda' : 'Saya Ingin Tahu'}
                          </span>
                        </button>

                        {/* Tombol Kontrol Pengajar */}
                        <div className="flex items-center gap-1.5">
                          {isStaff && (
                            <>
                              {q.status !== 'dibahas' && q.status !== 'terjawab' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(q.id, 'dibahas')}
                                  className="text-[11px] font-bold px-2 py-1 rounded border border-black bg-blue-100 hover:bg-blue-200 text-blue-900 cursor-pointer"
                                  title="Tandai dosen sedang membahas pertanyaan ini secara lisan"
                                >
                                  Bahas Sekarang
                                </button>
                              )}

                              {q.status !== 'terjawab' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(q.id, 'terjawab')}
                                  className="text-[11px] font-bold px-2 py-1 rounded border border-black bg-green-100 hover:bg-green-200 text-green-900 cursor-pointer"
                                  title="Tandai pertanyaan telah selesai dijawab"
                                >
                                  Tandai Selesai
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleTogglePin(q.id)}
                                className={cn(
                                  'p-1.5 rounded border border-black text-xs cursor-pointer',
                                  q.is_pinned
                                    ? 'bg-amber-300 text-black'
                                    : 'bg-white hover:bg-gray-soft text-black/70'
                                )}
                                title={q.is_pinned ? 'Lepas sematan' : 'Sematkan ke layar kelas'}
                              >
                                <Pin className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setResponseModalQuestion(q);
                                  setResponseText(q.lecturer_response || '');
                                }}
                                className="text-[11px] font-bold px-2 py-1 rounded border border-black bg-white hover:bg-gray-soft text-black cursor-pointer"
                                title="Tulis catatan jawaban ringkas"
                              >
                                Catat Jawaban
                              </button>
                            </>
                          )}

                          {/* Tombol Hapus (khusus pembuat atau dosen) */}
                          {(q.is_mine || isStaff) && (
                            <button
                              type="button"
                              onClick={() => handleDelete(q.id)}
                              className="text-[11px] text-black/40 hover:text-red-600 px-1.5 py-1 font-medium cursor-pointer"
                              title="Hapus pertanyaan"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL TULIS JAWABAN DOSEN */}
      {responseModalQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-black p-6 shadow-retro-lg space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
              <h3 className="font-bold text-sm text-black flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Catat Jawaban atau Rangkuman Dosen</span>
              </h3>
              <button
                type="button"
                onClick={() => setResponseModalQuestion(null)}
                className="text-black/60 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl border border-black/15 bg-neutral-50 text-xs text-black/80">
              <span className="font-bold block text-black mb-1">Pertanyaan Mahasiswa:</span>
              <p className="italic">&ldquo;{responseModalQuestion.question}&rdquo;</p>
            </div>

            <div>
              <label className="text-xs font-bold text-black block mb-1">
                Catatan Penjelasan Dosen (Opsional):
              </label>
              <textarea
                rows={3}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Contoh: Sudah dibahas di kelas: lihat slide 14 rumus korelasi parsial."
                className="w-full p-3 rounded-xl border-2 border-black text-xs font-sans focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResponseModalQuestion(null)}
                className="px-3.5 py-2 rounded-xl border-2 border-black text-xs font-bold bg-white hover:bg-gray-soft"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveResponse}
                className="px-4 py-2 rounded-xl border-2 border-black text-xs font-bold bg-black text-white hover:bg-neutral-800 shadow-retro"
              >
                Simpan & Tandai Terjawab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
