'use client';

import React from 'react';
import {
  FolderArchive,
  Database,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

export function SystemBackupHubView() {
  const isDemo = isDemoMode();

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="backup_dan_pemulihan_bencana.app"
        badge="SYSTEM_ADMIN :: DISASTER_RECOVERY"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-retro-sm">
                <FolderArchive className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Cadangan Basis Data & Pemulihan (Backup & Restore)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Snapshot berkala basis data PostgreSQL dan penyimpanan berkas media SIAJAR. Mendukung pemulihan data tepat-waktu (*Point-in-Time Recovery*).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={!isDemo}
              title={!isDemo ? 'TODO(backend): Menunggu migrasi snapshot diterapkan' : undefined}
              className="px-4 py-2 rounded-lg border-2 border-black bg-black text-white font-mono font-bold text-xs hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-retro"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Buat Snapshot Baru</span>
            </button>
          </div>
        </div>
      </RetroWindow>

      {/* 2. DAFTAR SNAPSHOT BACKUP */}
      <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <h3 className="font-heading font-black text-lg text-black">
            Riwayat Cadangan Otomatis (Daily Automated Snapshots)
          </h3>
          <span className="text-xs font-mono font-bold text-black/60">Retensi: 30 Hari</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-retro-warm font-mono font-black text-black">
                <th className="p-3">Nama Berkas Snapshot</th>
                <th className="p-3">Tipe Backup</th>
                <th className="p-3">Ukuran</th>
                <th className="p-3">Waktu Selesai</th>
                <th className="p-3 text-center">Integritas Checksum</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b border-black font-mono">
              <tr>
                <td className="p-3 font-bold text-black">siajar_db_daily_20261011_020000.sql.gz</td>
                <td className="p-3 text-black/80 font-sans">Full Database Snapshot</td>
                <td className="p-3 font-bold">148 MB</td>
                <td className="p-3">11 Okt 2026, 02:14 WIB</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-[11px] font-bold">
                    ✓ SHA-256 VALID
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    disabled={!isDemo}
                    title={!isDemo ? 'TODO(backend): Menunggu migrasi snapshot diterapkan' : undefined}
                    className="px-2.5 py-1 rounded border border-black bg-retro-warm font-bold hover:bg-neutral-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Unduh
                  </button>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-black">siajar_db_daily_20261010_020000.sql.gz</td>
                <td className="p-3 text-black/80 font-sans">Full Database Snapshot</td>
                <td className="p-3 font-bold">146 MB</td>
                <td className="p-3">10 Okt 2026, 02:15 WIB</td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-[11px] font-bold">
                    ✓ SHA-256 VALID
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    disabled={!isDemo}
                    title={!isDemo ? 'TODO(backend): Menunggu migrasi snapshot diterapkan' : undefined}
                    className="px-2.5 py-1 rounded border border-black bg-retro-warm font-bold hover:bg-neutral-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Unduh
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
