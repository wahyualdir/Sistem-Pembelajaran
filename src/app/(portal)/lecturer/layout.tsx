import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function LecturerLayout({ children }: { children: React.ReactNode }) {
  // A2: Hanya pengguna dengan role resmi LECTURER atau SUPER_ADMIN di DB yang boleh mengakses /lecturer/**
  await assertServerRole(['LECTURER', 'SUPER_ADMIN', 'SUPERADMIN']);

  return <>{children}</>;
}
