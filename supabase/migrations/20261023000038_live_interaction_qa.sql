-- Migrasi: Ruang Interaksi Kuliah (Tanya Jawab Langsung & Cek Pemahaman Materi)
-- Mengizinkan mahasiswa bertanya secara langsung selama kuliah (dengan opsi nama atau anonim),
-- memberikan dukungan (upvote) pada pertanyaan rekan, serta kontrol dosen (sematkan, bahas, jawab).

CREATE TABLE IF NOT EXISTS public.class_live_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    question TEXT NOT NULL,
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'antre' CHECK (status IN ('antre', 'dibahas', 'terjawab', 'diarsipkan')),
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    lecturer_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.class_live_question_upvotes (
    question_id UUID NOT NULL REFERENCES public.class_live_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_questions_class ON public.class_live_questions(class_id, status);
CREATE INDEX IF NOT EXISTS idx_live_questions_pinned ON public.class_live_questions(class_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_live_questions_created ON public.class_live_questions(created_at DESC);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.class_live_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_live_question_upvotes ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan SELECT Pertanyaan Kuliah
DROP POLICY IF EXISTS live_questions_select ON public.class_live_questions;
CREATE POLICY live_questions_select ON public.class_live_questions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = public.class_live_questions.class_id
        AND (
            c.lecturer_id = (SELECT auth.uid())
            OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.class_id = c.id AND e.student_id = (SELECT auth.uid()))
            OR EXISTS (SELECT 1 FROM public.class_assistants ca WHERE ca.class_id = c.id AND ca.user_id = (SELECT auth.uid()))
            OR EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT auth.uid()) AND r.name IN ('ACADEMIC_STAFF', 'SUPER_ADMIN', 'PROGRAM_COORDINATOR'))
        )
    )
);

-- 2. Kebijakan INSERT Pertanyaan Kuliah
DROP POLICY IF EXISTS live_questions_insert ON public.class_live_questions;
CREATE POLICY live_questions_insert ON public.class_live_questions
FOR INSERT TO authenticated
WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = public.class_live_questions.class_id
        AND (
            c.lecturer_id = (SELECT auth.uid())
            OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.class_id = c.id AND e.student_id = (SELECT auth.uid()))
            OR EXISTS (SELECT 1 FROM public.class_assistants ca WHERE ca.class_id = c.id AND ca.user_id = (SELECT auth.uid()))
        )
    )
);

-- 3. Kebijakan UPDATE Pertanyaan Kuliah
DROP POLICY IF EXISTS live_questions_update ON public.class_live_questions;
CREATE POLICY live_questions_update ON public.class_live_questions
FOR UPDATE TO authenticated
USING (
    -- Dosen atau Asisten dapat mengubah status / sematkan / respons
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = public.class_live_questions.class_id
        AND (
            c.lecturer_id = (SELECT auth.uid())
            OR EXISTS (SELECT 1 FROM public.class_assistants ca WHERE ca.class_id = c.id AND ca.user_id = (SELECT auth.uid()))
            OR EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT auth.uid()) AND r.name IN ('SUPER_ADMIN'))
        )
    )
    -- Pembuat pertanyaan hanya boleh menyunting jika masih berstatus antre
    OR (
        student_id = (SELECT auth.uid())
        AND status = 'antre'
    )
);

-- 4. Kebijakan DELETE Pertanyaan Kuliah
DROP POLICY IF EXISTS live_questions_delete ON public.class_live_questions;
CREATE POLICY live_questions_delete ON public.class_live_questions
FOR DELETE TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = public.class_live_questions.class_id
        AND (
            c.lecturer_id = (SELECT auth.uid())
            OR EXISTS (SELECT 1 FROM public.class_assistants ca WHERE ca.class_id = c.id AND ca.user_id = (SELECT auth.uid()))
            OR EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT auth.uid()) AND r.name IN ('SUPER_ADMIN'))
        )
    )
);

-- 5. Kebijakan Upvote
DROP POLICY IF EXISTS live_question_upvotes_select ON public.class_live_question_upvotes;
CREATE POLICY live_question_upvotes_select ON public.class_live_question_upvotes
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS live_question_upvotes_insert ON public.class_live_question_upvotes;
CREATE POLICY live_question_upvotes_insert ON public.class_live_question_upvotes
FOR INSERT TO authenticated
WITH CHECK (
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS live_question_upvotes_delete ON public.class_live_question_upvotes;
CREATE POLICY live_question_upvotes_delete ON public.class_live_question_upvotes
FOR DELETE TO authenticated
USING (
    user_id = (SELECT auth.uid())
);

-- RPC Fungsi Toggle Upvote Atomik
CREATE OR REPLACE FUNCTION public.toggle_live_question_upvote(p_question_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
    v_new_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum terautentikasi';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.class_live_question_upvotes
        WHERE question_id = p_question_id AND user_id = v_user_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.class_live_question_upvotes
        WHERE question_id = p_question_id AND user_id = v_user_id;

        UPDATE public.class_live_questions
        SET upvotes_count = GREATEST(0, upvotes_count - 1),
            updated_at = now()
        WHERE id = p_question_id
        RETURNING upvotes_count INTO v_new_count;

        RETURN jsonb_build_object('upvoted', false, 'upvotes_count', v_new_count);
    ELSE
        INSERT INTO public.class_live_question_upvotes (question_id, user_id, created_at)
        VALUES (p_question_id, v_user_id, now());

        UPDATE public.class_live_questions
        SET upvotes_count = upvotes_count + 1,
            updated_at = now()
        WHERE id = p_question_id
        RETURNING upvotes_count INTO v_new_count;

        RETURN jsonb_build_object('upvoted', true, 'upvotes_count', v_new_count);
    END IF;
END;
$$;
