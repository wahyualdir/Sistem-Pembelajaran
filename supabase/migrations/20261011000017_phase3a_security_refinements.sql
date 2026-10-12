-- SIAJAR Migration: Phase 3A Domain 1 & 2 Security Refinements & Hardening
-- Perbaikan Spesifikasi Fase 3A (F1, F4, F5, F6, F7):
-- 1. F1: BEFORE UPDATE trigger pada classes & enrollments untuk melindungi kolom sensitif kecuali dari RPC resmi (app.rpc_context = 'on').
-- 2. F4: REVOKE ALL FROM PUBLIC, anon dan GRANT EXECUTE TO authenticated, service_role untuk seluruh RPC akademik.
-- 3. F5: Menghapus SUPER_ADMIN dari RPC akademik dan kebijakan tulis akademik.
--    Catatan Pengecualian Master Data Non-Akademik: Fasilitas fisik (rooms) tetap dapat dikelola SUPER_ADMIN & ACADEMIC_STAFF.
-- 4. F6: approve_class hanya Kaprodi prodi terkait (bukan Staf), tabel transisi status eksplisit, larangan self-approval, dan pencatatan alasan penolakan.
--    Jalur "ajukan" terpisah via RPC propose_class untuk Staf/Dosen.
-- 5. F7: Validasi bisnis status kelas penerima peserta, kelas paralel pada mutasi, dan batas batch CSV <= 1000 baris.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. TABEL TRANSISI STATUS KELAS (F6) & KOLOM ALASAN PENOLAKAN
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_status_transitions (
    from_status public.class_status NOT NULL,
    to_status public.class_status NOT NULL,
    description TEXT,
    PRIMARY KEY (from_status, to_status)
);

ALTER TABLE public.class_status_transitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_status_transitions_select ON public.class_status_transitions;
CREATE POLICY class_status_transitions_select ON public.class_status_transitions
FOR SELECT TO authenticated
USING (true);

INSERT INTO public.class_status_transitions (from_status, to_status, description) VALUES
    ('DRAFT', 'OPEN', 'Persetujuan pembukaan kelas untuk pendaftaran oleh Kaprodi'),
    ('DRAFT', 'CLOSED', 'Penolakan pembukaan kelas oleh Kaprodi'),
    ('OPEN', 'ACTIVE', 'Perkuliahan semester dimulai'),
    ('OPEN', 'CLOSED', 'Penutupan masa pendaftaran kelas'),
    ('ACTIVE', 'CLOSED', 'Perkuliahan semester selesai'),
    ('CLOSED', 'ARCHIVED', 'Pengarsipan kelas masa lalu')
ON CONFLICT (from_status, to_status) DO NOTHING;

-- Tambah kolom alasan penolakan pada tabel classes jika belum ada
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;

-- -----------------------------------------------------------------------------
-- 2. BEFORE UPDATE TRIGGER UNTUK PROTEKSI KOLOM SENSITIF (F1)
-- -----------------------------------------------------------------------------

-- 2a. Proteksi classes: status, lecturer_id, course_id, semester_id, created_by, join_code
CREATE OR REPLACE FUNCTION public.fn_protect_classes_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Izinkan perubahan kolom sensitif HANYA jika dipanggil dalam konteks fungsi RPC resmi
    IF current_setting('app.rpc_context', true) = 'on' THEN
        RETURN NEW;
    END IF;

    -- Jika dipanggil melalui direct UPDATE (PostgREST / client SQL), tolak perubahan kolom sensitif
    IF (NEW.status IS DISTINCT FROM OLD.status) OR
       (NEW.lecturer_id IS DISTINCT FROM OLD.lecturer_id) OR
       (NEW.course_id IS DISTINCT FROM OLD.course_id) OR
       (NEW.semester_id IS DISTINCT FROM OLD.semester_id) OR
       (NEW.created_by IS DISTINCT FROM OLD.created_by) OR
       (NEW.join_code IS DISTINCT FROM OLD.join_code) THEN
        RAISE EXCEPTION 'DIRECT_UPDATE_RESTRICTED: Perubahan kolom sensitif kelas (status, lecturer_id, course_id, semester_id, created_by, join_code) hanya diizinkan melalui fungsi RPC resmi.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_classes_protect_sensitive ON public.classes;
CREATE TRIGGER tr_classes_protect_sensitive
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.fn_protect_classes_sensitive_columns();

-- 2b. Proteksi enrollments: status, class_id, student_id
CREATE OR REPLACE FUNCTION public.fn_protect_enrollments_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Izinkan perubahan kolom sensitif HANYA jika dipanggil dalam konteks fungsi RPC resmi
    IF current_setting('app.rpc_context', true) = 'on' THEN
        RETURN NEW;
    END IF;

    -- Jika dipanggil melalui direct UPDATE (PostgREST / client SQL), tolak perubahan kolom sensitif
    IF (NEW.status IS DISTINCT FROM OLD.status) OR
       (NEW.class_id IS DISTINCT FROM OLD.class_id) OR
       (NEW.student_id IS DISTINCT FROM OLD.student_id) THEN
        RAISE EXCEPTION 'DIRECT_UPDATE_RESTRICTED: Perubahan kolom sensitif enrollment (status, class_id, student_id) hanya diizinkan melalui fungsi RPC resmi.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enrollments_protect_sensitive ON public.enrollments;
CREATE TRIGGER tr_enrollments_protect_sensitive
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.fn_protect_enrollments_sensitive_columns();

-- -----------------------------------------------------------------------------
-- 3. HAPUS SUPER_ADMIN DARI KEBIJAKAN TULIS AKADEMIK (F5)
-- -----------------------------------------------------------------------------

-- classes_update: Hanya Staf Akademik, Kaprodi prodinya, atau Dosen pengampu
-- SUPER_ADMIN dicabut dari pembaruan kelas langsung.
DROP POLICY IF EXISTS classes_update ON public.classes;
CREATE POLICY classes_update ON public.classes
FOR UPDATE TO authenticated
USING (
    public.has_global_role('ACADEMIC_STAFF')
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

-- enrollments_staff_write: HANYA Staf Akademik (SUPER_ADMIN dicabut total)
DROP POLICY IF EXISTS enrollments_staff_write ON public.enrollments;
CREATE POLICY enrollments_staff_write ON public.enrollments
FOR ALL TO authenticated
USING (public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.has_global_role('ACADEMIC_STAFF'));

-- -----------------------------------------------------------------------------
-- 4. REFINEMENT RPC AKADEMIK (F4, F5, F6, F7)
-- -----------------------------------------------------------------------------

-- 4a. JALUR AJUKAN KELAS BARU (Staf Akademik / Dosen) -> Status DRAFT (F6)
CREATE OR REPLACE FUNCTION public.propose_class(
    p_title TEXT,
    p_section TEXT DEFAULT 'A',
    p_course_id UUID DEFAULT NULL,
    p_semester_id UUID DEFAULT NULL,
    p_capacity SMALLINT DEFAULT NULL
)
RETURNS public.classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_class public.classes;
    v_is_staff BOOLEAN;
    v_is_lecturer BOOLEAN;
    v_role_name TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    v_is_staff := public.has_global_role('ACADEMIC_STAFF');
    v_is_lecturer := public.has_active_role('LECTURER');

    IF NOT (v_is_staff OR v_is_lecturer) THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Staf Akademik atau Dosen yang dapat mengajukan pembukaan kelas';
    END IF;

    IF p_course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE id = p_course_id AND is_active) THEN
        RAISE EXCEPTION 'COURSE_NOT_FOUND';
    END IF;
    IF p_semester_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.semesters WHERE id = p_semester_id) THEN
        RAISE EXCEPTION 'SEMESTER_NOT_FOUND';
    END IF;

    -- Buka rpc_context untuk mengizinkan operasi internal
    PERFORM set_config('app.rpc_context', 'on', true);

    INSERT INTO public.classes (
        title, section, join_code, capacity, status, created_by, course_id, semester_id
    ) VALUES (
        trim(p_title),
        trim(COALESCE(p_section, 'A')),
        public.generate_join_code(),
        p_capacity,
        'DRAFT',
        v_uid,
        p_course_id,
        p_semester_id
    ) RETURNING * INTO v_class;

    v_role_name := CASE WHEN v_is_staff THEN 'ACADEMIC_STAFF' ELSE 'LECTURER' END;

    INSERT INTO public.audit_logs (
        actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, description, after_json
    ) VALUES (
        v_uid,
        v_role_name,
        'class.propose',
        'classes',
        v_class.id,
        'CLASS',
        v_class.id,
        format('Pengajuan kelas baru %s (%s) berstatus DRAFT', v_class.title, v_class.section),
        jsonb_build_object('title', v_class.title, 'section', v_class.section, 'status', 'DRAFT')
    );

    RETURN v_class;
END;
$$;

-- 4b. PERSETUJUAN KELAS (HANYA Kaprodi prodi terkait, BUKAN Staf & BUKAN Super Admin) (F5, F6)
DROP FUNCTION IF EXISTS public.approve_class(UUID, public.class_status);
DROP FUNCTION IF EXISTS public.approve_class(UUID, public.class_status, TEXT);

CREATE OR REPLACE FUNCTION public.approve_class(
    p_class_id UUID,
    p_status public.class_status,
    p_reason TEXT DEFAULT NULL
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
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- F5 & F6: Eksplisit tolak SUPER_ADMIN dan ACADEMIC_STAFF
    -- Persetujuan kelas adalah wewenang mutlak Kaprodi dari program studi terkait
    SELECT * INTO v_class FROM public.classes WHERE id = p_class_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLASS_NOT_FOUND';
    END IF;

    IF v_class.course_id IS NOT NULL THEN
        SELECT * INTO v_course FROM public.courses WHERE id = v_class.course_id;
        v_is_coord := public.is_program_coordinator(v_course.program_id);
    ELSE
        v_is_coord := false;
    END IF;

    IF NOT (public.has_active_role('PROGRAM_COORDINATOR') AND v_is_coord) THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Kaprodi dari program studi terkait yang dapat menyetujui kelas';
    END IF;

    -- F6: Pengaju tidak boleh menyetujui kelasnya sendiri
    IF v_class.created_by = v_uid THEN
        RAISE EXCEPTION 'SELF_APPROVAL_FORBIDDEN: Pengaju kelas tidak dapat menyetujui kelas yang diajukannya sendiri';
    END IF;

    -- F6: Terima hanya transisi valid yang didefinisikan secara eksplisit
    IF NOT EXISTS (
        SELECT 1 FROM public.class_status_transitions
        WHERE from_status = v_class.status AND to_status = p_status
    ) THEN
        RAISE EXCEPTION 'INVALID_STATUS_TRANSITION: Transisi status kelas dari % ke % tidak diizinkan', v_class.status, p_status;
    END IF;

    -- F6: Catat alasan jika penolakan kelas (mis. DRAFT -> CLOSED)
    IF (v_class.status = 'DRAFT' AND p_status = 'CLOSED') AND (p_reason IS NULL OR trim(p_reason) = '') THEN
        RAISE EXCEPTION 'REASON_REQUIRED: Alasan penolakan kelas wajib diisi';
    END IF;

    -- Aktifkan rpc_context untuk trigger
    PERFORM set_config('app.rpc_context', 'on', true);

    UPDATE public.classes
    SET status = p_status,
        rejection_reason = CASE WHEN p_status = 'CLOSED' THEN p_reason ELSE NULL END,
        updated_at = now()
    WHERE id = p_class_id
    RETURNING * INTO v_class;

    INSERT INTO public.audit_logs (
        actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, description, after_json
    ) VALUES (
        v_uid,
        'PROGRAM_COORDINATOR',
        CASE WHEN p_status = 'CLOSED' AND v_class.status = 'CLOSED' THEN 'class.reject' ELSE 'class.approve' END,
        'classes',
        v_class.id,
        'CLASS',
        v_class.id,
        CASE
            WHEN p_status = 'CLOSED' THEN format('Kelas ditolak oleh Kaprodi. Alasan: %s', COALESCE(p_reason, '-'))
            ELSE format('Status kelas diubah menjadi %s oleh Kaprodi', p_status)
        END,
        jsonb_build_object('status', v_class.status, 'rejection_reason', p_reason)
    );

    RETURN v_class;
END;
$$;

-- 4c. PENUGASAN DOSEN PENGAMPU (HANYA Kaprodi prodi terkait) (F5)
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
    v_lecturer_role UUID;
    v_has_lecturer_role BOOLEAN;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- F5: SUPER_ADMIN dan Staf dilarang menugaskan dosen; wewenang hanya Kaprodi prodi terkait
    SELECT * INTO v_class FROM public.classes WHERE id = p_class_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLASS_NOT_FOUND';
    END IF;

    IF v_class.course_id IS NOT NULL THEN
        SELECT * INTO v_course FROM public.courses WHERE id = v_class.course_id;
        v_is_coord := public.is_program_coordinator(v_course.program_id);
    ELSE
        v_is_coord := false;
    END IF;

    IF NOT (public.has_active_role('PROGRAM_COORDINATOR') AND v_is_coord) THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Kaprodi dari program studi terkait yang dapat menugaskan dosen';
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

    -- Aktifkan rpc_context
    PERFORM set_config('app.rpc_context', 'on', true);

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
        'PROGRAM_COORDINATOR',
        'class.assign_lecturer',
        'classes',
        v_class.id,
        'CLASS',
        v_class.id,
        format('Dosen pengampu kelas ditugaskan ke %s oleh Kaprodi', p_lecturer_id),
        jsonb_build_object('lecturer_id', p_lecturer_id)
    );

    RETURN v_class;
END;
$$;

-- 4d. PENDAFTARAN PESERTA KELAS MANUAL (HANYA Staf Akademik) (F5, F7)
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

    -- F5: Batasan ketat: HANYA Staf Akademik (SUPER_ADMIN dilarang)
    IF NOT public.has_global_role('ACADEMIC_STAFF') THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Staf Akademik yang dapat mendaftarkan peserta kelas';
    END IF;

    SELECT * INTO v_class FROM public.classes WHERE id = p_class_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLASS_NOT_FOUND';
    END IF;

    -- F7: Tolak jika status kelas tidak menerima peserta (hanya status 'OPEN' yang menerima)
    IF v_class.status != 'OPEN' THEN
        RAISE EXCEPTION 'CLASS_NOT_ACCEPTING_ENROLLMENTS: Kelas dengan status % tidak menerima pendaftaran peserta baru', v_class.status;
    END IF;

    -- Validasi target adalah mahasiswa aktif
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id = p.id
        JOIN public.roles r ON r.id = ur.role_id
        WHERE p.id = p_student_id
          AND p.status = 'ACTIVE'
          AND r.code = 'STUDENT'
          AND ur.status = 'ACTIVE'
    ) INTO v_is_student;

    IF NOT v_is_student THEN
        RAISE EXCEPTION 'INVALID_STUDENT: Pengguna yang didaftarkan bukan mahasiswa aktif';
    END IF;

    -- Periksa apakah sudah terdaftar aktif
    SELECT * INTO v_enrollment FROM public.enrollments WHERE class_id = p_class_id AND student_id = p_student_id;
    IF FOUND AND v_enrollment.status = 'ACTIVE' THEN
        RAISE EXCEPTION 'ALREADY_ENROLLED';
    END IF;

    -- Periksa kapasitas kelas
    SELECT count(*) INTO v_count FROM public.enrollments WHERE class_id = p_class_id AND status = 'ACTIVE';
    IF v_class.capacity IS NOT NULL AND v_count >= v_class.capacity THEN
        RAISE EXCEPTION 'CLASS_FULL';
    END IF;

    -- Aktifkan rpc_context
    PERFORM set_config('app.rpc_context', 'on', true);

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

-- 4e. MUTASI PINDAH KELAS PARALEL (HANYA Staf Akademik) (F5, F7)
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
    v_is_active_student BOOLEAN;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- F5: Batasan ketat: HANYA Staf Akademik (SUPER_ADMIN dilarang)
    IF NOT public.has_global_role('ACADEMIC_STAFF') THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Staf Akademik yang dapat memindahkan kelas mahasiswa';
    END IF;

    IF p_source_class_id = p_target_class_id THEN
        RAISE EXCEPTION 'SAME_CLASS: Kelas tujuan tidak boleh sama dengan kelas asal';
    END IF;

    -- F7: Validasi mahasiswa berstatus aktif
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id = p.id
        JOIN public.roles r ON r.id = ur.role_id
        WHERE p.id = p_student_id
          AND p.status = 'ACTIVE'
          AND r.code = 'STUDENT'
          AND ur.status = 'ACTIVE'
    ) INTO v_is_active_student;

    IF NOT v_is_active_student THEN
        RAISE EXCEPTION 'STUDENT_NOT_ACTIVE: Mahasiswa tidak berstatus mahasiswa aktif';
    END IF;

    -- Validasi kelas asal dan enrollment aktif
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

    -- F7: Kelas tujuan harus memiliki course_id dan semester_id sama (kelas paralel)
    IF (v_source_class.course_id IS DISTINCT FROM v_target_class.course_id) OR
       (v_source_class.semester_id IS DISTINCT FROM v_target_class.semester_id) THEN
        RAISE EXCEPTION 'NOT_PARALLEL_CLASS: Kelas tujuan bukan merupakan kelas paralel (course_id atau semester_id berbeda)';
    END IF;

    -- Kapasitas kelas tujuan
    SELECT count(*) INTO v_target_count FROM public.enrollments WHERE class_id = p_target_class_id AND status = 'ACTIVE';
    IF v_target_class.capacity IS NOT NULL AND v_target_count >= v_target_class.capacity THEN
        RAISE EXCEPTION 'TARGET_CLASS_FULL';
    END IF;

    -- Aktifkan rpc_context
    PERFORM set_config('app.rpc_context', 'on', true);

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

-- 4f. BATCH ENROLL PESERTA VIA JSON/CSV (HANYA Staf Akademik) (F5, F7)
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
    v_results JSONB := '[]'::jsonb;
    v_errors JSONB := '[]'::jsonb;
    v_total INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- F5: Batasan ketat: HANYA Staf Akademik (SUPER_ADMIN dilarang)
    IF NOT public.has_global_role('ACADEMIC_STAFF') THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Staf Akademik yang dapat mengimpor data peserta via CSV';
    END IF;

    -- F7: Validasi bentuk payload harus JSON array
    IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'INVALID_JSON_ARRAY: Payload batch enrollment harus berupa JSON array';
    END IF;

    v_total := jsonb_array_length(p_rows);

    -- F7: Validasi batas baris per panggilan (maksimal <= 1000)
    IF v_total > 1000 THEN
        RAISE EXCEPTION 'BATCH_LIMIT_EXCEEDED: Batas maksimal per panggilan adalah 1000 baris (diterima % baris)', v_total;
    END IF;

    IF v_total = 0 THEN
        RAISE EXCEPTION 'EMPTY_BATCH: Data baris batch enrollment tidak boleh kosong';
    END IF;

    FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
    LOOP
        BEGIN
            v_student_id := (v_row->>'student_id')::UUID;
            v_class_id := (v_row->>'class_id')::UUID;

            PERFORM public.enroll_student(v_class_id, v_student_id);
            v_success_count := v_success_count + 1;
            v_results := v_results || jsonb_build_object(
                'student_id', v_row->>'student_id',
                'class_id', v_row->>'class_id',
                'status', 'SUCCESS'
            );
        EXCEPTION WHEN OTHERS THEN
            v_fail_count := v_fail_count + 1;
            v_errors := v_errors || jsonb_build_object(
                'student_id', v_row->>'student_id',
                'class_id', v_row->>'class_id',
                'error', SQLERRM
            );
            v_results := v_results || jsonb_build_object(
                'student_id', v_row->>'student_id',
                'class_id', v_row->>'class_id',
                'status', 'FAILED',
                'error', SQLERRM
            );
        END;
    END LOOP;

    INSERT INTO public.audit_logs (
        actor_user_id, actor_role, action, entity_type, entity_id, scope_type, description, details
    ) VALUES (
        v_uid, 'ACADEMIC_STAFF', 'class.batch_enroll', 'enrollments', gen_random_uuid(), 'GLOBAL',
        format('Staf mengeksekusi batch enrollment CSV: %s berhasil, %s gagal dari total %s baris', v_success_count, v_fail_count, v_total),
        jsonb_build_object('total', v_total, 'success_count', v_success_count, 'fail_count', v_fail_count, 'errors', v_errors)
    );

    RETURN jsonb_build_object(
        'total', v_total,
        'success', v_success_count,
        'failed', v_fail_count,
        'results', v_results,
        'errors', v_errors
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. CABUT DARI PUBLIC & ANON, GRANT KE AUTHENTICATED & SERVICE_ROLE (F4)
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.propose_class(TEXT, TEXT, UUID, UUID, SMALLINT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_class(UUID, public.class_status, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assign_lecturer(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.enroll_student(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.transfer_class(UUID, UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.batch_enroll_students(JSONB) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.propose_class(TEXT, TEXT, UUID, UUID, SMALLINT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_class(UUID, public.class_status, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assign_lecturer(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enroll_student(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_class(UUID, UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.batch_enroll_students(JSONB) TO authenticated, service_role;

COMMIT;
