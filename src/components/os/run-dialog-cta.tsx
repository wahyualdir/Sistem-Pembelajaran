'use client';

import React from 'react';
import { OSWindow } from './os-window';
import { Play } from 'lucide-react';
import Link from 'next/link';

export function RunDialogCTA() {
  return (
    <div id="run-section" className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-8 pb-12">
      <OSWindow
        title="RUN.EXE — JALANKAN RUANGKAMPUS OS"
        icon={<Play className="w-3.5 h-3.5 text-[#FDE68A] fill-current" />}
        statusText="SYSTEM PROMPT ACTIVE · AUTH SERVICE READY"
        className="shadow-md"
        bodyClassName="p-6 sm:p-8 bg-[#FFFFFF] text-[#1C1917] font-mono space-y-4"
      >
        <div className="space-y-2">
          {/* Tag: 04 — MULAI */}
          <div className="text-xs text-[#C2553A] font-bold tracking-wider uppercase">
            04 — MULAI PERKULIAHAN
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-sans text-[#1C1917] tracking-tight">
            Siap Memulai Aktivitas Belajar Hari Ini?
          </h2>

          <p className="text-xs sm:text-sm text-[#57534E] font-sans max-w-2xl leading-relaxed">
            Akses kurikulum akademik lengkap, lakukan presensi real-time terverifikasi, pelajari materi kuliah,
            dan pantau capaian Kain Semester bersama RuangKampus OS.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="px-6 py-2.5 vt-btn-terracotta text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span>Masuk ke Portal LMS</span>
            <span>▸</span>
          </Link>

          <Link
            href="/register"
            className="px-5 py-2.5 vt-btn-chrome text-xs font-semibold"
          >
            Belum Punya Akun? Registrasi
          </Link>
        </div>
      </OSWindow>
    </div>
  );
}
