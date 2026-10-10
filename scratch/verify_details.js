const { chromium } = require('playwright');
const fs = require('fs');

async function verifyDetails() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([
    { name: 'demo_session', value: '2024001', url: 'http://localhost:3000' },
    { name: 'active_role', value: 'STUDENT', url: 'http://localhost:3000' }
  ]);
  const page = await context.newPage();
  await page.goto('http://localhost:3000/student', { waitUntil: 'networkidle' });

  // 1. Tech logo card screenshot
  const techLogo = await page.$('.relative.group.cursor-pointer.select-none');
  if (techLogo) {
    await techLogo.screenshot({ path: 'scratch/tech-logo-after-1440.png' });
    console.log('Saved tech logo screenshot');
  }

  // 2. Status Akademik card check
  const statusCard = await page.$('.bg-retro-warm.flex.flex-wrap');
  if (statusCard) {
    const box = await statusCard.boundingBox();
    console.log('Status Akademik card bounding box:', box);
    await statusCard.screenshot({ path: 'scratch/status-card-after.png' });
  }

  // 3. Right panel bottom check
  const rightAside = await page.$('aside.w-right-panel');
  if (rightAside) {
    await rightAside.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(300);
    const bottomCard = await rightAside.$('.space-y-4 > div:last-child');
    const bottomBox = bottomCard ? await bottomCard.boundingBox() : null;
    const aiBtn = await page.$('button[aria-label="Buka Asisten AI SIAJAR"]');
    const aiBox = aiBtn ? await aiBtn.boundingBox() : null;
    console.log('Right panel bottom card box:', bottomBox);
    console.log('AI Button box:', aiBox);
    if (bottomBox && aiBox) {
      console.log('Clearance margin (AI Button Y - Content Bottom Y):', aiBox.y - (bottomBox.y + bottomBox.height));
    }
  }

  await browser.close();
}

verifyDetails().catch(console.error);
