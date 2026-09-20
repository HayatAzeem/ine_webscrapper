import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag, RefreshCw } from 'lucide-react';

const API_URL = 'https://ine-webscrapper.onrender.com/api';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !url) return;
    try {
      await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url })
      });
      setName('');
      setUrl('');
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleScrapeNow = async () => {
    setIsScraping(true);
    try {
      await fetch(`${API_URL}/scrape`, { method: 'POST' });
      alert('Scrape triggered in background. Wait a moment and refresh product pages.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsScraping(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading products...</div>;

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tracked Products</h1>
          <p className="text-gray-600">Monitor pricing and stock history over time.</p>
        </div>
        <button 
          onClick={handleScrapeNow}
          disabled={isScraping}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
          {isScraping ? 'Scraping...' : 'Trigger Scrape'}
        </button>
      </div>

      {/* Add Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Track a New Product</h2>
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-gray-700">Product Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basecamp AR Glasses X"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-gray-700">Store URL</label>
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://demo.inelabteamdev.com/product/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button 
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors h-[42px]"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Link 
            key={product.id} 
            to={`/product/${product.id}`}
            className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
            <p className="text-sm text-gray-500 truncate">{product.url}</p>
          </Link>
        ))}
        {products.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No products tracked yet. Add one above!
          </div>
        )}
      </div>
    </div>
  );
}
