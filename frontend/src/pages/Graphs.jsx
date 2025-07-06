import { useState, useEffect } from 'react';
import { Pie, Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement);

export default function Graphs() {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchTransactions();
    fetchAnalytics();
  }, [period]);

  const fetchTransactions = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/transactions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then(res => setTransactions(res.data.transactions || []))
      .catch(err => console.error('Failed to fetch transactions:', err));
  };

  const fetchAnalytics = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/transactions/analytics?period=${period}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then(res => setAnalytics(res.data))
      .catch(err => console.error('Failed to fetch analytics:', err));
  };

  const expenses = transactions.filter(t => t.type === 'expense');
  const byCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  const pieData = {
    labels: Object.keys(byCategory),
    datasets: [
      {
        data: Object.values(byCategory),
        backgroundColor: [
          '#4C51BF', '#ED8936', '#48BB78', '#F6AD55', '#9F7AEA',
          '#F687B6', '#63B3ED', '#FCD34D', '#34D399', '#F472B6',
        ],
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  };

  const byDate = {};
  expenses.forEach(t => {
    const d = new Date(t.date).toLocaleDateString('en-GB');
    byDate[d] = (byDate[d] || 0) + t.amount;
  });
  const lineData = {
    labels: Object.keys(byDate).sort(),
    datasets: [
      {
        label: 'Expenses Over Time',
        data: Object.values(byDate),
        fill: false,
        borderColor: '#ED8936',
        backgroundColor: '#ED8936',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Income vs Expenses Bar Chart
  const income = transactions.filter(t => t.type === 'income');
  const incomeByDate = {};
  income.forEach(t => {
    const d = new Date(t.date).toLocaleDateString('en-GB');
    incomeByDate[d] = (incomeByDate[d] || 0) + t.amount;
  });

  const barData = {
    labels: Object.keys(byDate).sort(),
    datasets: [
      {
        label: 'Income',
        data: Object.keys(byDate).sort().map(date => incomeByDate[date] || 0),
        backgroundColor: '#48BB78',
        borderColor: '#48BB78',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: Object.values(byDate),
        backgroundColor: '#F56565',
        borderColor: '#F56565',
        borderWidth: 1,
      },
    ],
  };

  // Monthly Trend Chart
  const monthlyData = analytics?.monthlyTrend || [];
  const trendData = {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map(m => m.income),
        borderColor: '#48BB78',
        backgroundColor: 'rgba(72, 187, 120, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Expenses',
        data: monthlyData.map(m => m.expenses),
        borderColor: '#F56565',
        backgroundColor: 'rgba(245, 101, 101, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Net Worth',
        data: monthlyData.map(m => m.netWorth),
        borderColor: '#4299E1',
        backgroundColor: 'rgba(66, 153, 225, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Savings Rate Doughnut
  const savingsRate = analytics?.metrics?.savingsRate || 0;
  const doughnutData = {
    labels: ['Saved', 'Spent'],
    datasets: [
      {
        data: [savingsRate, 100 - savingsRate],
        backgroundColor: ['#48BB78', '#F56565'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-7xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">📊 Advanced Financial Analytics</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Income</div>
            <div className="text-2xl font-bold text-blue-600">₹{analytics.metrics.income.toLocaleString()}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Expenses</div>
            <div className="text-2xl font-bold text-red-600">₹{analytics.metrics.expenses.toLocaleString()}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Net Worth</div>
            <div className={`text-2xl font-bold ${analytics.metrics.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{analytics.metrics.netWorth.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Savings Rate</div>
            <div className={`text-2xl font-bold ${analytics.metrics.savingsRate >= 20 ? 'text-green-600' : analytics.metrics.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {analytics.metrics.savingsRate}%
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Expenses by Category</h4>
          <div className="h-80">
            <Pie
              data={pieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 14 } } },
                  title: { display: false },
                },
              }}
            />
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Savings Rate</h4>
          <div className="h-80">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 14 } } },
                  title: { display: false },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Income vs Expenses</h4>
          <div className="h-80">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 14 } } },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Amount (₹)' } },
                  x: { title: { display: true, text: 'Date' } },
                },
              }}
            />
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h4 className="text-xl font-semibold mb-4 text-gray-700">6-Month Trend</h4>
          <div className="h-80">
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 14 } } },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Amount (₹)' } },
                  x: { title: { display: true, text: 'Month' } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Financial Insights */}
      {analytics && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">💡 Financial Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">📈 Performance Analysis</h4>
              <ul className="space-y-2 text-sm">
                {analytics.metrics.savingsRate >= 20 && (
                  <li className="text-green-700">🎉 Excellent savings rate of {analytics.metrics.savingsRate}%</li>
                )}
                {analytics.metrics.savingsRate < 10 && (
                  <li className="text-yellow-700">⚠️ Low savings rate. Consider reducing expenses</li>
                )}
                {analytics.metrics.netWorth < 0 && (
                  <li className="text-red-700">🚨 Expenses exceed income. Review spending habits</li>
                )}
                {analytics.topSpendingCategories.length > 0 && (
                  <li className="text-blue-700">
                    💰 Top expense: {analytics.topSpendingCategories[0].category} 
                    ({analytics.topSpendingCategories[0].percentage.toFixed(1)}% of total)
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">📊 Category Breakdown</h4>
              <div className="space-y-1 text-sm">
                {analytics.topSpendingCategories.slice(0, 5).map((cat, index) => (
                  <div key={cat.category} className="flex justify-between">
                    <span>{index + 1}. {cat.category}</span>
                    <span className="font-semibold">₹{cat.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}