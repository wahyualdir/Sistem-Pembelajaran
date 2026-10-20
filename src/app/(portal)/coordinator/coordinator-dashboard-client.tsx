'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ArrowRight,
  AlertTriangle,
  X,
  FileCheck,
  Award,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoordinatorIdentityCard } from '@/components/retro/coordinator-identity-card';
import { CoordinatorRightPanel } from '@/components/home/coordinator-right-panel';
import { ActionBanner } from '@/components/home/action-banner';
import { ChangeDecision } from '@/modules/academic/change-decision';
import { CoordinatorCohortRiskView } from '@/modules/early-warning/coordinator-cohort-risk-view';
import { usePortalLayout } from '@/app/(portal)/portal-shell';
import type { HomeBannerData } from '@/modules/academic/home-actions';

const COORDINATOR_CATEGORIES = [
  'Semua',
  'Persetujuan Nilai',
  'Early Warning Mahasiswa',
  'Monitoring Perkuliahan',
  'Laporan Mutu Prodi',
];

export interface ChangeRequestItem {
  id: string;
  class_id: string;
  class_title: string;
  item_id: string;
  student_id: string;
  student_name: string;
  student_nim: string;
  old_score: number | null;
  new_score: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by: string;
  requester_name: string;
  created_at: string;
  decided_at?: string;
  decision_note?: string;
}

export interface CoordinatorDashboardClientProps {
  requests: ChangeRequestItem[];
  cohortData: { cohorts: any[]; totalAtRisk: number };
  coordinatorName?: string;
  nidn?: string;
  department?: string;
}

export function CoordinatorDashboardClient({
  requests = [],
  cohortData = { cohorts: [], totalAtRisk: 0 },
  coordinatorName = 'Dr. Ir. Kaprodi Informatika, M.Kom.',
  nidn = '1005087502',
  department = 'Teknik Informatika (S1)',
}: CoordinatorDashboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const { isRightDrawerOpen, setIsRightDrawerOpen, setHasRightPanel } = usePortalLayout();
  const [rightPanelTab, setRightPanelTab] = useState<'hari-ini' | 'quick-actions'>('hari-ini');

  useEffect(() => {
    setHasRightPanel(true);
    return () => setHasRightPanel(false);
  }, [setHasRightPanel]);

  const pending = requests.filter((r) => r.status === 'PENDING');
  const approved = requests.filter((r) => r.status === 'APPROVED');
  const rejected = requests.filter((r) => r.status === 'REJECTED');

  const bannerData: HomeBannerData = {
    primary:
      pending.length > 0
        ? {
            id: 'banner-coord-pending',
            priority: 2,
            category: 'EXAM',
            title: `${pending.length} Pengajuan Revisi Nilai Menunggu Persetujuan`,
            subtitle: `Terdapat permohonan revisi nilai yang diajukan oleh dosen pengampu dan memerlukan validasi Kaprodi.`,
            buttonLabel: 'Validasi Nilai Sekarang',
            buttonHref: '#approvals-section',
            badge: 'PERLU ACC',
          }
        : {
            id: 'banner-coord-clean',
            priority: 5,
            category: 'IDLE',
            title: 'Semua Pengajuan Revisi Nilai Telah Selesai Diputuskan',
            subtitle: `Tidak ada antrean revisi nilai tertunda. Pemantauan early warning prodi siap diakses.`,
            buttonLabel: 'Cek Monitoring Angkatan',
            buttonHref: '#monitoring-section',
            badge: 'TERVALIDASI',
          },
    others: [],
    totalActive: pending.length > 0 ? 1 : 0,
    serverTime: new Date().toISOString(),
  };

  const showAll = selectedCategory === 'Semua';
  const showNilai = showAll || selectedCategory === 'Persetujuan Nilai';
  const showEWS = showAll || selectedCategory === 'Early Warning Mahasiswa';
  const showMonitoring = showAll || selectedCategory === 'Monitoring Perkuliahan';
  const showLaporan = showAll || selectedCategory === 'Laporan Mutu Prodi';

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)]">
      {/* ========================================================= */}
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA KAPRODI                 */}
      {/* ========================================================= */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA: RUANG KAPRODI */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1 border-b-2 border-black/15 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md border border-black/20 bg-black/5 text-[11px] font-sans font-bold uppercase tracking-wider text-black">
                  Portal Koordinator Program Studi
                </span>
                <span className="text-black/30 font-bold">•</span>
                <span className="text-[11px] font-sans font-bold text-black/70 uppercase">
                  {department}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg border-2 border-ink bg-surface shadow-xs flex items-center justify-center shrink-0">
                  <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-ink" />
                </div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-ink leading-none">
                  Ruang Pimpinan & Evaluasi Prodi
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-ink/80 font-bold leading-relaxed pt-0.5">
                Validasi revisi nilai mahasiswa, pemantauan mahasiswa berisiko angkatan, dan penjaminan mutu kurikulum.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white border-2 border-black text-black shadow-retro-sm">
                {pending.length} ANTREAN NILAI
              </span>
              <Link
                href="/coordinator/reports"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 font-black text-xs sm:text-sm transition-all shadow-retro cursor-pointer"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Laporan Mutu</span>
              </Link>
            </div>
          </div>

          {/* ROW 1: CATEGORIES PILLS (FILTER CHIP) */}
          <section aria-label="Kategori Kaprodi" className="space-y-2.5 sm:space-y-3">
            <h2 className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wider text-gray-dark">
              Categories
            </h2>
            <div className="flex flex-wrap items-center gap-2 pb-1.5">
              {COORDINATOR_CATEGORIES.map((cat) => {
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

          {/* ACTION BANNER */}
          <ActionBanner initialData={bannerData} />

          {/* 4 KARTU METRIK KAPRODI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm text-center flex flex-col justify-between">
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Total Pengajuan</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-black mt-1">{requests.length}</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm text-center flex flex-col justify-between">
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Menunggu ACC</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-primary mt-1">{pending.length}</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm text-center flex flex-col justify-between">
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Disetujui</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-black mt-1">{approved.length}</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm text-center flex flex-col justify-between">
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Ditolak</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-black mt-1">{rejected.length}</p>
            </div>
          </div>

          {/* SECTION: PERINGATAN DINI MAHASISWA BERISIKO PER ANGKATAN */}
          {(showAll || showEWS || showMonitoring) && (
            <div id="monitoring-section" className="space-y-4">
              <CoordinatorCohortRiskView
                cohorts={cohortData.cohorts}
                totalAtRisk={cohortData.totalAtRisk}
              />
            </div>
          )}

          {/* SECTION: ANTREAN PERSETUJUAN PERUBAHAN NILAI */}
          {(showAll || showNilai) && (
            <div id="approvals-section" className="space-y-4">
              <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
                <div className="p-4 sm:p-5 border-b-2 border-black bg-gray-soft flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
                    <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
                    <h2 className="font-heading font-black text-sm sm:text-base text-black flex items-center gap-2 ml-1">
                      <FileCheck className="h-4 w-4 text-black" />
                      <span>Pengajuan Perubahan Nilai Menunggu Keputusan</span>
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-black text-black px-2.5 py-0.5 rounded border border-black bg-white shadow-retro-sm">
                    {pending.length} Menunggu
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  {pending.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-black mx-auto" />
                      <p className="text-sm font-heading font-black text-black">
                        Tidak Ada Pengajuan Menunggu Keputusan
                      </p>
                      <p className="text-xs text-black/75 font-bold max-w-md mx-auto">
                        Semua permohonan revisi nilai mahasiswa telah diproses secara tuntas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pending.map((req) => (
                        <div
                          key={req.id}
                          className="rounded-xl border-2 border-black bg-white p-4 shadow-retro-sm space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/15 pb-2">
                            <div>
                              <span className="px-2 py-0.5 rounded border border-black bg-black text-white text-[11px] font-mono font-bold">
                                {req.class_title}
                              </span>
                              <h3 className="font-heading font-bold text-sm text-black mt-1">
                                Mahasiswa: {req.student_name} ({req.student_nim})
                              </h3>
                            </div>
                            <span className="text-xs font-mono font-bold text-black/70">
                              Dosen: {req.requester_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono font-bold">
                            <span className="px-2 py-1 rounded border border-black bg-gray-soft text-black">
                              Nilai Lama: {req.old_score ?? '-'}
                            </span>
                            <span>&rarr;</span>
                            <span className="px-2 py-1 rounded border border-black bg-black text-white">
                              Nilai Baru: {req.new_score}
                            </span>
                          </div>

                          <p className="text-xs text-black/80 font-medium bg-gray-soft/50 p-2.5 rounded-lg border border-black/15">
                            <strong>Alasan Dosen:</strong> {req.reason}
                          </p>

                          <div className="pt-1 border-t border-black/10">
                            <ChangeDecision id={req.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: RIWAYAT KEPUTUSAN */}
          {(showAll || showNilai) && requests.some((r) => r.status !== 'PENDING') && (
            <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="p-4 border-b-2 border-black bg-gray-soft flex items-center justify-between">
                <h3 className="font-heading font-black text-sm text-black">
                  Riwayat Keputusan Revisi Nilai
                </h3>
                <span className="text-xs font-mono font-bold text-black">
                  {approved.length + rejected.length} Diputuskan
                </span>
              </div>
              <div className="divide-y divide-black/10">
                {requests
                  .filter((r) => r.status !== 'PENDING')
                  .slice(0, 5)
                  .map((r) => (
                    <div key={r.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-heading font-bold text-black">
                          {r.student_name} - {r.class_title}
                        </p>
                        <p className="text-black/60 font-mono">
                          Revisi {r.old_score ?? '-'} &rarr; {r.new_score}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full font-mono font-bold border text-[11px]',
                          r.status === 'APPROVED'
                            ? 'bg-black text-white border-black'
                            : 'bg-gray-soft text-black border-black'
                        )}
                      >
                        {r.status === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL (BASELINE 480px)   */}
      {/* ========================================================= */}
      <aside
        aria-label="Panel Ringkasan & Detail Kaprodi"
        className="hidden xl:flex w-right-panel shrink-0 border-l-2 border-retro-border bg-retro-bg p-5 sm:p-6 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        <div className="shrink-0 w-full">
          <CoordinatorIdentityCard
            coordinatorName={coordinatorName}
            nidn={nidn}
            department={department}
            pendingApprovalsCount={pending.length}
            atRiskCount={cohortData.totalAtRisk}
            cohortsCount={cohortData.cohorts.length}
          />
        </div>

        <CoordinatorRightPanel
          pendingApprovalsCount={pending.length}
          approvedCount={approved.length}
          rejectedCount={rejected.length}
          atRiskCount={cohortData.totalAtRisk}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
        />
      </aside>

      {/* Mode Slide-over Drawer (< 1280px / max-xl) */}
      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail Kaprodi"
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
                Ringkasan Kaprodi
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
                <CoordinatorIdentityCard
                  coordinatorName={coordinatorName}
                  nidn={nidn}
                  department={department}
                  pendingApprovalsCount={pending.length}
                  atRiskCount={cohortData.totalAtRisk}
                  cohortsCount={cohortData.cohorts.length}
                />
              </div>
              <CoordinatorRightPanel
                pendingApprovalsCount={pending.length}
                approvedCount={approved.length}
                rejectedCount={rejected.length}
                atRiskCount={cohortData.totalAtRisk}
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
