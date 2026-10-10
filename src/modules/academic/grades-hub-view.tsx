'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckSquare,
  Award,
  TrendingUp,
  Download,
  BookOpen,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';
import { submitExamDisputeAction } from './quiz-actions';

export interface CourseGrade {
  code: string;
  name: string;
  sks: number;
  attendancePercent: number;
  assignmentsScore: number;
  quizScore: number;
  midtermScore: number;
  finalScore: number;
  scoreNumber: number;
  gradeLetter: string;
  gradePoint: number;
  status: 'LULUS' | 'SEDANG_BERJALAN' | 'REMEDIAL';
}

export interface ExamAttemptItem {
  id: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  max_score: number;
  submitted_at: string;
  violations_count: number;
  status: string;
}

export const GRADES_TABS = [
  { id: 'nilai', label: 'Nilai Perkuliahan', icon: CheckSquare },
  { id: 'riwayat', label: 'Riwayat Ujian & Kuis', icon: FileText },
  { id: 'progres', label: 'Progres Kelulusan & CPL', icon: TrendingUp },
] as const;

export type GradesTabId = (typeof GRADES_TABS)[number]['id'];

interface GradesHubViewProps {
  grades: CourseGrade[];
  attempts: any[];
  quizzes: any[];
  isDemo?: boolean;
}

export function GradesHubView({ grades, attempts, quizzes, isDemo = true }: GradesHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab synchronization with URL (?tab=...)
  const tabParam = searchParams.get('tab') as GradesTabId;
  const validTabs: GradesTabId[] = ['nilai', 'riwayat', 'progres'];
  const activeTab: GradesTabId = validTabs.includes(tabParam) ? tabParam : 'nilai';

  const setTab = (tab: GradesTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/grades?${params.toString()}`);
  };

  // State Modal "Ajukan Keberatan Nilai"
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeType, setDisputeType] = useState<'EXAM' | 'COURSE'>('EXAM');
  const [selectedAttemptId, setSelectedAttemptId] = useState(attempts[0]?.id || '');
  const [disputeCourse, setDisputeCourse] = useState(grades[0]?.code || '');
  const [disputeComponent, setDisputeComponent] = useState('Tugas');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Metrics calculation
  const totalSks = grades.reduce((sum, c) => sum + c.sks, 0);
  const totalWeight = grades.reduce((sum, c) => sum + c.sks * c.gradePoint, 0);
  const ipk = totalSks > 0 ? (totalWeight / totalSks).toFixed(2) : '0.00';

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disputeType === 'COURSE') {
      return;
    }
    if (!selectedAttemptId) {
      alert('Pilih sesi ujian yang ingin diajukan keberatan.');
      return;
    }
    startTransition(async () => {
      const res = await submitExamDisputeAction(selectedAttemptId, disputeReason);
      if (res.ok) {
        setDisputeSubmitted(true);
        setTimeout(() => {
          setIsDisputeModalOpen(false);
          setDisputeSubmitted(false);
          setDisputeReason('');
        }, 1500);
      } else {
        alert(res.error || 'Gagal mengajukan keberatan nilai.');
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. RETRO WINDOW HEADER */}
      <RetroWindow
        title="nilai_dan_evaluasi_studi.app"
        subtitle="Evaluasi Kinerja Akademik & Capaian Pembelajaran"
        headerBadge="Semester Ganjil 2026/2027"
        headerBadgeVariant="info"
        bodyClassName="p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-2.5 sm:gap-3">
              <CheckSquare className="h-6 w-6 sm:h-7 sm:w-7 text-retro-orange shrink-0" />
              <span>Nilai & Progres Pembelajaran</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-black font-medium max-w-2xl leading-relaxed">
              Pantau bobot nilai per komponen (tugas, kuis, ujian, presensi), riwayat evaluasi, dan proyeksi capaian indeks prestasi kumulatif semester ini secara transparan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsDisputeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-retro-orange text-white font-black text-xs sm:text-sm shadow-retro hover:bg-black transition-all cursor-pointer"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Ajukan Keberatan Nilai</span>
            </button>
            <Link
              href="/certificates?tab=portofolio"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-retro-yellow font-black text-xs sm:text-sm text-black shadow-retro hover:bg-black hover:text-white transition-all"
            >
              <Award className="h-4 w-4" />
              <span>Portofolio Belajar</span>
            </Link>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS METRIC PILLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <div className="text-xs font-mono font-black uppercase text-black">Indeks Prestasi Semester (IPS)</div>
          <div className="text-3xl font-heading font-black text-black">
            {ipk} <span className="text-xs font-bold text-black/70">/ 4.00</span>
          </div>
          <div className="text-xs font-black text-retro-orange flex items-center gap-1.5 pt-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Predikat Sangat Memuaskan</span>
          </div>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <div className="text-xs font-mono font-black uppercase text-black">Total SKS Semester</div>
          <div className="text-3xl font-heading font-black text-black">
            {totalSks} <span className="text-xs font-bold text-black/70">SKS</span>
          </div>
          <div className="text-xs font-bold text-black/70 flex items-center gap-1.5 pt-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{grades.length} Mata Kuliah Terdaftar</span>
          </div>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <div className="text-xs font-mono font-black uppercase text-black">Ujian Diselesaikan</div>
          <div className="text-3xl font-heading font-black text-black">
            {attempts.length} <span className="text-xs font-bold text-black/70">Sesi</span>
          </div>
          <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Evaluasi Terverifikasi</span>
          </div>
        </div>

        <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-1">
          <div className="text-xs font-mono font-black uppercase text-black">Tingkat Kelulusan</div>
          <div className="text-3xl font-heading font-black text-black">
            100% <span className="text-xs font-bold text-black/70">Lulus</span>
          </div>
          <div className="text-xs font-bold text-black/70 flex items-center gap-1.5 pt-1">
            <Award className="h-3.5 w-3.5" />
            <span>0 Mata Kuliah Remedial</span>
          </div>
        </div>
      </div>

      {/* 3. TAB CONTROLLER NEO-BRUTALIST */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {GRADES_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-retro-orange text-white shadow-retro'
                  : 'bg-white text-black hover:bg-retro-warm shadow-xs'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: NILAI PERKULIAHAN */}
      {activeTab === 'nilai' && (
        <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
          <div className="p-4 bg-retro-warm border-b-2 border-black flex items-center justify-between">
            <h2 className="font-heading font-black text-sm sm:text-base text-black">
              Rincian Komponen Nilai & Huruf Mutu
            </h2>
            <span className="text-xs font-mono font-bold text-black/70">
              Skala Bobot Standar Institusi
            </span>
          </div>

          {grades.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <CheckSquare className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Belum Ada Nilai Terbit</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Nilai semester Anda belum dipublikasikan oleh bagian akademik atau dosen pengampu.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                  <th className="p-3.5 sm:p-4">Kode & Mata Kuliah</th>
                  <th className="p-3.5 sm:p-4 text-center">SKS</th>
                  <th className="p-3.5 sm:p-4 text-center">Hadir</th>
                  <th className="p-3.5 sm:p-4 text-center">Tugas</th>
                  <th className="p-3.5 sm:p-4 text-center">Kuis</th>
                  <th className="p-3.5 sm:p-4 text-center">UTS</th>
                  <th className="p-3.5 sm:p-4 text-center">UAS</th>
                  <th className="p-3.5 sm:p-4 text-center">Angka</th>
                  <th className="p-3.5 sm:p-4 text-center">Huruf</th>
                  <th className="p-3.5 sm:p-4 text-center">Bobot</th>
                  <th className="p-3.5 sm:p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 font-medium">
                {grades.map((c) => (
                  <tr key={c.code} className="hover:bg-retro-warm/30 transition-colors">
                    <td className="p-3.5 sm:p-4 font-bold">
                      <div className="text-black">{c.name}</div>
                      <div className="text-xs font-mono text-black/60">{c.code}</div>
                    </td>
                    <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{c.sks}</td>
                    <td className="p-3.5 sm:p-4 text-center font-mono">{c.attendancePercent}%</td>
                    <td className="p-3.5 sm:p-4 text-center font-mono">{c.assignmentsScore}</td>
                    <td className="p-3.5 sm:p-4 text-center font-mono">{c.quizScore}</td>
                    <td className="p-3.5 sm:p-4 text-center font-mono">{c.midtermScore}</td>
                    <td className="p-3.5 sm:p-4 text-center font-mono">{c.finalScore}</td>
                    <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-black">{c.scoreNumber}</td>
                    <td className="p-3.5 sm:p-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded border border-black font-mono font-black text-xs bg-retro-warm text-black">
                        {c.gradeLetter}
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{c.gradePoint.toFixed(1)}</td>
                    <td className="p-3.5 sm:p-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold border border-emerald-500 bg-emerald-100 text-emerald-950">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* TAB 2: RIWAYAT UJIAN & KUIS */}
      {activeTab === 'riwayat' && (
        <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
          <div className="p-4 bg-retro-warm border-b-2 border-black flex items-center justify-between">
            <h2 className="font-heading font-black text-sm sm:text-base text-black">
              Riwayat Pengerjaan Ujian & Kuis ({attempts.length})
            </h2>
            <Link
              href="/exams"
              className="text-xs font-bold text-black hover:underline"
            >
              Lihat Ujian Aktif &rarr;
            </Link>
          </div>

          {attempts.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Award className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Belum Ada Riwayat Ujian</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Anda belum memiliki riwayat pengerjaan ujian atau kuis. Silakan mulai pengerjaan dari menu Ujian Aktif.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Ujian / Kuis</th>
                    <th className="p-3.5 sm:p-4">Waktu Selesai</th>
                    <th className="p-3.5 sm:p-4 text-center">Skor Perolehan</th>
                    <th className="p-3.5 sm:p-4 text-center">Pelanggaran</th>
                    <th className="p-3.5 sm:p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {attempts.map((att: any, idx: number) => {
                    const quiz = quizzes.find((q: any) => q.id === att.quiz_id);
                    return (
                      <tr key={att.id || idx} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{quiz?.title || att.quiz_title || `Sesi Ujian #${idx + 1}`}</div>
                          <div className="text-xs font-mono text-black/60">{quiz?.exam_type || 'KUIS'}</div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs font-mono text-black/80">
                          {att.submitted_at
                            ? new Date(att.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                            : 'Selesai'}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-base text-black">
                          {att.score ?? 0} <span className="text-xs text-black/60">/ {att.max_score ?? 100}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          {att.violations_count > 0 ? (
                            <span className="px-2 py-0.5 rounded border border-amber-500 bg-amber-100 text-amber-900 text-xs font-bold font-mono">
                              {att.violations_count} Peringatan
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-800 font-bold font-mono">Bersih (0)</span>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-black font-mono text-xs font-bold bg-retro-warm text-black">
                            {att.status || 'SUBMITTED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROGRES KELULUSAN & CPL */}
      {activeTab === 'progres' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
              <h2 className="font-heading font-black text-lg text-black flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-retro-orange" />
                <span>Target Capaian SKS Kelulusan</span>
              </h2>
              <p className="text-xs sm:text-sm text-black/80 leading-relaxed font-medium">
                Mahasiswa wajib menempuh minimal 144 SKS mata kuliah wajib dan pilihan dengan IPK minimal 2.00 untuk memperoleh gelar Sarjana Komputer (S.Kom).
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-mono font-black text-black">
                  <span>SKS Ditempuh: {totalSks} SKS</span>
                  <span>Target: 144 SKS</span>
                </div>
                <div className="w-full h-4 rounded-full border-2 border-black bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-retro-orange transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((totalSks / 144) * 100))}%` }}
                  />
                </div>
                <div className="text-right text-xs font-mono font-bold text-black/70">
                  {Math.round((totalSks / 144) * 100)}% Menuju Kelulusan
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
              <h2 className="font-heading font-black text-lg text-black flex items-center gap-2">
                <Award className="h-5 w-5 text-retro-orange" />
                <span>Capaian Pembelajaran Lulusan (CPL)</span>
              </h2>
              <div className="space-y-3">
                {[
                  { code: 'CPL-01', desc: 'Pemrograman & Rekayasa Perangkat Lunak', pct: 92 },
                  { code: 'CPL-02', desc: 'Analisis Algoritma & Kompleksitas', pct: 86 },
                  { code: 'CPL-03', desc: 'Arsitektur Basis Data & Big Data', pct: 84 },
                  { code: 'CPL-04', desc: 'Keamanan Siber & Jaringan Komputer', pct: 88 },
                ].map((cpl) => (
                  <div key={cpl.code} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-black">
                      <span>{cpl.code}: {cpl.desc}</span>
                      <span className="font-mono font-black">{cpl.pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full border border-black bg-neutral-100 overflow-hidden">
                      <div className="h-full bg-retro-yellow border-r border-black" style={{ width: `${cpl.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL AJUKAN KEBERATAN NILAI */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border-2 border-black bg-white p-6 sm:p-7 shadow-retro space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg border-2 border-black bg-retro-orange text-white">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-black text-lg sm:text-xl text-black">
                  Ajukan Keberatan Nilai
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDisputeModalOpen(false)}
                className="p-1 rounded hover:bg-neutral-100 text-black cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {disputeSubmitted ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <h4 className="font-heading font-black text-lg text-black">Keberatan Nilai Berhasil Diajukan!</h4>
                <p className="text-xs sm:text-sm text-black/70">
                  Pengajuan keberatan nilai Anda telah diteruskan ke dosen pengampu untuk ditinjau.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDisputeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-black font-mono">
                    Kategori Keberatan Nilai
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDisputeType('EXAM')}
                      className={cn(
                        'p-2.5 rounded-lg border-2 border-black text-xs font-bold transition-all cursor-pointer',
                        disputeType === 'EXAM'
                          ? 'bg-retro-orange text-white shadow-retro'
                          : 'bg-white text-black hover:bg-neutral-100'
                      )}
                    >
                      Ujian & Kuis CBT
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisputeType('COURSE')}
                      className={cn(
                        'p-2.5 rounded-lg border-2 border-black text-xs font-bold transition-all cursor-pointer',
                        disputeType === 'COURSE'
                          ? 'bg-retro-orange text-white shadow-retro'
                          : 'bg-white text-black hover:bg-neutral-100'
                      )}
                    >
                      Nilai Semester Non-CBT
                    </button>
                  </div>
                </div>

                {disputeType === 'EXAM' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-black font-mono">
                      Pilih Sesi Ujian / Kuis
                    </label>
                    {attempts.length === 0 ? (
                      <p className="text-xs text-amber-950 bg-amber-50 p-2.5 rounded border border-amber-300 font-medium">
                        Belum ada riwayat pengerjaan ujian CBT untuk diajukan keberatan.
                      </p>
                    ) : (
                      <select
                        value={selectedAttemptId}
                        onChange={(e) => setSelectedAttemptId(e.target.value)}
                        className="w-full rounded-lg border-2 border-black p-2.5 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-retro-orange"
                      >
                        {attempts.map((att: any, idx: number) => {
                          const quiz = quizzes.find((q: any) => q.id === att.quiz_id);
                          return (
                            <option key={att.id || idx} value={att.id}>
                              {quiz?.title || att.quiz_title || `Sesi Ujian #${idx + 1}`} (Skor: {att.score ?? 0})
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg border-2 border-black bg-amber-50 text-xs text-amber-950 font-medium space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-amber-900" />
                        <span>Fitur Segera Aktif di Fase 3</span>
                      </p>
                      <p>
                        Pengajuan keberatan nilai komponen tugas/UTS/UAS non-CBT sedang dalam penyiapan backend Fase 3. Pengajuan belum dapat disimpan ke database dosen.
                      </p>
                    </div>

                    <div className="space-y-1.5 opacity-60">
                      <label className="text-xs font-black uppercase text-black font-mono">
                        Pilih Mata Kuliah
                      </label>
                      <select
                        disabled
                        value={disputeCourse}
                        onChange={(e) => setDisputeCourse(e.target.value)}
                        className="w-full rounded-lg border-2 border-black p-2.5 text-xs sm:text-sm font-bold bg-neutral-100"
                      >
                        {grades.map((g) => (
                          <option key={g.code} value={g.code}>
                            {g.code} — {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-black font-mono">
                    Alasan & Penjelasan Keberatan
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Jelaskan alasan keberatan secara rinci, cantumkan bukti pengerjaan atau klarifikasi penilaian..."
                    className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-retro-orange"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t-2 border-black/10">
                  <button
                    type="button"
                    onClick={() => setIsDisputeModalOpen(false)}
                    className="px-4 py-2 rounded-lg border-2 border-black bg-white text-xs sm:text-sm font-bold hover:bg-neutral-100 cursor-pointer"
                  >
                    Batal
                  </button>

                  {disputeType === 'COURSE' || !isDemo || (disputeType === 'EXAM' && attempts.length === 0) ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-black bg-neutral-200 text-neutral-500 text-xs sm:text-sm font-black cursor-not-allowed"
                    >
                      <span>Fitur Segera Aktif (Belum Tersimpan ke Database)</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-black bg-black text-white text-xs sm:text-sm font-black shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isPending ? 'Mengirim...' : 'Kirim Pengajuan Keberatan'}</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
