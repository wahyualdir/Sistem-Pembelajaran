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
      description: 'Aktifkan alur belajar berbasis peta pulau bertahap dan kuis bab.',
      icon: Compass,
      color: 'text-primary',
    },
    {
      key: 'flashcard' as const,
      title: 'Flashcard Pengulangan Berjarak',
      description: 'Aktifkan latihan kartu mengingat konsep bab harian berbasis sistem kotak Leitner.',
      icon: Brain,
      color: 'text-purple-600',
      dependsOn: 'peta_pulau',
    },
    {
      key: 'podcast' as const,
      title: 'Podcast Ringkasan Bab',
      description: 'Aktifkan ringkasan audio narator untuk materi bab setelah naskah disetujui.',
      icon: Headphones,
      color: 'text-blue-600',
      dependsOn: 'peta_pulau',
    },
    {
      key: 'tukar_keahlian' as const,
      title: 'Tukar Keahlian Antarteman',
      description: 'Aktifkan bantuan belajar terstruktur antarmahasiswa sekelas pada topik yang dikuasai.',
      icon: HandHelping,
      color: 'text-emerald-600',
      dependsOn: 'peta_pulau',
    },
    {
      key: 'rekap_semester' as const,
      title: 'Rekap Semester Reflektif',
      description: 'Sertakan capaian kelas ini dalam lembar refleksi belajar semester pribadi mahasiswa.',
      icon: Trophy,
      color: 'text-amber-600',
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
    <div className="space-y-6">
      <div className="bg-card border border-border p-4 rounded-lg">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary" />
          Pengaturan Fitur Pembelajaran Kelas
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pilih fitur pembelajaran yang ingin diaktifkan pada kelas ini. Mematikan fitur menyembunyikannya dari mahasiswa tanpa menghapus data yang tersimpan.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 text-xs bg-muted border border-border rounded-md text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      <div className="divide-y divide-border border border-border bg-card rounded-lg">
        {features.map((feat) => {
          const isEnabled = flags[feat.key] ?? false;
          const isParentDisabled = feat.dependsOn && !flags[feat.dependsOn];

          return (
            <div
              key={feat.key}
              className={cn(
                'p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors',
                isParentDisabled && 'opacity-50 bg-muted/20'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-md bg-muted shrink-0', feat.color)}>
                  <feat.icon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-foreground">{feat.title}</h4>
                  <p className="text-xs text-muted-foreground">{feat.description}</p>
                  {isParentDisabled && (
                    <span className="text-[11px] text-amber-600 block mt-1">
                      Mensyaratkan fitur Peta Pulau diaktifkan terlebih dahulu.
                    </span>
                  )}
                </div>
              </div>

              {/* Sakelar Toggle */}
              <div className="self-end sm:self-auto">
                <button
                  type="button"
                  disabled={Boolean(isParentDisabled || isUpdating === feat.key)}
                  onClick={() => handleToggle(feat.key, isEnabled)}
                  aria-pressed={isEnabled}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isEnabled ? 'bg-primary' : 'bg-muted-foreground/30',
                    (isParentDisabled || isUpdating === feat.key) && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
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
