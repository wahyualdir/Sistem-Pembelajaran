import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Layers, LogOut } from 'lucide-react';
import { getCurrentUserWithRoles, logoutAction } from '@/modules/identity/actions';
import { countUnreadAction } from '@/modules/academic/actions';
import { AiAcademicAssistant } from '@/components/shared/ai-academic-assistant';
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
  const roleName = ROLE_DISPLAY_NAMES[role] || role;
  const unread = await countUnreadAction();

  const roleBlock =
    roles.length > 1 ? (
      <Link
        href="/workspace"
        className="flex items-center justify-between rounded-control bg-muted px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          {roleName}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Link>
    ) : (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-success" />
        {roleName}
      </p>
    );

  const account = (
    <div className="border-t border-border p-4">
      <p className="truncate text-sm font-medium">{profile?.full_name}</p>
      <p className="mb-3 truncate text-xs text-muted-foreground">{profile?.email}</p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="-mx-2.5 flex items-center gap-2 rounded-control px-2.5 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
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
      profile={profile}
      account={account}
      isImpersonating={userContext.isImpersonating}
    >
      {children}
      <AiAcademicAssistant />
    </PortalShell>
  );
}
