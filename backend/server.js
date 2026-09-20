import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as db from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and URL are required' });
    const product = await db.addProduct(name, url);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id/history', async (req, res) => {
  try {
    const history = await db.getPriceHistory(req.params.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id/logs', async (req, res) => {
  try {
    const logs = await db.getScrapeLogs(req.params.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger Scrape manually or via cron
app.post('/api/scrape', async (req, res) => {
  // Return early for cron, scraping is slow
  res.json({ message: 'Scrape started in background' });
  
  try {
    const products = await db.getProducts();
    if (products && products.length > 0) {
      // Import dynamically to avoid loading playwright immediately
      const { runScraper } = await import('./scraper.js');
      await runScraper(products, db);
    }
  } catch (error) {
    console.error('Error during scheduled scrape:', error);
  }
});

app.listen(port, () => {
  console.log(`Backend Server listening on port ${port}`);
});
