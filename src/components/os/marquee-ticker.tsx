'use client';

import React from 'react';

export function MarqueeTicker() {
  const items = [
    '28 MATAKULIAH KURIKULUM AKADEMIK TERVERIFIKASI',
    'PRESENSI REAL-TIME MIKRO-DETIK ANTI-DUPLIKASI',
    'KAIN SEMESTER WEAVE CAPAIAN PEMBELAJARAN (CPL)',
    'PORTAL MULTI-ROLE: MAHASISWA, DOSEN, KAPRODI, ADMIN',
    'SECURITY LEVEL: 256-BIT ENCRYPTION & RLS COMPLIANT',
    'GLSL SHADER ATMOSPHERE ENGINE SYNC LOCAL TIME',
    'NEXT.JS APP ROUTER & TAILWIND DESIGN SYSTEM',
    'WAI-ARIA WCAG 2.2 AA ACCESSIBILITY VERIFIED',
  ];

  return (
    <div className="w-full bg-[#FAF8F5] border-y-2 border-[#E5DDD5] py-2 overflow-hidden select-none font-mono text-xs shadow-inner">
      <div className="animate-vt-marquee flex items-center gap-6 text-[#1C1917]">
        {[...items, ...items, ...items].map((text, index) => (
          <div key={index} className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-[#C2553A] font-black text-sm">★</span>
            <span className="font-bold tracking-wider">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
