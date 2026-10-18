-- ============================================================================
-- SIAJAR Migration: 20261018000029_peta_pulau_p0_foundation.sql
-- Fitur: Peta Pulau (Fase P0 Fondasi, Bab, Log Aktivitas & Kebijakan)
-- Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md (Bagian 6.2 - 6.6, 7.1, Lampiran A, B, D)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. TABEL CLASS_FEATURE_FLAGS (Bagian 6.2)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_feature_flags (
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    feature TEXT NOT NULL CHECK (feature IN ('peta_pulau', 'flashcard', 'podcast', 'tukar_keahlian', 'rekap_semester')),
    enabled BOOLEAN NOT NULL DEFAULT false,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (class_id, feature)
);

CREATE INDEX IF NOT EXISTS idx_class_feature_flags_class ON public.class_feature_flags(class_id);

ALTER TABLE public.class_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_feature_flags_select ON public.class_feature_flags;
CREATE POLICY class_feature_flags_select ON public.class_feature_flags
FOR SELECT TO authenticated
USING (
    public.is_enrolled(class_id)
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
    OR public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS class_feature_flags_write ON public.class_feature_flags;
CREATE POLICY class_feature_flags_write ON public.class_feature_flags
FOR ALL TO authenticated
USING (
    public.is_class_lecturer(class_id)
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    public.is_class_lecturer(class_id)
    OR public.has_global_role('SUPER_ADMIN')
);

-- ----------------------------------------------------------------------------
-- 2. TABEL CLASS_CHAPTERS, TOPICS, PROGRESS & OVERRIDES (Bagian 7.1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    position INT NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
    summary TEXT,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    pass_score NUMERIC(5,2) CHECK (pass_score BETWEEN 0 AND 100),
    target_date DATE,
    completion_rule TEXT NOT NULL DEFAULT 'kuis' CHECK (completion_rule IN ('kuis', 'materi')),
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_class_chapter_position UNIQUE (class_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_class_chapters_class_pos ON public.class_chapters(class_id, position);

ALTER TABLE public.class_chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_chapters_select ON public.class_chapters;
CREATE POLICY class_chapters_select ON public.class_chapters
FOR SELECT TO authenticated
USING (
    public.is_enrolled(class_id)
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
    OR public.has_global_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS class_chapters_write ON public.class_chapters;
CREATE POLICY class_chapters_write ON public.class_chapters
FOR ALL TO authenticated
USING (
    public.is_class_lecturer(class_id)
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    public.is_class_lecturer(class_id)
    OR public.has_global_role('SUPER_ADMIN')
);

CREATE TABLE IF NOT EXISTS public.chapter_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.class_chapters(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
    CONSTRAINT uq_chapter_topic_name UNIQUE (chapter_id, name)
);

CREATE INDEX IF NOT EXISTS idx_chapter_topics_chapter ON public.chapter_topics(chapter_id);

ALTER TABLE public.chapter_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chapter_topics_select ON public.chapter_topics;
CREATE POLICY chapter_topics_select ON public.chapter_topics
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS chapter_topics_write ON public.chapter_topics;
CREATE POLICY chapter_topics_write ON public.chapter_topics
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_topics.chapter_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_topics.chapter_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
);

CREATE TABLE IF NOT EXISTS public.chapter_progress (
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.class_chapters(id) ON DELETE CASCADE,
    best_score NUMERIC(5,2),
    attempts INT NOT NULL DEFAULT 0,
    passed_at TIMESTAMPTZ,
    materials_done_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_progress_student ON public.chapter_progress(student_id);

ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chapter_progress_select ON public.chapter_progress;
CREATE POLICY chapter_progress_select ON public.chapter_progress
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_progress.chapter_id
          AND (public.is_class_staff(c.class_id) OR public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR') OR public.has_global_role('SUPER_ADMIN'))
    )
);

DROP POLICY IF EXISTS chapter_progress_write ON public.chapter_progress;
CREATE POLICY chapter_progress_write ON public.chapter_progress
FOR ALL TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_progress.chapter_id
          AND (public.is_class_staff(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
)
WITH CHECK (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_progress.chapter_id
          AND (public.is_class_staff(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
);

CREATE TABLE IF NOT EXISTS public.chapter_unlock_overrides (
    chapter_id UUID NOT NULL REFERENCES public.class_chapters(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES public.profiles(id),
    reason TEXT NOT NULL CHECK (char_length(reason) >= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chapter_id, student_id)
);

ALTER TABLE public.chapter_unlock_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chapter_unlock_overrides_select ON public.chapter_unlock_overrides;
CREATE POLICY chapter_unlock_overrides_select ON public.chapter_unlock_overrides
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_unlock_overrides.chapter_id
          AND (public.is_class_staff(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
);

DROP POLICY IF EXISTS chapter_unlock_overrides_write ON public.chapter_unlock_overrides;
CREATE POLICY chapter_unlock_overrides_write ON public.chapter_unlock_overrides
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_unlock_overrides.chapter_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_unlock_overrides.chapter_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
);

-- ----------------------------------------------------------------------------
-- 3. KOLOM PENAUT BAB PADA TABEL TERKAIT (Bagian 6.3)
-- ----------------------------------------------------------------------------
ALTER TABLE public.materials
    ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.class_chapters(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_materials_chapter ON public.materials(chapter_id);

ALTER TABLE public.quizzes
    ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.class_chapters(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS peer_help_blocked BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_quizzes_chapter ON public.quizzes(chapter_id);

-- Perluas constraint kind pada quizzes untuk mendukung 'kuis_bab'
ALTER TABLE public.quizzes DROP CONSTRAINT IF EXISTS quizzes_kind_check;
ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_kind_check
    CHECK (kind IN ('utama', 'susulan', 'remedial', 'kuis_bab'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_quizzes_one_quiz_per_chapter
    ON public.quizzes (chapter_id)
    WHERE kind = 'kuis_bab';

ALTER TABLE public.assignments
    ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.class_chapters(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_chapter ON public.assignments(chapter_id);

ALTER TABLE public.quiz_questions
    ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.chapter_topics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic ON public.quiz_questions(topic_id);

ALTER TABLE public.class_assistants
    ADD COLUMN IF NOT EXISTS can_prepare_content BOOLEAN NOT NULL DEFAULT false;

-- ----------------------------------------------------------------------------
-- 4. LOG AKTIVITAS & PREFERENSI PRIVASI (Bagian 6.4 & Lampiran D)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_event_kinds (
    kind TEXT PRIMARY KEY,
    allowed_meta_keys TEXT[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.activity_event_kinds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_event_kinds_select ON public.activity_event_kinds;
CREATE POLICY activity_event_kinds_select ON public.activity_event_kinds
FOR SELECT TO authenticated
USING (true);

INSERT INTO public.activity_event_kinds (kind, allowed_meta_keys) VALUES
    ('materi_dibuka', '{}'),
    ('podcast_diputar', '{}'),
    ('podcast_selesai', '{}'),
    ('kartu_direview', ARRAY['jumlah', 'ingat', 'ragu', 'lupa']),
    ('kuis_selesai', ARRAY['skor', 'lulus', 'durasi_detik']),
    ('pulau_selesai', '{}'),
    ('tugas_dikumpulkan', ARRAY['tepat_waktu']),
    ('bantuan_diminta', '{}'),
    ('bantuan_diberikan', '{}'),
    ('bantuan_terbantu', '{}')
ON CONFLICT (kind) DO UPDATE SET allowed_meta_keys = EXCLUDED.allowed_meta_keys;

CREATE TABLE IF NOT EXISTS public.activity_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    kind TEXT NOT NULL REFERENCES public.activity_event_kinds(kind),
    ref_type TEXT,
    ref_id UUID,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_student_time ON public.activity_events(student_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_class_kind ON public.activity_events(class_id, kind, occurred_at DESC);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- KEBIJAKAN PRIVASI KETAT:
-- Hanya pemilik (mahasiswa) yang dapat membaca baris miliknya.
-- Dosen, Asisten, Kaprodi, dan Admin TIDAK MEMILIKI AKSES SELECT langsung pada tabel ini.
-- Tidak ada kebijakan INSERT langsung: semua penulisan wajib melalui fungsi SECURITY DEFINER log_activity.
DROP POLICY IF EXISTS activity_events_select ON public.activity_events;
CREATE POLICY activity_events_select ON public.activity_events
FOR SELECT TO authenticated
USING (student_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.activity_logging_prefs (
    student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logging_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_logging_prefs_select ON public.activity_logging_prefs;
CREATE POLICY activity_logging_prefs_select ON public.activity_logging_prefs
FOR SELECT TO authenticated
USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS activity_logging_prefs_update ON public.activity_logging_prefs;
CREATE POLICY activity_logging_prefs_update ON public.activity_logging_prefs
FOR ALL TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

-- Tabel butir prioritas harian yang disembunyikan mahasiswa hari ini (7.5)
CREATE TABLE IF NOT EXISTS public.daily_priority_dismissals (
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    day DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, item_key, day)
);

ALTER TABLE public.daily_priority_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_priority_dismissals_access ON public.daily_priority_dismissals;
CREATE POLICY daily_priority_dismissals_access ON public.daily_priority_dismissals
FOR ALL TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. FUNGSI PEMBANTU: FEATURE_ENABLED & CHAPTER_STATE (Bagian 6.2 & 7.1)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.feature_enabled(p_class_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_global_key TEXT := 'feature_' || p_feature || '_enabled';
    v_global_policy JSONB;
    v_class_flag BOOLEAN;
BEGIN
    -- Cek sakelar global di institution_policies
    SELECT value INTO v_global_policy FROM public.institution_policies WHERE key = v_global_key;
    IF v_global_policy IS NOT NULL THEN
        IF (v_global_policy)::text = 'false' OR v_global_policy = 'false'::jsonb THEN
            RETURN false;
        END IF;
    END IF;

    -- Ketergantungan: flashcard, podcast, dan tukar_keahlian mensyaratkan peta_pulau aktif
    IF p_feature IN ('flashcard', 'podcast', 'tukar_keahlian') THEN
        IF NOT public.feature_enabled(p_class_id, 'peta_pulau') THEN
            RETURN false;
        END IF;
    END IF;

    -- Ambil sakelar per kelas
    SELECT enabled INTO v_class_flag
    FROM public.class_feature_flags
    WHERE class_id = p_class_id AND feature = p_feature;

    RETURN COALESCE(v_class_flag, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.chapter_state(p_student_id UUID, p_chapter_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_chap RECORD;
    v_prog RECORD;
    v_prev RECORD;
BEGIN
    SELECT * INTO v_chap FROM public.class_chapters WHERE id = p_chapter_id;
    IF NOT FOUND THEN
        RETURN 'terkunci';
    END IF;

    -- Jika bab diarsipkan, tidak berlaku
    IF v_chap.archived_at IS NOT NULL THEN
        RETURN 'terkunci';
    END IF;

    -- Ambil progres pengerjaan mahasiswa
    SELECT * INTO v_prog FROM public.chapter_progress
    WHERE student_id = p_student_id AND chapter_id = p_chapter_id;

    -- 1. Status SELESAI
    IF v_chap.completion_rule = 'kuis' AND v_prog.passed_at IS NOT NULL THEN
        RETURN 'selesai';
    END IF;
    IF v_chap.completion_rule = 'materi' AND v_prog.materials_done_at IS NOT NULL THEN
        RETURN 'selesai';
    END IF;

    -- 2. Status TERBUKA melalui Override manual Dosen
    IF EXISTS (
        SELECT 1 FROM public.chapter_unlock_overrides
        WHERE chapter_id = p_chapter_id AND student_id = p_student_id
    ) THEN
        RETURN 'terbuka';
    END IF;

    -- 3. Bab Pertama di kelas selalu Terbuka
    IF NOT EXISTS (
        SELECT 1 FROM public.class_chapters
        WHERE class_id = v_chap.class_id
          AND archived_at IS NULL
          AND position < v_chap.position
    ) THEN
        RETURN 'terbuka';
    END IF;

    -- 4. Prasyarat Linear: Semua bab wajib (bukan opsional, aktif) sebelumnya harus SELESAI
    FOR v_prev IN
        SELECT id, position FROM public.class_chapters
        WHERE class_id = v_chap.class_id
          AND archived_at IS NULL
          AND is_optional = false
          AND position < v_chap.position
        ORDER BY position ASC
    LOOP
        IF public.chapter_state(p_student_id, v_prev.id) <> 'selesai' THEN
            RETURN 'terkunci';
        END IF;
    END LOOP;

    RETURN 'terbuka';
END;
$$;

CREATE OR REPLACE FUNCTION public.chapter_unlocked(p_student_id UUID, p_chapter_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.chapter_state(p_student_id, p_chapter_id) <> 'terkunci';
$$;

-- ----------------------------------------------------------------------------
-- 6. PENEGAKAN AKSES DATABASE (RLS MATERI & KUIS KETIKA PETA PULAU AKTIF)
-- ----------------------------------------------------------------------------

-- Pembaruan RLS materials_select: bila fitur peta_pulau aktif di kelas dan materi ditautkan ke bab,
-- mahasiswa hanya dapat membaca jika chapter_state bukan 'terkunci'.
DROP POLICY IF EXISTS materials_select ON public.materials;
CREATE POLICY materials_select ON public.materials
FOR SELECT TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.has_global_role('SUPER_ADMIN')
    OR (
        status = 'PUBLISHED'
        AND public.is_enrolled(class_id)
        AND (release_at IS NULL OR release_at <= now())
        AND (
            chapter_id IS NULL
            OR NOT public.feature_enabled(class_id, 'peta_pulau')
            OR public.chapter_unlocked((SELECT auth.uid()), chapter_id)
        )
    )
);

-- Pembaruan RLS quizzes_select untuk kuis bab terkunci
DROP POLICY IF EXISTS quizzes_select ON public.quizzes;
CREATE POLICY quizzes_select ON public.quizzes
FOR SELECT TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
    OR public.has_global_role('SUPER_ADMIN')
    OR (
        public.is_enrolled(class_id)
        AND (release_at IS NULL OR release_at <= now())
        AND (
            chapter_id IS NULL
            OR NOT public.feature_enabled(class_id, 'peta_pulau')
            OR public.chapter_unlocked((SELECT auth.uid()), chapter_id)
        )
    )
);

-- ----------------------------------------------------------------------------
-- 7. FUNGSI LOG AKTIVITAS (SECURITY DEFINER) & AGREGAT PRIVASI (Bagian 6.4)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_activity(
    p_kind TEXT,
    p_class_id UUID DEFAULT NULL,
    p_ref_type TEXT DEFAULT NULL,
    p_ref_id UUID DEFAULT NULL,
    p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_enabled BOOLEAN;
    v_allowed_keys TEXT[];
    v_clean_meta JSONB := '{}'::jsonb;
    v_key TEXT;
    v_new_id BIGINT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: pengguna belum login';
    END IF;

    -- Cek preferensi mahasiswa
    SELECT enabled INTO v_enabled FROM public.activity_logging_prefs WHERE student_id = v_uid;
    IF v_enabled IS FALSE THEN
        RETURN NULL; -- Mahasiswa mematikan pencatatan aktivitas, keluar secara senyap
    END IF;

    -- Validasi jenis kejadian dari daftar putih
    SELECT allowed_meta_keys INTO v_allowed_keys
    FROM public.activity_event_kinds
    WHERE kind = p_kind;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Jenis kejadian aktivitas tidak sah atau di luar daftar putih: %', p_kind;
    END IF;

    -- Buang seluruh kunci meta yang tidak diizinkan
    IF p_meta IS NOT NULL AND jsonb_typeof(p_meta) = 'object' AND v_allowed_keys IS NOT NULL THEN
        FOR v_key IN SELECT jsonb_object_keys(p_meta)
        LOOP
            IF v_key = ANY(v_allowed_keys) THEN
                v_clean_meta := jsonb_set(v_clean_meta, ARRAY[v_key], p_meta->v_key);
            END IF;
        END LOOP;
    END IF;

    INSERT INTO public.activity_events (student_id, class_id, kind, ref_type, ref_id, meta)
    VALUES (v_uid, p_class_id, p_kind, p_ref_type, p_ref_id, v_clean_meta)
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- RPC untuk unduh data riwayat mahasiswa sendiri (Privasi)
CREATE OR REPLACE FUNCTION public.get_activity_log_download()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_res JSONB;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: pengguna belum login';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'kind', kind,
            'class_id', class_id,
            'ref_type', ref_type,
            'ref_id', ref_id,
            'meta', meta,
            'occurred_at', occurred_at
        ) ORDER BY occurred_at DESC
    ) INTO v_res
    FROM public.activity_events
    WHERE student_id = v_uid;

    RETURN COALESCE(v_res, '[]'::jsonb);
END;
$$;

-- RPC untuk hapus riwayat data aktivitas mahasiswa sendiri (Privasi)
CREATE OR REPLACE FUNCTION public.clear_my_activity_log()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_deleted_events INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: pengguna belum login';
    END IF;

    DELETE FROM public.activity_events WHERE student_id = v_uid;
    GET DIAGNOSTICS v_deleted_events = ROW_COUNT;

    RETURN jsonb_build_object('ok', true, 'deleted_count', v_deleted_events);
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. SEED KEBIJAKAN BARU (Lampiran A)
-- ----------------------------------------------------------------------------
INSERT INTO public.institution_policies (key, value, description) VALUES
    ('default_features_new_classes', '[]'::jsonb, 'Daftar fitur baru yang otomatis aktif untuk kelas baru.'),
    ('feature_peta_pulau_enabled', 'true'::jsonb, 'Sakelar global fitur Peta Pulau.'),
    ('feature_flashcard_enabled', 'true'::jsonb, 'Sakelar global fitur Flashcard Spaced Repetition.'),
    ('feature_podcast_enabled', 'false'::jsonb, 'Sakelar global fitur Podcast Bab (aktifkan setelah TTS dikonfigurasi).'),
    ('feature_tukar_keahlian_enabled', 'true'::jsonb, 'Sakelar global fitur Tukar Keahlian antarmahasiswa sekelas.'),
    ('feature_rekap_semester_enabled', 'true'::jsonb, 'Sakelar global fitur Rekap Semester reflektif.'),
    ('chapter_pass_score', '70'::jsonb, 'Ambang batas kelulusan default kuis bab untuk membuka pulau berikutnya.'),
    ('flashcard_new_per_day', '20'::jsonb, 'Batas kartu flashcard baru yang diperkenalkan per mahasiswa per hari lintas kelas.'),
    ('flashcard_reviews_per_day', '100'::jsonb, 'Batas kartu ulasan harian per mahasiswa.'),
    ('wrong_answer_cards_per_attempt', '10'::jsonb, 'Maksimal jumlah kartu dari jawaban salah per percobaan kuis bab.'),
    ('ai_content_daily_limit_per_class', '10'::jsonb, 'Batas maksimal pekerjaan pembuatan konten AI per kelas per hari.'),
    ('ai_content_max_source_chars', '40000'::jsonb, 'Batas maksimal karakter teks sumber materi per pekerjaan AI.'),
    ('tts_daily_char_limit_per_class', '30000'::jsonb, 'Batas karakter sintesis suara TTS per kelas per hari.'),
    ('activity_retention_days', '365'::jsonb, 'Masa retensi penyimpanan log aktivitas belajar (hari).'),
    ('min_aggregate_size', '5'::jsonb, 'Ambang batas agregat minimum untuk menyembunyikan identitas sel (< 5).'),
    ('recap_retention_months', '24'::jsonb, 'Masa retensi rekap semester (bulan).'),
    ('skill_open_requests_per_student_per_class', '3'::jsonb, 'Batas permintaan bantuan terbuka per mahasiswa per kelas.'),
    ('skill_request_expire_days', '14'::jsonb, 'Masa kedaluwarsa permintaan bantuan terbuka tanpa respons (hari).'),
    ('skill_xp_per_helpful', '5'::jsonb, 'Poin XP per bantuan yang ditandai terbantu.'),
    ('skill_xp_daily_cap', '3'::jsonb, 'Batas maksimal perolehan poin bantuan terbantu per pembantu per hari.'),
    ('skill_pair_weekly_cap', '2'::jsonb, 'Batas maksimal poin bantuan dari pemohon yang sama per minggu.')
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description;

COMMIT;
