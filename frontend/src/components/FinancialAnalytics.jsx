import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL;

export default function FinancialAnalytics() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/transactions/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics');
    }
    setLoading(false);
  };

  const getMetricColor = (value, type) => {
    if (type === 'netWorth') {
      return value >= 0 ? 'text-green-600' : 'text-red-600';
    }
    if (type === 'savingsRate') {
      return value >= 20 ? 'text-green-600' : value >= 10 ? 'text-yellow-600' : 'text-red-600';
    }
    return 'text-gray-800';
  };

  const getTrendIcon = (current, previous) => {
    if (!previous) return '→';
    const change = current - previous;
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '→';
  };

  if (!analytics) {
    return (
      <div className="bg-white p-6 rounded shadow w-full max-w-lg mb-8">
        <h3 className="text-xl font-bold mb-4">Financial Analytics</h3>
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-lg mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Financial Analytics</h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {loading && <div className="text-center text-blue-600 animate-pulse mb-4">Loading...</div>}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Income</div>
          <div className="text-2xl font-bold text-blue-600">
            ₹{analytics.metrics.income.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            ₹{analytics.metrics.expenses.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Net Worth</div>
          <div className={`text-2xl font-bold ${getMetricColor(analytics.metrics.netWorth, 'netWorth')}`}>
            ₹{analytics.metrics.netWorth.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Savings Rate</div>
          <div className={`text-2xl font-bold ${getMetricColor(analytics.metrics.savingsRate, 'savingsRate')}`}>
            {analytics.metrics.savingsRate}%
          </div>
        </div>
      </div>

      {/* Top Spending Categories */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Top Spending Categories</h4>
        <div className="space-y-2">
          {analytics.topSpendingCategories.map((category, index) => (
            <div key={category.category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                  {index + 1}
                </span>
                <span className="font-medium">{category.category}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{category.amount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">6-Month Trend</h4>
        <div className="space-y-2">
          {analytics.monthlyTrend.slice(-6).map((month, index) => (
            <div key={month.month} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{month.month}</span>
              <div className="text-right">
                <div className="text-sm">
                  <span className="text-green-600">+₹{month.income.toLocaleString()}</span>
                  <span className="mx-1">|</span>
                  <span className="text-red-600">-₹{month.expenses.toLocaleString()}</span>
                </div>
                <div className={`text-xs font-semibold ${getMetricColor(month.netWorth, 'netWorth')}`}>
                  Net: ₹{month.netWorth.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">💡 Financial Insights</h4>
        <div className="space-y-2 text-sm">
          {analytics.metrics.savingsRate >= 20 && (
            <div className="text-green-700">🎉 Excellent! You're saving more than 20% of your income.</div>
          )}
          {analytics.metrics.savingsRate < 10 && (
            <div className="text-yellow-700">⚠️ Consider increasing your savings rate to at least 10%.</div>
          )}
          {analytics.metrics.netWorth < 0 && (
            <div className="text-red-700">🚨 Your expenses exceed income. Review your spending habits.</div>
          )}
          {analytics.topSpendingCategories.length > 0 && (
            <div className="text-blue-700">
              💰 Your biggest expense is {analytics.topSpendingCategories[0].category} 
              ({analytics.topSpendingCategories[0].percentage.toFixed(1)}% of total).
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 