import {
  getMenuGroupsForRole,
  SHARED_SUPPORT_GROUP,
  type MenuGroup,
} from '../src/lib/config/menu-config';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3008';

const ROLES_INFO: Record<string, { userId: string; role: string }> = {
  STUDENT: { userId: 'a0000001-0000-0000-0000-000000000001', role: 'STUDENT' },
  TEACHING_ASSISTANT: { userId: 'a0000003-0000-0000-0000-000000000003', role: 'TEACHING_ASSISTANT' },
  LECTURER: { userId: 'a0000002-0000-0000-0000-000000000002', role: 'LECTURER' },
  PROGRAM_COORDINATOR: { userId: 'a0000004-0000-0000-0000-000000000004', role: 'PROGRAM_COORDINATOR' },
  ACADEMIC_STAFF: { userId: 'a0000005-0000-0000-0000-000000000005', role: 'ACADEMIC_STAFF' },
  SYSTEM_ADMIN: { userId: 'a0000006-0000-0000-0000-000000000006', role: 'SYSTEM_ADMIN' },
  SUPER_ADMIN: { userId: 'a0000010-0000-0000-0000-000000000010', role: 'SUPER_ADMIN' },
};

interface ProbeResult {
  role: string;
  label: string;
  href: string;
  httpStatus: number;
  finalUrl: string;
  statusCategory: 'OK' | 'REDIRECT' | 'ERROR' | 'NOT_FOUND';
  bodySnippet: string;
}

async function main() {
  console.log(`🌐 Memulai Live HTTP Probe terhadap server lokal di ${BASE_URL}...`);
  const probeResults: ProbeResult[] = [];

  for (const [roleName, info] of Object.entries(ROLES_INFO)) {
    console.log(`\nTesting Role: [${roleName}]...`);
    const groups: MenuGroup[] = [...getMenuGroupsForRole(roleName), SHARED_SUPPORT_GROUP];

    for (const group of groups) {
      for (const item of group.items) {
        const targetUrl = `${BASE_URL}${item.href}`;
        try {
          const res = await fetch(targetUrl, {
            headers: {
              Cookie: `demo_session=${info.userId}; active_role=${info.role}`,
              'User-Agent': 'SIAJAR-Menu-Audit-Probe/1.0',
            },
            redirect: 'follow',
          });

          const bodyText = await res.text();
          let statusCategory: ProbeResult['statusCategory'] = 'OK';
          if (res.status >= 400 && res.status < 500) statusCategory = 'NOT_FOUND';
          else if (res.status >= 500) statusCategory = 'ERROR';

          const snippet = bodyText.replace(/\s+/g, ' ').substring(0, 100);

          probeResults.push({
            role: roleName,
            label: item.label,
            href: item.href,
            httpStatus: res.status,
            finalUrl: res.url.replace(BASE_URL, ''),
            statusCategory,
            bodySnippet: snippet,
          });

          console.log(`   ${res.status} | [${item.label}] -> ${item.href} (final: ${res.url.replace(BASE_URL, '')})`);
        } catch (err: any) {
          console.error(`   ERR | [${item.label}] -> ${item.href}: ${err.message}`);
          probeResults.push({
            role: roleName,
            label: item.label,
            href: item.href,
            httpStatus: 0,
            finalUrl: item.href,
            statusCategory: 'ERROR',
            bodySnippet: err.message,
          });
        }
      }
    }
  }

  // Ringkasan
  const okCount = probeResults.filter((p) => p.httpStatus === 200).length;
  const errCount = probeResults.filter((p) => p.httpStatus >= 400 || p.httpStatus === 0).length;
  console.log(`\n📊 Hasil Live Probe HTTP:`);
  console.log(`   - 200 OK: ${okCount} / ${probeResults.length}`);
  console.log(`   - Galat/Gagal: ${errCount}`);

  // Simpan hasil probe ke file log
  const logPath = path.join(process.cwd(), 'docs', 'baseline-menu-fungsi', 'live-probe-fase2.json');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(probeResults, null, 2), 'utf-8');
  console.log(`💾 Hasil probe disimpan ke ${logPath}`);
}

main().catch(console.error);
