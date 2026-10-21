// ============================================================================
// Skrip Verifikasi Mandiri Data Seed Akademik UIR (Bagian 10 & S6)
// Spesifikasi: docs/INSTRUKSI_SEED_AKADEMIK.md (Bagian 10)
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';

export interface VerificationCheck {
  title: string;
  expected: any;
  actual: any;
  passed: boolean;
  details?: string;
}

export async function verifySeedAkademik(
  supabaseAdmin: SupabaseClient
): Promise<{ passed: boolean; checks: VerificationCheck[] }> {
  const checks: VerificationCheck[] = [];

  const addCheck = (title: string, expected: any, actual: any, details?: string) => {
    const passed = JSON.stringify(expected) === JSON.stringify(actual);
    checks.push({ title, expected, actual, passed, details });
  };

  // 1. Hitung user_identifiers (NIM=120, NIDN=42, NIP=6)
  const { data: identData } = await supabaseAdmin
    .from('user_identifiers')
    .select('type, value');

  const nimCount = (identData || []).filter((i) => i.type === 'NIM').length;
  const nidnCount = (identData || []).filter((i) => i.type === 'NIDN').length;
  const nipCount = (identData || []).filter((i) => i.type === 'NIP').length;

  addCheck('user_identifiers tipe NIM', 120, nimCount);
  addCheck('user_identifiers tipe NIDN', 42, nidnCount);
  addCheck('user_identifiers tipe NIP', 6, nipCount);

  // 2. Hitung auth.users dengan domain .test (harus 168)
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const allUsers = usersData?.users || [];
  const testUsers = allUsers.filter((u) => u.email?.endsWith('.test'));
  addCheck('auth.users berdomain .test', 168, testUsers.length);

  // Cek apakah ada akun domain kampus asli yang tidak semestinya
  const forbiddenUsers = allUsers.filter(
    (u) =>
      u.email?.endsWith('@uir.ac.id') ||
      u.email?.endsWith('@student.uir.ac.id') ||
      u.email?.includes('gmail.com')
  );
  addCheck('Bebas dari email domain asli kampus di lingkungan seed', 0, forbiddenUsers.length);

  // 3. Master Data: Programs = 1 (kode 351), Semesters = 1, Rooms = 14, Courses = 63
  const { count: progCount } = await supabaseAdmin
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('code', '351');
  addCheck('programs (kode 351)', 1, progCount ?? 0);

  const { count: semCount } = await supabaseAdmin
    .from('semesters')
    .select('*', { count: 'exact', head: true })
    .eq('label', 'Ganjil 2026/2027');
  addCheck('semesters (Ganjil 2026/2027)', 1, semCount ?? 0);

  const { count: roomCount } = await supabaseAdmin
    .from('rooms')
    .select('*', { count: 'exact', head: true });
  addCheck('rooms terdaftar', 14, roomCount ?? 0);

  const { count: courseCount } = await supabaseAdmin
    .from('courses')
    .select('*', { count: 'exact', head: true });
  addCheck('courses (Kurikulum 2025)', 63, courseCount ?? 0);

  const { count: aliasCount } = await supabaseAdmin
    .from('course_code_aliases')
    .select('*', { count: 'exact', head: true });
  addCheck('course_code_aliases', 38, aliasCount ?? 0);

  // 4. Kelas & Slot: Classes = 164, class_schedule_slots = 256, enrollments = 870
  const { count: classCount } = await supabaseAdmin
    .from('classes')
    .select('*', { count: 'exact', head: true });
  addCheck('classes semester ganjil', 164, classCount ?? 0);

  const { count: slotCount } = await supabaseAdmin
    .from('class_schedule_slots')
    .select('*', { count: 'exact', head: true });
  addCheck('class_schedule_slots mingguan', 256, slotCount ?? 0);

  const { count: enrollCount } = await supabaseAdmin
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');
  addCheck('enrollments aktif mahasiswa', 870, enrollCount ?? 0);

  // 5. Asisten Dosen: class_assistants = 112 baris, role TEACHING_ASSISTANT (scope CLASS) = 56
  const { count: asstCount } = await supabaseAdmin
    .from('class_assistants')
    .select('*', { count: 'exact', head: true });
  addCheck('class_assistants baris delegasi izin', 112, asstCount ?? 0);

  const { data: taRoles } = await supabaseAdmin
    .from('user_roles')
    .select('id, roles!inner(code)')
    .eq('scope_type', 'CLASS')
    .eq('roles.code', 'TEACHING_ASSISTANT');
  addCheck('user_roles peran TEACHING_ASSISTANT cakupan CLASS', 56, taRoles?.length ?? 0);

  // 6. Kelas dengan dua dosen: 5 kelas (dosen kedua memiliki peran LECTURER cakupan CLASS)
  const { data: lecturerClassRoles } = await supabaseAdmin
    .from('user_roles')
    .select('id, roles!inner(code)')
    .eq('scope_type', 'CLASS')
    .eq('roles.code', 'LECTURER');
  addCheck('Kelas dengan dua dosen (LECTURER cakupan CLASS)', 5, lecturerClassRoles?.length ?? 0);

  // 7. Peran: PROGRAM_COORDINATOR = 1, ACADEMIC_STAFF = 3, SYSTEM_ADMIN = 3, SUPER_ADMIN = 1
  const { data: globalRoles } = await supabaseAdmin
    .from('user_roles')
    .select('role_id, scope_type, roles!inner(code)')
    .eq('status', 'ACTIVE');

  const coordCount = (globalRoles || []).filter((r: any) => r.roles.code === 'PROGRAM_COORDINATOR').length;
  const staffCount = (globalRoles || []).filter((r: any) => r.roles.code === 'ACADEMIC_STAFF').length;
  const adminCount = (globalRoles || []).filter((r: any) => r.roles.code === 'SYSTEM_ADMIN').length;
  const superCount = (globalRoles || []).filter((r: any) => r.roles.code === 'SUPER_ADMIN').length;

  addCheck('Peran PROGRAM_COORDINATOR aktif', 1, coordCount);
  addCheck('Peran ACADEMIC_STAFF aktif', 3, staffCount);
  addCheck('Peran SYSTEM_ADMIN aktif', 3, adminCount);
  addCheck('Peran SUPER_ADMIN aktif', 1, superCount);

  // Kesimpulan
  const allPassed = checks.every((c) => c.passed);
  return { passed: allPassed, checks };
}
