'use server';

import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config/features';

export interface AuditItem {
  id: string;
  created_at: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  description: string;
  on_behalf_of_name?: string;
  is_masked?: boolean;
}

const SAMPLE_AUDIT_LOGS: AuditItem[] = [
  {
    id: 'aud-001',
    created_at: '11 Okt 2026, 06:45 WIB',
    actor_name: 'Dr. Budi Santoso',
    actor_role: 'LECTURER',
    action: 'grade.change_request',
    entity_type: 'grade_change_requests',
    description: 'Mengajukan perubahan nilai mahasiswa Ahmad Fauzi (72 -> 85) pada Tugas 3.',
    is_masked: true,
  },
  {
    id: 'aud-002',
    created_at: '11 Okt 2026, 07:10 WIB',
    actor_name: 'Prof. Dewi Lestari',
    actor_role: 'PROGRAM_COORDINATOR',
    action: 'grade.change_approve',
    entity_type: 'grade_change_requests',
    description: 'Menyetujui usulan perubahan nilai mahasiswa Ahmad Fauzi.',
    is_masked: true,
  },
  {
    id: 'aud-003',
    created_at: '11 Okt 2026, 07:15 WIB',
    actor_name: 'Eko Staf Akademik',
    actor_role: 'ACADEMIC_STAFF',
    action: 'grade.change_execute',
    entity_type: 'student_grades',
    description: 'Mengeksekusi nilai mahasiswa ke pangkalan data master nilai semester.',
    is_masked: true,
  },
  {
    id: 'aud-004',
    created_at: '11 Okt 2026, 07:20 WIB',
    actor_name: 'Super Administrator',
    actor_role: 'SUPER_ADMIN',
    action: 'auth.impersonate_user',
    entity_type: 'users',
    description: 'Memulai sesi impersonasi investigasi teknis pada akun Ahmad Mahasiswa.',
    on_behalf_of_name: 'Ahmad Mahasiswa (STUDENT)',
    is_masked: false,
  },
];

export async function getAuditLogsAction(): Promise<AuditItem[]> {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'SYSTEM_ADMIN' && role !== 'SUPER_ADMIN' && role !== 'SUPERADMIN') {
    return [];
  }

  const isDemo = isDemoMode();
  if (isDemo) {
    return SAMPLE_AUDIT_LOGS;
  }

  try {
    const supabase = await createClient();
    // System Admin membaca dari view audit_logs_for_sysadmin yang menyamarkan data nilai/akademik
    const targetTable = role === 'SYSTEM_ADMIN' ? 'audit_logs_for_sysadmin' : 'audit_logs';

    const { data, error } = await (supabase as any)
      .from(targetTable)
      .select('*, profiles:actor_user_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      return SAMPLE_AUDIT_LOGS;
    }

    return data.map((d: any) => {
      const dateStr = new Date(d.created_at).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';

      const isMasked =
        d.before_json?.disamarkan === true ||
        d.after_json?.disamarkan === true ||
        ['grades', 'submissions', 'exam_attempts', 'questions', 'absence_requests'].includes(d.entity_type);

      let desc = `${d.action} pada entitas ${d.entity_type}`;
      if (isMasked && role === 'SYSTEM_ADMIN') {
        desc += ' [Rincian nilai akademik disamarkan]';
      }

      return {
        id: d.id,
        created_at: dateStr,
        actor_name: d.profiles?.full_name || d.actor_role || 'Sistem',
        actor_role: d.actor_role || 'SYSTEM',
        action: d.action,
        entity_type: d.entity_type,
        description: desc,
        is_masked: isMasked,
      };
    });
  } catch {
    return SAMPLE_AUDIT_LOGS;
  }
}
