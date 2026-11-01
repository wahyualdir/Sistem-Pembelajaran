import * as fs from 'fs';
import * as path from 'path';
import { getMenuGroupsForRole } from '../src/lib/config/menu-config';

interface GuardAuditResult {
  role: string;
  href: string;
  filePath: string;
  status: 'DIIZINKAN' | 'DITOLAK-SALAH' | 'TIDAK-PASTI';
  guardsFound: string[];
  notes: string;
}

function findPageFile(appDir: string, href: string): string | null {
  const cleanHref = href.split('?')[0].replace(/^\//, '');
  const segments = cleanHref === '' ? [] : cleanHref.split('/');

  function search(currentDir: string, segIndex: number): string | null {
    if (!fs.existsSync(currentDir)) return null;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    if (segIndex === segments.length) {
      // Look for page.tsx in currentDir
      const pageFile = path.join(currentDir, 'page.tsx');
      if (fs.existsSync(pageFile)) {
        return pageFile;
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const name = entry.name;
        if (name.startsWith('(') && name.endsWith(')')) {
          // Route group (skip segment index)
          const found = search(path.join(currentDir, name), segIndex);
          if (found) return found;
        } else if (segIndex < segments.length && name === segments[segIndex]) {
          const found = search(path.join(currentDir, name), segIndex + 1);
          if (found) return found;
        }
      }
    }
    return null;
  }

  return search(appDir, 0);
}

function analyzePageGuard(filePath: string, role: string): { status: 'DIIZINKAN' | 'DITOLAK-SALAH' | 'TIDAK-PASTI'; guards: string[]; notes: string } {
  if (!fs.existsSync(filePath)) {
    return {
      status: 'DITOLAK-SALAH',
      guards: ['File tidak ditemukan'],
      notes: `Berkas ${filePath} tidak ada di sistem`,
    };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const guards: string[] = [];
  let isDenied = false;
  let isAllowed = false;
  let hasRoleGuard = false;

  // 1. Cek assertServerRole
  const assertMatch = content.match(/assertServerRole\(\s*\[([^\]]+)\]/);
  if (assertMatch) {
    hasRoleGuard = true;
    const allowedRoles = assertMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
    guards.push(`assertServerRole([${allowedRoles.join(', ')}])`);
    if (allowedRoles.includes(role)) {
      isAllowed = true;
    } else {
      isDenied = true;
    }
  }

  // 2. Cek redirect berbasis role
  const redirectMatches = content.match(/redirect\([^)]+\)/g) || [];
  if (redirectMatches.length > 0) {
    guards.push(...redirectMatches);
  }

  // Cek perbandingan role / activeRole
  const roleCheckRegex = /(?:role|activeRole)\s*(?:===|!==|==|!=)\s*['"]([A-Z_]+)['"]/g;
  let match;
  const checkedRoles: string[] = [];
  while ((match = roleCheckRegex.exec(content)) !== null) {
    checkedRoles.push(match[1]);
  }

  if (checkedRoles.length > 0) {
    hasRoleGuard = true;
    guards.push(`Role checks: ${Array.from(new Set(checkedRoles)).join(', ')}`);
  }

  // Khusus secretary & lab pages
  if (role === 'PROGRAM_SECRETARY') {
    if (content.includes("role !== 'PROGRAM_SECRETARY'") || content.includes("role === 'PROGRAM_SECRETARY'")) {
      isAllowed = true;
    }
    if (filePath.includes('secretary') && !content.includes('PROGRAM_SECRETARY')) {
      // Jika di folder secretary tapi tidak mengecek PROGRAM_SECRETARY
      if (checkedRoles.length > 0 && !checkedRoles.includes('PROGRAM_SECRETARY')) {
        isDenied = true;
      }
    }
  }

  if (role === 'LAB_HEAD') {
    if (content.includes("role !== 'LAB_HEAD'") || content.includes("role === 'LAB_HEAD'")) {
      isAllowed = true;
    }
    if (filePath.includes('lab') && !content.includes('LAB_HEAD')) {
      if (checkedRoles.length > 0 && !checkedRoles.includes('LAB_HEAD')) {
        isDenied = true;
      }
    }
  }

  // Halaman bersama (shared) tanpa guard peran spesifik
  if (!hasRoleGuard) {
    return {
      status: 'DIIZINKAN',
      guards: ['Tidak ada guard peran spesifik'],
      notes: 'Halaman umum/bersama (akses terbuka untuk semua peran portal)',
    };
  }

  if (isDenied && !isAllowed) {
    return {
      status: 'DITOLAK-SALAH',
      guards,
      notes: `Halaman memiliki guard peran yang tidak memuat ${role}`,
    };
  }

  if (isAllowed) {
    return {
      status: 'DIIZINKAN',
      guards,
      notes: `Guard secara eksplisit mengizinkan peran ${role}`,
    };
  }

  return {
    status: 'TIDAK-PASTI',
    guards,
    notes: 'Pemeriksaan peran dinamis yang membutuhkan verifikasi runtime',
  };
}

export function auditRoleGuards() {
  const appDir = path.resolve(process.cwd(), 'src/app');
  const rolesToAudit = ['PROGRAM_SECRETARY', 'LAB_HEAD'];
  const allResults: GuardAuditResult[] = [];

  for (const role of rolesToAudit) {
    const groups = getMenuGroupsForRole(role);
    const seenHrefs = new Set<string>();

    for (const group of groups) {
      for (const item of group.items) {
        if (seenHrefs.has(item.href)) continue;
        seenHrefs.add(item.href);

        const pageFile = findPageFile(appDir, item.href);
        const relPage = pageFile ? path.relative(process.cwd(), pageFile).replace(/\\/g, '/') : 'FILE_NOT_FOUND';
        const analysis = pageFile
          ? analyzePageGuard(pageFile, role)
          : { status: 'DITOLAK-SALAH' as const, guards: ['File tidak ditemukan'], notes: 'File page.tsx tidak ditemukan' };

        allResults.push({
          role,
          href: item.href,
          filePath: relPage,
          status: analysis.status,
          guardsFound: analysis.guards,
          notes: analysis.notes,
        });
      }
    }
  }

  // Tulis laporan ke docs/AUDIT_GUARD_PERAN_BARU.md
  let md = `# AUDIT STATIS GUARD HALAMAN UNTUK PERAN BARU\n\n`;
  md += `**Tanggal**: ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Peran Diperiksa**: PROGRAM_SECRETARY (13 menu), LAB_HEAD (12 menu)\n\n`;

  const countDiizinkan = allResults.filter((r) => r.status === 'DIIZINKAN').length;
  const countDitolak = allResults.filter((r) => r.status === 'DITOLAK-SALAH').length;
  const countPasti = allResults.filter((r) => r.status === 'TIDAK-PASTI').length;

  md += `## Ringkasan Eksekutif\n\n`;
  md += `- **DIIZINKAN**: ${countDiizinkan} menu\n`;
  md += `- **DITOLAK-SALAH**: ${countDitolak} menu\n`;
  md += `- **TIDAK-PASTI**: ${countPasti} menu\n`;
  md += `- **Total Diperiksa**: ${allResults.length} menu (25 menu unik per peran)\n\n`;

  for (const role of rolesToAudit) {
    md += `## Peran: \`${role}\`\n\n`;
    md += `| Menu (href) | Berkas Halaman (\`page.tsx\`) | Status | Guard Terdeteksi | Catatan |\n`;
    md += `| --- | --- | --- | --- | --- |\n`;

    const roleResults = allResults.filter((r) => r.role === role);
    for (const res of roleResults) {
      const guardsStr = res.guardsFound.length > 0 ? res.guardsFound.join('; ') : '-';
      md += `| \`${res.href}\` | \`${res.filePath}\` | **${res.status}** | ${guardsStr.replace(/\|/g, '\\|')} | ${res.notes} |\n`;
    }
    md += `\n`;
  }

  const outPath = path.resolve(process.cwd(), 'docs/AUDIT_GUARD_PERAN_BARU.md');
  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(`Laporan berhasil ditulis ke ${outPath}`);
  console.log(`Ringkasan: ${countDiizinkan} DIIZINKAN, ${countDitolak} DITOLAK-SALAH, ${countPasti} TIDAK-PASTI`);
}

if (require.main === module) {
  auditRoleGuards();
}
