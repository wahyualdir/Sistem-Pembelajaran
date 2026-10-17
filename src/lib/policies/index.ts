// Layanan dan Helper Kebijakan Akademik Institusi SIAJAR
// Mengacu pada Dokumen Instruksi Antigravity Versi 2 (Bagian 8.1 & Lampiran A)

import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { recordSystemAuditLog } from '@/lib/audit';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';

export interface InstitutionPolicyItem<T = any> {
  key: string;
  value: T;
  description: string;
  group: 'akademik' | 'kehadiran' | 'ujian' | 'perkuliahan' | 'sistem';
  updated_at?: string;
  updated_by?: string | null;
}

export const DEFAULT_INSTITUTION_POLICIES: Record<string, { value: any; description: string; group: InstitutionPolicyItem['group'] }> = {
  min_attendance_percent: {
    value: 75,
    description: 'Batas minimum persentase kehadiran mahasiswa untuk mengikuti ujian.',
    group: 'kehadiran',
  },
  attendance_excused_mode: {
    value: 'exclude',
    description: 'Perhitungan kehadiran berstatus izin atau sakit (exclude: dikeluarkan dari penyebut, include: dihitung hadir).',
    group: 'kehadiran',
  },
  dispute_window_days: {
    value: 7,
    description: 'Batas hari pengajuan sanggah nilai setelah nilai dipublikasikan.',
    group: 'akademik',
  },
  absence_request_max_backdate_days: {
    value: 7,
    description: 'Batas hari pengajuan izin susulan setelah hari ketidakhadiran.',
    group: 'kehadiran',
  },
  sick_requires_attachment: {
    value: true,
    description: 'Kewajiban melampirkan surat keterangan dokter untuk izin sakit.',
    group: 'kehadiran',
  },
  absence_proof_retention_days: {
    value: 180,
    description: 'Masa retensi berkas bukti izin atau sakit (hari) sebelum dibersihkan.',
    group: 'kehadiran',
  },
  journal_deadline_days: {
    value: 3,
    description: 'Batas hari pengisian berita acara dan jurnal mengajar dosen setelah sesi perkuliahan.',
    group: 'perkuliahan',
  },
  exam_grace_seconds: {
    value: 20,
    description: 'Tenggat toleransi detik penyerahan ujian saat koneksi internet terputus.',
    group: 'ujian',
  },
  evaluation_min_respondents: {
    value: 5,
    description: 'Batas minimum responden mahasiswa sebelum hasil EDOM dapat dilihat dosen.',
    group: 'akademik',
  },
  consultation_cancel_min_hours: {
    value: 2,
    description: 'Batas jam pembatalan jadwal konsultasi sebelum waktu pelaksanaan.',
    group: 'perkuliahan',
  },
  consultation_max_future_days: {
    value: 30,
    description: 'Batas hari ke depan mahasiswa dapat membuat janji konsultasi.',
    group: 'perkuliahan',
  },
  meeting_join_window_minutes: {
    value: 15,
    description: 'Rentang menit sebelum dan sesudah jadwal kuliah daring tombol bergabung dibuka.',
    group: 'perkuliahan',
  },
  meeting_allowed_hosts: {
    value: [
      'meet.google.com',
      'zoom.us',
      'teams.microsoft.com',
      'teams.live.com',
      'meet.jit.si',
      'youtube.com',
      'youtu.be',
      'drive.google.com',
    ],
    description: 'Daftar hostname tautan konferensi video dan rekaman kuliah yang diizinkan.',
    group: 'perkuliahan',
  },
  class_archive_after_days: {
    value: 30,
    description: 'Batas hari setelah semester berakhir kelas otomatis diarsipkan.',
    group: 'sistem',
  },
  auto_archive_enabled: {
    value: false,
    description: 'Status pengarsipan otomatis kelas oleh sistem.',
    group: 'sistem',
  },
  student_access_archived_days: {
    value: 365,
    description: 'Masa akses mahasiswa terhadap materi dan tugas di kelas yang diarsipkan (hari).',
    group: 'sistem',
  },
  gamification_enabled: {
    value: true,
    description: 'Mengaktifkan lencana capaian dan gamifikasi akademik ringan.',
    group: 'sistem',
  },
  coding_autograder_enabled: {
    value: false,
    description: 'Mengaktifkan auto-grader eksternal untuk soal koding live.',
    group: 'ujian',
  },
  similarity_default_threshold: {
    value: 0.6,
    description: 'Ambang batas kesamaan teks bawaan untuk penandaan plagiarisme.',
    group: 'akademik',
  },
  cpmk_pass_threshold: {
    value: 60,
    description: 'Nilai ambang batas ketercapaian CPMK (skala 100).',
    group: 'akademik',
  },
  ai_reminders_enabled: {
    value: true,
    description: 'Mengaktifkan pengingat otomatis proaktif oleh asisten AI.',
    group: 'sistem',
  },
};

// Cache memory pendek (maksimal 60 detik)
const policyCache = new Map<string, { value: any; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000;

/**
 * Membaca kebijakan akademik terkonfigurasi dengan cache 60 detik dan fallback aman bawaan.
 */
export async function getPolicy<T = any>(key: string): Promise<T> {
  const now = Date.now();
  const cached = policyCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const defaultValue = DEFAULT_INSTITUTION_POLICIES[key]?.value;

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('institution_policies')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!error && data && data.value !== undefined && data.value !== null) {
        const val = data.value as T;
        policyCache.set(key, { value: val, expiresAt: now + CACHE_TTL_MS });
        return val;
      }
    }
  } catch {
    // Fail-safe ke nilai default
  }

  // Gunakan default aman
  const fallback = (defaultValue !== undefined ? defaultValue : null) as T;
  policyCache.set(key, { value: fallback, expiresAt: now + CACHE_TTL_MS });
  return fallback;
}

/**
 * Mengambil seluruh kebijakan untuk halaman manajemen institusi.
 */
export async function getAllPoliciesAction(): Promise<InstitutionPolicyItem[]> {
  const items: InstitutionPolicyItem[] = [];
  const dbPolicies = new Map<string, { value: any; description?: string; updated_at?: string; updated_by?: string | null }>();

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('institution_policies')
        .select('*');

      if (!error && data) {
        for (const row of data) {
          dbPolicies.set(row.key, {
            value: row.value,
            description: row.description || undefined,
            updated_at: row.updated_at,
            updated_by: row.updated_by,
          });
        }
      }
    }
  } catch {
    // Abaikan galat, fallback ke default
  }

  for (const [key, meta] of Object.entries(DEFAULT_INSTITUTION_POLICIES)) {
    const fromDb = dbPolicies.get(key);
    items.push({
      key,
      value: fromDb ? fromDb.value : meta.value,
      description: fromDb?.description || meta.description,
      group: meta.group,
      updated_at: fromDb?.updated_at,
      updated_by: fromDb?.updated_by,
    });
  }

  return items;
}

/**
 * Menyimpan pembaruan kebijakan akademik. Hanya SUPER_ADMIN atau SYSTEM_ADMIN.
 * Mencatat audit log dengan nilai sebelum dan sesudah.
 */
export async function updatePolicyAction(
  key: string,
  newValue: any
): Promise<ActionResponse<{ key: string; value: any }>> {
  const authState = await getCurrentUserWithRoles();
  if (!authState) {
    return { ok: false, error: 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.' };
  }

  const isSuperAdmin = authState.roles.includes('SUPER_ADMIN');
  const isSysAdmin = authState.roles.includes('SYSTEM_ADMIN');
  if (!isSuperAdmin && !isSysAdmin) {
    return { ok: false, error: 'Hanya Administrator yang memiliki wewenang mengubah kebijakan institusi.' };
  }

  const oldValue = await getPolicy(key);

  try {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      const supabase = await createClient();
      const { error } = await supabase
        .from('institution_policies')
        .upsert({
          key,
          value: newValue,
          description: DEFAULT_INSTITUTION_POLICIES[key]?.description || 'Kebijakan institusi',
          updated_by: authState.user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) {
        return { ok: false, error: `Gagal menyimpan kebijakan: ${error.message}` };
      }
    }

    // Perbarui cache lokal
    policyCache.set(key, { value: newValue, expiresAt: Date.now() + CACHE_TTL_MS });

    // Catat audit log sensitif
    await recordSystemAuditLog({
      actorId: authState.user.id,
      actorName: authState.profile?.full_name || authState.user.email || 'Admin',
      actorRole: authState.activeRole,
      action: 'institution_policy.update',
      entityType: 'institution_policies',
      entityId: key,
      description: 'Pembaruan kebijakan institusi',
      scopeType: 'GLOBAL',
      scopeId: null,
      valueBefore: JSON.stringify(oldValue),
      valueAfter: JSON.stringify(newValue),
    });

    return { ok: true, data: { key, value: newValue } };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Terjadi kesalahan saat menyimpan kebijakan.' };
  }
}
