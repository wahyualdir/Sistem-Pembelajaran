import { NilaiStore } from '@/features/nilai/nilai-store';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkSupabaseOnline } from '@/lib/supabase/status';

export interface AuditLogInput {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  scopeType?: string;
  scopeId?: string | null;
  valueBefore?: string | null;
  valueAfter?: string | null;
  onBehalfOf?: string | null;
  metadata?: Record<string, any>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function recordSystemAuditLog(input: AuditLogInput): Promise<void> {
  // 1. Catat ke in-memory store (NilaiStore) untuk tampilan log audit portal & fallback demo
  try {
    NilaiStore.tambahLogAudit({
      penggunaId: input.actorId,
      penggunaNama: input.actorName,
      peran: input.actorRole,
      aksi: input.action,
      entitas: input.entityType,
      entitasId: input.entityId,
      keterangan: input.description,
      nilaiLama: input.valueBefore ?? null,
      nilaiBaru: input.valueAfter ?? null,
    });
  } catch (err) {
    console.error('Gagal mencatat audit log in-memory:', err);
  }

  // 2. Jalur Tunggal Penulisan Permanen (A5b): Langsung ke tabel public.audit_logs via service_role
  const isOnline = await checkSupabaseOnline();
  if (isOnline) {
    const validActorId = input.actorId && UUID_REGEX.test(input.actorId) ? input.actorId : null;
    const validEntityId = input.entityId && UUID_REGEX.test(input.entityId) ? input.entityId : null;
    const validOnBehalfOf = input.onBehalfOf && UUID_REGEX.test(input.onBehalfOf) ? input.onBehalfOf : null;
    const validScopeId = input.scopeId && UUID_REGEX.test(input.scopeId) ? input.scopeId : null;

    const detailsPayload = {
      ...(input.metadata || {}),
      ...(validEntityId ? {} : { raw_entity_id: input.entityId }),
    };

    const { error } = await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: validActorId,
      actor_role: input.actorRole,
      action: input.action,
      entity_type: input.entityType,
      entity_id: validEntityId,
      scope_type: input.scopeType ?? 'GLOBAL',
      scope_id: validScopeId,
      description: input.description,
      details: detailsPayload,
      on_behalf_of: validOnBehalfOf,
      before_json: input.valueBefore ? { value: input.valueBefore } : null,
      after_json: {
        value: input.valueAfter ?? null,
        description: input.description,
        metadata: input.metadata ?? {},
      },
    });

    if (error) {
      throw new Error(`AUDIT_LOG_WRITE_FAILED: Gagal menyimpan jejak audit: ${error.message}`);
    }
  }
}
