import React from 'react';
import Link from 'next/link';
import {
  Sliders,
  Moon,
  Sun,
  Globe,
  Monitor,
  CheckCircle2,
  Type,
  Eye,
  Save,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

export default function AppearanceSettingsPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW TAMPILAN */}
      <RetroWindow
        title="preferensi_tampilan_dan_bahasa.app"
        badge="PENGATURAN UI"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 sm:p-8 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-retro-border bg-primary text-white shadow-xs">
                <Sliders className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
                Tampilan, Bahasa & Aksesibilitas
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mt-1 leading-relaxed">
              Sesuaikan mode kontras visual (terang/gelap), ukuran tipografi retro neo-brutalist, dan preferensi bahasa antarmuka sistem akademik Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border-2 border-retro-border bg-retro-warm px-4 py-1.5 text-sm font-mono font-bold text-foreground">
              Tema Terpasang: Monokrom Retro
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. PILIHAN TEMA VISUAL FULL CARDS */}
      <RetroWindow
        title="tema_visual_aplikasi.style"
        headerClassName="bg-retro-warm"
        bodyClassName="p-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-lg text-foreground flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            <span>Tema Visual Antarmuka</span>
          </h2>
          <span className="text-xs font-mono text-muted-foreground">Pilih gaya kanvas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="p-6 rounded-xl border-2 border-black bg-retro-warm/40 shadow-retro space-y-4 cursor-pointer hover:-translate-y-0.5 transition-all block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border border-black bg-white">
                  <Sun className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <span className="font-heading font-black text-base text-foreground block">Mode Terang (Retro Monokrom)</span>
                  <span className="text-xs font-mono text-muted-foreground block">Klasik Mac OS & Warm Sand</span>
                </div>
              </div>
              <input type="radio" name="theme" defaultChecked className="h-5 w-5 accent-black" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-black/10">
              Gaya khas neo-brutalist dengan kanvas kertas vintage bersih, garis tepi tegas hitam solid, dan aksen cerah kuning retro.
            </p>
          </label>

          <label className="p-6 rounded-xl border-2 border-black bg-neutral-900 text-white shadow-retro space-y-4 cursor-pointer hover:-translate-y-0.5 transition-all block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border border-white/40 bg-neutral-800">
                  <Moon className="h-6 w-6 text-retro-yellow" />
                </div>
                <div>
                  <span className="font-heading font-black text-base text-white block">Mode Gelap (OLED Black)</span>
                  <span className="text-xs font-mono text-neutral-400 block">Sangat hemat daya & redup</span>
                </div>
              </div>
              <input type="radio" name="theme" className="h-5 w-5 accent-white" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed pt-2 border-t border-white/10">
              Tingkat kontras tinggi dengan latar hitam pekat dan aksen neon retro, sangat nyaman saat mengerjakan tugas larut malam.
            </p>
          </label>
        </div>
      </RetroWindow>

      {/* 3. BAHASA & AKSESIBILITAS CARDS */}
      <RetroWindow
        title="bahasa_dan_ukuran_huruf.locale"
        headerClassName="bg-retro-warm"
        bodyClassName="p-6 sm:p-7 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bahasa */}
          <div className="space-y-4">
            <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span>Bahasa Antarmuka</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-xl border-2 border-black bg-white shadow-retro cursor-pointer">
                <div>
                  <span className="font-heading font-bold text-sm text-foreground block">Bahasa Indonesia (Utama)</span>
                  <span className="text-xs text-muted-foreground block font-mono">Format penanggalan WIB & kurikulum nasional</span>
                </div>
                <input type="radio" name="lang" defaultChecked className="h-5 w-5 accent-black" />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border-2 border-black bg-white shadow-retro cursor-pointer">
                <div>
                  <span className="font-heading font-bold text-sm text-foreground block">English (International)</span>
                  <span className="text-xs text-muted-foreground block font-mono">ECTS standard credit & academic grading</span>
                </div>
                <input type="radio" name="lang" className="h-5 w-5 accent-black" />
              </label>
            </div>
          </div>

          {/* Tipografi */}
          <div className="space-y-4">
            <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              <span>Skala Huruf & Kontras</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-xl border-2 border-black bg-white shadow-retro cursor-pointer">
                <div>
                  <span className="font-heading font-bold text-sm text-foreground block">Standar (100% 16px)</span>
                  <span className="text-xs text-muted-foreground block font-mono">Optimal untuk layar laptop & desktop</span>
                </div>
                <input type="radio" name="fontSize" defaultChecked className="h-5 w-5 accent-black" />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border-2 border-black bg-white shadow-retro cursor-pointer">
                <div>
                  <span className="font-heading font-bold text-sm text-foreground block">Huruf Besar Ramah Baca (115%)</span>
                  <span className="text-xs text-muted-foreground block font-mono">Membantu kenyamanan membaca teks panjang</span>
                </div>
                <input type="radio" name="fontSize" className="h-5 w-5 accent-black" />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-black/10 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-black bg-black text-white font-heading font-black text-sm shadow-retro hover:bg-neutral-800 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Terapkan Pengaturan</span>
          </button>
        </div>
      </RetroWindow>
    </div>
  );
}
