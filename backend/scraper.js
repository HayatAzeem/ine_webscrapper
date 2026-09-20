import { chromium } from 'playwright';

export async function runScraper(products, db) {
  const isHeaded = process.env.HEADED === 'true';
  console.log(`Starting scrape for ${products.length} products (Headed: ${isHeaded})`);
  
  const browser = await chromium.launch({
    headless: !isHeaded,
    slowMo: isHeaded ? 50 : 0
  });

  try {
    const page = await browser.newPage();
    
    // Set headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    for (const product of products) {
      await scrapeProduct(page, product, db);
    }
  } catch (error) {
    console.error('Fatal Scraper Error:', error);
  } finally {
    await browser.close();
  }
}

async function scrapeProduct(page, product, db, maxRetries = 3) {
  let attempt = 0;
  let success = false;
  let price = null;
  let stock = null;
  let errorMessage = '';

  while (attempt < maxRetries && !success) {
    attempt++;
    console.log(`Scraping ${product.name} (Attempt ${attempt}/${maxRetries})...`);
    try {
      await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // 1. Remove cookie overlay (Anti-bot obstacle 1)
      await page.evaluate(() => {
        const overlay = document.querySelector('.cookie-overlay');
        if (overlay) overlay.remove();
      });
      await page.waitForTimeout(500);

      // 2. Wait for price block and scroll it into view!
      const blockLoc = page.locator('.price-block');
      await blockLoc.waitFor({ timeout: 15000 });
      await blockLoc.scrollIntoViewIfNeeded(); // VERY IMPORTANT for Render!
      // 3. Wiggle mouse to trigger "Reveal price" button enablement
      const box = await blockLoc.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 10, box.y + 10);
        for (let i = 0; i < 20; i++) {
          await page.mouse.move(box.x + 10 + i * 2, box.y + 10 + i * 2);
          await page.waitForTimeout(50);
        }
      }
      // 4. Click Reveal Price (Anti-bot obstacle 3)
      const revealBtn = page.locator('button[aria-label="Reveal price"]');
      if (await revealBtn.isVisible({ timeout: 5000 }) && !(await revealBtn.isDisabled())) {
        await revealBtn.click({ force: true });
      } else {
        console.log('Reveal button still disabled, continuing anyway...');
      }
      // Wait extra time for the anti-bot challenge to complete
      await page.waitForTimeout(4000);

      // 5. Wait for the actual price to load
      // Based on typical stores, it might load into a specific class. Let's wait for `.price-idle` to be removed.
      await page.waitForFunction(() => !document.querySelector('.price-idle'), { timeout: 15000 }).catch(() => {});
      
      // Extract price (usually in an element like .price, .current-price, etc.)
      // We will look for elements containing the currency symbol or specific classes
      const priceText = await page.evaluate(() => {
        // Try known typical selectors
        const priceEl = document.querySelector('.price, .current-price, .price-display, [data-testid="price"]');
        if (priceEl) return priceEl.innerText;
        
        // Fallback: look for text matching a price format inside price-block
        const block = document.querySelector('.price-block');
        if (block) {
          const match = block.innerText.match(/[$€£₹]\s*\d+(?:[.,]\d+)?/);
          if (match) return match[0];
        }
        return null;
      });

      if (!priceText) {
        throw new Error('Price element not found or could not extract price text.');
      }
      price = priceText;

      // Extract stock (optional)
      const stockText = await page.evaluate(() => {
        const stockEl = document.querySelector('.stock, .availability');
        if (stockEl) return stockEl.innerText;
        return 'In Stock'; // Default assumption if not explicitly shown
      });
      stock = stockText;

      success = true;
    } catch (error) {
      errorMessage = error.message;
      console.log(`Attempt ${attempt} failed:`, errorMessage);
      if (attempt < maxRetries) {
        await page.waitForTimeout(2000); 
      }
    }
  }

  // Record outcome
  const status = success ? (attempt > 1 ? 'retried' : 'success') : 'failed';
  
  if (success) {
    console.log(`Success: ${product.name} - ${price} / ${stock}`);
    await db.addPriceHistory(product.id, price.trim(), stock.trim());
  } else {
    console.log(`Failed permanently for ${product.name}`);
  }

  // Record log
  await db.addScrapeLog(product.id, status, success ? null : errorMessage);
}
