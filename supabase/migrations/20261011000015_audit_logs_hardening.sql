-- SIAJAR Migration: Penguatan Jejak Audit Sistem (Append-Only Hardening & Impersonation Support)
-- Migration: 20261011000015_audit_logs_hardening.sql
-- PERHATIAN: JANGAN MENJALANKAN MIGRASI INI SECARA OTOMATIS KE DATABASE MANA PUN.
-- Terapkan secara manual melalui Supabase CLI / SQL Editor pangkalan data production.

-- 1. Penambahan Kolom Penyamaran (Impersonation / on_behalf_of) untuk Audit Trail Fase 2E
ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS on_behalf_of UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS user_agent TEXT NULL,
    ADD COLUMN IF NOT EXISTS ip_address TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_on_behalf_of ON public.audit_logs(on_behalf_of) WHERE on_behalf_of IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON public.audit_logs(created_at DESC);

-- 2. Memastikan Trigger Pencegah Modifikasi / Penghapusan Tetap Aktif (Append-Only Enforced)
CREATE OR REPLACE FUNCTION public.fn_prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'AUDIT_LOG_IMMUTABLE: Tabel audit_logs bersifat murni append-only dan dilarang diubah (UPDATE) atau dihapus (DELETE).';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS tr_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER tr_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_audit_log_modification();

-- 3. Row-Level Security (RLS) Penguatan:
-- a. SELECT hanya untuk peran berwenang: SYSTEM_ADMIN, SUPER_ADMIN, atau PROGRAM_COORDINATOR (lingkup prodinya)
-- b. INSERT diizinkan untuk authenticated backend / server actions
-- c. UPDATE dan DELETE sama sekali TIDAK MEMILIKI POLICY (ditolak oleh RLS dan diblokir trigger)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
FOR SELECT TO authenticated
USING (
    public.has_global_role('SYSTEM_ADMIN')
    OR public.has_global_role('SUPER_ADMIN')
    OR (
        public.has_global_role('PROGRAM_COORDINATOR')
        AND scope_type = 'PROGRAM'
        AND scope_id IS NOT NULL
        AND public.is_program_coordinator(scope_id)
    )
);

DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (
    -- Hanya user terautentikasi dan aktor valid yang dapat mencatat log audit
    auth.uid() IS NOT NULL AND (actor_user_id IS NULL OR actor_user_id = auth.uid())
);

-- Pastikan tidak ada policy UPDATE atau DELETE sama sekali
DROP POLICY IF EXISTS audit_logs_update ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_delete ON public.audit_logs;

-- Cabut wewenang modifikasi dari role anonim dan publik
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated, public;
