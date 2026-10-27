'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Label tabel untuk konteks pembaca layar (screen reader) */
  caption?: string;
  /** Tampilkan petunjuk geser sentuh saat pertama kali dimuat di layar kecil */
  showSwipeHint?: boolean;
  /** Kelas kustom untuk kontainer tabel gulir */
  containerClassName?: string;
}

/**
 * Komponen pembungkus tabel responsif (Bab 5.3 & 5.4.2)
 * - Mencegah overflow horizontal pada level halaman
 * - Menampilkan bayangan pudar tepi saat ada konten terpotong
 * - Menyediakan overscroll-behavior-x: contain
 * - Memberi petunjuk geser yang hilang otomatis saat pertama digulir
 */
export function ResponsiveTable({
  children,
  caption,
  showSwipeHint = true,
  className,
  containerClassName,
  ...props
}: ResponsiveTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => checkScroll());
      resizeObserver.observe(el);
    }

    const handleScroll = () => {
      checkScroll();
      if (!hasScrolled) {
        setHasScrolled(true);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScroll);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [checkScroll, hasScrolled]);

  return (
    <div
      className={cn('relative w-full my-3 group/rtable', className)}
      {...props}
    >
      {caption && <span className="sr-only">{caption}</span>}

      {/* Indikator bayangan tepi kiri */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-r from-background to-transparent transition-opacity duration-200',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Indikator bayangan tepi kanan */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-6 bg-gradient-to-l from-background to-transparent transition-opacity duration-200',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Kontainer scroll tabel */}
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-label={caption || 'Tabel data yang dapat digulir horizontal'}
        className={cn(
          'w-full overflow-x-auto overscroll-x-contain table-scroll rounded-xl border border-border bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          containerClassName
        )}
      >
        {children}
      </div>

      {/* Petunjuk sentuh sekali tampil (hilang saat digulir) */}
      {showSwipeHint && canScrollRight && !hasScrolled && (
        <div
          aria-hidden="true"
          className="mt-1.5 flex items-center justify-end gap-1.5 px-1 text-xs font-medium text-muted-foreground sm:hidden transition-opacity duration-300 animate-fade-in select-none"
        >
          <span>Geser ke samping untuk melihat seluruh data</span>
          <span className="text-primary font-bold">→</span>
        </div>
      )}
    </div>
  );
}
