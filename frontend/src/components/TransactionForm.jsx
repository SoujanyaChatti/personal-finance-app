import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL;

const initialState = {
  type: 'expense',
  amount: '',
  category: '',
  date: '',
  description: '',
};

export default function TransactionForm({ onAdd, loading }) {
  const { token } = useAuth();
  const [form, setForm] = useState(initialState);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await axios.get(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } });
        setCategories(res.data);
      } catch {
        setCategories([]);
      }
    }
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.category || !form.date) return;
    onAdd(form);
    setForm(initialState);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-3 rounded shadow w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <select name="type" value={form.type} onChange={handleChange} className="border rounded px-2 py-1 w-full">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} placeholder="Amount" className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <select name="category" value={form.category} onChange={handleChange} className="border rounded px-2 py-1 w-full" required>
          <option value="">Select category</option>
          {categories.filter(c => c.type === form.type).map((cat, i) => (
            <option key={i} value={cat.name}>{cat.name}</option>
          ))}
          <option value={form.category}>{form.category && !categories.some(c => c.name === form.category) ? `Custom: ${form.category}` : ''}</option>
        </select>
        <input name="date" type="date" value={form.date} onChange={handleChange} className="border rounded px-2 py-1 w-full" required />
      </div>
      <div className="mb-2">
        <input name="description" value={form.description} onChange={handleChange} placeholder="Description (optional)" className="border rounded px-2 py-1 w-full" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition w-full" disabled={loading}>
        {loading ? 'Adding...' : 'Add Transaction'}
      </button>
    </form>
  );
}