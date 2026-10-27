// ============================================================================
// Penyediaan 168 Akun Login, Profil, Identitas & Peran (Fase S3)
// Spesifikasi: docs/INSTRUKSI_SEED_AKADEMIK.md (Bagian 4, 7, S3)
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { AllSeedDataset, MahasiswaData, DosenBaruData, StafAdminData } from './load';

export interface ProvisionAccountResult {
  userId: string;
  email: string;
  identifierType: 'NIM' | 'NIDN' | 'NIP';
  identifierValue: string;
  fullName: string;
  isNew: boolean;
}

export interface AccountsProvisionSummary {
  totalMahasiswa: number;
  totalDosen: number;
  totalStafAdmin: number;
  totalAkunDiproses: number;
  akunBaruDibuat: number;
  akunSudahAda: number;
  errors: string[];
}

export async function ensureAllowedEmailDomains(supabaseAdmin: SupabaseClient): Promise<void> {
  const testDomains = ['mhs.siajar.test', 'dosen.siajar.test', 'staf.siajar.test'];
  for (const domain of testDomains) {
    try {
      await supabaseAdmin.from('allowed_email_domains').upsert(
        { domain, is_active: true, notes: 'Domain pengujian seed akademik UIR' },
        { onConflict: 'domain' }
      );
    } catch {
      // Abaikan bila tabel allowed_email_domains belum dibuat di proyek lokal
    }
  }
}

async function getOrCreateAuthUser(
  supabaseAdmin: SupabaseClient,
  email: string,
  fullName: string,
  password: string
): Promise<{ userId: string; isNew: boolean }> {
  // 1. Cek dulu dari tabel profiles jika user sudah ada di database
  const { data: prof } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (prof && prof.id) {
    return { userId: prof.id, isNew: false };
  }

  // 2. Cek apakah user sudah terdaftar di auth.users lewat pencarian Admin API
  try {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = listData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { userId: existing.id, isNew: false };
    }
  } catch {
    // Abaikan error listing
  }

  // 3. Buat user baru lewat Admin API Supabase
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      name: fullName,
    },
  });

  if (error || !data.user) {
    if (error?.message?.includes('already been registered')) {
      const { data: fallbackProf } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (fallbackProf && fallbackProf.id) {
        return { userId: fallbackProf.id, isNew: false };
      }
    }
    throw new Error(`Gagal membuat akun auth untuk ${email}: ${error?.message || 'Unknown error'}`);
  }

  return { userId: data.user.id, isNew: true };
}

export async function provisionAllAccounts(
  supabaseAdmin: SupabaseClient,
  data: AllSeedDataset,
  password: string,
  options: {
    forcePasswordChange?: boolean;
    programId?: string; // ID prodi TI untuk scope PROGRAM Kaprodi
  } = {}
): Promise<{
  summary: AccountsProvisionSummary;
  userMap: Map<string, string>; // identifier -> userId
  emailMap: Map<string, string>; // email -> userId
}> {
  const { forcePasswordChange = false, programId } = options;
  const errors: string[] = [];
  const userMap = new Map<string, string>();
  const emailMap = new Map<string, string>();

  let akunBaruDibuat = 0;
  let akunSudahAda = 0;

  // 1. Ambil ID semua role dari public.roles
  const { data: rolesRows, error: rolesError } = await supabaseAdmin
    .from('roles')
    .select('id, code');

  if (rolesError || !rolesRows) {
    throw new Error(`Gagal memuat roles dari database: ${rolesError?.message}`);
  }

  const roleIdMap = new Map<string, string>();
  for (const r of rolesRows) {
    roleIdMap.set(r.code, r.id);
  }

  const rStudent = roleIdMap.get('STUDENT');
  const rLecturer = roleIdMap.get('LECTURER');
  const rCoord = roleIdMap.get('PROGRAM_COORDINATOR');
  const rStaff = roleIdMap.get('ACADEMIC_STAFF');
  const rAdmin = roleIdMap.get('SYSTEM_ADMIN');
  const rSuper = roleIdMap.get('SUPER_ADMIN');

  if (!rStudent || !rLecturer || !rStaff || !rAdmin) {
    throw new Error('Role standar (STUDENT, LECTURER, ACADEMIC_STAFF, SYSTEM_ADMIN) belum lengkap di database.');
  }

  // 2. Pastikan domain email .test diizinkan jika tabelnya ada
  await ensureAllowedEmailDomains(supabaseAdmin);

  // Helper untuk memproses 1 akun
  const processOne = async (
    email: string,
    fullName: string,
    identType: 'NIM' | 'NIDN' | 'NIP',
    identValue: string,
    assignRoles: { roleId: string; scopeType: 'GLOBAL' | 'PROGRAM'; scopeId?: string | null }[]
  ) => {
    try {
      const { userId, isNew } = await getOrCreateAuthUser(supabaseAdmin, email, fullName, password);
      if (isNew) akunBaruDibuat++;
      else akunSudahAda++;

      userMap.set(identValue, userId);
      emailMap.set(email.toLowerCase(), userId);

      // Upsert profiles
      await supabaseAdmin.from('profiles').upsert(
        {
          id: userId,
          full_name: fullName,
          email,
          status: 'ACTIVE',
          must_change_password: forcePasswordChange,
        },
        { onConflict: 'id' }
      );

      // Upsert user_identifiers (Primer NIM/NIDN/NIP)
      await supabaseAdmin.from('user_identifiers').upsert(
        {
          user_id: userId,
          type: identType,
          value: identValue,
          is_primary: true,
        },
        { onConflict: 'type,value' }
      );

      // Upsert user_identifiers (Email Teknis)
      await supabaseAdmin.from('user_identifiers').upsert(
        {
          user_id: userId,
          type: 'EMAIL',
          value: email,
          is_primary: false,
        },
        { onConflict: 'type,value' }
      );

      // Assign roles
      for (const roleItem of assignRoles) {
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role_id', roleItem.roleId)
          .maybeSingle();

        if (!existingRole) {
          await supabaseAdmin.from('user_roles').insert({
            user_id: userId,
            role_id: roleItem.roleId,
            scope_type: roleItem.scopeType,
            scope_id: roleItem.scopeId || null,
            status: 'ACTIVE',
          });
        } else {
          await supabaseAdmin
            .from('user_roles')
            .update({
              status: 'ACTIVE',
              scope_type: roleItem.scopeType,
              scope_id: roleItem.scopeId || null,
            })
            .eq('id', existingRole.id);
        }
      }
    } catch (err: any) {
      errors.push(`[${identType} ${identValue}] ${email}: ${err.message || String(err)}`);
    }
  };

  // 3. Proses 120 Mahasiswa
  for (const m of data.mahasiswa) {
    await processOne(m.email_login, m.nama, 'NIM', m.nim, [
      { roleId: rStudent, scopeType: 'GLOBAL' },
    ]);
  }

  // 4. Proses 42 Dosen
  for (const d of data.dosen) {
    const isKaprodi = d.id_dosen === 'D004';
    const rolesToAssign: { roleId: string; scopeType: 'GLOBAL' | 'PROGRAM'; scopeId?: string | null }[] = [
      { roleId: rLecturer, scopeType: 'GLOBAL' },
    ];

    if (isKaprodi && rCoord) {
      rolesToAssign.push({
        roleId: rCoord,
        scopeType: programId ? 'PROGRAM' : 'GLOBAL',
        scopeId: programId || null,
      });
    }

    await processOne(d.email_login, d.nama_lengkap, 'NIDN', d.nidn_10_digit, rolesToAssign);
  }

  // 5. Proses 6 Staf dan Admin
  for (const s of data.staf) {
    const rolesToAssign: { roleId: string; scopeType: 'GLOBAL' | 'PROGRAM'; scopeId?: string | null }[] = [];

    if (s.peran === 'ACADEMIC_STAFF') {
      rolesToAssign.push({ roleId: rStaff, scopeType: 'GLOBAL' });
    } else if (s.peran === 'SYSTEM_ADMIN') {
      rolesToAssign.push({ roleId: rAdmin, scopeType: 'GLOBAL' });
    } else if (s.peran === 'SUPER_ADMIN') {
      if (rSuper) rolesToAssign.push({ roleId: rSuper, scopeType: 'GLOBAL' });
      rolesToAssign.push({ roleId: rAdmin, scopeType: 'GLOBAL' });
    }

    await processOne(s.email_login, s.nama_lengkap, 'NIP', s.nip_8_digit, rolesToAssign);
  }

  return {
    summary: {
      totalMahasiswa: data.mahasiswa.length,
      totalDosen: data.dosen.length,
      totalStafAdmin: data.staf.length,
      totalAkunDiproses: data.mahasiswa.length + data.dosen.length + data.staf.length,
      akunBaruDibuat,
      akunSudahAda,
      errors,
    },
    userMap,
    emailMap,
  };
}
