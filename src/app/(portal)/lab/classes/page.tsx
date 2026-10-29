import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { assertServerRole } from '@/lib/auth/server-guards';
import { LabClassesView } from '@/modules/academic/lab-head-hub-view';

export const metadata = {
  title: 'Kelas Praktikum (Kepala Lab) — SIAJAR',
};

export default async function LabHeadClassesPage() {
  await assertServerRole(['LAB_HEAD']);
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'LAB_HEAD' && !user?.isImpersonating) {
    redirect('/workspace');
  }

  return <LabClassesView />;
}
