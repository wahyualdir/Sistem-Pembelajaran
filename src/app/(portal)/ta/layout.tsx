import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function TaLayout({ children }: { children: React.ReactNode }) {
  // A3a: Hanya pengguna dengan role resmi TEACHING_ASSISTANT di DB yang boleh mengakses /ta/**
  // Super Admin hanya dapat mengakses rute ini melalui sesi impersonasi aktif.
  await assertServerRole(['TEACHING_ASSISTANT']);

  return <>{children}</>;
}
