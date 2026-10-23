'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Clock,
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

  // Polling ringan 30 detik untuk mendeteksi ujian / presensi yang baru dibuka dosen
  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await onRefresh();
        if (fresh) setData(fresh);
      } catch {
        // Abaikan error polling agar tidak mengganggu UI
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [onRefresh]);

  const { primary, others, totalActive } = data;

  const isUrgent = primary.priority <= 3;

  const getCategoryIcon = (cat: BannerConditionItem['category'], isLightBg = false) => {
    const iconClass = cn('h-5 w-5 sm:h-6 sm:w-6', isLightBg ? 'text-[#C2553A]' : 'text-white');
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
          'relative w-full rounded-none vt-window p-4 sm:p-5 lg:p-6 transition-all flex flex-col justify-between overflow-hidden shadow-xs',
          isUrgent ? 'bg-[#FAF8F5] text-[#1C1917]' : 'bg-[#FFFFFF] text-[#1C1917]'
        )}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          {/* Kolom Kiri: Ikon, Badge, Judul & Subtitle */}
          <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
            <div
              className={cn(
                'shrink-0 p-2.5 sm:p-3 rounded-none border border-[#7A756D] flex items-center justify-center shadow-2xs',
                isUrgent ? 'bg-[#C2553A] text-white' : 'bg-[#FAF8F5] text-[#1C1917]'
              )}
            >
              {getCategoryIcon(primary.category, !isUrgent)}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap font-mono">
                {primary.badge && (
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-none text-[11px] font-bold border uppercase tracking-wider',
                      isUrgent
                        ? 'bg-[#C2553A] text-white border-[#EE7257]'
                        : 'bg-[#FAF8F5] text-[#853827] border-[#D6D3CB]'
                    )}
                  >
                    {primary.badge}
                  </span>
                )}

                {/* Penanda "+N lainnya" jika ada lebih dari 1 kondisi aktif */}
                {others.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowOthersModal(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[11px] font-bold border border-[#7A756D] transition-all hover:bg-white focus-visible:outline-none cursor-pointer bg-[#ECE9D8] text-[#1C1917] shadow-2xs"
                    title="Buka daftar hal mendesak lainnya"
                  >
                    <span>+{others.length} lainnya</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              <h2 className="font-heading font-bold text-base sm:text-lg lg:text-xl tracking-tight leading-snug break-words line-clamp-2 text-[#1C1917]">
                {primary.title}
              </h2>

              <p className="text-xs sm:text-sm font-medium leading-normal break-words max-w-2xl line-clamp-2 text-[#57534E]">
                {primary.subtitle}
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Tombol Aksi */}
          <div className="shrink-0 pt-2 md:pt-0">
            <Link
              href={primary.buttonHref}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-none vt-btn-terracotta text-white font-mono text-xs sm:text-sm font-bold transition-all shadow-xs w-full md:w-auto text-center"
            >
              <span>{primary.buttonLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modal / Dialog Daftar Ringkas "+N lainnya" */}
      {showOthersModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-xs"
        >
          <div className="w-full max-w-lg vt-window rounded-none bg-[#ECE9D8] shadow-2xl overflow-hidden space-y-4 animate-scale-up">
            <div className="vt-titlebar px-3 py-1.5 flex items-center justify-between select-none">
              <div className="flex items-center gap-2 text-white font-mono text-xs font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>AKSI_MENDESAK.EXE ({others.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOthersModal(false)}
                className="vt-window-btn"
                title="Tutup dialog"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {others.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 vt-window-inset bg-[#FAF8F5] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-[#C2553A] text-white">
                      {item.badge || `Prioritas ${item.priority}`}
                    </span>
                    <h4 className="font-heading font-bold text-sm text-[#1C1917] truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#57534E] truncate">{item.subtitle}</p>
                  </div>

                  <Link
                    href={item.buttonHref}
                    onClick={() => setShowOthersModal(false)}
                    className="shrink-0 px-3 py-1.5 vt-btn-terracotta text-white font-mono text-xs shadow-xs"
                  >
                    {item.buttonLabel}
                  </Link>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-[#D6D3CB] flex justify-end bg-[#ECE9D8]">
              <button
                type="button"
                onClick={() => setShowOthersModal(false)}
                className="px-4 py-1.5 vt-btn-chrome text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
