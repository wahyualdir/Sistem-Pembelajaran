import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        try {
          if (typeof cookieStore.getAll === 'function') {
            return cookieStore.getAll();
          }
        } catch {
          // Fallback
        }
        return [];
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (typeof cookieStore.set === 'function') {
              cookieStore.set(name, value, options as CookieOptions);
            }
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
