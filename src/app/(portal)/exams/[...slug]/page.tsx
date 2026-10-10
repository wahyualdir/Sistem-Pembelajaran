import React from 'react';
import Link from 'next/link';
import {
  Award,
  ShieldAlert,
  Clock,
  CheckSquare,
  AlertCircle,
  FolderArchive,
  PlusCircle,
  Layers,
  ArrowRight,
  UserCheck,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Terminal,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  getAllQuizzesAction,
  getQuestionBankAction,
  getExamLiveStatusAction,
} from '@/modules/academic/quiz-actions';
import { ExamLiveMonitorPanel, CreateQuizModal } from '@/modules/academic/quiz-components';

interface PageProps {
  params: {
    slug: string[];
  };
}

const DEFAULT_SAMPLE_QUESTIONS = [
  {
    id: 'qb-101',
    question_text: 'Jelaskan perbedaan mendasar antara arsitektur Monolithic vs Microservices terkait deployment dan database coupling.',
    question_type: 'ESSAY',
    points: 25,
    difficulty: 'HARD',
    cpl_tag: 'CPL-01: Arsitektur Perangkat Lunak',
    topic_tag: 'Software Engineering',
  },
  {
    id: 'qb-102',
    question_text: 'Kompleksitas waktu rata-rata (average time complexity) dari algoritma QuickSort adalah:',
    question_type: 'MULTIPLE_CHOICE',
    points: 15,
    difficulty: 'MEDIUM',
    cpl_tag: 'CPL-02: Analisis Algoritmik',
    topic_tag: 'Struktur Data & Algoritma',
  },
  {
    id: 'qb-103',
    question_text: 'Buatlah fungsi JavaScript solusi(arr, target) yang mengembalikan pasangan indeks array yang jumlahnya sama dengan target.',
    question_type: 'LIVE_CODING',
    points: 30,
    difficulty: 'HARD',
    cpl_tag: 'CPL-04: Implementasi Algoritma',
    topic_tag: 'Coding Practical',
  },
  {
    id: 'qb-104',
    question_text: 'Protokol HTTP/2 secara bawaan mendukung multiplexing dalam satu koneksi TCP tunggal.',
    question_type: 'TRUE_FALSE',
    points: 10,
    difficulty: 'EASY',
    cpl_tag: 'CPL-03: Jaringan Komputer Modern',
    topic_tag: 'Computer Networks',
  },
  {
    id: 'qb-105',
    question_text: 'Tuliskan kueri SQL untuk mencari 5 transaksi tertinggi pada bulan Oktober 2026 dengan indexing optimal.',
    question_type: 'SHORT_ANSWER',
    points: 20,
    difficulty: 'MEDIUM',
    cpl_tag: 'CPL-05: Pengolahan Basis Data',
    topic_tag: 'Database Management',
  },
  {
    id: 'qb-106',
    question_text: 'Pasangkan metode HTTP dengan sifat idempotency-nya yang tepat (GET, POST, PUT, DELETE).',
    question_type: 'MATCHING',
    points: 15,
    difficulty: 'MEDIUM',
    cpl_tag: 'CPL-01: Protokol Web Standar',
    topic_tag: 'Web Standards',
  },
];

export default async function ExamSubpage({ params }: PageProps) {
  const subroute = params.slug?.[0] || '';
  const quizzes = await getAllQuizzesAction().catch(() => []);
  const rawBank = await getQuestionBankAction().catch(() => []);
  const questionBank = rawBank.length > 0 ? rawBank : DEFAULT_SAMPLE_QUESTIONS;
  const activeExam = quizzes[0] || null;

  if (subroute === 'live') {
    return (
      <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
        <RetroWindow
          title="panel_live_pengawasan_ujian.app"
          subtitle="Real-time Proctoring & Monitoring Mahasiswa"
          headerBadge="Live Proctor"
          headerBadgeVariant="warning"
          bodyClassName="p-4 sm:p-6 lg:p-8"
        >
          <div className="p-6 sm:p-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-retro-orange" />
              <span>Panel Live Pengawasan Ujian</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
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
          <div className="rounded-xl border-2 border-black bg-white p-8 shadow-retro text-center space-y-3">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-heading font-black text-lg text-foreground">Tidak Ada Ujian yang Sedang Berjalan</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Buka sesi ujian dari daftar kelas atau menu Buat Ujian/Kuis untuk mulai memantau peserta.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (subroute === 'question-bank') {
    return (
      <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
        <RetroWindow
          title="bank_soal_terpusat.app"
          subtitle="Repositori Bank Soal Terstandarisasi CPL & Topik"
          headerBadge="Bank Soal"
          headerBadgeVariant="warning"
          bodyClassName="p-4 sm:p-6 lg:p-8"
        >
          <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
                <FolderArchive className="h-7 w-7 text-retro-orange" />
                <span>Bank Soal Perkuliahan</span>
              </h1>
              <p className="text-sm text-muted-foreground font-medium max-w-2xl leading-relaxed">
                Koleksi butir soal pilihan ganda, benar/salah, essay, menjodohkan, dan live coding yang dapat digunakan ulang di seluruh kelas perkuliahan.
              </p>
            </div>
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Soal Baru</span>
            </Link>
          </div>
        </RetroWindow>

        {/* Grid 3 Kolom Soal Full-Width */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-xl text-foreground">Daftar Soal Tersedia ({questionBank.length})</h2>
            <span className="text-xs font-mono font-bold bg-neutral-100 px-3 py-1 rounded border border-black">
              Standar Mutu SPMI & OBE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionBank.map((q: any, idx: number) => (
              <div
                key={q.id || idx}
                className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-transform"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-md border-2 border-black bg-white text-xs sm:text-sm font-black text-black">
                      {q.question_type}
                    </span>
                    <span className="px-3 py-1 rounded-md border-2 border-black bg-retro-yellow text-xs sm:text-sm font-black text-black">
                      {q.difficulty || 'MEDIUM'}
                    </span>
                    <span className="text-sm font-black text-black">
                      {q.points} Poin
                    </span>
                  </div>

                  <p className="text-base font-bold text-black leading-snug line-clamp-3">
                    {q.question_text}
                  </p>
                </div>

                <div className="pt-3 border-t-2 border-black/20 space-y-2">
                  {q.cpl_tag && (
                    <span className="text-xs font-bold text-black bg-retro-warm px-3 py-1 rounded-md border border-black block truncate">
                      {q.cpl_tag}
                    </span>
                  )}
                  {q.topic_tag && (
                    <span className="text-xs text-black/80 font-bold block">
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
      <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
        <RetroWindow
          title="log_pelanggaran_ujian.log"
          subtitle="Audit Trail Append-Only Pemantauan Integritas Ujian"
          headerBadge="Audit Log"
          headerBadgeVariant="warning"
          bodyClassName="p-4 sm:p-6 lg:p-8"
        >
          <div className="p-6 sm:p-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
              <AlertCircle className="h-7 w-7 text-retro-orange" />
              <span>Log Pelanggaran & Integritas Ujian</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
              Catatan perilaku peserta ujian (tab switch, window blur, keluar fullscreen, copy-paste) yang tercatat secara kronologis. Dosen dapat meninjau durasi dan frekuensi anomali sebelum memvalidasi nilai akhir.
            </p>
          </div>
        </RetroWindow>

        {/* Kartu Grid Log Kejadian Full Width */}
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="font-heading font-black text-xl text-black">Log Kejadian Real-Time Integritas</h2>
            <span className="text-xs sm:text-sm font-bold bg-retro-warm px-3 py-1 rounded-md border-2 border-black">
              Status: Append-Only Immutable
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl border-2 border-black bg-retro-warm/30 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-black bg-white px-2.5 py-1 rounded border-2 border-black">
                  2024001 - Ahmad Fauzi
                </span>
                <span className="text-xs font-black text-black bg-retro-yellow px-2.5 py-1 rounded border-2 border-black">
                  TAB_SWITCH
                </span>
              </div>
              <p className="text-sm font-semibold text-black">
                Pindah tab browser selama <strong>4 detik</strong> saat mengerjakan Soal Coding #4.
              </p>
              <div className="text-xs font-bold text-black/80 pt-2 border-t border-black/20 flex justify-between">
                <span>09:15:22 WIB</span>
                <span>UTS TI-301</span>
              </div>
            </div>

            <div className="p-5 rounded-xl border-2 border-black bg-retro-warm/30 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-black bg-white px-2.5 py-1 rounded border-2 border-black">
                  2024018 - Rian Hidayat
                </span>
                <span className="text-xs font-black text-white bg-danger px-2.5 py-1 rounded border-2 border-black">
                  EXIT_FULLSCREEN
                </span>
              </div>
              <p className="text-sm font-semibold text-black">
                Keluar dari mode fullscreen. Peringatan #1 ditampilkan kepada mahasiswa.
              </p>
              <div className="text-xs font-bold text-black/80 pt-2 border-t border-black/20 flex justify-between">
                <span>09:18:04 WIB</span>
                <span>UTS TI-301</span>
              </div>
            </div>

            <div className="p-5 rounded-xl border-2 border-black bg-retro-warm/30 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-black bg-white px-2.5 py-1 rounded border-2 border-black">
                  2024025 - Siti Rahma
                </span>
                <span className="text-xs font-black text-black bg-retro-yellow px-2.5 py-1 rounded border-2 border-black">
                  WINDOW_BLUR
                </span>
              </div>
              <p className="text-sm font-semibold text-black">
                Jendela browser kehilangan fokus selama <strong>2 detik</strong> (notifikasi desktop).
              </p>
              <div className="text-xs font-bold text-black/80 pt-2 border-t border-black/20 flex justify-between">
                <span>09:22:45 WIB</span>
                <span>UTS TI-301</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subroute === 'disputes') {
    return (
      <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
        <RetroWindow
          title="sengketa_nilai_ujian.app"
          subtitle="Alur Sanggahan & Klarifikasi Nilai Ujian Mahasiswa"
          headerBadge="Sengketa Nilai"
          headerBadgeVariant="warning"
          bodyClassName="p-4 sm:p-6 lg:p-8"
        >
          <div className="p-6 sm:p-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
              <Clock className="h-7 w-7 text-retro-orange" />
              <span>Sengketa & Sanggahan Nilai Ujian</span>
            </h1>
            <p className="text-base sm:text-lg text-black font-semibold max-w-3xl leading-relaxed">
              Mahasiswa berhak mengajukan sanggahan nilai secara berkeadilan jika terdapat ambiguitas soal atau kendala teknis saat ujian. Dosen dapat meninjau rekaman jawaban dan menyesuaikan nilai secara transparan.
            </p>
          </div>
        </RetroWindow>

        {/* Grid 2 Kolom Sanggahan Aktif Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black bg-retro-yellow text-black px-3 py-1 rounded border-2 border-black">
                  MENUNGGU REVIEW DOSEN
                </span>
                <span className="text-xs sm:text-sm font-bold text-black">Kemarin, 14:20 WIB</span>
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-black leading-snug">
                  Sanggahan Soal Coding No. 4 (TI-301)
                </h3>
                <p className="text-sm font-bold text-black/80 mt-0.5">Diajukan oleh: 2024001 - Ahmad Fauzi</p>
              </div>
              <p className="text-sm text-black bg-retro-warm/40 p-4 rounded-lg border-2 border-black/20 leading-relaxed font-medium">
                &quot;Pada test case 2 soal nomor 4, format JSON output sudah memenuhi requirement namun parser memberikan nilai parsial 50% karena perbedaan trailing whitespace di newline.&quot;
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t-2 border-black/20">
              <button className="flex-1 py-2.5 rounded-lg border-2 border-black bg-black text-white text-sm font-black hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-xs">
                <CheckCircle2 className="h-4 w-4" /> Setujui (+10 Poin)
              </button>
              <button className="px-5 py-2.5 rounded-lg border-2 border-black bg-white text-sm font-black hover:bg-neutral-100 transition-all flex items-center gap-2 shadow-xs">
                <XCircle className="h-4 w-4" /> Tolak
              </button>
            </div>
          </div>

          <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black bg-retro-mint text-black px-3 py-1 rounded border-2 border-black">
                  DISETUJUI & DISAHKAN
                </span>
                <span className="text-xs sm:text-sm font-bold text-black">2 hari lalu</span>
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-black leading-snug">
                  Sanggahan Pilihan Ganda No. 8 (TI-102)
                </h3>
                <p className="text-sm font-bold text-black/80 mt-0.5">Diajukan oleh: 2024018 - Rian Hidayat</p>
              </div>
              <p className="text-sm text-black bg-retro-warm/40 p-4 rounded-lg border-2 border-black/20 leading-relaxed font-medium">
                &quot;Kunci jawaban soal no. 8 menunjuk opsi B, namun buku rujukan edisi terbaru menyatakan opsi C juga valid karena implementasi compiler C99.&quot;
              </p>
            </div>
            <div className="pt-3 border-t-2 border-black/20 text-sm font-black text-black">
              ✓ Nilai telah disesuaikan (+5 Poin) oleh Dr. Ardiansyah
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Create / Review / General Exam Management
  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      <RetroWindow
        title={`manajemen_ujian_${subroute || 'pengajar'}.app`}
        subtitle="Manajemen dan Evaluasi Pembelajaran LMS SIAJAR"
        headerBadge="Ujian & Kuis"
        headerBadgeVariant="warning"
        bodyClassName="p-4 sm:p-6 lg:p-8"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <Award className="h-7 w-7 text-retro-orange" />
            <span className="capitalize">{subroute.replace('-', ' ') || 'Manajemen Ujian'}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
            Kelola pembuatan ujian, tinjau jawaban essay/coding berbantuan AI, dan verifikasi integritas hasil belajar mahasiswa.
          </p>
        </div>
      </RetroWindow>

      {/* Grid 3 Kolom Aksi Evaluasi Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/exams/live"
          className="rounded-xl border-2 border-black bg-white p-6 shadow-retro hover:-translate-y-1 hover:shadow-retro-md transition-all space-y-3 block"
        >
          <div className="p-3 w-fit rounded-lg border-2 border-black bg-retro-warm">
            <ShieldAlert className="h-6 w-6 text-retro-orange" />
          </div>
          <h3 className="font-heading font-black text-lg text-foreground">Panel Live Pengawasan</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pantau aktivitas ujian, anomali tab switch, dan progres pengerjaan mahasiswa secara real-time.
          </p>
        </Link>

        <Link
          href="/exams/question-bank"
          className="rounded-xl border-2 border-black bg-white p-6 shadow-retro hover:-translate-y-1 hover:shadow-retro-md transition-all space-y-3 block"
        >
          <div className="p-3 w-fit rounded-lg border-2 border-black bg-retro-warm">
            <FolderArchive className="h-6 w-6 text-retro-orange" />
          </div>
          <h3 className="font-heading font-black text-lg text-foreground">Bank Soal Perkuliahan</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Kelola butir soal terstandarisasi, tag CPL OBE, tingkat kesulitan, dan kunci rubrik terpusat.
          </p>
        </Link>

        <Link
          href="/exams/disputes"
          className="rounded-xl border-2 border-black bg-white p-6 shadow-retro hover:-translate-y-1 hover:shadow-retro-md transition-all space-y-3 block"
        >
          <div className="p-3 w-fit rounded-lg border-2 border-black bg-retro-warm">
            <Clock className="h-6 w-6 text-retro-orange" />
          </div>
          <h3 className="font-heading font-black text-lg text-foreground">Sengketa Nilai Mahasiswa</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tinjau sanggahan nilai ujian dan perbaiki skor mahasiswa secara transparan dan berkeadilan.
          </p>
        </Link>
      </div>
    </div>
  );
}
