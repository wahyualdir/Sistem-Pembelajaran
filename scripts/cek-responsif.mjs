import fs from 'fs';
import path from 'path';

const root = process.cwd();

// Load allowlist
const allowlistPath = path.join(root, 'scripts', 'cek-responsif.allowlist.json');
let allowlist = {};
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

const definedAnims = new Set([
  'animate-none', 'animate-spin', 'animate-ping', 'animate-pulse', 'animate-bounce',
  'animate-in', 'animate-out', 'animate-fade-up',
  'animate-fade-in', 'animate-scale-in', 'animate-scale-up',
  'animate-slide-in-right', 'animate-slide-in-left', 'animate-slide-up',
  'animate-bounce-short', 'animate-shimmer', 'animate-check-draw',
  'animate-uir-perspective', 'animate-uir-perspective-shadow', 'animate-uir-shine',
  'animate-sky-beacon', 'animate-vt-marquee'
]);

for (const relFile of files) {
  const absPath = path.join(root, relFile);
  const content = fs.readFileSync(absPath, 'utf8');
  const lines = content.split(/\r?\n/);

  // 1. Unreplaced 100vh / h-screen / min-h-screen
  if ((relFile.endsWith('.tsx') || relFile.endsWith('.css')) && !allowUnreplacedVh.has(relFile)) {
    lines.forEach((line, idx) => {
      if (
        (/\b100vh\b/.test(line) && !line.includes('100dvh') && !line.includes('100svh') && !line.includes('calc(100vh')) ||
        (/\b(?:min-)?h-screen\b/.test(line) && !line.includes('min-h-[100dvh]') && !line.includes('min-h-[100svh]'))
      ) {
        violations.push({
          file: relFile,
          line: idx + 1,
          rule: 'Penggunaan 100vh atau h-screen tanpa pasangan dvh/svh',
          detail: line.trim(),
        });
      }
    });
  }

  // 2. Unwrapped table elements
  if (relFile.endsWith('.tsx') && !allowTables.has(relFile)) {
    lines.forEach((line, idx) => {
      if (/<(?:table|Table)\b/.test(line)) {
        // <Table> from @/components/ui/table has its own built-in overflow-x-auto container
        const isUiTableComponent = /<Table\b/.test(line) && (content.includes('@/components/ui/table') || relFile.includes('components/ui/table'));
        const precedingLines = lines.slice(Math.max(0, idx - 10), idx);
        const hasScrollWrapper =
          isUiTableComponent ||
          precedingLines.some((l) => l.includes('overflow-x') || l.includes('table-scroll') || l.includes('ResponsiveTable')) ||
          line.includes('ResponsiveTable') ||
          content.includes('ResponsiveTable');

        if (!hasScrollWrapper) {
          violations.push({
            file: relFile,
            line: idx + 1,
            rule: 'Elemen <table atau <Table tanpa pembungkus scroll',
            detail: line.trim(),
          });
        }
      }
    });
  }

  // 3. User scaling restrictions
  if (!allowZoom.has(relFile)) {
    lines.forEach((line, idx) => {
      if (/(?:maximum-scale|user-scalable\s*=\s*no|userScalable:\s*false)/.test(line)) {
        violations.push({
          file: relFile,
          line: idx + 1,
          rule: 'Pembatasan zoom pengguna (user-scalable=no atau maximum-scale)',
          detail: line.trim(),
        });
      }
    });
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
        const isTableInScroll = (line.includes('<table') || line.includes('caption-bottom')) && (content.includes('overflow-x') || content.includes('table-scroll'));
        if (large.length > 0 && !line.includes('max-w-') && !content.includes('max-w-full') && !isTableInScroll) {
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

  // 7. Undefined animate-* classes (Fase 5: 6.4 & 8.1)
  if (relFile.endsWith('.tsx')) {
    lines.forEach((line, idx) => {
      const animMatches = line.match(/\banimate-([a-z0-9-]+)\b/g);
      if (animMatches) {
        for (const m of animMatches) {
          if (!m.includes('[') && !definedAnims.has(m)) {
            violations.push({
              file: relFile,
              line: idx + 1,
              rule: `Kelas animasi tidak terdefinisi (${m})`,
              detail: line.trim(),
            });
          }
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
  console.log('✅ [Lolos] Seluruh berkas memenuhi standar fondasi responsif & animasi SIAJAR.');
  process.exit(0);
}
