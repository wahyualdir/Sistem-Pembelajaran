import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';

async function generateSchemaSnapshot() {
  console.log('Generating Schema Snapshot from PGlite with Migrations 1..16...');
  const db = new PGlite({
    extensions: { pgcrypto },
  });

  // 1. Inisialisasi Auth & Roles
  await db.exec(`
    DO $$ BEGIN
      CREATE ROLE anon;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE ROLE authenticated;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE ROLE service_role;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$ LANGUAGE sql STABLE;
    CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
    $$ LANGUAGE sql STABLE;
  `);

  // 2. Jalankan semua migrasi 1..16
  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await db.exec(sql);
  }
  console.log(`Executed ${files.length} migrations.`);

  // 3. Query Enums
  const enumsRes = await db.query(`
    SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname;
  `);

  // 4. Query Tabel
  const tablesRes = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  let md = '# Snapshot Skema Database SIAJAR (Single Source of Truth)\n\n';
  md += `> **Tanggal Dihasilkan**: 11 Oktober 2026  \n`;
  md += `> **Lingkungan**: PGlite (PostgreSQL 16) setelah migrasi 1..16 dijalankan dari nol.  \n`;
  md += `> **Tujuan**: Sumber kebenaran tunggal (*Single Source of Truth*) nama tabel, kolom, tipe data, foreign key, dan kebijakan RLS untuk perencanaan dan implementasi Fase 3.\n\n`;
  md += '---\n\n';

  md += '## 1. Tipe Enum Kustom (Custom Enums)\n\n';
  md += '| Nama Enum | Nilai-Nilai Enum (*Allowed Values*) |\n';
  md += '|---|---|\n';
  for (const row of enumsRes.rows) {
    const vals = Array.isArray(row.enum_values) ? row.enum_values.map((v) => `\`${v}\``).join(', ') : row.enum_values;
    md += `| \`${row.typname}\` | ${vals} |\n`;
  }
  md += '\n---\n\n';

  md += '## 2. Daftar Tabel & Struktur Kolom (Schema Tables)\n\n';

  for (const tRow of tablesRes.rows) {
    const tableName = tRow.table_name;

    // Kolom
    const colsRes = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);

    // Constraints & FK
    const consRes = await db.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON rc.unique_constraint_name = ccu.constraint_name
      WHERE tc.table_schema = 'public' AND tc.table_name = '${tableName}'
      ORDER BY tc.constraint_type, kcu.column_name;
    `);

    // RLS
    const rlsRes = await db.query(`
      SELECT c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = '${tableName}';
    `);
    const isRls = rlsRes.rows[0]?.relrowsecurity ? 'AKTIF (Enabled)' : 'NONAKTIF';

    // Policies
    const polRes = await db.query(`
      SELECT policyname, permissive, roles, cmd
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = '${tableName}'
      ORDER BY policyname;
    `);

    md += `### Tabel: \`public.${tableName}\`\n\n`;
    md += `- **Status Row Level Security (RLS)**: ${isRls}\n`;
    md += `- **Jumlah Kolom**: ${colsRes.rows.length}\n\n`;

    md += '| Nama Kolom | Tipe Data | Nullable | Nilai Default |\n';
    md += '|---|---|---|---|\n';
    for (const c of colsRes.rows) {
      const def = c.column_default ? `\`${c.column_default.replace(/::[a-zA-Z0-9_ ]+/g, '')}\`` : '-';
      md += `| \`${c.column_name}\` | \`${c.data_type}\` | ${c.is_nullable} | ${def} |\n`;
    }
    md += '\n';

    if (consRes.rows.length > 0) {
      md += '**Batasan Integritas & Foreign Key**:\n';
      for (const con of consRes.rows) {
        if (con.constraint_type === 'PRIMARY KEY') {
          md += `- PRIMARY KEY: \`${con.column_name}\`\n`;
        } else if (con.constraint_type === 'FOREIGN KEY') {
          md += `- FOREIGN KEY: \`${con.column_name}\` -> \`public.${con.foreign_table}(${con.foreign_column})\` (ON DELETE ${con.delete_rule})\n`;
        } else if (con.constraint_type === 'UNIQUE') {
          md += `- UNIQUE: \`${con.column_name}\`\n`;
        }
      }
      md += '\n';
    }

    if (polRes.rows.length > 0) {
      md += '**Kebijakan RLS (Security Policies)**:\n';
      md += '| Nama Kebijakan | Operasi | Peran (*Roles*) | Tipe |\n';
      md += '|---|---|---|---|\n';
      for (const p of polRes.rows) {
        md += `| \`${p.policyname}\` | \`${p.cmd}\` | \`${p.roles}\` | ${p.permissive} |\n`;
      }
      md += '\n';
    }

    md += '---\n\n';
  }

  const outputPath = path.resolve(process.cwd(), 'docs', 'schema-snapshot.md');
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log(`Schema snapshot written successfully to ${outputPath}`);
}

generateSchemaSnapshot().catch((err) => {
  console.error(err);
  process.exit(1);
});
