const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1
  });

  await context.addCookies([
    { name: 'demo_session', value: 'a0000001-0000-0000-0000-000000000001', domain: 'localhost', path: '/' },
    { name: 'active_role', value: 'STUDENT', domain: 'localhost', path: '/' },
  ]);

  const page = await context.newPage();
  await page.goto('http://localhost:3000/student', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Test with shrink-0 on tech logo first
  await page.evaluate(() => {
    const logo = document.querySelector('[title*="Logo 3D"]');
    if (logo) {
      logo.style.flexShrink = '0';
    }
  });

  const beforeScale = await page.evaluate(() => {
    const sb = document.querySelector('aside');
    const rp = document.querySelector('aside[aria-label*="Panel Ringkasan"]');
    const center = document.querySelector('main > div > div.flex-1');
    const logo = document.querySelector('[title*="Logo 3D"]');
    return {
      sbWidth: sb?.getBoundingClientRect().width,
      rpWidth: rp?.getBoundingClientRect().width,
      centerWidth: center?.getBoundingClientRect().width,
      centerPct: ((center?.getBoundingClientRect().width / window.innerWidth) * 100).toFixed(1) + '%',
      logoWidth: logo?.getBoundingClientRect().width,
      logoHeight: logo?.getBoundingClientRect().height,
    };
  });
  console.log('Before scale (with shrink-0):', beforeScale);

  // Now test with CSS variables vs CSS zoom
  // Let's test CSS variables approach:
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--layout-sidebar-width', '218px');
    document.documentElement.style.setProperty('--layout-right-panel-width', '330px');
    const sb = document.querySelector('aside');
    if (sb) {
      sb.style.width = '218px';
    }
  });

  const cssVarResult = await page.evaluate(() => {
    const sb = document.querySelector('aside');
    const rp = document.querySelector('aside[aria-label*="Panel Ringkasan"]');
    const center = document.querySelector('main > div > div.flex-1');
    const logo = document.querySelector('[title*="Logo 3D"]');
    return {
      sbWidth: sb?.getBoundingClientRect().width,
      rpWidth: rp?.getBoundingClientRect().width,
      centerWidth: center?.getBoundingClientRect().width,
      centerPct: ((center?.getBoundingClientRect().width / window.innerWidth) * 100).toFixed(1) + '%',
      logoWidth: logo?.getBoundingClientRect().width,
      logoHeight: logo?.getBoundingClientRect().height,
    };
  });
  console.log('With CSS Vars (218px / 330px):', cssVarResult);

  // Now test with CSS zoom on root:
  await page.evaluate(() => {
    document.documentElement.style.removeProperty('--layout-sidebar-width');
    document.documentElement.style.removeProperty('--layout-right-panel-width');
    const sb = document.querySelector('aside');
    if (sb) sb.style.width = '';
    // Apply zoom on a wrapper or body
    document.body.style.zoom = '0.69';
  });

  const zoomResult = await page.evaluate(() => {
    const sb = document.querySelector('aside');
    const rp = document.querySelector('aside[aria-label*="Panel Ringkasan"]');
    const center = document.querySelector('main > div > div.flex-1');
    const logo = document.querySelector('[title*="Logo 3D"]');
    return {
      sbWidth: sb?.getBoundingClientRect().width,
      rpWidth: rp?.getBoundingClientRect().width,
      centerWidth: center?.getBoundingClientRect().width,
      centerPct: ((center?.getBoundingClientRect().width / window.innerWidth) * 100).toFixed(1) + '%',
      logoWidth: logo?.getBoundingClientRect().width,
      logoHeight: logo?.getBoundingClientRect().height,
      windowInnerWidth: window.innerWidth,
    };
  });
  console.log('With body zoom 0.69:', zoomResult);

  await browser.close();
})();
