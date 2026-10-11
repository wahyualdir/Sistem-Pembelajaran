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
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-emerald-100 text-emerald-950 font-mono text-xs font-bold shadow-retro-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
              INFRASTRUKTUR ONLINE
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
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 mt-1">100% ONLINE</div>
            <div className="text-[11px] font-mono text-black/60 mt-1">Uptime 18 Hari</div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>PostgreSQL Pool</span>
              <Database className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-black mt-1">42 / 200 Pool</div>
            <div className="text-[11px] font-mono text-emerald-800 mt-1">Latensi 12ms</div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>WebSocket Realtime</span>
              <Radio className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-black mt-1">142 Conn</div>
            <div className="text-[11px] font-mono text-emerald-800 mt-1">1.2k msg/s</div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>Audit Anti-Tamper</span>
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 mt-1">IMMUTABLE</div>
            <div className="text-[11px] font-mono text-black/60 mt-1">Trigger Aktif</div>
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
            className="p-2.5 rounded-lg border-2 border-black bg-retro-warm hover:bg-neutral-200 text-xs font-mono font-bold flex items-center justify-between transition-all"
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
              Kelola kredensial Zoom, Google Maps, Sandbox Judge0, WhatsApp/Email Gateway, SSO SAML, dan Webhook API keys dengan sensor rahasia aman.
            </p>
          </div>
          <Link
            href="/admin/system/integrations"
            className="p-2.5 rounded-lg border-2 border-black bg-retro-warm hover:bg-neutral-200 text-xs font-mono font-bold flex items-center justify-between transition-all"
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
              Audit sesi login aktif lintas perangkat, pencegahan brute-force, deteksi login mencurigakan, dan konfigurasi rate limiting.
            </p>
          </div>
          <Link
            href="/admin/system/security"
            className="p-2.5 rounded-lg border-2 border-black bg-retro-warm hover:bg-neutral-200 text-xs font-mono font-bold flex items-center justify-between transition-all"
          >
            <span>Buka Keamanan</span>
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
              Jadwal snapshot otomatis harian, verifikasi checksum berkas cadangan, dan prosedur pemulihan data tepat-waktu.
            </p>
          </div>
          <Link
            href="/admin/system/backup"
            className="p-2.5 rounded-lg border-2 border-black bg-retro-warm hover:bg-neutral-200 text-xs font-mono font-bold flex items-center justify-between transition-all"
          >
            <span>Kelola Cadangan</span>
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
              Konfigurasi branding universitas, parameter mesin evaluasi AI LLM SIAJAR, dan batas kuota penyimpanan berkas materi.
            </p>
          </div>
          <Link
            href="/admin/system/settings"
            className="p-2.5 rounded-lg border-2 border-black bg-retro-warm hover:bg-neutral-200 text-xs font-mono font-bold flex items-center justify-between transition-all"
          >
            <span>Ubah Pengaturan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-retro-orange" />
              <h3 className="font-heading font-black text-lg text-black">Log Audit (Read-Only)</h3>
            </div>
            <p className="text-xs text-black/70 font-medium leading-relaxed">
              Jejak forensik transaksi tak terhapuskan yang mencatat perubahan nilai, eskalasi izin, dan sesi impersonasi secara kronologis.
            </p>
          </div>
          <Link
            href="/admin/system/audit"
            className="p-2.5 rounded-lg border-2 border-black bg-retro-warm hover:bg-neutral-200 text-xs font-mono font-bold flex items-center justify-between transition-all"
          >
            <span>Periksa Log Audit</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
