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

const RECOMMENDED_MATERIALS = [
  {
    id: 'mat-1',
    title: 'Modul 07: REST API & Auth Supabase',
    course: 'Pemrograman Web Lanjut',
    type: 'Modul Kuliah',
    badgeColor: 'bg-retro-orange',
    accent: 'terracotta',
  },
  {
    id: 'mat-2',
    title: 'Kuis Evaluasi Algoritma Greedy',
    course: 'Struktur Data & Algoritma',
    type: 'Kuis Interaktif',
    badgeColor: 'bg-retro-purple',
    accent: 'navy',
  },
  {
    id: 'mat-3',
    title: 'Software Architecture Patterns',
    course: 'Rekayasa Perangkat Lunak',
    type: 'Buku Referensi',
    badgeColor: 'bg-retro-mint',
    accent: 'emerald',
  },
  {
    id: 'mat-4',
    title: 'Praktikum: Deep Learning Pipeline',
    course: 'Kecerdasan Buatan',
    type: 'Tugas Praktikum',
    badgeColor: 'bg-retro-yellow',
    accent: 'yellow',
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
}

export function StudentDashboardClient({
  bannerData = {
    primary: {
      id: 'banner-default',
      priority: 1,
      category: 'EXAM',
      title: 'Kuis Evaluasi Tengah Semester Web Modern',
      subtitle: 'Pemrograman Web Lanjut (TI-301) • Sisa waktu: 3 jam lagi',
      timeRemaining: '3 jam lagi',
      buttonLabel: 'Mulai Ujian',
      buttonHref: '/exams',
      badge: 'PRIORITAS UTAMA',
    },
    others: [
      {
        id: 'banner-att',
        priority: 2,
        category: 'ATTENDANCE',
        title: 'Presensi Terbuka: Pemrograman Web Lanjut',
        subtitle: 'Metode: QR Dinamis & Lokasi GPS • Batas: 10:30 WIB',
        buttonLabel: 'Absen Sekarang',
        buttonHref: '/classes',
        badge: 'PRESENSI DIBUKA',
      },
    ],
    totalActive: 2,
    serverTime: new Date().toISOString(),
  },
  deadlines = [],
  todaySchedule = [],
  activeClasses = [],
  summaryData = {
    semesterStatus: 'Aktif Berjalan',
    semesterLabel: 'Semester Ganjil 2026/2027',
    averageAttendance: '91%',
    attendanceQualified: true,
    ipk: '3.82',
    studyStreakDays: 12,
  },
  agendaItems = [],
}: StudentDashboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [courses] = useState<ActiveClassItem[]>(
    activeClasses.length > 0
      ? activeClasses
      : [
          {
            id: 'course-1',
            title: 'Pemrograman Web Lanjut',
            code: 'TI-301',
            lecturer: 'Dr. Ardiansyah, S.T., M.Kom.',
            sks: 3,
            progressPercent: 78,
            schedule: 'Senin, 08:00 - 10:30 WIB',
            room: 'Lab Komputer 2 (Hybrid)',
            attendance: '92% (Lolos Syarat UAS)',
            ratingCount: '1.8K',
            description:
              'Mata kuliah Pemrograman Web Lanjut berfokus pada arsitektur web modern, Next.js App Router, integrasi server actions, pengelolaan otentikasi peran (RBAC), serta optimasi performa dan keamanan basis data skala enterprise.',
            colorScheme: 'emerald',
            category: 'Kelas Saya',
            pendingTasksCount: 2,
            hasOpenExam: true,
          },
          {
            id: 'course-2',
            title: 'Rekayasa Perangkat Lunak',
            code: 'TI-302',
            lecturer: 'Nurul Hidayati, M.Kom.',
            sks: 3,
            progressPercent: 62,
            schedule: 'Selasa, 10:45 - 13:15 WIB',
            room: 'Ruang Teori 304',
            attendance: '88% (Lolos Syarat UAS)',
            ratingCount: '1.2K',
            description:
              'Mempelajari siklus hidup pengembangan perangkat lunak (SDLC), metode Agile Scrum, perancangan diagram UML sistematis, pengujian unit test terotomatisasi, serta pemeliharaan kode berbasis clean architecture.',
            colorScheme: 'terracotta',
            category: 'Kelas Saya',
            pendingTasksCount: 1,
            hasOpenExam: false,
          },
          {
            id: 'course-3',
            title: 'Kecerdasan Buatan & Machine Learning',
            code: 'TI-401',
            lecturer: 'Hendra Gunawan, Ph.D.',
            sks: 3,
            progressPercent: 45,
            schedule: 'Rabu, 13:30 - 16:00 WIB',
            room: 'Lab Riset AI Gedung C',
            attendance: '95% (Lolos Syarat UAS)',
            ratingCount: '2.1K',
            description:
              'Mengeksplorasi konsep kecerdasan komputasional, algoritma pencarian heuristik, jaringan saraf tiruan (neural networks), computer vision, dan implementasi model transformer untuk pemrosesan bahasa alami (NLP).',
            colorScheme: 'yellow',
            category: 'Tugas & Kuis',
            pendingTasksCount: 1,
            hasOpenExam: false,
          },
          {
            id: 'course-4',
            title: 'Basis Data Terdistribusi',
            code: 'TI-305',
            lecturer: 'Fajar Ramadhan, M.Kom.',
            sks: 3,
            progressPercent: 50,
            schedule: 'Kamis, 08:00 - 10:30 WIB',
            room: 'Lab Basis Data 1',
            attendance: '85% (Lolos Syarat UAS)',
            ratingCount: '950',
            description:
              'Membahas pemodelan data relasional dan non-relasional terdistribusi, replikasi data multi-region, partisi tabel, ACID vs BASE theorem, serta strategi indeks performa tinggi pada volume data besar.',
            colorScheme: 'navy',
            category: 'Presensi',
            pendingTasksCount: 1,
            hasOpenExam: false,
          },
          {
            id: 'course-5',
            title: 'Keamanan Siber & Kriptografi',
            code: 'TI-408',
            lecturer: 'Rina Fitriani, M.Kom.',
            sks: 2,
            progressPercent: 85,
            schedule: 'Jumat, 08:30 - 10:10 WIB',
            room: 'Ruang Cyber Defense',
            attendance: '90% (Lolos Syarat UAS)',
            ratingCount: '1.5K',
            description:
              'Prinsip keamanan sistem informasi, kriptografi simetris & asimetris, enkripsi data in-transit, analisis kerentanan OWASP Top 10, penetration testing etis, dan penerapan protokol autentikasi multi-faktor.',
            colorScheme: 'dark',
            category: 'Ujian',
            pendingTasksCount: 0,
            hasOpenExam: false,
          },
        ]
  );

  const { isRightDrawerOpen, setIsRightDrawerOpen, setHasRightPanel } = usePortalLayout();
  const [selectedCourse, setSelectedCourse] = useState<ActiveClassItem>(courses[0]);
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
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-36 sm:pb-40 lg:pb-44 min-w-0">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA: RUANG PEMBELAJARAN MAHASISWA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground flex items-center gap-2.5">
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-retro-orange inline-block" />
                Ruang Pembelajaran Mahasiswa
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Pantau perkuliahan aktif, jadwal kuliah hari ini, tenggat tugas, dan ujian Anda.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-retro-warm border-2 border-retro-border text-foreground shadow-xs">
                SEMESTER AKTIF 2026/2027
              </span>
            </div>
          </div>

          {/* ROW 1: CATEGORIES PILLS (FILTER CHIP) */}
          <section aria-label="Kategori Perkuliahan" className="space-y-2.5 sm:space-y-3">
            <h2 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground">
              Categories
            </h2>
            <div className="flex flex-wrap items-center gap-2 pb-1.5">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-black tracking-tight shrink-0 transition-all focus-visible:outline-none',
                      isActive
                        ? 'border-2 border-retro-border bg-black text-white shadow-retro scale-[1.02]'
                        : 'border-2 border-retro-border bg-retro-surface text-foreground shadow-retro hover:bg-retro-warm hover:-translate-y-0.5'
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 1: BANNER AKSI (SELALU TAMPIL PADA SEMUA FILTER) */}
          <ActionBanner
            initialData={bannerData}
            onRefresh={async () => getHomeBannerAction()}
          />

          {/* SECTION: KARTU LANJUTKAN BELAJAR (Tampil pada Semua, Kelas Saya, Tugas & Kuis) */}
          {(showAll || showKelasSaya || showTugasKuis) && (
            <section aria-label="Lanjutkan Belajar" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-black text-xl sm:text-2xl tracking-tight text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-retro-orange inline-block" />
                  Lanjutkan Belajar
                </h2>
                <Link
                  href="/mahasiswa/tugas"
                  className="text-xs sm:text-sm font-black text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lihat Semua Materi &rarr;
                </Link>
              </div>

              {materiTerakhir ? (
                <div className="rounded-xl border-2 border-retro-border bg-retro-surface p-4 sm:p-5 shadow-retro flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-retro-warm border border-retro-border text-foreground">
                        {materiTerakhir.kelas.kode}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground truncate">
                        {materiTerakhir.kelas.namaMataKuliah}
                      </span>
                      {materiTerakhir.progres.selesai ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-success-soft text-success border border-success-border">
                          <CheckCircle2 className="h-3 w-3" />
                          Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-retro-yellow text-black border border-black">
                          <Clock className="h-3 w-3" />
                          Sedang Dipelajari
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-black text-lg sm:text-xl text-foreground line-clamp-1">
                      {materiTerakhir.materi.judul}
                    </h3>

                    <p className="text-xs text-muted-foreground font-medium">
                      Terakhir dibuka:{' '}
                      {new Date(materiTerakhir.progres.terakhirDibuka).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <Link
                    href="/mahasiswa/tugas"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-retro-border bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all shrink-0 min-h-[44px]"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Buka Materi</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-retro-border bg-retro-surface/50 p-6 text-center space-y-2">
                  <BookOpen className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                  <p className="text-sm font-bold text-foreground">
                    Belum Ada Materi yang Sedang Dipelajari
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Mulai eksplorasi bahan ajar dan modul perkuliahan aktif untuk melacak progres belajar Anda.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/mahasiswa/tugas"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-retro-border bg-retro-surface text-foreground hover:bg-retro-warm text-xs font-bold shadow-retro transition-all min-h-[44px]"
                    >
                      <span>Buka Daftar Materi Kuliah</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SECTION 2: TENGGAT TERDEKAT (Tampil pada Semua, Tugas & Kuis, Ujian) */}
          {(showAll || showTugasKuis || showUjian) && (
            <NearestDeadlines initialItems={deadlines} />
          )}

          {/* SECTION: RINGKASAN PRESENSI PEMBELAJARAN (Tampil saat kategori Presensi atau Semua) */}
          {(showAll || showPresensi) && (
            <section aria-label="Presensi Pembelajaran" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg border-2 border-retro-border bg-retro-warm text-black shadow-xs">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-xl sm:text-2xl tracking-tight text-foreground">
                      Presensi & Kehadiran Perkuliahan
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium">
                      Pantau kehadiran real-time, lakukan check-in GPS/QR, dan pastikan batas syarat UAS (minimal 75%).
                    </p>
                  </div>
                </div>
                <Link
                  href="/attendance"
                  className="text-xs sm:text-sm font-black text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  Buka Presensi Terpadu &rarr;
                </Link>
              </div>

              {/* Grid Status Presensi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Kartu 1: Rata-rata Kehadiran */}
                <div className="rounded-xl border-2 border-retro-border bg-retro-surface p-4 sm:p-5 shadow-retro space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-muted-foreground">
                      Rata-Rata Kehadiran
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-success-soft text-success border border-success-border">
                      <CheckCircle2 className="h-3 w-3" /> Lolos Syarat UAS
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-heading font-black text-foreground">
                      {summaryData?.averageAttendance || '91%'}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      dari 5 Mata Kuliah Aktif
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full border border-black bg-retro-warm overflow-hidden">
                    <div
                      className="bg-black h-full rounded-full transition-all duration-500"
                      style={{ width: summaryData?.averageAttendance || '91%' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Batas minimal institusi: <strong>75%</strong> untuk memperoleh kartu ujian.
                  </p>
                </div>

                {/* Kartu 2: Sesi Presensi Aktif Hari Ini */}
                <div className="rounded-xl border-2 border-retro-border bg-retro-warm/40 p-4 sm:p-5 shadow-retro space-y-3 md:col-span-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-black bg-retro-mint text-black border border-black animate-pulse">
                        ● SESI AKTIF TERBUKA
                      </span>
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        Tutup: 10:30 WIB (25 menit lagi)
                      </span>
                    </div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-foreground pt-1">
                      Pemrograman Web Lanjut (TI-301) — Pertemuan #7
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      Metode: <strong>QR Dinamis + Validasi Radius GPS Haversine (50m)</strong> di Lab Komputer 2.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-black/10">
                    <span className="text-xs font-mono font-bold text-black/80">
                      Ruang: Lab Komputer 2 (Hybrid)
                    </span>
                    <Link
                      href="/attendance"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-retro-border bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all shrink-0 min-h-[40px]"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Klaim Presensi Sekarang</span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3: JADWAL HARI INI (Tampil pada Semua, Presensi, Jadwal) */}
          {(showAll || showPresensi || showJadwal) && (
            <TodaySchedule items={todaySchedule} />
          )}

          {/* SECTION 4: KELAS AKTIF (Tampil pada Semua, Kelas Saya, Nilai, Presensi) */}
          {(showAll || showKelasSaya || showNilai || showPresensi) && (
            <ActiveClassesGrid
              courses={courses}
              selectedCourse={selectedCourse}
              onSelectCourse={handleSelectCourse}
            />
          )}

          {/* SECTION 5: RECOMMENDED / MATERI & TUGAS (Tampil pada Semua, Tugas & Kuis) */}
          {(showAll || showTugasKuis) && (
            <section aria-label="Materi dan Tugas Kuliah" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
                  Recommended / Materi & Tugas
                </h2>
                <Link
                  href="/classes"
                  className="text-base sm:text-lg font-black text-muted-foreground hover:text-foreground transition-colors"
                >
                  more &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {RECOMMENDED_MATERIALS.map((mat) => (
                  <Link
                    key={mat.id}
                    href="/classes"
                    className="group rounded-2xl border-2 border-retro-border bg-retro-surface p-5 sm:p-6 shadow-retro hover:-translate-y-1 hover:shadow-retro-md transition-all flex flex-col justify-between"
                  >
                    <div
                      className={cn(
                        'relative w-full aspect-[16/10] rounded-xl border-2 border-retro-border overflow-hidden mb-5 p-5 flex flex-col items-center justify-center text-center',
                        mat.accent === 'yellow' ? 'bg-retro-yellow text-black' : 'bg-black text-white'
                      )}
                    >
                      <div
                        className={cn(
                          'w-18 h-18 rounded-full border-2 flex items-center justify-center mb-2.5',
                          mat.accent === 'yellow' ? 'border-black/30 bg-black/5' : 'border-white/40 bg-white/10'
                        )}
                      >
                        <BookOpen className="h-9 w-9" />
                      </div>
                      <span className="text-xs sm:text-sm font-sans font-black tracking-wider uppercase">
                        {mat.type}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-heading font-black text-xl text-black line-clamp-2 leading-snug group-hover:underline transition-colors">
                        {mat.title}
                      </h4>
                      <p className="text-base text-black truncate font-bold">
                        {mat.course}
                      </p>
                    </div>
                  </Link>
                ))}
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
        aria-label="Panel Ringkasan & Detail"
        className="hidden xl:flex w-right-panel shrink-0 border-l-2 border-retro-border bg-retro-bg p-5 sm:p-6 space-y-6 flex-col sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-48 sm:pb-52"
      >
        {/* BAGIAN 2 ELEMEN BEKU: KARTU LOGO TEKNOLOGI (BASELINE IDENTIK 402x351) */}
        <div className="shrink-0 w-full">
          <UirLogo3D />
        </div>

        {/* PENGALIH DUA KONDISI: "Hari Ini" & "Detail Kelas" DI BAWAH KARTU LOGO */}
        <RightPanelSwitcher
          selectedCourse={selectedCourse}
          summary={summaryData}
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
          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-retro-bg border-l-2 border-retro-border h-[100dvh] flex flex-col shadow-2xl z-10 animate-slide-in-right pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)]">
            {/* Header Drawer */}
            <div className="flex h-header items-center justify-between px-6 border-b-2 border-retro-border bg-retro-warm shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base text-foreground tracking-tight">
                  Ringkasan & Detail
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRightDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-retro-border bg-retro-surface text-foreground hover:bg-retro-warm shadow-retro-sm active:translate-y-0.5 transition-all focus-visible:outline-none cursor-pointer"
                title="Tutup Panel (Esc)"
                aria-label="Tutup Panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Konten Scrollable Internal */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 pb-48 sm:pb-52">
              <div className="shrink-0 w-full">
                <UirLogo3D />
              </div>
              <RightPanelSwitcher
                selectedCourse={selectedCourse}
                summary={summaryData}
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
