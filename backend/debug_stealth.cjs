const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
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
  
  await page.waitForTimeout(5000);
  console.log('FINAL HTML:', await page.evaluate(() => document.querySelector('.price-block').innerHTML));
  await browser.close();
})();
