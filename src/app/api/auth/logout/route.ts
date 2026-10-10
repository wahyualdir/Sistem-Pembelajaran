import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete("siakad_session");
  return NextResponse.json({ success: true, message: "Berhasil keluar" });
}

export async function GET() {
  const cookieStore = cookies();
  cookieStore.delete("siakad_session");
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
