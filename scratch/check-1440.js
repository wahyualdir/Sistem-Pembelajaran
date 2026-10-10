const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  await context.addCookies([
    { name: 'demo_session', value: 'a0000001-0000-0000-0000-000000000001', domain: 'localhost', path: '/' },
    { name: 'active_role', value: 'STUDENT', domain: 'localhost', path: '/' },
  ]);

  const page = await context.newPage();
  await page.goto('http://localhost:3000/student', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    const rp = document.querySelector('aside[aria-label*="Panel Ringkasan"]');
    const logo = document.querySelector('[title*="Logo 3D"]');
    const sb = document.querySelector('aside');
    const header = document.querySelector('header');
    const menuItem = document.querySelector('nav a');
    const centerCol = document.querySelector('main > div > div.flex-1');
    return {
      window: { w: window.innerWidth, h: window.innerHeight },
      sidebar: sb ? sb.getBoundingClientRect() : null,
      rightPanel: rp ? rp.getBoundingClientRect() : null,
      centerCol: centerCol ? centerCol.getBoundingClientRect() : null,
      header: header ? header.getBoundingClientRect() : null,
      menuItem: menuItem ? menuItem.getBoundingClientRect() : null,
      logo: logo ? logo.getBoundingClientRect() : null,
      logoStyles: logo ? {
        height: window.getComputedStyle(logo).height,
        flexShrink: window.getComputedStyle(logo).flexShrink,
      } : null,
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
