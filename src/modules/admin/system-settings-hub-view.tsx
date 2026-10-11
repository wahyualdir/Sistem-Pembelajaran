'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sliders,
  Sparkles,
  FolderArchive,
  Save,
  CheckCircle2,
  Building2,
  Cpu,
  HardDrive,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

type SettingsTab = 'platform-branding' | 'pengaturan-ai' | 'penyimpanan-file';

export function SystemSettingsHubView() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'platform-branding';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const isDemo = isDemoMode();

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="pengaturan_platform_dan_branding.app"
        badge="SYSTEM_ADMIN :: CONFIGURATION"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-retro-sm">
                <Sliders className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Pengaturan Platform & Branding
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Konfigurasi identitas visual kampus, parameter mesin evaluasi kecerdasan buatan (LLM SIAJAR), dan batas kuota penyimpanan media perkuliahan.
            </p>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB NAVIGASI */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-2">
        {[
          { id: 'platform-branding', label: 'Platform & Branding', icon: Building2 },
          { id: 'pengaturan-ai', label: 'Mesin AI SIAJAR', icon: Sparkles },
          { id: 'penyimpanan-file', label: 'Penyimpanan Berkas', icon: FolderArchive },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as SettingsTab)}
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

      {/* TAB 1: PLATFORM & BRANDING */}
      {activeTab === 'platform-branding' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Identitas Institusi Pendidikan Tinggi</h3>
            <p className="text-xs text-black/60 font-mono">Tampil pada banner navigasi, kop surat transkrip, dan kartu ujian.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-mono">
            <div>
              <label className="block font-bold text-black mb-1">Nama Perguruan Tinggi</label>
              <input
                type="text"
                defaultValue="Universitas Teknologi & Sains Nusantara"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-sans"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Singkatan / Kode Institusi</label>
              <input
                type="text"
                defaultValue="UTSN (001042)"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Domain Resmi LMS</label>
              <input
                type="text"
                defaultValue="https://siajar.utsn.ac.id"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENGATURAN AI */}
      {activeTab === 'pengaturan-ai' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Parameter Model Asisten AI SIAJAR</h3>
            <p className="text-xs text-black/60 font-mono">Digunakan untuk autograder esai, rekomendasi bank soal, dan ringkasan materi.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-mono">
            <div>
              <label className="block font-bold text-black mb-1">Default Model Evaluasi</label>
              <select className="w-full p-2.5 rounded border-2 border-black bg-white font-mono">
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Direkomendasikan)</option>
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Kecepatan Tinggi)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Batas Maksimal Token per Request</label>
              <input
                type="number"
                defaultValue={4096}
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
            <div className="p-3 bg-retro-warm border-2 border-black rounded text-xs">
              Suhu Kreativitas (Temperature): 0.2 (Konservatif & Akurat untuk Penilaian Akademik)
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENYIMPANAN FILE */}
      {activeTab === 'penyimpanan-file' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Penyimpanan Berkas (Object Storage S3)</h3>
            <p className="text-xs text-black/60 font-mono">Batas kuota unggahan materi kuliah, video rekaman, dan tugas.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-mono">
            <div>
              <label className="block font-bold text-black mb-1">Maksimal Ukuran Berkas Tugas</label>
              <input
                type="text"
                defaultValue="25 MB per pengumpulan"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Maksimal Ukuran Modul Materi Dosen</label>
              <input
                type="text"
                defaultValue="100 MB per materi"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded text-emerald-950 font-bold text-xs">
              ✓ Antivirus Scanning Otomatis Aktif pada Setiap Berkas Unggahan
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
