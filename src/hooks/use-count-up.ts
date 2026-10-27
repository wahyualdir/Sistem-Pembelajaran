'use client';

import { useState, useEffect } from 'react';
import { useMotionPreference } from './use-motion-preference';

export interface UseCountUpOptions {
  /** Durasi animasi dalam milidetik (default: 600ms sesuai --dur-data) */
  duration?: number;
  /** Jumlah digit di belakang koma (default: 0 untuk bilangan bulat, 2 jika nilai berkoma) */
  decimals?: number;
}

/**
 * Hook animasi kenaikan angka statistik (M10)
 * Menghormati preferensi gerak: langsung menampilkan angka akhir pada mode 'hemat' atau 'mati'.
 */
export function useCountUp(endValue: number, options: UseCountUpOptions = {}): string {
  const { isMotionFull } = useMotionPreference();
  const {
    duration = 600,
    decimals = Number.isInteger(endValue) ? 0 : 2,
  } = options;

  const [currentValue, setCurrentValue] = useState<number>(() => {
    // Di server atau saat gerak mati/hemat, mulai dari angka akhir
    return endValue;
  });

  useEffect(() => {
    // Jika animasi dimatikan atau dikurangi, langsung pasang angka final
    if (!isMotionFull || duration <= 0) {
      setCurrentValue(endValue);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing out cubic (cepat di awal, lembut di akhir)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const val = startValue + (endValue - startValue) * easeOut;

      setCurrentValue(val);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCurrentValue(endValue);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [endValue, duration, isMotionFull]);

  return currentValue.toFixed(decimals);
}
