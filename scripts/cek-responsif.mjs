#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const allowlistPath = path.join(root, 'scripts/cek-responsif.allowlist.json');
let allowlist = {
  unreplaced_vh: [],
  zoom_restrictions: [],
  sub_12px_text: [],
  unwrapped_tables: [],
  group_hover_without_touch_reveal: [],
  wide_fixed_px: [],
  unsupported_keyframes: [],
};

if (fs.existsSync(allowlistPath)) {
  try {
    allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
  } catch (err) {
    console.error(`[cek:responsif] Gagal membaca ${allowlistPath}:`, err.message);
  }
}

const allowUnreplacedVh = new Set(allowlist.unreplaced_vh || []);
const allowZoom = new Set(allowlist.zoom_restrictions || []);
const allowSub12 = new Set(allowlist.sub_12px_text || []);
const allowTables = new Set(allowlist.unwrapped_tables || []);
const allowGroupHover = new Set(allowlist.group_hover_without_touch_reveal || []);
const allowWidePx = new Set(allowlist.wide_fixed_px || []);

function getFiles(dir, res = []) {
  if (!fs.existsSync(dir)) return res;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        getFiles(full, res);
      }
    } else if (/\.(tsx?|css)$/.test(f)) {
      res.push(path.relative(root, full).replace(/\\/g, '/'));
    }
  }
  return res;
}

const files = getFiles(path.join(root, 'src'));
const violations = [];

for (const relFile of files) {
  const absPath = path.join(root, relFile);
  const content = fs.readFileSync(absPath, 'utf8');
  const lines = content.split(/\r?\n/);

  // 1. Unreplaced 100vh / h-screen / min-h-screen
  if (!allowUnreplacedVh.has(relFile)) {
    lines.forEach((line, idx) => {
      // Must not be preceded by d or s (dvh, svh, min-h-[100dvh], etc.)
      if (/(?<![ds])(100vh|h-screen|min-h-screen)\b/.test(line)) {
        // Exclude comments or explicit safe documentation
        if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          violations.push({
            file: relFile,
            line: idx + 1,
            rule: '100vh/h-screen tanpa dvh/svh',
            detail: line.trim(),
          });
        }
      }
    });
  }

  // 2. Zoom restrictions (user-scalable=no, maximum-scale)
  if (!allowZoom.has(relFile)) {
    lines.forEach((line, idx) => {
      if (/(maximum-scale|user-scalable\s*=\s*['"]?no['"]?)/i.test(line)) {
        violations.push({
          file: relFile,
          line: idx + 1,
          rule: 'Pembatasan zoom terlarang (maximum-scale/user-scalable)',
          detail: line.trim(),
        });
      }
    });
  }

  // 3. Unwrapped tables
  if (relFile.endsWith('.tsx') && !allowTables.has(relFile)) {
    if (/<table[\s>]/i.test(content)) {
      const hasWrapper =
        content.includes('overflow-x-auto') ||
        content.includes('table-scroll') ||
        content.includes('ResponsiveTable');
      if (!hasWrapper) {
        violations.push({
          file: relFile,
          line: 1,
          rule: 'Tabel tanpa pembungkus scroll responsif (table-scroll / overflow-x-auto)',
          detail: '<table ...> ditemukan tanpa kontainer scroll',
        });
      }
    }
  }

  // 4. Sub-12px typography
  if ((relFile.endsWith('.tsx') || relFile.endsWith('.ts')) && !allowSub12.has(relFile)) {
    lines.forEach((line, idx) => {
      if (/text-\[(?:9|10|11)px\]/.test(line)) {
        violations.push({
          file: relFile,
          line: idx + 1,
          rule: 'Tipografi di bawah 12px (text-[9|10|11px])',
          detail: line.trim(),
        });
      }
    });
  }

  // 5. Group hover without touch-reveal
  if (relFile.endsWith('.tsx') && !allowGroupHover.has(relFile)) {
    if (/group-hover:(?:opacity|invisible)/.test(content) && !content.includes('touch-reveal')) {
      violations.push({
        file: relFile,
        line: 1,
        rule: 'group-hover tanpa kelas pendamping touch-reveal',
        detail: 'Elemen beraksi hanya pada hover tanpa padanan sentuh',
      });
    }
  }

  // 6. Hardcoded wide px (>= 360px) without max-w constraint
  if (relFile.endsWith('.tsx') && !allowWidePx.has(relFile)) {
    lines.forEach((line, idx) => {
      const mWide = line.match(/(?:w|min-w)-\[(\d+)px\]/g);
      if (mWide) {
        const large = mWide.filter((m) => {
          const num = parseInt(m.match(/\d+/)[0], 10);
          return num >= 360;
        });
        if (large.length > 0 && !line.includes('max-w-') && !content.includes('max-w-full')) {
          violations.push({
            file: relFile,
            line: idx + 1,
            rule: `Ukuran piksel tetap lebar (${large.join(', ')}) tanpa batas responsif max-w-*`,
            detail: line.trim(),
          });
        }
      }
    });
  }
}

console.log('------------------------------------------------------------');
console.log('SIAJAR Pemeriksaan Otomatis Responsif & Animasi (cek:responsif)');
console.log(`Berkas dipindai: ${files.length} berkas`);
console.log(`Allowlist aktif: sub-12px=${allowSub12.size}, tables=${allowTables.size}, wide-px=${allowWidePx.size}`);
console.log('------------------------------------------------------------');

if (violations.length > 0) {
  console.error(`\n❌ Ditemukan ${violations.length} pelanggaran responsif:\n`);
  for (const v of violations) {
    console.error(`- [${v.rule}] ${v.file}:${v.line}`);
    console.error(`  ${v.detail}\n`);
  }
  process.exit(1);
} else {
  console.log('✅ [Lolos] Seluruh berkas memenuhi standar fondasi responsif SIAJAR.');
  process.exit(0);
}
