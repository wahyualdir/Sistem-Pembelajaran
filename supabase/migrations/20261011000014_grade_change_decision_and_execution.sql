-- SIAJAR Migration: Alur Otorisasi & Eksekusi Perubahan Nilai (Fase 2C & 2D)
-- Mengikuti pola 20260930000009_grade_changes.sql dengan RLS per Prodi dan wewenang Staf Akademik.
-- CATATAN: JANGAN MENJALANKAN MIGRASI INI KE DATABASE PRODUCTION SECARA OTOMATIS.
-- Gunakan instruksi penerapan pada laporan akhir.

-- 1. Tambah nilai enum EXECUTED jika belum ada
DO $$ BEGIN
    ALTER TYPE public.change_request_status ADD VALUE IF NOT EXISTS 'EXECUTED';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Tambah kolom jejak audit eksekusi staf pada tabel grade_change_requests
ALTER TABLE public.grade_change_requests
    ADD COLUMN IF NOT EXISTS executed_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS execution_note TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_gcr_status_executed ON public.grade_change_requests(status) WHERE status = 'EXECUTED';

-- 3. Perbarui Policy RLS: Izinkan Staf Akademik membaca dan mengeksekusi pengajuan nilai
DROP POLICY IF EXISTS gcr_staff_select ON public.grade_change_requests;
CREATE POLICY gcr_staff_select ON public.grade_change_requests
FOR SELECT TO authenticated
USING (
    public.is_class_lecturer(class_id) OR
    public.is_class_coordinator(class_id) OR
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.code = 'ACADEMIC_STAFF' AND ur.status = 'ACTIVE'
    )
);

-- 4. RPC: Keputusan Kaprodi (Persetujuan / Penolakan)
-- Aturan:
-- a. Minimal 10 karakter catatan
-- b. Pemohon DILARANG memutuskan pengajuannya sendiri (SELF_APPROVAL)
-- c. Hanya Kaprodi dari prodi mata kuliah kelas terkait yang berwenang (is_class_coordinator)
-- d. Persetujuan TIDAK langsung mengubah nilai final (status menjadi 'APPROVED', menunggu eksekusi Staf di 2D)
CREATE OR REPLACE FUNCTION public.decide_grade_change(p_request uuid, p_approve boolean, p_note text)
RETURNS public.grade_change_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_r public.grade_change_requests;
    v_clean_note text := trim(COALESCE(p_note, ''));
BEGIN
    SELECT * INTO v_r FROM public.grade_change_requests WHERE id = p_request FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    
    -- Validasi wewenang Kaprodi per Prodi
    IF v_uid IS NULL OR NOT public.is_class_coordinator(v_r.class_id) THEN 
        RAISE EXCEPTION 'FORBIDDEN'; 
    END IF;

    -- Validasi pemohon tidak boleh menyetujui pengajuannya sendiri
    IF v_r.requested_by = v_uid THEN 
        RAISE EXCEPTION 'SELF_APPROVAL: Tidak dapat menyetujui pengajuan sendiri. Pengajuan harus dieskalasi ke Dekan / Pimpinan Fakultas.'; 
    END IF;

    -- Validasi status harus PENDING
    IF v_r.status <> 'PENDING' THEN 
        RAISE EXCEPTION 'NOT_PENDING'; 
    END IF;

    -- Validasi alasan minimal 10 karakter untuk pengajuan DAN penolakan
    IF length(v_clean_note) < 10 THEN 
        RAISE EXCEPTION 'NOTE_MIN_10_CHARS: Catatan atau alasan keputusan minimal 10 karakter.'; 
    END IF;

    -- Perbarui status permohonan
    UPDATE public.grade_change_requests
    SET status = (CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END)::public.change_request_status,
        reviewed_by = v_uid, 
        review_note = v_clean_note, 
        reviewed_at = now()
    WHERE id = p_request RETURNING * INTO v_r;

    -- Notifikasi ke dosen pengaju
    INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, class_id)
    VALUES (
        v_r.requested_by,
        'GRADE_CHANGE_DECIDED',
        CASE WHEN p_approve THEN 'Pengajuan Perubahan Nilai Disetujui Kaprodi' ELSE 'Pengajuan Perubahan Nilai Ditolak Kaprodi' END,
        CASE WHEN p_approve 
            THEN 'Pengajuan revisi nilai untuk ' || v_r.student_name || ' disetujui Kaprodi dan sedang menunggu eksekusi berkas oleh Staf Akademik.' 
            ELSE 'Pengajuan revisi nilai untuk ' || v_r.student_name || ' ditolak Kaprodi: ' || v_clean_note 
        END,
        'grade_change_requests',
        p_request,
        v_r.class_id
    );

    -- Catat ke Audit Log
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (
        v_uid, 
        'PROGRAM_COORDINATOR', 
        CASE WHEN p_approve THEN 'grade.change_approve' ELSE 'grade.change_reject' END,
        'grade_change_requests', 
        p_request, 
        'CLASS', 
        v_r.class_id,
        jsonb_build_object(
            'old_score', v_r.old_score, 
            'proposed_score', v_r.proposed_score,
            'note', v_clean_note,
            'status', v_r.status
        )
    );

    RETURN v_r;
END;
$$;

-- 5. RPC: Eksekusi Perubahan Nilai oleh Staf Akademik (Fase 2D)
-- Aturan:
-- a. Hanya peran ACADEMIC_STAFF yang berwenang
-- b. Hanya pengajuan berstatus 'APPROVED' yang dapat dieksekusi
-- c. Server memverifikasi nilai saat ini masih sama dengan old_score (mencegah double execution / drift)
-- d. Nilai final pada tabel grades diperbarui dan grade_history dicatat
-- e. Status pengajuan menjadi 'EXECUTED' lengkap dengan executed_by dan executed_at
-- f. Catat jejak lengkap di audit_logs dan kirim notifikasi ke mahasiswa + dosen
CREATE OR REPLACE FUNCTION public.execute_grade_change(p_request uuid, p_note text DEFAULT NULL)
RETURNS public.grade_change_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_r public.grade_change_requests;
    v_g public.grades;
    v_is_staff boolean;
    v_clean_note text := trim(COALESCE(p_note, 'Eksekusi administratif nilai perkuliahan oleh Staf Akademik'));
BEGIN
    -- Validasi wewenang Staf Akademik
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = v_uid AND r.code = 'ACADEMIC_STAFF' AND ur.status = 'ACTIVE'
    ) INTO v_is_staff;

    IF v_uid IS NULL OR NOT v_is_staff THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Staf Akademik yang berwenang mengeksekusi perubahan nilai.';
    END IF;

    -- Kunci baris permohonan
    SELECT * INTO v_r FROM public.grade_change_requests WHERE id = p_request FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND: Berkas permohonan tidak ditemukan.'; END IF;

    -- Validasi status harus APPROVED
    IF v_r.status <> 'APPROVED' THEN
        RAISE EXCEPTION 'NOT_APPROVED: Hanya pengajuan berstatus disetujui yang dapat dieksekusi.';
    END IF;

    -- Kunci dan verifikasi tabel grades
    SELECT * INTO v_g FROM public.grades WHERE id = v_r.grade_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'GRADE_NOT_FOUND: Data nilai final tidak ditemukan.'; END IF;

    -- Verifikasi integritas: nilai saat ini masih sama dengan nilai lama pada saat pengajuan
    IF v_g.score <> v_r.old_score THEN
        RAISE EXCEPTION 'OLD_SCORE_MISMATCH: Nilai saat ini ( % ) berbeda dengan nilai awal pengajuan ( % ). Eksekusi dibatalkan untuk investigasi.', v_g.score, v_r.old_score;
    END IF;

    -- Eksekusi pembaruan nilai final
    UPDATE public.grades 
    SET score = v_r.proposed_score, updated_at = now() 
    WHERE id = v_r.grade_id 
    RETURNING * INTO v_g;

    -- Catat riwayat perubahan nilai resmi
    INSERT INTO public.grade_history (grade_id, class_id, old_score, new_score, old_status, new_status, changed_by, reason)
    VALUES (v_g.id, v_r.class_id, v_r.old_score, v_r.proposed_score, 'FINAL', 'FINAL', v_uid, v_r.reason);

    -- Perbarui status berkas permohonan menjadi EXECUTED
    UPDATE public.grade_change_requests
    SET status = 'EXECUTED'::public.change_request_status,
        executed_by = v_uid,
        executed_at = now(),
        execution_note = v_clean_note
    WHERE id = p_request RETURNING * INTO v_r;

    -- Notifikasi kepada Mahasiswa
    INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, class_id)
    VALUES (
        v_g.student_id,
        'GRADE_UPDATED',
        'Nilai Akhir Diperbarui: ' || v_r.assignment_title,
        'Nilai Anda pada kelas ' || v_r.class_title || ' telah resmi diubah menjadi ' || v_r.proposed_score || ' oleh Biro Akademik.',
        'grades',
        v_g.id,
        v_r.class_id
    );

    -- Notifikasi kepada Dosen Pengampu
    INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, class_id)
    VALUES (
        v_r.requested_by,
        'GRADE_CHANGE_EXECUTED',
        'Eksekusi Selesai: ' || v_r.assignment_title,
        'Permohonan revisi nilai mahasiswa ' || v_r.student_name || ' telah dieksekusi oleh Staf Akademik menjadi ' || v_r.proposed_score || '.',
        'grade_change_requests',
        p_request,
        v_r.class_id
    );

    -- Catat jejak audit lengkap
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (
        v_uid,
        'ACADEMIC_STAFF',
        'grade.change_executed',
        'grade_change_requests',
        p_request,
        'CLASS',
        v_r.class_id,
        jsonb_build_object(
            'old_score', v_r.old_score,
            'new_score', v_r.proposed_score,
            'requested_by', v_r.requested_by,
            'reviewed_by', v_r.reviewed_by,
            'executed_by', v_uid,
            'execution_note', v_clean_note
        )
    );

    RETURN v_r;
END;
$$;

-- Izin Eksekusi Fungsi
REVOKE ALL ON FUNCTION public.decide_grade_change(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.execute_grade_change(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_grade_change(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_grade_change(uuid, text) TO authenticated;
