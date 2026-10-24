import React from 'react';
import Link from 'next/link';
import {
  Award,
  ShieldAlert,
  Clock,
  AlertCircle,
  FolderArchive,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  getAllQuizzesAction,
  getQuestionBankAction,
} from '@/modules/academic/quiz-actions';
import { listMyClassesAction } from '@/modules/academic/actions';
import { ExamLiveMonitorPanel } from '@/modules/academic/quiz-components';
import { AiQuizGeneratorModal } from '@/modules/academic/ai-quiz-generator-modal';
import { QuestionImportExportModal } from '@/modules/academic/question-import-modal';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

const DEFAULT_SAMPLE_QUESTIONS = [
  {
    id: 'qb-101',
    question_text: 'Jelaskan perbedaan mendasar antara arsitektur Monolithic vs Microservices terkait deployment dan database coupling.',
    question_type: 'ESSAY',
    points: 25,
    difficulty: 'HARD',
    cpl_tag: 'CPL-01: Arsitektur Perangkat Lunak',
    topic_tag: 'Software Engineering (STI2544138)',
  },
  {
    id: 'qb-102',
    question_text: 'Kompleksitas waktu rata-rata (average time complexity) dari algoritma QuickSort adalah:',
    question_type: 'MULTIPLE_CHOICE',
    points: 15,
    difficulty: 'MEDIUM',
    cpl_tag: 'CPL-02: Analisis Algoritmik',
    topic_tag: 'Struktur Data & Algoritma (STI2543131)',
  },
  {
    id: 'qb-103',
    question_text: 'Buatlah fungsi JavaScript solusi(arr, target) yang mengembalikan pasangan indeks array yang jumlahnya sama dengan target.',
    question_type: 'LIVE_CODING',
    points: 30,
    difficulty: 'HARD',
    cpl_tag: 'CPL-04: Implementasi Algoritma',
    topic_tag: 'Coding Practical (STI2543131)',
  },
  {
    id: 'qb-104',
    question_text: 'Protokol HTTP/2 secara bawaan mendukung multiplexing dalam satu koneksi TCP tunggal.',
    question_type: 'TRUE_FALSE',
    points: 10,
    difficulty: 'EASY',
    cpl_tag: 'CPL-03: Jaringan Komputer Modern',
    topic_tag: 'Pemrograman Web (STI2544138)',
  },
  {
    id: 'qb-105',
    question_text: 'Tuliskan kueri SQL untuk mencari 5 transaksi tertinggi pada bulan Oktober 2026 dengan indexing optimal.',
    question_type: 'SHORT_ANSWER',
    points: 20,
    difficulty: 'MEDIUM',
    cpl_tag: 'CPL-05: Pengolahan Basis Data',
    topic_tag: 'Basis Data Terdistribusi (STI2541114)',
  },
  {
    id: 'qb-106',
    question_text: 'Pasangkan metode HTTP dengan sifat idempotency-nya yang tepat (GET, POST, PUT, DELETE).',
    question_type: 'MATCHING',
    points: 15,
    difficulty: 'MEDIUM',
    cpl_tag: 'CPL-01: Protokol Web Standar',
    topic_tag: 'Pemrograman Web (STI2544138)',
  },
];

export default async function ExamSubpage({ params }: PageProps) {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator/monitoring');
  }
  if (role === 'ACADEMIC_STAFF') {
    redirect('/staff');
  }
  if (role === 'STUDENT') {
    redirect('/exams');
  }

  const resolvedParams = await Promise.resolve(params);
  const subroute = resolvedParams?.slug?.[0] || '';
  const [quizzes, rawBank, myClasses] = await Promise.all([
    getAllQuizzesAction().catch(() => []),
    getQuestionBankAction().catch(() => []),
    listMyClassesAction().catch(() => []),
  ]);
  const questionBank = rawBank.length > 0 ? rawBank : DEFAULT_SAMPLE_QUESTIONS;
  const activeExam = quizzes[0] || null;

  if (subroute === 'live') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
        <RetroWindow
          title="Panel Live Pengawasan Ujian"
          badge="Live Proctor"
          headerClassName="bg-gray-soft"
          bodyClassName="p-5 sm:p-7 bg-white"
        >
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-black" />
              <span>Panel Live Pengawasan Ujian</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              Memantau status pengerjaan peserta ujian secara langsung. Deteksi perpindahan tab (<code>visibilitychange</code>), jendela blur, dan keluar mode fullscreen dicatat otomatis dan dapat diintervensi oleh dosen.
            </p>
          </div>
        </RetroWindow>

        {activeExam ? (
          <ExamLiveMonitorPanel
            examId={activeExam.id}
            examTitle={activeExam.title}
            durationMinutes={activeExam.duration_minutes}
          />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 p-8 shadow-retro text-center space-y-3">
            <ShieldAlert className="h-10 w-10 text-black mx-auto" />
            <h3 className="font-heading font-black text-lg text-black">Tidak Ada Ujian yang Sedang Berjalan</h3>
            <p className="text-xs text-black/70 max-w-md mx-auto font-medium">
              Buka sesi ujian dari daftar kelas atau menu Buat Ujian/Kuis untuk mulai memantau peserta.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (subroute === 'question-bank') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
        <RetroWindow
          title="Bank Soal Perkuliahan"
          badge="Bank Soal"
          headerClassName="bg-gray-soft"
          bodyClassName="p-5 sm:p-7 bg-white"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
                <FolderArchive className="h-7 w-7 text-black" />
                <span>Bank Soal Perkuliahan</span>
              </h1>
              <p className="text-xs sm:text-sm text-black/75 font-medium max-w-2xl leading-relaxed">
                Koleksi butir soal pilihan ganda, benar/salah, essay, menjodohkan, dan live coding yang dapat digunakan ulang di seluruh kelas perkuliahan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <QuestionImportExportModal />
              <AiQuizGeneratorModal classes={myClasses} />
              <Link
                href="/classes/c0000000-0000-0000-0000-000000000001?tab=ujian"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Tambah Soal di Kelas</span>
              </Link>
            </div>
          </div>
        </RetroWindow>

        {/* Grid 3 Kolom Soal Full-Width */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-xl text-black">Daftar Soal Tersedia ({questionBank.length})</h2>
            <span className="text-xs font-mono font-bold bg-white text-black px-3 py-1 rounded border-2 border-black shadow-retro-sm">
              Standar Mutu SPMI & OBE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionBank.map((q: any, idx: number) => (
              <div
                key={q.id || idx}
                className={cn(
                  'rounded-2xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-transform',
                  q.needs_revision && 'border-black ring-2 ring-black/40'
                )}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md border-2 border-black bg-white text-xs font-mono font-bold text-black shadow-retro-sm">
                      {q.question_type}
                    </span>
                    <span className="px-2.5 py-1 rounded-md border-2 border-black bg-gray-soft text-xs font-mono font-bold text-black shadow-retro-sm">
                      {q.difficulty || 'MEDIUM'}
                    </span>
                    <span className="text-xs font-mono font-bold text-black">
                      {q.points} Poin
                    </span>
                  </div>

                  {q.is_ai_generated && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-black text-xs font-bold shadow-xs">
                        <Sparkles className="h-3 w-3 text-black" />
                        AI Terverifikasi ({q.approved_by || 'Dosen Pengampu'})
                      </span>
                    </div>
                  )}

                  {q.needs_revision && (
                    <div className="p-2.5 rounded-xl border-2 border-black bg-gray-soft text-black text-xs font-bold flex items-start gap-2 shadow-retro-sm">
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-black" />
                      <div>
                        <span className="block font-mono uppercase text-xs">Peringatan Bank Soal</span>
                        <span className="font-medium text-black/80">Perlu Ditinjau: {q.revision_note || 'Daya pembeda rendah / dicurigai keliru'}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-sm sm:text-base font-bold text-black leading-snug line-clamp-3">
                    {q.question_text}
                  </p>

                  {q.explanation && (
                    <p className="text-xs text-black/75 bg-gray-soft/50 p-2.5 rounded-lg border border-black/20 font-medium">
                      <strong className="text-black">Penjelasan:</strong> {q.explanation}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t-2 border-black/20 space-y-2">
                  {(q.cpl_tag || q.cpmk) && (
                    <span className="text-xs font-mono font-bold text-black bg-gray-soft px-3 py-1 rounded-md border border-black block truncate">
                      {q.cpl_tag || q.cpmk}
                    </span>
                  )}
                  {q.topic_tag && (
                    <span className="text-xs text-black/75 font-mono font-bold block">
                      Topik: {q.topic_tag}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (subroute === 'violations') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
        <RetroWindow
          title="Log Pelanggaran & Integritas Ujian"
          badge="Audit Log"
          headerClassName="bg-gray-soft"
          bodyClassName="p-5 sm:p-7 bg-white"
        >
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <AlertCircle className="h-7 w-7 text-black" />
              <span>Log Pelanggaran & Integritas Ujian</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              Catatan perilaku peserta ujian (tab switch, window blur, keluar fullscreen, copy-paste) yang tercatat secara kronologis. Dosen dapat meninjau durasi dan frekuensi anomali sebelum memvalidasi nilai akhir.
            </p>
          </div>
        </RetroWindow>

        {/* Kartu Grid Log Kejadian Full Width */}
        <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="font-heading font-black text-xl text-black">Log Kejadian Real-Time Integritas</h2>
            <span className="text-xs font-mono font-bold bg-white text-black px-3 py-1 rounded border-2 border-black shadow-retro-sm">
              Status: Append-Only Immutable
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-black bg-white px-2.5 py-1 rounded border-2 border-black shadow-xs">
                  2024001 - Ahmad Fauzi
                </span>
                <span className="text-xs font-mono font-bold text-black bg-gray-soft px-2.5 py-1 rounded border-2 border-black">
                  TAB_SWITCH
                </span>
              </div>
              <p className="text-sm font-bold text-black">
                Pindah tab browser selama <strong>4 detik</strong> saat mengerjakan Soal Coding No. 4.
              </p>
              <div className="text-xs font-mono font-bold text-black/70 pt-2 border-t border-black/20 flex justify-between">
                <span>09:15:22 WIB</span>
                <span>UTS STI2544138</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-black bg-white px-2.5 py-1 rounded border-2 border-black shadow-xs">
                  2024018 - Rian Hidayat
                </span>
                <span className="text-xs font-mono font-bold text-white bg-black px-2.5 py-1 rounded border-2 border-black">
                  EXIT_FULLSCREEN
                </span>
              </div>
              <p className="text-sm font-bold text-black">
                Keluar dari mode fullscreen. Peringatan ke-1 ditampilkan kepada mahasiswa.
              </p>
              <div className="text-xs font-mono font-bold text-black/70 pt-2 border-t border-black/20 flex justify-between">
                <span>09:18:04 WIB</span>
                <span>UTS STI2544138</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-black bg-white px-2.5 py-1 rounded border-2 border-black shadow-xs">
                  2024025 - Siti Rahma
                </span>
                <span className="text-xs font-mono font-bold text-black bg-gray-soft px-2.5 py-1 rounded border-2 border-black">
                  WINDOW_BLUR
                </span>
              </div>
              <p className="text-sm font-bold text-black">
                Jendela browser kehilangan fokus selama <strong>2 detik</strong> (notifikasi desktop).
              </p>
              <div className="text-xs font-mono font-bold text-black/70 pt-2 border-t border-black/20 flex justify-between">
                <span>09:22:45 WIB</span>
                <span>UTS STI2544138</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subroute === 'disputes') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
        <RetroWindow
          title="Sengketa & Sanggahan Nilai Ujian"
          badge="Sengketa Nilai"
          headerClassName="bg-gray-soft"
          bodyClassName="p-5 sm:p-7 bg-white"
        >
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <Clock className="h-7 w-7 text-black" />
              <span>Sengketa & Sanggahan Nilai Ujian</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              Mahasiswa berhak mengajukan sanggahan nilai secara berkeadilan jika terdapat ambiguitas soal atau kendala teknis saat ujian. Dosen dapat meninjau rekaman jawaban dan menyesuaikan nilai secara transparan.
            </p>
          </div>
        </RetroWindow>

        {/* Grid 2 Kolom Sanggahan Aktif Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-gray-soft text-black px-3 py-1 rounded border-2 border-black shadow-retro-sm">
                  MENUNGGU REVIEW DOSEN
                </span>
                <span className="text-xs font-mono font-bold text-black/70">Kemarin, 14:20 WIB</span>
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-black leading-snug">
                  Sanggahan Soal Coding No. 4 (STI2544138)
                </h3>
                <p className="text-xs font-bold text-black/70 mt-0.5">Diajukan oleh: 2024001 - Ahmad Fauzi</p>
              </div>
              <p className="text-xs sm:text-sm text-black bg-gray-soft/40 p-4 rounded-xl border-2 border-black leading-relaxed font-medium">
                &quot;Pada test case 2 soal nomor 4, format JSON output sudah memenuhi requirement namun parser memberikan nilai parsial 50% karena perbedaan trailing whitespace di newline.&quot;
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t-2 border-black/20">
              <button className="flex-1 py-2.5 rounded-xl border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-retro cursor-pointer">
                <CheckCircle2 className="h-4 w-4" /> Setujui (+10 Poin)
              </button>
              <button className="px-5 py-2.5 rounded-xl border-2 border-black bg-white text-black text-xs font-bold hover:bg-gray-soft transition-all flex items-center gap-2 shadow-retro-sm cursor-pointer">
                <XCircle className="h-4 w-4" /> Tolak
              </button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-white text-black px-3 py-1 rounded border-2 border-black shadow-retro-sm">
                  DISETUJUI & DISAHKAN
                </span>
                <span className="text-xs font-mono font-bold text-black/70">2 hari lalu</span>
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-black leading-snug">
                  Sanggahan Pilihan Ganda No. 8 (STI2543131)
                </h3>
                <p className="text-xs font-bold text-black/70 mt-0.5">Diajukan oleh: 2024018 - Rian Hidayat</p>
              </div>
              <p className="text-xs sm:text-sm text-black bg-gray-soft/40 p-4 rounded-xl border-2 border-black leading-relaxed font-medium">
                &quot;Kunci jawaban soal no. 8 menunjuk opsi B, namun buku rujukan edisi terbaru menyatakan opsi C juga valid karena implementasi compiler C99.&quot;
              </p>
            </div>
            <div className="pt-3 border-t-2 border-black/20 text-xs font-bold text-black">
              ✓ Nilai telah disesuaikan (+5 Poin) oleh Dr. Budi Santoso, M.Kom.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Create / Review / General Exam Management
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title={subroute.replace('-', ' ') || 'Manajemen Ujian'}
        badge="Ujian & Kuis"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <Award className="h-7 w-7 text-black" />
              <span className="capitalize">{subroute.replace('-', ' ') || 'Manajemen Ujian'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              Kelola pembuatan ujian, tinjau jawaban essay/coding berbantuan AI, dan verifikasi integritas hasil belajar mahasiswa.
            </p>
          </div>
          <Link
            href="/exams"
            className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white text-xs font-bold shrink-0 hover:bg-neutral-800 transition-all"
          >
            Semua Ujian & Kuis &rarr;
          </Link>
        </div>
      </RetroWindow>

      {/* Grid 3 Kolom Aksi Evaluasi Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/exams/live"
          className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro hover:-translate-y-0.5 transition-all space-y-3 block"
        >
          <div className="p-3 w-fit rounded-xl border-2 border-black bg-gray-soft shadow-retro-sm">
            <ShieldAlert className="h-6 w-6 text-black" />
          </div>
          <h3 className="font-heading font-black text-lg text-black">Panel Live Pengawasan</h3>
          <p className="text-xs text-black/70 leading-relaxed font-medium">
            Pantau aktivitas ujian, anomali tab switch, dan progres pengerjaan mahasiswa secara real-time.
          </p>
        </Link>

        <Link
          href="/exams/question-bank"
          className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro hover:-translate-y-0.5 transition-all space-y-3 block"
        >
          <div className="p-3 w-fit rounded-xl border-2 border-black bg-gray-soft shadow-retro-sm">
            <FolderArchive className="h-6 w-6 text-black" />
          </div>
          <h3 className="font-heading font-black text-lg text-black">Bank Soal Perkuliahan</h3>
          <p className="text-xs text-black/70 leading-relaxed font-medium">
            Kelola butir soal terstandarisasi, tag CPL OBE, tingkat kesulitan, dan kunci rubrik terpusat.
          </p>
        </Link>

        <Link
          href="/lecturer/disputes"
          className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro hover:-translate-y-0.5 transition-all space-y-3 block"
        >
          <div className="p-3 w-fit rounded-xl border-2 border-black bg-gray-soft shadow-retro-sm">
            <Clock className="h-6 w-6 text-black" />
          </div>
          <h3 className="font-heading font-black text-lg text-black">Sengketa Nilai Mahasiswa</h3>
          <p className="text-xs text-black/70 leading-relaxed font-medium">
            Tinjau sanggahan nilai ujian dan perbaiki skor mahasiswa secara transparan dan berkeadilan.
          </p>
        </Link>
      </div>
    </div>
  );
}
