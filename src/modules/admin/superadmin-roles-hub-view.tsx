'use client';

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Lock,
  Users,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

interface RolePermission {
  module: string;
  student: boolean;
  ta: boolean;
  lecturer: boolean;
  coordinator: boolean;
  staff: boolean;
  sysadmin: boolean;
  superadmin: boolean;
}

const PERMISSION_MATRIX: RolePermission[] = [
  { module: 'Melihat Kelas Terdaftar', student: true, ta: true, lecturer: true, coordinator: true, staff: true, sysadmin: false, superadmin: true },
  { module: 'Membuat Kelas & Rombel', student: false, ta: false, lecturer: true, coordinator: true, staff: true, sysadmin: false, superadmin: true },
  { module: 'Plotting Dosen & Pengampu', student: false, ta: false, lecturer: false, coordinator: true, staff: true, sysadmin: false, superadmin: true },
  { module: 'Buka Sesi Presensi & Geofence', student: false, ta: true, lecturer: true, coordinator: true, staff: false, sysadmin: false, superadmin: true },
  { module: 'Koreksi Nilai & Tugas', student: false, ta: true, lecturer: true, coordinator: true, staff: false, sysadmin: false, superadmin: true },
  { module: 'Pengajuan Ubah Nilai Final', student: false, ta: false, lecturer: true, coordinator: false, staff: false, sysadmin: false, superadmin: false },
  { module: 'Putusan Setujui Ubah Nilai', student: false, ta: false, lecturer: false, coordinator: true, staff: false, sysadmin: false, superadmin: false },
  { module: 'Eksekusi Nilai ke Database', student: false, ta: false, lecturer: false, coordinator: false, staff: true, sysadmin: false, superadmin: false },
  { module: 'Konfigurasi Server & Gateway', student: false, ta: false, lecturer: false, coordinator: false, staff: false, sysadmin: true, superadmin: true },
  { module: 'Manajemen Akun & Impersonate', student: false, ta: false, lecturer: false, coordinator: false, staff: false, sysadmin: false, superadmin: true },
  { module: 'Melihat Log Audit Forensik', student: false, ta: false, lecturer: false, coordinator: false, staff: false, sysadmin: true, superadmin: true },
];

export function SuperadminRolesHubView() {
  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="matriks_peran_dan_hak_akses_rbac.sys"
        badge="SUPER_ADMIN :: ACCESS_CONTROL"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-retro-sm">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Role & Permission Matrix (7 Peran SIAJAR)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Matriks referensi pemisahan tugas (*Separation of Duties*) dan pembagian hak akses granular lintas 7 peran sistem. Penegakan hak akses dilakukan secara ketat di sisi server melalui Server Actions dan database via RLS & RPC terisolasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-neutral-100 text-neutral-950 font-mono text-xs font-bold shadow-retro-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              MATRIKS REFERENSI RBAC (READ-ONLY)
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TABEL MATRIKS PERIZINAN */}
      <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <h3 className="font-heading font-black text-lg text-black">
            Matriks Wewenang Fungsional per Role
          </h3>
          <span className="text-xs font-mono font-bold text-black/60">Strict Role-Based Access Control</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-retro-warm font-mono font-black text-black">
                <th className="p-3">Modul & Hak Operasional</th>
                <th className="p-2.5 text-center">Mhs</th>
                <th className="p-2.5 text-center">Asisten</th>
                <th className="p-2.5 text-center">Dosen</th>
                <th className="p-2.5 text-center">Kaprodi</th>
                <th className="p-2.5 text-center">Staf</th>
                <th className="p-2.5 text-center">SysAdmin</th>
                <th className="p-2.5 text-center">SuperAdmin</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b border-black font-mono">
              {PERMISSION_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-retro-warm/30 transition-colors">
                  <td className="p-3 font-sans font-bold text-black">{row.module}</td>
                  <td className="p-2.5 text-center">
                    {row.student ? <Check className="h-4 w-4 text-emerald-700 mx-auto stroke-[3]" /> : <X className="h-4 w-4 text-black/20 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.ta ? <Check className="h-4 w-4 text-emerald-700 mx-auto stroke-[3]" /> : <X className="h-4 w-4 text-black/20 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.lecturer ? <Check className="h-4 w-4 text-emerald-700 mx-auto stroke-[3]" /> : <X className="h-4 w-4 text-black/20 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.coordinator ? <Check className="h-4 w-4 text-emerald-700 mx-auto stroke-[3]" /> : <X className="h-4 w-4 text-black/20 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.staff ? <Check className="h-4 w-4 text-emerald-700 mx-auto stroke-[3]" /> : <X className="h-4 w-4 text-black/20 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.sysadmin ? <Check className="h-4 w-4 text-emerald-700 mx-auto stroke-[3]" /> : <X className="h-4 w-4 text-black/20 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.superadmin ? <Check className="h-4 w-4 text-emerald-700 mx-auto stroke-[3]" /> : <X className="h-4 w-4 text-black/20 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
