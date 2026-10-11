-- SIAJAR Migration: Phase 3A Domain 1 & 2 Persistence Hardening
-- Specification: docs/phase-3-plan.md (Domain 1 & Domain 2)
-- Defensive DDL: Only creates tables/columns/policies not yet present in snapshot 1..16.

BEGIN;

-- -------------------------------------------------------------
-- 1. TABEL RUANG PERKULIAHAN (Domain 2 - Master Data)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    building VARCHAR(100),
    capacity INT,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    radius_meters INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rooms_select ON public.rooms;
CREATE POLICY rooms_select ON public.rooms
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS rooms_staff_write ON public.rooms;
CREATE POLICY rooms_staff_write ON public.rooms
FOR ALL TO authenticated
USING (public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN'))
WITH CHECK (public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN'));

-- -------------------------------------------------------------
-- 2. HARDENING RLS KEBIJAKAN KELAS (public.classes)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS classes_select ON public.classes;
CREATE POLICY classes_select ON public.classes
FOR SELECT TO authenticated
USING (
    deleted_at IS NULL
    AND (
        -- 1. Mahasiswa terdaftar pada kelas
        public.is_enrolled(id)
        -- 2. Dosen pengampu / pembuat kelas / asisten kelas
        OR (
            public.has_active_role('LECTURER') 
            AND (
                lecturer_id = (SELECT auth.uid()) 
                OR created_by = (SELECT auth.uid()) 
                OR public.is_class_staff(id)
            )
        )
        OR (
            public.has_active_role('TEACHING_ASSISTANT') 
            AND public.is_class_staff(id)
        )
        -- 3. Kaprodi: HANYA kelas pada program studinya (lintas prodi ditolak)
        OR (
            public.has_active_role('PROGRAM_COORDINATOR') 
            AND EXISTS (
                SELECT 1 FROM public.courses cr
                WHERE cr.id = public.classes.course_id
                  AND public.is_program_coordinator(cr.program_id)
            )
        )
        -- 4. Staf Akademik & Super Admin
        OR public.has_global_role('ACADEMIC_STAFF')
        OR public.has_global_role('SUPER_ADMIN')
    )
);

-- Kebijakan update kelas langsung (hanya staf/admin, kaprodi prodinya, atau dosen kelasnya)
DROP POLICY IF EXISTS classes_update ON public.classes;
CREATE POLICY classes_update ON public.classes
FOR UPDATE TO authenticated
USING (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
    OR (
        public.has_active_role('PROGRAM_COORDINATOR') 
        AND EXISTS (
            SELECT 1 FROM public.courses cr
            WHERE cr.id = public.classes.course_id
              AND public.is_program_coordinator(cr.program_id)
        )
    )
    OR (
        public.has_active_role('LECTURER') 
        AND (lecturer_id = (SELECT auth.uid()) OR created_by = (SELECT auth.uid()))
    )
)
WITH CHECK (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
    OR (
        public.has_active_role('PROGRAM_COORDINATOR') 
        AND EXISTS (
            SELECT 1 FROM public.courses cr
            WHERE cr.id = public.classes.course_id
              AND public.is_program_coordinator(cr.program_id)
        )
    )
    OR (
        public.has_active_role('LECTURER') 
        AND (lecturer_id = (SELECT auth.uid()) OR created_by = (SELECT auth.uid()))
    )
);

-- -------------------------------------------------------------
-- 3. HARDENING RLS ENROLLMENT (public.enrollments)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS enrollments_select ON public.enrollments;
CREATE POLICY enrollments_select ON public.enrollments
FOR SELECT TO authenticated
USING (
    -- 1. Mahasiswa: HANYA baris miliknya sendiri (tidak bisa melihat enrollment mahasiswa lain)
    (student_id = (SELECT auth.uid()))
    -- 2. Dosen / Asisten: HANYA kelas yang diampunya
    OR (
        public.has_active_role('LECTURER') 
        AND EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = public.enrollments.class_id
              AND (
                  c.lecturer_id = (SELECT auth.uid()) 
                  OR c.created_by = (SELECT auth.uid()) 
                  OR public.is_class_staff(c.id)
              )
        )
    )
    OR (
        public.has_active_role('TEACHING_ASSISTANT') 
        AND public.is_class_staff(class_id)
    )
    -- 3. Kaprodi: HANYA kelas di program studinya (lintas prodi ditolak)
    OR (
        public.has_active_role('PROGRAM_COORDINATOR') 
        AND EXISTS (
            SELECT 1 FROM public.classes c
            JOIN public.courses cr ON cr.id = c.course_id
            WHERE c.id = public.enrollments.class_id
              AND public.is_program_coordinator(cr.program_id)
        )
    )
    -- 4. Staf Akademik & Super Admin
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
);

-- Penulisan langsung (INSERT/UPDATE/DELETE) HANYA oleh Staf Akademik & Super Admin
DROP POLICY IF EXISTS enrollments_staff_write ON public.enrollments;
CREATE POLICY enrollments_staff_write ON public.enrollments
FOR ALL TO authenticated
USING (public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN'))
WITH CHECK (public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN'));

-- -------------------------------------------------------------
-- 4. RPC AKSI AKADEMIK DOMAIN 1 & 2
-- -------------------------------------------------------------

-- 4a. Persetujuan Pembukaan Kelas (Kaprodi / Admin)
CREATE OR REPLACE FUNCTION public.approve_class(
    p_class_id UUID,
    p_status public.class_status
)
RETURNS public.classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_class public.classes;
    v_course public.courses;
    v_is_coord BOOLEAN;
    v_is_staff_or_admin BOOLEAN;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    v_is_staff_or_admin := public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN');

    SELECT * INTO v_class FROM public.classes WHERE id = p_class_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLASS_NOT_FOUND';
    END IF;

    IF v_class.course_id IS NOT NULL THEN
        SELECT * INTO v_course FROM public.courses WHERE id = v_class.course_id;
        v_is_coord := public.is_program_coordinator(v_course.program_id);
    ELSE
        v_is_coord := public.has_active_role('PROGRAM_COORDINATOR');
    END IF;

    IF NOT (v_is_staff_or_admin OR (public.has_active_role('PROGRAM_COORDINATOR') AND v_is_coord)) THEN
        RAISE EXCEPTION 'FORBIDDEN: Kaprodi hanya dapat menyetujui kelas pada program studi yang diampunya';
    END IF;

    UPDATE public.classes
    SET status = p_status, updated_at = now()
    WHERE id = p_class_id
    RETURNING * INTO v_class;

    INSERT INTO public.audit_logs (
        actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, description, after_json
    ) VALUES (
        v_uid,
        CASE WHEN v_is_staff_or_admin THEN 'ACADEMIC_STAFF' ELSE 'PROGRAM_COORDINATOR' END,
        'class.approve',
        'classes',
        v_class.id,
        'CLASS',
        v_class.id,
        format('Status kelas diubah menjadi %s', p_status),
        jsonb_build_object('status', v_class.status)
    );

    RETURN v_class;
END;
$$;

-- 4b. Penugasan Dosen Pengampu (Kaprodi / Admin)
CREATE OR REPLACE FUNCTION public.assign_lecturer(
    p_class_id UUID,
    p_lecturer_id UUID
)
RETURNS public.classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_class public.classes;
    v_course public.courses;
    v_is_coord BOOLEAN;
    v_is_staff_or_admin BOOLEAN;
    v_lecturer_role UUID;
    v_has_lecturer_role BOOLEAN;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    v_is_staff_or_admin := public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN');

    SELECT * INTO v_class FROM public.classes WHERE id = p_class_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLASS_NOT_FOUND';
    END IF;

    IF v_class.course_id IS NOT NULL THEN
        SELECT * INTO v_course FROM public.courses WHERE id = v_class.course_id;
        v_is_coord := public.is_program_coordinator(v_course.program_id);
    ELSE
        v_is_coord := public.has_active_role('PROGRAM_COORDINATOR');
    END IF;

    IF NOT (v_is_staff_or_admin OR (public.has_active_role('PROGRAM_COORDINATOR') AND v_is_coord)) THEN
        RAISE EXCEPTION 'FORBIDDEN: Kaprodi hanya dapat menugaskan dosen pada kelas di program studinya';
    END IF;

    -- Validasi target adalah dosen aktif
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = p_lecturer_id AND r.code = 'LECTURER' AND ur.status = 'ACTIVE'
    ) INTO v_has_lecturer_role;

    IF NOT v_has_lecturer_role THEN
        RAISE EXCEPTION 'INVALID_LECTURER: Pengguna yang dipilih bukan dosen aktif';
    END IF;

    UPDATE public.classes
    SET lecturer_id = p_lecturer_id, updated_at = now()
    WHERE id = p_class_id
    RETURNING * INTO v_class;

    -- Pastikan user_role scope CLASS ada
    SELECT id INTO v_lecturer_role FROM public.roles WHERE code = 'LECTURER';
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, granted_by, status)
    VALUES (p_lecturer_id, v_lecturer_role, 'CLASS', p_class_id, v_uid, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.audit_logs (
        actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, description, after_json
    ) VALUES (
        v_uid,
        CASE WHEN v_is_staff_or_admin THEN 'ACADEMIC_STAFF' ELSE 'PROGRAM_COORDINATOR' END,
        'class.assign_lecturer',
        'classes',
        v_class.id,
        'CLASS',
        v_class.id,
        format('Dosen pengampu kelas ditugaskan ke %s', p_lecturer_id),
        jsonb_build_object('lecturer_id', p_lecturer_id)
    );

    RETURN v_class;
END;
$$;

-- 4c. Pendaftaran Peserta Kelas Manual (Staf Akademik / Admin)
CREATE OR REPLACE FUNCTION public.enroll_student(
    p_class_id UUID,
    p_student_id UUID
)
RETURNS public.enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_class public.classes;
    v_enrollment public.enrollments;
    v_count INT;
    v_is_student BOOLEAN;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- Batasan: Hanya Staf Akademik / Admin
    IF NOT (public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN')) THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Staf Akademik yang dapat mendaftarkan peserta kelas';
    END IF;

    SELECT * INTO v_class FROM public.classes WHERE id = p_class_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLASS_NOT_FOUND';
    END IF;

    -- Validasi target adalah mahasiswa
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = p_student_id AND r.code = 'STUDENT' AND ur.status = 'ACTIVE'
    ) INTO v_is_student;

    IF NOT v_is_student THEN
        RAISE EXCEPTION 'INVALID_STUDENT: Pengguna yang didaftarkan bukan mahasiswa aktif';
    END IF;

    -- Periksa apakah sudah terdaftar
    SELECT * INTO v_enrollment FROM public.enrollments WHERE class_id = p_class_id AND student_id = p_student_id;
    IF FOUND AND v_enrollment.status = 'ACTIVE' THEN
        RAISE EXCEPTION 'ALREADY_ENROLLED';
    END IF;

    -- Periksa kapasitas kelas
    SELECT count(*) INTO v_count FROM public.enrollments WHERE class_id = p_class_id AND status = 'ACTIVE';
    IF v_class.capacity IS NOT NULL AND v_count >= v_class.capacity THEN
        RAISE EXCEPTION 'CLASS_FULL';
    END IF;

    IF FOUND THEN
        UPDATE public.enrollments
        SET status = 'ACTIVE', dropped_at = NULL, enrolled_at = now()
        WHERE id = v_enrollment.id
        RETURNING * INTO v_enrollment;
    ELSE
        INSERT INTO public.enrollments (class_id, student_id, status, enrolled_at)
        VALUES (p_class_id, p_student_id, 'ACTIVE', now())
        RETURNING * INTO v_enrollment;
    END IF;

    INSERT INTO public.audit_logs (
        actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, description, after_json
    ) VALUES (
        v_uid, 'ACADEMIC_STAFF', 'class.enroll', 'enrollments', v_enrollment.id, 'CLASS', p_class_id,
        format('Staf mendaftarkan mahasiswa %s ke kelas %s', p_student_id, p_class_id),
        jsonb_build_object('student_id', p_student_id, 'class_id', p_class_id)
    );

    RETURN v_enrollment;
END;
$$;

-- 4d. Mutasi Pindah Kelas Paralel Mahasiswa (Staf Akademik / Admin)
CREATE OR REPLACE FUNCTION public.transfer_class(
    p_source_class_id UUID,
    p_target_class_id UUID,
    p_student_id UUID,
    p_reason TEXT DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_source_class public.classes;
    v_target_class public.classes;
    v_source_enr public.enrollments;
    v_target_count INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    IF NOT (public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN')) THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Staf Akademik yang dapat memindahkan kelas mahasiswa';
    END IF;

    IF p_source_class_id = p_target_class_id THEN
        RAISE EXCEPTION 'SAME_CLASS: Kelas tujuan tidak boleh sama dengan kelas asal';
    END IF;

    -- Validasi kelas asal dan enrollment
    SELECT * INTO v_source_class FROM public.classes WHERE id = p_source_class_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'SOURCE_CLASS_NOT_FOUND';
    END IF;

    SELECT * INTO v_source_enr FROM public.enrollments WHERE class_id = p_source_class_id AND student_id = p_student_id AND status = 'ACTIVE' FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_ENROLLED_IN_SOURCE';
    END IF;

    -- Validasi kelas tujuan
    SELECT * INTO v_target_class FROM public.classes WHERE id = p_target_class_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'TARGET_CLASS_NOT_FOUND';
    END IF;

    SELECT count(*) INTO v_target_count FROM public.enrollments WHERE class_id = p_target_class_id AND status = 'ACTIVE';
    IF v_target_class.capacity IS NOT NULL AND v_target_count >= v_target_class.capacity THEN
        RAISE EXCEPTION 'TARGET_CLASS_FULL';
    END IF;

    -- Update enrollment asal menjadi DROPPED
    UPDATE public.enrollments
    SET status = 'DROPPED', dropped_at = now()
    WHERE id = v_source_enr.id;

    -- Daftarkan di kelas tujuan
    INSERT INTO public.enrollments (class_id, student_id, status, enrolled_at)
    VALUES (p_target_class_id, p_student_id, 'ACTIVE', now())
    ON CONFLICT (class_id, student_id) DO UPDATE
    SET status = 'ACTIVE', dropped_at = NULL, enrolled_at = now();

    INSERT INTO public.audit_logs (
        actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, description, details
    ) VALUES (
        v_uid, 'ACADEMIC_STAFF', 'class.transfer', 'enrollments', v_source_enr.id, 'CLASS', p_target_class_id,
        format('Staf memindahkan mahasiswa %s dari kelas %s ke kelas %s. Alasan: %s', p_student_id, p_source_class_id, p_target_class_id, p_reason),
        jsonb_build_object('source_class_id', p_source_class_id, 'target_class_id', p_target_class_id, 'student_id', p_student_id, 'reason', p_reason)
    );

    RETURN true;
END;
$$;

-- 4e. Batch Enroll Mahasiswa via JSON / CSV Payload (Staf Akademik / Admin)
CREATE OR REPLACE FUNCTION public.batch_enroll_students(
    p_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_row JSONB;
    v_student_id UUID;
    v_class_id UUID;
    v_success_count INT := 0;
    v_fail_count INT := 0;
    v_errors JSONB := '[]'::jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    IF NOT (public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN')) THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Staf Akademik yang dapat mengimpor data peserta via CSV';
    END IF;

    FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
    LOOP
        BEGIN
            v_student_id := (v_row->>'student_id')::UUID;
            v_class_id := (v_row->>'class_id')::UUID;

            PERFORM public.enroll_student(v_class_id, v_student_id);
            v_success_count := v_success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_fail_count := v_fail_count + 1;
            v_errors := v_errors || jsonb_build_object(
                'student_id', v_row->>'student_id',
                'class_id', v_row->>'class_id',
                'error', SQLERRM
            );
        END;
    END LOOP;

    INSERT INTO public.audit_logs (
        actor_user_id, actor_role, action, entity_type, entity_id, scope_type, description, details
    ) VALUES (
        v_uid, 'ACADEMIC_STAFF', 'class.batch_enroll', 'enrollments', gen_random_uuid(), 'GLOBAL',
        format('Staf mengeksekusi batch enrollment CSV: %s berhasil, %s gagal', v_success_count, v_fail_count),
        jsonb_build_object('success_count', v_success_count, 'fail_count', v_fail_count, 'errors', v_errors)
    );

    RETURN jsonb_build_object(
        'total', jsonb_array_length(p_rows),
        'success', v_success_count,
        'failed', v_fail_count,
        'errors', v_errors
    );
END;
$$;

COMMIT;
