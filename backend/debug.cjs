const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  page.on('response', async (res) => {
    if (res.url().includes('api')) {
      console.log('API RESPONSE:', res.url());
      try {
        console.log(await res.text());
      } catch(e) {}
    }
  });

  await page.goto('https://demo.inelabteamdev.com/product/981', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const overlay = document.querySelector('.cookie-overlay');
    if (overlay) overlay.remove();
  });
  await page.waitForTimeout(500);

  const blockLoc = page.locator('.price-block');
  await blockLoc.waitFor();
  await blockLoc.scrollIntoViewIfNeeded();
  
  const box = await blockLoc.boundingBox();
  
  await page.mouse.move(box.x + 10, box.y + 10);
  for (let i = 0; i < 20; i++) {
    await page.mouse.move(box.x + 10 + i * 2, box.y + 10 + i * 2);
    await page.waitForTimeout(50);
  }
  
  const revealBtn = page.locator('button[aria-label="Reveal price"]');
  await revealBtn.waitFor({ state: 'visible' });
  
  // Try to click multiple times if needed
  await revealBtn.click({ force: true });
  console.log("Clicked!");
  
  await page.waitForTimeout(5000);
  console.log('FINAL HTML:', await page.evaluate(() => document.querySelector('.price-block').innerHTML));
  await browser.close();
})();
