'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sliders,
  Sparkles,
  FolderArchive,
  Building2,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

type SettingsTab = 'platform-branding' | 'pengaturan-ai' | 'penyimpanan-file';

export function SystemSettingsHubView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTab;
  const validTabs: SettingsTab[] = ['platform-branding', 'pengaturan-ai', 'penyimpanan-file'];
  const activeTab: SettingsTab = validTabs.includes(tabParam) ? tabParam : 'platform-branding';

  const setTab = (t: SettingsTab) => {
    router.push(`/admin/system/settings?tab=${t}`);
  };

  const isDemo = isDemoMode();
  const configuredAiModel = process.env.NEXT_PUBLIC_AI_MODEL || 'Google Gemini 1.5 Flash (Default Configurable)';

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="pengaturan_platform_dan_branding.app"
        badge="SYSTEM_ADMIN :: CONFIGURATION"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
                <Sliders className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Pengaturan Sistem dan Identitas
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Konfigurasi identitas visual kampus, parameter mesin evaluasi kecerdasan buatan (LLM SIAJAR), dan batas kuota penyimpanan berkas Supabase Storage.
            </p>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB NAVIGASI */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-2">
        {[
          { id: 'platform-branding', label: 'Sistem dan Identitas', icon: Building2 },
          { id: 'pengaturan-ai', label: 'Mesin AI SIAJAR', icon: Sparkles },
          { id: 'penyimpanan-file', label: 'Penyimpanan Berkas', icon: FolderArchive },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold font-sans transition-all cursor-pointer ${
                isActive
                  ? 'bg-black text-white shadow-retro'
                  : 'bg-white hover:bg-gray-soft text-black shadow-retro-sm'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. KONTEN TAB */}

      {/* TAB 1: PLATFORM & BRANDING */}
      {activeTab === 'platform-branding' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-bold text-lg text-black">Identitas Institusi Pendidikan Tinggi</h3>
            <p className="text-xs text-black/60 font-sans">Tampil pada banner navigasi, kop surat transkrip, dan kartu ujian.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-sans">
            <div>
              <label className="block font-bold text-black mb-1">Nama Perguruan Tinggi</label>
              <input
                type="text"
                disabled={!isDemo}
                defaultValue={isDemo ? 'Universitas Teknologi & Sains Nusantara' : (process.env.NEXT_PUBLIC_INSTITUTION_NAME || 'Belum dikonfigurasi')}
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Singkatan / Kode Institusi</label>
              <input
                type="text"
                disabled={!isDemo}
                defaultValue={isDemo ? 'UTSN (001042)' : (process.env.NEXT_PUBLIC_INSTITUTION_CODE || 'Belum dikonfigurasi')}
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Domain Resmi LMS</label>
              <input
                type="text"
                disabled={!isDemo}
                defaultValue={isDemo ? 'https://siajar.utsn.ac.id' : (process.env.NEXT_PUBLIC_APP_URL || 'Belum dikonfigurasi')}
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENGATURAN AI */}
      {activeTab === 'pengaturan-ai' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-bold text-lg text-black">Parameter Model Asisten AI SIAJAR</h3>
            <p className="text-xs text-black/60 font-sans">Digunakan untuk autograder esai, rekomendasi bank soal, dan ringkasan materi.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-sans">
            <div>
              <label className="block font-bold text-black mb-1">Default Model Evaluasi (Configurable via ENV)</label>
              <input
                type="text"
                disabled
                value={configuredAiModel}
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans font-bold"
              />
              <span className="text-xs text-black/60 mt-1 block">
                Dapat disesuaikan melalui variabel <code className="bg-black/5 px-1 py-0.5 rounded font-bold">NEXT_PUBLIC_AI_MODEL</code> di lingkungan deployment.
              </span>
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Batas Maksimal Token per Request</label>
              <input
                type="number"
                disabled={!isDemo}
                defaultValue={4096}
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div className="p-3 bg-gray-soft border-2 border-black rounded text-xs">
              Suhu Kreativitas (Temperature): 0.2 (Konservatif & Akurat untuk Penilaian Akademik)
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENYIMPANAN FILE */}
      {activeTab === 'penyimpanan-file' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-bold text-lg text-black">Penyimpanan Berkas (Supabase Storage)</h3>
            <p className="text-xs text-black/60 font-sans">Batas kuota unggahan materi kuliah, video rekaman, dan tugas.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-sans">
            <div>
              <label className="block font-bold text-black mb-1">Maksimal Ukuran Berkas Tugas</label>
              <input
                type="text"
                disabled={!isDemo}
                defaultValue="25 MB per pengumpulan"
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Maksimal Ukuran Modul Materi Dosen</label>
              <input
                type="text"
                disabled={!isDemo}
                defaultValue="100 MB per materi"
                className="w-full p-2.5 rounded border-2 border-black bg-gray-soft/20 font-sans disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
            <div className="p-3 bg-gray-soft border-2 border-black rounded text-xs font-sans">
              Status Provider: {isDemo ? 'Supabase Storage Bucket (Demo Sesi)' : (process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Supabase Storage Terhubung' : 'Belum terhubung')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
