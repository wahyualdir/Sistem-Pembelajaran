'use client';

import React, { useRef } from 'react';
import { useCountUp } from '@/hooks/use-count-up';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

export interface CountUpNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  ariaLabel?: string;
  durationMs?: number;
}

/**
 * Komponen Angka Statistik Count-up (M10)
 * - Naik dari 0 ke nilai target dengan kurva easing out halus
 * - Tabular nums untuk menjaga stabilitas tata letak (mencegah CLS)
 * - Nilai akhir utuh selalu tertulis dalam aria-label untuk pembaca layar
 * - Menghormati prefers-reduced-motion dan data-motion="mati"/"hemat" via useCountUp
 */
export function CountUpNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  ariaLabel,
  durationMs = 600,
}: CountUpNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, rootMargin: '40px' });
  const displayValue = useCountUp(isInView ? value : 0, {
    decimals,
    duration: durationMs,
  });

  const formattedFinal = `${prefix}${decimals > 0 ? value.toFixed(decimals) : value}${suffix}`;

  return (
    <span
      ref={ref}
      aria-label={ariaLabel || formattedFinal}
      className={cn('tabular-nums inline-block', className)}
    >
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
