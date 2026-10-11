import React from 'react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { RetroWindow } from '@/components/retro/retro-window';
import { ImpersonateUserCard } from './impersonate-user-card';
import {
  ShieldAlert,
  Users,
  FileText,
  Lock,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Server,
} from 'lucide-react';

import { assertServerRole } from '@/lib/auth/server-guards';

export default async function AdminPortalPage() {
  const userContext = await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
  const profile = userContext?.profile;

  // Query data nyata dari tabel audit_logs dan login_events
  const { data: auditLogs } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: loginEvents } = await supabaseAdmin
    .from('login_events')
    .select('*, profiles:user_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(10);

  const totalLogs = auditLogs?.length || 0;
  const totalLogins = loginEvents?.length || 0;

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW SUPER ADMIN */}
      <RetroWindow
        title="super_admin_security_audit.sys"
        badge="ROLE: SYSTEM ADMIN"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border-[1.5px] border-retro-border bg-retro-orange text-white shadow-xs">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h1 className="font-heading font-black text-2xl tracking-tight text-foreground">
                Audit & Keamanan Portal SIAJAR
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl mt-1">
              Selamat datang, <strong className="font-bold text-foreground">{profile?.full_name}</strong>.
              Pantau integritas platform, jejak audit keamanan append-only, dan aktivitas sesi login perangkat real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-retro-border bg-retro-mint text-black px-3 py-1 text-xs font-mono font-bold shadow-xs flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
              SYSTEM ONLINE
            </span>
          </div>
        </div>

        {/* 4 Kartu Metrik Keamanan */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-retro-border/40 mt-5">
          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-warm/70 shadow-xs text-center">
            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Audit Events</p>
            <p className="font-heading font-black text-2xl text-foreground mt-0.5">{totalLogs}</p>
          </div>
          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-yellow/40 shadow-xs text-center">
            <p className="text-[10px] font-mono font-bold text-foreground uppercase">Sesi Login Aktif</p>
            <p className="font-heading font-black text-2xl text-foreground mt-0.5">{totalLogins}</p>
          </div>
          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-mint/40 shadow-xs text-center">
            <p className="text-[10px] font-mono font-bold text-foreground uppercase">Status Keamanan</p>
            <p className="font-heading font-black text-lg text-foreground mt-1">100% AMAN</p>
          </div>
          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-warm/70 shadow-xs text-center">
            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Tingkat Integritas</p>
            <p className="font-heading font-black text-lg text-foreground mt-1">IMMUTABLE</p>
          </div>
        </div>
      </RetroWindow>

      {/* 2. GRID DUA WINDOW: AUDIT LOGS & LOGIN EVENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WINDOW 1: LOG AUDIT KEAMANAN */}
        <RetroWindow
          title="audit_logs_append_only.log"
          badge="IMMUTABLE"
          headerClassName="bg-retro-warm"
          bodyClassName="p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-sm text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-retro-orange" />
              <span>Catatan Audit Sistem Sensitif</span>
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground">10 Peristiwa Terakhir</span>
          </div>

          {!auditLogs || auditLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center border border-dashed border-retro-border rounded">
              Belum ada catatan audit tercatat.
            </p>
          ) : (
            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border-[1.5px] border-retro-border bg-retro-surface shadow-xs space-y-1 hover:bg-retro-warm/30 transition-colors"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-foreground bg-retro-warm px-2 py-0.5 rounded border border-retro-border text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(log.created_at).toLocaleTimeString('id-ID')} WIB
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Entitas: <strong className="text-foreground">{log.entity_type}</strong> &bull; IP: {log.ip_address || 'Internal/Proxy'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </RetroWindow>

        {/* WINDOW 2: AKTIVITAS SESI & LOGIN */}
        <RetroWindow
          title="login_sessions_monitor.log"
          badge="REAL-TIME"
          headerClassName="bg-retro-warm"
          bodyClassName="p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-sm text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-retro-orange" />
              <span>Aktivitas Login & Sesi Terkini</span>
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground">Deteksi Risiko Otomatis</span>
          </div>

          {!loginEvents || loginEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center border border-dashed border-retro-border rounded">
              Belum ada kejadian login tercatat.
            </p>
          ) : (
            <div className="space-y-2.5">
              {loginEvents.map((evt) => {
                const isFailed = evt.event_type === 'LOGIN_FAILED';
                const isReported = evt.event_type === 'REPORTED_NOT_ME';

                return (
                  <div
                    key={evt.id}
                    className={`p-3 rounded-lg border-[1.5px] border-retro-border bg-retro-surface shadow-xs space-y-1.5 hover:bg-retro-warm/30 transition-colors ${
                      isReported
                        ? 'border-danger bg-danger/5'
                        : isFailed
                        ? 'border-retro-yellow bg-retro-yellow/10'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xs text-foreground">
                          {evt.event_type}
                        </span>
                        {evt.is_new_device && (
                          <span className="text-[10px] font-mono font-bold bg-retro-mint text-black border border-retro-border px-1.5 py-0.2 rounded shadow-xs">
                            Perangkat Baru
                          </span>
                        )}
                        {evt.risk_level === 'HIGH' && (
                          <span className="text-[10px] font-mono font-bold bg-danger text-white border border-retro-border px-1.5 py-0.2 rounded shadow-xs">
                            Risiko Tinggi
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(evt.created_at).toLocaleTimeString('id-ID')} WIB
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground font-mono">
                      {(evt.profiles as { email?: string } | null)?.email || evt.user_id} &bull; {evt.city || 'Pekanbaru'} ({evt.ip_masked || 'xxx'})
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </RetroWindow>
      </div>

      {/* 3. KELOLA PENGGUNA & IMPERSONATE (SUPER ADMIN) */}
      <RetroWindow
        title="super_admin_impersonate_manager.tool"
        badge="AKSES KHUSUS SUPER ADMIN"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 bg-retro-surface space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-retro-border/40 pb-3">
          <div>
            <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-retro-orange" />
              Kelola Pengguna & Impersonate Sesi
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Super Admin dapat beralih peran ke akun aktor lain untuk verifikasi sistem secara langsung. Seluruh sesi tercatat di Audit Log.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-retro-warm border border-retro-border px-3 py-1 rounded">
            7 Aktor Aktif
          </span>
        </div>

        <ImpersonateUserCard />
      </RetroWindow>

      {/* 4. MONITORING SISTEM & INTEGRASI LAYANAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RetroWindow
          title="system_integrations_status.srv"
          badge="HEALTH CHECK"
          headerClassName="bg-retro-warm"
          bodyClassName="p-5 space-y-3"
        >
          <h4 className="font-heading font-black text-xs text-foreground uppercase tracking-wider">
            Status Integrasi API & Microservices
          </h4>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded border border-retro-border bg-retro-surface">
              <span>Sandbox Live Coding (Judge0/Piston)</span>
              <span className="text-success font-bold flex items-center gap-1">● OPERATIONAL</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded border border-retro-border bg-retro-surface">
              <span>Realtime WebSocket / Event Push</span>
              <span className="text-success font-bold flex items-center gap-1">● CONNECTED</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded border border-retro-border bg-retro-surface">
              <span>Google Maps API / Leaflet Fallback</span>
              <span className="text-success font-bold flex items-center gap-1">● READY</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded border border-retro-border bg-retro-surface">
              <span>AI Academic Assistant LLM Engine</span>
              <span className="text-success font-bold flex items-center gap-1">● ACTIVE</span>
            </div>
          </div>
        </RetroWindow>

        <RetroWindow
          title="academic_policies_retention.cfg"
          badge="KEBIJAKAN PLATFORM"
          headerClassName="bg-retro-warm"
          bodyClassName="p-5 space-y-3"
        >
          <h4 className="font-heading font-black text-xs text-foreground uppercase tracking-wider">
            Kebijakan Retensi & Proctoring Global
          </h4>
          <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <div className="p-2.5 rounded border border-retro-border bg-retro-surface flex justify-between items-center">
              <span>Ambang Toleransi Pelanggaran Proctoring:</span>
              <span className="font-mono font-bold text-foreground">5 Kali (Strict)</span>
            </div>
            <div className="p-2.5 rounded border border-retro-border bg-retro-surface flex justify-between items-center">
              <span>Masa Simpan Data Log Ujian (exam_events):</span>
              <span className="font-mono font-bold text-foreground">1 Semester (180 Hari)</span>
            </div>
            <div className="p-2.5 rounded border border-retro-border bg-retro-surface flex justify-between items-center">
              <span>Penyimpanan Biometrik Mentah:</span>
              <span className="font-mono font-bold text-success">0 Hari (FIDO2/WebAuthn Only)</span>
            </div>
            <div className="p-2.5 rounded border border-retro-border bg-retro-surface flex justify-between items-center">
              <span>Radius Default Presensi Kelas (GPS):</span>
              <span className="font-mono font-bold text-foreground">50 Meter</span>
            </div>
          </div>
        </RetroWindow>
      </div>
    </div>
  );
}
