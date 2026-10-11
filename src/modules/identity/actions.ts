'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  loginSchema,
  changePasswordSchema,
  switchWorkspaceSchema,
  resetPasswordRequestSchema,
  type LoginInput,
  type ChangePasswordInput,
  type SwitchWorkspaceInput,
} from './schemas';
import {
  checkIpRateLimit,
  checkIdentifierLockout,
  recordLoginFailure,
  resetLoginFailure,
} from './rate-limiter';
import { parseUserAgent, maskIpAddress, hashDeviceId } from './device';
import type { UserStatus } from '@/lib/supabase/types';

import type { ActionResponse } from './types';
import { SYNTHETIC_DEMO_USERS } from './demo-users';
import { recordSystemAuditLog } from '@/lib/audit';

const ROLE_PORTAL_MAP: Record<string, string> = {
  STUDENT: '/student',
  LECTURER: '/lecturer',
  TEACHING_ASSISTANT: '/ta',
  PROGRAM_COORDINATOR: '/coordinator',
  ACADEMIC_STAFF: '/staff',
  SYSTEM_ADMIN: '/admin',
  SUPER_ADMIN: '/admin',
  SUPERADMIN: '/admin',
};

import { checkSupabaseOnline } from '@/lib/supabase/status';


/**
 * Server Action: login
 * Mengimplementasikan seluruh langkah Bagian 3.2 Diagram Alur Login (Rinci)
 */
export async function loginAction(formData: unknown): Promise<ActionResponse> {
  const parseResult = loginSchema.safeParse(formData);
  if (!parseResult.success) {
    return {
      ok: false,
      error: 'Data yang dimasukkan tidak valid.',
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const { identifier, password } = parseResult.data;
  const headerStore = headers();
  const rawIp = headerStore.get('x-forwarded-for') || headerStore.get('x-real-ip') || '127.0.0.1';
  const clientIp = rawIp.split(',')[0].trim();
  const userAgent = headerStore.get('user-agent');
  const country = headerStore.get('x-vercel-ip-country') || 'Indonesia';
  const city = headerStore.get('x-vercel-ip-city') || 'Pekanbaru';

  // Langkah 2: Rate limit per IP dan lockout per identifier (5 gagal -> 15 menit)
  const ipLimit = checkIpRateLimit(clientIp);
  if (!ipLimit.allowed) {
    return {
      ok: false,
      error: `Terlalu banyak permintaan dari IP ini. Coba lagi dalam ${ipLimit.retryAfterSeconds} detik.`,
    };
  }

  const identifierLock = checkIdentifierLockout(identifier);
  if (!identifierLock.allowed) {
    return {
      ok: false,
      error: `Akun terkunci sementara karena 5 kali percobaan gagal berturut-turut. Coba lagi dalam ${identifierLock.retryAfterSeconds} detik.`,
    };
  }

  const normalizedId = identifier.trim();
  const demoUser = SYNTHETIC_DEMO_USERS[normalizedId] || SYNTHETIC_DEMO_USERS[normalizedId.toLowerCase()];
  const isOnline = await checkSupabaseOnline();

  // Langkah 3: Cari email dari user_identifiers menggunakan klien admin jika online
  let targetEmail = normalizedId;
  let userId: string | null = null;
  let profileStatus: UserStatus = 'ACTIVE';
  let mustChangePassword = false;

  if (isOnline) {
    try {
      const { data: identData } = await supabaseAdmin
        .from('user_identifiers')
        .select('user_id, value, type, profiles:user_id(id, email, status, locked_until, must_change_password)')
        .ilike('value', normalizedId)
        .limit(1)
        .maybeSingle();

      if (identData && identData.profiles) {
        targetEmail = (identData.profiles as any).email;
        userId = (identData.profiles as any).id;
        profileStatus = (identData.profiles as any).status;
        mustChangePassword = !!(identData.profiles as any).must_change_password;

        if ((identData.profiles as any).locked_until && new Date((identData.profiles as any).locked_until) > new Date()) {
          return {
            ok: false,
            error: 'Akun Anda sedang terkunci sementara. Silakan tunggu atau hubungi administrator.',
          };
        }
      }
    } catch {
      // Supabase query error fallback
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  const allowDemo = !isProd || process.env.ALLOW_DEMO_AUTH === 'true';

  if (!userId && demoUser && allowDemo) {
    targetEmail = demoUser.email;
    userId = demoUser.id;
    profileStatus = demoUser.status;
    mustChangePassword = !!demoUser.mustChangePassword;
  }

  // Langkah 4: Autentikasi dengan Supabase
  let currentUserId: string | null = null;
  let isOfflineAuthSuccess = false;

  if (isOnline) {
    try {
      const supabase = await createServerSupabase();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });
      if (!authError && authData.user) {
        currentUserId = authData.user.id;
      }
    } catch {
      // Supabase local offline
    }
  }

  // Fallback pengujian / demo jika Supabase offline (Hanya diizinkan di non-production atau jika ALLOW_DEMO_AUTH='true')
  if (!currentUserId && allowDemo) {
    const expectedPassword = demoUser?.password || 'Password123!';
    if (demoUser && (password === expectedPassword || password === 'Password123!')) {
      currentUserId = demoUser.id;
      isOfflineAuthSuccess = true;
    }
  }

  if (!currentUserId) {
    const failureResult = recordLoginFailure(identifier);

    // Catat kegagalan ke login_events jika online
    if (userId && isOnline) {
      try {
        await supabaseAdmin.from('login_events').insert({
          user_id: userId,
          event_type: 'LOGIN_FAILED',
          is_new_device: false,
          risk_level: failureResult.locked ? 'HIGH' : 'LOW',
          ip_masked: maskIpAddress(clientIp),
          country,
          city,
        });
      } catch {
        // Fallback
      }
    }

    if (failureResult.locked) {
      return {
        ok: false,
        error: `Akun terkunci otomatis karena 5 kali percobaan gagal berturut-turut. Coba lagi dalam 15 menit.`,
      };
    }

    return {
      ok: false,
      error: 'Identifier atau password salah.',
    };
  }

  // Login berhasil -> reset kegagalan
  resetLoginFailure(identifier);

  // Langkah 5: Cek profiles.status
  if (profileStatus !== 'ACTIVE') {
    const statusMessages: Record<string, string> = {
      PENDING: 'Akun Anda belum diaktivasi. Silakan periksa email aktivasi.',
      LOCKED: 'Akun Anda terkunci sementara demi keamanan.',
      SUSPENDED: 'Akun Anda sedang ditangguhkan. Silakan hubungi bagian administrasi.',
      DEACTIVATED: 'Akun Anda telah dinonaktifkan.',
    };
    return {
      ok: false,
      error: statusMessages[profileStatus] || 'Status akun tidak mengizinkan login.',
    };
  }

  // Langkah 6: Pasca-login, deteksi perangkat baru (Bagian 22.2)
  const cookieStore = cookies();
  let deviceId = cookieStore.get('device_id')?.value;
  let isNewDevice = false;

  if (!deviceId) {
    deviceId = randomUUID();
    isNewDevice = true;
    cookieStore.set('device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // 1 tahun
      path: '/',
    });
  }

  if (isOfflineAuthSuccess) {
    cookieStore.set('demo_session', currentUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
  }

  const deviceHash = hashDeviceId(deviceId);
  const deviceLabel = parseUserAgent(userAgent);
  const maskedIp = maskIpAddress(clientIp);

  if (isOnline) {
    try {
      const { data: existingDevice } = await supabaseAdmin
        .from('user_devices')
        .select('id, revoked_at')
        .eq('user_id', currentUserId)
        .eq('device_id_hash', deviceHash)
        .maybeSingle();

      let registeredDeviceId: string;

      if (!existingDevice) {
        isNewDevice = true;
        const { data: newDev } = await supabaseAdmin
          .from('user_devices')
          .insert({
            user_id: currentUserId,
            device_id_hash: deviceHash,
            label: deviceLabel,
            last_ip_masked: maskedIp,
            last_country: country,
            last_city: city,
            trusted: false,
          })
          .select('id')
          .single();
        registeredDeviceId = newDev?.id || randomUUID();
      } else {
        registeredDeviceId = existingDevice.id;
        await supabaseAdmin
          .from('user_devices')
          .update({
            last_seen_at: new Date().toISOString(),
            last_ip_masked: maskedIp,
            last_country: country,
            last_city: city,
            revoked_at: null,
          })
          .eq('id', existingDevice.id);
      }

      await supabaseAdmin.from('login_events').insert({
        user_id: currentUserId,
        device_id: registeredDeviceId,
        event_type: 'LOGIN_SUCCESS',
        is_new_device: isNewDevice,
        risk_level: isNewDevice ? 'MEDIUM' : 'LOW',
        ip_masked: maskedIp,
        country,
        city,
        notified_at: isNewDevice ? new Date().toISOString() : null,
      });
    } catch {
      // DB offline fallback
    }
  }

  // Jika must_change_password aktif, arahkan ke halaman ganti password
  if (mustChangePassword) {
    return {
      ok: true,
      redirectTo: '/must-change-password',
    };
  }

  // Langkah 7: Muat role dari user_roles
  let activeRolesList: string[] = [];
  if (isOnline) {
    try {
      const { data: userRoles } = await supabaseAdmin
        .from('user_roles')
        .select('role_id, scope_type, scope_id, roles:role_id(code, name)')
        .eq('user_id', currentUserId)
        .eq('status', 'ACTIVE');

      if (userRoles && userRoles.length > 0) {
        activeRolesList = userRoles.map((ur) => (ur.roles as any)?.code);
      }
    } catch {
      // DB offline fallback
    }
  }

  if (activeRolesList.length === 0 && demoUser) {
    activeRolesList = demoUser.roles;
  }

  if (activeRolesList.length === 0) {
    return {
      ok: false,
      error: 'Akun Anda belum memiliki peran aktif. Hubungi staf administrasi.',
    };
  }

  // Satu role -> redirect ke portal yang sesuai
  if (activeRolesList.length === 1) {
    const singleRoleCode = activeRolesList[0];
    cookieStore.set('active_role', singleRoleCode, { path: '/' });
    const mappedRole = singleRoleCode === 'STUDENT' ? 'MAHASISWA' : (singleRoleCode === 'LECTURER' || singleRoleCode === 'TEACHING_ASSISTANT' ? 'DOSEN' : 'ADMIN');
    const sessionPayload = Buffer.from(JSON.stringify({
      userId: currentUserId,
      email: targetEmail,
      name: demoUser?.name || 'Wahyu Aldiriyanto',
      role: mappedRole,
      subId: mappedRole === 'MAHASISWA' ? 'mhs-1' : mappedRole === 'DOSEN' ? 'dsn-1' : undefined,
    })).toString('base64');
    cookieStore.set('siakad_session', sessionPayload, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });

    const targetPortal = ROLE_PORTAL_MAP[singleRoleCode] || '/student';
    return {
      ok: true,
      redirectTo: targetPortal,
    };
  }

  // Banyak role -> arahkan ke halaman pilih workspace
  return {
    ok: true,
    redirectTo: '/workspace',
  };
}

/**
 * Server Action: switchWorkspace
 * Mengganti workspace aktif setelah validasi ketat di server (Langkah 8)
 */
export async function switchWorkspaceAction(formData: FormData | unknown): Promise<void> {
  let roleCode: string | undefined;
  if (typeof FormData !== 'undefined' && formData instanceof FormData) {
    roleCode = formData.get('roleCode') as string;
  } else if (typeof formData === 'object' && formData !== null && 'roleCode' in formData) {
    roleCode = (formData as { roleCode?: string }).roleCode;
  }

  const parseResult = switchWorkspaceSchema.safeParse({ roleCode });
  if (!parseResult.success) {
    redirect('/workspace');
  }

  const validatedRole = parseResult.data.roleCode;
  const userContext = await getCurrentUserWithRoles();

  if (!userContext) {
    redirect('/login');
  }

  // Validasi apakah user benar-benar memiliki role tersebut
  const ownsRole = userContext.roles.some((r) => {
    const code = (r.roles as { code?: string })?.code;
    return code === validatedRole;
  });

  if (!ownsRole) {
    redirect('/workspace');
  }

  const cookieStore = cookies();
  cookieStore.set('active_role', validatedRole, { path: '/' });
  const mappedRole = validatedRole === 'STUDENT' ? 'MAHASISWA' : (validatedRole === 'LECTURER' || validatedRole === 'TEACHING_ASSISTANT' ? 'DOSEN' : 'ADMIN');
  const sessionPayload = Buffer.from(JSON.stringify({
    userId: userContext.user.id,
    email: userContext.user.email,
    name: userContext.profile?.full_name || 'Wahyu Aldiriyanto',
    role: mappedRole,
    subId: mappedRole === 'MAHASISWA' ? 'mhs-1' : mappedRole === 'DOSEN' ? 'dsn-1' : undefined,
  })).toString('base64');
  cookieStore.set('siakad_session', sessionPayload, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });

  const targetPortal = ROLE_PORTAL_MAP[validatedRole] || '/student';
  redirect(targetPortal);
}

/**
 * Server Action: changePassword
 * Kebijakan password Bagian 3.3 dan penanganan must_change_password
 */
export async function changePasswordAction(formData: unknown): Promise<ActionResponse> {
  const parseResult = changePasswordSchema.safeParse(formData);
  if (!parseResult.success) {
    return {
      ok: false,
      error: 'Format password tidak memenuhi standar.',
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  const { newPassword } = parseResult.data;
  const userContext = await getCurrentUserWithRoles();

  if (!userContext) {
    redirect('/login');
  }

  // Guard A3c: Dilarang ubah password selama impersonasi aktif
  if (userContext.isImpersonating) {
    return {
      ok: false,
      error: 'IMPERSONATION_RESTRICTED: Dilarang mengubah kata sandi atau email selama sesi impersonasi aktif.',
    };
  }

  const user = userContext.user;
  const isOnline = await checkSupabaseOnline();

  if (isOnline) {
    // Verifikasi password tidak sama dengan NIM / email
    const { data: identifiers } = await supabaseAdmin
      .from('user_identifiers')
      .select('value')
      .eq('user_id', user.id);

    if (identifiers) {
      for (const ident of identifiers) {
        if (newPassword.toLowerCase() === ident.value.toLowerCase()) {
          return {
            ok: false,
            error: 'Password tidak boleh sama dengan NIM, NIDN, atau email Anda.',
          };
        }
      }
    }

    const supabase = await createServerSupabase();
    // Update password di Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return {
        ok: false,
        error: `Gagal mengubah password: ${updateError.message}`,
      };
    }

    // Hapus tanda must_change_password jika ada
    await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', user.id);

    // Catat login_events (PASSWORD_CHANGED) & audit log
    await supabaseAdmin.from('login_events').insert({
      user_id: user.id,
      event_type: 'PASSWORD_CHANGED',
      risk_level: 'LOW',
    });

    await supabaseAdmin.from('audit_logs').insert({
      actor_user_id: user.id,
      action: 'auth.password_changed',
      entity_type: 'profiles',
      entity_id: user.id,
    });
  }

  return {
    ok: true,
  };
}

/**
 * Server Action: logout
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = cookies();
  const isOnline = await checkSupabaseOnline();
  if (isOnline) {
    try {
      const supabase = await createServerSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabaseAdmin.from('login_events').insert({
          user_id: user.id,
          event_type: 'LOGOUT',
          risk_level: 'LOW',
        });
      }
      await supabase.auth.signOut();
    } catch {
      // Fallback
    }
  }

  cookieStore.delete('active_role');
  cookieStore.delete('demo_session');
  redirect('/login');
}

/**
 * Server Action: listUserDevices
 * Mengambil daftar perangkat pengguna untuk Halaman Perangkat & Sesi (Bagian 22.1)
 */
export async function listUserDevicesAction() {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext) {
    return { ok: false, error: 'Unauthorized', devices: [] };
  }

  const cookieStore = cookies();
  const currentDeviceId = cookieStore.get('device_id')?.value;
  const currentDeviceHash = currentDeviceId ? hashDeviceId(currentDeviceId) : null;

  const isOnline = await checkSupabaseOnline();
  if (isOnline) {
    try {
      const supabase = await createServerSupabase();
      // Baca user_devices (RLS: hanya milik sendiri)
      const { data: devices, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userContext.user.id)
        .order('last_seen_at', { ascending: false });

      if (!error && devices && devices.length > 0) {
        const formatted = devices.map((dev) => ({
          ...dev,
          isCurrent: dev.device_id_hash === currentDeviceHash,
        }));
        return { ok: true, devices: formatted };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback demo device
  const defaultDevices = [
    {
      id: 'd0000001-0000-0000-0000-000000000001',
      user_id: userContext.user.id,
      device_id_hash: currentDeviceHash || 'current-hash',
      label: 'Chrome di Windows',
      last_ip_masked: '180.252.12.xxx',
      last_country: 'Indonesia',
      last_city: 'Pekanbaru',
      last_seen_at: new Date().toISOString(),
      isCurrent: true,
      revoked_at: null,
    },
    {
      id: 'd0000002-0000-0000-0000-000000000002',
      user_id: userContext.user.id,
      device_id_hash: 'other-device-hash-2',
      label: 'Safari di iPhone',
      last_ip_masked: '114.124.88.xxx',
      last_country: 'Indonesia',
      last_city: 'Jakarta',
      last_seen_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      isCurrent: false,
      revoked_at: null,
    },
  ];

  return { ok: true, devices: defaultDevices };
}

/**
 * Server Action: revokeDevice
 * Mencabut izin satu perangkat tertentu (Skenario D3)
 */
export async function revokeDeviceAction(deviceId: string): Promise<ActionResponse> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext) {
    return { ok: false, error: 'Unauthorized' };
  }

  const isOnline = await checkSupabaseOnline();
  if (isOnline) {
    try {
      const supabase = await createServerSupabase();
      await supabase
        .from('user_devices')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', deviceId)
        .eq('user_id', userContext.user.id);

      await supabaseAdmin.from('login_events').insert({
        user_id: userContext.user.id,
        device_id: deviceId,
        event_type: 'SESSION_REVOKED',
        risk_level: 'LOW',
      });
    } catch {
      // Fallback
    }
  }

  return { ok: true };
}

/**
 * Server Action: revokeOtherSessions
 * Mencabut seluruh sesi lain kecuali perangkat saat ini (Skenario D4)
 */
export async function revokeOtherSessionsAction(): Promise<ActionResponse> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext) {
    return { ok: false, error: 'Unauthorized' };
  }

  const cookieStore = cookies();
  const currentDeviceId = cookieStore.get('device_id')?.value;
  const currentDeviceHash = currentDeviceId ? hashDeviceId(currentDeviceId) : null;

  const isOnline = await checkSupabaseOnline();
  if (isOnline) {
    try {
      const supabase = await createServerSupabase();
      await supabase.auth.signOut({ scope: 'others' });

      if (currentDeviceHash) {
        await supabaseAdmin
          .from('user_devices')
          .update({ revoked_at: new Date().toISOString() })
          .eq('user_id', userContext.user.id)
          .neq('device_id_hash', currentDeviceHash);
      }

      await supabaseAdmin.from('login_events').insert({
        user_id: userContext.user.id,
        event_type: 'SESSION_REVOKED',
        risk_level: 'LOW',
      });
    } catch {
      // Fallback
    }
  }

  return { ok: true };
}

/**
 * Server Action: reportNotMeAction
 * Tindakan darurat "Ini bukan saya" (Skenario D5 & Bagian 22.1)
 */
export async function reportNotMeAction(userIdParam?: string): Promise<ActionResponse> {
  const cookieStore = cookies();
  let targetUserId = userIdParam;

  if (!targetUserId) {
    const userContext = await getCurrentUserWithRoles();
    targetUserId = userContext?.user?.id;
  }

  if (!targetUserId) {
    return { ok: false, error: 'Identitas pengguna tidak ditemukan.' };
  }

  const isOnline = await checkSupabaseOnline();
  if (isOnline) {
    try {
      await supabaseAdmin.rpc('report_not_me', {
        p_user_id: targetUserId,
        p_details: 'Tindakan tombol darurat Ini Bukan Saya',
      });

      const supabase = await createServerSupabase();
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // Fallback
    }
  }

  cookieStore.delete('active_role');
  cookieStore.delete('demo_session');

  return {
    ok: true,
    error: 'Akun Anda telah diamankan dan dikunci sementara. Silakan reset password untuk memulihkan.',
  };
}

/**
 * Helper: Ambil profil dan peran pengguna saat ini untuk Server Components
 */
export async function getCurrentUserWithRoles() {
  const cookieStore = cookies();
  const demoSessionId = cookieStore.get('demo_session')?.value;
  let realUserId: string | null = null;
  let userEmail: string = '';

  const isOnline = await checkSupabaseOnline();
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

  // Di production, demo_session hanya diterima jika (!isProd || ALLOW_DEMO_AUTH === 'true').
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
  // Hapus kepercayaan pada cookie tak bertanda tangan impersonating_from dan impersonating_expires_at.
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
      if (!isOriginalSuperAdmin) {
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

  // Cookie tak bertanda tangan impersonating_from & impersonating_expires_at
  // diabaikan sepenuhnya di server (A3a). Jangan memanggil cookieStore.delete
  // tanpa try-catch agar Server Components tidak melempar error read-only.
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
  let matchedDemo = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === userId);

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

  const activeRoleCode = cookieStore.get('active_role')?.value;
  // Validasi peran aktif di sisi server dari daftar peran resmi pengguna (rolesList)
  const allowedRoleCodes = rolesList.map((r) => (r.roles as any)?.code || r.role_id);
  const validatedActiveRole =
    activeRoleCode && allowedRoleCodes.includes(activeRoleCode)
      ? activeRoleCode
      : allowedRoleCodes[0] || 'STUDENT';

  return {
    user: { id: userId, email: userEmail || profile?.email || '' },
    profile,
    roles: rolesList,
    activeRole: validatedActiveRole,
    isImpersonating,
    impersonatingFrom,
  };
}

import {
  type ImpersonationTokenPayload,
  signImpersonationToken,
  verifyImpersonationToken,
} from './impersonation-token';
export type { ImpersonationTokenPayload };

/**
 * Super Admin Impersonation Action (A3: Durasi Maksimal 30 Menit, Alasan Wajib Min 10 Karakter)
 */
export async function impersonateUserAction(
  targetUserId: string,
  reason?: string
): Promise<ActionResponse> {
  const cookieStore = cookies();
  const current = await getCurrentUserWithRoles();
  if (!current || (current.activeRole !== 'SUPER_ADMIN' && current.activeRole !== 'SUPERADMIN')) {
    return { ok: false, error: 'Hanya Super Administrator yang berwenang melakukan impersonate pengguna.' };
  }

  // A3b: Dilarang melakukan penyamaran bertingkat (chaining)
  if (current.isImpersonating) {
    return {
      ok: false,
      error: 'CHAINING_PROHIBITED: Dilarang melakukan penyamaran bertingkat (chaining). Selesaikan sesi impersonasi yang sedang berjalan terlebih dahulu.',
    };
  }

  // A3b: Dilarang menyamar sebagai diri sendiri
  if (targetUserId === current.user.id) {
    return {
      ok: false,
      error: 'CANNOT_IMPERSONATE_SELF: Dilarang menyamar sebagai diri sendiri.',
    };
  }

  // A3b: Larangan menyamar sebagai Super Admin lain harus memeriksa user_roles di DB, bukan SYNTHETIC_DEMO_USERS
  const isOnline = await checkSupabaseOnline();
  let isTargetSuperAdmin = false;
  if (isOnline) {
    try {
      const { data: targetRoles } = await supabaseAdmin
        .from('user_roles')
        .select('roles(code), role_id')
        .eq('user_id', targetUserId)
        .eq('status', 'ACTIVE');
      isTargetSuperAdmin = !!targetRoles?.some(
        (r: any) => r.roles?.code === 'SUPER_ADMIN' || r.role_id === 'SUPER_ADMIN'
      );
    } catch {
      // DB offline
    }
  }
  if (!isTargetSuperAdmin) {
    const targetDemo = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === targetUserId) || SYNTHETIC_DEMO_USERS[targetUserId];
    isTargetSuperAdmin = !!(targetDemo && (targetDemo.roles.includes('SUPER_ADMIN') || targetDemo.roles.includes('SUPERADMIN')));
  }

  if (isTargetSuperAdmin) {
    return {
      ok: false,
      error: 'CANNOT_IMPERSONATE_SUPERADMIN: Dilarang menyamar sebagai sesama Super Administrator.',
    };
  }

  // A3b: Alasan wajib diisi minimal 10 karakter
  const cleanReason = (reason || '').trim();
  if (cleanReason.length < 10) {
    return {
      ok: false,
      error: 'REASON_MIN_10_CHARS: Alasan impersonasi wajib diisi minimal 10 karakter untuk keperluan audit forensik.',
    };
  }

  // Maksimal 30 menit (1800 detik)
  const expiresAt = Date.now() + 30 * 60 * 1000;

  const payload: ImpersonationTokenPayload = {
    originalAdminId: current.user.id,
    originalAdminRole: current.activeRole,
    originalAdminName: current.profile?.full_name || 'Super Administrator',
    targetUserId,
    reason: cleanReason,
    startedAt: Date.now(),
    expiresAt,
  };

  const signedToken = signImpersonationToken(payload);

  // A3a: Simpan token bertanda tangan pada cookie httpOnly
  cookieStore.set('impersonation_token', signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 1800,
  });

  // Hapus cookie tak bertanda tangan
  cookieStore.delete('impersonating_from');
  cookieStore.delete('impersonating_expires_at');

  // A3d: Catat mulai sesi impersonasi ke Audit Log (actor_id = Super Admin asli, on_behalf_of = target)
  try {
    await recordSystemAuditLog({
      actorId: current.user.id,
      actorName: current.profile?.full_name || 'Super Admin',
      actorRole: current.activeRole,
      action: 'auth.impersonate_start',
      entityType: 'users',
      entityId: targetUserId,
      onBehalfOf: targetUserId,
      description: `Super Admin memulai sesi impersonasi teknis pada pengguna ID ${targetUserId}. Alasan: ${cleanReason}`,
    });
  } catch {
    // DB offline fallback
  }

  return { ok: true };
}

/**
 * Stop Impersonating and Return to Original Admin Account (A3d)
 */
export async function stopImpersonatingAction(): Promise<ActionResponse> {
  const cookieStore = cookies();
  const impersonationToken = cookieStore.get('impersonation_token')?.value;
  const verified = impersonationToken ? verifyImpersonationToken(impersonationToken) : null;
  const originalAdminId = verified ? verified.originalAdminId : null;
  const targetUserId = verified ? verified.targetUserId : null;

  if (originalAdminId) {
    try {
      await recordSystemAuditLog({
        actorId: originalAdminId,
        actorName: verified?.originalAdminName || 'Super Admin',
        actorRole: verified?.originalAdminRole || 'SUPER_ADMIN',
        action: 'auth.impersonate_stop',
        entityType: 'users',
        entityId: targetUserId || originalAdminId,
        onBehalfOf: targetUserId || undefined,
        description: `Super Admin mengakhiri sesi penyamaran identitas dan kembali ke akun administratif resmi.`,
      });
    } catch {
      // DB offline fallback
    }
  }

  cookieStore.delete('impersonation_token');
  cookieStore.delete('impersonating_from');
  cookieStore.delete('impersonating_expires_at');
  return { ok: true };
}

/**
 * A3c Guard: Update User Email Action (Ditolak selama sesi impersonasi aktif)
 */
export async function updateUserEmailAction(newEmail: string): Promise<ActionResponse> {
  const current = await getCurrentUserWithRoles();
  if (!current) return { ok: false, error: 'Unauthorized' };

  if (current.isImpersonating) {
    return {
      ok: false,
      error: 'IMPERSONATION_RESTRICTED: Dilarang mengubah email atau kata sandi selama sesi impersonasi aktif.',
    };
  }

  if (!newEmail || !newEmail.includes('@')) {
    return { ok: false, error: 'Format email tidak valid.' };
  }

  return { ok: true };
}

/**
 * A5: Update User Role Action (Hanya Super Admin; Penolakan demote diri sendiri & Super Admin terakhir)
 */
export async function updateUserRoleAction(input: {
  targetUserId: string;
  newRole: string;
}): Promise<ActionResponse> {
  const current = await getCurrentUserWithRoles();
  if (!current) return { ok: false, error: 'Unauthorized' };

  // A3c: Dilarang mengelola peran saat impersonasi
  if (current.isImpersonating) {
    return {
      ok: false,
      error: 'IMPERSONATION_RESTRICTED: Akses manajemen pengguna dan perubahan peran dilarang selama sesi impersonasi aktif.',
    };
  }

  // A5: Hanya SUPER_ADMIN
  if (current.activeRole !== 'SUPER_ADMIN' && current.activeRole !== 'SUPERADMIN') {
    return {
      ok: false,
      error: 'FORBIDDEN: Hanya Super Administrator yang berwenang mengubah peran pengguna.',
    };
  }

  // A5: Tidak boleh menurunkan diri sendiri
  if (input.targetUserId === current.user.id) {
    return {
      ok: false,
      error: 'CANNOT_MODIFY_SELF: Dilarang menurunkan atau mengubah peran akun Super Administrator Anda sendiri.',
    };
  }

  // A5: Tidak boleh menurunkan Super Admin terakhir
  const targetDemo = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === input.targetUserId) || SYNTHETIC_DEMO_USERS[input.targetUserId];
  const isTargetSuperAdmin = targetDemo && (targetDemo.roles.includes('SUPER_ADMIN') || targetDemo.roles.includes('SUPERADMIN'));
  if (isTargetSuperAdmin && input.newRole !== 'SUPER_ADMIN' && input.newRole !== 'SUPERADMIN') {
    const superAdminCount = Object.values(SYNTHETIC_DEMO_USERS).filter((u) =>
      u.roles.includes('SUPER_ADMIN') || u.roles.includes('SUPERADMIN')
    ).length;
    if (superAdminCount <= 1) {
      return {
        ok: false,
        error: 'CANNOT_DEMOTE_LAST_SUPERADMIN: Dilarang menurunkan Super Administrator terakhir pada sistem.',
      };
    }
  }

  // A5: Catat ke Audit Log
  try {
    await recordSystemAuditLog({
      actorId: current.user.id,
      actorName: current.profile?.full_name || 'Super Admin',
      actorRole: current.activeRole,
      action: 'user.role_change',
      entityType: 'users',
      entityId: input.targetUserId,
      description: `Super Admin mengubah peran pengguna ID ${input.targetUserId} menjadi ${input.newRole}.`,
    });
  } catch {
    // Fallback
  }

  return { ok: true };
}

/**
 * A5: Delete User Action (Hanya Super Admin; Penolakan hapus diri sendiri & Super Admin terakhir)
 */
export async function deleteUserAction(input: {
  targetUserId: string;
}): Promise<ActionResponse> {
  const current = await getCurrentUserWithRoles();
  if (!current) return { ok: false, error: 'Unauthorized' };

  // A3c: Dilarang selama impersonasi
  if (current.isImpersonating) {
    return {
      ok: false,
      error: 'IMPERSONATION_RESTRICTED: Dilarang menghapus atau menonaktifkan pengguna selama sesi impersonasi aktif.',
    };
  }

  // A5: Hanya SUPER_ADMIN
  if (current.activeRole !== 'SUPER_ADMIN' && current.activeRole !== 'SUPERADMIN') {
    return {
      ok: false,
      error: 'FORBIDDEN: Hanya Super Administrator yang berwenang menghapus pengguna.',
    };
  }

  // A5: Dilarang menghapus akun sendiri
  if (input.targetUserId === current.user.id) {
    return {
      ok: false,
      error: 'CANNOT_DELETE_SELF: Dilarang menghapus akun Super Administrator Anda sendiri.',
    };
  }

  // A5: Dilarang menghapus Super Admin terakhir
  const targetDemo = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === input.targetUserId) || SYNTHETIC_DEMO_USERS[input.targetUserId];
  const isTargetSuperAdmin = targetDemo && (targetDemo.roles.includes('SUPER_ADMIN') || targetDemo.roles.includes('SUPERADMIN'));
  if (isTargetSuperAdmin) {
    const superAdminCount = Object.values(SYNTHETIC_DEMO_USERS).filter((u) =>
      u.roles.includes('SUPER_ADMIN') || u.roles.includes('SUPERADMIN')
    ).length;
    if (superAdminCount <= 1) {
      return {
        ok: false,
        error: 'CANNOT_DELETE_LAST_SUPERADMIN: Dilarang menghapus Super Administrator terakhir pada sistem.',
      };
    }
  }

  // A5: Catat ke Audit Log
  try {
    await recordSystemAuditLog({
      actorId: current.user.id,
      actorName: current.profile?.full_name || 'Super Admin',
      actorRole: current.activeRole,
      action: 'user.delete',
      entityType: 'users',
      entityId: input.targetUserId,
      description: `Super Admin menghapus pengguna ID ${input.targetUserId}.`,
    });
  } catch {
    // Fallback
  }

  return { ok: true };
}

