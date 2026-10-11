'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { impersonateUserAction } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';

interface UserItem {
  id: string;
  name: string;
  role: string;
  identifier: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

const SAMPLE_USERS: UserItem[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Ahmad Mahasiswa',
    role: 'STUDENT',
    identifier: 'NIM: 2024001',
    email: 'ahmad@mhs.utsn.ac.id',
    status: 'ACTIVE',
  },
  {
    id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Dr. Budi Santoso, M.Kom.',
    role: 'LECTURER',
    identifier: 'NIDN: 0012345678',
    email: 'budi.santoso@dosen.utsn.ac.id',
    status: 'ACTIVE',
  },
  {
    id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Citra Asisten',
    role: 'TEACHING_ASSISTANT',
    identifier: 'NIM: 2024002',
    email: 'citra@mhs.utsn.ac.id',
    status: 'ACTIVE',
  },
  {
    id: 'a0000004-0000-0000-0000-000000000004',
    name: 'Prof. Dewi Lestari, Ph.D.',
    role: 'PROGRAM_COORDINATOR',
    identifier: 'NIDN: 0087654321',
    email: 'dewi.lestari@dosen.utsn.ac.id',
    status: 'ACTIVE',
  },
  {
    id: 'a0000005-0000-0000-0000-000000000005',
    name: 'Eko Staf Akademik',
    role: 'ACADEMIC_STAFF',
    identifier: 'NIP: 198501012010121001',
    email: 'eko.staf@staff.utsn.ac.id',
    status: 'ACTIVE',
  },
  {
    id: 'a0000006-0000-0000-0000-000000000006',
    name: 'System Administrator',
    role: 'SYSTEM_ADMIN',
    identifier: 'Username: sysadmin',
    email: 'sysadmin@utsn.ac.id',
    status: 'ACTIVE',
  },
];

export function SuperadminUsersHubView() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const isDemo = isDemoMode();

  const handleImpersonate = (userId: string) => {
    startTransition(async () => {
      const res = await impersonateUserAction(userId);
      if (res.ok) {
        router.push('/workspace');
        router.refresh();
      }
    });
  };

  const filteredUsers = SAMPLE_USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.identifier.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="manajemen_pengguna_dan_identitas.app"
        badge="SUPER_ADMIN :: IDENTITY_MANAGEMENT"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-retro-sm">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Kelola Pengguna & Penyamaran Sesi (Impersonate)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Manajemen akun sivitas akademika universitas dan fitur impersonasi resmi untuk investigasi kendala teknis dengan batasan 30 menit dan jejak audit penuh.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-amber-100 text-amber-950 font-mono text-xs font-bold shadow-retro-sm">
              <Clock className="h-4 w-4 text-amber-800" />
              MAKSIMAL IMPERSONASI 30 MENIT
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. BANNER KETENTUAN IMPERSONASI */}
      <div className="p-4 rounded-xl border-2 border-black bg-amber-50 shadow-retro space-y-2 text-xs font-mono text-amber-950">
        <div className="flex items-center gap-2 font-bold text-sm">
          <ShieldAlert className="h-4 w-4 text-amber-800" />
          <span>Protokol Keamanan Penyamaran Sesi (Super Admin Impersonation)</span>
        </div>
        <p className="text-amber-900 leading-relaxed font-sans">
          Setiap sesi impersonate dibatasi waktu maksimal 30 menit, menampilkan banner permanen berwarna oranye retro dengan tombol keluar seketika, dan seluruh aktivitas dicatat pada tabel <code>audit_logs</code> dengan relasi <code>actor_id</code> (Super Admin) dan <code>on_behalf_of</code> (Pengguna Sasaran). Aksi administratif tingkat super admin tidak dapat dijalankan selama penyamaran berlangsung.
        </p>
      </div>

      {/* 3. FILTER & PENCARIAN PENGGUNA */}
      <div className="p-5 sm:p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                placeholder="Cari nama, NIM, NIDN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded border-2 border-black bg-retro-warm/20 text-xs font-mono w-56 sm:w-64"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-2.5 py-1.5 rounded border-2 border-black bg-retro-warm font-mono text-xs font-bold"
            >
              <option value="ALL">Semua Peran</option>
              <option value="STUDENT">Mahasiswa</option>
              <option value="LECTURER">Dosen Pengampu</option>
              <option value="TEACHING_ASSISTANT">Asisten Dosen</option>
              <option value="PROGRAM_COORDINATOR">Kaprodi</option>
              <option value="ACADEMIC_STAFF">Staf Akademik</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
            </select>
          </div>
          <span className="text-xs font-mono font-bold text-black/60">
            Ditemukan: {filteredUsers.length} Pengguna
          </span>
        </div>

        {/* TABEL PENGGUNA DENGAN TOMBOL IMPERSONATE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-retro-warm font-mono font-black text-black">
                <th className="p-3">Nama & Identitas</th>
                <th className="p-3">Email Institusi</th>
                <th className="p-3">Peran (Role)</th>
                <th className="p-3 text-center">Status Akun</th>
                <th className="p-3 text-center">Aksi Impersonate</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b border-black font-mono">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-retro-warm/30 transition-colors">
                  <td className="p-3 font-sans">
                    <div className="font-bold text-black">{u.name}</div>
                    <span className="text-[11px] font-mono text-black/60">{u.identifier}</span>
                  </td>
                  <td className="p-3 text-black/80">{u.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded border border-black bg-neutral-100 font-bold text-[11px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-bold text-[11px]">
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleImpersonate(u.id)}
                      className="px-3 py-1.5 rounded border-2 border-black bg-black text-white hover:bg-retro-warm hover:text-black font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>{pending ? 'Menghubungkan...' : 'Impersonate'}</span>
                    </button>
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
