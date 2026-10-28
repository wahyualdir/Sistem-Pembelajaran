import { createClient } from '@supabase/supabase-js';

/**
 * Script untuk membuat atau memperbarui akun Super Admin di Supabase Auth & DB secara sah.
 * Dijalankan dengan: npx tsx scripts/create-superadmin.ts
 *
 * Persyaratan env:
 * - SUPABASE_SERVICE_ROLE_KEY (wajib)
 * - SUPERADMIN_EMAIL (opsional, default: superadmin@siajar.ac.id)
 * - SUPERADMIN_PASSWORD (wajib, minimal 14 karakter)
 * - NEXT_PUBLIC_SUPABASE_URL (opsional, default: http://localhost:54321)
 */
async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('❌ GAGAL: Variabel lingkungan SUPABASE_SERVICE_ROLE_KEY wajib diatur.');
    process.exit(1);
  }

  const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@siajar.ac.id').trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!password) {
    console.error('❌ GAGAL: Variabel lingkungan SUPERADMIN_PASSWORD wajib diatur.');
    process.exit(1);
  }

  if (password.length < 14) {
    console.error(
      `❌ GAGAL: SUPERADMIN_PASSWORD terlalu pendek (${password.length} karakter). Minimal 14 karakter untuk keamanan production.`
    );
    process.exit(1);
  }

  const fullName = (process.env.SUPERADMIN_NAME || 'Super Administrator SIAJAR').trim();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`🔒 Menyiapkan akun Super Admin untuk: ${email} pada ${supabaseUrl}`);

  // 1. Cari atau buat akun di Supabase Auth
  let userId: string | null = null;

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (listError) {
    console.error('❌ Gagal memeriksa daftar pengguna Supabase Auth:', listError.message);
    process.exit(1);
  }

  const existingAuthUser = usersData.users.find((u) => u.email?.toLowerCase() === email);

  if (existingAuthUser) {
    console.log(`ℹ️ Pengguna ditemukan di Supabase Auth (${existingAuthUser.id}). Memperbarui kata sandi...`);
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      existingAuthUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }
    );

    if (updateError) {
      console.error('❌ Gagal memperbarui kata sandi pengguna:', updateError.message);
      process.exit(1);
    }
    userId = updateData.user.id;
  } else {
    console.log('ℹ️ Pengguna belum ada di Supabase Auth. Membuat pengguna baru...');
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      console.error('❌ Gagal membuat pengguna baru di Supabase Auth:', createError.message);
      process.exit(1);
    }
    userId = createData.user.id;
  }

  if (!userId) {
    console.error('❌ Gagal mendapatkan ID pengguna.');
    process.exit(1);
  }

  // 2. Upsert di tabel public.profiles
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      email,
      status: 'ACTIVE',
      must_change_password: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error('❌ Gagal memperbarui tabel profiles:', profileError.message);
    process.exit(1);
  }
  console.log('✅ Profil pengguna diperbarui di public.profiles');

  // 3. Upsert di tabel public.user_identifiers
  const { error: identEmailError } = await supabase.from('user_identifiers').upsert(
    {
      user_id: userId,
      type: 'EMAIL',
      value: email,
      is_primary: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'type,value' }
  );

  if (identEmailError) {
    console.warn('⚠️ Gagal menyimpan identifier EMAIL:', identEmailError.message);
  }

  const { error: identUserError } = await supabase.from('user_identifiers').upsert(
    {
      user_id: userId,
      type: 'USERNAME',
      value: 'superadmin',
      is_primary: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'type,value' }
  );

  if (identUserError) {
    console.warn('⚠️ Gagal menyimpan identifier USERNAME superadmin:', identUserError.message);
  }

  // 4. Cari role SUPER_ADMIN di tabel public.roles
  let { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('id, code')
    .eq('code', 'SUPER_ADMIN')
    .maybeSingle();

  if (roleError) {
    console.error('❌ Gagal memeriksa tabel roles:', roleError.message);
    process.exit(1);
  }

  if (!roleData) {
    console.log('ℹ️ Role SUPER_ADMIN belum ada di tabel roles. Membuat role baru...');
    const { data: newRole, error: insertRoleError } = await supabase
      .from('roles')
      .insert({
        code: 'SUPER_ADMIN',
        name: 'Super Administrator',
        description: 'Akses administratif penuh ke seluruh sistem LMS SIAJAR',
      })
      .select('id, code')
      .single();

    if (insertRoleError) {
      console.error('❌ Gagal membuat role SUPER_ADMIN:', insertRoleError.message);
      process.exit(1);
    }
    roleData = newRole;
  }

  // 5. Tambahkan baris user_roles ber-role SUPER_ADMIN
  const { error: userRoleError } = await supabase.from('user_roles').upsert(
    {
      user_id: userId,
      role_id: roleData.id,
      scope_type: 'GLOBAL',
      status: 'ACTIVE',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,role_id,scope_type,scope_id' }
  );

  if (userRoleError) {
    console.error('❌ Gagal mengaitkan user_roles SUPER_ADMIN:', userRoleError.message);
    process.exit(1);
  }
  console.log('✅ Role SUPER_ADMIN berhasil diberikan di public.user_roles');

  // 6. Catat ke audit_logs
  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_user_id: userId,
    actor_role: 'SUPER_ADMIN',
    action: 'PROVISION_SUPERADMIN',
    entity_type: 'USER',
    entity_id: userId,
    after_json: {
      email,
      role: 'SUPER_ADMIN',
      method: 'scripts/create-superadmin.ts',
      timestamp: new Date().toISOString(),
    },
  });

  if (auditError) {
    console.warn('⚠️ Gagal mencatat log audit:', auditError.message);
  } else {
    console.log('✅ Log audit tercatat di public.audit_logs');
  }

  console.log('🎉 Selesai! Akun Super Admin telah siap digunakan untuk autentikasi produksi.');
}

main().catch((err) => {
  console.error('❌ Terjadi kesalahan tidak terduga:', err);
  process.exit(1);
});
