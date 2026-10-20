'use client';

import React, { useState } from 'react';
import { Sliders, CheckCircle2, AlertCircle, Compass, Brain, Headphones, HandHelping, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleClassFeatureFlagAction } from './peta-pulau-actions';

export interface ClassFeatureSettingsProps {
  classId: string;
  initialFlags: Record<string, boolean>;
}

export function ClassFeatureSettingsTab({ classId, initialFlags }: ClassFeatureSettingsProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>(initialFlags);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const features = [
    {
      key: 'peta_pulau' as const,
      title: 'Peta Pulau Belajar',
      description: 'Aktifkan alur belajar berbasis peta pulau bertahap dan kuis bab terstruktur.',
      icon: Compass,
    },
    {
      key: 'flashcard' as const,
      title: 'Flashcard Pengulangan Berjarak (SRS)',
      description: 'Aktifkan latihan kartu mengingat konsep bab harian berbasis algoritma kotak Leitner.',
      icon: Brain,
      dependsOn: 'peta_pulau',
    },
    {
      key: 'podcast' as const,
      title: 'Podcast Ringkasan Bab',
      description: 'Aktifkan audio narasi rangkuman materi perkuliahan setelah naskah disetujui dosen.',
      icon: Headphones,
      dependsOn: 'peta_pulau',
    },
    {
      key: 'tukar_keahlian' as const,
      title: 'Tukar Keahlian Antarteman',
      description: 'Aktifkan bantuan belajar terstruktur antarmahasiswa sekelas pada topik yang dikuasai.',
      icon: HandHelping,
      dependsOn: 'peta_pulau',
    },
    {
      key: 'rekap_semester' as const,
      title: 'Rekap Semester Reflektif',
      description: 'Sertakan capaian kelas ini dalam lembar refleksi belajar semester pribadi mahasiswa.',
      icon: Trophy,
    },
  ];

  const handleToggle = async (
    featureKey: 'peta_pulau' | 'flashcard' | 'podcast' | 'tukar_keahlian' | 'rekap_semester',
    currentVal: boolean
  ) => {
    setIsUpdating(featureKey);
    setStatusMessage(null);
    const newVal = !currentVal;

    const res = await toggleClassFeatureFlagAction(classId, featureKey, newVal);
    if (res.ok) {
      setFlags((prev) => ({ ...prev, [featureKey]: newVal }));
      setStatusMessage(`Pengaturan ${featureKey} berhasil diperbarui.`);
    } else {
      setStatusMessage(`Gagal memperbarui: ${res.message || 'Terjadi kesalahan'}`);
    }
    setIsUpdating(null);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white border-2 border-black p-5 sm:p-6 rounded-2xl shadow-retro">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-[11px] font-mono font-bold text-black uppercase">
            <Sliders className="w-3.5 h-3.5 text-black" />
            <span>Konfigurasi Pedagogik</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-black">
            Pengaturan Fitur Pembelajaran Kelas
          </h2>
          <p className="text-xs sm:text-sm text-black/75 font-medium leading-relaxed">
            Pilih fitur pembelajaran yang ingin diaktifkan pada kelas ini. Mematikan fitur menyembunyikannya dari mahasiswa tanpa menghapus rekaman data yang tersimpan.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 text-xs bg-gray-soft border-2 border-black rounded-xl text-black font-bold shadow-retro-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="divide-y-2 divide-black/10 border-2 border-black bg-white rounded-2xl shadow-retro overflow-hidden">
        {features.map((feat) => {
          const isEnabled = flags[feat.key] ?? false;
          const isParentDisabled = feat.dependsOn && !flags[feat.dependsOn];

          return (
            <div
              key={feat.key}
              className={cn(
                'p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors',
                isParentDisabled && 'opacity-50 bg-gray-soft/30'
              )}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl border-2 border-black bg-gray-soft text-black shadow-retro-sm shrink-0">
                  <feat.icon className="w-5 h-5 text-black" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-heading font-black text-black">{feat.title}</h4>
                  <p className="text-xs text-black/75 font-medium max-w-2xl leading-relaxed">{feat.description}</p>
                  {isParentDisabled && (
                    <span className="text-[11px] font-mono font-bold text-black bg-gray-soft px-2 py-0.5 rounded border border-black inline-block mt-1">
                      Mensyaratkan fitur Peta Pulau diaktifkan terlebih dahulu.
                    </span>
                  )}
                </div>
              </div>

              {/* Sakelar Toggle Retro */}
              <div className="self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  disabled={Boolean(isParentDisabled || isUpdating === feat.key)}
                  onClick={() => handleToggle(feat.key, isEnabled)}
                  aria-pressed={isEnabled}
                  className={cn(
                    'relative inline-flex h-7 w-14 items-center rounded-full border-2 border-black transition-colors focus:outline-none shadow-retro-sm cursor-pointer',
                    isEnabled ? 'bg-black' : 'bg-gray-soft',
                    (isParentDisabled || isUpdating === feat.key) && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full border-2 border-black bg-white transition-transform shadow-xs',
                      isEnabled ? 'translate-x-7' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
