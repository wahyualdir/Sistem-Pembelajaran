import React from 'react';
import { SuperadminPoliciesHubView } from '@/modules/admin/superadmin-policies-hub-view';

export const metadata = {
  title: 'Kebijakan Akademik, Ujian & Privasi - SIAJAR LMS',
  description: 'Pengaturan standar baku kelulusan, batas pengawasan ujian, dan privasi UU PDP',
};

export default function SuperadminPoliciesPage() {
  return <SuperadminPoliciesHubView />;
}
