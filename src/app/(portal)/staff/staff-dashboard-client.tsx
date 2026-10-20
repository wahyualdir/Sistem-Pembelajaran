'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  GraduationCap,
  CalendarDays,
  BookOpen,
  PlusCircle,
  X,
  Layers,
  Clock,
  Megaphone,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StaffIdentityCard } from '@/components/retro/staff-identity-card';
import { StaffRightPanel } from '@/components/home/staff-right-panel';
import { ActionBanner } from '@/components/home/action-banner';
import { QuickAdd } from '@/modules/academic/quick-add';
import {
  createCourseAction,
  createProgramAction,
  createSemesterAction,
  type ProgramItem,
  type SemesterItem,
  type CourseItem,
} from '@/modules/academic/actions';
import { usePortalLayout } from '@/app/(portal)/portal-shell';
import type { HomeBannerData } from '@/modules/academic/home-actions';

const STAFF_CATEGORIES = [
  'Semua',
  'Master Data',
  'Kelas & Asisten Lab',
  'Jadwal Kuliah',
  'Pengumuman',
  'Rekap Nilai',
];

export interface StaffDashboardClientProps {
  programs: ProgramItem[];
  semesters: SemesterItem[];
  courses: CourseItem[];
  staffName?: string;
  nip?: string;
}

export function StaffDashboardClient({
  programs = [],
  semesters = [],
  courses = [],
  staffName = 'Staf Administrasi Akademik',
  nip = '198803152012011002',
}: StaffDashboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const { isRightDrawerOpen, setIsRightDrawerOpen, setHasRightPanel } = usePortalLayout();
  const [rightPanelTab, setRightPanelTab] = useState<'hari-ini' | 'quick-actions'>('hari-ini');

  useEffect(() => {
    setHasRightPanel(true);
    return () => setHasRightPanel(false);
  }, [setHasRightPanel]);

  const bannerData: HomeBannerData = {
    primary: {
      id: 'banner-staff-operational',
      priority: 4,
      category: 'IDLE',
      title: 'Administrasi Semester Ganjil 2026/2027 Berjalan Normal',
      subtitle: `Sistem master akademik terhubung aktif. ${programs.length} Program Studi dan ${courses.length} mata kuliah siap disinkronkan.`,
      buttonLabel: 'Kelola Kelas & Asisten',
      buttonHref: '/staff/classes',
      badge: 'BAAK ONLINE',
    },
    others: [],
    totalActive: 1,
    serverTime: new Date().toISOString(),
  };

  const showAll = selectedCategory === 'Semua';
  const showMaster = showAll || selectedCategory === 'Master Data';
  const showKelas = showAll || selectedCategory === 'Kelas & Asisten Lab';
  const showJadwal = showAll || selectedCategory === 'Jadwal Kuliah';
  const showPengumuman = showAll || selectedCategory === 'Pengumuman';
  const showNilai = showAll || selectedCategory === 'Rekap Nilai';

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)]">
      {/* ========================================================= */}
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA STAF BAAK               */}
      {/* ========================================================= */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA: MASTER DATA AKADEMIK */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1 border-b-2 border-black/15 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md border border-black/20 bg-black/5 text-[11px] font-sans font-bold uppercase tracking-wider text-black">
                  Portal Staf Akademik
                </span>
                <span className="text-black/30 font-bold">•</span>
                <span className="text-[11px] font-sans font-bold text-black/70 uppercase">
                  BAAK UIR
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg border-2 border-ink bg-surface shadow-xs flex items-center justify-center shrink-0">
                  <Database className="h-5 w-5 sm:h-6 sm:w-6 text-ink" />
                </div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-ink leading-none">
                  Biro Administrasi Akademik
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-ink/80 font-bold leading-relaxed pt-0.5">
                Pengelolaan fondasi akademik: Program Studi, Semester Aktif, Katalog Mata Kuliah, dan Delegasi Asisten Lab.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
              <Link
                href="/staff/classes"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white text-black font-black text-xs sm:text-sm transition-all shadow-retro cursor-pointer"
              >
                <Layers className="h-4 w-4" />
                <span>Asisten Lab</span>
              </Link>
              <Link
                href="/staff/schedules"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 font-black text-xs sm:text-sm transition-all shadow-retro cursor-pointer"
              >
                <Clock className="h-4 w-4" />
                <span>Jadwal Kuliah</span>
              </Link>
            </div>
          </div>

          {/* ROW 1: CATEGORIES PILLS (FILTER CHIP) */}
          <section aria-label="Kategori BAAK" className="space-y-2.5 sm:space-y-3">
            <h2 className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wider text-gray-dark">
              Categories
            </h2>
            <div className="flex flex-wrap items-center gap-2 pb-1.5">
              {STAFF_CATEGORIES.map((cat) => {
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

          {/* BANNER AKSI PRIORITAS */}
          <ActionBanner initialData={bannerData} />

          {/* 3 KARTU METRIK RINGKASAN BAAK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-black shadow-retro-sm">
                <GraduationCap className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Program Studi</p>
                <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{programs.length}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-black shadow-retro-sm">
                <CalendarDays className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Semester Akademik</p>
                <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{semesters.length}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-black shadow-retro-sm">
                <BookOpen className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Katalog Mata Kuliah</p>
                <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{courses.length}</p>
              </div>
            </div>
          </div>

          {/* GRID 2 KOLOM MASTER: PRODI & SEMESTER */}
          {(showAll || showMaster) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* WINDOW 1: PROGRAM STUDI */}
              <div id="prodi-form" className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
                <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                  <div className="space-y-0.5">
                    <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-ink" />
                      <span>Program Studi</span>
                    </h2>
                    <p className="text-xs text-gray-dark font-bold">Tambah kode dan nama program studi baru.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
                    {programs.length} PRODI
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border-2 border-ink bg-gray-soft/40 shadow-xs">
                  <QuickAdd
                    action={createProgramAction}
                    fields={[
                      { name: 'code', label: 'Kode Prodi', placeholder: 'IF' },
                      { name: 'name', label: 'Nama Program Studi', placeholder: 'Teknik Informatika' },
                    ]}
                    submitLabel="Simpan Program Studi"
                    okMessage="Program studi berhasil disimpan."
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">
                    Daftar Program Studi Terdaftar
                  </h3>
                  <div className="divide-y-2 divide-ink/15 border-2 border-ink rounded-xl overflow-hidden bg-white">
                    {programs.length === 0 ? (
                      <p className="p-4 text-xs text-gray-dark text-center font-bold">Belum ada program studi.</p>
                    ) : (
                      programs.map((p) => (
                        <div key={p.id} className="p-3 flex items-center justify-between hover:bg-gray-soft/30 transition-colors">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded border border-ink bg-ink text-white">
                            {p.code}
                          </span>
                          <span className="font-heading font-bold text-xs sm:text-sm text-ink truncate ml-2">
                            {p.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* WINDOW 2: SEMESTER AKADEMIK */}
              <div id="semester-form" className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
                <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                  <div className="space-y-0.5">
                    <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-ink" />
                      <span>Semester Akademik</span>
                    </h2>
                    <p className="text-xs text-gray-dark font-bold">Buka periode semester ganjil/genap baru.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
                    {semesters.length} PERIODE
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border-2 border-ink bg-gray-soft/40 shadow-xs">
                  <QuickAdd
                    action={createSemesterAction}
                    fields={[
                      { name: 'label', label: 'Label Semester', placeholder: '2026/2027 Ganjil' },
                    ]}
                    submitLabel="Buka Semester Baru"
                    okMessage="Semester akademik berhasil disimpan."
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">
                    Periode Semester Akademik
                  </h3>
                  <div className="divide-y-2 divide-ink/15 border-2 border-ink rounded-xl overflow-hidden bg-white">
                    {semesters.length === 0 ? (
                      <p className="p-4 text-xs text-gray-dark text-center font-bold">Belum ada semester akademik.</p>
                    ) : (
                      semesters.map((s) => (
                        <div key={s.id} className="p-3 flex items-center justify-between hover:bg-gray-soft/30 transition-colors">
                          <span className="font-heading font-bold text-xs sm:text-sm text-ink truncate">
                            {s.label}
                          </span>
                          <span className={cn(
                            "font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-ink",
                            s.is_active ? "bg-primary text-white" : "bg-gray-soft text-gray-dark"
                          )}>
                            {s.is_active ? "AKTIF" : "ARSIP"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WINDOW 3: KATALOG MATA KULIAH */}
          {(showAll || showMaster) && (
            <div id="course-form" className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
              <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                <div className="space-y-0.5">
                  <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-ink" />
                    <span>Katalog Mata Kuliah Kurikulum</span>
                  </h2>
                  <p className="text-xs text-gray-dark font-bold">
                    Daftar mata kuliah universitas yang tersedia untuk dibuka kelas perkuliahannya oleh dosen.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
                  {courses.length} MATA KULIAH
                </span>
              </div>

              <div className="p-3.5 rounded-xl border-2 border-ink bg-gray-soft/40 shadow-xs">
                <QuickAdd
                  action={createCourseAction}
                  fields={[
                    { name: 'code', label: 'Kode Mata Kuliah', placeholder: 'TI-301' },
                    { name: 'name', label: 'Nama Mata Kuliah', placeholder: 'Pemrograman Web Lanjut' },
                    { name: 'credits', label: 'Bobot SKS', placeholder: '3' },
                  ]}
                  submitLabel="Tambah Mata Kuliah ke Katalog"
                  okMessage="Mata kuliah berhasil ditambahkan ke katalog."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {courses.slice(0, 9).map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border-2 border-ink bg-white shadow-retro-xs flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded border border-ink bg-ink text-white">
                        {c.code}
                      </span>
                      <span className="text-xs font-bold font-mono text-gray-dark">
                        {c.credits || 3} SKS
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-sm text-ink line-clamp-2">
                      {c.name}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION SPESIFIK: PANDUAN DELEGASI ASISTEN LAB & KELAS */}
          {(showKelas || showAll) && (
            <section aria-label="Delegasi Asisten Laboratorium" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg border-2 border-ink bg-gray-soft text-black shadow-xs">
                    <Layers className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-ink">
                      Pembagian Kelas & Delegasi Asisten Lab
                    </h2>
                    <p className="text-xs text-gray-dark font-medium">
                      Sebagai Staf Akademik, Anda memiliki wewenang mengesahkan Asisten Lab (ASISTEN_LAB) lintas rombel perkuliahan.
                    </p>
                  </div>
                </div>
                <Link
                  href="/staff/classes"
                  className="text-xs sm:text-sm font-bold text-black hover:underline transition-colors shrink-0"
                >
                  Buka Delegasi Kelas &rarr;
                </Link>
              </div>

              <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-ink">
                    Manajemen Asisten Laboratorium Terpadu
                  </h3>
                  <p className="text-xs text-gray-dark font-bold leading-relaxed">
                    Asisten Dosen ditugaskan langsung oleh dosen pengampu, sedangkan Asisten Laboratorium dapat ditugaskan bersama oleh Staf Akademik dan Dosen.
                  </p>
                </div>
                <Link
                  href="/staff/classes"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-ink bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all shrink-0 min-h-[44px]"
                >
                  <Layers className="h-4 w-4" />
                  <span>Kelola Asisten Lab</span>
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
      <aside
        aria-label="Panel Ringkasan & Detail BAAK"
        className="hidden xl:flex w-right-panel shrink-0 border-l-2 border-retro-border bg-retro-bg p-5 sm:p-6 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        <div className="shrink-0 w-full">
          <StaffIdentityCard
            staffName={staffName}
            nip={nip}
            programsCount={programs.length}
            semestersCount={semesters.length}
            coursesCount={courses.length}
          />
        </div>

        <StaffRightPanel
          programsCount={programs.length}
          semestersCount={semesters.length}
          coursesCount={courses.length}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
        />
      </aside>

      {/* Mode Slide-over Drawer (< 1280px / max-xl) */}
      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail BAAK"
          className="fixed inset-0 z-50 flex justify-end xl:hidden"
        >
          <div
            aria-hidden="true"
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-retro-bg border-l-2 border-retro-border h-[100dvh] flex flex-col shadow-2xl z-10 animate-slide-in-right pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex h-header items-center justify-between px-6 border-b-2 border-retro-border bg-gray-soft shrink-0">
              <span className="font-heading font-bold text-base text-foreground tracking-tight">
                Ringkasan BAAK
              </span>
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

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5 pb-24">
              <div className="shrink-0 w-full">
                <StaffIdentityCard
                  staffName={staffName}
                  nip={nip}
                  programsCount={programs.length}
                  semestersCount={semesters.length}
                  coursesCount={courses.length}
                />
              </div>
              <StaffRightPanel
                programsCount={programs.length}
                semestersCount={semesters.length}
                coursesCount={courses.length}
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
