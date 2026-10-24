'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Clock,
  BookOpen,
  Brain,
  Bell,
  ArrowRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyPriorityItem } from '@/lib/akademik/daily-priorities';
import { dismissDailyPriorityAction } from '@/modules/academic/peta-pulau-actions';

export function DailyPriorityCard({ initialItems }: { initialItems: DailyPriorityItem[] }) {
  const [items, setItems] = useState<DailyPriorityItem[]>(initialItems);
  const [dismissingKey, setDismissingKey] = useState<string | null>(null);

  const handleDismiss = async (itemKey: string) => {
    setDismissingKey(itemKey);
    // Optimistic update
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
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'flashcard':
        return <Brain className="h-4 w-4 text-indigo-600" />;
      case 'bab':
        return <BookOpen className="h-4 w-4 text-emerald-600" />;
      default:
        return <Bell className="h-4 w-4 text-[#C2553A]" />;
    }
  };

  const getBadgeStyle = (key: string) => {
    const kind = getKind(key);
    switch (kind) {
      case 'ujian':
      case 'tenggat':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'flashcard':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'bab':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-[#FAF8F5] text-[#1C1917] border-[#E8E5DE]';
    }
  };

  return (
    <section aria-label="Prioritas Hari Ini" className="space-y-3 animate-fade-up font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl border border-[#E8E5DE] bg-[#FFFFFF] text-[#1C1917] shadow-2xs">
            <Sparkles className="h-4 w-4 text-[#C2553A]" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#1C1917] tracking-tight">
              Prioritas Hari Ini
            </h2>
            <p className="text-xs text-[#57534E] font-medium">
              Fokus pembelajaran cerdas terurut berdasarkan tenggat dan capaian Anda
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#57534E] px-2 py-0.5 rounded-full border border-[#E8E5DE] bg-[#FFFFFF]">
          {items.length} butir
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {items.map((item) => (
          <div
            key={item.key}
            className="p-3 sm:p-3.5 rounded-xl border border-[#E8E5DE] bg-[#FFFFFF] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D6D3CB] transition-all"
          >
            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] shrink-0 mt-0.5 sm:mt-0">
                {getIcon(item.key)}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-bold border',
                      getBadgeStyle(item.key)
                    )}
                  >
                    {item.reason}
                  </span>
                  <span className="text-xs font-bold text-[#57534E] truncate max-w-[180px]">
                    {item.className}
                  </span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-[#1C1917] truncate">
                  {item.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Link
                href={item.actionHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D6D3CB] bg-[#FAF8F5] hover:bg-[#FFFFFF] text-[#1C1917] text-xs font-bold shadow-2xs transition-all"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="h-3 w-3 text-[#C2553A]" />
              </Link>

              <button
                type="button"
                onClick={() => handleDismiss(item.key)}
                disabled={dismissingKey === item.key}
                className="p-1.5 rounded-lg text-[#7A756D] hover:text-[#1C1917] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                title="Tandai selesai / abaikan"
                aria-label="Tandai selesai"
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
