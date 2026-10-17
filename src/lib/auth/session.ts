import { cookies } from "next/headers";
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

export async function createSessionCookie(session: AuthSession) {
  const cookieStore = cookies();
  const value = Buffer.from(JSON.stringify(session)).toString("base64");
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
    try {
      const raw = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
      const session = JSON.parse(raw) as AuthSession;
      if (session.userId && session.role) {
        return session;
      }
    } catch {
      // Fallback ke pengecekan sesi alternatif
    }
  }

  // Fallback sinkronisasi dari portal identity (demo_session / active_role)
  // Di production, demo_session hanya diizinkan jika ALLOW_DEMO_AUTH === 'true'
  const isProd = process.env.NODE_ENV === 'production';
  const allowDemo = !isProd || process.env.ALLOW_DEMO_AUTH === 'true';
  const demoSessionId = allowDemo ? cookieStore.get("demo_session")?.value : undefined;
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
