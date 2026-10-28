import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function SecretaryLayout({ children }: { children: React.ReactNode }) {
  // A3a: Hanya pengguna dengan role resmi PROGRAM_SECRETARY di DB yang boleh mengakses /secretary/**
  // Super Admin hanya dapat mengakses rute ini melalui sesi impersonasi aktif.
  await assertServerRole(['PROGRAM_SECRETARY']);

  return <>{children}</>;
}
