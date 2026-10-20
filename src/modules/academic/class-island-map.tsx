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
import { PodcastPlayer } from './podcast-player';

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
  const [activePodcast, setActivePodcast] = useState<{ id: string; title: string } | null>(null);

  if (!chapters || chapters.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-black p-8 text-center space-y-3 bg-gray-soft/40 shadow-retro font-sans">
        <Compass className="w-10 h-10 text-black mx-auto" />
        <h3 className="text-base font-heading font-black text-black">Peta Belajar Belum Diatur</h3>
        <p className="text-xs text-black/75 font-medium max-w-md mx-auto">
          Dosen pengampu belum menyusun bab pada kelas ini. Silakan buka tab Materi dan Tugas untuk modul perkuliahan umum.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Toolbar & Sakelar Tampilan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-black p-5 rounded-2xl shadow-retro">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-[11px] font-mono font-bold text-black uppercase">
            <Compass className="w-3.5 h-3.5 text-black" />
            <span>Peta Perkuliahan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-black">
            Alur Belajar & Peta Bab
          </h2>
          <p className="text-xs sm:text-sm text-black/75 font-medium leading-relaxed">
            Selesaikan bab secara bertahap untuk membuka pulau materi berikutnya dan menuntaskan syarat kuis.
          </p>
        </div>

        {/* Sakelar Peta / Daftar */}
        <div className="flex items-center gap-1.5 border-2 border-black bg-gray-soft p-1.5 rounded-xl shadow-retro-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('peta')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border-2 transition-all cursor-pointer',
              viewMode === 'peta'
                ? 'bg-black text-white border-black shadow-retro-sm'
                : 'bg-white text-black border-transparent hover:border-black'
            )}
            aria-pressed={viewMode === 'peta'}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Peta</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daftar')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border-2 transition-all cursor-pointer',
              viewMode === 'daftar'
                ? 'bg-black text-white border-black shadow-retro-sm'
                : 'bg-white text-black border-transparent hover:border-black'
            )}
            aria-pressed={viewMode === 'daftar'}
          >
            <List className="w-3.5 h-3.5" />
            <span>Daftar</span>
          </button>
        </div>
      </div>

      {/* 2. Mode Tampilan Peta Visual (SVG Monochrome Retro) */}
      {viewMode === 'peta' ? (
        <div className="relative w-full bg-white border-2 border-black rounded-2xl p-6 overflow-hidden shadow-retro">
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
                    stroke="black"
                    strokeWidth="3"
                    strokeDasharray={chap.is_optional ? '6 6' : isPathActive ? 'none' : '4 4'}
                    className={cn(
                      'transition-colors duration-200',
                      isPathActive ? 'stroke-black' : 'stroke-black/30'
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
                    className="cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-black rounded-full"
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
                        stroke="black"
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-300 transform -rotate-90 origin-center"
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
                        isCompleted && 'fill-black stroke-black',
                        isOpen && 'fill-white stroke-black group-hover:scale-105',
                        isLocked && 'fill-gray-200 stroke-black'
                      )}
                      stroke="black"
                      strokeWidth={chap.is_optional ? 3 : 2}
                      strokeDasharray={chap.is_optional ? '4 4' : 'none'}
                    />

                    {/* Ikon Status */}
                    {isCompleted && (
                      <CheckCircle2 x={cx - 12} y={cy - 12} width={24} height={24} className="text-white" />
                    )}
                    {isOpen && (
                      <Play x={cx - 10} y={cy - 10} width={20} height={20} className="fill-black text-black" />
                    )}
                    {isLocked && (
                      <Lock x={cx - 10} y={cy - 10} width={20} height={20} className="text-black" />
                    )}

                    {/* Label Teks di Bawah Pulau */}
                    <text
                      x={cx}
                      y={cy + r + 18}
                      textAnchor="middle"
                      className="text-[11px] font-mono font-bold fill-black tracking-wide"
                    >
                      Pulau {chap.position}
                    </text>
                    <text
                      x={cx}
                      y={cy + r + 32}
                      textAnchor="middle"
                      className="text-[10px] fill-black/75 font-bold"
                    >
                      {chap.title.length > 20 ? `${chap.title.slice(0, 18)}…` : chap.title}
                    </text>
                    {chap.is_optional && (
                      <text
                        x={cx}
                        y={cy + r + 45}
                        textAnchor="middle"
                        className="text-[9px] fill-black font-mono font-bold uppercase tracking-wider"
                      >
                        [Opsional]
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* 3. Mode Tampilan Daftar (Retro Cards) */
        <div className="space-y-4">
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
                  'flex items-center justify-between p-5 rounded-2xl border-2 border-black bg-white transition-all cursor-pointer shadow-retro hover:-translate-y-0.5',
                  isCompleted && 'bg-gray-soft/40',
                  isOpen && 'bg-white',
                  isLocked && 'bg-gray-soft/20 opacity-80'
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-retro-sm',
                      isCompleted && 'bg-black text-white',
                      isOpen && 'bg-white text-black',
                      isLocked && 'bg-gray-soft text-black'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4 text-black" />
                    ) : (
                      chap.position
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-black/70">
                        Bab {chap.position}
                      </span>
                      {chap.is_optional && (
                        <span className="text-[10px] font-mono font-bold bg-white text-black px-2 py-0.5 rounded border border-black shadow-xs">
                          Opsional
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-xs font-mono font-bold px-2 py-0.5 rounded border-2 border-black shadow-retro-sm',
                          isCompleted && 'bg-black text-white',
                          isOpen && 'bg-white text-black',
                          isLocked && 'bg-gray-soft text-black'
                        )}
                      >
                        {isCompleted ? 'Selesai' : isOpen ? 'Terbuka' : 'Terkunci'}
                      </span>
                    </div>
                    <h3 className="text-base font-heading font-black text-black">{chap.title}</h3>
                    {chap.summary && (
                      <p className="text-xs text-black/75 line-clamp-1 font-medium">{chap.summary}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono font-bold text-black">
                  <div className="hidden sm:block text-right">
                    <div>Materi: {chap.materials_completed}/{chap.materials_count}</div>
                    {chap.quiz && (
                      <div>Kuis: {chap.quiz.best_score ?? '-'} / {chap.pass_score}</div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-black" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Dialog / Panel Isi Pulau (Retro Window) */}
      {selectedChapter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white border-2 border-black rounded-2xl shadow-retro-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            {/* Header Panel */}
            <div className="flex items-center justify-between border-b-2 border-black bg-gray-soft p-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
                <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-black ml-1">
                  Pulau {selectedChapter.position}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-black',
                    selectedChapter.status === 'selesai' && 'bg-black text-white',
                    selectedChapter.status === 'terbuka' && 'bg-white text-black',
                    selectedChapter.status === 'terkunci' && 'bg-gray-soft text-black'
                  )}
                >
                  {selectedChapter.status === 'selesai'
                    ? 'Selesai'
                    : selectedChapter.status === 'terbuka'
                    ? 'Terbuka'
                    : 'Terkunci'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChapter(null)}
                className="p-1 rounded border border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm cursor-pointer"
                aria-label="Tutup panel pulau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
              <div>
                <h3 className="text-lg font-heading font-black text-black">
                  {selectedChapter.title}
                </h3>
                {selectedChapter.summary && (
                  <p className="text-black/75 text-xs mt-1 leading-relaxed font-medium">
                    {selectedChapter.summary}
                  </p>
                )}
              </div>

              {/* Jika Pulau Terkunci */}
              {selectedChapter.status === 'terkunci' ? (
                <div className="p-4 rounded-xl border-2 border-black bg-gray-soft text-black space-y-2 shadow-retro-sm">
                  <div className="flex items-center gap-2 font-mono font-bold text-sm">
                    <Lock className="w-4 h-4 text-black" />
                    <span>Pulau Masih Terkunci</span>
                  </div>
                  <p className="text-xs text-black/80 font-medium leading-relaxed">
                    Selesaikan Pulau {Math.max(1, selectedChapter.position - 1)} dengan nilai ambang batas minimal{' '}
                    <strong className="text-black">{selectedChapter.pass_score}</strong> untuk membuka modul pulau ini.
                  </p>
                </div>
              ) : (
                /* Jika Pulau Terbuka / Selesai */
                <div className="space-y-4">
                  {/* 1. Modul Materi */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-black" />
                      <span>Materi Bab ({selectedChapter.materials_completed}/{selectedChapter.materials_count} Selesai)</span>
                    </h4>
                    <div className="p-3.5 bg-gray-soft/40 border-2 border-black rounded-xl text-xs flex items-center justify-between shadow-retro-sm">
                      <span className="font-medium text-black">Pelajari dokumen materi bab ini.</span>
                      <Link
                        href={`/classes/${classId}?tab=materi`}
                        className="px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-soft text-black font-bold text-xs shadow-retro-sm"
                      >
                        Buka Materi &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* 2. Topik Bab */}
                  {selectedChapter.topics && selectedChapter.topics.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                        Penguasaan Topik Pembahasan
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedChapter.topics.map((t) => (
                          <span
                            key={t.id}
                            className="text-xs px-2.5 py-1 rounded-lg font-mono font-bold border-2 border-black bg-white text-black shadow-retro-sm"
                          >
                            {t.name}: {getTopicMasteryLabel(t.level)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Fitur Pendukung: Flashcard & Tukar Keahlian */}
                  <div className="pt-3 border-t-2 border-black/15 flex flex-col sm:flex-row gap-2.5">
                    <Link
                      href="/flashcards"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold border-2 border-black rounded-xl bg-white hover:bg-gray-soft transition-all text-black shadow-retro-sm"
                    >
                      <Brain className="w-4 h-4 text-black" />
                      <span>Latihan Flashcard</span>
                    </Link>
                    {isSkillExchangeEnabled && (
                      <Link
                        href="/skill-exchange"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold border-2 border-black rounded-xl bg-black hover:bg-neutral-800 transition-all text-white shadow-retro"
                      >
                        <HandHelping className="w-4 h-4 text-white" />
                        <span>Tukar Keahlian</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
