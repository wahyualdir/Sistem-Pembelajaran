import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import type { EarlyWarningPolicy } from './types';

export const DEFAULT_EARLY_WARNING_POLICY: EarlyWarningPolicy = {
  minAttendancePercent: 75,
  warningAttendancePercent: 80,
  maxMissingAssignmentsWarning: 1,
  maxMissingAssignmentsHighRisk: 3,
  gradeDropThresholdPoints: 15,
  minMaterialProgressPercent: 50,
  updatedAt: new Date().toISOString(),
};

function getInMemoryPolicy(): EarlyWarningPolicy {
  return ((globalThis as any).__siajarEarlyWarningPolicy ??= { ...DEFAULT_EARLY_WARNING_POLICY });
}

export async function getEarlyWarningPolicy(): Promise<EarlyWarningPolicy> {
  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('system_settings')
        .select('value_json, updated_at')
        .eq('key', 'early_warning.policy')
        .maybeSingle();

      if (!error && data?.value_json) {
        return {
          ...DEFAULT_EARLY_WARNING_POLICY,
          ...data.value_json,
          updatedAt: data.updated_at || new Date().toISOString(),
        };
      }
    } catch {
      // fallback
    }
  }

  return getInMemoryPolicy();
}

export async function updateEarlyWarningPolicy(
  updates: Partial<EarlyWarningPolicy>
): Promise<EarlyWarningPolicy> {
  const current = await getEarlyWarningPolicy();
  const updated: EarlyWarningPolicy = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const online = await checkSupabaseOnline();
  if (online) {
    try {
      const supabase = await createClient();
      await supabase.from('system_settings').upsert({
        key: 'early_warning.policy',
        value_json: updated,
        updated_at: updated.updatedAt,
      });
    } catch {
      // fallback
    }
  }

  (globalThis as any).__siajarEarlyWarningPolicy = updated;
  return updated;
}
