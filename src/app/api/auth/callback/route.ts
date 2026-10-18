import { NextRequest, NextResponse } from "next/server";
import { validasiEmailKampusAsync } from "@/lib/auth/validasi-email";
import { findUserByEmail, createSessionCookie } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/auth/supabase";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  if (code) {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.user) {
        return NextResponse.redirect(
          new URL("/login?error=auth_failed", baseUrl)
        );
      }

      const email = data.user.email || "";
      const emailVerified = !!data.user.email_confirmed_at;

      // 1. Validasi domain dan allowlist kampus di database
      const check = await validasiEmailKampusAsync({ email, emailVerified });
      if (!check.valid || !check.normalizedEmail) {
        await supabase.auth.signOut();

        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent(
              check.pesanError || "Gunakan email student kampus untuk masuk."
            )}`,
            baseUrl
          )
        );
      }

      // 2. Periksa apakah sudah terdaftar di Mahasiswa
      const user = await findUserByEmail(check.normalizedEmail);
      if (!user || user.peran !== "MAHASISWA" || !user.mahasiswa) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent(
              "Email ini belum terdaftar sebagai mahasiswa. Hubungi bagian akademik."
            )}`,
            baseUrl
          )
        );
      }

      // 3. Buat sesi
      await createSessionCookie({
        userId: user.id,
        email: user.email,
        role: "MAHASISWA",
        name: user.mahasiswa.nama,
        subId: user.mahasiswa.id,
      });

      return NextResponse.redirect(new URL("/mahasiswa/dashboard", baseUrl));
    }
  }

  return NextResponse.redirect(new URL("/login", baseUrl));
}
