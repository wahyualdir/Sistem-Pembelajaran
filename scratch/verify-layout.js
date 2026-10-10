const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/ACER/.gemini/antigravity-ide/brain/02fc062c-80ca-4f09-ae13-a4477e633743');
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'verification-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });

    await context.addCookies([
      {
        name: 'demo_session',
        value: 'a0000001-0000-0000-0000-000000000001',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'active_role',
        value: 'STUDENT',
        domain: 'localhost',
        path: '/',
      },
    ]);

    const page = await context.newPage();
    await page.goto('http://localhost:3000/student', { waitUntil: 'networkidle' });
    // Beri waktu 2000ms agar kompilasi & hidrasi React selesai sempurna
    await page.waitForTimeout(2000);

    const metrics = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      const rightPanel = document.querySelector('aside[aria-label="Panel Ringkasan & Detail"]');
      const centerCol = document.querySelector('main > div > div.flex-1');
      const techLogo = document.querySelector('[title*="Logo 3D"]');
      const header = document.querySelector('header');
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;

      const sidebarW = sidebar ? Math.round(sidebar.getBoundingClientRect().width) : 0;
      const centerW = centerCol ? Math.round(centerCol.getBoundingClientRect().width) : 0;
      const rightPanelW = rightPanel ? Math.round(rightPanel.getBoundingClientRect().width) : 0;
      const isRightPanelVisible = rightPanel ? window.getComputedStyle(rightPanel).display !== 'none' : false;
      const contentAreaW = clientWidth - sidebarW;

      return {
        viewportW: clientWidth,
        sidebarWidth: sidebarW,
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
        rightPanelWidth: isRightPanelVisible ? rightPanelW : 0,
        rightPanelVisible: isRightPanelVisible,
        centerWidth: centerW,
        centerPctOfScreen: ((centerW / clientWidth) * 100).toFixed(1) + '%',
        centerPctOfContent: contentAreaW > 0 ? ((centerW / contentAreaW) * 100).toFixed(1) + '%' : null,
        isCenterGte720: centerW >= 720,
        isCenterGte60Pct: contentAreaW > 0 ? (centerW / contentAreaW) >= 0.60 : false,
        hasHorizontalScroll: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth,
        techLogoWidth: techLogo ? Math.round(techLogo.getBoundingClientRect().width) : null,
        techLogoHeight: techLogo ? Math.round(techLogo.getBoundingClientRect().height) : null,
      };
    });

    const screenshotPath = path.join(SCREENSHOT_DIR, `desktop-${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    results.push({
      viewport: vp.name,
      ...metrics,
      screenshot: screenshotPath,
    });

    await context.close();
  }

  // Pengujian Toggle Collapse Sidebar & Persistensi localStorage pada 1440x900
  const toggleContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await toggleContext.addCookies([
    { name: 'demo_session', value: 'a0000001-0000-0000-0000-000000000001', domain: 'localhost', path: '/' },
    { name: 'active_role', value: 'STUDENT', domain: 'localhost', path: '/' },
  ]);
  const togglePage = await toggleContext.newPage();
  await togglePage.goto('http://localhost:3000/student', { waitUntil: 'networkidle' });
  await togglePage.waitForTimeout(2000);

  const initialRailWidth = await togglePage.evaluate(() => Math.round(document.querySelector('aside').getBoundingClientRect().width));

  // Klik tombol expand untuk memperluas ke mode baseline penuh (315px)
  await togglePage.click('button[title*="Perluas bilah menu"]');
  await togglePage.waitForTimeout(600);

  const expandedWidth = await togglePage.evaluate(() => Math.round(document.querySelector('aside').getBoundingClientRect().width));
  const savedPreference = await togglePage.evaluate(() => localStorage.getItem('siajar_sidebar_collapsed'));

  const expandedScreenshot = path.join(SCREENSHOT_DIR, 'desktop-1440x900-expanded.png');
  await togglePage.screenshot({ path: expandedScreenshot });

  // Reload halaman untuk memastikan persistensi preferensi pengguna
  await togglePage.reload({ waitUntil: 'networkidle' });
  await togglePage.waitForTimeout(1000);
  const persistedExpandedWidth = await togglePage.evaluate(() => Math.round(document.querySelector('aside').getBoundingClientRect().width));

  // Pengujian Slide-over Drawer pada <1280px (1024x768) & Keyboard Esc
  const drawerContext = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await drawerContext.addCookies([
    { name: 'demo_session', value: 'a0000001-0000-0000-0000-000000000001', domain: 'localhost', path: '/' },
    { name: 'active_role', value: 'STUDENT', domain: 'localhost', path: '/' },
  ]);
  const drawerPage = await drawerContext.newPage();
  await drawerPage.goto('http://localhost:3000/student', { waitUntil: 'networkidle' });
  await drawerPage.waitForTimeout(1500);

  let drawerMetrics = null;
  const drawerBtn = await drawerPage.$('button[aria-label*="Panel Ringkasan"]');
  if (drawerBtn) {
    await drawerBtn.click();
    await drawerPage.waitForTimeout(600);

    drawerMetrics = await drawerPage.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-label="Panel Ringkasan & Detail"]');
      const drawerBox = dialog ? dialog.querySelector('div.bg-retro-bg') : null;
      const logo = dialog ? dialog.querySelector('[title*="Logo 3D"]') : null;
      return {
        isOpen: !!dialog,
        drawerWidth: drawerBox ? Math.round(drawerBox.getBoundingClientRect().width) : null,
        logoWidth: logo ? Math.round(logo.getBoundingClientRect().width) : null,
      };
    });

    const drawerScreenshot = path.join(SCREENSHOT_DIR, 'drawer-1024x768.png');
    await drawerPage.screenshot({ path: drawerScreenshot });

    // Tekan Esc untuk menutup drawer
    await drawerPage.keyboard.press('Escape');
    await drawerPage.waitForTimeout(500);
    const isClosed = await drawerPage.evaluate(() => !document.querySelector('[role="dialog"][aria-label="Panel Ringkasan & Detail"]'));
    drawerMetrics.closedWithEsc = isClosed;
  }

  await browser.close();

  console.log('=== OFFICIAL VERIFICATION SUMMARY ===');
  console.log(JSON.stringify({
    results,
    sidebarToggleAndPersistence: {
      initialRailWidth,
      expandedWidth,
      savedPreference,
      persistedExpandedWidth,
    },
    slideOverDrawerAndEsc: drawerMetrics,
  }, null, 2));
}

run().catch(console.error);
