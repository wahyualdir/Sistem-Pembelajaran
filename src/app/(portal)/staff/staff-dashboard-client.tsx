'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  CalendarDays,
  BookOpen,
  X,
  Layers,
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

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)]">
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA STAF BAAK */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA & FILTER TERPADU STAF AKADEMIK */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-[#D6D3CB]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#853827]">
                <span>PORTAL STAF ADMINISTRASI AKADEMIK</span>
                <span className="text-[#B8B1A5]">•</span>
                <span className="text-[#57534E]">BAAK</span>
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-[#1C1917]">
                Biro Administrasi Akademik
              </h1>
            </div>

            <nav aria-label="Kategori BAAK" className="flex flex-wrap items-center gap-1.5">
              {STAFF_CATEGORIES.map((cat) => {
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

          {/* 3 KARTU METRIK RINGKASAN BAAK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] text-[#C2553A]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Program Studi</p>
                <p className="font-heading font-bold text-2xl text-[#1C1917] leading-tight">{programs.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] text-[#C2553A]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Semester Akademik</p>
                <p className="font-heading font-bold text-2xl text-[#1C1917] leading-tight">{semesters.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] text-[#C2553A]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Katalog Mata Kuliah</p>
                <p className="font-heading font-bold text-2xl text-[#1C1917] leading-tight">{courses.length}</p>
              </div>
            </div>
          </div>

          {/* GRID 2 KOLOM MASTER: PRODI & SEMESTER */}
          {(showAll || showMaster) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div id="prodi-form" className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E5DE] pb-3">
                  <div className="space-y-0.5">
                    <h2 className="font-heading font-bold text-base text-[#1C1917] flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#C2553A]" />
                      <span>Program Studi</span>
                    </h2>
                    <p className="text-xs text-[#57534E]">Tambah kode dan nama program studi baru.</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#FAF8F5] border border-[#D6D3CB] text-xs font-mono font-semibold text-[#1C1917]">
                    {programs.length} PRODI
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5]">
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

                <div className="space-y-2 pt-1">
                  <h3 className="text-xs font-mono font-semibold text-[#57534E] uppercase">
                    Daftar Program Studi Terdaftar
                  </h3>
                  <div className="divide-y divide-[#E8E5DE] border border-[#D6D3CB] rounded-xl overflow-hidden bg-[#FFFFFF]">
                    {programs.length === 0 ? (
                      <p className="p-4 text-xs text-[#57534E] text-center">Belum ada program studi.</p>
                    ) : (
                      programs.map((p) => (
                        <div key={p.id} className="p-3 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#1C1917] text-white">
                            {p.code}
                          </span>
                          <span className="font-heading font-semibold text-xs sm:text-sm text-[#1C1917] truncate ml-2">
                            {p.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div id="semester-form" className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E5DE] pb-3">
                  <div className="space-y-0.5">
                    <h2 className="font-heading font-bold text-base text-[#1C1917] flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#C2553A]" />
                      <span>Semester Akademik</span>
                    </h2>
                    <p className="text-xs text-[#57534E]">Buka periode semester ganjil/genap baru.</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#FAF8F5] border border-[#D6D3CB] text-xs font-mono font-semibold text-[#1C1917]">
                    {semesters.length} PERIODE
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5]">
                  <QuickAdd
                    action={createSemesterAction}
                    fields={[
                      { name: 'label', label: 'Label Semester', placeholder: '2026/2027 Ganjil' },
                    ]}
                    submitLabel="Buka Semester Baru"
                    okMessage="Semester akademik berhasil disimpan."
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <h3 className="text-xs font-mono font-semibold text-[#57534E] uppercase">
                    Periode Semester Akademik
                  </h3>
                  <div className="divide-y divide-[#E8E5DE] border border-[#D6D3CB] rounded-xl overflow-hidden bg-[#FFFFFF]">
                    {semesters.length === 0 ? (
                      <p className="p-4 text-xs text-[#57534E] text-center">Belum ada semester akademik.</p>
                    ) : (
                      semesters.map((s) => (
                        <div key={s.id} className="p-3 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors">
                          <span className="font-heading font-semibold text-xs sm:text-sm text-[#1C1917] truncate">
                            {s.label}
                          </span>
                          <span
                            className={cn(
                              'font-mono font-bold text-[10px] px-2 py-0.5 rounded',
                              s.is_active ? 'bg-[#C2553A] text-white' : 'bg-[#ECE9D8] text-[#57534E]'
                            )}
                          >
                            {s.is_active ? 'AKTIF' : 'ARSIP'}
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
            <div id="course-form" className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E5DE] pb-3">
                <div className="space-y-0.5">
                  <h2 className="font-heading font-bold text-base text-[#1C1917] flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#C2553A]" />
                    <span>Katalog Mata Kuliah Kurikulum</span>
                  </h2>
                  <p className="text-xs text-[#57534E]">
                    Daftar mata kuliah yang tersedia untuk dibuka kelas perkuliahannya oleh dosen.
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#FAF8F5] border border-[#D6D3CB] text-xs font-mono font-semibold text-[#1C1917]">
                  {courses.length} MATA KULIAH
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5]">
                <QuickAdd
                  action={createCourseAction}
                  fields={[
                    { name: 'code', label: 'Kode Mata Kuliah', placeholder: 'IF2104' },
                    { name: 'name', label: 'Nama Mata Kuliah', placeholder: 'Pemrograman Berorientasi Objek' },
                    { name: 'credits', label: 'Bobot SKS', placeholder: '3' },
                  ]}
                  submitLabel="Tambah Mata Kuliah ke Katalog"
                  okMessage="Mata kuliah berhasil ditambahkan ke katalog."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {courses.slice(0, 9).map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#D6D3CB] text-[#853827]">
                        {c.code}
                      </span>
                      <span className="text-xs font-semibold font-mono text-[#57534E]">
                        {c.credits || 3} SKS
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-sm text-[#1C1917] line-clamp-2">
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
              <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#1C1917]">
                    Manajemen Asisten Laboratorium Terpadu
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Asisten Dosen ditugaskan langsung oleh dosen pengampu, sedangkan Asisten Laboratorium dapat ditugaskan bersama oleh Staf Akademik dan Dosen.
                  </p>
                </div>
                <Link
                  href="/staff/classes"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C1917] text-white hover:bg-[#C2553A] text-xs font-semibold transition-colors shrink-0"
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

      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL */}
      <aside
        aria-label="Panel Ringkasan & Detail BAAK"
        className="hidden xl:flex w-right-panel shrink-0 border-l border-[#D6D3CB] bg-[#FAF8F5] p-5 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        <StaffRightPanel
          programsCount={programs.length}
          semestersCount={semesters.length}
          coursesCount={courses.length}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
        />

        <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
          <StaffIdentityCard
            staffName={staffName}
            nip={nip}
            programsCount={programs.length}
            semestersCount={semesters.length}
            coursesCount={courses.length}
          />
        </div>
      </aside>

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

          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-[#FAF8F5] border-l border-[#D6D3CB] h-[100dvh] flex flex-col shadow-2xl z-10 animate-slide-in-right">
            <div className="flex h-header items-center justify-between px-6 border-b border-[#D6D3CB] bg-[#ECE9D8] shrink-0">
              <span className="font-heading font-bold text-base text-[#1C1917] tracking-tight">
                Ringkasan BAAK
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
              <StaffRightPanel
                programsCount={programs.length}
                semestersCount={semesters.length}
                coursesCount={courses.length}
                activeTab={rightPanelTab}
                onTabChange={setRightPanelTab}
              />
              <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
                <StaffIdentityCard
                  staffName={staffName}
                  nip={nip}
                  programsCount={programs.length}
                  semestersCount={semesters.length}
                  coursesCount={courses.length}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
