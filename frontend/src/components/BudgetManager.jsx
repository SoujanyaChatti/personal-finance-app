import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL;

export default function BudgetManager() {
  const { token } = useAuth();
  const [budget, setBudget] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBudget();
    fetchAnalytics();
  }, []);

  const fetchBudget = async () => {
    try {
      const res = await axios.get(`${API_URL}/budgets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudget(res.data);
    } catch (err) {
      setError('Failed to fetch budget');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/budgets/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch budget analytics');
    }
  };

  const handleUpdateBudget = async (updatedBudget) => {
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/budgets`, updatedBudget, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudget(res.data);
      setEditing(false);
      fetchAnalytics();
    } catch (err) {
      setError('Failed to update budget');
    }
    setLoading(false);
  };

  const updateCategoryLimit = (categoryName, newLimit) => {
    if (!budget) return;
    
    const updatedCategories = budget.categories.map(cat =>
      cat.name === categoryName ? { ...cat, limit: parseFloat(newLimit) } : cat
    );
    
    const totalBudget = updatedCategories.reduce((sum, cat) => sum + cat.limit, 0);
    setBudget({ ...budget, categories: updatedCategories, totalBudget });
  };

  const getProgressColor = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!budget) {
    return (
      <div className="bg-white p-6 rounded shadow w-full max-w-lg mb-8">
        <h3 className="text-xl font-bold mb-4">Budget Manager</h3>
        <div className="text-gray-500">Loading budget...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-lg mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Budget Manager</h3>
        <button
          onClick={() => setEditing(!editing)}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-sm"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

      {/* Budget Overview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Total Budget</span>
          <span className="text-lg font-bold">₹{budget.totalBudget.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">Total Spent</span>
          <span className="text-lg font-bold">₹{budget.totalSpent.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Remaining</span>
          <span className={`text-lg font-bold ${budget.totalBudget - budget.totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{(budget.totalBudget - budget.totalSpent).toLocaleString()}
          </span>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round((budget.totalSpent / budget.totalBudget) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(budget.totalSpent, budget.totalBudget)}`}
              style={{ width: `${Math.min((budget.totalSpent / budget.totalBudget) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="space-y-4">
        {budget.categories.map((category) => (
          <div key={category.name} className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{category.name}</span>
              <div className="text-right">
                {editing ? (
                  <input
                    type="number"
                    value={category.limit}
                    onChange={(e) => updateCategoryLimit(category.name, e.target.value)}
                    className="w-20 border rounded px-2 py-1 text-sm"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  <span className="text-sm">
                    ₹{category.spent.toLocaleString()} / ₹{category.limit.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Category Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{Math.round((category.spent / category.limit) * 100)}%</span>
                <span>{category.spent > category.limit ? 'Overspent!' : 'On track'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(category.spent, category.limit)}`}
                  style={{ width: `${Math.min((category.spent / category.limit) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Insights */}
      {analytics && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Budget Insights</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-semibold ${analytics.budgetStatus === 'On Track' ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.budgetStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Savings Rate:</span>
              <span className="font-semibold">{analytics.savingsRate}%</span>
            </div>
            {analytics.recommendations.length > 0 && (
              <div className="mt-3">
                <span className="font-semibold">Recommendations:</span>
                <ul className="mt-1 space-y-1">
                  {analytics.recommendations.map((rec, index) => (
                    <li key={index} className="text-xs text-gray-600">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      {editing && (
        <div className="mt-4">
          <button
            onClick={() => handleUpdateBudget(budget)}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:bg-green-400"
          >
            {loading ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      )}
    </div>
  );
} 