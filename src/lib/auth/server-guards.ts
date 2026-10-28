import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/current-user';

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

/**
 * Helper utilitas untuk memvalidasi apakah pengguna memiliki salah satu role yang ditentukan.
 * Mampu menangani array string murni, relasi objek DB ({ roles: { code }, role_id }), serta activeRole.
 */
export function hasUserRole(
  userContext: { roles?: any[]; activeRole?: string } | null | undefined,
  role: string | string[]
): boolean {
  if (!userContext) return false;
  const targetRoles = Array.isArray(role) ? role : [role];
  if (userContext.activeRole && targetRoles.includes(userContext.activeRole)) {
    return true;
  }
  if (!Array.isArray(userContext.roles)) return false;
  return userContext.roles.some((r: any) => {
    const code = typeof r === 'string' ? r : (r?.roles?.code || r?.role_id || r?.code);
    return targetRoles.includes(code);
  });
}
