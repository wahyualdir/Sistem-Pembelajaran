'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CalendarDays,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  Layers,
  ClipboardList,
  ArrowRight,
  FileCheck,
  QrCode,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UirLogo3D } from '@/components/retro/uir-logo-3d';
import { ActionBanner } from '@/components/home/action-banner';
import { TodaySchedule } from '@/components/home/today-schedule';
import { ActiveClassesGrid } from '@/components/home/active-classes-grid';
import { TaRightPanel } from '@/components/home/ta-right-panel';
import { getNextUpcomingCourse } from '@/modules/academic/home-schedule-utils';
import { usePortalLayout } from '@/app/(portal)/portal-shell';
import type {
  HomeBannerData,
  TodayScheduleItem,
  ActiveClassItem,
  AgendaItem,
} from '@/modules/academic/home-actions';

export interface ReviewItem {
  assignment_id: string;
  class_id: string;
  class_title: string;
  title: string;
  total: number;
  pending: number;
}

const TA_CATEGORIES = [
  'Semua',
  'Kelas Asistensi',
  'Koreksi Tugas',
  'Presensi Mahasiswa',
  'Jadwal Praktikum',
  'Materi Asisten',
];

export interface TaDashboardClientProps {
  classes: number;
  items: ReviewItem[];
  todaySchedule?: TodayScheduleItem[];
  activeClasses?: ActiveClassItem[];
  agendaItems?: AgendaItem[];
}

export function TaDashboardClient({
  classes,
  items = [],
  todaySchedule = [],
  activeClasses = [],
  agendaItems = [],
}: TaDashboardClientProps) {
  const totalPending = items.reduce((sum, it) => sum + it.pending, 0);

  // Banner data disesuaikan dengan antrean penilaian asisten
  const bannerData: HomeBannerData = {
    primary:
      totalPending > 0
        ? {
            id: 'banner-ta-pending',
            priority: 2,
            category: 'ASSIGNMENT',
            title: `${totalPending} Submisi Mahasiswa Siap Direview Asisten`,
            subtitle: `Terdapat ${items.length} tugas asistensi yang siap ditinjau dan diberikan umpan balik.`,
            buttonLabel: 'Mulai Review Tugas',
            buttonHref: `/classes/${items[0]?.class_id || ''}/assignments/${items[0]?.assignment_id || ''}`,
            badge: 'TUGAS ASISTEN',
          }
        : {
            id: 'banner-ta-clean',
            priority: 5,
            category: 'IDLE',
            title: 'Seluruh Peninjauan Tugas Selesai',
            subtitle: 'Tidak ada tugas mahasiswa yang tertunda di rombel asistensi Anda.',
            buttonLabel: 'Lihat Kelas Asistensi',
            buttonHref: '/classes',
            badge: 'TUNTAS',
          },
    others: [],
    totalActive: totalPending > 0 ? 1 : 0,
    serverTime: new Date().toISOString(),
  };

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [courses] = useState<ActiveClassItem[]>(activeClasses);

  const { isRightDrawerOpen, setIsRightDrawerOpen, setHasRightPanel } = usePortalLayout();
  const [selectedCourse, setSelectedCourse] = useState<ActiveClassItem | undefined>(() => {
    if (activeClasses && activeClasses.length > 0) {
      const nearest = getNextUpcomingCourse(activeClasses, new Date());
      return nearest?.course || activeClasses[0];
    }
    return undefined;
  });
  const [rightPanelTab, setRightPanelTab] = useState<'hari-ini' | 'detail-kelas'>('hari-ini');

  useEffect(() => {
    setHasRightPanel(true);
    return () => setHasRightPanel(false);
  }, [setHasRightPanel]);

  const handleSelectCourse = (course: ActiveClassItem) => {
    setSelectedCourse(course);
    setRightPanelTab('detail-kelas');
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsRightDrawerOpen(true);
    }
  };

  // Filter bagian yang tampil berdasarkan chip kategori
  const showAll = selectedCategory === 'Semua';
  const showKelasSaya = showAll || selectedCategory === 'Kelas Asistensi';
  const showKoreksi = showAll || selectedCategory === 'Koreksi Tugas';
  const showPresensi = showAll || selectedCategory === 'Presensi Mahasiswa';
  const showJadwal = showAll || selectedCategory === 'Jadwal Praktikum';
  const showMateri = showAll || selectedCategory === 'Materi Asisten';

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)]">
      {/* ========================================================= */}
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA ASISTEN                 */}
      {/* ========================================================= */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA: RUANG ASISTEN DOSEN & LAB */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1 border-b-2 border-black/15 pb-4">
            <div className="space-y-1.5">
              {/* Kicker / Context Tag */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md border border-black/20 bg-black/5 text-[11px] font-sans font-bold uppercase tracking-wider text-black">
                  Portal Asisten Akademik
                </span>
                <span className="text-black/30 font-bold">•</span>
                <span className="text-[11px] font-sans font-bold text-black/70 uppercase">
                  Ganjil 2026/2027
                </span>
              </div>

              {/* Baris Judul Utama */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg border-2 border-ink bg-surface shadow-xs flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-ink" />
                </div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-ink leading-none">
                  Ruang Asisten Dosen & Laboratorium
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-ink/80 font-bold leading-relaxed pt-0.5">
                Antrean peninjauan tugas mahasiswa, pemantauan praktikum lab, dan asistensi perkuliahan sesuai delegasi dosen.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white border-2 border-black text-black shadow-retro-sm">
                {classes} KELAS ASISTENSI
              </span>
              <Link
                href="/classes"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 font-black text-xs sm:text-sm transition-all shadow-retro cursor-pointer"
              >
                <Layers className="h-4 w-4" />
                <span>Buka Kelas Asistensi</span>
              </Link>
            </div>
          </div>

          {/* ROW 1: CATEGORIES PILLS (FILTER CHIP) */}
          <section aria-label="Kategori Asisten" className="space-y-2.5 sm:space-y-3">
            <h2 className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wider text-gray-dark">
              Categories
            </h2>
            <div className="flex flex-wrap items-center gap-2 pb-1.5">
              {TA_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold tracking-tight shrink-0 transition-all focus-visible:outline-none cursor-pointer',
                      isActive
                        ? 'border-2 border-ink bg-ink text-white shadow-retro scale-[1.02]'
                        : 'border-2 border-ink bg-surface text-ink shadow-retro hover:bg-gray-soft hover:-translate-y-0.5'
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 1: BANNER AKSI PRIORITAS */}
          <ActionBanner initialData={bannerData} />

          {/* 3 KARTU METRIK RINGKASAN ASISTEN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-black shadow-retro-sm">
                <Layers className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Kelas Terdaftar</p>
                <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{classes}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-black shadow-retro-sm">
                <Clock className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Tugas Perlu Review</p>
                <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{items.length}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-black shadow-retro-sm">
                <FileCheck className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Total Submisi Pending</p>
                <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{totalPending}</p>
              </div>
            </div>
          </div>

          {/* GRID 2 KOLOM: JADWAL ASISTENSI & ANTREAN PENINJAUAN TUGAS */}
          {(showAll || showJadwal || showPresensi || showKoreksi) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
              {/* Kolom Kiri: Jadwal Asistensi & Lab Hari Ini */}
              {(showAll || showJadwal || showPresensi) && (
                <div className="space-y-4">
                  <TodaySchedule items={todaySchedule} />
                </div>
              )}

              {/* Kolom Kanan: Antrean Review Submisi */}
              {(showAll || showKoreksi) && (
                <div className="space-y-4">
                  <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
                    <div className="p-4 sm:p-5 border-b-2 border-black bg-gray-soft flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
                        <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
                        <h2 className="font-heading font-black text-sm sm:text-base text-black flex items-center gap-2 ml-1">
                          <ClipboardList className="h-4 w-4 text-black" />
                          <span>Daftar Menunggu Penilaian Asisten</span>
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-black text-black px-2.5 py-0.5 rounded border border-black bg-white shadow-retro-sm">
                        {totalPending} Submisi
                      </span>
                    </div>

                    <div className="p-4 sm:p-5">
                      {classes === 0 ? (
                        <div className="p-6 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 space-y-2">
                          <Users className="h-7 w-7 text-black mx-auto" />
                          <p className="text-sm font-heading font-black text-black">Belum Ada Penugasan Asisten</p>
                          <p className="text-xs text-black/80 font-bold max-w-sm mx-auto">
                            Anda belum ditugaskan sebagai asisten di kelas mana pun. Dosen pengampu menugaskan asisten langsung dari halaman manajemen kelasnya.
                          </p>
                        </div>
                      ) : items.length === 0 ? (
                        <div className="p-6 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 space-y-2">
                          <CheckCircle2 className="h-7 w-7 text-black mx-auto" />
                          <p className="text-sm font-heading font-black text-black">Seluruh Tugas Telah Direview!</p>
                          <p className="text-xs text-black/80 font-bold max-w-sm mx-auto">
                            Tidak ada berkas tugas mahasiswa yang tertunda untuk kelas asistensi Anda.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.slice(0, 5).map((t) => (
                            <Link
                              key={t.assignment_id}
                              href={`/classes/${t.class_id}/assignments/${t.assignment_id}`}
                              className="group block p-3.5 rounded-xl border-2 border-black bg-white hover:bg-gray-soft/50 shadow-retro transition-all focus-visible:outline-none cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded border border-black bg-black text-white text-[11px] font-mono font-black">
                                      {t.class_title}
                                    </span>
                                  </div>
                                  <h3 className="font-heading font-black text-sm text-black group-hover:underline underline-offset-4 line-clamp-1">
                                    {t.title}
                                  </h3>
                                </div>
                                <span className="px-2 py-0.5 rounded border border-black bg-gray-soft text-black font-mono font-bold text-xs shrink-0 shadow-retro-sm">
                                  {t.pending}/{t.total} Belum Dinilai
                                </span>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-black/10 flex items-center justify-between text-xs font-bold text-black">
                                <span className="text-black/60">Beri masukan & feedback</span>
                                <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                  <span>Review Berkas</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION: KELAS ASISTENSI & PRAKTIKUM */}
          {(showAll || showKelasSaya || showPresensi || showMateri) && (
            <div>
              <ActiveClassesGrid
                courses={courses}
                selectedCourse={selectedCourse}
                onSelectCourse={handleSelectCourse}
                title="Kelas Asistensi & Praktikum"
                emptyTitle="Belum Ada Penugasan Asisten"
                emptySubtitle="Anda belum ditugaskan sebagai asisten di kelas mana pun. Dosen pengampu menugaskan asisten langsung dari halaman manajemen kelasnya."
                emptyActionLabel="Lihat Daftar Kelas"
                progressLabel="Progres Praktikum"
              />
            </div>
          )}

          {/* SECTION SPESIFIK: PANDUAN MATERI & PRAKTIKUM (Tampil saat kategori Materi Asisten dipilih) */}
          {(showMateri || showAll) && (
            <section aria-label="Materi Praktikum & Modul Asistensi" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg border-2 border-ink bg-gray-soft text-black shadow-xs">
                    <BookOpen className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-ink">
                      Modul Praktikum & Panduan Asistensi
                    </h2>
                    <p className="text-xs text-gray-dark font-medium">
                      Akses lembar kerja praktikum, panduan laboratorium, dan kunci jawaban tugas sesuai wewenang delegasi dosen.
                    </p>
                  </div>
                </div>
                <Link
                  href="/classes"
                  className="text-xs sm:text-sm font-bold text-black hover:underline transition-colors shrink-0"
                >
                  Buka Modul Kelas &rarr;
                </Link>
              </div>

              <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-ink">
                    Koordinasi Asistensi dan Penilaian Praktikum
                  </h3>
                  <p className="text-xs text-gray-dark font-bold leading-relaxed">
                    Pastikan seluruh mahasiswa telah mengumpulkan laporan praktikum sebelum batas akhir dan berikan nilai masukan secara konsisten.
                  </p>
                </div>
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-ink bg-ink text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all shrink-0 min-h-[44px]"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Buka Berkas Modul</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL (BASELINE 480px)   */}
      {/* ========================================================= */}
      {/* Mode Desktop (>= 1280px / xl): Sticky dengan scroll internal sendiri */}
      <aside
        aria-label="Panel Ringkasan & Detail Asisten"
        className="hidden xl:flex w-right-panel shrink-0 border-l-2 border-retro-border bg-retro-bg p-5 sm:p-6 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        {/* KARTU LOGO INTERAKTIF 3D ROTASI BEBAS */}
        <div className="shrink-0 w-full">
          <UirLogo3D />
        </div>

        {/* PENGALIH DUA KONDISI: "Hari Ini" & "Detail Kelas" */}
        <TaRightPanel
          selectedCourse={selectedCourse}
          courses={courses}
          onSelectCourse={setSelectedCourse}
          classesCount={classes}
          pendingReviewsCount={items.length}
          totalPendingSubmissions={totalPending}
          agenda={agendaItems}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
        />
      </aside>

      {/* Mode Slide-over Drawer (< 1280px / max-xl): Panel geser dari kanan */}
      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail Asisten"
          className="fixed inset-0 z-50 flex justify-end xl:hidden"
        >
          {/* Backdrop Overlay */}
          <div
            aria-hidden="true"
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-retro-bg border-l-2 border-retro-border h-[100dvh] flex flex-col shadow-2xl z-10 animate-slide-in-right pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            {/* Header Drawer */}
            <div className="flex h-header items-center justify-between px-6 border-b-2 border-retro-border bg-gray-soft shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-base text-foreground tracking-tight">
                  Ringkasan Asisten
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRightDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-retro-border bg-retro-surface text-foreground hover:bg-gray-soft shadow-retro-sm active:translate-y-0.5 transition-all focus-visible:outline-none cursor-pointer"
                title="Tutup Panel (Esc)"
                aria-label="Tutup Panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Konten Scrollable Internal */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5 pb-24">
              <div className="shrink-0 w-full">
                <UirLogo3D />
              </div>
              <TaRightPanel
                selectedCourse={selectedCourse}
                courses={courses}
                onSelectCourse={setSelectedCourse}
                classesCount={classes}
                pendingReviewsCount={items.length}
                totalPendingSubmissions={totalPending}
                agenda={agendaItems}
                activeTab={rightPanelTab}
                onTabChange={setRightPanelTab}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
