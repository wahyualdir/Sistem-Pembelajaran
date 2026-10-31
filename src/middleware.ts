import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { LEGACY_ROUTE_REDIRECTS, isRouteAllowedForRole } from '@/lib/config/menu-config';
import { decideRoleRedirect, ROLE_PORTAL_MAP, PORTAL_PREFIXES } from '@/lib/auth/route-guard';
import { navDebug } from '@/lib/auth/nav-debug';

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

  // Cek apakah request merupakan prefetch Next.js router
  const isPrefetch =
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-middleware-prefetch') === '1' ||
    request.headers.get('sec-purpose') === 'prefetch';

  // Dapatkan user dengan getUser() (Aturan Keras 4) HANYA jika cookie autentikasi Supabase ('sb-') ada di browser
  let user = null;
  const hasSupabaseCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

  if (hasSupabaseCookie) {
    if (isPrefetch) {
      // Untuk prefetch navigasi, jangan blokir dengan network call penuh ke Supabase Auth
      user = { id: 'prefetch-session' } as any;
    } else {
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
    navDebug('middleware_redirect', { from: pathname, to: loginUrl.pathname + loginUrl.search, step: 1 });
    return NextResponse.redirect(loginUrl);
  }

  // 2. Pengguna membuka halaman login/register
  // Cegah redirect loop: jika ada parameter ?from atau ?alasan (hasil pengalihan proteksi/sesi),
  // atau tidak ada activeRole, izinkan halaman login terbuka agar user dapat melihat form & mengganti sesi.
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    const hasBypassParam = request.nextUrl.searchParams.has('from') || request.nextUrl.searchParams.has('alasan');
    if (!hasBypassParam && activeRole && ROLE_PORTAL_MAP[activeRole]) {
      const to = ROLE_PORTAL_MAP[activeRole];
      navDebug('middleware_redirect', { from: pathname, to, step: 2 });
      return NextResponse.redirect(new URL(to, request.url));
    }
    return response;
  }

  // 3. Pengguna membuka root '/'
  if (pathname === '/') {
    if (!isAuthenticated) {
      navDebug('middleware_redirect', { from: pathname, to: '/login', step: 3 });
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (activeRole && ROLE_PORTAL_MAP[activeRole]) {
      const to = ROLE_PORTAL_MAP[activeRole];
      navDebug('middleware_redirect', { from: pathname, to, step: 3 });
      return NextResponse.redirect(new URL(to, request.url));
    }
    navDebug('middleware_redirect', { from: pathname, to: '/workspace', step: 3 });
    return NextResponse.redirect(new URL('/workspace', request.url));
  }

  // 4. Pengalihan cepat jika role aktif tidak cocok dengan portal yang dibuka
  if (isAuthenticated && activeRole) {
    const isImpersonating = !!request.cookies.get('impersonating_from')?.value;
    const redirectTarget = decideRoleRedirect({
      pathname,
      search: request.nextUrl.search,
      activeRole,
      isImpersonating,
    });

    if (redirectTarget) {
      navDebug('middleware_redirect', { from: pathname, to: redirectTarget, step: 4 });
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
