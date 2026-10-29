import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  getMenuGroupsForRole,
  isRouteAllowedForRole,
  type MenuGroup,
  type MenuItem,
} from '../src/lib/config/menu-config';

const ROLES = [
  'STUDENT',
  'TEACHING_ASSISTANT',
  'LECTURER',
  'PROGRAM_COORDINATOR',
  'PROGRAM_SECRETARY',
  'LAB_HEAD',
  'ACADEMIC_STAFF',
  'SYSTEM_ADMIN',
  'SUPER_ADMIN',
] as const;

function resolveRouteFile(href: string): { type: string; filePath: string } {
  const cleanHref = href.split('?')[0].replace(/\/+$/, '');
  const root = process.cwd();

  const portalPath = path.join(root, 'src', 'app', '(portal)', cleanHref === '' ? '' : cleanHref.slice(1), 'page.tsx');
  if (fs.existsSync(portalPath)) {
    return { type: 'KHUSUS', filePath: path.relative(root, portalPath).replace(/\\/g, '/') };
  }

  const directPath = path.join(root, 'src', 'app', cleanHref === '' ? '' : cleanHref.slice(1), 'page.tsx');
  if (fs.existsSync(directPath)) {
    return { type: 'KHUSUS', filePath: path.relative(root, directPath).replace(/\\/g, '/') };
  }

  const segments = cleanHref.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 1; i--) {
    const parent = segments.slice(0, i).join('/');
    const catchAllPath = path.join(root, 'src', 'app', '(portal)', parent, '[...slug]', 'page.tsx');
    if (fs.existsSync(catchAllPath)) {
      return { type: 'CATCH_ALL', filePath: path.relative(root, catchAllPath).replace(/\\/g, '/') };
    }
  }

  return { type: 'TIDAK_ADA', filePath: 'Tidak Ditemukan (404)' };
}

describe('FASE 8 — Menu Contract Test (tests/menu-contract.test.ts)', () => {
  // (a) Setiap href menu punya halaman khusus
  it('(a) setiap href menu di menu-config.ts menuju file page.tsx khusus (bukan catch-all dummy)', () => {
    const seenHrefs = new Set<string>();

    for (const role of ROLES) {
      const groups = getMenuGroupsForRole(role);
      for (const group of groups) {
        for (const item of group.items) {
          if (!seenHrefs.has(item.href)) {
            seenHrefs.add(item.href);
            const resolved = resolveRouteFile(item.href);
            expect(resolved.type, `Menu href '${item.href}' (${item.label}) harus memiliki halaman khusus, bukan ${resolved.type}`).toBe('KHUSUS');
          }
        }
      }
    }

    expect(seenHrefs.size).toBeGreaterThan(30);
  });

  // (b) Tidak ada konstanta tiruan di halaman menu
  it('(b) tidak ada konstanta mock/tiruan statis di halaman menu', () => {
    const root = process.cwd();
    const seenFiles = new Set<string>();

    for (const role of ROLES) {
      const groups = getMenuGroupsForRole(role);
      for (const group of groups) {
        for (const item of group.items) {
          const resolved = resolveRouteFile(item.href);
          if (resolved.type === 'KHUSUS' && !seenFiles.has(resolved.filePath)) {
            seenFiles.add(resolved.filePath);
            const content = fs.readFileSync(path.join(root, resolved.filePath), 'utf8');

            // Cek konstanta mock data (misal: const DUMMY_*, const MOCK_*, const DEMO_DATA_*)
            const mockMatches = content.match(/const (?:DUMMY_|MOCK_|SAMPLE_)[A-Z0-9_]+/g);
            expect(mockMatches, `File ${resolved.filePath} tidak boleh memuat konstanta tiruan: ${mockMatches?.join(', ')}`).toBeNull();
          }
        }
      }
    }
  });

  // (c) Tidak ada alert( di src/ (di luar berkas tes)
  it('(c) tidak ada pemanggilan fungsi browser alert( di seluruh src/ di luar tests', () => {
    const root = process.cwd();
    function scanDir(dir: string, fileList: string[] = []): string[] {
      for (const file of fs.readdirSync(dir)) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== 'tests') {
            scanDir(full, fileList);
          }
        } else if (/\.(ts|tsx|js|mjs)$/.test(file)) {
          fileList.push(full);
        }
      }
      return fileList;
    }

    const appFiles = scanDir(path.join(root, 'src'));
    const alertFiles: { file: string; line: number; text: string }[] = [];

    for (const f of appFiles) {
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, idx) => {
        if (/\balert\s*\(/.test(line)) {
          alertFiles.push({
            file: path.relative(root, f).replace(/\\/g, '/'),
            line: idx + 1,
            text: line.trim(),
          });
        }
      });
    }

    expect(
      alertFiles,
      `Ditemukan pemanggilan alert() di kode aplikasi:\n${JSON.stringify(alertFiles, null, 2)}`
    ).toHaveLength(0);
  });

  // (d) Setiap menu hanya terlihat oleh role yang berhak mengaksesnya
  it('(d) setiap menu hanya terlihat oleh role yang berwenang mengaksesnya (isRouteAllowedForRole)', () => {
    for (const role of ROLES) {
      const groups = getMenuGroupsForRole(role);
      for (const group of groups) {
        for (const item of group.items) {
          const allowed = isRouteAllowedForRole(item.href, role);
          expect(allowed, `Role ${role} seharusnya berhak mengakses menu ${item.label} (${item.href})`).toBe(true);
        }
      }
    }
  });

  // (e) Role yang tidak berhak mengakses menu role lain ditolak oleh isRouteAllowedForRole
  it('(e) akses silang ke menu yang tidak berhak ditolak (Matrix RBAC)', () => {
    // Mahasiswa tidak boleh akses rute dosen, kaprodi, staf, admin
    expect(isRouteAllowedForRole('/lecturer', 'STUDENT')).toBe(false);
    expect(isRouteAllowedForRole('/coordinator', 'STUDENT')).toBe(false);
    expect(isRouteAllowedForRole('/staff', 'STUDENT')).toBe(false);
    expect(isRouteAllowedForRole('/admin', 'STUDENT')).toBe(false);

    // PROGRAM_SECRETARY dan LAB_HEAD batas rute
    expect(isRouteAllowedForRole('/secretary', 'STUDENT')).toBe(false);
    expect(isRouteAllowedForRole('/secretary', 'LECTURER')).toBe(false);
    expect(isRouteAllowedForRole('/coordinator', 'PROGRAM_SECRETARY')).toBe(false);
    expect(isRouteAllowedForRole('/lab', 'STUDENT')).toBe(false);
    expect(isRouteAllowedForRole('/lab', 'PROGRAM_COORDINATOR')).toBe(false);
    expect(isRouteAllowedForRole('/lab', 'PROGRAM_SECRETARY')).toBe(false);
    expect(isRouteAllowedForRole('/secretary', 'LAB_HEAD')).toBe(false);

    // Dosen tidak boleh akses rute admin sistem
    expect(isRouteAllowedForRole('/admin', 'LECTURER')).toBe(false);
    expect(isRouteAllowedForRole('/staff/master', 'LECTURER')).toBe(false);

    // SYSTEM_ADMIN dilarang mengakses rute akademik
    expect(isRouteAllowedForRole('/classes', 'SYSTEM_ADMIN')).toBe(false);
    expect(isRouteAllowedForRole('/grades', 'SYSTEM_ADMIN')).toBe(false);
    expect(isRouteAllowedForRole('/attendance', 'SYSTEM_ADMIN')).toBe(false);
  });
});
