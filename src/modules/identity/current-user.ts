import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { parseSignedSession } from '@/lib/auth/session';
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

// In Next.js Server Components, React's cache() guarantees deduplication per request.
// In test environments where React runs without react-server condition, fallback to pass-through.
const dedupe = typeof cache === 'function' ? cache : <T extends (...args: any[]) => any>(fn: T): T => fn;

/**
 * Deduplicated retrieval of current authenticated user, profile, and roles.
 * Wrapped with React cache() to guarantee a single execution per request.
 */
export const getCurrentUserWithRoles = dedupe(async (): Promise<CurrentUserContext | null> => {
  let cookieStore: ReturnType<typeof cookies>;
  let demoSessionId: string | undefined;
  try {
    cookieStore = cookies();
    demoSessionId = cookieStore.get('demo_session')?.value;
  } catch {
    return null;
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
  // Seluruh pengecualian berbasis ID dihapus demi keamanan.
  const isProd = process.env.NODE_ENV === 'production';
  if (!realUserId && demoSessionId) {
    if (!isProd || process.env.ALLOW_DEMO_AUTH === 'true') {
      realUserId = demoSessionId;
    }
  }

  if (!realUserId) {
    return null;
  }

  // A3a: Identitas efektif TIDAK boleh berasal dari cookie demo_session.
  // Turunkan di server dari token bertanda tangan, dan HANYA berlaku jika:
  // (1) sesi NYATA pengguna = originalAdminId, dan
  // (2) originalAdminId memiliki role SUPER_ADMIN di DB (user_roles).
  const impersonationToken = cookieStore.get('impersonation_token')?.value;
  let verifiedPayload: ImpersonationTokenPayload | null = null;
  let isImpersonating = false;
  let impersonatingFrom: string | null = null;
  let effectiveUserId = realUserId;

  if (impersonationToken) {
    verifiedPayload = verifyImpersonationToken(impersonationToken);
    if (verifiedPayload && verifiedPayload.originalAdminId === realUserId) {
      // Verifikasi bahwa admin asli memiliki role SUPER_ADMIN di DB
      let isOriginalSuperAdmin = false;
      if (isOnline) {
        try {
          const { data: adminRoles } = await supabaseAdmin
            .from('user_roles')
            .select('roles(code), role_id')
            .eq('user_id', verifiedPayload.originalAdminId)
            .eq('status', 'ACTIVE');
          isOriginalSuperAdmin = !!adminRoles?.some(
            (r: any) => r.roles?.code === 'SUPER_ADMIN' || r.role_id === 'SUPER_ADMIN'
          );
        } catch {
          // DB offline
        }
      }
      if (!isOriginalSuperAdmin && !isOnline) {
        const adminDemo = Object.values(SYNTHETIC_DEMO_USERS).find(
          (u) => u.id === verifiedPayload!.originalAdminId
        );
        isOriginalSuperAdmin = !!adminDemo?.roles.includes('SUPER_ADMIN');
      }

      if (isOriginalSuperAdmin) {
        effectiveUserId = verifiedPayload.targetUserId;
        isImpersonating = true;
        impersonatingFrom = verifiedPayload.originalAdminId;
      }
    }
  }

  // Bersihkan cookie impersonasi tak valid jika bukan impersonating aktif
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

  // Cari di synthetic users jika ada
  let matchedDemo =
    SYNTHETIC_DEMO_USERS[userId] ||
    SYNTHETIC_DEMO_USERS[userId.toLowerCase()] ||
    Object.values(SYNTHETIC_DEMO_USERS).find(
      (u) =>
        u.id === userId ||
        u.nim === userId ||
        u.nidn === userId ||
        u.email?.toLowerCase() === userId.toLowerCase()
    );

  let profile = matchedDemo
    ? {
        id: matchedDemo.id,
        full_name: matchedDemo.name,
        email: matchedDemo.email,
        status: matchedDemo.status,
        must_change_password: !!matchedDemo.mustChangePassword,
      }
    : null;

  if (isOnline) {
    try {
      const { data: dbProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbProfile) {
        profile = dbProfile;
      }
    } catch {
      // DB offline
    }
  }

  let rolesList: any[] = [];
  if (isOnline) {
    try {
      const { data: userRoles } = await supabaseAdmin
        .from('user_roles')
        .select('id, role_id, scope_type, scope_id, roles(code, name, description)')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      if (userRoles && userRoles.length > 0) {
        rolesList = userRoles;
      }
    } catch {
      // DB offline
    }
  }

  if (rolesList.length === 0 && matchedDemo) {
    rolesList = matchedDemo.roles.map((r) => ({
      id: `${matchedDemo!.id}-${r}`,
      role_id: r,
      scope_type: 'GLOBAL',
      scope_id: null,
      roles: { code: r, name: r, description: `${r} role` },
    }));
  }

  if (!profile) {
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
          if (rolesList.length === 0 && decoded.role) {
            const roleCode = decoded.role === 'MAHASISWA' ? 'STUDENT' : decoded.role === 'DOSEN' ? 'LECTURER' : 'ADMIN';
            rolesList = [{
              id: `${userId}-${roleCode}`,
              role_id: roleCode,
              scope_type: 'GLOBAL',
              scope_id: null,
              roles: { code: roleCode, name: roleCode, description: `${roleCode} role` },
            }];
          }
        }
      } catch {
        // ignore parse error
      }
    }
  }

  const activeRoleCode = cookieStore.get('active_role')?.value;
  // Validasi peran aktif di sisi server dari daftar peran resmi pengguna (rolesList)
  const allowedRoleCodes = rolesList.map((r) => (r.roles as any)?.code || r.role_id);
  const validatedActiveRole =
    activeRoleCode && allowedRoleCodes.includes(activeRoleCode)
      ? activeRoleCode
      : allowedRoleCodes[0] || 'STUDENT';

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
    user: { id: userId, email: userEmail || profile?.email || '' },
    profile,
    roles: rolesList,
    activeRole: validatedActiveRole,
    isImpersonating,
    impersonatingFrom,
    isNewAccount,
  };
});
