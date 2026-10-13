'use client';

import React from 'react';
import Link from 'next/link';
import {
  Server,
  Activity,
  Globe,
  Laptop,
  FolderArchive,
  Sliders,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Database,
  Radio,
  Cpu,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

export function SystemDashboardHubView() {
  const isDemo = isDemoMode();
  const dbConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="system_administrator_control_center.sys"
        badge="ROLE :: SYSTEM_ADMINISTRATOR"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-retro-sm">
                <Server className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Pusat Kendali Administrator Sistem
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Panel operasional infrastruktur server, basis data, jaringan WebSocket, gateway integrasi multi-pihak, dan audit integritas platform SIAJAR LMS.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black font-mono text-xs font-bold shadow-retro-sm ${
              isDemo || dbConfigured ? 'bg-emerald-100 text-emerald-950' : 'bg-retro-warm text-black'
            }`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isDemo || dbConfigured ? 'bg-emerald-600 animate-pulse' : 'bg-black/40'}`} />
              {isDemo ? 'INFRASTRUKTUR ONLINE' : dbConfigured ? 'BASIS DATA TERHUBUNG' : 'STATUS: BELUM TERHUBUNG'}
            </span>
          </div>
        </div>

        {/* METRIK 4 KARTU */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t-2 border-black/10">
          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>Status Server</span>
              <Activity className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-black mt-1">
              {isDemo ? '100% ONLINE' : (dbConfigured ? 'TERHUBUNG' : 'Belum terhubung')}
            </div>
            <div className="text-xs font-mono text-black/60 mt-1">
              {isDemo ? 'Uptime 18 Hari' : 'Tidak tersedia'}
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>PostgreSQL Pool</span>
              <Database className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-black mt-1">
              {isDemo ? '42 / 200 Pool' : (dbConfigured ? 'Aktif' : 'Tidak tersedia')}
            </div>
            <div className="text-xs font-mono text-black/60 mt-1">
              {isDemo ? 'Latensi 12ms' : 'Tidak tersedia'}
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>WebSocket Realtime</span>
              <Radio className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-black mt-1">
              {isDemo ? '142 Conn' : 'Tidak tersedia'}
            </div>
            <div className="text-xs font-mono text-black/60 mt-1">
              {isDemo ? '1.2k msg/s' : 'Tidak tersedia'}
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>Audit Anti-Tamper</span>
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-black mt-1">
              {isDemo ? 'IMMUTABLE' : (dbConfigured ? 'Trigger Aktif' : 'Belum dikonfigurasi')}
            </div>
            <div className="text-xs font-mono text-black/60 mt-1">
              {isDemo ? 'Trigger Aktif' : 'Menunggu migrasi'}
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 2. GRID 6 KARTU NAVIGASI HUB UTAMA SYSTEM ADMIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-lg text-black">Monitoring Sistem</h3>
            </div>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Pantau beban CPU/RAM, throughput WebSocket telemetri ujian, status sandbox isolasi kode, dan log error level 500.
            </p>
          </div>
          <Link
            href="/admin/system/monitoring"
            className="inline-flex items-center justify-between w-full p-2.5 rounded-lg border-2 border-black bg-retro-warm font-mono font-bold text-xs hover:bg-neutral-200 transition-all shadow-retro-sm"
          >
            <span>Buka Monitoring</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-lg text-black">Integrasi Layanan</h3>
            </div>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Kelola kredensial Zoom, Google Meet, Google Maps API, Sandbox Judge0, Gateway Notifikasi, dan Single Sign-On (SSO).
            </p>
          </div>
          <Link
            href="/admin/system/integrations"
            className="inline-flex items-center justify-between w-full p-2.5 rounded-lg border-2 border-black bg-retro-warm font-mono font-bold text-xs hover:bg-neutral-200 transition-all shadow-retro-sm"
          >
            <span>Kelola Integrasi</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-lg text-black">Keamanan & Sesi</h3>
            </div>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Inspeksi daftar sesi pengguna aktif, deteksi percobaan login mencurigakan (*brute-force*), dan pembatasan laju panggilan API.
            </p>
          </div>
          <Link
            href="/admin/system/security"
            className="inline-flex items-center justify-between w-full p-2.5 rounded-lg border-2 border-black bg-retro-warm font-mono font-bold text-xs hover:bg-neutral-200 transition-all shadow-retro-sm"
          >
            <span>Pusat Keamanan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FolderArchive className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-lg text-black">Backup & Restore</h3>
            </div>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Manajemen cadangan basis data otomatis, verifikasi integritas checksum SHA-256, dan pemulihan bencana (*disaster recovery*).
            </p>
          </div>
          <Link
            href="/admin/system/backup"
            className="inline-flex items-center justify-between w-full p-2.5 rounded-lg border-2 border-black bg-retro-warm font-mono font-bold text-xs hover:bg-neutral-200 transition-all shadow-retro-sm"
          >
            <span>Cadangan Sistem</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-lg text-black">Pengaturan Platform</h3>
            </div>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Konfigurasi nama institusi kampus, parameter model AI evaluator akademik, dan alokasi batas kuota penyimpanan berkas.
            </p>
          </div>
          <Link
            href="/admin/system/settings"
            className="inline-flex items-center justify-between w-full p-2.5 rounded-lg border-2 border-black bg-retro-warm font-mono font-bold text-xs hover:bg-neutral-200 transition-all shadow-retro-sm"
          >
            <span>Pengaturan Umum</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-lg text-black">Log Audit Sistem</h3>
            </div>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Tinjauan jejak audit forensik menyeluruh bersifat *append-only* (read-only) untuk kepatuhan regulasi dan transparansi transaksi.
            </p>
          </div>
          <Link
            href="/admin/system/audit"
            className="inline-flex items-center justify-between w-full p-2.5 rounded-lg border-2 border-black bg-retro-warm font-mono font-bold text-xs hover:bg-neutral-200 transition-all shadow-retro-sm"
          >
            <span>Tinjau Audit Log</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
