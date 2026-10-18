'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  buildSemesterRecap,
  type SemesterRecapPayload,
  type StudentRawSemesterStats,
} from '@/lib/akademik/semester-recap';

export {
  buildSemesterRecap,
  type SemesterRecapPayload,
  type StudentRawSemesterStats,
};

/**
 * Mengambil ringkasan Rekap Semester mahasiswa
 */
export async function getStudentSemesterRecapAction(
  semesterLabel: string = 'Semester Ganjil 2026/2027'
): Promise<SemesterRecapPayload | null> {
  const user = await getCurrentUserWithRoles();
  if (!user) return null;

  const supabase = await createClient();

  // 1. Cek cache rekap semester tersimpan
  const { data: cached } = await supabase
    .from('semester_recaps')
    .select('payload')
    .eq('student_id', user.user.id)
    .eq('semester_id', semesterLabel)
    .single();

  if (cached?.payload) {
    return cached.payload as SemesterRecapPayload;
  }

  // 2. Kumpulkan metrik aktual mahasiswa
  // Bab diselesaikan
  const { count: passedChaptersCount } = await supabase
    .from('chapter_progress')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.user.id)
    .eq('is_completed', true);

  // Total bab tersedia
  const { count: totalChaptersCount } = await supabase
    .from('class_chapters')
    .select('*', { count: 'exact', head: true })
    .is('archived_at', null);

  // Topik dikuasai
  const { data: topics } = await supabase
    .from('topic_mastery')
    .select('level, chapter_topics(name)')
    .eq('student_id', user.user.id);

  const topicsMastery = (topics || []).map((t: any) => ({
    name: t.chapter_topics?.name || 'Topik',
    level: t.level,
  }));

  // Total kartu diulas
  const { count: flashcardsCount } = await supabase
    .from('flashcard_review_log')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.user.id);

  // Total detik podcast didengarkan
  const { data: podcasts } = await supabase
    .from('podcast_progress')
    .select('last_position_seconds')
    .eq('student_id', user.user.id);

  const totalPodcastSec = (podcasts || []).reduce(
    (acc: number, cur: any) => acc + (cur.last_position_seconds || 0),
    0
  );

  // Bantuan rekan diterima
  const { count: peerHelpCount } = await supabase
    .from('skill_responses')
    .select('*', { count: 'exact', head: true })
    .eq('responder_id', user.user.id)
    .eq('is_accepted', true);

  // Total XP
  const { data: xpData } = await supabase
    .from('xp_events')
    .select('xp')
    .eq('student_id', user.user.id);

  const totalXp = (xpData || []).reduce((acc: number, cur: any) => acc + (cur.xp || 0), 0);

  const rawStats: StudentRawSemesterStats = {
    studentName: user.profile?.full_name || 'Mahasiswa',
    semesterLabel,
    totalChaptersPassed: passedChaptersCount || 0,
    totalChaptersAvailable: Math.max(passedChaptersCount || 0, totalChaptersCount || 1),
    topicsMastery,
    flashcardsReviewedCount: flashcardsCount || 0,
    podcastSecondsListened: totalPodcastSec,
    peerHelpAcceptedCount: peerHelpCount || 0,
    totalXp: totalXp || 120,
  };

  const payload = buildSemesterRecap(rawStats);

  // Simpan ke semester_recaps
  await supabase.from('semester_recaps').upsert({
    student_id: user.user.id,
    semester_id: semesterLabel,
    payload,
    created_at: new Date().toISOString(),
  });

  return payload;
}
