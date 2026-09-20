import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag, RefreshCw, Search } from 'lucide-react';

const API_URL = 'http://localhost:3000/api'; // Update to Render URL in production

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/store/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackProduct = async (storeProduct) => {
    try {
      await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: storeProduct.name, 
          url: `https://demo.inelabteamdev.com/product/${storeProduct.id}` 
        })
      });
      setSearchQuery('');
      setSearchResults([]);
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

      {/* Search & Add */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Search & Track a New Product</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store by product name (e.g. 'Watch' or 'Doorbell')..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search Store'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-3 max-h-60 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50">
            {searchResults.map(result => (
              <div key={result.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm border border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">{result.name}</p>
                  <p className="text-sm text-gray-500">{result.category} • {result.brand}</p>
                </div>
                <button 
                  onClick={() => handleTrackProduct(result)}
                  className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" /> Track
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Link 
            key={product.id} 
            to={`/product/${product.id}`}
            className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all flex flex-col"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
            <p className="text-sm text-gray-500 truncate mt-auto pt-2">{product.url}</p>
          </Link>
        ))}
        {products.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No products tracked yet. Search and track one above!
          </div>
        )}
      </div>
    </div>
  );
}
