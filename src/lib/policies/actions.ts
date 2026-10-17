'use server';

// Server Actions untuk Pengaturan Kebijakan Akademik Institusi
import {
  getAllPoliciesAction as getAllPoliciesCore,
  updatePolicyAction as updatePolicyCore,
  type InstitutionPolicyItem,
} from './index';
import type { ActionResponse } from '@/modules/identity/types';

export async function getAllPoliciesAction(): Promise<InstitutionPolicyItem[]> {
  return getAllPoliciesCore();
}

export async function updatePolicyAction(
  key: string,
  newValue: any
): Promise<ActionResponse<{ key: string; value: any }>> {
  return updatePolicyCore(key, newValue);
}
