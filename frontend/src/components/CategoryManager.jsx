import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL;

export default function CategoryManager() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err) {
      setError('Failed to fetch categories.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`${API_URL}/categories`, { name, type }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Category added!');
      setName('');
      setType('expense');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add category.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-lg mb-8">
      <h3 className="text-xl font-bold mb-4">Manage Categories</h3>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name" className="border rounded px-3 py-2 flex-1" required />
        <select value={type} onChange={e => setType(e.target.value)} className="border rounded px-3 py-2">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" disabled={loading}>
          Add
        </button>
      </form>
      {error && <div className="mb-2 text-red-500">{error}</div>}
      {success && <div className="mb-2 text-green-600">{success}</div>}
      <div className="max-h-40 overflow-y-auto">
        <ul className="list-disc pl-5">
          {categories.map((cat, i) => (
            <li key={i} className="mb-1">
              <span className="capitalize font-medium">{cat.name}</span> <span className="text-xs text-gray-500">({cat.type})</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 