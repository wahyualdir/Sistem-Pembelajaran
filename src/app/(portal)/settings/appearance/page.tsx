import React from 'react';
import Link from 'next/link';
import {
  Settings,
  Sliders,
  Moon,
  Sun,
  Globe,
  Type,
  Save,
  Bell,
  Laptop,
} from 'lucide-react';

export default function AppearanceSettingsPage() {
  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Pengaturan Akun & Preferensi
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Konfigurasi saluran notifikasi, tampilan antarmuka, bahasa, dan pengelolaan sesi perangkat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              TEMA: RETRO NEOBRUTALISM
            </span>
          </div>
        </div>

        {/* 3-TAB NAVIGATION BAR */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b-2 border-ink/20">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-surface text-ink hover:bg-gray-soft shadow-xs"
          >
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span>Notifikasi & Pengingat</span>
          </Link>
          <Link
            href="/settings/appearance"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-ink text-white shadow-retro border-b-4 border-b-primary"
          >
            <Sliders className="h-3.5 w-3.5 text-primary" />
            <span>Tampilan & Bahasa</span>
          </Link>
          <Link
            href="/devices"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-surface text-ink hover:bg-gray-soft shadow-xs"
          >
            <Laptop className="h-3.5 w-3.5 text-primary" />
            <span>Perangkat & Sesi</span>
          </Link>
        </div>

        {/* 1. PILIHAN TEMA VISUAL */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
            <div className="space-y-0.5">
              <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary" />
                <span>Tema Visual Antarmuka</span>
              </h2>
              <p className="text-xs text-gray-dark font-bold">Pilih gaya kanvas dan kontras warna visual</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
              PILIH GAYA
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro-sm space-y-3 cursor-pointer hover:bg-gray-soft/20 transition-all block">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg border-2 border-ink bg-gray-soft text-ink">
                    <Sun className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-sm sm:text-base text-ink block">Mode Terang (Retro Monokrom)</span>
                    <span className="text-xs font-sans text-gray-dark font-bold block">Klasik Mac OS & Warm Canvas</span>
                  </div>
                </div>
                <input type="radio" name="theme" defaultChecked className="h-4 w-4 accent-black" />
              </div>
              <p className="text-xs text-gray-dark font-bold font-sans leading-relaxed pt-2 border-t-2 border-ink/10">
                Gaya khas neo-brutalist dengan kanvas kertas vintage bersih, garis tepi tegas hitam solid, dan aksen cerah kuning retro.
              </p>
            </label>

            <label className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-neutral-900 text-white shadow-retro-sm space-y-3 cursor-pointer hover:bg-neutral-800 transition-all block">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg border-2 border-white/40 bg-neutral-800">
                    <Moon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-sm sm:text-base text-white block">Mode Gelap (OLED Black)</span>
                    <span className="text-xs font-sans text-neutral-400 font-bold block">Sangat hemat daya & redup</span>
                  </div>
                </div>
                <input type="radio" name="theme" className="h-4 w-4 accent-white" />
              </div>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed pt-2 border-t-2 border-white/10">
                Tingkat kontras tinggi dengan latar hitam pekat dan aksen neon retro, sangat nyaman saat mengerjakan tugas larut malam.
              </p>
            </label>
          </div>
        </div>

        {/* 2. BAHASA & AKSESIBILITAS */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Bahasa */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2">
                <h3 className="font-heading font-bold text-base text-ink flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>Bahasa Antarmuka</span>
                </h3>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3.5 rounded-xl border-2 border-ink bg-surface shadow-xs cursor-pointer hover:bg-gray-soft/30 transition-all">
                  <div>
                    <span className="font-heading font-bold text-sm text-ink block">Bahasa Indonesia (Utama)</span>
                    <span className="text-xs text-gray-dark block font-sans font-bold">Format penanggalan WIB & kurikulum nasional</span>
                  </div>
                  <input type="radio" name="lang" defaultChecked className="h-4 w-4 accent-black" />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border-2 border-ink bg-surface shadow-xs cursor-pointer hover:bg-gray-soft/30 transition-all">
                  <div>
                    <span className="font-heading font-bold text-sm text-ink block">English (International)</span>
                    <span className="text-xs text-gray-dark block font-sans font-bold">ECTS standard credit & academic grading</span>
                  </div>
                  <input type="radio" name="lang" className="h-4 w-4 accent-black" />
                </label>
              </div>
            </div>

            {/* Tipografi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2">
                <h3 className="font-heading font-bold text-base text-ink flex items-center gap-2">
                  <Type className="h-4 w-4 text-primary" />
                  <span>Skala Huruf & Kontras</span>
                </h3>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3.5 rounded-xl border-2 border-ink bg-surface shadow-xs cursor-pointer hover:bg-gray-soft/30 transition-all">
                  <div>
                    <span className="font-heading font-bold text-sm text-ink block">Standar (100% 16px)</span>
                    <span className="text-xs text-gray-dark block font-sans font-bold">Optimal untuk layar laptop & desktop</span>
                  </div>
                  <input type="radio" name="fontSize" defaultChecked className="h-4 w-4 accent-black" />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border-2 border-ink bg-surface shadow-xs cursor-pointer hover:bg-gray-soft/30 transition-all">
                  <div>
                    <span className="font-heading font-bold text-sm text-ink block">Huruf Besar Ramah Baca (115%)</span>
                    <span className="text-xs text-gray-dark block font-sans font-bold">Membantu kenyamanan membaca teks panjang</span>
                  </div>
                  <input type="radio" name="fontSize" className="h-4 w-4 accent-black" />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-ink/20 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-ink bg-ink text-white font-heading font-bold text-xs sm:text-sm shadow-retro-sm hover:bg-gray-dark transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Terapkan Pengaturan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
