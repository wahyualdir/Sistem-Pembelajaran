'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  BookOpen,
  Brain,
  ArrowRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyPriorityItem } from '@/lib/akademik/daily-priorities';
import { dismissDailyPriorityAction } from '@/modules/academic/peta-pulau-actions';

export function DailyPriorityCard({ initialItems }: { initialItems: DailyPriorityItem[] }) {
  const [items, setItems] = useState<DailyPriorityItem[]>(initialItems);
  const [dismissingKey, setDismissingKey] = useState<string | null>(null);

  const handleDismiss = async (itemKey: string) => {
    setDismissingKey(itemKey);
    setItems((prev) => prev.filter((it) => it.key !== itemKey));
    await dismissDailyPriorityAction(itemKey);
    setDismissingKey(null);
  };

  if (!items || items.length === 0) {
    return null;
  }

  const getKind = (key: string) => {
    if (key.startsWith('ujian:')) return 'ujian';
    if (key.startsWith('tenggat:')) return 'tenggat';
    if (key.startsWith('flashcard:')) return 'flashcard';
    if (key.startsWith('bab:')) return 'bab';
    return 'default';
  };

  const getIcon = (key: string) => {
    const kind = getKind(key);
    switch (kind) {
      case 'ujian':
      case 'tenggat':
        return <Clock className="h-4 w-4 text-[#9F1521]" />;
      case 'flashcard':
        return <Brain className="h-4 w-4 text-[#111111]" />;
      case 'bab':
        return <BookOpen className="h-4 w-4 text-[#9F1521]" />;
      default:
        return <Sparkles className="h-4 w-4 text-[#9F1521]" />;
    }
  };

  const getBadgeStyle = (key: string) => {
    const kind = getKind(key);
    switch (kind) {
      case 'ujian':
      case 'tenggat':
        return 'bg-[#FEF2F2] text-[#9F1521] border-[#FDDDD7]';
      case 'flashcard':
        return 'bg-[#F3F3F4] text-[#111111] border-[#E2E3E4]';
      case 'bab':
        return 'bg-[#F3F3F4] text-[#059669] border-[#E2E3E4]';
      default:
        return 'bg-[#F3F3F4] text-[#58595B] border-[#E2E3E4]';
    }
  };

  return (
    <section aria-label="Prioritas Hari Ini" className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FEF2F2] text-[#9F1521]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#111111] tracking-tight">
              Prioritas Hari Ini
            </h2>
            <p className="text-xs text-[#58595B] font-normal">
              Fokus pembelajaran cerdas terurut berdasarkan tenggat dan capaian Anda
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#808285] px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E2E3E4]">
          {items.length} butir
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {items.map((item) => (
          <div
            key={item.key}
            className="p-3.5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#9F1521] transition-all"
          >
            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-[#F3F3F4] text-[#111111] shrink-0 mt-0.5 sm:mt-0">
                {getIcon(item.key)}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[11px] font-bold border',
                      getBadgeStyle(item.key)
                    )}
                  >
                    {item.reason}
                  </span>
                  <span className="text-xs font-normal text-[#58595B] truncate max-w-[200px]">
                    {item.className}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#111111] truncate">
                  {item.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Link
                href={item.actionHref}
                className="px-4 py-1.5 rounded-full bg-[#9F1521] text-white hover:bg-[#8F131E] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <span>{item.actionLabel || 'Mulai'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => handleDismiss(item.key)}
                disabled={dismissingKey === item.key}
                className="p-1.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#F3F3F4] text-[#808285] hover:text-[#111111] transition-colors cursor-pointer"
                title="Abaikan butir untuk hari ini"
                aria-label="Abaikan untuk hari ini"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
