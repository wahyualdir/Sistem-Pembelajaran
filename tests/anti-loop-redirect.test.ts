import { describe, it, expect } from 'vitest';
import { decideRoleRedirect, ROLE_PORTAL_MAP } from '@/lib/auth/route-guard';
import { normalizeRoleCode } from '@/lib/config/menu-config';

describe('FASE 4a: Tes Anti-Loop Redirect untuk Peran Tak Dikenal & Kosong', () => {
  const portalRoutes = [
    '/student',
    '/student/krs',
    '/lecturer',
    '/lecturer/classes',
    '/ta',
    '/coordinator',
    '/staff',
    '/admin',
    '/secretary',
    '/lab',
  ];

  const testUnknownRoles = [
    'FOO',
    'UNKNOWN_ROLE',
    'GUEST',
    '',
    null,
    undefined,
  ];

  for (const role of testUnknownRoles) {
    const roleLabel = role === '' ? 'string kosong' : role === null ? 'null' : role === undefined ? 'undefined' : `"${role}"`;

    it(`memastikan rantai redirect dari semua portal untuk peran ${roleLabel} berhenti di /workspace maksimal 2 lompatan tanpa loop`, () => {
      for (const startPath of portalRoutes) {
        let currentPath = startPath;
        let hops = 0;
        const maxHops = 5;
        const visitedPaths = [currentPath];

        while (hops < maxHops) {
          const nextRedirect = decideRoleRedirect({
            pathname: currentPath,
            activeRole: role as any,
            isImpersonating: false,
          });

          if (!nextRedirect) {
            // Rantai berhenti (halaman stabil tidak mengalihkan lagi)
            break;
          }

          hops++;
          currentPath = nextRedirect;
          visitedPaths.push(currentPath);

          // Cek siklus / loop
          const occurrences = visitedPaths.filter((p) => p === currentPath).length;
          expect(occurrences, `Terdeteksi perulangan siklus rute pada ${currentPath}: ${visitedPaths.join(' -> ')}`).toBeLessThanOrEqual(1);
        }

        // Rantai wajib berhenti sebelum batas maksimal 5 lompatan
        expect(hops, `Jumlah lompatan dari ${startPath} melebihi batas: ${visitedPaths.join(' -> ')}`).toBeLessThanOrEqual(2);
        // Halaman tujuan akhir wajib /workspace
        expect(currentPath, `Rute akhir untuk peran tidak dikenal harus /workspace`).toBe('/workspace');

        // Pastikan di /workspace tidak terjadi pengalihan lagi
        const workspaceRedirect = decideRoleRedirect({
          pathname: '/workspace',
          activeRole: role as any,
          isImpersonating: false,
        });
        expect(workspaceRedirect, `Di /workspace tidak boleh ada pengalihan lagi`).toBeNull();
      }
    });
  }

  it('memastikan simulasi logika halaman /workspace menghentikan redirect untuk peran tunggal tak dikenal dan tidak memicu redirect loop', () => {
    // Simulasi logika /workspace untuk peran tak dikenal
    const rawRole = 'FOO';
    const singleRole = normalizeRoleCode(rawRole);
    const targetPortal = singleRole ? (ROLE_PORTAL_MAP as Record<string, string>)[singleRole] : null;

    // targetPortal untuk peran tak dikenal harus undefined/null
    expect(targetPortal).toBeUndefined();

    // Karena targetPortal null/undefined, halaman /workspace tidak memanggil redirect() melainkan menampilkan UI "Peran tidak dikenali"
    const willRedirect = Boolean(targetPortal);
    expect(willRedirect).toBe(false);
  });
});
