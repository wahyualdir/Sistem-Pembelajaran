-- ============================================================================
-- SIAJAR Migration: 20261018000031_peta_pulau_tahap2_content.sql
-- Tahap 2: Konten Belajar (Flashcard Leitner, Tinjau AI, & Podcast Belajar)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM & TABEL DECK DAN FLASHCARD
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chapter_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.class_chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf', 'ditinjau', 'terbit', 'perlu_tinjau_ulang', 'ditarik')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chapter_decks_chapter ON public.chapter_decks(chapter_id);

ALTER TABLE public.chapter_decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chapter_decks_select ON public.chapter_decks;
CREATE POLICY chapter_decks_select ON public.chapter_decks
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_decks.chapter_id
          AND (
              public.is_class_lecturer(c.class_id)
              OR public.is_class_ta(c.class_id)
              OR public.has_global_role('SUPER_ADMIN')
              OR (
                  public.is_class_member(c.class_id)
                  AND public.chapter_decks.status = 'terbit'
                  AND public.chapter_unlocked((SELECT auth.uid()), c.id)
              )
          )
    )
);

DROP POLICY IF EXISTS chapter_decks_manage ON public.chapter_decks;
CREATE POLICY chapter_decks_manage ON public.chapter_decks
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_decks.chapter_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_decks.chapter_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
);

CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES public.chapter_decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    source_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    source_segment TEXT,
    grounding_score INT DEFAULT 100 CHECK (grounding_score BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf', 'ditinjau', 'terbit', 'perlu_tinjau_ulang', 'ditarik')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_status ON public.flashcards(status);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flashcards_select ON public.flashcards;
CREATE POLICY flashcards_select ON public.flashcards
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chapter_decks d
        JOIN public.class_chapters c ON c.id = d.chapter_id
        WHERE d.id = public.flashcards.deck_id
          AND (
              public.is_class_lecturer(c.class_id)
              OR public.is_class_ta(c.class_id)
              OR public.has_global_role('SUPER_ADMIN')
              OR (
                  public.is_class_member(c.class_id)
                  AND public.flashcards.status = 'terbit'
                  AND public.chapter_unlocked((SELECT auth.uid()), c.id)
              )
          )
    )
);

DROP POLICY IF EXISTS flashcards_manage ON public.flashcards;
CREATE POLICY flashcards_manage ON public.flashcards
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chapter_decks d
        JOIN public.class_chapters c ON c.id = d.chapter_id
        WHERE d.id = public.flashcards.deck_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chapter_decks d
        JOIN public.class_chapters c ON c.id = d.chapter_id
        WHERE d.id = public.flashcards.deck_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
);

-- ----------------------------------------------------------------------------
-- 2. PROGRESS LEITNER & RIWAYAT BELAJAR MAHASISWA
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    box INT NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    repetitions INT NOT NULL DEFAULT 0,
    last_rating INT CHECK (last_rating BETWEEN 1 AND 4),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, flashcard_id)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due ON public.flashcard_reviews(student_id, next_review_at);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flashcard_reviews_student_only ON public.flashcard_reviews;
CREATE POLICY flashcard_reviews_student_only ON public.flashcard_reviews
FOR ALL TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.flashcard_review_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    box_before INT NOT NULL,
    box_after INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 4),
    review_duration_ms INT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flashcard_review_log_student ON public.flashcard_review_log(student_id, reviewed_at);

ALTER TABLE public.flashcard_review_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flashcard_review_log_student_only ON public.flashcard_review_log;
CREATE POLICY flashcard_review_log_student_only ON public.flashcard_review_log
FOR ALL TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- 3. PERSETUJUAN KONTEN AI & ANTRIAN GENERASI KONTEN (TINJAU KONTEN)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_content_consents (
    lecturer_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    terms_version TEXT NOT NULL DEFAULT 'v1.0'
);

ALTER TABLE public.ai_content_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_content_consents_self ON public.ai_content_consents;
CREATE POLICY ai_content_consents_self ON public.ai_content_consents
FOR ALL TO authenticated
USING (lecturer_id = (SELECT auth.uid()))
WITH CHECK (lecturer_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.class_chapters(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('flashcard', 'podcast_script')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    model_used TEXT,
    input_material_ids UUID[],
    result_payload JSONB,
    error_message TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_class ON public.ai_generation_jobs(class_id);

ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_generation_jobs_access ON public.ai_generation_jobs;
CREATE POLICY ai_generation_jobs_access ON public.ai_generation_jobs
FOR ALL TO authenticated
USING (
    public.is_class_lecturer(class_id)
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    public.is_class_lecturer(class_id)
    OR public.has_global_role('SUPER_ADMIN')
);

CREATE TABLE IF NOT EXISTS public.content_review_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('flashcard', 'podcast_segment')),
    entity_id UUID NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'edit')),
    diff JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_review_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_review_events_access ON public.content_review_events;
CREATE POLICY content_review_events_access ON public.content_review_events
FOR ALL TO authenticated
USING (
    reviewer_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
);

-- ----------------------------------------------------------------------------
-- 4. PODCAST BELAJAR & PROGRESS AUDIO MAHASISWA
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chapter_podcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.class_chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    narrator TEXT NOT NULL DEFAULT 'Pak Dosen' CHECK (narrator IN ('Pak Dosen', 'Bu Dosen')),
    script_text TEXT NOT NULL,
    script_status TEXT NOT NULL DEFAULT 'draf' CHECK (script_status IN ('draf', 'ditinjau', 'disetujui', 'ditarik')),
    audio_url TEXT,
    audio_duration_seconds INT DEFAULT 0,
    transcription_segments JSONB,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chapter_podcasts_chapter ON public.chapter_podcasts(chapter_id);

ALTER TABLE public.chapter_podcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chapter_podcasts_select ON public.chapter_podcasts;
CREATE POLICY chapter_podcasts_select ON public.chapter_podcasts
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_podcasts.chapter_id
          AND (
              public.is_class_lecturer(c.class_id)
              OR public.is_class_ta(c.class_id)
              OR public.has_global_role('SUPER_ADMIN')
              OR (
                  public.is_class_member(c.class_id)
                  AND public.chapter_podcasts.script_status = 'disetujui'
                  AND public.chapter_unlocked((SELECT auth.uid()), c.id)
              )
          )
    )
);

DROP POLICY IF EXISTS chapter_podcasts_manage ON public.chapter_podcasts;
CREATE POLICY chapter_podcasts_manage ON public.chapter_podcasts
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_podcasts.chapter_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.class_chapters c
        WHERE c.id = public.chapter_podcasts.chapter_id
          AND (public.is_class_lecturer(c.class_id) OR public.has_global_role('SUPER_ADMIN'))
    )
);

CREATE TABLE IF NOT EXISTS public.podcast_progress (
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    podcast_id UUID NOT NULL REFERENCES public.chapter_podcasts(id) ON DELETE CASCADE,
    last_position_seconds INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, podcast_id)
);

ALTER TABLE public.podcast_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS podcast_progress_student_only ON public.podcast_progress;
CREATE POLICY podcast_progress_student_only ON public.podcast_progress
FOR ALL TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. RPC FUNGSI PENDUKUNG FLASHCARD & REVIEW
-- ----------------------------------------------------------------------------

-- RPC: Mencatat review kartu oleh mahasiswa dengan penegakan algoritma Leitner di DB
CREATE OR REPLACE FUNCTION public.submit_flashcard_review(
    p_flashcard_id UUID,
    p_rating INT,
    p_duration_ms INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_student_id UUID := (SELECT auth.uid());
    v_current_box INT := 1;
    v_new_box INT;
    v_next_days INT;
    v_next_review TIMESTAMPTZ;
    v_rep INT := 0;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum terautentikasi' USING ERRCODE = 'P0001';
    END IF;

    IF p_rating NOT BETWEEN 1 AND 4 THEN
        RAISE EXCEPTION 'Rating tidak valid (harus 1 sampai 4)' USING ERRCODE = 'P0001';
    END IF;

    -- Ambil status review saat ini jika ada
    SELECT box, repetitions INTO v_current_box, v_rep
    FROM public.flashcard_reviews
    WHERE student_id = v_student_id AND flashcard_id = p_flashcard_id;

    IF v_current_box IS NULL THEN
        v_current_box := 1;
        v_rep := 0;
    END IF;

    -- Transisi Leitner:
    -- Rating 1 (Gagal) -> Box 1
    -- Rating 2 (Sulit) -> Box tetap
    -- Rating 3 (Baik)  -> Box + 1 (max 5)
    -- Rating 4 (Mudah) -> Jika dari Box 1 langsung Box 3, selain itu Box + 1 (max 5)
    IF p_rating = 1 THEN
        v_new_box := 1;
    ELSIF p_rating = 2 THEN
        v_new_box := v_current_box;
    ELSIF p_rating = 3 THEN
        v_new_box := LEAST(5, v_current_box + 1);
    ELSE
        IF v_current_box = 1 THEN
            v_new_box := 3;
        ELSE
            v_new_box := LEAST(5, v_current_box + 1);
        END IF;
    END IF;

    -- Jeda interval: Kotak 1: +1h, 2: +2h, 3: +4h, 4: +8h, 5: +16h
    CASE v_new_box
        WHEN 1 THEN v_next_days := 1;
        WHEN 2 THEN v_next_days := 2;
        WHEN 3 THEN v_next_days := 4;
        WHEN 4 THEN v_next_days := 8;
        WHEN 5 THEN v_next_days := 16;
        ELSE v_next_days := 1;
    END CASE;

    v_next_review := now() + (v_next_days || ' days')::interval;

    -- Upsert review state
    INSERT INTO public.flashcard_reviews (
        student_id, flashcard_id, box, next_review_at, repetitions, last_rating, updated_at
    )
    VALUES (
        v_student_id, p_flashcard_id, v_new_box, v_next_review, v_rep + 1, p_rating, now()
    )
    ON CONFLICT (student_id, flashcard_id) DO UPDATE SET
        box = EXCLUDED.box,
        next_review_at = EXCLUDED.next_review_at,
        repetitions = EXCLUDED.repetitions,
        last_rating = EXCLUDED.last_rating,
        updated_at = now();

    -- Catat log review
    INSERT INTO public.flashcard_review_log (
        student_id, flashcard_id, box_before, box_after, rating, review_duration_ms, reviewed_at
    )
    VALUES (
        v_student_id, p_flashcard_id, v_current_box, v_new_box, p_rating, p_duration_ms, now()
    );

    RETURN jsonb_build_object(
        'flashcard_id', p_flashcard_id,
        'box_before', v_current_box,
        'box_after', v_new_box,
        'next_review_at', v_next_review
    );
END;
$$;

-- RPC: Mencatat progres podcast audio mahasiswa
CREATE OR REPLACE FUNCTION public.save_podcast_progress(
    p_podcast_id UUID,
    p_position_seconds INT,
    p_is_completed BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_student_id UUID := (SELECT auth.uid());
    v_completed_at TIMESTAMPTZ := NULL;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum terautentikasi' USING ERRCODE = 'P0001';
    END IF;

    IF p_is_completed THEN
        v_completed_at := now();
    END IF;

    INSERT INTO public.podcast_progress (
        student_id, podcast_id, last_position_seconds, is_completed, completed_at, updated_at
    )
    VALUES (
        v_student_id, p_podcast_id, p_position_seconds, p_is_completed, v_completed_at, now()
    )
    ON CONFLICT (student_id, podcast_id) DO UPDATE SET
        last_position_seconds = EXCLUDED.last_position_seconds,
        is_completed = CASE WHEN public.podcast_progress.is_completed THEN true ELSE EXCLUDED.is_completed END,
        completed_at = CASE WHEN public.podcast_progress.completed_at IS NOT NULL THEN public.podcast_progress.completed_at ELSE EXCLUDED.completed_at END,
        updated_at = now();

    -- Catat log aktivitas jika tuntas pertama kali
    IF p_is_completed THEN
        PERFORM public.log_activity(
            v_student_id,
            'podcast_selesai',
            jsonb_build_object('podcast_id', p_podcast_id)
        );
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;
