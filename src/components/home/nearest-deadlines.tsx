'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Award, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateCountdown, type HomeDeadlineItem } from '@/modules/academic/home-utils';

interface NearestDeadlinesProps {
  initialItems: HomeDeadlineItem[];
}

export function NearestDeadlines({ initialItems }: NearestDeadlinesProps) {
  const [items, setItems] = useState<HomeDeadlineItem[]>(initialItems);

  // Perbarui hitung mundur di klien setiap menit
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
    <section aria-label="Tenggat Terdekat" className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg border-2 border-retro-border bg-retro-warm text-black shadow-xs">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
            Tenggat Terdekat
          </h2>
        </div>
        <Link
          href="/calendar"
          className="text-base sm:text-lg font-black text-muted-foreground hover:text-foreground transition-colors"
        >
          more &rarr;
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-6 rounded-2xl border-2 border-retro-border bg-retro-surface text-center space-y-2 shadow-retro">
          <CheckCircle2 className="h-8 w-8 text-retro-mint mx-auto" />
          <p className="font-heading font-black text-lg text-foreground">Semua Tugas Selesai</p>
          <p className="text-sm text-muted-foreground">Tidak ada tenggat tugas atau kuis yang menunggu pengumpulan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {items.map((item) => {
            const isQuiz = item.type === 'QUIZ';

            return (
              <div
                key={item.id}
                className={cn(
                  'group p-3.5 sm:p-4 rounded-xl border-2 border-retro-border bg-retro-surface shadow-retro hover:-translate-y-0.5 hover:shadow-retro-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5',
                  item.isUrgent && 'border-black bg-retro-warm/50'
                )}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'shrink-0 p-2 sm:p-2.5 rounded-lg border-2 border-retro-border flex items-center justify-center shadow-xs',
                      isQuiz ? 'bg-retro-yellow text-black' : 'bg-retro-warm text-black'
                    )}
                  >
                    {isQuiz ? <Award className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-sans font-black uppercase tracking-wider text-muted-foreground">
                        {item.classTitle}
                      </span>
                      {item.isUrgent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-sans font-black bg-retro-orange text-white border border-black">
                          MENDESAK
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-black text-base sm:text-lg text-foreground break-words leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold text-black">
                    <Clock className="h-4 w-4 text-retro-orange shrink-0" />
                    <span>{item.dueCountdown}</span>
                  </div>

                  <Link
                    href={item.actionHref}
                    className="px-4 py-2 rounded-xl border-2 border-retro-border bg-black text-white font-heading font-black text-xs sm:text-sm hover:bg-black/90 active:translate-y-0.5 transition-all shadow-xs shrink-0"
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
