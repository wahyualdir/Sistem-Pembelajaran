-- ============================================================================
-- SIAJAR Migration: 20261018000030_peta_pulau_tahap1_core.sql
-- Fitur: Peta Pulau Tahap 1 — Inti Belajar (Kuis Bab, Topik, Peta, Progres, RPC)
-- Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md (Bagian 7.1 - 7.5)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. TABEL HASIL TOPIK DAN KEKUATAN TOPIK (Bagian 7.2)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempt_topic_results (
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.chapter_topics(id) ON DELETE CASCADE,
    answered INT NOT NULL,
    correct INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (attempt_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_topic_results_student ON public.quiz_attempt_topic_results(student_id);

ALTER TABLE public.quiz_attempt_topic_results ENABLE ROW LEVEL SECURITY;

-- Mahasiswa hanya membaca hasil miliknya sendiri. Dosen tidak memiliki SELECT langsung.
DROP POLICY IF EXISTS quiz_attempt_topic_results_select ON public.quiz_attempt_topic_results;
CREATE POLICY quiz_attempt_topic_results_select ON public.quiz_attempt_topic_results
FOR SELECT TO authenticated
USING (student_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.topic_mastery (
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.chapter_topics(id) ON DELETE CASCADE,
    answered INT NOT NULL DEFAULT 0,
    correct INT NOT NULL DEFAULT 0,
    attempts_counted INT NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT 'belum_cukup_data'
        CHECK (level IN ('belum_cukup_data', 'perlu_latihan', 'cukup', 'kuat')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_topic_mastery_student ON public.topic_mastery(student_id);

ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;

-- Mahasiswa hanya membaca kekuatan topik miliknya sendiri. Dosen tidak memiliki SELECT langsung.
DROP POLICY IF EXISTS topic_mastery_select ON public.topic_mastery;
CREATE POLICY topic_mastery_select ON public.topic_mastery
FOR SELECT TO authenticated
USING (student_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- 2. RPC FINISH_CHAPTER_QUIZ_ATTEMPT (Bagian 7.2)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finish_chapter_quiz_attempt(
    p_attempt_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_attempt RECORD;
    v_quiz RECORD;
    v_chapter RECORD;
    v_total_points NUMERIC(6,2) := 0;
    v_earned_points NUMERIC(6,2) := 0;
    v_score_percent NUMERIC(5,2) := 0;
    v_pass_threshold NUMERIC(5,2);
    v_is_passed BOOLEAN := false;
    v_now TIMESTAMPTZ := now();
    v_q RECORD;
    v_ans RECORD;
    v_topic RECORD;
    v_topic_answered INT;
    v_topic_correct INT;
    v_old_passed TIMESTAMPTZ;
    v_best_score NUMERIC(5,2);
    v_attempts_count INT;
    v_duration_seconds INT;
    v_next_chap RECORD;
BEGIN
    -- 1. Ambil percobaan dan kunci baris untuk mencegah race condition
    SELECT * INTO v_attempt FROM public.exam_attempts WHERE id = p_attempt_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Percobaan kuis tidak ditemukan: %', p_attempt_id;
    END IF;

    SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_attempt.quiz_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Kuis tidak ditemukan untuk percobaan ini';
    END IF;

    IF v_quiz.chapter_id IS NULL THEN
        RAISE EXCEPTION 'Kuis ini bukan kuis bab (chapter_id null)';
    END IF;

    SELECT * INTO v_chapter FROM public.class_chapters WHERE id = v_quiz.chapter_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bab tidak ditemukan';
    END IF;

    -- Ambang kelulusan bab (prioritas pass_score bab, fallback kebijakan chapter_pass_score bawaan 70)
    v_pass_threshold := COALESCE(
        v_chapter.pass_score,
        (SELECT (value)::numeric FROM public.institution_policies WHERE key = 'chapter_pass_score'),
        70.00
    );

    -- 2. Hitung skor otomatis bila belum diselesaikan
    IF v_attempt.status = 'IN_PROGRESS' THEN
        -- Iterasi setiap soal dalam kuis
        FOR v_q IN
            SELECT q.id, q.points, q.question_type, q.topic_id, k.correct_option_id, k.correct_data
            FROM public.quiz_questions q
            LEFT JOIN public.quiz_question_keys k ON k.question_id = q.id
            WHERE q.quiz_id = v_quiz.id
        LOOP
            v_total_points := v_total_points + COALESCE(v_q.points, 10.00);

            SELECT * INTO v_ans FROM public.exam_answers
            WHERE attempt_id = p_attempt_id AND question_id = v_q.id;

            IF FOUND THEN
                IF v_q.question_type = 'MULTIPLE_CHOICE' THEN
                    IF v_ans.selected_option_id IS NOT NULL AND v_ans.selected_option_id = v_q.correct_option_id THEN
                        v_earned_points := v_earned_points + COALESCE(v_q.points, 10.00);
                        UPDATE public.exam_answers SET score_earned = COALESCE(v_q.points, 10.00), is_draft = false
                        WHERE id = v_ans.id;
                    ELSE
                        UPDATE public.exam_answers SET score_earned = 0.00, is_draft = false WHERE id = v_ans.id;
                    END IF;
                ELSIF v_q.question_type = 'TRUE_FALSE' THEN
                    IF v_ans.answer_data->>'selected' = v_q.correct_data->>'correct' THEN
                        v_earned_points := v_earned_points + COALESCE(v_q.points, 10.00);
                        UPDATE public.exam_answers SET score_earned = COALESCE(v_q.points, 10.00), is_draft = false
                        WHERE id = v_ans.id;
                    ELSE
                        UPDATE public.exam_answers SET score_earned = 0.00, is_draft = false WHERE id = v_ans.id;
                    END IF;
                ELSIF v_q.question_type = 'SHORT_ANSWER' THEN
                    IF trim(lower(COALESCE(v_ans.essay_text, ''))) = trim(lower(COALESCE(v_q.correct_data->>'answer', ''))) THEN
                        v_earned_points := v_earned_points + COALESCE(v_q.points, 10.00);
                        UPDATE public.exam_answers SET score_earned = COALESCE(v_q.points, 10.00), is_draft = false
                        WHERE id = v_ans.id;
                    ELSE
                        UPDATE public.exam_answers SET score_earned = 0.00, is_draft = false WHERE id = v_ans.id;
                    END IF;
                ELSE
                    -- Default fallback bila opsi cocok
                    IF v_ans.selected_option_id IS NOT NULL AND v_ans.selected_option_id = v_q.correct_option_id THEN
                        v_earned_points := v_earned_points + COALESCE(v_q.points, 10.00);
                    END IF;
                END IF;
            END IF;
        END LOOP;

        IF v_total_points > 0 THEN
            v_score_percent := round((v_earned_points / v_total_points) * 100.0, 2);
        ELSE
            v_score_percent := 0.00;
        END IF;

        v_duration_seconds := GREATEST(0, EXTRACT(EPOCH FROM (v_now - v_attempt.started_at))::int);

        UPDATE public.exam_attempts
        SET status = 'SUBMITTED',
            finished_at = v_now,
            total_score = v_score_percent,
            max_score = 100.00,
            is_graded = true
        WHERE id = p_attempt_id;
    ELSE
        -- Percobaan sudah selesai sebelumnya (Idempoten)
        v_score_percent := v_attempt.total_score;
        v_duration_seconds := GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(v_attempt.finished_at, v_now) - v_attempt.started_at))::int);
    END IF;

    v_is_passed := v_score_percent >= v_pass_threshold;

    -- 3. Perbarui chapter_progress
    SELECT passed_at, best_score, attempts INTO v_old_passed, v_best_score, v_attempts_count
    FROM public.chapter_progress
    WHERE student_id = v_attempt.student_id AND chapter_id = v_chapter.id;

    IF NOT FOUND THEN
        INSERT INTO public.chapter_progress (
            student_id, chapter_id, best_score, attempts, passed_at, updated_at
        ) VALUES (
            v_attempt.student_id,
            v_chapter.id,
            v_score_percent,
            1,
            CASE WHEN v_is_passed THEN v_now ELSE NULL END,
            v_now
        );
        v_old_passed := NULL;
    ELSE
        UPDATE public.chapter_progress
        SET best_score = GREATEST(COALESCE(v_best_score, 0), v_score_percent),
            attempts = attempts + 1,
            passed_at = COALESCE(v_old_passed, CASE WHEN v_is_passed THEN v_now ELSE NULL END),
            updated_at = v_now
        WHERE student_id = v_attempt.student_id AND chapter_id = v_chapter.id;
    END IF;

    -- 4. Tulis hasil topik per percobaan (quiz_attempt_topic_results) & rekap topic_mastery
    FOR v_topic IN
        SELECT DISTINCT topic_id
        FROM public.quiz_questions
        WHERE quiz_id = v_quiz.id AND topic_id IS NOT NULL
    LOOP
        SELECT
            count(*)::int AS answered,
            count(*) FILTER (WHERE a.score_earned > 0)::int AS correct
        INTO v_topic_answered, v_topic_correct
        FROM public.quiz_questions q
        LEFT JOIN public.exam_answers a ON a.attempt_id = p_attempt_id AND a.question_id = q.id
        WHERE q.quiz_id = v_quiz.id AND q.topic_id = v_topic.topic_id;

        INSERT INTO public.quiz_attempt_topic_results (
            attempt_id, student_id, topic_id, answered, correct
        ) VALUES (
            p_attempt_id, v_attempt.student_id, v_topic.topic_id, v_topic_answered, v_topic_correct
        )
        ON CONFLICT (attempt_id, topic_id) DO UPDATE
        SET answered = EXCLUDED.answered, correct = EXCLUDED.correct;

        -- Hitung ulang topic_mastery dari maksimal 3 percobaan terakhir
        WITH last_three AS (
            SELECT answered, correct
            FROM public.quiz_attempt_topic_results
            WHERE student_id = v_attempt.student_id AND topic_id = v_topic.topic_id
            ORDER BY created_at DESC
            LIMIT 3
        ),
        agg AS (
            SELECT
                COALESCE(sum(answered), 0)::int AS tot_ans,
                COALESCE(sum(correct), 0)::int AS tot_cor,
                count(*)::int AS att_cnt
            FROM last_three
        )
        INSERT INTO public.topic_mastery (
            student_id, topic_id, answered, correct, attempts_counted, level, updated_at
        )
        SELECT
            v_attempt.student_id,
            v_topic.topic_id,
            agg.tot_ans,
            agg.tot_cor,
            agg.att_cnt,
            CASE
                WHEN agg.att_cnt < 2 OR agg.tot_ans < 6 THEN 'belum_cukup_data'
                WHEN (agg.tot_cor::numeric / NULLIF(agg.tot_ans, 0)) >= 0.80 THEN 'kuat'
                WHEN (agg.tot_cor::numeric / NULLIF(agg.tot_ans, 0)) >= 0.60 THEN 'cukup'
                ELSE 'perlu_latihan'
            END,
            v_now
        FROM agg
        ON CONFLICT (student_id, topic_id) DO UPDATE
        SET answered = EXCLUDED.answered,
            correct = EXCLUDED.correct,
            attempts_counted = EXCLUDED.attempts_counted,
            level = EXCLUDED.level,
            updated_at = v_now;
    END LOOP;

    -- 5. Catat log aktivitas & award XP
    -- Selalu catat kuis_selesai
    PERFORM public.log_activity(
        'kuis_selesai',
        v_chapter.class_id,
        'quizzes',
        v_quiz.id,
        jsonb_build_object(
            'skor', v_score_percent,
            'lulus', v_is_passed,
            'durasi_detik', v_duration_seconds
        )
    );

    -- Bila baru lulus pertama kali
    IF v_is_passed AND v_old_passed IS NULL THEN
        PERFORM public.log_activity(
            'pulau_selesai',
            v_chapter.class_id,
            'class_chapters',
            v_chapter.id,
            '{}'::jsonb
        );

        -- Award 20 XP untuk menyelesaikan pulau bab
        PERFORM public.award_xp(
            v_attempt.student_id,
            v_chapter.class_id,
            'pulau_selesai',
            20,
            'class_chapters',
            v_chapter.id
        );

        -- Cari bab berikutnya untuk notifikasi
        SELECT * INTO v_next_chap
        FROM public.class_chapters
        WHERE class_id = v_chapter.class_id
          AND archived_at IS NULL
          AND position > v_chapter.position
        ORDER BY position ASC
        LIMIT 1;

        IF FOUND THEN
            INSERT INTO public.notifications (
                user_id, type, title, body, entity_type, entity_id, class_id
            ) VALUES (
                v_attempt.student_id,
                'CHAPTER_UNLOCKED',
                'Pulau Berikutnya Terbuka!',
                'Selamat! Kamu telah menyelesaikan ' || v_chapter.title || '. ' || v_next_chap.title || ' kini terbuka.',
                'class_chapters',
                v_next_chap.id,
                v_chapter.class_id
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'attempt_id', p_attempt_id,
        'score', v_score_percent,
        'is_passed', v_is_passed,
        'pass_threshold', v_pass_threshold,
        'first_time_passed', (v_is_passed AND v_old_passed IS NULL)
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC GET_CLASS_MAP (Bagian 7.3 — Sisi Mahasiswa)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_class_map(
    p_class_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_chapters JSONB;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: pengguna belum login';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'position', c.position,
            'title', c.title,
            'summary', c.summary,
            'is_optional', c.is_optional,
            'pass_score', COALESCE(c.pass_score, 70.00),
            'target_date', c.target_date,
            'completion_rule', c.completion_rule,
            'status', public.chapter_state(v_uid, c.id),
            'materials_count', COALESCE(mat.cnt, 0),
            'materials_completed', COALESCE(mat_prog.cnt, 0),
            'quiz', qz.quiz_info,
            'topics', COALESCE(top.topics_info, '[]'::jsonb),
            'has_podcast', false,
            'flashcards_due', 0
        ) ORDER BY c.position ASC
    ) INTO v_chapters
    FROM public.class_chapters c
    -- Total materi per bab
    LEFT JOIN (
        SELECT chapter_id, count(*)::int AS cnt
        FROM public.materials
        WHERE status = 'PUBLISHED'
        GROUP BY chapter_id
    ) mat ON mat.chapter_id = c.id
    -- Materi selesai oleh mahasiswa
    LEFT JOIN (
        SELECT m.chapter_id, count(*)::int AS cnt
        FROM public.material_progress mp
        JOIN public.materials m ON m.id = mp.material_id
        WHERE mp.student_id = v_uid AND mp.status = 'selesai'
        GROUP BY m.chapter_id
    ) mat_prog ON mat_prog.chapter_id = c.id
    -- Kuis bab & progres nilai terbaik
    LEFT JOIN (
        SELECT
            q.chapter_id,
            jsonb_build_object(
                'id', q.id,
                'title', q.title,
                'duration_minutes', q.duration_minutes,
                'best_score', cp.best_score,
                'attempts', COALESCE(cp.attempts, 0),
                'is_passed', (cp.passed_at IS NOT NULL)
            ) AS quiz_info
        FROM public.quizzes q
        LEFT JOIN public.chapter_progress cp ON cp.chapter_id = q.chapter_id AND cp.student_id = v_uid
        WHERE q.kind = 'kuis_bab'
    ) qz ON qz.chapter_id = c.id
    -- Topik & level kekuatan topik mahasiswa
    LEFT JOIN (
        SELECT
            t.chapter_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'name', t.name,
                    'level', COALESCE(tm.level, 'belum_cukup_data')
                )
            ) AS topics_info
        FROM public.chapter_topics t
        LEFT JOIN public.topic_mastery tm ON tm.topic_id = t.id AND tm.student_id = v_uid
        GROUP BY t.chapter_id
    ) top ON top.chapter_id = c.id
    WHERE c.class_id = p_class_id
      AND c.archived_at IS NULL;

    RETURN COALESCE(v_chapters, '[]'::jsonb);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC PROGRES KELAS & TINDAKAN DOSEN (Bagian 7.4 — Sisi Dosen)
-- ----------------------------------------------------------------------------

-- Sebaran mahasiswa per bab (terkunci, terbuka, selesai)
CREATE OR REPLACE FUNCTION public.get_class_chapter_distribution(
    p_class_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_dist JSONB;
BEGIN
    IF NOT (public.is_class_staff(p_class_id) OR public.has_global_role('SUPER_ADMIN')) THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Dosen/Asisten yang dapat mengakses progres kelas';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'chapter_id', c.id,
            'position', c.position,
            'title', c.title,
            'is_optional', c.is_optional,
            'target_date', c.target_date,
            'total_students', COALESCE(st_counts.total, 0),
            'selesai_count', COALESCE(st_counts.selesai, 0),
            'terbuka_count', COALESCE(st_counts.terbuka, 0),
            'terkunci_count', COALESCE(st_counts.terkunci, 0)
        ) ORDER BY c.position ASC
    ) INTO v_dist
    FROM public.class_chapters c
    LEFT JOIN (
        SELECT
            c2.id AS chapter_id,
            count(e.student_id)::int AS total,
            count(e.student_id) FILTER (WHERE public.chapter_state(e.student_id, c2.id) = 'selesai')::int AS selesai,
            count(e.student_id) FILTER (WHERE public.chapter_state(e.student_id, c2.id) = 'terbuka')::int AS terbuka,
            count(e.student_id) FILTER (WHERE public.chapter_state(e.student_id, c2.id) = 'terkunci')::int AS terkunci
        FROM public.class_chapters c2
        CROSS JOIN public.enrollments e
        WHERE e.class_id = p_class_id AND e.status = 'ACTIVE'
        GROUP BY c2.id
    ) st_counts ON st_counts.chapter_id = c.id
    WHERE c.class_id = p_class_id AND c.archived_at IS NULL;

    RETURN COALESCE(v_dist, '[]'::jsonb);
END;
$$;

-- Topik tersulit (hanya tampil bila >= min_aggregate_size mahasiswa pernah mencoba)
CREATE OR REPLACE FUNCTION public.get_hardest_topics(
    p_class_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_min_size INT;
    v_topics JSONB;
BEGIN
    IF NOT (public.is_class_staff(p_class_id) OR public.has_global_role('SUPER_ADMIN')) THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Dosen/Asisten yang dapat mengakses analisis topik kelas';
    END IF;

    v_min_size := COALESCE(
        (SELECT (value)::int FROM public.institution_policies WHERE key = 'min_aggregate_size'),
        5
    );

    SELECT jsonb_agg(
        jsonb_build_object(
            'topic_id', t.id,
            'topic_name', t.name,
            'chapter_title', c.title,
            'student_count', agg.student_count,
            'correct_ratio', round(agg.total_correct::numeric / NULLIF(agg.total_answered, 0), 2)
        ) ORDER BY (agg.total_correct::numeric / NULLIF(agg.total_answered, 0)) ASC
    ) INTO v_topics
    FROM public.chapter_topics t
    JOIN public.class_chapters c ON c.id = t.chapter_id
    JOIN (
        SELECT
            tr.topic_id,
            count(DISTINCT tr.student_id)::int AS student_count,
            sum(tr.answered)::int AS total_answered,
            sum(tr.correct)::int AS total_correct
        FROM public.quiz_attempt_topic_results tr
        JOIN public.exam_attempts a ON a.id = tr.attempt_id
        JOIN public.quizzes q ON q.id = a.quiz_id
        WHERE q.class_id = p_class_id
        GROUP BY tr.topic_id
        HAVING count(DISTINCT tr.student_id) >= v_min_size
    ) agg ON agg.topic_id = t.id
    WHERE c.class_id = p_class_id AND c.archived_at IS NULL
    LIMIT 5;

    RETURN COALESCE(v_topics, '[]'::jsonb);
END;
$$;

-- Buka Pulau Manual oleh Dosen (chapter_unlock_overrides)
CREATE OR REPLACE FUNCTION public.grant_chapter_unlock_override(
    p_chapter_id UUID,
    p_student_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_chap RECORD;
BEGIN
    SELECT * INTO v_chap FROM public.class_chapters WHERE id = p_chapter_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bab tidak ditemukan';
    END IF;

    IF NOT (public.is_class_lecturer(v_chap.class_id) OR public.has_global_role('SUPER_ADMIN')) THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Dosen Pengampu yang berwenang membuka pulau secara manual';
    END IF;

    IF char_length(trim(p_reason)) < 5 THEN
        RAISE EXCEPTION 'Alasan pembukaan pulau manual minimal 5 karakter';
    END IF;

    INSERT INTO public.chapter_unlock_overrides (
        chapter_id, student_id, granted_by, reason
    ) VALUES (
        p_chapter_id, p_student_id, v_uid, trim(p_reason)
    )
    ON CONFLICT (chapter_id, student_id) DO UPDATE
    SET granted_by = v_uid, reason = trim(p_reason), created_at = now();

    -- Catat ke audit log
    INSERT INTO public.audit_logs (
        actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, payload
    ) VALUES (
        v_uid,
        'LECTURER',
        'chapter.manual_unlock',
        'chapter_unlock_overrides',
        p_chapter_id,
        'CLASS',
        v_chap.class_id,
        jsonb_build_object('student_id', p_student_id, 'reason', p_reason)
    );

    -- Kirim notifikasi ke mahasiswa
    INSERT INTO public.notifications (
        user_id, type, title, body, entity_type, entity_id, class_id
    ) VALUES (
        p_student_id,
        'CHAPTER_OVERRIDE_UNLOCKED',
        'Pulau Dibuka oleh Dosen',
        'Dosen pengampu telah membuka akses ' || v_chap.title || ' secara manual untuk Anda.',
        'class_chapters',
        p_chapter_id,
        v_chap.class_id
    );

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- Ingatkan Mahasiswa Tertinggal (Batas 1x dalam 24 jam)
CREATE OR REPLACE FUNCTION public.remind_lagging_student(
    p_class_id UUID,
    p_student_id UUID,
    p_chapter_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_chap RECORD;
    v_recent_notif RECORD;
BEGIN
    IF NOT (public.is_class_lecturer(p_class_id) OR public.has_global_role('SUPER_ADMIN')) THEN
        RAISE EXCEPTION 'Akses ditolak: Asisten tidak berwenang mengirimkan pengingat keterlambatan bab';
    END IF;

    SELECT * INTO v_chap FROM public.class_chapters WHERE id = p_chapter_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bab tidak ditemukan';
    END IF;

    -- Cek rate limit: maksimal 1x per 24 jam per mahasiswa
    SELECT id FROM public.notifications
    WHERE user_id = p_student_id
      AND type = 'CHAPTER_LAGGING_REMINDER'
      AND class_id = p_class_id
      AND created_at > (now() - interval '24 hours')
    LIMIT 1 INTO v_recent_notif;

    IF v_recent_notif.id IS NOT NULL THEN
        RAISE EXCEPTION 'Pengingat hanya dapat dikirim maksimal 1 kali dalam 24 jam kepada mahasiswa yang sama';
    END IF;

    INSERT INTO public.notifications (
        user_id, type, title, body, entity_type, entity_id, class_id
    ) VALUES (
        p_student_id,
        'CHAPTER_LAGGING_REMINDER',
        'Pengingat Belajar',
        'Target ' || v_chap.title || ' di kelas ini sudah lewat. Lanjutkan saat sempat.',
        'class_chapters',
        p_chapter_id,
        p_class_id
    );

    RETURN jsonb_build_object('ok', true);
END;
$$;

COMMIT;
