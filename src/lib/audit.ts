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
  metadata?: Record<string, any>;
}

export async function recordSystemAuditLog(input: AuditLogInput): Promise<void> {
  // 1. Catat ke in-memory store (NilaiStore) untuk tampilan log audit portal & verifikasi tes
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

  // 2. Catat ke tabel permanen Supabase audit_logs jika koneksi aktif
  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      await supabaseAdmin.from('audit_logs').insert({
        actor_user_id: input.actorId,
        actor_role: input.actorRole,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId,
        scope_type: input.scopeType ?? 'GLOBAL',
        scope_id: input.scopeId ?? null,
        before_json: input.valueBefore ? { value: input.valueBefore } : null,
        after_json: {
          value: input.valueAfter ?? null,
          description: input.description,
          metadata: input.metadata ?? {},
        },
      });
    }
  } catch {
    // Tetap aman jika Supabase belum termigrasi atau offline
  }
}
