'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink, Terminal } from 'lucide-react';

export function OSTopBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const scrollToSection = (id: string) => {
    setActiveMenu(null);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      ref={menuRef}
      className="sticky top-0 z-50 w-full bg-[#ECE9D8] border-b-2 border-[#FFFFFF] shadow-sm text-[#1C1917] select-none"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-9 flex items-center justify-between text-xs font-mono">
        {/* Left Side: Brand & Pulldown Menus */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Logo / Brand */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2 py-0.5 font-black text-sm tracking-wide text-[#C2553A] hover:bg-[#E0DACB] rounded-none transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>RUANGKAMPUS_</span>
          </Link>

          <div className="h-4 w-px bg-[#B8B1A5] mx-1 hidden sm:block" />

          {/* Desktop Pulldown Menus (File, Edit, View, Go, Help) */}
          <div className="flex items-center gap-0.5">
            {/* File Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => handleMenuClick('file')}
                className={`px-2 py-1 rounded-none transition-colors flex items-center gap-1 cursor-pointer ${
                  activeMenu === 'file'
                    ? 'bg-[#C2553A] text-white'
                    : 'hover:bg-[#DFD8CB] text-[#1C1917]'
                }`}
              >
                File <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {activeMenu === 'file' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-[#ECE9D8] border-2 border-[#FFFFFF] border-r-[#7A756D] border-b-[#7A756D] shadow-xl py-1 z-50 text-xs text-[#1C1917]">
                  <button
                    type="button"
                    onClick={() => scrollToSection('curriculum-section')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Buka Kurikulum...</span>
                    <span className="text-[10px] opacity-70">Ctrl+O</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('notepad-section')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Baca README.txt</span>
                    <span className="text-[10px] opacity-70">F1</span>
                  </button>
                  <div className="h-px bg-[#B8B1A5] my-1" />
                  <Link
                    href="/login"
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white flex items-center justify-between text-[#C2553A]"
                  >
                    <span>Masuk ke Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => handleMenuClick('view')}
                className={`px-2 py-1 rounded-none transition-colors flex items-center gap-1 cursor-pointer ${
                  activeMenu === 'view'
                    ? 'bg-[#C2553A] text-white'
                    : 'hover:bg-[#DFD8CB] text-[#1C1917]'
                }`}
              >
                View <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {activeMenu === 'view' && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-[#ECE9D8] border-2 border-[#FFFFFF] border-r-[#7A756D] border-b-[#7A756D] shadow-xl py-1 z-50 text-[#1C1917]">
                  <button
                    type="button"
                    onClick={() => scrollToSection('hero-window')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white cursor-pointer"
                  >
                    Hero Window
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('curriculum-section')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white cursor-pointer"
                  >
                    Curriculum Explorer
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('stats-section')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white cursor-pointer"
                  >
                    System Monitor
                  </button>
                </div>
              )}
            </div>

            {/* Go Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => handleMenuClick('go')}
                className="px-2.5 py-0.5 bg-[#C2553A] text-white font-bold rounded-none flex items-center gap-1 shadow-xs hover:bg-[#B84A2B] transition-colors cursor-pointer"
              >
                Go <ChevronDown className="w-3 h-3 opacity-90" />
              </button>

              {activeMenu === 'go' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-[#ECE9D8] border-2 border-[#FFFFFF] border-r-[#7A756D] border-b-[#7A756D] shadow-xl py-1 z-50 text-[#1C1917]">
                  <button
                    type="button"
                    onClick={() => scrollToSection('curriculum-section')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white font-bold cursor-pointer"
                  >
                    → Kurikulum &amp; Modul
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('notepad-section')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white cursor-pointer"
                  >
                    → Manifesto Kuliah
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('stats-section')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white cursor-pointer"
                  >
                    → System Monitor &amp; Companion
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('run-section')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#C2553A] hover:text-white cursor-pointer"
                  >
                    → Run / Mulai Perkuliahan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Telemetry status & Login button */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-[#FAF8F5] border border-[#7A756D] border-r-[#FFFFFF] border-b-[#FFFFFF] text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#57534E]">RUANGKAMPUS_OS // RUNNING</span>
          </div>

          <Link
            href="/login"
            className="px-3 py-1 vt-btn-terracotta text-white font-bold text-xs flex items-center gap-1 transition-all"
          >
            <span>Masuk Portal</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
