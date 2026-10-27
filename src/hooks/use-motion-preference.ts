'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

export type MotionPreference = 'penuh' | 'hemat' | 'mati';

const STORAGE_KEY = 'siajar_motion';

function getInitialMotionPreference(): MotionPreference {
  if (typeof window === 'undefined') {
    return 'penuh';
  }

  // 1. Cek nilai dari localStorage pengguna
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as MotionPreference | null;
    if (saved === 'penuh' || saved === 'hemat' || saved === 'mati') {
      return saved;
    }
  } catch {
    // localStorage diblokir
  }

  // 2. Cek atribut data-motion yang sudah ada di <html>
  const attr = document.documentElement.getAttribute('data-motion') as MotionPreference | null;
  if (attr === 'penuh' || attr === 'hemat' || attr === 'mati') {
    return attr;
  }

  // 3. Cek sakelar lingkungan NEXT_PUBLIC_FF_MOTION
  if (process.env.NEXT_PUBLIC_FF_MOTION === 'false') {
    return 'mati';
  }

  // 4. Cek kelas lite-performance-mode (yang sudah ada)
  if (document.documentElement.classList.contains('lite-performance-mode')) {
    return 'hemat';
  }

  // 5. Cek preferensi OS / peramban prefers-reduced-motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'hemat';
  }

  // 6. Cek Save-Data header dari browser koneksi hemat data
  const nav = navigator as unknown as { connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) {
    return 'hemat';
  }

  return 'penuh';
}

function applyMotionToDOM(motion: MotionPreference) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-motion', motion);

  try {
    localStorage.setItem(STORAGE_KEY, motion);
  } catch {
    // Abaikan jika localStorage diblokir
  }
}

/**
 * Hook reaktif untuk membaca dan mengubah preferensi animasi SIAJAR (Fase 5: 6.3)
 * Nilai: 'penuh' | 'hemat' | 'mati'
 */
export function useMotionPreference(): {
  motion: MotionPreference;
  setMotion: (val: MotionPreference) => void;
  isMotionFull: boolean;
  isMotionReduced: boolean;
  isMotionDisabled: boolean;
} {
  const [motion, setMotionState] = useState<MotionPreference>('penuh');

  useEffect(() => {
    const initial = getInitialMotionPreference();
    setMotionState(initial);
    applyMotionToDOM(initial);

    // Pasang listener jika pengguna mengubah prefers-reduced-motion di sistem
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      try {
        const manual = localStorage.getItem(STORAGE_KEY);
        if (!manual) {
          const next = e.matches ? 'hemat' : 'penuh';
          setMotionState(next);
          applyMotionToDOM(next);
        }
      } catch {
        // noop
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, []);

  const setMotion = useCallback((val: MotionPreference) => {
    setMotionState(val);
    applyMotionToDOM(val);
  }, []);

  return {
    motion,
    setMotion,
    isMotionFull: motion === 'penuh',
    isMotionReduced: motion === 'hemat',
    isMotionDisabled: motion === 'mati',
  };
}
