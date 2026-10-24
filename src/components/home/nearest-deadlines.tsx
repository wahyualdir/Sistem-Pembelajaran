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
    <section aria-label="Tenggat Terdekat" className="space-y-3.5 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#9F1521]" />
          <h2 className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-[#111111]">
            Tenggat Terdekat
          </h2>
        </div>
        <Link
          href="/calendar"
          className="text-xs font-bold text-[#9F1521] hover:text-[#111111] transition-colors shrink-0"
        >
          Semua Tenggat &rarr;
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-6 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] text-center space-y-1.5">
          <CheckCircle2 className="h-7 w-7 text-[#059669] mx-auto" />
          <p className="font-heading font-bold text-base text-[#111111]">Semua Tugas Selesai</p>
          <p className="text-xs text-[#58595B] font-normal">Tidak ada tenggat tugas atau kuis yang menunggu pengumpulan.</p>
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
                    ? 'border-[#9F1521]/40 border-l-4 border-l-[#9F1521]'
                    : 'border-[#E2E3E4] hover:border-[#9F1521]'
                )}
              >
                {/* Baris 1: Ikon + Nama Mata Kuliah di Kiri, Badge Mendesak di Kanan */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 p-1.5 rounded-lg bg-[#FEF2F0] text-[#9F1521] flex items-center justify-center">
                      {isQuiz ? <Award className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <span className="text-xs font-normal text-[#58595B] truncate">
                      {item.classTitle}
                    </span>
                  </div>

                  {item.isUrgent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F0] text-[#9F1521] border border-[#FDDDD7] shrink-0">
                      <AlertCircle className="h-2.5 w-2.5" />
                      MENDESAK
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F3F3F4] text-[#58595B] shrink-0">
                      {isQuiz ? 'KUIS' : 'TUGAS'}
                    </span>
                  )}
                </div>

                {/* Baris 2: Judul Tugas / Kuis Besar & Kontras */}
                <h3 className="font-heading font-extrabold text-base text-[#111111] leading-snug line-clamp-2 group-hover:text-[#9F1521] transition-colors">
                  {item.title}
                </h3>

                {/* Baris 3: Countdown Kecil di Kiri & Tombol Pill Tel-U di Kanan */}
                <div className="pt-2.5 border-t border-[#E2E3E4] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#58595B] tabular-nums">
                    <Clock className="h-3.5 w-3.5 text-[#9F1521] shrink-0" />
                    <span>Sisa waktu: <strong className="text-[#111111]">{item.dueCountdown}</strong></span>
                  </div>

                  <Link
                    href={item.actionHref}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#9F1521] text-white font-bold text-xs hover:bg-[#8F131E] transition-colors shrink-0"
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
