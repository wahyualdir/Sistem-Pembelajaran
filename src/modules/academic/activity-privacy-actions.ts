'use server';

import { createClient } from '@/lib/supabase/server';

export interface ActivityPrivacyStatus {
  enabled: boolean;
  totalEvents: number;
  countsByKind: Record<string, number>;
  recapCount: number;
}

/**
 * Mengambil status privasi dan ringkasan aktivitas belajar mahasiswa
 */
export async function getActivityPrivacyStatusAction(): Promise<{
  success: boolean;
  status?: ActivityPrivacyStatus;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    // 1. Ambil preferensi pencatatan
    const { data: pref } = await supabase
      .from('activity_logging_prefs')
      .select('enabled')
      .eq('student_id', user.id)
      .maybeSingle();

    const enabled = pref?.enabled ?? true;

    // 2. Ambil ringkasan log aktivitas
    const { data: events } = await supabase
      .from('activity_events')
      .select('kind')
      .eq('student_id', user.id);

    const countsByKind: Record<string, number> = {};
    for (const ev of events || []) {
      countsByKind[ev.kind] = (countsByKind[ev.kind] || 0) + 1;
    }

    // 3. Ambil jumlah rekap semester
    const { count: recapCount } = await supabase
      .from('semester_recaps')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id);

    return {
      success: true,
      status: {
        enabled,
        totalEvents: events?.length || 0,
        countsByKind,
        recapCount: recapCount || 0,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mengambil status privasi.' };
  }
}

/**
 * Mengatur sakelar izin pencatatan aktivitas belajar mandiri
 */
export async function setActivityLoggingAction(enabled: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    const { error } = await supabase.from('activity_logging_prefs').upsert({
      student_id: user.id,
      enabled,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memperbarui preferensi privasi.' };
  }
}

/**
 * Ekspor berkas data riwayat aktivitas belajar mandiri (JSON)
 */
export async function exportActivityDataAction(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    // Ambil log aktivitas
    const { data: events, error: evErr } = await supabase
      .from('activity_events')
      .select('*')
      .eq('student_id', user.id)
      .order('occurred_at', { ascending: false });

    if (evErr) {
      return { success: false, error: evErr.message };
    }

    // Ambil rekap semester
    const { data: recaps } = await supabase
      .from('semester_recaps')
      .select('*')
      .eq('student_id', user.id);

    const exportPayload = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      studentId: user.id,
      activityEventsCount: events?.length || 0,
      activityEvents: events || [],
      semesterRecaps: recaps || [],
      statement:
        'Data ini diekspor secara mandiri oleh mahasiswa sesuai ketentuan UU Pelindungan Data Pribadi dan kebijakan privasi SIAJAR.',
    };

    return { success: true, data: exportPayload };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mengekspor data aktivitas.' };
  }
}

/**
 * Hapus seluruh riwayat aktivitas belajar dan rekap semester (Hard Delete)
 */
export async function clearActivityHistoryAction(): Promise<{
  success: boolean;
  deletedEvents?: number;
  deletedRecaps?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    const { data, error } = await supabase.rpc('clear_my_activity_log');

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      deletedEvents: data?.deleted_events || 0,
      deletedRecaps: data?.deleted_recaps || 0,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus riwayat aktivitas.' };
  }
}

/**
 * Reset seluruh kemajuan flashcard mahasiswa (kembali ke kondisi awal belum dipelajari)
 */
export async function resetFlashcardProgressAction(): Promise<{
  success: boolean;
  deletedReviews?: number;
  deletedLogs?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    const { data, error } = await supabase.rpc('reset_my_flashcard_progress');

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      deletedReviews: data?.deleted_reviews || 0,
      deletedLogs: data?.deleted_logs || 0,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mereset kemajuan flashcard.' };
  }
}
