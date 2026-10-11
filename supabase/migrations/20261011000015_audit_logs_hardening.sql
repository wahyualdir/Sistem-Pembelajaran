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
-- Mendukung Kebijakan Retensi Sah (UU PDP) via session setting khusus atau maintenance function
CREATE OR REPLACE FUNCTION public.fn_prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Penanganan Kebijakan Retensi Terjadwal yang Sah (UU PDP):
    -- Penghapusan berkala hanya dapat dijalankan jika session setting khusus diaktifkan
    -- oleh fungsi pemeliharaan berwenang (Security Definer dengan search_path terkunci).
    IF TG_OP = 'DELETE' AND current_setting('siajar.lawful_retention_purge', true) = 'on' THEN
        RETURN OLD;
    END IF;

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

-- 4. Fungsi Pemeliharaan Retensi Sah (UU PDP): Khusus SUPER_ADMIN atau Service Role Pemeliharaan
CREATE OR REPLACE FUNCTION public.purge_expired_audit_logs(p_older_than_interval interval)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_deleted_count integer := 0;
BEGIN
    -- Validasi: Hanya dapat dieksekusi jika pengguna memiliki role SUPER_ADMIN atau dijalankan service_role
    IF auth.uid() IS NOT NULL AND NOT public.has_global_role('SUPER_ADMIN') THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Super Admin atau service role pemeliharaan yang berwenang mengeksekusi retensi log audit.';
    END IF;

    -- Aktifkan session flag pembersihan retensi sah
    PERFORM set_config('siajar.lawful_retention_purge', 'on', true);

    DELETE FROM public.audit_logs
    WHERE created_at < (now() - p_older_than_interval);
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Kembalikan session flag ke default
    PERFORM set_config('siajar.lawful_retention_purge', 'off', true);

    RETURN v_deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_audit_logs(interval) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_expired_audit_logs(interval) TO authenticated;
