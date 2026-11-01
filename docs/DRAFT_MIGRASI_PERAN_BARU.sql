-- ============================================================================
-- DRAFT - BELUM DIJALANKAN - BUTUH PERSETUJUAN PENGGUNA
-- ============================================================================
-- Dokumen ini adalah DRAFT migrasi pelengkap RLS dan seed peran baru
-- (PROGRAM_SECRETARY dan LAB_HEAD) agar halaman portal di lingkungan production
-- tidak kosong saat membaca data riil dari Supabase.
-- Dilarang memindahkan berkas ini ke supabase/migrations/ sebelum disetujui.
-- ============================================================================

-- 1. Pastikan kedua peran baru terdaftar secara idempoten di tabel public.roles
INSERT INTO public.roles (id, code, name, description) VALUES
    ('10000000-0000-0000-0000-000000000011', 'PROGRAM_SECRETARY', 'Sekretaris Program Studi', 'Membantu koordinasi akademik dan operasional program studi'),
    ('10000000-0000-0000-0000-000000000012', 'LAB_HEAD', 'Kepala Laboratorium', 'Mengelola fasilitas laboratorium, praktikum, dan asisten lab')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. Perluas RLS Policy classes_select (public.classes)
-- Masalah saat ini: Kebijakan classes_select pada 20261011000016_phase3a_domain1_2_hardening.sql
-- hanya mengizinkan PROGRAM_COORDINATOR, LECTURER, TA, STUDENT, ACADEMIC_STAFF, dan SUPER_ADMIN.
-- Akibatnya: Halaman /secretary/classes dan /lab/classes mengembalikan 0 baris di production.
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
        -- 3. Kaprodi & Sekprodi: Kelas pada program studinya
        OR (
            public.has_active_role('PROGRAM_COORDINATOR') 
            AND EXISTS (
                SELECT 1 FROM public.courses cr
                WHERE cr.id = public.classes.course_id
                  AND public.is_program_coordinator(cr.program_id)
            )
        )
        OR (
            public.has_active_role('PROGRAM_SECRETARY') 
            AND EXISTS (
                SELECT 1 FROM public.courses cr
                WHERE cr.id = public.classes.course_id
                  AND public.is_program_secretary(cr.program_id)
            )
        )
        -- 4. Kepala Lab: Kelas praktikum yang diselenggarakan di laboratoriumnya
        OR (
            public.has_active_role('LAB_HEAD')
            AND public.is_lab_head_of_class(id)
        )
        -- 5. Staf Akademik & Super Admin
        OR public.has_global_role('ACADEMIC_STAFF')
        OR public.has_global_role('SUPER_ADMIN')
    )
);

-- 3. Perluas RLS Policy gcr_staff_select (public.grade_change_requests)
-- Masalah saat ini: gcr_staff_select pada 20261011000014_grade_change_decision_and_execution.sql
-- hanya mengizinkan is_class_lecturer, is_class_coordinator, dan ACADEMIC_STAFF.
-- Akibatnya: Halaman /secretary/requests dan listChangeRequestsAction mengembalikan 0 baris.
DROP POLICY IF EXISTS gcr_staff_select ON public.grade_change_requests;
CREATE POLICY gcr_staff_select ON public.grade_change_requests
FOR SELECT TO authenticated
USING (
    public.is_class_lecturer(class_id)
    OR public.is_class_coordinator(class_id)
    OR EXISTS (
        SELECT 1 FROM public.classes cl
        JOIN public.courses cr ON cr.id = cl.course_id
        WHERE cl.id = public.grade_change_requests.class_id
          AND public.is_program_secretary(cr.program_id)
    )
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = (SELECT auth.uid()) AND r.code = 'ACADEMIC_STAFF' AND ur.status = 'ACTIVE'
    )
    OR public.has_global_role('SUPER_ADMIN')
);
