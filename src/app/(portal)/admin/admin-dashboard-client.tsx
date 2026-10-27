'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Lock,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminIdentityCard } from '@/components/retro/admin-identity-card';
import { AdminRightPanel } from '@/components/home/admin-right-panel';
import { ActionBanner } from '@/components/home/action-banner';
import { ImpersonateUserCard } from './impersonate-user-card';
import { usePortalLayout } from '@/app/(portal)/portal-shell';
import type { HomeBannerData } from '@/modules/academic/home-actions';

const ADMIN_CATEGORIES = [
  'Semua',
  'Audit Keamanan',
  'Sesi Login',
  'Impersonasi Pengguna',
  'Kebijakan & Role',
];

export interface AdminDashboardClientProps {
  auditLogs: any[];
  loginEvents: any[];
  adminName?: string;
  roleTitle?: string;
}

export function AdminDashboardClient({
  auditLogs = [],
  loginEvents = [],
  adminName = 'Super Administrator',
  roleTitle = 'Pusat Keamanan & Audit Sistem',
}: AdminDashboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const { isRightDrawerOpen, setIsRightDrawerOpen, setHasRightPanel } = usePortalLayout();
  const [rightPanelTab, setRightPanelTab] = useState<'keamanan' | 'quick-actions'>('keamanan');

  useEffect(() => {
    setHasRightPanel(true);
    return () => setHasRightPanel(false);
  }, [setHasRightPanel]);

  const totalLogs = auditLogs.length;
  const totalLogins = loginEvents.length;

  const bannerData: HomeBannerData = {
    primary: {
      id: 'banner-admin-security',
      priority: 5,
      category: 'IDLE',
      title: 'Seluruh Layanan Portal Akademik Berjalan Normal & Aman',
      subtitle: 'Audit log append-only aktif, isolasi multi-peran tervalidasi, dan seluruh tabel dilindungi Row Level Security (RLS).',
      buttonLabel: 'Cek Audit Trail Sistem',
      buttonHref: '/admin/system',
      badge: 'SISTEM NORMAL',
    },
    others: [],
    totalActive: 1,
    serverTime: new Date().toISOString(),
  };

  const showAll = selectedCategory === 'Semua';
  const showAudit = showAll || selectedCategory === 'Audit Keamanan';
  const showLogins = showAll || selectedCategory === 'Sesi Login';
  const showImpersonate = showAll || selectedCategory === 'Impersonasi Pengguna';

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-var(--layout-header-height-mobile))] lg:min-h-[calc(100dvh-var(--layout-header-height))]">
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA ADMINISTRATOR */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA & FILTER TERPADU ADMINISTRATOR */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b border-[#D6D3CB]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#853827]">
                <span>PUSAT KENDALI ADMINISTRATOR SISTEM</span>
                <span className="text-[#B8B1A5]">•</span>
                <span className="text-[#57534E]">SUPER ADMIN</span>
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-[#1C1917]">
                Audit &amp; Keamanan Portal Akademik
              </h1>
            </div>

            <nav aria-label="Kategori Administrator" className="flex flex-wrap items-center gap-1.5">
              {ADMIN_CATEGORIES.map((cat) => {
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

          {/* 4 KARTU METRIK KEAMANAN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF]">
              <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Peristiwa Audit</p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-[#1C1917] mt-1">{totalLogs}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF]">
              <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Sesi Login Aktif</p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-[#C2553A] mt-1">{totalLogins}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF]">
              <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Status Proteksi</p>
              <p className="font-heading font-bold text-base sm:text-lg text-[#059669] mt-2">TERLINDUNGI</p>
            </div>
            <div className="p-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF]">
              <p className="text-xs font-mono font-semibold text-[#57534E] uppercase">Integritas Log</p>
              <p className="font-heading font-bold text-base sm:text-lg text-[#1C1917] mt-2">APPEND-ONLY</p>
            </div>
          </div>

          {/* GRID DUA WINDOW: AUDIT LOGS & LOGIN EVENTS */}
          {(showAll || showAudit || showLogins) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {(showAll || showAudit) && (
                <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E8E5DE] pb-3">
                    <div className="space-y-0.5">
                      <h2 className="font-heading font-bold text-base text-[#1C1917] flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#C2553A]" />
                        <span>Catatan Audit Sistem Sensitif</span>
                      </h2>
                      <p className="text-xs text-[#57534E]">10 Peristiwa Terakhir (Append-Only)</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#D6D3CB] text-[11px] font-mono font-semibold text-[#1C1917]">
                      IMMUTABLE
                    </span>
                  </div>

                  {!auditLogs || auditLogs.length === 0 ? (
                    <p className="text-xs text-[#57534E] py-6 text-center border border-dashed border-[#D6D3CB] rounded-xl bg-[#FAF8F5]">
                      Belum ada catatan audit tercatat.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E8E5DE] border border-[#D6D3CB] rounded-xl overflow-hidden bg-[#FFFFFF]">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-3 hover:bg-[#FAF8F5] transition-colors">
                          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#57534E] mb-1">
                            <span>{new Date(log.created_at).toLocaleTimeString('id-ID')} WIB</span>
                            <span className="px-1.5 py-0.5 rounded border border-[#D6D3CB] bg-[#FAF8F5] text-[#1C1917]">
                              {log.action}
                            </span>
                          </div>
                          <p className="font-heading font-semibold text-xs sm:text-sm text-[#1C1917] truncate">
                            {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(showAll || showLogins) && (
                <div className="rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E8E5DE] pb-3">
                    <div className="space-y-0.5">
                      <h2 className="font-heading font-bold text-base text-[#1C1917] flex items-center gap-2">
                        <Lock className="h-4 w-4 text-[#C2553A]" />
                        <span>Aktivitas Login Real-time</span>
                      </h2>
                      <p className="text-xs text-[#57534E]">Autentikasi &amp; Jejak IP Perangkat</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#D6D3CB] text-[11px] font-mono font-semibold text-[#1C1917]">
                      TERPANTAU
                    </span>
                  </div>

                  {!loginEvents || loginEvents.length === 0 ? (
                    <p className="text-xs text-[#57534E] py-6 text-center border border-dashed border-[#D6D3CB] rounded-xl bg-[#FAF8F5]">
                      Belum ada log aktivitas login tersimpan.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E8E5DE] border border-[#D6D3CB] rounded-xl overflow-hidden bg-[#FFFFFF]">
                      {loginEvents.map((evt) => (
                        <div key={evt.id} className="p-3 hover:bg-[#FAF8F5] transition-colors">
                          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#57534E] mb-1">
                            <span>{new Date(evt.created_at).toLocaleTimeString('id-ID')} WIB</span>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[11px]',
                                evt.status === 'SUCCESS'
                                  ? 'bg-[#E8F5E9] text-[#065F46]'
                                  : 'bg-[#FEF2F2] text-[#991B1B]'
                              )}
                            >
                              {evt.status}
                            </span>
                          </div>
                          <p className="font-heading font-semibold text-xs sm:text-sm text-[#1C1917] truncate">
                            {evt.profiles?.full_name || 'Pengguna Tidak Dikenal'} ({evt.profiles?.email || 'No email'})
                          </p>
                          <p className="text-[11px] font-mono text-[#57534E] mt-0.5">
                            IP: {evt.ip_address || '127.0.0.1'} • {evt.user_agent ? evt.user_agent.slice(0, 32) : 'Browser Client'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* IMPERSONATE USER CARD */}
          {(showAll || showImpersonate) && (
            <div className="pt-1">
              <ImpersonateUserCard />
            </div>
          )}
        </div>
      </div>

      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL */}
      <aside
        aria-label="Panel Ringkasan & Detail Administrator"
        className="hidden lg:flex w-right-panel shrink-0 border-l border-[#D6D3CB] bg-[#FAF8F5] p-5 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        <AdminRightPanel
          auditLogsCount={totalLogs}
          loginEventsCount={totalLogins}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
        />

        <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
          <AdminIdentityCard
            adminName={adminName}
            roleTitle={roleTitle}
            auditLogsCount={totalLogs}
            loginEventsCount={totalLogins}
          />
        </div>
      </aside>

      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail Administrator"
          className="fixed inset-0 z-50 flex justify-end lg:hidden"
        >
          <div
            aria-hidden="true"
            onClick={() => setIsRightDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full max-w-[22rem] sm:w-right-panel bg-[#FAF8F5] border-l border-[#D6D3CB] h-[100dvh] flex flex-col shadow-2xl z-10 animate-slide-in-right">
            <div className="flex h-header items-center justify-between px-6 border-b border-[#D6D3CB] bg-[#ECE9D8] shrink-0">
              <span className="font-heading font-bold text-base text-[#1C1917] tracking-tight">
                Ringkasan Keamanan Admin
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
              <AdminRightPanel
                auditLogsCount={totalLogs}
                loginEventsCount={totalLogins}
                activeTab={rightPanelTab}
                onTabChange={setRightPanelTab}
              />
              <div className="shrink-0 w-full pt-2 border-t border-[#E8E5DE]">
                <AdminIdentityCard
                  adminName={adminName}
                  roleTitle={roleTitle}
                  auditLogsCount={totalLogs}
                  loginEventsCount={totalLogins}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
