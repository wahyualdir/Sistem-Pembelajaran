'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  Layers,
  GraduationCap,
  ClipboardList,
  ArrowRight,
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

  const totalSks = courses.reduce((sum, c) => sum + (c.sks || 3), 0) || 12;
  const theoryCount = Math.max(1, courses.length > 0 ? courses.length - 1 : 3);
  const practicumCount = courses.length > 2 ? 1 : 1;

  const showAll = selectedCategory === 'Semua';
  const showKelasSaya = showAll || selectedCategory === 'Kelas Saya';
  const showKoreksi = showAll || selectedCategory === 'Koreksi Tugas';
  const showPresensi = showAll || selectedCategory === 'Presensi Kuliah';
  const showJadwal = showAll || selectedCategory === 'Jadwal Mengajar';
  const showBankSoal = showAll || selectedCategory === 'Bank Soal';
  const showNilai = showAll || selectedCategory === 'Nilai Akhir';

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)]">
      {/* ========================================================= */}
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA DOSEN                   */}
      {/* ========================================================= */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA & FILTER TERPADU DOSEN PENGAMPU */}
          <div className="space-y-3.5 pb-3.5 border-b border-[#E2E3E4]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#9F1521]">
                  <span className="uppercase tracking-wider">Portal Dosen Pengampu</span>
                  <span className="text-[#D0D6DD]">•</span>
                  <span className="text-[#58595B] font-normal">Semester Ganjil 2026/2027</span>
                </div>
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-[#111111]">
                  Ruang Pengampu Dosen
                </h1>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <span className="px-3 py-1 rounded-full bg-[#FEF2F0] text-[#9F1521] border border-[#FDDDD7] text-xs font-bold">
                  {classes} Kelas Aktif
                </span>
              </div>
            </div>

            <nav
              aria-label="Kategori Pengajar"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 rounded-xl bg-[#FFFFFF] border border-[#E2E3E4] w-full sm:w-fit max-w-full"
            >
              {LECTURER_CATEGORIES.map((cat) => {
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

          {/* SECTION 1: BANNER AKSI PRIORITAS */}
          <ActionBanner initialData={bannerData} />

          {/* 3 METRIK RINGKASAN DOSEN (STRIP TERPADU BERSIH) */}
          <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E3E4] gap-4 sm:gap-0">
            <div className="flex items-center gap-3.5 sm:pr-5">
              <div className="p-2.5 rounded-lg bg-[#FEF2F0] text-[#9F1521]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#808285] uppercase tracking-wider">Kelas Aktif</p>
                <p className="font-heading font-extrabold text-2xl text-[#111111] leading-tight">{classes}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-5">
              <div className="p-2.5 rounded-lg bg-[#FEF2F0] text-[#9F1521]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#808285] uppercase tracking-wider">Tugas Menunggu Koreksi</p>
                <p className="font-heading font-extrabold text-2xl text-[#111111] leading-tight">{items.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:pl-5">
              <div className="p-2.5 rounded-lg bg-[#FEF2F0] text-[#9F1521]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#808285] uppercase tracking-wider">Total Submisi Mahasiswa</p>
                <p className="font-heading font-extrabold text-2xl text-[#9F1521] leading-tight">{totalPending}</p>
              </div>
            </div>
          </div>

          {/* GRID 2 KOLOM: JADWAL MENGAJAR & ANTREAN KOREKSI TUGAS */}
          {(showAll || showJadwal || showPresensi || showKoreksi) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
              {(showAll || showJadwal || showPresensi) && (
                <div className="space-y-4">
                  <TodaySchedule items={todaySchedule} />
                </div>
              )}

              {(showAll || showKoreksi) && (
                <section aria-label="Tugas Perlu Direview" className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-[#9F1521]" />
                      <h2 className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-[#111111]">
                        Tugas Perlu Direview
                      </h2>
                    </div>
                    <span className="text-xs font-bold text-[#9F1521] px-2.5 py-0.5 rounded-full bg-[#FEF2F0] border border-[#FDDDD7]">
                      {totalPending} Submisi
                    </span>
                  </div>

                  {classes === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] space-y-1.5">
                      <BookOpen className="h-7 w-7 text-[#808285] mx-auto" />
                      <p className="text-base font-heading font-bold text-[#111111]">Anda Belum Memiliki Kelas Aktif</p>
                      <p className="text-xs text-[#58595B] font-normal max-w-sm mx-auto">
                        Mulai semester dengan membuka kelas perkuliahan baru, lalu bagikan kode kelas kepada mahasiswa Anda.
                      </p>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] space-y-1.5">
                      <CheckCircle2 className="h-7 w-7 text-[#059669] mx-auto" />
                      <p className="text-base font-heading font-bold text-[#111111]">Seluruh Tugas Telah Dinilai</p>
                      <p className="text-xs text-[#58595B] font-normal max-w-sm mx-auto">
                        Tidak ada submisi tugas mahasiswa yang tertunda. Nilai akhir kelas siap untuk difinalisasi.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] divide-y divide-[#E2E3E4] overflow-hidden">
                      {items.slice(0, 5).map((t) => (
                        <Link
                          key={t.assignment_id}
                          href={`/classes/${t.class_id}/assignments/${t.assignment_id}`}
                          className="group block p-4 hover:bg-[#F3F3F4]/60 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#9F1521]">
                                {t.class_title}
                              </span>
                              <h3 className="font-heading font-bold text-sm sm:text-base text-[#111111] group-hover:text-[#9F1521] transition-colors line-clamp-1">
                                {t.title}
                              </h3>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F3F3F4] text-[#111111] font-bold text-xs shrink-0">
                              {t.pending}/{t.total} Belum Dinilai
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between text-xs text-[#58595B]">
                            <span className="font-normal">Periksa &amp; beri nilai akhir</span>
                            <div className="flex items-center gap-1 font-bold text-[#9F1521] group-hover:translate-x-0.5 transition-transform">
                              <span>Nilai Jawaban</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
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

          {/* SECTION SPESIFIK: BANK SOAL CBT */}
          {(showBankSoal || showAll) && (
            <section aria-label="Bank Soal & Ujian CBT" className="space-y-3">
              <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-lg bg-[#FEF2F0] text-[#9F1521] shrink-0 mt-0.5">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#111111]">
                      Bank Soal &amp; Evaluasi CBT Terstandar
                    </h3>
                    <p className="text-xs sm:text-sm text-[#58595B] font-normal leading-relaxed">
                      Unggah butir soal massal dengan format Excel atau Word, atur bobot penilaian otomatis, dan terapkan pengacakan soal anti-kecurangan.
                    </p>
                  </div>
                </div>
                <Link
                  href="/exams"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#9F1521] text-white hover:bg-[#8F131E] text-xs sm:text-sm font-bold transition-colors shrink-0"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Kelola Bank Soal</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          )}

          {/* SECTION SPESIFIK: PRESENSI TERPADU */}
          {showPresensi && !showAll && (
            <section aria-label="Presensi Perkuliahan" className="space-y-3">
              <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-lg bg-[#FEF2F0] text-[#9F1521] shrink-0 mt-0.5">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#111111]">
                      Buka Sesi Presensi Kuliah Hari Ini
                    </h3>
                    <p className="text-xs sm:text-sm text-[#58595B] font-normal leading-relaxed">
                      Generate kode QR dinamis dengan batas waktu putar otomatis untuk mencegah kecurangan titip absen.
                    </p>
                  </div>
                </div>
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#9F1521] text-white hover:bg-[#8F131E] text-xs sm:text-sm font-bold transition-colors shrink-0"
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
      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL                    */}
      {/* ========================================================= */}
      <aside
        aria-label="Panel Ringkasan & Detail Pengajar"
        className="hidden xl:flex w-right-panel shrink-0 border-l border-[#E2E3E4] bg-[#FFFFFF] p-5 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
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

        <div className="shrink-0 w-full pt-2 border-t border-[#E2E3E4]">
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

      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail Pengajar"
          className="fixed inset-0 z-50 flex justify-end xl:hidden"
        >
          <div
            aria-hidden="true"
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-[#FFFFFF] border-l border-[#E2E3E4] h-[100dvh] flex flex-col shadow-xl z-10 animate-slide-in-right pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex h-header items-center justify-between px-6 border-b border-[#E2E3E4] bg-[#FFFFFF] shrink-0">
              <span className="font-heading font-bold text-base text-[#111111] tracking-tight">
                Ringkasan Dosen
              </span>
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
              <LecturerIdentityCard
                lecturerName={lecturerName}
                nidn={nidn}
                functionalTitle={functionalTitle}
                department={department}
                sksCount={totalSks}
                theoryClassesCount={theoryCount}
                practicumClassesCount={practicumCount}
              />
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
