'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Award,
  FileText,
  ShieldCheck,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

type PolicyTab = 'akademik' | 'ujian-pengawasan' | 'privasi-retensi';

export function SuperadminPoliciesHubView() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as PolicyTab) || 'akademik';
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);
  const isDemo = isDemoMode();

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="kebijakan_universitas_dan_regulasi.app"
        badge="SUPER_ADMIN :: POLICIES"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Kebijakan Akademik, Ujian & Privasi
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Tentukan parameter regulasi akademik baku universitas, batas ambang pengawasan kuis/ujian, dan kebijakan retensi data pribadi mahasiswa.
            </p>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB NAVIGASI */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-2">
        {[
          { id: 'akademik', label: 'Kebijakan Akademik', icon: BookOpen },
          { id: 'ujian-pengawasan', label: 'Ujian & Pengawasan', icon: Award },
          { id: 'privasi-retensi', label: 'Privasi & Retensi Data', icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PolicyTab)}
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

      {/* TAB 1: KEBIJAKAN AKADEMIK */}
      {activeTab === 'akademik' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Aturan Kelayakan Akademik Baku</h3>
            <p className="text-xs text-black/60 font-mono">Diterapkan otomatis pada kalkulasi KHS, transkrip, dan eligibility ujian.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-mono">
            <div>
              <label className="block font-bold text-black mb-1">Syarat Kehadiran Minimal Ujian Akhir (%)</label>
              <input
                type="number"
                defaultValue={75}
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Maksimal Beban SKS Semester Reguler</label>
              <input
                type="number"
                defaultValue={24}
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Batas Minimal IPK Kelulusan (Yudisium)</label>
              <input
                type="text"
                defaultValue="2.00 (Skala 4.00)"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UJIAN & PENGAWASAN */}
      {activeTab === 'ujian-pengawasan' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Regulasi Proctoring & Sanksi Otomatis</h3>
            <p className="text-xs text-black/60 font-mono">Toleransi anomali layar, tab switch, dan diskualifikasi sesi CBT.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-mono">
            <div>
              <label className="block font-bold text-black mb-1">Ambang Maksimal Peringatan Pelanggaran Siswa</label>
              <input
                type="number"
                defaultValue={3}
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Aksi Pelanggaran Melebihi Batas</label>
              <select className="w-full p-2.5 rounded border-2 border-black bg-white font-mono">
                <option value="AUTO_LOCK">Kunci Lembar Ujian & Butuh Verifikasi Pengawas</option>
                <option value="DISQUALIFY">Diskualifikasi Langsung (Nilai 0)</option>
              </select>
            </div>
            <div className="p-3 bg-amber-50 border-2 border-amber-500 rounded text-amber-950 font-bold text-xs">
              Catatan: Intervensi dosen (tambah waktu / beri peringatan manual) TIDAK dihitung sebagai pelanggaran mahasiswa.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVASI & RETENSI DATA */}
      {activeTab === 'privasi-retensi' && (
        <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-6 max-w-2xl">
          <div className="border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">Kebijakan Retensi Data Sensitif (UU PDP)</h3>
            <p className="text-xs text-black/60 font-mono">Penghapusan berkala data biometrik, foto presensi, dan koordinat GPS.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm font-mono">
            <div>
              <label className="block font-bold text-black mb-1">Retensi Koordinat GPS Presensi Mahasiswa</label>
              <input
                type="text"
                defaultValue="90 Hari (Anonimkan Setelah Semester Berakhir)"
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-black mb-1">Retensi Log Audit Forensik Sistem</label>
              <input
                type="text"
                readOnly
                value="Permanen (Append-Only Anti-Tamper)"
                className="w-full p-2.5 rounded border-2 border-black bg-emerald-50 text-emerald-950 font-bold font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
