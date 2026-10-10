const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIEWPORTS = [
  { name: '1366x768', width: 1366, height: 768, zoom: 1.0 },
  { name: '1280x720', width: 1280, height: 720, zoom: 1.0 },
  { name: '1440x900', width: 1440, height: 900, zoom: 1.0 },
  { name: '1536x864', width: 1536, height: 864, zoom: 1.0 },
  { name: '1920x1080', width: 1920, height: 1080, zoom: 1.0 },
  { name: '1366_zoom90', width: 1366, height: 768, zoom: 0.9 },
  { name: '1366_zoom110', width: 1366, height: 768, zoom: 1.1 },
];

(async () => {
  const browser = await chromium.launch();
  const results = [];

  const outDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const vp of VIEWPORTS) {
    console.log(`Testing ${vp.name}...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });

    await context.addCookies([
      { name: 'demo_session', value: 'a0000001-0000-0000-0000-000000000001', domain: 'localhost', path: '/' },
      { name: 'active_role', value: 'STUDENT', domain: 'localhost', path: '/' },
    ]);

    const page = await context.newPage();
    await page.goto('http://localhost:3000/student', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('main', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Apply zoom if not 1.0
    if (vp.zoom !== 1.0) {
      await page.evaluate((z) => {
        document.body.style.zoom = z;
      }, vp.zoom);
      await page.waitForTimeout(500);
    }

    const metrics = await page.evaluate(() => {
      const sb = document.querySelector('aside');
      const rp = document.querySelector('aside[aria-label*="Panel Ringkasan"]');
      const center = document.querySelector('main > div > div.flex-1');
      const header = document.querySelector('header');
      const logo = document.querySelector('[title*="Logo 3D"]');
      const categoryContainer = document.querySelector('section[aria-label*="Kategori"] > div');
      const bannerTitle = document.querySelector('section[aria-label*="Banner"] h2');
      const deadlineTitle = document.querySelector('section[aria-label*="Tenggat"] h3');

      const windowW = window.innerWidth;
      const htmlScrollW = document.documentElement.scrollWidth;
      const hasHorizontalScroll = htmlScrollW > windowW + 2;

      const getLines = (el) => {
        if (!el) return 0;
        const lh = parseFloat(window.getComputedStyle(el).lineHeight) || 24;
        return Math.round(el.offsetHeight / lh);
      };

      return {
        windowInnerWidth: windowW,
        windowInnerHeight: window.innerHeight,
        hasHorizontalScroll,
        htmlScrollWidth: htmlScrollW,
        sidebar: sb ? {
          width: Math.round(sb.getBoundingClientRect().width),
          pct: ((sb.getBoundingClientRect().width / windowW) * 100).toFixed(1) + '%',
        } : null,
        rightPanel: rp ? {
          width: Math.round(rp.getBoundingClientRect().width),
          pct: ((rp.getBoundingClientRect().width / windowW) * 100).toFixed(1) + '%',
          display: window.getComputedStyle(rp).display,
        } : null,
        centerCol: center ? {
          width: Math.round(center.getBoundingClientRect().width),
          pct: ((center.getBoundingClientRect().width / windowW) * 100).toFixed(1) + '%',
        } : null,
        header: header ? {
          height: Math.round(header.getBoundingClientRect().height),
        } : null,
        techLogo: logo ? {
          width: Math.round(logo.getBoundingClientRect().width),
          height: Math.round(logo.getBoundingClientRect().height),
        } : null,
        categoryChips: {
          scrollWidth: categoryContainer ? categoryContainer.scrollWidth : 0,
          clientWidth: categoryContainer ? categoryContainer.clientWidth : 0,
          isOverflowing: categoryContainer ? categoryContainer.scrollWidth > categoryContainer.clientWidth : false,
        },
        bannerTitleLines: getLines(bannerTitle),
        deadlineTitleLines: getLines(deadlineTitle),
      };
    });

    // Save screenshot
    const shotPath = path.join(outDir, `${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    console.log(`Finished ${vp.name}: centerColPct=${metrics.centerCol?.pct}, logoHeight=${metrics.techLogo?.height}`);
    results.push({ viewport: vp.name, ...metrics, shotPath });
    await context.close();
  }

  console.log('=== TEST RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();
