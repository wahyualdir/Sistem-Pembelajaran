'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UirLogo3D } from '@/components/retro/uir-logo-3d';
import { BERANDA_CHIPS } from '@/lib/config/menu-config';
import { ActionBanner } from '@/components/home/action-banner';
import { NearestDeadlines } from '@/components/home/nearest-deadlines';
import { TodaySchedule } from '@/components/home/today-schedule';
import { ActiveClassesGrid } from '@/components/home/active-classes-grid';
import { RightPanelSwitcher } from '@/components/home/right-panel-switcher';
import { getNextUpcomingCourse } from '@/modules/academic/home-schedule-utils';
import { usePortalLayout } from '@/app/(portal)/portal-shell';
import { ambilMateriTerakhirDibukaAction } from '@/features/materi-tugas/progres-actions';
import {
  type HomeBannerData,
  type HomeDeadlineItem,
  type TodayScheduleItem,
  type ActiveClassItem,
  type HomeSummaryData,
  type AgendaItem,
  getHomeBannerAction,
} from '@/modules/academic/home-actions';
import { StudentAcademicStatusCard } from '@/components/home/student-academic-status-card';
import { SemesterWeave } from '@/components/home/semester-weave';
import { DailyPriorityCard } from '@/components/home/daily-priority-card';
import { KartuAktivitasDashboard } from '@/components/aktivitas/kartu-aktivitas-dashboard';
import type { ItemAktivitasHarian } from '@/lib/aktivitas';
import type { DailyPriorityItem } from '@/lib/akademik/daily-priorities';
import type { StudentRiskEvaluation } from '@/modules/early-warning/types';
import type { SemesterWeaveData } from '@/lib/akademik/semester-weave';

const RECOMMENDED_MATERIALS = [
  {
    id: 'mat-1',
    title: 'Modul 07: REST API & Auth Supabase',
    course: 'Pemrograman Web Lanjut',
    type: 'Modul Kuliah',
    badgeColor: 'bg-primary',
    accent: 'primary',
  },
  {
    id: 'mat-2',
    title: 'Kuis Evaluasi Algoritma Greedy',
    course: 'Struktur Data & Algoritma',
    type: 'Kuis Interaktif',
    badgeColor: 'bg-gray-dark',
    accent: 'ink',
  },
  {
    id: 'mat-3',
    title: 'Software Architecture Patterns',
    course: 'Rekayasa Perangkat Lunak',
    type: 'Buku Referensi',
    badgeColor: 'bg-ink',
    accent: 'ink',
  },
  {
    id: 'mat-4',
    title: 'Praktikum: Deep Learning Pipeline',
    course: 'Kecerdasan Buatan',
    type: 'Tugas Praktikum',
    badgeColor: 'bg-gray-soft',
    accent: 'gray',
  },
];

const CATEGORIES = [...BERANDA_CHIPS];

export interface StudentDashboardClientProps {
  bannerData?: HomeBannerData;
  deadlines?: HomeDeadlineItem[];
  todaySchedule?: TodayScheduleItem[];
  activeClasses?: ActiveClassItem[];
  summaryData?: HomeSummaryData;
  agendaItems?: AgendaItem[];
  deadlineItems?: Array<{ assignment_id: string; class_id: string; class_title: string; title: string; due_at: string }>;
  academicStatus?: StudentRiskEvaluation[];
  dailyPriorities?: DailyPriorityItem[];
  aktivitas?: ItemAktivitasHarian[];
  semesterWeave?: SemesterWeaveData | null;
}

export function StudentDashboardClient({
  bannerData,
  deadlines = [],
  todaySchedule = [],
  activeClasses = [],
  summaryData,
  agendaItems = [],
  academicStatus = [],
  dailyPriorities = [],
  aktivitas = [],
  semesterWeave = null,
}: StudentDashboardClientProps) {
  const currentBannerData: HomeBannerData = bannerData || {
    primary: {
      id: 'banner-welcome',
      priority: 5,
      category: 'IDLE',
      title: 'Selamat Datang di SIAJAR',
      subtitle: 'Akun baru Anda siap digunakan. Buka menu Kelas Saya untuk mulai mendaftar ke kelas perkuliahan dosen Anda.',
      buttonLabel: 'Buka Kelas Saya',
      buttonHref: '/classes',
      badge: 'AKUN BARU',
    },
    others: [],
    totalActive: 0,
    serverTime: new Date().toISOString(),
  };

  const currentSummary: HomeSummaryData = summaryData || {
    semesterStatus: 'Mahasiswa Baru',
    semesterLabel: 'Semester Ganjil 2026/2027',
    averageAttendance: '0%',
    attendanceQualified: false,
    ipk: '0.00',
    studyStreakDays: 0,
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
  const [materiTerakhir, setMateriTerakhir] = useState<{
    materi: { id: string; judul: string; pathFile: string; deskripsi?: string };
    kelas: { kodeMataKuliah: string; namaMataKuliah: string; kode: string };
    progres: { selesai: boolean; terakhirDibuka: string };
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    ambilMateriTerakhirDibukaAction().then((res) => {
      if (isMounted && res.success && res.data) {
        setMateriTerakhir(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
  const showKelasSaya = showAll || selectedCategory === 'Kelas Saya';
  const showTugasKuis = showAll || selectedCategory === 'Tugas & Kuis';
  const showUjian = showAll || selectedCategory === 'Ujian';
  const showPresensi = showAll || selectedCategory === 'Presensi';
  const showJadwal = showAll || selectedCategory === 'Jadwal';
  const showNilai = showAll || selectedCategory === 'Nilai';

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)]">
      {/* ========================================================= */}
      {/* 1. BAGIAN TENGAH: "HARI INI + KELAS SAYA"                 */}
      {/* ========================================================= */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA & FILTER TERPADU TEL-U */}
          <div className="space-y-3.5 pb-3.5 border-b border-[#E2E3E4]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#9F1521]">
                  <span className="uppercase tracking-wider">Portal Akademik Mahasiswa</span>
                  <span className="text-[#D0D6DD]">•</span>
                  <span className="text-[#58595B] font-normal">
                    {currentSummary.semesterLabel || 'Semester Ganjil 2026/2027'}
                  </span>
                </div>
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-[#111111] leading-tight">
                  Ruang Pembelajaran Mahasiswa
                </h1>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <span className="px-3 py-1 rounded-full bg-[#FEF2F0] text-[#9F1521] border border-[#FDDDD7] text-xs font-bold">
                  {courses.length} Mata Kuliah Aktif
                </span>
              </div>
            </div>

            {/* Bilah Kategori 1 Baris Utuh */}
            <nav
              aria-label="Kategori Perkuliahan"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 rounded-xl bg-[#FFFFFF] border border-[#E2E3E4] w-full sm:w-fit max-w-full"
            >
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-lg text-xs font-sans transition-all focus-visible:outline-none cursor-pointer shrink-0 whitespace-nowrap',
                      isActive
                        ? 'bg-[#9F1521] text-white font-bold'
                        : 'text-[#58595B] font-medium hover:bg-[#F3F3F4] hover:text-[#111111]'
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* SECTION 1: BANNER AKSI */}
          <ActionBanner
            initialData={currentBannerData}
            onRefresh={async () => getHomeBannerAction()}
          />

          {/* ZONA 1: JADWAL HARI INI & TENGGAT TERDEKAT */}
          {(showAll || showPresensi || showJadwal || showTugasKuis || showUjian) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
              {(showAll || showPresensi || showJadwal) && (
                <div className="space-y-4">
                  <TodaySchedule items={todaySchedule} />
                </div>
              )}

              {(showAll || showTugasKuis || showUjian) && (
                <div className="space-y-4">
                  <NearestDeadlines initialItems={deadlines} />
                </div>
              )}
            </div>
          )}

          {/* PRIORITAS HARIAN */}
          {!showAll && (showKelasSaya || showTugasKuis) && (
            <DailyPriorityCard initialItems={dailyPriorities} />
          )}

          {/* SECTION: KARTU LANJUTKAN BELAJAR */}
          {materiTerakhir && (showAll || showKelasSaya || showTugasKuis) && (
            <section aria-label="Lanjutkan Belajar" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-[#111111] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#9F1521] inline-block" />
                  <span>Lanjutkan Belajar</span>
                </h2>
                <Link
                  href="/mahasiswa/tugas"
                  className="text-xs font-bold text-[#9F1521] hover:text-[#111111] transition-colors flex items-center gap-1 group"
                >
                  <span>Lihat Semua Materi</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FEF2F0] text-[#9F1521] border border-[#FDDDD7]">
                      {materiTerakhir.kelas.kode}
                    </span>
                    <span className="text-xs font-normal text-[#58595B] truncate">
                      {materiTerakhir.kelas.namaMataKuliah}
                    </span>
                    {materiTerakhir.progres.selesai ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3F3F4] text-[#059669]">
                        <CheckCircle2 className="h-3 w-3 text-[#059669]" />
                        Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2F0] text-[#9F1521]">
                        <Clock className="h-3 w-3 text-[#9F1521]" />
                        Sedang Dipelajari
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#111111] line-clamp-1">
                    {materiTerakhir.materi.judul}
                  </h3>

                  <p suppressHydrationWarning className="text-xs text-[#808285] font-normal">
                    Terakhir dibuka:{' '}
                    {new Date(materiTerakhir.progres.terakhirDibuka).toLocaleDateString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <Link
                  href="/mahasiswa/tugas"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#9F1521] text-white hover:bg-[#8F131E] text-xs sm:text-sm font-bold transition-colors shrink-0"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Buka Materi</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          )}

          {/* SECTION: KELAS SAYA / KELAS AKTIF */}
          {(showAll || showKelasSaya || showNilai || showPresensi) && (
            <div>
              <ActiveClassesGrid
                courses={courses}
                selectedCourse={selectedCourse}
                onSelectCourse={handleSelectCourse}
              />
            </div>
          )}

          {/* PERINGATAN RISIKO AKADEMIK / KAIN SEMESTER */}
          {semesterWeave ? (
            <SemesterWeave
              data={semesterWeave}
              academicEvaluations={academicStatus}
            />
          ) : (
            <StudentAcademicStatusCard evaluations={academicStatus} />
          )}

          {/* GRAFIK KONTRIBUSI BELAJAR MAHASISWA (26 MINGGU) */}
          {(showAll || showKelasSaya || showTugasKuis) && (
            <KartuAktivitasDashboard
              data={aktivitas}
              judul="Grafik Kontribusi Belajar (26 Minggu)"
              deskripsi="Aktivitas pengumpulan tugas, kuis CBT, presensi kuliah, dan diskusi Anda selama 6 bulan terakhir."
              role="mahasiswa"
            />
          )}

          {/* SECTION: RINGKASAN PRESENSI PEMBELAJARAN */}
          {showPresensi && !showAll && (
            <section aria-label="Presensi Pembelajaran" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-[#111111]">
                    Presensi &amp; Kehadiran Perkuliahan
                  </h2>
                  <p className="text-xs sm:text-sm text-[#58595B] font-normal">
                    Pantau kehadiran real-time, lakukan check-in GPS/QR, dan pastikan batas syarat UAS (minimal 75%).
                  </p>
                </div>
                <Link
                  href="/classes"
                  className="text-xs font-bold text-[#9F1521] hover:text-[#111111] transition-colors shrink-0"
                >
                  Buka di Kelas Saya &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#808285]">
                      Rata-Rata Kehadiran
                    </span>
                    {currentSummary.attendanceQualified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3F3F4] text-[#059669]">
                        <CheckCircle2 className="h-3 w-3" /> Lolos Syarat UAS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3F3F4] text-[#58595B]">
                        {courses.length === 0 ? 'Belum Ada Kelas' : 'Belum Ada Presensi'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-heading font-extrabold text-[#111111] tabular-nums">
                      {currentSummary.averageAttendance}
                    </span>
                    <span className="text-xs font-normal text-[#58595B]">
                      dari {courses.length} Mata Kuliah Aktif
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F3F3F4] overflow-hidden">
                    <div
                      className="bg-[#9F1521] h-full rounded-full transition-all duration-500"
                      style={{ width: currentSummary.averageAttendance }}
                    />
                  </div>
                  <p className="text-xs text-[#58595B] font-normal">
                    Batas minimal institusi: <strong className="text-[#111111]">75%</strong> untuk memperoleh kartu ujian.
                  </p>
                </div>

                {courses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#D0D6DD] bg-[#FFFFFF] p-5 md:col-span-2 flex flex-col items-center justify-center text-center space-y-2">
                    <Clock className="h-7 w-7 text-[#808285]" />
                    <h3 className="font-heading font-bold text-base text-[#111111]">
                      Belum Ada Sesi Presensi Aktif
                    </h3>
                    <p className="text-xs text-[#58595B] font-normal max-w-md">
                      Sesi presensi perkuliahan akan otomatis hadir di sini ketika dosen membuka presensi mata kuliah yang Anda ikuti.
                    </p>
                    <div className="pt-1">
                      <Link
                        href="/classes"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#9F1521] text-white text-xs font-bold hover:bg-[#8F131E] transition-colors"
                      >
                        <span>Buka Kelas Saya</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 sm:p-5 space-y-3 md:col-span-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2F0] text-[#9F1521] border border-[#FDDDD7]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9F1521] animate-pulse" />
                          SESI AKTIF TERBUKA
                        </span>
                        <span className="text-xs font-normal text-[#58595B]">
                          Tutup: 10:30 WIB (25 menit lagi)
                        </span>
                      </div>
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#111111] pt-1">
                        Pemrograman Web Lanjut (TI-301) — Pertemuan #7
                      </h3>
                      <p className="text-xs text-[#58595B] font-normal">
                        Metode: <strong className="text-[#111111]">QR Dinamis + Validasi Radius GPS Haversine (50m)</strong> di Lab Komputer 2.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E2E3E4]">
                      <span className="text-xs font-normal text-[#58595B]">
                        Ruang: Lab Komputer 2 (Hybrid)
                      </span>
                      <Link
                        href="/classes"
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#9F1521] text-white hover:bg-[#8F131E] text-xs font-bold transition-colors shrink-0"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Klaim Presensi</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SECTION 5: BAHAN AJAR & REFERENSI KULIAH */}
          {showTugasKuis && !showAll && (
            <section aria-label="Materi dan Tugas Kuliah" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-[#111111]">
                  Bahan Ajar &amp; Referensi Kuliah
                </h2>
                <Link
                  href="/classes"
                  className="text-xs font-bold text-[#9F1521] hover:text-[#111111] transition-colors"
                >
                  Semua Kelas &rarr;
                </Link>
              </div>

              {courses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D0D6DD] bg-[#FFFFFF] p-6 sm:p-8 text-center space-y-2">
                  <BookOpen className="h-7 w-7 text-[#808285] mx-auto" />
                  <p className="font-heading font-bold text-base text-[#111111]">
                    Belum Ada Materi &amp; Tugas
                  </p>
                  <p className="text-xs text-[#58595B] font-normal max-w-md mx-auto">
                    Materi perkuliahan, kuis, dan bahan ajar akan tersedia setelah Anda terdaftar di kelas mata kuliah.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {RECOMMENDED_MATERIALS.map((mat) => (
                    <Link
                      key={mat.id}
                      href="/classes"
                      className="group rounded-xl border border-[#E2E3E4] hover:border-[#9F1521] bg-[#FFFFFF] p-4 transition-all flex items-start justify-between gap-3.5"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-[#FEF2F0] text-[#9F1521] shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="inline-block text-[10px] font-bold text-[#9F1521] uppercase tracking-wider">
                            {mat.type}
                          </span>
                          <h4 className="font-heading font-bold text-sm sm:text-base text-[#111111] group-hover:text-[#9F1521] transition-colors truncate">
                            {mat.title}
                          </h4>
                          <p className="text-xs text-[#58595B] font-normal truncate">
                            {mat.course}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#808285] group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL                    */}
      {/* ========================================================= */}
      <aside
        aria-label="Panel Ringkasan & Detail"
        className="hidden xl:flex w-right-panel shrink-0 border-l border-[#E2E3E4] bg-[#FFFFFF] p-5 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        <RightPanelSwitcher
          selectedCourse={selectedCourse}
          courses={courses}
          onSelectCourse={setSelectedCourse}
          summary={currentSummary}
          agenda={agendaItems}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
        />

        <div className="shrink-0 w-full pt-2 border-t border-[#E2E3E4]">
          <UirLogo3D />
        </div>
      </aside>

      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail"
          className="fixed inset-0 z-50 flex justify-end xl:hidden"
        >
          <div
            aria-hidden="true"
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-[#FFFFFF] border-l border-[#E2E3E4] h-[100dvh] flex flex-col shadow-xl z-10 animate-slide-in-right pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex h-header items-center justify-between px-6 border-b border-[#E2E3E4] bg-[#FFFFFF] shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-base text-[#111111] tracking-tight">Ringkasan &amp; Detail</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRightDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] text-[#111111] hover:bg-[#F3F3F4] transition-all cursor-pointer"
                title="Tutup Panel (Esc)"
                aria-label="Tutup Panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5 pb-24">
              <div className="shrink-0 w-full">
                <UirLogo3D />
              </div>
              <RightPanelSwitcher
                selectedCourse={selectedCourse}
                courses={courses}
                onSelectCourse={setSelectedCourse}
                summary={currentSummary}
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
