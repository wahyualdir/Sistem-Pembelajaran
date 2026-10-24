'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Headphones,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UirLogo3DProps {
  className?: string;
  autoPlayInterval?: number;
}

export function UirLogo3D({ className }: UirLogo3DProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 space-y-3 font-sans shadow-sm',
        className
      )}
    >
      {/* Header Status Layanan Institusi */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E3E4]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#059669] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#111111]">
            Layanan Terintegrasi
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#059669] px-2 py-0.5 rounded-full bg-[#F3F3F4] border border-[#E2E3E4]">
          Normal 99.9%
        </span>
      </div>

      {/* Deskripsi & Ringkasan Dukungan Sistem */}
      <div className="space-y-1">
        <p className="font-heading font-extrabold text-xs sm:text-sm text-[#111111]">
          Pusat Pembelajaran &amp; Layanan Akademik
        </p>
        <p className="text-xs text-[#58595B] font-normal leading-relaxed">
          Platform pembelajaran terakreditasi dengan sinkronisasi kurikulum OBE dan pemantauan presensi otomatis.
        </p>
      </div>

      {/* Quick Action Links */}
      <div className="pt-2 border-t border-[#E2E3E4] space-y-1.5">
        <Link
          href="/announcements"
          className="flex items-center justify-between p-2 rounded-lg bg-[#F3F3F4] hover:bg-[#FEF2F2] hover:text-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-[#9F1521]" />
            <span>Panduan &amp; Pengumuman</span>
          </span>
          <ExternalLink className="h-3 w-3 text-[#808285]" />
        </Link>
        <Link
          href="/support"
          className="flex items-center justify-between p-2 rounded-lg bg-[#F3F3F4] hover:bg-[#FEF2F2] hover:text-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Headphones className="h-3.5 w-3.5 text-[#9F1521]" />
            <span>Helpdesk &amp; Bantuan Mahasiswa</span>
          </span>
          <ExternalLink className="h-3 w-3 text-[#808285]" />
        </Link>
      </div>

      {/* Footer Info Versi */}
      <div className="pt-2 border-t border-[#E2E3E4] flex items-center justify-between text-[10px] text-[#808285]">
        <span>Telkom University LMS</span>
        <span className="font-mono">v2.6.4</span>
      </div>
    </div>
  );
}

export const TechLogo3D = UirLogo3D;
