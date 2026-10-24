'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Award, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateCountdown, type HomeDeadlineItem } from '@/modules/academic/home-utils';

interface NearestDeadlinesProps {
  initialItems: HomeDeadlineItem[];
}

export function NearestDeadlines({ initialItems }: NearestDeadlinesProps) {
  const [items, setItems] = useState<HomeDeadlineItem[]>(initialItems);

  useEffect(() => {
    const timer = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => {
          const cd = calculateCountdown(item.dueAt);
          return {
            ...item,
            dueCountdown: cd.text,
            isUrgent: cd.isUrgent,
          };
        })
      );
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section aria-label="Tenggat Terdekat" className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#C2553A]" />
          <h2 className="font-heading font-bold text-lg sm:text-xl tracking-tight text-[#1C1917]">
            Tenggat Terdekat
          </h2>
        </div>
        <Link
          href="/calendar"
          className="text-xs font-semibold text-[#C2553A] hover:text-[#1C1917] transition-colors shrink-0"
        >
          Semua Tenggat &rarr;
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-6 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] text-center space-y-2">
          <CheckCircle2 className="h-7 w-7 text-[#059669] mx-auto" />
          <p className="font-heading font-bold text-base text-[#1C1917]">Semua Tugas Selesai</p>
          <p className="text-xs text-[#57534E]">Tidak ada tenggat tugas atau kuis yang menunggu pengumpulan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((item) => {
            const isQuiz = item.type === 'QUIZ';

            return (
              <div
                key={item.id}
                className={cn(
                  'group p-4 rounded-xl border bg-[#FFFFFF] transition-all flex flex-col justify-between gap-2.5',
                  item.isUrgent
                    ? 'border-[#C2553A] bg-[#FAF8F5]'
                    : 'border-[#D6D3CB] hover:border-[#7A756D]'
                )}
              >
                {/* Baris 1: Ikon + Nama Mata Kuliah di Kiri, Badge Mendesak di Kanan */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 p-1.5 rounded-lg border border-[#D6D3CB] bg-[#FFFFFF] text-[#C2553A] flex items-center justify-center">
                      {isQuiz ? <Award className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <span className="text-xs font-semibold text-[#57534E] truncate">
                      {item.classTitle}
                    </span>
                  </div>

                  {item.isUrgent ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FEF2F0] text-[#853827] border border-[#C2553A] shrink-0">
                      <AlertCircle className="h-2.5 w-2.5" />
                      MENDESAK
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#F2EFE8] text-[#57534E] shrink-0">
                      {isQuiz ? 'KUIS' : 'TUGAS'}
                    </span>
                  )}
                </div>

                {/* Baris 2: Judul Tugas / Kuis Lebar Penuh (Tidak Terpotong Sempit) */}
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#1C1917] leading-snug line-clamp-2">
                  {item.title}
                </h3>

                {/* Baris 3: Countdown di Kiri & Tombol Aksi di Kanan */}
                <div className="pt-2.5 border-t border-[#E8E5DE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#853827] tabular-nums">
                    <Clock className="h-3.5 w-3.5 text-[#C2553A] shrink-0" />
                    <span>Sisa waktu: {item.dueCountdown}</span>
                  </div>

                  <Link
                    href={item.actionHref}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#1C1917] text-white font-bold text-xs hover:bg-[#C2553A] transition-colors shrink-0"
                  >
                    <span>{isQuiz ? 'Buka Kuis' : 'Kerjakan'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
