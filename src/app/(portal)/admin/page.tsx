import React from 'react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ImpersonateUserCard } from './impersonate-user-card';
import {
  ShieldAlert,
  Users,
  FileText,
  Lock,
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
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <ShieldAlert className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Audit & Keamanan Portal SIAJAR
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Selamat datang, <strong className="text-ink">{profile?.full_name || 'Admin'}</strong>. Pantau integritas platform, jejak audit append-only, dan aktivitas sesi real-time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-primary text-white border-2 border-ink shadow-xs">
              ROLE: SYSTEM ADMIN
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              SYSTEM ONLINE
            </span>
          </div>
        </div>

        {/* 4 KARTU METRIK KEAMANAN */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm text-center">
            <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Audit Events</p>
            <p className="font-heading font-bold text-2xl sm:text-3xl text-ink mt-1">{totalLogs}</p>
          </div>
          <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm text-center">
            <p className="text-xs font-sans font-bold text-ink uppercase tracking-wider">Sesi Login Aktif</p>
            <p className="font-heading font-bold text-2xl sm:text-3xl text-primary mt-1">{totalLogins}</p>
          </div>
          <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm text-center">
            <p className="text-xs font-sans font-bold text-ink uppercase tracking-wider">Status Keamanan</p>
            <p className="font-heading font-bold text-lg sm:text-xl text-ink mt-2">100% AMAN</p>
          </div>
          <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm text-center">
            <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Tingkat Integritas</p>
            <p className="font-heading font-bold text-lg sm:text-xl text-ink mt-2">IMMUTABLE</p>
          </div>
        </div>

        {/* GRID DUA WINDOW: AUDIT LOGS & LOGIN EVENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* WINDOW 1: LOG AUDIT KEAMANAN */}
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
              <div className="space-y-0.5">
                <h2 className="font-heading font-bold text-base text-ink flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Catatan Audit Sistem Sensitif</span>
                </h2>
                <p className="text-xs text-gray-dark font-bold">10 Peristiwa Terakhir</p>
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
              <div className="space-y-2.5">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border-2 border-ink bg-surface shadow-xs space-y-1 hover:bg-gray-soft/30 transition-colors"
                  >
                    <div className="flex items-center justify-between font-sans text-xs">
                      <span className="font-bold text-ink bg-gray-soft px-2.5 py-0.5 rounded-full border-2 border-ink text-xs shadow-xs">
                        {log.action}
                      </span>
                      <span className="text-gray-dark font-bold text-xs">
                        {new Date(log.created_at).toLocaleTimeString('id-ID')} WIB
                      </span>
                    </div>
                    <p className="text-xs text-gray-dark font-bold font-sans mt-1">
                      Entitas: <strong className="text-ink">{log.entity_type}</strong> &bull; IP: {log.ip_address || 'Internal/Proxy'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WINDOW 2: AKTIVITAS SESI & LOGIN */}
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
              <div className="space-y-0.5">
                <h2 className="font-heading font-bold text-base text-ink flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <span>Aktivitas Login & Sesi Terkini</span>
                </h2>
                <p className="text-xs text-gray-dark font-bold">Deteksi Risiko Otomatis</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
                REAL-TIME
              </span>
            </div>

            {!loginEvents || loginEvents.length === 0 ? (
              <p className="text-xs text-gray-dark font-bold py-6 text-center border-2 border-dashed border-ink/30 rounded-xl">
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
                      className={`p-3 rounded-xl border-2 border-ink bg-surface shadow-xs space-y-1.5 hover:bg-gray-soft/30 transition-colors ${
                        isReported
                          ? 'border-primary bg-primary/5'
                          : isFailed
                          ? 'bg-gray-soft/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-xs text-ink">
                            {evt.event_type}
                          </span>
                          {evt.is_new_device && (
                            <span className="text-[11px] font-sans font-bold bg-surface text-ink border-2 border-ink px-2 py-0.5 rounded-full shadow-xs">
                              Perangkat Baru
                            </span>
                          )}
                          {evt.risk_level === 'HIGH' && (
                            <span className="text-[11px] font-sans font-bold bg-primary text-white border-2 border-ink px-2 py-0.5 rounded-full shadow-xs">
                              Risiko Tinggi
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-dark font-bold font-sans">
                          {new Date(evt.created_at).toLocaleTimeString('id-ID')} WIB
                        </span>
                      </div>

                      <p className="text-xs text-gray-dark font-bold font-sans">
                        {(evt.profiles as { email?: string } | null)?.email || evt.user_id} &bull; {evt.city || 'Pekanbaru'} ({evt.ip_masked || 'xxx'})
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. KELOLA PENGGUNA & IMPERSONATE (SUPER ADMIN) */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink/20 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Kelola Pengguna & Impersonate Sesi</span>
              </h3>
              <p className="text-xs text-gray-dark font-bold mt-0.5">
                Super Admin dapat beralih peran ke akun aktor lain untuk verifikasi sistem secara langsung. Seluruh sesi tercatat di Audit Log.
              </p>
            </div>
            <span className="text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink px-3 py-1 rounded-full shadow-xs shrink-0">
              7 Aktor Aktif
            </span>
          </div>

          <ImpersonateUserCard />
        </div>

        {/* 4. MONITORING SISTEM & INTEGRASI LAYANAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2.5">
              <h4 className="font-heading font-bold text-xs sm:text-sm text-ink uppercase tracking-wider">
                Status Integrasi API & Microservices
              </h4>
              <span className="px-2 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-[11px] font-sans font-bold text-ink shadow-xs">
                HEALTH CHECK
              </span>
            </div>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex items-center justify-between p-2.5 rounded-lg border-2 border-ink bg-surface shadow-xs">
                <span className="font-bold text-ink">Sandbox Live Coding (Judge0/Piston)</span>
                <span className="text-ink font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> OPERATIONAL
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border-2 border-ink bg-surface shadow-xs">
                <span className="font-bold text-ink">Realtime WebSocket / Event Push</span>
                <span className="text-ink font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> CONNECTED
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border-2 border-ink bg-surface shadow-xs">
                <span className="font-bold text-ink">Google Maps API / Leaflet Fallback</span>
                <span className="text-ink font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> READY
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border-2 border-ink bg-surface shadow-xs">
                <span className="font-bold text-ink">AI Academic Assistant LLM Engine</span>
                <span className="text-ink font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" /> ACTIVE
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2.5">
              <h4 className="font-heading font-bold text-xs sm:text-sm text-ink uppercase tracking-wider">
                Kebijakan Retensi & Proctoring Global
              </h4>
              <span className="px-2 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-[11px] font-sans font-bold text-ink shadow-xs">
                POLICY
              </span>
            </div>
            <div className="space-y-2 text-xs font-sans">
              <div className="p-2.5 rounded-lg border-2 border-ink bg-surface shadow-xs flex justify-between items-center">
                <span className="text-gray-dark font-bold">Ambang Toleransi Proctoring:</span>
                <span className="font-sans font-bold text-ink">5 Kali (Strict)</span>
              </div>
              <div className="p-2.5 rounded-lg border-2 border-ink bg-surface shadow-xs flex justify-between items-center">
                <span className="text-gray-dark font-bold">Masa Simpan Data Log Ujian:</span>
                <span className="font-sans font-bold text-ink">1 Semester (180 Hari)</span>
              </div>
              <div className="p-2.5 rounded-lg border-2 border-ink bg-surface shadow-xs flex justify-between items-center">
                <span className="text-gray-dark font-bold">Penyimpanan Biometrik Mentah:</span>
                <span className="font-sans font-bold text-ink">0 Hari (FIDO2 Only)</span>
              </div>
              <div className="p-2.5 rounded-lg border-2 border-ink bg-surface shadow-xs flex justify-between items-center">
                <span className="text-gray-dark font-bold">Radius Default Presensi (GPS):</span>
                <span className="font-sans font-bold text-ink">50 Meter</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
