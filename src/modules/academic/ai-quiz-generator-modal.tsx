'use client';

import React, { useState, useTransition } from 'react';
import {
  Sparkles,
  Bot,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  FileText,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  generateAiQuestionsDraftAction,
  approveAiQuestionsToBankAction,
  type AiDraftQuestion,
} from './ai-quiz-generator';

interface AiQuizGeneratorModalProps {
  classes: Array<{ id: string; title: string }>;
  onQuestionsApproved?: () => void;
}

export function AiQuizGeneratorModal({ classes, onQuestionsApproved }: AiQuizGeneratorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'config' | 'review'>('config');
  const [isPending, startTransition] = useTransition();

  // Config States
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'c0000000-0000-0000-0000-000000000001');
  const [materialTitle, setMaterialTitle] = useState('Modul 01: Fondasi Arsitektur Web & Cloud');
  const [materialContent, setMaterialContent] = useState(
    'Arsitektur cloud computing, RESTful API principles, stateless authentication, Next.js Server Components, dan caching middleware.'
  );
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [questionType, setQuestionType] = useState<'MULTIPLE_CHOICE' | 'ESSAY'>('MULTIPLE_CHOICE');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [cpmkTarget, setCpmkTarget] = useState('CPMK-1: Mampu menganalisis arsitektur sistem berbasis cloud');

  // Review States
  const [drafts, setDrafts] = useState<AiDraftQuestion[]>([]);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    startTransition(async () => {
      const res = await generateAiQuestionsDraftAction({
        classId: selectedClassId,
        materialTitle,
        materialContent,
        questionCount,
        questionType,
        difficulty,
        cpmkTarget,
      });

      if (!res.ok || !res.drafts) {
        setErrorMsg(res.error || 'Terjadi kesalahan saat memproses generator soal AI.');
      } else {
        setDrafts(res.drafts);
        setRemainingQuota(res.remainingDailyQuota ?? null);
        setStep('review');
      }
    });
  };

  const handleUpdateDraft = (index: number, field: string, val: any) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: val } : d))
    );
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setDrafts((prev) =>
      prev.map((d, i) => {
        if (i !== qIdx || !d.options) return d;
        const newOpts = [...d.options];
        newOpts[optIdx] = val;
        return { ...d, options: newOpts };
      })
    );
  };

  const handleRemoveDraft = (index: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApprove = () => {
    if (drafts.length === 0) {
      setErrorMsg('Tidak ada draf soal untuk disetujui.');
      return;
    }

    startTransition(async () => {
      const payload = drafts.map((d) => ({
        question_text: d.question_text,
        question_type: d.question_type,
        difficulty: d.difficulty,
        cpmk: d.cpmk,
        points: d.points,
        options: d.options,
        correct_answer_index: d.correct_answer_index,
        explanation: d.explanation,
        rubric: d.rubric,
        rubric_criteria: d.rubric_criteria,
      }));

      const res = await approveAiQuestionsToBankAction({
        classId: selectedClassId,
        questions: payload,
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'Gagal menyimpan draf ke Bank Soal.');
      } else {
        setSuccessMsg(`Berhasil! ${res.savedCount} butir soal telah disetujui dan masuk ke Bank Soal.`);
        if (onQuestionsApproved) onQuestionsApproved();
        setTimeout(() => {
          setIsOpen(false);
          setStep('config');
          setDrafts([]);
          setSuccessMsg('');
        }, 1500);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs sm:text-sm shadow-retro hover:bg-primary-dark transition-all cursor-pointer"
      >
        <Sparkles className="h-4 w-4" />
        <span>Generator Draf Soal AI</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border-2 border-black bg-surface p-6 sm:p-8 shadow-retro-window space-y-6 my-8 animate-fade-up">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg sm:text-xl text-ink flex items-center gap-2">
                    Generator Draf Soal AI (Bank Soal)
                    <span className="px-2.5 py-0.5 rounded border border-black bg-gray-soft text-xs font-sans font-bold">
                      STATUS: DRAF WAJIB REVIEW
                    </span>
                  </h3>
                  <p className="text-xs text-gray-dark font-medium mt-0.5">
                    Hasilkan draf butir soal evaluasi berbasis materi perkuliahan dengan rubrik terstruktur.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg border border-black hover:bg-gray-soft"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl border-2 border-black bg-primary text-white text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl border-2 border-black bg-surface text-ink text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-ink" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* STEP 1: CONFIGURATION */}
            {step === 'config' && (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink uppercase tracking-wide">
                      Kelas Perkuliahan <span className="text-primary">*</span>
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border-2 border-black bg-surface text-xs font-medium text-ink"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink uppercase tracking-wide">
                      Judul Materi / Modul Pertemuan <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      className="w-full p-2.5 rounded-lg border-2 border-black bg-surface text-xs font-medium text-ink"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink uppercase tracking-wide">
                    Ringkasan Materi / Kutipan Teks / Silabus <span className="text-primary">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={materialContent}
                    onChange={(e) => setMaterialContent(e.target.value)}
                    placeholder="Tempelkan ringkasan materi kuliah, silabus pertemuan, atau catatan modul di sini..."
                    className="w-full p-3 rounded-lg border-2 border-black bg-surface text-xs font-medium text-ink"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink uppercase tracking-wide">
                      Tipe Soal
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value as any)}
                      className="w-full p-2 rounded-lg border-2 border-black bg-surface text-xs font-bold text-ink"
                    >
                      <option value="MULTIPLE_CHOICE">Pilihan Ganda (4 Opsi)</option>
                      <option value="ESSAY">Esai (dengan Rubrik Kriteria)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink uppercase tracking-wide">
                      Tingkat Kesulitan
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full p-2 rounded-lg border-2 border-black bg-surface text-xs font-bold text-ink"
                    >
                      <option value="EASY">Mudah (C1-C2 Pemahaman)</option>
                      <option value="MEDIUM">Sedang (C3-C4 Aplikasi)</option>
                      <option value="HARD">Sukar (C5-C6 Evaluasi/Sintesis)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink uppercase tracking-wide">
                      Jumlah Soal (1-10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border-2 border-black bg-surface text-xs font-bold text-ink"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink uppercase tracking-wide">
                    Target Capaian Pembelajaran Mata Kuliah (CPMK) <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={cpmkTarget}
                    onChange={(e) => setCpmkTarget(e.target.value)}
                    placeholder="Contoh: CPMK-2: Mampu merancang skema relasional ternormalisasi"
                    className="w-full p-2.5 rounded-lg border-2 border-black bg-surface text-xs font-medium text-ink"
                    required
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-black bg-gray-soft text-xs text-ink flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    Batas Pemakaian AI Dosen: 10 sesi generasi per hari
                  </span>
                  <span className="font-sans text-xs text-gray-dark">
                    Model: SIAJAR AI Assistant (Tanya AI Engine)
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 rounded-lg border-2 border-black bg-surface text-xs font-bold text-ink hover:bg-gray-soft"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs shadow-retro hover:bg-primary-dark disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isPending ? 'AI Sedang Merumuskan Draf...' : 'Generate Draf Soal'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: REVIEW & APPROVAL (WAJIB TINJAU) */}
            {step === 'review' && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl border-2 border-black bg-surface text-xs text-ink flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold">
                      Tinjau & Edit Draf Soal AI ({drafts.length} Butir)
                    </p>
                    <p className="text-gray-dark text-xs">
                      Aturan A2 & Standar Bank Soal: Dosen wajib meneliti dan dapat mengedit isi pertanyaan sebelum menyetujuinya ke Bank Soal.
                    </p>
                  </div>
                  {remainingQuota !== null && (
                    <span className="px-2.5 py-1 rounded bg-gray-soft border border-black text-xs font-bold">
                      Sisa Kuota Hari Ini: {remainingQuota}
                    </span>
                  )}
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {drafts.map((draft, idx) => (
                    <div
                      key={draft.tempId || idx}
                      className="p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-black/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded border border-black bg-ink text-white font-bold text-xs">
                            DRAF #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded border border-black bg-gray-soft text-xs font-bold">
                            {draft.question_type}
                          </span>
                          <span className="px-2 py-0.5 rounded border border-black bg-surface text-xs font-bold">
                            {draft.difficulty}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDraft(idx)}
                          className="p-1 rounded text-primary hover:bg-gray-soft text-xs"
                          title="Hapus butir draf ini"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-dark uppercase">
                          Teks Pertanyaan:
                        </label>
                        <textarea
                          rows={2}
                          value={draft.question_text}
                          onChange={(e) => handleUpdateDraft(idx, 'question_text', e.target.value)}
                          className="w-full p-2.5 rounded-lg border-2 border-black text-xs font-bold text-ink"
                        />
                      </div>

                      {/* Opsi Pilihan Ganda */}
                      {draft.question_type === 'MULTIPLE_CHOICE' && draft.options && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-dark uppercase">
                            Pilihan Jawaban (Tandai Kunci Jawaban Benar):
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {draft.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded-lg border',
                                  draft.correct_answer_index === oIdx
                                    ? 'border-2 border-black bg-gray-soft/60 font-bold'
                                    : 'border-black/30 bg-surface'
                                )}
                              >
                                <input
                                  type="radio"
                                  name={`correct-${idx}`}
                                  checked={draft.correct_answer_index === oIdx}
                                  onChange={() => handleUpdateDraft(idx, 'correct_answer_index', oIdx)}
                                  className="h-3.5 w-3.5 text-primary"
                                />
                                <span className="text-xs font-bold font-sans">
                                  {String.fromCharCode(65 + oIdx)}.
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleUpdateOption(idx, oIdx, e.target.value)}
                                  className="flex-1 text-xs bg-transparent outline-none"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1 pt-1">
                            <label className="text-xs font-bold text-gray-dark uppercase">
                              Penjelasan Kunci Jawaban:
                            </label>
                            <input
                              type="text"
                              value={draft.explanation || ''}
                              onChange={(e) => handleUpdateDraft(idx, 'explanation', e.target.value)}
                              className="w-full p-2 rounded border border-black text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* Rubrik Esai */}
                      {draft.question_type === 'ESSAY' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-dark uppercase">
                            Rubrik Penilaian & Kriteria Pembobotan:
                          </label>
                          <textarea
                            rows={2}
                            value={draft.rubric || ''}
                            onChange={(e) => handleUpdateDraft(idx, 'rubric', e.target.value)}
                            className="w-full p-2 rounded border border-black text-xs font-medium"
                          />

                          {draft.rubric_criteria && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {draft.rubric_criteria.map((crit, cIdx) => (
                                <div key={cIdx} className="p-2 rounded border border-black bg-gray-soft/30 text-xs">
                                  <p className="font-bold text-ink">{crit.criterion}</p>
                                  <p className="text-xs text-gray-dark">{crit.description}</p>
                                  <span className="font-bold text-primary text-xs">Bobot: {crit.weight}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => setStep('config')}
                    className="px-4 py-2 rounded-lg border-2 border-black bg-surface text-xs font-bold text-ink hover:bg-gray-soft"
                  >
                    &larr; Ubah Parameter
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-lg border-2 border-black bg-surface text-xs font-bold text-ink hover:bg-gray-soft"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isPending || drafts.length === 0}
                      onClick={handleApprove}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs shadow-retro hover:bg-primary-dark disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{isPending ? 'Menyimpan...' : 'Setujui & Simpan ke Bank Soal'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
