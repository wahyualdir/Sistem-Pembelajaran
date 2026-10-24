'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Award, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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
                  'group p-3.5 sm:p-4 rounded-xl border bg-[#FFFFFF] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                  item.isUrgent
                    ? 'border-[#C2553A] bg-[#FAF8F5]'
                    : 'border-[#D6D3CB] hover:border-[#7A756D]'
                )}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="shrink-0 p-2 rounded-lg border border-[#D6D3CB] bg-[#FAF8F5] text-[#C2553A] flex items-center justify-center">
                    {isQuiz ? <Award className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-[#57534E]">
                        {item.classTitle}
                      </span>
                      {item.isUrgent && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#FEF2F0] text-[#853827] border border-[#C2553A]">
                          <AlertCircle className="h-2.5 w-2.5" />
                          MENDESAK
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-[#1C1917] break-words leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E5DE]">
                  <div className="flex items-center gap-1 text-xs font-mono font-semibold text-[#853827] tabular-nums">
                    <Clock className="h-3.5 w-3.5 text-[#C2553A] shrink-0" />
                    <span>{item.dueCountdown}</span>
                  </div>

                  <Link
                    href={item.actionHref}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1C1917] text-white font-semibold text-xs hover:bg-[#C2553A] transition-colors shrink-0"
                  >
                    {isQuiz ? 'Buka Kuis' : 'Kerjakan'}
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
