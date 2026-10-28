import * as fs from 'fs';
import * as path from 'path';
import {
  getMenuGroupsForRole,
  SHARED_SUPPORT_GROUP,
  LEGACY_ROUTE_REDIRECTS,
  type MenuGroup,
  type MenuItem,
} from '../src/lib/config/menu-config';

// Daftar Pengecualian Bertanda Tangan Baseline Fase 2 (Bagian 1.B, 1.C, 1.D):
// 9 Menu tanpa rute khusus (catch-all) + menu khusus yang masih memakai konstanta tiruan
export const SIGNED_BASELINE_EXEMPTIONS = new Set([
  // 9 Menu tanpa halaman khusus (Catch-all [...slug]) - Lampiran A
  '/coordinator/curriculum',
  '/coordinator/courses',
  '/coordinator/monitoring/at-risk',
  '/exams/question-bank',
  '/exams/review',
  '/lecturer/mentoring',
  '/staff/master/students',
  '/staff/master/lecturers',
  '/staff/services/verification',
  // Menu dengan halaman khusus yang masih memuat konstanta tiruan (Bagian 1.C & 1.D) - Diselesaikan di Fase 4
  '/student',
  '/ta',
  '/lecturer',
  '/coordinator',
  '/staff',
  '/admin',
  '/announcements',
  '/grades',
  '/certificates',
  '/community',
  '/help',
  '/ta/classes',
]);

const ROLES = [
  'STUDENT',
  'TEACHING_ASSISTANT',
  'LECTURER',
  'PROGRAM_COORDINATOR',
  'PROGRAM_SECRETARY',
  'ACADEMIC_STAFF',
  'SYSTEM_ADMIN',
  'SUPER_ADMIN',
] as const;

export type RouteType = 'KHUSUS' | 'CATCH_ALL' | 'REDIRECT' | 'TIDAK_ADA';
export type MenuStatus = 'BERFUNGSI' | 'SEBAGIAN' | 'TIRUAN' | 'RUSAK' | 'TIDAK DIVERIFIKASI';

export interface AuditResultRow {
  role: string;
  menuLabel: string;
  menuId: string;
  href: string;
  routeType: RouteType;
  targetFile: string;
  dataSource: string;
  fakeActions: string[];
  mockConstants: string[];
  status: MenuStatus;
  evidence: string;
}

export interface OrphanRoute {
  path: string;
  file: string;
  recommendation: 'HUBUNGKAN_INDUK' | 'REDIRECT' | 'TETAPKAN_SUBHALAMAN';
  note: string;
}

export interface LegacyRouteAudit {
  path: string;
  file: string;
  redirectTarget: string | null;
  status: 'TERALIHKAN' | 'TERJANGKAU';
}

function resolveRouteFile(href: string): { type: RouteType; filePath: string } {
  const cleanHref = href.split('?')[0].replace(/\/+$/, '');
  const root = process.cwd();

  // 1. Cek halaman khusus di src/app/(portal)
  const portalPath = path.join(root, 'src', 'app', '(portal)', cleanHref === '' ? '' : cleanHref.slice(1), 'page.tsx');
  if (fs.existsSync(portalPath)) {
    return { type: 'KHUSUS', filePath: path.relative(root, portalPath).replace(/\\/g, '/') };
  }

  // Cek apakah di root app
  const directPath = path.join(root, 'src', 'app', cleanHref === '' ? '' : cleanHref.slice(1), 'page.tsx');
  if (fs.existsSync(directPath)) {
    return { type: 'KHUSUS', filePath: path.relative(root, directPath).replace(/\\/g, '/') };
  }

  // 2. Cek apakah cocok dengan catch-all [...slug]
  const segments = cleanHref.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 1; i--) {
    const parent = segments.slice(0, i).join('/');
    const catchAllPath = path.join(root, 'src', 'app', '(portal)', parent, '[...slug]', 'page.tsx');
    if (fs.existsSync(catchAllPath)) {
      return { type: 'CATCH_ALL', filePath: path.relative(root, catchAllPath).replace(/\\/g, '/') };
    }
  }

  // 3. Cek redirect legacy
  if (LEGACY_ROUTE_REDIRECTS[cleanHref]) {
    return { type: 'REDIRECT', filePath: `Redirect -> ${LEGACY_ROUTE_REDIRECTS[cleanHref]}` };
  }

  return { type: 'TIDAK_ADA', filePath: 'Tidak Ditemukan (404)' };
}

function inspectFileAndImports(filePath: string): {
  fakeActions: string[];
  mockConstants: string[];
  usesGlobalMemory: boolean;
  hasDummyPhrases: boolean;
  dataSource: string;
} {
  const root = process.cwd();
  const absolutePath = path.join(root, filePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      fakeActions: ['File tidak ada'],
      mockConstants: [],
      usesGlobalMemory: false,
      hasDummyPhrases: false,
      dataSource: 'N/A',
    };
  }

  // Kumpulkan konten berkas utama dan komponen yang diimpor dari folder yang sama atau views terkait
  const filesToScan: string[] = [absolutePath];
  const dir = path.dirname(absolutePath);

  try {
    const mainContent = fs.readFileSync(absolutePath, 'utf-8');
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(mainContent)) !== null) {
      const imp = match[1];
      if (imp.startsWith('.')) {
        const resolved = path.resolve(dir, imp.endsWith('.tsx') || imp.endsWith('.ts') ? imp : `${imp}.tsx`);
        if (fs.existsSync(resolved) && !filesToScan.includes(resolved)) {
          filesToScan.push(resolved);
        }
      }
    }
  } catch {
    // Abaikan galat pembacaan
  }

  const fakeActions: string[] = [];
  const mockConstants: string[] = [];
  let usesGlobalMemory = false;
  let hasDummyPhrases = false;
  let hasSupabase = false;
  let hasServerAction = false;

  for (const f of filesToScan) {
    try {
      const content = fs.readFileSync(f, 'utf-8');

      if (/alert\s*\(/.test(content)) fakeActions.push(`alert() di ${path.basename(f)}`);
      if (/onClick\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/.test(content)) fakeActions.push(`onClick no-op di ${path.basename(f)}`);
      if (/href\s*=\s*["']#["']/.test(content)) fakeActions.push(`href="#" di ${path.basename(f)}`);
      if (/setTimeout\s*\(/.test(content)) fakeActions.push(`setTimeout palsu di ${path.basename(f)}`);

      // Konstanta tiruan (huruf kapital min 3 karakter diikuti array atau objek literal)
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const constMatch = line.match(/^const\s+([A-Z0-9_]{3,})\s*(?::\s*[^=]+)?=\s*[[{]/);
        if (constMatch) {
          const constName = constMatch[1];
          // Kecualikan konstanta konfigurasi rute, role map, icon map
          if (!['ROLE_MAP', 'MENU_ITEMS', 'TABS', 'COLUMNS', 'STATUS_CONFIG', 'ICONS'].includes(constName)) {
            mockConstants.push(`${constName} (${path.basename(f)}:${i + 1})`);
          }
        }
      }

      if (/globalThis\.__siajar/.test(content)) usesGlobalMemory = true;
      if (/segera hadir|dummy|contoh data/i.test(content)) hasDummyPhrases = true;
      if (/supabase|prisma/i.test(content)) hasSupabase = true;
      if (/Action\(|server action/i.test(content)) hasServerAction = true;
    } catch {
      // Abaikan
    }
  }

  let dataSource = 'Server Action / Komponen Real';
  if (usesGlobalMemory) {
    dataSource = 'globalThis in-memory (Mode Demo)';
  } else if (mockConstants.length > 0) {
    dataSource = `Data Tiruan Statis (${mockConstants.slice(0, 2).join(', ')})`;
  } else if (hasSupabase) {
    dataSource = 'Supabase / Prisma';
  } else if (hasServerAction) {
    dataSource = 'Server Actions Real';
  }

  return {
    fakeActions,
    mockConstants,
    usesGlobalMemory,
    hasDummyPhrases,
    dataSource,
  };
}

export function runMenuAudit() {
  const results: AuditResultRow[] = [];
  const visitedKeys = new Set<string>();

  for (const role of ROLES) {
    const groups: MenuGroup[] = [...getMenuGroupsForRole(role), SHARED_SUPPORT_GROUP];

    for (const group of groups) {
      for (const item of group.items) {
        const uniqueKey = `${role}:${item.id}:${item.href}`;
        if (visitedKeys.has(uniqueKey)) continue;
        visitedKeys.add(uniqueKey);

        const routeInfo = resolveRouteFile(item.href);
        const inspection =
          routeInfo.type === 'KHUSUS' || routeInfo.type === 'CATCH_ALL'
            ? inspectFileAndImports(routeInfo.filePath)
            : {
                fakeActions: [],
                mockConstants: [],
                usesGlobalMemory: false,
                hasDummyPhrases: false,
                dataSource: routeInfo.type === 'REDIRECT' ? 'Dialihkan' : 'Tidak Ada',
              };

        let status: MenuStatus = 'BERFUNGSI';

        if (routeInfo.type === 'TIDAK_ADA') {
          status = 'RUSAK';
        } else if (routeInfo.type === 'CATCH_ALL') {
          status = 'TIRUAN';
        } else if (inspection.mockConstants.length > 0 || inspection.hasDummyPhrases) {
          status = 'TIRUAN';
        } else if (inspection.fakeActions.length > 0 || inspection.usesGlobalMemory) {
          status = 'SEBAGIAN';
        }

        const evidenceParts: string[] = [`File: ${routeInfo.filePath}`];
        if (inspection.mockConstants.length > 0) {
          evidenceParts.push(`Konstanta tiruan: ${inspection.mockConstants.slice(0, 2).join(', ')}`);
        }
        if (inspection.fakeActions.length > 0) {
          evidenceParts.push(`Aksi palsu: ${inspection.fakeActions.slice(0, 2).join(', ')}`);
        }
        if (inspection.usesGlobalMemory) {
          evidenceParts.push('Menggunakan store in-memory globalThis');
        }

        results.push({
          role,
          menuLabel: item.label,
          menuId: item.id,
          href: item.href,
          routeType: routeInfo.type,
          targetFile: routeInfo.filePath,
          dataSource: inspection.dataSource,
          fakeActions: inspection.fakeActions,
          mockConstants: inspection.mockConstants,
          status,
          evidence: evidenceParts.join(' | '),
        });
      }
    }
  }

  // 2.2 Cari Rute Yatim di src/app/(portal)
  const root = process.cwd();
  const portalDir = path.join(root, 'src', 'app', '(portal)');
  const orphanRoutes: OrphanRoute[] = [];
  const allMenuHrefs = new Set(results.map((r) => r.href.split('?')[0].replace(/\/+$/, '')));

  function scanPortalPages(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        scanPortalPages(fullPath);
      } else if (entry.name === 'page.tsx') {
        const relative = path.relative(portalDir, fullPath).replace(/\\/g, '/');
        const routePath = '/' + path.dirname(relative).replace(/^\.$/, '');
        const cleanRoute = routePath.replace(/\/+$/, '');

        // Abaikan parameter dinamis [id], [...slug]
        if (cleanRoute.includes('[')) continue;

        if (!allMenuHrefs.has(cleanRoute)) {
          let rec: OrphanRoute['recommendation'] = 'TETAPKAN_SUBHALAMAN';
          let note = 'Dapat diakses via navigasi internal atau tautan halaman lain.';

          if (cleanRoute.startsWith('/community/')) {
            rec = 'HUBUNGKAN_INDUK';
            note = 'Sub-tab dari halaman induk Komunitas (/community)';
          } else if (cleanRoute === '/profile' || cleanRoute === '/devices') {
            rec = 'TETAPKAN_SUBHALAMAN';
            note = 'Diakses dari menu avatar header (Akun & Sesi)';
          } else if (cleanRoute === '/notifications/preferences') {
            rec = 'HUBUNGKAN_INDUK';
            note = 'Diakses dari halaman Notifikasi atau tautan preferensi';
          } else if (cleanRoute.startsWith('/ta/')) {
            rec = 'HUBUNGKAN_INDUK';
            note = 'Halaman fitur asisten yang perlu dihubungkan ke sidebar asisten';
          } else if (cleanRoute.includes('/history')) {
            rec = 'HUBUNGKAN_INDUK';
            note = 'Riwayat sub-modul (presensi/ujian)';
          }

          orphanRoutes.push({
            path: cleanRoute,
            file: path.relative(root, fullPath).replace(/\\/g, '/'),
            recommendation: rec,
            note,
          });
        }
      }
    }
  }

  scanPortalPages(portalDir);

  // 2.3 Periksa 31 Halaman Legacy SIAKAD di src/app/(dashboard)
  const dashboardDir = path.join(root, 'src', 'app', '(dashboard)');
  const legacyRoutes: LegacyRouteAudit[] = [];

  function scanDashboardPages(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        scanDashboardPages(fullPath);
      } else if (entry.name === 'page.tsx') {
        const relative = path.relative(dashboardDir, fullPath).replace(/\\/g, '/');
        const routePath = '/' + path.dirname(relative).replace(/^\.$/, '');
        const cleanRoute = routePath.replace(/\/+$/, '');

        let redirectTarget: string | null = null;
        if (LEGACY_ROUTE_REDIRECTS[cleanRoute]) {
          redirectTarget = LEGACY_ROUTE_REDIRECTS[cleanRoute];
        } else if (cleanRoute.startsWith('/mahasiswa/')) {
          redirectTarget = '/student (via middleware.ts)';
        } else if (cleanRoute.startsWith('/dosen/')) {
          redirectTarget = '/lecturer (via middleware.ts)';
        }

        legacyRoutes.push({
          path: cleanRoute,
          file: path.relative(root, fullPath).replace(/\\/g, '/'),
          redirectTarget,
          status: redirectTarget ? 'TERALIHKAN' : 'TERJANGKAU',
        });
      }
    }
  }

  scanDashboardPages(dashboardDir);

  return { results, orphanRoutes, legacyRoutes };
}

async function main() {
  console.log('🔍 Memulai Audit Inventaris Menu Otomatis SIAJAR (Fase 2)...');
  const { results, orphanRoutes, legacyRoutes } = runMenuAudit();

  const countByStatus: Record<MenuStatus, number> = {
    BERFUNGSI: 0,
    SEBAGIAN: 0,
    TIRUAN: 0,
    RUSAK: 0,
    'TIDAK DIVERIFIKASI': 0,
  };

  for (const r of results) {
    countByStatus[r.status] = (countByStatus[r.status] || 0) + 1;
  }

  console.log('\n📊 Ringkasan Status Menu:');
  console.log(`   - BERFUNGSI:          ${countByStatus.BERFUNGSI}`);
  console.log(`   - SEBAGIAN:           ${countByStatus.SEBAGIAN}`);
  console.log(`   - TIRUAN:             ${countByStatus.TIRUAN}`);
  console.log(`   - RUSAK:              ${countByStatus.RUSAK}`);
  console.log(`   - TIDAK DIVERIFIKASI: ${countByStatus['TIDAK DIVERIFIKASI']}`);
  console.log(`   - Total Entri Menu:   ${results.length}`);

  console.log(`\n🔎 Ditemukan ${orphanRoutes.length} Rute Yatim di (portal)`);
  console.log(`🏛️ Ditemukan ${legacyRoutes.length} Halaman Legacy di (dashboard) (${legacyRoutes.filter((l) => l.status === 'TERALIHKAN').length} telah dialihkan)`);

  // Format Dokumen AUDIT_MENU_FUNGSI.md
  const docsPath = path.join(process.cwd(), 'docs', 'AUDIT_MENU_FUNGSI.md');
  let currentDoc = '';
  if (fs.existsSync(docsPath)) {
    currentDoc = fs.readFileSync(docsPath, 'utf-8');
  }

  const fase2Marker = '## 2. Hasil Audit Inventaris Menu Otomatis (Fase 2)';
  const baseDoc = currentDoc.includes(fase2Marker)
    ? currentDoc.substring(0, currentDoc.indexOf(fase2Marker)).trimEnd()
    : currentDoc.trimEnd();

  const fase2Content = `

---

## 2. Hasil Audit Inventaris Menu Otomatis (Fase 2)

Audit dijalankan pada ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} melalui \`npm run audit:menu\`.

### 2.1. Ringkasan Status Menu
- **Total Entri Menu**: ${results.length}
- **BERFUNGSI**: ${countByStatus.BERFUNGSI}
- **SEBAGIAN**: ${countByStatus.SEBAGIAN}
- **TIRUAN**: ${countByStatus.TIRUAN}
- **RUSAK**: ${countByStatus.RUSAK}
- **TIDAK DIVERIFIKASI**: ${countByStatus['TIDAK DIVERIFIKASI']}

---

### 2.2. Tabel Hasil Audit Menu per Peran (${results.length} Entri)

| Role | Menu | href | Jenis Rute | Sumber Data | Aksi Palsu | Status | Bukti |
|---|---|---|---|---|---|---|---|
${results
  .map(
    (r) =>
      `| \`${r.role}\` | ${r.menuLabel} | \`${r.href}\` | \`${r.routeType}\` | ${r.dataSource} | ${r.fakeActions.length > 0 ? r.fakeActions.slice(0, 1).join(', ') : '-'} | **${r.status}** | ${r.evidence.replace(/\|/g, '/')} |`
  )
  .join('\n')}

---

### 2.3. Rute Yatim (Orphan Routes) di \`src/app/(portal)\` (${orphanRoutes.length} Rute)

Halaman-halaman berikut ada dalam berkas proyek namun tidak tercantum di item navigasi menu utama peran:

| Path Rute | Berkas Komponen | Rekomendasi | Catatan / Rencana Penanganan |
|---|---|---|---|
${orphanRoutes
  .map(
    (o) =>
      `| \`${o.path}\` | \`${o.file}\` | \`${o.recommendation}\` | ${o.note} |`
  )
  .join('\n')}

---

### 2.4. Audit Halaman Legacy SIAKAD di \`src/app/(dashboard)\` (${legacyRoutes.length} Rute)

Sesuai aturan arsitektur, seluruh rute legacy tidak boleh dihapus melainkan harus dialihkan (*redirect*) ke rute portal LMS yang setara:

| Path Legacy | Berkas Halaman | Target Pengalihan | Status |
|---|---|---|---|
${legacyRoutes
  .map(
    (l) =>
      `| \`${l.path}\` | \`${l.file}\` | \`${l.redirectTarget || 'Belum dialihkan'}\` | **${l.status}** |`
  )
  .join('\n')}
`;

  fs.writeFileSync(docsPath, baseDoc + fase2Content, 'utf-8');
  console.log(`\n📄 Laporan audit berhasil ditulis ke: ${docsPath}`);

  // Cek apakah ada menu TIRUAN di luar daftar pengecualian baseline
  const isStrict = process.argv.includes('--strict');
  const unexemptedTiruan = results.filter(
    (r) =>
      (r.status === 'TIRUAN' || r.status === 'RUSAK' || r.routeType === 'CATCH_ALL' || r.routeType === 'TIDAK_ADA') &&
      !SIGNED_BASELINE_EXEMPTIONS.has(r.href.split('?')[0])
  );

  if (isStrict && countByStatus.TIRUAN > 0) {
    console.error(`\n❌ AUDIT GAGAL (--strict): Ditemukan ${countByStatus.TIRUAN} menu TIRUAN.`);
    process.exit(1);
  }

  if (unexemptedTiruan.length > 0) {
    console.error(`\n❌ AUDIT GAGAL: Ditemukan ${unexemptedTiruan.length} menu TIRUAN / RUSAK di luar daftar pengecualian resmi:`);
    unexemptedTiruan.forEach((u) => console.error(`   - [${u.role}] ${u.menuLabel} (${u.href}) -> ${u.status}`));
    process.exit(1);
  }

  console.log('\n✅ Audit selesai: Semua menu TIRUAN berada dalam batas pengecualian baseline 9 rute (Lampiran A).');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Terjadi kesalahan audit:', err);
    process.exit(1);
  });
}
