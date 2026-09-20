import https from 'https';

let catalogCache = null;
let catalogCacheTime = 0;

function fetchPage(page) {
  return new Promise((resolve, reject) => {
    https.get(`https://demo.inelabteamdev.com/api/catalog?page=${page}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

export async function getFullCatalog() {
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour
  if (catalogCache && Date.now() - catalogCacheTime < CACHE_TTL) {
    return catalogCache;
  }

  console.log('Fetching full catalog from mock store...');
  const firstPage = await fetchPage(1);
  const totalPages = firstPage.pages || 50;
  
  let allItems = [...firstPage.items];
  
  // Fetch remaining pages in parallel batches
  const fetchPromises = [];
  for (let i = 2; i <= totalPages; i++) {
    fetchPromises.push(fetchPage(i));
  }
  
  const results = await Promise.all(fetchPromises);
  results.forEach(res => {
    if (res && res.items) {
      allItems.push(...res.items);
    }
  });
  
  // Deduplicate by ID just in case the mock API returned random duplicates across pages
  const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
  
  catalogCache = uniqueItems;
  catalogCacheTime = Date.now();
  console.log(`Cached ${catalogCache.length} products.`);
  return catalogCache;
}

export async function searchCatalog(query) {
  const catalog = await getFullCatalog();
  if (!query) return catalog.slice(0, 50); // return first 50 if no query
  
  const q = query.toLowerCase();
  return catalog.filter(item => 
    item.name.toLowerCase().includes(q) || 
    item.brand.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q)
  ).slice(0, 50); // limit to 50 results
}
