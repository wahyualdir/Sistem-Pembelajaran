import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Layers, LogOut } from 'lucide-react';
import { getCurrentUserWithRoles, logoutAction } from '@/modules/identity/actions';
import { getDynamicMenuBadgesAction } from '@/modules/academic/actions';
import { AiAcademicAssistant } from '@/components/shared/ai-academic-assistant';
import { Toaster } from '@/components/ui/toast';
import { PortalShell } from './portal-shell';

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  STUDENT: 'Mahasiswa',
  LECTURER: 'Dosen Pengampu',
  TEACHING_ASSISTANT: 'Asisten',
  PROGRAM_COORDINATOR: 'Prodi',
  ACADEMIC_STAFF: 'Staf Akademik',
  SYSTEM_ADMIN: 'System Administrator',
  SUPER_ADMIN: 'Super Admin',
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const userContext = await getCurrentUserWithRoles();

  if (!userContext) {
    redirect('/login');
  }

  const { profile, roles, activeRole } = userContext;
  const role = activeRole || 'STUDENT';
  const badges = await getDynamicMenuBadgesAction();
  const unread = badges.unreadCount;
  const roleName = ROLE_DISPLAY_NAMES[role] || 'Pengguna';

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
