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
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { impersonateUserAction, updateUserRoleAction } from '@/modules/identity/actions';
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
  const [usersList, setUsersList] = useState<UserItem[]>(SAMPLE_USERS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Modal impersonasi dengan alasan wajib
  const [impersonateTarget, setImpersonateTarget] = useState<UserItem | null>(null);
  const [impersonateReason, setImpersonateReason] = useState('');
  const isDemo = isDemoMode();

  const handleOpenImpersonate = (u: UserItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setImpersonateTarget(u);
    setImpersonateReason('');
  };

  const handleConfirmImpersonate = () => {
    if (!impersonateTarget) return;
    if (impersonateReason.trim().length < 10) {
      setErrorMsg('Alasan impersonasi wajib diisi minimal 10 karakter untuk keperluan audit forensik.');
      return;
    }

    startTransition(async () => {
      const res = await impersonateUserAction(impersonateTarget.id, impersonateReason.trim());
      if (res.ok) {
        setImpersonateTarget(null);
        router.push('/workspace');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Gagal memulai sesi impersonasi.');
      }
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await updateUserRoleAction({ targetUserId: userId, newRole });
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setSuccessMsg(`Peran pengguna berhasil diperbarui menjadi ${newRole} dan tercatat di Log Audit.`);
      } else {
        setErrorMsg(res.error || 'Gagal memperbarui peran pengguna.');
      }
    });
  };

  const displayedUsers = isDemo ? usersList : [];
  const filteredUsers = displayedUsers.filter((u) => {
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
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-black tracking-tight">
                Kelola Pengguna & Penyamaran Sesi (Impersonate)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/70 font-medium max-w-2xl">
              Manajemen akun sivitas akademika universitas dan fitur penyamaran resmi (impersonasi) untuk investigasi kendala teknis dengan batasan 30 menit, token HMAC tertandatangani, dan jejak audit forensik penuh.
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

      {/* FEEDBACK BANNER */}
      {errorMsg && (
        <div className="p-4 rounded-xl border-2 border-rose-500 bg-rose-50 text-rose-950 text-xs font-mono font-bold flex items-center justify-between gap-3 shadow-retro">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-950 text-xs font-mono font-bold flex items-center justify-between gap-3 shadow-retro">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. BANNER KETENTUAN IMPERSONASI & RBAC */}
      <div className="p-4 rounded-xl border-2 border-black bg-amber-50 shadow-retro space-y-2 text-xs font-mono text-amber-950">
        <div className="flex items-center gap-2 font-bold text-sm">
          <ShieldAlert className="h-4 w-4 text-amber-800" />
          <span>Protokol Keamanan Penyamaran Sesi (Super Admin Impersonation)</span>
        </div>
        <p className="text-amber-900 leading-relaxed font-sans">
          Setiap sesi impersonate dibatasi waktu maksimal 30 menit, ditandatangani dengan HMAC-SHA256 pada cookie httpOnly, wajib menyertakan alasan investigasi (min 10 karakter), dan seluruh aktivitas dicatat pada tabel <code>audit_logs</code> dengan relasi <code>actor_id</code> (Super Admin) dan <code>on_behalf_of</code> (Pengguna Sasaran). Server secara ketat menolak: ubah password/email, hapus akun, putusan nilai, kirim jawaban ujian, dan chaining impersonasi.
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

        {/* TABEL PENGGUNA DENGAN KONTROL RBAC & IMPERSONATE */}
        <div className="overflow-x-auto">
          {!isDemo && filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-black/60 font-mono text-xs border-2 border-dashed border-black/20 rounded-xl space-y-2">
              <p className="font-bold text-black">Data Pengguna Belum Terhubung ke Database Production</p>
              <p>Menunggu koneksi live Supabase Auth dan tabel <code>profiles</code> dikonfigurasi.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-retro-warm font-mono font-black text-black">
                  <th className="p-3">Nama & Identitas</th>
                  <th className="p-3">Email Institusi</th>
                  <th className="p-3">Peran (Role)</th>
                  <th className="p-3 text-center">Status Akun</th>
                  <th className="p-3 text-center">Kelola Peran (RBAC)</th>
                  <th className="p-3 text-center">Aksi Impersonate</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-black font-mono">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-retro-warm/30 transition-colors">
                    <td className="p-3 font-sans">
                      <div className="font-bold text-black">{u.name}</div>
                      <span className="text-xs font-mono text-black/60">{u.identifier}</span>
                    </td>
                    <td className="p-3 text-black/80">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded border border-black bg-neutral-100 font-bold text-xs">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-bold text-xs">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <select
                        disabled={pending}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 rounded border border-black bg-white font-mono text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="LECTURER">LECTURER</option>
                        <option value="TEACHING_ASSISTANT">TEACHING_ASSISTANT</option>
                        <option value="PROGRAM_COORDINATOR">PROGRAM_COORDINATOR</option>
                        <option value="ACADEMIC_STAFF">ACADEMIC_STAFF</option>
                        <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        disabled={!isDemo || pending}
                        onClick={() => handleOpenImpersonate(u)}
                        title={!isDemo ? 'Fitur ini belum aktif' : undefined}
                        className={`px-3 py-1.5 rounded border-2 font-bold text-xs transition-all flex items-center gap-1.5 mx-auto ${
                          !isDemo
                            ? 'border-neutral-400 bg-neutral-200 text-neutral-500 cursor-not-allowed opacity-75'
                            : 'border-black bg-black text-white hover:bg-retro-warm hover:text-black cursor-pointer'
                        }`}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>{!isDemo ? 'Fitur ini belum aktif' : 'Impersonate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL IMPERSONASI (ALASAN WAJIB MIN 10 KARAKTER - A3b) */}
      {impersonateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-xl border-4 border-black shadow-retro-lg p-6 space-y-4 animate-scale-in font-mono">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <h3 className="font-heading font-black text-lg text-black">
                  Konfirmasi Impersonasi Pengguna
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setImpersonateTarget(null)}
                className="p-1 hover:bg-neutral-100 rounded border border-black cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border-2 border-amber-500 rounded text-xs text-amber-950 space-y-1">
              <div className="font-bold">Target Pengguna: {impersonateTarget.name} ({impersonateTarget.role})</div>
              <div>ID: <code>{impersonateTarget.id}</code></div>
              <div className="text-xs text-amber-900 mt-1">
                Sesi berlangsung maksimal 30 menit. Seluruh aksi dicatat pada log audit sistem.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-black">
                Alasan Investigasi Teknis (Wajib Minimal 10 Karakter):
              </label>
              <textarea
                rows={3}
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                placeholder="Contoh: Investigasi kendala sinkronisasi presensi mahasiswa bersangkutan..."
                className="w-full p-2.5 rounded border-2 border-black bg-retro-warm/20 text-xs font-sans"
              />
              <span className="text-xs text-black/60">
                Panjang karakter: {impersonateReason.trim().length} / minimal 10
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setImpersonateTarget(null)}
                className="px-4 py-2 rounded-lg border-2 border-black bg-white font-bold text-xs hover:bg-neutral-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={pending || impersonateReason.trim().length < 10}
                onClick={handleConfirmImpersonate}
                className="px-4 py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-xs hover:bg-retro-warm hover:text-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <UserCheck className="h-4 w-4" />
                <span>{pending ? 'Memulai Sesi...' : 'Mulai Impersonasi (30 Menit)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
