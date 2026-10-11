import React from 'react';
import { SuperadminUsersHubView } from '@/modules/admin/superadmin-users-hub-view';

export const metadata = {
  title: 'Kelola Pengguna & Impersonate - SIAJAR LMS',
  description: 'Manajemen akun civitas akademika dan sesi impersonasi teknis',
};

import { assertServerRole } from '@/lib/auth/server-guards';

export default async function SuperadminUsersPage() {
  await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
  return <SuperadminUsersHubView />;
}
