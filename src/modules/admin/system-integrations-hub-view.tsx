'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Globe,
  Video,
  MapPin,
  Code,
  MessageSquare,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

type IntegrationTab =
  | 'zoom-meet'
  | 'google-maps'
  | 'sandbox-kode'
  | 'gateway-email-wa'
  | 'sso'
  | 'api-key';

export function SystemIntegrationsHubView() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as IntegrationTab) || 'zoom-meet';
  const [activeTab, setActiveTab] = useState<IntegrationTab>(initialTab);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const isDemo = isDemoMode();

  // A4 & A2: Helper sensor rahasia: di non-demo mode nilai penuh tidak pernah diekspos ke klien
  const maskSecret = (key: string, secret: string) => {
    if (!isDemo) return '•••••••••••••••• (Tersimpan di Env Server)';
    if (showSecret[key]) return secret;
    const last4 = secret.slice(-4);
    return `••••••••••••••••${last4}`;
  };

  const toggleShow = (key: string) => {
    if (!isDemo) return;
    setShowSecret((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="integrasi_layanan_eksternal.app"
        badge="SYSTEM_ADMIN :: INTEGRATIONS"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-retro-sm">
                <Globe className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Integrasi Layanan & Gateway Eksternal
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Kelola kredensial API pihak ketiga, OAuth Single Sign-On (SSO), gateway perpesanan WhatsApp/Email, dan kunci akses API eksternal. Seluruh rahasia tersensor aman.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-emerald-100 text-emerald-950 font-mono text-xs font-bold shadow-retro-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              MASKING AKTIF (4 DIGIT TERAKHIR)
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB NAVIGASI */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-2">
        {[
          { id: 'zoom-meet', label: 'Zoom & Meet', icon: Video },
          { id: 'google-maps', label: 'Google Maps GPS', icon: MapPin },
          { id: 'sandbox-kode', label: 'Sandbox Kode', icon: Code },
          { id: 'gateway-email-wa', label: 'Gateway Email / WA', icon: MessageSquare },
          { id: 'sso', label: 'SSO Kampus', icon: Key },
          { id: 'api-key', label: 'API Keys & Webhook', icon: Lock },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as IntegrationTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs sm:text-sm font-bold font-mono transition-all cursor-pointer ${
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

      {/* TAB 1: ZOOM & MEET */}
      {activeTab === 'zoom-meet' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Konfigurasi Video Conference (Zoom / Google Meet)</h3>
            <p className="text-xs text-black/60 font-mono">Tautan kelas daring otomatis dibuat saat dosen memulai sesi perkuliahan.</p>
          </div>

          <div className="space-y-4 max-w-xl text-xs sm:text-sm font-mono">
            <div>
              <label className="block font-bold text-black mb-1">Zoom Client ID</label>
              <input
                type="text"
                readOnly
                value="zm_client_app_siajar_prod_8921"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/30 font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-black">Zoom Client Secret</label>
                <button
                  type="button"
                  onClick={() => toggleShow('zoom')}
                  className="text-xs flex items-center gap-1 font-mono text-black/60 hover:text-black cursor-pointer"
                >
                  {showSecret['zoom'] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showSecret['zoom'] ? 'Sembunyikan' : 'Buka Masking'}</span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={maskSecret('zoom', 'zm_sec_live_9921448821049381_x8b2')}
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/30 font-mono font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE MAPS GPS */}
      {activeTab === 'google-maps' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Integrasi Google Maps Platform API</h3>
            <p className="text-xs text-black/60 font-mono">Digunakan untuk visualisasi peta kampus dan validasi radius geofencing presensi.</p>
          </div>

          <div className="space-y-4 max-w-xl text-xs sm:text-sm font-mono">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-black">Google Maps API Key (Browser Key)</label>
                <button
                  type="button"
                  onClick={() => toggleShow('gmaps')}
                  className="text-xs flex items-center gap-1 font-mono text-black/60 hover:text-black cursor-pointer"
                >
                  {showSecret['gmaps'] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showSecret['gmaps'] ? 'Sembunyikan' : 'Buka Masking'}</span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={maskSecret('gmaps', 'AIzaSyA88491028301824701298410294_9c3d')}
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/30 font-mono font-bold"
              />
            </div>
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded text-xs font-mono text-emerald-950 font-bold">
              ✓ HTTP Referrer Restriction terpasang: *.siajar.ac.id/*
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SANDBOX KODE */}
      {activeTab === 'sandbox-kode' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Konfigurasi Judge0 Sandbox Compiler API</h3>
            <p className="text-xs text-black/60 font-mono">Runner isolasi untuk eksekusi soal live coding ujian dan tugas mahasiswa.</p>
          </div>

          <div className="space-y-4 max-w-xl text-xs sm:text-sm font-mono">
            <div>
              <label className="block font-bold text-black mb-1">Judge0 Endpoint URL</label>
              <input
                type="text"
                readOnly
                value="https://judge0-api.internal.siajar.ac.id"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/30 font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-black">Judge0 Auth Token</label>
                <button
                  type="button"
                  onClick={() => toggleShow('judge0')}
                  className="text-xs flex items-center gap-1 font-mono text-black/60 hover:text-black cursor-pointer"
                >
                  {showSecret['judge0'] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showSecret['judge0'] ? 'Sembunyikan' : 'Buka Masking'}</span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={maskSecret('judge0', 'jdg0_tok_prod_448819204128912_5f1a')}
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/30 font-mono font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GATEWAY EMAIL & WA */}
      {activeTab === 'gateway-email-wa' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">WhatsApp Business & SMTP Mailer Gateway</h3>
            <p className="text-xs text-black/60 font-mono">Pemberitahuan pengingat jadwal ujian, reset password, dan notifikasi persetujuan nilai.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm font-mono">
            <div className="p-4 border-2 border-black rounded-lg space-y-3">
              <h4 className="font-bold text-black">WhatsApp API Gateway</h4>
              <div>
                <label className="block text-black/60 mb-1">API Key Gateway</label>
                <input
                  type="text"
                  readOnly
                  value={maskSecret('wa', 'wa_gw_prod_8820491823901_33d1')}
                  className="w-full p-2 rounded border border-black bg-retro-warm/30 font-mono font-bold"
                />
              </div>
              <span className={`inline-block px-2 py-0.5 rounded border font-bold text-xs ${
                isDemo
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                  : 'border-neutral-400 bg-neutral-100 text-neutral-700'
              }`}>
                {isDemo ? 'STATUS: TERHUBUNG' : 'STATUS: BELUM DIKONFIGURASI'}
              </span>
            </div>

            <div className="p-4 border-2 border-black rounded-lg space-y-3">
              <h4 className="font-bold text-black">SMTP Server Email</h4>
              <div>
                <label className="block text-black/60 mb-1">Password SMTP</label>
                <input
                  type="text"
                  readOnly
                  value={maskSecret('smtp', 'smtp_pass_prod_99218204912_4a9f')}
                  className="w-full p-2 rounded border border-black bg-retro-warm/30 font-mono font-bold"
                />
              </div>
              <span className={`inline-block px-2 py-0.5 rounded border font-bold text-xs ${
                isDemo
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                  : 'border-neutral-400 bg-neutral-100 text-neutral-700'
              }`}>
                {isDemo ? 'STATUS: TERVERIFIKASI' : 'STATUS: BELUM DIKONFIGURASI'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SSO KAMPUS */}
      {activeTab === 'sso' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Integrasi Single Sign-On (SSO SAML / OAuth)</h3>
            <p className="text-xs text-black/60 font-mono">Autentikasi terpusat akun institusi civitas akademika.</p>
          </div>

          <div className="space-y-4 max-w-xl text-xs sm:text-sm font-mono">
            <div>
              <label className="block font-bold text-black mb-1">IdP Entity ID</label>
              <input
                type="text"
                readOnly
                value="https://sso.universitas.ac.id/saml2/idp/metadata"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/30 font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-black">X.509 Certificate Fingerprint</label>
                <button
                  type="button"
                  onClick={() => toggleShow('sso')}
                  className="text-xs flex items-center gap-1 font-mono text-black/60 hover:text-black cursor-pointer"
                >
                  {showSecret['sso'] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showSecret['sso'] ? 'Sembunyikan' : 'Buka Masking'}</span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={maskSecret('sso', 'SHA256:7B:8A:2C:9E:4F:1D:3A:8C:5E:2B:1A:9D:4E:7F:3C:6A:9B:2E:5D:8F:1A:4C:7E:2B:5D:8F:1A:4C:7E:2B_9f02')}
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/30 font-mono font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: API KEY & WEBHOOK */}
      {activeTab === 'api-key' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Manajemen Kunci API Eksternal & Webhook</h3>
            <p className="text-xs text-black/60 font-mono">Kunci API sistem eksternal (Perpustakaan, Keuangan, Kemahasiswaan).</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 border-2 border-black rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-retro-warm/20">
              <div>
                <p className="font-bold text-black text-sm">Sistem Keuangan & Pembayaran UKT</p>
                <p className="text-black/60 text-xs">Dibuat: 01 Jan 2026 | Izin: read:student_bill, write:payment_status</p>
              </div>
              <div className="font-bold text-black bg-white px-3 py-1 rounded border border-black">
                {maskSecret('key-fin', 'sk_live_fin_8820491820481029_88a1')}
              </div>
            </div>

            <div className="p-3 border-2 border-black rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-retro-warm/20">
              <div>
                <p className="font-bold text-black text-sm">Sistem Pangkalan Data Kemendikbud Dikti (PDDIKTI)</p>
                <p className="text-black/60 text-xs">Dibuat: 15 Feb 2026 | Izin: sync:feeder_academic_data</p>
              </div>
              <div className="font-bold text-black bg-white px-3 py-1 rounded border border-black">
                {maskSecret('key-dikti', 'sk_live_pddikti_9921820481920481_77b4')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
