'use client';

import { WindowTrafficLights } from '@/components/retro/window-traffic-lights';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Video,
  X,
  Compass,
  Laptop,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { MacIllustration } from '@/components/retro/mac-illustration';

type PreviewTab = 'mahasiswa' | 'dosen' | 'langit';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('mahasiswa');
  const [showTourModal, setShowTourModal] = useState<boolean>(false);
  const [activeFeatureModal, setActiveFeatureModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-black font-sans selection:bg-black selection:text-white antialiased flex flex-col">
      {/* -------------------- 1. TOP RETRO NAVIGATION BAR -------------------- */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none"
              title="RuangKampus - Beranda"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white p-1 shadow-retro-xs group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                <img
                  src="/logo-ruangkampus.png"
                  alt="Logo RuangKampus"
                  className="h-full w-full object-contain [image-rendering:-webkit-optimize-contrast]"
                />
              </div>

              <div className="flex flex-col">
                <span className="font-heading font-black text-base sm:text-lg tracking-tight leading-none text-black">
                  Ruang<span style={{ color: '#ED1C24' }} className="text-[#ED1C24]">Kampus</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-gray-dark uppercase tracking-wider mt-0.5 leading-none">
                  Sistem Pembelajaran
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-bold text-black">
            <a href="#fitur" className="hover:underline underline-offset-4">
              Fitur Unggulan
            </a>
            <a href="#peran" className="hover:underline underline-offset-4">
              Sivitas Kampus
            </a>
            <a href="#alur" className="hover:underline underline-offset-4">
              Alur Kuliah
            </a>
            <button
              type="button"
              onClick={() => setShowTourModal(true)}
              className="hover:underline underline-offset-4 cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-black" />
              <span>Panduan Cepat</span>
            </button>
          </nav>

          {/* Primary Call to Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowTourModal(true)}
              className="hidden sm:inline-flex px-3 py-1.5 border-2 border-black bg-gray-soft text-black font-bold text-xs shadow-retro-sm hover:bg-white active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Simulasi
            </button>

            <Link
              href="/login"
              className="px-4 py-1.5 sm:px-5 sm:py-2 border-2 border-black bg-black text-white font-black text-xs sm:text-sm shadow-retro hover:bg-white hover:text-black active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 group"
            >
              <span>Masuk Portal</span>
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------- 2. HERO INTRODUCTION SECTION -------------------- */}
      <main className="flex-1 w-full">
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-20">
          <div className="grid lg:grid-cols-[1.1fr_1fr] items-center gap-10 lg:gap-14">
            {/* Sisi Kiri: Narasi Perkenalan & Keunggulan */}
            <div className="space-y-5 sm:space-y-6">
              {/* Badge Pembuka */}
              <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-white rounded-full shadow-retro-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black" />
                </span>
                <span className="text-xs font-mono font-black uppercase tracking-wider text-black">
                  PORTAL AKADEMIK MAHASISWA & DOSEN
                </span>
              </div>

              {/* Headline Utama Berani & Tegas */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-black leading-[1.05]">
                Belajar Lebih Cerdas,
                <br />
                <span className="bg-black text-white px-2 py-0.5 inline-block -rotate-1 shadow-retro-sm">
                  Fokus Lebih Tajam.
                </span>
              </h1>

              {/* Paragraf Pengantar */}
              <p className="text-sm sm:text-base text-black font-semibold leading-relaxed max-w-xl">
                Selamat datang di <strong>SIAJAR</strong> — ekosistem pembelajaran dan sistem informasi
                akademik terpadu kampus. Dirancang dengan tipografi hitam kontras tinggi dan estetika
                retro Macintosh 1984 yang ergonomis, cepat, dan bebas distraksi visual.
              </p>

              {/* 3 Indikator Nilai Utama */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2">
                <div className="p-2.5 sm:p-3 border-2 border-black bg-white shadow-retro-sm rounded">
                  <div className="text-xl sm:text-2xl font-mono font-black text-black">100%</div>
                  <div className="text-[11px] font-bold text-black/70 leading-tight">Presensi Real-Time</div>
                </div>
                <div className="p-2.5 sm:p-3 border-2 border-black bg-white shadow-retro-sm rounded">
                  <div className="text-xl sm:text-2xl font-mono font-black text-black">&lt; 1 Detik</div>
                  <div className="text-[11px] font-bold text-black/70 leading-tight">Akses Cepat Modul</div>
                </div>
                <div className="p-2.5 sm:p-3 border-2 border-black bg-white shadow-retro-sm rounded">
                  <div className="text-xl sm:text-2xl font-mono font-black text-black">24 / 7</div>
                  <div className="text-[11px] font-bold text-black/70 leading-tight">Sinkronisasi Cloud</div>
                </div>
              </div>

              {/* Tombol Aksi Hero */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/login"
                  className="px-6 py-3 border-2 border-black bg-black text-white font-black text-sm shadow-retro-md hover:bg-white hover:text-black active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>Masuk ke Akun Anda</span>
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowTourModal(true)}
                  className="px-5 py-3 border-2 border-black bg-white text-black font-black text-sm shadow-retro-md hover:bg-gray-soft active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Lihat Panduan & Simulasi</span>
                </button>
              </div>
            </div>

            {/* Sisi Kanan: Jendela CRT Interaktif Live Demo (Full Animasi) */}
            <div className="w-full">
              <div className="border-2 border-black bg-white shadow-retro-lg rounded-xl overflow-hidden transition-all">
                {/* Jendela Header Retro Klasik */}
                <div className="h-10 flex items-center justify-between border-b-2 border-black bg-gray-soft px-3 select-none">
                  <div className="flex items-center gap-2">
                    <WindowTrafficLights size="sm" />
                    <span className="text-xs font-mono font-black text-black ml-1">
                      siajar://simulasi-interaktif.app
                    </span>
                  </div>

                  {/* Tabs Pengalih Preview */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('mahasiswa')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                        activeTab === 'mahasiswa'
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black/30 hover:bg-gray-soft'
                      }`}
                    >
                      Mahasiswa
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dosen')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                        activeTab === 'dosen'
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black/30 hover:bg-gray-soft'
                      }`}
                    >
                      Dosen
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('langit')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                        activeTab === 'langit'
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black/30 hover:bg-gray-soft'
                      }`}
                    >
                      Langit Kampus
                    </button>
                  </div>
                </div>

                {/* Konten Tab Interaktif */}
                <div className="p-4 sm:p-5 bg-background min-h-[300px] flex flex-col justify-between">
                  {activeTab === 'mahasiswa' && (
                    <div className="space-y-3 animate-fadeIn">
                      {/* Kartu Profil Mahasiswa */}
                      <div className="p-3 border-2 border-black bg-white shadow-retro-sm rounded flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-black/60">SIMULASI MAHASISWA</div>
                          <div className="text-sm font-black text-black">Ahmad Fauzi • NIM 2024001</div>
                          <div className="text-xs font-medium text-black/80">Teknik Informatika • Semester 5</div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-black border border-black bg-emerald-200 text-black rounded">
                          AKTIF
                        </span>
                      </div>

                      {/* Baris Statistik Cepat */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-2.5 border-2 border-black bg-white shadow-retro-sm rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-black/70">IPK Kumulatif</span>
                            <TrendingUp className="h-3.5 w-3.5 text-black" />
                          </div>
                          <div className="text-2xl font-mono font-black text-black mt-1">3.92</div>
                          <div className="w-full bg-gray-soft h-1.5 border border-black mt-1.5 rounded-full overflow-hidden">
                            <div className="bg-black h-full w-[95%]" />
                          </div>
                        </div>

                        <div className="p-2.5 border-2 border-black bg-white shadow-retro-sm rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-black/70">Kehadiran</span>
                            <UserCheck className="h-3.5 w-3.5 text-black" />
                          </div>
                          <div className="text-2xl font-mono font-black text-black mt-1">98%</div>
                          <div className="w-full bg-gray-soft h-1.5 border border-black mt-1.5 rounded-full overflow-hidden">
                            <div className="bg-black h-full w-[98%]" />
                          </div>
                        </div>
                      </div>

                      {/* Kelas Aktif Hari Ini */}
                      <div className="p-3 border-2 border-black bg-white shadow-retro-sm rounded">
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-black">Kuliah Hari Ini (13:00 - 15:30)</span>
                          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Ruang Lab 304
                          </span>
                        </div>
                        <div className="text-sm font-black text-black">Pemrograman Berorientasi Objek</div>
                        <div className="text-xs text-black/70 mt-0.5 flex items-center gap-2">
                          <span>Dosen: Dr. Ir. Budi Santoso, M.T.</span>
                          <span>•</span>
                          <span>3 SKS</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'dosen' && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="p-3 border-2 border-black bg-white shadow-retro-sm rounded flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-black/60">PORTAL PENGAMPU KULIAH</div>
                          <div className="text-sm font-black text-black">Dr. Ir. Budi Santoso, M.T.</div>
                          <div className="text-xs font-medium text-black/80">NIDN 0012345678 • Dosen Tetap</div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-black border border-black bg-sky-200 text-black rounded">
                          DOSEN
                        </span>
                      </div>

                      <div className="p-3 border-2 border-black bg-white shadow-retro-sm rounded space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>Manajemen Presensi Kelas</span>
                          <span className="text-black/70">42 / 44 Mahasiswa Hadir</span>
                        </div>
                        <div className="w-full bg-gray-soft h-2 border border-black rounded-full overflow-hidden">
                          <div className="bg-black h-full w-[95%]" />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-black/75 pt-1">
                          <span>Status Sesi: Terbuka</span>
                          <span className="font-mono font-bold text-black">Kode OTP: 782-901</span>
                        </div>
                      </div>

                      <div className="p-2.5 border-2 border-black bg-white shadow-retro-sm rounded flex items-center justify-between text-xs font-bold">
                        <span>Penyerahan Tugas Modul 4</span>
                        <span className="px-2 py-0.5 bg-black text-white rounded text-[11px]">38 Siap Dinilai</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'langit' && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="p-3 border-2 border-black bg-white shadow-retro-sm rounded">
                        <div className="text-xs font-bold text-black/60">FITUR DINAMIS KHUSUS</div>
                        <div className="text-sm font-black text-black">Widget Langit & Jam Real-Time</div>
                        <p className="text-xs text-black/75 mt-1 leading-relaxed">
                          SIAJAR dilengkapi kanvas shader WebGL procedural yang merefleksikan suasana langit
                          kampus sesuai jam nyata — dari fajar keemasan, siang biru tropis, senja tembaga, hingga malam berbintang.
                        </p>
                      </div>

                      <div className="p-3 border-2 border-black bg-gradient-to-r from-sky-400 via-sky-200 to-amber-100 shadow-retro-sm rounded text-center">
                        <div className="font-mono font-black text-2xl text-black">12:00:00 WIB</div>
                        <div className="text-xs font-bold text-black mt-0.5">Senin, 19 Okt 2026 • Selamat Siang</div>
                        <div className="text-[10px] font-mono font-bold text-black/80 mt-1">
                          GLSL Shader Atmosphere Engine
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tombol Masuk di Bawah CRT */}
                  <div className="pt-2 border-t border-black/15 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-black/60">
                      SIAJAR v2.4 System Ready
                    </span>
                    <Link
                      href="/login"
                      className="px-3 py-1 border-2 border-black bg-white text-black font-black text-xs shadow-retro-sm hover:bg-black hover:text-white transition-all flex items-center gap-1"
                    >
                      <span>Coba Sekarang</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------- 3. GRID FITUR UNGGULAN -------------------- */}
        <section id="fitur" className="w-full border-y-2 border-black bg-retro-dither py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <span className="px-2.5 py-0.5 border-2 border-black bg-white text-xs font-mono font-black text-black shadow-retro-sm uppercase">
                KEMAMPUAN UTAMA
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-black mt-3">
                Empat Pilar Pembelajaran Modern
              </h2>
              <p className="text-xs sm:text-sm text-black/80 font-medium mt-2 leading-relaxed">
                Setiap modul dirancang untuk mempercepat administrasi akademik agar dosen dan mahasiswa dapat
                fokus penuh pada eksplorasi ilmu pengetahuan.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Presensi & Waktu */}
              <div className="border-2 border-black bg-white shadow-retro-md p-5 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div>
                  <div className="h-10 w-10 border-2 border-black bg-gray-soft flex items-center justify-center shadow-retro-sm mb-4">
                    <Clock className="h-5 w-5 text-black" />
                  </div>
                  <h3 className="text-lg font-heading font-black text-black mb-2">
                    Presensi Detik Nyata
                  </h3>
                  <p className="text-xs text-black/75 leading-relaxed">
                    Sistem absensi berbasis waktu server mikro-detik dengan validasi sesi instan, mencegah kecurangan
                    dan memudahkan rekapitulasi kehadiran per semester.
                  </p>
                </div>
                <div className="pt-4 border-t border-black/10 mt-4 text-[11px] font-mono font-bold text-black">
                  ✓ Akurat Hingga Detik
                </div>
              </div>

              {/* Card 2: Modul & Penugasan */}
              <div className="border-2 border-black bg-white shadow-retro-md p-5 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div>
                  <div className="h-10 w-10 border-2 border-black bg-gray-soft flex items-center justify-center shadow-retro-sm mb-4">
                    <BookOpen className="h-5 w-5 text-black" />
                  </div>
                  <h3 className="text-lg font-heading font-black text-black mb-2">
                    Materi & Tugas Terpadu
                  </h3>
                  <p className="text-xs text-black/75 leading-relaxed">
                    Unduh silabus, materi kuliah PDF/Word, dan kumpulkan penugasan langsung dari ruang kelas tanpa
                    harus berpindah ke aplikasi pihak ketiga.
                  </p>
                </div>
                <div className="pt-4 border-t border-black/10 mt-4 text-[11px] font-mono font-bold text-black">
                  ✓ Multi-Format Upload
                </div>
              </div>

              {/* Card 3: Rekapitulasi & Analitik Nilai */}
              <div className="border-2 border-black bg-white shadow-retro-md p-5 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div>
                  <div className="h-10 w-10 border-2 border-black bg-gray-soft flex items-center justify-center shadow-retro-sm mb-4">
                    <TrendingUp className="h-5 w-5 text-black" />
                  </div>
                  <h3 className="text-lg font-heading font-black text-black mb-2">
                    Transparansi IPK
                  </h3>
                  <p className="text-xs text-black/75 leading-relaxed">
                    Pantau grafik perkembangan indeks prestasi semester secara transparan lengkap dengan distribusi
                    nilai A, B, C, serta audit syarat kelulusan SKS.
                  </p>
                </div>
                <div className="pt-4 border-t border-black/10 mt-4 text-[11px] font-mono font-bold text-black">
                  ✓ Kalkulasi Otomatis
                </div>
              </div>

              {/* Card 4: Desain Retro Ergonomis */}
              <div className="border-2 border-black bg-white shadow-retro-md p-5 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div>
                  <div className="h-10 w-10 border-2 border-black bg-gray-soft flex items-center justify-center shadow-retro-sm mb-4">
                    <Laptop className="h-5 w-5 text-black" />
                  </div>
                  <h3 className="text-lg font-heading font-black text-black mb-2">
                    Visual Retro 1984
                  </h3>
                  <p className="text-xs text-black/75 leading-relaxed">
                    Terinspirasi dari antarmuka Macintosh klasik. Kontras tinggi dengan font hitam pekat yang nyaman di mata
                    bahkan saat belajar maraton berjam-jam.
                  </p>
                </div>
                <div className="pt-4 border-t border-black/10 mt-4 text-[11px] font-mono font-bold text-black">
                  ✓ Zero Eye Strain
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------- 4. RUANG PERAN SIVITAS KAMPUS -------------------- */}
        <section id="peran" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-2.5 py-0.5 border-2 border-black bg-white text-xs font-mono font-black text-black shadow-retro-sm uppercase">
              SATU SISTEM SEMUA PERAN
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-black mt-3">
              Dirancang untuk Seluruh Sivitas Akademika
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Peran 1: Mahasiswa */}
            <div className="border-2 border-black bg-white shadow-retro-md rounded-xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="inline-block px-2.5 py-0.5 border border-black bg-emerald-200 text-xs font-mono font-black text-black rounded mb-3">
                  MAHASISWA
                </div>
                <h3 className="text-xl font-heading font-black text-black mb-2">
                  Pusat Kendali Studi
                </h3>
                <ul className="space-y-2 text-xs text-black/80 font-medium">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Cek jadwal kuliah harian & ruangan</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Presensi mandiri secara real-time</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Unduh materi kuliah & submit tugas</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Pantau nilai KHS dan perkembangan IPK</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-black/10">
                <Link
                  href="/login"
                  className="w-full py-2 border-2 border-black bg-white text-black text-center font-bold text-xs shadow-retro-sm hover:bg-black hover:text-white transition-all block"
                >
                  Masuk sebagai Mahasiswa ↗
                </Link>
              </div>
            </div>

            {/* Peran 2: Dosen Pengampu */}
            <div className="border-2 border-black bg-white shadow-retro-md rounded-xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="inline-block px-2.5 py-0.5 border border-black bg-sky-200 text-xs font-mono font-black text-black rounded mb-3">
                  DOSEN PENGAMPU
                </div>
                <h3 className="text-xl font-heading font-black text-black mb-2">
                  Manajemen Kelas Efisien
                </h3>
                <ul className="space-y-2 text-xs text-black/80 font-medium">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Buka & tutup sesi presensi perkuliahan</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Unggah silabus dan bahan presentasi</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Beri nilai tugas dan ujian langsung di web</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Pantau keaktifan dan kehadiran mahasiswa</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-black/10">
                <Link
                  href="/login"
                  className="w-full py-2 border-2 border-black bg-white text-black text-center font-bold text-xs shadow-retro-sm hover:bg-black hover:text-white transition-all block"
                >
                  Masuk sebagai Dosen ↗
                </Link>
              </div>
            </div>

            {/* Peran 3: Kaprodi & Administrator */}
            <div className="border-2 border-black bg-white shadow-retro-md rounded-xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="inline-block px-2.5 py-0.5 border border-black bg-amber-200 text-xs font-mono font-black text-black rounded mb-3">
                  KAPRODI & ADMIN
                </div>
                <h3 className="text-xl font-heading font-black text-black mb-2">
                  Tata Kelola Akademik
                </h3>
                <ul className="space-y-2 text-xs text-black/80 font-medium">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Distribusi mata kuliah & alokasi dosen</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Monitoring kurikulum dan capaian prodi</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Verifikasi berkas & kelulusan semester</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
                    <span>Laporan akreditasi dan data statistik</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 mt-4 border-t border-black/10">
                <Link
                  href="/login"
                  className="w-full py-2 border-2 border-black bg-white text-black text-center font-bold text-xs shadow-retro-sm hover:bg-black hover:text-white transition-all block"
                >
                  Masuk sebagai Pengelola ↗
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------- 5. ALUR KULIAH 3 LANGKAH -------------------- */}
        <section id="alur" className="w-full border-t-2 border-black bg-gray-soft py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="px-2.5 py-0.5 border-2 border-black bg-white text-xs font-mono font-black text-black shadow-retro-sm uppercase">
                ALUR PERKULIAHAN
              </span>
              <h2 className="text-3xl font-heading font-black text-black mt-3">
                3 Langkah Cepat Memulai
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-5 border-2 border-black bg-white shadow-retro-md rounded-lg">
                <div className="text-2xl font-mono font-black text-black mb-2">01</div>
                <h4 className="text-base font-black text-black mb-1">Masuk dengan Akun Kampus</h4>
                <p className="text-xs text-black/75 leading-relaxed">
                  Gunakan NIM atau NIDN resmi yang telah terdaftar pada sistem single sign-on SIAJAR.
                </p>
              </div>

              <div className="p-5 border-2 border-black bg-white shadow-retro-md rounded-lg">
                <div className="text-2xl font-mono font-black text-black mb-2">02</div>
                <h4 className="text-base font-black text-black mb-1">Periksa Jadwal & Ruang</h4>
                <p className="text-xs text-black/75 leading-relaxed">
                  Buka beranda untuk melihat jadwal kuliah aktif hari ini beserta materi perkuliahan terkait.
                </p>
              </div>

              <div className="p-5 border-2 border-black bg-white shadow-retro-md rounded-lg">
                <div className="text-2xl font-mono font-black text-black mb-2">03</div>
                <h4 className="text-base font-black text-black mb-1">Presensi & Belajar</h4>
                <p className="text-xs text-black/75 leading-relaxed">
                  Lakukan absensi saat sesi dibuka dan kumpulkan tugas sebelum batas waktu berakhir.
                </p>
              </div>
            </div>

            {/* Banner Ajakan Masuk Terakhir */}
            <div className="mt-10 p-6 sm:p-8 border-2 border-black bg-black text-white shadow-retro-lg rounded-xl text-center space-y-4">
              <h3 className="text-2xl sm:text-3xl font-heading font-black">
                Siap Memulai Perkuliahan Hari Ini?
              </h3>
              <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto leading-relaxed">
                Akses portal SIAJAR sekarang menggunakan peramban favorit Anda di laptop maupun perangkat ponsel.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="px-6 py-3 border-2 border-white bg-white text-black font-black text-sm shadow-[3px_3px_0px_#ffffff] hover:bg-neutral-200 active:translate-x-0.5 active:translate-y-0.5 transition-all inline-flex items-center gap-2"
                >
                  <span>Masuk ke Halaman Login</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------- 6. FOOTER / SYSTEM STATUS BAR -------------------- */}
      <footer className="w-full border-t-2 border-black bg-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono font-bold text-black">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span>RuangKampus System 7.1 • Status: Online & Sinkron</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:underline underline-offset-4">
              Halaman Login ↗
            </Link>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowTourModal(true)}
              className="hover:underline underline-offset-4"
            >
              Panduan Cepat
            </button>
            <span>•</span>
            <span className="text-black/60">© 2026 Universitas</span>
          </div>
        </div>
      </footer>

      {/* -------------------- 7. INTERACTIVE QUICK TOUR MODAL -------------------- */}
      {showTourModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowTourModal(false)}
        >
          <div
            className="w-full max-w-lg border-2 border-black bg-white shadow-retro-window rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-black bg-gray-soft">
              <div className="flex items-center gap-1.5">
                <WindowTrafficLights size="sm" />
                <span className="font-mono text-xs font-black text-black ml-1.5">
                  ruangkampus://panduan-cepat.doc
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTourModal(false)}
                className="hover:opacity-75 focus:outline-none p-1 cursor-pointer"
                aria-label="Tutup panduan"
              >
                <X className="h-4 w-4 text-black" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xl font-heading font-black text-black">
                  Selamat Datang di RuangKampus
                </h4>
                <p className="text-xs text-black/75 mt-1 leading-relaxed">
                  Berikut adalah hal-hal penting yang perlu Anda ketahui sebelum masuk ke portal akademik:
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="p-3 border-2 border-black bg-background rounded flex items-start gap-3">
                  <span className="h-6 w-6 rounded border border-black bg-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <div className="text-xs font-black text-black">Kredensial Resmi Akun</div>
                    <div className="text-[11px] text-black/75 leading-tight mt-0.5">
                      Mahasiswa masuk dengan NIM dan password yang diberikan prodi. Dosen masuk menggunakan NIDN.
                    </div>
                  </div>
                </div>

                <div className="p-3 border-2 border-black bg-background rounded flex items-start gap-3">
                  <span className="h-6 w-6 rounded border border-black bg-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <div className="text-xs font-black text-black">Presensi Otomatis & Terjadwal</div>
                    <div className="text-[11px] text-black/75 leading-tight mt-0.5">
                      Tombol presensi hanya aktif selama jam sesi perkuliahan berlangsung. Pastikan Anda hadir tepat waktu.
                    </div>
                  </div>
                </div>

                <div className="p-3 border-2 border-black bg-background rounded flex items-start gap-3">
                  <span className="h-6 w-6 rounded border border-black bg-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <div className="text-xs font-black text-black">Widget Langit & Jam Real-Time</div>
                    <div className="text-[11px] text-black/75 leading-tight mt-0.5">
                      Di sisi kanan dashboard terdapat widget jam dan langit dinamis berbasis WebGL GLSL shader yang menyatu dengan waktu lokal.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row gap-2">
                <Link
                  href="/login"
                  className="flex-1 py-2.5 border-2 border-black bg-black text-white text-center font-black text-xs shadow-retro hover:bg-white hover:text-black transition-all"
                >
                  Lanjut ke Halaman Login ↗
                </Link>
                <button
                  type="button"
                  onClick={() => setShowTourModal(false)}
                  className="px-4 py-2.5 border-2 border-black bg-white text-black font-bold text-xs shadow-retro hover:bg-gray-soft transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
