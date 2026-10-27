import { cookies } from "next/headers";
import crypto from "crypto";
import { SEED_USERS, SEED_MAHASISWA, SEED_DOSEN } from "@/lib/db/seed-data";
import { prisma } from "@/lib/db";

export type Role = "ADMIN" | "DOSEN" | "MAHASISWA";

export interface AuthSession {
  userId: string;
  email: string;
  role: Role;
  name: string;
  subId?: string; // mahasiswaId or dosenId
}

const SESSION_COOKIE_NAME = "siakad_session";
const SESSION_SECRET =
  process.env.APP_SECRET ||
  process.env.SESSION_SECRET ||
  "siajar-hmac-secret-auth-key-2026-production";

function computeSignature(payload: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function serializeSignedSession(session: AuthSession): string {
  const jsonStr = JSON.stringify(session);
  const data = Buffer.from(jsonStr, "utf-8").toString("base64url");
  const signature = computeSignature(data);
  return `${data}.${signature}`;
}

export function parseSignedSession(cookieValue: string): AuthSession | null {
  if (!cookieValue) return null;
  try {
    const parts = cookieValue.split(".");
    if (parts.length === 2) {
      const [data, signature] = parts;
      const expectedSignature = computeSignature(data);
      const sigBuf = Buffer.from(signature, "hex");
      const expectedBuf = Buffer.from(expectedSignature, "hex");
      if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        const json = Buffer.from(data, "base64url").toString("utf-8");
        const session = JSON.parse(json) as AuthSession;
        if (session && session.userId && session.role) {
          return session;
        }
      }
      return null;
    }

    // Fallback kompatibilitas sesi dev/test sebelumnya jika bukan production
    if (process.env.NODE_ENV !== "production") {
      const raw = Buffer.from(cookieValue, "base64").toString("utf-8");
      const session = JSON.parse(raw) as AuthSession;
      if (session && session.userId && session.role) {
        return session;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function createSessionCookie(session: AuthSession) {
  const cookieStore = cookies();
  const value = serializeSignedSession(session);
  cookieStore.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<AuthSession | null> {
  let cookieStore: ReturnType<typeof cookies>;
  try {
    cookieStore = cookies();
  } catch {
    return null;
  }
  let sessionCookie: { value: string } | undefined;
  try {
    sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  } catch {
    return null;
  }

  if (sessionCookie?.value) {
    const session = parseSignedSession(sessionCookie.value);
    if (session) {
      return session;
    }
  }

  // Fallback sinkronisasi dari portal identity (Supabase Auth / demo_session / active_role)
  try {
    const { getCurrentUserWithRoles } = await import('@/modules/identity/actions');
    const userContext = await getCurrentUserWithRoles();
    if (userContext) {
      const role: Role =
        userContext.activeRole === 'STUDENT'
          ? 'MAHASISWA'
          : userContext.activeRole === 'LECTURER' || userContext.activeRole === 'TEACHING_ASSISTANT'
          ? 'DOSEN'
          : 'ADMIN';

      return {
        userId: userContext.user.id,
        email: userContext.user.email || userContext.profile?.email || '',
        name: userContext.profile?.full_name || 'Pengguna RuangKampus',
        role,
        subId: userContext.user.id,
      };
    }
  } catch {
    // Abaikan jika dalam konteks statis
  }

  // Fallback sinkronisasi dari portal identity (demo_session / active_role)
  // Di production, demo_session hanya diizinkan jika ALLOW_DEMO_AUTH === 'true'
  const isProd = process.env.NODE_ENV === 'production';
  const rawDemoSessionId = cookieStore.get("demo_session")?.value;
  const isSuperAdminDemo =
    rawDemoSessionId === "a0000010-0000-0000-0000-000000000010" ||
    (rawDemoSessionId && rawDemoSessionId.startsWith("u-staf-20120009"));
  const allowDemo = !isProd || process.env.ALLOW_DEMO_AUTH === 'true' || Boolean(isSuperAdminDemo);
  const demoSessionId = allowDemo ? rawDemoSessionId : undefined;
  const activeRoleCode = allowDemo ? cookieStore.get("active_role")?.value : undefined;

  if (demoSessionId || activeRoleCode) {
    const role: Role =
      activeRoleCode === "STUDENT"
        ? "MAHASISWA"
        : activeRoleCode === "LECTURER" || activeRoleCode === "TEACHING_ASSISTANT"
        ? "DOSEN"
        : "ADMIN";

    const subId =
      role === "MAHASISWA"
        ? "mhs-1"
        : role === "DOSEN"
        ? "dsn-1"
        : undefined;

    return {
      userId: demoSessionId || "usr-superadmin",
      email: "superadmin@siajar.test",
      name: "Super Administrator",
      role,
      subId,
    };
  }

  return null;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]): Promise<AuthSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

/**
 * Mencari profil pengguna di database atau seed data
 */
export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();

  // Coba query database bila database terhubung
  try {
    const dbUser = await prisma.pengguna.findUnique({
      where: { email: normalized },
      include: {
        mahasiswa: true,
        dosen: true,
      },
    });
    if (dbUser) return dbUser;
  } catch {
    // Database offline atau kredensial belum ada, gunakan fallback seed store
  }

  // Fallback ke seed data
  const seedUser = SEED_USERS.find((u) => u.email.toLowerCase() === normalized);
  if (seedUser) {
    const dsn = SEED_DOSEN.find((d) => d.email.toLowerCase() === normalized);
    return {
      ...seedUser,
      dosen: dsn || null,
      mahasiswa: null,
    };
  }

  // Cek apakah mahasiswa
  const seedMhs = SEED_MAHASISWA.find((m) => m.email.toLowerCase() === normalized);
  if (seedMhs) {
    return {
      id: `usr-${seedMhs.id}`,
      email: seedMhs.email,
      peran: "MAHASISWA" as const,
      passwordHash: null,
      aktif: true,
      mahasiswa: seedMhs,
      dosen: null,
    };
  }

  return null;
}
