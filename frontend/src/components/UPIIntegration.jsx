import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL;

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', color: '#4285F4', icon: '📱' },
  { id: 'phonepe', name: 'PhonePe', color: '#5F259F', icon: '📱' },
  { id: 'paytm', name: 'Paytm', color: '#00BAF2', icon: '📱' },
  { id: 'bhim', name: 'BHIM', color: '#FF6B35', icon: '📱' },
  { id: 'other', name: 'Other', color: '#6B7280', icon: '📱' }
];

export default function UPIIntegration() {
  const { token } = useAuth();
  const [upiId, setUpiId] = useState('');
  const [selectedApp, setSelectedApp] = useState('gpay');
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchConnections();
    fetchUPITransactions();
    fetchAnalytics();
  }, []);

  const fetchUPITransactions = async () => {
    try {
      const res = await axios.get(`${API_URL}/upi/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error('Failed to fetch UPI transactions');
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await axios.get(`${API_URL}/upi/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(res.data);
    } catch (err) {
      console.error('Failed to fetch UPI connections');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/upi/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch UPI analytics');
    }
  };

  const handleSync = async (e) => {
    e.preventDefault();
    if (!upiId.trim()) {
      setError('Please enter your UPI ID');
      return;
    }

    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(`${API_URL}/upi/sync`, {
        upiId: upiId.trim(),
        upiApp: selectedApp
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Successfully synced ${res.data.count} transactions!`);
      fetchUPITransactions();
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync UPI transactions');
    }

    setSyncing(false);
  };

  const handleImport = async (transactionIds) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/upi/import`, {
        transactionIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Successfully imported ${res.data.count} transactions!`);
      fetchUPITransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import transactions');
    }
    setLoading(false);
  };

  const handleCategoryUpdate = async (transactionId, newCategory) => {
    try {
      await axios.put(`${API_URL}/upi/transactions/${transactionId}/category`, {
        category: newCategory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchUPITransactions();
    } catch (err) {
      setError('Failed to update category');
    }
  };

  const handleConnectUPI = async (upiApp) => {
    setConnecting(true);
    setError(null);
    
    try {
      const res = await axios.get(`${API_URL}/upi/oauth/${upiApp}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Open OAuth URL in new window
      const oauthWindow = window.open(
        res.data.oauthUrl,
        'UPI OAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      // Listen for OAuth callback
      const checkClosed = setInterval(() => {
        if (oauthWindow.closed) {
          clearInterval(checkClosed);
          fetchConnections();
          setConnecting(false);
        }
      }, 1000);
      
      // Listen for postMessage from OAuth callback
      const handleMessage = (event) => {
        if (event.data.type === 'UPI_CONNECTED') {
          setSuccess(`Successfully connected ${getAppName(event.data.upiApp)}!`);
          fetchConnections();
          setConnecting(false);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Cleanup
      return () => {
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);
      };
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate OAuth connection');
      setConnecting(false);
    }
  };

  const handleDisconnectUPI = async (upiApp) => {
    try {
      await axios.delete(`${API_URL}/upi/connections/${upiApp}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`Successfully disconnected ${getAppName(upiApp)}`);
      fetchConnections();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect UPI app');
    }
  };

  const getAppColor = (appId) => {
    const app = UPI_APPS.find(a => a.id === appId);
    return app ? app.color : '#6B7280';
  };

  const getAppName = (appId) => {
    const app = UPI_APPS.find(a => a.id === appId);
    return app ? app.name : 'Other';
  };

  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-4xl mb-8">
      <h3 className="text-xl font-bold mb-4">🔗 UPI Integration</h3>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      {/* UPI Connections */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold mb-3">🔗 Connected UPI Apps</h4>
        
        {connections.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">No UPI apps connected yet. Connect your UPI apps to automatically sync transactions.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {UPI_APPS.slice(0, 4).map(app => (
                <button
                  key={app.id}
                  onClick={() => handleConnectUPI(app.id)}
                  disabled={connecting}
                  className="flex flex-col items-center p-3 bg-white rounded-lg border hover:shadow-md transition disabled:opacity-50"
                >
                  <span className="text-2xl mb-1">{app.icon}</span>
                  <span className="text-sm font-medium">{app.name}</span>
                  <span className="text-xs text-gray-500">Connect</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(connection => (
              <div key={connection.upiApp} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: getAppColor(connection.upiApp) }}
                  >
                    {UPI_APPS.find(a => a.id === connection.upiApp)?.icon || '📱'}
                  </div>
                  <div>
                    <div className="font-medium">{getAppName(connection.upiApp)}</div>
                    <div className="text-sm text-gray-600">
                      {connection.upiId} • {connection.bankName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last sync: {connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${connection.isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {connection.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  <button
                    onClick={() => handleDisconnectUPI(connection.upiApp)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UPI Sync Form */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-3">Sync UPI Transactions</h4>
        <form onSubmit={handleSync} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">UPI App</label>
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {UPI_APPS.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.icon} {app.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {syncing ? 'Syncing...' : 'Sync Transactions'}
          </button>
        </form>
      </div>

      {/* UPI Analytics */}
      {analytics && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Transactions</div>
            <div className="text-2xl font-bold text-green-600">{analytics.totalTransactions}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-2xl font-bold text-blue-600">₹{analytics.totalAmount.toLocaleString()}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Credits</div>
            <div className="text-2xl font-bold text-purple-600">{analytics.byType.credit}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Debits</div>
            <div className="text-2xl font-bold text-red-600">{analytics.byType.debit}</div>
          </div>
        </div>
      )}

      {/* UPI Transactions List */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">UPI Transactions</h4>
          {transactions.length > 0 && (
            <button
              onClick={() => handleImport(transactions.filter(t => !t.isImported).map(t => t.transactionId))}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition text-sm disabled:bg-green-400"
            >
              {loading ? 'Importing...' : 'Import All'}
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No UPI transactions found. Sync your UPI app to get started!
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactions.map((tx) => (
              <div key={tx.transactionId} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{tx.merchantName}</span>
                      <span 
                        className="text-xs px-2 py-1 rounded text-white"
                        style={{ backgroundColor: getAppColor(tx.upiApp) }}
                      >
                        {getAppName(tx.upiApp)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{tx.description}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString()} at {new Date(tx.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </div>
                    <select
                      value={tx.category}
                      onChange={(e) => handleCategoryUpdate(tx.transactionId, e.target.value)}
                      className="text-xs border rounded px-1 py-1 mt-1"
                    >
                      <option value="Groceries">Groceries</option>
                      <option value="Dining">Dining</option>
                      <option value="Transport">Transport</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                {tx.isImported && (
                  <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✓ Imported to main transactions
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Merchants */}
      {analytics?.topMerchants && Object.keys(analytics.topMerchants).length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Top Merchants</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(analytics.topMerchants).map(([merchant, count]) => (
              <div key={merchant} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{merchant}</span>
                  <span className="text-sm text-gray-600">{count} transactions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPI App Usage */}
      {analytics?.byApp && Object.keys(analytics.byApp).length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">UPI App Usage</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(analytics.byApp).map(([app, count]) => (
              <div key={app} className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{getAppName(app)}</span>
                  <span className="text-sm text-gray-600">{count} transactions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 