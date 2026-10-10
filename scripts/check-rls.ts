import * as fs from 'fs';
import * as path from 'path';

/**
 * CI Check: Memastikan SEMUA tabel skema public memiliki Row Level Security (RLS) diaktifkan.
 * Memenuhi Aturan Keras 1: "RLS aktif di SEMUA tabel schema public, deny-by-default. Buat check CI yang gagal jika ada tabel tanpa RLS."
 */
async function checkMigrationsRLS(): Promise<boolean> {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Direktori supabase/migrations tidak ditemukan!');
    return false;
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  const allSql = files
    .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf-8'))
    .join('\n');

  // Cari semua CREATE TABLE public.<nama> atau CREATE TABLE IF NOT EXISTS public.<nama>
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.([a-zA-Z0-9_]+)/gi;
  const createdTables = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = createTableRegex.exec(allSql)) !== null) {
    createdTables.add(match[1].toLowerCase());
  }

  // Cari semua ALTER TABLE public.<nama> ENABLE ROW LEVEL SECURITY
  const rlsRegex = /ALTER\s+TABLE\s+public\.([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  const rlsEnabledTables = new Set<string>();

  while ((match = rlsRegex.exec(allSql)) !== null) {
    rlsEnabledTables.add(match[1].toLowerCase());
  }

  const missingRLS: string[] = [];
  for (const table of createdTables) {
    if (!rlsEnabledTables.has(table)) {
      missingRLS.push(table);
    }
  }

  console.log(`🔍 Ditemukan ${createdTables.size} tabel pada migrasi: [${Array.from(createdTables).join(', ')}]`);

  if (missingRLS.length > 0) {
    console.error(`❌ CI GAGAL: Ditemukan tabel tanpa RLS di schema public:`);
    missingRLS.forEach((tbl) => console.error(`   - public.${tbl}`));
    return false;
  }

  console.log(`✅ SUKSES: Semua ${createdTables.size} tabel di schema public memiliki RLS aktif!`);
  return true;
}

async function main() {
  console.log('--- CI Check: Public Schema Row Level Security (RLS) ---');
  const ok = await checkMigrationsRLS();
  if (!ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error menjalankan pemeriksaan RLS:', err);
  process.exit(1);
});
