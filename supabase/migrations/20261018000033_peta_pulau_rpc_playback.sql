-- ============================================================================
-- SIAJAR Migration: 20261018000033_peta_pulau_rpc_playback.sql
-- Penambahan Kolom Podcast, RPC get_podcast_playback, dan Penyempurnaan Privasi
-- ============================================================================

-- 1. Penambahan kolom pendukung pemutar podcast & pekerjaan sintesis TTS
ALTER TABLE public.chapter_podcasts
ADD COLUMN IF NOT EXISTS audio_status TEXT DEFAULT 'belum' CHECK (audio_status IN ('belum', 'menyintesis', 'siap_terbit', 'terbit', 'gagal'));

ALTER TABLE public.chapter_podcasts
ADD COLUMN IF NOT EXISTS audio_chunks JSONB DEFAULT '[]'::jsonb;

-- 2. Kebijakan INSERT untuk activity_logging_prefs
DROP POLICY IF EXISTS activity_logging_prefs_insert ON public.activity_logging_prefs;
CREATE POLICY activity_logging_prefs_insert ON public.activity_logging_prefs
FOR INSERT TO authenticated
WITH CHECK (student_id = (SELECT auth.uid()));

-- 3. RPC Pemutar Podcast (get_podcast_playback)
-- Menegakkan fail-closed: mahasiswa pada bab pulau terkunci atau podcast belum terbit ditolak tegas.
CREATE OR REPLACE FUNCTION public.get_podcast_playback(p_podcast_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_podcast RECORD;
    v_class_id UUID;
    v_chapter_id UUID;
    v_is_lecturer BOOLEAN;
    v_is_ta BOOLEAN;
    v_is_admin BOOLEAN;
    v_unlocked BOOLEAN;
    v_last_pos INT := 0;
    v_is_completed BOOLEAN := false;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: pengguna belum login' USING ERRCODE = 'P0001';
    END IF;

    SELECT p.*, c.class_id
    INTO v_podcast
    FROM public.chapter_podcasts p
    JOIN public.class_chapters c ON c.id = p.chapter_id
    WHERE p.id = p_podcast_id;

    IF v_podcast.id IS NULL THEN
        RAISE EXCEPTION 'Podcast tidak ditemukan' USING ERRCODE = 'P0002';
    END IF;

    v_class_id := v_podcast.class_id;
    v_chapter_id := v_podcast.chapter_id;

    v_is_admin := public.has_global_role('SUPER_ADMIN');
    v_is_lecturer := public.is_class_lecturer(v_class_id);
    v_is_ta := public.is_class_ta(v_class_id);

    -- Jika bukan pengelola (lecturer/ta/admin), periksa status mahasiswa
    IF NOT (v_is_lecturer OR v_is_ta OR v_is_admin) THEN
        -- Harus anggota kelas
        IF NOT public.is_class_member(v_class_id) THEN
            RAISE EXCEPTION 'Akses ditolak: Anda bukan anggota kelas ini' USING ERRCODE = 'P0003';
        END IF;

        -- Fitur podcast harus aktif di kelas
        IF NOT public.feature_enabled(v_class_id, 'podcast') THEN
            RAISE EXCEPTION 'Fitur podcast dinonaktifkan untuk kelas ini' USING ERRCODE = 'P0004';
        END IF;

        -- Podcast harus disetujui atau siap/terbit
        IF v_podcast.script_status <> 'disetujui' AND COALESCE(v_podcast.audio_status, '') NOT IN ('siap_terbit', 'terbit') THEN
            RAISE EXCEPTION 'Podcast belum siap diputar' USING ERRCODE = 'P0005';
        END IF;

        -- Bab harus terbuka bagi mahasiswa ini
        v_unlocked := public.chapter_unlocked(v_uid, v_chapter_id);
        IF NOT v_unlocked THEN
            RAISE EXCEPTION 'Bab ini masih terkunci untuk Anda' USING ERRCODE = 'P0006';
        END IF;
    END IF;

    -- Ambil posisi tersimpan
    SELECT last_position_seconds, is_completed
    INTO v_last_pos, v_is_completed
    FROM public.podcast_progress
    WHERE student_id = v_uid AND podcast_id = p_podcast_id;

    RETURN jsonb_build_object(
        'podcast_id', v_podcast.id,
        'chapter_id', v_chapter_id,
        'class_id', v_class_id,
        'title', v_podcast.title,
        'narrator', v_podcast.narrator,
        'script_text', v_podcast.script_text,
        'transcription_segments', COALESCE(v_podcast.transcription_segments, '[]'::jsonb),
        'audio_url', v_podcast.audio_url,
        'audio_chunks', COALESCE(v_podcast.audio_chunks, '[]'::jsonb),
        'duration_seconds', COALESCE(v_podcast.audio_duration_seconds, 0),
        'last_position_seconds', COALESCE(v_last_pos, 0),
        'is_completed', COALESCE(v_is_completed, false)
    );
END;
$$;

-- 4. RPC Pembersihan Mandiri Riwayat Aktivitas & Rekap Semester (Privasi Mahasiswa)
CREATE OR REPLACE FUNCTION public.clear_my_activity_log()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_deleted_events INT := 0;
    v_deleted_recaps INT := 0;
    v_deleted_podcast_prog INT := 0;
    v_deleted_flashcard_reviews INT := 0;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: pengguna belum login' USING ERRCODE = 'P0001';
    END IF;

    -- Hapus log aktivitas
    DELETE FROM public.activity_events WHERE student_id = v_uid;
    GET DIAGNOSTICS v_deleted_events = ROW_COUNT;

    -- Hapus rekap semester
    DELETE FROM public.semester_recaps WHERE student_id = v_uid;
    GET DIAGNOSTICS v_deleted_recaps = ROW_COUNT;

    -- Hapus progres podcast
    DELETE FROM public.podcast_progress WHERE student_id = v_uid;
    GET DIAGNOSTICS v_deleted_podcast_prog = ROW_COUNT;

    -- Hapus data ulasan flashcard
    DELETE FROM public.flashcard_reviews WHERE student_id = v_uid;
    GET DIAGNOSTICS v_deleted_flashcard_reviews = ROW_COUNT;

    DELETE FROM public.flashcard_review_log WHERE student_id = v_uid;

    RETURN jsonb_build_object(
        'ok', true,
        'deleted_events', v_deleted_events,
        'deleted_recaps', v_deleted_recaps,
        'deleted_podcast_prog', v_deleted_podcast_prog,
        'deleted_flashcard_reviews', v_deleted_flashcard_reviews
    );
END;
$$;
