import { normalizeRoleCode } from '@/lib/config/menu-config';

export interface RoleRedirectInput {
  pathname: string;
  search?: string; // contoh: '?tab=kelola'
  activeRole?: string | null;
  isImpersonating: boolean;
}

export const ROLE_PORTAL_MAP: Record<string, string> = {
  STUDENT: '/student',
  LECTURER: '/lecturer',
  TEACHING_ASSISTANT: '/ta',
  PROGRAM_COORDINATOR: '/coordinator',
  ACADEMIC_STAFF: '/staff',
  SYSTEM_ADMIN: '/admin/system',
  SUPER_ADMIN: '/admin',
  PROGRAM_SECRETARY: '/secretary',
  LAB_HEAD: '/lab',
};

export const PORTAL_PREFIXES = [
  '/student',
  '/lecturer',
  '/ta',
  '/coordinator',
  '/staff',
  '/admin',
  '/secretary',
  '/lab',
];

export const ACADEMIC_ROUTES = [
  '/attendance',
  '/analytics',
  '/grades',
  '/exams',
  '/classes',
  '/coordinator',
  '/secretary',
  '/lab',
];

/**
 * Logika murni penentuan redirect berbasis role dan path (Langkah 4 middleware).
 * Mengembalikan path tujuan redirect jika path tidak diizinkan untuk activeRole,
 * atau null jika path diizinkan.
 */
export function decideRoleRedirect(input: RoleRedirectInput): string | null {
  const { pathname, search, activeRole, isImpersonating } = input;
  if (!activeRole) {
    return null;
  }

  const normalizedRole = normalizeRoleCode(activeRole);
  const searchParams = new URLSearchParams(search ? (search.startsWith('?') ? search.slice(1) : search) : '');
  const tabParam = searchParams.get('tab');

  // A2: SYSTEM_ADMIN dilarang membuka rute data akademik & portal non-admin
  if (normalizedRole === 'SYSTEM_ADMIN') {
    const isAcademic =
      ACADEMIC_ROUTES.some((route) => pathname.startsWith(route)) ||
      pathname.startsWith('/student') ||
      pathname.startsWith('/lecturer') ||
      pathname.startsWith('/ta') ||
      pathname.startsWith('/staff') ||
      pathname === '/admin' ||
      (pathname === '/library' && tabParam === 'kelola');

    if (isAcademic) {
      return '/admin/system';
    }
  }

  // A2: SUPER_ADMIN tidak merender tampilan dosen/mahasiswa/akademik kecuali sesi impersonate aktif
  if (normalizedRole === 'SUPER_ADMIN' && !isImpersonating) {
    const isAcademicOrRolePortal =
      ACADEMIC_ROUTES.some((route) => pathname.startsWith(route)) ||
      pathname.startsWith('/student') ||
      pathname.startsWith('/lecturer') ||
      pathname.startsWith('/ta') ||
      pathname.startsWith('/staff') ||
      (pathname === '/library' && tabParam === 'kelola');

    if (isAcademicOrRolePortal) {
      return '/admin';
    }
  }

  const expectedPrefix = ROLE_PORTAL_MAP[normalizedRole];
  const matchedPrefix = PORTAL_PREFIXES.find((p) => pathname.startsWith(p));
  if (matchedPrefix && expectedPrefix && !expectedPrefix.startsWith(matchedPrefix) && matchedPrefix !== expectedPrefix) {
    return expectedPrefix;
  }

  return null;
}
