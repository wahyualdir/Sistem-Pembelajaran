import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // A2: Hanya pengguna dengan role resmi SUPER_ADMIN atau SYSTEM_ADMIN di DB yang boleh mengakses /admin/**
  await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN', 'SYSTEM_ADMIN']);

  return <>{children}</>;
}
