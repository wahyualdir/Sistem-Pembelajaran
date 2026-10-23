'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Award,
  Clock,
  ShieldAlert,
  Play,
  FileText,
  Search,
  BookOpen,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExamCategory = 'ALL' | 'KUIS' | 'LATIHAN' | 'UTS' | 'UAS';

interface StudentExamsHubViewProps {
  initialQuizzes: any[];
}

export function StudentExamsHubView({ initialQuizzes }: StudentExamsHubViewProps) {
  const [activeTab, setActiveTab] = useState<ExamCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Perhitungan kuantitas sesi per kategori
  const counts = useMemo(() => {
    return {
      ALL: initialQuizzes.length,
      KUIS: initialQuizzes.filter((q) => (q.exam_type ?? 'KUIS') === 'KUIS').length,
      LATIHAN: initialQuizzes.filter((q) => q.exam_type === 'LATIHAN').length,
      UTS: initialQuizzes.filter((q) => q.exam_type === 'UTS').length,
      UAS: initialQuizzes.filter((q) => q.exam_type === 'UAS').length,
    };
  }, [initialQuizzes]);

  // Penyaringan sesi evaluasi aktif
  const filteredQuizzes = useMemo(() => {
    let list = initialQuizzes;
    if (activeTab !== 'ALL') {
      list = list.filter((q) => (q.exam_type ?? 'KUIS') === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.course_name && item.course_name.toLowerCase().includes(q)) ||
          (item.course_code && item.course_code.toLowerCase().includes(q))
      );
    }
    return list;
  }, [initialQuizzes, activeTab, searchQuery]);

  const tabs: Array<{ id: ExamCategory; label: string }> = [
    { id: 'ALL', label: 'Semua' },
    { id: 'KUIS', label: 'Kuis' },
    { id: 'LATIHAN', label: 'Latihan Mandiri' },
    { id: 'UTS', label: 'UTS' },
    { id: 'UAS', label: 'UAS' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
      <div className="max-w-[1280px] mx-auto space-y-5">
        {/* 1. HEADER HALAMAN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#7A756D] pb-4">
          <div className="space-y-0.5">
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-[#1C1917] flex items-center gap-2.5">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-[#C2553A] inline-block shrink-0" />
              <span>Ujian & Kuis</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#57534E] font-bold">
              Jadwal evaluasi resmi semester, kuis berkala materi perkuliahan, dan modul latihan mandiri.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/exams/history"
              className="inline-flex items-center gap-2 px-3.5 py-2 border-2 border-[#7A756D] bg-[#FFFFFF] font-extrabold text-xs text-[#1C1917] shadow-retro-sm hover:bg-[#FAF8F5] transition-all min-h-[38px]"
            >
              <FileText className="h-4 w-4 text-[#C2553A]" />
              <span>Riwayat Ujian & Nilai</span>
            </Link>
          </div>
        </div>

        {/* 2. CATATAN RINGKAS PENGAWASAN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 bg-[#FAF8F5] border-2 border-[#7A756D] text-xs font-bold text-[#1C1917]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#C2553A] shrink-0" />
            <span>
              Sistem proctoring terpadu aktif untuk sesi UTS & UAS. Kuis berkala dan latihan mandiri dapat diakses bebas.
            </span>
          </div>
          <span className="font-black text-[#065F46] shrink-0 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-pulse" />
            Status: Terhubung
          </span>
        </div>

        {/* 3. TOOLBAR KATEGORI & PENCARIAN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Switcher */}
          <div className="inline-flex items-center p-1 bg-[#ECE9D8] border-2 border-[#7A756D] gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = counts[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 text-xs font-sans transition-all cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'bg-[#C2553A] text-[#FFFFFF] font-black border-2 border-[#853827] shadow-retro-sm'
                      : 'text-[#1C1917] hover:bg-[#FAF8F5] font-extrabold border-2 border-transparent'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 text-[10px] font-black',
                      isActive ? 'bg-[#853827] text-[#FFFFFF]' : 'bg-[#D6D3CB] text-[#1C1917]'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Kolom Pencarian */}
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A756D]" />
            <input
              type="text"
              placeholder="Cari mata kuliah atau topik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-[#FFFFFF] border-2 border-[#7A756D] text-[#1C1917] placeholder:text-[#7A756D] focus:outline-none focus:border-[#C2553A] min-h-[38px]"
            />
          </div>
        </div>

        {/* 4. DAFTAR KARTU EVALUASI AKADEMIK */}
        {filteredQuizzes.length === 0 ? (
          <div className="p-10 sm:p-14 text-center border-2 border-dashed border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm space-y-3">
            <Award className="h-10 w-10 sm:h-12 sm:w-12 text-[#7A756D] mx-auto" />
            <h3 className="text-base sm:text-lg font-black text-[#1C1917]">
              Tidak Ada Sesi {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <p className="text-xs sm:text-sm text-[#57534E] font-bold max-w-md mx-auto leading-relaxed">
              Saat ini tidak ada sesi evaluasi yang sesuai dengan kriteria filter atau pencarian Anda.
            </p>
            {activeTab !== 'ALL' && (
              <button
                onClick={() => {
                  setActiveTab('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 border-2 border-[#7A756D] bg-[#FFFFFF] font-extrabold text-xs text-[#1C1917] hover:bg-[#ECE9D8]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Tampilkan Semua Kategori</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredQuizzes.map((quiz: any) => {
              const type = (quiz.exam_type ?? 'KUIS') as ExamCategory;

              // Konfigurasi visual per kategori
              let badgeClass = 'bg-[#FEF4F1] text-[#853827] border-[#C2553A]';
              let typeLabel = 'KUIS';
              let buttonText = 'Mulai Kerjakan Kuis';
              let buttonClass = 'bg-[#1C1917] hover:bg-[#2D2823] text-[#FFFFFF] border-black';
              let proctorLabel = 'Ringan (Light)';
              let durationText = `${quiz.duration_minutes} Menit`;

              if (type === 'LATIHAN') {
                badgeClass = 'bg-[#E8F5E9] text-[#065F46] border-[#10B981]';
                typeLabel = 'LATIHAN MANDIRI';
                buttonText = 'Buka Latihan Mandiri';
                buttonClass = 'bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] border-[#065F46]';
                proctorLabel = 'Bebas (Off)';
                durationText = 'Bebas Waktu';
              } else if (type === 'UTS') {
                badgeClass = 'bg-[#FEF2F0] text-[#853827] border-[#C2553A]';
                typeLabel = 'UTS RESMI';
                buttonText = 'Masuk Ruang Ujian';
                buttonClass = 'bg-[#C2553A] hover:bg-[#853827] text-[#FFFFFF] border-[#6B2D20]';
                proctorLabel = 'Layar Penuh (Standard)';
                durationText = `${quiz.duration_minutes} Menit`;
              } else if (type === 'UAS') {
                badgeClass = 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]';
                typeLabel = 'UAS RESMI';
                buttonText = 'Masuk Ruang UAS';
                buttonClass = 'bg-[#DC2626] hover:bg-[#991B1B] text-[#FFFFFF] border-[#7A2E19]';
                proctorLabel = 'Ketat (Strict)';
                durationText = `${quiz.duration_minutes} Menit`;
              }

              const questionsCount = quiz.questions?.length ?? quiz.questionsCount ?? 10;
              const kkm = quiz.kkm ?? 70;
              const courseCode = quiz.course_code || 'TIF-301';
              const courseName = quiz.course_name || 'Teknik Informatika';

              return (
                <div
                  key={quiz.id}
                  className="border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm hover:shadow-retro hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                >
                  {/* Card Titlebar */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-[#7A756D] bg-[#ECE9D8]">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2 py-0.5 text-xs font-black uppercase tracking-wider border', badgeClass)}>
                        {typeLabel}
                      </span>
                      <span className="text-xs font-bold text-[#57534E]">
                        {courseCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1C1917]">
                      <Clock className="h-3.5 w-3.5 text-[#C2553A]" />
                      <span>{durationText}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-black uppercase text-[#853827] tracking-wider block">
                        {courseName}
                      </span>
                      <h3 className="font-heading font-black text-lg sm:text-xl text-[#1C1917] leading-snug">
                        {quiz.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#57534E] font-medium leading-relaxed line-clamp-2">
                        {quiz.description}
                      </p>
                    </div>

                    {/* Metadata Specs Strip */}
                    <div className="pt-3 border-t border-[#D6D3CB] space-y-3">
                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#FFFFFF] border border-[#D6D3CB] text-center text-xs">
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-[#7A756D]">Soal</span>
                          <span className="font-black text-[#1C1917]">{questionsCount} Butir</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-[#7A756D]">KKM</span>
                          <span className="font-black text-[#1C1917]">{kkm} / 100</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-[#7A756D]">Pengawasan</span>
                          <span className="font-black text-[#1C1917] truncate block" title={proctorLabel}>
                            {proctorLabel.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/classes/${quiz.class_id}/quizzes/${quiz.id}`}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-extrabold shadow-retro-sm transition-all text-center border-2',
                          buttonClass
                        )}
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>{buttonText}</span>
                        <span>&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
