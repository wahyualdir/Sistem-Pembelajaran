'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { INITIAL_BADGES } from '@/lib/config/gamification';

export interface BadgeWithStatus {
  code: string;
  name: string;
  description: string;
  icon: string;
  isEarned: boolean;
  earnedAt?: string | null;
}

export interface StudentAchievementSummary {
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveOn: string | null;
  badges: BadgeWithStatus[];
  showOnLeaderboard: boolean;
  displayAlias: string | null;
}

export async function getStudentAchievementsAction(): Promise<{
  ok: boolean;
  data?: StudentAchievementSummary;
  error?: string;
}> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  const supabase = await createClient();
  const studentId = user.user.id;

  // 1. Total XP
  const { data: xpData } = await supabase
    .from('xp_events')
    .select('points')
    .eq('student_id', studentId);

  const totalXp = (xpData || []).reduce((acc, row) => acc + (row.points || 0), 0);

  // 2. Streaks
  const { data: streakData } = await supabase
    .from('study_streaks')
    .select('current_days, best_days, last_active_on')
    .eq('student_id', studentId)
    .maybeSingle();

  // 3. Badges yang sudah diraih
  const { data: earnedBadges } = await supabase
    .from('student_badges')
    .select('badge_code, awarded_at, earned_at')
    .eq('student_id', studentId);

  const earnedMap = new Map<string, string>();
  (earnedBadges || []).forEach((b) => {
    earnedMap.set(b.badge_code, (b.earned_at || b.awarded_at) as string);
  });

  const badgesWithStatus: BadgeWithStatus[] = INITIAL_BADGES.map((b) => ({
    code: b.code,
    name: b.name,
    description: b.description,
    icon: b.icon,
    isEarned: earnedMap.has(b.code),
    earnedAt: earnedMap.get(b.code) || null,
  }));

  // 4. Prefs
  const { data: prefs } = await supabase
    .from('student_gamification_prefs')
    .select('show_on_leaderboard, display_alias')
    .eq('student_id', studentId)
    .maybeSingle();

  return {
    ok: true,
    data: {
      totalXp,
      currentStreak: streakData?.current_days || 0,
      bestStreak: streakData?.best_days || 0,
      lastActiveOn: streakData?.last_active_on || null,
      badges: badgesWithStatus,
      showOnLeaderboard: prefs?.show_on_leaderboard || false,
      displayAlias: prefs?.display_alias || null,
    },
  };
}

export async function updateStudentGamificationPrefsAction(
  showOnLeaderboard: boolean,
  displayAlias?: string
) {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('student_gamification_prefs')
    .upsert({
      student_id: user.user.id,
      show_on_leaderboard: showOnLeaderboard,
      display_alias: displayAlias?.trim() || null,
    });

  if (error) return { ok: false, error: 'Gagal menyimpan pengaturan.' };

  revalidatePath('/achievements');
  return { ok: true };
}

export async function getClassLeaderboardAction(classId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any).rpc('get_class_leaderboard', {
    p_class_id: classId,
  });

  if (error) {
    return { ok: false, error: error.message || 'Gagal memuat papan peringkat.' };
  }

  return { ok: true, data };
}

export async function updateClassGamificationSettingsAction(
  classId: string,
  enabled: boolean,
  leaderboardEnabled: boolean
) {
  const user = await getCurrentUserWithRoles();
  if (!user || (user.activeRole !== 'LECTURER' && user.activeRole !== 'SUPER_ADMIN')) {
    return { ok: false, error: 'Hanya dosen pengampu yang dapat mengatur papan peringkat kelas.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('class_gamification_settings')
    .upsert({
      class_id: classId,
      enabled,
      leaderboard_enabled: leaderboardEnabled,
    });

  if (error) return { ok: false, error: 'Gagal memperbarui pengaturan gamifikasi kelas.' };

  revalidatePath(`/classes/${classId}`);
  return { ok: true };
}

export async function awardXpAction(
  studentId: string,
  classId: string | null,
  kind: string,
  points: number,
  refType: string,
  refId: string
) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any).rpc('award_xp', {
    p_student_id: studentId,
    p_class_id: classId,
    p_kind: kind,
    p_points: points,
    p_ref_type: refType,
    p_ref_id: refId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}
