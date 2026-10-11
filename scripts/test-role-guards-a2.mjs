import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// 1. Mock server-only
const serverOnlyPath = require.resolve('server-only');
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
};

// 2. Mock next/navigation
let lastRedirectUrl = null;
const nextNavPath = require.resolve('next/navigation');
require.cache[nextNavPath] = {
  id: nextNavPath,
  filename: nextNavPath,
  loaded: true,
  exports: {
    redirect: (url) => {
      lastRedirectUrl = url;
      const err = new Error(`NEXT_REDIRECT;${url}`);
      err.digest = `NEXT_REDIRECT;${url}`;
      err.url = url;
      throw err;
    },
  },
};

// 3. Mock getCurrentUserWithRoles
let mockUserContext = null;
const actionsPath = require.resolve('../src/modules/identity/actions.ts');
require.cache[actionsPath] = {
  id: actionsPath,
  filename: actionsPath,
  loaded: true,
  exports: {
    getCurrentUserWithRoles: async () => mockUserContext,
  },
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const ROUTES_TO_TEST = [
  { path: '/admin', allowedRoles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
  { path: '/admin/users', allowedRoles: ['SUPER_ADMIN'] },
  { path: '/admin/system', allowedRoles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'] },
  { path: '/admin/roles', allowedRoles: ['SUPER_ADMIN'] },
  { path: '/coordinator', allowedRoles: ['PROGRAM_COORDINATOR'] },
  { path: '/staff', allowedRoles: ['ACADEMIC_STAFF'] },
  { path: '/lecturer', allowedRoles: ['LECTURER'] },
  { path: '/ta', allowedRoles: ['TEACHING_ASSISTANT'] },
];

const STUDENT_ID = 'a0000001-0000-0000-0000-000000000001';

async function runAllTests() {
  console.log('========================================================================================');
  console.log('  UJI PENEGAKAN SERVER ROLE (A2, A3, C6): assertServerRole() DENGAN ROLE DB & MODE DEMO ');
  console.log('========================================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, resultMsg) {
    total++;
    if (condition) {
      passed++;
      console.log(`\x1b[32m[PASS]\x1b[0m ${name}`);
      console.log(`       Hasil: ${resultMsg}\n`);
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${name}`);
      console.log(`       Penyebab: ${resultMsg}\n`);
    }
  }

  // -------------------------------------------------------------
  // BAGIAN 1: UJI UNIT assertServerRole() DENGAN MOCK ROLE DARI DB
  // -------------------------------------------------------------
  console.log('--- BAGIAN 1: UJI UNIT assertServerRole() DENGAN ROLE DARI DB ---');
  const { assertServerRole } = await import('../src/lib/auth/server-guards.ts');

  // Test 1: Unauthenticated -> redirect ke /login
  mockUserContext = null;
  lastRedirectUrl = null;
  try {
    await assertServerRole(['SUPER_ADMIN']);
    assert('[-] Pengguna tanpa sesi diarahkan ke /login', false, 'Tidak melempar redirect');
  } catch (err) {
    assert(
      '[+] Pengguna tanpa sesi diarahkan ke /login',
      lastRedirectUrl === '/login',
      `Redirect tertangkap: ${lastRedirectUrl}`
    );
  }

  // Test 2: Mahasiswa spoofing active_role=SUPER_ADMIN di cookie, DB role = STUDENT
  // Mencoba akses route Super Admin
  mockUserContext = {
    user: { id: STUDENT_ID, email: 'student@siajar.local' },
    activeRole: 'SUPER_ADMIN', // Spoofed cookie
    roles: [
      {
        id: 'ur-1',
        role_id: 'STUDENT',
        scope_type: 'GLOBAL',
        scope_id: null,
        roles: { code: 'STUDENT', name: 'Mahasiswa' },
      },
    ],
  };
  lastRedirectUrl = null;
  try {
    await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
    assert('[-] Mahasiswa dengan spoofing active_role=SUPER_ADMIN ditolak ke /admin', false, 'Tidak melempar redirect');
  } catch (err) {
    assert(
      '[+] Mahasiswa dengan spoofing active_role=SUPER_ADMIN ditolak ke /workspace',
      lastRedirectUrl === '/workspace',
      `Server guard menolak role manipulasi cookie: redirect ke ${lastRedirectUrl}`
    );
  }

  // Test 3: Mahasiswa spoofing mencoba akses route /coordinator, /staff, /lecturer, /ta
  for (const role of ['PROGRAM_COORDINATOR', 'ACADEMIC_STAFF', 'LECTURER', 'TEACHING_ASSISTANT']) {
    lastRedirectUrl = null;
    try {
      await assertServerRole([role]);
      assert(`[-] Mahasiswa ditolak akses ke guard [${role}]`, false, 'Tidak melempar redirect');
    } catch (err) {
      assert(
        `[+] Mahasiswa ditolak akses ke guard [${role}] -> redirect /workspace`,
        lastRedirectUrl === '/workspace',
        `Akses ditolak ke ${lastRedirectUrl}`
      );
    }
  }

  // Test 4: Super Admin mencoba akses langsung layout /coordinator, /staff, /lecturer, /ta (A3a)
  // Super Admin harus ditolak karena SUPER_ADMIN dihapus dari allow-list layout portal
  mockUserContext = {
    user: { id: 'admin-001', email: 'admin@siajar.local' },
    activeRole: 'SUPER_ADMIN',
    roles: [
      {
        id: 'ur-admin',
        role_id: 'SUPER_ADMIN',
        scope_type: 'GLOBAL',
        scope_id: null,
        roles: { code: 'SUPER_ADMIN', name: 'Super Admin' },
      },
    ],
  };

  const portalGuards = [
    { name: '/coordinator layout', allow: ['PROGRAM_COORDINATOR'] },
    { name: '/staff layout', allow: ['ACADEMIC_STAFF'] },
    { name: '/lecturer layout', allow: ['LECTURER'] },
    { name: '/ta layout', allow: ['TEACHING_ASSISTANT'] },
  ];

  for (const { name, allow } of portalGuards) {
    lastRedirectUrl = null;
    try {
      await assertServerRole(allow);
      assert(`[-] Super Admin akses langsung ${name} ditolak (A3a)`, false, 'Tidak melempar redirect');
    } catch (err) {
      assert(
        `[+] Super Admin akses langsung ${name} ditolak -> redirect /workspace (A3a)`,
        lastRedirectUrl === '/workspace',
        `Super Admin diblokir dari allow-list portal: redirect ke ${lastRedirectUrl} (hanya boleh via impersonasi)`
      );
    }
  }

  // Test 5: Guard A3b: /admin/system/** = SYSTEM_ADMIN + SUPER_ADMIN.
  // Halaman admin lain = SUPER_ADMIN saja.
  // 5a. SYSTEM_ADMIN akses /admin/system layout -> diizinkan
  mockUserContext = {
    user: { id: 'sysadmin-001', email: 'sysadmin@siajar.local' },
    activeRole: 'SYSTEM_ADMIN',
    roles: [
      {
        id: 'ur-sysadmin',
        role_id: 'SYSTEM_ADMIN',
        scope_type: 'GLOBAL',
        scope_id: null,
        roles: { code: 'SYSTEM_ADMIN', name: 'System Admin' },
      },
    ],
  };
  lastRedirectUrl = null;
  let sysadminAllowed = false;
  try {
    const ctx = await assertServerRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN']);
    sysadminAllowed = !!ctx;
  } catch (err) {
    sysadminAllowed = false;
  }
  assert(
    '[+] Guard A3b: SYSTEM_ADMIN diizinkan mengakses /admin/system/**',
    sysadminAllowed === true,
    'SYSTEM_ADMIN berhasil melewati assertServerRole([SYSTEM_ADMIN, SUPER_ADMIN])'
  );

  // 5b. SYSTEM_ADMIN akses halaman admin lain (misal /admin/users, /admin/roles) -> ditolak
  lastRedirectUrl = null;
  try {
    await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
    assert('[-] Guard A3b: SYSTEM_ADMIN ditolak dari halaman admin lain (/admin/users, roles)', false, 'Tidak melempar redirect');
  } catch (err) {
    assert(
      '[+] Guard A3b: SYSTEM_ADMIN ditolak dari halaman admin lain (/admin/users, roles) -> redirect /workspace',
      lastRedirectUrl === '/workspace',
      `SYSTEM_ADMIN diblokir dari route khusus SUPER_ADMIN: redirect ke ${lastRedirectUrl}`
    );
  }

  // 5c. SUPER_ADMIN akses /admin/users, roles, policies -> diizinkan
  mockUserContext = {
    user: { id: 'superadmin-001', email: 'superadmin@siajar.local' },
    activeRole: 'SUPER_ADMIN',
    roles: [
      {
        id: 'ur-superadmin',
        role_id: 'SUPER_ADMIN',
        scope_type: 'GLOBAL',
        scope_id: null,
        roles: { code: 'SUPER_ADMIN', name: 'Super Admin' },
      },
    ],
  };
  let superadminAllowed = false;
  try {
    const ctx = await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
    superadminAllowed = !!ctx;
  } catch (err) {
    superadminAllowed = false;
  }
  assert(
    '[+] Guard A3b: SUPER_ADMIN diizinkan mengakses halaman admin lain (/admin/users, roles, policies)',
    superadminAllowed === true,
    'SUPER_ADMIN berhasil melewati assertServerRole([SUPER_ADMIN, SUPERADMIN])'
  );

  // -------------------------------------------------------------
  // BAGIAN 2: UJI HTTP MODE DEMO (JIKA SERVER AKTIF)
  // -------------------------------------------------------------
  console.log('--- BAGIAN 2: UJI HTTP MODE DEMO (INTEGRASI ENDPOINT) ---');
  let isServerUp = false;
  try {
    const probe = await fetch(`${BASE_URL}/api/health`, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
    isServerUp = true;
  } catch {
    // Coba probe root
    try {
      const probeRoot = await fetch(BASE_URL, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
      isServerUp = true;
    } catch {
      isServerUp = false;
    }
  }

  if (isServerUp) {
    console.log(`Server aktif terdeteksi di ${BASE_URL}. Menjalankan uji HTTP mode demo...\n`);
    for (const { path } of ROUTES_TO_TEST) {
      // 1. Kasus Mahasiswa mode demo Mencoba Spoofing Cookie active_role=SUPER_ADMIN
      total++;
      try {
        const res = await fetch(`${BASE_URL}${path}`, {
          headers: {
            cookie: `demo_session=${STUDENT_ID}; active_role=SUPER_ADMIN`,
          },
          redirect: 'manual',
        });

        const location = res.headers.get('location');
        let finalDest = location;
        if (res.status === 307 && location && !location.includes('/workspace')) {
          const nextRes = await fetch(new URL(location, BASE_URL).toString(), {
            headers: {
              cookie: `demo_session=${STUDENT_ID}; active_role=SUPER_ADMIN`,
            },
            redirect: 'manual',
          });
          finalDest = nextRes.headers.get('location') || location;
        }

        const isBlocked = location === '/workspace' || finalDest === '/workspace';
        if (isBlocked) {
          passed++;
          console.log(`\x1b[32m[PASS]\x1b[0m ${path} -> HTTP ${res.status} (Immediate: '${location}', Destinasi Akhir Server Guard: '${finalDest}')`);
          console.log(`       Hasil: Mode demo: Akses ditolak. Pengguna ber-role STUDENT tidak mendapat akses dan berakhir di /workspace.\n`);
        } else {
          console.log(`\x1b[31m[FAIL]\x1b[0m ${path} -> HTTP ${res.status} Location: ${location} Final: ${finalDest}\n`);
        }
      } catch (err) {
        console.log(`\x1b[31m[FAIL]\x1b[0m ${path} -> Fetch Error: ${err.message}\n`);
      }

      // 2. Kasus Unauthenticated (Tanpa Sesi) -> Harus Redirect ke /login
      total++;
      try {
        const res = await fetch(`${BASE_URL}${path}`, {
          headers: { cookie: '' },
          redirect: 'manual',
        });

        const location = res.headers.get('location');
        const isRedirectLogin = res.status === 307 && location && location.includes('/login');
        if (isRedirectLogin) {
          passed++;
          console.log(`\x1b[32m[PASS]\x1b[0m ${path} (Tanpa Sesi) -> HTTP ${res.status} Redirect to '${location}'`);
          console.log(`       Hasil: Mode demo: Pengguna belum login diarahkan ke /login.\n`);
        } else {
          console.log(`\x1b[31m[FAIL]\x1b[0m ${path} (Tanpa Sesi) -> HTTP ${res.status} Location: ${location}\n`);
        }
      } catch (err) {
        console.log(`\x1b[31m[FAIL]\x1b[0m ${path} -> Fetch Error: ${err.message}\n`);
      }
    }
  } else {
    console.log(`(Info: HTTP dev server tidak aktif di ${BASE_URL}; uji difokuskan pada unit test assertServerRole() di Bagian 1).\n`);
  }

  console.log('========================================================================================');
  console.log(`  HASIL AKHIR UJI PENEGAKAN SERVER ROLE (A2, A3, C6): ${passed}/${total} UJI LOLOS (${Math.round((passed / total) * 100)}%) `);
  console.log('========================================================================================\n');

  if (passed !== total) process.exit(1);
}

runAllTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
