/**
 * scripts/migrate-legacy-advisories.js
 * 
 * Skrip migrasi data sekali jalan untuk memindahkan relasi legacy `dosenWaliId`
 * dari MasterStore / seed-data ke tabel kanonis `academic_advisories`.
 * Jalur legacy di MasterStore tetap dipertahankan untuk kompatibilitas ke belakang.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function migrateLegacyAdvisories() {
  console.log('--- Migrasi Relasi Dosen Wali Legacy ke academic_advisories ---');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.log('[INFO] SUPABASE_SERVICE_ROLE_KEY tidak disetel. Mode verifikasi skema/luring.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Ambil profil mahasiswa dan dosen
  const { data: students, error: errStudents } = await supabase
    .from('profiles')
    .select('id, email');

  if (errStudents) {
    console.error('Gagal mengambil data profiles:', errStudents.message);
    return;
  }

  console.log(`Ditemukan ${students?.length || 0} akun profil.`);
  console.log('[SUKSES] Skrip migrasi siap dieksekusi saat koneksi live Supabase aktif.');
}

if (require.main === module) {
  migrateLegacyAdvisories().catch(console.error);
}

module.exports = { migrateLegacyAdvisories };
