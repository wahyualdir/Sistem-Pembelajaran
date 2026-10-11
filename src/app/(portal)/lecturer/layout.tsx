import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function LecturerLayout({ children }: { children: React.ReactNode }) {
  // A3a: Hanya pengguna dengan role resmi LECTURER di DB yang boleh mengakses /lecturer/**
  // Super Admin hanya dapat mengakses rute ini melalui sesi impersonasi aktif.
  await assertServerRole(['LECTURER']);

  return <>{children}</>;
}
