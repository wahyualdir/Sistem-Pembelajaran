-- SIAJAR Database Migration: Helper Functions, Custom Claims Hook & RLS Policies (Fase 1)
-- Specification: docs/SIAJAR_Dokumen_Lengkap_v3.md (Bagian 7.2, 22.3, 23.1-23.4)

-- -------------------------------------------------------------
-- HELPER FUNCTIONS (SECURITY DEFINER, search_path = '')
-- -------------------------------------------------------------

-- 1. has_global_role: checks whether current user has an active role
CREATE OR REPLACE FUNCTION public.has_global_role(p_role_code text)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = (SELECT auth.uid())
          AND r.code = p_role_code
          AND ur.status = 'ACTIVE'
          AND ur.scope_type = 'GLOBAL'
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
$$;

-- 2. is_program_coordinator: checks coordinator role for a program
CREATE OR REPLACE FUNCTION public.is_program_coordinator(p_program_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = (SELECT auth.uid())
          AND r.code = 'PROGRAM_COORDINATOR'
          AND ur.status = 'ACTIVE'
          AND (ur.scope_type = 'GLOBAL' OR (ur.scope_type = 'PROGRAM' AND ur.scope_id = p_program_id))
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
$$;

-- 3. is_class_staff: checks lecturer or teaching assistant for a class
CREATE OR REPLACE FUNCTION public.is_class_staff(p_class_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = (SELECT auth.uid())
          AND r.code IN ('LECTURER', 'TEACHING_ASSISTANT')
          AND ur.status = 'ACTIVE'
          AND ur.scope_type = 'CLASS'
          AND ur.scope_id = p_class_id
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
$$;

-- 4. is_enrolled: checks whether user is enrolled in class (safely stubs if table not yet created)
CREATE OR REPLACE FUNCTION public.is_enrolled(p_class_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'enrollments'
    ) THEN
        RETURN EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.class_id = p_class_id
              AND e.student_id = (SELECT auth.uid())
              AND e.status = 'ACTIVE'
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = (SELECT auth.uid())
              AND r.code = 'STUDENT'
              AND ur.scope_type = 'CLASS'
              AND ur.scope_id = p_class_id
              AND ur.status = 'ACTIVE'
        );
    END IF;
END;
$$;

-- 5. has_class_permission: checks specific permission on a class
CREATE OR REPLACE FUNCTION public.has_class_permission(p_class_id uuid, p_permission_code text)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Global admin / academic staff bypass if role allows
    IF public.has_global_role('SYSTEM_ADMIN') THEN
        RETURN TRUE;
    END IF;

    -- Check direct role permission on assigned class
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON rp.role_id = ur.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = (SELECT auth.uid())
          AND p.code = p_permission_code
          AND ur.status = 'ACTIVE'
          AND (
            (ur.scope_type = 'CLASS' AND ur.scope_id = p_class_id)
            OR ur.scope_type = 'GLOBAL'
          )
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
END;
$$;

-- -------------------------------------------------------------
-- CUSTOM ACCESS TOKEN HOOK (Supabase Auth Hook)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    claims jsonb;
    user_roles_arr jsonb;
    active_status text;
BEGIN
    claims := event->'claims';

    -- Query active roles for this user
    SELECT jsonb_agg(
        jsonb_build_object(
            'role', r.code,
            'scope_type', ur.scope_type,
            'scope_id', ur.scope_id
        )
    )
    INTO user_roles_arr
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = (event->>'user_id')::uuid
      AND ur.status = 'ACTIVE'
      AND (ur.valid_until IS NULL OR ur.valid_until > now());

    SELECT status INTO active_status
    FROM public.profiles
    WHERE id = (event->>'user_id')::uuid;

    claims := jsonb_set(claims, '{user_roles}', COALESCE(user_roles_arr, '[]'::jsonb));
    claims := jsonb_set(claims, '{account_status}', to_jsonb(COALESCE(active_status, 'ACTIVE')));

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$;

-- Grant permissions for hook to supabase_auth_admin if role exists
DO $$ BEGIN
    GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------

-- 1. PROFILES
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
FOR SELECT TO authenticated
USING (
    id = (SELECT auth.uid())
    OR public.has_global_role('SYSTEM_ADMIN')
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('LECTURER')
);

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
FOR UPDATE TO authenticated
USING (
    id = (SELECT auth.uid())
    OR public.has_global_role('SYSTEM_ADMIN')
)
WITH CHECK (
    public.has_global_role('SYSTEM_ADMIN')
    OR (
        id = (SELECT auth.uid())
        -- Status change is NOT allowed for ordinary users (only admin)
        AND status = (SELECT p.status FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
    )
);

-- 2. USER_IDENTIFIERS
DROP POLICY IF EXISTS user_identifiers_select ON public.user_identifiers;
CREATE POLICY user_identifiers_select ON public.user_identifiers
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SYSTEM_ADMIN')
    OR public.has_global_role('ACADEMIC_STAFF')
);

DROP POLICY IF EXISTS user_identifiers_manage ON public.user_identifiers;
CREATE POLICY user_identifiers_manage ON public.user_identifiers
FOR ALL TO authenticated
USING (
    public.has_global_role('SYSTEM_ADMIN')
    OR public.has_global_role('ACADEMIC_STAFF')
)
WITH CHECK (
    public.has_global_role('SYSTEM_ADMIN')
    OR public.has_global_role('ACADEMIC_STAFF')
);

-- 3. ROLES, PERMISSIONS, ROLE_PERMISSIONS (Readable by authenticated, manageable by Admin)
DROP POLICY IF EXISTS roles_select ON public.roles;
CREATE POLICY roles_select ON public.roles
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS roles_manage ON public.roles;
CREATE POLICY roles_manage ON public.roles
FOR ALL TO authenticated
USING (public.has_global_role('SYSTEM_ADMIN'))
WITH CHECK (public.has_global_role('SYSTEM_ADMIN'));

DROP POLICY IF EXISTS permissions_select ON public.permissions;
CREATE POLICY permissions_select ON public.permissions
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS permissions_manage ON public.permissions;
CREATE POLICY permissions_manage ON public.permissions
FOR ALL TO authenticated
USING (public.has_global_role('SYSTEM_ADMIN'))
WITH CHECK (public.has_global_role('SYSTEM_ADMIN'));

DROP POLICY IF EXISTS role_permissions_select ON public.role_permissions;
CREATE POLICY role_permissions_select ON public.role_permissions
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS role_permissions_manage ON public.role_permissions;
CREATE POLICY role_permissions_manage ON public.role_permissions
FOR ALL TO authenticated
USING (public.has_global_role('SYSTEM_ADMIN'))
WITH CHECK (public.has_global_role('SYSTEM_ADMIN'));

-- 4. USER_ROLES
DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SYSTEM_ADMIN')
    OR public.has_global_role('ACADEMIC_STAFF')
    OR (
        public.has_global_role('PROGRAM_COORDINATOR')
        AND scope_type = 'PROGRAM'
        AND scope_id IS NOT NULL
        AND public.is_program_coordinator(scope_id)
    )
);

DROP POLICY IF EXISTS user_roles_manage ON public.user_roles;
CREATE POLICY user_roles_manage ON public.user_roles
FOR ALL TO authenticated
USING (public.has_global_role('SYSTEM_ADMIN'))
WITH CHECK (public.has_global_role('SYSTEM_ADMIN'));

-- 5. AUDIT_LOGS (Append-only for users/system; Admin & Coord view)
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
FOR SELECT TO authenticated
USING (
    public.has_global_role('SYSTEM_ADMIN')
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
WITH CHECK (true);

-- 6. USER_DEVICES (Strictly owner only; D7 Test scenario)
DROP POLICY IF EXISTS user_devices_select ON public.user_devices;
CREATE POLICY user_devices_select ON public.user_devices
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS user_devices_insert ON public.user_devices;
CREATE POLICY user_devices_insert ON public.user_devices
FOR INSERT TO authenticated
WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS user_devices_update ON public.user_devices;
CREATE POLICY user_devices_update ON public.user_devices
FOR UPDATE TO authenticated
USING (
    user_id = (SELECT auth.uid())
)
WITH CHECK (
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS user_devices_delete ON public.user_devices;
CREATE POLICY user_devices_delete ON public.user_devices
FOR DELETE TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SYSTEM_ADMIN')
);

-- 7. LOGIN_EVENTS (Owner and System Admin)
DROP POLICY IF EXISTS login_events_select ON public.login_events;
CREATE POLICY login_events_select ON public.login_events
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS login_events_insert ON public.login_events;
CREATE POLICY login_events_insert ON public.login_events
FOR INSERT TO authenticated
WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SYSTEM_ADMIN')
);

-- 8. SYSTEM_SETTINGS
DROP POLICY IF EXISTS system_settings_select ON public.system_settings;
CREATE POLICY system_settings_select ON public.system_settings
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS system_settings_manage ON public.system_settings;
CREATE POLICY system_settings_manage ON public.system_settings
FOR ALL TO authenticated
USING (public.has_global_role('SYSTEM_ADMIN'))
WITH CHECK (public.has_global_role('SYSTEM_ADMIN'));

-- -------------------------------------------------------------
-- RPC FUNCTIONS: DEVICE & ACCOUNT SECURITY OPERATIONS
-- -------------------------------------------------------------

-- Revoke single user device
CREATE OR REPLACE FUNCTION public.revoke_user_device(p_device_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT user_id INTO v_user_id
    FROM public.user_devices
    WHERE id = p_device_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Device not found';
    END IF;

    IF v_user_id <> (SELECT auth.uid()) AND NOT public.has_global_role('SYSTEM_ADMIN') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.user_devices
    SET revoked_at = now()
    WHERE id = p_device_id;

    INSERT INTO public.login_events (user_id, device_id, event_type, risk_level)
    VALUES (v_user_id, p_device_id, 'SESSION_REVOKED', 'LOW');

    RETURN TRUE;
END;
$$;

-- Emergency action: "Ini bukan saya" (Report Not Me)
CREATE OR REPLACE FUNCTION public.report_not_me(p_user_id uuid, p_details text DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Lock profile & require password change
    UPDATE public.profiles
    SET status = 'LOCKED',
        must_change_password = true,
        locked_until = now() + INTERVAL '24 hours'
    WHERE id = p_user_id;

    -- Revoke all devices
    UPDATE public.user_devices
    SET revoked_at = now()
    WHERE user_id = p_user_id AND revoked_at IS NULL;

    -- Record critical login event
    INSERT INTO public.login_events (user_id, event_type, risk_level)
    VALUES (p_user_id, 'REPORTED_NOT_ME', 'HIGH');

    -- Record in audit logs
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, before_json, after_json)
    VALUES (
        p_user_id,
        'security.reported_not_me',
        'profiles',
        p_user_id,
        jsonb_build_object('status', 'ACTIVE'),
        jsonb_build_object('status', 'LOCKED', 'reason', COALESCE(p_details, 'Triggered by user emergency report'))
    );

    RETURN TRUE;
END;
$$;
