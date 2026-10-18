'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export interface ChapterPodcastData {
  id: string;
  chapter_id: string;
  title: string;
  narrator: 'Pak Dosen' | 'Bu Dosen';
  script_text: string;
  audio_url?: string | null;
  audio_duration_seconds: number;
  transcription_segments?: Array<{ start: number; end: number; text: string }>;
  my_progress?: {
    last_position_seconds: number;
    is_completed: boolean;
  } | null;
}

/**
 * Mengambil podcast bab untuk mahasiswa / dosen
 */
export async function getChapterPodcastAction(
  chapterId: string
): Promise<ChapterPodcastData | null> {
  const user = await getCurrentUserWithRoles();
  if (!user) return null;

  const supabase = await createClient();

  const { data: podcast, error } = await supabase
    .from('chapter_podcasts')
    .select(`
      id,
      chapter_id,
      title,
      narrator,
      script_text,
      audio_url,
      audio_duration_seconds,
      transcription_segments,
      podcast_progress (
        last_position_seconds,
        is_completed
      )
    `)
    .eq('chapter_id', chapterId)
    .eq('script_status', 'disetujui')
    .single();

  if (error || !podcast) return null;

  const prog = Array.isArray(podcast.podcast_progress)
    ? podcast.podcast_progress[0]
    : podcast.podcast_progress;

  return {
    id: podcast.id,
    chapter_id: podcast.chapter_id,
    title: podcast.title,
    narrator: podcast.narrator as any,
    script_text: podcast.script_text,
    audio_url: podcast.audio_url,
    audio_duration_seconds: podcast.audio_duration_seconds || 0,
    transcription_segments: podcast.transcription_segments as any,
    my_progress: prog
      ? {
          last_position_seconds: prog.last_position_seconds || 0,
          is_completed: prog.is_completed || false,
        }
      : null,
  };
}

/**
 * Menyimpan progres dengar podcast dan menandai selesai bila tuntas
 */
export async function savePodcastProgressAction(
  podcastId: string,
  positionSeconds: number,
  isCompleted: boolean
): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login' };

  const supabase = await createClient();

  const { error } = await supabase.rpc('save_podcast_progress', {
    p_podcast_id: podcastId,
    p_position_seconds: positionSeconds,
    p_is_completed: isCompleted,
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
