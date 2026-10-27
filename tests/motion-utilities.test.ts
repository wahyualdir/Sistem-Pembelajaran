import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Verifikasi Utilitas Animasi (Fase 5: 6.4 & 8.2)', () => {
  it('semua kelas animate-* yang dipakai di JSX terdefinisi tanpa ada yang hilang', () => {
    const root = process.cwd();

    // 1. Kumpulkan semua kelas animate-* yang terdefinisi
    const definedAnimations = new Set([
      // Tailwind core bawaan
      'animate-none',
      'animate-spin',
      'animate-ping',
      'animate-pulse',
      'animate-bounce',
      // tailwindcss-animate plugin
      'animate-in',
      'animate-out',
      // globals.css
      'animate-fade-up',
      'animate-uir-perspective',
      'animate-uir-perspective-shadow',
      'animate-uir-shine',
      'animate-sky-beacon',
      'animate-vt-marquee',
      // tailwind.config.ts custom animations (Fase 5: 6.4)
      'animate-fade-in',
      'animate-scale-in',
      'animate-scale-up',
      'animate-slide-in-right',
      'animate-slide-in-left',
      'animate-slide-up',
      'animate-bounce-short',
      'animate-shimmer',
      'animate-check-draw',
    ]);

    // Tambahan: baca langsung dari tailwind.config.ts jika tersedia
    const twPath = path.join(root, 'tailwind.config.ts');
    if (fs.existsSync(twPath)) {
      const twContent = fs.readFileSync(twPath, 'utf8');
      const animMatch = twContent.match(/animation:\s*{([^}]+)}/s);
      if (animMatch) {
        const lines = animMatch[1].split('\n');
        for (const line of lines) {
          const m = line.match(/["']([a-z0-9-]+)["']\s*:/);
          if (m) {
            definedAnimations.add(`animate-${m[1]}`);
          }
        }
      }
    }

    // 2. Telusuri seluruh berkas .tsx di src
    function walkDir(dir: string): string[] {
      let results: string[] = [];
      if (!fs.existsSync(dir)) return results;
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.next') {
            results = results.concat(walkDir(full));
          }
        } else if (file.endsWith('.tsx')) {
          results.push(full);
        }
      }
      return results;
    }

    const tsxFiles = walkDir(path.join(root, 'src'));
    const missingUsages: Array<{ file: string; line: number; animClass: string }> = [];

    const animRegex = /\banimate-([a-z0-9-]+)\b/g;

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((lineText, idx) => {
        let match;
        while ((match = animRegex.exec(lineText)) !== null) {
          const fullClass = match[0];
          // Abaikan arbitrary animation seperti animate-[...]
          if (!fullClass.includes('[') && !definedAnimations.has(fullClass)) {
            missingUsages.push({
              file: path.relative(root, file),
              line: idx + 1,
              animClass: fullClass,
            });
          }
        }
      });
    }

    expect(
      missingUsages,
      `Seluruh kelas animate-* di src/**/*.tsx harus terdefinisi di config atau CSS. Ditemukan ${missingUsages.length} tidak terdefinisi.`
    ).toHaveLength(0);
  });
});
