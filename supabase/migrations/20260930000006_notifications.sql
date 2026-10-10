-- SIAJAR Migration: Notifikasi in-app (Bagian 4.1 tahap 05 dan 09, 6.6)
-- Dibuat oleh trigger saat tugas terbit dan nilai difinalisasi; pengguna hanya membaca dan menandai miliknya.

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    entity_type TEXT NULL,
    entity_id UUID NULL,
    class_id UUID NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read_at);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.fn_notify_assignment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NEW.status = 'PUBLISHED' THEN
        INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, class_id)
        SELECT e.student_id, 'ASSIGNMENT_NEW', 'Tugas baru: ' || NEW.title,
               'Buka kelas untuk melihat petunjuk dan tenggat.', 'assignments', NEW.id, NEW.class_id
        FROM public.enrollments e WHERE e.class_id = NEW.class_id AND e.status = 'ACTIVE';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_notify_grade() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NEW.status = 'FINAL' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'FINAL') THEN
        INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, class_id)
        VALUES (NEW.student_id, 'GRADE_PUBLISHED',
                'Nilai terbit: ' || COALESCE((SELECT title FROM public.assignments WHERE id = NEW.item_id), 'tugas'),
                'Nilai dan feedback dapat dilihat di kelas.', 'grades', NEW.id, NEW.class_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_assignments_notify ON public.assignments;
CREATE TRIGGER tr_assignments_notify AFTER INSERT ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_assignment();
DROP TRIGGER IF EXISTS tr_grades_notify ON public.grades;
CREATE TRIGGER tr_grades_notify AFTER INSERT OR UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_grade();

CREATE OR REPLACE FUNCTION public.mark_notifications_read() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_n integer;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    UPDATE public.notifications SET read_at = now() WHERE user_id = v_uid AND read_at IS NULL;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_notify_assignment(), public.fn_notify_grade() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_notifications_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read() TO authenticated;
