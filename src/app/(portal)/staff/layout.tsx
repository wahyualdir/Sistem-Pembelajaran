import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  // A2: Hanya pengguna dengan role resmi ACADEMIC_STAFF atau SUPER_ADMIN di DB yang boleh mengakses /staff/**
  await assertServerRole(['ACADEMIC_STAFF', 'SUPER_ADMIN', 'SUPERADMIN']);

  return <>{children}</>;
}
