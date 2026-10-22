-- =============================================================================
-- SIAJAR Migration: 20261019000035_perf_indexes_and_resilience.sql
-- Optimasi Indeks Komposit untuk Evaluasi Kebijakan RLS & Kueri Latar Belakang (Fase 1)
-- =============================================================================

-- 1. Indeks Cepat untuk Evaluasi Hak Akses (is_class_member, is_class_ta, is_class_lecturer)
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
    ON public.user_roles (user_id, status, scope_type, scope_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_lookup 
    ON public.enrollments (student_id, class_id, status);

CREATE INDEX IF NOT EXISTS idx_class_assistants_lookup 
    ON public.class_assistants (user_id, class_id);

-- 2. Indeks Notifikasi (Pengambilan Cepat Unread & Deduplikasi Idempoten)
CREATE INDEX IF NOT EXISTS idx_notifications_unread_fast 
    ON public.notifications (user_id, created_at DESC) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_dedup 
    ON public.notifications (dedup_key) WHERE dedup_key IS NOT NULL;

-- 3. Indeks Antrean Pekerjaan Latar Belakang & Cron Jobs
CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_status_created 
    ON public.ai_generation_jobs (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chapter_podcasts_audio_status 
    ON public.chapter_podcasts (audio_status);

-- 4. Indeks Aktivitas, Flashcards, dan Percobaan CBT
CREATE INDEX IF NOT EXISTS idx_activity_events_student_class_created 
    ON public.activity_events (student_id, class_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_status 
    ON public.flashcards (deck_id, status);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_quiz 
    ON public.exam_attempts (student_id, quiz_id, status);
