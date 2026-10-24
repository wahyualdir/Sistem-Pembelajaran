'use client';

import React, { useState, useEffect } from 'react';
import { Zap, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LiteModeToggle({ className }: { className?: string }) {
  const [isLiteMode, setIsLiteMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('siajar_lite_mode');
      if (saved === 'true') {
        setIsLiteMode(true);
        document.documentElement.classList.add('lite-performance-mode');
      }
    } catch {
      // Ignore localStorage exceptions in SSR/strict privacy mode
    }
  }, []);

  const toggleLiteMode = () => {
    const next = !isLiteMode;
    setIsLiteMode(next);
    try {
      localStorage.setItem('siajar_lite_mode', next ? 'true' : 'false');
      if (next) {
        document.documentElement.classList.add('lite-performance-mode');
      } else {
        document.documentElement.classList.remove('lite-performance-mode');
      }
    } catch {
      // Ignore
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLiteMode}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#F3F3F4] text-xs font-semibold text-[#58595B] hover:text-[#111111] transition-all cursor-pointer',
        isLiteMode && 'bg-[#FEF2F2] border-[#FDDDD7] text-[#9F1521]',
        className
      )}
      title={
        isLiteMode
          ? 'Mode Hemat Daya Aktif (Animasi diminimalkan)'
          : 'Aktifkan Mode Hemat Daya / Performa Ringan'
      }
      aria-label="Sakelar Mode Hemat Daya"
      aria-pressed={isLiteMode}
    >
      {isLiteMode ? (
        <>
          <Zap className="h-3.5 w-3.5 text-[#9F1521] fill-[#9F1521]" />
          <span className="hidden sm:inline">Mode Hemat: ON</span>
        </>
      ) : (
        <>
          <ZapOff className="h-3.5 w-3.5 text-[#808285]" />
          <span className="hidden sm:inline">Mode Hemat: OFF</span>
        </>
      )}
    </button>
  );
}
