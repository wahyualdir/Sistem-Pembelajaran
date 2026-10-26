import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { LEGACY_ROUTE_REDIRECTS, isRouteAllowedForRole } from '@/lib/config/menu-config';

const ROLE_PORTAL_MAP: Record<string, string> = {
  STUDENT: '/student',
  LECTURER: '/lecturer',
  TEACHING_ASSISTANT: '/ta',
  PROGRAM_COORDINATOR: '/coordinator',
  ACADEMIC_STAFF: '/staff',
  SYSTEM_ADMIN: '/admin/system',
  SUPER_ADMIN: '/admin',
  SUPERADMIN: '/admin',
};

const PORTAL_PREFIXES = ['/student', '/lecturer', '/ta', '/coordinator', '/staff', '/admin'];

const ACADEMIC_ROUTES = [
  '/attendance',
  '/analytics',
  '/grades',
  '/exams',
  '/classes',
  '/coordinator',
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // Jalur publik yang dikecualikan dari pemeriksaan sesi
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return response;
  }

  // 0. Pengalihan Rute Legacy SIAKAD ke LMS (Aturan 4.4 Prompt)
  if (LEGACY_ROUTE_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(LEGACY_ROUTE_REDIRECTS[pathname], request.url));
  }
  if (pathname.startsWith('/mahasiswa/')) {
    return NextResponse.redirect(new URL('/student', request.url));
  }
  if (pathname.startsWith('/dosen/')) {
    return NextResponse.redirect(new URL('/lecturer', request.url));
  }

  // Dapatkan user dengan getUser() (Aturan Keras 4) HANYA jika cookie autentikasi Supabase ('sb-') ada di browser
  let user = null;
  const hasSupabaseCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

  if (hasSupabaseCookie) {
    const isOnline = await checkSupabaseOnline();
    if (isOnline) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';

        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              response = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options as CookieOptions)
              );
            },
          },
        });

        const { data } = await supabase.auth.getUser();
        user = data?.user ?? null;
      } catch {
        // Offline / error
      }
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  const allowDemo = !isProd || process.env.ALLOW_DEMO_AUTH === 'true';
  const demoSession = allowDemo ? request.cookies.get('demo_session')?.value : undefined;
  const isAuthenticated = !!user || !!demoSession;
  const activeRole = request.cookies.get('active_role')?.value;

  const isProtectedPortal =
    PORTAL_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname === '/workspace' ||
    pathname === '/devices';

  // 1. Pengguna belum login mencoba membuka halaman terlindungi -> redirect ke /login
  if (!isAuthenticated && isProtectedPortal) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Pengguna membuka halaman login/register
  // Cegah redirect loop: jika ada parameter ?from (hasil pengalihan proteksi) atau tidak ada activeRole,
  // izinkan halaman login terbuka agar user dapat melihat form & mengganti sesi.
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    const hasFrom = request.nextUrl.searchParams.has('from');
    if (!hasFrom && activeRole && ROLE_PORTAL_MAP[activeRole]) {
      return NextResponse.redirect(new URL(ROLE_PORTAL_MAP[activeRole], request.url));
    }
    return response;
  }

  // 3. Pengguna membuka root '/'
  if (pathname === '/') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (activeRole && ROLE_PORTAL_MAP[activeRole]) {
      return NextResponse.redirect(new URL(ROLE_PORTAL_MAP[activeRole], request.url));
    }
    return NextResponse.redirect(new URL('/workspace', request.url));
  }

  // 4. Pengalihan cepat jika role aktif tidak cocok dengan portal yang dibuka
  if (isAuthenticated && activeRole) {
    const isImpersonating = !!request.cookies.get('impersonating_from')?.value;

    // A2: SYSTEM_ADMIN dilarang membuka rute data akademik & portal non-admin
    if (activeRole === 'SYSTEM_ADMIN') {
      const isAcademic =
        ACADEMIC_ROUTES.some((route) => pathname.startsWith(route)) ||
        pathname.startsWith('/student') ||
        pathname.startsWith('/lecturer') ||
        pathname.startsWith('/ta') ||
        pathname.startsWith('/staff') ||
        pathname === '/admin' ||
        (pathname === '/library' && request.nextUrl.searchParams.get('tab') === 'kelola');

      if (isAcademic) {
        return NextResponse.redirect(new URL('/admin/system', request.url));
      }
    }

    // A2: SUPER_ADMIN tidak merender tampilan dosen/mahasiswa/akademik kecuali sesi impersonate aktif
    if ((activeRole === 'SUPER_ADMIN' || activeRole === 'SUPERADMIN') && !isImpersonating) {
      const isAcademicOrRolePortal =
        ACADEMIC_ROUTES.some((route) => pathname.startsWith(route)) ||
        pathname.startsWith('/student') ||
        pathname.startsWith('/lecturer') ||
        pathname.startsWith('/ta') ||
        pathname.startsWith('/staff') ||
        (pathname === '/library' && request.nextUrl.searchParams.get('tab') === 'kelola');

      if (isAcademicOrRolePortal) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }

    const expectedPrefix = ROLE_PORTAL_MAP[activeRole];
    const matchedPrefix = PORTAL_PREFIXES.find((p) => pathname.startsWith(p));
    if (matchedPrefix && expectedPrefix && !expectedPrefix.startsWith(matchedPrefix) && matchedPrefix !== expectedPrefix) {
      return NextResponse.redirect(new URL(expectedPrefix, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - all static files with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .woff, .woff2, .css, .js)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|css|js)$).*)',
  ],
};
