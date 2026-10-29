import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { assertServerRole } from '@/lib/auth/server-guards';
import { LabDashboardClient } from '@/modules/academic/lab-head-hub-view';

export const metadata = {
  title: 'Beranda Kepala Laboratorium — SIAJAR',
};

export default async function LabHeadPortalPage() {
  await assertServerRole(['LAB_HEAD']);
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'LAB_HEAD' && !user?.isImpersonating) {
    redirect('/workspace');
  }

  const rawName = user?.profile?.full_name;
  const isGenericAdmin = rawName && (rawName.toLowerCase().includes('administrator') || rawName.toLowerCase().includes('admin'));
  const labHeadName = rawName && !isGenericAdmin ? rawName : 'Ir. Hendra Wijaya, M.T.';

  return <LabDashboardClient labHeadName={labHeadName} />;
}
