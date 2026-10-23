'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Award,
  Clock,
  ShieldAlert,
  Play,
  FileText,
  CheckCircle2,
  Calendar,
  BookOpen,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExamCategory = 'ALL' | 'KUIS' | 'LATIHAN' | 'UTS' | 'UAS';

interface StudentExamsHubViewProps {
  initialQuizzes: any[];
}

export function StudentExamsHubView({ initialQuizzes }: StudentExamsHubViewProps) {
  const [activeTab, setActiveTab] = useState<ExamCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Perhitungan kuantitas per kategori
  const counts = useMemo(() => {
    return {
      ALL: initialQuizzes.length,
      KUIS: initialQuizzes.filter((q) => (q.exam_type ?? 'KUIS') === 'KUIS').length,
      LATIHAN: initialQuizzes.filter((q) => q.exam_type === 'LATIHAN').length,
      UTS: initialQuizzes.filter((q) => q.exam_type === 'UTS').length,
      UAS: initialQuizzes.filter((q) => q.exam_type === 'UAS').length,
    };
  }, [initialQuizzes]);

  // Penyaringan daftar sesi evaluasi
  const filteredQuizzes = useMemo(() => {
    let list = initialQuizzes;
    if (activeTab !== 'ALL') {
      list = list.filter((q) => {
        const type = q.exam_type ?? 'KUIS';
        return type === activeTab;
      });
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((item) =>
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    return list;
  }, [initialQuizzes, activeTab, searchQuery]);

  const tabs: Array<{ id: ExamCategory; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'ALL', label: 'Semua', icon: Layers },
    { id: 'KUIS', label: 'Kuis', icon: Sparkles },
    { id: 'LATIHAN', label: 'Latihan Mandiri', icon: BookOpen },
    { id: 'UTS', label: 'UTS', icon: FileText },
    { id: 'UAS', label: 'UAS', icon: Award },
  ];

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* 1. HEADER HALAMAN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#7A756D] pb-4">
          <div className="space-y-1">
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-[#1C1917] flex items-center gap-2.5">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-[#C2553A] inline-block shrink-0" />
              <span>Pusat Evaluasi & Ujian</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#2D2823] font-bold">
              Kuis berkala, latihan mandiri, ujian tengah semester (UTS), dan ujian akhir semester (UAS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/exams/history"
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#7A756D] bg-[#FFFFFF] font-extrabold text-xs sm:text-sm text-[#1C1917] shadow-retro-sm hover:bg-[#FAF8F5] transition-all min-h-[40px]"
            >
              <FileText className="h-4 w-4 text-[#C2553A]" />
              <span>Riwayat Hasil Evaluasi</span>
            </Link>

            <span className="inline-flex items-center px-3.5 py-2 text-xs font-sans font-black bg-[#FAF8F5] border-2 border-[#7A756D] text-[#1C1917] shadow-retro-sm min-h-[40px]">
              {initialQuizzes.length} SESI TERSEDIA
            </span>
          </div>
        </div>

        {/* 2. RINGKASAN STATUS CEPAT (METRIC CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Kuis & Latihan */}
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#7A756D] shadow-retro-sm flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase text-[#853827] tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#C2553A]" />
                Kuis & Latihan Mandiri
              </span>
              <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#065F46] border border-[#10B981] text-[10px] font-black uppercase tracking-wider">
                Aktif
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-[#1C1917] tracking-tight">
                {counts.KUIS + counts.LATIHAN} <span className="text-xs font-bold text-[#7A756D]">Sesi Siap</span>
              </p>
              <p className="text-xs font-bold text-[#2D2823] mt-0.5">
                Asah pemahaman materi & kuis berkala
              </p>
            </div>
          </div>

          {/* Card 2: Pekan UTS & UAS */}
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#7A756D] shadow-retro-sm flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase text-[#853827] tracking-wider flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-[#C2553A]" />
                Pekan UTS & UAS Resmi
              </span>
              <span className="px-2 py-0.5 bg-[#FEF4F1] text-[#853827] border border-[#C2553A] text-[10px] font-black uppercase tracking-wider">
                Terjadwal
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-[#1C1917] tracking-tight">
                {counts.UTS + counts.UAS} <span className="text-xs font-bold text-[#7A756D]">Jadwal Ujian</span>
              </p>
              <p className="text-xs font-bold text-[#2D2823] mt-0.5">
                Evaluasi komprehensif berbobot semester
              </p>
            </div>
          </div>

          {/* Card 3: Syarat Kelayakan Ujian */}
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#7A756D] shadow-retro-sm flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase text-[#065F46] tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
                Syarat Kelayakan Ujian
              </span>
              <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#065F46] border border-[#10B981] text-[10px] font-black uppercase tracking-wider">
                Kartu Siap
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-[#10B981] tracking-tight">
                Memenuhi Syarat
              </p>
              <p className="text-xs font-bold text-[#2D2823] mt-0.5">
                Presensi kuliah &ge; 75% terverifikasi
              </p>
            </div>
          </div>
        </div>

        {/* 3. PANDUAN PENGAWASAN BERJENJANG (TANPA EMOTIKON) */}
        <div className="border-2 border-[#7A756D] border-l-4 border-l-[#C2553A] bg-[#FAF8F5] p-4 sm:p-5 shadow-retro-sm space-y-3">
          <div className="flex items-center gap-2 text-[#1C1917] font-black text-sm sm:text-base">
            <ShieldAlert className="h-4 w-4 text-[#C2553A] shrink-0" />
            <span>Kebijakan Pengawasan Berjenjang (Proctoring Policy)</span>
          </div>
          <p className="text-xs text-[#2D2823] leading-relaxed font-bold">
            Sistem menerapkan aturan pengawasan yang adaptif sesuai jenis evaluasi yang Anda kerjakan:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
            {/* Kolom 1: Latihan */}
            <div className="p-3 bg-[#FFFFFF] border border-[#D6D3CB] space-y-1">
              <div className="flex items-center gap-1.5 font-black text-[#065F46]">
                <BookOpen className="h-3.5 w-3.5 text-[#10B981]" />
                <span>Latihan Mandiri (Off)</span>
              </div>
              <p className="text-[#2D2823] font-semibold leading-relaxed">
                Bebas membuka materi modul & tanpa batasan percobaan. Hasil dan pembahasan keluar seketika.
              </p>
            </div>

            {/* Kolom 2: Kuis */}
            <div className="p-3 bg-[#FFFFFF] border border-[#D6D3CB] space-y-1">
              <div className="flex items-center gap-1.5 font-black text-[#92400E]">
                <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
                <span>Kuis Mingguan (Light)</span>
              </div>
              <p className="text-[#2D2823] font-semibold leading-relaxed">
                Pengawasan timer fleksibel untuk menguji pemahaman bab perkuliahan sebelum batas tenggat.
              </p>
            </div>

            {/* Kolom 3: UTS/UAS */}
            <div className="p-3 bg-[#FFFFFF] border border-[#D6D3CB] space-y-1">
              <div className="flex items-center gap-1.5 font-black text-[#853827]">
                <Award className="h-3.5 w-3.5 text-[#C2553A]" />
                <span>UTS & UAS (Standard / Strict)</span>
              </div>
              <p className="text-[#2D2823] font-semibold leading-relaxed">
                Wajib layar penuh, pelacakan perpindahan tab browser, dan verifikasi syarat presensi kehadiran.
              </p>
            </div>
          </div>
        </div>

        {/* 4. BILAH FILTER KATEGORI & PENCARIAN */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b-2 border-[#7A756D] pb-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = counts[tab.id];

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 text-xs font-sans transition-all cursor-pointer min-h-[38px]',
                      isActive
                        ? 'bg-[#C2553A] text-[#FFFFFF] font-black border-2 border-[#853827] shadow-retro-sm'
                        : 'bg-[#FFFFFF] text-[#1C1917] font-extrabold border-2 border-[#D6D3CB] hover:bg-[#FAF8F5]'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'ml-1 px-1.5 py-0.2 text-[11px] font-black',
                        isActive
                          ? 'bg-[#853827] text-[#FFFFFF]'
                          : 'bg-[#ECE9D8] text-[#1C1917]'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bilah Pencarian */}
            <div className="relative w-full lg:w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A756D]" />
              <input
                type="text"
                placeholder="Cari evaluasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-[#FFFFFF] border-2 border-[#7A756D] text-[#1C1917] placeholder:text-[#7A756D] focus:outline-none focus:border-[#C2553A] min-h-[38px]"
              />
            </div>
          </div>

          {/* Indikator Status & Kuantitas */}
          <div className="flex items-center justify-between text-xs font-bold text-[#2D2823]">
            <span>
              Menampilkan <span className="font-black text-[#1C1917]">{filteredQuizzes.length}</span> sesi evaluasi
            </span>
            <span className="font-black uppercase text-[#065F46] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-pulse" />
              STATUS: REAL-TIME TERHUBUNG
            </span>
          </div>

          {/* 5. GRID KARTU SESI EVALUASI */}
          {filteredQuizzes.length === 0 ? (
            <div className="p-10 sm:p-14 text-center border-2 border-dashed border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm space-y-3">
              <Award className="h-10 w-10 sm:h-12 sm:w-12 text-[#7A756D] mx-auto" />
              <h3 className="text-base sm:text-lg font-black text-[#1C1917]">
                Tidak Ada Sesi {tabs.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="text-xs sm:text-sm text-[#2D2823] font-bold max-w-md mx-auto leading-relaxed">
                Saat ini belum ada jadwal evaluasi untuk kategori ini. Anda dapat beralih ke tab lain atau mereset pencarian.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQuizzes.map((quiz: any) => {
                const type = (quiz.exam_type ?? 'KUIS') as ExamCategory;

                // Konfigurasi visual per tipe (tanpa emotikon)
                let badgeClass = 'bg-[#FEF4F1] text-[#853827] border-[#C2553A]';
                let typeLabel = 'KUIS';
                let buttonText = 'Kerjakan Kuis';
                let buttonClass = 'bg-[#1C1917] hover:bg-[#2D2823] text-[#FFFFFF] border-black';
                let proctorText = 'LIGHT';

                if (type === 'LATIHAN') {
                  badgeClass = 'bg-[#E8F5E9] text-[#065F46] border-[#10B981]';
                  typeLabel = 'LATIHAN';
                  buttonText = 'Mulai Latihan Mandiri';
                  buttonClass = 'bg-[#10B981] hover:bg-[#059669] text-[#FFFFFF] border-[#065F46]';
                  proctorText = 'OFF';
                } else if (type === 'UTS') {
                  badgeClass = 'bg-[#FEF2F0] text-[#853827] border-[#C2553A]';
                  typeLabel = 'UTS';
                  buttonText = 'Mulai Kerjakan Ujian';
                  buttonClass = 'bg-[#C2553A] hover:bg-[#853827] text-[#FFFFFF] border-[#6B2D20]';
                  proctorText = 'STANDARD';
                } else if (type === 'UAS') {
                  badgeClass = 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]';
                  typeLabel = 'UAS';
                  buttonText = 'Mulai Kerjakan UAS';
                  buttonClass = 'bg-[#DC2626] hover:bg-[#991B1B] text-[#FFFFFF] border-[#7A2E19]';
                  proctorText = 'STRICT';
                }

                const questionsCount = quiz.questions?.length ?? quiz.questionsCount ?? 10;
                const kkm = quiz.kkm ?? 70;

                return (
                  <div
                    key={quiz.id}
                    className="border-2 border-[#7A756D] bg-[#FFFFFF] p-5 shadow-retro-sm hover:shadow-retro hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Badge Tipe & Durasi */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 text-xs font-black border',
                            badgeClass
                          )}
                        >
                          {typeLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1C1917]">
                          <Clock className="h-3.5 w-3.5 text-[#C2553A]" />
                          {type === 'LATIHAN' ? 'Bebas Waktu' : `${quiz.duration_minutes} Menit`}
                        </span>
                      </div>

                      {/* Judul Evaluasi */}
                      <h3 className="font-heading font-black text-lg sm:text-xl text-[#1C1917] leading-snug line-clamp-2">
                        {quiz.title}
                      </h3>

                      {/* Deskripsi */}
                      <p className="text-xs sm:text-sm text-[#2D2823] font-bold line-clamp-3 leading-relaxed">
                        {quiz.description || 'Tidak ada petunjuk ujian tambahan.'}
                      </p>
                    </div>

                    {/* Metadata & Tombol Aksi */}
                    <div className="pt-3 border-t-2 border-[#D6D3CB] space-y-3">
                      <div className="grid grid-cols-3 gap-1 text-[11px] font-black text-[#1C1917] bg-[#FAF8F5] p-2 border border-[#D6D3CB]">
                        <div>
                          <span className="block text-[#7A756D] text-[10px]">SOAL</span>
                          {questionsCount} Butir
                        </div>
                        <div>
                          <span className="block text-[#7A756D] text-[10px]">KKM</span>
                          {kkm}
                        </div>
                        <div>
                          <span className="block text-[#7A756D] text-[10px]">PROCTOR</span>
                          <span className="truncate block">{proctorText}</span>
                        </div>
                      </div>

                      <Link
                        href={`/classes/${quiz.class_id}/quizzes/${quiz.id}`}
                        className={cn(
                          'flex w-full items-center justify-center gap-2 py-2.5 border-2 font-black text-xs sm:text-sm shadow-retro-sm transition-all text-center min-h-[42px]',
                          buttonClass
                        )}
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>{buttonText}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
