import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function LabHeadLayout({ children }: { children: React.ReactNode }) {
  // A3a: Hanya pengguna dengan role resmi LAB_HEAD di DB yang boleh mengakses /lab/**
  // Super Admin hanya dapat mengakses rute ini melalui sesi impersonasi aktif.
  await assertServerRole(['LAB_HEAD']);

  return <>{children}</>;
}
