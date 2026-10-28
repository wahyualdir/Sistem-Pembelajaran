'use client';
import { toast } from '@/components/ui/toast';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';
import {
  createLivePollAction,
  openPollAction,
  closePollAction,
  submitPollVoteAction,
  getPollResultsAction,
  listClassPollsAction,
} from './poll-actions';

interface ClassLivePollCardProps {
  classId: string;
  currentUserRole: string;
}

export function ClassLivePollCard({ classId, currentUserRole }: ClassLivePollCardProps) {
  const [polls, setPolls] = useState<any[]>([]);
  const [activePoll, setActivePoll] = useState<any | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [pollResults, setPollResults] = useState<any | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Buat Polling
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [kind, setKind] = useState<'single' | 'multiple' | 'scale' | 'text'>('single');
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>([
    { id: 'opt_1', label: '' },
    { id: 'opt_2', label: '' },
  ]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isQuiz, setIsQuiz] = useState(false);
  const [correctOptionId, setCorrectOptionId] = useState('');

  const isStaff = currentUserRole === 'LECTURER' || currentUserRole === 'TEACHING_ASSISTANT';

  const loadPolls = useCallback(async () => {
    const res = await listClassPollsAction(classId);
    if (res.ok && res.polls) {
      setPolls(res.polls);
      const open = res.polls.find((p: any) => p.status === 'buka');
      const latestClosed = res.polls.find((p: any) => p.status === 'tutup');
      const current = open || latestClosed || null;
      setActivePoll(current);

      if (current) {
        if (current.status === 'tutup' || isStaff) {
          const r = await getPollResultsAction(current.id);
          if (r.ok) setPollResults(r.results);
        }
      }
    }
  }, [classId, isStaff]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePoll || isSubmitting) return;

    let ans: any = null;
    if (activePoll.kind === 'single' || activePoll.kind === 'scale') {
      if (!selectedOption) return;
      ans = selectedOption;
    } else if (activePoll.kind === 'multiple') {
      if (selectedMultiple.length === 0) return;
      ans = selectedMultiple;
    } else {
      if (!textAnswer.trim()) return;
      ans = textAnswer.trim();
    }

    setIsSubmitting(true);
    const res = await submitPollVoteAction(activePoll.id, ans);
    setIsSubmitting(false);

    if (res.ok) {
      setHasVoted(true);
    } else {
      toast.error(res.error || 'Gagal mengirim jawaban.');
    }
  };

  const handleOpenPoll = async (pollId: string) => {
    const res = await openPollAction(pollId);
    if (res.ok) loadPolls();
  };

  const handleClosePoll = async (pollId: string) => {
    const res = await closePollAction(pollId);
    if (res.ok) loadPolls();
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const validOptions = kind === 'text' ? null : options.filter((o) => o.label.trim().length > 0);

    const res = await createLivePollAction({
      classId,
      question: question.trim(),
      kind,
      options: validOptions,
      isAnonymous,
      isQuiz,
      correctOptionIds: isQuiz && correctOptionId ? [correctOptionId] : null,
    });

    if (res.ok) {
      setIsCreating(false);
      setQuestion('');
      setOptions([
        { id: 'opt_1', label: '' },
        { id: 'opt_2', label: '' },
      ]);
      loadPolls();
    } else {
      toast.error(res.error || 'Gagal membuat polling.');
    }
  };

  if (!activePoll && !isStaff) {
    return null;
  }

  return (
    <div className="rounded-2xl border-2 border-black bg-white p-5 sm:p-6 space-y-4 shadow-retro font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border-2 border-black bg-gray-soft text-black flex items-center justify-center shadow-retro-sm shrink-0">
            <HelpCircle className="h-5 w-5 text-black" />
          </div>
          <div>
            <h3 className="text-base font-heading font-black text-black">
              {activePoll?.is_quiz ? 'Kuis Cepat Perkuliahan' : 'Polling & Interaksi Kelas'}
            </h3>
            <p className="text-xs text-black/75 font-medium">
              {activePoll?.status === 'buka'
                ? 'Sesi tanya jawab langsung sedang dibuka oleh dosen pengampu.'
                : 'Pertanyaan interaktif dan pemungutan pendapat di ruang kelas.'}
            </p>
          </div>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2 shrink-0">
            {activePoll?.status === 'draf' && (
              <button
                type="button"
                onClick={() => handleOpenPoll(activePoll.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-black bg-black text-white text-xs font-bold shadow-retro hover:bg-neutral-800 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Buka Sesi</span>
              </button>
            )}
            {activePoll?.status === 'buka' && (
              <button
                type="button"
                onClick={() => handleClosePoll(activePoll.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-black bg-white text-black text-xs font-bold shadow-retro-sm hover:bg-gray-soft cursor-pointer"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Tutup Sesi</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-black bg-white text-xs font-bold text-black hover:bg-gray-soft shadow-retro-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Polling Baru</span>
            </button>
          </div>
        )}
      </div>

      {activePoll && (
        <div className="p-4 sm:p-5 rounded-xl bg-gray-soft/40 border-2 border-black space-y-3.5 shadow-retro-sm">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm sm:text-base font-heading font-black text-black leading-snug">{activePoll.question}</p>
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded border-2 border-black font-bold shrink-0 shadow-retro-sm ${
                activePoll.status === 'buka'
                  ? 'bg-black text-white'
                  : 'bg-white text-black'
              }`}
            >
              {activePoll.status === 'buka' ? 'LIVE AKTIF' : 'SELESAI'}
            </span>
          </div>

          {/* Form Jawab Mahasiswa */}
          {activePoll.status === 'buka' && !hasVoted && !isStaff && (
            <form onSubmit={handleVote} className="space-y-3 pt-2">
              {activePoll.kind === 'single' && (
                <div className="space-y-2">
                  {(activePoll.options || []).map((opt: any) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 border-black text-xs cursor-pointer transition-all shadow-retro-sm ${
                        selectedOption === opt.id
                          ? 'bg-black text-white font-bold'
                          : 'bg-white text-black hover:bg-gray-soft font-bold'
                      }`}
                    >
                      <input
                        type="radio"
                        name="poll_option"
                        value={opt.id}
                        checked={selectedOption === opt.id}
                        onChange={() => setSelectedOption(opt.id)}
                        className="sr-only"
                      />
                      <span className={`w-3 h-3 rounded-full border-2 ${selectedOption === opt.id ? 'border-white bg-white' : 'border-black bg-white'}`} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {activePoll.kind === 'multiple' && (
                <div className="space-y-2">
                  {(activePoll.options || []).map((opt: any) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 border-black text-xs cursor-pointer transition-all shadow-retro-sm ${
                        selectedMultiple.includes(opt.id)
                          ? 'bg-black text-white font-bold'
                          : 'bg-white text-black hover:bg-gray-soft font-bold'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMultiple.includes(opt.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMultiple([...selectedMultiple, opt.id]);
                          else setSelectedMultiple(selectedMultiple.filter((id) => id !== opt.id));
                        }}
                        className="sr-only"
                      />
                      <span className={`w-3 h-3 rounded border-2 ${selectedMultiple.includes(opt.id) ? 'border-white bg-white' : 'border-black bg-white'}`} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {activePoll.kind === 'scale' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedOption(String(num))}
                      className={`flex-1 py-2.5 rounded-xl border-2 border-black text-xs font-mono font-bold transition-all shadow-retro-sm cursor-pointer ${
                        selectedOption === String(num)
                          ? 'bg-black text-white'
                          : 'bg-white text-black hover:bg-gray-soft'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}

              {activePoll.kind === 'text' && (
                <textarea
                  rows={2}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Tulis jawabanmu secara singkat..."
                  className="w-full rounded-xl border-2 border-black p-3 text-xs bg-white text-black font-sans font-medium shadow-retro-sm outline-none"
                />
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-black/70 font-mono font-bold">
                  {activePoll.is_anonymous ? 'Jawaban bersifat 100% anonim' : 'Jawaban tercatat dengan akun Anda'}
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white text-xs font-bold shadow-retro hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  Kirim Jawaban
                </button>
              </div>
            </form>
          )}

          {hasVoted && activePoll.status === 'buka' && (
            <div className="p-3.5 rounded-xl border-2 border-black bg-gray-soft text-black text-xs font-bold flex items-center gap-2 shadow-retro-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-black" />
              <span>Jawaban Anda terkirim. Hasil agregat akan tampil setelah sesi polling ditutup oleh dosen.</span>
            </div>
          )}

          {/* Tampilan Hasil Polling */}
          {(activePoll.status === 'tutup' || isStaff) && pollResults && (
            <div className="space-y-3 pt-3 border-t-2 border-black/15">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-black mb-1">
                <span>Hasil Responden ({pollResults.total_votes || 0} suara terverifikasi):</span>
              </div>
              {Array.isArray(pollResults.results) &&
                pollResults.results.map((res: any, idx: number) => {
                  const opt = (activePoll.options || []).find((o: any) => o.id === res.option_id);
                  const isCorrect = (pollResults.correct_option_ids || []).includes(res.option_id);
                  const percent =
                    pollResults.total_votes > 0
                      ? Math.round((res.count / pollResults.total_votes) * 100)
                      : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-2 text-black">
                          {opt?.label || res.option_id}
                          {isCorrect && (
                            <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5 rounded border border-black">
                              Kunci Jawaban
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-black/75">{res.count} ({percent}%)</span>
                      </div>
                      <div className="h-3 w-full bg-white rounded-md overflow-hidden border border-black shadow-xs">
                        <div
                          className="h-full bg-black transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Modal Buat Polling Baru */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border-2 border-black bg-white overflow-hidden shadow-retro-lg max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between border-b-2 border-black bg-gray-soft p-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
                <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
                <h3 className="text-sm font-heading font-black text-black ml-1">Buat Polling & Kuis Cepat Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 rounded border border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Pertanyaan Polling *
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Contoh: Manakah struktur data yang paling tepat untuk antrean FIFO?"
                  required
                  className="w-full rounded-lg border-2 border-black p-2.5 text-xs bg-white text-black font-sans font-bold shadow-retro-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                    Tipe Pertanyaan
                  </label>
                  <select
                    value={kind}
                    onChange={(e: any) => setKind(e.target.value)}
                    className="w-full rounded-lg border-2 border-black p-2.5 text-xs bg-white text-black font-mono font-bold shadow-retro-sm outline-none cursor-pointer"
                  >
                    <option value="single">Pilihan Ganda (Tunggal)</option>
                    <option value="multiple">Pilihan Ganda (Banyak)</option>
                    <option value="scale">Skala Penilaian (1 - 5)</option>
                    <option value="text">Teks Bebas</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-black cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isQuiz}
                      onChange={(e) => setIsQuiz(e.target.checked)}
                      className="rounded border-2 border-black accent-black"
                    />
                    <span>Kuis Cepat (Beri Poin XP)</span>
                  </label>
                </div>
              </div>

              {(kind === 'single' || kind === 'multiple') && (
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider">
                    Pilihan Jawaban
                  </label>
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].label = e.target.value;
                          setOptions(updated);
                        }}
                        placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 rounded-lg border-2 border-black p-2 text-xs bg-white text-black font-sans font-bold shadow-retro-sm outline-none"
                      />
                      {isQuiz && (
                        <button
                          type="button"
                          onClick={() => setCorrectOptionId(opt.id)}
                          className={`text-xs px-3 py-2 rounded-lg border-2 border-black font-bold shadow-retro-sm cursor-pointer ${
                            correctOptionId === opt.id
                              ? 'bg-black text-white'
                              : 'bg-white text-black hover:bg-gray-soft'
                          }`}
                        >
                          Kunci
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 5 && (
                    <button
                      type="button"
                      onClick={() =>
                        setOptions([...options, { id: `opt_${options.length + 1}`, label: '' }])
                      }
                      className="text-xs font-bold text-black hover:underline cursor-pointer"
                    >
                      + Tambah Pilihan
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t-2 border-black/15">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl border-2 border-black text-xs font-bold bg-white text-black hover:bg-gray-soft shadow-retro-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white text-xs font-bold shadow-retro hover:bg-neutral-800 cursor-pointer"
                >
                  Simpan Polling
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
