'use client';

import React from 'react';
import { Sparkles, Zap, EyeOff, Check } from 'lucide-react';
import { useMotionPreference, MotionPreference } from '@/hooks/use-motion-preference';
import { cn } from '@/lib/utils';

export function MotionSettingsCard() {
  const { motion, setMotion } = useMotionPreference();

  const options: Array<{
    id: MotionPreference;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'penuh',
      title: 'Animasi Penuh',
      subtitle: 'Standar & Responsif',
      description: 'Seluruh transisi halaman, panel drawer, efek masuk kartu, dan grafik statistik aktif secara penuh.',
      icon: Sparkles,
    },
    {
      id: 'hemat',
      title: 'Animasi Hemat',
      subtitle: 'Cepat & Ringan',
      description: 'Hanya transisi pudar cepat (≤ 160ms) tanpa efek hitung angka bertahap atau stagger. Hemat baterai dan memori.',
      icon: Zap,
    },
    {
      id: 'mati',
      title: 'Animasi Mati',
      subtitle: 'Aksesibilitas Tanpa Gerak',
      description: 'Seluruh animasi dan transisi dimatikan instan (0.01ms). Direkomendasikan bagi pengguna dengan sensitivitas gerak (vestibular).',
      icon: EyeOff,
    },
  ];

  return (
    <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
      <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
        <div className="space-y-0.5">
          <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Sistem Gerak &amp; Animasi</span>
          </h2>
          <p className="text-xs text-gray-dark font-bold">
            Pilih tingkat kenyamanan gerak antarmuka sesuai preferensi dan perangkat Anda
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs uppercase">
          {motion}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = motion === opt.id;

          return (
            <label
              key={opt.id}
              onClick={() => setMotion(opt.id)}
              className={cn(
                'p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative',
                isSelected
                  ? 'border-black bg-white shadow-retro'
                  : 'border-ink/30 bg-surface hover:bg-gray-soft/30 shadow-xs'
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'p-2 rounded-lg border-2 border-black flex items-center justify-center',
                      isSelected ? 'bg-primary text-white' : 'bg-gray-soft text-ink'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <input
                    type="radio"
                    name="motionPreference"
                    value={opt.id}
                    checked={isSelected}
                    onChange={() => setMotion(opt.id)}
                    className="h-4 w-4 accent-black cursor-pointer"
                  />
                </div>
                <div>
                  <span className="font-heading font-bold text-sm text-ink block">
                    {opt.title}
                  </span>
                  <span className="text-xs font-sans text-gray-dark font-bold block">
                    {opt.subtitle}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-dark font-sans leading-relaxed pt-2 border-t border-ink/10">
                {opt.description}
              </p>
            </label>
          );
        })}
      </div>
    </div>
  );
}
