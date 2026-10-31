import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Layers, LogOut } from 'lucide-react';
import { getCurrentUserResolution, logoutAction } from '@/modules/identity/actions';
import { getDynamicMenuBadgesAction } from '@/modules/academic/actions';
import { getRoleDisplayName } from '@/lib/config/menu-config';
import { AiAcademicAssistant } from '@/components/shared/ai-academic-assistant';
import { Toaster } from '@/components/ui/toast';
import { PortalShell } from './portal-shell';
import { navDebug } from '@/lib/auth/nav-debug';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const resolution = await getCurrentUserResolution();

  // 1. Kasus layanan Supabase / DB tidak dapat diakses
  if (resolution.status === 'UNAVAILABLE' || resolution.rolesStatus === 'ERROR') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5]">
        <div className="max-w-md w-full p-6 bg-white border border-[#DFD8CB] rounded-xl text-center space-y-4 shadow-sm">
          <h1 className="text-lg font-bold text-[#1C1917]">Layanan sementara tidak tersedia</h1>
          <p className="text-sm text-[#57534E]">
            Terjadi kendala saat menghubungkan ke basis data. Silakan muat ulang halaman atau coba beberapa saat lagi.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-[#C2553A] text-white rounded text-sm font-semibold hover:bg-[#A8432B] transition-colors"
          >
            Muat ulang
          </a>
        </div>
      </div>
    );
  }

  // 2. Kasus belum terautentikasi -> redirect ke login dengan alasan sesi
  if (resolution.status === 'UNAUTHENTICATED' || !resolution.context) {
    navDebug('portal_layout_redirect_login', { reason: 'userContext is null' });
    redirect('/login?alasan=sesi');
  }

  // 3. Kasus terautentikasi tetapi tidak memiliki peran aktif (EMPTY)
  if (resolution.rolesStatus === 'EMPTY' || !resolution.context.activeRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5]">
        <div className="max-w-md w-full p-6 bg-white border border-[#DFD8CB] rounded-xl text-center space-y-4 shadow-sm">
          <h1 className="text-lg font-bold text-[#1C1917]">Peran Belum Ditetapkan</h1>
          <p className="text-sm text-[#57534E]">
            Akun Anda belum memiliki peran aktif. Hubungi staf administrasi.
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1C1917] text-white rounded text-sm font-semibold hover:bg-black transition-colors cursor-pointer"
            >
              Keluar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Kasus cookie active_role tidak cocok dengan daftar peran di database
  if (resolution.roleCookieMismatch) {
    navDebug('portal_layout_role_mismatch', {
      activeRole: resolution.context.activeRole,
    });
    redirect('/workspace?alasan=peran-tidak-cocok');
  }

  const userContext = resolution.context;
  const { profile, roles, activeRole } = userContext;
  const role = activeRole;
  const badges = await getDynamicMenuBadgesAction();
  const unread = badges.unreadCount;
  const roleName = getRoleDisplayName(role);

  const roleBlock = (
    <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm">
      <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="font-semibold text-foreground">{roleName}</span>
      {roles.length > 1 && (
        <Link
          href="/workspace"
          className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span>Ganti</span>
          <ChevronDown className="h-3 w-3" />
        </Link>
      )}
    </div>
  );

  const account = (
    <div className="border-t border-border p-4">
      <p className="truncate text-sm font-medium">{profile?.full_name}</p>
      <p className="mb-3 truncate text-xs text-muted-foreground">{profile?.email}</p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="-mx-2.5 flex items-center gap-2 rounded-control px-2.5 py-1.5 text-sm font-medium text-primary-dark transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </form>
    </div>
  );

  return (
    <PortalShell
      role={role}
      roleName={roleName}
      roleBlock={roleBlock}
      unread={unread}
      badges={badges}
      profile={profile}
      account={account}
      isImpersonating={userContext.isImpersonating}
      availableRoles={roles.map((r) => (r.roles as any)?.code || r.role_id).filter(Boolean)}
    >
      {children}
      <AiAcademicAssistant />
      <Toaster />
    </PortalShell>
  );
}
