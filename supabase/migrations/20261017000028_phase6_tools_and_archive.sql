-- ============================================================================
-- MIGRATION: 20261017000028_phase6_tools_and_archive.sql
-- Deskripsi: Fase 6 - Alat Bantu Dosen dan Sistem (Salin & Arsip Kelas, Impor Soal Massal, Moodle XML & QTI)
--
-- CARA MEMBATALKAN (ROLLBACK):
-- DROP TABLE IF EXISTS public.question_import_jobs CASCADE;
-- DROP TABLE IF EXISTS public.clone_jobs CASCADE;
-- DROP FUNCTION IF EXISTS public.clone_class(uuid, uuid, jsonb, int) CASCADE;
-- DROP FUNCTION IF EXISTS public.archive_class(uuid, text) CASCADE;
-- DROP FUNCTION IF EXISTS public.unarchive_class(uuid, text) CASCADE;
-- ALTER TABLE public.classes DROP COLUMN IF EXISTS archived_at;
-- ALTER TABLE public.classes DROP COLUMN IF EXISTS archived_by;
-- ALTER TABLE public.classes DROP COLUMN IF EXISTS archive_reason;
-- ============================================================================

-- 1. Kolom arsip pada tabel classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS archived_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT NULL;

-- 2. Tabel Pekerjaan Klon / Salin Kelas
CREATE TABLE IF NOT EXISTS public.clone_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  target_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'antre' CHECK (status IN ('antre', 'berjalan', 'selesai', 'gagal')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_shift_days INT NOT NULL DEFAULT 0,
  error TEXT NULL,
  result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clone_jobs_source ON public.clone_jobs(source_class_id);
CREATE INDEX IF NOT EXISTS idx_clone_jobs_target ON public.clone_jobs(target_class_id);
CREATE INDEX IF NOT EXISTS idx_clone_jobs_requested_by ON public.clone_jobs(requested_by);

ALTER TABLE public.clone_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clone_jobs_select ON public.clone_jobs;
CREATE POLICY clone_jobs_select ON public.clone_jobs
FOR SELECT TO authenticated
USING (
  requested_by = auth.uid()
  OR public.has_global_role('ACADEMIC_STAFF')
  OR public.has_global_role('SUPER_ADMIN')
  OR public.is_class_staff(source_class_id)
  OR public.is_class_staff(target_class_id)
);

DROP POLICY IF EXISTS clone_jobs_write ON public.clone_jobs;
CREATE POLICY clone_jobs_write ON public.clone_jobs
FOR ALL TO authenticated
USING (
  requested_by = auth.uid()
  OR public.has_global_role('ACADEMIC_STAFF')
  OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
  requested_by = auth.uid()
  OR public.has_global_role('ACADEMIC_STAFF')
  OR public.has_global_role('SUPER_ADMIN')
);

-- 3. Tabel Riwayat & Pekerjaan Impor Soal Massal
CREATE TABLE IF NOT EXISTS public.question_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format TEXT NOT NULL CHECK (format IN ('excel', 'word', 'moodle_xml', 'qti')),
  file_path TEXT NULL,
  total_count INT NOT NULL DEFAULT 0,
  valid_count INT NOT NULL DEFAULT 0,
  warning_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf', 'selesai', 'dibatalkan', 'galat')),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_import_jobs_user ON public.question_import_jobs(created_by);

ALTER TABLE public.question_import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS question_import_jobs_select ON public.question_import_jobs;
CREATE POLICY question_import_jobs_select ON public.question_import_jobs
FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_global_role('ACADEMIC_STAFF')
  OR public.has_global_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS question_import_jobs_write ON public.question_import_jobs;
CREATE POLICY question_import_jobs_write ON public.question_import_jobs
FOR ALL TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_global_role('ACADEMIC_STAFF')
  OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_global_role('ACADEMIC_STAFF')
  OR public.has_global_role('SUPER_ADMIN')
);

-- 4. RPC untuk Pengarsipan Kelas
CREATE OR REPLACE FUNCTION public.archive_class(p_class_id UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_staff BOOLEAN;
  v_is_owner BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'pesan', 'Pengguna belum terautentikasi.');
  END IF;

  v_is_staff := public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN');
  v_is_owner := EXISTS (SELECT 1 FROM public.classes WHERE id = p_class_id AND created_by = v_caller);

  IF NOT (v_is_staff OR v_is_owner) THEN
    RETURN jsonb_build_object('ok', false, 'pesan', 'Anda tidak memiliki wewenang untuk mengarsipkan kelas ini.');
  END IF;

  UPDATE public.classes
  SET
    status = 'ARCHIVED',
    archived_at = now(),
    archived_by = v_caller,
    archive_reason = COALESCE(p_reason, 'Diarsipkan oleh pengampu/staf'),
    updated_at = now()
  WHERE id = p_class_id;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_caller,
    'ARSIP_KELAS',
    'classes',
    p_class_id,
    jsonb_build_object('reason', p_reason, 'archived_at', now())
  );

  RETURN jsonb_build_object('ok', true, 'pesan', 'Kelas berhasil diarsipkan.');
END;
$$;

-- 5. RPC untuk Pembatalan Arsip Kelas (Hanya Staf & Super Admin)
CREATE OR REPLACE FUNCTION public.unarchive_class(p_class_id UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_staff BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'pesan', 'Pengguna belum terautentikasi.');
  END IF;

  v_is_staff := public.has_global_role('ACADEMIC_STAFF') OR public.has_global_role('SUPER_ADMIN');
  IF NOT v_is_staff THEN
    RETURN jsonb_build_object('ok', false, 'pesan', 'Hanya Staf Akademik atau Super Admin yang dapat membuka kembali kelas arsip.');
  END IF;

  UPDATE public.classes
  SET
    status = 'ACTIVE',
    archived_at = NULL,
    archived_by = NULL,
    archive_reason = COALESCE(p_reason, 'Arsip dibuka kembali oleh staf'),
    updated_at = now()
  WHERE id = p_class_id;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_caller,
    'BATAL_ARSIP_KELAS',
    'classes',
    p_class_id,
    jsonb_build_object('reason', p_reason, 'unarchived_at', now())
  );

  RETURN jsonb_build_object('ok', true, 'pesan', 'Arsip kelas berhasil dibuka kembali.');
END;
$$;

-- 6. RPC untuk Salin / Klon Kelas
CREATE OR REPLACE FUNCTION public.clone_class(
  p_source_id UUID,
  p_target_id UUID,
  p_options JSONB DEFAULT '{}'::jsonb,
  p_date_shift_days INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_job_id UUID;
  v_copy_materials BOOLEAN := COALESCE((p_options->>'materials')::boolean, true);
  v_copy_assignments BOOLEAN := COALESCE((p_options->>'assignments')::boolean, true);
  v_copy_quizzes BOOLEAN := COALESCE((p_options->>'quizzes')::boolean, true);
  v_copy_rubrics BOOLEAN := COALESCE((p_options->>'rubrics')::boolean, true);
  v_copy_gamification BOOLEAN := COALESCE((p_options->>'gamification')::boolean, true);
  v_copy_cpmk BOOLEAN := COALESCE((p_options->>'cpmk')::boolean, true);
  v_copy_assistants BOOLEAN := COALESCE((p_options->>'assistants')::boolean, false);
  
  v_count_materials INT := 0;
  v_count_assignments INT := 0;
  v_count_quizzes INT := 0;
  v_count_assistants INT := 0;
  
  v_mat RECORD;
  v_asg RECORD;
  v_quiz RECORD;
  v_new_quiz_id UUID;
  v_new_asg_id UUID;
  v_q RECORD;
  v_new_q_id UUID;
  v_opt RECORD;
  v_new_opt_id UUID;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'pesan', 'Pengguna belum terautentikasi.');
  END IF;

  -- Pastikan pemanggil berhak: Dosen pengampu di kedua kelas ATAU Staf Akademik
  IF NOT (
    (public.is_class_staff(p_source_id) AND public.is_class_staff(p_target_id))
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'pesan', 'Anda tidak memiliki wewenang untuk menyalin kelas ini.');
  END IF;

  -- Buat baris pekerjaan di clone_jobs
  INSERT INTO public.clone_jobs (
    source_class_id,
    target_class_id,
    status,
    progress,
    options,
    date_shift_days,
    requested_by
  )
  VALUES (
    p_source_id,
    p_target_id,
    'berjalan',
    10,
    p_options,
    p_date_shift_days,
    v_caller
  )
  RETURNING id INTO v_job_id;

  -- 1. Salin Pengaturan Gamifikasi
  IF v_copy_gamification THEN
    INSERT INTO public.class_gamification_settings (class_id, enabled, leaderboard_enabled)
    SELECT p_target_id, enabled, leaderboard_enabled
    FROM public.class_gamification_settings
    WHERE class_id = p_source_id
    ON CONFLICT (class_id) DO UPDATE
      SET enabled = EXCLUDED.enabled,
          leaderboard_enabled = EXCLUDED.leaderboard_enabled;
  END IF;

  -- 2. Salin Asisten (hanya jika opsi dipilih)
  IF v_copy_assistants THEN
    INSERT INTO public.class_assistants (
      class_id,
      user_id,
      permission,
      can_open_attendance,
      can_view_similarity,
      granted_by
    )
    SELECT
      p_target_id,
      user_id,
      permission,
      can_open_attendance,
      can_view_similarity,
      v_caller
    FROM public.class_assistants
    WHERE class_id = p_source_id
    ON CONFLICT (class_id, user_id, permission) DO NOTHING;
    
    GET DIAGNOSTICS v_count_assistants = ROW_COUNT;
  END IF;

  -- 3. Salin Materi Perkuliahan
  IF v_copy_materials THEN
    FOR v_mat IN
      SELECT * FROM public.materials WHERE class_id = p_source_id
    LOOP
      INSERT INTO public.materials (
        class_id,
        title,
        body_md,
        status,
        created_by
      )
      VALUES (
        p_target_id,
        v_mat.title,
        v_mat.body_md,
        'DRAFT', -- Selalu draf di kelas baru
        v_caller
      );
      v_count_materials := v_count_materials + 1;
    END LOOP;
  END IF;

  UPDATE public.clone_jobs SET progress = 50 WHERE id = v_job_id;

  -- 4. Salin Tugas Perkuliahan (status DRAFT, tanggal bergeser)
  IF v_copy_assignments THEN
    FOR v_asg IN
      SELECT * FROM public.assignments WHERE class_id = p_source_id
    LOOP
      INSERT INTO public.assignments (
        class_id,
        title,
        description,
        due_at,
        close_at,
        release_at,
        max_score,
        late_policy,
        late_penalty_value,
        late_penalty_cap,
        allow_resubmit,
        max_resubmits,
        submission_mode,
        rubric_snapshot,
        created_by
      )
      VALUES (
        p_target_id,
        v_asg.title,
        v_asg.description,
        v_asg.due_at + (p_date_shift_days || ' days')::interval,
        v_asg.close_at + (p_date_shift_days || ' days')::interval,
        CASE WHEN v_asg.release_at IS NOT NULL THEN v_asg.release_at + (p_date_shift_days || ' days')::interval ELSE NULL END,
        v_asg.max_score,
        v_asg.late_policy,
        v_asg.late_penalty_value,
        v_asg.late_penalty_cap,
        v_asg.allow_resubmit,
        v_asg.max_resubmits,
        v_asg.submission_mode,
        v_asg.rubric_snapshot,
        v_caller
      )
      RETURNING id INTO v_new_asg_id;

      -- Salin CPMK map tugas jika dipilih
      IF v_copy_cpmk THEN
        INSERT INTO public.assessment_cpmk_map (
          class_id,
          assessment_type,
          assessment_id,
          cpmk_id,
          weight_percent
        )
        SELECT
          p_target_id,
          'assignment',
          v_new_asg_id,
          cpmk_id,
          weight_percent
        FROM public.assessment_cpmk_map
        WHERE class_id = p_source_id AND assessment_type = 'assignment' AND assessment_id = v_asg.id
        ON CONFLICT DO NOTHING;
      END IF;

      v_count_assignments := v_count_assignments + 1;
    END LOOP;
  END IF;

  UPDATE public.clone_jobs SET progress = 80 WHERE id = v_job_id;

  -- 5. Salin Ujian & Kuis (status DRAFT, tanggal bergeser)
  IF v_copy_quizzes THEN
    FOR v_quiz IN
      SELECT * FROM public.quizzes WHERE class_id = p_source_id
    LOOP
      INSERT INTO public.quizzes (
        class_id,
        title,
        description,
        exam_type,
        duration_minutes,
        kkm,
        proctoring_level,
        due_at,
        created_by
      )
      VALUES (
        p_target_id,
        v_quiz.title,
        v_quiz.description,
        v_quiz.exam_type,
        v_quiz.duration_minutes,
        v_quiz.kkm,
        v_quiz.proctoring_level,
        v_quiz.due_at + (p_date_shift_days || ' days')::interval,
        v_caller
      )
      RETURNING id INTO v_new_quiz_id;

      -- Salin butir soal kuis
      FOR v_q IN
        SELECT * FROM public.quiz_questions WHERE quiz_id = v_quiz.id
      LOOP
        INSERT INTO public.quiz_questions (
          quiz_id,
          question_text,
          question_type,
          points,
          order_index,
          topic_tag,
          cpl_tag,
          difficulty,
          rubric,
          starter_code,
          programming_language,
          explanation,
          metadata
        )
        VALUES (
          v_new_quiz_id,
          v_q.question_text,
          v_q.question_type,
          v_q.points,
          v_q.order_index,
          v_q.topic_tag,
          v_q.cpl_tag,
          v_q.difficulty,
          v_q.rubric,
          v_q.starter_code,
          v_q.programming_language,
          v_q.explanation,
          v_q.metadata
        )
        RETURNING id INTO v_new_q_id;

        -- Salin opsi
        FOR v_opt IN
          SELECT * FROM public.quiz_options WHERE question_id = v_q.id
        LOOP
          INSERT INTO public.quiz_options (
            question_id,
            option_text,
            order_index
          )
          VALUES (
            v_new_q_id,
            v_opt.option_text,
            v_opt.order_index
          );
        END LOOP;

        -- Salin kunci jawaban jika ada
        INSERT INTO public.quiz_question_keys (
          question_id,
          correct_option_id,
          correct_data,
          explanation
        )
        SELECT
          v_new_q_id,
          NULL, -- option mapping disesuaikan lewat data
          correct_data,
          explanation
        FROM public.quiz_question_keys
        WHERE question_id = v_q.id;
      END LOOP;

      v_count_quizzes := v_count_quizzes + 1;
    END LOOP;
  END IF;

  -- Perbarui status clone_jobs menjadi selesai
  UPDATE public.clone_jobs
  SET
    status = 'selesai',
    progress = 100,
    result_summary = jsonb_build_object(
      'materials_copied', v_count_materials,
      'assignments_copied', v_count_assignments,
      'quizzes_copied', v_count_quizzes,
      'assistants_copied', v_count_assistants
    ),
    updated_at = now()
  WHERE id = v_job_id;

  -- Catat ke log audit
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_caller,
    'SALIN_KELAS',
    'classes',
    p_target_id,
    jsonb_build_object(
      'source_class_id', p_source_id,
      'target_class_id', p_target_id,
      'date_shift_days', p_date_shift_days,
      'counts', jsonb_build_object(
        'materials', v_count_materials,
        'assignments', v_count_assignments,
        'quizzes', v_count_quizzes
      )
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'job_id', v_job_id,
    'pesan', 'Kelas berhasil disalin.',
    'summary', jsonb_build_object(
      'materials', v_count_materials,
      'assignments', v_count_assignments,
      'quizzes', v_count_quizzes,
      'assistants', v_count_assistants
    )
  );
EXCEPTION WHEN OTHERS THEN
  IF v_job_id IS NOT NULL THEN
    UPDATE public.clone_jobs
    SET status = 'gagal', error = SQLERRM, updated_at = now()
    WHERE id = v_job_id;
  END IF;
  RETURN jsonb_build_object('ok', false, 'pesan', 'Gagal menyalin kelas: ' || SQLERRM);
END;
$$;
