import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:3000/api';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [prodRes, histRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/products`), // fetching all and finding isn't ideal but works for small local DB
        fetch(`${API_URL}/products/${id}/history`),
        fetch(`${API_URL}/products/${id}/logs`)
      ]);
      
      const prods = await prodRes.json();
      setProduct(prods.find(p => p.id === id));
      
      const histData = await histRes.json();
      // Format history for chart
      setHistory(histData.map(h => ({
        ...h,
        displayDate: new Date(h.scraped_at).toLocaleString(),
        numericPrice: parseFloat(h.price.replace(/[^0-9.]/g, ''))
      })));
      
      setLogs(await logsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading product data...</div>;
  if (!product) return <div className="text-red-500">Product not found.</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <a href={product.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate block mt-1">
          {product.url}
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              Price History
            </h2>
            <div className="h-80">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{fontSize: 12}} 
                      tickFormatter={(val) => val.split(',')[0]} 
                    />
                    <YAxis 
                      tick={{fontSize: 12}} 
                      domain={['dataMin - 10', 'dataMax + 10']} 
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => [props.payload.price, 'Price']}
                      labelFormatter={(label) => `Scraped: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="numericPrice" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No price history available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-h-[500px] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" /> Scrape Logs
            </h2>
            <div className="space-y-4">
              {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="flex gap-3 text-sm p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="mt-0.5">
                    {log.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {log.status === 'retried' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                    {log.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{log.status}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(log.attempted_at).toLocaleString()}</p>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100 font-mono break-all">
                        {log.error_message}
                      </p>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-400 py-8">
                  No logs recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
