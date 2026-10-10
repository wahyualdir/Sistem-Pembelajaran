const { chromium } = require('playwright');
const fs = require('fs');

async function measure() {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: '1366x768 (viewport 650)', width: 1366, height: 650 },
    { name: '1280x720', width: 1280, height: 720 },
    { name: '1440x900', width: 1440, height: 900 },
    { name: '1920x1080', width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    await context.addCookies([
      { name: 'demo_session', value: '2024001', url: 'http://localhost:3000' },
      { name: 'active_role', value: 'STUDENT', url: 'http://localhost:3000' }
    ]);

    const page = await context.newPage();
    await page.goto('http://localhost:3000/student', { waitUntil: 'networkidle' });
    
    // Evaluate metrics
    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const headerRect = header ? header.getBoundingClientRect() : null;
      
      const sidebar = document.querySelector('aside');
      const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
      
      const sidebarHeader = sidebar ? sidebar.firstElementChild : null;
      const sidebarHeaderRect = sidebarHeader ? sidebarHeader.getBoundingClientRect() : null;
      
      // Brand text
      const brandContainer = sidebar ? sidebar.querySelector('a[title*="SIAJAR"]') : null;
      const brandSpans = brandContainer ? Array.from(brandContainer.querySelectorAll('span')) : [];
      const brandInfo = brandSpans.map(s => ({
        text: s.textContent.trim(),
        scrollWidth: s.scrollWidth,
        clientWidth: s.clientWidth,
        isTruncated: s.scrollWidth > s.clientWidth
      }));
      
      // Menu items
      const navLinks = sidebar ? Array.from(sidebar.querySelectorAll('nav a')) : [];
      const itemMetrics = navLinks.map(a => {
        const r = a.getBoundingClientRect();
        return {
          text: a.textContent.trim(),
          height: r.height,
          top: r.top,
          bottom: r.bottom
        };
      });
      
      // Check visible items within sidebar nav viewport without scroll
      const nav = sidebar ? sidebar.querySelector('nav') : null;
      const navRect = nav ? nav.getBoundingClientRect() : null;
      const visibleItems = navRect ? itemMetrics.filter(it => it.bottom <= navRect.bottom && it.top >= navRect.top) : [];
      
      // Buttons in header
      const headerButtons = header ? Array.from(header.querySelectorAll('button')).map(b => ({
        title: b.getAttribute('title') || b.getAttribute('aria-label'),
        classes: b.className,
        visible: b.offsetParent !== null,
        html: b.innerHTML.slice(0, 50)
      })) : [];

      // Check right panel / middle column ratio
      const mainContent = document.querySelector('main') || document.querySelector('.flex-1.p-4');
      const mainRect = mainContent ? mainContent.getBoundingClientRect() : null;

      // Check logout button in sidebar bottom
      const logoutBtn = sidebar ? sidebar.querySelector('.sidebar-compact-hide-logout button') : null;
      const isStandaloneLogoutVisible = logoutBtn ? logoutBtn.offsetParent !== null : false;

      // Check if horizontal scrollbar exists on page or body
      const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth;

      // Right panel
      const rightPanel = document.querySelector('aside.w-right-panel') || document.querySelector('.w-\\[var\\(--layout-right-panel-width\\)\\]') || document.querySelector('[data-panel="right"]');
      const rightRect = rightPanel ? rightPanel.getBoundingClientRect() : null;

      // Middle column width
      const middleColumn = document.querySelector('.flex-1.p-4') || document.querySelector('.flex-1.sm\\:p-5') || document.querySelector('.flex-1.pb-36') || document.querySelector('.flex-1.pb-40');
      const middleRect = middleColumn ? middleColumn.getBoundingClientRect() : null;

      return {
        url: window.location.pathname,
        headerHeight: headerRect ? headerRect.height : null,
        sidebarWidth: sidebarRect ? sidebarRect.width : null,
        sidebarHeaderHeight: sidebarHeaderRect ? sidebarHeaderRect.height : null,
        brandInfo,
        itemCount: itemMetrics.length,
        itemSampleHeight: itemMetrics[0] ? itemMetrics[0].height : null,
        visibleCount: visibleItems.length,
        visibleItemNames: visibleItems.map(i => i.text),
        headerButtons: headerButtons.filter(b => b.visible),
        isStandaloneLogoutVisible,
        hasHorizontalScroll,
        middleWidth: middleRect ? middleRect.width : null,
        middleRatio: middleRect ? (middleRect.width / window.innerWidth * 100).toFixed(1) + '%' : null,
        rightPanelWidth: rightRect ? rightRect.width : null,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      };
    });

    console.log(`=== VIEWPORT ${vp.name} ===`);
    console.log(JSON.stringify(metrics, null, 2));
    
    // Save screenshot
    await page.screenshot({ path: `scratch/after-${vp.width}x${vp.height}.png` });

    await context.close();
  }

  await browser.close();
}

measure().catch(console.error);
