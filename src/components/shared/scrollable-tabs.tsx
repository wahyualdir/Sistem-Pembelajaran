'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface ScrollableTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Kelas kontainer bilah tab */
  listClassName?: string;
  /** Label aksesibilitas untuk bilah tab */
  ariaLabel?: string;
}

/**
 * Komponen pembungkus tab bergulir horizontal (Bab 5.3 & M06)
 * - overflow-x-auto + snap-x tanpa scrollbar terlihat
 * - Indikator pudar tepi kiri & kanan saat ada item terpotong
 * - Otomatis menggulir tab aktif ke tengah pandangan (center on active)
 */
export function ScrollableTabs({
  children,
  className,
  listClassName,
  ariaLabel = 'Daftar tab navigasi',
  ...props
}: ScrollableTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
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

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [checkScroll]);

  // Efek gulir otomatis memusatkan elemen tab yang sedang aktif
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const activeItem = el.querySelector<HTMLElement>(
      '[data-state="active"], [aria-selected="true"], [data-active="true"], .tab-active'
    );
    if (activeItem) {
      const containerWidth = el.clientWidth;
      const itemOffset = activeItem.offsetLeft;
      const itemWidth = activeItem.offsetWidth;
      const targetScroll = itemOffset - containerWidth / 2 + itemWidth / 2;

      el.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [children]);

  return (
    <div className={cn('relative w-full overflow-hidden', className)} {...props}>
      {/* Bayangan pudar kiri */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-200',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Bayangan pudar kanan */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-background to-transparent transition-opacity duration-200',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Baris tab yang dapat digulir horizontal */}
      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-1 touch-pan-x',
          listClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
