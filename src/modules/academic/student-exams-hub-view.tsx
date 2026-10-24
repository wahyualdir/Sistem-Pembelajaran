'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Award,
  Clock,
  Play,
  FileText,
  Search,
  BookOpen,
  Sparkles,
  RotateCcw,
  Calendar,
  Layers,
  ArrowRight,
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
      <div className="max-w-[1280px] mx-auto space-y-4">
        {/* 1. HEADER HALAMAN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#808285] pb-3.5">
          <div className="space-y-0.5">
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-[#111111] flex items-center gap-2.5">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-[#9F1521] inline-block shrink-0" />
              <span>Ujian & Kuis</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#58595B] font-bold">
              Pusat evaluasi akademik terpadu: jadwal ujian semester, kuis mingguan, dan modul latihan mandiri.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/exams/history"
              className="inline-flex items-center gap-2 px-3.5 py-2 border-2 border-[#808285] bg-[#FFFFFF] font-extrabold text-xs text-[#111111] shadow-retro-sm hover:bg-[#FFFFFF] transition-all min-h-[38px]"
            >
              <FileText className="h-4 w-4 text-[#9F1521]" />
              <span>Riwayat Ujian & Nilai</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#808285]" />
            </Link>
          </div>
        </div>

        {/* 2. TOOLBAR KATEGORI & PENCARIAN (FRESH & SEJAJAR) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Segmented Switcher */}
          <div className="inline-flex items-center p-1 bg-[#FFFFFF] border-2 border-[#808285] shadow-retro-sm gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = counts[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-xs font-sans transition-all cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'bg-[#9F1521] text-[#FFFFFF] font-black border-2 border-[#9F1521] shadow-sm'
                      : 'text-[#111111] hover:bg-[#F3F3F4] font-extrabold border-2 border-transparent'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-black',
                      isActive ? 'bg-[#9F1521] text-[#FFFFFF]' : 'bg-[#E2E3E4] text-[#111111]'
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
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#808285]" />
            <input
              type="text"
              placeholder="Cari mata kuliah atau evaluasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-[#FFFFFF] border-2 border-[#808285] text-[#111111] placeholder:text-[#808285] focus:outline-none focus:border-[#9F1521] min-h-[38px] shadow-retro-sm"
            />
          </div>
        </div>

        {/* 3. DAFTAR KARTU EVALUASI MEMANJANG (FRESH & ELEGAN) */}
        {filteredQuizzes.length === 0 ? (
          <div className="p-10 sm:p-14 text-center border-2 border-dashed border-[#808285] bg-[#FFFFFF] shadow-retro-sm space-y-3">
            <Award className="h-10 w-10 sm:h-12 sm:w-12 text-[#808285] mx-auto" />
            <h3 className="text-base sm:text-lg font-black text-[#111111]">
              Tidak Ada Sesi {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <p className="text-xs sm:text-sm text-[#58595B] font-bold max-w-md mx-auto leading-relaxed">
              Saat ini tidak ada sesi evaluasi yang sesuai dengan kriteria filter atau pencarian Anda.
            </p>
            {activeTab !== 'ALL' && (
              <button
                onClick={() => {
                  setActiveTab('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 border-2 border-[#808285] bg-[#FFFFFF] font-extrabold text-xs text-[#111111] hover:bg-[#F3F3F4]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Tampilkan Semua Kategori</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredQuizzes.map((quiz: any) => {
              const type = (quiz.exam_type ?? 'KUIS') as ExamCategory;

              // Konfigurasi visual per kategori
              let badgeClass = 'bg-[#FEF2F2] text-[#9F1521] border-[#9F1521]';
              let borderAccentClass = 'border-l-[#9F1521]';
              let typeLabel = 'KUIS';
              let buttonText = 'Mulai Kerjakan Kuis';
              let buttonClass = 'bg-[#111111] hover:bg-[#2D2823] text-[#FFFFFF] border-black';
              let proctorBadge = 'Ringan';
              let durationText = `${quiz.duration_minutes} Menit`;

              if (type === 'LATIHAN') {
                badgeClass = 'bg-[#E8F5E9] text-[#065F46] border-[#10B981]';
                borderAccentClass = 'border-l-[#10B981]';
                typeLabel = 'LATIHAN MANDIRI';
                buttonText = 'Buka Latihan Mandiri';
                buttonClass = 'bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] border-[#065F46]';
                proctorBadge = 'Bebas';
                durationText = 'Bebas Waktu';
              } else if (type === 'UTS') {
                badgeClass = 'bg-[#FEF2F2] text-[#9F1521] border-[#9F1521]';
                borderAccentClass = 'border-l-[#9F1521]';
                typeLabel = 'UTS';
                buttonText = 'Masuk Ruang Ujian';
                buttonClass = 'bg-[#9F1521] hover:bg-[#9F1521] text-[#FFFFFF] border-[#8F131E]';
                proctorBadge = 'Layar Penuh';
                durationText = `${quiz.duration_minutes} Menit`;
              } else if (type === 'UAS') {
                badgeClass = 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]';
                borderAccentClass = 'border-l-[#DC2626]';
                typeLabel = 'UAS';
                buttonText = 'Masuk Ruang UAS';
                buttonClass = 'bg-[#DC2626] hover:bg-[#991B1B] text-[#FFFFFF] border-[#7A2E19]';
                proctorBadge = 'Ketat';
                durationText = `${quiz.duration_minutes} Menit`;
              }

              const questionsCount = quiz.questions?.length ?? quiz.questionsCount ?? 10;
              const kkm = quiz.kkm ?? 70;
              const courseCode = quiz.course_code || 'TIF-301';
              const courseName = quiz.course_name || 'Teknik Informatika';
              const scheduleInfo = quiz.schedule_info || 'Semester Ganjil 2026/2027';

              return (
                <div
                  key={quiz.id}
                  className={cn(
                    'border-2 border-[#808285] border-l-4 bg-[#FFFFFF] shadow-retro-sm hover:shadow-retro hover:-translate-y-0.5 transition-all p-3.5 sm:p-4.5 flex flex-col xl:flex-row xl:items-center justify-between gap-4',
                    borderAccentClass
                  )}
                >
                  {/* Sisi Kiri: Badge, Kode, Judul, & Ringkasan */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('px-2 py-0.5 text-xs font-black uppercase tracking-wider border', badgeClass)}>
                        {typeLabel}
                      </span>
                      <span className="text-xs font-extrabold text-[#9F1521]">
                        {courseCode} · {courseName}
                      </span>
                      <span className="text-xs font-bold text-[#808285] hidden sm:inline-flex items-center gap-1">
                        · {scheduleInfo}
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-base sm:text-lg text-[#111111] leading-tight">
                      {quiz.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#58595B] font-medium leading-relaxed line-clamp-1">
                      {quiz.description}
                    </p>
                  </div>

                  {/* Sisi Kanan: Spesifikasi Teknis & Tombol Aksi (Memanjang) */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                    {/* Spesifikasi Inset Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 bg-[#FFFFFF] border border-[#E2E3E4] p-2 text-xs text-center shrink-0">
                      <div className="px-2.5">
                        <span className="block text-[10px] font-bold uppercase text-[#808285] tracking-wider">WAKTU</span>
                        <span className="font-black text-[#111111] whitespace-nowrap">{durationText}</span>
                      </div>
                      <div className="px-2.5 border-l border-[#E2E3E4]">
                        <span className="block text-[10px] font-bold uppercase text-[#808285] tracking-wider">SOAL</span>
                        <span className="font-black text-[#111111] whitespace-nowrap">{questionsCount} Butir</span>
                      </div>
                      <div className="px-2.5 border-l border-[#E2E3E4]">
                        <span className="block text-[10px] font-bold uppercase text-[#808285] tracking-wider">KKM</span>
                        <span className="font-black text-[#111111] whitespace-nowrap">{kkm}</span>
                      </div>
                      <div className="px-2.5 border-l border-[#E2E3E4]">
                        <span className="block text-[10px] font-bold uppercase text-[#808285] tracking-wider">PENGAWASAN</span>
                        <span className="font-black text-[#111111] whitespace-nowrap">{proctorBadge}</span>
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="w-full sm:w-auto shrink-0">
                      <Link
                        href={`/classes/${quiz.class_id}/quizzes/${quiz.id}`}
                        className={cn(
                          'flex items-center justify-center gap-2 py-2 px-5 text-xs sm:text-sm font-black shadow-retro-sm transition-all text-center border-2 whitespace-nowrap min-w-[170px]',
                          buttonClass
                        )}
                      >
                        <Play className="h-3 w-3 fill-[#FFFFFF] text-[#FFFFFF]" />
                        <span className="text-[#FFFFFF]">{buttonText}</span>
                        <span className="text-[#FFFFFF]">&rarr;</span>
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
