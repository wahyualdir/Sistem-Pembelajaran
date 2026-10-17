import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Layers, LogOut } from 'lucide-react';
import { getCurrentUserWithRoles, logoutAction } from '@/modules/identity/actions';
import { getSession } from '@/lib/auth/session';
import { countUnreadAction } from '@/modules/academic/actions';
import { AiAcademicAssistant } from '@/components/shared/ai-academic-assistant';
import { PortalShell } from '@/app/(portal)/portal-shell';

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  STUDENT: 'Mahasiswa',
  LECTURER: 'Dosen Pengampu',
  TEACHING_ASSISTANT: 'Asisten',
  PROGRAM_COORDINATOR: 'Prodi',
  ACADEMIC_STAFF: 'Staf Akademik',
  SYSTEM_ADMIN: 'System Administrator',
  SUPER_ADMIN: 'Super Admin',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userContext = await getCurrentUserWithRoles();
  const session = await getSession();

  if (!userContext && !session) {
    redirect('/login');
  }

  // Tentukan peran aktif
  let role = userContext?.activeRole || 'STUDENT';
  if (!userContext && session) {
    if (session.role === 'ADMIN') role = 'SYSTEM_ADMIN';
    else if (session.role === 'DOSEN') role = 'LECTURER';
    else role = 'STUDENT';
  }

  const roleName = ROLE_DISPLAY_NAMES[role] || role;
  const unread = await countUnreadAction().catch(() => 0);
  const roles = userContext?.roles || [role];

  const roleBlock =
    roles.length > 1 ? (
      <Link
        href="/workspace"
        className="flex items-center justify-between rounded-control bg-gray-soft px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border border-retro-border/40"
      >
        <span className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          {roleName}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Link>
    ) : (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-gray-dark" />
        {roleName}
      </p>
    );

  const profile = userContext?.profile || {
    id: session?.userId || 'u-1',
    full_name: session?.name || 'Wahyu Aldiriyanto',
    email: session?.email || 'wahyu@student.uir.ac.id',
  };

  const account = (
    <div className="border-t-[1.5px] border-retro-border bg-gray-soft/50 p-4">
      <p className="truncate text-sm font-bold text-foreground">{profile?.full_name}</p>
      <p className="mb-3 truncate text-xs text-muted-foreground font-sans">{profile?.email}</p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="-mx-2.5 flex items-center gap-2 rounded-control px-2.5 py-1.5 text-sm font-semibold text-primary-dark transition-colors hover:bg-primary/10 focus-visible:outline-none"
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
    >
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="w-full space-y-6">
          {children}
        </div>
      </div>
      <AiAcademicAssistant />
    </PortalShell>
  );
}
