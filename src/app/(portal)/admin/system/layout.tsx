import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';

export default async function AdminSystemLayout({ children }: { children: React.ReactNode }) {
  // A3b: /admin/system/** hanya untuk SYSTEM_ADMIN dan SUPER_ADMIN
  await assertServerRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN']);

  return <>{children}</>;
}
