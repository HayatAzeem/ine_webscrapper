const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
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
  if (await revealBtn.isVisible() && !(await revealBtn.isDisabled())) {
    await revealBtn.click();
  }
  
  await page.waitForTimeout(4000);
  
  const content = await page.evaluate(() => document.querySelector('.price-block').innerHTML);
  console.log('FINAL HTML:', content);
  
  await browser.close();
})();
