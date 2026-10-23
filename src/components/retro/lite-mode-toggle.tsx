'use client';

import React, { useState, useEffect } from 'react';
import { Zap, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LiteModeToggle({ className }: { className?: string }) {
  const [isLiteMode, setIsLiteMode] = useState(false);

  useEffect(() => {
    // Check initial state from localStorage
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
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-ink text-xs font-mono font-bold transition-all shadow-retro-xs cursor-pointer',
        isLiteMode
          ? 'bg-ink text-white hover:bg-black'
          : 'bg-surface text-ink hover:bg-gray-soft',
        className
      )}
      title={
        isLiteMode
          ? 'Mode Performa Ringan Aktif (Bayangan & animasi dinonaktifkan untuk hemat baterai/RAM)'
          : 'Aktifkan Mode Performa Ringan (Cocok untuk perangkat dengan spesifikasi lama)'
      }
      aria-label="Sakelar Mode Hemat Performa"
      aria-pressed={isLiteMode}
    >
      {isLiteMode ? (
        <>
          <Zap className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
          <span className="hidden sm:inline">Mode Cepat: ON</span>
          <span className="sm:hidden">Cepat</span>
        </>
      ) : (
        <>
          <ZapOff className="h-3.5 w-3.5 text-gray-dark" />
          <span className="hidden sm:inline">Mode Cepat: OFF</span>
          <span className="sm:hidden">Hemat</span>
        </>
      )}
    </button>
  );
}
