import React from 'react';
import { SuperadminRolesHubView } from '@/modules/admin/superadmin-roles-hub-view';

export const metadata = {
  title: 'Role & Permission Matrix - SIAJAR LMS',
  description: 'Matriks izin granular 7 peran pengguna SIAJAR',
};

import { assertServerRole } from '@/lib/auth/server-guards';

export default async function SuperadminRolesPage() {
  await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
  return <SuperadminRolesHubView />;
}
