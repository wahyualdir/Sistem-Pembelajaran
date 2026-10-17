-- Migration: 20261017000024_phase2_assignments_grades.sql
-- Fase 2: Tugas dan Nilai (Aturan Keterlambatan, Tugas Kelompok, Rubrik, dan Sanggahan Nilai)
-- Mengacu pada Dokumen Instruksi Antigravity Versi 2 (Bagian 9.1 - 9.4)

-- Rollback:
-- DROP TABLE IF EXISTS public.grade_dispute_messages CASCADE;
-- DROP TABLE IF EXISTS public.grade_disputes CASCADE;
-- DROP TABLE IF EXISTS public.feedback_comments CASCADE;
-- DROP TABLE IF EXISTS public.rubric_scores CASCADE;
-- DROP TABLE IF EXISTS public.rubric_levels CASCADE;
-- DROP TABLE IF EXISTS public.rubric_criteria CASCADE;
-- DROP TABLE IF EXISTS public.rubrics CASCADE;
-- DROP TABLE IF EXISTS public.submission_member_adjustments CASCADE;
-- DROP TABLE IF EXISTS public.group_members CASCADE;
-- DROP TABLE IF EXISTS public.groups CASCADE;
-- DROP TABLE IF EXISTS public.group_sets CASCADE;
-- DROP TABLE IF EXISTS public.submission_versions CASCADE;
-- DROP TABLE IF EXISTS public.assignment_extensions CASCADE;
-- ALTER TABLE public.submissions DROP COLUMN IF EXISTS group_id, DROP COLUMN IF EXISTS submitted_by, DROP COLUMN IF EXISTS attempt_no, DROP COLUMN IF EXISTS late_minutes, DROP COLUMN IF EXISTS raw_score, DROP COLUMN IF EXISTS penalty_percent, DROP COLUMN IF EXISTS penalty_waived, DROP COLUMN IF EXISTS penalty_waived_reason;
-- ALTER TABLE public.assignments DROP COLUMN IF EXISTS late_policy, DROP COLUMN IF EXISTS late_penalty_value, DROP COLUMN IF EXISTS late_penalty_cap, DROP COLUMN IF EXISTS allow_resubmit, DROP COLUMN IF EXISTS max_resubmits, DROP COLUMN IF EXISTS submission_mode, DROP COLUMN IF EXISTS group_set_id, DROP COLUMN IF EXISTS rubric_snapshot;
-- DROP FUNCTION IF EXISTS public.calc_late_penalty;
-- DROP FUNCTION IF EXISTS public.join_group_with_code;
-- DROP FUNCTION IF EXISTS public.leave_group;

-- ============================================================================
-- 1. FUNGSI PERHITUNGAN PENALTI KETERLAMBATAN (calc_late_penalty)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calc_late_penalty(
  p_late_minutes INT,
  p_late_policy TEXT,
  p_late_penalty_value NUMERIC,
  p_late_penalty_cap NUMERIC
) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_units NUMERIC := 0;
  v_penalty NUMERIC := 0;
BEGIN
  IF p_late_minutes IS NULL OR p_late_minutes <= 0 OR p_late_policy IS NULL OR p_late_policy = 'none' OR p_late_penalty_value <= 0 THEN
    RETURN 0;
  END IF;

  IF p_late_policy = 'per_day' THEN
    v_units := ceil(p_late_minutes::numeric / 1440.0);
  ELSIF p_late_policy = 'per_hour' THEN
    v_units := ceil(p_late_minutes::numeric / 60.0);
  ELSIF p_late_policy = 'flat' THEN
    v_units := 1;
  ELSE
    RETURN 0;
  END IF;

  v_penalty := v_units * p_late_penalty_value;
  IF v_penalty > p_late_penalty_cap THEN
    v_penalty := p_late_penalty_cap;
  END IF;

  RETURN v_penalty;
END;
$$;

-- ============================================================================
-- 2. PERLUASAN TABEL ASSIGNMENTS
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'late_policy') THEN
    ALTER TABLE public.assignments
      ADD COLUMN late_policy TEXT NOT NULL DEFAULT 'none' CHECK (late_policy IN ('none', 'per_day', 'per_hour', 'flat')),
      ADD COLUMN late_penalty_value NUMERIC(5,2) NOT NULL DEFAULT 0,
      ADD COLUMN late_penalty_cap NUMERIC(5,2) NOT NULL DEFAULT 100,
      ADD COLUMN allow_resubmit BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN max_resubmits INT,
      ADD COLUMN submission_mode TEXT NOT NULL DEFAULT 'individual' CHECK (submission_mode IN ('individual', 'group')),
      ADD COLUMN group_set_id UUID,
      ADD COLUMN rubric_snapshot JSONB;
  END IF;
END $$;

-- ============================================================================
-- 3. PERPANJANGAN TENGGAT TUGAS (assignment_extensions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assignment_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id),
  group_id UUID,
  new_due_at TIMESTAMPTZ NOT NULL,
  new_close_at TIMESTAMPTZ,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 5),
  granted_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_extension_target CHECK ((student_id IS NOT NULL)::int + (group_id IS NOT NULL)::int = 1)
);

CREATE INDEX IF NOT EXISTS idx_extensions_assignment ON public.assignment_extensions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_extensions_student ON public.assignment_extensions(student_id);
CREATE INDEX IF NOT EXISTS idx_extensions_group ON public.assignment_extensions(group_id);

ALTER TABLE public.assignment_extensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS extension_select ON public.assignment_extensions;
CREATE POLICY extension_select ON public.assignment_extensions
FOR SELECT TO authenticated
USING (
  student_id = (SELECT auth.uid()) OR
  public.is_class_staff(public.assignment_class(assignment_id))
);

DROP POLICY IF EXISTS extension_all_lecturer ON public.assignment_extensions;
CREATE POLICY extension_all_lecturer ON public.assignment_extensions
FOR ALL TO authenticated
USING (public.is_class_lecturer(public.assignment_class(assignment_id)))
WITH CHECK (public.is_class_lecturer(public.assignment_class(assignment_id)));

-- ============================================================================
-- 4. PERLUASAN TABEL SUBMISSIONS & SUBMISSION VERSIONS
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'late_minutes') THEN
    ALTER TABLE public.submissions
      ADD COLUMN late_minutes INT NOT NULL DEFAULT 0,
      ADD COLUMN raw_score NUMERIC(6,2),
      ADD COLUMN penalty_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
      ADD COLUMN penalty_waived BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN penalty_waived_reason TEXT,
      ADD COLUMN group_id UUID,
      ADD COLUMN submitted_by UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- Unique index pengumpulan per kelompok (satu pengumpulan per kelompok per tugas)
CREATE UNIQUE INDEX IF NOT EXISTS uq_submissions_group
ON public.submissions (assignment_id, group_id)
WHERE group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.submission_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  attempt_no INT NOT NULL,
  file_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_sub_version_attempt UNIQUE (submission_id, attempt_no)
);

CREATE INDEX IF NOT EXISTS idx_submission_versions_sub ON public.submission_versions(submission_id);
ALTER TABLE public.submission_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS submission_versions_select ON public.submission_versions;
CREATE POLICY submission_versions_select ON public.submission_versions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND (s.student_id = (SELECT auth.uid()) OR s.submitted_by = (SELECT auth.uid()) OR public.is_class_staff(public.assignment_class(s.assignment_id)))
  )
);

DROP POLICY IF EXISTS submission_versions_insert ON public.submission_versions;
CREATE POLICY submission_versions_insert ON public.submission_versions
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND (s.student_id = (SELECT auth.uid()) OR s.submitted_by = (SELECT auth.uid()))
  )
);

-- ============================================================================
-- 5. TUGAS KELOMPOK (group_sets, groups, group_members, adjustments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.group_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  formation TEXT NOT NULL CHECK (formation IN ('lecturer', 'random', 'self')),
  min_size INT NOT NULL DEFAULT 2,
  max_size INT NOT NULL DEFAULT 5,
  lock_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_group_set_class_name UNIQUE (class_id, name)
);

CREATE INDEX IF NOT EXISTS idx_group_sets_class ON public.group_sets(class_id);
ALTER TABLE public.group_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_sets_select ON public.group_sets;
CREATE POLICY group_sets_select ON public.group_sets
FOR SELECT TO authenticated
USING (public.is_enrolled(class_id) OR public.is_class_staff(class_id));

DROP POLICY IF EXISTS group_sets_lecturer ON public.group_sets;
CREATE POLICY group_sets_lecturer ON public.group_sets
FOR ALL TO authenticated
USING (public.is_class_lecturer(class_id))
WITH CHECK (public.is_class_lecturer(class_id));

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES public.group_sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_code TEXT NOT NULL,
  CONSTRAINT uq_group_set_name UNIQUE (set_id, name),
  CONSTRAINT uq_group_set_code UNIQUE (set_id, join_code)
);

CREATE INDEX IF NOT EXISTS idx_groups_set ON public.groups(set_id);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS groups_select ON public.groups;
CREATE POLICY groups_select ON public.groups
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_sets gs
    WHERE gs.id = set_id
      AND (public.is_enrolled(gs.class_id) OR public.is_class_staff(gs.class_id))
  )
);

DROP POLICY IF EXISTS groups_lecturer ON public.groups;
CREATE POLICY groups_lecturer ON public.groups
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_sets gs
    WHERE gs.id = set_id AND public.is_class_lecturer(gs.class_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_sets gs
    WHERE gs.id = set_id AND public.is_class_lecturer(gs.class_id)
  )
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES public.group_sets(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, student_id),
  CONSTRAINT uq_group_member_set_student UNIQUE (set_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_student ON public.group_members(student_id);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_members_select ON public.group_members;
CREATE POLICY group_members_select ON public.group_members
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_sets gs
    WHERE gs.id = set_id
      AND (public.is_enrolled(gs.class_id) OR public.is_class_staff(gs.class_id))
  )
);

DROP POLICY IF EXISTS group_members_lecturer ON public.group_members;
CREATE POLICY group_members_lecturer ON public.group_members
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_sets gs
    WHERE gs.id = set_id AND public.is_class_lecturer(gs.class_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_sets gs
    WHERE gs.id = set_id AND public.is_class_lecturer(gs.class_id)
  )
);

CREATE TABLE IF NOT EXISTS public.submission_member_adjustments (
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  contribution_percent NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (contribution_percent BETWEEN 0 AND 100),
  note TEXT,
  PRIMARY KEY (submission_id, student_id)
);

ALTER TABLE public.submission_member_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS adjustments_select ON public.submission_member_adjustments;
CREATE POLICY adjustments_select ON public.submission_member_adjustments
FOR SELECT TO authenticated
USING (
  student_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND public.is_class_staff(public.assignment_class(s.assignment_id))
  )
);

DROP POLICY IF EXISTS adjustments_lecturer ON public.submission_member_adjustments;
CREATE POLICY adjustments_lecturer ON public.submission_member_adjustments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND public.is_class_lecturer(public.assignment_class(s.assignment_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND public.is_class_lecturer(public.assignment_class(s.assignment_id))
  )
);

-- RPC: Mahasiswa bergabung kelompok dengan penguncian baris (mencegah balapan max_size)
CREATE OR REPLACE FUNCTION public.join_group_with_code(
  p_set_id UUID,
  p_join_code TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_set public.group_sets;
  v_group public.groups;
  v_member_count INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  -- 1. Ambil dan kunci set kelompok
  SELECT * INTO v_set FROM public.group_sets WHERE id = p_set_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GROUP_SET_NOT_FOUND';
  END IF;

  -- Cek batas waktu penguncian
  IF v_set.lock_at IS NOT NULL AND now() > v_set.lock_at THEN
    RAISE EXCEPTION 'GROUP_FORMATION_LOCKED: Pembentukan kelompok telah dikunci.';
  END IF;

  -- Pastikan mahasiswa terdaftar di kelas
  IF NOT public.is_enrolled(v_set.class_id) THEN
    RAISE EXCEPTION 'NOT_ENROLLED: Anda bukan peserta kelas ini.';
  END IF;

  -- 2. Ambil dan kunci baris grup berdasarkan join_code
  SELECT * INTO v_group
  FROM public.groups
  WHERE set_id = p_set_id AND upper(trim(join_code)) = upper(trim(p_join_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_JOIN_CODE: Kode kelompok tidak ditemukan.';
  END IF;

  -- 3. Hitung jumlah anggota saat ini
  SELECT count(*) INTO v_member_count
  FROM public.group_members
  WHERE group_id = v_group.id;

  IF v_member_count >= v_set.max_size THEN
    RAISE EXCEPTION 'GROUP_FULL: Kelompok ini sudah mencapai kapasitas maksimal (% orang).', v_set.max_size;
  END IF;

  -- 4. Masukkan mahasiswa ke kelompok (otomatis dicegah duplikasi set oleh uq_group_member_set_student)
  INSERT INTO public.group_members (group_id, set_id, student_id, role)
  VALUES (v_group.id, p_set_id, v_uid, 'member');

  RETURN v_group.id;
END;
$$;

-- RPC: Mahasiswa keluar dari kelompok sebelum dikunci
CREATE OR REPLACE FUNCTION public.leave_group(
  p_group_id UUID
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_group public.groups;
  v_set public.group_sets;
  v_role TEXT;
  v_new_leader UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT * INTO v_group FROM public.groups WHERE id = p_group_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'GROUP_NOT_FOUND'; END IF;

  SELECT * INTO v_set FROM public.group_sets WHERE id = v_group.set_id;
  IF v_set.lock_at IS NOT NULL AND now() > v_set.lock_at THEN
    RAISE EXCEPTION 'GROUP_FORMATION_LOCKED: Pembentukan kelompok telah dikunci.';
  END IF;

  SELECT role INTO v_role FROM public.group_members WHERE group_id = p_group_id AND student_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_A_MEMBER'; END IF;

  -- Hapus anggota
  DELETE FROM public.group_members WHERE group_id = p_group_id AND student_id = v_uid;

  -- Jika ketua keluar, serahkan jabatan ke anggota tertua
  IF v_role = 'leader' THEN
    SELECT student_id INTO v_new_leader
    FROM public.group_members
    WHERE group_id = p_group_id
    ORDER BY joined_at ASC
    LIMIT 1;

    IF v_new_leader IS NOT NULL THEN
      UPDATE public.group_members SET role = 'leader' WHERE group_id = p_group_id AND student_id = v_new_leader;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- ============================================================================
-- 6. RUBRIK DAN UMPAN BALIK (rubrics, rubric_criteria, rubric_levels, rubric_scores, feedback_comments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL CHECK (char_length(title) >= 3),
  description TEXT,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rubrics_select ON public.rubrics;
CREATE POLICY rubrics_select ON public.rubrics
FOR SELECT TO authenticated
USING (owner_id = (SELECT auth.uid()) OR is_template = true);

DROP POLICY IF EXISTS rubrics_owner ON public.rubrics;
CREATE POLICY rubrics_owner ON public.rubrics
FOR ALL TO authenticated
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  position INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  max_points NUMERIC(6,2) NOT NULL CHECK (max_points > 0)
);

CREATE INDEX IF NOT EXISTS idx_rubric_criteria_rubric ON public.rubric_criteria(rubric_id);
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rubric_criteria_select ON public.rubric_criteria;
CREATE POLICY rubric_criteria_select ON public.rubric_criteria
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rubrics r
    WHERE r.id = rubric_id AND (r.owner_id = (SELECT auth.uid()) OR r.is_template = true)
  )
);

DROP POLICY IF EXISTS rubric_criteria_owner ON public.rubric_criteria;
CREATE POLICY rubric_criteria_owner ON public.rubric_criteria
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rubrics r
    WHERE r.id = rubric_id AND r.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rubrics r
    WHERE r.id = rubric_id AND r.owner_id = (SELECT auth.uid())
  )
);

CREATE TABLE IF NOT EXISTS public.rubric_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID NOT NULL REFERENCES public.rubric_criteria(id) ON DELETE CASCADE,
  position INT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  points NUMERIC(6,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rubric_levels_crit ON public.rubric_levels(criterion_id);
ALTER TABLE public.rubric_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rubric_levels_select ON public.rubric_levels;
CREATE POLICY rubric_levels_select ON public.rubric_levels
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rubric_criteria rc
    JOIN public.rubrics r ON r.id = rc.rubric_id
    WHERE rc.id = criterion_id AND (r.owner_id = (SELECT auth.uid()) OR r.is_template = true)
  )
);

DROP POLICY IF EXISTS rubric_levels_owner ON public.rubric_levels;
CREATE POLICY rubric_levels_owner ON public.rubric_levels
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rubric_criteria rc
    JOIN public.rubrics r ON r.id = rc.rubric_id
    WHERE rc.id = criterion_id AND r.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rubric_criteria rc
    JOIN public.rubrics r ON r.id = rc.rubric_id
    WHERE rc.id = criterion_id AND r.owner_id = (SELECT auth.uid())
  )
);

CREATE TABLE IF NOT EXISTS public.rubric_scores (
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL,
  level_label TEXT,
  points NUMERIC(6,2) NOT NULL,
  comment TEXT,
  graded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (submission_id, criterion_id)
);

ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;

-- Mahasiswa hanya melihat skor rubrik jika nilai sudah dipublikasikan
DROP POLICY IF EXISTS rubric_scores_select ON public.rubric_scores;
CREATE POLICY rubric_scores_select ON public.rubric_scores
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND (
        public.is_class_staff(public.assignment_class(s.assignment_id))
        OR (
          (s.student_id = (SELECT auth.uid()) OR s.submitted_by = (SELECT auth.uid()))
          AND s.status IN ('GRADED', 'RETURNED')
        )
      )
  )
);

DROP POLICY IF EXISTS rubric_scores_staff ON public.rubric_scores;
CREATE POLICY rubric_scores_staff ON public.rubric_scores
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND public.is_class_staff(public.assignment_class(s.assignment_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND public.is_class_staff(public.assignment_class(s.assignment_id))
  )
);

CREATE TABLE IF NOT EXISTS public.feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  file_path TEXT,
  anchor JSONB,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_sub ON public.feedback_comments(submission_id);
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_comments_select ON public.feedback_comments;
CREATE POLICY feedback_comments_select ON public.feedback_comments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id
      AND (
        public.is_class_staff(public.assignment_class(s.assignment_id))
        OR (
          (s.student_id = (SELECT auth.uid()) OR s.submitted_by = (SELECT auth.uid()))
          AND s.status IN ('GRADED', 'RETURNED')
        )
      )
  )
);

DROP POLICY IF EXISTS feedback_comments_author ON public.feedback_comments;
CREATE POLICY feedback_comments_author ON public.feedback_comments
FOR ALL TO authenticated
USING (author_id = (SELECT auth.uid()) OR EXISTS (
  SELECT 1 FROM public.submissions s
  WHERE s.id = submission_id AND public.is_class_lecturer(public.assignment_class(s.assignment_id))
))
WITH CHECK (author_id = (SELECT auth.uid()));

-- ============================================================================
-- 7. SANGGAH NILAI OLEH MAHASISWA (grade_disputes & grade_dispute_messages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grade_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('submission', 'exam_attempt', 'exam_question', 'attendance')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 30),
  evidence_path TEXT,
  status TEXT NOT NULL DEFAULT 'diajukan' CHECK (status IN ('diajukan', 'ditinjau', 'diterima', 'ditolak', 'ditarik')),
  response TEXT,
  old_score NUMERIC(6,2),
  new_score NUMERIC(6,2),
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  linked_change_request_id UUID REFERENCES public.grade_change_requests(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_grade_disputes_active
ON public.grade_disputes (student_id, target_type, target_id)
WHERE status IN ('diajukan', 'ditinjau');

CREATE INDEX IF NOT EXISTS idx_grade_disputes_class ON public.grade_disputes(class_id);
CREATE INDEX IF NOT EXISTS idx_grade_disputes_student ON public.grade_disputes(student_id);

ALTER TABLE public.grade_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS disputes_select ON public.grade_disputes;
CREATE POLICY disputes_select ON public.grade_disputes
FOR SELECT TO authenticated
USING (
  student_id = (SELECT auth.uid()) OR
  public.is_class_lecturer(class_id)
);

DROP POLICY IF EXISTS disputes_insert_student ON public.grade_disputes;
CREATE POLICY disputes_insert_student ON public.grade_disputes
FOR INSERT TO authenticated
WITH CHECK (
  student_id = (SELECT auth.uid()) AND public.is_enrolled(class_id)
);

DROP POLICY IF EXISTS disputes_update ON public.grade_disputes;
CREATE POLICY disputes_update ON public.grade_disputes
FOR UPDATE TO authenticated
USING (
  (student_id = (SELECT auth.uid()) AND status = 'diajukan') OR
  public.is_class_lecturer(class_id)
)
WITH CHECK (
  (student_id = (SELECT auth.uid()) AND status IN ('diajukan', 'ditarik')) OR
  public.is_class_lecturer(class_id)
);

CREATE TABLE IF NOT EXISTS public.grade_dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.grade_disputes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL CHECK (char_length(body) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_disp ON public.grade_dispute_messages(dispute_id);
ALTER TABLE public.grade_dispute_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dispute_messages_select ON public.grade_dispute_messages;
CREATE POLICY dispute_messages_select ON public.grade_dispute_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.grade_disputes gd
    WHERE gd.id = dispute_id
      AND (gd.student_id = (SELECT auth.uid()) OR public.is_class_lecturer(gd.class_id))
  )
);

DROP POLICY IF EXISTS dispute_messages_insert ON public.grade_dispute_messages;
CREATE POLICY dispute_messages_insert ON public.grade_dispute_messages
FOR INSERT TO authenticated
WITH CHECK (
  author_id = (SELECT auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.grade_disputes gd
    WHERE gd.id = dispute_id
      AND (gd.student_id = (SELECT auth.uid()) OR public.is_class_lecturer(gd.class_id))
  )
);
