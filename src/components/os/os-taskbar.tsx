'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function OSTaskbar() {
  const [startOpen, setStartOpen] = useState(false);
  const [timeString, setTimeString] = useState('');
  const startMenuRef = useRef<HTMLDivElement>(null);

  // Live Clock (HH:MM:SS)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close Start Menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (startMenuRef.current && !startMenuRef.current.contains(e.target as Node)) {
        setStartOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollTo = (id: string) => {
    setStartOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={startMenuRef} className="fixed bottom-0 left-0 right-0 z-50 select-none font-mono vt-taskbar h-9 px-2 flex items-center justify-between text-xs text-[#1C1917]">
      {/* Start Menu Pop-up (Exact Velqora Learn 98 Style) */}
      {startOpen && (
        <div className="absolute bottom-10 left-2 w-64 bg-[#ECE9D8] border-2 border-[#FFFFFF] border-r-[#7A756D] border-b-[#7A756D] shadow-2xl overflow-hidden flex z-50 text-xs">
          {/* Left Vertical Brand Stripe */}
          <div className="w-8 bg-gradient-to-t from-[#853827] via-[#C2553A] to-[#EE7257] flex items-end justify-center pb-3 text-white font-bold select-none">
            <span className="-rotate-90 tracking-widest text-sm whitespace-nowrap drop-shadow-xs">
              RUANGKAMPUS
            </span>
          </div>

          {/* Menu Items */}
          <div className="flex-1 p-1 space-y-0.5 text-[#1C1917]">
            <Link
              href="/login"
              onClick={() => setStartOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#C2553A] hover:text-white transition-colors text-left"
            >
              <span className="text-sm">▤</span>
              <span className="font-semibold">Masuk ke Portal</span>
            </Link>

            <Link
              href="/register"
              onClick={() => setStartOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#C2553A] hover:text-white transition-colors text-left"
            >
              <span className="text-sm font-bold text-[#C2553A]">✚</span>
              <span className="font-semibold">Daftar Akun Baru</span>
            </Link>

            <div className="h-px bg-[#B8B1A5] my-1" />

            <button
              type="button"
              onClick={() => scrollTo('curriculum-section')}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#C2553A] hover:text-white transition-colors text-left cursor-pointer"
            >
              <span className="text-sm">▦</span>
              <span>Kurikulum &amp; Modul</span>
            </button>

            <button
              type="button"
              onClick={() => scrollTo('notepad-section')}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#C2553A] hover:text-white transition-colors text-left cursor-pointer"
            >
              <span className="text-sm">✎</span>
              <span>Manifesto Kuliah</span>
            </button>

            <button
              type="button"
              onClick={() => scrollTo('stats-section')}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#C2553A] hover:text-white transition-colors text-left cursor-pointer"
            >
              <span className="text-sm">▣</span>
              <span>System Monitor</span>
            </button>
          </div>
        </div>
      )}

      {/* Start Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStartOpen(!startOpen)}
          className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 rounded-none cursor-pointer ${
            startOpen ? 'vt-window-inset bg-[#FAF8F5]' : 'vt-btn-chrome'
          }`}
        >
          <div className="w-3.5 h-3.5 bg-[#C2553A] text-white text-[9px] flex items-center justify-center font-bold">
            R
          </div>
          <span>Start</span>
        </button>

        {/* Active Window Button on Taskbar */}
        <div className="hidden sm:flex items-center px-3 py-0.5 vt-window-inset bg-[#FAF8F5] text-[11px] text-[#1C1917] font-semibold gap-1.5 max-w-[220px] truncate">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          <span className="truncate">RuangKampus Academic OS</span>
        </div>
      </div>

      {/* Right Side: Tray & Live Clock */}
      <div className="flex items-center gap-1.5">
        <div className="px-2 py-0.5 vt-window-inset bg-[#FAF8F5] text-[11px] font-mono text-[#57534E] flex items-center gap-1.5">
          <span className="hidden md:inline">RUANGKAMPUS OS v2.4</span>
          <span className="text-[#C2553A] font-bold">●</span>
          <span>{timeString || '12:00:00'}</span>
        </div>
      </div>
    </div>
  );
}
