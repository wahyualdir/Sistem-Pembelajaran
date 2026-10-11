-- SIAJAR Migration: Alur Otorisasi & Eksekusi Perubahan Nilai (Fase 2C, 2D & 2E)
-- Mengikuti pola 20260930000009_grade_changes.sql dengan RLS per Prodi, penegakan pemisahan tugas (Separation of Duties), dan mesin status ketat.
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
-- Aturan Keamanan (A4b, A4d, A4e):
-- a. Aktor diambil murni dari auth.uid() (BUKAN parameter klien)
-- b. Role dan wewenang dicek di database (is_class_coordinator)
-- c. Pemohon DILARANG memutuskan pengajuannya sendiri, DAN dosen pengampu kelas terkait DILARANG menyetujui (A4b)
-- d. Pesan blokir: "Anda tidak dapat menyetujui pengajuan sendiri. Pengajuan perlu ditinjau oleh penyetuju lain."
-- e. Mesin status ketat: Hanya status 'PENDING' yang dapat diproses menjadi 'APPROVED' atau 'REJECTED' (A4d)
-- f. Minimal 10 karakter catatan keputusan
-- g. Persetujuan TIDAK langsung mengubah nilai final (status menjadi 'APPROVED', menunggu eksekusi Staf di 2D)
CREATE OR REPLACE FUNCTION public.decide_grade_change(p_request uuid, p_approve boolean, p_note text)
RETURNS public.grade_change_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_r public.grade_change_requests;
    v_clean_note text := trim(COALESCE(p_note, ''));
    v_is_class_lecturer boolean;
BEGIN
    -- Validasi sesi autentikasi
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Pengguna tidak terautentikasi.';
    END IF;

    -- Kunci baris permohonan untuk transaksi konkuren
    SELECT * INTO v_r FROM public.grade_change_requests WHERE id = p_request FOR UPDATE;
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'NOT_FOUND: Berkas permohonan perubahan nilai tidak ditemukan.'; 
    END IF;
    
    -- Validasi wewenang Kaprodi per Prodi terkait
    IF NOT public.is_class_coordinator(v_r.class_id) THEN 
        RAISE EXCEPTION 'FORBIDDEN: Hanya Koordinator Program Studi dari mata kuliah terkait yang berwenang memutuskan.'; 
    END IF;

    -- Validasi A4b: Cek apakah peninjau adalah dosen pengampu kelas terkait
    SELECT EXISTS (
        SELECT 1 FROM public.classes c WHERE c.id = v_r.class_id AND c.lecturer_id = v_uid
    ) INTO v_is_class_lecturer;

    -- Validasi A4b: Penolakan jika penyetuju adalah (i) pengaju, ATAU (ii) dosen pengampu kelas terkait, ATAU (iii) user id sama
    IF v_r.requested_by = v_uid OR v_is_class_lecturer THEN 
        RAISE EXCEPTION 'SELF_OR_LECTURER_APPROVAL: Anda tidak dapat menyetujui pengajuan sendiri. Pengajuan perlu ditinjau oleh penyetuju lain.'; 
    END IF;

    -- Validasi A4d: Mesin status ketat, hanya PENDING yang boleh diproses
    IF v_r.status <> 'PENDING' THEN 
        RAISE EXCEPTION 'INVALID_STATE: Hanya pengajuan berstatus PENDING yang dapat diproses.'; 
    END IF;

    -- Validasi alasan minimal 10 karakter untuk pengajuan DAN penolakan
    IF length(v_clean_note) < 10 THEN 
        RAISE EXCEPTION 'NOTE_MIN_10_CHARS: Catatan atau alasan keputusan minimal 10 karakter.'; 
    END IF;

    -- Perbarui status permohonan dalam SATU transaksi
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

    -- Catat ke Audit Log Sistem
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
-- Aturan Keamanan (A4c, A4d, A4e):
-- a. Aktor diambil dari auth.uid() (BUKAN parameter klien)
-- b. Hanya peran ACADEMIC_STAFF yang berwenang (dicek di database)
-- c. Pemisahan Tugas (A4c): Pengaju, Penyetuju, dan Eksekutor harus TIGA user id yang BERBEDA
-- d. Mesin status ketat & Idempotensi (A4d): Hanya status 'APPROVED' yang dapat dieksekusi; Tolak eksekusi ganda jika status sudah 'EXECUTED'
-- e. Validasi rentang nilai 0-100 (A4e)
-- f. Nilai saat ini diverifikasi sama persis dengan old_score (FOR UPDATE)
-- g. Nilai berubah + status + audit ditulis dalam SATU transaksi atomik
CREATE OR REPLACE FUNCTION public.execute_grade_change(p_request uuid, p_note text DEFAULT NULL)
RETURNS public.grade_change_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_r public.grade_change_requests;
    v_g public.grades;
    v_is_staff boolean;
    v_clean_note text := trim(COALESCE(p_note, 'Eksekusi administratif nilai perkuliahan oleh Staf Akademik'));
BEGIN
    -- Validasi sesi autentikasi
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Pengguna tidak terautentikasi.';
    END IF;

    -- Validasi wewenang Staf Akademik di database
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = v_uid AND r.code = 'ACADEMIC_STAFF' AND ur.status = 'ACTIVE'
    ) INTO v_is_staff;

    IF NOT v_is_staff THEN
        RAISE EXCEPTION 'FORBIDDEN: Hanya Staf Akademik yang berwenang mengeksekusi perubahan nilai.';
    END IF;

    -- Kunci baris permohonan untuk transaksi atomik
    SELECT * INTO v_r FROM public.grade_change_requests WHERE id = p_request FOR UPDATE;
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'NOT_FOUND: Berkas permohonan tidak ditemukan.'; 
    END IF;

    -- Validasi A4d: Tolak eksekusi ganda (Idempoten)
    IF v_r.status = 'EXECUTED' THEN
        RAISE EXCEPTION 'ALREADY_EXECUTED: Pengajuan ini telah dieksekusi sebelumnya (eksekusi hanya dapat dilakukan satu kali).';
    END IF;

    -- Validasi A4d: Mesin status ketat (Hanya APPROVED yang boleh dieksekusi)
    IF v_r.status <> 'APPROVED' THEN
        RAISE EXCEPTION 'NOT_APPROVED: Hanya pengajuan berstatus APPROVED yang dapat dieksekusi.';
    END IF;

    -- Validasi A4c: Pemisahan tugas (Pengaju, Penyetuju, Eksekutor harus 3 user id berbeda)
    IF v_uid = v_r.requested_by OR v_uid = v_r.reviewed_by OR (v_r.reviewed_by IS NOT NULL AND v_r.requested_by = v_r.reviewed_by) THEN
        RAISE EXCEPTION 'SEPARATION_OF_DUTIES_VIOLATION: Pemisahan tugas dilanggar: Pengaju, penyetuju, dan eksekutor harus tiga pengguna yang berbeda.';
    END IF;

    -- Validasi A4e: Rentang nilai 0-100
    IF v_r.proposed_score < 0 OR v_r.proposed_score > 100 THEN
        RAISE EXCEPTION 'INVALID_SCORE_RANGE: Nilai usulan harus berada dalam rentang 0-100.';
    END IF;

    -- Kunci dan verifikasi tabel grades (FOR UPDATE)
    SELECT * INTO v_g FROM public.grades WHERE id = v_r.grade_id FOR UPDATE;
    IF NOT FOUND THEN 
        RAISE EXCEPTION 'GRADE_NOT_FOUND: Data nilai final tidak ditemukan.'; 
    END IF;

    -- Verifikasi integritas: nilai saat ini masih sama dengan nilai lama pada saat pengajuan
    IF v_g.score <> v_r.old_score THEN
        RAISE EXCEPTION 'OLD_SCORE_MISMATCH: Nilai saat ini ( % ) berbeda dengan nilai awal pengajuan ( % ). Eksekusi dibatalkan untuk investigasi.', v_g.score, v_r.old_score;
    END IF;

    -- 1. Eksekusi pembaruan nilai final
    UPDATE public.grades 
    SET score = v_r.proposed_score, updated_at = now() 
    WHERE id = v_r.grade_id 
    RETURNING * INTO v_g;

    -- 2. Catat riwayat perubahan nilai resmi
    INSERT INTO public.grade_history (grade_id, class_id, old_score, new_score, old_status, new_status, changed_by, reason)
    VALUES (v_g.id, v_r.class_id, v_r.old_score, v_r.proposed_score, 'FINAL', 'FINAL', v_uid, v_r.reason);

    -- 3. Perbarui status berkas permohonan menjadi EXECUTED
    UPDATE public.grade_change_requests
    SET status = 'EXECUTED'::public.change_request_status,
        executed_by = v_uid,
        executed_at = now(),
        execution_note = v_clean_note
    WHERE id = p_request RETURNING * INTO v_r;

    -- 4. Notifikasi kepada Mahasiswa
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

    -- 5. Notifikasi kepada Dosen Pengampu
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

    -- 6. Catat jejak audit lengkap dalam satu transaksi atomik
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

-- Izin Eksekusi Fungsi (Revoke dari public/anon, grant ke authenticated)
REVOKE ALL ON FUNCTION public.decide_grade_change(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.execute_grade_change(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_grade_change(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_grade_change(uuid, text) TO authenticated;
