'use client';

import React, { useState } from 'react';
import { Folder, Terminal, FileText, Cpu, LayoutDashboard, Calendar, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface DesktopShortcut {
  id: string;
  name: string;
  subtext: string;
  icon: React.ReactNode;
  iconBg: string;
  targetId?: string;
  href?: string;
}

export function OSDesktopIcons() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const shortcuts: DesktopShortcut[] = [
    {
      id: 'curriculum',
      name: 'Kurikulum.exe',
      subtext: 'Kurikulum Semester',
      icon: <Folder className="w-6 h-6 text-[#38BDF8]" />,
      iconBg: 'bg-[#0F172A] border-[#38BDF8]/40',
      targetId: 'curriculum-section',
    },
    {
      id: 'presence',
      name: 'Presensi.exe',
      subtext: 'Waktu Mikro-Detik',
      icon: <Terminal className="w-6 h-6 text-[#10B981]" />,
      iconBg: 'bg-[#064E3B] border-[#10B981]/40',
      targetId: 'hero-window',
    },
    {
      id: 'readme',
      name: 'README.txt',
      subtext: 'Manifesto Kampus',
      icon: <FileText className="w-6 h-6 text-[#F59E0B]" />,
      iconBg: 'bg-[#451A03] border-[#F59E0B]/40',
      targetId: 'notepad-section',
    },
    {
      id: 'weave',
      name: 'KainSemester.exe',
      subtext: 'Weave Visualizer',
      icon: <Cpu className="w-6 h-6 text-[#C2553A]" />,
      iconBg: 'bg-[#4A1F16] border-[#C2553A]/40',
      targetId: 'curriculum-section',
    },
    {
      id: 'dashboard',
      name: 'PortalLogin.url',
      subtext: 'Masuk Ruang Kerja',
      icon: <LayoutDashboard className="w-6 h-6 text-[#A855F7]" />,
      iconBg: 'bg-[#3B0764] border-[#A855F7]/40',
      href: '/login',
    },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-6">
      <div className="vt-window rounded-none p-3 bg-[#FAF8F5] shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5DDD5] text-xs font-mono text-[#57534E]">
          <span className="font-bold text-[#853827]">DESKTOP QUICK LAUNCH SHORTCUTS</span>
          <span>CLICK TO OPEN MODULE</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 font-mono">
          {shortcuts.map((sc) => {
            const isSelected = selectedId === sc.id;
            const content = (
              <div
                onClick={() => {
                  setSelectedId(sc.id);
                  if (sc.targetId) scrollTo(sc.targetId);
                }}
                className={`p-2.5 rounded-none border flex flex-col items-center text-center cursor-pointer transition-all select-none ${
                  isSelected
                    ? 'bg-[#C2553A]/15 border-dashed border-[#C2553A]'
                    : 'bg-white border-[#E5DDD5] hover:bg-[#FAF8F5] hover:border-[#C2553A]/40'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-none border flex items-center justify-center mb-1.5 ${sc.iconBg}`}
                >
                  {sc.icon}
                </div>
                <div className="text-xs font-bold text-[#1C1917] truncate w-full">{sc.name}</div>
                <div className="text-[10px] text-[#78716C] truncate w-full mt-0.5">{sc.subtext}</div>
              </div>
            );

            if (sc.href) {
              return (
                <Link key={sc.id} href={sc.href}>
                  {content}
                </Link>
              );
            }

            return <div key={sc.id}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
