'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles,
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
      title: 'Selamat Datang di RuangKampus',
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

  // Ambil materi terakhir dibuka untuk kartu Lanjutkan Belajar
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

  // Beritahu layout shell bahwa halaman ini memiliki panel kanan
  useEffect(() => {
    setHasRightPanel(true);
    return () => setHasRightPanel(false);
  }, [setHasRightPanel]);

  // Saat mahasiswa mengklik kartu kelas: beralih otomatis ke tab "Detail Kelas" & buka drawer jika pada layar < 1280px
  const handleSelectCourse = (course: ActiveClassItem) => {
    setSelectedCourse(course);
    setRightPanelTab('detail-kelas');
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsRightDrawerOpen(true);
    }
  };

  // Filter bagian yang tampil berdasarkan chip kategori (Bagian 4.8)
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
      {/* 1. BAGIAN TENGAH: "HARI INI + KELAS SAYA" (LAPANG & BESAR)  */}
      {/* ========================================================= */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA & FILTER TERPADU (RAPIH, TIDAK TERPOTONG & 1 BARIS FILTER) */}
          <div className="space-y-3.5 pb-3.5 border-b border-[#D6D3CB]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-[#853827]">
                  <span className="uppercase tracking-wider">Portal Akademik Mahasiswa</span>
                  <span className="text-[#B8B1A5]">•</span>
                  <span className="text-[#57534E] font-sans font-semibold">
                    {currentSummary.semesterLabel || 'Semester Ganjil 2026/2027'}
                  </span>
                </div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-[#1C1917] leading-tight">
                  Ruang Pembelajaran Mahasiswa
                </h1>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-[#FEF2F0] text-[#C2553A] border border-[#FDDDD7] text-xs font-bold">
                  {courses.length} Mata Kuliah Aktif
                </span>
              </div>
            </div>

            {/* Bilah Kategori 1 Baris Utuh (Tidak Terpecah 2 Baris) */}
            <nav
              aria-label="Kategori Perkuliahan"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 rounded-xl bg-[#F2EFE8] border border-[#D6D3CB] w-full sm:w-fit max-w-full"
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
                        ? 'bg-[#1C1917] text-white font-bold shadow-2xs'
                        : 'text-[#44403C] font-semibold hover:bg-[#FFFFFF]/70 hover:text-[#1C1917]'
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* SECTION 1: BANNER AKSI (SELALU TAMPIL PADA SEMUA FILTER) */}
          <ActionBanner
            initialData={currentBannerData}
            onRefresh={async () => getHomeBannerAction()}
          />

          {/* ========================================================= */}
          {/* ZONA 1: COCKPIT HARI INI & TINDAKAN MENDESAK             */}
          {/* ========================================================= */}
          {/* GRID 2 KOLOM: JADWAL HARI INI & TENGGAT TERDEKAT (< 48 JAM) */}
          {(showAll || showPresensi || showJadwal || showTugasKuis || showUjian) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
              {/* Kolom Kiri: Jadwal Kuliah Hari Ini */}
              {(showAll || showPresensi || showJadwal) && (
                <div className="space-y-4">
                  <TodaySchedule items={todaySchedule} />
                </div>
              )}

              {/* Kolom Kanan: Tenggat Terdekat */}
              {(showAll || showTugasKuis || showUjian) && (
                <div className="space-y-4">
                  <NearestDeadlines initialItems={deadlines} />
                </div>
              )}
            </div>
          )}

          {/* PRIORITAS HARIAN (TAMPIL PADA FILTER TUGAS & KUIS ATAU KELAS SAYA) */}
          {!showAll && (showKelasSaya || showTugasKuis) && (
            <DailyPriorityCard initialItems={dailyPriorities} />
          )}

          {/* ========================================================= */}
          {/* ZONA 2: AKSELERASI BELAJAR & KELAS PERKULIAHAN AKTIF     */}
          {/* ========================================================= */}
          {/* SECTION: KARTU LANJUTKAN BELAJAR (QUICK RESUME MATERI TERAKHIR) */}
          {materiTerakhir && (showAll || showKelasSaya || showTugasKuis) && (
            <section aria-label="Lanjutkan Belajar" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg sm:text-xl tracking-tight text-ink flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary inline-block" />
                  <span>Lanjutkan Belajar</span>
                </h2>
                <Link
                  href="/mahasiswa/tugas"
                  className="text-xs sm:text-sm font-bold text-primary-dark hover:text-ink transition-colors flex items-center gap-1 group"
                >
                  <span>Lihat Semua Materi</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="rounded-xl border-2 border-ink bg-stone-50/90 p-4 sm:p-5 shadow-retro flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#1C1917] text-white">
                      {materiTerakhir.kelas.kode}
                    </span>
                    <span className="text-xs font-bold text-stone-600 truncate">
                      {materiTerakhir.kelas.namaMataKuliah}
                    </span>
                    {materiTerakhir.progres.selesai ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="h-3 w-3 text-amber-600" />
                        Sedang Dipelajari
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-ink line-clamp-1">
                    {materiTerakhir.materi.judul}
                  </h3>

                  <p suppressHydrationWarning className="text-xs text-stone-500 font-sans font-medium">
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-ink bg-ink text-white hover:bg-ink/90 text-xs sm:text-sm font-bold shadow-retro hover:-translate-y-0.5 transition-all shrink-0 min-h-[44px]"
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

          {/* ========================================================= */}
          {/* ZONA 3: REFLEKSI SEMESTER, RITME & KONSISTENSI BELAJAR    */}
          {/* ========================================================= */}
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

          {/* SECTION: RINGKASAN PRESENSI PEMBELAJARAN (HANYA MUNCUL DI TAB PRESENSI AGAR BERANDA BEBAS DARI KARTU DUPLIKAT) */}
          {showPresensi && !showAll && (
            <section aria-label="Presensi Pembelajaran" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg border-2 border-ink bg-gray-soft text-primary shadow-xs">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-ink">
                      Presensi & Kehadiran Perkuliahan
                    </h2>
                    <p className="text-xs text-gray-dark font-medium">
                      Pantau kehadiran real-time, lakukan check-in GPS/QR, dan pastikan batas syarat UAS (minimal 75%).
                    </p>
                  </div>
                </div>
                <Link
                  href="/classes"
                  className="text-xs sm:text-sm font-bold text-primary-dark hover:text-ink transition-colors shrink-0"
                >
                  Buka di Kelas Saya &rarr;
                </Link>
              </div>

              {/* Grid Status Presensi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Kartu 1: Rata-rata Kehadiran */}
                <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-medium uppercase tracking-[0.04em] text-gray-dark">
                      Rata-Rata Kehadiran
                    </span>
                    {currentSummary.attendanceQualified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-semibold bg-surface text-ink border-2 border-ink">
                        <CheckCircle2 className="h-3 w-3" /> Lolos Syarat UAS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-semibold bg-gray-soft text-ink border border-ink">
                        {courses.length === 0 ? 'Belum Ada Kelas' : 'Belum Ada Presensi'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-heading font-bold text-ink tabular-nums">
                      {currentSummary.averageAttendance}
                    </span>
                    <span className="text-xs font-medium text-gray-dark">
                      dari {courses.length} Mata Kuliah Aktif
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full border border-ink bg-gray-soft overflow-hidden">
                    <div
                      className="bg-ink h-full rounded-full transition-all duration-500"
                      style={{ width: currentSummary.averageAttendance }}
                    />
                  </div>
                  <p className="text-xs text-gray-dark">
                    Batas minimal institusi: <strong>75%</strong> untuk memperoleh kartu ujian.
                  </p>
                </div>

                {/* Kartu 2: Sesi Presensi Aktif Hari Ini */}
                {courses.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-ink bg-surface/50 p-5 shadow-retro md:col-span-2 flex flex-col items-center justify-center text-center space-y-2">
                    <Clock className="h-7 w-7 text-gray-dark" />
                    <h3 className="font-heading font-bold text-base text-ink">
                      Belum Ada Sesi Presensi Aktif
                    </h3>
                    <p className="text-xs text-gray-dark max-w-md">
                      Sesi presensi perkuliahan akan otomatis hadir di sini ketika dosen membuka presensi mata kuliah yang Anda ikuti.
                    </p>
                    <div className="pt-1">
                      <Link
                        href="/classes"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold text-ink transition-all shadow-xs"
                      >
                        <span>Buka Kelas Saya</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-ink bg-gray-soft/40 p-4 sm:p-5 shadow-retro space-y-3 md:col-span-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-bold bg-gray-dark text-white border-2 border-ink">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          SESI AKTIF TERBUKA
                        </span>
                        <span className="text-xs font-sans font-bold text-gray-dark">
                          Tutup: 10:30 WIB (25 menit lagi)
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-lg sm:text-xl text-ink pt-1">
                        Pemrograman Web Lanjut (TI-301) — Pertemuan #7
                      </h3>
                      <p className="text-xs text-gray-dark font-medium">
                        Metode: <strong>QR Dinamis + Validasi Radius GPS Haversine (50m)</strong> di Lab Komputer 2.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-ink/10">
                      <span className="text-xs font-sans font-bold text-gray-dark">
                        Ruang: Lab Komputer 2 (Hybrid)
                      </span>
                      <Link
                        href="/classes"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-ink bg-ink text-white hover:bg-ink/90 text-xs sm:text-sm font-bold shadow-retro transition-all shrink-0 min-h-[40px]"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Klaim Presensi di Kelas Saya</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SECTION 5: BAHAN AJAR & REFERENSI KULIAH (Tampil pada Filter Tugas & Kuis) */}
          {showTugasKuis && !showAll && (
            <section aria-label="Materi dan Tugas Kuliah" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-ink">
                  Bahan Ajar & Referensi Kuliah
                </h2>
                <Link
                  href="/classes"
                  className="text-xs sm:text-sm font-bold text-primary-dark hover:text-ink transition-colors"
                >
                  Semua Kelas &rarr;
                </Link>
              </div>

              {courses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D6D3CB] bg-[#FAF8F5] p-6 sm:p-8 text-center space-y-2">
                  <BookOpen className="h-7 w-7 text-[#7A756D] mx-auto" />
                  <p className="font-heading font-bold text-base text-ink">
                    Belum Ada Materi & Tugas
                  </p>
                  <p className="text-xs text-gray-dark max-w-md mx-auto">
                    Materi perkuliahan, kuis, dan bahan ajar akan tersedia setelah Anda terdaftar di kelas mata kuliah.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {RECOMMENDED_MATERIALS.map((mat) => (
                    <Link
                      key={mat.id}
                      href="/classes"
                      className="group rounded-xl border border-[#D6D3CB] hover:border-[#7A756D] bg-[#FFFFFF] p-4 transition-all flex items-start justify-between gap-3.5"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#D6D3CB] text-[#C2553A] shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="inline-block text-[11px] font-mono font-semibold text-[#853827] uppercase">
                            {mat.type}
                          </span>
                          <h4 className="font-heading font-bold text-sm sm:text-base text-[#1C1917] group-hover:text-[#C2553A] transition-colors truncate">
                            {mat.title}
                          </h4>
                          <p className="text-xs text-[#57534E] truncate">
                            {mat.course}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#7A756D] group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL (BASELINE 480px)   */}
      {/* ========================================================= */}
      {/* Mode Desktop (>= 1280px / xl): Sticky dengan scroll internal sendiri */}
      <aside
        aria-label="Panel Ringkasan & Detail"
        className="hidden xl:flex w-right-panel shrink-0 border-l border-[#D6D3CB] bg-[#FAF8F5] p-5 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        {/* PENGALIH DUA KONDISI: "Hari Ini" & "Detail Kelas" LANGSUNG DI ATAS PANEL */}
        <RightPanelSwitcher
          selectedCourse={selectedCourse}
          courses={courses}
          onSelectCourse={setSelectedCourse}
          summary={currentSummary}
          agenda={agendaItems}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
        />

        {/* KARTU IDENTITAS KAMPUS DI BAGIAN BAWAH PANEL */}
        <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
          <UirLogo3D />
        </div>
      </aside>

      {/* Mode Slide-over Drawer (< 1280px / max-xl): Panel geser dari kanan */}
      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail"
          className="fixed inset-0 z-50 flex justify-end xl:hidden"
        >
          {/* Backdrop Overlay */}
          <div
            aria-hidden="true"
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Container (Rem-based Responsive Scaling) */}
          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-[#FAF8F5] border-l-2 border-[#D6D3CB] h-[100dvh] flex flex-col shadow-2xl z-10 animate-slide-in-right pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            {/* Header Drawer */}
            <div className="flex h-header items-center justify-between px-6 border-b-2 border-[#D6D3CB] bg-[#ECE9D8] shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-base text-[#1C1917] tracking-tight">Ringkasan & Detail</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRightDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#7A756D] bg-white text-[#1C1917] hover:bg-[#FAF8F5] shadow-xs active:translate-y-0.5 transition-all focus-visible:outline-none cursor-pointer"
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
