// ============================================================================
// Guard Lingkungan & Keselamatan Seed Akademik (Fail-Closed)
// Spesifikasi: docs/INSTRUKSI_SEED_AKADEMIK.md (Bagian 2)
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';

export interface GuardConfig {
  seedEnv?: string;
  seedConfirmProjectRef?: string;
  nodeEnv?: string;
  vercelEnv?: string;
  seedPassword?: string;
  supabaseUrl?: string;
  allowExistingUsers?: boolean;
}

export function extractProjectRefFromUrl(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return 'local';
    }
    // format: https://<project-ref>.supabase.co
    const parts = parsed.hostname.split('.');
    if (parts.length >= 3 && parts[1] === 'supabase' && parts[2] === 'co') {
      return parts[0];
    }
    return parsed.hostname;
  } catch {
    return '';
  }
}

export function assertSafetyGuard(config: GuardConfig): void {
  const {
    seedEnv,
    seedConfirmProjectRef,
    nodeEnv,
    vercelEnv,
    seedPassword,
    supabaseUrl,
  } = config;

  // 1. Larang lingkungan produksi secara mutlak
  if (nodeEnv === 'production' || vercelEnv === 'production') {
    throw new Error(
      'EKSEKUSI DITOLAK (FAIL-CLOSED): Skrip seed tidak boleh dijalankan saat NODE_ENV atau VERCEL_ENV adalah "production".'
    );
  }

  // 2. SEED_ENV harus tepat bernilai 'local' atau 'staging'
  if (!seedEnv || (seedEnv !== 'local' && seedEnv !== 'staging')) {
    throw new Error(
      `EKSEKUSI DITOLAK (FAIL-CLOSED): SEED_ENV harus bernilai tepat "local" atau "staging". Nilai saat ini: "${seedEnv || '<kosong>'}"`
    );
  }

  // 3. SEED_CONFIRM_PROJECT_REF harus cocok dengan ref proyek dari NEXT_PUBLIC_SUPABASE_URL
  const expectedRef = extractProjectRefFromUrl(supabaseUrl);
  if (!seedConfirmProjectRef || seedConfirmProjectRef !== expectedRef) {
    throw new Error(
      `EKSEKUSI DITOLAK (FAIL-CLOSED): SEED_CONFIRM_PROJECT_REF ("${seedConfirmProjectRef || '<kosong>'}") tidak cocok dengan ref proyek basis data target ("${expectedRef || '<tidak diketahui>'}").`
    );
  }

  // 4. SEED_PASSWORD harus disediakan dan minimal 12 karakter
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error(
      'EKSEKUSI DITOLAK (FAIL-CLOSED): SEED_PASSWORD harus disetel pada environment variabel dan memiliki panjang minimal 12 karakter.'
    );
  }
}

export async function assertNoRealUsersInDatabase(
  supabaseAdmin: SupabaseClient,
  allowExisting: boolean
): Promise<void> {
  if (allowExisting) {
    return;
  }

  // Ambil daftar pengguna yang ada di auth.users lewat Admin API
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (error) {
    // Jika tidak dapat mengakses auth.admin, lempar error demi keamanan
    throw new Error(`Gagal memverifikasi pengguna yang ada di database: ${error.message}`);
  }

  const users = data?.users || [];
  const foreignUsers = users.filter((u) => {
    const email = u.email || '';
    return !(
      email.endsWith('@mhs.siajar.test') ||
      email.endsWith('@dosen.siajar.test') ||
      email.endsWith('@staf.siajar.test')
    );
  });

  if (foreignUsers.length > 0) {
    throw new Error(
      `EKSEKUSI DITOLAK (FAIL-CLOSED): Ditemukan ${foreignUsers.length} pengguna dengan email non-demo (.test) di database target. Untuk mencegah kerusakan data pengguna sungguhan, eksekusi dihentikan. Berikan SEED_ALLOW_EXISTING_USERS=true bila Anda yakin.`
    );
  }
}
