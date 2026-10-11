/**
 * SIAJAR - Automated Permanent Role Smoke Test Script (scripts/smoke-roles.ts)
 * 
 * Memeriksa:
 * 1. Role x Route x Tab Matrix (Status HTTP 200 + Teks Penanda Unik Tab)
 * 2. Uji Negatif A2 (Admin Minimum Access: SYSTEM_ADMIN & SUPER_ADMIN)
 * 3. Uji Negatif A4 (Subroute Redirects Kaprodi)
 * 4. Uji Negatif A5 (Server Actions Authorization: Mahasiswa, Dosen, Kaprodi, Staf)
 */

interface TestCase {
  name: string;
  role: string;
  userId: string;
  path: string;
  expectedStatus: number;
  expectedRedirect?: string;
  uniqueMarker?: string;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Daftar pengguna demo resmi
const USERS = {
  STUDENT: { id: 'a0000001-0000-0000-0000-000000000001', role: 'STUDENT' },
  LECTURER: { id: 'a0000002-0000-0000-0000-000000000002', role: 'LECTURER' },
  TA: { id: 'a0000003-0000-0000-0000-000000000003', role: 'TEACHING_ASSISTANT' },
  COORDINATOR: { id: 'a0000004-0000-0000-0000-000000000004', role: 'PROGRAM_COORDINATOR' },
  STAFF: { id: 'a0000005-0000-0000-0000-000000000005', role: 'ACADEMIC_STAFF' },
  SYSTEM_ADMIN: { id: 'a0000006-0000-0000-0000-000000000006', role: 'SYSTEM_ADMIN' },
  SUPER_ADMIN: { id: 'a0000007-0000-0000-0000-000000000007', role: 'SUPER_ADMIN' },
};

const TEST_CASES: TestCase[] = [
  // --- 1. MAHASISWA (STUDENT) ---
  {
    name: '[Mahasiswa] Portal Home',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/student',
    expectedStatus: 200,
    uniqueMarker: 'Ruang Pembelajaran Mahasiswa',
  },
  {
    name: '[Mahasiswa] Nilai Tab Nilai Perkuliahan',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/grades?tab=nilai',
    expectedStatus: 200,
    uniqueMarker: 'Rincian Komponen Nilai',
  },
  {
    name: '[Mahasiswa] Nilai Tab Riwayat Ujian',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/grades?tab=riwayat',
    expectedStatus: 200,
    uniqueMarker: 'Riwayat Pengerjaan Ujian',
  },
  {
    name: '[Mahasiswa] Nilai Tab Progres CPL',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/grades?tab=progres',
    expectedStatus: 200,
    uniqueMarker: 'Target Capaian SKS Kelulusan',
  },
  {
    name: '[Mahasiswa] Presensi Tab Riwayat',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/attendance?tab=riwayat',
    expectedStatus: 200,
    uniqueMarker: 'Riwayat Presensi Masuk',
  },
  {
    name: '[Mahasiswa] Presensi Tab Pengajuan Izin',
    role: USERS.STUDENT.role,
    userId: USERS.STUDENT.id,
    path: '/attendance?tab=izin',
    expectedStatus: 200,
    uniqueMarker: 'Daftar Permohonan Izin',
  },

  // --- 2. DOSEN (LECTURER) ---
  {
    name: '[Dosen] Portal Home',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/lecturer',
    expectedStatus: 200,
    uniqueMarker: 'Ruang Pengampu Dosen',
  },
  {
    name: '[Dosen] Analitik Tab Butir Soal',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/analytics?tab=butir-soal',
    expectedStatus: 200,
    uniqueMarker: 'Item Analysis',
  },
  {
    name: '[Dosen] Analitik Tab Rekap Nilai',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/analytics?tab=rekap-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Buku Nilai',
  },
  {
    name: '[Dosen] Analitik Tab Keberatan Nilai',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/analytics?tab=keberatan-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Kotak Masuk Keberatan Nilai Mahasiswa',
  },
  {
    name: '[Dosen] Analitik Tab Perubahan Nilai',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/analytics?tab=perubahan-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Pengajuan Perubahan Nilai Final',
  },
  {
    name: '[Dosen] Ujian Tab Log Pelanggaran (Terpisah)',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/exams?tab=pelanggaran',
    expectedStatus: 200,
    uniqueMarker: 'Log Pelanggaran Mahasiswa (Proctoring Telemetry)',
  },
  {
    name: '[Dosen] Ujian Tab Log Intervensi Pengawas (Terpisah)',
    role: USERS.LECTURER.role,
    userId: USERS.LECTURER.id,
    path: '/exams?tab=pelanggaran',
    expectedStatus: 200,
    uniqueMarker: 'Verified Audit Log',
  },

  // --- 3. KAPRODI (PROGRAM_COORDINATOR) ---
  {
    name: '[Kaprodi] Portal Home',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator',
    expectedStatus: 200,
    uniqueMarker: 'kaprodi_persetujuan_nilai.portal',
  },
  {
    name: '[Kaprodi] Penugasan Tab Dosen Pengampu',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/assignments?tab=dosen-pengampu',
    expectedStatus: 200,
    uniqueMarker: 'Distribusi Beban Kerja Dosen',
  },
  {
    name: '[Kaprodi] Penugasan Tab Kelas Prodi',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/assignments?tab=kelas-prodi',
    expectedStatus: 200,
    uniqueMarker: 'Daftar Rombongan Belajar Kelas Aktif Program Studi',
  },
  {
    name: '[Kaprodi] Monitoring Tab Ujian',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/monitoring?tab=ujian',
    expectedStatus: 200,
    uniqueMarker: 'Supervisi Ujian Semester Sedang Berlangsung',
  },
  {
    name: '[Kaprodi] Persetujuan Tab Perubahan Nilai',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/approvals?tab=perubahan-nilai',
    expectedStatus: 200,
    uniqueMarker: 'Permohonan Koreksi / Revisi Nilai Akhir Perkuliahan',
  },
  {
    name: '[Kaprodi] Laporan Tab Capaian CPL',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/reports?tab=capaian-cpl',
    expectedStatus: 200,
    uniqueMarker: 'Ketercapaian Capaian Pembelajaran Lulusan (CPL Kurikulum OBE)',
  },

  // --- 4. SUBROUTE REDIRECT TESTS (A4) ---
  {
    name: '[Redirect A4] /coordinator/evaluations -> Evaluasi Dosen Tab',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/evaluations',
    expectedStatus: 307,
    expectedRedirect: '/coordinator/reports?tab=evaluasi-dosen',
  },
  {
    name: '[Redirect A4] /coordinator/cpl -> Capaian CPL Tab',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/cpl',
    expectedStatus: 307,
    expectedRedirect: '/coordinator/reports?tab=capaian-cpl',
  },
  {
    name: '[Redirect A4] /coordinator/classes -> Kelas Prodi Tab',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/classes',
    expectedStatus: 307,
    expectedRedirect: '/coordinator/assignments?tab=kelas-prodi',
  },
  {
    name: '[Redirect A4] /coordinator/approvals/classes -> Kelas Baru Tab',
    role: USERS.COORDINATOR.role,
    userId: USERS.COORDINATOR.id,
    path: '/coordinator/approvals/classes',
    expectedStatus: 307,
    expectedRedirect: '/coordinator/approvals?tab=kelas-baru',
  },

  // --- 5. UJI NEGATIF ADMIN MINIMUM ACCESS (A2) ---
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /attendance (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/attendance',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /analytics (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/analytics',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /grades (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/grades',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /exams (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/exams',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SYSTEM_ADMIN dilarang ke /coordinator (Redirect /admin/system)',
    role: USERS.SYSTEM_ADMIN.role,
    userId: USERS.SYSTEM_ADMIN.id,
    path: '/coordinator',
    expectedStatus: 307,
    expectedRedirect: '/admin/system',
  },
  {
    name: '[Uji Negatif A2] SUPER_ADMIN dilarang ke /attendance (Redirect /admin)',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/attendance',
    expectedStatus: 307,
    expectedRedirect: '/admin',
  },
  {
    name: '[Uji Negatif A2] SUPER_ADMIN dilarang ke /coordinator (Redirect /admin)',
    role: USERS.SUPER_ADMIN.role,
    userId: USERS.SUPER_ADMIN.id,
    path: '/coordinator',
    expectedStatus: 307,
    expectedRedirect: '/admin',
  },
];

async function runTest(test: TestCase): Promise<{ success: boolean; message: string }> {
  try {
    const cookieHeader = `demo_session=${test.userId}; active_role=${test.role};`;
    const res = await fetch(`${BASE_URL}${test.path}`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
      redirect: 'manual',
    });

    const status = res.status;

    // Uji redirect
    if (test.expectedStatus === 307 || test.expectedStatus === 302) {
      const location = res.headers.get('location') || '';
      const locationMatch = location.includes(test.expectedRedirect || '');
      if (status === test.expectedStatus && locationMatch) {
        return { success: true, message: `OK (Redirect ${status} -> ${location})` };
      }
      return {
        success: false,
        message: `FAIL: Diharapkan ${test.expectedStatus} -> ${test.expectedRedirect}, didapat ${status} -> ${location}`,
      };
    }

    // Uji 200 + unique marker
    if (status !== test.expectedStatus) {
      return { success: false, message: `FAIL: Diharapkan HTTP ${test.expectedStatus}, didapat ${status}` };
    }

    const html = await res.text();
    if (test.uniqueMarker && !html.includes(test.uniqueMarker)) {
      return {
        success: false,
        message: `FAIL: Status 200 tapi penanda unik "${test.uniqueMarker}" tidak ditemukan pada konten respons!`,
      };
    }

    return { success: true, message: `OK (HTTP 200 + Verified Marker "${test.uniqueMarker}")` };
  } catch (err: any) {
    return { success: false, message: `ERROR: ${err.message}` };
  }
}

async function runNegativeActionTests() {
  console.log('---------------------------------------------------------------');
  console.log('  UJI NEGATIF SERVER ACTION (A5): AKSI x ROLE x HASIL         ');
  console.log('---------------------------------------------------------------');
  try {
    const res = await fetch(`${BASE_URL}/api/smoke-actions`, { method: 'GET' });
    if (!res.ok) {
      console.log(`\x1b[31m[FAIL]\x1b[0m Gagal mengakses /api/smoke-actions: HTTP ${res.status}`);
      return false;
    }
    const data = await res.json();
    console.log(`Total Aksi Negatif Diuji: ${data.total} | Lolos: ${data.passed} | Gagal: ${data.failed}\n`);
    
    console.log('| Server Action                            | Peran Pemanggil     | Ekspektasi Server | Hasil Server       | Status |');
    console.log('|------------------------------------------|---------------------|-------------------|--------------------|--------|');
    for (const r of data.results) {
      const statusBadge = r.status === 'PASS' ? 'PASS' : 'FAIL';
      const actionPadded = r.actionName.padEnd(40, ' ');
      const rolePadded = r.testedRole.padEnd(19, ' ');
      const expPadded = r.expectedResult.padEnd(17, ' ');
      const actPadded = r.actualResult.padEnd(18, ' ');
      console.log(`| ${actionPadded} | ${rolePadded} | ${expPadded} | ${actPadded} | ${statusBadge}   |`);
    }
    console.log('');
    return data.failed === 0;
  } catch (err: any) {
    console.log(`\x1b[31m[FAIL]\x1b[0m Error memanggil /api/smoke-actions: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('===============================================================');
  console.log('  SIAJAR - PERMANENT ROLE & ROUTE SMOKE TESTS (Fase 2C & 2D)   ');
  console.log('===============================================================');
  console.log(`Target: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    const result = await runTest(tc);
    const badge = result.success ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`${badge} ${tc.name}`);
    console.log(`       Path: ${tc.path}`);
    console.log(`       Detail: ${result.message}\n`);

    if (result.success) passed++;
    else failed++;
  }

  console.log('---------------------------------------------------------------');
  console.log(`Total Route Tests: ${TEST_CASES.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('===============================================================\n');

  const actionsPassed = await runNegativeActionTests();

  if (failed > 0 || !actionsPassed) {
    process.exit(1);
  } else {
    console.log('\x1b[32m[ALL SMOKE TESTS & NEGATIVE SECURITY CHECKS PASSED SUCCESSFULLY]\x1b[0m\n');
  }
}

main();
