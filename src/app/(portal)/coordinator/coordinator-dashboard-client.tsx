'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  X,
  FileCheck,
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

const coordinatorCategories = [
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
  isSecretary?: boolean;
  canApprove?: boolean;
}

export function CoordinatorDashboardClient({
  requests = [],
  cohortData = { cohorts: [], totalAtRisk: 0 },
  coordinatorName = 'Dr. Ir. Kaprodi Informatika, M.Kom.',
  nidn = '1005087502',
  department = 'Teknik Informatika (S1)',
  isSecretary = false,
  canApprove = true,
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

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)]">
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA KAPRODI */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA & FILTER TERPADU KAPRODI */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-[#D6D3CB]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#853827]">
                <span>{isSecretary ? 'PORTAL SEKRETARIS PROGRAM STUDI' : 'PORTAL KOORDINATOR PROGRAM STUDI'}</span>
                <span className="text-[#B8B1A5]">•</span>
                <span className="text-[#57534E]">{department}</span>
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-[#1C1917]">
                {isSecretary ? 'Ruang Operasional & Verifikasi Prodi' : 'Ruang Pimpinan & Evaluasi Prodi'}
              </h1>
            </div>

            <nav aria-label="Kategori Kaprodi" className="flex flex-wrap items-center gap-1.5">
              {coordinatorCategories.map((cat) => {
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

          {/* ACTION BANNER */}
          <ActionBanner initialData={bannerData} />

          {/* 4 KARTU METRIK KAPRODI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex flex-col justify-between">
              <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Total Pengajuan</p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-[#1C1917] mt-1">{requests.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex flex-col justify-between">
              <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Menunggu ACC</p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-[#C2553A] mt-1">{pending.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex flex-col justify-between">
              <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Disetujui</p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-[#1C1917] mt-1">{approved.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] flex flex-col justify-between">
              <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Ditolak</p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-[#1C1917] mt-1">{rejected.length}</p>
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
              <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] overflow-hidden">
                <div className="p-4 border-b border-[#E8E5DE] bg-[#FAF8F5] flex items-center justify-between">
                  <h2 className="font-heading font-bold text-sm sm:text-base text-[#1C1917] flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-[#C2553A]" />
                    <span>Pengajuan Perubahan Nilai Menunggu Keputusan</span>
                  </h2>
                  <span className="text-xs font-mono font-bold text-[#853827] px-2.5 py-0.5 rounded border border-[#D6D3CB] bg-[#FFFFFF]">
                    {pending.length} Menunggu
                  </span>
                </div>

                <div className="p-4">
                  {pending.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-[#D6D3CB] bg-[#FAF8F5] space-y-2">
                      <CheckCircle2 className="h-7 w-7 text-[#059669] mx-auto" />
                      <p className="text-sm font-heading font-bold text-[#1C1917]">
                        Tidak Ada Pengajuan Menunggu Keputusan
                      </p>
                      <p className="text-xs text-[#57534E] max-w-md mx-auto">
                        Semua permohonan revisi nilai mahasiswa telah diproses secara tuntas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {pending.map((req) => (
                        <div
                          key={req.id}
                          className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E5DE] pb-2">
                            <div>
                              <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#D6D3CB] text-[#853827] text-[11px] font-mono font-bold">
                                {req.class_title}
                              </span>
                              <h3 className="font-heading font-bold text-sm text-[#1C1917] mt-1">
                                Mahasiswa: {req.student_name} ({req.student_nim})
                              </h3>
                            </div>
                            <span className="text-xs font-mono font-semibold text-[#57534E]">
                              Dosen: {req.requester_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono font-bold">
                            <span className="px-2 py-1 rounded border border-[#D6D3CB] bg-[#FAF8F5] text-[#1C1917]">
                              Nilai Lama: {req.old_score ?? '-'}
                            </span>
                            <span>&rarr;</span>
                            <span className="px-2 py-1 rounded bg-[#1C1917] text-white">
                              Nilai Baru: {req.new_score}
                            </span>
                          </div>

                          <p className="text-xs text-[#44403C] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E8E5DE]">
                            <strong>Alasan Dosen:</strong> {req.reason}
                          </p>

                          <div className="pt-1 border-t border-[#E8E5DE]">
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
            <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] overflow-hidden">
              <div className="p-4 border-b border-[#E8E5DE] bg-[#FAF8F5] flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#1C1917]">
                  Riwayat Keputusan Revisi Nilai
                </h3>
                <span className="text-xs font-mono font-semibold text-[#57534E]">
                  {approved.length + rejected.length} Diputuskan
                </span>
              </div>
              <div className="divide-y divide-[#E8E5DE]">
                {requests
                  .filter((r) => r.status !== 'PENDING')
                  .slice(0, 5)
                  .map((r) => (
                    <div key={r.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-heading font-bold text-[#1C1917]">
                          {r.student_name} — {r.class_title}
                        </p>
                        <p className="text-[#57534E] font-mono">
                          Revisi {r.old_score ?? '-'} &rarr; {r.new_score}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded font-mono font-bold text-[11px]',
                          r.status === 'APPROVED'
                            ? 'bg-[#E8F5E9] text-[#065F46]'
                            : 'bg-[#FEF2F2] text-[#991B1B]'
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

      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL */}
      <aside
        aria-label="Panel Ringkasan & Detail Kaprodi"
        className="hidden xl:flex w-right-panel shrink-0 border-l border-[#D6D3CB] bg-[#FAF8F5] p-5 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        <CoordinatorRightPanel
          pendingApprovalsCount={pending.length}
          approvedCount={approved.length}
          rejectedCount={rejected.length}
          atRiskCount={cohortData.totalAtRisk}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
        />

        <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
          <CoordinatorIdentityCard
            coordinatorName={coordinatorName}
            nidn={nidn}
            department={department}
            pendingApprovalsCount={pending.length}
            atRiskCount={cohortData.totalAtRisk}
            cohortsCount={cohortData.cohorts.length}
          />
        </div>
      </aside>

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

          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-[#FAF8F5] border-l border-[#D6D3CB] h-[100dvh] flex flex-col shadow-2xl z-10 animate-slide-in-right">
            <div className="flex h-header items-center justify-between px-6 border-b border-[#D6D3CB] bg-[#ECE9D8] shrink-0">
              <span className="font-heading font-bold text-base text-[#1C1917] tracking-tight">
                Ringkasan Kaprodi
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
              <CoordinatorRightPanel
                pendingApprovalsCount={pending.length}
                approvedCount={approved.length}
                rejectedCount={rejected.length}
                atRiskCount={cohortData.totalAtRisk}
                activeTab={rightPanelTab}
                onTabChange={setRightPanelTab}
              />
              <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
                <CoordinatorIdentityCard
                  coordinatorName={coordinatorName}
                  nidn={nidn}
                  department={department}
                  pendingApprovalsCount={pending.length}
                  atRiskCount={cohortData.totalAtRisk}
                  cohortsCount={cohortData.cohorts.length}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
