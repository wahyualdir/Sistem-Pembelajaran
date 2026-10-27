'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  Layers,
  GraduationCap,
  ClipboardList,
  ArrowRight,
  PlusCircle,
  FileText,
  QrCode,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LecturerIdentityCard } from '@/components/retro/lecturer-identity-card';
import { ActionBanner } from '@/components/home/action-banner';
import { TodaySchedule } from '@/components/home/today-schedule';
import { ActiveClassesGrid } from '@/components/home/active-classes-grid';
import { LecturerRightPanel } from '@/components/home/lecturer-right-panel';
import { getNextUpcomingCourse } from '@/modules/academic/home-schedule-utils';
import { usePortalLayout } from '@/app/(portal)/portal-shell';
import { KartuAktivitasDashboard } from '@/components/aktivitas/kartu-aktivitas-dashboard';
import type { ItemAktivitasHarian } from '@/lib/aktivitas';
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

const LECTURER_CATEGORIES = [
  'Semua',
  'Kelas Saya',
  'Koreksi Tugas',
  'Presensi Kuliah',
  'Jadwal Mengajar',
  'Bank Soal',
  'Nilai Akhir',
];

const LECTURER_CHIP_DESTINATIONS: Record<string, string> = {
  'Semua': '/lecturer',
  'Kelas Saya': '/classes',
  'Koreksi Tugas': '/exams/review',
  'Presensi Kuliah': '/attendance',
  'Jadwal Mengajar': '/calendar',
  'Bank Soal': '/exams/question-bank',
  'Nilai Akhir': '/analytics',
};

export interface LecturerDashboardClientProps {
  classes: number;
  items: ReviewItem[];
  todaySchedule?: TodayScheduleItem[];
  activeClasses?: ActiveClassItem[];
  agendaItems?: AgendaItem[];
  lecturerName?: string;
  nidn?: string;
  functionalTitle?: string;
  department?: string;
  aktivitas?: ItemAktivitasHarian[];
}

export function LecturerDashboardClient({
  classes,
  items = [],
  todaySchedule = [],
  activeClasses = [],
  agendaItems = [],
  lecturerName = 'Dr. Ardiansyah, S.T., M.Kom.',
  nidn = '1018058501',
  functionalTitle = 'Lektor Kepala (IV/a)',
  department = 'Teknik Informatika (S1)',
  aktivitas = [],
}: LecturerDashboardClientProps) {
  const totalPending = items.reduce((sum, it) => sum + it.pending, 0);

  // Banner data disesuaikan dengan kondisi riil antrean penilaian dosen
  const bannerData: HomeBannerData = {
    primary:
      totalPending > 0
        ? {
            id: 'banner-lecturer-pending',
            priority: 2,
            category: 'ASSIGNMENT',
            title: `${totalPending} Submisi Mahasiswa Menunggu Penilaian`,
            subtitle: `Terdapat ${items.length} tugas dari kelas aktif Anda yang siap dikoreksi dan diberikan feedback.`,
            buttonLabel: 'Mulai Koreksi Tugas',
            buttonHref: `/classes/${items[0]?.class_id || ''}/assignments/${items[0]?.assignment_id || ''}`,
            badge: 'PERLU KOREKSI',
          }
        : {
            id: 'banner-lecturer-clean',
            priority: 5,
            category: 'IDLE',
            title: 'Semua Submisi Mahasiswa Telah Dinilai',
            subtitle: 'Tidak ada antrean tugas yang tertunda. Siap untuk pertemuan perkuliahan berikutnya.',
            buttonLabel: 'Kelola Kelas',
            buttonHref: '/classes',
            badge: 'SELESAI',
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

  // Hitung total SKS dan kelas riil untuk indikator BKD Dosen
  const totalSks = courses.reduce((sum, c) => sum + (c.sks || 3), 0) || 12;
  const theoryCount = Math.max(1, courses.length > 0 ? courses.length - 1 : 3);
  const practicumCount = courses.length > 2 ? 1 : 1;

  // Filter bagian yang tampil berdasarkan chip kategori
  const showAll = selectedCategory === 'Semua';
  const showKelasSaya = showAll || selectedCategory === 'Kelas Saya';
  const showKoreksi = showAll || selectedCategory === 'Koreksi Tugas';
  const showPresensi = showAll || selectedCategory === 'Presensi Kuliah';
  const showJadwal = showAll || selectedCategory === 'Jadwal Mengajar';
  const showBankSoal = showAll || selectedCategory === 'Bank Soal';
  const showNilai = showAll || selectedCategory === 'Nilai Akhir';

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100dvh-var(--layout-header-height-mobile))] xl:min-h-[calc(100dvh-var(--layout-header-height))]">
      {/* ========================================================= */}
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA DOSEN                   */}
      {/* ========================================================= */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA & FILTER TERPADU DOSEN PENGAMPU */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-[#D6D3CB]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#853827]">
                <span>PORTAL DOSEN PENGAMPU</span>
                <span className="text-[#B8B1A5]">•</span>
                <span className="text-[#57534E]">Semester Ganjil 2026/2027</span>
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-[#1C1917]">
                Ruang Pengampu Dosen
              </h1>
            </div>

            <nav aria-label="Kategori Pengajar" className="flex flex-wrap items-center gap-1.5">
              {LECTURER_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                const dest = LECTURER_CHIP_DESTINATIONS[cat];
                const isNavigational = dest && dest !== '/lecturer';

                return isNavigational ? (
                  <Link
                    key={cat}
                    href={dest}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs sm:text-sm font-sans transition-colors focus-visible:outline-none cursor-pointer inline-flex items-center gap-1',
                      isActive
                        ? 'bg-[#1C1917] text-white font-semibold'
                        : 'bg-[#ECE9D8]/70 text-[#44403C] font-medium hover:bg-[#ECE9D8] hover:text-[#1C1917]'
                    )}
                  >
                    <span>{cat}</span>
                  </Link>
                ) : (
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

          {/* SECTION 1: BANNER AKSI PRIORITAS */}
          <ActionBanner initialData={bannerData} />

          {/* 3 KARTU METRIK RINGKASAN DOSEN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] text-[#C2553A]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Kelas Aktif</p>
                <p className="font-heading font-bold text-2xl text-[#1C1917] leading-tight">{classes}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] text-[#C2553A]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Tugas Menunggu Koreksi</p>
                <p className="font-heading font-bold text-2xl text-[#1C1917] leading-tight">{items.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] text-[#C2553A]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Total Submisi Mahasiswa</p>
                <p className="font-heading font-bold text-2xl text-[#1C1917] leading-tight">{totalPending}</p>
              </div>
            </div>
          </div>

          {/* GRID 2 KOLOM: JADWAL MENGAJAR & ANTREAN KOREKSI TUGAS */}
          {(showAll || showJadwal || showPresensi || showKoreksi) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
              {/* Kolom Kiri: Jadwal Mengajar Hari Ini */}
              {(showAll || showJadwal || showPresensi) && (
                <div className="space-y-4">
                  <TodaySchedule items={todaySchedule} />
                </div>
              )}

              {/* Kolom Kanan: Antrean Submisi Perlu Direview */}
              {(showAll || showKoreksi) && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] overflow-hidden">
                    <div className="p-4 sm:p-5 border-b-2 border-black bg-gray-soft flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
                        <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
                        <h2 className="font-heading font-black text-sm sm:text-base text-black flex items-center gap-2 ml-1">
                          <ClipboardList className="h-4 w-4 text-black" />
                          <span>Tugas Perlu Direview</span>
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-black text-black px-2.5 py-0.5 rounded border border-black bg-white shadow-retro-sm">
                        {totalPending} Submisi
                      </span>
                    </div>

                    <div className="p-4 sm:p-5">
                      {classes === 0 ? (
                        <div className="p-6 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 space-y-2">
                          <BookOpen className="h-7 w-7 text-black mx-auto" />
                          <p className="text-sm font-heading font-black text-black">Anda Belum Memiliki Kelas Aktif</p>
                          <p className="text-xs text-black/80 font-bold max-w-sm mx-auto">
                            Mulai semester dengan membuka kelas perkuliahan baru, lalu bagikan kode kelas kepada mahasiswa Anda.
                          </p>
                        </div>
                      ) : items.length === 0 ? (
                        <div className="p-6 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 space-y-2">
                          <CheckCircle2 className="h-7 w-7 text-black mx-auto" />
                          <p className="text-sm font-heading font-black text-black">Seluruh Tugas Telah Dinilai!</p>
                          <p className="text-xs text-black/80 font-bold max-w-sm mx-auto">
                            Tidak ada submisi tugas mahasiswa yang tertunda. Nilai akhir kelas siap untuk difinalisasi.
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
                                <span className="text-black/60">Periksa & beri nilai akhir</span>
                                <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                  <span>Nilai Jawaban</span>
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

          {/* SECTION: KELAS PENGAMPU AKTIF */}
          {(showAll || showKelasSaya || showPresensi || showNilai) && (
            <div>
              <ActiveClassesGrid
                courses={courses}
                selectedCourse={selectedCourse}
                onSelectCourse={handleSelectCourse}
                title="Kelas Pengampu Aktif"
                emptyTitle="Anda Belum Memiliki Kelas Aktif"
                emptySubtitle="Mulai semester dengan membuka kelas perkuliahan baru, lalu bagikan kode kelas kepada mahasiswa Anda."
                emptyActionLabel="Buka Kelas Pertama Sekarang"
                progressLabel="Progres Pertemuan"
              />
            </div>
          )}

          {/* GRAFIK AKTIVITAS MENGAJAR DOSEN (26 MINGGU) */}
          {(showAll || showKelasSaya || showKoreksi || showNilai) && (
            <KartuAktivitasDashboard
              data={aktivitas}
              judul="Grafik Aktivitas Mengajar (26 Minggu)"
              deskripsi="Rekam jejak penerbitan materi, kuis CBT, tugas, dan review penilaian selama 6 bulan terakhir."
              role="dosen"
            />
          )}

          {/* SECTION SPESIFIK: BANK SOAL CBT (Tampil saat kategori Bank Soal dipilih) */}
          {(showBankSoal || showAll) && (
            <section aria-label="Bank Soal & Ujian CBT" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg border-2 border-ink bg-gray-soft text-black shadow-xs">
                    <Award className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-ink">
                      Bank Soal & Evaluasi CBT
                    </h2>
                    <p className="text-xs text-gray-dark font-medium">
                      Kelola butir soal pilihan ganda, esai, template Excel/Word, dan analisis butir soal per kelas.
                    </p>
                  </div>
                </div>
                <Link
                  href="/exams"
                  className="text-xs sm:text-sm font-bold text-black hover:underline transition-colors shrink-0"
                >
                  Buka Bank Soal &rarr;
                </Link>
              </div>

              <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-ink">
                    Penyusunan Kuis & Ujian Terstandar
                  </h3>
                  <p className="text-xs text-gray-dark font-bold leading-relaxed">
                    Unggah butir soal massal dengan format Excel atau Word, atur bobot penilaian otomatis, dan terapkan pengacakan soal anti-kecurangan.
                  </p>
                </div>
                <Link
                  href="/exams"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-ink bg-ink text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all shrink-0 min-h-[44px]"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Kelola Bank Soal</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          )}

          {/* SECTION SPESIFIK: PRESENSI TERPADU (Tampil saat kategori Presensi Kuliah dipilih) */}
          {showPresensi && !showAll && (
            <section aria-label="Presensi Perkuliahan" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg border-2 border-ink bg-gray-soft text-black shadow-xs">
                    <QrCode className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-ink">
                      Presensi & Kehadiran Mahasiswa
                    </h2>
                    <p className="text-xs text-gray-dark font-medium">
                      Buka sesi QR dinamis, validasi radius lokasi GPS, dan pantau mahasiswa yang berisiko tidak memenuhi syarat UAS.
                    </p>
                  </div>
                </div>
                <Link
                  href="/classes"
                  className="text-xs sm:text-sm font-bold text-black hover:underline transition-colors shrink-0"
                >
                  Buka di Kelas Saya &rarr;
                </Link>
              </div>

              <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-ink">
                    Buka Sesi Presensi Kuliah Hari Ini
                  </h3>
                  <p className="text-xs text-gray-dark font-bold leading-relaxed">
                    Generate kode QR dinamis dengan batas waktu putar otomatis untuk mencegah kecurangan titip absen.
                  </p>
                </div>
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-ink bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all shrink-0 min-h-[44px]"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Buka di Kelas Saya</span>
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
        aria-label="Panel Ringkasan & Detail Pengajar"
        className="hidden lg:flex w-right-panel shrink-0 border-l border-[#D6D3CB] bg-[#FAF8F5] p-5 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        {/* PENGALIH DUA KONDISI: "Hari Ini" & "Detail Kelas" LANGSUNG DI ATAS */}
        <LecturerRightPanel
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

        {/* KARTU IDENTITAS DOSEN & STATUS BEBAN MENGAJAR (BKD) DI BAGIAN BAWAH */}
        <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
          <LecturerIdentityCard
            lecturerName={lecturerName}
            nidn={nidn}
            functionalTitle={functionalTitle}
            department={department}
            sksCount={totalSks}
            theoryClassesCount={theoryCount}
            practicumClassesCount={practicumCount}
          />
        </div>
      </aside>

      {/* Mode Slide-over Drawer (< 1280px / max-xl): Panel geser dari kanan */}
      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail Pengajar"
          className="fixed inset-0 z-50 flex justify-end lg:hidden"
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
                  Ringkasan Dosen
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
                <LecturerIdentityCard
                  lecturerName={lecturerName}
                  nidn={nidn}
                  functionalTitle={functionalTitle}
                  department={department}
                  sksCount={totalSks}
                  theoryClassesCount={theoryCount}
                  practicumClassesCount={practicumCount}
                />
              </div>
              <LecturerRightPanel
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
