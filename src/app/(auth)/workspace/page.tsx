import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles, switchWorkspaceAction } from '@/modules/identity/actions';
import {
  GraduationCap,
  BookOpen,
  Users,
  Compass,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  Flame,
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

  // Jika pengguna hanya memiliki 1 role, alihkan langsung
  if (roles.length === 1) {
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
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
      className="min-h-[100dvh] w-full bg-background text-black font-sans selection:bg-retro-yellow selection:text-black flex flex-col justify-between antialiased relative"
    >
      {/* Background Dot-Grid Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(black 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Top Bar Navigasi Sistem Retro Konsisten dengan Dashboard & Login */}
      <header className="h-header-mobile md:h-header flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b-2 border-black bg-retro-yellow shrink-0 select-none shadow-retro-sm relative z-10 pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3">
          {/* Mac Traffic Light Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-traffic-red inline-block shadow-retro-sm" />
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-traffic-yellow inline-block shadow-retro-sm" />
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-traffic-green inline-block shadow-retro-sm" />
          </div>

          <div className="flex items-center gap-2.5 ml-1">
            <div className="flex h-8 w-8 items-center justify-center rounded border-2 border-black bg-black text-white shadow-retro-sm">
              <Flame className="h-4.5 w-4.5 fill-retro-orange text-retro-orange" />
            </div>
            <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-black">
              SIAJAR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center px-3 py-1 border-2 border-black bg-white text-xs font-mono font-bold text-black shadow-retro-sm">
            TA 2026/2027 GANJIL
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-xl mx-auto w-full">
          {/* Retro Window Container */}
          <div className="rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro-md sm:shadow-retro-window overflow-hidden transition-all animate-fade-up">
            {/* Header Bar Jendela Retro */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b-2 border-black bg-retro-warm">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-traffic-red shadow-retro-sm" />
                <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-traffic-yellow shadow-retro-sm" />
                <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-black bg-traffic-green shadow-retro-sm" />
                <span className="text-xs sm:text-sm font-bold text-black ml-1.5 font-heading">
                  Pilih Ruang Kerja — SIAJAR
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-white text-black border border-black px-2.5 py-0.5 rounded shadow-retro-sm">
                Multi-Peran
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-black">
                  Pilih Ruang Kerja
                </h1>
                <p className="text-xs sm:text-sm text-black/75 max-w-md mx-auto leading-relaxed">
                  Halo, <strong className="font-bold text-black">{profile?.full_name}</strong>. Akun Anda memiliki akses ke beberapa peran. Silakan pilih ruang kerja yang ingin Anda buka.
                </p>
              </div>

              <div className="space-y-3.5">
                {roles.map((r) => {
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
                      className={`rounded-xl border-2 border-black p-4 sm:p-5 flex items-center justify-between gap-4 transition-all ${
                        isActive
                          ? 'bg-retro-warm border-black shadow-retro'
                          : 'bg-white hover:bg-retro-warm/30 border-black shadow-retro hover:shadow-retro-md hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl border-2 border-black bg-white flex items-center justify-center text-retro-orange shadow-retro-sm shrink-0 mt-0.5">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm sm:text-base font-bold text-black font-heading truncate">
                              {meta.label}
                            </h2>
                            {isActive && (
                              <span className="text-xs font-bold bg-retro-mint text-black border border-black px-2 py-0.5 rounded shadow-retro-sm flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="h-3 w-3" /> Sedang Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-black/70 mt-1 line-clamp-2 leading-relaxed">
                            {meta.desc}
                          </p>
                        </div>
                      </div>

                      <form action={switchWorkspaceAction} className="shrink-0">
                        <input type="hidden" name="roleCode" value={roleCode} />
                        <button
                          type="submit"
                          className="h-10 px-4 sm:px-5 rounded-lg border-2 border-black bg-retro-orange text-white hover:bg-black font-bold text-xs sm:text-sm shadow-retro hover:shadow-retro-md active:translate-x-0.5 active:translate-y-0.5 transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                          <span>Masuk</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 text-center border-t-2 border-black/10">
                <p className="text-xs text-black/60 font-medium">
                  Anda dapat berpindah ruang kerja kapan saja melalui pemilih workspace di pojok menu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Minimalis */}
      <footer className="py-4 text-center text-xs text-black/50 relative z-10 border-t border-black/10 bg-retro-warm/30">
        SIAJAR &copy; 2026 &middot; Sistem Informasi Ajar Terpadu &middot; Hak Cipta Dilindungi
      </footer>
    </div>
  );
}
