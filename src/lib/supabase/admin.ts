import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key';

/**
 * Klien Supabase Administratif (Service Role).
 * HANYA DIGUNAKAN DI SISI SERVER untuk operasi terisolasi:
 * - Pencarian identifier (NIM/NIDN/email) sebelum login
 * - Background job, sinkronisasi token, dan audit administratif.
 * TIDAK PERNAH DIEKSPOR KE KLIEN ATAU DIGUNAKAN OLEH AI AGENT.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
