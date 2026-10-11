import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

/**
 * Server-Side Role Guard (A2 Security Hardening)
 * Memvalidasi wewenang akses rute berdasarkan daftar role resmi dari DATABASE (user_roles / profiles),
 * BUKAN berdasarkan cookie active_role yang dapat dimanipulasi klien.
 *
 * Jika pengguna tidak memiliki role yang diizinkan di DB, segera dialihkan (redirect 307)
 * ke /workspace tanpa merender data administratif apa pun.
 */
export async function assertServerRole(allowedRoles: string[]) {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext) {
    redirect('/login');
  }

  // Ambil kode role tervalidasi dari basis data
  const userRoleCodes: string[] = userContext.roles.map(
    (r: any) => (r.roles as any)?.code || r.role_id
  );

  const hasAuthorizedRole = allowedRoles.some((role) => userRoleCodes.includes(role));
  if (!hasAuthorizedRole) {
    // Tolak akses secara ketat di sisi server (Defense in Depth)
    redirect('/workspace');
  }

  return userContext;
}
