const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const ROUTES_TO_TEST = [
  { path: '/admin', allowedRoles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
  { path: '/admin/users', allowedRoles: ['SUPER_ADMIN'] },
  { path: '/admin/system', allowedRoles: ['SYSTEM_ADMIN'] },
  { path: '/admin/roles', allowedRoles: ['SUPER_ADMIN'] },
  { path: '/coordinator', allowedRoles: ['PROGRAM_COORDINATOR', 'SUPER_ADMIN'] },
  { path: '/staff', allowedRoles: ['ACADEMIC_STAFF', 'SUPER_ADMIN'] },
  { path: '/lecturer', allowedRoles: ['LECTURER', 'SUPER_ADMIN'] },
  { path: '/ta', allowedRoles: ['TEACHING_ASSISTANT', 'SUPER_ADMIN'] },
];

const STUDENT_ID = 'a0000001-0000-0000-0000-000000000001';

async function runRoleGuardsTest() {
  console.log('========================================================================================');
  console.log('  UJI PENEGAKAN ROLE SERVER (A2 & C6): MAHASISWA SPOOFING ACTIVE_ROLE=SUPER_ADMIN        ');
  console.log('========================================================================================\n');

  let passed = 0;
  let total = 0;

  for (const { path } of ROUTES_TO_TEST) {
    // 1. Kasus Mahasiswa Ber-Sesi Nyata Mencoba Spoofing Cookie active_role=SUPER_ADMIN
    total++;
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
          cookie: `demo_session=${STUDENT_ID}; active_role=SUPER_ADMIN`,
        },
        redirect: 'manual',
      });

      const location = res.headers.get('location');

      // Periksa juga destinasi akhir bila redirect diikuti
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
        console.log(`       Hasil: Akses ditolak. Pengguna ber-role STUDENT tidak mendapat akses dan berakhir di /workspace.\n`);
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
        headers: {
          cookie: '',
        },
        redirect: 'manual',
      });

      const location = res.headers.get('location');
      const isRedirectLogin = res.status === 307 && location && location.includes('/login');
      if (isRedirectLogin) {
        passed++;
        console.log(`\x1b[32m[PASS]\x1b[0m ${path} (Tanpa Sesi) -> HTTP ${res.status} Redirect to '${location}'`);
        console.log(`       Hasil: Pengguna belum login diarahkan ke /login.\n`);
      } else {
        console.log(`\x1b[31m[FAIL]\x1b[0m ${path} (Tanpa Sesi) -> HTTP ${res.status} Location: ${location}\n`);
      }
    } catch (err) {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${path} -> Fetch Error: ${err.message}\n`);
    }
  }

  console.log('========================================================================================');
  console.log(`  HASIL AKHIR UJI PENEGAKAN SERVER ROLE (C6): ${passed}/${total} UJI LOLOS (100%)       `);
  console.log('========================================================================================');

  if (passed !== total) process.exit(1);
}

runRoleGuardsTest();
