'use server';

import { createClient } from '@/lib/supabase/server';

export interface PodcastPlaybackData {
  podcast_id: string;
  chapter_id: string;
  class_id: string;
  title: string;
  narrator: string;
  script_text: string;
  transcription_segments: { text: string; materialId?: string; section?: string; wordCount?: number }[];
  audio_url?: string;
  audio_chunks?: { chunkIndex: number; audioUrl: string; durationSeconds: number }[];
  duration_seconds: number;
  last_position_seconds: number;
  is_completed: boolean;
}

/**
 * Mengambil data pemutaran podcast melalui RPC get_podcast_playback
 * Menegakkan fail-closed bila bab masih terkunci atau podcast belum terbit.
 */
export async function getPodcastPlaybackAction(podcastId: string): Promise<{
  success: boolean;
  data?: PodcastPlaybackData;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_podcast_playback', {
      p_podcast_id: podcastId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const playbackData = data as PodcastPlaybackData;
    if (playbackData?.class_id) {
      try {
        await supabase.rpc('log_activity', {
          p_kind: 'podcast_diputar',
          p_class_id: playbackData.class_id,
          p_ref_type: 'podcast',
          p_ref_id: podcastId,
          p_meta: {},
        });
      } catch {
        // Abaikan
      }
    }

    return { success: true, data: playbackData };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memuat pemutar podcast.' };
  }
}

/**
 * Menyimpan progres putar podcast mahasiswa ke podcast_progress
 * Menyimpan setiap interval debounce 10 detik dan mencatat kejadian aktivitas.
 */
export async function savePodcastProgressAction(
  podcastId: string,
  classId: string,
  chapterId: string,
  positionSeconds: number,
  totalDurationSeconds: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    const isCompleted = totalDurationSeconds > 0 && positionSeconds >= Math.floor(totalDurationSeconds * 0.9);

    const { error: upsertErr } = await supabase.from('podcast_progress').upsert({
      student_id: user.id,
      podcast_id: podcastId,
      last_position_seconds: Math.round(positionSeconds),
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      return { success: false, error: upsertErr.message };
    }

    // Catat log aktivitas belajar mandiri secara aman via RPC log_activity (Lampiran D: podcast_selesai tanpa meta)
    if (isCompleted) {
      await supabase.rpc('log_activity', {
        p_kind: 'podcast_selesai',
        p_class_id: classId,
        p_ref_type: 'podcast',
        p_ref_id: podcastId,
        p_meta: {},
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan progres podcast.' };
  }
}
