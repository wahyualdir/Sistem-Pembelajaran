'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  Layers,
  ClipboardList,
  ArrowRight,
  FileCheck,
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

  const showAll = selectedCategory === 'Semua';
  const showKelasSaya = showAll || selectedCategory === 'Kelas Asistensi';
  const showKoreksi = showAll || selectedCategory === 'Koreksi Tugas';
  const showPresensi = showAll || selectedCategory === 'Presensi Mahasiswa';
  const showJadwal = showAll || selectedCategory === 'Jadwal Praktikum';
  const showMateri = showAll || selectedCategory === 'Materi Asisten';

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)]">
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA ASISTEN */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA & FILTER TERPADU ASISTEN */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-[#D6D3CB]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#853827]">
                <span>PORTAL ASISTEN AKADEMIK</span>
                <span className="text-[#B8B1A5]">•</span>
                <span className="text-[#57534E]">Semester Ganjil 2026/2027</span>
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-[#1C1917]">
                Ruang Asisten Dosen &amp; Laboratorium
              </h1>
            </div>

            <nav aria-label="Kategori Asisten" className="flex flex-wrap items-center gap-1.5">
              {TA_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs sm:text-sm font-sans transition-colors focus-visible:outline-none cursor-pointer',
                      isActive
                        ? 'bg-[#1C1917] text-white font-semibold'
                        : 'bg-[#ECE9D8]/70 text-[#44403C] font-medium hover:bg-[#ECE9D8] hover:text-[#1C1917]'
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* BANNER AKSI PRIORITAS */}
          <ActionBanner initialData={bannerData} />

          {/* 3 KARTU METRIK RINGKASAN ASISTEN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] text-[#C2553A]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Kelas Terdaftar</p>
                <p className="font-heading font-bold text-2xl text-[#1C1917] leading-tight">{classes}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] text-[#C2553A]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Tugas Perlu Review</p>
                <p className="font-heading font-bold text-2xl text-[#1C1917] leading-tight">{items.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] text-[#C2553A]">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Total Submisi Pending</p>
                <p className="font-heading font-bold text-2xl text-[#1C1917] leading-tight">{totalPending}</p>
              </div>
            </div>
          </div>

          {/* GRID 2 KOLOM: JADWAL ASISTENSI & ANTREAN PENINJAUAN TUGAS */}
          {(showAll || showJadwal || showPresensi || showKoreksi) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
              {(showAll || showJadwal || showPresensi) && (
                <div className="space-y-4">
                  <TodaySchedule items={todaySchedule} />
                </div>
              )}

              {(showAll || showKoreksi) && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] overflow-hidden">
                    <div className="p-4 border-b border-[#E8E5DE] bg-[#FAF8F5] flex items-center justify-between">
                      <h2 className="font-heading font-bold text-sm sm:text-base text-[#1C1917] flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-[#C2553A]" />
                        <span>Daftar Menunggu Penilaian Asisten</span>
                      </h2>
                      <span className="text-xs font-mono font-bold text-[#853827] px-2.5 py-0.5 rounded bg-[#FFFFFF] border border-[#D6D3CB]">
                        {totalPending} Submisi
                      </span>
                    </div>

                    <div className="p-4">
                      {classes === 0 ? (
                        <div className="p-6 text-center rounded-xl border border-dashed border-[#D6D3CB] bg-[#FAF8F5] space-y-2">
                          <Users className="h-7 w-7 text-[#7A756D] mx-auto" />
                          <p className="text-sm font-heading font-bold text-[#1C1917]">Belum Ada Penugasan Asisten</p>
                          <p className="text-xs text-[#57534E] max-w-sm mx-auto">
                            Anda belum ditugaskan sebagai asisten di kelas mana pun. Dosen pengampu menugaskan asisten langsung dari halaman manajemen kelasnya.
                          </p>
                        </div>
                      ) : items.length === 0 ? (
                        <div className="p-6 text-center rounded-xl border border-dashed border-[#D6D3CB] bg-[#FAF8F5] space-y-2">
                          <CheckCircle2 className="h-7 w-7 text-[#059669] mx-auto" />
                          <p className="text-sm font-heading font-bold text-[#1C1917]">Seluruh Tugas Telah Direview</p>
                          <p className="text-xs text-[#57534E] max-w-sm mx-auto">
                            Tidak ada berkas tugas mahasiswa yang tertunda untuk kelas asistensi Anda.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.slice(0, 5).map((t) => (
                            <Link
                              key={t.assignment_id}
                              href={`/classes/${t.class_id}/assignments/${t.assignment_id}`}
                              className="group block p-3.5 rounded-xl border border-[#D6D3CB] hover:border-[#1C1917] bg-[#FFFFFF] transition-colors cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                  <span className="inline-block px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E8E5DE] text-[#853827] text-[11px] font-mono font-bold">
                                    {t.class_title}
                                  </span>
                                  <h3 className="font-heading font-bold text-sm text-[#1C1917] group-hover:text-[#C2553A] line-clamp-1">
                                    {t.title}
                                  </h3>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-[#ECE9D8] text-[#1C1917] font-mono font-bold text-xs shrink-0">
                                  {t.pending}/{t.total} Belum Dinilai
                                </span>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-[#E8E5DE] flex items-center justify-between text-xs font-semibold text-[#57534E]">
                                <span>Beri masukan &amp; umpan balik</span>
                                <div className="flex items-center gap-1 text-[#C2553A]">
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

          {/* SECTION SPESIFIK: PANDUAN MATERI & PRAKTIKUM */}
          {(showMateri || showAll) && (
            <section aria-label="Materi Praktikum & Modul Asistensi" className="space-y-3">
              <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#1C1917]">
                    Modul Praktikum &amp; Panduan Asistensi
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Akses lembar kerja praktikum, panduan laboratorium, dan kunci jawaban tugas sesuai wewenang delegasi dosen.
                  </p>
                </div>
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C1917] text-white hover:bg-[#C2553A] text-xs font-semibold transition-colors shrink-0"
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

      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL */}
      <aside
        aria-label="Panel Ringkasan & Detail Asisten"
        className="hidden xl:flex w-right-panel shrink-0 border-l border-[#D6D3CB] bg-[#FAF8F5] p-5 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
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

        <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
          <UirLogo3D />
        </div>
      </aside>

      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail Asisten"
          className="fixed inset-0 z-50 flex justify-end xl:hidden"
        >
          <div
            aria-hidden="true"
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-[#FAF8F5] border-l border-[#D6D3CB] h-[100dvh] flex flex-col shadow-2xl z-10 animate-slide-in-right">
            <div className="flex h-header items-center justify-between px-6 border-b border-[#D6D3CB] bg-[#ECE9D8] shrink-0">
              <span className="font-heading font-bold text-base text-[#1C1917] tracking-tight">
                Ringkasan Asisten
              </span>
              <button
                type="button"
                onClick={() => setIsRightDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6D3CB] bg-[#FFFFFF] text-[#1C1917] cursor-pointer"
                title="Tutup Panel (Esc)"
                aria-label="Tutup Panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 pb-24">
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
              <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
                <UirLogo3D />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
