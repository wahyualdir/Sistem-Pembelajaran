import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles, switchWorkspaceAction } from '@/modules/identity/actions';
import { cn } from '@/lib/utils';
import {
  GraduationCap,
  BookOpen,
  Users,
  Compass,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const ROLE_METADATA: Record<
  string,
  { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  STUDENT: {
    label: 'Portal Mahasiswa',
    desc: 'Mengikuti kelas, mengakses materi kuliah, mengumpulkan tugas, kuis, dan melihat nilai akademik.',
    icon: GraduationCap,
  },
  LECTURER: {
    label: 'Portal Dosen Pengampu',
    desc: 'Mengelola perkuliahan, modul pembelajaran, penugasan, rubrik, dan penilaian mahasiswa.',
    icon: BookOpen,
  },
  TEACHING_ASSISTANT: {
    label: 'Portal Asisten Dosen & Lab',
    desc: 'Membantu asistensi praktikum, review draf laporan tugas, dan presensi kelas.',
    icon: Users,
  },
  PROGRAM_COORDINATOR: {
    label: 'Portal Pimpinan Program Studi',
    desc: 'Monitoring capaian kurikulum, persetujuan revisi nilai final, dan sistem peringatan dini prodi.',
    icon: Compass,
  },
  ACADEMIC_STAFF: {
    label: 'Portal Administrasi Akademik (BAAK)',
    desc: 'Pengelolaan data master prodi, kalender semester, katalog mata kuliah, dan rombongan belajar.',
    icon: FileSpreadsheet,
  },
  SYSTEM_ADMIN: {
    label: 'Portal Administrator Sistem',
    desc: 'Manajemen hak akses pengguna, penugasan peran, audit log keamanan, dan integritas sistem.',
    icon: ShieldAlert,
  },
  SUPER_ADMIN: {
    label: 'Portal Super Administrator',
    desc: 'Kendali operasional menyeluruh universitas, kebijakan akademik, dan isolasi keamanan RLS.',
    icon: ShieldAlert,
  },
};

export default async function WorkspacePage() {
  const userContext = await getCurrentUserWithRoles();

  if (!userContext) {
    redirect('/login');
  }

  const { profile, roles, activeRole } = userContext;

  const isSuperAdmin = roles.some((r) => {
    const code = (r.roles as { code?: string })?.code;
    return code === 'SUPER_ADMIN';
  });

  const ALL_SYSTEM_ROLES = [
    'STUDENT',
    'LECTURER',
    'TEACHING_ASSISTANT',
    'PROGRAM_COORDINATOR',
    'ACADEMIC_STAFF',
    'SYSTEM_ADMIN',
    'SUPER_ADMIN',
  ];

  const existingRoleCodes = new Set(
    roles.map((r) => (r.roles as { code?: string })?.code).filter(Boolean)
  );

  const displayRoles = [...roles];
  if (isSuperAdmin) {
    for (const code of ALL_SYSTEM_ROLES) {
      if (!existingRoleCodes.has(code)) {
        displayRoles.push({
          id: `superadmin-access-${code}`,
          role_id: code,
          roles: { code, name: code, description: 'Akses Global Super Administrator' },
        } as any);
      }
    }
  }

  // Jika pengguna hanya memiliki 1 role, alihkan langsung ke halamannya
  if (!isSuperAdmin && roles.length === 1) {
    const singleRole = (roles[0].roles as { code?: string })?.code as string;
    const portalMap: Record<string, string> = {
      STUDENT: '/student',
      LECTURER: '/lecturer',
      TEACHING_ASSISTANT: '/ta',
      PROGRAM_COORDINATOR: '/coordinator',
      ACADEMIC_STAFF: '/staff',
      SYSTEM_ADMIN: '/admin',
      SUPER_ADMIN: '/admin',
    };
    redirect(portalMap[singleRole] || '/student');
  }

  return (
    <div className="min-h-screen bg-[#F3F3F4] text-[#111111] font-sans flex flex-col justify-between antialiased">
      {/* 1. Institutional Top Bar Telkom University */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#9F1521] text-white shadow-xs">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1 shadow-xs">
            <img
              src="/logo-ruangkampus.png"
              alt="Telkom University Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
              Telkom University
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/80 font-medium leading-none">
              Portal Akademik Terpadu
            </span>
          </div>
        </Link>

        <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-medium">
          Semester Ganjil 2026/2027
        </span>
      </header>

      {/* 2. Main Workspace Selector */}
      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E3E4] shadow-sm p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-[#FEF2F2] text-[#9F1521] text-xs font-semibold">
                Multi-Peran Terautentikasi
              </span>
              <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-[#111111]">
                Pilih Ruang Kerja Portal
              </h1>
              <p className="text-xs sm:text-sm text-[#58595B] max-w-md mx-auto">
                Halo, <strong className="font-semibold text-[#111111]">{profile?.full_name}</strong>. Akun Anda memiliki otorisasi multi-peran. Silakan pilih portal kerja yang ingin Anda tuju.
              </p>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {displayRoles.map((r) => {
                const roleCode = (r.roles as { code?: string })?.code as string;
                const meta = ROLE_METADATA[roleCode] || {
                  label: roleCode,
                  desc: 'Akses ruang kerja akademik.',
                  icon: Users,
                };
                const Icon = meta.icon;
                const isActive = activeRole === roleCode;

                return (
                  <div
                    key={r.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all flex items-center justify-between gap-4',
                      isActive
                        ? 'border-[#9F1521] bg-[#FEF2F2]/40 shadow-xs'
                        : 'border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#808285]'
                    )}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={cn(
                          'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border',
                          isActive
                            ? 'bg-[#9F1521] text-white border-[#9F1521]'
                            : 'bg-[#F3F3F4] text-[#9F1521] border-[#E2E3E4]'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm sm:text-base font-heading font-bold text-[#111111] truncate">
                            {meta.label}
                          </h2>
                          {isActive && (
                            <span className="text-[10px] font-semibold bg-[#059669] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="h-3 w-3" /> Sedang Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#58595B] mt-1 line-clamp-2 leading-relaxed">
                          {meta.desc}
                        </p>
                      </div>
                    </div>

                    <form action={switchWorkspaceAction} className="shrink-0">
                      <input type="hidden" name="roleCode" value={roleCode} />
                      <button
                        type="submit"
                        className={cn(
                          'h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs',
                          isActive
                            ? 'bg-[#9F1521] hover:bg-[#8F131E] text-white'
                            : 'bg-[#F3F3F4] hover:bg-[#E2E3E4] text-[#111111] border border-[#E2E3E4]'
                        )}
                      >
                        <span>Masuk</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-center border-t border-[#E2E3E4]">
              <p className="text-xs text-[#808285]">
                Anda dapat berpindah peran kapan saja melalui menu identitas di pojok kanan atas.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Clean Footer */}
      <footer className="py-4 text-center text-xs text-[#58595B] border-t border-[#E2E3E4] bg-[#FFFFFF]">
        &copy; 2026 Telkom University &middot; CeLOE Learning Management System
      </footer>
    </div>
  );
}
