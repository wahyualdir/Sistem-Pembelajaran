import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  // A2: Hanya pengguna dengan role resmi PROGRAM_COORDINATOR atau SUPER_ADMIN di DB yang boleh mengakses /coordinator/**
  await assertServerRole(['PROGRAM_COORDINATOR', 'SUPER_ADMIN', 'SUPERADMIN']);

  return <>{children}</>;
}
