-- SIAJAR Migration: Diskusi kelas (Bagian 5.1, 6.6)
-- Balasan datar (belum bersarang). Moderasi menyembunyikan, bukan menghapus. Nama penulis disalin saat posting
-- karena mahasiswa tidak boleh membaca profil mahasiswa lain.

CREATE TABLE IF NOT EXISTS public.discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    author_name TEXT NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.discussion_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    hidden_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_discussions_class ON public.discussions(class_id, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_thread ON public.discussion_replies(discussion_id, created_at);

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS discussions_select ON public.discussions;
CREATE POLICY discussions_select ON public.discussions
FOR SELECT TO authenticated
USING (public.is_class_staff(class_id) OR public.is_enrolled(class_id));

-- Mahasiswa tidak melihat balasan yang disembunyikan moderator.
DROP POLICY IF EXISTS discussion_replies_select ON public.discussion_replies;
CREATE POLICY discussion_replies_select ON public.discussion_replies
FOR SELECT TO authenticated
USING (public.is_class_staff(class_id) OR (public.is_enrolled(class_id) AND NOT is_hidden));

CREATE OR REPLACE FUNCTION public.post_discussion(p_class uuid, p_title text, p_body text)
RETURNS public.discussions LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_name text;
    v_row public.discussions;
BEGIN
    IF v_uid IS NULL OR NOT (public.is_enrolled(p_class) OR public.is_class_staff(p_class)) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;
    SELECT full_name INTO v_name FROM public.profiles WHERE id = v_uid;
    INSERT INTO public.discussions (class_id, author_id, author_name, title, body)
    VALUES (p_class, v_uid, COALESCE(v_name, 'Pengguna'), trim(p_title), trim(p_body))
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.reply_discussion(p_discussion uuid, p_body text)
RETURNS public.discussion_replies LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_d public.discussions;
    v_name text;
    v_row public.discussion_replies;
BEGIN
    SELECT * INTO v_d FROM public.discussions WHERE id = p_discussion;
    IF NOT FOUND OR v_uid IS NULL OR NOT (public.is_enrolled(v_d.class_id) OR public.is_class_staff(v_d.class_id)) THEN
        RAISE EXCEPTION 'NOT_FOUND';
    END IF;
    IF v_d.is_locked AND NOT public.is_class_lecturer(v_d.class_id) THEN
        RAISE EXCEPTION 'LOCKED';
    END IF;
    SELECT full_name INTO v_name FROM public.profiles WHERE id = v_uid;
    INSERT INTO public.discussion_replies (discussion_id, class_id, author_id, author_name, body)
    VALUES (p_discussion, v_d.class_id, v_uid, COALESCE(v_name, 'Pengguna'), trim(p_body))
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$$;

-- Moderasi (hanya dosen kelas): 'pin' dan 'lock' untuk diskusi, 'hide' untuk balasan.
CREATE OR REPLACE FUNCTION public.moderate_discussion(p_kind text, p_id uuid, p_value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_class uuid;
BEGIN
    IF p_kind IN ('pin', 'lock') THEN
        SELECT class_id INTO v_class FROM public.discussions WHERE id = p_id;
    ELSIF p_kind = 'hide' THEN
        SELECT class_id INTO v_class FROM public.discussion_replies WHERE id = p_id;
    ELSE
        RAISE EXCEPTION 'INVALID_KIND';
    END IF;
    IF v_class IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    IF v_uid IS NULL OR NOT public.is_class_lecturer(v_class) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

    IF p_kind = 'pin' THEN
        UPDATE public.discussions SET is_pinned = p_value WHERE id = p_id;
    ELSIF p_kind = 'lock' THEN
        UPDATE public.discussions SET is_locked = p_value WHERE id = p_id;
    ELSE
        UPDATE public.discussion_replies SET is_hidden = p_value, hidden_by = CASE WHEN p_value THEN v_uid END WHERE id = p_id;
    END IF;
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, 'LECTURER', 'discussion.moderate', CASE WHEN p_kind = 'hide' THEN 'discussion_replies' ELSE 'discussions' END,
            p_id, 'CLASS', v_class, jsonb_build_object('kind', p_kind, 'value', p_value));
END;
$$;

REVOKE ALL ON FUNCTION public.post_discussion(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reply_discussion(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_discussion(text, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_discussion(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reply_discussion(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_discussion(text, uuid, boolean) TO authenticated;
