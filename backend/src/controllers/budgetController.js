import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';

// Get current month's budget
export const getCurrentBudget = async (req, res) => {
  try {
    const currentDate = new Date();
    const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    let budget = await Budget.findOne({ userId: req.user.userId, month });
    
    if (!budget) {
      // Create default budget if none exists
      budget = await Budget.create({
        userId: req.user.userId,
        month,
        year: currentDate.getFullYear(),
        categories: [
          { name: 'Groceries', limit: 500, color: '#10B981' },
          { name: 'Dining', limit: 300, color: '#F59E0B' },
          { name: 'Transport', limit: 200, color: '#3B82F6' },
          { name: 'Shopping', limit: 400, color: '#8B5CF6' },
          { name: 'Other', limit: 300, color: '#6B7280' }
        ],
        totalBudget: 1700
      });
    }

    // Calculate spent amounts for each category
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const transactions = await Transaction.find({
      userId: req.user.userId,
      type: 'expense',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Update spent amounts
    const categorySpent = {};
    transactions.forEach(tx => {
      categorySpent[tx.category] = (categorySpent[tx.category] || 0) + tx.amount;
    });

    budget.categories = budget.categories.map(cat => ({
      ...cat.toObject(),
      spent: categorySpent[cat.name] || 0
    }));

    budget.totalSpent = Object.values(categorySpent).reduce((sum, amount) => sum + amount, 0);
    await budget.save();

    res.json(budget);
  } catch (err) {
    console.error('Error fetching budget:', err);
    res.status(500).json({ error: 'Failed to fetch budget.' });
  }
};

// Update budget
export const updateBudget = async (req, res) => {
  try {
    const { categories, totalBudget } = req.body;
    const currentDate = new Date();
    const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user.userId, month },
      { 
        categories, 
        totalBudget,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json(budget);
  } catch (err) {
    console.error('Error updating budget:', err);
    res.status(500).json({ error: 'Failed to update budget.' });
  }
};

// Get budget analytics
export const getBudgetAnalytics = async (req, res) => {
  try {
    const currentDate = new Date();
    const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const budget = await Budget.findOne({ userId: req.user.userId, month });
    if (!budget) {
      return res.json({
        budgetStatus: 'No budget set',
        overspentCategories: [],
        remainingBudget: 0,
        savingsRate: 0,
        recommendations: ['Set up a monthly budget to track your spending']
      });
    }

    // Calculate analytics
    const overspentCategories = budget.categories.filter(cat => cat.spent > cat.limit);
    const remainingBudget = budget.totalBudget - budget.totalSpent;
    const savingsRate = ((budget.totalBudget - budget.totalSpent) / budget.totalBudget) * 100;

    // Generate recommendations
    const recommendations = [];
    if (overspentCategories.length > 0) {
      recommendations.push(`You've overspent in ${overspentCategories.map(cat => cat.name).join(', ')}`);
    }
    if (remainingBudget < 0) {
      recommendations.push('Consider reducing spending in high-expense categories');
    }
    if (savingsRate > 20) {
      recommendations.push('Great job! You\'re saving more than 20% of your budget');
    }

    res.json({
      budgetStatus: remainingBudget >= 0 ? 'On Track' : 'Over Budget',
      overspentCategories,
      remainingBudget,
      savingsRate: Math.round(savingsRate * 100) / 100,
      recommendations
    });
  } catch (err) {
    console.error('Error fetching budget analytics:', err);
    res.status(500).json({ error: 'Failed to fetch budget analytics.' });
  }
}; 