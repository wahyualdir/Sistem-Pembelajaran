'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  Award,
  Plus,
  Trash2,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Maximize2,
  Code2,
  Play,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Users,
  BarChart3,
  MessageSquare,
  FileText,
  Lock,
  Download,
  Terminal,
} from 'lucide-react';
import {
  createQuizAction,
  submitQuizAttemptAction,
  recordExamEventAction,
  executeLiveCodeAction,
  gradeEssayQuestionAction,
  getExamLiveStatusAction,
  lecturerInterventionAction,
  submitExamDisputeAction,
  resolveExamDisputeAction,
  getExamAnalyticsAction,
  getQuestionBankAction,
  type QuizItem,
  type QuizQuestion,
  type QuizAttempt,
  type ExamEvent,
  type ExamStudentLiveStatus,
  type QuestionType,
} from './quiz-actions';
import { Feedback } from './class-forms';

// ==========================================
// 1. CREATE QUIZ & EXAM MODAL (DOSEN)
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
                  className="field text-sm font-mono"
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
                  className="rounded-control border border-border px-2 py-1 text-[11px] hover:bg-muted font-medium"
                >
                  + Pilgan
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('TRUE_FALSE')}
                  className="rounded-control border border-border px-2 py-1 text-[11px] hover:bg-muted font-medium"
                >
                  + B / S
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('SHORT_ANSWER')}
                  className="rounded-control border border-border px-2 py-1 text-[11px] hover:bg-muted font-medium"
                >
                  + Isian
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('ESSAY')}
                  className="rounded-control border border-border px-2 py-1 text-[11px] hover:bg-muted font-medium"
                >
                  + Esai
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('LIVE_CODING')}
                  className="rounded-control border border-border px-2 py-1 text-[11px] hover:bg-muted font-medium"
                >
                  + Live Coding
                </button>
              </div>
            </div>

            {questions.map((q, qIdx) => (
              <div key={q.id || qIdx} className="rounded-control border border-border bg-background p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs font-mono bg-muted px-2 py-0.5 rounded">Soal #{qIdx + 1}</span>
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">{q.question_type}</span>
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
                      className="field text-xs !h-7 w-20 text-center font-mono"
                      title="Bobot Nilai Soal"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-danger hover:opacity-80 p-1"
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
                    <span className="text-[11px] font-medium text-muted-foreground block">
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
                        <span className="text-xs font-mono font-bold w-4">{String.fromCharCode(65 + optIdx)}.</span>
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
                      className="field text-xs !h-8 font-mono"
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
                        className="field text-xs !h-7 w-32 font-mono"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-muted-foreground">Starter Code Mahasiswa:</label>
                      <textarea
                        rows={3}
                        value={q.starter_code ?? ''}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].starter_code = e.target.value;
                          setQuestions(updated);
                        }}
                        className="field !h-auto text-xs font-mono py-1.5 bg-muted/40"
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

// ==========================================
// 2. TAKE QUIZ & EXAM FORM (MAHASISWA)
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
  }, [existingAttempt, hasConsented, passcodeVerified]);

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

  const handleSubmitAuto = () => {
    startTransition(async () => {
      await submitQuizAttemptAction(quiz.id, answers, violations);
      router.refresh();
    });
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
              <span className="text-xs font-bold text-black bg-retro-mint border-2 border-black px-3 py-1 rounded shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Ujian Selesai Dikerjakan
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded border-2 border-black shadow-[1.5px_1.5px_0px_#000] ${isPassed ? 'text-black bg-retro-yellow' : 'text-white bg-danger'}`}>
                {isPassed ? 'Memenuhi KKM' : 'Di Bawah KKM'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-black/80 font-medium mt-2">
              Dikumpulkan pada: {new Date(existingAttempt.submitted_at).toLocaleString('id-ID')} WIB
              {existingAttempt.violations_count ? ` • Catatan: ${existingAttempt.violations_count} anomali proctoring` : ''}
            </p>
          </div>
          <div className="text-left sm:text-right bg-retro-warm border-2 border-black p-4 rounded-xl shadow-retro">
            <span className="text-xs text-black/70 font-bold block">Nilai Perolehan Akhir</span>
            <div className="text-3xl sm:text-4xl font-bold font-mono text-black">
              {existingAttempt.score}
              <span className="text-sm sm:text-base font-normal text-black/60"> / {existingAttempt.max_score}</span>
            </div>
          </div>
        </div>

        {/* Dispute Status if submitted */}
        {existingAttempt.dispute && (
          <div className="p-4 rounded-xl border-2 border-black bg-retro-warm/50 text-xs sm:text-sm space-y-1.5 shadow-retro">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-black">
                <MessageSquare className="h-4 w-4 text-retro-orange" /> Status Sengketa Nilai:
              </span>
              <span className="font-mono uppercase font-bold px-2 py-0.5 rounded border border-black bg-white text-black">
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
                className="text-xs font-bold text-black hover:text-retro-orange flex items-center gap-1.5 border-2 border-black px-2.5 py-1 rounded bg-white shadow-retro hover:bg-retro-warm transition-all"
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
                  <span className="font-bold font-mono text-xs text-black/70">
                    Soal #{idx + 1} ({q.points} Poin) • <span className="font-mono text-[11px] font-bold">{q.question_type}</span>
                  </span>
                  {q.question_type !== 'ESSAY' && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] ${
                        isCorrect ? 'text-black bg-retro-mint' : 'text-white bg-danger'
                      }`}
                    >
                      {isCorrect ? `Benar (+${q.points})` : 'Salah (0)'}
                    </span>
                  )}
                  {q.question_type === 'ESSAY' && aiDraft && (
                    <span className="text-xs font-bold text-black bg-retro-warm border border-black px-2.5 py-0.5 rounded">
                      Draf AI: +{aiDraft.ai_score} Poin {aiDraft.verified_by_lecturer ? '(Disahkan)' : '(Menunggu Review)'}
                    </span>
                  )}
                </div>

                <p className="font-bold text-sm sm:text-base text-black leading-relaxed">{q.question_text}</p>

                {q.question_type === 'MULTIPLE_CHOICE' && (
                  <div className="text-xs sm:text-sm text-black/80 space-y-1 pt-1">
                    <p>
                      Jawaban Anda:{' '}
                      <strong className="text-black bg-retro-warm px-2 py-0.5 rounded border border-black/30 font-bold">
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
                    <strong className="text-black bg-retro-warm px-2 py-0.5 rounded border border-black/30 font-bold">
                      {String(myAns) === 'true' ? 'Benar' : 'Salah'}
                    </strong>
                  </p>
                )}

                {q.question_type === 'SHORT_ANSWER' && (
                  <div className="text-xs sm:text-sm text-black/80 space-y-1">
                    <p>
                      Jawaban Anda:{' '}
                      <strong className="text-black font-mono bg-retro-warm px-2 py-0.5 rounded border border-black/30">
                        {String(myAns ?? '-')}
                      </strong>
                    </p>
                    {q.correct_text && (
                      <p className="text-black font-bold">
                        Kunci:{' '}
                        <span className="font-mono bg-retro-mint/60 px-2 py-0.5 rounded border border-black/30">
                          {q.correct_text}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {q.question_type === 'LIVE_CODING' && (
                  <div className="rounded-lg border-2 border-black bg-black text-retro-mint p-3 text-xs font-mono whitespace-pre-wrap shadow-retro">
                    {String(myAns ?? '')}
                  </div>
                )}

                {q.question_type === 'ESSAY' && (
                  <div className="space-y-2 pt-1">
                    <div className="rounded-lg border-2 border-black bg-retro-warm/30 p-3 text-xs sm:text-sm text-black">
                      {String(myAns ?? '')}
                    </div>
                    {aiDraft && (
                      <p className="text-xs text-black/80 italic border-l-4 border-retro-orange pl-3 py-1 bg-retro-warm/20 rounded-r">
                        Feedback AI: {aiDraft.feedback}
                      </p>
                    )}
                  </div>
                )}

                {q.explanation && (
                  <div className="mt-2 p-3 rounded-lg bg-retro-warm/40 text-xs sm:text-sm text-black border border-black/20">
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
              <HelpCircle className="h-4 w-4 text-retro-orange" /> Pengajuan Sengketa / Klarifikasi Nilai
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
                className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-bold text-black hover:bg-retro-warm shadow-retro transition-all"
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
        <div className="w-full rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_#000000] overflow-hidden transition-all animate-fade-up font-sans">
          {resultBody}
        </div>
      );
    }

    return (
      <div className="w-full rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden transition-all animate-fade-up font-sans">
        {/* Retro Window Header Bar */}
        <div className="flex h-12 sm:h-14 items-center justify-between border-b-2 border-black bg-retro-warm px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
              <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
              <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
            </div>
            <span className="text-sm sm:text-base font-bold text-black tracking-tight font-heading ml-1.5 truncate">
              Hasil Evaluasi: {quiz.title}
            </span>
          </div>
          <span
            className={`rounded border-2 border-black px-2.5 py-0.5 text-xs font-bold font-mono shadow-[1.5px_1.5px_0px_#000] shrink-0 ${
              isPassed ? 'bg-retro-mint text-black' : 'bg-danger text-white'
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
            <span className="text-xs font-mono font-bold text-black/60 bg-retro-warm px-2 py-0.5 rounded border border-black/20">
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
              <span className="font-mono text-xs font-bold bg-retro-orange text-white px-2.5 py-1 rounded border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
                {quiz.exam_type ?? 'UJIAN RESMI'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-black bg-retro-warm border-2 border-black/30 px-2.5 py-0.5 rounded font-mono">
                ⏱️ Durasi: {quiz.duration_minutes} Menit
              </span>
              {quiz.kkm && (
                <span className="text-xs sm:text-sm font-bold text-black bg-white border-2 border-black/30 px-2.5 py-0.5 rounded font-mono">
                  🎯 KKM: {quiz.kkm}
                </span>
              )}
              <span className="text-xs sm:text-sm font-bold text-black bg-white border-2 border-black/30 px-2.5 py-0.5 rounded font-mono">
                📊 Total: {quiz.total_points} Poin
              </span>
              <span className="text-xs sm:text-sm font-bold text-black bg-retro-yellow border-2 border-black/30 px-2.5 py-0.5 rounded font-mono">
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
            <ShieldAlert className="h-5 w-5 text-retro-orange shrink-0" />
            <span>Tata Tertib & Ketentuan Pengawasan (Proctoring)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3.5 rounded-lg border-2 border-black bg-retro-warm/60 shadow-retro">
              <Eye className="h-5 w-5 text-retro-orange shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-black block">Fokus Jendela & Layar Penuh</span>
                <span className="text-xs text-black/75 font-medium leading-relaxed block">
                  Beralih tab browser atau keluar dari mode layar penuh akan dicatat otomatis ke log dosen.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-lg border-2 border-black bg-retro-warm/60 shadow-retro">
              <Lock className="h-5 w-5 text-retro-orange shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-black block">Proteksi Integritas</span>
                <span className="text-xs text-black/75 font-medium leading-relaxed block">
                  Fitur salin-tempel (copy/paste) dan klik kanan dinonaktifkan demi integritas akademik.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-lg border-2 border-black bg-retro-warm/60 shadow-retro">
              <Clock className="h-5 w-5 text-retro-orange shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-black block">Sinkronisasi Waktu Server</span>
                <span className="text-xs text-black/75 font-medium leading-relaxed block">
                  Waktu pengerjaan dihitung akurat dari jam server, bukan jam perangkat lokal Anda.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-lg border-2 border-black bg-retro-warm/60 shadow-retro">
              <ShieldCheck className="h-5 w-5 text-retro-orange shrink-0 mt-0.5" />
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
                className="w-full rounded-lg border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black shadow-retro focus:outline-none focus:ring-2 focus:ring-black"
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
            {error && <p className="text-xs text-danger font-bold">{error}</p>}
          </div>
        )}

        {/* Consent Checkbox */}
        <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-retro-warm/40">
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
          <span className="text-xs text-black/60 font-mono hidden sm:inline-block">
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
        <div className="w-full rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_#000000] overflow-hidden transition-all animate-fade-up font-sans">
          {cardBody}
        </div>
      );
    }

    return (
      <div className="w-full rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden transition-all animate-fade-up font-sans">
        {/* Retro Window Header Bar */}
        <div className="flex h-12 sm:h-14 items-center justify-between border-b-2 border-black bg-retro-warm px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
              <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
              <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
            </div>
            <span className="text-sm sm:text-base font-bold text-black tracking-tight font-heading ml-1.5 truncate">
              Lembar Pengerjaan: {quiz.title}
            </span>
          </div>
          <span className="rounded border-2 border-black bg-white px-2.5 py-0.5 text-xs font-bold font-mono text-black shadow-[1.5px_1.5px_0px_#000] shrink-0">
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
        <div className="rounded-xl border-2 border-danger bg-danger-soft p-4 text-xs sm:text-sm text-danger font-bold flex items-center justify-between shadow-retro">
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
      <div className="sticky top-2 z-20 rounded-xl border-2 border-black bg-retro-warm/95 backdrop-blur px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[4px_4px_0px_#000]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${timeLeft <= 300 ? 'text-danger animate-pulse' : 'text-retro-orange'}`} />
            <span className="text-xs sm:text-sm text-black font-bold">Sisa Waktu:</span>
            <span className={`font-mono text-base sm:text-lg font-bold ${timeLeft <= 300 ? 'text-danger' : 'text-black'}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>
          {violations > 0 && (
            <span className="text-xs font-mono text-danger bg-danger-soft border border-danger px-2.5 py-0.5 rounded-full font-bold">
              {violations} Catatan Peringatan
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {quiz.require_fullscreen && !isFullscreen && (
            <button
              type="button"
              onClick={requestFullscreenMode}
              className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs sm:text-sm hover:bg-retro-warm font-bold flex items-center gap-1.5 text-black shadow-retro"
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
                <span className="font-bold text-xs sm:text-sm font-mono bg-retro-warm border border-black/30 px-2.5 py-0.5 rounded text-black">Soal #{idx + 1}</span>
                <span className="text-xs text-black/70 uppercase font-mono font-bold">{q.question_type}</span>
              </div>
              <span className="text-xs sm:text-sm font-mono bg-retro-warm border border-black/30 px-2.5 py-0.5 rounded text-black font-bold">
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
                        ? 'bg-retro-yellow text-black shadow-[3px_3px_0px_#000]'
                        : 'bg-white hover:bg-retro-warm text-black'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      checked={answers[q.id] === optIdx}
                      onChange={() => setAnswers({ ...answers, [q.id]: optIdx })}
                      className="h-4 w-4 text-black accent-black"
                    />
                    <span className="font-mono text-xs font-bold w-4">{String.fromCharCode(65 + optIdx)}.</span>
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
                      ? 'bg-retro-yellow text-black shadow-[3px_3px_0px_#000]'
                      : 'bg-white hover:bg-retro-warm text-black'
                  }`}
                >
                  BENAR (TRUE)
                </button>
                <button
                  type="button"
                  onClick={() => setAnswers({ ...answers, [q.id]: false })}
                  className={`p-3.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold text-center shadow-retro transition-all ${
                    answers[q.id] === false
                      ? 'bg-retro-yellow text-black shadow-[3px_3px_0px_#000]'
                      : 'bg-white hover:bg-retro-warm text-black'
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
                  className="w-full rounded-lg border-2 border-black bg-white px-3.5 py-2 font-mono text-sm text-black shadow-retro focus:outline-none focus:ring-2 focus:ring-black"
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
                  <span className="font-mono font-bold">{String(answers[q.id] ?? '').split(/\s+/).filter(Boolean).length} kata</span>
                </div>
              </div>
            )}

            {/* Live Coding */}
            {q.question_type === 'LIVE_CODING' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                    <Code2 className="h-3.5 w-3.5" /> Editor ({q.programming_language})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRunPublicTests(q)}
                    disabled={isRunningCode === q.id}
                    className="rounded-lg border-2 border-black bg-white px-3 py-1 text-xs hover:bg-retro-warm font-mono font-bold flex items-center gap-1.5 text-black shadow-retro"
                  >
                    <Play className="h-3 w-3" /> {isRunningCode === q.id ? 'Menguji...' : 'Uji Test Case Publik'}
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={String(answers[q.id] ?? q.starter_code ?? '')}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full rounded-lg border-2 border-black p-3.5 text-xs font-mono bg-neutral-900 text-neutral-100 shadow-retro leading-relaxed"
                  spellCheck={false}
                />

                {/* Console Output Terminal */}
                {codeRunOutput[q.id] && (
                  <div className="rounded-lg border-2 border-black bg-retro-warm p-4 space-y-1.5 shadow-retro">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-black font-bold">
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
        <span className="text-xs text-black/70 font-mono font-bold">
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

// ==========================================
// 3. PANEL LIVE MONITORING (DOSEN)
// ==========================================
export function ExamLiveMonitorPanel({
  examId,
  examTitle,
  durationMinutes,
}: {
  examId: string;
  examTitle?: string;
  durationMinutes?: number;
}) {
  const router = useRouter();
  const [data, setData] = useState<{
    students: ExamStudentLiveStatus[];
    events: ExamEvent[];
    stats: { total: number; in_progress: number; submitted: number; terminated: number; total_violations: number };
  } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<ExamStudentLiveStatus | null>(null);
  const [warningMsg, setWarningMsg] = useState('');
  const [extraMinutes, setExtraMinutes] = useState(10);
  const [pending, startTransition] = useTransition();

  const fetchLive = async () => {
    const res = await getExamLiveStatusAction(examId);
    setData(res);
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 5000); // 5s polling for live proctoring
    return () => clearInterval(interval);
  }, [examId]);

  const handleAction = (
    studentId: string,
    action: 'WARN' | 'ADD_TIME' | 'PAUSE' | 'RESUME' | 'TERMINATE' | 'RESET',
    val?: string | number
  ) => {
    startTransition(async () => {
      await lecturerInterventionAction({
        exam_id: examId,
        student_id: studentId,
        action_type: action,
        value: val,
      });
      fetchLive();
    });
  };

  if (!data) {
    return <div className="text-xs text-muted-foreground py-4">Memuat data live monitoring ujian...</div>;
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-[11px] text-muted-foreground block">Total Peserta</span>
          <span className="text-xl font-bold font-mono">{data.stats.total}</span>
        </div>
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-[11px] text-muted-foreground block">Mengerjakan</span>
          <span className="text-xl font-bold font-mono text-primary">{data.stats.in_progress}</span>
        </div>
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-[11px] text-muted-foreground block">Selesai</span>
          <span className="text-xl font-bold font-mono text-success">{data.stats.submitted}</span>
        </div>
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-[11px] text-muted-foreground block">Dihentikan</span>
          <span className="text-xl font-bold font-mono text-danger">{data.stats.terminated}</span>
        </div>
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-[11px] text-muted-foreground block">Total Pelanggaran</span>
          <span className="text-xl font-bold font-mono text-danger">{data.stats.total_violations}</span>
        </div>
      </div>

      {/* Student Live Grid */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
          Grid Status Peserta Realtime
        </h4>

        {data.students.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground rounded-control border border-border bg-background">
            Belum ada mahasiswa yang masuk ke sesi pengerjaan ujian ini.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.students.map((st) => (
              <div
                key={st.student_id}
                className={`p-4 rounded-control border bg-surface space-y-2.5 transition-all ${
                  st.violations_count > 0 ? 'border-danger/60' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs block text-foreground">{st.student_name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{st.student_id}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase font-mono ${
                      st.status === 'IN_PROGRESS'
                        ? 'text-primary bg-primary-soft'
                        : st.status === 'SUBMITTED'
                        ? 'text-success bg-success-soft'
                        : 'text-danger bg-danger-soft'
                    }`}
                  >
                    {st.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pelanggaran: <strong className={st.violations_count > 0 ? 'text-danger font-mono' : ''}>{st.violations_count}x</strong></span>
                  {st.extra_minutes && <span>+{st.extra_minutes}m ekstra</span>}
                </div>

                {st.last_event && (
                  <p className="text-[11px] text-danger bg-danger-soft/60 px-2 py-1 rounded truncate">
                    {st.last_event.event_type}: {st.last_event.details}
                  </p>
                )}

                {/* Intervention Controls */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleAction(st.student_id, 'ADD_TIME', 10)}
                    className="rounded-control border border-border px-2 py-0.5 text-[10px] hover:bg-muted font-medium"
                    title="Tambah 10 menit waktu"
                  >
                    +10m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(st.student_id, 'WARN', 'Perhatikan pandangan Anda dan jangan berpindah tab!')}
                    className="rounded-control border border-border px-2 py-0.5 text-[10px] hover:bg-muted font-medium text-warning"
                    title="Kirim Peringatan"
                  >
                    Peringatkan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(st.student_id, 'TERMINATE')}
                    className="rounded-control border border-border px-2 py-0.5 text-[10px] hover:bg-muted font-medium text-danger"
                    title="Hentikan Ujian"
                  >
                    Hentikan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Events Feed Ticker */}
      <div className="p-4 rounded-control border border-border bg-background space-y-3">
        <h4 className="font-semibold text-xs flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Live Proctoring Feed & Ticker
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
          {data.events.length === 0 ? (
            <p className="text-muted-foreground text-[11px]">Belum ada aktivitas proctoring tercatat.</p>
          ) : (
            data.events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-2 rounded border border-border/60 bg-surface">
                <div>
                  <span className="font-semibold text-foreground">{ev.student_name}</span>{' '}
                  <span className="text-danger font-mono font-medium">[{ev.event_type}]</span>{' '}
                  <span className="text-muted-foreground">{ev.details}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date(ev.created_at).toLocaleTimeString('id-ID')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. EXAM ANALYTICS & REKAP MODAL (DOSEN)
// ==========================================
export function ExamAnalyticsModal({ examId }: { examId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadAnalytics = async () => {
    const res = await getExamAnalyticsAction(examId);
    setAnalytics(res);
    setIsOpen(true);
  };

  const exportCSV = () => {
    if (!analytics) return;
    const rows = [
      ['ID Soal', 'Teks Soal', 'Indeks Kesukaran', 'Kategori'],
      ...analytics.difficulty_analysis.map((d: any) => [
        d.question_id,
        `"${d.question_text.replace(/"/g, '""')}"`,
        d.difficulty_index,
        d.category,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Analisis_Butir_Soal_${examId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <button
        type="button"
        onClick={loadAnalytics}
        className="rounded-control border border-border px-3 py-1.5 text-xs hover:bg-muted font-medium flex items-center gap-1.5"
      >
        <BarChart3 className="h-3.5 w-3.5 text-primary" /> Analisis Butir Soal & Nilai
      </button>

      {isOpen && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-control border-2 border-black bg-surface p-6 space-y-4 max-w-2xl w-full shadow-retro max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Analisis Hasil: {analytics.exam_title}</h3>
                <p className="text-xs text-muted-foreground">Distribusi skor, tingkat kelulusan KKM, dan daya beda soal.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-mono font-bold hover:opacity-70 px-2 py-1"
              >
                [X]
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-control border border-border bg-background">
                <span className="text-[11px] text-muted-foreground block">Rata-Rata</span>
                <span className="text-xl font-bold font-mono">{analytics.average_score}</span>
              </div>
              <div className="p-3 rounded-control border border-border bg-background">
                <span className="text-[11px] text-muted-foreground block">Tertinggi</span>
                <span className="text-xl font-bold font-mono text-success">{analytics.highest_score}</span>
              </div>
              <div className="p-3 rounded-control border border-border bg-background">
                <span className="text-[11px] text-muted-foreground block">Terendah</span>
                <span className="text-xl font-bold font-mono text-danger">{analytics.lowest_score}</span>
              </div>
              <div className="p-3 rounded-control border border-border bg-background">
                <span className="text-[11px] text-muted-foreground block">Lulus KKM</span>
                <span className="text-xl font-bold font-mono text-primary">{analytics.passing_rate_percentage}%</span>
              </div>
            </div>

            {/* Item Analysis Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs">Analisis Daya Pembeda & Kesukaran Soal</h4>
                <button
                  type="button"
                  onClick={exportCSV}
                  className="rounded-control border border-border px-2.5 py-1 text-xs hover:bg-muted font-medium flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Ekspor CSV
                </button>
              </div>

              <div className="border border-border rounded-control overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Teks Soal</th>
                      <th className="p-2.5 text-center">Indeks Kesukaran</th>
                      <th className="p-2.5 text-center">Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analytics.difficulty_analysis.map((row: any) => (
                      <tr key={row.question_id} className="hover:bg-muted/40">
                        <td className="p-2.5">{row.question_text}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{row.difficulty_index}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.category === 'Mudah'
                                ? 'bg-success-soft text-success'
                                : row.category === 'Sukar'
                                ? 'bg-danger-soft text-danger'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {row.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. LECTURER EXAM VIEW (PANEL DOSEN BER-TAB CLEAN)
// ==========================================
export function LecturerExamView({
  quiz,
  courseTitle,
}: {
  quiz: QuizItem;
  courseTitle: string;
}) {
  const [activeTab, setActiveTab] = useState<'monitor' | 'preview'>('preview');

  return (
    <div className="space-y-6 animate-fade-up font-sans">
      {/* Clean Retro Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2.5 border-b-2 border-black/15 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black text-xs sm:text-sm font-bold transition-all shadow-retro ${
            activeTab === 'monitor'
              ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
              : 'bg-white text-black hover:bg-retro-warm'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Panel Pengawas Live (Real-Time)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black text-xs sm:text-sm font-bold transition-all shadow-retro ${
            activeTab === 'preview'
              ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
              : 'bg-white text-black hover:bg-retro-warm'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Pratinjau Lembar Ujian Mahasiswa</span>
        </button>
      </div>

      {activeTab === 'monitor' ? (
        <ExamLiveMonitorPanel examId={quiz.id} />
      ) : (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg border-2 border-black bg-retro-warm text-xs font-bold text-black flex items-center gap-2 shadow-retro">
            <span>ℹ️ Mode Pratinjau: Menampilkan simulasi lembar ujian yang akan dikerjakan oleh mahasiswa.</span>
          </div>
          <TakeQuizForm quiz={quiz} existingAttempt={null} courseTitle={courseTitle} hideHeaderWindow={true} />
        </div>
      )}
    </div>
  );
}
