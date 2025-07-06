import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { useAuth } from '../hooks/useAuth';
import ReceiptUpload from '../components/ReceiptUpload';
import HistoryUpload from '../components/HistoryUpload';
import BudgetManager from '../components/BudgetManager';
import FinancialAnalytics from '../components/FinancialAnalytics';


const API_URL = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { if (!token) navigate('/login'); }, [token, navigate]);

  const fetchTransactions = async (pageNum = 1) => {
    setLoading(true); setError(null);
    try { const res = await axios.get(`${API_URL}/transactions`, { params: { page: pageNum, limit }, headers: { Authorization: `Bearer ${token}` } });
      setTransactions(res.data.transactions); setTotal(res.data.total); setPage(pageNum);
    } catch (err) { setError(err.response?.status === 401 ? 'Unauthorized. Please log in again.' : 'Failed to fetch transactions');
      if (err.response?.status === 401) logout();
    } setLoading(false);
  };

  useEffect(() => { if (token) fetchTransactions(page); }, []);

  const handleAdd = async (data) => {
    setLoading(true); setError(null);
    try { await axios.post(`${API_URL}/transactions`, data, { headers: { Authorization: `Bearer ${token}` } });
      fetchTransactions(1);
    } catch (err) { setError(err.response?.status === 401 ? 'Unauthorized. Please log in again.' : 'Failed to add transaction');
      if (err.response?.status === 401) logout();
    } setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true); setError(null);
    try { await axios.delete(`${API_URL}/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchTransactions(page);
    } catch (err) { setError(err.response?.status === 401 ? 'Unauthorized. Please log in again.' : 'Failed to delete transaction');
      if (err.response?.status === 401) logout();
    } setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-3 max-w-6xl mx-auto mt-4">
      <nav className="flex justify-between items-center mb-3">
        <div className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
          💸 Finance Assistant<span className="ml-1 text-xs md:text-sm text-gray-500">Welcome, {user?.name || user?.email}</span>
        </div>
        <button onClick={logout} className="bg-red-600 text-white px-3 py-1 md:py-2 rounded-lg hover:bg-red-700 transition text-sm md:text-base">Logout</button>
      </nav>
      {error && <div className="mb-2 text-red-500 text-center text-sm">{error}</div>}
      {loading && <div className="mb-2 text-blue-600 text-center animate-pulse text-sm">Loading...</div>}
      
      {/* Smart Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <FinancialAnalytics />
        <BudgetManager />
      </div>
      

      
      {/* Transaction Management */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="bg-gray-50 p-2 rounded-lg shadow-inner min-h-[220px]">
          <TransactionForm onAdd={handleAdd} loading={loading} />
        </div>
        <div className="bg-gray-50 p-2 rounded-lg shadow-inner min-h-[220px]">
          <ReceiptUpload />
        </div>
        <div className="bg-gray-50 p-2 rounded-lg shadow-inner min-h-[220px]">
          <HistoryUpload />
        </div>
      </div>
      <div className="bg-gray-50 p-2 rounded-lg shadow-inner w-full overflow-x-auto">
        <TransactionList transactions={transactions} page={page} total={total} limit={limit} onPageChange={fetchTransactions} onDelete={handleDelete} />
      </div>
    </div>
  );
}