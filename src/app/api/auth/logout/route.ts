import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function clearAllAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete("siakad_session");
  cookieStore.delete("demo_session");
  cookieStore.delete("active_role");
  cookieStore.delete("impersonation_token");
  cookieStore.delete("impersonating_from");
  cookieStore.delete("impersonating_expires_at");
}

export async function POST() {
  clearAllAuthCookies();
  return NextResponse.json({ success: true, message: "Berhasil keluar" });
}

export async function GET() {
  clearAllAuthCookies();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
