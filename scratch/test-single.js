const { chromium } = require('playwright');

(async () => {
  console.log('1. Launching browser');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1
  });

  await context.addCookies([
    { name: 'demo_session', value: 'a0000001-0000-0000-0000-000000000001', domain: 'localhost', path: '/' },
    { name: 'active_role', value: 'STUDENT', domain: 'localhost', path: '/' },
  ]);

  console.log('2. Opening page');
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('3. Navigating to /student');
  await page.goto('http://localhost:3000/student', { waitUntil: 'commit' });
  console.log('4. Waiting for load event');
  await page.waitForLoadState('load');
  console.log('5. Waiting 2s');
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const sb = document.querySelector('aside');
    const rp = document.querySelector('aside[aria-label*="Panel Ringkasan"]');
    const center = document.querySelector('main > div > div.flex-1');
    const logo = document.querySelector('[title*="Logo 3D"]');
    return {
      window: { w: window.innerWidth, h: window.innerHeight },
      sb: sb ? sb.getBoundingClientRect().width : null,
      rp: rp ? rp.getBoundingClientRect().width : null,
      center: center ? center.getBoundingClientRect().width : null,
      centerPct: center ? ((center.getBoundingClientRect().width / window.innerWidth) * 100).toFixed(1) + '%' : null,
      logoH: logo ? logo.getBoundingClientRect().height : null,
      logoW: logo ? logo.getBoundingClientRect().width : null,
    };
  });
  console.log('6. RESULT:', JSON.stringify(data, null, 2));

  await page.screenshot({ path: 'scratch/screenshots/single-1366.png' });
  console.log('7. Screenshot saved');

  await browser.close();
})();
