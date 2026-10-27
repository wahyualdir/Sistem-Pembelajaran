'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderArchive,
  Search,
  Filter,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  Code2,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { QuestionImportExportModal } from '@/modules/academic/question-import-modal';
import { AiQuizGeneratorModal } from '@/modules/academic/ai-quiz-generator-modal';
import { cn } from '@/lib/utils';

interface QuestionBankViewProps {
  questions: any[];
  classes: any[];
}

export function QuestionBankView({ questions, classes }: QuestionBankViewProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question_text?.toLowerCase().includes(search.toLowerCase()) ||
      q.topic_tag?.toLowerCase().includes(search.toLowerCase()) ||
      q.cpl_tag?.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'ALL' || q.question_type === selectedType;
    const matchesDiff = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesType && matchesDiff;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Bank Soal Perkuliahan"
        badge="DOSEN :: BANK SOAL"
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
              Repositori butir evaluasi pilihan ganda, essay, benar/salah, menjodohkan, dan live coding yang dapat digunakan kembali dan dipetakan ke CPMK/CPL.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <QuestionImportExportModal />
            <AiQuizGeneratorModal classes={classes} />
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Buat Soal di Kelas</span>
            </Link>
          </div>
        </div>
      </RetroWindow>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/60" />
          <input
            type="text"
            placeholder="Cari butir soal, CPL, atau topik…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-black bg-white text-xs font-medium text-black focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-black bg-white text-xs font-bold text-black focus:outline-hidden"
          >
            <option value="ALL">Semua Tipe Soal</option>
            <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
            <option value="ESSAY">Essay</option>
            <option value="LIVE_CODING">Live Coding</option>
            <option value="TRUE_FALSE">Benar / Salah</option>
            <option value="SHORT_ANSWER">Jawaban Singkat</option>
            <option value="MATCHING">Menjodohkan</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl border-2 border-black bg-white text-xs font-bold text-black focus:outline-hidden"
          >
            <option value="ALL">Semua Kesulitan</option>
            <option value="EASY">Mudah (EASY)</option>
            <option value="MEDIUM">Sedang (MEDIUM)</option>
            <option value="HARD">Sulit (HARD)</option>
          </select>
        </div>
      </div>

      {/* Question Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <h2 className="font-heading font-black text-xl text-black">
            Daftar Butir Soal ({filteredQuestions.length})
          </h2>
          <span className="text-xs font-mono font-bold bg-white text-black px-3 py-1 rounded border-2 border-black shadow-retro-sm">
            Standar SPMI & OBE UIR
          </span>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 p-10 text-center space-y-3">
            <FolderArchive className="h-10 w-10 text-black/50 mx-auto" />
            <h3 className="font-heading font-black text-base text-black">Belum Ada Soal di Bank Soal</h3>
            <p className="text-xs text-black/70 max-w-md mx-auto font-medium">
              Gunakan fitur impor file Excel/Word atau generator draf AI untuk mengisi repositori bank soal Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map((q: any, idx: number) => (
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
                      {q.points || 10} Poin
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
                        <span className="block font-mono uppercase text-xs">Peringatan Butir Soal</span>
                        <span className="font-medium text-black/80">
                          Perlu Ditinjau: {q.revision_note || 'Daya pembeda rendah / dicurigai ambigu'}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-sm font-bold text-black leading-snug line-clamp-3">
                    {q.question_text}
                  </p>

                  {q.explanation && (
                    <p className="text-xs text-black/75 bg-gray-soft/50 p-2.5 rounded-lg border border-black/20 font-medium">
                      <strong className="text-black">Kunci & Pembahasan:</strong> {q.explanation}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t-2 border-black/20 space-y-1.5">
                  {(q.cpl_tag || q.cpmk) && (
                    <span className="text-xs font-mono font-bold text-black bg-gray-soft px-2.5 py-1 rounded-md border border-black block truncate">
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
        )}
      </div>
    </div>
  );
}
