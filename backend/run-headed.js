import dotenv from 'dotenv';
import * as db from './db.js';
import { runScraper } from './scraper.js';

dotenv.config();

async function main() {
  process.env.HEADED = 'true';
  console.log('Running scraper in headed mode...');
  
  try {
    const products = await db.getProducts();
    if (!products || products.length === 0) {
      console.log("No products to scrape. Add a product to the database first.");
      process.exit(0);
    }
    
    await runScraper(products, db);
  } catch (error) {
    console.error("Scrape failed:", error);
  }
}

main();
