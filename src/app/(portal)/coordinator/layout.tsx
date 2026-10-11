import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  // A3a: Hanya pengguna dengan role resmi PROGRAM_COORDINATOR di DB yang boleh mengakses /coordinator/**
  // Super Admin hanya dapat mengakses rute ini melalui sesi impersonasi aktif.
  await assertServerRole(['PROGRAM_COORDINATOR']);

  return <>{children}</>;
}
