-- SIAJAR Migration: 20261018000034_fix_absence_policies_recursion.sql
-- Perbaikan rekursi tak terbatas (infinite recursion) pada policy RLS absence_requests & absence_request_items.
-- Menggunakan SECURITY DEFINER helper functions agar pengecekan relasi silang mem-bypass RLS evaluasi internal.

-- 1. Helper function untuk mengecek kepemilikan permohonan izin/sakit oleh mahasiswa (bypass RLS absence_requests)
CREATE OR REPLACE FUNCTION public.fn_absence_request_is_owner(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.absence_requests
        WHERE id = p_request_id AND student_id = (SELECT auth.uid())
    );
$$;

-- 2. Helper function untuk mengecek apakah user memiliki hak staf/dosen pengajar pada kelas terkait (bypass RLS absence_request_items)
CREATE OR REPLACE FUNCTION public.fn_absence_request_has_staff_access(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.absence_request_items items
        WHERE items.request_id = p_request_id
          AND public.is_class_staff(items.class_id)
    );
$$;

-- 3. Perbarui RLS Policy untuk absence_requests
DROP POLICY IF EXISTS absence_requests_select ON public.absence_requests;
CREATE POLICY absence_requests_select ON public.absence_requests
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR public.fn_absence_request_has_staff_access(id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_active_role('SYSTEM_ADMIN')
);

-- 4. Perbarui RLS Policy untuk absence_request_items
DROP POLICY IF EXISTS absence_request_items_select ON public.absence_request_items;
CREATE POLICY absence_request_items_select ON public.absence_request_items
FOR SELECT TO authenticated
USING (
    public.fn_absence_request_is_owner(request_id)
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_active_role('SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS absence_request_items_insert ON public.absence_request_items;
CREATE POLICY absence_request_items_insert ON public.absence_request_items
FOR INSERT TO authenticated
WITH CHECK (
    public.fn_absence_request_is_owner(request_id)
);

DROP POLICY IF EXISTS absence_request_items_update ON public.absence_request_items;
CREATE POLICY absence_request_items_update ON public.absence_request_items
FOR UPDATE TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.fn_absence_request_is_owner(request_id)
)
WITH CHECK (
    public.is_class_staff(class_id)
    OR public.fn_absence_request_is_owner(request_id)
);
