import { WindowTrafficLights } from '@/components/retro/window-traffic-lights';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles, switchWorkspaceAction } from '@/modules/identity/actions';
import { cn } from '@/lib/utils';
import {
  Layers,
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
    label: 'Ruang Mahasiswa',
    desc: 'Mengikuti kelas, mengakses materi, mengumpulkan tugas, kuis, dan melihat nilai.',
    icon: GraduationCap,
  },
  LECTURER: {
    label: 'Ruang Dosen',
    desc: 'Mengelola perkuliahan, materi, penugasan, rubrik, dan memfinalisasi penilaian.',
    icon: BookOpen,
  },
  TEACHING_ASSISTANT: {
    label: 'Ruang Asisten Dosen',
    desc: 'Membantu review tugas, moderasi forum diskusi, dan presensi sesuai delegasi dosen.',
    icon: Users,
  },
  PROGRAM_COORDINATOR: {
    label: 'Ruang Koordinator Prodi',
    desc: 'Monitoring kelas, persetujuan perubahan nilai final, dan pelaporan capaian prodi.',
    icon: Compass,
  },
  ACADEMIC_STAFF: {
    label: 'Ruang Staf Akademik',
    desc: 'Administrasi data master, tahun akademik, semester, mata kuliah, jadwal dan kelas.',
    icon: FileSpreadsheet,
  },
  PROGRAM_SECRETARY: {
    label: 'Ruang Sekretaris Prodi',
    desc: 'Membantu koordinasi akademik, operasional perkuliahan prodi, dan verifikasi berkas.',
    icon: Compass,
  },
  LAB_HEAD: {
    label: 'Ruang Kepala Laboratorium',
    desc: 'Pengelolaan sarana laboratorium, pemantauan praktikum, dan penugasan asisten lab.',
    icon: Layers,
  },
  DEAN: {
    label: 'Ruang Dekan',
    desc: 'Pemantauan capaian perkuliahan agregat, risiko mahasiswa, dan laporan mutu fakultas.',
    icon: GraduationCap,
  },
  SYSTEM_ADMIN: {
    label: 'Ruang System Administrator',
    desc: 'Manajemen pengguna, penugasan peran, audit log keamanan, dan konfigurasi sistem.',
    icon: ShieldAlert,
  },
  SUPER_ADMIN: {
    label: 'Ruang Super Administrator',
    desc: 'Manajemen global universitas, kelola pengguna, role & permission, dan kebijakan akademik.',
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

  // Jika pengguna hanya memiliki 1 role, alihkan langsung
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
    <div
      style={{
        fontFamily:
          "var(--font-sf-pro), 'SF Pro Display', 'SF Pro', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
      className="min-h-[100dvh] w-full vt-desktop-bg text-[#1C1917] font-sans selection:bg-[#C2553A] selection:text-white flex flex-col justify-between antialiased relative"
    >
      {/* 1. CRT Scanlines Overlay */}
      <div className="fixed inset-0 vt-scanlines pointer-events-none z-0" />

      {/* Top Bar Navigasi Sistem Velqora Retro OS */}
      <header className="h-header-mobile md:h-header flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b-2 border-[#7A756D] bg-[#ECE9D8] shrink-0 select-none shadow-xs relative z-10 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group focus-visible:outline-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-none border border-[#7A756D] bg-white p-1 shadow-2xs group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
              <Image
                src="/logo-ruangkampus.png"
                alt="Logo RuangKampus"
                width={36}
                height={36}
                className="h-full w-full object-contain [image-rendering:-webkit-optimize-contrast]"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-black text-base sm:text-lg tracking-tight text-[#1C1917] leading-none">
                Ruang<span className="text-[#C2553A]">Kampus</span>
              </span>
              <span className="text-[9.5px] font-mono font-bold text-[#853827] uppercase tracking-wider mt-0.5 leading-none">
                Academic Learning OS
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center px-3 py-1 bg-[#C2553A] text-white font-mono text-xs font-bold border-t border-l border-[#EE7257] border-b border-r border-[#6B2D20] shadow-xs select-none">
            TA 2026/2027 GANJIL
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-xl mx-auto w-full">
          {/* Velqora Retro OS Window Container */}
          <div className="vt-window rounded-none overflow-hidden transition-all shadow-xl animate-fade-up">
            {/* Header Bar Jendela Velqora OS */}
            <div className="vt-titlebar flex items-center justify-between px-3 py-1.5 select-none shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wide uppercase truncate">
                  WORKSPACE_MANAGER.EXE — RuangKampus OS
                </span>
                <span className="font-mono text-[10px] font-bold bg-black/25 text-white border border-white/30 px-1.5 py-0.2 shrink-0">
                  Multi-Peran
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="vt-window-btn" title="Minimalkan">_</span>
                <span className="vt-window-btn" title="Perbesar">□</span>
                <span className="vt-window-btn vt-window-btn-close" title="Tutup">×</span>
              </div>
            </div>

            <div className="p-6 sm:p-7 bg-[#FFFFFF] space-y-5">
              <div className="text-center space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[#1C1917]">
                  Pilih Ruang Kerja Akademik
                </h1>
                <p className="text-xs sm:text-sm text-[#57534E] max-w-md mx-auto leading-relaxed">
                  Halo, <strong className="font-bold text-[#1C1917]">{profile?.full_name}</strong>. Akun Anda memiliki akses multi-peran. Silakan pilih ruang kerja yang ingin Anda jalankan.
                </p>
              </div>

              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1.5">
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
                        'vt-window-inset p-3.5 sm:p-4 flex items-center justify-between gap-4 transition-all',
                        isActive
                          ? 'border-l-4 border-l-[#C2553A] bg-[#FAF8F5]'
                          : 'bg-white hover:bg-[#FAF8F5]'
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-none border border-[#7A756D] bg-[#FAF8F5] flex items-center justify-center text-[#C2553A] shrink-0 mt-0.5">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm sm:text-base font-bold text-[#1C1917] font-heading truncate">
                              {meta.label}
                            </h2>
                            {isActive && (
                              <span className="text-[10px] font-mono font-bold bg-[#C2553A] text-white px-2 py-0.5 border border-[#853827] flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="h-3 w-3" /> Sedang Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#57534E] mt-1 line-clamp-2 leading-relaxed">
                            {meta.desc}
                          </p>
                        </div>
                      </div>

                      <form action={switchWorkspaceAction} className="shrink-0">
                        <input type="hidden" name="roleCode" value={roleCode} />
                        <button
                          type="submit"
                          className="vt-btn-terracotta h-9 px-4 rounded-none font-mono text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Masuk</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-center border-t border-[#D6D3CB]">
                <p className="text-xs text-[#78716C] font-mono">
                  Tip: Anda dapat berpindah ruang kerja kapan saja melalui pemilih workspace di pojok menu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Minimalis Velqora OS */}
      <footer className="py-3 text-center text-xs font-mono text-[#78716C] relative z-10 border-t border-[#D6D3CB] bg-[#ECE9D8]">
        RuangKampus OS &copy; 2026 &middot; Academic Learning OS &middot; JOBLIB505
      </footer>
    </div>
  );
}
