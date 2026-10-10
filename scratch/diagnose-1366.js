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
  await page.waitForTimeout(2000);

  const diag = await page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    const rightPanel = document.querySelector('aside[aria-label="Panel Ringkasan & Detail"]');
    const centerCol = document.querySelector('main > div > div.flex-1');
    const header = document.querySelector('header');
    const menuItem = document.querySelector('nav a');
    const techLogo = document.querySelector('[title*="Logo 3D"]');
    const techLogoImg = document.querySelector('[title*="Logo 3D"] img');

    const rootFontSize = window.getComputedStyle(document.documentElement).fontSize;
    const bodyZoom = window.getComputedStyle(document.body).zoom;
    const htmlZoom = window.getComputedStyle(document.documentElement).zoom;

    const rightPanelStyle = rightPanel ? window.getComputedStyle(rightPanel) : null;
    const techLogoStyle = techLogo ? window.getComputedStyle(techLogo) : null;

    // Check banner title & deadline titles line count
    const bannerTitle = document.querySelector('h1, h2, h3');
    const categoryChips = Array.from(document.querySelectorAll('section[aria-label="Kategori Perkuliahan"] button')).map(b => b.textContent.trim());
    const categoryContainer = document.querySelector('section[aria-label="Kategori Perkuliahan"] div');

    return {
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      rootFontSize,
      bodyZoom,
      htmlZoom,
      sidebar: sidebar ? {
        computedWidth: window.getComputedStyle(sidebar).width,
        rectWidth: sidebar.getBoundingClientRect().width,
        classes: sidebar.className,
      } : null,
      rightPanel: rightPanel ? {
        computedWidth: window.getComputedStyle(rightPanel).width,
        rectWidth: rightPanel.getBoundingClientRect().width,
        classes: rightPanel.className,
        display: rightPanelStyle.display,
        flexDirection: rightPanelStyle.flexDirection,
        height: rightPanelStyle.height,
        maxHeight: rightPanelStyle.maxHeight,
        overflowY: rightPanelStyle.overflowY,
      } : null,
      centerCol: centerCol ? {
        computedWidth: window.getComputedStyle(centerCol).width,
        rectWidth: centerCol.getBoundingClientRect().width,
        pctOfWindow: ((centerCol.getBoundingClientRect().width / window.innerWidth) * 100).toFixed(1) + '%',
      } : null,
      header: header ? {
        computedHeight: window.getComputedStyle(header).height,
        rectHeight: header.getBoundingClientRect().height,
      } : null,
      menuItem: menuItem ? {
        computedHeight: window.getComputedStyle(menuItem).height,
        rectHeight: menuItem.getBoundingClientRect().height,
        fontSize: window.getComputedStyle(menuItem).fontSize,
        lineHeight: window.getComputedStyle(menuItem).lineHeight,
        padding: window.getComputedStyle(menuItem).padding,
      } : null,
      techLogo: techLogo ? {
        computedWidth: window.getComputedStyle(techLogo).width,
        computedHeight: window.getComputedStyle(techLogo).height,
        rectWidth: techLogo.getBoundingClientRect().width,
        rectHeight: techLogo.getBoundingClientRect().height,
        flexShrink: techLogoStyle.flexShrink,
        classes: techLogo.className,
      } : null,
      techLogoImg: techLogoImg ? {
        rectWidth: techLogoImg.getBoundingClientRect().width,
        rectHeight: techLogoImg.getBoundingClientRect().height,
      } : null,
      categoryChips,
      categoryContainerScrollable: categoryContainer ? categoryContainer.scrollWidth > categoryContainer.clientWidth : null,
      categoryContainerScrollWidth: categoryContainer ? categoryContainer.scrollWidth : null,
      categoryContainerClientWidth: categoryContainer ? categoryContainer.clientWidth : null,
    };
  });

  console.log('=== DIAGNOSIS 1366x768 ===');
  console.log(JSON.stringify(diag, null, 2));

  await browser.close();
})();
