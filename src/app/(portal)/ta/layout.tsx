import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function TaLayout({ children }: { children: React.ReactNode }) {
  // A2: Hanya pengguna dengan role resmi TEACHING_ASSISTANT atau SUPER_ADMIN di DB yang boleh mengakses /ta/**
  await assertServerRole(['TEACHING_ASSISTANT', 'SUPER_ADMIN', 'SUPERADMIN']);

  return <>{children}</>;
}
