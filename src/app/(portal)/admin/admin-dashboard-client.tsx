'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  FileText,
  Lock,
  Server,
  Activity,
  CheckCircle2,
  X,
  UserCheck,
  ChevronRight,
  ShieldCheck,
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
      subtitle: 'Audit log append-only aktif, isolasi multi-peran tervalidasi, dan 147 tabel dilindungi Row Level Security (RLS).',
      buttonLabel: 'Cek Audit Trail Sistem',
      buttonHref: '/admin/system',
      badge: 'SECURITY 100%',
    },
    others: [],
    totalActive: 1,
    serverTime: new Date().toISOString(),
  };

  const showAll = selectedCategory === 'Semua';
  const showAudit = showAll || selectedCategory === 'Audit Keamanan';
  const showLogins = showAll || selectedCategory === 'Sesi Login';
  const showImpersonate = showAll || selectedCategory === 'Impersonasi Pengguna';
  const showPolicies = showAll || selectedCategory === 'Kebijakan & Role';

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-72px)]">
      {/* ========================================================= */}
      {/* 1. BAGIAN TENGAH: WORKSPACE UTAMA ADMINISTRATOR           */}
      {/* ========================================================= */}
      <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
        <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
          {/* HEADER BERANDA: AUDIT & KEAMANAN */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1 border-b-2 border-black/15 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md border border-black/20 bg-black/5 text-[11px] font-sans font-bold uppercase tracking-wider text-black">
                  Pusat Kendali Administrator Sistem
                </span>
                <span className="text-black/30 font-bold">•</span>
                <span className="text-[11px] font-sans font-bold text-black/70 uppercase">
                  ROOT / SUPER ADMIN
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg border-2 border-ink bg-surface shadow-xs flex items-center justify-center shrink-0">
                  <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6 text-ink" />
                </div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-ink leading-none">
                  Audit & Keamanan Portal SIAJAR
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-ink/80 font-bold leading-relaxed pt-0.5">
                Pantau integritas platform, jejak audit append-only yang tidak dapat dimanipulasi, dan aktivitas sesi real-time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white border-2 border-black text-black shadow-retro-sm">
                147 TABEL RLS
              </span>
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 font-black text-xs sm:text-sm transition-all shadow-retro cursor-pointer"
              >
                <Users className="h-4 w-4" />
                <span>Kelola Pengguna</span>
              </Link>
            </div>
          </div>

          {/* ROW 1: CATEGORIES PILLS (FILTER CHIP) */}
          <section aria-label="Kategori Administrator" className="space-y-2.5 sm:space-y-3">
            <h2 className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wider text-gray-dark">
              Categories
            </h2>
            <div className="flex flex-wrap items-center gap-2 pb-1.5">
              {ADMIN_CATEGORIES.map((cat) => {
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

          {/* 4 KARTU METRIK KEAMANAN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm text-center">
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Audit Events</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-black mt-1">{totalLogs}</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm text-center">
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Sesi Login Aktif</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-primary mt-1">{totalLogins}</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm text-center">
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Status Proteksi</p>
              <p className="font-heading font-black text-base sm:text-lg text-emerald-600 mt-2">100% AMAN</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm text-center">
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Tingkat Integritas</p>
              <p className="font-heading font-black text-base sm:text-lg text-black mt-2">IMMUTABLE</p>
            </div>
          </div>

          {/* GRID DUA WINDOW: AUDIT LOGS & LOGIN EVENTS */}
          {(showAll || showAudit || showLogins) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* WINDOW 1: LOG AUDIT KEAMANAN */}
              {(showAll || showAudit) && (
                <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                    <div className="space-y-0.5">
                      <h2 className="font-heading font-bold text-base text-ink flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span>Catatan Audit Sistem Sensitif</span>
                      </h2>
                      <p className="text-xs text-gray-dark font-bold">10 Peristiwa Terakhir (Append-Only)</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
                      IMMUTABLE
                    </span>
                  </div>

                  {!auditLogs || auditLogs.length === 0 ? (
                    <p className="text-xs text-gray-dark font-bold py-6 text-center border-2 border-dashed border-ink/30 rounded-xl">
                      Belum ada catatan audit tercatat.
                    </p>
                  ) : (
                    <div className="divide-y-2 divide-ink/15 border-2 border-ink rounded-xl overflow-hidden bg-white">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-3 hover:bg-gray-soft/40 transition-colors">
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-dark mb-1">
                            <span>{new Date(log.created_at).toLocaleTimeString('id-ID')} WIB</span>
                            <span className="px-1.5 py-0.5 rounded border border-ink bg-gray-soft text-ink">
                              {log.action}
                            </span>
                          </div>
                          <p className="font-heading font-bold text-xs sm:text-sm text-ink truncate">
                            {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* WINDOW 2: LOG AKTIVITAS LOGIN */}
              {(showAll || showLogins) && (
                <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
                    <div className="space-y-0.5">
                      <h2 className="font-heading font-bold text-base text-ink flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        <span>Aktivitas Login Real-time</span>
                      </h2>
                      <p className="text-xs text-gray-dark font-bold">Autentikasi & Jejak IP Perangkat</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
                      MONITORED
                    </span>
                  </div>

                  {!loginEvents || loginEvents.length === 0 ? (
                    <p className="text-xs text-gray-dark font-bold py-6 text-center border-2 border-dashed border-ink/30 rounded-xl">
                      Belum ada log aktivitas login tersimpan.
                    </p>
                  ) : (
                    <div className="divide-y-2 divide-ink/15 border-2 border-ink rounded-xl overflow-hidden bg-white">
                      {loginEvents.map((evt) => (
                        <div key={evt.id} className="p-3 hover:bg-gray-soft/40 transition-colors">
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-dark mb-1">
                            <span>{new Date(evt.created_at).toLocaleTimeString('id-ID')} WIB</span>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded border border-ink',
                                evt.status === 'SUCCESS' ? 'bg-surface text-ink' : 'bg-primary text-white'
                              )}
                            >
                              {evt.status}
                            </span>
                          </div>
                          <p className="font-heading font-bold text-xs sm:text-sm text-ink truncate">
                            {evt.profiles?.full_name || 'Pengguna Tidak Dikenal'} ({evt.profiles?.email || 'No email'})
                          </p>
                          <p className="text-[11px] font-mono text-gray-dark mt-0.5">
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
            <div className="pt-2">
              <ImpersonateUserCard />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BAGIAN KANAN: DETAIL & ACTION PANEL (BASELINE 480px)   */}
      {/* ========================================================= */}
      <aside
        aria-label="Panel Ringkasan & Detail Administrator"
        className="hidden xl:flex w-right-panel shrink-0 border-l-2 border-retro-border bg-retro-bg p-5 sm:p-6 flex flex-col gap-5 sticky top-header h-[calc(100dvh-var(--layout-header-height))] overflow-y-auto pb-24"
      >
        <div className="shrink-0 w-full">
          <AdminIdentityCard
            adminName={adminName}
            roleTitle={roleTitle}
            auditLogsCount={totalLogs}
            loginEventsCount={totalLogins}
          />
        </div>

        <AdminRightPanel
          auditLogsCount={totalLogs}
          loginEventsCount={totalLogins}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
        />
      </aside>

      {/* Mode Slide-over Drawer (< 1280px / max-xl) */}
      {isRightDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel Ringkasan & Detail Administrator"
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
                Ringkasan Keamanan Admin
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
                <AdminIdentityCard
                  adminName={adminName}
                  roleTitle={roleTitle}
                  auditLogsCount={totalLogs}
                  loginEventsCount={totalLogins}
                />
              </div>
              <AdminRightPanel
                auditLogsCount={totalLogs}
                loginEventsCount={totalLogins}
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
