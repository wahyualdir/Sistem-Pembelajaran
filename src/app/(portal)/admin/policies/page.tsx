import React from 'react';
import { SuperadminPoliciesHubView } from '@/modules/admin/superadmin-policies-hub-view';

export const metadata = {
  title: 'Kebijakan Akademik, Ujian & Privasi - RuangKampus',
  description: 'Pengaturan standar baku kelulusan, batas pengawasan ujian, dan privasi UU PDP',
};

import { assertServerRole } from '@/lib/auth/server-guards';

export default async function SuperadminPoliciesPage() {
  await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
  return <SuperadminPoliciesHubView />;
}
