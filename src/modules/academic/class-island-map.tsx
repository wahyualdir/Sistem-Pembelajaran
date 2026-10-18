'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  CheckCircle2,
  Play,
  Brain,
  HandHelping,
  FileText,
  HelpCircle,
  Headphones,
  Check,
  ChevronRight,
  List,
  Compass,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassMapItem } from './peta-pulau-actions';
import { getTopicMasteryLabel } from '@/lib/akademik/topic-mastery';

export interface ClassIslandMapProps {
  classId: string;
  chapters: ClassMapItem[];
  isSkillExchangeEnabled?: boolean;
}

export function ClassIslandMap({
  classId,
  chapters,
  isSkillExchangeEnabled = false,
}: ClassIslandMapProps) {
  const [viewMode, setViewMode] = useState<'peta' | 'daftar'>('peta');
  const [selectedChapter, setSelectedChapter] = useState<ClassMapItem | null>(null);

  if (!chapters || chapters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-3 bg-muted/10">
        <Compass className="w-10 h-10 text-muted-foreground mx-auto" />
        <h3 className="text-base font-semibold text-foreground">Peta Belajar Belum Diatur</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Dosen pengampu belum menyusun bab pada kelas ini. Silakan cek tab Materi dan Tugas untuk modul perkuliahan umum.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Sakelar Tampilan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            Alur Belajar Kelas
          </h2>
          <p className="text-xs text-muted-foreground">
            Selesaikan bab secara berurutan untuk membuka pulau materi dan kuis berikutnya.
          </p>
        </div>

        {/* Sakelar Peta / Daftar */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('peta')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors',
              viewMode === 'peta'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={viewMode === 'peta'}
          >
            <Compass className="w-3.5 h-3.5" />
            Peta
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daftar')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors',
              viewMode === 'daftar'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={viewMode === 'daftar'}
          >
            <List className="w-3.5 h-3.5" />
            Daftar
          </button>
        </div>
      </div>

      {/* 2. Mode Tampilan Peta Visual (SVG) */}
      {viewMode === 'peta' ? (
        <div className="relative w-full bg-card border border-border rounded-lg p-6 overflow-hidden">
          <div className="max-w-md mx-auto relative py-6">
            <svg
              className="w-full"
              viewBox={`0 0 320 ${Math.max(400, chapters.length * 150 + 60)}`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Peta visual alur bab perkuliahan"
            >
              {/* Garis jalur penghubung antar pulau */}
              {chapters.map((chap, idx) => {
                if (idx === chapters.length - 1) return null;
                const isLeft = idx % 2 === 0;
                const nextIsLeft = (idx + 1) % 2 === 0;
                const x1 = isLeft ? 90 : 230;
                const y1 = idx * 150 + 65;
                const x2 = nextIsLeft ? 90 : 230;
                const y2 = (idx + 1) * 150 + 65;
                const cx = 160;

                const isPathActive = chap.status === 'selesai';

                return (
                  <path
                    key={`path-${chap.id}`}
                    d={`M ${x1} ${y1} C ${cx} ${y1 + 50}, ${cx} ${y2 - 50}, ${x2} ${y2}`}
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={chap.is_optional ? '6 6' : isPathActive ? 'none' : '4 4'}
                    className={cn(
                      'transition-colors duration-200',
                      isPathActive ? 'text-primary' : 'text-muted-foreground/40'
                    )}
                  />
                );
              })}

              {/* Node Pulau */}
              {chapters.map((chap, idx) => {
                const isLeft = idx % 2 === 0;
                const cx = isLeft ? 90 : 230;
                const cy = idx * 150 + 65;
                const r = 40;

                const isLocked = chap.status === 'terkunci';
                const isCompleted = chap.status === 'selesai';
                const isOpen = chap.status === 'terbuka';

                // Cincin Progres Materi
                const circumference = 2 * Math.PI * (r + 4);
                const progressRatio =
                  chap.materials_count > 0 ? chap.materials_completed / chap.materials_count : 0;
                const strokeDashoffset = circumference * (1 - progressRatio);

                return (
                  <g
                    key={chap.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Pulau ${chap.position}: ${chap.title}. Status: ${chap.status}.`}
                    className="cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                    onClick={() => setSelectedChapter(chap)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedChapter(chap);
                      }
                    }}
                  >
                    {/* Cincin Progres Lingkar Luar */}
                    {!isLocked && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 4}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="text-primary transition-all duration-300 transform -rotate-90 origin-center"
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                      />
                    )}

                    {/* Lingkaran Inti Pulau */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      className={cn(
                        'transition-all duration-200',
                        isCompleted && 'fill-emerald-500 text-white',
                        isOpen && 'fill-primary text-primary-foreground group-hover:scale-105',
                        isLocked && 'fill-muted text-muted-foreground'
                      )}
                      stroke="currentColor"
                      strokeWidth={chap.is_optional ? 2 : 1}
                      strokeDasharray={chap.is_optional ? '4 4' : 'none'}
                    />

                    {/* Ikon Status */}
                    {isCompleted && (
                      <CheckCircle2 x={cx - 12} y={cy - 12} width={24} height={24} className="text-white" />
                    )}
                    {isOpen && (
                      <Play x={cx - 10} y={cy - 10} width={20} height={20} className="fill-current" />
                    )}
                    {isLocked && (
                      <Lock x={cx - 10} y={cy - 10} width={20} height={20} />
                    )}

                    {/* Label Teks di Bawah Pulau */}
                    <text
                      x={cx}
                      y={cy + r + 18}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-foreground tracking-wide"
                    >
                      Pulau {chap.position}
                    </text>
                    <text
                      x={cx}
                      y={cy + r + 32}
                      textAnchor="middle"
                      className="text-[10px] fill-muted-foreground font-medium"
                    >
                      {chap.title.length > 20 ? `${chap.title.slice(0, 18)}…` : chap.title}
                    </text>
                    {chap.is_optional && (
                      <text
                        x={cx}
                        y={cy + r + 45}
                        textAnchor="middle"
                        className="text-[9px] fill-amber-600 font-semibold uppercase tracking-wider"
                      >
                        Opsional
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* 3. Mode Tampilan Daftar (Fallback Aksesibel) */
        <div className="space-y-3">
          {chapters.map((chap) => {
            const isLocked = chap.status === 'terkunci';
            const isCompleted = chap.status === 'selesai';
            const isOpen = chap.status === 'terbuka';

            return (
              <div
                key={chap.id}
                tabIndex={0}
                role="button"
                onClick={() => setSelectedChapter(chap)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedChapter(chap);
                  }
                }}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isCompleted && 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70',
                  isOpen && 'bg-card border-primary/40 hover:border-primary shadow-sm',
                  isLocked && 'bg-muted/30 border-border text-muted-foreground opacity-80'
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
                      isCompleted && 'bg-emerald-600 text-white',
                      isOpen && 'bg-primary text-primary-foreground',
                      isLocked && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      chap.position
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Bab {chap.position}
                      </span>
                      {chap.is_optional && (
                        <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                          Opsional
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[10px] font-medium px-2 py-0.5 rounded-full',
                          isCompleted && 'bg-emerald-100 text-emerald-800',
                          isOpen && 'bg-blue-100 text-blue-800',
                          isLocked && 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {isCompleted ? 'Selesai' : isOpen ? 'Terbuka' : 'Terkunci'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{chap.title}</h3>
                    {chap.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{chap.summary}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                  <div className="hidden sm:block text-right">
                    <div>Materi: {chap.materials_completed}/{chap.materials_count}</div>
                    {chap.quiz && (
                      <div>Kuis: {chap.quiz.best_score ?? '-'} / {chap.pass_score}</div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Dialog / Panel Isi Pulau */}
      {selectedChapter && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 p-6 animate-scale-in">
            {/* Header Panel */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Pulau {selectedChapter.position}
                  </span>
                  {selectedChapter.is_optional && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                      Opsional
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded-full',
                      selectedChapter.status === 'selesai' && 'bg-emerald-100 text-emerald-800',
                      selectedChapter.status === 'terbuka' && 'bg-blue-100 text-blue-800',
                      selectedChapter.status === 'terkunci' && 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {selectedChapter.status === 'selesai'
                      ? 'Selesai'
                      : selectedChapter.status === 'terbuka'
                      ? 'Terbuka'
                      : 'Terkunci'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mt-1">
                  {selectedChapter.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChapter(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Tutup panel pulau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Jika Pulau Terkunci */}
            {selectedChapter.status === 'terkunci' ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Pulau Masih Terkunci
                </div>
                <p className="text-xs text-amber-800">
                  Selesaikan Pulau {Math.max(1, selectedChapter.position - 1)} dengan skor minimal{' '}
                  {selectedChapter.pass_score} untuk membuka pulau ini.
                </p>
              </div>
            ) : (
              /* Jika Pulau Terbuka / Selesai */
              <div className="space-y-5 text-sm">
                {selectedChapter.summary && (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {selectedChapter.summary}
                  </p>
                )}

                {/* 1. Modul Materi */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    Materi Bab ({selectedChapter.materials_completed}/{selectedChapter.materials_count} Selesai)
                  </h4>
                  <div className="p-3 bg-muted/20 border border-border rounded-md text-xs flex items-center justify-between">
                    <span>Lihat dan pelajari dokumen materi untuk bab ini.</span>
                    <Link
                      href={`/classes/${classId}?tab=materi`}
                      className="text-primary font-semibold hover:underline"
                    >
                      Buka Materi
                    </Link>
                  </div>
                </div>

                {/* 2. Kuis Bab */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-primary" />
                    Kuis Bab (Syarat Nilai: {selectedChapter.pass_score})
                  </h4>
                  <div className="p-3 bg-muted/20 border border-border rounded-md space-y-2">
                    {selectedChapter.quiz ? (
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-foreground">
                            {selectedChapter.quiz.title}
                          </div>
                          <div className="text-muted-foreground">
                            Skor Terbaik: {selectedChapter.quiz.best_score ?? 'Belum ada'} • Percobaan: {selectedChapter.quiz.attempts}
                          </div>
                        </div>
                        <Link
                          href={`/exams`}
                          className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded text-xs hover:bg-primary/90 transition-colors"
                        >
                          Mulai Kuis
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Kuis bab belum tersedia dari pengajar.
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Topik Bab */}
                {selectedChapter.topics && selectedChapter.topics.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Kekuatan Topik Anda
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedChapter.topics.map((t) => (
                        <span
                          key={t.id}
                          className={cn(
                            'text-xs px-2.5 py-1 rounded-full font-medium border',
                            t.level === 'kuat' && 'bg-emerald-50 text-emerald-800 border-emerald-300',
                            t.level === 'cukup' && 'bg-blue-50 text-blue-800 border-blue-300',
                            t.level === 'perlu_latihan' && 'bg-amber-50 text-amber-800 border-amber-300',
                            t.level === 'belum_cukup_data' && 'bg-muted text-muted-foreground border-border'
                          )}
                        >
                          {t.name}: {getTopicMasteryLabel(t.level)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Fitur Pendukung: Flashcard & Tukar Keahlian */}
                <div className="pt-2 border-t border-border flex flex-col sm:flex-row gap-2">
                  <Link
                    href="/flashcards"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-md hover:bg-muted transition-colors text-foreground"
                  >
                    <Brain className="w-4 h-4 text-primary" />
                    Latihan Flashcard
                  </Link>
                  {isSkillExchangeEnabled && (
                    <Link
                      href={`/skill-exchange`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-md hover:bg-muted transition-colors text-foreground"
                    >
                      <HandHelping className="w-4 h-4 text-emerald-600" />
                      Cari Bantuan
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
