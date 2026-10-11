import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('=== PGlite Disposable Local DB: Running Migrations 1..15 From Scratch ===');
  const db = new PGlite({
    extensions: { pgcrypto }
  });

  console.log('Initializing base roles and auth schema...');
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
      instance_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
      email TEXT UNIQUE,
      encrypted_password TEXT,
      email_confirmed_at TIMESTAMPTZ,
      raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
      role TEXT DEFAULT 'authenticated',
      aud TEXT DEFAULT 'authenticated',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$ LANGUAGE sql STABLE;
    CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
    $$ LANGUAGE sql STABLE;
  `);
  console.log('Base roles and auth schema ready.');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} migration files.`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    const migNum = i + 1;
    console.log(`Starting [Migration ${migNum}/15] ${file}...`);
    const startTime = Date.now();
    try {
      await db.exec(sql);
      const elapsed = Date.now() - startTime;
      console.log(`[Migration ${migNum}/15] ${file} ... OK (${elapsed}ms)`);
    } catch (err) {
      console.log(`[Migration ${migNum}/15] ${file} ... FAILED!`);
      console.error(`Error in ${file}:`, err.message || err);
      process.exit(1);
    }
  }

  console.log('\n[SUCCESS] All 15 migrations executed from scratch without error!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
