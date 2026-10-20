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

  // Warna banner hanya dari token yang sudah ada:
  // Kartu kuning retro jika ada Ujian, Presensi, atau Tugas mendesak; kartu hitam untuk kelas atau idle
  const isUrgent = primary.priority <= 3;
  const isIdle = primary.priority === 5;

  const getCategoryIcon = (cat: BannerConditionItem['category'], isLightBg = false) => {
    const iconClass = cn('h-6 w-6 sm:h-7 sm:w-7', isLightBg ? 'text-ink' : 'text-white');
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
          'relative w-full rounded-2xl border-2 border-ink p-4 sm:p-5 lg:p-6 transition-all flex flex-col justify-between overflow-hidden shadow-retro',
          isUrgent ? 'bg-gray-soft text-ink' : 'bg-surface text-ink'
        )}
      >
        {/* Dekorasi Bingkai Retro Subtle */}
        <div
          className="absolute inset-2 border-2 border-ink rounded-xl pointer-events-none opacity-5"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          {/* Kolom Kiri: Ikon, Badge, Judul & Subtitle */}
          <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
            <div
              className={cn(
                'shrink-0 p-2.5 sm:p-3 rounded-xl border-2 border-ink flex items-center justify-center shadow-xs',
                isUrgent ? 'bg-ink text-white' : 'bg-gray-soft text-ink'
              )}
            >
              {getCategoryIcon(primary.category, !isUrgent)}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {primary.badge && (
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-bold border-2 border-ink uppercase tracking-wider',
                      isUrgent
                        ? 'bg-ink text-white'
                        : 'bg-gray-soft text-ink'
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
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-bold border-2 border-ink transition-all hover:scale-105 focus-visible:outline-none cursor-pointer bg-surface text-ink hover:bg-gray-soft shadow-xs"
                    title="Buka daftar hal mendesak lainnya"
                  >
                    <span>+{others.length} lainnya</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              <h2 className="font-heading font-bold text-base sm:text-lg lg:text-xl tracking-tight leading-snug break-words line-clamp-2 text-ink">
                {primary.title}
              </h2>

              <p className="text-xs sm:text-sm font-bold leading-normal break-words max-w-2xl line-clamp-2 text-ink/80">
                {primary.subtitle}
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Tombol Aksi */}
          <div className="shrink-0 pt-2 md:pt-0">
            <Link
              href={primary.buttonHref}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl border-2 border-ink font-heading font-bold text-sm sm:text-base transition-all focus-visible:outline-none active:translate-y-0.5 shadow-retro w-full md:w-auto text-center bg-ink text-white hover:bg-ink/90 hover:scale-[1.02]"
            >
              <span>{primary.buttonLabel}</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modal / Dialog Daftar Ringkas "+N lainnya" */}
      {showOthersModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 animate-fade-in backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border-2 border-ink bg-surface p-6 shadow-retro-window space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b-2 border-ink pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-block p-1.5 rounded-lg bg-primary-dark text-white border border-ink">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <h3 className="font-heading font-bold text-lg sm:text-xl text-ink">
                  Aksi Mendesak Lainnya ({others.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOthersModal(false)}
                className="p-1 rounded-lg border border-ink hover:bg-gray-soft transition-colors"
                title="Tutup dialog"
              >
                <X className="h-5 w-5 text-ink" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {others.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border-2 border-ink bg-gray-soft/70 shadow-retro flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-sans font-bold bg-primary-dark text-white border border-ink">
                      {item.badge || `Prioritas ${item.priority}`}
                    </span>
                    <h4 className="font-heading font-bold text-base text-ink truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-dark truncate">{item.subtitle}</p>
                  </div>

                  <Link
                    href={item.buttonHref}
                    onClick={() => setShowOthersModal(false)}
                    className="shrink-0 px-3.5 py-2 rounded-lg border-2 border-ink bg-ink text-white font-heading font-bold text-xs hover:bg-ink/90 shadow-xs transition-transform hover:scale-105"
                  >
                    {item.buttonLabel}
                  </Link>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-ink flex justify-end">
              <button
                type="button"
                onClick={() => setShowOthersModal(false)}
                className="px-4 py-2 rounded-xl border-2 border-ink bg-surface font-bold text-sm hover:bg-gray-soft transition-colors"
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
