'use client';

import React from 'react';
import { OSWindow } from './os-window';
import { Cpu, Activity, Database, ShieldCheck, HardDrive, Server } from 'lucide-react';

export function SystemMonitorWindow() {
  return (
    <div id="stats-section" className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Monitor: Telemetry Metrics */}
        <div className="lg:col-span-7">
          <OSWindow
            title="SYSTEM_MONITOR.EXE"
            icon={<Cpu className="w-4 h-4 text-[#10B981]" />}
            statusText="TELEMETRY SCAN · 4 KERNEL THREADS ONLINE · ALL SERVICES HEALTHY"
            className="shadow-md"
            bodyClassName="p-4 sm:p-5 bg-[#14110F] text-[#FAF8F5] font-mono text-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#38312A] pb-2 text-[11px]">
              <span className="text-[#F59E0B] font-bold">RUANGKAMPUS OS // KERNEL DIAGNOSTICS</span>
              <span className="text-[#10B981] animate-pulse">● NORMAL OPERATION</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 bg-[#1E1915] border border-[#38312A]">
                <div className="text-[10px] text-[#A8A29E]">CPU KERNEL LOAD</div>
                <div className="text-lg font-bold text-[#10B981] mt-0.5">8.4%</div>
                <div className="text-[9px] text-[#78716C]">4 Cores Active</div>
              </div>
              <div className="p-2.5 bg-[#1E1915] border border-[#38312A]">
                <div className="text-[10px] text-[#A8A29E]">MEMORY USAGE</div>
                <div className="text-lg font-bold text-[#38BDF8] mt-0.5">142 MB</div>
                <div className="text-[9px] text-[#78716C]">Heap / RSS</div>
              </div>
              <div className="p-2.5 bg-[#1E1915] border border-[#38312A]">
                <div className="text-[10px] text-[#A8A29E]">DB QUERY PING</div>
                <div className="text-lg font-bold text-[#F59E0B] mt-0.5">&lt; 12 ms</div>
                <div className="text-[9px] text-[#78716C]">Pool: 10 Conns</div>
              </div>
              <div className="p-2.5 bg-[#1E1915] border border-[#38312A]">
                <div className="text-[10px] text-[#A8A29E]">PRESENCE UPTIME</div>
                <div className="text-lg font-bold text-[#C2553A] mt-0.5">99.98%</div>
                <div className="text-[9px] text-[#78716C]">Zero Downtime</div>
              </div>
            </div>

            {/* Diagnostic Logs Box */}
            <div className="p-3 bg-[#0D0A08] border border-[#38312A] text-[10px] space-y-1">
              <div className="text-[#F59E0B] font-bold">&gt; system.audit --all --strict:</div>
              <div className="text-[#A8A29E]">&gt; [AUTH] Session tokens validated: Ed25519 secure protocol</div>
              <div className="text-[#A8A29E]">&gt; [WEAVE] Kain Semester dependency graph: 0 cycles detected</div>
              <div className="text-[#10B981]">&gt; [OK] All LMS core modules compiled and running error-free</div>
            </div>
          </OSWindow>
        </div>

        {/* Right Monitor: Companion OS */}
        <div className="lg:col-span-5">
          <OSWindow
            title="RUANGKAMPUS_COMPANION.EXE"
            icon={<Activity className="w-4 h-4 text-[#C2553A]" />}
            statusText="READY · PROTOCOL: HTTPS / WSS"
            className="shadow-md"
            bodyClassName="p-4 sm:p-5 bg-[#FAF8F5] text-[#1C1917] font-sans text-xs space-y-3"
          >
            <div className="flex items-center gap-2 border-b border-[#E5DDD5] pb-2 font-mono">
              <Server className="w-4 h-4 text-[#C2553A]" />
              <span className="font-bold text-[#853827]">Portal Architecture Overview</span>
            </div>

            <p className="text-xs text-[#57534E] leading-relaxed">
              RuangKampus OS dirancang berbasis Server-Driven Actions Next.js App Router dengan
              arsitektur multi-tenant role isolation. Data presensi, nilai, dan modul terisolasi penuh
              sesuai hak akses masing-masing aktor akademik.
            </p>

            <div className="space-y-1.5 font-mono text-[11px] pt-1">
              <div className="p-2 bg-white border border-[#D6D3CB] flex items-center justify-between">
                <span>Multi-Role Isolation</span>
                <span className="font-bold text-[#10B981]">ACTIVE</span>
              </div>
              <div className="p-2 bg-white border border-[#D6D3CB] flex items-center justify-between">
                <span>Kain Semester Engine</span>
                <span className="font-bold text-[#10B981]">VERIFIED</span>
              </div>
              <div className="p-2 bg-white border border-[#D6D3CB] flex items-center justify-between">
                <span>Real-Time Attendance Clock</span>
                <span className="font-bold text-[#10B981]">SYNCED</span>
              </div>
            </div>
          </OSWindow>
        </div>
      </div>
    </div>
  );
}
