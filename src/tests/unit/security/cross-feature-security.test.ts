import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';

let mockCurrentUser: {
  user: { id: string; name: string; email?: string };
  roles: string[];
  activeRole: string;
} | null = null;

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

import { listClassMembersAction } from '@/modules/academic/actions';
import { GET as getAcademicReportExport } from '@/app/api/export/laporan-akademik/route';

const PERSONAL_EMAIL_REGEX = new RegExp('@(gm' + 'ail|yah' + 'oo)\\.com\\b', 'i');

function collectSourceFiles(dirPath: string, exts = ['.ts', '.tsx', '.sql']): string[] {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      results.push(...collectSourceFiles(fullPath, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Lintas Fitur: Privasi Email Pribadi, Otorisasi Peserta Kelas, dan Proteksi Endpoint Ekspor', () => {
  const classA = 'c0000000-0000-0000-0000-000000000001';
  const lecturerA = '00000000-0000-0000-0000-000000000004';
  const lecturerB = '00000000-0000-0000-0000-000000000099';
  const studentEnrolled = '00000000-0000-0000-0000-000000000007';
  const studentOutsider = '00000000-0000-0000-0000-000000000088';
  const taAssigned = '00000000-0000-0000-0000-000000000006';
  const taUnassigned = '00000000-0000-0000-0000-000000000077';

  beforeEach(() => {
    mockCurrentUser = null;

    (globalThis as any).__siajarAkademik = {
      classes: [
        {
          id: classA,
          title: 'Pemrograman Web & Cloud (IF-3A)',
          created_by: lecturerA,
          status: 'OPEN',
        },
      ],
      enrollments: [
        { class_id: classA, student_id: studentEnrolled, status: 'ACTIVE' },
      ],
    };

    (globalThis as any).__siajarAsdos = [
      {
        id: 'asdos-cross-1',
        class_id: classA,
        user_id: taAssigned,
        name: 'Budi Pratama (Asdos)',
        nim: '2101010012',
        permissions: { can_grade: true, can_moderate_forum: true, can_manage_materials: true },
        assigned_at: new Date().toISOString(),
      },
    ];
  });

  describe('1. Kebijakan Tanpa Email Pribadi di Seluruh Repositori', () => {
    it('tidak memuat domain email pribadi di seed, demo-users, halaman login, dan preferensi notifikasi', () => {
      const rootDir = process.cwd();
      const targetFiles = [
        'src/lib/db/seed-data.ts',
        'supabase/seed.sql',
        'src/modules/identity/demo-users.ts',
        'src/app/(auth)/login/page.tsx',
        'src/lib/auth/actions.ts',
        'src/lib/auth/session.ts',
        'src/app/(dashboard)/mahasiswa/preferensi-notifikasi/page.tsx',
      ];

      for (const relPath of targetFiles) {
        const absPath = path.join(rootDir, relPath);
        expect(fs.existsSync(absPath)).toBe(true);
        const content = fs.readFileSync(absPath, 'utf8');
        expect(
          PERSONAL_EMAIL_REGEX.test(content),
          `Ditemukan email pribadi di berkas ${relPath}`
        ).toBe(false);
      }
    });

    it('tidak memuat email pribadi di fixture maupun berkas kode/migrasi aplikasi', () => {
      const rootDir = process.cwd();
      const allFiles = [
        ...collectSourceFiles(path.join(rootDir, 'src')),
        ...collectSourceFiles(path.join(rootDir, 'supabase')),
      ];

      for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(
          PERSONAL_EMAIL_REGEX.test(content),
          `Ditemukan domain email pribadi pada ${path.relative(rootDir, filePath)}`
        ).toBe(false);
      }
    });

    it('tidak pernah memakai store palsu legacy di seluruh kode maupun tes', () => {
      const rootDir = process.cwd();
      const allFiles = collectSourceFiles(path.join(rootDir, 'src'));
      const bannedStoreToken = ['__siajar', 'Mem'].join('');

      for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(
          content.includes(bannedStoreToken),
          `Ditemukan penggunaan store palsu pada ${path.relative(rootDir, filePath)}`
        ).toBe(false);
      }
    });
  });

  describe('2. Otorisasi dan Sanitasi Email pada listClassMembersAction', () => {
    it('menolak tanpa sesi, SYSTEM_ADMIN, mahasiswa non-anggota, dosen non-pengampu, dan TA tidak ditugaskan', async () => {
      // 1. Tanpa sesi
      mockCurrentUser = null;
      const unauthRes = await listClassMembersAction(classA);
      expect(unauthRes.ok).toBe(false);
      expect(unauthRes.data).toBeUndefined();

      // 2. SYSTEM_ADMIN
      mockCurrentUser = {
        user: { id: 'sysadmin-1', name: 'System Admin' },
        roles: ['SYSTEM_ADMIN'],
        activeRole: 'SYSTEM_ADMIN',
      };
      const sysRes = await listClassMembersAction(classA);
      expect(sysRes.ok).toBe(false);
      expect(sysRes.data).toBeUndefined();

      // 3. Mahasiswa tidak terdaftar di classA
      mockCurrentUser = {
        user: { id: studentOutsider, name: 'Mahasiswa Luar' },
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      };
      const outsiderRes = await listClassMembersAction(classA);
      expect(outsiderRes.ok).toBe(false);
      expect(outsiderRes.data).toBeUndefined();
      expect(outsiderRes.error).toMatch(/tidak terdaftar/i);

      // 4. Dosen bukan pengampu classA
      mockCurrentUser = {
        user: { id: lecturerB, name: 'Dosen Lain' },
        roles: ['LECTURER'],
        activeRole: 'LECTURER',
      };
      const otherLecRes = await listClassMembersAction(classA);
      expect(otherLecRes.ok).toBe(false);
      expect(otherLecRes.data).toBeUndefined();
      expect(otherLecRes.error).toMatch(/bukan dosen pengampu/i);

      // 5. TA tidak ditugaskan di classA
      mockCurrentUser = {
        user: { id: taUnassigned, name: 'TA Kelas Lain' },
        roles: ['TEACHING_ASSISTANT'],
        activeRole: 'TEACHING_ASSISTANT',
      };
      const unassignedTaRes = await listClassMembersAction(classA);
      expect(unassignedTaRes.ok).toBe(false);
      expect(unassignedTaRes.data).toBeUndefined();
      expect(unassignedTaRes.error).toMatch(/tidak ditugaskan/i);
    });

    it('mengembalikan daftar anggota kelas bagi anggota sah TANPA field email atau alamat email pribadi', async () => {
      mockCurrentUser = {
        user: { id: studentEnrolled, name: 'Mahasiswa Terdaftar' },
        roles: ['STUDENT'],
        activeRole: 'STUDENT',
      };

      const result = await listClassMembersAction(classA);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      const payload = result.data!;
      expect(payload.lecturer).toBeTruthy();
      expect(payload.assistants.length).toBeGreaterThan(0);
      expect(payload.members.length).toBeGreaterThan(0);

      // Pastikan tidak ada properti email pada lecturer, assistants, maupun members
      expect('email' in (payload.lecturer as Record<string, unknown>)).toBe(false);
      for (const assistant of payload.assistants) {
        expect('email' in (assistant as unknown as Record<string, unknown>)).toBe(false);
      }
      for (const member of payload.members) {
        expect('email' in (member as unknown as Record<string, unknown>)).toBe(false);
      }

      const serialized = JSON.stringify(payload);
      expect(PERSONAL_EMAIL_REGEX.test(serialized)).toBe(false);
      expect(serialized).not.toContain('@');
    });
  });

  describe('3. Proteksi Endpoint /api/export/laporan-akademik & Sanitasi Ekspor', () => {
    it('menolak permintaan tanpa sesi login dengan status 401', async () => {
      mockCurrentUser = null;
      const res = await getAcademicReportExport(new NextRequest('http://localhost:3000/api/export/laporan-akademik'));
      expect(res.status).toBe(401);
    });

    it('menolak STUDENT, LECTURER, TEACHING_ASSISTANT, dan SYSTEM_ADMIN dengan status 403', async () => {
      const forbiddenRoles = ['STUDENT', 'LECTURER', 'TEACHING_ASSISTANT', 'SYSTEM_ADMIN'];

      for (const role of forbiddenRoles) {
        mockCurrentUser = {
          user: { id: `user-${role}`, name: `User ${role}` },
          roles: [role],
          activeRole: role,
        };
        const res = await getAcademicReportExport(new NextRequest('http://localhost:3000/api/export/laporan-akademik'));
        expect(res.status, `Role ${role} seharusnya ditolak 403`).toBe(403);
      }
    });

    it('mengizinkan ACADEMIC_STAFF, PROGRAM_COORDINATOR, dan SUPER_ADMIN serta memastikan isi Excel bebas email pribadi', async () => {
      const allowedRoles = ['ACADEMIC_STAFF', 'PROGRAM_COORDINATOR', 'SUPER_ADMIN'];

      for (const role of allowedRoles) {
        mockCurrentUser = {
          user: { id: `user-${role}`, name: `Authorized ${role}` },
          roles: [role],
          activeRole: role,
        };

        const res = await getAcademicReportExport(new NextRequest('http://localhost:3000/api/export/laporan-akademik'));
        expect(res.status, `Role ${role} seharusnya diizinkan 200`).toBe(200);
        expect(res.headers.get('Content-Type')).toContain(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        const arrayBuffer = await res.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        expect(workbook.worksheets.length).toBeGreaterThanOrEqual(2);

        workbook.eachSheet((sheet) => {
          sheet.eachRow((row) => {
            row.eachCell((cell) => {
              const cellText = String(cell.value ?? '');
              expect(
                PERSONAL_EMAIL_REGEX.test(cellText),
                `Ditemukan email pribadi di sel ekspor Excel: ${cellText}`
              ).toBe(false);
            });
          });
        });
      }
    });
  });
});
