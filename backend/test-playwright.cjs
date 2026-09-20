const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://demo.inelabteamdev.com/', { waitUntil: 'domcontentloaded' });
  
  await page.evaluate(() => {
    const overlay = document.querySelector('.cookie-overlay');
    if (overlay) overlay.remove();
  });
  
  await page.waitForTimeout(500);
  await page.click('.tile-cta');
  await page.waitForURL('**/product/**', { timeout: 10000 });
  await page.waitForSelector('.price-block', { timeout: 10000 });
  
  const box = await page.locator('.price-block').boundingBox();
  
  // Wiggle mouse
  await page.mouse.move(box.x + 10, box.y + 10);
  for (let i = 0; i < 20; i++) {
    await page.mouse.move(box.x + 10 + i * 2, box.y + 10 + i * 2);
    await page.waitForTimeout(50);
  }
  
  // Now we should be able to click Reveal price
  console.log('Clicking Reveal Price...');
  await page.click('button[aria-label="Reveal price"]');
  
  // Wait for the price block to NOT be idle anymore or for the actual price to appear
  // The price is usually in a class like .price or .current-price, let's wait a bit
  await page.waitForTimeout(3000);
  
  const priceHTML = await page.evaluate(() => {
    const block = document.querySelector('.price-block');
    return block ? block.outerHTML : 'no block';
  });
  console.log('Final HTML:', priceHTML);
  
  await browser.close();
})();
