import React from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { assertServerRole } from '@/lib/auth/server-guards';
import { AdminDashboardClient } from './admin-dashboard-client';

export default async function AdminPortalPage() {
  const userContext = await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
  const profile = userContext?.profile;

  // Query data nyata dari tabel audit_logs dan login_events
  const { data: auditLogs } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: loginEvents } = await supabaseAdmin
    .from('login_events')
    .select('*, profiles:user_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <AdminDashboardClient
      auditLogs={auditLogs || []}
      loginEvents={loginEvents || []}
      adminName={profile?.full_name || 'Super Administrator'}
    />
  );
}
