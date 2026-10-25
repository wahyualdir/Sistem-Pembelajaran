import { getCurrentUserWithRoles } from "@/modules/identity/actions";
import { SYNTHETIC_DEMO_USERS } from "@/modules/identity/demo-users";
import { MasterStore } from "@/features/master/master-store";

export interface PdfAccessCheckResult {
  authorized: boolean;
  status?: number;
  error?: string;
  userContext?: any;
}

/**
 * Memvalidasi hak akses untuk mengunduh dokumen akademik mahasiswa (KHS, Transkrip, Kartu Ujian).
 * Mencegah IDOR (Insecure Direct Object References) antar mahasiswa.
 */
export async function authorizeAcademicStudentAccess(
  targetMahasiswaId: string
): Promise<PdfAccessCheckResult> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext) {
    return {
      authorized: false,
      status: 401,
      error: "UNAUTHORIZED: Sesi otentikasi diperlukan untuk mengunduh dokumen akademik.",
    };
  }

  const isPrivileged = userContext.roles.some((r: any) => {
    const code = r?.roles?.code || r?.role_id || r?.code;
    return [
      "SUPER_ADMIN",
      "SYSTEM_ADMIN",
      "ACADEMIC_STAFF",
      "PROGRAM_COORDINATOR",
      "LECTURER",
    ].includes(code);
  });

  if (isPrivileged) {
    return { authorized: true, userContext };
  }

  // Jika bukan staf/dosen/admin, wajib mahasiswa yang bersangkutan
  const mhs = MasterStore.getMahasiswaById(targetMahasiswaId);
  const callerId = userContext.user.id;
  const callerEmail = (userContext.user.email || userContext.profile?.email || "").toLowerCase();
  const callerDemo = SYNTHETIC_DEMO_USERS[callerId] || SYNTHETIC_DEMO_USERS[callerEmail];

  const matches =
    callerId === targetMahasiswaId ||
    (mhs && callerId === `u-mhs-${mhs.nim}`) ||
    (mhs && callerEmail === mhs.email.toLowerCase()) ||
    (mhs && callerDemo && (callerDemo.subId === mhs.id || callerDemo.nim === mhs.nim));

  if (!matches) {
    return {
      authorized: false,
      status: 403,
      error: "FORBIDDEN: Anda tidak memiliki wewenang untuk mengakses dokumen akademik mahasiswa lain.",
    };
  }

  return { authorized: true, userContext };
}

/**
 * Memvalidasi hak akses untuk mengunduh berkas surat permohonan.
 */
export async function authorizeSuratAccess(surat: {
  mahasiswaId?: string;
  nim?: string;
}): Promise<PdfAccessCheckResult> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext) {
    return {
      authorized: false,
      status: 401,
      error: "UNAUTHORIZED: Sesi otentikasi diperlukan untuk mengunduh surat.",
    };
  }

  const isPrivileged = userContext.roles.some((r: any) => {
    const code = r?.roles?.code || r?.role_id || r?.code;
    return [
      "SUPER_ADMIN",
      "SYSTEM_ADMIN",
      "ACADEMIC_STAFF",
      "PROGRAM_COORDINATOR",
    ].includes(code);
  });

  if (isPrivileged) {
    return { authorized: true, userContext };
  }

  const callerId = userContext.user.id;
  const callerEmail = (userContext.user.email || userContext.profile?.email || "").toLowerCase();
  const callerDemo = SYNTHETIC_DEMO_USERS[callerId] || SYNTHETIC_DEMO_USERS[callerEmail];

  const matches =
    callerId === surat.mahasiswaId ||
    (surat.nim && callerId === `u-mhs-${surat.nim}`) ||
    (callerDemo &&
      ((surat.mahasiswaId && callerDemo.subId === surat.mahasiswaId) ||
        (surat.nim && callerDemo.nim === surat.nim)));

  if (!matches) {
    return {
      authorized: false,
      status: 403,
      error: "FORBIDDEN: Anda tidak memiliki wewenang untuk mengakses surat permohonan mahasiswa lain.",
    };
  }

  return { authorized: true, userContext };
}
