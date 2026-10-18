'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { maskCellIfBelowThreshold } from '@/lib/akademik/semester-recap';

export interface KaprodiReportItem {
  class_id: string;
  class_title: string;
  lecturer_name: string;
  is_peta_enabled: boolean;
  is_flashcard_enabled: boolean;
  is_podcast_enabled: boolean;
  is_tukar_keahlian_enabled: boolean;
  total_chapters: number;
  total_students: number;
  avg_completion_pct: string;
  is_masked: boolean;
}

/**
 * Mengambil rekapitulasi adopsi Peta Pulau untuk Kaprodi & Superadmin
 * Menerapkan penyamaran privasi K-Anonymity (N < 5 di-mask)
 */
export async function getKaprodiAdoptionReportAction(): Promise<{
  ok: boolean;
  message?: string;
  items: KaprodiReportItem[];
}> {
  const user = await getCurrentUserWithRoles();
  if (!user) return { ok: false, message: 'Belum login', items: [] };

  const role = user.activeRole;
  if (role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    return { ok: false, message: 'Akses ditolak: Hanya untuk Kaprodi atau Super Admin', items: [] };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_kaprodi_adoption_report');

  if (error || !data) {
    return { ok: false, message: error?.message || 'Gagal memuat laporan', items: [] };
  }

  const mapped: KaprodiReportItem[] = (data as any[]).map((row) => {
    const studentCount = Number(row.total_students) || 0;
    const isMasked = studentCount < 5;
    const completionStr = isMasked
      ? (maskCellIfBelowThreshold(studentCount, `${row.avg_completion_pct}%`) as string)
      : `${row.avg_completion_pct ?? 0}%`;

    return {
      class_id: row.class_id,
      class_title: row.class_title,
      lecturer_name: row.lecturer_name,
      is_peta_enabled: !!row.is_peta_enabled,
      is_flashcard_enabled: !!row.is_flashcard_enabled,
      is_podcast_enabled: !!row.is_podcast_enabled,
      is_tukar_keahlian_enabled: !!row.is_tukar_keahlian_enabled,
      total_chapters: Number(row.total_chapters) || 0,
      total_students: studentCount,
      avg_completion_pct: completionStr,
      is_masked: isMasked,
    };
  });

  return { ok: true, items: mapped };
}
