import React from 'react';
import type { Metadata } from 'next';
import {
  OSTopBar,
  OSTaskbar,
  OSHeroWindow,
  NotepadManifesto,
  CurriculumExplorer,
  SystemMonitorWindow,
  MarqueeTicker,
  RunDialogCTA,
  OSDesktopIcons,
} from '@/components/os';

export const metadata: Metadata = {
  title: 'RuangKampus — Academic Learning OS & LMS Portal',
  description:
    'RuangKampus Retro Learning OS: Ekosistem perkuliahan terpadu, presensi real-time mikro-detik, dan kurikulum akademik Kain Semester Weave berstandar tinggi.',
};

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen vt-desktop-bg text-[#1C1917] font-sans antialiased relative selection:bg-[#C2553A] selection:text-white pb-16">
      {/* 1. CRT Scanlines Overlay khas Velqora */}
      <div className="fixed inset-0 vt-scanlines pointer-events-none z-40" />

      {/* 2. Classic OS Top Navigation Bar with pulldown menus */}
      <OSTopBar />

      {/* 3. Main Desktop Area (Exact Velqora Layout & Structure) */}
      <main className="relative z-10 space-y-4 pt-2">
        {/* Hero Window: Left Window + Center Desktop Icons + Right MONITOR.EXE with 3D Wireframe Canvas */}
        <OSHeroWindow />

        {/* Live Marquee Ticker: Real Specs & Features */}
        <MarqueeTicker />

        {/* Desktop Quick Launch Shortcuts */}
        <OSDesktopIcons />

        {/* Notepad Window: README.TXT Manifesto Akademik */}
        <NotepadManifesto />

        {/* Explorer Window: C:\RUANGKAMPUS\CURRICULUM_EXPLORER */}
        <CurriculumExplorer />

        {/* Telemetry Window: SYSTEM_MONITOR.EXE & COMPANION.EXE */}
        <SystemMonitorWindow />

        {/* Command Window: RUN.EXE Dialog */}
        <RunDialogCTA />
      </main>

      {/* 4. Windows 98 Style Bottom Taskbar with Start Menu & Real-time Clock */}
      <OSTaskbar />
    </div>
  );
}
