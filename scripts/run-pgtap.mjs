import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'fs';
import path from 'path';

export async function runPgTapTest(testRelPath) {
  const db = new PGlite({
    extensions: { pgcrypto }
  });

  // Base roles and auth schema
  await db.exec(`
    DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN null; END $$;

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
      SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
        (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
      );
    $$ LANGUAGE sql STABLE;
    CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
    $$ LANGUAGE sql STABLE;

    -- pgTAP core implementation
    CREATE TABLE IF NOT EXISTS tap_results (
      id SERIAL PRIMARY KEY,
      test_num INT,
      status TEXT,
      description TEXT
    );
    CREATE TABLE IF NOT EXISTS tap_meta (
      planned INT DEFAULT 0
    );
    INSERT INTO tap_meta VALUES (0);
    GRANT ALL ON tap_results, tap_meta TO anon, authenticated, service_role;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

    CREATE OR REPLACE FUNCTION plan(n INT) RETURNS VOID LANGUAGE plpgsql AS $$
    BEGIN
      UPDATE tap_meta SET planned = n;
      DELETE FROM tap_results;
    END;
    $$;

    CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    DECLARE
      v_num INT;
      v_out TEXT;
    BEGIN
      SELECT COALESCE(MAX(test_num), 0) + 1 INTO v_num FROM tap_results;
      IF COALESCE(cond, false) THEN
        v_out := format('ok %s - %s', v_num, description);
        INSERT INTO tap_results (test_num, status, description) VALUES (v_num, 'ok', description);
      ELSE
        v_out := format('not ok %s - %s', v_num, description);
        INSERT INTO tap_results (test_num, status, description) VALUES (v_num, 'not ok', description);
      END IF;
      RETURN v_out;
    END;
    $$;

    CREATE OR REPLACE FUNCTION is(have ANYELEMENT, want ANYELEMENT, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    DECLARE
      v_pass BOOLEAN := (have IS NOT DISTINCT FROM want);
    BEGIN
      IF NOT v_pass THEN
        RETURN ok(false, format('%s (got %s, expected %s)', description, have, want));
      END IF;
      RETURN ok(true, description);
    END;
    $$;

    CREATE OR REPLACE FUNCTION is_empty(query TEXT, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    DECLARE
      v_count INT;
    BEGIN
      EXECUTE format('SELECT count(*) FROM (%s) q', query) INTO v_count;
      IF v_count = 0 THEN
        RETURN ok(true, description);
      ELSE
        RETURN ok(false, format('%s (expected empty, got %s rows)', description, v_count));
      END IF;
    END;
    $$;

    CREATE OR REPLACE FUNCTION isnt_empty(query TEXT, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    DECLARE
      v_count INT;
    BEGIN
      EXECUTE format('SELECT count(*) FROM (%s) q', query) INTO v_count;
      IF v_count > 0 THEN
        RETURN ok(true, description);
      ELSE
        RETURN ok(false, format('%s (expected not empty, got 0 rows)', description));
      END IF;
    END;
    $$;

    CREATE OR REPLACE FUNCTION has_table(sname TEXT, tname TEXT, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    DECLARE
      v_exists BOOLEAN;
    BEGIN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = sname AND table_name = tname
      ) INTO v_exists;
      IF v_exists THEN
        RETURN ok(true, description);
      ELSE
        RETURN ok(false, format('%s (table %s.%s does not exist)', description, sname, tname));
      END IF;
    END;
    $$;

    CREATE OR REPLACE FUNCTION results_eq(query1 TEXT, query2 TEXT, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    DECLARE
      v_diff INT;
    BEGIN
      EXECUTE format('
        WITH q1 AS (%s), q2 AS (%s)
        SELECT count(*) FROM (
          (SELECT * FROM q1 EXCEPT ALL SELECT * FROM q2)
          UNION ALL
          (SELECT * FROM q2 EXCEPT ALL SELECT * FROM q1)
        ) diff
      ', query1, query2) INTO v_diff;
      IF v_diff = 0 THEN
        RETURN ok(true, description);
      ELSE
        RETURN ok(false, format('%s (queries produced different results)', description));
      END IF;
    END;
    $$;

    CREATE OR REPLACE FUNCTION lives_ok(query TEXT, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    BEGIN
      EXECUTE query;
      RETURN ok(true, description);
    EXCEPTION WHEN OTHERS THEN
      RETURN ok(false, format('%s (died with %s: %s)', description, SQLSTATE, SQLERRM));
    END;
    $$;

    CREATE OR REPLACE FUNCTION throws_ok(query TEXT, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    BEGIN
      EXECUTE query;
      RETURN ok(false, format('%s (expected exception, but none was thrown)', description));
    EXCEPTION WHEN OTHERS THEN
      RETURN ok(true, description);
    END;
    $$;

    CREATE OR REPLACE FUNCTION throws_ok(query TEXT, expected_err TEXT, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    BEGIN
      EXECUTE query;
      RETURN ok(false, format('%s (expected exception %s, but none was thrown)', description, expected_err));
    EXCEPTION WHEN OTHERS THEN
      IF expected_err IS NULL OR SQLSTATE = expected_err OR SQLERRM ILIKE '%' || expected_err || '%' THEN
        RETURN ok(true, description);
      ELSE
        RETURN ok(false, format('%s (wrong error: expected %s, got %s - %s)', description, expected_err, SQLSTATE, SQLERRM));
      END IF;
    END;
    $$;

    CREATE OR REPLACE FUNCTION throws_ok(query TEXT, expected_code TEXT, expected_err TEXT, description TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
    BEGIN
      EXECUTE query;
      RETURN ok(false, format('%s (expected exception %s, but none was thrown)', description, COALESCE(expected_code, expected_err)));
    EXCEPTION WHEN OTHERS THEN
      IF (expected_code IS NULL AND expected_err IS NULL) OR
         (expected_code IS NOT NULL AND SQLSTATE = expected_code) OR 
         (expected_err IS NOT NULL AND SQLERRM ILIKE '%' || expected_err || '%') THEN
        RETURN ok(true, description);
      ELSE
        RETURN ok(false, format('%s (wrong error: expected code=%s err=%s, got %s - %s)', description, expected_code, expected_err, SQLSTATE, SQLERRM));
      END IF;
    END;
    $$;

    CREATE OR REPLACE FUNCTION finish() RETURNS SETOF TEXT LANGUAGE plpgsql AS $$
    DECLARE
      v_planned INT;
      v_total INT;
      v_failed INT;
    BEGIN
      SELECT planned INTO v_planned FROM tap_meta LIMIT 1;
      SELECT count(*), count(*) FILTER (WHERE status != 'ok') INTO v_total, v_failed FROM tap_results;
      RETURN NEXT format('1..%s', v_planned);
      IF v_failed = 0 AND v_total = v_planned THEN
        RETURN NEXT format('# looks like you planned %s tests and ran %s.', v_planned, v_total);
      ELSE
        RETURN NEXT format('# Looks like you failed %s of %s tests run (planned %s)', v_failed, v_total, v_planned);
      END IF;
    END;
    $$;
  `);

  // Run all migrations
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await db.exec(sql);
  }

  // Grant schema & table permissions like Supabase environment
  await db.exec(`
    GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
    GRANT ALL ON tap_results, tap_meta TO authenticated, anon, service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, anon, service_role;
  `);

  // Read and run test file
  const testFile = path.join(process.cwd(), testRelPath);
  let testSql = fs.readFileSync(testFile, 'utf-8');

  // Strip top-level BEGIN and ROLLBACK so results persist for reporting
  testSql = testSql.replace(/^\s*BEGIN\s*;/im, '-- BEGIN;');
  testSql = testSql.replace(/^\s*ROLLBACK\s*;/im, '-- ROLLBACK;');

  await db.exec(testSql);

  const res = await db.query(`SELECT test_num, status, description FROM tap_results ORDER BY test_num ASC;`);
  const meta = await db.query(`SELECT planned FROM tap_meta LIMIT 1;`);
  const planned = meta.rows[0].planned;
  
  console.log(`1..${planned}`);
  for (const row of res.rows) {
    console.log(`${row.status} ${row.test_num} - ${row.description}`);
  }
  const failed = res.rows.filter(r => r.status !== 'ok').length;
  if (failed === 0) {
    console.log(`\nAll ${res.rows.length} tests passed (planned ${planned})!`);
  } else {
    console.log(`\n${failed} tests failed!`);
  }
}

const file = process.argv[2] || 'supabase/tests/database/05_assistants_rls.sql';
runPgTapTest(file).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
