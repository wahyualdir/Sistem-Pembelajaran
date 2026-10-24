'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Award,
  CalendarCheck2,
  FileText,
  ChevronRight,
  ArrowRight,
  Layers,
  X,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BannerConditionItem, HomeBannerData } from '@/modules/academic/home-actions';

interface ActionBannerProps {
  initialData: HomeBannerData;
  onRefresh?: () => Promise<HomeBannerData>;
}

export function ActionBanner({ initialData, onRefresh }: ActionBannerProps) {
  const [data, setData] = useState<HomeBannerData>(initialData);
  const [showOthersModal, setShowOthersModal] = useState(false);

  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await onRefresh();
        if (fresh) setData(fresh);
      } catch {
        // Ignore polling errors
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [onRefresh]);

  const { primary, others } = data;
  const isUrgent = primary.priority <= 3;

  const getCategoryIcon = (cat: BannerConditionItem['category']) => {
    const iconClass = 'h-5 w-5 sm:h-6 sm:w-6 text-white';
    switch (cat) {
      case 'EXAM':
        return <Award className={iconClass} />;
      case 'ATTENDANCE':
        return <CalendarCheck2 className={iconClass} />;
      case 'ASSIGNMENT':
        return <FileText className={iconClass} />;
      case 'CLASS_UPCOMING':
        return <Layers className={iconClass} />;
      case 'IDLE':
      default:
        return <BookOpen className={iconClass} />;
    }
  };

  return (
    <>
      <section
        aria-label="Banner Aksi Utama"
        className={cn(
          'relative w-full rounded-2xl border border-[#E2E3E4] bg-[#FFFFFF] p-5 sm:p-6 transition-all flex flex-col justify-between overflow-hidden shadow-2xs',
          isUrgent ? 'border-l-4 border-l-[#9F1521]' : 'border-l-4 border-l-[#111111]'
        )}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          {/* Kiri: Ikon + Kontras Tipografi Besar-Kecil ala Telkom University */}
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={cn(
                'shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center shadow-xs',
                isUrgent ? 'bg-[#9F1521]' : 'bg-[#111111]'
              )}
            >
              {getCategoryIcon(primary.category)}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {primary.badge && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold bg-[#FEF2F2] text-[#9F1521] uppercase tracking-wider">
                    {primary.badge}
                  </span>
                )}

                {others.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowOthersModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold border border-[#E2E3E4] bg-[#F3F3F4] text-[#58595B] hover:text-[#111111] transition-colors cursor-pointer"
                    title="Buka daftar hal mendesak lainnya"
                  >
                    <span>+{others.length} agenda lainnya</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Judul Besar & Tegas */}
              <h2 className="font-heading font-extrabold text-lg sm:text-xl lg:text-[21px] tracking-tight leading-snug text-[#111111]">
                {primary.title}
              </h2>

              {/* Deskripsi Kecil & Ringan */}
              <p className="text-xs sm:text-[13px] font-normal leading-relaxed max-w-2xl text-[#58595B]">
                {primary.subtitle}
              </p>
            </div>
          </div>

          {/* Kanan: Tombol Pill Bulat Khas Telkom University (border-radius: 35px / rounded-full) */}
          <div className="shrink-0 pt-1 md:pt-0">
            <Link
              href={primary.buttonHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-sans font-bold text-xs sm:text-[13px] transition-all w-full md:w-auto text-center bg-[#9F1521] text-white hover:bg-[#8F131E] shadow-xs cursor-pointer"
            >
              <span>{primary.buttonLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modal Daftar Ringkas "+N lainnya" */}
      {showOthersModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E2E3E4] bg-[#FFFFFF] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E3E4] pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#9F1521]" />
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#111111]">
                  Agenda Mendesak Lainnya ({others.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOthersModal(false)}
                className="p-1.5 rounded-full hover:bg-[#F3F3F4] transition-colors cursor-pointer"
                title="Tutup dialog"
              >
                <X className="h-4 w-4 text-[#58595B]" />
              </button>
            </div>

            <div className="divide-y divide-[#E2E3E4] max-h-[60vh] overflow-y-auto">
              {others.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#9F1521]">
                      {item.badge || `Prioritas ${item.priority}`}
                    </span>
                    <h4 className="font-heading font-bold text-sm text-[#111111] truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs font-normal text-[#58595B] truncate">{item.subtitle}</p>
                  </div>

                  <Link
                    href={item.buttonHref}
                    onClick={() => setShowOthersModal(false)}
                    className="shrink-0 px-4 py-1.5 rounded-full bg-[#9F1521] text-white font-bold text-xs hover:bg-[#8F131E] transition-colors"
                  >
                    {item.buttonLabel}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
