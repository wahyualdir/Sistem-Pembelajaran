-- SIAJAR Migration: Penguatan Jejak Audit Sistem (Append-Only Hardening & Impersonation Support)
-- Migration: 20261011000015_audit_logs_hardening.sql

-- 1. Penambahan Kolom Penyamaran & Relasi Audit Trail (A5c: ON DELETE RESTRICT)
ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS on_behalf_of UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS user_agent TEXT NULL,
    ADD COLUMN IF NOT EXISTS ip_address TEXT NULL,
    ADD COLUMN IF NOT EXISTS description TEXT NULL,
    ADD COLUMN IF NOT EXISTS details JSONB NULL;

-- Izinkan actor_user_id bernilai NULL khusus untuk peristiwa sistem/cron otomatis
ALTER TABLE public.audit_logs ALTER COLUMN actor_user_id DROP NOT NULL;

-- Selesaikan konflik FK ON DELETE SET NULL vs trigger append-only (A5c: RESTRICT)
DO $$ BEGIN
    ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_user_id_fkey;
    ALTER TABLE public.audit_logs
        ADD CONSTRAINT audit_logs_actor_user_id_fkey
        FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
EXCEPTION WHEN undefined_object THEN null; END $$;

-- Pastikan relasi FK on_behalf_of konsisten RESTRICT (mencegah konflik trigger append-only)
DO $$ BEGIN
    ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_on_behalf_of_fkey;
    ALTER TABLE public.audit_logs
        ADD CONSTRAINT audit_logs_on_behalf_of_fkey
        FOREIGN KEY (on_behalf_of) REFERENCES public.profiles(id) ON DELETE RESTRICT;
EXCEPTION WHEN undefined_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_on_behalf_of ON public.audit_logs(on_behalf_of) WHERE on_behalf_of IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON public.audit_logs(created_at DESC);

-- 2. Memastikan Trigger Pencegah Modifikasi / Penghapusan Tetap Aktif (Append-Only Enforced)
CREATE OR REPLACE FUNCTION public.fn_prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Penanganan Kebijakan Retensi Terjadwal yang Sah (UU PDP):
    IF TG_OP = 'DELETE' AND current_setting('siajar.lawful_retention_purge', true) = 'on' THEN
        RETURN OLD;
    END IF;

    -- Pengecualian sempit jika ada pemeliharaan anonimisasi referensial sah
    IF TG_OP = 'UPDATE' AND current_setting('siajar.lawful_anonymization', true) = 'on' THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'AUDIT_LOG_IMMUTABLE: Tabel audit_logs bersifat murni append-only dan dilarang diubah (UPDATE) atau dihapus (DELETE).';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS tr_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER tr_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_audit_log_modification();

-- 3. Row-Level Security (RLS) Penguatan (A5a):
-- a. SELECT hanya untuk peran berwenang: SYSTEM_ADMIN, SUPER_ADMIN, atau PROGRAM_COORDINATOR (lingkup prodinya)
-- b. INSERT DILAPIS KETAT: Cabut izin INSERT langsung dari role authenticated/anon/public.
--    Hanya service_role atau fungsi SECURITY DEFINER log_audit() yang dapat mengisi audit_logs.
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

-- Cabut wewenang INSERT, UPDATE, DELETE, TRUNCATE langsung dari role publik dan klien
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_update ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_delete ON public.audit_logs;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated, public;

-- 4. Fungsi SECURITY DEFINER log_audit() (A5a)
-- Mengisi actor murni dari auth.uid() sesi klien terautentikasi (mencegah pemalsuan identitas aktor)
CREATE OR REPLACE FUNCTION public.log_audit(
    p_action text,
    p_entity_type text,
    p_entity_id uuid DEFAULT NULL,
    p_scope_type public.scope_type DEFAULT 'GLOBAL',
    p_scope_id uuid DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_details jsonb DEFAULT '{}'::jsonb,
    p_on_behalf_of uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_id uuid := gen_random_uuid();
    v_actor_role text;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Pengguna tidak terautentikasi.';
    END IF;

    -- Dapatkan role aktif pengguna dari user_roles
    SELECT r.code INTO v_actor_role
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = v_uid AND ur.status = 'ACTIVE'
    LIMIT 1;

    IF v_actor_role IS NULL THEN
        v_actor_role := 'STUDENT';
    END IF;

    INSERT INTO public.audit_logs (
        id, actor_user_id, actor_role, action, entity_type, entity_id,
        scope_type, scope_id, description, details, on_behalf_of, created_at
    ) VALUES (
        v_id, v_uid, v_actor_role, p_action, p_entity_type, p_entity_id,
        p_scope_type, p_scope_id, p_description, p_details, p_on_behalf_of, now()
    );

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit TO authenticated;

-- 5. Fungsi Pemeliharaan Retensi Sah (UU PDP) (A5b):
-- Hanya service_role/cron, batas minimal retensi >= 365 hari, dan mencatat pemanggilannya sendiri
CREATE OR REPLACE FUNCTION public.purge_expired_audit_logs(p_older_than_interval interval)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_deleted_count integer := 0;
    v_caller text := current_user;
    v_role text := (SELECT auth.role());
    v_uid uuid := (SELECT auth.uid());
BEGIN
    -- Validasi wewenang A5b: Hanya service_role/cron internal
    IF COALESCE(v_role, '') <> 'service_role' AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya service_role/cron yang berwenang menjalankan purge_expired_audit_logs.';
    END IF;

    -- Validasi batas minimal retensi A5b: Minimal 365 hari
    IF p_older_than_interval < interval '365 days' THEN
        RAISE EXCEPTION 'RETENTION_MINIMUM: Batas minimal retensi log audit adalah 365 hari.';
    END IF;

    -- Aktifkan session flag pembersihan retensi sah
    PERFORM set_config('siajar.lawful_retention_purge', 'on', true);

    DELETE FROM public.audit_logs
    WHERE created_at < (now() - p_older_than_interval);
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Kembalikan session flag ke default
    PERFORM set_config('siajar.lawful_retention_purge', 'off', true);

    -- Catat pemanggilan pembersihan retensi ke audit log sendiri
    INSERT INTO public.audit_logs (
        id, actor_user_id, actor_role, action, entity_type, entity_id,
        scope_type, scope_id, description, details, created_at
    ) VALUES (
        gen_random_uuid(),
        v_uid,
        'SYSTEM_CRON',
        'audit.retention_purge',
        'audit_logs',
        gen_random_uuid(),
        'GLOBAL',
        NULL,
        'Pembersihan retensi sah UU PDP log audit kadaluarsa.',
        jsonb_build_object('retention_interval', p_older_than_interval::text, 'deleted_rows', v_deleted_count),
        now()
    );

    RETURN v_deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_audit_logs(interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_audit_logs(interval) TO service_role;

-- 6. Fungsi Anonimisasi / Penonaktifan Pengguna Sah UU PDP (A5c)
CREATE OR REPLACE FUNCTION public.anonymize_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    -- Validasi wewenang: Super Admin atau service_role
    IF (SELECT auth.uid()) IS NOT NULL AND NOT (public.has_global_role('SUPER_ADMIN') OR public.has_global_role('SYSTEM_ADMIN')) THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Super Admin atau service role yang dapat menganonimkan pengguna.';
    END IF;

    -- Anonimkan data identitas pribadi pada profiles tanpa melanggar immutability audit_logs
    UPDATE public.profiles
    SET full_name = 'Anonim Pengguna ' || substr(p_user_id::text, 1, 8),
        email = 'anonymized-' || substr(p_user_id::text, 1, 8) || '@siajar.local',
        status = 'DEACTIVATED'
    WHERE id = p_user_id;

    -- Nonaktifkan seluruh peran aktif
    UPDATE public.user_roles
    SET status = 'REVOKED'
    WHERE user_id = p_user_id;

    -- Catat aktivitas anonimisasi ke audit log
    INSERT INTO public.audit_logs (
        id, actor_user_id, actor_role, action, entity_type, entity_id,
        scope_type, scope_id, description, details, created_at
    ) VALUES (
        gen_random_uuid(),
        COALESCE((SELECT auth.uid()), p_user_id),
        'SUPER_ADMIN',
        'user.anonymize',
        'profiles',
        p_user_id,
        'GLOBAL',
        NULL,
        'Penonaktifan dan anonimisasi data pribadi pengguna sah UU PDP.',
        jsonb_build_object('target_user_id', p_user_id),
        now()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.anonymize_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.anonymize_user(uuid) TO authenticated;
