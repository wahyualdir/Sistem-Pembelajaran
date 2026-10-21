// ============================================================================
// CLI Utama Penyemaian Data Akademik SIAJAR (UIR Ganjil 2026/2027)
// Spesifikasi: docs/INSTRUKSI_SEED_AKADEMIK.md (Bagian 2, 8)
// ============================================================================

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { assertSafetyGuard, assertNoRealUsersInDatabase } from './guard';
import { loadAllSeedData, validateCrossDataIntegrity } from './load';
import { provisionAllAccounts } from './accounts';
import { seedAcademicData } from './academic';
import { verifySeedAkademik } from './verify';
import { generateLegacySeedFile } from './generate-legacy';

// Muat variabel lingkungan dari .env.local dan .env secara zero-dependency
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const isReset = args.includes('--reset');
  const isVerifyOnly = args.includes('--verify');
  const isGenerateLegacy = args.includes('--generate-legacy');
  const isDryRun = !isApply && !isReset && !isVerifyOnly && !isGenerateLegacy;

  console.log('================================================================');
  console.log('   SIAJAR: Penyemaian Data Akademik UIR (Ganjil 2026/2027)      ');
  console.log('================================================================');

  const seedDataDir = path.resolve(process.cwd(), 'docs', 'seed-data');

  // 1. Muat dan Validasi Berkas CSV
  console.log(`\n📂 [1/4] Memuat dan memvalidasi berkas CSV dari ${seedDataDir}...`);
  const dataset = loadAllSeedData(seedDataDir);
  const summary = validateCrossDataIntegrity(dataset);

  console.log('   ✅ Validasi Zod dan Integritas Silang Berhasil:');
  console.log(`      - Mahasiswa          : ${summary.totalMahasiswa} orang (NIM 23..26)`);
  console.log(`      - Dosen              : ${summary.totalDosen} orang (NIDN 10-digit)`);
  console.log(`      - Staf & Admin       : ${summary.totalStaf} orang (NIP 8-digit)`);
  console.log(`      - Ruang Kelas/Lab    : ${summary.totalRuang} ruangan`);
  console.log(`      - Mata Kuliah        : ${summary.totalKurikulum} kurikulum (38 alias jadwal)`);
  console.log(`      - Kelas Perkuliahan  : ${summary.totalKelasUnik} kelas unik`);
  console.log(`      - Slot Jadwal        : ${summary.totalJadwal} sesi kuliah`);
  console.log(`      - Pendaftaran KRS    : ${summary.totalKrs} entri`);
  console.log(`      - Penugasan Asdos    : ${summary.totalAsdos} penugasan`);

  // MODE GENERATE LEGACY
  if (isGenerateLegacy) {
    console.log('\n⚙️  Menghasilkan berkas lapisan legacy src/lib/db/seed-data.uir-ti-2026.generated.ts...');
    generateLegacySeedFile();
    process.exit(0);
  }

  // MODE DRY RUN (dapat berjalan tanpa koneksi database langsung)
  if (isDryRun) {
    console.log('\nℹ️  MODE KERING (DRY-RUN):');
    console.log('   Semua data valid dan konsisten. Tidak ada perubahan yang ditulis ke database.');
    console.log('   Gunakan flag --apply untuk melakukan penulisan sungguhan.');
    process.exit(0);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diatur untuk operasi --apply, --reset, atau --verify.');
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Evaluasi Guard Lingkungan & Keamanan (Wajib Fail-Closed)
  console.log('\n🛡️  [2/4] Mengevaluasi Guard Lingkungan & Pengaman Keselamatan...');
  assertSafetyGuard({
    seedEnv: process.env.SEED_ENV,
    seedConfirmProjectRef: process.env.SEED_CONFIRM_PROJECT_REF,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    seedPassword: process.env.SEED_PASSWORD,
    supabaseUrl,
  });

  const allowExisting = process.env.SEED_ALLOW_EXISTING_USERS === 'true';
  await assertNoRealUsersInDatabase(supabaseAdmin, allowExisting);
  console.log('   ✅ Guard lolos: Lingkungan aman dan bukan proyek produksi.');

  // MODE VERIFIKASI SAJA
  if (isVerifyOnly) {
    console.log('\n🔎 Menjalankan verifikasi database akademik...');
    const verifyResult = await verifySeedAkademik(supabaseAdmin);
    printVerificationResult(verifyResult);
    process.exit(verifyResult.passed ? 0 : 1);
  }

  // MODE RESET
  if (isReset) {
    console.log('\n🗑️  MODE RESET: Membersihkan data seed berdomain .test...');
    // Hapus pendaftaran dan kelas terkait prodi 351
    await supabaseAdmin.from('programs').delete().eq('code', '351');
    await supabaseAdmin.from('semesters').delete().eq('label', 'Ganjil 2026/2027');

    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const testUsers = (listData?.users || []).filter((u) => u.email?.endsWith('.test'));
    for (const u of testUsers) {
      await supabaseAdmin.auth.admin.deleteUser(u.id);
    }
    console.log(`   ✅ Dihapus ${testUsers.length} pengguna berdomain .test dan data akademik terkait.`);
    process.exit(0);
  }

  // 3. Penyediaan 168 Akun Login & Peran
  console.log('\n👥 [3/4] Menyediakan 168 akun login, profil, identitas & peran...');
  const seedPassword = process.env.SEED_PASSWORD!;
  const forcePasswordChange = process.env.SEED_FORCE_PASSWORD_CHANGE === 'true';

  const accountResult = await provisionAllAccounts(supabaseAdmin, dataset, seedPassword, {
    forcePasswordChange,
  });

  console.log(`   ✅ Selesai memproses akun:`);
  console.log(`      - Akun baru dibuat : ${accountResult.summary.akunBaruDibuat}`);
  console.log(`      - Akun sudah ada   : ${accountResult.summary.akunSudahAda}`);
  if (accountResult.summary.errors.length > 0) {
    console.warn(`      ⚠️  Terdapat ${accountResult.summary.errors.length} peringatan saat pembuatan akun:`);
    accountResult.summary.errors.slice(0, 5).forEach((e) => console.warn(`         * ${e}`));
  }

  // 4. Penyemaian Data Akademik
  console.log('\n📚 [4/4] Menyemai data akademik (Prodi, Semester, Ruang, Kelas, Slot, KRS, Asdos)...');
  const withPertemuan = process.env.SEED_WITH_PERTEMUAN === 'true';
  const tanggalMulai = process.env.TANGGAL_MULAI_KULIAH || '2026-08-31';

  const academicResult = await seedAcademicData(
    supabaseAdmin,
    dataset,
    accountResult.userMap,
    {
      withPertemuan,
      tanggalMulaiKuliah: tanggalMulai,
    }
  );

  console.log('   ✅ Data akademik berhasil disimpan:');
  console.log(`      - Kelas aktif      : ${academicResult.classes}`);
  console.log(`      - Kelas 2 dosen    : ${academicResult.classesDuaDosen}`);
  console.log(`      - Slot jadwal      : ${academicResult.scheduleSlots}`);
  console.log(`      - Pendaftaran KRS  : ${academicResult.enrollments}`);
  console.log(`      - Izin asisten     : ${academicResult.classAssistantsRows}`);
  console.log(`      - Peran TA (CLASS) : ${academicResult.taRoleAssignments}`);
  if (withPertemuan) {
    console.log(`      - Sesi pertemuan   : ${academicResult.attendanceSessions}`);
  }

  // 5. Verifikasi Otomatis
  console.log('\n🔎 Menjalankan verifikasi otomatis...');
  const verifyResult = await verifySeedAkademik(supabaseAdmin);
  printVerificationResult(verifyResult);

  if (!verifyResult.passed) {
    console.error('\n❌ Terdapat butir verifikasi yang belum sesuai.');
    process.exit(1);
  }

  console.log('\n🎉 PENYEMAIAN DATA AKADEMIK UIR GANJIL 2026/2027 SELESAI DAN VALID 100%!');
  process.exit(0);
}

function printVerificationResult(result: { passed: boolean; checks: any[] }) {
  console.log('----------------------------------------------------------------');
  console.log('HASIL VERIFIKASI SEED AKADEMIK:');
  console.log('----------------------------------------------------------------');
  for (const c of result.checks) {
    const mark = c.passed ? '✅ LULUS' : '❌ GAGAL';
    console.log(`${mark} | ${c.title.padEnd(48)} | Harapan: ${String(c.expected).padEnd(5)} | Aktual: ${c.actual}`);
  }
  console.log('----------------------------------------------------------------');
  console.log(`Status Keseluruhan: ${result.passed ? 'SEMUA BUTIR LULUS' : 'ADA BUTIR YANG GAGAL'}`);
}

main().catch((err) => {
  console.error('\n💥 Terjadi kesalahan fatal:', err);
  process.exit(1);
});
