import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { parseSignedSession } from '@/lib/auth/session';
import { navDebug } from '@/lib/auth/nav-debug';
import { normalizeRoleCode } from '@/lib/config/menu-config';
import { SYNTHETIC_DEMO_USERS } from './demo-users';
import {
  type ImpersonationTokenPayload,
  verifyImpersonationToken,
} from './impersonation-token';

export interface CurrentUserContext {
  user: { id: string; email: string };
  profile: any;
  roles: any[];
  activeRole: string;
  isImpersonating: boolean;
  impersonatingFrom: string | null;
  isNewAccount: boolean;
}

export type AuthResolutionStatus = 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'UNAVAILABLE';
export type RolesResolutionStatus = 'OK' | 'EMPTY' | 'ERROR';

export interface UserResolutionResult {
  status: AuthResolutionStatus;
  rolesStatus: RolesResolutionStatus;
  roleCookieMismatch: boolean;
  context: CurrentUserContext | null;
}

// In Next.js Server Components, React's cache() guarantees deduplication per request.
// In test environments where React runs without react-server condition, fallback to pass-through.
const dedupe = typeof cache === 'function' ? cache : <T extends (...args: unknown[]) => unknown>(fn: T): T => fn;

interface UserProfileCacheItem {
  profile: unknown;
  rolesList: unknown[];
  timestamp: number;
}
const userProfileCache: Map<string, UserProfileCacheItem> = ((globalThis as unknown as { __siajarUserProfileCache?: Map<string, UserProfileCacheItem> }).__siajarUserProfileCache ??= new Map());

/**
 * Resolusi status identitas dan peran pengguna secara komprehensif.
 * Membedakan status autentikasi (AUTHENTICATED / UNAUTHENTICATED / UNAVAILABLE)
 * serta status peran (OK / EMPTY / ERROR) untuk mencegah silent fallback ke STUDENT.
 */
export const getCurrentUserResolution = dedupe(async (): Promise<UserResolutionResult> => {
  let cookieStore: ReturnType<typeof cookies>;
  let demoSessionId: string | undefined;
  try {
    cookieStore = cookies();
    demoSessionId = cookieStore.get('demo_session')?.value;
  } catch {
    return {
      status: 'UNAUTHENTICATED',
      rolesStatus: 'EMPTY',
      roleCookieMismatch: false,
      context: null,
    };
  }

  let realUserId: string | null = null;
  let userEmail: string = '';

  const hasSupabaseCookie = cookieStore.getAll().some((c) => c.name.startsWith('sb-'));
  const isOnline = hasSupabaseCookie ? await checkSupabaseOnline() : false;
  if (isOnline) {
    try {
      const supabase = await createServerSupabase();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authError && user) {
        realUserId = user.id;
        userEmail = user.email || '';
      }
    } catch {
      // Supabase offline
    }
  }

  // Di production, demo_session HANYA diterima jika ALLOW_DEMO_AUTH === 'true'.
  const isProd = process.env.NODE_ENV === 'production';
  const allowDemo = !isProd || process.env.ALLOW_DEMO_AUTH === 'true';

  if (!realUserId && demoSessionId && allowDemo) {
    realUserId = demoSessionId;
  }

  if (!realUserId) {
    // Jika ada cookie supabase tetapi Supabase sedang offline / tidak bisa dihubungi,
    // tandai sebagai UNAVAILABLE agar tidak dianggap logout paksa.
    if (hasSupabaseCookie && !isOnline) {
      return {
        status: 'UNAVAILABLE',
        rolesStatus: 'ERROR',
        roleCookieMismatch: false,
        context: null,
      };
    }
    return {
      status: 'UNAUTHENTICATED',
      rolesStatus: 'EMPTY',
      roleCookieMismatch: false,
      context: null,
    };
  }

  // A3a: Identitas efektif dari impersonation token...
  const impersonationToken = cookieStore.get('impersonation_token')?.value;
  let verifiedPayload: ImpersonationTokenPayload | null = null;
  let isImpersonating = false;
  let impersonatingFrom: string | null = null;
  let effectiveUserId = realUserId;

  if (impersonationToken) {
    verifiedPayload = verifyImpersonationToken(impersonationToken);
    if (verifiedPayload && verifiedPayload.originalAdminId === realUserId) {
      let isOriginalSuperAdmin = false;
      if (isOnline) {
        try {
          const { data: adminRoles } = await supabaseAdmin
            .from('user_roles')
            .select('roles(code), role_id')
            .eq('user_id', verifiedPayload.originalAdminId)
            .eq('status', 'ACTIVE');
          isOriginalSuperAdmin = !!adminRoles?.some(
            (r: any) => normalizeRoleCode(r.roles?.code || r.role_id) === 'SUPER_ADMIN'
          );
        } catch {
          // DB offline
        }
      }
      if (!isOriginalSuperAdmin && !isOnline && allowDemo) {
        const adminDemo = Object.values(SYNTHETIC_DEMO_USERS).find(
          (u) => u.id === verifiedPayload!.originalAdminId
        );
        isOriginalSuperAdmin = !!adminDemo?.roles.some((r) => normalizeRoleCode(r) === 'SUPER_ADMIN');
      }

      if (isOriginalSuperAdmin) {
        effectiveUserId = verifiedPayload.targetUserId;
        isImpersonating = true;
        impersonatingFrom = verifiedPayload.originalAdminId;
      }
    }
  }

  try {
    if (!isImpersonating && cookieStore.has('impersonation_token')) {
      cookieStore.delete('impersonation_token');
    }
    if (cookieStore.has('impersonating_from')) {
      cookieStore.delete('impersonating_from');
    }
    if (cookieStore.has('impersonating_expires_at')) {
      cookieStore.delete('impersonating_expires_at');
    }
  } catch {
    // Read-only context di Server Components
  }

  const userId = effectiveUserId;

  const matchedDemo = allowDemo
    ? (SYNTHETIC_DEMO_USERS[userId] ||
       SYNTHETIC_DEMO_USERS[userId.toLowerCase()] ||
       Object.values(SYNTHETIC_DEMO_USERS).find(
         (u) =>
           u.id === userId ||
           u.nim === userId ||
           u.nidn === userId ||
           u.email?.toLowerCase() === userId.toLowerCase()
       ))
    : null;

  let profile = matchedDemo
    ? {
        id: matchedDemo.id,
        full_name: matchedDemo.name,
        email: matchedDemo.email,
        status: matchedDemo.status,
        must_change_password: !!matchedDemo.mustChangePassword,
      }
    : null;

  let rolesList: any[] = [];
  let rolesStatus: RolesResolutionStatus = 'EMPTY';
  let source: 'db' | 'demo' | 'none' = 'none';
  let roleCodesFromDb: string[] = [];
  const cachedUser = userProfileCache.get(userId);
  const now = Date.now();

  if (cachedUser && now - cachedUser.timestamp < 15000) {
    profile = cachedUser.profile;
    rolesList = cachedUser.rolesList;
    roleCodesFromDb = rolesList.map((r) => (r.roles as any)?.code || r.role_id);
    source = 'db';
    rolesStatus = rolesList.length > 0 ? 'OK' : 'EMPTY';
  } else if (isOnline) {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        supabaseAdmin
          .from('user_roles')
          .select('id, role_id, scope_type, scope_id, roles(code, name, description)')
          .eq('user_id', userId)
          .eq('status', 'ACTIVE'),
      ]);

      if (rolesRes.error) {
        rolesStatus = 'ERROR';
      } else if (rolesRes.data && rolesRes.data.length > 0) {
        rolesList = rolesRes.data;
        roleCodesFromDb = rolesList.map((r) => (r.roles as any)?.code || r.role_id);
        source = 'db';
        rolesStatus = 'OK';
      } else {
        rolesStatus = 'EMPTY';
      }

      if (profileRes.data) {
        profile = profileRes.data;
      }
      if (profile && rolesStatus === 'OK') {
        userProfileCache.set(userId, { profile, rolesList, timestamp: now });
      }
    } catch {
      rolesStatus = 'ERROR';
    }
  }

  // Fallback peran demo hanya jika autentikasi demo diizinkan dan query DB bukan ERROR
  if (rolesList.length === 0 && matchedDemo && allowDemo && rolesStatus !== 'ERROR') {
    source = 'demo';
    rolesList = matchedDemo.roles.map((r) => ({
      id: `${matchedDemo!.id}-${r}`,
      role_id: r,
      scope_type: 'GLOBAL',
      scope_id: null,
      roles: { code: r, name: r, description: `${r} role` },
    }));
    rolesStatus = rolesList.length > 0 ? 'OK' : 'EMPTY';
  }

  if (!profile && allowDemo) {
    const sessionCookie = cookieStore.get('siakad_session')?.value;
    if (sessionCookie) {
      try {
        const decoded = parseSignedSession(sessionCookie) as any;
        if (decoded && decoded.name) {
          profile = {
            id: decoded.userId || userId,
            full_name: decoded.name,
            email: decoded.email || userEmail,
            status: 'ACTIVE',
            must_change_password: false,
          };
          if (rolesList.length === 0 && decoded.role && rolesStatus !== 'ERROR') {
            const roleCode = decoded.role === 'MAHASISWA' ? 'STUDENT' : decoded.role === 'DOSEN' ? 'LECTURER' : 'ADMIN';
            rolesList = [{
              id: `${userId}-${roleCode}`,
              role_id: roleCode,
              scope_type: 'GLOBAL',
              scope_id: null,
              roles: { code: roleCode, name: roleCode, description: `${roleCode} role` },
            }];
            rolesStatus = 'OK';
          }
        }
      } catch {
        // ignore parse error
      }
    }
  }

  const rawCookieRole = cookieStore.get('active_role')?.value;
  const normalizedCookieRole = rawCookieRole ? normalizeRoleCode(rawCookieRole) : null;
  const allowedRoleCodes = rolesList.map((r) => (r.roles as any)?.code || r.role_id).filter(Boolean);
  const normalizedAllowedRoles = allowedRoleCodes.map((c) => normalizeRoleCode(c));

  let validatedActiveRole = '';
  let roleCookieMismatch = false;

  if (rolesStatus === 'OK' && normalizedAllowedRoles.length > 0) {
    if (normalizedCookieRole && normalizedAllowedRoles.includes(normalizedCookieRole)) {
      validatedActiveRole = normalizedCookieRole;
    } else {
      // Cookie tidak cocok atau kosong, tapi ada role resmi di database
      validatedActiveRole = normalizedAllowedRoles[0];
      roleCookieMismatch = true;
    }
  } else {
    // rolesStatus === 'EMPTY' atau 'ERROR' -> activeRole string kosong agar TIDAK cocok dengan peran apa pun
    validatedActiveRole = '';
  }

  navDebug('current_user_resolved', {
    cookieActiveRole: rawCookieRole,
    roleCodesFromDb,
    source,
    dbError: rolesStatus === 'ERROR',
    isOnline,
    resolved: validatedActiveRole,
    roleCookieMismatch,
    rolesStatus,
    userId,
  });

  const isNewAccount =
    !!matchedDemo?.isNewAccount ||
    cookieStore.get('is_new_account')?.value === 'true' ||
    (() => {
      try {
        const s = cookieStore.get('siakad_session')?.value;
        if (!s) return false;
        const dec = parseSignedSession(s) as any;
        return !!dec.isNewAccount;
      } catch {
        return false;
      }
    })();

  return {
    status: 'AUTHENTICATED',
    rolesStatus,
    roleCookieMismatch,
    context: {
      user: { id: userId, email: userEmail || profile?.email || '' },
      profile,
      roles: rolesList,
      activeRole: validatedActiveRole,
      isImpersonating,
      impersonatingFrom,
      isNewAccount,
    },
  };
});

/**
 * Pengambilan context pengguna terotentikasi beserta profil dan peran.
 * Kompatibel sepenuhnya dengan kode yang memanggil fungsi ini (mengembalikan null jika non-otentikasi).
 */
export const getCurrentUserWithRoles = dedupe(async (): Promise<CurrentUserContext | null> => {
  const resolution = await getCurrentUserResolution();
  if (resolution.status !== 'AUTHENTICATED') {
    return null;
  }
  return resolution.context;
});
