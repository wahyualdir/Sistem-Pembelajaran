'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  Plus,
  Trash2,
  Code2,
} from 'lucide-react';
import {
  createQuizAction,
  getQuestionBankAction,
  type QuizQuestion,
  type QuestionType,
} from '../quiz-actions';
import { Feedback } from '../class-forms';

// ==========================================
// CREATE QUIZ & EXAM MODAL (DOSEN)
// ==========================================
export function CreateQuizModal({ classId }: { classId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState<'KUIS' | 'UTS' | 'UAS' | 'LATIHAN' | 'REMEDIAL'>('KUIS');
  const [duration, setDuration] = useState(60);
  const [dueAt, setDueAt] = useState('');
  const [proctoringLevel, setProctoringLevel] = useState<'OFF' | 'LIGHT' | 'STANDARD' | 'STRICT'>('STANDARD');
  const [kkm, setKkm] = useState(70);
  const [passcode, setPasscode] = useState('');
  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [blockCopyPaste, setBlockCopyPaste] = useState(true);

  // Questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q-temp-1',
      question_text: '',
      question_type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correct_answer_index: 0,
      points: 25,
      difficulty: 'MEDIUM',
    },
  ]);

  const addQuestion = (type: QuestionType = 'MULTIPLE_CHOICE') => {
    const newQ: QuizQuestion = {
      id: `q-temp-${Date.now()}`,
      question_text: '',
      question_type: type,
      points: 25,
      difficulty: 'MEDIUM',
    };

    if (type === 'MULTIPLE_CHOICE') {
      newQ.options = ['', '', '', ''];
      newQ.correct_answer_index = 0;
    } else if (type === 'TRUE_FALSE') {
      newQ.correct_boolean = true;
    } else if (type === 'SHORT_ANSWER') {
      newQ.correct_text = '';
    } else if (type === 'ESSAY') {
      newQ.rubric = 'Kriteria: Pemahaman konsep (50%), Argumentasi (30%), Kelengkapan (20%)';
    } else if (type === 'LIVE_CODING') {
      newQ.programming_language = 'javascript';
      newQ.starter_code = 'function solusi() {\n  // Mulai koding\n}';
      newQ.test_cases = [
        { input: 'solusi()', expected_output: '1', is_hidden: false },
        { input: 'solusi()', expected_output: '1', is_hidden: true },
      ];
    }

    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const importFromBank = async () => {
    const bank = await getQuestionBankAction();
    if (bank.length > 0) {
      setQuestions([...questions, ...bank.slice(0, 3)]);
      setSuccess('3 soal dari Bank Soal berhasil diimpor!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    startTransition(async () => {
      const res = await createQuizAction({
        class_id: classId,
        title,
        description,
        exam_type: examType,
        duration_minutes: duration,
        due_at: dueAt ? new Date(dueAt).toISOString() : new Date(Date.now() + 86400000 * 7).toISOString(),
        proctoring_level: proctoringLevel,
        kkm,
        passcode: passcode || undefined,
        require_fullscreen: requireFullscreen,
        block_copy_paste: blockCopyPaste,
        questions: questions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer_index: q.correct_answer_index,
          correct_boolean: q.correct_boolean,
          correct_text: q.correct_text,
          rubric: q.rubric,
          starter_code: q.starter_code,
          programming_language: q.programming_language,
          test_cases: q.test_cases,
          points: q.points,
          difficulty: q.difficulty,
          explanation: q.explanation,
        })),
      });

      if (res.ok) {
        setSuccess('Ujian & Kuis berhasil dibuat dan diterbitkan!');
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1200);
      } else {
        setError(res.error ?? 'Gagal membuat kuis.');
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="btn-solid !w-auto text-xs px-3.5 py-1.5 flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Buat Ujian / Kuis Baru
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-control border border-border bg-surface p-5 space-y-5 animate-fade-up">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-semibold text-base text-foreground">Konfigurasi Ujian & Kuis Terpadu</h3>
              <p className="text-xs text-muted-foreground">Mendukung 8 tipe soal, proctoring standar/ketat, dan penilaian terintegrasi.</p>
            </div>
            <button
              type="button"
              onClick={importFromBank}
              className="rounded-control border border-border px-2.5 py-1 text-xs hover:bg-muted font-medium flex items-center gap-1.5"
            >
              <Award className="h-3.5 w-3.5 text-primary" /> Impor dari Bank Soal
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Judul Ujian / Kuis</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: UTS Pemrograman Web & Algoritma"
                required
                className="field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Kategori Ujian</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
                className="field text-sm"
              >
                <option value="KUIS">Kuis Kelas</option>
                <option value="UTS">UTS (Tengah Semester)</option>
                <option value="UAS">UAS (Akhir Semester)</option>
                <option value="LATIHAN">Latihan Mandiri</option>
                <option value="REMEDIAL">Remedial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Durasi (Menit)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
                className="field text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tenggat Waktu Selesai</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                required
                className="field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Level Pengawasan (Proctoring)</label>
              <select
                value={proctoringLevel}
                onChange={(e) => setProctoringLevel(e.target.value as any)}
                className="field text-sm"
              >
                <option value="OFF">Mati (Tanpa Pengawasan)</option>
                <option value="LIGHT">Ringan (Hanya Catat Log)</option>
                <option value="STANDARD">Standar (Peringatan & Log)</option>
                <option value="STRICT">Ketat (Auto-Submit setelah 5 Pelanggaran)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">KKM Kelulusan & Passcode</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={kkm}
                  onChange={(e) => setKkm(Number(e.target.value))}
                  placeholder="KKM"
                  className="field text-sm"
                  title="Nilai KKM Minimal"
                />
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Passcode"
                  className="field text-sm font-sans"
                  title="Passcode Ujian (Opsional)"
                />
              </div>
            </div>
          </div>

          {/* Pengaturan Tambahan */}
          <div className="flex flex-wrap items-center gap-4 p-3 rounded-control border border-border bg-background text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireFullscreen}
                onChange={(e) => setRequireFullscreen(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              <span>Wajib Mode Layar Penuh (Fullscreen)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={blockCopyPaste}
                onChange={(e) => setBlockCopyPaste(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              <span>Blokir Salin-Tempel (Copy/Paste & Klik Kanan)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Petunjuk & Tata Tertib Ujian</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kerjakan dengan teliti. Segala bentuk perpindahan tab dan aktivitas mencurigakan terekam otomatis."
              className="field !h-auto text-sm py-2"
            />
          </div>

          {/* Question Builder */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Daftar Soal Ujian ({questions.length})</h4>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addQuestion('MULTIPLE_CHOICE')}
                  className="rounded-control border border-border px-2 py-1 text-xs hover:bg-muted font-medium"
                >
                  + Pilgan
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('TRUE_FALSE')}
                  className="rounded-control border border-border px-2 py-1 text-xs hover:bg-muted font-medium"
                >
                  + B / S
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('SHORT_ANSWER')}
                  className="rounded-control border border-border px-2 py-1 text-xs hover:bg-muted font-medium"
                >
                  + Isian
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('ESSAY')}
                  className="rounded-control border border-border px-2 py-1 text-xs hover:bg-muted font-medium"
                >
                  + Esai
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('LIVE_CODING')}
                  className="rounded-control border border-border px-2 py-1 text-xs hover:bg-muted font-medium"
                >
                  + Live Coding
                </button>
              </div>
            </div>

            {questions.map((q, qIdx) => (
              <div key={q.id || qIdx} className="rounded-control border border-border bg-background p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs font-sans bg-muted px-2 py-0.5 rounded">Soal #{qIdx + 1}</span>
                    <span className="text-xs font-semibold uppercase text-muted-foreground">{q.question_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={q.points}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].points = Number(e.target.value);
                        setQuestions(updated);
                      }}
                      placeholder="Poin"
                      className="field text-xs !h-7 w-20 text-center font-sans"
                      title="Bobot Nilai Soal"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-primary-dark hover:opacity-80 p-1"
                      title="Hapus Soal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={q.question_text}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[qIdx].question_text = e.target.value;
                    setQuestions(updated);
                  }}
                  placeholder="Tuliskan teks pertanyaan soal di sini..."
                  required
                  className="field !h-auto text-sm py-2"
                />

                {/* Sub-form based on question type */}
                {q.question_type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-medium text-muted-foreground block">
                      Pilihan Jawaban (Pilih radio untuk jawaban yang benar):
                    </span>
                    {(q.options ?? ['', '', '', '']).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`key-${qIdx}`}
                          checked={q.correct_answer_index === optIdx}
                          onChange={() => {
                            const updated = [...questions];
                            updated[qIdx].correct_answer_index = optIdx;
                            setQuestions(updated);
                          }}
                          className="h-4 w-4 text-primary"
                        />
                        <span className="text-xs font-sans font-bold w-4">{String.fromCharCode(65 + optIdx)}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...questions];
                            const opts = [...(updated[qIdx].options ?? ['', '', '', ''])];
                            opts[optIdx] = e.target.value;
                            updated[qIdx].options = opts;
                            setQuestions(updated);
                          }}
                          placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                          required
                          className="field text-xs !h-8 flex-1"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {q.question_type === 'TRUE_FALSE' && (
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-xs font-medium text-muted-foreground">Kunci Jawaban:</span>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name={`tf-${qIdx}`}
                        checked={q.correct_boolean === true}
                        onChange={() => {
                          const updated = [...questions];
                          updated[qIdx].correct_boolean = true;
                          setQuestions(updated);
                        }}
                      />
                      <span>Benar (True)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name={`tf-${qIdx}`}
                        checked={q.correct_boolean === false}
                        onChange={() => {
                          const updated = [...questions];
                          updated[qIdx].correct_boolean = false;
                          setQuestions(updated);
                        }}
                      />
                      <span>Salah (False)</span>
                    </label>
                  </div>
                )}

                {q.question_type === 'SHORT_ANSWER' && (
                  <div className="pt-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Kunci Jawaban Singkat (Teks Tepat)</label>
                    <input
                      type="text"
                      value={q.correct_text ?? ''}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].correct_text = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Contoh: Hypertext Transfer Protocol"
                      required
                      className="field text-xs !h-8 font-sans"
                    />
                  </div>
                )}

                {q.question_type === 'ESSAY' && (
                  <div className="pt-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Rubrik Penilaian & Acuan Evaluasi AI</label>
                    <textarea
                      rows={2}
                      value={q.rubric ?? ''}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].rubric = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Tuliskan poin kunci atau bobot kriteria untuk draf penilaian AI..."
                      className="field !h-auto text-xs py-1.5"
                    />
                  </div>
                )}

                {q.question_type === 'LIVE_CODING' && (
                  <div className="space-y-2 pt-1 border-t border-border pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1">
                        <Code2 className="h-3.5 w-3.5" /> Konfigurasi Sandbox Live Coding
                      </span>
                      <select
                        value={q.programming_language ?? 'javascript'}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].programming_language = e.target.value as any;
                          setQuestions(updated);
                        }}
                        className="field text-xs !h-7 w-32 font-sans"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-muted-foreground">Starter Code Mahasiswa:</label>
                      <textarea
                        rows={3}
                        value={q.starter_code ?? ''}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].starter_code = e.target.value;
                          setQuestions(updated);
                        }}
                        className="field !h-auto text-xs font-sans py-1.5 bg-muted/40"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-3 border-t border-border">
            <button
              type="submit"
              disabled={pending}
              className="btn-solid !w-auto text-xs px-5"
            >
              {pending ? 'Menyimpan Ujian...' : 'Terbitkan Ujian Sekarang'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-control border border-border px-4 py-2 text-xs text-muted-foreground hover:bg-muted"
            >
              Batal
            </button>
          </div>
          <Feedback error={error} success={success} tick={0} />
        </form>
      )}
    </div>
  );
}
