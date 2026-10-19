-- Migration: 20261017000027_phase5_interaction.sql
-- Description: Fase 5 - Interaksi (Pesan & Konsultasi, Polling & Kuis Cepat, Gamifikasi & Pencapaian, Pengingat AI, Evaluasi Dosen / EDOM)
-- Cara Rollback:
-- DROP FUNCTION IF EXISTS public.start_conversation(uuid, uuid) CASCADE;
-- DROP FUNCTION IF EXISTS public.book_consultation_slot(uuid, text) CASCADE;
-- DROP FUNCTION IF EXISTS public.cancel_consultation_booking(uuid) CASCADE;
-- DROP FUNCTION IF EXISTS public.submit_poll_vote(uuid, jsonb) CASCADE;
-- DROP FUNCTION IF EXISTS public.get_poll_results(uuid) CASCADE;
-- DROP FUNCTION IF EXISTS public.award_xp(uuid, uuid, text, int, text, uuid) CASCADE;
-- DROP FUNCTION IF EXISTS public.get_class_leaderboard(uuid) CASCADE;
-- DROP FUNCTION IF EXISTS public.submit_evaluation(uuid, jsonb) CASCADE;
-- DROP FUNCTION IF EXISTS public.get_lecturer_evaluation_summary(uuid) CASCADE;
-- DROP TABLE IF EXISTS public.evaluation_answers CASCADE;
-- DROP TABLE IF EXISTS public.evaluation_responses CASCADE;
-- DROP TABLE IF EXISTS public.evaluation_completions CASCADE;
-- DROP TABLE IF EXISTS public.evaluation_targets CASCADE;
-- DROP TABLE IF EXISTS public.evaluation_periods CASCADE;
-- DROP TABLE IF EXISTS public.evaluation_questions CASCADE;
-- DROP TABLE IF EXISTS public.evaluation_templates CASCADE;
-- DROP TABLE IF EXISTS public.ai_usage_logs CASCADE;
-- DROP TABLE IF EXISTS public.ai_reminders CASCADE;
-- DROP TABLE IF EXISTS public.student_gamification_prefs CASCADE;
-- DROP TABLE IF EXISTS public.class_gamification_settings CASCADE;
-- DROP TABLE IF EXISTS public.study_streaks CASCADE;
-- DROP TABLE IF EXISTS public.badges CASCADE;
-- DROP TABLE IF EXISTS public.xp_events CASCADE;
-- DROP TABLE IF EXISTS public.live_poll_votes CASCADE;
-- DROP TABLE IF EXISTS public.live_polls CASCADE;
-- DROP TABLE IF EXISTS public.consultation_bookings CASCADE;
-- DROP TABLE IF EXISTS public.consultation_slots CASCADE;
-- DROP TABLE IF EXISTS public.message_reports CASCADE;
-- DROP TABLE IF EXISTS public.messages CASCADE;
-- DROP TABLE IF EXISTS public.conversation_participants CASCADE;
-- DROP TABLE IF EXISTS public.conversations CASCADE;

-- ============================================================================
-- 1. PESAN DAN KONSULTASI (12.1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ,
    muted BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    attachment_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.message_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','ditinjau','selesai','ditolak')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consultation_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
    place_or_link TEXT,
    capacity INT NOT NULL DEFAULT 1 CHECK (capacity BETWEEN 1 AND 20),
    status TEXT NOT NULL DEFAULT 'terbuka' CHECK (status IN ('terbuka','ditutup','dibatalkan')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consultation_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES public.consultation_slots(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL CHECK (char_length(topic) >= 5),
    status TEXT NOT NULL DEFAULT 'dipesan' CHECK (status IN ('dipesan','selesai','dibatalkan','tidak_hadir')),
    lecturer_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_consultation_slot_student UNIQUE (slot_id, student_id)
);

-- RLS: Pesan & Konsultasi
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversations.id
              AND cp.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS conversation_participants_select ON public.conversation_participants;
CREATE POLICY conversation_participants_select ON public.conversation_participants
    FOR SELECT TO authenticated
    USING (
        conversation_id IN (
            SELECT cp2.conversation_id FROM public.conversation_participants cp2
            WHERE cp2.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
              AND cp.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
              AND cp.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS messages_update ON public.messages;
CREATE POLICY messages_update ON public.messages
    FOR UPDATE TO authenticated
    USING (sender_id = (SELECT auth.uid()))
    WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS message_reports_access ON public.message_reports;
CREATE POLICY message_reports_access ON public.message_reports
    FOR ALL TO authenticated
    USING (
        reporter_id = (SELECT auth.uid())
        OR public.has_global_role('ACADEMIC_STAFF')
        OR public.has_global_role('SUPER_ADMIN')
    )
    WITH CHECK (
        reporter_id = (SELECT auth.uid())
        OR public.has_global_role('ACADEMIC_STAFF')
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS consultation_slots_select ON public.consultation_slots;
CREATE POLICY consultation_slots_select ON public.consultation_slots
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS consultation_slots_manage ON public.consultation_slots;
CREATE POLICY consultation_slots_manage ON public.consultation_slots
    FOR ALL TO authenticated
    USING (
        lecturer_id = (SELECT auth.uid())
        OR public.has_global_role('SUPER_ADMIN')
    )
    WITH CHECK (
        lecturer_id = (SELECT auth.uid())
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS consultation_bookings_select ON public.consultation_bookings;
CREATE POLICY consultation_bookings_select ON public.consultation_bookings
    FOR SELECT TO authenticated
    USING (
        student_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.consultation_slots cs
            WHERE cs.id = consultation_bookings.slot_id
              AND cs.lecturer_id = (SELECT auth.uid())
        )
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS consultation_bookings_insert ON public.consultation_bookings;
CREATE POLICY consultation_bookings_insert ON public.consultation_bookings
    FOR INSERT TO authenticated
    WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS consultation_bookings_update ON public.consultation_bookings;
CREATE POLICY consultation_bookings_update ON public.consultation_bookings
    FOR UPDATE TO authenticated
    USING (
        student_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.consultation_slots cs
            WHERE cs.id = consultation_bookings.slot_id
              AND cs.lecturer_id = (SELECT auth.uid())
        )
        OR public.has_global_role('SUPER_ADMIN')
    );

-- RPC: start_conversation
CREATE OR REPLACE FUNCTION public.start_conversation(
    target_user_id UUID,
    p_class_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_conv_id UUID;
    v_can_converse BOOLEAN := false;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum terotentikasi';
    END IF;

    IF v_caller_id = target_user_id THEN
        RAISE EXCEPTION 'Tidak dapat memulai percakapan dengan diri sendiri';
    END IF;

    -- Validasi hak percakapan:
    -- 1. Jika ada konteks kelas:
    IF p_class_id IS NOT NULL THEN
        IF (
            -- Mahasiswa/Asisten <-> Dosen/Asisten
            (public.is_enrolled(p_class_id) AND (public.is_class_lecturer(p_class_id) OR public.is_class_staff(p_class_id)))
            OR ((public.is_class_lecturer(p_class_id) OR public.is_class_staff(p_class_id)) AND EXISTS (
                SELECT 1 FROM public.enrollments e WHERE e.class_id = p_class_id AND e.student_id = target_user_id
            ))
            OR (public.is_class_staff(p_class_id) AND (public.is_class_lecturer(p_class_id) OR public.is_class_staff(p_class_id)))
        ) THEN
            v_can_converse := true;
        END IF;
    END IF;

    -- 2. Dosen <-> Mahasiswa bimbingan atau fallback peran valid
    IF NOT v_can_converse THEN
        IF (
            public.has_active_role('LECTURER') 
            OR public.has_active_role('TEACHING_ASSISTANT')
            OR public.has_global_role('SUPER_ADMIN')
        ) THEN
            v_can_converse := true;
        END IF;
    END IF;

    IF NOT v_can_converse THEN
        RAISE EXCEPTION 'Akses percakapan ditolak. Anda hanya dapat mengirim pesan ke dosen atau asisten kelas Anda.';
    END IF;

    -- Cek percakapan yang sudah ada antara kedua pengguna ini
    SELECT cp1.conversation_id INTO v_conv_id
    FROM public.conversation_participants cp1
    JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    JOIN public.conversations c ON c.id = cp1.conversation_id
    WHERE cp1.user_id = v_caller_id
      AND cp2.user_id = target_user_id
      AND (p_class_id IS NULL OR c.class_id = p_class_id)
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
        RETURN v_conv_id;
    END IF;

    -- Buat percakapan baru
    INSERT INTO public.conversations (class_id)
    VALUES (p_class_id)
    RETURNING id INTO v_conv_id;

    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conv_id, v_caller_id), (v_conv_id, target_user_id);

    RETURN v_conv_id;
END;
$$;

-- RPC: book_consultation_slot
CREATE OR REPLACE FUNCTION public.book_consultation_slot(
    p_slot_id UUID,
    p_topic TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_slot RECORD;
    v_active_bookings INT;
    v_booking_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum terotentikasi';
    END IF;

    IF char_length(p_topic) < 5 THEN
        RAISE EXCEPTION 'Topik konsultasi minimal 5 karakter';
    END IF;

    -- Kunci baris slot untuk mencegah perlombaan kapasitas (race condition)
    SELECT * INTO v_slot
    FROM public.consultation_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot konsultasi tidak ditemukan';
    END IF;

    IF v_slot.status <> 'terbuka' THEN
        RAISE EXCEPTION 'Slot konsultasi sudah tidak terbuka';
    END IF;

    IF v_slot.starts_at <= now() THEN
        RAISE EXCEPTION 'Slot konsultasi sudah lewat dari waktu pelaksanaan';
    END IF;

    -- Hitung pemesanan aktif
    SELECT count(*) INTO v_active_bookings
    FROM public.consultation_bookings
    WHERE slot_id = p_slot_id AND status = 'dipesan';

    IF v_active_bookings >= v_slot.capacity THEN
        RAISE EXCEPTION 'Kapasitas slot konsultasi sudah penuh';
    END IF;

    INSERT INTO public.consultation_bookings (slot_id, student_id, topic, status)
    VALUES (p_slot_id, v_caller_id, p_topic, 'dipesan')
    RETURNING id INTO v_booking_id;

    -- Jika kapasitas pas penuh, tandai ditutup
    IF v_active_bookings + 1 >= v_slot.capacity THEN
        UPDATE public.consultation_slots SET status = 'ditutup' WHERE id = p_slot_id;
    END IF;

    RETURN jsonb_build_object('ok', true, 'booking_id', v_booking_id);
END;
$$;

-- RPC: cancel_consultation_booking
CREATE OR REPLACE FUNCTION public.cancel_consultation_booking(
    p_booking_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_booking RECORD;
    v_slot RECORD;
    v_min_cancel_hours INT := 2;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum terotentikasi';
    END IF;

    SELECT b.*, s.starts_at, s.id as slot_id INTO v_booking
    FROM public.consultation_bookings b
    JOIN public.consultation_slots s ON s.id = b.slot_id
    WHERE b.id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pemesanan konsultasi tidak ditemukan';
    END IF;

    IF v_booking.student_id <> v_caller_id AND NOT public.has_global_role('SUPER_ADMIN') THEN
        RAISE EXCEPTION 'Akses ditolak. Anda bukan pemesan konsultasi ini.';
    END IF;

    IF v_booking.starts_at - now() < (v_min_cancel_hours || ' hours')::interval THEN
        RAISE EXCEPTION 'Pembatalan konsultasi maksimal 2 jam sebelum waktu mulai';
    END IF;

    UPDATE public.consultation_bookings
    SET status = 'dibatalkan'
    WHERE id = p_booking_id;

    -- Buka kembali slot bila sebelumnya berstatus ditutup
    UPDATE public.consultation_slots
    SET status = 'terbuka'
    WHERE id = v_booking.slot_id AND status = 'ditutup';

    RETURN jsonb_build_object('ok', true);
END;
$$;


-- ============================================================================
-- 2. POLLING DAN KUIS CEPAT (12.2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.live_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('single','multiple','scale','text')),
    options JSONB,
    is_anonymous BOOLEAN NOT NULL DEFAULT true,
    is_quiz BOOLEAN NOT NULL DEFAULT false,
    correct_option_ids TEXT[],
    status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf','buka','tutup')),
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_poll_votes (
    poll_id UUID NOT NULL REFERENCES public.live_polls(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    answer JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (poll_id, student_id)
);

ALTER TABLE public.live_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS live_polls_select ON public.live_polls;
CREATE POLICY live_polls_select ON public.live_polls
    FOR SELECT TO authenticated
    USING (
        public.is_class_staff(class_id)
        OR (public.is_enrolled(class_id) AND status IN ('buka', 'tutup'))
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS live_polls_manage ON public.live_polls;
CREATE POLICY live_polls_manage ON public.live_polls
    FOR ALL TO authenticated
    USING (
        public.is_class_staff(class_id)
        OR public.has_global_role('SUPER_ADMIN')
    )
    WITH CHECK (
        public.is_class_staff(class_id)
        OR public.has_global_role('SUPER_ADMIN')
    );

-- Mahasiswa hanya boleh melihat suaranya sendiri.
-- Dosen TIDAK memiliki hak SELECT langsung pada tabel live_poll_votes untuk menjaga asas 100% anonimitas!
DROP POLICY IF EXISTS live_poll_votes_student_access ON public.live_poll_votes;
CREATE POLICY live_poll_votes_student_access ON public.live_poll_votes
    FOR ALL TO authenticated
    USING (student_id = (SELECT auth.uid()))
    WITH CHECK (student_id = (SELECT auth.uid()));

-- RPC: submit_poll_vote
CREATE OR REPLACE FUNCTION public.submit_poll_vote(
    p_poll_id UUID,
    p_answer JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_poll RECORD;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum terotentikasi';
    END IF;

    SELECT * INTO v_poll FROM public.live_polls WHERE id = p_poll_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Polling tidak ditemukan';
    END IF;

    IF v_poll.status <> 'buka' THEN
        RAISE EXCEPTION 'Polling sudah ditutup atau belum dibuka';
    END IF;

    IF NOT public.is_enrolled(v_poll.class_id) AND NOT public.has_global_role('SUPER_ADMIN') THEN
        RAISE EXCEPTION 'Hanya mahasiswa terdaftar di kelas ini yang dapat menjawab polling';
    END IF;

    INSERT INTO public.live_poll_votes (poll_id, student_id, answer, created_at)
    VALUES (p_poll_id, v_caller_id, p_answer, now())
    ON CONFLICT (poll_id, student_id)
    DO UPDATE SET answer = p_answer, created_at = now();

    -- Berikan poin kebiasaan (XP) secara otomatis
    IF v_poll.is_quiz THEN
        -- Kuis cepat
        PERFORM public.award_xp(v_caller_id, v_poll.class_id, 'quiz_vote', 3, 'live_polls', p_poll_id);
    ELSE
        -- Polling reguler
        PERFORM public.award_xp(v_caller_id, v_poll.class_id, 'poll_vote', 2, 'live_polls', p_poll_id);
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- RPC: get_poll_results (Anonimitas terjamin, agregat tanpa identitas mahasiswa)
CREATE OR REPLACE FUNCTION public.get_poll_results(
    p_poll_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_poll RECORD;
    v_total_votes INT;
    v_options JSONB;
    v_results JSONB;
    v_text_answers JSONB;
BEGIN
    SELECT * INTO v_poll FROM public.live_polls WHERE id = p_poll_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Polling tidak ditemukan';
    END IF;

    -- Mahasiswa hanya boleh melihat hasil setelah polling tutup
    IF NOT (public.is_class_staff(v_poll.class_id) OR public.has_global_role('SUPER_ADMIN')) THEN
        IF v_poll.status <> 'tutup' THEN
            RAISE EXCEPTION 'Hasil polling hanya dapat dilihat setelah polling ditutup';
        END IF;
    END IF;

    SELECT count(*) INTO v_total_votes FROM public.live_poll_votes WHERE poll_id = p_poll_id;

    IF v_poll.kind IN ('single', 'multiple', 'scale') THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'option_id', opt.val,
                'count', COALESCE(cnt.c, 0)
            )
        ) INTO v_results
        FROM (
            SELECT jsonb_array_elements_text(v_poll.options->'ids') AS val
            UNION
            SELECT jsonb_array_elements(v_poll.options)->>'id' AS val
        ) opt
        LEFT JOIN (
            SELECT 
                CASE 
                    WHEN jsonb_typeof(answer) = 'array' THEN jsonb_array_elements_text(answer)
                    ELSE answer #>> '{}'
                END AS chosen_id,
                count(*) AS c
            FROM public.live_poll_votes
            WHERE poll_id = p_poll_id
            GROUP BY chosen_id
        ) cnt ON cnt.chosen_id = opt.val;
    ELSE
        -- Jawaban teks bebas, diacak urutannya tanpa identitas mahasiswa
        SELECT jsonb_agg(answer #>> '{}' ORDER BY random()) INTO v_text_answers
        FROM public.live_poll_votes
        WHERE poll_id = p_poll_id;
        v_results := COALESCE(v_text_answers, '[]'::jsonb);
    END IF;

    RETURN jsonb_build_object(
        'poll_id', p_poll_id,
        'status', v_poll.status,
        'total_votes', v_total_votes,
        'results', COALESCE(v_results, '[]'::jsonb),
        'correct_option_ids', CASE WHEN v_poll.is_quiz THEN v_poll.correct_option_ids ELSE NULL END
    );
END;
$$;


-- ============================================================================
-- 3. GAMIFIKASI DAN PENCAPAIAN (12.3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    kind TEXT NOT NULL,
    points INT NOT NULL,
    ref_type TEXT NOT NULL,
    ref_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_xp_event UNIQUE (student_id, kind, ref_type, ref_id)
);

CREATE TABLE IF NOT EXISTS public.badges (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 7 lencana awal
INSERT INTO public.badges (code, name, description, icon) VALUES
('TEPAT_WAKTU', 'Tepat Waktu', 'Mengumpulkan 5 tugas berturut-turut sebelum batas tenggat waktu.', 'clock'),
('HADIR_PENUH', 'Hadir Penuh', 'Hadir pada seluruh pertemuan perkuliahan dalam satu bulan penuh.', 'check-circle'),
('TUNTAS_MATERI', 'Tuntas Materi', 'Menyelesaikan seluruh modul dan materi pada satu kelas perkuliahan.', 'book-open'),
('RAJIN_MEMBACA', 'Rajin Membaca', 'Menyelesaikan minimal 20 materi perkuliahan secara mandiri.', 'book'),
('PENJAWAB_AKTIF', 'Penjawab Aktif', 'Berpartisipasi menjawab 10 polling interaktif di ruang kelas.', 'message-circle'),
('SEMINGGU_BERUNTUN', 'Seminggu Beruntun', 'Mempertahankan kebiasaan belajar aktif selama 7 hari berturut-turut.', 'flame'),
('SEBULAN_BERUNTUN', 'Sebulan Beruntun', 'Mempertahankan kebiasaan belajar aktif selama 30 hari berturut-turut.', 'award')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

-- Sinkronisasi kolom pelengkap student_badges dari migrasi 20
ALTER TABLE public.student_badges ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
ALTER TABLE public.student_badges ADD COLUMN IF NOT EXISTS earned_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.study_streaks (
    student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_days INT NOT NULL DEFAULT 0,
    best_days INT NOT NULL DEFAULT 0,
    last_active_on DATE
);

CREATE TABLE IF NOT EXISTS public.class_gamification_settings (
    class_id UUID PRIMARY KEY REFERENCES public.classes(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    leaderboard_enabled BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.student_gamification_prefs (
    student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    show_on_leaderboard BOOLEAN NOT NULL DEFAULT false,
    display_alias TEXT
);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_gamification_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS xp_events_select ON public.xp_events;
CREATE POLICY xp_events_select ON public.xp_events
    FOR SELECT TO authenticated
    USING (
        student_id = (SELECT auth.uid())
        OR public.has_active_role('LECTURER')
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS badges_select ON public.badges;
CREATE POLICY badges_select ON public.badges
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS study_streaks_select ON public.study_streaks;
CREATE POLICY study_streaks_select ON public.study_streaks
    FOR SELECT TO authenticated
    USING (
        student_id = (SELECT auth.uid())
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS class_gamification_settings_select ON public.class_gamification_settings;
CREATE POLICY class_gamification_settings_select ON public.class_gamification_settings
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS class_gamification_settings_manage ON public.class_gamification_settings;
CREATE POLICY class_gamification_settings_manage ON public.class_gamification_settings
    FOR ALL TO authenticated
    USING (
        public.is_class_staff(class_id)
        OR public.has_global_role('SUPER_ADMIN')
    )
    WITH CHECK (
        public.is_class_staff(class_id)
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS student_gamification_prefs_access ON public.student_gamification_prefs;
CREATE POLICY student_gamification_prefs_access ON public.student_gamification_prefs
    FOR ALL TO authenticated
    USING (student_id = (SELECT auth.uid()))
    WITH CHECK (student_id = (SELECT auth.uid()));

-- RPC: award_xp
CREATE OR REPLACE FUNCTION public.award_xp(
    p_student_id UUID,
    p_class_id UUID,
    p_kind TEXT,
    p_points INT,
    p_ref_type TEXT,
    p_ref_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_today DATE;
    v_streak RECORD;
    v_new_current INT;
    v_new_best INT;
    v_poll_count INT;
    v_mat_count INT;
BEGIN
    -- Masukkan XP event (idempoten)
    INSERT INTO public.xp_events (student_id, class_id, kind, points, ref_type, ref_id)
    VALUES (p_student_id, p_class_id, p_kind, p_points, p_ref_type, p_ref_id)
    ON CONFLICT (student_id, kind, ref_type, ref_id) DO NOTHING;

    -- Hitung kebiasaan aktif harian (streak) di zona WIB
    v_today := (now() AT TIME ZONE 'Asia/Jakarta')::date;

    SELECT * INTO v_streak FROM public.study_streaks WHERE student_id = p_student_id FOR UPDATE;
    IF NOT FOUND THEN
        INSERT INTO public.study_streaks (student_id, current_days, best_days, last_active_on)
        VALUES (p_student_id, 1, 1, v_today);
        v_new_current := 1;
    ELSE
        IF v_streak.last_active_on IS NULL OR v_streak.last_active_on < v_today - 1 THEN
            v_new_current := 1;
        ELSIF v_streak.last_active_on = v_today - 1 THEN
            v_new_current := v_streak.current_days + 1;
        ELSE
            v_new_current := v_streak.current_days;
        END IF;

        v_new_best := GREATEST(v_streak.best_days, v_new_current);

        UPDATE public.study_streaks
        SET current_days = v_new_current,
            best_days = v_new_best,
            last_active_on = v_today
        WHERE student_id = p_student_id;
    END IF;

    -- Evaluasi lencana otomatis
    IF v_new_current >= 7 THEN
        INSERT INTO public.student_badges (student_id, badge_code, badge_name, description, class_id)
        VALUES (p_student_id, 'SEMINGGU_BERUNTUN', 'Seminggu Beruntun', '7 hari belajar aktif berurutan', p_class_id)
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_new_current >= 30 THEN
        INSERT INTO public.student_badges (student_id, badge_code, badge_name, description, class_id)
        VALUES (p_student_id, 'SEBULAN_BERUNTUN', 'Sebulan Beruntun', '30 hari belajar aktif berurutan', p_class_id)
        ON CONFLICT DO NOTHING;
    END IF;

    IF p_kind IN ('poll_vote', 'quiz_vote') THEN
        SELECT count(*) INTO v_poll_count FROM public.xp_events WHERE student_id = p_student_id AND kind IN ('poll_vote', 'quiz_vote');
        IF v_poll_count >= 10 THEN
            INSERT INTO public.student_badges (student_id, badge_code, badge_name, description, class_id)
            VALUES (p_student_id, 'PENJAWAB_AKTIF', 'Penjawab Aktif', 'Menjawab 10 polling interaktif', p_class_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    IF p_kind = 'material_completed' THEN
        SELECT count(*) INTO v_mat_count FROM public.xp_events WHERE student_id = p_student_id AND kind = 'material_completed';
        IF v_mat_count >= 20 THEN
            INSERT INTO public.student_badges (student_id, badge_code, badge_name, description, class_id)
            VALUES (p_student_id, 'RAJIN_MEMBACA', 'Rajin Membaca', 'Menyelesaikan 20 materi perkuliahan', p_class_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN jsonb_build_object('ok', true, 'points_awarded', p_points, 'streak', v_new_current);
END;
$$;

-- RPC: get_class_leaderboard
CREATE OR REPLACE FUNCTION public.get_class_leaderboard(
    p_class_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_settings RECORD;
    v_top10 JSONB;
    v_my_pos INT;
    v_my_xp INT;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    SELECT * INTO v_settings FROM public.class_gamification_settings WHERE class_id = p_class_id;

    IF NOT FOUND OR NOT v_settings.enabled OR NOT v_settings.leaderboard_enabled THEN
        RETURN jsonb_build_object('enabled', false, 'leaderboard', '[]'::jsonb);
    END IF;

    -- Ambil 10 teratas yang opt-in, reset mingguan (7 hari terakhir)
    SELECT jsonb_agg(
        jsonb_build_object(
            'rank', r.rank,
            'alias', COALESCE(r.display_alias, 'Mahasiswa ' || r.rank),
            'points', r.weekly_points
        )
    ) INTO v_top10
    FROM (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY COALESCE(sum(xp.points), 0) DESC) AS rank,
            pref.display_alias,
            COALESCE(sum(xp.points), 0) AS weekly_points
        FROM public.enrollments e
        JOIN public.student_gamification_prefs pref ON pref.student_id = e.student_id
        LEFT JOIN public.xp_events xp ON xp.student_id = e.student_id 
            AND xp.class_id = p_class_id 
            AND xp.created_at >= now() - interval '7 days'
        WHERE e.class_id = p_class_id
          AND pref.show_on_leaderboard = true
        GROUP BY e.student_id, pref.display_alias
        ORDER BY weekly_points DESC
        LIMIT 10
    ) r;

    -- Hitung posisi pemanggil
    SELECT r.rank, r.weekly_points INTO v_my_pos, v_my_xp
    FROM (
        SELECT 
            e.student_id,
            ROW_NUMBER() OVER (ORDER BY COALESCE(sum(xp.points), 0) DESC) AS rank,
            COALESCE(sum(xp.points), 0) AS weekly_points
        FROM public.enrollments e
        JOIN public.student_gamification_prefs pref ON pref.student_id = e.student_id
        LEFT JOIN public.xp_events xp ON xp.student_id = e.student_id 
            AND xp.class_id = p_class_id 
            AND xp.created_at >= now() - interval '7 days'
        WHERE e.class_id = p_class_id
          AND pref.show_on_leaderboard = true
        GROUP BY e.student_id
    ) r
    WHERE r.student_id = v_caller_id;

    RETURN jsonb_build_object(
        'enabled', true,
        'leaderboard', COALESCE(v_top10, '[]'::jsonb),
        'my_rank', v_my_pos,
        'my_points', COALESCE(v_my_xp, 0)
    );
END;
$$;


-- ============================================================================
-- 4. PENGINGAT AI (12.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('tugas_h1','tugas_3jam','ujian_h1','kehadiran','materi_baru','login_baru','ringkasan_mingguan')),
    ref_type TEXT,
    ref_id UUID,
    payload JSONB NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'terjadwal' CHECK (status IN ('terjadwal','terkirim','dibaca','dibatalkan')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    dedupe_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    kind TEXT,
    input_tokens INT,
    output_tokens INT,
    ok BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_reminders_select ON public.ai_reminders;
CREATE POLICY ai_reminders_select ON public.ai_reminders
    FOR SELECT TO authenticated
    USING (
        student_id = (SELECT auth.uid())
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS ai_reminders_update ON public.ai_reminders;
CREATE POLICY ai_reminders_update ON public.ai_reminders
    FOR UPDATE TO authenticated
    USING (student_id = (SELECT auth.uid()))
    WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS ai_usage_logs_access ON public.ai_usage_logs;
CREATE POLICY ai_usage_logs_access ON public.ai_usage_logs
    FOR ALL TO authenticated
    USING (public.has_global_role('SUPER_ADMIN'))
    WITH CHECK (public.has_global_role('SUPER_ADMIN'));


-- ============================================================================
-- 5. EVALUASI DOSEN OLEH MAHASISWA / EDOM (12.5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evaluation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evaluation_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.evaluation_templates(id) ON DELETE CASCADE,
    position INT NOT NULL,
    category TEXT,
    text TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('skala','teks')),
    required BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.evaluation_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.evaluation_templates(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    opens_at TIMESTAMPTZ NOT NULL,
    closes_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf','buka','tutup')),
    require_before_final_grades BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evaluation_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES public.evaluation_periods(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    lecturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT uq_eval_target UNIQUE (period_id, class_id, lecturer_id)
);

-- Kuitansi Pengisian: HANYA menyimpan pencatat bahwa mhs X sudah mengisi target Y.
-- TIDAK ADA data skor atau jawaban di tabel ini.
CREATE TABLE IF NOT EXISTS public.evaluation_completions (
    target_id UUID NOT NULL REFERENCES public.evaluation_targets(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (target_id, student_id)
);

-- Jawaban Evaluasi: TANPA student_id, hanya menyimpan tanggal pengisian (bukan jam).
-- TIDAK ADA kunci asing atau kolom yang menghubungkan tabel ini ke evaluation_completions.
CREATE TABLE IF NOT EXISTS public.evaluation_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL REFERENCES public.evaluation_targets(id) ON DELETE CASCADE,
    submitted_on DATE NOT NULL DEFAULT current_date
);

CREATE TABLE IF NOT EXISTS public.evaluation_answers (
    response_id UUID NOT NULL REFERENCES public.evaluation_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.evaluation_questions(id) ON DELETE CASCADE,
    value_int INT CHECK (value_int BETWEEN 1 AND 5),
    value_text TEXT,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (response_id, question_id)
);

ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eval_templates_select ON public.evaluation_templates;
CREATE POLICY eval_templates_select ON public.evaluation_templates
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS eval_templates_manage ON public.evaluation_templates;
CREATE POLICY eval_templates_manage ON public.evaluation_templates
    FOR ALL TO authenticated
    USING (
        public.has_active_role('PROGRAM_COORDINATOR')
        OR public.has_global_role('SUPER_ADMIN')
    )
    WITH CHECK (
        public.has_active_role('PROGRAM_COORDINATOR')
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS eval_questions_select ON public.evaluation_questions;
CREATE POLICY eval_questions_select ON public.evaluation_questions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS eval_questions_manage ON public.evaluation_questions;
CREATE POLICY eval_questions_manage ON public.evaluation_questions
    FOR ALL TO authenticated
    USING (
        public.has_active_role('PROGRAM_COORDINATOR')
        OR public.has_global_role('SUPER_ADMIN')
    )
    WITH CHECK (
        public.has_active_role('PROGRAM_COORDINATOR')
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS eval_periods_select ON public.evaluation_periods;
CREATE POLICY eval_periods_select ON public.evaluation_periods
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS eval_periods_manage ON public.evaluation_periods;
CREATE POLICY eval_periods_manage ON public.evaluation_periods
    FOR ALL TO authenticated
    USING (
        public.has_active_role('PROGRAM_COORDINATOR')
        OR public.has_global_role('SUPER_ADMIN')
    )
    WITH CHECK (
        public.has_active_role('PROGRAM_COORDINATOR')
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS eval_targets_select ON public.evaluation_targets;
CREATE POLICY eval_targets_select ON public.evaluation_targets
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS eval_completions_student ON public.evaluation_completions;
CREATE POLICY eval_completions_student ON public.evaluation_completions
    FOR SELECT TO authenticated
    USING (
        student_id = (SELECT auth.uid())
        OR public.has_active_role('PROGRAM_COORDINATOR')
        OR public.has_global_role('SUPER_ADMIN')
    );

-- evaluation_responses & evaluation_answers: TIDAK ADA akses SELECT langsung bagi dosen atau mahasiswa!
-- Akses hanya diberikan lewat fungsi RPC agregat SECURITY DEFINER.
DROP POLICY IF EXISTS eval_responses_deny_all ON public.evaluation_responses;
CREATE POLICY eval_responses_deny_all ON public.evaluation_responses
    FOR ALL TO authenticated
    USING (public.has_global_role('SUPER_ADMIN'))
    WITH CHECK (public.has_global_role('SUPER_ADMIN'));

DROP POLICY IF EXISTS eval_answers_deny_all ON public.evaluation_answers;
CREATE POLICY eval_answers_deny_all ON public.evaluation_answers
    FOR ALL TO authenticated
    USING (public.has_global_role('SUPER_ADMIN'))
    WITH CHECK (public.has_global_role('SUPER_ADMIN'));

-- RPC: submit_evaluation (Anonimitas Terjamin)
CREATE OR REPLACE FUNCTION public.submit_evaluation(
    p_target_id UUID,
    p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID;
    v_target RECORD;
    v_period RECORD;
    v_response_id UUID;
    v_item JSONB;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum terotentikasi';
    END IF;

    SELECT t.*, p.status, p.id as p_id INTO v_target
    FROM public.evaluation_targets t
    JOIN public.evaluation_periods p ON p.id = t.period_id
    WHERE t.id = p_target_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target evaluasi tidak ditemukan';
    END IF;

    IF v_target.status <> 'buka' THEN
        RAISE EXCEPTION 'Periode evaluasi tidak aktif atau sudah ditutup';
    END IF;

    -- Periksa apakah mahasiswa terdaftar di kelas
    IF NOT public.is_enrolled(v_target.class_id) AND NOT public.has_global_role('SUPER_ADMIN') THEN
        RAISE EXCEPTION 'Anda tidak terdaftar pada mata kuliah ini';
    END IF;

    -- Periksa apakah sudah pernah mengisi
    IF EXISTS (
        SELECT 1 FROM public.evaluation_completions
        WHERE target_id = p_target_id AND student_id = v_caller_id
    ) THEN
        RAISE EXCEPTION 'Anda sudah mengisi evaluasi untuk mata kuliah ini';
    END IF;

    -- 1. Catat kuitansi pengisian
    INSERT INTO public.evaluation_completions (target_id, student_id)
    VALUES (p_target_id, v_caller_id);

    -- 2. Catat jawaban secara terpisah tanpa kolom identitas apapun
    INSERT INTO public.evaluation_responses (target_id, submitted_on)
    VALUES (p_target_id, current_date)
    RETURNING id INTO v_response_id;

    -- 3. Masukkan rincian jawaban
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        INSERT INTO public.evaluation_answers (
            response_id,
            question_id,
            value_int,
            value_text
        )
        VALUES (
            v_response_id,
            (v_item->>'question_id')::uuid,
            (v_item->>'value_int')::int,
            v_item->>'value_text'
        );
    END LOOP;

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- RPC: get_lecturer_evaluation_summary
CREATE OR REPLACE FUNCTION public.get_lecturer_evaluation_summary(
    p_target_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_target RECORD;
    v_period RECORD;
    v_count INT;
    v_min_respondents INT := 5;
    v_avg_score NUMERIC(4,2);
    v_scores_by_cat JSONB;
    v_comments JSONB;
BEGIN
    SELECT t.*, p.status as period_status INTO v_target
    FROM public.evaluation_targets t
    JOIN public.evaluation_periods p ON p.id = t.period_id
    WHERE t.id = p_target_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target evaluasi tidak ditemukan';
    END IF;

    -- Ambil batas responden minimum dari kebijakan institusi jika ada
    SELECT COALESCE(value_int, 5) INTO v_min_respondents
    FROM public.institution_policies
    WHERE key = 'evaluation_min_respondents';

    SELECT count(*) INTO v_count
    FROM public.evaluation_responses
    WHERE target_id = p_target_id;

    -- Dosen hanya boleh melihat setelah periode TUTUP
    IF v_target.lecturer_id = auth.uid() AND v_target.period_status <> 'tutup' THEN
        RETURN jsonb_build_object(
            'ok', true,
            'is_period_closed', false,
            'has_minimum_respondents', v_count >= v_min_respondents,
            'respondents_count', v_count,
            'notice', 'Hasil evaluasi kelas akan ditampilkan setelah periode kuesioner resmi ditutup.'
        );
    END IF;

    -- Jika responden kurang dari batas minimal privasi
    IF v_count < v_min_respondents THEN
        RETURN jsonb_build_object(
            'ok', true,
            'is_period_closed', v_target.period_status = 'tutup',
            'has_minimum_respondents', false,
            'respondents_count', v_count,
            'notice', 'Jumlah responden belum memenuhi batas minimal privasi (' || v_count || ' dari minimal ' || v_min_respondents || ' responden) untuk melindungi kerahasiaan mahasiswa.'
        );
    END IF;

    -- Hitung rata-rata per kategori & total
    SELECT 
        ROUND(AVG(a.value_int)::numeric, 2) INTO v_avg_score
    FROM public.evaluation_answers a
    JOIN public.evaluation_responses r ON r.id = a.response_id
    WHERE r.target_id = p_target_id AND a.value_int IS NOT NULL;

    SELECT jsonb_object_agg(
        COALESCE(q.category, 'UMUM'),
        ROUND(AVG(a.value_int)::numeric, 2)
    ) INTO v_scores_by_cat
    FROM public.evaluation_answers a
    JOIN public.evaluation_questions q ON q.id = a.question_id
    JOIN public.evaluation_responses r ON r.id = a.response_id
    WHERE r.target_id = p_target_id AND a.value_int IS NOT NULL
    GROUP BY COALESCE(q.category, 'UMUM');

    -- Komentar teks dalam urutan ACAK tanpa tanggal dan tanpa identitas
    SELECT jsonb_agg(a.value_text ORDER BY random()) INTO v_comments
    FROM public.evaluation_answers a
    JOIN public.evaluation_responses r ON r.id = a.response_id
    WHERE r.target_id = p_target_id 
      AND a.value_text IS NOT NULL 
      AND a.value_text <> ''
      AND a.is_hidden = false;

    RETURN jsonb_build_object(
        'ok', true,
        'is_period_closed', v_target.period_status = 'tutup',
        'has_minimum_respondents', true,
        'respondents_count', v_count,
        'average_score', v_avg_score,
        'category_scores', COALESCE(v_scores_by_cat, '{}'::jsonb),
        'comments', COALESCE(v_comments, '[]'::jsonb)
    );
END;
$$;
