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

  const getCategoryIcon = (cat: BannerConditionItem['category']) => {
    switch (cat) {
      case 'EXAM':
        return <Award className="h-6 w-6 sm:h-7 sm:w-7 text-black" />;
      case 'ATTENDANCE':
        return <CalendarCheck2 className="h-6 w-6 sm:h-7 sm:w-7 text-black" />;
      case 'ASSIGNMENT':
        return <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-black" />;
      case 'CLASS_UPCOMING':
        return <Layers className="h-6 w-6 sm:h-7 sm:w-7 text-white" />;
      case 'IDLE':
      default:
        return <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-white" />;
    }
  };

  return (
    <>
      <section
        aria-label="Banner Aksi Utama"
        className={cn(
          'relative w-full rounded-2xl border-2 border-retro-border p-4 sm:p-5 lg:p-6 transition-all flex flex-col justify-between overflow-hidden',
          isUrgent
            ? 'bg-retro-yellow text-black shadow-retro-md sm:shadow-[4px_4px_0px_#000000]'
            : 'bg-black text-white shadow-retro-md sm:shadow-[4px_4px_0px_#000000]'
        )}
      >
        {/* Dekorasi Bingkai Retro Subtle */}
        <div
          className={cn(
            'absolute inset-2 border-2 rounded-xl pointer-events-none opacity-20',
            isUrgent ? 'border-black' : 'border-white'
          )}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          {/* Kolom Kiri: Ikon, Badge, Judul & Subtitle */}
          <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
            <div
              className={cn(
                'shrink-0 p-2.5 sm:p-3 rounded-xl border-2 border-retro-border flex items-center justify-center',
                isUrgent ? 'bg-white shadow-retro' : 'bg-retro-warm/20 text-white shadow-retro'
              )}
            >
              {getCategoryIcon(primary.category)}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {primary.badge && (
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-sans font-black border-2 border-retro-border uppercase tracking-wider',
                      isUrgent
                        ? 'bg-retro-orange text-white'
                        : 'bg-retro-yellow text-black'
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
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-black border-2 border-retro-border transition-all hover:scale-105 focus-visible:outline-none',
                      isUrgent
                        ? 'bg-white text-black hover:bg-retro-warm shadow-xs'
                        : 'bg-retro-warm/30 text-white hover:bg-retro-warm/50 shadow-xs'
                    )}
                    title="Buka daftar hal mendesak lainnya"
                  >
                    <span>+{others.length} lainnya</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              <h2
                className={cn(
                  'font-heading font-black text-base sm:text-lg lg:text-xl tracking-tight leading-snug break-words line-clamp-2',
                  isUrgent ? 'text-black' : 'text-white'
                )}
              >
                {primary.title}
              </h2>

              <p
                className={cn(
                  'text-xs sm:text-sm font-bold leading-normal break-words max-w-2xl line-clamp-2',
                  isUrgent ? 'text-black/85' : 'text-white/80'
                )}
              >
                {primary.subtitle}
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Tombol Aksi */}
          <div className="shrink-0 pt-2 md:pt-0">
            <Link
              href={primary.buttonHref}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl border-2 border-retro-border font-heading font-black text-sm sm:text-base transition-all focus-visible:outline-none active:translate-y-0.5 shadow-retro w-full md:w-auto text-center',
                isUrgent
                  ? 'bg-black text-white hover:bg-black/90 hover:scale-[1.02]'
                  : 'bg-retro-yellow text-black hover:bg-retro-yellow/90 hover:scale-[1.02]'
              )}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border-2 border-retro-border bg-retro-surface p-6 shadow-[6px_6px_0px_#000000] space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b-2 border-retro-border pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-block p-1.5 rounded-lg bg-retro-orange text-white border border-black">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <h3 className="font-heading font-black text-lg sm:text-xl text-foreground">
                  Aksi Mendesak Lainnya ({others.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOthersModal(false)}
                className="p-1 rounded-lg border border-black hover:bg-retro-warm transition-colors"
                title="Tutup dialog"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {others.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border-2 border-retro-border bg-retro-warm/70 shadow-retro flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-sans font-bold bg-black text-white">
                      {item.badge || `Prioritas ${item.priority}`}
                    </span>
                    <h4 className="font-heading font-black text-base text-foreground truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  </div>

                  <Link
                    href={item.buttonHref}
                    onClick={() => setShowOthersModal(false)}
                    className="shrink-0 px-3.5 py-2 rounded-lg border-2 border-retro-border bg-black text-white font-heading font-bold text-xs hover:bg-black/90 shadow-xs transition-transform hover:scale-105"
                  >
                    {item.buttonLabel}
                  </Link>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-retro-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowOthersModal(false)}
                className="px-4 py-2 rounded-xl border-2 border-retro-border bg-retro-surface font-bold text-sm hover:bg-retro-warm transition-colors"
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
