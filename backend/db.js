import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase = null;
let localDb = {
  products: [],
  price_history: [],
  scrape_logs: []
};
const localDbPath = path.resolve('local-db.json');

// Initialize database
if (supabaseUrl && supabaseKey) {
  console.log('Using Supabase for database');
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.log('No Supabase keys found in .env, using local JSON fallback database');
  if (fs.existsSync(localDbPath)) {
    localDb = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  } else {
    // Add a dummy product for testing if empty
    localDb.products.push({
      id: crypto.randomUUID(),
      name: 'Basecamp AR Glasses X',
      url: 'https://demo.inelabteamdev.com/product/740',
      created_at: new Date().toISOString()
    });
    fs.writeFileSync(localDbPath, JSON.stringify(localDb, null, 2));
  }
}

function saveLocal() {
  if (!supabase) fs.writeFileSync(localDbPath, JSON.stringify(localDb, null, 2));
}

export async function getProducts() {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
  return localDb.products;
}

export async function addProduct(name, url) {
  if (supabase) {
    const { data, error } = await supabase.from('products').insert([{ name, url }]).select().single();
    if (error) throw error;
    return data;
  }
  const newProduct = { id: crypto.randomUUID(), name, url, created_at: new Date().toISOString() };
  localDb.products.push(newProduct);
  saveLocal();
  return newProduct;
}

export async function getPriceHistory(productId) {
  if (supabase) {
    const { data, error } = await supabase.from('price_history').select('*').eq('product_id', productId).order('scraped_at', { ascending: true });
    if (error) throw error;
    return data;
  }
  return localDb.price_history.filter(p => p.product_id === productId);
}

export async function getScrapeLogs(productId) {
  if (supabase) {
    const { data, error } = await supabase.from('scrape_logs').select('*').eq('product_id', productId).order('attempted_at', { ascending: false });
    if (error) throw error;
    return data;
  }
  return localDb.scrape_logs.filter(p => p.product_id === productId).sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at));
}

export async function addPriceHistory(productId, price, stock) {
  if (supabase) {
    await supabase.from('price_history').insert([{ product_id: productId, price, stock_status: stock }]);
    return;
  }
  localDb.price_history.push({
    id: crypto.randomUUID(),
    product_id: productId,
    price,
    stock_status: stock,
    scraped_at: new Date().toISOString()
  });
  saveLocal();
}

export async function addScrapeLog(productId, status, error_message) {
  if (supabase) {
    await supabase.from('scrape_logs').insert([{ product_id: productId, status, error_message }]);
    return;
  }
  localDb.scrape_logs.push({
    id: crypto.randomUUID(),
    product_id: productId,
    status,
    error_message,
    attempted_at: new Date().toISOString()
  });
  saveLocal();
}
