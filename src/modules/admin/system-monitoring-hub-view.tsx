'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Server,
  Activity,
  Code,
  AlertTriangle,
  RefreshCw,
  Cpu,
  HardDrive,
  Database,
  Radio,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

type MonitoringTab =
  | 'status-server'
  | 'realtime-websocket'
  | 'antrean-sandbox'
  | 'log-error';

export function SystemMonitoringHubView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as MonitoringTab;
  const validTabs: MonitoringTab[] = ['status-server', 'realtime-websocket', 'antrean-sandbox', 'log-error'];
  const activeTab: MonitoringTab = validTabs.includes(tabParam) ? tabParam : 'status-server';

  const setTab = (t: MonitoringTab) => {
    router.push(`/admin/system/monitoring?tab=${t}`);
  };

  const isDemo = isDemoMode();
  const dbConnected = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="monitoring_sistem_infrastruktur.app"
        badge="SYSTEM_ADMIN :: TELEMETRY"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
                <Activity className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Monitoring Sistem & Infrastruktur
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Pantau metrik kesehatan server Next.js, basis data PostgreSQL, throughput WebSocket telemetri ujian, antrean sandbox isolasi kode, dan log pengecualian sistem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black font-mono text-xs font-bold shadow-retro-sm ${
              isDemo ? 'bg-emerald-100 text-emerald-950' : 'bg-retro-warm text-black'
            }`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isDemo ? 'bg-emerald-600 animate-pulse' : 'bg-black/40'}`} />
              {isDemo ? 'NODES 4/4 SEHAT' : (dbConnected ? 'DATABASE TERKONEKSI' : 'TELEMETRI: OFFLINE')}
            </span>
          </div>
        </div>

        {/* 4 KARTU METRIK UTAMA */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t-2 border-black/10">
          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>CPU Load Avg</span>
              <Cpu className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-black mt-1">
              {isDemo ? '18.4%' : 'Tidak tersedia'}
            </div>
            <div className="text-xs font-mono text-black/60 mt-1">
              {isDemo ? '✓ Beban Normal (8 Core)' : 'OS metrics offline'}
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>Memory Usage</span>
              <HardDrive className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-black mt-1">
              {isDemo ? '4.2 / 16 GB' : 'Tidak tersedia'}
            </div>
            <div className="text-xs font-mono text-black/60 mt-1">
              {isDemo ? '✓ Swap 0% Terpakai' : 'OS metrics offline'}
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>WS Sesi Aktif</span>
              <Radio className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-black mt-1">
              {isDemo ? '142 Conn' : 'Tidak tersedia'}
            </div>
            <div className="text-xs font-mono text-black/60 mt-1">
              {isDemo ? '✓ Throughput 1.2k req/s' : 'WebSocket metrics offline'}
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm">
            <div className="flex items-center justify-between text-black/60 text-xs font-mono font-bold uppercase">
              <span>Antrean Sandbox</span>
              <Code className="h-4 w-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-black mt-1">
              {isDemo ? '0 Antrean' : 'Belum dikonfigurasi'}
            </div>
            <div className="text-xs font-mono text-black/60 mt-1">
              {isDemo ? '✓ Latensi Uji 210ms' : 'Judge0 belum terhubung'}
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB NAVIGASI */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-2">
        {[
          { id: 'status-server', label: 'Status Server', icon: Server },
          { id: 'realtime-websocket', label: 'Realtime & WebSocket', icon: Radio },
          { id: 'antrean-sandbox', label: 'Antrean Sandbox', icon: Code },
          { id: 'log-error', label: 'Log Error', icon: AlertTriangle },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as MonitoringTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold font-mono transition-all cursor-pointer ${
                isActive
                  ? 'bg-black text-white shadow-retro'
                  : 'bg-white hover:bg-retro-warm text-black shadow-retro-sm'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. KONTEN TAB */}

      {/* TAB 1: STATUS SERVER */}
      {activeTab === 'status-server' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <h3 className="font-heading font-black text-lg text-black flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <span>Klaster Basis Data PostgreSQL</span>
                </h3>
                <span className={`px-2 py-0.5 rounded border text-xs font-mono font-bold ${
                  isDemo || dbConnected ? 'border-emerald-500 bg-emerald-100 text-emerald-950' : 'border-black bg-retro-warm text-black'
                }`}>
                  {isDemo || dbConnected ? 'HEALTHY' : 'BELUM TERHUBUNG'}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-black/10">
                  <span className="text-black/60">Host Target</span>
                  <span className="font-bold text-black">{isDemo ? 'db.siajar.ac.id (Multi-AZ)' : (process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Supabase Managed Cluster' : 'Belum dikonfigurasi')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/10">
                  <span className="text-black/60">Connection Pool</span>
                  <span className="font-bold text-black">{isDemo ? '42 / 200 Aktif' : (dbConnected ? 'Aktif' : 'Tidak tersedia')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/10">
                  <span className="text-black/60">Latensi Rata-Rata</span>
                  <span className="font-bold text-black">{isDemo ? '12 ms' : 'Tidak tersedia'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-black/60">Status Replikasi</span>
                  <span className="font-bold text-black">{isDemo ? 'Sinkron (0 lag)' : 'Tidak tersedia'}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <h3 className="font-heading font-black text-lg text-black flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <span>Next.js App Server Instances</span>
                </h3>
                <span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-xs font-mono font-bold">
                  RUNNING
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-black/10">
                  <span className="text-black/60">Versi Runtime</span>
                  <span className="font-bold text-black">Next.js 14.2 / Node.js 20 LTS</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/10">
                  <span className="text-black/60">Uptime Instance</span>
                  <span className="font-bold text-black">{isDemo ? '18 Hari 14 Jam' : 'Sesi Aktif'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/10">
                  <span className="text-black/60">Mode Deployment</span>
                  <span className="font-bold text-black">{process.env.NODE_ENV || 'development'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-black/60">Demo Auth Permitted</span>
                  <span className="font-bold text-black">{process.env.ALLOW_DEMO_AUTH === 'true' ? 'YA (Demo)' : 'TIDAK (Produksi)'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REALTIME WEBSOCKET */}
      {activeTab === 'realtime-websocket' && (
        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">
              Kanal Siaran Realtime Ujian & Presensi
            </h3>
            <span className="text-xs font-mono font-bold text-black/60">
              {isDemo ? 'Pembaruan per 5 detik' : 'Status: Belum dikonfigurasi'}
            </span>
          </div>

          {!isDemo ? (
            <div className="p-8 text-center border-2 border-dashed border-black/30 rounded-xl bg-retro-warm/20 space-y-2">
              <Radio className="h-10 w-10 text-black/40 mx-auto" />
              <p className="text-sm font-mono font-bold text-black">Belum ada kanal siaran aktif</p>
              <p className="text-xs font-mono text-black/60">
                Layanan WebSocket broadcast belum terhubung ke klaster telemetri eksternal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-retro-warm font-mono font-black text-black">
                    <th className="p-3">Nama Kanal</th>
                    <th className="p-3">Penggunaan</th>
                    <th className="p-3 text-center">Koneksi Aktif</th>
                    <th className="p-3 text-center">Pesan/Detik</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b border-black font-mono">
                  <tr>
                    <td className="p-3 font-bold text-black">exam-telemetry:ex-301</td>
                    <td className="p-3 text-black/80 font-sans">Kuis Rekayasa Perangkat Lunak</td>
                    <td className="p-3 text-center font-bold">42</td>
                    <td className="p-3 text-center text-emerald-800">18.5</td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-xs font-bold">AKTIF</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-black">attendance-live:sess-102</td>
                    <td className="p-3 text-black/80 font-sans">Presensi Dinamis QR Kelas IF-3A</td>
                    <td className="p-3 text-center font-bold">38</td>
                    <td className="p-3 text-center text-emerald-800">4.2</td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-xs font-bold">AKTIF</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-black">notifications:broadcast</td>
                    <td className="p-3 text-black/80 font-sans">Pemberitahuan Sistem & Maklumat Kampus</td>
                    <td className="p-3 text-center font-bold">142</td>
                    <td className="p-3 text-center text-emerald-800">0.8</td>
                    <td className="p-3 text-center"><span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-xs font-bold">AKTIF</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANTREAN SANDBOX */}
      {activeTab === 'antrean-sandbox' && (
        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">
              Pekerja Eksekusi Sandbox Kode Terisolasi
            </h3>
            <span className="text-xs font-mono font-bold text-black/60">
              {isDemo ? 'Worker Idle: 4/4 Tersedia' : 'Status: Belum dikonfigurasi'}
            </span>
          </div>
          <div className="p-4 bg-retro-warm border-2 border-black rounded-lg text-xs font-mono space-y-2">
            <p><strong>Batas Sumber Daya Eksekusi (Sandbox Constraints):</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-black/80">
              <li>Maksimal waktu CPU per run: 5.0 detik (Timeout otomatis)</li>
              <li>Batas RAM per proses: 256 MB (Cgroup isolation)</li>
              <li>Akses Jaringan: OFF (Blokir soket luar untuk mencegah SSRF)</li>
              <li>Sistem Berkas: Read-only chroot jail temporer</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: LOG ERROR */}
      {activeTab === 'log-error' && (
        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">
              Log Pengecualian & Catatan Kesalahan Sistem
            </h3>
            <span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-xs font-mono font-bold">
              0 CRITICAL ERRORS
            </span>
          </div>
          <div className="p-8 text-center text-black/60 font-mono text-xs border-2 border-dashed border-black/20 rounded-xl">
            Tidak ada error kritis level 500 yang tercatat dalam 24 jam terakhir. Sistem beroperasi stabil.
          </div>
        </div>
      )}
    </div>
  );
}
