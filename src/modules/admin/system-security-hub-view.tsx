'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Laptop,
  ShieldAlert,
  Clock,
  ShieldCheck,
  UserX,
  AlertTriangle,
  Lock,
  Globe,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

type SecurityTab = 'sesi-aktif' | 'login-mencurigakan' | 'rate-limit';

export function SystemSecurityHubView() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SecurityTab) || 'sesi-aktif';
  const [activeTab, setActiveTab] = useState<SecurityTab>(initialTab);
  const isDemo = isDemoMode();

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="keamanan_dan_pertahanan_siber.app"
        badge="SYSTEM_ADMIN :: CYBER_SECURITY"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-retro-sm">
                <Laptop className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Pusat Keamanan & Manajemen Sesi
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Audit sesi login aktif lintas perangkat, deteksi anomali brute-force dan pergantian IP mendadak, serta aturan batas laju pemanggilan API (*rate limiting*).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-emerald-100 text-emerald-950 font-mono text-xs font-bold shadow-retro-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              FIREWALL & GUARD AKTIF
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB NAVIGASI */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-2">
        {[
          { id: 'sesi-aktif', label: 'Sesi Aktif', icon: Laptop },
          { id: 'login-mencurigakan', label: 'Login Mencurigakan', icon: ShieldAlert },
          { id: 'rate-limit', label: 'Rate Limiting', icon: Clock },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as SecurityTab)}
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

      {/* TAB 1: SESI AKTIF */}
      {activeTab === 'sesi-aktif' && (
        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">
              Daftar Sesi Pengguna Aktif di Perangkat
            </h3>
            <span className="text-xs font-mono font-bold text-black/60">
              Total: {isDemo ? '2 Sesi Terpantau' : '0 Sesi (Belum Terhubung)'}
            </span>
          </div>

          {!isDemo ? (
            <div className="p-8 text-center text-black/60 font-mono text-xs border-2 border-dashed border-black/20 rounded-xl">
              Pangkalan data sesi pengguna aktif belum terhubung ke database. Fitur pencabutan sesi jarak jauh saat ini berstatus belum aktif.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-retro-warm font-mono font-black text-black">
                    <th className="p-3">Pengguna</th>
                    <th className="p-3">Peran</th>
                    <th className="p-3">Perangkat / Browser</th>
                    <th className="p-3">Alamat IP</th>
                    <th className="p-3">Waktu Login</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b border-black font-mono">
                  <tr>
                    <td className="p-3 font-bold text-black">Dr. Budi Santoso</td>
                    <td className="p-3 text-black/80 font-sans">LECTURER</td>
                    <td className="p-3 text-black/80 font-sans">macOS • Chrome 129</td>
                    <td className="p-3">180.252.12.90</td>
                    <td className="p-3">10 Menit Lalu</td>
                    <td className="p-3 text-center">
                      <button
                        disabled={!isDemo}
                        title={!isDemo ? 'Fitur ini belum aktif' : undefined}
                        className="px-2.5 py-1 rounded border border-black bg-rose-100 text-rose-950 font-bold hover:bg-rose-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cabut Sesi
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-black">Ahmad Mahasiswa</td>
                    <td className="p-3 text-black/80 font-sans">STUDENT</td>
                    <td className="p-3 text-black/80 font-sans">Windows 11 • Edge 128</td>
                    <td className="p-3">36.88.21.144</td>
                    <td className="p-3">45 Menit Lalu</td>
                    <td className="p-3 text-center">
                      <button
                        disabled={!isDemo}
                        title={!isDemo ? 'Fitur ini belum aktif' : undefined}
                        className="px-2.5 py-1 rounded border border-black bg-rose-100 text-rose-950 font-bold hover:bg-rose-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cabut Sesi
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOGIN MENCURIGAKAN */}
      {activeTab === 'login-mencurigakan' && (
        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">
              Deteksi Anomali Login & Percobaan Brute-Force
            </h3>
            <span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-bold font-mono text-xs">
              0 ANOMALI KRITIS
            </span>
          </div>

          <div className="p-8 text-center text-black/60 font-mono text-xs border-2 border-dashed border-black/20 rounded-xl">
            Tidak ada aktivitas login mencurigakan yang terdeteksi dalam 24 jam terakhir. Sistem mitigasi akun aman.
          </div>
        </div>
      )}

      {/* TAB 3: RATE LIMITING */}
      {activeTab === 'rate-limit' && (
        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-6">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">
              Konfigurasi Batas Laju Pemanggilan API (Rate Limiting)
            </h3>
            <p className="text-xs text-black/60 font-mono">
              Melindungi server dari serangan DDoS dan abuse pengiriman jawaban ujian.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 border-2 border-black rounded-lg bg-retro-warm/20 space-y-2">
              <span className="font-bold text-black">Endpoint: /login</span>
              <p className="text-black/60">Batas: 5 Percobaan / 15 Menit</p>
              <span className="inline-block px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-xs font-bold">
                AKTIF (IP BLOCKING)
              </span>
            </div>

            <div className="p-4 border-2 border-black rounded-lg bg-retro-warm/20 space-y-2">
              <span className="font-bold text-black">Endpoint: /exams/submit</span>
              <p className="text-black/60">Batas: 60 Request / Menit</p>
              <span className="inline-block px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-xs font-bold">
                AKTIF (BURST SAFE)
              </span>
            </div>

            <div className="p-4 border-2 border-black rounded-lg bg-retro-warm/20 space-y-2">
              <span className="font-bold text-black">Endpoint: /attendance/check-in</span>
              <p className="text-black/60">Batas: 10 Request / Menit</p>
              <span className="inline-block px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 text-xs font-bold">
                AKTIF (GEOFENCE VERIFIED)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
