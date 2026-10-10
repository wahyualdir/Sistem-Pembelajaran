-- SIAJAR Migration: Pengumuman kelas (Bagian 5.1, 6.4)

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
    body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 5000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_announcements_class ON public.announcements(class_id, created_at DESC);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_select ON public.announcements;
CREATE POLICY announcements_select ON public.announcements
FOR SELECT TO authenticated
USING (public.is_class_staff(class_id) OR public.is_enrolled(class_id));

CREATE OR REPLACE FUNCTION public.create_announcement(p_class uuid, p_title text, p_body text DEFAULT '')
RETURNS public.announcements LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_row public.announcements;
BEGIN
    IF v_uid IS NULL OR NOT public.is_class_lecturer(p_class) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;
    INSERT INTO public.announcements (class_id, author_id, title, body)
    VALUES (p_class, v_uid, trim(p_title), COALESCE(trim(p_body), ''))
    RETURNING * INTO v_row;
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, 'LECTURER', 'announcement.create', 'announcements', v_row.id, 'CLASS', p_class);
    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_notify_announcement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, class_id)
    SELECT e.student_id, 'ANNOUNCEMENT_NEW', 'Pengumuman: ' || NEW.title, 'Buka kelas untuk membacanya.', 'announcements', NEW.id, NEW.class_id
    FROM public.enrollments e WHERE e.class_id = NEW.class_id AND e.status = 'ACTIVE';
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_announcements_notify ON public.announcements;
CREATE TRIGGER tr_announcements_notify AFTER INSERT ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_announcement();

REVOKE ALL ON FUNCTION public.fn_notify_announcement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_announcement(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_announcement(uuid, text, text) TO authenticated;
