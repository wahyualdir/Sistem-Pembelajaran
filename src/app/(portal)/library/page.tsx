import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listLibraryCatalogAction } from '@/modules/academic/actions';
import { LibraryHubView } from '@/modules/academic/library-hub-view';
import { isDemoMode } from '@/lib/config/features';

export default async function LibraryPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }

  const isStaffOrLecturer =
    role === 'LECTURER' ||
    role === 'ACADEMIC_STAFF' ||
    role === 'PROGRAM_COORDINATOR';
  const isDemo = isDemoMode();
  const books = await listLibraryCatalogAction();

  return <LibraryHubView books={books} isStaffOrLecturer={isStaffOrLecturer} isDemo={isDemo} />;
}
