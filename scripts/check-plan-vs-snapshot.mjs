import fs from 'fs';
import path from 'path';

// -----------------------------------------------------------------------------
// 1. Parse Snapshot Skema (docs/schema-snapshot.md)
// -----------------------------------------------------------------------------
export function parseSnapshot(snapshotPath = 'docs/schema-snapshot.md') {
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Berkas snapshot tidak ditemukan: ${snapshotPath}`);
  }
  const content = fs.readFileSync(snapshotPath, 'utf-8');
  const tables = {};

  const tableSections = content.split('### Tabel: ');
  for (let i = 1; i < tableSections.length; i++) {
    const section = tableSections[i];
    const nameMatch = section.match(/^`?([a-zA-Z0-9_\.]+)`?/);
    if (!nameMatch) continue;
    const tableName = nameMatch[1];

    const lines = section.split('\n');
    const columns = new Set();
    let inColTable = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('| Nama Kolom |')) {
        inColTable = true;
        continue;
      }
      if (inColTable) {
        if (trimmed.startsWith('**') || trimmed.startsWith('---')) {
          inColTable = false;
          continue;
        }
        if (trimmed.startsWith('|---')) continue;
        if (trimmed.startsWith('| `')) {
          const parts = trimmed.split('|').map(s => s.trim()).filter(Boolean);
          if (parts.length >= 2) {
            const colName = parts[0].replace(/`/g, '');
            columns.add(colName);
          }
        }
      }
    }
    tables[tableName] = columns;
  }

  // Tambahkan tabel auth.users yang dikelola oleh Supabase Auth
  tables['auth.users'] = new Set(['id', 'email', 'created_at', 'updated_at']);

  return tables;
}

// -----------------------------------------------------------------------------
// 2. Parse Daftar "SUDAH ADA" di docs/phase-3-plan.md
// -----------------------------------------------------------------------------
export function parsePlanSudahAda(planPath = 'docs/phase-3-plan.md') {
  if (!fs.existsSync(planPath)) {
    throw new Error(`Berkas plan tidak ditemukan: ${planPath}`);
  }
  const content = fs.readFileSync(planPath, 'utf-8');
  const lines = content.split('\n');

  const domainSections = [];
  let currentSection = null;
  let inSudahAda = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('### Domain ')) {
      currentSection = { name: line, tables: [] };
      domainSections.push(currentSection);
      inSudahAda = false;
      continue;
    }

    if (line.startsWith('#### A. SUDAH ADA')) {
      inSudahAda = true;
      continue;
    }

    if (line.startsWith('#### B. ') || line.startsWith('---') || (line.startsWith('## ') && !line.startsWith('### Domain '))) {
      inSudahAda = false;
      continue;
    }

    if (inSudahAda && currentSection) {
      // Baris tabel: misal `- `public.programs`: `id` (uuid), `code` (text), ...`
      // atau `- `public.programs` (keterangan): `id` ...`
      const tableMatch = line.match(/^-\s*`?(public\.[a-zA-Z0-9_]+|auth\.users)`?/);
      if (tableMatch) {
        const tableName = tableMatch[1];
        // Ambil bagian setelah tanda titik dua `:`
        const colonIdx = line.indexOf(':');
        const colString = colonIdx !== -1 ? line.slice(colonIdx + 1) : '';

        // Ekstrak semua nama kolom dalam backtick: `id`, `code`, dsb.
        const colMatches = colString.match(/`([a-zA-Z0-9_]+)`/g) || [];
        const columns = colMatches.map(c => c.replace(/`/g, ''));

        currentSection.tables.push({
          tableName,
          columns,
          rawLine: line
        });
      }
    }
  }

  return domainSections;
}

// -----------------------------------------------------------------------------
// 3. Verifikasi Plan vs Snapshot
// -----------------------------------------------------------------------------
export function checkPlanVsSnapshot() {
  console.log('========================================================================================');
  console.log('  PEMERIKSAAN OTOMATIS: docs/phase-3-plan.md VS docs/schema-snapshot.md                 ');
  console.log('========================================================================================\n');

  const snapshotTables = parseSnapshot();
  const planDomains = parsePlanSudahAda();

  let totalTablesChecked = 0;
  let totalColsChecked = 0;
  const errors = [];

  for (const domain of planDomains) {
    if (domain.tables.length === 0) continue;
    console.log(`\n📌 ${domain.name}`);

    for (const item of domain.tables) {
      totalTablesChecked++;
      const { tableName, columns } = item;

      if (!snapshotTables[tableName]) {
        errors.push(`[TABEL TIDAK VALID] Tabel '${tableName}' di ${domain.name} tidak ada di snapshot!`);
        console.log(`  ❌ ${tableName} -> TIDAK DITEMUKAN DI SNAPSHOT!`);
        continue;
      }

      const validCols = snapshotTables[tableName];
      const missingCols = [];

      for (const col of columns) {
        totalColsChecked++;
        if (!validCols.has(col)) {
          missingCols.push(col);
        }
      }

      if (missingCols.length > 0) {
        errors.push(`[KOLOM TIDAK VALID] Tabel '${tableName}' memuat kolom yang TIDAK ADA di snapshot: [${missingCols.join(', ')}]`);
        console.log(`  ❌ ${tableName} (${columns.length} kolom dicek) -> KOLOM TIDAK VALID: ${missingCols.join(', ')}`);
      } else {
        console.log(`  ✓ ${tableName} (${columns.length} kolom): [${columns.join(', ')}] ... VALID`);
      }
    }
  }

  console.log('\n----------------------------------------------------------------------------------------');
  console.log(`Ringkasan: ${totalTablesChecked} tabel diperiksa, ${totalColsChecked} kolom diverifikasi.`);

  if (errors.length > 0) {
    console.log(`\n❌ DITEMUKAN ${errors.length} KESALAHAN KETIDAKSESUAIAN SKEMA:`);
    for (const err of errors) {
      console.log(`   - ${err}`);
    }
    console.log('\nEksekusi GAGAL. Perbaiki docs/phase-3-plan.md agar sesuai dengan docs/schema-snapshot.md.\n');
    process.exit(1);
  } else {
    console.log('\n✅ SUKSES: Seluruh tabel & kolom di bagian "SUDAH ADA" 100% selaras dengan docs/schema-snapshot.md!\n');
    process.exit(0);
  }
}

// Jalankan jika dipanggil langsung via CLI
if (process.argv[1] && process.argv[1].endsWith('check-plan-vs-snapshot.mjs')) {
  checkPlanVsSnapshot();
}
