'use client';

import React, { useState } from 'react';
import {
  Bell,
  Megaphone,
  Plus,
  Send,
  Calendar,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

interface AnnouncementItem {
  id: string;
  title: string;
  category: string;
  target: string;
  date: string;
  author: string;
}

const SAMPLE_GLOBAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-001',
    title: 'Surat Edaran Rektor: Kalender Akademik Semester Genap 2026/2027',
    category: 'AKADEMIK',
    target: 'SELURUH_SIVITAS',
    date: '01 Okt 2026',
    author: 'Rektorat Universitas',
  },
  {
    id: 'ann-002',
    title: 'Pemberitahuan Pemeliharaan Infrastruktur Jaringan & Server SIAJAR',
    category: 'INFRASTRUKTUR',
    target: 'SELURUH_SIVITAS',
    date: '28 Sep 2026',
    author: 'Biro Sistem Informasi',
  },
];

export function SuperadminAnnouncementsHubView() {
  const isDemo = isDemoMode();

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="pengumuman_global_universitas.app"
        badge="SUPER_ADMIN :: BROADCAST"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-retro-sm">
                <Bell className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Pengumuman Global Universitas
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Terbitkan maklumat resmi rektorat dan edaran universitas yang disiarkan langsung ke seluruh portal dashboard mahasiswa, dosen, dan tenaga kependidikan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={!isDemo}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className="px-4 py-2 rounded-lg border-2 border-black bg-black text-white font-mono font-bold text-xs hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-retro"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Maklumat Baru</span>
            </button>
          </div>
        </div>
      </RetroWindow>

      {/* 2. DAFTAR PENGUMUMAN GLOBAL */}
      <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <h3 className="font-heading font-black text-lg text-black">
            Maklumat & Siaran Resmi Aktif
          </h3>
          <span className="text-xs font-mono font-bold text-black/60">
            Total: {isDemo ? `${SAMPLE_GLOBAL_ANNOUNCEMENTS.length} Maklumat` : '0 Maklumat (Belum Terhubung)'}
          </span>
        </div>

        {!isDemo ? (
          <div className="p-8 text-center text-black/60 font-mono text-xs border-2 border-dashed border-black/20 rounded-xl">
            Tabel pangkalan data pengumuman global belum terhubung ke database production.
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
          {SAMPLE_GLOBAL_ANNOUNCEMENTS.map((a) => (
            <div
              key={a.id}
              className="p-4 border-2 border-black rounded-lg bg-retro-warm/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded border border-black bg-white font-bold text-xs">
                    {a.category}
                  </span>
                  <span className="text-black/60 text-xs">{a.date} • {a.author}</span>
                </div>
                <h4 className="font-sans font-bold text-black text-sm">{a.title}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-bold text-xs">
                  TAYANG GLOBAL
                </span>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
