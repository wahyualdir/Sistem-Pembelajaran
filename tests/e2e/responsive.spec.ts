import { test, expect } from '@playwright/test';
import path from 'path';

const VIEWPORTS = [
  { name: 'mobile-small', width: 360, height: 640 },
  { name: 'mobile-iphone-12', width: 390, height: 844 },
  { name: 'mobile-iphone-14-pro-max', width: 430, height: 932 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-ipad-air', width: 820, height: 1180 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop-hd', width: 1280, height: 720 },
  { name: 'laptop-standard', width: 1366, height: 768 },
  { name: 'laptop-widescreen', width: 1440, height: 900 },
  { name: 'desktop-fhd-scaled', width: 1536, height: 864 },
  { name: 'desktop-fhd', width: 1920, height: 1080 },
];

test.describe('SIAJAR Responsive & Scale Verification Across 11 Viewports', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.width}x${vp.height} (${vp.name}) - Login page checks`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      // 1. Assert: Tidak ada horizontal scroll pada body maupun document
      const hasHorizontalScroll = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth > window.innerWidth ||
          document.body.scrollWidth > window.innerWidth
        );
      });
      expect(hasHorizontalScroll, `Horizontal scroll terdeteksi di viewport ${vp.width}x${vp.height}`).toBe(false);

      // 2. Assert: Input font-size >= 16px di viewport < 768px (mencegah auto-zoom iOS)
      if (vp.width < 768) {
        const inputFontSizes = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])'));
          return inputs.map((inp) => parseFloat(window.getComputedStyle(inp).fontSize));
        });
        for (const fontSize of inputFontSizes) {
          expect(fontSize, `Input font-size di mobile harus >= 16px, ditemukan ${fontSize}px`).toBeGreaterThanOrEqual(15.9);
        }
      }

      // Ambil screenshot halaman login
      const screenshotPath = path.join(
        process.cwd(),
        'docs',
        'responsive-verification',
        `login-${vp.width}x${vp.height}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: false });
    });
  }

  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.width}x${vp.height} (${vp.name}) - Student Dashboard checks`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Login Mahasiswa
      await page.goto('/login');
      await page.fill('input#identifier', '2024001');
      await page.fill('input#password', 'Password123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/student', { timeout: 20000, waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      // 1. Assert: Tidak ada horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth > window.innerWidth ||
          document.body.scrollWidth > window.innerWidth
        );
      });
      expect(hasHorizontalScroll, `Horizontal scroll terdeteksi di /student pada ${vp.width}x${vp.height}`).toBe(false);

      // 2. Assert: Kolom tengah >= 60% lebar viewport di laptop (1366x768, 1440x900, 1536x864)
      if (vp.width === 1366 || vp.width === 1440 || vp.width === 1536) {
        const centerRatio = await page.evaluate(() => {
          const main = document.querySelector('main');
          return main ? main.getBoundingClientRect().width / window.innerWidth : 0;
        });
        expect(
          centerRatio,
          `Kolom tengah di viewport laptop ${vp.width}px harus >= 60% lebar, terukur ${(centerRatio * 100).toFixed(1)}%`
        ).toBeGreaterThanOrEqual(0.60);
      }

      // 3. Assert: Tidak ada teks di bawah 12px pada elemen berteks langsung
      const smallTextElements = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, label'));
        const tooSmall: { tag: string; text: string; size: number }[] = [];
        for (const el of all) {
          if (el.children.length > 0) continue; // Hanya leaf node teks murni
          const text = (el.textContent || '').trim();
          if (!text || text.length > 50) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
          const fs = parseFloat(style.fontSize);
          // Batas 11.5px (toleransi pembulatan subpixel peramban)
          if (fs > 0 && fs < 11.5) {
            tooSmall.push({ tag: el.tagName, text: text.substring(0, 25), size: fs });
          }
        }
        return tooSmall;
      });
      expect(smallTextElements, `Ditemukan elemen dengan teks di bawah 12px di /student (${vp.width}x${vp.height})`).toHaveLength(0);

      // 4. Assert: Touch target interaktif di pointer: coarse / mobile (<768px)
      if (vp.width < 768) {
        const smallTouchTargets = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('header button, .btn-solid, #ai-fab-button'));
          const failures: { id: string; w: number; h: number }[] = [];
          for (const btn of buttons) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              if (rect.width < 40 || rect.height < 40) {
                failures.push({
                  id: btn.id || btn.className.substring(0, 30),
                  w: Math.round(rect.width),
                  h: Math.round(rect.height),
                });
              }
            }
          }
          return failures;
        });
        expect(smallTouchTargets, `Touch target harus memadai di <768px`).toHaveLength(0);
      }

      // Screenshot hasil verifikasi
      const screenshotPath = path.join(
        process.cwd(),
        'docs',
        'responsive-verification',
        `student-${vp.width}x${vp.height}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: false });
    });
  }

  // Verifikasi Peran Dosen & Kaprodi di Viewport Kunci (390, 768, 1366, 1920)
  const KEY_VIEWPORTS = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'desktop', width: 1920, height: 1080 },
  ];

  for (const vp of KEY_VIEWPORTS) {
    test(`Viewport ${vp.width}x${vp.height} (${vp.name}) - Lecturer Dashboard checks`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto('/login');
      await page.fill('input#identifier', '0012345678');
      await page.fill('input#password', 'Password123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/lecturer', { timeout: 20000, waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');

      const hasHorizontalScroll = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth > window.innerWidth ||
          document.body.scrollWidth > window.innerWidth
        );
      });
      expect(hasHorizontalScroll, `Horizontal scroll terdeteksi di /lecturer pada ${vp.width}x${vp.height}`).toBe(false);

      if (vp.width === 1366) {
        const centerRatio = await page.evaluate(() => {
          const main = document.querySelector('main');
          return main ? main.getBoundingClientRect().width / window.innerWidth : 0;
        });
        expect(centerRatio).toBeGreaterThanOrEqual(0.60);
      }

      const screenshotPath = path.join(
        process.cwd(),
        'docs',
        'responsive-verification',
        `lecturer-${vp.width}x${vp.height}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: false });
    });
  }
});
