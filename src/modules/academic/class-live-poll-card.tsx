'use client';

import React, { useState, useEffect } from 'react';
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

  const loadPolls = async () => {
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
  };

  useEffect(() => {
    loadPolls();
  }, [classId]);

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
      alert(res.error || 'Gagal mengirim jawaban.');
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
      alert(res.error || 'Gagal membuat polling.');
    }
  };

  if (!activePoll && !isStaff) {
    return null;
  }

  return (
    <div className="rounded-[12px] border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {activePoll?.is_quiz ? 'Kuis Cepat Perkuliahan' : 'Polling Perkuliahan'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {activePoll?.status === 'buka'
                ? 'Sesi tanya jawab langsung sedang dibuka oleh dosen.'
                : 'Pertanyaan interaktif di ruang kelas.'}
            </p>
          </div>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2">
            {activePoll?.status === 'draf' && (
              <button
                type="button"
                onClick={() => handleOpenPoll(activePoll.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                <Play className="h-3 w-3" />
                <span>Buka</span>
              </button>
            )}
            {activePoll?.status === 'buka' && (
              <button
                type="button"
                onClick={() => handleClosePoll(activePoll.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                <Square className="h-3 w-3" />
                <span>Tutup</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-border bg-surface text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Polling Baru</span>
            </button>
          </div>
        )}
      </div>

      {activePoll && (
        <div className="p-4 rounded-[10px] bg-muted/40 border border-border/80 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold text-foreground">{activePoll.question}</p>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 ${
                activePoll.status === 'buka'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {activePoll.status === 'buka' ? 'Sedang Berlangsung' : 'Selesai'}
            </span>
          </div>

          {/* Form Jawab Mahasiswa (Bila Status 'buka' dan Belum Voted) */}
          {activePoll.status === 'buka' && !hasVoted && !isStaff && (
            <form onSubmit={handleVote} className="space-y-3 pt-2">
              {activePoll.kind === 'single' && (
                <div className="space-y-2">
                  {(activePoll.options || []).map((opt: any) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-[8px] border text-xs cursor-pointer transition-colors ${
                        selectedOption === opt.id
                          ? 'border-primary bg-primary/5 font-semibold text-primary'
                          : 'border-border bg-surface text-foreground hover:bg-muted'
                      }`}
                    >
                      <input
                        type="radio"
                        name="poll_option"
                        value={opt.id}
                        checked={selectedOption === opt.id}
                        onChange={() => setSelectedOption(opt.id)}
                        className="text-primary focus:ring-primary"
                      />
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
                      className={`flex items-center gap-2.5 p-2.5 rounded-[8px] border text-xs cursor-pointer transition-colors ${
                        selectedMultiple.includes(opt.id)
                          ? 'border-primary bg-primary/5 font-semibold text-primary'
                          : 'border-border bg-surface text-foreground hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMultiple.includes(opt.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMultiple([...selectedMultiple, opt.id]);
                          else setSelectedMultiple(selectedMultiple.filter((id) => id !== opt.id));
                        }}
                        className="rounded text-primary focus:ring-primary"
                      />
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
                      className={`flex-1 py-2 rounded-[8px] border text-xs font-bold transition-colors ${
                        selectedOption === String(num)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-surface text-foreground hover:bg-muted'
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
                  className="w-full rounded-[8px] border border-border p-2.5 text-xs bg-surface text-foreground"
                />
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">
                  {activePoll.is_anonymous ? 'Jawaban bersifat 100% anonim' : 'Jawaban tercatat dengan akunmu'}
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  Kirim Jawaban
                </button>
              </div>
            </form>
          )}

          {hasVoted && activePoll.status === 'buka' && (
            <div className="p-3 rounded-[8px] bg-emerald-500/10 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Jawaban terkirim. Hasil akan tampil setelah dosen menutup sesi polling.</span>
            </div>
          )}

          {/* Tampilan Hasil Polling (Untuk Dosen atau Setelah Ditutup) */}
          {(activePoll.status === 'tutup' || isStaff) && pollResults && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Hasil Responden ({pollResults.total_votes || 0} suara):</span>
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
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-foreground">
                          {opt?.label || res.option_id}
                          {isCorrect && (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-1 rounded">
                              Kunci
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground">{res.count} ({percent}%)</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isCorrect ? 'bg-emerald-500' : 'bg-primary'}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-[12px] border border-border bg-surface p-5 space-y-4 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Buat Polling / Kuis Cepat Baru</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Pertanyaan</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Contoh: Manakah struktur data yang paling tepat untuk antrean FIFO?"
                  required
                  className="w-full rounded-[8px] border border-border p-2 text-xs bg-surface text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tipe Pertanyaan</label>
                  <select
                    value={kind}
                    onChange={(e: any) => setKind(e.target.value)}
                    className="w-full rounded-[8px] border border-border p-2 text-xs bg-surface text-foreground"
                  >
                    <option value="single">Pilihan Ganda (Satu Jawaban)</option>
                    <option value="multiple">Pilihan Ganda (Banyak Jawaban)</option>
                    <option value="scale">Skala Penilaian (1 - 5)</option>
                    <option value="text">Teks Bebas</option>
                  </select>
                </div>
                <div className="flex items-end pb-2 gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isQuiz}
                      onChange={(e) => setIsQuiz(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span>Kuis Cepat (Beri XP)</span>
                  </label>
                </div>
              </div>

              {(kind === 'single' || kind === 'multiple') && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">Pilihan Jawaban</label>
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
                        className="flex-1 rounded-[8px] border border-border p-1.5 text-xs bg-surface text-foreground"
                      />
                      {isQuiz && (
                        <button
                          type="button"
                          onClick={() => setCorrectOptionId(opt.id)}
                          className={`text-xs px-2 py-1 rounded border ${
                            correctOptionId === opt.id
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-border text-muted-foreground'
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
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      + Tambah Pilihan
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-[8px] border border-border text-xs text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
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
