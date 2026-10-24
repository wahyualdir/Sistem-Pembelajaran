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
      <div className="border-2 border-[#7A756D] border-l-4 border-l-[#C2553A] bg-[#FAF8F5] shadow-retro-sm p-5 sm:p-6 lg:p-7 relative overflow-hidden font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider bg-[#E8F5E9] text-[#065F46] border border-[#10B981]">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                Sesi Perkuliahan Langsung
              </span>
              <span className="text-xs font-bold text-[#57534E] hidden sm:inline">
                Interaksi Waktu Nyata
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#1C1917] tracking-tight flex items-center gap-2.5">
              <MessageSquare className="h-6 w-6 text-[#C2553A]" />
              <span>Ruang Interaksi Kuliah</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#57534E] max-w-2xl font-medium leading-relaxed">
              Ajukan pertanyaan seputar materi yang sedang diterangkan, dukung pertanyaan teman yang
              belum dipahami, dan ikuti kuis kilat untuk menguji pemahaman materi kuliah.
            </p>
          </div>

          {/* Sub-Navigasi Antar Fitur Interaksi */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('tanya')}
              className={cn(
                'px-4 py-2 text-xs sm:text-sm font-bold border-2 transition-all flex items-center gap-2 cursor-pointer shadow-retro-xs',
                activeSubTab === 'tanya'
                  ? 'bg-[#1C1917] text-white border-[#1C1917]'
                  : 'bg-[#FFFFFF] text-[#1C1917] border-[#7A756D] hover:bg-[#FAF8F5]'
              )}
            >
              <HelpCircle className={cn('h-4 w-4', activeSubTab === 'tanya' ? 'text-[#C2553A]' : 'text-[#7A756D]')} />
              <span>Tanya Jawab Kuliah</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('kuis')}
              className={cn(
                'px-4 py-2 text-xs sm:text-sm font-bold border-2 transition-all flex items-center gap-2 cursor-pointer shadow-retro-xs',
                activeSubTab === 'kuis'
                  ? 'bg-[#1C1917] text-white border-[#1C1917]'
                  : 'bg-[#FFFFFF] text-[#1C1917] border-[#7A756D] hover:bg-[#FAF8F5]'
              )}
            >
              <BarChart3 className={cn('h-4 w-4', activeSubTab === 'kuis' ? 'text-[#C2553A]' : 'text-[#7A756D]')} />
              <span>Kuis Kilat & Polling</span>
            </button>

            {isStaff && (
              <button
                type="button"
                onClick={() => setIsProjectorMode(!isProjectorMode)}
                className="px-3.5 py-2 text-xs font-bold border-2 border-[#7A756D] bg-[#FFFFFF] text-[#1C1917] hover:bg-[#FAF8F5] shadow-retro-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                title="Buka Tampilan Khusus Layar Proyektor Kelas"
              >
                <Tv className="h-4 w-4 text-[#C2553A]" />
                <span>Mode Proyektor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. MODE PROYEKTOR KELAS (PRESENTASI FOKUS UNTUK DOSEN) */}
      {isProjectorMode && isStaff && (
        <div className="border-4 border-[#1C1917] bg-[#1C1917] text-white shadow-retro-lg p-6 sm:p-8 space-y-4 animate-fade-up font-sans">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FDDDD7]">
              <Tv className="h-4 w-4 text-[#C2553A]" />
              <span>Tampilan Proyektor Kelas Tatap Muka (Layar Fokus)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsProjectorMode(false)}
              className="text-xs bg-[#FFFFFF] text-[#1C1917] px-3 py-1 font-bold hover:bg-[#FAF8F5] cursor-pointer"
            >
              Tutup Mode Proyektor
            </button>
          </div>

          {pinnedOrActiveQuestion ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#FAF8F5] text-[#1C1917] text-xs font-bold px-3 py-1 uppercase tracking-wider border border-[#7A756D]">
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
                <div className="p-4 border border-white/30 bg-white/10 text-xs sm:text-sm space-y-1">
                  <span className="font-bold text-[#FDDDD7] block">Catatan Penjelasan Dosen:</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start font-sans">
          {/* KOLOM KIRI: FORM KIRIM PERTANYAAN (UNTUK MAHASISWA & PENGAJAR) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm p-4 sm:p-5 space-y-4">
              <div className="border-b-2 border-[#D6D3CB] pb-3">
                <h3 className="font-heading font-black text-sm sm:text-base text-[#1C1917] flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-[#C2553A]" />
                  <span>Ajukan Pertanyaan</span>
                </h3>
                <p className="text-xs text-[#57534E] mt-1 font-medium leading-relaxed">
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
                    className="w-full p-3 border-2 border-[#7A756D] bg-[#FAF8F5] text-xs sm:text-sm font-sans text-[#1C1917] placeholder:text-[#7A756D] focus:outline-none focus:border-[#C2553A] resize-none"
                  />
                  <div className="flex justify-between items-center text-xs font-mono text-[#57534E] mt-1">
                    <span>Minimal 5 karakter</span>
                    <span>{questionText.length}/500</span>
                  </div>
                </div>

                {/* Sakelar Anonim (Menjaga Keberanian Mahasiswa untuk Bertanya) */}
                <label className="flex items-start gap-2.5 p-3 border border-[#D6D3CB] bg-[#FAF8F5] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mt-0.5 h-4 w-4 border-2 border-[#7A756D] accent-[#C2553A]"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-[#C2553A]" />
                      <span>Kirim sebagai Mahasiswa Anonim</span>
                    </span>
                    <p className="text-xs text-[#57534E] font-medium leading-tight">
                      Nama asli Anda disamarkan dari rekan-rekan sekelas agar Anda dapat bertanya tanpa sungkan.
                    </p>
                  </div>
                </label>

                {feedbackMsg && (
                  <div
                    className={cn(
                      'p-3 border text-xs font-bold',
                      feedbackMsg.type === 'ok'
                        ? 'bg-[#E8F5E9] text-[#065F46] border-[#10B981]'
                        : 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]'
                    )}
                  >
                    {feedbackMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || questionText.trim().length < 5}
                  className="w-full py-2.5 border-2 border-[#6B2D20] bg-[#C2553A] hover:bg-[#853827] text-white font-black text-xs sm:text-sm shadow-retro-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pertanyaan Kuliah'}</span>
                </button>
              </form>
            </div>

            {/* TIPS BERTANYA YANG BAIK */}
            <div className="p-3.5 border border-[#D6D3CB] bg-[#FAF8F5] text-xs text-[#57534E] space-y-1.5 shadow-retro-xs">
              <span className="font-bold text-[#1C1917] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#C2553A]" />
                <span>Kiat Bertanya Efektif di Kelas</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-[#57534E] pl-1 font-medium">
                <li>Sebutkan slide atau sub-bab yang membingungkan.</li>
                <li>Dukung pertanyaan rekan sekelas yang memiliki kebingungan serupa.</li>
                <li>Dosen akan memilih pertanyaan paling banyak didukung untuk diulas di kelas.</li>
              </ul>
            </div>
          </div>

          {/* KOLOM KANAN: DAFTAR PERTANYAAN WAKTU NYATA */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* BILAH FILTER & REFRESH */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-xs font-bold text-[#57534E] flex items-center gap-1 mr-1 shrink-0">
                  <Filter className="h-3.5 w-3.5 text-[#C2553A]" />
                  <span>Status:</span>
                </span>
                {(['semua', 'antre', 'dibahas', 'terjawab'] as LiveQuestionFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-bold transition-all border shrink-0 cursor-pointer shadow-retro-xs',
                      filter === f
                        ? 'bg-[#1C1917] text-white border-[#1C1917]'
                        : 'bg-[#FFFFFF] text-[#57534E] hover:text-[#1C1917] border-[#7A756D] hover:bg-[#FAF8F5]'
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
                className="text-xs font-bold text-[#1C1917] bg-[#FFFFFF] border border-[#7A756D] hover:bg-[#FAF8F5] px-2.5 py-1 flex items-center gap-1.5 cursor-pointer shadow-retro-xs shrink-0"
                title="Segarkan daftar pertanyaan"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 text-[#C2553A]', isLoading && 'animate-spin')} />
                <span>{isLoading ? 'Memuat...' : 'Segarkan'}</span>
              </button>
            </div>

            {/* DAFTAR PERTANYAAN */}
            {questions.length === 0 ? (
              <div className="border-2 border-dashed border-[#7A756D] bg-[#FAF8F5] p-8 sm:p-12 text-center space-y-2.5 shadow-retro-sm">
                <div className="h-12 w-12 border-2 border-[#C2553A] bg-[#FEF4F1] flex items-center justify-center mx-auto text-[#853827] shadow-retro-xs">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h4 className="font-heading font-black text-sm sm:text-base text-[#1C1917]">Belum Ada Pertanyaan di Kelas Ini</h4>
                <p className="text-xs text-[#57534E] max-w-sm mx-auto font-medium leading-relaxed">
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
                        'border-2 border-[#7A756D] p-4 sm:p-5 transition-all shadow-retro-sm relative bg-[#FAF8F5]',
                        isPinned
                          ? 'border-l-4 border-l-[#B45309] bg-[#FEF4F1]'
                          : isBeingDiscussed
                          ? 'border-l-4 border-l-[#1D4ED8]'
                          : isAnswered
                          ? 'border-l-4 border-l-[#10B981]'
                          : 'border-l-4 border-l-[#7A756D]'
                      )}
                    >
                      {/* PITA STATUS DISEMATKAN */}
                      {isPinned && (
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#853827] bg-[#FEF4F1] px-2.5 py-0.5 border border-[#C2553A] w-fit">
                          <Pin className="h-3 w-3 rotate-45 text-[#C2553A]" />
                          <span>Ditayangkan di Layar Kelas</span>
                        </div>
                      )}

                      {/* BARIS ATAS: NAMA PENANYA & BADGE STATUS */}
                      <div className="flex items-center justify-between gap-2 border-b border-[#D6D3CB] pb-2 mb-2.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={cn(
                              'font-bold truncate max-w-[200px]',
                              q.is_anonymous ? 'text-[#57534E] italic' : 'text-[#1C1917]'
                            )}
                          >
                            {q.student_name}
                          </span>
                          <span className="text-[#7A756D] text-[11px]">&bull;</span>
                          <span className="text-[#57534E] text-xs font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#7A756D]" />
                            <span>
                              {new Date(q.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              WIB
                            </span>
                          </span>
                        </div>

                        {/* BADGE STATUS */}
                        <div>
                          {isBeingDiscussed ? (
                            <span className="text-xs font-bold px-2 py-0.5 border border-[#1D4ED8] bg-[#FAF8F5] text-[#1D4ED8] flex items-center gap-1">
                              <Volume2 className="h-3 w-3" />
                              <span>Sedang Dibahas</span>
                            </span>
                          ) : isAnswered ? (
                            <span className="text-xs font-bold px-2 py-0.5 border border-[#10B981] bg-[#E8F5E9] text-[#065F46] flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Selesai Dijawab</span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-0.5 border border-[#D6D3CB] bg-[#FFFFFF] text-[#57534E]">
                              Menunggu Giliran
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ISI PERTANYAAN */}
                      <p className="text-xs sm:text-sm font-semibold text-[#1C1917] leading-relaxed mb-3">
                        {q.question}
                      </p>

                      {/* TANGGAPAN / CATATAN JAWABAN DOSEN */}
                      {q.lecturer_response && (
                        <div className="p-3 border border-[#D6D3CB] bg-[#FFFFFF] text-xs space-y-1 mb-3 shadow-retro-xs">
                          <span className="font-bold text-[#1C1917] flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-[#C2553A]" />
                            <span>Catatan Jawaban Dosen:</span>
                          </span>
                          <p className="text-[#57534E] font-medium leading-relaxed pl-5">
                            {q.lecturer_response}
                          </p>
                        </div>
                      )}

                      {/* BARIS BAWAH: TOMBOL DUKUNGAN (UPVOTE) & AKSI DOSEN */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D6D3CB]">
                        {/* Tombol Upvote */}
                        <button
                          type="button"
                          onClick={() => handleToggleUpvote(q.id)}
                          className={cn(
                            'px-3 py-1.5 border-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-retro-xs',
                            q.has_upvoted
                              ? 'border-[#6B2D20] bg-[#C2553A] text-white'
                              : 'border-[#7A756D] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917]'
                          )}
                          title="Dukung jika Anda memiliki kebingungan yang sama"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{q.upvotes_count}</span>
                          <span className="text-xs font-medium hidden sm:inline">
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
                                  className="text-xs font-bold px-2.5 py-1 border border-[#1D4ED8] bg-[#FAF8F5] hover:bg-[#FFFFFF] text-[#1D4ED8] cursor-pointer shadow-retro-xs"
                                  title="Tandai dosen sedang membahas pertanyaan ini secara lisan"
                                >
                                  Bahas Sekarang
                                </button>
                              )}

                              {q.status !== 'terjawab' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(q.id, 'terjawab')}
                                  className="text-xs font-bold px-2.5 py-1 border border-[#10B981] bg-[#E8F5E9] hover:bg-[#FFFFFF] text-[#065F46] cursor-pointer shadow-retro-xs"
                                  title="Tandai pertanyaan telah selesai dijawab"
                                >
                                  Tandai Selesai
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleTogglePin(q.id)}
                                className={cn(
                                  'p-1.5 border border-[#7A756D] text-xs cursor-pointer shadow-retro-xs',
                                  q.is_pinned
                                    ? 'bg-[#FEF4F1] text-[#853827] border-[#C2553A]'
                                    : 'bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#57534E]'
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
                                className="text-xs font-bold px-2.5 py-1 border border-[#7A756D] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] cursor-pointer shadow-retro-xs"
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
                              className="text-xs text-[#57534E] hover:text-[#DC2626] px-1.5 py-1 font-medium cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-lg bg-[#FFFFFF] border-2 border-[#7A756D] p-5 sm:p-6 shadow-retro-md space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b-2 border-[#D6D3CB] pb-3">
              <h3 className="font-heading font-black text-sm sm:text-base text-[#1C1917] flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#C2553A]" />
                <span>Catat Jawaban atau Rangkuman Dosen</span>
              </h3>
              <button
                type="button"
                onClick={() => setResponseModalQuestion(null)}
                className="text-[#57534E] hover:text-[#1C1917] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 border border-[#D6D3CB] bg-[#FAF8F5] text-xs text-[#57534E]">
              <span className="font-bold block text-[#1C1917] mb-1">Pertanyaan Mahasiswa:</span>
              <p className="italic">&ldquo;{responseModalQuestion.question}&rdquo;</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1C1917] block mb-1">
                Catatan Penjelasan Dosen (Opsional):
              </label>
              <textarea
                rows={3}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Contoh: Sudah dibahas di kelas: lihat slide 14 rumus korelasi parsial."
                className="w-full p-3 border-2 border-[#7A756D] bg-[#FAF8F5] text-xs sm:text-sm font-sans focus:outline-none focus:border-[#C2553A] text-[#1C1917]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResponseModalQuestion(null)}
                className="px-3.5 py-2 border-2 border-[#7A756D] text-xs font-bold bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] shadow-retro-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveResponse}
                className="px-4 py-2 border-2 border-[#6B2D20] text-xs font-black bg-[#C2553A] hover:bg-[#853827] text-white shadow-retro-sm cursor-pointer"
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
