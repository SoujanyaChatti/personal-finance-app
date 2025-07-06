import Transaction from '../models/Transaction.js';

export const createTransaction = async (req, res) => {
  try {
    const { type, amount, category, date, description } = req.body;
    if (!type || !amount || !category || !date) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const transaction = await Transaction.create({
      userId: req.user.userId,
      type,
      amount,
      category,
      date,
      description,
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
};

export const listTransactions = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.user.userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);
    res.json({ transactions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Transaction not found.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction.' });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.user.userId });
    if (!deleted) return res.status(404).json({ error: 'Transaction not found.' });
    res.json({ message: 'Transaction deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
};

// Get financial analytics
export const getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user.userId;
    
    // Calculate date range
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else if (period === 'week') {
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
      endDate = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000));
    }

    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate metrics
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netWorth = income - expenses;
    const savingsRate = income > 0 ? (netWorth / income) * 100 : 0;

    // Category breakdown
    const categoryBreakdown = {};
    transactions.forEach(t => {
      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = { income: 0, expense: 0 };
      }
      categoryBreakdown[t.category][t.type] += t.amount;
    });

    // Top spending categories
    const topSpendingCategories = Object.entries(categoryBreakdown)
      .map(([category, data]) => ({
        category,
        amount: data.expense,
        percentage: expenses > 0 ? (data.expense / expenses) * 100 : 0
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthTransactions = transactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      );
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income,
        expenses: monthExpenses,
        netWorth: monthIncome - monthExpenses
      });
    }

    res.json({
      period,
      metrics: {
        income,
        expenses,
        netWorth,
        savingsRate: Math.round(savingsRate * 100) / 100
      },
      categoryBreakdown,
      topSpendingCategories,
      monthlyTrend
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
}; 