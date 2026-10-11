import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  // A3a: Hanya pengguna dengan role resmi ACADEMIC_STAFF di DB yang boleh mengakses /staff/**
  // Super Admin hanya dapat mengakses rute ini melalui sesi impersonasi aktif.
  await assertServerRole(['ACADEMIC_STAFF']);

  return <>{children}</>;
}
