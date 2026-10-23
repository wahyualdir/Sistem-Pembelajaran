'use client';

import React, { useState } from 'react';
import { OSWindow } from './os-window';
import { CanvasWireframeCube } from './canvas-wireframe-cube';
import {
  Folder,
  FileText,
  Users,
  Edit3,
  Cpu,
  ArrowRight,
  RotateCw,
  Layers,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export function OSHeroWindow() {
  const [selectedIcon, setSelectedIcon] = useState<string>('koleksi');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const desktopShortcuts = [
    { id: 'koleksi', label: 'Kurikulum', icon: '▦', target: 'curriculum-section' },
    { id: 'modul', label: 'Modul.md', icon: '▤', target: 'curriculum-section' },
    { id: 'portal', label: 'Portal', icon: '◈', href: '/login' },
    { id: 'catatan', label: 'Manifesto', icon: '✎', target: 'notepad-section' },
    { id: 'telemetri', label: 'Telemetri', icon: '▣', target: 'stats-section' },
  ];

  return (
    <div id="hero-window" className="w-full max-w-7xl mx-auto px-2 sm:px-4 pt-4 pb-4">
      {/* 3-Column Desktop Grid Layout (Exact Velqora Learn) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* =========================================================================
            COLUMN 1: Left Window (RUANGKAMPUS — ACADEMIC LEARNING OS.EXE) - 6 cols
            ========================================================================= */}
        <div className="lg:col-span-6 flex flex-col">
          <OSWindow
            title="RUANGKAMPUS — ACADEMIC LEARNING OS.EXE"
            statusText="AUDIT STATUS · 28 DARI 28 TOPIK KURIKULUM TERVERIFIKASI / AKTIF"
            className="flex-1 shadow-md"
            bodyClassName="p-5 sm:p-7 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Status Pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F4E4DD] border border-[#C2553A]/30 rounded-full text-xs font-mono text-[#C2553A] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#C2553A] animate-pulse" />
                <span>• SYSTEM ONLINE · 28 MATAKULIAH TERVERIFIKASI (SIAJAR v2.4)</span>
              </div>

              {/* Big Velqora-Style Headline */}
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1C1917] uppercase font-sans">
                  RUANGKAMPUS
                </h1>
                <div className="text-base sm:text-lg font-mono font-bold text-[#C2553A] tracking-wider">
                  learn. build. graduate.
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed font-sans max-w-lg">
                Workspace perkuliahan &amp; learning operating system akademik: kurikulum berstandar industri,
                presensi real-time mikro-detik, serta visualisasi kurikulum Kain Semester yang transparan dan terisolasi.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <Link
                  href="/login"
                  className="px-5 py-2.5 vt-btn-terracotta text-xs flex items-center gap-1.5 font-mono font-bold shadow-sm"
                >
                  <span>Mulai Belajar</span>
                  <span>▸</span>
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection('curriculum-section')}
                  className="px-4 py-2.5 vt-btn-chrome text-xs font-mono font-semibold cursor-pointer"
                >
                  Jelajahi Kurikulum (28 Topik)
                </button>
              </div>
            </div>

            {/* Stats Row (3 Columns Separated by Bevel Border) */}
            <div className="grid grid-cols-3 gap-2 pt-6 mt-6 border-t-2 border-[#E5DDD5] font-mono text-center">
              <div className="p-2 bg-[#FAF8F5] border border-[#E5DDD5] rounded-none">
                <div className="text-lg font-black text-[#C2553A]">28</div>
                <div className="text-[11px] text-[#57534E]">matakuliah aktif</div>
              </div>
              <div className="p-2 bg-[#FAF8F5] border border-[#E5DDD5] rounded-none">
                <div className="text-lg font-black text-[#1C1917]">100%</div>
                <div className="text-[11px] text-[#57534E]">presensi akurat</div>
              </div>
              <div className="p-2 bg-[#FAF8F5] border border-[#E5DDD5] rounded-none">
                <div className="text-lg font-black text-[#10B981]">24 / 7</div>
                <div className="text-[11px] text-[#57534E]">cloud weave sync</div>
              </div>
            </div>
          </OSWindow>
        </div>

        {/* =========================================================================
            COLUMN 2: Center Vertical Desktop Icons - 1 col on lg
            ========================================================================= */}
        <div className="lg:col-span-1 hidden lg:flex flex-col items-center justify-center gap-3 py-2 select-none font-mono">
          {desktopShortcuts.map((item) => {
            const isSelected = selectedIcon === item.id;
            const content = (
              <div
                onClick={() => {
                  setSelectedIcon(item.id);
                  if (item.target) scrollToSection(item.target);
                }}
                className={`flex flex-col items-center justify-center p-1.5 w-16 text-center cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#C2553A]/15 border border-dashed border-[#C2553A]'
                    : 'hover:bg-[#FAF8F5] border border-transparent'
                }`}
              >
                <div className="text-xl leading-none mb-1 text-[#1C1917]">{item.icon}</div>
                <div className="text-[10px] text-[#1C1917] leading-tight font-bold">{item.label}</div>
              </div>
            );

            if (item.href) {
              return (
                <Link key={item.id} href={item.href}>
                  {content}
                </Link>
              );
            }

            return <div key={item.id}>{content}</div>;
          })}
        </div>

        {/* =========================================================================
            COLUMN 3: Right Window (MONITOR.EXE with 3D Wireframe Canvas) - 5 cols
            ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col">
          <OSWindow
            title="MONITOR.EXE"
            statusText="3D WIREFRAME ENGINE · PERSPECTIVE REALTIME ACTIVE"
            className="flex-1 shadow-md"
            bodyClassName="p-3.5 bg-[#1C1917] text-[#FAF8F5] flex flex-col justify-between"
          >
            {/* Subheader: RUANGKAMPUS AI // LEARNING OS */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#38312A] font-mono text-xs">
              <span className="text-[#F59E0B] font-bold tracking-wider">
                RUANGKAMPUS // LEARNING OS
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#A8A29E]">
                <button type="button" title="Rotate" className="hover:text-white cursor-pointer">
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button type="button" title="Layers" className="hover:text-white cursor-pointer">
                  <Layers className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3D Animated Wireframe Canvas */}
            <CanvasWireframeCube />

            {/* Telemetry Progress Bars & Metrics */}
            <div className="mt-3 space-y-2 font-mono text-[11px]">
              {/* Metric 1: Topik Kurikulum */}
              <div>
                <div className="flex justify-between text-slate-300 pb-0.5">
                  <span>kurikulum.status</span>
                  <span className="text-[#F59E0B] font-bold">28/28 TERVERIFIKASI AKTIF</span>
                </div>
                <div className="w-full h-1.5 bg-[#2E2822] rounded-none overflow-hidden">
                  <div className="h-full bg-[#C2553A]" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Metric 2: Presensi Real-Time */}
              <div>
                <div className="flex justify-between text-slate-300 pb-0.5">
                  <span>presensi.engine</span>
                  <span className="text-[#10B981] font-bold">MIKRO-DETIK ACCURACY</span>
                </div>
                <div className="w-full h-1.5 bg-[#2E2822] rounded-none overflow-hidden">
                  <div className="h-full bg-[#10B981]" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Metric 3: System status flags */}
              <div className="pt-2 border-t border-[#38312A] grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span>runtime.nextjs: OK</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span>database.pool: CONNECTED</span>
                </div>
              </div>

              {/* Terminal log snippet */}
              <div className="p-2 bg-[#120F0D] rounded-none border border-[#38312A] text-[10px] font-mono leading-tight">
                <div className="text-[#F59E0B] font-bold flex items-center justify-between">
                  <span>$ ruangkampus status: WEAVE ENGINE SYNCHRONIZED</span>
                  <span className="text-[9px] text-[#10B981] font-mono shrink-0 ml-1.5">
                    ● ACTIVE
                  </span>
                </div>
                <div className="text-[#A8A29E] truncate mt-0.5">
                  &gt; SIAJAR v2.4 · Kain Semester Weave · Multi-Role Isolation Online
                </div>
              </div>
            </div>
          </OSWindow>
        </div>
      </div>
    </div>
  );
}
