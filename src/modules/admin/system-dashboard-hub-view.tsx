'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Globe,
  Laptop,
  FolderArchive,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Database,
  Radio,
} from 'lucide-react';
import { isDemoMode } from '@/lib/config/features';

export function SystemDashboardHubView() {
  const isDemo = isDemoMode();
  const dbConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  const cards = [
    {
      title: 'Pemantauan Infrastruktur',
      desc: 'Pantau beban CPU/RAM, throughput WebSocket telemetri ujian, status sandbox isolasi kode, dan log error sistem.',
      href: '/admin/system/monitoring',
      cta: 'Buka Pemantauan',
      icon: Activity,
    },
    {
      title: 'Integrasi Layanan',
      desc: 'Kelola kredensial layanan konferensi video, Maps API, Sandbox kompilator, Gateway Notifikasi, dan Single Sign-On (SSO).',
      href: '/admin/system/integrations',
      cta: 'Kelola Integrasi',
      icon: Globe,
    },
    {
      title: 'Keamanan & Sesi Login',
      desc: 'Inspeksi daftar sesi pengguna aktif, deteksi percobaan login mencurigakan, dan pembatasan laju panggilan API.',
      href: '/admin/system/security',
      cta: 'Sesi Login',
      icon: Laptop,
    },
    {
      title: 'Cadangan Basis Data',
      desc: 'Manajemen cadangan basis data otomatis, verifikasi integritas checksum SHA-256, dan pemulihan bencana.',
      href: '/admin/system/backup',
      cta: 'Cadangan Sistem',
      icon: FolderArchive,
    },
    {
      title: 'Pengaturan Sistem',
      desc: 'Konfigurasi parameter institusi kampus, batas kuota penyimpanan berkas, dan kebijakan operasional.',
      href: '/admin/system/settings',
      cta: 'Buka Pengaturan',
      icon: Sliders,
    },
    {
      title: 'Log Audit Forensik',
      desc: 'Tinjauan jejak audit menyeluruh bersifat append-only (baca-saja) untuk kepatuhan regulasi dan transparansi.',
      href: '/admin/system/audit',
      cta: 'Tinjau Audit Log',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="p-4 sm:p-5 lg:p-6 pb-24 w-full max-w-[1280px] mx-auto space-y-6 font-sans">
      {/* 1. HEADER EDITORIAL SYSTEM ADMIN */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#D6D3CB]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#853827]">
            <span>PUSAT KENDALI INFRASTRUKTUR</span>
            <span className="text-[#B8B1A5]">•</span>
            <span className="text-[#57534E]">SYSTEM ADMINISTRATOR</span>
          </div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
            Operasional Server &amp; Infrastruktur Sistem
          </h1>
        </div>

        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D6D3CB] bg-[#FFFFFF] font-mono text-xs font-semibold text-[#1C1917] self-start sm:self-end">
          <span className="h-2 w-2 rounded-full bg-[#059669]" />
          <span>{isDemo ? 'INFRASTRUKTUR NORMAL' : dbConfigured ? 'BASIS DATA TERHUBUNG' : 'MODE LOKAL'}</span>
        </span>
      </div>

      {/* 2. METRIK 4 KARTU */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF]">
          <div className="flex items-center justify-between text-[#57534E] text-xs font-mono font-semibold uppercase">
            <span>Status Server</span>
            <Activity className="h-4 w-4 text-[#C2553A]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-heading text-[#1C1917] mt-1">
            {isDemo ? '100% Online' : dbConfigured ? 'Terhubung' : 'Lokal'}
          </div>
          <div className="text-xs text-[#57534E] mt-0.5">
            {isDemo ? 'Uptime 18 Hari' : 'Operasional'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF]">
          <div className="flex items-center justify-between text-[#57534E] text-xs font-mono font-semibold uppercase">
            <span>PostgreSQL Pool</span>
            <Database className="h-4 w-4 text-[#C2553A]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-heading text-[#1C1917] mt-1">
            {isDemo ? '42 / 200 Pool' : dbConfigured ? 'Aktif' : 'Siap'}
          </div>
          <div className="text-xs text-[#57534E] mt-0.5">
            {isDemo ? 'Latensi 12ms' : 'Koneksi Stabil'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF]">
          <div className="flex items-center justify-between text-[#57534E] text-xs font-mono font-semibold uppercase">
            <span>Kanal Realtime</span>
            <Radio className="h-4 w-4 text-[#C2553A]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-heading text-[#1C1917] mt-1">
            {isDemo ? '142 Koneksi' : 'Aktif'}
          </div>
          <div className="text-xs text-[#57534E] mt-0.5">
            {isDemo ? 'Sinkronisasi Presensi' : 'Siap'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF]">
          <div className="flex items-center justify-between text-[#57534E] text-xs font-mono font-semibold uppercase">
            <span>Audit Anti-Tamper</span>
            <ShieldCheck className="h-4 w-4 text-[#C2553A]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-heading text-[#1C1917] mt-1">
            Append-Only
          </div>
          <div className="text-xs text-[#57534E] mt-0.5">
            Trigger Proteksi Aktif
          </div>
        </div>
      </div>

      {/* 3. GRID 6 KARTU NAVIGASI HUB UTAMA SYSTEM ADMIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.href}
              className="p-5 rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E8E5DE] text-[#C2553A]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#1C1917]">{card.title}</h3>
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed">{card.desc}</p>
              </div>
              <Link
                href={card.href}
                className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] hover:bg-[#1C1917] hover:text-white font-semibold text-xs text-[#1C1917] transition-colors"
              >
                <span>{card.cta}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
