'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Lock,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { isDemoMode } from '@/lib/config/features';

interface AuditItem {
  id: string;
  created_at: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  description: string;
  on_behalf_of_name?: string;
}

const SAMPLE_AUDIT_LOGS: AuditItem[] = [
  {
    id: 'aud-001',
    created_at: '11 Okt 2026, 06:45 WIB',
    actor_name: 'Dr. Budi Santoso',
    actor_role: 'LECTURER',
    action: 'grade.change_request',
    entity_type: 'grade_change_requests',
    description: 'Mengajukan perubahan nilai mahasiswa Ahmad Fauzi (72 -> 85) pada Tugas 3.',
  },
  {
    id: 'aud-002',
    created_at: '11 Okt 2026, 07:10 WIB',
    actor_name: 'Prof. Dewi Lestari',
    actor_role: 'PROGRAM_COORDINATOR',
    action: 'grade.change_approve',
    entity_type: 'grade_change_requests',
    description: 'Menyetujui usulan perubahan nilai mahasiswa Ahmad Fauzi.',
  },
  {
    id: 'aud-003',
    created_at: '11 Okt 2026, 07:15 WIB',
    actor_name: 'Eko Staf Akademik',
    actor_role: 'ACADEMIC_STAFF',
    action: 'grade.change_execute',
    entity_type: 'student_grades',
    description: 'Mengeksekusi nilai mahasiswa ke pangkalan data master nilai semester.',
  },
  {
    id: 'aud-004',
    created_at: '11 Okt 2026, 07:20 WIB',
    actor_name: 'Super Administrator',
    actor_role: 'SUPER_ADMIN',
    action: 'auth.impersonate_user',
    entity_type: 'users',
    description: 'Memulai sesi impersonasi investigasi teknis pada akun Ahmad Mahasiswa.',
    on_behalf_of_name: 'Ahmad Mahasiswa (STUDENT)',
  },
];

export function SystemAuditHubView() {
  const [filterAction, setFilterAction] = useState('ALL');
  const isDemo = isDemoMode();

  const filteredLogs = SAMPLE_AUDIT_LOGS.filter((l) => {
    if (filterAction === 'ALL') return true;
    return l.action.startsWith(filterAction);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="jejak_audit_keamanan_immutable.sys"
        badge="IMMUTABLE_LOG :: READ_ONLY"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Log Audit Sistem (Read-Only)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Jejak forensik transaksi tak terhapuskan (*append-only ledger*) yang mencatat setiap keputusan nilai, pembukaan sesi ujian, intervensi pengawas, dan sesi impersonasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-gray-soft text-black font-sans text-xs font-bold shadow-retro-sm">
              <Lock className="h-4 w-4 text-black" />
              {isDemo ? 'LOG AUDIT (MEMORI DEMO)' : 'LOG AUDIT (MENUNGGU MIGRASI DB)'}
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. FILTER & DAFTAR LOG AUDIT */}
      <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-black/60" />
            <span className="font-bold font-sans text-xs text-black">Filter Jenis Transaksi:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-2.5 py-1 rounded border-2 border-black bg-gray-soft font-sans text-xs font-bold"
            >
              <option value="ALL">Semua Transaksi</option>
              <option value="grade">Perubahan Nilai (Grade)</option>
              <option value="auth">Autentikasi & Impersonasi</option>
              <option value="exam">Ujian & Pengawasan</option>
            </select>
          </div>
          <span className="text-xs font-sans font-bold text-black/60">
            Total Entri: {isDemo ? `${filteredLogs.length} Log` : '0 Log (Belum Terhubung)'}
          </span>
        </div>

        {!isDemo ? (
          <div className="p-8 text-center text-black/60 font-sans text-xs border-2 border-dashed border-black/20 rounded-xl">
            Tabel pangkalan data log audit belum terhubung ke database production. Menunggu migrasi <code>20261011000015_audit_logs_hardening.sql</code> diterapkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-gray-soft font-sans font-bold text-black">
                <th className="p-3">Waktu Pencatatan</th>
                <th className="p-3">Pelaku (Actor)</th>
                <th className="p-3">Aksi Terdaftar</th>
                <th className="p-3">Keterangan Transaksi</th>
                <th className="p-3 text-center">Atas Nama (Impersonated)</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b border-black font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-soft/30 transition-colors">
                  <td className="p-3 font-sans text-black/80">{log.created_at}</td>
                  <td className="p-3">
                    <div className="font-bold text-black">{log.actor_name}</div>
                    <span className="text-xs font-sans text-black/60">{log.actor_role}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded border border-black bg-neutral-100 font-bold text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-black/90 font-sans max-w-md">
                    {log.description}
                  </td>
                  <td className="p-3 text-center">
                    {log.on_behalf_of_name ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-ink bg-gray-soft text-ink font-bold text-xs">
                        <ShieldAlert className="h-3 w-3" />
                        {log.on_behalf_of_name}
                      </span>
                    ) : (
                      <span className="text-black/40">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
